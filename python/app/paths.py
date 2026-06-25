"""paths.py — 런타임 경로 결정 모듈 (명세 §9.7.1).

코드(app/)와 런타임 파일(config·data_cache·logs)을 분리한다.
``sys.frozen`` 감지로 개발 환경과 PyInstaller exe 환경을 분기한다.

- 개발 중: 저장소 루트(이 파일의 상위의 상위)를 런타임 루트로 사용.
- exe 실행 중: exe 가 위치한 폴더를 런타임 루트로 사용.
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

CONFIG_FILENAME = "config.ini"
CONFIG_DEFAULT_FILENAME = "config.ini.default"
DATA_CACHE_DIRNAME = "data_cache"
LOGS_DIRNAME = "logs"
LOG_FILENAME = "app.log"


def is_frozen() -> bool:
    """PyInstaller 등으로 동결(frozen)되어 실행 중인지 여부."""
    return bool(getattr(sys, "frozen", False))


def runtime_root() -> Path:
    """런타임 루트 디렉토리 (명세 §9.7.1).

    - frozen: ``sys.executable`` 이 위치한 폴더.
    - 개발: 저장소 루트 (``app/`` 의 부모).
    FastAPI 서버에서는 python/ 폴더가 런타임 루트가 된다.
    """
    if is_frozen():
        return Path(sys.executable).resolve().parent
    # python/app/paths.py -> python/app -> python/
    return Path(__file__).resolve().parent.parent


def _bundled_default_config() -> Path:
    """config.ini.default 위치를 추정한다."""
    candidates: list[Path] = []
    if is_frozen():
        meipass = getattr(sys, "_MEIPASS", None)
        if isinstance(meipass, str):
            candidates.append(Path(meipass) / CONFIG_DEFAULT_FILENAME)
            candidates.append(Path(meipass) / "config" / CONFIG_DEFAULT_FILENAME)
        candidates.append(runtime_root() / CONFIG_DEFAULT_FILENAME)
    else:
        candidates.append(runtime_root() / "config" / CONFIG_DEFAULT_FILENAME)
        candidates.append(runtime_root() / CONFIG_DEFAULT_FILENAME)
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return candidates[0]


def config_path() -> Path:
    """런타임 config.ini 경로. 없으면 default 를 복사 생성 시도 (명세 §9.7.1)."""
    target = runtime_root() / CONFIG_FILENAME
    if not target.exists():
        default = _bundled_default_config()
        if default.is_file():
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(default, target)
    return target


def data_cache_root() -> Path:
    """data_cache 루트. 없으면 생성 (명세 §7.5 / §12.2)."""
    root = runtime_root() / DATA_CACHE_DIRNAME
    root.mkdir(parents=True, exist_ok=True)
    return root


def symbol_cache_dir(symbol: str) -> Path:
    """특정 종목코드/티커의 캐시 디렉토리 (명세 §7.5). 없으면 생성."""
    target = data_cache_root() / symbol
    target.mkdir(parents=True, exist_ok=True)
    return target


def logs_dir() -> Path:
    """logs 디렉토리. 없으면 생성 (명세 §12.2)."""
    target = runtime_root() / LOGS_DIRNAME
    target.mkdir(parents=True, exist_ok=True)
    return target


def log_file_path() -> Path:
    """logs/app.log 경로."""
    return logs_dir() / LOG_FILENAME
