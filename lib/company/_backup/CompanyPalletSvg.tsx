// 백업 — components/company/CompanyPalletSvg.tsx (Phase 5 Step 1 완료본)
// 파렛트 적재 형상 그림 (Phase 5 Step 1)

import type { PalletStack } from '@/types/company';
import { findPallet } from '@/lib/company/data';

interface Props {
  stack: PalletStack;
  courierCount: number;
  looseCount: number;
  width?: number;
}

export default function CompanyPalletSvg({ stack, courierCount, looseCount, width = 320 }: Props) {
  const pallet = findPallet(stack.palletId);
  const label = pallet?.label ?? stack.palletId;

  const bpl = stack.boxesPerLayer;
  const layers = stack.layers;
  const lastLayerBoxes = stack.lastLayerBoxes;

  const W = width;
  const padX = W * 0.08;
  const innerW = W - padX * 2;
  const boxGap = 3;
  const boxW = (innerW - boxGap * (bpl - 1)) / bpl;
  const boxH = boxW * 0.62;
  const palletH = 16;
  const topPad = 26;

  const stackH = layers * (boxH + boxGap);
  const H = topPad + stackH + palletH + 40;
  const baseY = topPad + stackH;

  const rows = [];
  for (let layer = 0; layer < layers; layer++) {
    const isTop = layer === layers - 1;
    const count = isTop ? lastLayerBoxes : bpl;
    const y = baseY - (layer + 1) * (boxH + boxGap) + boxGap;
    const boxes = [];
    for (let i = 0; i < count; i++) {
      const x = padX + i * (boxW + boxGap);
      boxes.push(
        <rect key={i} x={x} y={y} width={boxW} height={boxH}
          fill="#C9A86A" stroke="rgba(20,17,14,0.5)" strokeWidth="1" rx="1.5" />,
      );
      boxes.push(
        <line key={`t${i}`} x1={x + boxW / 2} y1={y} x2={x + boxW / 2} y2={y + boxH}
          stroke="rgba(20,17,14,0.3)" strokeWidth="1" />,
      );
    }
    rows.push(<g key={layer}>{boxes}</g>);
  }

  const toppers = [];
  const topperY = topPad - 18;
  let tx = padX;
  for (let i = 0; i < courierCount; i++) {
    toppers.push(
      <rect key={`c${i}`} x={tx} y={topperY} width={boxW * 0.7} height={14}
        fill="#8FBFA0" stroke="rgba(20,17,14,0.5)" strokeWidth="1" rx="1.5" />,
    );
    tx += boxW * 0.7 + 3;
  }
  for (let i = 0; i < looseCount; i++) {
    toppers.push(
      <rect key={`l${i}`} x={tx} y={topperY} width={boxW * 0.55} height={14}
        fill="#9C9486" stroke="rgba(20,17,14,0.5)" strokeWidth="1" rx="1.5" />,
    );
    tx += boxW * 0.55 + 3;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`${label} 적재 형상`}>
      {rows}
      {toppers}
      <rect x={padX - 6} y={baseY} width={innerW + 12} height={palletH}
        fill="#5A4A32" stroke="rgba(20,17,14,0.6)" strokeWidth="1" rx="1" />
      <rect x={padX - 6} y={baseY + palletH} width={10} height={8} fill="#4A3C28" />
      <rect x={padX + innerW / 2 - 4} y={baseY + palletH} width={10} height={8} fill="#4A3C28" />
      <rect x={padX + innerW - 4} y={baseY + palletH} width={10} height={8} fill="#4A3C28" />
      <text x={W / 2} y={H - 14} textAnchor="middle"
        fontFamily="var(--font-jetbrains-mono), monospace" fontSize="11" fill="#E8E0D2">
        {label}
      </text>
      <text x={W / 2} y={H - 2} textAnchor="middle"
        fontFamily="var(--font-jetbrains-mono), monospace" fontSize="9.5" fill="#9C9486">
        {`${layers}층 · 마지막층 ${lastLayerBoxes}개 · 층당 ${bpl}`}
      </text>
    </svg>
  );
}
