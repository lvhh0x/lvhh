"""logging_setup.py — 로깅 골격 (명세 §9.7 / 체크리스트 Phase 1).

- 콘솔 + 파일(logs/app.log) 핸들러.
- 레벨은 config 의 LOG_LEVEL 로 조정 가능.
- 파일 인코딩 UTF-8 고정 (명세 §9.7.3).
"""

from __future__ import annotations

import logging
from logging import Logger

from app import paths

_LOG_FORMAT = "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"
_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

_configured = False


def _level_from_name(level_name: str) -> int:
    mapping: dict[str, int] = {
        "DEBUG": logging.DEBUG,
        "INFO": logging.INFO,
        "WARNING": logging.WARNING,
        "ERROR": logging.ERROR,
    }
    return mapping.get(level_name.strip().upper(), logging.INFO)


def setup_logging(level_name: str = "INFO") -> None:
    """루트 로거에 콘솔/파일 핸들러를 1회 구성한다.

    중복 호출 시 재설정하지 않는다 (핸들러 중복 방지).
    """
    global _configured
    root = logging.getLogger()
    level = _level_from_name(level_name)
    root.setLevel(level)

    if _configured:
        for handler in root.handlers:
            handler.setLevel(level)
        return

    formatter = logging.Formatter(_LOG_FORMAT, datefmt=_DATE_FORMAT)

    console = logging.StreamHandler()
    console.setLevel(level)
    console.setFormatter(formatter)
    root.addHandler(console)

    try:
        file_handler = logging.FileHandler(
            paths.log_file_path(), encoding="utf-8"
        )
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)
        root.addHandler(file_handler)
    except OSError:
        root.warning("로그 파일 핸들러 초기화 실패 — 콘솔 로깅만 사용합니다.")

    _configured = True


def get_logger(name: str) -> Logger:
    """모듈별 로거 헬퍼."""
    return logging.getLogger(name)
