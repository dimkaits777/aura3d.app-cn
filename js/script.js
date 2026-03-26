/* ============================================================
   AuraCrafts – script.js
   Shop pagination, filtering, Schema.org, and page-specific logic
   ============================================================ */

// ── Shop Page ─────────────────────────────────────────────
const Shop = {
  PAGE_SIZE: 24,
  currentPage: 1,
  filtered: [],

  init() {
    if (!document.getElementById('productsGrid')) return;
    if (typeof PRODUCTS === 'undefined') {
      document.getElementById('productsGrid').innerHTML = '<p class="loading">Loading products…</p>';
      return;
    }
    this.filtered = [...PRODUCTS];
    this.buildCategoryFilter();
    this.render();
    this.bindEvents();
  },

  buildCategoryFilter() {
    // Extract keywords as pseudo-categories
    const sel = document.getElementById('categoryFilter');
    if (!sel) return;
    const keywords = [
      'Cookie Cutter', 'Ornament', 'Flexi', 'Clay Cutter', 'Earring', 'Figurine',
      'Miniature', 'Planter', 'Vase', 'Dragon', 'Cat', 'Dog', 'Frog', 'Skull',
      'Jewelry', 'Keychain', 'Toy', 'Phone', 'Holder', 'Box', 'Christmas', 'Halloween'
    ];
    keywords.forEach(kw => {
      if (PRODUCTS.some(p => p.title.toLowerCase().includes(kw.toLowerCase()))) {
        const opt = document.createElement('option');
        opt.value = kw.toLowerCase();
        opt.textContent = kw;
        sel.appendChild(opt);
      }
    });
  },

  applyFilters() {
    const search = (document.getElementById('searchFilter')?.value || '').toLowerCase();
    const cat = (document.getElementById('categoryFilter')?.value || '');
    this.filtered = PRODUCTS.filter(p => {
      const matchSearch = !search || p.title.toLowerCase().includes(search);
      const matchCat = !cat || p.title.toLowerCase().includes(cat);
      return matchSearch && matchCat;
    });
    this.currentPage = 1;
    this.render();
  },

  render() {
    const grid = document.getElementById('productsGrid');
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    const page  = this.filtered.slice(start, start + this.PAGE_SIZE);

    if (page.length === 0) {
      grid.innerHTML = '<p class="loading">No products found. Try a different search.</p>';
      this.renderPagination(0);
      return;
    }

    grid.innerHTML = page.map(p => this.cardHTML(p)).join('');
    this.renderPagination(this.filtered.length);
    this.injectSchemaOrg(page);

    // Scroll to top of grid
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  cardHTML(p) {
    const isWished = Wishlist.has(p.affiliate_url);
    const safetitle = escapeHtml(p.title);
    const safeImg   = p.image_url || 'images/placeholder.jpg';
    const safeUrl   = p.affiliate_url || p.product_url;
    // Encode product data for wishlist button
    const dataStr = encodeURIComponent(JSON.stringify({
      title: p.title,
      image_url: safeImg,
      affiliate_url: safeUrl
    }));
    return `
      <div class="product-card">
        <div class="product-img-wrap">
          <a href="${safeUrl}" target="_blank" rel="sponsored">
            <img src="${safeImg}" alt="${safetitle}" loading="lazy" onerror="this.src='images/placeholder.jpg'">
          </a>
          <button class="wishlist-btn ${isWished ? 'active' : ''}"
            aria-label="Add to wishlist"
            onclick="Shop.toggleWishlist(this, '${encodeURIComponent(JSON.stringify({title:p.title,image_url:safeImg,affiliate_url:safeUrl}))}')">
            ${isWished ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="product-body">
          <div class="product-title">${safetitle}</div>
          <div class="product-desc">${escapeHtml(p.description || '')}</div>
          <a href="${safeUrl}" target="_blank" rel="sponsored" class="product-btn">
            🔽 Click Here &amp; Download
          </a>
        </div>
      </div>`;
  },

  toggleWishlist(btn, dataEnc) {
    const p = JSON.parse(decodeURIComponent(dataEnc));
    const added = Wishlist.toggle(p);
    btn.textContent = added ? '❤️' : '🤍';
    btn.classList.toggle('active', added);
  },

  renderPagination(total) {
    const wrap = document.getElementById('pagination');
    if (!wrap) return;
    const pages = Math.ceil(total / this.PAGE_SIZE);
    if (pages <= 1) { wrap.innerHTML = ''; return; }

    const cur = this.currentPage;
    let html = `<button class="page-btn" ${cur===1?'disabled':''} onclick="Shop.goPage(${cur-1})">‹</button>`;

    // Show limited page numbers around current
    let start = Math.max(1, cur - 2);
    let end   = Math.min(pages, cur + 2);
    if (start > 1) html += `<button class="page-btn" onclick="Shop.goPage(1)">1</button>${start>2?'<span style="color:rgba(255,255,255,0.5);padding:0 4px">…</span>':''}`;
    for (let i = start; i <= end; i++) {
      html += `<button class="page-btn ${i===cur?'active':''}" onclick="Shop.goPage(${i})">${i}</button>`;
    }
    if (end < pages) html += `${end<pages-1?'<span style="color:rgba(255,255,255,0.5);padding:0 4px">…</span>':''}<button class="page-btn" onclick="Shop.goPage(${pages})">${pages}</button>`;
    html += `<button class="page-btn" ${cur===pages?'disabled':''} onclick="Shop.goPage(${cur+1})">›</button>`;
    html += `<span style="color:rgba(255,255,255,0.5);font-size:0.85rem;margin-left:0.5rem">${total} designs</span>`;
    wrap.innerHTML = html;
  },

  goPage(page) {
    this.currentPage = page;
    this.render();
  },

  bindEvents() {
    document.getElementById('searchFilter')?.addEventListener('input', () => this.applyFilters());
    document.getElementById('categoryFilter')?.addEventListener('change', () => this.applyFilters());
    document.getElementById('clearFilters')?.addEventListener('click', () => {
      document.getElementById('searchFilter').value = '';
      document.getElementById('categoryFilter').value = '';
      this.applyFilters();
    });
  },

  injectSchemaOrg(products) {
    // Remove old schema
    document.querySelectorAll('.schema-product').forEach(s => s.remove());
    // Add schema for first 10 products
    products.slice(0, 10).forEach(p => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.className = 'schema-product';
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": p.title,
        "description": p.description,
        "image": p.image_url,
        "url": p.affiliate_url,
        "offers": {
          "@type": "Offer",
          "url": p.affiliate_url,
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "seller": { "@type": "Organization", "name": "AuraCrafts" }
        }
      });
      document.head.appendChild(script);
    });
  }
};

// ── Blog / News dynamic loading ───────────────────────────
// n8n will drop JSON files into _posts/ — fetch latest here
function loadLatestPosts(containerId, limit = 3) {
  const container = document.getElementById(containerId);
  if (!container) return;
  // TODO: Replace with actual n8n-generated JSON file path
  fetch('_posts/posts.json')
    .then(r => r.json())
    .then(posts => {
      const latest = posts.slice(0, limit);
      container.innerHTML = latest.map(post => `
        <a href="${post.url || '#'}" class="blog-card">
          <div class="blog-card-img" style="background-image:url('${post.image || 'images/bg-1.jpg'}')"></div>
          <div class="blog-card-body">
            <div class="blog-meta">${post.category || '3D Printing'} · ${post.date || ''}</div>
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.excerpt || '')}</p>
            <div class="blog-read-more">Read more →</div>
          </div>
        </a>
      `).join('');
    })
    .catch(() => {
      // Fallback: static placeholder posts (shown below)
    });
}

// ── Scroll Reveal ─────────────────────────────────────────
function initScrollReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.service-card, .blog-card, .testimonial, .printer-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Shop.init();
  initScrollReveal();
  loadLatestPosts('latestPostsGrid', 3);
});
