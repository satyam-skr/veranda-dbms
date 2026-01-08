import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { VercelClient } from '@/lib/vercel';
import { encryptToken } from '@/lib/encryption';
import { logger } from '@/utils/logger';

const schema = z.object({
  githubInstallationId: z.string().uuid(),
  projectId: z.string(),
  vercelToken: z.string(),
  deployHookUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get user ID from cookie
    const userId = request.cookies.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request', details: validation.error }, { status: 400 });
    }

    const { githubInstallationId, projectId, vercelToken, deployHookUrl } = validation.data;

    // Verify GitHub installation belongs to user
    const { data: installation, error: installError } = await supabaseAdmin
      .from('github_installations')
      .select('*')
      .eq('id', githubInstallationId)
      .eq('user_id', userId)
      .single();

    if (installError || !installation) {
      return NextResponse.json({ error: 'GitHub installation not found' }, { status: 404 });
    }

    // Validate Vercel token by fetching project
    const vercelClient = new VercelClient(vercelToken);
    let projectData;

    try {
      projectData = await vercelClient.getProject(projectId);
    } catch (vercelError) {
      logger.error('Vercel token validation failed', { error: String(vercelError) });
      return NextResponse.json({ error: 'Invalid Vercel token or project ID' }, { status: 400 });
    }

    // Encrypt Vercel token
    const encryptedToken = await encryptToken(vercelToken);

    // Store Vercel project in database
    const { data: project, error: insertError } = await supabaseAdmin
      .from('vercel_projects')
      .insert({
        user_id: userId,
        github_installation_id: githubInstallationId,
        project_id: projectId,
        project_name: projectData.name,
        vercel_token: encryptedToken,
        deploy_hook_url: deployHookUrl,
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to store Vercel project', { error: insertError });
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    logger.info('Vercel project connected', {
      userId,
      projectId,
      projectName: projectData.name,
    });

    return NextResponse.json({ success: true, project });
  } catch (error) {
    logger.error('Connect Vercel error', { error: String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
