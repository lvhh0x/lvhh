# MERIDIAN — 세션 인계 문서 (새 창에서 이어하기)

> **작성일:** 2026-07-03
> **목적:** 이 대화창이 끝나고 새 창(새 세션)에서 이어서 작업할 때, 이 문서 하나로 "지금까지 뭘 했고, 지금 뭘 봐야 하고, 다음에 뭘 해야 하는지" 파악할 수 있도록 함.
> **기준 커밋:** `main` HEAD `d06cca2` (2026-07-03 기준, Vercel 자동배포 완료)

---

## 0. 새 세션에서 가장 먼저 할 일

1. 이 문서를 읽는다 (지금 읽고 있는 문서).
2. `docs/MASTER.md` 를 읽는다 — 프로젝트 전체 규칙·구조·절대 규칙이 있는 마스터 문서.
3. `docs/PROGRESS.md` 를 열어 `## ✅ Phase 5 Step 3` 섹션을 확인한다 — Step 3-1~3-5 전부 `[x]` 완료. **다음은 Phase 6(DB 연동).**
4. 다음 작업은 **Phase 6 — master.json → Supabase DB 연동.** 아래 "3." 섹션은 Step 3-5 통합 검증 기록(완료)이니 참고용.
5. **코딩은 사용자의 명시적 명령("실행"/"수정"/"추가" 등) 없이는 시작하지 않는다.** 상황 보고 후 명령을 기다린다.

---

## 1. 프로젝트가 무엇인가 (요약)

**MERIDIAN Private Simulation Desk** — 주식 백테스트 시뮬레이션 + 회사 물류(박스·파렛트 적재) 시뮬레이션을 제공하는 공개 웹앱.

| 항목 | 내용 |
|---|---|
| 개발자 | 솔길 (단독 개발) — TTR(열전사 리본) 라벨 제조·물류 도메인 |
| 레포 | `github.com/lvhh0x/lvhh` (public, main 브랜치) |
| 배포 | Vercel `lvhh.vercel.app` — main push 시 자동배포 |
| 스택 | Next.js 14 (App Router) + TypeScript strict + Python FastAPI(Railway, 주식용) + Supabase(DB) |
| DB | Supabase 프로젝트 `lnnxjwfvzaelsoupozke` (Tokyo) — 회사 시뮬레이션은 아직 미연동, `lib/company/master.json` 하드코딩 사용 중 |
| Railway | `https://meridian-production-e345.up.railway.app` (주식 백테스트 서버) |

이 문서가 다루는 부분은 **회사 물류 시뮬레이션**(`/company/[id]`, 특히 `/company/box-pallet`)의 **Phase 5 Step 3** 대개선 작업.

---

## 2. 지금까지 한 작업 요약 (Phase 5 Step 3)

Step 3은 5개 하위 단계로 나뉘며, **3-1 ~ 3-5 전부 완료** (Phase 5 Step 3 종결).

| 단계 | 내용 | 상태 |
|---|---|---|
| 3-1 | 박스 결과 그리드를 5열로 정렬 (flex-wrap → CSS grid) | ✅ 완료 |
| 3-2 | 파렛트 규격·오버행 계산 엔진 신설 (`overhang.ts`) | ✅ 완료 |
| 3-3 | 파렛트 슬롯/빈칸/적재초과(overflow) 로직 재설계 | ✅ 완료 |
| 3-4 | **원단(fabric) 타입 도입 + 무게 표시 3줄 분리** | ✅ 완료 (이번 세션의 핵심 작업) |
| 3-5 | 통합 검증 (브라우저 육안 + 통합 회귀 test-step3-5 13/13) | ✅ 완료 |

### 2-1. 이번 세션(Step 3-4)에서 구현한 것

