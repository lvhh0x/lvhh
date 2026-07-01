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
- 텍스트가 긴 박스가 하나라도 있으면 그 칸이 넓어지고, 5칸 합이 카드 폭을 넘으면 grid는 flex-wrap과 달리 줄바꿈 없이 그대로 넘쳐버림.

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
