const views = {
  profile: { title: '고객 정보·투자성향' },
  goals: { title: '관리 목표 선택' },
  transfer: { title: '자산승계 사전진단' },
  dashboard: { title: '자산 입력·진단' },
  assets: { title: '자산 세부내역' },
  analysis: { title: '포트폴리오 설계·실행' },
  market: { title: '하우스뷰·시장 인텔리전스' },
  tax: { title: '절세 전략' },
  experts: { title: '전문가 검토' },
  report: { title: '최종 AI 자문 리포트' },
  news: { title: '뉴스 분석' }
};

const stepLabels = {
  profile: '고객 정보',
  goals: '목표 설계',
  transfer: '승계 사전진단',
  dashboard: '자산 입력·진단',
  analysis: '설계·실행',
  market: '하우스뷰',
  tax: '절세 전략',
  experts: '전문가 검토',
  report: '최종 리포트'
};

const goalContent = {
  retirement: {
    chip: '은퇴 준비 경로',
    client: '은퇴 현금흐름 관리',
    title: '은퇴 중심 경로',
    copy: '은퇴 버킷(현금성·채권 사다리)을 정한 뒤 자산 입력·진단으로 이동합니다. 승계 질문은 나오지 않습니다.',
    next: '자산 입력 계속',
    report: '은퇴 준비'
  },
  transfer: {
    chip: '자산승계 경로',
    client: '자산승계 사전관리',
    title: '자산승계 선행 경로',
    copy: '자산을 입력·진단한 뒤 승계 사전진단에서 상속세 재원 마련 방식을 정합니다.',
    next: '자산 입력 계속',
    report: '자산승계'
  },
  both: {
    chip: '은퇴·승계 통합 경로',
    client: '은퇴·승계 통합관리',
    title: '은퇴·승계 통합 경로',
    copy: '자산 입력·진단 후 승계 사전진단을 거쳐, 은퇴 버킷과 상속세 재원을 합산해 필요 안정자산으로 반영합니다.',
    next: '자산 입력 계속',
    report: '은퇴·자산승계'
  },
  general: {
    chip: '일반 자산관리 경로',
    client: '일반 자산관리',
    title: '일반 자산관리 경로',
    copy: '은퇴·승계 질문 없이 바로 자산 입력으로 이동합니다. 비상자금만 확보하고 투자성향별 모델로 설계합니다.',
    next: '자산 입력 계속',
    report: '일반 자산관리'
  }
};

// 금융투자협회 표준 5단계 투자성향. mix는 필수 안정자산을 뺀 나머지(성장 풀)의 배분 비율,
// equityCap은 금융자산 대비 주식 비중 적합성 한도(%)입니다.
const PROFILES = {
  1: { name: '안정형', mix: { equity: 0.15, bond: 0.65, alt: 0.05, cash: 0.15 }, equityCap: 20 },
  2: { name: '안정추구형', mix: { equity: 0.35, bond: 0.50, alt: 0.08, cash: 0.07 }, equityCap: 35 },
  3: { name: '위험중립형', mix: { equity: 0.55, bond: 0.32, alt: 0.10, cash: 0.03 }, equityCap: 50 },
  4: { name: '적극투자형', mix: { equity: 0.70, bond: 0.18, alt: 0.10, cash: 0.02 }, equityCap: 70 },
  5: { name: '공격투자형', mix: { equity: 0.85, bond: 0.05, alt: 0.10, cash: 0 }, equityCap: 90 }
};

// 투자성향 설문 (금융투자협회 표준 투자자정보확인서 문항 구성 참고). 소득 등은 정확한 값 대신 구간으로 받습니다.
const SURVEY = [
  { q: '투자 예정 기간은 어느 정도인가요?', options: [['1년 미만', 1], ['1~2년', 2], ['2~3년', 3], ['3~5년', 4], ['5년 이상', 5]] },
  { q: '투자해 본 상품 중 가장 위험한 것은 무엇인가요?', options: [['예금·적금', 1], ['국공채·MMF', 2], ['회사채·채권형 펀드', 3], ['주식·주식형 펀드·ETF', 4], ['ELS·파생·레버리지', 5]] },
  { q: '투자 경험 기간은 어느 정도인가요?', options: [['없음', 1], ['1년 미만', 2], ['1~3년', 3], ['3~5년', 4], ['5년 이상', 5]] },
  { q: '금융상품을 어느 정도 이해하고 계신가요?', options: [['거의 모름', 1], ['예금·적금 수준', 2], ['주식과 채권의 차이를 앎', 3], ['대부분의 상품을 이해', 4], ['파생상품까지 이해', 5]] },
  { q: '연간 소득은 어느 구간인가요?', options: [['3천만원 미만', 1], ['3천만~5천만원', 2], ['5천만~1억원', 3], ['1억~3억원', 4], ['3억원 이상', 5]] },
  { q: '앞으로 소득은 어떻게 될 것 같나요?', options: [['은퇴 등으로 감소', 1], ['불규칙할 것', 2], ['현재 수준 유지', 3], ['늘어날 것', 4]] },
  { q: '투자 목적에 가장 가까운 것은 무엇인가요?', options: [['원금 보전', 1], ['예금보다 조금 높은 수익', 2], ['물가상승률 + α', 3], ['시장 평균 수익', 4], ['높은 수익 추구', 5]] },
  { q: '전체 금융자산 중 이번 투자자금의 비중은?', options: [['10% 이하', 5], ['10~30%', 4], ['30~50%', 3], ['50~70%', 2], ['70% 이상', 1]] },
  { q: '1년 동안 감내할 수 있는 최대 손실은?', options: [['원금 손실 불가', 1], ['-5% 이내', 2], ['-10% 이내', 3], ['-20% 이내', 4], ['-30% 이상도 가능', 5]], loss: true },
  { q: '시장이 20% 급락하면 어떻게 하시겠어요?', options: [['전부 매도', 1], ['일부 매도', 2], ['그대로 유지', 3], ['일부 추가 매수', 4], ['적극 추가 매수', 5]] }
];
// 데모 응답 (62세 은퇴 예정 고객 · 위험중립형 산출)
const DEMO_ANSWERS = [4, 3, 3, 2, 3, 0, 2, 2, 2, 2];

const LOSS_LABELS = {
  1: '매우 낮음 · 원금 보전',
  2: '낮음 · 연 -5% 내외',
  3: '보통 · 연 -10% 내외',
  4: '높음 · 연 -20% 내외',
  5: '매우 높음 · 연 -30% 이상'
};

// 자산군별 장기 가정치: 변동성·기대수익 %, 스트레스 손실 %, 과세 분배율 %
// 변동성·기대수익: 공개 장기 자본시장 가정(CMA) 결합값 (docs/RESEARCH_PARAMETERS.md A-4)
//   J.P. Morgan 2026 LTCMA(2025-10-20), Schwab 2026 LTCME(2026-01-02), Northern Trust CMA 2026(2026-01-15),
//   Vanguard VCMM(2026-06-30 기준) 중 자산별로 수치가 있는 곳의 단순 평균(예측 결합: Timmermann, 2006).
//   변동성은 JPM 값. 모두 USD 기준(국채는 USD 헤지). 국내주식은 한국 전용 수치가 없어 신흥국(EM) 주식으로 대신함.
//   현금은 원화 기준 데모값 유지.
// 스트레스 손실·과세 분배율: 데모 가정(근거 미확인, 교체 대상)
const ASSUMPTIONS = {
  kretf: { vol: 21, ret: 5.9, stress: -32, income: 2.0 },
  globaletf: { vol: 17, ret: 6.2, stress: -30, income: 1.5 },
  govbond: { vol: 4, ret: 4.0, stress: 3, income: 3.0 },
  corpbond: { vol: 7.5, ret: 5.0, stress: -4, income: 4.0 },
  alternative: { vol: 16, ret: 6.5, stress: -15, income: 2.0 },
  pef: { vol: 20, ret: 10.0, stress: -25, income: 0 },
  cash: { vol: 0.7, ret: 2.6, stress: 0, income: 3.0 }
};
const LOW_COUPON_INCOME = 1.5;
const FIN_INCOME_THRESHOLD = 0.2; // 금융소득종합과세 기준 연 2,000만원 (억원)
const TAA_TILT = 0.02;
const BAND = 0.3;
const SATELLITE_LIMIT = 0.2;
const DEMO_SATELLITE = 2; // 해외 ETF 중 반도체 테마 ETF 보유액 (데모 가정)

const HOUSE_VIEW = [
  { asset: '국내 주식', view: '중립', tone: 'hold', reason: '밸류에이션 부담 완화, 수급 중립' },
  { asset: '해외 주식', view: '소폭 축소', tone: 'sell', reason: '장기금리 상승 압력 · 성장주 할인율 부담' },
  { asset: '국채', view: '확대', tone: 'buy', reason: '금리 상단 근접 · 듀레이션 분할 확대' },
  { asset: '회사채', view: '중립', tone: 'hold', reason: '우량등급 위주, 크레딧 스프레드 안정' },
  { asset: '금·리츠', view: '중립', tone: 'hold', reason: '인플레이션 헤지 수요 유지' },
  { asset: '현금성', view: '소폭 확대', tone: 'buy', reason: '변동성 확대 구간 대기자금' }
];

const ROW_META = {
  kretf: { label: '국내 주식 ETF', dot: 'stock' },
  globaletf: { label: '해외 주식 ETF', dot: 'stock' },
  govbond: { label: '국채 (신규 저쿠폰)', dot: 'bond' },
  corpbond: { label: '우량 회사채', dot: 'bond' },
  alternative: { label: '금·리츠', dot: 'alt' },
  pef: { label: '사모펀드', dot: 'alt' },
  cash: { label: '현금성 (MMF·CMA)', dot: 'cash' }
};
const TRADE_KEYS = ['kretf', 'globaletf', 'govbond', 'corpbond', 'alternative', 'pef', 'cash'];

const state = {
  currentView: 'profile',
  goal: 'both',
  spouse: 1,
  children: 2,
  heirs: [],
  estateTarget: 6.7,
  estateTargetManual: false,
  estateMode: 'financial',
  useTaa: false,
  useBand: true,
  expertApproved: false,
  allocationValid: true,
  plan: null,
  answers: DEMO_ANSWERS.map(function () { return null; }),
  surveyIndex: 0,
  returnView: 'profile'
};

const pageTitle = document.querySelector('#page-title');
const sidebar = document.querySelector('#sidebar');
const journeySteps = document.querySelector('#journey-steps');
const progressText = document.querySelector('#progress-text');
const progressBar = document.querySelector('#progress-bar');
const toast = document.querySelector('#toast');
const flowBack = document.querySelector('#flow-back');
const flowNext = document.querySelector('#flow-next');
const flowBackLabel = document.querySelector('#flow-back-label');
const flowNextLabel = document.querySelector('#flow-next-label');
const flowNextKicker = document.querySelector('#flow-next-kicker');
const flowPositionLabel = document.querySelector('#flow-position-label');

function $(selector) {
  return document.querySelector(selector);
}

function setText(selector, text) {
  document.querySelectorAll(selector).forEach(function (el) { el.textContent = text; });
}

function includesTransfer() {
  return state.goal === 'transfer' || state.goal === 'both';
}

