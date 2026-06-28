// 박스 그림 (Phase 5 Step 2) — SizedInnerCount 기반으로 사이즈·미터·수량 표기
// 종류별 색/라벨은 유지, 내용물 한 줄씩 표기 (SVG 높이 동적 확장)

import type { SizedInnerCount, OuterBoxKind } from '@/types/company';

type BoxVisualKind = OuterBoxKind | 'loose';

interface Props {
  kind: BoxVisualKind;
  contents: SizedInnerCount[];
  filled: boolean;
  size?: number;
}

function visual(kind: BoxVisualKind): { label: string; face: string; top: string; side: string } {
  switch (kind) {
    case 'outer':   return { label: '\uc544\uc6c3\ubc15\uc2a4',    face: '#C9A86A', top: '#DCC08A', side: '#A8884E' };
    case 'courier': return { label: '\ud0dd\ubc30\ubc15\uc2a4',    face: '#8FBFA0', top: '#A8D4B8', side: '#6E9A80' };
    case 'loose':   return { label: '\ub099\uac1c(\uc778\ubc15\uc2a4)', face: '#9C9486', top: '#B6AEA0', side: '#7A7264' };
  }
}

/** \ub0b4\uc6a9\ubb3c \ud14d\uc2a4\ud2b8 1\uc904: "40\u00d7300m 145\u00d73(90\uac1c)" */
function contentLine(c: SizedInnerCount): string {
  return `${c.size}\u00d7${c.meter}m ${c.kind}\u00d7${c.count}(${c.productQty}\uac1c)`;
}

/** \ub192\uc774 \ubc30\uc728: outer=1.0 / courier=0.5 / loose=0.25 */
function heightMult(kind: BoxVisualKind): number {
  if (kind === 'courier') return 0.5;
  if (kind === 'loose')   return 0.25;
  return 1.0;
}

export default function BoxSvg({ kind, contents, filled, size = 120 }: Props) {
  const v = visual(kind);
  const w = size;

  // \ubc15\uc2a4 \uc544\uc774\uc18c\uba54\ud2b8\ub9ad \uc88c\ud45c (bh\ub9cc \uc885\ub958\ubcc4 \ucd95\uc18c)
  const depth = w * 0.22;
  const bx    = w * 0.16;
  const by    = w * 0.36;  // 0.26 \u2192 0.36: \uc704 \uc5ec\ubc31 \ud655\ubcf4
  const bw    = w * 0.56;
  const bh    = w * 0.50 * heightMult(kind);

  // \ub77c\ubca8\u00b7\ub0b4\uc6a9\ubb3c \ub808\uc774\uc544\uc6c3 (\ubc15\uc2a4 \ud558\ub2e8 \uae30\uc900)
  const labelFontSize   = Math.round(w * 0.115);
  const contentFontSize = Math.round(w * 0.100);
  const lineH           = contentFontSize + 5;
  const boxBottom       = by + bh;
  const labelY          = Math.round(boxBottom + w * 0.17);
  const firstContentY   = labelY + lineH + 2;
  const totalH          = firstContentY + contents.length * lineH + 6;

  return (
    <svg
      viewBox={`0 0 ${w} ${totalH}`}
      width={w}
      height={totalH}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={v.label}
    >
      {/* \uc6d4\uba74 */}
      <polygon
        points={`${bx},${by} ${bx + bw},${by} ${bx + bw + depth},${by - depth} ${bx + depth},${by - depth}`}
        fill={v.top}
        stroke="rgba(20,17,14,0.5)"
        strokeWidth="1"
      />
      {/* \uce21\uba74 */}
      <polygon
        points={`${bx + bw},${by} ${bx + bw},${by + bh} ${bx + bw + depth},${by + bh - depth} ${bx + bw + depth},${by - depth}`}
        fill={v.side}
        stroke="rgba(20,17,14,0.5)"
        strokeWidth="1"
      />
      {/* \uc815\uba74 */}
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
      {/* \ud14c\uc774\ud504 \ub77c\uc778 (\uaf49 \ucc2c \ubc15\uc2a4 \ud45c\uc2dc) */}
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

      {/* \uc885\ub958 \ub77c\ubca8 */}
      <text
        x={w / 2}
        y={labelY}
        textAnchor="middle"
        fontFamily="var(--font-jetbrains-mono), monospace"
        fontSize={labelFontSize}
        fill="#E8E0D2"
        style={{ fontFeatureSettings: "'zero' 0" }}
      >
        {v.label}
      </text>

      {/* \ub0b4\uc6a9\ubb3c \ud55c \uc904\uc529 (\uc0ac\uc774\uc988\u00b7\ubbf8\ud130\u00b7\uc778\ubc15\uc2a4\uc885\ub958\u00b7\uc218\ub7c9\u00b7\uc81c\ud488\uc218\ub7c9) */}
      {contents.map((c, i) => (
        <text
          key={i}
          x={w / 2}
          y={firstContentY + i * lineH}
          textAnchor="middle"
          fontFamily="var(--font-manrope), sans-serif"
          fontSize={contentFontSize}
          fill="#9C9486"
        >
          {contentLine(c)}
        </text>
      ))}
    </svg>
  );
}
