'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CandleData, GridMode } from '@/lib/types';
import { calculateSMA, calculateEMA } from '@/lib/indicators';
import { NIFTY_50_STOCKS } from '@/lib/mockStockData';
import { fetchUpstoxCandles } from '@/lib/upstoxClient';
import {
  createChart,
  ColorType,
  IChartApi,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
} from 'lightweight-charts';
import { Maximize2, Minimize2, Grid, LayoutGrid, Square, AlertTriangle, RefreshCw } from 'lucide-react';



interface StockChartProps {
  candles: CandleData[];
  symbol: string;
  timeframe: '1D' | '1W' | '1M' | '1Y' | 'ALL';
  onTimeframeChange: (tf: '1D' | '1W' | '1M' | '1Y' | 'ALL') => void;
  onSelectStock?: (symbol: string) => void;
}

type ChartType = 'candlestick' | 'line' | 'area';

function parseChartTime(t: string | number): any {
  if (typeof t === 'number') return t;
  if (typeof t === 'string') {
    if (t.includes('T') || t.includes(' ')) {
      const isoStr = t.replace(' ', 'T');
      const timeMs = new Date(isoStr).getTime();
      if (!isNaN(timeMs)) {
        return Math.floor(timeMs / 1000);
      }
    }
  }
  return t;
}

function sanitizeAndSortCandles<T extends { time: string | number }>(data: T[]): T[] {
  const sorted = [...data].sort((a, b) => {
    const tA = typeof a.time === 'number' ? a.time : new Date(a.time).getTime();
    const tB = typeof b.time === 'number' ? b.time : new Date(b.time).getTime();
    return tA - tB;
  });

  const unique: T[] = [];
  const seen = new Set<string | number>();
  for (const item of sorted) {
    if (item && item.time !== undefined && item.time !== null && !seen.has(item.time)) {
      seen.add(item.time);
      unique.push(item);
    }
  }

  return unique;
}

interface SingleChartPanelProps {
  symbol: string;
  candles: CandleData[];
  timeframe: '1D' | '1W' | '1M' | '1Y' | 'ALL';
  chartType: ChartType;
  showSMA20: boolean;
  showSMA50: boolean;
  showEMA20: boolean;
  showVolume: boolean;
  height?: number;
  onSymbolChange?: (s: string) => void;
}

