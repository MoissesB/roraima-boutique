(function () {
  "use strict";

  var input = document.querySelector("[data-search-input]");
  var form = document.querySelector("[data-search-form]");
  var clearButton = document.querySelector("[data-clear-search]");
  var resultsRoot = document.querySelector("[data-results]");
  var status = document.querySelector("[data-search-status]");
  var directoryCount = document.querySelector("[data-directory-count]");
  var showMore = document.querySelector("[data-show-more]");
  var providers = [];
  var visibleLimit = 12;

  function safe(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalize(value) {
    return safe(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
  }

  function parseCSVRows(csvText) {
    var text = String(csvText || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    var rows = [];
    var row = [];
    var current = "";
    var quoted = false;
    var fieldStart = true;
    for (var index = 0; index < text.length; index += 1) {
      var character = text[index];
      if (character === '"') {
        if (quoted && text[index + 1] === '"') {
          current += '"';
          index += 1;
        } else if (quoted) {
          quoted = false;
        } else if (fieldStart) {
          quoted = true;
        } else {
          current += '"';
        }
        continue;
      }
      if (character === "," && !quoted) {
        row.push(current);
        current = "";
        fieldStart = true;
        continue;
      }
      if (character === "\n" && !quoted) {
        row.push(current);
        if (row.some(function (cell) { return safe(cell); })) rows.push(row.map(safe));
        row = [];
        current = "";
        fieldStart = true;
        continue;
      }
      current += character;
      fieldStart = false;
    }
    if (current.length || row.length) {
      row.push(current);
      if (row.some(function (cell) { return safe(cell); })) rows.push(row.map(safe));
    }
    return rows;
  }

  function parseProviders(csvText) {
    var rows = parseCSVRows(csvText);
    if (rows.length < 2) return [];
    var headers = rows[0].map(normalize);
    function column(name, fallback) {
      var index = headers.indexOf(normalize(name));
      return index >= 0 ? index : fallback;
    }
    var columns = {
      name: column("opticas", 0),
      address: column("direccion", 1),
      phone: column("telefono", 2),
      hours: column("horario", 3),
      website: column("sitio web", 5)
    };
    return rows.slice(1).map(function (cells, index) {
      return {
        id: String(index + 1),
        name: safe(cells[columns.name]),
        address: safe(cells[columns.address]),
        phone: safe(cells[columns.phone]),
        hours: safe(cells[columns.hours]),
        website: safe(cells[columns.website])
      };
    }).filter(function (provider) { return provider.name || provider.address; });
  }

  function phoneHref(phone) {
    var digits = safe(phone).replace(/[^\d+]/g, "");
    return digits ? "tel:" + digits : "";
  }

  function validWebsite(url) {
    try {
      var parsed = new URL(url);
      return /^https?:$/.test(parsed.protocol) ? parsed.href : "";
    } catch (_) {
      return "";
    }
  }

  function mapQuery(provider) {
    return [provider.name, provider.address, "México"].filter(Boolean).join(", ");
  }

  function mapsSearch(provider) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(mapQuery(provider));
  }

  function mapsDirections(provider) {
    return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(mapQuery(provider));
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

  function createCard(provider) {
    var article = document.createElement("article");
    article.className = "optics-card";
    article.dataset.providerId = provider.id;

    var title = document.createElement("h2");
    title.textContent = provider.name || "Óptica";
    article.appendChild(title);

    var address = document.createElement("address");
    address.textContent = provider.address || "Dirección no informada en el directorio";
    article.appendChild(address);

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

    var actions = document.createElement("div");
    actions.className = "optics-card__actions";
    actions.appendChild(createAction("Ver en Maps", mapsSearch(provider), true));
    actions.appendChild(createAction("Cómo llegar", mapsDirections(provider), false));
    var phone = phoneHref(provider.phone);
    if (phone) actions.appendChild(createAction("Llamar", phone, false));
    var website = validWebsite(provider.website);
    if (website) actions.appendChild(createAction("Sitio web", website, false));
    article.appendChild(actions);
    return article;
  }

  function matches(provider, query) {
    if (!query) return true;
    var haystack = normalize([provider.name, provider.address].join(" "));
    return query.split(" ").every(function (token) { return haystack.indexOf(token) >= 0; });
  }

  function score(provider, query) {
    var name = normalize(provider.name);
    var address = normalize(provider.address);
    if (!query) return 5;
    if (name === query) return 0;
    if (name.indexOf(query) === 0) return 1;
    if (name.indexOf(query) >= 0) return 2;
    if (address.indexOf(query) >= 0) return 3;
    return 4;
  }

  function filteredProviders() {
    var query = normalize(input && input.value);
    return providers.filter(function (provider) { return matches(provider, query); }).sort(function (left, right) {
      var scoreDifference = score(left, query) - score(right, query);
      return scoreDifference || left.name.localeCompare(right.name, "es");
    });
  }

  function render() {
    if (!resultsRoot || !status) return;
    var query = normalize(input && input.value);
    var matchesList = filteredProviders();
    var visible = matchesList.slice(0, visibleLimit);
    resultsRoot.replaceChildren();
    visible.forEach(function (provider) { resultsRoot.appendChild(createCard(provider)); });
    resultsRoot.setAttribute("aria-busy", "false");
    clearButton.hidden = !query;
    showMore.hidden = visible.length >= matchesList.length;
    status.textContent = matchesList.length
      ? matchesList.length + (matchesList.length === 1 ? " óptica encontrada" : " ópticas encontradas")
      : "No encontramos coincidencias";
    directoryCount.textContent = providers.length + " establecimientos en el directorio";
    if (!matchesList.length) {
      var empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Prueba con otra ciudad, colonia, parte de la dirección o nombre de la óptica.";
      resultsRoot.appendChild(empty);
    }
  }

  function resetLimitAndRender() {
    visibleLimit = input && input.value.trim() ? 24 : 12;
    render();
  }

  if (form) form.addEventListener("submit", function (event) { event.preventDefault(); resetLimitAndRender(); });
  if (input) {
    input.addEventListener("input", resetLimitAndRender);
    input.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !input.value) return;
      input.value = "";
      resetLimitAndRender();
    });
  }
  if (clearButton) clearButton.addEventListener("click", function () {
    input.value = "";
    input.focus();
    resetLimitAndRender();
  });
  if (showMore) showMore.addEventListener("click", function () {
    visibleLimit += 24;
    render();
  });

  fetch("/opticas/providers.csv", { credentials: "same-origin" })
    .then(function (response) {
      if (!response.ok) throw new Error("No fue posible cargar el directorio.");
      return response.text();
    })
    .then(function (csvText) {
      providers = parseProviders(csvText);
      if (!providers.length) throw new Error("El directorio no contiene establecimientos.");
      resetLimitAndRender();
    })
    .catch(function () {
      resultsRoot.setAttribute("aria-busy", "false");
      status.textContent = "El directorio no está disponible en este momento";
      var error = document.createElement("p");
      error.className = "error-message";
      error.textContent = "Vuelve a intentarlo más tarde o regresa al catálogo Silhouette.";
      resultsRoot.replaceChildren(error);
    });
})();
