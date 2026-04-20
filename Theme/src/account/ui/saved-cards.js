/**
 * ui/saved-cards.js — Saved cards renderer
 */

'use strict';

export class DiptyqueSavedCardsRenderer {
  /**
   * @param {HTMLElement} container
   * @param {Function} t
   */
  constructor(container, t) {
    this._container = container;
    this._t = t;
  }

  render() {
    this._container.innerHTML = `
      <div class="saved-cards-page">
        <div class="saved-cards-page__content">
          <p class="saved-cards-page__empty">
            ${this._t('saved_cards_empty', '決済方法が保存されていません。')}
          </p>
        </div>
      </div>

      <style>
        .saved-cards-page {
          max-width: 560px;
        }

        .saved-cards-page__empty {
          font-size: 0.88rem;
          color: var(--color-foreground);
          line-height: 1.6;
        }
      </style>
    `;
  }
}
