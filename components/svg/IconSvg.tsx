interface IconSvgProps {
  kind: 'box' | 'container' | 'pallet';
}

const S = {
  stroke: '#C9A86A',
  strokeWidth: 1.5,
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export default function IconSvg({ kind }: IconSvgProps) {
  return (
    <svg viewBox="0 0 22 22" width="22" height="22" style={{ display: 'block' }}>
      {kind === 'box' && (
        <>
          <rect x="4" y="7" width="14" height="12" rx="1" {...S} />
          <polyline points="4,7 11,3 18,7" {...S} />
          <line x1="11" y1="3" x2="11" y2="19" {...S} />
          <line x1="4" y1="12" x2="18" y2="12" {...S} />
        </>
      )}
      {kind === 'container' && (
        <>
          <rect x="2" y="6" width="18" height="11" rx="1" {...S} />
          <line x1="7" y1="6" x2="7" y2="17" {...S} />
          <line x1="11" y1="6" x2="11" y2="17" {...S} />
          <line x1="15" y1="6" x2="15" y2="17" {...S} />
          <circle cx="5" cy="19.5" r="1.5" {...S} />
          <circle cx="17" cy="19.5" r="1.5" {...S} />
        </>
      )}
      {kind === 'pallet' && (
        <>
          <rect x="2" y="14" width="18" height="4" rx="1" {...S} />
          <line x1="7" y1="14" x2="7" y2="18" {...S} />
          <line x1="15" y1="14" x2="15" y2="18" {...S} />
          <rect x="4" y="9" width="14" height="5" rx="1" {...S} />
          <line x1="4" y1="11.5" x2="18" y2="11.5" {...S} />
        </>
      )}
    </svg>
  );
}
