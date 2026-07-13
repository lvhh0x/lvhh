'use client';

// 회사 시뮬레이션 결과 패널 (Client Component) — Phase 5 Step 1
// [1] 박스 결과 (그림 + 텍스트) → [2] 파렛트 결과 (선택 시).

import type { CompanyResult, InnerBoxCount } from '@/types/company';
import BoxSvg from './BoxSvg';
import CompanyPalletSvg from './CompanyPalletSvg';
import { findPallet } from '@/lib/company/data';

interface Props {
  result: CompanyResult | null;
  isLoading: boolean;
  unsupported: { size: number; meter: number }[] | null;
  ambiguous: { size: number; meter: number }[] | null;
}

function innerText(list: InnerBoxCount[]): string {
  if (list.length === 0) return '없음';
  return list.map(i => `${i.kind}인박스 ×${i.count}`).join(', ');
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

export default function CompanyResult({ result, isLoading, unsupported, ambiguous }: Props) {
  if (isLoading) {
    return (
      <div style={{ ...card, textAlign: 'center', color: '#9C9486' }}>
        <span style={{ fontFamily: 'var(--font-manrope), sans-serif', fontSize: '13px' }}>
          계산 중…
        </span>
      </div>
    );
  }

  if (unsupported && unsupported.length > 0) {
    return (
      <div style={{ ...card, color: '#C98A6A' }}>
        <div style={sectionLabel}>UNSUPPORTED</div>
        <p style={{ fontFamily: 'var(--font-manrope), sans-serif', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
          지원하지 않는 제품입니다:{' '}
          {unsupported.map(u => `${u.size}×${u.meter}`).join(', ')}
        </p>
      </div>
    );
  }

  // 치수는 있으나 원단마다 수용량이 갈리는 경우 — 추측하지 않고 원단 선택을 요구한다.
  if (ambiguous && ambiguous.length > 0) {
    return (
      <div style={{ ...card, color: '#C9A86A' }}>
        <div style={sectionLabel}>FABRIC REQUIRED</div>
        <p style={{ fontFamily: 'var(--font-manrope), sans-serif', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
          원단에 따라 박스 수용량이 달라지는 제품입니다. 원단을 선택하세요:{' '}
          {ambiguous.map(u => `${u.size}×${u.meter}`).join(', ')}
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ ...card, textAlign: 'center', color: '#9C9486' }}>
        <span style={{ fontFamily: 'var(--font-manrope), sans-serif', fontSize: '13px' }}>
          제품을 입력하고 실행하세요.
        </span>
      </div>
    );
  }

  const pallet = result.pallet;
  const palletSpec = pallet ? findPallet(pallet.palletId) : null;

  // 무게 표시 분리 (Phase 5 Step 3-4): 값 계산은 엔진 그대로, 여기선 적재/파렛트로 역산만.
  // 무게 미실측 제품 포함 시 totalWeight=null → 무게 줄 자체를 생략 (Phase 6).
  const palletTare = palletSpec ? palletSpec.tare : 0;
  const loadWeight =
    result.totalWeight === null ? null : result.totalWeight - palletTare; // 적재물(짐)만

  return (
    <div>
      {/* [1] 박스 결과 */}
      <div style={card}>
        <div style={sectionLabel}>[1] 박스 결과</div>

        {/* 인박스 합산 */}
        <div
          style={{
            fontFamily: 'var(--font-manrope), sans-serif',
            fontSize: '13px',
            color: '#E8E0D2',
            marginBottom: '6px',
          }}
        >
          인박스 합산: {innerText(result.innerTotals)}
        </div>

        {/* 집계 */}
        <div
          style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: '12px',
            color: '#9C9486',
            marginBottom: '18px',
          }}
        >
          아웃박스 {result.outerCount} · 택배박스 {result.courierCount} · 낱개 {result.looseCount}
        </div>

        {/* 박스 그림들 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '12px',
            marginBottom: '18px',
            alignItems: 'end',
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

        {/* 무게 — 미실측 제품 포함 시 생략 */}
        {loadWeight !== null && (
          <>
            <div
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: '14px',
                color: '#DCC08A',
              }}
            >
              적재 무게 {loadWeight.toFixed(2)} kg
            </div>
            <div
              style={{
                fontFamily: 'var(--font-manrope), sans-serif',
                fontSize: '10px',
                color: '#8c7a55',
                marginTop: '2px',
              }}
            >
              (적재물만 · 파렛트 제외)
            </div>
          </>
        )}
      </div>

      {/* [2] 파렛트 결과 — 적재 초과 시 경고만 표시 */}
      {pallet && pallet.overflow && (
        <div style={card}>
          <div style={sectionLabel}>[2] 파렛트 적재</div>
          <div style={{ color: '#C77B66', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            적재 초과 — 이 파렛트는 선택할 수 없습니다
          </div>
          <div
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: '12px',
              color: '#9C9486',
            }}
          >
            필요 {pallet.neededSlots}슬롯 / 최대 {pallet.maxSlots}슬롯
          </div>
        </div>
      )}

      {/* [2] 파렛트 결과 — 적재 가능 */}
      {pallet && !pallet.overflow && (
        <div style={card}>
          <div style={sectionLabel}>[2] 파렛트 적재</div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
            <CompanyPalletSvg stack={pallet} width={320} />
          </div>

          {/* 파렛트 텍스트 정보 */}
          <div
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: '12px',
              color: '#E8E0D2',
              lineHeight: 1.8,
            }}
          >
            <div>적재: {pallet.layers}층 (마지막 층 {pallet.lastLayerSlots}칸, 층당 {pallet.boxesPerLayer})</div>
            {palletSpec && (
              <div style={{ color: '#9C9486' }}>
                규격: {pallet.footprintW}×{pallet.footprintD}mm · 높이 {pallet.height}mm
                {(pallet.overhangW > 0 || pallet.overhangD > 0) && (
                  <span style={{ color: '#C77B66' }}>
                    {' '}(박스 오버행 가로 {pallet.overhangW} / 세로 {pallet.overhangD}mm)
                  </span>
                )}
              </div>
            )}
            {loadWeight !== null && result.totalWeight !== null && (
              <>
                <div>적재 무게: {loadWeight.toFixed(2)} kg</div>
                <div>파렛트 무게: {palletTare.toFixed(2)} kg</div>
                <div style={{ color: '#DCC08A' }}>
                  총 무게: {result.totalWeight.toFixed(2)} kg
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
