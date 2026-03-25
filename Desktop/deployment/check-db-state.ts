import { supabaseAdmin } from './lib/supabase';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkDatabase() {
  console.log('🔍 Checking Database State...');

  // 1. Find the project
  const { data: projects, error: projectsError } = await supabaseAdmin
    .from('vercel_projects')
    .select('*')
    .ilike('project_name', '%autofix-test%');

  if (projectsError) {
    console.error('❌ Error fetching projects:', projectsError);
    return;
  }

  if (!projects || projects.length === 0) {
    console.log('⚠️ No projects found matching "autofix-test"');
    return;
  }

  for (const project of projects) {
    console.log(`\n📁 Project: ${project.project_name} (ID: ${project.id})`);
    console.log(`🔗 Project ID: ${project.project_id}`);
    console.log(`🔒 Is Fixing: ${project.is_fixing}`);
    console.log(`🕒 Last Checked: ${project.last_checked_deployment_id}`);

    // 2. Fetch failure records
    const { data: records, error: recordsError } = await supabaseAdmin
      .from('failure_records')
      .select('*')
      .eq('vercel_project_id', project.id)
      .order('created_at', { ascending: false });

    if (recordsError) {
      console.error('❌ Error fetching records:', recordsError);
      continue;
    }

    if (!records || records.length === 0) {
      console.log('⚠️ No failure records found for this project.');
      continue;
    }

    console.log(`📈 Failure Records (${records.length}):`);
    records.forEach((r, i) => {
      console.log(`  [${i + 1}] ID: ${r.id}`);
      console.log(`      Status: ${r.status}`);
      console.log(`      Deployment ID: ${r.deployment_id}`);
      console.log(`      Created: ${r.created_at}`);
      console.log(`      Source: ${r.failure_source}`);
      console.log(`      Signature: ${r.error_signature || 'N/A'}`);
      console.log(`      Attempts: ${r.attempt_count}`);
      console.log('      ---');
    });
  }
}

checkDatabase();
