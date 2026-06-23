# LIB-01 — 시뮬레이션 연산 엔진
> **상태: 🔴 미시작** | Phase 4(주식), Phase 5(회사)

## 역할

HTML의 `computeStock()`, `computeCompany()`를 TypeScript 순수 함수로 이전.

```
lib/simulation/stock.ts
lib/simulation/company.ts
```

---

## lib/simulation/stock.ts

```typescript
import { rng, walk } from '@/lib/svg/generators';
import type { StockSim, StockParams, StockResult } from '@/types/stock';

export function fmtPct(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
}

export function fmtWon(n: number): string {
  return '₩' + Math.round(n).toLocaleString('ko-KR');
}

export function computeStock(params: StockParams, sim: StockSim): StockResult {
  const { capital, months, intensity, stop, take } = params;
  const pts = months * 20;
  const r = rng(sim.seed * 7 + months);
  let v = 100;
  const vals: number[] = [v];
  let inTrade = false, entry = v, trades = 0, wins = 0;

  for (let i = 0; i < pts; i++) {
    const daily = (r() - 0.5) * sim.vol / 100 / 3 + sim.bias / 100 / pts;
    v *= (1 + daily * (intensity / 5));
    if (!inTrade && r() < 0.05 * intensity) { inTrade = true; entry = v; }
    if (inTrade) {
      const chg = (v - entry) / entry * 100;
      if (chg <= -stop || chg >= take) {
        if (chg >= take) wins++;
        trades++; inTrade = false; v = Math.max(v, 5);
      }
    }
    if (v < 5) v = 5;
    vals.push(v);
  }

  const finalRet = vals[vals.length - 1] - 100;
  let peak = 100, mdd = 0;
  for (const pt of vals) {
    if (pt > peak) peak = pt;
    const dd = (peak - pt) / peak * 100;
    if (dd > mdd) mdd = dd;
  }
  const diffs = vals.slice(1).map((v, i) => (v - vals[i]) / vals[i]);
  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const std = Math.sqrt(diffs.reduce((a, b) => a + (b - mean) ** 2, 0) / diffs.length);
  const sharpe = std > 0 ? (mean / std * Math.sqrt(252)).toFixed(2) : '0.00';

  return { vals, finalRet, mdd, trades: trades || 1,
    winRate: trades > 0 ? wins / trades * 100 : 0,
    sharpe, finalCapital: capital * (1 + finalRet / 100), seed: sim.seed };
}
```

---

## lib/simulation/company.ts

```typescript
import type { CompanyParams, CompanyResult, PalletType } from '@/types/company';

export function computeCompany(params: CompanyParams, pallets: PalletType[]): CompanyResult {
  const { qty, perBox, pallet: palletId, tiers } = params;
  const selectedPallet = pallets.find(p => p.id === palletId) ?? pallets[0];
  const perLayer = selectedPallet.perLayer;
  const palletCap = perLayer * tiers;
  const totalBoxes = Math.ceil(qty / perBox);
  const palletsNeeded = Math.ceil(totalBoxes / palletCap);
  const rem = totalBoxes % palletCap;
  const filled = rem === 0 ? palletCap : rem;
  const util = (totalBoxes / (palletsNeeded * palletCap)) * 100;
  return { totalBoxes, palletCap, palletsNeeded, util, filled, perLayer, tiers };
}
```

---

## 구현 순서
1. lib/svg/generators.ts (rng, walk) 먼저
2. lib/simulation/stock.ts
3. lib/simulation/company.ts
4. npx tsc --noEmit