function includesRetirement() {
  return state.goal === 'retirement' || state.goal === 'both';
}

function getFlow() {
  const flow = ['profile', 'goals', 'dashboard'];
  if (includesTransfer()) flow.push('transfer');
  flow.push('market', 'analysis', 'tax');
  if (includesTransfer()) flow.push('experts');
  flow.push('report');
  return flow;
}

function progressViewFor(viewName) {
  if (viewName === 'assets') return 'dashboard';
  return viewName;
}

function getFlowNavigation(viewName) {
  if (viewName === 'news') return { back: null, next: state.returnView, nextLabel: '상담으로 돌아가기', kicker: '투자자 페이지' };
  const afterDiagnosis = includesTransfer()
    ? { next: 'transfer', nextLabel: '승계 사전진단' }
    : { next: 'market', nextLabel: '하우스뷰·시장근거' };
  if (viewName === 'profile') return {
    back: null,
    next: 'goals',
    nextLabel: '관리 목표 선택',
    disabled: !surveyComplete(),
    disabledMessage: '투자성향 설문 10문항에 모두 답해주세요.'
  };
  if (viewName === 'goals') return { back: 'profile', next: 'dashboard', nextLabel: '자산 입력·진단' };
  if (viewName === 'dashboard') return Object.assign({ back: 'goals' }, afterDiagnosis);
  if (viewName === 'assets') return Object.assign({ back: 'dashboard' }, afterDiagnosis);
  if (viewName === 'transfer') return {
    back: 'dashboard',
    next: 'market',
    nextLabel: '하우스뷰·시장근거',
    disabled: !state.allocationValid,
    disabledMessage: '희망 배분 합계를 100%로 맞춰주세요.'
  };
  if (viewName === 'market') return { back: includesTransfer() ? 'transfer' : 'dashboard', next: 'analysis', nextLabel: '포트폴리오 설계·실행' };
  if (viewName === 'analysis') return {
    back: 'market',
    next: 'tax',
    nextLabel: '절세 전략',
    action: 'approve-rebalance'
  };
  if (viewName === 'tax') return {
    back: 'analysis',
    next: includesTransfer() ? 'experts' : 'report',
    nextLabel: includesTransfer() ? '전문가 검토' : '최종 리포트'
  };
  if (viewName === 'experts') return {
    back: 'tax',
    next: 'report',
    nextLabel: '최종 리포트',
    disabled: !state.expertApproved,
    disabledMessage: '전문가 승인 데모를 먼저 완료해주세요.'
  };
  return {
    back: includesTransfer() ? 'experts' : 'tax',
    next: null,
    nextLabel: '리포트 저장',
    kicker: '완료 작업',
    action: 'save-report'
  };
}

function renderFlowNavigation() {
  const config = getFlowNavigation(state.currentView);
  const flow = getFlow();
  const activeView = progressViewFor(state.currentView);
  const activeIndex = Math.max(0, flow.indexOf(activeView));
  flowBack.disabled = !config.back;
  flowBackLabel.textContent = config.back ? views[config.back].title : '처음 단계';
  flowNext.disabled = Boolean(config.disabled);
  flowNext.title = config.disabled ? config.disabledMessage : '';
  flowNextLabel.textContent = config.nextLabel;
  flowNextKicker.textContent = config.kicker || '다음 단계';
  flowNext.dataset.action = config.action || 'navigate';
  flowPositionLabel.textContent = activeView === 'news' ? '투자자 페이지 · 상담 흐름과 별개' : (activeIndex + 1) + ' / ' + flow.length + ' · ' + stepLabels[activeView];
}

function advanceCurrentView() {
  const config = getFlowNavigation(state.currentView);
  if (config.disabled) {
    showToast(config.disabledMessage);
    return;
  }
  if (config.action === 'approve-rebalance') {
    $('#approve-rebalance').click();
    return;
  }
  if (config.action === 'save-report') {
    $('#save-report').click();
    return;
  }
  if (config.next) navigate(config.next);
}

function showToast(message) {
  toast.querySelector('p').textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(function () {
    toast.classList.remove('show');
  }, 2500);
}

function renderJourney() {
  const flow = getFlow();
  const activeView = progressViewFor(state.currentView);
  const activeIndex = activeView === 'news' ? -1 : Math.max(0, flow.indexOf(activeView));
  journeySteps.innerHTML = '';
  flow.forEach(function (viewName, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.step = viewName;
    button.innerHTML = '<b>' + String(index + 1).padStart(2, '0') + '</b><span>' + stepLabels[viewName] + '</span>';
    if (index < activeIndex) button.classList.add('complete');
    if (viewName === activeView) button.classList.add('active');
    journeySteps.appendChild(button);
  });
  const displayIndex = activeIndex + 1;
  progressText.textContent = activeView === 'news' ? '— / ' + flow.length : displayIndex + ' / ' + flow.length;
  progressBar.style.width = (displayIndex / flow.length * 100) + '%';
}

