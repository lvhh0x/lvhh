// FE-03 — 시뮬레이션 선택 화면 (Server Component)
// 그리드는 lib/stock/tiles.ts(SIM_TILES) 단일 소스가 구동.
import type { Metadata } from 'next';
import { SIM_TILES } from '@/lib/stock/tiles';
import InnerHeader from '@/components/layout/InnerHeader';
import SimTile from '@/components/stock/SimTile';

export const metadata: Metadata = {
  title: 'Stock Simulation — MERIDIAN',
};

export default async function StockPage() {
  const tiles = SIM_TILES;

  return (
    <>
      <style>{`
        .sim-tile:hover { border-color: #C9A86A !important; }
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
        crumbB="시뮬레이션 선택"
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
            시뮬레이션 유형을 선택하세요
          </p>
        </div>

        {/* 시뮬레이션 타일 그리드 */}
        <div className="stock-grid">
          {tiles.map((tile) => (
            <SimTile key={tile.id} tile={tile} />
          ))}
        </div>
      </div>
    </>
  );
}
