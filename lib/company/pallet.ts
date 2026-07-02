// 엔진③ — 파렛트 적재 (Phase 5 Step 3-3 재작성)
// 규칙 (PHASE5-STEP3-STEP3-IMPL §5, 사용자 확정 2026-07-02):
//   파렛트는 항상 1개.
//   슬롯 환산: 필요슬롯 = 아웃박스수 + 택배수 + ceil(낱개수 / 2)
//   최대슬롯 = boxesPerLayer × 5
//   필요슬롯 > 최대슬롯 → overflow (적재 초과, 선택 불가)
//   층수  = ceil(필요슬롯 / boxesPerLayer)
//   높이  = 파렛트높이 + 아웃박스높이(315) × 층수
//   빈칸 배치 순서: 아웃박스 → 택배(1칸) → 낱개(2개=1칸)

import type { PalletSpec, PalletStack, SlotKind } from '@/types/company';

const MAX_LAYERS = 5;
const OUTER_BOX_HEIGHT = 315; // mm (아웃박스 높이 — 층 높이 기준)

export interface OuterBoxCounts {
  outerCount: number;
  courierCount: number;
  looseCount: number;
}

/**
 * 채움 순서(아웃→택배→낱개) 기준으로 슬롯 index의 종류를 반환.
 * @param index    전역 슬롯 순번 (아래층→위층, 좌→우로 매김)
 * @param s        슬롯 종류별 개수
 */
export function slotKindAt(
  index: number,
  s: { slotOuter: number; slotCourier: number; slotLoose: number },
): SlotKind {
  if (index < s.slotOuter) return 'outer';
  if (index < s.slotOuter + s.slotCourier) return 'courier';
  if (index < s.slotOuter + s.slotCourier + s.slotLoose) return 'loose';
  return 'empty';
}

/**
 * 아웃/택배/낱개를 파렛트 1개에 슬롯 환산해 적재.
 * @param counts     아웃박스·택배·낱개 개수
 * @param pallet     선택 파렛트
 * @param stackWeight 적재물 무게 합 (kg) — weight.ts에서 계산해 전달
 */
export function calcPallet(
  counts: OuterBoxCounts,
  pallet: PalletSpec,
  stackWeight: number,
): PalletStack | null {
  const slotOuter = counts.outerCount;
  const slotCourier = counts.courierCount;
  const slotLoose = Math.ceil(counts.looseCount / 2);
  const neededSlots = slotOuter + slotCourier + slotLoose;

  if (neededSlots <= 0) return null;

  const bpl = pallet.boxesPerLayer;
  const maxSlots = bpl * MAX_LAYERS;
  const overflow = neededSlots > maxSlots;

  const layers = Math.ceil(neededSlots / bpl);
  const lastLayerSlots = neededSlots - bpl * (layers - 1);

  const height = pallet.h + OUTER_BOX_HEIGHT * layers;
  const weight = pallet.tare + stackWeight; // 파렛트 1개

  return {
    palletId: pallet.id,
    boxesPerLayer: bpl,
    neededSlots,
    maxSlots,
    overflow,
    slotOuter,
    slotCourier,
    slotLoose,
    layers,
    lastLayerSlots,
    height,
    weight,
    // 규격·오버행은 simulate.ts가 calcFootprint 결과로 덮어쓴다 (Phase 5 Step 3/Step 2)
    footprintW: pallet.w,
    footprintD: pallet.d,
    overhangW: 0,
    overhangD: 0,
  };
}
