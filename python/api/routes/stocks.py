"""stocks 데이터 가능 기간 조회 엔드포인트."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app import paths
from app.config_loader import load_config
from app.controller import BacktestController
from app.csv_io import read_price_csv
from app.data_provider import detect_asset
from api.schemas import StockRangeResponse

router = APIRouter()


@router.get("/stocks/{symbol}/range", response_model=StockRangeResponse)
async def get_stock_range(symbol: str) -> StockRangeResponse:
    """종목의 데이터 가능 기간을 반환한다. 캐시 있으면 재사용, 없으면 수집."""
    config = load_config()
    try:
        identity = detect_asset(symbol, config)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    cache_dir = paths.symbol_cache_dir(identity.symbol)
    price_path = cache_dir / "price.csv"

    if price_path.exists():
        try:
            price = read_price_csv(price_path)
            start, end = BacktestController.price_date_range(price)
            return StockRangeResponse(symbol=identity.symbol, start=start, end=end)
        except Exception:
            pass  # 캐시 깨진 경우 재수집

    try:
        controller = BacktestController(config)
        asset = controller.resolve_auto(symbol)
        return StockRangeResponse(
            symbol=identity.symbol,
            start=asset.data_start,
            end=asset.data_end,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
