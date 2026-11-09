// Markdown pipeline for the cctweaked4tfgm site: marked + highlight.js,
// docs-style admonitions, heading anchors and locale-aware link rewriting.

import hljs from 'highlight.js';
import { Marked } from 'marked';

const ADMONITION_RE = /^::: *([a-z]+)(?: +(.*))?\n([\s\S]*?)^::: *$/gm;
const UPSTREAM_SECTIONS = new Set([
  'module',
  'library',
  'peripheral',
  'generic_peripheral',
  'event',
  'guide',
  'reference',
]);
const UPSTREAM_URL = /^https?:\/\/tweaked\.cc\/mc-1\.20\.x\/([^?#]*)([?#].*)?$/;

function isUpstreamPath(path) {
  return UPSTREAM_SECTIONS.has(String(path).split('/')[1]);
}

export function parseFrontmatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) return { meta: {}, body: source };
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line.trim());
    if (!pair) continue;
    let value = pair[2].trim().replace(/^['"]|['"]$/g, '');
    if (/^\d+$/.test(value)) value = Number(value);
    meta[pair[1]] = value;
  }
  return { meta, body: source.slice(match[0].length) };
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Rewrites an href found in a page of `locale` into a final site URL. */
export function rewriteHref(href, { locale, prefix, base, pageDir }) {
  if (!href) return href;

  const upstream = UPSTREAM_URL.exec(href);
  if (upstream && upstream[1] && !/\.(?:json|txt|css|js)$/i.test(upstream[1])) {
    const clean = upstream[1].replace(/\.html$/, '').replace(/^index$/, '');
    const suffix = upstream[2] || '';
    return clean ? `${base}${clean}/${suffix}` : `${base}${suffix}`;
  }

  if (/^(?:[a-z]+:|\/\/|#|mailto:)/i.test(href)) return href;

  const [path, hash = ''] = href.split('#');
  let target = path;

  if (target.startsWith('/')) {
    if (locale !== 'en_us' && !isUpstreamPath(target) && !target.startsWith(`/${locale}/`) && target !== `/${locale}`) {
      target = `/${locale}${target}`;
    }
    target = target.replace(/\.md$/, '').replace(/\/index$/, '/');
    if (!/\.[a-z0-9]+$/i.test(target) && !target.endsWith('/')) target = `${target}/`;
    return `${base}${target.replace(/^\//, '')}${hash ? `#${hash}` : ''}`;
  }

  // Relative .md links: resolve against the current page's directory.
  const parts = pageDir ? pageDir.split('/').filter(Boolean) : [];
  for (const segment of target.split('/')) {
    if (segment === '..') parts.pop();
    else if (segment !== '.' && segment !== '') parts.push(segment);
  }
  let resolved = `/${parts.join('/')}`.replace(/\.md$/, '');
  if (!/\.[a-z0-9]+$/i.test(resolved) && !resolved.endsWith('/')) resolved = `${resolved}/`;
  if (locale !== 'en_us' && !isUpstreamPath(resolved)) resolved = `/${locale}${resolved}`;
  return `${base}${resolved.replace(/^\//, '')}${hash ? `#${hash}` : ''}`;
}

export function createMarkdown({ locale, prefix, base }) {
  const headings = [];
  let pageDir = '';

  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    renderer: {
      heading(token) {
        const level = token.depth;
        const text = this.parser.parseInline(token.tokens);
        const id = slugify(text);
        headings.push({ id, level, title: text.replace(/<[^>]+>/g, '') });
        return `<h${level} id="${id}">${text}</h${level}>\n`;
      },
      link(token) {
        const href = rewriteHref(token.href, { locale, prefix, base, pageDir });
        const title = token.title ? ` title="${escapeAttr(token.title)}"` : '';
        return `<a href="${escapeAttr(href)}"${title}>${this.parser.parseInline(token.tokens)}</a>`;
      },
      code(token) {
        const language = (token.lang || '').trim().split(/\s+/)[0];
        let body;
        if (language && hljs.getLanguage(language)) {
          body = hljs.highlight(token.text, { language }).value;
        } else {
          body = escapeHtml(token.text);
        }
        const cls = language ? ` class="language-${escapeAttr(language)}"` : '';
        return `<pre><code${cls}>${body}</code></pre>\n`;
      },
    },
  });

  function renderAdmonitions(source) {
    let index = 0;
    const snippets = [];
    const body = source.replace(ADMONITION_RE, (_, kind, title, inner) => {
      const key = `@@CCT_ADMONITION_${index++}@@`;
      snippets.push({ key, kind, title: title || '', inner });
      return `\n\n<div data-cct-admonition="${index - 1}"></div>\n\n`;
    });
    return { body, snippets };
  }

  function render(source, directory = '') {
    headings.length = 0;
    pageDir = directory;
    const placeholders = [];
    let prepared = source.replace(/<([A-Z][A-Za-z]+)\s*([^>]*?)\/?>/g, (tag) => {
      const key = `@@CCT_COMPONENT_${placeholders.length}@@`;
      placeholders.push({ key, tag });
      return `\n\n<div data-cct-component="${placeholders.length - 1}"></div>\n\n`;
    });

    const admonitions = renderAdmonitions(prepared);
    prepared = admonitions.body;

    let html = marked.parse(prepared);

    for (const [index, placeholder] of placeholders.entries()) {
      html = html.replace(`<div data-cct-component="${index}"></div>`, placeholder.key);
    }
    for (const [index, snippet] of admonitions.snippets.entries()) {
      const outerHeadings = headings.slice();
      const inner = render(snippet.inner.trim(), directory).html;
      headings.length = 0;
      headings.push(...outerHeadings);
      html = html.replace(
        `<div data-cct-admonition="${index}"></div>`,
        `<div class="admonition admonition-${snippet.kind}">${
          snippet.title ? `<p class="admonition-heading">${escapeHtml(snippet.title)}</p>` : ''
        }<div class="admonition-body">${inner}</div></div>`,
      );
      html = html.replace(snippet.key, '');
    }

    return { html, headings: headings.slice(), placeholders };
  }

  return { render };
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}
