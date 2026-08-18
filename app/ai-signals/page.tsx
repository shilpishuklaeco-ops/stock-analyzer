'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { LiveRateBanner } from '@/components/LiveRateBanner';
import { AIForecastCard } from '@/components/AIForecastCard';
import { NIFTY_50_STOCKS, INITIAL_RELIANCE_QUOTE } from '@/lib/mockStockData';
import { StockQuote } from '@/lib/types';
import { useLiveMarket } from '@/hooks/useLiveMarket';

export default function AISignalsPage() {
  const [activeSymbol, setActiveSymbolState] = useState<string>('RELIANCE');
  const { stocks: niftyStocks, lastSynced } = useLiveMarket();
  const [quote, setQuote] = useState<StockQuote>(INITIAL_RELIANCE_QUOTE);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlSymbol = urlParams.get('symbol')?.toUpperCase();
      const savedSymbol = localStorage.getItem('selected_stock_symbol')?.toUpperCase();

      const targetSymbol =
        urlSymbol && NIFTY_50_STOCKS.some((s) => s.symbol === urlSymbol)
          ? urlSymbol
          : savedSymbol && NIFTY_50_STOCKS.some((s) => s.symbol === savedSymbol)
          ? savedSymbol
          : 'RELIANCE';

      if (targetSymbol !== 'RELIANCE') {
        setActiveSymbolState(targetSymbol);
      }
    }
  }, []);

  const setActiveSymbol = (symbol: string) => {
    const uppercaseSymbol = symbol.toUpperCase();
    setActiveSymbolState(uppercaseSymbol);

    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_stock_symbol', uppercaseSymbol);
      const url = new URL(window.location.href);
      url.searchParams.set('symbol', uppercaseSymbol);
      window.history.replaceState(null, '', url.toString());
    }
  };

  useEffect(() => {
    const targetStock = niftyStocks.find((s) => s.symbol === activeSymbol) || niftyStocks[0];

    if (activeSymbol === 'RELIANCE') {
      setQuote((prev) => ({
        ...prev,
        price: targetStock.price,
        change: targetStock.change,
        changePercent: targetStock.changePercent,
        volume: targetStock.volume,
        lastUpdated: lastSynced || prev.lastUpdated,
      }));
    } else {
      setQuote({
        symbol: targetStock.symbol,
        name: targetStock.name,
        sector: targetStock.sector,
        price: targetStock.price,
        change: targetStock.change,
        changePercent: targetStock.changePercent,
        dayHigh: Number((targetStock.price * 1.018).toFixed(2)),
        dayLow: Number((targetStock.price * 0.985).toFixed(2)),
        yearHigh: Number((targetStock.price * 1.25).toFixed(2)),
        yearLow: Number((targetStock.price * 0.75).toFixed(2)),
        open: Number((targetStock.price * 0.995).toFixed(2)),
        prevClose: Number((targetStock.price - targetStock.change).toFixed(2)),
        volume: targetStock.volume,
        marketCap: `₹${(targetStock.marketCap / 100000).toFixed(2)} Lakh Cr`,
        vwap: Number((targetStock.price * 0.998).toFixed(2)),
        buyPercent: 60,
        sellPercent: 40,
        lastUpdated: lastSynced || new Date().toLocaleTimeString('en-IN'),
      });
    }
  }, [activeSymbol, niftyStocks, lastSynced]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 font-sans antialiased">
      <Navbar activeSymbol={activeSymbol} onSelectStock={setActiveSymbol} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        <LiveRateBanner quote={quote} />

        {/* Dedicated AI Forecast Panel */}
        <AIForecastCard symbol={activeSymbol} />
      </main>

      <footer className="w-full bg-neutral-950 border-t border-neutral-800/80 py-6 text-center text-xs text-neutral-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>Stock Analyzer Pro • Dedicated AI Quant Forecasting Module</div>
          <div className="flex items-center gap-4 text-neutral-400" suppressHydrationWarning>
            <span>Last Synced: {lastSynced || 'Live'}</span>
            <span>•</span>
            <span>Latency: &lt;50ms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
