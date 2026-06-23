# FE-06 — 회사 시뮬레이션 실행 (Company Run)
> **상태: 🔴 미시작** | Phase 5
> 의존: FE-01, FE-07 (PalletSvg), LIB-01, BE-02, BE-03

---

## 역할

`/company/[id]`. 제품/팔레트 입력 → 계산 → 결과 표시.

---

## 데이터 타입

```typescript
export interface Product { id: number; name: string; perBox: number; }
export interface PalletType { id: number; name: string; perLayer: number; }

export interface CompanyParams {
  product: number; qty: number; perBox: number
  pallet: number; tiers: number
}

export interface CompanyResult {
  totalBoxes: number; palletCap: number
  palletsNeeded: number; util: number
  filled: number; perLayer: number; tiers: number
}
```

---

## 하드코딩 데이터 (현재, Phase 6에서 DB 교체)

```typescript
export const PRODUCTS: Product[] = [
  { id:0, name:'생수 500ml (PET)', perBox:24 },
  { id:1, name:'라면 멀티팩',       perBox:12 },
  { id:2, name:'음료 캔 250ml',    perBox:30 },
  { id:3, name:'세제 1L',          perBox:8  },
  { id:4, name:'과자 박스',         perBox:20 },
];

export const PALLETS: PalletType[] = [
  { id:0, name:'T11 표준 (1100×1100)', perLayer:8 },
  { id:1, name:'EUR1 유로 (1200×800)', perLayer:7 },
  { id:2, name:'T12 (1200×1000)',      perLayer:9 },
];
// Phase 6에서 PALLETS → Supabase pallet_types 교체
```

---

## CompanyParams HTML 원본 (line 291–318, 변경 금지)

```
340px 수직 패널
├── 제품 선택 select → perBox 자동 갱신
├── 제품 수량 number input (step:100)
├── 박스당 입수 number input
├── 팔레트 규격 select
├── 적재 단수 range 1–10
└── [▶ 실행] #C9A86A 버튼
```

---

## CompanyResult HTML 원본 (line 321–370, 변경 금지)

**결과 상태**:
```
├── 충 박스 수: Cormorant Garamond 68px, #DCC08A
├── 필요 팔레트: JetBrains Mono 34px, #8FBFA0
├── 2열: PalletSvg + 2×2 통계 그리드
└── 적재율 바: linear-gradient(90deg,#8FBFA0,#C9A86A)
```

---

## 실행 흐름

```
[▶ 실행] → running = true → setTimeout 850ms
→ computeCompany(cp, pallets) → PalletSvg 표시
```

## 의존: FE-01, FE-07, LIB-01, BE-02, BE-03, types/company.ts