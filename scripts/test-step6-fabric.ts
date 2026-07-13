/**
 * Phase 6 검증 스크립트 — 원단별 수용량 + 원단 드롭다운 + 미상 거부
 *
 * 이번에 바뀐 계약: 수용량이 원단마다 다르므로 스펙 키가 (원단, 사이즈, 미터)다.
 * 그래서 원단은 더 이상 표시용 passthrough가 아니라 계산 입력이다.
 *
 * 검증 항목:
 *   A. 원단 전용 수용량이 실제로 적용된다 (40×300: 공통 30 / P-110 24)
 *   B. 전용 스펙이 없는 원단은 공통 규칙으로 폴백한다 (B324 110×300)
 *   C. 미상(원단 미지정)인데 원단마다 수용량이 갈리면 계산을 거부한다 (34×700)
 *   D. DB에 없는 치수는 unsupported — 미상 거부(ambiguous)와 구분된다
 *   E. 원단 드롭다운 목록은 그 치수에서 실제 계산 가능한 원단만 준다
 *   F. 무게: 원단 전용 스펙에 공통 무게를 잘못 물리지 않는다
 *
 * 실행:
 *   npx ts-node -r tsconfig-paths/register \
 *     --compiler-options '{"module":"commonjs"}' scripts/test-step6-fabric.ts
 */

import '@/scripts/fixture'; // 픽스처 하이드레이션 (반드시 첫 import)
import { simulate } from '@/lib/company/simulate';
import { findProduct, getFabricOptions, dimExists } from '@/lib/company/data';
import { toFabricKey, normalizeFabric, UNSPECIFIED_FABRIC } from '@/lib/company/fabric';
import type { CompanyParams } from '@/types/company';

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

const params = (fabric: string, size: number, meter: number, qty: number): CompanyParams => ({
  products: [{ fabric, size, meter, qty }],
  palletId: null,
});

// ─── A. 원단 전용 수용량이 실제로 적용된다 ────────────────────────────────────
// 40×300 = 공통 145인박스 30개(풀 아웃박스 120) / P-110 은 24개(풀 96)
{
  const common = findProduct(null, 40, 300);
  const p110 = findProduct('P-110', 40, 300);
  check('A 공통 40×300 = 120', common?.fullOuterQty === 120, `${common?.fullOuterQty}`);
  check('A P-110 40×300 = 96', p110?.fullOuterQty === 96, `${p110?.fullOuterQty}`);
  check('A 원단이 수용량을 실제로 바꾼다', common?.fullOuterQty !== p110?.fullOuterQty);

  // 풀 아웃박스 정확히 1개가 되는 수량을 넣으면 원단에 따라 결과가 갈려야 한다.
  // 공통으로 120개 = 아웃박스 1개. 같은 120개를 P-110으로 넣으면 96 + 24 → 1박스 초과.
  const a = simulate(params(UNSPECIFIED_FABRIC, 40, 300, 120));
  const b = simulate(params('P-110', 40, 300, 120));
  if (!a.ok || !b.ok) throw new Error('A: 계산 실패');
  check('A 미지정 120개 = 아웃박스 1', a.result.outerCount === 1 && a.result.looseCount === 0,
    `outer=${a.result.outerCount} loose=${a.result.looseCount}`);
  check('A P-110 120개 ≠ 아웃박스 1 (수용량 24라 남는다)',
    !(b.result.outerCount === 1 && b.result.looseCount === 0),
    `outer=${b.result.outerCount} courier=${b.result.courierCount} loose=${b.result.looseCount}`);
}

// ─── B. 전용 스펙 없는 원단 → 공통 폴백 ───────────────────────────────────────
// B324 는 110×300 에 자기 수용량 행이 없다 → 공통(145×10, 풀 40)을 그대로 써야 한다.
{
  const b324 = findProduct('B324', 110, 300);
  const common = findProduct(null, 110, 300);
  check('B B324 110×300 → 공통 폴백', b324 !== null && b324.fullOuterQty === 40, `${b324?.fullOuterQty}`);
  check('B 폴백값 == 공통값', b324?.fullOuterQty === common?.fullOuterQty);

  const withFabric = simulate(params('B324', 110, 300, 40));
  const without = simulate(params(UNSPECIFIED_FABRIC, 110, 300, 40));
  if (!withFabric.ok || !without.ok) throw new Error('B: 계산 실패');
  check('B 원단 지정/미지정 결과 동일 (폴백 치수)',
    withFabric.result.outerCount === without.result.outerCount &&
    withFabric.result.looseCount === without.result.looseCount,
    `${withFabric.result.outerCount} / ${without.result.outerCount}`);
}

