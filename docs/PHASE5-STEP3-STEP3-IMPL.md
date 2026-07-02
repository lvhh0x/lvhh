# MERIDIAN — Phase 5 Step 3 / Step 3-3 (파렛트 슬롯·빈칸·오버플로우 재설계) 상세 구현계획

> 작성일: 2026-07-02 · 소속: **Phase 5 Step 3 → Step 3-3** (요구 2)
> 상위 문서: `PHASE5-STEP3-PLAN.md` / `PHASE5-STEP3-IMPL-PLAN.md`
> 인계 문서: `HANDOFF-STEP3-3.md` (설계·확정사항 원본)
> 검증 로그: `PHASE5-STEP3-VERIFY-LOG.md` (Step 3-3 섹션 추가 예정)
> **데이터 단일 출처: `lib/company/master.json` (값 수정은 여기서만)**

---

## 0. 이 문서의 역할

Step 3-3 착수 전, 실제 레포 코드를 검증한 결과와 사용자 확정 설계(핸드오프 §3)를 반영해
만질 파일·타입 스키마·엔진 로직·SVG 렌더·검증 케이스를 한 곳에 고정한다.
각 작업은 §8 체크박스로 진행 상황을 표시하며 구현한다.

> **이 문서는 계획서일 뿐이며, 코드 수정은 사용자 "코딩 진행" 명령 이후에 착수한다. (지침 1)**

---

## 1. ✅ 사용자 확정 사항 (핸드오프 §3, 2026-07-02)

### 1-1. 슬롯 환산·오버플로우 판정
- **필요슬롯 = `아웃박스수 + 택배수 + ceil(낱개수 / 2)`** (택배·낱개 **포함** 총 슬롯)
- **최대슬롯 = `boxesPerLayer × 5`** (기존 슬롯 공식 유지)
- 판정: **`필요슬롯 > 최대슬롯` → 적재 초과** (판정식은 `>`, 경계값은 적재 가능)

| 파렛트 | boxesPerLayer | 최대슬롯 | 적재 가능 | 초과 시작 |
|---|---|---|---|---|
| 700-wood | 4 | **20** | 20까지 OK | 21부터 초과 |
| 900-wood | 6 | **30** | 30까지 OK | 31부터 초과 |
| 1100-wood | 9 | **45** | 45까지 OK | 46부터 초과 |
| 1100-plastic-a | 9 | **45** | 45까지 OK | 46부터 초과 |
| 1100-plastic-b | 9 | **45** | 45까지 OK | 46부터 초과 |

### 1-2. 대안 파렛트 추천(R2) — **철회 확정 (넣지 않음)**
- 대안 파렛트 자동 추천 **없음.** 파렛트 선택은 전적으로 사용자 몫.
- 시스템은 선택된 파렛트가 **적재 초과인지 아닌지만 판단** → 초과 시 "적재 초과" 메시지만 표시.
- 모든 파렛트로도 안 들어가는 경우도 → **"적재 초과" 경고만** (개수 계산·대안 안내 없음).

### 1-3. 빈칸 배치 우선순위
- 배치 순서: **아웃박스 → 택배(1칸씩) → 낱개(2개=1칸).** (택배 먼저, 그다음 낱개)

### 1-4. 규격·무게·높이
- 아웃박스·택배박스·인박스·파렛트의 **규격과 무게는 전부 고정값** 그대로. 변경 금지.
- 아웃박스 높이 **315mm 고정** 유지.
- "높이 재계산" = 규격 변경이 아니라 **층수 기반 총높이 합산 로직**:
  - **층수 = `ceil(필요슬롯 / boxesPerLayer)`**
  - **총높이 = `파렛트높이 + 315 × 층수`**
  - (택배/낱개 층도 아웃박스 높이 315 기준으로 합산 — 확정된 단순화)

> §1-1 · §1-3의 두 "열어둔 질문"(IMPL-PLAN §Step3 열어둔질문)은 핸드오프 §3에서
> **모두 확정 완료** → 새 창에서 추가 질문 없이 구현 가능.

---

## 2. 실제 코드 검증 결과 (2026-07-02, 커밋 `cd5aaff`)

핸드오프 §4-2 절차대로 레포 클론 후 실제 코드를 확인했다. **핸드오프 서술과 실제 코드가 일치**하며,
아래는 구현에 직접 영향을 주는 확인 사실이다.

