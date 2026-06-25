import { NextResponse } from 'next/server';
import { StockConfig } from '@/types/backtest';

// Phase 4 하드코딩 — Phase 6에서 Supabase stock_simulations 테이블로 교체
const STOCK_CONFIGS: StockConfig[] = [
  {
    id: 'schd',
    symbol: 'SCHD',
    displayName: 'SCHD',
    description: '미국 고배당 ETF — S&P 500 배당주 선별',
    currency: 'USD',
    category: ['ETF', '배당', '미국'],
  },
  {
    id: 'qqq',
    symbol: 'QQQ',
    displayName: 'QQQ',
    description: '미국 나스닥 100 ETF',
    currency: 'USD',
    category: ['ETF', '성장', '미국'],
  },
  {
    id: 'voo',
    symbol: 'VOO',
    displayName: 'VOO',
    description: '미국 S&P 500 ETF — Vanguard',
    currency: 'USD',
    category: ['ETF', '분산', '미국'],
  },
  {
    id: 'tqqq',
    symbol: 'TQQQ',
    displayName: 'TQQQ',
    description: '나스닥 3배 레버리지 ETF',
    currency: 'USD',
    category: ['ETF', '레버리지', '미국'],
  },
  {
    id: 'samsung',
    symbol: '005930',
    displayName: '삼성전자',
    description: '국내 반도체·전자 대형주',
    currency: 'KRW',
    category: ['주식', '대형주', '국내'],
  },
  {
    id: 'kodex200',
    symbol: '069500',
    displayName: 'KODEX 200',
    description: '국내 KOSPI 200 지수 ETF',
    currency: 'KRW',
    category: ['ETF', '지수', '국내'],
  },
];

export function GET() {
  return NextResponse.json(STOCK_CONFIGS);
}
