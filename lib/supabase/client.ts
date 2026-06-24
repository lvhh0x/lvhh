// 브라우저용 Supabase 클라이언트
// 현재 설계에서는 미사용. 향후 실시간 기능 추가 시 사용.
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
