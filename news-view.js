/* 뉴스 분석 화면을 data/news.json과 연결합니다 (docs/API_CONTRACT.md 1장).
 * - app.js를 건드리지 않는 별도 파일입니다. index.html 맨 아래에서 app.js 다음에 불러옵니다.
 * - 불러오기에 실패하거나 항목이 없으면 기존 데모 카드를 그대로 둡니다.
 * - 외부 기사 제목·링크를 다루므로 innerHTML을 쓰지 않고 textContent로만 넣습니다.
 */
(function () {
  'use strict';

  var NEWS_URL = './data/news.json';
  var MAX_CARDS = 12;
  var TYPE_LABEL = { official: '공식', market: '시장', news: '뉴스' };
  var SECTIONS = [
    ['facts', '확인된 사실'],
    ['ai_interpretation', 'AI 해석'],
    ['asset_impact', '내 자산 영향'],
    ['counter_evidence', '반대 근거'],
    ['change_condition', '판단 변경 조건']
  ];

  var panel = document.querySelector('[data-view-panel="news"]');
  if (!panel || !window.fetch) return;
  var grid = panel.querySelector('.source-grid');
  if (!grid) return;

  injectStyle();
  load();

  function load() {
    fetch(NEWS_URL, { cache: 'no-store' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data || !Array.isArray(data.items) || !data.items.length) return;
        render(data);
      })
      .catch(function () { /* 실패하면 기존 데모 카드 유지 */ });
  }

  function render(data) {
    var labels = data.categories || {};
    var items = data.items.slice(0, MAX_CARDS);

    grid.textContent = '';
    items.forEach(function (item) { grid.appendChild(card(item, labels)); });
    grid.dataset.source = 'news-json';

    renderFilters(items, labels);
    updateChip(data);
    renderFooter(data);
  }

  function card(item, labels) {
    var article = el('article', 'evidence-card news-card');
    article.dataset.categories = (item.categories || []).join(' ');

    var head = el('div', 'news-head');
    var type = TYPE_LABEL[item.source_type] ? item.source_type : 'news';
    head.appendChild(el('span', 'source-type ' + type, TYPE_LABEL[type]));
    if (item.importance >= 7) head.appendChild(el('span', 'news-tag news-tag-major', '주요'));
    if (item.ai_generated) head.appendChild(el('span', 'news-tag', 'AI 작성'));
    // 시장 지표는 날짜만 있는 값이라 시각 대신 기준일을 보여줍니다.
    var marketDate = item.value && item.value.date ? formatDay(item.value.date) : '';
    var time = el('time', '', marketDate ? marketDate + ' 기준' : formatTime(item.published_at));
    if (item.published_at) time.setAttribute('datetime', item.published_at);
    head.appendChild(time);
    article.appendChild(head);

    article.appendChild(el('h2', '', item.title || '(제목 없음)'));

    if (item.value && typeof item.value.latest === 'number') {
      var v = item.value;
      var unit = v.unit || '';
      var text = round(v.latest) + unit;
      if (typeof v.change === 'number' && isFinite(v.change)) {
        // 금리처럼 % 단위의 변화는 %p로 표시
        text += ' · 직전 대비 ' + (v.change > 0 ? '+' : '') + round(v.change) + (unit === '%' ? '%p' : unit);
      }
      article.appendChild(el('p', 'news-value', text));
    }

    var hasAi = SECTIONS.some(function (s) { return item[s[0]]; });
    if (hasAi) {
      var facts = item.facts ? el('p', '', item.facts) : null;
      if (facts) article.appendChild(facts);
      if (item.asset_impact) {
        var impact = el('p', 'news-impact');
        impact.appendChild(el('strong', '', '내 자산 영향'));
        impact.appendChild(document.createTextNode(item.asset_impact));
        article.appendChild(impact);
      }
      var more = SECTIONS.filter(function (s) {
        return s[0] !== 'facts' && s[0] !== 'asset_impact' && item[s[0]];
      });
      if (more.length) {
        var details = el('details', 'news-more');
        details.appendChild(el('summary', '', 'AI 해석·반대 근거 보기'));
        more.forEach(function (s) {
          var p = el('p', '');
          p.appendChild(el('strong', '', s[1]));
          p.appendChild(document.createTextNode(item[s[0]]));
          details.appendChild(p);
        });
        article.appendChild(details);
      }
    } else if (!item.value) {
      // AI 설명은 쓰지 않기로 함(2026-10-06) → 뉴스 기사는 원문 확인만 안내, 시장 지표는 숫자만 표시
      article.appendChild(el('p', 'news-pending', '자세한 내용은 아래 원문에서 확인하세요.'));
    }

    var foot = el('div', 'news-foot');
    var tags = el('span', 'news-cats', (item.categories || []).map(function (key) { return labels[key] || key; }).join(' · '));
    foot.appendChild(tags);
    var link = safeUrl(item.url);
    if (link) {
      var a = el('a', 'news-link', (item.source || '출처') + ' · 원문 보기');
      a.href = link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      foot.appendChild(a);
    } else if (item.source) {
      foot.appendChild(el('span', 'news-link', item.source));
    }
    article.appendChild(foot);
    return article;
  }

  function renderFilters(items, labels) {
    var old = panel.querySelector('.news-filters');
    if (old) old.remove();
    var present = [];
    items.forEach(function (item) {
      (item.categories || []).forEach(function (key) { if (present.indexOf(key) < 0) present.push(key); });
    });
    if (present.length < 2) return;
    var bar = el('div', 'news-filters');
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', '뉴스 분류');
    [['all', '전체']].concat(present.map(function (key) { return [key, labels[key] || key]; })).forEach(function (pair, index) {
      var button = el('button', 'news-filter' + (index === 0 ? ' active' : ''), pair[1]);
      button.type = 'button';
      button.dataset.filter = pair[0];
      button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
      button.addEventListener('click', function () { applyFilter(pair[0], bar); });
      bar.appendChild(button);
    });
    grid.parentNode.insertBefore(bar, grid);
  }

  function applyFilter(key, bar) {
    bar.querySelectorAll('.news-filter').forEach(function (button) {
      var on = button.dataset.filter === key;
      button.classList.toggle('active', on);
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    grid.querySelectorAll('.news-card').forEach(function (card) {
      var cats = (card.dataset.categories || '').split(' ');
      card.hidden = key !== 'all' && cats.indexOf(key) < 0;
    });
  }

  function updateChip(data) {
    var chip = panel.querySelector('.section-heading .data-chip');
    if (!chip) return;
    var text = (data.generated_at ? formatTime(data.generated_at) + ' 기준' : '수집 시각 없음') + (data.demo ? ' · 데모 데이터' : '');
    chip.textContent = '';
    chip.appendChild(document.createElement('i'));
    chip.appendChild(document.createTextNode(' ' + text));
  }

  function renderFooter(data) {
    var old = panel.querySelector('.news-attribution');
    if (old) old.remove();
    var box = el('div', 'news-attribution');
    if (data.notice) box.appendChild(el('p', '', data.notice));
    var list = el('ul', '');
    (data.attribution || []).forEach(function (line) { list.appendChild(el('li', '', line)); });
    box.appendChild(list);
    var note = panel.querySelector('.legal-note');
    panel.insertBefore(box, note || null);
    if (note) {
      note.textContent = '이 페이지는 이해를 돕기 위한 뉴스 요약이며 투자 권유가 아닙니다. 실제 투자 결정은 담당 PB와 상담 후 진행하세요.' +
        (data.demo ? ' 현재 화면의 뉴스는 데모 데이터입니다.' : ' 뉴스는 매시간 자동 수집되며, AI 문장은 "AI 작성"으로 표시합니다.');
    }
  }

  // ---------- 도구 ----------

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function safeUrl(url) {
    try {
      var parsed = new URL(url, window.location.href);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
    } catch (error) {
      return null;
    }
  }

  function round(x) {
    return Math.round(Number(x) * 100) / 100;
  }

  // '20261002' 또는 '2026-10-02' → '10/2'
  function formatDay(value) {
    var m = String(value).match(/^(\d{4})-?(\d{2})-?(\d{2})$/);
    return m ? Number(m[2]) + '/' + Number(m[3]) : '';
  }

  // 한국시간 기준. 오늘이면 HH:MM, 아니면 M/D HH:MM
  function formatTime(iso) {
    if (!iso) return '';
    var date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    var opts = { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false };
    var day = function (d) { return d.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }); };
    var hm = date.toLocaleTimeString('ko-KR', opts);
    if (day(date) === day(new Date())) return hm;
    var parts = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' })
      .formatToParts(date).forEach(function (part) { parts[part.type] = part.value; });
    return parts.month + '/' + parts.day + ' ' + hm;
  }

  function injectStyle() {
    if (document.getElementById('news-view-style')) return;
    var style = document.createElement('style');
    style.id = 'news-view-style';
    style.textContent = [
      '.news-card .news-head{display:flex;align-items:center;gap:6px;flex-wrap:wrap}',
      '.news-card .news-head time{margin-left:auto}',
      '.news-tag{padding:3px 7px;border-radius:7px;font-size:.59rem;font-weight:800;background:#eef2f8;color:#475467}',
      '.news-tag-major{background:#fdecea;color:#b42318}',
      '.news-card .news-value{font-weight:800;color:#07182d}',
      '.news-card .news-pending{color:#667085;font-size:.74rem}',
      '.news-card .news-more{margin-top:8px;font-size:.74rem;line-height:1.55}',
      '.news-card .news-more summary{cursor:pointer;color:#2f6fed;font-weight:700}',
      '.news-card .news-more p{margin:6px 0 0}',
      '.news-card .news-more strong{display:block;font-size:.68rem;color:#475467}',
      '.news-card .news-foot{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:12px;font-size:.68rem;color:#667085}',
      '.news-card .news-link{color:#2f6fed;font-weight:700;text-decoration:none;overflow-wrap:anywhere}',
      '.news-card .news-link:hover{text-decoration:underline}',
      '.news-filters{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}',
      '.news-filter{border:1px solid #d0d5dd;background:#fff;border-radius:999px;padding:5px 12px;font-size:.74rem;cursor:pointer}',
      '.news-filter.active{background:#07182d;border-color:#07182d;color:#fff}',
      '.news-attribution{margin-top:14px;font-size:.66rem;color:#667085;line-height:1.6}',
      '.news-attribution ul{margin:4px 0 0;padding-left:16px}',
      '.news-card[hidden]{display:none!important}'
    ].join('\n');
    document.head.appendChild(style);
  }
})();
