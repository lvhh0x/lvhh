# FE-01 — 레이아웃 (Layout)
> **상태: 🔴 미시작** | Phase 2에서 구현
> 의존: LIB-02 (Supabase 클라이언트 설정 먼저 완료)

---

## 역할

모든 페이지의 공통 별대. 내부 페이지용 스티키 헤더, 홈 화면 마켓 티커, 폰트 설정을 담당.

---

## HTML 원본 매핑

| 컴포넌트 | HTML 위치 | 조건 |
|----------|-----------|------|
| `InnerHeader` | line 31–48 | `isInner` (홈이 아닌 모든 페이지) |
| `Ticker` | line 54–60 | `isHome`일 때만 |
| `app/layout.tsx` | line 11–26 | 전역 |

---

## 파일 위치

```
app/layout.tsx
components/layout/InnerHeader.tsx
components/layout/Ticker.tsx
```

---

## 1. `app/layout.tsx`

구글 폰트 import + 글로벌 CSS

```css
/* HTML 원본 스타일 (같은 내용 유지) */
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #14110E; }
::selection { background: #C9A86A; color: #14110E; }
@keyframes marq { from { transform: translateX(0) } to { transform: translateX(-50%) } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes spin { to { transform: rotate(360deg) } }
input[type=range] { -webkit-appearance: none; height: 2px; border-radius: 2px; background: rgba(201,168,106,.28); }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width:14px; height:14px; border-radius:50%; background:#14110E; border:2px solid #C9A86A; cursor:pointer; }
select, input { font-family: 'JetBrains Mono', monospace; }
```

폰트 import URL:
```
https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap
```

---

## 2. `components/layout/InnerHeader.tsx`

```typescript
interface InnerHeaderProps {
  backLabel: string   // 예: "홈", "전략 목록"
  backHref: string    // 예: "/", "/stock"
  crumbA: string      // 예: "주식 시뮬레이션"
  crumbB: string      // 예: "삼성전자 모멘텀 추세"
}
```

**HTML 원본 구조** (line 32–48, 변경 금지):
```
sticky div (position:sticky, top:0, z-index:30)
├── backdrop: rgba(20,17,14,0.86), blur(12px)
├── border-bottom: 1px solid rgba(201,168,106,.2)
└── inner (max-width:1180px, padding:17px 32px, flex)
    ├── 로고: "M. MERIDIAN" → href="/"
    ├── 구분선 (1px, height:16px)
    ├── ← [backLabel] → href={backHref}
    ├── flex: 1 (빈 공간)
    └── 브레드크럼: {crumbA} / {crumbB}
```

| 페이지 | backLabel | backHref | crumbA | crumbB |
|--------|-----------|----------|--------|--------|
| /stock | 홈 | / | 주식 시뮬레이션 | 전략 라이브러리 |
| /company | 홈 | / | 회사 시뮬레이션 | 운영 도구 |
| /stock/[id] | 전략 목록 | /stock | 주식 시뮬레이션 | {stock.name} |
| /company/[id] | 도구 목록 | /company | 회사 시뮬레이션 | {company.name} |

---

## 3. `components/layout/Ticker.tsx`

Props 없음. 하드코딩 데이터 유지.

```typescript
const TICKER_ITEMS = [
  { sym:'KOSPI',  px:'2,841.20', d: 0.62 },
  { sym:'KOSDAQ', px:'870.4',    d:-0.91 },
  { sym:'S&P500', px:'5,930',    d: 0.18 },
  { sym:'NASDAQ', px:'19,210',   d: 0.74 },
  { sym:'BTC',    px:'₩98.2M',   d: 2.41 },
  { sym:'ETH',    px:'₩5.1M',    d: 1.22 },
  { sym:'NVDA',   px:'1,210',    d: 3.08 },
  { sym:'TSLA',   px:'412',      d: 1.84 },
  { sym:'005930', px:'78,400',   d:-0.43 },
  { sym:'AAPL',   px:'231',      d: 0.55 },
] as const;
```

HTML 원본 구조 (line 54–60, 변경 금지):
```
overflow:hidden, border-bottom:1px solid rgba(201,168,106,.16)
└── animation: marq 40s linear infinite
    └── TICKER_ITEMS × 2 반복 (무한 스크롤)
        sym(#7a7264) | px(#cabfa8) | chg(상승#8FBFA0 하락#C77B66)
```

---

## 라우팅

```
/           → app/page.tsx        (홈, InnerHeader 없음)
/stock      → app/stock/page.tsx  (InnerHeader 있음)
/stock/[id] → app/stock/[id]/page.tsx
/company    → app/company/page.tsx
/company/[id] → app/company/[id]/page.tsx
```

## 의존 모듈: 없음 (가장 기반 모듈)

## 구현 순서
1. app/layout.tsx — 폰트 + 글로벌 스타일
2. components/layout/Ticker.tsx
3. components/layout/InnerHeader.tsx
4. app/stock/, app/company/ 폴더 구조 생성
5. npx tsc --noEmit 확인