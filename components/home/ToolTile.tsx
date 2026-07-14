// 홈 MORE TOOLS 타일 1장 (Server Component)
// 시각 규격은 components/stock/SimTile.tsx 와 동일하게 맞췄다.
// active: 금색 제목 + 우상단 OPEN → / coming-soon: dim + 클릭 불가 div + "준비 중"
import Link from 'next/link';
import type { ToolTile as ToolTileData } from '@/lib/home/tools';

interface Props {
  tile: ToolTileData;
}

export default function ToolTile({ tile }: Props) {
  const isActive = tile.status === 'active';

  const body = (
    <>
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
