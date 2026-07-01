/**
 * Phase 5 Step 3 / Step 2 검증 스크립트 — 규격·오버행 엔진 (overhang.ts)
 *
 * 검증 항목:
 *   · O1~O5: 파렛트별 footprint / overhang 기대값 일치
 *   · 불변식: cols × rows == boxesPerLayer
 *   · 불변식: footprintW == max(pallet.w, arrW), overhangW == max(0, arrW − pallet.w) (D도 동일)
 *
 * 실행:
 *   npx ts-node -r tsconfig-paths/register --compiler-options '{"module":"commonjs"}' scripts/test-step3-2.ts
 */

import { PALLETS, getOuterBoxSpec } from '@/lib/company/data';
import { calcFootprint } from '@/lib/company/overhang';

interface Expected {
  footprintW: number;
  footprintD: number;
  overhangW: number;
  overhangD: number;
}

const outer = getOuterBoxSpec('outer'); // 355 × 315

const cases: { id: string; expected: Expected }[] = [
  { id: '700-wood',       expected: { footprintW: 710,  footprintD: 750,  overhangW: 0,  overhangD: 0 } },
  { id: '900-wood',       expected: { footprintW: 945,  footprintD: 710,  overhangW: 45, overhangD: 0 } },
  { id: '1100-wood',      expected: { footprintW: 1100, footprintD: 1100, overhangW: 0,  overhangD: 0 } },
  { id: '1100-plastic-a', expected: { footprintW: 1100, footprintD: 1100, overhangW: 0,  overhangD: 0 } },
  { id: '1100-plastic-b', expected: { footprintW: 1100, footprintD: 1100, overhangW: 0,  overhangD: 0 } },
];

let pass = 0;
let fail = 0;

console.log('========================================================================');
console.log('Phase 5 Step 3 / Step 2 — 규격·오버행 엔진 검증');
console.log(`아웃박스 규격: ${outer.w} × ${outer.d} mm`);
console.log('========================================================================\n');

for (const tc of cases) {
  const pallet = PALLETS.find((p) => p.id === tc.id);
  if (!pallet) {
    console.error(`FAIL [${tc.id}]: 파렛트 없음`);
    fail++;
    continue;
  }

  // 불변식 1: cols × rows == boxesPerLayer
  const cr = pallet.layout.cols * pallet.layout.rows;
  const invLayout = cr === pallet.boxesPerLayer;

  const fp = calcFootprint(pallet, outer);
  const e = tc.expected;

  const okFp =
    fp.footprintW === e.footprintW &&
    fp.footprintD === e.footprintD &&
    fp.overhangW === e.overhangW &&
    fp.overhangD === e.overhangD;

  // 불변식 2: footprint/overhang 재계산 일치
  const arrW = pallet.layout.rotated ? pallet.layout.cols * outer.d : pallet.layout.cols * outer.w;
  const arrD = pallet.layout.rotated ? pallet.layout.rows * outer.w : pallet.layout.rows * outer.d;
  const invRecalc =
    fp.footprintW === Math.max(pallet.w, arrW) &&
    fp.overhangW === Math.max(0, arrW - pallet.w) &&
    fp.footprintD === Math.max(pallet.d, arrD) &&
    fp.overhangD === Math.max(0, arrD - pallet.d);

  const ok = okFp && invLayout && invRecalc;
  if (ok) pass++;
  else fail++;

  const rot = pallet.layout.rotated ? '90°회전' : '무회전';
  console.log(`${ok ? 'PASS' : 'FAIL'} [${tc.id}] (${pallet.w}×${pallet.d}, ${pallet.layout.cols}×${pallet.layout.rows} ${rot})`);
  console.log(`     배열총폭 ${arrW}×${arrD} → footprint ${fp.footprintW}×${fp.footprintD} / overhang ${fp.overhangW},${fp.overhangD}`);
  if (!okFp) console.log(`     ✗ 기대 footprint ${e.footprintW}×${e.footprintD} / overhang ${e.overhangW},${e.overhangD}`);
  if (!invLayout) console.log(`     ✗ cols×rows(${cr}) != boxesPerLayer(${pallet.boxesPerLayer})`);
  if (!invRecalc) console.log('     ✗ 재계산 불변식 불일치');
  console.log('');
}

console.log('========================================================================');
console.log(`결과: ${pass}/${pass + fail} 통과`);
console.log(fail === 0 ? '전체 통과' : `${fail}건 실패`);
console.log('========================================================================');

process.exit(fail === 0 ? 0 : 1);
