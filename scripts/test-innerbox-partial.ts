/**
 * 버그 #1 회귀 — 인박스 표시 수량은 박스 수용량이 아니라 실제 담긴 롤 수여야 한다.
 * (2026-07-15 박스시뮬레이션개선: 8개 입력이 "(10개)"로, 17개가 "(20개)"로
 *  표시되던 결함. 원인 innerbox.ts productQty = count × cap.)
 *
 * 검증:
 *   A. decomposeToInnerBoxes: 부분 박스 productQty = 실제 잔여(수용량 아님), 경계값
 *   B. 불변식: 모든 항목 productQty 합 == 입력 qty (배수 아닌 수량 포함)
 *   C. 통합(simulate): 단일-종류 제품의 같은-종류 부분 박스가 아웃박스에서
 *      compressSized로 잘못 합쳐지지 않는다 (110×300 25개 → 패킹합=25)
 *
 * 실행: npx ts-node -r tsconfig-paths/register --compiler-options '{"module":"commonjs"}' scripts/test-innerbox-partial.ts
 */

import '@/scripts/fixture'; // 픽스처 하이드레이션 (반드시 첫 import)
import { decomposeToInnerBoxes } from '@/lib/company/innerbox';
import { simulate } from '@/lib/company/simulate';
import type { ProductSpec, InnerBoxKind } from '@/types/company';

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

// 40×300 공통: 145=30 / 95=20 / 60=10 (세 종류)
const three: ProductSpec = {
  fabric: null, size: 40, meter: 300, fullOuterQty: 120, fullOuterWeight: null,
  defaultInner: 145, innerCapacity: { 145: 30, 95: 20, 60: 10 },
};
// 단일 종류(145=10)만 — 실제 DB 대다수 치수의 형태 (110×300)
const one145: ProductSpec = {
  fabric: null, size: 110, meter: 300, fullOuterQty: 40, fullOuterWeight: null,
  defaultInner: 145, innerCapacity: { 145: 10, 95: null, 60: null },
};

interface Row { kind: InnerBoxKind; count: number; productQty: number; }
const shape = (rows: Row[]): Row[] =>
  rows.map(r => ({ kind: r.kind, count: r.count, productQty: r.productQty }));
const eq = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

// ── A. decomposeToInnerBoxes 직접 ─────────────────────────────────────────────
{
  // 8개 → 60인박스 1개에 8개 (수용량 10 아님) — 스크린샷 버그
  const r8 = shape(decomposeToInnerBoxes(three, 8, '미지정'));
  check('A 8개 → 60×1(8)', eq(r8, [{ kind: 60, count: 1, productQty: 8 }]), JSON.stringify(r8));

  // 17개 → 95인박스 1개에 17개 (수용량 20 아님)
  const r17 = shape(decomposeToInnerBoxes(three, 17, '미지정'));
  check('A 17개 → 95×1(17)', eq(r17, [{ kind: 95, count: 1, productQty: 17 }]), JSON.stringify(r17));

  // 30개 → 145인박스 1개 정확히 (경계: 정확히 꽉 참)
  const r30 = shape(decomposeToInnerBoxes(three, 30, '미지정'));
  check('A 30개 → 145×1(30)', eq(r30, [{ kind: 145, count: 1, productQty: 30 }]), JSON.stringify(r30));

  // 35개 → 145×1(30 꽉) + 60×1(5) (풀 + 다른 종류 부분)
  const r35 = shape(decomposeToInnerBoxes(three, 35, '미지정'));
  check('A 35개 → 145×1(30)+60×1(5)',
    eq(r35, [{ kind: 145, count: 1, productQty: 30 }, { kind: 60, count: 1, productQty: 5 }]),
    JSON.stringify(r35));

  // 단일 종류 25개 → 145×2(20 꽉) + 145×1(5) (같은 종류 풀+부분 분리)
  const r25 = shape(decomposeToInnerBoxes(one145, 25, '미지정'));
  check('A 단일종류 25개 → 145×2(20)+145×1(5)',
    eq(r25, [{ kind: 145, count: 2, productQty: 20 }, { kind: 145, count: 1, productQty: 5 }]),
    JSON.stringify(r25));

  // 경계: 0개 → 없음
  const r0 = shape(decomposeToInnerBoxes(three, 0, '미지정'));
  check('A 0개 → []', eq(r0, []), JSON.stringify(r0));
}

// ── B. 불변식: 항목 productQty 합 == 입력 qty ─────────────────────────────────
{
  const qtys = [1, 5, 8, 10, 11, 17, 20, 25, 29, 30, 31, 35, 59, 60, 61, 77];
  let bad = 0;
  const detail: string[] = [];
  for (const q of qtys) {
    for (const spec of [three, one145]) {
      const sum = decomposeToInnerBoxes(spec, q, '미지정').reduce((a, r) => a + r.productQty, 0);
      if (sum !== q) { bad++; detail.push(`${spec.size}×${q}=${sum}`); }
    }
  }
  check('B decompose 수량보존', bad === 0, bad === 0 ? '' : detail.join(' '));
}

// ── C. 통합: 같은-종류 부분 박스가 아웃박스에서 안 합쳐진다 ────────────────────
{
  const out = simulate({ products: [{ fabric: '미지정', size: 110, meter: 300, qty: 25 }], palletId: null });
  if (!out.ok) {
    check('C simulate ok', false, 'unsupported');
  } else {
    const packed = out.result.boxes.reduce(
      (a, b) => a + b.contents.reduce((s, c) => s + c.productQty, 0), 0);
    check('C 110×300 25개 패킹합=25', packed === 25, `packed=${packed}`);
  }
}

console.log('========================================================================');
console.log(`결과: PASS ${pass} · FAIL ${fail}`);
console.log('========================================================================');
if (fail > 0) process.exit(1);
