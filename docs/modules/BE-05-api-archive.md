# BE-05 — API: 자료실 (`/api/archive`)
> **상태: ✅ 완료** | 2026-07-14 (세션: 홈페이지)
> Applied Guides: DB.md

---

## 역할

`archive_files` 테이블을 조회해 Storage 공개 URL을 붙여 목록을 내려준다.

```
GET /api/archive → ArchiveFile[]
  { id, title, description, fileName, sizeBytes, downloadUrl, createdAt }
```

정렬: `sort_order` 오름차순 → 같으면 `created_at` 최신순.
`export const dynamic = 'force-dynamic'` — 자료를 올리자마자 보여야 하므로 캐싱하지 않는다.

---

## 핵심 계약

### 업로드 경로는 없다 (의도적)
파일은 **관리자가 Supabase 대시보드에서 직접** 올린다. 웹 업로드 UI를 만들지 않았으므로
인증도 필요 없고, 사이트는 "로그인 없는 공개 사이트"로 남는다 (사용자 결정 2026-07-14).

이 API는 **읽기 전용**이다. POST/PUT/DELETE 를 추가하는 순간 인증 설계가 먼저 필요해진다.

### downloadUrl 은 DB 컬럼이 아니다
`supabase.storage.from('archive').getPublicUrl(path)` 로 서버가 만들어 붙인다.
URL 형태(`{SUPABASE_URL}/storage/v1/object/public/...`)를 직접 조립하지 않는다 —
환경값 하드코딩 금지(CODING NEVER 2).

### 자료 등록 절차 (운영)
1. 대시보드 → Storage → `archive` 버킷에 파일 업로드
2. `archive_files` 에 행 추가. `storage_path` = 버킷 내 경로, `title` = 화면에 보일 이름.
   `size_bytes`·`mime_type` 은 `storage.objects.metadata` 에서 그대로 가져오면 된다:
   ```sql
   SELECT name, metadata->>'size', metadata->>'mimetype'
   FROM storage.objects WHERE bucket_id = 'archive';
   ```

---

## 🔴 지뢰

- **공개 버킷이다.** 링크를 아는 사람은 누구나 받는다. 목록에 없어도 URL만 알면 받아진다.
  대외비 자료(단가표 등)를 올리려면 **비공개 버킷 + 인증**이 먼저다.
- `storage_path` 는 UNIQUE. 같은 경로로 두 번 등록되지 않는다.
- 파일만 올리고 `archive_files` 행을 안 넣으면 **화면에 안 보인다** (그 반대도 마찬가지 —
  행만 있고 파일이 없으면 다운로드가 404).

---

## 의존 모듈
- LIB-02 (supabase server client)
- types/archive.ts (ArchiveFile) · types/database.ts (ArchiveFileRow)
- 소비자: FE-08 (`app/archive/page.tsx`)
