<script setup lang="ts">
import { computed } from 'vue';
import { upgradeList } from '../lib/data';

/**
 * Shows the exact JSON TFGM writes to
 * `data/computercraft/computercraft/turtle_upgrades/<material>_<type>.json`,
 * reproduced from the extracted upgrade table (the script itself builds the
 * object field by field in data.js).
 */
const props = defineProps<{ material: string }>();

const rows = computed(() => upgradeList.filter((u) => u.material === props.material));

function json(upgrade: (typeof upgradeList)[number]) {
  const body: Record<string, unknown> = {
    type: 'computercraft:tool',
    item: upgrade.toolItem,
    adjective: upgrade.adjective,
    allowEnchantments: upgrade.allowEnchantments,
    consumeDurability: upgrade.consumeDurability,
  };
  if (upgrade.breakable) body.breakable = upgrade.breakable;
  return JSON.stringify(body, null, 2);
}
</script>

<template>
<div v-for="upgrade in rows" :key="upgrade.upgradeId" class="tfgm-upgrade__file">
  <div class="tfgm-muted tfgm-mono">{{ upgrade.dataFile }}</div>
  <pre class="tfgm-mono">{{ json(upgrade) }}</pre>
</div>
</template>
