import type { ReactNode } from 'react';
import Link from 'next/link';

interface EntryTilesProps {
  heroCurveSm: ReactNode;
  heroPallet: ReactNode;
}

const CARD: React.CSSProperties = {
  border: '1px solid rgba(201,168,106,.18)',
  borderRadius: '4px',
  padding: '28px 28px 20px',
  background: 'rgba(201,168,106,.03)',
  height: '100%',
  boxSizing: 'border-box',
};

export default function EntryTiles({ heroCurveSm, heroPallet }: EntryTilesProps) {
  return (
    <div
      style={{
        maxWidth: '1180px',
        margin: '0 auto',
        padding: '0 32px 48px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
      }}
    >
      <Link href="/stock" style={{ textDecoration: 'none', display: 'block' }}>
        <div style={CARD}>
          <p style={{ margin: '0 0 6px', fontSize: '10px', letterSpacing: '0.16em', color: '#8c7a55' }}>
            STOCK SIMULATION
          </p>
          <h2
            style={{
              margin: '0 0 6px',
              fontFamily: 'var(--font-cormorant)',
              fontSize: '26px',
              fontWeight: 500,
              color: '#E8E0D2',
            }}
          >
            {'\uc8fc\uc2dd \ubc31\ud14c\uc2a4\ud2b8'}
          </h2>
          <p style={{ margin: '0 0 18px', fontSize: '12px', color: '#7a7264' }}>
            {'\uc2dc\ub4dc\b7\uc218\uc775\ub960 \uc870\uac74\uc73c\ub85c \ud3ec\ud2b8\ud3f4\ub9ac\uc624\ub97c \uc2dc\ubbac\ub808\uc774\uc158'}
          </p>
          <div style={{ opacity: 0.85 }}>{heroCurveSm}</div>
        </div>
      </Link>

      <Link href="/company" style={{ textDecoration: 'none', display: 'block' }}>
        <div style={CARD}>
          <p style={{ margin: '0 0 6px', fontSize: '10px', letterSpacing: '0.16em', color: '#8c7a55' }}>
            COMPANY SIMULATION
          </p>
          <h2
            style={{
              margin: '0 0 6px',
              fontFamily: 'var(--font-cormorant)',
              fontSize: '26px',
              fontWeight: 500,
              color: '#E8E0D2',
            }}
          >
            {'\ud68c\uc0ac \uc6b4\uc601 \uc2dc\ubbac\ub808\uc774\uc158'}
          </h2>
          <p style={{ margin: '0 0 18px', fontSize: '12px', color: '#7a7264' }}>
            {'\ud314\ub808\ud2b8 \uc801\uc7ac\b7\ubb3c\ub958\ube44\uc6a9 \ucd5c\uc801\ud654\ub97c \uc2dc\ubbac\ub808\uc774\uc158'}
          </p>
          <div>{heroPallet}</div>
        </div>
      </Link>
    </div>
  );
}