| 항목 | 확인 결과 |
|---|---|
| `lib/company/pallet.ts` `calcPallet(outerCount, pallet, stackWeight)` | **다중 파렛트** 계산(`totalPallets = ceil(N/(bpl×5))`). 택배/낱개 미반영. 높이 = `pallet.h + 315 × layers`. |
| `lib/company/simulate.ts` | `countOuterBoxes(boxes)`로 `{outerCount, courierCount, looseCount}` 이미 확보. `calcPallet(outerCount, …)` 호출 → Step 3-3에서 3-카운트 전달로 변경 필요. |
| `types/company.ts` `PalletStack` | `palletId, layers, lastLayerBoxes, boxesPerLayer, totalPallets, height, weight, footprintW/D, overhangW/D` 보유. |
| `components/company/CompanyResult.tsx` | `[2] 파렛트 적재` 카드에서 `totalPallets`(총 파렛트: N개), `layers/lastLayerBoxes`, footprint/overhang, weight 표시. JSX **텍스트 노드에 실제 한글** 사용. |
| `components/company/CompanyPalletSvg.tsx` | 택배/낱개를 상단 **topper 별도 줄**로 렌더(`toppers`). `totalPallets>1` 시 "만재 파렛트" 안내 텍스트. 텍스트는 **백틱 템플릿 리터럴**이라 `\u` 이스케이프 사용해도 정상 렌더(가드 스크립트가 백틱 내부는 검사 제외). |
| 무게 로직 (`weight.ts`) | `stackWeight = productWeight + innerTare + outerTare`가 이미 **택배/낱개 제품+인박스+박스 전부 포함**. → Step 3-3에서도 **무게 로직 변경 불필요.** |
| 가드 스크립트 `scripts/check-jsx-escapes.mjs` | company `*.tsx`의 **JSX 텍스트 노드(따옴표·백틱·주석 밖)** 의 `\u` 이스케이프만 실패 처리. |

> **구현 시 컨벤션 준수**: `CompanyResult.tsx`는 JSX 텍스트에 실제 한글, `CompanyPalletSvg.tsx`는 텍스트를 백틱 템플릿으로 유지. 두 파일 각각의 기존 방식을 그대로 따른다. (외과적 수정)

---

## 3. 이번 Step에서 만질 파일 (외과적 — 지침 9·10)

| # | 파일 | 계층 | 성격 | 변경 |
|---|------|------|------|------|
| A | `types/company.ts` | 타입 | 수정 | `PalletStack` 슬롯·오버플로우 필드 추가, `totalPallets` 제거 |
| B | `lib/company/pallet.ts` | **엔진(백엔드)** | **재작성** | 파렛트 1개 전제 + 슬롯 환산 + 오버플로우 + 층수/높이 + 슬롯종류 헬퍼 |
| C | `lib/company/simulate.ts` | 엔진 | 수정 | `calcPallet`에 3-카운트 전달, overflow 결과 반영 |
| D | `components/company/CompanyPalletSvg.tsx` | **프론트(UI)** | **대수정** | topper 제거 → 빈칸 슬롯 위치에 택배/낱개 렌더, 진짜 빈칸만 dashed, 다중 파렛트 텍스트 제거 |
| E | `components/company/CompanyResult.tsx` | 프론트 | 수정 | overflow 시 `[2]` 대신 "적재 초과" 경고 표시, `totalPallets` 표시 라인 제거 |

**보존 목록(수정 금지):** `components/svg/`, `components/stock/`, `lib/stock/`, `python/**`, 그리고 Step 3-2에서 완성된 `lib/company/overhang.ts`·`master.json`·`data.ts`.
**규격·무게 고정:** `master.json`·`weight.ts` **변경 없음.**

---

## 4. 타입 스키마 설계 (A. `types/company.ts`)

`PalletStack`을 파렛트 1개 전제로 재정의한다. `any`/`unknown` 미사용 (지침 5).

