export interface StockQuote {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  yearHigh: number;
  yearLow: number;
  open: number;
  prevClose: number;
  volume: number;
  marketCap: string;
  vwap: number;
  buyPercent: number;
  sellPercent: number;
  lastUpdated: string;
}

export interface LiveIndexQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface CandleData {

  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorValues {
  sma20?: number;
  sma50?: number;
  ema20?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
}

export interface NiftyStock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  volume: number;
}

export interface OrderBookItem {
  price: number;
  quantity: number;
  orders: number;
}

export interface RecentTrade {
  id: string;
  time: string;
  price: number;
  quantity: number;
  type: 'BUY' | 'SELL';
}

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  snippet: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface FundamentalData {
  symbol: string;
  peRatio: number;
  pbRatio: number;
  industryPe: number;
  debtToEquity: number;
  roePercent: number;
  rocePercent: number;
  dividendYield: number;
  piotroskiScore: number; // 0 to 9
  valuationStatus: 'UNDERVALUED' | 'FAIRLY_VALUED' | 'OVERVALUED';
  salesGrowthYoY: number;
  profitGrowthYoY: number;
  freeCashFlowCr: number;
  marketCapCr: number;
}

export type GridMode = 'SINGLE' | 'DUAL' | 'QUAD';

export interface ChartPanelConfig {
  id: string;
  symbol: string;
  timeframe: '1D' | '1W' | '1M' | '1Y' | 'ALL';
}

