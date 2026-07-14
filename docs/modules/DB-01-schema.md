# DB-01 — Supabase 스키마 현황
> **상태: ✅ 최신화 (2026-07-14 실측)**
> 프로젝트 ID: `lnnxjwfvzaelsoupozke` | ap-northeast-1 (Tokyo) | PG17
> public 스키마 **27개 테이블** · 전부 RLS 비활성화

---

## ⚠️ 핵심 주의

하나의 Supabase에 **두 도메인**이 공존한다.
- 리본/라벨 제조 테이블 (실제 사업 데이터 — 지금도 계속 입력 중)
- 시뮬레이션이 읽는 테이블

**두 도메인은 이제 겹친다.** Phase 6에서 박스 시뮬레이션이 리본 도메인의
`ribbon_types` · `ribbon_specs` · `roll_box_capacities`를 직접 읽기 시작했다.
"리본 테이블은 시뮬레이션과 무관하다"는 옛 전제는 더는 성립하지 않는다.

### ⏸️ "절대 수정 금지 15개" 규칙 — 보류 중 (2026-07-13 사용자 결정)
만드는 중인 DB에 수정 금지를 걸면 작업이 막힌다. 규칙은 삭제하지 않고 주석 보류했고,
구조가 완성되면 되살린다. 보류 기간의 유일한 절대 원칙:

> **DB 내용이 꼬이거나, 엉망이 되거나, 그냥 삭제되는 일은 없어야 한다.**
> 수정·추가는 자유. **파괴는 금지.**
> (DELETE/DROP/무조건 UPDATE 금지 · 삽입은 ON CONFLICT DO NOTHING ·
>  변경 전 반드시 현재 상태 조회)

---

## ✅ 시뮬레이션이 읽는 테이블 (BE-04 = `/api/company/master`)

행 수는 2026-07-14 `SELECT COUNT(*)` 실측.
⚠️ **`list_tables`가 보고하는 행 수는 낡았다** (ribbon_types를 1로 보고한 전례). 직접 셀 것.

### pallet_types (5행)
```
id, name, length_mm, width_mm, height_mm, weight_kg, created_at,
boxes_per_layer, layout_cols, layout_rows, layout_rotated
```
→ `layout_*`는 Phase 5 Step 3-2에서 추가 (700=2×2 / 900=3×2 회전 / 1100·플라스틱=3×3)

### outer_box_types (2행)
```
id, name, length_mm, width_mm, height_mm, weight_kg, created_at,
capacity_unit, per_layer_unit
```

### inner_box_types (3행 — 60 · 95 · 145)
```
id, name, description, created_at,
length_mm, width_mm, height_mm, weight_kg, outer_unit, courier_unit
```
> 🔴 **코드 계약**: `InnerBoxKind`가 `60 | 95 | 145`로 하드코딩돼 있다(types/company.ts).
> 여기에 없는 인박스를 가리키는 `roll_box_capacities` 행이 생기면
> master route가 `fail("미지의 inner_box_id")` → **시뮬레이션 전체가 500**.
> 인박스를 새로 추가하려면 코드도 함께 고쳐야 한다.

### roll_box_capacities (132행) — 시뮬레이션의 핵심
```
id, width_mm, length_m, ribbon_type_id, inner_box_id, qty, is_default,
created_at, alt_qty, alt_condition, core_spec_id, raw_notes
```
→ 조회 키 = **(원단, 사이즈, 미터)**. `ribbon_type_id IS NULL` = 원단 무관 공통 규칙.
→ ⚠️ `core_spec_id IS NOT NULL` 행은 **API에서 제외 중**. 서비스코아 엔진이 없어서다.
   그래서 GPX90 45×450이 시뮬레이션에 나오지 않는다 (Phase 6 다음 작업).

### roll_weights (19행)
```
id, width_mm, length_m, ribbon_type_id, full_outer_weight_kg, created_at
```
→ 키가 (원단, 사이즈, 미터)인 이유: 한 박스에 들어가는 롤 수가 원단마다 다르면
  (120 vs 96) 풀박스 무게가 같을 수 없다. 없으면 null(미실측)로 두고 추측하지 않는다.

### ribbon_types (19행) / ribbon_specs (199행)
원단 코드명과 원단별 존재 치수 → 입력폼 원단 드롭다운의 출처.
> 🔴 **Phase 7 지뢰**: RLS를 켜면서 이 둘의 SELECT를 막으면 **박스 시뮬레이션이 죽는다.**

---

## 보안 현황

```
현재 상태: public 27개 테이블 전부 RLS 비활성화
위험도: 높음 (공개 사이트 + anon 키)
처리 시점: Phase 7 (DB-02 참조)
```
