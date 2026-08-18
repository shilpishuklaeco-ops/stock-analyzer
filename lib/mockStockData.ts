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
 * Calibrated Indian Market Major Benchmark Indices (Synced to Real NSE Negative Sentiment)
 */
export const INITIAL_MARKET_INDICES: LiveIndexQuote[] = [
  { symbol: 'NIFTY50', name: 'NIFTY 50', price: 24382.40, change: -118.60, changePercent: -0.48 },
  { symbol: 'SENSEX', name: 'SENSEX', price: 79880.15, change: -420.30, changePercent: -0.52 },
  { symbol: 'BANKNIFTY', name: 'BANK NIFTY', price: 50115.80, change: -310.20, changePercent: -0.61 },
  { symbol: 'NIFTYIT', name: 'NIFTY IT', price: 38710.20, change: -450.10, changePercent: -1.15 },
  { symbol: 'NIFTYAUTO', name: 'NIFTY AUTO', price: 25890.40, change: -180.20, changePercent: -0.69 },
  { symbol: 'NIFTYPHARMA', name: 'NIFTY PHARMA', price: 22150.30, change: 45.20, changePercent: 0.20 },
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

// Calibrated Nifty 50 constituents data matching Real Upstox NSE Closing Prices
export const NIFTY_50_STOCKS: NiftyStock[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy', price: 1322.00, change: 6.00, changePercent: 0.45, marketCap: 1780000, volume: 10180567 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', price: 2280.00, change: -33.20, changePercent: -1.46, marketCap: 837000, volume: 1797822 },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT', price: 1115.00, change: -24.90, changePercent: -2.23, marketCap: 473000, volume: 8851110 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking', price: 723.00, change: -6.00, changePercent: -0.83, marketCap: 555000, volume: 17916507 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking', price: 1412.00, change: -3.30, changePercent: -0.23, marketCap: 995000, volume: 8345198 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', price: 1053.00, change: -8.20, changePercent: -0.78, marketCap: 947000, volume: 5583771 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom', price: 1934.20, change: -35.10, changePercent: -1.81, marketCap: 1155000, volume: 6710275 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Automobile', price: 712.90, change: 8.75, changePercent: 1.24, marketCap: 262000, volume: 5410000 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Inds', sector: 'Pharma', price: 1875.10, change: -6.90, changePercent: -0.37, marketCap: 451000, volume: 1819169 },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG', price: 270.00, change: -3.05, changePercent: -1.13, marketCap: 589000, volume: 14561572 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', sector: 'Automobile', price: 3421.50, change: 31.10, changePercent: 0.91, marketCap: 361000, volume: 1371664 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG', price: 2035.00, change: -20.00, changePercent: -0.98, marketCap: 643000, volume: 1234596 },
  { symbol: 'L&T', name: 'Larsen & Toubro Ltd', sector: 'Construction', price: 3620.00, change: -45.00, changePercent: -1.23, marketCap: 497000, volume: 1850000 },
  { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Energy', price: 337.10, change: 0.10, changePercent: 0.03, marketCap: 383000, volume: 9943991 },
  { symbol: 'POWERGRID', name: 'Power Grid Corp of India', sector: 'Energy', price: 268.00, change: 1.85, changePercent: 0.69, marketCap: 318000, volume: 6792173 },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Metals', price: 185.50, change: -0.50, changePercent: -0.27, marketCap: 197000, volume: 13393441 },
];

