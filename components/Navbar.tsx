'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NIFTY_50_STOCKS, getNSESessionStatus } from '@/lib/mockStockData';
import { Search, TrendingUp, ShieldCheck, LogIn, RefreshCw, BarChart2, History, Bot } from 'lucide-react';

interface NavbarProps {
  activeSymbol: string;
  onSelectStock: (symbol: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeSymbol, onSelectStock }) => {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'PRE_OPEN' | 'LIVE' | 'CLOSED'>('LIVE');

  useEffect(() => {
    setMounted(true);
    setSessionStatus(getNSESessionStatus());

    const interval = setInterval(() => {
      setSessionStatus(getNSESessionStatus());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const activeStock = NIFTY_50_STOCKS.find((s) => s.symbol === activeSymbol) || NIFTY_50_STOCKS[0];

  const filteredStocks = NIFTY_50_STOCKS.filter(
    (s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (symbol: string) => {
    onSelectStock(symbol);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleForceRefresh = () => {
    window.location.reload();
  };

  const navLinks = [
    { href: '/', label: 'Live Terminal', icon: BarChart2 },
    { href: '/backtest', label: 'Backtest Lab', icon: History },
    { href: '/ai-signals', label: 'AI Signals', icon: Bot },
  ];

  return (
    <header className="w-full bg-neutral-900/95 backdrop-blur border-b border-neutral-800 sticky top-0 z-50">
      {/* Top Ticker Ribbon */}
      <div className="bg-neutral-950 border-b border-neutral-800/60 py-1.5 px-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-6 text-[11px] font-mono whitespace-nowrap max-w-7xl mx-auto">
          {/* Dynamic Session Status Badge */}
          {sessionStatus === 'PRE_OPEN' ? (
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>NSE PRE-OPEN SESSION (Price Discovery Active)</span>
            </div>
          ) : sessionStatus === 'LIVE' ? (
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>NSE MARKET SESSION ACTIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              <span>NSE MARKET CLOSED (Opens 09:00 AM IST)</span>
            </div>
          )}

          <div className="text-neutral-600">|</div>

          {/* Quick Index Tickers */}
          <div className="flex items-center gap-4 text-neutral-300">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-neutral-200">NIFTY 50</span>
              <span className="text-emerald-400">24,541.15</span>
              <span className="text-emerald-400 text-[10px]">(+0.46%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-neutral-200">SENSEX</span>
              <span className="text-emerald-400">80,436.84</span>
              <span className="text-emerald-400 text-[10px]">(+0.52%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-neutral-200">BANK NIFTY</span>
              <span className="text-emerald-400">50,803.15</span>
              <span className="text-emerald-400 text-[10px]">(+0.38%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand & Dynamic Subtitle */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer" onClick={() => handleSelect('RELIANCE')}>
          <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-neutral-950 shadow-lg shadow-emerald-950">
            <TrendingUp className="w-5 h-5 font-bold" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              Stock Analyzer Pro
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                NSE LIVE
              </span>
            </h1>
            <p className="text-[11px] text-neutral-400 font-medium transition-all" suppressHydrationWarning>
              <strong className="text-emerald-400" suppressHydrationWarning>
                {mounted ? activeStock.name : 'Reliance Industries Ltd.'}
              </strong>{' '}
              & Nifty 50 Technical Intelligence
            </p>
          </div>
        </Link>

        {/* Page Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={`${link.href}?symbol=${activeSymbol}`}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-neutral-800 text-emerald-400 border border-neutral-700 shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-neutral-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Stock Search Input & Autocomplete */}
        <div className="relative flex-1 max-w-xs hidden lg:block">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Nifty 50 (TCS, INFY)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && searchQuery && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
              {filteredStocks.length > 0 ? (
                filteredStocks.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleSelect(stock.symbol)}
                    className="w-full px-4 py-2.5 text-left hover:bg-neutral-800 flex items-center justify-between border-b border-neutral-800/40 last:border-0 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-neutral-100 flex items-center gap-2">
                        {stock.symbol}
                        <span className="text-[10px] font-normal text-neutral-400 font-mono">
                          {stock.sector}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400">{stock.name}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-neutral-200">
                        ₹{stock.price.toFixed(2)}
                      </div>
                      <div
                        className={`text-[10px] ${
                          stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {stock.change >= 0 ? '+' : ''}
                        {stock.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-xs text-neutral-500 text-center">No stocks found</div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Supabase Status Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-300 font-medium">Supabase DB</span>
          </div>

          {/* Force Refresh Button */}
          <button
            onClick={handleForceRefresh}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-all text-xs font-mono"
            title="Force Reload Data"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Upstox OAuth Login Button */}
          <a
            href="/api/auth/upstox/login"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-emerald-950"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upstox Login</span>
          </a>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden items-center justify-around bg-neutral-950 border-t border-neutral-800 py-2 px-2">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={`${link.href}?symbol=${activeSymbol}`}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                isActive ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};
