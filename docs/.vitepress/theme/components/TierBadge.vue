<script setup lang="ts">
/** GregTech voltage-tier chip, coloured with GT's own tier palette. */
import { computed } from 'vue';

const props = defineProps<{ tier?: string | null; eu?: number | null }>();

const COLOURS: Record<string, string> = {
  ULV: 'var(--gt-ulv)',
  LV: 'var(--gt-lv)',
  MV: 'var(--gt-mv)',
  HV: 'var(--gt-hv)',
  EV: 'var(--gt-ev)',
  IV: 'var(--gt-iv)',
  LuV: 'var(--gt-luv)',
  ZPM: 'var(--gt-zpm)',
  UV: 'var(--gt-uv)',
  UHV: 'var(--gt-uhv)',
};

const tier = computed(() => (props.tier || '').trim());
const colour = computed(() => COLOURS[tier.value] || 'var(--vp-c-text-3)');
</script>

<template>
  <span
    :class="['tier-badge', tier ? '' : 'tier-badge--none']"
    :style="{ '--tier-colour': colour }"
    :title="eu == null ? '' : `${eu} EU/t`"
  >
    {{ tier || '—' }}
  </span>
</template>
