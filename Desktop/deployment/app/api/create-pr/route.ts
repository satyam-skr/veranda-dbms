import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { FixService } from '@/services/fix.service';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { repoOwner, repoName, branchName, title, body, base } = await request.json();

    if (!repoOwner || !repoName || !branchName || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: repoOwner, repoName, branchName, title' },
        { status: 400 }
      );
    }

    // Identify the installation for this repo
    const { data: installation, error: instError } = await supabaseAdmin
      .from('github_installations')
      .select('installation_id')
      .eq('user_id', userId)
      .eq('repo_owner', repoOwner)
      .eq('repo_name', repoName)
      .single();

    if (instError || !installation) {
      return NextResponse.json(
        { error: 'Repository not connected or installation not found' },
        { status: 404 }
      );
    }

    const fixService = new FixService();
    const prUrl = await fixService.createPullRequest(
      installation.installation_id,
      repoOwner,
      repoName,
      branchName,
      title,
      body || 'Automated changes applied via platform.',
      base
    );

    if (!prUrl) {
      return NextResponse.json({ error: 'Failed to create Pull Request' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      prUrl,
    });
  } catch (error) {
    logger.error('API create-pr error', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
