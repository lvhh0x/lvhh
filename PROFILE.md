# PROFILE.md — MERIDIAN
v2.0 · 2026-07-11 · Module doc (MODULE-TEMPLATE 포맷). 사실과 스위치를 공급; 원칙은 CODING.md.

## Purpose
MERIDIAN Private Simulation Desk — 주식 백테스트 시뮬레이션과
회사 물류 시뮬레이션(TTR 라벨 제조 / 박스-팔레트 적재)을 제공하는 웹 앱.

## Applied Guides
UI.md · DB.md
(화면·컴포넌트 작업 시 UI.md, DB/config 작업 시 DB.md 로드)

## Facts

### 스택
- 프론트: Next.js 14 App Router + TypeScript strict
- 백엔드: Python FastAPI (Railway 배포)
- DB: Supabase (PostgreSQL)
- 배포: Vercel — main push 시 자동 배포 (push = 실서비스 배포)

### 명령
- 타입체크: `tsc --noEmit` (통과 기준: 0 에러)
- 테스트: `npx ts-node -r tsconfig-paths/register --compiler-options '{"module":"commonjs"}' scripts/test-*.ts`
  (테스트 파일: `scripts/` 고정, `test-*.ts` 패턴)
- JSX 한글 이스케이프 가드: `scripts/check-jsx-escapes.mjs` 통과

### 단일 데이터 출처 (도메인 상수)
- 회사 시뮬: `lib/company/master.json`
- 주식 시뮬: Python 서버(`python/**`) + Supabase 조회

### 보존경로 (CODING NEVER 4)
- `components/svg/`
- `components/stock/`
- `lib/stock/`
- `python/**` 일체

### 보존테이블 (DB NEVER 1)
- 현재 등재: 없음
- 등재 절차: 스키마 확정 + 사용자 승인 테이블만 명단 추가. 등재 시 DDL·DML 불문 변경 금지.
- 미등재: DB.md 일반 절차(계획→승인→실행). 기존 테이블 재설계 시 파괴적 변경 전 전체 백업 필수.

### 디자인토큰 (UI 작업 시)
- 배경 `#14110E` · 골드 액센트 `#C9A86A`
- 폰트 3종: Cormorant Garamond / Manrope / JetBrains Mono
- 스타일: 인라인 스타일 전용 (CSS 클래스 금지)

### 환경변수 (config 작업 시)
- `PYTHON_SERVER_URL` — 서버 전용 (Railway Python 서버 주소)
- `NEXT_PUBLIC_SUPABASE_URL` — 클라이언트 노출 가능
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 클라이언트 노출 가능
- `SUPABASE_SERVICE_ROLE_KEY` — 서버 전용, 클라이언트 노출 절대 금지

### 보안과제 (미해결)
- Supabase RLS 비활성 — 공개 런칭 전 해결.

## Done Criteria
- `tsc --noEmit` 0 에러
- 회귀: 기존 테스트(`test-step3-2` ~ `test-step4`) 전 통과 유지
- JSX 한글 이스케이프 가드 통과

## Rules
- 여기의 사실은 CODING.md·도메인 가이드와 모순되어선 안 된다. 모순 시 중단·보고(우선순위 적용).
- 작업에 필요한 사실이 여기 없으면 추측 금지, 사용자에게 질의. 승인 후 이 문서에 추가.
- 짧게 유지. 문서가 아니라 참조 카드다.
