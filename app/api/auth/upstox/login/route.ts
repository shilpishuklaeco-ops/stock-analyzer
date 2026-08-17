import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_UPSTOX_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Upstox API Key not configured in .env.local' },
      { status: 400 }
    );
  }

  // Use configured redirect URI matching Upstox Developer Portal app settings
  const redirectUriRaw = process.env.UPSTOX_REDIRECT_URI || 'http://localhost:3000';
  const redirectUri = encodeURIComponent(redirectUriRaw);
  const upstoxAuthUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${apiKey}&redirect_uri=${redirectUri}`;

  return NextResponse.redirect(upstoxAuthUrl);
}
