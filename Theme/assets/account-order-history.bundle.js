(function() {
  "use strict";
  function loadI18n(elementId) {
    let strings = {};
    try {
      const el = document.getElementById(elementId);
      if (el && el.textContent.trim() !== "null") {
        strings = JSON.parse(el.textContent) || {};
      }
    } catch (e) {
      console.warn("[DiptyqueAccount] Failed to parse i18n from #" + elementId, e);
    }
    return function t(key, fallback) {
      if (key in strings) return strings[key];
      if (fallback !== void 0) return fallback;
      console.warn("[DiptyqueAccount] Missing i18n key:", key);
      return key;
    };
  }
  function loadConfig(elementId) {
    try {
      const el = document.getElementById(elementId);
      if (el) return JSON.parse(el.textContent) || {};
    } catch (e) {
      console.warn("[DiptyqueAccount] Failed to parse config from #" + elementId, e);
    }
    return {};
  }
  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }
  const DiptyqueNativeSession = {
    get() {
      const el = document.getElementById("my-account-native-customer");
      if (!el) return null;
      try {
        return JSON.parse(el.textContent || "null") || null;
      } catch (e) {
        console.warn("[DiptyqueAccount] Failed to parse #ma-native-customer JSON", e);
        return null;
      }
    }
  };
  class DiptyqueStorefrontClient {
    /**
     * @param {string} endpoint  Full Storefront GraphQL endpoint URL
     * @param {string} token     Public Storefront access token
     */
    constructor(endpoint, token) {
      if (!endpoint) throw new Error("[DiptyqueStorefrontClient] endpoint is required");
      if (!token) throw new Error("[DiptyqueStorefrontClient] token is required");
      this._endpoint = endpoint;
      this._token = token;
    }
    /**
     * Execute a GraphQL operation.
     * @param {string} query
     * @param {Object} [variables]
     * @returns {Promise<Object>}  `data` field from the GraphQL response
     */
    async request(query, variables = {}) {
      let res;
      try {
        res = await fetch(this._endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Shopify-Storefront-Access-Token": this._token
          },
          body: JSON.stringify({ query, variables })
        });
      } catch (networkErr) {
        throw new Error("[StorefrontClient] Network error: " + networkErr.message);
      }
      if (!res.ok) {
        throw new Error("[StorefrontClient] HTTP " + res.status + " " + res.statusText);
      }
      const json = await res.json();
      if (json.errors && json.errors.length) {
        const msg = json.errors.map((e) => e.message).join("; ");
        throw new Error("[StorefrontClient] GraphQL error: " + msg);
      }
      return json.data || {};
    }
  }
  const GET_ORDERS_PAGINATED_QUERY = (
    /* graphql */
    `
  query GetCustomerOrdersPaginated($token: String!, $first: Int!, $after: String) {
    customer(customerAccessToken: $token) {
      orders(first: $first, after: $after, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          cursor
          node {
            id
            name
            processedAt
            financialStatus
            fulfillmentStatus
            statusUrl
            currentTotalPrice { amount currencyCode }
            subtotalPrice     { amount currencyCode }
            totalTax          { amount currencyCode }
            shippingAddress {
              firstName lastName
              address1 address2
              city province zip country phone
            }
            billingAddress {
              firstName lastName
              address1 address2
              city province zip country phone
            }
            successfulFulfillments(first: 5) {
              trackingCompany
              trackingInfo { number url }
            }
            totalShippingPrice { amount currencyCode }
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                  originalTotalPrice { amount currencyCode }
                  variant {
                    id
                    title
                    image { url(transform: { maxWidth: 240 }) altText }
                    price { amount currencyCode }
                  }
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`
  );
  class DiptyqueOrderPaginatedApi {
    /** @param {import('./storefront').DiptyqueStorefrontClient} storefrontClient */
    constructor(storefrontClient) {
      this._sf = storefrontClient;
    }
    /**
     * Fetch a page of orders.
     * @param {string}      accessToken
     * @param {number}      [pageSize=10]
     * @param {string|null} [after=null]   cursor for next page
     * @returns {Promise<{ orders: Object[], pageInfo: Object }>}
     */
    async list(accessToken, pageSize = 10, after = null) {
      var _a;
      const variables = { token: accessToken, first: pageSize };
      if (after) variables.after = after;
      const data = await this._sf.request(GET_ORDERS_PAGINATED_QUERY, variables);
      const conn = ((_a = data == null ? void 0 : data.customer) == null ? void 0 : _a.orders) ?? { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
      return {
        orders: conn.edges.map((e) => ({ ...e.node, _cursor: e.cursor })),
        pageInfo: conn.pageInfo
      };
    }
  }
  function formatDate(isoString, format = "YYYY/MM/DD") {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d)) return String(isoString);
    const map = {
      YYYY: d.getFullYear(),
      MM: String(d.getMonth() + 1).padStart(2, "0"),
      M: d.getMonth() + 1,
      DD: String(d.getDate()).padStart(2, "0"),
      D: d.getDate()
    };
    return format.replace(/YYYY|MM|DD|M|D/g, (key) => map[key]);
  }
  function formatPrice(money) {
    if (!money) return "";
    const amount = parseFloat(money.amount ?? 0);
    const currency = money.currencyCode ?? "JPY";
    try {
      return new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency,
        minimumFractionDigits: currency === "JPY" ? 0 : 2
      }).format(amount);
    } catch {
      return `${currency} ${amount}`;
    }
  }
  const FINANCIAL_STATUS_MAP = {
    PAID: { label: "支払い済み", modifier: "paid" },
    PENDING: { label: "処理中", modifier: "pending" },
    AUTHORIZED: { label: "処理中", modifier: "pending" },
    PARTIALLY_PAID: { label: "処理中", modifier: "pending" },
    REFUNDED: { label: "返金済み", modifier: "refunded" },
    PARTIALLY_REFUNDED: { label: "返金済み", modifier: "refunded" },
    VOIDED: { label: "キャンセル", modifier: "cancelled" }
  };
  const FULFILLMENT_STATUS_MAP = {
    FULFILLED: { label: "配送済み", modifier: "fulfilled" },
    PARTIAL: { label: "一部配送", modifier: "partial" },
    UNFULFILLED: { label: "準備中", modifier: "unfulfilled" },
    IN_TRANSIT: { label: "配送中", modifier: "in-transit" },
    DELIVERED: { label: "配達完了", modifier: "delivered" }
  };
  function mapFinancialStatus(financialStatus) {
    return FINANCIAL_STATUS_MAP[financialStatus == null ? void 0 : financialStatus.toUpperCase()] ?? { label: "処理中", modifier: "pending" };
  }
  function mapFulfillmentStatus(fulfillmentStatus) {
    if (!fulfillmentStatus) return null;
    return FULFILLMENT_STATUS_MAP[fulfillmentStatus == null ? void 0 : fulfillmentStatus.toUpperCase()] ?? null;
  }
  function getOrderTab(order) {
    const fs = (order.financialStatus ?? "").toUpperCase();
    const ff = (order.fulfillmentStatus ?? "").toUpperCase();
    if (fs === "REFUNDED" || fs === "PARTIALLY_REFUNDED") return "returned";
    if (fs === "VOIDED") return "cancelled";
    if (ff === "FULFILLED" || ff === "DELIVERED" || ff === "IN_TRANSIT") return "shipped";
    return "processing";
  }
  const TABS = [
    { key: "all", labelKey: "tab_all" },
    { key: "processing", labelKey: "tab_processing" },
    { key: "shipped", labelKey: "tab_shipped" },
    { key: "cancelled", labelKey: "tab_cancelled" },
    { key: "returned", labelKey: "tab_returned" }
  ];
  class DiptyqueOrderListRenderer {
    /**
     * @param {HTMLElement} container  #order-history-container
     * @param {Function}    t          i18n lookup fn
     */
    constructor(container, t) {
      this._container = container;
      this.t = t;
      this._handlers = {};
      this._activeTab = "all";
      this._expanded = /* @__PURE__ */ new Set();
      this._bound = false;
    }
    // ── Event dispatch ─────────────────────────────────────────────────────────
    on(action, handler) {
      this._handlers[action] = handler;
    }
    _emit(action, ...args) {
      if (this._handlers[action]) this._handlers[action](...args);
    }
    // ── Top-level render ───────────────────────────────────────────────────────
    render(state) {
      if (state.status === "loading" && !state.orders.length) {
        this._renderLoading();
        return;
      }
      if (state.status === "error") {
        this._renderError(state.error);
        return;
      }
      this._renderPage(state);
    }
    _renderLoading() {
      this._container.innerHTML = `
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this.t("loading", "読み込み中...")}</p>
      </div>`;
    }
    _renderError(message) {
      this._container.innerHTML = `
      <p class="my-account__form-message--error" style="margin-top:20px;">
        ${escapeHtml(message || this.t("load_error", "注文履歴の読み込みに失敗しました。"))}
      </p>`;
    }
    _renderPage(state) {
      const { orders, hasNextPage, loadingMore } = state;
      const filtered = this._filterOrders(orders, this._activeTab);
      const noticeHtml = `<p class="order-history__notice">${this.t("order_history_notice", "本ページでは2021年以降のご注文履歴をご確認いただけます。2020年以前のご注文に関するお問い合わせはカスタマーサービスへご連絡ください。")}</p>`;
      const tabsHtml = this._renderTabs(orders);
      const listHtml = filtered.length ? filtered.map((o) => this._renderOrderCard(o)).join("") : this._renderEmpty();
      const loadMoreHtml = hasNextPage ? `<div class="order-history__load-more-wrap">
           <button class="order-history__load-more-btn${loadingMore ? " is-loading" : ""}"
                   data-action="load-more" ${loadingMore ? "disabled" : ""}>
             ${loadingMore ? this.t("loading", "読み込み中...") : this.t("load_more", "さらに表示する")}
           </button>
         </div>` : "";
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
      if (tab === "all") return orders;
      return orders.filter((o) => getOrderTab(o) === tab);
    }
    _renderTabs(orders = []) {
      const counts = {};
      counts["all"] = orders.length;
      TABS.filter((t) => t.key !== "all").forEach((tab) => {
        counts[tab.key] = orders.filter((o) => getOrderTab(o) === tab.key).length;
      });
      return `
      <div class="order-history__tabs" role="tablist">
        ${TABS.map((tab) => `
          <button class="order-history__tab${this._activeTab === tab.key ? " is-active" : ""}"
                  role="tab" aria-selected="${this._activeTab === tab.key}"
                  data-action="tab" data-tab="${tab.key}">
            ${this.t(tab.labelKey, tab.key)}
            <span class="order-history__tab-count">${counts[tab.key]}</span>
          </button>
        `).join("")}
      </div>`;
    }
    // ── Order card ─────────────────────────────────────────────────────────────
    _renderOrderCard(order) {
      var _a, _b, _c, _d, _e, _f;
      const financial = mapFinancialStatus(order.financialStatus);
      const fulfillment = mapFulfillmentStatus(order.fulfillmentStatus);
      const statusLabel = financial ? financial.label : fulfillment.label;
      const statusMod = financial ? financial.modifier : fulfillment.modifier;
      const date = formatDate(order.processedAt, "YYYY年M月D日");
      const isOpen = this._expanded.has(order.id);
      const tracking = this._resolveTracking(order);
      const edges = ((_a = order.lineItems) == null ? void 0 : _a.edges) ?? [];
      const firstItem = (_b = edges[0]) == null ? void 0 : _b.node;
      const imgUrl = ((_d = (_c = firstItem == null ? void 0 : firstItem.variant) == null ? void 0 : _c.image) == null ? void 0 : _d.url) ?? "";
      const imgAlt = ((_f = (_e = firstItem == null ? void 0 : firstItem.variant) == null ? void 0 : _e.image) == null ? void 0 : _f.altText) ?? (firstItem == null ? void 0 : firstItem.title) ?? "";
      const totalQty = edges.reduce((s, { node }) => s + (node.quantity ?? 1), 0);
      return `
      <div class="order-history__card" data-order-id="${escapeHtml(order.id)}">
        <div class="order-history__card-header">
          <span class="order-history__status order-history__status--${statusMod}">${statusLabel}</span>
          <span class="order-history__date">${date}</span>
        </div>

        <div class="order-history__card-body">
          <div class="order-history__card-thumb">
            ${imgUrl ? `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(imgAlt)}" loading="lazy">` : `<div class="order-history__card-thumb-placeholder"></div>`}
            <span class="order-history__card-thumb-count">${totalQty}</span>
          </div>

          <div class="order-history__card-info">
            <p class="order-history__order-id">
              ${this.t("order_id_label", "ご注文ID")} <strong>${escapeHtml(order.name)}</strong>
            </p>

            <p class="order-history__tracking${tracking ? "" : " order-history__tracking--unavailable"}">
              ${tracking ? `<a href="${escapeHtml(tracking.url)}" target="_blank" rel="noopener">${escapeHtml(tracking.number)}</a>` : this.t("order_tracking_unavailable", "トラッキングはご利用できません")}
            </p>

            <button class="order-history__toggle${isOpen ? " is-open" : ""}"
                    data-action="toggle-detail" data-order-id="${escapeHtml(order.id)}">
              ${this.t("order_toggle_detail", "ご注文詳細をみる")}
              <span class="order-history__toggle-arrow">▶</span>
            </button>
          </div>
        </div>

        <div class="order-history__detail${isOpen ? " is-open" : ""}" data-detail-id="${escapeHtml(order.id)}">
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
      var _a;
      const fulfillments = order.successfulFulfillments ?? [];
      for (const f of fulfillments) {
        const info = (_a = f.trackingInfo) == null ? void 0 : _a[0];
        if (info == null ? void 0 : info.number) return info;
      }
      return null;
    }
    _renderLineItems(order) {
      var _a;
      const edges = ((_a = order.lineItems) == null ? void 0 : _a.edges) ?? [];
      if (!edges.length) return "";
      const itemsHtml = edges.map(({ node: item }) => {
        var _a2, _b, _c;
        const img = (_a2 = item.variant) == null ? void 0 : _a2.image;
        const price = formatPrice(item.originalTotalPrice ?? ((_b = item.variant) == null ? void 0 : _b.price));
        const variant = ((_c = item.variant) == null ? void 0 : _c.title) && item.variant.title !== "Default Title" ? `<span class="order-history__item-variant">${escapeHtml(item.variant.title)}</span>` : "";
        return `
        <div class="order-history__item">
          <div class="order-history__item-image${img ? "" : " order-history__item-image--placeholder"}">
            ${img ? `<img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.altText ?? item.title)}" loading="lazy">` : ""}
          </div>
          <div class="order-history__item-info">
            <p class="order-history__item-name">${escapeHtml(item.title)}</p>
            ${variant}
            <p class="order-history__item-meta">数量: ${item.quantity}</p>
          </div>
          <p class="order-history__item-price">${price}</p>
        </div>`;
      }).join("");
      return `<div class="order-history__items">${itemsHtml}</div>`;
    }
    _renderAddresses(order) {
      const ship = order.shippingAddress;
      const bill = order.billingAddress;
      if (!ship && !bill) return "";
      const fmtAddr2 = (a) => {
        if (!a) return "—";
        const name = `${escapeHtml(a.lastName ?? "")} ${escapeHtml(a.firstName ?? "")}`.trim();
        const lines = [
          name,
          a.zip && a.province ? `〒${escapeHtml(a.zip)} ${escapeHtml(a.province)}` : "",
          a.city ? escapeHtml(a.city) : "",
          a.address1 ? escapeHtml(a.address1) : "",
          a.address2 ? escapeHtml(a.address2) : "",
          a.phone ? escapeHtml(a.phone) : ""
        ].filter(Boolean);
        return lines.join("<br>");
      };
      return `
      <div class="order-history__addresses">
        <div class="order-history__address-col">
          <h4 class="order-history__address-title">${this.t("order_shipping_address", "配送先情報")}</h4>
          <p class="order-history__address-body">${fmtAddr2(ship)}</p>
          <p class="order-history__shipping-time">${this.t("order_shipping_time", "配送時間: 指定しない")}</p>
        </div>
        <div class="order-history__address-col">
          <h4 class="order-history__address-title">${this.t("order_billing_address", "ご依頼主")}</h4>
          <p class="order-history__address-body">${fmtAddr2(bill)}</p>
        </div>
      </div>`;
    }
    _renderPayment(order) {
      const subtotal = formatPrice(order.subtotalPrice);
      const tax = formatPrice(order.totalTax);
      const total = formatPrice(order.currentTotalPrice);
      return `
      <div class="order-history__payment">
        <h4 class="order-history__payment-title">${this.t("order_payment_details", "お支払い明細")}</h4>
        <div class="order-history__payment-row">
          <span>${this.t("order_subtotal", "小計")}</span>
          <span>${subtotal}</span>
        </div>
        <div class="order-history__payment-row">
          <span>${this.t("order_tax", "税")}</span>
          <span>${tax}</span>
        </div>
        <div class="order-history__payment-row order-history__payment-row--total">
          <span>${this.t("order_grand_total", "合計 (税込)")}</span>
          <span>${total}</span>
        </div>
      </div>`;
    }
    _renderDetailActions(order) {
      return `
      <div class="order-history__detail-actions">
        <button class="order-history__receipt-btn"
                data-action="print-receipt" data-order-id="${escapeHtml(order.id)}">
          ${this.t("order_download_receipt", "領収書をダウンロードする")}
        </button>
        <button class="order-history__reorder-link"
                data-action="reorder" data-order-id="${escapeHtml(order.id)}">
          ${this.t("order_reorder", "もう一度注文する")}
        </button>
      </div>`;
    }
    _renderEmpty() {
      return `
      <div class="my-account__empty">
        <p>${this.t("no_orders", "注文履歴はまだありません。")}</p>
        <a href="/collections/all" class="button">${this.t("start_shopping", "ショッピングを始める")}</a>
      </div>`;
    }
    _renderSupportBlock() {
      return `
      <section class="order-history__support" aria-label="${this.t("order_support_title", "何かお困りですか？")}">
        <h3 class="order-history__support-title">${this.t("order_support_title", "何かお困りですか？")}</h3>

        <p class="order-history__support-body">
          ${this.t("order_support_body_line1", "ご不明な点がございましたらカスタマーサービスまで")}<br>
          ${this.t("order_support_body_line2", "お問い合わせください。")}<br>
          ${this.t("order_support_body_line3", "ご注文でお困りの際は、カスタマーサービスにてご")}<br>
          ${this.t("order_support_body_line4", "注文を承りますので、お問合せフォームよりお申し")}<br>
          ${this.t("order_support_body_line5", "付けください。")}
        </p>

        <a href="/pages/contact" class="order-history__support-contact-btn">
          ・ ${this.t("contact_btn", "お問い合わせフォーム")} ・
        </a>

        <p class="order-history__support-hours-label">${this.t("order_support_hours_label", "カスタマーサービス 営業時間")}</p>
        <p class="order-history__support-hours-text">
          ${this.t("order_support_hours_line1", "月曜日 - 金曜日： 10. 00 - 16. 00")}<br>
          ${this.t("order_support_hours_line2", "（土日祝日を除く）")}
        </p>

        <a href="/pages/faq" class="order-history__support-help-link">${this.t("help_guide_link", "オンラインヘルプガイドはこちら")}</a>
      </section>`;
    }
    // ── Events ─────────────────────────────────────────────────────────────────
    _bindEvents() {
      if (this._bound) return;
      this._bound = true;
      this._container.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;
        const action = btn.dataset.action;
        if (action === "tab") {
          this._activeTab = btn.dataset.tab;
          this._emit("order:tab-change", this._activeTab);
          return;
        }
        if (action === "load-more") {
          this._emit("order:load-more");
          return;
        }
        if (action === "toggle-detail") {
          const orderId = btn.dataset.orderId;
          if (this._expanded.has(orderId)) {
            this._expanded.delete(orderId);
          } else {
            this._expanded.add(orderId);
          }
          const card = this._container.querySelector(`.order-history__card[data-order-id="${CSS.escape(orderId)}"]`);
          const detail = this._container.querySelector(`.order-history__detail[data-detail-id="${CSS.escape(orderId)}"]`);
          if (card) {
            const toggleBtn = card.querySelector('[data-action="toggle-detail"]');
            const isOpen = this._expanded.has(orderId);
            toggleBtn == null ? void 0 : toggleBtn.classList.toggle("is-open", isOpen);
            detail == null ? void 0 : detail.classList.toggle("is-open", isOpen);
          }
          return;
        }
        if (action === "reorder") {
          btn.disabled = true;
          btn.textContent = this.t("loading", "読み込み中...");
          btn.classList.add("is-loading");
          this._emit("order:reorder", btn.dataset.orderId);
        }
        if (action === "print-receipt") {
          this._emit("order:print-receipt", btn.dataset.orderId);
        }
      });
    }
    setLoadingMore(isLoading) {
      const btn = this._container.querySelector('[data-action="load-more"]');
      if (!btn) return;
      btn.disabled = isLoading;
      btn.textContent = isLoading ? this.t("loading", "読み込み中...") : this.t("load_more", "さらに表示する");
      btn.classList.toggle("is-loading", isLoading);
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
      btn.disabled = isLoading;
      btn.textContent = isLoading ? this.t("loading", "読み込み中...") : this.t("order_reorder", "もう一度注文する");
      btn.classList.toggle("is-loading", isLoading);
    }
  }
  function createDiptyqueStore(initialState) {
    let state = initialState;
    const subs = /* @__PURE__ */ new Set();
    const notify = () => subs.forEach((fn) => {
      try {
        fn(state);
      } catch (e) {
        console.error("[DiptyqueStore] Subscriber error", e);
      }
    });
    return {
      get() {
        return state;
      },
      set(next) {
        state = next;
        notify();
      },
      update(fn) {
        state = fn(state);
        notify();
      },
      subscribe(listener) {
        subs.add(listener);
        return () => subs.delete(listener);
      },
      find(predicate) {
        const s = Array.isArray(state) ? state : (state == null ? void 0 : state.items) ?? (state == null ? void 0 : state.orders) ?? [];
        return s.find(predicate);
      }
    };
  }
  const diptyqueOrderHistoryStore = createDiptyqueStore({
    status: "idle",
    orders: [],
    hasNextPage: false,
    endCursor: null,
    loadingMore: false,
    error: null
  });
  const CART_ADD_URL = "/cart/add.js";
  function extractLineItems(order) {
    var _a, _b;
    const edges = ((_a = order == null ? void 0 : order.lineItems) == null ? void 0 : _a.edges) ?? [];
    const items = [];
    for (const { node } of edges) {
      if (!((_b = node.variant) == null ? void 0 : _b.id)) continue;
      const match = node.variant.id.match(/\/(\d+)$/);
      if (!match) continue;
      items.push({
        variantId: Number(match[1]),
        quantity: node.quantity ?? 1,
        title: node.title
      });
    }
    return items;
  }
  async function addToCart(item) {
    let res;
    try {
      res = await fetch(CART_ADD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ id: item.variantId, quantity: item.quantity })
      });
    } catch (networkErr) {
      const err = new Error("Network error: " + networkErr.message);
      err.item = item;
      err.networkErr = true;
      throw err;
    }
    let json;
    try {
      json = await res.json();
    } catch {
      json = {};
    }
    if (!res.ok) {
      const err = new Error(json.description || json.message || "HTTP " + res.status);
      err.item = item;
      err.status = res.status;
      err.response = json;
      throw err;
    }
    return json;
  }
  async function reorder(order) {
    const items = extractLineItems(order);
    if (!items.length) {
      return { added: [], failed: [], cartUrl: "/cart" };
    }
    const added = [];
    const failed = [];
    for (const item of items) {
      try {
        await addToCart(item);
        added.push(item);
      } catch (err) {
        console.warn("[reorder] Failed to add item to cart", item, err);
        failed.push({
          variantId: item.variantId,
          title: item.title,
          reason: err.message
        });
      }
    }
    return { added, failed, cartUrl: "/cart" };
  }
  function fmtAddr(a) {
    if (!a) return "—";
    const name = [a.lastName, a.firstName].filter(Boolean).join("");
    const cityLine = [a.zip, a.province, a.city].filter(Boolean).join(",");
    return [name, cityLine, a.address1, a.address2, a.country, a.phone].filter(Boolean).join("<br>");
  }
  function buildReceiptHtml(order, t, paymentGateway) {
    var _a, _b;
    const bill = order.billingAddress || order.shippingAddress || {};
    const ship = order.shippingAddress || {};
    const paymentMethod = paymentGateway || "";
    let shippingMethod = "—";
    if (Array.isArray(order.successfulFulfillments) && order.successfulFulfillments.length) {
      const company = order.successfulFulfillments[0].trackingCompany;
      if (company) shippingMethod = company;
    }
    let shippingFee = "¥0";
    if ((_a = order.totalShippingPrice) == null ? void 0 : _a.amount) {
      shippingFee = formatPrice(order.totalShippingPrice);
    }
    const itemRows = (((_b = order.lineItems) == null ? void 0 : _b.edges) ?? []).map(({ node }) => {
      var _a2, _b2, _c, _d, _e;
      const label = node.title + (((_a2 = node.variant) == null ? void 0 : _a2.title) && node.variant.title !== "Default Title" ? `<br><span style="font-size:11px;color:#555;">${node.variant.title}</span>` : "");
      const sku = ((_b2 = node.variant) == null ? void 0 : _b2.sku) ?? "";
      const excl = node.originalTotalPrice ? formatPrice(node.originalTotalPrice) : "";
      const qty = node.quantity ?? 1;
      let taxAmt = "";
      if ((_c = node.taxLines) == null ? void 0 : _c.length) {
        const sum = node.taxLines.reduce((s, l) => {
          var _a3;
          return s + parseFloat(((_a3 = l.price) == null ? void 0 : _a3.amount) ?? 0);
        }, 0);
        taxAmt = formatPrice({ amount: String(sum), currencyCode: ((_d = node.originalTotalPrice) == null ? void 0 : _d.currencyCode) ?? "JPY" });
      } else if ((_e = node.originalTotalPrice) == null ? void 0 : _e.amount) {
        const derived = Math.round(parseFloat(node.originalTotalPrice.amount) / 11);
        taxAmt = formatPrice({ amount: String(derived), currencyCode: node.originalTotalPrice.currencyCode ?? "JPY" });
      }
      const inclAmt = node.originalTotalPrice ? formatPrice({ amount: String(parseFloat(node.originalTotalPrice.amount)), currencyCode: node.originalTotalPrice.currencyCode }) : "";
      return `<tr>
      <td class="td-left">${label}</td>
      <td class="td-center">${sku}</td>
      <td class="td-right">${excl}</td>
      <td class="td-center">${qty}</td>
      <td class="td-right">${taxAmt}</td>
      <td class="td-right">${inclAmt}</td>
    </tr>`;
    }).join("");
    const subtotal = order.subtotalPrice ? formatPrice(order.subtotalPrice) : "";
    const taxTotal = order.totalTax ? formatPrice(order.totalTax) : "";
    const grandTotal = order.currentTotalPrice ? formatPrice(order.currentTotalPrice) : "";
    const receiptNo = order.receiptNumber ?? order.orderNumber ?? order.name ?? "";
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>領収書 — ${order.name}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #111;
      background: #fff;
      padding: 40px 48px;
      max-width: 820px;
      margin: 0 auto;
    }

    /* ─── Logo ─── */
    .logo-wrap {
      text-align: center;
      margin-bottom: 4px;
    }
    .logo-diptyque {
      font-family: 'Times New Roman', Times, serif;
      font-size: 56px;
      font-weight: 400;
      letter-spacing: 0.06em;
      line-height: 1;
    }
    .logo-paris {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 18px;
      letter-spacing: 0.22em;
      text-align: center;
      margin-bottom: 24px;
    }

    /* ─── Company info ─── */
    .company-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 10px;
    }
    .company-info {
      font-size: 12px;
      line-height: 1.8;
      text-align: right;
    }

    /* ─── Order meta dark header bar ─── */
    .order-meta-bar {
      background: #666;
      color: #fff;
      padding: 10px 14px;
      font-size: 13px;
      line-height: 1.8;
      margin-bottom: 0;
    }

    /* ─── Info table (addresses + payment/shipping) ─── */
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      border: 1px solid #bbb;
    }
    .info-table th {
      background: #f2f2f2;
      font-weight: 400;
      font-size: 13px;
      text-align: left;
      padding: 9px 14px;
      border: 1px solid #bbb;
      width: 50%;
    }
    .info-table td {
      vertical-align: top;
      font-size: 13px;
      padding: 10px 14px;
      border: 1px solid #bbb;
      line-height: 1.8;
      width: 50%;
    }

    /* ─── Items table ─── */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
    }
    .items-table thead tr {
      border-bottom: 1px solid #bbb;
    }
    .items-table th {
      font-size: 13px;
      font-weight: 400;
      padding: 8px 10px;
      text-align: left;
      border: none;
      border-bottom: 1px solid #bbb;
      white-space: nowrap;
    }
    .items-table td {
      font-size: 13px;
      padding: 10px 10px;
      border: none;
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }
    .td-left   { text-align: left; }
    .td-center { text-align: center; }
    .td-right  { text-align: right; white-space: nowrap; }

    /* ─── Totals ─── */
    .totals-wrap {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
    }
    .totals-table {
      border-collapse: collapse;
      font-size: 13px;
      min-width: 280px;
    }
    .totals-table td {
      padding: 3px 0 3px 20px;
      border: none;
    }
    .totals-table .t-label { text-align: right; color: #333; white-space: nowrap; }
    .totals-table .t-value { text-align: right; white-space: nowrap; }
    .totals-table .t-grand td { font-weight: bold; }

    @media print {
      html, body {
        width: 100%;
      }
      body {
        padding: 40px 48px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>

  <div class="logo-wrap">
    <div class="logo-diptyque">DIPTYQUE</div>
  </div>
  <div class="logo-paris">PARIS</div>

  <div class="company-row">
    <div class="company-info">
      Diptyque Japan株式会社<br>
      登録番号：T1011001062003
    </div>
  </div>

  <div class="order-meta-bar">
    領収書番号${receiptNo}<br>
    注文 # ${order.name}<br>
    注文日: ${formatDate(order.processedAt, "YYYY/MM/DD")}
  </div>

  <table class="info-table">
    <tr>
      <th>ご請求先：</th>
      <th>発送先：</th>
    </tr>
    <tr>
      <td>${fmtAddr(bill)}</td>
      <td>${fmtAddr(ship)}</td>
    </tr>
    <tr>
      <th>お支払方法：</th>
      <th>発送方法：</th>
    </tr>
    <tr>
      <td>${paymentMethod}</td>
      <td>${shippingMethod}<br><br>（配送料合計 ${shippingFee}）</td>
    </tr>
  </table>

  <table class="items-table">
    <thead>
      <tr>
        <th class="td-left" style="width:38%;">製品</th>
        <th class="td-center">SKU</th>
        <th class="td-right">合計 (税抜き)</th>
        <th class="td-center">数量</th>
        <th class="td-right">税 (10%)</th>
        <th class="td-right">合計</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals-wrap">
    <table class="totals-table">
      <tr><td class="t-label">合計:</td><td class="t-value">${subtotal}</td></tr>
      <tr><td class="t-label">Custom Fees:</td><td class="t-value">¥0</td></tr>
      <tr><td class="t-label">合計 (税抜):</td><td class="t-value">${subtotal}</td></tr>
      <tr><td class="t-label">税(10%):</td><td class="t-value">${taxTotal}</td></tr>
      <tr class="t-grand"><td class="t-label">合計 (税込):</td><td class="t-value">${grandTotal}</td></tr>
    </table>
  </div>

</body>
</html>`;
  }
  function getPaymentGatewayMap() {
    try {
      const el = document.getElementById("oh-payment-gateways");
      return el ? JSON.parse(el.textContent) : {};
    } catch {
      return {};
    }
  }
  function printReceipt(order, t) {
    const gatewayMap = getPaymentGatewayMap();
    const paymentGateway = gatewayMap[order.id] || null;
    const html = buildReceiptHtml(order, t, paymentGateway);
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    const cleanup = () => {
      window.setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 500);
    };
    document.body.appendChild(iframe);
    const win = iframe.contentWindow;
    if (!win) {
      cleanup();
      if (order.statusUrl) window.open(order.statusUrl, "_blank", "noopener,noreferrer");
      return;
    }
    win.document.write(html);
    win.document.close();
    window.setTimeout(() => {
      try {
        win.focus();
        win.onafterprint = cleanup;
        win.print();
        window.setTimeout(cleanup, 3e3);
      } catch (err) {
        cleanup();
        console.error("[printReceipt] Print failed", err);
        if (order.statusUrl) window.open(order.statusUrl, "_blank", "noopener,noreferrer");
      }
    }, 350);
  }
  const PAGE_SIZE = 10;
  class DiptyqueOrderHistoryController {
    /**
     * @param {import('../api/orders-paginated').DiptyqueOrderPaginatedApi} api
     * @param {import('../ui/order-list').DiptyqueOrderListRenderer}        renderer
     */
    constructor(api, renderer) {
      this._api = api;
      this._renderer = renderer;
      this._store = diptyqueOrderHistoryStore;
      this._token = null;
      this._unsubscribe = this._store.subscribe((state) => renderer.render(state));
      renderer.on("order:tab-change", () => {
        renderer.render(this._store.get());
      });
      renderer.on("order:load-more", () => this._loadMore());
      renderer.on("order:reorder", (orderId) => this._reorder(orderId));
      renderer.on("order:print-receipt", (orderId) => this._printReceipt(orderId));
    }
    // ── Destroy ────────────────────────────────────────────────────────────────
    /** Remove store subscription to prevent stale renders after unmount. */
    destroy() {
      if (this._unsubscribe) this._unsubscribe();
    }
    // ── Init ───────────────────────────────────────────────────────────────────
    async load(accessToken) {
      if (!accessToken) {
        window.location.href = "/";
        return;
      }
      this._token = accessToken;
      this._store.set({ status: "loading", orders: [], hasNextPage: false, endCursor: null, loadingMore: false, error: null });
      try {
        const { orders, pageInfo } = await this._api.list(accessToken, PAGE_SIZE, null);
        this._store.set({
          status: "ready",
          orders,
          hasNextPage: pageInfo.hasNextPage,
          endCursor: pageInfo.endCursor,
          loadingMore: false,
          error: null
        });
      } catch (err) {
        console.error("[OrderHistoryController] Load failed", err);
        if (err.status === 401 || err.status === 403) {
          window.location.href = "/";
          return;
        }
        this._store.set({ status: "error", orders: [], hasNextPage: false, endCursor: null, loadingMore: false, error: err.message });
      }
    }
    // ── Pagination ─────────────────────────────────────────────────────────────
    async _loadMore() {
      const current = this._store.get();
      if (!current.hasNextPage || current.loadingMore) return;
      this._store.update((s) => ({ ...s, loadingMore: true }));
      try {
        const { orders, pageInfo } = await this._api.list(this._token, PAGE_SIZE, current.endCursor);
        this._store.update((s) => ({
          ...s,
          orders: [...s.orders, ...orders],
          hasNextPage: pageInfo.hasNextPage,
          endCursor: pageInfo.endCursor,
          loadingMore: false
        }));
      } catch (err) {
        console.error("[OrderHistoryController] Load more failed", err);
        this._store.update((s) => ({ ...s, loadingMore: false }));
      }
    }
    // ── Print receipt ──────────────────────────────────────────────────────────
    _printReceipt(orderId) {
      var _a;
      const order = (_a = this._store.get().orders) == null ? void 0 : _a.find((o) => o.id === orderId);
      if (!order) {
        console.warn("[OrderHistoryController] PrintReceipt: order not found", orderId);
        return;
      }
      printReceipt(order, this._renderer.t);
    }
    // ── Reorder ────────────────────────────────────────────────────────────────
    async _reorder(orderId) {
      var _a;
      const order = (_a = this._store.get().orders) == null ? void 0 : _a.find((o) => o.id === orderId);
      if (!order) {
        console.warn("[OrderHistoryController] Reorder: order not found in store", orderId);
        return;
      }
      const { added, failed, cartUrl } = await reorder(order);
      if (added.length && !failed.length) {
        window.location.href = cartUrl;
        return;
      }
      if (added.length && failed.length) {
        const names = failed.map((f) => f.title).join(", ");
        console.warn(`[reorder] ${failed.length} item(s) could not be added: ${names}`);
        window.location.href = cartUrl;
        return;
      }
      this._renderer.setReordering(orderId, false);
      console.error("[reorder] No items could be added to cart", failed);
      alert(
        failed.map((f) => `• ${f.title}: ${f.reason}`).join("\n") || "商品をカートに追加できませんでした。"
      );
    }
  }
  function boot() {
    const container = document.getElementById("order-history-container");
    if (!container) return;
    const nativeCustomer = DiptyqueNativeSession.get();
    const storedToken = localStorage.getItem("shopifyCustomerAccessToken");
    const storedExpiry = localStorage.getItem("shopifyCustomerAccessTokenExpiresAt");
    const tokenValid = storedToken && storedExpiry && new Date(storedExpiry) > /* @__PURE__ */ new Date();
    const token = tokenValid ? storedToken : null;
    if (!nativeCustomer && !token) {
      window.location.href = "/";
      return;
    }
    const config = loadConfig("oh-config");
    const t = loadI18n("oh-i18n");
    if (!config.storefrontEndpoint || !config.storefrontToken) {
      console.error("[order-history-boot] Missing storefront config in #oh-config");
      return;
    }
    const sf = new DiptyqueStorefrontClient(config.storefrontEndpoint, config.storefrontToken);
    const api = new DiptyqueOrderPaginatedApi(sf);
    const renderer = new DiptyqueOrderListRenderer(container, t);
    const controller = new DiptyqueOrderHistoryController(api, renderer);
    controller.load(token);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
