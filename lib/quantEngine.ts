import { CandleData, StockQuote } from './types';
import { calculateSMA, calculateRSI, calculateMACD } from './indicators';

export interface AIForecastResult {
  symbol: string;
  currentPrice: number;
  targetPrice: number;
  targetPercent: number;
  stopLossPrice: number;
  stopLossPercent: number;
  riskRewardRatio: number;
  confidenceScore: number;
  signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  atr: number;
  bollingerState: 'SQUEEZE_BREAKOUT' | 'EXPANDING_BULLISH' | 'NORMAL' | 'HIGH_VOLATILITY';
  relativeStrengthVsNifty: number;
  volumeAccumulation: 'INSTITUTIONAL_BUYING' | 'ABOVE_AVERAGE' | 'NORMAL' | 'LOW_VOLUME';
  keyDrivers: string[];
}

/**
 * Calculate Average True Range (ATR 14)
 */
export function calculateATR(candles: CandleData[], period = 14): number {
  if (candles.length < period + 1) return candles[candles.length - 1]?.close * 0.02 || 5;

  let trSum = 0;
  for (let i = 1; i <= period; i++) {
    const idx = candles.length - i;
    const current = candles[idx];
    const prev = candles[idx - 1];

    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trSum += tr;
  }

  return Number((trSum / period).toFixed(2));
}

/**
 * Perform Quantitative Multi-Factor AI Price Target Forecasting
 */
export function computeAIForecast(
  symbol: string,
  quote: StockQuote,
  candles: CandleData[]
): AIForecastResult {
  const price = quote.price;

  // 1. Calculate Volatility via ATR (14)
  const atr = calculateATR(candles, 14);

  // 2. Technical Indicators Signals
  const rsiSeries = calculateRSI(candles, 14);
  const rsi = rsiSeries.length > 0 ? rsiSeries[rsiSeries.length - 1].value : 52;

  const macdSeries = calculateMACD(candles);
  const macdHist = macdSeries.length > 0 ? macdSeries[macdSeries.length - 1].histogram : 0;

  const sma20Series = calculateSMA(candles, 20);
  const sma20 = sma20Series.length > 0 ? sma20Series[sma20Series.length - 1].value : price;

  const sma50Series = calculateSMA(candles, 50);
  const sma50 = sma50Series.length > 0 ? sma50Series[sma50Series.length - 1].value : price;

  // 3. Compute Quant Factors & Scores
  let bullScore = 0;
  const keyDrivers: string[] = [];

  // Factor A: Momentum (RSI & MACD)
  if (rsi > 50 && rsi < 70) {
    bullScore += 25;
    keyDrivers.push(`RSI (${rsi.toFixed(1)}) in Healthy Momentum Expansion Zone`);
  } else if (rsi <= 35) {
    bullScore += 30;
    keyDrivers.push(`RSI (${rsi.toFixed(1)}) in Oversold Reversal Bargain Zone`);
  } else if (rsi >= 75) {
    bullScore -= 15;
    keyDrivers.push(`RSI (${rsi.toFixed(1)}) Overbought Risk Warning`);
  }

  if (macdHist > 0) {
    bullScore += 25;
    keyDrivers.push(`MACD Positive Histogram Crossover (+${macdHist.toFixed(2)})`);
  } else {
    bullScore -= 10;
  }

  // Factor B: Trend Alignment (Price vs SMA20 & SMA50)
  if (price > sma20 && price > sma50) {
    bullScore += 25;
    keyDrivers.push(`Price trading above SMA 20 (₹${sma20.toFixed(2)}) and SMA 50 (Golden Alignment)`);
  } else if (price > sma20) {
    bullScore += 15;
  }

  // Factor C: Order Book Sentiment
  if (quote.buyPercent >= 58) {
    bullScore += 15;
    keyDrivers.push(`High NSE Buyer Demand (${quote.buyPercent}% Buy Depth vs ${quote.sellPercent}% Sell)`);
  }

  // Factor D: Volume Accumulation
  const recentVolumes = candles.slice(-20).map((c) => c.volume);
  const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / (recentVolumes.length || 1);
  const volumeRatio = quote.volume / (avgVolume || 1);

  let volumeAccumulation: AIForecastResult['volumeAccumulation'] = 'NORMAL';
  if (volumeRatio >= 1.75) {
    volumeAccumulation = 'INSTITUTIONAL_BUYING';
    bullScore += 10;
    keyDrivers.push(`Institutional Accumulation Detected: Volume ${volumeRatio.toFixed(1)}x 20-Day Avg`);
  } else if (volumeRatio >= 1.25) {
    volumeAccumulation = 'ABOVE_AVERAGE';
  }

  // Factor E: Bollinger Band Squeeze
  const last20Closes = candles.slice(-20).map((c) => c.close);
  const variance =
    last20Closes.reduce((acc, val) => acc + Math.pow(val - sma20, 2), 0) / (last20Closes.length || 1);
  const stdDev = Math.sqrt(variance);
  const bandWidth = (4 * stdDev) / (sma20 || 1);

  let bollingerState: AIForecastResult['bollingerState'] = 'NORMAL';
  if (bandWidth < 0.035) {
    bollingerState = 'SQUEEZE_BREAKOUT';
    keyDrivers.push('Bollinger Band Squeeze Alert: High probability of explosive volatility breakout');
  } else if (price > sma20 + stdDev) {
    bollingerState = 'EXPANDING_BULLISH';
  }

  // 4. Calculate Relative Strength vs Nifty 50 (+0.46% Benchmark)
  const stock5DayReturn = candles.length >= 5
    ? ((price - candles[candles.length - 5].close) / candles[candles.length - 5].close) * 100
    : quote.changePercent;
  const relativeStrengthVsNifty = Number((stock5DayReturn - 0.46).toFixed(2));

  if (relativeStrengthVsNifty > 1.5) {
    keyDrivers.push(`Outperforming Nifty 50 Index by +${relativeStrengthVsNifty.toFixed(2)}% (Alpha Leader)`);
  }

  // 5. Final Signal & Target/Stop-Loss Calculation
  let confidenceScore = Math.min(95, Math.max(25, bullScore + 10));

  let isBullishSignal = bullScore >= 40;
  let signal: AIForecastResult['signal'] = 'NEUTRAL';

  if (bullScore >= 75) signal = 'STRONG_BUY';
  else if (bullScore >= 45) signal = 'BUY';
  else if (bullScore <= 15) signal = 'STRONG_SELL';
  else if (bullScore <= 30) signal = 'SELL';

  // Target multiplier based on ATR
  const targetMultiplier = isBullishSignal ? 1.85 : -1.85;
  const stopMultiplier = isBullishSignal ? -0.85 : 0.85;

  const targetPrice = Number((price + targetMultiplier * atr).toFixed(2));
  const stopLossPrice = Number((price + stopMultiplier * atr).toFixed(2));

  const targetPercent = Number((((targetPrice - price) / price) * 100).toFixed(2));
  const stopLossPercent = Number((Math.abs((price - stopLossPrice) / price) * 100).toFixed(2));

  const riskRewardRatio = Number(
    (Math.abs(targetPercent) / (Math.abs(stopLossPercent) || 0.1)).toFixed(2)
  );

  return {
    symbol,
    currentPrice: price,
    targetPrice,
    targetPercent,
    stopLossPrice,
    stopLossPercent,
    riskRewardRatio: Math.max(1.1, riskRewardRatio),
    confidenceScore,
    signal,
    atr,
    bollingerState,
    relativeStrengthVsNifty,
    volumeAccumulation,
    keyDrivers: keyDrivers.slice(0, 4),
  };
}
