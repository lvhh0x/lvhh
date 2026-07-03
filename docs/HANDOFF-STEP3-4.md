# MERIDIAN — Phase 5 Step 3-4 인계 문서 (새 창 이어가기용)

> **작성일:** 2026-07-03
> **기준 커밋:** `5ddfdad` (main, Vercel 자동 배포됨)
> **다음 작업:** Phase 5 **Step 3-4 — 원단(fabric) 타입 도입** (요구 5)
> **이 문서의 목적:** 새 대화 창에서 추가 설명 없이 Step 3-4를 바로 이어갈 수 있도록,
> 지금까지의 결정사항 · 완료 내역 · 남은 작업 · 작업 방식 · 이어가는 절차를 한곳에 고정한다.

---

## 0. 프로젝트 한눈에

- **무엇:** MERIDIAN Private Simulation Desk — 주식 백테스트 + 회사 물류(박스·파렛트 적재) 시뮬레이션 웹앱.
- **도메인:** 열전사 리본(TTR) 라벨 제조·물류.
- **스택:** Next.js 14 (App Router) + Python FastAPI(Railway) + Supabase. TypeScript strict.
- **데이터 단일 출처:** `lib/company/master.json` (회사 시뮬 값은 여기서만 수정).
- **작업 언어:** 한국어. 개발자는 단독(솔길).

### 인프라 레퍼런스
| 항목 | 값 |
|---|---|
| GitHub | `lvhh0x/lvhh` (public, main) — https://github.com/lvhh0x/lvhh |
| 배포 | `lvhh.vercel.app` — main push 시 자동 배포. 회사 시뮬 페이지 `/company/box-pallet` |
| Python 서버 | https://meridian-production-e345.up.railway.app (`/health`, `/api/stocks`, `/api/stocks/{id}/range`, `/api/backtest`) |
| Supabase | 프로젝트 ID `lnnxjwfvzaelsoupozke` (도쿄, PostgreSQL 17) |

---

## 1. 작업 원칙 (반드시 준수)

1. **코딩은 명령 이후에만.** "코딩 진행 / 실행 / 수정 / 추가" 등 명시적 명령 전에는 코드 수정 금지. 그 전엔 계획·상태·질문만.
2. **엔진(백엔드) 먼저 → UI(프론트) 나중**, 모듈 분리(워크트리) 원칙.
3. **`any` / `unknown` 타입 금지.** `npx tsc --noEmit`는 항상 0 에러 유지.
4. **외과적 수정.** 요청과 무관한 코드/주석/포맷 손대지 않기. 변경된 모든 줄이 요청으로 추적돼야 함.
5. **검증은 테스트 환경 구축 → 마크다운 로그로 기록** 후 다운로드 제공.
6. **보존 목록(수정 금지):** `components/svg/`, `components/stock/`, `lib/stock/`, `python/**`, 그리고 Step 3-2/3-3에서 완성된 `lib/company/overhang.ts` · `lib/company/pallet.ts` · `master.json` · `data.ts`.
7. **규격·무게 고정:** `master.json` · `weight.ts` 변경 없음(원단은 계산에 영향 없음).
8. **질문할 땐** 먼저 무엇을 묻는지 상세히 설명한 뒤 선택지를 제시.

### 환경 관련 주의
- **빌드:** `npm run build`는 샌드박스에서 Google Fonts 차단으로 실패 → **폰트 스텁을 로컬 임시 적용 후 원복**. 스텁은 **절대 push 금지**(git diff에 안 잡히게 원복 확인).
- **테스트 실행:** ts-node/tsconfig-paths는 devDep 아님 → npx로 실행, baseUrl은 env로 주입해 프로젝트 tsconfig 무수정:
  ```
  TS_NODE_BASEURL=. npx ts-node -r tsconfig-paths/register \
    --compiler-options '{"module":"commonjs","baseUrl":"."}' scripts/<파일>.ts
  ```
- **JSX 한글 가드:** `node scripts/check-jsx-escapes.mjs` — company `*.tsx`의 JSX 텍스트 노드에 `\u` 이스케이프가 있으면 실패. `CompanyResult.tsx`는 JSX 텍스트에 **실제 한글**, `CompanyPalletSvg.tsx`는 텍스트를 **백틱 템플릿**으로 유지(각 파일 기존 컨벤션 준수).
- **GitHub push:** 로컬 `git push`는 토큰 없어 불가 → **GitHub MCP `push_files`(다중 파일 원자 커밋)** 사용. 한글 콘텐츠 정상 반영됨. push 전 `git ls-remote origin refs/heads/main`으로 원격 HEAD 미변경 확인.

