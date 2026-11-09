#!/usr/bin/env node
// Extract the CC: Tweaked surface of a TerraFirmaGreg Modern release into
// machine-readable JSON under docs/public/data/tfgm/<tag>/.
//
// The KubeJS scripts are plain JavaScript, so they are *executed* against a
// recording mock of the KubeJS recipe DSL rather than pattern-matched. That
// keeps the output faithful to the tag being processed: if TFGM adds a recipe
// next release, the site picks it up without touching this script.
//
// Usage:
//   node scripts/extract-tfgm.mjs --modpack <dir-or-tag> [--out <dir>]
//
// <dir-or-tag>: local Modpack-Modern checkout (must contain kubejs/ and
// pakku-lock.json), or a release tag that will be shallow-cloned into
// .cache/modpack-<tag>. A GITHUB_TOKEN in the environment is used when cloning.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import vm from 'node:vm';

import { findRepoRoot, readArg, runTierTable } from './lib/util.mjs';

const REPO = 'https://github.com/TerraFirmaGreg-Team/Modpack-Modern.git';
const CC_DIR = 'kubejs/server_scripts/computer_craft';
const AP_DIR = 'kubejs/server_scripts/advancedperipherals';

const root = findRepoRoot();
const outDir = resolve(root, readArg('out', 'docs/data'));

function main() {
  const source = readArg('modpack') || latestReleaseTag();
  const modpack = resolveModpack(source);
  const tag = modpack.tag;

  const meta = readJson(join(modpack.dir, 'pakku-lock.json'));
  const pins = extractPins(meta.projects);
  const ccVersion = pins.ccTweaked.version;

  const recipes = extractRecipes(modpack.dir);
  const upgrades = extractTurtleUpgrades(modpack.dir, pins, ccVersion);
  const quests = extractQuests(modpack.dir);
  const config = extractConfig(modpack.dir);
  const lang = extractLang(modpack.dir, ccVersion);
  const labels = extractLabels(recipes, quests, upgrades);

  const payload = {
    schema: 1,
    generatedAt: new Date().toISOString(),
    generator: 'cctweaked4tfgm/scripts/extract-tfgm.mjs',
    modpack: {
      tag,
      commit: modpack.commit,
      released: modpack.released,
      url: `https://github.com/TerraFirmaGreg-Team/Modpack-Modern/releases/tag/${tag}`,
    },
    ccTweaked: pins.ccTweaked,
    core: pins.core,
    dependencies: pins.cc,
    counts: {
      recipes: recipes.filter((r) => r.kind !== 'remove').length,
      turtleUpgrades: upgrades.length,
      turtleMaterials: new Set(upgrades.map((u) => u.material)).size,
      quests: quests.length,
    },
  };

  const dir = join(outDir, 'tfgm', tag);
  mkdirSync(dir, { recursive: true });
  write(join(dir, 'meta.json'), payload);
  write(join(dir, 'recipes.json'), recipes);
  write(join(dir, 'turtle-upgrades.json'), upgrades);
  write(join(dir, 'quests.json'), quests);
  write(join(dir, 'config.json'), config);
  write(join(dir, 'lang.json'), lang);
  write(join(dir, 'labels.json'), labels);

  // Stable pointer for the site's default route.
  write(join(outDir, 'latest.json'), { tag, generatedAt: payload.generatedAt });
  writeIndexModule(outDir, tag);

  console.log(
    `extracted TFGM ${tag} (CC:T ${ccVersion}): ` +
      `${payload.counts.recipes} recipes, ${payload.counts.turtleUpgrades} turtle upgrades, ` +
      `${payload.counts.quests} quests -> ${dir}`,
  );
  for (const r of runTierTable(recipes)) console.log(`  ${r}`);
}

// ---------------------------------------------------------------------------
// source resolution

