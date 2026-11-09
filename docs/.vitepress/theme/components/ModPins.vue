<script setup lang="ts">
import { computed } from 'vue';
import { meta } from '../lib/data';

/**
 * The CC-adjacent mod set pinned by this TFGM release, straight from
 * pakku-lock.json. Types matter: the texture pack is CLIENT + RESOURCE_PACK.
 */
const deps = computed(() => (meta.dependencies || []) as Array<Record<string, string>>);

function typeLabel(type: string) {
  if (type === 'RESOURCE_PACK') return '资源包';
  if (type === 'MOD') return '模组';
  return type.toLowerCase();
}
</script>

<template>
  <div class="tfgm-scroll">
    <table class="tfgm-table">
      <thead>
        <tr>
          <th>项目</th>
          <th>版本</th>
          <th>侧</th>
          <th>类型</th>
          <th>文件</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="dep in deps" :key="dep.slug">
          <td>
            <a :href="dep.url" target="_blank" rel="noreferrer">{{ dep.name }}</a>
            <div class="tfgm-muted tfgm-mono">{{ dep.slug }}</div>
          </td>
          <td class="tfgm-mono">{{ dep.version }}</td>
          <td>{{ dep.side }}</td>
          <td>{{ typeLabel(dep.type) }}</td>
          <td class="tfgm-mono tfgm-file">{{ dep.file }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.tfgm-file {
  font-size: 0.78em;
  word-break: break-all;
}
</style>
