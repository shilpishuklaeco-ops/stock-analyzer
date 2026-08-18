import { NextRequest, NextResponse } from 'next/server';
import { NIFTY_50_STOCKS } from '@/lib/mockStockData';
import { UPSTOX_INSTRUMENT_MAP } from '@/lib/upstoxClient';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { NiftyStock } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // 1. Prioritize Upstox 1-Year Analytics Token from Env, fallback to User Cookie
    const analyticsToken = process.env.UPSTOX_ANALYTICS_TOKEN || process.env.NEXT_PUBLIC_UPSTOX_ANALYTICS_TOKEN;
    const cookieToken = request.cookies.get('upstox_access_token')?.value;
    const activeToken = analyticsToken || cookieToken;

    const symbolsList = Object.keys(UPSTOX_INSTRUMENT_MAP);

    let fetchedQuotes: Record<string, Partial<NiftyStock>> = {};
    let isLiveUpstoxFeed = false;
    let tokenTypeUsed = 'None';

    // 2. Attempt Upstox Batch Fetch if any token (Analytics or OAuth) is available
    if (activeToken) {
      const formattedSymbols = symbolsList.map((sym) => `NSE_EQ:${sym}`).join(',');
      try {
        const upstoxRes = await fetch(
          `https://api.upstox.com/v2/market-quote/quotes?symbol=${encodeURIComponent(formattedSymbols)}`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${activeToken}`,
            },
            next: { revalidate: 5 },
          }
        );

        if (upstoxRes.ok) {
          const json = await upstoxRes.json();
          if (json.status === 'success' && json.data) {
            isLiveUpstoxFeed = true;
            tokenTypeUsed = analyticsToken ? 'Upstox 1-Year Analytics Token' : 'Upstox OAuth User Token';

            for (const sym of symbolsList) {
              const item = json.data[`NSE_EQ:${sym}`];
              if (item) {
                const ohlc = item.ohlc || {};
                const lastPrice = item.last_price || ohlc.close || 0;
                const prevClose = ohlc.close || lastPrice;
                const netChange = item.net_change || (lastPrice - prevClose);
                const pctChange = prevClose ? (netChange / prevClose) * 100 : 0;

                fetchedQuotes[sym] = {
                  price: Number(lastPrice.toFixed(2)),
                  change: Number(netChange.toFixed(2)),
                  changePercent: Number(pctChange.toFixed(2)),
                  volume: item.volume || 0,
                };
              }
            }
          }
        }
      } catch (err) {
        console.warn('Upstox Batch Quote fetch error:', err);
      }
    }

    // 3. Supabase Database Night/Weekend Cache Lookup
    if (!isLiveUpstoxFeed && isSupabaseConfigured && supabase) {
      try {
        const { data: dbData } = await supabase
          .from('stock_quotes_history')
          .select('*')
          .order('recorded_at', { ascending: false })
          .limit(50);

        if (dbData && dbData.length > 0) {
          for (const row of dbData) {
            if (!fetchedQuotes[row.symbol]) {
              fetchedQuotes[row.symbol] = {
                price: Number(row.price),
                change: Number(row.change),
                changePercent: Number(row.change_percent),
                volume: Number(row.volume || 0),
              };
            }
          }
        }
      } catch (err) {
        // Silent catch for Supabase fallback
      }
    }

    // 4. Assemble merged Nifty 50 stock list
    const updatedStocks: NiftyStock[] = NIFTY_50_STOCKS.map((stock) => {
      const live = fetchedQuotes[stock.symbol];
      if (live) {
        return {
          ...stock,
          price: live.price ?? stock.price,
          change: live.change ?? stock.change,
          changePercent: live.changePercent ?? stock.changePercent,
          volume: live.volume || stock.volume,
        };
      }
      return stock;
    });

    // Auto-persist live quotes into Supabase database in background
    if (isLiveUpstoxFeed && isSupabaseConfigured && supabase) {
      const recordsToInsert = updatedStocks.map((stk) => ({
        symbol: stk.symbol,
        price: stk.price,
        change: stk.change,
        change_percent: stk.changePercent,
        volume: stk.volume,
      }));

      // Async background insert into Supabase
      supabase.from('stock_quotes_history').insert(recordsToInsert).then(() => {});
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      source: isLiveUpstoxFeed
        ? tokenTypeUsed
        : isSupabaseConfigured
        ? 'Supabase DB Cache'
        : 'NSE Baseline Engine',
      stocks: updatedStocks,
    });
  } catch (error) {
    console.error('Error in /api/market/quotes route:', error);
    return NextResponse.json(
      { success: false, stocks: NIFTY_50_STOCKS, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
