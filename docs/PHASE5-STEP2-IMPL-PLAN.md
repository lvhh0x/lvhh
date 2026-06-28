# MERIDIAN — Phase 5 Step 2 구현 계획서 (실행본)
## 박스 조합 로직 재작성 + 마스터 데이터 JSON 분리

> **문서 버전:** v1.1 (완료)
> **작성일:** 2026-06-28
> **선행 문서:** `docs/PHASE5-STEP2-HANDOFF.md` (맥락/규칙 원본)
> **상태 표기:** ⬜ 대기 / 🟦 진행중 / ✅ 완료

---

## 0. 이 문서의 범위

이번 실행 범위는 **박스 조합 알고리즘(엔진â) 재작성 + 마스터 데이터 JSON 분리 + 검증**까지다.
UI 반영(BoxSvg/CompanyResult 표기), 파레트 빈자리 채우기는 **다음 실행 범위**로 분리한다.
(이유: 단계별로 검증 가능한 단위를 유지 — 사용자 지침 §8.1·§4)

---

## 1. 사용자와 확정된 결정 사항

| # | 항목 | 결정 |
|---|------|------|
| 1 | 2단계 그리디: 빈자리에 떡 맞는 사이즈가 여러 개일 때 | **잔여가 더 많은 사이즈 우선** |
| 2 | 한 아웃박스에 3개 이상 사이즈 혼합 | **허용** (여러 사이즈 조합해 60단위 정확히 채움) |
| 3 | JSON 분리 범위 | **제품·인박스·아웃박스·파레트·단위표 전부** (single source of truth) |
| 4 | 택배박스 `145×1+95×3` 조합 | 사용자 오타 → 정정 (`145×1+95×2`). 택배 cap=12 유지 |

---

## 2. 합의된 알고리즘 (요약 — 원본은 HANDOFF §4)

### 2.1 인박스 분해 (엔진â로 — 변경 없음)
큰 인박스부터 꽉 채우고, 남는 수량은 그게 들어가는 가장 작은 인박스 1개.

### 2.2 단위표 (single source of truth → master.json)
- 아웃박스 완용량 **60단위**: 145=15, 95=10, 60=6
- 택배박스 완용량 **12단위**: 145=5, 95=3, 60=2

### 2.3 박스 조합 (엔진â — 재작성)
1. **1단계** 제품별로 60단위 풌 아웃박스 추출 → 사이즈별 잔여(<60) 수집
2. **2단계-a** 누적 잔여를 사이즈별로 합쳐 풌 한 번 더 추출(같은 사이즈 여러 행 대비) → 사이즈별 잔여 <60 보장
3. **2단계-b 합침 그리디**: 잔여 많은 사이즈를 seed로, 빈 단위(60−seed)를 *다른 사이즈 덩어리를 통째로* 조합해 **정확히 채울 수 있으면 합쳐 풌 아웃박스**, 아니면 seed 단독 처리
   - 덩어리는 절대 쿠개지 않음 / 3사이즈+ 혼합 허용 / 동률 시 잔여 많은(같으면 사이즈 큰) 우선
4. **단독 처리(finalize)**: 택배 단위 합 ≤12 → (인박스 2개+ → 택배 / 1개 → 낙개), 초과 → 부분 아웃박스

---

## 3. 작업 항목 체크리스트

### 3-1. 로컈 검증 환경 ✅
- [x] repo clone, `npm install`, `ts-node`/`tsconfig-paths` 설치

### 3-2. 마스터 데이터 JSON 분리 ✅
- [x] `lib/company/master.json` 생성 (`_rules` 설명 + products/innerBoxes/outerBoxes/pallets/innerUnits)
- [x] `lib/company/data.ts` 재작성: JSON import → 타입 입혀 재노출 (export 이름/시그니처 유지)
- [x] `any`/`unknown` 미사용, `npx tsc --noEmit` 에러 0

### 3-3. 엔진â `outerbox.ts` 재작성 ✅
- [x] §2.3 새 규칙 구현 (subset-sum 정확 합침 + finalize)
- [x] OUTER_CAP/COURIER_CAP를 data(`capacityUnit`)에서 읽어 중앙화
- [x] `packIntoBoxes(perProduct)` / `countOuterBoxes` 시그니처 유지

### 3-4. `simulate.ts` 점검 ✅ (무변경)
- [x] 인터페이스 유지 확인 (변경 최소 / 가급적 무변경)

### 3-5. 검증 스크립트 보강 ✅ (18/18 통과)
- [x] 기존 14케이스 새 규칙 기준 기대값 재확인
- [x] HANDOFF §4.4 예시 A/B/C + 3사이즈 혼합 케이스 추가
- [x] `npx tsc --noEmit` 엔러 0 + 검증 스크립트 전부 통과

### 3-6. 검증 로그 문서화 ✅
- [x] `docs/PHASE5-STEP2-VERIFY-LOG.md` 생성 (tsc 결과 + 케이스별 통과 로그) → 다운로드 제공

### 3-7. 푸시 ✅
- [x] `github:push_files`로 배치 푸시 (master.json/data.ts/outerbox.ts/test/plan/verify-log)
- [x] 푸시 후 한글 깨짘 여부 재확인

---

## 4. 이번 세션 추가 완료 (원 계획 §5 "다음 실행 범위"에서 연속 진행)

### 4-1. 상태 정합성 재검증 ✅
- [x] 로컈 클론 → `npx tsc --noEmit` 엔러 0 재확인
- [x] 검증 스크립트 18/18 통과 재현

### 4-2. BoxSvg.tsx UI 반영 ✅
- [x] `contents` 타입 `InnerBoxCount[]` → `SizedInnerCount[]`
- [x] 내용물 한 줄씩 표기: `{size}×{meter}m {kind}×{count}({productQty}개)` 포맷
- [x] 글씨 확대 (labelFontSize = w×0.095, contentFontSize = w×0.08)
- [x] SVG 높이 동적 확장 (contents.length 기반)
- [x] `npx tsc --noEmit` 엔러 0

### 4-3. CompanyPalletSvg.tsx 파레트 빈자리 반영 ✅
- [x] 마지막 층 빈자리(empty slot)를 점선 outline으로 시각화 (`strokeDasharray="3 2"`)
- [x] `totalPallets > 1`일 때 상단 "만재 N개 + 이 파레트 = 전 N개" 안내 텍스트 추가
- [x] `npx tsc --noEmit` 엔러 0

### 4-4. 최종 빌드 검증 ✅
- [x] `npm run build` 통과 (폰트 스턹 로컈)

### 4-5. 문서 갱신 ✅
- [x] `docs/PHASE5-STEP2-IMPL-PLAN.md` 3-7 ✅ 완료 처리 + §4 추가
- [x] `docs/PROGRESS.md` / `docs/MASTER.md` 갱신

---

## 5. 보존/주의

- 백엔드(순수 TS 함수)만 수정. UI/주식/Python/Supabase/`_backup` 미접근.
- `simulate.ts`·`innerbox.ts`·`weight.ts`·`pallet.ts` 로직 변경 없음 (data.ts export 시그니쳐 유지로 무영향).
- 푸시 전 반드시 로컈 `tsc` 엔러 0 + 검증 통과 확인.

---

## 6. 다음 실행 범위 (Phase 6)
- Supabase DB 연동 (`pallet_types`, `outer_box_types`, `inner_box_types` → master.json 대체)
- `/api/pallets`, `/api/products` API Route
- `npm run build` 최종 + PROGRESS/MASTER 갱신
