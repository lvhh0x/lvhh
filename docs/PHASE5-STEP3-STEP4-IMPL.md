# MERIDIAN — Phase 5 Step 3-4 구현 계획 & 로그 (원단 타입 도입 + 무게 표시 분리)

> **작성일:** 2026-07-03
> **기준 커밋:** `a40b8a2`(코드) / `7a9c47e`(문서 HEAD)
> **범위:** 요구 5(원단 타입 도입) + 추가 요구(적재무게/파렛트무게/총무게 분리 표시)
> **작업 규율:** 완성돼 돌아가는 코드는 손대지 않고, 수정할 곳만 외과적으로 수정. `any`/`unknown` 금지. 각 단계마다 `tsc --noEmit` 통과. 프론트 수정 후 JSX 한글 가드 실행.

---

## 0. 착수 전 확정된 사용자 결정 (2026-07-03)

| # | 미결정 | 확정 |
|---|--------|------|
| ① | 원단 미입력 허용 | **선택 — 미입력 시 `미지정`으로 처리** (미지정끼리 같은 원단으로 그룹핑) |
| ② | 혼합 원단 박스 라벨 | **통일안 — 혼합(2종 이상)이면 무조건 2줄**: 윗줄=원단 목록(`+` 나열), 아랫줄=박스 종류 |
| — | 단일 원단 라벨 | `B220 아웃박스` (1줄) — 2026-07-01 기 확정 |
| — | 혼합 목록 정렬 | 박스 내 제품수량 많은 원단 순 → 동률이면 입력(등장) 순, **distinct**(중복 제거) |
| ③ | 무게 표시 | **3줄 분해** — `[1]` 박스 결과는 **적재 무게(파렛트 제외)**, `[2]` 파렛트 결과는 `적재 무게` / `파렛트 무게` / `총 무게` 3줄 |

---

## 1. 현황 분석 (읽고 확인한 사실)

### 1.1 무게는 이미 파렛트를 더하고 있었음 (값은 정확, 표시가 문제)
- `simulate.ts`: `totalWeight = 제품 + 인박스tare + 아웃박스tare + palletTare` → **파렛트 포함**.
- `pallet.ts`: `pallet.weight = pallet.tare + stackWeight` (stackWeight=적재물) → **파렛트 포함** (= totalWeight와 동일 값).
- `master.json`의 각 파렛트에 `tare`(700=9.0/900=12.4/1100=23.3/플라스틱A=10.5/B=18.5) **이미 존재** → master.json 수정 불필요.
- 화면: `[1]`은 `총 무게 {totalWeight}`(파렛트 몰래 포함), `[2]`는 `적재 무게 {pallet.weight}`(라벨은 적재인데 값은 파렛트 포함) → **두 곳에 같은 값**이 찍혀 혼란.
- **해결:** 값 계산은 그대로, **표시만** 분리. 컴포넌트에서 `loadWeight = totalWeight − palletTare`로 역산 → 엔진/타입 무수정.

### 1.2 원단 그룹핑 — 현재 알고리즘과의 접점
- `outerbox.packIntoBoxes`: (1) 제품행별 풀 아웃박스 추출 → (2-a) **(size,meter)별** 잔여 합쳐 풀 재추출 → (2-b) 정확합침(다른 청크와 exact-fill 60) → (3) 잔여 FFD.
- 제품 입력 1행 = 단일 (size,meter,fabric,qty)이므로 (1)의 풀 아웃박스는 **자동으로 단일 원단**.
- (2-a) 그룹핑 키를 **(size,meter,fabric)** 로 바꾸면 → 같은 원단 잔여끼리 먼저 풀 추출 = 규칙 ①.
- (2-b) 정확합침은 이미 청크(서로 다른 원단 포함)를 exact-fill로 섞음 = 규칙 ②. **로직 무변경**.
- (3) 잔여 FFD도 들어맞으면 섞어 담음 = 규칙 ③. **로직 무변경**.
- **개수 규칙(아웃60/택배12) 절대 불변** — 위 변경은 그룹핑 키·필드 전달만 바꿈.

