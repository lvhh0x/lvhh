# MERIDIAN — 진행 상황 체크리스트
> 각 항목 완료 시 `- [ ]` → `- [x]` 로 변경 후 코밋.
> 새 세션 시작 시 이 파일로 현재 위치를 파악한다.

---

## ✅ Phase 0 — 아키텍처 설계 & 문서화
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

## ✅ Phase 3 — 홈 페이지
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
- [x] 홈 화면 브라우저 확인 (2026-07-14, Chrome 실브라우저 · lvhh.vercel.app)
      FE-02 명세 7요소 전부 정상: 티커 / 상단바 / 히어로("정밀함" italic gold) /
      진입타일 2 / 주요전략 3 / KPI 4(+18.4%·6·3·92.6%) / 인용구 푸터. 콘솔 에러 0
- [x] 🐞 **홈 주요 전략 3카드 죽은 링크** (위 확인 중 발견 → **당일 해결**)
      `app/page.tsx` FEATURED의 id가 `'1'/'2'/'3'`인데
      `app/stock/[id]/page.tsx` STOCK_CONFIGS의 id는 `'schd'` 같은 티커였다.
      `/stock/1` → "종목을 찾을 수 없습니다: 1". 홈의 나가는 링크 7개 중 3개가 죽어 있었다.
      Phase 4.5 주식 라우팅 재설계 때 홈만 따라오지 않은 결과.
      → 아래 **Phase 9(홈 개편 + 자료실)** 에서 MORE TOOLS 섹션으로 교체하며 소멸

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
- [x] ~~로컬 검증: `cd python && uvicorn main:app` → `curl /health`~~
      → 생략. Railway 실배포 서버로 대체 검증됨 (2026-07-14 `/stock/schd` 조회 정상)
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
- [x] `/stock/schd` 전체 흐름 확인 (2026-07-14, Chrome 실브라우저)
      2패널 렌더 + 조회기간 2011-10~2026-07 수신 → Railway 서버 응답 정상

### Step 5 — 문서 업데이트 ✅
- [x] PROGRESS.md Phase 4 체크리스트 완료 처리
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

## ✅ Phase 5 Step 3 — 대대적인 개선 (박스 그리드·파렛트 규격/오버행·원단 타입)

> 상세 설계: `docs/PHASE5-STEP3-PLAN.md` (마스터) + `docs/PHASE5-STEP3-IMPL-PLAN.md` (5단계).
> 데이터 단일 출처: `lib/company/master.json`. 착수는 사용자 코딩 명령 이후.
> ⚠️ 미상값: 60인박스 tare / 택배박스 tare = 0 placeholder (사용자 추후 제공 시 master.json 교체).

### Step 3-1 — 박스 그리드 5열 (요구 1) ✅ — 커밋 `3523124`, `9e74caf`
- [x] `CompanyResult.tsx` 박스 그림 컨테이너 flex-wrap → CSS grid (5열, `minmax(0,1fr)`)
- [x] 하단 정렬 유지 / 텍스트 안 잘림 확인 (Chrome 실브라우저 검증)
- [x] `npx tsc --noEmit` 통과
- [x] (버그 수정) 카드 테두리 오버플로우 발견 → `BoxSvg.tsx` SVG 반응형 스케일링으로 해결

### Step 3-2 — 규격·오버행 엔진 신설 (요구 3+4) ✅ — 상세 `docs/PHASE5-STEP3-STEP2-IMPL.md`
- [x] 파렛트별 박스 배열표 확정 (700=2×2, 900=3×2 회전, 1100/플라스틱=3×3) — 사용자 확정 2026-07-02
- [x] `lib/company/overhang.ts` 신규 (`calcFootprint` — 합산 외곽·오버행 계산)
- [x] `weight.ts`/`simulate.ts` 적재무게 재점검 → productWeight가 이미 전체(택배/낱개) 포함 확인, weight.ts 변경 불필요
- [x] `CompanyResult.tsx` 규격 표시 = 파렛트+박스 합산(+오버행 문구)
- [x] `types/company.ts` PalletLayout + PalletStack footprint/overhang 필드
- [x] master.json 각 pallet에 `layout {cols,rows,rotated}` 하드코딩 (Phase 6 DB 이관 전제)
- [x] 검증 `scripts/test-step3-2.ts` 5/5 통과 + 회귀 test-step4 19/19 통과
- [x] `npx tsc --noEmit` 통과 / `npm run build` 통과 (폰트 스텁 로컬, 원복)

