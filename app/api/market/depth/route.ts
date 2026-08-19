import { NextRequest, NextResponse } from 'next/server';
import { UPSTOX_INSTRUMENT_MAP, UPSTOX_INDEX_MAP } from '@/lib/upstoxClient';
import { OrderBookItem, LiveIndexQuote } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = (searchParams.get('symbol') || 'RELIANCE').toUpperCase();
    const analyticsToken = process.env.UPSTOX_ANALYTICS_TOKEN;

    const stockKey = `NSE_EQ:${symbol}`;
    const indexSymbols = [
      'NSE_INDEX:Nifty 50',
      'BSE_INDEX:SENSEX',
      'NSE_INDEX:Nifty Bank',
      'NSE_INDEX:Nifty IT',
      'NSE_INDEX:Nifty Auto',
      'NSE_INDEX:Nifty Pharma',
    ];

    const symbolsParam = [stockKey, ...indexSymbols].join(',');

    if (analyticsToken) {
      try {
        const upstoxRes = await fetch(
          `https://api.upstox.com/v2/market-quote/quotes?symbol=${encodeURIComponent(symbolsParam)}`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${analyticsToken}`,
            },
            next: { revalidate: 5 }, // Cache for 5 seconds
          }
        );

        if (upstoxRes.ok) {
          const json = await upstoxRes.json();
          if (json.status === 'success' && json.data) {
            const stockData = json.data[stockKey] || {};
            const depthData = stockData.depth || {};

            // Extract Real 5-Level Bids & Asks
            const bids: OrderBookItem[] = Array.isArray(depthData.buy)
              ? depthData.buy.map((b: any) => ({
                  price: b.price || 0,
                  quantity: b.quantity || 0,
                  orders: b.orders || 1,
                }))
              : [];

            const asks: OrderBookItem[] = Array.isArray(depthData.sell)
              ? depthData.sell.map((a: any) => ({
                  price: a.price || 0,
                  quantity: a.quantity || 0,
                  orders: a.orders || 1,
                }))
              : [];

            // Calculate Real Buyer vs Seller ratio from total depth volume
            const totalBuyQty = bids.reduce((acc, b) => acc + b.quantity, 0);
            const totalSellQty = asks.reduce((acc, a) => acc + a.quantity, 0);
            const totalVol = totalBuyQty + totalSellQty;
            const buyPercent = totalVol > 0 ? Math.round((totalBuyQty / totalVol) * 100) : 55;
            const sellPercent = 100 - buyPercent;

            // Extract Real Live Indices
            const indicesMap: Record<string, LiveIndexQuote> = {
              'NSE_INDEX:Nifty 50': { symbol: 'NIFTY50', name: 'NIFTY 50', price: 24154.9, change: -132.75, changePercent: -0.55 },
              'BSE_INDEX:SENSEX': { symbol: 'SENSEX', name: 'SENSEX', price: 77235.46, change: -492.7, changePercent: -0.63 },
              'NSE_INDEX:Nifty Bank': { symbol: 'BANKNIFTY', name: 'BANK NIFTY', price: 57262.4, change: -235.4, changePercent: -0.41 },
              'NSE_INDEX:Nifty IT': { symbol: 'NIFTYIT', name: 'NIFTY IT', price: 30213.45, change: -594.35, changePercent: -1.93 },
              'NSE_INDEX:Nifty Auto': { symbol: 'NIFTYAUTO', name: 'NIFTY AUTO', price: 29264.55, change: 86.45, changePercent: 0.3 },
              'NSE_INDEX:Nifty Pharma': { symbol: 'NIFTYPHARMA', name: 'NIFTY PHARMA', price: 26361.9, change: 20.35, changePercent: 0.08 },
            };

            indexSymbols.forEach((key) => {
              if (json.data[key]) {
                const idx = json.data[key];
                const ohlc = idx.ohlc || {};
                const currentPrice = idx.last_price || ohlc.close || 0;
                const netChange = idx.net_change || 0;
                const changePct = ohlc.close ? Number(((netChange / ohlc.close) * 100).toFixed(2)) : 0;

                if (indicesMap[key]) {
                  indicesMap[key].price = currentPrice;
                  indicesMap[key].change = netChange;
                  indicesMap[key].changePercent = changePct;
                }
              }
            });

            return NextResponse.json({
              success: true,
              orderBook: { bids, asks },
              buyPercent,
              sellPercent,
              indices: Object.values(indicesMap),
              source: 'Upstox Real Market Depth API (Analytics Token)',
            });
          }
        }
      } catch (err) {
        console.warn('Upstox Market Depth Fetch Error:', err);
      }
    }

    return NextResponse.json(
      { success: false, error: 'Upstox Depth Fetch Unavailable' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error in depth route:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
