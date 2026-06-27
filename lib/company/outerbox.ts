// 엔진② — 박스 조합 (Phase 5 Step 2 재작성)
// 입력: 제품별 SizedInnerCount[][] (사이즈 정보 보존)
//
// 알고리즘 (계획서 §4):
//   ① 제품별 풀 아웃박스(60단위) 추출 → 사이즈별 잔여 수집
//   ② 잔여 풀 FFD(60단위) → 모든 bin==60이면 합침, 하나라도 <60이면 분리
//   ③ 분리 시: 같은 사이즈끄리 묶어 낙개/택배(cap=12)/아웃박스(cap=60) 처리

import type {
  SizedInnerCount,
  InnerBoxKind,
  OuterBoxKind,
  PackedBox,
} from '@/types/company';
import { INNER_UNITS } from './data';

const OUTER_CAP = 60;
const COURIER_CAP = 12;

// ─── 내부 헬퍼 타입 ────────────────────────────────────────────────────────

/** 인박스 1개 단위 (전개 후 FFD에 사용) */
type FlatInner = {
  size: number;
  meter: number;
  kind: InnerBoxKind;
  productQtyPerBox: number; // 이 인박스 1개에 담긴 제품 수
};

// ─── 전개 / 압축 ────────────────────────────────────────────────────────────────

/** SizedInnerCount[] → FlatInner[] (kind 내림차순 정렬) */
function expandSized(items: SizedInnerCount[]): FlatInner[] {
  const flat: FlatInner[] = [];
  for (const item of items) {
    const productQtyPerBox = item.count > 0 ? item.productQty / item.count : 0;
    for (let i = 0; i < item.count; i++) {
      flat.push({ size: item.size, meter: item.meter, kind: item.kind, productQtyPerBox });
    }
  }
  flat.sort((a, b) => b.kind - a.kind); // 145 → 95 → 60
  return flat;
}

