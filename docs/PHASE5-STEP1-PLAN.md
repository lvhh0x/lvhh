# MERIDIAN — Phase 5 Step 1 상세 구현계획서
## 제품 박스/파렛트 적재 시뮬레이션

> **문서 버전:** v1.1
> **작성일:** 2026-06-27
> **상태:** 🟢 전 항목 확정 — 코딩 대기 (사용자 명령 후 착수)
> **대상 Phase:** Phase 5 — 회사 시뮬레이션 / Step 1 (6개 카드 중 1개)
> **선행 완료:** Phase 0~4.5 (홈·주식 시뮬레이션·인프라)

---

## 0. 이 문서의 사용법

- 각 구현 체크리스트 항목은 완료 시 `- [ ]` → `- [x]` 로 바꾸며 진행한다.
- "확정 규칙"(3장)은 사용자와 합의된 비즈니스 로직이다. 구현은 이 규칙을 그대로 따른다.
- 모든 항목은 확정 완료(10장 참조). 별도 미결정 지점은 없다.
- 코딩은 **이 문서 검토 후 사용자의 명시적 명령**을 받고 시작한다.

---

## 1. 개요

### 1.1 목적

리본/열전사 필름(TTR) 제품의 출고를 시뮬레이션한다. 사용자가 **제품(사이즈·미터)·수량**과 **파렛트**를 입력하면:

1. 제품 수량 → **인박스** 몇 개(종류별)로 포장되는지 계산
2. 인박스들 → **아웃박스 / 택배박스 / 낱개**로 어떻게 묶이는지 계산
3. 파렛트 선택 시 → 아웃박스가 파렛트에 **몇 층 × 몇 개**로 적재되는지 계산
4. 각 단계를 **텍스트 + 그림(SVG)**으로 보기 쉽게 표현

### 1.2 Step 1 범위

| 포함 ✅ | 제외 (추후) ❌ |
|---------|----------------|
| `/company` 목록 화면 (6타일, 1개만 활성) | 나머지 5개 카드 (전부 "준비 중") |
| 활성 카드 1개의 전체 시뮬레이션 | DB 연동 (Phase 6) |
| 제품 3종 하드코딩 | 전체 제품 목록 (추후 확장) |
| 인박스 분해 / 박스 조합 / 파렛트 적재 / 무게 4개 엔진 | API Route (`/api/pallets`, `/api/products` → Phase 6) |
| 박스·파렛트 SVG 시각화 | 60인박스·택배박스 정확 무게 (placeholder 0kg) |

### 1.3 활성 카드

- **카드명(정식):** "제품수에 따른 박스 수량 및 파렛트 적재 시뮬레이션"
- **카드명(표시용):** "박스·파렛트 적재 시뮬레이션" ✅ (정식명 축약, 확정)
- **라우트 id:** `box-pallet`
- **경로:** `/company/box-pallet`

---

## 2. 화면 구성

### 2.1 목록 화면 `/company`

- 기존 주식 `/stock`의 6타일 그리드 패턴을 그대로 따른다(3→2→1 반응형).
- 6개 타일 중 1번만 `active`(클릭 가능, 우상단 `OPEN →`), 나머지 5개는 `coming-soon`(dim 0.45, 클릭 불가, 우상단 "준비 중").
- 페이지 헤더(FE-05 원본, 변경 금지):
  - `02 / OPERATIONS SIMULATION` — JetBrains Mono 12px `#8c7a55`
  - `회사 운영 시뮬레이터` — Cormorant Garamond 48px (`시뮬레이터` italic `#C9A86A`)

### 2.2 실행 화면 `/company/box-pallet`

좌우 2패널 레이아웃 (주식 `/stock/[id]` 패턴 재사용):

