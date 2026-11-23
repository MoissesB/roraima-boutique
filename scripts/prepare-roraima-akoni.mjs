import { cp, readFile, stat, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

const [sourceArg, targetArg] = process.argv.slice(2);
if (!sourceArg || !targetArg) throw new Error('Uso: node prepare-roraima-akoni.mjs <docs AKONI> <destino nuevo>');
const source = resolve(sourceArg);
const target = resolve(targetArg);
if (source === target || target.startsWith(`${source}${sep}`)) throw new Error('La fuente y el destino deben ser independientes');
try { await stat(target); throw new Error('El destino ya existe; no se sobrescribe'); } catch (error) { if (error.code !== 'ENOENT') throw error; }

const catalogue = JSON.parse(await readFile(join(source, 'data', 'catalog.json'), 'utf8'));
const variants = catalogue.reduce((count, product) => count + product.variants.length, 0);
if (catalogue.length !== 120 || variants !== 565) throw new Error(`Inventario AKONI inesperado: ${catalogue.length} modelos, ${variants} variantes`);
const replaceOne = (input, find, replacement, label) => {
  const matches = [...input.matchAll(new RegExp(find.source, find.flags.includes('g') ? find.flags : `${find.flags}g`))].length;
  if (matches !== 1) throw new Error(`${label}: se esperaba una coincidencia y hubo ${matches}`);
  return input.replace(find, () => replacement);
};

let html = await readFile(join(source, 'index.html'), 'utf8');
let app = await readFile(join(source, 'app.js'), 'utf8');
let locales = await readFile(join(source, 'locales.js'), 'utf8');
let css = await readFile(join(source, 'styles.css'), 'utf8');

html = replaceOne(html, /  <div class="innova-strip">[^\n]*<\/div>\r?\n/, `  <div class="roraima-mini-header">
    <a class="roraima-mini-home" href="/#inicio" aria-label="Volver al inicio de Roraima Distribuciones"><img src="/assets/roraima-distribuciones-oficial-dark.png" alt="Roraima Distribuciones"></a>
    <div class="roraima-mini-context"><span>COLECCIÓN OFICIAL · AKONI</span><nav class="roraima-brand-rail" aria-label="Cambiar de catálogo"><a href="/alfred-kerbs/">ALFRED KERBS</a><a href="/silhouette/">SILHOUETTE</a><a href="/jisco/">JISCO</a><a class="is-current" aria-current="page" href="/akoni/">AKONI</a></nav></div>
    <nav class="roraima-mini-nav" aria-label="Navegación global de Roraima Distribuciones"><details class="roraima-mini-menu"><summary>MARCAS <span aria-hidden="true">⌄</span></summary><div><a href="/alfred-kerbs/">Alfred Kerbs</a><a href="/silhouette/">Silhouette</a><a href="/jisco/">JISCO</a><a href="/akoni/">AKONI</a></div></details><a class="roraima-mini-back" href="/#inicio">RORAIMA DISTRIBUCIONES</a><a class="roraima-mini-audience" href="/profesionales/vista/akoni/">Para ópticas</a></nav>
  </div>
`, 'Cabecera Innova');
html = replaceOne(html, /    <div class="header-actions">[^\n]*<\/div>\r?\n/, '    <div class="header-actions"><select id="langButton" aria-label="Idioma"><option value="es" lang="es">ES</option><option value="en" lang="en">EN</option><option value="fr" lang="fr">FR</option></select></div>\n', 'Controles de pedido y modo');
html = replaceOne(html, /  <footer class="footer">[^\n]*<\/footer>\r?\n/, `  <footer class="footer"><div><strong>RORAIMA DISTRIBUCIONES</strong><p data-i="footerIntro">Catálogo AKONI presentado por Roraima México.</p></div><div><a href="#/catalogo" data-i="catalog">Catálogo</a><a href="#/universo" data-i="universe">Universo Akoni</a><a href="/#inicio">← Volver a Roraima Distribuciones</a></div><div><p data-i="availability">Disponibilidad y condiciones sujetas a confirmación de Roraima Distribuciones.</p><a href="mailto:ventas@roraimamx.net">ventas@roraimamx.net</a><small>© AKONI EYEWEAR · IMÁGENES DE AKONI</small></div></footer>
`, 'Pie Innova');
html = replaceOne(html, /  <div class="dock"[^\n]*\r?\n/, '', 'Barra de pedido Innova');
html = replaceOne(html, /  <dialog id="modeDialog"[^\n]*\r?\n/, '', 'Selector B2B sin autenticación');
html = html.replace('Akoni Eyewear en Innova Boutique. Explora gafas de sol y ópticas de diseño suizo y fabricación japonesa. Catálogo en español, inglés y francés sin precios; pedidos exclusivos para ópticas y profesionales.', 'AKONI Eyewear en Roraima México. Explora monturas ópticas y de sol, acabados, materiales y referencias en español, inglés y francés, sin precios ni compra en línea.');
html = html.replaceAll('Innova Boutique', 'Roraima Distribuciones').replaceAll('innova-boutique.com/akoni/', 'roraimamx.com/akoni/');
html = html.replace('<link rel="icon" type="image/png" href="media/innova-logo.png">', '<link rel="icon" type="image/png" href="/assets/roraima-favicon-final-20260818.png">');
html = html.replace('  <script defer src="app.js?v=20261121-languages-materials"></script>', '  <script defer src="app.js?v=roraima-akoni-1"></script>\n  <script defer src="/assets/roraima-analytics.js"></script>');

app = replaceOne(app, /  let mode = localStorage\.getItem\('akoni-mode'\) \|\| 'b2b';\r?\n/, '', 'Modo público');
app = replaceOne(app, /  const parentOrigin = \(\(\) => \{[^\n]*\}\)\(\);\r?\n/, '', 'Origen Innova');
app = replaceOne(app, /  function updateChrome\(\)\{[^\n]*\}\r?\n/, `  function updateChrome(){document.documentElement.lang=lang;$$('[data-i]').forEach(el=>el.textContent=t(el.dataset.i));$('#langButton').value=lang;$('#langButton').setAttribute('aria-label',t('language'));$('#menuToggle').setAttribute('aria-label',t($('#mainNav').classList.contains('open')?'menuClose':'menuOpen'));$('#mainNav').setAttribute('aria-label',t('navigation'));$('.wordmark').setAttribute('aria-label',\`Akoni · \${t('home')}\`);$('.footer small').textContent=t('imageCredit')}
`, 'Cromo de consulta');
app = replaceOne(app, /  function readOrder\(\)\{[^\n]*\}\r?\n/, '', 'Pedido local Innova');
app = app.replaceAll('AKONI · INNOVA BOUTIQUE', 'AKONI · RORAIMA DISTRIBUCIONES');
app = app.replace('<button class="text-link mode-prompt" type="button" data-open-mode>${t(\'modePrompt\')} ↗</button>', '');
app = replaceOne(app, /    const orderControls=mode==='b2b'\?[^\n]*;\r?\n/, `    const orderControls=\`<p class="visit-optician">\${t('visitOptician')}</p>\`;
`, 'Compra en ficha');
app = replaceOne(app, /  function addItem\(\)\{[\s\S]*?(?=  function openOrder\(\))/, '', 'Agregar pedido Innova');
app = replaceOne(app, /  function openOrder\(\)\{[^\n]*\}\r?\n/, '', 'Abrir pedido Innova');
app = app.replaceAll('Innova Boutique', 'Roraima Distribuciones');
app = app.replace(/if\(window\.parent!==window\)window\.parent\.postMessage\(\{type:'innova-brand-route'[^;]*;/, '');
app = replaceOne(app, /\$\$\('\[data-order-trigger\]'\)\.forEach[\s\S]*?(?=\$\('#app'\)\.addEventListener\('input')/, '', 'Eventos de pedido y modo');
app = app.replace("if(e.target.closest('[data-open-mode]'))$('#modeDialog').showModal();", '');
app = app.replace("if(e.target.closest('[data-add]'))addItem();", '');
app = app.replace("window.addEventListener('storage',updateChrome);if(window.parent!==window)document.body.classList.add('in-frame')", '');
app = replaceOne(app, /  window\.addEventListener\('message',event=>\{[\s\S]*?\n  \}\);\r?\n/, '', 'Mensajes entre ventanas Innova');
app = replaceOne(app, /  \$\('\[data-i="globalOrder"\]'\)\.addEventListener\([^\n]*\r?\n/, '', 'Evento de pedido global');

locales = locales.replaceAll('INNOVA BOUTIQUE', 'RORAIMA DISTRIBUCIONES').replaceAll('Innova Boutique', 'Roraima Distribuciones').replaceAll('Innova’s', 'Roraima’s').replaceAll('Innova', 'Roraima').replaceAll('Centroamérica y Latinoamérica', 'México').replaceAll('Central America and Latin America', 'Mexico').replaceAll('en Amérique centrale et en Amérique latine', 'au Mexique');

css += `\n/* Marco universal Roraima: AKONI mantiene su catálogo, sin pedido ni selector profesional. */
.roraima-mini-header{height:34px;padding:0 28px;display:grid;grid-template-columns:minmax(60px,1fr) auto minmax(60px,1fr);align-items:center;gap:18px;position:sticky;top:0;z-index:31;background:#181616;color:#fff;font:700 9px/1 Arial,sans-serif;letter-spacing:.13em;text-transform:uppercase}
.roraima-mini-home{display:block;width:58px}.roraima-mini-home img{width:58px;height:31px;object-fit:contain}.roraima-mini-context,.roraima-brand-rail,.roraima-mini-nav{display:flex;align-items:center}.roraima-mini-context{gap:16px;white-space:nowrap;color:#a7a2a2}.roraima-brand-rail{gap:5px}.roraima-brand-rail a{padding:5px 10px;border:1px solid #514e4e;color:#dedbdb;font-size:8px}.roraima-brand-rail a.is-current{background:#f2bd24;border-color:#f2bd24;color:#151414}.roraima-mini-nav{justify-self:end;gap:24px;white-space:nowrap;color:#e5e2e2}.roraima-mini-nav a:hover,.roraima-mini-nav a:focus-visible,.roraima-brand-rail a:not(.is-current):hover{color:#f2bd24}.roraima-mini-menu{position:relative}.roraima-mini-menu summary{cursor:pointer;list-style:none}.roraima-mini-menu summary::-webkit-details-marker{display:none}.roraima-mini-menu summary span{margin-left:5px}.roraima-mini-menu>div{position:absolute;top:calc(100% + 11px);right:0;display:grid;gap:3px;min-width:160px;padding:8px;background:#181616;border:1px solid #514e4e;box-shadow:0 10px 22px #0004}.roraima-mini-menu>div a{padding:9px}.roraima-mini-menu>div a:hover,.roraima-mini-menu>div a:focus-visible{background:#2b2929}
@media(max-width:920px){.roraima-mini-context>span{display:none}.roraima-mini-nav{gap:12px}}
@media(max-width:760px){.roraima-mini-header{height:40px;padding:0 8px;grid-template-columns:auto minmax(0,1fr) auto;gap:5px}.roraima-mini-home,.roraima-mini-home img{width:43px}.roraima-mini-home img{height:30px}.roraima-mini-context{justify-content:center}.roraima-brand-rail{gap:2px}.roraima-brand-rail a{padding:6px 3px;font-size:6px;letter-spacing:0}.roraima-mini-menu{display:none}.roraima-mini-back{font-size:7px;letter-spacing:0}}
.roraima-mini-audience{display:inline-flex;align-items:center;min-height:25px;padding:5px 8px;border:1px solid #8d8985;color:#fff;text-decoration:none;white-space:nowrap}
.roraima-mini-audience:hover,.roraima-mini-audience:focus-visible{background:#f2bd24;border-color:#f2bd24;color:#151414!important}
@media(max-width:760px){.roraima-mini-back{display:none}.roraima-mini-audience{font-size:8px;padding:5px}}
`;

if (/innova-boutique|innova-brand-route|innova-boutique-order|data-order-trigger|postMessage|data-add|modeDialog|modeButton|orderButton|addItem\(/i.test(html + app)) throw new Error('Quedó una ruta o acción comercial de Innova');
await cp(source, target, { recursive: true });
await Promise.all([
  writeFile(join(target, 'index.html'), html),
  writeFile(join(target, 'app.js'), app),
  writeFile(join(target, 'locales.js'), locales),
  writeFile(join(target, 'styles.css'), css),
  writeFile(join(target, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://roraimamx.com/akoni/sitemap.xml\n'),
  writeFile(join(target, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://roraimamx.com/akoni/</loc></url></urlset>\n'),
]);
console.log(`AKONI Roraima preparado: ${catalogue.length} modelos, ${variants} variantes, sin pedido ni destino Innova`);
