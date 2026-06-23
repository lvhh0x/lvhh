# BE-02 — API: 팔레트 (/api/pallets)
> **상태: 🔴 미시작** | Phase 5 (DB 연동 포함)
> ⚠️ pallet_types 테이블에 `per_layer` 커럼 없음 — 쫐가 여부 사용자 확인 필요

## 역할

Supabase `pallet_types` 테이블에서 팔레트 목록 조회. DB와 첩 연결되는 첩 번째 엔드포인트.

```
app/api/pallets/route.ts
```

## Supabase pallet_types 실제 콜럼

```
id, name, length_mm, width_mm, height_mm, weight_kg, created_at
```

> `per_layer` 커럼 없음. 구현 전 사용자와 첨가 여부 확인.

## 응답 타입

```typescript
interface PalletType { id: number; name: string; perLayer: number; }
```

## 구현 (포로제: 하드코딩 perLayer 매핑)

```typescript
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { PalletType } from '@/types/company';

const PER_LAYER_MAP: Record<string, number> = { 'T11':8, 'EUR':7, 'T12':9 };

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('pallet_types')
    .select('id, name, length_mm, width_mm');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const pallets: PalletType[] = (data ?? []).map(row => ({
    id: row.id,
    name: row.name ?? '',
    perLayer: Object.entries(PER_LAYER_MAP).find(([k]) => row.name?.includes(k))?.[1] ?? 8,
  }));
  return NextResponse.json(pallets);
}
```

## per_layer 커럼 첨가 후

```typescript
const { data } = await supabase.from('pallet_types').select('id, name, per_layer');
// perLayer: row.per_layer
```

## 구현 전 체크리스트
- [ ] SELECT * FROM pallet_types 실제 데이터 확인
- [ ] per_layer 커럼 첨가 여부 사용자 결정
- [ ] RLS SELECT 공개 허용 (DB-02 참조)