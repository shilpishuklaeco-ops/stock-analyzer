import { NextRequest, NextResponse } from 'next/server';
import { UPSTOX_INSTRUMENT_MAP, UPSTOX_INDEX_MAP } from '@/lib/upstoxClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = (searchParams.get('symbol') || 'RELIANCE').toUpperCase();
    const timeframe = (searchParams.get('timeframe') || '1D').toUpperCase() as '1D' | '1W' | '1M' | '1Y' | 'ALL';

    const analyticsToken = process.env.UPSTOX_ANALYTICS_TOKEN;

    // Resolve Upstox Instrument Key (Check Stock Map first, then Index Map)
    const instrumentKey =
      UPSTOX_INSTRUMENT_MAP[symbol] ||
      UPSTOX_INDEX_MAP[symbol] ||
      UPSTOX_INSTRUMENT_MAP['RELIANCE'];

    // Map timeframe to Upstox API interval unit
    let unit = '5minute';
    let intervalDays = 1;

    if (timeframe === '1D') {
      unit = '5minute';
      intervalDays = 1;
    } else if (timeframe === '1W') {
      unit = '30minute';
      intervalDays = 7;
    } else if (timeframe === '1M') {
      unit = 'day';
      intervalDays = 30;
    } else if (timeframe === '1Y') {
      unit = 'day';
      intervalDays = 365;
    } else {
      unit = 'day';
      intervalDays = 1095; // 3 years
    }

    const today = new Date();
    const toDateStr = today.toISOString().split('T')[0];
    const fromDate = new Date(today.getTime() - intervalDays * 24 * 60 * 60 * 1000);
    const fromDateStr = fromDate.toISOString().split('T')[0];

    if (analyticsToken) {
      try {
        const upstoxUrl = `https://api.upstox.com/v2/historical-candle/${encodeURIComponent(
          instrumentKey
        )}/${unit}/${toDateStr}/${fromDateStr}`;

        const res = await fetch(upstoxUrl, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${analyticsToken}`,
          },
          next: { revalidate: 60 },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.status === 'success' && json.data && Array.isArray(json.data.candles)) {
            const isIntraday = timeframe === '1D' || timeframe === '1W';

            // Upstox returns candles [timestamp, open, high, low, close, volume, open_interest] newest first
            const formattedCandles = json.data.candles
              .map((c: [string, number, number, number, number, number]) => {
                const rawTime = c[0];
                let parsedTime: string | number;

                if (isIntraday) {
                  // Convert ISO timestamp to UNIX epoch seconds for intraday precision
                  parsedTime = Math.floor(new Date(rawTime).getTime() / 1000);
                } else {
                  // Format ISO timestamp to YYYY-MM-DD for daily Lightweight Charts
                  parsedTime = rawTime.split('T')[0];
                }

                return {
                  time: parsedTime,
                  open: c[1],
                  high: c[2],
                  low: c[3],
                  close: c[4],
                  volume: c[5] || 0,
                };
              })
              .reverse(); // Reverse newest-first into ascending chronological order (oldest-first)

            // Filter duplicates & ensure strictly ascending order
            const uniqueCandles: typeof formattedCandles = [];
            const seenTimes = new Set<string | number>();

            for (const candle of formattedCandles) {
              if (!seenTimes.has(candle.time) && !isNaN(Number(candle.close))) {
                seenTimes.add(candle.time);
                uniqueCandles.push(candle);
              }
            }

            return NextResponse.json({
              success: true,
              candles: uniqueCandles,
              source: 'Upstox Real Historical API (Analytics Token)',
            });
          }
        }
      } catch (err) {
        console.warn('Upstox Real Candle Fetch Error:', err);
      }
    }

    return NextResponse.json(
      { success: false, error: 'Upstox Candle Fetch Unavailable' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error in candles route:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
