/**
 * Phase 5 Step 2 검증 스크립트 (새 규칙: 사이즈 보존 + 정확-합침)
 *
 * 검증 항목:
 *   · 박스 개수(outer/courier/loose) 기대값 일치
 *   · 풀(filled) 아웃박스의 단위 합 = 60 불변식
 *   · 제품 수량 보존 불변식 (입력 총 제품수 == 박스 내용물 productQty 합)
 *
 * 케이스:
 *   1~14  기존 합의/단품 경계 (새 규칙 기준 재확인)
 *   15~17 HANDOFF §4.4 예시 A/B/C
 *   18    3사이즈 혼합 합침
 *   19    낱개 버그 회귀 (finalizeResidualChunks)
 *
 * 실행: npx ts-node -r tsconfig-paths/register --compiler-options '{"module":"commonjs"}' scripts/test-step4.ts
 */

import { simulate } from '@/lib/company/simulate';
import { INNER_UNITS } from '@/lib/company/data';
import type { CompanyParams, SizedInnerCount, PackedBox } from '@/types/company';

function label(c: SizedInnerCount): string {
  return `${c.size}x${c.meter}m/${c.kind}인박스x${c.count}(제품${c.productQty}개)`;
}

function outerUnits(b: PackedBox): number {
  return b.contents.reduce((acc, c) => acc + INNER_UNITS[c.kind].outer * c.count, 0);
}

interface Expected { outer: number; courier: number; loose: number; note: string; }
interface TestCase { name: string; params: CompanyParams; expected: Expected; }

let pass = 0;
let fail = 0;

function run(tc: TestCase): void {
  const outcome = simulate(tc.params);
  if (!outcome.ok) {
    console.error(`FAIL [${tc.name}]: unsupported product`);
    fail++;
    return;
  }
  const { outerCount, courierCount, looseCount, boxes } = outcome.result;

  // 불변식 1: 풀 아웃박스 단위합 = 60
  const fullBad = boxes.filter(b => b.filled && outerUnits(b) !== 60);
  // 불변식 2: 제품 수량 보존
  const inputQty = tc.params.products.reduce((a, p) => a + p.qty, 0);
  const packedQty = boxes.reduce((a, b) => a + b.contents.reduce((s, c) => s + c.productQty, 0), 0);

  const ok =
    outerCount === tc.expected.outer &&
    courierCount === tc.expected.courier &&
    looseCount === tc.expected.loose &&
    fullBad.length === 0 &&
    inputQty === packedQty;

  if (ok) {
    console.log(`PASS [${tc.name}] -> outer=${outerCount} courier=${courierCount} loose=${looseCount}  (${tc.expected.note})`);
    for (const b of boxes) {
      console.log(`       ${b.kind}(filled=${b.filled},${outerUnits(b)}u): ${b.contents.map(label).join(' | ')}`);
    }
    pass++;
  } else {
    console.error(`FAIL [${tc.name}]`);
    console.error(`   expected: outer=${tc.expected.outer} courier=${tc.expected.courier} loose=${tc.expected.loose}`);
    console.error(`   got:      outer=${outerCount} courier=${courierCount} loose=${looseCount}`);
    if (fullBad.length > 0) console.error(`   ! 풀 아웃박스 단위!=60: ${fullBad.map(outerUnits).join(',')}`);
    if (inputQty !== packedQty) console.error(`   ! 수량보존 위반: 입력 ${inputQty} != 패킹 ${packedQty}`);
    for (const b of boxes) {
      console.error(`   box ${b.kind}(filled=${b.filled},${outerUnits(b)}u): ${b.contents.map(label).join(' | ')}`);
    }
    fail++;
  }
}

const P = (size: number, qty: number) => ({ fabric: '미지정', size, meter: 300, qty });

