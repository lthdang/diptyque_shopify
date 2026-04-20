/**
 * account-navigation.js — Client-side navigation helper
 *
 * Single source of truth for URL mutations. All links and buttons must call
 * `navigate()` instead of setting window.location directly.
 *
 * Supported routes:
 *   /pages/account                  → profile (default)
 *   /pages/account?tab=profile
 *   /pages/account?tab=orders
 *   /pages/account?tab=addresses
 *   /pages/account?tab=order&id=:id
 *
 * NOTE: Shopify reserves the `?view=` query param for alternate templates,
 * so we use `?tab=` instead to prevent server-side template switching.
 */

'use strict';

// ── Constants ──────────────────────────────────────────────────────────────

export const VIEWS = /** @type {const} */ (['profile', 'orders', 'addresses', 'order', 'newsletter', 'saved-cards']);
export const DEFAULT_VIEW = 'profile';

// ── Route parsing ──────────────────────────────────────────────────────────

/**
 * Parse the current URL into a route descriptor.
 * Always returns a valid, sanitised object — never throws.
 *
 * @returns {{ view: string, id: string|null }}
 */
export function parseRoute() {
  const params = new URLSearchParams(window.location.search);
  const raw    = (params.get('tab') || '').trim().toLowerCase();
  const view   = VIEWS.includes(raw) ? raw : DEFAULT_VIEW;
  const id     = params.get('id') || null;
  return { view, id };
}

// ── Navigation ─────────────────────────────────────────────────────────────

/**
 * Navigate to a new view without a full page reload.
 *
 * Builds the canonical URL → pushes it to history → dispatches a custom
 * `account:routechange` event that the router listens for.
 *
 * @param {{ view: string, id?: string|null }} params
 * @param {boolean} [replace=false]  Use replaceState instead of pushState
 */
export function navigate(params, replace = false) {
  const { view = DEFAULT_VIEW, id = null } = params;
  const safeView = VIEWS.includes(view) ? view : DEFAULT_VIEW;

  const qs = new URLSearchParams();
  if (safeView !== DEFAULT_VIEW) qs.set('tab', safeView);
  if (id) qs.set('id', id);

  const search = qs.toString() ? `?${qs.toString()}` : '';
  const url    = `${window.location.pathname}${search}`;

  if (replace) {
    history.replaceState({ view: safeView, id }, '', url);
  } else {
    history.pushState({ view: safeView, id }, '', url);
  }

  window.dispatchEvent(new CustomEvent('account:routechange', {
    detail: { view: safeView, id },
  }));
}

/**
 * Convenience: replace current history entry (no back-button entry added).
 * Useful for initial load normalisation.
 *
 * @param {{ view: string, id?: string|null }} params
 */
export function replaceRoute(params) {
  navigate(params, true);
}
