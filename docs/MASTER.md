# MERIDIAN · Private Simulation Desk — MASTER
> ⚡ **새 세션 시작 시 반드시 이 파일을 첫 번째로 읽는다**
> 모든 판단 기준은 이 문서에 있다. 모호하면 코딩 전 사용자에게 확인 후 진행.

---

## 📌 프로젝트 개요

**MERIDIAN Private Simulation Desk** — 주식 백테스트 시뮬레이션 + 회사 운영 시뮬레이션(팔레트 적재 등)을 제공하는 공개 웹사이트.

| 항목 | 내용 |
|------|------|
| 레포지토리 | `github.com/lvhh0x/lvhh` (main 브랜치) |
| 배포 | Vercel — main 브랜치 push 시 자동 배포 |
| DB | Supabase 프로젝트 `lnnxjwfvzaelsoupozke` (ap-northeast-1, Tokyo) |
| 접근 방식 | 공개 사이트 (로그인 없음) |
| 원본 HTML | `시뮬레이션_데스크_럭셔리_dc.html` (이 파일이 레이아웃 기준) |
| 현재 단계 | **Phase 4.5 완료 — 주식 시뮬레이션(ETF 그리드 + 직접입력 + 조회 UX) 완성. 다음: Phase 5 회사 시뮬레이션** |

---

## 🏗️ 기술 스택

| 구분 | 기술 | 선택 이유 |
|------|------|-----------|
| 프레임워크 | **Next.js 14 (App Router)** | Vercel 최적, API Routes 내장, 미래 확장 용이 |
| 언어 | **TypeScript** (strict) | 타입 안전, 모듈 간 계약 보장. `any`/`unknown` 금지 |
| 스타일 | **인라인 스타일** (기존 HTML 그대로) | 레이아웃 변경 금지 원칙 준수 |
| 백엔드 | **Next.js API Routes** | 별도 서버 불필요, 같은 레포 내 관리 |
| DB | **Supabase** (PostgreSQL 17) | 기존 연동 완료 |
| 배포 | **Vercel** | GitHub 연동 자동 배포 |

---

## 📁 레포지토리 전체 구조

