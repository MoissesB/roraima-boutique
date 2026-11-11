import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

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
const blogIndex = await readFile(join(outputDir, 'index.html'), 'utf8');
assert(blogIndex.includes('silhouette-blog.css?v=20261108-blog30'), 'Blog index must request current CSS');
for (const logo of ['/silhouette/roraima-logo-on-light-v5.png', '/silhouette/brand/silhouette-on-light.png']) {
  assert(blogIndex.includes(logo), `Blog index is missing ${logo}`);
}
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
  const video = post.video;
  const inSitemap = sitemap.includes(`<loc>${url}</loc>`);
  assert.equal(inSitemap, dueNow, `${post.slug}: sitemap publication state`);
  if (!dueNow) {
    await assert.rejects(access(path), { code: 'ENOENT' }, `${post.slug}: future page exists`);
    continue;
  }

  const html = await readFile(path, 'utf8');
  const cssVersion = video ? '20261111-video' : '20261108-blog30';
  assert(html.includes(`silhouette-blog.css?v=${cssVersion}`), `${post.slug}: stale CSS reference`);
  for (const logo of ['/silhouette/roraima-logo-on-light-v5.png', '/silhouette/brand/silhouette-on-light.png']) {
    assert(html.includes(logo), `${post.slug}: missing ${logo}`);
  }
  assert(!html.includes('itemscope'), `${post.slug}: duplicate microdata declaration`);
  assert(html.includes(`<title>${post.seoTitle}</title>`), `${post.slug}: SEO title`);
  assert.equal(tag(html, 'description'), post.seoDescription);
  assert(html.includes(`<link rel="canonical" href="${url}">`), `${post.slug}: canonical URL`);
  assert.equal(tag(html, 'og:url', 'property'), url);
  assert.equal(tag(html, 'og:title', 'property'), post.socialTitle);
  assert.equal(tag(html, 'og:description', 'property'), post.socialDescription);
  assert.equal(tag(html, 'og:image', 'property'), post.socialImage);
  assert.equal(tag(html, 'og:image:type', 'property'), /\.png(?:[?#]|$)/i.test(post.socialImage) ? 'image/png' : 'image/jpeg');
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
  assert(/https:\/\/(?:www\.silhouette(?:-group)?\.com\/|a\.storyblok\.com\/f\/(?:40252|80377)\/)/.test(html), `${post.slug}: official source`);
  if (post.imageCaption) assert(html.includes(post.imageCaption), `${post.slug}: image caption`);
  if (post.imageWidth) {
    assert(html.includes(`width="${post.imageWidth}" height="${post.imageHeight}"`), `${post.slug}: image dimensions`);
  }
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
  if (video) {
    assert(html.includes(`poster="${video.posterUrl}"`), `${post.slug}: video poster`);
    assert(html.includes(`<source src="${video.url}" type="video/mp4">`), `${post.slug}: video source`);
    assert(html.includes(`<track src="${video.captionsUrl}" kind="captions" srclang="es-MX"`), `${post.slug}: captions`);
    assert(/<video\b[^>]*\bcontrols\b/.test(html), `${post.slug}: video controls`);
    assert.equal(structured.video?.['@type'], 'VideoObject');
    assert.equal(structured.video.name, video.title);
    assert.equal(structured.video.description, video.description);
    assert.equal(structured.video.contentUrl, video.url);
    assert.deepEqual(structured.video.thumbnailUrl, [video.posterUrl]);
    assert.equal(structured.video.duration, `PT${video.durationSeconds}S`);
    assert.equal(structured.video.uploadDate, video.uploadDate ?? structured.datePublished);
  } else {
    assert.equal(structured.video, undefined);
  }
  assert.equal(new Date(structured.datePublished).toISOString().replace('.000Z', 'Z'), post.publishAt);
  assert.equal(new Date(structured.dateModified).toISOString().replace('.000Z', 'Z'), post.modifiedAt || post.publishAt);
  console.log(`OK ${post.slug}`);
}
console.log(`SEO verified: ${due.length} published, ${posts.length - due.length} scheduled`);

if (process.argv.includes('--live') && due.some(post => post.video)) {
  const paths = [
    'sitemap.xml',
    'silhouette/blog/index.html',
    'silhouette/blog/published-posts.js',
    ...due.filter(post => post.video).map(post => `silhouette/blog/${post.slug}/index.html`),
  ];
  const normalize = value => value.replaceAll('\r\n', '\n').trimEnd();
  const expected = await Promise.all(paths.map(async path => normalize(await readFile(join(root, path), 'utf8'))));
  const pending = new Set(paths.keys());
  const failures = new Map();
  for (let attempt = 0; attempt < 5 && pending.size; attempt++) {
    if (attempt) await delay(15_000);
    const indexes = [...pending];
    const verify = Date.now();
    for (let start = 0; start < indexes.length; start += 8) {
      await Promise.all(indexes.slice(start, start + 8).map(async index => {
        const path = paths[index];
        const publicPath = path.endsWith('/index.html') ? path.slice(0, -'index.html'.length) : path;
        try {
          const response = await fetch(`https://roraimamx.com/${publicPath}?check=${verify}`, {
            headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(10_000),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          if (normalize(await response.text()) !== expected[index]) throw new Error('live content differs from this deploy');
          pending.delete(index);
          failures.delete(index);
        } catch (error) {
          failures.set(index, `${publicPath}: ${error.message}`);
        }
      }));
    }
  }
  if (failures.size) throw new Error(`Silhouette live verification failed:\n${[...failures.values()].join('\n')}`);
  console.log(`Live Silhouette publication verified: ${paths.length - 3} articles with video, index, manifest and sitemap`);
}
