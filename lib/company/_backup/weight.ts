// 백업 — lib/company/weight.ts (Phase 5 Step 1 완료본)
// 엔진④ — 무게 계산 (Phase 5 Step 1)

import type {
  ProductSpec,
  ProductInput,
  InnerBoxCount,
  PackedBox,
} from '@/types/company';
import { getInnerBoxSpec, getOuterBoxSpec, findProduct } from './data';

const OUTER_TARE = 0.5;
const INNER145_TARE = 0.22;
const FULL_INNER145_COUNT = 4;

export function productUnitWeight(product: ProductSpec): number {
  return (
    (product.fullOuterWeight - OUTER_TARE - INNER145_TARE * FULL_INNER145_COUNT) /
    product.fullOuterQty
  );
}

export function calcProductWeight(input: ProductInput): number {
  const product = findProduct(input.size, input.meter);
  if (!product) return 0;
  return productUnitWeight(product) * input.qty;
}

export function calcInnerBoxTare(totals: InnerBoxCount[]): number {
  let sum = 0;
  for (const { kind, count } of totals) {
    sum += getInnerBoxSpec(kind).tare * count;
  }
  return sum;
}

export function calcOuterBoxTare(boxes: PackedBox[]): number {
  let sum = 0;
  for (const b of boxes) {
    if (b.kind === 'outer') sum += getOuterBoxSpec('outer').tare;
    else if (b.kind === 'courier') sum += getOuterBoxSpec('courier').tare;
  }
  return sum;
}

export function isWeightIncomplete(
  totals: InnerBoxCount[],
  boxes: PackedBox[],
): boolean {
  const has60 = totals.some(t => t.kind === 60 && t.count > 0);
  const hasCourier = boxes.some(b => b.kind === 'courier');
  return has60 || hasCourier;
}

export function calcPackedBoxWeight(box: PackedBox): number {
  let w = 0;
  if (box.kind === 'outer') w += getOuterBoxSpec('outer').tare;
  else if (box.kind === 'courier') w += getOuterBoxSpec('courier').tare;
  for (const { kind, count } of box.contents) {
    w += getInnerBoxSpec(kind).tare * count;
  }
  return w;
}
