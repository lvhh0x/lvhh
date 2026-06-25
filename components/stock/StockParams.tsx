'use client';

// FE-04 — 백테스트 입력 패널 (Client Component)

import { useState, useEffect } from 'react';
import type { StockConfig, BacktestRequest, StockRange } from '@/types/backtest';

interface Props {
  stock: StockConfig;
  dataRange: StockRange | null;
  onSubmit: (req: BacktestRequest) => void;
  isLoading: boolean;
}

const C = {
  gold: '#C9A86A',
  text: '#E8E0D2',
  muted: '#9C9486',
} as const;

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(201,168,106,0.06)',
  border: '1px solid rgba(201,168,106,0.2)',
  borderRadius: '2px',
  color: C.text,
  fontFamily: 'var(--font-jetbrains-mono), monospace',
  fontSize: '13px',
  padding: '8px 10px',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-manrope), sans-serif',
  fontSize: '11px',
  color: C.muted,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: '6px',
};

function SectionTitle({ children }: { children: string }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-manrope), sans-serif',
        fontSize: '10px',
        color: C.gold,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        borderBottom: '1px solid rgba(201,168,106,0.15)',
        paddingBottom: '6px',
        marginBottom: '14px',
      }}
    >
      {children}
    </div>
  );
}

export default function StockParams({ stock, dataRange, onSubmit, isLoading }: Props) {
  const [startYm, setStartYm] = useState('');
  const [endYm, setEndYm] = useState('');
  const [lumpSum, setLumpSum] = useState('');
  const [monthly, setMonthly] = useState('');
  const [buyDay, setBuyDay] = useState('26');
  const [reinvest, setReinvest] = useState(true);

  // dataRange 로드 시 기본값 자동 설정 (아직 사용자가 입력하지 않은 경우만)
  useEffect(() => {
    if (!dataRange) return;
    setStartYm((prev) => prev || (dataRange.start?.slice(0, 7) ?? ''));
    setEndYm((prev) => prev || (dataRange.end?.slice(0, 7) ?? ''));
  }, [dataRange]);

  const rangeMin = dataRange?.start?.slice(0, 7);
  const rangeMax = dataRange?.end?.slice(0, 7);
  const canSubmit = !isLoading && startYm.length > 0 && endYm.length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      symbol: stock.symbol,
      startYm,
      endYm,
      lumpSumKrw: parseFloat(lumpSum) || 0,
      monthlyKrw: parseFloat(monthly) || 0,
      buyDay: Math.min(31, Math.max(1, parseInt(buyDay, 10) || 26)),
      dividendReinvest: reinvest,
    });
  }

  return (
    <div
      style={{
        background: 'linear-gradient(180deg,#1a1510,#15110d)',
        border: '1px solid rgba(201,168,106,0.15)',
        borderRadius: '2px',
        padding: '28px 24px',
        position: 'sticky',
        top: '72px',
      }}
    >
      {/* 종목 정보 */}
      <div style={{ marginBottom: '28px' }}>
        <div
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: '22px',
            fontWeight: 600,
            color: C.gold,
            letterSpacing: '0.04em',
            lineHeight: 1.1,
          }}
        >
          {stock.displayName}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: '10px',
            color: C.muted,
            marginTop: '4px',
            letterSpacing: '0.06em',
          }}
        >
          {stock.currency} · {stock.category.join(' · ')}
        </div>
        {dataRange ? (
          <div
            style={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: '11px',
              color: C.muted,
              marginTop: '10px',
              padding: '6px 10px',
              background: 'rgba(201,168,106,0.05)',
              border: '1px solid rgba(201,168,106,0.12)',
              borderRadius: '2px',
            }}
          >
            데이터 가능 기간: {rangeMin} ~ {rangeMax}
          </div>
        ) : (
          <div
            style={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: '11px',
              color: C.muted,
              marginTop: '10px',
            }}
          >
            데이터 기간 조회 중…
          </div>
        )}
      </div>

      {/* 투자 기간 */}
      <div style={{ marginBottom: '24px' }}>
        <SectionTitle>투자 기간</SectionTitle>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>시작</label>
          <input
            type="month"
            value={startYm}
            min={rangeMin}
            max={endYm || rangeMax}
            onChange={(e) => setStartYm(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>종료</label>
          <input
            type="month"
            value={endYm}
            min={startYm || rangeMin}
            max={rangeMax}
            onChange={(e) => setEndYm(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* 투자 금액 */}
      <div style={{ marginBottom: '24px' }}>
        <SectionTitle>투자 금액 (원)</SectionTitle>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>거치금</label>
          <input
            type="number"
            value={lumpSum}
            min={0}
            step={1000000}
            placeholder="0"
            onChange={(e) => setLumpSum(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>월 적립금</label>
          <input
            type="number"
            value={monthly}
            min={0}
            step={100000}
            placeholder="0"
            onChange={(e) => setMonthly(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* 설정 */}
      <div style={{ marginBottom: '28px' }}>
        <SectionTitle>설정</SectionTitle>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>매수일</label>
          <input
            type="number"
            value={buyDay}
            min={1}
            max={31}
            onChange={(e) => setBuyDay(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>배당 재투자</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['ON', 'OFF'] as const).map((opt) => {
              const active = (opt === 'ON') === reinvest;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setReinvest(opt === 'ON')}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    border: `1px solid ${active ? C.gold : 'rgba(201,168,106,0.2)'}`,
                    background: active ? 'rgba(201,168,106,0.12)' : 'transparent',
                    color: active ? C.gold : C.muted,
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    fontSize: '12px',
                    letterSpacing: '0.06em',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 백테스트 실행 버튼 */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: '100%',
          padding: '12px',
          background: canSubmit
            ? 'rgba(201,168,106,0.18)'
            : 'rgba(201,168,106,0.05)',
          border: `1px solid ${canSubmit ? 'rgba(201,168,106,0.5)' : 'rgba(201,168,106,0.15)'}`,
          borderRadius: '2px',
          color: canSubmit ? C.gold : C.muted,
          fontFamily: 'var(--font-manrope), sans-serif',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {isLoading ? '분석 중…' : '백테스트 실행'}
      </button>
    </div>
  );
}
