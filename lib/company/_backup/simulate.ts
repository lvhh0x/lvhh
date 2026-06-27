// 백업 — lib/company/simulate.ts (Phase 5 Step 1 완료본)
// 통합 오케스트레이터 (Phase 5 Step 1)
// ①인박스 분해 → ②박스 조합 → ④무게 → ③파렛트 적재 순으로 호출해 CompanyResult 생성.

import type {
  CompanyParams,
  CompanyResult,
  InnerBoxCount,
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

  const perProduct: InnerBoxCount[][] = validInputs.map(input => {
    const product = findProduct(input.size, input.meter)!;
    return decomposeToInnerBoxes(product, input.qty);
  });
  const innerTotals = mergeInnerBoxCounts(perProduct);

  const boxes: PackedBox[] = packIntoBoxes(innerTotals);

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
