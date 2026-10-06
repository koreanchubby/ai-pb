# 데이터 형식 약속 (API_CONTRACT)

> 화면(팀원 A)과 데이터(팀원 B)가 서로 기대하는 형식입니다. 형식을 바꾸려면 먼저 이 문서를 고치고 상대에게 알립니다.

## 1. `data/news.json` — 뉴스 분석 페이지·하우스뷰 시장근거용

- 만드는 곳: `scripts/fetch_news.py` (GitHub Actions `.github/workflows/news.yml`, 매시 17분)
- AI 설명: `scripts/summarize_news.py` (키가 있을 때만)
- 읽는 곳 (연결 예정, 팀원 A): 뉴스 분석 페이지(`data-view-panel="news"`), 하우스뷰·시장근거 화면
- 읽는 방법: `fetch('./data/news.json', { cache: 'no-store' })` — GitHub Pages에서 같은 저장소 파일이라 별도 서버가 필요 없습니다.

### 최상위

| 필드 | 형식 | 설명 |
|---|---|---|
| `schema_version` | 숫자 | 현재 `1`. 형식이 바뀌면 올립니다 |
| `generated_at` | ISO 시각(UTC, `Z`) | 수집 시각 |
| `demo` | true/false | `true`면 고정 샘플. 화면에 "데모 데이터" 표시 |
| `attribution` | 문자열 배열 | **화면 하단에 반드시 표시** (GDELT·FRED·연준·한국은행 출처 표기 의무) |
| `notice` | 문자열 | 면책·안내 문구 |
| `categories` | `{key: 한글이름}` | `rates` 금리, `fx` 환율, `oil` 유가, `etf` ETF, `semis` 반도체, `geopolitics` 지정학 |
| `sources` | 배열 | 출처별 수집 결과 `{source, ok, count?, skipped?, reason?}` |
| `items` | 배열 | 기사·지표 목록. **중요도 높은 순 → 최신순으로 정렬돼 있음** |

### `items[]`

| 필드 | 형식 | 설명 | 화면 표시 예 (가이드 6.2) |
|---|---|---|---|
| `id` | 문자열 | 고유 id (같은 기사는 항상 같은 id) | — |
| `title` | 문자열 | 제목 또는 지표 요약 | 카드 제목 |
| `url` | 문자열 | 원문·지표 링크 | "원문 보기" |
| `source` | 문자열 | 언론사 도메인 또는 기관명 | 출처 |
| `source_type` | `official` \| `market` \| `news` | 공식 발표 / 시장 지표 / 뉴스 | 기존 배지 `.source-type.official/.market/.news` 와 같은 이름 |
| `published_at` | ISO 시각(UTC) | 발표·수집 시각 | 한국시간으로 바꿔 `09:12` 형태 |
| `categories` | 문자열 배열 | 위 6개 key | 태그 |
| `importance` | 0~10 정수 | 공식 출처·여러 분류·큰 변동일수록 높음 | 7 이상이면 "주요" 표시 권장 |
| `value` | 객체 (시장 지표만) | `{latest, previous, change, unit, date, alert_threshold}` | 수치·변동 |
| `facts` | 문자열 \| null | 확인된 사실 | **확인된 사실** |
| `ai_interpretation` | 문자열 \| null | AI 해석 | **AI 해석** |
| `asset_impact` | 문자열 \| null | 내 자산 영향 (쉬운 말) | **내 자산 영향** (기존 `.news-impact`) |
| `counter_evidence` | 문자열 \| null | 반대 근거 | **반대 근거** |
| `change_condition` | 문자열 \| null | 판단 변경 조건 | **판단 변경 조건** |
| `ai_generated` | true (있을 때만) | AI가 쓴 문장 표시용 | "AI 작성" 표시 |
| `ai_attempts` | 정수 (있을 때만) | AI 설명 시도 횟수(최대 2) | 표시 안 함 |

- `facts` 등 AI 필드가 `null`이면 그 줄을 숨기거나 "AI 설명 준비 중"으로 표시합니다.
- AI 필드는 형식 검사(항목당 220자 이하 — 프롬프트는 200자 요청, 매수·매도 지시·비중 숫자 금지)를 통과한 것만 들어옵니다.
- `generated_at`은 **내용이 마지막으로 바뀐 시각**입니다. 수집 결과가 같으면 파일을 다시 쓰지 않습니다.

### 화면 연결 예시 (팀원 A 참고용, `app.js`에 넣을 때 서로 알리기)

```js
async function loadNews() {
  try {
    const res = await fetch('./data/news.json', { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null; // 실패하면 기존 데모 카드를 그대로 둔다
  }
}
// 카드 1개: source_type → 배지 클래스, published_at → 한국시간 HH:MM,
// title → h2, facts·asset_impact 등 → 문단, url → 원문 링크(새 창), attribution → 페이지 하단
```

## 2. `data/house_view.json` — 하우스뷰 합의 (월 1회)

- 만드는 곳: `scripts/house_view.py` (Actions `house_view.yml`, 입력 파일이 바뀔 때)
- 사람이 고치는 파일: `data/house_view_input.json` (방법: `docs/HOUSE_VIEW_GUIDE.md`)
- 읽는 곳 (연결 예정): 하우스뷰·시장근거 화면의 자산군별 확대·중립·축소 표
- 주요 필드: `month`, `demo`, `sources[]`(기관명·자료명·발간일·링크), `consensus.<자산키>.{view, label, tone, mean, n, votes, disagreement}`
- 자산 키: `kr_equity` 국내 주식 · `global_equity` 해외 주식 · `govbond` 국채 · `corpbond` 회사채 · `alternative` 금·리츠 · `cash` 현금성
- `tone`은 기존 화면 클래스 이름(`buy`·`hold`·`sell`)과 같습니다. `disagreement`가 `true`면 "기관 간 의견 불일치"를 함께 표시합니다.

## 3. 브라우저 저장 (`localStorage`) — PR #7

- 키: `aipb-v4-state`, 형식 버전 `1`
- 내용: `{ version, savedAt, state: {currentView, returnView, goal, spouse, children, estateTarget, estateTargetManual, estateMode, useTaa, useBand, answers, surveyIndex, heirShares}, fields: {입력칸 id: 값} }`
- 전문가 승인은 저장하지 않습니다.
- 형식을 바꾸면 `STORAGE_VERSION`을 올려 이전 저장값을 무시하게 합니다.
