import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey =
    process.env.NEXT_PUBLIC_UPSTOX_API_KEY ||
    process.env.UPSTOX_API_KEY ||
    '4dbed514-89f5-485d-b276-14539c3c0ddb';

  // Dynamic redirect URI depending on current domain
  const origin = request.nextUrl.origin;
  const redirectUriRaw = process.env.UPSTOX_REDIRECT_URI || origin || 'http://localhost:3000';
  const redirectUri = encodeURIComponent(redirectUriRaw);

  const upstoxAuthUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${apiKey}&redirect_uri=${redirectUri}`;

  return NextResponse.redirect(upstoxAuthUrl);
}
