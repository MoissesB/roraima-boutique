import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const queueDir = join(root, 'content', 'silhouette-blog', 'scheduled');
const outputDir = join(root, 'silhouette', 'blog');
const nowArg = process.argv.find(arg => arg.startsWith('--now='));
const now = nowArg ? new Date(nowArg.slice(6)) : new Date();
assert(!Number.isNaN(now.getTime()), 'Invalid --now timestamp');

const files = (await readdir(queueDir)).filter(name => name.endsWith('.json'));
const posts = await Promise.all(files.map(async name => JSON.parse(await readFile(join(queueDir, name), 'utf8'))));
assert.equal(new Set(posts.map(post => post.slug)).size, posts.length, 'Slugs must be unique');
for (const field of ['seoTitle', 'seoDescription', 'socialTitle', 'socialDescription']) {
  assert.equal(new Set(posts.map(post => post[field])).size, posts.length, `${field} must be unique`);
}

const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
const manifestSource = await readFile(join(outputDir, 'published-posts.js'), 'utf8');
const manifest = JSON.parse(manifestSource.replace(/^window\.__silhouettePublishedPosts=/, '').replace(/;\s*$/, ''));
const due = posts.filter(post => new Date(post.publishAt) <= now);
assert.deepEqual(new Set(manifest.map(post => post.slug)), new Set(due.map(post => post.slug)), 'Published manifest must contain only due posts');

function tag(html, name, kind = 'name') {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<meta ${kind}="${escaped}" content="([^"]*)">`));
  assert(match, `Missing ${name}`);
  return match[1];
}

for (const post of posts) {
  const url = `https://roraimamx.com/silhouette/blog/${post.slug}/`;
  const path = join(outputDir, post.slug, 'index.html');
  const dueNow = new Date(post.publishAt) <= now;
  const inSitemap = sitemap.includes(`<loc>${url}</loc>`);
  assert.equal(inSitemap, dueNow, `${post.slug}: sitemap publication state`);
  if (!dueNow) {
    await assert.rejects(access(path), { code: 'ENOENT' }, `${post.slug}: future page exists`);
    continue;
  }

  const html = await readFile(path, 'utf8');
  assert(html.includes(`<title>${post.seoTitle}</title>`), `${post.slug}: SEO title`);
  assert.equal(tag(html, 'description'), post.seoDescription);
  assert(html.includes(`<link rel="canonical" href="${url}">`), `${post.slug}: canonical URL`);
  assert.equal(tag(html, 'og:url', 'property'), url);
  assert.equal(tag(html, 'og:title', 'property'), post.socialTitle);
  assert.equal(tag(html, 'og:description', 'property'), post.socialDescription);
  assert.equal(tag(html, 'og:image', 'property'), post.socialImage);
  assert.equal(tag(html, 'og:image:alt', 'property'), post.socialImageAlt);
  assert.equal(Number(tag(html, 'og:image:width', 'property')), post.socialImageWidth);
  assert.equal(Number(tag(html, 'og:image:height', 'property')), post.socialImageHeight);
  assert.equal(tag(html, 'twitter:card'), 'summary_large_image');
  assert.equal(tag(html, 'twitter:title'), post.socialTitle);
  assert.equal(tag(html, 'twitter:description'), post.socialDescription);
  assert.equal(tag(html, 'twitter:image'), post.socialImage);
  assert.equal(tag(html, 'twitter:image:alt'), post.socialImageAlt);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${post.slug}: expected one H1`);
  assert((html.match(/<h2\b/g) || []).length >= 2, `${post.slug}: expected H2 sections`);
  assert(html.includes(`alt="${post.imageAlt}"`), `${post.slug}: cover alt text`);
  assert(html.includes('https://www.silhouette.com/'), `${post.slug}: official source`);
  assert(html.includes('https://roraimamx.com/silhouette/#/catalogo'), `${post.slug}: catalog CTA`);
  assert(html.includes('https://distribuciones.roraimamx.com/home-page-6687#calendario'), `${post.slug}: calendar CTA`);
  assert(!/Ra[uú]l/i.test(html), `${post.slug}: unverified personal name`);
  const match = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
  assert(match, `${post.slug}: BlogPosting JSON-LD missing`);
  const structured = JSON.parse(match[1]);
  assert.equal(structured['@type'], 'BlogPosting');
  assert.equal(structured.headline, post.title);
  assert.equal(structured.description, post.seoDescription);
  assert.equal(structured.mainEntityOfPage, url);
  assert.equal(new Date(structured.datePublished).toISOString().replace('.000Z', 'Z'), post.publishAt);
  assert.equal(new Date(structured.dateModified).toISOString().replace('.000Z', 'Z'), post.modifiedAt || post.publishAt);
  console.log(`OK ${post.slug}`);
}
console.log(`SEO verified: ${due.length} published, ${posts.length - due.length} scheduled`);
