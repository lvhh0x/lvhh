const KPI_DATA = [
  { value: '+18.4%', label: '\ud3c9\uade0 \uc218\uc775\ub960' },
  { value: '6',      label: '\uc8fc\uc2dd \uc804\ub7b5' },
  { value: '3',      label: '\uc6b4\uc601 \ub3c4\uad6c' },
  { value: '92.6%',  label: '\ud3c9\uade0 \uc801\uc7ac\uc728' },
] as const;

export default function StatsBand() {
  return (
    <div style={{ borderTop: '1px solid rgba(201,168,106,.22)', borderBottom: '1px solid rgba(201,168,106,.22)', margin: '0 0 48px' }}>
      <div
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '28px 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          textAlign: 'center',
        }}
      >
        {KPI_DATA.map(({ value, label }) => (
          <div key={label}>
            <div
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: '36px',
                fontWeight: 500,
                color: '#C9A86A',
                lineHeight: 1,
              }}
            >
              {value}
            </div>
            <div
              style={{
                marginTop: '6px',
                fontSize: '11px',
                color: '#7a7264',
                letterSpacing: '0.08em',
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
