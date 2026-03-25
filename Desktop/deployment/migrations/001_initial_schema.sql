-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    github_username VARCHAR(255) NOT NULL,
    github_access_token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_github_username ON users(github_username);

-- Create github_installations table
CREATE TABLE github_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    installation_id BIGINT NOT NULL UNIQUE,
    repo_owner VARCHAR(255) NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    installation_token TEXT,
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_github_installations_user_id ON github_installations(user_id);
CREATE INDEX idx_github_installations_installation_id ON github_installations(installation_id);
CREATE UNIQUE INDEX idx_github_installations_repo ON github_installations(repo_owner, repo_name);

-- Create vercel_projects table
CREATE TABLE vercel_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    github_installation_id UUID NOT NULL REFERENCES github_installations(id) ON DELETE CASCADE,
    project_id VARCHAR(255) NOT NULL UNIQUE,
    project_name VARCHAR(255) NOT NULL,
    vercel_token TEXT NOT NULL,
    deploy_hook_url TEXT,
    last_checked_deployment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vercel_projects_user_id ON vercel_projects(user_id);
CREATE INDEX idx_vercel_projects_github_installation_id ON vercel_projects(github_installation_id);
CREATE INDEX idx_vercel_projects_project_id ON vercel_projects(project_id);

-- Create failure status enum
CREATE TYPE failure_status AS ENUM ('pending_analysis', 'fixing', 'fixed_successfully', 'failed_after_max_retries');

-- Create failure_records table
CREATE TABLE failure_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vercel_project_id UUID NOT NULL REFERENCES vercel_projects(id) ON DELETE CASCADE,
    deployment_id VARCHAR(255) NOT NULL,
    failure_source VARCHAR(255) NOT NULL,
    logs TEXT NOT NULL,
    status failure_status NOT NULL DEFAULT 'pending_analysis',
    attempt_count INT NOT NULL DEFAULT 0,
    current_branch VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_failure_records_vercel_project_id ON failure_records(vercel_project_id);
CREATE INDEX idx_failure_records_deployment_id ON failure_records(deployment_id);
CREATE INDEX idx_failure_records_status ON failure_records(status);
CREATE INDEX idx_failure_records_created_at ON failure_records(created_at DESC);

-- Create fix_attempts table
CREATE TABLE fix_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    failure_record_id UUID NOT NULL REFERENCES failure_records(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL,
    ai_prompt_sent TEXT NOT NULL,
    ai_response JSONB NOT NULL,
    files_changed JSONB NOT NULL,
    applied_branch VARCHAR(255) NOT NULL,
    new_deployment_id VARCHAR(255),
    deployment_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(failure_record_id, attempt_number)
);

CREATE INDEX idx_fix_attempts_failure_record_id ON fix_attempts(failure_record_id);
CREATE INDEX idx_fix_attempts_created_at ON fix_attempts(created_at DESC);

-- Encryption helper functions
CREATE OR REPLACE FUNCTION encrypt_token(token TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(pgp_sym_encrypt(token, encryption_key), 'base64');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrypt_token(encrypted_token TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(decode(encrypted_token, 'base64'), encryption_key);
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;
