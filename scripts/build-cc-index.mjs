#!/usr/bin/env node
// Build docs/data/cc-index.json from the tweaked.cc index of the pinned CC:T
// version. The upstream index is keyed by Lua symbol and includes an already
// resolved page URL, so this file is a faithful, compact mirror — the site never
// scrapes tweaked.cc at runtime.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { findRepoRoot, readArg } from './lib/util.mjs';

const root = findRepoRoot();
const ccVersion = readArg('cc-version', '1.121.0');
const out = resolve(root, readArg('out', 'docs/data/cc-index.json'));

const input = resolve(root, '.cache', 'upstream', `cc-${ccVersion}`, 'index.json');
if (!existsSync(input)) {
  throw new Error(`missing ${input} — run scripts/fetch-item-index.mjs --cc-version ${ccVersion}`);
}

const raw = JSON.parse(readFileSync(input, 'utf8'));

/** Bake the version into every upstream link so the index is not silently reassigned. */
const PREFIX = `https://tweaked.cc/mc-1.20.x/`;

const entries = {};
for (const [symbol, value] of Object.entries(raw)) {
  entries[symbol] = {
    kind: value['module-kind'],
    module: value.module,
    name: value.name,
    summary: value.summary,
    url: `${PREFIX}${value.url}`,
  };
}

const groups = {};
for (const [symbol, entry] of Object.entries(entries)) {
  const key = `${entry.kind}:${entry.module}`;
  (groups[key] ||= []).push(symbol);
}
for (const list of Object.values(groups)) list.sort();

writeFileSync(
  out,
  `${JSON.stringify(
    {
      source: `https://tweaked.cc/mc-1.20.x/index.json`,
      ccVersion,
      count: Object.keys(entries).length,
      groups: Object.fromEntries(
        Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)),
      ),
      entries,
    },
    null,
    2,
  )}\n`,
);

console.log(`cc-index.json: ${Object.keys(entries).length} symbols in ${Object.keys(groups).length} groups`);
