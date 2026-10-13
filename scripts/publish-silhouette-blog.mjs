import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const queueDir = join(root, 'content', 'silhouette-blog', 'scheduled');
const outputDir = join(root, 'silhouette', 'blog');
const zone = 'America/Mexico_City';
const site = 'https://roraimamx.com';
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const nowArg = args.find(arg => arg.startsWith('--now='));
const now = nowArg ? new Date(nowArg.slice(6)) : new Date();

if (Number.isNaN(now.getTime())) throw new Error('Invalid --now timestamp');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function mexicoLocal(instant) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(instant);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`;
}

function validate(post, filename) {
  if (!post || typeof post !== 'object') throw new Error(`${filename}: invalid article`);
  for (const field of ['slug', 'title', 'excerpt', 'content', 'image', 'imageAlt', 'publishAt', 'publishAtMexico', 'seoTitle', 'seoDescription', 'socialTitle', 'socialDescription', 'socialImage', 'socialImageAlt']) {
    if (typeof post[field] !== 'string' || !post[field].trim()) throw new Error(`${filename}: missing ${field}`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) throw new Error(`${filename}: invalid slug`);
  if (post.status !== 'scheduled') throw new Error(`${filename}: status must be scheduled`);
  if (post.timeZone !== zone) throw new Error(`${filename}: timeZone must be ${zone}`);
  if (!/^https:\/\//.test(post.image)) throw new Error(`${filename}: cover image must use HTTPS`);
  if (!/^https:\/\//.test(post.socialImage)) throw new Error(`${filename}: social image must use HTTPS`);
  if (!Number.isInteger(post.socialImageWidth) || post.socialImageWidth < 600 || !Number.isInteger(post.socialImageHeight) || post.socialImageHeight < 300) {
    throw new Error(`${filename}: invalid social image dimensions`);
  }
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(post.publishAt)) throw new Error(`${filename}: publishAt must be UTC ISO time`);
  const published = new Date(post.publishAt);
  if (Number.isNaN(published.getTime()) || mexicoLocal(published) !== post.publishAtMexico) {
    throw new Error(`${filename}: Mexico time does not match UTC publishAt`);
  }
  if (post.modifiedAt && (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(post.modifiedAt) || new Date(post.modifiedAt).getTime() < published.getTime())) {
    throw new Error(`${filename}: invalid modifiedAt`);
  }
  if (/<\s*(script|iframe|object|embed|form)\b|\bon[a-z]+\s*=|javascript:/i.test(post.content)) {
    throw new Error(`${filename}: article contains unsupported HTML`);
  }
  return { ...post, id: `silhouette-${post.slug}` };
}

function htmlPage(post) {
  const url = `${site}/silhouette/blog/${post.slug}/`;
  const published = new Date(post.publishAt);
  const dateLabel = new Intl.DateTimeFormat('es-MX', { timeZone: zone, dateStyle: 'long' }).format(published);
  const zoneName = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' })
    .formatToParts(published).find(part => part.type === 'timeZoneName').value;
  const publishedLocal = `${post.publishAtMexico}${zoneName.replace('GMT', '')}`;
  const modified = new Date(post.modifiedAt || post.publishAt);
  const modifiedZoneName = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' })
    .formatToParts(modified).find(part => part.type === 'timeZoneName').value;
  const modifiedLocal = `${mexicoLocal(modified)}${modifiedZoneName.replace('GMT', '')}`;
  const metadata = {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: post.title, description: post.seoDescription, image: [post.image],
    datePublished: publishedLocal, dateModified: modifiedLocal, inLanguage: 'es-MX',
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: 'Distribuidora Roraima', url: site },
    publisher: { '@type': 'Organization', name: 'Distribuidora Roraima', url: site },
    about: { '@type': 'Brand', name: 'Silhouette', url: 'https://www.silhouette.com/' },
    isAccessibleForFree: true,
  };
  return `<!doctype html>
<html lang="es-MX">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <title>${escapeHtml(post.seoTitle)}</title>
  <meta name="description" content="${escapeHtml(post.seoDescription)}">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="es-MX" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="es_MX">
  <meta property="og:site_name" content="Roraima Distribuciones · Silhouette México">
  <meta property="og:title" content="${escapeHtml(post.socialTitle)}">
  <meta property="og:description" content="${escapeHtml(post.socialDescription)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${escapeHtml(post.socialImage)}">
  <meta property="og:image:secure_url" content="${escapeHtml(post.socialImage)}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="${post.socialImageWidth}">
  <meta property="og:image:height" content="${post.socialImageHeight}">
  <meta property="og:image:alt" content="${escapeHtml(post.socialImageAlt)}">
  <meta property="article:published_time" content="${publishedLocal}">
  <meta property="article:modified_time" content="${modifiedLocal}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(post.socialTitle)}">
  <meta name="twitter:description" content="${escapeHtml(post.socialDescription)}">
  <meta name="twitter:image" content="${escapeHtml(post.socialImage)}">
  <meta name="twitter:image:alt" content="${escapeHtml(post.socialImageAlt)}">
  <link rel="stylesheet" href="../silhouette-blog.css?v=20261013-logos">
  <script type="application/ld+json">${JSON.stringify(metadata).replace(/</g, '\\u003c')}</script>