```
lvhh/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # / → 홈
│   ├── stock/
│   │   ├── page.tsx                    # /stock → 시뮬레이션 타일 그리드
│   │   ├── etf/page.tsx                # /stock/etf → ETF 직접입력 실행
│   │   └── [id]/page.tsx               # /stock/[id] → 종목 실행(유휴, 보존)
│   ├── company/
│   │   ├── page.tsx                    # /company → 회사 목록
│   │   └── [id]/page.tsx               # /company/[id] → 회사 실행
│   └── api/
│       ├── stocks/route.ts             # GET /api/stocks
│       ├── pallets/route.ts            # GET /api/pallets ← Supabase
│       └── products/route.ts           # GET /api/products
├── components/
│   ├── layout/ (InnerHeader, Ticker)
│   ├── home/ (HeroSection, EntryTiles, FeaturedStrategies, StatsBand, QuoteFooter)
│   ├── stock/ (SimTile, StockCard, StockParams, StockResult)
│   ├── company/ (CompanyCard, CompanyParams, CompanyResult)
│   └── svg/ (LineSvg, CandleSvg, PalletSvg, IconSvg)
├── lib/
│   ├── simulation/ (stock.ts, company.ts)
│   ├── stock/ (tiles.ts, configs.ts)
│   ├── svg/ (generators.ts)
│   └── supabase/ (client.ts, server.ts)
├── types/ (stock.ts, company.ts, database.ts)
└── docs/ ← 이 폴더
    ├── MASTER.md
    ├── PROGRESS.md
    └── modules/ (FE-01~07, BE-01~03, DB-01~02, LIB-01~02)
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
ribbon_types(18), label_specs(218), customers(64), delivery_routes(57), label_batches(9), label_batch_default_ribbons(12), label_spec_explicit_ribbons(31), label_spec_unclassified_notes(8), core_specs(7), packaging_finishes(3), packaging_styles(3), customer_ribbon_aliases(10), inner_box_quantity_specs(0), ribbon_box_specs(20), ribbon_box_spec_ribbon_types(80)

### ✅ 시뮬레이션에서 사용할 기존 테이블
| 테이블 | 행 수 | 용도 |
|--------|-------|------|
| pallet_types | 5 | 팔레트 규격 → /api/pallets |
| outer_box_types | 2 | 외박스 규격 |
| inner_box_types | 2 | 인박스 규격 |

> ⚠️ pallet_types에 `per_layer` 컨럼 없음. BE-02 참조.

### 🔲 추후 추가 예정 (사용자 지시 시에만)
- `stock_simulations` — 주식 6종목 설정
- `simulation_products` — 제품 목록 (생수, 라면 등)

> 🔴 보안: 전체 18개 테이블 RLS 비활성화. Phase 7에서 처리. DB-02 참조.

---

## 📋 모듈 목록 & 상태

| # | 모듈 | 핵심 파일 | 문서 | 상태 |
|---|------|-----------|------|------|
| FE-01 | 레이아웃 | components/layout/ | FE-01-layout.md | ✅ 완료 |
| FE-02 | 홈 페이지 | components/home/, app/page.tsx | FE-02-home.md | ✅ 완료 |
| FE-03 | 주식 목록/그리드 | components/stock/SimTile.tsx, lib/stock/tiles.ts, app/stock/page.tsx | FE-03-stock-list.md | ✅ 완료 |
| FE-04 | 주식 시뮬레이션 실행 | components/stock/StockParams,Result.tsx, app/stock/etf, app/stock/[id] | FE-04-stock-run.md | ✅ 완료 |
| FE-05 | 회사 목록 | components/company/CompanyCard.tsx | FE-05-company-list.md | 🔴 미시작 |
| FE-06 | 회사 시뮬레이션 실행 | components/company/CompanyParams,Result.tsx | FE-06-company-run.md | 🔴 미시작 |
| FE-07 | SVG 엔진 | components/svg/, lib/svg/generators.ts | FE-07-svg-engines.md | ✅ 완료 |
| BE-01 | API: 주식 (목록/range/backtest) | app/api/stocks, api/stocks/[id]/range, api/backtest | BE-01-api-stocks.md | ✅ 완료 |
| BE-02 | API: 팔레트 (DB) | app/api/pallets/route.ts | BE-02-api-pallets.md | 🔴 미시작 |
| BE-03 | API: 제품 | app/api/products/route.ts | BE-03-api-products.md | 🔴 미시작 |
| DB-01 | DB 스키마 | — | DB-01-schema.md | ✅ 완료 |
| DB-02 | RLS 계획 | — | DB-02-rls-plan.md | 🟡 계획만 |
| LIB-01 | 시뮬레이션 엔진 | lib/simulation/ | LIB-01-simulation.md | 🔴 미시작 |
| LIB-02 | Supabase 클라이언트 | lib/supabase/ | LIB-02-supabase.md | ✅ 완료 |

---

## 🚦 진행 단계

```
✅ Phase 0 — 아키텍처 설계 & 문서화
✅ Phase 1 — Next.js 프로젝트 초기화
✅ Phase 2 — 공통 레이아웃 + 라우팅 (FE-01, LIB-02)
✅ Phase 3 — 홈 페이지 (FE-02, FE-07)
✅ Phase 4 — 주식 시뮬레이션 (FE-03, FE-04, BE-01) — Python FastAPI(Railway) 연동
✅ Phase 4.5 — ETF 그리드 재설계 + 직접입력 + 조회 3-상태 UX
🔲 Phase 5 — 회사 시뮬레이션 (FE-05, FE-06, BE-02, BE-03)
🔲 Phase 6 — DB 연동
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
8. **새 모듈 추가 시** — 이 MASTER.md 모듈 목록 업데이트

---

## 🆕 새 세션 시작 체크리스트

```
1. docs/MASTER.md 읽기 (이 파일)
2. docs/PROGRESS.md 열어서 현재 단계 확인
3. 작업할 모듈의 docs/modules/XX-XX-*.md 읽기
4. 사용자에게 현재 상황 보고: "다음 단계: Phase X — [모듈명]"
5. 사용자 코딩 명령 대기
```

---

## 🎨 디자인 토큰 (전역, 변경 금지)

```typescript
const COLORS = {
  bg: '#14110E', gold: '#C9A86A', goldBr: '#DCC08A',
  text: '#E8E0D2', muted: '#9C9486', subtle: '#8c8478',
  up: '#8FBFA0', down: '#C77B66',
  cardBg: 'linear-gradient(180deg,#1a1510,#15110d)',
  darkBg: '#0f0c0a',
} as const;
// Cormorant Garamond(serif) / Manrope(sans) / JetBrains Mono(mono)
// CSS 변수: var(--font-cormorant) / var(--font-manrope) / var(--font-jetbrains-mono)
```