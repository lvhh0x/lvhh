'use client';

// 회사 시뮬레이션 실행 화면 (Client Component) — Phase 5 Step 1
// id='box-pallet' 만 활성. 좌측 입력 + 우측 결과 2패널.

import { useState } from 'react';
import type {
  CompanyParams as CompanyParamsType,
  CompanyResult as CompanyResultType,
} from '@/types/company';
import { simulate } from '@/lib/company/simulate';
import { COMPANY_TILES } from '@/lib/company/tiles';
import InnerHeader from '@/components/layout/InnerHeader';
import CompanyParams from '@/components/company/CompanyParams';
import CompanyResult from '@/components/company/CompanyResult';

interface PageProps {
  params: { id: string };
}

export default function CompanyRunPage({ params }: PageProps) {
  const { id } = params;
  const tile = COMPANY_TILES.find(t => t.id === id && t.status === 'active');

  const [result, setResult] = useState<CompanyResultType | null>(null);
  const [unsupported, setUnsupported] = useState<
    { size: number; meter: number }[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(p: CompanyParamsType) {
    setIsLoading(true);
    setResult(null);
    setUnsupported(null);
    // 850ms 연출 (주식 화면과 동일 UX)
    setTimeout(() => {
      const outcome = simulate(p);
      if (outcome.ok) {
        setResult(outcome.result);
      } else {
        setUnsupported(outcome.unsupported);
      }
      setIsLoading(false);
    }, 850);
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .sim-layout { flex-direction: column !important; }
          .sim-params { width: 100% !important; position: static !important; }
        }
      `}</style>

      <InnerHeader
        backLabel="시뮬레이션 선택"
        backHref="/company"
        crumbA="OPERATIONS SIMULATION"
        crumbB={tile?.title ?? id}
      />

      <main
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '40px 32px',
        }}
      >
        {!tile ? (
          <div
            style={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: '13px',
              color: '#9C9486',
              textAlign: 'center',
              marginTop: '80px',
            }}
          >
            시뮬레이션을 찾을 수 없습니다: {id}
          </div>
        ) : (
          <div
            className="sim-layout"
            style={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}
          >
            {/* 좌측: 입력 패널 (sticky) */}
            <div
              className="sim-params"
              style={{
                width: '320px',
                flexShrink: 0,
                position: 'sticky',
                top: '24px',
              }}
            >
              <CompanyParams onSubmit={handleSubmit} isLoading={isLoading} />
            </div>

            {/* 우측: 결과 패널 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <CompanyResult
                result={result}
                isLoading={isLoading}
                unsupported={unsupported}
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
