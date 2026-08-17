import { NextRequest, NextResponse } from 'next/server';
import { NIFTY_50_STOCKS, INITIAL_RELIANCE_QUOTE, generateCandleData } from '@/lib/mockStockData';
import { computeAIForecast } from '@/lib/quantEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'RELIANCE';

    const stock = NIFTY_50_STOCKS.find((s) => s.symbol === symbol) || NIFTY_50_STOCKS[0];
    const candles = generateCandleData(symbol, '1D');

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