```
┌─────────────────┬──────────────────────────────┐
│  좌: 입력 패널   │  우: 결과 (그림 + 텍스트)      │
│  (sticky)        │                               │
│                  │  [1] 박스 결과                 │
│  제품 입력 행들   │     ├ 아웃박스/택배/낱개 그림   │
│   사이즈/미터/수량│     └ 사이즈·미터·수량·무게     │
│   [+ 제품 추가]   │                               │
│                  │  [2] 파렛트 결과 (선택+실행 시) │
│  파렛트 선택      │     ├ 적재 형상 그림 (층/개수)  │
│                  │     └ 가로×세로×높이·무게       │
│  [▶ 실행]        │                               │
└─────────────────┴──────────────────────────────┘
```

**입력 항목 (사용자가 조작하는 것 4종):**
1. 사이즈 (number) — 예: 40
2. 미터 (number) — 예: 300
3. 수량 (number) — 예: 120
4. 파렛트 (select) — 5종 중 선택 (또는 "적재 안 함")

→ **제품 행은 `[+ 제품 추가]` 버튼으로 여러 줄 입력 가능**(복합 출고). 각 행은 사이즈/미터/수량 + 삭제(×).

**실행 흐름:**
- 박스 계산은 입력 즉시 또는 [실행] 시 표시(주식과 동일하게 [실행] 버튼 클릭 후 850ms 연출 권장).
- 파렛트 그림은 파렛트가 선택되어 있을 때만 박스 결과 **아래에** 추가로 그려진다.

---

## 3. 확정 규칙 (사용자 합의 — 구현 기준)

### 3.1 마스터 데이터

#### 제품 (3종 하드코딩)

| 사이즈 | 미터 | 풀 아웃박스 수량 | 아웃박스 1개 무게 |
|--------|------|------------------|-------------------|
| 40 | 300 | 120개 | 15.92 kg |
| 60 | 300 | 80개 | 15.80 kg |
| 110 | 300 | 40개 | 15.00 kg |

> "풀 아웃박스 수량" = 145인박스 4개가 꽉 찬 아웃박스 1개에 들어가는 제품 개수.

#### 인박스 (3종)

| 종류 | 가로×세로×높이 (mm) | tare 무게 |
|------|---------------------|-----------|
| 60인박스 | 340×150×60 | (미상 → 0kg) |
| 95인박스 | 340×150×95 | 0.16 kg |
| 145인박스 | 340×150×150 | 0.22 kg |

#### 아웃박스 (2종)

| 종류 | 가로×세로×높이 (mm) | tare 무게 |
|------|---------------------|-----------|
| 택배박스 | 315×315×215 | (미상 → 0kg) |
| 아웃박스 | 355×315×315 | 0.5 kg |

#### 파렛트 (5종)

| 종류 | 가로×세로×높이 (mm) | 무게 | 층당 박스 |
|------|---------------------|------|-----------|
| 700파렛트 (나무) | 710×750×140 | 9 kg | 4개 |
| 900파렛트 (나무) | 900×710×140 | 12.4 kg | 6개 |
| 1100파렛트 (나무) | 1100×1100×190 | 23.3 kg | 9개 |
| A 플라스틱 | 1100×1100×155 | 10.5 kg | 9개 |
| B 플라스틱 | 1100×1100×155 | 18.5 kg | 9개 |

- **5단(층) 최대 적재 제한** 전 파렛트 공통.
- 900파렛트는 세로가 약간 삐져나오는 형태로 층당 6개.

### 3.2 인박스 용량 매핑표 (제품별)

각 제품의 사이즈에 따라 인박스당 들어가는 제품 개수가 다르다.

| 제품 | 145인박스 | 95인박스 | 60인박스 |
|------|-----------|----------|----------|
| 40×300 | 30개 | 20개 | 10개 |
| 60×300 | 20개 | 10개 | — |
| 110×300 | 10개 | — | — |

> Step 1은 이 3개 제품만. 다른 사이즈/미터는 매핑이 없으므로 입력 시 "지원하지 않는 제품" 안내(추후 확장). ✅ 입력 방식은 4.3/10장 참조.

### 3.3 엔진 ① — 인박스 분해 규칙

