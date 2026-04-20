/**
 * ui/order.js — Order history renderer
 * No API calls, no state writes.
 */

'use strict';

import { formatDate }  from '../utils/formatDate.js';
import { formatPrice } from '../utils/formatPrice.js';
import {
  translateOrderStatus,
  translateFulfillmentStatus,
  escapeHtml,
} from '../utils/index.js';

export class DiptyqueOrderRenderer {
  /**
   * @param {HTMLElement} container  Panel element to render into
   * @param {Function}    t          i18n lookup fn
   */
  constructor(container, t) {
    this._el = container;
    this._t  = t;
  }

  render(state) {
    if (state.status === 'loading') { this.renderLoading(); return; }
    if (state.status === 'error')   { this.renderError(state.error); return; }
    this.renderOrders(state.orders);
  }

  renderLoading() {
    this._el.innerHTML = `
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this._t('loading', '読み込み中...')}</p>
      </div>`;
  }

  renderError(message) {
    this._el.innerHTML = `<p class="my-account__form-message--error">${message || 'エラーが発生しました。'}</p>`;
  }

  renderOrders(orders) {
    const t = this._t;
    if (!orders.length) {
      this._el.innerHTML = `
        <div class="my-account__empty">
          <p>${t('no_orders', '注文履歴はまだありません。')}</p>
          <a href="/collections/all" class="my-account__shop-btn button">
            ${t('start_shopping', 'ショッピングを始める')}
          </a>
        </div>`;
      return;
    }

    this._el.innerHTML = `
      <div class="my-account__orders">
        ${orders.map(order => {
          const lines = (order.lineItems?.edges || []).map(e => e.node);
          const total = order.totalPrice;
          return `
            <div class="my-account__order">
              <div class="my-account__order-header">
                <div class="my-account__order-info">
                  <span class="my-account__order-name">${escapeHtml(order.name)}</span>
                  <span class="my-account__order-date">${formatDate(order.processedAt)}</span>
                </div>
                <div class="my-account__order-status">
                  <span class="my-account__status-badge my-account__status-badge--${(order.financialStatus || '').toLowerCase()}">
                    ${translateOrderStatus(order.financialStatus)}
                  </span>
                  <span class="my-account__status-badge my-account__status-badge--${(order.fulfillmentStatus || 'unfulfilled').toLowerCase()}">
                    ${translateFulfillmentStatus(order.fulfillmentStatus)}
                  </span>
                </div>
              </div>

              <div class="my-account__order-items">
                ${lines.map(item => {
                  const imgUrl = item.variant?.image?.url;
                  const price  = item.variant?.price;
                  return `
                    <div class="my-account__order-item">
                      ${imgUrl
                        ? `<img src="${imgUrl}" alt="${escapeHtml(item.title)}" class="my-account__item-image" loading="lazy">`
                        : '<div class="my-account__item-image my-account__item-image--placeholder"></div>'
                      }
                      <div class="my-account__item-details">
                        <p class="my-account__item-title">${escapeHtml(item.title)}</p>
                        ${item.variant?.title && item.variant.title !== 'Default Title'
                          ? `<p class="my-account__item-variant">${escapeHtml(item.variant.title)}</p>`
                          : ''
                        }
                        <p class="my-account__item-qty">${t('qty', '数量')}: ${item.quantity}</p>
                      </div>
                      <div class="my-account__item-price">
                        ${price ? formatPrice(price) : ''}
                      </div>
                    </div>`;
                }).join('')}
              </div>

              <div class="my-account__order-total">
                <span>${t('total', '合計')}</span>
                <span class="my-account__order-total-amount">
                  ${total ? formatPrice(total) : ''}
                </span>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  }
}