/** FlatInner[] → SizedInnerCount[] (size/meter/kind 같은 것렜리 합산) */
function compressSized(items: FlatInner[]): SizedInnerCount[] {
  type Entry = FlatInner & { count: number };
  const map = new Map<string, Entry>();
  for (const item of items) {
    const key = `${item.size}_${item.meter}_${item.kind}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { ...item, count: 1 });
    }
  }
  return [...map.values()]
    .sort((a, b) => b.kind - a.kind)
    .map(v => ({
      size: v.size,
      meter: v.meter,
      kind: v.kind,
      count: v.count,
      productQty: v.count * v.productQtyPerBox,
    }));
}

// ─── 단계①: 제품별 풀 아웃박스 추출 + 잔여 분리 ─────────────────────

function extractFullAndRemainder(
  productItems: SizedInnerCount[],
): { fullBoxes: PackedBox[]; remainder: FlatInner[] } {
  const flat = expandSized(productItems);
  if (flat.length === 0) return { fullBoxes: [], remainder: [] };

  const bins: FlatInner[][] = [];
  const binSums: number[] = [];

  for (const item of flat) {
    const u = INNER_UNITS[item.kind]['outer'];
    let placed = false;
    for (let i = 0; i < bins.length; i++) {
      if (binSums[i] + u <= OUTER_CAP) {
        bins[i].push(item);
        binSums[i] += u;
        placed = true;
        break;
      }
    }
    if (!placed) {
      bins.push([item]);
      binSums.push(u);
    }
  }

  const fullBoxes: PackedBox[] = [];
  const remainder: FlatInner[] = [];

  for (let i = 0; i < bins.length; i++) {
    if (binSums[i] === OUTER_CAP) {
      fullBoxes.push({
        kind: 'outer',
        contents: compressSized(bins[i]),
        filled: true,
        weight: 0,
      });
    } else {
      for (const item of bins[i]) remainder.push(item);
    }
  }

  return { fullBoxes, remainder };
}

// ─── 단계③-분리: 같은 사이즈 잔여 → 낙개/택배/아웃박스 ───────────────

function packRemainderBySizeGroup(items: FlatInner[]): PackedBox[] {
  const result: PackedBox[] = [];
  let rem = [...items].sort((a, b) => b.kind - a.kind);

  while (rem.length > 0) {
    if (rem.length === 1) {
      // 인박스 1개 → 낙개
      result.push({ kind: 'loose', contents: compressSized(rem), filled: false, weight: 0 });
      break;
    }

    // 택배박스(cap=12) 시도
    const courierItems: FlatInner[] = [];
    let courierSum = 0;
    const stillLeft: FlatInner[] = [];

    for (const item of rem) {
      const u = INNER_UNITS[item.kind]['courier'];
      if (courierSum + u <= COURIER_CAP) {
        courierItems.push(item);
        courierSum += u;
      } else {
        stillLeft.push(item);
      }
    }

    if (stillLeft.length === 0) {
      // 전부 택배 1개에 담김
      const boxKind: OuterBoxKind | 'loose' = courierItems.length === 1 ? 'loose' : 'courier';
      result.push({ kind: boxKind, contents: compressSized(courierItems), filled: false, weight: 0 });
      break;
    } else {
      // 택배 초과 → 아웃박스(cap=60) 그리디 1개
      const outerItems: FlatInner[] = [];
      let outerSum = 0;
      const overflow: FlatInner[] = [];

      for (const item of rem) {
        const u = INNER_UNITS[item.kind]['outer'];
        if (outerSum + u <= OUTER_CAP) {
          outerItems.push(item);
          outerSum += u;
        } else {
          overflow.push(item);
        }
      }

      result.push({ kind: 'outer', contents: compressSized(outerItems), filled: false, weight: 0 });
      rem = overflow;
    }
  }

  return result;
}

// ─── 메인 함수 ─────────────────────────────────────────────────────────────

/**
 * 제품별 인박스 분해 결과 → PackedBox[]
 * @param perProduct simulate.ts 에서 전달하는 SizedInnerCount[][]
 */
export function packIntoBoxes(perProduct: SizedInnerCount[][]): PackedBox[] {
  const result: PackedBox[] = [];
  const allRemainders: FlatInner[] = [];

  // ① 제품별 풀 아웃박스 추출 + 잔여 수집
  for (const productItems of perProduct) {
    const { fullBoxes, remainder } = extractFullAndRemainder(productItems);
    result.push(...fullBoxes);
    allRemainders.push(...remainder);
  }

  if (allRemainders.length === 0) return result;

  // ② 잔여 풀 FFD (60단위) → 빈칸 판정
  const sortedRem = [...allRemainders].sort((a, b) => b.kind - a.kind);
  const remBins: FlatInner[][] = [];
  const remBinSums: number[] = [];

  for (const item of sortedRem) {
    const u = INNER_UNITS[item.kind]['outer'];
    let placed = false;
    for (let i = 0; i < remBins.length; i++) {
      if (remBinSums[i] + u <= OUTER_CAP) {
        remBins[i].push(item);
        remBinSums[i] += u;
        placed = true;
        break;
      }
    }
    if (!placed) {
      remBins.push([item]);
      remBinSums.push(u);
    }
  }

  const allFull = remBinSums.every(s => s === OUTER_CAP);

  if (allFull) {
    // 합침: 섬인 아웃박스로 확정 (filled=true)
    for (const bin of remBins) {
      result.push({
        kind: 'outer',
        contents: compressSized(bin),
        filled: true,
        weight: 0,
      });
    }
  } else {
    // 분리: 사이즈별로 묶어 처리
    const sizeGroups = new Map<string, FlatInner[]>();
    for (const item of allRemainders) {
      const key = `${item.size}_${item.meter}`;
      const group = sizeGroups.get(key);
      if (group) {
        group.push(item);
      } else {
        sizeGroups.set(key, [item]);
      }
    }
    for (const items of sizeGroups.values()) {
      result.push(...packRemainderBySizeGroup(items));
    }
  }

  return result;
}

/**
 * PackedBox[] → 종류별 개수 집계
 */
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
