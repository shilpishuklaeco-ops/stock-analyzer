'use client';

import React, { useState, useEffect } from 'react';
import { AIForecastResult } from '@/lib/quantEngine';
import { Bot, Target, Shield, Scale, Sparkles, TrendingUp, TrendingDown, CheckCircle2, Zap, Calendar, Info } from 'lucide-react';

interface AIForecastCardProps {
  symbol: string;
}

export const AIForecastCard: React.FC<AIForecastCardProps> = ({ symbol }) => {
  const [forecast, setForecast] = useState<AIForecastResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [horizon, setHorizon] = useState<'7D' | '30D'>('7D');

  useEffect(() => {
    async function fetchForecast() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/ai-forecast?symbol=${symbol}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.forecast) {
            setForecast(data.forecast);
          }
        }
      } catch (err) {
        console.warn('AI Forecast fetch warning:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchForecast();
  }, [symbol]);

  const getSignalBadge = (sig?: AIForecastResult['signal']) => {
    switch (sig) {
      case 'STRONG_BUY':
        return { text: 'STRONG BUY 🟢', bg: 'bg-emerald-500 text-neutral-950', border: 'border-emerald-400' };
      case 'BUY':
        return { text: 'BUY 🟢', bg: 'bg-emerald-950 text-emerald-400', border: 'border-emerald-700' };
      case 'STRONG_SELL':
        return { text: 'STRONG SELL 🔴', bg: 'bg-rose-600 text-white', border: 'border-rose-500' };
      case 'SELL':
        return { text: 'SELL 🔴', bg: 'bg-rose-950 text-rose-400', border: 'border-rose-700' };
      default:
        return { text: 'NEUTRAL ⚪', bg: 'bg-neutral-800 text-neutral-300', border: 'border-neutral-700' };
    }
  };

  if (isLoading || !forecast) {
    return (
      <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl animate-pulse h-48" />
    );
  }

  // Horizon Multiplier for 30-Day View vs 7-Day View
  const multiplier = horizon === '30D' ? 2.2 : 1.0;
  const displayTargetPrice = Number((forecast.currentPrice + (forecast.targetPrice - forecast.currentPrice) * multiplier).toFixed(2));
  const displayTargetPercent = Number((forecast.targetPercent * multiplier).toFixed(2));
  const displayStopLossPrice = Number((forecast.currentPrice - (forecast.currentPrice - forecast.stopLossPrice) * multiplier).toFixed(2));
  const displayStopLossPercent = Number((forecast.stopLossPercent * multiplier).toFixed(2));

  const sig = getSignalBadge(forecast.signal);

  return (
    <div className="w-full bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-emerald-900/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-5 relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-800/80 text-emerald-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-2">
              🤖 AI QUANT PRICE TARGET & SIGNAL ENGINE
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-mono">
                {symbol}
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">ATR Volatility & Multi-Factor Quantitative Model</p>
          </div>
        </div>

        {/* Forecast Horizon Selector & Signal Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setHorizon('7D')}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-all ${
                horizon === '7D'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              7-Day
            </button>
            <button
              onClick={() => setHorizon('30D')}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-all ${
                horizon === '30D'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              30-Day
            </button>
          </div>

          <div className={`px-3 py-1 rounded-lg text-xs font-mono font-extrabold border shadow-md ${sig.bg} ${sig.border}`}>
            {sig.text}
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
        {/* Target Price */}
        <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800 flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
          <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Target className="w-3.5 h-3.5 text-emerald-400" /> {horizon} Target Price
            </span>
            <span className="font-mono text-[11px] font-bold text-emerald-400">
              +{displayTargetPercent}%
            </span>
          </div>
          <div className="text-xl font-extrabold font-mono text-white mt-1">
            ₹{displayTargetPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1 font-mono">ATR Bounded Upside Target</div>
        </div>

        {/* Stop Loss Level */}
        <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800 flex flex-col justify-between hover:border-rose-500/50 transition-colors">
          <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Shield className="w-3.5 h-3.5 text-rose-400" /> Stop-Loss Target
            </span>
            <span className="font-mono text-[11px] font-bold text-rose-400">
              -{displayStopLossPercent}%
            </span>
          </div>
          <div className="text-xl font-extrabold font-mono text-white mt-1">
            ₹{displayStopLossPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1 font-mono">Risk Protection Threshold</div>
        </div>

        {/* Risk / Reward Ratio */}
        <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800 flex flex-col justify-between hover:border-amber-500/50 transition-colors">
          <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Scale className="w-3.5 h-3.5 text-amber-400" /> Risk/Reward Ratio
            </span>
            <span className="font-mono text-[11px] font-bold text-amber-400">
              {forecast.riskRewardRatio} : 1
            </span>
          </div>
          <div className="text-xl font-extrabold font-mono text-white mt-1">
            {forecast.riskRewardRatio >= 2.0 ? 'Favorable 🟢' : 'Moderate ⚪'}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1 font-mono">Reward vs Risk Multiple</div>
        </div>

        {/* Confidence Probability */}
        <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800 flex flex-col justify-between hover:border-cyan-500/50 transition-colors">
          <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> AI Confidence
            </span>
            <span className="font-mono text-[11px] font-bold text-cyan-400">
              {forecast.confidenceScore}% High
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden flex border border-neutral-800 mt-2">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${forecast.confidenceScore}%` }}
            />
          </div>
          <div className="text-[10px] text-neutral-500 mt-1 font-mono">Probability Score</div>
        </div>
      </div>

      {/* Quant Drivers & Pattern Audit Bullet Points */}
      <div className="bg-neutral-950/90 p-4 rounded-xl border border-neutral-800 relative z-10">
        <div className="text-xs font-semibold text-neutral-300 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Key Quantitative Signal Drivers
          </span>
          <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
            <Info className="w-3 h-3" /> Multi-Factor Quantitative Audit
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {forecast.keyDrivers.map((driver, idx) => (
            <div key={idx} className="flex items-start gap-2 text-neutral-300 bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{driver}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