// ─── C. 미상 거부 — 원단마다 수용량이 갈리는 치수 ──────────────────────────────
// 34×700: P-110=12, P-310=15 → 합의 없음 → 공통 스펙이 없다 → 원단을 특정해야 한다.
{
  const common = findProduct(null, 34, 700);
  check('C 34×700 공통 스펙 없음', common === null, `${common}`);

  const out = simulate(params(UNSPECIFIED_FABRIC, 34, 700, 12));
  check('C 미지정 → 계산 거부', out.ok === false);
  if (!out.ok) {
    check('C ambiguous 로 분류', out.ambiguous.length === 1 && out.ambiguous[0].size === 34,
      JSON.stringify(out.ambiguous));
    check('C unsupported 아님 (없는 스펙과 구분)', out.unsupported.length === 0,
      JSON.stringify(out.unsupported));
  }

  // 원단을 특정하면 계산된다 — 그리고 원단에 따라 결과가 다르다.
  const a = simulate(params('P-110', 34, 700, 12));
  const b = simulate(params('P-310', 34, 700, 12));
  check('C P-110 특정 → 계산됨', a.ok === true);
  check('C P-310 특정 → 계산됨', b.ok === true);
  check('C P-110(12) ≠ P-310(15) 수용량',
    findProduct('P-110', 34, 700)?.fullOuterQty !== findProduct('P-310', 34, 700)?.fullOuterQty,
    `${findProduct('P-110', 34, 700)?.fullOuterQty} vs ${findProduct('P-310', 34, 700)?.fullOuterQty}`);
}

// ─── D. 없는 치수 = unsupported (미상 거부와 구분) ─────────────────────────────
{
  const out = simulate(params(UNSPECIFIED_FABRIC, 999, 999, 10));
  check('D 없는 치수 → 계산 거부', out.ok === false);
  if (!out.ok) {
    check('D unsupported 로 분류', out.unsupported.length === 1, JSON.stringify(out.unsupported));
    check('D ambiguous 아님', out.ambiguous.length === 0, JSON.stringify(out.ambiguous));
  }
  check('D dimExists=false', dimExists(999, 999) === false);
}

// ─── E. 원단 드롭다운 목록 ────────────────────────────────────────────────────
{
  const at40 = getFabricOptions(40, 300);
  check('E 40×300 은 주력5종 + P-110', at40.includes('P-110') && at40.includes('B220') && at40.length === 6,
    at40.join(','));
  const at34 = getFabricOptions(34, 700);
  check('E 34×700 은 P-110/P-310 뿐', at34.length === 2 && at34.includes('P-110') && at34.includes('P-310'),
    at34.join(','));
  check('E 없는 치수 → 빈 목록', getFabricOptions(999, 999).length === 0);

  // 드롭다운이 준 원단은 반드시 계산 가능해야 한다 (findProduct 가 스펙을 찾는다).
  let unresolved = 0;
  for (const [size, meter] of [[40, 300], [60, 300], [110, 300], [34, 700]] as const) {
    for (const code of getFabricOptions(size, meter)) {
      if (findProduct(code, size, meter) === null) unresolved++;
    }
  }
  check('E 드롭다운 원단은 전부 계산 가능', unresolved === 0, `미해결=${unresolved}`);
}

// ─── F. 무게 — 원단 전용 스펙에 공통 무게를 잘못 물리지 않는다 ──────────────────
// 40×300 공통은 풀박스 120롤 15.92kg. P-110 은 96롤이라 같은 15.92 일 수 없다.
{
  const common = findProduct(null, 40, 300);
  const p110 = findProduct('P-110', 40, 300);
  check('F 공통 40×300 무게 있음', common?.fullOuterWeight === 15.92, `${common?.fullOuterWeight}`);
  check('F P-110 40×300 무게 null (미실측 — 공통값 오염 금지)',
    p110?.fullOuterWeight === null, `${p110?.fullOuterWeight}`);

  // 무게 미실측 제품이 섞이면 총무게는 null 이지만 박스 계산은 계속된다.
  const out = simulate(params('P-110', 40, 300, 96));
  if (!out.ok) throw new Error('F: 계산 실패');
  check('F 무게 미실측 → totalWeight null', out.result.totalWeight === null, `${out.result.totalWeight}`);
  check('F 무게 없어도 박스 계산은 됨', out.result.outerCount === 1,
    `outer=${out.result.outerCount}`);
}

// ─── 원단 키 변환 ─────────────────────────────────────────────────────────────
{
  check('G 미입력 → 미지정', normalizeFabric('  ') === UNSPECIFIED_FABRIC);
  check('G 미지정 → null 키', toFabricKey(UNSPECIFIED_FABRIC) === null);
  check('G 원단명 → 그대로', toFabricKey('P-110') === 'P-110');
}

console.log('='.repeat(72));
console.log(`결과: PASS ${pass} · FAIL ${fail}`);
console.log('='.repeat(72));
if (fail > 0) process.exit(1);