**요구사항:**
- 제품 입력에 "원단"(예: B220) 항목 추가. 미입력 시 `미지정` 처리.
- 아웃박스 조합 시 **같은 원단끼리 우선으로 묶고**, 60단위를 못 채우면 다른 원단과 섞어서 채움(개수 규칙 절대 불변).
- 박스 라벨: 단일 원단이면 `B220 아웃박스` 1줄, 혼합(2종 이상)이면 원단 목록 + 박스종류 2줄.
- 무게 표시를 **적재무게 / 파렛트무게 / 총무게** 3줄로 분리 표시 (계산값은 무수정, 표시만 역산으로 분리).

**변경된 파일 (외과적 수정 원칙 준수 — 관련 없는 코드는 손대지 않음):**
- `types/company.ts` — `ProductInput`·`SizedInnerCount`에 `fabric: string` 필드 추가
- `lib/company/fabric.ts` (신규) — `normalizeFabric()`, `distinctFabricsByQty()` 순수 함수
- `lib/company/innerbox.ts` — fabric passthrough
- `lib/company/outerbox.ts` — 그룹핑 키를 `(size,meter)` → `(size,meter,fabric)`로 변경 (핵심 로직)
- `lib/company/simulate.ts` — 호출부에 fabric 전달
- `components/company/CompanyParams.tsx` — 원단 입력 필드 추가 (입력 순서: 원단→사이즈→미터→수량)
- `components/company/BoxSvg.tsx` — 원단 라벨 표기
- `components/company/CompanyResult.tsx` — 무게 3줄 분리 표시
- `scripts/test-step3-4.ts` (신규) — 17개 케이스 검증
- `scripts/test-step4.ts` — 기존 테스트 헬퍼에 fabric 필드 반영(회귀 결과 불변 확인용)

**검증 결과 (전부 통과):**
- `tsc --noEmit` 0 에러
- JSX 한글 가드 통과
- `npm run build` 성공
- `test-step3-4` 17/17, `test-step4` 19/19, `test-step3-2` 5/5, `test-step3-3` 80/80 (전부 무영향 회귀 확인)

**상세 설계·로그 문서:**
- `docs/PHASE5-STEP3-STEP4-IMPL.md` — 구현 계획 + 체크리스트
- `docs/PHASE5-STEP3-VERIFY-LOG.md` — Step 3-1~3-4 전체 검증 로그 (diff, 테스트 출력 포함)

### 2-2. push 및 검증 과정에서 있었던 일 (참고용)

- GitHub MCP `push_files`로 코드 6개 파일 + 4개 파일을 나눠 두 커밋(`a26307a`, `34a44a6`)으로 올림.
- 이후 원격을 **재클론**하여 `tsc`·JSX 가드·전체 테스트를 다시 돌려 코드가 정확히 반영됐는지 재검증(문제 없음 확인).
- 문서 4개(`PHASE5-STEP3-STEP4-IMPL.md`, `PROGRESS.md`, `MASTER.md`, `PHASE5-STEP3-VERIFY-LOG.md`)를 push하는 과정에서 **`push_files` 호출 중 한글 텍스트가 일부 깨지는 전사 오류**가 발생(예: "필요"→"필질", "스텁"→"스턴"). 재클론 후 로컬 원본과 **문자 단위 diff**로 이를 발견해, 손상된 파일들을 무손실 방식(`\uXXXX` 유니코드 이스케이프)으로 재작성하여 재push, 최종적으로 diff가 완전 일치함을 확인.
- **교훈:** 한글(비ASCII) 콘텐츠를 `push_files`로 올릴 때는 push 후 반드시 재클론 → diff 대조까지 해야 안전함. 코드 파일(`.ts`/`.tsx`)은 애초에 `\uXXXX` 이스케이프로 작성했기 때문에 문제가 없었음. (2026-07-04 추가 교훈: `create_or_update_file` 반환 blob `sha`를 로컬 `git hash-object`와 대조하면 재클론 없이 무손실을 즉시 검증할 수 있음.)

---

## 3. Step 3-5 (통합 검증) — 완료 기록 · 다음은 Phase 6

