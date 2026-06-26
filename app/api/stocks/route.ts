import { NextResponse } from 'next/server';
import { STOCK_CONFIGS } from '@/lib/stock/configs';

// Phase 4 하드코딩 — Phase 6에서 Supabase stock_simulations 테이블로 교체
export function GET() {
  return NextResponse.json(STOCK_CONFIGS);
}
