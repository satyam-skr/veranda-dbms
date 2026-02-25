import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  const headersObj: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    url: request.url,
    cookies: allCookies,
    headers: headersObj,
    searchParams,
    environment: {
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      nodeEnv: process.env.NODE_ENV,
    }
  });
}
