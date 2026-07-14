// 서버 전용 Supabase 클라이언트
// API Routes / Server Component 에서 사용. 클라이언트 노출 절대 금지.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function createServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      // supabase-js 의 GET fetch 를 Next.js Data Cache 가 저장해 어제 데이터를
      // 반환하는 사고 발생 (2026-07-14). 라우트의 dynamic = 'force-dynamic' 은
      // 라우트 캐시만 끄고 fetch 데이터 캐시는 못 막는다 — 항상 no-store 로 우회.
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      },
    },
  );
}
