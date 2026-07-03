// 원단(fabric) 유틸 — 순수 함수 (Phase 5 Step 3-4)
// UI/엔진 공용. 원단 정규화 + 박스 라벨용 원단 목록 산출.

import type { SizedInnerCount } from '@/types/company';

/** 미입력('' / 공백) → '미지정'. 그 외엔 앞뒤 공백만 제거. */
export function normalizeFabric(raw: string): string {
  const trimmed = raw.trim();
  return trimmed === '' ? '미지정' : trimmed;
}

/**
 * 한 박스 내용물의 원단 목록(distinct).
 * 정렬: 원단별 제품수량(productQty) 합 내림차순 → 동률이면 등장(입력) 순.
 */
export function distinctFabricsByQty(contents: SizedInnerCount[]): string[] {
  const order: string[] = []; // 최초 등장 순
  const qty = new Map<string, number>();
  for (const c of contents) {
    if (!qty.has(c.fabric)) order.push(c.fabric);
    qty.set(c.fabric, (qty.get(c.fabric) ?? 0) + c.productQty);
  }
  return [...order].sort((a, b) => {
    const diff = (qty.get(b) ?? 0) - (qty.get(a) ?? 0);
    if (diff !== 0) return diff;
    return order.indexOf(a) - order.indexOf(b);
  });
}