제품 수량 Q를 인박스로 나눈다. **큰 박스부터 꽉 채우고, 남는 수량은 그게 들어가는 "가장 작은 박스 1개"에 담는다.**

알고리즘:
```
입력: 제품 P, 수량 Q
용량목록 = P의 인박스들 (내림차순), 예 40×300 → [(145,30),(95,20),(60,10)]
largest = 용량목록[0]            # 가장 큰 인박스

rem = Q
boxes = []
while rem >= largest.cap:
    boxes += largest
    rem  -= largest.cap

if rem > 0:
    # rem이 들어가는 가장 작은 인박스 1개
    후보 = 용량목록 중 cap >= rem 인 것들
    boxes += (후보 중 cap이 가장 작은 박스)   # 후보 없으면 largest 1개(안전장치)
```

**검증 (사용자 예시):**
| 입력 | 분해 결과 | 확인 |
|------|-----------|------|
| 40×300 ×30 | 145×1 | ✅ |
| 40×300 ×50 | 145×1 + 95×1 | ✅ |
| 60×300 ×23 | 145×1 + 95×1 | ✅ |
| 60×300 ×31 | 145×2 | ✅ |
| 110×300 ×13 | 145×2 | ✅ |

### 3.4 엔진 ② — 박스 조합 규칙

모든 제품의 인박스를 **종류별로 합산** → 아웃박스/택배박스/낱개로 묶는다.

#### 용량 단위 (1차원 모델)

| 인박스 | 아웃박스 단위 | 택배박스 단위 |
|--------|---------------|---------------|
| 145 | 15 | 5 |
| 95 | 10 | 3 |
| 60 | 6 | 2 |
| **박스 총용량** | **60** | **12** |

- 아웃박스: 145×4 = 60 (꽉 참). 145×2+95×3 = 60. 60×10 = 60. 등.
- 택배박스: 145×2 = 10 (≤12). 95×4 = 12. 60×6 = 12. 145×1+95×2 = 11. **145×2+95 = 13 (불가)**, 145×2+60 = 12 (가능).

#### 조합 알고리즘

```
1) 모든 제품 인박스 합산 → {145: a, 95: b, 60: c}

2) 아웃박스에 First-Fit-Decreasing 패킹 (큰 인박스부터, cap=60)
   → 꽉 찬 아웃박스들 + 마지막에 부분 박스가 생길 수 있음

3) 마지막 박스가 부분(<60)이면 그 안의 인박스를 꺼내 "잔여"로 둔다.
   잔여 인박스 개수에 따라:
     - 0개 → 끝
     - 1개 → 낱개 출고 (인박스 그대로 1개)
     - 2개 이상 →
         · 잔여가 택배박스 1개(cap=12)에 FFD로 전부 담기면 → 택배박스 1개
         · 안 담기면 → 아웃박스(부분) 1개로 되돌림

* 잔여가 택배박스 1개를 초과하는 복합 케이스: "택배 우선 → 안 되면 아웃박스" 규칙을
  반복 적용하는 그리디로 처리(확정).
```

> 잔여는 정의상 아웃박스 1개 미만(<60단위)이므로 항상 아웃박스 1개에는 들어간다.

**검증 (사용자 예시 전체):**

| 입력 | 인박스 합산 | 최종 박스 | 확인 |
|------|-------------|-----------|------|
| 40×300 ×30 | 145×1 | 낱개 145×1 | ✅ |
| 40×300 ×120 | 145×4 | 아웃박스 1 (꽉) | ✅ |
| 110×300 ×60 | 145×6 | 아웃박스 1 + 택배박스 1 | ✅ |
| 110×300 ×50 | 145×5 | 아웃박스 1 + 낱개 145×1 | ✅ |
| 110×50 + 60×30 | 145×6, 95×1 | 아웃박스 2 (1꽉 + 1부분 145×2+95×1) | ✅ |
| 110×300 ×20 | 145×2 | 택배박스 1 | ✅ |
| 110×10 + 40×20 | 145×1, 95×1 | 택배박스 1 | ✅ |