function latestReleaseTag() {
  const out = execFileSync('git', ['ls-remote', '--tags', REPO], { encoding: 'utf8' });
  const tags = out
    .split('\n')
    .map((line) => line.split('\t')[1] || '')
    .map((ref) => ref.replace(/^refs\/tags\//, '').replace(/\^\{\}$/, ''))
    .filter((t) => /^\d+\.\d+\.\d+$/.test(t));
  if (!tags.length) throw new Error(`no semver release tags found on ${REPO}`);
  return tags.sort(compareSemver).at(-1);
}

function compareSemver(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

function resolveModpack(source) {
  if (existsSync(join(source, 'pakku-lock.json'))) {
    return {
      dir: resolve(source),
      tag: readArg('tag') || detectTag(resolve(source)),
      commit: git(source, ['rev-parse', 'HEAD']).trim(),
      released: git(source, ['log', '-1', '--format=%cs']).trim(),
    };
  }

  const tag = source;
  const dir = resolve(root, '.cache', `modpack-${tag}`);
  if (!existsSync(join(dir, 'pakku-lock.json'))) {
    rmSync(dir, { recursive: true, force: true });
    git(root, ['clone', '--depth', '1', '--branch', tag, REPO, dir]);
  }
  return {
    dir,
    tag,
    commit: git(dir, ['rev-parse', 'HEAD']).trim(),
    released: git(dir, ['log', '-1', '--format=%cs']).trim(),
  };
}

function detectTag(dir) {
  try {
    return git(dir, ['describe', '--tags', '--exact-match']).trim();
  } catch {
    return readJson(join(dir, 'pakku.json')).version || 'dev';
  }
}

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

// ---------------------------------------------------------------------------
// pins

const CC_PROJECTS = [
  'cc-tweaked',
  'advancedperipherals',
  'cc-utf-8-compat',
  'computercraft-greg-flavored',
  'more-red',
  'more-red-x-cc-tweaked-compat',
];

function extractPins(projects) {
  const out = { cc: [] };
  for (const project of projects || []) {
    const slugs = Object.values(project.slug || {});
    const key = CC_PROJECTS.find((s) => slugs.includes(s));
    if (!key) continue;
    const file = (project.files || [])[0] || {};
    const entry = {
      slug: key,
      name: Object.values(project.name || {})[0] || key,
      type: project.type || 'MOD',
      side: project.side || 'BOTH',
      file: file.file_name || '',
      url: file.url || '',
      sha1: file.hashes?.sha1 || '',
      sha512: file.hashes?.sha512 || '',
      published: file.date_published || '',
    };
    if (key === 'cc-tweaked') {
      entry.version = versionFromFile(entry.file);
      out.ccTweaked = entry;
    }
    if (key === 'advancedperipherals') entry.version = versionFromFile(entry.file);
    if (key === 'cc-utf-8-compat') entry.version = versionFromFile(entry.file);
    out.cc.push(entry);
  }

  const core = (projects || []).find((p) =>
    Object.values(p.slug || {}).includes('terrafirmagreg-core'),
  );
  if (core) {
    const file = (core.files || [])[0] || {};
    out.core = {
      name: Object.values(core.name || {})[0],
      version: versionFromFile(file.file_name || ''),
      file: file.file_name || '',
      url: file.url || '',
    };
  }

  if (!out.ccTweaked) throw new Error('pakku-lock.json has no cc-tweaked project');
  return out;
}

/** `cc-tweaked-1.20.1-forge-1.121.0.jar` -> `1.121.0` */
function versionFromFile(file) {
  const m = /-(\d+\.\d+\.\d+(?:-[A-Za-z0-9.]+)?)\.(?:jar|zip)$/i.exec(file);
  return m ? m[1] : file;
}

// ---------------------------------------------------------------------------
// recipe extraction (execute KubeJS against a recording DSL mock)

const TIERS = ['ULV', 'LV', 'MV', 'HV', 'EV', 'IV', 'LuV', 'ZPM', 'UV', 'UHV'];
const VA = [7, 30, 120, 480, 1920, 7680, 30720, 122880, 491520, 1966080];

function extractRecipes(dir) {
  const records = [];
  const removals = [];

  for (const rel of [`${CC_DIR}/recipes.js`, `${AP_DIR}/recipes.js`]) {
    const abs = join(dir, rel);
    if (!existsSync(abs)) continue;
    const ff = new FakeForge(records, removals, rel);
    evaluateRecipeScript(abs, rel, ff.context());
  }

  return normalize(records, removals);
}

function evaluateRecipeScript(abs, rel, ctx) {
  const source = readFileSync(abs, 'utf8');
  const sandbox = vm.createContext(ctx);
  const wrapped = `${source}\n;globalThis.__tfg_entry = typeof registerComputerCraftRecipes === 'function' ? registerComputerCraftRecipes : (typeof registerAdvancedPeripheralsRecipes === 'function' ? registerAdvancedPeripheralsRecipes : null);`;
  vm.runInContext(wrapped, sandbox, { filename: rel });
  const entry = sandbox.__tfg_entry;
  if (typeof entry !== 'function') throw new Error(`${rel}: no register*Recipes entry point`);
  entry(sandbox.event);
}

/** Recording implementation of the KubeJS recipe events used by TFGM's CC scripts. */
function FakeForge(records, removals, file) {
  const at = () => {
    const frames = (new Error().stack || '').split('\n');
    const frame = frames.find((l) => l.includes(`${file}:`)) || '';
    const m = /:(\d+):\d+/.exec(frame);
    return m ? Number(m[1]) : 0;
  };

  const chain = (record) => {
    const api = {};
    const noop = () => api;
    Object.assign(api, {
      itemInputs: (...args) => {
        record.inputs.push(...args.map(toInput));
        return api;
      },
      inputFluids: (...args) => {
        record.inputs.push(...args.map(toInput));
        return api;
      },
      itemOutputs: (...args) => {
        record.outputs.push(...args.map(toOutput));
        return api;
      },
      notConsumable: noop,
      circuit: (n) => {
        record.circuit = Number(n);
        return api;
      },
      duration: (n) => {
        record.duration = Number(n);
        return api;
      },
      EUt: (n) => {
        record.euPerTick = Number(n);
        return api;
      },
      category: (id) => {
        record.category = String(id);
        return api;
      },
      addMaterialInfo: (v = true) => {
        record.materialInfo = Boolean(v);
        return api;
      },
      id: (id) => {
        record.id = String(id);
        return api;
      },
      cleanroom: noop,
      blastFurnaceTemperature: noop,
    });
    return api;
  };

  const gtceu = new Proxy(
    {},
    {
      get(_t, kind) {
        if (kind === 'shaped') {
          return (output, pattern, keys) => {
            const record = {
              file,
              kind: 'gtceu.shaped',
              id: '',
              line: at(),
              machine: 'crafting',
              inputs: Object.entries(keys || {}).map(([k, v]) =>
                Object.assign(toInput(v), { key: k }),
              ),
              outputs: [toOutput(output)],
              pattern: (pattern || []).join('/'),
            };
            records.push(record);
            const api = chain(record);
            return api;
          };
        }
        return (id) => {
          const record = {
            file,
            kind: `gtceu.${String(kind)}`,
            id: String(id),
            line: at(),
            machine: String(kind),
            inputs: [],
            outputs: [],
          };
          records.push(record);
          return chain(record);
        };
      },
    },
  );

  const event = {
    remove(filter) {
      removals.push({ filter: plain(filter), line: at(), file });
    },
    recipes: { gtceu },
    shapeless(output, inputs) {
      const record = {
        file,
        kind: 'shapeless',
        id: '',
        line: at(),
        machine: 'shapeless',
        inputs: (inputs || []).map(toInput),
        outputs: [toOutput(output)],
      };
      records.push(record);
      return chain(record);
    },
    shaped(output, pattern, keys) {
      const record = {
        file,
        kind: 'shaped',
        id: '',
        line: at(),
        machine: 'crafting',
        inputs: Object.entries(keys || {}).map(([k, v]) => Object.assign(toInput(v), { key: k })),
        outputs: [toOutput(output)],
        pattern: (pattern || []).join('/'),
      };
      records.push(record);
      return chain(record);
    },
  };

  return {
    context: () => ({
      event,
      global: {
        MINECRAFT_DYE_NAMES: [
          'white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray',
          'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black',
        ],
        COMPUTER_CRAFT_DISCS: discColours(),
      },
      GTValues: Object.assign(
        { VA, V: VA.map((v) => v + 1), VH: VA.map((v) => Math.floor(v / 2)) },
        Object.fromEntries(TIERS.map((t, i) => [t, i])),
      ),
      GTRecipeCategories: { CHEM_DYES: 'gtceu:chem_dyes' },
      Fluid: { of: (id, amount) => ({ type: 'fluid', id: String(id), amount }) },
      Item: {
        of: (id, nbt) => ({ type: 'item', id: String(id), nbt: nbt == null ? undefined : String(nbt) }),
      },
      ChemicalHelper: {
        get: (prefix, material, amount) => ({
          type: 'material',
          id: `gtceu:${String(material).toLowerCase()}_${String(prefix).toLowerCase()}`,
          amount: Number(amount) || 1,
        }),
      },
      TagPrefix: { plate: 'plate', plateDouble: 'double_plate', gear: 'gear' },
      GTMaterials: new Proxy({}, { get: (_t, name) => String(name) }),
      console,
    }),
  };
}

/** Kept in sync with kubejs/startup_scripts/computer_craft/constants.js (checked by verify-data). */
function discColours() {
  return [
    '{Color:15790320}', '{Color:15905331}', '{Color:15040472}', '{Color:10072818}',
    '{Color:14605932}', '{Color:8375321}', '{Color:15905484}', '{Color:5000268}',
    '{Color:10066329}', '{Color:5020082}', '{Color:11691749}', '{Color:3368652}',
    '{Color:8349260}', '{Color:5744206}', '{Color:13388876}', '{Color:1118481}',
  ].map((s) => s);
}

function toInput(value) {
  if (value == null) return { type: 'unknown', id: 'null' };
  if (typeof value === 'string') return parseIngredient(value);
  if (typeof value === 'object' && value.type) return value;
  if (Array.isArray(value)) return { type: 'list', items: value.map(toInput) };
  return { type: 'unknown', id: String(value) };
}

function toOutput(value) {
  return toInput(value);
}

/** `2x #gtceu:circuits/hv` / `1x computercraft:disk` / `#forge:plates/titanium` */
function parseIngredient(text) {
  const raw = String(text).trim();
  const m = /^(\d+)x\s+(.+)$/.exec(raw);
  const amount = m ? Number(m[1]) : 1;
  const body = m ? m[2] : raw;
  if (body.startsWith('#')) return { type: 'tag', id: body.slice(1), amount };
  return { type: 'item', id: body, amount };
}

function plain(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function normalize(records, removals) {
  return records.map((record, index) => {
    const eu = Number.isFinite(record.euPerTick) ? record.euPerTick : null;
    return {
      index,
      kind: record.kind,
      id: record.id || `${record.kind}#${index}`,
      machine: record.machine,
      tier: eu == null ? null : tierForEu(eu),
      euPerTick: eu,
      duration: record.duration ?? null,
      circuit: record.circuit ?? null,
      category: record.category ?? null,
      pattern: record.pattern ?? null,
      inputs: record.inputs,
      outputs: record.outputs,
      source: { file: record.file, line: record.line },
    };
  }).concat(
    removals.length
      ? [
          {
            index: records.length,
            kind: 'remove',
            id: 'tfgm:computercraft-removals',
            machine: null,
            tier: null,
            euPerTick: null,
            duration: null,
            circuit: null,
            category: null,
            pattern: null,
            inputs: [],
            outputs: [],
            removal: removals.map((r) => r.filter),
            source: { file: removals[0]?.file ?? '', line: removals[0]?.line ?? 0 },
          },
        ]
      : [],
  );
}

export function tierForEu(eu) {
  if (eu == null) return null;
  let tier = null;
  for (let i = 0; i < VA.length; i += 1) {
    if (eu >= VA[i]) tier = TIERS[i];
  }
  return tier;
}

// ---------------------------------------------------------------------------
// turtle upgrades (derived from the shipped item registry)

function extractTurtleUpgrades(dir, pins, ccVersion) {
  // TFGM generates one `computercraft:tool` upgrade per GT material × tool type.
  // The material set is whatever GT actually registered, so it is taken from the
  // published item index rather than guessed from the script.
  const index = readItemsIndex(pins.ccTweaked.version);
  const gt = new Set(index.gtceu || []);
  const types = [
    ['sword', 'computercraft:turtle_sword_harvestable', 'upgrade.minecraft.diamond_sword.adjective'],
    ['pickaxe', null, 'upgrade.minecraft.diamond_pickaxe.adjective'],
    ['axe', null, 'upgrade.minecraft.diamond_axe.adjective'],
    ['shovel', 'computercraft:turtle_shovel_harvestable', 'upgrade.minecraft.diamond_shovel.adjective'],
    ['hoe', 'computercraft:turtle_hoe_harvestable', 'upgrade.minecraft.diamond_hoe.adjective'],
  ];

  const materials = new Set();
  for (const type of types) {
    for (const id of gt) {
      if (id.endsWith(`_${type[0]}`)) materials.add(id.slice(0, -(type[0].length + 1)));
    }
  }

  const out = [];
  for (const material of [...materials].sort()) {
    for (const [type, breakable, adjective] of types) {
      const item = `gtceu:${material}_${type}`;
      if (!gt.has(`${material}_${type}`)) continue;
      out.push({
        upgradeId: `computercraft:${material}_${type}`,
        material,
        toolType: type,
        toolItem: item,
        adjective,
        breakable,
        consumeDurability: 'always',
        allowEnchantments: true,
        dataFile: `data/computercraft/computercraft/turtle_upgrades/${material}_${type}.json`,
      });
    }
  }
  if (!out.length) throw new Error('no GT turtle tool upgrades derived — check the item index');
  return out;
}

function readItemsIndex(ccVersion) {
  const cached = resolve(root, '.cache', 'items-index.json');
  if (existsSync(cached)) return readJson(cached);
  throw new Error(
    `missing ${cached}\n` +
      'Run `node scripts/fetch-item-index.mjs` first (downloads items/index.json from the ' +
      `published EMI bundle for CC:T ${ccVersion}).`,
  );
}

// ---------------------------------------------------------------------------
// quest chapter

function extractQuests(dir) {
  const snbt = join(dir, 'config/ftbquests/quests/chapters/cc.snbt');
  if (!existsSync(snbt)) return [];
  const text = readFileSync(snbt, 'utf8');
  const langPath = join(dir, 'kubejs/assets/tfg/lang/zh_cn/quests/computer.json');
  const enPath = join(dir, 'kubejs/assets/tfg/lang/en_us/quests/computer.json');
  const zh = existsSync(langPath) ? readJson(langPath) : {};
  const en = existsSync(enPath) ? readJson(enPath) : {};

  const quests = [];
  const blocks = splitQuestBlocks(text);
  for (const block of blocks) {
    const id = /(?:^|\s)id:\s*"([0-9A-F]+)"/.exec(block);
    const title = /(?:^|[\s{])title:\s*"\{([^}]+)\}"/.exec(block);
    const subtitle = /(?:^|[\s{])subtitle:\s*"\{([^}]+)\}"/.exec(block);
    const deps = /dependencies:\s*\[([^\]]*)\]/.exec(block);
    const tasks = [...block.matchAll(/item:\s*"([a-z_0-9]+:[a-z_0-9/]+)"/g)].map((m) => m[1]);
    if (!id) continue;
    const key = title ? title[1] : '';
    quests.push({
      id: id[1],
      titleKey: key,
      title: { zh_cn: zh[key] || '', en_us: en[key] || '' },
      subtitle: {
        zh_cn: subtitle ? zh[subtitle[1]] || '' : '',
        en_us: subtitle ? en[subtitle[1]] || '' : '',
      },
      dependencies: deps
        ? [...deps[1].matchAll(/"([0-9A-F]+)"/g)].map((m) => m[1])
        : [],
      tasks,
    });
  }
  return quests;
}

/** Split the `quests: [ { ... } { ... } ]` block into balanced top-level objects. */
function splitQuestBlocks(text) {
  const start = text.indexOf('quests: [');
  if (start < 0) return [];
  const blocks = [];
  let depth = 0;
  let begin = -1;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '{') {
      if (depth === 0) begin = i;
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0 && begin >= 0) blocks.push(text.slice(begin, i + 1));
    } else if (ch === ']' && depth === 0) {
      break;
    }
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// display labels

/**
 * Prune the published items-lang files down to the ids the CC pages actually
 * reference. Keeps the committed data small (<100 KB) while staying exact:
 * every id that appears in a recipe, quest task or turtle upgrade is included.
 */
function extractLabels(recipes, quests, upgrades) {
  const wanted = new Set();
  const note = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) return value.forEach(note);
    if (value.type === 'item' && value.id) wanted.add(String(value.id).toLowerCase());
    if (value.type === 'tag' && value.displayId) wanted.add(String(value.displayId).toLowerCase());
    if (value.items) note(value.items);
  };
  for (const recipe of recipes) {
    for (const input of recipe.inputs) note(input);
    for (const output of recipe.outputs) note(output);
  }
  for (const quest of quests) for (const task of quest.tasks) wanted.add(task.toLowerCase());
  for (const upgrade of upgrades) wanted.add(upgrade.toolItem.toLowerCase());

  const out = {};
  for (const locale of ['en_us', 'zh_cn']) {
    const path = resolve(root, '.cache', `items-lang-${locale}.json`);
    if (!existsSync(path)) continue;
    const data = readJson(path);
    const map = {};
    for (const entry of data.items || []) {
      if (wanted.has(entry.id)) map[entry.id] = entry.label;
    }
    out[locale] = map;
  }
  out.count = wanted.size;
  return out;
}

// ---------------------------------------------------------------------------
// config + lang

function extractConfig(dir) {
  const serverPath = join(dir, 'defaultconfigs/computercraft-server.toml');
  const clientPath = join(dir, 'config/computercraft-client.toml');
  const server = existsSync(serverPath) ? parseToml(readFileSync(serverPath, 'utf8')) : {};
  const client = existsSync(clientPath) ? parseToml(readFileSync(clientPath, 'utf8')) : {};
  const upstream = upstreamDefaults();

  const diff = {};
  for (const [key, value] of Object.entries({ ...server, ...client })) {
    if (!(key in upstream)) continue;
    if (String(upstream[key]) !== String(value)) diff[key] = { tfgm: value, upstream: upstream[key] };
  }

  return {
    server: serverPath.replace(/\\/g, '/'),
    client: clientPath,
    values: { ...server, ...client },
    upstream,
    overrides: Object.keys(diff),
    diff,
  };
}

/**
 * Flatten a TOML file to dotted keys, enough for CC's simple key = value files.
 * Array tables (`[[http.rules]]`) are indexed so repeated keys stay distinct.
 */
function parseToml(text) {
  const out = {};
  let table = '';
  const counts = new Map();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const arrayMatch = /^\[\[([^\]]+)\]\]$/.exec(line);
    if (arrayMatch) {
      const n = counts.get(arrayMatch[1]) || 0;
      counts.set(arrayMatch[1], n + 1);
      table = `${arrayMatch[1]}[${n}]`;
      continue;
    }
    const tableMatch = /^\[([^\]]+)\]$/.exec(line);
    if (tableMatch) {
      table = tableMatch[1];
      continue;
    }
    const kv = /^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/.exec(line);
    if (!kv) continue;
    const key = table ? `${table}.${kv[1]}` : kv[1];
    out[key] = parseTomlValue(kv[2]);
  }
  return out;
}

