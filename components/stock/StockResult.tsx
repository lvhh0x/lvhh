'use client';

// FE-04 — 백테스트 결과 패널 (Client Component, recharts LineChart + CSS 배당 바)

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import type { BacktestResult } from '@/types/backtest';

interface Props {
  result: BacktestResult | null;
  isLoading: boolean;
  error: string | null;
}

const C = {
  gold: '#C9A86A',
  text: '#E8E0D2',
  muted: '#9C9486',
  subtle: '#8c8478',
  up: '#8FBFA0',
  down: '#C77B66',
  cardBg: 'linear-gradient(180deg,#1a1510,#15110d)',
} as const;

// ── KRW 포맷 (1억 2,340만원 형식) ─────────────────────────────────
function formatKrw(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  const uk = Math.floor(abs / 100_000_000);
  const man = Math.floor((abs % 100_000_000) / 10_000);
  const won = Math.floor(abs % 10_000);
  const parts: string[] = [];
  if (uk > 0) parts.push(`${uk}억`);
  if (man > 0) parts.push(`${man.toLocaleString()}만`);
  if (won > 0 || parts.length === 0) parts.push(`${won.toLocaleString()}원`);
  else parts.push('원');
  return sign + parts.join(' ');
}

// Y축 간략 포맷
function formatYAxis(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 100_000_000) return `${(abs / 100_000_000).toFixed(0)}억`;
  if (abs >= 10_000) return `${Math.floor(abs / 10_000)}만`;
  return String(value);
}

