# 파라미터 근거 조사 (데모 가정 → 공개 자료 교체안)

> `docs/FUNCTIONS.md`에서 **[데모 가정]**으로 표시한 숫자를 무엇으로 바꿀 수 있는지 조사한 결과입니다.
> 상태: **적용** (`fix/assumptions`, 2026-10-04 준비 · 팀 합의 후 병합). A-4 권장값과 C-3 권고 구간이 app.js·참조 모델·테스트·문서에 반영되었습니다.
> 확인 방법: 각 기관 발표 페이지·PDF를 직접 열어 확인. J.P. Morgan 보도자료(2025-10-20) 수치는 별도로 한 번 더 대조함.

## 채택하면 바뀌는 것 (한눈에)

| 자산 | 현재 변동성/기대수익 | 제안 | 근거 기관 수 |
|---|---|---|---|
| 국내주식 ETF | 18 / 6.0 | 21 / 5.9 | 3 (JPM·Schwab·Vanguard, EM 대용) |
| 해외주식 ETF | 16 / 6.8 | 17 / 6.2 | 3 |
| 국채 | 5 / 3.0 | 4 / 4.0 | 3 |
| 회사채 | 6 / 3.8 | 7.5 / 5.0 | 3 |
| 금·리츠 | 13 / 4.5 | 16 / 6.5 | 2 |
| 사모펀드 | 18 / 8.0 | 20 / 10.0 | 2 |
| 현금 | 0.5 / 2.6 | 0.7 / 2.6 (원화 근거 필요) | — |

- 주의: 모두 **달러 기준**이고 한국 주식 전용 수치는 찾지 못해 신흥국(EM)으로 대신했다. 원화 기준으로 쓰려면 한·미 금리차 보정이 필요하다(미확인).
- J.P. Morgan 2027년판이 2026년 10월 중하순 발표 예정 → 나오면 갱신.
- 스트레스 손실률은 이번 조사 범위 밖(미확인). 2008·2020년 실제 낙폭으로 따로 근거를 댄다.

---

## A. 장기 자본시장 가정(CMA): 최신판

