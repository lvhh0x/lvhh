# MERIDIAN · Private Simulation Desk — MASTER
> ⚡ **새 세션 시작 시 반드시 이 파일을 첫 번째로 읽는다**
> 모든 판단 기준은 이 문서에 있다. 모호하면 코딩 전 사용자에게 확인 후 진행.

---

## 📌 프로젝트 개요

**MERIDIAN Private Simulation Desk** — 주식 백테스트 시뮬레이션 + 회사 운영 시뮬레이션(박스·파렛트 적재 등)을 제공하는 공개 웹사이트.

| 항목 | 내용 |
|------|------|
| 레포지토리 | `github.com/lvhh0x/lvhh` (main 브랜치) |
| 배포 | Vercel — main 브랜치 push 시 자동 배포 |
| DB | Supabase 프로젝트 `lnnxjwfvzaelsoupozke` (ap-northeast-1, Tokyo) |
| 접근 방식 | 공개 사이트 (로그인 없음) |
| 원본 HTML | `시뮬레이션_데스크_럭셔리_dc.html` (이 파일이 레이아웃 기준) |
| 현재 단계 | **Phase 6 진행 중 🔶 — Step 1(박스 시뮬 DB 전환) · Step 2(특수 원단 노출 + 원단 드롭다운) 완료. 회귀 165/165. 다음: 서비스코아 계산 엔진(스펙 키에 코아 추가) — 그때까지 45×450은 API에서 제외되어 시뮬레이션에 나오지 않는다** |

---

## 🏗️ 기술 스택

| 구분 | 기술 | 선택 이유 |
|------|------|-----------| 
| 프레임워크 | **Next.js 14 (App Router)** | Vercel 최적, API Routes 내장, 미래 확장 용이 |
| 언어 | **TypeScript** (strict) | 타입 안전, 모듈 간 계약 보장. `any`/`unknown` 금지 |
| 스타일 | **인라인 스타일** (기존 HTML 그대로) | 레이아웃 변경 금지 원칙 준수 |
| 백엔드(주식) | **Python FastAPI** (Railway) | 기존 PySide6 엔진 그대로 이식 |
| 백엔드(회사) | **로컬 순수 함수** (lib/company/) | 외부 서버 불필요, 계산 모두 클라이언트에서 |
| DB | **Supabase** (PostgreSQL 17) | 기존 연동 완료 |
| 배포 | **Vercel** | GitHub 연동 자동 배포 |

---

## 📁 실제 레포지토리 구조 (Phase 6 Step 2 완료 기준)

