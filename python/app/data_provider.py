"""data_provider.py — 외부 데이터 격리벽 (명세 §7, §10.1, §14).

이 모듈만이 외부 세계(pykrx·yfinance·인터넷)의 혼돈을 안다.
engine·controller 등은 오직 표준 CSV 스키마(§7.4)만 신뢰하며 데이터 출처를 모른다.

외부 라이브러리는 함수 내부에서 지연 임포트하여 미설치 환경에서도
모듈 임포트·타입체크가 가능하게 한다.
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Callable, TypeVar

import pandas as pd

from app import paths
from app.csv_io import write_standard_csv
from app.logging_setup import get_logger
from app.models import AppConfig, AssetCurrency, FetchedDataset

_logger = get_logger(__name__)

_SIX_DIGITS = re.compile(r"^\d{6}$")
_ALPHA = re.compile(r"^[A-Z]+$")
_HISTORY_START = "1990-01-01"

T = TypeVar("T")


class DataProviderError(RuntimeError):
    """수집 실패 또는 판별 불가 시 발생. message 는 사용자 안내문."""


class UnmappedKoreanNameError(DataProviderError):
    """미등록 한글 종목명 — TICKER_MAP 추가 안내 후 중단 (§7.2-4)."""


@dataclass(frozen=True)
class AssetIdentity:
    """판별 결과. symbol 은 캐시 디렉토리·수집 키, expense_key 는 수수료율 조회 키."""

    raw_input: str
    symbol: str
    currency: AssetCurrency
    display_name: str
    expense_key: str


def detect_asset(raw_name: str, config: AppConfig) -> AssetIdentity:
    """입력 정규화(공백 제거·대문자화) 후 우선순위에 따라 자산을 판별한다."""
    normalized = raw_name.strip().upper()
    if not normalized:
        raise DataProviderError("종목명이 비어 있습니다.")

    for name, code in config.ticker_map.items():
        if name.strip().upper() == normalized:
            return AssetIdentity(
                raw_input=raw_name,
                symbol=code,
                currency=AssetCurrency.KRW,
                display_name=name,
                expense_key=code,
            )

    if _SIX_DIGITS.match(normalized):
        return AssetIdentity(
            raw_input=raw_name,
            symbol=normalized,
            currency=AssetCurrency.KRW,
            display_name=normalized,
            expense_key=normalized,
        )

    if _ALPHA.match(normalized):
        return AssetIdentity(
            raw_input=raw_name,
            symbol=normalized,
            currency=AssetCurrency.USD,
            display_name=normalized,
            expense_key=normalized,
        )

    raise UnmappedKoreanNameError(
        f"'{raw_name}' 종목을 인식하지 못했습니다. "
        "config.ini 의 [TICKER_MAP] 에 '종목명 = 6자리코드' 를 추가한 뒤 다시 시도하세요."
    )


def _with_retry(
    operation: Callable[[], T],
    *,
    retry: int,
    backoff_sec: float,
    label: str,
) -> T:
    """일시 실패를 지수 백오프로 재시도한다."""
    attempt = 0
    delay = backoff_sec
    while True:
        try:
            return operation()
        except Exception as exc:  # noqa: BLE001
            attempt += 1
            if attempt > retry:
                _logger.warning("%s 최종 실패(%d회 시도): %s", label, attempt, exc)
                raise
            _logger.info("%s 실패 — %.1fs 후 재시도(%d/%d): %s", label, delay, attempt, retry, exc)
            time.sleep(delay)
            delay *= 2.0


def _today_str(today: date | None) -> str:
    return (today or date.today()).strftime("%Y-%m-%d")


def _fetch_krw_price(symbol: str, end: str, config: AppConfig) -> pd.DataFrame:
    """pykrx 로 분할조정 O·배당조정 X 종가를 수집해 표준 price 프레임으로 변환."""
    from pykrx import stock  # 지연 임포트

    start_compact = _HISTORY_START.replace("-", "")
    end_compact = end.replace("-", "")

    def _call() -> pd.DataFrame:
        return stock.get_market_ohlcv(
            start_compact, end_compact, symbol, adjusted=config.data_fetch.krx_adjusted
        )

    ohlcv = _with_retry(
        _call,
        retry=config.data_fetch.fetch_retry,
        backoff_sec=config.data_fetch.fetch_backoff_sec,
        label=f"KRW 주가 수집({symbol})",
    )
    frame = ohlcv.reset_index()
    date_col = "날짜" if "날짜" in frame.columns else frame.columns[0]
    close_col = "종가" if "종가" in frame.columns else "Close"
    out = pd.DataFrame(
        {
            "Date": _normalize_naive_dates(frame[date_col]),
            "Close": [float(v) for v in frame[close_col].tolist()],
        }
    )
    return out[out["Close"] > 0.0].reset_index(drop=True)


def _fetch_krw_dividend(symbol: str, config: AppConfig) -> pd.DataFrame | None:
    """pykrx 배당 수집(베스트 에포트). 실패/미지원 시 None."""
    try:
        from pykrx import stock  # 지연 임포트

        def _call() -> pd.DataFrame:
            return stock.get_market_fundamental(
                _HISTORY_START.replace("-", ""),
                _today_str(None).replace("-", ""),
                symbol,
            )

        fundamental = _with_retry(
            _call,
            retry=config.data_fetch.fetch_retry,
            backoff_sec=config.data_fetch.fetch_backoff_sec,
            label=f"KRW 배당 수집({symbol})",
        )
        if fundamental is None or "DPS" not in fundamental.columns:
            return None
        frame = fundamental.reset_index()
        date_col = frame.columns[0]
        dps = [float(v) for v in frame["DPS"].tolist()]
        dates = _normalize_naive_dates(frame[date_col])
        out = pd.DataFrame({"Date": dates, "Dividend": dps})
        out = out[out["Dividend"] > 0.0].reset_index(drop=True)
        if out.empty:
            return None
        return out
    except Exception as exc:  # noqa: BLE001
        _logger.info("KRW 배당 미수집(%s) — 無 처리: %s", symbol, exc)
        return None


def _fetch_usd_history(symbol: str, config: AppConfig) -> pd.DataFrame:
    """yfinance 원시 history(auto_adjust=False, actions=True) 수집."""
    import yfinance as yf  # 지연 임포트

    def _call() -> pd.DataFrame:
        ticker = yf.Ticker(symbol)
        return ticker.history(
            start=_HISTORY_START,
            auto_adjust=config.data_fetch.yf_auto_adjust,
            actions=True,
        )

    hist = _with_retry(
        _call,
        retry=config.data_fetch.fetch_retry,
        backoff_sec=config.data_fetch.fetch_backoff_sec,
        label=f"USD 주가 수집({symbol})",
    )
    if hist is None or len(hist) == 0:
        raise DataProviderError(f"'{symbol}' 주가를 수집하지 못했습니다.")
    return hist.reset_index()


def _extract_adjusted_close(hist: pd.DataFrame) -> pd.DataFrame:
    """분할조정 O·배당조정 X 종가를 추출한다 (§10.1)."""
    date_col = "Date" if "Date" in hist.columns else hist.columns[0]
    closes = [float(v) for v in hist["Close"].tolist()]
    dates = _normalize_naive_dates(hist[date_col])
    out = pd.DataFrame({"Date": dates, "Close": closes})
    return out[out["Close"] > 0.0].reset_index(drop=True)


def _extract_usd_dividend(hist: pd.DataFrame) -> pd.DataFrame | None:
    """yfinance Dividends 콜럼에서 주당 배당(배당락일)을 추출."""
    if "Dividends" not in hist.columns:
        return None
    date_col = "Date" if "Date" in hist.columns else hist.columns[0]
    dates = _normalize_naive_dates(hist[date_col])
    divs = [float(v) for v in hist["Dividends"].tolist()]
    out = pd.DataFrame({"Date": dates, "Dividend": divs})
    out = out[out["Dividend"] > 0.0].reset_index(drop=True)
    if out.empty:
        return None
    return out


def _fetch_fx(config: AppConfig) -> pd.DataFrame | None:
    """환율(KRW=X) 수집. 실패 시 None."""
    try:
        import yfinance as yf  # 지연 임포트

        def _call() -> pd.DataFrame:
            ticker = yf.Ticker(config.data_source.fx_ticker)
            return ticker.history(start=_HISTORY_START, auto_adjust=False)

        hist = _with_retry(
            _call,
            retry=config.data_fetch.fetch_retry,
            backoff_sec=config.data_fetch.fetch_backoff_sec,
            label="환율 수집(KRW=X)",
        )
        if hist is None or len(hist) == 0:
            return None
        frame = hist.reset_index()
        date_col = "Date" if "Date" in frame.columns else frame.columns[0]
        out = pd.DataFrame(
            {
                "Date": _normalize_naive_dates(frame[date_col]),
                "FX_Rate": [float(v) for v in frame["Close"].tolist()],
            }
        )
        out = out[out["FX_Rate"] > 0.0].reset_index(drop=True)
        if out.empty:
            return None
        return out
    except Exception as exc:  # noqa: BLE001
        _logger.info("환율 미수집 — DEFAULT_FX_RATE 사용: %s", exc)
        return None


def _verify_split_only(price: pd.DataFrame, dividend: pd.DataFrame | None) -> None:
    """배당조정 혼입 점검 (§10.1)."""
    if dividend is None or dividend.empty:
        return
    price_map: dict[str, float] = {
        str(d): float(c)
        for d, c in zip(price["Date"].tolist(), price["Close"].tolist())
    }
    ordered_dates = list(price_map.keys())
    index_of = {d: i for i, d in enumerate(ordered_dates)}

    reflected = 0
    checked = 0
    for d, amount in zip(dividend["Date"].tolist(), dividend["Dividend"].tolist()):
        key = str(d)
        if key not in index_of:
            continue
        idx = index_of[key]
        if idx == 0:
            continue
        amount_f = float(amount)
        if amount_f <= 0.0:
            continue
        prev_close = price_map[ordered_dates[idx - 1]]
        cur_close = price_map[key]
        drop = prev_close - cur_close
        checked += 1
        if drop >= 0.5 * amount_f:
            reflected += 1

    if checked >= 5 and reflected < checked * 0.3:
        _logger.warning(
            "배당락일 낙폭이 배당을 거의 반영하지 않습니다(%d/%d). "
            "주가에 배당조정이 혼입되었을 수 있습니다(§10.1).",
            reflected,
            checked,
        )


def _normalize_naive_dates(series: "pd.Series[object]") -> list[str]:
    """tz 제거·자정 정규화 후 YYYY-MM-DD 문자열 리스트로 변환."""
    parsed = pd.to_datetime(series, errors="coerce")
    if parsed.dt.tz is not None:
        parsed = parsed.dt.tz_localize(None)
    parsed = parsed.dt.normalize()
    return [str(v) for v in parsed.dt.strftime("%Y-%m-%d").tolist()]


def _overwrite_or_delete(
    frame: pd.DataFrame | None, target: Path
) -> str | None:
    """프레임이 있으면 전체 덮어쓰기, 없으면 기존 파일 삭제."""
    if frame is not None and not frame.empty:
        write_standard_csv(frame, target)
        return str(target)
    if target.exists():
        target.unlink()
    return None


def fetch_and_cache(
    identity: AssetIdentity, config: AppConfig, *, today: date | None = None
) -> FetchedDataset:
    """판별된 자산의 표준 CSV 3종을 수집·저장하고 경로 묶음을 반환한다."""
    cache_dir = paths.symbol_cache_dir(identity.symbol)
    price_path = cache_dir / "price.csv"
    dividend_path = cache_dir / "dividend.csv"
    fx_path = cache_dir / "fx.csv"
    end = _today_str(today)

    if identity.currency is AssetCurrency.KRW:
        price = _fetch_krw_price(identity.symbol, end, config)
        dividend = _fetch_krw_dividend(identity.symbol, config)
        fx: pd.DataFrame | None = None
    else:
        hist = _fetch_usd_history(identity.symbol, config)
        price = _extract_adjusted_close(hist)
        dividend = _extract_usd_dividend(hist)
        fx = _fetch_fx(config)

    if price.empty:
        raise DataProviderError(
            "자동 수집 실패. 수동으로 주가 CSV 를 업로드하세요(경로 A)."
        )

    _verify_split_only(price, dividend)

    written_price = _overwrite_or_delete(price, price_path)
    written_dividend = _overwrite_or_delete(dividend, dividend_path)
    written_fx = _overwrite_or_delete(fx, fx_path)

    data_as_of = str(price["Date"].tolist()[-1]) if not price.empty else None
    fetched_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if written_price is None:
        raise DataProviderError("주가 표준 CSV 생성에 실패했습니다.")

    return FetchedDataset(
        symbol=identity.symbol,
        currency=identity.currency,
        price_path=written_price,
        dividend_path=written_dividend,
        fx_path=written_fx,
        data_as_of=data_as_of,
        fetched_at=fetched_at,
    )
