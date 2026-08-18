import { NextRequest, NextResponse } from 'next/server';
import { UPSTOX_INSTRUMENT_MAP, UPSTOX_INDEX_MAP } from '@/lib/upstoxClient';

export interface OptionGreek {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  iv: number;
  pop?: number;
}

export interface OptionMarketData {
  ltp: number;
  volume: number;
  oi: number;
  prevOi: number;
  bidPrice: number;
  askPrice: number;
}

export interface OptionChainStrike {
  strikePrice: number;
  isATM?: boolean;
  callOptions?: {
    instrumentKey: string;
    marketData: OptionMarketData;
    greeks: OptionGreek;
  };
  putOptions?: {
    instrumentKey: string;
    marketData: OptionMarketData;
    greeks: OptionGreek;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'RELIANCE';
    const requestedExpiry = searchParams.get('expiry');

    const analyticsToken = process.env.UPSTOX_ANALYTICS_TOKEN || process.env.NEXT_PUBLIC_UPSTOX_ANALYTICS_TOKEN;
    const cookieToken = request.cookies.get('upstox_access_token')?.value;
    const activeToken = analyticsToken || cookieToken;

    if (!activeToken) {
      return NextResponse.json(
        { success: false, error: 'No active Upstox analytics token found' },
        { status: 401 }
      );
    }

    // Resolve Upstox Instrument Key
    let instrumentKey = UPSTOX_INSTRUMENT_MAP[symbol] || UPSTOX_INDEX_MAP[symbol];
    if (!instrumentKey) {
      if (symbol === 'NIFTY' || symbol === 'NIFTY50') {
        instrumentKey = 'NSE_INDEX|Nifty 50';
      } else {
        instrumentKey = `NSE_EQ:${symbol}`;
      }
    }

    // 1. Fetch available expiries for target instrument
    const expiriesRes = await fetch(
      `https://api.upstox.com/v2/option/contract?instrument_key=${encodeURIComponent(instrumentKey)}`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        next: { revalidate: 300 },
      }
    );

    let expiries: string[] = [];
    if (expiriesRes.ok) {
      const expJson = await expiriesRes.json();
      if (expJson.status === 'success' && Array.isArray(expJson.data)) {
        expiries = Array.from(new Set(expJson.data.map((item: any) => item.expiry))).sort() as string[];
      }
    }

    // Default to nearest expiry if not specified
    const activeExpiry = requestedExpiry && expiries.includes(requestedExpiry)
      ? requestedExpiry
      : expiries[0] || '2026-08-25';

    // 2. Fetch Live Option Chain & Greeks from Upstox
    const optionChainRes = await fetch(
      `https://api.upstox.com/v2/option/chain?instrument_key=${encodeURIComponent(
        instrumentKey
      )}&expiry_date=${encodeURIComponent(activeExpiry)}`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        next: { revalidate: 10 },
      }
    );

    if (!optionChainRes.ok) {
      const errText = await optionChainRes.text();
      return NextResponse.json(
        { success: false, error: 'Failed to fetch Upstox option chain data', details: errText },
        { status: optionChainRes.status }
      );
    }

    const chainJson = await optionChainRes.json();

    if (chainJson.status !== 'success' || !Array.isArray(chainJson.data)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Option Chain payload structure' },
        { status: 502 }
      );
    }

    const rawChain = chainJson.data;
    let spotPrice = 0;
    let totalCallOI = 0;
    let totalPutOI = 0;
    const strikes: OptionChainStrike[] = [];

    for (const item of rawChain) {
      if (!spotPrice && item.underlying_spot_price) {
        spotPrice = item.underlying_spot_price;
      }

      const strikePrice = item.strike_price;

      let callOpt = undefined;
      if (item.call_options) {
        const m = item.call_options.market_data || {};
        const g = item.call_options.option_greeks || {};
        totalCallOI += m.oi || 0;

        callOpt = {
          instrumentKey: item.call_options.instrument_key,
          marketData: {
            ltp: m.ltp || 0,
            volume: m.volume || 0,
            oi: m.oi || 0,
            prevOi: m.prev_oi || 0,
            bidPrice: m.bid_price || 0,
            askPrice: m.ask_price || 0,
          },
          greeks: {
            delta: Number((g.delta || 0).toFixed(4)),
            gamma: Number((g.gamma || 0).toFixed(4)),
            theta: Number((g.theta || 0).toFixed(2)),
            vega: Number((g.vega || 0).toFixed(2)),
            iv: Number((g.iv || 0).toFixed(2)),
            pop: g.pop ? Number(g.pop.toFixed(2)) : 0,
          },
        };
      }

      let putOpt = undefined;
      if (item.put_options) {
        const m = item.put_options.market_data || {};
        const g = item.put_options.option_greeks || {};
        totalPutOI += m.oi || 0;

        putOpt = {
          instrumentKey: item.put_options.instrument_key,
          marketData: {
            ltp: m.ltp || 0,
            volume: m.volume || 0,
            oi: m.oi || 0,
            prevOi: m.prev_oi || 0,
            bidPrice: m.bid_price || 0,
            askPrice: m.ask_price || 0,
          },
          greeks: {
            delta: Number((g.delta || 0).toFixed(4)),
            gamma: Number((g.gamma || 0).toFixed(4)),
            theta: Number((g.theta || 0).toFixed(2)),
            vega: Number((g.vega || 0).toFixed(2)),
            iv: Number((g.iv || 0).toFixed(2)),
            pop: g.pop ? Number(g.pop.toFixed(2)) : 0,
          },
        };
      }

      strikes.push({
        strikePrice,
        callOptions: callOpt,
        putOptions: putOpt,
      });
    }

    // Sort strikes ascending
    strikes.sort((a, b) => a.strikePrice - b.strikePrice);

    // Identify At-The-Money (ATM) strike closest to spotPrice
    let closestIndex = 0;
    let minDiff = Infinity;
    strikes.forEach((stk, idx) => {
      const diff = Math.abs(stk.strikePrice - spotPrice);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });

    if (strikes[closestIndex]) {
      strikes[closestIndex].isATM = true;
    }

    // Filter to ~21 strikes centered around ATM
    const startIndex = Math.max(0, closestIndex - 10);
    const endIndex = Math.min(strikes.length, closestIndex + 11);
    const filteredStrikes = strikes.slice(startIndex, endIndex);

    const overallPCR = totalCallOI > 0 ? Number((totalPutOI / totalCallOI).toFixed(2)) : 1.0;

    return NextResponse.json({
      success: true,
      symbol,
      spotPrice,
      activeExpiry,
      availableExpiries: expiries,
      summary: {
        pcr: overallPCR,
        totalCallOI,
        totalPutOI,
        atmStrike: strikes[closestIndex]?.strikePrice || spotPrice,
        sentiment: overallPCR > 1.2 ? 'BULLISH' : overallPCR < 0.8 ? 'BEARISH' : 'NEUTRAL',
      },
      strikes: filteredStrikes,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in /api/market/option-chain route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
