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
    var faqGroups = [
      { id: 'produccion', title: 'Producción, productos y conservación', questions: [
        ['¿Qué tiene de especial el titanio de alta tecnología de Silhouette?', 'Silhouette utiliza titanio en determinados modelos por su ligereza, flexibilidad y comodidad. Consulta la ficha de cada montura para conocer sus materiales.'],
        ['¿De qué países de origen obtiene Silhouette la principal materia prima, el titanio?', 'Según la información de Silhouette, el titanio de sus aleaciones especiales procede de Japón.'],
        ['¿Qué tiene de especial el Silhouette SPX®+?', 'SPX®+ es un material desarrollado para monturas ligeras y flexibles. Sus características concretas dependen del modelo.'],
        ['¿De qué países de origen obtiene Silhouette la materia prima SPX®+?', 'Silhouette indica que el granulado de poliamida utilizado para SPX®+ procede de un proveedor suizo.'],
        ['¿Qué incluyen los lentes Silhouette?', 'Los accesorios incluidos pueden variar. Pregunta en la óptica por el estuche, la gamuza y los elementos del modelo elegido.'],
        ['¿Cómo se determina el tamaño de los lentes o la longitud de varilla ideal?', 'Una óptica puede revisar las medidas de la montura y ayudarte a elegir el ajuste adecuado para ti.'],
        ['¿Cómo se deben limpiar y conservar los lentes de graduación y de sol?', 'Usa agua limpia y una gamuza suave de microfibra. Evita frotar en seco y sigue las indicaciones de cuidado de tu óptica.'],
        ['¿Cómo debo guardar mis lentes de sol Silhouette?', 'Guárdalos en un estuche adecuado cuando no los uses para ayudar a proteger montura y micas.'],
        ['¿Se venden también estuches de lentes?', 'Consulta en una óptica si hay un estuche de repuesto compatible con tu modelo.'],
        ['¿Cuáles son las especificaciones técnicas de los lentes de sol Silhouette?', 'La protección y el tipo de mica varían según el modelo. Revisa su ficha y pide a la óptica las especificaciones del par que te interesa.'],
        ['¿Cómo identificar el nivel de protección a partir del código en el interior de la varilla?', 'La categoría de filtro figura en la identificación del modelo. Una óptica puede ayudarte a interpretarla y elegirla según el uso previsto.'],
        ['¿Qué ofrece Silhouette Light Management®?', 'Es una tecnología de micas presente en ciertos lentes de sol Silhouette. Confirma en la ficha o con la óptica si el modelo elegido la incorpora.'],
        ['¿Qué ventajas tienen las micas polarizadas?', 'Pueden reducir reflejos intensos. Como también pueden afectar la visibilidad de algunas pantallas, consulta con la óptica si te convienen.'],
        ['¿Existen Clip-Ons adecuados para los lentes de graduación al aire?', 'Hay opciones compatibles con ciertos modelos. La óptica puede comprobar cuál corresponde a tu montura.']
      ] },
      { id: 'vision', title: 'Silhouette Vision Sensation', questions: [
        ['¿Qué significa Silhouette Vision Sensation®?', 'Es la propuesta de Silhouette que combina montura y micas. Pregunta en la óptica qué opciones están disponibles para tu graduación y el modelo elegido.']
      ] },
      { id: 'garantia', title: 'Garantía, reparación y refacciones', questions: [
        ['¿Cuál es la garantía que concede Silhouette para lentes y refacciones?', 'La cobertura depende del producto, la fecha de compra y las condiciones aplicables. La óptica donde adquiriste tus lentes puede revisar tu caso.'],
        ['¿Silhouette ofrece un servicio adicional?', 'Para conocer servicios y condiciones vigentes en México, consulta con la óptica donde adquiriste tus lentes.'],
        ['¿Dónde se pueden conseguir nuevas almohadillas nasales?', 'Pregunta en una óptica por las refacciones compatibles con tu modelo.'],
        ['¿Dónde puedo reparar mis lentes dañados?', 'Acude a la óptica donde los adquiriste o consulta una óptica del directorio para valorar la reparación.'],
        ['¿Se pueden reparar o sustituir gratuitamente mis lentes?', 'La óptica puede comprobar si el daño está cubierto por la garantía aplicable y explicarte las opciones.'],
        ['¿Puedo enviar mis lentes directamente a Silhouette para su reparación?', 'Empieza por consultar con la óptica donde los adquiriste; allí te indicarán el proceso correspondiente.'],
        ['¿Puedo reparar mis lentes por mi cuenta?', 'Para evitar daños adicionales, pide a una óptica que revise la montura antes de intentar repararla.'],
        ['¿Se pueden sustituir las varillas o es necesario cambiar el armazón completo?', 'Depende del modelo y de la pieza disponible. Una óptica puede evaluar si es posible sustituir la varilla.'],
        ['¿Se pueden reparar los Clip-Ons?', 'Depende del tipo y grado de daño. Lleva el Clip-On a una óptica para que te indiquen las opciones.']
      ] },
      { id: 'opticas', title: 'Compra, tienda y ópticas', questions: [
        ['¿Puedo comprar lentes directamente de Silhouette?', 'Esta página no vende al consumidor. Explora los modelos y consulta precios y disponibilidad directamente con una óptica.'],
        ['¿Cómo puedo encontrar una óptica de Silhouette cerca de mí?', 'Abre el directorio de ópticas, busca tu ciudad y revisa dirección, horario, teléfono e indicaciones antes de visitarla.'],
        ['¿Me pueden indicar alguna tienda en línea donde pueda pedir lentes Silhouette?', 'En México, este sitio te ayuda a conocer los modelos y encontrar una óptica donde preguntar por ellos. No ofrece compras en línea.'],
        ['Tengo problemas con el ajuste de mis lentes Silhouette. ¿Dónde puedo ajustarlos?', 'Acude a la óptica donde los adquiriste o consulta una óptica cercana para que revisen el ajuste.']
      ] }
    ];
    var faqHtml = '<div class="sil-c-faq-layout"><div class="sil-c-faq-tabs" role="tablist" aria-label="Temas de preguntas frecuentes">' +
      faqGroups.map(function (group, index) { return '<button type="button" role="tab" id="sil-c-tab-' + group.id + '" aria-controls="sil-c-panel-' + group.id + '" aria-selected="' + (index === 0) + '" tabindex="' + (index === 0 ? '0' : '-1') + '" data-faq-tab="' + group.id + '">' + group.title + '</button>'; }).join('') +
      '</div><div class="sil-c-faq-panels">' + faqGroups.map(function (group, index) {
        return '<div role="tabpanel" id="sil-c-panel-' + group.id + '" aria-labelledby="sil-c-tab-' + group.id + '"' + (index ? ' hidden' : '') + '><h3>' + group.title + '</h3>' +
          group.questions.map(function (item) { return '<details><summary>' + item[0] + '</summary><p>' + item[1] + '</p></details>'; }).join('') + '</div>';
      }).join('') + '</div></div><div class="sil-c-faq-actions"><a class="sil-c-button" href="/opticas/" data-analytics-event="find_optician_click" data-analytics-brand="silhouette" data-analytics-route="/para-ti" data-consumer-action="find-optician">Encontrar mi óptica</a><a class="sil-c-text-link" href="https://www.silhouette.com/es/ayuda-y-preguntas-frecuentes" target="_blank" rel="noopener noreferrer">Más información de Silhouette ↗</a></div>';
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
            <a class="sil-c-card" href="#/catalogo/atelier-next" data-analytics-event="consumer_catalog" data-analytics-brand="silhouette" data-analytics-route="/para-ti"><img src="./catalog/silhouette/momentum-aurum-l012/l012-6520/frame-0000.jpg" alt="Montura Atelier de Silhouette" loading="lazy"><div><strong>Atelier</strong><span>Ver modelos ↗</span></div></a>
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
        <section class="sil-c-section sil-c-faq" aria-labelledby="sil-c-faq-title"><p class="sil-c-eyebrow">Información</p><h2 id="sil-c-faq-title">Preguntas relacionadas con Silhouette</h2><p class="sil-c-section-lead">Elige un tema para consultar las preguntas. Tu óptica puede confirmar los detalles de cada modelo y servicio.</p>${faqHtml}</section>
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
      var faqTab = event.target.closest('[data-faq-tab]');
      if (faqTab) {
        root.querySelectorAll('[data-faq-tab]').forEach(function (tab) {
          var selected = tab === faqTab;
          tab.setAttribute('aria-selected', String(selected));
          tab.tabIndex = selected ? 0 : -1;
        });
        root.querySelectorAll('.sil-c-faq-panels [role="tabpanel"]').forEach(function (panel) { panel.hidden = panel.id !== 'sil-c-panel-' + faqTab.dataset.faqTab; });
      }
      var scrollButton = event.target.closest('[data-scroll-target]');
      if (scrollButton) document.getElementById(scrollButton.dataset.scrollTarget).scrollIntoView({ behavior: 'smooth' });
      if (event.target.closest('.sil-c-mobile-menu a, .sil-c-mobile-menu button')) {
        mobileMenu.hidden = true;
        menuButton.setAttribute('aria-expanded', 'false');
      }
    });
    root.addEventListener('keydown', function (event) {
      var faqTab = event.target.closest('[data-faq-tab]');
      if (!faqTab || !['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      var tabs = Array.from(root.querySelectorAll('[data-faq-tab]'));
      var index = tabs.indexOf(faqTab);
      var next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 :
        (index + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + tabs.length) % tabs.length;
      event.preventDefault();
      tabs[next].focus();
      tabs[next].click();
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
