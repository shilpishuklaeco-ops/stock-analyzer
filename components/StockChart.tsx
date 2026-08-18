'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CandleData } from '@/lib/types';
import { calculateSMA, calculateEMA } from '@/lib/indicators';
import {
  createChart,
  ColorType,
  IChartApi,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
} from 'lightweight-charts';
import { Maximize2, Minimize2 } from 'lucide-react';

interface StockChartProps {
  candles: CandleData[];
  symbol: string;
  timeframe: '1D' | '1W' | '1M' | '1Y' | 'ALL';
  onTimeframeChange: (tf: '1D' | '1W' | '1M' | '1Y' | 'ALL') => void;
}

type ChartType = 'candlestick' | 'line' | 'area';

function parseChartTime(t: string | number): any {
  if (typeof t === 'number') return t;
  if (typeof t === 'string') {
    if (t.includes(' ')) {
      return Math.floor(new Date(t.replace(' ', 'T')).getTime() / 1000);
    }
    if (t.includes(':') && !t.includes('-')) {
      const today = new Date().toISOString().split('T')[0];
      return Math.floor(new Date(`${today}T${t}:00`).getTime() / 1000);
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
    if (!seen.has(item.time)) {
      seen.add(item.time);
      unique.push(item);
    }
  }

  return unique;
}

export const StockChart: React.FC<StockChartProps> = ({
  candles,
  symbol,
  timeframe,
  onTimeframeChange,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);

  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [showSMA20, setShowSMA20] = useState<boolean>(true);
  const [showSMA50, setShowSMA50] = useState<boolean>(true);
  const [showEMA20, setShowEMA20] = useState<boolean>(false);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0) return;

    const container = chartContainerRef.current;
    container.innerHTML = '';

    // Initialize Lightweight Chart Instance
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#a3a3a3',
      },
      grid: {
        vertLines: { color: '#171717' },
        horzLines: { color: '#171717' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#262626',
      },
      timeScale: {
        borderColor: '#262626',
        timeVisible: timeframe === '1D' || timeframe === '1W',
        secondsVisible: false,
      },
      width: container.clientWidth,
      height: 440,
    });

    chartInstanceRef.current = chart;

    // Format & Sanitize candle timestamps appropriately for lightweight-charts
    const rawFormattedData = candles.map((c) => ({
      ...c,
      time: parseChartTime(c.time),
    }));
    const formattedData = sanitizeAndSortCandles(rawFormattedData);

    // Add Primary Stock Series based on chart type
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

    // Volume Histogram
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#262626',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.75,
          bottom: 0,
        },
      });

      volumeSeries.setData(
        formattedData.map((d) => ({
          time: d.time,
          value: d.volume,
          color: d.close >= d.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
        }))
      );
    }

    // SMA 20 Overlay
    if (showSMA20) {
      const sma20Data = sanitizeAndSortCandles(
        calculateSMA(candles, 20).map((item) => ({
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

    // SMA 50 Overlay
    if (showSMA50) {
      const sma50Data = sanitizeAndSortCandles(
        calculateSMA(candles, 50).map((item) => ({
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

    // EMA 20 Overlay
    if (showEMA20) {
      const ema20Data = sanitizeAndSortCandles(
        calculateEMA(candles, 20).map((item) => ({
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

    // Handle Resize
    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [candles, chartType, showSMA20, showSMA50, showEMA20, showVolume, timeframe]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={`bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl backdrop-blur-md transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 bg-neutral-950 border-emerald-500/50' : 'relative'
      }`}
    >
      {/* Chart Control Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        {/* Left Controls: Timeframe selector */}
        <div className="flex items-center gap-1.5 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800 text-xs">
          {(['1D', '1W', '1M', '1Y', 'ALL'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                timeframe === tf
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Middle Controls: Chart Type (Candlestick, Line, Area) */}
        <div className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800 text-xs">
          {(['candlestick', 'line', 'area'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-2.5 py-1.5 rounded-lg font-medium capitalize transition-all ${
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
            <span className="text-neutral-500 font-mono text-[11px] hidden md:inline">
              Indicators:
            </span>
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

      {/* Lightweight Chart Render Canvas Container */}
      <div
        ref={chartContainerRef}
        className="w-full relative rounded-xl overflow-hidden min-h-[440px]"
      />

      {/* Chart Legend / Metadata Footer */}
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
        <div>TradingView Lightweight-Charts Engine • Realtime NSE Feed</div>
      </div>
    </div>
  );
};
