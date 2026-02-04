-- AutoFix Platform Improvements
-- Migration: 002_autofix_improvements.sql

-- =====================================================
-- 1. Add GitHub repo ID to Vercel projects
-- =====================================================
-- This allows us to pass repoId to Vercel deployment API
ALTER TABLE vercel_projects ADD COLUMN IF NOT EXISTS github_repo_id BIGINT;

-- =====================================================
-- 2. Add error classification to failure records
-- =====================================================
-- Track whether errors are fixable by AI or require user intervention
ALTER TABLE failure_records ADD COLUMN IF NOT EXISTS error_classification VARCHAR(50);
ALTER TABLE failure_records ADD COLUMN IF NOT EXISTS is_fixable BOOLEAN DEFAULT true;
ALTER TABLE failure_records ADD COLUMN IF NOT EXISTS user_notified BOOLEAN DEFAULT false;

-- =====================================================
-- 3. Add indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_failure_records_fixable ON failure_records(is_fixable);
CREATE INDEX IF NOT EXISTS idx_failure_records_classification ON failure_records(error_classification);
CREATE INDEX IF NOT EXISTS idx_vercel_projects_github_repo_id ON vercel_projects(github_repo_id);

-- =====================================================
-- 4. Add Vercel team token storage (optional)
-- =====================================================
-- If users want to use their own Vercel account instead of a shared one
ALTER TABLE users ADD COLUMN IF NOT EXISTS vercel_team_token TEXT;

COMMENT ON COLUMN vercel_projects.github_repo_id IS 'GitHub repository ID for Vercel deployment API';
COMMENT ON COLUMN failure_records.error_classification IS 'Type of error: code_error, dependency_error, build_config_error, environment_error, infrastructure_error';
COMMENT ON COLUMN failure_records.is_fixable IS 'Whether this error can be fixed by AI code changes';
COMMENT ON COLUMN failure_records.user_notified IS 'Whether user has been notified about this unfixable error';
