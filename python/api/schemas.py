"""Pydantic request/response 스키마."""
from __future__ import annotations

from pydantic import BaseModel, Field

from app.models import SimulationResult


# ── Request ───────────────────────────────────────────────────────────────────────

class BacktestRequest(BaseModel):
    symbol: str = Field(..., description="티커 또는 종목코드 (예: SCHD, 005930)")
    start_ym: str = Field(..., description="시작 YYYY-MM")
    end_ym: str = Field(..., description="종료 YYYY-MM")
    lump_sum_krw: float = Field(0.0, ge=0)
    monthly_krw: float = Field(0.0, ge=0)
    buy_day: int = Field(26, ge=1, le=31)
    dividend_reinvest: bool = True


# ── Response ───────────────────────────────────────────────────────────────────────

class AnnualDividendItem(BaseModel):
    year: int
    amount_krw: float


class KpiResponse(BaseModel):
    etf_name: str
    months: int
    principal_krw: float
    capital_gain_krw: float
    dividend_krw: float
    total_value_krw: float
    xirr: float | None
    mdd_pct: float
    real_annual_return: float | None
    annual_dividend_krw: list[AnnualDividendItem]
    data_as_of: str | None
    fetched_at: str | None


class ChartSeriesResponse(BaseModel):
    dates: list[str]
    principal_krw: list[float]
    total_value_krw: list[float]
    dividend_krw: list[float]
    mdd_point: tuple[str, float] | None


class BacktestResponse(BaseModel):
    kpi: KpiResponse
    chart: ChartSeriesResponse

    @classmethod
    def from_result(cls, result: SimulationResult) -> "BacktestResponse":
        kpi = result.kpi
        chart = result.chart
        return cls(
            kpi=KpiResponse(
                etf_name=kpi.etf_name,
                months=kpi.months,
                principal_krw=kpi.principal_krw,
                capital_gain_krw=kpi.capital_gain_krw,
                dividend_krw=kpi.dividend_krw,
                total_value_krw=kpi.total_value_krw,
                xirr=kpi.xirr,
                mdd_pct=kpi.mdd_pct,
                real_annual_return=kpi.real_annual_return,
                annual_dividend_krw=[
                    AnnualDividendItem(year=yr, amount_krw=amt)
                    for yr, amt in kpi.annual_dividend_krw
                ],
                data_as_of=kpi.data_as_of,
                fetched_at=kpi.fetched_at,
            ),
            chart=ChartSeriesResponse(
                dates=list(chart.dates),
                principal_krw=list(chart.principal_krw),
                total_value_krw=list(chart.total_value_krw),
                dividend_krw=list(chart.dividend_krw),
                mdd_point=chart.mdd_point,
            ),
        )


class StockRangeResponse(BaseModel):
    symbol: str
    start: str | None  # YYYY-MM-DD
    end: str | None
