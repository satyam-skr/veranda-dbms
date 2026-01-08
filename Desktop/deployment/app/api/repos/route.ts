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

    // Fetch user's repos with Vercel projects
    const { data: installations, error } = await supabaseAdmin
      .from('github_installations')
      .select(`
        *,
        vercel_projects (*)
      `)
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to fetch repos', { error });
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ repos: installations || [] });
  } catch (error) {
    logger.error('Repos API error', { error: String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
