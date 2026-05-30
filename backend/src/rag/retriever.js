/**
 * src/rag/retriever.js
 * pgvector similarity search using local all-MiniLM-L6-v2 embeddings.
 */

const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const WebSocket = require("ws");

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    realtime: {
      transport: WebSocket,
    },
  },
);

// Lazy-loaded local embedding model
let _embedder = null;

async function getEmbedder() {
  if (!_embedder) {
    const { pipeline } = await import("@xenova/transformers");
    _embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return _embedder;
}

async function embedQuery(text) {
  const embedder = await getEmbedder();
  const result = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(result.data);
}

/**
 * Single retrieval call with optional metadata pre-filters.
 * @param {string}   queryText
 * @param {object}   opts
 * @param {number}   opts.topK       default 5
 * @param {number[]} opts.rounds     filter by applies_to_rounds
 * @param {string}   opts.career     filter by career_relevance
 * @param {string}   opts.topic      lock to single topic
 */
async function retrieve(queryText, opts = {}) {
  const { topK = 5, rounds = null, career = null, topic = null } = opts;
  const embedding = await embedQuery(queryText);

  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: embedding,
    match_count: topK,
    filter_rounds: rounds,
    filter_career: career,
    filter_topic: topic,
  });

  if (error) throw new Error(`Retrieval failed: ${error.message}`);
  return data || [];
}

/**
 * Multi-query retrieval for debrief — runs queries in parallel,
 * deduplicates by id, re-ranks by highest similarity.
 * @param {Array<{query, opts}>} queries
 * @param {number} finalTopK
 */
async function retrieveMulti(queries, finalTopK = 8) {
  const results = await Promise.all(
    queries.map(({ query, opts }) => retrieve(query, opts)),
  );

  const seen = new Map();
  for (const batch of results) {
    for (const chunk of batch) {
      const existing = seen.get(chunk.id);
      if (!existing || chunk.similarity > existing.similarity) {
        seen.set(chunk.id, chunk);
      }
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, finalTopK);
}

/**
 * Format chunks into a clean string for prompt injection.
 */
function formatChunksForPrompt(chunks) {
  if (!chunks?.length) return "(no context retrieved)";
  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] Source: ${c.source} | Topic: ${c.topic}${c.subtopic ? ` > ${c.subtopic}` : ""}\n${c.content}`,
    )
    .join("\n\n---\n\n");
}

module.exports = { retrieve, retrieveMulti, formatChunksForPrompt };