### Step 3-3 — 파렛트 슬롯/빈칸/오버 재설계 (요구 2) ✅ — 상세 `docs/PHASE5-STEP3-STEP3-IMPL.md`, 검증 `docs/PHASE5-STEP3-VERIFY-LOG.md`
- [x] `pallet.ts` 재작성: 파렛트 1개 전제 + 슬롯 환산(아웃1/택배1/낱개2=1)
- [x] 필요슬롯 > boxesPerLayer×5 → 적재 오버(선택 불가) — overflow 신호는 `PalletStack.overflow` 단일 필드(사용자 확정 A)
- [x] 빈칸 배치(아웃→택배→낱개) + 층수/높이 재계산
- [x] `CompanyPalletSvg.tsx` 빈칸 위치에 택배/낱개 렌더 (topper 제거)
- [x] `CompanyResult.tsx` 적재 오버 경고 표시
- [x] `npx tsc --noEmit` 통과 (+ 검증 스크립트 80/80, 회귀 24케이스 통과, 빌드 성공)

### Step 3-4 — 원단 타입 도입 (요구 5) ✅ — 상세 `docs/PHASE5-STEP3-STEP4-IMPL.md`, 검증 `docs/PHASE5-STEP3-VERIFY-LOG.md`
- [x] `types/company.ts` ProductInput/SizedInnerCount에 `fabric` 추가
- [x] `CompanyParams.tsx` 입력 순서: 원단→사이즈→미터→수량 (자유입력 텍스트)
- [x] `innerbox.ts` fabric passthrough
- [x] `outerbox.ts` 같은 원단 우선 그룹핑 (안 차면 섞어 60) — 개수 규칙 불변
- [x] `BoxSvg.tsx` 원단 표기 (1종 "B220 아웃박스" / 혼합 2줄 "B220+B324" + "아웃박스")
- [x] `CompanyResult.tsx` 무게 표시 분리 (적재/파렛트/총) — 값 계산 무수정
- [x] `lib/company/fabric.ts` 신규 (normalizeFabric, distinctFabricsByQty)
- [x] `scripts/test-step3-4.ts` 신규 검증 (17/17) + 회귀(19·5·80) 무영향
- [x] `npx tsc --noEmit` 통과 · JSX 가드 OK · `npm run build` 성공(폰트 스텁 로컬·원복)

### Step 3-5 — 통합 검증 & 빌드 ✅ — 검증 `docs/PHASE5-STEP3-VERIFY-LOG.md` (§ Step 3-5)
- [x] `scripts/test-step3-5.ts` 신규 — 원단혼합+슬롯초과+오버행 통합 4시나리오(S1~S4) 13/13 통과
- [x] `npx tsc --noEmit` 에러 0 · JSX 한글 가드 OK
- [x] `npm run build` 통과 9/9 (폰트 스텁 로컬·원복)
- [x] 회귀 무영향: test-step3-2 5/5 · test-step3-3 80/80 · test-step3-4 17/17 · test-step4 19/19
- [x] `lvhh.vercel.app/company/box-pallet` 브라우저 5개 항목 육안 확인 (Chrome 실브라우저)
      ① 5열 그리드 ② 슬롯/빈칸/적재초과 경고 ③ 규격·오버행(945×710, 가로45) ④ 원단 라벨 1종/혼합 ⑤ 무게 3줄
- [x] `docs/PHASE5-STEP3-VERIFY-LOG.md`에 Step 3-5 섹션 추가
- [x] PROGRESS.md / MASTER.md 완료 처리

---

## 🔶 Phase 6 — DB 연동 (회사 시뮬레이션 완료 2026-07-11)

