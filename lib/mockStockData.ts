import { StockQuote, CandleData, NiftyStock, OrderBookItem, RecentTrade } from './types';

/**
 * Deterministic Pseudo-Random Number Generator (PRNG) Seed Helper
 */
function createSeededPRNG(seedStr: string): () => number {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = (Math.imul(31, h) + seedStr.charCodeAt(i)) | 0;
  }
  return function () {
    h = (Math.imul(48271, h) % 2147483647) | 0;
    return (h & 2147483647) / 2147483647;
  };
}

export type NSESessionStatus = 'PRE_OPEN' | 'LIVE' | 'CLOSED';

export interface LiveIndexQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

/**
 * Baseline Indian Market Major Benchmark Indices
 */
export const INITIAL_MARKET_INDICES: LiveIndexQuote[] = [
  { symbol: 'NIFTY50', name: 'NIFTY 50', price: 24541.15, change: 112.40, changePercent: 0.46 },
  { symbol: 'SENSEX', name: 'SENSEX', price: 80436.84, change: 415.20, changePercent: 0.52 },
  { symbol: 'BANKNIFTY', name: 'BANK NIFTY', price: 50803.15, change: 192.10, changePercent: 0.38 },
  { symbol: 'NIFTYIT', name: 'NIFTY IT', price: 38920.50, change: -240.10, changePercent: -0.61 },
  { symbol: 'NIFTYAUTO', name: 'NIFTY AUTO', price: 26140.80, change: 310.50, changePercent: 1.20 },
  { symbol: 'NIFTYPHARMA', name: 'NIFTY PHARMA', price: 22410.30, change: 180.20, changePercent: 0.81 },
];

/**
 * Get detailed National Stock Exchange (NSE) trading session status.
 * - 09:00 AM to 09:15 AM IST: PRE_OPEN
 * - 09:15 AM to 03:30 PM IST: LIVE
 * - Outside Market Hours & Weekends: CLOSED
 */
export function getNSESessionStatus(): NSESessionStatus {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', hour12: false };
  const dayStr = new Intl.DateTimeFormat('en-US', { ...options, weekday: 'short' }).format(now);

  if (dayStr === 'Sat' || dayStr === 'Sun') return 'CLOSED';

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const parts = timeFormatter.formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);

  const totalMinutes = hour * 60 + minute;
  const preOpenStart = 9 * 60;      // 09:00 AM IST
  const marketStart = 9 * 60 + 15;  // 09:15 AM IST
  const marketEnd = 15 * 60 + 30;   // 03:30 PM IST

  if (totalMinutes >= preOpenStart && totalMinutes < marketStart) return 'PRE_OPEN';
  if (totalMinutes >= marketStart && totalMinutes <= marketEnd) return 'LIVE';
  return 'CLOSED';
}

/**
 * Check if National Stock Exchange (NSE) is currently in open market session.
 */
export function isNSEMarketOpen(): boolean {
  const status = getNSESessionStatus();
  return status === 'LIVE' || status === 'PRE_OPEN';
}

// Calibrated Nifty 50 constituents data matching Real NSE Closing Prices
export const NIFTY_50_STOCKS: NiftyStock[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy', price: 1316.00, change: 7.30, changePercent: 0.56, marketCap: 1780000, volume: 12420150 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', price: 2313.20, change: -18.40, changePercent: -0.79, marketCap: 837000, volume: 2150400 },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT', price: 1139.90, change: 12.80, changePercent: 1.14, marketCap: 473000, volume: 4890100 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking', price: 729.00, change: 5.50, changePercent: 0.76, marketCap: 555000, volume: 8900150 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking', price: 1415.30, change: 15.20, changePercent: 1.09, marketCap: 995000, volume: 6450000 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', price: 1061.20, change: -6.10, changePercent: -0.57, marketCap: 947000, volume: 9120400 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom', price: 1969.30, change: 28.40, changePercent: 1.46, marketCap: 1155000, volume: 3800000 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Automobile', price: 712.90, change: 8.75, changePercent: 1.24, marketCap: 262000, volume: 5410000 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Inds', sector: 'Pharma', price: 1882.00, change: 24.60, changePercent: 1.32, marketCap: 451000, volume: 2100000 },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG', price: 472.35, change: 4.10, changePercent: 0.87, marketCap: 589000, volume: 7120000 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', sector: 'Automobile', price: 2910.80, change: -32.40, changePercent: -1.10, marketCap: 361000, volume: 1980000 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG', price: 2740.00, change: -12.30, changePercent: -0.45, marketCap: 643000, volume: 1450000 },
  { symbol: 'L&T', name: 'Larsen & Toubro Ltd', sector: 'Construction', price: 3620.00, change: -45.00, changePercent: -1.23, marketCap: 497000, volume: 1850000 },
  { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Energy', price: 395.70, change: 8.20, changePercent: 2.12, marketCap: 383000, volume: 11200000 },
  { symbol: 'POWERGRID', name: 'Power Grid Corp of India', sector: 'Energy', price: 342.10, change: 5.40, changePercent: 1.60, marketCap: 318000, volume: 8500000 },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Metals', price: 158.40, change: -2.10, changePercent: -1.31, marketCap: 197000, volume: 14200000 },
];

