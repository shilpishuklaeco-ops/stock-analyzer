import { CandleData, IndicatorValues } from './types';

export function calculateSMA(data: CandleData[], period: number): { time: string; value: number }[] {
  const result: { time: string; value: number }[] = [];
  if (data.length < period) return result;

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({
      time: data[i].time,
      value: Number((sum / period).toFixed(2)),
    });
  }
  return result;
}

export function calculateEMA(data: CandleData[], period: number): { time: string; value: number }[] {
  const result: { time: string; value: number }[] = [];
  if (data.length < period) return result;

  const k = 2 / (period + 1);

  // Initial SMA for first EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  let prevEma = sum / period;
  result.push({
    time: data[period - 1].time,
    value: Number(prevEma.toFixed(2)),
  });

  for (let i = period; i < data.length; i++) {
    const currentEma = (data[i].close - prevEma) * k + prevEma;
    result.push({
      time: data[i].time,
      value: Number(currentEma.toFixed(2)),
    });
    prevEma = currentEma;
  }

  return result;
}

export function calculateRSI(data: CandleData[], period = 14): { time: string; value: number }[] {
  const result: { time: string; value: number }[] = [];
  if (data.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change >= 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);

  result.push({
    time: data[period].time,
    value: Number(rsi.toFixed(2)),
  });

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);

    result.push({
      time: data[i].time,
      value: Number(rsi.toFixed(2)),
    });
  }

  return result;
}

export function calculateMACD(
  data: CandleData[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): {
  time: string;
  macd: number;
  signal: number;
  histogram: number;
}[] {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);

  if (emaFast.length === 0 || emaSlow.length === 0) return [];

  // Align dates for Fast and Slow EMA
  const emaSlowMap = new Map(emaSlow.map((item) => [item.time, item.value]));
  const macdLine: { time: string; value: number }[] = [];

  for (const fast of emaFast) {
    if (emaSlowMap.has(fast.time)) {
      const slowVal = emaSlowMap.get(fast.time)!;
      macdLine.push({
        time: fast.time,
        value: Number((fast.value - slowVal).toFixed(2)),
      });
    }
  }

  if (macdLine.length < signalPeriod) return [];

  // Calculate Signal line (EMA of MACD line)
  const k = 2 / (signalPeriod + 1);
  let sum = 0;
  for (let i = 0; i < signalPeriod; i++) {
    sum += macdLine[i].value;
  }
  let prevSignal = sum / signalPeriod;

  const result: { time: string; macd: number; signal: number; histogram: number }[] = [];

  result.push({
    time: macdLine[signalPeriod - 1].time,
    macd: macdLine[signalPeriod - 1].value,
    signal: Number(prevSignal.toFixed(2)),
    histogram: Number((macdLine[signalPeriod - 1].value - prevSignal).toFixed(2)),
  });

  for (let i = signalPeriod; i < macdLine.length; i++) {
    const currentMacd = macdLine[i].value;
    const currentSignal = (currentMacd - prevSignal) * k + prevSignal;
    const currentHist = currentMacd - currentSignal;

    result.push({
      time: macdLine[i].time,
      macd: currentMacd,
      signal: Number(currentSignal.toFixed(2)),
      histogram: Number(currentHist.toFixed(2)),
    });

    prevSignal = currentSignal;
  }

  return result;
}

export function computeIndicatorSummary(data: CandleData[]): IndicatorValues {
  if (data.length < 50) {
    const last = data[data.length - 1] || { close: 100, high: 105, low: 95 };
    return {
      support1: Number((last.close * 0.98).toFixed(2)),
      support2: Number((last.close * 0.95).toFixed(2)),
      resistance1: Number((last.close * 1.02).toFixed(2)),
      resistance2: Number((last.close * 1.05).toFixed(2)),
      recommendation: 'NEUTRAL',
    };
  }

  const sma20Series = calculateSMA(data, 20);
  const sma50Series = calculateSMA(data, 50);
  const ema20Series = calculateEMA(data, 20);
  const rsiSeries = calculateRSI(data, 14);
  const macdSeries = calculateMACD(data);

  const currentClose = data[data.length - 1].close;
  const high = data[data.length - 1].high;
  const low = data[data.length - 1].low;

  const sma20 = sma20Series[sma20Series.length - 1]?.value;
  const sma50 = sma50Series[sma50Series.length - 1]?.value;
  const ema20 = ema20Series[ema20Series.length - 1]?.value;
  const rsi = rsiSeries[rsiSeries.length - 1]?.value ?? 50;
  const macdLast = macdSeries[macdSeries.length - 1];

  // Pivot calculations
  const pivot = (high + low + currentClose) / 3;
  const r1 = 2 * pivot - low;
  const s1 = 2 * pivot - high;
  const r2 = pivot + (high - low);
  const s2 = pivot - (high - low);

  // Bullish / Bearish scoring
  let score = 0;
  if (rsi > 50) score += 1;
  if (rsi > 60) score += 1;
  if (rsi < 40) score -= 1;
  if (rsi < 30) score -= 1;

  if (sma20 && currentClose > sma20) score += 1;
  else score -= 1;

  if (sma50 && currentClose > sma50) score += 1;
  else score -= 1;

  if (macdLast && macdLast.histogram > 0) score += 1.5;
  else score -= 1.5;

  let recommendation: IndicatorValues['recommendation'] = 'NEUTRAL';
  if (score >= 3.5) recommendation = 'STRONG_BUY';
  else if (score >= 1.5) recommendation = 'BUY';
  else if (score <= -3.5) recommendation = 'STRONG_SELL';
  else if (score <= -1.5) recommendation = 'SELL';

  return {
    sma20,
    sma50,
    ema20,
    rsi,
    macd: macdLast?.macd,
    macdSignal: macdLast?.signal,
    macdHist: macdLast?.histogram,
    support1: Number(s1.toFixed(2)),
    support2: Number(s2.toFixed(2)),
    resistance1: Number(r1.toFixed(2)),
    resistance2: Number(r2.toFixed(2)),
    recommendation,
  };
}