> 사용자 예시 중 "195박스"는 145박스의 오타로 확인하여 145로 반영함.

### 3.5 엔진 ③ — 파렛트 적재 규칙

```
입력: 아웃박스 수 N, 선택 파렛트
층당개수 = 파렛트별 (700=4, 900=6, 1100=9, A/B플라스틱=9)
최대단수 = 5

층당개수 × 5 = 파렛트 1개 최대 박스 수
totalPallets = ceil(N / (층당개수 × 5))
마지막 파렛트의 층수    = ceil(마지막 잔여 / 층당개수)
마지막 층의 박스 수     = 잔여 - 층당개수 × (층수-1)
```

**적재 대상/순서:**
- **아웃박스만 정식 적재 계산**(5단·파렛트 매수에 반영).
- 택배박스·낱개는 **마지막 파렛트 맨 위에 시각적으로만 얹어** 표시(계산에는 미반영).
- 그림 적재 순서(아래→위): **아웃박스 → 택배박스 → 낱개**.
- 택배박스만으로 파렛트에 적재하는 경우(드묾)는 **총 높이 1770mm 제한** 규칙 보존.

**파렛트 외형 표시:**
- 가로×세로 = 파렛트 규격
- 높이 = 파렛트 높이 + 아웃박스 높이(315) × 단수
- 무게 = 파렛트 tare + 적재 박스 무게 합

**검증:** 아웃박스 10개 + 700파렛트(층당4) → `ceil(10/4)=3`층, 마지막 층 `10-4×2=2`개 → "3개 층, 마지막 층 2개" (사용자 표현 "3층하고 2개"와 일치) ✅

### 3.6 엔진 ④ — 무게 계산

제품 1개 무게는 "꽉 찬 아웃박스 무게"에서 박스 tare를 빼고 역산한다.

```
제품1개무게 = (아웃박스총무게 − 아웃박스tare 0.5 − 145tare 0.22 × 4) ÷ 풀수량
```

| 제품 | 계산 | 개당 무게 |
|------|------|-----------|
| 40×300 | (15.92−0.5−0.88)/120 | ≈ 0.1212 kg |
| 60×300 | (15.80−0.5−0.88)/80 | ≈ 0.1803 kg |
| 110×300 | (15.00−0.5−0.88)/40 | ≈ 0.3405 kg |

**총 무게 합산:**
```
총무게 = Σ(제품무게 × 수량)
       + Σ(인박스 tare: 145=0.22, 95=0.16, 60=0)
       + Σ(아웃박스 tare 0.5, 택배박스 tare=0)
       + (파렛트 적재 시) 파렛트 tare
```

> 60인박스·택배박스 tare는 0kg placeholder. 해당 박스가 포함된 구성은 무게가 과소 표시될 수 있으므로 "(일부 박스 무게 미반영)" 주석 표시. ✅

---

## 4. 데이터 모델 (TypeScript)

> 사용자 지침: `any` / `unknown` 사용 금지. 모든 타입 명시.

### 4.1 기존 `types/company.ts` 처리 (교체 확정)

- 현재 파일은 Phase 1에서 만든 **단순 placeholder**(단일 제품·단일 박스 기준, `CompanySimulationParams` 등). 사용처 없음.
- 이번 설계(복합 출고·인박스 분해·조합)와 구조가 완전히 달라 **교체**가 필요하다.
- **확정:** 새 타입으로 교체 승인됨 ✅. 착수 시 기존 import가 없음을 코드 검색으로 재확인 후 덮어쓴다.

### 4.2 새 타입 정의안

