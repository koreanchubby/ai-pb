# DB 설계 (초안)

> 교수님 진행 순서의 **4번째 산출물(DB 설계)** 초안입니다. 구현 가이드 5.4 "저장할 데이터"와 현재 v4 화면의 입력값을 기준으로 정리했습니다.
> 상태: 초안 (2026-10-03, 옥경환 작성) — 팀원 검토 후 확정

## 1. 저장 방식 단계

| 단계 | 저장소 | 언제 | 근거 |
|---|---|---|---|
| 1단계 (현재) | 브라우저 `localStorage` 1개 키 (`aipb-v4-state`) | PR #7 | 로그인 없는 MVP. 한 브라우저 안에서만 유지 |
| 1단계 (현재) | `data/news.json` 파일 | GitHub Actions | 뉴스·지표는 모든 사용자가 같은 내용을 보므로 파일로 충분 |
| 2단계 (필요 시) | Supabase(PostgreSQL) | 고객별 저장·다기기 공유가 필요할 때 | 강의자료(IT 기초 05)에서 BaaS 예시로 제시 |

아래 테이블 설계는 **2단계(관계형 DB)를 기준**으로 하고, 1단계 localStorage는 같은 구조를 JSON 하나로 묶어 저장합니다.

## 2. ERD

```mermaid
erDiagram
    CLIENT ||--o{ SURVEY_ANSWER : "응답"
    CLIENT ||--o{ FAMILY_MEMBER : "가족"
    CLIENT ||--o{ ASSET : "보유"
    CLIENT ||--|| GOAL : "목표"
    CLIENT ||--o{ RECOMMENDATION : "추천안"
    CLIENT ||--o| TRANSFER_PLAN : "승계안"
    TRANSFER_PLAN ||--o{ HEIR_SHARE : "배분"
    TRANSFER_PLAN ||--o{ EXPERT_REVIEW : "검토"
    RECOMMENDATION }o--o{ EVIDENCE : "근거로 사용"
    HOUSE_VIEW ||--o{ RECOMMENDATION : "기준"

    CLIENT {
        uuid id PK
        int age
        text employment "근로소득자/사업자/은퇴 예정/은퇴"
        int risk_profile "1~5, 설문 산출"
        timestamptz created_at
        timestamptz updated_at
    }
    SURVEY_ANSWER {
        uuid client_id FK
        int question_no "1~10"
        int option_index "선택지 번호(0부터), 앱이 저장하는 값"
        timestamptz answered_at
    }
    FAMILY_MEMBER {
        uuid id PK
        uuid client_id FK
        text relation "spouse/child"
        int order_no
    }
    ASSET {
        uuid id PK
        uuid client_id FK
        text category "realestate/kretf/globaletf/govbond/corpbond/pef/alternative/cash/debt"
        numeric amount_eok "억원"
        int redeemable_year "사모펀드만"
        bool must_hold "거주 부동산 등"
    }
    GOAL {
        uuid client_id PK
        text goal_type "general/retirement/transfer/both"
        int retirement_in_years
        numeric monthly_spend_manwon
        numeric pension_manwon
    }
    TRANSFER_PLAN {
        uuid id PK
        uuid client_id FK
        numeric estate_tax_estimate_eok
        numeric liquidity_target_eok
        text funding_mode "financial/insurance/installment"
        numeric insurance_reserve_eok
    }
    HEIR_SHARE {
        uuid plan_id FK
        uuid family_member_id FK
        numeric desired_pct
        numeric legal_pct
        numeric reserve_pct "유류분"
    }
    EXPERT_REVIEW {
        uuid id PK
        uuid plan_id FK
        text reviewer_type "tax/lawyer"
        text status "requested/in_review/approved/revision"
        text conditions
        timestamptz decided_at
    }
    HOUSE_VIEW {
        uuid id PK
        date as_of
        text source_label "기관명·자료명·발간일"
        jsonb views "자산군별 +1/0/-1"
    }
    RECOMMENDATION {
        uuid id PK
        uuid client_id FK
        uuid house_view_id FK
        int input_version
        bool use_taa
        jsonb target_weights
        jsonb trades
        timestamptz created_at
    }
    EVIDENCE {
        text id PK "news.json의 id"
        text title
        text url
        text source
        text source_type "official/market/news"
        timestamptz published_at
        timestamptz collected_at
        text facts
        text ai_interpretation
    }
```

