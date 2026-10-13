import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/import-silhouette-blog-batch.mjs batch.json');
const articles = JSON.parse(await readFile(resolve(source), 'utf8'));
if (!Array.isArray(articles) || !articles.length) throw new Error('Batch must be a nonempty JSON array');
const folder = join(root, 'content', 'silhouette-blog', 'scheduled');
await mkdir(folder, { recursive: true });

function localMexico(instant) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(instant);
  const p = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
}

function toUtc(local) {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/.test(local)) throw new Error(`Invalid Mexico date: ${local}`);
  const base = Date.parse(`${local}Z`);
  if (Number.isNaN(base)) throw new Error(`Invalid Mexico date: ${local}`);
  const matches = [];
  for (let offset = -14 * 60; offset <= 14 * 60; offset += 15) {
    const candidate = new Date(base + offset * 60_000);
    if (localMexico(candidate) === local) matches.push(candidate);
  }
  if (matches.length !== 1) throw new Error(`Ambiguous or nonexistent Mexico date: ${local}`);
  return matches[0].toISOString().replace('.000Z', 'Z');
}

const prepared = [];
for (const article of articles) {
  const slug = String(article.slug || '').trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid slug: ${slug}`);
  for (const field of ['title', 'excerpt', 'content', 'image', 'imageAlt', 'publishAtMexico', 'seoTitle', 'seoDescription', 'socialTitle', 'socialDescription', 'socialImage', 'socialImageAlt']) {
    if (typeof article[field] !== 'string' || !article[field].trim()) throw new Error(`${slug}: missing ${field}`);
  }
  if (!/^https:\/\//.test(article.image)) throw new Error(`${slug}: image must use HTTPS`);
  if (!/^https:\/\//.test(article.socialImage)) throw new Error(`${slug}: social image must use HTTPS`);
  if (!Number.isInteger(article.socialImageWidth) || article.socialImageWidth < 600 || !Number.isInteger(article.socialImageHeight) || article.socialImageHeight < 300) {
    throw new Error(`${slug}: invalid social image dimensions`);
  }
  if (/<\s*(script|iframe|object|embed|form)\b|\bon[a-z]+\s*=|javascript:/i.test(article.content)) {
    throw new Error(`${slug}: unsupported HTML`);
  }
  const filename = join(folder, `${slug}.json`);
  try { await access(filename); throw new Error(`Article already exists: ${slug}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  prepared.push({
    path: filename,
    article: {
      status: 'scheduled', slug, title: article.title, excerpt: article.excerpt,
      content: article.content, image: article.image, imageAlt: article.imageAlt,
      publishAtMexico: article.publishAtMexico,
      timeZone: 'America/Mexico_City',
      publishAt: toUtc(article.publishAtMexico),
      seoTitle: article.seoTitle, seoDescription: article.seoDescription,
      socialTitle: article.socialTitle, socialDescription: article.socialDescription,
      socialImage: article.socialImage, socialImageAlt: article.socialImageAlt,
      socialImageWidth: article.socialImageWidth, socialImageHeight: article.socialImageHeight,
    },
  });
}
if (new Set(prepared.map(item => item.article.slug)).size !== prepared.length) throw new Error('Duplicate slug in batch');
for (const item of prepared) {
  await writeFile(item.path, JSON.stringify(item.article, null, 2) + '\n', { flag: 'wx' });
  console.log(`${item.article.slug} => ${item.article.publishAt} (${item.article.publishAtMexico} Mexico City)`);
}
