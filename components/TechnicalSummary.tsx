'use client';

import React, { useState, useEffect } from 'react';
import { IndicatorValues } from '@/lib/types';
import { ShieldCheck, ArrowUpRight, ArrowDownRight, Compass, Zap, Target, Radio, Activity, Volume2, Sparkles, AlertCircle } from 'lucide-react';

interface TechnicalSummaryProps {
  indicators: IndicatorValues;
  currentPrice: number;
  symbol?: string;
}

interface CommentaryItem {
  id: string;
  time: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'BREAKOUT';
  badge: string;
  title: string;
  description: string;
}

export const TechnicalSummary: React.FC<TechnicalSummaryProps> = ({ indicators, currentPrice, symbol = 'RELIANCE' }) => {
  const [activeTab, setActiveTab] = useState<'INDICATORS' | 'COMMENTARY'>('INDICATORS');
  const [commentaryFeed, setCommentaryFeed] = useState<CommentaryItem[]>([]);

  // Generate dynamic commentary feed whenever price or indicators change
  useEffect(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const rsi = indicators.rsi ?? 50;
    const macdHist = indicators.macdHist ?? 0;
    const isAboveVwap = currentPrice >= indicators.support1;

    const initialFeed: CommentaryItem[] = [
      {
        id: 'c1',
        time: timeStr,
        type: isAboveVwap ? 'BULLISH' : 'BEARISH',
        badge: isAboveVwap ? '⚡ VWAP HOLD' : '⚠️ VWAP BREAKDOWN',
        title: `${symbol} Price Trading at ₹${currentPrice.toFixed(2)}`,
        description: isAboveVwap
          ? `Price is holding strongly above Pivot Support S1 (₹${indicators.support1.toFixed(2)}). Buyers maintaining control.`
          : `Price pulled back near Support S1 (₹${indicators.support1.toFixed(2)}). Watch for potential dip rebound zone.`,
      },
      {
        id: 'c2',
        time: new Date(now.getTime() - 45000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: macdHist >= 0 ? 'BULLISH' : 'NEUTRAL',
        badge: macdHist >= 0 ? '📊 MACD BULLISH' : '🌊 MACD CONTRACTION',
        title: macdHist >= 0 ? 'MACD Histogram Positive' : 'MACD Histogram Shrinking',
        description: macdHist >= 0
          ? `Histogram is expanding (+${macdHist.toFixed(2)}). Upward momentum accelerating into session.`
          : `Selling pressure drying up (${macdHist.toFixed(2)}). Rebound accumulation building at dip levels.`,
      },
      {
        id: 'c3',
        time: new Date(now.getTime() - 120000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: rsi > 70 ? 'BEARISH' : rsi < 30 ? 'BULLISH' : 'NEUTRAL',
        badge: rsi > 70 ? '🔥 OVERBOUGHT' : rsi < 30 ? '💎 OVERSOLD DIVERGENCE' : '🎯 RSI BALANCED',
        title: `RSI (14) Standing at ${rsi.toFixed(1)}`,
        description: rsi < 30
          ? `RSI dropped to oversold territory (${rsi.toFixed(1)}). High probability of intraday rebound.`
          : rsi > 70
          ? `RSI entering overbought territory (${rsi.toFixed(1)}). Watch for profit-booking resistance near R1.`
          : `RSI in healthy balanced zone (${rsi.toFixed(1)}). Stock displaying steady momentum structure.`,
      },
      {
        id: 'c4',
        time: new Date(now.getTime() - 240000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: 'BREAKOUT',
        badge: '🚀 SESSION OPENING',
        title: 'NSE Market Session Live',
        description: `Institutional volume active. Pivot Target R1 at ₹${indicators.resistance1.toFixed(2)} and Support S1 at ₹${indicators.support1.toFixed(2)}.`,
      },
    ];

    setCommentaryFeed(initialFeed);
  }, [currentPrice, indicators, symbol]);

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
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-5 min-h-[460px]">
      {/* Top Header with Interactive Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3 gap-2">
        <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveTab('INDICATORS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'INDICATORS'
                ? 'bg-neutral-800 text-emerald-400 border border-neutral-700 shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Indicators</span>
          </button>

          <button
            onClick={() => setActiveTab('COMMENTARY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
              activeTab === 'COMMENTARY'
                ? 'bg-neutral-800 text-emerald-400 border border-neutral-700 shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Live AI Commentary</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute top-1 right-1" />
          </button>
        </div>

        <div
          className={`px-3 py-1 rounded-lg text-xs font-mono font-extrabold border shadow-sm ${rec.bg} ${rec.border}`}
        >
          {rec.text}
        </div>
      </div>

      {/* TAB 1: Technical Indicators View */}
      {activeTab === 'INDICATORS' && (
        <div className="flex flex-col gap-4">
          {/* Main Indicators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* RSI 14 Gauge */}
            <div className="bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-800/80">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-neutral-400 font-medium">RSI (14) Indicator</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{rsi.toFixed(1)}</span>
              </div>
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
      )}

      {/* TAB 2: Live AI Market Commentary Stream View */}
      {activeTab === 'COMMENTARY' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>REAL-TIME STREAM ACTIVE</span>
            </div>
            <div className="text-[11px] font-mono text-neutral-400">
              Target: <strong className="text-neutral-200">{symbol}</strong>
            </div>
          </div>

          {/* Commentary Feed List */}
          <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1 no-scrollbar">
            {commentaryFeed.map((item) => (
              <div
                key={item.id}
                className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800/90 flex flex-col gap-1 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono border ${
                      item.type === 'BULLISH'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : item.type === 'BEARISH'
                        ? 'bg-rose-950 text-rose-400 border-rose-800'
                        : item.type === 'BREAKOUT'
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">{item.time}</span>
                </div>

                <div className="text-xs font-bold text-neutral-100 mt-0.5">{item.title}</div>
                <div className="text-[11px] text-neutral-400 leading-relaxed font-sans">{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
