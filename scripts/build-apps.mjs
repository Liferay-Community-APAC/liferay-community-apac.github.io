#!/usr/bin/env node
/*
 * Turns the site's catalogue, data/apps.json, into the parts of the pages that list its entries
 * (Marketplace Apps, Solution Recipes, tutorials, sample code and tools), in English, Japanese, Chinese and Indonesian:
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
const LANGS = ['en', 'ja', 'zh', 'id'];
const SITE = 'https://liferay-community-apac.github.io/';
const HOME = { en: '', ja: 'ja/', zh: 'zh/', id: 'id/' };

// Pages with generated parts, and their language.
const PAGES = LANGS.flatMap((l) => [
  { file: `${HOME[l]}index.html`, lang: l },
  { file: `${HOME[l]}marketplace-apps/index.html`, lang: l },
  { file: `${HOME[l]}tutorials/index.html`, lang: l },
  { file: `${HOME[l]}community/index.html`, lang: l },
  { file: `${HOME[l]}get-help/index.html`, lang: l }
]);
const COMPACT_HIGHLIGHTS = 4;

const STRINGS = {
  en: { poweredBy: 'Powered by {name}. ', recipe: 'Read the recipe →', about: 'About {name}',
        more: 'Read the guide →', moreOther: 'Read the guide →', marketplace: 'Marketplace listing →',
        guide: 'Read the guide', guideOther: 'Read the guide', download: 'Download', details: 'All features and screenshots →',
        features: 'Features', screenshots: 'Screenshots', versions: 'Works with', version: 'Version',
        soonTag: 'Coming soon', soonTitle: 'More Marketplace Apps coming soon', soonText: 'More Marketplace Apps and their guides are on the way.' },
  ja: { poweredBy: '{name} を活用。', recipe: 'レシピを見る（英語）→', about: '{name} について',
        more: 'ガイドを読む →', moreOther: 'ガイドを読む（英語）→', marketplace: 'Marketplace で見る →',
        guide: 'ガイドを読む', guideOther: 'ガイドを読む（英語）', download: 'ダウンロード', details: 'すべての機能とスクリーンショット →',
        features: '機能', screenshots: 'スクリーンショット', versions: '対応製品', version: 'バージョン',
        soonTag: '近日公開', soonTitle: 'その他の Marketplace アプリも近日公開', soonText: '新しい Marketplace アプリとガイドを準備中です。' },
  zh: { poweredBy: '由 {name} 提供支持。', recipe: '查看实践指南（英文）→', about: '了解 {name}（英文）',
        more: '阅读指南 →', moreOther: '阅读指南（英文）→', marketplace: '在 Marketplace 查看 →',
        guide: '阅读指南', guideOther: '阅读指南（英文）', download: '下载', details: '全部功能与截图 →',
        features: '功能', screenshots: '截图', versions: '适用于', version: '版本',
        soonTag: '即将推出', soonTitle: '更多 Marketplace 应用即将推出', soonText: '更多 Marketplace 应用及其指南正在准备中。' },
  id: { poweredBy: 'Didukung oleh {name}. ', recipe: 'Baca recipe (bahasa Inggris) →', about: 'Tentang {name} (bahasa Inggris)',
        more: 'Baca panduan →', moreOther: 'Baca panduan (bahasa Inggris) →', marketplace: 'Lihat di Marketplace →',
        guide: 'Baca panduan', guideOther: 'Baca panduan (bahasa Inggris)', download: 'Unduh', details: 'Semua fitur dan screenshot →',
        features: 'Fitur', screenshots: 'Screenshot', versions: 'Untuk', version: 'Versi',
        soonTag: 'Segera hadir', soonTitle: 'Marketplace App lainnya segera hadir', soonText: 'Marketplace App lainnya beserta panduannya sedang disiapkan.' }
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
    title: { en: 'Marketplace Apps', ja: 'Marketplace アプリ', zh: 'Marketplace 应用', id: 'Marketplace App' },
    text: { en: 'Apps that add features to Liferay DXP, each with a full user guide.', ja: 'Liferay DXP に機能を追加するアプリと、そのユーザーガイド。', zh: '为 Liferay DXP 增加功能的应用及其用户指南。', id: 'Aplikasi yang menambahkan fitur ke Liferay DXP, masing-masing dengan panduan pengguna lengkap.' },
    count: { en: (n) => `${n} Marketplace App${n === 1 ? '' : 's'}`, ja: (n) => `${n} 件の Marketplace アプリ`, zh: (n) => `${n} 个 Marketplace 应用`, id: (n) => `${n} Marketplace App` } },
  { icon: 'recipes', href: () => 'solution-recipes/', categories: [],
    title: { en: 'Solution Recipes', ja: 'ソリューションレシピ', zh: '解决方案实践指南', id: 'Solution Recipes' },
    text: { en: 'Step-by-step recipes that combine Marketplace Apps, tutorials and DXP features into a complete use case.', ja: 'Marketplace アプリ、チュートリアル、DXP の機能を組み合わせてユースケースを実現するレシピ。', zh: '将 Marketplace 应用、教程和 DXP 功能组合成完整用例的分步指南。', id: 'Recipe langkah demi langkah yang menggabungkan Marketplace App, tutorial, dan fitur DXP menjadi use case yang lengkap.' },
    count: { en: () => 'Forums Assistant · Powered by Liferay AI Hub', ja: () => 'Forums Assistant · Liferay AI Hub を活用', zh: () => 'Forums Assistant · 由 Liferay AI Hub 提供支持', id: () => 'Forums Assistant · Didukung oleh Liferay AI Hub' } },
  { icon: 'tutorials', href: (l) => `${HOME[l]}tutorials/`, categories: ['tutorials', 'sample-code', 'tools'],
    title: { en: 'Tutorials & Tools', ja: 'チュートリアルとツール', zh: '教程与工具', id: 'Tutorial & Alat' },
    text: { en: 'Step-by-step tutorials, sample code and tools for implementation, upgrade and migration tasks.', ja: '実装、アップグレード、移行に役立つチュートリアル、サンプルコード、ツール。', zh: '用于实施、升级和迁移任务的分步教程、示例代码和工具。', id: 'Tutorial langkah demi langkah, kode contoh, dan alat untuk tugas implementasi, upgrade, dan migrasi.' },
    count: { en: (n) => `${n} tutorials, samples and tools`, ja: (n) => `${n} 件のチュートリアル、サンプル、ツール`, zh: (n) => `${n} 个教程、示例和工具`, id: (n) => `${n} tutorial, contoh, dan alat` } },
  { icon: 'community', href: (l) => `${HOME[l]}community/`, categories: [],
    title: { en: 'Community', ja: 'コミュニティ', zh: '社区', id: 'Komunitas' },
    text: { en: 'Local user groups, events and the wider Liferay community online.', ja: '地域のユーザーグループ、イベント、オンラインの Liferay コミュニティ。', zh: '各地用户组、活动以及全球 Liferay 在线社区。', id: 'Grup pengguna lokal, acara, dan komunitas Liferay global secara online.' },
    count: { en: () => 'India · Japan · Australia · Southeast Asia', ja: () => 'インド · 日本 · オーストラリア · 東南アジア', zh: () => '印度 · 日本 · 澳大利亚 · 东南亚', id: () => 'India · Jepang · Australia · Asia Tenggara' } }
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
  if (a.poweredBy) {
    const pb = a.poweredBy;
    if (!(pb.name && pb.logo && pb.url && pb.text)) fail(`${where}: poweredBy needs name, logo, url and text`);
    for (const l of LANGS) if (!pb.text[l]) fail(`${where}: poweredBy text needs "${l}"`);
    if (!isUrl(pb.logo) && !existsSync(join(siteDir, pb.logo))) fail(`${where}: poweredBy logo ${pb.logo} not found`);
  }
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
// An entry's docs in the page's language: translations live in a folder named after the language
// (my-app/ja/), listed in "docsLanguages". Otherwise the English docs.
function docsFor(a, lang) {
  return lang !== 'en' && (a.docsLanguages || []).includes(lang) && !isUrl(a.docs) ? a.docs.replace(/\/?$/, '/') + lang + '/' : a.docs;
}

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
    lines.push(`  <a class="more" href="${esc(href(docsFor(a, lang), page))}">${esc(more)}</a>`);
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

// A "Powered by" panel for a Liferay product that extends an app, such as Liferay AI Hub: its logo, what it adds,
// and links to the recipe that shows how and to the product's official page.
function poweredBy(pb, page, indent) {
  const t = STRINGS[page.lang], lang = page.lang, url = L(pb.url, lang), name = esc(pb.name);
  const links = [pb.recipe && `<a href="${esc(href(pb.recipe, page))}">${esc(t.recipe)}</a>`,
    `<a href="${esc(url)}">${t.about.replace('{name}', name)}</a>`].filter(Boolean).join(' · ');
  return indentAll(['<div class="showcase-powered">',
    `  <a href="${esc(url)}" tabindex="-1" aria-hidden="true"><img src="${esc(href(pb.logo, page))}" alt="" width="64" height="64" loading="lazy"></a>`,
    `  <p><strong>${t.poweredBy.replace('{name}', name).trim()}</strong>${/ $/.test(t.poweredBy) ? ' ' : ''}${esc(L(pb.text, lang))}<br>${links}</p>`, '</div>'], indent);
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
  if (a.image) lines.push(`  <a class="showcase-shot" href="${esc(href(docsFor(a, lang), page))}" tabindex="-1" aria-hidden="true">`,
    `    <img src="${esc(href(a.image.src, page))}" alt="" width="${a.image.width}" height="${a.image.height}" loading="lazy">`, '  </a>');
  lines.push('  <div class="showcase-body">', `    <span class="tag">${esc(cat.tag[lang])}</span>`, `    <h3>${esc(L(a.name, lang))}</h3>`);
  if (a.tagline) lines.push(`    <p class="showcase-tagline">${esc(a.tagline[lang])}</p>`);
  lines.push(`    <p>${esc(a.summary[lang])}</p>`);
  if (points.length && !full) lines.push('    <ul class="showcase-points">', ...points, '    </ul>');
  if (meta) lines.push(`    <p class="meta">${esc(full ? fullMeta : meta)}</p>`);
  lines.push('    <div class="btns">', `      <a class="btn" href="${esc(href(docsFor(a, lang), page))}">${esc(translated ? t.guide : t.guideOther)} →</a>`);
  if (a.download) lines.push(`      <a class="btn outline" href="${esc(a.download)}">${esc(t.download)}</a>`);
  if (a.marketplace) lines.push(`      <a class="btn outline" href="${esc(a.marketplace)}">${esc(t.marketplace.replace(/ →$/, ''))}</a>`);
  lines.push('    </div>');
  if (a.poweredBy) lines.push(poweredBy(a.poweredBy, page, '    '));
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
  const other = { en: 'Something else', ja: 'その他', zh: '其他', id: 'Lainnya' };
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
