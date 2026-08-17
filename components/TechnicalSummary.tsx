'use client';

import React from 'react';
import { IndicatorValues } from '@/lib/types';
import { ShieldCheck, ArrowUpRight, ArrowDownRight, Compass, Zap, Target } from 'lucide-react';

interface TechnicalSummaryProps {
  indicators: IndicatorValues;
  currentPrice: number;
}

export const TechnicalSummary: React.FC<TechnicalSummaryProps> = ({ indicators, currentPrice }) => {
  const getRecommendationBadge = () => {
    switch (indicators.recommendation) {
      case 'STRONG_BUY':
        return { text: 'STRONG BUY', bg: 'bg-emerald-500 text-neutral-950', border: 'border-emerald-400' };
      case 'BUY':
        return { text: 'BUY', bg: 'bg-emerald-950 text-emerald-400', border: 'border-emerald-700' };
      case 'STRONG_SELL':
        return { text: 'STRONG SELL', bg: 'bg-rose-600 text-white', border: 'border-rose-500' };
      case 'SELL':
        return { text: 'SELL', bg: 'bg-rose-950 text-rose-400', border: 'border-rose-700' };
      default:
        return { text: 'NEUTRAL', bg: 'bg-neutral-800 text-neutral-300', border: 'border-neutral-700' };
    }
  };

  const rec = getRecommendationBadge();
  const rsi = indicators.rsi ?? 50;
  const rsiStatus = rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral / Healthy';

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-neutral-100 tracking-tight">Technical Analysis Summary</h3>
        </div>

        <div
          className={`px-3 py-1 rounded-lg text-xs font-mono font-extrabold border shadow-sm ${rec.bg} ${rec.border}`}
        >
          {rec.text}
        </div>
      </div>

      {/* Main Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* RSI 14 Gauge */}
        <div className="bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-800/80">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-neutral-400 font-medium">RSI (14) Indicator</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{rsi.toFixed(1)}</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden flex border border-neutral-800 relative">
            <div
              className={`h-full transition-all duration-500 ${
                rsi > 70 ? 'bg-amber-500' : rsi < 30 ? 'bg-cyan-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, rsi))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-neutral-500 mt-1.5 font-mono">
            <span>30 (Oversold)</span>
            <span className="text-neutral-400">{rsiStatus}</span>
            <span>70 (Overbought)</span>
          </div>
        </div>

        {/* MACD Signal */}
        <div className="bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-800/80">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-neutral-400 font-medium">MACD (12, 26, 9)</span>
            <span
              className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                (indicators.macdHist ?? 0) >= 0
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}
            >
              {(indicators.macdHist ?? 0) >= 0 ? 'Bullish Crossover' : 'Bearish Crossover'}
            </span>
          </div>
          <div className="grid grid-cols-3 text-center text-xs font-mono gap-1 pt-1">
            <div className="bg-neutral-900 p-1 rounded border border-neutral-800">
              <span className="text-[10px] text-neutral-500 block">MACD</span>
              <span className="text-neutral-200">{indicators.macd?.toFixed(2) ?? 'N/A'}</span>
            </div>
            <div className="bg-neutral-900 p-1 rounded border border-neutral-800">
              <span className="text-[10px] text-neutral-500 block">Signal</span>
              <span className="text-neutral-200">{indicators.macdSignal?.toFixed(2) ?? 'N/A'}</span>
            </div>
            <div className="bg-neutral-900 p-1 rounded border border-neutral-800">
              <span className="text-[10px] text-neutral-500 block">Hist</span>
              <span className={(indicators.macdHist ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {indicators.macdHist?.toFixed(2) ?? 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Moving Averages Comparison */}
      <div className="bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-800/80">
        <div className="text-xs font-medium text-neutral-400 mb-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> Moving Average Alignment
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          <div className="flex flex-col items-center p-2 bg-neutral-900 rounded-lg border border-neutral-800">
            <span className="text-[10px] text-blue-400 font-semibold">SMA 20</span>
            <span className="text-neutral-200 mt-0.5">₹{indicators.sma20?.toFixed(2) ?? 'N/A'}</span>
            <span
              className={`text-[10px] mt-1 font-sans ${
                indicators.sma20 && currentPrice > indicators.sma20 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {indicators.sma20 && currentPrice > indicators.sma20 ? 'Price Above ▲' : 'Price Below ▼'}
            </span>
          </div>

          <div className="flex flex-col items-center p-2 bg-neutral-900 rounded-lg border border-neutral-800">
            <span className="text-[10px] text-amber-400 font-semibold">SMA 50</span>
            <span className="text-neutral-200 mt-0.5">₹{indicators.sma50?.toFixed(2) ?? 'N/A'}</span>
            <span
              className={`text-[10px] mt-1 font-sans ${
                indicators.sma50 && currentPrice > indicators.sma50 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {indicators.sma50 && currentPrice > indicators.sma50 ? 'Price Above ▲' : 'Price Below ▼'}
            </span>
          </div>

          <div className="flex flex-col items-center p-2 bg-neutral-900 rounded-lg border border-neutral-800">
            <span className="text-[10px] text-purple-400 font-semibold">EMA 20</span>
            <span className="text-neutral-200 mt-0.5">₹{indicators.ema20?.toFixed(2) ?? 'N/A'}</span>
            <span
              className={`text-[10px] mt-1 font-sans ${
                indicators.ema20 && currentPrice > indicators.ema20 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {indicators.ema20 && currentPrice > indicators.ema20 ? 'Price Above ▲' : 'Price Below ▼'}
            </span>
          </div>
        </div>
      </div>

      {/* Support & Resistance Targets */}
      <div>
        <div className="text-xs font-medium text-neutral-400 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-cyan-400" /> Pivot Targets (Support & Resistance)
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">Floor / Ceiling Targets</span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-xs font-mono text-center">
          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60">
            <span className="text-[10px] text-emerald-400 font-semibold block">Resistance 2</span>
            <span className="text-neutral-200">₹{indicators.resistance2.toFixed(2)}</span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-900/40">
            <span className="text-[10px] text-emerald-300 font-semibold block">Resistance 1</span>
            <span className="text-neutral-200">₹{indicators.resistance1.toFixed(2)}</span>
          </div>
          <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-900/40">
            <span className="text-[10px] text-rose-300 font-semibold block">Support 1</span>
            <span className="text-neutral-200">₹{indicators.support1.toFixed(2)}</span>
          </div>
          <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/60">
            <span className="text-[10px] text-rose-400 font-semibold block">Support 2</span>
            <span className="text-neutral-200">₹{indicators.support2.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
