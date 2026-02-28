# Lab Context — mongodb-developer labs

This file is the single source of truth for creating new labs in the `mongodb-developer` org that share this infrastructure. Provide this file in full to Claude at the start of every new lab session.

---

## What stays identical across all labs

- `.devcontainer/` — copy verbatim, zero changes
- `data/sample.json` — copy verbatim (same Airbnb-style listings domain)
- `.devcontainer/seed.js` — copy verbatim (same seed logic and lookup tables)
- `package.json` — copy verbatim
- `tsconfig.json` — copy verbatim
- `.vscode/settings.json` — copy verbatim
- `.gitignore` — copy verbatim

**What changes:** the notebooks in `lab/`, the `README.md` intro, and the repo name.

---

## Infrastructure files (copy verbatim)

### `.devcontainer/Dockerfile`
```dockerfile
FROM jupyter/base-notebook:latest

RUN mamba install -y -c conda-forge nodejs=20 git \
    && mamba clean --all -y

RUN npm install -g tslab \
    && tslab install --python=python3
```

### `.devcontainer/docker-compose.yml`
```yaml
services:
  lab-runner:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ../..:/workspaces:cached
    depends_on:
      mongodb:
        condition: service_healthy
    user: "1000:100"
    command: sleep infinity
    network_mode: service:mongodb
    environment:
      - MONGODB_URI=mongodb://admin:mongodb@localhost:27017/?directConnection=true
      - NODE_PATH=/workspaces/<REPO_NAME>/node_modules

  mongodb:
    image: mongodb/mongodb-atlas-local:8.2.0
    restart: unless-stopped
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGODB_INITDB_ROOT_USERNAME=admin
      - MONGODB_INITDB_ROOT_PASSWORD=mongodb
      - INDEXING_VOYAGE_AI_API_KEY=${VOYAGE_API_KEY}
      - QUERY_VOYAGE_AI_API_KEY=${VOYAGE_API_KEY}
    ports:
      - "27017:27017"
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping').ok"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 20s

volumes:
  mongodb_data:
```
> Replace `<REPO_NAME>` with the actual repository folder name.

### `.devcontainer/devcontainer.json`
```json
{
    "name": "<Lab Display Name>",
    "dockerComposeFile": "docker-compose.yml",
    "service": "lab-runner",
    "workspaceFolder": "/workspaces/${localWorkspaceFolderBasename}",
    "forwardPorts": [8888, 27017],
    "hostRequirements": {
        "cpus": 4
    },
    "containerEnv": {
        "MONGODB_URI": "mongodb://admin:mongodb@localhost:27017/",
        "NODE_PATH": "/workspaces/${localWorkspaceFolderBasename}/node_modules",
        "VOYAGE_API_KEY": "${localEnv:VOYAGE_API_KEY}"
    },
    "postCreateCommand": "npm install && node .devcontainer/seed.js",
    "customizations": {
        "vscode": {
            "extensions": [
                "ms-toolsai.jupyter",
                "mongodb.mongodb-vscode"
            ]
        }
    }
}
```

### `package.json`
```json
{
  "name": "<repo-name>",
  "version": "1.0.0",
  "description": "<one-line description>",
  "dependencies": {
    "mongodb": "^6.12.0"
  },
  "devDependencies": {
    "@types/node": "^20.17.0",
    "typescript": "^5.5.3"
  },
  "private": true
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

### `.vscode/settings.json`
```json
{
    "mdb.presetConnections": [
        {
            "name": "Local MongoDB Atlas",
            "connectionString": "mongodb://admin:mongodb@localhost:27017/?directConnection=true"
        }
    ],
    "mdb.showOverviewPageAfterInstall": false,
    "workbench.editorAssociations": {
        "*.ipynb": "jupyter-notebook"
    }
}
```

### `.gitignore`
```
/tmp
/out-tsc

/node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*
/.pnp
.pnp.js

