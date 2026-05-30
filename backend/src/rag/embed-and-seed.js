/**
 * embed-and-seed.js
 *
 * Reads chunks.json, embeds each chunk via OpenAI text-embedding-3-small,
 * then upserts all vectors into Supabase pgvector in batches.
 *
 * Run ONCE after chunking: node src/scripts/embed-and-seed.js
 * Re-run when knowledge base updates (use --fresh to truncate first).
 *
 * Flags:
 *   --fresh       Truncate the knowledge_chunks table before seeding
 *   --dry-run     Embed but don't write to Supabase (for testing)
 *   --topic=<x>   Only seed chunks matching this topic
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pipeline } from "@xenova/transformers";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHUNKS_PATH = path.join(__dirname, "../../chunks.json");

// ── Clients ───────────────────────────────────────────────────────────────────
// Local model — downloads ~25MB on first run, cached automatically
let _embedder = null;
async function getEmbedder() {
  if (!_embedder) {
    process.stdout.write("🔧 Loading embedding model (first run downloads ~25MB)... ");
    _embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("✓");
  }
  return _embedder;
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Config ────────────────────────────────────────────────────────────────────
const BATCH_SIZE = 20;        // chunks per local embed batch
const INSERT_BATCH = 50;      // rows per Supabase insert
const DELAY_MS = 0;           // no API throttle needed for local model

// ── Args ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const FRESH    = args.includes("--fresh");
const DRY_RUN  = args.includes("--dry-run");
const topicArg = args.find((a) => a.startsWith("--topic="));
const FILTER_TOPIC = topicArg ? topicArg.split("=")[1] : null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function embedBatch(texts) {
  const embedder = await getEmbedder();
  const results = await Promise.all(
    texts.map((t) => embedder(t, { pooling: "mean", normalize: true }))
  );
  return results.map((r) => Array.from(r.data));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Load chunks
  if (!fs.existsSync(CHUNKS_PATH)) {
    console.error("❌ chunks.json not found. Run chunk-knowledge.js first.");
    process.exit(1);
  }

  let chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, "utf-8"));
  console.log(`📦 Loaded ${chunks.length} total chunks`);

  // 2. Apply topic filter if provided
  if (FILTER_TOPIC) {
    chunks = chunks.filter((c) => c.topic === FILTER_TOPIC);
    console.log(`🔍 Filtered to topic "${FILTER_TOPIC}": ${chunks.length} chunks`);
  }

  if (chunks.length === 0) {
    console.log("⚠️  No chunks to process. Exiting.");
    return;
  }

  // 3. Optionally truncate table
  if (FRESH && !DRY_RUN) {
    console.log("🗑️  Truncating knowledge_chunks table...");
    const { error } = await supabase.rpc("truncate_chunks");
    if (error) {
      console.error("❌ Truncate failed:", error.message);
      process.exit(1);
    }
    console.log("   ✓ Table cleared");
  }

  // 4. Embed in batches
  console.log(`\n🔢 Embedding ${chunks.length} chunks in batches of ${BATCH_SIZE}...`);
  const batches = chunk(chunks, BATCH_SIZE);
  const embedded = [];

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    const texts = batch.map((c) => c.content);
    process.stdout.write(`   Batch ${b + 1}/${batches.length} (${texts.length} chunks)... `);

    try {
      const embeddings = await embedBatch(texts);
      batch.forEach((c, idx) => embedded.push({ ...c, embedding: embeddings[idx] }));
      console.log("✓");
    } catch (err) {
      console.error(`\n❌ Embedding failed on batch ${b + 1}:`, err.message);
      process.exit(1);
    }

    if (b < batches.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\n✅ All ${embedded.length} chunks embedded`);

  if (DRY_RUN) {
    console.log("🏃 Dry run — skipping Supabase insert");
    return;
  }

  // 5. Insert into Supabase in batches
  console.log(`\n💾 Inserting into Supabase in batches of ${INSERT_BATCH}...`);
  const insertBatches = chunk(embedded, INSERT_BATCH);
  let totalInserted = 0;

  for (let b = 0; b < insertBatches.length; b++) {
    const rows = insertBatches[b].map((c) => ({
      content:           c.content,
      embedding:         c.embedding,
      source:            c.source,
      topic:             c.topic,
      subtopic:          c.subtopic   || null,
      difficulty:        c.difficulty || "foundational",
      applies_to_rounds: c.applies_to_rounds || null,
      career_relevance:  c.career_relevance  || ["all"],
      last_updated:      c.last_updated      || null,
    }));

    process.stdout.write(`   Insert batch ${b + 1}/${insertBatches.length}... `);
    const { error } = await supabase.from("knowledge_chunks").insert(rows);

    if (error) {
      console.error(`\n❌ Insert failed on batch ${b + 1}:`, error.message);
      process.exit(1);
    }

    totalInserted += rows.length;
    console.log(`✓ (${totalInserted}/${embedded.length})`);
  }

  // 6. Verify
  const { count, error: countErr } = await supabase
    .from("knowledge_chunks")
    .select("*", { count: "exact", head: true });

  if (countErr) {
    console.warn("⚠️  Could not verify count:", countErr.message);
  } else {
    console.log(`\n✅ Seeding complete. Total rows in knowledge_chunks: ${count}`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});