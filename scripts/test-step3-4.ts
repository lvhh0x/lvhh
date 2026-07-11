/**
 * Phase 5 Step 3-4 검증 스크립트 — 원단(fabric) 그룹핑 + 라벨 목록 + 무게 분해
 *
 * 검증 항목:
 *   A. 원단 그룹핑 성공기준 4케이스 (개수 + 혼합 여부)
 *   B. 불변식: 풀 아웃박스 단위합=60, 제품 수량 보존
 *   C. distinctFabricsByQty 정렬(수량 desc, 동률 등장순)·distinct
 *   D. 무게 분해: 총무게 = 적재무게 + 파렛트무게, pallet.weight == totalWeight
 *   E. 균일 원단 relabel은 '미지정'과 동일 결과 (원단은 grouping 동일 시 passthrough)
 *
 * 실행:
 *   TS_NODE_BASEURL=. npx ts-node -r tsconfig-paths/register \
 *     --compiler-options '{"module":"commonjs","baseUrl":"."}' scripts/test-step3-4.ts
 */

import '@/scripts/fixture'; // 픽스처 하이드레이션 (Phase 6 — 반드시 첫 import)
import { simulate } from '@/lib/company/simulate';
import { INNER_UNITS, findPallet } from '@/lib/company/data';
import { distinctFabricsByQty } from '@/lib/company/fabric';
import type { CompanyParams, PackedBox, SizedInnerCount } from '@/types/company';

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    console.log(`PASS [${name}] ${detail}`);
    pass++;
  } else {
    console.error(`FAIL [${name}] ${detail}`);
    fail++;
  }
}

const P = (fabric: string, size: number, qty: number) => ({ fabric, size, meter: 300, qty });
const approx = (a: number, b: number) => Math.abs(a - b) < 1e-6;

function outerUnits(b: PackedBox): number {
  return b.contents.reduce((acc, c) => acc + INNER_UNITS[c.kind].outer * c.count, 0);
}
function isMixed(b: PackedBox): boolean {
  return distinctFabricsByQty(b.contents).length >= 2;
}
function run(params: CompanyParams) {
  const outcome = simulate(params);
  if (!outcome.ok) throw new Error('unsupported');
  return outcome.result;
}

// ─── A. 원단 그룹핑 성공기준 ──────────────────────────────────────────────────

// 1) B220 110×300 30개(45u) + B325 110×300 30개(45u) → outer 2, 안 섞임
{
  const r = run({ products: [P('B220', 110, 30), P('B325', 110, 30)], palletId: null });
  check('1 안섞임 개수', r.outerCount === 2 && r.courierCount === 0 && r.looseCount === 0,
    `outer=${r.outerCount} courier=${r.courierCount} loose=${r.looseCount}`);
  check('1 혼합 없음', r.boxes.every(b => !isMixed(b)),
    r.boxes.map(b => distinctFabricsByQty(b.contents).join('+')).join(' / '));
}

// 2) B220 40×300 60개(30u) + B324 60×300 20개(15u) → outer 1(혼합), 45u
{
  const r = run({ products: [P('B220', 40, 60), P('B324', 60, 20)], palletId: null });
  check('2 섞임 개수', r.outerCount === 1 && r.courierCount === 0 && r.looseCount === 0,
    `outer=${r.outerCount} courier=${r.courierCount} loose=${r.looseCount}`);
  const mixedBox = r.boxes.find(b => b.kind === 'outer');
  check('2 혼합 박스', !!mixedBox && isMixed(mixedBox),
    mixedBox ? distinctFabricsByQty(mixedBox.contents).join('+') : 'none');
}

// 3) B220 60×300 40개(30u) + B325 110×300 20개(30u) + B324 40×300 60개(30u)
//    → outer 1(풀·혼합) + courier 1
{
  const r = run({ products: [P('B220', 60, 40), P('B325', 110, 20), P('B324', 40, 60)], palletId: null });
  check('3 개수', r.outerCount === 1 && r.courierCount === 1 && r.looseCount === 0,
    `outer=${r.outerCount} courier=${r.courierCount} loose=${r.looseCount}`);
  const full = r.boxes.find(b => b.kind === 'outer' && b.filled);
  check('3 풀 아웃박스 혼합', !!full && isMixed(full),
    full ? distinctFabricsByQty(full.contents).join('+') : 'none');
}

// 4) 같은 원단으로 60 채워지면 안 섞음: B220 40×300 120개(풀60u) + B325 40×300 120개(풀60u) → outer 2 단일원단
{
  const r = run({ products: [P('B220', 40, 120), P('B325', 40, 120)], palletId: null });
  check('4 각자 풀 개수', r.outerCount === 2 && r.courierCount === 0 && r.looseCount === 0,
    `outer=${r.outerCount} courier=${r.courierCount} loose=${r.looseCount}`);
  check('4 둘 다 단일원단·풀', r.boxes.every(b => b.filled && !isMixed(b)),
    r.boxes.map(b => distinctFabricsByQty(b.contents).join('+')).join(' / '));
}

