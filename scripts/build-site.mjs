#!/usr/bin/env node
/**
 * Static site builder for cctweaked4tfgm.
 *
 * The site deliberately mirrors the structure and typography of tweaked.cc
 * (illuaminate's documentation layout): a fixed left navigation, a search box
 * above the content, plain semantic HTML and no client-side framework.
 *
 * Usage: node scripts/build-site.mjs [--serve]
 */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createComponents } from './site/components.mjs';
import { createMarkdown, escapeAttr, escapeHtml, parseFrontmatter } from './site/markdown.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const SITE = join(ROOT, 'site');
const OUT = join(ROOT, 'dist');
const BASE = '/cctweaked4tfgm/';

const LOCALES = {
  en_us: { prefix: '', lang: 'en-US', label: 'English', other: 'zh_cn' },
  zh_cn: { prefix: 'zh_cn', lang: 'zh-CN', label: '简体中文', other: 'en_us' },
};

const IGNORED_DIRS = new Set(['public', 'data', 'node_modules']);

const navCopy = {
  en_us: {
    contents: 'Contents',
    overview: 'Overview',
    site: 'Site',
    upstream: 'Upstream',
    language: 'Language',
    search: 'Search...',
    edit: 'Edit this page on GitHub',
    license: 'Content derived from CC: Tweaked (MPL-2.0) and Modpack-Modern. See NOTICE.',
    empty: 'No results.',
    recipes: 'Recipes',
    quests: 'Quests',
    api: 'Lua API',
    guide: 'Guide',
  },
  zh_cn: {
    contents: '本页目录',
    overview: '概览',
    site: '站点',
    upstream: '上游',
    language: '语言',
    search: '搜索…',
    edit: '在 GitHub 上编辑此页',
    license: '内容来自 CC: Tweaked（MPL-2.0）与 Modpack-Modern，详见 NOTICE。',
    empty: '没有结果。',
    recipes: '配方',
    quests: '任务',
    api: 'Lua 接口',
    guide: '指南',
  },
};

const tag = JSON.parse(readFileSync(join(DOCS, 'data/latest.json'), 'utf8')).tag;
const data = {
  tag,
  meta: readJson(`data/tfgm/${tag}/meta.json`),
  recipes: readJson(`data/tfgm/${tag}/recipes.json`),
  turtleUpgrades: readJson(`data/tfgm/${tag}/turtle-upgrades.json`),
  quests: readJson(`data/tfgm/${tag}/quests.json`),
  config: readJson(`data/tfgm/${tag}/config.json`),
  lang: readJson(`data/tfgm/${tag}/lang.json`),
  labels: readJson(`data/tfgm/${tag}/labels.json`),
  ccIndex: readJson('data/cc-index.json'),
};
const emiMap = existsSync(join(DOCS, 'data/emi-map.json')) ? readJson('data/emi-map.json') : null;

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(DOCS, relativePath), 'utf8'));
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name) && dir !== DOCS) continue;
      if (dir === DOCS && (entry.name === 'zh_cn' || IGNORED_DIRS.has(entry.name))) continue;
      walk(path, out);
    } else if (entry.name.endsWith('.md')) {
      out.push(path);
    }
  }
  return out;
}

function pageUrl(locale, sourcePath) {
  const root = locale === 'en_us' ? DOCS : join(DOCS, locale);
  let rel = relative(root, sourcePath).split(sep).join('/');
  rel = rel.replace(/index\.md$/, '').replace(/\.md$/, '/');
  const prefix = LOCALES[locale].prefix;
  const joined = [prefix, rel].filter(Boolean).join('/');
  if (!joined) return '/';
  return `/${joined}${joined.endsWith('/') ? '' : '/'}`;
}

