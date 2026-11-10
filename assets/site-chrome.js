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
      homeLabel: 'Home', englishOnly: 'This page is only available in English.',
      home: '', brandName: 'Liferay Community APAC', navLabel: 'Main',
      nav: [['marketplace-apps', 'marketplace-apps/', 'Marketplace Apps'], ['solution-recipes', 'solution-recipes/', 'Solution Recipes'],
            ['tutorials', 'tutorials/', 'Tutorials & Tools'], ['community', 'community/', 'Community'],
            ['resources', 'resources/', 'Resources'], ['get-help', 'get-help/', 'Get help']],
      contact: 'Contact',
      langLabel: 'Language', menu: 'Menu', search: 'Search', searchTitle: 'Search the site', close: 'Close',
      searchUnavailable: 'Search becomes available once the site is published.',
      footerBrand: 'Liferay Community APAC', footerLabel: 'Footer', marketplace: 'Liferay Community on Liferay Marketplace', 
      footerLinks: [['https://www.liferay.com/', 'liferay.com'], ['https://learn.liferay.com/', 'Liferay Learn'],
                    ['https://github.com/Liferay-Community-APAC', 'GitHub']],
      disclaimer: 'Marketplace Apps, tutorials, sample code and guides on this site are unofficial and provided as-is. Use them at your own risk.'
    },
    ja: {
      homeLabel: 'ホーム', englishOnly: 'このページは英語のみで提供しています。',
      home: 'ja/', brandName: 'Liferay Community APAC', navLabel: 'メイン',
      nav: [['marketplace-apps', 'ja/marketplace-apps/', 'Marketplace アプリ'], ['solution-recipes', 'solution-recipes/', 'レシピ'],
            ['tutorials', 'ja/tutorials/', 'チュートリアル'], ['community', 'ja/community/', 'コミュニティ'],
            ['resources', 'ja/resources/', 'リソース'], ['get-help', 'ja/get-help/', 'サポート']],
      contact: 'お問い合わせ',
      langLabel: '言語', menu: 'メニュー', search: '検索', searchTitle: 'サイト内を検索', close: '閉じる',
      searchUnavailable: '検索はサイトの公開後に利用できます。',
      footerBrand: 'Liferay Community APAC', footerLabel: 'フッター', marketplace: 'Liferay Marketplace の Liferay Community', 
      footerLinks: [['https://www.liferay.co.jp/', 'liferay.co.jp'], ['https://learn.liferay.com/', 'Liferay Learn'],
                    ['https://github.com/Liferay-Community-APAC', 'GitHub']],
      disclaimer: '本サイトのアプリ、チュートリアル、サンプルコード、ガイドは非公式のものであり、現状のまま提供されます。ご利用は自己責任でお願いします。'
    },
    zh: {
      homeLabel: '首页', englishOnly: '本页面仅提供英文版。',
      home: 'zh/', brandName: 'Liferay Community APAC', navLabel: '主导航',
      nav: [['marketplace-apps', 'zh/marketplace-apps/', 'Marketplace 应用'], ['solution-recipes', 'solution-recipes/', '实践方案'],
            ['tutorials', 'zh/tutorials/', '教程与工具'], ['community', 'zh/community/', '社区'],
            ['resources', 'zh/resources/', '资源'], ['get-help', 'zh/get-help/', '获取帮助']],
      contact: '联系我们',
      langLabel: '语言', menu: '菜单', search: '搜索', searchTitle: '搜索本站', close: '关闭',
      searchUnavailable: '网站发布后即可使用搜索。',
      footerBrand: 'Liferay Community APAC', footerLabel: '页脚', marketplace: 'Liferay Marketplace 上的 Liferay Community', 
      footerLinks: [['https://www.liferay.com.cn/', 'liferay.com.cn'], ['https://learn.liferay.com/', 'Liferay Learn'],
                    ['https://github.com/Liferay-Community-APAC', 'GitHub']],
      disclaimer: '本网站上的应用、教程、示例代码和指南均为非官方内容，按“原样”提供，使用风险自负。'
    },
    id: {
      homeLabel: 'Beranda', englishOnly: 'Halaman ini hanya tersedia dalam bahasa Inggris.',
      home: 'id/', brandName: 'Liferay Community APAC', navLabel: 'Utama',
      nav: [['marketplace-apps', 'id/marketplace-apps/', 'Marketplace App'], ['solution-recipes', 'solution-recipes/', 'Solution Recipes'],
            ['tutorials', 'id/tutorials/', 'Tutorial & Alat'], ['community', 'id/community/', 'Komunitas'],
            ['resources', 'id/resources/', 'Sumber daya'], ['get-help', 'id/get-help/', 'Bantuan']],
      contact: 'Kontak',
      langLabel: 'Bahasa', menu: 'Menu', search: 'Cari', searchTitle: 'Cari di situs ini', close: 'Tutup',
      searchUnavailable: 'Pencarian tersedia setelah situs diterbitkan.',
      footerBrand: 'Liferay Community APAC', footerLabel: 'Footer', marketplace: 'Liferay Community di Liferay Marketplace',
      footerLinks: [['https://www.liferay.com/', 'liferay.com'], ['https://learn.liferay.com/', 'Liferay Learn'],
                    ['https://github.com/Liferay-Community-APAC', 'GitHub']],
      disclaimer: 'Marketplace App, tutorial, kode contoh, dan panduan di situs ini tidak resmi dan disediakan apa adanya. Gunakan dengan risiko Anda sendiri.'
    }
  };
  var MARKETPLACE = 'https://marketplace.liferay.com/e/publisher-details/29282497/30020268'; // Liferay's "Liferay Community" publisher page
  // [code, short label on the button, lang attribute, full name in the menu]
  var LANGS = [['en', 'EN', 'en', 'English'], ['ja', '日本語', 'ja', '日本語'], ['zh', '中文', 'zh-CN', '中文'], ['id', 'ID', 'id', 'Bahasa Indonesia']];
  var HREFLANG = { en: 'en', ja: 'ja', zh: 'zh-Hans', id: 'id' };
  var LANG_BY_HREFLANG = { en: 'en', ja: 'ja', 'zh-Hans': 'zh', id: 'id' };

  var htmlLang = (document.documentElement.lang || 'en').toLowerCase();
  var pageLang = htmlLang.indexOf('ja') === 0 ? 'ja' : htmlLang.indexOf('zh') === 0 ? 'zh' : htmlLang.indexOf('id') === 0 ? 'id' : 'en';

  // The visitor's language: remembered when they choose one in the language menu or open a page in
  // Japanese, Chinese or Indonesian. A page that has no version in that language (such as docs available
  // only in English) keeps the header, footer and breadcrumbs in it and says the page itself is in English.
  var STORE = 'lca-lang';
  function remembered() { try { return localStorage.getItem(STORE); } catch (e) { return null; } }
  function remember(code) { try { localStorage.setItem(STORE, code); } catch (e) { /* private mode */ } }
  var wanted = remembered();
  var fallback = !!(wanted && STRINGS[wanted] && wanted !== pageLang &&
    !document.querySelector('link[rel="alternate"][hreflang="' + { en: 'en', ja: 'ja', zh: 'zh-Hans', id: 'id' }[wanted] + '"]'));
  var lang = fallback ? wanted : pageLang;
  if (!fallback && (pageLang !== 'en' || !wanted)) remember(pageLang);
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
  var SECTION_PAGES = { 'marketplace-apps': 1, tutorials: 1, community: 1, 'get-help': 1, resources: 1 }; // sections with a page in every language

  // The same page in another language: the page's own <link rel="alternate" hreflang> if it has one,
  // otherwise that language's page for the same section (from an English-only page, such as an app's docs).
  function altHref(code) {
    if (fallback && code === pageLang) return location.href;
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
    var current = LANGS.filter(function (l) { return l[0] === lang; })[0];
    var langs = LANGS.map(function (l) {
      return l[0] === lang
        ? '<span aria-current="true">' + esc(l[3]) + '</span>'
        : '<a href="' + esc(altHref(l[0])) + '" hreflang="' + HREFLANG[l[0]] + '" lang="' + l[2] + '">' + esc(l[3]) + '</a>';
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
        '<div class="lang">' +
          '<button class="lang-btn" type="button" aria-expanded="false" aria-controls="site-langs" aria-label="' + esc(t.langLabel + ': ' + current[3]) + '">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>' +
            '<span>' + esc(current[1]) + '</span>' +
            '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>' +
          '<div class="lang-list" id="site-langs" hidden>' + langs + '</div>' +
        '</div>' +
      '</div>';
    el.querySelector('.search-btn').addEventListener('click', openSearch);

    // Language menu.
    var langBtn = el.querySelector('.lang-btn'), langList = el.querySelector('.lang-list');
    function setLangs(open) { langList.hidden = !open; langBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    langBtn.addEventListener('click', function (e) { e.stopPropagation(); setLangs(langList.hidden); });
    langList.addEventListener('click', function (e) { var a = e.target.closest('a[hreflang]'); if (a) remember(LANG_BY_HREFLANG[a.getAttribute('hreflang')]); });
    document.addEventListener('click', function (e) { if (!el.querySelector('.lang').contains(e.target)) setLangs(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !langList.hidden) { setLangs(false); langBtn.focus(); } });

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
    var links = '<a href="' + esc(homeUrl + 'get-help/') + '">' + esc(t.contact) + '</a>' +
      t.footerLinks.map(function (l) { return '<a href="' + esc(l[0]) + '">' + esc(l[1]) + '</a>'; }).join('');
    LANGS.forEach(function (l) {
      if (l[0] !== lang) links += '<a href="' + esc(altHref(l[0])) + '" hreflang="' + HREFLANG[l[0]] + '" lang="' + l[2] + '">' + (l[0] === 'en' ? 'English' : l[0] === 'id' ? 'Bahasa Indonesia' : esc(l[1])) + '</a>';
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
          // Indonesian is written in Latin script, so English-only docs can join its search too.
          var langs = a.docsLanguages || ['en'];
          return langs.indexOf(pageLang) !== -1 || (pageLang === 'id' && langs.indexOf('en') !== -1);
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

  // "Get help" form: opens a new topic in the Development category on Liferay Discuss, with the
  // question template (and the mentions in it) filled in. Without JavaScript the form still opens the
  // same new topic, just without the chosen topic filled in.
  function initHelpForms() {
    [].forEach.call(document.querySelectorAll('form[data-discuss-form]'), function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var about = form.elements.about.value;
        var title = form.elements.title.value.trim();
        if (about && title) title = about + ': ' + title;
        var body = form.elements.body.value.replace('**About:** ', '**About:** ' + (about || ''));
        var url = form.action + '?category=' + encodeURIComponent(form.elements.category.value) +
          '&body=' + encodeURIComponent(body) + (title ? '&title=' + encodeURIComponent(title) : '');
        window.open(url, '_blank', 'noopener');
      });
    });
  }

  // Docs breadcrumbs ("Home / Marketplace Apps / …") come from each docs site in English; point them at the
  // main site's pages in the visitor's language.
  function localizeCrumbs() {
    var crumbs = document.querySelector('.docs-crumbs');
    if (!crumbs) return;
    var code = LANGS.filter(function (l) { return l[0] === lang; })[0][2];
    var links = crumbs.querySelectorAll('a');
    if (links[0]) { links[0].href = homeUrl; links[0].textContent = t.homeLabel; links[0].setAttribute('lang', code); }
    var sec = pageSection();
    t.nav.forEach(function (item) {
      if (item[0] !== sec || item[0] === 'solution-recipes' || !links[1]) return;
      links[1].href = ROOT + item[1]; links[1].textContent = item[2]; links[1].setAttribute('lang', code);
    });
  }

  // On a page shown in the remembered language: the header and footer are marked with it, and a short
  // note says the page itself is in English.
  function noteEnglishOnly() {
    var code = LANGS.filter(function (l) { return l[0] === lang; })[0][2];
    [].forEach.call(document.querySelectorAll('[data-site-header], [data-site-footer]'), function (el) { el.setAttribute('lang', code); });
    var note = document.createElement('p');
    note.className = 'lang-note'; note.setAttribute('lang', code); note.textContent = t.englishOnly;
    var where = document.querySelector('.docs-main, main');
    if (where) where.insertBefore(note, where.firstChild);
  }

  function init() {
    initHelpForms();
    localizeCrumbs();
    if (fallback) noteEnglishOnly();
    var h = document.querySelector('[data-site-header]');
    var f = document.querySelector('[data-site-footer]');
    if (h) renderHeader(h);
    if (f) renderFooter(f);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