export const INITIAL_RELIANCE_QUOTE: StockQuote = {
  symbol: 'RELIANCE',
  name: 'Reliance Industries Ltd.',
  sector: 'Oil & Gas / Conglomerate',
  price: 1322.00,
  change: 6.00,
  changePercent: 0.45,
  dayHigh: 1328.60,
  dayLow: 1311.20,
  yearHigh: 1608.80,
  yearLow: 1180.20,
  open: 1314.00,
  prevClose: 1316.00,
  volume: 10180567,
  marketCap: '₹17.80 Lakh Cr',
  vwap: 1322.76,
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
    pointsCount = 52;
    intervalDays = 7;
  } else {
    pointsCount = 120;
    intervalDays = 15;
  }

  const candles: CandleData[] = [];
  let currentPrice = basePrice * 0.88;
  const now = new Date();

  for (let i = pointsCount; i >= 0; i--) {
    const d = new Date(now.getTime() - i * intervalDays * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];

    const changePercent = (rng() - 0.48) * 0.03;
    const open = Number(currentPrice.toFixed(2));
    const close = Number((open * (1 + changePercent)).toFixed(2));
    const high = Number((Math.max(open, close) * (1 + rng() * 0.012)).toFixed(2));
    const low = Number((Math.min(open, close) * (1 - rng() * 0.012)).toFixed(2));
    const volume = Math.floor(rng() * 400000 + 100000);

    candles.push({
      time: dateStr,
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  // Ensure last candle matches basePrice exactly
  if (candles.length > 0) {
    const last = candles[candles.length - 1];
    last.close = basePrice;
    if (basePrice > last.high) last.high = basePrice;
    if (basePrice < last.low) last.low = basePrice;
  }

  return candles;
}

function generateIntradayCandles(basePrice: number, count: number, rng: () => number): CandleData[] {
  const candles: CandleData[] = [];
  let currentPrice = basePrice * 0.995;
  const baseTime = new Date();
  baseTime.setHours(9, 15, 0, 0);

  for (let i = 0; i < count; i++) {
    const timeStr = new Date(baseTime.getTime() + i * 5 * 60 * 1000).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const delta = (rng() - 0.49) * 2.5;
    const open = Number(currentPrice.toFixed(2));
    const close = Number((open + delta).toFixed(2));
    const high = Number((Math.max(open, close) + rng() * 1.2).toFixed(2));
    const low = Number((Math.min(open, close) - rng() * 1.2).toFixed(2));
    const volume = Math.floor(rng() * 15000 + 1500);

    candles.push({
      time: timeStr,
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  // Pin last candle to exact basePrice
  if (candles.length > 0) {
    const last = candles[candles.length - 1];
    last.close = basePrice;
    if (basePrice > last.high) last.high = basePrice;
    if (basePrice < last.low) last.low = basePrice;
  }

  return candles;
}

export function generateOrderBook(price: number): { bids: OrderBookItem[]; asks: OrderBookItem[] } {
  const bids: OrderBookItem[] = [];
  const asks: OrderBookItem[] = [];

  for (let i = 1; i <= 5; i++) {
    const bidPrice = Number((price - i * 0.35).toFixed(2));
    const askPrice = Number((price + i * 0.35).toFixed(2));
    const bidQty = Math.floor(Math.random() * 800 + 120);
    const askQty = Math.floor(Math.random() * 800 + 120);

    bids.push({
      price: bidPrice,
      quantity: bidQty,
      orders: Math.floor(Math.random() * 12 + 1),
    });

    asks.push({
      price: askPrice,
      quantity: askQty,
      orders: Math.floor(Math.random() * 12 + 1),
    });
  }

  return { bids, asks };
}

export function generateRecentTrades(price: number): RecentTrade[] {
  const trades: RecentTrade[] = [];
  const now = new Date();

  for (let i = 0; i < 8; i++) {
    const tradeTime = new Date(now.getTime() - i * 4000).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const isBuy = Math.random() > 0.48;
    const delta = (Math.random() * 0.4 - 0.2) * (isBuy ? 1 : -1);
    const tradePrice = Number((price + delta).toFixed(2));

    trades.push({
      id: Math.random().toString(36).substring(2, 9),
      time: tradeTime,
      price: tradePrice,
      quantity: Math.floor(Math.random() * 250 + 10),
      type: isBuy ? 'BUY' : 'SELL',
    });
  }

  return trades;
}
