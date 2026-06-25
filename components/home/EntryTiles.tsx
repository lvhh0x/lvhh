import type { ReactNode, CSSProperties } from 'react';
import Link from 'next/link';

interface EntryTilesProps {
  heroCurveSm: ReactNode;
  heroPallet: ReactNode;
}

const CARD: CSSProperties = {
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
            {String.fromCharCode(0xC8FC, 0xC2DD, 0x20, 0xBC31, 0xD14C, 0xC2A4, 0xD2B8)}
          </h2>
          <p style={{ margin: '0 0 18px', fontSize: '12px', color: '#7a7264' }}>
            {String.fromCharCode(
              0xC2DC, 0xB4DC, 0xB7, 0xC218, 0xC775, 0xB960, 0x20,
              0xC870, 0xAC74, 0xC73C, 0xB85C, 0x20,
              0xD3EC, 0xD2B8, 0xD3F4, 0xB9AC, 0xC624, 0xB97C, 0x20,
              0xC2DC, 0xBBAC, 0xB808, 0xC774, 0xC158
            )}
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
            {String.fromCharCode(
              0xD68C, 0xC0AC, 0x20,
              0xC6B4, 0xC601, 0x20,
              0xC2DC, 0xBBAC, 0xB808, 0xC774, 0xC158
            )}
          </h2>
          <p style={{ margin: '0 0 18px', fontSize: '12px', color: '#7a7264' }}>
            {String.fromCharCode(
              0xD314, 0xB808, 0xD2B8, 0x20,
              0xC801, 0xC7AC, 0xB7, 0xBB3C, 0xB958, 0xBE44, 0xC6A9, 0x20,
              0xCD5C, 0xC801, 0xD654, 0xB97C, 0x20,
              0xC2DC, 0xBBAC, 0xB808, 0xC774, 0xC158
            )}
          </p>
          <div>{heroPallet}</div>
        </div>
      </Link>
    </div>
  );
}
