// 마스터 데이터 (Phase 5 Step 2 — master.json 단일 출처에서 읽어 타입 입혀 재노출)
// 값 수정은 반드시 lib/company/master.json 에서만 한다 (single source of truth).
// Phase 6에서 Supabase 연동 시 이 파일이 JSON↔타입 매핑 계층 역할을 그대로 유지한다.

import type {
  ProductSpec,
  InnerBoxSpec,
  OuterBoxSpec,
  PalletSpec,
  InnerBoxKind,
  OuterBoxKind,
} from '@/types/company';
import master from './master.json';

// ─── 제품 ─────────────────────────────────────────────────────────────────────

export const PRODUCTS: ProductSpec[] = master.products.map((p) => ({
  size: p.size,
  meter: p.meter,
  fullOuterQty: p.fullOuterQty,
  fullOuterWeight: p.fullOuterWeight,
  innerCapacity: {
    145: p.innerCapacity['145'],
    95: p.innerCapacity['95'],
    60: p.innerCapacity['60'],
  },
}));

// ─── 인박스 ───────────────────────────────────────────────────────────────────

export const INNER_BOXES: InnerBoxSpec[] = master.innerBoxes.map((b) => ({
  kind: b.kind as InnerBoxKind,
  w: b.w,
  d: b.d,
  h: b.h,
  tare: b.tare,
}));

// ─── 아웃박스 ─────────────────────────────────────────────────────────────────

export const OUTER_BOXES: OuterBoxSpec[] = master.outerBoxes.map((b) => ({
  kind: b.kind as OuterBoxKind,
  label: b.label,
  w: b.w,
  d: b.d,
  h: b.h,
  tare: b.tare,
  perLayerUnit: b.perLayerUnit,
  capacityUnit: b.capacityUnit,
}));

// ─── 파렛트 ───────────────────────────────────────────────────────────────────

export const PALLETS: PalletSpec[] = master.pallets.map((p) => ({
  id: p.id,
  label: p.label,
  w: p.w,
  d: p.d,
  h: p.h,
  tare: p.tare,
  boxesPerLayer: p.boxesPerLayer,
  layout: {
    cols: p.layout.cols,
    rows: p.layout.rows,
    rotated: p.layout.rotated,
  },
}));

// ─── 인박스 종류별 아웃박스/택배박스 단위값 ──────────────────────────────────────
//   아웃박스 총용량=60, 택배박스 총용량=12 (master.json 단위표 참조)
//   145: outer=15, courier=5 / 95: outer=10, courier=3 / 60: outer=6, courier=2

export const INNER_UNITS: Record<InnerBoxKind, Record<OuterBoxKind, number>> = {
  145: { outer: master.innerUnits['145'].outer, courier: master.innerUnits['145'].courier },
  95:  { outer: master.innerUnits['95'].outer,  courier: master.innerUnits['95'].courier },
  60:  { outer: master.innerUnits['60'].outer,  courier: master.innerUnits['60'].courier },
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

// 박스 용량 단위 (single source of truth = master.json) — outerbox.ts 가 사용
export const OUTER_CAP: number = getOuterBoxSpec('outer').capacityUnit;
export const COURIER_CAP: number = getOuterBoxSpec('courier').capacityUnit;
