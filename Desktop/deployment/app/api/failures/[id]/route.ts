import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user ID from cookie
    const userId = request.cookies.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch failure with fix attempts
    const { data: failure, error: failureError } = await supabaseAdmin
      .from('failure_records')
      .select(`
        *,
        vercel_projects (
          project_name,
          user_id,
          github_installations (
            repo_owner,
            repo_name
          )
        ),
        fix_attempts (
          *
        )
      `)
      .eq('id', id)
      .order('attempt_number', { foreignTable: 'fix_attempts', ascending: true })
      .single();

    if (failureError || !failure) {
      logger.error('Failed to fetch failure', { error: failureError });
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Verify failure belongs to user
    if (failure.vercel_projects.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ failure });
  } catch (error) {
    logger.error('Failure detail API error', { error: String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
