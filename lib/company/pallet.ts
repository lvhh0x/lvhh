// 엔진③ — 파렛트 적재 (Phase 5 Step 1)
// 규칙 (계획서 3.5):
//   층당개수 = 파렛트별 boxesPerLayer
//   최대단수 = 5
//   totalPallets       = ceil(N / (층당개수 × 5))
//   마지막 파렛트 층수  = ceil(잔여 / 층당개수)
//   마지막 층 박스 수   = 잔여 - 층당개수 × (층수-1)
//
// 적재 대상: 아웃박스만. (택배/낱개는 시각적으로만 얹힘 — 여기 미반영)
// 높이 = 파렛트 높이 + 아웃박스 높이(315) × 단수

import type { PalletSpec, PalletStack } from '@/types/company';

const MAX_LAYERS = 5;
const OUTER_BOX_HEIGHT = 315; // mm (아웃박스 높이)

/**
 * 아웃박스 N개를 파렛트에 적재.
 * @param outerCount 적재할 아웃박스 수
 * @param pallet     선택 파렛트
 * @param stackWeight 적재된 아웃박스 무게 합 (kg) — weight.ts에서 계산해 전달
 */
export function calcPallet(
  outerCount: number,
  pallet: PalletSpec,
  stackWeight: number,
): PalletStack | null {
  if (outerCount <= 0) return null;

  const bpl = pallet.boxesPerLayer;
  const perPallet = bpl * MAX_LAYERS;

  const totalPallets = Math.ceil(outerCount / perPallet);

  // 마지막 파렛트의 잔여 박스 수
  const rem = outerCount - perPallet * (totalPallets - 1);
  const layers = Math.ceil(rem / bpl);
  const lastLayerBoxes = rem - bpl * (layers - 1);

  const height = pallet.h + OUTER_BOX_HEIGHT * layers;
  const weight = pallet.tare * totalPallets + stackWeight;

  return {
    palletId: pallet.id,
    layers,
    lastLayerBoxes,
    boxesPerLayer: bpl,
    totalPallets,
    height,
    weight,
    // 규격·오버행은 simulate.ts가 calcFootprint 결과로 덮어쓴다 (Phase 5 Step 3/Step 2)
    footprintW: pallet.w,
    footprintD: pallet.d,
    overhangW: 0,
    overhangD: 0,
  };
}
