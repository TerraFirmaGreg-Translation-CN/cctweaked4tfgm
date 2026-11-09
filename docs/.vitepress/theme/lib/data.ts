// Shared accessors over the generated TFGM data (docs/data). Components import
// this instead of touching JSON shapes directly, so a schema bump is one edit.

import {
  TAG,
  meta,
  recipes,
  turtleUpgrades,
  quests,
  config,
  lang,
  labels,
} from '../../../data/index.ts';
import ccIndex from '../../../data/cc-index.json';

export { TAG, meta, config, lang };

export interface RecipeIO {
  type: 'item' | 'tag' | 'fluid' | 'material' | 'list' | 'unknown';
  id?: string;
  amount?: number;
  nbt?: string;
  key?: string;
  items?: RecipeIO[];
  displayId?: string;
}

export interface Recipe {
  index: number;
  kind: string;
  id: string;
  machine: string;
  tier: string | null;
  euPerTick: number | null;
  duration: number | null;
  circuit: number | null;
  category: string | null;
  pattern: string | null;
  inputs: RecipeIO[];
  outputs: RecipeIO[];
  removal?: unknown[];
  source: { file: string; line: number };
}

export interface TurtleUpgrade {
  upgradeId: string;
  material: string;
  toolType: string;
  toolItem: string;
  adjective: string;
  breakable: string | null;
  consumeDurability: string;
  allowEnchantments: boolean;
  dataFile: string;
}

export interface Quest {
  id: string;
  titleKey: string;
  title: Record<string, string>;
  subtitle: Record<string, string>;
  dependencies: string[];
  tasks: string[];
}

export const recipeList = recipes as Recipe[];
export const upgradeList = turtleUpgrades as TurtleUpgrade[];
export const questList = quests as Quest[];

export const craftRecipes = recipeList.filter((r) => r.kind !== 'remove');
export const removals = recipeList.find((r) => r.kind === 'remove');

export const TIERS = ['ULV', 'LV', 'MV', 'HV', 'EV', 'IV', 'LuV', 'ZPM', 'UV', 'UHV'] as const;

/** Display label for an item id, falling back to the raw id. */
export function label(id: string, locale = 'zh_cn'): string {
  const map = (labels as Record<string, Record<string, string>>)[locale] || {};
  return map[id] || id;
}

/** `/cctweaked4tfgm/` base + the published recipe-book deep link. */
export function recipeBookUrl(itemId?: string, locale = 'zh_cn'): string {
  const base = 'https://wiki.terrafirmagreg.team/modern/recipe-book/';
  const params = new URLSearchParams();
  params.set('bundle', `tfg-${TAG}`);
  if (locale) params.set('lang', locale);
  if (itemId) params.set('item', itemId.toLowerCase());
  return `${base}?${params.toString()}`;
}

export function questBookUrl(): string {
  const base = 'https://wiki.terrafirmagreg.team/modern/quest-book/';
  const params = new URLSearchParams();
  params.set('lang', 'zh_cn');
  params.set('search', 'ComputerCraft');
  return `${base}?${params.toString()}`;
}

/** Pinned upstream API index, mirrored from tweaked.cc (see scripts/build-cc-index.mjs). */
export const apiIndex = ccIndex as {
  ccVersion: string;
  count: number;
  groups: Record<string, string[]>;
  entries: Record<string, { kind: string; module: string; name: string; summary: string; url: string }>;
};
