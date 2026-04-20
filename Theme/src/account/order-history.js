/**
 * order-history.js — Entry point for the Order History page
 *
 * Built by Vite → assets/account-order-history.bundle.js
 * Loaded by: sections/order-history.liquid
 */

'use strict';

import { loadI18n, loadConfig }                from './utils/index.js';
import { DiptyqueNativeSession }               from './auth.js';
import { DiptyqueStorefrontClient }            from './api/storefront.js';
import { DiptyqueOrderPaginatedApi }           from './api/orders-paginated.js';
import { DiptyqueOrderListRenderer }           from './ui/order-list.js';
import { DiptyqueOrderHistoryController }      from './controllers/order-history.js';

function boot() {
  const container = document.getElementById('order-history-container');
  if (!container) return;

  // Auth check — same pattern as addresses.js
  const nativeCustomer = DiptyqueNativeSession.get();
  const storedToken  = localStorage.getItem('shopifyCustomerAccessToken');
  const storedExpiry = localStorage.getItem('shopifyCustomerAccessTokenExpiresAt');
  const tokenValid   = storedToken && storedExpiry && new Date(storedExpiry) > new Date();
  const token        = tokenValid ? storedToken : null;

  if (!nativeCustomer && !token) {
    window.location.href = '/';
    return;
  }

  const config = loadConfig('oh-config');
  const t      = loadI18n('oh-i18n');

  if (!config.storefrontEndpoint || !config.storefrontToken) {
    console.error('[order-history-boot] Missing storefront config in #oh-config');
    return;
  }

  const sf         = new DiptyqueStorefrontClient(config.storefrontEndpoint, config.storefrontToken);
  const api        = new DiptyqueOrderPaginatedApi(sf);
  const renderer   = new DiptyqueOrderListRenderer(container, t);
  const controller = new DiptyqueOrderHistoryController(api, renderer);

  // Native customers don't have a Storefront token — redirect to native orders page
  controller.load(token);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
