/**
 * retriever.js
 *
 * pgvector similarity search with metadata pre-filtering.
 * Used by both advisor.js (single query) and debrief.js (multi-query merge).
 */

import { pipeline } from "@xenova/transformers";
import { createClient } from "@supabase/supabase-js";

let _embedder = null;
async function getEmbedder() {
  if (!_embedder) _embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  return _embedder;
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Embed a query string ──────────────────────────────────────────────────────

async function embedQuery(text) {
  const embedder = await getEmbedder();
  const result = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(result.data);
}

// ── Single retrieval call ─────────────────────────────────────────────────────
/**
 * @param {string}   queryText         - The query to embed and search
 * @param {object}   opts
 * @param {number}   opts.topK         - Number of chunks to return (default 5)
 * @param {number[]} opts.rounds       - Filter by applies_to_rounds (null = no filter)
 * @param {string}   opts.career       - Filter by career_relevance label (null = no filter)
 * @param {string}   opts.topic        - Lock to a single topic (null = no filter)
 *
 * @returns {Array<{id, content, source, topic, subtopic, difficulty, similarity}>}
 */
export async function retrieve(queryText, opts = {}) {
  const { topK = 5, rounds = null, career = null, topic = null } = opts;

  const embedding = await embedQuery(queryText);

  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding:  embedding,
    match_count:      topK,
    filter_rounds:    rounds,
    filter_career:    career,
    filter_topic:     topic,
  });

  if (error) {
    console.error("[retriever] Supabase RPC error:", error.message);
    throw new Error(`Retrieval failed: ${error.message}`);
  }

  return data || [];
}

// ── Multi-query retrieval (for debrief) ───────────────────────────────────────
/**
 * Runs multiple queries in parallel, merges results, deduplicates by id,
 * then re-sorts by highest similarity across all queries.
 *
 * @param {Array<{query, opts}>} queries
 * @param {number} finalTopK  - How many unique chunks to return after merge
 *
 * @returns {Array} deduplicated, re-ranked chunks
 */
export async function retrieveMulti(queries, finalTopK = 8) {
  const results = await Promise.all(
    queries.map(({ query, opts }) => retrieve(query, opts))
  );

  // Flatten + deduplicate by id (keep highest similarity score on collision)
  const seen = new Map();
  for (const batch of results) {
    for (const chunk of batch) {
      const existing = seen.get(chunk.id);
      if (!existing || chunk.similarity > existing.similarity) {
        seen.set(chunk.id, chunk);
      }
    }
  }

  // Sort by similarity descending and slice to finalTopK
  return Array.from(seen.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, finalTopK);
}

// ── Format chunks as a context block for prompt injection ─────────────────────
/**
 * Converts retrieved chunks into a clean string for prompt injection.
 * Each chunk is numbered and includes source/topic metadata for traceability.
 */
export function formatChunksForPrompt(chunks) {
  if (!chunks || chunks.length === 0) return "(no context retrieved)";
  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] Source: ${c.source} | Topic: ${c.topic}${c.subtopic ? ` > ${c.subtopic}` : ""}\n${c.content}`
    )
    .join("\n\n---\n\n");
}