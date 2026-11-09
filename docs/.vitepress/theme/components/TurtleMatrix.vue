<script setup lang="ts">
import { computed, ref } from 'vue';
import { label, upgradeList, recipeBookUrl } from '../lib/data';

/**
 * The GT-material turtle tool upgrades TFGM generates from
 * kubejs/server_scripts/computer_craft/data.js. Rows are derived from the
 * shipped item registry, so an added GT material shows up without a code change.
 */
const TOOLS = [
  { type: 'sword', cn: '剑', breakable: 'computercraft:turtle_sword_harvestable' },
  { type: 'pickaxe', cn: '镐', breakable: null },
  { type: 'axe', cn: '斧', breakable: null },
  { type: 'shovel', cn: '铲', breakable: 'computercraft:turtle_shovel_harvestable' },
  { type: 'hoe', cn: '锄', breakable: 'computercraft:turtle_hoe_harvestable' },
];

const search = ref('');
const selected = ref<string | null>(null);

const materials = computed(() => {
  const q = search.value.trim().toLowerCase();
  const set = [...new Set(upgradeList.map((u) => u.material))].sort();
  return q ? set.filter((m) => m.includes(q)) : set;
});

const lookup = computed(() => {
  const map = new Map<string, string>();
  for (const upgrade of upgradeList) map.set(`${upgrade.material}:${upgrade.toolType}`, upgrade.toolItem);
  return map;
});

const selectedRows = computed(() =>
  selected.value
    ? upgradeList.filter((u) => u.material === selected.value)
    : [],
);
</script>

<template>
<div class="tfgm-toolbar">
  <input v-model="search" type="search" placeholder="筛选材料…" aria-label="筛选材料" />
  <span class="tfgm-count">{{ materials.length }} 种材料 / {{ upgradeList.length }} 个升级</span>
</div>

<div class="tfgm-scroll">
  <table class="tfgm-table">
    <thead>
      <tr>
        <th>材料</th>
        <th v-for="tool in TOOLS" :key="tool.type">{{ tool.cn }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="material in materials" :key="material" class="tfgm-row" @click="selected = material">
        <td class="tfgm-mono">{{ material }}</td>
        <td v-for="tool in TOOLS" :key="tool.type" class="tfgm-cell">
          <a
            v-if="lookup.get(`${material}:${tool.type}`)"
            :href="recipeBookUrl(lookup.get(`${material}:${tool.type}`))"
            target="_blank"
            rel="noreferrer"
            @click.stop
            >{{ label(lookup.get(`${material}:${tool.type}`) || '') || '✓' }}</a
          >
          <span v-else class="tfgm-muted">—</span>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<details v-if="selected" class="tfgm-upgrade" open>
  <summary>
    <span class="tfgm-mono">{{ selected }}</span> 的升级数据
  </summary>
  <UpgradeDataFile :material="selected" />
</details>

<style scoped>
.tfgm-cell {
  white-space: nowrap;
  font-size: 0.82rem;
}

.tfgm-upgrade {
  margin-top: 14px;
}
</style>
</template>