```
lvhh/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # / → 홈
│   ├── stock/
│   │   ├── page.tsx                    # /stock → ETF 시뮬레이션 6타일 그리드
│   │   ├── etf/page.tsx                # /stock/etf → ETF 직접입력 실행
│   │   └── [id]/page.tsx               # /stock/[id] → 종목 실행
│   ├── company/
│   │   ├── page.tsx                    # /company → 회사 시뮬레이션 6타일 그리드 ✅
│   │   └── [id]/page.tsx               # /company/[id] → 박스·파렛트 적재 실행 ✅
│   ├── archive/page.tsx                # /archive → 자료실 (FE-08) ✅ 2026-07-14
│   └── api/
│       ├── stocks/route.ts             # GET /api/stocks (종목 목록 — 아직 하드코딩)
│       ├── stocks/[id]/range/route.ts  # GET /api/stocks/[id]/range
│       ├── backtest/route.ts           # POST /api/backtest
│       ├── company/master/route.ts     # GET /api/company/master ✅ Phase 6
│       │                               #   5테이블 조회 → MasterData 조립 (force-dynamic)
│       └── archive/route.ts            # GET /api/archive ✅ 자료실 목록 (BE-05)
├── components/
│   ├── layout/ (InnerHeader, Ticker)
│   ├── home/ (HeroSection, EntryTiles, MoreTools, ToolTile, StatsBand, QuoteFooter)
│   │         ※ FeaturedStrategies 는 삭제됨 (2026-07-14 — 죽은 링크 3장, MoreTools로 대체)
│   ├── stock/ (SimTile, StockCard, StockParams, StockResult)
│   ├── company/                        ← Phase 5 Step 2 완료 ✅
│   │   ├── CompanyTile.tsx
│   │   ├── CompanyParams.tsx
│   │   ├── CompanyResult.tsx
│   │   ├── BoxSvg.tsx                  (SizedInnerCount 표기)
│   │   └── CompanyPalletSvg.tsx        (빈자리 점선 시각화)
│   └── svg/ (LineSvg, CandleSvg, PalletSvg, IconSvg)
├── lib/
│   ├── stock/ (tiles.ts)
│   ├── home/ (tools.ts — MORE TOOLS 3칸 단일 소스)
│   ├── company/                        ← Phase 6 Step 2 완료 ✅
│   │   ├── master.json  (⚠️ 더는 단일 출처 아님 — 테스트 픽스처 전용.
│   │   │                 런타임 진실은 Supabase. scripts/fixture.ts가 주입)
│   │   ├── data.ts      (하이드레이션 스토어 — /api/company/master 결과를 받음)
│   │   ├── tiles.ts     (6타일 단일 소스)
│   │   ├── innerbox.ts  (엔진① 인박스 분해 — SizedInnerCount 반환)
│   │   ├── outerbox.ts  (엔진② 박스 조합 — 딱떨어질때만 합침 그리디)
│   │   ├── pallet.ts    (엔진③ 파렛트 적재 — 슬롯/빈칸/오버플로우)
│   │   ├── weight.ts    (엔진④ 무게 계산 — 키 = 원단×사이즈×미터)
│   │   ├── overhang.ts  (엔진⑤ 규격·오버행 — calcFootprint)
│   │   ├── fabric.ts    (엔진⑥ 원단 정규화)
│   │   └── simulate.ts  (통합 오케스트레이터)
│   ├── svg/ (generators.ts)
│   └── supabase/ (client.ts, server.ts ← fetch no-store 강제, 커밋 2fa9eef)
├── scripts/         (회귀 테스트 6종 + fixture.ts + JSX 한글 가드)
├── .githooks/       (pre-push — typecheck·JSX가드·회귀 통과 시에만 push)
├── types/
│   ├── company.ts   (SizedInnerCount · PalletLayout · fabric · ProductSpec)
│   ├── backtest.ts
│   ├── stock.ts
│   └── database.ts  (DB 실컬럼 반영 — 스키마 확장 시 함께 자란다)
├── python/          (FastAPI 서버 — Railway 배포)
└── docs/
    ├── MASTER.md                   (← 진입점)
    ├── PROGRESS.md                 (← 체크리스트, 현재 위치)
    ├── modules/                    (14개 모듈 명세 FE/BE/LIB/DB)
    ├── PHASE5-STEP2-*.md           (3개 — 계획/핸드오프/검증)
    └── PHASE5-STEP3-*.md           (6개 — 계획/5단계 구현/검증)
```

---

