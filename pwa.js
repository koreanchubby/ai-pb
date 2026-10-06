/* PWA 등록과 온라인 상태 표시. app.js와 분리해 두어 화면 코드와 충돌하지 않게 합니다. */
(function () {
  var OFFLINE_TEXT = '오프라인입니다. 마지막으로 저장된 화면과 뉴스를 보여줍니다.';

  if ('serviceWorker' in navigator && window.isSecureContext) {
    // 처음 방문(아직 서비스 워커가 없음)에는 설치 직후 새로고침하지 않도록 기억해 둡니다.
    var hadController = Boolean(navigator.serviceWorker.controller);
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').then(function (registration) {
        // 이미 받아 둔 새 버전이 기다리고 있으면 바로 알림
        if (registration.waiting && navigator.serviceWorker.controller) offerUpdate(registration.waiting);
        registration.addEventListener('updatefound', function () {
          var worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', function () {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(worker);
          });
        });
      }).catch(function () { /* 등록 실패해도 앱은 그대로 동작 */ });
      var reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (reloading || !hadController) return;
        reloading = true;
        window.location.reload();
      });
    });
  }

  function offerUpdate(worker) {
    showBanner('pwa-update-banner', '새 버전이 있습니다. ', '새로고침', function () {
      worker.postMessage('skip-waiting');
    }, 56);
  }

  function showBanner(id, text, actionLabel, onAction, offset) {
    var banner = document.getElementById(id);
    if (!banner) {
      banner = document.createElement('div');
      banner.id = id;
      banner.setAttribute('role', 'status');
      banner.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);z-index:9999;' +
        'top:calc(' + (12 + offset) + 'px + env(safe-area-inset-top));' +
        'background:#07182d;color:#fff;padding:10px 14px;border-radius:10px;font-size:14px;' +
        'box-shadow:0 6px 20px rgba(0,0,0,.25);max-width:calc(100% - 32px)';
      document.body.appendChild(banner);
    }
    banner.textContent = text;
    if (actionLabel) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = actionLabel;
      button.style.cssText = 'margin-left:8px;background:#5b8cff;color:#fff;border:0;border-radius:6px;padding:4px 10px;cursor:pointer';
      button.addEventListener('click', onAction);
      banner.appendChild(button);
    }
    banner.hidden = false;
  }

  function hideBanner(id) {
    var banner = document.getElementById(id);
    if (banner) banner.hidden = true;
  }

  function showOffline() { showBanner('pwa-offline-banner', OFFLINE_TEXT, null, null, 0); }

  window.addEventListener('offline', showOffline);
  window.addEventListener('online', function () { hideBanner('pwa-offline-banner'); });
  if (!navigator.onLine) {
    if (document.body) showOffline();
    else document.addEventListener('DOMContentLoaded', showOffline);
  }
})();
