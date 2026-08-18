'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StockQuote } from '@/lib/types';
import { TrendingUp, TrendingDown, Clock, BarChart2, Star } from 'lucide-react';
import { addToSupabaseWatchlist, removeFromSupabaseWatchlist, getWatchlistFromSupabase } from '@/lib/supabaseService';

interface LiveRateBannerProps {
  quote: StockQuote;
}

export const LiveRateBanner: React.FC<LiveRateBannerProps> = ({ quote }) => {
  const [flashState, setFlashState] = useState<'UP' | 'DOWN' | null>(null);
  const [isSavedInWatchlist, setIsSavedInWatchlist] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const prevPriceRef = useRef(quote.price);

  useEffect(() => {
    if (quote.price > prevPriceRef.current) {
      setFlashState('UP');
      const timer = setTimeout(() => setFlashState(null), 800);
      prevPriceRef.current = quote.price;
      return () => clearTimeout(timer);
    } else if (quote.price < prevPriceRef.current) {
      setFlashState('DOWN');
      const timer = setTimeout(() => setFlashState(null), 800);
      prevPriceRef.current = quote.price;
      return () => clearTimeout(timer);
    }
  }, [quote.price]);

  // Check if stock is in Supabase Watchlist
  useEffect(() => {
    async function checkWatchlist() {
      const items = await getWatchlistFromSupabase();
      const found = items.some((i) => i.symbol === quote.symbol);
      setIsSavedInWatchlist(found);
    }
    checkWatchlist();
  }, [quote.symbol]);

  const toggleWatchlist = async () => {
    setIsSaving(true);
    if (isSavedInWatchlist) {
      await removeFromSupabaseWatchlist(quote.symbol);
      setIsSavedInWatchlist(false);
    } else {
      await addToSupabaseWatchlist(quote.symbol, quote.name, quote.sector);
      setIsSavedInWatchlist(true);
    }
    setIsSaving(false);
  };

  const isPositive = quote.change >= 0;
  const dayRangeProgress = Math.min(
    100,
    Math.max(0, ((quote.price - quote.dayLow) / (quote.dayHigh - quote.dayLow || 1)) * 100)
  );
  const yearRangeProgress = Math.min(
    100,
    Math.max(0, ((quote.price - quote.yearLow) / (quote.yearHigh - quote.yearLow || 1)) * 100)
  );

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div
        className={`absolute -right-24 -top-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isPositive ? 'bg-emerald-500' : 'bg-rose-500'
        }`}
      />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
        {/* Left Section: Company Name, Ticker & Big Price Ticker */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-black tracking-tight text-white font-mono">{quote.symbol}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 font-medium">
                NSE: {quote.symbol}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-medium">
                {quote.sector}
              </span>
              {/* Supabase Watchlist Star Button */}
              <button
                onClick={toggleWatchlist}
                disabled={isSaving}
                className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-xs ${
                  isSavedInWatchlist
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
                title={isSavedInWatchlist ? 'Remove from Supabase Watchlist' : 'Save to Supabase Watchlist'}
              >
                <Star className={`w-3.5 h-3.5 ${isSavedInWatchlist ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span className="hidden sm:inline font-sans">
                  {isSavedInWatchlist ? 'Saved' : 'Watchlist'}
                </span>
              </button>
            </div>
            <h2 className="text-sm font-medium text-neutral-400">{quote.name}</h2>
          </div>

          <div className="h-10 w-px bg-neutral-800 hidden sm:block" />

          {/* Dynamic Live Price Display */}
          <div
            className={`px-4 py-2 rounded-xl transition-colors duration-300 flex items-baseline gap-3 ${
              flashState === 'UP'
                ? 'bg-emerald-950/80 border border-emerald-500/60 ring-2 ring-emerald-500/30'
                : flashState === 'DOWN'
                ? 'bg-rose-950/80 border border-rose-500/60 ring-2 ring-rose-500/30'
                : 'bg-neutral-950/70 border border-neutral-800'
            }`}
          >
            <div>
              <div className="text-[10px] text-neutral-500 font-semibold tracking-wider uppercase">
                LTP (Live Price)
              </div>
              <div className="text-3xl font-extrabold font-mono text-white tracking-tight">
                ₹{quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div
                className={`flex items-center gap-1 font-mono font-bold text-sm ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>
                  {isPositive ? '+' : ''}
                  {quote.change.toFixed(2)} ({isPositive ? '+' : ''}
                  {quote.changePercent.toFixed(2)}%)
                </span>
              </div>
              <div className="text-[10px] text-neutral-500 flex items-center gap-1 mt-0.5" suppressHydrationWarning>
                <Clock className="w-3 h-3" />
                <span suppressHydrationWarning>Updated: {quote.lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Key Trading Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto text-xs">
          <div className="bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/80">
            <span className="text-neutral-500 text-[11px]">Open</span>
            <div className="font-mono text-sm font-semibold text-neutral-200 mt-0.5">
              ₹{quote.open.toFixed(2)}
            </div>
          </div>
          <div className="bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/80">
            <span className="text-neutral-500 text-[11px]">Prev Close</span>
            <div className="font-mono text-sm font-semibold text-neutral-200 mt-0.5">
              ₹{quote.prevClose.toFixed(2)}
            </div>
          </div>
          <div className="bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/80">
            <span className="text-neutral-500 text-[11px]">Volume</span>
            <div className="font-mono text-sm font-semibold text-neutral-200 mt-0.5">
              {(quote.volume / 100000).toFixed(2)} L
            </div>
          </div>
          <div className="bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/80">
            <span className="text-neutral-500 text-[11px]">Market Cap</span>
            <div className="font-mono text-sm font-semibold text-emerald-400 mt-0.5">{quote.marketCap}</div>
          </div>
        </div>
      </div>

      {/* Bottom Range Sliders & Market Depth */}
      <div className="mt-5 pt-4 border-t border-neutral-800/80 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        {/* Day Range */}
        <div>
          <div className="flex justify-between text-neutral-400 font-medium mb-1.5">
            <span>Day Range</span>
            <span className="font-mono text-white">
              L: ₹{quote.dayLow.toFixed(2)} — H: ₹{quote.dayHigh.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden relative border border-neutral-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${dayRangeProgress}%` }}
            />
          </div>
        </div>

        {/* 52-Week Range */}
        <div>
          <div className="flex justify-between text-neutral-400 font-medium mb-1.5">
            <span>52W Range</span>
            <span className="font-mono text-white">
              L: ₹{quote.yearLow.toFixed(2)} — H: ₹{quote.yearHigh.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden relative border border-neutral-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${yearRangeProgress}%` }}
            />
          </div>
        </div>

        {/* Buy / Sell Sentiment Ratio */}
        <div>
          <div className="flex justify-between text-neutral-400 font-medium mb-1.5">
            <span className="flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5 text-emerald-400" /> Market Sentiment
            </span>
            <span className="font-mono font-semibold">
              <span className="text-emerald-400">{quote.buyPercent}% Buy</span> /{' '}
              <span className="text-rose-400">{quote.sellPercent}% Sell</span>
            </span>
          </div>
          <div className="w-full h-2 bg-rose-950 rounded-full overflow-hidden flex border border-neutral-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${quote.buyPercent}%` }}
            />
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{ width: `${quote.sellPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
