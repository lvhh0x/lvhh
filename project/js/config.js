// ─────────────────────────────────────────────
//  Supabase 연결 설정
//  아래 두 값을 채워 넣으세요:
//  Supabase 대시보드 → Settings → API
// ─────────────────────────────────────────────

const SUPABASE_URL = 'https://lnnxjwfvzaelsoupozke.supabase.co/rest/v1/';
// 예시: 'https://abcdefghijklmn.supabase.co'

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxubnhqd2Z2emFlbHNvdXBvemtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDEyMDksImV4cCI6MjA5NzI3NzIwOX0.HA7r4fuJNsswk6g--vMif8X9o_CUHfJ1AxbNzP7HQQY';
// 예시: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