```ts
// ─── 파렛트 결과 (Phase 5 Step 3-3 — 파렛트 항상 1개, 슬롯 환산) ─────────────
export interface PalletStack {
  palletId: string;
  boxesPerLayer: number;    // 층당 슬롯 수 (= 파렛트 layout의 cols×rows)
  neededSlots: number;      // 필요슬롯 = slotOuter + slotCourier + slotLoose
  maxSlots: number;         // 최대슬롯 = boxesPerLayer × 5
  overflow: boolean;        // 필요슬롯 > 최대슬롯 → 적재 초과
  slotOuter: number;        // 아웃박스가 차지하는 슬롯 (= outerCount)
  slotCourier: number;      // 택배가 차지하는 슬롯 (= courierCount)
  slotLoose: number;        // 낱개가 차지하는 슬롯 (= ceil(looseCount / 2))
  layers: number;           // 층수 = ceil(neededSlots / boxesPerLayer)
  lastLayerSlots: number;   // 마지막(맨 위) 층이 실제 차지한 슬롯 수
  height: number;           // 파렛트 높이 + 315 × 층수 (mm)
  weight: number;           // 파렛트 tare + 적재물 무게 (kg)
  footprintW: number;       // 파렛트+아웃박스 합산 외곽 가로 (mm) — Step 3-2 유지
  footprintD: number;       // 파렛트+아웃박스 합산 외곽 세로 (mm)
  overhangW: number;        // 가로 오버행 (mm)
  overhangD: number;        // 세로 오버행 (mm)
}
```

**변경 요약**
- **제거:** `totalPallets`(항상 1이므로 불필요), `lastLayerBoxes`(→ `lastLayerSlots`로 의미 명확화).
- **추가:** `neededSlots`, `maxSlots`, `overflow`, `slotOuter`, `slotCourier`, `slotLoose`, `lastLayerSlots`.
- **유지:** `footprintW/D`, `overhangW/D`(Step 3-2), `height`, `weight`, `boxesPerLayer`, `layers`, `palletId`.

> **설계 결정 D-1 — ✅ 확정 (사용자 선택 A, 2026-07-02):** overflow 신호는 **`PalletStack.overflow` 단일 필드**로 통합한다(필드 한 개로 끝나 더 단순, CompanyResult가 `pallet.overflow`만 보면 됨). `simulate` 최상위 별도 `palletOverflow` 플래그는 **만들지 않는다.**

---

## 5. 엔진 로직 설계 (B. `lib/company/pallet.ts` 재작성)

### 5-1. 시그니처 변경
```ts
export interface OuterBoxCounts {
  outerCount: number;
  courierCount: number;
  looseCount: number;
}

export function calcPallet(
  counts: OuterBoxCounts,
  pallet: PalletSpec,
  stackWeight: number,
): PalletStack | null
```
- `simulate.ts`는 이미 `countOuterBoxes(boxes)`로 3-카운트를 확보 → 그대로 전달.

### 5-2. 핵심 계산
```
slotOuter    = outerCount
slotCourier  = courierCount
slotLoose    = ceil(looseCount / 2)
neededSlots  = slotOuter + slotCourier + slotLoose

bpl          = pallet.boxesPerLayer
maxSlots     = bpl × 5
overflow     = neededSlots > maxSlots

layers         = ceil(neededSlots / bpl)          // overflow여도 참고용 계산
lastLayerSlots = neededSlots − bpl × (layers − 1) // 맨 위 층 점유 슬롯
height         = pallet.h + 315 × layers
weight         = pallet.tare × 1 + stackWeight     // 파렛트 1개
```
- `neededSlots <= 0` → `null` 반환(적재 안 함, 기존 `outerCount<=0` 가드 계승).
- footprint/overhang은 기존처럼 `simulate.ts`가 `calcFootprint` 결과로 덮어씀(Step 3-2 유지).

### 5-3. 슬롯 종류 헬퍼 (엔진이 진실의 원천 — SVG는 그림만)
빈칸 배치 규칙(아웃→택배→낱개)을 **엔진에 두고**, SVG가 슬롯 index로 조회한다. (지침 9 모듈 분리)

```ts
export type SlotKind = 'outer' | 'courier' | 'loose' | 'empty';

/** 채움 순서(아웃→택배→낱개) 기준으로 슬롯 index의 종류를 반환. */
export function slotKindAt(
  index: number,
  s: { slotOuter: number; slotCourier: number; slotLoose: number },
): SlotKind {
  if (index < s.slotOuter) return 'outer';
  if (index < s.slotOuter + s.slotCourier) return 'courier';
  if (index < s.slotOuter + s.slotCourier + s.slotLoose) return 'loose';
  return 'empty';
}
```
- 슬롯 index는 SVG에서 **아래층→위층, 좌→우**로 전역 순번을 매겨 이 헬퍼에 넘긴다.
- 택배/낱개가 마지막에 채워지므로 자연히 **맨 위 층(및 필요 시 바로 아래 층)** 에 위치 → topper 불필요.

