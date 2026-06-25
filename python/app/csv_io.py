"""csv_io.py — 표준 CSV 입출력 유틸 (명세 §7.4 / §10.5).

고정 스키마:
- price.csv:    Date, Close
- dividend.csv: Date, Dividend
- fx.csv:       Date, FX_Rate

규칙: 헤더 1행, 데이터 2행부터, 날짜 ``YYYY-MM-DD``, 인코딩 UTF-8, 컨럼명 영문 고정.
모든 시계열은 naive ``YYYY-MM-DD`` 로 정규화하여 저장/로드한다.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

FILE_ENCODING = "utf-8"

PRICE_COLUMNS = ("Date", "Close")
DIVIDEND_COLUMNS = ("Date", "Dividend")
FX_COLUMNS = ("Date", "FX_Rate")


class StandardCsvError(ValueError):
    """표준 CSV 스키마 위반 시 발생."""


def _normalize_dates(series: "pd.Series[object]") -> "pd.Series[object]":
    """'날짜 콜럼을 tz 제거·자정 정규화 후 ``YYYY-MM-DD`` 문자열로 변환 (§10.5)."""
    parsed = pd.to_datetime(series, errors="coerce")
    if parsed.isna().any():
        raise StandardCsvError("날짜 파싱 실패 — YYYY-MM-DD 형식이어야 합니다.")
    if parsed.dt.tz is not None:
        parsed = parsed.dt.tz_localize(None)
    parsed = parsed.dt.normalize()
    return parsed.dt.strftime("%Y-%m-%d")


def _read_two_column(path: Path, columns: tuple[str, str], value_name: str) -> pd.DataFrame:
    frame = pd.read_csv(path, encoding=FILE_ENCODING)
    missing = [col for col in columns if col not in frame.columns]
    if missing:
        raise StandardCsvError(
            f"표준 포맷과 다릅니다. 필요한 콜럼: {', '.join(columns)} (누락: {', '.join(missing)})"
        )
    frame = frame[list(columns)].copy()
    frame["Date"] = _normalize_dates(frame["Date"])
    frame[value_name] = pd.to_numeric(frame[value_name], errors="coerce")
    if frame[value_name].isna().any():
        raise StandardCsvError(f"'{value_name}' 콜럼에 숫자가 아닌 값이 있습니다.")
    frame = frame.dropna().sort_values("Date").reset_index(drop=True)
    return frame


def read_price_csv(path: Path) -> pd.DataFrame:
    """price.csv 로드 → 콜럼 Date, Close. 행 없음/빈 파일은 오류."""
    frame = _read_two_column(path, PRICE_COLUMNS, "Close")
    if frame.empty:
        raise StandardCsvError("주가 CSV 에 데이터 행이 없습니다.")
    return frame


def read_dividend_csv(path: Path) -> pd.DataFrame:
    """dividend.csv 로드 → 콜럼 Date, Dividend."""
    return _read_two_column(path, DIVIDEND_COLUMNS, "Dividend")


def read_fx_csv(path: Path) -> pd.DataFrame:
    """fx.csv 로드 → 콜럼 Date, FX_Rate."""
    return _read_two_column(path, FX_COLUMNS, "FX_Rate")


def write_standard_csv(frame: pd.DataFrame, path: Path) -> None:
    """표준 CSV 저장 (UTF-8, 인덱스 미포함). 날짜는 이미 문자열이라고 가정한다."""
    path.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(path, index=False, encoding=FILE_ENCODING)


def validate_price_header(path: Path) -> None:
    """경로 A 업로드 시 1차 검증 (명세 §9.5): 헤더·날짜 포맷만 빠르게 확인."""
    read_price_csv(path)


# 템플릿 (경로 A '템플릿 다운로드' 기능, 명세 §9.5) ----------------------------

PRICE_TEMPLATE = "Date,Close\n2020-01-02,100.0\n2020-01-03,101.5\n"
DIVIDEND_TEMPLATE = "Date,Dividend\n2020-03-15,0.5\n"
FX_TEMPLATE = "Date,FX_Rate\n2020-01-02,1180.0\n2020-01-03,1182.5\n"


def write_template(kind: str, path: Path) -> None:
    """표준 CSV 템플릿을 저장한다. kind: 'price' | 'dividend' | 'fx'."""
    mapping = {
        "price": PRICE_TEMPLATE,
        "dividend": DIVIDEND_TEMPLATE,
        "fx": FX_TEMPLATE,
    }
    if kind not in mapping:
        raise StandardCsvError(f"알 수 없는 템플릿 종류: {kind!r}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(mapping[kind], encoding=FILE_ENCODING)
