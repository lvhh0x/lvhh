"""engine.py — 금융공학 백테스팅 Core (명세 §5, §9, §10).

이 모듈은 화면·파일 인프라·데이터 출처를 전혀 모른다.
표준 Pandas DataFrame 과 설정/입력 객체만 받아 KPI·차트 시계열을 반환한다.
"""

from __future__ import annotations

import calendar
import math
from dataclasses import dataclass, field
from datetime import date, datetime

import pandas as pd

from app.models import (
    AppConfig,
    AssetCurrency,
    ChartSeries,
    KpiResult,
    SimulationInput,
    SimulationResult,
)
from app.xirr import compute_xirr

_MIN_MONTHS = 3


class EngineError(ValueError):
    """엔진 입력/연산 전제 위반 시 발생."""


@dataclass(frozen=True)
class _AlignedSeries:
    """주가 날짜축에 정렬된 시계열 묶음. 모든 리스트는 trading_dates 와 동일 길이."""

    trading_dates: tuple[date, ...]
    close: tuple[float, ...]
    fx_rate: tuple[float, ...]  # KRW 자산은 전부 1.0
    dividend_per_share: tuple[float, ...]  # 해당일 주당 배당(원통화), 없으면 0.0


def _parse_year_month(value: str) -> tuple[int, int]:
    parts = value.strip().split("-")
    if len(parts) != 2:
        raise EngineError(f"기간 형식 오류(YYYY-MM): {value!r}")
    try:
        year = int(parts[0])
        month = int(parts[1])
    except ValueError as exc:
        raise EngineError(f"기간 형식 오류(YYYY-MM): {value!r}") from exc
    if not 1 <= month <= 12:
        raise EngineError(f"월 범위 오류(1~12): {value!r}")
    return year, month


def _month_start(year: int, month: int) -> date:
    return date(year, month, 1)


def _month_end(year: int, month: int) -> date:
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, last_day)


def _months_between(start: tuple[int, int], end: tuple[int, int]) -> int:
    return (end[0] - start[0]) * 12 + (end[1] - start[1]) + 1


def _iter_year_months(
    start: tuple[int, int], end: tuple[int, int]
) -> list[tuple[int, int]]:
    result: list[tuple[int, int]] = []
    year, month = start
    while (year, month) <= end:
        result.append((year, month))
        month += 1
        if month > 12:
            month = 1
            year += 1
    return result


def _to_py_date(value: object) -> date:
    ts = pd.Timestamp(value)
    return date(int(ts.year), int(ts.month), int(ts.day))


def _align_series(
    price: pd.DataFrame,
    dividend: pd.DataFrame | None,
    fx: pd.DataFrame | None,
    config: AppConfig,
    currency: AssetCurrency,
    start: date,
    end: date,
) -> _AlignedSeries:
    frame = price.copy()
    frame["Date"] = pd.to_datetime(frame["Date"]).dt.normalize()
    frame = frame.sort_values("Date").drop_duplicates("Date", keep="last")
    mask = (frame["Date"] >= pd.Timestamp(start)) & (frame["Date"] <= pd.Timestamp(end))
    frame = frame.loc[mask].reset_index(drop=True)

    if frame.empty:
        raise EngineError("지정 기간에 해당하는 주가 데이터가 없습니다.")

    trading_dates: tuple[date, ...] = tuple(
        _to_py_date(value) for value in frame["Date"].tolist()
    )
    close: tuple[float, ...] = tuple(float(value) for value in frame["Close"].tolist())

    if currency is AssetCurrency.KRW:
        fx_rate: tuple[float, ...] = tuple(1.0 for _ in trading_dates)
    else:
        fx_rate = _align_fx(frame, fx, config)

    dividend_per_share = _align_dividend(trading_dates, dividend)

    return _AlignedSeries(
        trading_dates=trading_dates,
        close=close,
        fx_rate=fx_rate,
        dividend_per_share=dividend_per_share,
    )


def _align_fx(
    price_frame: pd.DataFrame, fx: pd.DataFrame | None, config: AppConfig
) -> tuple[float, ...]:
    default_rate = config.financial.default_fx_rate
    index = pd.DatetimeIndex(price_frame["Date"])

    if fx is None or fx.empty:
        return tuple(default_rate for _ in range(len(index)))

    fx_frame = fx.copy()
    fx_frame["Date"] = pd.to_datetime(fx_frame["Date"]).dt.normalize()
    fx_frame = fx_frame.sort_values("Date").drop_duplicates("Date", keep="last")
    series = pd.Series(
        data=[float(v) for v in fx_frame["FX_Rate"].tolist()],
        index=pd.DatetimeIndex(fx_frame["Date"]),
    )
    reindexed = series.reindex(index)

    for step in config.calc.fx_fill_order:
        token = step.strip().lower()
        if token == "ffill":
            reindexed = reindexed.ffill()
        elif token == "bfill":
            reindexed = reindexed.bfill()
        elif token == "default":
            reindexed = reindexed.fillna(default_rate)

    reindexed = reindexed.fillna(default_rate)
    return tuple(float(v) for v in reindexed.tolist())


