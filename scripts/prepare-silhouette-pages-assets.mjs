import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const siteRoot = process.argv[2] || '.site-artifact';
const assetsDir = path.join(siteRoot, 'silhouette', 'assets');
const files = (await readdir(assetsDir)).filter((name) => /^index-.*\.js$/.test(name));
const localImage = /\/catalog\/silhouette\/[^"']+?\/frame-\d{4}\.jpg/g;
const sourceImage = /url:"(\/catalog\/silhouette\/[^"']+?\/frame-\d{4}\.jpg)"[^{}]*?metadata:\{[^{}]*?sourceUrl:"(https:\/\/[^"']+)"/g;
let updatedBundles = 0;
let remoteFrames = 0;

for (const name of files) {
  const file = path.join(assetsDir, name);
  const original = await readFile(file, 'utf8');
  if (!original.includes('/catalog/silhouette/')) continue;

  const sources = new Map();
  for (const match of original.matchAll(sourceImage)) {
    if (sources.has(match[1]) && sources.get(match[1]) !== match[2]) {
      throw new Error(`Conflicting official image sources for ${match[1]}`);
    }
    sources.set(match[1], match[2]);
  }

  let replaced = 0;
  const output = original.replace(localImage, (url) => {
    if (url.endsWith('/frame-0000.jpg')) return url;
    const source = sources.get(url);
    if (!source || new URL(source).hostname !== 'sil-media.storyblok.com') {
      throw new Error(`No verified Silhouette source for ${url}`);
    }
    replaced += 1;
    return source;
  });
  if (!replaced) continue;
  if ([...output.matchAll(localImage)].some(([url]) => !url.endsWith('/frame-0000.jpg'))) {
    throw new Error(`Unconverted rotation image in ${name}`);
  }
  await writeFile(file, output);
  updatedBundles += 1;
  remoteFrames += replaced;
}

if (updatedBundles !== 1 || remoteFrames < 1000) {
  throw new Error(`Unexpected Silhouette conversion: ${updatedBundles} bundles, ${remoteFrames} frames`);
}
console.log(`Silhouette official rotation images: ${remoteFrames} remote frames in ${updatedBundles} bundle`);
