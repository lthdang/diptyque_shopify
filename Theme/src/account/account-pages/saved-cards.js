/**
 * account-pages/saved-cards.js — Saved cards page module
 *
 * Wraps DiptyqueSavedCardsRenderer + DiptyqueSavedCardsController.
 * Satisfies the page-module interface: { mount(el, ctx), unmount() }
 */

'use strict';

import { DiptyqueSavedCardsRenderer }   from '../ui/saved-cards.js';
import { DiptyqueSavedCardsController } from '../controllers/saved-cards.js';

/** @type {DiptyqueSavedCardsController|null} */
let _controller = null;

export const SavedCardsPage = {
  /**
   * @param {HTMLElement} container
   * @param {{ config: Object, t: Function, token: string|null }} ctx
   */
  async mount(container, ctx) {
    const renderer = new DiptyqueSavedCardsRenderer(container, ctx.t);
    _controller = new DiptyqueSavedCardsController(renderer);
    _controller.load();
  },

  unmount() {
    _controller = null;
  },
};
