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
| 옥경환 (koreanchubby) | 뉴스 출처 선정·자동 수집 | #2 | `feat/news-actions` | `docs/`, `scripts/`, `data/`, `.github/` | ⬜ (PR #9·#10·리포트 PDF가 합쳐진 뒤 올림) |
| 옥경환 (koreanchubby) | 이유경 PR #8(주간 보고서 문서) 리뷰 | — | — | — | ✅ 승인 (2026-10-06), Merge 대기 |
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

## 이번 주 메모

- 화면에 "자동 저장됨"이 표시되지만 실제 저장은 안 됨 → PR #7로 해결(2026-10-05 병합). 리뷰 지적(검토 완료 직후 새로고침)은 PR #9에서 수정
- (옥경환, 10-06) 올릴 순서: PR #9(app.js) · PWA(`index.html` 5줄) → 둘 다 합쳐지면 리포트 PDF(`app.js`·`index.html`) → 뉴스 자동 수집·문서. `styles.css`·`v3.css`는 건드리지 않음
- `app.js`는 공유 파일: 입력 저장 작업 중에는 디자인 작업에서 `app.js`를 건드리지 않기
- 매주 개인 보고서(report.eyefeet.com)에 이 표의 완료 항목을 옮겨 적으면 됨
- (이유경, 10-05) 디자인 작업 진행 상황: Stitch 시안 작업 중. 순서는 ① 고객 정보·투자성향 화면 시안 확정 → ② `styles.css`/`v3.css`에만 반영(`index.html` id·`app.js`는 안 건드림) → ③ 9단계·7단계·모바일 점검 → ④ PR. 디자인 작업 동안 CSS 파일은 건드리지 말아 줘
