interface LineSvgProps {
  vals: number[];
  w: number;
  h: number;
  color: string;
  area: boolean;
  sw: number;
}

export default function LineSvg({ vals, w, h, color, area, sw }: LineSvgProps) {
  if (vals.length < 2) return null;

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const pad = h * 0.08;
  const availH = h - 2 * pad;

  const pts: [number, number][] = vals.map((v, i) => [
    parseFloat(((i / (vals.length - 1)) * w).toFixed(2)),
    parseFloat((pad + availH - ((v - min) / range) * availH).toFixed(2)),
  ]);

  const polyPoints = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const gradId = `lag-${color.replace('#', '')}`;

  const areaD = area
    ? `M ${pts.map(([x, y]) => `${x},${y}`).join(' L ')} L ${w},${h} L 0,${h} Z`
    : '';

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      style={{ display: 'block', maxWidth: '100%' }}
    >
      {area && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#${gradId})`} />
        </>
      )}
      <polyline
        points={polyPoints}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