### 5-4. `overflow`일 때 반환
- overflow여도 `PalletStack`을 정상 반환(필드 값 계산은 그대로) + `overflow: true`.
- UI는 overflow면 상세를 숨기고 경고만 표시하므로 layers/height 값은 표시에 쓰이지 않음(계산은 무해).

---

## 6. simulate.ts 연동 (C)

```ts
// 변경 전
pallet = calcPallet(outerCount, palletSpec, stackWeight);

// 변경 후
pallet = calcPallet({ outerCount, courierCount, looseCount }, palletSpec, stackWeight);
```
- 그 외(footprint 덮어쓰기, totalWeight, weightIncomplete)는 **변경 없음.**
- `palletTare` 계산: 기존 `palletSpec.tare * pallet.totalPallets` → **`palletSpec.tare * 1`** (파렛트 1개).

---

## 7. 프론트 설계 (D. CompanyPalletSvg / E. CompanyResult)

### 7-1. `CompanyPalletSvg.tsx` (대수정)
- **제거:** 상단 topper 렌더(`toppers` 블록), `totalPallets>1` 다중 파렛트 안내 텍스트·`hasMultiPallets` 분기.
- **변경:** 층 렌더 루프에서 각 슬롯을 `slotKindAt(globalIndex, stack)`로 판정해 색 지정.
  - `outer` = `#C9A86A` (금색, 기존 채움색) + 세로 분할선
  - `courier` = `#8FBFA0` (기존 택배 topper 초록)
  - `loose` = `#9C9486` (기존 낱개 topper 회색)
  - `empty` = `fill:none` + dashed(`3 2`) (진짜 빈칸만)
- 전역 슬롯 index = `layer × bpl + i` (아래층부터). 색·라벨은 슬롯 종류로 결정.
- 하단 라벨: `${layers}층 · 마지막층 ${lastLayerSlots}칸 · 층당 ${bpl}` (기존 문구 최소 수정).
- 텍스트는 **백틱 템플릿 유지**(가드 통과). Props에서 `courierCount`/`looseCount`는 이제 SVG가 슬롯 색만 쓰면 되므로 `stack`의 slot 필드로 대체 → **Props 단순화**(`courierCount`/`looseCount` prop 제거, `stack`만 받음).

### 7-2. `CompanyResult.tsx` (수정)
- `pallet.overflow === true` → `[2]` 카드 대신 **경고 카드**:
  - 문구(확정): **"적재 초과 — 이 파렛트는 선택할 수 없습니다"**
  - 부가 안내: 필요슬롯/최대슬롯 수치 표기(예: `필요 23슬롯 / 최대 20슬롯`).
- `pallet.overflow === false` → 기존 `[2]` 카드 렌더하되:
  - **제거:** "총 파렛트: {totalPallets}개" 라인(항상 1이라 무의미).
  - **변경:** "마지막 파렛트: {layers}층 (마지막 층 {lastLayerBoxes}개 …)" → "적재: {layers}층 (마지막 층 {lastLayerSlots}칸, 층당 {boxesPerLayer})".
  - footprint/overhang/height/weight 표시는 **유지.**
  - `<CompanyPalletSvg stack={pallet} />` 로 호출 단순화.
- JSX 텍스트는 **실제 한글** 유지(기존 컨벤션).

---

## 8. 진행 체크박스 (구현 시 완료 표시하며 진행 — 지침 3)

### 엔진(백엔드) 먼저
- [x] A. `types/company.ts` — `PalletStack` 슬롯·오버플로우 필드 개편(`totalPallets`/`lastLayerBoxes` 제거, 신규 필드 추가), `SlotKind` 타입
- [x] B. `lib/company/pallet.ts` 재작성 — `OuterBoxCounts` 시그니처, 슬롯 환산, overflow, 층수/높이, `slotKindAt` 헬퍼
- [x] C. `lib/company/simulate.ts` — 3-카운트 전달, `palletTare` 1개 기준
- [x] `npx tsc --noEmit` 통과 (엔진 단계, 지침 6)

