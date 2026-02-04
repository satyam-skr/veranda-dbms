import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('user_id');
  const allCookies = request.cookies.getAll();

  return NextResponse.json({
    authenticated: !!userId,
    userId: userId?.value || null,
    allCookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
    headers: {
      cookie: request.headers.get('cookie'),
      userAgent: request.headers.get('user-agent'),
    },
  });
}
