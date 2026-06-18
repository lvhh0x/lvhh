// ─────────────────────────────────────────────
//  Supabase 연결 설정
//  아래 두 값을 채워 넣으세요:
//  Supabase 대시보드 → Settings → API
// ─────────────────────────────────────────────

const SUPABASE_URL = 'https://lnnxjwfvzaelsoupozke.supabase.co';
// 예시: 'https://abcdefghijklmn.supabase.co'

const SUPABASE_ANON_KEY = 'sb_publishable_wbM_HOtgpdx7QnRd-5slkA_YKQ-WeL7';
// 예시: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
