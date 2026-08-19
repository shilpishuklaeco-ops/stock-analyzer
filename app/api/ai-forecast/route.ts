import { NextRequest, NextResponse } from 'next/server';
import { NIFTY_50_STOCKS, INITIAL_RELIANCE_QUOTE } from '@/lib/mockStockData';
import { computeAIForecast } from '@/lib/quantEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'RELIANCE';

    const stock = NIFTY_50_STOCKS.find((s) => s.symbol === symbol) || NIFTY_50_STOCKS[0];

    let candles: any[] = [];
    try {
      const candleRes = await fetch(`${origin}/api/market/candles?symbol=${symbol}&timeframe=1D`, {
        cache: 'no-store',
      });
      if (candleRes.ok) {
        const json = await candleRes.json();
        if (json.success && Array.isArray(json.candles) && json.candles.length > 0) {
          candles = json.candles;
        }
      }
    } catch (err) {
      console.warn('Real candle fetch for AI forecast failed:', err);
    }


    const quote =
      symbol === 'RELIANCE'
        ? INITIAL_RELIANCE_QUOTE
        : {
            ...INITIAL_RELIANCE_QUOTE,
            symbol: stock.symbol,
            name: stock.name,
            sector: stock.sector,
            price: stock.price,
            change: stock.change,
            changePercent: stock.changePercent,
            volume: stock.volume,
          };

    const forecast = computeAIForecast(symbol, quote, candles);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      source: candles.length > 0 ? 'Upstox Real Market Candles' : 'Fallback Engine',
      forecast,
    });
  } catch (error) {
    console.error('Error in /api/ai-forecast route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