def _align_dividend(
    trading_dates: tuple[date, ...], dividend: pd.DataFrame | None
) -> tuple[float, ...]:
    per_day: list[float] = [0.0 for _ in trading_dates]
    if dividend is None or dividend.empty:
        return tuple(per_day)

    div_frame = dividend.copy()
    div_frame["Date"] = pd.to_datetime(div_frame["Date"]).dt.normalize()
    div_frame = div_frame.sort_values("Date")

    sorted_dates = list(trading_dates)
    n = len(sorted_dates)

    for _, row in div_frame.iterrows():
        div_date = _to_py_date(row["Date"])
        amount = float(row["Dividend"])
        if amount == 0.0:
            continue
        idx = _first_index_on_or_after(sorted_dates, div_date)
        if idx is None or idx >= n:
            continue
        per_day[idx] += amount

    return tuple(per_day)


def _first_index_on_or_after(sorted_dates: list[date], target: date) -> int | None:
    lo, hi = 0, len(sorted_dates)
    while lo < hi:
        mid = (lo + hi) // 2
        if sorted_dates[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    if lo >= len(sorted_dates):
        return None
    return lo


def _build_buy_schedule(
    trading_dates: tuple[date, ...],
    year_months: list[tuple[int, int]],
    buy_day: int,
) -> dict[int, bool]:
    schedule: dict[int, bool] = {}
    sorted_dates = list(trading_dates)
    if not sorted_dates:
        return schedule
    used: set[int] = set()
    first_assigned = False

    for year, month in year_months:
        last_day = calendar.monthrange(year, month)[1]
        target = date(year, month, min(buy_day, last_day))
        idx = _first_index_on_or_after(sorted_dates, target)
        if idx is None:
            continue
        if idx in used:
            continue
        used.add(idx)
        is_first = not first_assigned
        schedule[idx] = is_first
        first_assigned = True

    return schedule


@dataclass
class _RunningState:
    shares: int = 0
    leftover_cash: float = 0.0  # 자산 통화
    dividend_deposit: float = 0.0  # 자산 통화 (재투자 OFF 누적)
    after_tax_div_currency_cum: float = 0.0  # 자산 통화 누적
    principal_krw: float = 0.0  # 원금(거치+적립) 누계
    annual_div_krw: dict[int, float] = field(default_factory=dict)  # 연도별 세후 배당(KRW)


def run_simulation(
    price: pd.DataFrame,
    dividend: pd.DataFrame | None,
    fx: pd.DataFrame | None,
    config: AppConfig,
    sim: SimulationInput,
    currency: AssetCurrency,
    etf_name: str,
    expense_key: str,
    data_as_of: str | None = None,
    fetched_at: str | None = None,
) -> SimulationResult:
    """단일 자산 백테스트를 실행하고 KPI·차트 시계열을 반환한다."""
    start_ym = _parse_year_month(sim.start_year_month)
    end_ym = _parse_year_month(sim.end_year_month)
    if start_ym > end_ym:
        raise EngineError("시작 기간이 종료 기간보다 뒦습니다.")

    start = _month_start(*start_ym)
    end = _month_end(*end_ym)

    aligned = _align_series(price, dividend, fx, config, currency, start, end)

    if not aligned.trading_dates:
        raise EngineError("지정 기간에 해당하는 주가 데이터가 없습니다.")

    first_dt = aligned.trading_dates[0]
    last_dt = aligned.trading_dates[-1]
    data_start_ym = (first_dt.year, first_dt.month)
    data_end_ym = (last_dt.year, last_dt.month)
    eff_start_ym = max(start_ym, data_start_ym)
    eff_end_ym = min(end_ym, data_end_ym)
    if eff_start_ym > eff_end_ym:
        raise EngineError("선택한 기간과 데이터 가능 기간이 격치지 않습니다.")

    total_months = _months_between(eff_start_ym, eff_end_ym)
    if total_months < _MIN_MONTHS:
        raise EngineError("설정의 최소값은 3개월 입니다")

    fee_rate = config.expense.ratio_for(expense_key) / 100.0
    tax_rate = config.financial.dividend_tax_for(currency) / 100.0

    year_months = _iter_year_months(eff_start_ym, eff_end_ym)
    buy_schedule = _build_buy_schedule(aligned.trading_dates, year_months, sim.buy_day)

    state = _RunningState()
    cashflows: list[tuple[date, float]] = []

    daily_total_krw: list[float] = []
    daily_principal_krw: list[float] = []
    daily_dividend_cum_krw: list[float] = []

    n = len(aligned.trading_dates)
    for i in range(n):
        close_i = aligned.close[i]
        fx_i = aligned.fx_rate[i]
        cost_per_share = close_i * (1.0 + fee_rate)

        # (1) 배당 처리
        div_per_share = aligned.dividend_per_share[i]
        if div_per_share > 0.0 and state.shares > 0:
            gross = state.shares * div_per_share
            after_tax = gross * (1.0 - tax_rate)
            state.after_tax_div_currency_cum += after_tax
            # 연도별 배당 기록 — 지급 당일 환율로 KRW 환산 (KRW자산: fx_i=1.0)
            year = aligned.trading_dates[i].year
            state.annual_div_krw[year] = state.annual_div_krw.get(year, 0.0) + after_tax * fx_i
            if sim.dividend_reinvest:
                state.leftover_cash += after_tax
                qty = _floor_div(state.leftover_cash, cost_per_share)
                if qty > 0:
                    state.shares += qty
                    state.leftover_cash -= qty * cost_per_share
            else:
                state.dividend_deposit += after_tax

        # (2) 월 적립/거치 매수
        if i in buy_schedule:
            is_first = buy_schedule[i]
            contribution_krw = sim.monthly_krw
            if is_first:
                contribution_krw += sim.lump_sum_krw
            if contribution_krw > 0.0:
                state.principal_krw += contribution_krw
                amount_ccy = contribution_krw / fx_i
                state.leftover_cash += amount_ccy
                qty = _floor_div(state.leftover_cash, cost_per_share)
                if qty > 0:
                    state.shares += qty
                    state.leftover_cash -= qty * cost_per_share
                cashflows.append((aligned.trading_dates[i], -contribution_krw))

        # (3) 일별 총자산(원화) 기록
        stock_krw = state.shares * close_i * fx_i
        cash_krw = state.leftover_cash * fx_i
        deposit_krw = state.dividend_deposit * fx_i
        total_krw = stock_krw + cash_krw + deposit_krw
        daily_total_krw.append(total_krw)
        daily_principal_krw.append(state.principal_krw)
        daily_dividend_cum_krw.append(state.after_tax_div_currency_cum * fx_i)

    # 최종 평가
    final_fx = aligned.fx_rate[-1]
    total_value_krw = daily_total_krw[-1]
    principal_krw = state.principal_krw
    dividend_krw = state.after_tax_div_currency_cum * final_fx

    if sim.dividend_reinvest:
        capital_gain_krw = total_value_krw - principal_krw
    else:
        capital_gain_krw = total_value_krw - principal_krw - dividend_krw

    cashflows.append((aligned.trading_dates[-1], total_value_krw))
    xirr_value = compute_xirr(cashflows, config.calc)

    mdd_pct, mdd_index = _max_drawdown(daily_total_krw)

    real_return: float | None = None
    if xirr_value is not None:
        inflation = config.financial.default_inflation_rate / 100.0
        real_return = (1.0 + xirr_value) / (1.0 + inflation) - 1.0

    # 연도별 세후 배당 집계
    annual_dividend_krw = tuple(
        (yr, amt)
        for yr, amt in sorted(state.annual_div_krw.items())
    )

    kpi = KpiResult(
        etf_name=etf_name,
        months=total_months,
        principal_krw=principal_krw,
        capital_gain_krw=capital_gain_krw,
        dividend_krw=dividend_krw,
        total_value_krw=total_value_krw,
        xirr=xirr_value,
        mdd_pct=mdd_pct,
        real_annual_return=real_return,
        annual_dividend_krw=annual_dividend_krw,
        data_as_of=data_as_of,
        fetched_at=fetched_at,
    )

    chart = _build_chart_series(
        aligned.trading_dates,
        daily_principal_krw,
        daily_total_krw,
        daily_dividend_cum_krw,
        mdd_index,
    )

    return SimulationResult(kpi=kpi, chart=chart)


def _floor_div(available: float, cost_per_share: float) -> int:
    if cost_per_share <= 0.0 or available <= 0.0:
        return 0
    return int(math.floor(available / cost_per_share))


def _max_drawdown(series: list[float]) -> tuple[float, int]:
    if not series:
        return 0.0, 0
    peak = series[0]
    max_dd = 0.0
    trough_index = 0
    for i, value in enumerate(series):
        if value > peak:
            peak = value
        if peak > 0.0:
            drawdown = (peak - value) / peak
            if drawdown > max_dd:
                max_dd = drawdown
                trough_index = i
    return max_dd * 100.0, trough_index


def _build_chart_series(
    trading_dates: tuple[date, ...],
    principal: list[float],
    total: list[float],
    dividend_cum: list[float],
    mdd_index: int,
) -> ChartSeries:
    last_of_month: dict[tuple[int, int], int] = {}
    for i, d in enumerate(trading_dates):
        last_of_month[(d.year, d.month)] = i

    selected = sorted(last_of_month.values())

    dates_out: list[str] = []
    principal_out: list[float] = []
    total_out: list[float] = []
    dividend_out: list[float] = []
    for i in selected:
        d = trading_dates[i]
        dates_out.append(d.strftime("%Y-%m-%d"))
        principal_out.append(principal[i])
        total_out.append(total[i])
        dividend_out.append(dividend_cum[i])

    mdd_point: tuple[str, float] | None = None
    if 0 <= mdd_index < len(trading_dates):
        mdd_point = (
            trading_dates[mdd_index].strftime("%Y-%m-%d"),
            total[mdd_index],
        )

    return ChartSeries(
        dates=tuple(dates_out),
        principal_krw=tuple(principal_out),
        total_value_krw=tuple(total_out),
        dividend_krw=tuple(dividend_out),
        mdd_point=mdd_point,
    )


def now_timestamp() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
