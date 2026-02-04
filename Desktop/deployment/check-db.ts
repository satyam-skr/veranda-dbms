
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRepos() {
  console.log('Checking database for installations...');
  const { data, error } = await supabase
    .from('github_installations')
    .select('*');

  if (error) {
    console.error('Error fetching installations:', error);
    return;
  }

  console.log(`Found ${data.length} installations:`);
  data.forEach(repo => {
    console.log(`- ${repo.repo_owner}/${repo.repo_name} (ID: ${repo.id})`);
  });
}

checkRepos();
