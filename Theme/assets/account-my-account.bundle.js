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
  function translateOrderStatus(status) {
    const map = {
      PAID: "支払い済み",
      PENDING: "保留中",
      REFUNDED: "返金済み",
      PARTIALLY_REFUNDED: "一部返金",
      VOIDED: "無効",
      AUTHORIZED: "承認済み"
    };
    return map[status] || status || "—";
  }
  function translateFulfillmentStatus(status) {
    const map = {
      FULFILLED: "発送済み",
      PARTIAL: "一部発送",
      UNFULFILLED: "未発送",
      RESTOCKED: "再入荷"
    };
    return map[status] || status || "未発送";
  }
  function getMetafieldValue(metafields, namespace, key) {
    if (!Array.isArray(metafields)) return "";
    const mf = metafields.find((m) => m && m.namespace === namespace && m.key === key);
    return mf ? mf.value || "" : "";
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
  const GET_ORDERS_QUERY = (
    /* graphql */
    `
  query GetCustomerOrders($token: String!, $first: Int!) {
    customer(customerAccessToken: $token) {
      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
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
    }
  }
`
  );
  class DiptyqueOrderApi {
    /** @param {import('./storefront').DiptyqueStorefrontClient} storefrontClient */
    constructor(storefrontClient) {
      this._sf = storefrontClient;
    }
    /**
     * Fetch the customer's recent orders.
     * @param {string} accessToken
     * @param {number} [limit=20]
     * @returns {Promise<Object[]>}
     */
    async list(accessToken, limit = 20) {
      var _a, _b;
      const data = await this._sf.request(GET_ORDERS_QUERY, {
        token: accessToken,
        first: limit
      });
      return (((_b = (_a = data.customer) == null ? void 0 : _a.orders) == null ? void 0 : _b.edges) ?? []).map((e) => e.node);
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
  class DiptyqueOrderRenderer {
    /**
     * @param {HTMLElement} container  Panel element to render into
     * @param {Function}    t          i18n lookup fn
     */
    constructor(container, t) {
      this._el = container;
      this._t = t;
    }
    render(state) {
      if (state.status === "loading") {
        this.renderLoading();
        return;
      }
      if (state.status === "error") {
        this.renderError(state.error);
        return;
      }
      this.renderOrders(state.orders);
    }
    renderLoading() {
      this._el.innerHTML = `
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this._t("loading", "読み込み中...")}</p>
      </div>`;
    }
    renderError(message) {
      this._el.innerHTML = `<p class="my-account__form-message--error">${message || "エラーが発生しました。"}</p>`;
    }
    renderOrders(orders) {
      const t = this._t;
      if (!orders.length) {
        this._el.innerHTML = `
        <div class="my-account__empty">
          <p>${t("no_orders", "注文履歴はまだありません。")}</p>
          <a href="/collections/all" class="my-account__shop-btn button">
            ${t("start_shopping", "ショッピングを始める")}
          </a>
        </div>`;
        return;
      }
      this._el.innerHTML = `
      <div class="my-account__orders">
        ${orders.map((order) => {
        var _a;
        const lines = (((_a = order.lineItems) == null ? void 0 : _a.edges) || []).map((e) => e.node);
        const total = order.totalPrice;
        return `
            <div class="my-account__order">
              <div class="my-account__order-header">
                <div class="my-account__order-info">
                  <span class="my-account__order-name">${escapeHtml(order.name)}</span>
                  <span class="my-account__order-date">${formatDate(order.processedAt)}</span>
                </div>
                <div class="my-account__order-status">
                  <span class="my-account__status-badge my-account__status-badge--${(order.financialStatus || "").toLowerCase()}">
                    ${translateOrderStatus(order.financialStatus)}
                  </span>
                  <span class="my-account__status-badge my-account__status-badge--${(order.fulfillmentStatus || "unfulfilled").toLowerCase()}">
                    ${translateFulfillmentStatus(order.fulfillmentStatus)}
                  </span>
                </div>
              </div>

              <div class="my-account__order-items">
                ${lines.map((item) => {
          var _a2, _b, _c, _d;
          const imgUrl = (_b = (_a2 = item.variant) == null ? void 0 : _a2.image) == null ? void 0 : _b.url;
          const price = (_c = item.variant) == null ? void 0 : _c.price;
          return `
                    <div class="my-account__order-item">
                      ${imgUrl ? `<img src="${imgUrl}" alt="${escapeHtml(item.title)}" class="my-account__item-image" loading="lazy">` : '<div class="my-account__item-image my-account__item-image--placeholder"></div>'}
                      <div class="my-account__item-details">
                        <p class="my-account__item-title">${escapeHtml(item.title)}</p>
                        ${((_d = item.variant) == null ? void 0 : _d.title) && item.variant.title !== "Default Title" ? `<p class="my-account__item-variant">${escapeHtml(item.variant.title)}</p>` : ""}
                        <p class="my-account__item-qty">${t("qty", "数量")}: ${item.quantity}</p>
                      </div>
                      <div class="my-account__item-price">
                        ${price ? formatPrice(price) : ""}
                      </div>
                    </div>`;
        }).join("")}
              </div>

              <div class="my-account__order-total">
                <span>${t("total", "合計")}</span>
                <span class="my-account__order-total-amount">
                  ${total ? formatPrice(total) : ""}
                </span>
              </div>
            </div>`;
      }).join("")}
      </div>`;
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
  const diptyqueOrderStore = createDiptyqueStore({
    status: "idle",
    orders: [],
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
  class DiptyqueOrderController {
    /**
     * @param {import('../api/orders').DiptyqueOrderApi}       api
     * @param {import('../ui/order').DiptyqueOrderRenderer}   renderer
     */
    constructor(api, renderer) {
      this._api = api;
      this._renderer = renderer;
      this._store = diptyqueOrderStore;
      this._store.subscribe((state) => renderer.render(state));
    }
    async load(accessToken, limit = 20) {
      if (!accessToken) {
        this._store.set({ status: "ready", orders: [], error: null });
        return;
      }
      this._store.set({ status: "loading", orders: [], error: null });
      try {
        const orders = await this._api.list(accessToken, limit);
        this._store.set({ status: "ready", orders, error: null });
      } catch (err) {
        console.error("[OrderController] Failed to load orders", err);
        this._store.set({ status: "error", orders: [], error: err.message });
      }
    }
    /** Seed orders from Liquid-injected native customer JSON (no network). */
    seedFromNative(orders) {
      this._store.set({ status: "ready", orders: orders || [], error: null });
    }
  }
  function resolveInitialTab() {
    const hash = (window.location.hash || "").replace(/^#/, "").trim();
    const param = new URLSearchParams(window.location.search).get("tab") || "";
    const valid = ["profile", "orders", "addresses", "cards", "shipping"];
    return valid.includes(hash) ? hash : valid.includes(param) ? param : "profile";
  }
  function setActiveTab(tab, updateHistory) {
    const valid = ["profile", "orders", "addresses", "cards", "shipping"];
    const safeTab = valid.includes(tab) ? tab : "profile";
    document.querySelectorAll(".my-account__nav-item").forEach((el) => {
      el.classList.toggle("my-account__nav-item--active", el.dataset.tab === safeTab);
    });
    document.querySelectorAll(".my-account__panel").forEach((el) => {
      el.classList.toggle("my-account__panel--active", el.dataset.panel === safeTab);
    });
    if (updateHistory) {
      const nextHash = safeTab === "profile" ? "" : "#" + safeTab;
      if (window.location.hash !== nextHash) {
        if (nextHash) window.location.hash = nextHash;
        else history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
  }
  function initTabNavigation() {
    document.querySelectorAll(".my-account__nav-item[data-tab]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        setActiveTab(el.dataset.tab, true);
      });
    });
    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.replace(/^#/, "");
      const valid = ["profile", "orders", "addresses", "cards", "shipping"];
      if (valid.includes(hash)) setActiveTab(hash, false);
    });
  }
  function injectHeaderDropdown(t) {
    var _a;
    const sfToken = localStorage.getItem("shopifyCustomerAccessToken");
    const sfExpiry = localStorage.getItem("shopifyCustomerAccessTokenExpiresAt");
    const isLoggedIn = sfToken && sfExpiry && new Date(sfExpiry) > /* @__PURE__ */ new Date();
    const accountBtn = document.querySelector(".account-button");
    if (!accountBtn || accountBtn.dataset.accountInitialized) return;
    accountBtn.dataset.accountInitialized = "true";
    if (!isLoggedIn) return;
    if (!document.getElementById("account-dropdown-styles")) {
      const style = document.createElement("style");
      style.id = "account-dropdown-styles";
      style.textContent = `
      .account-button{position:relative}
      .account-dropdown{position:absolute;top:calc(100% + 8px);right:0;min-width:160px;
        background:var(--color-background);border:1px solid var(--color-border,#e0e0e0);
        box-shadow:0 8px 24px rgba(0,0,0,.10);z-index:1100;display:none;flex-direction:column}
      .account-dropdown.is-open{display:flex}
      .account-dropdown__item{display:block;padding:12px 16px;font-size:.78rem;letter-spacing:.04em;
        color:var(--color-foreground);text-decoration:none;background:none;border:none;
        text-align:left;cursor:pointer;white-space:nowrap;transition:background .15s}
      .account-dropdown__item:hover{background:rgba(0,0,0,.04)}
      .account-dropdown__item+.account-dropdown__item{border-top:1px solid var(--color-border,#e0e0e0)}
    `;
      document.head.appendChild(style);
    }
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
    <a href="/pages/my-account" class="account-dropdown__item" role="menuitem">
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
  function boot() {
    var _a;
    const appEl = document.getElementById("my-account-app");
    if (!appEl) return;
    const config = loadConfig("ma-config");
    const t = loadI18n("ma-i18n");
    if (!config.storefrontEndpoint || !config.storefrontToken) {
      console.error("[account-boot] Missing storefront config in #ma-config");
      return;
    }
    const nativeCustomer = DiptyqueNativeSession.get();
    const storedToken = localStorage.getItem("shopifyCustomerAccessToken");
    const storedExpiry = localStorage.getItem("shopifyCustomerAccessTokenExpiresAt");
    const tokenValid = storedToken && storedExpiry && new Date(storedExpiry) > /* @__PURE__ */ new Date();
    const session = tokenValid ? { token: storedToken } : DiptyqueTokenStore.get();
    if (!nativeCustomer && !session) {
      window.location.href = "/";
      return;
    }
    const sf = new DiptyqueStorefrontClient(config.storefrontEndpoint, config.storefrontToken);
    const be = new DiptyqueBackendClient(config.apiBase, () => localStorage.getItem("shopifyCustomerAccessToken"));
    const profilePanel = appEl.querySelector('[data-panel="profile"]');
    const profileRenderer = new DiptyqueProfileRenderer(profilePanel, t);
    const customerApi = new DiptyqueCustomerApi(sf, be);
    const profileCtrl = new DiptyqueProfileController(customerApi, profileRenderer, {
      // Always use backend (Vercel API) for profile updates, regardless of
      // whether a native Shopify session exists. Native session is only used to
      // pre-populate display data; API calls require a storefront access token.
      isNative: false,
      logoutUrl: config.logoutUrl || "/account/logout",
      // Provide native session fallback so controller can recover if stored token is stale
      getNativeSession: () => DiptyqueNativeSession.get()
    });
    const ordersPanel = appEl.querySelector('[data-panel="orders"]');
    const orderRenderer = new DiptyqueOrderRenderer(ordersPanel, t);
    const orderApi = new DiptyqueOrderApi(sf);
    const orderCtrl = new DiptyqueOrderController(orderApi, orderRenderer);
    initTabNavigation();
    setActiveTab(resolveInitialTab(), false);
    if (nativeCustomer) {
      profileCtrl.load(null, nativeCustomer);
      const nativeOrders = (((_a = nativeCustomer.orders) == null ? void 0 : _a.edges) || []).map((e) => e.node);
      orderCtrl.seedFromNative(nativeOrders);
    } else {
      const token = session.token;
      profileCtrl.load(token);
      orderCtrl.load(token);
    }
    injectHeaderDropdown(t);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
