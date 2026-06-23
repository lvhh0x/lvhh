# DB-01 — Supabase 스키마 현황
> **상태: ✅ 문서화 완료**
> 프로젝트 ID: `lnnxjwfvzaelsoupozke` | ap-northeast-1 (Tokyo) | PG17

---

## ⚠️ 핵심 주의

하나의 Supabase에 **두 도메인**이 공존:
- 🚫 **리본/라벨 제조 테이블 15개** → 절대 수정 금지
- ✅ **시뮬레이션 테이블** (pallet_types 등) → 사용 가능

---

## 🚫 절대 건드리지 말 것 (15개)

| 테이블 | 행 | 설명 |
|--------|-----|------|
| ribbon_types | 18 | 열전사 리본 |
| label_specs | 218 | 라벨 스펙 |
| customers | 64 | 거래일 마스터 |
| delivery_routes | 57 | 발주요→배송요 경로 |
| label_batches | 9 | 라벨 배치 |
| label_batch_default_ribbons | 12 | 배치별 기본 원단 |
| label_spec_explicit_ribbons | 31 | 명시적 원단 |
| label_spec_unclassified_notes | 8 | 미분류 비고 |
| core_specs | 7 | 코어/지관 |
| packaging_finishes | 3 | 외포장 마감 |
| packaging_styles | 3 | 포장 스타일 |
| customer_ribbon_aliases | 10 | 거래처 원단 별칭 |
| inner_box_quantity_specs | 0 | 인박스 정량 |
| ribbon_box_specs | 20 | 박스 적재 수량 |
| ribbon_box_spec_ribbon_types | 80 | 다대다 |

---

## ✅ 시뮬레이션 사용 가능

### pallet_types (5행)

```sql
CREATE TABLE pallet_types (
  id         integer PRIMARY KEY,
  name       text,
  length_mm  integer,
  width_mm   integer,
  height_mm  integer,
  weight_kg  numeric,
  created_at timestamptz
);
-- ⚠️ per_layer 커럼 없음. BE-02 참조.
```

실제 데이터 확인:
```sql
SELECT id, name, length_mm, width_mm FROM pallet_types ORDER BY id;
```

### outer_box_types (2행)
```
id, name, length_mm, width_mm, height_mm, weight_kg
```

### inner_box_types (2행)
```
id, name, dimensions_label
```

---

## 🔲 추후 추가 예정

```sql
-- stock_simulations (하드코딩 → DB 시)
CREATE TABLE stock_simulations (
  id text PRIMARY KEY,  -- 's1'
  ticker text NOT NULL,
  name text NOT NULL,
  tag text NOT NULL,
  seed integer NOT NULL,
  bias integer NOT NULL,
  vol integer NOT NULL,
  color text NOT NULL
);

-- simulation_products
CREATE TABLE simulation_products (
  id serial PRIMARY KEY,
  name text NOT NULL,
  per_box integer NOT NULL
);
```

---

## 보안 현황

```
현재 상태: 모든 18개 테이블 RLS 비활성화
위험도: 높음
처리 시점: Phase 7 (DB-02 참조)
```