## 3. 테이블 설명

| 테이블 | 무엇을 저장 | 화면 | 왜 필요한가 (가이드 5.4) |
|---|---|---|---|
| CLIENT | 연령, 현재 상태, 산출 성향 | 1 고객 정보 | 목표와 적합성의 기준 |
| SURVEY_ANSWER | 설문 10문항에서 고른 선택지 번호 | 1 고객 정보 | 성향 산출 근거 보존 (적합성 원칙 확인 기록) |
| FAMILY_MEMBER | 배우자·자녀 | 1 고객 정보 | 승계 사전진단에서 재사용 |
| GOAL | 목표 유형, 은퇴 시점·생활비·연금 | 2 목표 설계 | 조건부 경로와 은퇴 버킷 |
| ASSET | 자산 종류·금액, 사모펀드 환매 연도, 반드시 보유 | 3 자산 입력·진단 | 통합 자산 진단 |
| TRANSFER_PLAN / HEIR_SHARE | 상속세 추정, 재원 방식, 희망 배분·법정상속분·유류분 | 4 승계 사전진단 | 위험 신호와 전문가 검토 |
| HOUSE_VIEW | 기관 합의 하우스뷰 (+1/0/-1) | 5 하우스뷰 | 추천안의 기준 기록 (DECISIONS 2026-09-30) |
| RECOMMENDATION | 목표 배분, 거래 목록, TAA 반영 여부 | 6 설계·실행 | 결정 이력 보존 |
| EVIDENCE | 뉴스·지표 근거 | 5 하우스뷰, 뉴스 분석 | AI 판단의 추적 가능성 |
| EXPERT_REVIEW | 검토자, 상태, 승인 조건 | 8 전문가 검토 | 승인 전후 구분 |

## 4. 설계 원칙

- **금액 단위 통일**: 자산은 억원(`numeric`), 생활비·연금은 만원. 화면 입력 단위와 같게 둔다.
- **설문 원응답 보존**: 성향이나 점수가 아니라 **고른 선택지 번호**를 남긴다. 채점표(배점·구간)가 바뀌어도 다시 계산할 수 있다.
- **추천안은 덮어쓰지 않고 쌓는다**: `RECOMMENDATION`은 새 행으로 추가. 어떤 입력·하우스뷰·근거로 나왔는지 추적한다.
- **개인 식별정보는 받지 않는다**: 이름·주민번호·계좌번호 없음. `CLIENT.id`는 무작위 UUID.
- **전문가 승인은 별도 테이블**: 승인 전후를 구분하고, 승인 조건이 최종 리포트에 반영됐는지 확인한다.

## 5. 1단계(localStorage)와의 대응

| localStorage 필드 (`aipb-v4-state`) | 대응 테이블 |
|---|---|
| `fields.age`, `fields.employment` | CLIENT |
| `state.answers` | SURVEY_ANSWER |
| `state.spouse`, `state.children` | FAMILY_MEMBER |
| `state.goal`, `fields.retirement-years`, `fields.monthly-spend`, `fields.pension-income` | GOAL |
| `fields.asset-*`, `fields.pef-year`, `fields.lock-home` | ASSET |
| `fields.liquidity-target`(상속세 재원 목표), `fields.insurance-reserve` | TRANSFER_PLAN |
| `fields.lock-pef`(사모펀드 조정 불가), `fields.gift-window`(5년 내 증여 예정) | ASSET, TRANSFER_PLAN |
| `state.heirShares`, `state.estateMode`, `state.estateTarget`, `state.estateTargetManual`(목표를 직접 고쳤는지) | TRANSFER_PLAN, HEIR_SHARE |
| `state.useTaa`, `state.useBand`, `fields.band-switch` | RECOMMENDATION |
| `state.currentView`, `state.returnView`, `state.surveyIndex` | (화면 위치 — DB에는 저장 안 함) |
| (저장 안 함) 전문가 승인 | EXPERT_REVIEW |

## 6. 확정 전에 팀이 정할 것

- [ ] 2단계(Supabase)로 갈지, MVP는 localStorage로 끝낼지
- [ ] 하우스뷰 합의에 참여할 증권사 목록 (DECISIONS 2026-09-30)
- [ ] 설문 점수 구간을 표준 예시 환산값(≤19/≤28/≤36/≤45)으로 바꿀지 (`fix/assumptions`)