.vscode/*
!.vscode/settings.json
.idea

/assets
/notebooks
```

---

## Notebook structure

### Kernel metadata (every `.ipynb` must have this)
```json
"metadata": {
  "kernelspec": {
    "display_name": "TypeScript",
    "language": "typescript",
    "name": "tslab"
  },
  "language_info": {
    "codemirror_mode": { "mode": "typescript", "typescript": true },
    "file_extension": ".ts",
    "mimetype": "text/typescript",
    "name": "typescript",
    "version": "3.7.2"
  }
}
```

### Setup cell (first code cell in every notebook)
```typescript
import { MongoClient } from 'mongodb';

// ← Paste your VoyageAI API key here (get one at https://dash.voyageai.com)
const VOYAGE_API_KEY = 'pa-...';

const client = new MongoClient(process.env.MONGODB_URI!);
await client.connect();
const db  = client.db('voyage_lab');
const col = db.collection<{ _id: string; [key: string]: unknown }>('listings');

console.log('Connected. Listings:', await col.countDocuments());
```

### Cleanup cell (last code cell in every notebook)
```typescript
await client.close();
console.log('Done.');
```
If the notebook inserted documents, delete them first:
```typescript
await col.deleteMany({ _id: { $in: insertedIds } });
await client.close();
console.log('Done.');
```

### Vector search index creation + polling pattern
```typescript
try {
  await col.dropSearchIndex(INDEX_NAME);
  await new Promise(r => setTimeout(r, 2000));
} catch { /* didn't exist */ }

await col.createSearchIndex({
  name: INDEX_NAME,
  type: 'vectorSearch',
  definition: {
    fields: [
      { type: 'vector', path: 'embedding', numDimensions: 1024, similarity: 'cosine' },
      // add { type: 'filter', path: 'fieldName' } entries if pre-filtering is needed
    ],
  },
});

console.log('Waiting for index to be READY...');
for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 2000));
  const [idx] = await col.listSearchIndexes(INDEX_NAME).toArray();
  console.log(' status:', idx?.status);
  if (idx?.status === 'READY') break;
}
```

### $vectorSearch aggregation pattern
```typescript
const results = await col.aggregate([
  {
    $vectorSearch: {
      index:         INDEX_NAME,
      path:          'embedding',
      queryVector:   qVec,          // number[]
      numCandidates: 50,
      limit:         5,
      // filter: { price: { $lte: 200 } }   // optional, requires filter field in index
    },
  },
  {
    $project: {
      name:  1,
      price: 1,
      score: { $meta: 'vectorSearchScore' },
    },
  },
]).toArray();
```

### Loading data from JSON files
External data lives in `data/`. Never put document arrays inline in notebook cells.
```typescript
import fs from 'fs';
import path from 'path';

