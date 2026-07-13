// 회사 시뮬레이션 마스터 데이터 API (Phase 6 — Supabase 단일 출처)
// inner/outer/pallet + roll_box_capacities/roll_weights/ribbon_specs 를 조회해
// MasterData 형태로 조립한다. 화면은 이 응답을 hydrateMasterData()로 주입한다.
//
// 제품 노출 규칙: roll_box_capacities 에 수용량이 있으면 노출한다(특수 원단 포함).
// 수용량은 원단마다 다를 수 있으므로(40×300 = 공통 30 / P-110 24) 스펙 키는
// (원단, 사이즈, 미터)다. ribbon_type_id NULL = 원단 무관 공통 규칙.
//
// 원단 미지정('미상') 계산: 공통 규칙 행이 있으면 그것으로 계산한다. 공통이 없어도
// 그 치수의 원단들이 수용량에 전원 합의하면 공통 스펙을 합성해 계산을 허용한다.
// 합의가 깨지면 공통 스펙을 만들지 않는다 → 원단을 특정해야만 계산된다(사용자 결정).
//
// 특수코아(9F/65·F65 등, core_spec_id NOT NULL) 의존 수용량은 계산 엔진이
// 코아를 다루게 된 뒤에 붙인다. 이번 범위에서 제외한다(사용자 결정 2026-07-13).
//
// roll_weights(실측 무게)는 선택 — 없으면 fullOuterWeight=null (박스 계산은 가능).
//
// fullOuterQty 는 저장하지 않고 계산한다:
//   기본 인박스 수용량 × (아웃박스 총용량단위 ÷ 해당 인박스 outer_unit)
//   예: 40사이즈 = 30 × (60 ÷ 15) = 120

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type {
  MasterData,
  ProductSpec,
  InnerBoxSpec,
  OuterBoxSpec,
  PalletSpec,
  InnerBoxKind,
  OuterBoxKind,
} from '@/types/company';

// 매 요청마다 DB 조회 (캐싱 없음 — 사용자 결정 2026-07-11)
export const dynamic = 'force-dynamic';

const INNER_KINDS: InnerBoxKind[] = [145, 95, 60];

function fail(msg: string) {
  return NextResponse.json({ error: msg }, { status: 500 });
}

