// FE-08 / BE-05 — 자료실 계약
// API(/api/archive)가 내려주고 화면이 그대로 표시하는 형태.
// downloadUrl 은 DB 컬럼이 아니라 서버가 Storage 공개 URL로 만들어 붙인다.

export interface ArchiveFile {
  id: number;
  title: string;
  description: string | null;
  fileName: string;
  sizeBytes: number | null;
  downloadUrl: string;
  createdAt: string;
}
