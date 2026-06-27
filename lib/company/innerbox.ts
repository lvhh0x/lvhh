// 엔진① — 인박스 분해 (Phase 5 Step 1)
// 규칙: 큰 박스부터 꽉 채우고, 나머지는 cap >= rem 인 가장 작은 박스 1개.

import type { ProductSpec, InnerBoxKind, InnerBoxCount } from '@/types/company';

const KINDS: InnerBoxKind[] = [145, 95, 60];

/**
 * 제품 수량 qty를 인박스로 분해한다.
 */
export function decomposeToInnerBoxes(
  product: ProductSpec,
  qty: number,
): InnerBoxCount[] {
  // 지원 인박스를 큰 순서로 정렬
  const available = KINDS
    .filter(k => product.innerCapacity[k] !== null)
    .map(k => ({ kind: k, cap: product.innerCapacity[k] as number }))
    .sort((a, b) => b.cap - a.cap);

  if (available.length === 0) return [];

  const largest = available[0];
  const counts = new Map<InnerBoxKind, number>();
  let rem = qty;

  // 가장 큰 박스로 꽉 채우기
  if (rem >= largest.cap) {
    const n = Math.floor(rem / largest.cap);
    counts.set(largest.kind, n);
    rem -= n * largest.cap;
  }

  // 나머지 → cap >= rem 인 가장 작은 박스 1개
  if (rem > 0) {
    const candidates = available.filter(b => b.cap >= rem);
    // candidates는 내림차순 정렬 → 마지막이 가장 작은 것
    const pick = candidates.length > 0 ? candidates[candidates.length - 1] : largest;
    counts.set(pick.kind, (counts.get(pick.kind) ?? 0) + 1);
  }

  return KINDS
    .filter(k => (counts.get(k) ?? 0) > 0)
    .map(k => ({ kind: k, count: counts.get(k)! }));
}

/**
 * 여러 제품의 인박스 분해 결과를 종류별로 합산한다.
 */
export function mergeInnerBoxCounts(lists: InnerBoxCount[][]): InnerBoxCount[] {
  const totals = new Map<InnerBoxKind, number>();
  for (const list of lists) {
    for (const { kind, count } of list) {
      totals.set(kind, (totals.get(kind) ?? 0) + count);
    }
  }
  return KINDS
    .filter(k => (totals.get(k) ?? 0) > 0)
    .map(k => ({ kind: k, count: totals.get(k)! }));
}
