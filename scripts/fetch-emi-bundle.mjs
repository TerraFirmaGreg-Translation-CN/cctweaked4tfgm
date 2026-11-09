#!/usr/bin/env node
/**
 * Build a CC/AP-only subset of the published EMI bundle
 * (`wiki.terrafirmagreg.team/modern/recipe-book/bundles/tfg-<tag>`).
 *
 * The subset is what `emi-recipe-renderer` mounts on this site: recipe layouts,
 * the icon atlas cells they reference, tag membership and the item labels for
 * both site locales. It is committed alongside `docs/data/` so the site stays
 * self-contained and does not link readers into another project.
 *
 * Usage:
 *   node scripts/fetch-emi-bundle.mjs [--tag 0.13.18] [--base URL] [--force]
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_BASE = 'https://wiki.terrafirmagreg.team/modern/recipe-book/bundles';

const args = new Map();
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg.startsWith('--')) {
    const [key, inline] = arg.slice(2).split('=');
    args.set(key, inline ?? process.argv[++i] ?? 'true');
  }
}

const latest = JSON.parse(readFileSync(join(ROOT, 'docs/data/latest.json'), 'utf8'));
const TAG = args.get('tag') || latest.tag;
const BUNDLE_ID = `tfg-${TAG}`;
const SOURCE_BASE = (args.get('base') || `${DEFAULT_BASE}/${BUNDLE_ID}`).replace(/\/+$/, '');
const OUT = resolve(ROOT, args.get('out') || 'docs/data/emi');
const CACHE = resolve(ROOT, '.cache/emi-source');
const FORCE = args.has('force');

const DATA = JSON.parse(readFileSync(join(ROOT, `docs/data/tfgm/${TAG}/recipes.json`), 'utf8'));

const CATEGORY_FOR_KIND = {
  'gtceu.assembler': 'gtceu:assembler',
  'gtceu.shaped': 'minecraft:crafting',
  shapeless: 'minecraft:crafting',
  'gtceu.chemical_bath': 'gtceu:chem_dyes',
};

const LOCALES = ['en_us', 'zh_cn'];
const warnings = [];

function log(message) {
  process.stderr.write(`${message}\n`);
}

function cachePath(path) {
  return join(CACHE, path.split('?')[0].replace(/^\/+/, ''));
}

async function fetchBytes(path, { optional = false } = {}) {
  const file = cachePath(path);
  if (!FORCE && existsSync(file)) return readFileSync(file);

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(`${SOURCE_BASE}/${path}`, { signal: AbortSignal.timeout(60_000) });
      if (optional && response.status === 404) return null;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, bytes);
      return bytes;
    } catch (error) {
      if (attempt === 3) {
        if (optional) return null;
        throw new Error(`${path}: ${error.message}`);
      }
      await new Promise((done) => setTimeout(done, 250 * (attempt + 1)));
    }
  }
}

async function fetchJson(path, options) {
  const bytes = await fetchBytes(path, options);
  return bytes ? JSON.parse(bytes.toString('utf8')) : null;
}

async function mapLimit(items, limit, run) {
  const out = new Array(items.length);
  let next = 0;
  let failed = false;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (!failed && next < items.length) {
      const index = next++;
      try {
        out[index] = await run(items[index], index);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  });
  await Promise.all(workers);
  return out;
}

const itemIndexCache = new Map();
function itemIndex(id) {
  const separator = id.indexOf(':');
  if (separator < 1) return Promise.resolve(null);
  const namespace = id.slice(0, separator);
  const path = id.slice(separator + 1);
  const key = `${namespace}:${path}`;
  if (!itemIndexCache.has(key)) {
    itemIndexCache.set(
      key,
      fetchJson(`items/${namespace}/${path}.json`, { optional: true }).catch(() => null),
    );
  }
  return itemIndexCache.get(key);
}

function emiPath(recipeId) {
  const separator = recipeId.indexOf(':');
  const namespace = recipeId.slice(0, separator);
  const path = recipeId.slice(separator + 1).replace(/\//g, '_');
  return `recipes/${namespace}/${path}`;
}

async function loadRecipe(recipeId) {
  const stem = emiPath(recipeId);
  const meta = await fetchJson(`${stem}.json`, { optional: true });
  if (!meta) return null;
  const image = await fetchBytes(`${stem}.png`, { optional: true });
  return { id: recipeId, meta, image, stem };
}

function interactionIds(meta) {
  const ids = new Set();
  const tags = new Set();
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (value.kind === 'item' || value.kind === 'fluid') {
      if (value.id) ids.add(String(value.id));
    }
    if (value.kind === 'tag') {
      if (value.displayId) ids.add(String(value.displayId));
      if (value.tag) tags.add(String(value.tag));
    }
    for (const child of Object.values(value)) visit(child);
  };
  visit(meta);
  return { ids, tags };
}

function tagResource(tag) {
  let value = String(tag).replace(/^#/, '');
  const parts = value.split(':');
  if (parts.length === 2) return { type: 'items', id: value, path: `tags/${parts[0]}/items/${parts[1]}.json` };
  if (parts.length === 3) {
    const type = { item: 'items', block: 'blocks', fluid: 'fluids' }[parts[0]];
    if (!type) return null;
    return { type, id: `${parts[1]}:${parts[2]}`, path: `tags/${parts[1]}/${type}/${parts[2]}.json` };
  }
  return null;
}

function lastSegment(id) {
  return String(id).split(/[/:]/).pop();
}

function chooseRecipe(recipe, candidates) {
  const expected = CATEGORY_FOR_KIND[recipe.kind];
  const wantedOutputs = new Set(recipe.outputs.map((io) => io.id).filter(Boolean));
  const wantedInputs = new Set([
    ...recipe.inputs.flatMap((io) => [io.id, io.key].filter(Boolean)),
    ...recipe.inputs.map((io) => io.id).filter(Boolean),
  ]);

  const scored = candidates
    .filter(Boolean)
    .map((candidate) => {
      const { meta } = candidate;
      let score = 0;
      if (candidate.id === recipe.id) score += 200;
      if (lastSegment(candidate.id) === lastSegment(recipe.id)) score += 80;
      if (candidate.id.endsWith(`/${recipe.id.split(':')[1]}`)) score += 60;
      if (meta.category === expected) score += 20;

      const seen = interactionIds(meta);
      for (const id of seen.ids) if (wantedOutputs.has(id)) score += 100;
      for (const id of seen.ids) if (wantedInputs.has(id)) score += 5;
      for (const tag of seen.tags) if (wantedInputs.has(tag)) score += 5;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;
  if (scored.length > 1 && scored[0].score === scored[1].score) {
    warnings.push(`${recipe.id}: ambiguous EMI mapping (${scored.slice(0, 3).map((s) => `${s.candidate.id}@${s.score}`).join(', ')})`);
  }
  return scored[0].candidate;
}

async function main() {
  log(`EMI source: ${SOURCE_BASE}`);
  log(`Output: ${OUT}`);

  // --- resolve recipe layouts -------------------------------------------------
  const mapping = [];
  for (const [index, recipe] of DATA.entries()) {
    if (recipe.kind === 'remove') {
      mapping.push({ index, id: recipe.id, emi: null });
      continue;
    }
    const category = CATEGORY_FOR_KIND[recipe.kind];
    if (!category) throw new Error(`${recipe.id}: no EMI category for kind ${recipe.kind}`);

    const outputIds = [...new Set(recipe.outputs.map((io) => io.id).filter(Boolean))];
    const candidateIds = new Set();
    for (const outputId of outputIds) {
      const item = await itemIndex(outputId);
      if (!item) continue;
      for (const ids of Object.values(item.outputs || {})) for (const id of ids) candidateIds.add(id);
    }
    if (!candidateIds.size) warnings.push(`${recipe.id}: item index has no recipes for output`);

    const candidates = (await mapLimit([...candidateIds], 8, (id) => loadRecipe(id).catch(() => null))).filter(Boolean);
    const chosen = chooseRecipe(recipe, candidates);
    if (!chosen) {
      warnings.push(`${recipe.id}: no EMI layout matched`);
      mapping.push({ index, id: recipe.id, emi: null });
      continue;
    }
    mapping.push({
      index,
      id: recipe.id,
      emi: chosen.id,
      category: chosen.meta.category,
      image: `${chosen.stem}.png`,
    });
    log(`  ${String(index).padStart(2, '0')} ${recipe.id} -> ${chosen.id}`);
  }

  const missing = mapping.filter((row) => !row.emi && row.id !== 'tfgm:computercraft-removals');
  if (missing.length) {
    throw new Error(`unmapped recipes:\n  ${missing.map((row) => row.id).join('\n  ')}`);
  }

  // --- collect tag and icon references ---------------------------------------
  const tagRefs = new Map();
  const iconIds = new Set(['minecraft_web_export:missing_icon']);
  for (const row of mapping) {
    if (!row.emi) continue;
    const meta = JSON.parse(readFileSync(cachePath(`${emiPath(row.emi)}.json`), 'utf8'));
    const refs = interactionIds(meta);
    for (const id of refs.ids) iconIds.add(id);
    for (const tag of refs.tags) tagRefs.set(tag, tagResource(tag));
  }

  const tagFiles = new Map();
  for (const [tag, ref] of tagRefs) {
    if (!ref) {
      warnings.push(`unsupported tag ref: ${tag}`);
      continue;
    }
    const data = await fetchJson(ref.path, { optional: true });
    if (!data) {
      warnings.push(`missing tag file: ${tag}`);
      continue;
    }
    tagFiles.set(tag, { ...ref, data });
    for (const id of data.values || []) iconIds.add(String(id));
  }

  // Recipe inputs/outputs also need labels, even when they are not drawn as icons.
  for (const recipe of DATA) {
    for (const io of [...(recipe.inputs || []), ...(recipe.outputs || [])]) {
      if (io?.id) iconIds.add(String(io.id));
      if (io?.type === 'list') for (const entry of io.items || []) if (entry?.id) iconIds.add(String(entry.id));
    }
  }

  // --- write the bundle -------------------------------------------------------
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(join(OUT, 'recipes'), { recursive: true });

  for (const row of mapping) {
    if (!row.emi) continue;
    const stem = emiPath(row.emi);
    const meta = readFileSync(cachePath(`${stem}.json`));
    writeFile(`recipes/${stem.split('/').slice(1).join('/')}.json`, meta);
    const image = cachePath(`${stem}.png`);
    if (existsSync(image)) writeFile(`${row.image}`, readFileSync(image));
    else warnings.push(`${row.emi}: recipe image missing`);
  }
  function writeFile(relative, bytes) {
    const target = join(OUT, relative);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes);
  }

  // Tag membership referenced by the layouts.
  for (const [tag, entry] of tagFiles) writeFile(entry.path, JSON.stringify(entry.data));
  const tagCatalog = { schema: 1, items: [], blocks: [], fluids: [] };
  for (const [tag, entry] of tagFiles) (tagCatalog[entry.type] ||= []).push(entry.id);
  for (const type of ['items', 'blocks', 'fluids']) tagCatalog[type].sort();
  writeFile('tags/index.json', JSON.stringify(tagCatalog));

  // Items-lang: only the labels the CC/AP layouts can show.
  const wantedLabelIds = new Set([...iconIds].map((id) => String(id).split('@')[0]));
  for (const locale of LOCALES) {
    const source = await fetchJson(`items-lang/${locale}.json`);
    if (!source) throw new Error(`items-lang/${locale}.json unavailable`);
    const items = (source.items || []).filter((item) => wantedLabelIds.has(String(item.id).split('@')[0]));
    writeFile(
      `items-lang/${locale}.json`,
      JSON.stringify({ ...source, itemCount: items.length, items }),
    );
    log(`items-lang/${locale}: ${items.length} labels`);
  }

  // lang: category names, tag names and EMI strings used by the renderer.
  const categories = (await fetchJson('categories/index.json')) || { categories: [] };
  const langKeys = new Set();
  for (const category of categories.categories || []) if (category.nameKey) langKeys.add(category.nameKey);
  for (const [tag] of tagRefs) langKeys.add(`tag.item.${String(tag).replace(/[/:]/g, '.')}`);
  for (const locale of LOCALES) {
    const source = await fetchJson(`lang/${locale}.json`, { optional: true });
    if (!source) {
      warnings.push(`lang/${locale}.json unavailable — renderer falls back to keys`);
      continue;
    }
    const picked = {};
    for (const [key, value] of Object.entries(source)) {
      if (langKeys.has(key) || key.startsWith('emi.') || key.startsWith('tag.')) picked[key] = value;
    }
    writeFile(`lang/${locale}.json`, JSON.stringify(picked));
    log(`lang/${locale}: ${Object.keys(picked).length} keys`);
  }

  // Category metadata and its dedicated icon atlas (small, kept whole).
  writeFile('categories/index.json', JSON.stringify(categories));
  const categoryIcons = (await fetchJson('categories/icons/index.json', { optional: true })) || { items: {}, pages: [] };
  writeFile('categories/icons/index.json', JSON.stringify(categoryIcons));
  for (const page of categoryIcons.pages || []) {
    const file = page.file || page.src;
    if (!file) continue;
    const bytes = await fetchBytes(`categories/icons/${file}`, { optional: true });
    if (bytes) writeFile(`categories/icons/${file}`, bytes);
  }

  // Icons: pack the referenced 32x32 cells into one atlas page.
  const iconIndex = await fetchJson('icons/index.json');
  if (!iconIndex) throw new Error('icons/index.json unavailable');
  const cell = Number(iconIndex.cellSize) || 32;
  const entries = Object.entries(iconIndex.items || {}).filter(([id]) => {
    const bare = String(id).split('@')[0];
    return iconIds.has(id) || wantedLabelIds.has(bare);
  });
  if (!entries.length) throw new Error('no icons matched the CC/AP recipes');

  const pageFiles = [...new Set(entries.map(([, entry]) => iconIndex.pages[entry.page]?.file))].filter(Boolean);
  const pageImages = new Map();
  for (const file of pageFiles) {
    const bytes = await fetchBytes(`icons/${file}`);
    const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    pageImages.set(file, { data, width: info.width, height: info.height });
  }

  const columns = Math.ceil(Math.sqrt(entries.length));
  const rows = Math.ceil(entries.length / columns);
  const sheetWidth = columns * cell;
  const sheetHeight = rows * cell;
  const sheet = Buffer.alloc(sheetWidth * sheetHeight * 4);
  const packed = {};
  entries.forEach(([id, entry], index) => {
    const pageFile = iconIndex.pages[entry.page]?.file;
    const page = pageImages.get(pageFile);
    if (!page) return;
    const x = Number(entry.x) || 0;
    const y = Number(entry.y) || 0;
    const dx = (index % columns) * cell;
    const dy = Math.floor(index / columns) * cell;
    for (let row = 0; row < cell; row++) {
      const sourceStart = ((y + row) * page.width + x) * 4;
      const targetStart = ((dy + row) * sheetWidth + dx) * 4;
      page.data.copy(sheet, targetStart, sourceStart, sourceStart + cell * 4);
    }
    packed[id] = { page: 0, x: dx, y: dy };
  });
  mkdirSync(join(OUT, 'icons'), { recursive: true });
  await sharp(sheet, { raw: { width: sheetWidth, height: sheetHeight, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(join(OUT, 'icons', 'atlas-000.png'));
  writeFile(
    'icons/index.json',
    JSON.stringify({ schema: 1, cellSize: cell, pages: [{ file: 'atlas-000.png', width: sheetWidth, height: sheetHeight }], items: packed }),
  );
  log(`icons: ${Object.keys(packed).length} cells in ${sheetWidth}x${sheetHeight}`);

  // --- manifest ---------------------------------------------------------------
  const sourceBundle = (await fetchJson('bundle.json')) || {};
  const sourceInfo = {
    schema: 2,
    imageScale: Number(sourceBundle.imageScale) || 2,
    recipeImageFormat: 'png',
    recipeCount: mapping.filter((row) => row.emi).length,
    languages: LOCALES,
    missingIconId: 'minecraft_web_export:missing_icon',
    profile: 'cctweaked4tfgm-subset',
    generatedBy: 'cctweaked4tfgm/scripts/fetch-emi-bundle.mjs',
    generatedFrom: SOURCE_BASE,
  };
  writeFile('bundle.json', JSON.stringify(sourceInfo, null, 2));

  writeFile(
    '../emi-map.json',
    JSON.stringify(
      {
        tag: TAG,
        source: SOURCE_BASE,
        recipes: mapping,
      },
      null,
      2,
    ),
  );

  const digest = createHash('sha256');
  for (const row of mapping) if (row.emi) digest.update(row.emi);
  log(`Done: ${mapping.filter((row) => row.emi).length} recipes, digest ${digest.digest('hex').slice(0, 12)}`);
  if (warnings.length) {
    log(`\n${warnings.length} warning(s):`);
    for (const warning of warnings) log(`  - ${warning}`);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
