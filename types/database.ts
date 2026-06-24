// DB-01-schema.md 기반 — Supabase 시뮬레이션 테이블 타입
// ⚠️ 리본/라벨 테이블 타입은 이 파일에 추가하지 않는다

export interface PalletType {
  id: number;
  name: string;
  length_mm: number;
  width_mm: number;
  height_mm: number;
  weight_kg: number;
  created_at: string;
}

export interface OuterBoxType {
  id: number;
  name: string;
  length_mm: number;
  width_mm: number;
  height_mm: number;
  weight_kg: number;
}

export interface InnerBoxType {
  id: number;
  name: string;
  dimensions_label: string;
}

// Phase 6에서 추가될 예정 (사용자 지시 시)
export interface StockSimulationRow {
  id: string;
  ticker: string;
  name: string;
  tag: string;
  seed: number;
  bias: number;
  vol: number;
  color: string;
}

export interface SimulationProductRow {
  id: number;
  name: string;
  per_box: number;
}