## 🔌 환경 변수 (.env.local)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://lnnxjwfvzaelsoupozke.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>  # 서버 전용, 절대 클라이언트 노출 금지
PYTHON_SERVER_URL=https://meridian-production-e345.up.railway.app  # 서버 전용(NEXT_PUBLIC 금지)
```

---

## 🗃️ Supabase DB 현황

**ID**: `lnnxjwfvzaelsoupozke` | **리전**: ap-northeast-1 (Tokyo) | **PG**: v17

### ⏸️ 접근 금지 규칙 — 보류 (2026-07-13, 사용자 결정)

리본/라벨 테이블은 **아직 만드는 중**이다. 만드는 단계에서 "수정 금지"를 걸면
언제 고치고 언제 추가할지 모르는 데이터를 손도 못 대게 되어 작업이 막힌다.
그래서 아래 금지 규칙을 **삭제하지 않고 보류(주석)** 한다.
**전체 구조가 완성되면 주석을 풀어 되살린다.**

보류하는 동안의 유일한 절대 원칙:
> **DB 내용이 꼬이거나, 엉망이 되거나, 그냥 삭제되는 일은 없어야 한다.**
> 수정·추가는 자유롭되 파괴는 금지. (DELETE/DROP/무조건 UPDATE 금지,
> 삽입은 ON CONFLICT DO NOTHING, 변경 전 현재 상태를 반드시 조회할 것)

<!-- 보류 시작 — 완성 후 되살릴 것
### ❌ 절대 건드리지 말 것 — 리본/라벨 제조 비즈니스 (15개)
ribbon_types, label_specs, customers, delivery_routes, label_batches, label_batch_default_ribbons, label_spec_explicit_ribbons, label_spec_unclassified_notes, core_specs, packaging_finishes, packaging_styles, customer_ribbon_aliases, inner_box_quantity_specs, ribbon_box_specs, ribbon_box_spec_ribbon_types
보류 끝 -->

### ✅ 시뮬레이션이 읽는 테이블 (행 수 = 2026-07-14 SELECT COUNT 실측)
| 테이블 | 행 수 | 용도 |
|--------|-------|------|
| pallet_types | 5 | 파렛트 규격 (boxes_per_layer/layout_*) |
| outer_box_types | 2 | 아웃박스 규격 (capacity_unit/per_layer_unit) |
| inner_box_types | 3 | 인박스 규격 (60·95·145 — ⚠️ 코드가 이 3종만 안다) |
| roll_box_capacities | 132 | 롤 → 인박스 수용량 (원단별) — **시뮬레이션의 핵심** |
| roll_weights | 19 | 풀 아웃박스 실측 무게 (키 = 원단×사이즈×미터) |
| ribbon_specs | 199 | 원단별 존재 치수 → 원단 드롭다운 |
| ribbon_types | 19 | 원단 코드명 → 원단 드롭다운 |

> ⚠️ `list_tables`가 보고하는 행 수는 낡은 값이다(ribbon_types를 1로 보고한 적 있음).
> 반드시 `SELECT COUNT(*)`로 직접 셀 것.

### 📂 자료실 (2026-07-14 신설 — 시뮬레이션과 완전 분리)
| 대상 | 용도 |
|------|------|
| `archive_files` 테이블 | 자료 제목·설명·파일경로·용량 (BE-05가 읽음) |
| Storage 버킷 `archive` | 파일 실물. **공개 읽기** |

> 업로드 UI는 **일부러 만들지 않았다**. 파일은 관리자가 Supabase 대시보드에서 직접 올린다.
> 웹 업로드가 없으므로 인증도 필요 없고, 사이트는 "로그인 없는 공개 사이트"로 남는다
> (사용자 결정 2026-07-14).
> ⚠️ 공개 버킷이다 — **링크를 아는 사람은 누구나 받는다.** 대외비 자료를 올리려면
> 비공개 버킷 + 인증이 먼저 필요하다.

> ✅ Phase 6 Step 1·2에서 DB 연동 완료. 런타임 진실은 Supabase이며
> `master.json`은 테스트 픽스처로만 남았다.

> 🔴 보안: public 스키마 **27개 테이블 전부 RLS 비활성화**. Phase 7에서 처리.
> (문서에 오래 적혀 있던 "18개"는 낡은 값 — 2026-07-14 실측 27개)

---

## 📋 모듈 목록 & 상태

| # | 모듈 | 핵심 파일 | 상태 |
|---|------|-----------|------|
| FE-01 | 레이아웃 | components/layout/ | ✅ 완료 |
| FE-02 | 홈 페이지 | components/home/, app/page.tsx | ✅ 완료 |
| FE-03 | 주식 목록/그리드 | components/stock/SimTile.tsx, lib/stock/tiles.ts, app/stock/page.tsx | ✅ 완료 |
| FE-04 | 주식 시뮬레이션 실행 | components/stock/StockParams,Result.tsx, app/stock/etf, app/stock/[id] | ✅ 완료 |
| FE-05 | 회사 목록 | components/company/CompanyTile.tsx, app/company/page.tsx | ✅ 완료 |
| FE-06 | 회사 시뮬레이션 실행 | components/company/CompanyParams,Result.tsx, app/company/[id] | ✅ 완료 |
| FE-07 | SVG 엔진 | components/svg/, lib/svg/generators.ts | ✅ 완료 |
| BE-01 | API: 주식 (목록/range/backtest) | app/api/stocks, api/stocks/[id]/range, api/backtest | ✅ 완료 (종목 목록은 아직 하드코딩) |
| BE-02 | API: 파렛트 (DB) | ~~app/api/pallets/route.ts~~ | ⛔ 폐기 — BE-04로 통합 |
| BE-03 | API: 제품 | ~~app/api/products/route.ts~~ | ⛔ 폐기 — BE-04로 통합 |
| BE-04 | API: 회사 마스터 (DB 5테이블 → MasterData 조립) | app/api/company/master/route.ts | ✅ 완료 (Phase 6 Step 1·2) |
| BE-05 | API: 자료실 목록 | app/api/archive/route.ts | ✅ 완료 (2026-07-14) |
| FE-08 | 자료실 화면 | app/archive/page.tsx | ✅ 완료 (2026-07-14) |
| FE-09 | 홈 MORE TOOLS 3칸 | components/home/MoreTools,ToolTile.tsx, lib/home/tools.ts | ✅ 완료 (2026-07-14) |
| LIB-01 | 회사 계산 엔진 | lib/company/ (data.ts 하이드레이션 + 엔진 7종 + simulate) | ✅ 완료 |
| LIB-02 | Supabase 클라이언트 | lib/supabase/ | ✅ 완료 |
| DB-01 | DB 스키마 | — | ✅ 완료 |
| DB-02 | RLS 계획 | — | 🔲 Phase 7 |

---

## 🚦 진행 단계

```
✅ Phase 0 — 아키텍처 설계 & 문서화
✅ Phase 1 — Next.js 프로젝트 초기화
✅ Phase 2 — 공통 레이아웃 + 라우팅 (FE-01, LIB-02)
✅ Phase 3 — 홈 페이지 (FE-02, FE-07)
✅ Phase 4 — 주식 시뮬레이션 (FE-03, FE-04, BE-01) — Python FastAPI(Railway) 연동
✅ Phase 4.5 — ETF 그리드 재설계 + 직접입력 + 조회 3-상태 UX
✅ Phase 5 Step 1 — 박스·파렛트 적재 시뮬레이션 (FE-05, FE-06, LIB-01) — 10개 케이스 검증
✅ Phase 5 Step 2 — SizedInnerCount 사이즈 보존 + outerbox 알고리즘 개선 + master.json JSON 분리 — 18개 케이스 검증
✅ Phase 5 Step 3 — 대대적인 개선: 3-1 박스 5열 / 3-2 규격·오버행 / 3-3 슬롯·빈칸·오버 / 3-4 원단 타입+무게 분리 / 3-5 통합 검증 — 전부 완료
🔶 Phase 6 — DB 연동 (master.json → Supabase)
   ✅ Step 1 — 박스 시뮬 DB 전환 (master API + data.ts 하이드레이션 + roll_weights 신설)
   ✅ Step 2 — 특수 원단 노출 + 원단 드롭다운 (스펙 키 = 원단×사이즈×미터, 80치수)
   🔲 Step 3 — 서비스코아 계산 엔진 (스펙 키에 코아 추가) ← 다음
