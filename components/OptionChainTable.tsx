'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Layers, Calendar, Info } from 'lucide-react';
import { OptionChainStrike } from '@/app/api/market/option-chain/route';

interface OptionChainTableProps {
  symbol: string;
  onSymbolChange?: (symbol: string) => void;
}

export const OptionChainTable: React.FC<OptionChainTableProps> = ({
  symbol = 'NIFTY50',
  onSymbolChange,
}) => {
  const [activeSymbol, setActiveSymbol] = useState<string>(symbol);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [availableExpiries, setAvailableExpiries] = useState<string[]>([]);
  const [spotPrice, setSpotPrice] = useState<number>(0);
  const [summary, setSummary] = useState<any>({
    pcr: 1.0,
    totalCallOI: 0,
    totalPutOI: 0,
    atmStrike: 0,
    sentiment: 'NEUTRAL',
  });
  const [strikes, setStrikes] = useState<OptionChainStrike[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchOptionChain = useCallback(async (sym: string, exp?: string, isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      let url = `/api/market/option-chain?symbol=${encodeURIComponent(sym)}`;
      if (exp) url += `&expiry=${encodeURIComponent(exp)}`;

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;

      const data = await res.json();
      if (data.success) {
        setSpotPrice(data.spotPrice || 0);
        setAvailableExpiries(data.availableExpiries || []);
        setSelectedExpiry(data.activeExpiry || '');
        setSummary(data.summary || {});
        setStrikes(data.strikes || []);
      }
    } catch (err) {
      console.warn('Error fetching option chain:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOptionChain(activeSymbol, selectedExpiry);
  }, [activeSymbol, selectedExpiry, fetchOptionChain]);

  const handleSymbolSwitch = (newSym: string) => {
    setActiveSymbol(newSym);
    setSelectedExpiry('');
    if (onSymbolChange) onSymbolChange(newSym);
  };

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 sm:p-6 flex flex-col gap-6 shadow-2xl backdrop-blur-md">
      {/* Header Bar & Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Real Option Chain & Greeks Terminal
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                UPSTOX LIVE
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              Live Option Matrix with Delta, Theta, Vega, IV, and PCR Sentiment Bounds
            </p>
          </div>
        </div>

        {/* Target Symbol & Expiry Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Symbol Selector */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-semibold">
            {['NIFTY50', 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK'].map((s) => (
              <button
                key={s}
                onClick={() => handleSymbolSwitch(s)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeSymbol === s
                    ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Expiry Selector */}
          {availableExpiries.length > 0 && (
            <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800 text-xs">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={selectedExpiry}
                onChange={(e) => setSelectedExpiry(e.target.value)}
                className="bg-transparent text-neutral-100 font-mono font-semibold focus:outline-none cursor-pointer"
              >
                {availableExpiries.map((exp) => (
                  <option key={exp} value={exp} className="bg-neutral-900 text-neutral-100">
                    Expiry: {exp}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => fetchOptionChain(activeSymbol, selectedExpiry, true)}
            className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all"
            title="Refresh Option Chain"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Spot Price Card */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 flex flex-col">
          <span className="text-[11px] font-mono text-neutral-400">SPOT PRICE</span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            ₹{spotPrice ? spotPrice.toFixed(2) : '---'}
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            ATM Strike: {summary.atmStrike}
          </span>
        </div>

        {/* PCR Ratio Card */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 flex flex-col">
          <span className="text-[11px] font-mono text-neutral-400">PUT-CALL RATIO (PCR)</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-mono text-white">{summary.pcr}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase font-mono ${
                summary.sentiment === 'BULLISH'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : summary.sentiment === 'BEARISH'
                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {summary.sentiment}
            </span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">
            {summary.pcr > 1.0 ? 'Puts Dominating (Support)' : 'Calls Dominating (Resistance)'}
          </span>
        </div>

        {/* Call Open Interest */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 flex flex-col">
          <span className="text-[11px] font-mono text-neutral-400">TOTAL CALL (CE) OI</span>
          <span className="text-xl font-bold font-mono text-rose-400">
            {(summary.totalCallOI / 100000).toFixed(2)} L
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">Call Writers Overhead</span>
        </div>

        {/* Put Open Interest */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 flex flex-col">
          <span className="text-[11px] font-mono text-neutral-400">TOTAL PUT (PE) OI</span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            {(summary.totalPutOI / 100000).toFixed(2)} L
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">Put Writers Floor Support</span>
        </div>
      </div>

      {/* Option Chain Table Matrix */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-neutral-400 flex flex-col items-center gap-3 font-mono">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          <span>Fetching Real-Time Upstox Option Chain & Greeks...</span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              {/* Top Layer Header */}
              <tr className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 text-[11px]">
                <th colSpan={5} className="py-2.5 px-3 text-center text-rose-400 border-r border-neutral-800 bg-rose-950/20 font-bold">
                  CALL OPTIONS (CE)
                </th>
                <th className="py-2.5 px-3 text-center text-emerald-400 bg-emerald-950/40 font-extrabold border-r border-neutral-800">
                  STRIKE
                </th>
                <th colSpan={5} className="py-2.5 px-3 text-center text-emerald-400 bg-emerald-950/20 font-bold">
                  PUT OPTIONS (PE)
                </th>
              </tr>

              {/* Sub Columns Header */}
              <tr className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800 text-[10px] font-bold uppercase">
                <th className="py-2 px-3 text-right">OI (Contracts)</th>
                <th className="py-2 px-3 text-right">IV (%)</th>
                <th className="py-2 px-3 text-right">Delta (\(\Delta\))</th>
                <th className="py-2 px-3 text-right">Theta (\(\Theta\))</th>
                <th className="py-2 px-3 text-right text-rose-400 border-r border-neutral-800">CE LTP</th>

                <th className="py-2 px-4 text-center text-white bg-neutral-950 border-r border-neutral-800 font-extrabold">
                  PRICE
                </th>

                <th className="py-2 px-3 text-left text-emerald-400">PE LTP</th>
                <th className="py-2 px-3 text-left">Theta (\(\Theta\))</th>
                <th className="py-2 px-3 text-left">Delta (\(\Delta\))</th>
                <th className="py-2 px-3 text-left">IV (%)</th>
                <th className="py-2 px-3 text-left">OI (Contracts)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-800/60 text-[11px]">
              {strikes.map((stk) => {
                const ce = stk.callOptions;
                const pe = stk.putOptions;
                const isATM = stk.isATM;

                return (
                  <tr
                    key={stk.strikePrice}
                    className={`transition-colors ${
                      isATM
                        ? 'bg-emerald-950/40 font-bold border-y-2 border-emerald-500/60'
                        : 'hover:bg-neutral-800/50'
                    }`}
                  >
                    {/* Call OI */}
                    <td className="py-2 px-3 text-right text-neutral-300">
                      {ce ? (ce.marketData.oi / 1000).toFixed(1) + 'k' : '---'}
                    </td>
                    {/* Call IV */}
                    <td className="py-2 px-3 text-right text-neutral-400">
                      {ce && ce.greeks.iv ? ce.greeks.iv.toFixed(1) + '%' : '---'}
                    </td>
                    {/* Call Delta */}
                    <td className="py-2 px-3 text-right text-emerald-400">
                      {ce ? ce.greeks.delta : '---'}
                    </td>
                    {/* Call Theta */}
                    <td className="py-2 px-3 text-right text-rose-400">
                      {ce ? ce.greeks.theta : '---'}
                    </td>
                    {/* Call LTP */}
                    <td className="py-2 px-3 text-right font-bold text-rose-300 border-r border-neutral-800 bg-rose-950/10">
                      {ce ? `₹${ce.marketData.ltp.toFixed(2)}` : '---'}
                    </td>

                    {/* Strike Price (Center Column) */}
                    <td className={`py-2 px-4 text-center font-bold font-mono border-r border-neutral-800 ${
                      isATM ? 'bg-emerald-500 text-neutral-950 text-xs shadow-lg' : 'bg-neutral-950 text-white'
                    }`}>
                      {stk.strikePrice}
                      {isATM && <span className="ml-1 text-[9px] uppercase tracking-tighter">ATM</span>}
                    </td>

                    {/* Put LTP */}
                    <td className="py-2 px-3 text-left font-bold text-emerald-300 bg-emerald-950/10">
                      {pe ? `₹${pe.marketData.ltp.toFixed(2)}` : '---'}
                    </td>
                    {/* Put Theta */}
                    <td className="py-2 px-3 text-left text-rose-400">
                      {pe ? pe.greeks.theta : '---'}
                    </td>
                    {/* Put Delta */}
                    <td className="py-2 px-3 text-left text-emerald-400">
                      {pe ? pe.greeks.delta : '---'}
                    </td>
                    {/* Put IV */}
                    <td className="py-2 px-3 text-left text-neutral-400">
                      {pe && pe.greeks.iv ? pe.greeks.iv.toFixed(1) + '%' : '---'}
                    </td>
                    {/* Put OI */}
                    <td className="py-2 px-3 text-left text-neutral-300">
                      {pe ? (pe.marketData.oi / 1000).toFixed(1) + 'k' : '---'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
