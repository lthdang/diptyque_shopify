/**
 * my-account.js — Entry point for the My Account page
 *
 * Composition root: imports all modules, reads JSON config from DOM, wires
 * controllers, initialises tab navigation, and kicks off data loading.
 *
 * Built by Vite → assets/account-my-account.bundle.js
 * Loaded by: sections/my-account.liquid  (single <script defer> tag)
 */

'use strict';

import { loadI18n, loadConfig }                         from './utils/index.js';
import { DiptyqueTokenStore, DiptyqueNativeSession, logoutAccount } from './auth.js';
import { DiptyqueStorefrontClient }                     from './api/storefront.js';
import { DiptyqueBackendClient }                        from './api/backend.js';
import { DiptyqueCustomerApi }                          from './api/customer.js';
import { DiptyqueOrderApi }                             from './api/orders.js';
import { DiptyqueProfileRenderer }                      from './ui/profile.js';
import { DiptyqueOrderRenderer }                        from './ui/order.js';
import { DiptyqueProfileController }                    from './controllers/profile.js';
import { DiptyqueOrderController }                      from './controllers/order.js';

// ── Tab navigation ─────────────────────────────────────────────────────────

function resolveInitialTab() {
  const hash  = (window.location.hash || '').replace(/^#/, '').trim();
  const param = new URLSearchParams(window.location.search).get('tab') || '';
  const valid = ['profile', 'orders', 'addresses', 'cards', 'shipping'];
  return valid.includes(hash) ? hash : (valid.includes(param) ? param : 'profile');
}

function setActiveTab(tab, updateHistory) {
  const valid   = ['profile', 'orders', 'addresses', 'cards', 'shipping'];
  const safeTab = valid.includes(tab) ? tab : 'profile';

  document.querySelectorAll('.my-account__nav-item').forEach(el => {
    el.classList.toggle('my-account__nav-item--active', el.dataset.tab === safeTab);
  });
  document.querySelectorAll('.my-account__panel').forEach(el => {
    el.classList.toggle('my-account__panel--active', el.dataset.panel === safeTab);
  });

  if (updateHistory) {
    const nextHash = safeTab === 'profile' ? '' : '#' + safeTab;
    if (window.location.hash !== nextHash) {
      if (nextHash) window.location.hash = nextHash;
      else history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }
}

function initTabNavigation() {
  document.querySelectorAll('.my-account__nav-item[data-tab]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      setActiveTab(el.dataset.tab, true);
    });
  });
  window.addEventListener('hashchange', () => {
    const hash  = window.location.hash.replace(/^#/, '');
    const valid = ['profile', 'orders', 'addresses', 'cards', 'shipping'];
    if (valid.includes(hash)) setActiveTab(hash, false);
  });
}

// ── Header dropdown ────────────────────────────────────────────────────────

function injectHeaderDropdown(t) {
  const sfToken  = localStorage.getItem('shopifyCustomerAccessToken');
  const sfExpiry = localStorage.getItem('shopifyCustomerAccessTokenExpiresAt');
  const isLoggedIn = sfToken && sfExpiry && new Date(sfExpiry) > new Date();

  const accountBtn = document.querySelector('.account-button');
  if (!accountBtn || accountBtn.dataset.accountInitialized) return;
  accountBtn.dataset.accountInitialized = 'true';
  if (!isLoggedIn) return;

  if (!document.getElementById('account-dropdown-styles')) {
    const style = document.createElement('style');
    style.id = 'account-dropdown-styles';
    style.textContent = `
      .account-button{position:relative}
      .account-dropdown{position:absolute;top:calc(100% + 8px);right:0;min-width:160px;
        background:var(--color-background);border:1px solid var(--color-border,#e0e0e0);
        box-shadow:0 8px 24px rgba(0,0,0,.10);z-index:1100;display:none;flex-direction:column}
      .account-dropdown.is-open{display:flex}
      .account-dropdown__item{display:block;padding:12px 16px;font-size:.78rem;letter-spacing:.04em;
        color:var(--color-foreground);text-decoration:none;background:none;border:none;
        text-align:left;cursor:pointer;white-space:nowrap;transition:background .15s}
      .account-dropdown__item:hover{background:rgba(0,0,0,.04)}
      .account-dropdown__item+.account-dropdown__item{border-top:1px solid var(--color-border,#e0e0e0)}
    `;
    document.head.appendChild(style);
  }

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
    <a href="/pages/my-account" class="account-dropdown__item" role="menuitem">
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

// ── Boot ───────────────────────────────────────────────────────────────────

function boot() {
  const appEl = document.getElementById('my-account-app');
  if (!appEl) return;

  const config = loadConfig('ma-config');
  const t      = loadI18n('ma-i18n');

  if (!config.storefrontEndpoint || !config.storefrontToken) {
    console.error('[account-boot] Missing storefront config in #ma-config');
    return;
  }

  const nativeCustomer = DiptyqueNativeSession.get();
  // Read token directly from localStorage — DiptyqueTokenStore.get() returns
  // { token: null } when #my-account-native-customer is in the DOM, which
  // would incorrectly suppress the backend flow.
  const storedToken = localStorage.getItem('shopifyCustomerAccessToken');
  const storedExpiry = localStorage.getItem('shopifyCustomerAccessTokenExpiresAt');
  const tokenValid = storedToken && storedExpiry && new Date(storedExpiry) > new Date();
  const session = tokenValid ? { token: storedToken, isNative: false } : DiptyqueTokenStore.get();

  if (!nativeCustomer && !session) {
    window.location.href = '/';
    return;
  }

  const sf = new DiptyqueStorefrontClient(config.storefrontEndpoint, config.storefrontToken);
  // Read token directly from localStorage to avoid DiptyqueTokenStore.get()
  // returning null when #my-account-native-customer is present in the DOM.
  const be = new DiptyqueBackendClient(config.apiBase, () => localStorage.getItem('shopifyCustomerAccessToken'));

  // Profile controller
  const profilePanel    = appEl.querySelector('[data-panel="profile"]');
  const profileRenderer = new DiptyqueProfileRenderer(profilePanel, t);
  const customerApi     = new DiptyqueCustomerApi(sf, be);
  const profileCtrl     = new DiptyqueProfileController(customerApi, profileRenderer, {
    // Always use backend (Vercel API) for profile updates, regardless of
    // whether a native Shopify session exists. Native session is only used to
    // pre-populate display data; API calls require a storefront access token.
    isNative:  false,
    logoutUrl: config.logoutUrl || '/account/logout',
    // Provide native session fallback so controller can recover if stored token is stale
    getNativeSession: () => DiptyqueNativeSession.get(),
  });

  // Order controller
  const ordersPanel   = appEl.querySelector('[data-panel="orders"]');
  const orderRenderer = new DiptyqueOrderRenderer(ordersPanel, t);
  const orderApi      = new DiptyqueOrderApi(sf);
  const orderCtrl     = new DiptyqueOrderController(orderApi, orderRenderer);

  initTabNavigation();
  setActiveTab(resolveInitialTab(), false);

  if (nativeCustomer) {
    profileCtrl.load(null, nativeCustomer);
    const nativeOrders = (nativeCustomer.orders?.edges || []).map(e => e.node);
    orderCtrl.seedFromNative(nativeOrders);
  } else {
    const token = session.token;
    profileCtrl.load(token);
    orderCtrl.load(token);
  }

  injectHeaderDropdown(t);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
