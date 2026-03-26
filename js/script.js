/**
 * AuraCrafts — Master Script
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. SHOP ENGINE  — renders #productsGrid (shop.html) + #featuredGrid (index)
 *                   with search, category filter, pagination
 * 2. BLOG ENGINE  — renders #latestPostsGrid + #blogGrid from _posts/posts.json
 * 3. NEWS ENGINE  — renders #newsGrid from _news/news.json
 *
 * Exposes global: Shop.cardHTML(p)  ← used by index.html inline script
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ════════════════════════════════════════════════════════════════════════════
   PART 1 — SHOP ENGINE
   ════════════════════════════════════════════════════════════════════════════ */
const Shop = (function() {
  'use strict';

  // Auto-tag a product with a category based on its title
  function categorise(title) {
    const t = (title || '').toLowerCase();
    if (/cookie|clay cutter|cutter stl|roller for clay|fondant/.test(t)) return 'Clay & Cutters';
    if (/earring|ring\b|bracelet|necklace|pendant|jewelry|jewel/.test(t))  return 'Jewelry';
    if (/dragon|whale|bulldog|wolf|rabbit|butterfly|owl|fox|bear|fish|bird|animal|cat\b|dog\b|horse/.test(t)) return 'Animals';
    if (/vase|planter|pot\b|bowl|cup\b|mug\b|container/.test(t))          return 'Vases & Decor';
    if (/christmas|xmas|santa|halloween|easter|holiday|ornament/.test(t))  return 'Seasonal';
    if (/flexi|articulated|print.in.place/.test(t))                        return 'Flexi';
    if (/figurine|statue|model|bust|character|doll|toy/.test(t))           return 'Figurines';
    return 'Other';
  }

  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // Public: build one product card HTML string
  function cardHTML(p) {
    const cat = categorise(p.title);
    return `
    <div class="product-card" data-cat="${esc(cat)}">
      <div class="product-img-wrap">
        <img src="${esc(p.image_url)}"
             alt="${esc(p.title)}"
             loading="lazy"
             onerror="this.src='images/bg-4.jpg'">
        <button class="wishlist-btn"
                aria-label="Add to wishlist"
                onclick="event.preventDefault();Wishlist.toggle(${JSON.stringify(p).replace(/"/g,'&quot;')});this.classList.toggle('active')">♥</button>
      </div>
      <div class="product-body">
        <span class="product-cat-badge">${esc(cat)}</span>
        <h3 class="product-title">${esc(p.title)}</h3>
        <a href="${esc(p.affiliate_url)}"
           target="_blank"
           rel="sponsored noopener"
           class="product-btn"
           onclick="event.stopPropagation()">⬇ Download STL</a>
      </div>
    </div>`;
  }

  /* ── Shop page: full engine with filter + pagination ─────────────────────── */
  function initShopPage() {
    const grid       = document.getElementById('productsGrid');
    const searchEl   = document.getElementById('searchFilter');
    const catEl      = document.getElementById('categoryFilter');
    const clearBtn   = document.getElementById('clearFilters');
    const pagEl      = document.getElementById('pagination');
    if (!grid || typeof PRODUCTS === 'undefined') return;

    const PER_PAGE = 24;
    let page = 1;
    let filtered = [];

    // Populate category dropdown
    const cats = ['Clay & Cutters','Jewelry','Animals','Vases & Decor','Seasonal','Flexi','Figurines','Other'];
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      catEl.appendChild(opt);
    });

    function getFiltered() {
      const q   = (searchEl ? searchEl.value : '').toLowerCase().trim();
      const cat = catEl ? catEl.value : '';
      return PRODUCTS.filter(p => {
        const matchQ   = !q   || p.title.toLowerCase().includes(q);
        const matchCat = !cat || categorise(p.title) === cat;
        return matchQ && matchCat;
      });
    }

    function renderPage() {
      filtered = getFiltered();
      const total = filtered.length;
      const pages = Math.ceil(total / PER_PAGE);
      page = Math.min(page, Math.max(1, pages));
      const slice = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

      grid.innerHTML = slice.length
        ? slice.map(cardHTML).join('')
        : `<div class="grid-empty" style="grid-column:1/-1"><span class="empty-icon">🔍</span><p>No designs found. Try a different search.</p></div>`;

      renderPagination(pages);
    }

    function renderPagination(pages) {
      if (!pagEl) return;
      if (pages <= 1) { pagEl.innerHTML=''; return; }
      let html = '';
      html += `<button class="page-btn" ${page===1?'disabled':''} onclick="Shop._page(${page-1})">‹</button>`;
      const start = Math.max(1, page-2), end = Math.min(pages, page+2);
      if (start > 1) html += `<button class="page-btn" onclick="Shop._page(1)">1</button>${start>2?'<span style="color:rgba(255,255,255,.4);padding:0 4px">…</span>':''}`;
      for (let i=start; i<=end; i++)
        html += `<button class="page-btn${i===page?' active':''}" onclick="Shop._page(${i})">${i}</button>`;
      if (end < pages) html += `${end<pages-1?'<span style="color:rgba(255,255,255,.4);padding:0 4px">…</span>':''}<button class="page-btn" onclick="Shop._page(${pages})">${pages}</button>`;
      html += `<button class="page-btn" ${page===pages?'disabled':''} onclick="Shop._page(${page+1})">›</button>`;
      html += `<span style="color:rgba(255,255,255,.5);font-size:.8rem;margin-left:.5rem">${filtered.length} designs</span>`;
      pagEl.innerHTML = html;
    }

    // Expose for pagination buttons
    Shop._page = function(n) {
      page = n;
      renderPage();
      window.scrollTo({top: grid.getBoundingClientRect().top + window.scrollY - 100, behavior:'smooth'});
    };

    let debounce;
    if (searchEl) searchEl.addEventListener('input', () => { clearTimeout(debounce); debounce=setTimeout(()=>{page=1;renderPage();},220); });
    if (catEl)    catEl.addEventListener('change', () => { page=1; renderPage(); });
    if (clearBtn) clearBtn.addEventListener('click', () => {
      if (searchEl) searchEl.value = '';
      if (catEl)    catEl.value    = '';
      page=1; renderPage();
    });

    renderPage();
  }

  /* ── Homepage featured grid: random 8 ───────────────────────────────────── */
  function initFeaturedGrid() {
    const grid = document.getElementById('featuredGrid');
    if (!grid || typeof PRODUCTS === 'undefined') return;
    const featured = PRODUCTS.slice().sort(()=>Math.random()-0.5).slice(0,8);
    grid.innerHTML = featured.map(cardHTML).join('');
  }

  return { cardHTML, initShopPage, initFeaturedGrid };
})();


