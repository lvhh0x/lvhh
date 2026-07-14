# FE-08 — 자료실 화면 (`/archive`) + 홈 MORE TOOLS (FE-09)
> **상태: ✅ 완료** | 2026-07-14 (세션: 홈페이지) — 실브라우저 + 실다운로드 검증 완료
> Applied Guides: UI.md

---

## 배경 — 왜 만들었나

홈의 "FEATURED STRATEGIES" 3카드(삼성전자·엔비디아·비트코인)가 `/stock/1·2·3` 으로
링크돼 있었는데 **그런 종목 id가 존재하지 않아 전부 죽은 링크**였다.
Phase 4.5에서 주식 라우팅을 티커 기반으로 재설계할 때 홈만 따라오지 않은 것.

고치는 대신 **그 자리를 새 기능으로 교체**했다 (사용자 결정 2026-07-14).

---

## FE-09 — 홈 MORE TOOLS 3칸

| 파일 | 역할 |
|------|------|
| `lib/home/tools.ts` | 3칸 단일 소스 (`TOOL_TILES`). 도구 추가 = 이 배열 수정으로 끝 |
| `components/home/ToolTile.tsx` | 타일 1장 |
| `components/home/MoreTools.tsx` | 섹션 (제목 `MORE TOOLS` + 3열 그리드) |

배치: **1번 준비중 · 2번 준비중 · 3번 자료실**(활성) — 사용자 지정.

시각 규격은 `components/stock/SimTile.tsx` 와 **동일하게 맞췄다** (새 디자인 토큰 없음).
- active: 금색 제목 + 우상단 `OPEN →` + hover 시 금색 테두리(`.sim-tile:hover`)
- coming-soon: `opacity: .45` + 클릭 불가 `div` + `준비 중` 뱃지

> ⚠️ `.sim-tile:hover` 규칙은 각 페이지가 자기 `<style>` 로 선언한다.
> 홈에도 그 한 줄을 넣어야 hover가 산다 (`app/page.tsx`).

---

## FE-08 — 자료실 화면

`app/archive/page.tsx` (Client Component). `/api/archive` 를 불러 목록을 렌더한다.

**렌더 4-상태** (UI.md MUST 3):
| 상태 | 화면 |
|------|------|
| loading | "불러오는 중…" |
| ok · 목록 있음 | 자료 카드 목록 (제목 / 설명 / `파일명 · 용량 · 날짜` / `다운로드 ↓`) |
| ok · 목록 0건 | "등록된 자료가 없습니다." (테두리 박스) |
| error | "자료 목록을 불러오지 못했습니다." + **[다시 시도]** 버튼 |

페이지 타이틀은 기존 규격을 따른다 — `03 / ARCHIVE` + 세리프 큰 제목(강조어만 이탤릭 금색).

다운로드는 `<a href={downloadUrl} download={fileName}>` — Storage 공개 URL 직링크다.
서버를 경유하지 않으므로 대용량도 부담이 없다.

---

## 검증 기록 (2026-07-14)
- 홈: MORE TOOLS 3칸 육안 확인 (준비중 2 dim + 자료실 `OPEN →`)
- `/archive`: 로딩 → 목록 1건 렌더. 한글 인코딩 정상
- 다운로드: 공개 URL 익명 요청 → **HTTP 200 · 17,989,840 bytes** (등록 용량과 일치)
- typecheck 0 · JSX 가드 OK · 회귀 165/165 · `npm run build` 성공

---

## 의존 모듈
- BE-05 (`/api/archive`), FE-01 (InnerHeader), types/archive.ts
