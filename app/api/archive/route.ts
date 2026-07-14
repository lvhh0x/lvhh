// BE-05 — 자료실 목록 API
// archive_files 를 조회해 Storage 공개 URL을 붙여 내려준다.
// 업로드 경로는 없다. 파일은 관리자가 Supabase 대시보드에서 직접 올린다
// (웹 업로드 UI 없음 = 인증 불필요 — 사용자 결정 2026-07-14).

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { ArchiveFile } from '@/types/archive';

// 자료를 올리자마자 보여야 한다. 캐싱하지 않는다.
export const dynamic = 'force-dynamic';

const BUCKET = 'archive';

export async function GET() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('archive_files')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: `DB 조회 실패: ${error.message}` }, { status: 500 });
  }

  const files: ArchiveFile[] = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    fileName: row.file_name,
    sizeBytes: row.size_bytes,
    // 공개 URL 형태를 직접 조립하지 않는다 (환경값 하드코딩 금지).
    downloadUrl: supabase.storage.from(BUCKET).getPublicUrl(row.storage_path).data.publicUrl,
    createdAt: row.created_at,
  }));

  return NextResponse.json(files);
}
