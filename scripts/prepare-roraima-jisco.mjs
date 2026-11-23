import { cp, readFile, stat, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const [sourceArgument, targetArgument] = process.argv.slice(2);
if (!sourceArgument || !targetArgument) throw new Error('Uso: node prepare-roraima-jisco.mjs <public JISCO> <destino nuevo>');
const source = resolve(sourceArgument);
const target = resolve(targetArgument);
if (source === target || target.startsWith(`${source}\\`) || target.startsWith(`${source}/`)) throw new Error('El destino debe ser independiente de la fuente');
try { await stat(target); throw new Error('El destino ya existe; no se sobrescribe'); } catch (error) { if (error.code !== 'ENOENT') throw error; }

const catalog = JSON.parse(await readFile(join(source, 'data', 'catalog.json'), 'utf8'));
if (!Array.isArray(catalog.models) || catalog.models.length !== 235) throw new Error('La fuente JISCO no coincide con el inventario aprobado de 235 modelos');
const replaceOne = (input, find, replacement, label) => {
  const matches = typeof find === 'string' ? input.split(find).length - 1 : [...input.matchAll(new RegExp(find.source, find.flags.includes('g') ? find.flags : `${find.flags}g`))].length;
  if (matches !== 1) throw new Error(`${label}: se esperaba una coincidencia y hubo ${matches}`);
  return input.replace(find, replacement);
};

let html = await readFile(join(source, 'index.html'), 'utf8');
let app = await readFile(join(source, 'app.js'), 'utf8');
let css = await readFile(join(source, 'styles.css'), 'utf8');

html = replaceOne(html, /  <div class="innova-mini-header">[\s\S]*?(?=  <header class="header">)/, `  <div class="roraima-mini-header">
    <a class="roraima-mini-home" href="/#inicio" aria-label="Volver al inicio de Roraima Distribuciones"><img src="/assets/roraima-distribuciones-oficial-dark.png" alt="Roraima Distribuciones"></a>
    <div class="roraima-mini-context"><span>COLECCIÓN OFICIAL · JISCO</span><nav class="roraima-brand-rail" aria-label="Cambiar de catálogo"><a href="/alfred-kerbs/">ALFRED KERBS</a><a href="/silhouette/">SILHOUETTE</a><a class="is-current" aria-current="page" href="/jisco/">JISCO</a></nav></div>
    <nav class="roraima-mini-nav" aria-label="Navegación global de Roraima Distribuciones"><details class="roraima-mini-menu"><summary>MARCAS <span aria-hidden="true">⌄</span></summary><div><a href="/alfred-kerbs/">Alfred Kerbs</a><a href="/silhouette/">Silhouette</a><a href="/jisco/">JISCO</a></div></details><a class="roraima-mini-back" href="/#inicio">RORAIMA DISTRIBUCIONES</a><a class="roraima-mini-audience" href="/profesionales/vista/jisco/">Para ópticas</a></nav>
  </div>
`, 'Cabecera Innova');
html = html.replaceAll('Innova Eyewear', 'Roraima Distribuciones').replaceAll('Innova Boutique', 'Roraima Distribuciones').replaceAll('Innova', 'Roraima').replaceAll('INNOVA EYEWEAR', 'RORAIMA DISTRIBUCIONES');
html = html.replaceAll('https://innova-boutique.com/jisco/', 'https://roraimamx.com/jisco/');
html = html.replaceAll('https://innova-boutique.com/assets/innova-logo.png', '/assets/roraima-favicon-final-20260818.png');
html = html.replaceAll('https://innova-boutique.com/assets/jisco-showcase/home_2.jpg', 'https://roraimamx.com/jisco/assets/campaigns/marea-horizontal.jpg');
html = replaceOne(html, /<footer class="footer">[\s\S]*?(?=\n  <dialog)/, `<footer class="footer"><div><img src="assets/images/materiales/big/logo-jisco-2024.png" alt="Logo JISCO"><p data-t="ownership">JISCO y todo su material audiovisual pertenecen a JISCO Eyewear.</p></div><div><strong>RORAIMA DISTRIBUCIONES</strong><p data-t="distribution">Catálogo JISCO presentado por Roraima México</p><a href="/" data-t="back">← Volver a Roraima Distribuciones</a><a href="mailto:ventas@roraimamx.net">ventas@roraimamx.net</a></div><div><a href="https://www.jiscoeyewear.com/" target="_blank" rel="noopener" data-t="official">JISCO oficial ↗</a><a href="https://www.jiscoeyewear.com/prensa" target="_blank" rel="noopener" data-t="press">Prensa JISCO ↗</a></div></footer>`, 'Pie Innova');
const orderLinks = [...html.matchAll(/<a\b[^>]*\bdata-order-trigger\b[^>]*>[\s\S]*?<\/a>/g)].length;
if (orderLinks !== 3) throw new Error(`Se esperaban 3 enlaces de pedido Innova y hay ${orderLinks}`);
html = html.replace(/<a\b[^>]*\bdata-order-trigger\b[^>]*>[\s\S]*?<\/a>/g, '');
html = html.replaceAll('Disponibilidad y condiciones sujetas a confirmación comercial de Roraima.', 'Disponibilidad y condiciones sujetas a confirmación de Roraima Distribuciones.');
html = replaceOne(html, /<script defer src="app\.js[^\"]*"><\/script>/, '<script defer src="app.js?v=roraima-jisco-1"></script>\n  <script defer src="/assets/roraima-analytics.js"></script>', 'Script del catálogo');

app = replaceOne(app, /  const portal = 'https:\/\/innova-boutique\.com';[\s\S]*?(?=  const copy = \{)/, "  const parentOrigin = location.origin;\n", 'Redirección a Innova');
app = app.replaceAll('Innova Boutique', 'Roraima Distribuciones').replaceAll('Innova Eyewear', 'Roraima Distribuciones').replaceAll('Innova', 'Roraima').replaceAll('INNOVA', 'RORAIMA');
app = replaceOne(app, /<div class="purchase"><label>\$\{t\('quantity'\)\}[\s\S]*?<p>\$\{t\('availability'\)\}<\/p><\/div>/, "<div class=\"purchase\"><p>${t('availability')}</p></div>", 'Compra en ficha');
app = replaceOne(app, /    \$\('#addOrder'\)\.addEventListener\('click',\(\)=>addOrder\(\)\);\r?\n/, '', 'Botón de pedido en ficha');
app = replaceOne(app, /  function addOrder\([\s\S]*?(?=  const campaignSets = \[)/, '', 'Guardado en pedido Innova');
app = replaceOne(app, /<div class="film-product-dialog__purchase">[\s\S]*?<\/div>/, '', 'Compra en ficha editorial');
app = replaceOne(app, "if(event.target.closest('[data-film-add]'))addOrder(filmProduct,filmVariant,filmQuantity);", '', 'Botón de pedido editorial');
app = replaceOne(app, /    \$\('#filmProductDialog'\)\.addEventListener\('input',event=>\{if\(event\.target\.matches\('\[data-film-quantity\]'\)\)filmQuantity=Math\.max\(1,Math\.min\(999,Number\(event\.target\.value\)\|\|1\)\)\}\);\r?\n/, '', 'Cantidad editorial');
app = replaceOne(app, /    const miniShell=\$\('\.innova-mini-menu-shell'\);[\s\S]*?(?=    const mobileCatalogMenu=)/, '', 'Menú Innova');
app = replaceOne(app, /    document\.addEventListener\('click',event=>\{if\(!miniShell\.contains\(event\.target\)\)closeMiniMenu\(\)\}\);\r?\n    document\.addEventListener\('keydown',event=>\{if\(event\.key==='Escape'\)closeMiniMenu\(\)\}\);\r?\n/, '', 'Cierre menú Innova');
app = replaceOne(app, /    \$\$\('\[data-order-trigger\]'\)\.forEach\([\s\S]*?\);\r?\n/, '', 'Trigger pedido Innova');
app = app.replaceAll('innova-boutique:modal-state', 'roraima:jisco-modal-state');
app = app.replaceAll('← Volver a Roraima Distribuciones', '← Volver a Roraima Distribuciones');
app = app.replaceAll('Centroamérica y Latinoamérica', 'México');
app = app.replaceAll('Professional distribution for Central America and Latin America', 'JISCO catalogue presented by Roraima Mexico');
app = app.replaceAll('Distribution professionnelle pour l’Amérique centrale et latine', 'Catalogue JISCO présenté par Roraima Mexique');
app = app.replaceAll('tu selección Roraima', 'tu selección');
if (/innova-boutique|addOrder\(|data-film-add|#addOrder|https:\/\/innova-boutique\.com/i.test(app) || /innova-boutique\.com|data-order-trigger/i.test(html)) throw new Error('Quedó una ruta o acción comercial de Innova');

css += `\n/* Marco de Roraima para la copia publicada de JISCO. */
:root{--navy:#191719;--blue:#a66d00;--ink:#1d1b1b;--sand:#f4f1eb;--cream:#f8f7f5;--line:#ddd9d2;--muted:#69645e}
.roraima-mini-header{height:34px;padding:0 28px;display:grid;grid-template-columns:minmax(60px,1fr) auto minmax(60px,1fr);align-items:center;gap:18px;position:sticky;top:0;z-index:31;background:#181616;color:#fff;font:700 9px/1 Arial,sans-serif;letter-spacing:.13em;text-transform:uppercase}
.roraima-mini-home{display:block;width:58px}.roraima-mini-home img{width:58px;height:31px;object-fit:contain}.roraima-mini-context,.roraima-brand-rail,.roraima-mini-nav{display:flex;align-items:center}.roraima-mini-context{gap:16px;white-space:nowrap;color:#a7a2a2}.roraima-brand-rail{gap:5px}.roraima-brand-rail a{padding:5px 10px;border:1px solid #514e4e;color:#dedbdb;font-size:8px}.roraima-brand-rail a.is-current{background:#f2bd24;border-color:#f2bd24;color:#151414}.roraima-mini-nav{justify-self:end;gap:24px;white-space:nowrap;color:#e5e2e2}.roraima-mini-nav a:hover,.roraima-mini-nav a:focus-visible,.roraima-brand-rail a:not(.is-current):hover{color:#f2bd24}.roraima-mini-menu{position:relative}.roraima-mini-menu summary{cursor:pointer;list-style:none}.roraima-mini-menu summary::-webkit-details-marker{display:none}.roraima-mini-menu summary span{margin-left:5px}.roraima-mini-menu>div{position:absolute;top:calc(100% + 11px);right:0;display:grid;gap:3px;min-width:160px;padding:8px;background:#181616;border:1px solid #514e4e;box-shadow:0 10px 22px #0004}.roraima-mini-menu>div a{padding:9px}.roraima-mini-menu>div a:hover,.roraima-mini-menu>div a:focus-visible{background:#2b2929}
.header{top:34px}.home-hero__shade{background:linear-gradient(90deg,rgba(12,11,11,.78),rgba(12,11,11,.28) 65%,rgba(12,11,11,.1))}
@media(max-width:920px){.roraima-mini-context>span{display:none}.roraima-mini-nav{gap:12px}}
@media(max-width:760px){.roraima-mini-header{height:40px;padding:0 10px;grid-template-columns:auto minmax(0,1fr) auto;gap:5px}.roraima-mini-home,.roraima-mini-home img{width:49px}.roraima-mini-home img{height:30px}.roraima-mini-context{justify-content:center}.roraima-brand-rail{gap:3px}.roraima-brand-rail a{padding:6px 5px;font-size:7px;letter-spacing:0}.roraima-mini-menu{display:none}.roraima-mini-back{font-size:8px;letter-spacing:0}.header{top:40px}}
.roraima-mini-audience{display:inline-flex;align-items:center;min-height:25px;padding:5px 8px;border:1px solid #8d8985;color:#fff;text-decoration:none;white-space:nowrap}
.roraima-mini-audience:hover,.roraima-mini-audience:focus-visible{background:#f2bd24;border-color:#f2bd24;color:#151414!important}
@media(max-width:760px){.roraima-mini-back{display:none}.roraima-mini-audience{font-size:8px;padding:5px}}
`;

await cp(source, target, { recursive: true });
await Promise.all([
  writeFile(join(target, 'index.html'), html),
  writeFile(join(target, 'app.js'), app),
  writeFile(join(target, 'styles.css'), css),
]);
console.log(`JISCO Roraima preparado: ${catalog.models.length} modelos, sin enlaces ni pedidos Innova`);