### Step 1 — 박스 시뮬레이션 DB 전환 ✅ (세션: 박스시뮬레이션)
- [x] DB 정정: 95인박스 높이 95 · 파렛트 700/900 높이 140 · 1100 폭 1100 (사용자 확정값)
- [x] 컬럼 추가: pallet_types(boxes_per_layer/layout_*) · outer_box_types(capacity_unit/per_layer_unit) · inner_box_types(outer_unit/courier_unit)
- [x] `roll_weights` 테이블 신설 + 초기 3행 (40/60/110 × 300M 실측 무게)
- [x] `app/api/company/master/route.ts` 신규 — 5테이블 조회 → MasterData 조립 (force-dynamic, 캐싱 없음)
- [x] `lib/company/data.ts` 하이드레이션 스토어 전환 (export 시그니처 유지, 엔진 5종 무수정)
- [x] `app/company/[id]/page.tsx` 마스터 로드 3-상태 (loading/ok/error+재시도)
- [x] `weightIncomplete` 플래그 제거 (60인박스 0.12·택배 0.44 실측 확정으로 존재 이유 소멸)
- [x] `master.json` → 테스트 픽스처 전용 (값은 DB와 일치화, scripts/fixture.ts가 주입)
- [x] `types/database.ts` 실컬럼 반영 + roll_box_capacities/roll_weights + GenericSchema 제약 충족
- [x] 검증: tsc 0에러 · 회귀 134/134 (19·5·80·17·13) · JSX 가드 OK · 빌드 성공(폰트 스텁 원복)

### Step 2 — 특수 원단 노출 + 원단 드롭다운 ✅ (세션: DB데이타추가, 2026-07-13)
- [x] **계약 변경**: 수용량이 원단마다 다르다(40×300 = 공통 30 / P-110 24). 스펙 키를
      (사이즈, 미터) → **(원단, 사이즈, 미터)** 로 확장. 원단은 표시용이 아니라 계산 입력
- [x] `ProductSpec.fabric` 추가 (null = 원단 무관 공통 규칙) · `MasterData.fabricsByDim` 추가
- [x] `findProduct(fabric, size, meter)` — 원단 전용 → 없으면 공통 폴백
- [x] API `IS NULL` 필터 제거 → 특수 원단 노출. 제품 **20치수 → 80치수**(원단×치수 109조합)
- [x] **공통 스펙 합성**: 공통 규칙이 없어도 그 치수 원단들이 수용량에 전원 합의하면 미상 계산 허용(50건)
- [x] **미상 거부**: 합의가 깨지는 10치수는 원단을 특정해야 계산 (`SimulateError.ambiguous`)
      — 추측해서 틀린 박스 수를 내놓지 않는다 (사용자 결정)
- [x] "없는 스펙"(unsupported)과 "원단 특정 필요"(ambiguous)를 다른 메시지로 분리
- [x] 입력폼 원단: 자유입력 → **드롭다운**(사이즈·미터 연동, 미선택 = 미지정)
- [x] DB: 특수 원단 89치수 `is_default`(기본 인박스) 지정 — 없으면 API가 전량 실패했다
- [x] DB: 200×300 완성형 보충 (주력 5종) — `roll_box_capacities`에 실재하는 표준 폭이었음
- [x] **무게 버그 수정**: 무게를 (사이즈,미터)로만 찾아 모든 원단에 같은 값을 물렸다.
      한 박스에 들어가는 롤 수가 다르면(120 vs 96) 풀박스 무게가 같을 수 없다 →
      (원단,사이즈,미터)로 조회, 없으면 null(미실측)
- [x] `types/database.ts` + ribbon_types/ribbon_specs Row 타입 (`as` 우회 없음)
- [x] 규칙 보류 처리: 리본/라벨 "절대 수정 금지" 목록은 **만드는 단계에선 족쇄** →
      삭제 않고 주석 보류, 완성 후 되살림. `DB-02-rls-plan.md`의 ribbon_types SELECT 차단도
      해제(그대로 켜면 Phase 7에서 시뮬레이션이 죽는다)
- [x] 검증: tsc 0에러 · JSX 가드 OK · 회귀 **165/165** (5·80·18·13·19·30 신규) ·
      실제 DB로 `/api/company/master` HTTP 200 + 80치수 확인

