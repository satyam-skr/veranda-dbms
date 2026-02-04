-- Migration: AutoFix Loop Prevention
-- Adds project-level locking, unfixable error state, and manual retry tracking

-- 1. Add is_fixing flag to vercel_projects for atomic locking
ALTER TABLE vercel_projects ADD COLUMN IF NOT EXISTS is_fixing BOOLEAN DEFAULT false;

-- 2. Add new terminal state for unfixable errors (env/infrastructure issues)
-- Note: In PostgreSQL, adding a value to an enum type requires this syntax
ALTER TYPE failure_status ADD VALUE IF NOT EXISTS 'failed_unfixable';

-- 3. Add manual retry tracking to failure_records
ALTER TABLE failure_records ADD COLUMN IF NOT EXISTS is_manual_retry BOOLEAN DEFAULT false;

-- 4. Create index for efficient lock queries
CREATE INDEX IF NOT EXISTS idx_vercel_projects_is_fixing ON vercel_projects(is_fixing) WHERE is_fixing = true;