---

## 2. 지금까지 완료된 구현 (Phase 5)

### Step 1 — 회사 시뮬 파이프라인 (완료)
인박스 분해 → 아웃박스 FFD 조합 → 파렛트 적재 → 무게 → 오케스트레이터 → SVG → 2패널 실행 화면.
핵심 알고리즘: 3단계 그리디 패킹(사이즈별 풀 아웃박스 → 60단위 정확 합침 → 잔여 택배/낱개).
단위 계수: 아웃박스=60단위(145=15u,95=10u,60=6u), 택배박스=12단위(145=5u,95=3u,60=2u).

### Step 2 — 박스 조합 개선 (완료)
`SizedInnerCount`(사이즈·미터 정보 박스까지 보존) 도입, `master.json` 데이터 분리, `outerbox.ts` 재작성("같은 사이즈 먼저, 딱 떨어질 때만 합침"). 18/18 검증.

### Step 3-1 — 박스 그리드 5열 (완료, 커밋 `3523124`,`9e74caf`)
`CompanyResult.tsx` flex-wrap → CSS grid `repeat(5, minmax(0,1fr))`, `BoxSvg.tsx` SVG 반응형(`width:100%`)으로 테두리 오버플로우 버그 해결. Chrome 실검증 완료.

### Step 3-2 — 규격·오버행 엔진 (완료)
`lib/company/overhang.ts` 신규(`calcFootprint`), `master.json` 각 pallet에 `layout {cols,rows,rotated}`. 파렛트 배열표: **700=2×2 무회전 / 900=3×2 90°회전 / 1100·플라스틱A·B=3×3 무회전**. 오버행은 **아웃박스만** 기준. 900만 가로 45mm 오버행. 검증 5/5 + 회귀 19/19.

