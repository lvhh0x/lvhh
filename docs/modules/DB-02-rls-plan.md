# DB-02 — RLS 보안

> **상태: ✅ 적용 완료 (2026-07-17, 세션: 페이즈7및기타 01)**
> 28개 테이블 전부 RLS 활성화 · **정책 0개(전면 차단)** · 앱 무영향.

---

## 현황 (2026-07-17 실측)

```
public 테이블 28개 전부 RLS 활성화 · 정책 0개 · 보안 어드바이저 ERROR 0
```

| 항목 | 적용 전 | 적용 후 |
|------|---------|---------|
| RLS 켜진 테이블 | 0 / 28 | **28 / 28** |
| 정책 | 0 | **0** (없는 게 설계다) |
| anon 키로 `customers`(185행) 읽기 | **읽힘** | **0행 — 차단** |
| anon 키로 INSERT | (미측정) | **401 / 42501 — 차단** |
| `/api/company/master` | 200 · 37,787B · 227제품 | **200 · 37,787B · 227제품** |
| 보안 어드바이저 | **ERROR 28개** | **ERROR 0개** |

되돌리기: `ALTER TABLE <t> DISABLE ROW LEVEL SECURITY;`

---

## 전략: 정책 없는 전면 차단 (deny-all)

**공개 SELECT 정책을 하나도 만들지 않는다.**

이유 — **앱은 DB를 anon 키로 읽지 않는다.** 2026-07-17 실측:

- `.from()` 호출은 **전부 2개 라우트**뿐:
  `app/api/company/master/route.ts` (8개 테이블) · `app/api/archive/route.ts` (1개).
  둘 다 서버에서 `lib/supabase/server.ts` = **secret 키**로 읽는다.
- `lib/supabase/client.ts`(anon 키)는 **아무도 import하지 않는다** (`createBrowserSupabaseClient`
  호출 0건 — 자기 정의 1건이 전부).
- 파이썬/Railway 백엔드는 Supabase를 **아예 안 쓴다** (참조 0건).
- **secret 키는 RLS를 우회한다** (2026-07-17 이 프로젝트에서 실측).

⇒ 전면 차단이 **더 안전하고 더 단순하다.** 공개 SELECT를 열면 지킬 것을 안 지킬 뿐,
얻는 게 없다.

**신규 테이블도 정책 불필요** — `ALTER TABLE <t> ENABLE ROW LEVEL SECURITY;` 한 줄이면 끝.

---

## ⚠️ 폐기된 옛 계획 — 읽고 그대로 실행하지 말 것

이 문서의 옛 버전은 이렇게 지시했다:

> ~~ribbon_types · ribbon_specs 는 SELECT를 열어야 한다. 박스 시뮬레이션의 원단
> 드롭다운이 이 두 테이블을 읽는다. 차단하면 시뮬레이션이 죽는다.~~

**틀렸다 — 정확히는, 전제가 무너졌다.** 저 경고는 **브라우저가 anon 키로 직접 읽는다**는
전제 위에 있었다. 실제 아키텍처는 서버 전용이고, `client.ts`는 아무도 안 쓴다.
`ribbon_types`·`ribbon_specs`·`archive_files` **전부 전면 차단했고 시뮬레이션은 멀쩡하다**
(227제품 그대로).

옛 계획은 **18개 테이블** 기준이었다 (지금 28개). 그대로 실행했으면 `products`·
`roll_box_capacities`·`customer_product_specs` 등 **10개가 열린 채 남았을 것이다.**

📌 **교훈: 규칙은 아키텍처가 바뀌면 조용히 거짓이 된다.** 옛 경고를 지운 게 아니라,
**측정으로 반증하고 나서** 지웠다.

---

## 적용된 그룹 분할 (A/B)

앱이 읽는 테이블은 **정확히 8개**, 나머지 **20개는 아무 코드도 안 읽는다.**
이 분할이 안전한 실행 순서를 만들었다.

### A그룹 — 앱이 안 읽는 20개 (무위험, Vercel 키와 무관)

`box_capacities` · `core_specs` · `customer_product_specs` · `customer_ribbon_aliases` ·
`customers` · `delivery_routes` · `inner_box_quantity_specs` · `label_batch_default_ribbons` ·
`label_batches` · `label_spec_explicit_ribbons` · `label_spec_unclassified_notes` ·
`label_specs` · `leader_trailer_types` · `packaging_finishes` · `packaging_styles` ·
`product_packaging_specs` · `products` · `ribbon_box_spec_ribbon_types` ·
`ribbon_box_specs` · `winding_types`

**영업 데이터는 전부 여기다** (`customers` 185 · `products` 312 · `label_specs` 218 ·
`customer_product_specs` 193 · `delivery_routes` 121). 아무 코드도 안 읽으므로
**켜도 사이트가 죽을 수 없고**, 어떤 키가 배포돼 있든 무관하다.

### B그룹 — 앱이 읽는 8개

`inner_box_types` · `outer_box_types` · `pallet_types` · `roll_box_capacities` ·
`roll_weights` · `ribbon_specs` · `ribbon_types` · `archive_files`