`docs/PROGRESS.md`의 Step 3-5 체크리스트 원문:

```
### Step 3-5 — 통합 검증 & 빌드
- [ ] scripts/ 회귀 테스트에 신규 케이스 추가(원단/슬롯초과/오버행)
- [ ] npx tsc --noEmit 에러 0
- [ ] npm run build 통과 (폰트 스텁 로컬)
- [ ] lvhh.vercel.app/company 브라우저 5개 항목 확인
- [ ] docs/PHASE5-STEP3-VERIFY-LOG.md 생성
- [ ] PROGRESS.md / MASTER.md 완료 처리
```

구체적으로:

1. **브라우저 육안 확인 (`lvhh.vercel.app/company/box-pallet`)** — 지금까지 Step 3-1~3-4는 로컬 `tsc`/테스트만으로 검증했고, 실브라우저에서 전부 함께 보는 건 아직 안 함. 확인할 5개 항목:
   - 박스 결과가 5열 그리드로 정확히 표시되는지 (Step 3-1)
   - 파렛트 슬롯/빈칸/적재초과 경고가 정확히 렌더되는지 (Step 3-3)
   - 파렛트 규격·오버행 문구가 정확히 표시되는지 (Step 3-2)
   - **원단 표기**가 1종/혼합 라벨로 정확히 보이는지 (Step 3-4, 아직 브라우저로 한 번도 확인 안 함)
   - **무게 3줄 분리**(적재/파렛트/총)가 정확히 보이는지 (Step 3-4)
2. **회귀 테스트 신규 케이스 추가** — 지금까지 각 Step마다 개별 테스트 파일(`test-step3-2.ts`, `test-step3-3.ts`, `test-step3-4.ts`)만 있었음. 원단+슬롯초과+오버행이 **동시에** 걸리는 케이스를 통합 테스트로 추가할지 사용자와 논의 필요.
3. 전부 통과하면 `PROGRESS.md`의 Step 3-5 체크박스와 섹션 헤더(`🔄`→`✅`)를 완료 처리하고, `MASTER.md`도 "Phase 5 Step 3 완료, Phase 6 착수 예정"으로 갱신.
4. Step 3 전체가 끝나면 **Phase 6 — DB 연동**(master.json → Supabase)이 다음 큰 작업.

---

## 4. 작업 규율 (사용자 지침 — 항상 지킬 것)

- **코딩은 명시적 명령 후에만.** "실행", "수정", "추가" 등의 명령이 없으면 코드를 작성하지 않는다.
- 파일이 올라오면 구조·설계 목적·의도를 정확히 분석해서 반영한다.
- 앱 구현 시 무조건 상세 구현계획 문서를 먼저 만들고, 완료로 표시하면서 구현한다.
- 버그/에러 수정 및 검증 시 테스트 환경을 구축해 검증하고, 그 내용을 마크다운 로그 문서로 남긴다.
- `any`/`unknown` 타입 금지. `tsc --noEmit`을 지속적으로 돌려 새 문제를 만들지 않는다.
- 모든 작업·단계가 끝날 때까지 멈추지 않는다.
- 사용자에게 물어볼 때는 먼저 무엇을 물어보는지 상세히 설명한 후 선택지를 제시한다.
- 코딩 시 한 파일에 몰아넣지 않고 모듈을 분리(UI/엔진/카테고리/정보 등)해 워크트리 구조로 짠다.
- 백엔드·프론트엔드를 분리해 개발한다.
- 영어 정보는 한글로 번역해서 알려준다.
- **외과적 수정 원칙:** 완성돼 잘 도는 코드는 절대 건드리지 않고, 수정할 곳만 정확히 고친다. 관련 없는 포맷팅·주석·인접 코드는 손대지 않는다.
- **보존 목록(절대 수정 금지):** `app/page.tsx`, `app/stock/**`, `components/stock/**`, `components/home/**`, `components/layout/**`, `lib/stock/**`, `lib/svg/**`, `lib/supabase/**`, `types/backtest.ts`, `types/stock.ts`, `types/database.ts`, `python/**`, `components/svg/PalletSvg.tsx`
- **DB 보존 목록:** 리본/라벨 제조 비즈니스 테이블 15개는 절대 수정 금지 (`docs/MASTER.md`에 목록 있음).

