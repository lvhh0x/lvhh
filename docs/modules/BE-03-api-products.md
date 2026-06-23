# BE-03 — API: 제품 (/api/products)
> **상태: 🔴 미시작** | Phase 5

## 역할

`GET /api/products` — 회사 시뮬레이션 제품 목록. 현재 하드코딩, 나중 `simulation_products` 테이블.

```
app/api/products/route.ts
```

## 응답 타입

```typescript
interface Product { id: number; name: string; perBox: number; }
```

## 구현

```typescript
import { NextResponse } from 'next/server';
import type { Product } from '@/types/company';

const PRODUCTS: Product[] = [
  { id:0, name:'생수 500ml (PET)', perBox:24 },
  { id:1, name:'라면 멀티팩',       perBox:12 },
  { id:2, name:'음료 캔 250ml',    perBox:30 },
  { id:3, name:'세제 1L',          perBox:8  },
  { id:4, name:'과자 박스',         perBox:20 },
];

export async function GET() {
  return NextResponse.json(PRODUCTS);
}
```

## 나중 (simulation_products 테이블 생성 후)

```sql
CREATE TABLE simulation_products (
  id serial PRIMARY KEY,
  name text NOT NULL,
  per_box integer NOT NULL,
  created_at timestamptz DEFAULT now()
);
```