# MERIDIAN — Phase 5 Step 3 / Step 2 (규격·오버행 엔진) 상세 구현계획

> 작성일: 2026-07-02 · 소속: **Phase 5 Step 3 → Step 2** (요구 3+4 묶음)
> 상위 문서: `PHASE5-STEP3-PLAN.md` / `PHASE5-STEP3-IMPL-PLAN.md`
> 검증 로그: `PHASE5-STEP3-VERIFY-LOG.md` (Step 2 섹션 추가)
> **데이터 단일 출처: `lib/company/master.json` (값 수정은 여기서만)**

---

## 0. 이 문서의 역할

Step 2 착수 전 사용자와 확정한 결정을 반영해, 실제로 만질 파일·스키마·로직·검증 케이스를
한 곳에 고정한다. 각 작업은 체크박스로 진행 상황을 표시하며 구현한다.

---

## 1. ✅ 사용자 확정 사항 (2026-07-02)

### 1-1. 파렛트별 아웃박스(355×315) 배열표

| 파렛트 | 규격(w×d) | boxesPerLayer | 배열 | 회전 | 배열 총폭(w×d) | 오버행(w, d) |
|---|---|---|---|---|---|---|
| 700-wood | 710×750 | 4 | 2×2 | 무회전 | 710×630 | 0, 0 |
| 900-wood | 900×710 | 6 | 3×2 | 90° 회전 | 945×710 | **45**, 0 |
| 1100-wood | 1100×1100 | 9 | 3×3 | 무회전 | 1065×945 | 0, 0 |
| 1100-plastic-a | 1100×1100 | 9 | 3×3 | 무회전 | 1065×945 | 0, 0 |
| 1100-plastic-b | 1100×1100 | 9 | 3×3 | 무회전 | 1065×945 | 0, 0 |

- **무회전**: 박스 가로(w=355)를 파렛트 가로(w) 방향, 박스 세로(d=315)를 파렛트 세로(d) 방향.
- **90° 회전**: 박스를 90° 돌려 박스 세로(315)를 파렛트 가로 방향, 박스 가로(355)를 파렛트 세로 방향.
- 배열 총폭 = (가로 개수 × 그 방향 박스치수) × (세로 개수 × 그 방향 박스치수).
- 오버행 = max(0, 배열 총폭 − 파렛트 치수). 방향별로 각각 계산.

### 1-2. 오버행 계산 범위
- **아웃박스 배열만** 기준. 택배박스(315×315)·낱개는 오버행 계산에서 제외.
  (택배박스는 아웃박스보다 작아 아웃박스 배열 폭 안에 들어옴 → 합리적 전제.)

### 1-3. 배열표 저장 방식
- 지금은 **`master.json`에 하드코딩**. Phase 6에서 Supabase 테이블로 이관 예정.
  → `data.ts` 매핑 계층을 그대로 거치게 해 Phase 6 전환을 쉽게 유지.

---

## 2. 이번 Step에서 만질 파일 (외과적)

| # | 파일 | 성격 | 변경 |
|---|------|------|------|
| A | `lib/company/master.json` | 데이터 | 각 pallet에 `layout` 필드 추가 |
| B | `types/company.ts` | 타입 | `PalletLayout` 추가, `PalletSpec`에 `layout`, `PalletStack`에 `footprint`·`overhang` |
| C | `lib/company/data.ts` | 매핑 | `layout` 필드 매핑 |
| D | `lib/company/overhang.ts` | **엔진 신규** | 규격·오버행 계산 순수 함수 |
| E | `lib/company/weight.ts` | 엔진 | 적재무게에 택배/낱개 제품무게 포함 보정 |
| F | `lib/company/simulate.ts` | 엔진 | overhang 호출 + stackWeight 보정 + PalletStack에 footprint/overhang 담기 |
| G | `components/company/CompanyResult.tsx` | 프론트 | 규격 표시를 footprint·오버행으로 교체 |

