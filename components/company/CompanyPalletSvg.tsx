// \ud30c\ub808\ud2b8 \uc801\uc7ac \ud615\uc0c1 \uadf8\ub9bc (Phase 5 Step 2 \uac1c\uc120)
// \ubcc0\uacbd: \u2460 \ub9c8\uc9c0\ub9c9 \uce35 \ube48\uc790\ub9ac(empty slot)\ub97c \uc810\uc120 outline\uc73c\ub85c \uc2dc\uac01\ud654
//       \u2461 totalPallets > 1\uc77c \ub54c \uc0c1\ub2e8\uc5d0 "\ub9cc\uc7ac N\uac1c \ud3ec\ud568 \u00b7 \uc804 N\uac1c" \uc548\ub0b4 \ud14d\uc2a4\ud2b8 \ucd94\uac00

import type { PalletStack } from '@/types/company';
import { findPallet } from '@/lib/company/data';

interface Props {
  stack: PalletStack;
  courierCount: number;
  looseCount: number;
  width?: number;
}

export default function CompanyPalletSvg({
  stack,
  courierCount,
  looseCount,
  width = 320,
}: Props) {
  const pallet = findPallet(stack.palletId);
  const label = pallet?.label ?? stack.palletId;

  const bpl            = stack.boxesPerLayer;
  const layers         = stack.layers;
  const lastLayerBoxes = stack.lastLayerBoxes;
  const totalPallets   = stack.totalPallets;

  // \ub808\uc774\uc544\uc6c3 \uacc4\uc0b0
  const W      = width;
  const padX   = W * 0.08;
  const innerW = W - padX * 2;
  const boxGap = 3;
  const boxW   = (innerW - boxGap * (bpl - 1)) / bpl;
  const boxH   = boxW * 0.62;
  const palletH = 16;

  // \uc0c1\ub2e8 \uc5ec\ubc31: \ud0dd\ubc30/\ub099\uac1c \ud1a0\ud37c + (totalPallets>1\uc77c \ub54c \ucd94\uac00 \ud14d\uc2a4\ud2b8)
  const hasMultiPallets = totalPallets > 1;
  const multiPalletLineH = 14;
  const topPad = 26 + (hasMultiPallets ? multiPalletLineH : 0);

  const stackH = layers * (boxH + boxGap);
  const H      = topPad + stackH + palletH + 40;

  // y \uae30\uc900: \ud30c\ub808\ud2b8 \uc67c\uba74 = baseY
  const baseY = topPad + stackH;

  // \uce35 \uadf8\ub9ac\uae30 (\uc544\ub798\u2192\uc704)
  const rows = [];
  for (let layer = 0; layer < layers; layer++) {
    const isTop       = layer === layers - 1;
    const filledCount = isTop ? lastLayerBoxes : bpl;
    const y = baseY - (layer + 1) * (boxH + boxGap) + boxGap;

    const layerBoxes = [];
    for (let i = 0; i < bpl; i++) {
      const x        = padX + i * (boxW + boxGap);
      const isFilled = i < filledCount;

      layerBoxes.push(
        <rect
          key={i}
          x={x}
          y={y}
          width={boxW}
          height={boxH}
          fill={isFilled ? '#C9A86A' : 'none'}
          stroke={isFilled ? 'rgba(20,17,14,0.5)' : 'rgba(201,168,106,0.28)'}
          strokeWidth="1"
          strokeDasharray={isFilled ? undefined : '3 2'}
          rx="1.5"
        />,
      );

      if (isFilled) {
        layerBoxes.push(
          <line
            key={`t${i}`}
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

  // \ud0dd\ubc30/\ub099\uac1c \ud1a0\ud37c (\ub9e8 \uc704\uc5d0 \uc791\uac8c \uc5b7\uc74c)
  const topperY = topPad - 18;
  const toppers = [];
  let tx = padX;
  for (let i = 0; i < courierCount; i++) {
    toppers.push(
      <rect
        key={`c${i}`}
        x={tx}
        y={topperY}
        width={boxW * 0.7}
        height={14}
        fill="#8FBFA0"
        stroke="rgba(20,17,14,0.5)"
        strokeWidth="1"
        rx="1.5"
      />,
    );
    tx += boxW * 0.7 + 3;
  }
  for (let i = 0; i < looseCount; i++) {
    toppers.push(
      <rect
        key={`l${i}`}
        x={tx}
        y={topperY}
        width={boxW * 0.55}
        height={14}
        fill="#9C9486"
        stroke="rgba(20,17,14,0.5)"
        strokeWidth="1"
        rx="1.5"
      />,
    );
    tx += boxW * 0.55 + 3;
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${label} \uc801\uc7ac \ud615\uc0c1`}
    >
      {/* \ub9cc\uc7ac \ud30c\ub808\ud2b8 \uc548\ub0b4 (totalPallets > 1) */}
      {hasMultiPallets && (
        <text
          x={W / 2}
          y={topPad - 26 + 11}
          textAnchor="middle"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize="10"
          fill="#8c7a55"
        >
          {`\ub9cc\uc7ac \ud30c\ub808\ud2b8 ${totalPallets - 1}\uac1c + \uc544\ub798 \ud30c\ub808\ud2b8 = \uc804 ${totalPallets}\uac1c`}
        </text>
      )}

      {/* \ud0dd\ubc30/\ub099\uac1c \ud1a0\ud37c */}
      {toppers}

      {/* \uc801\uc7ac \ubc15\uc2a4 \uce35 */}
      {rows}

      {/* \ud30c\ub808\ud2b8 \ubcf8\uccb4 */}
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
      {/* \ud30c\ub808\ud2b8 \ub2e4\ub9ac */}
      <rect x={padX - 6}              y={baseY + palletH} width={10} height={8} fill="#4A3C28" />
      <rect x={padX + innerW / 2 - 4} y={baseY + palletH} width={10} height={8} fill="#4A3C28" />
      <rect x={padX + innerW - 4}     y={baseY + palletH} width={10} height={8} fill="#4A3C28" />

      {/* \ub77c\ubca8 */}
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
        {`${layers}\uce35 \u00b7 \ub9c8\uc9c0\ub9c9\uce35 ${lastLayerBoxes}\uac1c \u00b7 \uce35\ub2f9 ${bpl}`}
      </text>
    </svg>
  );
}
