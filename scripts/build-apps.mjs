#!/usr/bin/env node
/*
 * Turns data/apps.json into the parts of the site that list apps:
 *   - the app cards on the English, Japanese and Chinese homepages and on the knowledge base page,
 *     between <!-- apps:cards CATEGORY --> and <!-- /apps:cards --> markers;
 *   - the app showcases that promote each app: compact on the homepages, between
 *     <!-- apps:showcase CATEGORY --> and <!-- /apps:showcase -->, and in full on the Marketplace apps page,
 *     between <!-- apps:showcase CATEGORY full --> and <!-- /apps:showcase -->;
 *   - the "Sitemap:" lines for app docs sites in robots.txt, between "# apps:sitemaps" and "# /apps:sitemaps".
 * The site search reads data/apps.json itself to find each app's search index.
 *
 * Usage:
 *   node scripts/build-apps.mjs [site-dir]          rewrite the generated parts (default: the repository root)
 *   node scripts/build-apps.mjs [site-dir] --check  fail if any generated part is out of date
 * No dependencies beyond Node.js 18 or later.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const check = args.includes('--check');
const siteDir = args.find((a) => !a.startsWith('--')) || join(dirname(fileURLToPath(import.meta.url)), '..');
const LANGS = ['en', 'ja', 'zh'];
const SITE = 'https://liferay-community-apac.github.io/';

// Pages with app cards, and their language.
const PAGES = [
  { file: 'index.html', lang: 'en' },
  { file: 'ja/index.html', lang: 'ja' },
  { file: 'zh/index.html', lang: 'zh' },
  { file: 'knowledge-base/index.html', lang: 'en' },
  { file: 'marketplace-apps/index.html', lang: 'en' }
];
// The Marketplace apps page (English): the homepages' showcases link to it.
const APPS_PAGE = 'marketplace-apps/';
const COMPACT_HIGHLIGHTS = 4;

const STRINGS = {
  en: { more: 'Read the guide →', moreOther: 'Read the guide →', marketplace: 'Marketplace listing →',
        guide: 'Read the guide', guideOther: 'Read the guide', download: 'Download', details: 'All features and screenshots →',
        features: 'Features', screenshots: 'Screenshots', versions: 'Works with', version: 'Version',
        soonTag: 'Coming soon', soonTitle: 'More apps coming soon', soonText: 'More Marketplace apps and their guides are on the way.' },
  ja: { more: 'ガイドを読む →', moreOther: 'ガイドを読む（英語）→', marketplace: 'Marketplace で見る →',
        guide: 'ガイドを読む', guideOther: 'ガイドを読む（英語）', download: 'ダウンロード', details: 'すべての機能とスクリーンショット（英語）→',
        features: '機能', screenshots: 'スクリーンショット', versions: '対応製品', version: 'バージョン',
        soonTag: '近日公開', soonTitle: 'その他のアプリも近日公開', soonText: '新しい Marketplace アプリとガイドを準備中です。' },
  zh: { more: '阅读指南 →', moreOther: '阅读指南（英文）→', marketplace: '在 Marketplace 查看 →',
        guide: '阅读指南', guideOther: '阅读指南（英文）', download: '下载', details: '全部功能与截图（英文）→',
        features: '功能', screenshots: '截图', versions: '适用于', version: '版本',
        soonTag: '即将推出', soonTitle: '更多应用即将推出', soonText: '更多 Marketplace 应用及其指南正在准备中。' }
};

const fail = (msg) => { console.error('apps.json: ' + msg); process.exit(1); };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const isUrl = (s) => /^https?:\/\//.test(s);

// ---------- read and check the list ----------
const data = JSON.parse(readFileSync(join(siteDir, 'data/apps.json'), 'utf8'));
const categories = new Map((data.categories || []).map((c) => [c.id, c]));
const ids = new Set();
for (const c of categories.values()) {
  for (const l of LANGS) if (!c.name?.[l] || !c.tag?.[l]) fail(`category "${c.id}" needs name and tag in ${LANGS.join(', ')}`);
}
for (const a of data.apps || []) {
  const where = `app "${a.id || a.name || '?'}"`;
  for (const k of ['id', 'category', 'name', 'docs']) if (!a[k]) fail(`${where} needs "${k}"`);
  if (ids.has(a.id)) fail(`${where} is listed twice`);
  ids.add(a.id);
  if (!categories.has(a.category)) fail(`${where} has unknown category "${a.category}"`);
  for (const l of LANGS) if (!a.summary?.[l]) fail(`${where} needs a summary in "${l}"`);
  if (a.image && !(a.image.src && a.image.width && a.image.height)) fail(`${where}: image needs src, width and height`);
  if (a.image && !isUrl(a.image.src) && !existsSync(join(siteDir, a.image.src))) fail(`${where}: image ${a.image.src} not found`);
  if (a.tagline) for (const l of LANGS) if (!a.tagline[l]) fail(`${where}: tagline needs "${l}"`);
  (a.highlights || []).forEach((h, i) => {
    for (const l of LANGS) if (!h.title?.[l] || !h.text?.[l]) fail(`${where}: highlight ${i + 1} needs a title and text in "${l}"`);
  });
  for (const sh of a.screenshots || []) {
    if (!(sh.src && sh.width && sh.height)) fail(`${where}: each screenshot needs src, width and height`);
    if (!isUrl(sh.src) && !existsSync(join(siteDir, sh.src))) fail(`${where}: screenshot ${sh.src} not found`);
  }
  for (const k of ['search', 'sitemap']) {
    if (a[k] && (isUrl(a[k]) || a[k].startsWith('/'))) fail(`${where}: "${k}" must be a path under the site root, such as "my-app/${k === 'search' ? 'pagefind/' : 'sitemap.xml'}"`);
  }
}

// ---------- render ----------
function href(path, page) {
  if (isUrl(path)) return path;
  const from = posix.dirname(page.file);
  let r = posix.relative(from, path.replace(/\/$/, '')) || '.';
  return r + (path.endsWith('/') ? '/' : '');
}

function card(a, page, indent) {
  const t = STRINGS[page.lang];
  const cat = categories.get(a.category);
  const translated = (a.docsLanguages || ['en']).includes(page.lang); // docs are English-only unless listed
  const meta = [a.version && 'v' + a.version, a.dxp].filter(Boolean).join(' · ');
  const lines = ['<article class="card resource app">'];
  if (a.image) lines.push(`  <img class="app-shot" src="${esc(href(a.image.src, page))}" alt="" width="${a.image.width}" height="${a.image.height}" loading="lazy">`);
  lines.push(`  <span class="tag">${esc(cat.tag[page.lang])}</span>`);
  lines.push(`  <h3>${esc(a.name)}</h3>`);
  lines.push(`  <p>${esc(a.summary[page.lang])}</p>`);
  if (meta) lines.push(`  <span class="meta">${esc(meta)}</span>`);
  lines.push(`  <a class="more" href="${esc(href(a.docs, page))}">${esc(translated ? t.more : t.moreOther)}</a>`);
  if (a.marketplace) lines.push(`  <a class="more" href="${esc(a.marketplace)}">${esc(t.marketplace)}</a>`);
  lines.push('</article>');
  return lines.map((l) => indent + l).join('\n');
}

function soonCard(page, indent) {
  const t = STRINGS[page.lang];
  return [
    '<article class="card resource soon">',
    `  <span class="tag">${esc(t.soonTag)}</span>`,
    `  <h3>${esc(t.soonTitle)}</h3>`,
    `  <p>${esc(t.soonText)}</p>`,
    '</article>'
  ].map((l) => indent + l).join('\n');
}

// A promotional block for one app. compact: the homepages (a few highlights and a link to the apps page);
// full: the Marketplace apps page (every highlight, screenshots, versions).
function showcase(a, page, indent, full) {
  const t = STRINGS[page.lang], L = page.lang;
  const cat = categories.get(a.category);
  const translated = (a.docsLanguages || ['en']).includes(L);
  const meta = [a.version && 'v' + a.version, a.dxp].filter(Boolean).join(' · ');
  const hl = a.highlights || [];
  const points = (full ? hl : hl.slice(0, COMPACT_HIGHLIGHTS))
    .map((h) => `      <li><strong>${esc(h.title[L])}.</strong> ${esc(h.text[L])}</li>`);
  const lines = [`<article class="showcase${full ? ' full' : ''}" id="${esc(a.id)}">`];
  if (a.image) lines.push(
    `  <a class="showcase-shot" href="${esc(href(a.docs, page))}" tabindex="-1" aria-hidden="true">`,
    `    <img src="${esc(href(a.image.src, page))}" alt="" width="${a.image.width}" height="${a.image.height}" loading="lazy">`,
    '  </a>');
  lines.push('  <div class="showcase-body">',
    `    <span class="tag">${esc(cat.tag[L])}</span>`,
    `    <h3>${esc(a.name)}</h3>`);
  if (a.tagline) lines.push(`    <p class="showcase-tagline">${esc(a.tagline[L])}</p>`);
  lines.push(`    <p>${esc(a.summary[L])}</p>`);
  if (points.length && !full) lines.push('    <ul class="showcase-points">', ...points, '    </ul>');
  const fullMeta = [a.version && `${t.version} ${a.version}`, a.dxp && `${t.versions} ${a.dxp}`].filter(Boolean).join(' · ');
  if (meta) lines.push(`    <p class="meta">${esc(full ? fullMeta : meta)}</p>`);
  lines.push('    <div class="btns">',
    `      <a class="btn" href="${esc(href(a.docs, page))}">${esc(translated ? t.guide : t.guideOther)} →</a>`);
  if (a.download) lines.push(`      <a class="btn outline" href="${esc(a.download)}">${esc(t.download)}</a>`);
  if (a.marketplace) lines.push(`      <a class="btn outline" href="${esc(a.marketplace)}">${esc(t.marketplace.replace(/ →$/, ''))}</a>`);
  lines.push('    </div>');
  if (!full && hl.length) lines.push(`    <a class="more" href="${esc(href(APPS_PAGE, page))}#${esc(a.id)}">${esc(t.details)}</a>`);
  lines.push('  </div>');
  if (full && points.length) lines.push('  <div class="showcase-features">',
    `    <h4>${esc(t.features)}</h4>`,
    '    <ul class="features">', ...points.map((p) => p.replace(/^ {6}/, '      ')), '    </ul>',
    '  </div>');
  if (full && (a.screenshots || []).length) {
    lines.push('  <div class="showcase-gallery">', `    <h4>${esc(t.screenshots)}</h4>`, '    <div class="gallery">');
    for (const sh of a.screenshots) lines.push('      <figure>',
      `        <img src="${esc(href(sh.src, page))}" alt="${esc(sh.caption || '')}" width="${sh.width}" height="${sh.height}" loading="lazy">`,
      sh.caption ? `        <figcaption>${esc(sh.caption)}</figcaption>` : null, '      </figure>');
    lines.push('    </div>', '  </div>');
  }
  lines.push('</article>');
  return lines.filter((l) => l !== null).map((l) => indent + l).join('\n');
}

const SHOWCASE_RE = /([ \t]*)<!-- apps:showcase ([\w-]+)( full)? -->[\s\S]*?<!-- \/apps:showcase -->/g;
const CARDS_RE = /([ \t]*)<!-- apps:cards ([\w-]+) -->[\s\S]*?<!-- \/apps:cards -->/g;
let changed = 0;

function update(file, next) {
  const path = join(siteDir, file);
  const prev = readFileSync(path, 'utf8');
  const out = next(prev);
  if (out === prev) return;
  changed++;
  if (check) console.error(`out of date: ${file}`);
  else { writeFileSync(path, out); console.log(`updated ${file}`); }
}

for (const page of PAGES) {
  update(page.file, (html) => {
    let found = 0;
    html = html.replace(SHOWCASE_RE, (_, indent, catId, full) => {
      found++;
      if (!categories.get(catId)) fail(`${page.file} has a showcase for unknown category "${catId}"`);
      const blocks = data.apps.filter((a) => a.category === catId).map((a) => showcase(a, page, indent, !!full));
      return `${indent}<!-- apps:showcase ${catId}${full || ''} -->\n${blocks.join('\n')}\n${indent}<!-- /apps:showcase -->`;
    });
    const out = html.replace(CARDS_RE, (_, indent, catId) => {
      found++;
      const cat = categories.get(catId);
      if (!cat) fail(`${page.file} has cards for unknown category "${catId}"`);
      const apps = data.apps.filter((a) => a.category === catId);
      const cards = apps.map((a) => card(a, page, indent));
      if (cat.comingSoon) cards.push(soonCard(page, indent));
      return `${indent}<!-- apps:cards ${catId} -->\n${cards.join('\n')}\n${indent}<!-- /apps:cards -->`;
    });
    if (!found) fail(`${page.file} has no <!-- apps:cards ... --> or <!-- apps:showcase ... --> marker`);
    return out;
  });
}

update('robots.txt', (txt) => {
  const lines = data.apps.filter((a) => a.sitemap).map((a) => `Sitemap: ${SITE}${a.sitemap}`);
  const block = ['# apps:sitemaps', ...lines, '# /apps:sitemaps'].join('\n');
  return /# apps:sitemaps[\s\S]*?# \/apps:sitemaps/.test(txt)
    ? txt.replace(/# apps:sitemaps[\s\S]*?# \/apps:sitemaps/, block)
    : txt.replace(/\s*$/, '\n\n' + block + '\n');
});

if (check && changed) { console.error(`${changed} file(s) out of date: run node scripts/build-apps.mjs`); process.exit(1); }
if (!changed) console.log('apps: everything up to date');
