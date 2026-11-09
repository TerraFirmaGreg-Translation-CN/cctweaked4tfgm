#!/usr/bin/env node
/**
 * Translate the mirrored CC:T documentation into Simplified Chinese.
 *
 * Usage:
 *   node scripts/cc-translate.mjs extract   # write .cache/cc-units.json
 *   node scripts/cc-translate.mjs apply     # apply .cache/cc-translations.json
 *
 * Model calls are orchestrated from the agent runtime; this script only
 * tokenises the HTML (so tags, code and identifiers survive) and applies the
 * returned strings.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'node-html-parser';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CC = join(ROOT, 'docs/data/cc');
const OUT = join(CC, 'zh_cn');
const CACHE = join(ROOT, '.cache/cc-units.json');
const PROGRESS_FILE = join(ROOT, '.cache/cc-progress.json');

const BLOCK_TAGS = new Set([
  'div', 'section', 'article', 'aside', 'header', 'footer', 'main', 'nav',
  'ul', 'ol', 'dl', 'table', 'thead', 'tbody', 'tr', 'blockquote', 'pre',
  'figure', 'figcaption', 'details', 'summary',
]);
const TARGET_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'dt', 'dd', 'th', 'td',
  'caption', 'figcaption', 'summary',
]);
const RAW_TAGS = new Set(['code', 'kbd', 'pre', 'script', 'style', 'img', 'br', 'hr', 'input']);
const SKIP_ANCESTORS = new Set(['pre', 'code', 'kbd', 'script', 'style']);

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tagName(node) {
  return (node.rawTagName || '').toLowerCase();
}

function isInsideSkipped(node) {
  for (let parent = node.parentNode; parent; parent = parent.parentNode) {
    if (SKIP_ANCESTORS.has(tagName(parent))) return true;
  }
  return false;
}

function hasLetters(text) {
  return /[A-Za-z]/.test(text);
}

/** Serialise one element's own text and inline children. */
function serializeUnit(element) {
  const tokens = [];

  const add = (value, node) => {
    const id = tokens.length;
    tokens.push({ value, node: node || null });
    return `[[${id}]]`;
  };

  const walk = (node) => {
    if (node.nodeType === 3) return escapeHtml(node.text);
    if (node.nodeType !== 1) return '';
    const tag = tagName(node);
    if (RAW_TAGS.has(tag) || BLOCK_TAGS.has(tag)) return add(node.outerHTML, node);
    const open = node.outerHTML.slice(0, node.outerHTML.indexOf('>') + 1);
    const close = `</${node.rawTagName}>`;
    return `${add(open)}${node.childNodes.map(walk).join('')}${add(close)}`;
  };

  const text = element.childNodes.map(walk).join('').replace(/\n+/g, ' ').trim();
  return { text, tokens, element };
}

