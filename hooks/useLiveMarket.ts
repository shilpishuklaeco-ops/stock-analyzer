'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { NiftyStock } from '@/lib/types';
import { NIFTY_50_STOCKS, INITIAL_MARKET_INDICES, LiveIndexQuote, isNSEMarketOpen } from '@/lib/mockStockData';

export function useLiveMarket() {
  const [stocks, setStocks] = useState<NiftyStock[]>(NIFTY_50_STOCKS);
  const [indices, setIndices] = useState<LiveIndexQuote[]>(INITIAL_MARKET_INDICES);
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
      // 1. First attempt /api/market/quotes
      let res = await fetch('/api/market/quotes', { cache: 'no-store' });
      let data = res.ok ? await res.json() : null;

      // 2. Fallback to /api/market/nse-public for public visitors
      if (!data || !data.success || data.source === 'NSE Baseline Engine') {
        const publicRes = await fetch('/api/market/nse-public', { cache: 'no-store' });
        if (publicRes.ok) {
          const publicData = await publicRes.json();
          if (publicData.success && Array.isArray(publicData.stocks)) {
            data = publicData;
          }
        }
      }

      if (data && data.success) {
        if (Array.isArray(data.stocks)) {
          setStocks((prevStocks) => {
            return data.stocks.map((newStock: NiftyStock) => {
              const oldStock = prevStocks.find((s) => s.symbol === newStock.symbol);
              if (
                oldStock &&
                oldStock.price === newStock.price &&
                oldStock.change === newStock.change
              ) {
                return oldStock;
              }
              return newStock;
            });
          });
        }

        if (Array.isArray(data.indices) && data.indices.length > 0) {
          setIndices(data.indices);
        }

        setDataSource(data.source || 'Public NSE Live Engine');
        setLastSynced(new Date().toLocaleTimeString('en-IN'));
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

    // 2. Background Polling Loop (5s during market open, 15s when closed)
    const marketOpen = isNSEMarketOpen();
    const pollIntervalTime = marketOpen ? 5000 : 15000;

    const interval = setInterval(() => {
      fetchLiveQuotes();
    }, pollIntervalTime);

    return () => clearInterval(interval);
  }, [fetchLiveQuotes]);

  return {
    stocks,
    indices,
    isLoading,
    isRefreshing,
    lastSynced,
    dataSource,
    refreshNow: () => fetchLiveQuotes(true),
  };
}
