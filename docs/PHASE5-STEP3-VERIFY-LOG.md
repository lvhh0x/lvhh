# MERIDIAN — Phase 5 Step 3 검증 로그

> **작성일:** 2026-07-01
> **대상:** 대대적인 개선 (박스 그리드 5열 / 파렛트 규격·오버행 / 원단 타입)
> **검증 방식:** 로컬 클론 → 코드 수정 → `tsc --noEmit` → (Step 1은 이후 Chrome 실브라우저 확인 추가)
> 이 문서는 Step 1 ~ Step 5 진행에 따라 계속 추가된다.

---

## Step 1 — 박스 그리드 5열 (요구 1)

### 1. 변경 파일

`components/company/CompanyResult.tsx` — 박스 그림 컨테이너 스타일 1곳만 수정.
커밋: `3523124`

### 2. 변경 내용 (diff)

```diff
         {/* 박스 그림들 */}
         <div
           style={{
-            display: 'flex',
-            flexWrap: 'wrap',
+            display: 'grid',
+            gridTemplateColumns: 'repeat(5, 1fr)',
             gap: '12px',
             marginBottom: '18px',
-            alignItems: 'flex-end',
+            alignItems: 'end',
           }}
         >
```

### 3. 타입체크 결과

```
npm install        → 376 packages, 정상
npx tsc --noEmit    → 에러 0 (exit 0)
```

### 4. 1차 Chrome 검증 — 오버플로우 버그 발견

`lvhh.vercel.app/company/box-pallet`에서 40×300m × 800개 입력(아웃박스 7개 생성) 후 실측.

**결과: 5번째 박스가 카드 우측 테두리를 벗어나는 오버플로우 발견.**

- 원인: `BoxSvg.tsx`의 SVG가 `width={canvasW}` 고정 픽셀 속성을 사용하는데, `canvasW`는 내용물 텍스트 라벨 길이에 따라 120px보다 커질 수 있음.
- `gridTemplateColumns: 'repeat(5, 1fr)'`는 `minmax(auto, 1fr)`와 동일하게 동작해 각 칸이 콘텐츠의 최소(content-based) 폭보다 작아지지 못함.
- 텍스트가 긴 박스가 하나라도 있으면 그 칸이 넓어지고, 5칸 합이 카드 폭을 넘으면 grid는 flex-wrap과 달리 줄바꿈 없이 그대로 넘쳤버림.

### 5. 수정 (2차)

- 변경 파일: `components/company/CompanyResult.tsx`, `components/company/BoxSvg.tsx`
- 커밋: `3523124`(1차 grid 변경) → `9e74caf`(BoxSvg 반응형 보완)
- `gridTemplateColumns: 'repeat(5, 1fr)'` → `'repeat(5, minmax(0, 1fr))'` (칸이 0까지 줄어들 수 있게)
- 그리드 아이템 wrapper `<div>`에 `minWidth: 0` 추가 (grid item 기본 min-width:auto override)
- `BoxSvg.tsx`의 `<svg width={canvasW} height={totalH}>` 고정 속성 제거 → `style={{ width: '100%', height: 'auto', minWidth: 0 }}`로 반응형 스케일링 (viewBox는 유지해 비율 보존)
- `npx tsc --noEmit` → 에러 0 (재확인)

> 참고(부수 사항): `BoxSvg.tsx` 재작성 과정에서 원본이 갖고 있던 한글 문자열의 유니코드 이스케이프(`\uc544\uc6c3\ubc15\uc2a4` 등) 표기가 실제 한글 문자로 바뀌었음. 런타임 동작은 완전히 동일하나 불필요한 표기 변경이 섞임 (외과적 수정 원칙 위반, 사용자에게 별도 보고함).

### 6. 2차 Chrome 검증 — 최종 확인

동일 케이스(40×300m × 800개, 아웃박스 7개)로 재실행.

| 항목 | 상태 |
|------|------|
| 아웃박스 5개 이상일 때 한 줄에 정확히 5개 표시 | ✅ 확인 |
| 6번째 박스부터 다음 줄로 넘어감 | ✅ 확인 (6·7번째가 2번째 줄) |
| 하단 정렬(기존 동작) 유지 | ✅ 확인 |
| 박스 그림/텍스트 안 잘림, 카드 테두리 안에 유지 | ✅ 확인 (수정 전 5번째 박스 오버플로우 → 수정 후 해소) |
| `npx tsc --noEmit` 통과 | ✅ 완료 (에러 0) |

**Step 3-1 완료.**

---

## Step 2 — 규격·오버행 엔진 신설 (요구 3+4)

> 검증일: 2026-07-02 · 상세 설계: `docs/PHASE5-STEP3-STEP2-IMPL.md`
> 사용자 확정: 파렛트 배열표(700=2×2 / 900=3×2 회전 / 1100·플라스틱=3×3), 오버행은 아웃박스만 기준, 배열표는 master.json 하드코딩(Phase 6 DB 이관 전제).

