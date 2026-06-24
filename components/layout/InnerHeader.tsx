// FE-01 — 내부 페이지용 스티키 헤더 (HTML 원본 line 31–48)
// 서버 컴포넌트 — state/effect 불필요
import Link from 'next/link';

interface InnerHeaderProps {
  backLabel: string; // 예: '홈', '전략 목록'
  backHref: string;  // 예: '/', '/stock'
  crumbA: string;    // 예: '주식 시뮬레이션'
  crumbB: string;    // 예: '삼성전자 모멘텀 추세'
}

export default function InnerHeader({ backLabel, backHref, crumbA, crumbB }: InnerHeaderProps) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        backdropFilter: 'blur(12px)',
        background: 'rgba(20,17,14,0.86)',
        borderBottom: '1px solid rgba(201,168,106,.2)',
      }}
    >
      <div
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '17px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {/* 로고 */}
        <Link
          href="/"
          style={{
            color: '#C9A86A',
            textDecoration: 'none',
            fontFamily: 'var(--font-cormorant), serif',
            fontWeight: 600,
            fontSize: '17px',
            letterSpacing: '0.08em',
          }}
        >
          M. MERIDIAN
        </Link>

        {/* 구분선 */}
        <div
          style={{
            width: '1px',
            height: '16px',
            background: 'rgba(201,168,106,.3)',
          }}
        />

        {/* 백 네비게이션 */}
        <Link
          href={backHref}
          style={{
            color: '#9C9486',
            textDecoration: 'none',
            fontSize: '12px',
            fontFamily: 'var(--font-manrope), sans-serif',
          }}
        >
          ← {backLabel}
        </Link>

        {/* 빈 공간 */}
        <div style={{ flex: 1 }} />

        {/* 브레드크럼 */}
        <span
          style={{
            color: '#9C9486',
            fontSize: '11px',
            fontFamily: 'var(--font-manrope), sans-serif',
            letterSpacing: '0.05em',
          }}
        >
          {crumbA} /{' '}
          <span style={{ color: '#C9A86A' }}>{crumbB}</span>
        </span>
      </div>
    </div>
  );
}
