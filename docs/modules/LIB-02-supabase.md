# LIB-02 — Supabase 클라이언트 설정
> **상태: 🔴 미시작** | Phase 1–2 (가장 먼저)

## 역할

Next.js App Router에서 Supabase 클라이언트 설정.

```
npm install @supabase/supabase-js @supabase/ssr
```

```
lib/supabase/client.ts    ← Client Component용
lib/supabase/server.ts    ← API Routes / Server Component용
types/database.ts         ← DB 타입 정의
```

---

## lib/supabase/server.ts

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function createServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // 클라이언트 노출 절대 금지
  );
}
```

---

## lib/supabase/client.ts

```typescript
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
// 현재 설계에서는 사용안함. 나중 실시간 기능 주가 시 사용
```

---

## types/database.ts

```typescript
export type Database = {
  public: {
    Tables: {
      pallet_types: {
        Row: { id: number; name: string | null; length_mm: number | null; width_mm: number | null; height_mm: number | null; weight_kg: number | null; created_at: string | null; }
        Insert: Omit<Database['public']['Tables']['pallet_types']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['pallet_types']['Insert']>
      }
      outer_box_types: {
        Row: { id: number; name: string | null; length_mm: number | null; width_mm: number | null; height_mm: number | null; weight_kg: number | null; created_at: string | null; }
        Insert: Omit<Database['public']['Tables']['outer_box_types']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['outer_box_types']['Insert']>
      }
      inner_box_types: {
        Row: { id: number; name: string | null; dimensions_label: string | null; created_at: string | null; }
        Insert: Omit<Database['public']['Tables']['inner_box_types']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['inner_box_types']['Insert']>
      }
    }
  }
}
```

---

## .env.local 체크리스트

```bash
NEXT_PUBLIC_SUPABASE_URL=https://lnnxjwfvzaelsoupozke.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

Vercel 대시보드에도 동일하게 설정 필요.

## 구현 순서
1. 패키지 설치
2. types/database.ts
3. lib/supabase/server.ts
4. lib/supabase/client.ts
5. /api/pallets 연결 테스트
6. npx tsc --noEmit