### Step 2.5 — 캐시 버그 수정 + 고객사 스펙 데이터 입력 ✅ (세션: DB데이타저장, 2026-07-14)
- [x] 🐞 **치명 버그 수정** (커밋 `2fa9eef`) — Next.js Data Cache가 supabase-js의 GET fetch를
      캐싱해 `/api/company/master`가 **하루 지난 행**을 내려주고 있었다.
      `lib/supabase/server.ts`에 `cache: 'no-store'` 강제.
      ⚠️ **HTTP 200은 신선도를 증명하지 않는다 — 응답 본문으로 검증할 것**
- [x] 고객사 스펙 3사 입력: 정인테크(7) · B112 해동(5) · 티옵시스(7)
      = customer_product_specs 18링크, 마이그레이션 11건
- [x] 스키마 확장(가산적): `customer_product_specs.outer_box_id` ·
      `.delivery_route_id` · `roll_box_capacities.raw_notes`
- [x] 신규 코아 코드 9F/60 · 4F/60 · 4F/65, 67C 정의 확정
- [x] 검증: tsc 0 · 회귀 165/165 · 실 API 200 + 신규 행 포함 확인

### 남은 것
- [ ] **서비스코아 계산 엔진** — 9F/65·F65 등 특수코아는 수용량을 바꾼다
      (GPX90 45×450 = 12 또는 14). 조회 키에 코아를 넣어야 하며, 그때까지 해당 행은
      API에서 제외(`core_spec_id IS NULL` 필터). 지금은 45×450이 노출되지 않는다
- [ ] 200×300 무게 실측값 (`roll_weights` 비어 있음 — 현재 무게 없이 노출)
- [ ] 주식 시뮬레이션 `/api/stocks` 하드코딩 → DB 교체 (별도)
- [ ] 예외 규칙 반영: 600M·B128 수용량, 택배 직접담기, WL919 CLEAR (DB 조사 후 엔진 확장)

---

## ✅ Phase 9 — 홈 개편 + 자료실 (2026-07-14, 세션: 홈페이지)

> 홈의 주요 전략 3카드가 전부 죽은 링크였다. 고치는 대신 **그 자리를 새 기능으로 바꾼다**
> (사용자 결정). 3번째 칸 = 자료실, 1·2번 칸 = 준비 중.

### 전제 — 보존 목록 해제 (사용자 승인)
- [x] MASTER.md 규칙 8의 보존 목록에서 `app/page.tsx` · `components/home/**` **해제**
      (주석 보류). 홈을 의도적으로 개편하는 단계라 잠가둘 수 없다.
      나머지(`app/stock/**` 등)는 그대로 잠근 상태 유지

### DB (가산적 — 기존 27테이블 무접촉)
- [x] `archive_files` 테이블 신설 (title/description/storage_path/file_name/
      size_bytes/mime_type/sort_order/created_at)
- [x] Storage 공개 버킷 `archive` 생성
- [x] `types/database.ts` 에 ArchiveFileRow 추가 (`as` 우회 없음)

### 코드
- [x] `types/archive.ts` — ArchiveFile 계약 (downloadUrl은 서버가 붙인다)
- [x] `app/api/archive/route.ts` (BE-05) — 목록 + Storage 공개 URL. force-dynamic
- [x] `app/archive/page.tsx` (FE-08) — 3-상태(loading/ok/error) + 빈 목록 상태
- [x] `lib/home/tools.ts` + `components/home/ToolTile.tsx` + `MoreTools.tsx` (FE-09)
      — 시각 규격은 기존 SimTile 과 동일. 새 디자인 토큰 없음
- [x] `app/page.tsx` — FeaturedStrategies → MoreTools 교체, 죽은 STOCK_SIMS 제거
- [x] `components/home/FeaturedStrategies.tsx` **삭제** (교체로 고아가 됨, 사용자 승인)

### 검증
- [x] typecheck 0에러 · JSX 한글 가드 OK · **회귀 165/165** · `npm run build` 성공
- [x] 실브라우저: 홈 MORE TOOLS 3칸(준비중 2 + 자료실 OPEN→) 육안 확인
- [x] 실브라우저: `/archive` 로딩 → 목록 1건 렌더 (제목·설명·파일명·17.2MB·날짜)
- [x] 공개 다운로드 URL 익명 요청 → **HTTP 200 · 17,989,840 bytes** (등록 용량과 일치)

