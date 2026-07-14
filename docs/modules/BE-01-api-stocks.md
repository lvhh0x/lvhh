# BE-01 — API: 주식 목록 (/api/stocks)
> **상태: ✅ 완료** | Phase 4 — ⚠️ 종목 목록(STOCK_CONFIGS)은 아직 하드코딩. DB 교체는 미착수

## 역할

`GET /api/stocks` — 주식 시뮬레이션 종목 목록 반환. 현재 하드코딩, 나중 Supabase `stock_simulations` 교체.

```
app/api/stocks/route.ts
```

## 응답 타입

```typescript
type StocksResponse = StockSim[];
// StockSim: { id, ticker, name, tag, seed, bias, vol, color }
```

## 구현 (현재 — 하드코딩)

```typescript
import { NextResponse } from 'next/server';
import type { StockSim } from '@/types/stock';

const STOCK_SIMS: StockSim[] = [
  { id:'s1', ticker:'005930', name:'삼성전자 모멘텀 추세',  tag:'추세추종',   seed:11, bias:7,  vol:16, color:'#8FBFA0' },
  { id:'s2', ticker:'NVDA',   name:'엔비디아 변동성 돌파',  tag:'변동성 돌파', seed:23, bias:15, vol:34, color:'#C9A86A' },
  { id:'s3', ticker:'BTC',    name:'비트코인 그리드 매매',  tag:'그리드',     seed:31, bias:9,  vol:42, color:'#C9A86A' },
  { id:'s4', ticker:'TSLA',   name:'테슬라 평균회귀',      tag:'평균회귀',   seed:42, bias:-3, vol:38, color:'#C77B66' },
  { id:'s5', ticker:'AAPL',   name:'애플 분할매수 DCA',    tag:'적립식',     seed:53, bias:6,  vol:13, color:'#8FBFA0' },
  { id:'s6', ticker:'035720', name:'카카오 역추세 스윈',   tag:'스윈',       seed:64, bias:2,  vol:26, color:'#8FBFA0' },
];

export async function GET() {
  return NextResponse.json(STOCK_SIMS);
}
```

## 프론트 호출

```typescript
const res = await fetch('/api/stocks', { cache: 'force-cache' });
const stocks: StockSim[] = await res.json();
```