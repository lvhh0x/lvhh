"""controller.py — 경로 A/B 중재 및 engine 호출 (명세 §1.1, §4.1, §9.5).

UI 와 engine/data_provider 사이의 오케스트레이션 계층. Qt 에 의존하지 않아
단위 테스트가 가능하다.

- 경로 A: 사용자 표준 CSV 업로드 → 헤더/날짜 검증 → 로드.
- 경로 B: 종목명 → data_provider 자동수집 → 표준 CSV 로드.
- 두 경로 모두 동일한 :class:`ResolvedAsset` 로 수렴 후 engine 실행.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from pathlib import Path

import pandas as pd

from app.csv_io import (
    read_dividend_csv,
    read_fx_csv,
    read_price_csv,
    validate_price_header,
)
from app.data_provider import detect_asset, fetch_and_cache
from app.engine import run_simulation
from app.logging_setup import get_logger
from app.models import (
    AppConfig,
    AssetCurrency,
    SimulationInput,
    SimulationResult,
)

_logger = get_logger(__name__)


class ControllerError(ValueError):
    """입력 검증/오케스트레이션 단계 오류."""


@dataclass(frozen=True)
class ResolvedAsset:
    """경로 A/B 가 수렴하는 표준 입력 묶음. engine 호출 직전 상태."""

    currency: AssetCurrency
    etf_name: str
    expense_key: str
    price: pd.DataFrame
    dividend: pd.DataFrame | None
    fx: pd.DataFrame | None
    data_as_of: str | None
    fetched_at: str | None
    data_start: str | None = None
    data_end: str | None = None


class BacktestController:
    """백테스트 오케스트레이터. 설정을 보관하고 경로별 해석/시뮬레이션을 제공한다."""

    def __init__(self, config: AppConfig) -> None:
        self._config = config

    @property
    def config(self) -> AppConfig:
        return self._config

    @staticmethod
    def price_date_range(price: pd.DataFrame) -> tuple[str | None, str | None]:
        """주가 DataFrame 의 (시작일, 마지막일) YYYY-MM-DD 를 반환한다."""
        dates = [str(v) for v in price["Date"].tolist()]
        if not dates:
            return None, None
        return min(dates), max(dates)

    def resolve_uploaded(
        self,
        price_path: Path,
        dividend_path: Path | None,
        fx_path: Path | None,
        etf_name: str,
        currency: AssetCurrency | None = None,
    ) -> ResolvedAsset:
        """업로드된 표준 CSV 를 검증·로드한다 (명세 §9.5)."""
        validate_price_header(price_path)
        price = read_price_csv(price_path)

        dividend = (
            read_dividend_csv(dividend_path)
            if dividend_path is not None and dividend_path.exists()
            else None
        )
        fx = (
            read_fx_csv(fx_path)
            if fx_path is not None and fx_path.exists()
            else None
        )

        resolved_currency = currency
        if resolved_currency is None:
            resolved_currency = (
                AssetCurrency.USD if fx is not None else AssetCurrency.KRW
            )

        if resolved_currency is AssetCurrency.KRW:
            fx = None

        name = etf_name.strip() or price_path.stem
        data_start, data_end = self.price_date_range(price)
        return ResolvedAsset(
            currency=resolved_currency,
            etf_name=name,
            expense_key=name.upper(),
            price=price,
            dividend=dividend,
            fx=fx,
            data_as_of=data_end,
            fetched_at=None,
            data_start=data_start,
            data_end=data_end,
        )

    def resolve_auto(self, raw_name: str, *, today: date | None = None) -> ResolvedAsset:
        """종목명을 판별·수집해 표준 CSV 를 로드한다 (명세 §7)."""
        identity = detect_asset(raw_name, self._config)
        _logger.info("자동수집 시작: %s → %s (%s)", raw_name, identity.symbol, identity.currency.value)
        dataset = fetch_and_cache(identity, self._config, today=today)

        price = read_price_csv(Path(dataset.price_path))
        dividend = (
            read_dividend_csv(Path(dataset.dividend_path))
            if dataset.dividend_path is not None
            else None
        )
        fx = (
            read_fx_csv(Path(dataset.fx_path))
            if dataset.fx_path is not None
            else None
        )

        data_start, data_end = self.price_date_range(price)
        return ResolvedAsset(
            currency=identity.currency,
            etf_name=identity.display_name,
            expense_key=identity.expense_key,
            price=price,
            dividend=dividend,
            fx=fx,
            data_as_of=dataset.data_as_of,
            fetched_at=dataset.fetched_at,
            data_start=data_start,
            data_end=data_end,
        )

    def simulate(self, asset: ResolvedAsset, sim: SimulationInput) -> SimulationResult:
        """해석된 자산과 사용자 입력으로 engine 을 실행한다."""
        self._validate_sim(sim)
        return run_simulation(
            price=asset.price,
            dividend=asset.dividend,
            fx=asset.fx,
            config=self._config,
            sim=sim,
            currency=asset.currency,
            etf_name=asset.etf_name,
            expense_key=asset.expense_key,
            data_as_of=asset.data_as_of,
            fetched_at=asset.fetched_at,
        )

    @staticmethod
    def _validate_sim(sim: SimulationInput) -> None:
        if sim.lump_sum_krw < 0.0 or sim.monthly_krw < 0.0:
            raise ControllerError("투자 금액은 음수가 될 수 없습니다.")
        if sim.lump_sum_krw == 0.0 and sim.monthly_krw == 0.0:
            raise ControllerError("거치금 또는 월 적립금 중 하나는 0보다 커야 합니다.")
        if not 1 <= sim.buy_day <= 31:
            raise ControllerError("매수 희망일은 1~31 사이여야 합니다.")
