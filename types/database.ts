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

// ── Supabase 제네릭 타입 (LIB-02) ────────────────────────────────────────
// createClient<Database>(...) 에서 사용.
// Row 타입별로 분리 선언해 순환 참조 방지.

type PalletTypeRow = {
  id: number;
  name: string | null;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  weight_kg: number | null;
  created_at: string | null;
};

type OuterBoxTypeRow = {
  id: number;
  name: string | null;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  weight_kg: number | null;
  created_at: string | null;
};

type InnerBoxTypeRow = {
  id: number;
  name: string | null;
  dimensions_label: string | null;
  created_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      pallet_types: {
        Row: PalletTypeRow;
        Insert: Omit<PalletTypeRow, 'id' | 'created_at'>;
        Update: Partial<Omit<PalletTypeRow, 'id' | 'created_at'>>;
      };
      outer_box_types: {
        Row: OuterBoxTypeRow;
        Insert: Omit<OuterBoxTypeRow, 'id' | 'created_at'>;
        Update: Partial<Omit<OuterBoxTypeRow, 'id' | 'created_at'>>;
      };
      inner_box_types: {
        Row: InnerBoxTypeRow;
        Insert: Omit<InnerBoxTypeRow, 'id' | 'created_at'>;
        Update: Partial<Omit<InnerBoxTypeRow, 'id' | 'created_at'>>;
      };
    };
  };
};
