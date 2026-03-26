/* ============================================================
   AuraCrafts – Shared JS (shared.js)
   Handles: burger menu, wishlist, search modal, toast, navbar scroll
   ============================================================ */

// ── Wishlist (localStorage) ───────────────────────────────
const Wishlist = {
  key: 'auracrafts_wishlist',

  getAll() {
    try { return JSON.parse(localStorage.getItem(this.key)) || []; }
    catch { return []; }
  },

  save(items) {
    localStorage.setItem(this.key, JSON.stringify(items));
  },

  add(product) {
    const items = this.getAll();
    if (!items.find(i => i.affiliate_url === product.affiliate_url)) {
      items.push(product);
      this.save(items);
      Toast.show('❤️ Added to wishlist!', 'success');
    } else {
      Toast.show('Already in wishlist', 'info');
    }
    this.updateBadge();
    this.renderSidebar();
  },

  remove(affiliate_url) {
    const items = this.getAll().filter(i => i.affiliate_url !== affiliate_url);
    this.save(items);
    this.updateBadge();
    this.renderSidebar();
    Toast.show('Removed from wishlist', 'info');
  },

  toggle(product) {
    const items = this.getAll();
    if (items.find(i => i.affiliate_url === product.affiliate_url)) {
      this.remove(product.affiliate_url);
      return false;
    } else {
      this.add(product);
      return true;
    }
  },

  has(affiliate_url) {
    return this.getAll().some(i => i.affiliate_url === affiliate_url);
  },

  updateBadge() {
    const count = this.getAll().length;
    document.querySelectorAll('.wishlist-badge').forEach(b => {
      b.textContent = count;
      b.classList.toggle('visible', count > 0);
    });
  },

  renderSidebar() {
    const list = document.getElementById('wishlistItems');
    if (!list) return;
    const items = this.getAll();
    if (items.length === 0) {
      list.innerHTML = `<div class="wishlist-empty">
        <div class="empty-icon">🤍</div>
        <p>Your wishlist is empty</p>
        <a href="shop.html" class="btn btn-blue" style="display:inline-flex;margin-top:1rem">Browse Designs</a>
      </div>`;
      return;
    }
    list.innerHTML = items.map(p => `
      <div class="wishlist-item">
        <img src="${p.image_url}" alt="${escapeHtml(p.title)}" onerror="this.src='images/placeholder.jpg'">
        <div class="wishlist-item-info">
          <div class="wishlist-item-title">${escapeHtml(p.title)}</div>
          <a href="${p.affiliate_url}" target="_blank" rel="sponsored" class="wishlist-item-btn">Download ↗</a>
        </div>
        <button class="wishlist-item-remove" onclick="Wishlist.remove('${p.affiliate_url.replace(/'/g,"\\'")}')">✕</button>
      </div>
    `).join('');
  },

  openSidebar() {
    this.renderSidebar();
    document.getElementById('wishlistSidebar')?.classList.add('open');
    document.getElementById('sidebarOverlay')?.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeSidebar() {
    document.getElementById('wishlistSidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('active');
    document.body.style.overflow = '';
  }
};

// ── Toast Notifications ───────────────────────────────────
const Toast = {
  container: null,

  init() {
    if (!document.getElementById('toastContainer')) {
      const el = document.createElement('div');
      el.id = 'toastContainer';
      el.className = 'toast-container';
      document.body.appendChild(el);
      this.container = el;
    } else {
      this.container = document.getElementById('toastContainer');
    }
  },

  show(message, type = 'info', duration = 3000) {
    if (!this.container) this.init();
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

// ── Search Modal ──────────────────────────────────────────
const SearchModal = {
  open() {
    document.getElementById('searchModal')?.classList.add('open');
    setTimeout(() => document.getElementById('searchInput')?.focus(), 100);
    document.body.style.overflow = 'hidden';
  },
  close() {
    document.getElementById('searchModal')?.classList.remove('open');
    document.body.style.overflow = '';
    if (document.getElementById('searchResults'))
      document.getElementById('searchResults').innerHTML = '';
    if (document.getElementById('searchInput'))
      document.getElementById('searchInput').value = '';
  },
  search(query) {
    const results = document.getElementById('searchResults');
    if (!results || !query.trim()) { results && (results.innerHTML = ''); return; }
    // Search in PRODUCTS if available
    const pool = typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
    const q = query.toLowerCase();
    const matches = pool.filter(p => p.title.toLowerCase().includes(q)).slice(0, 10);
    if (matches.length === 0) {
      results.innerHTML = `<p style="color:rgba(255,255,255,0.5);padding:1rem">No results found for "${escapeHtml(query)}"</p>`;
      return;
    }
    results.innerHTML = matches.map(p => `
      <a href="${p.affiliate_url}" target="_blank" rel="sponsored" class="search-result-item">
        <img src="${p.image_url}" alt="${escapeHtml(p.title)}" onerror="this.src='images/placeholder.jpg'">
        <div class="search-result-title">${escapeHtml(p.title)}</div>
      </a>
    `).join('');
  }
};

// ── Utility ───────────────────────────────────────────────
function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Burger Menu ───────────────────────────────────────────
function initBurger() {
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  if (!burger || !navLinks) return;
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  // Close on link click
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
}

// ── Navbar Scroll ─────────────────────────────────────────
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// ── Active Nav Link ───────────────────────────────────────
function setActiveNavLink() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === page);
  });
}

// ── Init on DOM Ready ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  initBurger();
  initNavbarScroll();
  setActiveNavLink();
  Wishlist.updateBadge();

  // Wishlist button in navbar
  document.getElementById('wishlistBtn')?.addEventListener('click', () => Wishlist.openSidebar());
  document.getElementById('wishlistClose')?.addEventListener('click', () => Wishlist.closeSidebar());
  document.getElementById('sidebarOverlay')?.addEventListener('click', () => Wishlist.closeSidebar());

  // Search
  document.getElementById('searchBtn')?.addEventListener('click', () => SearchModal.open());
  document.getElementById('searchClose')?.addEventListener('click', () => SearchModal.close());
  document.getElementById('searchInput')?.addEventListener('input', e => SearchModal.search(e.target.value));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { SearchModal.close(); Wishlist.closeSidebar(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); SearchModal.open(); }
  });
});