/* ════════════════════════════════════════════════════════════════════════════
   PART 2 & 3 — BLOG + NEWS ENGINE
   ════════════════════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  const POSTS_URL = '/_posts/posts.json';
  const NEWS_URL  = '/_news/news.json';
  const FB_POST   = '/images/bg-4.jpg';

  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function fmtDate(iso, short) {
    if (!iso) return '';
    try {
      const opts = short
        ? {month:'short',day:'numeric',year:'numeric'}
        : {year:'numeric',month:'long',day:'numeric'};
      return new Date(iso).toLocaleDateString('en-US', opts);
    } catch(_) { return iso; }
  }

  async function fetchJson(url) {
    try {
      const r = await fetch(url, {headers:{'Accept':'application/json'},cache:'no-cache'});
      if (r.status===404) return [];
      if (!r.ok) return [];
      const t = await r.text();
      if (!t||!t.trim()) return [];
      const d = JSON.parse(t);
      return Array.isArray(d) ? d : [];
    } catch(_) { return []; }
  }

  function skeleton() {
    return `<div class="card--skeleton" aria-hidden="true">
      <div class="skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton-line w-50"></div>
        <div class="skeleton-line w-90 h-20"></div>
        <div class="skeleton-line w-75"></div>
        <div class="skeleton-line w-90"></div>
      </div>
    </div>`;
  }

  function empty(icon, msg) {
    return `<div class="grid-empty"><span class="empty-icon">${icon}</span><p>${esc(msg)}</p></div>`;
  }

  function postCard(p) {
    const img = p.image ? esc(p.image) : FB_POST;
    const date = fmtDate(p.date, true);
    return `<a href="${esc(p.url||'#')}" class="blog-card">
      <div class="blog-card-img" style="background-image:url('${img}')" role="img" aria-label="${esc(p.title)}"></div>
      <div class="blog-card-body">
        <div class="blog-meta">3D Printing${date?` · <time datetime="${esc(p.date)}">${date}</time>`:''}</div>
        <h3>${esc(p.title||'Article')}</h3>
        ${p.excerpt?`<p>${esc(p.excerpt)}</p>`:''}
        <div class="blog-read-more">Read article →</div>
      </div>
    </a>`;
  }

  function newsCard(p) {
    const date = fmtDate(p.date, false);
    const imgHtml = p.image
      ? `<img class="news-card-img" src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">`
      : `<div class="news-card-img-placeholder" aria-hidden="true">📡</div>`;
    return `<a href="${esc(p.url||'#')}" class="news-card">
      ${imgHtml}
      <div class="news-card-body">
        <div class="news-card-meta">${date?`<time datetime="${esc(p.date)}">${date}</time>`:'3D Printing News'}</div>
        <h3>${esc(p.title||'News')}</h3>
        ${p.excerpt?`<p>${esc(p.excerpt)}</p>`:''}
        <span class="news-card-cta">Read more →</span>
      </div>
    </a>`;
  }

  async function renderLatestPosts() {
    const el = document.getElementById('latestPostsGrid');
    if (!el) return;
    el.innerHTML = Array(3).fill(skeleton()).join('');
    const data = await fetchJson(POSTS_URL);
    if (!data.length) { el.innerHTML = empty('✍️','New articles coming soon!'); return; }
    el.innerHTML = data.slice(0,3).map(postCard).join('');
  }

  async function renderBlogGrid() {
    const el = document.getElementById('blogGrid');
    if (!el) return;
    el.innerHTML = Array(6).fill(skeleton()).join('');
    const data = await fetchJson(POSTS_URL);
    if (!data.length) { el.innerHTML = empty('📝','No articles yet. First ones are on their way!'); return; }
    el.innerHTML = data.map(postCard).join('');
  }

  async function renderNewsGrid() {
    const el = document.getElementById('newsGrid');
    if (!el) return;
    const limit = parseInt(el.dataset.limit||'3',10);
    el.innerHTML = Array(Math.min(limit,6)).fill(skeleton()).join('');
    const data = await fetchJson(NEWS_URL);
    if (!data.length) { el.innerHTML = empty('📡','News updates every 12 hours!'); return; }
    el.innerHTML = data.slice(0,limit).map(newsCard).join('');
  }

  function init() {
    // Shop
    Shop.initShopPage();
    Shop.initFeaturedGrid();
    // Blog & News
    renderLatestPosts();
    renderBlogGrid();
    renderNewsGrid();
  }

  if (document.readyState==='loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
