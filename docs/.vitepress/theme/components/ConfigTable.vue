<script setup lang="ts">
import { computed } from 'vue';
import { config } from '../lib/data';

/**
 * The CC:T server/client config as shipped in the pack, diffed against CC:T's
 * own defaults. Every listed key is read from
 * `defaultconfigs/computercraft-server.toml`, so "no overrides" is a positive
 * assertion rather than an omission.
 */
const overrides = computed(() => (config.overrides as string[]) || []);
const values = computed(() => (config.values || {}) as Record<string, unknown>);

const GROUPS = [
  { id: 'http', label: 'HTTP API' },
  { id: 'peripheral', label: '外设' },
  { id: 'turtle', label: '海龟' },
  { id: 'term_sizes', label: '终端尺寸' },
  { id: 'execution', label: '执行' },
];

const rows = computed(() =>
  GROUPS.map((group) => ({
    ...group,
    entries: Object.entries(values.value).filter(([key]) => key.startsWith(`${group.id}.`)),
  })).filter((group) => group.entries.length),
);

const httpRules = computed(() =>
  Object.entries(values.value)
    .filter(([key]) => /^http\.rules\[/.test(key))
    .sort(([a], [b]) => a.localeCompare(b)),
);

function display(value: unknown) {
  if (typeof value === 'string') return value === '' ? '""' : value;
  return JSON.stringify(value);
}
</script>

<template>
<p v-if="overrides.length === 0" class="tfgm-card">
  TFGM <strong>没有覆盖</strong>任何 CC:T 配置项——下面每一项都与上游默认值相同。
</p>
<p v-else class="tfgm-card">
  覆盖了 {{ overrides.length }} 项：<span class="tfgm-mono" v-for="key in overrides" :key="key">{{ key }} </span>
</p>

<template v-for="group in rows" :key="group.id">
  <h3>{{ group.label }}</h3>
  <div class="tfgm-scroll">
    <table class="tfgm-table">
      <thead>
        <tr>
          <th>键</th>
          <th>值</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[key, value] in group.entries" :key="key">
          <td class="tfgm-mono">{{ key }}</td>
          <td class="tfgm-mono">{{ display(value) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<h3>HTTP 规则</h3>
<div class="tfgm-scroll">
  <table class="tfgm-table">
    <thead>
      <tr>
        <th>键</th>
        <th>值</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="[key, value] in httpRules" :key="key">
        <td class="tfgm-mono">{{ key }}</td>
        <td class="tfgm-mono">{{ display(value) }}</td>
      </tr>
    </tbody>
  </table>
</div>
</template>
