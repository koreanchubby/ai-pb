# 진행 현황 (STATUS)

> **작업 시작 전과 끝난 후에 반드시 갱신합니다.** 순서는 `docs/WORKFLOW.md` 참고.
> 상태 표시: 🟡 진행 중 · 🔵 리뷰 대기 · ✅ 완료 · ⬜ 시작 전

마지막 갱신: 2026-10-07

## 현재 단계

- 가이드 **0~1단계 완료** (v4 업로드, `prototype-v4` 태그, 공개 URL 배포)
- 배포 주소: https://koreanchubby.github.io/ai-pb/
- 다음: 2단계(디자인) · 3단계(입력 저장) · 4단계 준비(뉴스 출처)

## 지금 누가 무엇을 하고 있나

| 담당 | 작업 | 이슈 | 브랜치 | 건드리는 파일 | 상태 |
|---|---|---|---|---|---|
| 옥경환 → 이유경 검토 | 뉴스 화면 news.json 연결 시안 | — | `feat/news-view` | `news-view.js`, `sw.js`, `index.html`(1줄) | ✅ PR #16 채택·Merge (10-07 이유경 리뷰: 로컬에서 카드 12개·필터·원문 링크 확인) |
| 둘 다 | 가정 수치 교체안 (기대수익·변동성·설문 구간) | — | `fix/assumptions` | `app.js`, `scripts/calc_reference.py`, `tests/`, `docs/` | ✅ PR #17 Merge (10-07 합의: 해외 기관 전망 USD 사용·국내주식=신흥국 값·설문 구간 1점 조정. 스트레스 손실·과세 분배율은 아직 데모값) |
| 둘 다 | 하우스뷰 참고 증권사 목록 확정 | — | — | `data/house_view_input.json` | ⬜ |
| 옥경환 (koreanchubby) | Supabase로 DB·REST API 연동 (마일스톤 5) | #20 | `feat/supabase-db` | `supabase/`(새 폴더), `app.js`(저장 부분만, 시작 전 알림), 새 JS 파일 1개, `index.html`(script 1줄), `docs/DB_DESIGN.md` | 🔵 리뷰 대기 (PR #21) — Supabase 프로젝트 `ai-pb`(서울) 생성·테이블 11개·RLS 적용 완료 |
| 옥경환 (koreanchubby) | AI 예측 파이프라인 초안: 거시지표 → 다음 달 미국 주식 방향 (마일스톤 8, 주제는 이유경과 합의 필요) | #22 | `feat/ai-prediction` | `scripts/ai_predict.py`, `tests/`, `data/ai_signal.json`, `.github/workflows/`, `docs/AI_SPEC.md` (앱 화면 파일은 안 건드림) | 🔵 초안 PR #23 — 주제 합의 필요. 백테스트 결과: 방향 정확도 50.8%로 기준(59.3%)보다 낮음, 최대 낙폭은 작음 |
| 이유경 (yukyung16) | Stitch 디자인 정리, CSS 반영 | #3 | `design/stitch-style` | `styles.css`, `v3.css` | 🔵 리뷰 대기 (10-07) — Stitch 시안과 비교 후 **현재 화면 유지**로 결정, CSS 변경 없음. DECISIONS 기록 PR(`Closes #3`) |
| 옥경환 (koreanchubby) | `design/stitch-style` PR 리뷰 | #5 | — | — | ⬜ |
| 이유경 (yukyung16) | 강의계획서 대비 진행 점검표, 주간 보고서 마감·작성 방법 | — | `docs/syllabus-progress` | `docs/SYLLABUS_PROGRESS.md`, `docs/WEEKLY_REPORTS.md` | 🔵 리뷰 대기 (PR #15) |
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
| 2026-10-06 | 옥경환 6주차 초안 PR #11 리뷰·Merge, 보고서 기준 합의(그 주차 마일스톤만, 마일스톤 3 = 5주차) | 이유경 |
| 2026-10-06 | 주간 보고서 6주차 초안·간트 기준표 (PR #14, 옥경환 Merge) | 이유경 |
| 2026-10-06 | 옥경환 PR #9·#10·#12·#13 실행·리뷰·Merge (순서대로). 리뷰 의견은 각 Merge 기록에 남김 | 이유경 |
| 2026-10-06 | 입력 저장 후속 수정(PR #9), PWA(PR #10), 리포트 PDF(PR #12), 뉴스 자동 수집·하우스뷰·계산 재현·산출물 문서(PR #13, 이슈 #2 닫힘), 6주차 초안(PR #11) | 옥경환 |
| 2026-10-06 | ECOS·FRED API 키 등록, 뉴스 수집 수동 실행 성공(연준 15·ECOS 2·FRED 2건), 이유경 PR #15 리뷰·Merge | 옥경환 |
| 2026-10-07 | 와이어프레임 PPT(화면 11개 캡처 + 전체 화면 구성·흐름 설명, 16장, 팀 공동) 작성 — 교수님 공지 과제, SFTP 서버 제출 | 옥경환 |

## 이번 주 메모

- 화면에 "자동 저장됨"이 표시되지만 실제 저장은 안 됨 → PR #7로 해결(2026-10-05 병합). 리뷰 지적(검토 완료 직후 새로고침)은 PR #9에서 수정
- `index.html`에 추가된 줄: PWA 5줄(manifest·아이콘 링크·iOS meta, `pwa.js`), 리포트 PDF 1줄(`print.css`). 디자인 작업과 겹치면 이 줄들만 살려서 합치기
- 코드 메모: 회사채 입력칸 id가 `asset-corpat`(오타로 보임). 저장 키로도 쓰이므로 고칠 때는 `STORAGE_VERSION`도 함께 올리기
- (옥경환, 10-06) 뉴스 자동 수집 가동 중(매시 17분). Secrets `ECOS_API_KEY`·`FRED_API_KEY` 등록. **AI 설명(Anthropic, 유료)은 쓰지 않기로 함** → 키 없이 그 단계만 건너뜀
- GDELT(해외 뉴스)는 GitHub 서버 IP 공유 때문에 가끔 "요청 많음(429)"으로 실패함. 실패해도 이전에 받은 기사는 보관 시간 동안 유지되므로 화면에서 사라지지 않음
- `app.js`는 공유 파일: 입력 저장 작업 중에는 디자인 작업에서 `app.js`를 건드리지 않기
- 매주 개인 보고서(report.eyefeet.com)에 이 표의 완료 항목을 옮겨 적으면 됨
- (이유경, 10-06) PR #9·#10·#12·#13 Merge 완료. **이슈 #2는 PR #13의 `Closes #2`로 자동으로 닫힘** → API 키(Secrets)·Variables 등록과 Actions news 첫 실행 확인은 아직 남아 있음. 리뷰 의견: print.css의 `#pwa-banner` id 불일치(오프라인 PDF에 알림 찍힐 수 있음), DB_DESIGN은 강의계획서상 백엔드+DB 필수라 Supabase로 가는 쪽 + 권한(소유자·RLS) 추가 제안, PWA는 배포 후 휴대폰 설치·비행기 모드로 확인 필요
- (이유경, 10-07) 리포트 PDF 버그 수정: `print.css`가 없는 id `#pwa-banner`를 숨기고 있어 PDF에 새 버전·오프라인 알림이 찍힐 수 있었음 → `#pwa-update-banner`, `#pwa-offline-banner`로 고침. 브랜치 `fix/print-banner` 🔵 리뷰 대기 (`print.css` 1줄)
- (이유경, 10-07) **#23 AI 주제 의견: 지금 주제(거시지표 → 다음 달 미국 주식 방향) 유지.** 4개 후보 비교 — ① 주가 예측: 데이터 108개월·라벨이 명확해 예측→라벨링→백테스트→실전 검증을 모두 갖춤, 이미 구현·테스트 완료, 하우스뷰 근거로 앱과 연결됨 ② 뉴스 분석: 우리 news.json은 10월부터 쌓여 백테스트 기간이 너무 짧고 라벨링이 어려움 ③ 이상거래 탐지: 앱에 거래 데이터가 없어 가짜 데이터가 필요하고 PB 앱과 안 맞음 ④ 종목 군집화·유사 종목 추천: 정답(라벨)이 없어 백테스트·검증이 약함. 제안: 결과가 기준보다 낮은 건 그대로 두고, 화면에는 "참고 신호 + 성과 한계" 카드로만 표시. **라벨·기간을 결과 보고 바꾸지 않기**(바꾸면 과최적화). 합의되면 DECISIONS에 기록하고 Ready for review로
- (이유경, 10-07) **PR 리뷰 결과**: #19 Merge(기준.pdf와 일치). **#21 보류** — ① main과 충돌(`index.html` script 줄, `sw.js` 캐시 버전: #16이 먼저 v3로 합쳐짐 → 두 줄 모두 살리고 v4로) ② 교수님이 DB·배포는 Eyefeet Cloud(PostgreSQL+PostgREST)를 쓰라고 하심 → Supabase 유지 vs Eyefeet 이전을 먼저 정하고 DECISIONS에 기록. 코드 자체(RLS·publishable 키·실패 시 localStorage 유지)는 좋음. **#23 초안 유지** — 테스트 63개 통과, 결과를 기준과 정직하게 비교한 점 좋음. 주제는 같이 정하기
- (이유경, 10-07) PR #18(상태 안내 전 GitHub 재조회 규칙)·#16·#17 Merge 완료 → 둘 다 Pull 받기. eyefeet 6주차 보고서·간트 스냅샷 저장 완료(10-07, 사이트 장애로 하루 늦음), 내용 공유 PR은 `docs/weekly6-yk`
- (이유경, 10-06) **교수님 안내: 배포·DB는 Eyefeet Cloud(admin.eyefeet.com) 사용, 팀당 테넌트 1개.** 제공 기능: 저장소 연결·push 자동 배포(웹훅), 런타임(static/python/node 등), PostgreSQL + PostgREST(REST API 자동 생성), 환경변수·🔒비밀. → 제안: ① 테넌트는 **한 명만** 만들기(중복 생성 금지, 누가 만들지 정하기) ② 처음엔 지금 앱을 `static`으로 main 브랜치 연결 ③ DB_DESIGN의 Supabase 대신 Eyefeet PostgreSQL로 바꿀지 정한 뒤 DECISIONS에 기록. API 키는 저장소가 아니라 Eyefeet 🔒비밀 환경변수에만
- (이유경, 10-06) **eyefeet 보고서 마감: 매주 화요일 17시.** 강의계획서 대비 점검(PR #15): 백엔드·DB·REST API(8~9주), AI 예측→백테스트(13주, 기말)가 비어 있음 → 같이 정하자. (10-07) 강의계획서 번호 제출문서(00~22)는 따로 안 만들고 eyefeet 간트차트로 대신함
- (이유경, 10-05) 디자인 작업 진행 상황: Stitch 시안 작업 중. 순서는 ① 고객 정보·투자성향 화면 시안 확정 → ② `styles.css`/`v3.css`에만 반영(`index.html` id·`app.js`는 안 건드림) → ③ 9단계·7단계·모바일 점검 → ④ PR. 디자인 작업 동안 CSS 파일은 건드리지 말아 줘
