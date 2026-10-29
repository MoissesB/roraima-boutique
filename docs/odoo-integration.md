# Odoo integration: accounts, live stock and orders

The professional portal (`/profesionales/vista/*`) can talk to Roraima's Odoo
through a small JSON API provided by the Odoo 12 module `roraima_portal_api`
(in `innova-pasv-addons`; its `ops/README.md` is the server-side reference:
endpoints, settings, security, nginx, deployment). This page covers the
architecture and the website side.

## Architecture

```
roraimamx.com (GitHub Pages, static)          api.roraimamx.com (nginx)            Odoo 12 (erp.innova-eyewear.com)
  /profesionales/vista/*  ──fetch(credentials: include)──▶  only /roraima/api/*  ──▶  roraima_portal_api
  /cuenta/activar/, /cuenta/restablecer/        CORS allowlist, no jsonp,               portal users, stock, draft quotations
                                                 everything else 404
```

* Customers are standard Odoo **portal users**. The session is Odoo's own
  `session_id` cookie on `api.roraimamx.com` (HttpOnly, SameSite=Lax,
  path `/roraima/api/`). Browsers only send it from a same-site page, which is
  why the API lives on a roraimamx.com subdomain. Local development works
  because `localhost:8000` → `localhost:8080` is same-site; `*.github.io`
  cannot keep a session, so the API is off there.
* No credential is stored on the website. `config.js` only holds the public
  API base URL.
* There is no online payment. Checkout creates a **draft quotation** in Odoo
  (company Innova Worldwide Corp, partner/invoice RORAIMA DISTRIBUCIONES SA,
  shipping to the optician, prices from the pricelist). The optician follows
  the quotation without notifications and sees it under "Mis pedidos".
* Products are resolved on the server from cart-item fields (`brand`, `sku`,
  `model`, `colorCode`, `option`) with per-brand reference patterns stored as
  Odoo settings. The browser never sends Odoo ids or prices.

## Environments

`config.js` sets `RORAIMA_CATALOG_CONFIG.apiBaseUrl`:

| Where the page runs | API |
|---|---|
| `localhost` / `127.0.0.1` | `http://localhost:8080` (local nginx → Docker Odoo) |
| `roraimamx.com` (default) | none until `productionApiEnabled = true`, then `https://api.roraimamx.com` |
| `roraimamx.com?roraima-api=staging` | `https://api-staging.roraimamx.com` (remembered in this browser) |
| `roraimamx.com?roraima-api=production` / `?roraima-api=off` | force production / turn off (remembered) |
| `*.github.io` and anything else | none |

`assets/b2b/visual-preview-config.js` (load `/config.js` first) turns that into
`RORAIMA_B2B_CONFIG = { mode: "odoo", apiBaseUrl }`, or
`{ mode: "visual-preview" }` without an API. Visual preview is the previous
behaviour: selection in this browser + PDF, no login.

## Website pieces

| File | Role |
|---|---|
| `config.js` | `apiBaseUrl` per environment (see above) |
| `assets/b2b/visual-preview-config.js` | chooses `odoo` or `visual-preview` mode |
| `assets/b2b/odoo-client.mjs` | `fetch` wrapper for `/roraima/api/*` (`credentials: "include"`), error codes → `RoraimaApiError` |
| `assets/b2b/roraima-b2b-service.mjs` | shared cart service; `odoo` mode adds account state (`/me`), batched stock (one `/stock` call per cart change, debounced), option choice per line, idempotent checkout |
| `assets/b2b/order-core.mjs` | cart item allowlist now includes `option` (the Odoo variant chosen in the cart) |
| `assets/b2b/order-ui.mjs` | cart drawer / "Mi pedido": account bar, stock badges, size/variant picker, per-brand minimum, blocking reasons, notes + reference, checkout result; PDF download kept for everyone |
| `assets/b2b/account-ui.mjs`, `assets/b2b/account.css` | login, registration, forgot password, profile, change password, orders; activation/reset token pages |
| `profesionales/vista/cuenta/` | account page |
| `cuenta/activar/`, `cuenta/restablecer/` | pages linked from the Odoo emails (`?token=`; removed from the address bar on load; `noindex`, `no-referrer`) |

