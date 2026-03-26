/**
 * AuraCrafts — Frontend Dynamic Blog & News Renderer
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches /_posts/posts.json  → renders cards into:
 *   #latestPostsGrid  (homepage – 3 cards)
 *   #blogGrid         (blog.html – all cards)
 *
 * Fetches /_news/news.json   → renders cards into:
 *   #newsGrid         (wherever placed – 3 cards on homepage, all on news page)
 *
 * Gracefully handles: 404, empty JSON, network errors, missing DOM targets.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ── Config ────────────────────────────────────────────────────────────── */
  const POSTS_URL         = '/_posts/posts.json';
  const NEWS_URL          = '/_news/news.json';
  const FALLBACK_IMG_POST = '/images/bg-4.jpg';

  /* ── Utilities ─────────────────────────────────────────────────────────── */
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#039;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch (_) { return iso; }
  }

  function formatDateShort(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    } catch (_) { return iso; }
  }

  /* ── Safe JSON fetch ───────────────────────────────────────────────────── */
  async function fetchJson(url) {
    let response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache'
      });
    } catch (networkErr) {
      console.warn('[AuraCrafts] Network error fetching', url, networkErr.message);
      return [];
    }

    if (response.status === 404) return [];

    if (!response.ok) {
      console.warn('[AuraCrafts] HTTP', response.status, 'fetching', url);
      return [];
    }

    const text = await response.text();
    if (!text || !text.trim()) return [];

    try {
      const data = JSON.parse(text);
      return Array.isArray(data) ? data : [];
    } catch (parseErr) {
      console.warn('[AuraCrafts] JSON parse error in', url, parseErr.message);
      return [];
    }
  }

  /* ── Skeleton card ─────────────────────────────────────────────────────── */
  function skeletonCard() {
    return `<div class="card--skeleton" aria-hidden="true">
      <div class="skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton-line w-50"></div>
        <div class="skeleton-line w-90 h-20"></div>
        <div class="skeleton-line w-75"></div>
        <div class="skeleton-line w-90"></div>
        <div class="skeleton-line w-50"></div>
      </div>
    </div>`;
  }

  function showSkeletons(el, count) {
    el.innerHTML = Array(count).fill(skeletonCard()).join('');
  }

  /* ── Empty state ───────────────────────────────────────────────────────── */
  function emptyState(icon, msg) {
    return `<div class="grid-empty">
      <span class="empty-icon">${icon}</span>
      <p>${esc(msg)}</p>
    </div>`;
  }

  /* ── Blog / Post card HTML ─────────────────────────────────────────────── */
  function buildPostCard(item) {
    const title   = esc(item.title   || 'Untitled Article');
    const excerpt = esc(item.excerpt || '');
    const url     = esc(item.url     || '#');
    const date    = formatDateShort(item.date);
    const isoDate = esc(item.date    || '');
    const imgSrc  = item.image ? esc(item.image) : FALLBACK_IMG_POST;

    return `<a href="${url}" class="blog-card">
      <div class="blog-card-img"
           style="background-image:url('${imgSrc}')"
           role="img"
           aria-label="${title}">
      </div>
      <div class="blog-card-body">
        <div class="blog-meta">
          3D Printing${date ? ` · <time datetime="${isoDate}">${date}</time>` : ''}
        </div>
        <h3>${title}</h3>
        ${excerpt ? `<p>${excerpt}</p>` : ''}
        <div class="blog-read-more">Read article →</div>
      </div>
    </a>`;
  }

  /* ── News card HTML ────────────────────────────────────────────────────── */
  function buildNewsCard(item) {
    const title   = esc(item.title   || 'Latest News');
    const excerpt = esc(item.excerpt || '');
    const url     = esc(item.url     || '#');
    const date    = formatDate(item.date);
    const isoDate = esc(item.date    || '');
    const imgSrc  = item.image ? esc(item.image) : null;

    const imgHtml = imgSrc
      ? `<img class="news-card-img" src="${imgSrc}" alt="${title}" loading="lazy">`
      : `<div class="news-card-img-placeholder" aria-hidden="true">📡</div>`;

    return `<a href="${url}" class="news-card" aria-label="${title}">
      ${imgHtml}
      <div class="news-card-body">
        <div class="news-card-meta">
          ${date ? `<time datetime="${isoDate}">${date}</time>` : '3D Printing News'}
        </div>
        <h3>${title}</h3>
        ${excerpt ? `<p>${excerpt}</p>` : ''}
        <span class="news-card-cta">Read more →</span>
      </div>
    </a>`;
  }

  /* ── Render: Latest Posts (homepage – 3 items) ─────────────────────────── */
  async function renderLatestPosts() {
    const el = document.getElementById('latestPostsGrid');
    if (!el) return;

    showSkeletons(el, 3);
    const data = await fetchJson(POSTS_URL);

    if (!data.length) {
      el.innerHTML = emptyState('✍️', 'New articles are being written. Check back soon!');
      return;
    }
    el.innerHTML = data.slice(0, 3).map(buildPostCard).join('');
  }

  /* ── Render: All Posts (blog.html – all items) ─────────────────────────── */
  async function renderBlogGrid() {
    const el = document.getElementById('blogGrid');
    if (!el) return;

    showSkeletons(el, 6);
    const data = await fetchJson(POSTS_URL);

    if (!data.length) {
      el.innerHTML = emptyState('📝', 'No articles published yet. The first ones are on their way!');
      return;
    }
    el.innerHTML = data.map(buildPostCard).join('');
  }

  /* ── Render: News Grid ──────────────────────────────────────────────────── */
  async function renderNewsGrid() {
    const el = document.getElementById('newsGrid');
    if (!el) return;

    // Support data-limit attribute: <div id="newsGrid" data-limit="3">
    const limit = el.dataset.limit ? parseInt(el.dataset.limit, 10) : 3;

    showSkeletons(el, Math.min(limit, 6));
    const data = await fetchJson(NEWS_URL);

    if (!data.length) {
      el.innerHTML = emptyState('📡', 'No news yet. Check back in a few hours!');
      return;
    }
    el.innerHTML = data.slice(0, limit).map(buildNewsCard).join('');
  }

  /* ── Bootstrap ─────────────────────────────────────────────────────────── */
  function init() {
    renderLatestPosts();
    renderBlogGrid();
    renderNewsGrid();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
