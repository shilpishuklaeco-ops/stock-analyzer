import { NextRequest, NextResponse } from 'next/server';
import { runDipRecoveryBacktest } from '@/lib/dipBacktestEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'RELIANCE';
    const threshold = parseFloat(searchParams.get('threshold') || '-2.0');
    const checkTime = searchParams.get('checkTime') || '10:30';
    const period = parseInt(searchParams.get('period') || '250', 10);

    const result = runDipRecoveryBacktest(symbol, threshold, checkTime, period);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error('Error in /api/backtest/dip-recovery route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
