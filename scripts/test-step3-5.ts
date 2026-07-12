/**
 * Phase 5 Step 3-5 통합 검증 스크립트 — 원단 혼합 + 오버행 + 슬롯초과가
 * 한 시나리오에서 동시에 걸리는 통합 회귀 테스트.
 *
 * 개별 단계 테스트(test-step3-2/3/4)는 각 관심사를 독립적으로 검증했다.
 * 이 스크립트는 그 관심사들이 함께 걸릴 때 서로 간섭하지 않는지를 단정한다.
 *
 * 시나리오:
 *   S1 동시발생  — 900나무 + 2종 원단 혼합 아웃박스 + 오버행(945×710), 슬롯 정상
 *   S2 슬롯초과  — 700나무 + 풀 아웃박스 21개 → 필요슬롯 21 > 최대 20 → overflow
 *   S3 경계값    — 700나무 + 풀 아웃박스 20개 → 필요슬롯 20 == 최대 20 → overflow=false (strict >)
 *   S4 불변식    — 풀박스 단위합=60, 제품수량 보존, 원단 relabel 무영향, 오버행 구조값 확인
 *
 * 실행:
 *   TS_NODE_BASEURL=. npx ts-node -r tsconfig-paths/register \
 *     --compiler-options '{"module":"commonjs","baseUrl":"."}' scripts/test-step3-5.ts
 */

import '@/scripts/fixture'; // 픽스처 하이드레이션 (Phase 6 — 반드시 첫 import)
import { simulate } from '@/lib/company/simulate';
import { INNER_UNITS } from '@/lib/company/data';
import { distinctFabricsByQty } from '@/lib/company/fabric';
import type { CompanyParams, CompanyResult, PackedBox } from '@/types/company';

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
function run(params: CompanyParams): CompanyResult {
  const outcome = simulate(params);
  if (!outcome.ok) throw new Error('unsupported: ' + JSON.stringify(outcome.unsupported));
  return outcome.result;
}

// ─── S1. 동시발생 — 900나무 + 혼합 원단 + 오버행, 슬롯 정상 ────────────────────
// B220 40×300 60개(30u) + B324 60×300 20개(15u) → 혼합 아웃박스 1개(45u)
{
  const r = run({ products: [P('B220', 40, 60), P('B324', 60, 20)], palletId: '900-wood' });

  check('S1 개수(아웃1·택배0·낱개0)',
    r.outerCount === 1 && r.courierCount === 0 && r.looseCount === 0,
    `outer=${r.outerCount} courier=${r.courierCount} loose=${r.looseCount}`);

  const outer = r.boxes.find(b => b.kind === 'outer');
  check('S1 혼합 원단 박스(B220+B324)',
    !!outer && isMixed(outer) && !outer.filled,
    outer ? `${distinctFabricsByQty(outer.contents).join('+')} filled=${outer.filled}` : 'none');

  const pl = r.pallet;
  check('S1 슬롯 정상(필요1 ≤ 최대30, overflow=false)',
    !!pl && pl.neededSlots === 1 && pl.maxSlots === 30 && pl.overflow === false,
    pl ? `need=${pl.neededSlots} max=${pl.maxSlots} overflow=${pl.overflow}` : 'no pallet');

  check('S1 오버행(945×710, overhangW=45)',
    !!pl && pl.overhangW === 45 && pl.overhangD === 0 && pl.footprintW === 945 && pl.footprintD === 710,
    pl ? `foot=${pl.footprintW}×${pl.footprintD} over=${pl.overhangW}×${pl.overhangD}` : 'no pallet');
}

// ─── S2. 슬롯 초과 — 700나무 + 풀 아웃박스 21개 → overflow ─────────────────────
// 110×300 840개 = 21 × 풀 아웃박스(40개/박스). 필요슬롯 21 > 최대 20.
{
  const r = run({ products: [P('B220', 110, 840)], palletId: '700-wood' });

  check('S2 풀 아웃박스 21개',
    r.outerCount === 21 && r.courierCount === 0 && r.looseCount === 0,
    `outer=${r.outerCount} courier=${r.courierCount} loose=${r.looseCount}`);

  const pl = r.pallet;
  check('S2 적재초과(필요21 > 최대20 → overflow=true)',
    !!pl && pl.neededSlots === 21 && pl.maxSlots === 20 && pl.overflow === true,
    pl ? `need=${pl.neededSlots} max=${pl.maxSlots} overflow=${pl.overflow}` : 'no pallet');

  check('S2 700나무 오버행 없음',
    !!pl && pl.overhangW === 0 && pl.overhangD === 0,
    pl ? `over=${pl.overhangW}×${pl.overhangD}` : 'no pallet');
}

