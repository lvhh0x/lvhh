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
import { findProduct, findPallet, getOuterBoxSpec, getInnerBoxSpec } from './data';
import { decomposeToInnerBoxes, mergeInnerBoxCounts } from './innerbox';
import { packIntoBoxes, countOuterBoxes } from './outerbox';
import { calcPallet } from './pallet';
import {
  calcProductWeight,
  calcInnerBoxTare,
  calcOuterBoxTare,
  calcPackedBoxWeight,
  isWeightIncomplete,
} from './weight';

export interface SimulateError {
  ok: false;
  unsupported: { size: number; meter: number }[];
}
export interface SimulateOk {
  ok: true;
  result: CompanyResult;
}
export type SimulateOutcome = SimulateOk | SimulateError;

export function simulate(params: CompanyParams): SimulateOutcome {
  const validInputs = params.products.filter(p => p.qty > 0);

  const unsupported = validInputs
    .filter(p => findProduct(p.size, p.meter) === null)
    .map(p => ({ size: p.size, meter: p.meter }));
  if (unsupported.length > 0) {
    return { ok: false, unsupported };
  }

  // ① 인박스 분해 (제품별 — 사이즈 정보 유지)
  const perProduct: SizedInnerCount[][] = validInputs.map(input => {
    const product = findProduct(input.size, input.meter)!;
    return decomposeToInnerBoxes(product, input.qty);
  });

  // innerTotals: 화면 표시용 합산 (SizedInnerCount[] → InnerBoxCount[] 구조적 호환)
  const innerTotals: InnerBoxCount[] = mergeInnerBoxCounts(perProduct);

  // ② 박스 조합 (perProduct 직접 전달 — 사이즈별 분리 알고리즘)
  const boxes: PackedBox[] = packIntoBoxes(perProduct);

  for (const b of boxes) {
    b.weight = calcPackedBoxWeight(b);
  }

  const { outerCount, courierCount, looseCount } = countOuterBoxes(boxes);

  const productWeight = validInputs.reduce(
    (acc, input) => acc + calcProductWeight(input),
    0,
  );
  const innerTare = calcInnerBoxTare(innerTotals);
  const outerTare = calcOuterBoxTare(boxes);

  let pallet = null;
  let palletTare = 0;
  if (params.palletId) {
    const palletSpec = findPallet(params.palletId);
    if (palletSpec) {
      const stackWeight = productWeight + innerTare + outerTare;
      pallet = calcPallet(outerCount, palletSpec, stackWeight);
      if (pallet) palletTare = palletSpec.tare * pallet.totalPallets;
    }
  }

  const totalWeight = productWeight + innerTare + outerTare + palletTare;

  const result: CompanyResult = {
    innerTotals,
    boxes,
    outerCount,
    courierCount,
    looseCount,
    totalWeight,
    pallet,
    weightIncomplete: isWeightIncomplete(innerTotals, boxes),
  };

  return { ok: true, result };
}

export { getOuterBoxSpec, getInnerBoxSpec, findPallet };
