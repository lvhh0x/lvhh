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
| 현재 단계 | **Phase 5 Step 3 진행 중 — Step 3-1~3-4 완료(박스 5열·규격/오버행·슬롯·원단 타입+무게 분리). 남음: Step 3-5 통합 검증(브라우저 육안 `/company/box-pallet`). 상세: `docs/PHASE5-STEP3-STEP4-IMPL.md`, 검증 `docs/PHASE5-STEP3-VERIFY-LOG.md`. Step 3 완료 후 Phase 6 DB 연동** |

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

## 📁 실제 레포지토리 구조 (Phase 5 Step 2 완료 기준)

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
│   └── api/
│       ├── stocks/route.ts             # GET /api/stocks
│       ├── stocks/[id]/range/route.ts  # GET /api/stocks/[id]/range
│       └── backtest/route.ts           # POST /api/backtest
├── components/
│   ├── layout/ (InnerHeader, Ticker)
│   ├── home/ (HeroSection, EntryTiles, FeaturedStrategies, StatsBand, QuoteFooter)
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
│   ├── company/                        ← Phase 5 Step 2 완료 ✅
│   │   ├── master.json  (마스터 데이터 JSON — single source of truth)
│   │   ├── data.ts      (JSON 읽어 타입 입혀 재노출)
│   │   ├── tiles.ts     (6타일 단일 소스)
│   │   ├── innerbox.ts  (엔진① 인박스 분해 — SizedInnerCount 반환)
│   │   ├── outerbox.ts  (엔진② 박스 조합 — 딱떨어질때만 합침 그리디)
│   │   ├── pallet.ts    (엔진③ 파렛트 적재)
│   │   ├── weight.ts    (엔진④ 무게 계산)
│   │   └── simulate.ts  (통합 오케스트레이터)
│   ├── svg/ (generators.ts)
│   └── supabase/ (client.ts, server.ts)
├── types/
│   ├── company.ts   (Phase 5 Step 2 업데이트 ✅ — SizedInnerCount 추가)
│   ├── backtest.ts
│   ├── stock.ts
│   └── database.ts
├── python/          (FastAPI 서버 — Railway 배포)
└── docs/
    ├── MASTER.md
    ├── PROGRESS.md
    ├── PHASE5-STEP2-HANDOFF.md
    ├── PHASE5-STEP2-IMPL-PLAN.md
    ├── PHASE5-STEP2-VERIFY-LOG.md
    ├── PHASE5-STEP3-PLAN.md        (← Step 3 마스터 계획)
    └── PHASE5-STEP3-IMPL-PLAN.md   (← Step 3 5단계 상세 설계)
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

### ❌ 절대 건드리지 말 것 — 리본/라벨 제조 비즈니스 (15개)
ribbon_types, label_specs, customers, delivery_routes, label_batches, label_batch_default_ribbons, label_spec_explicit_ribbons, label_spec_unclassified_notes, core_specs, packaging_finishes, packaging_styles, customer_ribbon_aliases, inner_box_quantity_specs, ribbon_box_specs, ribbon_box_spec_ribbon_types

### ✅ 시뮬레이션에서 사용할 기존 테이블
| 테이블 | 행 수 | 용도 |
|--------|-------|------|
| pallet_types | 5 | 파렛트 규격 → /api/pallets (Phase 6) |
| outer_box_types | 2 | 아웃박스 규격 (Phase 6) |
| inner_box_types | 2 | 인박스 규격 (Phase 6) |

> Phase 5 Step 2까지 모두 하드코딩(master.json). Phase 6에서 Supabase DB 연동 예정.

> 🔴 보안: 전체 18개 테이블 RLS 비활성화. Phase 7에서 처리.

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
| BE-01 | API: 주식 (목록/range/backtest) | app/api/stocks, api/stocks/[id]/range, api/backtest | ✅ 완료 |
| BE-02 | API: 파렛트 (DB) | app/api/pallets/route.ts | 🔲 Phase 6 |
| BE-03 | API: 제품 | app/api/products/route.ts | 🔲 Phase 6 |
| LIB-01 | 회사 계산 엔진 | lib/company/ (master.json + data.ts + 5개 엔진 + simulate) | ✅ 완료 |
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
🔄 Phase 5 Step 3 — 대대적인 개선: 3-1 박스 5열 ✅ / 3-2 규격·오버행 ✅ / 3-3 슬롯·빈칸·오버 ✅ / 3-4 원단 타입+무게 분리 ✅ / 3-5 통합 검증(브라우저 육안) 🔲
🔲 Phase 6 — DB 연동 (master.json → Supabase)
🔲 Phase 7 — 보안 (RLS)
🔲 Phase 8 — Vercel 배포 & 검증
```

---

## ⚠️ 절대 규칙

1. **레이아웃 변경 금지** — 원본 HTML 레이아웃·스타일 사용자 지시 없이 변경 금지
2. **코딩 명령 없이 코딩 금지** — 명시적 명령 후 코드 작성
3. **리본/라벨 테이블 손대지 않기** — ❌ 표기 15개 테이블 절대 수정 금지
4. **모듈 분리** — 각 컴포넌트 독립 파일
5. **타입 안전** — `any`/`unknown` 금지, 모든 인터페이스 types/ 폴더
6. **typecheck 유지** — `npx tsc --noEmit` 항상 통과
7. **작업 완료 시** — PROGRESS.md `[x]` 업데이트 후 코밋
8. **보존 목록** — `app/page.tsx`, `app/stock/**`, `components/stock/**`, `components/home/**`, `components/layout/**`, `lib/stock/**`, `lib/svg/**`, `lib/supabase/**`, `types/backtest.ts`, `types/stock.ts`, `types/database.ts`, `python/**`, `components/svg/PalletSvg.tsx` — 절대 수정 금지

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
