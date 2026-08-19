'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { StockQuote, PaperAccount, PaperOrder } from '@/lib/types';
import {
  Wallet,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';

interface PaperTradingDeskProps {
  quote: StockQuote;
}

const DEFAULT_CASH_BALANCE = 1000000; // ₹10,00,000 (10 Lakhs Virtual INR)

export const PaperTradingDesk: React.FC<PaperTradingDeskProps> = ({ quote }) => {
  const [activeTab, setActiveTab] = useState<'trade' | 'positions' | 'orders'>('trade');

  // Form State
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [orderCategory, setOrderCategory] = useState<'MARKET' | 'LIMIT' | 'GTT_STOPLOSS_TARGET'>('GTT_STOPLOSS_TARGET');
  const [quantity, setQuantity] = useState<number>(10);
  const [limitPrice, setLimitPrice] = useState<number>(quote.price);
  const [targetPercent, setTargetPercent] = useState<number>(4.0);
  const [stopLossPercent, setStopLossPercent] = useState<number>(2.0);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Account State
  const [account, setAccount] = useState<PaperAccount>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('upstox_paper_account_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse paper account state:', e);
        }
      }
    }
    return {
      cashBalance: DEFAULT_CASH_BALANCE,
      totalInvested: 0,
      totalCurrentValue: 0,
      realizedPnL: 0,
      unrealizedPnL: 0,
      positions: [],
      orders: [],
    };
  });

  // Save to LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('upstox_paper_account_v1', JSON.stringify(account));
    }
  }, [account]);

  // Keep Limit Price synced with selected quote price when quote changes
  useEffect(() => {
    setLimitPrice(quote.price);
  }, [quote.price, quote.symbol]);

  // Calculate target & stoploss prices
  const calculatedTargetPrice = useMemo(() => {
    const base = orderCategory === 'LIMIT' ? limitPrice : quote.price;
    return orderType === 'BUY'
      ? Number((base * (1 + targetPercent / 100)).toFixed(2))
      : Number((base * (1 - targetPercent / 100)).toFixed(2));
  }, [quote.price, limitPrice, orderCategory, orderType, targetPercent]);

  const calculatedStopLossPrice = useMemo(() => {
    const base = orderCategory === 'LIMIT' ? limitPrice : quote.price;
    return orderType === 'BUY'
      ? Number((base * (1 - stopLossPercent / 100)).toFixed(2))
      : Number((base * (1 + stopLossPercent / 100)).toFixed(2));
  }, [quote.price, limitPrice, orderCategory, orderType, stopLossPercent]);

  // Recalculate Live Position Values & P&L based on current LTP
  const livePositions = useMemo(() => {
    return account.positions.map((pos) => {
      const currentLTP = pos.symbol === quote.symbol ? quote.price : pos.currentPrice;
      const currentValue = pos.quantity * currentLTP;
      const investedValue = pos.quantity * pos.avgBuyPrice;
      const unrealizedPnL = Number((currentValue - investedValue).toFixed(2));
      const unrealizedPnLPercent = Number(((unrealizedPnL / investedValue) * 100).toFixed(2));

      return {
        ...pos,
        currentPrice: currentLTP,
        currentValue,
        investedValue,
        unrealizedPnL,
        unrealizedPnLPercent,
      };
    });
  }, [account.positions, quote.price, quote.symbol]);

  const totalInvested = useMemo(() => {
    return livePositions.reduce((acc, pos) => acc + pos.investedValue, 0);
  }, [livePositions]);

  const totalCurrentValue = useMemo(() => {
    return livePositions.reduce((acc, pos) => acc + pos.currentValue, 0);
  }, [livePositions]);

  const totalUnrealizedPnL = useMemo(() => {
    return totalCurrentValue - totalInvested;
  }, [totalCurrentValue, totalInvested]);

  const netPortfolioValue = account.cashBalance + totalCurrentValue;

  // Handle 1-Click Order Submission
  const handlePlaceOrder = () => {
    setFeedbackMsg(null);
    const executionPrice = orderCategory === 'LIMIT' ? limitPrice : quote.price;
    const orderTotalCost = executionPrice * quantity;

    if (orderType === 'BUY' && orderTotalCost > account.cashBalance) {
      setFeedbackMsg({
        type: 'error',
        text: `Insufficient virtual cash balance! Required: ₹${orderTotalCost.toLocaleString('en-IN')}`,
      });
      return;
    }

    const timestampStr = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const isGTT = orderCategory === 'GTT_STOPLOSS_TARGET';

    const newOrder: PaperOrder = {
      id: `ord-${Date.now().toString(36)}`,
      symbol: quote.symbol,
      type: orderType,
      orderCategory: orderCategory,
      quantity: quantity,
      price: executionPrice,
      targetPrice: isGTT ? calculatedTargetPrice : undefined,
      stopLossPrice: isGTT ? calculatedStopLossPrice : undefined,
      status: isGTT ? 'TRIGGER_PENDING' : 'EXECUTED',
      timestamp: timestampStr,
    };

    setAccount((prev) => {
      let updatedCash = prev.cashBalance;
      let updatedPositions = [...prev.positions];

      if (orderType === 'BUY') {
        updatedCash -= orderTotalCost;
        const existingPosIdx = updatedPositions.findIndex((p) => p.symbol === quote.symbol);

        if (existingPosIdx >= 0) {
          const pos = updatedPositions[existingPosIdx];
          const newQty = pos.quantity + quantity;
          const newInvested = pos.investedValue + orderTotalCost;
          const newAvgPrice = Number((newInvested / newQty).toFixed(2));

          updatedPositions[existingPosIdx] = {
            ...pos,
            quantity: newQty,
            avgBuyPrice: newAvgPrice,
            investedValue: newInvested,
            currentPrice: executionPrice,
            currentValue: newQty * executionPrice,
          };
        } else {
          updatedPositions.push({
            id: `pos-${quote.symbol}`,
            symbol: quote.symbol,
            companyName: quote.name,
            quantity: quantity,
            avgBuyPrice: executionPrice,
            currentPrice: executionPrice,
            unrealizedPnL: 0,
            unrealizedPnLPercent: 0,
            investedValue: orderTotalCost,
            currentValue: orderTotalCost,
          });
        }
      }

      return {
        ...prev,
        cashBalance: updatedCash,
        positions: updatedPositions,
        orders: [newOrder, ...prev.orders],
      };
    });

    setFeedbackMsg({
      type: 'success',
      text: `${orderType} order for ${quantity} qty of ${quote.symbol} executed cleanly at ₹${executionPrice}!`,
    });
  };

  // Square Off (Exit) Position
  const handleSquareOff = (symbolToExit: string) => {
    const targetPos = livePositions.find((p) => p.symbol === symbolToExit);
    if (!targetPos) return;

    const exitPrice = symbolToExit === quote.symbol ? quote.price : targetPos.currentPrice;
    const exitProceeds = targetPos.quantity * exitPrice;
    const realizedGain = exitProceeds - targetPos.investedValue;

    setAccount((prev) => {
      const remainingPositions = prev.positions.filter((p) => p.symbol !== symbolToExit);
      return {
        ...prev,
        cashBalance: prev.cashBalance + exitProceeds,
        realizedPnL: Number((prev.realizedPnL + realizedGain).toFixed(2)),
        positions: remainingPositions,
        orders: [
          {
            id: `exit-${Date.now().toString(36)}`,
            symbol: symbolToExit,
            type: 'SELL',
            orderCategory: 'MARKET',
            quantity: targetPos.quantity,
            price: exitPrice,
            status: 'EXECUTED',
            timestamp: new Date().toLocaleTimeString('en-IN'),
          },
          ...prev.orders,
        ],
      };
    });

    setFeedbackMsg({
      type: 'success',
      text: `Squared off ${targetPos.quantity} qty of ${symbolToExit} at ₹${exitPrice}. P&L: ₹${realizedGain >= 0 ? '+' : ''}${realizedGain.toLocaleString('en-IN')}`,
    });
  };

  // Reset Paper Trading Account Balance
  const handleResetAccount = () => {
    if (confirm('Are you sure you want to reset your Virtual Account back to ₹10,00,000?')) {
      const freshAccount: PaperAccount = {
        cashBalance: DEFAULT_CASH_BALANCE,
        totalInvested: 0,
        totalCurrentValue: 0,
        realizedPnL: 0,
        unrealizedPnL: 0,
        positions: [],
        orders: [],
      };
      setAccount(freshAccount);
      localStorage.setItem('upstox_paper_account_v1', JSON.stringify(freshAccount));
      setFeedbackMsg({ type: 'success', text: 'Virtual Account reset to ₹10,00,000 INR balance.' });
    }
  };

  return (
    <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl backdrop-blur-md">
      {/* Account Overview Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-950/80 border border-emerald-600/40 rounded-xl text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-neutral-100">Upstox Paper Trading Desk</h3>
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-600/60 text-emerald-400 text-[10px] font-mono rounded-md">
                ₹10L Virtual Sandbox
              </span>
            </div>
            <p className="text-xs text-neutral-400">1-Click GTT Orders & Live P&L Simulation</p>
          </div>
        </div>

        {/* Portfolio Stats Ribbon */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="bg-neutral-950/80 border border-neutral-800 px-3 py-1.5 rounded-xl">
            <span className="text-neutral-500 block text-[10px]">CASH BALANCE</span>
            <span className="font-bold text-neutral-200">₹{account.cashBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>

          <div className="bg-neutral-950/80 border border-neutral-800 px-3 py-1.5 rounded-xl">
            <span className="text-neutral-500 block text-[10px]">NET PORTFOLIO</span>
            <span className="font-bold text-neutral-200">₹{netPortfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>

          <div className="bg-neutral-950/80 border border-neutral-800 px-3 py-1.5 rounded-xl">
            <span className="text-neutral-500 block text-[10px]">UNREALIZED P&L</span>
            <span className={`font-bold ${totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalUnrealizedPnL >= 0 ? '+' : ''}₹{totalUnrealizedPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={handleResetAccount}
            title="Reset Virtual Wallet Balance"
            className="p-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-800/80 pb-2">
        <button
          onClick={() => setActiveTab('trade')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'trade'
              ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          1-Click GTT Desk ({quote.symbol})
        </button>

        <button
          onClick={() => setActiveTab('positions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'positions'
              ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Open Positions ({livePositions.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'orders'
              ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Orders & GTT Triggers ({account.orders.length})
        </button>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300'
              : 'bg-rose-950/60 border-rose-600/60 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-neutral-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* TAB 1: 1-CLICK GTT ORDER FORM */}
      {activeTab === 'trade' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-neutral-950/60 p-4 rounded-xl border border-neutral-800/80">
          {/* Left Column: Order Inputs */}
          <div className="flex flex-col gap-4">
            {/* BUY / SELL Toggle */}
            <div className="grid grid-cols-2 gap-2 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
              <button
                onClick={() => setOrderType('BUY')}
                className={`py-2 rounded-lg font-bold text-xs transition-all ${
                  orderType === 'BUY'
                    ? 'bg-emerald-500 text-neutral-950 shadow-lg shadow-emerald-500/20'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                BUY ({quote.symbol})
              </button>

              <button
                onClick={() => setOrderType('SELL')}
                className={`py-2 rounded-lg font-bold text-xs transition-all ${
                  orderType === 'SELL'
                    ? 'bg-rose-500 text-neutral-950 shadow-lg shadow-rose-500/20'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                SELL ({quote.symbol})
              </button>
            </div>

            {/* Order Category Selector */}
            <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs">
              {(['MARKET', 'LIMIT', 'GTT_STOPLOSS_TARGET'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setOrderCategory(cat)}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    orderCategory === cat
                      ? 'bg-neutral-800 text-emerald-400 border border-neutral-700'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {cat === 'GTT_STOPLOSS_TARGET' ? 'GTT (SL+TP)' : cat}
                </button>
              ))}
            </div>

            {/* Quantity Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono text-neutral-400">QUANTITY (SHARES)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-neutral-100 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  {[10, 50, 100, 500].map((qty) => (
                    <button
                      key={qty}
                      onClick={() => setQuantity(qty)}
                      className="px-2 py-1 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 rounded-lg"
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Limit Price Input if LIMIT */}
            {orderCategory === 'LIMIT' && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono text-neutral-400">LIMIT EXECUTION PRICE (₹)</label>
                <input
                  type="number"
                  step="0.05"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(parseFloat(e.target.value) || quote.price)}
                  className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-neutral-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Right Column: GTT Stop-Loss & Target Controls */}
          <div className="flex flex-col gap-4">
            {orderCategory === 'GTT_STOPLOSS_TARGET' && (
              <div className="flex flex-col gap-3 bg-neutral-900/90 p-3.5 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 border-b border-neutral-800 pb-2">
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    GTT Auto Trigger Conditions
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Real-time Upstox Feed</span>
                </div>

                {/* Target Profit % */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-emerald-400 font-bold">TARGET PROFIT (+{targetPercent}%)</span>
                    <span className="text-neutral-300">₹{calculatedTargetPrice}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={targetPercent}
                    onChange={(e) => setTargetPercent(parseFloat(e.target.value))}
                    className="accent-emerald-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Stop Loss % */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-rose-400 font-bold">STOP LOSS (-{stopLossPercent}%)</span>
                    <span className="text-neutral-300">₹{calculatedStopLossPrice}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="15"
                    step="0.5"
                    value={stopLossPercent}
                    onChange={(e) => setStopLossPercent(parseFloat(e.target.value))}
                    className="accent-rose-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Summary Ticket */}
            <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/80 flex flex-col gap-1.5 text-xs font-mono">
              <div className="flex justify-between text-neutral-400">
                <span>STOCK LTP</span>
                <span className="font-bold text-neutral-100">₹{quote.price}</span>
              </div>

              <div className="flex justify-between text-neutral-400">
                <span>TOTAL ORDER COST</span>
                <span className="font-bold text-neutral-100">
                  ₹{(quote.price * quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between text-neutral-400">
                <span>MARGIN AVAILABLE</span>
                <span className="font-bold text-emerald-400">
                  ₹{account.cashBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handlePlaceOrder}
              className={`w-full py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 ${
                orderType === 'BUY'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/20'
                  : 'bg-rose-500 hover:bg-rose-400 text-neutral-950 shadow-rose-500/20'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              1-Click {orderType} {quantity} Shares of {quote.symbol}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE OPEN POSITIONS */}
      {activeTab === 'positions' && (
        <div className="flex flex-col gap-3">
          {livePositions.length === 0 ? (
            <div className="p-8 text-center bg-neutral-950/60 border border-neutral-800 rounded-xl text-neutral-500 text-xs font-mono">
              No active paper positions. Place a 1-Click GTT order above to start virtual paper trading!
            </div>
          ) : (
            <div className="overflow-x-auto border border-neutral-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
                    <th className="p-3">SYMBOL</th>
                    <th className="p-3">QTY</th>
                    <th className="p-3">AVG BUY PRICE</th>
                    <th className="p-3">CURRENT LTP</th>
                    <th className="p-3">INVESTED VALUE</th>
                    <th className="p-3">UNREALIZED P&L</th>
                    <th className="p-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/40">
                  {livePositions.map((pos) => (
                    <tr key={pos.id} className="hover:bg-neutral-900/80 transition-all">
                      <td className="p-3 font-bold text-neutral-100">{pos.symbol}</td>
                      <td className="p-3 text-neutral-200">{pos.quantity}</td>
                      <td className="p-3 text-neutral-300">₹{pos.avgBuyPrice}</td>
                      <td className="p-3 text-neutral-100 font-bold">₹{pos.currentPrice}</td>
                      <td className="p-3 text-neutral-300">₹{pos.investedValue.toLocaleString('en-IN')}</td>
                      <td className={`p-3 font-bold ${pos.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pos.unrealizedPnL >= 0 ? '+' : ''}₹{pos.unrealizedPnL.toLocaleString('en-IN')} ({pos.unrealizedPnLPercent}%)
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleSquareOff(pos.symbol)}
                          className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-600/60 text-rose-300 text-[11px] font-bold rounded-lg transition-all"
                        >
                          Square Off
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ORDERS & GTT TRIGGERS */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-3">
          {account.orders.length === 0 ? (
            <div className="p-8 text-center bg-neutral-950/60 border border-neutral-800 rounded-xl text-neutral-500 text-xs font-mono">
              No orders placed yet.
            </div>
          ) : (
            <div className="overflow-x-auto border border-neutral-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
                    <th className="p-3">TIME</th>
                    <th className="p-3">SYMBOL</th>
                    <th className="p-3">TYPE</th>
                    <th className="p-3">CATEGORY</th>
                    <th className="p-3">QTY</th>
                    <th className="p-3">PRICE</th>
                    <th className="p-3">TARGET / SL</th>
                    <th className="p-3 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/40">
                  {account.orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-neutral-900/80 transition-all">
                      <td className="p-3 text-neutral-400 text-[11px]">{ord.timestamp}</td>
                      <td className="p-3 font-bold text-neutral-100">{ord.symbol}</td>
                      <td className="p-3 font-bold">
                        <span className={ord.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>{ord.type}</span>
                      </td>
                      <td className="p-3 text-neutral-300 text-[11px]">{ord.orderCategory}</td>
                      <td className="p-3 text-neutral-200">{ord.quantity}</td>
                      <td className="p-3 text-neutral-100 font-bold">₹{ord.price}</td>
                      <td className="p-3 text-neutral-400 text-[11px]">
                        {ord.targetPrice ? `TP: ₹${ord.targetPrice} | SL: ₹${ord.stopLossPrice}` : 'N/A'}
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                            ord.status === 'EXECUTED'
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-600/60'
                              : 'bg-amber-950 text-amber-400 border-amber-600/60'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