const SingleChartPanel: React.FC<SingleChartPanelProps> = ({
  symbol,
  candles: initialCandles,
  timeframe,
  chartType,
  showSMA20,
  showSMA50,
  showEMA20,
  showVolume,
  height = 420,
  onSymbolChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [panelCandles, setPanelCandles] = useState<CandleData[]>(initialCandles || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOfflineError, setIsOfflineError] = useState<boolean>(false);

  const loadCandles = useCallback(() => {
    setIsLoading(true);
    setIsOfflineError(false);

    fetchUpstoxCandles(symbol, timeframe)
      .then((realCandles) => {
        if (realCandles && realCandles.length > 0) {
          setPanelCandles(realCandles);
          setIsOfflineError(false);
        } else if (initialCandles && initialCandles.length > 0) {
          setPanelCandles(initialCandles);
          setIsOfflineError(false);
        } else {
          setPanelCandles([]);
          setIsOfflineError(true);
        }
      })
      .catch(() => {
        setIsOfflineError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [symbol, timeframe, initialCandles]);

  useEffect(() => {
    loadCandles();
  }, [loadCandles]);

  useEffect(() => {
    if (!containerRef.current || panelCandles.length === 0) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#a3a3a3',
      },
      grid: {
        vertLines: { color: '#171717' },
        horzLines: { color: '#171717' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#262626' },
      timeScale: {
        borderColor: '#262626',
        timeVisible: timeframe === '1D' || timeframe === '1W',
        secondsVisible: false,
      },
      width: container.clientWidth,
      height: height,
    });

    chartRef.current = chart;

    const rawFormattedData = panelCandles.map((c) => ({
      ...c,
      time: parseChartTime(c.time),
    }));
    const formattedData = sanitizeAndSortCandles(rawFormattedData);

    if (chartType === 'candlestick') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#f43f5e',
        borderUpColor: '#10b981',
        borderDownColor: '#f43f5e',
        wickUpColor: '#10b981',
        wickDownColor: '#f43f5e',
      });
      candleSeries.setData(formattedData);
    } else if (chartType === 'line') {
      const lineSeries = chart.addSeries(LineSeries, {
        color: '#10b981',
        lineWidth: 2,
      });
      lineSeries.setData(formattedData.map((d) => ({ time: d.time, value: d.close })));
    } else if (chartType === 'area') {
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(16, 185, 129, 0.4)',
        bottomColor: 'rgba(16, 185, 129, 0.0)',
        lineColor: '#10b981',
        lineWidth: 2,
      });
      areaSeries.setData(formattedData.map((d) => ({ time: d.time, value: d.close })));
    }

    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#262626',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.75, bottom: 0 },
      });

      volumeSeries.setData(
        formattedData.map((d) => ({
          time: d.time,
          value: d.volume,
          color: d.close >= d.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
        }))
      );
    }

    if (showSMA20) {
      const sma20Data = sanitizeAndSortCandles(
        calculateSMA(panelCandles, 20).map((item) => ({
          time: parseChartTime(item.time),
          value: item.value,
        }))
      );
      if (sma20Data.length > 0) {
        const sma20Series = chart.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 2,
          title: 'SMA 20',
        });
        sma20Series.setData(sma20Data);
      }
    }

    if (showSMA50) {
      const sma50Data = sanitizeAndSortCandles(
        calculateSMA(panelCandles, 50).map((item) => ({
          time: parseChartTime(item.time),
          value: item.value,
        }))
      );
      if (sma50Data.length > 0) {
        const sma50Series = chart.addSeries(LineSeries, {
          color: '#eab308',
          lineWidth: 2,
          title: 'SMA 50',
        });
        sma50Series.setData(sma50Data);
      }
    }

    if (showEMA20) {
      const ema20Data = sanitizeAndSortCandles(
        calculateEMA(panelCandles, 20).map((item) => ({
          time: parseChartTime(item.time),
          value: item.value,
        }))
      );
      if (ema20Data.length > 0) {
        const ema20Series = chart.addSeries(LineSeries, {
          color: '#a855f7',
          lineWidth: 2,
          title: 'EMA 20',
        });
        ema20Series.setData(ema20Data);
      }
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [panelCandles, chartType, showSMA20, showSMA50, showEMA20, showVolume, timeframe, height]);

  return (
    <div className="flex flex-col gap-2 w-full bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-800/60 pb-2">
        <div className="flex items-center gap-2">
          {onSymbolChange ? (
            <select
              value={symbol}
              onChange={(e) => onSymbolChange(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 text-neutral-100 font-bold text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500"
            >
              {NIFTY_50_STOCKS.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} - {s.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="font-bold text-xs text-neutral-100 uppercase tracking-wide">
              {symbol}
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-neutral-400">Upstox Real Feed</span>
      </div>

      {isOfflineError ? (
        <div
          style={{ height: `${height}px` }}
          className="w-full flex flex-col items-center justify-center gap-3 bg-neutral-950/90 border border-neutral-800/80 rounded-xl p-6 text-center"
        >
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <div>
            <h4 className="text-sm font-semibold text-neutral-200">Upstox Market Feed Offline</h4>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs">
              Unable to connect to live historical candle stream for <strong>{symbol}</strong>.
            </p>
          </div>
          <button
            onClick={loadCandles}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-lg transition-all shadow-md shadow-emerald-500/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Connecting...' : 'Retry Connection'}
          </button>
        </div>
      ) : (
        <div ref={containerRef} className="w-full relative rounded-lg overflow-hidden" />
      )}
    </div>
  );
};


export const StockChart: React.FC<StockChartProps> = ({
  candles,
  symbol,
  timeframe,
  onTimeframeChange,
  onSelectStock,
}) => {
  const [gridMode, setGridMode] = useState<GridMode>('SINGLE');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [showSMA20, setShowSMA20] = useState<boolean>(true);
  const [showSMA50, setShowSMA50] = useState<boolean>(true);
  const [showEMA20, setShowEMA20] = useState<boolean>(false);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Multi-chart secondary symbols
  const [secondarySymbol1, setSecondarySymbol1] = useState<string>('TCS');
  const [secondarySymbol2, setSecondarySymbol2] = useState<string>('INFY');
  const [secondarySymbol3, setSecondarySymbol3] = useState<string>('HDFCBANK');

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  return (
    <div
      className={`bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl backdrop-blur-md transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 bg-neutral-950 border-emerald-500/50 overflow-y-auto' : 'relative'
      }`}
    >
      {/* Control Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        {/* Left: Timeframe & Grid Layout Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Buttons */}
          <div className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800 text-xs">
            {(['1D', '1W', '1M', '1Y', 'ALL'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  timeframe === tf
                    ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Multi-Chart Grid Switcher Buttons */}
          <div className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setGridMode('SINGLE')}
              title="Single Chart View"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                gridMode === 'SINGLE'
                  ? 'bg-emerald-950 border border-emerald-600/80 text-emerald-400'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Single</span>
            </button>

            <button
              onClick={() => setGridMode('DUAL')}
              title="Dual Grid View (1x2)"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                gridMode === 'DUAL'
                  ? 'bg-emerald-950 border border-emerald-600/80 text-emerald-400'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dual Grid</span>
            </button>

            <button
              onClick={() => setGridMode('QUAD')}
              title="Pro 4-Grid View (2x2)"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                gridMode === 'QUAD'
                  ? 'bg-emerald-950 border border-emerald-600/80 text-emerald-400'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">4-Grid</span>
            </button>
          </div>
        </div>

        {/* Middle Controls: Chart Type */}
        <div className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800 text-xs">
          {(['candlestick', 'line', 'area'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-all ${
                chartType === type
                  ? 'bg-neutral-800 text-emerald-400 border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {type === 'candlestick' ? 'Candles' : type}
            </button>
          ))}
        </div>

        {/* Right Controls: Indicators & Fullscreen Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setShowSMA20(!showSMA20)}
              className={`px-2 py-1 rounded text-[11px] font-mono border transition-all ${
                showSMA20
                  ? 'bg-blue-950/60 border-blue-600/80 text-blue-400'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-500 line-through'
              }`}
            >
              SMA 20
            </button>

            <button
              onClick={() => setShowSMA50(!showSMA50)}
              className={`px-2 py-1 rounded text-[11px] font-mono border transition-all ${
                showSMA50
                  ? 'bg-amber-950/60 border-amber-600/80 text-amber-400'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-500 line-through'
              }`}
            >
              SMA 50
            </button>

            <button
              onClick={() => setShowEMA20(!showEMA20)}
              className={`px-2 py-1 rounded text-[11px] font-mono border transition-all ${
                showEMA20
                  ? 'bg-purple-950/60 border-purple-600/80 text-purple-400'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-500 line-through'
              }`}
            >
              EMA 20
            </button>

            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-2 py-1 rounded text-[11px] font-mono border transition-all ${
                showVolume
                  ? 'bg-emerald-950/60 border-emerald-600/80 text-emerald-400'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-500 line-through'
              }`}
            >
              Volume
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-neutral-400 hover:text-white bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-all"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Dynamic Grid Layout Renderer */}
      {gridMode === 'SINGLE' && (
        <SingleChartPanel
          symbol={symbol}
          candles={candles}
          timeframe={timeframe}
          chartType={chartType}
          showSMA20={showSMA20}
          showSMA50={showSMA50}
          showEMA20={showEMA20}
          showVolume={showVolume}
          height={430}
        />
      )}

      {gridMode === 'DUAL' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SingleChartPanel
            symbol={symbol}
            candles={candles}
            timeframe={timeframe}
            chartType={chartType}
            showSMA20={showSMA20}
            showSMA50={showSMA50}
            showEMA20={showEMA20}
            showVolume={showVolume}
            height={380}
            onSymbolChange={onSelectStock}
          />
          <SingleChartPanel
            symbol={secondarySymbol1}
            candles={[]}
            timeframe={timeframe}
            chartType={chartType}
            showSMA20={showSMA20}
            showSMA50={showSMA50}
            showEMA20={showEMA20}
            showVolume={showVolume}
            height={380}
            onSymbolChange={setSecondarySymbol1}
          />
        </div>
      )}

      {gridMode === 'QUAD' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SingleChartPanel
            symbol={symbol}
            candles={candles}
            timeframe={timeframe}
            chartType={chartType}
            showSMA20={showSMA20}
            showSMA50={showSMA50}
            showEMA20={showEMA20}
            showVolume={showVolume}
            height={280}
            onSymbolChange={onSelectStock}
          />
          <SingleChartPanel
            symbol={secondarySymbol1}
            candles={[]}
            timeframe={timeframe}
            chartType={chartType}
            showSMA20={showSMA20}
            showSMA50={showSMA50}
            showEMA20={showEMA20}
            showVolume={showVolume}
            height={280}
            onSymbolChange={setSecondarySymbol1}
          />
          <SingleChartPanel
            symbol={secondarySymbol2}
            candles={[]}
            timeframe={timeframe}
            chartType={chartType}
            showSMA20={showSMA20}
            showSMA50={showSMA50}
            showEMA20={showEMA20}
            showVolume={showVolume}
            height={280}
            onSymbolChange={setSecondarySymbol2}
          />
          <SingleChartPanel
            symbol={secondarySymbol3}
            candles={[]}
            timeframe={timeframe}
            chartType={chartType}
            showSMA20={showSMA20}
            showSMA50={showSMA50}
            showEMA20={showEMA20}
            showVolume={showVolume}
            height={280}
            onSymbolChange={setSecondarySymbol3}
          />
        </div>
      )}

      {/* Footer Metadata */}
      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 border-t border-neutral-800/80 pt-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Bullish Candle
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Bearish Candle
          </span>
          {showSMA20 && <span className="text-blue-400">— SMA 20</span>}
          {showSMA50 && <span className="text-amber-400">— SMA 50</span>}
        </div>
        <div>TradingView Lightweight-Charts • Upstox Multi-Grid Engine</div>
      </div>
    </div>
  );
};
