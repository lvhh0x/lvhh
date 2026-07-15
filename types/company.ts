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
  // 원단별로 수용량이 다르다(예: 40×300 = 공통 30 / P-110 24).
  // 따라서 스펙 키는 (원단, 사이즈, 미터)다. null = 원단 무관 공통 규칙 —
  // 원단 미지정('미상') 입력이 이 행으로 계산된다. (Phase 6 — 특수 원단 노출)
  fabric: string | null;
  size: number;            // 사이즈 (mm), 예: 40
  meter: number;           // 미터 (m), 예: 300
  fullOuterQty: number;    // 풀 아웃박스 제품 수량, 예: 120
  fullOuterWeight: number | null; // 풀 아웃박스 총 무게 (kg), null=미실측 (박스 계산은 가능)
  defaultInner: InnerBoxKind;     // 기본 인박스 종류 (무게 역산·수량 계산 기준)
  innerCapacity: Record<InnerBoxKind, number | null>; // 인박스별 용량, null=미지원
}

export interface InnerBoxSpec {
  kind: InnerBoxKind;
  w: number; // 가로 (mm)
  d: number; // 세로 (mm)
  h: number; // 높이 (mm)
  tare: number; // 공 무게 (kg)
}

export interface OuterBoxSpec {
  kind: OuterBoxKind;
  label: string;         // 표시명
  w: number;
  d: number;
  h: number;
  tare: number;          // 공 무게 (kg)
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

// ─── 마스터 데이터 묶음 (Phase 6 — DB 하이드레이션 페이로드) ─────────────────────
// /api/company/master 응답 = 이 형태. lib/company/data.ts 가 주입받아 노출한다.

export interface MasterData {
  products: ProductSpec[];
  innerBoxes: InnerBoxSpec[];
  outerBoxes: OuterBoxSpec[];
  pallets: PalletSpec[];
  innerUnits: Record<InnerBoxKind, Record<OuterBoxKind, number>>;
  /** `"${size}_${meter}"` → 그 치수에 존재하는 원단 코드 목록 (입력폼 드롭다운 출처) */
  fabricsByDim: Record<string, string[]>;
}

// ─── 입력 ──────────────────────────────────────────────────────────────────────

export interface ProductInput {
  fabric: string; // 원단 타입 (자유입력, 미입력 시 '미지정') — Phase 5 Step 3-4
  size: number;   // 사이즈 (mm)
  meter: number;  // 미터 (m)
  qty: number;    // 수량 (개)
  // 포장 속성 (표시용 — 계산 미관여, 추후 예외규칙 연동 예정) — Phase 6
  leaderTrailer?: string;   // 리더트레일러 (기본 AA)
  coreType?: string;        // 코아타입 (기본 1FC)
  packMode?: 'out' | 'in';  // Out/In (기본 out)
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
  fabric: string;      // 원단 타입 (제품→박스까지 passthrough) — Phase 5 Step 3-4
  size: number;        // 제품 사이즈 (mm)
  meter: number;       // 제품 미터 (m)
  kind: InnerBoxKind;  // 인박스 종류: 145 | 95 | 60
  count: number;       // 이 사이즈+종류 인박스 개수
  productQty: number;  // 이 인박스들에 담긴 실제 제품 개수. 꽉 찬 박스는 count×수용량,
                       // 마지막 부분 박스는 실제 담긴 수(수용량 미만일 수 있다)
}

export interface PackedBox {
  kind: OuterBoxKind | 'loose';  // 아웃박스 / 택배박스 / 낱개
  contents: SizedInnerCount[];   // ← 사이즈 정보 포함 (사이즈 3~4종 혼재 가능)
  filled: boolean;               // 꽉 찬 아웃박스(60단위) 여부
  weight: number;                // 박스 tare + 내용물 인박스 tare
}

// ─── 파렛트 결과 ───────────────────────────────────────────────────────────────

/** 파렛트 슬롯 한 칸의 종류 (Phase 5 Step 3-3) */
export type SlotKind = 'outer' | 'courier' | 'loose' | 'empty';

// 파렛트는 항상 1개 (Phase 5 Step 3-3 — 슬롯 환산 재설계)
export interface PalletStack {
  palletId: string;
  boxesPerLayer: number;    // 층당 슬롯 수 (= layout cols×rows)
  neededSlots: number;      // 필요슬롯 = slotOuter + slotCourier + slotLoose
  maxSlots: number;         // 최대슬롯 = boxesPerLayer × 5
  overflow: boolean;        // 필요슬롯 > 최대슬롯 → 적재 초과 (선택 불가)
  slotOuter: number;        // 아웃박스가 차지하는 슬롯 (= outerCount)
  slotCourier: number;      // 택배가 차지하는 슬롯 (= courierCount)
  slotLoose: number;        // 낱개가 차지하는 슬롯 (= ceil(looseCount / 2))
  layers: number;           // 층수 = ceil(필요슬롯 / boxesPerLayer)
  lastLayerSlots: number;   // 마지막(맨 위) 층이 실제 차지한 슬롯 수
  height: number;           // 파렛트 높이 + 아웃박스 높이(315) × 층수 (mm)
  weight: number | null;    // 파렛트 tare + 적재물 무게 합 (kg) · null=무게 미실측 제품 포함
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
  totalWeight: number | null;     // 전체 무게 합 (제품+인박스+아웃박스+파렛트) · null=무게 미실측 제품 포함
  pallet: PalletStack | null;
}
