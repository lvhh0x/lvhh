// FE-05 — 회사 시뮬레이션 선택 화면 (Server Component)
// 그리드는 lib/company/tiles.ts(COMPANY_TILES) 단일 소스가 구동.
import type { Metadata } from 'next';
import { COMPANY_TILES } from '@/lib/company/tiles';
import InnerHeader from '@/components/layout/InnerHeader';
import CompanyTile from '@/components/company/CompanyTile';

export const metadata: Metadata = {
  title: 'Operations Simulation — MERIDIAN',
};

export default async function CompanyPage() {
  const tiles = COMPANY_TILES;

  return (
    <>
      <style>{`
        .sim-tile:hover { border-color: #C9A86A !important; }
        .company-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 900px) {
          .company-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .company-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <InnerHeader
        backLabel="홈으로"
        backHref="/"
        crumbA="OPERATIONS SIMULATION"
        crumbB="시뮬레이션 선택"
      />

      <div
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '48px 32px',
        }}
      >
        {/* 페이지 타이틀 (FE-05 원본 헤더) */}
        <div style={{ marginBottom: '40px' }}>
          <div
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: '12px',
              letterSpacing: '0.1em',
              color: '#8c7a55',
              marginBottom: '14px',
            }}
          >
            02 / OPERATIONS SIMULATION
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: '48px',
              fontWeight: 600,
              color: '#E8E0D2',
              letterSpacing: '0.02em',
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            회사 운영{' '}
            <span style={{ fontStyle: 'italic', color: '#C9A86A' }}>
              시뮬레이터
            </span>
          </h1>
        </div>

        {/* 시뮬레이션 타일 그리드 */}
        <div className="company-grid">
          {tiles.map((tile) => (
            <CompanyTile key={tile.id} tile={tile} />
          ))}
        </div>
      </div>
    </>
  );
}
