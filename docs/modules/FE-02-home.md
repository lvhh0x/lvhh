# FE-02 — 홈 페이지 (Home)
> **상태: 🔴 미시작** | Phase 3에서 구현
> 의존: FE-01 (레이아웃), FE-07 (SVG 엔진)

---

## 역할

`/` 경로 메인 홈. 터커, 현 상단 바, 히어로, 진입 타일, 주요 전략 3개, KPI 밴드, 인용구로 구성.

---

## HTML 원본 매핑

| 컴포넌트 | HTML | 설명 |
|----------|------|---------|
| Ticker | line 54–60 | FE-01에서 관리 |
| TopBar (인라인) | line 63–75 | 로고 + 네비게이션 (홈 전용) |
| HeroSection | line 78–87 | 히어로 헤드라인 + 커브 SVG |
| EntryTiles | line 90–105 | 주식/회사 2칸 진입 카드 |
| FeaturedStrategies | line 108–130 | 주요 전략 3개 |
| StatsBand | line 133–142 | KPI 4개 |
| QuoteFooter | line 144–150 | 인용구 + 푸터 |

---

## 컴포넌트 명세

### HeroSection

```typescript
interface HeroSectionProps {
  heroCurve: React.ReactNode  // LineSvg(walk(56,7,30,16), 620, 150, GOLD, false, 2)
}
```

HTML 구조 (line 78–87, 변경 금지):
```
max-width:1180px, padding:46px 32px 30px, text-align:center
├── 태그라인: "QUANTITATIVE & OPERATIONAL SIMULATION" (11px, #8c7a55)
├── h1: "절제된 정밀함으로 수익을 설계하다"
│     Cormorant Garamond, 500, 64px
│     "정밀함" → italic, #C9A86A
└── heroCurve (max-width:620px, opacity:.9)
```

### EntryTiles

```typescript
interface EntryTilesProps {
  heroCurveSm: React.ReactNode  // LineSvg(walk(46,7,28,16), 360, 70, GOLD, false, 1.8)
  heroPallet: React.ReactNode   // PalletSvg(8, 5, 32, true)
}
```

HTML 구조 (line 90–105, 변경 금지):
```
2-column grid (gap:24px)
├── 주식 카드 → /stock
└── 회사 카드 → /company
```

### FeaturedStrategies

```typescript
interface FeaturedCard {
  id: string; ticker: string; name: string; tag: string
  retStr: string; retColor: string; spark: React.ReactNode
}
```

stockSims 첫 3개 (삼성전자 / 엔비디아 / 비트코인)

### StatsBand 데이터 (하드코딩)

```typescript
const KPI_DATA = [
  { value: '+18.4%', label: '평균 수익률' },
  { value: '6',      label: '주식 전략' },
  { value: '3',      label: '운영 도구' },
  { value: '92.6%',  label: '평균 적재율' },
];
```

레이아웃: 4-column grid, border-top/bottom gold

### QuoteFooter (line 144–150, 변경 금지)

```
인용구: "규율은 기술보다 더 큰 수익을 만든다."
        Cormorant Garamond, italic, 32px, #cabfa8
저작권: "© 2026 MERIDIAN · PRIVATE SIMULATION DESK"
```

---

## SVG 의존성

| SVG | 파라미터 | 용도 |
|-----|----------|---------|
| lineSvg | walk(56,7,30,16), 620, 150, GOLD, false, 2 | 히어로 커브 |
| lineSvg | walk(46,7,28,16), 360, 70, GOLD, false, 1.8 | 주식 진입 카드 |
| palletSvg | 8, 5, 32, true | 회사 진입 카드 |
| lineSvg | walk(60,seed*13+50,bias+8,vol) | featured 스파크라인 |

---

## 의존 모듈
- FE-01 (Ticker), FE-07 (SVG 엔진), types/stock.ts