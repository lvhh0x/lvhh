// 엔진② — 박스 조합 (Phase 5 Step 2 재작성: 사이즈 보존 + 정확-합침 규칙)
// 입력: 제품별 SizedInnerCount[][] (사이즈 정보 보존)
//
// 알고리즘 (HANDOFF §4 / IMPL-PLAN §2.3):
//   1단계   제품별 풀 아웃박스(60단위) 추출 → 사이즈별 잔여(<60) 수집
//   2단계-a 누적 잔여를 사이즈별로 합쳐 풀 한 번 더 추출(같은 사이즈 여러 행 대비)
//   2단계-b 합침 그리디: 잔여 많은 사이즈 seed + 다른 사이즈를 '통째로' 조합해
//           60단위를 정확히 채우면 합쳐 풀 아웃박스, 못 채우면 잔여 청크로 누적
//           · 덩어리는 쪼개지 않음 / 3사이즈+ 혼합 허용 / 동률 시 잔여 많은(같으면 큰 사이즈) 우선
//   잔여    정확 합침 불가 청크들을 FFD로 묶어 택배/낱개/부분아웃박스 결정

import type {
  SizedInnerCount,
  InnerBoxKind,
  PackedBox,
} from '@/types/company';
import { INNER_UNITS, OUTER_CAP, COURIER_CAP } from './data';

// ─── 내부 헬퍼 타입 ────────────────────────────────────────────────────────

/** 인박스 1개 단위 (전개 후 패킹에 사용) */
type FlatInner = {
  fabric: string;           // 원단 (passthrough / 그룹핑 키) — Phase 5 Step 3-4
  size: number;
  meter: number;
  kind: InnerBoxKind;
  productQtyPerBox: number; // 이 인박스 1개에 담긴 제품 수
};

/** 같은 (size, meter) 잔여 덩어리 — 합침 그리디의 원자 단위 */
type Chunk = {
  size: number;
  meter: number;
  units: number;      // 아웃박스 기준 단위 합 (<60)
  flat: FlatInner[];
};

// ─── 전개 / 압축 ────────────────────────────────────────────────────────────────

/** SizedInnerCount[] → FlatInner[] (kind 내림차순 정렬) */
function expandSized(items: SizedInnerCount[]): FlatInner[] {
  const flat: FlatInner[] = [];
  for (const item of items) {
    const productQtyPerBox = item.count > 0 ? item.productQty / item.count : 0;
    for (let i = 0; i < item.count; i++) {
      flat.push({ fabric: item.fabric, size: item.size, meter: item.meter, kind: item.kind, productQtyPerBox });
    }
  }
  flat.sort((a, b) => b.kind - a.kind); // 145 → 95 → 60
  return flat;
}

