// 박스 그림 (Phase 5 Step 1) — 인박스/아웃박스/택배박스/낱개를 단순 아이소메트릭 박스로 표현.
// 종류별 색/라벨만 다르고 형상은 공통(정면+윗면+측면 3D 박스).

import type { OuterBoxKind, InnerBoxCount } from '@/types/company';

type BoxVisualKind = OuterBoxKind | 'loose';

interface Props {
  kind: BoxVisualKind;
  contents: InnerBoxCount[];
  filled: boolean;
  size?: number;
}

// 종류별 표시 속성
function visual(kind: BoxVisualKind): { label: string; face: string; top: string; side: string } {
  switch (kind) {
    case 'outer':
      return { label: '아웃박스', face: '#C9A86A', top: '#DCC08A', side: '#A8884E' };
    case 'courier':
      return { label: '택배박스', face: '#8FBFA0', top: '#A8D4B8', side: '#6E9A80' };
    case 'loose':
      return { label: '낱개(인박스)', face: '#9C9486', top: '#B6AEA0', side: '#7A7264' };
  }
}

function contentsText(contents: InnerBoxCount[]): string {
  if (contents.length === 0) return '';
  return contents.map(c => `${c.kind}×${c.count}`).join(' · ');
}

export default function BoxSvg({ kind, contents, filled, size = 120 }: Props) {
  const v = visual(kind);
  const w = size;
  const h = size;

  // 아이소메트릭 박스 좌표 (정면 사각형 + 윗면 평행사변형 + 측면 평행사변형)
  const depth = w * 0.22;
  const bx = w * 0.16;          // 정면 좌측 x
  const by = h * 0.30;          // 정면 상단 y
  const bw = w * 0.56;          // 정면 너비
  const bh = h * 0.50;          // 정면 높이

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
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
      {/* 정면 테이프 라인 (꽉 찬 박스 표시) */}
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

      {/* 라벨 */}
      <text
        x={w / 2}
        y={h * 0.90}
        textAnchor="middle"
        fontFamily="var(--font-jetbrains-mono), monospace"
        fontSize={w * 0.085}
        fill="#E8E0D2"
      >
        {v.label}
      </text>
      {/* 내용물 */}
      {contents.length > 0 && (
        <text
          x={w / 2}
          y={h * 0.99}
          textAnchor="middle"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize={w * 0.07}
          fill="#9C9486"
        >
          {contentsText(contents)}
        </text>
      )}
    </svg>
  );
}
