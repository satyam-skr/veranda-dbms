import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const response = NextResponse.redirect(`${baseUrl}/`);
  
  // Clear session cookie
  response.cookies.delete('user_id');

  return response;
}
