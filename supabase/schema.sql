-- Supabase Database Schema for Stock Analyzer

-- 1. Create Watchlists Table
CREATE TABLE IF NOT EXISTS watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  sector VARCHAR(50),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Stock Quotes History Table
CREATE TABLE IF NOT EXISTS stock_quotes_history (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  change NUMERIC(10, 2) NOT NULL,
  change_percent NUMERIC(8, 2) NOT NULL,
  volume BIGINT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS) - Public Read/Write for Demo
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_quotes_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on watchlists" ON watchlists FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on watchlists" ON watchlists FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access on watchlists" ON watchlists FOR DELETE USING (true);

CREATE POLICY "Allow public read access on stock_quotes_history" ON stock_quotes_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on stock_quotes_history" ON stock_quotes_history FOR INSERT WITH CHECK (true);
