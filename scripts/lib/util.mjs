import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Nearest ancestor containing package.json (scripts/ may live under a checkout). */
export function findRepoRoot(start = dirname(fileURLToPath(import.meta.url))) {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) throw new Error('could not locate repo root (no package.json)');
    dir = parent;
  }
}

/** `--name value` / `--name=value` from argv. */
export function readArg(name, fallback = '') {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === `--${name}`) return argv[i + 1] ?? fallback;
    if (arg.startsWith(`--${name}=`)) return arg.slice(name.length + 3);
  }
  return fallback;
}

/** One summary line per voltage tier, for the extractor's stdout report. */
export function runTierTable(recipes) {
  const buckets = new Map();
  for (const recipe of recipes) {
    if (recipe.kind === 'remove') continue;
    const tier = recipe.tier || '—';
    buckets.set(tier, (buckets.get(tier) || 0) + 1);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([tier, count]) => `${tier.padEnd(4)} ${count} recipes`);
}
