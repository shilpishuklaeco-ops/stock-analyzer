import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_UPSTOX_API_KEY || '';
    const apiSecret = process.env.UPSTOX_API_SECRET || '';
    const targetRedirectUri = redirectUri || process.env.UPSTOX_REDIRECT_URI || 'http://localhost:3000';

    const tokenResponse = await fetch('https://api.upstox.com/v2/login/authorization/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        code,
        client_id: apiKey,
        client_secret: apiSecret,
        redirect_uri: targetRedirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = await tokenResponse.json();

    if (data.access_token) {
      const res = NextResponse.json({ success: true, access_token: data.access_token });
      res.cookies.set('upstox_access_token', data.access_token, {
        httpOnly: true,
        maxAge: 60 * 60 * 16,
        path: '/',
      });
      return res;
    } else {
      return NextResponse.json({ error: data }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
