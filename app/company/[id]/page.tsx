'use client';

// 회사 시뮬레이션 실행 화면 (Client Component) — Phase 5 Step 1 / Phase 6 DB 연동
// id='box-pallet' 만 활성. 좀측 입력 + 우측 결과 2패널.
// Phase 6: 마스터 데이터를 /api/company/master(Supabase)에서 로드 후 주입.
//          로드 3-상태(loading/ok/error+재시도), 성공 전에는 패널을 열지 않는다.

import { useCallback, useEffect, useState } from 'react';
import type {
  CompanyParams as CompanyParamsType,
  CompanyResult as CompanyResultType,
} from '@/types/company';
import { simulate } from '@/lib/company/simulate';
import { hydrateMasterData } from '@/lib/company/data';
import type { MasterData } from '@/types/company';
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

  const [masterStatus, setMasterStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [result, setResult] = useState<CompanyResultType | null>(null);
  const [unsupported, setUnsupported] = useState<
    { size: number; meter: number }[] | null
  >(null);
  const [ambiguous, setAmbiguous] = useState<
    { size: number; meter: number }[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadMaster = useCallback(async () => {
    setMasterStatus('loading');
    try {
      const res = await fetch('/api/company/master');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: MasterData = await res.json();
      hydrateMasterData(data);
      setMasterStatus('ok');
    } catch {
      setMasterStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadMaster();
  }, [loadMaster]);

  function handleSubmit(p: CompanyParamsType) {
    setIsLoading(true);
    setResult(null);
    setUnsupported(null);
    setAmbiguous(null);
    // 850ms 연출 (주식 화면과 동일 UX)
    setTimeout(() => {
      const outcome = simulate(p);
      if (outcome.ok) {
        setResult(outcome.result);
      } else {
        setUnsupported(outcome.unsupported);
        setAmbiguous(outcome.ambiguous);
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
        ) : masterStatus !== 'ok' ? (
          <div
            style={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: '13px',
              color: '#9C9486',
              textAlign: 'center',
              marginTop: '80px',
            }}
          >
            {masterStatus === 'loading' ? (
              '마스터 데이터 로드 중\u2026'
            ) : (
              <>
                <div>마스터 데이터를 불러오지 못했습니다.</div>
                <button
                  onClick={() => void loadMaster()}
                  style={{
                    marginTop: '16px',
                    background: 'transparent',
                    border: '1px solid rgba(201,168,106,0.4)',
                    borderRadius: '2px',
                    padding: '8px 20px',
                    color: '#C9A86A',
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  다시 시도
                </button>
              </>
            )}
          </div>
        ) : (
          <div
            className="sim-layout"
            style={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}
          >
            {/* 좀측: 입력 패널 (sticky) */}
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
                ambiguous={ambiguous}
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