// ── KPI 행 ──────────────────────────────────────────────────────
function KpiRow({
  label,
  value,
  highlight = false,
  sign = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  sign?: boolean;
}) {
  const isPositive = sign && !value.startsWith('-');
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '8px 0',
        borderBottom: '1px solid rgba(201,168,106,0.08)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-manrope), sans-serif',
          fontSize: '12px',
          color: C.muted,
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: highlight ? '15px' : '13px',
          fontWeight: highlight ? 600 : 400,
          color: sign ? (isPositive ? C.up : C.down) : C.text,
          letterSpacing: '0.02em',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── 차트 데이터 ───────────────────────────────────────────────
interface ChartDatum {
  date: string;
  principal: number;
  total: number;
  dividend: number;
}

// ── 메인 컴포넌트 ───────────────────────────────────────────────
export default function StockResult({ result, isLoading, error }: Props) {
  // 로딩 중
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '360px',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '2px solid rgba(201,168,106,0.2)',
            borderTop: `2px solid ${C.gold}`,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-manrope), sans-serif',
            fontSize: '13px',
            color: C.muted,
          }}
        >
          시뮬레이션 실행 중…
        </span>
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      </div>
    );
  }

  // 에러
  if (error) {
    return (
      <div
        style={{
          border: `1px solid ${C.down}`,
          borderRadius: '2px',
          padding: '24px',
          background: 'rgba(199,123,102,0.05)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-manrope), sans-serif',
            fontSize: '13px',
            color: C.down,
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  // 결과 없음 (초기 상태)
  if (!result) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '360px',
          gap: '12px',
          border: '1px solid rgba(201,168,106,0.1)',
          borderRadius: '2px',
          background: 'rgba(201,168,106,0.02)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: '18px',
            color: C.muted,
            letterSpacing: '0.06em',
          }}
        >
          SIMULATION READY
        </div>
        <div
          style={{
            fontFamily: 'var(--font-manrope), sans-serif',
            fontSize: '12px',
            color: C.subtle,
          }}
        >
          좌측 패널에서 조건을 설정하고 실행하세요
        </div>
      </div>
    );
  }

  // ── 결과 표시 ─────────────────────────────────────────────────────────────
  const { kpi, chart } = result;

  const chartData: ChartDatum[] = chart.dates.map((date, i) => ({
    date,
    principal: chart.principalKrw[i] ?? 0,
    total: chart.totalValueKrw[i] ?? 0,
    dividend: chart.dividendKrw[i] ?? 0,
  }));

  const tickInterval = Math.max(1, Math.floor(chartData.length / 8) - 1);

  const capitalPct =
    kpi.principalKrw > 0
      ? ((kpi.capitalGainKrw / kpi.principalKrw) * 100).toFixed(1)
      : '0.0';

  const maxDivAmount =
    kpi.annualDividendKrw.length > 0
      ? Math.max(...kpi.annualDividendKrw.map((d) => d.amountKrw))
      : 0;

  return (
    <div>
      {/* ── KPI 테이블 ────────────────────────────────────── */}
      <div
        style={{
          background: C.cardBg,
          border: '1px solid rgba(201,168,106,0.15)',
          borderRadius: '2px',
          padding: '24px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-manrope), sans-serif',
            fontSize: '10px',
            color: C.gold,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            borderBottom: '1px solid rgba(201,168,106,0.15)',
            paddingBottom: '6px',
            marginBottom: '4px',
          }}
        >
          시뮬레이션 결과 — {kpi.etfName}
        </div>
        <KpiRow label="투자 원금" value={formatKrw(kpi.principalKrw)} highlight />
        <KpiRow
          label="자본 수익금"
          value={`${kpi.capitalGainKrw >= 0 ? '+' : ''}${formatKrw(kpi.capitalGainKrw)} (${kpi.capitalGainKrw >= 0 ? '+' : ''}${capitalPct}%)`}
          sign
        />
        <KpiRow
          label="배당금 누계"
          value={`+${formatKrw(kpi.dividendKrw)}`}
          sign
        />
        <KpiRow label="총 수익금액" value={formatKrw(kpi.totalValueKrw)} highlight />
        <KpiRow
          label="연환산 수익률 (XIRR)"
          value={kpi.xirr !== null ? `${(kpi.xirr * 100).toFixed(1)}%` : '-'}
          sign
        />
        <KpiRow label="최대 낙폭 (MDD)" value={`${kpi.mddPct.toFixed(1)}%`} />
        <KpiRow
          label="실질 연환산 수익률"
          value={
            kpi.realAnnualReturn !== null
              ? `${(kpi.realAnnualReturn * 100).toFixed(1)}%`
              : '-'
          }
          sign
        />
        <KpiRow label="투자 기간" value={`${kpi.months}개월`} />
        {kpi.dataAsOf && (
          <KpiRow label="데이터 기준일" value={kpi.dataAsOf.slice(0, 10)} />
        )}
      </div>

      {/* ── 수익 추이 차트 ────────────────────────────────────────── */}
      <div
        style={{
          background: C.cardBg,
          border: '1px solid rgba(201,168,106,0.15)',
          borderRadius: '2px',
          padding: '24px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-manrope), sans-serif',
            fontSize: '10px',
            color: C.gold,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '20px',
          }}
        >
          수익 추이
        </div>

        {/* 범례 */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
          {[
            { color: C.muted, label: '원금' },
            { color: C.gold, label: '총자산' },
            { color: C.up, label: '배당누계' },
          ].map(({ color, label }) => (
            <div
              key={label}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <div
                style={{
                  width: '20px',
                  height: '2px',
                  background: color,
                  borderRadius: '1px',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-manrope), sans-serif',
                  fontSize: '11px',
                  color: C.muted,
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(201,168,106,0.08)"
              />
              <XAxis
                dataKey="date"
                tick={{
                  fill: C.subtle,
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 10,
                }}
                tickFormatter={(v: string) => v.slice(0, 7)}
                interval={tickInterval}
                axisLine={{ stroke: 'rgba(201,168,106,0.15)' }}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fill: C.subtle,
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 10,
                }}
                tickFormatter={formatYAxis}
                width={52}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => {
                  const num = typeof value === 'number' ? value : 0;
                  return formatKrw(num);
                }}
                labelFormatter={(label) => {
                  const str = typeof label === 'string' ? label : String(label);
                  return str.slice(0, 7);
                }}
                contentStyle={{
                  background: '#1a1510',
                  border: '1px solid rgba(201,168,106,0.3)',
                  borderRadius: '2px',
                  padding: '10px 14px',
                }}
                labelStyle={{
                  color: C.muted,
                  fontFamily: 'var(--font-manrope), sans-serif',
                  fontSize: '11px',
                  marginBottom: '4px',
                }}
                itemStyle={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: '11px',
                  padding: '2px 0',
                }}
              />
              <Line
                type="monotone"
                dataKey="principal"
                name="원금"
                stroke={C.muted}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: C.muted }}
              />
              <Line
                type="monotone"
                dataKey="total"
                name="총자산"
                stroke={C.gold}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: C.gold }}
              />
              <Line
                type="monotone"
                dataKey="dividend"
                name="배당누계"
                stroke={C.up}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: C.up }}
              />
              {chart.mddPoint && (
                <ReferenceDot
                  x={chart.mddPoint[0]}
                  y={chart.mddPoint[1]}
                  r={5}
                  fill={C.down}
                  stroke="#14110E"
                  strokeWidth={1.5}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {chart.mddPoint && (
          <div
            style={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: '11px',
              color: C.down,
              marginTop: '8px',
              textAlign: 'right',
            }}
          >
            ● MDD 저점: {chart.mddPoint[0].slice(0, 7)} / {formatKrw(chart.mddPoint[1])}
          </div>
        )}
      </div>

      {/* ── 연도별 세후 배당금 ─────────────────────────────────────── */}
      {kpi.annualDividendKrw.length > 0 && (
        <div
          style={{
            background: C.cardBg,
            border: '1px solid rgba(201,168,106,0.15)',
            borderRadius: '2px',
            padding: '24px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: '10px',
              color: C.gold,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              borderBottom: '1px solid rgba(201,168,106,0.15)',
              paddingBottom: '6px',
              marginBottom: '16px',
            }}
          >
            연도별 세후 배당금
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {kpi.annualDividendKrw.map(({ year, amountKrw }) => {
              const pct =
                maxDivAmount > 0 ? (amountKrw / maxDivAmount) * 100 : 0;
              return (
                <div
                  key={year}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      fontSize: '12px',
                      color: C.muted,
                      width: '40px',
                      flexShrink: 0,
                    }}
                  >
                    {year}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: '6px',
                      background: 'rgba(201,168,106,0.08)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: C.up,
                        borderRadius: '3px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      fontSize: '12px',
                      color: C.text,
                      width: '100px',
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    {formatKrw(amountKrw)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
