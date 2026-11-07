# App docs template

A starting point for an app's documentation, published from the app's own repository at
`https://liferay-community-apac.github.io/<repository-name>/`. The docs share the main site's
header, footer, styles and search, so readers move between the site and every app's docs as if
it were one site.

## What's here

| Path | What it is |
| --- | --- |
| `docs/_config.yml` | The docs' settings: the app's name, description, address and licence line. |
| `docs/_layouts/default.html` | The page layout: sidebar, breadcrumbs, previous and next links, and the shared header, footer and search. Don't edit it in an app's repository; improve it here instead. |
| `docs/index.md`, `docs/guide/` | Example pages. Replace them with the app's docs. |
| `.github/workflows/pages.yml` | Publishes the docs with the shared workflow whenever `docs/` changes on `main`. |

## Add docs to an app

1. **Copy this folder's contents into the app's repository**: `docs/` and `.github/workflows/pages.yml`. If the repository already has a `.github/workflows/pages.yml`, merge the two.
2. **Edit the four marked lines in `docs/_config.yml`**: `app_name`, `description`, `baseurl` (`/` and the repository's name) and `footer_note`.
3. **Write the docs in Markdown** in `docs/`. Each page starts with front matter:

    ```yaml
    ---
    title: Installing        # the page's name in the sidebar
    parent: Guide            # the section it belongs to (leave out for a section or top page)
    nav_order: 1             # its position, lower first
    ---
    ```

    Pages can use a table of contents (`1. TOC` then `{:toc}` on the next line), callouts
    (`{: .note }`, `{: .tip }`, `{: .important }` or `{: .warning }` on the line before a paragraph),
    and screenshots (`{: .screenshot }` after an image).
4. **Turn on publishing**: in the repository's **Settings → Pages**, set **Source** to **GitHub Actions**. The repository must be public.
5. **Add the app to the main site**: add an entry to `data/apps.json` in
   [liferay-community-apac.github.io](https://github.com/Liferay-Community-APAC/liferay-community-apac.github.io),
   with `"docs": "<repository-name>/"`, `"search": "<repository-name>/pagefind/"` and
   `"sitemap": "<repository-name>/sitemap.xml"`. That adds its card to the homepages and the knowledge base,
   includes its pages in the site search, and tells search engines about its sitemap.

## Preview locally

The docs load the header, footer and styles from the main site. To preview them on their own,
set `main_site: https://liferay-community-apac.github.io` in `docs/_config.yml` (don't commit it), then:

```bash
cd docs && jekyll serve --baseurl /my-app
```

Search only works on the published site, where the search index is built.
