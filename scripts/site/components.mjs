// Build-time renderers for the small set of data-driven components the
// TerraFirmaGreg docs use. Everything is emitted as plain HTML; filtering is
// done by site/app.js.

import { escapeAttr, escapeHtml } from './markdown.mjs';

const KIND_LABELS = {
  zh_cn: {
    module: '全局与库',
    peripheral: '外设',
    generic_peripheral: '通用外设',
    event: '事件',
    reference: '参考',
    guide: '指南',
    library: '模块',
  },
  en_us: {
    module: 'Globals and libraries',
    peripheral: 'Peripherals',
    generic_peripheral: 'Generic peripherals',
    event: 'Events',
    reference: 'Reference',
    guide: 'Guides',
    library: 'Libraries',
  },
};

const KIND_ORDER = ['module', 'peripheral', 'generic_peripheral', 'event', 'library', 'guide', 'reference'];

const TIER_COLOURS = {
  ULV: '#c80000',
  LV: '#dcdcdc',
  MV: '#ff6400',
  HV: '#ffff1e',
  EV: '#808080',
  IV: '#f0f0f5',
  LuV: '#e99797',
  ZPM: '#7ec3c4',
  UV: '#7eb07e',
  UHV: '#bf74c0',
};

const TIERS = [
  { tier: 'ULV', zh: '超低压', en: 'Ultra low voltage', zhNote: '化学浸洗（软盘）', enNote: 'Chemical bath (floppies)' },
  { tier: 'MV', zh: '中压', en: 'Medium voltage', zhNote: '组装机：线缆、计算机、红石继电器', enNote: 'Assembler: cable, computer, redstone relay' },
  { tier: 'HV', zh: '高压', en: 'High voltage', zhNote: '组装机：高级计算机、海龟；便携机', enNote: 'Assembler: advanced computer, turtle; pocket computers' },
  { tier: 'EV', zh: '超高压', en: 'Extreme voltage', zhNote: '组装机：高级海龟；高级便携机', enNote: 'Assembler: advanced turtle; advanced pocket computer' },
  { tier: 'IV', zh: '绝缘电压', en: 'Insane voltage', zhNote: '高级自动化核心升级', enNote: 'Advanced automata core upgrades' },
  { tier: 'LuV', zh: 'Ludicrous 电压', en: 'Ludicrous voltage', zhNote: '库存管理器、末地核心', enNote: 'Inventory manager, end automata core' },
];

