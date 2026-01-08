import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptToken } from '@/lib/encryption';
import { logger } from '@/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      const url = new URL(request.url);
      const baseUrl = `${url.protocol}//${url.host}`;
      return NextResponse.redirect(`${baseUrl}?error=no_code`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      logger.error('GitHub OAuth error', { error: tokenData.error });
      const url = new URL(request.url);
      const baseUrl = `${url.protocol}//${url.host}`;
      return NextResponse.redirect(`${baseUrl}?error=oauth_failed`);
    }

    const accessToken = tokenData.access_token;

    // Fetch user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    const userData = await userResponse.json();

    if (!userData.email) {
      // Try to get email from emails endpoint
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      const emails = await emailsResponse.json();
      const primaryEmail = emails.find((e: any) => e.primary);
      userData.email = primaryEmail?.email || `${userData.login}@users.noreply.github.com`;
    }

    // Encrypt access token
    const encryptedToken = await encryptToken(accessToken);

    // Upsert user in database
    const { data: user, error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          email: userData.email,
          github_username: userData.login,
          github_access_token: encryptedToken,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'email',
        }
      )
      .select()
      .single();

    if (upsertError || !user) {
      logger.error('Failed to upsert user', { error: upsertError });
      const url = new URL(request.url);
      const baseUrl = `${url.protocol}//${url.host}`;
      return NextResponse.redirect(`${baseUrl}?error=db_error`);
    }

    logger.info('User authenticated', { userId: user.id, username: userData.login });

    // Set session cookie
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const response = NextResponse.redirect(`${baseUrl}/dashboard`);
    response.cookies.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    logger.error('GitHub callback error', { error: String(error) });
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    return NextResponse.redirect(`${baseUrl}?error=server_error`);
  }
}
