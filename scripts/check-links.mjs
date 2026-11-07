#!/usr/bin/env node
/*
 * Checks that every link, image and #anchor in a built site points to something that exists.
 *
 * Usage: node scripts/check-links.mjs <built-site-dir> [--base /path/]
 *   --base  the path the site is published under: "/" for the main site (default),
 *           "/my-app/" for an app's docs site published from its own repository.
 *
 * Links outside the site being checked are skipped: other websites, and root-relative links
 * outside --base, such as an app's docs linking to the main site's /assets/. On the main site,
 * links into an app's docs that are published from the app's own repository (listed in
 * data/apps.json but not part of this build) are skipped too.
 * No dependencies beyond Node.js 18 or later.
 */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';

const args = process.argv.slice(2);
const bi = args.indexOf('--base');
const base = (bi >= 0 ? args[bi + 1] || '/' : '/').replace(/\/?$/, '/');
const dir = args.find((a, i) => !a.startsWith('--') && !(bi >= 0 && i === bi + 1));
if (!dir) { console.error('usage: check-links.mjs <built-site-dir> [--base /path/]'); process.exit(2); }

// App docs published elsewhere (main site only).
const elsewhere = [];
const appsFile = join(dir, 'data/apps.json');
if (existsSync(appsFile)) {
  for (const a of JSON.parse(readFileSync(appsFile, 'utf8')).apps || []) {
    if (a.docs && !/^https?:/.test(a.docs) && !existsSync(join(dir, a.docs))) elsewhere.push('/' + a.docs.replace(/^\//, ''));
  }
}

function walk(d, out = []) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'pagefind' && !e.name.startsWith('.')) walk(p, out); }
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const pages = walk(dir);
const idCache = new Map();
function idsOf(file) {
  if (!idCache.has(file)) {
    const html = readFileSync(file, 'utf8');
    idCache.set(file, new Set([...html.matchAll(/\s(?:id|name)="([^"]+)"/g)].map((m) => m[1])));
  }
  return idCache.get(file);
}

function resolve(fromFile, ref) {
  const [pathAndQuery, frag = ''] = ref.split('#');
  const path = decodeURI(pathAndQuery.split('?')[0]);
  let target;
  if (!path) target = fromFile;
  else if (path.startsWith('/')) {
    if (!path.startsWith(base)) return { skip: true };
    if (elsewhere.some((p) => path.startsWith(p))) return { skip: true };
    target = join(dir, path.slice(base.length));
  } else {
    target = join(dirname(fromFile), path);
    const sitePath = '/' + relative(dir, target).split(sep).join('/');
    if (elsewhere.some((p) => (sitePath + '/').startsWith(p))) return { skip: true };
    if (relative(dir, target).startsWith('..')) return { skip: true }; // above this site: another site on the same host
  }
  if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
  return { target, frag };
}

let problems = 0;
for (const page of pages) {
  const html = readFileSync(page, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<pre[\s\S]*?<\/pre>/g, '');
  for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
    const ref = m[1].replace(/&amp;/g, '&');
    if (!ref || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(ref)) continue;
    if (/\{\{|\{%/.test(ref)) continue; // an unbuilt template placeholder, such as {{ page.url }}
    const r = resolve(page, ref);
    if (r.skip) continue;
    const from = relative(dir, page);
    if (!existsSync(r.target)) { console.error(`missing  ${from} -> ${ref}`); problems++; continue; }
    if (r.frag && r.target.endsWith('.html') && !idsOf(r.target).has(decodeURIComponent(r.frag))) {
      console.error(`anchor   ${from} -> ${ref}`); problems++;
    }
  }
}
console.log(`checked ${pages.length} pages: ${problems ? problems + ' broken link(s)' : 'no broken links'}`);
process.exit(problems ? 1 : 0);
