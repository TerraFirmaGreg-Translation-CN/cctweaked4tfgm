<script setup lang="ts">
import { computed, ref } from 'vue';
import { apiIndex as data } from '../lib/data';

/**
 * Renderer for the upstream tweaked.cc index. Groups mirror CC:T's own
 * module-kinds (module / peripheral / generic_peripheral / event / reference /
 * guide / library) so the sidebar order matches the upstream docs.
 */
const KIND_LABELS: Record<string, string> = {
  module: '全局与库',
  peripheral: '外设',
  generic_peripheral: '通用外设',
  event: '事件',
  reference: '参考',
  guide: '指南',
  library: '模块',
};

const KIND_ORDER = ['module', 'peripheral', 'generic_peripheral', 'event', 'library', 'guide', 'reference'];

const search = ref('');
const kind = ref('');

const kinds = computed(() => {
  const present = new Set(Object.keys(data.groups).map((key) => key.split(':')[0]));
  return KIND_ORDER.filter((k) => present.has(k));
});

const rows = computed(() => {
  const q = search.value.trim().toLowerCase();
  const filtered = Object.entries(data.entries).filter(([symbol, entry]) => {
    if (kind.value && entry.kind !== kind.value) return false;
    if (!q) return true;
    return (
      symbol.toLowerCase().includes(q) ||
      entry.name.toLowerCase().includes(q) ||
      entry.summary.toLowerCase().includes(q)
    );
  });
  return filtered.sort(([a], [b]) => a.localeCompare(b));
});

const grouped = computed(() => {
  const out: Record<string, Array<[string, (typeof data.entries)[string]]>> = {};
  for (const row of rows.value) {
    const entry = row[1];
    const key = `${entry.kind}:${entry.module}`;
    (out[key] ||= []).push(row);
  }
  return Object.entries(out).sort(([a], [b]) => {
    const [ka, ma] = a.split(':');
    const [kb, mb] = b.split(':');
    const order = KIND_ORDER.indexOf(ka) - KIND_ORDER.indexOf(kb);
    return order || ma.localeCompare(mb);
  });
});
</script>

<template>
<div class="tfgm-toolbar">
  <input v-model="search" type="search" placeholder="搜索函数 / 事件 / 外设…" aria-label="搜索 API" />
  <select v-model="kind" aria-label="类别">
    <option value="">全部类别</option>
    <option v-for="k in kinds" :key="k" :value="k">{{ KIND_LABELS[k] || k }}</option>
  </select>
  <span class="tfgm-count">{{ rows.length }} / {{ data.count }} · CC:T {{ data.ccVersion }}</span>
</div>

<section v-for="[key, group] in grouped" :key="key" class="tfgm-api-group">
  <h3>
    {{ KIND_LABELS[group[0][1].kind] || group[0][1].kind }}
    <span class="tfgm-mono tfgm-muted">{{ group[0][1].module }}</span>
  </h3>
  <ul>
    <li v-for="[symbol, entry] in group" :key="symbol">
      <a :href="entry.url" target="_blank" rel="noreferrer" class="tfgm-mono">{{ entry.name }}</a>
      <span class="tfgm-muted"> — {{ entry.summary }}</span>
    </li>
  </ul>
</section>
</template>

<style scoped>
.tfgm-api-group {
  margin-top: 22px;
}

.tfgm-api-group h3 {
  margin-bottom: 4px;
}

.tfgm-api-group ul {
  margin: 0;
  padding-left: 20px;
  font-size: 0.88rem;
}

.tfgm-api-group li {
  margin: 2px 0;
}
</style>