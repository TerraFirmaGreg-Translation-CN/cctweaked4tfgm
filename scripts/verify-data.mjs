#!/usr/bin/env node
// Build gate: fail the site build when the generated data contradicts itself,
// the source release, or this repo's own claims.
//
// Every check below corresponds to a statement made in the docs. If the data
// drifts, the page is wrong, so the build must stop rather than ship it.

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { findRepoRoot } from './lib/util.mjs';

const root = findRepoRoot();
const dataRoot = resolve(root, 'docs/data');
const errors = [];
const notes = [];

function fail(message) {
  errors.push(message);
}

function read(rel) {
  const path = resolve(dataRoot, rel);
  if (!existsSync(path)) {
    fail(`missing ${rel}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    fail(`${rel}: invalid JSON (${error.message})`);
    return null;
  }
}

const latest = read('latest.json');
const tag = latest?.tag;
if (!tag) fail('latest.json has no tag');

const meta = read(`tfgm/${tag}/meta.json`);
const recipes = read(`tfgm/${tag}/recipes.json`) || [];
const upgrades = read(`tfgm/${tag}/turtle-upgrades.json`) || [];
const quests = read(`tfgm/${tag}/quests.json`) || [];
const config = read(`tfgm/${tag}/config.json`);
const lang = read(`tfgm/${tag}/lang.json`);
const labels = read(`tfgm/${tag}/labels.json`);
const ccIndex = read('cc-index.json');

const VA = [7, 30, 120, 480, 1920, 7680, 30720, 122880, 491520, 1966080];
const TIERS = ['ULV', 'LV', 'MV', 'HV', 'EV', 'IV', 'LuV', 'ZPM', 'UV', 'UHV'];

function tierForEu(eu) {
  let tier = null;
  for (let i = 0; i < VA.length; i += 1) if (eu >= VA[i]) tier = TIERS[i];
  return tier;
}

// --- version consistency ---------------------------------------------------

if (meta && ccIndex) {
  if (ccIndex.ccVersion !== meta.ccTweaked.version) {
    fail(
      `cc-index.json is for CC:T ${ccIndex.ccVersion} but the pack pins ${meta.ccTweaked.version}; ` +
        'run scripts/build-cc-index.mjs --cc-version ' + meta.ccTweaked.version,
    );
  }
}

if (meta) {
  const deps = (meta.dependencies || []).map((d) => d.slug);
  for (const required of ['cc-tweaked', 'advancedperipherals']) {
    if (!deps.includes(required)) fail(`meta.dependencies is missing ${required}`);
  }
  if (meta.counts.recipes !== recipes.filter((r) => r.kind !== 'remove').length) {
    fail('meta.counts.recipes disagrees with recipes.json');
  }
  if (meta.counts.turtleUpgrades !== upgrades.length) {
    fail('meta.counts.turtleUpgrades disagrees with turtle-upgrades.json');
  }
  if (meta.counts.quests !== quests.length) {
    fail('meta.counts.quests disagrees with quests.json');
  }
}

// --- recipes ---------------------------------------------------------------

const seenIds = new Set();
for (const recipe of recipes) {
  if (recipe.kind === 'remove') continue;
  if (seenIds.has(recipe.id)) fail(`duplicate recipe id: ${recipe.id}`);
  seenIds.add(recipe.id);

  if (recipe.euPerTick != null) {
    const expected = tierForEu(recipe.euPerTick);
    if (recipe.tier !== expected) {
      fail(`${recipe.id}: tier ${recipe.tier} does not match ${recipe.euPerTick} EU/t (expected ${expected})`);
    }
    if (!(recipe.duration > 0)) fail(`${recipe.id}: EU/t recipe without a positive duration`);
  } else if (recipe.tier != null) {
    fail(`${recipe.id}: tier without EU/t`);
  }

  if (!recipe.outputs.length) fail(`${recipe.id}: no outputs`);
  if (!recipe.source?.file) fail(`${recipe.id}: no source file`);
}

const ccRecipes = recipes.filter((r) => r.id.startsWith('computercraft:') || /computercraft:/.test(r.id));
if (ccRecipes.length < 10) fail(`only ${ccRecipes.length} CC recipes extracted — the DSL mock probably broke`);

const diskRecipes = recipes.filter((r) => r.machine === 'chemical_bath');
if (diskRecipes.length !== 16) fail(`expected 16 disk recipes, found ${diskRecipes.length}`);

const removal = recipes.find((r) => r.kind === 'remove');
if (!removal?.removal?.length) fail('no bulk removal recorded for the CC recipe set');

// --- turtle upgrades -------------------------------------------------------

const TOOL_TYPES = ['sword', 'pickaxe', 'axe', 'shovel', 'hoe'];
for (const upgrade of upgrades) {
  if (!TOOL_TYPES.includes(upgrade.toolType)) {
    fail(`${upgrade.upgradeId}: unknown tool type ${upgrade.toolType}`);
  }
  if (!upgrade.material) fail(`${upgrade.upgradeId}: no material`);
  if (!upgrade.toolItem.startsWith('gtceu:')) {
    fail(`${upgrade.upgradeId}: tool item ${upgrade.toolItem} is not a GregTech item`);
  }
  if (!upgrade.dataFile.includes('/turtle_upgrades/')) {
    fail(`${upgrade.upgradeId}: data file path looks wrong (${upgrade.dataFile})`);
  }
  const breakableExpected = ['sword', 'shovel', 'hoe'].includes(upgrade.toolType);
  if (breakableExpected && !upgrade.breakable) {
    fail(`${upgrade.upgradeId}: missing breakable tag for ${upgrade.toolType}`);
  }
  if (!breakableExpected && upgrade.breakable) {
    fail(`${upgrade.upgradeId}: unexpected breakable tag for ${upgrade.toolType}`);
  }
}

// GregTech only registers the tool shapes a material actually supports, and
// TFGM's loop skips the rest (ToolHelper.get() returns EMPTY). So "every material
// has all five tools" is wrong by construction — check against the shipped item
// index instead when it is cached.
const materials = new Set(upgrades.map((u) => u.material));
if (materials.size === 0) fail('no turtle materials');

const itemsIndexPath = resolve(root, '.cache/items-index.json');
if (existsSync(itemsIndexPath)) {
  const gt = new Set(JSON.parse(readFileSync(itemsIndexPath, 'utf8')).gtceu || []);
  for (const upgrade of upgrades) {
    if (!gt.has(upgrade.toolItem.replace(/^gtceu:/, ''))) {
      fail(`${upgrade.upgradeId}: ${upgrade.toolItem} is not in the release item index`);
    }
  }
  const expected = [...materials].reduce((count, material) => {
    return count + TOOL_TYPES.filter((t) => gt.has(`${material}_${t}`)).length;
  }, 0);
  if (upgrades.length !== expected) {
    fail(`upgrade count ${upgrades.length} != ${expected} derived from the item index`);
  }
} else {
  notes.push('items-index.json not cached — skipped tool-shape cross-check');
}

// --- quests ----------------------------------------------------------------

const questIds = new Set(quests.map((q) => q.id));
for (const quest of quests) {
  if (!quest.titleKey) fail(`quest ${quest.id}: no title key`);
  if (!questIds.has(quest.id)) fail(`quest ${quest.id}: id not registered`);
  for (const dep of quest.dependencies) {
    if (!questIds.has(dep)) fail(`quest ${quest.id}: dependency ${dep} is not in the chapter`);
  }
  if (quest.dependencies.includes(quest.id)) fail(`quest ${quest.id}: depends on itself`);
}
const acyclic = hasNoCycle(quests);
if (!acyclic) fail('quest dependency graph has a cycle');

function hasNoCycle(list) {
  const byId = new Map(list.map((q) => [q.id, q]));
  const state = new Map();
  const visit = (id) => {
    if (state.get(id) === 'done') return true;
    if (state.get(id) === 'open') return false;
    state.set(id, 'open');
    for (const dep of byId.get(id)?.dependencies || []) {
      if (!visit(dep)) return false;
    }
    state.set(id, 'done');
    return true;
  };
  return list.every((q) => visit(q.id));
}

// --- config ----------------------------------------------------------------

if (config) {
  const upstreamKeys = new Set(Object.keys(config.upstream || {}));
  const unknown = Object.keys(config.values || {}).filter(
    (key) => !upstreamKeys.has(key) && !/^http\.rules\[/.test(key),
  );
  if (unknown.length) {
    fail(
      `config.json has keys the upstream default table does not know: ${unknown.join(', ')} — ` +
        'add them to upstreamDefaults() in scripts/extract-tfgm.mjs',
    );
  }
  for (const key of config.overrides || []) {
    notes.push(`config override: ${key} = ${JSON.stringify(config.diff[key])}`);
  }
}

// --- language --------------------------------------------------------------

if (lang) {
  const zh = (lang.locales || []).find((l) => l.locale === 'zh_cn');
  if (!zh) fail('lang.json has no zh_cn entry');
  if (lang.upstreamKeys <= 0) fail('lang.json upstreamKeys is empty — the CC:T snapshot is missing');
  const en = (lang.locales || []).find((l) => l.locale === 'en_us');
  if (en && en.divergedKeys?.length) {
    fail(`en_us override diverges from upstream: ${en.divergedKeys.join(', ')}`);
  }
}

// --- labels ----------------------------------------------------------------

if (labels) {
  if (!labels.zh_cn || !Object.keys(labels.zh_cn).length) fail('labels.json has no zh_cn map');
  const missing = Object.keys(labels.en_us || {}).filter((id) => !labels.zh_cn?.[id]);
  if (missing.length) fail(`labels.json zh_cn misses ${missing.length} ids (e.g. ${missing[0]})`);
}

// --- report ----------------------------------------------------------------

if (errors.length) {
  console.error(`verify-data: ${errors.length} problem(s)\n`);
  for (const error of errors) console.error(`  ✗ ${error}`);
  process.exit(1);
}

console.log(
  `verify-data OK — TFGM ${tag}, CC:T ${meta.ccTweaked.version}: ` +
    `${recipes.filter((r) => r.kind !== 'remove').length} recipes, ` +
    `${upgrades.length} turtle upgrades (${materials.size} materials), ` +
    `${quests.length} quests, ${(lang?.locales || []).length} locales`,
);
for (const note of notes) console.log(`  • ${note}`);
