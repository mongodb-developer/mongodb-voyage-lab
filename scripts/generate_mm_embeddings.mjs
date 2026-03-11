// One-time script to pre-compute multimodal image embeddings for all 100 seeded listings.
// Run: node scripts/generate_mm_embeddings.mjs
// Output: data/multimodal_embeddings.json

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY   = process.env.VOYAGE_API_KEY;
const MODEL     = 'voyage-multimodal-3.5';
const BATCH     = 10;
const OUT       = path.join(__dirname, '..', 'data', 'multimodal_embeddings.json');

if (!API_KEY) { console.error('Set VOYAGE_API_KEY'); process.exit(1); }

// All 100 seeded listing IDs are 10000000–10000099 (see seed.js)
const listings = Array.from({ length: 100 }, (_, i) => ({
  _id: String(10000000 + i),
  url: `https://picsum.photos/seed/${10000000 + i}/800/600`,
}));

const results = [];

for (let i = 0; i < listings.length; i += BATCH) {
  const batch  = listings.slice(i, i + BATCH);
  const inputs = batch.map(l => ({ content: [{ type: 'image_url', image_url: l.url }] }));

  const res = await fetch('https://api.voyageai.com/v1/multimodalembeddings', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body:    JSON.stringify({ inputs, model: MODEL, input_type: 'document' }),
  });

  if (!res.ok) { console.error(await res.text()); process.exit(1); }

  const json = await res.json();
  json.data.forEach((d, j) => results.push({ _id: batch[j]._id, embedding_mm: d.embedding }));
  console.log(`${i + batch.length}/100`);
}

fs.writeFileSync(OUT, JSON.stringify(results));
console.log(`Saved ${results.length} embeddings to ${OUT}`);
