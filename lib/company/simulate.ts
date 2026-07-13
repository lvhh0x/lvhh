// 통합 오케스트레이터 (Phase 5 Step 2 수정)
// Step 4 변경:
//   · perProduct 타입: InnerBoxCount[][] → SizedInnerCount[][]
//   · packIntoBoxes(innerTotals) → packIntoBoxes(perProduct) (사이즈 정보 보존 전달)
//   · innerTotals는 화면 표시용 합산에만 사용

import type {
  CompanyParams,
  CompanyResult,
  InnerBoxCount,
  SizedInnerCount,
  PackedBox,
} from '@/types/company';
import { findProduct, findPallet, getOuterBoxSpec, getInnerBoxSpec, dimExists } from './data';
import { toFabricKey } from './fabric';
import { decomposeToInnerBoxes, mergeInnerBoxCounts } from './innerbox';
import { packIntoBoxes, countOuterBoxes } from './outerbox';
import { calcPallet } from './pallet';
import { calcFootprint } from './overhang';
import {
  calcProductWeight,
  calcInnerBoxTare,
  calcOuterBoxTare,
  calcPackedBoxWeight,
} from './weight';

export interface SimulateError {
  ok: false;
  /** DB에 아예 없는 치수 */
  unsupported: { size: number; meter: number }[];
  /** 치수는 있으나 원단마다 수용량이 갈려, 원단을 특정해야 계산 가능한 것 */
  ambiguous: { size: number; meter: number }[];
}
export interface SimulateOk {
  ok: true;
  result: CompanyResult;
}
export type SimulateOutcome = SimulateOk | SimulateError;

export function simulate(params: CompanyParams): SimulateOutcome {
  const validInputs = params.products.filter(p => p.qty > 0);

  const unsupported: { size: number; meter: number }[] = [];
  const ambiguous: { size: number; meter: number }[] = [];
  for (const p of validInputs) {
    const fabric = toFabricKey(p.fabric);
    if (findProduct(fabric, p.size, p.meter) !== null) continue;
    // 원단 미지정인데 치수는 존재 = 원단별로 수용량이 갈리는 치수 → 원단 특정 필요
    if (fabric === null && dimExists(p.size, p.meter)) {
      ambiguous.push({ size: p.size, meter: p.meter });
    } else {
      unsupported.push({ size: p.size, meter: p.meter });
    }
  }
  if (unsupported.length > 0 || ambiguous.length > 0) {
    return { ok: false, unsupported, ambiguous };
  }

  // ① 인박스 분해 (제품별 — 사이즈 정보 유지)
  const perProduct: SizedInnerCount[][] = validInputs.map(input => {
    const product = findProduct(toFabricKey(input.fabric), input.size, input.meter)!;
    return decomposeToInnerBoxes(product, input.qty, input.fabric);
  });

  // innerTotals: 화면 표시용 합산 (SizedInnerCount[] → InnerBoxCount[] 구조적 호환)
  const innerTotals: InnerBoxCount[] = mergeInnerBoxCounts(perProduct);

  // ② 박스 조합 (perProduct 직접 전달 — 사이즈별 분리 알고리즘)
  const boxes: PackedBox[] = packIntoBoxes(perProduct);

  for (const b of boxes) {
    b.weight = calcPackedBoxWeight(b);
  }

  const { outerCount, courierCount, looseCount } = countOuterBoxes(boxes);

  // 제품 무게 합 — 무게 미실측 제품이 하나라도 있으면 null (박스 계산은 그대로 진행)
  let productWeight: number | null = 0;
  for (const input of validInputs) {
    const w = calcProductWeight(input);
    if (w === null) {
      productWeight = null;
      break;
    }
    productWeight += w;
  }
  const innerTare = calcInnerBoxTare(innerTotals);
  const outerTare = calcOuterBoxTare(boxes);

  let pallet = null;
  let palletTare = 0;
  if (params.palletId) {
    const palletSpec = findPallet(params.palletId);
    if (palletSpec) {
      const stackWeight =
        productWeight === null ? null : productWeight + innerTare + outerTare;
      pallet = calcPallet({ outerCount, courierCount, looseCount }, palletSpec, stackWeight);
      if (pallet) {
        palletTare = palletSpec.tare; // 파렛트 1개
        // 규격·오버행 (아웃박스 배열 기준) 부착
        const fp = calcFootprint(palletSpec, getOuterBoxSpec('outer'));
        pallet.footprintW = fp.footprintW;
        pallet.footprintD = fp.footprintD;
        pallet.overhangW = fp.overhangW;
        pallet.overhangD = fp.overhangD;
      }
    }
  }

  const totalWeight =
    productWeight === null ? null : productWeight + innerTare + outerTare + palletTare;

  const result: CompanyResult = {
    innerTotals,
    boxes,
    outerCount,
    courierCount,
    looseCount,
    totalWeight,
    pallet,
  };

  return { ok: true, result };
}

export { getOuterBoxSpec, getInnerBoxSpec, findPallet };
