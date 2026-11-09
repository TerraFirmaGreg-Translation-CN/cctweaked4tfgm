import { defineConfig } from 'vitepress';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertUiLocales, buildThemeConfig, loadUiLocales } from './i18n/index.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const GITHUB_REPO = 'TerraFirmaGreg-Translation-CN/cctweaked4tfgm';
const SITE_URL = 'https://terrafirmagreg-translation-cn.github.io/cctweaked4tfgm';

/** en_us is the root locale (`/guide/`); zh_cn lives under `/zh_cn/`. */
const LOCALES = ['en_us', 'zh_cn'] as const;
type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = 'en_us';

const UI = loadUiLocales();
assertUiLocales(UI, DEFAULT_LOCALE);

const ROOT = resolve(__dirname, '..');

function localeBase(locale: Locale) {
  return locale === DEFAULT_LOCALE ? '' : `/${locale}`;
}

interface SidebarItem {
  text: string;
  link?: string;
  order?: number;
  collapsed?: boolean;
  items?: SidebarItem[];
}

/**
 * Sidebar is built from the filesystem: each top-level directory becomes a
 * group, ordered by the `order` frontmatter key, with the folder's `index.md`
 * acting as the group's own link.
 */
function buildSidebar(locale: Locale): SidebarItem[] {
  const base = localeBase(locale);
  const localeRoot = locale === DEFAULT_LOCALE ? ROOT : join(ROOT, locale);
  const groups: SidebarItem[] = [];

  for (const entry of readdirSync(localeRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (['public', 'data', '.vitepress', 'node_modules'].includes(entry.name)) continue;

    const dir = join(localeRoot, entry.name);
    const pages = readdirSync(dir)
      .filter((file) => file.endsWith('.md'))
      .map((file) => ({ file, meta: frontmatter(join(dir, file)) }))
      .sort((a, b) => (Number(a.meta.order) || 99) - (Number(b.meta.order) || 99) || a.file.localeCompare(b.file));
    if (!pages.length) continue;

    const indexPage = pages.find((page) => page.file === 'index.md');
    const items: SidebarItem[] = pages
      .filter((page) => page.file !== 'index.md')
      .map((page) => ({
        text: String(page.meta.title || titleCase(page.file.replace(/\.md$/, ''))),
        link: `${base}/${entry.name}/${page.file.replace(/\.md$/, '')}`,
      }));

    groups.push({
      text: String(indexPage?.meta.title || titleCase(entry.name)),
      link: indexPage ? `${base}/${entry.name}/` : undefined,
      order: Number(indexPage?.meta.order) || 99,
      collapsed: false,
      items,
    });
  }

  // Groups follow the folder index's `order` (Guide 1, Recipes 10, Quests 11, API 12…).
  return groups.sort(
    (a, b) => (Number(a.order) || 99) - (Number(b.order) || 99) || a.text.localeCompare(b.text),
  );
}

function frontmatter(path: string): Record<string, string | number> {
  const text = readFileSync(path, 'utf8');
  const match = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!match) return {};

  const meta: Record<string, string | number> = {};
  for (const line of match[1].split('\n')) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line.trim());
    if (!kv) continue;
    const value = kv[2].replace(/^['"]|['"]$/g, '');
    meta[kv[1]] = /^\d+$/.test(value) ? Number(value) : value;
  }
  return meta;
}

function titleCase(name: string) {
  return name.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function localeEntry(locale: Locale) {
  const ui = UI[locale];
  const base = localeBase(locale);
  return {
    label: ui.label as string,
    lang: ui.lang as string,
    link: `${base}/`,
    themeConfig: { ...buildThemeConfig(ui, base, GITHUB_REPO), sidebar: buildSidebar(locale) },
  };
}

const rootEntry = localeEntry(DEFAULT_LOCALE);
const sharedThemeConfig = buildThemeConfig(UI[DEFAULT_LOCALE], '', GITHUB_REPO);

export default defineConfig({
  title: 'CC: Tweaked for TerraFirmaGreg',
  description:
    'CC: Tweaked reference for TerraFirmaGreg Modern — versioned recipes, turtle upgrades, quest mapping and the Lua API index.',
  lang: rootEntry.lang,
  base: '/cctweaked4tfgm/',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: 'localhostLinks',
  srcExclude: ['data/**', 'README.md'],
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/cctweaked4tfgm/favicon.png' }],
    ['meta', { name: 'theme-color', content: '#ff0e0b' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'CC: Tweaked for TerraFirmaGreg' }],
    ['meta', { property: 'og:image', content: `${SITE_URL}/favicon.png` }],
  ],
  sitemap: { hostname: SITE_URL },
  themeConfig: {
    ...sharedThemeConfig,
    logo: { src: '/logo.png', alt: 'TFG', height: 32 },
    search: {
      provider: 'local',
      options: {
        locales: {
          root: { translations: UI[DEFAULT_LOCALE].search },
          zh_cn: { translations: UI.zh_cn.search },
        },
      },
    },
    socialLinks: [
      { icon: 'github', link: `https://github.com/${GITHUB_REPO}` },
      { icon: 'discord', link: 'https://discord.com/invite/AEaCzCTUwQ' },
    ],
    externalLinkIcon: true,
  },
  locales: {
    root: {
      label: rootEntry.label,
      lang: rootEntry.lang,
      link: rootEntry.link,
      themeConfig: rootEntry.themeConfig,
    },
    zh_cn: localeEntry('zh_cn'),
  },
  vite: {
    define: {
      __TFGM_TAG__: JSON.stringify(currentTag()),
    },
  },
});

/** The TFGM release the bundled data describes (data/latest.json). */
function currentTag() {
  try {
    const latest = JSON.parse(readFileSync(resolve(ROOT, 'data', 'latest.json'), 'utf8'));
    return latest.tag || 'dev';
  } catch {
    return 'dev';
  }
}