function collectTargets(html) {
  const root = parse(`<div id="__cct_root">${html}</div>`, {
    comment: true,
    blockTextElements: { script: true, style: true, pre: true, code: true },
  });
  const container = root.querySelector('#__cct_root');
  const units = [];
  for (const element of root.querySelectorAll('*')) {
    const tag = tagName(element);
    if (!TARGET_TAGS.has(tag)) continue;
    if (isInsideSkipped(element)) continue;
    if (element.classList?.contains('definition-name')) continue;
    if ((tag === 'dt' || tag === 'th') && element.querySelector('.definition-name')) continue;
    const unit = serializeUnit(element);
    const prose = unit.text.replace(/\[\[\d+\]\]/g, '');
    if (!hasLetters(prose)) continue;
    // Function signatures and API identifiers are never translated.
    if (/^[A-Za-z_][\w.]*\(/.test(prose.trim())) continue;
    units.push(unit);
  }
  return { root, container, units };
}

function pageEntries() {
  const manifest = JSON.parse(readFileSync(join(CC, 'pages.json'), 'utf8'));
  const entries = [];
  for (const group of manifest.groups) {
    for (const page of group.pages) {
      entries.push({
        file: join(CC, page.file),
        out: join(OUT, page.file),
        url: page.url,
        title: page.title,
        description: page.description,
        group: group.title,
        page,
      });
    }
  }
  return { manifest, entries };
}

function extract() {
  const { manifest, entries } = pageEntries();
  const payload = { version: manifest.version, pages: {} };

  const home = join(CC, 'home.html');
  if (existsSync(home)) {
    const html = readFileSync(home, 'utf8');
    const { units } = collectTargets(html);
    payload.pages['/'] = {
      sourceHash: createHash('sha256').update(html).digest('hex').slice(0, 16),
      units: units.map((unit) => unit.text),
    };
  }

  for (const entry of entries) {
    const html = readFileSync(entry.file, 'utf8');
    const { units } = collectTargets(html);
    payload.pages[entry.url] = {
      sourceHash: createHash('sha256').update(html).digest('hex').slice(0, 16),
      units: units.map((unit) => unit.text),
    };
  }

  mkdirSync(dirname(CACHE), { recursive: true });
  writeFileSync(CACHE, JSON.stringify(payload, null, 2));
  const count = Object.values(payload.pages).reduce((sum, page) => sum + page.units.length, 0);
  const chars = Object.values(payload.pages).reduce(
    (sum, page) => sum + page.units.reduce((s, unit) => s + unit.length, 0),
    0,
  );
  console.log(`Wrote ${CACHE}: ${Object.keys(payload.pages).length} pages, ${count} units, ${chars} chars`);
}

function apply() {
  const progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
  const { manifest } = pageEntries();
  const outManifest = { version: manifest.version, source: manifest.source, groups: [], pages: {} };
  const targets = [{ file: join(CC, 'home.html'), out: join(OUT, 'home.html'), url: '/' }];

  for (const group of manifest.groups) {
    const groupOut = { title: group.title, pages: [] };
    for (const page of group.pages) {
      const target = {
        file: join(CC, page.file),
        out: join(OUT, page.file),
        url: page.url,
        page,
        group: group.title,
      };
      targets.push(target);
      groupOut.pages.push({ ...page });
    }
    outManifest.groups.push(groupOut);
  }

  for (const target of targets) {
    const html = readFileSync(target.file, 'utf8');
    const { root, container, units } = collectTargets(html);

    const depth = (element) => {
      let n = 0;
      for (let parent = element.parentNode; parent; parent = parent.parentNode) {
        if (TARGET_TAGS.has(tagName(parent)) || BLOCK_TAGS.has(tagName(parent))) n++;
      }
      return n;
    };
    const order = units.map((unit) => unit).sort((a, b) => depth(b.element) - depth(a.element));

    for (const unit of order) {
      let out = progress[unit.text] ?? unit.text;
      out = out.replace(/\[\[(\d+)\]\]/g, (match, id) => {
        const token = unit.tokens[Number(id)];
        if (!token) return match;
        return token.node ? token.node.outerHTML : token.value;
      });
      unit.element.innerHTML = out;
    }

    let output = container.innerHTML;
    if (target.url === '/module/term/') {
      output = output
        .replace(
          `The simplest operation one can perform on a terminal is displaying (or writing) some text. This can be performed with
the <a href="/module/term/#v:write" class="reference"><code>term.write</code></a> method.`,
          `在终端上能执行的最简单操作是显示（或写入）一些文本。这可以通过 <a href="/module/term/#v:write" class="reference"><code>term.write</code></a> 方法完成。`,
        )
        .replace(
          `So far we've been writing text in black and white. However, advanced computers are also capable of displaying text
in a variety of colours, with the <a href="/module/term/#v:setTextColour" class="reference"><code>term.setTextColour</code></a> and <a href="/module/term/#v:setBackgroundColour" class="reference"><code>term.setBackgroundColour</code></a> functions.`,
          `到目前为止，我们写入的都是黑白文本。不过，高级计算机还可以通过 <a href="/module/term/#v:setTextColour" class="reference"><code>term.setTextColour</code></a> 和 <a href="/module/term/#v:setBackgroundColour" class="reference"><code>term.setBackgroundColour</code></a> 函数显示多种颜色的文本。`,
        );
    }
    mkdirSync(dirname(target.out), { recursive: true });
    writeFileSync(target.out, output);

    if (target.page) {
      const translatedTitle = root.querySelector('h1')?.text.trim() || target.page.title;
      const translatedDescription =
        root.querySelector('p')?.text.trim().replace(/\s+/g, ' ').slice(0, 300) || target.page.description;
      const outPage = {
        ...target.page,
        title: translatedTitle,
        description: translatedDescription,
        sourceHash: createHash('sha256').update(html).digest('hex').slice(0, 16),
      };
      outManifest.pages[target.page.url] = outPage;
      for (const group of outManifest.groups) {
        const page = group.pages.find((p) => p.url === target.page.url);
        if (page) {
          page.title = translatedTitle;
          page.description = translatedDescription;
          page.sourceHash = outPage.sourceHash;
        }
      }
    }
  }
  writeFileSync(join(OUT, 'pages.json'), `${JSON.stringify(outManifest, null, 2)}\n`);
  console.log(`Wrote ${targets.length} Chinese pages to ${OUT}`);
}

const command = process.argv[2];
if (command === 'extract') extract();
else if (command === 'apply') apply();
else {
  console.error('usage: node scripts/cc-translate.mjs extract|apply');
  process.exit(1);
}
