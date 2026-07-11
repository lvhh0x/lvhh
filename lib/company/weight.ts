// 엔진④ — 무게 계산 (Phase 5 Step 1)
// 규칙 (계획서 3.6):
//   제품1개무게 = (아웃박스총무게 − 아웃박스tare 0.5 − 145tare 0.22 × 4) ÷ 풀수량
//
//   총무게 = Σ(제품무게 × 수량)
//          + Σ(인박스 tare: 145=0.22, 95=0.16, 60=0)
//          + Σ(아웃박스 tare 0.5, 택배박스 tare=0)
//          + (파렛트 적재 시) 파렛트 tare
//
// 모든 tare는 실측 확정값 (Phase 6, 2026-07-11).

import type {
  ProductSpec,
  ProductInput,
  InnerBoxCount,
  PackedBox,
} from '@/types/company';
import { getInnerBoxSpec, getOuterBoxSpec, findProduct } from './data';

const OUTER_TARE = 0.5;   // 아웃박스 tare
const INNER145_TARE = 0.22;
const FULL_INNER145_COUNT = 4; // 꽉 찬 아웃박스 = 145인박스 4개

/**
 * 제품 1개 무게 (kg) — 꽉 찬 아웃박스 무게에서 tare 역산.
 */
export function productUnitWeight(product: ProductSpec): number {
  return (
    (product.fullOuterWeight - OUTER_TARE - INNER145_TARE * FULL_INNER145_COUNT) /
    product.fullOuterQty
  );
}

/**
 * 제품 입력 1행의 제품 무게 합 (제품 본체만, 박스 제외).
 */
export function calcProductWeight(input: ProductInput): number {
  const product = findProduct(input.size, input.meter);
  if (!product) return 0;
  return productUnitWeight(product) * input.qty;
}

/**
 * 인박스 tare 합 (kg).
 */
export function calcInnerBoxTare(totals: InnerBoxCount[]): number {
  let sum = 0;
  for (const { kind, count } of totals) {
    sum += getInnerBoxSpec(kind).tare * count;
  }
  return sum;
}

/**
 * 아웃박스/택배박스 tare 합 (kg). 낱개는 박스 tare 없음.
 */
export function calcOuterBoxTare(boxes: PackedBox[]): number {
  let sum = 0;
  for (const b of boxes) {
    if (b.kind === 'outer') sum += getOuterBoxSpec('outer').tare;
    else if (b.kind === 'courier') sum += getOuterBoxSpec('courier').tare;
    // loose → 박스 없음
  }
  return sum;
}

/**
 * 단일 PackedBox의 무게 (박스 tare + 내용물 인박스 tare).
 * 제품 본체 무게는 총합에서 별도 합산하므로 박스 표시 무게에는 tare만 반영.
 */
export function calcPackedBoxWeight(box: PackedBox): number {
  let w = 0;
  if (box.kind === 'outer') w += getOuterBoxSpec('outer').tare;
  else if (box.kind === 'courier') w += getOuterBoxSpec('courier').tare;
  for (const { kind, count } of box.contents) {
    w += getInnerBoxSpec(kind).tare * count;
  }
  return w;
}
