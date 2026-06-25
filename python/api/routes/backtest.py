"""backtest 실행 엔드포인트."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.config_loader import load_config
from app.controller import BacktestController, ControllerError
from app.data_provider import DataProviderError
from app.engine import EngineError
from app.models import SimulationInput
from api.schemas import BacktestRequest, BacktestResponse

router = APIRouter()


@router.post("/backtest", response_model=BacktestResponse)
async def run_backtest(req: BacktestRequest) -> BacktestResponse:
    """단일 자산 백테스트를 실행한다."""
    config = load_config()
    controller = BacktestController(config)

    try:
        asset = controller.resolve_auto(req.symbol)
    except (DataProviderError, Exception) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    sim = SimulationInput(
        start_year_month=req.start_ym,
        end_year_month=req.end_ym,
        lump_sum_krw=req.lump_sum_krw,
        monthly_krw=req.monthly_krw,
        buy_day=req.buy_day,
        dividend_reinvest=req.dividend_reinvest,
    )

    try:
        result = controller.simulate(asset, sim)
    except (EngineError, ControllerError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"연산 오류: {exc}") from exc

    return BacktestResponse.from_result(result)
