/* AI PB 서비스 워커 — 오프라인에서도 화면이 열리게 합니다.
 * 앱 파일·데이터: 네트워크 먼저, 실패(오프라인)하면 마지막 저장본 (network-first)
 *   → 온라인일 때는 항상 최신 파일이 보이므로 팀원이 CSS·JS를 고쳐도 캐시 때문에 헷갈리지 않습니다.
 * 저장 대상: 아래 SHELL_FILES, data/*.json, 앱 첫 화면. 그 밖의 주소(docs 등)는 건드리지 않습니다.
 * SHELL_FILES 목록(파일 추가·삭제)을 바꿀 때만 CACHE_VERSION 숫자를 올립니다.
 */
const CACHE_VERSION = 'v1';
const SHELL_CACHE = 'aipb-shell-' + CACHE_VERSION;
const DATA_CACHE = 'aipb-data-' + CACHE_VERSION;
const SHELL_FILES = [
  './',
  './index.html',
  './styles.css',
  './v3.css',
  './app.js',
  './pwa.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];
const SCOPE = new URL('./', self.location).href;
const SCOPE_PATH = new URL(SCOPE).pathname;
const SHELL_URLS = SHELL_FILES.map(function (path) { return new URL(path, SCOPE).href; });
const INDEX_URL = new URL('./index.html', SCOPE).href;

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function (cache) { return cache.addAll(SHELL_FILES); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key.indexOf('aipb-') === 0 && key !== SHELL_CACHE && key !== DATA_CACHE;
      }).map(function (key) { return caches.delete(key); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (event) {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

// 이 요청을 어떤 이름으로, 어느 캐시에 저장할지 정합니다. null이면 서비스 워커가 관여하지 않습니다.
function cacheTarget(request, url) {
  if (url.origin !== self.location.origin || url.pathname.indexOf(SCOPE_PATH) !== 0) return null;
  const rel = url.pathname.slice(SCOPE_PATH.length);
  if (request.mode === 'navigate') {
    // 한 페이지 앱: 첫 화면 주소(?source=pwa 같은 쿼리 포함)는 모두 index.html 하나로 저장
    return rel === '' || rel === 'index.html' ? { key: INDEX_URL, cache: SHELL_CACHE } : null;
  }
  if (/^data\/[\w-]+\.json$/.test(rel)) return { key: url.origin + url.pathname, cache: DATA_CACHE };
  if (!url.search && SHELL_URLS.indexOf(url.href) > -1) return { key: url.href, cache: SHELL_CACHE };
  return null;
}

function networkFirst(event, target) {
  return fetch(event.request).then(function (response) {
    if (response && response.ok && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil(caches.open(target.cache).then(function (cache) { return cache.put(target.key, copy); }));
    }
    return response;
  }).catch(function () {
    return caches.match(target.key).then(function (cached) { return cached || Response.error(); });
  });
}

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  const target = cacheTarget(event.request, new URL(event.request.url));
  if (!target) return;
  event.respondWith(networkFirst(event, target));
});
