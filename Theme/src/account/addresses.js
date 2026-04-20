/**
 * addresses.js — Entry point for the Addresses Detail page
 *
 * Built by Vite → assets/account-addresses.bundle.js
 * Loaded by: sections/addresses-details.liquid  (single <script defer> tag)
 */

'use strict';

import { loadI18n, loadConfig }             from './utils/index.js';
import { DiptyqueNativeSession } from './auth.js';
import { DiptyqueStorefrontClient }         from './api/storefront.js';
import { DiptyqueBackendClient }            from './api/backend.js';
import { DiptyqueAddressApi }               from './api/address.js';
import { DiptyqueAddressRenderer }          from './ui/address.js';
import { DiptyqueAddressController }        from './controllers/address.js';

function boot() {
  const container = document.getElementById('addresses-details-container');
  if (!container) return;

  // Mirror the same auth check as my-account.js:
  // DiptyqueTokenStore.get() returns { token: null, isNative: true } when
  // #my-account-native-customer is in the DOM — even if not authenticated.
  // Check native session and token validity independently.
  const nativeCustomer = DiptyqueNativeSession.get();
  const storedToken  = localStorage.getItem('shopifyCustomerAccessToken');
  const storedExpiry = localStorage.getItem('shopifyCustomerAccessTokenExpiresAt');
  const tokenValid   = storedToken && storedExpiry && new Date(storedExpiry) > new Date();
  const session      = tokenValid ? { token: storedToken } : null;

  if (!nativeCustomer && !session) {
    window.location.href = '/';
    return;
  }

  const config = loadConfig('ad-config');
  const t      = loadI18n('ad-i18n');

  if (!config.storefrontEndpoint || !config.storefrontToken) {
    console.error('[account-boot-addresses] Missing storefront config in #ad-config');
    return;
  }

  const sf = new DiptyqueStorefrontClient(config.storefrontEndpoint, config.storefrontToken);
  const be = new DiptyqueBackendClient(config.apiBase, () => localStorage.getItem('shopifyCustomerAccessToken'));

  const api        = new DiptyqueAddressApi(sf, be);
  const renderer   = new DiptyqueAddressRenderer(container, t);
  const controller = new DiptyqueAddressController(api, renderer);

  controller.load(session?.token || null);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
