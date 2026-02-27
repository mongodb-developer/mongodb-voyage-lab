# MongoDB × VoyageAI Lab

Hands-on TypeScript notebooks exploring VoyageAI's embedding and reranking capabilities with MongoDB Atlas Vector Search.

## Labs

| # | Notebook | What you'll learn |
|---|----------|-------------------|
| 01 | Shared Embedding Spaces | Index with `voyage-4-large`, query with `voyage-4-lite` — no re-indexing needed |
| 02 | Auto-Embedding | MongoDB generates and maintains embeddings automatically; zero embedding code |
| 03 | Multi-Modal Embeddings | Embed images and text into the same vector space; cross-modal search |
| 04 | Re-Ranking | Two-stage pipeline: `$vectorSearch` candidates → `rerank-2.5` precision |
| 05 | Contextualized Embeddings | `voyage-context-3` captures full-document context per chunk |
| 06 | Hybrid Search | `$rankFusion` merges semantic and keyword pipelines |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [VS Code](https://code.visualstudio.com/) with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers), **or** a [GitHub Codespace](https://github.com/features/codespaces)
- A [VoyageAI API key](https://dash.voyageai.com) *(free tier is enough for all notebooks)*

> **Notebook 02 only:** Auto-embedding requires your key at container startup.
> Set `VOYAGE_API_KEY` as a [Codespace secret](https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-features-to-a-devcontainer-file) (GitHub → Settings → Codespaces → Secrets) before opening the Codespace.
> For notebooks 01 and 03–06, paste your key directly in the setup cell.

## Getting started

**Option A — GitHub Codespace (recommended)**

1. Click **Code → Codespaces → Create codespace on main**
2. Wait for the container to build and seed the database (~2 min)
3. Open any notebook in `lab/` and run the cells top to bottom

**Option B — Local dev container**

```bash
git clone https://github.com/mongodb-developer/mongodb-voyage-lab
code mongodb-voyage-lab
# VS Code will prompt: "Reopen in Container" → click it
```

## What's inside the container

| Component | Details |
|-----------|---------|
| MongoDB | `mongodb/mongodb-atlas-local:8.2.0` — includes Atlas Vector Search and `mongot` |
| Jupyter | TypeScript kernel via [tslab](https://github.com/yunabe/tslab) |
| Seed data | 100 Airbnb-style listings seeded automatically on first start |

## Project structure

```
lab/
  01_shared_embedding_spaces.ipynb
  02_auto_embedding.ipynb
  03_multimodal_embeddings.ipynb
  04_reranking.ipynb
  05_contextualized_embeddings.ipynb
  06_hybrid_search.ipynb
.devcontainer/
  devcontainer.json
  docker-compose.yml
  Dockerfile
  seed.js
```

## Resources

- [VoyageAI documentation](https://docs.voyageai.com)
- [MongoDB Atlas Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/)
- [Auto-embedding with MongoDB](https://www.mongodb.com/docs/atlas/atlas-vector-search/crud-embeddings/create-embeddings-automatic/)
