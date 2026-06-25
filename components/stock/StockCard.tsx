// FE-03 — 종목 카드 컴포넌트 (Server Component)
import Link from 'next/link';
import CandleSvg from '@/components/svg/CandleSvg';
import LineSvg from '@/components/svg/LineSvg';
import { walk } from '@/lib/svg/generators';
import type { StockConfig } from '@/types/backtest';

interface Props {
  stock: StockConfig;
}

// 문자열 → 결정론적 시드 (동일 id라면 항상 같은 차트 모양)
function strSeed(s: string): number {
  return (
    Array.from(s).reduce((a, c) => (((a << 5) - a) + c.charCodeAt(0)) | 0, 0) >>> 0
  );
}

export default function StockCard({ stock }: Props) {
  const seed = strSeed(stock.id);
  const isUsd = stock.currency === 'USD';

  return (
    <Link
      href={`/stock/${stock.id}`}
      className="stock-card"
      style={{
        display: 'block',
        textDecoration: 'none',
        background: 'linear-gradient(180deg,#1a1510,#15110d)',
        border: '1px solid rgba(201,168,106,0.15)',
        borderRadius: '2px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}
    >
      {/* SVG 차트 영역 + 통화 뱃지 */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <span
          style={{
            position: 'absolute',
            top: '10px',
            right: '12px',
            zIndex: 2,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: '10px',
            color: '#C9A86A',
            letterSpacing: '0.08em',
            background: 'rgba(20,17,14,0.75)',
            padding: '2px 7px',
            borderRadius: '2px',
            border: '1px solid rgba(201,168,106,0.3)',
          }}
        >
          {stock.currency}
        </span>

        <div style={{ opacity: 0.75 }}>
          {isUsd ? (
            <CandleSvg seed={seed} n={20} />
          ) : (
            <LineSvg
              vals={walk(40, seed, 0.5, 18)}
              w={720}
              h={130}
              color="#C9A86A"
              area
              sw={1.5}
            />
          )}
        </div>
      </div>

      {/* 텍스트 정보 영역 */}
      <div style={{ padding: '18px 20px 20px' }}>
        {/* 종목명 */}
        <div
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: '26px',
            fontWeight: 600,
            color: '#C9A86A',
            letterSpacing: '0.04em',
            lineHeight: 1.1,
            marginBottom: '6px',
          }}
        >
          {stock.displayName}
        </div>

        {/* 설명 */}
        <div
          style={{
            fontFamily: 'var(--font-manrope), sans-serif',
            fontSize: '12px',
            color: '#9C9486',
            lineHeight: 1.5,
            marginBottom: '14px',
          }}
        >
          {stock.description}
        </div>

        {/* 카테고리 태그 */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {stock.category.map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: '10px',
                color: '#9C9486',
                background: 'rgba(201,168,106,0.08)',
                border: '1px solid rgba(201,168,106,0.12)',
                borderRadius: '2px',
                padding: '2px 8px',
                letterSpacing: '0.04em',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