function navigate(viewName, options) {
  const settings = options || {};
  if (!views[viewName]) return false;
  if ((viewName === 'transfer' || viewName === 'experts') && !includesTransfer()) {
    showToast('현재 목표에는 자산승계 단계가 포함되지 않습니다.');
    viewName = viewName === 'experts' ? 'report' : 'goals';
  }
  if (viewName === 'news' && state.currentView !== 'news') state.returnView = state.currentView;
  state.currentView = viewName;
  document.querySelectorAll('[data-view-panel]').forEach(function (panel) {
    panel.classList.toggle('active', panel.dataset.viewPanel === viewName);
  });
  document.querySelectorAll('.nav-list [data-view]').forEach(function (button) {
    button.classList.toggle('active', button.dataset.view === viewName);
  });
  pageTitle.textContent = views[viewName].title;
  renderJourney();
  renderFlowNavigation();
  sidebar.classList.remove('open');
  if (!settings.silent) window.scrollTo({ top: 0, behavior: 'smooth' });
  // 지연 이동(예: 리밸런싱 검토 완료 0.35초 뒤)도 저장되도록 화면 이동마다 저장을 예약합니다.
  scheduleSave();
  return true;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function formatAmount(value) {
  const number = round1(Number(value || 0));
  return (Number.isInteger(number) ? number.toFixed(0) : number.toFixed(1)) + '억원';
}

function formatShort(value) {
  const number = round1(Number(value || 0));
  return (Number.isInteger(number) ? number.toFixed(0) : number.toFixed(1)) + '억';
}

function formatSigned(value) {
  const number = round1(value);
  if (number === 0) return '0';
  return (number > 0 ? '+' : '') + formatShort(number);
}

function formatManwon(valueInEok) {
  return Math.round(valueInEok * 10000).toLocaleString('ko-KR') + '만원';
}

function pct(part, whole) {
  return whole > 0 ? part / whole * 100 : 0;
}

function pefYear() {
  return Math.round(Number($('#pef-year').value || 2029));
}

function numberOf(selector) {
  return Math.max(0, Number($(selector).value || 0));
}

function getAssets() {
  const assets = {};
  document.querySelectorAll('.asset-input').forEach(function (input) {
    assets[input.dataset.category] = Math.max(0, Number(input.value || 0));
  });
  assets.debt = numberOf('#asset-debt');
  return assets;
}

function ageScore(age) {
  if (age < 40) return 5;
  if (age < 50) return 4;
  if (age < 60) return 3;
  if (age < 70) return 2;
  return 1;
}

function surveyComplete() {
  return state.answers.every(function (answer) { return answer !== null; });
}

function surveyScore() {
  let score = ageScore(numberOf('#age'));
  let loss = 5;
  state.answers.forEach(function (answer, index) {
    if (answer === null) return;
    const value = SURVEY[index].options[answer][1];
    score += value;
    if (SURVEY[index].loss) loss = value;
  });
  // 구간: 금융투자협회 표준 예시·키움증권의 100점 기준 20/40/60/80 경계를
  // 이 설문의 원점수 범위(11~54)로 선형 환산 → 19.6/28.2/36.8/45.4 (docs/RESEARCH_PARAMETERS.md C-3)
  let declared;
  if (score <= 19) declared = 1;
  else if (score <= 28) declared = 2;
  else if (score <= 36) declared = 3;
  else if (score <= 45) declared = 4;
  else declared = 5;
  return { score: score, declared: declared, loss: loss };
}

function getProfile() {
  const result = surveyScore();
  const level = Math.min(result.declared, result.loss);
  return Object.assign({ level: level, declared: result.declared, loss: result.loss, score: result.score }, PROFILES[level]);
}

// ---------- 은퇴 버킷 ----------

function retirementBuckets() {
  const spend = numberOf('#monthly-spend');
  const pension = numberOf('#pension-income');
  const retired = $('#employment').value === '은퇴';
  const years = retired ? 0 : numberOf('#retirement-years');
  const gap = Math.max(0, spend - pension);
  const emergency = spend * 6 / 10000;
  const bucket1 = gap * 24 / 10000 + emergency;
  const bucket2 = gap * 60 / 10000;
  return { spend: spend, gap: gap, years: years, emergency: emergency, bucket1: bucket1, bucket2: bucket2, reserve: bucket1 + bucket2 };
}

// ---------- 상속 ----------

function legalWeights() {
  const weights = [];
  if (state.spouse) weights.push(1.5);
  for (let i = 0; i < state.children; i += 1) weights.push(1);
  return weights;
}

function buildHeirs(useLegalDefaults) {
  const weights = legalWeights();
  const total = weights.reduce(function (acc, w) { return acc + w; }, 0);
  const heirs = [];
  if (state.spouse) heirs.push({ key: 'spouse', label: '배우자', note: '현금·채권 중심' });
  for (let i = 0; i < state.children; i += 1) {
    heirs.push({ key: 'child' + (i + 1), label: '자녀 ' + (i + 1), note: i === state.children - 1 && i > 0 ? '부동산 지분 포함' : '금융자산 중심' });
  }
  heirs.forEach(function (heir, index) {
    heir.legal = total > 0 ? weights[index] / total * 100 : 0;
    heir.reserve = heir.legal / 2;
  });
  if (useLegalDefaults) {
    let assigned = 0;
    heirs.forEach(function (heir, index) {
      heir.share = index === heirs.length - 1 ? 100 - assigned : Math.round(heir.legal);
      assigned += heir.share;
    });
  } else {
    const defaults = [40, 35, 25];
    heirs.forEach(function (heir, index) { heir.share = defaults[index]; });
  }
  state.heirs = heirs;
  renderHeirInputs();
}

function renderHeirInputs() {
  const container = $('#heir-inputs');
  if (!state.heirs.length) {
    container.innerHTML = '<div class="micro-note">입력된 상속인이 없습니다. 고객 정보에서 가족 구성을 입력하세요.</div>';
    return;
  }
  container.innerHTML = state.heirs.map(function (heir, index) {
    return '<div class="heir-input"><div><span>' + heir.label + '</span><small>법정 ' + heir.legal.toFixed(1) + '% · 유류분 ' + heir.reserve.toFixed(1) + '%</small></div>' +
      '<div class="input-suffix"><input class="heir-share" data-heir-index="' + index + '" type="number" value="' + heir.share + '" min="0" max="100"><span>%</span></div></div>';
  }).join('');
}

function inheritanceTaxRate(base) {
  if (base <= 1) return base * 0.1;
  if (base <= 5) return base * 0.2 - 0.1;
  if (base <= 10) return base * 0.3 - 0.6;
  if (base <= 30) return base * 0.4 - 1.6;
  return base * 0.5 - 4.6;
}

function estimateEstateTax(net, financial) {
  const lump = 5;
  let spouseDeduction = 0;
  const spouseHeir = state.heirs.find(function (heir) { return heir.key === 'spouse'; });
  if (spouseHeir) {
    const actual = net * spouseHeir.share / 100;
    const legal = net * spouseHeir.legal / 100;
    spouseDeduction = Math.max(5, Math.min(actual, legal, 30));
  }
  let financialDeduction;
  if (financial <= 0.2) financialDeduction = financial;
  else if (financial <= 1) financialDeduction = 0.2;
  else financialDeduction = Math.min(2, financial * 0.2);
  const base = Math.max(0, net - lump - spouseDeduction - financialDeduction);
  const tax = Math.max(0, inheritanceTaxRate(base)) * 0.97;
  return { lump: lump, spouseDeduction: spouseDeduction, financialDeduction: financialDeduction, base: base, tax: round1(tax) };
}

function estateReserve() {
  const target = state.estateTarget;
  const insurance = numberOf('#insurance-reserve');
  const factor = state.estateMode === 'installment' ? 0.3 : 1;
  return Math.max(0, target * factor - insurance);
}

// ---------- 포트폴리오 산출 ----------

function portfolioStats(h) {
  const keys = Object.keys(ASSUMPTIONS);
  const total = keys.reduce(function (acc, key) { return acc + (h[key] || 0); }, 0);
  if (total <= 0) return { vol: 0, ret: 0, stress: 0, income: 0, equityPct: 0 };
  const w = {};
  keys.forEach(function (key) { w[key] = (h[key] || 0) / total; });
  const risky = ['kretf', 'globaletf', 'corpbond', 'alternative', 'pef'];
  function corr(a, b) {
    if (a === b) return 1;
    if (a === 'cash' || b === 'cash') return 0;
    // 국채–주식: JPM 2026 LTCMA 상관 -0.01~0.00 → 0. 국채–회사채·대체는 데모 가정 0.2 유지
    if (a === 'govbond' || b === 'govbond') return (a.indexOf('etf') > -1 || b.indexOf('etf') > -1) ? 0 : 0.2;
    if (risky.indexOf(a) > -1 && risky.indexOf(b) > -1) return (a.indexOf('etf') > -1 && b.indexOf('etf') > -1) ? 0.8 : 0.5;
    return 0;
  }
  let variance = 0;
  keys.forEach(function (a) {
    keys.forEach(function (b) {
      variance += w[a] * w[b] * ASSUMPTIONS[a].vol * ASSUMPTIONS[b].vol * corr(a, b);
    });
  });
  let ret = 0;
  let stress = 0;
  keys.forEach(function (key) {
    ret += w[key] * ASSUMPTIONS[key].ret;
    stress += w[key] * ASSUMPTIONS[key].stress;
  });
  return { vol: Math.sqrt(variance), ret: ret, stress: stress, equityPct: (w.kretf + w.globaletf) * 100 };
}

function financialIncome(holdings, currentGovbond, lowCoupon) {
  let income = 0;
  Object.keys(ASSUMPTIONS).forEach(function (key) {
    if (key === 'govbond' && lowCoupon) {
      const kept = Math.min(currentGovbond, holdings.govbond);
      const added = Math.max(0, holdings.govbond - currentGovbond);
      income += kept * ASSUMPTIONS.govbond.income / 100 + added * LOW_COUPON_INCOME / 100;
    } else {
      income += (holdings[key] || 0) * ASSUMPTIONS[key].income / 100;
    }
  });
  return income;
}

function computePlan() {
  const a = getAssets();
  const profile = getProfile();
  const retirement = retirementBuckets();
  const equityNow = a.kretf + a.globaletf;
  const financial = equityNow + a.govbond + a.corpbond + a.pef + a.alternative + a.cash;
  const total = financial + a.realestate;
  const net = total - a.debt;
  const illiquid = a.realestate + a.pef;
  const investable = financial - a.pef;

  const estate = estimateEstateTax(net, financial);
  if (!state.estateTargetManual) state.estateTarget = estate.tax;
  const estateNeed = includesTransfer() ? estateReserve() : 0;

  // 1) 필수 안정자산: 현금성(버킷1 또는 비상자금) + 채권(버킷2 + 상속세 재원)
  let cashFloor = includesRetirement() ? retirement.bucket1 : retirement.emergency;
  let bondFloor = (includesRetirement() ? retirement.bucket2 : 0) + estateNeed;
  const floorTotal = cashFloor + bondFloor;
  const shortfall = Math.max(0, floorTotal - investable);
  if (shortfall > 0 && floorTotal > 0) {
    const scale = investable / floorTotal;
    cashFloor *= scale;
    bondFloor *= scale;
  }
  // 2) 조정 불가 자산(사모펀드)은 고정, 3) 나머지를 성향별 모델로 배분
  const pool = Math.max(0, investable - cashFloor - bondFloor);
  const mix = profile.mix;
  const equity = pool * mix.equity;
  const raw = {
    kretf: equity * 0.3,
    globaletf: equity * 0.7,
    govbond: bondFloor + pool * mix.bond * 0.5,
    corpbond: pool * mix.bond * 0.5,
    alternative: pool * mix.alt,
    pef: a.pef,
    cash: cashFloor + pool * mix.cash
  };
  // 장기 SAA 목표(설계 단계에서 고객에게 설명하는 안): 현금성은 합계를 맞추는 잔여값
  const saa = {};
  let saaSum = 0;
  TRADE_KEYS.forEach(function (key) {
    if (key === 'cash') return;
    saa[key] = key === 'pef' ? a.pef : round1(raw[key]);
    saaSum += saa[key];
  });
  saa.cash = Math.max(0, round1(financial - saaSum));

  // 4) 하우스뷰 TAA: 해외 주식 소폭 축소 → 국채·현금성
  const taaTilt = round1(Math.min(TAA_TILT * financial, raw.globaletf));
  let tilt = 0;
  if (state.useTaa) {
    tilt = taaTilt;
    raw.globaletf -= tilt;
    raw.govbond += round1(tilt / 2);
    raw.cash += round1(tilt - round1(tilt / 2));
  }

  // 허용범위 밴드: 소액 차이는 거래하지 않고 현금성으로 정산
  const target = {};
  const skipped = {};
  let netTrade = 0;
  TRADE_KEYS.forEach(function (key) {
    if (key === 'cash') return;
    let value = key === 'pef' ? a.pef : round1(raw[key]);
    if (state.useBand && key !== 'pef' && Math.abs(value - a[key]) < BAND && Math.abs(value - a[key]) > 0) {
      value = a[key];
      skipped[key] = true;
    }
    target[key] = value;
    netTrade += value - a[key];
  });
  target.cash = Math.max(0, round1(a.cash - netTrade));

  const current = { kretf: a.kretf, globaletf: a.globaletf, govbond: a.govbond, corpbond: a.corpbond, alternative: a.alternative, pef: a.pef, cash: a.cash };
  const statsNow = portfolioStats(current);
  const statsTarget = portfolioStats(target);
  const incomeNow = financialIncome(current, a.govbond, false);
  const incomeTarget = financialIncome(target, a.govbond, true);
  const turnover = TRADE_KEYS.reduce(function (acc, key) { return acc + Math.abs(target[key] - current[key]); }, 0) / 2;

  return {
    a: a, profile: profile, retirement: retirement, estate: estate, estateNeed: estateNeed,
    financial: financial, total: total, net: net, illiquid: illiquid, investable: investable,
    cashFloor: cashFloor, bondFloor: bondFloor, floorTotal: floorTotal, shortfall: shortfall,
    pool: pool, tilt: tilt, taaTilt: taaTilt, saa: saa, statsSaa: portfolioStats(saa),
    current: current, target: target, skipped: skipped,
    statsNow: statsNow, statsTarget: statsTarget, incomeNow: incomeNow, incomeTarget: incomeTarget,
    turnover: turnover,
    stableNow: a.cash + a.govbond + a.corpbond,
    stableTarget: target.cash + target.govbond + target.corpbond
  };
}

// ---------- 렌더링 ----------

function renderSurvey() {
  const index = state.surveyIndex;
  const item = SURVEY[index];
  const answered = state.answers.filter(function (answer) { return answer !== null; }).length;
  $('#survey-step').textContent = (index + 1) + ' / ' + SURVEY.length;
  $('#survey-bar').style.width = ((index + 1) / SURVEY.length * 100) + '%';
  $('#survey-count').textContent = answered + ' / ' + SURVEY.length + ' 응답';
  $('#survey-question').textContent = item.q;
  $('#survey-options').innerHTML = item.options.map(function (option, i) {
    const selected = state.answers[index] === i;
    return '<button type="button" role="radio" aria-checked="' + selected + '" class="survey-option' + (selected ? ' selected' : '') + '" data-answer="' + i + '">' + option[0] + '</button>';
  }).join('');
  $('#survey-prev').disabled = index === 0;
  $('#survey-next').disabled = index === SURVEY.length - 1;
}

function renderProfile(plan) {
  renderSurvey();
  const p = plan.profile;
  const box = $('#survey-result');
  if (!surveyComplete()) {
    const left = state.answers.filter(function (answer) { return answer === null; }).length;
    box.innerHTML = '<span>설문 결과</span><strong>응답 대기</strong><p>' + left + '문항이 남았습니다. 모두 답하면 투자성향이 산출됩니다.</p>';
    return;
  }
  let note;
  if (p.loss < p.declared) {
    note = '설문 점수는 ' + PROFILES[p.declared].name + '이지만 손실 감내 응답(' + LOSS_LABELS[p.loss] + ')이 더 보수적이어서 ' + p.name + '을 적용합니다.';
  } else {
    note = '설문 점수와 손실 감내 응답 중 더 보수적인 쪽을 모델 포트폴리오에 적용합니다.';
  }
  let html = '<span>설문 결과 · 연령 포함 ' + p.score + '점</span><strong>' + p.name + '</strong>' +
    '<div class="survey-scale">' + [1, 2, 3, 4, 5].map(function (level) {
      return '<i class="' + (level === p.level ? 'on' : level === p.declared ? 'declared' : '') + '" title="' + PROFILES[level].name + '"></i>';
    }).join('') + '</div><p>' + note + '</p>';
  if (numberOf('#age') >= 65) html += '<p class="survey-warn">65세 이상 고령투자자: 고위험 상품 권유 시 녹취·숙려 절차를 확인합니다.</p>';
  box.innerHTML = html;
}

function renderSummary(plan) {
  const a = plan.a;
  setText('[data-kpi="total"]', formatAmount(plan.total));
  setText('[data-kpi="net"]', formatAmount(plan.net));
  setText('[data-kpi="illiquid"]', formatAmount(plan.illiquid));
  setText('[data-kpi="liquidity"]', formatAmount(plan.floorTotal));
  setText('[data-kpi="estate-tax"]', formatAmount(plan.estate.tax));
  $('#goal-illiquid').textContent = '부동산·사모펀드 ' + formatAmount(plan.illiquid);
  $('#goal-family').textContent = '배우자 ' + state.spouse + '명 · 자녀 ' + state.children + '명';

  const equity = a.kretf + a.globaletf;
  const bonds = a.govbond + a.corpbond;
  const alternatives = a.pef + a.alternative;
  if (plan.total > 0) {
    const pReal = pct(a.realestate, plan.total);
    const pEquity = pct(equity, plan.total);
    const pBond = pct(bonds, plan.total);
    const pAlt = pct(alternatives, plan.total);
    const pCash = Math.max(0, 100 - pReal - pEquity - pBond - pAlt);
    const c1 = pReal;
    const c2 = c1 + pEquity;
    const c3 = c2 + pBond;
    const c4 = c3 + pAlt;
    $('#asset-donut').style.background = 'conic-gradient(var(--navy) 0 ' + c1 + '%,var(--blue) ' + c1 + '% ' + c2 + '%,#77a5ff ' + c2 + '% ' + c3 + '%,var(--violet) ' + c3 + '% ' + c4 + '%,#d0dced ' + c4 + '% 100%)';
    $('#realestate-share').textContent = Math.round(pReal) + '%';
    $('#asset-legend').innerHTML =
      '<div><i class="legend re"></i><span>부동산</span><b>' + formatAmount(a.realestate) + '</b><em>' + Math.round(pReal) + '%</em></div>' +
      '<div><i class="legend stock"></i><span>주식 ETF</span><b>' + formatAmount(equity) + '</b><em>' + Math.round(pEquity) + '%</em></div>' +
      '<div><i class="legend bond"></i><span>국채·회사채</span><b>' + formatAmount(bonds) + '</b><em>' + Math.round(pBond) + '%</em></div>' +
      '<div><i class="legend alt"></i><span>사모·대체투자</span><b>' + formatAmount(alternatives) + '</b><em>' + Math.round(pAlt) + '%</em></div>' +
      '<div><i class="legend cash"></i><span>현금·예금</span><b>' + formatAmount(a.cash) + '</b><em>' + Math.round(pCash) + '%</em></div>';
  }

  $('#ac-re').textContent = '부동산 ' + formatShort(a.realestate) + ' · 총자산의 ' + Math.round(pct(a.realestate, plan.total)) + '%';
  $('#ac-etf').textContent = '국내 ' + formatShort(a.kretf) + ' · 해외 ' + formatShort(a.globaletf);
  $('#ac-bond').textContent = '국채 ' + formatShort(a.govbond) + ' · 우량회사채 ' + formatShort(a.corpbond);
  $('#ac-pef').textContent = '최근 평가액 ' + formatShort(a.pef) + ' · ' + pefYear() + '년 만기';
  $('#ac-alt').textContent = '금·리츠 ' + formatShort(a.alternative);
  $('#ac-cash').textContent = '즉시 가용 ' + formatShort(a.cash);
}

function renderGoals(plan) {
  const r = plan.retirement;
  $('#bucket1').textContent = formatAmount(r.bucket1);
  $('#bucket2').textContent = formatAmount(r.bucket2);
  $('#retirement-reserve').textContent = formatAmount(r.reserve);
  $('#retirement-copy').textContent = '월 부족분 ' + r.gap.toLocaleString('ko-KR') + '만원 · 은퇴 ' + r.years + '년 후 개시. 20년치를 한꺼번에 현금으로 두지 않고 버킷별로 나눠 준비합니다.';
  $('#dashboard-retirement-reserve').textContent = includesRetirement() ? formatAmount(r.reserve) : '비상자금 ' + formatShort(r.emergency);
  $('#dashboard-liquidity-target').textContent = includesTransfer() ? formatAmount(plan.estateNeed) : '미적용';
  $('#dashboard-lock-home').textContent = $('#lock-home').checked ? '거주 부동산' : '없음';
}

function renderTransfer(plan) {
  const e = plan.estate;
  $('#estate-breakdown').innerHTML =
    '<div><span>순자산(추정 상속재산)</span><b>' + formatAmount(plan.net) + '</b></div>' +
    '<div><span>일괄공제</span><b>-' + formatAmount(e.lump) + '</b></div>' +
    (state.spouse ? '<div><span>배우자공제</span><b>-' + formatAmount(e.spouseDeduction) + '</b></div>' : '') +
    '<div><span>금융재산공제</span><b>-' + formatAmount(e.financialDeduction) + '</b></div>' +
    '<div><span>과세표준</span><b>' + formatAmount(e.base) + '</b></div>' +
    '<div class="total"><span>예상 상속세 (신고세액공제 3% 반영)</span><b>' + formatAmount(e.tax) + '</b></div>';
  const input = $('#liquidity-target');
  if (document.activeElement !== input) input.value = round1(state.estateTarget);
  $('#current-stable').textContent = formatAmount(plan.stableNow);
  $('#liquidity-target-output').textContent = formatAmount(plan.floorTotal);
  const modeCopy = {
    financial: '상속세 재원 ' + formatShort(plan.estateNeed) + '을 국채·우량채 만기 사다리로 보유합니다.',
    insurance: '종신보험으로 준비한 재원을 빼고 ' + formatShort(plan.estateNeed) + '만 채권으로 보유합니다.',
    installment: '연부연납(최대 10년, 가산금 발생)을 전제로 초기 납부분 ' + formatShort(plan.estateNeed) + '만 채권으로 보유합니다.'
  };
  $('#transfer-next-copy').textContent = modeCopy[state.estateMode] + ' 은퇴 버킷과 합산한 필요 안정자산 ' + formatShort(plan.floorTotal) + '과 매각 제한을 리밸런싱 제약으로 전달합니다.';
}

function analyzeDistribution(showMessage) {
  const heirs = state.heirs;
  const sum = heirs.reduce(function (acc, heir) { return acc + heir.share; }, 0);
  state.allocationValid = heirs.length === 0 || sum === 100;
  const sumBadge = $('#allocation-sum');
  const riskCard = $('#transfer-risk-card');
  const title = $('#transfer-risk-title');
  const copy = $('#transfer-risk-copy');
  const legalFlag = $('#legal-flag');
  sumBadge.textContent = '합계 ' + sum + '%';
  sumBadge.classList.toggle('invalid', !state.allocationValid);
  riskCard.classList.remove('high', 'low');

  const belowReserve = heirs.filter(function (heir) { return heir.share < heir.reserve; });
  const belowLegal = heirs.filter(function (heir) { return heir.share < heir.legal * 0.75; });
  const a = getAssets();
  const realEstateHeavy = a.realestate > (a.realestate + a.kretf + a.globaletf + a.govbond + a.corpbond + a.pef + a.alternative + a.cash) * 0.5;
  const realEstateNote = realEstateHeavy ? ' 부동산 비중이 절반 이상이라 현물 분할·공동소유 문제도 함께 검토해야 합니다.' : '';

  if (!state.allocationValid) {
    riskCard.classList.add('high');
    title.textContent = '입력 확인 필요';
    copy.textContent = '관계자별 희망 배분의 합계가 100%가 아닙니다. 배분안을 먼저 수정하세요.';
    legalFlag.textContent = '진단 보류';
  } else if (belowReserve.length) {
    riskCard.classList.add('high');
    title.textContent = '법률 검토 우선순위: 높음';
    copy.textContent = belowReserve.map(function (heir) { return heir.label; }).join('·') + '의 배분이 유류분(법정상속분의 1/2)에 못 미칩니다. 유류분 반환청구 가능성을 변호사가 우선 검토해야 합니다.' + realEstateNote;
    legalFlag.textContent = '유류분 미달';
  } else if (belowLegal.length) {
    title.textContent = '법률 검토 우선순위: 보통';
    copy.textContent = belowLegal.map(function (heir) { return heir.label; }).join('·') + '의 배분이 법정상속분보다 크게 낮습니다. 유류분은 넘지만 생전증여 합산 시 달라질 수 있습니다.' + realEstateNote;
    legalFlag.textContent = '확인 필요';
  } else {
    riskCard.classList.add('low');
    title.textContent = '법률 검토 우선순위: 낮음';
    copy.textContent = '법정상속분과 큰 차이가 없습니다. 생전증여·평가·채무 자료는 전문가 확인이 필요합니다.' + realEstateNote;
    legalFlag.textContent = '기본 검토';
  }
  $('#expert-lawyer-item').textContent = belowReserve.length ? '유류분 미달 배분 · 공동소유 위험 확인' : '유류분·공동소유 위험 확인';
  renderFlowNavigation();
  if (showMessage) showToast('희망 배분안을 법정상속분·유류분 기준으로 다시 진단했습니다.');
}

function alertItem(tone, tag, title, sub, view) {
  return '<button class="alert-item ' + tone + '" data-view="' + view + '"><span>' + tag + '</span><div><strong>' + title + '</strong><small>' + sub + '</small></div><b>›</b></button>';
}

function renderDashboard(plan) {
  const alerts = [];
  const a = plan.a;
  const gap = plan.floorTotal - plan.stableNow;
  if (gap > 0.05) {
    alerts.push(alertItem('danger', '안정자산', '필요 안정자산 대비 ' + formatAmount(gap) + ' 부족', '현금·채권 합계 ' + formatShort(plan.stableNow) + ' / 필요 ' + formatShort(plan.floorTotal), 'analysis'));
  }
  const idle = a.cash - plan.cashFloor;
  if (idle >= 1) {
    alerts.push(alertItem('warning', '유휴현금', '예금 ' + formatAmount(idle) + '이 목적 없이 대기 중', '현금성 필요분 ' + formatShort(plan.cashFloor) + ' 초과분은 채권 사다리로', 'analysis'));
  }
  const equityPct = plan.statsNow.equityPct;
  if (equityPct > plan.profile.equityCap) {
    alerts.push(alertItem('danger', '적합성', '주식 비중 ' + Math.round(equityPct) + '% · ' + plan.profile.name + ' 한도 ' + plan.profile.equityCap + '% 초과', '투자성향 대비 위험 초과 · 조정 필요', 'analysis'));
  }
  if (plan.profile.level <= 2 && a.pef > 0) {
    alerts.push(alertItem('warning', '적합성', '사모펀드 보유 · ' + plan.profile.name + ' 부적합 상품', '추가 매수 금지 · 만기 시 재배분', 'assets'));
  }
  if (plan.incomeNow >= FIN_INCOME_THRESHOLD) {
    alerts.push(alertItem('warning', '세금', '금융소득 연 ' + formatManwon(plan.incomeNow) + ' 추정 · 종합과세 대상', '기준 2,000만원 초과 · 저쿠폰 국채·연금계좌 검토', 'tax'));
  }
  const realPct = pct(a.realestate, plan.total);
  if (realPct >= 50) {
    alerts.push(alertItem('warning', '집중도', '부동산 ' + Math.round(realPct) + '% 집중', '상속 시 현금화·분할 제약 · 즉시 조정 불가', 'assets'));
  }
  alerts.push(alertItem('info', '근거', '하우스뷰 + 시장 근거 12건 연결', '출처·시각·반대 근거 공개', 'market'));
  $('#alert-list').innerHTML = alerts.join('');
  $('#alert-count').textContent = alerts.length;
}

function groupHoldings(h) {
  return [
    { label: '주식 ETF', value: h.kretf + h.globaletf },
    { label: '국채', value: h.govbond },
    { label: '회사채', value: h.corpbond },
    { label: '사모·대체', value: h.pef + h.alternative },
    { label: '현금성', value: h.cash }
  ];
}

function compareRows(plan, rowClass) {
  const now = groupHoldings(plan.current);
  const next = groupHoldings(plan.target);
  const pcts = now.map(function (row, i) { return [pct(row.value, plan.financial), pct(next[i].value, plan.financial)]; });
  const scale = Math.max(60, Math.max.apply(Math, pcts.map(function (p) { return Math.max(p[0], p[1]); })));
  return now.map(function (row, i) {
    const p = pcts[i];
    return '<div class="' + rowClass + '"><span>' + row.label + '</span><div><i style="--w:' + (p[0] / scale * 100) + '%"></i><b style="--w:' + (p[1] / scale * 100) + '%"></b></div><em>' + Math.round(p[0]) + '%</em><strong>' + Math.round(p[1]) + '%</strong></div>';
  }).join('');
}

function renderAnalysis(plan) {
  const saa = plan.saa;
  $('#compare-base').textContent = '금융자산 ' + formatAmount(plan.financial) + ' 기준 (부동산 제외)';
  const rows = [
    { label: '주식 ETF', value: saa.kretf + saa.globaletf, role: '장기 성장' },
    { label: '국채', value: saa.govbond, role: includesTransfer() ? '상속세 재원·버킷 2' : '안정 인컴' },
    { label: '회사채', value: saa.corpbond, role: '인컴 보강' },
    { label: '사모·대체', value: saa.pef + saa.alternative, role: '분산·인플레이션 헤지' },
    { label: '현금성', value: saa.cash, role: includesRetirement() ? '버킷 1·비상자금' : '비상자금' }
  ];
  const scale = Math.max(60, Math.max.apply(Math, rows.map(function (row) { return pct(row.value, plan.financial); })));
  $('#saa-rows').innerHTML = rows.map(function (row) {
    const p = pct(row.value, plan.financial);
    return '<div class="saa-row"><span>' + row.label + '<small>' + row.role + '</small></span><div><b style="--w:' + (p / scale * 100) + '%"></b></div><em>' + Math.round(p) + '%</em><strong>' + formatShort(row.value) + '</strong></div>';
  }).join('');

  const mix = plan.profile.mix;
  const steps = [
    ['필수 안정자산', formatShort(plan.cashFloor + plan.bondFloor), '현금성 ' + formatShort(plan.cashFloor) + ' + 채권 ' + formatShort(plan.bondFloor) + (includesTransfer() ? ' (상속세 재원 포함)' : '')],
    ['조정 불가 자산', formatShort(plan.a.pef), '사모펀드 ' + pefYear() + '년까지 고정'],
    [plan.profile.name + ' 모델', formatShort(plan.pool), '주식 ' + Math.round(mix.equity * 100) + ' · 채권 ' + Math.round(mix.bond * 100) + ' · 대체 ' + Math.round(mix.alt * 100) + ' · 현금 ' + Math.round(mix.cash * 100)]
  ];
  if (plan.shortfall > 0) steps[0][2] += ' · 금융자산으로 ' + formatShort(plan.shortfall) + ' 부족';
  $('#build-steps').innerHTML = steps.map(function (step) {
    return '<li><div><b>' + step[0] + '</b><small>' + step[2] + '</small></div><strong>' + step[1] + '</strong></li>';
  }).join('');

  const n = plan.statsNow;
  const t = plan.statsSaa;
  $('#metrics-rows').innerHTML =
    '<div><span>주식 비중</span><b>' + Math.round(n.equityPct) + '%</b><i>→</i><strong>' + Math.round(t.equityPct) + '%</strong></div>' +
    '<div><span>연 변동성 (추정)</span><b class="negative">' + n.vol.toFixed(1) + '%</b><i>→</i><strong>' + t.vol.toFixed(1) + '%</strong></div>' +
    '<div><span>장기 기대수익 (가정)</span><b>' + n.ret.toFixed(1) + '%</b><i>→</i><strong>' + t.ret.toFixed(1) + '%</strong></div>' +
    '<div><span>스트레스 손실</span><b class="negative">' + n.stress.toFixed(1) + '%</b><i>→</i><strong>' + t.stress.toFixed(1) + '%</strong></div>';

  const equity = saa.kretf + saa.globaletf;
  const satellite = round1(Math.min(Math.min(DEMO_SATELLITE, plan.current.globaletf), equity * SATELLITE_LIMIT, saa.globaletf));
  const broad = saa.globaletf - satellite;
  function share(value) {
    return Math.round(pct(value, equity)) + '%';
  }
  $('#etf-body').innerHTML =
    '<tr><td>Core</td><td><b>국내 대표지수 ETF</b></td><td>' + formatAmount(saa.kretf) + '</td><td>' + share(saa.kretf) + '</td><td>높음</td><td>국내 시장 노출</td></tr>' +
    '<tr><td>Core</td><td><b>미국·글로벌 광범위 ETF</b></td><td>' + formatAmount(broad) + '</td><td>' + share(broad) + '</td><td>중간</td><td>지역 분산의 중심</td></tr>' +
    '<tr><td>Satellite</td><td><b>글로벌 반도체 ETF</b></td><td>' + formatAmount(satellite) + '</td><td>' + share(satellite) + '</td><td>매우 높음</td><td>초과수익 추구 · 한도 관리</td></tr>';
  $('#satellite-pill').textContent = '위성 ' + Math.round(pct(satellite, equity)) + '% / 한도 20%';
}

function renderMarket(plan) {
  $('#house-view').innerHTML = HOUSE_VIEW.map(function (row) {
    return '<div><span>' + row.asset + '</span><span class="action ' + row.tone + '">' + row.view + '</span><small>' + row.reason + '</small></div>';
  }).join('');
  const equityNow = plan.current.kretf + plan.current.globaletf;
  $('#chain-exposure').textContent = '주식 ETF ' + formatAmount(equityNow);
  $('#chain-constraint').textContent = '안정자산 ' + formatAmount(plan.floorTotal) + ' 필요';
  $('#trigger-stable').textContent = '필요 안정자산 ' + formatAmount(plan.floorTotal) + ' 미달';

  const tilt = plan.taaTilt;
  const saa = plan.saa;
  const taaRows = [
    ['해외 주식 ETF', saa.globaletf, -tilt],
    ['국채', saa.govbond, round1(tilt / 2)],
    ['현금성', saa.cash, round1(tilt - round1(tilt / 2))],
    ['국내 주식 ETF', saa.kretf, 0],
    ['회사채', saa.corpbond, 0],
    ['금·리츠', saa.alternative, 0]
  ];
  $('#taa-body').innerHTML = taaRows.map(function (row) {
    const diff = round1(row[2]);
    const diffPct = pct(diff, plan.financial);
    const diffClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : '';
    const diffText = diff === 0 ? '중립' : formatSigned(diff) + ' (' + (diffPct > 0 ? '+' : '') + diffPct.toFixed(1) + '%p)';
    return '<tr><td><b>' + row[0] + '</b></td><td>' + formatShort(row[1]) + '</td><td class="' + diffClass + '">' + diffText + '</td><td>' + formatShort(row[1] + diff) + '</td></tr>';
  }).join('');
  const status = $('#taa-status');
  status.textContent = state.useTaa ? '반영 · 실행 계획에 적용' : '미반영 · SAA 유지';
  status.className = 'pill ' + (state.useTaa ? 'success' : 'info');
  $('#decision-copy').textContent = state.useTaa
    ? '장기 SAA를 기준으로, 하우스뷰에 따라 해외 주식 ' + formatShort(tilt) + '(금융자산의 2%p)를 국채·현금성으로 옮긴 안을 실행 계획의 목표로 사용합니다.'
    : '장기 SAA를 그대로 실행 목표로 사용합니다. 하우스뷰 조정안(해외 주식 -' + formatShort(tilt) + ')은 상단에서 반영을 선택할 때만 적용됩니다.';
}

function reasonFor(key, diff, plan) {
  if (plan.skipped[key]) return '허용범위 내 · 거래 생략';
  if (key === 'pef') return pefYear() + '년 환매 제한';
  if (key === 'govbond') return diff > 0 ? '은퇴 버킷2·상속세 재원 (만기 사다리)' : '모델 대비 초과';
  if (key === 'corpbond') return '우량등급 · 신용위험 한도';
  if (key === 'alternative') return '인플레이션 헤지 · 모델 비중';
  if (key === 'cash') return diff < 0 ? '유휴 예금 → 채권 이동' : '은퇴 버킷1·비상자금 확보';
  if (key === 'globaletf' && state.useTaa) return '성향 모델 + 하우스뷰 축소';
  return diff < 0 ? plan.profile.name + ' 모델 대비 초과' : plan.profile.name + ' 모델 대비 부족';
}

function renderExecution(plan) {
  let sells = 0;
  let buys = 0;
  const sellNames = [];
  const buyNames = [];
  TRADE_KEYS.forEach(function (key) {
    if (key === 'cash' || key === 'pef') return;
    const diff = round1(plan.target[key] - plan.current[key]);
    if (diff < 0) { sells -= diff; sellNames.push(ROW_META[key].label); }
    if (diff > 0) { buys += diff; buyNames.push(ROW_META[key].label); }
  });
  const cashOut = Math.max(0, plan.current.cash - plan.target.cash);
  const firstBuy = Math.min(cashOut, buys);
  const steps = [];
  if (firstBuy > 0) {
    steps.push(['1회차 · 즉시', '예금·현금성 ' + formatShort(firstBuy) + ' → ' + buyNames.join(', ') + ' 매수', '가격 위험이 없는 전환부터 실행 · 신규 국채는 저쿠폰 국채로']);
  }
  if (sells > 0) {
    const split = sells >= 1;
    const half = round1(sells / 2);
    steps.push([(steps.length + 1) + '회차 · ' + (steps.length ? '+1개월' : '즉시'), sellNames.join(', ') + ' ' + formatShort(split ? half : sells) + ' 매도 → 남은 매수분 집행', split ? '주식 매도는 가격 변동을 감안해 절반만 먼저 실행' : '소액이라 일괄 실행']);
    if (split) {
      steps.push([(steps.length + 1) + '회차 · +2개월', '나머지 ' + formatShort(round1(sells - half)) + ' 매도 · 목표 비중 재확인', '국내상장 해외 ETF 매도차익은 배당소득 과세 → 필요 시 연도 분산']);
    }
  } else if (buys > firstBuy) {
    steps.push([(steps.length + 1) + '회차', '남은 매수 ' + formatShort(buys - firstBuy) + ' 집행', '매도 없이 현금성 자산으로 충당']);
  }
  if (!steps.length) steps.push(['거래 없음', '현재 보유가 목표 허용범위 안에 있습니다', '분기 정기 리뷰에서 다시 확인']);
  $('#execution-steps').innerHTML = steps.map(function (step) {
    return '<li><b>' + step[0] + '</b><div><strong>' + step[1] + '</strong><small>' + step[2] + '</small></div></li>';
  }).join('');
  $('#execution-pill').textContent = steps[0][0] === '거래 없음' ? '거래 없음' : steps.length + '회 실행';
}

function renderRebalancing(plan) {
  $('#rebalance-body').innerHTML = TRADE_KEYS.map(function (key) {
    const now = plan.current[key];
    const next = plan.target[key];
    const diff = round1(next - now);
    let action;
    if (key === 'pef') action = '<span class="action locked">제외</span>';
    else if (diff <= -0.05) action = '<span class="action sell">축소</span>';
    else if (diff >= 0.05) action = '<span class="action buy">확대</span>';
    else action = '<span class="action hold">유지</span>';
    const diffClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : '';
    return '<tr' + (key === 'pef' ? ' class="locked-row"' : '') + '><td><span class="asset-dot ' + ROW_META[key].dot + '"></span><b>' + ROW_META[key].label + '</b></td><td>' + formatShort(now) + '</td><td>' + formatShort(next) + '</td><td class="' + diffClass + '">' + formatSigned(diff) + '</td><td>' + action + '</td><td>' + reasonFor(key, diff, plan) + '</td></tr>';
  }).join('');

  $('#rebalance-strip').innerHTML = '<span>적용 제약</span><strong>필요 안정자산 ' + formatAmount(plan.floorTotal) + '</strong><i></i><strong>' + ($('#lock-home').checked ? '거주부동산 매각금지' : '부동산 조정 제외') + '</strong><i></i><strong>사모펀드 환매제한</strong><em>목표: ' + (state.useTaa ? 'SAA + 하우스뷰 TAA' : '장기 SAA') + '</em>';

  const stable = plan.stableTarget;
  const ratio = plan.floorTotal > 0 ? Math.min(100, stable / plan.floorTotal * 100) : 100;
  $('#stable-progress-label').textContent = '현금성 ' + formatShort(plan.target.cash) + ' + 채권 ' + formatShort(plan.target.govbond + plan.target.corpbond) + ' = ' + formatAmount(stable) + ' / 필요 ' + formatAmount(plan.floorTotal);
  $('#stable-progress-bar').style.width = ratio + '%';
  $('#stable-progress-copy').textContent = plan.shortfall > 0
    ? '금융자산만으로 ' + formatAmount(plan.shortfall) + ' 부족합니다. 종신보험·연부연납 등 재원 방식 변경이나 부동산 활용을 전문가와 검토해야 합니다.'
    : '부동산·사모펀드를 매각하지 않고 필요 안정자산을 충족합니다.';

  $('#trade-cost').textContent = formatManwon(plan.turnover * 2 * 0.0015);
  const volChange = plan.statsTarget.vol - plan.statsNow.vol;
  const risk = $('#trade-risk');
  risk.textContent = (volChange > 0 ? '+' : '') + volChange.toFixed(1) + '%p';
  risk.className = volChange <= 0 ? 'positive' : 'negative';
  $('#trade-plan').textContent = plan.turnover >= 1 ? '매매 ' + formatShort(plan.turnover) + ' · 3회 분할 실행 (월 1회)' : '매매 ' + formatShort(plan.turnover) + ' · 일괄 실행';
  renderExecution(plan);
  $('#execution-part-copy').textContent = '실행 목표: ' + (state.useTaa ? '장기 SAA + 하우스뷰 TAA (앞 단계에서 반영 선택)' : '장기 SAA (하우스뷰 미반영)') + '. 부동산·사모펀드는 그대로 두고 금융자산만 조정합니다.';

  const equityPct = plan.statsTarget.equityPct;
  const fits = equityPct <= plan.profile.equityCap;
  const bar = $('#suitability');
  bar.classList.toggle('warn', !fits);
  let text = '<b>적합성 확인</b><span>' + plan.profile.name + ' · 최종 주식 비중 ' + Math.round(equityPct) + '% (한도 ' + plan.profile.equityCap + '%) → ' + (fits ? '적합' : '한도 초과, 조정 필요') + '</span>';
  if (plan.profile.level <= 2 && plan.a.pef > 0) text += '<span>사모펀드는 성향 대비 고위험 상품: 추가 매수 없이 만기 관리</span>';
  if (numberOf('#age') >= 65) text += '<span>고령투자자: 권유 과정 녹취·숙려 절차 확인</span>';
  bar.innerHTML = text;
}

function renderTax(plan) {
  const max = Math.max(plan.incomeNow, plan.incomeTarget, FIN_INCOME_THRESHOLD) * 1.1;
  function bar(label, value, tone) {
    return '<div class="income-row"><span>' + label + '</span><div><i class="' + tone + '" style="width:' + (value / max * 100) + '%"></i><em style="left:' + (FIN_INCOME_THRESHOLD / max * 100) + '%"></em></div><b>' + formatManwon(value) + '</b></div>';
  }
  $('#income-bars').innerHTML = bar('현재', plan.incomeNow, plan.incomeNow >= FIN_INCOME_THRESHOLD ? 'over' : 'ok') +
    bar('리밸런싱 후', plan.incomeTarget, plan.incomeTarget >= FIN_INCOME_THRESHOLD ? 'over' : 'ok') +
    '<small>세로선: 종합과세 기준 2,000만원 · 분배율 가정: 예금 3.0%, 기존 국채 3.0%, 신규 저쿠폰 국채 1.5%, 회사채 4.0%, 국내 ETF 2.0%, 해외 ETF 1.5%, 금·리츠 2.0%</small>';

  const newGov = Math.max(0, plan.target.govbond - plan.current.govbond);
  const saving = newGov * (ASSUMPTIONS.govbond.income - LOW_COUPON_INCOME) / 100;
  const actions = [];
  if (newGov > 0) actions.push(['navy', '국채', '신규 국채 ' + formatShort(newGov) + '은 저쿠폰 국채로', '과세 이자 연 약 ' + formatManwon(saving) + ' 감소 · 매매차익 비과세', '우선']);
  actions.push(['violet', '연금', '연금저축·IRP 연 1,800만원 납입', '세액공제 대상 900만원 · 과세이연 · 연금 수령 시 3.3~5.5%', includesRetirement() ? '우선' : '검토']);
  actions.push(['blue', 'ISA', '국내 ETF·채권 ETF 우선 배치', '한도 내 비과세, 초과분 9.9% 분리과세 · 한도는 최신 세법 확인', '검토']);
  actions.push(['blue', '해외', '해외 주식은 해외상장 ETF 직접 보유 검토', '매매차익 22% 분리과세(250만원 공제) · 종합과세 합산 제외', plan.incomeNow >= FIN_INCOME_THRESHOLD ? '우선' : '검토']);
  if (state.spouse) actions.push(['navy', '증여', '배우자 증여로 금융소득 분산', '10년간 6억원 공제 · 10년 내 상속 시 상속재산에 합산', includesTransfer() ? '검토' : '참고']);
  if (includesRetirement()) actions.push(['violet', '건보', '은퇴 후 건강보험 피부양자 요건 확인', '연 소득 2,000만원 초과 시 지역가입자 전환 가능', '확인']);
  $('#tax-actions').innerHTML = actions.map(function (row) {
    return '<div class="account-row"><span class="account-icon ' + row[0] + '">' + row[1] + '</span><div><strong>' + row[2] + '</strong><small>' + row[3] + '</small></div><b>' + row[4] + '</b></div>';
  }).join('');

  const over = plan.incomeTarget >= FIN_INCOME_THRESHOLD;
  $('#tax-headline').innerHTML = over ? '종합과세<br><b>기준 초과</b>' : '종합과세<br><b>기준 이내</b>';
  $('#tax-after-side').textContent = formatManwon(plan.incomeTarget);
}

function renderReport(plan) {
  $('#report-liquidity').textContent = formatAmount(plan.floorTotal);
  $('#final-liquidity').textContent = formatAmount(plan.stableTarget);
  $('#report-profile').textContent = plan.profile.name;
  const fits = plan.statsTarget.equityPct <= plan.profile.equityCap;
  $('#report-suitability').textContent = fits ? '적합성 확인 · 주식 ' + Math.round(plan.statsTarget.equityPct) + '%' : '적합성 한도 초과';
  $('#report-mode').textContent = state.useTaa ? '하우스뷰 TAA ±2%p 반영' : 'SAA 기준 · TAA 미적용';
  $('#final-base').textContent = '금융자산 ' + formatAmount(plan.financial) + ' 기준';
  $('#final-rows').innerHTML = compareRows(plan, 'final-row');
  $('#final-liquidity-rows').innerHTML =
    '<div><span>현금성 (버킷 1)</span><b>' + formatAmount(plan.target.cash) + '</b></div>' +
    '<div><span>국채 사다리</span><b>' + formatAmount(plan.target.govbond) + '</b></div>' +
    '<div><span>우량 회사채</span><b>' + formatAmount(plan.target.corpbond) + '</b></div>' +
    '<div><span>' + ($('#lock-home').checked ? '매각금지 부동산' : '부동산') + '</span><b>유지</b></div>' +
    '<div><span>사모펀드</span><b>조정 제외</b></div>';

  const items = [
    ['분기', '정기 리뷰: 성과·비중 점검, 자산군이 목표 대비 ±5%p 벗어나면 리밸런싱'],
    ['월간', '하우스뷰 변경 시 TAA(±2%p) 재검토'],
  ];
  if (includesRetirement()) items.push([plan.retirement.years + '년 후', '은퇴 개시: 버킷 1 인출 시작, 만기 도래 채권을 버킷 1로 보충']);
  items.push([pefYear() + '년', '사모펀드 만기 회수금을 목표 배분에 맞춰 재투자']);
  if (includesTransfer()) items.push(['수시', '가족 변동·증여 실행·세법 개정 시 승계 사전진단과 상속세 재원 재계산']);
  items.push(['연 1회', '투자자정보(투자성향·재무상황) 갱신 및 적합성 재확인']);
  $('#monitoring-list').innerHTML = items.map(function (item) {
    return '<li><b>' + item[0] + '</b><span>' + item[1] + '</span></li>';
  }).join('');
}

function updateConditionalUI() {
  const content = goalContent[state.goal];
  document.querySelectorAll('.goal-card').forEach(function (card) {
    const input = card.querySelector('input');
    card.classList.toggle('selected', input.checked);
  });
  document.querySelectorAll('[data-goal-panel="retirement"]').forEach(function (panel) {
    panel.hidden = !includesRetirement();
  });
  document.querySelectorAll('[data-goal-panel="transfer"]').forEach(function (panel) {
    panel.hidden = !includesTransfer();
  });
  document.querySelectorAll('[data-goal-panel="general"]').forEach(function (panel) {
    panel.hidden = state.goal !== 'general';
  });
  document.querySelectorAll('.nav-list [data-view="transfer"], .nav-list [data-view="experts"]').forEach(function (button) {
    button.hidden = !includesTransfer();
  });
  $('#route-chip').textContent = content.chip;
  $('#client-route-label').textContent = content.client;
  $('#journey-title').textContent = content.title;
  $('#goal-route-copy').textContent = content.copy;
  $('#goals-next').textContent = content.next;
  const dashboardNext = $('#dashboard-next');
  dashboardNext.dataset.view = includesTransfer() ? 'transfer' : 'market';
  dashboardNext.textContent = includesTransfer() ? '승계 사전진단' : '하우스뷰·시장근거';
  $('#kpi-liquidity-note').textContent = includesTransfer() ? '은퇴 버킷 + 상속세 재원(자동 추정)' : includesRetirement() ? '은퇴 버킷 1+2' : '비상자금 6개월';
  $('#report-goal').textContent = content.report;
  updateAll();
  renderJourney();
  renderFlowNavigation();
}

function updateAll() {
  setText('.pef-year', String(pefYear()));
  $('#retirement-years-field').hidden = $('#employment').value === '은퇴';
  const plan = computePlan();
  state.plan = plan;
  renderProfile(plan);
  renderSummary(plan);
  renderGoals(plan);
  renderTransfer(plan);
  renderDashboard(plan);
  renderAnalysis(plan);
  renderMarket(plan);
  renderRebalancing(plan);
  renderTax(plan);
  renderReport(plan);
}

function setEvidenceTab(tabName) {
  document.querySelectorAll('[data-evidence-tab]').forEach(function (button) {
    button.classList.toggle('active', button.dataset.evidenceTab === tabName);
  });
  document.querySelectorAll('[data-evidence-panel]').forEach(function (panel) {
    panel.classList.toggle('active', panel.dataset.evidencePanel === tabName);
  });
}

// ---------- 이벤트 ----------

document.addEventListener('click', function (event) {
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) {
    event.preventDefault();
    navigate(viewButton.dataset.view);
    return;
  }
  const stepButton = event.target.closest('[data-step]');
  if (stepButton) {
    navigate(stepButton.dataset.step);
    return;
  }
  const tabButton = event.target.closest('[data-evidence-tab]');
  if (tabButton) {
    setEvidenceTab(tabButton.dataset.evidenceTab);
  }
});

