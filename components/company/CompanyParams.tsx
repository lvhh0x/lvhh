'use client';

// 회사 시뮬레이션 입력 패널 (Client Component) — Phase 5 Step 1
// 제품 행(사이즈/미터/수량) 다중 입력 + 파렛트 선택 + 실행.

import { useState } from 'react';
import type { ProductInput, CompanyParams as CompanyParamsType } from '@/types/company';
import { PALLETS, PRODUCTS } from '@/lib/company/data';

interface Props {
  onSubmit: (params: CompanyParamsType) => void;
  isLoading: boolean;
}

interface RowState {
  size: string;
  meter: string;
  qty: string;
}

const EMPTY_ROW: RowState = { size: '', meter: '', qty: '' };

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(20,17,14,0.6)',
  border: '1px solid rgba(201,168,106,0.2)',
  borderRadius: '2px',
  padding: '8px 10px',
  color: '#E8E0D2',
  fontFamily: 'var(--font-jetbrains-mono), monospace',
  fontSize: '13px',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-jetbrains-mono), monospace',
  fontSize: '10px',
  letterSpacing: '0.08em',
  color: '#8c7a55',
  marginBottom: '4px',
  display: 'block',
};

export default function CompanyParams({ onSubmit, isLoading }: Props) {
  const [rows, setRows] = useState<RowState[]>([{ ...EMPTY_ROW }]);
  const [palletId, setPalletId] = useState<string>('');

  function updateRow(idx: number, key: keyof RowState, value: string) {
    setRows(prev =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)),
    );
  }

  function addRow() {
    setRows(prev => [...prev, { ...EMPTY_ROW }]);
  }

  function removeRow(idx: number) {
    setRows(prev => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  function handleRun() {
    const products: ProductInput[] = rows
      .map(r => ({
        size: Number(r.size),
        meter: Number(r.meter),
        qty: Number(r.qty),
      }))
      .filter(p => p.size > 0 && p.meter > 0 && p.qty > 0);

    if (products.length === 0) return;

    onSubmit({
      products,
      palletId: palletId === '' ? null : palletId,
    });
  }

  return (
    <div
      style={{
        background: 'linear-gradient(180deg,#1a1510,#15110d)',
        border: '1px solid rgba(201,168,106,0.15)',
        borderRadius: '2px',
        padding: '24px 20px',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: '22px',
          fontWeight: 600,
          color: '#C9A86A',
          margin: '0 0 6px',
        }}
      >
        제품 입력
      </h2>
      <p
        style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          color: '#9C9486',
          margin: '0 0 18px',
          lineHeight: 1.5,
        }}
      >
        지원 제품: {PRODUCTS.map(p => `${p.size}×${p.meter}`).join(', ')}
      </p>

      {/* 제품 행들 */}
      {rows.map((row, idx) => (
        <div
          key={idx}
          style={{
            marginBottom: '14px',
            paddingBottom: '14px',
            borderBottom:
              idx < rows.length - 1
                ? '1px solid rgba(201,168,106,0.1)'
                : 'none',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>사이즈</label>
              <input
                type="number"
                inputMode="numeric"
                value={row.size}
                onChange={e => updateRow(idx, 'size', e.target.value)}
                placeholder="40"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>미터</label>
              <input
                type="number"
                inputMode="numeric"
                value={row.meter}
                onChange={e => updateRow(idx, 'meter', e.target.value)}
                placeholder="300"
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>수량</label>
              <input
                type="number"
                inputMode="numeric"
                value={row.qty}
                onChange={e => updateRow(idx, 'qty', e.target.value)}
                placeholder="120"
                style={inputStyle}
              />
            </div>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(idx)}
                aria-label="제품 행 삭제"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(201,168,106,0.2)',
                  borderRadius: '2px',
                  color: '#9C9486',
                  width: '36px',
                  height: '35px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
      ))}

      {/* 제품 추가 */}
      <button
        type="button"
        onClick={addRow}
        style={{
          width: '100%',
          background: 'transparent',
          border: '1px dashed rgba(201,168,106,0.3)',
          borderRadius: '2px',
          color: '#C9A86A',
          padding: '8px',
          cursor: 'pointer',
          fontFamily: 'var(--font-manrope), sans-serif',
          fontSize: '12px',
          marginBottom: '20px',
        }}
      >
        + 제품 추가
      </button>

      {/* 파렛트 선택 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>파렛트</label>
        <select
          value={palletId}
          onChange={e => setPalletId(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="">적재 안 함</option>
          {PALLETS.map(p => (
            <option key={p.id} value={p.id}>
              {p.label} (층당 {p.boxesPerLayer})
            </option>
          ))}
        </select>
      </div>

      {/* 실행 */}
      <button
        type="button"
        onClick={handleRun}
        disabled={isLoading}
        style={{
          width: '100%',
          background: isLoading
            ? 'rgba(201,168,106,0.3)'
            : 'linear-gradient(90deg,#C9A86A,#DCC08A)',
          border: 'none',
          borderRadius: '2px',
          color: '#15110d',
          padding: '12px',
          cursor: isLoading ? 'default' : 'pointer',
          fontFamily: 'var(--font-manrope), sans-serif',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.04em',
        }}
      >
        {isLoading ? '계산 중…' : '▶ 실행'}
      </button>
    </div>
  );
}