function urlToFile(url) {
  const path = url.replace(/^\//, '');
  if (path === '' || path.endsWith('/')) return join(OUT, path, 'index.html');
  return join(OUT, path);
}

function buildPages() {
  const pages = new Map();
  for (const [locale, config] of Object.entries(LOCALES)) {
    const root = locale === 'en_us' ? DOCS : join(DOCS, locale);
    for (const sourcePath of walk(root)) {
      const source = readFileSync(sourcePath, 'utf8');
      const { meta } = parseFrontmatter(source);
      const url = pageUrl(locale, sourcePath);
      const h1 = /^#\s+(.+)$/m.exec(source.replace(/^---[\s\S]*?---\r?\n/, ''));
      pages.set(url, {
        locale,
        url,
        sourcePath,
        rel: relative(root, sourcePath).split(sep).join('/'),
        meta,
        title: String(meta.title || h1?.[1] || config.label),
        order: Number(meta.order) || 99,
        output: urlToFile(url),
      });
    }
  }
  return pages;
}

const pages = buildPages();

function localePages(locale) {
  return [...pages.values()].filter((page) => page.locale === locale);
}

function groupPages(locale) {
  const groups = [];
  const prefix = LOCALES[locale].prefix;
  for (const page of localePages(locale)) {
    const segments = page.rel.split('/');
    if (segments.length === 1) continue;
    const group = segments[0];
    let entry = groups.find((item) => item.id === group);
    if (!entry) {
      entry = { id: group, pages: [], order: 99 };
      groups.push(entry);
    }
    entry.pages.push(page);
  }
  for (const group of groups) {
    group.pages.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
    const index = group.pages.find((page) => page.rel === `${group.id}/index.md`);
    group.index = index;
    group.title = index?.title || group.id;
    group.order = index?.order ?? 99;
    group.url = `/${[prefix, group.id].filter(Boolean).join('/')}/`;
  }
  return groups.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

function assetVersion(file) {
  return createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 8);
}

const cssVersion = assetVersion(join(SITE, 'main.css'));
const jsVersion = assetVersion(join(SITE, 'app.js'));

function renderNav(page) {
  const locale = page.locale;
  const copy = navCopy[locale];
  const prefix = LOCALES[locale].prefix;
  const homepage = `/${prefix}`.replace(/\/+$/, '') || '/';
  const groups = groupPages(locale);
  const toc = page.toc?.filter((heading) => heading.level >= 2 && heading.level <= 3) || [];

  const tocBlock = toc.length
    ? `<h2 tabindex="0">${copy.contents}</h2><ul>${toc
        .map(
          (heading) =>
            `<li><a href="#${escapeAttr(heading.id)}" class="sidebar-link${
              heading.level === 3 ? ' sidebar-link--sub' : ''
            }">${heading.title}</a></li>`,
        )
        .join('')}</ul>`
    : '';

  const siteGroups = groups
    .map((group) => {
      const items = [];
      if (group.index) {
        items.push(
          `<li><a href="${BASE}${group.url.replace(/^\//, '')}" class="sidebar-link${
            page.url === group.url ? ' selected' : ''
          }">${copy.overview}</a></li>`,
        );
      }
      for (const child of group.pages) {
        if (child === group.index) continue;
        items.push(
          `<li><a href="${BASE}${child.url.replace(/^\//, '')}" class="sidebar-link${
            page.url === child.url ? ' selected' : ''
          }">${escapeHtml(child.title)}</a></li>`,
        );
      }
      return `<h2 tabindex="0">${escapeHtml(group.title)}</h2><ul>${items.join('')}</ul>`;
    })
    .join('');

  const upstream = [
    ['CC: Tweaked', 'https://tweaked.cc/'],
    ['Modpack-Modern', 'https://github.com/TerraFirmaGreg-Team/Modpack-Modern'],
    ['Core-Modern', 'https://github.com/TerraFirmaGreg-Team/Core-Modern'],
    ['RecipeBook-Modern', 'https://github.com/TerraFirmaGreg-Team/RecipeBook-Modern'],
    ['QuestBook-Modern', 'https://github.com/TerraFirmaGreg-Team/QuestBook-Modern'],
    ['Field-Guide-Modern', 'https://github.com/TerraFirmaGreg-Team/Field-Guide-Modern'],
    ['TFG Wiki', 'https://wiki.terrafirmagreg.team/'],
  ]
    .map(
      ([label, href]) =>
        `<li><a href="${href}" class="sidebar-link" target="_blank" rel="noreferrer">${escapeHtml(label)}</a></li>`,
    )
    .join('');

  const other = LOCALES[LOCALES[locale].other];
  const otherPage = [...pages.values()].find(
    (candidate) => candidate.locale === LOCALES[locale].other && candidate.rel === page.rel,
  );
  const switchHref = `${BASE}${(otherPage?.url || `/${other.prefix}/`).replace(/^\//, '')}`;

  return `<nav id="nav">
  <button id="nav-reveal" type="button" aria-label="${copy.site}">☰</button>
  <h1><a href="${BASE}${homepage.replace(/^\//, '')}"><img src="${BASE}logo.png" alt="CC: Tweaked for TerraFirmaGreg" /></a></h1>
  <div class="nav-links">
    ${tocBlock}
    ${siteGroups}
    <h2 tabindex="0">${copy.upstream}</h2>
    <ul>${upstream}</ul>
    <h2 tabindex="0">${copy.language}</h2>
    <ul><li><a href="${switchHref}" class="sidebar-link">${escapeHtml(other.label)}</a></li></ul>
  </div>
</nav>`;
}

