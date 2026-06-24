// Seed-based PRNG (Mulberry32 variant)
export function rng(seed: number): () => number {
  let a = (seed >>> 0) || 1;
  return (): number => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Portfolio price walk simulation
export function walk(n: number, seed: number, drift: number, vol: number): number[] {
  const r = rng(seed);
  let v = 100;
  const arr: number[] = [v];
  for (let i = 0; i < n; i++) {
    v *= (1 + drift / 100 / n + (r() - 0.5) * vol / 100 / 3);
    if (v < 5) v = 5;
    arr.push(v);
  }
  return arr;
}

export const COLORS = {
  GOLD: '#C9A86A',
  GOLDB: '#DCC08A',
  UP: '#8FBFA0',
  DOWN: '#C77B66',
} as const;
