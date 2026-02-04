-- Drop the incorrect unique constraint on installation_id
ALTER TABLE github_installations DROP CONSTRAINT IF EXISTS github_installations_installation_id_key;

-- Add a correct unique constraint on (installation_id, repo_owner, repo_name)
-- This allows one installation ID to be associated with multiple different repositories
ALTER TABLE github_installations 
ADD CONSTRAINT github_installations_unique_repo 
UNIQUE (installation_id, repo_owner, repo_name);