### 1.3 파급 범위 (grep 확인)
- `ProductInput`: 정의(types) + 생성(CompanyParams) + `weight.calcProductWeight`(size/meter/qty만 읽음 → **무영향**).
- `decomposeToInnerBoxes` 호출처: `simulate.ts` 1곳.
- `SizedInnerCount`: types / BoxSvg / outerbox / innerbox / simulate / **test-step4**.
- `lib/company/_backup/**`는 tsconfig `exclude` + 어디서도 import 안 됨 → **건드리지 않음**.
- `app/company/[id]/page.tsx`는 `CompanyParamsType`만 전달 → **원단 파급 없음**.
- 회귀 테스트 중 `ProductInput`을 생성하는 건 **test-step4.ts의 `P` 헬퍼**뿐 (test-3-2=footprint, test-3-3=calcPallet, 원단 무관).

---

## 2. 구현 체크리스트 (A→E + 무게, 워크트리/모듈 분리)

각 항목 완료 시 `[x]` 표기.

### A. 타입 (계층: 타입)
- [x] `types/company.ts` `ProductInput`에 `fabric: string` 추가
- [x] `types/company.ts` `SizedInnerCount`에 `fabric: string` 추가
- 검증: `tsc --noEmit` (여기서 test-step4·CompanyParams가 fabric 누락으로 에러 → B/I 단계에서 해소)

### F. 원단 유틸 모듈 (계층: 엔진/유틸, 신규 — 순수함수, 테스트 대상)
- [x] `lib/company/fabric.ts` 신규
  - `normalizeFabric(raw: string): string` — trim, 빈 문자열 → `미지정`
  - `distinctFabricsByQty(contents: SizedInnerCount[]): string[]` — 원단별 productQty 합 내림차순, 동률 등장순, distinct

### C. 인박스 엔진 (계층: 엔진)
- [x] `innerbox.decomposeToInnerBoxes(product, qty, fabric)` — 시그니처에 `fabric` 추가, 각 `SizedInnerCount`에 부착(passthrough)
- [x] `simulate.ts` 호출부 `decomposeToInnerBoxes(product, input.qty, input.fabric)`

### D. 아웃박스 엔진 (계층: 엔진 — 핵심)
- [x] `outerbox.ts` `FlatInner`·`Chunk`에 `fabric` 필드 추가
- [x] `expandSized` — FlatInner에 fabric 실어 전개
- [x] `compressSized` — 합산 키를 `size_meter_kind_fabric`로 (혼합 박스 내용물이 원단별로 분리 보존)
- [x] (2-a) 잔여 그룹핑 키 `size_meter` → **`size_meter_fabric`**, Chunk.fabric = 잔여[0].fabric
- [x] (2-b)·(3) 로직 **무변경** (정확합침·FFD가 그대로 다른 원단 섞음)
- 불변: `OUTER_CAP=60`, `COURIER_CAP=12`, 개수 규칙

### B. 입력폼 (계층: 프론트)
- [x] `CompanyParams.tsx` `RowState`·`EMPTY_ROW`에 `fabric: string`
- [x] 입력 순서 **원단 → 사이즈 → 미터 → 수량**, 원단은 `<input type="text">` 자유입력(placeholder `B220`)
- [x] `handleRun` — `fabric: normalizeFabric(r.fabric)`, 필터는 기존대로 `size>0 && meter>0 && qty>0`(원단 필수 아님)

### E. 표시 (계층: 프론트)
- [x] `BoxSvg.tsx` — `distinctFabricsByQty(contents)`로 라벨 구성
  - 1종: `${원단} ${박스종류}` 1줄
  - 2종↑: 윗줄 `원단+원단+…`, 아랫줄 `박스종류` (2줄 통일)
  - 캔버스 폭/세로 레이아웃을 라벨 줄 수에 맞춰 조정(기존 `estimateLineWidth` 재사용)
