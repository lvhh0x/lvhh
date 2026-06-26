// 시뮬레이션 타입 타일 (Server Component)
// active: 금색 hover 테두리 + next/link 이동 + 우상단 OPEN
// coming-soon: dim + 클릭 불가(div) + 우상단 "준비 중" 뱃지
import Link from 'next/link';
import type { SimTile as SimTileData } from '@/lib/stock/tiles';

interface Props {
  tile: SimTileData;
}

export default function SimTile({ tile }: Props) {
  const isActive = tile.status === 'active';

  // 카드 본문 (active/coming-soon 공통, 뱃지만 분기)
  const body = (
    <>
      {/* 우상단 상태 뱃지 */}
      <span
        style={{
          position: 'absolute',
          top: '14px',
          right: '16px',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: '10px',
          letterSpacing: '0.08em',
          color: isActive ? '#C9A86A' : '#9C9486',
          background: 'rgba(20,17,14,0.75)',
          padding: '3px 8px',
          borderRadius: '2px',
          border: isActive
            ? '1px solid rgba(201,168,106,0.3)'
            : '1px solid rgba(201,168,106,0.12)',
        }}
      >
        {isActive ? 'OPEN →' : '준비 중'}
      </span>

      {/* 타이틀 */}
      <div
        style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: '26px',
          fontWeight: 600,
          color: '#C9A86A',
          letterSpacing: '0.04em',
          lineHeight: 1.1,
          marginBottom: '8px',
          paddingRight: '64px',
        }}
      >
        {tile.title}
      </div>

      {/* 설명 */}
      <div
        style={{
          fontFamily: 'var(--font-manrope), sans-serif',
          fontSize: '12px',
          color: '#9C9486',
          lineHeight: 1.5,
        }}
      >
        {tile.description}
      </div>
    </>
  );

  // active — 클릭 가능한 Link (hover 테두리는 page.tsx의 .sim-tile:hover 규칙이 담당)
  if (isActive && tile.href) {
    return (
      <Link
        href={tile.href}
        className="sim-tile"
        style={{
          display: 'block',
          position: 'relative',
          textDecoration: 'none',
          background: 'linear-gradient(180deg,#1a1510,#15110d)',
          border: '1px solid rgba(201,168,106,0.15)',
          borderRadius: '2px',
          padding: '28px 24px 30px',
          minHeight: '150px',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
      >
        {body}
      </Link>
    );
  }

  // coming-soon — 클릭 불가 div, dim 처리
  return (
    <div
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg,#1a1510,#15110d)',
        border: '1px solid rgba(201,168,106,0.15)',
        borderRadius: '2px',
        padding: '28px 24px 30px',
        minHeight: '150px',
        opacity: 0.45,
        cursor: 'default',
      }}
    >
      {body}
    </div>
  );
}
