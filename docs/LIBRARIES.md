# 라이브러리·API 정리

> 교수님 진행 순서의 **7번째 산출물(라이브러리/API 정리 문서)** 초안입니다.
> 상태: 초안 (2026-10-03, 옥경환 작성). 이용 조건·한도는 작성일에 공식 문서로 확인한 것이고, 바뀔 수 있어 학기 말에 한 번 더 확인합니다.

## 0. 요약

- **화면(브라우저)**: 외부 라이브러리 0개. 순수 HTML·CSS·JavaScript. 설치·빌드 단계 없음.
- **데이터 수집(GitHub Actions)**: Python 3.11 **표준 라이브러리만** 사용. `pip install` 없음.
- **외부 API**: 공개 데이터 4곳(연준·GDELT·한국은행·FRED) + AI 설명 1곳(Anthropic). 키는 모두 GitHub Secrets에만 저장.
- 왜 이렇게 했나: 둘 다 개발 초보라 **설치·버전 충돌이 없는 구성**이 유지하기 쉽고, GitHub Pages(정적 호스팅)에서 그대로 돌아간다 (DECISIONS 2026-10-02).

## 1. 브라우저 API (화면, `app.js`·`pwa.js`·`sw.js`)

| API | 어디서 | 용도 | 지원·주의 |
|---|---|---|---|
| DOM / 이벤트 | `app.js` 전체 | 화면 전환, 입력 처리, 계산 결과 표시 | 모든 브라우저 |
| `localStorage` | `saveAppState()` 등 | 입력값 자동 저장·복원 (키 `aipb-v4-state`) | 같은 브라우저에서만 유지. 시크릿 창은 닫으면 삭제 |
| `fetch` | `news-view.js` *(시안, 채택 시)* | `data/news.json` 읽기 | 같은 저장소 파일이라 CORS 문제 없음 |
| Web App Manifest | `manifest.webmanifest` | 홈 화면 설치(앱 이름·아이콘·전체화면) | Chrome·Edge 설치 버튼, iPhone Safari는 "홈 화면에 추가"(아이콘은 `apple-touch-icon` 사용) |
| Service Worker + Cache Storage | `sw.js`, `pwa.js` | 오프라인에서도 화면·마지막 뉴스 표시 | HTTPS 또는 localhost에서만 동작. GitHub Pages는 HTTPS |
| `window.print()` + `@media print` | `printReport()`, `print.css` | 리포트를 PDF로 저장(브라우저 인쇄 창 → PDF로 저장). 외부 PDF 라이브러리 없음 | 모든 주요 브라우저. 파일 이름은 `document.title`로 지정 |
| `URL`, `Intl.DateTimeFormat` | `news-view.js` *(시안)* | 기사 링크가 http(s)인지 검사, 한국시간 표시 | 모든 주요 브라우저 |
| WebMCP `document.modelContext` | `registerWebMcpTools()` | 브라우저 AI 에이전트가 앱 기능(화면 이동 등)을 호출 | **실험 기능**(Chrome origin trial, 2026). 지원 안 되면 조용히 건너뜀. API 위치가 `navigator.modelContext` → `document.modelContext`로 바뀐 이력이 있어 정식 출시 전 재확인 필요 |

## 2. Python 표준 라이브러리 (`scripts/`, `tests/`)

| 모듈 | 용도 |
|---|---|
| `urllib.request`, `urllib.parse` | API 호출, 검색어 인코딩 |
| `json` | 응답 읽기, `news.json` 쓰기 |
| `xml.etree.ElementTree` | 연준 RSS 읽기 |
| `datetime`, `time`, `email.utils` | 시각 변환(UTC·한국시간, RSS 날짜 형식), GDELT 호출 간격 대기 |
| `hashlib`, `re` | 기사 고유 id, 중복 제목 정리 |
| `argparse`, `os`, `pathlib`, `sys` | 실행 옵션, 환경변수(API 키), 파일 경로 |
| `unittest` | 단위 테스트 47개 (네트워크 없이 고정 샘플) |

## 3. GitHub 기능

| 기능 | 용도 | 한도·주의 (공식 문서 확인) |
|---|---|---|
| GitHub Pages | 앱 배포 `koreanchubby.github.io/ai-pb/` | 사이트 1GB, 대역폭 월 100GB(소프트), 빌드 시간당 10회(소프트), 배포 10분 제한. **Actions 기본 토큰(GITHUB_TOKEN)으로 올린 봇 커밋은 Pages 빌드를 자동으로 시작하지 않음**(GitHub Docs) → 워크플로가 커밋 후 Pages 빌드를 API로 직접 요청(`pages: write`). 첫 실행 때 사이트 반영 확인 필요 |
| GitHub Actions `news.yml` | 매시 17분 뉴스 수집·AI 설명·커밋 | 공개 저장소는 Actions 무료. **공개 저장소에서 60일간 활동이 없으면 예약 실행이 자동 중지됨** → 봇 커밋이 활동으로 잡히지만, 뉴스가 오래 안 바뀌면 Actions 탭에서 다시 켜야 할 수 있음 |
| GitHub Actions `house_view.yml` | `data/house_view_input.json`이 바뀌면 하우스뷰 합의 재계산·커밋 | 입력 형식이 틀리면 실패로 표시 |
| GitHub Actions `tests.yml` | PR을 올리거나 main에 합칠 때 전체 테스트 실행 | 뉴스 수집(`news.yml`)은 뉴스 테스트만 돌려, 하우스뷰 입력 실수가 뉴스 수집을 멈추지 않게 함 |
| `actions/checkout@v4`, `actions/setup-python@v5` | 코드 받기, Python 3.11 설치 | GitHub 공식 액션 |
| Secrets / Variables | API 키 보관 | 코드·로그에 키가 나오지 않음. 오류 메시지에 섞인 키도 `redact()`로 가림 |

