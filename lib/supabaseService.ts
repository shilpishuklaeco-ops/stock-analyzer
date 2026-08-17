import { supabase, isSupabaseConfigured } from './supabaseClient';
import { StockQuote } from './types';

export interface WatchlistItem {
  id?: string;
  symbol: string;
  name: string;
  sector?: string;
  added_at?: string;
}

/**
 * Fetch all saved watchlist items from Supabase database
 */
export async function getWatchlistFromSupabase(): Promise<WatchlistItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .order('added_at', { ascending: false });

    if (error) {
      console.warn('Supabase watchlist fetch warning:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error fetching watchlist from Supabase:', err);
    return [];
  }
}

/**
 * Add a stock to Supabase Watchlist table
 */
export async function addToSupabaseWatchlist(symbol: string, name: string, sector?: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('watchlists')
      .upsert({ symbol, name, sector }, { onConflict: 'symbol' });

    if (error) {
      console.error('Failed to add to Supabase watchlist:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error adding to Supabase watchlist:', err);
    return false;
  }
}

/**
 * Remove a stock from Supabase Watchlist table
 */
export async function removeFromSupabaseWatchlist(symbol: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('watchlists')
      .delete()
      .eq('symbol', symbol);

    if (error) {
      console.error('Failed to remove from Supabase watchlist:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error removing from Supabase watchlist:', err);
    return false;
  }
}

/**
 * Save live price snapshot tick to Supabase stock_quotes_history table
 */
export async function recordQuoteSnapshotInSupabase(quote: StockQuote): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  try {
    await supabase.from('stock_quotes_history').insert({
      symbol: quote.symbol,
      price: quote.price,
      change: quote.change,
      change_percent: quote.changePercent,
      volume: quote.volume,
    });
  } catch (err) {
    // Silent catch for live tick logging
  }
}
