'use client';

import React, { useState, useEffect } from 'react';
import { NewsItem } from '@/lib/types';
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus, Clock, RefreshCw, Filter } from 'lucide-react';

interface StockNewsFeedProps {
  symbol: string;
}

export const StockNewsFeed: React.FC<StockNewsFeedProps> = ({ symbol }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'BULLISH' | 'BEARISH'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'WSB_RETAIL' | 'FINANCIAL_MEDIA'>('ALL');

  const fetchNews = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch(`/api/news?symbol=${symbol}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.news)) {
          setNews(data.news);
        }
      }
    } catch (err) {
      console.warn('News fetch warning:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [symbol]);

  // Counts
  const wsbCount = news.filter((n) => n.category === 'WSB_RETAIL' || n.source.includes('WSB')).length;
  const bullishCount = news.filter((n) => n.sentiment === 'BULLISH').length;
  const bearishCount = news.filter((n) => n.sentiment === 'BEARISH').length;

  const filteredNews = news.filter((item) => {
    const matchesSentiment = activeFilter === 'ALL' || item.sentiment === activeFilter;
    const matchesCategory =
      categoryFilter === 'ALL'
        ? true
        : categoryFilter === 'WSB_RETAIL'
        ? item.category === 'WSB_RETAIL' || item.source.includes('WSB')
        : item.category !== 'WSB_RETAIL' && !item.source.includes('WSB');

    return matchesSentiment && matchesCategory;
  });

  const bullishPercent = news.length > 0 ? Math.round((bullishCount / news.length) * 100) : 50;

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-neutral-100 tracking-tight">
            Live Market News & WSB Retail Sentiment
          </h3>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-mono font-bold">
            {symbol}
          </span>
        </div>

        {/* Source Category & Sentiment Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Tabs: All vs WSB Buzz vs Media */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 font-mono">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                categoryFilter === 'ALL'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All News ({news.length})
            </button>

            <button
              onClick={() => setCategoryFilter('WSB_RETAIL')}
              className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1 ${
                categoryFilter === 'WSB_RETAIL'
                  ? 'bg-purple-950 text-purple-300 border border-purple-600/80 shadow-md shadow-purple-950'
                  : 'text-purple-400/80 hover:text-purple-300'
              }`}
            >
              🚀 WSB & Retail Buzz ({wsbCount})
            </button>
          </div>

          {/* Sentiment Filter Tabs */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-neutral-800 text-white font-semibold border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Sentiments
            </button>
            <button
              onClick={() => setActiveFilter('BULLISH')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                activeFilter === 'BULLISH'
                  ? 'bg-emerald-950 text-emerald-400 font-semibold border border-emerald-800'
                  : 'text-emerald-500/80 hover:text-emerald-400'
              }`}
            >
              <TrendingUp className="w-3 h-3" /> Bullish ({bullishCount})
            </button>
            <button
              onClick={() => setActiveFilter('BEARISH')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                activeFilter === 'BEARISH'
                  ? 'bg-rose-950 text-rose-400 font-semibold border border-rose-800'
                  : 'text-rose-500/80 hover:text-rose-400'
              }`}
            >
              <TrendingDown className="w-3 h-3" /> Bearish ({bearishCount})
            </button>
          </div>

          <button
            onClick={() => fetchNews(true)}
            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white transition-all ml-1"
            title="Force Refresh Live News"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sentiment Score Ratio Bar */}
      {news.length > 0 && (
        <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80 text-xs">
          <div className="flex justify-between items-center text-neutral-400 mb-1.5 font-medium">
            <span className="flex items-center gap-1">
              Overall Media & WSB Retail Sentiment Ratio
            </span>
            <span className="font-mono text-emerald-400 font-semibold">
              {bullishPercent}% Positive Bullish Sentiment
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden flex border border-neutral-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${bullishPercent}%` }}
            />
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{ width: `${100 - bullishPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* News Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-neutral-950 rounded-xl border border-neutral-800/60 animate-pulse p-4" />
          ))}
        </div>
      ) : filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNews.map((item) => {
            const isBullish = item.sentiment === 'BULLISH';
            const isBearish = item.sentiment === 'BEARISH';
            const isWsb = item.category === 'WSB_RETAIL' || item.source.includes('WSB');

            return (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-4 rounded-xl bg-neutral-950 border transition-all flex flex-col justify-between group hover:scale-[1.01] ${
                  isWsb ? 'border-purple-900/60 hover:border-purple-600/80 shadow-md shadow-purple-950/40' : 'border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div>
                  {/* Top Meta: Source & Time */}
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span
                      className={`font-semibold px-2 py-0.5 rounded border ${
                        isWsb
                          ? 'bg-purple-950 text-purple-300 border-purple-600/60'
                          : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                      }`}
                    >
                      {isWsb ? '🔥 WSB RETAIL BUZZ' : item.source}
                    </span>
                    <span className="text-neutral-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.publishedAt}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-xs font-semibold text-neutral-200 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
                </div>

                {/* Footer: Sentiment Badge & Link Icon */}
                <div className="mt-4 pt-2 border-t border-neutral-900 flex items-center justify-between text-xs">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                      isBullish
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800/80'
                        : isBearish
                        ? 'bg-rose-950 text-rose-400 border-rose-800/80'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    {isBullish ? (
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                    ) : isBearish ? (
                      <TrendingDown className="w-3 h-3 text-rose-400" />
                    ) : (
                      <Minus className="w-3 h-3 text-neutral-400" />
                    )}
                    {item.sentiment}
                  </span>

                  <span className="text-[11px] text-neutral-500 group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                    Read Article <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-neutral-500 font-mono">
          No news articles found for {symbol} under the selected filters.
        </div>
      )}
    </div>
  );
};

