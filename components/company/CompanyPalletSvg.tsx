// 파렛트 적재 형상 그림 (Phase 5 Step 3-3 대수정)
// 변경: ① 파렛트 1개 전제 — 다중 파렛트 안내 텍스트 제거
//       ② 상단 topper(별도 줄) 제거 → 택배/낱개를 실제 빈칸 슬롯 위치에 렌더
//          (아웃=금색, 택배=초록, 낱개=회색, 진짜 빈칸=점선)
//       ③ 슬롯 종류는 엔진 slotKindAt(전역 슬롯 index)로 판정

import type { PalletStack } from '@/types/company';
import { findPallet } from '@/lib/company/data';
import { slotKindAt } from '@/lib/company/pallet';

interface Props {
  stack: PalletStack;
  width?: number;
}

// 슬롯 종류별 채움색
const FILL: Record<'outer' | 'courier' | 'loose', string> = {
  outer: '#C9A86A',   // 아웃박스 (금색)
  courier: '#8FBFA0', // 택배박스 (초록)
  loose: '#9C9486',   // 낱개 (회색)
};

export default function CompanyPalletSvg({ stack, width = 320 }: Props) {
  const pallet = findPallet(stack.palletId);
  const label = pallet?.label ?? stack.palletId;

  const bpl            = stack.boxesPerLayer;
  const layers         = stack.layers;
  const lastLayerSlots = stack.lastLayerSlots;

  // 레이아웃 계산
  const W      = width;
  const padX   = W * 0.08;
  const innerW = W - padX * 2;
  const boxGap = 3;
  const boxW   = (innerW - boxGap * (bpl - 1)) / bpl;
  const boxH   = boxW * 0.62;
  const palletH = 16;

  const topPad = 14;
  const stackH = layers * (boxH + boxGap);
  const H      = topPad + stackH + palletH + 40;

  // y 기준: 파렛트 윗면 = baseY
  const baseY = topPad + stackH;

  // 층 그리기 (아래→위). 전역 슬롯 index = layer*bpl + i.
  const rows = [];
  for (let layer = 0; layer < layers; layer++) {
    const y = baseY - (layer + 1) * (boxH + boxGap) + boxGap;
    const layerBoxes = [];

    for (let i = 0; i < bpl; i++) {
      const x    = padX + i * (boxW + boxGap);
      const kind = slotKindAt(layer * bpl + i, stack);
      const isEmpty = kind === 'empty';

      layerBoxes.push(
        <rect
          key={i}
          x={x}
          y={y}
          width={boxW}
          height={boxH}
          fill={isEmpty ? 'none' : FILL[kind]}
          stroke={isEmpty ? 'rgba(201,168,106,0.28)' : 'rgba(20,17,14,0.5)'}
          strokeWidth="1"
          strokeDasharray={isEmpty ? '3 2' : undefined}
          rx="1.5"
        />,
      );

      // 아웃박스만 가운데 분할선(장식) 유지
      if (kind === 'outer') {
        layerBoxes.push(
          <line
            key={`d${i}`}
            x1={x + boxW / 2}
            y1={y}
            x2={x + boxW / 2}
            y2={y + boxH}
            stroke="rgba(20,17,14,0.3)"
            strokeWidth="1"
          />,
        );
      }
    }
    rows.push(<g key={layer}>{layerBoxes}</g>);
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${label} 적재 형상`}
    >
      {/* 적재 박스 층 */}
      {rows}

      {/* 파렛트 본체 */}
      <rect
        x={padX - 6}
        y={baseY}
        width={innerW + 12}
        height={palletH}
        fill="#5A4A32"
        stroke="rgba(20,17,14,0.6)"
        strokeWidth="1"
        rx="1"
      />
      {/* 파렛트 다리 */}
      <rect x={padX - 6}              y={baseY + palletH} width={10} height={8} fill="#4A3C28" />
      <rect x={padX + innerW / 2 - 4} y={baseY + palletH} width={10} height={8} fill="#4A3C28" />
      <rect x={padX + innerW - 4}     y={baseY + palletH} width={10} height={8} fill="#4A3C28" />

      {/* 라벨 */}
      <text
        x={W / 2}
        y={H - 14}
        textAnchor="middle"
        fontFamily="var(--font-jetbrains-mono), monospace"
        fontSize="11"
        fill="#E8E0D2"
      >
        {label}
      </text>
      <text
        x={W / 2}
        y={H - 2}
        textAnchor="middle"
        fontFamily="var(--font-jetbrains-mono), monospace"
        fontSize="9.5"
        fill="#9C9486"
      >
        {`${layers}층 · 마지막층 ${lastLayerSlots}칸 · 층당 ${bpl}`}
      </text>
    </svg>
  );
}
