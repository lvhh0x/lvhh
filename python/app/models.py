"""models.py — 공통 도메인 타입 정의 (SSOT 명세 §9.6, 체크리스트 Phase 1).

이 모듈은 프로젝트 전역에서 공유하는 불변(frozen) 데이터 구조를 정의한다.
``typing.Any`` 는 사용하지 않으며 모든 필드에 명시적 타입을 부여한다.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Mapping


class AssetCurrency(Enum):
    """'자산의 거래 통화 (명세 §7.2 / §9.2)."""

    KRW = "KRW"
    USD = "USD"


class PriceAdjustPolicy(Enum):
    """주가 조정 정윗 (명세 §10.1). 분할조정 O / 배당조정 X 고정."""

    SPLIT_ONLY = "split_only"
    NONE = "none"


@dataclass(frozen=True)
class FinancialDefaults:
    """[FINANCIAL_DEFAULT] 섹션 (명세 §3)."""

    default_fx_rate: float
    default_dividend_yield: float
    default_dividend_growth: float
    default_dividend_tax: float
    default_inflation_rate: float
    krw_dividend_tax: float
    usd_dividend_tax: float

    def dividend_tax_for(self, currency: AssetCurrency) -> float:
        if currency is AssetCurrency.KRW:
            return self.krw_dividend_tax
        return self.usd_dividend_tax


@dataclass(frozen=True)
class ExpenseRatios:
    """[EXPENSE_RATIO] 섹션 (명세 §3). 단위 %."""

    ratios: Mapping[str, float]
    default_other: float

    def ratio_for(self, ticker: str) -> float:
        return self.ratios.get(ticker.upper(), self.default_other)


@dataclass(frozen=True)
class UiTheme:
    """[UI_THEME] 섹션 (명세 §3)."""

    background_color: str
    surface_color: str
    accent_blue: str
    accent_green: str
    text_main: str
    text_muted: str


@dataclass(frozen=True)
class DataSourceConfig:
    """[DATA_SOURCE] 섹션 (명세 §3 / §7.3)."""

    krw_price_source: str
    krw_dividend_source: str
    usd_price_source: str
    usd_dividend_source: str
    fx_source: str
    fx_ticker: str


@dataclass(frozen=True)
class DataFetchConfig:
    """[DATA_FETCH] 섹션 (명세 §3 / §10.1 / B.5)."""

    price_adjust_policy: PriceAdjustPolicy
    yf_auto_adjust: bool
    krx_adjusted: bool
    fetch_retry: int
    fetch_backoff_sec: float


@dataclass(frozen=True)
class CalcConfig:
    """[CALC] 섹션 (명세 §3 / §10.2 / §10.3)."""

    xirr_daycount: str
    xirr_newton_guess: float
    xirr_max_iter: int
    xirr_tolerance: float
    xirr_bisect_low: float
    xirr_bisect_high: float
    fx_fill_order: tuple[str, ...]


@dataclass(frozen=True)
class SystemConfig:
    """[SYSTEM] 섹션 (명세 §3 / §9.7)."""

    log_level: str
    file_encoding: str


@dataclass(frozen=True)
class AppConfig:
    """전체 설정 집합. config_loader 가 생성한다."""

    financial: FinancialDefaults
    expense: ExpenseRatios
    theme: UiTheme
    ticker_map: Mapping[str, str]
    data_source: DataSourceConfig
    data_fetch: DataFetchConfig
    calc: CalcConfig
    system: SystemConfig


@dataclass(frozen=True)
class SimulationInput:
    """사용자 입력 변수 (명세 §4.2). 모든 금액 단위는 원화(KRW)."""

    start_year_month: str  # "YYYY-MM"
    end_year_month: str  # "YYYY-MM"
    lump_sum_krw: float
    monthly_krw: float
    buy_day: int  # 1~31, 기본 26
    dividend_reinvest: bool


@dataclass(frozen=True)
class KpiResult:
    """KPI 매트릭스 (명세 §6.2). 금액 단위는 원화(KRW), 비율은 소수(0.1 = 10%).

    xirr / real_annual_return 는 계산 실패 시 None (KPI 셀 '계산 불가').
    annual_dividend_krw 는 (연도, 세후_KRW) 튜플 시퀀스.
    """

    etf_name: str
    months: int
    principal_krw: float
    capital_gain_krw: float
    dividend_krw: float
    total_value_krw: float
    xirr: float | None
    mdd_pct: float
    real_annual_return: float | None
    annual_dividend_krw: tuple[tuple[int, float], ...]  # 연도별 세후 배당(원화)
    data_as_of: str | None
    fetched_at: str | None


@dataclass(frozen=True)
class ChartSeries:
    """트리오 라인 차트용 시계열 (명세 §6.1)."""

    dates: tuple[str, ...]
    principal_krw: tuple[float, ...]
    total_value_krw: tuple[float, ...]
    dividend_krw: tuple[float, ...]
    mdd_point: tuple[str, float] | None = None


@dataclass(frozen=True)
class SimulationResult:
    """engine 의 최종 산출물: KPI + 차트 시계열."""

    kpi: KpiResult
    chart: ChartSeries


@dataclass(frozen=True)
class FetchedDataset:
    """data_provider 가 표준 CSV 저장 후 반환하는 경로 묶음 (명세 §7.4 / §7.5)."""

    symbol: str
    currency: AssetCurrency
    price_path: str
    dividend_path: str | None
    fx_path: str | None
    data_as_of: str | None
    fetched_at: str | None


@dataclass(frozen=True)
class StandardFrames:
    """표준 CSV 3종을 메모리로 로드한 컨테이너."""

    currency: AssetCurrency
    price_rows: int
    has_dividend: bool
    has_fx: bool = field(default=False)