> **보존 목록·타 페이지 무영향.** 위 7개 파일만 수정. Step 3(슬롯/층수)에서 pallet.ts를 재작성하므로,
> 이번 Step 2는 **높이·층수는 현행 pallet.ts 값을 그대로 사용**하고 규격(footprint)·오버행·무게 보정에만 집중한다.

---

## 3. 스키마 설계

### 3-A. master.json `pallets[].layout`

각 파렛트에 아래 필드를 추가한다. (값은 §1-1 표에서 도출, 하드코딩)

```jsonc
"layout": {
  "cols": 2,          // 파렛트 가로(w) 방향 박스 개수
  "rows": 2,          // 파렛트 세로(d) 방향 박스 개수
  "rotated": false    // true면 박스를 90° 회전해 배치
}
```

- cols × rows == boxesPerLayer 여야 함 (검증 스크립트에서 확인).
- 실제 배열 총폭은 overhang.ts가 `rotated` + 아웃박스 치수(355×315)로 계산 → JSON에는 오버행 값을 중복 저장하지 않음(박스 치수가 바뀌면 자동 반영되도록).

| pallet id | cols | rows | rotated |
|---|---|---|---|
| 700-wood | 2 | 2 | false |
| 900-wood | 3 | 2 | true |
| 1100-wood | 3 | 3 | false |
| 1100-plastic-a | 3 | 3 | false |
| 1100-plastic-b | 3 | 3 | false |

### 3-B. types/company.ts

```ts
export interface PalletLayout {
  cols: number;      // 파렛트 가로(w) 방향 개수
  rows: number;      // 파렛트 세로(d) 방향 개수
  rotated: boolean;  // 박스 90° 회전 여부
}

// PalletSpec 에 추가:
//   layout: PalletLayout;

// PalletStack 에 추가:
//   footprintW: number;   // 파렛트+박스 합산 외곽 가로 (mm)
//   footprintD: number;   // 파렛트+박스 합산 외곽 세로 (mm)
//   overhangW: number;    // 가로 오버행 (mm, 0이면 없음)
//   overhangD: number;    // 세로 오버행 (mm, 0이면 없음)
```

### 3-C. overhang.ts 인터페이스

```ts
export interface Footprint {
  footprintW: number;
  footprintD: number;
  overhangW: number;
  overhangD: number;
}

/**
 * 파렛트에 아웃박스를 layout대로 배열했을 때의 합산 외곽 규격·오버행.
 * @param pallet   PalletSpec (w, d, layout 사용)
 * @param outerBox 아웃박스 규격 (w=355, d=315)
 */
export function calcFootprint(pallet: PalletSpec, outerBox: OuterBoxSpec): Footprint;
```

계산 로직:

```
if (layout.rotated) {
  // 박스 90° 회전: 박스 세로(d)가 파렛트 가로 방향, 박스 가로(w)가 파렛트 세로 방향
  arrW = layout.cols * outerBox.d
  arrD = layout.rows * outerBox.w
} else {
  arrW = layout.cols * outerBox.w
  arrD = layout.rows * outerBox.d
}
footprintW = max(pallet.w, arrW)
footprintD = max(pallet.d, arrD)
overhangW  = max(0, arrW - pallet.w)
overhangD  = max(0, arrD - pallet.d)
```

---

## 4. 무게 보정 (weight.ts / simulate.ts)

### 현재 문제
`simulate.ts`에서 파렛트 `stackWeight = productWeight + innerTare + outerTare` 를 계산해 넘긴다.
이미 **전체 제품무게(productWeight)** 를 포함하고 있어, 택배/낱개 제품무게도 사실상 들어가 있다.
→ 재점검 결과 **누락 아님.** `productWeight`는 입력 전체(`validInputs`) 기준 합이라 택배/낱개 포함.

### 결론 (surgical)
- **weight.ts 로직 변경 불필요.** 기존 `stackWeight`가 이미 전체 제품+인박스+아웃박스 tare를 포함.
- IMPL-PLAN의 "stackWeight에 택배/낱개 누락" 우려는 현행 코드 확인 결과 **해당 없음**.
  → 이 사실을 VERIFY-LOG에 명시하고, weight.ts는 건들지 않는다. (지침 3 — 외과적)
