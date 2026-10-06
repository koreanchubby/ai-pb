# 진행 현황 (STATUS)

> **작업 시작 전과 끝난 후에 반드시 갱신합니다.** 순서는 `docs/WORKFLOW.md` 참고.
> 상태 표시: 🟡 진행 중 · 🔵 리뷰 대기 · ✅ 완료 · ⬜ 시작 전

마지막 갱신: 2026-10-06

## 현재 단계

- 가이드 **0~1단계 완료** (v4 업로드, `prototype-v4` 태그, 공개 URL 배포)
- 배포 주소: https://koreanchubby.github.io/ai-pb/
- 다음: 2단계(디자인) · 3단계(입력 저장) · 4단계 준비(뉴스 출처)

## 지금 누가 무엇을 하고 있나

| 담당 | 작업 | 이슈 | 브랜치 | 건드리는 파일 | 상태 |
|---|---|---|---|---|---|
| 옥경환 (koreanchubby) | 입력 저장 후속 수정 (PR #7 리뷰 지적 반영) | #1 | `fix/save-followup` | `app.js` | 🔵 리뷰 대기 (PR #9) |
| 옥경환 (koreanchubby) | PWA 설치·오프라인 | — | `feat/pwa` | `index.html`(5줄 추가, id 변경 없음), `sw.js`, `pwa.js`, `manifest.webmanifest`, `icons/` | 🔵 리뷰 대기 (PR #10) |
| 옥경환 (koreanchubby) | 리포트 PDF 저장 | — | `feat/report-print` | `app.js`(저장 버튼), `print.css`, `sw.js`, `index.html`(1줄) | 🔵 리뷰 대기 (PR #12, #9·#10 다음에 Merge) |
| 옥경환 (koreanchubby) | 뉴스 출처 선정·자동 수집·AI 설명, 하우스뷰 합의, 계산 재현 모델·테스트 47개, 산출물 문서 | #2 | `feat/news-actions` | `scripts/`, `tests/`, `data/`, `.github/workflows/`, `docs/`(STATUS 제외), `README.md` | 🔵 리뷰 대기 (PR #13, #12 다음에 Merge) |
| 옥경환 → 이유경 검토 | 뉴스 화면 news.json 연결 시안 | — | `feat/news-view` | `news-view.js`, `sw.js`, `index.html`(1줄) | ⬜ #13 Merge 후 이유경이 채택 여부 결정 |
| 둘 다 | 가정 수치 교체안 (기대수익·변동성·설문 구간) | — | `fix/assumptions` | `app.js`, `scripts/calc_reference.py`, `tests/`, `docs/` | ⬜ #13 Merge 후 팀 결정 |
| 둘 다 | 하우스뷰 참고 증권사 목록 확정 | — | — | `data/house_view_input.json` | ⬜ |
| 옥경환 (koreanchubby) | 주간 보고서 6주차 옥경환 초안 | — | `docs/weekly-report-okh` | `docs/WEEKLY_REPORTS.md` | 🔵 리뷰 대기 (PR #11) |
| 이유경 (yukyung16) | Stitch 디자인 정리, CSS 반영 | #3 | `design/stitch-style` | `styles.css`, `v3.css` | 🟡 진행 중 (2026-10-05 시작) — Stitch에서 "고객 정보·투자성향" 화면 시안 다듬는 중, 아직 CSS 반영 전 |
| 옥경환 (koreanchubby) | `design/stitch-style` PR 리뷰 | #5 | — | — | ⬜ |
| 둘 다 | WebStorm 비상업 무료 라이선스 등록 | #4 | — | — | 옥경환 ✅ / 이유경 ✅ |

## 완료

| 날짜 | 작업 | 담당 |
|---|---|---|
| 2026-10-02 | GitHub 저장소 생성, Collaborator 초대·수락 | 둘 다 |
| 2026-10-02 | v4 파일 업로드, `prototype-v4` 태그, `.gitignore` | 이유경 |
| 2026-10-02 | 옥경환 PC WebStorm Clone·Pull | 옥경환 |
| 2026-10-02 | Public 전환, GitHub Pages 배포, 공개 URL 점검 | 옥경환 |
| 2026-10-02 | `docs/` 문서(PROJECT_BRIEF, DECISIONS, WORKFLOW, STATUS), PR 템플릿, 이슈 등록 | 옥경환 |
| 2026-10-05 | 처음 준비(이슈 #6), WebStorm 무료 라이선스(이슈 #4) | 이유경 |
| 2026-10-05 | `feat/save-input` PR #7 실행·리뷰·승인·Merge (이슈 #5 첫 항목) | 이유경 |
| 2026-10-05 | 입력값 저장·복원 (PR #7, 이슈 #1) | 옥경환 |
| 2026-10-06 | 주간 보고서 문서 PR #8 리뷰·승인·Merge | 옥경환 |

## 이번 주 메모

- 화면에 "자동 저장됨"이 표시되지만 실제 저장은 안 됨 → PR #7로 해결(2026-10-05 병합). 리뷰 지적(검토 완료 직후 새로고침)은 PR #9에서 수정
- (옥경환, 10-06) **Merge 순서: #9 → #10 → #12 → #13.** #12·#13은 앞 PR 위에 쌓아서 올렸기 때문에, 앞 PR이 합쳐지면 자기 변경만 남음. `styles.css`·`v3.css`는 건드리지 않음 (리포트 인쇄 모양은 별도 `print.css`)
- `index.html`에 추가된 줄: PWA 5줄(manifest·아이콘 링크·iOS meta, `pwa.js`), 리포트 PDF 1줄(`print.css`). 디자인 작업과 겹치면 이 줄들만 살려서 합치기
- 코드 메모: 회사채 입력칸 id가 `asset-corpat`(오타로 보임). 저장 키로도 쓰이므로 고칠 때는 `STORAGE_VERSION`도 함께 올리기
- #13 Merge 후 옥경환: Settings → Secrets(`ECOS_API_KEY`, `FRED_API_KEY`, `ANTHROPIC_API_KEY`)·Variables(`LLM_MODEL`) 등록 → Actions의 news 첫 실행 확인 → 이슈 #2 닫기
- `app.js`는 공유 파일: 입력 저장 작업 중에는 디자인 작업에서 `app.js`를 건드리지 않기
- 매주 개인 보고서(report.eyefeet.com)에 이 표의 완료 항목을 옮겨 적으면 됨
- (이유경, 10-05) 디자인 작업 진행 상황: Stitch 시안 작업 중. 순서는 ① 고객 정보·투자성향 화면 시안 확정 → ② `styles.css`/`v3.css`에만 반영(`index.html` id·`app.js`는 안 건드림) → ③ 9단계·7단계·모바일 점검 → ④ PR. 디자인 작업 동안 CSS 파일은 건드리지 말아 줘