### 남은 것
- [ ] 홈 1·2번 칸에 넣을 기능 2개 미정 (현재 '준비 중' 비활성 타일)
- [ ] 자료실 운영: 대시보드로 파일 업로드 → `archive_files` 행 추가.
      자료가 잦아지면 등록 절차 간소화를 재검토

---

## ✅ Phase 7 — 보안 (2026-07-17 완료, 세션: 페이즈7및기타)

> **28개 테이블 전부 RLS 활성화 · 정책 0개(전면 차단).** 앱은 무영향
> (`/api/company/master` 200 · 37,787바이트 · 227제품 — 변경 전과 동일).

- [x] **키 교체 먼저** — `.env.local`의 `SUPABASE_SERVICE_ROLE_KEY`를 **secret 키
      (`sb_secret_…`)** 로 교체. 교체 전엔 **anon 키와 글자 하나까지 같은 값**이었다
      (실측). Vercel도 같은 secret 키로 덮어쓰고 재배포.
      ⚠️ 이 프로젝트는 Supabase **신규 키 체계**다 — 옛 `service_role` JWT가 아니라
      **secret 키**가 맞는 짝이다 (`publishable` ↔ `secret`).
- [x] **순서를 바로잡았다.** 옛 체크리스트는 키 교체를 RLS *뒤에* 뒀는데 그러면
      로컬이 죽고, 무엇보다 **RLS를 켜기 전엔 새 키가 되는지 확인할 방법이 없다.**
      올바른 순서 = **키 → 확인 → RLS → 확인.**
- [x] **A그룹(20개, 앱이 안 읽음) 먼저** — `customers`·`products`·`label_specs`·
      `customer_product_specs`·`delivery_routes` 등 **영업 데이터 전부**가 여기다.
      아무 코드도 안 읽으므로 **무위험**이고 Vercel 키와도 무관.
- [x] **B그룹(8개, 앱이 읽음)** — `inner_box_types`·`outer_box_types`·`pallet_types`·
      `roll_box_capacities`·`roll_weights`·`ribbon_specs`·`ribbon_types`·`archive_files`.
- [x] **`/api/company/master` 정상 확인** — 227제품·무게19·원단19·인박스3·아웃박스2·
      파렛트5. `X-Vercel-Cache: MISS` + 캐시버스터 URL로 **신선도까지 확인**
      (HTTP 200은 신선도를 증명하지 않는다).

### ⚠️ 옛 계획의 "ribbon_types · ribbon_specs SELECT 열어두기"는 **폐기**

**공개 SELECT 정책은 하나도 만들지 않았다.** 그 계획은 **브라우저가 anon 키로 직접
읽는다**는 전제 위에 있었는데, 실측 결과 그런 코드는 없다:

- `.from()` 호출은 **전부 2개 라우트**뿐 — `/api/company/master`, `/api/archive`.
  둘 다 서버에서 `lib/supabase/server.ts`(secret 키)로 읽는다.
- `lib/supabase/client.ts`(anon 키)는 **아무도 import하지 않는다**.
- 파이썬/Railway 백엔드는 Supabase를 **아예 안 쓴다**.
- **secret 키는 RLS를 우회한다** → 전면 차단이 더 안전하고 더 단순하다.

**신규 테이블을 만들 때도 정책은 필요 없다.** `ENABLE ROW LEVEL SECURITY`만 켜면 된다.

### 실측 기록 (가정 아님)

| 항목 | 전 | 후 |
|------|-----|-----|
| RLS 켜진 테이블 | 0 / 28 | **28 / 28** |
| anon 키로 `customers`(185) 읽기 | **읽힘** | **0행 — 차단** |
| anon 키로 INSERT | — | **401 / 42501 차단** |
| 보안 어드바이저 | **ERROR 28** | **ERROR 0** (INFO 28 = 의도한 설계) |

되돌리기: `ALTER TABLE <t> DISABLE ROW LEVEL SECURITY;`

### 남은 것 (Phase 7 범위 밖)
- [ ] `archive` **스토리지 버킷은 여전히 공개** — 테이블 RLS와 별개. 대외비 자료를
      올리려면 비공개 버킷 + 인증이 먼저다.