export const INITIAL_RELIANCE_QUOTE: StockQuote = {
  symbol: 'RELIANCE',
  name: 'Reliance Industries Ltd.',
  sector: 'Oil & Gas / Conglomerate',
  price: 1316.00,
  change: 7.30,
  changePercent: 0.56,
  dayHigh: 1328.00,
  dayLow: 1304.50,
  yearHigh: 1608.80,
  yearLow: 1180.20,
  open: 1310.00,
  prevClose: 1308.70,
  volume: 12420150,
  marketCap: '₹17.80 Lakh Cr',
  vwap: 1314.40,
  buyPercent: 64,
  sellPercent: 36,
  lastUpdated: new Date().toLocaleTimeString('en-IN'),
};

/**
 * Deterministic Candlestick Generator using PRNG seed
 */
export function generateCandleData(symbol: string, timeframe: '1D' | '1W' | '1M' | '1Y' | 'ALL'): CandleData[] {
  const stock = NIFTY_50_STOCKS.find((s) => s.symbol === symbol) || NIFTY_50_STOCKS[0];
  const basePrice = stock.price;

  const rng = createSeededPRNG(`${symbol}-${timeframe}-2026-08-18`);

  let pointsCount = 100;
  let intervalDays = 1;

  if (timeframe === '1D') {
    pointsCount = 78;
    return generateIntradayCandles(basePrice, pointsCount, rng);
  } else if (timeframe === '1W') {
    pointsCount = 35;
    intervalDays = 0.2;
  } else if (timeframe === '1M') {
    pointsCount = 30;
    intervalDays = 1;
  } else if (timeframe === '1Y') {
    pointsCount = 250;
    intervalDays = 1;
  } else {
    pointsCount = 500;
    intervalDays = 2;
  }

  const candles: CandleData[] = [];
  const now = new Date();
  let currentPrice = basePrice * 0.85;

  for (let i = pointsCount; i >= 0; i--) {
    const d = new Date(now.getTime() - i * intervalDays * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];

    const volatility = basePrice * 0.015;
    const randomChange = (rng() - 0.48) * volatility;
    const open = currentPrice;
    const close = Math.max(10, open + randomChange);
    const high = Math.max(open, close) + rng() * volatility * 0.5;
    const low = Math.min(open, close) - rng() * volatility * 0.5;
    const volume = Math.floor(rng() * 500000 + 100000);

    candles.push({
      time: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    currentPrice = close;
  }

  if (candles.length > 0) {
    const last = candles[candles.length - 1];
    last.close = basePrice;
    if (basePrice > last.high) last.high = basePrice;
    if (basePrice < last.low) last.low = basePrice;
  }

  return candles;
}

function generateIntradayCandles(basePrice: number, points: number, rng: () => number): CandleData[] {
  const candles: CandleData[] = [];
  const startHour = 9;
  const startMin = 15;

  let currentPrice = basePrice * 0.994;
  const todayStr = '2026-08-18';

  for (let i = 0; i < points; i++) {
    const totalMinutes = startMin + i * 5;
    const hour = startHour + Math.floor(totalMinutes / 60);
    const min = totalMinutes % 60;
    const timeFormatted = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

    const candleTime = `${todayStr} ${timeFormatted}`;

    const volatility = basePrice * 0.003;
    const randomChange = (rng() - 0.49) * volatility;
    const open = currentPrice;
    const close = Math.max(10, open + randomChange);
    const high = Math.max(open, close) + rng() * volatility * 0.3;
    const low = Math.min(open, close) - rng() * volatility * 0.3;
    const volume = Math.floor(rng() * 45000 + 5000);

    candles.push({
      time: candleTime,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

export function generateOrderBook(currentPrice: number): { bids: OrderBookItem[]; asks: OrderBookItem[] } {
  const bids: OrderBookItem[] = [];
  const asks: OrderBookItem[] = [];

  for (let i = 1; i <= 5; i++) {
    const bidPrice = currentPrice - i * 0.25;
    const askPrice = currentPrice + i * 0.25;
    bids.push({
      price: Number(bidPrice.toFixed(2)),
      quantity: Math.floor(Math.sin(i * 1.5) * 400 + 600),
      orders: Math.floor(Math.cos(i) * 5 + 8),
    });
    asks.push({
      price: Number(askPrice.toFixed(2)),
      quantity: Math.floor(Math.cos(i * 1.5) * 400 + 600),
      orders: Math.floor(Math.sin(i) * 5 + 8),
    });
  }

  return { bids, asks };
}

export function generateRecentTrades(currentPrice: number): RecentTrade[] {
  const trades: RecentTrade[] = [];
  const now = new Date();

  for (let i = 0; i < 8; i++) {
    const time = new Date(now.getTime() - i * 3000).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const type: 'BUY' | 'SELL' = i % 2 === 0 ? 'BUY' : 'SELL';
    const price = currentPrice + (type === 'BUY' ? 0.1 : -0.1) * 0.5;

    trades.push({
      id: `tr-${i}`,
      time,
      price: Number(price.toFixed(2)),
      quantity: Math.floor(i * 40 + 100),
      type,
    });
  }

  return trades;
}
