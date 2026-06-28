# MERIDIAN — 진행 상황 체크리스트
> 각 항목 완료 시 `- [ ]` → `- [x]` 로 변경 후 코밋.
> 새 세션 시작 시 이 파일로 현재 위치를 파악한다.

---

## ✅ Phase 0 — 아키테체마 설계 & 문서화
- [x] 원본 HTML 분석
- [x] 기술 스택 결정 (Next.js 14, Vercel, Supabase)
- [x] DB 현황 파악 (Supabase 테이블 18개 확인)
- [x] 보안 현황 파악 (RLS 전체 비활성화)
- [x] 모듈 구조 설계
- [x] 전체 문서화 완료 (MASTER.md + 14개 모듈 문서)

---

## ✅ Phase 1 — Next.js 프로젝트 초기화
- [x] `package.json` 생성 (next@14.2.35, supabase-js@2.108.2, ssr@0.12.0)
- [x] `next.config.js` 생성
- [x] `tsconfig.json` 생성 (strict mode)
- [x] `.eslintrc.json` 생성
- [x] `.gitignore` 생성
- [x] `.env.example` 생성 (값 없이 키 이름만)
- [x] `app/globals.css` 생성
- [x] `app/layout.tsx` 생성 (메타데이터 + body)
- [x] `app/page.tsx` 생성 (placeholder)
- [x] `types/database.ts` 생성 (PalletType, OuterBoxType, InnerBoxType)
- [x] `types/stock.ts` 생성 (StockConfig, PricePoint, Params, Result)
- [x] `types/company.ts` 생성 (Product, Params, PalletLayer, Result)
- [x] 폴더 구조 생성 (components/, lib/ 하위 폴더 8개)
- [x] Vercel 배포 연결 확인 (GitHub push 후 자동 배포)

---

## ✅ Phase 2 — 공통 레이아웃 + 라우팅
- [x] `app/layout.tsx` — next/font/google 3종 폰트 + CSS 변수 (→ FE-01)
- [x] `app/globals.css` — keyframe 애니메이션 + input 스타일 (→ FE-01)
- [x] `lib/supabase/client.ts` (→ LIB-02)
- [x] `lib/supabase/server.ts` (→ LIB-02)
- [x] `types/database.ts` — Database 제네릭 타입 추가 (→ LIB-02)
- [x] `components/layout/Ticker.tsx` (→ FE-01)
- [x] `components/layout/InnerHeader.tsx` (→ FE-01)
- [x] 라우팅 폴더 구조 생성 (stock/, company/ + [id] 폴더)
- [x] `npx tsc --noEmit` 확인

---

## ✅ Phase 3 — 홍 페이지
- [x] `lib/svg/generators.ts` (→ FE-07)
- [x] `components/svg/LineSvg.tsx` (→ FE-07)
- [x] `components/svg/CandleSvg.tsx` (→ FE-07)
- [x] `components/svg/PalletSvg.tsx` (→ FE-07)
- [x] `components/svg/IconSvg.tsx` (→ FE-07)
- [x] `components/home/HeroSection.tsx` (→ FE-02)
- [x] `components/home/EntryTiles.tsx` (→ FE-02)
- [x] `components/home/FeaturedStrategies.tsx` (→ FE-02)
- [x] `components/home/StatsBand.tsx` (→ FE-02)
- [x] `components/home/QuoteFooter.tsx` (→ FE-02)
- [x] `app/page.tsx` — 홈 통합 (→ FE-02)
- [ ] 홈 화면 브라우저 확인

---

## ✅ Phase 4 — 주식 시뮬레이션 (Python FastAPI 서버 방식)

### Step 1 — Python FastAPI 서버 ✅
- [x] `python/app/__init__.py`
- [x] `python/app/config_loader.py` (신규 작성)
- [x] `python/app/models.py` (annual_dividend_krw 연도별 배당 필드 추가)
- [x] `python/app/engine.py` (연도별 배당 추적 3곳 수정)
- [x] `python/app/csv_io.py`
- [x] `python/app/logging_setup.py`
- [x] `python/app/paths.py`
- [x] `python/app/xirr.py`
- [x] `python/app/data_provider.py`
- [x] `python/app/controller.py`
- [x] `python/api/__init__.py`
- [x] `python/api/schemas.py`
- [x] `python/api/routes/__init__.py`
- [x] `python/api/routes/health.py`
- [x] `python/api/routes/stocks.py`
- [x] `python/api/routes/backtest.py`
- [x] `python/main.py`
- [x] `python/requirements.txt`
- [x] `python/Procfile`
- [x] `python/config/config.ini.default`
- [ ] 로컬 검증: `cd python && uvicorn main:app` → `curl /health`
- [x] Railway/Render 배포 → `https://meridian-production-e345.up.railway.app`

