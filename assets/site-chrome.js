/*
 * Shared header, footer and site search for Liferay Community APAC.
 *
 * Every page on the main site, and every app's docs site published from its
 * own repository under the same address, loads this one file:
 *
 *   <script src="/assets/site-chrome.js" defer></script>
 *
 * and marks where the header and footer go:
 *
 *   <header class="site-header" data-site-header>...fallback...</header>
 *   <footer class="site-footer" data-site-footer>...fallback...</footer>
 *
 * Apps with docs in their own repositories are added to the search from data/apps.json.
 * Edit the menu, footer or search here once and every page picks it up.
 * The site root is worked out from this script's own address, so the same
 * file works on the live site, under a preview folder, and locally.
 */
(function () {
  'use strict';

  var script = document.currentScript;
  var ROOT = new URL('../', script ? script.src : location.href).href; // the site root, ending in "/"
  var SITE = 'https://liferay-community-apac.github.io/'; // the live address

  // Apps whose docs are published from their own repositories list their search index in
  // data/apps.json ("search"); the site search merges those indexes with the main site's.
  function appIndexes() {
    return fetch(ROOT + 'data/apps.json').then(function (r) { return r.ok ? r.json() : { apps: [] }; })
      .then(function (d) { return (d.apps || []).filter(function (a) { return a.search; }); })
      .catch(function () { return []; });
  }

  var STRINGS = {
    en: {
      home: '', brandName: 'Liferay Community APAC', navLabel: 'Main',
      nav: [['marketplace-apps', 'marketplace-apps/', 'Marketplace Apps'], ['solution-recipes', 'solution-recipes/', 'Solution Recipes'],
            ['tutorials', 'tutorials/', 'Tutorials & Tools'], ['community', 'community/', 'Community']],
      contact: 'Contact',
      langLabel: 'Language', menu: 'Menu', search: 'Search', searchTitle: 'Search the site', close: 'Close',
      searchUnavailable: 'Search becomes available once the site is published.',
      footerBrand: 'Liferay Community APAC', footerLabel: 'Footer', marketplace: 'Liferay Community on Liferay Marketplace', 
      footerLinks: [['https://www.liferay.com/', 'liferay.com'], ['https://learn.liferay.com/', 'Liferay Learn'],
                    ['https://github.com/Liferay-Community-APAC', 'GitHub']],
      disclaimer: 'Marketplace Apps, tutorials, sample code and guides on this site are unofficial and provided as-is. Use them at your own risk.'
    },
    ja: {
      home: 'ja/', brandName: 'Liferay Community APAC', navLabel: 'メイン',
      nav: [['marketplace-apps', 'ja/marketplace-apps/', 'Marketplace アプリ'], ['solution-recipes', 'solution-recipes/', 'レシピ'],
            ['tutorials', 'ja/tutorials/', 'チュートリアル'], ['community', 'ja/community/', 'コミュニティ']],
      contact: 'お問い合わせ',
      langLabel: '言語', menu: 'メニュー', search: '検索', searchTitle: 'サイト内を検索', close: '閉じる',
      searchUnavailable: '検索はサイトの公開後に利用できます。',
      footerBrand: 'Liferay Community APAC', footerLabel: 'フッター', marketplace: 'Liferay Marketplace の Liferay Community', 
      footerLinks: [['https://www.liferay.co.jp/', 'liferay.co.jp'], ['https://learn.liferay.com/', 'Liferay Learn'],
                    ['https://github.com/Liferay-Community-APAC', 'GitHub']],
      disclaimer: '本サイトのアプリ、チュートリアル、サンプルコード、ガイドは非公式のものであり、現状のまま提供されます。ご利用は自己責任でお願いします。'
    },
    zh: {
      home: 'zh/', brandName: 'Liferay Community APAC', navLabel: '主导航',
      nav: [['marketplace-apps', 'zh/marketplace-apps/', 'Marketplace 应用'], ['solution-recipes', 'solution-recipes/', '实践方案'],
            ['tutorials', 'zh/tutorials/', '教程与工具'], ['community', 'zh/community/', '社区']],
      contact: '联系我们',
      langLabel: '语言', menu: '菜单', search: '搜索', searchTitle: '搜索本站', close: '关闭',
      searchUnavailable: '网站发布后即可使用搜索。',
      footerBrand: 'Liferay Community APAC', footerLabel: '页脚', marketplace: 'Liferay Marketplace 上的 Liferay Community', 
      footerLinks: [['https://www.liferay.com.cn/', 'liferay.com.cn'], ['https://learn.liferay.com/', 'Liferay Learn'],
                    ['https://github.com/Liferay-Community-APAC', 'GitHub']],
      disclaimer: '本网站上的应用、教程、示例代码和指南均为非官方内容，按“原样”提供，使用风险自负。'
    }
  };
  var MARKETPLACE = 'https://marketplace.liferay.com/e/publisher-details/29282497/30020268'; // Liferay's "Liferay Community" publisher page
  var LANGS = [['en', 'EN', 'en'], ['ja', '日本語', 'ja'], ['zh', '中文', 'zh-CN']];
  var HREFLANG = { en: 'en', ja: 'ja', zh: 'zh-Hans' };

  var htmlLang = (document.documentElement.lang || 'en').toLowerCase();
  var lang = htmlLang.indexOf('ja') === 0 ? 'ja' : htmlLang.indexOf('zh') === 0 ? 'zh' : 'en';
  var t = STRINGS[lang];
  var homeUrl = ROOT + t.home;
  var here = location.href.split('#')[0];

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  // The site's section this page belongs to: <body data-section="…">. App docs published before
  // sections existed mark <body data-kb-page>; they belong to Marketplace Apps, or to Solution Recipes.
  function pageSection() {
    var b = document.body;
    if (b.getAttribute('data-section')) return b.getAttribute('data-section');
    if (b.hasAttribute('data-kb-page')) return location.pathname.indexOf('/solution-recipes/') !== -1 ? 'solution-recipes' : 'marketplace-apps';
    return '';
  }
  var SECTION_PAGES = { 'marketplace-apps': 1, tutorials: 1, community: 1 }; // sections with a page in every language

  // The same page in another language: the page's own <link rel="alternate" hreflang> if it has one,
  // otherwise that language's page for the same section (from an English-only page, such as an app's docs).
  function altHref(code) {
    var link = document.querySelector('link[rel="alternate"][hreflang="' + HREFLANG[code] + '"]');
    if (link) {
      // hreflang links name the live address; keep visitors on whichever copy they're viewing (preview, local).
      var href = new URL(link.getAttribute('href'), location.href).href;
      return href.indexOf(SITE) === 0 ? ROOT + href.slice(SITE.length) : href;
    }
    // An English-only page, such as an app's docs: that language's page for the same section, or its homepage.
    var sec = pageSection();
    return ROOT + STRINGS[code].home + (SECTION_PAGES[sec] ? sec + '/' : '');
  }

  function renderHeader(el) {
    var sec = pageSection();
    var nav = t.nav.map(function (item) {
      var href = ROOT + item[1];
      var current = item[0] === sec || here.indexOf(href) === 0;
      return '<a href="' + esc(href) + '"' + (current ? ' aria-current="page"' : '') + '>' + esc(item[2]) + '</a>';
    }).join('');
    var langs = LANGS.map(function (l) {
      return l[0] === lang
        ? '<span aria-current="true">' + esc(l[1]) + '</span>'
        : '<a href="' + esc(altHref(l[0])) + '" hreflang="' + HREFLANG[l[0]] + '" lang="' + l[2] + '">' + esc(l[1]) + '</a>';
    }).join('');
    el.innerHTML =
      '<div class="wrap">' +
        '<a class="brand" href="' + esc(homeUrl) + '"><img class="brand-mark" src="' + ROOT + 'assets/liferay-mark-white.png" alt="" width="30" height="30"><span class="brand-name">' + esc(t.brandName) + '</span></a>' +
        '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>' +
          '<span class="visually-hidden">' + esc(t.menu) + '</span></button>' +
        '<nav class="nav" id="site-nav" aria-label="' + esc(t.navLabel) + '">' + nav + '</nav>' +
        '<button class="search-btn" type="button" aria-haspopup="dialog" aria-keyshortcuts="/ Control+K Meta+K">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
          '<span>' + esc(t.search) + '</span></button>' +
        '<div class="lang" aria-label="' + esc(t.langLabel) + '">' + langs + '</div>' +
      '</div>';
    el.querySelector('.search-btn').addEventListener('click', openSearch);

    // Phone menu: below 720px the menu links fold into a panel behind the menu button.
    var btn = el.querySelector('.menu-btn');
    function setMenu(open) {
      el.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function () { setMenu(!el.classList.contains('menu-open')); });
    el.querySelector('.nav').addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && el.classList.contains('menu-open')) { setMenu(false); btn.focus(); }
    });
    document.addEventListener('click', function (e) { if (!el.contains(e.target)) setMenu(false); });
  }

  function renderFooter(el) {
    var links = '<a href="' + esc(homeUrl + '#contact') + '">' + esc(t.contact) + '</a>' + t.footerLinks.map(function (l) { return '<a href="' + esc(l[0]) + '">' + esc(l[1]) + '</a>'; }).join('');
    LANGS.forEach(function (l) {
      if (l[0] !== lang) links += '<a href="' + esc(altHref(l[0])) + '" hreflang="' + HREFLANG[l[0]] + '" lang="' + l[2] + '">' + (l[0] === 'en' ? 'English' : esc(l[1])) + '</a>';
    });
    // A page can add its own line, such as a licence, with <p data-footer-note>…</p> inside the footer.
    var note = el.querySelector('[data-footer-note]');
    el.innerHTML =
      '<div class="wrap">' +
        '<div class="footer-brand"><picture>' +
          '<source media="(prefers-color-scheme: dark)" srcset="' + ROOT + 'assets/liferay-logo-reversed.png">' +
          '<img src="' + ROOT + 'assets/liferay-logo-color.png" alt="Liferay" width="116" height="32"></picture>' +
          '<span>' + esc(t.footerBrand) + '</span></div>' +
        '<nav aria-label="' + esc(t.footerLabel) + '">' + links + '</nav>' +
      '</div>' +
      (note ? '<p class="wrap disclaimer">' + note.innerHTML + '</p>' : '') +
      '<p class="wrap disclaimer">' + esc(t.disclaimer) + ' <a href="' + MARKETPLACE + '">' + esc(t.marketplace) + '</a></p>';
  }

  // ---------- Search (Pagefind) ----------
  var dialog, searchReady = false;

  function loadAsset(tag, attrs) {
    return new Promise(function (resolve, reject) {
      var node = document.createElement(tag);
      for (var k in attrs) node.setAttribute(k, attrs[k]);
      node.onload = resolve; node.onerror = reject;
      document.head.appendChild(node);
    });
  }

  function buildDialog() {
    dialog = document.createElement('dialog');
    dialog.className = 'search-dialog';
    dialog.setAttribute('aria-label', t.searchTitle);
    dialog.innerHTML =
      '<div class="search-head"><strong>' + esc(t.searchTitle) + '</strong>' +
      '<button type="button" class="search-close" aria-label="' + esc(t.close) + '">×</button></div>' +
      '<div id="site-search"></div>';
    dialog.querySelector('.search-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    document.body.appendChild(dialog);
  }

  function startSearch() {
    var base = ROOT + 'pagefind/';
    var apps = [];
    return Promise.all([
      loadAsset('link', { rel: 'stylesheet', href: base + 'pagefind-ui.css' }),
      loadAsset('script', { src: base + 'pagefind-ui.js' }),
      appIndexes().then(function (list) { apps = list; })
    ]).then(function () {
      /* global PagefindUI */
      new PagefindUI({
        element: '#site-search',
        bundlePath: base,
        showSubResults: true,
        showImages: false,
        resetStyles: false,
        autofocus: true,
        // Merge each app's own index when its docs are in the page's language. Pagefind fails when a search
        // in Japanese or Chinese characters reaches an index built in another language, so an app with
        // English-only docs appears in English search; list more languages in data/apps.json "docsLanguages".
        mergeIndex: apps.filter(function (a) {
          return (a.docsLanguages || ['en']).indexOf(lang) !== -1;
        }).map(function (a) {
          return { bundlePath: ROOT + a.search, mergeFilter: { app: typeof a.name === 'object' ? a.name[lang] || a.name.en : a.name } };
        })
      });
      searchReady = true;
    }).catch(function () {
      dialog.querySelector('#site-search').innerHTML = '<p class="search-note">' + esc(t.searchUnavailable) + '</p>';
    });
  }

  function openSearch() {
    if (!dialog) buildDialog();
    if (!dialog.open) dialog.showModal();
    if (!searchReady && !dialog.dataset.started) { dialog.dataset.started = '1'; startSearch(); }
    var input = dialog.querySelector('input');
    if (input) input.focus();
  }

  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
      e.preventDefault(); openSearch();
    }
  });

  function init() {
    var h = document.querySelector('[data-site-header]');
    var f = document.querySelector('[data-site-footer]');
    if (h) renderHeader(h);
    if (f) renderFooter(f);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