🔲 Phase 7 — 보안 (RLS)
🔲 Phase 8 — Vercel 배포 & 검증
```

### ✅ 해결된 결함
- ~~홈 주요 전략 3카드가 죽은 링크~~ — `/stock/1·2·3`은 존재하지 않는 종목이었다
  (Phase 4.5 주식 라우팅 재설계 때 홈만 안 따라옴). **2026-07-14 해결**: 그 섹션을
  `MORE TOOLS`(준비중 2 + 자료실)로 교체하며 죽은 링크가 소멸.

---

## ⚠️ 절대 규칙

1. **레이아웃 변경 금지** — 원본 HTML 레이아웃·스타일 사용자 지시 없이 변경 금지
2. **코딩 명령 없이 코딩 금지** — 명시적 명령 후 코드 작성
3. **DB 파괴 금지** — 수정·추가는 자유. 단 DB 내용이 꼬이거나 삭제되는 일은 없어야 한다.
   <!-- 보류 (2026-07-13) — 완성 후 되살릴 것
   3. **리본/라벨 테이블 손대지 않기** — ❌ 표기 15개 테이블 절대 수정 금지 -->
4. **모듈 분리** — 각 컴포넌트 독립 파일
5. **타입 안전** — `any`/`unknown` 금지, 모든 인터페이스 types/ 폴더
6. **typecheck 유지** — `npx tsc --noEmit` 항상 통과
7. **작업 완료 시** — PROGRESS.md `[x]` 업데이트 후 코밋
8. **보존 목록** — `app/stock/**`, `components/stock/**`, `components/layout/**`, `lib/stock/**`, `lib/svg/**`, `lib/supabase/**`, `types/backtest.ts`, `types/stock.ts`, `python/**`, `components/svg/PalletSvg.tsx` — 절대 수정 금지
   <!-- `types/database.ts` 는 보존 목록에서 보류 (2026-07-13) — DB 스키마가 계속
        확장되는 단계라 타입도 같이 자라야 한다. 완성 후 목록에 되돌릴 것. -->
   <!-- `app/page.tsx` · `components/home/**` 는 보존 목록에서 **해제** (2026-07-14, 사용자 승인).
        홈의 주요 전략 3카드가 죽은 링크였고, 그 자리를 자료실 + 준비중 2칸으로 바꾸기로 했다.
        홈을 의도적으로 개편하는 단계이므로 잠가둘 수 없다. 개편이 끝나면 되살릴 것. -->
9. **DB 스키마 확장 시** — `types/database.ts` 에 실제 컬럼과 일치하는 Row 타입을 추가한다.
   `as` 캐스팅·`any` 로 우회하지 않는다 (규칙 5와 동일선상).

---

## 🪤 트랩 (밟은 적 있는 지뢰만 적는다)

1. **HTTP 200은 신선도를 증명하지 않는다.** Next.js Data Cache가 supabase-js의 GET fetch를
   캐싱해 API가 하루 지난 행을 200으로 내려줬다. `lib/supabase/server.ts`의
   `cache:'no-store'`가 그 방어선이다. 검증은 상태코드가 아니라 **응답 본문**으로 한다.
2. **인박스는 데이터가 아니라 코드 계약이다.** `InnerBoxKind = 60|95|145` 하드코딩.
   미지의 `inner_box_id`를 가리키는 수용량 행 하나면 시뮬레이션 전체가 500.
3. **`list_tables`의 행 수는 낡았다.** ribbon_types를 1로 보고한 적 있다(실제 19).
   항상 `SELECT COUNT(*)`로 직접 셀 것.
4. **시뮬레이션이 읽는 건 `roll_box_capacities`/`roll_weights`다. `products`가 아니다.**
5. **부분 유니크 인덱스는 `pg_constraint`에 안 나온다.** `pg_indexes`를 봐야 한다.
6. **상상하지 말고 물어본다.** "코아안붙임" "90인박스" 같은 현장 용어는 뻔해 보이는 해석이
   틀린 경우가 반복됐다.

---

## 🆕 새 세션 시작 체크리스트

```
1. docs/MASTER.md 읽기 (이 파일)
2. docs/PROGRESS.md 열어서 현재 단계 확인
3. 사용자에게 현재 상황 보고: "다음 단계: Phase X — [모듈명]"
4. 사용자 코딩 명령 대기
```

---

## 🎨 디자인 토큰 (전역, 변경 금지)

```typescript
const COLORS = {
  bg: '#14110E', gold: '#C9A86A', goldBr: '#DCC08A',
  text: '#E8E0D2', muted: '#9C9486', subtle: '#8c8478', headerLabel: '#8c7a55',
  up: '#8FBFA0', down: '#C77B66',
  cardBg: 'linear-gradient(180deg,#1a1510,#15110d)',
  darkBg: '#0f0c0a',
} as const;
// Cormorant Garamond(serif) / Manrope(sans) / JetBrains Mono(mono)
// CSS 변수: var(--font-cormorant) / var(--font-manrope) / var(--font-jetbrains-mono)
// 테두리: rgba(201,168,106,0.15), borderRadius: 2px
// CSS 클래스 금지 — 전부 인라인 스타일
```
