"""XIRR (money-weighted IRR) 자체 구현 (명세 §10.2).

- 일수: Actual/365.
- 방정식: ``Σ CF_i / (1+r)^((d_i - d_0)/365) = 0``.
- 수렴: Newton(초기 guess, 최대 반복, 오스) → 실패 시 이분법[low, high].
- 근이 없으면 ``None`` 반환 (KPI 셀 '계산 불가').
- numpy 만 사용하여 결정론·의존성 최소화.
"""

from __future__ import annotations

from datetime import date

import numpy as np
from numpy.typing import NDArray

from app.models import CalcConfig

_DAYS_PER_YEAR = 365.0


def _present_value(rate: float, years: NDArray[np.float64], amounts: NDArray[np.float64]) -> float:
    """f(r) = Σ CF_i / (1+r)^t_i. (1+r) <= 0 이면 inf 반환(도메인 이탈)."""
    base = 1.0 + rate
    if base <= 0.0:
        return float("inf")
    return float(np.sum(amounts / np.power(base, years)))


def _present_value_derivative(
    rate: float, years: NDArray[np.float64], amounts: NDArray[np.float64]
) -> float:
    """f'(r) = Σ -t_i · CF_i / (1+r)^(t_i+1)."""
    base = 1.0 + rate
    if base <= 0.0:
        return float("inf")
    return float(np.sum(-years * amounts / np.power(base, years + 1.0)))


def compute_xirr(
    cashflows: list[tuple[date, float]], config: CalcConfig
) -> float | None:
    """현금흐름 리스트로부터 XIRR(연율, 소수)을 계산한다."""
    if len(cashflows) < 2:
        return None

    ordered = sorted(cashflows, key=lambda item: item[0])
    d0 = ordered[0][0]
    years = np.array(
        [(d - d0).days / _DAYS_PER_YEAR for d, _ in ordered], dtype=np.float64
    )
    amounts = np.array([amt for _, amt in ordered], dtype=np.float64)

    if not (np.any(amounts > 0.0) and np.any(amounts < 0.0)):
        return None

    # 1) Newton-Raphson
    rate = config.xirr_newton_guess
    for _ in range(config.xirr_max_iter):
        value = _present_value(rate, years, amounts)
        if not np.isfinite(value):
            break
        if abs(value) < config.xirr_tolerance:
            return rate
        derivative = _present_value_derivative(rate, years, amounts)
        if not np.isfinite(derivative) or derivative == 0.0:
            break
        next_rate = rate - value / derivative
        if not np.isfinite(next_rate) or next_rate <= -1.0:
            break
        if abs(next_rate - rate) < config.xirr_tolerance:
            return next_rate
        rate = next_rate

    # 2) 이분법 폴백 [low, high]
    return _bisection(years, amounts, config)


def _bisection(
    years: NDArray[np.float64],
    amounts: NDArray[np.float64],
    config: CalcConfig,
) -> float | None:
    """[low, high] 에서 부호 변화를 찾아 이분법으로 근을 찾는다."""
    low = config.xirr_bisect_low
    high = config.xirr_bisect_high
    f_low = _present_value(low, years, amounts)
    f_high = _present_value(high, years, amounts)

    if not (np.isfinite(f_low) and np.isfinite(f_high)):
        return None
    if f_low * f_high > 0.0:
        return None

    for _ in range(200):
        mid = 0.5 * (low + high)
        f_mid = _present_value(mid, years, amounts)
        if not np.isfinite(f_mid):
            return None
        if abs(f_mid) < config.xirr_tolerance or (high - low) < config.xirr_tolerance:
            return mid
        if f_low * f_mid < 0.0:
            high = mid
            f_high = f_mid
        else:
            low = mid
            f_low = f_mid
    return 0.5 * (low + high)
