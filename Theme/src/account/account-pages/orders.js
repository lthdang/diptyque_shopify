/**
 * account-pages/orders.js — Order history page module
 *
 * Wraps the existing DiptyqueOrderHistoryController + DiptyqueOrderListRenderer.
 * Satisfies the page-module interface: { mount(el, ctx), unmount() }
 */

'use strict';

import { DiptyqueStorefrontClient }       from '../api/storefront.js';
import { DiptyqueOrderPaginatedApi }      from '../api/orders-paginated.js';
import { DiptyqueOrderListRenderer }      from '../ui/order-list.js';
import { DiptyqueOrderHistoryController } from '../controllers/order-history.js';
import { navigate }                       from '../account-navigation.js';

/** @type {DiptyqueOrderHistoryController|null} */
let _controller = null;

export const OrdersPage = {
  /**
   * @param {HTMLElement} container
   * @param {{ config: Object, t: Function, token: string|null }} ctx
   */
  async mount(container, ctx) {
    const { config, t, token } = ctx;

    const sf  = new DiptyqueStorefrontClient(
      config.storefrontEndpoint,
      config.storefrontToken,
    );
    const api      = new DiptyqueOrderPaginatedApi(sf);
    const renderer = new DiptyqueOrderListRenderer(container, t);
    _controller    = new DiptyqueOrderHistoryController(api, renderer);

    // Orders require a Storefront API token — native-only sessions
    // cannot use this view. Redirect to profile gracefully.
    if (!token) {
      navigate({ view: 'profile' });
      return;
    }

    // Forward "view order detail" events to the router via navigate()
    renderer.on('order:view-detail', (orderId) => {
      navigate({ view: 'order', id: orderId });
    });

    _controller.load(token);
  },

  unmount() {
    if (_controller) _controller.destroy();
    _controller = null;
  },
};
