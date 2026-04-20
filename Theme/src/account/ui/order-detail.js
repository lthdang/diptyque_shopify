/**
 * ui/order-detail.js — Order detail page renderer
 */

'use strict';

import { formatDate }  from '../utils/formatDate.js';
import { formatPrice } from '../utils/formatPrice.js';
import { mapFinancialStatus, mapFulfillmentStatus } from '../utils/mapOrderStatus.js';
import { navigate }    from '../account-navigation.js';

export class DiptyqueOrderDetailRenderer {
  /**
   * @param {HTMLElement} container
   * @param {Function}    t  i18n lookup fn
   */
  constructor(container, t) {
    this._container = container;
    this.t = t;
  }

  renderLoading() {
    this._container.innerHTML = `
      <div class="order-detail__loading">${this.t('loading', '読み込み中…')}</div>`;
  }

  renderError(message) {
    this._container.innerHTML = `
      <div class="order-detail__error">${message}</div>`;
  }

  renderOrder(order) {
    const t = this.t;
    const financialMap   = mapFinancialStatus(order.financialStatus) || {};
    const fulfillmentMap = mapFulfillmentStatus(order.fulfillmentStatus) || {};
    const statusLabel    = financialMap.label || fulfillmentMap.label || order.financialStatus;
    const statusMod      = financialMap.modifier || fulfillmentMap.modifier || 'default';

    const items = order.lineItems.edges.map(({ node }) => {
      const img = node.variant?.image
        ? `<img src="${node.variant.image.url}" alt="${node.variant.image.altText || node.title}" class="order-detail__item-img">`
        : `<div class="order-detail__item-img order-detail__item-img--placeholder"></div>`;
      return `
        <div class="order-detail__item">
          ${img}
          <div class="order-detail__item-info">
            <p class="order-detail__item-title">${node.title}</p>
            ${node.variant?.title && node.variant.title !== 'Default Title'
              ? `<p class="order-detail__item-variant">${node.variant.title}</p>`
              : ''}
            <p class="order-detail__item-qty">${t('qty', '数量')}: ${node.quantity}</p>
          </div>
          <p class="order-detail__item-price">${formatPrice(node.originalTotalPrice)}</p>
        </div>`;
    }).join('');

    const addr = order.shippingAddress;
    const addrHtml = addr
      ? `<address class="order-detail__address">
          ${addr.lastName} ${addr.firstName}<br>
          ${addr.address1}${addr.address2 ? ' ' + addr.address2 : ''}<br>
          ${addr.city} ${addr.province} ${addr.zip}<br>
          ${addr.country}
         </address>`
      : '';

    this._container.innerHTML = `
      <div class="order-detail">
        <button type="button" class="order-detail__back js-order-detail-back">
          ← ${t('nav_orders', '注文履歴')}
        </button>

        <header class="order-detail__header">
          <h2 class="order-detail__number">${t('order_number', '注文番号')} #${order.orderNumber}</h2>
          <time class="order-detail__date" datetime="${order.processedAt}">
            ${formatDate(order.processedAt)}
          </time>
          <span class="order-detail__status order-detail__status--${statusMod}">
            ${statusLabel}
          </span>
        </header>

        <section class="order-detail__items">
          <h3 class="order-detail__section-title">${t('order_items', '商品')}</h3>
          ${items}
        </section>

        <section class="order-detail__totals">
          <div class="order-detail__total-row">
            <span>${t('subtotal', '小計')}</span>
            <span>${formatPrice(order.subtotalPrice)}</span>
          </div>
          <div class="order-detail__total-row">
            <span>${t('shipping', '配送料')}</span>
            <span>${formatPrice(order.totalShippingPrice)}</span>
          </div>
          <div class="order-detail__total-row order-detail__total-row--grand">
            <span>${t('total', '合計')}</span>
            <span>${formatPrice(order.totalPrice)}</span>
          </div>
        </section>

        ${addr ? `<section class="order-detail__shipping">
          <h3 class="order-detail__section-title">${t('shipping_address', '配送先')}</h3>
          ${addrHtml}
        </section>` : ''}
      </div>`;

    this._container.querySelector('.js-order-detail-back')
      ?.addEventListener('click', () => navigate({ view: 'orders' }));
  }
}