The cart keeps working without an account: the catalogs still write their own
localStorage carts (Alfred Kerbs) or post `roraima-catalog:*` messages
(Silhouette, when framed), and `catalog-adapter.mjs` merges them into
`roraima-b2b-visual-draft-v1`. Odoo mode uses that same local draft, so a
selection made in the visual preview carries over.

### Cart rules in Odoo mode

* Stock is shown only when signed in, as free quantity (on hand − reserved)
  in the configured warehouse.
* **What can stay in the cart** (decided 2026-10-28): a reference that is
  not in Odoo, or has no free stock, is taken out of the cart as soon as the
  stock answer arrives, and a notice lists what was removed and why.
  **Alfred Kerbs is the exception**: an Alfred Kerbs reference that exists in
  Odoo stays even at 0 stock ("Sobre pedido"), any quantity can be ordered,
  and the quotation is created normally (the chatter note lists the lines
  supplied on order). Which brands behave like this is the Odoo setting
  `backorder_brands`. Signed out, stock is unknown, so the check happens at
  sign-in. The compiled catalogs still show their own "add" buttons; the
  rule is applied in the shared cart.
* A line with several Odoo variants (Silhouette sizes/shapes) shows a picker;
  sizes without stock are disabled (except for backorder brands); the choice
  is stored in the line (`option`) and re-validated on checkout.
* Each brand present needs at least `min_per_brand` pieces (50).
* Outside backorder brands, quantities above the available stock block
  checkout; if stock dropped
  between display and checkout, the server answers `insufficient_stock` with
  the exact lines and the cart highlights them. Quantities are never changed
  automatically.
* Checkout sends an idempotency key derived per cart; double clicks share one
  request, retries reuse the key, and the server also folds an identical cart
  sent within two minutes into the first order.
* The cart is emptied only after a successful response; the Odoo reference
  (e.g. `SO11029`) is shown.

### Inside the brand catalogs

The catalogs are compiled builds (sources outside this repo), so stock is
shown in the cart drawer, which opens on top of both catalogs, not on the
catalog product pages. Showing stock on product cards/pages would need the
catalog sources to expose the selected variant (Silhouette: variant SKU;
Alfred Kerbs: `model` + `colorCode`) through an event or a data attribute, so
`professional-frame-entry.mjs` could ask `/stock` for the visible variants in
one call and render a badge. Doing it here by scraping the compiled DOM would
be fragile.

## Local development

1. Odoo: `../odoo12-docker` (`docker compose up -d`), database `innova_local`
   restored from production. **Before starting Odoo on a fresh restore**,
   archive every `ir.mail_server` and deactivate the crons; then add a
   MailHog server (`roraima_mailhog:1025`, UI on http://localhost:8025).
2. Install/upgrade the module and set the local settings
   (`allowed_origins` includes `http://localhost:8000`, `order_partner_id`
   3853, `warehouse_id` 1, `activation_url`/`reset_url` on localhost:8000).
3. nginx: `docker run -d --name roraima_api_nginx --network odoo-network -p 8080:8080 -v "<module>/ops/nginx/local-dev.conf:/etc/nginx/conf.d/default.conf:ro" nginx:1.27-alpine`
4. Website: `python3 -m http.server 8000` from the repo root, then
   http://localhost:8000/profesionales/vista/cuenta/.

## Going live (and staging)

1. Deploy the module and nginx (module `ops/README.md`). For staging, use
   `api-staging.roraimamx.com` on the develop server.
2. Staging test from the real site: open
   `https://roraimamx.com/profesionales/vista/cuenta/?roraima-api=staging`
   (the choice sticks in that browser; `?roraima-api=off` resets it). The
   activation/reset links point at roraimamx.com, so open them in the same
   browser.
3. Production: set `productionApiEnabled = true` in `config.js`, bump its
   `?v=` on every page that loads it, push. Roll back by setting it to
   `false` again (pages return to the visual preview; nothing else changes).

## Changing settings

All business settings live in Odoo (`roraima_portal_api.*` system parameters,
admin only): allowed origins, order partner, warehouse, pricelist, team,
salesperson, minimum per brand, reference patterns per brand, email sender and
server, link URLs and rate limits. See the module's `ops/README.md` for each
key, the pattern syntax and how to add a brand. The website only needs a
change when a new brand key is introduced (the catalog must send items with
that `brand`).
