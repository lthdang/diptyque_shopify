/**
 * account-pages/order-detail.js — Single order detail page module
 *
 * Wires api / ui / controller together.
 * Satisfies the page-module interface: { mount(el, ctx), unmount() }
 */

'use strict';

import { DiptyqueStorefrontClient }      from '../api/storefront.js';
import { DiptyqueOrderDetailApi }        from '../api/order-detail.js';
import { DiptyqueOrderDetailRenderer }   from '../ui/order-detail.js';
import { DiptyqueOrderDetailController } from '../controllers/order-detail.js';

/** @type {DiptyqueOrderDetailController|null} */
let _controller = null;

export const OrderDetailPage = {
  /**
   * @param {HTMLElement} container
   * @param {{ config: Object, t: Function, token: string|null, id: string|null }} ctx
   */
  async mount(container, ctx) {
    const { config, t, id } = ctx;

    const sf = new DiptyqueStorefrontClient(
      config.storefrontEndpoint,
      config.storefrontToken,
    );

    const api      = new DiptyqueOrderDetailApi(sf);
    const renderer = new DiptyqueOrderDetailRenderer(container, t);
    _controller    = new DiptyqueOrderDetailController(api, renderer);

    _controller.load(id, t);
  },

  unmount() {
    _controller?.destroy();
    _controller = null;
  },
};
