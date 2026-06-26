'use client';

// FE-04 — ETF 직접입력 시뮬레이션 화면 (Client Component)
// 티커·종목코드를 직접 입력 → range 3-상태 조회 → 기존 2패널(StockParams/StockResult) 재사용.

import { useState, useCallback } from 'react';
import type {
  StockConfig,
  StockRange,
  BacktestRequest,
  BacktestResult,
} from '@/types/backtest';
import InnerHeader from '@/components/layout/InnerHeader';
import StockParams, { type RangeStatus } from '@/components/stock/StockParams';
import StockResult from '@/components/stock/StockResult';

const C = {
  gold: '#C9A86A',
  text: '#E8E0D2',
  muted: '#9C9486',
} as const;

export default function EtfDirectPage() {
  const [input, setInput] = useState('');
  const [symbol, setSymbol] = useState<string | null>(null);
  const [dataRange, setDataRange] = useState<StockRange | null>(null);
  const [rangeStatus, setRangeStatus] = useState<RangeStatus>('loading');
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 데이터 가능 기간 조회 (Python 서버) — 3-상태로 관리, retry 재호출 가능
  const loadRange = useCallback(async (sym: string) => {
    setRangeStatus('loading');
    setDataRange(null);
    try {
      const res = await fetch(`/api/stocks/${encodeURIComponent(sym)}/range`);
      if (!res.ok) {
        setRangeStatus('error');
        return;
      }
      const range = (await res.json()) as StockRange;
      setDataRange(range);
      setRangeStatus('ok');
    } catch {
      setRangeStatus('error');
    }
  }, []);

  function handleLookup() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setSymbol(trimmed);
    setResult(null);
    setError(null);
    void loadRange(trimmed);
  }

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
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? '시뮬레이션 실패');
        return;
      }
      const data = (await res.json()) as BacktestResult;
      setResult(data);
    } catch {
      setError('서버 연결 실패. Python 서버를 확인하세요.');
    } finally {
      setIsLoading(false);
    }
  }

  // 입력 문자열로 합성한 StockConfig (통화는 프론트 휴리스틱: 6자리=KRW, else USD)
  const stock: StockConfig | null = symbol
    ? {
        id: symbol,
        symbol,
        displayName: symbol,
        description: '',
        currency: /^\d{6}$/.test(symbol) ? 'KRW' : 'USD',
        category: ['ETF'],
      }
    : null;

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .sim-layout { flex-direction: column !important; }
          .sim-params { width: 100% !important; position: static !important; }
        }
      `}</style>

      <InnerHeader
        backLabel="시뮬레이션 선택"
        backHref="/stock"
        crumbA="STOCK SIMULATION"
        crumbB="ETF 시뮬레이션"
      />

      <main
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '40px 32px',
        }}
      >
        {/* 종목 입력 */}
        <div
          style={{
            background: 'linear-gradient(180deg,#1a1510,#15110d)',
            border: '1px solid rgba(201,168,106,0.15)',
            borderRadius: '2px',
            padding: '24px',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: '10px',
              color: C.gold,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            종목 입력
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={input}
              placeholder="SCHD 또는 005930"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLookup();
              }}
              style={{
                flex: 1,
                background: 'rgba(201,168,106,0.06)',
                border: '1px solid rgba(201,168,106,0.2)',
                borderRadius: '2px',
                color: C.text,
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: '14px',
                padding: '10px 12px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={handleLookup}
              style={{
                padding: '0 24px',
                background: 'rgba(201,168,106,0.18)',
                border: '1px solid rgba(201,168,106,0.5)',
                borderRadius: '2px',
                color: C.gold,
                fontFamily: 'var(--font-manrope), sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              조회
            </button>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: '11px',
              color: C.muted,
              lineHeight: 1.6,
              marginTop: '10px',
            }}
          >
            영문 티커(SCHD) 또는 6자리 종목코드(005930)를 입력하세요. 등록된 한글명도 가능합니다.
          </div>
        </div>

        {/* 종목 확정 시 2패널 */}
        {stock ? (
          <div
            className="sim-layout"
            style={{
              display: 'flex',
              gap: '28px',
              alignItems: 'flex-start',
            }}
          >
            {/* 좌측: 입력 패널 (320px 고정) */}
            <div className="sim-params" style={{ width: '320px', flexShrink: 0 }}>
              <StockParams
                stock={stock}
                dataRange={dataRange}
                rangeStatus={rangeStatus}
                onRetryRange={() => void loadRange(stock.symbol)}
                onSubmit={handleBacktest}
                isLoading={isLoading}
              />
            </div>

            {/* 우측: 결과 패널 (flex-1) */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <StockResult result={result} isLoading={isLoading} error={error} />
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
}
