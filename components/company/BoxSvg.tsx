// 박스 그림 (Phase 5 Step 2) — SizedInnerCount 기반으로 사이즈·미터·수량 표기
// 종류별 색/라벨은 유지, 내용물 한 줄씩 표기 (SVG 높이 동적 확장)

import type { SizedInnerCount, OuterBoxKind } from '@/types/company';
import { distinctFabricsByQty } from '@/lib/company/fabric';

type BoxVisualKind = OuterBoxKind | 'loose';

interface Props {
  kind: BoxVisualKind;
  contents: SizedInnerCount[];
  filled: boolean;
  size?: number;
}

function visual(kind: BoxVisualKind): { label: string; face: string; top: string; side: string } {
  switch (kind) {
    case 'outer':   return { label: '아웃박스',    face: '#C9A86A', top: '#DCC08A', side: '#A8884E' };
    case 'courier': return { label: '택배박스',    face: '#8FBFA0', top: '#A8D4B8', side: '#6E9A80' };
    case 'loose':   return { label: '낱개(인박스)', face: '#9C9486', top: '#B6AEA0', side: '#7A7264' };
  }
}

/** 내용물 텍스트 1줄: "40×300m 145×3(90개)" */
function contentLine(c: SizedInnerCount): string {
  return `${c.size}×${c.meter}m ${c.kind}×${c.count}(${c.productQty}개)`;
}

/** 높이 배율: outer=1.0 / courier=0.5 / loose=0.25 */
function heightMult(kind: BoxVisualKind): number {
  if (kind === 'courier') return 0.5;
  if (kind === 'loose')   return 0.25;
  return 1.0;
}

/** 내용물 한 줄 폭 추정(px) — 서버 렌더라 실측 불가 → 글자별 넘넘한 추정(과소추정 방지) */
function estimateLineWidth(str: string, fontSize: number): number {
  let units = 0;
  for (const ch of str) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0xac00 && code <= 0xd7a3) units += 1.0;   // 한글(전각)
    else if (ch >= '0' && ch <= '9')      units += 0.6;   // 숫자
    else if (ch === '×')             units += 0.65;  // ×
    else if (ch === 'm')                  units += 0.88;
    else if (ch === ' ')                  units += 0.32;
    else                                  units += 0.5;   // ( ) 등
  }
  return units * fontSize;
}

export default function BoxSvg({ kind, contents, filled, size = 120 }: Props) {
  const v = visual(kind);
  const w = size;

  // 폰트 크기
  const labelFontSize   = Math.round(w * 0.115);
  const contentFontSize = Math.round(w * 0.100);

  // 원단 라벨 줄 구성 (Phase 5 Step 3-4)
  //   1종 → "B220 아웃박스" 1줄 / 2종+ → 윗줄 "B220+B324", 아랫줄 "아웃박스" (2줄 통일)
  const fabrics = distinctFabricsByQty(contents);
  const labelLines = fabrics.length <= 1
    ? [`${fabrics[0] ?? '미지정'} ${v.label}`]
    : [fabrics.join('+'), v.label];

  // 내용물/라벨 최대 폭에 맞게 캠버스 가로 확장 (박스 그림 크기는 그대로)
  const contentMaxW = contents.reduce((mx, c) => Math.max(mx, estimateLineWidth(contentLine(c), contentFontSize)), 0);
  const labelW      = labelLines.reduce((mx, s) => Math.max(mx, estimateLineWidth(s, labelFontSize)), 0);
  const canvasW     = Math.max(w, Math.ceil(Math.max(contentMaxW, labelW)) + 16);  // 좌우 8px 여유
  const ox          = (canvasW - w) / 2;  // 박스 그림을 넓은 캠버스 가운데로

  // 박스 아이소메트릭 좌표 (x는 +ox 적용, bh만 종류별 축소)
  const depth = w * 0.22;
  const bx    = w * 0.16 + ox;
  const by    = w * 0.36;  // 0.26 → 0.36: 위 여백 확보
  const bw    = w * 0.56;
  const bh    = w * 0.50 * heightMult(kind);

  // 라벨·내용물 레이아웃 (박스 하단 기준)
  const lineH           = contentFontSize + 5;
  const labelLineH      = labelFontSize + 4;
  const boxBottom       = by + bh;
  const labelY          = Math.round(boxBottom + w * 0.17);           // 첫 라벨 줄
  const labelBlockBottom = labelY + (labelLines.length - 1) * labelLineH;
  const firstContentY   = labelBlockBottom + lineH + 2;
  const totalH          = firstContentY + contents.length * lineH + 6;

  return (
    <svg
      viewBox={`0 0 ${canvasW} ${totalH}`}
      style={{ width: '100%', height: 'auto', display: 'block', minWidth: 0 }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={v.label}
    >
      {/* 윗면 */}
      <polygon
        points={`${bx},${by} ${bx + bw},${by} ${bx + bw + depth},${by - depth} ${bx + depth},${by - depth}`}
        fill={v.top}
        stroke="rgba(20,17,14,0.5)"
        strokeWidth="1"
      />
      {/* 측면 */}
      <polygon
        points={`${bx + bw},${by} ${bx + bw},${by + bh} ${bx + bw + depth},${by + bh - depth} ${bx + bw + depth},${by - depth}`}
        fill={v.side}
        stroke="rgba(20,17,14,0.5)"
        strokeWidth="1"
      />
      {/* 정면 */}
      <rect
        x={bx}
        y={by}
        width={bw}
        height={bh}
        fill={v.face}
        stroke="rgba(20,17,14,0.5)"
        strokeWidth="1"
        opacity={filled ? 1 : 0.7}
      />
      {/* 테이프 라인 (꽉 찬 박스 표시) */}
      {filled && (
        <line
          x1={bx + bw / 2}
          y1={by}
          x2={bx + bw / 2}
          y2={by + bh}
          stroke="rgba(20,17,14,0.35)"
          strokeWidth="2"
        />
      )}

      {/* 종류 라벨 (원단 접두 — 혼합이면 2줄) */}
      {labelLines.map((line, i) => (
        <text
          key={`lbl-${i}`}
          x={canvasW / 2}
          y={labelY + i * labelLineH}
          textAnchor="middle"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize={labelFontSize}
          fill="#E8E0D2"
          style={{ fontFeatureSettings: "'zero' 0" }}
        >
          {line}
        </text>
      ))}

      {/* 내용물 한 줄씩 (사이즈·미터·인박스종류·수량·제품수량) */}
      {contents.map((c, i) => (
        <text
          key={i}
          x={canvasW / 2}
          y={firstContentY + i * lineH}
          textAnchor="middle"
          fontSize={contentFontSize}
          fill="#9C9486"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          {contentLine(c)}
        </text>
      ))}
    </svg>
  );
}
