# 플로우차트 (구현 기준 최신판)

> 교수님 진행 순서 **3번째 산출물(플로우차트)** 을 현재 구현(v4 + 이번 PR들)에 맞춰 다시 그린 판입니다. 2026-10-04, 옥경환.
> 처음 제출한 플로우차트는 React·FastAPI·Supabase를 가정했지만, 구현 가이드 개정(2026-10-02, DECISIONS)으로 **정적 웹앱(GitHub Pages) + GitHub Actions** 구조로 바뀌어 이 판으로 대체합니다. 화면별 상세는 `SCREEN_SCENARIO.md`.

## 1. 사용자 흐름도 — 화면 이동

```mermaid
flowchart TD
    A([앱 열기 · 설치한 앱 실행]) --> R{저장된 입력이<br>있나?}
    R -- 예 --> R1[마지막 단계·입력 복원<br>리포트에서 닫았으면 전문가 검토부터]
    R -- 아니오 --> P
    R1 --> P
    P[고객 정보·투자성향<br>연령·상태·가족·설문 10문항] --> P1{설문 10문항<br>모두 답했나?}
    P1 -- 아니오 --> P2[다음 단계 잠금] --> P
    P1 -- 예 --> G[관리 목표<br>일반 · 은퇴 · 승계 · 둘 다]
    G --> D[자산 입력·진단<br>억원 단위 · 진단 신호]
    D --> T{승계가<br>목표에 포함?}
    T -- 예 --> TR[승계 사전진단<br>희망 배분 · 법정상속분 · 유류분 · 상속세 재원]
    TR --> TR1{배분 합계<br>100%?}
    TR1 -- 아니오 --> TR
    TR1 -- 예 --> M
    T -- 아니오 --> M[하우스뷰·시장근거<br>SAA 유지 / TAA 반영]
    M --> AN[포트폴리오 설계·실행<br>목표 배분 · 밴드 · 실행 순서]
    AN --> TX[절세 전략<br>금융소득 2,000만원 기준]
    TX --> T2{승계가<br>목표에 포함?}
    T2 -- 예 --> E[전문가 검토<br>세무사·변호사]
    E --> E1{승인?}
    E1 -- 아니오 --> E
    E1 -- 예 --> RP
    T2 -- 아니오 --> RP[최종 AI 자문 리포트]
    RP --> PDF{리포트 저장?}
    PDF -- 예 --> PDF1[/인쇄 창 → PDF로 저장/]
    PDF -- 아니오 --> Z([끝])
    PDF1 --> Z
    N[뉴스 분석<br>고객용 별도 페이지] -. 언제든 오가기 .- P
```

- 일반·은퇴 목표: 7단계 / 승계 포함: 9단계 (`getFlow()`)
- 모든 입력은 0.3초 뒤 브라우저에 자동 저장

## 2. 처리 흐름도 — 데이터와 계산

```mermaid
flowchart LR
    subgraph GA["매시간 · GitHub Actions"]
      S1[/연준 RSS/] --> F[fetch_news.py<br>수집 · 분류 · 중복 제거 · 중요도]
      S2[/GDELT 뉴스/] --> F
      S3[/한국은행 ECOS/] --> F
      S4[/FRED/] --> F
      F --> AI[summarize_news.py<br>Claude API로 5칸 설명<br>매매 권유 차단 검사]
      AI --> NJ[(data/news.json)]
    end
    subgraph MONTH["월 1회"]
      H1[/사람이 증권사 의견 -1·0·1 입력/] --> HV[house_view.py<br>동일가중 합의]
      HV --> HJ[(data/house_view.json)]
    end
    NJ --> PG[GitHub Pages]
    HJ --> PG
    subgraph BROWSER["사용자 브라우저"]
      PG --> APP[앱 화면 app.js]
      U[/고객 입력/] --> APP
      APP <--> LS[(localStorage<br>입력 자동 저장)]
      APP --> CALC[계산 엔진<br>성향 · 은퇴 버킷 · 상속세 추정 · 목표 배분 · 위험·수익]
      CALC --> OUT[/진단 · 리포트 · PDF/]
      SW[서비스 워커] -. 오프라인 시 마지막 저장본 .-> APP
    end
```

### 설계 포인트

- **숫자는 계산 엔진, 설명은 AI**: AI는 5칸 설명만 쓰고 비중·매매 숫자는 정하지 않음. 계산 공식은 `FUNCTIONS.md`, 손계산 재현은 `CALC_EXAMPLES.md`
- **서버 없이 동작**: 정적 호스팅이라 수집·AI 설명은 GitHub Actions에서, API 키는 Actions Secrets에만
- **승계는 사전진단까지**: 상속세는 추정치, 법률 판단은 전문가 검토 후 확정
- **개인 식별정보를 받지 않음**: 이름·주민번호·계좌번호 없음, 입력은 사용자 브라우저에만 저장
