// FE-03 — 종목 목록 화면 (Server Component)
import type { Metadata } from 'next';
import type { StockConfig } from '@/types/backtest';
import InnerHeader from '@/components/layout/InnerHeader';
import StockCard from '@/components/stock/StockCard';

export const metadata: Metadata = {
  title: 'Stock Simulation — MERIDIAN',
};

async function getStocks(): Promise<StockConfig[]> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${base}/api/stocks`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json() as Promise<StockConfig[]>;
}

export default async function StockPage() {
  const stocks = await getStocks();

  return (
    <>
      <style>{`
        .stock-card:hover { border-color: #C9A86A !important; }
        .stock-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 900px) {
          .stock-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .stock-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <InnerHeader
        backLabel="홈으로"
        backHref="/"
        crumbA="STOCK SIMULATION"
        crumbB="종목 선택"
      />

      <div
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '48px 32px',
        }}
      >
        {/* 페이지 타이틀 */}
        <div style={{ marginBottom: '40px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: '36px',
              fontWeight: 600,
              color: '#C9A86A',
              letterSpacing: '0.06em',
              margin: '0 0 10px',
            }}
          >
            STOCK SIMULATION
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: '13px',
              color: '#9C9486',
              margin: 0,
              letterSpacing: '0.02em',
            }}
          >
            종목을 선택하여 백테스트를 시작하세요
          </p>
        </div>

        {/* 종목 카드 그리드 */}
        <div className="stock-grid">
          {stocks.map((stock) => (
            <StockCard key={stock.id} stock={stock} />
          ))}
        </div>
      </div>
    </>
  );
}