```typescript
// 인박스/아웃박스 종류
export type InnerBoxKind = 60 | 95 | 145;
export type OuterBoxKind = 'outer' | 'courier';   // 아웃박스 / 택배박스

// 마스터 데이터
export interface ProductSpec {
  size: number;            // 40
  meter: number;           // 300
  fullOuterQty: number;    // 120
  fullOuterWeight: number; // 15.92
  innerCapacity: Record<InnerBoxKind, number | null>; // {145:30,95:20,60:10}
}
export interface InnerBoxSpec { kind: InnerBoxKind; w: number; d: number; h: number; tare: number; }
export interface OuterBoxSpec { kind: OuterBoxKind; label: string; w: number; d: number; h: number; tare: number; perLayerUnit: number; capacityUnit: number; }
export interface PalletSpec { id: string; label: string; w: number; d: number; h: number; tare: number; boxesPerLayer: number; }

// 입력
export interface ProductInput { size: number; meter: number; qty: number; }
export interface CompanyParams { products: ProductInput[]; palletId: string | null; }

// 중간 결과
export interface InnerBoxCount { kind: InnerBoxKind; count: number; }
export interface PackedBox {
  kind: OuterBoxKind | 'loose';   // 아웃박스/택배박스/낱개
  contents: InnerBoxCount[];
  filled: boolean;                // 꽉 찼는지
  weight: number;
}

// 파렛트 결과
export interface PalletStack {
  palletId: string;
  layers: number;
  lastLayerBoxes: number;
  boxesPerLayer: number;
  totalPallets: number;
  height: number;
  weight: number;
}

// 최종 결과
export interface CompanyResult {
  innerTotals: InnerBoxCount[];   // 인박스 종류별 총합
  boxes: PackedBox[];             // 아웃박스/택배/낱개 리스트
  outerCount: number;
  courierCount: number;
  looseCount: number;
  totalWeight: number;
  pallet: PalletStack | null;
  weightIncomplete: boolean;      // placeholder tare 포함 여부
}
```

---

## 5. 모듈 구조 (워크트리)

> 사용자 지침: 모듈 분리(엔진/데이터/UI 각자) + 메인 통합. 백엔드(계산)/프론트엔드(화면) 분리.

### 5.1 백엔드 — 계산 (순수 함수, `lib/company/`)

| 파일 | 역할 | 의존 |
|------|------|------|
| `lib/company/data.ts` | 마스터 데이터 (제품3·인박스3·아웃박스2·파렛트5·용량표) | — |
| `lib/company/innerbox.ts` | 엔진① 인박스 분해 | data |
| `lib/company/outerbox.ts` | 엔진② 박스 조합 (FFD 패킹) | data |
| `lib/company/pallet.ts` | 엔진③ 파렛트 적재 | data |
| `lib/company/weight.ts` | 엔진④ 무게 계산 | data |
| `lib/company/simulate.ts` | 통합 오케스트레이터 (①→②→③→④ 호출) | 위 전부 |
| `lib/company/tiles.ts` | 6타일 데이터 (1 active + 5 coming-soon) | — |

> 회사 계산은 전부 로컬 순수 함수. Python 서버·외부 호출 없음(주식과 다름).

### 5.2 프론트엔드 — 화면 (`components/company/`, `app/company/`)

| 파일 | 역할 | 종류 |
|------|------|------|
| `components/company/CompanyTile.tsx` | 타일 카드 (active/coming-soon) | Server |
| `app/company/page.tsx` | 목록 (6타일 그리드) — 기존 placeholder 교체 | Server |
| `components/company/CompanyParams.tsx` | 좌측 입력 패널 (제품 추가·파렛트 선택·실행) | Client |
| `components/company/BoxSvg.tsx` | 인박스/아웃박스/택배박스 그림 | — |
| `components/company/CompanyPalletSvg.tsx` | 파렛트 적재 형상 그림 | — |
| `components/company/CompanyResult.tsx` | 우측 결과 (박스 그림+텍스트 → 파렛트 그림+텍스트) | Client |
| `app/company/[id]/page.tsx` | 2패널 통합 — 기존 placeholder 교체 | Client |

