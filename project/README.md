# 드롭다운 테스트 페이지 — 설정 가이드

---

## 1단계 — Supabase 테이블 & 데이터 생성

Supabase 대시보드 → 왼쪽 메뉴 **SQL Editor** → New query → 아래 SQL 전체 복사 후 **Run**

```sql
-- size 테이블 생성 + 데이터 삽입
CREATE TABLE IF NOT EXISTS size (
  id    SERIAL  PRIMARY KEY,
  value INTEGER NOT NULL
);
INSERT INTO size (value) VALUES (40), (50), (60);

-- meter 테이블 생성 + 데이터 삽입
CREATE TABLE IF NOT EXISTS meter (
  id    SERIAL  PRIMARY KEY,
  value INTEGER NOT NULL
);
INSERT INTO meter (value) VALUES (300), (155);

-- 공개 읽기 정책 (로그인 없이 읽기 가능하도록)
ALTER TABLE size  ENABLE ROW LEVEL SECURITY;
ALTER TABLE meter ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON size  FOR SELECT USING (true);
CREATE POLICY "public_read" ON meter FOR SELECT USING (true);
```

---

## 2단계 — Supabase API 키 입력

`js/config.js` 파일을 열어서 아래 두 값을 채워 넣으세요.

```
Supabase 대시보드 → Settings → API 에서 복사
```

| 항목 | 위치 |
|------|------|
| SUPABASE_URL | Project URL |
| SUPABASE_ANON_KEY | anon public |

---

## 3단계 — GitHub 업로드

아래 4개 파일을 GitHub 저장소에 업로드합니다.

```
index.html
styles/main.css
js/config.js
js/app.js
```

GitHub 저장소 페이지 → **Add file** → **Upload files** → 파일 선택 → Commit changes

> 폴더 구조 유지가 중요합니다. styles/ 와 js/ 폴더도 함께 업로드하세요.

---

## 4단계 — Vercel 배포

1. vercel.com 접속 → 대시보드에서 **Add New Project** 클릭
2. GitHub 저장소 선택 → **Import**
3. Framework Preset: **Other** (프레임워크 없음)
4. **Deploy** 클릭
5. 배포 완료 후 자동 생성된 URL 접속

---

## 동작 확인

| 확인 항목 | 예상 결과 |
|----------|---------|
| 사이즈 드롭다운 | 40 / 50 / 60 |
| 미터 드롭다운 | 155 / 300 |
| 상태 메시지 | ✓ Supabase 연결 성공 |

> 오류 발생 시: 브라우저에서 F12 → Console 탭에서 오류 메시지 확인
