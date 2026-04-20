/**
 * account-app.js — Single-page account application entry point
 *
 * Composition root for the unified account experience:
 *   /pages/account                  → profile (default)
 *   /pages/account?view=profile
 *   /pages/account?view=orders
 *   /pages/account?view=addresses
 *   /pages/account?view=order&id=:id
 *
 * Built by Vite → assets/account-app.bundle.js
 * Loaded by:    sections/account.liquid
 */

'use strict';

import { loadConfig, loadI18n }                   from './utils/index.js';
import { DiptyqueNativeSession, logoutAccount }   from './auth.js';
import { navigate, parseRoute }                   from './account-navigation.js';
import { AccountRouter }                          from './account-router.js';
import { ProfilePage }                            from './account-pages/profile.js';
import { OrdersPage }                             from './account-pages/orders.js';
import { AddressesPage }                          from './account-pages/addresses.js';
import { OrderDetailPage }                        from './account-pages/order-detail.js';
import { NewsletterPage }                         from './account-pages/newsletter.js';
import { SavedCardsPage }                         from './account-pages/saved-cards.js';

// ── Auth helpers ──────────────────────────────────────────────────────────

function resolveSession() {
  const storedToken  = localStorage.getItem('shopifyCustomerAccessToken');
  const storedExpiry = localStorage.getItem('shopifyCustomerAccessTokenExpiresAt');
  const tokenValid   = storedToken && storedExpiry && new Date(storedExpiry) > new Date();

  // Prefer localStorage token over native session — users registered via
  // Storefront API must always use their token even when Shopify's native
  // customer object is also present on the page.
  if (tokenValid)     return { token: storedToken, isNative: false };

  const nativeCustomer = DiptyqueNativeSession.get();
  if (nativeCustomer) return { token: null,        isNative: true  };

  return null;
}

// ── Header dropdown ───────────────────────────────────────────────────────

function injectHeaderDropdown(t) {
  const accountBtn = document.querySelector('.account-button');
  if (!accountBtn || accountBtn.dataset.accountInitialized) return;
  accountBtn.dataset.accountInitialized = 'true';

  const storedToken  = localStorage.getItem('shopifyCustomerAccessToken');
  const storedExpiry = localStorage.getItem('shopifyCustomerAccessTokenExpiresAt');
  const isLoggedIn   = storedToken && storedExpiry && new Date(storedExpiry) > new Date();
  if (!isLoggedIn) return;

  const existing = accountBtn.querySelector('[data-open-account-modal]');
  if (!existing) return;

  const toggle = document.createElement('button');
  toggle.type      = 'button';
  toggle.className = existing.className;
  toggle.setAttribute('aria-label',    existing.getAttribute('aria-label') || 'Account');
  toggle.setAttribute('aria-haspopup', 'true');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = existing.innerHTML;
  existing.replaceWith(toggle);

  const dropdown = document.createElement('div');
  dropdown.className = 'account-dropdown';
  dropdown.setAttribute('role', 'menu');
  dropdown.innerHTML = `
    <a href="/pages/account" class="account-dropdown__item" role="menuitem">
      ${t('header_my_account', 'マイアカウント')}
    </a>
    <button type="button" class="account-dropdown__item" id="header-logout-btn" role="menuitem">
      ${t('logout', 'ログアウト')}
    </button>`;
  accountBtn.appendChild(dropdown);

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
  dropdown.querySelector('#header-logout-btn')?.addEventListener('click', () => {
    logoutAccount('/');
  });
  document.addEventListener('click', () => {
    dropdown.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      dropdown.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ── Sidebar navigation ────────────────────────────────────────────────────

/**
 * Intercept sidebar nav clicks and delegate to the client-side router
 * instead of doing a full page reload.
 */
function initSidebarNav() {
  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const view = el.dataset.view;
      if (view) navigate({ view });
    });
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────

function boot() {
  const root = document.getElementById('account-root');
  if (!root) return;

  // ── Auth guard ───────────────────────────────────────────────────────────
  const session = resolveSession();
  if (!session) {
    window.location.href = '/';
    return;
  }

  // ── Config + i18n ────────────────────────────────────────────────────────
  const config = loadConfig('account-config');
  const t      = loadI18n('account-i18n');

  if (!config.storefrontEndpoint || !config.storefrontToken) {
    console.error('[account-app] Missing storefront config in #account-config');
    return;
  }

  // Shared context passed to every page module
  const context = {
    config,
    t,
    token: session.token,
  };

  // ── Router ───────────────────────────────────────────────────────────────
  const router = new AccountRouter({
    root,
    pages: {
      profile:    ProfilePage,
      orders:     OrdersPage,
      addresses:  AddressesPage,
      order:      OrderDetailPage,
      newsletter:   NewsletterPage,
      'saved-cards': SavedCardsPage,
    },
    context,
    navItems: document.querySelectorAll('[data-view]'),
  });

  initSidebarNav();
  router.start();
  injectHeaderDropdown(t);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
