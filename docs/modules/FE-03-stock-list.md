# FE-03 — 주식 목록 (Stock List)
> **상태: 🔴 미시작** | Phase 4
> 의존: FE-01 (InnerHeader), FE-07 (LineSvg), BE-01 (API)

---

## 역할

`/stock` 경로. 6개 종목 전략 카드 3열 그리드. 클릭 → `/stock/[id]`.

---

## 타입

```typescript
// types/stock.ts
export interface StockSim {
  id: string       // 'c1' 등
  ticker: string   // '005930'
  name: string     // '삼성전자 모멘텀 추세'
  tag: string      // '추세추종'
  seed: number
  bias: number     // 드리프트
  vol: number      // 변동성
  color: string    // 스파크라인 색상
}
```

---

## 하드코딩 데이터 (현재)

```typescript
// BE-01 DB 연동 전까지 클라이언트에서 사용
export const STOCK_SIMS: StockSim[] = [
  { id:'s1', ticker:'005930', name:'삼성전자 모멘텀 추세',  tag:'추세추종',   seed:11, bias:7,  vol:16, color:'#8FBFA0' },
  { id:'s2', ticker:'NVDA',   name:'엔비디아 변동성 돌파',  tag:'변동성 돌파', seed:23, bias:15, vol:34, color:'#C9A86A' },
  { id:'s3', ticker:'BTC',    name:'비트코인 그리드 매매',  tag:'그리드',     seed:31, bias:9,  vol:42, color:'#C9A86A' },
  { id:'s4', ticker:'TSLA',   name:'테슬라 평균회귀',      tag:'평균회귀',   seed:42, bias:-3, vol:38, color:'#C77B66' },
  { id:'s5', ticker:'AAPL',   name:'애플 분할매수 DCA',    tag:'적립식',     seed:53, bias:6,  vol:13, color:'#8FBFA0' },
  { id:'s6', ticker:'035720', name:'카카오 역추세 스윈',   tag:'스윈',       seed:64, bias:2,  vol:26, color:'#8FBFA0' },
];
```

---

## StockCard 컴포넌트

HTML 원본 구조 (line 161–178, 변경 금지):
```
border:1px solid rgba(201,168,106,.2), border-radius:6px
background: linear-gradient(180deg,#1a1510,#15110d)
hover: translateY(-4px), border-color rgba(201,168,106,.55)
├── 상단: ticker(JetBrains Mono 12px) + name(17px 700)
└── 하단: 수익률(JetBrains Mono 21px) + spark SVG
```

---

## 페이지 헤더 (line 156–158, 변경 금지)

```
"01 / TRADING SIMULATION" — JetBrains Mono 12px #8c7a55
"종목별 전략 라이브러리" — Cormorant Garamond 48px
"전략" → italic #C9A86A
```

---

## 스파크라인 계산

```typescript
const vals = walk(60, seed * 13 + 50, bias + 8, vol);
const ret = vals[vals.length - 1] - 100;
const spark = <LineSvg vals={vals} w={110} h={30} color={color} area={false} sw={1.5} />;
```

---

## API 연결

현재: STOCK_SIMS 하드코딩
나중 (Phase 6+): `GET /api/stocks` 응답으로 교체

## 의존: FE-01, FE-07, types/stock.ts