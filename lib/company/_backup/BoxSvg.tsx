// 백업 — components/company/BoxSvg.tsx (Phase 5 Step 1 완료본)
// 박스 그림 (Phase 5 Step 1)

import type { OuterBoxKind, InnerBoxCount } from '@/types/company';

type BoxVisualKind = OuterBoxKind | 'loose';

interface Props {
  kind: BoxVisualKind;
  contents: InnerBoxCount[];
  filled: boolean;
  size?: number;
}

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

  const depth = w * 0.22;
  const bx = w * 0.16;
  const by = h * 0.30;
  const bw = w * 0.56;
  const bh = h * 0.50;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={v.label}>
      <polygon points={`${bx},${by} ${bx + bw},${by} ${bx + bw + depth},${by - depth} ${bx + depth},${by - depth}`}
        fill={v.top} stroke="rgba(20,17,14,0.5)" strokeWidth="1" />
      <polygon points={`${bx + bw},${by} ${bx + bw},${by + bh} ${bx + bw + depth},${by + bh - depth} ${bx + bw + depth},${by - depth}`}
        fill={v.side} stroke="rgba(20,17,14,0.5)" strokeWidth="1" />
      <rect x={bx} y={by} width={bw} height={bh} fill={v.face}
        stroke="rgba(20,17,14,0.5)" strokeWidth="1" opacity={filled ? 1 : 0.7} />
      {filled && (
        <line x1={bx + bw / 2} y1={by} x2={bx + bw / 2} y2={by + bh}
          stroke="rgba(20,17,14,0.35)" strokeWidth="2" />
      )}
      <text x={w / 2} y={h * 0.90} textAnchor="middle"
        fontFamily="var(--font-jetbrains-mono), monospace" fontSize={w * 0.085} fill="#E8E0D2">
        {v.label}
      </text>
      {contents.length > 0 && (
        <text x={w / 2} y={h * 0.99} textAnchor="middle"
          fontFamily="var(--font-jetbrains-mono), monospace" fontSize={w * 0.07} fill="#9C9486">
          {contentsText(contents)}
        </text>
      )}
    </svg>
  );
}
