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
  function isoToDisplayDate(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "";
    return iso.replace(/-/g, "/");
  }
  function displayToIsoDate(display) {
    if (!display || !/^\d{4}\/\d{2}\/\d{2}$/.test(display)) return display || "";
    return display.replace(/\//g, "-");
  }
  function gidToNumericId(gid) {
    if (!gid) return null;
    const m = gid.match(/\/(\d+)/);
    return m ? Number(m[1]) : null;
  }
  function getMetafieldValue(metafields, namespace, key) {
    if (!Array.isArray(metafields)) return "";
    const mf = metafields.find((m) => m && m.namespace === namespace && m.key === key);
    return mf ? mf.value || "" : "";
  }
  const PREFECTURE_EN_JA = {
    "Aichi": "愛知県",
    "Akita": "秋田県",
    "Aomori": "青森県",
    "Chiba": "千葉県",
    "Ehime": "愛媛県",
    "Fukui": "福井県",
    "Fukuoka": "福岡県",
    "Fukushima": "福島県",
    "Gifu": "岐阜県",
    "Gunma": "群馬県",
    "Hiroshima": "広島県",
    "Hokkaido": "北海道",
    "Hokkaidō": "北海道",
    "Hyogo": "兵庫県",
    "Hyōgo": "兵庫県",
    "Ibaraki": "茨城県",
    "Ishikawa": "石川県",
    "Iwate": "岩手県",
    "Kagawa": "香川県",
    "Kagoshima": "鹿児島県",
    "Kanagawa": "神奈川県",
    "Kochi": "高知県",
    "Kōchi": "高知県",
    "Kumamoto": "熊本県",
    "Kyoto": "京都府",
    "Kyōto": "京都府",
    "Mie": "三重県",
    "Miyagi": "宮城県",
    "Miyazaki": "宮崎県",
    "Nagano": "長野県",
    "Nagasaki": "長崎県",
    "Nara": "奈良県",
    "Niigata": "新潟県",
    "Oita": "大分県",
    "Ōita": "大分県",
    "Okayama": "岡山県",
    "Okinawa": "沖縄県",
    "Osaka": "大阪府",
    "Ōsaka": "大阪府",
    "Saga": "佐賀県",
    "Saitama": "埼玉県",
    "Shiga": "滋賀県",
    "Shimane": "島根県",
    "Shizuoka": "静岡県",
    "Tochigi": "栃木県",
    "Tokushima": "徳島県",
    "Tokyo": "東京都",
    "Tōkyō": "東京都",
    "Tottori": "鳥取県",
    "Toyama": "富山県",
    "Wakayama": "和歌山県",
    "Yamagata": "山形県",
    "Yamaguchi": "山口県",
    "Yamanashi": "山梨県"
  };
  function normalizeProvince(province) {
    return PREFECTURE_EN_JA[province] || province;
  }
  const TOKEN_KEY = "shopifyCustomerAccessToken";
  const EXPIRY_KEY = "shopifyCustomerAccessTokenExpiresAt";
  const CACHE_KEY = "shopifyCustomer";
  const DiptyqueTokenStore = {
    /**
     * @returns {{ token: string|null, isNative: boolean } | null}
     */
    get() {
      if (document.getElementById("my-account-native-customer")) {
        return { token: null, isNative: true };
      }
      const token = localStorage.getItem(TOKEN_KEY);
      const expiry = localStorage.getItem(EXPIRY_KEY);
      if (!token || !expiry) return null;
      if (new Date(expiry) <= /* @__PURE__ */ new Date()) {
        this.clear();
        return null;
      }
      return { token, isNative: false };
    },
    save(token, expiresAt) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(EXPIRY_KEY, expiresAt);
    },
    clear() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      localStorage.removeItem(CACHE_KEY);
    },
    getToken() {
      const s = this.get();
      return s ? s.token : null;
    },
    isNative() {
      return Boolean(document.getElementById("my-account-native-customer"));
    }
  };
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
  function getNativeCSRFToken() {
    var _a;
    return ((_a = document.querySelector('#ma-native-form [name="authenticity_token"]')) == null ? void 0 : _a.value) || "";
  }
  function logoutAccount(redirectUrl) {
    DiptyqueTokenStore.clear();
    sessionStorage.removeItem("dp_ca_token");
    window.location.href = redirectUrl || "/";
  }
  const VIEWS = (
    /** @type {const} */
    ["profile", "orders", "addresses", "order", "newsletter", "saved-cards"]
  );
  const DEFAULT_VIEW = "profile";
  function parseRoute() {
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get("tab") || "").trim().toLowerCase();
    const view = VIEWS.includes(raw) ? raw : DEFAULT_VIEW;
    const id = params.get("id") || null;
    return { view, id };
  }
  function navigate(params, replace = false) {
    const { view = DEFAULT_VIEW, id = null } = params;
    const safeView = VIEWS.includes(view) ? view : DEFAULT_VIEW;
    const qs = new URLSearchParams();
    if (safeView !== DEFAULT_VIEW) qs.set("tab", safeView);
    if (id) qs.set("id", id);
    const search = qs.toString() ? `?${qs.toString()}` : "";
    const url = `${window.location.pathname}${search}`;
    if (replace) {
      history.replaceState({ view: safeView, id }, "", url);
    } else {
      history.pushState({ view: safeView, id }, "", url);
    }
    window.dispatchEvent(new CustomEvent("account:routechange", {
      detail: { view: safeView, id }
    }));
  }
  class AccountRouter {
    /**
     * @param {{
     *   root:    HTMLElement           — container where views are rendered
     *   pages:   Record<string, { mount(el, ctx): Promise<void>, unmount(): void }>
     *   context: Object                — shared context passed to every page
     *   navItems?: NodeListOf<Element> — optional sidebar nav items
     * }} options
     */
    constructor({ root, pages, context, navItems }) {
      this._root = root;
      this._pages = pages;
      this._context = context;
      this._navItems = navItems || document.querySelectorAll("[data-view]");
      this._current = null;
      this._viewEl = null;
      this._onRouteChange = this._onRouteChange.bind(this);
      this._onPopState = this._onPopState.bind(this);
    }
    // ── Lifecycle ──────────────────────────────────────────────────────────────
    /** Attach event listeners and perform the initial render. */
    start() {
      window.addEventListener("account:routechange", this._onRouteChange);
      window.addEventListener("popstate", this._onPopState);
      this._renderFromURL();
    }
    /** Detach all listeners and unmount active page. */
    destroy() {
      window.removeEventListener("account:routechange", this._onRouteChange);
      window.removeEventListener("popstate", this._onPopState);
      this._unmountCurrent();
    }
    // ── Event handlers ─────────────────────────────────────────────────────────
    _onRouteChange(e) {
      const { view, id } = e.detail;
      this._renderPage(view, id);
    }
    _onPopState() {
      this._renderFromURL();
    }
    // ── Rendering ──────────────────────────────────────────────────────────────
    _renderFromURL() {
      const { view, id } = parseRoute();
      this._renderPage(view, id);
    }
    async _renderPage(view, id) {
      const cacheKey = id ? `${view}:${id}` : view;
      if (this._current === cacheKey) return;
      const pageModule = this._pages[view] || this._pages[DEFAULT_VIEW];
      this._unmountCurrent();
      const host = document.createElement("div");
      host.className = "account-view";
      host.dataset.view = view;
      this._root.appendChild(host);
      this._viewEl = host;
      this._current = cacheKey;
      this._updateNav(view);
      try {
        await pageModule.mount(host, { ...this._context, id });
      } catch (err) {
        console.error(`[AccountRouter] Failed to mount view "${view}"`, err);
        host.innerHTML = `<p class="account-view__error">ページを読み込めませんでした。</p>`;
      }
    }
    _unmountCurrent() {
      if (this._current && this._pages[this._current.split(":")[0]]) {
        try {
          this._pages[this._current.split(":")[0]].unmount();
        } catch (e) {
        }
      }
      if (this._viewEl) {
        this._viewEl.remove();
        this._viewEl = null;
      }
      this._current = null;
    }
    // ── Nav highlight ──────────────────────────────────────────────────────────
    _updateNav(view) {
      this._navItems.forEach((el) => {
        const matches = el.dataset.view === view || // 'order' detail is a sub-view of 'orders'
        el.dataset.view === "orders" && view === "order";
        el.classList.toggle("my-account__nav-item--active", matches);
      });
    }
  }
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
  class DiptyqueBackendClient {
    /**
     * @param {string}          baseUrl   Backend base URL
     * @param {() => string|null} getToken  Callback returning current access token
     */
    constructor(baseUrl, getToken) {
      if (!baseUrl) throw new Error("[DiptyqueBackendClient] baseUrl is required");
      if (!getToken) throw new Error("[DiptyqueBackendClient] getToken callback is required");
      this._base = baseUrl.replace(/\/+$/, "");
      this._getToken = getToken;
    }
    /**
     * POST JSON to a backend endpoint.
     * Automatically merges `customer_access_token` into the request body.
     * @param {string} path   e.g. "/api/customers/account/addresses/create"
     * @param {Object} [body]
     * @returns {Promise<Object>}
     */
    async post(path, body = {}) {
      const url = this._base + path;
      let res;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_access_token: this._getToken(),
            ...body
          })
        });
      } catch (networkErr) {
        throw new Error("[BackendClient] Network error: " + networkErr.message);
      }
      let json;
      try {
        json = await res.json();
      } catch {
        json = {};
      }
      if (!res.ok || json.success === false) {
        const err = new Error(json.message || "HTTP " + res.status);
        err.status = res.status;
        err.code = json.code;
        err.response = json;
        console.warn("[BackendClient]", res.status, url, json);
        throw err;
      }
      return json.data !== void 0 ? json.data : json;
    }
  }
  const FETCH_CUSTOMER_QUERY = (
    /* graphql */
    `
  query GetCustomer($token: String!) {
    customer(customerAccessToken: $token) {
      id firstName lastName email phone acceptsMarketing
      metafields(identifiers: [
        { namespace: "registration", key: "first_name_kana" }
        { namespace: "registration", key: "last_name_kana" }
        { namespace: "registration", key: "birthday" }
      ]) { namespace key value type }
      orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
        edges { node {
          id name processedAt financialStatus fulfillmentStatus
          totalPrice { amount currencyCode }
          lineItems(first: 50) {
            edges { node {
              title quantity
              variant {
                title
                image { url(transform: { maxWidth: 120 }) }
                price { amount currencyCode }
              }
            }}
          }
        }}
      }
      defaultAddress { id firstName lastName address1 city zip country phone }
      addresses(first: 20) {
        edges { node { id firstName lastName address1 address2 city province zip country phone } }
      }
    }
  }
`
  );
  const CREATE_TOKEN_MUTATION = (
    /* graphql */
    `
  mutation CustomerTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken { accessToken expiresAt }
      customerUserErrors  { field message code }
    }
  }
`
  );
  const METAFIELDS_SET_MUTATION = (
    /* graphql */
    `
  mutation CustomerMetafieldsSet($metafields: [CustomerMetafieldsSetInput!]!) {
    customerMetafieldsSet(metafields: $metafields) {
      metafields { namespace key value }
      userErrors  { field message code }
    }
  }
`
  );
  const CUSTOMER_ACCOUNT_API_ENDPOINT = "https://shopify.com/account/customer/api/2024-10/graphql";
  function _toE164Japan(raw) {
    if (!raw) return null;
    const trimmed = String(raw).trim();
    if (/^\+\d{7,15}$/.test(trimmed)) return trimmed;
    const digits = trimmed.replace(/[\s\-().]/g, "");
    if (!/^\d+$/.test(digits)) return null;
    if (/^0\d{9,10}$/.test(digits)) {
      return "+81" + digits.slice(1);
    }
    return null;
  }
  class DiptyqueCustomerApi {
    /**
     * @param {import('./storefront').DiptyqueStorefrontClient} storefrontClient
     * @param {import('./backend').DiptyqueBackendClient}       backendClient
     */
    constructor(storefrontClient, backendClient) {
      this._sf = storefrontClient;
      this._be = backendClient;
    }
    // ── Auth ───────────────────────────────────────────────────────────────────
    async createAccessToken(email, password) {
      var _a, _b, _c;
      const data = await this._sf.request(CREATE_TOKEN_MUTATION, {
        input: { email, password }
      });
      const result = data.customerAccessTokenCreate;
      const userErrors = (result == null ? void 0 : result.customerUserErrors) || [];
      if (userErrors.length || !((_a = result == null ? void 0 : result.customerAccessToken) == null ? void 0 : _a.accessToken)) {
        const err = new Error(((_b = userErrors[0]) == null ? void 0 : _b.message) || "Invalid credentials");
        err.isAuthError = true;
        err.code = ((_c = userErrors[0]) == null ? void 0 : _c.code) || "UNIDENTIFIED_CUSTOMER";
        throw err;
      }
      return result.customerAccessToken;
    }
    async verifyPassword(email, password) {
      const result = await this.createAccessToken(email, password).catch(() => {
        const pwdErr = new Error("currentPasswordInvalid");
        pwdErr.isPasswordError = true;
        pwdErr.status = 401;
        throw pwdErr;
      });
      return result.accessToken;
    }
    // ── Read ───────────────────────────────────────────────────────────────────
    async fetchCustomer(accessToken) {
      const data = await this._sf.request(FETCH_CUSTOMER_QUERY, { token: accessToken });
      return data.customer || null;
    }
    // ── Profile update (Backend) ───────────────────────────────────────────────
    async updateProfile(fields) {
      return this._be.post("/api/customers/account/update-profile", {
        first_name: fields.firstName,
        last_name: fields.lastName,
        first_name_kana: fields.first_name_kana,
        last_name_kana: fields.last_name_kana,
        email: fields.email,
        phone: fields.phone,
        birthday: fields.birthday || "",
        current_password: fields.current_password || ""
      });
    }
    // ── Password update (Backend) ──────────────────────────────────────────────
    // Backend verifies current_password internally via its own Storefront API
    // call (server-side), so no browser-side verifyPassword step is needed.
    async updatePassword(currentPassword, newPassword) {
      return this._be.post("/api/customers/account/update-password", {
        current_password: currentPassword,
        new_password: newPassword
      });
    }
    // ── Metafields (Customer Account API / PKCE) ───────────────────────────────
    async updateMetafields(fields) {
      var _a, _b, _c, _d, _e;
      const metafieldsInput = [];
      if (fields.last_name_kana) {
        metafieldsInput.push({
          namespace: "registration",
          key: "last_name_kana",
          value: fields.last_name_kana,
          type: "single_line_text_field"
        });
      }
      if (fields.first_name_kana) {
        metafieldsInput.push({
          namespace: "registration",
          key: "first_name_kana",
          value: fields.first_name_kana,
          type: "single_line_text_field"
        });
      }
      if (fields.birthday) {
        metafieldsInput.push({
          namespace: "registration",
          key: "birthday",
          value: fields.birthday,
          type: "date"
        });
      }
      if (!metafieldsInput.length) return;
      const caToken = sessionStorage.getItem("dp_ca_token");
      if (!caToken) {
        console.warn("[CustomerApi] No dp_ca_token — metafields not updated");
        return;
      }
      const res = await fetch(CUSTOMER_ACCOUNT_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: caToken },
        body: JSON.stringify({
          query: METAFIELDS_SET_MUTATION,
          variables: { metafields: metafieldsInput }
        })
      });
      if (!res.ok) throw new Error("[CustomerApi] Customer Account API HTTP " + res.status);
      const json = await res.json();
      if ((_a = json.errors) == null ? void 0 : _a.length) throw new Error(((_b = json.errors[0]) == null ? void 0 : _b.message) || "Metafield GraphQL error");
      const userErrors = ((_d = (_c = json.data) == null ? void 0 : _c.customerMetafieldsSet) == null ? void 0 : _d.userErrors) || [];
      if (userErrors.length) throw new Error(((_e = userErrors[0]) == null ? void 0 : _e.message) || "Metafield error");
    }
    // ── Native session mutations ───────────────────────────────────────────────
    async updateProfileNative(fields, csrfToken) {
      const body = new URLSearchParams();
      body.append("form_type", "customer");
      body.append("utf8", "✓");
      body.append("customer[first_name]", fields.firstName || "");
      body.append("customer[last_name]", fields.lastName || "");
      body.append("customer[email]", fields.email || "");
      if (fields.phone) {
        const e164 = _toE164Japan(fields.phone);
        if (e164) body.append("customer[phone]", e164);
      }
      if (csrfToken) body.append("authenticity_token", csrfToken);
      const res = await fetch("/account", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        credentials: "same-origin"
      });
      if (!res.ok && !res.redirected) {
        const err = new Error("Native profile update failed: HTTP " + res.status);
        err.status = res.status;
        err.isNative = true;
        throw err;
      }
    }
    async updatePasswordNative(newPassword, confirmPassword, csrfToken) {
      const body = new URLSearchParams();
      body.append("form_type", "customer");
      body.append("utf8", "✓");
      body.append("customer[password]", newPassword);
      body.append("customer[password_confirmation]", confirmPassword);
      if (csrfToken) body.append("authenticity_token", csrfToken);
      const res = await fetch("/account", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        credentials: "same-origin"
      });
      if (!res.ok && !res.redirected) {
        throw new Error("Native password update failed: HTTP " + res.status);
      }
    }
  }
  class DiptyqueProfileRenderer {
    /**
     * @param {HTMLElement} container
     * @param {Function}    t          i18n lookup fn
     */
    constructor(container, t) {
      this._el = container;
      this._t = t;
      this._handlers = {};
      this._dobPicker = null;
    }
    // ── Event dispatch ─────────────────────────────────────────────────────────
    on(action, handler) {
      this._handlers[action] = handler;
    }
    _emit(action, ...args) {
      if (this._handlers[action]) {
        this._handlers[action](...args);
      } else {
        console.warn("[ProfileRenderer] No handler for:", action);
      }
    }
    // ── Public render ──────────────────────────────────────────────────────────
    renderLoading() {
      this._el.innerHTML = `
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this._t("loading", "読み込み中...")}</p>
      </div>`;
    }
    renderLoginPrompt() {
      this._el.innerHTML = `
      <div class="my-account__not-logged-in">
        <div class="my-account__not-logged-in-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <h2>${this._t("login_required", "ログインが必要です")}</h2>
        <p>${this._t("login_prompt", "アカウント情報を表示するにはログインしてください。")}</p>
        <button type="button" class="my-account__login-btn button" data-open-account-modal="login">
          ${this._t("login_btn", "ログイン")}
        </button>
      </div>`;
    }
    renderDashboard(customer) {
      const t = this._t;
      const mfs = customer.metafields || [];
      const lastKana = escapeHtml(getMetafieldValue(mfs, "registration", "last_name_kana"));
      const firstKana = escapeHtml(getMetafieldValue(mfs, "registration", "first_name_kana"));
      const dob = escapeHtml(isoToDisplayDate(getMetafieldValue(mfs, "registration", "birthday")));
      this._el.innerHTML = `
      <!-- ── Profile section ────────────────────────────────────────── -->
      <div class="my-account__form-section" data-section="profile">
        <h2 class="my-account__section-heading">${t("profile_title", "お客様情報")}</h2>
        <div class="my-account__form-grid">

          <div class="my-account__form-field">
            <label for="ma-lastName">${t("last_name", "姓")} *</label>
            <input id="ma-lastName" name="lastName" data-field="lastName"
              class="my-account__input" type="text"
              value="${escapeHtml(customer.lastName || "")}"
              placeholder="${t("last_name", "姓")}" autocomplete="family-name">
            <span class="my-account__field-error" data-error-for="lastName" aria-live="polite"></span>
          </div>

          <div class="my-account__form-field">
            <label for="ma-firstName">${t("first_name", "名")} *</label>
            <input id="ma-firstName" name="firstName" data-field="firstName"
              class="my-account__input" type="text"
              value="${escapeHtml(customer.firstName || "")}"
              placeholder="${t("first_name", "名")}" autocomplete="given-name">
            <span class="my-account__field-error" data-error-for="firstName" aria-live="polite"></span>
          </div>

          <div class="my-account__form-field">
            <label for="ma-last-name-kana">${t("furigana_last", "フリガナ（姓）")} *</label>
            <input id="ma-last-name-kana" name="last_name_kana" data-field="last_name_kana"
              class="my-account__input" type="text"
              value="${lastKana}" placeholder="${t("furigana_last", "フリガナ（姓）")}">
            <span class="my-account__field-error" data-error-for="last_name_kana" aria-live="polite"></span>
          </div>

          <div class="my-account__form-field">
            <label for="ma-first-name-kana">${t("furigana_first", "フリガナ（名）")} *</label>
            <input id="ma-first-name-kana" name="first_name_kana" data-field="first_name_kana"
              class="my-account__input" type="text"
              value="${firstKana}" placeholder="${t("furigana_first", "フリガナ（名）")}">
            <span class="my-account__field-error" data-error-for="first_name_kana" aria-live="polite"></span>
          </div>
        </div>

        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label for="ma-dob">${t("dob", "生年月日")} <span class="my-account__info-icon">?</span></label>
          <div class="my-account__date-input">
            <input id="ma-dob" name="dob" data-field="dob"
              class="my-account__input" type="text"
              value="${dob}" placeholder="YYYY/MM/DD">
            <span id="ma-dob-toggle" class="my-account__calendar-icon" style="cursor:pointer;">
              <svg style="pointer-events:none;" width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </span>
          </div>
          <span class="my-account__field-error" data-error-for="dob" aria-live="polite"></span>
        </div>

        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label for="ma-phone">${t("phone", "電話番号")} *</label>
          <input id="ma-phone" name="phone" data-field="phone"
            class="my-account__input" type="tel"
            value="${escapeHtml(customer.phone || "")}"
            placeholder="012322222" autocomplete="tel">
          <span class="my-account__field-error" data-error-for="phone" aria-live="polite"></span>
        </div>

        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label for="ma-email">${t("email", "Eメールアドレス")} *</label>
          <input id="ma-email" name="email" data-field="email"
            class="my-account__input" type="email"
            value="${escapeHtml(customer.email || "")}"
            placeholder="your@email.com" autocomplete="email">
          <span class="my-account__field-error" data-error-for="email" aria-live="polite"></span>
        </div>

        <!-- Email change requires current password verification -->
        <div class="my-account__form-field my-account__form-field--full mt-16 my-account__form-field--hidden"
             data-profile-email-verify>
          <label for="ma-profileCurrentPassword">${t("current_password", "現在のパスワード")} *</label>
          <div class="my-account__password-input">
            <input id="ma-profileCurrentPassword" name="profileCurrentPassword"
              data-field="profileCurrentPassword"
              class="my-account__input" type="password"
              placeholder="${t("current_password", "現在のパスワード")}" autocomplete="current-password">
            ${this._eyeIcon()}
          </div>
          <span class="my-account__field-error" data-error-for="profileCurrentPassword" aria-live="polite"></span>
        </div>

        <p class="my-account__required-text">${t("required", "* 必須")}</p>
        <div class="my-account__form-message" data-form-message="profile" role="alert" aria-live="polite"></div>
        <button type="button" class="my-account__submit-btn" data-submit="profile">${t("submit", "確定")}</button>
      </div>

      <!-- ── Password section ──────────────────────────────────────── -->
      <div class="my-account__form-section mt-40" data-section="password">
        <h2 class="my-account__section-heading">${t("login_info_title", "ログイン情報")}</h2>
        ${this._passwordField("currentPassword", t("password", "パスワード"), "current-password")}
        ${this._passwordField("newPassword", t("new_password", "新しいパスワード"), "new-password", true)}
        <p class="my-account__password-hint">${t("password_hint", "ⓘ パスワードは8文字以上で、英字・数字・記号を含む必要があります。")}</p>
        ${this._passwordField("confirmPassword", t("password_confirm", "パスワード（再入力）"), "new-password")}

        <div class="my-account__form-message" data-form-message="password" role="alert" aria-live="polite"></div>
        <button type="button" class="my-account__submit-btn" data-submit="password">${t("submit", "確定")}</button>
      </div>
`;
      this._bindEvents(customer);
      this._initDobPicker();
    }
    // ── Field-level feedback ───────────────────────────────────────────────────
    setFieldError(fieldName, message) {
      const input = this._el.querySelector(`[data-field="${fieldName}"]`);
      const errEl = this._el.querySelector(`[data-error-for="${fieldName}"]`);
      if (input) {
        input.classList.add("my-account__input--error");
        input.setAttribute("aria-invalid", "true");
      }
      if (errEl) errEl.textContent = message;
    }
    clearFieldError(fieldName) {
      const input = this._el.querySelector(`[data-field="${fieldName}"]`);
      const errEl = this._el.querySelector(`[data-error-for="${fieldName}"]`);
      if (input) {
        input.classList.remove("my-account__input--error");
        input.removeAttribute("aria-invalid");
      }
      if (errEl) errEl.textContent = "";
    }
    setFormMessage(type, message, section) {
      const msgEl = this._el.querySelector(`[data-form-message="${section}"]`);
      if (!msgEl) return;
      msgEl.textContent = message;
      msgEl.className = type ? `my-account__form-message my-account__form-message--${type}` : "my-account__form-message";
      if (type === "success") {
        setTimeout(() => {
          if (msgEl.textContent === message) {
            msgEl.textContent = "";
            msgEl.className = "my-account__form-message";
          }
        }, 6e3);
      }
    }
    setSubmitState(section, loading, savingLabel) {
      const btn = this._el.querySelector(`[data-submit="${section}"]`);
      if (!btn) return;
      btn.disabled = loading;
      if (loading) {
        btn.dataset.originalText = btn.textContent;
        btn.textContent = savingLabel || "...";
        btn.classList.add("my-account__submit-btn--loading");
      } else {
        btn.textContent = btn.dataset.originalText || this._t("submit", "確定");
        delete btn.dataset.originalText;
        btn.classList.remove("my-account__submit-btn--loading");
      }
    }
    showEmailVerifyField(visible) {
      const field = this._el.querySelector("[data-profile-email-verify]");
      if (!field) return;
      field.classList.toggle("my-account__form-field--hidden", !visible);
      if (!visible) {
        const input = field.querySelector('[data-field="profileCurrentPassword"]');
        if (input) input.value = "";
        this.clearFieldError("profileCurrentPassword");
      }
    }
    getProfileFormData() {
      const g = (field) => {
        var _a;
        return (((_a = this._el.querySelector(`[data-field="${field}"]`)) == null ? void 0 : _a.value) ?? "").trim();
      };
      return {
        lastName: g("lastName"),
        firstName: g("firstName"),
        last_name_kana: g("last_name_kana"),
        first_name_kana: g("first_name_kana"),
        dob: g("dob"),
        phone: g("phone"),
        email: g("email"),
        profileCurrentPassword: g("profileCurrentPassword")
      };
    }
    getPasswordFormData() {
      const g = (field) => {
        var _a;
        return ((_a = this._el.querySelector(`[data-field="${field}"]`)) == null ? void 0 : _a.value) ?? "";
      };
      return {
        currentPassword: g("currentPassword"),
        newPassword: g("newPassword"),
        confirmPassword: g("confirmPassword")
      };
    }
    clearPasswordFields() {
      ["currentPassword", "newPassword", "confirmPassword"].forEach((f) => {
        const el = this._el.querySelector(`[data-field="${f}"]`);
        if (el) el.value = "";
      });
    }
    // ── Private helpers ────────────────────────────────────────────────────────
    _eyeIcon() {
      return `<button type="button" class="my-account__password-toggle">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    </button>`;
    }
    _passwordField(fieldName, label, autocomplete, addHintGap = false) {
      return `
      <div class="my-account__form-field my-account__form-field--full${addHintGap ? " mt-16" : ""}">
        <label for="ma-${fieldName}">${label} *</label>
        <div class="my-account__password-input">
          <input id="ma-${fieldName}" name="${fieldName}" data-field="${fieldName}"
            class="my-account__input" type="password"
            placeholder="${label}" autocomplete="${autocomplete}">
          ${this._eyeIcon()}
        </div>
        <span class="my-account__field-error" data-error-for="${fieldName}" aria-live="polite"></span>
      </div>`;
    }
    _bindEvents(customer) {
      var _a, _b;
      this._el.querySelectorAll(".my-account__password-toggle").forEach((btn) => {
        btn.addEventListener("click", () => {
          const input = btn.previousElementSibling;
          const isPass = input.type === "password";
          input.type = isPass ? "text" : "password";
          btn.innerHTML = isPass ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>' : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        });
      });
      (_a = this._el.querySelector('[data-submit="profile"]')) == null ? void 0 : _a.addEventListener("click", () => {
        this._emit("profile:submit", this.getProfileFormData());
      });
      (_b = this._el.querySelector('[data-submit="password"]')) == null ? void 0 : _b.addEventListener("click", () => {
        this._emit("password:submit", this.getPasswordFormData());
      });
      this._el.querySelectorAll("[data-field]").forEach((input) => {
        input.addEventListener("input", () => {
          this.clearFieldError(input.dataset.field);
          if (input.dataset.field === "email") {
            const changed = (customer.email || "").toLowerCase().trim() !== input.value.toLowerCase().trim();
            this.showEmailVerifyField(changed);
          }
        });
      });
      this.showEmailVerifyField(false);
    }
    _initDobPicker() {
      if (this._dobPicker) {
        try {
          this._dobPicker.destroy();
        } catch (_) {
        }
        this._dobPicker = null;
      }
      const input = document.getElementById("ma-dob");
      const toggle = document.getElementById("ma-dob-toggle");
      if (!input) return;
      const doInit = () => {
        var _a;
        const locale = typeof flatpickr !== "undefined" && ((_a = flatpickr.l10ns) == null ? void 0 : _a.ja) ? flatpickr.l10ns.ja : "default";
        const fp = flatpickr(input, {
          dateFormat: "Y/m/d",
          allowInput: true,
          disableMobile: false,
          locale,
          maxDate: "today",
          minDate: "1900-01-01",
          appendTo: document.body,
          onReady(_d, _s, instance) {
            instance.input.removeAttribute("readonly");
          },
          onChange() {
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
        });
        toggle == null ? void 0 : toggle.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          fp.open();
        });
        input.addEventListener("click", () => fp.open());
        this._dobPicker = fp;
      };
      if (typeof flatpickr !== "undefined") {
        doInit();
      } else {
        const iv = setInterval(() => {
          if (typeof flatpickr !== "undefined") {
            clearInterval(iv);
            doInit();
          }
        }, 50);
      }
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
  const diptyqueCustomerStore = createDiptyqueStore({
    status: "idle",
    customer: null,
    error: null
  });
  const diptyqueAddressStore = createDiptyqueStore({
    status: "idle",
    addresses: [],
    error: null
  });
  const diptyqueOrderHistoryStore = createDiptyqueStore({
    status: "idle",
    orders: [],
    hasNextPage: false,
    endCursor: null,
    loadingMore: false,
    error: null
  });
  class DiptyqueProfileController {
    /**
     * @param {import('../api/customer').DiptyqueCustomerApi}       api
     * @param {import('../ui/profile').DiptyqueProfileRenderer}     renderer
     * @param {{ isNative?: boolean, logoutUrl?: string }}          options
     */
    constructor(api, renderer, options = {}) {
      this._api = api;
      this._renderer = renderer;
      this._isNative = options.isNative || false;
      this._logoutUrl = options.logoutUrl || "/account/logout";
      this._getNativeSession = options.getNativeSession || null;
      this._store = diptyqueCustomerStore;
      this._store.subscribe((state) => {
        if (state.status === "loading") {
          renderer.renderLoading();
          return;
        }
        if (state.status === "error") {
          window.location.href = "/";
          return;
        }
        if (state.status === "ready" && state.customer) {
          renderer.renderDashboard(state.customer);
          this._bindRendererActions();
        }
      });
    }
    // ── Init ───────────────────────────────────────────────────────────────────
    async load(accessToken, nativeCustomer = null) {
      var _a, _b;
      if (nativeCustomer) {
        this._store.set({ status: "ready", customer: nativeCustomer, error: null });
        return;
      }
      if (!accessToken) {
        this._store.set({ status: "error", customer: null, error: "no_session" });
        return;
      }
      this._store.set({ status: "loading", customer: null, error: null });
      try {
        const customer = await this._api.fetchCustomer(accessToken);
        if (!customer) {
          const nativeFallback = (_a = this._getNativeSession) == null ? void 0 : _a.call(this);
          if (nativeFallback) {
            this._store.set({ status: "ready", customer: nativeFallback, error: null });
          } else {
            this._store.set({ status: "error", customer: null, error: "invalid_token" });
          }
          return;
        }
        this._store.set({ status: "ready", customer, error: null });
      } catch (err) {
        console.error("[ProfileController] Failed to load customer", err);
        const nativeFallback = (_b = this._getNativeSession) == null ? void 0 : _b.call(this);
        if (nativeFallback) {
          this._store.set({ status: "ready", customer: nativeFallback, error: null });
        } else {
          this._store.set({ status: "error", customer: null, error: err.message });
        }
      }
    }
    // ── Event wiring ───────────────────────────────────────────────────────────
    _bindRendererActions() {
      var _a;
      this._renderer.on("profile:submit", (formData) => this._handleProfileSubmit(formData));
      this._renderer.on("password:submit", (formData) => this._handlePasswordSubmit(formData));
      (_a = document.getElementById("my-account-logout")) == null ? void 0 : _a.addEventListener("click", () => {
        logoutAccount(this._isNative ? this._logoutUrl : "/");
      }, { once: true });
    }
    // ── Profile submit ─────────────────────────────────────────────────────────
    async _handleProfileSubmit(formData) {
      var _a;
      if (this._profileBusy) return;
      this._profileBusy = true;
      const t = this._renderer._t;
      const renderer = this._renderer;
      renderer.setSubmitState("profile", true, t("saving", "保存中..."));
      renderer.setFormMessage("", "", "profile");
      const fields = [
        "lastName",
        "firstName",
        "last_name_kana",
        "first_name_kana",
        "dob",
        "phone",
        "email",
        "profileCurrentPassword"
      ];
      fields.forEach((f) => renderer.clearFieldError(f));
      const errors = this._validateProfile(formData, t);
      const currentEmail = ((_a = this._store.get().customer) == null ? void 0 : _a.email) || "";
      const emailChanged = currentEmail.toLowerCase() !== (formData.email || "").toLowerCase();
      if (emailChanged && !formData.profileCurrentPassword) {
        errors.profileCurrentPassword = t(
          "validation_current_password_required_for_email",
          "メールアドレスを変更する場合は現在のパスワードを入力してください。"
        );
      }
      if (Object.keys(errors).length) {
        Object.entries(errors).forEach(([f, msg]) => renderer.setFieldError(f, msg));
        renderer.setSubmitState("profile", false);
        this._profileBusy = false;
        return;
      }
      try {
        const payload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          first_name_kana: formData.first_name_kana,
          last_name_kana: formData.last_name_kana,
          email: formData.email,
          phone: formData.phone,
          birthday: formData.dob ? displayToIsoDate(formData.dob) : "",
          current_password: formData.profileCurrentPassword || ""
        };
        if (this._isNative) {
          await this._api.updateProfileNative(payload, getNativeCSRFToken());
        } else {
          await this._api.updateProfile(payload);
        }
        try {
          await this._api.updateMetafields({
            last_name_kana: payload.last_name_kana,
            first_name_kana: payload.first_name_kana,
            birthday: payload.birthday
          });
        } catch (mfErr) {
          console.warn("[ProfileController] Metafield update skipped:", mfErr.message);
        }
        this._store.update((s) => ({
          ...s,
          customer: {
            ...s.customer,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone
          }
        }));
        renderer.setFormMessage("success", t("save_success", "情報が保存されました。"), "profile");
      } catch (err) {
        console.error("[ProfileController] Profile update error", err);
        if (err.isPasswordError || err.status === 401) {
          renderer.setFieldError(
            "profileCurrentPassword",
            t("validation_current_password_invalid", "現在のパスワードが正しくありません。")
          );
        } else if (err.code === "TAKEN") {
          renderer.setFieldError("email", t("validation_email_taken", "このメールアドレスは既に使用されています。"));
        } else {
          renderer.setFormMessage("error", err.message || t("save_failed", "保存に失敗しました。"), "profile");
        }
      } finally {
        renderer.setSubmitState("profile", false);
        this._profileBusy = false;
      }
    }
    // ── Password submit ────────────────────────────────────────────────────────
    async _handlePasswordSubmit(formData) {
      if (this._passwordBusy) return;
      this._passwordBusy = true;
      const t = this._renderer._t;
      const renderer = this._renderer;
      renderer.setSubmitState("password", true, t("saving", "保存中..."));
      renderer.setFormMessage("", "", "password");
      ["currentPassword", "newPassword", "confirmPassword"].forEach((f) => renderer.clearFieldError(f));
      if (!formData.currentPassword && !formData.newPassword && !formData.confirmPassword) {
        renderer.setSubmitState("password", false);
        this._passwordBusy = false;
        return;
      }
      const errors = this._validatePassword(formData, t);
      if (Object.keys(errors).length) {
        Object.entries(errors).forEach(([f, msg]) => renderer.setFieldError(f, msg));
        renderer.setSubmitState("password", false);
        this._passwordBusy = false;
        return;
      }
      try {
        const customer = this._store.get().customer;
        if (this._isNative) {
          await this._api.updatePasswordNative(
            formData.newPassword,
            formData.confirmPassword,
            getNativeCSRFToken()
          );
        } else {
          await this._api.updatePassword(formData.currentPassword, formData.newPassword);
          DiptyqueTokenStore.clear();
          renderer.clearPasswordFields();
          renderer.setFormMessage("success", t("password_changed_relogin", "パスワードを変更しました。再度ログインしてください。"), "password");
          setTimeout(() => {
            window.location.href = "/";
          }, 2e3);
          return;
        }
        renderer.clearPasswordFields();
        renderer.setFormMessage("success", t("save_success", "情報が保存されました。"), "password");
      } catch (err) {
        console.error("[ProfileController] Password update error", err);
        if (err.isPasswordError || err.status === 401) {
          renderer.setFieldError(
            "currentPassword",
            t("validation_current_password_invalid", "現在のパスワードが正しくありません。")
          );
        } else {
          renderer.setFormMessage("error", err.message || t("save_failed", "保存に失敗しました。"), "password");
        }
      } finally {
        renderer.setSubmitState("password", false);
        this._passwordBusy = false;
      }
    }
    // ── Validation ─────────────────────────────────────────────────────────────
    _validateProfile(data, t) {
      const errors = {};
      const kanaRegex = /^[\u30A0-\u30FF\u30FC\s]+$/;
      const required = ["lastName", "firstName", "last_name_kana", "first_name_kana", "phone", "email"];
      for (const key of required) {
        if (!data[key]) errors[key] = t("validation_required", "この項目は必須です。");
      }
      if (data.last_name_kana && !errors.last_name_kana && !kanaRegex.test(data.last_name_kana)) {
        errors.last_name_kana = t("validation_kana_invalid", "全角カタカナで入力してください。");
      }
      if (data.first_name_kana && !errors.first_name_kana && !kanaRegex.test(data.first_name_kana)) {
        errors.first_name_kana = t("validation_kana_invalid", "全角カタカナで入力してください。");
      }
      if (data.email && !errors.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = t("validation_email_invalid", "有効なメールアドレスを入力してください。");
      }
      if (data.phone && !errors.phone) {
        const raw = data.phone;
        if (!/^[0-9+()\-\s]+$/.test(raw)) {
          errors.phone = t("validation_phone_invalid", "有効な電話番号を入力してください。");
        } else {
          const digits = raw.replace(/\D/g, "");
          if (digits.length < 8 || digits.length > 15) {
            errors.phone = t("validation_phone_invalid", "有効な電話番号を入力してください。");
          }
        }
      }
      if (data.dob) {
        if (!/^\d{4}\/\d{2}\/\d{2}$/.test(data.dob)) {
          errors.dob = t("validation_dob_invalid", "YYYY/MM/DD 形式の有効な日付を入力してください。");
        } else {
          const [y, m, d] = data.dob.split("/").map(Number);
          const date = new Date(y, m - 1, d);
          const valid = date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
          if (!valid || date > /* @__PURE__ */ new Date()) {
            errors.dob = t("validation_dob_invalid", "YYYY/MM/DD 形式の有効な日付を入力してください。");
          }
        }
      }
      return errors;
    }
    _validatePassword(data, t) {
      const errors = {};
      if (!data.currentPassword) errors.currentPassword = t("validation_required", "この項目は必須です。");
      if (!data.newPassword) {
        errors.newPassword = t("validation_required", "この項目は必須です。");
      } else {
        const strong = data.newPassword.length >= 8 && /[a-zA-Z]/.test(data.newPassword) && /\d/.test(data.newPassword) && /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/.test(data.newPassword);
        if (!strong) errors.newPassword = t(
          "validation_password_weak",
          "パスワードは8文字以上で、英字・数字・記号を含む必要があります。"
        );
      }
      if (!data.confirmPassword) {
        errors.confirmPassword = t("validation_required", "この項目は必須です。");
      } else if (data.newPassword && data.confirmPassword !== data.newPassword) {
        errors.confirmPassword = t("validation_password_mismatch", "パスワードが一致しません。");
      }
      return errors;
    }
  }
  let _controller$5 = null;
  const ProfilePage = {
    /**
     * @param {HTMLElement} container
     * @param {{ config: Object, t: Function, token: string|null }} ctx
     */
    async mount(container, ctx) {
      const { config, t, token } = ctx;
      const sf = new DiptyqueStorefrontClient(
        config.storefrontEndpoint,
        config.storefrontToken
      );
      const be = new DiptyqueBackendClient(
        config.apiBase,
        () => localStorage.getItem("shopifyCustomerAccessToken")
      );
      const api = new DiptyqueCustomerApi(sf, be);
      const renderer = new DiptyqueProfileRenderer(container, t);
      _controller$5 = new DiptyqueProfileController(api, renderer, {
        isNative: false,
        logoutUrl: config.logoutUrl || "/account/logout",
        getNativeSession: () => DiptyqueNativeSession.get()
      });
      const nativeCustomer = DiptyqueNativeSession.get();
      if (nativeCustomer) {
        _controller$5.load(null, nativeCustomer);
      } else {
        _controller$5.load(token);
      }
    },
    unmount() {
      _controller$5 = null;
    }
  };
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
  let _controller$4 = null;
  const OrdersPage = {
    /**
     * @param {HTMLElement} container
     * @param {{ config: Object, t: Function, token: string|null }} ctx
     */
    async mount(container, ctx) {
      const { config, t, token } = ctx;
      const sf = new DiptyqueStorefrontClient(
        config.storefrontEndpoint,
        config.storefrontToken
      );
      const api = new DiptyqueOrderPaginatedApi(sf);
      const renderer = new DiptyqueOrderListRenderer(container, t);
      _controller$4 = new DiptyqueOrderHistoryController(api, renderer);
      if (!token) {
        navigate({ view: "profile" });
        return;
      }
      renderer.on("order:view-detail", (orderId) => {
        navigate({ view: "order", id: orderId });
      });
      _controller$4.load(token);
    },
    unmount() {
      if (_controller$4) _controller$4.destroy();
      _controller$4 = null;
    }
  };
  const GET_ADDRESSES_QUERY = (
    /* graphql */
    `
  query GetCustomerAddresses($token: String!) {
    customer(customerAccessToken: $token) {
      defaultAddress { id }
      addresses(first: 50) {
        edges { node {
          id firstName lastName name company
          address1 address2 city province provinceCode
          country countryCodeV2 zip phone
        }}
      }
    }
  }
`
  );
  class DiptyqueAddressApi {
    /**
     * @param {import('./storefront').DiptyqueStorefrontClient} storefrontClient
     * @param {import('./backend').DiptyqueBackendClient}       backendClient
     */
    constructor(storefrontClient, backendClient) {
      this._sf = storefrontClient;
      this._be = backendClient;
    }
    // ── Read ───────────────────────────────────────────────────────────────────
    async list(accessToken) {
      var _a, _b;
      const [sfData, beData] = await Promise.all([
        this._sf.request(GET_ADDRESSES_QUERY, { token: accessToken }),
        this._be.post("/api/customers/account/addresses").catch(() => ({}))
      ]);
      const customer = sfData == null ? void 0 : sfData.customer;
      if (!customer) return [];
      const defaultGid = ((_a = customer.defaultAddress) == null ? void 0 : _a.id) ?? null;
      const extMap = {};
      for (const addr of beData.addresses ?? []) {
        extMap[String(addr.id)] = addr.extension_attributes ?? null;
      }
      return (((_b = customer.addresses) == null ? void 0 : _b.edges) ?? []).map(({ node }) => {
        const numericId = gidToNumericId(node.id);
        return {
          id: numericId,
          first_name: node.firstName ?? null,
          last_name: node.lastName ?? null,
          name: node.name ?? null,
          company: node.company ?? null,
          address1: node.address1 ?? null,
          address2: node.address2 ?? null,
          city: node.city ?? null,
          province: normalizeProvince(node.province ?? ""),
          province_code: node.provinceCode ?? null,
          country: node.country ?? null,
          country_code: node.countryCodeV2 ?? null,
          zip: node.zip ?? null,
          phone: node.phone ?? null,
          default: defaultGid != null && node.id === defaultGid,
          extension_attributes: extMap[String(numericId)] ?? null
        };
      });
    }
    // ── Write ──────────────────────────────────────────────────────────────────
    create(fields) {
      return this._be.post("/api/customers/account/addresses/create", fields);
    }
    update(addressId, fields) {
      return this._be.post("/api/customers/account/addresses/update", {
        address_id: addressId,
        ...fields
      });
    }
    delete(addressId) {
      return this._be.post("/api/customers/account/addresses/delete", {
        address_id: addressId
      });
    }
  }
  const PREFECTURES = [
    "北海道",
    "青森県",
    "岩手県",
    "宮城県",
    "秋田県",
    "山形県",
    "福島県",
    "茨城県",
    "栃木県",
    "群馬県",
    "埼玉県",
    "千葉県",
    "東京都",
    "神奈川県",
    "新潟県",
    "富山県",
    "石川県",
    "福井県",
    "山梨県",
    "長野県",
    "岐阜県",
    "静岡県",
    "愛知県",
    "三重県",
    "滋賀県",
    "京都府",
    "大阪府",
    "兵庫県",
    "奈良県",
    "和歌山県",
    "鳥取県",
    "島根県",
    "岡山県",
    "広島県",
    "山口県",
    "徳島県",
    "香川県",
    "愛媛県",
    "高知県",
    "福岡県",
    "佐賀県",
    "長崎県",
    "熊本県",
    "大分県",
    "宮崎県",
    "鹿児島県",
    "沖縄県"
  ];
  class DiptyqueAddressRenderer {
    /**
     * @param {HTMLElement} container  #addresses-details-container
     * @param {Function}    t          i18n lookup fn
     */
    constructor(container, t) {
      this._container = container;
      this.t = t;
      this._handlers = {};
      this._zipTimer = null;
    }
    // ── Event dispatch ─────────────────────────────────────────────────────────
    on(action, handler) {
      this._handlers[action] = handler;
    }
    _emit(action, ...args) {
      if (this._handlers[action]) this._handlers[action](...args);
    }
    // ── Top-level render ───────────────────────────────────────────────────────
    renderLoading() {
      const root = this._listRoot();
      root.innerHTML = `
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this.t("loading", "読み込み中...")}</p>
      </div>`;
    }
    render(state) {
      if (state.status === "loading") {
        this.renderLoading();
        return;
      }
      if (state.status === "error") {
        this._renderError(state.error);
        return;
      }
      if (state.status === "ready") {
        this.renderAddressList(state.addresses);
      }
    }
    renderAddressList(addresses) {
      const t = this.t;
      const root = this._listRoot();
      const shipping = addresses.filter((a) => {
        var _a;
        return (((_a = a.extension_attributes) == null ? void 0 : _a.type) ?? "shipping") !== "billing";
      });
      const billing = addresses.filter((a) => {
        var _a;
        return ((_a = a.extension_attributes) == null ? void 0 : _a.type) === "billing";
      });
      root.innerHTML = `
      <div class="addresses-details__wrapper">
        <div class="addresses-details__section">
          <h3 class="addresses-details__section-title">${t("address_shipping", "配送先住所")}</h3>
          <div class="addresses-details__list" id="shipping-list">
            ${shipping.map((a) => this.renderCard(a)).join("")}
          </div>
          <div class="addresses-details__action-area mt-40" data-area="shipping">
            <button type="button" class="addresses-details__new-btn"
                    data-action="new-address" data-type="shipping">
              ${t("address_new_btn", "新しい住所を登録する")}
            </button>
            <div class="my-account__address-form-container" data-id="new-shipping"></div>
          </div>
        </div>

        <div class="addresses-details__section mt-40">
          <h3 class="addresses-details__section-title">${t("address_billing", "ご依頼主住所")}</h3>
          <div class="addresses-details__list" id="billing-list">
            ${billing.map((a) => this.renderCard(a)).join("")}
          </div>
          <div class="addresses-details__action-area mt-40" data-area="billing">
            <button type="button" class="addresses-details__new-btn"
                    data-action="new-address" data-type="billing">
              ${t("address_new_btn", "新しい住所を登録する")}
            </button>
            <div class="my-account__address-form-container" data-id="new-billing"></div>
          </div>
        </div>
      </div>`;
      this._bindListEvents();
    }
    renderCard(addr) {
      const t = this.t;
      const ext = addr.extension_attributes ?? {};
      const showBadge = ext.is_default_billing === true || ext.is_default_shipping === true;
      return `
      <div class="addresses-details__card" data-id="${addr.id}">
        <div class="addresses-details__card-info">
          ${showBadge ? `<span class="addresses-details__default-badge">${t("address_default_badge", "デフォルト")}</span>` : ""}
          <p class="addresses-details__name">${escapeHtml(addr.last_name || "")} ${escapeHtml(addr.first_name || "")}</p>
          <p>${escapeHtml(addr.zip || "")}</p>
          <p>${escapeHtml(normalizeProvince(addr.province || ""))}</p>
          <p>${escapeHtml(addr.city || "")}</p>
          <p>${escapeHtml(addr.address1 || "")}</p>
          ${addr.address2 ? `<p>${escapeHtml(addr.address2)}</p>` : ""}
          ${addr.phone ? `<p>${escapeHtml(addr.phone)}</p>` : ""}
        </div>
        <div class="addresses-details__actions">
          <button type="button" class="my-account__text-btn"
                  data-action="edit-address" data-id="${addr.id}">
            ${t("address_edit", "編集")}
          </button>
          <button type="button" class="my-account__text-btn"
                  data-action="delete-address" data-id="${addr.id}">
            ${t("address_delete", "削除")}
          </button>
        </div>
      </div>
      <div class="my-account__address-form-container" data-id="${addr.id}"></div>`;
    }
    renderForm(address = null, type = "billing") {
      const t = this.t;
      const ext = (address == null ? void 0 : address.extension_attributes) ?? {};
      const rawProvince = (address == null ? void 0 : address.province) || "";
      const normalizedProvince = normalizeProvince(rawProvince);
      const lastnameKana = ext.lastname_kana ?? "";
      const firstnameKana = ext.firstname_kana ?? "";
      const isDefBill = ext.is_default_billing === true;
      const isDefShip = ext.is_default_shipping === true;
      const defaultCheckbox = type === "billing" ? `<label class="addresses-details__checkbox-label">
           <input type="checkbox" name="is_default_billing" value="1"${isDefBill ? " checked" : ""}>
           ${t("default_billing_label", "デフォルトの請求先住所に設定する")}
         </label>` : `<label class="addresses-details__checkbox-label">
           <input type="checkbox" name="is_default_shipping" value="1"${isDefShip ? " checked" : ""}>
           ${t("default_shipping_label", "デフォルトの配送先住所に設定する")}
         </label>`;
      const provinceOptions = PREFECTURES.map(
        (p) => `<option value="${p}"${normalizedProvince === p ? " selected" : ""}>${p}</option>`
      ).join("");
      return `
      <form class="addresses-details__form" novalidate
            data-id="${(address == null ? void 0 : address.id) || ""}" data-type="${type}"
            data-province-raw="${escapeHtml(rawProvince)}">

        <div class="addresses-details__form-row">
          <div class="addresses-details__field">
            <label>${t("last_name", "姓")} *</label>
            <input type="text" name="last_name" class="my-account__input"
                   value="${escapeHtml((address == null ? void 0 : address.last_name) || "")}" required>
            <span class="my-account__field-error" data-error-for="last_name" aria-live="polite"></span>
          </div>
          <div class="addresses-details__field">
            <label>${t("first_name", "名")} *</label>
            <input type="text" name="first_name" class="my-account__input"
                   value="${escapeHtml((address == null ? void 0 : address.first_name) || "")}" required>
            <span class="my-account__field-error" data-error-for="first_name" aria-live="polite"></span>
          </div>
        </div>

        <div class="addresses-details__form-row">
          <div class="addresses-details__field">
            <label>${t("furigana_last", "フリガナ（姓）")} *</label>
            <input type="text" name="lastname_kana" class="my-account__input"
                   value="${escapeHtml(lastnameKana)}" required placeholder="例：ヤマダ">
            <span class="my-account__field-error" data-error-for="lastname_kana" aria-live="polite"></span>
          </div>
          <div class="addresses-details__field">
            <label>${t("furigana_first", "フリガナ（名）")} *</label>
            <input type="text" name="firstname_kana" class="my-account__input"
                   value="${escapeHtml(firstnameKana)}" required placeholder="例：タロウ">
            <span class="my-account__field-error" data-error-for="firstname_kana" aria-live="polite"></span>
          </div>
        </div>

        <div class="addresses-details__field">
          <label>${t("zip", "郵便番号")} *</label>
          <input type="text" name="zip" class="my-account__input"
                 value="${escapeHtml((address == null ? void 0 : address.zip) || "")}" required
                 placeholder="例：060-0000" maxlength="8" data-zip-autofill>
          <span class="my-account__field-error" data-error-for="zip" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${t("province", "都道府県")} *</label>
          <select name="province" class="my-account__input" required>
            <option value="" disabled ${!(address == null ? void 0 : address.province) ? "selected" : ""}>
              ${t("province_placeholder", "都道府県を選択")}
            </option>
            ${provinceOptions}
          </select>
          <span class="my-account__field-error" data-error-for="province" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${t("city", "市区町村")} *</label>
          <input type="text" name="city" class="my-account__input"
                 value="${escapeHtml((address == null ? void 0 : address.city) || "")}" required>
          <span class="my-account__field-error" data-error-for="city" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${t("address1", "丁番・番地")} *</label>
          <input type="text" name="address1" class="my-account__input"
                 value="${escapeHtml((address == null ? void 0 : address.address1) || "")}" required>
          <span class="my-account__field-error" data-error-for="address1" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${t("address2", "マンション・建物名")}</label>
          <input type="text" name="address2" class="my-account__input"
                 value="${escapeHtml((address == null ? void 0 : address.address2) || "")}">
        </div>

        <div class="addresses-details__field">
          <label>${t("phone", "電話番号")} *</label>
          <input type="tel" name="phone" class="my-account__input"
                 value="${escapeHtml((address == null ? void 0 : address.phone) || "")}" required>
          <span class="my-account__field-error" data-error-for="phone" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field addresses-details__field--checkbox">
          ${defaultCheckbox}
        </div>

        <p class="addresses-details__required-label">${t("required", "* 必須")}</p>
        <div class="my-account__form-message my-account__form-message--error" style="display:none;"></div>

        <button type="submit" class="addresses-details__submit-btn">
          ${t("address_submit", "決定")}
        </button>
        <button type="button" class="addresses-details__cancel-btn" data-action="cancel-address">
          ${t("address_cancel", "キャンセル")}
        </button>
      </form>`;
    }
    // ── Form slot helpers ──────────────────────────────────────────────────────
    closeAllForms() {
      this._container.querySelectorAll(".my-account__address-form-container").forEach((c) => {
        c.innerHTML = "";
      });
      this._container.querySelectorAll(".addresses-details__card").forEach((c) => {
        c.style.display = "";
      });
      this._container.querySelectorAll(".addresses-details__actions").forEach((a) => {
        a.style.display = "";
      });
      this._container.querySelectorAll('[data-action="new-address"]').forEach((b) => {
        b.style.display = "";
      });
    }
    openForm(addressId, address, type) {
      const slot = this._container.querySelector(
        `.my-account__address-form-container[data-id="${addressId}"]`
      );
      if (slot) slot.innerHTML = this.renderForm(address, type);
      this._bindFormEvents();
    }
    setFormError(addressId, message) {
      const form = this._container.querySelector(`.addresses-details__form[data-id="${addressId}"]`);
      const errEl = form == null ? void 0 : form.querySelector(".my-account__form-message--error");
      if (!errEl) return;
      errEl.textContent = message;
      errEl.style.display = "block";
    }
    setSubmitState(addressId, loading, label) {
      const form = this._container.querySelector(`.addresses-details__form[data-id="${addressId}"]`);
      const btn = form == null ? void 0 : form.querySelector('[type="submit"]');
      if (!btn) return;
      btn.disabled = loading;
      btn.textContent = loading ? label || "..." : this.t("address_submit", "決定");
    }
    // ── Private ────────────────────────────────────────────────────────────────
    _listRoot() {
      return this._container.querySelector("#addresses-list-root") || this._container;
    }
    _renderError(message) {
      this._listRoot().innerHTML = `
      <p class="my-account__form-message--error" style="margin-top:20px;">
        ${message || this.t("save_error", "保存に失敗しました。")}
      </p>`;
    }
    _bindListEvents() {
      if (this._listBound) return;
      this._listBound = true;
      this._container.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;
        const action = btn.dataset.action;
        if (action === "new-address") {
          const type = btn.dataset.type || "billing";
          this.closeAllForms();
          btn.style.display = "none";
          this.openForm("new-" + type, null, type);
          return;
        }
        if (action === "edit-address") {
          this._emit("address:edit", btn.dataset.id);
          return;
        }
        if (action === "cancel-address") {
          this.closeAllForms();
          return;
        }
        if (action === "delete-address") {
          this._emit("address:delete", btn.dataset.id, btn);
          return;
        }
      }, { capture: false });
      this._container.addEventListener("submit", async (e) => {
        const form = e.target.closest(".addresses-details__form");
        if (!form) return;
        e.preventDefault();
        this._emit("address:save", form);
      });
      this._container.addEventListener("input", (e) => {
        var _a;
        const el = e.target.closest("[name]");
        if (!el) return;
        el.classList.remove("is-invalid");
        const errEl = (_a = el.closest(".addresses-details__field")) == null ? void 0 : _a.querySelector(`[data-error-for="${el.name}"]`);
        if (errEl) errEl.textContent = "";
        if (el.matches("[data-zip-autofill]")) this._scheduleZipLookup(el);
      });
      this._container.addEventListener("change", (e) => {
        var _a;
        const el = e.target.closest("[name]");
        if (!el) return;
        el.classList.remove("is-invalid");
        const errEl = (_a = el.closest(".addresses-details__field")) == null ? void 0 : _a.querySelector(`[data-error-for="${el.name}"]`);
        if (errEl) errEl.textContent = "";
      });
    }
    _bindFormEvents() {
    }
    // ── Zip auto-fill ──────────────────────────────────────────────────────────
    _scheduleZipLookup(zipInput) {
      clearTimeout(this._zipTimer);
      const digits = zipInput.value.replace(/[^0-9]/g, "");
      if (digits.length < 7) return;
      this._zipTimer = setTimeout(() => this._doZipLookup(zipInput), 300);
    }
    async _doZipLookup(zipInput) {
      var _a;
      const form = zipInput.closest(".addresses-details__form");
      if (!form) return;
      const errEl = form.querySelector('[data-error-for="zip"]');
      const digits = zipInput.value.replace(/[^0-9]/g, "");
      if (errEl) errEl.textContent = "";
      try {
        const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`);
        const json = await res.json();
        if (!((_a = json.results) == null ? void 0 : _a.length)) {
          if (errEl) errEl.textContent = "該当する住所が見つかりませんでした。";
          return;
        }
        const r = json.results[0];
        const provEl = form.querySelector('[name="province"]');
        const cityEl = form.querySelector('[name="city"]');
        const addr1El = form.querySelector('[name="address1"]');
        if (provEl) {
          const opt = Array.from(provEl.options).find((o) => o.value === r.address1);
          if (opt) provEl.value = r.address1;
        }
        if (cityEl) cityEl.value = r.address2 || "";
        if (addr1El && !addr1El.value.trim()) addr1El.value = r.address3 || "";
      } catch (err) {
        console.error("[AddressRenderer] Zip lookup failed", err);
        if (errEl) errEl.textContent = "住所検索に失敗しました。";
      }
    }
  }
  class DiptyqueAddressController {
    /**
     * @param {import('../api/address').DiptyqueAddressApi}         api
     * @param {import('../ui/address').DiptyqueAddressRenderer}     renderer
     */
    constructor(api, renderer) {
      this._api = api;
      this._renderer = renderer;
      this._store = diptyqueAddressStore;
      this._store.subscribe((state) => renderer.render(state));
      renderer.on("address:edit", (id) => this._onEdit(id));
      renderer.on("address:delete", (id, btn) => this._onDelete(id, btn));
      renderer.on("address:save", (form) => this._onSave(form));
    }
    // ── Init ───────────────────────────────────────────────────────────────────
    async load(accessToken) {
      if (!accessToken) {
        window.location.href = "/";
        return;
      }
      this._accessToken = accessToken;
      this._store.set({ status: "loading", addresses: [], error: null });
      try {
        const addresses = await this._api.list(accessToken);
        this._store.set({ status: "ready", addresses, error: null });
      } catch (err) {
        console.error("[AddressController] Failed to load addresses", err);
        if (err.status === 401 || err.status === 403) {
          window.location.href = "/";
          return;
        }
        this._store.set({ status: "error", addresses: [], error: err.message });
      }
    }
    // ── Reload helper ──────────────────────────────────────────────────────────
    async _reload() {
      try {
        const addresses = await this._api.list(this._accessToken);
        this._store.set({ status: "ready", addresses, error: null });
      } catch (err) {
        console.error("[AddressController] Reload failed", err);
        this._store.set({ status: "error", addresses: [], error: err.message });
      }
    }
    // ── Edit ───────────────────────────────────────────────────────────────────
    _onEdit(id) {
      var _a;
      const address = this._store.get().addresses.find((a) => String(a.id) === String(id));
      if (!address) {
        console.warn("[AddressController] Address not found:", id);
        return;
      }
      const type = ((_a = address.extension_attributes) == null ? void 0 : _a.type) || "shipping";
      this._renderer.closeAllForms();
      const card = this._renderer._container.querySelector(`.addresses-details__card[data-id="${id}"]`);
      if (card) {
        const actions = card.querySelector(".addresses-details__actions");
        if (actions) actions.style.display = "none";
      }
      this._renderer.openForm(id, address, type);
    }
    // ── Delete ─────────────────────────────────────────────────────────────────
    async _onDelete(id, btn) {
      const t = this._renderer.t;
      if (!confirm(t("confirm_delete", "本当にこの住所を削除しますか？"))) return;
      if (btn) {
        btn.textContent = "...";
        btn.disabled = true;
      }
      const snapshot = this._store.get().addresses;
      this._store.update((s) => ({
        ...s,
        addresses: s.addresses.filter((a) => String(a.id) !== String(id))
      }));
      try {
        await this._api.delete(id);
        await this._reload();
      } catch (err) {
        console.error("[AddressController] Delete failed", err);
        this._store.update((s) => ({ ...s, addresses: snapshot }));
        if (btn) {
          btn.textContent = t("address_delete", "削除");
          btn.disabled = false;
        }
        alert(t("delete_error", "削除に失敗しました。"));
      }
    }
    // ── Save (create or update) ────────────────────────────────────────────────
    async _onSave(form) {
      const t = this._renderer.t;
      const id = form.dataset.id;
      const type = form.dataset.type || "billing";
      const isEdit = Boolean(id);
      const data = new FormData(form);
      const errors = this._validate(data, t);
      if (Object.keys(errors).length) {
        this._showFormErrors(form, errors);
        return;
      }
      const fields = {
        type,
        first_name: (data.get("first_name") || "").trim(),
        last_name: (data.get("last_name") || "").trim(),
        firstname_kana: (data.get("firstname_kana") || "").trim(),
        lastname_kana: (data.get("lastname_kana") || "").trim(),
        zip: (data.get("zip") || "").trim(),
        province: (data.get("province") || "").trim(),
        city: (data.get("city") || "").trim(),
        address1: (data.get("address1") || "").trim(),
        address2: (data.get("address2") || "").trim(),
        phone: (data.get("phone") || "").trim(),
        country: "Japan",
        is_default_billing: Boolean(data.get("is_default_billing")),
        is_default_shipping: Boolean(data.get("is_default_shipping"))
      };
      this._renderer.setSubmitState(id || `new-${type}`, true);
      const errorEl = form.querySelector(".my-account__form-message--error");
      if (errorEl) errorEl.style.display = "none";
      try {
        if (isEdit) {
          await this._api.update(id, fields);
        } else {
          await this._api.create(fields);
        }
        await this._reload();
      } catch (err) {
        console.error("[AddressController] Save failed", err);
        if (errorEl) {
          errorEl.textContent = err.message || t("save_error", "保存に失敗しました。");
          errorEl.style.display = "block";
        }
        this._renderer.setSubmitState(id || `new-${type}`, false);
      }
    }
    // ── Validation ─────────────────────────────────────────────────────────────
    _validate(data, t) {
      var _a, _b, _c, _d;
      const errors = {};
      const kanaRe = /^[ァ-ヶーｦ-ﾟ\s\u3000]+$/;
      const required = [
        "last_name",
        "first_name",
        "lastname_kana",
        "firstname_kana",
        "zip",
        "province",
        "city",
        "address1",
        "phone"
      ];
      for (const name of required) {
        if (!((_a = data.get(name)) == null ? void 0 : _a.trim())) errors[name] = "必須項目です";
      }
      for (const name of ["lastname_kana", "firstname_kana"]) {
        const val = ((_b = data.get(name)) == null ? void 0 : _b.trim()) || "";
        if (val && !errors[name] && !kanaRe.test(val)) {
          errors[name] = "カタカナで入力してください";
        }
      }
      const zipDigits = (data.get("zip") || "").replace(/[^0-9]/g, "");
      if (((_c = data.get("zip")) == null ? void 0 : _c.trim()) && !errors.zip && zipDigits.length !== 7) {
        errors.zip = "郵便番号は7桁で入力してください（例：0600000）";
      }
      const phone = ((_d = data.get("phone")) == null ? void 0 : _d.trim()) || "";
      if (phone && !errors.phone && !/^[0-9\-+\s()]{7,20}$/.test(phone)) {
        errors.phone = t("phone_invalid", "無効な電話番号です");
      }
      return errors;
    }
    _showFormErrors(form, errors) {
      Object.entries(errors).forEach(([name, msg]) => {
        const errEl = form.querySelector(`[data-error-for="${name}"]`);
        const inputEl = form.querySelector(`[name="${name}"]`);
        if (errEl) errEl.textContent = msg;
        if (inputEl) inputEl.classList.add("is-invalid");
      });
      const firstInvalid = form.querySelector(".is-invalid");
      if (firstInvalid) firstInvalid.focus();
    }
  }
  let _controller$3 = null;
  const AddressesPage = {
    /**
     * @param {HTMLElement} container
     * @param {{ config: Object, t: Function, token: string|null }} ctx
     */
    async mount(container, ctx) {
      const { config, t, token } = ctx;
      const sf = new DiptyqueStorefrontClient(
        config.storefrontEndpoint,
        config.storefrontToken
      );
      const be = new DiptyqueBackendClient(
        config.apiBase,
        () => localStorage.getItem("shopifyCustomerAccessToken")
      );
      if (!token) {
        navigate({ view: "profile" });
        return;
      }
      const api = new DiptyqueAddressApi(sf, be);
      const renderer = new DiptyqueAddressRenderer(container, t);
      _controller$3 = new DiptyqueAddressController(api, renderer);
      _controller$3.load(token);
    },
    unmount() {
      _controller$3 = null;
    }
  };
  const ORDER_QUERY = (
    /* graphql */
    `
  query GetOrder($orderId: ID!) {
    node(id: $orderId) {
      ... on Order {
        id
        orderNumber: orderNumber
        processedAt
        financialStatus
        fulfillmentStatus
        totalPrice { amount currencyCode }
        subtotalPrice { amount currencyCode }
        totalShippingPrice { amount currencyCode }
        successfulFulfillments(first: 5) {
          trackingCompany
          trackingInfo { number url }
        }
        lineItems(first: 50) {
          edges {
            node {
              title
              quantity
              originalTotalPrice { amount currencyCode }
              variant {
                id
                title
                image { url altText }
                price { amount currencyCode }
              }
            }
          }
        }
        shippingAddress {
          firstName lastName
          address1 address2
          city province zip country
        }
      }
    }
  }
`
  );
  class DiptyqueOrderDetailApi {
    /** @param {import('./storefront').DiptyqueStorefrontClient} storefrontClient */
    constructor(storefrontClient) {
      this._sf = storefrontClient;
    }
    /**
     * Fetch a single order by numeric ID.
     * @param {string|number} numericId
     * @returns {Promise<Object|null>}
     */
    async get(numericId) {
      const orderId = `gid://shopify/Order/${numericId}`;
      const data = await this._sf.request(ORDER_QUERY, { orderId });
      return (data == null ? void 0 : data.node) ?? null;
    }
  }
  class DiptyqueOrderDetailRenderer {
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
      <div class="order-detail__loading">${this.t("loading", "読み込み中…")}</div>`;
    }
    renderError(message) {
      this._container.innerHTML = `
      <div class="order-detail__error">${message}</div>`;
    }
    renderOrder(order) {
      var _a;
      const t = this.t;
      const financialMap = mapFinancialStatus(order.financialStatus) || {};
      const fulfillmentMap = mapFulfillmentStatus(order.fulfillmentStatus) || {};
      const statusLabel = financialMap.label || fulfillmentMap.label || order.financialStatus;
      const statusMod = financialMap.modifier || fulfillmentMap.modifier || "default";
      const items = order.lineItems.edges.map(({ node }) => {
        var _a2, _b;
        const img = ((_a2 = node.variant) == null ? void 0 : _a2.image) ? `<img src="${node.variant.image.url}" alt="${node.variant.image.altText || node.title}" class="order-detail__item-img">` : `<div class="order-detail__item-img order-detail__item-img--placeholder"></div>`;
        return `
        <div class="order-detail__item">
          ${img}
          <div class="order-detail__item-info">
            <p class="order-detail__item-title">${node.title}</p>
            ${((_b = node.variant) == null ? void 0 : _b.title) && node.variant.title !== "Default Title" ? `<p class="order-detail__item-variant">${node.variant.title}</p>` : ""}
            <p class="order-detail__item-qty">${t("qty", "数量")}: ${node.quantity}</p>
          </div>
          <p class="order-detail__item-price">${formatPrice(node.originalTotalPrice)}</p>
        </div>`;
      }).join("");
      const addr = order.shippingAddress;
      const addrHtml = addr ? `<address class="order-detail__address">
          ${addr.lastName} ${addr.firstName}<br>
          ${addr.address1}${addr.address2 ? " " + addr.address2 : ""}<br>
          ${addr.city} ${addr.province} ${addr.zip}<br>
          ${addr.country}
         </address>` : "";
      this._container.innerHTML = `
      <div class="order-detail">
        <button type="button" class="order-detail__back js-order-detail-back">
          ← ${t("nav_orders", "注文履歴")}
        </button>

        <header class="order-detail__header">
          <h2 class="order-detail__number">${t("order_number", "注文番号")} #${order.orderNumber}</h2>
          <time class="order-detail__date" datetime="${order.processedAt}">
            ${formatDate(order.processedAt)}
          </time>
          <span class="order-detail__status order-detail__status--${statusMod}">
            ${statusLabel}
          </span>
        </header>

        <section class="order-detail__items">
          <h3 class="order-detail__section-title">${t("order_items", "商品")}</h3>
          ${items}
        </section>

        <section class="order-detail__totals">
          <div class="order-detail__total-row">
            <span>${t("subtotal", "小計")}</span>
            <span>${formatPrice(order.subtotalPrice)}</span>
          </div>
          <div class="order-detail__total-row">
            <span>${t("shipping", "配送料")}</span>
            <span>${formatPrice(order.totalShippingPrice)}</span>
          </div>
          <div class="order-detail__total-row order-detail__total-row--grand">
            <span>${t("total", "合計")}</span>
            <span>${formatPrice(order.totalPrice)}</span>
          </div>
        </section>

        ${addr ? `<section class="order-detail__shipping">
          <h3 class="order-detail__section-title">${t("shipping_address", "配送先")}</h3>
          ${addrHtml}
        </section>` : ""}
      </div>`;
      (_a = this._container.querySelector(".js-order-detail-back")) == null ? void 0 : _a.addEventListener("click", () => navigate({ view: "orders" }));
    }
  }
  class DiptyqueOrderDetailController {
    /**
     * @param {import('../api/order-detail').DiptyqueOrderDetailApi}       api
     * @param {import('../ui/order-detail').DiptyqueOrderDetailRenderer}   renderer
     */
    constructor(api, renderer) {
      this._api = api;
      this._renderer = renderer;
      this._aborted = false;
    }
    /**
     * Load and render the order with the given numeric ID.
     * @param {string|number} id
     * @param {Function}      t  i18n lookup fn
     */
    async load(id, t) {
      this._aborted = false;
      if (!id) {
        navigate({ view: "orders" });
        return;
      }
      this._renderer.renderLoading();
      try {
        const order = await this._api.get(id);
        if (this._aborted) return;
        if (!order) {
          this._renderer.renderError(t("order_not_found", "注文が見つかりませんでした。"));
          return;
        }
        this._renderer.renderOrder(order);
      } catch (err) {
        if (this._aborted) return;
        console.error("[OrderDetailController] Failed to load order", err);
        this._renderer.renderError(t("order_load_error", "注文の読み込みに失敗しました。"));
      }
    }
    destroy() {
      this._aborted = true;
    }
  }
  let _controller$2 = null;
  const OrderDetailPage = {
    /**
     * @param {HTMLElement} container
     * @param {{ config: Object, t: Function, token: string|null, id: string|null }} ctx
     */
    async mount(container, ctx) {
      const { config, t, id } = ctx;
      const sf = new DiptyqueStorefrontClient(
        config.storefrontEndpoint,
        config.storefrontToken
      );
      const api = new DiptyqueOrderDetailApi(sf);
      const renderer = new DiptyqueOrderDetailRenderer(container, t);
      _controller$2 = new DiptyqueOrderDetailController(api, renderer);
      _controller$2.load(id, t);
    },
    unmount() {
      _controller$2 == null ? void 0 : _controller$2.destroy();
      _controller$2 = null;
    }
  };
  const FETCH_NEWSLETTER_PREFS_QUERY = (
    /* graphql */
    `
  query GetNewsletterPrefs($token: String!) {
    customer(customerAccessToken: $token) {
      metafields(identifiers: [
        { namespace: "registration", key: "mail_opt_in"   }
        { namespace: "registration", key: "sms_opt_in"    }
        { namespace: "registration", key: "postal_opt_in" }
      ]) { key value }
    }
  }
`
  );
  class DiptyqueNewsletterApi {
    /**
     * @param {import('./storefront.js').DiptyqueStorefrontClient} sf
     * @param {import('./backend.js').DiptyqueBackendClient} be
     */
    constructor(sf, be) {
      this._sf = sf;
      this._be = be;
    }
    /**
     * @param {string} customerAccessToken
     * @returns {Promise<{ sms_opt_in: boolean, mail_opt_in: boolean, postal_opt_in: boolean }>}
     */
    async fetchPreferences(customerAccessToken) {
      var _a;
      const data = await this._sf.request(FETCH_NEWSLETTER_PREFS_QUERY, {
        token: customerAccessToken
      });
      const pairs = (((_a = data == null ? void 0 : data.customer) == null ? void 0 : _a.metafields) ?? []).filter(Boolean).map((mf) => [mf.key, mf.value === "true"]);
      const mapped = Object.fromEntries(pairs);
      return {
        sms_opt_in: Boolean(mapped.sms_opt_in),
        mail_opt_in: Boolean(mapped.mail_opt_in),
        postal_opt_in: Boolean(mapped.postal_opt_in)
      };
    }
    /**
     * @param {{ sms_opt_in: boolean, mail_opt_in: boolean, postal_opt_in: boolean }} payload
     */
    async updatePreferences(payload) {
      return this._be.post("/api/customers/account/update-newsletter", payload);
    }
  }
  class DiptyqueNewsletterRenderer {
    /**
     * @param {HTMLElement} container
     * @param {Function} t
     */
    constructor(container, t) {
      this._container = container;
      this._t = t;
      this._handlers = {};
    }
    on(action, handler) {
      this._handlers[action] = handler;
    }
    _emit(action, ...args) {
      if (this._handlers[action]) this._handlers[action](...args);
    }
    renderLoading() {
      this._container.innerHTML = `
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this._t("loading", "読み込み中...")}</p>
      </div>`;
    }
    /**
     * @param {{ sms_opt_in?: boolean, mail_opt_in?: boolean, postal_opt_in?: boolean }} prefs
     */
    render(prefs = {}) {
      var _a;
      this._container.innerHTML = `
      <div class="newsletter-page">
        <section class="newsletter-page__form-section">
          <p class="newsletter-page__title">${this._t("newsletter_title", "ディブティックの最新情報や特別なご案内のお受け取り方法をお選びください")}</p>

          <div class="newsletter-page__options">
            <label class="newsletter-page__option">
              <input type="checkbox" name="newsletter_channel" value="email" class="newsletter-page__checkbox"${prefs.mail_opt_in ? " checked" : ""}>
              <span class="newsletter-page__option-label">${this._t("newsletter_email", "メールで")}</span>
            </label>
            <label class="newsletter-page__option">
              <input type="checkbox" name="newsletter_channel" value="sms" class="newsletter-page__checkbox"${prefs.sms_opt_in ? " checked" : ""}>
              <span class="newsletter-page__option-label">${this._t("newsletter_sms", "SMS/電話で")}</span>
            </label>
            <label class="newsletter-page__option">
              <input type="checkbox" name="newsletter_channel" value="postal" class="newsletter-page__checkbox"${prefs.postal_opt_in ? " checked" : ""}>
              <span class="newsletter-page__option-label">${this._t("newsletter_postal", "郵送で")}</span>
            </label>
          </div>

          <button type="button" class="newsletter-page__submit" data-action="newsletter-submit">
            ${this._t("newsletter_submit", "登録する")}
          </button>

          <p class="newsletter-page__note">${this._t("newsletter_note", "")}</p>

          <div class="newsletter-page__success" aria-live="polite" hidden>
            ${this._t("newsletter_success", "ご登録ありがとうございます。")}
          </div>
          <div class="newsletter-page__error" aria-live="polite" hidden></div>
        </section>
      </div>

      <style>
        .newsletter-page__form-section { margin-bottom: 48px; }
        .newsletter-page__title {
          font-size: 0.88rem;
          line-height: 1.7;
          margin-bottom: 24px;
          color: var(--color-foreground);
        }
        .newsletter-page__options {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 28px;
        }
        .newsletter-page__option {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }
        .newsletter-page__checkbox {
          width: 18px;
          height: 18px;
          accent-color: #2a4b38;
          cursor: pointer;
          flex-shrink: 0;
        }
        .newsletter-page__option-label {
          font-size: 0.88rem;
          color: var(--color-foreground);
        }
        .newsletter-page__submit {
          display: block;
          width: 100%;
          padding: 14px 24px;
          background: #1a1a1a;
          color: #fff;
          border: none;
          font-size: 0.82rem;
          letter-spacing: 0.06em;
          cursor: pointer;
          text-align: center;
          transition: background 0.2s;
          margin-bottom: 20px;
        }
        .newsletter-page__submit:hover { background: #333; }
        .newsletter-page__submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .newsletter-page__note {
          font-size: 0.72rem;
          color: #888;
          line-height: 1.6;
        }
        .newsletter-page__success {
          margin-top: 12px;
          font-size: 0.84rem;
          color: #2a4b38;
          font-weight: 500;
        }
        .newsletter-page__error {
          margin-top: 12px;
          font-size: 0.84rem;
          color: #c0392b;
        }
      </style>
    `;
      (_a = this._container.querySelector('[data-action="newsletter-submit"]')) == null ? void 0 : _a.addEventListener("click", () => {
        const checked = new Set(
          [...this._container.querySelectorAll(".newsletter-page__checkbox:checked")].map((el) => el.value)
        );
        this._emit("newsletter:submit", {
          sms_opt_in: checked.has("sms"),
          mail_opt_in: checked.has("email"),
          postal_opt_in: checked.has("postal")
        });
      });
    }
    setSubmitState(loading) {
      const btn = this._container.querySelector(".newsletter-page__submit");
      if (!btn) return;
      btn.disabled = loading;
      btn.textContent = loading ? this._t("saving", "登録中...") : this._t("newsletter_submit", "登録する");
    }
    showSuccess(message) {
      const successEl = this._container.querySelector(".newsletter-page__success");
      const errorEl = this._container.querySelector(".newsletter-page__error");
      if (errorEl) {
        errorEl.textContent = "";
        errorEl.hidden = true;
      }
      if (successEl) {
        successEl.textContent = message;
        successEl.hidden = false;
      }
    }
    showError(message) {
      const successEl = this._container.querySelector(".newsletter-page__success");
      const errorEl = this._container.querySelector(".newsletter-page__error");
      if (successEl) {
        successEl.hidden = true;
      }
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = false;
      }
    }
  }
  class DiptyqueNewsletterController {
    /**
     * @param {import('../api/newsletter').DiptyqueNewsletterApi} api
     * @param {import('../ui/newsletter').DiptyqueNewsletterRenderer} renderer
     */
    constructor(api, renderer) {
      this._api = api;
      this._renderer = renderer;
      this._token = null;
      this._renderer.on("newsletter:submit", (payload) => this._onSubmit(payload));
    }
    async load(accessToken) {
      this._token = accessToken;
      this._renderer.renderLoading();
      try {
        const prefs = await this._api.fetchPreferences(accessToken);
        this._renderer.render(prefs);
      } catch (err) {
        console.error("[NewsletterController] Failed to load preferences", err);
        this._renderer.render({});
        this._renderer.showError("保存状況を読み込めませんでした。");
      }
    }
    async _onSubmit(payload) {
      this._renderer.setSubmitState(true);
      try {
        await this._api.updatePreferences(payload);
        this._renderer.showSuccess("ご登録ありがとうございます。");
      } catch (err) {
        console.error("[NewsletterController] Update failed", err);
        this._renderer.showError("保存に失敗しました。もう一度お試しください。");
      } finally {
        this._renderer.setSubmitState(false);
      }
    }
  }
  let _controller$1 = null;
  const NewsletterPage = {
    /**
     * @param {HTMLElement} container
     * @param {{ config: Object, t: Function, token: string|null }} ctx
     */
    async mount(container, ctx) {
      const { config, t, token } = ctx;
      if (!token) {
        navigate({ view: "profile" });
        return;
      }
      const sf = new DiptyqueStorefrontClient(
        config.storefrontEndpoint,
        config.storefrontToken
      );
      const be = new DiptyqueBackendClient(
        config.apiBase,
        () => localStorage.getItem("shopifyCustomerAccessToken")
      );
      const api = new DiptyqueNewsletterApi(sf, be);
      const renderer = new DiptyqueNewsletterRenderer(container, t);
      _controller$1 = new DiptyqueNewsletterController(api, renderer);
      _controller$1.load(token);
    },
    unmount() {
      _controller$1 = null;
    }
  };
  class DiptyqueSavedCardsRenderer {
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
            ${this._t("saved_cards_empty", "決済方法が保存されていません。")}
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
  class DiptyqueSavedCardsController {
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
  let _controller = null;
  const SavedCardsPage = {
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
    }
  };
  function resolveSession() {
    const storedToken = localStorage.getItem("shopifyCustomerAccessToken");
    const storedExpiry = localStorage.getItem("shopifyCustomerAccessTokenExpiresAt");
    const tokenValid = storedToken && storedExpiry && new Date(storedExpiry) > /* @__PURE__ */ new Date();
    if (tokenValid) return { token: storedToken, isNative: false };
    const nativeCustomer = DiptyqueNativeSession.get();
    if (nativeCustomer) return { token: null, isNative: true };
    return null;
  }
  function injectHeaderDropdown(t) {
    var _a;
    const accountBtn = document.querySelector(".account-button");
    if (!accountBtn || accountBtn.dataset.accountInitialized) return;
    accountBtn.dataset.accountInitialized = "true";
    const storedToken = localStorage.getItem("shopifyCustomerAccessToken");
    const storedExpiry = localStorage.getItem("shopifyCustomerAccessTokenExpiresAt");
    const isLoggedIn = storedToken && storedExpiry && new Date(storedExpiry) > /* @__PURE__ */ new Date();
    if (!isLoggedIn) return;
    const existing = accountBtn.querySelector("[data-open-account-modal]");
    if (!existing) return;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = existing.className;
    toggle.setAttribute("aria-label", existing.getAttribute("aria-label") || "Account");
    toggle.setAttribute("aria-haspopup", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = existing.innerHTML;
    existing.replaceWith(toggle);
    const dropdown = document.createElement("div");
    dropdown.className = "account-dropdown";
    dropdown.setAttribute("role", "menu");
    dropdown.innerHTML = `
    <a href="/pages/account" class="account-dropdown__item" role="menuitem">
      ${t("header_my_account", "マイアカウント")}
    </a>
    <button type="button" class="account-dropdown__item" id="header-logout-btn" role="menuitem">
      ${t("logout", "ログアウト")}
    </button>`;
    accountBtn.appendChild(dropdown);
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    (_a = dropdown.querySelector("#header-logout-btn")) == null ? void 0 : _a.addEventListener("click", () => {
      logoutAccount("/");
    });
    document.addEventListener("click", () => {
      dropdown.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        dropdown.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }
  function initSidebarNav() {
    document.querySelectorAll("[data-view]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const view = el.dataset.view;
        if (view) navigate({ view });
      });
    });
  }
  function boot() {
    const root = document.getElementById("account-root");
    if (!root) return;
    const session = resolveSession();
    if (!session) {
      window.location.href = "/";
      return;
    }
    const config = loadConfig("account-config");
    const t = loadI18n("account-i18n");
    if (!config.storefrontEndpoint || !config.storefrontToken) {
      console.error("[account-app] Missing storefront config in #account-config");
      return;
    }
    const context = {
      config,
      t,
      token: session.token
    };
    const router = new AccountRouter({
      root,
      pages: {
        profile: ProfilePage,
        orders: OrdersPage,
        addresses: AddressesPage,
        order: OrderDetailPage,
        newsletter: NewsletterPage,
        "saved-cards": SavedCardsPage
      },
      context,
      navItems: document.querySelectorAll("[data-view]")
    });
    initSidebarNav();
    router.start();
    injectHeaderDropdown(t);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