이 8개의 **내용은 이미 `/api/company/master`가 전 세계에 공개**하고 있다(37KB, 인증 없음).
따라서 RLS의 가치는 **비밀 유지가 아니라 무결성** — anon 키로 INSERT/UPDATE/DELETE 하는
것을 막는다. 즉 **"DB는 절대 삭제·파괴되지 않는다"는 절대 규칙**을 DB가 직접 강제한다.

---

## 적용 SQL (실제 실행분)

```sql
-- 1) A그룹 20개 — 마이그레이션 phase7_rls_stage_a_app_unread_tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
-- … (위 A그룹 20개 전부, 정책 없음)

-- 2) 캐너리 — 마이그레이션 phase7_rls_canary_roll_weights
ALTER TABLE public.roll_weights ENABLE ROW LEVEL SECURITY;

-- 3) B그룹 나머지 7개 — 마이그레이션 phase7_rls_stage_b_app_read_tables
ALTER TABLE public.inner_box_types ENABLE ROW LEVEL SECURITY;
-- … (정책 없음)
```

---

## 🐤 캐너리 기법 (다음에 또 쓸 것)

**문제:** Vercel 환경변수는 `Sensitive`라 **값을 아무도 못 읽는다**(소유자 포함).
그리고 RLS가 꺼져 있으면 publishable 키와 secret 키가 **똑같이 동작**한다.
⇒ "배포된 키가 맞는가?"는 **RLS를 켜기 전엔 확인 불가**, 그런데 틀린 채로 켜면 사이트가
죽는다. 교착.

**해법:** `master/route.ts` 58–60행은 `r.error`일 때만 실패한다. 그런데
**RLS 차단은 에러가 아니라 `200 + 빈 배열`** 이다. 그래서 테이블마다 결과가 다르다:

| 차단되면 | 결과 |
|---|---|
| `inner_box_types` | `fail('3종 미충족')` → **500, 사망** |
| `outer_box_types` | `fail()` → **500** |
| `roll_box_capacities` | 제품 목록 **0개** |
| **`roll_weights`** | **무게만 `null`. 안 죽는다** ← 유일 |

⇒ **`roll_weights` 하나만 먼저 켜면 무위험 정찰이 된다.** 신호: 227제품 중 무게를 가진
게 정확히 **19개**. 키가 틀렸으면 19 → 0, 맞으면 19 유지. 최악이 "무게 잠깐 사라짐".

**결과: 19 유지 → Vercel은 secret 키를 갖고 있다 (증명 완료).**

⚠️ **캐시를 먼저 배제해야 한다.** 바이트 수가 같다는 건 캐시된 응답의 모습이기도 하다.
`X-Vercel-Cache: MISS` + `Age: 0` 확인, 그리고 **CDN이 본 적 없는 캐시버스터 URL**로
재요청해서 같은 결과를 받고서야 믿었다.

---

## 함정 (실측으로 얻음)

- **RLS 차단은 에러가 아니다 — `200 + []`다.** `master/route.ts`는 `r.error`만 보므로,
  차단된 테이블은 **조용히 빈 값**이 된다. 이게 캐너리를 가능하게 한 성질이자,
  동시에 "빈 결과 = 없음이 아니다" 함정의 원천이다.
- **비어 있는 대상으로는 검증할 수 없다.** `/api/archive`는 지금 `[]`다(`archive_files` 0행).
  RLS가 막혀도 `[]`, 잘 돼도 `[]` ⇒ **검증 수단으로 못 쓴다.** 유일한 검증 창구는
  `/api/company/master`(37,787B)다.
- **일치하는 행이 없는 DELETE/UPDATE로 쓰기 권한을 테스트할 수 없다.** RLS가 켜져도 꺼져도
  `204 / 0행`이라 **구분 불가**. (실제로 이 실수를 했고, 결과가 이상해서 잡았다.)
- **잘못된 행으로 INSERT 테스트도 안 된다.** PostgreSQL은 `NOT NULL`(ExecConstraints)을
  **RLS(ExecWithCheckOptions)보다 먼저** 검사하므로 RLS와 무관하게 400이 난다.
  ⇒ **유효한 행**으로 테스트해야 하고, 비어 있고 아무도 안 읽는 테이블
  (`inner_box_quantity_specs`)을 골라 위험을 없앤다.
- **MCP(`postgres` 역할)는 `rolbypassrls = true`** — RLS를 켜도 DB 데이터 입력 작업
  (db데이타넣기 세션)은 영향 없다. 조치 **전에** 확인했다.
- **`Sensitive` 환경변수는 쓰기 전용**이다. 모르는 값을 알아내려 하지 말고
  **아는 값으로 덮어쓰면** 된다.

---

## 별개 사안 (Phase 7 범위 밖)

- **`archive` 스토리지 버킷은 여전히 공개.** 테이블 RLS와 무관하게 파일은 공개 URL로
  받아진다. 대외비 자료는 **비공개 버킷 + 인증**이 먼저다.
- **`lib/supabase/client.ts` + Vercel의 `NEXT_PUBLIC_SUPABASE_ANON_KEY`** — 아무도 안 쓰지만,
  누가 client.ts를 import하는 순간 anon 키가 브라우저 번들로 나간다. 지우면 그 경로가
  사라진다. **`NEXT_PUBLIC_SUPABASE_URL`은 서버가 쓰므로 유지.**
  (RLS가 켜진 지금은 키가 새도 피해가 없다 — 그래서 급하진 않다.)
