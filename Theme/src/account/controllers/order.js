/**
 * controllers/order.js — Order history controller
 * Wires DiptyqueOrderApi ↔ diptyqueOrderStore ↔ DiptyqueOrderRenderer
 */

'use strict';

import { diptyqueOrderStore } from '../store.js';

export class DiptyqueOrderController {
  /**
   * @param {import('../api/orders').DiptyqueOrderApi}       api
   * @param {import('../ui/order').DiptyqueOrderRenderer}   renderer
   */
  constructor(api, renderer) {
    this._api      = api;
    this._renderer = renderer;
    this._store    = diptyqueOrderStore;

    this._store.subscribe(state => renderer.render(state));
  }

  async load(accessToken, limit = 20) {
    if (!accessToken) {
      this._store.set({ status: 'ready', orders: [], error: null });
      return;
    }

    this._store.set({ status: 'loading', orders: [], error: null });
    try {
      const orders = await this._api.list(accessToken, limit);
      this._store.set({ status: 'ready', orders, error: null });
    } catch (err) {
      console.error('[OrderController] Failed to load orders', err);
      this._store.set({ status: 'error', orders: [], error: err.message });
    }
  }

  /** Seed orders from Liquid-injected native customer JSON (no network). */
  seedFromNative(orders) {
    this._store.set({ status: 'ready', orders: orders || [], error: null });
  }
}
