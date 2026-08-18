import { CandleData, StockQuote } from './types';

const UPSTOX_API_KEY = process.env.NEXT_PUBLIC_UPSTOX_API_KEY || '';

export const isUpstoxConfigured = Boolean(UPSTOX_API_KEY);

// Instrument Key Map for Major NSE Stocks & Indices
export const UPSTOX_INSTRUMENT_MAP: Record<string, string> = {
  RELIANCE: 'NSE_EQ|INE002A01018',
  TCS: 'NSE_EQ|INE467B01029',
  INFY: 'NSE_EQ|INE009A01021',
  HDFCBANK: 'NSE_EQ|INE040A01034',
  ICICIBANK: 'NSE_EQ|INE090A01021',
  SBIN: 'NSE_EQ|INE062A01020',
  BHARTIARTL: 'NSE_EQ|INE397D01024',
  TATAMOTORS: 'NSE_EQ|INE155A01022',
  'M&M': 'NSE_EQ|INE101A01026',
  ITC: 'NSE_EQ|INE154A01025',
  HINDUNILVR: 'NSE_EQ|INE030A01027',
  SUNPHARMA: 'NSE_EQ|INE044A01036',
  'L&T': 'NSE_EQ|INE018A01030',
  NTPC: 'NSE_EQ|INE733E01010',
  POWERGRID: 'NSE_EQ|INE752E01010',
  TATASTEEL: 'NSE_EQ|INE081A01020',
};

// Instrument Key Map for Indian Major Indices
export const UPSTOX_INDEX_MAP: Record<string, string> = {
  NIFTY50: 'NSE_INDEX|Nifty 50',
  SENSEX: 'BSE_INDEX|SENSEX',
  BANKNIFTY: 'NSE_INDEX|Nifty Bank',
  NIFTYIT: 'NSE_INDEX|Nifty IT',
  NIFTYAUTO: 'NSE_INDEX|Nifty Auto',
  NIFTYPHARMA: 'NSE_INDEX|Nifty Pharma',
};

/**
 * Fetch Authorized WebSocket URL for Upstox Market Data Feed V3
 */
export async function fetchV3WebSocketUrl(): Promise<{ success: boolean; authorizedUrl?: string; source?: string } | null> {
  try {
    const res = await fetch('/api/market/v3-authorize', { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.authorizedUrl) {
      return {
        success: true,
        authorizedUrl: json.authorizedUrl,
        source: json.source,
      };
    }
    return null;
  } catch (err) {
    console.warn('Error fetching Upstox v3 WebSocket URL:', err);
    return null;
  }
}

/**
 * Fetch Historical Candlestick Data from Upstox API
 */
export async function fetchUpstoxCandles(
  symbol: string,
  timeframe: '1D' | '1W' | '1M' | '1Y' | 'ALL'
): Promise<CandleData[] | null> {
  const instrumentKey = UPSTOX_INSTRUMENT_MAP[symbol] || UPSTOX_INSTRUMENT_MAP['RELIANCE'];
  
  let unit = '1minute';
  if (timeframe === '1D') unit = '5minute';
  else if (timeframe === '1W') unit = '30minute';
  else if (timeframe === '1M') unit = 'day';
  else unit = 'day';

  const today = new Date().toISOString().split('T')[0];

  try {
    const response = await fetch(
      `https://api.upstox.com/v2/historical-candle/${encodeURIComponent(
        instrumentKey
      )}/${unit}/${today}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn(`Upstox API candle fetch response status: ${response.status}`);
      return null;
    }

    const json = await response.json();
    if (json.status !== 'success' || !json.data || !json.data.candles) {
      return null;
    }

    // Upstox candle array format: [timestamp, open, high, low, close, volume, open_interest]
    const candles: CandleData[] = json.data.candles
      .map((c: [string, number, number, number, number, number]) => {
        const timeStr = c[0];
        // Format timestamp
        const timeFormatted = timeStr.includes('T')
          ? timeStr.replace('T', ' ').substring(0, 16)
          : timeStr;

        return {
          time: timeFormatted,
          open: c[1],
          high: c[2],
          low: c[3],
          close: c[4],
          volume: c[5],
        };
      })
      .reverse(); // Upstox returns newest first, reverse for chronological chart order

    return candles;
  } catch (err) {
    console.error('Failed to fetch Upstox candles:', err);
    return null;
  }
}

/**
 * Fetch Real-time Market Quote from Upstox API
 */
export async function fetchUpstoxMarketQuote(symbol: string): Promise<Partial<StockQuote> | null> {
  const instrumentKey = UPSTOX_INSTRUMENT_MAP[symbol] || UPSTOX_INSTRUMENT_MAP['RELIANCE'];
  const formattedSymbol = `NSE_EQ:${symbol}`;

  try {
    const response = await fetch(
      `https://api.upstox.com/v2/market-quote/quotes?symbol=${encodeURIComponent(formattedSymbol)}`,
      {
        headers: {
          Accept: 'application/json',
          'Api-Version': '2.0',
        },
      }
    );

    if (!response.ok) return null;

    const json = await response.json();
    if (json.status !== 'success' || !json.data || !json.data[formattedSymbol]) {
      return null;
    }

    const data = json.data[formattedSymbol];
    const ohlc = data.ohlc || {};

    return {
      symbol,
      price: data.last_price || ohlc.close,
      change: data.net_change || 0,
      changePercent: data.net_change && ohlc.close ? (data.net_change / ohlc.close) * 100 : 0,
      open: ohlc.open || data.last_price,
      dayHigh: ohlc.high || data.last_price,
      dayLow: ohlc.low || data.last_price,
      prevClose: ohlc.close || data.last_price,
      volume: data.volume || 0,
      vwap: data.average_price || data.last_price,
      lastUpdated: new Date().toLocaleTimeString('en-IN'),
    };
  } catch (err) {
    console.error('Error fetching Upstox market quote:', err);
    return null;
  }
}
