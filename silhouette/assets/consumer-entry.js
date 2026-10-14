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
      <header class="sil-c-topbar" id="sil-c-topbar">
        <a class="sil-c-brand" href="#/para-ti" aria-label="Silhouette, inicio para consumidores"><img src="https://storage.googleapis.com/msgsndr/fHXK54ukeNMjxEcZtyDv/media/694494dbaca6ab20da759fbf.png" alt="Silhouette"></a>
        <nav class="sil-c-nav" aria-label="Navegación para consumidores">
          <button type="button" class="sil-c-button sil-c-button--ghost" data-scroll-target="sil-c-video">Video</button>
          <a class="sil-c-button sil-c-button--ghost" href="#/catalogo" data-analytics-event="consumer_catalog" data-analytics-brand="silhouette" data-analytics-route="/para-ti">Ver modelos</a>
          <a class="sil-c-button sil-c-button--ghost" href="/opticas/" data-analytics-event="find_optician_click" data-analytics-brand="silhouette" data-analytics-route="/para-ti" data-consumer-action="find-optician">Encontrar mi óptica</a>
        </nav>
        <button class="sil-c-menu-toggle" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="sil-c-mobile-menu"><span></span><span></span><span></span></button>
      </header>
      <nav class="sil-c-mobile-menu" id="sil-c-mobile-menu" aria-label="Menú móvil" hidden>
        <button type="button" data-scroll-target="sil-c-video">Video</button>
        <a href="#/catalogo" data-analytics-event="consumer_catalog" data-analytics-brand="silhouette" data-analytics-route="/para-ti">Ver modelos</a>
        <a href="/opticas/" data-analytics-event="find_optician_click" data-analytics-brand="silhouette" data-analytics-route="/para-ti" data-consumer-action="find-optician">Encontrar mi óptica</a>
      </nav>
      <main>
        <section class="sil-c-hero" aria-labelledby="sil-c-title">
          <video class="sil-c-hero-video" autoplay muted loop playsinline preload="metadata" poster="./catalog/lite-spirit-accent-rings.jpg" aria-label="Video Silhouette"><source src="https://storage.googleapis.com/msgsndr/fHXK54ukeNMjxEcZtyDv/media/694605368dda72e018c6be93.mp4" type="video/mp4"></video>
          <div class="sil-c-hero-copy">
            <p class="sil-c-eyebrow">Silhouette en México</p>
            <h1 id="sil-c-title">Una mirada muy tuya</h1>
            <p class="sil-c-lead">Descubre las monturas Silhouette, explora sus modelos y encuentra una óptica cercana donde preguntar por tu favorito.</p>
            <div class="sil-c-actions">
              <a class="sil-c-button" href="#/catalogo" data-analytics-event="consumer_catalog" data-analytics-brand="silhouette" data-analytics-route="/para-ti">Ver modelos</a>
              <a class="sil-c-button sil-c-button--ghost" href="/opticas/" data-analytics-event="find_optician_click" data-analytics-brand="silhouette" data-analytics-route="/para-ti" data-consumer-action="find-optician">Encontrar mi óptica</a>
            </div>
            <p class="sil-c-note">Modelos e información para elegir. Consulta directamente con la óptica.</p>
          </div>
        </section>
        <section class="sil-c-section sil-c-video-section" id="sil-c-video" aria-labelledby="sil-c-video-title">
          <p class="sil-c-eyebrow">Descubre la marca</p>
          <h2 id="sil-c-video-title">Silhouette en movimiento</h2>
          <p class="sil-c-section-lead">Conoce el estilo de la colección y después explora los modelos en el catálogo.</p>
          <div class="sil-c-video-card">
            <video class="sil-c-feature-video" controls playsinline preload="metadata" poster="./catalog/lite-spirit-accent-rings.jpg" aria-label="Video de la colección Silhouette"><source src="https://storage.googleapis.com/msgsndr/fHXK54ukeNMjxEcZtyDv/media/694605368dda72e018c6be93.mp4" type="video/mp4"></video>
            <div class="sil-c-video-caption"><span>Descubre · Elige · Encuentra</span><div class="sil-c-actions"><a class="sil-c-button" href="#/catalogo" data-analytics-event="consumer_catalog" data-analytics-brand="silhouette" data-analytics-route="/para-ti">Ver modelos</a><a class="sil-c-button sil-c-button--light" href="/opticas/" data-analytics-event="find_optician_click" data-analytics-brand="silhouette" data-analytics-route="/para-ti" data-consumer-action="find-optician">Encontrar mi óptica</a></div></div>
          </div>
        </section>
        <section class="sil-c-section" aria-labelledby="sil-c-collection-title">
          <p class="sil-c-eyebrow">Categorías</p>
          <h2 id="sil-c-collection-title">Elige tu colección</h2>
          <p class="sil-c-section-lead">Explora los modelos reales del catálogo. Desde cada ficha podrás ir al directorio de ópticas.</p>
          <div class="sil-c-grid">
            <a class="sil-c-card" href="#/catalogo/gafas-graduadas" data-analytics-event="consumer_catalog" data-analytics-brand="silhouette" data-analytics-route="/para-ti"><img src="./catalog/the-wave.jpg" alt="Montura óptica Silhouette" loading="lazy"><div><strong>Gafas graduadas</strong><span>Ver modelos ↗</span></div></a>
            <a class="sil-c-card" href="#/catalogo/gafas-de-sol" data-analytics-event="consumer_catalog" data-analytics-brand="silhouette" data-analytics-route="/para-ti"><img src="./catalog/sant-pere.jpg" alt="Gafas de sol Silhouette" loading="lazy"><div><strong>Gafas de sol</strong><span>Ver modelos ↗</span></div></a>
          </div>
          <a class="sil-c-text-link" href="#/catalogo" data-analytics-event="consumer_catalog" data-analytics-brand="silhouette" data-analytics-route="/para-ti">Ver catálogo completo →</a>
        </section>
        <section class="sil-c-steps" aria-labelledby="sil-c-steps-title"><div class="sil-c-section">
          <p class="sil-c-eyebrow">Tu recorrido</p>
          <h2 id="sil-c-steps-title">Del modelo a la óptica</h2>
          <div class="sil-c-steps-grid">
            <article><span>01 / DESCUBRE</span><h3>Conoce Silhouette</h3><p>Explora la colección y sus diferentes estilos.</p></article>
            <article><span>02 / ELIGE</span><h3>Identifica tu favorito</h3><p>Recuerda el modelo y color que te gustaría conocer.</p></article>
            <article><span>03 / ENCUENTRA</span><h3>Busca una óptica</h3><p>Consulta en el directorio los horarios, el teléfono y cómo llegar.</p></article>
          </div>
          <a class="sil-c-button" href="/opticas/" data-analytics-event="find_optician_click" data-analytics-brand="silhouette" data-analytics-route="/para-ti" data-consumer-action="find-optician">Encontrar mi óptica</a>
        </div></section>
        <section class="sil-c-section sil-c-faq" aria-labelledby="sil-c-faq-title"><p class="sil-c-eyebrow">Preguntas frecuentes</p><h2 id="sil-c-faq-title">Antes de visitar una óptica</h2><details><summary>¿Puedo comprar en esta página?</summary><p>Esta página muestra la colección. Para consultar precios, modelos y disponibilidad, contacta con una óptica del directorio.</p></details><details><summary>¿Cómo encuentro una óptica cercana?</summary><p>Abre el directorio, busca tu ciudad y revisa la dirección, horario, teléfono e indicaciones del establecimiento que prefieras.</p></details></section>
      </main>
      <footer class="sil-c-footer"><span>Silhouette México · Roraima Distribuciones</span><span>Los modelos se consultan directamente en cada óptica. <a href="/silhouette/politica-de-privacidad/">Privacidad</a></span></footer>`;
    document.body.insertBefore(root, document.getElementById('app'));
    var menuButton = root.querySelector('.sil-c-menu-toggle');
    var mobileMenu = root.querySelector('.sil-c-mobile-menu');
    menuButton.addEventListener('click', function () {
      var open = mobileMenu.hidden;
      mobileMenu.hidden = !open;
      menuButton.setAttribute('aria-expanded', String(open));
    });
    root.addEventListener('click', function (event) {
      var scrollButton = event.target.closest('[data-scroll-target]');
      if (scrollButton) document.getElementById(scrollButton.dataset.scrollTarget).scrollIntoView({ behavior: 'smooth' });
      if (event.target.closest('.sil-c-mobile-menu a, .sil-c-mobile-menu button')) {
        mobileMenu.hidden = true;
        menuButton.setAttribute('aria-expanded', 'false');
      }
    });
    window.addEventListener('scroll', function () {
      root.querySelector('.sil-c-topbar').classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
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
