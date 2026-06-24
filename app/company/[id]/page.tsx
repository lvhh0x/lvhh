// 회사 시뮬레이션 실행 페이지
// Phase 5 (FE-06)에서 완성

import InnerHeader from '@/components/layout/InnerHeader';

export default function CompanyRunPage({ params }: { params: { id: string } }) {
  return (
    <>
      <InnerHeader
        backLabel="도구 목록"
        backHref="/company"
        crumbA="회사 시뮬레이션"
        crumbB={params.id}
      />
      <main style={{ maxWidth: '1180px', margin: '0 auto', padding: '40px 32px' }}>
        <p style={{ color: '#9C9486', fontFamily: 'var(--font-manrope), sans-serif' }}>
          Phase 5에서 구현 예정 — {params.id}
        </p>
      </main>
    </>
  );
}
