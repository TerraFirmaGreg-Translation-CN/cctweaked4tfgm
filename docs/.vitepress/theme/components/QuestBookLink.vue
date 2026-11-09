<script setup lang="ts">
import { questBookUrl } from '../lib/data';
</script>

<template>
  <p>
    <a :href="questBookUrl()" target="_blank" rel="noreferrer" class="tfgm-card tfgm-questbook">
      在 TerraFirmaGreg 任务书中搜索 ComputerCraft ↗
    </a>
  </p>
</template>

<style scoped>
.tfgm-questbook {
  display: inline-block;
  text-decoration: none;
}

.tfgm-questbook:hover {
  border-color: var(--vp-c-brand-1);
}
</style>
