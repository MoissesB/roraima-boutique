(function () {
  "use strict";

  var countryFilter = document.querySelector("[data-country-filter]");
  var cityFilter = document.querySelector("[data-city-filter]");
  var nameFilter = document.querySelector("[data-name-filter]");
  var clearFilters = document.querySelector("[data-clear-filters]");
  var filterForm = document.querySelector("[data-filter-form]");
  var resultsRoot = document.querySelector("[data-results]");
  var status = document.querySelector("[data-search-status]");
  var directoryCount = document.querySelector("[data-directory-count]");
  var coordinateCount = document.querySelector("[data-coordinate-count]");
  var showMore = document.querySelector("[data-show-more]");
  var resetMapButton = document.querySelector("[data-reset-map]");
  var mapLoading = document.querySelector("[data-map-loading]");
  var providers = [];
  var visibleLimit = 12;
  var activeProviderId = "";
  var map = null;
  var markerLayer = null;
  var markerById = new Map();
  var LATIN_AMERICA_BOUNDS = [[-56, -118], [33, -34]];

  function safe(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalize(value) {
    return safe(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
  }

  function validUrl(value) {
    try {
      var parsed = new URL(value);
      return /^https?:$/.test(parsed.protocol) ? parsed.href : "";
    } catch (_) {
      return "";
    }
  }

  function phoneHref(phone) {
    var digits = safe(phone).replace(/[^\d+]/g, "");
    return digits ? "tel:" + digits : "";
  }

  function mapQuery(provider) {
    return [provider.name, provider.address, provider.country].filter(Boolean).join(", ");
  }

  function mapsSearch(provider) {
    return validUrl(provider.share_url) || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(mapQuery(provider));
  }

  function mapsDirections(provider) {
    return validUrl(provider.directions_url) || "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(mapQuery(provider));
  }

  function createAction(label, href, primary) {
    var link = document.createElement("a");
    link.className = "optics-action " + (primary ? "optics-action--primary" : "optics-action--soft");
    link.href = href;
    link.textContent = label;
    if (/^https?:/i.test(href)) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    } else if (/^tel:/i.test(href)) {
      link.rel = "nofollow";
    }
    return link;
  }

  function popupElement(provider) {
    var wrapper = document.createElement("div");
    wrapper.className = "map-popup";
    var title = document.createElement("h3");
    title.textContent = provider.name || "Óptica";
    var address = document.createElement("address");
    address.textContent = provider.address;
    var actions = document.createElement("div");
    actions.className = "map-popup__actions";
    actions.appendChild(createAction("Cómo llegar", mapsDirections(provider), false));
    var phone = phoneHref(provider.phone);
    if (phone) actions.appendChild(createAction("Llamar", phone, false));
    var website = validUrl(provider.website);
    if (website) actions.appendChild(createAction("Sitio web", website, false));
    wrapper.append(title, address, actions);
    return wrapper;
  }

  function initializeMap() {
    if (!window.L) {
      mapLoading.textContent = "El mapa no está disponible. El directorio continúa accesible en la lista.";
      return;
    }
    map = L.map("opticsMap", { zoomControl: true, preferCanvas: true, worldCopyJump: false, minZoom: 2 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    resetLatinAmericaView();
    mapLoading.hidden = true;
  }

  function resetLatinAmericaView() {
    if (!map) return;
    map.fitBounds(LATIN_AMERICA_BOUNDS, { padding: [12, 12] });
  }

  function createMarker(provider) {
    var marker = L.circleMarker([provider.coordinates.lat, provider.coordinates.lng], {
      radius: 7,
      color: "#111111",
      weight: 2,
      opacity: 1,
      fillColor: "#b49571",
      fillOpacity: 0.92
    });
    marker.bindPopup(popupElement(provider), { maxWidth: 300 });
    marker.on("click", function () { activateProvider(provider.id, true); });
    marker.addTo(markerLayer);
    markerById.set(provider.id, marker);
    return marker;
  }

  function activeFilters() {
    return {
      country: safe(countryFilter && countryFilter.value),
      city: safe(cityFilter && cityFilter.value),
      name: normalize(nameFilter && nameFilter.value)
    };
  }

  function filteredProviders() {
    var filters = activeFilters();
    return providers.filter(function (provider) {
      if (filters.country && provider.country !== filters.country) return false;
      if (filters.city && provider.city !== filters.city) return false;
      if (!filters.name) return true;
      return filters.name.split(" ").every(function (token) {
        return normalize([provider.name, provider.city, provider.address].join(" ")).indexOf(token) >= 0;
      });
    }).sort(function (left, right) {
      return left.city.localeCompare(right.city, "es") || left.name.localeCompare(right.name, "es");
    });
  }

  function populateCountryOptions() {
    var countries = Array.from(new Set(providers.map(function (provider) { return provider.country; }).filter(Boolean))).sort(function (a, b) { return a.localeCompare(b, "es"); });
    countries.forEach(function (country) {
      var option = document.createElement("option");
      option.value = country;
      option.textContent = country;
      countryFilter.appendChild(option);
    });
  }

  function populateCityOptions() {
    var selected = safe(countryFilter.value);
    var current = safe(cityFilter.value);
    var cities = Array.from(new Set(providers.filter(function (provider) {
      return !selected || provider.country === selected;
    }).map(function (provider) { return provider.city; }).filter(Boolean))).sort(function (a, b) { return a.localeCompare(b, "es"); });
    cityFilter.replaceChildren();
    var all = document.createElement("option");
    all.value = "";
    all.textContent = "Todas las ciudades";
    cityFilter.appendChild(all);
    cities.forEach(function (city) {
      var option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      cityFilter.appendChild(option);
    });
    if (cities.indexOf(current) >= 0) cityFilter.value = current;
  }

  function createCard(provider) {
    var article = document.createElement("article");
    article.className = "optics-card" + (provider.id === activeProviderId ? " is-active" : "");
    article.dataset.providerId = provider.id;
    article.tabIndex = -1;

    var city = document.createElement("p");
    city.className = "optics-card__city";
    city.textContent = provider.city + " · " + provider.country;
    var title = document.createElement("h3");
    title.textContent = provider.name || "Óptica";
    var address = document.createElement("address");
    address.textContent = provider.address || "Dirección no informada";
    article.append(city, title, address);

    var facts = document.createElement("dl");
    if (provider.phone) {
      var phoneLabel = document.createElement("dt");
      phoneLabel.textContent = "Teléfono";
      var phoneValue = document.createElement("dd");
      phoneValue.textContent = provider.phone;
      facts.append(phoneLabel, phoneValue);
    }
    if (provider.hours) {
      var hoursLabel = document.createElement("dt");
      hoursLabel.textContent = "Horario";
      var hoursValue = document.createElement("dd");
      hoursValue.textContent = provider.hours;
      facts.append(hoursLabel, hoursValue);
    }
    if (facts.children.length) article.appendChild(facts);

    var coordinateState = document.createElement("p");
    coordinateState.className = "coordinate-state" + (provider.coordinates ? " is-verified" : "");
    coordinateState.textContent = provider.coordinates ? "Ubicación verificada en el mapa" : "Dirección disponible; marcador pendiente de verificación";
    article.appendChild(coordinateState);

    var actions = document.createElement("div");
    actions.className = "optics-card__actions";
    var locate = document.createElement("button");
    locate.type = "button";
    locate.className = "locate-button";
    locate.textContent = provider.coordinates ? "Ubicar en mapa" : "Sin marcador";
    locate.disabled = !provider.coordinates;
    if (provider.coordinates) locate.addEventListener("click", function () { focusProvider(provider.id); });
    actions.appendChild(locate);
    actions.appendChild(createAction("Ver en Maps", mapsSearch(provider), false));
    actions.appendChild(createAction("Cómo llegar", mapsDirections(provider), false));
    var phone = phoneHref(provider.phone);
    if (phone) actions.appendChild(createAction("Llamar", phone, false));
    var website = validUrl(provider.website);
    if (website) actions.appendChild(createAction("Sitio web", website, false));
    article.appendChild(actions);
    return article;
  }

  function renderList(list) {
    var visible = list.slice(0, visibleLimit);
    resultsRoot.replaceChildren();
    visible.forEach(function (provider) { resultsRoot.appendChild(createCard(provider)); });
    resultsRoot.setAttribute("aria-busy", "false");
    showMore.hidden = visible.length >= list.length;
    status.textContent = list.length ? list.length + (list.length === 1 ? " óptica encontrada" : " ópticas encontradas") : "No encontramos coincidencias";
    var verified = list.filter(function (provider) { return provider.coordinates; }).length;
    directoryCount.textContent = providers.length + " establecimientos · " + Array.from(new Set(providers.map(function (provider) { return provider.country; }))).length + " país";
    coordinateCount.textContent = verified + " marcadores · " + (list.length - verified) + " sin resolver";
    if (!list.length) {
      var empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Prueba con otro país, ciudad o nombre de óptica.";
      resultsRoot.appendChild(empty);
    }
  }

  function syncMarkers(list, fitFiltered) {
    if (!map || !markerLayer) return;
    markerLayer.clearLayers();
    markerById.clear();
    var mapped = list.filter(function (provider) { return provider.coordinates; });
    mapped.forEach(createMarker);
    if (!fitFiltered) {
      resetLatinAmericaView();
      return;
    }
    if (mapped.length === 1) {
      map.setView([mapped[0].coordinates.lat, mapped[0].coordinates.lng], 13);
    } else if (mapped.length > 1) {
      map.fitBounds(mapped.map(function (provider) { return [provider.coordinates.lat, provider.coordinates.lng]; }), { padding: [34, 34], maxZoom: 11 });
    }
  }

  function render(options) {
    var list = filteredProviders();
    renderList(list);
    var filters = activeFilters();
    syncMarkers(list, Boolean(filters.country || filters.city || filters.name));
    if (options && options.keepActive && activeProviderId) activateProvider(activeProviderId, false);
  }

  function activateProvider(id, scrollToCard) {
    activeProviderId = id;
    document.querySelectorAll(".optics-card.is-active").forEach(function (card) { card.classList.remove("is-active"); });
    var card = document.querySelector('[data-provider-id="' + id + '"]');
    if (!card) {
      var list = filteredProviders();
      var index = list.findIndex(function (provider) { return provider.id === id; });
      if (index >= visibleLimit) {
        visibleLimit = index + 1;
        renderList(list);
        card = document.querySelector('[data-provider-id="' + id + '"]');
      }
    }
    if (card) {
      card.classList.add("is-active");
      if (scrollToCard) card.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function focusProvider(id) {
    var provider = providers.find(function (item) { return item.id === id; });
    var marker = markerById.get(id);
    if (!provider || !provider.coordinates || !map || !marker) return;
    activateProvider(id, false);
    map.flyTo([provider.coordinates.lat, provider.coordinates.lng], Math.max(map.getZoom(), 14), { duration: 0.65 });
    marker.openPopup();
    document.getElementById("opticsMap").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function resetAndRender() {
    visibleLimit = nameFilter.value.trim() || cityFilter.value || countryFilter.value ? 24 : 12;
    activeProviderId = "";
    render();
  }

  if (filterForm) filterForm.addEventListener("submit", function (event) { event.preventDefault(); resetAndRender(); });
  countryFilter.addEventListener("change", function () { populateCityOptions(); resetAndRender(); });
  cityFilter.addEventListener("change", resetAndRender);
  nameFilter.addEventListener("input", resetAndRender);
  nameFilter.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && nameFilter.value) {
      nameFilter.value = "";
      resetAndRender();
    }
  });
  clearFilters.addEventListener("click", function () {
    countryFilter.value = "";
    populateCityOptions();
    cityFilter.value = "";
    nameFilter.value = "";
    nameFilter.focus();
    resetAndRender();
  });
  showMore.addEventListener("click", function () {
    visibleLimit += 24;
    renderList(filteredProviders());
  });
  resetMapButton.addEventListener("click", resetLatinAmericaView);

  initializeMap();
  fetch("/opticas/providers.json", { credentials: "same-origin" })
    .then(function (response) {
      if (!response.ok) throw new Error("No fue posible cargar el directorio.");
      return response.json();
    })
    .then(function (payload) {
      providers = Array.isArray(payload.providers) ? payload.providers : [];
      if (!providers.length) throw new Error("El directorio no contiene establecimientos.");
      populateCountryOptions();
      populateCityOptions();
      render();
      window.setTimeout(function () { if (map) map.invalidateSize(); }, 80);
    })
    .catch(function () {
      resultsRoot.setAttribute("aria-busy", "false");
      status.textContent = "El directorio no está disponible en este momento";
      var error = document.createElement("p");
      error.className = "error-message";
      error.textContent = "Vuelve a intentarlo más tarde o regresa al catálogo Silhouette.";
      resultsRoot.replaceChildren(error);
      if (mapLoading) mapLoading.hidden = true;
    });
})();