function loadData(filename: string) {
  const filePath = path.join(process.cwd(), 'data', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as { _id: string; [key: string]: unknown }[];
}

const docs = loadData('my_data.json');
```

---

## VoyageAI API reference

### Models
| Use | Model |
|-----|-------|
| Document embeddings (index) | `voyage-4-large` |
| Query embeddings | `voyage-4-lite` |
| Multimodal | `voyage-multimodal-3.5` |
| Contextualized chunks | `voyage-context-3` |
| Reranker | `rerank-2.5` |
| Embedding dimensions | 1024 |

All `voyage-4-*` models share one embedding space — index with large, query with lite, no re-indexing needed.

### Embeddings endpoint
```typescript
async function embed(texts: string[], model: string, inputType: 'document' | 'query'): Promise<number[][]> {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${VOYAGE_API_KEY}` },
    body: JSON.stringify({ input: texts, model, input_type: inputType }),
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json() as { data: { embedding: number[] }[] };
  return json.data.map(d => d.embedding);
}
```

### Multimodal embeddings endpoint
```typescript
type ContentItem = { type: 'text'; text: string } | { type: 'image_url'; url: string };

async function embedMultimodal(inputs: ContentItem[][], inputType: 'document' | 'query' = 'document'): Promise<number[][]> {
  const res = await fetch('https://api.voyageai.com/v1/multimodalembeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${VOYAGE_API_KEY}` },
    body: JSON.stringify({ inputs, model: 'voyage-multimodal-3.5', input_type: inputType }),
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json() as { data: { embedding: number[] }[] };
  return json.data.map(d => d.embedding);
}
```

### Contextualized embeddings endpoint
```typescript
// All chunks from ONE document go in together — the model injects full-doc context per chunk
async function embedContextualized(chunks: string[], inputType: 'document' | 'query'): Promise<number[][]> {
  const res = await fetch('https://api.voyageai.com/v1/contextualized_embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${VOYAGE_API_KEY}` },
    body: JSON.stringify({ inputs: [chunks], model: 'voyage-context-3', input_type: inputType }),
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json() as { results: { embeddings: number[][] }[] };
  return json.results[0].embeddings;
}
```

### Rerank endpoint
```typescript
async function rerank(query: string, documents: string[], topK?: number) {
  const res = await fetch('https://api.voyageai.com/v1/rerank', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${VOYAGE_API_KEY}` },
    body: JSON.stringify({ query, documents, model: 'rerank-2.5', top_k: topK, return_documents: true }),
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json() as { data: { index: number; relevance_score: number; document: string }[] };
  return json.data;
}
```

---

## Hard rules — non-negotiable

1. **MongoDB first.** All search, retrieval, and aggregation must go through MongoDB (`$vectorSearch`, `$rankFusion`, `$search`). Never compute similarity or rank in-process with JavaScript.
2. **One concept per notebook.** Each notebook demonstrates exactly one capability. Do not combine unrelated features (e.g. reranking + chat history, hybrid search + contextualized embeddings).
3. **No step numbering in headings.** Headings are plain descriptive text (`## Query with voyage-4-lite`), not `## Step 3 — Query with voyage-4-lite`.
4. **No inline data arrays.** Documents to insert live in `data/*.json` files and are loaded with `fs.readFileSync`. Never define a `const docs = [{ _id: ... }, ...]` array inside a notebook cell.
5. **API key in setup cell.** Every notebook (except notebook 02 — auto-embedding) has `const VOYAGE_API_KEY = 'pa-...';` as the first line of the setup cell. The auto-embedding notebook gets the key from the Codespace secret via `mongot` — no key cell.
6. **No `// ── section ──` banners.** No decorative comment separators.
7. **No `// OBSERVE:` comments.** Remove trailing observation notes from code cells.

---

## Notebook 02 (auto-embedding) — special case

Auto-embedding is native to MongoDB 8.2+ via `mongot`. It requires no API calls in the notebook.

Index definition:
```typescript
await col.createSearchIndex({
  name: INDEX_NAME,
  type: 'vectorSearch',
  definition: {
    fields: [
      { type: 'autoEmbed', modality: 'text', path: 'description', model: 'voyage-4' },
    ],
  },
});
```

Query (no `queryVector`, no embed call):
```typescript
{ $vectorSearch: { index: INDEX_NAME, path: 'description', query: { text: 'your query' }, model: 'voyage-4', numCandidates: 50, limit: 5 } }
```

The key is injected via `INDEXING_VOYAGE_AI_API_KEY` / `QUERY_VOYAGE_AI_API_KEY` on the `mongodb` container in docker-compose, sourced from `${VOYAGE_API_KEY}` which comes from the student's Codespace secret. Add this note to the notebook header:
> Before you start: set `VOYAGE_API_KEY` as a GitHub Codespace secret (github.com → Settings → Codespaces → Secrets). Each student uses their own key.

---

## Listings collection schema (from seed.js)

Key fields available for queries and filters:

```
_id              String   (numeric string, e.g. "10000042")
name             String   e.g. "Apartment in Toronto — 2BR Entire home/apt"
summary          String   short paragraph
description      String   longer paragraph (summary + detail, used for embedding)
property_type    String   Apartment | House | Loft | Condo | Villa | Studio | Townhouse | Cottage
room_type        String   Entire home/apt | Private room | Shared room
bedrooms         Number
beds             Number
bathrooms        Number
accommodates     Number
price            Number   USD per night
amenities        String[]
images.picture_url  String  https://picsum.photos/seed/<id>/800/600
host.host_name   String
host.host_is_superhost  Boolean
address.city     String
address.country  String
address.country_code  String (ISO 2-letter)
address.market   String
address.location GeoJSON Point
review_scores    Object   (accuracy, cleanliness, checkin, communication, location, value, rating)
reviews          Array    (embedded, up to 5 per listing)
```

Cities covered: London, Paris, Barcelona, Amsterdam, Lisbon, Porto, Berlin, Rome (Europe) · New York, Toronto, Vancouver, Montreal, Calgary (North America) · Buenos Aires, São Paulo, Rio de Janeiro, Bogotá, Medellín, Santiago, Lima (South America) · Tokyo, Sydney (Asia-Pacific).
