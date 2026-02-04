
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const repoName = 'autofix-test';
  
  try {
    // 1. Get installation IDs
    const { data: installations } = await supabaseAdmin
      .from('github_installations')
      .select('id')
      .eq('repo_name', repoName);

    if (!installations || installations.length === 0) {
      return NextResponse.json({ message: 'Repo not found' });
    }

    const ids = installations.map(i => i.id);

    // 2. Get Project IDs
    const { data: projects } = await supabaseAdmin
      .from('vercel_projects')
      .select('id')
      .in('github_installation_id', ids);

    if (projects && projects.length > 0) {
      const projectIds = projects.map(p => p.id);
      // Delete failure records
      await supabaseAdmin.from('failure_records').delete().in('vercel_project_id', projectIds);
      // Delete vercel projects
      await supabaseAdmin.from('vercel_projects').delete().in('id', projectIds);
    }

    // 3. Delete Installation
    const { error } = await supabaseAdmin
      .from('github_installations')
      .delete()
      .eq('repo_name', repoName);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Repo deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