### Step 2 — TypeScript 타입 & Next.js API Route ✅
- [x] `types/backtest.ts`
- [x] Vercel `PYTHON_SERVER_URL` 설정 + Redeploy 완료
- [x] `app/api/stocks/route.ts`
- [x] `app/api/stocks/[id]/range/route.ts`
- [x] `app/api/backtest/route.ts`
- [x] `npx tsc --noEmit` 통과 확인

### Step 3 — 종목 목록 화면 ✅
- [x] `components/stock/StockCard.tsx`
- [x] `app/stock/page.tsx`
- [x] `npx tsc --noEmit` 통과

### Step 4 — 시뮬레이션 실행 화면 ✅
- [x] `package.json` — recharts@^2.12.0 추가
- [x] `components/stock/StockParams.tsx` (좌측 입력 패널, Client Component)
- [x] `components/stock/StockResult.tsx` (recharts LineChart + 연도별 CSS 바)
- [x] `app/stock/[id]/page.tsx` (2패널 레이아웃 통합, Client Component)
- [x] `npx tsc --noEmit` 통과
- [x] Vercel 빌드 확인 (push 후 자동 배포)
- [ ] `/stock/schd` 전체 흐름 확인 (Python 서버 기동 후)

### Step 5 — 문서 업데이트 ✅
- [x] PROGRESS.md Phase 4 체크리스틈 완료 처리
- [x] MASTER.md 모듈 상태 업데이트

---

## ✅ Phase 4.5 — ETF 그리드 재설계 + 직접입력 + 조회 UX

> 선행: `/stock` 서버 self-fetch 500 버그는 커밋 `4830f81`에서 수정 완료.

### Step 1 — ETF 그리드 재설계 (요청 ①) ✅ — 커밋 `f7255f8`
- [x] `lib/stock/tiles.ts` (그리드 6칸 단일 소스: ETF 시뮬레이션 활성 + ETF 비교/스위칭/준비중×3 비활성)
- [x] `components/stock/SimTile.tsx` (active = Link / coming-soon = dim div)
- [x] `app/stock/page.tsx` 타일 기반 그리드로 전환
- [x] `npx tsc --noEmit` 통과 / `npm run build` 통과 (폰트 스텁 로컬)

### Step 2 — 직접입력 화면 + range 3-상태 (요청 ①②) ✅ — 커밋 `38c83cf`
- [x] `app/stock/etf/page.tsx` (티커/코드 직접입력 → range 3-상태 조회 → 기존 2패널 재사용)
- [x] `components/stock/StockParams.tsx` `rangeStatus`·`onRetryRange` 필수 prop + 실패 UI([다시 시도])
- [x] `app/stock/[id]/page.tsx` range 3-상태 동일 적용 (무한 "조회 중…" 멈춤 근본 수정)
- [x] `npx tsc --noEmit` 통과 / `npm run build` 통과 (폰트 스텁 로컬)

### Step 3 — 인프라 (요청 ②, 사용자) ✅
- [x] Python Railway 배포 → `https://meridian-production-e345.up.railway.app`
- [x] Vercel `PYTHON_SERVER_URL` 설정 → Redeploy
- [x] `/api/stocks/schd/range` 정상 응답 확인
- [x] `/stock/etf` SCHD 입력 → 백테스트 전체 흐름 브라우저 확인 (ok/error 분기 모두 검증)

### Step 4 — 문서 ✅
- [x] PROGRESS.md / MASTER.md 갱신

---

## ✅ Phase 5 — 회사 시뮬레이션 Step 1 (박스·파렛트 적재)

### Step 1-A — 데이터 & 타입 기반 ✅ — 커밋 `e8f5590`
- [x] `types/company.ts` 새 타입으로 교체 (InnerBoxKind, PackedBox, CompanyResult 등)
- [x] `lib/company/data.ts` 마스터 데이터 작성 (제품3·인박스3·아웃박스2·파렛트5)
- [x] `lib/company/tiles.ts` 6타일 데이터 작성
- [x] `npx tsc --noEmit` 통과

### Step 1-B — 계산 엔진 4종 (백엔드) ✅ — 커밋 `891b163`
- [x] `lib/company/innerbox.ts` (엔진① — 인박스 분해)
- [x] `lib/company/outerbox.ts` (엔진② — 박스 조합 FFD)
- [x] `lib/company/pallet.ts` (엔진③ — 파렛트 적재)
- [x] `lib/company/weight.ts` (엔진④ — 무게 계산)
- [x] `lib/company/simulate.ts` (통합 오케스트레이터)
- [x] 검증 스크립트 10개 케이스 전부 통과 (verify.ts)
- [x] `npx tsc --noEmit` 통과

