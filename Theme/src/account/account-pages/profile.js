/**
 * account-pages/profile.js — Profile & password page module
 *
 * Wraps the existing DiptyqueProfileController + DiptyqueProfileRenderer.
 * Satisfies the page-module interface: { mount(el, ctx), unmount() }
 */

'use strict';

import { DiptyqueStorefrontClient }  from '../api/storefront.js';
import { DiptyqueBackendClient }     from '../api/backend.js';
import { DiptyqueCustomerApi }       from '../api/customer.js';
import { DiptyqueProfileRenderer }   from '../ui/profile.js';
import { DiptyqueProfileController } from '../controllers/profile.js';
import { DiptyqueNativeSession }     from '../auth.js';

/** @type {DiptyqueProfileController|null} */
let _controller = null;

export const ProfilePage = {
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

    const api      = new DiptyqueCustomerApi(sf, be);
    const renderer = new DiptyqueProfileRenderer(container, t);
    _controller    = new DiptyqueProfileController(api, renderer, {
      isNative:         false,
      logoutUrl:        config.logoutUrl || '/account/logout',
      getNativeSession: () => DiptyqueNativeSession.get(),
    });

    const nativeCustomer = DiptyqueNativeSession.get();
    if (nativeCustomer) {
      _controller.load(null, nativeCustomer);
    } else {
      _controller.load(token);
    }
  },

  unmount() {
    _controller = null;
  },
};
