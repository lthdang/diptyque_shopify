/**
 * account-pages/addresses.js — Addresses page module
 *
 * Wraps the existing DiptyqueAddressController + DiptyqueAddressRenderer.
 * Satisfies the page-module interface: { mount(el, ctx), unmount() }
 */

'use strict';

import { DiptyqueStorefrontClient }  from '../api/storefront.js';
import { DiptyqueBackendClient }     from '../api/backend.js';
import { DiptyqueAddressApi }        from '../api/address.js';
import { DiptyqueAddressRenderer }   from '../ui/address.js';
import { DiptyqueAddressController } from '../controllers/address.js';
import { navigate }                  from '../account-navigation.js';

/** @type {DiptyqueAddressController|null} */
let _controller = null;

export const AddressesPage = {
  /**
   * @param {HTMLElement} container
   * @param {{ config: Object, t: Function, token: string|null }} ctx
   */
  async mount(container, ctx) {
    const { config, t, token } = ctx;

    const sf = new DiptyqueStorefrontClient(
      config.storefrontEndpoint,
      config.storefrontToken,
    );
    const be = new DiptyqueBackendClient(
      config.apiBase,
      () => localStorage.getItem('shopifyCustomerAccessToken'),
    );

    // Addresses require a Storefront API token — native-only sessions
    // cannot use this view. Redirect to profile gracefully.
    if (!token) {
      navigate({ view: 'profile' });
      return;
    }

    const api      = new DiptyqueAddressApi(sf, be);
    const renderer = new DiptyqueAddressRenderer(container, t);
    _controller    = new DiptyqueAddressController(api, renderer);

    _controller.load(token);
  },

  unmount() {
    _controller = null;
  },
};