const cases: TestCase[] = [
  // ── 1~7 다품목 합의 케이스
  { name: '1 40x90 + 60x100', params: { products: [P(40,90), P(60,100)], palletId: null },
    expected: { outer: 2, courier: 0, loose: 0, note: '40잔여45 + 60(풀1,잔여15) -> 합침' } },
  { name: '2 40x90 + 60x120', params: { products: [P(40,90), P(60,120)], palletId: null },
    expected: { outer: 2, courier: 1, loose: 0, note: '60풀1 + 40잔여45 단독 outer + 60잔여30 택배' } },
  { name: '3 40x30 + 60x60', params: { products: [P(40,30), P(60,60)], palletId: null },
    expected: { outer: 1, courier: 0, loose: 0, note: '60잔여45 + 40잔여15 = 60 합침' } },
  { name: '4 40x60 + 60x40', params: { products: [P(40,60), P(60,40)], palletId: null },
    expected: { outer: 1, courier: 0, loose: 0, note: '40잔여30 + 60잔여30 = 60 합침' } },
  { name: '5 40x90 + 60x30', params: { products: [P(40,90), P(60,30)], palletId: null },
    expected: { outer: 1, courier: 1, loose: 0, note: '40잔여45 단독 outer / 60잔여 택배' } },
  { name: '6 40x210 + 60x100', params: { products: [P(40,210), P(60,100)], palletId: null },
    expected: { outer: 3, courier: 0, loose: 0, note: '풀1+풀1 + (40잔여45+60잔여15) 합침' } },
  { name: '7 40x180 + 60x40', params: { products: [P(40,180), P(60,40)], palletId: null },
    expected: { outer: 2, courier: 0, loose: 0, note: '풀1 + (40잔여30+60잔여30) 합침' } },
  // ── 8~14 단품 경계
  { name: '8 단품 40x30', params: { products: [P(40,30)], palletId: null },
    expected: { outer: 0, courier: 0, loose: 1, note: '145x1=15u -> 낱개' } },
  { name: '9 단품 40x120', params: { products: [P(40,120)], palletId: null },
    expected: { outer: 1, courier: 0, loose: 0, note: '145x4=60 풀' } },
  { name: '10 단품 40x50', params: { products: [P(40,50)], palletId: null },
    expected: { outer: 0, courier: 1, loose: 0, note: '145x1+95x1 택배8u' } },
  { name: '11 단품 40x150', params: { products: [P(40,150)], palletId: null },
    expected: { outer: 1, courier: 0, loose: 1, note: '풀1 + 잔여 145x1 낱개' } },
  { name: '12 단품 60x80', params: { products: [P(60,80)], palletId: null },
    expected: { outer: 1, courier: 0, loose: 0, note: '145x4=60 풀' } },
  { name: '13 단품 110x40', params: { products: [P(110,40)], palletId: null },
    expected: { outer: 1, courier: 0, loose: 0, note: '145x4=60 풀' } },
  { name: '14 단품 110x10', params: { products: [P(110,10)], palletId: null },
    expected: { outer: 0, courier: 0, loose: 1, note: '145x1=15u 낱개' } },
  // ── 15~17 HANDOFF §4.4 예시
  { name: '15 §4.4-A 40x180 + 110x50 + 60x40', params: { products: [P(40,180), P(110,50), P(60,40)], palletId: null },
    expected: { outer: 3, courier: 0, loose: 1, note: '풀2 + (40잔여30+60잔여30)합침 / 110잔여 낱개' } },
  { name: '16 §4.4-B 40x210 + 110x20 + 60x20', params: { products: [P(40,210), P(110,20), P(60,20)], palletId: null },
    expected: { outer: 2, courier: 1, loose: 0, note: '풀1 + (40잔여45+60잔여15)합침 / 110잔여 택배' } },
  { name: '17 §4.4-C 110x30 + 40x60', params: { products: [P(110,30), P(40,60)], palletId: null },
    expected: { outer: 1, courier: 1, loose: 0, note: '110잔여45 단독 outer / 40잔여 택배' } },
  // ── 18 3사이즈 혼합 합침
  { name: '18 3사이즈 40x60 + 60x20 + 110x10', params: { products: [P(40,60), P(60,20), P(110,10)], palletId: null },
    expected: { outer: 1, courier: 0, loose: 0, note: '40잔여30 + (60잔여15+110잔여15)=60 합침' } },
  // ── 19 낱개 버그 회귀 (finalizeResidualChunks): 정확합침 불가 잔여를 FFD로 묶어 부분 아웃박스1
  { name: '19 낱개버그회귀 40x20 + 60x20 + 110x10', params: { products: [P(40,20), P(60,20), P(110,10)], palletId: null },
    expected: { outer: 1, courier: 0, loose: 0, note: '잔여 40u(60미달)·courier13u(12초과) -> 부분 아웃박스1(filled=false), 낱개0' } },
];

console.log('='.repeat(72));
console.log('Phase 5 Step 2 검증 (새 규칙: 사이즈 보존 + 정확-합침)');
console.log('='.repeat(72));

for (const tc of cases) {
  console.log('-'.repeat(64));
  run(tc);
}

console.log('');
console.log('='.repeat(72));
console.log(`결과: ${pass}/${pass + fail} 통과`);
if (fail > 0) {
  console.error(`실패: ${fail}개`);
  process.exit(1);
} else {
  console.log('전체 통과');
}