### 1. 변경 파일 (수정 6 + 신규 3)

| 파일 | 성격 | 변경 |
|------|------|------|
| `lib/company/master.json` | 데이터 | 각 pallet에 `layout {cols,rows,rotated}` 추가 |
| `types/company.ts` | 타입 | `PalletLayout` 신규, `PalletSpec.layout`, `PalletStack`에 `footprintW/D`·`overhangW/D` |
| `lib/company/data.ts` | 매핑 | `layout` 필드 매핑 |
| `lib/company/overhang.ts` | **엔진 신규** | `calcFootprint(pallet, outerBox)` — 규격·오버행 순수 함수 |
| `lib/company/pallet.ts` | 엔진 | `PalletStack` 반환에 footprint/overhang 기본값(파렛트 원치수·0) 추가 |
| `lib/company/simulate.ts` | 엔진 | `calcFootprint` 호출해 PalletStack에 규격·오버행 부착 |
| `components/company/CompanyResult.tsx` | 프론트 | 규격 표시를 `footprintW×footprintD` + 오버행 문구로 교체 |
| `docs/PHASE5-STEP3-STEP2-IMPL.md` | 문서 | Step 2 상세 구현계획 |
| `scripts/test-step3-2.ts` | 검증 | 규격·오버행 엔진 테스트 |

### 2. 무게 보정 재점검 결과 — weight.ts 변경 없음

IMPL-PLAN Step 2 설계에는 "적재 무게에 택배/낱개 제품무게 누락" 우려가 적혀 있었으나,
현행 `simulate.ts`의 `stackWeight = productWeight + innerTare + outerTare`에서 `productWeight`는
**입력 전체(`validInputs`) 기준 합**이라 택배/낱개 제품무게를 이미 포함하고 있음을 확인.
→ **누락 아님. weight.ts 로직 변경 불필요**(지침 3 외과적 수정 — 불필요한 변경 배제).
파렛트 자체 무게(palletTare)는 `totalWeight`에 이미 반영(유지).

### 3. 파렛트별 배열표 (사용자 확정 · master.json 하드코딩)

| pallet | 규격(w×d) | bpl | layout | 배열총폭 | footprint | overhang(w,d) |
|---|---|---|---|---|---|---|
| 700-wood | 710×750 | 4 | 2×2 무회전 | 710×630 | 710×750 | 0, 0 |
| 900-wood | 900×710 | 6 | 3×2 90°회전 | 945×710 | 945×710 | **45**, 0 |
| 1100-wood | 1100×1100 | 9 | 3×3 무회전 | 1065×945 | 1100×1100 | 0, 0 |
| 1100-plastic-a | 1100×1100 | 9 | 3×3 무회전 | 1065×945 | 1100×1100 | 0, 0 |
| 1100-plastic-b | 1100×1100 | 9 | 3×3 무회전 | 1065×945 | 1100×1100 | 0, 0 |

### 4. 검증 결과

```
[신규] scripts/test-step3-2.ts (규격·오버행 엔진)
  아웃박스 규격: 355 × 315 mm
  PASS [700-wood]        배열총폭 710×630  → footprint 710×750  / overhang 0,0
  PASS [900-wood]        배열총폭 945×710  → footprint 945×710  / overhang 45,0
  PASS [1100-wood]       배열총폭 1065×945 → footprint 1100×1100 / overhang 0,0
  PASS [1100-plastic-a]  배열총폭 1065×945 → footprint 1100×1100 / overhang 0,0
  PASS [1100-plastic-b]  배열총폭 1065×945 → footprint 1100×1100 / overhang 0,0
  결과: 5/5 통과

  불변식 확인:
   · 모든 파렛트 cols × rows == boxesPerLayer ✓
   · footprintW == max(pallet.w, arrW), overhangW == max(0, arrW − pallet.w) ✓ (D도 동일)

[회귀] scripts/test-step4.ts (기존 19케이스) → 19/19 통과 (무영향 확인)
```

### 5. 빌드/타입체크

```
npx tsc --noEmit         → 에러 0 (exit 0)
npm run build            → Compiled successfully (폰트 스텁 로컬 임시, 원복 완료 — push 안 함)
```

### 6. 미해결/이월 (Step 3에서 처리)

- 파렛트 슬롯 환산 / 빈칸 배치 / 적재 오버 판정 → **Step 3**.
- 단일 파렛트 전제 pallet.ts 재작성, 슬롯 기반 높이/층수 재계산 → **Step 3**.
  (Step 2는 현행 pallet.ts 층수·높이를 그대로 사용. footprint/overhang만 신규 반영.)
- CompanyPalletSvg 빈칸 렌더 → **Step 3**.

**Step 3-2(규격·오버행 엔진) 완료.** (브라우저 육안 확인은 Step 3 통합 검증에서 함께 수행 예정)
