'use client';

// \ud68c\uc0ac \uc2dc\ubbac\ub808\uc774\uc158 \uacb0\uacfc \ud328\ub110 (Client Component) \u2014 Phase 5 Step 1
// [1] \ubc15\uc2a4 \uacb0\uacfc (\uadf8\ub9bc + \ud14d\uc2a4\ud2b8) \u2192 [2] \ud30c\ub81b\ud2b8 \uacb0\uacfc (\uc120\ud0dd \uc2dc).

import type { CompanyResult, InnerBoxCount } from '@/types/company';
import BoxSvg from './BoxSvg';
import CompanyPalletSvg from './CompanyPalletSvg';
import { findPallet } from '@/lib/company/data';

interface Props {
  result: CompanyResult | null;
  isLoading: boolean;
  unsupported: { size: number; meter: number }[] | null;
}

function innerText(list: InnerBoxCount[]): string {
  if (list.length === 0) return '\uc5c6\uc74c';
  return list.map(i => `${i.kind}\uc778\ubc15\uc2a4 \u00d7${i.count}`).join(', ');
}

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--font-jetbrains-mono), monospace',
  fontSize: '11px',
  letterSpacing: '0.1em',
  color: '#8c7a55',
  marginBottom: '14px',
};

const card: React.CSSProperties = {
  background: 'linear-gradient(180deg,#1a1510,#15110d)',
  border: '1px solid rgba(201,168,106,0.15)',
  borderRadius: '2px',
  padding: '24px',
  marginBottom: '24px',
};

export default function CompanyResult({ result, isLoading, unsupported }: Props) {
  if (isLoading) {
    return (
      <div style={{ ...card, textAlign: 'center', color: '#9C9486' }}>
        <span style={{ fontFamily: 'var(--font-manrope), sans-serif', fontSize: '13px' }}>
          \uacc4\uc0b0 \uc911\u2026
        </span>
      </div>
    );
  }

  if (unsupported && unsupported.length > 0) {
    return (
      <div style={{ ...card, color: '#C98A6A' }}>
        <div style={sectionLabel}>UNSUPPORTED</div>
        <p style={{ fontFamily: 'var(--font-manrope), sans-serif', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
          \uc9c0\uc6d0\ud558\uc9c0 \uc54a\ub294 \uc81c\ud488\uc785\ub2c8\ub2e4:{' '}
          {unsupported.map(u => `${u.size}\u00d7${u.meter}`).join(', ')}
          <br />
          (\ud604\uc7ac \uc9c0\uc6d0: 40\u00d7300, 60\u00d7300, 110\u00d7300)
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ ...card, textAlign: 'center', color: '#9C9486' }}>
        <span style={{ fontFamily: 'var(--font-manrope), sans-serif', fontSize: '13px' }}>
          \uc81c\ud488\uc744 \uc785\ub825\ud558\uace0 \uc2e4\ud589\ud558\uc138\uc694.
        </span>
      </div>
    );
  }

  const pallet = result.pallet;
  const palletSpec = pallet ? findPallet(pallet.palletId) : null;

  return (
    <div>
      {/* [1] \ubc15\uc2a4 \uacb0\uacfc */}
      <div style={card}>
        <div style={sectionLabel}>[1] \ubc15\uc2a4 \uacb0\uacfc</div>

        {/* \uc778\ubc15\uc2a4 \ud569\uc0b0 */}
        <div
          style={{
            fontFamily: 'var(--font-manrope), sans-serif',
            fontSize: '13px',
            color: '#E8E0D2',
            marginBottom: '6px',
          }}
        >
          \uc778\ubc15\uc2a4 \ud569\uc0b0: {innerText(result.innerTotals)}
        </div>

        {/* \uc9d1\uacc4 */}
        <div
          style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: '12px',
            color: '#9C9486',
            marginBottom: '18px',
          }}
        >
          \uc544\uc6c3\ubc15\uc2a4 {result.outerCount} \u00b7 \ud0dd\ubc30\ubc15\uc2a4 {result.courierCount} \u00b7 \ub099\uac1c {result.looseCount}
        </div>

        {/* \ubc15\uc2a4 \uadf8\ub9bc\ub4e4 */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '18px',
            alignItems: 'flex-end',
          }}
        >
          {result.boxes.map((box, i) => (
            <div key={i}>
              <BoxSvg
                kind={box.kind}
                contents={box.contents}
                filled={box.filled}
                size={120}
              />
            </div>
          ))}
        </div>

        {/* \ubb34\uac8c */}
        <div
          style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: '14px',
            color: '#DCC08A',
          }}
        >
          \uc7d1 \ubb34\uac8c {result.totalWeight.toFixed(2)} kg
        </div>
        {result.weightIncomplete && (
          <div
            style={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: '11px',
              color: '#9C9486',
              marginTop: '4px',
            }}
          >
            \u00d7 60\uc778\ubc15\uc2a4\u00b7\ud0dd\ubc30\ubc15\uc2a4 \ubb34\uac8c \ubbf8\ubc18\uc601 (\uc77c\ubd80 \ubb34\uac8c \uacfc\uc18c \ud45c\uc2dc)
          </div>
        )}
      </div>

      {/* [2] \ud30c\ub81b\ud2b8 \uacb0\uacfc */}
      {pallet && (
        <div style={card}>
          <div style={sectionLabel}>[2] \ud30c\ub81b\ud2b8 \uc801\uc7ac</div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
            <CompanyPalletSvg
              stack={pallet}
              courierCount={result.courierCount}
              looseCount={result.looseCount}
              width={320}
            />
          </div>

          {/* \ud30c\ub81b\ud2b8 \ud14d\uc2a4\ud2b8 \uc815\ubcf4 */}
          <div
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: '12px',
              color: '#E8E0D2',
              lineHeight: 1.8,
            }}
          >
            <div>\uc7d1 \ud30c\ub81b\ud2b8: {pallet.totalPallets}\uac1c</div>
            <div>\ub9c8\uc9c0\ub9c9 \ud30c\ub81b\ud2b8: {pallet.layers}\uce35 (\ub9c8\uc9c0\ub9c9 \uce35 {pallet.lastLayerBoxes}\uac1c, \uce35\ub2f9 {pallet.boxesPerLayer})</div>
            {palletSpec && (
              <div style={{ color: '#9C9486' }}>
                \uaddc\uaca9: {palletSpec.w}\u00d7{palletSpec.d}mm \u00b7 \ub192\uc774 {pallet.height}mm
              </div>
            )}
            <div style={{ color: '#DCC08A' }}>
              \uc801\uc7ac \ubb34\uac8c: {pallet.weight.toFixed(2)} kg
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