### A-1. 출처 요약
| 발행사 | 판 | 발표일 | 기준 | 기간 | URL |
|---|---|---|---|---|---|
| J.P. Morgan AM | 2026 LTCMA (30th ed.) | 2025-10-20 (데이터 2025-09-30) | USD, 연복리 | 10–15년 | [보도자료](https://am.jpmorgan.com/us/en/asset-management/institutional/about-us/media/press-releases/jp-morgan-releases-2026-long-term-capital-market-assumptions/), [USD 매트릭스 PDF](https://am.jpmorgan.com/content/dam/jpm-am-aem/global/en/insights/ltcma-2026-us-matrix_usd.pdf) |
| Schwab (Erdogan, McMoore) | 2026 LTCME | 2026-01-02 (데이터 2025-10-31) | USD | 10년 | [링크](https://www.schwab.com/learn/story/schwabs-long-term-capital-market-expectations) |
| Northern Trust AM | CMA 2026 ed. | 2026-01-15 | USD | 10년 | [보도자료](https://www.northerntrust.com/united-states/pr/2026/northern-trust-asset-management-forecasts-ai-driven-strength-in-private-marketsin-its-capital-markets-assumptions-2026-edition) |
| Vanguard VCMM | 분기 업데이트 | 2026-07-22 게시 (기준 2026-06-30) | USD | 10년 | [링크](https://corporate.vanguard.com/content/corporatesite/us/en/corp/vemo/vemo-return-forecasts.html) |
| BlackRock BII | CMA | 2026-08-11 게시 (기준 2026-06-30) | USD | 5년 등 | [링크](https://www.blackrock.com/institutions/en-us/insights/charts/capital-market-assumptions). 수치는 xlsx/Flourish 안에만 있어 추출 못 함 → **미확인** |

- **한국(KOSPI) 전용 수치**: JPM 2026 USD 매트릭스의 주식 행은 Japan, Hong Kong, China, EM, AC Asia ex-Japan까지만 있고 **Korea 행이 없다.** KRW 기준 매트릭스도 찾지 못함 → **미확인**. 그래서 EM과 AC Asia ex-Japan을 대용치로 썼다.
- JPM **2027 LTCMA**는 예년 일정대로라면 2026년 10월 중하순에 나온다. 발표되면 교체를 권한다.
- **주의**: PDF는 자동 추출로 읽었다. 보도자료 수치와는 일치하지만 변동성·상관계수는 원본 PDF로 한 번 더 육안 확인하길 권한다.

### A-2. 자산군별 수치 (기대수익률 %, 괄호 안은 연변동성 %)
| 앱 자산군 | JPM 2026 (USD) | Schwab 2026 | Northern Trust 2026 | Vanguard (2026-06-30) |
|---|---|---|---|---|
| 한국주식 대용: EM 주식 | 7.8 (20.93) | 6.8 | 미제시 | 2.0–4.0 |
| 한국주식 대용: AC Asia ex-Japan | 7.9 (20.84) | – | – | – |
| 글로벌주식: ACWI | 7.0 (16.78) | – | – | – |
| 미국 대형주 | 6.7 (16.47) | 5.9 | 6.8 | 4.2–6.2 |
| 선진국 ex-US | – | 7.0 | – | 4.5–6.5 |
| 국채: US Int. Treasuries | 4.0 (3.48) | 단기국채 3.4 | Treasuries 4.6 | 미추출 |
| 국채: World Govt Bonds (헤지) | 4.3 (4.02) | – | – | – |
| IG 회사채 | 5.2 (7.39) | Agg 4.8 | 5.0 | 미추출 |
| 금 | 5.5 (16.68) | – | – | – |
| US REITs | 8.8 (17.40) | 6.4 | 글로벌 부동산 6.2 | – |
| 사모펀드(PE) | 10.2 (19.78) | – | PE+VC 10.2 | – |
| 현금 | US Cash 3.1 (0.67) | 3.3 | – | – |

**발행사 간 차이**
- EM 주식: JPM 7.8과 Vanguard 2–4의 차이는 **약 4–6%p**로 가장 크다.
- 미국 주식: 4.2(Vanguard 하단)부터 6.8(Northern Trust)까지, 차이는 **약 2.6%p**다.
- 채권·PE는 발행사 간 차이가 **±0.5%p 이내**로 작다.

### A-3. 상관계수 (JPM 2026 USD 매트릭스)
| 자산쌍 | 상관계수 |
|---|---|
| US Large Cap – US Intermediate Treasuries | **-0.01** |
| AC World Equity – US Intermediate Treasuries | 0.00 |
| AC World Equity – World Govt Bonds (비헤지, FX 포함) | 0.39 |
| US Large Cap – US IG Corporate | 0.51 |

### A-4. 교체 권장값
산출 원칙은 B-1, B-2의 단순 평균 결합이다. 변동성은 수치를 제시한 곳이 JPM뿐이라 JPM 값을 썼다.

| 자산 | 현재 (변동성/수익률/스트레스) | 권장 변동성 | 권장 기대수익률 | 산출 근거 |
|---|---|---|---|---|
| 국내주식 ETF | 18 / 6.0 / -32 | **21** | **5.9** | EM 기준 3사 평균: (7.8 + 6.8 + 3.0) / 3. 변동성은 JPM EM 20.93 |
| 글로벌주식 ETF | 16 / 6.8 / -30 | **17** | **6.2** | JPM ACWI 7.0, Schwab 미국 65%/선진 35% 가중 약 6.3, Vanguard 같은 가중 약 5.3의 평균. 변동성은 JPM ACWI 16.78 |
| 국채 | 5 / 3.0 / +3 | **4** | **4.0 (USD 헤지 기준)** | JPM WGBI(헤지) 4.3, US Int 4.0, NT 4.6, Schwab 3.4 |
| 회사채 | 6 / 3.8 / -4 | **7.5** | **5.0** | JPM 5.2, NT 5.0, Schwab Agg 4.8 |
| 금·리츠 | 13 / 4.5 / -15 | **16** | **6.5** | 금 5.5와 REITs 6.4–8.8의 50:50 평균. 금–리츠 상관은 미확인이라 분산효과를 빼고 보수적으로 잡음 |
| 사모펀드 | 18 / 8.0 / -25 | **20** | **10.0** | JPM·NT 모두 10.2. 디스먼트 여부 미확인이라 0.2%p 할인 |
| 현금 | 0.5 / 2.6 / 0 | 0.7 | **2.6 유지 (KRW)** | USD 현금 3.1–3.3은 원화에 그대로 쓸 수 없다. 한국은행 기준금리 출처로 근거를 대야 함 → **미확인** |

- **KRW 환산 문제**: 위 수치는 모두 USD 기준이다. 원화 헤지 수익률은 대략 USD 수익률에서 (USD 금리 − KRW 금리)를 뺀 값이다. 한·미 금리 수치는 이번 조사에서 확인하지 않았다 → **미확인**.
- **스트레스 손실률**: 이번 조사 범위가 아니어서 근거가 없다 → **미확인**. 2008년, 2020년 실측 낙폭으로 별도로 근거를 대야 한다.

---

## B. 인용 검증

| # | 확인된 서지 | 상태 | 주장 지지 여부 | 근거 URL |
|---|---|---|---|---|
| 1 | Bates, J.M. & Granger, C.W.J. (1969). The Combination of Forecasts. *Operational Research Quarterly* (현 JORS) 20(4), 451–468. doi:10.2307/3008764 | 확인 | **부분 지지.** 예측 결합의 우위는 보이지만, 제안한 가중치는 과거 오차분산 기반이다. "동일가중" 근거로 쓰기엔 약함 | Crossref (doi.org/10.1057/jors.1969.103) |
| 2 | Timmermann, A. (2006). Forecast Combinations. In Elliott, Granger & Timmermann (Eds.), *Handbook of Economic Forecasting* Vol. 1, Ch. 4, 135–196. Elsevier. doi:10.1016/S1574-0706(05)01004-9 | 확인 | **지지.** 초록이 단순 결합이 정교한 방식보다 자주 우월한 이유를 다룬다고 명시 | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1574070605010049), [IDEAS](https://ideas.repec.org/b/eee/ecofor/1.html) |
| 3 | Leland, H.E. (1999). *Optimal Portfolio Management with Transactions Costs and Capital Gains Taxes.* UC Berkeley Haas, Research Program in Finance **Working Paper No. 290** | 확인 | **학술지 게재본 없음.** 워킹페이퍼로 인용해야 함. Gemini가 학술지라고 했다면 오류 | [IDEAS 저자목록](https://ideas.repec.org/f/ple236.html), Vanguard 2010 참고문헌 |
| 4 | Masters, S.J. (2003). Rebalancing: Establishing a Consistent Framework. *Journal of Portfolio Management*, Spring 2003 → 29(3) | 권호 확인 | 페이지 52–57은 **미확인**. 정식 제목에 부제가 있음 | [Capital Spectator 인용](https://capitalspectator.com/?p=2328) |
| 5 | Donohue, C. & Yip, K. (2003). Optimal Portfolio Rebalancing with Transaction Costs: Improving on Calendar- or Volatility-Based Strategies. *JPM* 29(4), 49–63 (Summer 2003) | 확인 (2차 인용) | 부제 있음 | [NR 논문 참고문헌](https://publ.nr.no/publications.nr.no/1503320049/rebalance-HLHolde-2013.pdf) |
| 6 | Kritzman, M., Page, S. & Turkington, D. (2012). Regime Shifts: Implications for Dynamic Strategies. *FAJ* 68(3), 22–39 (May 2012) | 확인 | 마르코프 국면전환 기반 동적 배분이 정적 배분보다 우월하다는 내용 | [IDEAS](https://ideas.repec.org/a/taf/ufajxx/v68y2012i3p22-39.html) |
| 7 | Black, F. & Litterman, R. (1992). Global Portfolio Optimization. *FAJ* 48(5), Sep/Oct 1992, p.28– | 확인 | 끝 페이지 43은 **미확인** | [Duke 사본](https://people.duke.edu/~charvey/Teaching/BA453_2006/Black_Litterman_Global_Portfolio_Optimization_1992.pdf) |
| 8 | Brinson, G.P., Hood, L.R. & Beebower, G.L. (1986). Determinants of Portfolio Performance. *FAJ* 42(4), Jul/Aug 1986, 39– | 권호 확인 | 끝 페이지가 출처마다 다름(44 또는 48) → **미확인**. 1995년 재수록본은 FAJ 51(1), 133–138. 결론: 정책 배분이 수익 **변동**의 93.6%를 설명. "수익률의 93.6%"로 쓰면 오인용 | [CFA 재수록](https://rpc.cfainstitute.org/research/financial-analysts-journal/1995/determinants-of-portfolio-performance), [ProQuest](https://www.proquest.com/docview/217550968) |
| 9 | Shefrin, H. & Statman, M. (2000). Behavioral Portfolio Theory. *JFQA* 35(2), 127–151 (June 2000) | 확인 | 다중 심리계좌·목표별 층위 구조. 버킷 전략의 행동재무 근거로도 쓸 수 있음 | [IDEAS](https://ideas.repec.org/a/cup/jfinqa/v35y2000i02p127-151_00.html) |
| 10 | Tetlock, P.C. (2007). Giving Content to Investor Sentiment: The Role of Media in the Stock Market. *JF* 62(3), 1139–1168 (June 2007) | 확인 | 언론 비관도가 하방 압력을 예측한 뒤 반전 | [IDEAS](https://ideas.repec.org/a/bla/jfinan/v62y2007i3p1139-1168.html) |
| 11 | Bengen, W.P. (1994). Determining Withdrawal Rates Using Historical Data. *Journal of Financial Planning*, October 1994 | 연·월 확인 | 7(4), 171–180은 **미확인**. 결론: 4% 인출, 주식 50–75% | [원문 PDF](https://freefincal.com/wp-content/uploads/2023/10/Bengen1.pdf), [FPA 2004 재수록](https://www.financialplanningassociation.org/sites/default/files/2021-04/MAR04%20Determining%20Withdrawal%20Rates%20Using%20Historical%20Data.pdf) |
| 12 | Grable, J. & Lytton, R.H. (1999). Financial risk tolerance revisited: the development of a risk assessment instrument. *Financial Services Review* 8(3), 163–181 | 확인 | 13문항 위험성향 설문의 근거 | [IDEAS](https://ideas.repec.org/a/eee/finser/v8y1999i3p163-181.html) |

### B-추가. 버킷 전략과 리밸런싱 밴드
| 논문 | 서지 | 결론 | URL |
|---|---|---|---|
| **지지** | Pfeiffer, S., Salter, J. & Evensky, H. (2013). The Benefits of a Cash Reserve Strategy in Retirement Distribution Planning. *Journal of Financial Planning* 26(9), 49–55 (Sep 2013) | 1년치 현금 리저브(CFR)를 두면, 세금·거래비용이 있을 때 30년 생존율이 RDCA보다 최대 6%p 높다 | [FPA](https://www.financialplanningassociation.org/article/journal/SEP13-benefits-cash-reserve-strategy-retirement-distribution-planning) |
| **반론 (함께 제시 권장)** | Estrada, J. (2018/2019). The Bucket Approach for Retirement: A Suboptimal Behavioral Trick? SSRN·IESE 워킹페이퍼 (학술지 게재 여부 **미확인**) | 21개국 115년 자료에서 정적 배분과 리밸런싱이 버킷보다 우월 | [IESE PDF](https://blog.iese.edu/jestrada/files/2019/07/BucketApproach.pdf) |
| **밴드 폭** | Jaconetti, C.M., Kinniry, F.M. Jr. & Zilbering, Y. (2010, July). *Best Practices for Portfolio Rebalancing.* Vanguard Research | 연 1회 또는 반기 점검과 **5% 임계치**가 위험 통제와 비용 사이의 합리적 균형이라고 결론 | [PDF](https://indexacapital.com/bundles/unaiadvisor/docs/papers/2010-Vanguard-Best-practices-for-portfolio-rebalancing.pdf?v=241) |

**요약**
- 동일가중 결합의 근거로는 Timmermann(2006)을 주 근거로 쓰고 Bates & Granger(1969)는 보조로 둔다.
- Leland는 워킹페이퍼로 표기한다.
- BHB는 "변동의 93.6%"로 정확히 인용한다.
- 버킷 전략은 지지 논문과 반론 논문을 함께 제시한다.
- **미확인 항목**: BlackRock·Vanguard 채권 수치, 한국 전용 CMA, KRW 금리, 스트레스 손실률, 일부 페이지 번호(4, 7, 8, 11번)

---

## C. 투자성향 설문 점수 구간

> 요약: 현재 데모 구간(≤20/28/37/45)은 금융투자협회 표준 예시·키움증권의 100점 기준 20/40/60/80 경계를 우리 원점수 범위(11~54)로 선형 환산한 값(19.6/28.2/36.8/45.4)과 거의 같다. **권고: ≤19 / ≤28 / ≤36 / ≤45 / ≥46** (1점씩 두 군데 조정).
> 우리 앱의 하향 규칙 `min(설문 성향, 손실감내 응답)`은 하나은행 준칙 별지 제2호(원금보존 → 안정형, 10% 이내 → 위험중립형 이하)보다 약간 더 보수적이다(−5% 응답 → 안정추구형).
> 이전 메모의 "신한투자증권 11문항 56점" 기준은 공개 출처를 찾지 못해 **미확인** → DECISIONS에서 근거로 쓰지 않는다.

### C-1. 금융투자협회 표준투자권유준칙

- **최신 버전과 시행일: 미확인.** law.kofia.or.kr 개정예고 목록(https://law.kofia.or.kr/service/revisionNotice/revisionNoticeList.do)은 열렸지만 준칙 본문과 별지는 직접 열지 못했다.
- 간접 근거로, 회원사 준칙이 2026-01-01에 일제히 개정되었다. 토스증권(https://corp.tossinvest.com/static/docs/Investment_Recommendation_2026_01_01.pdf, 개정이력 2020.11.18 제정 → … 2025.06.27 → 2026.01.01), 하나은행(아래 2절), 크레온(대신) 「투자권유준칙(07130-C)」이 여기에 해당한다. 한국투자증권 준칙은 2026.09.16에 최종 개정되었다(https://file.koreainvestment.com/updata/namo/231012_rule.pdf).
- 금융위는 2023-01-25 「투자성 상품 위험등급 산정 가이드라인」을 표준투자권유준칙에 반영해 2023년 4분기부터 적용한다고 밝혔다(https://www.fsc.go.kr/po010101/79327).
- **표준 예시 확인서 (2009년 표준준칙 기반).** 2009년 운용사 준칙 두 곳에 같은 예시가 그대로 실려 있다. AB자산운용 2009-06-30판(https://web.alliancebernstein.com/APAC/KO/Documents/Disclosures-Corporate/2009/2009-06-30-Investment-Solicitation-Rules.pdf)과 라자드코리아 2009-03-09 시행·2010-12-01 개정판(https://www.lazardassetmanagement.com/content/dam/lazard-asset-management/lmap-documents/63083/63086.pdf)이다. 현행 협회 별지와 같은지는 **미확인**이다.

| 문항 | 배점 |
|---|---|
| 1 연령 | 4 / 4 / 3 / 2 / 1 (고령일수록 낮음) |
| 2 투자기간 | 6개월 이내 1 ~ 3년 이상 5 |
| 3 투자경험 | 1~5 (중복 응답 시 최고점) |
| 4 금융지식 | 1~4 |
| 5 금융자산 중 투자비중 | 10% 이내 5 ~ 40% 이상 1 (역배점) |
| 6 수입원 | 3 / 2 / 1 |
| 7 손실감수 | 원금보전 **−2** / 2 / 4 / 6 |

- **산식:** 총점 32점을 100점으로 환산한다(합계 ÷ 32 × 100). 최저 원점수는 4점이다(1+1+1+1+1+1−2).
- **등급 구간 (별지 제2호):** 안정형 ≤20 / 안정추구형 20 초과~40 / 위험중립형 40 초과~60 / 적극투자형 60 초과~80 / 공격투자형 80 초과.
- **혼합 방식:** Part Ⅱ에서 고객이 고른 '위험선호 투자성향'이 점수 결과보다 높으면 점수 결과를 따른다(제5조제3항). 즉 **점수화에 하향 보정을 더한 방식**이다.
- 토스증권 2026-01-01 별지 제1호에도 배점표가 있다(손실감내 '원금을 잃을 수 없다' 0점 등). 다만 '혼합식 하향' 문구가 있는지는 두 번 조회한 결과가 서로 달라 **미확인**이다.

### C-2. 실제 금융회사 배점과 컷오프

| 회사 | 문항 / 만점 | 5등급 구간 | 출처(확인일 2026-10-03) |
|---|---|---|---|
| 키움증권 | 미확인 | 안정형 ≤20 / 안정추구 20~40 / 위험중립 40~60 / 적극 60~80 / 공격 >80 (100점 기준). 환산 여부는 페이지에 명시되지 않음 | https://www.kiwoom.com/wm/common/commFundRankInfoPop (게시일 미표기) |
| 하나은행 (은행, 증권사 아님) | 11문항, 42점 → 100점 환산 (31점 예시: 31/42×100 = 73.81) | 안정형 <47 / 안정추구 47~<59 / 위험중립 59~<73 / 적극 73~<87 / 공격 ≥87 | https://image.kebhana.com/cont/download/fundmall/mgtreport/a000000000353_agree.pdf ([별지 제2호], 시행 2026.01.01) |
| 대신(크레온) | 9항목 × 5점 = 45점 | 미확인 | https://money2.creontrade.com/e5/service/download/download.aspx?seq=95 (2026.01.01) |
| 신한투자증권 | 11문항 / 56점 (기존 메모) | ≤16 / 17~24 / 25~32 / 33~40 / ≥41 | **미확인.** 공개 출처를 찾지 못함 |

**하나은행 강제 분류 규칙 (원문 확인).** 다음 경우에는 점수와 관계없이 등급을 정한다.
- 목적이 '사용예정자금 단기운용'이거나, '원금보존 추구' 태도를 골랐거나, 손실감내 수준이 '원금보존추구'이면 → **안정형**
- 손실감내 수준이 '10% 이내'이면 → **위험중립형 이하**

**하나은행 배점 특징.** 손실감내 문항에 최대 10점이 배정돼 총점의 24%를 차지한다. 최저 원점수는 8점이다.

**참고 자료.**
- 2019-09-29 국회 지적: 표준준칙은 "문항과 배점 기준, 투자 적합성 판단 방식을 자율적으로 정할 수 있도록" 허용하고 있어, 회사마다 공격투자형 비율이 15.0%~61.4%로 크게 달랐다(https://www.sateconomy.co.kr/news/view/179589759531985).
- 2013-07-30 시대 기사도 80/60/40/20점 구간을 확인해 준다(https://www.sidae.com/article/2013072510328041306).

### C-3. 우리 앱 컷오프 제안 (원점수 범위 11~54, 폭 43)

**공통 식.** 원점수 x를 0~100으로 바꾼 뒤 출처의 경계를 적용한다.
- min–max 환산: x′ = 11 + (원점수 − 원점수 최저) / (만점 − 최저) × 43

| 방법 | 계산 | 안정형 | 안정추구 | 위험중립 | 적극 | 공격 |
|---|---|---|---|---|---|---|
| **현재 데모** | — | ≤20 | 21~28 | 29~37 | 38~45 | ≥46 |
| A. 표준·키움 20/40/60/80, 0~100 선형 (11 + 0.43c) | 19.6 / 28.2 / 36.8 / 45.4 | ≤19 | 20~28 | 29~36 | 37~45 | ≥46 |
| B. 표준 예시 문자 그대로 (x/54×100) | 10.8 / 21.6 / 32.4 / 43.2 | (해당 없음) | 11~21 | 22~32 | 33~43 | ≥44 |
| C. 표준 예시 min–max (원점수 4~32) | 경계 6.4 / 12.8 / 19.2 / 25.6 → 14.69 / 24.51 / 34.34 / 44.17 | ≤14 | 15~24 | 25~34 | 35~44 | ≥45 |
| D. 하나은행 min–max (원점수 8~42) | 경계 19.74 / 24.78 / 30.66 / 36.54 → 25.85 / 32.22 / 39.66 / 47.09 | ≤25 | 26~32 | 33~39 | 40~47 | ≥48 |
| E. 신한(미확인) min–max (11~56 가정) | 경계 16.5 / 24.5 / 32.5 / 40.5 → 16.26 / 23.90 / 31.54 / 39.19 | ≤16 | 17~23 | 24~31 | 32~39 | ≥40 |

**C의 계산 예.** 6.4 = 0.2 × 32이고, 11 + (6.4 − 4) / 28 × 43 = 14.69이다.

**D의 계산 예.** 19.74 = 0.47 × 42이고, 11 + (19.74 − 8) / 34 × 43 = 25.85이다.

**해석**
- 현재 데모값은 A(표준 20/40/60/80을 선형 대응)와 거의 같다. 경계 차이는 안정형 상한 20→19, 위험중립 상한 37→36의 1점뿐이다.
- B는 표준 환산식을 그대로 쓴 것이다. 최저점이 0이 아니어서 안정형이 아예 나오지 않는다. 표준 예시가 원금보전에 −2점을 주고 하향 규칙을 둔 이유가 이것으로 보인다(추정).
- C는 더 공격적인 쪽으로, D는 더 보수적인 쪽으로 분류된다. 은행인 하나은행이 보수적이다.
- **권고:** A(≤19 / ≤28 / ≤36 / ≤45 / ≥46)를 기본으로 쓰고, 다음 하향 규칙을 추가한다(근거: 표준 예시 제5조③, 하나은행 별지2, 금감원 2015 과락제).
  - 손실감내 = 1(원금보존) → 안정형
  - 손실감내 = 2(~10%) → 위험중립형 이하
  - 20% 급락 대응이 '전량 매도'처럼 가장 낮은 값 → 한 등급 하향 (데모용 설계, 출처 없음)

### C-4. 금소법과 2024~2026 당국 조치

- **금소법 시행:** 2021-03-25. 금융위의 2021-03-18 해명자료(https://www.fsc.go.kr/no010102/75577)는 적합성원칙 위반 시 과태료 최대 3천만원(징벌적 과징금 대상 아님)이며, 투자성향은 변경 가능하다고 밝혔다. 금투협은 2021-03-25 설명회에서 표준투자권유준칙 개정안을 소개했다(https://m.dailian.co.kr/news/view/975827).
- **제17조(적합성원칙) 요지:** 일반금융소비자를 상대로 면담·질문 등으로 투자성 상품의 거래 목적, 재산상황, 취득·처분 경험을 파악한다. 서명, 기명날인, 녹취 등으로 확인받아 유지·관리하고, 지체 없이 제공한다. 부적합한 상품은 권유하지 못한다.
  - 원문은 법령 사이트에서 열지 못했다. 위 요지는 라자드 금융소비자보호기준(https://www.lazardassetmanagement.com/docs/127689/…)의 인용으로 확인한 것이다.
  - 법률번호(제17112호)는 **미확인**이다.
- **2015-02-03 금감원:** 설문을 "점수화해 단순 합산하고 합산 점수만으로 투자성향을 결정"하는 관행을 지적하고 항목별 과락제를 도입하도록 개선을 추진했다(https://news.jkn.co.kr/post/774040).
- **2025-07-14 금융위 보도자료:** 일부 금융사는 6개 항목 중 일부를 누락하거나 "평가 점수를 미배정"했다. 이 때문에 원금보존이나 단기투자를 원하는 소비자에게도 ELS가 판매되었다. 개선 내용은 다음과 같다(https://www.fsc.go.kr/no010101/84921?curPage=84).
  - 6개 필수 확인정보(거래목적, 재산상황, 투자경험, 상품이해도, 위험선호, 연령)를 **모두** 고려
  - 특정 답변 유도 금지
  - 대면 권유 후 비대면 계약 유도 금지
  - 입법예고 기간: 2025.7.15~8.25
- **진행 경과**
  - 시행령 국무회의 의결: 2025-09-23. 공포 후 3개월이 지나 시행한다(세종 뉴스레터, https://shinkim.com/kor/media/newsletter/2987).
  - 감독규정 금융위 정례회의 의결: 2025-10-01. "내년 1월부터 시행"(https://dealsite.co.kr/articles/149202).
  - **정확한 시행일은 미확인**이다(2026년 1월).
- **고령투자자:**
  - 토스증권 준칙 제11조: 65세 이상에게 판매할 때 판매과정을 녹취하고 2영업일 이상 숙려기간을 준다.
  - 한국투자증권 준칙 제17조: 80세 이상에게는 원칙적으로 투자권유 유의상품을 판매하지 않는다.
  - 2024~2026년에 나온 별도의 고령자 투자성향 가이드는 **미확인**이다.
- **앱 점검:** 우리 설문은 6개 필수 요소를 모두 포함한다.
  - 연령: 나이 점수
  - 거래목적: 투자목적
  - 재산상황: 연소득, 금융자산 비중, 소득전망
  - 투자경험: 투자경험 상품, 경험기간
  - 상품이해도: 금융지식
  - 위험선호: 손실감내, 급락 대응

---

## D. 적용안을 실제로 넣어 본 결과 (2026-10-04, 데모 고객 기준)

`fix/assumptions` 적용안(업로드 묶음 5번 폴더)을 넣고 같은 입력으로 계산을 비교했다. 바꾼 것: `ASSUMPTIONS`의 변동성·기대수익(A-4 권장값), 국채–주식 상관 −0.2 → 0, 설문 구간 ≤19/≤28/≤36/≤45.

| 항목 | 현재 | 적용안 |
|---|---|---|
| 데모 고객 설문 점수·성향 | 35점 · 위험중립형 | 35점 · 위험중립형 (변화 없음) |
| 현재 포트폴리오 연 변동성 / 기대수익 | 9.2% / 5.31% | 10.39% / 5.85% |
| 목표안(SAA, 밴드 적용 전) 변동성 / 기대수익 | 7.18% / 4.87% | 8.07% / 5.65% |
| 최종 목표(밴드 적용 후, TAA 끔) 변동성 / 기대수익 | 7.20% / 4.87% | 8.09% / 5.66% |
| 최종 목표(TAA 반영) 변동성 / 기대수익 | 6.96% / 4.79% | 7.82% / 5.61% |
| 스트레스 손실(목표안) | −12.04% | −12.04% (스트레스 값은 안 바꿈) |
| **추천 비중(억원)** | 국내ETF 2 · 해외ETF 4.7 · 국채 10 · 회사채 2 · 대체 1.2 · 사모 4 · 현금 1.1 | **동일** |

- **추천 비중은 바뀌지 않는다.** 비중은 필수 안정자산·성향별 배분 비율로 정해지고, `ASSUMPTIONS`는 위험·수익을 "보여주는" 데만 쓰이기 때문이다. 바뀌는 것은 화면의 변동성·기대수익 숫자뿐이다.
- 설문 구간 변경으로 성향이 달라지는 고객은 **원점수가 정확히 20점(안정형 → 안정추구형)이거나 37점(위험중립형 → 적극투자형)** 인 경우뿐이다.
- 국채–주식 상관을 0으로 바꾸면 분산 효과가 줄어 변동성이 약간 올라간다(최근 기관 추정과 일치하는 방향).
- 남은 근거 공백: 스트레스 손실률, 과세 분배율, 원화 기준 보정 → 미확인으로 남김.
