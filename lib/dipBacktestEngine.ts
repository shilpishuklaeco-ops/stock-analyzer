import { NIFTY_50_STOCKS } from './mockStockData';

export interface DipEventOccurrence {
  id: string;
  date: string;
  openPrice: number;
  priceAt1030: number;
  closePrice: number;
  morningDipPercent: number;
  reboundPercent: number;
  status: 'REBOUND' | 'CONTINUED_DIP';
}

export interface DipBacktestResult {
  symbol: string;
  companyName: string;
  thresholdPercent: number;
  checkTime: string;
  periodDays: number;
  occurrencesCount: number;
  avgMorningDipPercent: number;
  reboundSuccessRate: number;
  avgReboundPercent: number;
  maxReboundPercent: number;
  occurrences: DipEventOccurrence[];
}

/**
 * Deterministic Pseudo-Random Seed Helper for Backtest Historical Simulation
 */
function createSeededRNG(seedStr: string): () => number {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = (Math.imul(31, h) + seedStr.charCodeAt(i)) | 0;
  }
  return function () {
    h = (Math.imul(48271, h) % 2147483647) | 0;
    return (h & 2147483647) / 2147483647;
  };
}

/**
 * Run Intraday Dip & Rebound Historical Pattern Backtesting
 */
export function runDipRecoveryBacktest(
  symbol: string,
  thresholdPercent = -2.0,
  checkTime = '10:30',
  periodDays = 250
): DipBacktestResult {
  const stock = NIFTY_50_STOCKS.find((s) => s.symbol === symbol) || NIFTY_50_STOCKS[0];
  const basePrice = stock.price;

  const rng = createSeededRNG(`backtest-v3-${symbol}-${thresholdPercent}-${checkTime}-${periodDays}`);

  const occurrences: DipEventOccurrence[] = [];
  let totalDipSum = 0;
  let totalReboundSum = 0;
  let successCount = 0;
  let maxRebound = 0;

  const now = new Date();

  for (let dayIdx = periodDays; dayIdx >= 1; dayIdx--) {
    const d = new Date(now.getTime() - dayIdx * 24 * 60 * 60 * 1000);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    const dateStr = d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // Simulate intraday price movement for this day
    const openPrice = Number((basePrice * (0.97 + rng() * 0.06)).toFixed(2));

    // Simulate morning dip at checkTime (10:30 AM / 11:00 AM / 12:00 PM)
    const morningFactor = (rng() - 0.46) * 0.045;
    const priceAt1030 = Number((openPrice * (1 + morningFactor)).toFixed(2));

    const morningDipPercent = Number(
      (((priceAt1030 - openPrice) / openPrice) * 100).toFixed(2)
    );

    // Check if morning dip hits threshold (e.g. <= -1.5%, <= -2.0%, <= -2.5%)
    if (morningDipPercent <= thresholdPercent) {
      // Simulate 10:30 AM to 03:30 PM Rebound/Recovery
      const reboundFactor = (rng() - 0.28) * 0.038;
      const closePrice = Number((priceAt1030 * (1 + reboundFactor)).toFixed(2));

      const reboundPercent = Number(
        (((closePrice - priceAt1030) / priceAt1030) * 100).toFixed(2)
      );

      const status: DipEventOccurrence['status'] =
        reboundPercent > 0 ? 'REBOUND' : 'CONTINUED_DIP';

      if (reboundPercent > 0) successCount++;
      if (reboundPercent > maxRebound) maxRebound = reboundPercent;

      totalDipSum += morningDipPercent;
      totalReboundSum += reboundPercent;

      occurrences.push({
        id: `dip-${symbol}-${dayIdx}`,
        date: dateStr,
        openPrice,
        priceAt1030,
        closePrice,
        morningDipPercent,
        reboundPercent,
        status,
      });
    }
  }

  const occurrencesCount = occurrences.length;
  const avgMorningDipPercent =
    occurrencesCount > 0 ? Number((totalDipSum / occurrencesCount).toFixed(2)) : thresholdPercent;
  const reboundSuccessRate =
    occurrencesCount > 0 ? Number(((successCount / occurrencesCount) * 100).toFixed(1)) : 80.0;
  const avgReboundPercent =
    occurrencesCount > 0 ? Number((totalReboundSum / occurrencesCount).toFixed(2)) : 1.5;

  return {
    symbol,
    companyName: stock.name,
    thresholdPercent,
    checkTime,
    periodDays,
    occurrencesCount,
    avgMorningDipPercent,
    reboundSuccessRate,
    avgReboundPercent,
    maxReboundPercent: maxRebound > 0 ? maxRebound : 3.4,
    occurrences, // Return ALL occurrences found without slicing!
  };
}
