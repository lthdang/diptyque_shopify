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
  function gidToNumericId(gid) {
    if (!gid) return null;
    const m = gid.match(/\/(\d+)/);
    return m ? Number(m[1]) : null;
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
  const diptyqueAddressStore = createDiptyqueStore({
    status: "idle",
    addresses: [],
    error: null
  });
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
  function boot() {
    const container = document.getElementById("addresses-details-container");
    if (!container) return;
    const nativeCustomer = DiptyqueNativeSession.get();
    const storedToken = localStorage.getItem("shopifyCustomerAccessToken");
    const storedExpiry = localStorage.getItem("shopifyCustomerAccessTokenExpiresAt");
    const tokenValid = storedToken && storedExpiry && new Date(storedExpiry) > /* @__PURE__ */ new Date();
    const session = tokenValid ? { token: storedToken } : null;
    if (!nativeCustomer && !session) {
      window.location.href = "/";
      return;
    }
    const config = loadConfig("ad-config");
    const t = loadI18n("ad-i18n");
    if (!config.storefrontEndpoint || !config.storefrontToken) {
      console.error("[account-boot-addresses] Missing storefront config in #ad-config");
      return;
    }
    const sf = new DiptyqueStorefrontClient(config.storefrontEndpoint, config.storefrontToken);
    const be = new DiptyqueBackendClient(config.apiBase, () => localStorage.getItem("shopifyCustomerAccessToken"));
    const api = new DiptyqueAddressApi(sf, be);
    const renderer = new DiptyqueAddressRenderer(container, t);
    const controller = new DiptyqueAddressController(api, renderer);
    controller.load((session == null ? void 0 : session.token) || null);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
