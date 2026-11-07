# liferay-community-apac.github.io

The website for Liferay Community APAC: <https://liferay-community-apac.github.io/>.

## How the site fits together

| Part | Where | What it does |
| --- | --- | --- |
| Pages | `index.html`, `ja/`, `zh/`, `knowledge-base/` | The homepages in English, Japanese and Chinese, and the knowledge base. |
| Header, footer and search | `assets/site-chrome.js` | One shared header (menu, language switcher, search button) and footer, used by every page here and by every app's docs. Edit the menu or footer here once. |
| Styles | `assets/site.css` | The styles for the whole site, app docs included. |
| App list | `data/apps.json` | One entry per app. It drives the app cards on the homepages and the knowledge base, the site search across app docs, and the app docs' sitemaps in `robots.txt`. |
| App cards generator | `scripts/build-apps.mjs` | Writes the app cards and sitemap lines from `data/apps.json`. |
| Link checker | `scripts/check-links.mjs` | Fails the publish if a link or `#anchor` is broken. |
| Publishing | `.github/workflows/publish-site.yml` | The shared publishing workflow: build, link check, search index (Pagefind), publish. This site and every app's docs repository use it. |
| App docs template | `templates/app-docs/` | A starting point for an app's docs in its own repository. See its README. |

`scripts/`, `templates/` and this README aren't published.

## Add an app

1. Give the app docs in its own repository, starting from [`templates/app-docs`](templates/app-docs/README.md).
2. Add an entry for it to `data/apps.json`:

    ```json
    {
      "id": "my-app",
      "category": "marketplace-apps",
      "name": "My App",
      "summary": { "en": "…", "ja": "…", "zh": "…" },
      "version": "1.0.0",
      "dxp": "Liferay DXP 2026.Q1 LTS",
      "docsLanguages": ["en"],
      "image": { "src": "assets/kb/my-app.png", "width": 1600, "height": 1075 },
      "docs": "my-app/",
      "repo": "https://github.com/Liferay-Community-APAC/my-app",
      "marketplace": "https://marketplace.liferay.com/p/my-app",
      "search": "my-app/pagefind/",
      "sitemap": "my-app/sitemap.xml"
    }
    ```

    `image`, `marketplace`, `search` and `sitemap` are optional. Leave `search` and `sitemap` as `null`
    for an app whose docs are part of this site, such as Liferay Forums today.
3. Run `node scripts/build-apps.mjs` and commit the updated pages. (Publishing runs it too, so the live site always matches the list.)

## Preview locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. Search only works on the published site, where the search index is built.

## Publishing

Pushing to `main` publishes the site with GitHub Actions. In **Settings → Pages**, **Source** must be **GitHub Actions**.