---

## 5. 환경/실행 방법 참고

- **로컬 작업 디렉토리 관례:** `/home/claude/lvhh` (작업용), `/home/claude/lvhh-verify*` (원격 재클론 검증용, 매번 새로 클론해서 씀).
- **GitHub push:** `github:push_files`(원자적 다중 파일 커밋) 또는 `github:create_or_update_file`(단일 파일, sha 필요) MCP 도구 사용. 로컬 `git push`용 토큰 없음.
- **한글 파일 push 시 주의:** push 후 반드시 원격 재클론 → 로컬 원본과 `diff`로 대조. 깨졌으면 `\uXXXX` 유니코드 이스케이프로 재작성해 재push.
- **빌드 시 폰트 이슈:** `npm run build`는 Google Fonts가 샌드박스에서 차단되어 실패함 → 임시로 `app/layout.tsx`의 `next/font/google` 부분을 로컬 상수 스텁으로 교체 후 빌드하고, **반드시 `git checkout app/layout.tsx`로 원복**(스텁은 절대 push 금지).
- **테스트 실행 예시:**
  ```
  TS_NODE_BASEURL=. npx ts-node -r tsconfig-paths/register \
    --compiler-options '{"module":"commonjs","baseUrl":"."}' scripts/test-step3-4.ts
  ```
- **JSX 한글 가드:** `node scripts/check-jsx-escapes.mjs` — company 컴포넌트의 JSX 텍스트에 유니코드 이스케이프 리터럴이 남아있으면 실패.

---

## 6. 참고 문서 지도

| 문서 | 용도 |
|---|---|
| `docs/MASTER.md` | **항상 가장 먼저 읽는 문서.** 전체 구조·기술스택·절대규칙·디자인 토큰 |
| `docs/PROGRESS.md` | 전체 Phase별 체크리스트 + 완료 기록 표. 현재 위치 파악용 |
| `docs/PHASE5-STEP3-PLAN.md` | Step 3 전체 마스터 계획 (요구 1~5) |
| `docs/PHASE5-STEP3-IMPL-PLAN.md` | Step 3 5단계 상세 설계 |
| `docs/PHASE5-STEP3-STEP2-IMPL.md` | Step 3-2(규격·오버행) 구현계획 |
| `docs/PHASE5-STEP3-STEP3-IMPL.md` | Step 3-3(슬롯·빈칸·오버) 구현계획 |
| `docs/PHASE5-STEP3-STEP4-IMPL.md` | Step 3-4(원단·무게) 구현계획 — 이번 세션 |
| `docs/PHASE5-STEP3-VERIFY-LOG.md` | Step 3-1~3-5 전체 검증 로그 (diff·테스트 출력) |
| **이 문서** | 세션 간 인계용 — 다음 세션은 여기서 시작 |

---

## 7. 인프라 참조

- **GitHub:** `lvhh0x/lvhh` (public, main) → https://github.com/lvhh0x/lvhh
- **Vercel:** `lvhh.vercel.app` — main push 시 자동배포. env: `PYTHON_SERVER_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`(서버 전용)
- **Railway (Python 서버):** https://meridian-production-e345.up.railway.app
- **Supabase:** 프로젝트 "lvhh0x's Project", ID `lnnxjwfvzaelsoupozke`, ap-northeast-1(Tokyo), PostgreSQL 17

---

*이 문서는 세션이 바뀔 때마다 최신 상태로 갱신되어야 한다. Step 3-5 완료 후에는 Phase 6 착수 시점 기준으로 새 인계 문서를 만들거나 이 문서를 갱신할 것.*