- 봇은 내용이 바뀔 때만 커밋한다(`same_content()`). 수집 시각만 다르면 커밋하지 않아 기록이 지저분해지지 않고 Pages 빌드 한도도 지킨다.
- 두 봇(뉴스·하우스뷰)이 동시에 올려도 `pull --rebase` 후 최대 3번 다시 시도한다. main에 "PR 필수" 같은 보호 규칙을 걸면 봇 커밋이 막히므로 걸 경우 Actions 예외를 둔다.

## 4. 외부 API

| API | 가져오는 것 | 키 | 호출량 (1회 실행) | 이용 조건 | 화면 표기 |
|---|---|---|---|---|---|
| 미 연준 RSS `press_monetary.xml` | 통화정책 보도자료 | 불필요 | 1회 | 웹사이트 정보는 퍼블릭 도메인 | "Board of Governors of the Federal Reserve System" |
| GDELT DOC 2.0 | 금리·환율·유가·반도체·지정학 뉴스 제목·링크 | 불필요 | 5회, **6초 간격** | 무료. GDELT 인용·링크 필수. 최대 250건/회, 최근 3개월 검색 | "The GDELT Project" + 링크 |
| 한국은행 ECOS | 기준금리(722Y001), 원/달러(731Y001) | `ECOS_API_KEY` | 2회 | 회원가입 후 인증키. 공공누리 유형 원문 재확인 필요 | "출처: 한국은행 경제통계시스템(ECOS)" |
| FRED | 미 10년물(DGS10), WTI(DCOILWTICO) | `FRED_API_KEY` | 2회 | 지정 문구를 눈에 띄게 표기, 이용약관 링크와 "사용자는 FRED API 이용약관에 동의한다"는 안내, 제3자 저작권 시리즈는 사전 허락 | "This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis." |
| Anthropic Messages API | 뉴스 AI 설명 5칸 | `ANTHROPIC_API_KEY` + 변수 `LLM_MODEL` | 최대 5회 (중요도 3 이상, 높은 순) | 유료(사용량 과금). 키나 `LLM_MODEL`이 없으면 단계 자체를 건너뜀 | "AI 작성" 표시 |

- GDELT 호출 간격: 짧은 간격으로 연속 호출하면 JSON 대신 "Please limit requests…" 같은 문장을 돌려준다. 그래서 6초씩 쉬고, 한 분류가 막혀도 나머지 분류 결과는 살린다. (정확한 한도 수치는 공식 문서에 명시돼 있지 않아 **실무 관행 기준**)
- ECOS 오류 처리: 인증키 오류(`INFO-100`) 등은 실패로 기록하고, "데이터 없음"(`INFO-200`)만 정상으로 본다.
- 후보(아직 미사용): EIA Open Data(유가, 키 필요), OpenDART(공시, 일 20,000회).
- 쓰지 않는 출처: 국내 언론 RSS(개인 구독 한정), 정책브리핑 RSS(중단). 자세한 근거는 DECISIONS 2026-10-03.

## 5. 개발·검증 도구 (앱에는 포함되지 않음)

| 도구 | 용도 |
|---|---|
| WebStorm (JetBrains 비상업 무료) | 코드 편집, Git 커밋·푸시·PR |
| Google Stitch | 화면 디자인 시안 |
| Playwright + Chromium | 저장·복원, PWA 설치 가능 여부, 오프라인 동작, 모바일 390px 자동 확인 |
| Claude (Pro) | 작업 보조. 프롬프트는 저장소의 `docs/CLAUDE_PROMPTS.md` |

## 6. 확인 출처 (작성일 2026-10-03)

- [GitHub Docs — Disabling and enabling a workflow (60일 비활성 규칙)](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows)
- [GitHub Docs — GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [GDELT Blog — GDELT DOC 2.0 API Debuts (최대 250건, 최근 3개월)](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/)
- [WebMCP 2026 정리 — document.modelContext 이동](https://mcpplaygroundonline.com/blog/what-is-webmcp), [DEV — WebMCP origin trial 변경 (2026-07-26)](https://dev.to/jangwook_kim_e31e7291ad98/webmcps-origin-trial-providecontext-is-already-gone-54j8) — 두 곳 모두 개인 블로그라 정식 사양 공개 시 재확인
- 나머지 출처별 이용 조건: `docs/DECISIONS.md` 2026-10-03 항목