flowBack.addEventListener('click', function () {
  const config = getFlowNavigation(state.currentView);
  if (config.back) navigate(config.back);
});

flowNext.addEventListener('click', advanceCurrentView);

$('#profile-next').addEventListener('click', function () {
  if (!surveyComplete()) {
    showToast('투자성향 설문 10문항에 모두 답해주세요.');
    return;
  }
  navigate('goals');
});

$('#survey-options').addEventListener('click', function (event) {
  const button = event.target.closest('[data-answer]');
  if (!button) return;
  state.answers[state.surveyIndex] = Number(button.dataset.answer);
  const isLast = state.surveyIndex === SURVEY.length - 1;
  updateAll();
  renderFlowNavigation();
  window.clearTimeout(renderSurvey.timer);
  renderSurvey.timer = window.setTimeout(function () {
    if (!isLast) {
      state.surveyIndex += 1;
      renderSurvey();
    } else if (surveyComplete()) {
      showToast('투자성향이 ' + state.plan.profile.name + '으로 산출되었습니다.');
    }
  }, 220);
});

$('#survey-prev').addEventListener('click', function () {
  state.surveyIndex = Math.max(0, state.surveyIndex - 1);
  renderSurvey();
});

$('#survey-next').addEventListener('click', function () {
  state.surveyIndex = Math.min(SURVEY.length - 1, state.surveyIndex + 1);
  renderSurvey();
});

