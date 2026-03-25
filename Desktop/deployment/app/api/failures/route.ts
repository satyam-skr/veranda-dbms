import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from cookie
    const userId = request.cookies.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch failures for user's projects
    const { data: failures, error } = await supabaseAdmin
      .from('failure_records')
      .select(`
        *,
        vercel_projects (
          project_name,
          github_installations (
            repo_owner,
            repo_name
          )
        )
      `)
      .eq('vercel_projects.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('Failed to fetch failures', { error });
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ failures: failures || [] });
  } catch (error) {
    logger.error('Failures API error', { error: String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
