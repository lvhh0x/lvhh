// 서버 전용 Supabase 클라이언트
// API Routes / Server Component 에서 사용. 클라이언트 노출 절대 금지.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function createServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
