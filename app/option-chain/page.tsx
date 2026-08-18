'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { OptionChainTable } from '@/components/OptionChainTable';
import { useLiveMarket } from '@/hooks/useLiveMarket';

export default function OptionChainPage() {
  const [activeSymbol, setActiveSymbol] = useState<string>('NIFTY50');
  const { indices: liveIndices } = useLiveMarket();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 font-sans antialiased">
      {/* Navbar Header */}
      <Navbar activeSymbol={activeSymbol} onSelectStock={setActiveSymbol} indices={liveIndices} />

      {/* Main Option Chain Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        <OptionChainTable symbol={activeSymbol} onSymbolChange={setActiveSymbol} />
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-4 text-center text-xs text-neutral-500 font-mono">
        Upstox v2/v3 Option Chain Engine • Real-Time Option Greeks & Put-Call Ratio Analytics
      </footer>
    </div>
  );
}
