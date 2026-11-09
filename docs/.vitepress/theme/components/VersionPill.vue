<script setup lang="ts">
import { computed } from 'vue';
import { meta } from '../lib/data';

/** TFGM release + pinned CC:T version, rendered from generated data. */
const props = withDefaults(defineProps<{ showCore?: boolean }>(), { showCore: false });

const tag = computed(() => meta.modpack.tag as string);
const cc = computed(() => meta.ccTweaked as Record<string, string>);
const core = computed(() => (meta.core || {}) as Record<string, string>);
const released = computed(() => meta.modpack.released as string);
</script>

<template>
  <p class="tfgm-pill-row">
    <span class="tfgm-tag">TFGM {{ tag }}</span>
    <a class="tfgm-tag" :href="cc.url" target="_blank" rel="noreferrer">
      CC: Tweaked {{ cc.version }}
    </a>
    <a v-if="props.showCore && core.version" class="tfgm-tag" :href="core.url" target="_blank" rel="noreferrer">
      Core {{ core.version }}
    </a>
    <span class="tfgm-muted tfgm-pill-row__date" v-if="released">发布 {{ released }}</span>
  </p>
</template>

<style scoped>
.tfgm-pill-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  margin: 10px 0 16px;
}

.tfgm-pill-row__date {
  font-size: 0.8rem;
}
</style>
