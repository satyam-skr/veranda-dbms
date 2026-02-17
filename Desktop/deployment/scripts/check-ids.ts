import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabaseAdmin } from '../lib/supabase';

async function checkProjectIds() {
  console.log('📊 Fetching Project IDs from Supabase...');
  
  try {
    const { data, error } = await supabaseAdmin
      .from('vercel_projects')
      .select('*');

    if (error) {
      console.error('❌ Database error:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No projects found in vercel_projects table.');
    } else {
      console.table(data);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('💥 Unexpected error:', err);
    process.exit(1);
  }
}

checkProjectIds();
