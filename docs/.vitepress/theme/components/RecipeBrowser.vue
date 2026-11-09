<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Recipe, RecipeIO } from '../lib/data';
import { craftRecipes, label, recipeBookUrl, removals } from '../lib/data';

/**
 * Searchable view over the CC/AP recipes TFGM defines. Every row links into the
 * published RecipeBook-Modern bundle for the exact release, so the rendered EMI
 * card (and its icons) always comes from the exported game data rather than a
 * hand-drawn approximation.
 */
const props = withDefaults(defineProps<{ machines?: string[]; showRemovals?: boolean }>(), {
  machines: () => [],
  showRemovals: false,
});

const search = ref('');
const machine = ref('');
const tier = ref('');
const expanded = ref<string | null>(null);

const pool = computed(() =>
  props.machines.length
    ? craftRecipes.filter((r) => props.machines.includes(r.machine))
    : craftRecipes,
);

const machines = computed(() => [...new Set(pool.value.map((r) => r.machine))].sort());
const tiers = computed(() => [...new Set(pool.value.map((r) => r.tier).filter(Boolean))] as string[]);

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return pool.value.filter((r) => {
    if (machine.value && r.machine !== machine.value) return false;
    if (tier.value && r.tier !== tier.value) return false;
    if (!q) return true;
    const haystack = [
      r.id,
      ...r.inputs.flatMap(ioText),
      ...r.outputs.flatMap(ioText),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
});

function ioText(io: RecipeIO): string[] {
  if (!io) return [];
  if (io.type === 'list') return (io.items || []).flatMap(ioText);
  const out = [io.id || ''];
  if (io.id) out.push(label(io.id), label(io.id, 'en_us'));
  return out;
}

function ioDisplay(io: RecipeIO): string {
  if (!io) return '—';
  if (io.type === 'fluid') return `${label(io.id || '')} ${io.amount ?? ''} mB`.trim();
  if (io.type === 'material') return `${label(io.id || '')} ×${io.amount ?? 1}`;
  return label(io.id || '');
}

function ioPrefix(io: RecipeIO): string {
  const amount = io.amount && io.amount > 1 ? `${io.amount}× ` : '';
  const tag = io.type === 'tag' ? '#' : '';
  return `${amount}${tag}`;
}

function toggle(recipe: Recipe) {
  expanded.value = expanded.value === recipe.id ? null : recipe.id;
}

function appliedRemovals(): string[] {
  if (!removals?.removal) return [];
  return removals.removal.map((entry) => JSON.stringify(entry));
}
</script>

<template>
  <div class="tfgm-toolbar">
    <input v-model="search" type="search" placeholder="搜索物品 / 配方 ID…" aria-label="搜索配方" />
    <select v-model="machine" aria-label="机器">
      <option value="">全部机器</option>
      <option v-for="m in machines" :key="m" :value="m">{{ m }}</option>
    </select>
    <select v-model="tier" aria-label="电压等级">
      <option value="">全部等级</option>
      <option v-for="t in tiers" :key="t" :value="t">{{ t }}</option>
    </select>
    <span class="tfgm-count">{{ filtered.length }} / {{ pool.length }}</span>
  </div>

  <div class="tfgm-scroll">
    <table class="tfgm-table">
      <thead>
        <tr>
          <th>产物</th>
          <th>机器</th>
          <th>等级</th>
          <th>输入</th>
          <th>耗时</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="recipe in filtered" :key="recipe.id">
          <tr class="tfgm-row" @click="toggle(recipe)">
            <td>
              <a :href="recipeBookUrl(recipe.outputs[0]?.id)" target="_blank" rel="noreferrer" @click.stop>
                {{ ioDisplay(recipe.outputs[0]) }}
              </a>
              <div class="tfgm-muted tfgm-mono tfgm-recipe-id">{{ recipe.id }}</div>
            </td>
            <td class="tfgm-mono">{{ recipe.machine }}</td>
            <td>
              <TierBadge :tier="recipe.tier" :eu="recipe.euPerTick" />
            </td>
            <td>
              <span v-for="(io, i) in recipe.inputs" :key="i" class="tfgm-io">
                {{ ioPrefix(io) }}{{ ioDisplay(io) }}<template v-if="i < recipe.inputs.length - 1">, </template>
              </span>
            </td>
            <td class="tfgm-mono">{{ recipe.duration == null ? '—' : `${recipe.duration}t` }}</td>
          </tr>
          <tr v-if="expanded === recipe.id" class="tfgm-detail">
            <td colspan="5">
              <div class="tfgm-detail__grid">
                <div>
                  <strong>输入（原始 ID）</strong>
                  <ul>
                    <li v-for="(io, i) in recipe.inputs" :key="i" class="tfgm-mono">
                      <span v-if="io.key" class="tfgm-tag">{{ io.key }}</span>
                      {{ io.type }}:{{ io.id }}<template v-if="io.amount && io.amount > 1"> ×{{ io.amount }}</template>
                    </li>
                  </ul>
                </div>
                <div>
                  <strong>输出</strong>
                  <ul>
                    <li v-for="(io, i) in recipe.outputs" :key="i" class="tfgm-mono">
                      {{ io.type }}:{{ io.id }}<template v-if="io.nbt"> {{ io.nbt }}</template>
                    </li>
                  </ul>
                </div>
                <div>
                  <strong>其它</strong>
                  <ul>
                    <li v-if="recipe.pattern" class="tfgm-mono">pattern: {{ recipe.pattern }}</li>
                    <li v-if="recipe.circuit">circuit: {{ recipe.circuit }}</li>
                    <li v-if="recipe.category" class="tfgm-mono">category: {{ recipe.category }}</li>
                    <li>来源: <code>{{ recipe.source.file }}:{{ recipe.source.line }}</code></li>
                    <li>
                      <a :href="recipeBookUrl(recipe.outputs[0]?.id)" target="_blank" rel="noreferrer">
                        在配方书中查看渲染图 ↗
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>

  <details v-if="props.showRemovals && removals" class="tfgm-removals">
    <summary>批量移除的原版配方</summary>
    <pre class="tfgm-mono">{{ JSON.stringify(appliedRemovals(), null, 2) }}</pre>
  </details>
</template>

<style scoped>
.tfgm-row {
  cursor: pointer;
}

.tfgm-row:hover {
  background: var(--vp-c-bg-alt);
}

.tfgm-recipe-id {
  font-size: 0.74em;
  word-break: break-all;
}

.tfgm-io {
  white-space: nowrap;
}

.tfgm-detail td {
  background: var(--vp-c-bg-alt);
}

.tfgm-detail__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  font-size: 0.82rem;
}

.tfgm-detail ul {
  margin: 4px 0 0;
  padding-left: 18px;
}

.tfgm-removals {
  margin-top: 14px;
}

.tfgm-removals pre {
  font-size: 0.78rem;
  overflow-x: auto;
  background: var(--vp-c-bg-alt);
  padding: 10px;
  border-radius: 6px;
}
</style>
