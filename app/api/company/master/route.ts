// 회사 시뮬레이션 마스터 데이터 API (Phase 6 — Supabase 단일 출처)
// 4테이블(inner/outer/pallet + roll_box_capacities/roll_weights)을 조회해
// MasterData 형태로 조립한다. 화면은 이 응답을 hydrateMasterData()로 주입한다.
//
// 제품 노출 규칙: roll_box_capacities(기본 규칙, ribbon_type_id NULL)에 있는
// (폭, 길이)는 모두 제품으로 노출한다. roll_weights(실측 무게)는 선택 —
// 없으면 fullOuterWeight=null (박스 계산은 가능, 무게 표시만 생략).
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

  const [innerRes, outerRes, palletRes, capRes, weightRes] = await Promise.all([
    supabase.from('inner_box_types').select('*'),
    supabase.from('outer_box_types').select('*'),
    supabase.from('pallet_types').select('*').order('id'),
    supabase.from('roll_box_capacities').select('*').is('ribbon_type_id', null),
    supabase.from('roll_weights').select('*').is('ribbon_type_id', null),
  ]);

  for (const r of [innerRes, outerRes, palletRes, capRes, weightRes]) {
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
  const outerSpec = outerBoxes.find(b => b.kind === 'outer');
  const courierSpec = outerBoxes.find(b => b.kind === 'courier');
  if (!outerSpec || !courierSpec) {
    return fail('outer_box_types 2종(아웃박스/택배박스) 미충족');
  }

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

  // ── 제품: 수용량(기본 규칙) — 무게는 선택 ────────────────────────
  type Group = {
    size: number;
    meter: number;
    innerCapacity: Record<InnerBoxKind, number | null>;
    defaultKind: InnerBoxKind | null;
  };
  const groups = new Map<string, Group>();
  for (const row of capRes.data ?? []) {
    const kind = innerById.get(row.inner_box_id);
    if (kind === undefined) return fail(`roll_box_capacities 미지의 inner_box_id: ${row.inner_box_id}`);
    const key = `${row.width_mm}_${row.length_m}`;
    let g = groups.get(key);
    if (!g) {
      g = {
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

  const weights = new Map<string, number>();
  for (const row of weightRes.data ?? []) {
    weights.set(`${row.width_mm}_${row.length_m}`, Number(row.full_outer_weight_kg));
  }

  const products: ProductSpec[] = [];
  for (const [key, g] of Array.from(groups.entries())) {
    const defaultKind = g.defaultKind;
    if (defaultKind === null) return fail(`기본 인박스 미지정: ${g.size}×${g.meter}`);
    const defaultQty = g.innerCapacity[defaultKind];
    if (defaultQty === null) return fail(`기본 인박스 수용량 누락: ${g.size}×${g.meter}`);
    const perOuter = outerSpec.capacityUnit / innerUnits[defaultKind].outer;
    products.push({
      size: g.size,
      meter: g.meter,
      fullOuterQty: defaultQty * perOuter,
      // 무게 미실측 사이즈도 노출 (박스 계산 우선 — 사용자 결정 2026-07-12).
      // 무게는 있을 때만 표시하고, roll_weights 에 행이 추가되면 자동 반영된다.
      fullOuterWeight: weights.get(key) ?? null,
      defaultInner: defaultKind,
      innerCapacity: g.innerCapacity,
    });
  }
  if (products.length === 0) return fail('노출 가능한 제품 없음 (수용량 데이터 확인)');
  products.sort((a, b) => a.size - b.size || a.meter - b.meter);

  const data: MasterData = {
    products,
    innerBoxes,
    outerBoxes,
    pallets,
    innerUnits,
  };
  return NextResponse.json(data);
}
