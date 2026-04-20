'use strict';

import { escapeHtml } from '../utils/index.js';
import { formatDate }         from '../utils/formatDate.js';
import { formatPrice }        from '../utils/formatPrice.js';
import { mapFinancialStatus, mapFulfillmentStatus, getOrderTab } from '../utils/mapOrderStatus.js';

const TABS = [
  { key: 'all',        labelKey: 'tab_all' },
  { key: 'processing', labelKey: 'tab_processing' },
  { key: 'shipped',    labelKey: 'tab_shipped' },
  { key: 'cancelled',  labelKey: 'tab_cancelled' },
  { key: 'returned',   labelKey: 'tab_returned' },
];

export class DiptyqueOrderListRenderer {
  /**
   * @param {HTMLElement} container  #order-history-container
   * @param {Function}    t          i18n lookup fn
   */
  constructor(container, t) {
    this._container = container;
    this.t          = t;
    this._handlers  = {};
    this._activeTab = 'all';
    this._expanded  = new Set();
    this._bound     = false;
  }

  // ── Event dispatch ─────────────────────────────────────────────────────────

  on(action, handler) { this._handlers[action] = handler; }
  _emit(action, ...args) { if (this._handlers[action]) this._handlers[action](...args); }

  // ── Top-level render ───────────────────────────────────────────────────────

  render(state) {
    if (state.status === 'loading' && !state.orders.length) {
      this._renderLoading();
      return;
    }
    if (state.status === 'error') {
      this._renderError(state.error);
      return;
    }
    this._renderPage(state);
  }

  _renderLoading() {
    this._container.innerHTML = `
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this.t('loading', '読み込み中...')}</p>
      </div>`;
  }

  _renderError(message) {
    this._container.innerHTML = `
      <p class="my-account__form-message--error" style="margin-top:20px;">
        ${escapeHtml(message || this.t('load_error', '注文履歴の読み込みに失敗しました。'))}
      </p>`;
  }

  _renderPage(state) {
    const { orders, hasNextPage, loadingMore } = state;
    const filtered = this._filterOrders(orders, this._activeTab);

    const noticeHtml  = `<p class="order-history__notice">${this.t('order_history_notice', '本ページでは2021年以降のご注文履歴をご確認いただけます。2020年以前のご注文に関するお問い合わせはカスタマーサービスへご連絡ください。')}</p>`;
    const tabsHtml    = this._renderTabs(orders);
    const listHtml    = filtered.length ? filtered.map(o => this._renderOrderCard(o)).join('') : this._renderEmpty();
    const loadMoreHtml = hasNextPage
      ? `<div class="order-history__load-more-wrap">
           <button class="order-history__load-more-btn${loadingMore ? ' is-loading' : ''}"
                   data-action="load-more" ${loadingMore ? 'disabled' : ''}>
             ${loadingMore ? this.t('loading', '読み込み中...') : this.t('load_more', 'さらに表示する')}
           </button>
         </div>`
      : '';
    const supportHtml = this._renderSupportBlock();

    this._container.innerHTML = `
      <div class="order-history">
        ${noticeHtml}
        ${tabsHtml}
        <div class="order-history__list" id="order-history-list">
          ${listHtml}
        </div>
        ${loadMoreHtml}
        ${supportHtml}
      </div>`;

    this._bindEvents();
  }

  // ── Tab filter ─────────────────────────────────────────────────────────────

  _filterOrders(orders, tab) {
    if (tab === 'all') return orders;
    return orders.filter(o => getOrderTab(o) === tab);
  }

  _renderTabs(orders = []) {
    const counts = {};
    counts['all'] = orders.length;
    TABS.filter(t => t.key !== 'all').forEach(tab => {
      counts[tab.key] = orders.filter(o => getOrderTab(o) === tab.key).length;
    });

    return `
      <div class="order-history__tabs" role="tablist">
        ${TABS.map(tab => `
          <button class="order-history__tab${this._activeTab === tab.key ? ' is-active' : ''}"
                  role="tab" aria-selected="${this._activeTab === tab.key}"
                  data-action="tab" data-tab="${tab.key}">
            ${this.t(tab.labelKey, tab.key)}
            <span class="order-history__tab-count">${counts[tab.key]}</span>
          </button>
        `).join('')}
      </div>`;
  }

  // ── Order card ─────────────────────────────────────────────────────────────