### Step 1-C — 목록 화면 ✅ — 커밋 `929474a`
- [x] `components/company/CompanyTile.tsx`
- [x] `app/company/page.tsx` (6타일 그리드, 헤더 02/OPERATIONS SIMULATION)
- [x] `npx tsc --noEmit` 통과

### Step 1-D — 시각화(SVG) ✅ — 커밋 `abbaacd`
- [x] `components/company/BoxSvg.tsx` (아이소메트릭 박스 그림)
- [x] `components/company/CompanyPalletSvg.tsx` (파렛트 적재 형상)
- [x] `npx tsc --noEmit` 통과

### Step 1-E — 실행 화면 ✅ — 커밋 `c2fb0d4`
- [x] `components/company/CompanyParams.tsx` (입력 패널, 제품 추가)
- [x] `components/company/CompanyResult.tsx` (박스 그림+텍스트, 파렛트 그림+텍스트)
- [x] `app/company/[id]/page.tsx` (2패널 통합)
- [x] `npx tsc --noEmit` 통과

### Step 1-F — 검증 & 문서 ✅
- [x] 로컬 클론 + `npm install` + `npx tsc --noEmit` 통과
- [x] `npm run build` 통과 (폰트 스텁 로컬)
- [x] 검증 로그 마크다운 문서 작성
- [x] `docs/PROGRESS.md` / `docs/MASTER.md` Phase 5 Step 1 완료 처리

---

## ✅ Phase 5 Step 2 — 박스 조합 로직 개선 (SizedInnerCount + 단위표 JSON 분리)

### Step 2-0 — 백업 ✅ — 커밋 `ebece39`
- [x] 9개 파일을 `lib/company/_backup/`에 복사

### Step 2-1 — 타입 변경 ✅ — 커밋 `08461d7`, `c5c3539`
- [x] `types/company.ts`에 `SizedInnerCount` 인터페이스 추가
- [x] `PackedBox.contents` 타입 `InnerBoxCount[]` → `SizedInnerCount[]`
- [x] `tsconfig.json`에 `_backup` exclude 추가

### Step 2-2 — 엔진① 사이즈 부착 ✅ — 커밋 `21bd8e5`
- [x] `lib/company/innerbox.ts` 반환 타입 `SizedInnerCount[]`로 (size/meter/productQty 부착)

### Step 2-3 — 마스터 데이터 JSON 분리 ✅
- [x] `lib/company/master.json` 생성 (`_rules` 설명 + products/innerBoxes/outerBoxes/pallets/innerUnits)
- [x] `lib/company/data.ts` 재작성: JSON import → 타입 입혀 재노출 (export 시그니처 유지)

### Step 2-4 — 엔진② `outerbox.ts` 재작성 ✅
- [x] "같은 사이즈 먼저, 딱 떨어질 때만 합친다" 신 규칙 구현
- [x] subset-sum 정확 합침 + finalize(택배/낱개) 방식
- [x] `OUTER_CAP`/`COURIER_CAP` data(`capacityUnit`)에서 읽어 중앙화

### Step 2-5 — BoxSvg / CompanyPalletSvg UI 연결 ✅
- [x] `components/company/BoxSvg.tsx`: `SizedInnerCount` 기반 내용물 한 줄 표기 (`{size}×{meter}m {kind}×{count}({productQty}개)`)
- [x] `components/company/CompanyPalletSvg.tsx`: 마지막 층 빈자리 점선 outline 시각화, 다중 파렛트 안내 텍스트

### Step 2-6 — 검증 ✅ (18/18 통과)
- [x] `scripts/test-step4.ts` 18개 케이스 (HANDOFF §4.4 예시 A/B/C + 3사이즈 혼합)
- [x] `npx tsc --noEmit` 에러 0
- [x] `npm run build` 통과 (폰트 스텁 로컬)
- [x] `docs/PHASE5-STEP2-VERIFY-LOG.md` 생성

---

## 🔲 Phase 6 — DB 연동
- [ ] `pallet_types` 실제 데이터 확인
- [ ] `/api/pallets` → Supabase 연결 검증
- [ ] per_layer 콜럼 추가 여부 사용자 결정
- [ ] 하드코딩 → DB 데이터 교체

---