### 프론트(UI) 나중
- [x] D. `components/company/CompanyPalletSvg.tsx` — topper 제거, 슬롯 위치 렌더, 다중 파렛트 텍스트 제거, Props 단순화
- [x] E. `components/company/CompanyResult.tsx` — overflow 경고, `totalPallets` 라인 제거, `lastLayerSlots` 반영
- [x] `node scripts/check-jsx-escapes.mjs` 통과
- [x] `npx tsc --noEmit` 통과 (프론트 단계)

### 검증·문서
- [x] `scripts/test-step3-3.ts` 작성 후 §9 케이스 실행
- [x] 회귀: `test-step4.ts`(19케이스)·`test-step3-2.ts`(오버행) 통과 확인
- [x] `PHASE5-STEP3-VERIFY-LOG.md`에 Step 3-3 섹션 추가 후 다운로드 제공 (지침 4)
- [x] `PROGRESS.md` / `PHASE5-STEP3-IMPL-PLAN.md` Step 3-3 체크박스 완료 처리
- [x] `npm run build` (로컬 폰트 스텁, 끝나면 원복) → ✓ 성공·스텁 원복 완료
- [x] 커밋·push (main → Vercel 자동 배포) — 사용자 승인 후 반영

---

## 9. 검증 케이스 (지침 4 — 테스트 환경 구축 후 로그 문서화)

`scripts/test-step3-3.ts` (기존 `test-step3-2.ts` 형식) — `calcPallet` 출력을 단정.

| # | 입력 (파렛트 / 카운트) | 기대 필요슬롯 | 기대 결과 |
|---|---|---|---|
| S1 | 700 / outer 20 | 20 | overflow=false (20 ≤ 20) |
| S2 | 700 / outer 21 | 21 | **overflow=true** (21 > 20) |
| S3 | 900 / outer 30 | 30 | overflow=false |
| S4 | 900 / outer 31 | 31 | **overflow=true** |
| S5 | 700 / outer 18 + courier 2 | 20 | overflow=false, layers=5, lastLayerSlots=4, height=140+315×5=1715 |
| S6 | 700 / outer 18 + courier 5 | 23 | **overflow=true** (23 > 20) |
| S7 | 700 / loose 3 | 2 | slotLoose=ceil(3/2)=2, neededSlots=2 |
| S8 | 700 / outer 16 + courier 2 + loose 3 | 20 | overflow=false, slotKindAt로 상위 슬롯이 courier×2·loose×2 확인 |
| S9 | 1100 / outer 45 | 45 | overflow=false; outer 46 → overflow=true |

- 불변식: `slotKindAt` 순서(outer→courier→loose→empty), `neededSlots = slotOuter+slotCourier+slotLoose`, `maxSlots = bpl×5`.
- SVG 육안: topper 제거 + 택배/낱개가 빈칸 위치에 렌더 → 로컬 빌드/Chrome 확인(Step 3-5에서 통합 확인도 가능).

---

## 10. 결정사항 (모두 확정 — 착수 대기)

- **D-1. overflow 신호 구조 — ✅ 확정: (A) `PalletStack.overflow` 단일 필드** (사용자 선택 2026-07-02). 최상위 별도 플래그 없음.
- **totalPallets/lastLayerBoxes 필드 제거** — 단일 파렛트 전제상 불가피한 정리.
- **Props 단순화**, **경고 문구 "적재 초과 — 이 파렛트는 선택할 수 없습니다"** — 확정.

→ 열어둔 결정 없음. **사용자 "코딩 진행" 명령을 받으면 즉시 착수** (지침 1).

---

## 11. 이후 남은 Step (참고)
- **Step 3-4** 원단 타입 도입(요구 5) — `PHASE5-STEP3-IMPL-PLAN.md` Step 4 참조.
- **Step 3-5** 통합 검증 & 빌드 + 문서 완료 처리.

*구현 순서: (1) 사용자 D-1 확인 + "코딩 진행" 명령 → (2) 엔진 A·B·C + tsc → (3) 프론트 D·E + 가드 + tsc → (4) 검증 스크립트·로그 → (5) 문서 체크박스·빌드·push.*
