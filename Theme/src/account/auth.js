/**
 * auth.js — Authentication layer
 *
 * Two session models:
 *  1. NativeSession  — Liquid injects #ma-native-customer JSON into DOM
 *  2. StorefrontToken — localStorage (shopifyCustomerAccessToken)
 */

'use strict';

// ── Storage keys ───────────────────────────────────────────────────────────

const TOKEN_KEY  = 'shopifyCustomerAccessToken';
const EXPIRY_KEY = 'shopifyCustomerAccessTokenExpiresAt';
const CACHE_KEY  = 'shopifyCustomer';

// ── TokenStore ─────────────────────────────────────────────────────────────

/**
 * Single source of truth for the Storefront API customer access token.
 *
 * Priority:
 *  1. If #ma-native-customer exists in the DOM → native session (no token)
 *  2. Otherwise read token from localStorage   → Storefront session
 */
export const DiptyqueTokenStore = {
  /**
   * @returns {{ token: string|null, isNative: boolean } | null}
   */
  get() {
    if (document.getElementById('my-account-native-customer')) {
      return { token: null, isNative: true };
    }
    const token  = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (!token || !expiry) return null;
    if (new Date(expiry) <= new Date()) {
      this.clear();
      return null;
    }
    return { token, isNative: false };
  },

  save(token, expiresAt) {
    localStorage.setItem(TOKEN_KEY,  token);
    localStorage.setItem(EXPIRY_KEY, expiresAt);
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    localStorage.removeItem(CACHE_KEY);
  },

  getToken() {
    const s = this.get();
    return s ? s.token : null;
  },

  isNative() {
    return Boolean(document.getElementById('my-account-native-customer'));
  },
};

// ── NativeSession ──────────────────────────────────────────────────────────

export const DiptyqueNativeSession = {
  get() {
    const el = document.getElementById('my-account-native-customer');
    if (!el) return null;
    try {
      return JSON.parse(el.textContent || 'null') || null;
    } catch (e) {
      console.warn('[DiptyqueAccount] Failed to parse #ma-native-customer JSON', e);
      return null;
    }
  },
};

// ── CSRF helper ────────────────────────────────────────────────────────────

/** Read the Shopify CSRF token from the hidden native form. */
export function getNativeCSRFToken() {
  return (
    document.querySelector('#ma-native-form [name="authenticity_token"]')?.value || ''
  );
}

// ── Logout ─────────────────────────────────────────────────────────────────

/** Clear all session data and redirect. */
export function logoutAccount(redirectUrl) {
  DiptyqueTokenStore.clear();
  sessionStorage.removeItem('dp_ca_token');
  window.location.href = redirectUrl || '/';
}
