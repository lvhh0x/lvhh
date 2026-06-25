// types/backtest.ts

// ── Stock Config ─────────────────────────────────────────
export interface StockConfig {
  id: string;           // URL slug: "schd", "qqq", "005930"
  symbol: string;       // API 호출용: "SCHD", "QQQ", "005930"
  displayName: string;  // 화면 표시명
  description: string;
  currency: 'USD' | 'KRW';
  category: string[];   // ["ETF", "배당", "미국"] 등
}

// ── Backtest Request ─────────────────────────────────────
export interface BacktestRequest {
  symbol: string;
  startYm: string;          // "YYYY-MM"
  endYm: string;
  lumpSumKrw: number;
  monthlyKrw: number;
  buyDay: number;
  dividendReinvest: boolean;
}

// ── Backtest Response ─────────────────────────────────────
export interface AnnualDividend {
  year: number;
  amountKrw: number;
}

export interface KpiResult {
  etfName: string;
  months: number;
  principalKrw: number;
  capitalGainKrw: number;
  dividendKrw: number;
  totalValueKrw: number;
  xirr: number | null;
  mddPct: number;
  realAnnualReturn: number | null;
  annualDividendKrw: AnnualDividend[];
  dataAsOf: string | null;
  fetchedAt: string | null;
}

export interface ChartSeries {
  dates: string[];
  principalKrw: number[];
  totalValueKrw: number[];
  dividendKrw: number[];
  mddPoint: [string, number] | null;
}

export interface BacktestResult {
  kpi: KpiResult;
  chart: ChartSeries;
}

// ── Data Range ────────────────────────────────────────────
export interface StockRange {
  symbol: string;
  start: string | null;   // "YYYY-MM-DD"
  end: string | null;
}

// ── Python API raw snake_case (변환 전) ───────────────────
// Next.js API Route 에서 camelCase 로 변환 후 위 타입으로 반환
export interface RawKpiResponse {
  etf_name: string;
  months: number;
  principal_krw: number;
  capital_gain_krw: number;
  dividend_krw: number;
  total_value_krw: number;
  xirr: number | null;
  mdd_pct: number;
  real_annual_return: number | null;
  annual_dividend_krw: Array<{ year: number; amount_krw: number }>;
  data_as_of: string | null;
  fetched_at: string | null;
}

export interface RawChartResponse {
  dates: string[];
  principal_krw: number[];
  total_value_krw: number[];
  dividend_krw: number[];
  mdd_point: [string, number] | null;
}

export interface RawBacktestResponse {
  kpi: RawKpiResponse;
  chart: RawChartResponse;
}
