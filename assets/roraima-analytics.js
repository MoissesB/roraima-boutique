(function () {
  "use strict";

  var measurementId = "G-LRMY9XFYC6";
  var adsMeasurementId = "AW-18382327581";
  var findOpticianConversion = "AW-18382327581/gQ-HCOeR5-ocEJ2esL1E";
  var productionHosts = {
    "roraimamx.com": true,
    "www.roraimamx.com": true
  };
  var pageParams = new URLSearchParams(window.location.search);
  var suppressEmbeddedProfessionalPageView = window.self !== window.top &&
    window.location.pathname.indexOf("/silhouette/") === 0 &&
    pageParams.get("audience") === "professional" &&
    pageParams.get("embedded") === "1";

  if (window.__RORAIMA_GA4__) {
    return;
  }

  window.__RORAIMA_GA4__ = {
    enabled: Boolean(productionHosts[window.location.hostname]),
    measurementId: measurementId,
    completedForms: new Set()
  };

  window.__RORAIMA_TRACK_FORM_COMPLETE__ = function (details, completionKey) {
    var analytics = window.__RORAIMA_GA4__;
    var formId = String(details && details.form_id || "").trim();
    var audience = String(details && details.audience || "").trim().toLowerCase();
    var productSlug = String(details && details.product_slug || "").trim().toLowerCase();
    var deduplicationKey = String(completionKey || [formId, audience, productSlug].join(":"));

    if (!analytics.enabled || typeof window.gtag !== "function" || !formId || !audience || !productSlug) {
      return false;
    }
    if (analytics.completedForms.has(deduplicationKey)) {
      return false;
    }

    analytics.completedForms.add(deduplicationKey);
    window.gtag("event", "form_complete", {
      form_id: formId,
      audience: audience,
      product_slug: productSlug
    });
    return true;
  };

  var allowedNavigationEvents = {
    consumer_catalog: true,
    professional_distribution: true,
    find_optician_click: true,
    catalog_navigation: true,
    product_navigation: true,
    professional_navigation: true,
    distribution_request_click: true
  };

  function safeToken(value, fallback) {
    var token = String(value || "").trim().toLowerCase();
    return /^[a-z0-9/_#.-]{1,120}$/.test(token) ? token : fallback;
  }

  window.__RORAIMA_TRACK_EVENT__ = function (eventName, details) {
    var analytics = window.__RORAIMA_GA4__;
    var normalizedEvent = safeToken(eventName, "");
    if (!analytics.enabled || typeof window.gtag !== "function" || !allowedNavigationEvents[normalizedEvent]) {
      return false;
    }
    window.gtag("event", normalizedEvent, {
      brand: safeToken(details && details.brand, "roraima"),
      route: safeToken(details && details.route, window.location.pathname),
      product_slug: safeToken(details && details.product_slug, "none")
    });
    if (normalizedEvent === "find_optician_click") {
      var conversionParameters = {
        send_to: findOpticianConversion
      };
      window.gtag("event", "conversion", conversionParameters);
    }
    return true;
  };

  document.addEventListener("click", function (event) {
    var action = event.target instanceof Element && event.target.closest("[data-analytics-event]");
    if (!action) return;
    var navigationEvent = action.dataset.analyticsEvent === "find_optician_click" &&
      action.matches("a[href]") &&
      (!action.target || action.target === "_self") &&
      !event.defaultPrevented &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey &&
      (typeof event.button !== "number" || event.button === 0);
    var destination = navigationEvent ? action.href : "";
    var navigationComplete = false;
    var continueNavigation = function () {
      if (!navigationEvent || navigationComplete) return;
      navigationComplete = true;
      window.location.assign(destination);
    };
    if (navigationEvent) {
      event.preventDefault();
    }
    window.__RORAIMA_TRACK_EVENT__(action.dataset.analyticsEvent, {
      brand: action.dataset.analyticsBrand,
      route: action.dataset.analyticsRoute,
      product_slug: action.dataset.analyticsProductSlug
    });
    if (navigationEvent) {
      window.setTimeout(continueNavigation, 1200);
    }
  });

  if (window.location.pathname.indexOf("/profesionales/") !== 0 && !document.querySelector("script[data-roraima-audience-script]")) {
    var audienceScript = document.createElement("script");
    audienceScript.defer = true;
    audienceScript.src = "/assets/roraima-audience.js?v=20260830-b2b-map-1";
    audienceScript.dataset.roraimaAudienceScript = "true";
    document.head.appendChild(audienceScript);
  }

  if (suppressEmbeddedProfessionalPageView) {
    return;
  }

  if (!window.__RORAIMA_GA4__.enabled) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", measurementId);
  window.gtag("config", adsMeasurementId);

  var lastTrackedLocation = window.location.href;
  var routePageViewScheduled = false;

  function scheduleRoutePageView() {
    if (routePageViewScheduled) {
      return;
    }
    routePageViewScheduled = true;
    window.setTimeout(function () {
      routePageViewScheduled = false;
      var currentLocation = window.location.href;
      if (currentLocation === lastTrackedLocation) {
        return;
      }
      var previousLocation = lastTrackedLocation;
      lastTrackedLocation = currentLocation;
      window.gtag("event", "page_view", {
        page_title: document.title,
        page_location: currentLocation,
        page_referrer: previousLocation
      });
    }, 0);
  }

  ["pushState", "replaceState"].forEach(function (methodName) {
    var originalMethod = window.history[methodName];
    window.history[methodName] = function () {
      var result = originalMethod.apply(this, arguments);
      scheduleRoutePageView();
      return result;
    };
  });

  window.addEventListener("popstate", scheduleRoutePageView);
  window.addEventListener("hashchange", scheduleRoutePageView);

  var googleTag = document.createElement("script");
  googleTag.async = true;
  googleTag.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
  document.head.appendChild(googleTag);
})();