> **`CompanyTile.tsx`는 주식 `SimTile.tsx`를 건드리지 않기 위해 별도 복제**(거의 동일, company 타입 참조). 기존 파일 수정 회피.
> **파렛트 그림은 홈 장식용 `components/svg/PalletSvg.tsx`와 용도가 달라 별도 작성**(`CompanyPalletSvg`).

### 5.3 타입

| 파일 | 처리 |
|------|------|
| `types/company.ts` | 4.2 새 타입으로 교체 ✅ (승인됨, import 영향 없음 재확인 후) |

---

## 6. 디자인 토큰 (기존 준수 — 인라인 스타일만)

기존 주식 화면과 동일 규칙 사용(변경 금지):

- 폰트: `var(--font-cormorant)` serif / `var(--font-manrope)` sans / `var(--font-jetbrains-mono)` mono
- 색상: 금색 `#C9A86A`, 텍스트 `#E8E0D2`, 보조 텍스트 `#9C9486`, 헤더라벨 `#8c7a55`
- 강조 수치: `#DCC08A`(큰 숫자), `#8FBFA0`(보조 통계)
- 배경 그라데이션: `linear-gradient(180deg,#1a1510,#15110d)`
- 테두리: `rgba(201,168,106,0.15)`, `borderRadius: 2px`
- 적재율 바: `linear-gradient(90deg,#8FBFA0,#C9A86A)`
- CSS 클래스 사용 금지, 전부 인라인 스타일.

---

## 7. 단계별 구현 체크리스트

> 각 단계마다 `npx tsc --noEmit`로 새 타입 오류가 없는지 확인하며 진행.

### Step 1-A — 데이터 & 타입 기반
- [ ] `types/company.ts` 새 타입으로 교체 (승인됨 ✅ — 착수 시 import 영향 없음만 재확인)
- [ ] `lib/company/data.ts` 마스터 데이터 작성
- [ ] `lib/company/tiles.ts` 6타일 데이터 작성
- [ ] `npx tsc --noEmit` 통과

### Step 1-B — 계산 엔진 4종 (백엔드)
- [ ] `lib/company/innerbox.ts` (엔진①)
- [ ] `lib/company/outerbox.ts` (엔진②)
- [ ] `lib/company/pallet.ts` (엔진③)
- [ ] `lib/company/weight.ts` (엔진④)
- [ ] `lib/company/simulate.ts` (통합)
- [ ] 검증 로그(9장) 작성 → 사용자 예시 전부 통과 확인
- [ ] `npx tsc --noEmit` 통과

### Step 1-C — 목록 화면
- [ ] `components/company/CompanyTile.tsx`
- [ ] `app/company/page.tsx` (6타일 그리드)
- [ ] `npx tsc --noEmit` 통과

### Step 1-D — 시각화(SVG)
- [ ] `components/company/BoxSvg.tsx` (인박스/아웃박스/택배박스)
- [ ] `components/company/CompanyPalletSvg.tsx` (파렛트 적재)
- [ ] `npx tsc --noEmit` 통과

### Step 1-E — 실행 화면
- [ ] `components/company/CompanyParams.tsx` (입력 패널, 제품 추가)
- [ ] `components/company/CompanyResult.tsx` (결과)
- [ ] `app/company/[id]/page.tsx` (2패널 통합)
- [ ] `npx tsc --noEmit` 통과

### Step 1-F — 검증 & 문서
- [ ] 로컬 클론 + `npm install` + `npx tsc --noEmit` 통과
- [ ] `npm run build` 통과
- [ ] 검증 로그 마크다운 문서 작성 (다운로드 제공)
- [ ] `docs/PROGRESS.md` / `docs/MASTER.md` Phase 5 Step 1 완료 처리
- [ ] GitHub push (배치 4~6 파일)

---

## 8. 검증 계획

### 8.1 엔진 단위 검증 (사용자 예시 = 테스트 케이스)

별도 검증 스크립트로 아래를 실행해 기대값과 일치하는지 마크다운 로그로 남긴다.

