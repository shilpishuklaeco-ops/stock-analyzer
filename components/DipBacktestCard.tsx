'use client';

import React, { useState, useEffect } from 'react';
import { DipBacktestResult } from '@/lib/dipBacktestEngine';
import { History, TrendingUp, TrendingDown, Clock, BarChart3, RotateCcw, Calendar, CheckCircle, AlertTriangle, Info, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface DipBacktestCardProps {
  symbol: string;
}

export const DipBacktestCard: React.FC<DipBacktestCardProps> = ({ symbol }) => {
  const [threshold, setThreshold] = useState<number>(-2.0);
  const [checkTime, setCheckTime] = useState<string>('10:30');
  const [period, setPeriod] = useState<number>(250);
  const [result, setResult] = useState<DipBacktestResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEventLogOpen, setIsEventLogOpen] = useState<boolean>(false);

  const runAnalysis = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/backtest/dip-recovery?symbol=${symbol}&threshold=${threshold}&checkTime=${checkTime}&period=${period}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.result) {
          setResult(data.result);
        }
      }
    } catch (err) {
      console.warn('Dip Backtest fetch warning:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [symbol, threshold, checkTime, period]);

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-5">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-950 border border-teal-800/80 text-teal-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-2">
              INTRADAY DIP & REBOUND PATTERN BACKTESTER
              <span className="text-[10px] px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800 font-mono">
                {symbol}
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              Historical Intraday Rebound Statistics & Success Rates
            </p>
          </div>
        </div>

        {/* Backtest Input Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Drop Threshold Selector */}
          <div className="flex items-center gap-1 bg-neutral-950 px-2.5 py-1 rounded-xl border border-neutral-800">
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-neutral-400 text-[11px]">Dip Threshold:</span>
            <select
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="bg-transparent font-mono font-bold text-emerald-400 focus:outline-none cursor-pointer text-xs"
            >
              <option value={-1.0} className="bg-neutral-900 text-white">-1.0% Dip</option>
              <option value={-1.5} className="bg-neutral-900 text-white">-1.5% Dip</option>
              <option value={-2.0} className="bg-neutral-900 text-white">-2.0% Dip</option>
              <option value={-2.5} className="bg-neutral-900 text-white">-2.5% Dip</option>
              <option value={-3.0} className="bg-neutral-900 text-white">-3.0% Dip</option>
            </select>
          </div>

          {/* Morning Cut-off Time Selector */}
          <div className="flex items-center gap-1 bg-neutral-950 px-2.5 py-1 rounded-xl border border-neutral-800">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-neutral-400 text-[11px]">Cut-off:</span>
            <select
              value={checkTime}
              onChange={(e) => setCheckTime(e.target.value)}
              className="bg-transparent font-mono font-bold text-amber-400 focus:outline-none cursor-pointer text-xs"
            >
              <option value="10:30" className="bg-neutral-900 text-white">10:30 AM</option>
              <option value="11:00" className="bg-neutral-900 text-white">11:00 AM</option>
              <option value="12:00" className="bg-neutral-900 text-white">12:00 PM</option>
            </select>
          </div>

          {/* Lookback Period Selector */}
          <div className="flex items-center gap-1 bg-neutral-950 px-2.5 py-1 rounded-xl border border-neutral-800">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(parseInt(e.target.value, 10))}
              className="bg-transparent font-mono font-bold text-cyan-400 focus:outline-none cursor-pointer text-xs"
            >
              <option value={125} className="bg-neutral-900 text-white">6 Months (125D)</option>
              <option value={250} className="bg-neutral-900 text-white">1 Year (250D)</option>
              <option value={500} className="bg-neutral-900 text-white">2 Years (500D)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analytics Summary Metric Grid */}
      {isLoading || !result ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-neutral-950 rounded-xl border border-neutral-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Occurrences */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
              <span>Historical Occurrences</span>
              <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-white mt-1">
              {result.occurrencesCount} <span className="text-xs font-normal text-neutral-400">Times</span>
            </div>
            <div className="text-[10px] text-neutral-500 font-mono mt-1">In last {period} trading days</div>
          </div>

          {/* Avg Morning Dip */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
              <span>Avg {checkTime} AM Dip</span>
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-rose-400 mt-1">
              {result.avgMorningDipPercent}%
            </div>
            <div className="text-[10px] text-neutral-500 font-mono mt-1">Open to {checkTime} AM drop</div>
          </div>

          {/* Rebound Success Rate */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
              <span>Rebound Win Rate</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
              {result.reboundSuccessRate}%
            </div>
            <div className="text-[10px] text-neutral-500 font-mono mt-1">Recovered by 03:30 PM Close</div>
          </div>

          {/* Avg Rebound Gain */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
              <span>Avg Rebound Return</span>
              <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-teal-300 mt-1">
              +{result.avgReboundPercent}%
            </div>
            <div className="text-[10px] text-neutral-500 font-mono mt-1">Max Bounce: +{result.maxReboundPercent}%</div>
          </div>
        </div>
      )}

      {/* Collapsible Accordion Dropdown for Complete Historical Event Log */}
      {result && (
        <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden transition-all">
          {/* Accordion Toggle Header Button */}
          <button
            onClick={() => setIsEventLogOpen(!isEventLogOpen)}
            className="w-full px-4 py-3 bg-neutral-950 hover:bg-neutral-900/60 transition-colors flex items-center justify-between text-xs font-semibold text-neutral-200 border-b border-neutral-800/80"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" />
              <span>Complete Historical Event Log ({symbol})</span>
              <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800 font-mono text-[10px]">
                {result.occurrences.length} Trading Days Found
              </span>
            </div>

            <div className="flex items-center gap-2 text-neutral-400 hover:text-white">
              <span className="text-[11px] font-mono text-neutral-400">
                {isEventLogOpen ? 'Click to Collapse' : 'Click to View All Dates'}
              </span>
              {isEventLogOpen ? (
                <ChevronUp className="w-4 h-4 text-teal-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              )}
            </div>
          </button>

          {/* Accordion Collapsible Content */}
          {isEventLogOpen && (
            <div>
              {result.occurrences.length > 0 ? (
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-neutral-900/90 text-neutral-400 text-[11px] uppercase border-b border-neutral-800/60 sticky top-0 backdrop-blur z-10">
                      <tr>
                        <th className="px-4 py-2.5">Trading Date</th>
                        <th className="px-4 py-2.5">Open Price</th>
                        <th className="px-4 py-2.5">{checkTime} AM Dip</th>
                        <th className="px-4 py-2.5">03:30 PM Close</th>
                        <th className="px-4 py-2.5">Rebound %</th>
                        <th className="px-4 py-2.5 text-right">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/40">
                      {result.occurrences.map((item) => {
                        const isSuccess = item.status === 'REBOUND';

                        return (
                          <tr key={item.id} className="hover:bg-neutral-900/40 transition-colors">
                            <td className="px-4 py-2.5 text-neutral-300 font-medium">{item.date}</td>
                            <td className="px-4 py-2.5 text-neutral-400">₹{item.openPrice.toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-rose-400 font-bold">
                              ₹{item.priceAt1030.toFixed(2)}{' '}
                              <span className="text-[10px]">({item.morningDipPercent}%)</span>
                            </td>
                            <td className="px-4 py-2.5 text-neutral-200">₹{item.closePrice.toFixed(2)}</td>
                            <td className={`px-4 py-2.5 font-bold ${isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isSuccess ? '+' : ''}
                              {item.reboundPercent}%
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 ${
                                  isSuccess
                                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                    : 'bg-rose-950 text-rose-400 border-rose-800'
                                }`}
                              >
                                {isSuccess ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                {isSuccess ? 'REBOUND 🟢' : 'CONTINUED DIP 🔴'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-neutral-500 flex flex-col items-center gap-2">
                  <Info className="w-5 h-5 text-neutral-400" />
                  <span>No intraday dip events exceeding {threshold}% occurred for {symbol} in the last {period} trading days.</span>
                  <span className="text-[11px] text-neutral-400">Try selecting a lighter Dip Threshold (e.g. -1.5% or -1.0%).</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
