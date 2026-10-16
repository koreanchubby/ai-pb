/* 미리보기: 자산승계 사전진단(4단계)의 '분쟁 요인 자가 점검'.
 * 고객이 예 / 아니오 / 모르겠음으로 답하면, 판정 없이 '어느 전문가가 무엇을 확인해야 하는지'만 표시해
 * 4단계 AI 사전 점검 · 3단계 진단 신호 · 8단계 전문가 검토로 넘깁니다. 점수·법률 결론은 만들지 않습니다.
 * 답은 이 브라우저(localStorage)에만 저장하고 서버로 보내지 않습니다. 화면 글자는 textContent로만 넣습니다.
 * 근거 조문: 국가법령정보센터 민법[시행 2026.3.17.] · 상속세및증여세법[시행 2026.1.2.] · 국제사법[시행 2022.7.5.] (DECISIONS 2026-10-16)
 */
(function () {
  'use strict';

  var STORE_KEY = 'aipb-preview-dispute';
  var ITEMS = [
    { id: 'gift', q: '특정 가족에게 이미 큰 재산을 증여했거나, 증여할 계획이 있다',
      why: '먼저 받은 재산은 상속분·유류분 계산과 상속세 합산(상속인 10년)에 들어갈 수 있음',
      basis: '민법 제1008조·제1114조·제1118조, 상속세및증여세법 제13조', expert: '변호사·세무사' },
    { id: 'unequal', q: '법정상속분과 크게 다르게 나누고 싶다 (한 사람에게 몰아주기 등)',
      why: '배우자·자녀는 법정상속분의 1/2(유류분)이 보장되어 부족분을 돈으로 청구할 수 있음',
      basis: '민법 제1112조·제1115조', expert: '변호사' },
    { id: 'family', q: '이전 혼인의 자녀 등, 지금 함께 지내지 않는 자녀가 있다',
      why: '자녀는 모두 같은 순위·같은 몫의 상속인이라 협의에 모두 참여해야 함',
      basis: '민법 제1000조·제1009조', expert: '변호사' },
    { id: 'care', q: '오래 함께 살며 돌보거나, 사업·재산을 늘리는 데 특별히 도운 가족이 있다',
      why: '기여분을 두고 다른 상속인과 의견이 갈릴 수 있음',
      basis: '민법 제1008조의2', expert: '변호사' },
    { id: 'split', q: '나누기 어려운 재산(함께 쓰는 부동산, 가업·비상장주식)이 큰 비중이다',
      why: '현물로 나누기 어려워 공동소유·처분 시점을 두고 다툼이 생기기 쉬움',
      basis: '민법 제1013조', expert: '변호사·세무사' },
    { id: 'estranged', q: '연락이 끊겼거나 관계가 나쁜 상속인, 또는 부양을 크게 소홀히 한 상속인이 있다',
      why: '분할 협의는 공동상속인 모두가 해야 하고, 부양의무 중대 위반은 상속권 상실 청구 사유가 될 수 있음',
      basis: '민법 제1013조·제1004조의2', expert: '변호사' },
    { id: 'abroad', q: '해외 재산이 있거나, 외국 국적·해외 거주 상속인이 있다',
      why: '어느 나라 법을 따를지(준거법)와 비거주자 과세가 달라질 수 있음',
      basis: '국제사법 제77조, 상속세및증여세법 제13조②', expert: '변호사·세무사' },
    { id: 'will', q: '유언장이 없거나, 법이 정한 방식으로 썼는지 확실하지 않다',
      why: '법이 정한 5가지 방식이 아니면 유언의 효력이 생기지 않음',
      basis: '민법 제1060조·제1065조', expert: '변호사' }
  ];
  var LABELS = { yes: '예', no: '아니오', unknown: '모르겠음' };

  var answers = load();
  var panel = document.querySelector('[data-view-panel="transfer"]');
  if (!panel) return;
  var layout = panel.querySelector('.transfer-layout');
  var box = el('article', 'panel dispute-check');
  layout.parentNode.insertBefore(box, layout);
  build();
  addExpertRow();
  paint();

  window.AIPB_DISPUTE = { summary: summary };
  refreshApp();

  function build() {
    var head = el('div', 'panel-title simple');
    var copy = el('div', '');
    copy.appendChild(el('h2', '', '분쟁 요인 자가 점검'));
    copy.appendChild(el('p', '', '계산만으로는 알 수 없는 가족 사정을 고객이 직접 체크합니다. 판정이나 점수는 내지 않고, 체크한 항목을 확인할 전문가에게 넘깁니다. 답은 이 브라우저에만 저장되고 서버로 보내지 않습니다.'));
    head.appendChild(copy);
    var badge = el('span', 'dispute-badge');
    head.appendChild(badge);
    box.appendChild(head);

    var list = el('div', 'dispute-list');
    ITEMS.forEach(function (item, index) {
      var row = el('div', 'dispute-item');
      row.dataset.id = item.id;
      var text = el('div', 'dispute-text');
      text.appendChild(el('strong', '', (index + 1) + '. ' + item.q));
      var hint = el('small', 'dispute-why', item.why);
      text.appendChild(hint);
      text.appendChild(el('small', 'dispute-basis', '근거: ' + item.basis));
      row.appendChild(text);

      var choices = el('div', 'dispute-choices');
      choices.setAttribute('role', 'radiogroup');
      choices.setAttribute('aria-label', item.q);
      ['yes', 'no', 'unknown'].forEach(function (value) {
        var label = el('label', 'dispute-choice ' + value);
        var input = document.createElement('input');
        input.type = 'radio';
        input.name = 'dispute-' + item.id;
        input.id = 'dispute-' + item.id + '-' + value;
        input.value = value;
        input.checked = answers[item.id] === value;
        input.addEventListener('change', function () {
          answers[item.id] = value;
          save();
          paint();
          refreshApp();
        });
        label.appendChild(input);
        label.appendChild(el('span', '', LABELS[value]));
        choices.appendChild(label);
      });
      row.appendChild(choices);
      row.appendChild(el('span', 'dispute-route'));
      list.appendChild(row);
    });
    box.appendChild(list);

    var foot = el('div', 'dispute-foot');
    var reset = el('button', 'text-button', '답 지우기');
    reset.type = 'button';
    reset.addEventListener('click', function () {
      answers = {};
      save();
      box.querySelectorAll('input[type=radio]').forEach(function (input) { input.checked = false; });
      paint();
      refreshApp();
    });
    foot.appendChild(el('p', 'legal-note', '이 점검은 법률 판단이 아닙니다. 체크 결과와 관계없이 상속 계산은 그대로 보여 주며, 결과는 전문가 확인 전 초안입니다.'));
    foot.appendChild(reset);
    box.appendChild(foot);
    paint();
  }

  function paint() {
    var s = summary();
    var badge = box.querySelector('.dispute-badge');
    badge.textContent = s.yes.length ? '분쟁 요인 ' + s.yes.length + '개' : s.unknown.length ? '확인 필요 ' + s.unknown.length + '개' : s.unanswered ? '미응답 ' + s.unanswered + '개' : '체크된 요인 없음';
    badge.className = 'dispute-badge ' + (s.yes.length ? 'warn' : s.unknown.length ? 'info' : 'ok');
    ITEMS.forEach(function (item) {
      var row = box.querySelector('.dispute-item[data-id="' + item.id + '"]');
      var value = answers[item.id];
      row.classList.toggle('is-yes', value === 'yes');
      row.classList.toggle('is-unknown', value === 'unknown');
      var route = row.querySelector('.dispute-route');
      route.textContent = value === 'yes' ? item.expert + ' 확인 필요' : value === 'unknown' ? '사실 확인 후 ' + item.expert : '';
      route.hidden = !route.textContent;
    });
    var expert = document.getElementById('expert-dispute-item');
    if (expert) {
      var picked = s.yes.concat(s.unknown);
      expert.hidden = !picked.length;
      expert.querySelector('strong').textContent = picked.map(function (item) { return item.short; }).join(' · ') + ' (' + experts(picked) + ')';
    }
  }

  function summary() {
    var yes = [];
    var unknown = [];
    var unanswered = 0;
    ITEMS.forEach(function (item) {
      var short = { gift: '사전증여', unequal: '불균등 배분', family: '전혼 자녀 등', care: '기여분', split: '분할 어려운 재산', estranged: '관계 단절 상속인', abroad: '해외 재산·상속인', will: '유언 방식' }[item.id];
      var entry = { id: item.id, short: short, expert: item.expert };
      if (answers[item.id] === 'yes') yes.push(entry);
      else if (answers[item.id] === 'unknown') unknown.push(entry);
      else if (answers[item.id] !== 'no') unanswered += 1;
    });
    return { yes: yes, unknown: unknown, unanswered: unanswered, total: ITEMS.length };
  }

  function experts(items) {
    var names = [];
    items.forEach(function (item) {
      item.expert.split('·').forEach(function (name) { if (names.indexOf(name) < 0) names.push(name); });
    });
    return names.join('·');
  }

  function addExpertRow() {
    var lawyer = document.getElementById('expert-lawyer-item');
    if (!lawyer) return;
    var li = el('li', '');
    li.id = 'expert-dispute-item';
    li.hidden = true;
    li.appendChild(el('span', '', '분쟁 점검'));
    li.appendChild(el('strong', ''));
    lawyer.parentNode.insertAdjacentElement('afterend', li);
  }

  function refreshApp() {
    if (typeof analyzeDistribution === 'function') analyzeDistribution(false);
    if (typeof updateAll === 'function') updateAll();
  }

  function load() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      var data = raw ? JSON.parse(raw) : {};
      return data && typeof data === 'object' ? data : {};
    } catch (error) {
      return {};
    }
  }

  function save() {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(answers)); } catch (error) { /* 저장 불가 시 화면만 갱신 */ }
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
})();
