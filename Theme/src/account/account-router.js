/**
 * account-router.js — Lightweight client-side router
 *
 * Responsibilities:
 *  - Mount / unmount page modules based on the current route
 *  - Listen for `account:routechange` events (from navigate())
 *  - Listen for browser back/forward via `popstate`
 *  - Keep the active nav link highlighted
 *
 * Page module interface (duck-typed):
 *  {
 *    mount(container: HTMLElement, context: RouterContext): Promise<void>
 *    unmount(): void
 *  }
 *
 * RouterContext:
 *  {
 *    config:  Object          — parsed #account-config JSON
 *    t:       (key, fb) => string  — i18n helper
 *    token:   string|null     — access token (null = native session)
 *  }
 */

'use strict';

import { parseRoute, DEFAULT_VIEW } from './account-navigation.js';

// ── Router ─────────────────────────────────────────────────────────────────

export class AccountRouter {
  /**
   * @param {{
   *   root:    HTMLElement           — container where views are rendered
   *   pages:   Record<string, { mount(el, ctx): Promise<void>, unmount(): void }>
   *   context: Object                — shared context passed to every page
   *   navItems?: NodeListOf<Element> — optional sidebar nav items
   * }} options
   */
  constructor({ root, pages, context, navItems }) {
    this._root      = root;
    this._pages     = pages;        // { profile, orders, addresses, order }
    this._context   = context;
    this._navItems  = navItems || document.querySelectorAll('[data-view]');
    this._current   = null;         // currently mounted page key
    this._viewEl    = null;         // current view's host element

    this._onRouteChange = this._onRouteChange.bind(this);
    this._onPopState    = this._onPopState.bind(this);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /** Attach event listeners and perform the initial render. */
  start() {
    window.addEventListener('account:routechange', this._onRouteChange);
    window.addEventListener('popstate',            this._onPopState);
    this._renderFromURL();
  }

  /** Detach all listeners and unmount active page. */
  destroy() {
    window.removeEventListener('account:routechange', this._onRouteChange);
    window.removeEventListener('popstate',            this._onPopState);
    this._unmountCurrent();
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  _onRouteChange(e) {
    const { view, id } = e.detail;
    this._renderPage(view, id);
  }

  _onPopState() {
    // popstate fires on back/forward — reparse URL from scratch
    this._renderFromURL();
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  _renderFromURL() {
    const { view, id } = parseRoute();
    this._renderPage(view, id);
  }

  async _renderPage(view, id) {
    // Skip if already showing this view+id (avoid unnecessary unmount/remount)
    const cacheKey = id ? `${view}:${id}` : view;
    if (this._current === cacheKey) return;

    const pageModule = this._pages[view] || this._pages[DEFAULT_VIEW];

    // 1. Unmount previous view
    this._unmountCurrent();

    // 2. Create a fresh host element inside the root
    const host = document.createElement('div');
    host.className    = 'account-view';
    host.dataset.view = view;
    this._root.appendChild(host);
    this._viewEl  = host;
    this._current = cacheKey;

    // 3. Highlight matching nav item
    this._updateNav(view);

    // 4. Mount the new page
    try {
      await pageModule.mount(host, { ...this._context, id });
    } catch (err) {
      console.error(`[AccountRouter] Failed to mount view "${view}"`, err);
      host.innerHTML = `<p class="account-view__error">ページを読み込めませんでした。</p>`;
    }
  }

  _unmountCurrent() {
    if (this._current && this._pages[this._current.split(':')[0]]) {
      try {
        this._pages[this._current.split(':')[0]].unmount();
      } catch (e) { /* silent */ }
    }
    if (this._viewEl) {
      this._viewEl.remove();
      this._viewEl = null;
    }
    this._current = null;
  }

  // ── Nav highlight ──────────────────────────────────────────────────────────

  _updateNav(view) {
    this._navItems.forEach(el => {
      const matches = el.dataset.view === view ||
                      // 'order' detail is a sub-view of 'orders'
                      (el.dataset.view === 'orders' && view === 'order');
      el.classList.toggle('my-account__nav-item--active', matches);
    });
  }
}
