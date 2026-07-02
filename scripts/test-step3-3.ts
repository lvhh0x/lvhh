/**
 * Phase 5 Step 3-3 검증 스크립트 — 파렛트 슬롯·오버플로우 (pallet.ts)
 *
 * 검증 항목:
 *   · S1~S9: 필요슬롯 / overflow / 층수 / 마지막층 슬롯 / 높이 기대값 일치
 *   · slotKindAt: 채움 순서(아웃→택배→낱개→빈칸) 판정
 *   · 불변식: neededSlots = slotOuter+slotCourier+slotLoose, maxSlots = bpl×5,
 *             layers = ceil(neededSlots/bpl), height = pallet.h + 315×layers
 *
 * 실행:
 *   npx ts-node -r tsconfig-paths/register --compiler-options '{"module":"commonjs"}' scripts/test-step3-3.ts
 */

import { findPallet } from '@/lib/company/data';
import { calcPallet, slotKindAt } from '@/lib/company/pallet';
import type { OuterBoxCounts } from '@/lib/company/pallet';
import type { SlotKind } from '@/types/company';

interface Case {
  name: string;
  palletId: string;
  counts: OuterBoxCounts;
  expect: {
    neededSlots: number;
    overflow: boolean;
    layers?: number;
    lastLayerSlots?: number;
    height?: number;
  };
}

const c = (
  outerCount: number,
  courierCount = 0,
  looseCount = 0,
): OuterBoxCounts => ({ outerCount, courierCount, looseCount });

const cases: Case[] = [
  { name: 'S1 700 아웃20 (경계 OK)',       palletId: '700-wood', counts: c(20),        expect: { neededSlots: 20, overflow: false } },
  { name: 'S2 700 아웃21 (초과)',          palletId: '700-wood', counts: c(21),        expect: { neededSlots: 21, overflow: true } },
  { name: 'S3 900 아웃30 (경계 OK)',       palletId: '900-wood', counts: c(30),        expect: { neededSlots: 30, overflow: false } },
  { name: 'S4 900 아웃31 (초과)',          palletId: '900-wood', counts: c(31),        expect: { neededSlots: 31, overflow: true } },
  { name: 'S5 700 아웃18+택배2',           palletId: '700-wood', counts: c(18, 2),     expect: { neededSlots: 20, overflow: false, layers: 5, lastLayerSlots: 4, height: 140 + 315 * 5 } },
  { name: 'S6 700 아웃18+택배5 (초과)',    palletId: '700-wood', counts: c(18, 5),     expect: { neededSlots: 23, overflow: true } },
  { name: 'S7 700 낱개3 (ceil=2슬롯)',     palletId: '700-wood', counts: c(0, 0, 3),   expect: { neededSlots: 2, overflow: false } },
  { name: 'S8 700 아웃16+택배2+낱개3',     palletId: '700-wood', counts: c(16, 2, 3),  expect: { neededSlots: 20, overflow: false } },
  { name: 'S9 1100 아웃45 (경계 OK)',      palletId: '1100-wood', counts: c(45),       expect: { neededSlots: 45, overflow: false } },
  { name: 'S9b 1100 아웃46 (초과)',        palletId: '1100-wood', counts: c(46),       expect: { neededSlots: 46, overflow: true } },
];

let pass = 0;
let fail = 0;

function check(label: string, actual: unknown, expected: unknown): void {
  const ok = actual === expected;
  if (ok) pass++;
  else fail++;
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`  [${mark}] ${label}: 기대=${String(expected)} 실제=${String(actual)}`);
}

console.log('========================================================================');
console.log('Phase 5 Step 3-3 — 파렛트 슬롯·오버플로우 검증');
console.log('========================================================================\n');

for (const t of cases) {
  const pallet = findPallet(t.palletId);
  if (!pallet) { console.log(`  [FAIL] ${t.name}: 파렛트 없음`); fail++; continue; }

  const stack = calcPallet(t.counts, pallet, 0); // stackWeight=0 → weight = pallet.tare
  if (!stack) { console.log(`  [FAIL] ${t.name}: null 반환`); fail++; continue; }

  console.log(t.name);
  check('필요슬롯', stack.neededSlots, t.expect.neededSlots);
  check('overflow', stack.overflow, t.expect.overflow);
  if (t.expect.layers !== undefined)         check('층수', stack.layers, t.expect.layers);
  if (t.expect.lastLayerSlots !== undefined) check('마지막층슬롯', stack.lastLayerSlots, t.expect.lastLayerSlots);
  if (t.expect.height !== undefined)         check('높이', stack.height, t.expect.height);

  // 불변식
  check('불변: needed=합', stack.neededSlots, stack.slotOuter + stack.slotCourier + stack.slotLoose);
  check('불변: maxSlots=bpl×5', stack.maxSlots, stack.boxesPerLayer * 5);
  check('불변: layers=ceil', stack.layers, Math.ceil(stack.neededSlots / stack.boxesPerLayer));
  check('불변: height식', stack.height, pallet.h + 315 * stack.layers);
  check('불변: weight=tare', stack.weight, pallet.tare);
  console.log('');
}

// slotKindAt 순서 검증 (S8: 아웃16 택배2 낱개2 → 빈칸)
console.log('slotKindAt 순서 검증 (아웃16·택배2·낱개2)');
const s8 = { slotOuter: 16, slotCourier: 2, slotLoose: 2 };
const kindTests: { idx: number; expect: SlotKind }[] = [
  { idx: 0,  expect: 'outer' },
  { idx: 15, expect: 'outer' },
  { idx: 16, expect: 'courier' },
  { idx: 17, expect: 'courier' },
  { idx: 18, expect: 'loose' },
  { idx: 19, expect: 'loose' },
  { idx: 20, expect: 'empty' },
];
for (const k of kindTests) check(`slot[${k.idx}]`, slotKindAt(k.idx, s8), k.expect);

console.log('\n========================================================================');
console.log(`결과: PASS ${pass} · FAIL ${fail}`);
console.log('========================================================================');
process.exit(fail > 0 ? 1 : 0);
