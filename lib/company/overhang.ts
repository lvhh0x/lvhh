// 엔진⑤ — 규격·오버행 계산 (Phase 5 Step 3 / Step 2)
// 규칙 (PLAN §3-4, STEP2-IMPL §3-C):
//   규격 = 파렛트 위에 아웃박스를 layout대로 배열했을 때의 파렛트+박스 합산 외곽.
//   오버행 = 박스 배열 총폭이 파렛트를 넘어선 초과분 (방향별).
//
// 계산 대상: 아웃박스(355×315)만. (택배박스/낱개는 오버행 계산 제외 — 사용자 확정 2026-07-02)
//
// layout.rotated = false : 박스 가로(w)를 파렛트 가로 방향, 박스 세로(d)를 파렛트 세로 방향.
// layout.rotated = true  : 박스 90° 회전 → 박스 세로(d)가 파렛트 가로 방향, 박스 가로(w)가 세로 방향.

import type { PalletSpec, OuterBoxSpec } from '@/types/company';

export interface Footprint {
  footprintW: number; // 파렛트+박스 합산 외곽 가로 (mm)
  footprintD: number; // 파렛트+박스 합산 외곽 세로 (mm)
  overhangW: number;  // 가로 오버행 (mm, 0이면 없음)
  overhangD: number;  // 세로 오버행 (mm, 0이면 없음)
}

/**
 * 파렛트에 아웃박스를 layout대로 배열했을 때의 합산 외곽 규격·오버행.
 * @param pallet   파렛트 규격 (w, d, layout 사용)
 * @param outerBox 아웃박스 규격 (w, d 사용)
 */
export function calcFootprint(pallet: PalletSpec, outerBox: OuterBoxSpec): Footprint {
  const { cols, rows, rotated } = pallet.layout;

  // 각 파렛트 방향으로 배열된 박스 총폭
  const arrW = rotated ? cols * outerBox.d : cols * outerBox.w;
  const arrD = rotated ? rows * outerBox.w : rows * outerBox.d;

  const footprintW = Math.max(pallet.w, arrW);
  const footprintD = Math.max(pallet.d, arrD);
  const overhangW = Math.max(0, arrW - pallet.w);
  const overhangD = Math.max(0, arrD - pallet.d);

  return { footprintW, footprintD, overhangW, overhangD };
}
