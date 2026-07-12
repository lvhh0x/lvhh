// 엔진④ — 무게 계산 (Phase 5 Step 1 · Phase 6 일반화)
// 규칙 (계획서 3.6, Phase 6 확장):
//   제품1개무게 = (아웃박스총무게 − 아웃박스tare − 기본인박스tare × 아웃박스당개수) ÷ 풀수량
//   tare·개수는 하이드레이션된 마스터 데이터(단일 출처)에서 읽는다.
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
import { getInnerBoxSpec, getOuterBoxSpec, findProduct, INNER_UNITS } from './data';

/**
 * 제품 1개 무게 (kg) — 꽉 찬 아웃박스 무게에서 tare 역산.
 * 제품의 기본 인박스 종류(defaultInner) 기준으로 인박스 tare 개수를 계산한다.
 *   예: 40(145박스) = (W − 0.5 − 0.22×4) ÷ 120 / 70(95박스) = (W − 0.5 − 0.16×6) ÷ 60
 * 무게 미실측(fullOuterWeight=null) 제품은 null.
 */
export function productUnitWeight(product: ProductSpec): number | null {
  if (product.fullOuterWeight === null) return null;
  const outer = getOuterBoxSpec('outer');
  const inner = getInnerBoxSpec(product.defaultInner);
  const innersPerOuter = outer.capacityUnit / INNER_UNITS[product.defaultInner].outer;
  return (
    (product.fullOuterWeight - outer.tare - inner.tare * innersPerOuter) /
    product.fullOuterQty
  );
}

/**
 * 제품 입력 1행의 제품 무게 합 (제품 본체만, 박스 제외).
 * 무게 미실측 제품 포함 시 null.
 */
export function calcProductWeight(input: ProductInput): number | null {
  const product = findProduct(input.size, input.meter);
  if (!product) return 0;
  const unit = productUnitWeight(product);
  if (unit === null) return null;
  return unit * input.qty;
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
