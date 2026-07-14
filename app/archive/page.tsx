// FE-08 — 자료실 (Client Component)
// /api/archive 목록을 받아 표시하고 다운로드 링크를 건다.
// 렌더 3-상태: loading / ok(빈 목록 포함) / error(재시도)
'use client';

import { useCallback, useEffect, useState } from 'react';
import InnerHeader from '@/components/layout/InnerHeader';
import type { ArchiveFile } from '@/types/archive';

type LoadStatus = 'loading' | 'ok' | 'error';

// 1024 기준. 소수 1자리까지만 (파일 크기는 정밀도가 중요하지 않다).
function formatSize(bytes: number | null): string {
  if (bytes === null) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function ArchivePage() {
  const [files, setFiles] = useState<ArchiveFile[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/archive');
      if (!res.ok) {
        setStatus('error');
        return;
      }
      const data: ArchiveFile[] = await res.json();
      setFiles(data);
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <style>{`
        .archive-row:hover { border-color: rgba(201,168,106,0.4) !important; }
      `}</style>

      <InnerHeader
        backLabel="홈으로"
        backHref="/"
        crumbA="ARCHIVE"
        crumbB="자료실"
      />

      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '48px 32px' }}>
        {/* 페이지 타이틀 — /stock, /company 와 같은 규격 */}
        <div style={{ marginBottom: '40px' }}>
          <div
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: '12px',
              letterSpacing: '0.1em',
              color: '#8c7a55',
              marginBottom: '14px',
            }}
          >
            03 / ARCHIVE
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: '48px',
              fontWeight: 600,
              color: '#E8E0D2',
              letterSpacing: '0.02em',
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            자료<span style={{ fontStyle: 'italic', color: '#C9A86A' }}>실</span>
          </h1>
        </div>

        {status === 'loading' && (
          <div
            style={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: '13px',
              color: '#9C9486',
              padding: '40px 0',
              textAlign: 'center',
            }}
          >
            불러오는 중…
          </div>
        )}

        {status === 'error' && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--font-manrope), sans-serif',
                fontSize: '13px',
                color: '#C77B66',
                marginBottom: '16px',
              }}
            >
              자료 목록을 불러오지 못했습니다.
            </div>
            <button
              type="button"
              onClick={() => void load()}
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: '11px',
                letterSpacing: '0.08em',
                color: '#C9A86A',
                background: 'transparent',
                border: '1px solid rgba(201,168,106,0.3)',
                borderRadius: '2px',
                padding: '8px 18px',
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
          </div>
        )}

        {status === 'ok' && files.length === 0 && (
          <div
            style={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: '13px',
              color: '#9C9486',
              padding: '40px 0',
              textAlign: 'center',
              border: '1px solid rgba(201,168,106,0.12)',
              borderRadius: '2px',
            }}
          >
            등록된 자료가 없습니다.
          </div>
        )}

        {status === 'ok' && files.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {files.map((file) => (
              <a
                key={file.id}
                className="archive-row"
                href={file.downloadUrl}
                download={file.fileName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '20px',
                  textDecoration: 'none',
                  background: 'linear-gradient(180deg,#1a1510,#15110d)',
                  border: '1px solid rgba(201,168,106,0.15)',
                  borderRadius: '2px',
                  padding: '20px 24px',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-cormorant), serif',
                      fontSize: '22px',
                      fontWeight: 600,
                      color: '#E8E0D2',
                      letterSpacing: '0.02em',
                      marginBottom: '6px',
                    }}
                  >
                    {file.title}
                  </div>
                  {file.description !== null && file.description !== '' && (
                    <div
                      style={{
                        fontFamily: 'var(--font-manrope), sans-serif',
                        fontSize: '12px',
                        color: '#9C9486',
                        lineHeight: 1.5,
                        marginBottom: '6px',
                      }}
                    >
                      {file.description}
                    </div>
                  )}
                  <div
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      fontSize: '10px',
                      letterSpacing: '0.06em',
                      color: '#8c7a55',
                    }}
                  >
                    {file.fileName} · {formatSize(file.sizeBytes)} · {formatDate(file.createdAt)}
                  </div>
                </div>

                <span
                  style={{
                    flexShrink: 0,
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    color: '#C9A86A',
                    border: '1px solid rgba(201,168,106,0.3)',
                    borderRadius: '2px',
                    padding: '6px 12px',
                  }}
                >
                  다운로드 ↓
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