function absolutize(html, locale) {
  return html.replace(/\b(href|src)="\/(?!\/)([^"]*)"/g, (match, attr, path) => {
    if (path.startsWith('cctweaked4tfgm/')) return match;
    let value = path;
    if (locale === 'zh_cn' && !value.startsWith('zh_cn/') && !value.startsWith('cctweaked4tfgm/')) {
      value = `zh_cn/${value}`;
    }
    if (!/\.[a-z0-9]+$/i.test(value) && !value.endsWith('/') && !value.includes('#')) value = `${value}/`;
    return `${attr}="/cctweaked4tfgm/${value}"`;
  });
}

function renderLayout(page, content) {
  const locale = page.locale;
  const copy = navCopy[locale];
  const description =
    locale === 'zh_cn'
      ? '群峦格雷现代版实际使用的 CC: Tweaked：版本锁定的配方、海龟升级、任务映射与 Lua 接口索引。'
      : 'The CC: Tweaked that TerraFirmaGreg Modern actually ships: versioned recipes, turtle upgrades, quest mapping and the Lua API index.';
  const siteName = locale === 'zh_cn' ? '群峦格雷 CC: Tweaked' : 'CC: Tweaked for TerraFirmaGreg';
  const title = page.title === siteName ? escapeHtml(page.title) : `${escapeHtml(page.title)} · ${siteName}`;

  return `<!doctype html>
<html lang="${LOCALES[locale].lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${escapeAttr(description)}" />
<meta name="theme-color" content="#ff0e0b" />
<meta name="illuaminate:index" content="${BASE}${LOCALES[locale].prefix ? `${LOCALES[locale].prefix}/` : ''}index.json" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${escapeAttr(description)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${locale === 'zh_cn' ? '群峦格雷 CC: Tweaked' : 'CC: Tweaked for TerraFirmaGreg'}" />
<link rel="icon" type="image/png" href="${BASE}favicon.png" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/emi-recipe-renderer@0.6.6/dist/emi.min.css" crossorigin="anonymous" />
<link rel="stylesheet" href="${BASE}main.css?v=${cssVersion}" />
<script defer src="https://cdn.jsdelivr.net/npm/emi-recipe-renderer@0.6.6/dist/emi.min.js" crossorigin="anonymous"></script>
<script defer src="${BASE}app.js?v=${jsVersion}"></script>
</head>
<body data-emi-root="${BASE}data/emi/" data-emi-locale="${locale}" data-empty="${escapeAttr(copy.empty)}">
${renderNav(page)}
<div id="main">
  <div id="search-form" role="form">
    <input id="search-box" type="text" placeholder="${copy.search}" autocomplete="off" tabindex="0" aria-label="${copy.search}" />
    <div id="search-results"></div>
  </div>
  <section id="content">
${content}
  </section>
  <footer>
    <p>${escapeHtml(copy.license)} · <a href="https://github.com/TerraFirmaGreg-Translation-CN/cctweaked4tfgm">GitHub</a> ·
    <a href="https://github.com/TerraFirmaGreg-Translation-CN/cctweaked4tfgm/edit/main/docs/${escapeAttr(
      locale === 'zh_cn' ? `zh_cn/${page.rel}` : page.rel,
    )}">${escapeHtml(copy.edit)}</a></p>
  </footer>
</div>
<div id="search-overlay"></div>
<div id="tooltip"></div>
<div id="tag-popover" class="tag-popover" hidden>
  <div class="tag-popover-panel" role="dialog" aria-modal="true">
    <div class="tag-popover-header"></div>
    <div class="tag-popover-stage-wrap"></div>
    <div class="tag-popover-footer"></div>
  </div>
</div>
</body>
</html>`;
}

