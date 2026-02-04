
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteRepo() {
  const repoName = 'autofix-test';
  console.log(`Deleting repository: ${repoName}...`);

  // Delete from github_installations (should cascade to vercel_projects and failure_records if set up correctly, 
  // but we'll do it manually to be safe)

  // 1. Get installation ID
  const { data: installations } = await supabase
    .from('github_installations')
    .select('id')
    .eq('repo_name', repoName);

  if (!installations || installations.length === 0) {
    console.log('Repo not found in database.');
    return;
  }

  const ids = installations.map(i => i.id);
  console.log(`Found ${ids.length} installation records. IDs: ${ids.join(', ')}`);

  // 2. Delete Failure Records (linked via vercel_projects)
  // We need to find vercel projects first
  const { data: projects } = await supabase
    .from('vercel_projects')
    .select('id')
    .in('github_installation_id', ids);

  if (projects && projects.length > 0) {
    const projectIds = projects.map(p => p.id);
    console.log(`Deleting failure records for projects: ${projectIds.join(', ')}...`);
    await supabase.from('failure_records').delete().in('vercel_project_id', projectIds);
    
    console.log(`Deleting vercel projects...`);
    await supabase.from('vercel_projects').delete().in('id', projectIds);
  }

  // 3. Delete Installation
  console.log(`Deleting github installations...`);
  const { error } = await supabase
    .from('github_installations')
    .delete()
    .eq('repo_name', repoName);

  if (error) {
    console.error('Error deleting repo:', error);
  } else {
    console.log('✅ Repo deleted successfully!');
  }
}

deleteRepo();