- 파렛트 자체 무게(palletTare)는 `totalWeight`에 이미 포함(유지).

> ⚠️ 단, Step 3에서 pallet.ts를 단일 파렛트로 재작성하면 `totalPallets`가 항상 1이 되므로
> palletTare 계산(`tare × totalPallets`)이 자연히 맞게 된다. Step 2에서는 현행 유지.

---

## 5. 프론트 표시 (CompanyResult.tsx)

현재 (line ~177):
```tsx
규격: {palletSpec.w}×{palletSpec.d}mm · 높이 {pallet.height}mm
```

변경 후:
```tsx
규격: {pallet.footprintW}×{pallet.footprintD}mm · 높이 {pallet.height}mm
{(pallet.overhangW > 0 || pallet.overhangD > 0) && (
  <span>  (박스 오버행 가로 {pallet.overhangW} / 세로 {pallet.overhangD}mm)</span>
)}
```

- 오버행 0이면 오버행 문구 미표시.
- 색/강조는 기존 스타일 유지(추천 R3 시각 강조는 이번 Step에서 미채택 — 사용자 미승인).

---

## 6. 검증 케이스 (VERIFY-LOG 기록 대상)

신규 테스트 스크립트 `scripts/test-step3-2.ts` (또는 test-step4에 추가)로 아래를 검증:

| # | 파렛트 | 기대 footprint | 기대 오버행(w,d) |
|---|---|---|---|
| O1 | 700-wood | 710×750 | 0, 0 (배열 710×630, 파렛트가 더 큼) |
| O2 | 900-wood | 945×710 | 45, 0 |
| O3 | 1100-wood | 1100×1100 | 0, 0 (배열 1065×945) |
| O4 | 1100-plastic-a | 1100×1100 | 0, 0 |
| O5 | 1100-plastic-b | 1100×1100 | 0, 0 |

불변식:
- 모든 파렛트: cols × rows == boxesPerLayer
- footprintW == max(pallet.w, arrW), overhangW == max(0, arrW − pallet.w)

추가: 기존 19케이스 회귀( test-step4.ts )가 여전히 통과하는지 재확인.

---

## 7. 작업 순서 & 체크리스트

```
[x] 7-1. master.json 각 pallet에 layout 필드 추가        → verify: JSON 파싱 OK
[x] 7-2. types/company.ts: PalletLayout + PalletSpec.layout + PalletStack footprint/overhang → verify: tsc
[x] 7-3. data.ts: layout 매핑 추가                       → verify: tsc
[x] 7-4. overhang.ts 신규 (calcFootprint)               → verify: tsc
[x] 7-5. simulate.ts: calcFootprint 호출 + PalletStack에 footprint/overhang 담기 → verify: tsc
[x] 7-6. CompanyResult.tsx: 규격 표시 교체              → verify: tsc
[x] 7-7. 검증 스크립트 작성 + 실행 (O1~O5 + 회귀 19)   → verify: 전부 통과
[x] 7-8. npx tsc --noEmit 최종 0 에러
[x] 7-9. npm run build (폰트 스텁 로컬, push 금지) 통과
[x] 7-10. VERIFY-LOG Step 2 섹션 기록
[x] 7-11. PROGRESS.md / IMPL-PLAN 체크박스 갱신 + 커밋
```

---

## 8. 이번 Step에서 **하지 않는** 것 (Step 3 이월)

- 파렛트 슬롯 환산 / 빈칸 배치 / 적재 오버 판정 → **Step 3**.
- 단일 파렛트 전제로의 pallet.ts 재작성 → **Step 3**.
- 높이/층수 재계산(슬롯 기반) → **Step 3**. (Step 2는 현행 pallet.ts 층수 그대로 사용)
- CompanyPalletSvg 빈칸 렌더 → **Step 3**.

*이 문서는 2026-07-02 Step 2 착수 시점 기준.*
