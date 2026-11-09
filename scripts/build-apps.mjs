#!/usr/bin/env node
/*
 * Turns the site's catalogue, data/apps.json, into the parts of the pages that list its entries
 * (Marketplace Apps, Solution Recipes, tutorials, sample code and tools), in English, Japanese and Chinese:
 *
 *   <!-- apps:cards CATEGORY[,CATEGORY...] [limit=N] -->  <!-- /apps:cards -->
 *       Cards for the entries of one or more categories, in catalogue order (the first N with a limit).
 *   <!-- apps:showcase CATEGORY [full] -->  <!-- /apps:showcase -->
 *       A promotional block per entry: compact on the homepages, in full on the Marketplace Apps pages.
 *   <!-- site:sections -->  <!-- /site:sections -->
 *       The homepage's cards for the site's four sections, with counts from the catalogue.
 *   <!-- site:help-topics -->  <!-- /site:help-topics -->
 *       The <option>s of the "Get help" form's topic list: every entry, then "Something else".
 *       Each option's value is the English name, which goes into the forum post.
 *   "# apps:sitemaps" ... "# /apps:sitemaps" in robots.txt
 *       A Sitemap line for every entry published from its own repository.
 *
 * The site search reads data/apps.json itself to find each entry's search index.
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
const HOME = { en: '', ja: 'ja/', zh: 'zh/' };

// Pages with generated parts, and their language.
const PAGES = LANGS.flatMap((l) => [
  { file: `${HOME[l]}index.html`, lang: l },
  { file: `${HOME[l]}marketplace-apps/index.html`, lang: l },
  { file: `${HOME[l]}tutorials/index.html`, lang: l },
  { file: `${HOME[l]}community/index.html`, lang: l }
]);
const COMPACT_HIGHLIGHTS = 4;

const STRINGS = {
  en: { more: 'Read the guide →', moreOther: 'Read the guide →', marketplace: 'Marketplace listing →',
        guide: 'Read the guide', guideOther: 'Read the guide', download: 'Download', details: 'All features and screenshots →',
        features: 'Features', screenshots: 'Screenshots', versions: 'Works with', version: 'Version',
        soonTag: 'Coming soon', soonTitle: 'More Marketplace Apps coming soon', soonText: 'More Marketplace Apps and their guides are on the way.' },
  ja: { more: 'ガイドを読む →', moreOther: 'ガイドを読む（英語）→', marketplace: 'Marketplace で見る →',
        guide: 'ガイドを読む', guideOther: 'ガイドを読む（英語）', download: 'ダウンロード', details: 'すべての機能とスクリーンショット →',
        features: '機能', screenshots: 'スクリーンショット', versions: '対応製品', version: 'バージョン',
        soonTag: '近日公開', soonTitle: 'その他の Marketplace アプリも近日公開', soonText: '新しい Marketplace アプリとガイドを準備中です。' },
  zh: { more: '阅读指南 →', moreOther: '阅读指南（英文）→', marketplace: '在 Marketplace 查看 →',
        guide: '阅读指南', guideOther: '阅读指南（英文）', download: '下载', details: '全部功能与截图 →',
        features: '功能', screenshots: '截图', versions: '适用于', version: '版本',
        soonTag: '即将推出', soonTitle: '更多 Marketplace 应用即将推出', soonText: '更多 Marketplace 应用及其指南正在准备中。' }
};

// The homepage's section cards. count(n) receives the number of catalogue entries in the section's categories.
const ICONS = {
  apps: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  recipes: '<path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/><path d="M7 15h10"/>',
  tutorials: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/>',
  community: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5"/>'
};
const SECTIONS = [
  { icon: 'apps', href: (l) => `${HOME[l]}marketplace-apps/`, categories: ['marketplace-apps'],
    title: { en: 'Marketplace Apps', ja: 'Marketplace アプリ', zh: 'Marketplace 应用' },
    text: { en: 'Apps that add features to Liferay DXP, each with a full user guide.', ja: 'Liferay DXP に機能を追加するアプリと、そのユーザーガイド。', zh: '为 Liferay DXP 增加功能的应用及其用户指南。' },
    count: { en: (n) => `${n} Marketplace App${n === 1 ? '' : 's'}`, ja: (n) => `${n} 件の Marketplace アプリ`, zh: (n) => `${n} 个 Marketplace 应用` } },
  { icon: 'recipes', href: () => 'solution-recipes/', categories: [],
    title: { en: 'Solution Recipes', ja: 'ソリューションレシピ', zh: '解决方案实践指南' },
    text: { en: 'Step-by-step recipes that combine Marketplace Apps, tutorials and DXP features into a complete use case.', ja: 'Marketplace アプリ、チュートリアル、DXP の機能を組み合わせてユースケースを実現するレシピ。', zh: '将 Marketplace 应用、教程和 DXP 功能组合成完整用例的分步指南。' },
    count: { en: () => 'First recipes coming soon', ja: () => '最初のレシピを準備中', zh: () => '首批指南即将推出' } },
  { icon: 'tutorials', href: (l) => `${HOME[l]}tutorials/`, categories: ['tutorials', 'sample-code', 'tools'],
    title: { en: 'Tutorials & Tools', ja: 'チュートリアルとツール', zh: '教程与工具' },
    text: { en: 'Step-by-step tutorials, sample code and tools for implementation, upgrade and migration tasks.', ja: '実装、アップグレード、移行に役立つチュートリアル、サンプルコード、ツール。', zh: '用于实施、升级和迁移任务的分步教程、示例代码和工具。' },
    count: { en: (n) => `${n} tutorials, samples and tools`, ja: (n) => `${n} 件のチュートリアル、サンプル、ツール`, zh: (n) => `${n} 个教程、示例和工具` } },
  { icon: 'community', href: (l) => `${HOME[l]}community/`, categories: [],
    title: { en: 'Community', ja: 'コミュニティ', zh: '社区' },
    text: { en: 'Local user groups, events and ways to stay updated.', ja: '地域のユーザーグループ、イベント、最新情報の受け取り方。', zh: '各地用户组、活动以及获取最新信息的方式。' },
    count: { en: () => 'India · Japan · Australia · Southeast Asia', ja: () => 'インド · 日本 · オーストラリア · 東南アジア', zh: () => '印度 · 日本 · 澳大利亚 · 东南亚' } }
];

const fail = (msg) => { console.error('apps.json: ' + msg); process.exit(1); };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const isUrl = (s) => /^https?:\/\//.test(s);
const L = (v, lang) => (v && typeof v === 'object' ? v[lang] ?? v.en : v); // a string, or one value per language

// ---------- read and check the catalogue ----------
const data = JSON.parse(readFileSync(join(siteDir, 'data/apps.json'), 'utf8'));
const categories = new Map((data.categories || []).map((c) => [c.id, c]));
const ids = new Set();
for (const c of categories.values()) {
  for (const l of LANGS) if (!c.name?.[l] || !c.tag?.[l]) fail(`category "${c.id}" needs name and tag in ${LANGS.join(', ')}`);
}
const needsAll = (where, field, v) => { if (v && typeof v === 'object') for (const l of LANGS) if (!v[l]) fail(`${where}: ${field} needs "${l}"`); };
for (const a of data.apps || []) {
  const where = `entry "${a.id || L(a.name, 'en') || '?'}"`;
  for (const k of ['id', 'category', 'name', 'docs']) if (!a[k]) fail(`${where} needs "${k}"`);
  if (ids.has(a.id)) fail(`${where} is listed twice`);
  ids.add(a.id);
  if (!categories.has(a.category)) fail(`${where} has unknown category "${a.category}"`);
  for (const l of LANGS) if (!a.summary?.[l]) fail(`${where} needs a summary in "${l}"`);
  needsAll(where, 'name', a.name); needsAll(where, 'meta', a.meta); needsAll(where, 'tagline', a.tagline);
  (a.links || []).forEach((k, i) => { if (!k.href || !k.label) fail(`${where}: link ${i + 1} needs href and label`); needsAll(where, `link ${i + 1} label`, k.label); });
  if (a.image && !(a.image.src && a.image.width && a.image.height)) fail(`${where}: image needs src, width and height`);
  if (a.image && !isUrl(a.image.src) && !existsSync(join(siteDir, a.image.src))) fail(`${where}: image ${a.image.src} not found`);
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
  const r = posix.relative(from, path.replace(/\/$/, '')) || '.';
  return r + (path.endsWith('/') ? '/' : '');
}
const indentAll = (lines, indent) => lines.filter((l) => l !== null).map((l) => indent + l).join('\n');

function card(a, page, indent) {
  const t = STRINGS[page.lang], lang = page.lang;
  const cat = categories.get(a.category);
  const translated = (a.docsLanguages || ['en']).includes(lang); // docs are English-only unless listed
  const meta = a.meta ? L(a.meta, lang) : [a.version && 'v' + a.version, a.dxp].filter(Boolean).join(' · ');
  const lines = [`<article class="card resource${a.image ? ' app' : ''}">`];
  if (a.image) lines.push(`  <img class="app-shot" src="${esc(href(a.image.src, page))}" alt="" width="${a.image.width}" height="${a.image.height}" loading="lazy">`);
  lines.push(`  <span class="tag">${esc(cat.tag[lang])}</span>`, `  <h3>${esc(L(a.name, lang))}</h3>`, `  <p>${esc(a.summary[lang])}</p>`);
  if (meta) lines.push(`  <span class="meta">${esc(meta)}</span>`);
  if (a.links) for (const k of a.links) lines.push(`  <a class="more" href="${esc(href(L(k.href, lang), page))}">${esc(L(k.label, lang))}</a>`);
  else {
    // A category can name its own button, for example "Browse the recipes →"; otherwise "Read the guide →".
    const more = cat.more?.[lang] || (translated ? t.more : t.moreOther);
    lines.push(`  <a class="more" href="${esc(href(a.docs, page))}">${esc(more)}</a>`);
  }
  if (a.marketplace) lines.push(`  <a class="more" href="${esc(a.marketplace)}">${esc(t.marketplace)}</a>`);
  lines.push('</article>');
  return indentAll(lines, indent);
}

function soonCard(page, indent) {
  const t = STRINGS[page.lang];
  return indentAll(['<article class="card resource soon">', `  <span class="tag">${esc(t.soonTag)}</span>`,
    `  <h3>${esc(t.soonTitle)}</h3>`, `  <p>${esc(t.soonText)}</p>`, '</article>'], indent);
}

// A promotional block for one app. compact: the homepages (a few highlights and a link to the apps page);
// full: the Marketplace Apps pages (every highlight, screenshots, versions).
function showcase(a, page, indent, full) {
  const t = STRINGS[page.lang], lang = page.lang;
  const cat = categories.get(a.category);
  const translated = (a.docsLanguages || ['en']).includes(lang);
  const meta = [a.version && 'v' + a.version, a.dxp].filter(Boolean).join(' · ');
  const fullMeta = [a.version && `${t.version} ${a.version}`, a.dxp && `${t.versions} ${a.dxp}`].filter(Boolean).join(' · ');
  const hl = a.highlights || [];
  const points = (full ? hl : hl.slice(0, COMPACT_HIGHLIGHTS)).map((h) => `      <li><strong>${esc(h.title[lang])}.</strong> ${esc(h.text[lang])}</li>`);
  const lines = [`<article class="showcase${full ? ' full' : ''}" id="${esc(a.id)}">`];
  if (a.image) lines.push(`  <a class="showcase-shot" href="${esc(href(a.docs, page))}" tabindex="-1" aria-hidden="true">`,
    `    <img src="${esc(href(a.image.src, page))}" alt="" width="${a.image.width}" height="${a.image.height}" loading="lazy">`, '  </a>');
  lines.push('  <div class="showcase-body">', `    <span class="tag">${esc(cat.tag[lang])}</span>`, `    <h3>${esc(L(a.name, lang))}</h3>`);
  if (a.tagline) lines.push(`    <p class="showcase-tagline">${esc(a.tagline[lang])}</p>`);
  lines.push(`    <p>${esc(a.summary[lang])}</p>`);
  if (points.length && !full) lines.push('    <ul class="showcase-points">', ...points, '    </ul>');
  if (meta) lines.push(`    <p class="meta">${esc(full ? fullMeta : meta)}</p>`);
  lines.push('    <div class="btns">', `      <a class="btn" href="${esc(href(a.docs, page))}">${esc(translated ? t.guide : t.guideOther)} →</a>`);
  if (a.download) lines.push(`      <a class="btn outline" href="${esc(a.download)}">${esc(t.download)}</a>`);
  if (a.marketplace) lines.push(`      <a class="btn outline" href="${esc(a.marketplace)}">${esc(t.marketplace.replace(/ →$/, ''))}</a>`);
  lines.push('    </div>');
  if (!full && hl.length) lines.push(`    <a class="more" href="${esc(href(`${HOME[lang]}marketplace-apps/`, page))}#${esc(a.id)}">${esc(t.details)}</a>`);
  lines.push('  </div>');
  if (full && points.length) lines.push('  <div class="showcase-features">', `    <h4>${esc(t.features)}</h4>`, '    <ul class="features">', ...points, '    </ul>', '  </div>');
  if (full && (a.screenshots || []).length) {
    lines.push('  <div class="showcase-gallery">', `    <h4>${esc(t.screenshots)}</h4>`, '    <div class="gallery">');
    for (const sh of a.screenshots) lines.push('      <figure>',
      `        <img src="${esc(href(sh.src, page))}" alt="${esc(L(sh.caption, lang) || '')}" width="${sh.width}" height="${sh.height}" loading="lazy">`,
      sh.caption ? `        <figcaption>${esc(L(sh.caption, lang))}</figcaption>` : null, '      </figure>');
    lines.push('    </div>', '  </div>');
  }
  lines.push('</article>');
  return indentAll(lines, indent);
}

function sectionCards(page, indent) {
  const lang = page.lang;
  const lines = [];
  for (const s of SECTIONS) {
    const n = data.apps.filter((a) => s.categories.includes(a.category)).length;
    lines.push(`<a class="card section-card" href="${esc(href(s.href(lang), page))}">`,
      `  <span class="icon"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[s.icon]}</svg></span>`,
      `  <h3>${esc(s.title[lang])}</h3>`, `  <p>${esc(s.text[lang])}</p>`,
      `  <span class="meta">${esc(s.count[lang](n))}</span>`, '</a>');
  }
  return indentAll(lines, indent);
}

const SHOWCASE_RE = /([ \t]*)<!-- apps:showcase ([\w-]+)( full)? -->[\s\S]*?<!-- \/apps:showcase -->/g;
const CARDS_RE = /([ \t]*)<!-- apps:cards ([\w,-]+)( limit=\d+)? -->[\s\S]*?<!-- \/apps:cards -->/g;
function helpTopics(page, indent) {
  const lang = page.lang;
  const other = { en: 'Something else', ja: 'その他', zh: '其他' };
  const lines = data.apps.map((a) => `<option value="${esc(L(a.name, 'en'))}">${esc(L(a.name, lang))}</option>`);
  lines.push(`<option value="">${esc(other[lang])}</option>`);
  return indentAll(lines, indent);
}

const HELP_RE = /([ \t]*)<!-- site:help-topics -->[\s\S]*?<!-- \/site:help-topics -->/g;
const SECTIONS_RE = /([ \t]*)<!-- site:sections -->[\s\S]*?<!-- \/site:sections -->/g;
let changed = 0;

function update(file, next) {
  const path = join(siteDir, file);
  if (!existsSync(path)) fail(`${file} not found`);
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
    html = html.replace(CARDS_RE, (_, indent, catList, limit) => {
      found++;
      const cats = catList.split(',');
      for (const c of cats) if (!categories.get(c)) fail(`${page.file} has cards for unknown category "${c}"`);
      let entries = data.apps.filter((a) => cats.includes(a.category));
      if (limit) entries = entries.slice(0, Number(limit.split('=')[1]));
      const cards = entries.map((a) => card(a, page, indent));
      if (cats.length === 1 && !limit && categories.get(cats[0]).comingSoon) cards.push(soonCard(page, indent));
      return `${indent}<!-- apps:cards ${catList}${limit || ''} -->\n${cards.join('\n')}\n${indent}<!-- /apps:cards -->`;
    });
    html = html.replace(SECTIONS_RE, (_, indent) => {
      found++;
      return `${indent}<!-- site:sections -->\n${sectionCards(page, indent)}\n${indent}<!-- /site:sections -->`;
    });
    html = html.replace(HELP_RE, (_, indent) => {
      found++;
      return `${indent}<!-- site:help-topics -->\n${helpTopics(page, indent)}\n${indent}<!-- /site:help-topics -->`;
    });
    if (!found) fail(`${page.file} has no generated parts (apps:cards, apps:showcase, site:sections or site:help-topics markers)`);
    return html;
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
