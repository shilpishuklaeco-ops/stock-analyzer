import { NextRequest, NextResponse } from 'next/server';
import { NIFTY_50_STOCKS } from '@/lib/mockStockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { NiftyStock } from '@/lib/types';

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(
      { success: false, error: 'Supabase client is not configured in .env.local' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const stocksToCache: NiftyStock[] = Array.isArray(body.stocks) && body.stocks.length > 0 ? body.stocks : NIFTY_50_STOCKS;

    const records = stocksToCache.map((s: NiftyStock) => ({
      symbol: s.symbol,
      price: s.price,
      change: s.change,
      change_percent: s.changePercent,
      volume: s.volume,
      recorded_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('stock_quotes_history').insert(records);

    if (error) {
      console.error('Supabase Cache Sync Error:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cached closing prices for ${records.length} stocks into Supabase DB`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Exception in /api/market/cache-sync:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