## 🔲 Phase 7 — 보안
- [ ] RLS 정적 사용자 확인
- [ ] 리발/라벨 테이블 RLS 활성화 + 차단
- [ ] 시뮬레이션 테이블 RLS + SELECT 공개 허용
- [ ] /api/pallets 정상 응답 확인

---

## 🔲 Phase 8 — 배포 & 검증
- [ ] Vercel 환경변수 전체 설정
- [ ] `npm run build` 에러 없음
- [ ] 전체 시나리오 테스트 (홈 → 주식 → 회사)
- [ ] 모바일 뷰 확인

---

## 📅 완료 기록

| 날짜 | Phase | 내용 | 담당 |
|------|-------|------|------|
| 2026-06-23 | Phase 0 | 전체 아키테체마 설계 & 문서화 | Claude Sonnet 4.6 |
| 2026-06-24 | Phase 1 | Next.js 14 프로젝트 초기화 (next@14.2.35) | Claude Sonnet 4.6 |
| 2026-06-24 | Phase 2 | 공통 레이아웃 + 라우팅 (FE-01, LIB-02) | Claude Sonnet 4.6 |
| 2026-06-25 | Phase 3-1 | SVG 엔진 구현 (FE-07: generators, LineSvg, CandleSvg, PalletSvg, IconSvg) | Claude Sonnet 4.6 |
| 2026-06-25 | Phase 3-2 | 홈 페이지 구현 (FE-02: HeroSection, EntryTiles, FeaturedStrategies, StatsBand, QuoteFooter, page.tsx) | Claude Sonnet 4.6 |
| 2026-06-25 | Phase 4-Step1 | Python FastAPI 서버 구축 (20개 파일: app/ 10개 + api/ 6개 + 루트 4개) | Claude Sonnet 4.6 |
| 2026-06-25 | Phase 4-Step2 | TypeScript 타입 + Next.js API Route 4개 (types/backtest.ts, api/stocks, api/stocks/[id]/range, api/backtest) | Claude Sonnet 4.6 |
| 2026-06-25 | Phase 4-Step3 | 종목 목록 화면 (FE-03: StockCard.tsx, app/stock/page.tsx) | Claude Sonnet 4.6 |
| 2026-06-26 | Phase 4-Step4 | 시뮬레이션 실행 화면 (FE-04: StockParams.tsx, StockResult.tsx, app/stock/[id]/page.tsx, recharts) | Claude Sonnet 4.6 |
| 2026-06-26 | 버그수정 | `/stock` 서버 self-fetch 500 수정 (커밋 4830f81) | Claude |
| 2026-06-26 | Phase 4.5-Step3 | 인프라: Python Railway 배포 + Vercel PYTHON_SERVER_URL 설정 + Redeploy | 사용자 |
| 2026-06-26 | Phase 4.5-Step1 | ETF 그리드 재설계 (tiles.ts, SimTile.tsx, stock/page.tsx) 커밋 f7255f8 | Claude Opus 4.8 |
| 2026-06-26 | Phase 4.5-Step2 | ETF 직접입력 + range 3-상태 (etf/page.tsx, StockParams.tsx, [id]/page.tsx) 커밋 38c83cf | Claude Opus 4.8 |
| 2026-06-26 | Phase 4.5-Step4 | PROGRESS.md / MASTER.md 갱신 | Claude Opus 4.8 |
| 2026-06-27 | Phase 5-Step1-A | 타입 교체 + 마스터 데이터 + 타일 (커밋 e8f5590) | Claude Sonnet 4.6 |
| 2026-06-27 | Phase 5-Step1-B | 계산 엔진 5종 (innerbox/outerbox/pallet/weight/simulate) 커밋 891b163 | Claude Sonnet 4.6 |
| 2026-06-27 | Phase 5-Step1-C | 목록 화면 (CompanyTile + /company 6타일) 커밋 929474a | Claude Sonnet 4.6 |
| 2026-06-27 | Phase 5-Step1-D | SVG 시각화 (BoxSvg + CompanyPalletSvg) 커밋 abbaacd | Claude Sonnet 4.6 |
| 2026-06-27 | Phase 5-Step1-E | 실행 화면 (CompanyParams + CompanyResult + /company/[id]) 커밋 c2fb0d4 | Claude Sonnet 4.6 |
| 2026-06-27 | Phase 5-Step1-F | 검증 로그 + 문서 갱신 | Claude Sonnet 4.6 |
| 2026-06-28 | Phase 5-Step2 | 마스터 JSON 분리 + outerbox 재작성 + SizedInnerCount UI 연결 + 18/18 검증 | Claude Sonnet 4.6 |
