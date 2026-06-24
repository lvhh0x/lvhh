interface PalletSvgProps {
  perLayer: number;
  tiers: number;
  filled: number;
  big: boolean; // true -> 150px height | false -> 300px height
}

export default function PalletSvg({ perLayer, tiers, filled, big }: PalletSvgProps) {
  const CELL = 20;
  const GAP = 3;
  const PAD = 6;

  const svgW = perLayer * (CELL + GAP) - GAP + PAD * 2;
  const svgH = tiers * (CELL + GAP) - GAP + PAD * 2;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ height: big ? 150 : 300, width: 'auto', display: 'block' }}
    >
      {Array.from({ length: tiers * perLayer }, (_, idx) => {
        const row = Math.floor(idx / perLayer);
        const col = idx % perLayer;
        const isFilled = idx < filled;
        return (
          <rect
            key={idx}
            x={PAD + col * (CELL + GAP)}
            y={PAD + row * (CELL + GAP)}
            width={CELL}
            height={CELL}
            fill={isFilled ? '#C9A86A' : 'transparent'}
            stroke={isFilled ? '#DCC08A' : '#3a3026'}
            strokeWidth={1}
            rx={2}
          />
        );
      })}
    </svg>
  );
}
