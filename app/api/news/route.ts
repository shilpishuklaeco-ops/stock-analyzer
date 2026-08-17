import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveStockNews } from '@/lib/newsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'RELIANCE';

    const news = await fetchLiveStockNews(symbol);

    return NextResponse.json({
      success: true,
      symbol,
      count: news.length,
      timestamp: new Date().toISOString(),
      news,
    });
  } catch (error) {
    console.error('Error in /api/news API route:', error);
    return NextResponse.json(
      { success: false, news: [], error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