document.querySelectorAll('input[name="goal"]').forEach(function (input) {
  input.addEventListener('change', function () {
    state.goal = input.value;
    updateConditionalUI();
    showToast(goalContent[state.goal].chip + '가 적용되었습니다.');
  });
});

$('#goals-next').addEventListener('click', function () {
  navigate('dashboard');
});

document.querySelectorAll('.asset-input, #asset-debt, #age, #monthly-spend, #pension-income, #retirement-years, #insurance-reserve, #pef-year').forEach(function (input) {
  input.addEventListener('input', function () {
    updateAll();
    analyzeDistribution(false);
  });
});

document.querySelectorAll('#employment, #lock-home').forEach(function (input) {
  input.addEventListener('input', updateAll);
  input.addEventListener('change', updateAll);
});

$('#liquidity-target').addEventListener('input', function (event) {
  state.estateTarget = Math.max(0, Number(event.target.value || 0));
  state.estateTargetManual = true;
  updateAll();
});

$('#heir-inputs').addEventListener('input', function (event) {
  const input = event.target.closest('.heir-share');
  if (!input) return;
  state.heirs[Number(input.dataset.heirIndex)].share = Math.max(0, Number(input.value || 0));
  analyzeDistribution(false);
  updateAll();
});

$('#run-transfer-check').addEventListener('click', function () {
  analyzeDistribution(true);
});

