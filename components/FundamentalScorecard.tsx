'use client';

import React, { useState, useEffect } from 'react';
import { FundamentalData } from '@/lib/types';
import { fetchUpstoxFundamentals } from '@/lib/upstoxClient';
import { Award, TrendingUp, ShieldCheck, DollarSign, Activity, AlertCircle, RefreshCw } from 'lucide-react';

interface FundamentalScorecardProps {
  symbol: string;
}

export const FundamentalScorecard: React.FC<FundamentalScorecardProps> = ({ symbol }) => {
  const [data, setData] = useState<FundamentalData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchUpstoxFundamentals(symbol).then((res) => {
      if (isMounted) {
        setData(res);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  if (loading) {
    return (
      <div className="w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl animate-pulse flex flex-col gap-4">
        <div className="h-6 bg-neutral-800 rounded w-1/3"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="h-16 bg-neutral-800/60 rounded-xl"></div>
          <div className="h-16 bg-neutral-800/60 rounded-xl"></div>
          <div className="h-16 bg-neutral-800/60 rounded-xl"></div>
          <div className="h-16 bg-neutral-800/60 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isUndervalued = data.valuationStatus === 'UNDERVALUED';
  const isOvervalued = data.valuationStatus === 'OVERVALUED';

  const valuationBadgeColor = isUndervalued
    ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
    : isOvervalued
    ? 'bg-rose-950/80 border-rose-700/60 text-rose-300'
    : 'bg-amber-950/80 border-amber-700/60 text-amber-300';

  const piotroskiColor =
    data.piotroskiScore >= 7
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40'
      : data.piotroskiScore >= 5
      ? 'text-amber-400 border-amber-500/40 bg-amber-950/40'
      : 'text-rose-400 border-rose-500/40 bg-rose-950/40';

  return (
    <div className="w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5 backdrop-blur-md">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-950/70 border border-indigo-700/50 rounded-xl text-indigo-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
              Fundamental Health & Quality Radar
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono font-normal">
                Upstox API
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              Financial Ratios, Valuation & Balance Sheet Health for {symbol}
            </p>
          </div>
        </div>

        {/* Valuation Badge & Piotroski Score */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${valuationBadgeColor}`}
          >
            <ShieldCheck className="w-4 h-4" />
            {data.valuationStatus.replace('_', ' ')}
          </div>
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${piotroskiColor}`}
          >
            <span>Piotroski Score:</span>
            <strong className="text-sm font-mono">{data.piotroskiScore}/9</strong>
          </div>
        </div>
      </div>

      {/* Grid of Key Ratios */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* P/E Ratio vs Industry P/E */}
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider flex items-center justify-between">
            P/E Ratio
            <Activity className="w-3.5 h-3.5 text-neutral-500" />
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-neutral-100">{data.peRatio}x</span>
            <span className="text-[11px] text-neutral-400">Ind: {data.industryPe}x</span>
          </div>
          <span className="text-[10px] text-neutral-500">Price to Earnings multiple</span>
        </div>

        {/* Return on Equity (ROE) */}
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider flex items-center justify-between">
            ROE (%)
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-emerald-400">{data.roePercent}%</span>
            <span className="text-[11px] text-neutral-400">ROCE: {data.rocePercent}%</span>
          </div>
          <span className="text-[10px] text-neutral-500">Return on Capital Employed</span>
        </div>

        {/* Debt-to-Equity Ratio */}
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider flex items-center justify-between">
            Debt / Equity
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-lg font-bold font-mono ${
                data.debtToEquity < 0.5 ? 'text-emerald-400' : data.debtToEquity < 1.0 ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {data.debtToEquity}
            </span>
            <span className="text-[11px] text-neutral-400">
              {data.debtToEquity < 0.5 ? 'Low Debt' : 'Moderate'}
            </span>
          </div>
          <span className="text-[10px] text-neutral-500">Balance sheet leverage</span>
        </div>

        {/* Free Cash Flow */}
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider flex items-center justify-between">
            Free Cash Flow
            <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-indigo-300">
              ₹{(data.freeCashFlowCr / 1000).toFixed(1)}k Cr
            </span>
          </div>
          <span className="text-[10px] text-neutral-500">Annual net FCF generated</span>
        </div>
      </div>

      {/* Secondary Bar: YoY Growth & Dividend Yield */}
      <div className="bg-neutral-950/40 border border-neutral-800/60 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-neutral-400">Sales Growth (YoY):</span>{' '}
            <strong className="text-neutral-100 font-mono">+{data.salesGrowthYoY}%</strong>
          </div>
          <div>
            <span className="text-neutral-400">Profit Growth (YoY):</span>{' '}
            <strong className="text-emerald-400 font-mono">+{data.profitGrowthYoY}%</strong>
          </div>
          <div>
            <span className="text-neutral-400">Dividend Yield:</span>{' '}
            <strong className="text-neutral-100 font-mono">{data.dividendYield}%</strong>
          </div>
        </div>
        <div className="text-[11px] text-neutral-500 flex items-center gap-1 font-mono">
          <RefreshCw className="w-3 h-3 text-neutral-400" />
          Synced via Upstox Analytics Feed
        </div>
      </div>
    </div>
  );
};