function renderSearchIndex(locale) {
  const entries = localePages(locale).map((page) => ({
    title: page.title,
    url: `${BASE}${page.url.replace(/^\//, '')}`,
    summary: page.summary || '',
    headings: (page.toc || [])
      .filter((heading) => heading.level <= 3)
      .map((heading) => ({ id: heading.id, title: heading.title, level: heading.level })),
  }));
  writeFile(join(OUT, LOCALES[locale].prefix, 'index.json'), JSON.stringify({ schema: 1, locale, entries }, null, 0));
}

function writeFile(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function plainSummary(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

function build() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  cpSync(join(SITE, 'main.css'), join(OUT, 'main.css'));
  cpSync(join(SITE, 'app.js'), join(OUT, 'app.js'));
  cpSync(join(DOCS, 'public'), OUT, { recursive: true });
  if (existsSync(join(DOCS, 'data/emi'))) {
    cpSync(join(DOCS, 'data/emi'), join(OUT, 'data/emi'), { recursive: true });
  }

  for (const locale of Object.keys(LOCALES)) {
    const components = createComponents({ locale, data, emiMap });
    const markdown = createMarkdown({
      locale,
      prefix: LOCALES[locale].prefix,
      base: BASE,
    });
    for (const page of localePages(locale)) {
      const source = readFileSync(page.sourcePath, 'utf8');
      const { body } = parseFrontmatter(source);
      const rendered = markdown.render(body, page.rel.split('/').slice(0, -1).join('/'));
      page.toc = rendered.headings;
      let html = rendered.html;
      for (const placeholder of rendered.placeholders) {
        const { name, attrs } = components.attrsFromTag(placeholder.tag);
        html = html.replace(placeholder.key, components.render(name, attrs));
      }
      page.summary = plainSummary(html);
      page.html = renderLayout(page, absolutize(html, locale));
      writeFile(page.output, page.html);
    }
    renderSearchIndex(locale);
  }

  writeFile(
    join(OUT, '404.html'),
    renderLayout(
      { locale: 'en_us', rel: '404.md', title: '404', url: '/404/' },
      '<h1>404</h1><p>Page not found. <a href="/cctweaked4tfgm/">Go home</a>.</p>',
    ),
  );

  console.log(`Built ${pages.size} pages into ${relative(ROOT, OUT)}/`);
}

function serve() {
  build();
  const port = Number(process.env.PORT) || 4173;
  const server = createServer((request, response) => {
    let path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (path.startsWith(BASE)) path = path.slice(BASE.length - 1);
    let file = join(OUT, path);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
    if (!existsSync(file)) {
      response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      response.end(readFileSync(join(OUT, '404.html')));
      return;
    }
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.woff2': 'font/woff2',
    };
    response.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
    response.end(readFileSync(file));
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`Serving http://127.0.0.1:${port}${BASE}`);
  });
}

if (process.argv.includes('--serve')) serve();
else build();
