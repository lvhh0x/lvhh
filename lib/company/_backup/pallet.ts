// 백업 — lib/company/pallet.ts (Phase 5 Step 1 완료본)
// 엔진③ — 파렛트 적재 (Phase 5 Step 1)

import type { PalletSpec, PalletStack } from '@/types/company';

const MAX_LAYERS = 5;
const OUTER_BOX_HEIGHT = 315; // mm

export function calcPallet(
  outerCount: number,
  pallet: PalletSpec,
  stackWeight: number,
): PalletStack | null {
  if (outerCount <= 0) return null;

  const bpl = pallet.boxesPerLayer;
  const perPallet = bpl * MAX_LAYERS;

  const totalPallets = Math.ceil(outerCount / perPallet);

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
  };
}