- [ ] `lib/supabase/client.ts` 삭제 + Vercel의 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 제거
      (아무도 안 쓰는데, 누가 import하면 그 순간 anon 키가 브라우저로 나간다).
      **`NEXT_PUBLIC_SUPABASE_URL`은 서버가 쓰므로 유지.**

※ 옛 계획의 `/api/pallets`는 만들지 않았다 (BE-02 폐기, BE-04로 통합)

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
| 2026-06-23 | Phase 0 | 전체 아키텍처 설계 & 문서화 | Claude Sonnet 4.6 |
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
| 2026-07-01 | Phase 5-Step3 계획 | 대대적 개선 계획 수립 + 문서화 (PHASE5-STEP3-PLAN.md, PHASE5-STEP3-IMPL-PLAN.md) — 구현 대기 | Claude Opus 4.8 |
| 2026-07-01 | Phase 5-Step3-1 | 박스 그리드 5열 (grid minmax + BoxSvg 반응형) 커밋 3523124, 9e74caf — Chrome 실브라우저 검증 완료 | Claude Sonnet 4.6 |
| 2026-07-02 | Phase 5-Step3-2 | 규격·오버행 엔진 신설 (overhang.ts + master.json layout + PalletStack footprint/overhang), 배열표 확정(700=2×2/900=3×2회전/1100·플라스틱=3×3), 검증 5/5 + 회귀 19/19 | Claude Opus 4.8 |
| 2026-07-02 | Phase 5-Step3-3 | 파렛트 슬롯·빈칸·오버플로우 재설계 (pallet.ts 재작성 + PalletStack 슬롯 필드 + SlotKind + CompanyPalletSvg 슬롯 렌더 + overflow 경고), 검증 80/80 + 회귀 24 | Claude Opus 4.8 |
| 2026-07-03 | Phase 5-Step3-4 | 원단 타입 도입 + 무게 표시 분리 (fabric.ts 신규 + types/innerbox/outerbox/simulate + CompanyParams/BoxSvg/CompanyResult), 검증 17/17 + 회귀 19·5·80, 커밋 a26307a·34a44a6 | Claude Opus 4.8 |
| 2026-07-04 | Phase 5-Step3-5 | 통합 검증 (test-step3-5 신규 13/13 + 회귀 4종 무영향 + 실브라우저 5개 항목 육안) → Phase 5 Step 3 종결 | Claude Opus 4.8 |
| 2026-07-11 | Phase 6-Step1 | 박스 시뮬레이션 DB 전환 (roll_weights 신설 + master API + data.ts 하이드레이션 + weightIncomplete 제거), 회귀 134/134 | Claude Fable 5 |
| 2026-07-13 | Phase 6-Step2 | 특수 원단 노출 + 원단 드롭다운 (스펙 키 = 원단×사이즈×미터, 20→80치수, 미상 거부 ambiguous, 무게 조회 버그 수정), 회귀 165/165, 커밋 5392ba6 | Claude Opus 4.8 |
| 2026-07-14 | Phase 6-Step2.5 | Data Cache 낡은 응답 버그 수정(커밋 2fa9eef) + 고객사 3사 스펙 입력(정인테크·B112해동·티옵시스) + 스키마 가산 확장 | Claude Opus 4.8 |
| 2026-07-14 | Phase 3 검증 | 홈 화면 실브라우저 확인 완료 — FE-02 7요소 정상 / 콘솔 0에러 / **주요전략 3카드 죽은 링크 발견(미수정)** | Claude Opus 4.8 |
| 2026-07-14 | 문서 정합 | MASTER.md·PROGRESS.md를 실제 상태로 동기화 (현재 단계 Phase 6, BE-02·03 폐기→BE-04, DB 행수·RLS 27개 실측 반영), 모듈문서 11개 상태 헤더 정정 + DB-01 재작성 + BE-04 신설 | Claude Opus 4.8 |
| 2026-07-14 | Phase 9 | 홈 개편 + 자료실 (archive_files + 공개버킷 + BE-05 + FE-08 + MORE TOOLS 3칸). 죽은 링크 3개 소멸. 회귀 165/165 · 실브라우저 + 실다운로드 검증 | Claude Opus 4.8 |
