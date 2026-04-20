/**
 * controllers/order-history.js — Order History controller
 * Wires DiptyqueOrderPaginatedApi ↔ diptyqueOrderHistoryStore ↔ DiptyqueOrderListRenderer
 */

'use strict';

import { diptyqueOrderHistoryStore } from '../store.js';
import { reorder }                   from '../api/reorder.js';
import { printReceipt }              from '../api/print-receipt.js';

const PAGE_SIZE = 10;

export class DiptyqueOrderHistoryController {
  /**
   * @param {import('../api/orders-paginated').DiptyqueOrderPaginatedApi} api
   * @param {import('../ui/order-list').DiptyqueOrderListRenderer}        renderer
   */
  constructor(api, renderer) {
    this._api      = api;
    this._renderer = renderer;
    this._store    = diptyqueOrderHistoryStore;
    this._token    = null;

    this._unsubscribe = this._store.subscribe(state => renderer.render(state));

    renderer.on('order:tab-change', () => {
      // Tab changes are pure UI — no API call, just re-render current state
      // renderer.render() already called from store subscriber, but store didn't change.
      // Trigger a re-render manually so the renderer uses the new _activeTab.
      renderer.render(this._store.get());
    });

    renderer.on('order:load-more',     () => this._loadMore());
    renderer.on('order:reorder',        (orderId) => this._reorder(orderId));
    renderer.on('order:print-receipt',  (orderId) => this._printReceipt(orderId));
  }

  // ── Destroy ────────────────────────────────────────────────────────────────

  /** Remove store subscription to prevent stale renders after unmount. */
  destroy() {
    if (this._unsubscribe) this._unsubscribe();
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  async load(accessToken) {
    if (!accessToken) {
      window.location.href = '/';
      return;
    }

    this._token = accessToken;
    this._store.set({ status: 'loading', orders: [], hasNextPage: false, endCursor: null, loadingMore: false, error: null });

    try {
      const { orders, pageInfo } = await this._api.list(accessToken, PAGE_SIZE, null);
      this._store.set({
        status:      'ready',
        orders,
        hasNextPage: pageInfo.hasNextPage,
        endCursor:   pageInfo.endCursor,
        loadingMore: false,
        error:       null,
      });
    } catch (err) {
      console.error('[OrderHistoryController] Load failed', err);
      if (err.status === 401 || err.status === 403) {
        window.location.href = '/';
        return;
      }
      this._store.set({ status: 'error', orders: [], hasNextPage: false, endCursor: null, loadingMore: false, error: err.message });
    }
  }

  // ── Pagination ─────────────────────────────────────────────────────────────

  async _loadMore() {
    const current = this._store.get();
    if (!current.hasNextPage || current.loadingMore) return;

    this._store.update(s => ({ ...s, loadingMore: true }));

    try {
      const { orders, pageInfo } = await this._api.list(this._token, PAGE_SIZE, current.endCursor);
      this._store.update(s => ({
        ...s,
        orders:      [...s.orders, ...orders],
        hasNextPage: pageInfo.hasNextPage,
        endCursor:   pageInfo.endCursor,
        loadingMore: false,
      }));
    } catch (err) {
      console.error('[OrderHistoryController] Load more failed', err);
      this._store.update(s => ({ ...s, loadingMore: false }));
    }
  }

  // ── Print receipt ──────────────────────────────────────────────────────────

  _printReceipt(orderId) {
    const order = this._store.get().orders?.find(o => o.id === orderId);
    if (!order) {
      console.warn('[OrderHistoryController] PrintReceipt: order not found', orderId);
      return;
    }
    printReceipt(order, this._renderer.t);
  }

  // ── Reorder ────────────────────────────────────────────────────────────────

  async _reorder(orderId) {
    const order = this._store.get().orders?.find(o => o.id === orderId);
    if (!order) {
      console.warn('[OrderHistoryController] Reorder: order not found in store', orderId);
      return;
    }

    const { added, failed, cartUrl } = await reorder(order);

    if (added.length && !failed.length) {
      // All items added — go to cart
      window.location.href = cartUrl;
      return;
    }

    if (added.length && failed.length) {
      // Partial success — go to cart but warn in console
      const names = failed.map(f => f.title).join(', ');
      console.warn(`[reorder] ${failed.length} item(s) could not be added: ${names}`);
      window.location.href = cartUrl;
      return;
    }

    // Total failure — restore button and alert user
    this._renderer.setReordering(orderId, false);
    console.error('[reorder] No items could be added to cart', failed);
    alert(
      failed.map(f => `• ${f.title}: ${f.reason}`).join('\n') ||
      '商品をカートに追加できませんでした。'
    );
  }
}
