// 마스터 데이터 (Phase 6 — Supabase 단일 출처 + 런타임 하이드레이션)
// 데이터의 유일한 진실은 Supabase DB다. /api/company/master 가 DB를 조회해
// MasterData 형태로 조립하고, 화면(또는 테스트)이 hydrateMasterData()로 주입한다.
// 이 파일은 매핑·조회 계층 역할만 하며 값을 직접 갖지 않는다.
// (테스트는 scripts/fixture.ts 가 lib/company/master.json 픽스처로 주입한다.)

import type {
  MasterData,
  ProductSpec,
  InnerBoxSpec,
  OuterBoxSpec,
  PalletSpec,
  InnerBoxKind,
  OuterBoxKind,
} from '@/types/company';

// ─── 하이드레이션 상태 ─────────────────────────────────────────────────────────
// export let: 소비처(엔진·UI·스크립트)는 호출 시점에 읽으므로
// hydrateMasterData() 이후 항상 최신 값을 본다 (ESM live binding).

export let PRODUCTS: ProductSpec[] = [];
export let INNER_BOXES: InnerBoxSpec[] = [];
export let OUTER_BOXES: OuterBoxSpec[] = [];
export let PALLETS: PalletSpec[] = [];
export let INNER_UNITS: Record<InnerBoxKind, Record<OuterBoxKind, number>> = {
  145: { outer: 0, courier: 0 },
  95: { outer: 0, courier: 0 },
  60: { outer: 0, courier: 0 },
};

// 박스 용량 단위 — outerbox.ts 가 사용 (outer=60, courier=12)
export let OUTER_CAP = 0;
export let COURIER_CAP = 0;

let loaded = false;

/** 마스터 데이터 주입 (화면: /api/company/master 응답 / 테스트: 픽스처) */
export function hydrateMasterData(data: MasterData): void {
  PRODUCTS = data.products;
  INNER_BOXES = data.innerBoxes;
  OUTER_BOXES = data.outerBoxes;
  PALLETS = data.pallets;
  INNER_UNITS = data.innerUnits;
  OUTER_CAP = getOuterBoxSpec('outer').capacityUnit;
  COURIER_CAP = getOuterBoxSpec('courier').capacityUnit;
  loaded = true;
}

export function isMasterDataLoaded(): boolean {
  return loaded;
}

// ─── 조회 헬퍼 ────────────────────────────────────────────────────────────────

export function findProduct(size: number, meter: number): ProductSpec | null {
  return PRODUCTS.find(p => p.size === size && p.meter === meter) ?? null;
}

export function findPallet(id: string): PalletSpec | null {
  return PALLETS.find(p => p.id === id) ?? null;
}

export function getInnerBoxSpec(kind: InnerBoxKind): InnerBoxSpec {
  const spec = INNER_BOXES.find(b => b.kind === kind);
  if (!spec) throw new Error(`Unknown InnerBoxKind: ${kind}`);
  return spec;
}

export function getOuterBoxSpec(kind: OuterBoxKind): OuterBoxSpec {
  const spec = OUTER_BOXES.find(b => b.kind === kind);
  if (!spec) throw new Error(`Unknown OuterBoxKind: ${kind}`);
  return spec;
}
