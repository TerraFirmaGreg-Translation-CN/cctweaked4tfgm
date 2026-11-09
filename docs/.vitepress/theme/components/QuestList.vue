<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Quest } from '../lib/data';
import { label, questList, recipeBookUrl } from '../lib/data';

/**
 * The CC chapter of the TFGM quest book, with dependency depth computed from
 * the chapter's own `dependencies` graph so the reading order matches what the
 * pack enforces in game.
 */
const locale = ref<'zh_cn' | 'en_us'>('zh_cn');
const search = ref('');

const depth = computed(() => {
  const map = new Map<string, number>();
  const byId = new Map(questList.map((q) => [q.id, q]));
  const visit = (id: string, seen = new Set<string>()): number => {
    if (map.has(id)) return map.get(id) as number;
    const quest = byId.get(id);
    if (!quest || seen.has(id)) return 0;
    seen.add(id);
    const d = quest.dependencies.length
      ? 1 + Math.max(...quest.dependencies.map((dep) => visit(dep, seen)))
      : 0;
    map.set(id, d);
    return d;
  };
  for (const quest of questList) visit(quest.id);
  return map;
});

const rows = computed(() => {
  const q = search.value.trim().toLowerCase();
  return questList
    .map((quest: Quest) => ({
      ...quest,
      depth: depth.value.get(quest.id) ?? 0,
      text: [quest.title.zh_cn, quest.title.en_us, quest.subtitle.zh_cn, ...quest.tasks]
        .join(' ')
        .toLowerCase(),
    }))
    .filter((quest) => !q || quest.text.includes(q))
    .sort((a, b) => a.depth - b.depth || a.title.zh_cn.localeCompare(b.title.zh_cn));
});
</script>

<template>
<div class="tfgm-toolbar">
  <input v-model="search" type="search" placeholder="筛选任务…" aria-label="筛选任务" />
  <select v-model="locale" aria-label="语言">
    <option value="zh_cn">简体中文</option>
    <option value="en_us">English</option>
  </select>
  <span class="tfgm-count">{{ rows.length }} / {{ questList.length }} 个任务</span>
</div>

<div class="tfgm-scroll">
  <table class="tfgm-table">
    <thead>
      <tr>
        <th>层</th>
        <th>任务</th>
        <th>要求物品</th>
        <th>前置</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="quest in rows" :key="quest.id">
        <td class="tfgm-mono">{{ quest.depth }}</td>
        <td>
          {{ quest.title[locale] }}
          <div class="tfgm-muted">{{ quest.subtitle[locale] }}</div>
        </td>
        <td>
          <template v-if="quest.tasks.length">
            <a
              v-for="task in quest.tasks"
              :key="task"
              :href="recipeBookUrl(task)"
              target="_blank"
              rel="noreferrer"
              class="tfgm-task"
              >{{ label(task) }}</a
            >
          </template>
          <span v-else class="tfgm-muted">无物品要求</span>
        </td>
        <td class="tfgm-mono tfgm-muted">{{ quest.dependencies.length }}</td>
      </tr>
    </tbody>
  </table>
</div>
</template>
