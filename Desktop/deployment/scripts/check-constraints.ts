import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { supabaseAdmin } from '../lib/supabase';

async function main() {
  console.log('🔍 Checking potential constraint issue on github_installations...');

  // 1. Get a valid user
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .limit(1)
    .single();

  if (userError || !user) {
    console.error('❌ Could not find any user to test against.');
    return;
  }

  const userId = user.id;
  const testInstallationId = 999999999; // Assume this ID doesn't exist

  // Clean up any previous test data
  await supabaseAdmin
    .from('github_installations')
    .delete()
    .eq('installation_id', testInstallationId);

  // 2. Insert first repo
  console.log('📝 Inserting first test repo...');
  const { error: error1 } = await supabaseAdmin
    .from('github_installations')
    .insert({
      user_id: userId,
      installation_id: testInstallationId, // Same ID
      repo_owner: 'test-owner',
      repo_name: 'test-repo-1',
      installation_token: 'dummy',
      token_expires_at: new Date().toISOString(),
    });

  if (error1) {
    console.error('❌ Failed to insert first repo:', error1);
    return;
  }
  console.log('✅ First repo inserted successfully.');

  // 3. Insert second repo with SAME installation_id
  console.log('📝 Inserting second test repo (same installation_id)...');
  const { error: error2 } = await supabaseAdmin
    .from('github_installations')
    .insert({
      user_id: userId,
      installation_id: testInstallationId, // Same ID
      repo_owner: 'test-owner',
      repo_name: 'test-repo-2', // Different repo name
      installation_token: 'dummy',
      token_expires_at: new Date().toISOString(),
    });

  if (error2) {
    console.error('❌ Failed to insert second repo:', error2);
    if (error2.code === '23505') { // Unique violation
        console.error('🚨 CONFIRMED: Unique constraint violation on installation_id!');
        console.error('   This means migration 003 was likely NOT applied.');
    }
  } else {
    console.log('✅ Second repo inserted successfully.');
    console.log('   This means migration 003 IS applied correctly.');
  }

  // Cleanup
  await supabaseAdmin
    .from('github_installations')
    .delete()
    .eq('installation_id', testInstallationId);
}

main();
