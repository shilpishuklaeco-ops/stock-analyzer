import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const analyticsToken = process.env.UPSTOX_ANALYTICS_TOKEN || process.env.NEXT_PUBLIC_UPSTOX_ANALYTICS_TOKEN;
    const cookieToken = request.cookies.get('upstox_access_token')?.value;
    const activeToken = analyticsToken || cookieToken;

    if (!activeToken) {
      return NextResponse.json(
        { success: false, error: 'No active Upstox access token found' },
        { status: 401 }
      );
    }

    // Upstox v3 Market Data Feed Authorize Endpoint
    const upstoxRes = await fetch('https://api.upstox.com/v3/feed/market-data-feed/authorize', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${activeToken}`,
      },
      next: { revalidate: 0 },
    });

    if (!upstoxRes.ok) {
      const errorText = await upstoxRes.text();
      console.warn('Upstox v3 Authorize error response:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to authorize Upstox v3 feed stream', details: errorText },
        { status: upstoxRes.status }
      );
    }

    const json = await upstoxRes.json();

    if (json.status === 'success' && json.data?.authorizedRedirectUri) {
      return NextResponse.json({
        success: true,
        authorizedUrl: json.data.authorizedRedirectUri,
        timestamp: new Date().toISOString(),
        source: analyticsToken ? 'Upstox 1-Year Analytics Token' : 'OAuth User Token',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid response from Upstox v3 authorizer', payload: json },
      { status: 502 }
    );
  } catch (error) {
    console.error('Error in /api/market/v3-authorize route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
