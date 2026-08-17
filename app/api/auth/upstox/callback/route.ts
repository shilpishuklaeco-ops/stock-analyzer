import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  const apiKey = process.env.NEXT_PUBLIC_UPSTOX_API_KEY || '';
  const apiSecret = process.env.UPSTOX_API_SECRET || '';
  const redirectUri = 'http://localhost:3000/api/auth/upstox/callback';

  try {
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
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = await tokenResponse.json();

    if (data.access_token) {
      const response = NextResponse.redirect(new URL('/?upstox_connected=true', request.url));
      
      // Store token in HTTP-only cookie for the trading session
      response.cookies.set('upstox_access_token', data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 16, // 16 hours (valid for the trading session)
        path: '/',
      });

      return response;
    } else {
      console.error('Upstox Token Error:', data);
      return NextResponse.redirect(new URL('/?error=token_failed', request.url));
    }
  } catch (err) {
    console.error('Upstox Auth Callback Exception:', err);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
