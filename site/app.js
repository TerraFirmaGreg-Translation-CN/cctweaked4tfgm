// cctweaked4tfgm client: tweaked.cc-style search, sidebar behaviour and
// in-page filtering. No framework, no hydration.

(() => {
  const body = document.body;

  // --- sidebar -------------------------------------------------------------
  const nav = document.getElementById('nav');
  document.getElementById('nav-reveal')?.addEventListener('click', () => {
    nav?.classList.toggle('nav-links-visible');
  });

  for (const link of document.querySelectorAll('#nav .nav-links a')) {
    link.addEventListener('click', () => nav?.classList.remove('nav-links-visible'));
  }

  for (const heading of document.querySelectorAll('#nav .nav-links > h2')) {
    heading.addEventListener('click', () => {
      heading.classList.toggle('collapsed');
    });
    heading.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        heading.classList.toggle('collapsed');
      }
    });
  }

  // --- search --------------------------------------------------------------
  const searchBox = document.getElementById('search-box');
  const results = document.getElementById('search-results');
  const indexMeta = document.querySelector('meta[name="illuaminate:index"]');
  let searchIndex = null;
  let searchActive = -1;
  let searchRows = [];

  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  async function loadSearchIndex() {
    if (searchIndex) return searchIndex;
    const url = indexMeta?.content;
    if (!url) return { entries: [] };
    const response = await fetch(url);
    if (!response.ok) throw new Error(`search index HTTP ${response.status}`);
    searchIndex = await response.json();
    return searchIndex;
  }

  function closeSearch() {
    body.classList.remove('searching');
    searchActive = -1;
  }

  function highlight(text, query) {
    const source = escapeHtml(text);
    if (!query) return source;
    const index = source.toLowerCase().indexOf(query.toLowerCase());
    if (index < 0) return source;
    return `${source.slice(0, index)}<span class="search-match">${source.slice(
      index,
      index + query.length,
    )}</span>${source.slice(index + query.length)}`;
  }

  function showResults(query) {
    const value = query.trim().toLowerCase();
    if (!value) {
      closeSearch();
      results.replaceChildren();
      return;
    }
    body.classList.add('searching');
    searchRows = [];
    for (const page of searchIndex?.entries || []) {
      if (page.title.toLowerCase().includes(value)) {
        searchRows.push({ page, title: page.title, href: page.url, summary: page.summary });
      }
      for (const heading of page.headings || []) {
        if (heading.title.toLowerCase().includes(value)) {
          searchRows.push({
            page,
            title: heading.title,
            href: `${page.url}#${heading.id}`,
            summary: page.title,
          });
        }
      }
      if (searchRows.length >= 40) break;
    }

    if (!searchRows.length) {
      results.innerHTML = `<div class="search-empty">${escapeHtml(body.dataset.empty || 'No results.')}</div>`;
      return;
    }

    results.innerHTML = `<ul>${searchRows
      .map(
        (row, index) =>
          `<li data-index="${index}"><a class="search-result" href="${row.href}"><h3>${highlight(
            row.title,
            value,
          )}</h3><div class="search-page">${escapeHtml(row.page.title)}</div>${
            row.summary ? `<p class="search-summary">${escapeHtml(row.summary)}</p>` : ''
          }</a></li>`,
      )
      .join('')}</ul>`;
    searchActive = -1;
  }

  function moveSearch(delta) {
    if (!searchRows.length) return;
    searchActive = (searchActive + delta + searchRows.length) % searchRows.length;
    for (const item of results.querySelectorAll('li')) {
      item.classList.toggle('active', Number(item.dataset.index) === searchActive);
    }
    results.querySelector('li.active')?.scrollIntoView({ block: 'nearest' });
  }

  searchBox?.addEventListener('input', async () => {
    try {
      await loadSearchIndex();
      showResults(searchBox.value);
    } catch (error) {
      results.innerHTML = `<div class="search-error">${escapeHtml(error.message)}</div>`;
      body.classList.add('searching');
    }
  });

  searchBox?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveSearch(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveSearch(-1);
    } else if (event.key === 'Enter' && searchActive >= 0) {
      event.preventDefault();
      window.location.href = searchRows[searchActive].href;
    } else if (event.key === 'Escape') {
      closeSearch();
      searchBox.blur();
    }
  });

  document.getElementById('search-overlay')?.addEventListener('click', closeSearch);

  // --- generic filters -----------------------------------------------------
  function applyFilters(browser) {
    const search = browser.querySelector('[data-filter="search"]')?.value.trim().toLowerCase() || '';
    const selects = [...browser.querySelectorAll('select[data-filter]')];
    const cards = [...browser.querySelectorAll('[data-recipe-card], [data-quest-row], [data-material-row]')];
    const apiGroups = [...browser.querySelectorAll('[data-api-group]')];
    let visible = 0;

    if (apiGroups.length) {
      const kind = browser.querySelector('[data-filter="kind"]')?.value || '';
      let apiVisible = 0;
      for (const group of apiGroups) {
        let groupVisible = 0;
        const items = [...group.querySelectorAll('li[data-search]')];
        for (const item of items) {
          const match = (!search || item.dataset.search.includes(search)) && (!kind || group.dataset.kind === kind);
          item.hidden = !match;
          if (match) groupVisible++;
        }
        group.hidden = groupVisible === 0;
        apiVisible += groupVisible;
      }
      visible = apiVisible;
    } else {
      for (const card of cards) {
        let match = !search || (card.dataset.search || '').includes(search);
        for (const select of selects) {
          const filter = select.dataset.filter;
          if (select.value) match = match && card.dataset[filter] === select.value;
        }
        card.hidden = !match;
        if (match) visible++;
      }
    }

    const count = browser.querySelector('[data-count]');
    if (count) {
      const total = apiGroups.length
        ? apiGroups.reduce((sum, group) => sum + group.querySelectorAll('li[data-search]').length, 0)
        : cards.length;
      count.textContent = `${visible} / ${total}`;
    }
    const empty = browser.querySelector('[data-empty]');
    if (empty) empty.hidden = visible > 0;
  }

  for (const browser of document.querySelectorAll('[data-browser]')) {
    for (const input of browser.querySelectorAll('[data-filter]')) {
      input.addEventListener('input', () => applyFilters(browser));
      input.addEventListener('change', () => {
        applyFilters(browser);
        if (input.dataset.filter === 'search') syncTurtleDetails(browser, input.value);
      });
    }
  }

  function syncTurtleDetails(browser, value) {
    const query = value.trim().toLowerCase();
    for (const detail of browser.querySelectorAll('[data-material-detail]')) {
      detail.hidden = Boolean(query) && !detail.dataset.material.toLowerCase().includes(query);
    }
  }

  // --- EMI recipe cards ----------------------------------------------------
  function mountRecipes() {
    const renderer = window.EmiRecipeRenderer;
    if (!renderer) return false;
    if (!document.querySelector('.emi-recipe[data-recipe-id]')) return true;
    renderer
      .mountAll({
        baseUrl: body.dataset.emiRoot,
        locale: body.dataset.emiLocale || 'en_us',
      })
      .catch((error) => console.error('[emi]', error));
    return true;
  }

  if (!mountRecipes()) {
    let attempts = 0;
    const timer = window.setInterval(() => {
      if (mountRecipes() || ++attempts > 40) window.clearInterval(timer);
    }, 100);
  }
})();
