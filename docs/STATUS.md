# 진행 현황 (STATUS)

> **작업 시작 전과 끝난 후에 반드시 갱신합니다.** 순서는 `docs/WORKFLOW.md` 참고.
> 상태 표시: 🟡 진행 중 · 🔵 리뷰 대기 · ✅ 완료 · ⬜ 시작 전

마지막 갱신: 2026-10-02

## 현재 단계

- 가이드 **0~1단계 완료** (v4 업로드, `prototype-v4` 태그, 공개 URL 배포)
- 배포 주소: https://koreanchubby.github.io/ai-pb/
- 다음: 2단계(디자인) · 3단계(입력 저장) · 4단계 준비(뉴스 출처)

## 지금 누가 무엇을 하고 있나

| 담당 | 작업 | 이슈 | 브랜치 | 건드리는 파일 | 상태 |
|---|---|---|---|---|---|
| 옥경환 (koreanchubby) | 입력값 저장·복원 | #1 | `feat/save-input` | `app.js` | ⬜ |
| 옥경환 (koreanchubby) | 뉴스 출처(RSS) 선정 | #2 | — | `docs/DECISIONS.md` | ⬜ |
| 이유경 (yukyung16) | Stitch 디자인 정리, CSS 반영 | #3 | `design/stitch-style` | `styles.css`, `v3.css` | ⬜ |
| 이유경 (yukyung16) | `feat/save-input` PR 리뷰 | #5 | — | — | ⬜ |
| 옥경환 (koreanchubby) | `design/stitch-style` PR 리뷰 | #5 | — | — | ⬜ |
| 둘 다 | WebStorm 비상업 무료 라이선스 등록 | #4 | — | — | ⬜ |

## 완료

| 날짜 | 작업 | 담당 |
|---|---|---|
| 2026-10-02 | GitHub 저장소 생성, Collaborator 초대·수락 | 둘 다 |
| 2026-10-02 | v4 파일 업로드, `prototype-v4` 태그, `.gitignore` | 이유경 |
| 2026-10-02 | 옥경환 PC WebStorm Clone·Pull | 옥경환 |
| 2026-10-02 | Public 전환, GitHub Pages 배포, 공개 URL 점검 | 옥경환 |
| 2026-10-02 | `docs/` 문서(PROJECT_BRIEF, DECISIONS, WORKFLOW, STATUS), PR 템플릿, 이슈 등록 | 옥경환 |

## 이번 주 메모

- 화면에 "자동 저장됨"이 표시되지만 실제 저장은 안 됨 → `feat/save-input`에서 해결
- `app.js`는 공유 파일: 입력 저장 작업 중에는 디자인 작업에서 `app.js`를 건드리지 않기
- 매주 개인 보고서(report.eyefeet.com)에 이 표의 완료 항목을 옮겨 적으면 됨
