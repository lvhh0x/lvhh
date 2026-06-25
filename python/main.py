"""FastAPI 앱 진입점."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import backtest, health, stocks
from app.config_loader import load_config
from app.logging_setup import setup_logging

# 앱 시작 시 설정 로드 & 로깅 초기화
_config = load_config()
setup_logging(_config.system.log_level)

app = FastAPI(title="ETF Backtester API", version="10.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 Vercel 도메인으로 제한 권장
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(stocks.router)
app.include_router(backtest.router)
