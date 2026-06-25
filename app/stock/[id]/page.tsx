'use client';

// FE-04 — 주식 시뮬레이션 실행 화면 (Client Component)

import { useState, useEffect } from 'react';
import type {
  StockConfig,
  StockRange,
  BacktestRequest,
  BacktestResult,
} from '@/types/backtest';
import InnerHeader from '@/components/layout/InnerHeader';
import StockParams from '@/components/stock/StockParams';
import StockResult from '@/components/stock/StockResult';

interface PageProps {
  params: { id: string };
}

// 종목 설정 (app/api/stocks/route.ts와 동일, Phase 6에서 API로 교체)
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

export default function StockRunPage({ params }: PageProps) {
  const { id } = params;

  const [stock, setStock] = useState<StockConfig | null>(null);
  const [dataRange, setDataRange] = useState<StockRange | null>(null);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // null = 아직 로드 전 / undefined = 미존재
  const [stockStatus, setStockStatus] = useState<'loading' | 'found' | 'notfound'>('loading');

  // 종목 설정 로드
  useEffect(() => {
    const found = STOCK_CONFIGS.find((s) => s.id === id);
    if (found) {
      setStock(found);
      setStockStatus('found');
    } else {
      setStockStatus('notfound');
    }
  }, [id]);

  // 데이터 가능 기간 조회 (Python 서버)
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/stocks/${id}/range`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json() as Promise<StockRange>;
      })
      .then((range) => {
        if (!cancelled) setDataRange(range);
      })
      .catch(() => {
        if (!cancelled) setDataRange(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleBacktest(req: BacktestRequest) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        setError(body.error ?? '시뮬레이션 실패');
        return;
      }
      const data = await res.json() as BacktestResult;
      setResult(data);
    } catch {
      setError('서버 연결 실패. Python 서버를 확인하세요.');
    } finally {
      setIsLoading(false);
    }
  }

  const displayName = stock?.displayName ?? id.toUpperCase();

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .sim-layout { flex-direction: column !important; }
          .sim-params { width: 100% !important; position: static !important; }
        }
      `}</style>

      <InnerHeader
        backLabel="종목 선택"
        backHref="/stock"
        crumbA="STOCK SIMULATION"
        crumbB={displayName}
      />

      <main
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '40px 32px',
        }}
      >
        {stockStatus === 'notfound' ? (
          <div
            style={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: '13px',
              color: '#9C9486',
              textAlign: 'center',
              marginTop: '80px',
            }}
          >
            종목을 찾을 수 없습니다: {id}
          </div>
        ) : stock ? (
          /* 2패널 레이아웃 */
          <div
            className="sim-layout"
            style={{
              display: 'flex',
              gap: '28px',
              alignItems: 'flex-start',
            }}
          >
            {/* 좌측: 입력 패널 (320px 고정) */}
            <div
              className="sim-params"
              style={{ width: '320px', flexShrink: 0 }}
            >
              <StockParams
                stock={stock}
                dataRange={dataRange}
                onSubmit={handleBacktest}
                isLoading={isLoading}
              />
            </div>

            {/* 우측: 결과 패널 (flex-1) */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <StockResult
                result={result}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
}
