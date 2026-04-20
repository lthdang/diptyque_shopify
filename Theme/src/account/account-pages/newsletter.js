/**
 * account-pages/newsletter.js — Newsletter page module
 *
 * Wraps DiptyqueNewsletterApi + DiptyqueNewsletterRenderer +
 * DiptyqueNewsletterController.
 * Satisfies the page-module interface: { mount(el, ctx), unmount() }
 */

'use strict';

import { DiptyqueStorefrontClient }     from '../api/storefront.js';
import { DiptyqueBackendClient }        from '../api/backend.js';
import { DiptyqueNewsletterApi }        from '../api/newsletter.js';
import { DiptyqueNewsletterRenderer }   from '../ui/newsletter.js';
import { DiptyqueNewsletterController } from '../controllers/newsletter.js';
import { navigate }                     from '../account-navigation.js';

/** @type {DiptyqueNewsletterController|null} */
let _controller = null;

export const NewsletterPage = {
  /**
   * @param {HTMLElement} container
   * @param {{ config: Object, t: Function, token: string|null }} ctx
   */
  async mount(container, ctx) {
    const { config, t, token } = ctx;

    // Newsletter API requires customer access token.
    if (!token) {
      navigate({ view: 'profile' });
      return;
    }

    const sf = new DiptyqueStorefrontClient(
      config.storefrontEndpoint,
      config.storefrontToken,
    );
    const be = new DiptyqueBackendClient(
      config.apiBase,
      () => localStorage.getItem('shopifyCustomerAccessToken'),
    );

    const api = new DiptyqueNewsletterApi(sf, be);
    const renderer = new DiptyqueNewsletterRenderer(container, t);
    _controller = new DiptyqueNewsletterController(api, renderer);

    _controller.load(token);
  },

  unmount() {
    _controller = null;
  },
};
