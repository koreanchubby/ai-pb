/* 미리보기: 뉴스 분석 화면에 '데일리 시황' 탭을 붙입니다 (data/daily_brief.json).
 * 시황은 원문을 확인한 기사만 우리 말로 요약한 것이며, 배분(비중 숫자)은 바꾸지 않습니다.
 * 화면 글자는 모두 textContent로 넣습니다(innerHTML 사용 안 함).
 */
(function () {
  'use strict';

  var BRIEF_URL = '../data/daily_brief.json';
  var panel = document.querySelector('[data-view-panel="news"]');
  if (!panel) return;
  var heading = panel.querySelector('.section-heading');
  var box = el('div', 'brief-panel');
  box.hidden = true;
  var tabs = buildTabs();
  heading.insertAdjacentElement('afterend', tabs);
  tabs.insertAdjacentElement('afterend', box);

  fetch(BRIEF_URL, { cache: 'no-cache' })
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (data) {
      if (!data || !Array.isArray(data.briefs) || !data.briefs.length) {
        box.appendChild(el('p', 'brief-empty', '아직 공개된 데일리 시황이 없어요.'));
        return;
      }
      renderBriefs(data);
    })
    .catch(function () { box.appendChild(el('p', 'brief-empty', '데일리 시황을 불러오지 못했어요. 잠시 후 다시 열어 주세요.')); });

  function buildTabs() {
    var bar = el('div', 'news-tabs');
    bar.setAttribute('role', 'tablist');
    bar.setAttribute('aria-label', '뉴스 분석 · 데일리 시황');
    [['news', '뉴스 분석'], ['brief', '데일리 시황']].forEach(function (pair, index) {
      var button = el('button', 'news-tab' + (index === 0 ? ' active' : ''), pair[1]);
      button.type = 'button';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      if (pair[0] === 'brief') button.appendChild(el('span', 'news-tab-new', 'NEW'));
      button.addEventListener('click', function () { showTab(pair[0]); });
      bar.appendChild(button);
    });
    return bar;
  }

  function showTab(name) {
    tabs.querySelectorAll('.news-tab').forEach(function (button, index) {
      var on = (index === 1) === (name === 'brief');
      button.classList.toggle('active', on);
      button.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panel.classList.toggle('showing-brief', name === 'brief');
    box.hidden = name !== 'brief';
  }

  function renderBriefs(data) {
    var dates = el('div', 'brief-dates');
    var holder = el('div', '');
    data.briefs.forEach(function (brief, index) {
      var button = el('button', 'brief-date' + (index === 0 ? ' active' : ''), brief.label);
      button.type = 'button';
      if (brief.sublabel) button.appendChild(el('small', '', brief.sublabel));
      button.addEventListener('click', function () {
        dates.querySelectorAll('.brief-date').forEach(function (b) { b.classList.toggle('active', b === button); });
        holder.textContent = '';
        holder.appendChild(briefCard(brief));
      });
      dates.appendChild(button);
    });
    holder.appendChild(briefCard(data.briefs[0]));
    box.appendChild(dates);
    box.appendChild(holder);
    if (data.notice) box.appendChild(el('p', 'legal-note', data.notice));
  }

  function briefCard(brief) {
    var card = el('article', 'brief-card');
    var head = el('header', 'brief-head');
    var title = el('h2', '', '📊 AI PB 데일리 시황 ');
    title.appendChild(el('span', '', '| ' + brief.date_title));
    head.appendChild(title);
    head.appendChild(el('p', '', brief.approval));
    card.appendChild(head);

    var sum = section('📝 오늘 한 줄 요약');
    sum.appendChild(el('p', 'brief-lead', brief.summary));
    card.appendChild(sum);

    var ind = section('📌 핵심 지표', '(AI PB 앱 수집값)');
    var list = el('ul', 'brief-list');
    (brief.indicators || []).forEach(function (item) {
      var li = el('li', '');
      li.appendChild(el('b', '', item.name));
      li.appendChild(document.createTextNode(' ' + item.value + ' '));
      li.appendChild(el('span', 'brief-change ' + (item.dir || 'flat'), item.change));
      li.appendChild(el('em', '', '기준일 ' + item.date + ' · ' + item.source));
      list.appendChild(li);
    });
    ind.appendChild(list);
    if (brief.indicator_note) ind.appendChild(el('p', 'brief-note', '※ ' + brief.indicator_note));
    card.appendChild(ind);

    var news = section('📰 주요 뉴스');
    (brief.news || []).forEach(function (item, index) {
      var row = el('div', 'brief-news');
      row.appendChild(el('p', 'brief-news-title', '①②③④⑤⑥⑦⑧'.charAt(index) + ' [' + item.topic + '] ' + item.title));
      row.appendChild(el('p', '', item.summary));
      var meta = el('p', 'brief-meta', '→ 영향: ' + item.impact + ' · ');
      (item.sources || []).forEach(function (source, i) {
        if (i) meta.appendChild(document.createTextNode('·'));
        var link = el('a', '', source.name);
        link.href = source.url;
        link.target = '_blank';
        link.rel = 'noopener';
        meta.appendChild(link);
      });
      meta.appendChild(document.createTextNode(', ' + item.date));
      row.appendChild(meta);
      news.appendChild(row);
    });
    card.appendChild(news);

    if (brief.implications && brief.implications.length) {
      var imp = section('💡 자산군별 시사점', '(참고 · 일반론)');
      var ul = el('ul', 'brief-list');
      brief.implications.forEach(function (item) {
        var li = el('li', '');
        li.appendChild(el('b', '', item.asset));
        li.appendChild(document.createTextNode(' ' + item.text));
        ul.appendChild(li);
      });
      imp.appendChild(ul);
      card.appendChild(imp);
    }

    var keep = el('div', 'brief-sec brief-keep');
    if (brief.decision) {
      var decision = el('div', 'brief-decision');
      var label = el('b', '', '🗂 우리 판단 ');
      label.appendChild(el('small', '', brief.decision.id));
      decision.appendChild(label);
      decision.appendChild(document.createTextNode(brief.decision.text + ' '));
      if (brief.decision.note) decision.appendChild(el('span', 'brief-muted', '(' + brief.decision.note + ')'));
      keep.appendChild(decision);
    }
    if (brief.client_message) {
      var client = el('div', 'brief-client');
      client.appendChild(el('small', '', '💬 고객에게 보내는 한마디'));
      client.appendChild(document.createTextNode('"' + brief.client_message + '"'));
      keep.appendChild(client);
    }
    card.appendChild(keep);
    return card;
  }

  function section(title, small) {
    var sec = el('div', 'brief-sec');
    var h = el('h3', '', title + (small ? ' ' : ''));
    if (small) h.appendChild(el('small', '', small));
    sec.appendChild(h);
    return sec;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
})();
