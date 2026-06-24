// 주식 시뮬레이션 타입 (LIB-01 기반)

export interface StockConfig {
  id: string;        // 's1' ~ 's6'
  ticker: string;
  name: string;
  tag: string;
  seed: number;
  bias: number;      // 가격 방향 편향
  vol: number;       // 변동성
  color: string;     // 차트 색상 hex
}

export interface PricePoint {
  day: number;
  price: number;
}

export interface StockSimulationParams {
  stockId: string;
  startDate: string;          // 'YYYY-MM-DD'
  endDate: string;            // 'YYYY-MM-DD'
  initialInvestment: number;
}

export interface StockSimulationResult {
  stockId: string;
  ticker: string;
  name: string;
  prices: PricePoint[];
  finalValue: number;
  returnRate: number;         // 수익률 (소수, 예: 0.15 = +15%)
  maxDrawdown: number;        // 최대 낙폭 (소수, 예: -0.20 = -20%)
}
