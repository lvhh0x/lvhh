# FE-04 — 주식 시뮬레이션 실행 (Stock Run)
> **상태: 🔴 미시작** | Phase 4
> 의존: FE-01, FE-07 (LineSvg, CandleSvg), LIB-01 (computeStock)

---

## 역할

`/stock/[id]`. 파라미터 조정 후 시뮬레이션 실행 → 결과 리포트 표시.

---

## 상태 타입

```typescript
interface StockParams {
  capital: number    // 초기 자본금 (default: 10,000,000)
  months: number     // 투자 기간 3–36 (default: 12)
  intensity: number  // 전략 강도 1–10 (default: 6)
  stop: number       // 손절 2–20 (default: 8)
  take: number       // 익절 5–50 (default: 20)
}

interface StockResult {
  vals: number[]
  finalRet: number
  mdd: number
  trades: number
  winRate: number
  sharpe: string
  finalCapital: number
  seed: number
}
```

---

## StockParams 컴포넌트

HTML 원본 구조 (line 190–216, 변경 금지):
```
340px, border, padding:26px 24px, card gradient
├── 초기 자본금: number input (step:1000000)
├── 투자 기간: range 3–36
├── 전략 강도: range 1–10 (Lv.N 표시)
├── 손절/익절: 2열 grid (range)
└── [▶ 실행] 버튼: background #C9A86A
```

---

## StockResult 컴포넌트

HTML 원본 3가지 상태 (line 218–257, 변경 금지):

**로딩**: 스피너 + "백테스트 연산 중…"

**대기**: "파라미터를 설정하고 실행하세요" (Cormorant Garamond, italic)

**결과**:
```
├── 충 수익률: Cormorant Garamond 68px
├── 최종 평가자산: JetBrains Mono 22px
├── srChart: LineSvg (area, w:720, h:210)
├── 4-column 통계 그리드 (실군 수익자산 / MDD / 승률 / 거래횟수)
└── srCandles: CandleSvg (30개)
```

---

## 실행 흐름

```
[▶ 실행] 클릭
  → running = true
  → setTimeout 950ms
  → computeStock(sp, stock) 호출
  → running = false, stockResult = 결과
```

---

## 구조

```typescript
// app/stock/[id]/page.tsx — Server Component
// → params.id로 STOCK_SIMS 찾기
// → StockRunner (Client Component)에 전달
```

## 의존: FE-01, FE-07, LIB-01, types/stock.ts