document.querySelectorAll('[data-transfer-scenario]').forEach(function (button) {
  button.addEventListener('click', function () {
    document.querySelectorAll('[data-transfer-scenario]').forEach(function (candidate) {
      const active = candidate === button;
      candidate.classList.toggle('active', active);
      candidate.querySelector('b').textContent = active ? '선택됨' : '비교';
    });
    state.estateMode = button.dataset.transferScenario;
    $('#insurance-reserve').value = state.estateMode === 'insurance' ? round1(state.estateTarget * 0.5) : 0;
    updateAll();
    showToast(button.querySelector('strong').textContent + '으로 필요 안정자산을 다시 계산했습니다.');
  });
});

document.querySelectorAll('[data-counter]').forEach(function (button) {
  button.addEventListener('click', function () {
    const key = button.dataset.counter;
    const delta = Number(button.dataset.delta);
    if (key === 'spouse') state.spouse = Math.min(1, Math.max(0, state.spouse + delta));
    if (key === 'children') state.children = Math.min(5, Math.max(0, state.children + delta));
    $('#spouse-count').textContent = state.spouse + '명';
    $('#children-count').textContent = state.children + '명';
    buildHeirs(true);
    analyzeDistribution(false);
    updateAll();
  });
});

document.querySelectorAll('[data-analysis-mode]').forEach(function (button) {
  button.addEventListener('click', function () {
    state.useTaa = button.dataset.analysisMode === 'taa';
    document.querySelectorAll('[data-analysis-mode]').forEach(function (candidate) {
      candidate.classList.toggle('active', candidate === button);
    });
    updateAll();
    showToast(state.useTaa ? '하우스뷰 TAA를 실행 계획의 목표에 반영했습니다.' : '실행 계획의 목표를 장기 SAA로 되돌렸습니다.');
  });
});

