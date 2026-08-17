'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { NiftyStock } from '@/lib/types';
import { NIFTY_50_STOCKS, isNSEMarketOpen } from '@/lib/mockStockData';

export function useLiveMarket() {
  const [stocks, setStocks] = useState<NiftyStock[]>(NIFTY_50_STOCKS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string>('');
  const [dataSource, setDataSource] = useState<string>('Initializing');
  const isFetchingRef = useRef<boolean>(false);

  const fetchLiveQuotes = useCallback(async (isManual = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (isManual) setIsRefreshing(true);

    try {
      const res = await fetch('/api/market/quotes', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.stocks)) {
          setStocks((prevStocks) => {
            // Smoothly merge live prices without breaking object references
            return data.stocks.map((newStock: NiftyStock) => {
              const oldStock = prevStocks.find((s) => s.symbol === newStock.symbol);
              if (
                oldStock &&
                oldStock.price === newStock.price &&
                oldStock.change === newStock.change
              ) {
                return oldStock; // Keep reference to prevent unnecessary UI re-renders
              }
              return newStock;
            });
          });

          setDataSource(data.source || 'Upstox / NSE Live Feed');
          setLastSynced(new Date().toLocaleTimeString('en-IN'));
        }
      }
    } catch (err) {
      console.warn('Live Market Auto-Sync Warning:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // 1. Instant Page Load Auto-Sync
    fetchLiveQuotes();

    // 2. Background Polling Loop (5s during market open, 20s when closed)
    const marketOpen = isNSEMarketOpen();
    const pollIntervalTime = marketOpen ? 5000 : 20000;

    const interval = setInterval(() => {
      fetchLiveQuotes();
    }, pollIntervalTime);

    return () => clearInterval(interval);
  }, [fetchLiveQuotes]);

  return {
    stocks,
    isLoading,
    isRefreshing,
    lastSynced,
    dataSource,
    refreshNow: () => fetchLiveQuotes(true),
  };
}