  _renderOrderCard(order) {
    const financial   = mapFinancialStatus(order.financialStatus);
    const fulfillment = mapFulfillmentStatus(order.fulfillmentStatus);
    const statusLabel = financial ? financial.label : fulfillment.label;
    const statusMod   = financial ? financial.modifier : fulfillment.modifier;
    const date        = formatDate(order.processedAt, 'YYYY年M月D日');
    const isOpen      = this._expanded.has(order.id);
    const tracking    = this._resolveTracking(order);

    const edges      = order.lineItems?.edges ?? [];
    const firstItem  = edges[0]?.node;
    const imgUrl     = firstItem?.variant?.image?.url ?? '';
    const imgAlt     = firstItem?.variant?.image?.altText ?? firstItem?.title ?? '';
    const totalQty   = edges.reduce((s, { node }) => s + (node.quantity ?? 1), 0);

    return `
      <div class="order-history__card" data-order-id="${escapeHtml(order.id)}">
        <div class="order-history__card-header">
          <span class="order-history__status order-history__status--${statusMod}">${statusLabel}</span>
          <span class="order-history__date">${date}</span>
        </div>

        <div class="order-history__card-body">
          <div class="order-history__card-thumb">
            ${imgUrl
              ? `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(imgAlt)}" loading="lazy">`
              : `<div class="order-history__card-thumb-placeholder"></div>`
            }
            <span class="order-history__card-thumb-count">${totalQty}</span>
          </div>

          <div class="order-history__card-info">
            <p class="order-history__order-id">
              ${this.t('order_id_label', 'ご注文ID')} <strong>${escapeHtml(order.name)}</strong>
            </p>

            <p class="order-history__tracking${tracking ? '' : ' order-history__tracking--unavailable'}">
              ${tracking
                ? `<a href="${escapeHtml(tracking.url)}" target="_blank" rel="noopener">${escapeHtml(tracking.number)}</a>`
                : this.t('order_tracking_unavailable', 'トラッキングはご利用できません')
              }
            </p>

            <button class="order-history__toggle${isOpen ? ' is-open' : ''}"
                    data-action="toggle-detail" data-order-id="${escapeHtml(order.id)}">
              ${this.t('order_toggle_detail', 'ご注文詳細をみる')}
              <span class="order-history__toggle-arrow">▶</span>
            </button>
          </div>
        </div>

        <div class="order-history__detail${isOpen ? ' is-open' : ''}" data-detail-id="${escapeHtml(order.id)}">
          <div class="order-history__detail-inner">
            ${this._renderLineItems(order)}
            ${this._renderAddresses(order)}
            ${this._renderPayment(order)}
            ${this._renderDetailActions(order)}
          </div>
        </div>
      </div>`;
  }

  _resolveTracking(order) {
    const fulfillments = order.successfulFulfillments ?? [];
    for (const f of fulfillments) {
      const info = f.trackingInfo?.[0];
      if (info?.number) return info;
    }
    return null;
  }

  _renderLineItems(order) {
    const edges = order.lineItems?.edges ?? [];
    if (!edges.length) return '';
    const itemsHtml = edges.map(({ node: item }) => {
      const img     = item.variant?.image;
      const price   = formatPrice(item.originalTotalPrice ?? item.variant?.price);
      const variant = item.variant?.title && item.variant.title !== 'Default Title'
        ? `<span class="order-history__item-variant">${escapeHtml(item.variant.title)}</span>` : '';
      return `
        <div class="order-history__item">
          <div class="order-history__item-image${img ? '' : ' order-history__item-image--placeholder'}">
            ${img ? `<img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.altText ?? item.title)}" loading="lazy">` : ''}
          </div>
          <div class="order-history__item-info">
            <p class="order-history__item-name">${escapeHtml(item.title)}</p>
            ${variant}
            <p class="order-history__item-meta">数量: ${item.quantity}</p>
          </div>
          <p class="order-history__item-price">${price}</p>
        </div>`;
    }).join('');
    return `<div class="order-history__items">${itemsHtml}</div>`;
  }

  _renderAddresses(order) {
    const ship = order.shippingAddress;
    const bill = order.billingAddress;
    if (!ship && !bill) return '';

    const fmtAddr = (a) => {
      if (!a) return '—';
      const name = `${escapeHtml(a.lastName ?? '')} ${escapeHtml(a.firstName ?? '')}`.trim();
      const lines = [
        name,
        a.zip && a.province ? `〒${escapeHtml(a.zip)} ${escapeHtml(a.province)}` : '',
        a.city ? escapeHtml(a.city) : '',
        a.address1 ? escapeHtml(a.address1) : '',
        a.address2 ? escapeHtml(a.address2) : '',
        a.phone ? escapeHtml(a.phone) : '',
      ].filter(Boolean);
      return lines.join('<br>');
    };

    return `
      <div class="order-history__addresses">
        <div class="order-history__address-col">
          <h4 class="order-history__address-title">${this.t('order_shipping_address', '配送先情報')}</h4>
          <p class="order-history__address-body">${fmtAddr(ship)}</p>
          <p class="order-history__shipping-time">${this.t('order_shipping_time', '配送時間: 指定しない')}</p>
        </div>
        <div class="order-history__address-col">
          <h4 class="order-history__address-title">${this.t('order_billing_address', 'ご依頼主')}</h4>
          <p class="order-history__address-body">${fmtAddr(bill)}</p>
        </div>
      </div>`;
  }

  _renderPayment(order) {
    const subtotal = formatPrice(order.subtotalPrice);
    const tax      = formatPrice(order.totalTax);
    const total    = formatPrice(order.currentTotalPrice);
    return `
      <div class="order-history__payment">
        <h4 class="order-history__payment-title">${this.t('order_payment_details', 'お支払い明細')}</h4>
        <div class="order-history__payment-row">
          <span>${this.t('order_subtotal', '小計')}</span>
          <span>${subtotal}</span>
        </div>
        <div class="order-history__payment-row">
          <span>${this.t('order_tax', '税')}</span>
          <span>${tax}</span>
        </div>
        <div class="order-history__payment-row order-history__payment-row--total">
          <span>${this.t('order_grand_total', '合計 (税込)')}</span>
          <span>${total}</span>
        </div>
      </div>`;
  }

  _renderDetailActions(order) {
    return `
      <div class="order-history__detail-actions">
        <button class="order-history__receipt-btn"
                data-action="print-receipt" data-order-id="${escapeHtml(order.id)}">
          ${this.t('order_download_receipt', '領収書をダウンロードする')}
        </button>
        <button class="order-history__reorder-link"
                data-action="reorder" data-order-id="${escapeHtml(order.id)}">
          ${this.t('order_reorder', 'もう一度注文する')}
        </button>
      </div>`;
  }

  _renderEmpty() {
    return `
      <div class="my-account__empty">
        <p>${this.t('no_orders', '注文履歴はまだありません。')}</p>
        <a href="/collections/all" class="button">${this.t('start_shopping', 'ショッピングを始める')}</a>
      </div>`;
  }

  _renderSupportBlock() {
    return `
      <section class="order-history__support" aria-label="${this.t('order_support_title', '何かお困りですか？')}">
        <h3 class="order-history__support-title">${this.t('order_support_title', '何かお困りですか？')}</h3>

        <p class="order-history__support-body">
          ${this.t('order_support_body_line1', 'ご不明な点がございましたらカスタマーサービスまで')}<br>
          ${this.t('order_support_body_line2', 'お問い合わせください。')}<br>
          ${this.t('order_support_body_line3', 'ご注文でお困りの際は、カスタマーサービスにてご')}<br>
          ${this.t('order_support_body_line4', '注文を承りますので、お問合せフォームよりお申し')}<br>
          ${this.t('order_support_body_line5', '付けください。')}
        </p>

        <a href="/pages/contact" class="order-history__support-contact-btn">
          ・ ${this.t('contact_btn', 'お問い合わせフォーム')} ・
        </a>

        <p class="order-history__support-hours-label">${this.t('order_support_hours_label', 'カスタマーサービス 営業時間')}</p>
        <p class="order-history__support-hours-text">
          ${this.t('order_support_hours_line1', '月曜日 - 金曜日： 10. 00 - 16. 00')}<br>
          ${this.t('order_support_hours_line2', '（土日祝日を除く）')}
        </p>

        <a href="/pages/faq" class="order-history__support-help-link">${this.t('help_guide_link', 'オンラインヘルプガイドはこちら')}</a>
      </section>`;
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  _bindEvents() {
    if (this._bound) return;
    this._bound = true;

    this._container.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;

      if (action === 'tab') {
        this._activeTab = btn.dataset.tab;
        this._emit('order:tab-change', this._activeTab);
        return;
      }

      if (action === 'load-more') {
        this._emit('order:load-more');
        return;
      }

      if (action === 'toggle-detail') {
        const orderId = btn.dataset.orderId;
        if (this._expanded.has(orderId)) {
          this._expanded.delete(orderId);
        } else {
          this._expanded.add(orderId);
        }
        const card   = this._container.querySelector(`.order-history__card[data-order-id="${CSS.escape(orderId)}"]`);
        const detail = this._container.querySelector(`.order-history__detail[data-detail-id="${CSS.escape(orderId)}"]`);
        if (card) {
          const toggleBtn = card.querySelector('[data-action="toggle-detail"]');
          const isOpen = this._expanded.has(orderId);
          toggleBtn?.classList.toggle('is-open', isOpen);
          detail?.classList.toggle('is-open', isOpen);
        }
        return;
      }

      if (action === 'reorder') {
        btn.disabled    = true;
        btn.textContent = this.t('loading', '読み込み中...');
        btn.classList.add('is-loading');
        this._emit('order:reorder', btn.dataset.orderId);
      }

      if (action === 'print-receipt') {
        this._emit('order:print-receipt', btn.dataset.orderId);
      }
    });
  }

  setLoadingMore(isLoading) {
    const btn = this._container.querySelector('[data-action="load-more"]');
    if (!btn) return;
    btn.disabled    = isLoading;
    btn.textContent = isLoading ? this.t('loading', '読み込み中...') : this.t('load_more', 'さらに表示する');
    btn.classList.toggle('is-loading', isLoading);
  }

  /**
   * Restore the reorder button for a given order after a failed attempt.
   * On success we redirect to cart so restoration is not needed.
   * @param {string}  orderId
   * @param {boolean} isLoading
   */
  setReordering(orderId, isLoading) {
    const btn = this._container.querySelector(
      `[data-action="reorder"][data-order-id="${CSS.escape(orderId)}"]`
    );
    if (!btn) return;
    btn.disabled    = isLoading;
    btn.textContent = isLoading
      ? this.t('loading', '読み込み中...')
      : this.t('order_reorder', 'もう一度注文する');
    btn.classList.toggle('is-loading', isLoading);
  }
}
