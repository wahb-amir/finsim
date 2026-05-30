-- ============================================================
-- FinSim RAG — pgvector setup
-- Run this in Supabase SQL editor or via `supabase db push`
-- ============================================================

-- 1. Enable the pgvector extension
create extension if not exists vector with schema extensions;

-- 2. Knowledge chunks table
create table if not exists knowledge_chunks (
  id           uuid primary key default gen_random_uuid(),
  content      text not null,
  embedding    vector(384),            -- all-MiniLM-L6-v2 local dims

  -- ── Metadata (used for pre-filtering before vector search) ──
  source       text not null,         -- 'cfpb' | 'irs' | 'investopedia' | 'finsim-internal'
  topic        text not null,         -- 'credit_scores' | 'compound_interest' | etc.
  subtopic     text,                  -- 'utilization_ratio' | 'minimum_payment_spiral' | etc.
  difficulty   text default 'foundational', -- 'foundational' | 'intermediate' | 'advanced'
  applies_to_rounds  integer[],       -- e.g. [2, 3, 4] — null means all rounds
  career_relevance   text[],          -- ['all'] or ['freelancer', 'small-business']
  last_updated text,                  -- 'YYYY-MM' for maintenance tracking

  created_at   timestamptz default now()
);

-- 3. Index for fast vector search (IVFFlat — good up to ~1M vectors)
--    Lists = sqrt(row_count). Start at 100 for a small knowledge base.
create index if not exists knowledge_chunks_embedding_idx
  on knowledge_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 4. Indexes on metadata columns used in pre-filters
create index if not exists knowledge_chunks_topic_idx       on knowledge_chunks (topic);
create index if not exists knowledge_chunks_source_idx      on knowledge_chunks (source);
create index if not exists knowledge_chunks_difficulty_idx  on knowledge_chunks (difficulty);

-- 5. RPC function — filtered cosine similarity search
--    Called from retriever.js via supabase.rpc('match_chunks', {...})
--
--    Parameters:
--      query_embedding  — the embedded query vector
--      match_count      — how many chunks to return (top-k)
--      filter_rounds    — optional int[] to pre-filter by round relevance
--      filter_career    — optional text to pre-filter by career label
--      filter_topic     — optional text to restrict to one topic
--
create or replace function match_chunks(
  query_embedding    vector(384),
  match_count        int      default 5,
  filter_rounds      int[]    default null,
  filter_career      text     default null,
  filter_topic       text     default null
)
returns table (
  id               uuid,
  content          text,
  source           text,
  topic            text,
  subtopic         text,
  difficulty       text,
  applies_to_rounds integer[],
  career_relevance  text[],
  similarity        float
)
language plpgsql
as $$
begin
  return query
  select
    kc.id,
    kc.content,
    kc.source,
    kc.topic,
    kc.subtopic,
    kc.difficulty,
    kc.applies_to_rounds,
    kc.career_relevance,
    1 - (kc.embedding <=> query_embedding) as similarity
  from knowledge_chunks kc
  where
    -- Pre-filter: round relevance (null applies_to_rounds means valid for all rounds)
    (
      filter_rounds is null
      or kc.applies_to_rounds is null
      or kc.applies_to_rounds && filter_rounds
    )
    -- Pre-filter: career relevance
    and (
      filter_career is null
      or kc.career_relevance is null
      or kc.career_relevance && array['all']
      or kc.career_relevance && array[filter_career]
    )
    -- Pre-filter: topic lock (for debrief targeted queries)
    and (
      filter_topic is null
      or kc.topic = filter_topic
    )
  order by kc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 6. Helper: delete all chunks (useful during dev re-seeding)
create or replace function truncate_chunks()
returns void language sql as $$
  truncate table knowledge_chunks;
$$;