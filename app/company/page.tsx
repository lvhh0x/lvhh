// 회사 시뮬레이션 리스트 페이지
// Phase 5 (FE-05, FE-06)에서 완성

import InnerHeader from '@/components/layout/InnerHeader';

export default function CompanyListPage() {
  return (
    <>
      <InnerHeader
        backLabel="홈"
        backHref="/"
        crumbA="회사 시뮬레이션"
        crumbB="운영 도구"
      />
      <main style={{ maxWidth: '1180px', margin: '0 auto', padding: '40px 32px' }}>
        <p style={{ color: '#9C9486', fontFamily: 'var(--font-manrope), sans-serif' }}>
          Phase 5에서 구현 예정
        </p>
      </main>
    </>
  );
}
