'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { LiveRateBanner } from '@/components/LiveRateBanner';
import { AIForecastCard } from '@/components/AIForecastCard';
import { DipBacktestCard } from '@/components/DipBacktestCard';
import { StockChart } from '@/components/StockChart';
import { TechnicalSummary } from '@/components/TechnicalSummary';
import { NiftyHeatmapGrid } from '@/components/NiftyHeatmapGrid';
import { OrderBook } from '@/components/OrderBook';
import { StockNewsFeed } from '@/components/StockNewsFeed';
import {
  NIFTY_50_STOCKS,
  INITIAL_RELIANCE_QUOTE,
  generateCandleData,
  generateOrderBook,
  generateRecentTrades,
  isNSEMarketOpen,
} from '@/lib/mockStockData';
import { computeIndicatorSummary } from '@/lib/indicators';
import { StockQuote, CandleData, NiftyStock, OrderBookItem, RecentTrade } from '@/lib/types';
import { useLiveMarket } from '@/hooks/useLiveMarket';
import { Moon } from 'lucide-react';

export default function Home() {
  const [activeSymbol, setActiveSymbolState] = useState<string>('RELIANCE');
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '1Y' | 'ALL'>('1D');
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Always Live Auto-Sync Market Hook
  const { stocks: niftyStocks, lastSynced } = useLiveMarket();

  // Active Quote State
  const [quote, setQuote] = useState<StockQuote>(INITIAL_RELIANCE_QUOTE);

  // Candles State
  const [candles, setCandles] = useState<CandleData[]>([]);

  // Order Book & Recent Trades State
  const [orderBook, setOrderBook] = useState<{ bids: OrderBookItem[]; asks: OrderBookItem[] }>({
    bids: [],
    asks: [],
  });
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);

  // Hydration Safe Client Initialization
  useEffect(() => {
    setMounted(true);
    setIsMarketOpen(isNSEMarketOpen());

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

  // Handler to update active symbol, sync URL & persist in localStorage
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

  // Sync active stock quote whenever niftyStocks (auto-synced) or activeSymbol changes
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
        buyPercent: Math.floor(Math.random() * 35 + 45),
        sellPercent: 0,
        lastUpdated: lastSynced || new Date().toLocaleTimeString('en-IN'),
      });
    }

    setOrderBook(generateOrderBook(targetStock.price));
    setRecentTrades(generateRecentTrades(targetStock.price));
  }, [activeSymbol, niftyStocks, lastSynced]);

  // Load / Update Candlestick Data when activeSymbol or timeframe changes
  useEffect(() => {
    const generatedCandles = generateCandleData(activeSymbol, timeframe);
    setCandles(generatedCandles);
  }, [activeSymbol, timeframe]);

  // Real-Time Live Ticker Price Simulation (Runs only during market open hours)
  useEffect(() => {
    if (!isMarketOpen) return;

    const interval = setInterval(() => {
      setQuote((prevQuote) => {
        const tickDirection = Math.random() > 0.48 ? 1 : -1;
        const tickDelta = Number((Math.random() * 0.75 * tickDirection).toFixed(2));
        const newPrice = Math.max(1, Number((prevQuote.price + tickDelta).toFixed(2)));
        const newChange = Number((newPrice - prevQuote.prevClose).toFixed(2));
        const newChangePercent = Number(((newChange / prevQuote.prevClose) * 100).toFixed(2));

        const newDayHigh = Math.max(prevQuote.dayHigh, newPrice);
        const newDayLow = Math.min(prevQuote.dayLow, newPrice);

        const newTrade: RecentTrade = {
          id: Math.random().toString(36).substring(2, 9),
          time: new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          price: newPrice,
          quantity: Math.floor(Math.random() * 250 + 10),
          type: tickDirection > 0 ? 'BUY' : 'SELL',
        };

        setRecentTrades((prev) => [newTrade, ...prev.slice(0, 7)]);
        setOrderBook(generateOrderBook(newPrice));

        return {
          ...prevQuote,
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent,
          dayHigh: newDayHigh,
          dayLow: newDayLow,
          volume: prevQuote.volume + (tickDirection > 0 ? 150 : 80),
          lastUpdated: new Date().toLocaleTimeString('en-IN'),
        };
      });

      setCandles((prevCandles) => {
        if (prevCandles.length === 0) return prevCandles;
        const updated = [...prevCandles];
        const lastCandle = { ...updated[updated.length - 1] };
        lastCandle.close = quote.price;
        if (quote.price > lastCandle.high) lastCandle.high = quote.price;
        if (quote.price < lastCandle.low) lastCandle.low = quote.price;
        updated[updated.length - 1] = lastCandle;
        return updated;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isMarketOpen, quote.price]);

  // Compute Technical Indicators
  const indicators = useMemo(() => computeIndicatorSummary(candles), [candles]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 font-sans antialiased">
      {/* Navigation Header */}
      <Navbar activeSymbol={activeSymbol} onSelectStock={setActiveSymbol} />

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Market Closed Banner Notice */}
        {!isMarketOpen && (
          <div className="w-full bg-rose-950/40 border border-rose-800/60 rounded-xl px-4 py-2.5 text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-rose-400" />
              <span>
                <strong>NSE Market Closed:</strong> Trading session ended at 03:30 PM IST. Showing latest market close quotes. Live ticks resume tomorrow at 09:15 AM IST.
              </span>
            </div>
            <span className="font-mono text-[11px] text-neutral-400 hidden sm:inline" suppressHydrationWarning>
              Auto-Synced: {lastSynced || 'Just Now'}
            </span>
          </div>
        )}

        {/* Live Rate Banner */}
        <LiveRateBanner quote={quote} />

        {/* AI Quant Price Target Forecast Card */}
        <AIForecastCard symbol={activeSymbol} />

        {/* Intraday Dip & Rebound Backtester Card */}
        <DipBacktestCard symbol={activeSymbol} />

        {/* Main Grid: Chart & Technical Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Chart View (2 Columns on Desktop) */}
          <div className="lg:col-span-2 w-full">
            <StockChart
              candles={candles}
              symbol={activeSymbol}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
            />
          </div>

          {/* Technical Summary Panel (1 Column) */}
          <div className="w-full">
            <TechnicalSummary indicators={indicators} currentPrice={quote.price} />
          </div>
        </div>

        {/* Live Stock News & Sentiment Feed */}
        <StockNewsFeed symbol={activeSymbol} />

        {/* Order Book & Recent Trades */}
        <OrderBook bids={orderBook.bids} asks={orderBook.asks} recentTrades={recentTrades} />

        {/* Nifty 50 Sector Heatmap Grid */}
        <NiftyHeatmapGrid
          stocks={niftyStocks}
          activeSymbol={activeSymbol}
          onSelectStock={setActiveSymbol}
        />
      </main>

      {/* Footer */}
      <footer className="w-full bg-neutral-950 border-t border-neutral-800/80 py-6 text-center text-xs text-neutral-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>Stock Analyzer Pro • Dip & Rebound Backtesting Active</div>
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
