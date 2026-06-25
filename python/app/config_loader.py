"""config_loader.py — config.ini 파싱 후 AppConfig 반환.

configparser 로 섹션별 값을 읽어 frozen dataclass 로 조립한다.
없는 키는 모두 하드코딩 기본값으로 폴백한다.
"""
from __future__ import annotations

import configparser
from pathlib import Path

from app import paths
from app.models import (
    AppConfig,
    CalcConfig,
    DataFetchConfig,
    DataSourceConfig,
    ExpenseRatios,
    FinancialDefaults,
    PriceAdjustPolicy,
    SystemConfig,
    UiTheme,
)

_cached_config: AppConfig | None = None


def load_config(path: Path | None = None) -> AppConfig:
    """config.ini 를 파싱해 AppConfig 를 반환한다.

    path 미지정 시 paths.config_path() 사용.
    동일 path(None) 로 두 번 호출하면 캐시를 반환한다.
    """
    global _cached_config
    if _cached_config is not None and path is None:
        return _cached_config

    cfg_path = path or paths.config_path()
    parser = configparser.ConfigParser(interpolation=None)
    parser.read(cfg_path, encoding="utf-8")

    def _get(section: str, key: str, fallback: str = "") -> str:
        return parser.get(section, key, fallback=fallback).strip()

    def _getfloat(section: str, key: str, fallback: float = 0.0) -> float:
        try:
            return float(_get(section, key, str(fallback)))
        except ValueError:
            return fallback

    def _getint(section: str, key: str, fallback: int = 0) -> int:
        try:
            return int(_get(section, key, str(fallback)))
        except ValueError:
            return fallback

    def _getbool(section: str, key: str, fallback: bool = False) -> bool:
        val = _get(section, key, str(fallback)).lower()
        return val in ("true", "1", "yes", "on")

    # [FINANCIAL_DEFAULT]
    financial = FinancialDefaults(
        default_fx_rate=_getfloat("FINANCIAL_DEFAULT", "DEFAULT_FX_RATE", 1350.0),
        default_dividend_yield=_getfloat("FINANCIAL_DEFAULT", "DEFAULT_DIVIDEND_YIELD", 0.0),
        default_dividend_growth=_getfloat("FINANCIAL_DEFAULT", "DEFAULT_DIVIDEND_GROWTH", 0.0),
        default_dividend_tax=_getfloat("FINANCIAL_DEFAULT", "DEFAULT_DIVIDEND_TAX", 15.4),
        default_inflation_rate=_getfloat("FINANCIAL_DEFAULT", "DEFAULT_INFLATION_RATE", 2.5),
        krw_dividend_tax=_getfloat("FINANCIAL_DEFAULT", "KRW_DIVIDEND_TAX", 15.4),
        usd_dividend_tax=_getfloat("FINANCIAL_DEFAULT", "USD_DIVIDEND_TAX", 15.0),
    )

    # [EXPENSE_RATIO]
    expense_items = dict(parser.items("EXPENSE_RATIO")) if parser.has_section("EXPENSE_RATIO") else {}
    default_other = float(expense_items.get("default_other", "0.5"))
    ratios: dict[str, float] = {}
    for k, v in expense_items.items():
        if k.upper() != "DEFAULT_OTHER":
            try:
                ratios[k.upper()] = float(v)
            except ValueError:
                pass
    expense = ExpenseRatios(ratios=ratios, default_other=default_other)

    # [UI_THEME]
    theme = UiTheme(
        background_color=_get("UI_THEME", "BACKGROUND_COLOR", "#14110E"),
        surface_color=_get("UI_THEME", "SURFACE_COLOR", "#1a1510"),
        accent_blue=_get("UI_THEME", "ACCENT_BLUE", "#5b8def"),
        accent_green=_get("UI_THEME", "ACCENT_GREEN", "#8FBFA0"),
        text_main=_get("UI_THEME", "TEXT_MAIN", "#E8E0D2"),
        text_muted=_get("UI_THEME", "TEXT_MUTED", "#9C9486"),
    )

    # [TICKER_MAP]
    ticker_map: dict[str, str] = {}
    if parser.has_section("TICKER_MAP"):
        for name, code in parser.items("TICKER_MAP"):
            ticker_map[name.strip()] = code.strip()

    # [DATA_SOURCE]
    data_source = DataSourceConfig(
        krw_price_source=_get("DATA_SOURCE", "KRW_PRICE_SOURCE", "pykrx"),
        krw_dividend_source=_get("DATA_SOURCE", "KRW_DIVIDEND_SOURCE", "pykrx"),
        usd_price_source=_get("DATA_SOURCE", "USD_PRICE_SOURCE", "yfinance"),
        usd_dividend_source=_get("DATA_SOURCE", "USD_DIVIDEND_SOURCE", "yfinance"),
        fx_source=_get("DATA_SOURCE", "FX_SOURCE", "yfinance"),
        fx_ticker=_get("DATA_SOURCE", "FX_TICKER", "KRW=X"),
    )

    # [DATA_FETCH]
    policy_str = _get("DATA_FETCH", "PRICE_ADJUST_POLICY", "split_only").lower()
    try:
        price_adjust = PriceAdjustPolicy(policy_str)
    except ValueError:
        price_adjust = PriceAdjustPolicy.SPLIT_ONLY

    data_fetch = DataFetchConfig(
        price_adjust_policy=price_adjust,
        yf_auto_adjust=_getbool("DATA_FETCH", "YF_AUTO_ADJUST", False),
        krx_adjusted=_getbool("DATA_FETCH", "KRX_ADJUSTED", True),
        fetch_retry=_getint("DATA_FETCH", "FETCH_RETRY", 3),
        fetch_backoff_sec=_getfloat("DATA_FETCH", "FETCH_BACKOFF_SEC", 1.5),
    )

    # [CALC]
    fx_fill_raw = _get("CALC", "FX_FILL_ORDER", "ffill,bfill,default")
    fx_fill_order = tuple(s.strip() for s in fx_fill_raw.split(",") if s.strip())

    calc = CalcConfig(
        xirr_daycount=_get("CALC", "XIRR_DAYCOUNT", "ACT365"),
        xirr_newton_guess=_getfloat("CALC", "XIRR_NEWTON_GUESS", 0.1),
        xirr_max_iter=_getint("CALC", "XIRR_MAX_ITER", 1000),
        xirr_tolerance=_getfloat("CALC", "XIRR_TOLERANCE", 1e-6),
        xirr_bisect_low=_getfloat("CALC", "XIRR_BISECT_LOW", -0.999),
        xirr_bisect_high=_getfloat("CALC", "XIRR_BISECT_HIGH", 100.0),
        fx_fill_order=fx_fill_order,
    )

    # [SYSTEM]
    system = SystemConfig(
        log_level=_get("SYSTEM", "LOG_LEVEL", "INFO"),
        file_encoding=_get("SYSTEM", "FILE_ENCODING", "utf-8"),
    )

    result = AppConfig(
        financial=financial,
        expense=expense,
        theme=theme,
        ticker_map=ticker_map,
        data_source=data_source,
        data_fetch=data_fetch,
        calc=calc,
        system=system,
    )
    if path is None:
        _cached_config = result
    return result
