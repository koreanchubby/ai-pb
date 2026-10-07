// ---------------------------------------------------------------------------
// Supabase 저장 연결 (이슈 #20, 마일스톤 5)
// - 앱은 지금처럼 브라우저(localStorage)에 먼저 저장하고, 이 파일이 같은 내용을 Supabase DB에도 올립니다.
// - 로그인 없이 쓰므로 브라우저마다 Supabase "익명 로그인"으로 고유 사용자를 받습니다.
//   접근 규칙(RLS, supabase/schema.sql)이 있어 다른 브라우저의 데이터는 읽거나 쓸 수 없습니다.
// - 네트워크가 끊기거나 Supabase가 응답하지 않아도 앱은 그대로 동작합니다(조용히 건너뜀).
// - 아래 키는 웹에 공개해도 되는 publishable 키입니다. 비밀 키(secret/service_role)는 절대 넣지 않습니다.
// - app.js의 saveAppState()가 저장할 때마다 보내는 'aipb:saved' 이벤트를 받아 2초 모았다가 올립니다.
// ---------------------------------------------------------------------------
(function () {
  'use strict';

  const SUPABASE_URL = 'https://ozetifxlmlvfwnuqytqg.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_zIEDsfvGxC5HVtVm88buYA_J7D2dbUE';
  const SESSION_KEY = 'aipb-sb-session';
  const CLIENT_KEY = 'aipb-sb-client';
  const REC_HASH_KEY = 'aipb-sb-rec-hash';
  const ASSET_CATEGORIES = ['realestate', 'kretf', 'globaletf', 'govbond', 'corpbond', 'pef', 'alternative', 'cash', 'debt'];
  const EMPLOYMENTS = ['근로소득자', '사업자', '은퇴 예정', '은퇴'];
  const GOALS = ['general', 'retirement', 'transfer', 'both'];

  let syncTimer = null;
  let syncing = false;
  let pending = false;

  function readJson(key) {
    try { return JSON.parse(window.localStorage.getItem(key) || 'null'); } catch (error) { return null; }
  }
  function writeJson(key, value) {
    try {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) { /* 저장소 접근 불가 시 무시 */ }
  }

  async function call(method, path, body, token, prefer) {
    const headers = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    if (prefer) headers.Prefer = prefer;
    const response = await fetch(SUPABASE_URL + path, {
      method: method,
      headers: headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await response.text();
    if (!response.ok) throw new Error(method + ' ' + path.split('?')[0] + ' → ' + response.status + ' ' + text.slice(0, 120));
    return text ? JSON.parse(text) : null;
  }

  function keepSession(data) {
    const session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600)
    };
    writeJson(SESSION_KEY, session);
    return session;
  }

  // 익명 로그인: 저장된 세션 → 만료면 갱신 → 없거나 갱신 실패면 새 익명 사용자
  async function getToken() {
    const saved = readJson(SESSION_KEY);
    const now = Math.floor(Date.now() / 1000);
    if (saved && saved.access_token && saved.expires_at - 60 > now) return saved.access_token;
    if (saved && saved.refresh_token) {
      try {
        return keepSession(await call('POST', '/auth/v1/token?grant_type=refresh_token', { refresh_token: saved.refresh_token })).access_token;
      } catch (error) { /* 갱신 실패 → 새로 받음 */ }
    }
    writeJson(CLIENT_KEY, null);
    return keepSession(await call('POST', '/auth/v1/signup', { data: {} })).access_token;
  }

  // 이 브라우저의 고객 행(client) id. 없으면 만든다.
  async function getClientId(token) {
    const cached = readJson(CLIENT_KEY);
    if (cached) return cached;
    const rows = await call('GET', '/rest/v1/client?select=id&limit=1', undefined, token);
    let id = rows && rows[0] && rows[0].id;
    if (!id) id = (await call('POST', '/rest/v1/client', {}, token, 'return=representation'))[0].id;
    writeJson(CLIENT_KEY, id);
    return id;
  }

  function num(value) {
    const n = Number(value);
    return isFinite(n) ? n : null;
  }

  function hashOf(value) {
    const text = JSON.stringify(value);
    let h = 0;
    for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) | 0;
    return String(h);
  }

  async function upsert(table, rows, onConflict, token) {
    if (!rows.length) return;
    await call('POST', '/rest/v1/' + table + '?on_conflict=' + onConflict, rows, token, 'resolution=merge-duplicates,return=minimal');
  }

  async function syncNow(snapshot) {
    const app = snapshot.state || {};
    const fields = snapshot.fields || {};
    const token = await getToken();
    const clientId = await getClientId(token);
    const now = new Date().toISOString();

    // 1) 고객: 연령·현재 상태·설문으로 산출된 성향(설문을 다 답했을 때만)
    const age = num(fields.age);
    const profile = typeof surveyComplete === 'function' && surveyComplete() ? getProfile().level : null;
    await call('PATCH', '/rest/v1/client?id=eq.' + clientId, {
      age: age !== null && age >= 18 && age <= 100 ? Math.round(age) : null,
      employment: EMPLOYMENTS.indexOf(fields.employment) > -1 ? fields.employment : null,
      risk_profile: profile,
      updated_at: now
    }, token, 'return=minimal');

    // 2) 설문 원응답(고른 선택지 번호)
    const answers = (app.answers || []).map(function (option, index) {
      return option === null || option === undefined ? null : { client_id: clientId, question_no: index + 1, option_index: option, answered_at: now };
    }).filter(Boolean);
    await upsert('survey_answer', answers, 'client_id,question_no', token);

    // 3) 가족: 배우자·자녀 수만큼 행을 맞춤
    const family = [];
    for (let i = 1; i <= (app.spouse || 0); i += 1) family.push({ client_id: clientId, relation: 'spouse', order_no: i });
    for (let i = 1; i <= (app.children || 0); i += 1) family.push({ client_id: clientId, relation: 'child', order_no: i });
    await call('DELETE', '/rest/v1/family_member?client_id=eq.' + clientId + '&or=(and(relation.eq.spouse,order_no.gt.' + (app.spouse || 0) + '),and(relation.eq.child,order_no.gt.' + (app.children || 0) + '))', undefined, token);
    await upsert('family_member', family, 'client_id,relation,order_no', token);

    // 4) 목표
    if (GOALS.indexOf(app.goal) > -1) {
      await upsert('goal', [{
        client_id: clientId,
        goal_type: app.goal,
        retirement_in_years: num(fields['retirement-years']),
        monthly_spend_manwon: num(fields['monthly-spend']),
        pension_manwon: num(fields['pension-income']),
        updated_at: now
      }], 'client_id', token);
    }

    // 5) 자산(억원): 화면 계산과 같은 getAssets() 값을 그대로 씀
    const assets = typeof getAssets === 'function' ? getAssets() : {};
    const pefYear = num(fields['pef-year']);
    await upsert('asset', ASSET_CATEGORIES.filter(function (key) { return assets[key] !== undefined; }).map(function (key) {
      return {
        client_id: clientId,
        category: key,
        amount_eok: Math.max(0, num(assets[key]) || 0),
        redeemable_year: key === 'pef' && pefYear ? Math.round(pefYear) : null,
        must_hold: (key === 'realestate' && fields['lock-home'] === true) || (key === 'pef' && fields['lock-pef'] === true),
        updated_at: now
      };
    }), 'client_id,category', token);

    // 6) 승계 계획(승계가 포함된 목표일 때만)
    if (app.goal === 'transfer' || app.goal === 'both') {
      await upsert('transfer_plan', [{
        client_id: clientId,
        liquidity_target_eok: num(app.estateTarget),
        funding_mode: ['financial', 'insurance', 'installment'].indexOf(app.estateMode) > -1 ? app.estateMode : null,
        insurance_reserve_eok: num(fields['insurance-reserve']),
        gift_within_5y: fields['gift-window'] === true,
        updated_at: now
      }], 'client_id', token);
    }

    // 7) 추천안: 리포트 화면에 도착했고, 목표 배분이 지난번과 다를 때만 새 행으로 쌓음
    // app.js의 state는 const 전역이라 window.state가 아니라 이름으로 접근
    const plan = typeof state !== 'undefined' && state ? state.plan : null;
    if (app.currentView === 'report' && plan && plan.target) {
      const record = { use_taa: !!app.useTaa, use_band: app.useBand !== false, target_weights: plan.target };
      const hash = hashOf(record);
      if (readJson(REC_HASH_KEY) !== hash) {
        await call('POST', '/rest/v1/recommendation', Object.assign({ client_id: clientId }, record), token, 'return=minimal');
        writeJson(REC_HASH_KEY, hash);
      }
    }
  }

  async function runSync(snapshot) {
    if (syncing) { pending = snapshot; return; }
    syncing = true;
    try {
      await syncNow(snapshot);
      document.documentElement.dataset.dbSync = 'ok';
    } catch (error) {
      // 세션·고객 행이 꼬였으면(예: 서버에서 지워짐) 다음 저장 때 새로 만들도록 비움
      if (/→ (401|403|404|409)/.test(String(error.message))) { writeJson(CLIENT_KEY, null); }
      document.documentElement.dataset.dbSync = 'error';
      if (window.console) console.warn('[db-sync] Supabase 저장 건너뜀:', error.message);
    } finally {
      syncing = false;
      if (pending) { const next = pending; pending = false; runSync(next); }
    }
  }

  window.addEventListener('aipb:saved', function (event) {
    if (!navigator.onLine) return;
    const snapshot = event.detail;
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(function () { runSync(snapshot); }, 2000);
  });

  // "처음부터 다시"를 누르면 서버 쪽 연결 정보도 잊음(새 익명 고객으로 시작)
  window.addEventListener('aipb:reset', function () {
    writeJson(SESSION_KEY, null);
    writeJson(CLIENT_KEY, null);
    writeJson(REC_HASH_KEY, null);
  });
})();
