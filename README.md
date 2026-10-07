# AI PB — 범용 AI Private Banker 웹앱

금융인공지능실습 11조 팀 프로젝트입니다.

- **앱 주소**: https://koreanchubby.github.io/ai-pb/
- **기준 버전**: 태그 `prototype-v4`

## 👉 작업 전에 꼭 읽기

| 문서 | 내용 |
|---|---|
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | **작업 시작 전·후 순서** (Pull → STATUS 갱신 → 브랜치 → PR → 리뷰 → Merge) |
| [docs/STATUS.md](docs/STATUS.md) | **지금 누가 무엇을 하고 있나** — 매번 작업 전·후 갱신 |
| [Issues](../../issues) | 각자 할 일과 완료 기준 |
| [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md) | 앱 목적, 9단계 흐름, 원칙 |
| [docs/DECISIONS.md](docs/DECISIONS.md) | 팀 결정 기록, 과목 요구사항·평가 |

## 산출물 문서

- [화면 시나리오](docs/SCREEN_SCENARIO.md)
- [플로우차트(구현 기준)](docs/FLOWCHART.md)
- [DB 설계](docs/DB_DESIGN.md)
- [주요 함수 설명서](docs/FUNCTIONS.md)
- [계산 재현 예시](docs/CALC_EXAMPLES.md)
- [사용 설명서](docs/USER_GUIDE.md)
- [라이브러리·API 정리](docs/LIBRARIES.md)
- [파라미터 근거 조사](docs/RESEARCH_PARAMETERS.md)
- [데이터 형식 약속](docs/API_CONTRACT.md)
- [하우스뷰 월간 입력 방법](docs/HOUSE_VIEW_GUIDE.md)
- [AI 명세 (예측·데이터셋·라벨링·백테스트·검증)](docs/AI_SPEC.md)

## 실행 방법

1. WebStorm에서 이 저장소를 Clone 합니다.
2. `index.html`을 열고 오른쪽 위 브라우저 아이콘을 누릅니다.

## 파일 구조

```
index.html            화면
app.js                계산과 화면 흐름
styles.css, v3.css    디자인
docs/                 팀 문서
.github/              PR 템플릿
```
 