// ─── S3. 경계값 — 700나무 + 풀 아웃박스 20개 → overflow=false (strict >) ───────
// 110×300 800개 = 20 × 풀 아웃박스. 필요슬롯 20 == 최대 20 → 20>20 은 false.
{
  const r = run({ products: [P('B220', 110, 800)], palletId: '700-wood' });

  check('S3 풀 아웃박스 20개',
    r.outerCount === 20 && r.courierCount === 0 && r.looseCount === 0,
    `outer=${r.outerCount} courier=${r.courierCount} loose=${r.looseCount}`);

  const pl = r.pallet;
  check('S3 경계값(필요20 == 최대20 → overflow=false)',
    !!pl && pl.neededSlots === 20 && pl.maxSlots === 20 && pl.overflow === false,
    pl ? `need=${pl.neededSlots} max=${pl.maxSlots} overflow=${pl.overflow}` : 'no pallet');
}

// ─── S4. 불변식 — 풀박스 단위합=60, 수량 보존, 원단 relabel 무영향, 오버행 구조값 ─
{
  const scenarios: CompanyParams[] = [
    { products: [P('B220', 40, 60), P('B324', 60, 20)], palletId: '900-wood' },
    { products: [P('B220', 110, 840)], palletId: '700-wood' },
    { products: [P('B220', 110, 800)], palletId: '700-wood' },
  ];

  let fullBad = 0;
  let qtyBad = 0;
  for (const c of scenarios) {
    const r = run(c);
    for (const b of r.boxes) if (b.filled && outerUnits(b) !== 60) fullBad++;
    const inputQty = c.products.reduce((a, p) => a + p.qty, 0);
    const packedQty = r.boxes.reduce(
      (a, b) => a + b.contents.reduce((s, ci) => s + ci.productQty, 0), 0,
    );
    if (inputQty !== packedQty) qtyBad++;
  }
  check('S4 풀박스 단위합=60 (전 시나리오)', fullBad === 0, `위반 ${fullBad}`);
  check('S4 제품 수량 보존 (전 시나리오)', qtyBad === 0, `위반 ${qtyBad}`);

  // relabel 무영향: S1의 두 원단을 이름만 바꿔도(distinct 관계 유지) 개수·무게 동일
  const orig = run({ products: [P('B220', 40, 60), P('B324', 60, 20)], palletId: '900-wood' });
  const relabeled = run({ products: [P('X1', 40, 60), P('Y2', 60, 20)], palletId: '900-wood' });
  const twO = orig.totalWeight;
  const twR = relabeled.totalWeight;
  const same =
    orig.outerCount === relabeled.outerCount &&
    orig.courierCount === relabeled.courierCount &&
    orig.looseCount === relabeled.looseCount &&
    twO !== null && twR !== null &&
    approx(twO, twR);
  check('S4 원단 relabel 무영향(개수·무게 동일)', same,
    `orig(o${orig.outerCount}/${twO?.toFixed(2)}) relabel(o${relabeled.outerCount}/${twR?.toFixed(2)})`);

  // 오버행 구조값: 700=0, 900=45 (원단·수량과 무관하게 파렛트 layout에서 결정)
  const p700 = run({ products: [P('B220', 110, 800)], palletId: '700-wood' }).pallet;
  const p900 = run({ products: [P('B220', 40, 60), P('B324', 60, 20)], palletId: '900-wood' }).pallet;
  check('S4 오버행 구조값(700=0, 900=45)',
    !!p700 && !!p900 && p700.overhangW === 0 && p900.overhangW === 45,
    `700=${p700?.overhangW} 900=${p900?.overhangW}`);
}

// ─── 요약 ─────────────────────────────────────────────────────────────────────
console.log('========================================================================');
console.log(`결과: PASS ${pass} · FAIL ${fail}`);
console.log('========================================================================');
if (fail > 0) process.exit(1);