function parseTomlValue(raw) {
  const value = raw.replace(/\s+#.*$/, '').trim();
  if (value === '[]') return [];
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
  if (value === 'true' || value === 'false') return value === 'true';
  const num = Number(value);
  return Number.isFinite(num) ? num : value;
}

/** CC:T 1.121.0 `Config`/`CoreConfig`/`MainThreadConfig` defaults, see reference/config. */
function upstreamDefaults() {
  return {
    disabled_generic_methods: [],
    computer_space_limit: 1000000,
    floppy_space_limit: 125000,
    upload_max_size: 524288,
    maximum_open_files: 128,
    default_computer_settings: '',
    log_computer_errors: true,
    command_require_creative: true,
    'execution.computer_threads': 1,
    'execution.max_main_global_time': 10,
    'execution.max_main_computer_time': 5,
    'http.enabled': true,
    'http.websocket_enabled': true,
    'http.max_requests': 16,
    'http.max_websockets': 4,
    'http.bandwidth.global_download': 33554432,
    'http.bandwidth.global_upload': 33554432,
    'http.proxy.type': 'HTTP',
    'http.proxy.host': '',
    'http.proxy.port': 8080,
    'peripheral.command_block_enabled': false,
    'peripheral.modem_range': 64,
    'peripheral.modem_high_altitude_range': 384,
    'peripheral.modem_range_during_storm': 64,
    'peripheral.modem_high_altitude_range_during_storm': 384,
    'peripheral.max_notes_per_tick': 8,
    'peripheral.monitor_bandwidth': 1000000,
    'turtle.need_fuel': true,
    'turtle.normal_fuel_limit': 20000,
    'turtle.advanced_fuel_limit': 100000,
    'turtle.can_push': true,
    'term_sizes.computer.width': 51,
    'term_sizes.computer.height': 19,
    'term_sizes.pocket_computer.width': 26,
    'term_sizes.pocket_computer.height': 20,
    'term_sizes.monitor.width': 8,
    'term_sizes.monitor.height': 6,
    'monitor_renderer': 'BEST',
    'monitor_distance': 64,
    'upload_nag_delay': 5,
  };
}

function extractLang(dir, ccVersion) {
  const langDir = join(dir, 'kubejs/assets/computercraft/lang');
  if (!existsSync(langDir)) return { locales: [], upstreamKeys: 0 };
  const files = execFileSync('ls', [langDir], { encoding: 'utf8' }).trim().split('\n');
  const locales = [];
  const upstream = upstreamLangKeys(ccVersion);
  for (const file of files.sort()) {
    if (!file.endsWith('.json')) continue;
    const locale = file.replace(/\.json$/, '');
    const data = readJson(join(langDir, file));
    const keys = Object.keys(data);
    // For en_us a differing value is a real divergence from upstream; for the
    // other locales every translated string differs by design.
    const differs = keys.filter((k) => upstream[k] != null && upstream[k] !== data[k]);
    locales.push({
      locale,
      keys: keys.length,
      differsFromEnUs: differs.length,
      divergedKeys: locale === 'en_us' ? differs : [],
      missingUpstreamKeys: Object.keys(upstream).filter((k) => !(k in data)),
    });
  }
  return { version: ccVersion, upstreamKeys: Object.keys(upstream).length, locales };
}

function upstreamLangKeys(ccVersion) {
  const candidates = [
    resolve(root, '.cache', 'upstream', `cc-${ccVersion}`, 'lang', 'en_us.json'),
    resolve(root, '.cache', 'upstream', 'cc-latest', 'lang', 'en_us.json'),
  ];
  for (const p of candidates) if (existsSync(p)) return readJson(p);
  return {};
}

// ---------------------------------------------------------------------------

/** Static ESM barrel so Vite can bundle the JSON without a runtime fetch. */
function writeIndexModule(outDir, tag) {
  const body = `// Generated by scripts/extract-tfgm.mjs — do not edit.
import meta from './tfgm/${tag}/meta.json' with { type: 'json' };
import recipes from './tfgm/${tag}/recipes.json' with { type: 'json' };
import turtleUpgrades from './tfgm/${tag}/turtle-upgrades.json' with { type: 'json' };
import quests from './tfgm/${tag}/quests.json' with { type: 'json' };
import config from './tfgm/${tag}/config.json' with { type: 'json' };
import lang from './tfgm/${tag}/lang.json' with { type: 'json' };
import labels from './tfgm/${tag}/labels.json' with { type: 'json' };

export const TAG = ${JSON.stringify(tag)};
export { meta, recipes, turtleUpgrades, quests, config, lang, labels };
`;
  writeFileSync(join(outDir, 'index.ts'), body);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
}

function write(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  const pretty = path.endsWith('labels.json') ? '\t' : 2;
  writeFileSync(path, `${JSON.stringify(data, null, pretty)}\n`);
}

// Called last so the hoisted `const` tables above are initialised.
main();