// ─── B. 불변식 (전 케이스 공통) ───────────────────────────────────────────────
{
  const cases: CompanyParams[] = [
    { products: [P('B220', 110, 30), P('B325', 110, 30)], palletId: null },
    { products: [P('B220', 40, 60), P('B324', 60, 20)], palletId: null },
    { products: [P('B220', 60, 40), P('B325', 110, 20), P('B324', 40, 60)], palletId: null },
    { products: [P('B220', 40, 120), P('B325', 40, 120)], palletId: null },
  ];
  let fullBad = 0, qtyBad = 0;
  for (const c of cases) {
    const r = run(c);
    for (const b of r.boxes) if (b.filled && outerUnits(b) !== 60) fullBad++;
    const inputQty = c.products.reduce((a, p) => a + p.qty, 0);
    const packedQty = r.boxes.reduce((a, b) => a + b.contents.reduce((s, ci) => s + ci.productQty, 0), 0);
    if (inputQty !== packedQty) qtyBad++;
  }
  check('B 풀박스 단위합=60', fullBad === 0, `위반 ${fullBad}`);
  check('B 제품 수량 보존', qtyBad === 0, `위반 ${qtyBad}`);
}

// ─── C. distinctFabricsByQty 정렬/ distinct ──────────────────────────────────
{
  const mk = (fabric: string, productQty: number): SizedInnerCount =>
    ({ fabric, size: 40, meter: 300, kind: 145, count: 1, productQty });

  // 수량 desc: B220(60) > B324(30+15=45)
  const r1 = distinctFabricsByQty([mk('B324', 30), mk('B220', 60), mk('B324', 15)]);
  check('C 수량 desc + distinct', JSON.stringify(r1) === JSON.stringify(['B220', 'B324']), r1.join('+'));

  // 동률 → 등장순
  const r2 = distinctFabricsByQty([mk('X', 10), mk('Y', 10)]);
  check('C 동률 등장순', JSON.stringify(r2) === JSON.stringify(['X', 'Y']), r2.join('+'));

  // 단일
  const r3 = distinctFabricsByQty([mk('B220', 5)]);
  check('C 단일', JSON.stringify(r3) === JSON.stringify(['B220']), r3.join('+'));
}

// ─── D. 무게 분해: 총무게 = 적재무게 + 파렛트무게 ─────────────────────────────
{
  const products = [P('미지정', 110, 840)];
  const noPallet = run({ products, palletId: null });
  const withPallet = run({ products, palletId: '900-wood' });
  const palletTare = findPallet('900-wood')!.tare; // 12.4
  const delta = withPallet.totalWeight - noPallet.totalWeight;

  check('D 총무게 증분 = 파렛트tare', approx(delta, palletTare),
    `delta=${delta.toFixed(2)} tare=${palletTare}`);
  check('D pallet.weight == totalWeight', !!withPallet.pallet && approx(withPallet.pallet.weight, withPallet.totalWeight),
    withPallet.pallet ? `${withPallet.pallet.weight.toFixed(2)}=${withPallet.totalWeight.toFixed(2)}` : 'no pallet');
  check('D 적재무게 = 총 − 파렛트 (양수)', withPallet.totalWeight - palletTare > 0,
    `load=${(withPallet.totalWeight - palletTare).toFixed(2)}`);
}

// ─── E. 균일 원단 relabel == '미지정' (grouping 동일 시 passthrough) ───────────
{
  const base: [string, number, number][] = [['', 40, 210], ['', 60, 100]];
  const a = run({ products: base.map(([, s, q]) => P('미지정', s, q)), palletId: '1100-wood' });
  const b = run({ products: base.map(([, s, q]) => P('B999', s, q)), palletId: '1100-wood' });
  const same =
    a.outerCount === b.outerCount &&
    a.courierCount === b.courierCount &&
    a.looseCount === b.looseCount &&
    approx(a.totalWeight, b.totalWeight);
  check('E 균일 원단 = 미지정 동일결과', same,
    `A(o${a.outerCount}/c${a.courierCount}/l${a.looseCount}/${a.totalWeight.toFixed(2)}) B(o${b.outerCount}/c${b.courierCount}/l${b.looseCount}/${b.totalWeight.toFixed(2)})`);
}

// ─── 요약 ─────────────────────────────────────────────────────────────────────
console.log('========================================================================');
console.log(`결과: PASS ${pass} · FAIL ${fail}`);
console.log('========================================================================');
if (fail > 0) process.exit(1);
