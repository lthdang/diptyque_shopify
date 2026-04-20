/**
 * controllers/saved-cards.js — Saved cards controller
 */

'use strict';

export class DiptyqueSavedCardsController {
  /**
   * @param {import('../ui/saved-cards').DiptyqueSavedCardsRenderer} renderer
   */
  constructor(renderer) {
    this._renderer = renderer;
  }

  load() {
    this._renderer.render();
  }
}
