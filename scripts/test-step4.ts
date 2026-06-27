/**
 * Phase 5 Step 4 검증 스크립트
 * - 계획서 §5.1 신규 케이스: ℨ ℩
 * - 기존 합의 케이스: A B C D E
 * - 단품 케이스: 낙개 / 택배 / 아웃박스 경계
 * - 박스 내용물 상세(size/meter/kind/count/productQty) 정합성 검사
 *
 * 실행: npx ts-node -r tsconfig-paths/register --compiler-options '{"module":"commonjs"}' scripts/test-step4.ts
 */

import { simulate } from '@/lib/company/simulate';
import type { CompanyParams, SizedInnerCount } from '@/types/company';

function label(c: SizedInnerCount): string {
  return `${c.size}×${c.meter}m / ${c.kind}인박스 ×${c.count}(제품${c.productQty}개)`;
}

interface Expected {
  outerCount: number;
  courierCount: number;
  looseCount: number;
  note: string;
}

interface TestCase {
  name: string;
  params: CompanyParams;
  expected: Expected;
}

let pass = 0;
let fail = 0;

function run(tc: TestCase): void {
  const outcome = simulate(tc.params);
  if (!outcome.ok) {
    console.error(`❌ FAIL [${tc.name}]: unsupported product`);
    fail++;
    return;
  }
  const { outerCount, courierCount, looseCount, boxes } = outcome.result;
  const ok =
    outerCount === tc.expected.outerCount &&
    courierCount === tc.expected.courierCount &&
    looseCount === tc.expected.looseCount;

  if (ok) {
    console.log(`✅ PASS [${tc.name}]  → outer=${outerCount} courier=${courierCount} loose=${looseCount}  (${tc.expected.note})`);
    for (const b of boxes) {
      const detail = b.contents.map(label).join(' | ');
      console.log(`       ${b.kind}(filled=${b.filled}): ${detail}`);
    }
    pass++;
  } else {
    console.error(`❌ FAIL [${tc.name}]`);
    console.error(`   expected: outer=${tc.expected.outerCount} courier=${tc.expected.courierCount} loose=${tc.expected.looseCount}`);
    console.error(`   got:      outer=${outerCount} courier=${courierCount} loose=${looseCount}`);
    for (const b of boxes) {
      const detail = b.contents.map(label).join(' | ');
      console.error(`   box ${b.kind}(filled=${b.filled}): ${detail}`);
    }
    fail++;
  }
}

const cases: TestCase[] = [
  // ·· 계획서 §5.1 신규 핵심 케이스
  { name: 'ℨ 40×300×90 + 60×300×100 → 아웃박스 2개(합치)',
    params: { products: [{ size: 40, meter: 300, qty: 90 }, { size: 60, meter: 300, qty: 100 }], palletId: null },
    expected: { outerCount: 2, courierCount: 0, looseCount: 0, note: '잔여 4×145=60, allFull→합치' } },
  { name: '℩ 40×300×90 + 60×300×120 → 분리 outer2 courier1',
    params: { products: [{ size: 40, meter: 300, qty: 90 }, { size: 60, meter: 300, qty: 120 }], palletId: null },
    expected: { outerCount: 2, courierCount: 1, looseCount: 0, note: '잔여 bin[60,15] 빈칸→분리' } },
  // ·· 기존 합의 케이스 A~E
  { name: 'A 40×300×30 + 60×300×60 → 아웃박스 1개(섬음)',
    params: { products: [{ size: 40, meter: 300, qty: 30 }, { size: 60, meter: 300, qty: 60 }], palletId: null },
    expected: { outerCount: 1, courierCount: 0, looseCount: 0, note: '잔여 4×145=60→합치' } },
  { name: 'B 40×300×60 + 60×300×40 → 아웃박스 1개(섬음)',
    params: { products: [{ size: 40, meter: 300, qty: 60 }, { size: 60, meter: 300, qty: 40 }], palletId: null },
    expected: { outerCount: 1, courierCount: 0, looseCount: 0, note: '잔여 4×145=60→합치' } },
  { name: 'C 40×300×90 + 60×300×30 → outer1 courier1',
    params: { products: [{ size: 40, meter: 300, qty: 90 }, { size: 60, meter: 300, qty: 30 }], palletId: null },
    expected: { outerCount: 1, courierCount: 1, looseCount: 0, note: '빈칸→분리: 40→아웃 60→택배' } },
  { name: 'D 40×300×210 + 60×300×100 → 아웃박스 3개',
    params: { products: [{ size: 40, meter: 300, qty: 210 }, { size: 60, meter: 300, qty: 100 }], palletId: null },
    expected: { outerCount: 3, courierCount: 0, looseCount: 0, note: '필1+필1+잔여합예상→합치1' } },
  { name: 'E 40×300×180 + 60×300×40 → 아웃박스 2개',
    params: { products: [{ size: 40, meter: 300, qty: 180 }, { size: 60, meter: 300, qty: 40 }], palletId: null },
    expected: { outerCount: 2, courierCount: 0, looseCount: 0, note: '필1+잔여합예상→합치1' } },
  // ·· 단품 경계 케이스
  { name: '단품 40×300×30 → 낙개 1개',
    params: { products: [{ size: 40, meter: 300, qty: 30 }], palletId: null },
    expected: { outerCount: 0, courierCount: 0, looseCount: 1, note: '145×1=15unit→loose' } },
  { name: '단품 40×300×120 → 아웃박스 1개(풀)',
    params: { products: [{ size: 40, meter: 300, qty: 120 }], palletId: null },
    expected: { outerCount: 1, courierCount: 0, looseCount: 0, note: '145×4=60unit→full' } },
  { name: '단품 40×300×50 → 택배 1개',
    params: { products: [{ size: 40, meter: 300, qty: 50 }], palletId: null },
    expected: { outerCount: 0, courierCount: 1, looseCount: 0, note: '145+95=8unit≤12→courier' } },
  { name: '단품 40×300×150 → 아웃박스풀1+낙개1',
    params: { products: [{ size: 40, meter: 300, qty: 150 }], palletId: null },
    expected: { outerCount: 1, courierCount: 0, looseCount: 1, note: '145×5: 풀1+잔여퀔1→loose' } },
  { name: '단품 60×300×80 → 아웃박스 1개(풀)',
    params: { products: [{ size: 60, meter: 300, qty: 80 }], palletId: null },
    expected: { outerCount: 1, courierCount: 0, looseCount: 0, note: '145×4=60unit→full' } },
  { name: '단품 110×300×40 → 아웃박스 1개(풀)',
    params: { products: [{ size: 110, meter: 300, qty: 40 }], palletId: null },
    expected: { outerCount: 1, courierCount: 0, looseCount: 0, note: '145×4=60unit→full' } },
  { name: '단품 110×300×10 → 낙개 1개',
    params: { products: [{ size: 110, meter: 300, qty: 10 }], palletId: null },
    expected: { outerCount: 0, courierCount: 0, looseCount: 1, note: '145×1=15unit→loose' } },
];

console.log('='.repeat(70));
console.log('Phase 5 Step 4 검증 스크립트');
console.log('='.repeat(70));

for (const tc of cases) {
  console.log('-'.repeat(60));
  run(tc);
}

console.log('');
console.log('='.repeat(70));
console.log(`결과: ${pass}/${pass + fail} 통과`);
if (fail > 0) {
  console.error(`실패: ${fail}개`);
  process.exit(1);
} else {
  console.log('전체 통과 ✅');
}
