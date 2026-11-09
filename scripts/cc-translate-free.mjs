#!/usr/bin/env node
/**
 * Fill in the remaining CC:T Chinese translations with the free
 * clients5.google.com endpoint, using the checkpoint written by the model
 * pass. Falls back to retries and leaves untranslated units untouched.
 *
 * Usage: node scripts/cc-translate-free.mjs [--units] [--meta]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const UNITS = resolve(ROOT, '.cache/cc-units.json');
const PROGRESS = resolve(ROOT, '.cache/cc-progress.json');

const ENDPOINT = 'https://clients5.google.com/translate_a/t';
const MAX_URL = 7000;

const data = JSON.parse(readFileSync(UNITS, 'utf8'));
let progress = {};
try {
  progress = JSON.parse(readFileSync(PROGRESS, 'utf8'));
} catch {
  progress = {};
}

const unique = [...new Set(Object.values(data.pages).flatMap((page) => page.units))];
const pending = unique.filter((unit) => !(unit in progress));
console.log(`unique ${unique.length}, translated ${Object.keys(progress).length}, pending ${pending.length}`);

function batches(items) {
  const out = [];
  let current = [];
  let length = ENDPOINT.length + 80;
  for (const item of items) {
    const added = encodeURIComponent(item).length + 3;
    if (current.length && length + added > MAX_URL) {
      out.push(current);
      current = [];
      length = ENDPOINT.length + 80;
    }
    current.push(item);
    length += added;
  }
  if (current.length) out.push(current);
  return out;
}

function tokenSequence(text) {
  return (text.match(/\[\[\d+\]\]/g) || []).join(',');
}

function cleanup(text) {
  return text
    .replace(/\bmods?\b/gi, '模组')
    .replace(/\bTurtles?\b/g, '海龟')
    .replace(/\bComputers?\b/g, '计算机')
    .replace(/\bPeripherals?\b/g, '外设')
    .replace(/\bMonitors?\b/g, '显示器')
    .replace(/\bModems?\b/g, '调制解调器')
    .replace(/\bRedstone\b/g, '红石')
    .replace(/\bCrafting\b/g, '合成')
    .replace(/\bInventory\b/g, '物品栏')
    .replace(/\bFloppy disks?\b/gi, '软盘')
    .replace(/\bDisk drives?\b/gi, '磁盘驱动器')
    .replace(/电脑/g, '计算机')
    .replace(/外围设备|周边设备/g, '外设')
    .replace(/电缆/g, '线缆');
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function request(batch, attempt = 0) {
  const params = new URLSearchParams();
  params.set('client', 'dict-chrome-ex');
  params.set('sl', 'en');
  params.set('tl', 'zh-CN');
  for (const unit of batch) params.append('q', unit.replace(/\s+/g, ' ').trim());
  try {
    const response = await fetch(`${ENDPOINT}?${params}`, {
      headers: { 'user-agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (!Array.isArray(json) || json.length !== batch.length) {
      throw new Error(`response length ${Array.isArray(json) ? json.length : 'not-array'}`);
    }
    return json;
  } catch (error) {
    if (attempt < 5) {
      await sleep(500 * (attempt + 1));
      return request(batch, attempt + 1);
    }
    if (batch.length > 1) {
      const middle = Math.ceil(batch.length / 2);
      const left = await request(batch.slice(0, middle));
      const right = await request(batch.slice(middle));
      return [...left, ...right];
    }
    throw error;
  }
}

let done = 0;
let failed = 0;
for (const batch of batches(pending)) {
  let translated;
  try {
    translated = await request(batch);
  } catch (error) {
    console.error(`batch failed: ${error.message}`);
    failed += batch.length;
    continue;
  }
  batch.forEach((unit, index) => {
    const out = String(translated[index] || '').trim();
    if (!out || tokenSequence(out) !== tokenSequence(unit)) {
      failed += 1;
      return;
    }
    progress[unit] = cleanup(out);
  });
  done += batch.length;
  if (done % 100 < batch.length) {
    writeFileSync(PROGRESS, JSON.stringify(progress));
    console.log(`progress ${Object.keys(progress).length}/${unique.length}, failed ${failed}`);
  }
}
writeFileSync(PROGRESS, JSON.stringify(progress));
console.log(`finished: translated ${Object.keys(progress).length}/${unique.length}, failed ${failed}`);
