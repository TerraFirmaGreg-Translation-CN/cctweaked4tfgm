<script setup lang="ts">
/** Compact legend of GT voltage tiers as used by the CC recipe set. */
const TIERS = [
  { tier: 'ULV', cn: '超低压', note: '化学浸洗（软盘）' },
  { tier: 'MV', cn: '中压', note: '组装机：线缆、计算机、红石继电器' },
  { tier: 'HV', cn: '高压', note: '组装机：高级计算机、海龟；便携机' },
  { tier: 'EV', cn: '超高压', note: '组装机：高级海龟；高级便携机' },
  { tier: 'IV', cn: '绝缘电压', note: '高级自动化核心升级' },
  { tier: 'LuV', cn: 'Ludicrous 电压', note: '库存管理器、末地核心' },
];
</script>

<template>
<div class="tfgm-grid">
  <div v-for="t in TIERS" :key="t.tier" class="tfgm-card">
    <TierBadge :tier="t.tier"></TierBadge>
    <div><strong>{{ t.cn }}</strong></div>
    <div class="tfgm-muted">{{ t.note }}</div>
  </div>
</div>
</template>
