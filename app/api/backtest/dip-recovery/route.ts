import { NextRequest, NextResponse } from 'next/server';
import { runDipRecoveryBacktest } from '@/lib/dipBacktestEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'RELIANCE';
    const threshold = parseFloat(searchParams.get('threshold') || '-2.0');
    const checkTime = searchParams.get('checkTime') || '10:30';
    const period = parseInt(searchParams.get('period') || '250', 10);

    let realCandles: any[] | undefined = undefined;

    try {
      const candleRes = await fetch(`${origin}/api/market/candles?symbol=${symbol}&timeframe=1Y`, {
        cache: 'no-store',
      });
      if (candleRes.ok) {
        const json = await candleRes.json();
        if (json.success && Array.isArray(json.candles)) {
          realCandles = json.candles;
        }
      }
    } catch (err) {
      console.warn('Real candle fetch for backtest failed, using fallback:', err);
    }

    const result = runDipRecoveryBacktest(symbol, threshold, checkTime, period, realCandles);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      source: realCandles ? 'Upstox Real 1-Year Market History' : 'Fallback Engine',
      result,
    });
  } catch (error) {
    console.error('Error in /api/backtest/dip-recovery route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

