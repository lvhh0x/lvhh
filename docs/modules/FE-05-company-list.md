# FE-05 — 회사 목록 (Company List)
> **상태: 🔴 미시작** | Phase 5
> 의존: FE-01 (InnerHeader), FE-07 (IconSvg)

---

## 역할

`/company`. 3개 회사 운영 시뮬레이션 도구 카드. 클릭 → `/company/[id]`.

---

## 데이터 타입

```typescript
export type CompanyIconType = 'pallet' | 'box' | 'container';

export interface CompanySim {
  id: string
  name: string
  tag: string
  icon: CompanyIconType
  desc: string
}
```

---

## 하드코딩 데이터

```typescript
export const COMPANY_SIMS: CompanySim[] = [
  { id:'c1', name:'팔레트 적재 시뮬레이터', tag:'물류 · 적재', icon:'pallet',    desc:'제품 수량을 입력하면 박스 수와 필요 팔레트, 적재률을 계산하고 적재 형상을 시각화합니다.' },
  { id:'c2', name:'박스 수량 환산기',       tag:'생산 · 포장', icon:'box',       desc:'제품 개수와 박스당 입수를 기준으로 총 박스 수와 단위 적재량을 산출합니다.' },
  { id:'c3', name:'콘테이너 적재 최적화',   tag:'수출 · 선적', icon:'container', desc:'팔레트 규격과 단수를 조합해 최대 적재 효율과 필요 매수를 탐색합니다.' },
];
```

---

## CompanyCard HTML 원본 (line 271–278, 변경 금지)

```
border:1px solid rgba(201,168,106,.2), padding:26px 24px
hover: translateY(-4px), border-color rgba(201,168,106,.55)
├── 아이콘 (48×48px, border-radius:10px)
├── tag: 10px 700 #C9A86A
├── name: Cormorant Garamond 23px 600
├── desc: 13px #9C9486
└── "실행하기 →" 13px 700 #C9A86A
```

---

## 페이지 헤더 (line 266–268, 변경 금지)

```
"02 / OPERATIONS SIMULATION" — JetBrains Mono 12px #8c7a55
"회사 운영 시뮬레이터" — Cormorant Garamond 48px
"시뮬레이터" italic #C9A86A
```

## 의존: FE-01, FE-07, types/company.ts