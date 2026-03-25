#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkTokenStatus() {
  console.log('🔍 Checking GitHub token status...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data, error } = await supabase
    .from('github_installations')
    .select('installation_id, Token_expires_at, updated_at')
    .eq('installation_id', 103022850)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  const now = new Date();
  const expiresAt = new Date(data.token_expires_at);
  const expired = expiresAt < now;

  console.log('Installation ID:', data.installation_id);
  console.log('Token Expires At:', data.token_expires_at);
  console.log('Last Updated:', data.updated_at);
  console.log('Current Time:', now.toISOString());
  console.log('');
  console.log(expired ? '❌ TOKEN EXPIRED!' : '✅ Token is still valid');
  
  if (expired) {
    const expiredHours = Math.floor((now - expiresAt) / (1000 * 60 * 60));
    console.log(`   Expired ${expiredHours} hours ago`);
    console.log('\n💡 Run: node scripts/refresh-github-token.js');
  }
}

checkTokenStatus().catch(console.error);
