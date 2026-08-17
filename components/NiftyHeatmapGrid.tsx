'use client';

import React, { useState } from 'react';
import { NiftyStock } from '@/lib/types';
import { LayoutGrid, TrendingUp, TrendingDown, Layers } from 'lucide-react';

interface NiftyHeatmapGridProps {
  stocks: NiftyStock[];
  activeSymbol: string;
  onSelectStock: (symbol: string) => void;
}

export const NiftyHeatmapGrid: React.FC<NiftyHeatmapGridProps> = ({
  stocks,
  activeSymbol,
  onSelectStock,
}) => {
  const [selectedSector, setSelectedSector] = useState<string>('ALL');

  const sectors = ['ALL', ...Array.from(new Set(stocks.map((s) => s.sector)))];

  const filteredStocks =
    selectedSector === 'ALL' ? stocks : stocks.filter((s) => s.sector === selectedSector);

  const getHeatmapColor = (changePercent: number, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-emerald-500/20 border-2 border-emerald-400 ring-2 ring-emerald-500/30 shadow-lg';
    }

    if (changePercent >= 1.5) {
      return 'bg-emerald-950/80 border-emerald-500/80 hover:border-emerald-400 text-emerald-300';
    } else if (changePercent > 0) {
      return 'bg-emerald-950/40 border-emerald-800/60 hover:border-emerald-500 text-emerald-400';
    } else if (changePercent <= -1.5) {
      return 'bg-rose-950/80 border-rose-500/80 hover:border-rose-400 text-rose-300';
    } else {
      return 'bg-rose-950/40 border-rose-800/60 hover:border-rose-500 text-rose-400';
    }
  };

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header & Sector Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-neutral-100 tracking-tight">Nifty 50 Sector Heatmap</h3>
          <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
            {filteredStocks.length} Stocks
          </span>
        </div>

        {/* Sector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full">
          {sectors.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedSector === sec
                  ? 'bg-neutral-800 text-emerald-400 border border-neutral-700 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {filteredStocks.map((stock) => {
          const isSelected = activeSymbol === stock.symbol;
          const isPositive = stock.change >= 0;

          return (
            <button
              key={stock.symbol}
              onClick={() => onSelectStock(stock.symbol)}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all duration-200 text-left hover:scale-[1.03] ${getHeatmapColor(
                stock.changePercent,
                isSelected
              )}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-white">{stock.symbol}</span>
                  <span className="text-[10px] text-neutral-400 truncate max-w-[50px]">{stock.sector}</span>
                </div>
                <div className="text-[11px] text-neutral-400 truncate mt-0.5">{stock.name}</div>
              </div>

              <div className="mt-3">
                <div className="font-mono text-xs font-semibold text-neutral-100">
                  ₹{stock.price.toFixed(1)}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono text-xs font-bold">
                    {isPositive ? '+' : ''}
                    {stock.changePercent.toFixed(2)}%
                  </span>
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-rose-400" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
