(function () {
  'use strict';

  var pixelId = '1238387361256000';
  var consentKey = 'roraima-meta-measurement-consent';
  var consumerRoute = '#/para-ti';
  var pixelStarted = false;
  var lastMeasuredRoute = '';
  var root;
  var productionHost = /^(www\.)?roraimamx\.com$/i.test(window.location.hostname);

  function route() {
    return window.location.hash.split('?')[0] || '#/';
  }

  function isConsumerEntry() {
    return route() === consumerRoute;
  }

  function startPixel() {
    if (pixelStarted || !productionHost || window.localStorage.getItem(consentKey) !== 'yes') return;
    pixelStarted = true;
    if (!window.fbq) {
      var fbq = window.fbq = function () {
        fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
      };
      if (!window._fbq) window._fbq = fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = '2.0';
      fbq.queue = [];
      var script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);
    }
    window.fbq('init', pixelId);
    measureRoute();
  }

  function measureRoute() {
    if (!pixelStarted || !window.fbq || lastMeasuredRoute === route()) return;
    lastMeasuredRoute = route();
    window.fbq('track', 'PageView');
    if (lastMeasuredRoute.indexOf('#/producto/') === 0) {
      window.fbq('track', 'ViewContent', {
        content_ids: [decodeURIComponent(lastMeasuredRoute.slice('#/producto/'.length))],
        content_type: 'product',
        content_name: 'Silhouette'
      });
    }
  }

  function makeLanding() {
    root = document.createElement('div');
    root.id = 'sil-consumer-root';
    root.hidden = !isConsumerEntry();
    root.innerHTML = `
      <header class="sil-c-header">
        <a class="sil-c-brand" href="#/para-ti" aria-label="Silhouette, inicio para consumidores">Silhouette</a>
        <nav class="sil-c-nav" aria-label="Navegación para consumidores">
          <a href="#/catalogo" data-analytics-event="consumer_catalog" data-analytics-brand="silhouette" data-analytics-route="/para-ti">Modelos</a>
          <a href="/opticas/" data-analytics-event="find_optician_click" data-analytics-brand="silhouette" data-analytics-route="/para-ti" data-consumer-action="find-optician">Ópticas</a>
        </nav>
      </header>
      <main>
        <section class="sil-c-hero" aria-labelledby="sil-c-title">
          <div class="sil-c-hero-copy">
            <p class="sil-c-eyebrow">Silhouette en México</p>
            <h1 id="sil-c-title">Tu forma de mirar el mundo.</h1>
            <p class="sil-c-lead">Explora las monturas Silhouette, descubre el estilo que va contigo y encuentra una óptica cercana para preguntar por tu modelo favorito.</p>
            <div class="sil-c-actions">
              <a class="sil-c-button" href="#/catalogo" data-analytics-event="consumer_catalog" data-analytics-brand="silhouette" data-analytics-route="/para-ti">Ver modelos</a>
              <a class="sil-c-button sil-c-button--light" href="/opticas/" data-analytics-event="find_optician_click" data-analytics-brand="silhouette" data-analytics-route="/para-ti" data-consumer-action="find-optician">Encontrar mi óptica</a>
            </div>
            <p class="sil-c-note">Consulta modelos y disponibilidad directamente con la óptica de tu elección.</p>
          </div>
          <div class="sil-c-hero-image"><img src="./catalog/lite-spirit-accent-rings.jpg" alt="Montura Silhouette con detalles verdes y dorados" fetchpriority="high"></div>
        </section>
        <section class="sil-c-section" aria-labelledby="sil-c-collection-title">
          <p class="sil-c-eyebrow">Explora la colección</p>
          <div class="sil-c-section-head">
            <h2 id="sil-c-collection-title">Un modelo para cada mirada.</h2>
            <a class="sil-c-text-link" href="#/catalogo" data-analytics-event="consumer_catalog" data-analytics-brand="silhouette" data-analytics-route="/para-ti">Ver catálogo completo →</a>
          </div>
          <div class="sil-c-grid">
            <a class="sil-c-card" href="#/catalogo/gafas-graduadas" data-analytics-event="consumer_catalog" data-analytics-brand="silhouette" data-analytics-route="/para-ti"><img src="./catalog/the-wave.jpg" alt="Montura óptica Silhouette" loading="lazy"><div><strong>Gafas graduadas</strong><span aria-hidden="true">↗</span></div></a>
            <a class="sil-c-card" href="#/catalogo/gafas-de-sol" data-analytics-event="consumer_catalog" data-analytics-brand="silhouette" data-analytics-route="/para-ti"><img src="./catalog/sant-pere.jpg" alt="Gafas de sol Silhouette" loading="lazy"><div><strong>Gafas de sol</strong><span aria-hidden="true">↗</span></div></a>
          </div>
        </section>
        <section class="sil-c-steps" aria-labelledby="sil-c-steps-title"><div class="sil-c-section">
          <p class="sil-c-eyebrow">Así de sencillo</p>
          <h2 id="sil-c-steps-title">Descubre. Elige. Encuentra.</h2>
          <div class="sil-c-steps-grid">
            <article><span>01 / DESCUBRE</span><h3>Conoce Silhouette</h3><p>Explora la colección y sus diferentes estilos.</p></article>
            <article><span>02 / ELIGE</span><h3>Identifica tu favorito</h3><p>Recuerda el modelo y color que te gustaría conocer.</p></article>
            <article><span>03 / ENCUENTRA</span><h3>Busca una óptica</h3><p>Consulta en el directorio los horarios, el teléfono y cómo llegar.</p></article>
          </div>
          <a class="sil-c-button" href="/opticas/" data-analytics-event="find_optician_click" data-analytics-brand="silhouette" data-analytics-route="/para-ti" data-consumer-action="find-optician">Encontrar mi óptica</a>
        </div></section>
      </main>
      <footer class="sil-c-footer"><span>Silhouette México · Roraima Distribuciones</span><span>Los modelos se consultan directamente en cada óptica. <a href="/silhouette/politica-de-privacidad/">Privacidad</a></span></footer>`;
    document.body.insertBefore(root, document.getElementById('app'));
  }

  function showConsent() {
    if (!isConsumerEntry() || window.localStorage.getItem(consentKey)) return;
    var notice = document.createElement('div');
    notice.className = 'sil-c-consent';
    notice.setAttribute('role', 'dialog');
    notice.setAttribute('aria-label', 'Medición opcional de Meta');
    notice.innerHTML = '<p>¿Nos permites medir con Meta Pixel qué páginas y modelos se consultan? Puedes continuar sin aceptarlo. <a href="/silhouette/politica-de-privacidad/">Privacidad</a></p><button type="button" data-consent="no">Rechazar</button><button type="button" data-consent="yes">Aceptar</button>';
    notice.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-consent]');
      if (!button) return;
      window.localStorage.setItem(consentKey, button.dataset.consent);
      notice.remove();
      startPixel();
    });
    document.body.appendChild(notice);
  }

  function syncRoute() {
    var onEntry = isConsumerEntry();
    document.documentElement.dataset.silConsumer = onEntry ? 'true' : 'false';
    if (root) root.hidden = !onEntry;
    if (onEntry) {
      document.title = 'Silhouette para ti | México';
      showConsent();
    } else {
      var notice = document.querySelector('.sil-c-consent');
      if (notice) notice.remove();
    }
    measureRoute();
  }

  function cleanNullText() {
    var app = document.getElementById('app');
    if (!app || isConsumerEntry()) return;
    var walker = document.createTreeWalker(app, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var value = node.nodeValue;
      if (!value || !/\bnull\b/i.test(value)) continue;
      if (/^\s*null\s*$/i.test(value)) {
        var row = node.parentElement;
        if (row && row.previousElementSibling && /material/i.test(row.previousElementSibling.textContent || '')) {
          row.previousElementSibling.hidden = true;
          row.hidden = true;
          var materialColumn = row.parentElement && row.parentElement.parentElement;
          if (materialColumn && !/se incluye/i.test(materialColumn.textContent || '')) {
            materialColumn.hidden = true;
          }
        }
      } else {
        node.nodeValue = value.replace(/\s+en null\b/gi, '').replace(/\s+null\b/gi, '');
      }
    }
  }

  function boot() {
    makeLanding();
    startPixel();
    syncRoute();
    var cleanScheduled = false;
    var app = document.getElementById('app');
    if (app) new MutationObserver(function () {
      if (cleanScheduled) return;
      cleanScheduled = true;
      window.requestAnimationFrame(function () { cleanScheduled = false; cleanNullText(); });
    }).observe(app, { childList: true, characterData: true, subtree: true });
    cleanNullText();
    window.addEventListener('hashchange', syncRoute);
    var titleElement = document.querySelector('title');
    if (titleElement) new MutationObserver(function () {
      if (isConsumerEntry() && document.title !== 'Silhouette para ti | México') {
        document.title = 'Silhouette para ti | México';
      }
    }).observe(titleElement, { childList: true, characterData: true, subtree: true });
    document.addEventListener('click', function (event) {
      var action = event.target instanceof Element && event.target.closest('[data-consumer-action="find-optician"]');
      var productButton = !action && route().indexOf('#/producto/') === 0 && event.target instanceof Element && event.target.closest('button');
      if (!action && (!productButton || !/encontrar una óptica/i.test(productButton.textContent || ''))) return;
      if (pixelStarted && window.fbq) window.fbq('trackCustom', 'FindOptician', { source: action ? 'consumer_entry' : 'product' });
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}());
