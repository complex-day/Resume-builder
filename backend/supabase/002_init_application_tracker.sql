-- ==============================================================================
-- 002_init_application_tracker.sql
-- Production Supabase PostgreSQL Migration for Application Tracking & Analytics
-- ==============================================================================

-- 1. Applications Table
-- Persists every tailored resume submission, target portal, ATS score, and lifecycle outcome.
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES truth_vaults(user_id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    detected_portal TEXT NOT NULL DEFAULT 'unknown',
    source_url TEXT,
    ats_score INTEGER NOT NULL CHECK (ats_score >= 0 AND ats_score <= 100),
    style_tag TEXT NOT NULL DEFAULT 'metrics_heavy' CHECK (
        style_tag IN ('metrics_heavy', 'project_first', 'skills_first', 'concise_startup', 'formal_govt')
    ),
    selected_project_ids TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'applied' CHECK (
        status IN ('saved', 'applied', 'shortlisted', 'interview', 'rejected', 'offer')
    ),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Performance Indexes
-- Optimize filtering by user lifecycle status, style performance, and chronological sorting
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_user_style ON applications(user_id, style_tag);
CREATE INDEX IF NOT EXISTS idx_applications_user_created ON applications(user_id, created_at DESC);

-- 3. Trigger to automatically update updated_at on application modifications
DROP TRIGGER IF EXISTS trg_applications_updated_at ON applications;
CREATE TRIGGER trg_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
