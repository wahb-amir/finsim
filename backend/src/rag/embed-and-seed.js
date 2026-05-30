/**
 * embed-and-seed.js
 * Run: node src/rag/embed-and-seed.js --fresh
 */

require("dotenv").config();
const fs   = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const CHUNKS_PATH = path.join(__dirname, "chunks.json");   // same dir as this script

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BATCH_SIZE   = 20;
const INSERT_BATCH = 50;

const args      = process.argv.slice(2);
const FRESH     = args.includes("--fresh");
const DRY_RUN   = args.includes("--dry-run");
const topicArg  = args.find((a) => a.startsWith("--topic="));
const FILTER_TOPIC = topicArg ? topicArg.split("=")[1] : null;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

let _embedder = null;
async function getEmbedder() {
  if (!_embedder) {
    process.stdout.write("🔧 Loading embedding model (first run downloads ~25MB)... ");
    const { pipeline } = await import("@xenova/transformers");
    _embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("✓");
  }
  return _embedder;
}

async function embedBatch(texts) {
  const embedder = await getEmbedder();
  const results  = await Promise.all(
    texts.map((t) => embedder(t, { pooling: "mean", normalize: true }))
  );
  return results.map((r) => Array.from(r.data));
}

async function main() {
  if (!fs.existsSync(CHUNKS_PATH)) {
    console.error("❌ chunks.json not found. Run chunk-knowledge.js first.");
    process.exit(1);
  }

  let chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, "utf-8"));
  console.log(`📦 Loaded ${chunks.length} total chunks`);

  if (FILTER_TOPIC) {
    chunks = chunks.filter((c) => c.topic === FILTER_TOPIC);
    console.log(`🔍 Filtered to topic "${FILTER_TOPIC}": ${chunks.length} chunks`);
  }

  if (!chunks.length) { console.log("⚠️  No chunks to process."); return; }

  if (FRESH && !DRY_RUN) {
    console.log("🗑️  Truncating knowledge_chunks...");
    const { error } = await supabase.rpc("truncate_chunks");
    if (error) { console.error("❌ Truncate failed:", error.message); process.exit(1); }
    console.log("   ✓ Table cleared");
  }

  console.log(`\n🔢 Embedding ${chunks.length} chunks in batches of ${BATCH_SIZE}...`);
  const batches  = chunk(chunks, BATCH_SIZE);
  const embedded = [];

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    process.stdout.write(`   Batch ${b + 1}/${batches.length} (${batch.length} chunks)... `);
    const embeddings = await embedBatch(batch.map((c) => c.content));
    batch.forEach((c, idx) => embedded.push({ ...c, embedding: embeddings[idx] }));
    console.log("✓");
  }

  console.log(`\n✅ All ${embedded.length} chunks embedded`);
  if (DRY_RUN) { console.log("🏃 Dry run — skipping insert"); return; }

  console.log(`\n💾 Inserting into Supabase in batches of ${INSERT_BATCH}...`);
  const insertBatches = chunk(embedded, INSERT_BATCH);
  let totalInserted   = 0;

  for (let b = 0; b < insertBatches.length; b++) {
    const rows = insertBatches[b].map((c) => ({
      content:           c.content,
      embedding:         c.embedding,
      source:            c.source,
      topic:             c.topic,
      subtopic:          c.subtopic          || null,
      difficulty:        c.difficulty        || "foundational",
      applies_to_rounds: c.applies_to_rounds || null,
      career_relevance:  c.career_relevance  || ["all"],
      last_updated:      c.last_updated      || null,
    }));

    process.stdout.write(`   Insert batch ${b + 1}/${insertBatches.length}... `);
    const { error } = await supabase.from("knowledge_chunks").insert(rows);
    if (error) { console.error(`\n❌ Insert failed:`, error.message); process.exit(1); }
    totalInserted += rows.length;
    console.log(`✓ (${totalInserted}/${embedded.length})`);
  }

  const { count } = await supabase
    .from("knowledge_chunks")
    .select("*", { count: "exact", head: true });

  console.log(`\n✅ Seeding complete. Total rows in knowledge_chunks: ${count}`);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });