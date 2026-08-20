(function () {
  "use strict";

  var measurementId = "G-LRMY9XFYC6";
  var productionHosts = {
    "roraimamx.com": true,
    "www.roraimamx.com": true
  };

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

  if (!window.__RORAIMA_GA4__.enabled) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", measurementId);

  var googleTag = document.createElement("script");
  googleTag.async = true;
  googleTag.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
  document.head.appendChild(googleTag);
})();
