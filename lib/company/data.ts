// 마스터 데이터 (Phase 5 Step 1 하드코딩 — Phase 6에서 Supabase 연동 예정)
// 제품 3종 / 인박스 3종 / 아웃박스 2종 / 파렛트 5종

import type {
  ProductSpec,
  InnerBoxSpec,
  OuterBoxSpec,
  PalletSpec,
  InnerBoxKind,
  OuterBoxKind,
} from '@/types/company';

// ─── 제품 ─────────────────────────────────────────────────────────────────────

export const PRODUCTS: ProductSpec[] = [
  {
    size: 40,
    meter: 300,
    fullOuterQty: 120,
    fullOuterWeight: 15.92,
    innerCapacity: { 145: 30, 95: 20, 60: 10 },
  },
  {
    size: 60,
    meter: 300,
    fullOuterQty: 80,
    fullOuterWeight: 15.80,
    innerCapacity: { 145: 20, 95: 10, 60: null },
  },
  {
    size: 110,
    meter: 300,
    fullOuterQty: 40,
    fullOuterWeight: 15.00,
    innerCapacity: { 145: 10, 95: null, 60: null },
  },
];

// ─── 인박스 ───────────────────────────────────────────────────────────────────

export const INNER_BOXES: InnerBoxSpec[] = [
  { kind: 145, w: 340, d: 150, h: 150, tare: 0.22 },
  { kind: 95,  w: 340, d: 150, h: 95,  tare: 0.16 },
  { kind: 60,  w: 340, d: 150, h: 60,  tare: 0.00 }, // tare 미상 → 0kg placeholder
];

// ─── 아웃박스 ─────────────────────────────────────────────────────────────────

export const OUTER_BOXES: OuterBoxSpec[] = [
  {
    kind: 'outer',
    label: '아웃박스',
    w: 355, d: 315, h: 315,
    tare: 0.50,
    perLayerUnit: 15,  // 145인박스 1개 = 15 단위
    capacityUnit: 60,  // 총 용량 60 단위
  },
  {
    kind: 'courier',
    label: '택배박스',
    w: 315, d: 315, h: 215,
    tare: 0.00, // tare 미상 → 0kg placeholder
    perLayerUnit: 5,   // 145인박스 1개 = 5 단위
    capacityUnit: 12,  // 총 용량 12 단위
  },
];

// ─── 파렛트 ───────────────────────────────────────────────────────────────────

export const PALLETS: PalletSpec[] = [
  { id: '700-wood',       label: '700파렛트 (나무)',   w: 710,  d: 750,  h: 140, tare: 9.0,  boxesPerLayer: 4 },
  { id: '900-wood',       label: '900파렛트 (나무)',   w: 900,  d: 710,  h: 140, tare: 12.4, boxesPerLayer: 6 },
  { id: '1100-wood',      label: '1100파렛트 (나무)',  w: 1100, d: 1100, h: 190, tare: 23.3, boxesPerLayer: 9 },
  { id: '1100-plastic-a', label: 'A 플라스틱 파렛트', w: 1100, d: 1100, h: 155, tare: 10.5, boxesPerLayer: 9 },
  { id: '1100-plastic-b', label: 'B 플라스틱 파렛트', w: 1100, d: 1100, h: 155, tare: 18.5, boxesPerLayer: 9 },
];

// ─── 인박스 종류별 아웃박스/택배박스 단위값 ──────────────────────────────────────
//   아웃박스 총용량=60, 택배박스 총용량=12
//   145: outer=15, courier=5
//   95 : outer=10, courier=3
//   60 : outer= 6, courier=2

export const INNER_UNITS: Record<InnerBoxKind, Record<OuterBoxKind, number>> = {
  145: { outer: 15, courier: 5 },
  95:  { outer: 10, courier: 3 },
  60:  { outer: 6,  courier: 2 },
};

// ─── 조회 헬퍼 ────────────────────────────────────────────────────────────────

export function findProduct(size: number, meter: number): ProductSpec | null {
  return PRODUCTS.find(p => p.size === size && p.meter === meter) ?? null;
}

export function findPallet(id: string): PalletSpec | null {
  return PALLETS.find(p => p.id === id) ?? null;
}

export function getInnerBoxSpec(kind: InnerBoxKind): InnerBoxSpec {
  const spec = INNER_BOXES.find(b => b.kind === kind);
  if (!spec) throw new Error(`Unknown InnerBoxKind: ${kind}`);
  return spec;
}

export function getOuterBoxSpec(kind: OuterBoxKind): OuterBoxSpec {
  const spec = OUTER_BOXES.find(b => b.kind === kind);
  if (!spec) throw new Error(`Unknown OuterBoxKind: ${kind}`);
  return spec;
}
