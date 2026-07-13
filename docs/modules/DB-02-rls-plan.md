# DB-02 — RLS 보안 계획
> **상태: 🟡 계획 완료, 미적용** | Phase 7에서 실행
> 적용 전: 반드시 사용자 확인 후 실행

---

## 현황

```전체 18개 테이블 RLS 비활성화 — anon key로 얼마든지 도달 가능```

---

## 전략

| 그룹 | SELECT | WRITE |
|------|--------|-------|
| 리본/라벨 (영업·거래처·라벨 시트) | ❌ 차단 | ❌ 차단 |
| **ribbon_types · ribbon_specs** | **✅ 공개** | ❌ 차단 |
| 시뮬레이션 (pallet_types 등) | ✅ 공개 | ❌ 차단 |

> ⚠️ **`ribbon_types` · `ribbon_specs` 는 SELECT를 열어야 한다 (2026-07-13).**
> 박스 적재 시뮬레이션의 원단 드롭다운이 이 두 테이블을 읽는다
> (`/api/company/master`). 아래 Step 1 SQL은 원래 `ribbon_types` 를 통째로
> 차단하도록 쓰여 있었는데, 그대로 실행하면 **시뮬레이션이 죽는다.**
> 차단 대상에서 빼고, Step 2에서 SELECT 정책을 부여할 것.
> `ribbon_specs` 는 애초에 이 문서 작성 시점에 없던 테이블이다.

---

## Step 1: 리본/라벨 전체 차단

```sql
-- ribbon_types 는 차단 대상에서 제외 (2026-07-13) — 시뮬레이션 드롭다운이 읽는다.
-- 차단하려면 SELECT 정책을 함께 줘야 하므로 시뮬레이션 그룹으로 옮긴다.
-- ALTER TABLE ribbon_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_batch_default_ribbons ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_spec_explicit_ribbons ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_spec_unclassified_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging_finishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_ribbon_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE inner_box_quantity_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ribbon_box_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ribbon_box_spec_ribbon_types ENABLE ROW LEVEL SECURITY;
-- 정책 없이 RLS만 활성화 = deny-all
```

---

## Step 2: 시뮬레이션 테이블 SELECT 공개

```sql
ALTER TABLE pallet_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_pallet_types" ON pallet_types FOR SELECT TO anon USING (true);

ALTER TABLE outer_box_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_outer_box_types" ON outer_box_types FOR SELECT TO anon USING (true);

ALTER TABLE inner_box_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_inner_box_types" ON inner_box_types FOR SELECT TO anon USING (true);
```

---

## Step 3: 신규 테이블 생성 시

```sql
-- 테이블 생성과 동시에 적용
ALTER TABLE simulation_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON simulation_products FOR SELECT TO anon USING (true);
```

---

## 적용 체크리스티

```
[ ] 1. 사용자 확인
[ ] 2. Step 1 SQL 실행
[ ] 3. 기존 리본/라벨 시스템 정상 확인 (service_role key 사용 안하면 RLS 우회됨)
[ ] 4. Step 2 SQL 실행
[ ] 5. /api/pallets 정상 응답 확인
```

> service_role key 사용 앱은 RLS 우회 — 기존 비즈니스 시스템 영향 없음