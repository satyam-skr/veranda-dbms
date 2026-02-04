#!/usr/bin/env node

/**
 * Refresh GitHub App Installation Token
 * 
 * This script:
 * 1. Generates a fresh GitHub App installation access token
 * 2. Encrypts it using the same encryption method as the app
 * 3. Updates the Supabase database
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Configuration from environment variables
const GITHUB_APP_ID = process.env.GITHUB_APP_ID;
const GITHUB_PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n');
const INSTALLATION_ID = 103022850; // Your installation ID

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Validate environment variables
if (!GITHUB_APP_ID) {
  console.error('❌ Missing GITHUB_APP_ID environment variable');
  console.error('   Get it from: https://github.com/settings/apps');
  process.exit(1);
}

if (!GITHUB_PRIVATE_KEY) {
  console.error('❌ Missing GITHUB_APP_PRIVATE_KEY environment variable');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

if (!ENCRYPTION_KEY) {
  console.error('❌ Missing ENCRYPTION_KEY environment variable');
  process.exit(1);
}

/**
 * Encrypt token using Supabase RPC (same as the app)
 */
async function encryptToken(token, supabase) {
  const { data, error } = await supabase.rpc('encrypt_token', {
    token: token,
    encryption_key: ENCRYPTION_KEY
  });

  if (error) {
    throw new Error(`Failed to encrypt token: ${error.message}`);
  }

  return data;
}

async function refreshGitHubToken() {
  try {
    console.log('🔄 Refreshing GitHub App installation token...\n');

    // Step 1: Create GitHub App authentication
    console.log('1️⃣  Authenticating with GitHub App...');
    const auth = createAppAuth({
      appId: GITHUB_APP_ID,
      privateKey: GITHUB_PRIVATE_KEY,
    });

    // Step 2: Get installation access token
    console.log('2️⃣  Generating installation access token...');
    const installationAuth = await auth({
      type: 'installation',
      installationId: INSTALLATION_ID,
    });

    const { token, expiresAt } = installationAuth;

    console.log('✅ Token generated successfully!');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   Expires: ${expiresAt}\n`);

    // Step 3: Create Supabase client
    console.log('3️⃣  Connecting to Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Step 4: Encrypt the token
    console.log('4️⃣  Encrypting token...');
    const encryptedToken = await encryptToken(token, supabase);
    console.log('✅ Token encrypted\n');

    // Step 5: Update the database
    console.log('5️⃣  Updating database...');
    const { data, error } = await supabase
      .from('github_installations')
      .update({
        installation_token: encryptedToken,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('installation_id', INSTALLATION_ID)
      .select();

    if (error) {
      console.error('❌ Database update failed:', error);
      process.exit(1);
    }

    console.log('✅ Database updated successfully!\n');

    // Step 6: Verify the update
    console.log('6️⃣  Verifying update...');
    const { data: verification, error: verifyError } = await supabase
      .from('github_installations')
      .select('installation_id, repo_owner, repo_name, token_expires_at, updated_at')
      .eq('installation_id', INSTALLATION_ID)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      process.exit(1);
    }

    console.log('✅ Verification successful!\n');

    // Print summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 GitHub Token Refresh Complete!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Installation ID: ${verification.installation_id}`);
    console.log(`Repository:      ${verification.repo_owner}/${verification.repo_name}`);
    console.log(`Token Expires:   ${verification.token_expires_at}`);
    console.log(`Updated At:      ${verification.updated_at}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Step 7: Test the token with a simple API call
    console.log('7️⃣  Testing token with GitHub API...');
    const octokit = new Octokit({ auth: token });
    
    try {
      const { data: repo } = await octokit.rest.repos.get({
        owner: verification.repo_owner,
        repo: verification.repo_name,
      });
      
      console.log(`✅ Token works! Successfully accessed ${repo.full_name}\n`);
    } catch (testError) {
      console.error('⚠️  Token verification failed:', testError.message);
      console.error('   The token was saved but may not have the right permissions');
    }

    console.log('✅ All done! Your AutoFix platform should now work correctly.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the script
refreshGitHubToken();
