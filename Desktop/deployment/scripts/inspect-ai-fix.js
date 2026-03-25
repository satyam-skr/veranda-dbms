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

async function inspectLatestFix() {
  console.log('🔍 Inspecting latest AI fix attempt...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Get the most recent fix attempt
  const { data: attempts, error } = await supabase
    .from('fix_attempts')
    .select('*, failure_records(logs)')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !attempts || attempts.length === 0) {
    console.error('❌ Error or no fix attempts found:', error);
    return;
  }

  const attempt = attempts[0];
  const aiResponse = attempt.ai_response;
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 LATEST FIX ATTEMPT ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('🔴 ORIGINAL ERROR:');
  console.log('─'.repeat(60));
  const logs = attempt.failure_records?.logs || '';
  const errorLines = logs.split('\n').filter(line => 
    line.includes('Error') || 
    line.includes('error') || 
    line.includes('failed') ||
    line.includes('Could not resolve')
  ).slice(0, 10);
  errorLines.forEach(line => console.log(line.trim()));
  console.log('');

  console.log('🤖 AI DIAGNOSIS:');
  console.log('─'.repeat(60));
  console.log(aiResponse?.rootCause || 'N/A');
  console.log('');

  console.log('🔧 AI PROPOSED FIX:');
  console.log('─'.repeat(60));
  if (aiResponse?.filesToChange) {
    aiResponse.filesToChange.forEach((file, i) => {
      console.log(`\nFile ${i + 1}: ${file.filename}`);
      console.log('\n❌ OLD CODE:');
      console.log(file.oldCode || '(new file)');
      console.log('\n✅ NEW CODE:');
      console.log(file.newCode);
    });
  }
  console.log('');

  console.log('💡 AI EXPLANATION:');
  console.log('─'.repeat(60));
  console.log(aiResponse?.explanation || 'N/A');
  console.log('');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n📝 To check the committed fix on GitHub:');
  console.log(`   Branch: ${attempt.applied_branch}`);
  console.log(`   Repo: https://github.com/Arkin26/autofix-test/tree/${attempt.applied_branch}`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

inspectLatestFix().catch(console.error);