document.querySelectorAll('.evidence-toggle').forEach(function (button) {
  button.addEventListener('click', function () {
    const card = button.closest('.evidence-card');
    card.classList.toggle('open');
    button.textContent = card.classList.contains('open') ? 'AI 활용 방식 닫기' : 'AI 활용 방식 보기';
  });
});

$('#band-switch').addEventListener('change', function (event) {
  state.useBand = event.target.checked;
  $('#band-copy').textContent = state.useBand ? '0.3억원 미만 차이는 거래 생략' : '모든 차이를 거래';
  updateAll();
  showToast(state.useBand ? '허용범위 밴드를 적용했습니다.' : '허용범위 밴드를 해제했습니다.');
});

$('#approve-rebalance').addEventListener('click', function () {
  showToast('리밸런싱안을 검토 완료했습니다.');
  window.setTimeout(function () {
    navigate('tax');
  }, 350);
});

$('#request-lawyer').addEventListener('click', function () {
  $('#lawyer-status').textContent = '검토 중';
  $('#expert-overall-status').textContent = '변호사 검토 중';
  $('#expert-badge').textContent = '2건 남음';
  showToast('변호사 검토 요청 패키지를 전달했습니다.');
});

$('#approve-expert-plan').addEventListener('click', function () {
  state.expertApproved = true;
  $('#lawyer-step').classList.remove('current');
  $('#lawyer-step').classList.add('done');
  $('#lawyer-status').textContent = '검토 완료';
  $('#approval-step').classList.add('done');
  $('#approval-status').textContent = '반영 완료';
  $('#expert-overall-status').textContent = '전문가 승인 완료';
  $('#expert-badge').textContent = '검토 완료';
  $('#expert-next').disabled = false;
  $('#report-expert-status').textContent = '전문가 승인 완료';
  renderFlowNavigation();
  showToast('전문가 승인 조건을 최종안에 반영했습니다.');
});

$('#expert-next').addEventListener('click', function () {
  navigate('report');
});

// 리포트 저장: 브라우저 인쇄 창을 열어 "PDF로 저장"으로 파일을 만듭니다(외부 라이브러리 없음).
// 인쇄 모양은 print.css가 정합니다(리포트 화면만, A4).
const ORIGINAL_TITLE = document.title;
let printing = false;

function restoreTitleAfterPrint() {
  document.title = ORIGINAL_TITLE;
  printing = false;
}

function printReport() {
  if (printing) return; // 두 번 눌러도 한 번만 (제목 복구가 꼬이지 않게)
  printing = true;
  if (state.currentView !== 'report') navigate('report', { silent: true });
  updateAll();
  const draft = includesTransfer() && !state.expertApproved;
  const now = new Date();
  const stamp = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
  const panel = document.querySelector('[data-view-panel="report"]');
  let header = document.getElementById('print-header');
  if (!header) {
    header = document.createElement('div');
    header.id = 'print-header';
    header.className = 'print-only';
    panel.insertBefore(header, panel.firstChild);
  }
  header.innerHTML = '<strong>AI PB 자문 리포트</strong><span>작성 ' + now.toLocaleString('ko-KR') + '</span>' +
    (draft ? '<em>전문가 승인 전 초안</em>' : '');
  document.title = 'AI-PB-리포트-' + stamp; // PDF 기본 파일 이름
  window.addEventListener('afterprint', restoreTitleAfterPrint, { once: true });
  // 아이폰 홈 화면 앱(standalone)에서는 인쇄 창이 열리지 않을 수 있어 안내를 바꿉니다.
  const iosStandalone = window.navigator.standalone === true;
  showToast(iosStandalone
    ? '인쇄 창이 열리지 않으면 Safari에서 열어 공유 → 프린트로 PDF를 저장하세요.'
    : '인쇄 창에서 대상을 "PDF로 저장"으로 고르면 파일로 저장됩니다.');
  window.setTimeout(function () {
    window.print();
    // afterprint를 지원하지 않는 브라우저는 인쇄 창이 닫힌 뒤 제목을 되돌립니다.
    if (!('onafterprint' in window)) window.setTimeout(restoreTitleAfterPrint, 1000);
  }, 100);
}

$('#save-report').addEventListener('click', printReport);

$('#menu-button').addEventListener('click', function () {
  sidebar.classList.add('open');
});

$('#sidebar-close').addEventListener('click', function () {
  sidebar.classList.remove('open');
});

