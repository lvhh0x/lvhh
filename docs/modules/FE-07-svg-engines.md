# FE-07 — SVG 엔진 (SVG Engines)
> **상태: ✅ 완료** | Phase 3
> 의존: 없음 (순수 함수)

---

## 역할

HTML SVG 생성 로직을 React 컴포넌트 + 순수 함수로 분리.

---

## 파일 위치

```
lib/svg/generators.ts      ← 순수 함수 (테스트 가능)
components/svg/LineSvg.tsx
components/svg/CandleSvg.tsx
components/svg/PalletSvg.tsx
components/svg/IconSvg.tsx
```

---

## lib/svg/generators.ts

### rng(seed) — 시드 기반 PRNG

```typescript
export function rng(seed: number): () => number {
  let a = (seed >>> 0) || 1;
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

### walk(n, seed, drift, vol) — 포트폴리오 시뮬레이션

```typescript
export function walk(n: number, seed: number, drift: number, vol: number): number[] {
  const r = rng(seed);
  let v = 100;
  const arr = [v];
  for (let i = 0; i < n; i++) {
    v *= (1 + drift / 100 / n + (r() - 0.5) * vol / 100 / 3);
    if (v < 5) v = 5;
    arr.push(v);
  }
  return arr;
}
```

---

## LineSvg Props

```typescript
interface LineSvgProps {
  vals: number[]; w: number; h: number
  color: string; area: boolean; sw: number
}
```

| 용도 | vals | w | h | area |
|------|------|---|---|------|
| 히어로 커브 | walk(56,7,30,16) | 620 | 150 | false |
| 진입카드 작은 | walk(46,7,28,16) | 360 | 70 | false |
| 스파크라인 | walk(60,seed*13+50,bias+8,vol) | 110 | 30 | false |
| 결과 라인 | computeStock().vals | 720 | 210 | true |

---

## CandleSvg Props

```typescript
interface CandleSvgProps { seed: number; n: number; }
// viewBox: "0 0 720 130"
// 상승:#8FBFA0 하락:#C77B66
```

---

## PalletSvg Props

```typescript
interface PalletSvgProps {
  perLayer: number; tiers: number
  filled: number; big: boolean  // true=150px, false=300px
}
// 체워진: fill #C9A86A stroke #DCC08A
// 빈 칸: fill transparent stroke #3a3026
```

---

## IconSvg Props

```typescript
interface IconSvgProps { kind: 'box' | 'container' | 'pallet' }
// 22×22px, stroke:#C9A86A, strokeWidth:1.5
```

---

## 색상 상수

```typescript
export const COLORS = {
  GOLD: '#C9A86A', GOLDB: '#DCC08A',
  UP: '#8FBFA0', DOWN: '#C77B66',
} as const;
```

## 구현 순서
1. lib/svg/generators.ts (rng, walk, COLORS)
2. LineSvg.tsx → CandleSvg.tsx → PalletSvg.tsx → IconSvg.tsx
3. npx tsc --noEmit