| # | 입력 | 기대 결과 |
|---|------|-----------|
| 1 | 40×300 ×30 | 낱개 145×1 |
| 2 | 40×300 ×120 | 아웃박스 1 (꽉) |
| 3 | 110×300 ×60 | 아웃박스 1 + 택배박스 1 |
| 4 | 110×300 ×50 | 아웃박스 1 + 낱개 145×1 |
| 5 | 110×50 + 60×30 | 아웃박스 2, 인박스 145×6 + 95×1 |
| 6 | 110×300 ×20 | 택배박스 1 |
| 7 | 110×10 + 40×20 | 택배박스 1 (145×1 + 95×1) |
| 8 | 60×300 ×23 | 145×1 + 95×1 |
| 9 | 60×300 ×31 | 145×2 |
| 10 | 아웃박스 10 + 700파렛트 | 1파렛트, 3층(마지막 층 2개) |

### 8.2 타입/빌드 검증
- 각 Step 종료 시 `npx tsc --noEmit` (신규 오류 0).
- 최종 `npm run build` 통과(폰트 스텁 로컬).

### 8.3 브라우저 흐름 검증 (사용자)
- `/company` → 활성 타일만 클릭 가능, 5개 준비 중.
- `/company/box-pallet` → 제품 추가·파렛트 선택·실행 → 박스 그림 + 파렛트 그림 표시.

---

## 9. 보존 목록 (절대 건드리지 않음)

- 홈/레이아웃/주식 시뮬레이션 전체 (`app/page.tsx`, `app/stock/**`, `components/stock/**`, `components/home/**`, `components/layout/**`)
- `lib/stock/**`, `lib/svg/**`, `lib/supabase/**`, `types/backtest.ts`, `types/stock.ts`, `types/database.ts`
- Python 서버 (`python/**`), 배포 설정
- Supabase 18개 테이블 (특히 리본/라벨 사업 15개 — 절대 접근 금지)
- 주식 `SimTile.tsx`, `components/svg/PalletSvg.tsx` (회사용은 별도 신규)

신규/교체 대상: `lib/company/**`, `components/company/**`, `app/company/**`, `types/company.ts`(교체).

---

## 10. 결정 완료 항목 (전 항목 확정)

착수 전 확인이 필요했던 5가지는 모두 아래와 같이 확정되었다.

1. **활성 카드 표시명** — 축약 "박스·파렛트 적재 시뮬레이션" 사용. ✅
2. **`types/company.ts` 교체** — placeholder를 새 타입으로 덮어쓰기 승인. 착수 시 import 영향 없음만 재확인. ✅
3. **잔여 인박스가 박스 1개를 초과하는 복합 케이스** — "택배 우선 → 안 되면 아웃박스"를 반복 적용하는 그리디로 처리. ✅
4. **무게 placeholder** — 60인박스·택배박스 tare를 0kg로 두고 "(일부 무게 미반영)" 표시. ✅
5. **입력 방식** — 제품은 사이즈/미터/수량 **직접 입력**, 매핑 없는 사이즈는 "지원하지 않는 제품" 안내. ✅

→ 모든 규칙이 확정되었으므로, 새 세션은 추가 질문 없이 **7장 체크리스트 순서대로 바로 구현에 착수**한다.

---

## 11. 추후 (Phase 6 이후)

- 하드코딩 마스터 데이터 → Supabase(`pallet_types`, `inner_box_types`, `outer_box_types`) 연동.
- `/api/pallets`, `/api/products` API Route 구현 (서버 경유, service role key 보호).
- DB에 `per_layer` 등 누락 컬럼 추가(현 하드코딩 구조 = DB 스키마 초안).
- 60인박스·택배박스 정확 무게 입력.
- 나머지 5개 카드 시뮬레이션 설계·구현.
- 제품 목록 전체 확장.

---

*문서 끝 — 검토 후 코딩 명령을 주시면 Step 1-A부터 착수합니다.*
