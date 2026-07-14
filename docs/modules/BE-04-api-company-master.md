# BE-04 — API: 회사 마스터 (`/api/company/master`)
> **상태: ✅ 완료** | Phase 6 Step 1(신설) · Step 2(원단 확장)
> BE-02(파렛트) · BE-03(제품)을 대체한다 — 그 둘은 만들지 않았다.

---

## 역할

Supabase 7개 테이블을 한 번에 조회해 `MasterData` 하나로 조립해 내려준다.
화면(`app/company/[id]/page.tsx`)이 이 응답을 `hydrateMasterData()`로 주입하면,
`lib/company/` 엔진 7종은 DB를 전혀 모른 채 기존 시그니처 그대로 동작한다.

```
GET /api/company/master → MasterData
  { products, innerBoxes, outerBoxes, pallets, innerUnits, fabricsByDim }
```

`export const dynamic = 'force-dynamic'` — 매 요청 DB 조회, 캐싱 없음 (사용자 결정 2026-07-11).

---

## 읽는 테이블

| 테이블 | 쓰임 |
|--------|------|
| inner_box_types | 인박스 규격 + `outer_unit`/`courier_unit` |
| outer_box_types | 아웃박스·택배박스 규격 + `capacity_unit`/`per_layer_unit` |
| pallet_types | 파렛트 규격 + `boxes_per_layer`/`layout_*` |
| roll_box_capacities | **수용량 (핵심)** — `.is('core_spec_id', null)` 필터 |
| roll_weights | 풀 아웃박스 실측 무게 (선택 — 없으면 null) |
| ribbon_specs + ribbon_types | 원단 드롭다운(`fabricsByDim`) |

---

## 핵심 계약

### 1. 스펙 키는 (원단, 사이즈, 미터)
수용량이 원단마다 다르다 (40×300 = 공통 30롤 / P-110 24롤).
`ribbon_type_id IS NULL` = 원단 무관 **공통 규칙**.
`findProduct(fabric, size, meter)`는 원단 전용을 먼저 찾고, 없으면 공통으로 폴백한다.

### 2. 원단 미지정('미상') 처리 — 추측하지 않는다
- 공통 규칙 행이 있으면 그것으로 계산
- 공통이 없어도 **그 치수의 원단들이 수용량에 전원 합의하면** 공통 스펙을 합성해 허용
- **합의가 깨지면 합성하지 않는다** → `SimulateError.ambiguous`("원단을 특정하세요")
  틀린 박스 수를 내놓느니 계산을 거부한다 (사용자 결정)

### 3. fullOuterQty는 저장하지 않고 계산한다
```
기본 인박스 수용량 × (아웃박스 capacity_unit ÷ 그 인박스 outer_unit)
예: 40사이즈 = 30 × (60 ÷ 15) = 120
```

### 4. 무게도 (원단, 사이즈, 미터)로 찾는다
한 박스에 들어가는 롤 수가 다르면(120 vs 96) 풀박스 무게가 같을 수 없다.
공통 무게를 원단 전용 스펙에 붙이면 롤당 무게가 틀리게 역산된다.
없으면 `fullOuterWeight = null` — **무게 미실측이어도 박스 계산은 노출한다.**

---

## 🔴 지뢰

- **`core_spec_id IS NOT NULL` 행은 통째로 제외 중.** 특수코아가 수용량을 바꾸는데
  (GPX90 45×450 = 코아 9F/65면 12롤, F65면 14롤) 조회 키에 코아가 없다.
  그래서 **45×450이 시뮬레이션에 나오지 않는다.** 서비스코아 엔진이 다음 작업.
- **미지의 `inner_box_id` = 전체 500.** `INNER_KINDS = [145, 95, 60]`에 없는 인박스를
  가리키는 수용량 행이 하나라도 생기면 `fail("미지의 inner_box_id")`로 API가 죽는다.
  → 인박스 추가는 DB만으로 끝나지 않는다. `types/company.ts`의 `InnerBoxKind`도 고쳐야 한다.
- **인박스/아웃박스를 이름 문자열로 매핑한다.** `/^(\d+)인박스/` 정규식과
  `name === '아웃박스' | '택배박스'`. DB에서 이름을 바꾸면 조립이 조용히 실패한다.
- **`is_default` 없는 치수 = 500.** `기본 인박스 미지정` 으로 fail 한다.
- **HTTP 200 ≠ 최신 데이터.** `lib/supabase/server.ts`가 `cache:'no-store'`를 강제하기
  전까지 Next Data Cache가 하루 지난 행을 서빙했다 (커밋 2fa9eef). 검증은 **본문**으로.

---

## 의존 모듈
- LIB-02 (supabase server client — no-store 필수)
- LIB-01 (lib/company/data.ts 하이드레이션 스토어)
- types/company.ts (MasterData, ProductSpec, InnerBoxKind)