### Step 3-3 — 파렛트 슬롯·빈칸·오버플로우 재설계 (완료, 커밋 `a40b8a2`,`5ddfdad`)
- `pallet.ts` 재작성: **파렛트 항상 1개** 전제.
- **슬롯 환산:** 필요슬롯 = `아웃박스수 + 택배수 + ceil(낱개수/2)`
- **최대슬롯 = `boxesPerLayer × 5`** (700=20, 900=30, 1100/플라스틱=45)
- **판정:** `필요슬롯 > 최대슬롯` → `overflow`(적재 초과, 선택 불가). **경계값은 OK**(`>` 사용).
- **층수 = `ceil(필요슬롯/boxesPerLayer)`**, **총높이 = `파렛트높이 + 315 × 층수`**.
- **빈칸 배치 순서: 아웃박스 → 택배(1칸씩) → 낱개(2개=1칸).**
- overflow 신호는 **`PalletStack.overflow` 단일 필드**(사용자 확정 A). simulate 최상위 별도 플래그 없음.
- `types/company.ts`: `PalletStack` 개편(`totalPallets`/`lastLayerBoxes` 제거, `neededSlots/maxSlots/overflow/slotOuter/slotCourier/slotLoose/lastLayerSlots` 추가), `SlotKind = 'outer'|'courier'|'loose'|'empty'` 추가.
- `pallet.ts`: `OuterBoxCounts` 인터페이스, `calcPallet(counts, pallet, stackWeight)`, 순수함수 `slotKindAt(index, s)`(엔진이 빈칸 규칙의 진실의 원천, SVG는 그림만).
- `CompanyPalletSvg.tsx`: topper 제거 → 슬롯 위치에 택배/낱개 렌더(아웃=금색#C9A86A, 택배=초록#8FBFA0, 낱개=회색#9C9486, 빈칸=점선). Props는 `{stack, width}`만.
- `CompanyResult.tsx`: `pallet.overflow` 시 "적재 초과 — 이 파렛트는 선택할 수 없습니다" + "필요 N슬롯/최대 M슬롯" 경고.
- **검증:** test-step3-3 **80/80**, 회귀 test-step4 19/19 · test-step3-2 5/5, tsc 0, build OK. 원격 클론 재검증까지 전부 통과.

> **미완(3-3):** 브라우저 육안 확인(SVG 빈칸 슬롯 렌더·overflow 경고)은 Step 3-5 통합검증에서 함께 수행 예정.

---

## 3. 확정된 설계 결정 (요약 테이블)

| 주제 | 결정 |
|---|---|
| 파렛트 개수 | 항상 1개 |
| 슬롯 환산 | 아웃1칸 / 택배1칸 / 낱개 2개=1칸 |
| 최대슬롯 | boxesPerLayer × 5 |
| 오버플로우 | 필요 > 최대 (경계값 OK) |
| 층수/높이 | ceil(필요/bpl) / 파렛트높이 + 315×층수 |
| 빈칸 우선순위 | 아웃 → 택배 → 낱개 |
| 대안 파렛트 추천(R2) | **철회**(경고만, 선택은 사용자 몫) |
| overflow 신호 | `PalletStack.overflow` 단일 필드 |
| 파렛트 배열표 | 700=2×2 / 900=3×2회전 / 1100·플라스틱=3×3 |
| 오버행 범위 | 아웃박스만 |
| 원단 단일 라벨 형식 | **"B220 아웃박스"** (원단명 접두) — 확정 2026-07-01 |

---

## 4. 다음 작업: Step 3-4 — 원단(fabric) 타입 도입 (요구 5)

### 목표
입력에 **원단 타입**(자유입력 텍스트)을 추가하고, **같은 원단 우선 그룹핑**으로 박스를 조합.
**개수·무게 계산에는 영향 없음**(원단은 passthrough + 그룹핑 키로만 사용).

### 만질 파일 (외과적)
| # | 파일 | 계층 | 변경 |
|---|------|------|------|
| A | `types/company.ts` | 타입 | `ProductInput`·`SizedInnerCount`에 `fabric: string` 추가. `outerbox.ts` 내부 타입에도 fabric 부착 |
| B | `components/company/CompanyParams.tsx` | 프론트 | 입력 순서 **원단 → 사이즈 → 미터 → 수량**. 원단은 `<input type="text">` 자유입력(placeholder 예: `B220`). `RowState`·`handleRun` 반영 |
| C | `lib/company/innerbox.ts` | 엔진 | `decomposeToInnerBoxes`가 `fabric`도 `SizedInnerCount`에 실어 전달(passthrough) |
| D | `lib/company/outerbox.ts` | **엔진(핵심)** | 그룹핑 키 `(size,meter)` → **원단 우선**: ① 같은 fabric 안에서 풀 아웃박스 → ② 같은 fabric 잔여로 60 안 되면 다른 fabric과 exact-fill 섞기 허용 → ③ 잔여 FFD. **개수 규칙(60/12) 절대 불변** |
| E | `components/company/BoxSvg.tsx` · `CompanyResult.tsx` | 프론트 | 박스 라벨 앞에 원단 표기("B220 아웃박스"). 혼합 원단 박스 표기는 아래 미확정 참조 |

- `master.json`은 원단 규칙이 계산에 없으므로 **변경 불필요**(Phase 6 DB화 시 원단 테이블 신설 고려).

### 성공 기준 (verify — 테스트로 단정)
- 입력폼에 원단/사이즈/미터/수량 순으로 입력됨.
- `B220 110×300 30개` + `B325 110×300 30개` → 아웃박스 2개(안 섞임).
- `B220 40×300 60개` + `B324 60×300 20개` → 45단위 → 부분 아웃박스 1개(섞임 허용 확인).
- `B220 60×300 40개` + `B325 110×300 20개` + `B324 40×300 60개` → 아웃박스 1개 + 택배박스 1개.
- 같은 원단으로 60 채워지면 안 섞음 / 안 채워지면 섞어서 60.
- 원단 타입이 무게·개수에 영향 없음(수치 동일 — 기존 test-step4 케이스 회귀 통과).
- `npx tsc --noEmit` 통과.

### ⚠️ 착수 전 사용자에게 확정받을 미결정 2건
1. **원단 미입력 허용 여부:** 필수로 막을지 vs "미지정"으로 허용할지.
2. **혼합 원단 박스 라벨 표기:** 서로 다른 원단이 한 박스에 섞였을 때 라벨을 어떻게 표기할지(대표 원단? 병기? "혼합"?).
   - (단일 원단 박스 형식은 "B220 아웃박스"로 이미 확정.)

> 이 2건을 정한 뒤 "코딩 진행" 명령을 받으면 A→B→C→D→E 순으로 착수한다.

---

## 5. Step 3-5 — 통합 검증 & 빌드 (Step 3-4 이후)

- `scripts/` 회귀에 신규 케이스 추가(원단 그룹핑 / 슬롯 초과 / 오버행).
- `npx tsc --noEmit` 0 에러, `npm run build` 성공(폰트 스텁 로컬).
- **브라우저 육안 확인**(3-3에서 이월분 포함): `lvhh.vercel.app/company/box-pallet`에서 5개 요구 전부 확인 — ①박스 5열 ②슬롯/빈칸/오버플로우 ③규격 ④오버행 ⑤원단 표기.
- `docs/PHASE5-STEP3-VERIFY-LOG.md` 마무리, `PROGRESS.md`/`MASTER.md` 완료 처리.

---

## 6. 미상값 / 열린 이슈

- **60인박스 tare / 택배박스 tare = 0 placeholder** — 사용자 제공 시 `master.json` 교체. 현재 무게는 이 둘 미반영분 과소 표시(결과 화면에 안내 문구 있음).
- **`lib/company/_backup/`** 폴더는 옛 필드 참조하나 tsconfig에서 exclude + 어디서도 import 안 됨 → 기존 백업, **건드리지 않음**.

---

## 7. 새 창에서 이어가는 절차 (그대로 따라 하기)

새 창에는 이전 작업 디렉토리가 유지되지 않는다. 아래처럼 시작한다.

**1) 이 문서 확인.** 레포의 `docs/HANDOFF-STEP3-4.md`(이 파일)와 함께 참고 문서를 읽는다:
- `docs/PHASE5-STEP3-IMPL-PLAN.md` (Step 4 상세 설계)
- `docs/PHASE5-STEP3-STEP3-IMPL.md` (직전 Step 3-3 구현 상세)
- `docs/PHASE5-STEP3-VERIFY-LOG.md` (검증 이력)
- `docs/PROGRESS.md` (전체 진행 체크리스트)

