#!/usr/bin/env node
// Cache the upstream inputs the extractor and API index need, for one release:
//
//   .cache/modpack-<tag>/                   Modpack-Modern checkout (by ci/run.sh)
//   .cache/items-index.json                 items/index.json of the published EMI bundle
//   .cache/items-lang-<locale>.json         display names for the same release
//   .cache/upstream/cc-<version>/lang/*.json CC:T lang files for the pinned version
//   .cache/upstream/cc-<version>/index.json  tweaked.cc symbol index
//
// The EMI bundle is the authoritative item registry of a TFGM release, which is
// what the turtle-upgrade derivation needs: GregTech registers tools per
// material, so the material set has to come from the shipped registry.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { findRepoRoot, readArg } from './lib/util.mjs';

const RECIPE_BOOK = 'https://wiki.terrafirmagreg.team/modern/recipe-book/bundles/tfg-';
const CC_REPO = 'https://raw.githubusercontent.com/cc-tweaked/CC-Tweaked';
const CC_SITE = 'https://tweaked.cc/mc-1.20.x';

const root = findRepoRoot();
const cache = resolve(root, '.cache');
const modpackTag = readArg('modpack-tag');
const ccVersion = readArg('cc-version');
const LOCALES = ['en_us', 'zh_cn'];

if (!modpackTag) {
  console.error('usage: fetch-item-index.mjs --modpack-tag <tag> [--cc-version <version>]');
  process.exit(1);
}

const bundle = `${RECIPE_BOOK}${modpackTag}`;

await fetchInto(
  `${bundle}/items/index.json`,
  join(cache, 'items-index.json'),
  'items/index.json',
);

for (const locale of LOCALES) {
  await fetchInto(
    `${bundle}/items-lang/${locale}.json`,
    join(cache, `items-lang-${locale}.json`),
    `items-lang/${locale}.json`,
  );
}

if (!ccVersion) {
  console.warn('! no --cc-version given; skipped CC:T snapshots');
  process.exit(0);
}

const ccTag = `v1.20.1-${ccVersion}`;
const langDir = join(cache, 'upstream', `cc-${ccVersion}`, 'lang');

for (const locale of LOCALES) {
  const generated = `${CC_REPO}/${ccTag}/projects/common/src/generated/resources/assets/computercraft/lang/${locale}.json`;
  const handWritten = `${CC_REPO}/${ccTag}/projects/common/src/main/resources/assets/computercraft/lang/${locale}.json`;
  const text = await fetchText(generated).catch(() => fetchText(handWritten));
  mkdirSync(langDir, { recursive: true });
  writeFileSync(join(langDir, `${locale}.json`), text);
  console.log(`${locale} lang: ${text.length} bytes (CC:T ${ccVersion})`);
}

const indexText = await fetchText(`${CC_SITE}/index.json`);
const indexPath = join(cache, 'upstream', `cc-${ccVersion}`, 'index.json');
mkdirSync(join(cache, 'upstream', `cc-${ccVersion}`), { recursive: true });
writeFileSync(indexPath, indexText);
console.log(`symbol index: ${Object.keys(JSON.parse(indexText)).length} entries (CC:T ${ccVersion})`);

async function fetchInto(url, path, label) {
  const text = await fetchText(url);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  const parsed = JSON.parse(text);
  const count = Array.isArray(parsed.items)
    ? parsed.items.length
    : Object.values(parsed).filter(Array.isArray).reduce((sum, list) => sum + list.length, 0);
  console.log(`${label}: ${count} entries (${modpackTag})`);
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'cctweaked4tfgm' } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}
