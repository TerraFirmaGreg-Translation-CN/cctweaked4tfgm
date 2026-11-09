#!/usr/bin/env node
// Download the pieces the extractor needs from upstream sources:
//   .cache/items-index.json                 items/index.json of the published EMI bundle
//   .cache/upstream/cc-<version>/lang/*.json CC:T lang files for the pinned version
//
// The EMI bundle is the authoritative item registry of a TFGM release, which is
// what the turtle-upgrade derivation needs (GT registers tools per material).

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { findRepoRoot, readArg } from './lib/util.mjs';

const RECIPE_BOOK =
  'https://wiki.terrafirmagreg.team/modern/recipe-book/bundles/tfg-';
const CC_REPO = 'https://raw.githubusercontent.com/cc-tweaked/CC-Tweaked';

const root = findRepoRoot();
const cache = resolve(root, '.cache');
const modpackTag = readArg('modpack-tag', '');
const ccVersion = readArg('cc-version', '');

main();

async function main() {
  mkdirSync(join(cache, 'upstream'), { recursive: true });

  const index = await fetchJson(`${RECIPE_BOOK}${modpackTag}/items/index.json`, 'items-index.json');
  writeFileSync(join(cache, 'items-index.json'), `${JSON.stringify(index)}\n`);
  const namespaces = Object.keys(index).filter((k) => Array.isArray(index[k]));
  console.log(`items-index.json: ${namespaces.length} namespaces (${modpackTag})`);

  // Display names for the ids referenced by the CC recipes. The published
  // items-lang files are multi-megabyte, so they are cached and then pruned to
  // the referenced set by the extractor.
  for (const locale of ['en_us', 'zh_cn']) {
    const lang = await fetchJson(
      `${RECIPE_BOOK}${modpackTag}/items-lang/${locale}.json`,
      `items-lang/${locale}.json`,
    );
    writeFileSync(join(cache, `items-lang-${locale}.json`), `${JSON.stringify(lang)}\n`);
    console.log(`items-lang/${locale}.json: ${lang.itemCount} items`);
  }

  if (ccVersion) {
    const tag = `v1.20.1-${ccVersion}`;
    const dir = join(cache, 'upstream', `cc-${ccVersion}`, 'lang');
    mkdirSync(dir, { recursive: true });
    for (const locale of ['en_us', 'zh_cn']) {
      const url = `${CC_REPO}/${tag}/projects/common/src/generated/resources/assets/computercraft/lang/${locale}.json`;
      try {
        const raw = await fetchText(url);
        writeFileSync(join(dir, `${locale}.json`), raw);
        console.log(`lang/${locale}.json: ${raw.length} bytes (CC:T ${ccVersion})`);
      } catch (error) {
        // zh_cn is hand-maintained upstream and lives outside generated resources.
        const fallback = `${CC_REPO}/${tag}/projects/common/src/main/resources/assets/computercraft/lang/${locale}.json`;
        const raw = await fetchText(fallback);
        writeFileSync(join(dir, `${locale}.json`), raw);
        console.log(`lang/${locale}.json: ${raw.length} bytes (fallback source)`);
      }
    }
  } else {
    console.warn('! no --cc-version given; skipped CC:T lang snapshot');
  }
}

async function fetchJson(url, label) {
  return JSON.parse(await fetchText(url, label));
}

async function fetchText(url, label = url) {
  const res = await fetch(url, { headers: { 'user-agent': 'cctweaked4tfgm' } });
  if (!res.ok) throw new Error(`${label}: HTTP ${res.status}`);
  return res.text();
}