**2) 레포 클론 + 상태 확인.**
```
git clone https://github.com/lvhh0x/lvhh.git
cd lvhh
git rev-parse HEAD          # 5ddfdad 이상인지 확인
npm install
npx tsc --noEmit            # 에러 0 확인 (베이스라인)
```

**3) 회귀 베이스라인 확인(선택).**
```
TS_NODE_BASEURL=. npx ts-node -r tsconfig-paths/register \
  --compiler-options '{"module":"commonjs","baseUrl":"."}' scripts/test-step3-3.ts   # 80/80
# test-step4.ts(19/19), test-step3-2.ts(5/5)도 동일 방식
node scripts/check-jsx-escapes.mjs
```

**4) Step 3-4 미결정 2건(위 §4)을 사용자와 확정.** 무엇을 묻는지 먼저 설명 후 선택지 제시.

**5) "코딩 진행" 명령을 받으면** §4 표 순서(A 타입 → B 입력폼 → C innerbox → D outerbox → E 표시)로 구현.
각 단계마다 `tsc --noEmit` 통과 확인, 프론트 후 JSX 가드 실행.

**6) 검증:** `scripts/test-step3-4.ts`(신규) 작성 + §4 성공기준 케이스 단정 + 회귀(test-step4/3-2/3-3) 통과. 결과를 `PHASE5-STEP3-VERIFY-LOG.md`에 기록.

**7) 빌드:** 폰트 스텁 임시 적용 → `npm run build` → **스텁 원복**(diff 확인).

**8) push:** `git ls-remote origin refs/heads/main`로 HEAD 미변경 확인 → GitHub MCP `push_files`로 코드/문서 커밋(실서비스 배포이므로 **사용자 승인 후**) → 원격 재클론으로 tsc/테스트 재검증.

**9) 문서:** `PROGRESS.md`/`IMPL-PLAN.md`/`STEP3-IMPL` 계열 체크박스 완료 처리.

---

## 8. 커밋 이력 (최근)

| 커밋 | 내용 |
|---|---|
| `3523124`,`9e74caf` | Step 3-1 박스 그리드 5열 |
| (Step 3-2) | 규격·오버행 엔진 |
| `a40b8a2` | Step 3-3 코드 6파일 |
| `5ddfdad` | Step 3-3 문서 4파일 (현재 HEAD) |

*이 문서는 2026-07-03 기준. 구현은 사용자 "코딩 진행" 명령 이후 착수.*