export function createComponents({ locale, data, emiMap }) {
  const zh = locale === 'zh_cn';
  const t = (en, zhText) => (zh ? zhText : en);
  const labels = data.labels || {};
  const labelMap = labels[locale] || labels.zh_cn || {};
  const altLabels = labels[locale === 'zh_cn' ? 'en_us' : 'zh_cn'] || {};

  const label = (id) => labelMap[id] || altLabels[id] || id;

  function tierBadge(tier, eu) {
    const value = String(tier || '').trim();
    if (!value) return `<span class="tier-badge tier-badge--none">—</span>`;
    const colour = TIER_COLOURS[value] || 'var(--tfg-muted)';
    const title = eu == null ? '' : ` title="${escapeAttr(`${eu} EU/t`)}"`;
    return `<span class="tier-badge" style="--tier-colour:${colour}"${title}>${escapeHtml(value)}</span>`;
  }

  function versionPill({ core = false } = {}) {
    const meta = data.meta;
    const parts = [
      `<span class="tag">TFGM ${escapeHtml(meta.modpack.tag)}</span>`,
      `<a class="tag" href="${escapeAttr(meta.ccTweaked.url)}" target="_blank" rel="noreferrer">CC: Tweaked ${escapeHtml(
        meta.ccTweaked.version,
      )}</a>`,
    ];
    if (core && meta.core?.version) {
      parts.push(
        `<a class="tag" href="${escapeAttr(meta.core.url)}" target="_blank" rel="noreferrer">Core ${escapeHtml(
          meta.core.version,
        )}</a>`,
      );
    }
    if (meta.modpack.released) {
      parts.push(`<span class="muted small">${t('Released', '发布')} ${escapeHtml(meta.modpack.released)}</span>`);
    }
    return `<p class="pill-row">${parts.join('')}</p>`;
  }

  function recipeBrowser({ machines = [], removals = false } = {}) {
    const recipes = data.recipes.filter((recipe) => recipe.kind !== 'remove');
    const pool = machines.length ? recipes.filter((recipe) => machines.includes(recipe.machine)) : recipes;
    const machineIds = [...new Set(pool.map((recipe) => recipe.machine))].sort();
    const tiers = [...new Set(pool.map((recipe) => recipe.tier).filter(Boolean))];

    const byIndex = new Map((emiMap?.recipes || []).map((row) => [row.index, row]));
    const cards = pool
      .map((recipe) => {
        const emi = byIndex.get(recipe.index);
        if (!emi?.emi) return '';
        const primary = recipe.outputs[0];
        const ioText = [
          recipe.id,
          ...recipe.inputs.flatMap((io) => [io.id, label(io.id)]),
          ...recipe.outputs.flatMap((io) => [io.id, label(io.id)]),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const inputs = recipe.inputs
          .map((io) => {
            return `<li><span class="mono small">${escapeHtml(io.type)}:${escapeHtml(io.id || '')}</span>${
              io.amount ? ` ×${io.amount}` : ''
            }</li>`;
          })
          .join('');
        const outputs = recipe.outputs
          .map(
            (io) =>
              `<li><span class="mono small">${escapeHtml(io.type)}:${escapeHtml(io.id || '')}</span>${
                io.amount ? ` ×${io.amount}` : ''
              }</li>`,
          )
          .join('');
        const details = [
          recipe.circuit ? `<li>circuit ${recipe.circuit}</li>` : '',
          recipe.category ? `<li>category <code>${escapeHtml(recipe.category)}</code></li>` : '',
          recipe.pattern ? `<li>pattern <code>${escapeHtml(recipe.pattern)}</code></li>` : '',
          `<li>${t('Source', '来源')} <code>${escapeHtml(recipe.source.file)}:${recipe.source.line}</code></li>`,
          `<li>EMI <code>${escapeHtml(emi.emi)}</code></li>`,
        ].join('');

        const duration = recipe.duration == null ? '—' : `${recipe.duration}t`;
        const eu = recipe.euPerTick == null ? '—' : `${recipe.euPerTick} EU/t`;

        return `<article class="recipe-card" data-recipe-card data-machine="${escapeAttr(
          recipe.machine,
        )}" data-tier="${escapeAttr(recipe.tier || '')}" data-search="${escapeAttr(ioText)}">
  <header class="recipe-card__header">
    <span class="recipe-card__machine mono">${escapeHtml(recipe.machine)}</span>
    ${tierBadge(recipe.tier, recipe.euPerTick)}
    <span class="recipe-card__stat mono small">${escapeHtml(eu)}</span>
    <span class="recipe-card__stat mono small">${escapeHtml(duration)}</span>
  </header>
  <div class="recipe-card__stage">
    <div class="emi-recipe" data-recipe-id="${escapeAttr(emi.emi)}"></div>
  </div>
  <div class="recipe-card__title">
    <strong>${escapeHtml(recipe.outputs.length ? label(primary?.id) : recipe.id)}</strong>
    <div class="mono small muted">${escapeHtml(recipe.id)}</div>
  </div>
  <details class="recipe-card__details">
    <summary>${t('Raw data', '原始数据')}</summary>
    <div class="recipe-card__columns">
      <div><strong>${t('Inputs', '输入')}</strong><ul>${inputs || '<li>—</li>'}</ul></div>
      <div><strong>${t('Outputs', '输出')}</strong><ul>${outputs || '<li>—</li>'}</ul></div>
      <div><strong>${t('Other', '其它')}</strong><ul>${details}</ul></div>
    </div>
  </details>
</article>`;
      })
      .join('\n');

    const removal = data.recipes.find((recipe) => recipe.kind === 'remove');
    const removalBlock =
      removals && removal
        ? `<details class="card removal-card"><summary>${t('Recipes deleted by TFGM', 'TFGM 删除的原版配方')}</summary><pre class="mono">${escapeHtml(
            JSON.stringify(removal.removal, null, 2),
          )}</pre></details>`
        : '';

    return `<section class="browser" data-browser="recipes">
  <div class="toolbar">
    <input type="search" data-filter="search" placeholder="${t('Search item or recipe id…', '搜索物品 / 配方 ID…')}" aria-label="${t(
      'Search recipes',
      '搜索配方',
    )}" />
    <select data-filter="machine" aria-label="${t('Machine', '机器')}">
      <option value="">${t('All machines', '全部机器')}</option>
      ${machineIds.map((id) => `<option value="${escapeAttr(id)}">${escapeHtml(id)}</option>`).join('')}
    </select>
    <select data-filter="tier" aria-label="${t('Voltage tier', '电压等级')}">
      <option value="">${t('All tiers', '全部等级')}</option>
      ${tiers.map((tier) => `<option value="${escapeAttr(tier)}">${escapeHtml(tier)}</option>`).join('')}
    </select>
    <span class="count" data-count>${pool.length} / ${pool.length}</span>
  </div>
  <div class="recipe-grid">${cards}</div>
  <p class="empty-note" data-empty hidden>${t('No recipes match the current filters.', '没有符合当前筛选条件的配方。')}</p>
  ${removalBlock}
</section>`;
  }

  function tierLegend() {
    return `<div class="grid-cards">${TIERS.map(
      (entry) => `<div class="card">
  ${tierBadge(entry.tier)}
  <div><strong>${escapeHtml(zh ? entry.zh : entry.en)}</strong></div>
  <div class="muted small">${escapeHtml(zh ? entry.zhNote : entry.enNote)}</div>
</div>`,
    ).join('')}</div>`;
  }

  function turtleMatrix() {
    const tools = [
      { type: 'sword', zh: '剑', en: 'Sword' },
      { type: 'pickaxe', zh: '镐', en: 'Pickaxe' },
      { type: 'axe', zh: '斧', en: 'Axe' },
      { type: 'shovel', zh: '铲', en: 'Shovel' },
      { type: 'hoe', zh: '锄', en: 'Hoe' },
    ];
    const upgrades = data.turtleUpgrades;
    const materials = [...new Set(upgrades.map((row) => row.material))].sort();
    const lookup = new Map(upgrades.map((row) => [`${row.material}:${row.toolType}`, row]));

    const rows = materials
      .map((material) => {
        const cells = tools
          .map((tool) => {
            const upgrade = lookup.get(`${material}:${tool.type}`);
            if (!upgrade) return `<td class="muted">—</td>`;
            return `<td title="${escapeAttr(`${tool.type}: ${upgrade.toolItem}`)}">${escapeHtml(label(upgrade.toolItem))}</td>`;
          })
          .join('');
        return `<tr data-material-row data-material="${escapeAttr(material)}" data-search="${escapeAttr(material)}">
  <th scope="row" class="mono">${escapeHtml(material)}</th>${cells}
</tr>`;
      })
      .join('\n');

    const detail = materials
      .map((material) => {
        const files = upgrades
          .filter((row) => row.material === material)
          .map((row) => {
            const body = {
              type: 'computercraft:tool',
              item: row.toolItem,
              adjective: row.adjective,
              allowEnchantments: row.allowEnchantments,
              consumeDurability: row.consumeDurability,
              ...(row.breakable ? { breakable: row.breakable } : {}),
            };
            return `<div class="upgrade-file"><div class="mono small muted">${escapeHtml(
              row.dataFile,
            )}</div><pre class="mono">${escapeHtml(JSON.stringify(body, null, 2))}</pre></div>`;
          })
          .join('');
        return `<details class="turtle-detail" data-material-detail data-material="${escapeAttr(
          material,
        )}"><summary><span class="mono">${escapeHtml(material)}</span> ${t('upgrade JSON', '升级数据')}</summary>${files}</details>`;
      })
      .join('');

    return `<section class="browser" data-browser="turtles">
  <div class="toolbar">
    <input type="search" data-filter="search" placeholder="${t('Filter materials…', '筛选材料…')}" aria-label="${t(
      'Filter materials',
      '筛选材料',
    )}" />
    <span class="count" data-count>${materials.length} ${t('materials', '种材料')} / ${upgrades.length} ${t(
      'upgrades',
      '个升级',
    )}</span>
  </div>
  <div class="scroll"><table class="data-table">
    <thead><tr><th>${t('Material', '材料')}</th>${tools
      .map((tool) => `<th>${escapeHtml(zh ? tool.zh : tool.en)}</th>`)
      .join('')}</tr></thead>
    <tbody>${rows}</tbody>
  </table></div>
  <div class="turtle-details">${detail}</div>
</section>`;
  }

  function questList() {
    const quests = data.quests;
    const byId = new Map(quests.map((quest) => [quest.id, quest]));
    const depth = new Map();
    const visit = (id, seen = new Set()) => {
      if (depth.has(id)) return depth.get(id);
      const quest = byId.get(id);
      if (!quest || seen.has(id)) return 0;
      seen.add(id);
      const value = quest.dependencies.length ? 1 + Math.max(...quest.dependencies.map((dep) => visit(dep, seen))) : 0;
      depth.set(id, value);
      return value;
    };
    for (const quest of quests) visit(quest.id);

    const rows = quests
      .map((quest) => {
        const value = depth.get(quest.id) ?? 0;
        const title = quest.title[locale] || quest.title.en_us || quest.titleKey;
        const subtitle = quest.subtitle[locale] || quest.subtitle.en_us || '';
        const tasks = quest.tasks.length
          ? quest.tasks.map((task) => `<span class="item-chip">${escapeHtml(label(task))}</span>`).join('')
          : `<span class="muted">${t('No item requirement', '无物品要求')}</span>`;
        return `<tr data-quest-row data-search="${escapeAttr(
          [quest.title.zh_cn, quest.title.en_us, quest.subtitle.zh_cn, ...quest.tasks].join(' ').toLowerCase(),
        )}">
  <td class="mono">${value}</td>
  <td><strong>${escapeHtml(title)}</strong><div class="muted small">${escapeHtml(subtitle)}</div></td>
  <td>${tasks}</td>
  <td class="mono muted">${quest.dependencies.length}</td>
</tr>`;
      })
      .join('\n');

    return `<section class="browser" data-browser="quests">
  <div class="toolbar">
    <input type="search" data-filter="search" placeholder="${t('Filter quests…', '筛选任务…')}" aria-label="${t(
      'Filter quests',
      '筛选任务',
    )}" />
    <span class="count" data-count>${quests.length} / ${quests.length} ${t('quests', '个任务')}</span>
  </div>
  <div class="scroll"><table class="data-table">
    <thead><tr><th>${t('Depth', '层')}</th><th>${t('Quest', '任务')}</th><th>${t(
      'Required items',
      '要求物品',
    )}</th><th>${t('Dependencies', '前置')}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>
</section>`;
  }

  function apiIndex() {
    const api = data.ccIndex;
    const kinds = [...new Set(Object.values(api.entries).map((entry) => entry.kind))];
    const ordered = KIND_ORDER.filter((kind) => kinds.includes(kind));
    const rows = Object.entries(api.entries)
      .map(([symbol, entry]) => ({ symbol, ...entry }))
      .sort((a, b) => a.symbol.localeCompare(b.symbol));

    const groups = new Map();
    for (const row of rows) {
      const key = `${row.kind}:${row.module}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
    const sorted = [...groups.entries()].sort(([a], [b]) => {
      const [ka, ma] = a.split(':');
      const [kb, mb] = b.split(':');
      return KIND_ORDER.indexOf(ka) - KIND_ORDER.indexOf(kb) || ma.localeCompare(mb);
    });

    const blocks = sorted
      .map(([, entries]) => {
        const entry = entries[0];
        return `<section class="api-group" data-api-group data-kind="${escapeAttr(entry.kind)}">
  <h3>${escapeHtml(KIND_LABELS[locale][entry.kind] || entry.kind)} <span class="mono muted">${escapeHtml(
          entry.module,
        )}</span></h3>
  <ul>${entries
    .map(
      (row) =>
        `<li data-search="${escapeAttr(
          `${row.symbol} ${row.name} ${row.summary}`.toLowerCase(),
        )}"><a class="mono" href="${escapeAttr(row.url)}" target="_blank" rel="noreferrer">${escapeHtml(
          row.name,
        )}</a><span class="muted"> — ${escapeHtml(row.summary)}</span></li>`,
    )
    .join('')}</ul>
</section>`;
      })
      .join('\n');

    return `<section class="browser" data-browser="api">
  <div class="toolbar">
    <input type="search" data-filter="search" placeholder="${t(
      'Search functions, events and peripherals…',
      '搜索函数 / 事件 / 外设…',
    )}" aria-label="${t('Search API', '搜索 API')}" />
    <select data-filter="kind" aria-label="${t('Category', '类别')}">
      <option value="">${t('All categories', '全部类别')}</option>
      ${ordered.map((kind) => `<option value="${escapeAttr(kind)}">${escapeHtml(KIND_LABELS[locale][kind] || kind)}</option>`).join('')}
    </select>
    <span class="count" data-count>${api.count} / ${api.count} · CC:T ${escapeHtml(api.ccVersion)}</span>
  </div>
  <div class="api-groups">${blocks}</div>
</section>`;
  }

  function configTable() {
    const config = data.config;
    const overrides = config.overrides || [];
    const values = config.values || {};
    const groups = [
      { id: 'http', label: zh ? 'HTTP API' : 'HTTP API' },
      { id: 'peripheral', label: zh ? '外设' : 'Peripherals' },
      { id: 'turtle', label: zh ? '海龟' : 'Turtles' },
      { id: 'term_sizes', label: zh ? '终端尺寸' : 'Terminal sizes' },
      { id: 'execution', label: zh ? '执行' : 'Execution' },
    ];
    const table = (entries) => `<div class="scroll"><table class="data-table"><thead><tr><th>${t(
      'Key',
      '键',
    )}</th><th>${t('Value', '值')}</th></tr></thead><tbody>${entries
      .map(
        ([key, value]) =>
          `<tr><td class="mono">${escapeHtml(key)}</td><td class="mono">${escapeHtml(
            typeof value === 'string' ? (value === '' ? '""' : value) : JSON.stringify(value),
          )}</td></tr>`,
      )
      .join('')}</tbody></table></div>`;

    const sections = groups
      .map((group) => {
        const entries = Object.entries(values).filter(([key]) => key.startsWith(`${group.id}.`));
        return entries.length ? `<h3>${escapeHtml(group.label)}</h3>${table(entries)}` : '';
      })
      .join('');
    const httpRules = Object.entries(values)
      .filter(([key]) => /^http\.rules\[/.test(key))
      .sort(([a], [b]) => a.localeCompare(b));

    return `<p class="card">${
      overrides.length
        ? `${t('Overrides', '覆盖了')} ${overrides.length} ${t('keys:', '项：')}${overrides
            .map((key) => `<span class="mono">${escapeHtml(key)}</span>`)
            .join(' ')}`
        : t(
            'TFGM <strong>overrides nothing</strong> — every value below equals the CC:T default.',
            'TFGM <strong>没有覆盖</strong>任何 CC:T 配置项——下面每一项都与上游默认值相同。',
          )
    }</p>${sections}<h3>${t('HTTP rules', 'HTTP 规则')}</h3>${table(httpRules)}`;
  }

  function langCoverage() {
    const lang = data.lang;
    const locales = [...(lang.locales || [])].sort((a, b) => Number(b.keys) - Number(a.keys));
    const rows = locales
      .map((entry) => {
        const missing = entry.missingUpstreamKeys || [];
        const missingCell = missing.length
          ? `<details><summary>${missing.length}</summary><ul>${missing
              .map((key) => `<li class="mono">${escapeHtml(key)}</li>`)
              .join('')}</ul></details>`
          : `<span class="muted">0</span>`;
        return `<tr><td class="mono">${escapeHtml(entry.locale)}</td><td>${entry.keys}</td><td>${missingCell}</td><td>${
          entry.differsFromEnUs
        }</td></tr>`;
      })
      .join('\n');

    const broken = locales.filter((entry) => (entry.missingUpstreamKeys || []).length);
    const brokenBlock = broken.length
      ? `<h3>${t('Upstream keys missing from the overrides', '上游新增键在覆盖文件中缺失')}</h3><p>${t(
          `CC:T ${escapeHtml(lang.version || '')} introduced keys the pack's language files do not contain.`,
          `CC:T ${escapeHtml(lang.version || '')} 引入了任务书文本包里没有的键。`,
        )}</p><ul>${broken
          .filter((entry) => ['zh_cn', 'zh_tw'].includes(entry.locale))
          .map(
            (entry) =>
              `<li><span class="mono">${escapeHtml(entry.locale)}</span><ul>${entry.missingUpstreamKeys
                .map((key) => `<li class="mono">${escapeHtml(key)}</li>`)
                .join('')}</ul></li>`,
          )
          .join('')}</ul>`
      : '';

    return `<div class="toolbar"><span class="count">${t(
      `Upstream en_us has ${lang.upstreamKeys} keys / ${locales.length} bundled locales`,
      `上游 en_us 共 ${lang.upstreamKeys} 个键 / 打包 ${locales.length} 个语种`,
    )}</span></div>
<div class="scroll"><table class="data-table"><thead><tr><th>${t('Locale', '语种')}</th><th>${t(
      'Keys',
      '键数',
    )}</th><th>${t('Missing upstream keys', '缺失上游键')}</th><th>${t('Differs from en_us', '与 en_us 不同')}</th></tr></thead>
<tbody>${rows}</tbody></table></div>${brokenBlock}`;
  }

  function modPins() {
    const deps = data.meta.dependencies || [];
    const typeLabel = (type) =>
      type === 'RESOURCE_PACK' ? t('Resource pack', '资源包') : type === 'MOD' ? t('Mod', '模组') : type.toLowerCase();
    const rows = deps
      .map(
        (dep) => `<tr><td><a href="${escapeAttr(dep.url)}" target="_blank" rel="noreferrer">${escapeHtml(
          dep.name,
        )}</a><div class="muted mono small">${escapeHtml(dep.slug)}</div></td><td class="mono">${escapeHtml(
          dep.version,
        )}</td><td>${escapeHtml(dep.side)}</td><td>${escapeHtml(typeLabel(dep.type))}</td><td class="mono break">${escapeHtml(
          dep.file,
        )}</td></tr>`,
      )
      .join('\n');
    return `<div class="scroll"><table class="data-table"><thead><tr><th>${t('Project', '项目')}</th><th>${t(
      'Version',
      '版本',
    )}</th><th>${t('Side', '侧')}</th><th>${t('Type', '类型')}</th><th>${t('File', '文件')}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function questBookLink() {
    const params = new URLSearchParams({ lang: 'zh_cn', search: 'ComputerCraft' });
    return `<p><a class="card questbook" href="https://wiki.terrafirmagreg.team/modern/quest-book/?${params}" target="_blank" rel="noreferrer">${t(
      'Search ComputerCraft in the TerraFirmaGreg quest book ↗',
      '在 TerraFirmaGreg 任务书中搜索 ComputerCraft ↗',
    )}</a></p>`;
  }

  return {
    render(name, attrs) {
      switch (name) {
        case 'VersionPill':
          return versionPill({ core: attrs['show-core'] !== undefined });
        case 'RecipeBrowser':
          return recipeBrowser({
            machines: (attrs.machines || '')
              .split(/[,\s]+/)
              .map((value) => value.trim())
              .filter(Boolean),
            removals: attrs['show-removals'] !== undefined,
          });
        case 'TierLegend':
          return tierLegend();
        case 'TierBadge':
          return tierBadge(attrs.tier, attrs.eu ? Number(attrs.eu) : null);
        case 'TurtleMatrix':
          return turtleMatrix();
        case 'QuestList':
          return questList();
        case 'ApiIndex':
          return apiIndex();
        case 'ConfigTable':
          return configTable();
        case 'LangCoverage':
          return langCoverage();
        case 'ModPins':
          return modPins();
        case 'QuestBookLink':
          return questBookLink();
        default:
          throw new Error(`unknown component: ${name}`);
      }
    },
    attrsFromTag(tag) {
      const match = /^<([A-Z][A-Za-z]+)\s*([^>]*?)\/?>$/.exec(tag.trim());
      if (!match) throw new Error(`cannot parse component tag: ${tag}`);
      const attrs = {};
      for (const attr of match[2].matchAll(/([:@]?[\w-]+)(?:\s*=\s*"([^"]*)")?/g)) {
        attrs[attr[1].replace(/^[:@]/, '')] = attr[2] ?? '';
      }
      return { name: match[1], attrs };
    },
  };
}
