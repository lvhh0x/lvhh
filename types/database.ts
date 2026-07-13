// DB-01-schema.md 기반 — Supabase 시뮬레이션 테이블 타입
//
// <!-- 보류 (2026-07-13, 사용자 결정) — 전체 구조 완성 후 되살릴 것
// ⚠️ 리본/라벨 테이블 타입은 이 파일에 추가하지 않는다
// -->
// 위 규칙은 보류한다. 박스 적재 시뮬레이션의 원단 드롭다운이 ribbon_types·ribbon_specs
// 를 읽어야 하므로 두 테이블의 Row 타입을 추가했다. 아직 DB를 만드는 단계라
// 스키마가 계속 자라며, 타입도 실제 컬럼과 함께 자라야 한다 (`as` 우회 금지).
// 여전히 유효한 절대 원칙: DB 내용이 꼬이거나 삭제되는 일은 없어야 한다.

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
  length_mm: number;
  width_mm: number;
  height_mm: number;
  weight_kg: number;
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

// ── Supabase 제네릭 타입 (LIB-02) ────────────────────────
// createClient<Database>(...) 에서 사용.
// Row 타입별로 분리 선언해 순환 참조 방지.

type PalletTypeRow = {
  id: number;
  name: string | null;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  weight_kg: number | null;
  boxes_per_layer: number | null;   // Phase 6 — 층당 아웃박스 수
  layout_cols: number | null;       // Phase 6 — 배열 가로
  layout_rows: number | null;       // Phase 6 — 배열 세로
  layout_rotated: boolean;          // Phase 6 — 90° 회전 배치 여부
  created_at: string | null;
};

type OuterBoxTypeRow = {
  id: number;
  name: string | null;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  weight_kg: number | null;
  capacity_unit: number | null;   // Phase 6 — 총 용량 단위 (outer=60, courier=12)
  per_layer_unit: number | null;  // Phase 6 — 층당 단위 (outer=15, courier=5)
  created_at: string | null;
};

type InnerBoxTypeRow = {
  id: number;
  name: string | null;
  description: string | null;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  weight_kg: number | null;
  outer_unit: number | null;    // Phase 6 — 아웃박스 단위값 (145=15, 95=10, 60=6)
  courier_unit: number | null;  // Phase 6 — 택배박스 단위값 (145=5, 95=3, 60=2)
  created_at: string | null;
};

// Phase 6 — 사이즈(폭·길이·원단)별 인박스 수용량 (기본 규칙: ribbon_type_id NULL)
type RollBoxCapacityRow = {
  id: number;
  width_mm: number;
  length_m: number;
  ribbon_type_id: number | null;
  inner_box_id: number;
  qty: number;
  is_default: boolean;
  // 특수코아(9F/65·F65 등)에 따라 수용량이 달라지는 행. NULL = 코아 무관.
  // 시뮬레이션은 코아를 계산에 넣기 전까지 이 행들을 제외한다 (2026-07-13).
  core_spec_id: number | null;
  alt_qty: number | null;
  alt_condition: string | null;
  created_at: string | null;
};

// 원단 코드 마스터 — 원단 드롭다운 표시명 (2026-07-13)
type RibbonTypeRow = {
  id: number;
  code: string;
  description: string | null;
  parent_id: number | null;
  color: string | null;
  winding: string | null;
  created_at: string | null;
};

// 원단별로 존재하는 치수(폭×길이) 조합 — 원단 드롭다운 후보 산출 (2026-07-13)
type RibbonSpecRow = {
  id: number;
  ribbon_type_id: number;
  width_mm: number;
  length_m: number;
  raw_notes: string | null;
  created_at: string | null;
};

// Phase 6 — 사이즈별 꽉 찬 아웃박스 실측 무게 (ribbon_type_id NULL = 공통)
type RollWeightRow = {
  id: number;
  width_mm: number;
  length_m: number;
  ribbon_type_id: number | null;
  full_outer_weight_kg: number;
  created_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      pallet_types: {
        Row: PalletTypeRow;
        Insert: Omit<PalletTypeRow, 'id' | 'created_at'>;
        Update: Partial<Omit<PalletTypeRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      outer_box_types: {
        Row: OuterBoxTypeRow;
        Insert: Omit<OuterBoxTypeRow, 'id' | 'created_at'>;
        Update: Partial<Omit<OuterBoxTypeRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      inner_box_types: {
        Row: InnerBoxTypeRow;
        Insert: Omit<InnerBoxTypeRow, 'id' | 'created_at'>;
        Update: Partial<Omit<InnerBoxTypeRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      roll_box_capacities: {
        Row: RollBoxCapacityRow;
        Insert: Omit<RollBoxCapacityRow, 'id' | 'created_at'>;
        Update: Partial<Omit<RollBoxCapacityRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      roll_weights: {
        Row: RollWeightRow;
        Insert: Omit<RollWeightRow, 'id' | 'created_at'>;
        Update: Partial<Omit<RollWeightRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      ribbon_types: {
        Row: RibbonTypeRow;
        Insert: Omit<RibbonTypeRow, 'id' | 'created_at'>;
        Update: Partial<Omit<RibbonTypeRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      ribbon_specs: {
        Row: RibbonSpecRow;
        Insert: Omit<RibbonSpecRow, 'id' | 'created_at'>;
        Update: Partial<Omit<RibbonSpecRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
  };
};