- [x] `CompanyResult.tsx` — 무게 표시 분리 (원단 라벨은 BoxSvg가 전담, 여기선 **무게만** 수정)
  - `[1]` 박스 결과: `총 무게` → **`적재 무게 {load}`** (load = totalWeight − palletTare)
  - `[2]` 파렛트 결과: `적재 무게 {load}` / `파렛트 무게 {palletTare}` / **`총 무게 {totalWeight}`**(강조)

### T. 테스트 (계층: 검증)
- [x] `scripts/test-step4.ts` `P` 헬퍼에 `fabric: '미지정'` 추가 (타입 파급 대응 — **판정식·기대값 불변**, 회귀 동일 결과)
- [x] `scripts/test-step3-4.ts` 신규 — 아래 성공기준 단정 + `distinctFabricsByQty` 단정 + 무게 분해 단정

---

## 3. 성공 기준 (테스트로 단정)

원단 그룹핑 (개수 = 아웃/택배/낱개):
- `B220 110×300 30개` + `B325 110×300 30개` → 아웃박스 2개(안 섞임: 45u+45u=90 > 60 → 각각 부분 아웃박스)
- `B220 40×300 60개`(30u) + `B324 60×300 20개`(15u) → 45u → **부분 아웃박스 1개(섞임)**
- `B220 60×300 40개`(30u) + `B325 110×300 20개`(30u) + `B324 40×300 60개`(30u) → **아웃박스 1개(정확합침 60) + 택배박스 1개**
- 같은 원단으로 60 채워지면 안 섞음 / 안 채워지면 섞어 60 (혼합 박스 contents에 서로 다른 fabric 공존 확인)

불변식:
- 풀(filled) 아웃박스 단위합 = 60
- 입력 총 제품수 == 박스 내용물 productQty 합 (수량 보존)
- 원단이 무게·개수에 영향 없음: **기존 test-step4 19/19 동일 결과** 회귀 통과
- `distinctFabricsByQty`: 정렬(수량 desc, 동률 등장순)·distinct 검증

무게:
- 파렛트 선택 시 `총 무게 = 적재 무게 + 파렛트 tare`, `적재 무게 = totalWeight − palletTare`
- 파렛트 미선택 시 `적재 무게 == totalWeight`(palletTare=0)

전 과정 `tsc --noEmit` 0 에러, JSX 한글 가드 통과, `npm run build` 성공(폰트 스텁 로컬·원복).

---

## 4. 구현 로그 (실행하며 채움)

| 단계 | 상태 | 메모 |
|------|------|------|
| A 타입 | ✅ | ProductInput·SizedInnerCount에 `fabric: string` |
| F fabric.ts | ✅ | normalizeFabric, distinctFabricsByQty (순수 모듈) |
| C innerbox | ✅ | decompose 시그니처+passthrough, simulate 호출부 |
| D outerbox | ✅ | FlatInner fabric, expand/compress 키, 2-a 그룹핑 원단화 (Chunk.fabric은 미사용이라 생략) |
| B 입력폼 | ✅ | 원단 텍스트 입력(원단→사이즈→미터→수량), 미지정 정규화 |
| E 표시(BoxSvg/무게) | ✅ | 원단 라벨 1/2줄, 무게 3줄 분해(역산) |
| T 테스트 | ✅ | test-step3-4 17/17, test-step4 P 헬퍼 fabric, 회귀 19·5·80 무영향 |
| 빌드 | ✅ | tsc 0 · JSX 가드 OK · build 9/9 (스텁 원복) |
| push | ✅ | main 커밋 `a26307a`(엔진/타입/테스트) + `34a44a6`(프론트) — 원격 재클론 tsc·테스트 재검증 통과 |

*이 문서는 구현 진행에 따라 갱신된다.*