</head>
<body>
  <header class="site-header"><a class="roraima" href="${site}/" aria-label="Roraima Distribuciones"><img src="${site}/silhouette/roraima-logo-on-light-v5.png" alt="Roraima Distribuciones" width="112" height="56"></a><a class="brand" href="${site}/silhouette/" aria-label="Silhouette"><img src="${site}/silhouette/brand/silhouette-on-light.png" alt="Silhouette" width="186" height="53"></a><nav><a href="${site}/silhouette/">Colección</a><a href="../">Blog</a></nav></header>
  <main><article>
    <header class="article-header"><p class="eyebrow">SILHOUETTE · DISEÑO Y TECNOLOGÍA</p><h1>${escapeHtml(post.title)}</h1><p class="excerpt">${escapeHtml(post.excerpt)}</p><time datetime="${publishedLocal}">${escapeHtml(dateLabel)}</time></header>
    <figure class="hero"><img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt)}"><figcaption>Imagen oficial de Silhouette.</figcaption></figure>
    <div class="article-content">${post.content}</div>
  </article></main>
  <footer><a href="../">Más artículos Silhouette</a><span>Distribuidora Roraima · México</span></footer>
</body></html>
`;
}

function indexPage(posts) {
  const cards = posts.map(post => `<article><a href="${escapeHtml(post.slug)}/"><img src="${escapeHtml(post.image)}" alt="" loading="lazy"><h2>${escapeHtml(post.title)}</h2></a><p>${escapeHtml(post.excerpt)}</p></article>`).join('\n');
  return `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="index,follow"><title>Blog Silhouette México para ópticas | Roraima Distribuciones</title><meta name="description" content="Artículos sobre diseño, tecnología y colecciones de Silhouette para profesionales de la óptica en México."><link rel="canonical" href="${site}/silhouette/blog/"><link rel="stylesheet" href="silhouette-blog.css?v=20261013-logos"></head><body><header class="site-header"><a class="roraima" href="${site}/" aria-label="Roraima Distribuciones"><img src="${site}/silhouette/roraima-logo-on-light-v5.png" alt="Roraima Distribuciones" width="112" height="56"></a><a class="brand" href="${site}/silhouette/" aria-label="Silhouette"><img src="${site}/silhouette/brand/silhouette-on-light.png" alt="Silhouette" width="186" height="53"></a><nav><a href="${site}/silhouette/">Colección</a></nav></header><main class="listing"><p class="eyebrow">BLOG PROFESIONAL · SILHOUETTE MÉXICO</p><h1>Diseño y tecnología para ópticas</h1><p>Información de Silhouette y perspectivas para la selección profesional de monturas en México.</p><div class="cards">${cards}</div></main><footer><a href="${site}/silhouette/">Colección Silhouette</a><span>Distribuidora Roraima · México</span></footer></body></html>`;
}

const filenames = (await readdir(queueDir)).filter(name => name.endsWith('.json')).sort();
const entries = [];
const slugs = new Set();
for (const filename of filenames) {
  const post = validate(JSON.parse(await readFile(join(queueDir, filename), 'utf8')), filename);
  if (slugs.has(post.slug)) throw new Error(`Duplicate slug: ${post.slug}`);
  slugs.add(post.slug);
  entries.push(post);
}
const due = entries.filter(post => new Date(post.publishAt).getTime() <= now.getTime())
  .sort((a, b) => new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime());
const report = { now: now.toISOString(), scheduled: entries.length, due: due.map(post => post.slug) };
if (dryRun) {
  console.log(JSON.stringify(report));
  process.exit(0);
}

await mkdir(outputDir, { recursive: true });
const manifest = due.map(post => ({
  id: post.id, slug: post.slug, title: post.title, excerpt: post.excerpt,
  content: post.content, image: post.image, status: 'published',
  createdAt: post.publishAt, updatedAt: post.modifiedAt || post.publishAt,
}));
await writeFile(join(outputDir, 'published-posts.js'), `window.__silhouettePublishedPosts=${JSON.stringify(manifest).replace(/</g, '\\u003c')};\n`);
if (due.length) {
  await writeFile(join(outputDir, 'index.html'), indexPage(due));
  for (const post of due) {
    const folder = join(outputDir, post.slug);
    await mkdir(folder, { recursive: true });
    await writeFile(join(folder, 'index.html'), htmlPage(post));
  }
  const sitemapPath = join(root, 'sitemap.xml');
  let sitemap = await readFile(sitemapPath, 'utf8');
  const urls = [`${site}/silhouette/blog/`, ...due.map(post => `${site}/silhouette/blog/${post.slug}/`)];
  for (const url of urls) {
    const post = due.find(item => url === `${site}/silhouette/blog/${item.slug}/`);
    const lastmod = mexicoLocal(new Date(post ? post.modifiedAt || post.publishAt : due[0].modifiedAt || due[0].publishAt)).slice(0, 10);
    const oldEntry = sitemap.match(new RegExp(`<url><loc>${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc><lastmod>\\d{4}-\\d{2}-\\d{2}</lastmod></url>`));
    if (oldEntry) sitemap = sitemap.replace(oldEntry[0], `<url><loc>${url}</loc><lastmod>${lastmod}</lastmod></url>`);
    else sitemap = sitemap.replace('</urlset>', `  <url><loc>${url}</loc><lastmod>${lastmod}</lastmod></url>\n</urlset>`);
  }
  await writeFile(sitemapPath, sitemap);
}
console.log(JSON.stringify(report));
