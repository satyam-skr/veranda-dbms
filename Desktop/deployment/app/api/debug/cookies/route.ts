import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const cookies = request.cookies.getAll();
  const headers = Object.fromEntries(request.headers.entries());
  
  return NextResponse.json({
    message: 'Cookie Debugger',
    cookies,
    headers: {
      cookie: headers.cookie,
      authorization: headers.authorization,
      host: headers.host,
      origin: headers.origin,
      referer: headers.referer,
    },
    url: request.url,
    nextUrl: {
      protocol: request.nextUrl.protocol,
      hostname: request.nextUrl.hostname,
      basePath: request.nextUrl.basePath,
    }
  });
}
