'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CrosshairMode,
  IChartApi,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
} from 'lightweight-charts';
import { CandleData } from '@/lib/types';
import { calculateSMA, calculateEMA } from '@/lib/indicators';
import { Sliders } from 'lucide-react';

interface StockChartProps {
  candles: CandleData[];
  symbol: string;
  timeframe: '1D' | '1W' | '1M' | '1Y' | 'ALL';
  onTimeframeChange: (tf: '1D' | '1W' | '1M' | '1Y' | 'ALL') => void;
}

export const StockChart: React.FC<StockChartProps> = ({
  candles,
  symbol,
  timeframe,
  onTimeframeChange,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);

  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('candlestick');
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showEMA20, setShowEMA20] = useState(false);
  const [showVolume, setShowVolume] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0) return;

    // Clean up previous chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#9ca3af',
        fontSize: 12,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: '#171717' },
        horzLines: { color: '#171717' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#262626',
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
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

    // Format candle timestamps appropriately for lightweight-charts
    const formattedData = candles.map((c) => {
      if (c.time.includes(' ')) {
        const timestamp = Math.floor(new Date(c.time.replace(' ', 'T')).getTime() / 1000);
        return {
          ...c,
          time: timestamp as any,
        };
      }
      return c;
    });

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
      const sma20Data = calculateSMA(candles, 20).map((item) => {
        let t = item.time;
        if (t.includes(' ')) {
          t = Math.floor(new Date(t.replace(' ', 'T')).getTime() / 1000) as any;
        }
        return { time: t as any, value: item.value };
      });

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
      const sma50Data = calculateSMA(candles, 50).map((item) => {
        let t = item.time;
        if (t.includes(' ')) {
          t = Math.floor(new Date(t.replace(' ', 'T')).getTime() / 1000) as any;
        }
        return { time: t as any, value: item.value };
      });

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
      const ema20Data = calculateEMA(candles, 20).map((item) => {
        let t = item.time;
        if (t.includes(' ')) {
          t = Math.floor(new Date(t.replace(' ', 'T')).getTime() / 1000) as any;
        }
        return { time: t as any, value: item.value };
      });

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

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Chart Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-neutral-800">
        {/* Left Controls: Symbol & Timeframes */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            {(['1D', '1W', '1M', '1Y', 'ALL'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-3 py-1 text-xs font-mono font-semibold rounded-lg transition-all ${
                  timeframe === tf
                    ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-neutral-800 hidden sm:block" />

          {/* Chart Type Selector */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setChartType('candlestick')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                chartType === 'candlestick'
                  ? 'bg-neutral-800 text-emerald-400 border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                chartType === 'line'
                  ? 'bg-neutral-800 text-emerald-400 border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                chartType === 'area'
                  ? 'bg-neutral-800 text-emerald-400 border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Area
            </button>
          </div>
        </div>

        {/* Right Controls: Indicators Toggles */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-400 hidden md:inline flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" /> Indicators:
          </span>
          <button
            onClick={() => setShowSMA20(!showSMA20)}
            className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all ${
              showSMA20
                ? 'bg-blue-950/80 border-blue-500/60 text-blue-400 font-semibold'
                : 'bg-neutral-950 border-neutral-800 text-neutral-500'
            }`}
          >
            SMA 20
          </button>
          <button
            onClick={() => setShowSMA50(!showSMA50)}
            className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all ${
              showSMA50
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-400 font-semibold'
                : 'bg-neutral-950 border-neutral-800 text-neutral-500'
            }`}
          >
            SMA 50
          </button>
          <button
            onClick={() => setShowEMA20(!showEMA20)}
            className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all ${
              showEMA20
                ? 'bg-purple-950/80 border-purple-500/60 text-purple-400 font-semibold'
                : 'bg-neutral-950 border-neutral-800 text-neutral-500'
            }`}
          >
            EMA 20
          </button>
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all ${
              showVolume
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400 font-semibold'
                : 'bg-neutral-950 border-neutral-800 text-neutral-500'
            }`}
          >
            Volume
          </button>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div className="w-full relative min-h-[440px] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800/80">
        <div ref={chartContainerRef} className="w-full h-[440px]" />
      </div>

      {/* Chart Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-400 pt-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Bullish Candle</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Bearish Candle</span>
          </div>
          {showSMA20 && (
            <div className="flex items-center gap-1.5 font-mono text-blue-400">
              <span className="w-3 h-0.5 bg-blue-500 inline-block" />
              <span>SMA 20</span>
            </div>
          )}
          {showSMA50 && (
            <div className="flex items-center gap-1.5 font-mono text-amber-400">
              <span className="w-3 h-0.5 bg-amber-500 inline-block" />
              <span>SMA 50</span>
            </div>
          )}
          {showEMA20 && (
            <div className="flex items-center gap-1.5 font-mono text-purple-400">
              <span className="w-3 h-0.5 bg-purple-500 inline-block" />
              <span>EMA 20</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-neutral-500 font-mono">
          TradingView Lightweight-Charts Engine • Realtime NSE Feed
        </div>
      </div>
    </div>
  );
};
