/**
 * controllers/order-detail.js — Order detail page controller
 */

'use strict';

import { navigate } from '../account-navigation.js';

export class DiptyqueOrderDetailController {
  /**
   * @param {import('../api/order-detail').DiptyqueOrderDetailApi}       api
   * @param {import('../ui/order-detail').DiptyqueOrderDetailRenderer}   renderer
   */
  constructor(api, renderer) {
    this._api      = api;
    this._renderer = renderer;
    this._aborted  = false;
  }

  /**
   * Load and render the order with the given numeric ID.
   * @param {string|number} id
   * @param {Function}      t  i18n lookup fn
   */
  async load(id, t) {
    this._aborted = false;

    if (!id) {
      navigate({ view: 'orders' });
      return;
    }

    this._renderer.renderLoading();

    try {
      const order = await this._api.get(id);

      if (this._aborted) return;

      if (!order) {
        this._renderer.renderError(t('order_not_found', '注文が見つかりませんでした。'));
        return;
      }

      this._renderer.renderOrder(order);
    } catch (err) {
      if (this._aborted) return;
      console.error('[OrderDetailController] Failed to load order', err);
      this._renderer.renderError(t('order_load_error', '注文の読み込みに失敗しました。'));
    }
  }

  destroy() {
    this._aborted = true;
  }
}
