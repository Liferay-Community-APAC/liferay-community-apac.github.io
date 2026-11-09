# liferay-community-apac.github.io

The website for Liferay Community APAC: <https://liferay-community-apac.github.io/>.

## How the site fits together

| Part | Where | What it does |
| --- | --- | --- |
| Pages | `index.html`, `marketplace-apps/`, `tutorials/`, `community/`, and the same under `ja/` and `zh/` | The homepages and section pages in English, Japanese and Chinese. `knowledge-base/` forwards old links to `marketplace-apps/`. Solution Recipes are published from their own repository. |
| Header, footer and search | `assets/site-chrome.js` | One shared header (menu, language switcher, search button) and footer, used by every page here and by every app's docs. Edit the menu or footer here once. |
| Styles | `assets/site.css` | The styles for the whole site, app docs included. |
| App list | `data/apps.json` | One entry per app. It drives the cards and showcases on the homepages, the Marketplace Apps and Tutorials & Tools pages, and the section counts, the site search across app docs, and the app docs' sitemaps in `robots.txt`. |
| App cards generator | `scripts/build-apps.mjs` | Writes the app cards and sitemap lines from `data/apps.json`. |
| Link checker | `scripts/check-links.mjs` | Fails the publish if a link or `#anchor` is broken. |
| Publishing | `.github/workflows/publish-site.yml` | The shared publishing workflow: build, link check, search index (Pagefind), publish. This site and every app's docs repository use it. |

`scripts/` and this README aren't published. App docs live in their own repositories, started from the [app docs template](https://github.com/Liferay-Community-APAC/app-docs-template), such as [liferay-forums](https://github.com/Liferay-Community-APAC/liferay-forums).

## Add an app

1. Give the app docs in its own repository, created from the [app docs template](https://github.com/Liferay-Community-APAC/app-docs-template) (**Use this template**).
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
      "sitemap": "my-app/sitemap.xml",
      "docsRepo": "https://github.com/Liferay-Community-APAC/my-app"
    }
    ```

    `image`, `marketplace`, `search`, `sitemap` and `docsRepo` are optional. An app can also have a `logo`
    (`{ "src": "assets/apps/my-app/logo.png", "width": 64, "height": 64 }`), shown at 32px next to its name
    in its showcase: half the size of a **Powered by** logo. Use a 64px PNG so it stays sharp on high-density screens.
    Leave `search` and `sitemap` as
    `null` for an app whose docs are part of this site rather than published from their own repository.

    To feature a Liferay product that extends the app, such as Liferay AI Hub, add `poweredBy`. The app's showcase
    then shows a **Powered by** panel with the product's logo, the `text`, and links to the recipe and the product's
    official page. For several recipes, use `recipes` instead of `recipe`: a list of `{ "title": "…", "path": "…" }`,
    each linked by its title. `url` can be one address or one per language; languages without one use `en`.

    ```json
    "poweredBy": {
      "name": "Liferay AI Hub",
      "logo": "assets/products/ai-hub.png",
      "url": { "en": "https://www.liferay.com/capabilities/ai-hub", "ja": "https://www.liferay.co.jp/capabilities/ai-hub" },
      "text": { "en": "…", "ja": "…", "zh": "…", "id": "…" },
      "recipe": "solution-recipes/forums-ai-assistant/"
    }
    ```
3. Run `node scripts/build-apps.mjs` and commit the updated pages. (Publishing runs it too, so the live site always matches the list.)

## Preview locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. Search only works on the published site, where the search index is built.

## Publishing

Pushing to `main` publishes the site with GitHub Actions. In **Settings → Pages**, **Source** must be **GitHub Actions**.
