// 백업 — lib/company/outerbox.ts (Phase 5 Step 1 완료본)
// 엔진② — 박스 조합 (Phase 5 Step 1)
// 인박스 합산 → 아웃박스(cap=60) / 택배박스(cap=12) / 낱개 로 묶는다.
//
// 규칙 (계획서 3.4):
//   1) 큰 인박스부터 FFD로 아웃박스(cap=60)에 패킹 → 꽉 찬 아웃박스 + 마지막 부분 박스
//   2) 마지막 부분 박스(<60)의 인박스를 "잔여"로 꺼낸다.
//   3) 잔여 인박스 수:
//        0개 → 끝
//        1개 → 낱개 1개
//        2개+ → 택배박스 1개에 cap=12로 담기면 택배, 안 담기면 아웃박스(부분)
//   4) 잔여가 택배 1개 초과 시: "택배 우선 → 안 되면 아웃박스" 그리디 반복.

import type {
  InnerBoxCount,
  InnerBoxKind,
  OuterBoxKind,
  PackedBox,
} from '@/types/company';
import { INNER_UNITS } from './data';

const KINDS: InnerBoxKind[] = [145, 95, 60];
const OUTER_CAP = 60;
const COURIER_CAP = 12;

// 인박스 합산을 큰 순서의 단일 인박스 배열로 펼친다.
function expand(totals: InnerBoxCount[]): InnerBoxKind[] {
  const flat: InnerBoxKind[] = [];
  for (const k of KINDS) {
    const found = totals.find(t => t.kind === k);
    if (found) {
      for (let i = 0; i < found.count; i++) flat.push(k);
    }
  }
  return flat;
}

function unit(kind: InnerBoxKind, box: OuterBoxKind): number {
  return INNER_UNITS[kind][box];
}

// 인박스 묶음을 InnerBoxCount[]로 압축
function compress(items: InnerBoxKind[]): InnerBoxCount[] {
  const map = new Map<InnerBoxKind, number>();
  for (const k of items) map.set(k, (map.get(k) ?? 0) + 1);
  return KINDS
    .filter(k => (map.get(k) ?? 0) > 0)
    .map(k => ({ kind: k, count: map.get(k)! }));
}

// 주어진 인박스 묶음이 특정 박스 cap 안에 전부 들어가는지
function fitsInBox(items: InnerBoxKind[], box: OuterBoxKind, cap: number): boolean {
  const sum = items.reduce((acc, k) => acc + unit(k, box), 0);
  return sum <= cap;
}

/**
 * 인박스 합산 → PackedBox[] (아웃박스 / 택배 / 낱개)
 */
export function packIntoBoxes(totals: InnerBoxCount[]): PackedBox[] {
  const flat = expand(totals);
  if (flat.length === 0) return [];

  const result: PackedBox[] = [];

  // ── 1) 아웃박스 FFD 패킹 (cap=60) ──
  const bins: InnerBoxKind[][] = [];
  const binSums: number[] = [];

  for (const k of flat) {
    const u = unit(k, 'outer');
    let placed = false;
    for (let i = 0; i < bins.length; i++) {
      if (binSums[i] + u <= OUTER_CAP) {
        bins[i].push(k);
        binSums[i] += u;
        placed = true;
        break;
      }
    }
    if (!placed) {
      bins.push([k]);
      binSums.push(u);
    }
  }

  // ── 2) 꽉 찬 bin = 아웃박스 확정, 부분 bin = 잔여 ──
  const leftover: InnerBoxKind[] = [];
  for (let i = 0; i < bins.length; i++) {
    if (binSums[i] === OUTER_CAP) {
      result.push({
        kind: 'outer',
        contents: compress(bins[i]),
        filled: true,
        weight: 0,
      });
    } else {
      for (const k of bins[i]) leftover.push(k);
    }
  }

  // ── 3~4) 잔여 처리 ──
  leftover.sort((a, b) => b - a);

  let rem = [...leftover];
  while (rem.length > 0) {
    if (rem.length === 1) {
      result.push({ kind: 'loose', contents: compress(rem), filled: false, weight: 0 });
      rem = [];
      break;
    }

    const courierItems: InnerBoxKind[] = [];
    let courierSum = 0;
    const stillLeft: InnerBoxKind[] = [];
    for (const k of rem) {
      const u = unit(k, 'courier');
      if (courierSum + u <= COURIER_CAP) {
        courierItems.push(k);
        courierSum += u;
      } else {
        stillLeft.push(k);
      }
    }

    if (stillLeft.length === 0) {
      if (courierItems.length === 1) {
        result.push({ kind: 'loose', contents: compress(courierItems), filled: false, weight: 0 });
      } else {
        result.push({ kind: 'courier', contents: compress(courierItems), filled: false, weight: 0 });
      }
      rem = [];
    } else {
      const outerItems: InnerBoxKind[] = [];
      let outerSum = 0;
      const overflow: InnerBoxKind[] = [];
      for (const k of rem) {
        const u = unit(k, 'outer');
        if (outerSum + u <= OUTER_CAP) {
          outerItems.push(k);
          outerSum += u;
        } else {
          overflow.push(k);
        }
      }
      result.push({ kind: 'outer', contents: compress(outerItems), filled: false, weight: 0 });
      rem = overflow;
    }
  }

  return result;
}

export function countOuterBoxes(boxes: PackedBox[]): {
  outerCount: number;
  courierCount: number;
  looseCount: number;
} {
  let outerCount = 0;
  let courierCount = 0;
  let looseCount = 0;
  for (const b of boxes) {
    if (b.kind === 'outer') outerCount++;
    else if (b.kind === 'courier') courierCount++;
    else looseCount++;
  }
  return { outerCount, courierCount, looseCount };
}

export { fitsInBox };