export async function GET() {
  const supabase = createServerClient();

  const [innerRes, outerRes, palletRes, capRes, weightRes, specRes, ribbonRes] =
    await Promise.all([
      supabase.from('inner_box_types').select('*'),
      supabase.from('outer_box_types').select('*'),
      supabase.from('pallet_types').select('*').order('id'),
      // 특수코아 의존 수용량은 이번 범위 밖 (위 주석 참조)
      supabase.from('roll_box_capacities').select('*').is('core_spec_id', null),
      supabase.from('roll_weights').select('*'),
      supabase.from('ribbon_specs').select('ribbon_type_id, width_mm, length_m'),
      supabase.from('ribbon_types').select('id, code'),
    ]);

  for (const r of [innerRes, outerRes, palletRes, capRes, weightRes, specRes, ribbonRes]) {
    if (r.error) return fail(`DB 조회 실패: ${r.error.message}`);
  }

  // ── 인박스: 이름("145인박스")에서 kind 파싱 ─────────────────────
  const innerById = new Map<number, InnerBoxKind>();
  const innerBoxes: InnerBoxSpec[] = [];
  const innerUnits = {} as Record<InnerBoxKind, Record<OuterBoxKind, number>>;

  for (const row of innerRes.data ?? []) {
    const m = /^(\d+)인박스/.exec(row.name ?? '');
    const kind = m ? Number(m[1]) : NaN;
    if (!INNER_KINDS.includes(kind as InnerBoxKind)) continue;
    if (
      row.length_mm === null || row.width_mm === null || row.height_mm === null ||
      row.weight_kg === null || row.outer_unit === null || row.courier_unit === null
    ) {
      return fail(`inner_box_types 필수값 누락: ${row.name}`);
    }
    innerById.set(row.id, kind as InnerBoxKind);
    innerBoxes.push({
      kind: kind as InnerBoxKind,
      w: Number(row.length_mm),
      d: Number(row.width_mm),
      h: Number(row.height_mm),
      tare: Number(row.weight_kg),
    });
    innerUnits[kind as InnerBoxKind] = {
      outer: row.outer_unit,
      courier: row.courier_unit,
    };
  }
  if (innerBoxes.length !== INNER_KINDS.length) {
    return fail(`inner_box_types 3종(145/95/60) 미충족: ${innerBoxes.length}종`);
  }

  // ── 아웃박스: 이름으로 kind 매핑 ────────────────────────────────
  const outerBoxes: OuterBoxSpec[] = [];
  for (const row of outerRes.data ?? []) {
    const name = row.name;
    const kind: OuterBoxKind | null =
      name === '아웃박스' ? 'outer' : name === '택배박스' ? 'courier' : null;
    if (kind === null || name === null) continue;
    if (
      row.length_mm === null || row.width_mm === null || row.height_mm === null ||
      row.weight_kg === null || row.capacity_unit === null || row.per_layer_unit === null
    ) {
      return fail(`outer_box_types 필수값 누락: ${row.name}`);
    }
    outerBoxes.push({
      kind,
      label: name,
      w: Number(row.length_mm),
      d: Number(row.width_mm),
      h: Number(row.height_mm),
      tare: Number(row.weight_kg),
      perLayerUnit: row.per_layer_unit,
      capacityUnit: row.capacity_unit,
    });
  }
  const foundOuter = outerBoxes.find(b => b.kind === 'outer');
  const courierSpec = outerBoxes.find(b => b.kind === 'courier');
  if (!foundOuter || !courierSpec) {
    return fail('outer_box_types 2종(아웃박스/택배박스) 미충족');
  }
  // 아래 toSpec() 안에서 쓰인다. 함수 안에서는 위 가드의 좁히기가 유지되지 않으므로
  // 좁혀진 값을 상수로 고정한다 (as 캐스팅 금지).
  const outerSpec: OuterBoxSpec = foundOuter;

  // ── 파렛트 ────────────────────────────────────────────────────────
  const pallets: PalletSpec[] = [];
  for (const row of palletRes.data ?? []) {
    if (
      row.name === null || row.length_mm === null || row.width_mm === null ||
      row.height_mm === null || row.weight_kg === null ||
      row.boxes_per_layer === null || row.layout_cols === null || row.layout_rows === null
    ) {
      return fail(`pallet_types 필수값 누락: id=${row.id}`);
    }
    pallets.push({
      id: String(row.id),
      label: row.name,
      w: Number(row.length_mm),
      d: Number(row.width_mm),
      h: Number(row.height_mm),
      tare: Number(row.weight_kg),
      boxesPerLayer: row.boxes_per_layer,
      layout: {
        cols: row.layout_cols,
        rows: row.layout_rows,
        rotated: row.layout_rotated,
      },
    });
  }
  if (pallets.length === 0) return fail('pallet_types 비어 있음');

  // ── 제품: (원단, 사이즈, 미터) 단위 수용량 — 무게는 선택 ──────────
  // ribbonId = null → 원단 무관 공통 규칙
  type Group = {
    ribbonId: number | null;
    size: number;
    meter: number;
    innerCapacity: Record<InnerBoxKind, number | null>;
    defaultKind: InnerBoxKind | null;
  };
  const groups = new Map<string, Group>();
  for (const row of capRes.data ?? []) {
    const kind = innerById.get(row.inner_box_id);
    if (kind === undefined) return fail(`roll_box_capacities 미지의 inner_box_id: ${row.inner_box_id}`);
    const key = `${row.ribbon_type_id ?? ''}_${row.width_mm}_${row.length_m}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        ribbonId: row.ribbon_type_id,
        size: row.width_mm,
        meter: row.length_m,
        innerCapacity: { 145: null, 95: null, 60: null },
        defaultKind: null,
      };
      groups.set(key, g);
    }
    g.innerCapacity[kind] = row.qty;
    if (row.is_default) g.defaultKind = kind;
  }

  const ribbonCode = new Map<number, string>();
  for (const row of ribbonRes.data ?? []) ribbonCode.set(row.id, row.code);

  // 무게도 원단별이다. 풀 아웃박스 무게는 그 박스에 몇 롤이 들어가느냐에 달렸는데,
  // 수용량이 원단마다 다르므로(40×300 = 공통 120롤 / P-110 96롤) 공통 무게를
  // 원단 전용 스펙에 그대로 붙이면 롤당 무게가 틀리게 역산된다.
  // 따라서 (원단, 사이즈, 미터)로 찾고, 없으면 null(미실측)로 둔다.
  // 자기 수용량이 없어 공통 규칙을 그대로 쓰는 원단은 애초에 전용 스펙이 만들어지지
  // 않고 findProduct 가 공통 스펙으로 폴백하므로, 공통 무게를 정상적으로 물려받는다.
  const weights = new Map<string, number>();
  for (const row of weightRes.data ?? []) {
    weights.set(
      `${row.ribbon_type_id ?? ''}_${row.width_mm}_${row.length_m}`,
      Number(row.full_outer_weight_kg),
    );
  }

  function toSpec(g: Group, fabric: string | null): ProductSpec | string {
    const defaultKind = g.defaultKind;
    const label = `${fabric ?? '공통'} ${g.size}×${g.meter}`;
    if (defaultKind === null) return `기본 인박스 미지정: ${label}`;
    const defaultQty = g.innerCapacity[defaultKind];
    if (defaultQty === null) return `기본 인박스 수용량 누락: ${label}`;
    const perOuter = outerSpec.capacityUnit / innerUnits[defaultKind].outer;
    return {
      fabric,
      size: g.size,
      meter: g.meter,
      fullOuterQty: defaultQty * perOuter,
      // 무게 미실측 사이즈도 노출 (박스 계산 우선 — 사용자 결정 2026-07-12).
      // 무게는 있을 때만 표시하고, roll_weights 에 행이 추가되면 자동 반영된다.
      fullOuterWeight: weights.get(`${g.ribbonId ?? ''}_${g.size}_${g.meter}`) ?? null,
      defaultInner: defaultKind,
      innerCapacity: g.innerCapacity,
    };
  }

  const products: ProductSpec[] = [];
  const byDim = new Map<string, Group[]>(); // 치수 → 그 치수의 모든 원단 그룹
  for (const g of Array.from(groups.values())) {
    const fabric = g.ribbonId === null ? null : ribbonCode.get(g.ribbonId) ?? null;
    if (g.ribbonId !== null && fabric === null) {
      return fail(`ribbon_types 미등록 ribbon_type_id: ${g.ribbonId}`);
    }
    const spec = toSpec(g, fabric);
    if (typeof spec === 'string') return fail(spec);
    products.push(spec);

    const dim = `${g.size}_${g.meter}`;
    byDim.set(dim, [...(byDim.get(dim) ?? []), g]);
  }

  // 공통 스펙 합성: 공통 규칙 행이 없는 치수라도, 그 치수의 원단들이 수용량에
  // 전원 합의하면 '미상' 계산을 허용한다. 합의가 깨지면 만들지 않는다 →
  // simulate() 가 "원단을 특정해야 한다"로 처리한다.
  for (const [dim, gs] of Array.from(byDim.entries())) {
    if (gs.some(g => g.ribbonId === null)) continue; // 이미 공통 규칙이 있다
    const shape = (g: Group) =>
      JSON.stringify([g.defaultKind, g.innerCapacity[145], g.innerCapacity[95], g.innerCapacity[60]]);
    const first = gs[0];
    if (!gs.every(g => shape(g) === shape(first))) continue; // 원단마다 수용량이 갈린다
    // ribbonId=null 로 합성 — 무게도 공통(원단 무관) 행에서만 찾는다
    const spec = toSpec({ ...first, ribbonId: null }, null);
    if (typeof spec === 'string') return fail(`${spec} (공통 합성: ${dim})`);
    products.push(spec);
  }

  if (products.length === 0) return fail('노출 가능한 제품 없음 (수용량 데이터 확인)');
  products.sort((a, b) => a.size - b.size || a.meter - b.meter);

  // ── 원단 드롭다운 목록: 치수 → 그 치수에서 계산 가능한 원단 코드 ─────
  // ribbon_specs 에 등록된 원단 중, 그 치수에 자기 수용량이 있거나
  // 공통 규칙으로 폴백되는 것만 노출한다(= findProduct 가 반드시 스펙을 찾는다).
  const fabricsByDim: Record<string, string[]> = {};
  for (const row of specRes.data ?? []) {
    const code = ribbonCode.get(row.ribbon_type_id);
    if (code === undefined) continue;
    const dim = `${row.width_mm}_${row.length_m}`;
    const own = groups.has(`${row.ribbon_type_id}_${row.width_mm}_${row.length_m}`);
    const common = groups.has(`_${row.width_mm}_${row.length_m}`);
    if (!own && !common) continue; // 수용량 없음 → 계산 불가 → 드롭다운에서 뺀다
    const list = fabricsByDim[dim] ?? (fabricsByDim[dim] = []);
    if (!list.includes(code)) list.push(code);
  }
  for (const list of Object.values(fabricsByDim)) list.sort();

  const data: MasterData = {
    products,
    innerBoxes,
    outerBoxes,
    pallets,
    innerUnits,
    fabricsByDim,
  };
  return NextResponse.json(data);
}
