# PROFILE.md — MERIDIAN · v1.1 · 2026-07-05
이 파일은 lawbook 법전의 {{PROFILE.*}} 슬롯 값을 정의한다. 위치: 저장소 루트 고정.

## 스택
- 프론트엔드: Next.js 14 App Router + TypeScript strict mode
- 백엔드: Python FastAPI (Railway 배포)
- DB: Supabase (PostgreSQL)
- 배포: Vercel (main push 시 자동 배포)

## 보존목록
- components/svg/
- components/stock/
- lib/stock/
- python/** 일체

## 타입체크명령
tsc --noEmit (통과 기준: 0 에러)

## 코드스타일
- TypeScript strict — any/unknown 타입 금지
- 기존 파일 수정 시 해당 파일의 기존 컨벤션 준수
- JSX 한글 이스케이프 가드: scripts/check-jsx-escapes.mjs 통과

## 테스트명령
- 실행: npx ts-node -r tsconfig-paths/register --compiler-options '{"module":"commonjs"}' scripts/test-*.ts
- 테스트 파일 위치: scripts/ 폴더 고정, 파일명 test-*.ts 패턴
- 회귀 기준: 기존 테스트(test-step3-2 ~ test-step4) 전 통과 유지

## 보존테이블
- 현재 등재된 테이블: 없음
- 등재 절차: 시뮬레이션의 스키마가 확정되고 사용자가 등재를 승인한 테이블만
  이 명단에 추가한다. 등재된 테이블은 24-DB NEVER 1(DDL·DML 불문 변경 금지)이 적용된다.
- 미등재 테이블: 24-DB 일반 절차(계획 문서 → 승인 → 실행)를 따른다.
- 기존 테이블 재설계 시: 파괴적 변경 전 반드시 전체 데이터 백업을 확보한다.

## 디자인토큰
- 배경: #14110E
- 골드 액센트: #C9A86A
- 폰트 3종: Cormorant Garamond / Manrope / JetBrains Mono
- 스타일 방식: 인라인 스타일 전용 (CSS 클래스 금지)

## 환경변수목록
- PYTHON_SERVER_URL — 서버 전용 (Railway Python 서버 주소)
- NEXT_PUBLIC_SUPABASE_URL — 클라이언트 노출 가능
- NEXT_PUBLIC_SUPABASE_ANON_KEY — 클라이언트 노출 가능
- SUPABASE_SERVICE_ROLE_KEY — 서버 전용, 클라이언트 노출 절대 금지

## 배포방식
Vercel — main push 시 자동 배포 (push = 실서비스 배포)

## 보안과제
- Supabase RLS 비활성 — 공개 런칭 전 해결
