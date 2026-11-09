import { readdirSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** UI strings live next to this file: `<locale>.json`. */
export function loadUiLocales() {
  return Object.fromEntries(
    readdirSync(__dirname)
      .filter((file) => file.endsWith('.json'))
      .sort()
      .map((file) => {
        const id = basename(file, '.json');
        const data = JSON.parse(readFileSync(resolve(__dirname, file), 'utf8'));
        return [id, data];
      }),
  );
}

/**
 * Every locale must translate the same key set. A missing key silently falls
 * back to the default locale in VitePress, which hides the omission, so fail the
 * build instead.
 */
export function assertUiLocales(locales, defaultLocale) {
  const base = flatten(locales[defaultLocale]);
  const problems = [];
  for (const [id, ui] of Object.entries(locales)) {
    if (id === defaultLocale) continue;
    const flat = flatten(ui);
    for (const key of Object.keys(base)) {
      if (!(key in flat)) problems.push(`${id}: missing "${key}"`);
    }
    for (const key of Object.keys(flat)) {
      if (!(key in base)) problems.push(`${id}: unknown "${key}"`);
    }
  }
  if (problems.length) {
    throw new Error(`i18n key sets disagree:\n  ${problems.join('\n  ')}`);
  }
}

function flatten(value, prefix = '', out = {}) {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, path, out);
    else out[path] = child;
  }
  return out;
}

/** Mirrors the TFG wiki viewer palette (--tfg-* tokens) so the sites match. */
export const BRAND = {
  primary: '#ff0e0b',
  primaryRgb: '255, 14, 11',
};

export function buildThemeConfig(ui, localeBase, githubRepo) {
  const nav = ui.nav;
  return {
    nav: [
      { text: nav.guide, link: `${localeBase}/guide/` },
      { text: nav.recipes, link: `${localeBase}/recipes/` },
      { text: nav.quests, link: `${localeBase}/quests/` },
      { text: nav.api, link: `${localeBase}/api/` },
      {
        text: nav.upstream,
        items: [
          { text: 'CC: Tweaked', link: 'https://tweaked.cc/' },
          { text: 'Modpack-Modern', link: 'https://github.com/TerraFirmaGreg-Team/Modpack-Modern' },
          { text: 'Core-Modern', link: 'https://github.com/TerraFirmaGreg-Team/Core-Modern' },
          { text: 'TFG Wiki', link: 'https://wiki.terrafirmagreg.team/' },
        ],
      },
    ],
    editLink: {
      pattern: `https://github.com/${githubRepo}/edit/main/docs/:path`,
      text: ui.editLink,
    },
    footer: {
      message: 'Content derived from CC: Tweaked (MPL-2.0) and Modpack-Modern (see NOTICE).',
      copyright: `Copyright © ${new Date().getFullYear()} TerraFirmaGreg Translation CN`,
    },
    docFooter: ui.docFooter,
    outline: { label: ui.outline },
    lastUpdated: { text: ui.lastUpdated },
    darkModeSwitchLabel: ui.darkModeSwitchLabel,
    sidebarMenuLabel: ui.sidebarMenuLabel,
    returnToTopLabel: ui.returnToTopLabel,
    langMenuLabel: ui.langMenuLabel,
  };
}
