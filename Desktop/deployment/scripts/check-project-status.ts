import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabaseAdmin } from '../lib/supabase';

async function checkProjectStatus() {
  console.log('🔍 Checking project status...');

  try {
    const { data: project, error } = await supabaseAdmin
      .from('vercel_projects')
      //.eq('project_id', 'prj_8ZzwsQ0USdir7417J3SBkN14VhcQ') // using ID from before
      .select('*')
      .ilike('project_name', '%autofix-test%')
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      process.exit(1);
    }

    if (project) {
      console.log(`✅ Project Found: ${project.project_name}`);
      console.log(`🔒 Is Fixing: ${project.is_fixing}`);
      console.log(`🕒 Last Checked Deployment: ${project.last_checked_deployment_id}`);
    } else {
      console.log('⚠️ Project not found');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('💥 Unexpected error:', err);
    process.exit(1);
  }
}

checkProjectStatus();
