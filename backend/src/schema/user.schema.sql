CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE gender_enum AS ENUM ('male', 'female', 'unknown');

CREATE TABLE 
  IF NOT EXISTS
  users (
    user_id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    gender gender_enum,
    verification_status VARCHAR(50) DEFAULT 'unverified',
    is_active BOOLEAN DEFAULT TRUE,
    user_role JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);