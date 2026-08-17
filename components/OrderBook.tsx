'use client';

import React from 'react';
import { OrderBookItem, RecentTrade } from '@/lib/types';
import { Layers, Activity } from 'lucide-react';

interface OrderBookProps {
  bids: OrderBookItem[];
  asks: OrderBookItem[];
  recentTrades: RecentTrade[];
}

export const OrderBook: React.FC<OrderBookProps> = ({ bids, asks, recentTrades }) => {
  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-neutral-100 tracking-tight">Market Depth & Live Stream</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Realtime Order Stream</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Book Depth Table */}
        <div className="bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-800/80">
          <div className="text-xs font-semibold text-neutral-400 mb-2 flex justify-between">
            <span>BID (BUY ORDERS)</span>
            <span>ASK (SELL ORDERS)</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            {/* Bids Table */}
            <div>
              <div className="flex justify-between text-[10px] text-neutral-500 pb-1 border-b border-neutral-800">
                <span>Qty</span>
                <span>Bid Price</span>
              </div>
              {bids.map((b, idx) => (
                <div
                  key={idx}
                  className="flex justify-between py-1 border-b border-neutral-800/40 text-emerald-400"
                >
                  <span className="text-neutral-400">{b.quantity}</span>
                  <span className="font-bold">₹{b.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Asks Table */}
            <div>
              <div className="flex justify-between text-[10px] text-neutral-500 pb-1 border-b border-neutral-800">
                <span>Ask Price</span>
                <span>Qty</span>
              </div>
              {asks.map((a, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-neutral-800/40 text-rose-400">
                  <span className="font-bold">₹{a.price.toFixed(2)}</span>
                  <span className="text-neutral-400">{a.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Recent Trades Feed */}
        <div className="bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-800/80 flex flex-col">
          <div className="text-xs font-semibold text-neutral-400 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" /> Recent Market Trades
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">NSE Stream</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-48 scrollbar-none text-xs font-mono">
            <div className="grid grid-cols-4 text-[10px] text-neutral-500 pb-1 border-b border-neutral-800">
              <span>Time</span>
              <span>Price</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Side</span>
            </div>
            {recentTrades.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-4 py-1.5 border-b border-neutral-800/40 text-neutral-300 items-center"
              >
                <span className="text-neutral-500 text-[11px]">{t.time}</span>
                <span className="font-semibold text-white">₹{t.price.toFixed(2)}</span>
                <span className="text-right text-neutral-400">{t.quantity}</span>
                <span className="text-right">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      t.type === 'BUY' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                    }`}
                  >
                    {t.type}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
