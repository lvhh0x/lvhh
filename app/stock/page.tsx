// 주식 시뮬레이션 리스트 페이지
// Phase 4 (FE-03, FE-04)에서 완성

import InnerHeader from '@/components/layout/InnerHeader';

export default function StockListPage() {
  return (
    <>
      <InnerHeader
        backLabel="홈"
        backHref="/"
        crumbA="주식 시뮬레이션"
        crumbB="전략 라이브러리"
      />
      <main style={{ maxWidth: '1180px', margin: '0 auto', padding: '40px 32px' }}>
        <p style={{ color: '#9C9486', fontFamily: 'var(--font-manrope), sans-serif' }}>
          Phase 4에서 구현 예정
        </p>
      </main>
    </>
  );
}
