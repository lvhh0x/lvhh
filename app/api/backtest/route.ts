import { NextRequest, NextResponse } from 'next/server';
import {
  BacktestRequest,
  BacktestResult,
  RawBacktestResponse,
} from '@/types/backtest';

const PYTHON_URL = process.env.PYTHON_SERVER_URL ?? 'http://localhost:8000';

function toCamel(raw: RawBacktestResponse): BacktestResult {
  const { kpi, chart } = raw;
  return {
    kpi: {
      etfName: kpi.etf_name,
      months: kpi.months,
      principalKrw: kpi.principal_krw,
      capitalGainKrw: kpi.capital_gain_krw,
      dividendKrw: kpi.dividend_krw,
      totalValueKrw: kpi.total_value_krw,
      xirr: kpi.xirr,
      mddPct: kpi.mdd_pct,
      realAnnualReturn: kpi.real_annual_return,
      annualDividendKrw: kpi.annual_dividend_krw.map((d) => ({
        year: d.year,
        amountKrw: d.amount_krw,
      })),
      dataAsOf: kpi.data_as_of,
      fetchedAt: kpi.fetched_at,
    },
    chart: {
      dates: chart.dates,
      principalKrw: chart.principal_krw,
      totalValueKrw: chart.total_value_krw,
      dividendKrw: chart.dividend_krw,
      mddPoint: chart.mdd_point,
    },
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json() as BacktestRequest;
  const payload = {
    symbol: body.symbol,
    start_ym: body.startYm,
    end_ym: body.endYm,
    lump_sum_krw: body.lumpSumKrw,
    monthly_krw: body.monthlyKrw,
    buy_day: body.buyDay,
    dividend_reinvest: body.dividendReinvest,
  };

  try {
    const res = await fetch(`${PYTHON_URL}/backtest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json() as { detail?: string };
      return NextResponse.json(
        { error: err.detail ?? '시뮬레이션 실패' },
        { status: res.status }
      );
    }

    const raw = await res.json() as RawBacktestResponse;
    return NextResponse.json(toCamel(raw));
  } catch {
    return NextResponse.json({ error: 'Python 서버 연결 실패' }, { status: 503 });
  }
}
