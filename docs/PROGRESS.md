# MERIDIAN — 진행 상황 체크리스트
> 각 항목 완료 시 `- [ ]` → `- [x]` 로 변경 후 커밋.
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

## 🔲 Phase 1 — Next.js 프로젝트 초기화
- [ ] `npx create-next-app@latest` 실행 (TypeScript, App Router)
- [ ] `@supabase/supabase-js`, `@supabase/ssr` 설치
- [ ] `.env.local` 생성 및 Supabase 키 설정
- [ ] `.env.example` 생성 (값 없이 키 이름만)
- [ ] 폴더 구조 생성 (components, lib, types, docs)
- [ ] `types/stock.ts`, `types/company.ts`, `types/database.ts` 기본 타입
- [ ] Vercel 배포 연결 확인

---

## 🔲 Phase 2 — 공통 레이아웃 + 라우팅
- [ ] `app/layout.tsx` — 폰트, 글로벌 스타일 (→ FE-01)
- [ ] `lib/supabase/client.ts` (→ LIB-02)
- [ ] `lib/supabase/server.ts` (→ LIB-02)
- [ ] `components/layout/Ticker.tsx` (→ FE-01)
- [ ] `components/layout/InnerHeader.tsx` (→ FE-01)
- [ ] 라우팅 폴더 구조 생성
- [ ] `npx tsc --noEmit` 확인

---

## 🔲 Phase 3 — 홈 페이지
- [ ] `lib/svg/generators.ts` (→ FE-07)
- [ ] `components/svg/LineSvg.tsx` (→ FE-07)
- [ ] `components/svg/CandleSvg.tsx` (→ FE-07)
- [ ] `components/svg/PalletSvg.tsx` (→ FE-07)
- [ ] `components/svg/IconSvg.tsx` (→ FE-07)
- [ ] `components/home/HeroSection.tsx` (→ FE-02)
- [ ] `components/home/EntryTiles.tsx` (→ FE-02)
- [ ] `components/home/FeaturedStrategies.tsx` (→ FE-02)
- [ ] `components/home/StatsBand.tsx` (→ FE-02)
- [ ] `components/home/QuoteFooter.tsx` (→ FE-02)
- [ ] `app/page.tsx` — 홈 통합 (→ FE-02)
- [ ] 홈 화면 브라우저 확인

---

## 🔲 Phase 4 — 주식 시뮬레이션
- [ ] `lib/simulation/stock.ts` (→ LIB-01)
- [ ] `app/api/stocks/route.ts` (→ BE-01)
- [ ] `components/stock/StockCard.tsx` (→ FE-03)
- [ ] `app/stock/page.tsx` (→ FE-03)
- [ ] `components/stock/StockParams.tsx` (→ FE-04)
- [ ] `components/stock/StockResult.tsx` (→ FE-04)
- [ ] `app/stock/[id]/page.tsx` (→ FE-04)
- [ ] 주식 시뮬레이션 전체 흐름 확인

---

## 🔲 Phase 5 — 회사 시뮬레이션
- [ ] `lib/simulation/company.ts` (→ LIB-01)
- [ ] `app/api/pallets/route.ts` (→ BE-02)
- [ ] `app/api/products/route.ts` (→ BE-03)
- [ ] `components/company/CompanyCard.tsx` (→ FE-05)
- [ ] `app/company/page.tsx` (→ FE-05)
- [ ] `components/company/CompanyParams.tsx` (→ FE-06)
- [ ] `components/company/CompanyResult.tsx` (→ FE-06)
- [ ] `app/company/[id]/page.tsx` (→ FE-06)
- [ ] 회사 시뮬레이션 전체 흐름 확인

---

## 🔲 Phase 6 — DB 연동
- [ ] `pallet_types` 실제 데이터 확인
- [ ] `/api/pallets` → Supabase 연결 검증
- [ ] per_layer 컬럼 추가 여부 사용자 결정
- [ ] 하드코딩 → DB 데이터 교체

---

## 🔲 Phase 7 — 보안
- [ ] RLS 정책 사용자 확인
- [ ] 리본/라벨 테이블 RLS 활성화 + 차단
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
| 2026-06-23 | Phase 0 | 전체 아키텍처 설계 & 문서화 | Claude Sonnet 4.6 |