// FE-01 — 시세 티커 (HTML 원본 line 54–60)
// 서버 컴포넌트 — state/effect 불필요
// 데이터 2배 반복으로 무한 스크롤 루프 구현

const TICKER_ITEMS = [
  { sym: 'KOSPI',  px: '2,841.20', d:  0.62 },
  { sym: 'KOSDAQ', px: '870.4',    d: -0.91 },
  { sym: 'S&P500', px: '5,930',    d:  0.18 },
  { sym: 'NASDAQ', px: '19,210',   d:  0.74 },
  { sym: 'BTC',    px: '₩98.2M',   d:  2.41 },
  { sym: 'ETH',    px: '₩5.1M',    d:  1.22 },
  { sym: 'NVDA',   px: '1,210',    d:  3.08 },
  { sym: 'TSLA',   px: '412',      d:  1.84 },
  { sym: '005930', px: '78,400',   d: -0.43 },
  { sym: 'AAPL',   px: '231',      d:  0.55 },
] as const;

export default function Ticker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div
      style={{
        overflow: 'hidden',
        borderBottom: '1px solid rgba(201,168,106,.16)',
      }}
    >
      <div
        style={{
          display: 'flex',
          animation: 'marq 40s linear infinite',
          width: 'max-content',
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            style={{ padding: '8px 24px', whiteSpace: 'nowrap', fontSize: '11px' }}
          >
            <span style={{ color: '#7a7264' }}>{item.sym}</span>
            {' '}
            <span style={{ color: '#cabfa8' }}>{item.px}</span>
            {' '}
            <span style={{ color: item.d >= 0 ? '#8FBFA0' : '#C77B66' }}>
              {item.d >= 0 ? '+' : ''}{item.d.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