function registerWebMcpTools() {
  const context = document.modelContext;
  if (!context || typeof context.registerTool !== 'function') return;
  const tools = [
    {
      name: 'navigate_advisory_step',
      description: 'AI PB v3의 상담 화면으로 이동합니다.',
      inputSchema: { type: 'object', properties: { view: { type: 'string', enum: Object.keys(views) } }, required: ['view'], additionalProperties: false },
      execute: function (input) {
        if (!navigate(input.view)) throw new Error('지원하지 않는 화면입니다.');
        return { view: input.view, title: views[input.view].title };
      }
    },
    {
      name: 'select_client_goal',
      description: '은퇴, 자산승계, 통합 또는 일반 자산관리 경로를 선택합니다.',
      inputSchema: { type: 'object', properties: { goal: { type: 'string', enum: ['retirement', 'transfer', 'both', 'general'] } }, required: ['goal'], additionalProperties: false },
      execute: function (input) {
        state.goal = input.goal;
        const radio = document.querySelector('input[name="goal"][value="' + input.goal + '"]');
        radio.checked = true;
        updateConditionalUI();
        navigate('goals');
        return { goal: input.goal, flow: getFlow() };
      }
    },
    {
      name: 'set_transfer_distribution',
      description: '상속인 순서(배우자, 자녀 1, 자녀 2 …)대로 희망 배분 비율(%)을 입력하고 사전 위험 신호를 갱신합니다.',
      inputSchema: { type: 'object', properties: { shares: { type: 'array', items: { type: 'number' } } }, required: ['shares'], additionalProperties: false },
      execute: function (input) {
        state.heirs.forEach(function (heir, index) {
          if (typeof input.shares[index] === 'number') heir.share = input.shares[index];
        });
        renderHeirInputs();
        analyzeDistribution(false);
        updateAll();
        navigate('transfer');
        return { total: state.heirs.reduce(function (acc, heir) { return acc + heir.share; }, 0), estate_tax: state.plan.estate.tax };
      }
    },
    {
      name: 'show_market_evidence',
      description: '하우스뷰와 AI 판단에 사용된 근거 뉴스·시장지표 화면을 엽니다.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: function () {
        navigate('market');
        setEvidenceTab('sources');
        return { evidence_count: 12, decision: 'HOLD' };
      }
    }
  ];
  tools.forEach(function (tool) { context.registerTool(tool); });
}

// ---------------------------------------------------------------------------
// 입력값 저장·복원 (이슈 #1)
// 고객 입력과 진행 단계를 브라우저(localStorage)에 저장하고, 새로고침 후 복원합니다.
// 저장 실패(사생활 보호 모드 등)는 앱 동작에 영향을 주지 않도록 무시합니다.
// 전문가 승인(expertApproved)은 데모 승인 절차이므로 저장하지 않고 매번 다시 승인합니다.
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'aipb-v4-state';
const STORAGE_VERSION = 1;
const SAVED_FIELD_SELECTORS = '.asset-input, #asset-debt, #age, #employment, #monthly-spend, #pension-income, #retirement-years, #insurance-reserve, #pef-year, #lock-home, #liquidity-target, #band-switch, #lock-pef, #gift-window';
const SAVED_STATE_KEYS = ['currentView', 'returnView', 'goal', 'spouse', 'children', 'estateTarget', 'estateTargetManual', 'estateMode', 'useTaa', 'useBand', 'answers', 'surveyIndex'];
let storageRestoring = false;

function collectSavedFields() {
  const fields = {};
  document.querySelectorAll(SAVED_FIELD_SELECTORS).forEach(function (el) {
    if (!el.id) return;
    fields[el.id] = el.type === 'checkbox' ? el.checked : el.value;
  });
  return fields;
}

function saveAppState() {
  if (storageRestoring) return;
  const snapshot = { version: STORAGE_VERSION, savedAt: new Date().toISOString(), state: {}, fields: collectSavedFields() };
  SAVED_STATE_KEYS.forEach(function (key) { snapshot.state[key] = state[key]; });
  snapshot.state.heirShares = state.heirs.map(function (heir) { return heir.share; });
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    document.querySelectorAll('.save-state').forEach(function (el) { el.textContent = '자동 저장됨 · ' + time; });
  } catch (error) {
    document.querySelectorAll('.save-state').forEach(function (el) { el.textContent = '저장 불가 (브라우저 설정)'; });
  }
}

function scheduleSave() {
  window.clearTimeout(scheduleSave.timer);
  scheduleSave.timer = window.setTimeout(function () {
    scheduleSave.timer = null;
    saveAppState();
  }, 300);
}

function readSavedState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw);
    return snapshot && snapshot.version === STORAGE_VERSION ? snapshot : null;
  } catch (error) {
    return null;
  }
}

// 저장값을 그대로 믿지 않고 허용 범위만 받아들입니다(문항·목표가 바뀌거나 값이 깨져도 앱이 멈추지 않게).
function sanitizeSavedState(saved) {
  const clean = {};
  const isInt = function (v, min, max) { return Number.isInteger(v) && v >= min && v <= max; };
  if (typeof saved.goal === 'string' && Object.prototype.hasOwnProperty.call(goalContent, saved.goal)) clean.goal = saved.goal;
  if (isInt(saved.spouse, 0, 1)) clean.spouse = saved.spouse;
  if (isInt(saved.children, 0, 5)) clean.children = saved.children;
  if (typeof saved.estateTarget === 'number' && isFinite(saved.estateTarget) && saved.estateTarget >= 0) clean.estateTarget = saved.estateTarget;
  if (typeof saved.estateTargetManual === 'boolean') clean.estateTargetManual = saved.estateTargetManual;
  if (['financial', 'insurance', 'installment'].indexOf(saved.estateMode) > -1) clean.estateMode = saved.estateMode;
  if (typeof saved.useTaa === 'boolean') clean.useTaa = saved.useTaa;
  if (typeof saved.useBand === 'boolean') clean.useBand = saved.useBand;
  if (typeof saved.returnView === 'string' && views[saved.returnView]) clean.returnView = saved.returnView;
  if (Array.isArray(saved.answers) && saved.answers.length === SURVEY.length) {
    clean.answers = saved.answers.map(function (answer, index) {
      return isInt(answer, 0, SURVEY[index].options.length - 1) ? answer : null;
    });
  }
  if (isInt(saved.surveyIndex, 0, SURVEY.length - 1)) clean.surveyIndex = saved.surveyIndex;
  return clean;
}

function applySavedState(snapshot) {
  const saved = sanitizeSavedState(snapshot.state || {});
  const fields = snapshot.fields || {};
  Object.keys(fields).forEach(function (id) {
    const el = document.getElementById(id);
    if (!el || !el.matches(SAVED_FIELD_SELECTORS)) return;
    if (el.type === 'checkbox') el.checked = Boolean(fields[id]);
    else if (typeof fields[id] === 'string' || typeof fields[id] === 'number') el.value = fields[id];
  });
  Object.keys(saved).forEach(function (key) { state[key] = saved[key]; });
  // 화면 요소를 저장된 상태에 맞춤
  document.querySelectorAll('input[name="goal"]').forEach(function (radio) { radio.checked = radio.value === state.goal; });
  $('#spouse-count').textContent = state.spouse + '명';
  $('#children-count').textContent = state.children + '명';
  document.querySelectorAll('[data-transfer-scenario]').forEach(function (button) {
    const active = button.dataset.transferScenario === state.estateMode;
    button.classList.toggle('active', active);
    const label = button.querySelector('b');
    if (label) label.textContent = active ? '선택됨' : '비교';
  });
  document.querySelectorAll('[data-analysis-mode]').forEach(function (button) {
    button.classList.toggle('active', (button.dataset.analysisMode === 'taa') === state.useTaa);
  });
  $('#band-copy').textContent = state.useBand ? '0.3억원 미만 차이는 거래 생략' : '모든 차이를 거래';
}

// 저장된 배분을 상속인 수에 맞춰 복원합니다. 수가 다르면(깨진 저장값) 법정상속분으로 채웁니다.
function restoreHeirShares(snapshot) {
  const shares = snapshot && snapshot.state && snapshot.state.heirShares;
  const valid = Array.isArray(shares) && shares.length === state.heirs.length && shares.every(function (share) {
    return typeof share === 'number' && isFinite(share) && share >= 0 && share <= 100;
  });
  if (!valid) {
    if (state.heirs.length !== 3) buildHeirs(true);
    return;
  }
  state.heirs.forEach(function (heir, index) { heir.share = shares[index]; });
  renderHeirInputs();
}

function clearSavedState() {
  try { window.localStorage.removeItem(STORAGE_KEY); } catch (error) { /* 저장소 접근 불가 시 무시 */ }
}

function resetAppState() {
  if (!window.confirm('입력한 내용을 모두 지우고 처음부터 다시 시작할까요?')) return;
  // 버튼 클릭으로 예약된 저장이 새로고침 전에 실행되어 옛 상태를 다시 쓰지 않도록 먼저 막습니다.
  window.clearTimeout(scheduleSave.timer);
  scheduleSave.timer = null;
  storageRestoring = true;
  clearSavedState();
  window.location.reload();
}

function addResetButton() {
  document.querySelectorAll('.save-state').forEach(function (badge) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary save-reset';
    button.textContent = '처음부터 다시';
    button.style.marginLeft = '8px';
    button.addEventListener('click', resetAppState);
    badge.insertAdjacentElement('afterend', button);
  });
}

// 기존 이벤트 처리가 끝난 뒤 저장되도록 문서 전체의 입력·클릭을 감지합니다.
['input', 'change', 'click'].forEach(function (type) {
  document.addEventListener(type, scheduleSave);
});

// 저장 대기(0.3초) 중에 새로고침하거나 앱을 닫아도 마지막 상태가 남도록 즉시 저장합니다.
window.addEventListener('pagehide', function () {
  if (!scheduleSave.timer) return;
  window.clearTimeout(scheduleSave.timer);
  scheduleSave.timer = null;
  saveAppState();
});

// 다시 열 때 시작 화면: 저장된 단계. 단, 전문가 승인은 저장하지 않으므로
// 승계 경로에서 최종 리포트에 있었다면 전문가 검토 단계부터 다시 시작합니다.
function restoredStartView(snapshot) {
  const saved = snapshot && snapshot.state ? snapshot.state.currentView : null;
  if (!saved || !views[saved]) return 'profile';
  if (saved === 'report' && includesTransfer() && !state.expertApproved) return 'experts';
  return saved;
}

let savedSnapshot = readSavedState();
storageRestoring = Boolean(savedSnapshot);
try {
  if (savedSnapshot) applySavedState(savedSnapshot);
  buildHeirs(false);
  if (savedSnapshot) restoreHeirShares(savedSnapshot);
} catch (error) {
  // 저장값 때문에 복원이 실패하면 저장값을 지우고 기본 화면으로 다시 시작합니다(저장값이 없을 때는 그대로 오류).
  if (!savedSnapshot) throw error;
  clearSavedState();
  window.location.reload();
  throw error;
}
updateConditionalUI();
analyzeDistribution(false);
registerWebMcpTools();
addResetButton();
const startView = restoredStartView(savedSnapshot);
// 뉴스 화면으로 복원할 때 저장된 '돌아갈 단계'를 덮어쓰지 않도록 현재 화면을 먼저 맞춥니다.
if (startView === 'news') state.currentView = 'news';
if (!views[state.returnView] || state.returnView === 'news') state.returnView = 'profile';
navigate(startView, { silent: true });
if (savedSnapshot) renderSurvey();
storageRestoring = false;
