import { rng } from '@/lib/svg/generators';

interface CandleSvgProps {
  seed: number;
  n: number;
}

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
}

function genCandles(seed: number, n: number): CandleData[] {
  const r = rng(seed);
  let price = 100;
  const candles: CandleData[] = [];
  for (let i = 0; i < n; i++) {
    const open = price;
    const move = (r() - 0.48) * 10;
    const close = Math.max(5, price + move);
    const high = Math.max(open, close) + r() * 5;
    const low = Math.min(open, close) - r() * 5;
    candles.push({ open, high, low, close });
    price = close;
  }
  return candles;
}

export default function CandleSvg({ seed, n }: CandleSvgProps) {
  const W = 720;
  const H = 130;
  const padX = 8;
  const padY = 10;

  const candles = genCandles(seed, n);
  const allVals = candles.flatMap((c) => [c.high, c.low]);
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 1;

  const toY = (v: number): number =>
    parseFloat((padY + ((max - v) / range) * (H - 2 * padY)).toFixed(2));

  const slotW = (W - 2 * padX) / n;
  const bodyW = Math.max(1, slotW * 0.6);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      style={{ display: 'block', maxWidth: '100%' }}
    >
      {candles.map((c, i) => {
        const cx = padX + (i + 0.5) * slotW;
        const isUp = c.close >= c.open;
        const color = isUp ? '#8FBFA0' : '#C77B66';
        const bodyTop = toY(Math.max(c.open, c.close));
        const bodyBot = toY(Math.min(c.open, c.close));
        const bodyH = Math.max(1, bodyBot - bodyTop);

        return (
          <g key={i}>
            <line
              x1={cx}
              y1={toY(c.high)}
              x2={cx}
              y2={toY(c.low)}
              stroke={color}
              strokeWidth={1}
              strokeLinecap="round"
            />
            <rect
              x={parseFloat((cx - bodyW / 2).toFixed(2))}
              y={bodyTop}
              width={parseFloat(bodyW.toFixed(2))}
              height={bodyH}
              fill={color}
              stroke={color}
              strokeWidth={0.5}
            />
          </g>
        );
      })}
    </svg>
  );
}