/** FlatInner[] → SizedInnerCount[] (size/meter/kind 같은 것끼리 합산) */
function compressSized(items: FlatInner[]): SizedInnerCount[] {
  type Entry = FlatInner & { count: number };
  const map = new Map<string, Entry>();
  for (const item of items) {
    const key = `${item.fabric}_${item.size}_${item.meter}_${item.kind}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { ...item, count: 1 });
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.kind - a.kind)
    .map(v => ({
      fabric: v.fabric,
      size: v.size,
      meter: v.meter,
      kind: v.kind,
      count: v.count,
      productQty: v.count * v.productQtyPerBox,
    }));
}

function outerUnitsOf(flat: FlatInner[]): number {
  return flat.reduce((acc, f) => acc + INNER_UNITS[f.kind].outer, 0);
}

function courierUnitsOf(flat: FlatInner[]): number {
  return flat.reduce((acc, f) => acc + INNER_UNITS[f.kind].courier, 0);
}

// ─── 풀 아웃박스(60단위) FFD 추출 ────────────────────────────────────────────

/** flat 인박스를 60단위 bin에 FFD로 담아, 60 딱 찬 bin은 풀 아웃박스, 나머지는 잔여로 반환 */
function extractFullOuters(flat: FlatInner[]): { fullBoxes: PackedBox[]; remainder: FlatInner[] } {
  if (flat.length === 0) return { fullBoxes: [], remainder: [] };

  const sorted = [...flat].sort((a, b) => b.kind - a.kind);
  const bins: FlatInner[][] = [];
  const binSums: number[] = [];

  for (const item of sorted) {
    const u = INNER_UNITS[item.kind].outer;
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
      fullBoxes.push({ kind: 'outer', contents: compressSized(bins[i]), filled: true, weight: 0 });
    } else {
      remainder.push(...bins[i]);
    }
  }
  return { fullBoxes, remainder };
}

// ─── 합침 그리디: 빈자리에 정확히 들어맞는 다른 사이즈 조합 찾기 ───────────────

/** desc 정렬된 두 단위 배열을 사전식 비교 (큰 쪽이 우선) — '잔여 많은 사이즈 우선' 결정 반영 */
function compareUnitsDesc(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? -1;
    const bv = b[i] ?? -1;
    if (av !== bv) return av - bv;
  }
  return 0;
}

/** others 중 단위 합이 정확히 gap이 되는 부분집합. 여럿이면 '잔여 많은 사이즈를 포함한' 조합 우선. */
function findExactFillSubset(others: Chunk[], gap: number): Chunk[] | null {
  const n = others.length;
  let best: Chunk[] | null = null;
  let bestKey: number[] = [];

  for (let mask = 1; mask < (1 << n); mask++) {
    let sum = 0;
    const subset: Chunk[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        subset.push(others[i]);
        sum += others[i].units;
      }
    }
    if (sum !== gap) continue;
    const key = subset.map(c => c.units).sort((x, y) => y - x);
    if (best === null || compareUnitsDesc(key, bestKey) > 0) {
      best = subset;
      bestKey = key;
    }
  }
  return best;
}

// ─── 잔여 처리: 정확 합침 불가 청크들을 FFD로 묶어 택배/낱개/부분아웃박스 처리 ──

function finalizeResidualChunks(chunks: Chunk[]): PackedBox[] {
  if (chunks.length === 0) return [];

  // 덩어리 크기 내림차순 정렬 후 FFD 빈 패킹 (청크는 쪼개지 않음)
  const sorted = [...chunks].sort((a, b) => (b.units - a.units) || (b.size - a.size));
  const bins: Chunk[][] = [];
  const binSums: number[] = [];

  for (const chunk of sorted) {
    let placed = false;
    for (let i = 0; i < bins.length; i++) {
      if (binSums[i] + chunk.units <= OUTER_CAP) {
        bins[i].push(chunk);
        binSums[i] += chunk.units;
        placed = true;
        break;
      }
    }
    if (!placed) {
      bins.push([chunk]);
      binSums.push(chunk.units);
    }
  }

  return bins.map((binChunks, i) => {
    const allFlat = binChunks.flatMap(c => c.flat);
    const binSum = binSums[i];

    if (binSum === OUTER_CAP) {
      return { kind: 'outer' as const, contents: compressSized(allFlat), filled: true, weight: 0 };
    }
    const cuUnits = courierUnitsOf(allFlat);
    if (cuUnits <= COURIER_CAP) {
      const kind: PackedBox['kind'] = allFlat.length === 1 ? 'loose' : 'courier';
      return { kind, contents: compressSized(allFlat), filled: false, weight: 0 };
    }
    return { kind: 'outer' as const, contents: compressSized(allFlat), filled: false, weight: 0 };
  });
}

// ─── 메인 함수 ─────────────────────────────────────────────────────────────

/**
 * 제품별 인박스 분해 결과 → PackedBox[]
 * @param perProduct simulate.ts 에서 전달하는 SizedInnerCount[][]
 */
export function packIntoBoxes(perProduct: SizedInnerCount[][]): PackedBox[] {
  const result: PackedBox[] = [];

  // 1단계: 제품별 풀 아웃박스 추출 + 잔여 수집
  const allRemainders: FlatInner[] = [];
  for (const productItems of perProduct) {
    const { fullBoxes, remainder } = extractFullOuters(expandSized(productItems));
    result.push(...fullBoxes);
    allRemainders.push(...remainder);
  }
  if (allRemainders.length === 0) return result;

  // 2단계-a: (size,meter,fabric)별로 합쳐 풀 한 번 더 추출 → 같은 원단 우선, 사이즈별 잔여 <60 보장
  const bySize = new Map<string, FlatInner[]>();
  for (const item of allRemainders) {
    const key = `${item.fabric}_${item.size}_${item.meter}`;
    const arr = bySize.get(key);
    if (arr) arr.push(item);
    else bySize.set(key, [item]);
  }

  let chunks: Chunk[] = [];
  for (const flat of Array.from(bySize.values())) {
    const { fullBoxes, remainder } = extractFullOuters(flat);
    result.push(...fullBoxes);
    if (remainder.length > 0) {
      chunks.push({
        size: remainder[0].size,
        meter: remainder[0].meter,
        units: outerUnitsOf(remainder),
        flat: remainder,
      });
    }
  }

  // 2단계-b: 합침 그리디
  const residualChunks: Chunk[] = [];

  while (chunks.length > 0) {
    // 잔여 많은 순 (동률 시 큰 사이즈 먼저)
    chunks.sort((a, b) => (b.units - a.units) || (b.size - a.size));
    const seed = chunks[0];
    const others = chunks.slice(1);

    if (seed.units === OUTER_CAP) {
      // 방어적: 정확히 꽉 찬 덩어리는 풀 아웃박스
      result.push({ kind: 'outer', contents: compressSized(seed.flat), filled: true, weight: 0 });
      chunks = others;
      continue;
    }

    const gap = OUTER_CAP - seed.units;
    const fill = findExactFillSubset(others, gap);

    if (fill) {
      const merged = [...seed.flat, ...fill.flatMap(c => c.flat)];
      result.push({ kind: 'outer', contents: compressSized(merged), filled: true, weight: 0 });
      const remove = new Set<Chunk>([seed, ...fill]);
      chunks = chunks.filter(c => !remove.has(c));
    } else {
      // 정확 합침 불가 → 나머지 청크들과 함께 FFD로 처리
      residualChunks.push(seed);
      chunks = chunks.filter(c => c !== seed);
    }
  }

  // 잔여 청크 일괄 처리 (FFD로 묶어 부분아웃박스/택배/낱개 결정)
  result.push(...finalizeResidualChunks(residualChunks));

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
