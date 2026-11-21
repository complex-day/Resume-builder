-- ==============================================================================
-- 001_init_truth_vault.sql
-- Production Supabase PostgreSQL + pgvector Migration for Master Truth Vault
-- ==============================================================================

-- 1. Enable the pgvector extension to store project embeddings for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Master Truth Vaults table
-- Holds the authoritative, immutable-by-default JSON resume & experience schema.
CREATE TABLE IF NOT EXISTS truth_vaults (
    user_id TEXT PRIMARY KEY,
    vault_data JSONB NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Project Embeddings table
-- Holds 768-dimensional vector embeddings (Google Gemini text-embedding-004 / modern models)
-- for fast semantic similarity matching between resume projects and Job Descriptions (JDs).
CREATE TABLE IF NOT EXISTS project_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES truth_vaults(user_id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    project_text TEXT NOT NULL,
    embedding VECTOR(768) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_project UNIQUE (user_id, project_id)
);

-- 4. Cosine similarity index using HNSW (Hierarchical Navigable Small World)
-- HNSW offers high recall and low latency for vector retrieval.
CREATE INDEX IF NOT EXISTS idx_project_embeddings_hnsw 
ON project_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Index on user_id for high-concurrency multi-tenant query isolation
CREATE INDEX IF NOT EXISTS idx_project_embeddings_user_id 
ON project_embeddings(user_id);

-- 5. Trigger to automatically update updated_at on truth_vaults modifications
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_truth_vaults_updated_at ON truth_vaults;
CREATE TRIGGER trg_truth_vaults_updated_at
BEFORE UPDATE ON truth_vaults
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
