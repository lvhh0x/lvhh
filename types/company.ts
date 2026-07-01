// 박스·파렛트 적재 시뮬레이션 타입 (Phase 5 Step 2 — 사이즈 정보 보존)
// Phase 5 Step 1 대비 변경:
//   · SizedInnerCount 추가 (사이즈+미터+인박스종류+수량+제품수량)
//   · PackedBox.contents: InnerBoxCount[] → SizedInnerCount[] (사이즈 정보 박스까지 전달)
//   · InnerBoxCount 는 innerTotals 표시용으로 유지

// ─── 인박스 / 아웃박스 종류 ───────────────────────────────────────────────────

export type InnerBoxKind = 60 | 95 | 145;
export type OuterBoxKind = 'outer' | 'courier'; // 아웃박스 / 택배박스

// ─── 마스터 데이터 ─────────────────────────────────────────────────────────────

export interface ProductSpec {
  size: number;            // 사이즈 (mm), 예: 40
  meter: number;           // 미터 (m), 예: 300
  fullOuterQty: number;    // 풀 아웃박스 제품 수량, 예: 120
  fullOuterWeight: number; // 풀 아웃박스 총 무게 (kg), 예: 15.92
  innerCapacity: Record<InnerBoxKind, number | null>; // 인박스별 용량, null=미지원
}

export interface InnerBoxSpec {
  kind: InnerBoxKind;
  w: number; // 가로 (mm)
  d: number; // 세로 (mm)
  h: number; // 높이 (mm)
  tare: number; // 공 무게 (kg), 60인박스는 0 (미상)
}

export interface OuterBoxSpec {
  kind: OuterBoxKind;
  label: string;         // 표시명
  w: number;
  d: number;
  h: number;
  tare: number;          // 공 무게 (kg), 택배박스는 0 (미상)
  perLayerUnit: number;  // 145인박스 기준 단위값 (outer=15, courier=5)
  capacityUnit: number;  // 총 용량 단위 (outer=60, courier=12)
}

/** 파렛트 위 아웃박스 배열 방식 (Phase 5 Step 3 / Step 2 신규) */
export interface PalletLayout {
  cols: number;      // 파렛트 가로(w) 방향 박스 개수
  rows: number;      // 파렛트 세로(d) 방향 박스 개수
  rotated: boolean;  // 박스를 90° 회전해 배치하는지 여부
}

export interface PalletSpec {
  id: string;
  label: string;
  w: number;
  d: number;
  h: number;
  tare: number;          // 공 무게 (kg)
  boxesPerLayer: number; // 층당 아웃박스 수
  layout: PalletLayout;  // 아웃박스 배열표 (Phase 5 Step 3 / Step 2)
}

// ─── 입력 ──────────────────────────────────────────────────────────────────────

export interface ProductInput {
  size: number;   // 사이즈 (mm)
  meter: number;  // 미터 (m)
  qty: number;    // 수량 (개)
}

export interface CompanyParams {
  products: ProductInput[];
  palletId: string | null; // PalletSpec.id, null = 적재 안 함
}

// ─── 중간 결과 ─────────────────────────────────────────────────────────────────

/** 종류별 인박스 합산 (innerTotals 표시용 — 사이즈 정보 없음) */
export interface InnerBoxCount {
  kind: InnerBoxKind;
  count: number;
}

/**
 * 사이즈가 붙은 인박스 카운트 (Phase 5 Step 2 신규)
 * 제품→박스까지 사이즈/미터 정보를 유지한다.
 */
export interface SizedInnerCount {
  size: number;        // 제품 사이즈 (mm): 40 | 60 | 110
  meter: number;       // 제품 미터 (m): 300
  kind: InnerBoxKind;  // 인박스 종류: 145 | 95 | 60
  count: number;       // 이 사이즈+종류 인박스 개수
  productQty: number;  // 이 인박스들에 담긴 제품 개수 (= count × innerCapacity[kind])
}

export interface PackedBox {
  kind: OuterBoxKind | 'loose';  // 아웃박스 / 택배박스 / 낱개
  contents: SizedInnerCount[];   // ← 사이즈 정보 포함 (사이즈 3~4종 혼재 가능)
  filled: boolean;               // 꽉 찬 아웃박스(60단위) 여부
  weight: number;                // 박스 tare + 내용물 인박스 tare
}

// ─── 파렛트 결과 ───────────────────────────────────────────────────────────────

export interface PalletStack {
  palletId: string;
  layers: number;           // 마지막 파렛트 단수
  lastLayerBoxes: number;   // 마지막 층 박스 수
  boxesPerLayer: number;    // 파렛트 층당 박스 수
  totalPallets: number;     // 총 파렛트 수
  height: number;           // 파렛트 높이 + 아웃박스 높이 × 단수 (mm)
  weight: number;           // 파렛트 tare + 아웃박스 무게 합 (kg)
  footprintW: number;       // 파렛트+아웃박스 합산 외곽 가로 (mm) — Phase 5 Step 3/Step 2
  footprintD: number;       // 파렛트+아웃박스 합산 외곽 세로 (mm)
  overhangW: number;        // 가로 오버행 (mm, 0이면 없음)
  overhangD: number;        // 세로 오버행 (mm, 0이면 없음)
}

// ─── 최종 결과 ─────────────────────────────────────────────────────────────────

export interface CompanyResult {
  innerTotals: InnerBoxCount[];   // 인박스 종류별 총합 (표시용)
  boxes: PackedBox[];             // 아웃박스 / 택배 / 낱개 목록
  outerCount: number;             // 아웃박스 수
  courierCount: number;           // 택배박스 수
  looseCount: number;             // 낱개 수
  totalWeight: number;            // 전체 무게 합 (제품+인박스+아웃박스+파렛트)
  pallet: PalletStack | null;
  weightIncomplete: boolean;      // 60인박스 또는 택배박스 포함 시 무게 과소 표시 안내
}
