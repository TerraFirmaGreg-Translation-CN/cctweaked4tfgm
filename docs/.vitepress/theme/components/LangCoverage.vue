<script setup lang="ts">
import { computed } from 'vue';
import { lang } from '../lib/data';

/**
 * Coverage of TFGM's bundled `kubejs/assets/computercraft/lang/*.json`
 * overrides against the pinned CC:T release. A locale with few keys falls back
 * to English in game; `missingUpstreamKeys` names the ones introduced by CC:T
 * after the snapshot was taken.
 */
const locales = computed(() =>
  ((lang.locales || []) as Array<Record<string, unknown>>).slice().sort((a, b) => {
    return Number(b.keys) - Number(a.keys);
  }),
);

const upstreamKeys = computed(() => Number(lang.upstreamKeys) || 0);

const broken = computed(() =>
  locales.value.filter((l) => (l.missingUpstreamKeys as string[]).length > 0),
);
</script>

<template>
<div class="tfgm-toolbar">
  <span class="tfgm-count">上游 en_us 共 {{ upstreamKeys }} 个键 / 打包 {{ locales.length }} 个语种</span>
</div>

<div class="tfgm-scroll">
  <table class="tfgm-table">
    <thead>
      <tr>
        <th>语种</th>
        <th>键数</th>
        <th>缺失上游键</th>
        <th>与 en_us 不同</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="locale in locales" :key="locale.locale as string">
        <td class="tfgm-mono">{{ locale.locale }}</td>
        <td>{{ locale.keys }}</td>
        <td>
          <span v-if="!(locale.missingUpstreamKeys as string[]).length" class="tfgm-muted">0</span>
          <details v-else>
            <summary>{{ (locale.missingUpstreamKeys as string[]).length }}</summary>
            <ul>
              <li v-for="key in locale.missingUpstreamKeys as string[]" :key="key" class="tfgm-mono">
                {{ key }}
              </li>
            </ul>
          </details>
        </td>
        <td>{{ locale.differsFromEnUs }}</td>
      </tr>
    </tbody>
  </table>
</div>

<template v-if="broken.length">
  <h3>上游新增键在覆盖文件中缺失</h3>
  <p>
    CC:T {{ (lang as Record<string, unknown>).version || '' }} 引入了任务书文本包里没有的键。游戏内这些键会回退到英文，
    不会显示 <code>missing translation</code>，但中文文本会缺失。下面的键需要补译：
  </p>
  <ul>
    <li v-for="locale in broken.filter((l) => ['zh_cn', 'zh_tw'].includes(l.locale as string))" :key="locale.locale as string">
      <span class="tfgm-mono">{{ locale.locale }}</span>
      <ul>
        <li v-for="key in locale.missingUpstreamKeys as string[]" :key="key" class="tfgm-mono">{{ key }}</li>
      </ul>
    </li>
  </ul>
</template>
</template>
