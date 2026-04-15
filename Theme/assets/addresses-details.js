// =============================================================================
// AddressService — API layer
// Responsible for all backend API calls. Knows nothing about DOM or state.
// =============================================================================

class AddressService {
  /**
   * @param {string} baseUrl              e.g. "" or "https://api.example.com"
   * @param {() => string} getToken       Callback that returns the current access token
   * @param {string} storefrontEndpoint   Shopify Storefront GraphQL endpoint
   * @param {string} storefrontToken      Shopify Storefront access token
   */
  constructor(baseUrl, getToken, storefrontEndpoint, storefrontToken) {
    this._baseUrl             = baseUrl;
    this._getToken            = getToken;
    this._storefrontEndpoint  = storefrontEndpoint;
    this._storefrontToken     = storefrontToken;
  }

  // ── Storefront GraphQL ───────────────────────────────────────────────────

  async _storefrontRequest(query, variables = {}) {
    const res = await fetch(this._storefrontEndpoint, {
      method:  'POST',
      headers: {
        'Content-Type':                       'application/json',
        'Accept':                             'application/json',
        'X-Shopify-Storefront-Access-Token':  this._storefrontToken,
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors?.length) throw new Error(json.errors[0]?.message || 'Storefront API error');
    return json.data;
  }

  // ── Backend REST ─────────────────────────────────────────────────────────

  async _request(path, body = {}) {
    const url = `${this._baseUrl}${path}`;
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        customer_access_token: this._getToken(),
        ...body,
      }),
    });

    let json;
    try { json = await res.json(); } catch { json = {}; }

    if (!res.ok || json.success === false) {
      console.warn(`[AddressService] ${res.status} ${res.statusText} → ${url}`, json);
      const err    = new Error(json.message || `HTTP ${res.status}`);
      err.status   = res.status;
      err.code     = json.code;
      throw err;
    }

    return json.data ?? json;
  }

  async getAddresses() {
    const STOREFRONT_QUERY = `
      query GetCustomerAddresses($token: String!) {
        customer(customerAccessToken: $token) {
          defaultAddress { id }
          addresses(first: 50) {
            edges {
              node {
                id
                firstName
                lastName
                name
                company
                address1
                address2
                city
                province
                provinceCode
                country
                countryCodeV2
                zip
                phone
              }
            }
          }
        }
      }
    `;

    const token = this._getToken();

    // Fetch native fields from Storefront + extension_attributes from backend in parallel
    const [storefrontData, backendData] = await Promise.all([
      this._storefrontRequest(STOREFRONT_QUERY, { token }),
      this._request('/api/customers/account/addresses').catch(() => ({})),
    ]);

    const customer = storefrontData?.customer;
    if (!customer) return [];

    const defaultGid = customer.defaultAddress?.id ?? null;

    // Build extension_attributes map (keyed by numeric address ID) from backend
    const extMap = {};
    for (const addr of (backendData.addresses ?? [])) {
      extMap[String(addr.id)] = addr.extension_attributes ?? null;
    }

    // Extract numeric ID from Shopify GID (e.g. "gid://shopify/MailingAddress/12345..." → 12345)
    const gidToId = (gid) => {
      const m = gid?.match(/\/(\d+)/);
      return m ? Number(m[1]) : null;
    };

    return (customer.addresses?.edges ?? []).map(({ node }) => {
      const numericId = gidToId(node.id);
      return {
        id:            numericId,
        first_name:    node.firstName     ?? null,
        last_name:     node.lastName      ?? null,
        name:          node.name          ?? null,
        company:       node.company       ?? null,
        address1:      node.address1      ?? null,
        address2:      node.address2      ?? null,
        city:          node.city          ?? null,
        province:      node.province      ?? null,
        province_code: node.provinceCode  ?? null,
        country:       node.country       ?? null,
        country_code:  node.countryCodeV2 ?? null,
        zip:           node.zip           ?? null,
        phone:         node.phone         ?? null,
        default:       defaultGid != null && node.id === defaultGid,
        extension_attributes: extMap[String(numericId)] ?? null,
      };
    });
  }

  async createAddress(fields) {
    return this._request('/api/customers/account/addresses/create', fields);
  }

  async updateAddress(addressId, fields) {
    return this._request('/api/customers/account/addresses/update', { address_id: addressId, ...fields });
  }

  async deleteAddress(addressId) {
    return this._request('/api/customers/account/addresses/delete', { address_id: addressId });
  }

  async setDefaultBilling(addressId) {
    return this._request('/api/customers/account/addresses/set-default-billing', { address_id: addressId });
  }

  async setDefaultShipping(addressId) {
    return this._request('/api/customers/account/addresses/set-default-shipping', { address_id: addressId });
  }
}

// =============================================================================
// AddressStore — state management
// Single source of truth for the address list. Notifies subscribers on change.
// =============================================================================

class AddressStore {
  constructor() {
    /** @type {Array<Object>} */
    this._addresses  = [];
    /** @type {Array<(addresses: Object[]) => void>} */
    this._listeners  = [];
  }

  /** Replace the entire address list and notify. */
  set(addresses) {
    this._addresses = addresses;
    this._notify();
  }

  /**
   * Apply an updater function to the current list and notify.
   * @param {(current: Object[]) => Object[]} updaterFn
   */
  update(updaterFn) {
    this._addresses = updaterFn(this._addresses);
    this._notify();
  }

  /** @returns {Object[]} Current snapshot (do not mutate directly). */
  get() {
    return this._addresses;
  }

  /** Find one address by id. @returns {Object|null} */
  find(id) {
    return this._addresses.find(a => String(a.id) === String(id)) ?? null;
  }

  /**
   * Register a listener called whenever state changes.
   * @param {(addresses: Object[]) => void} listener
   * @returns {() => void} Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  _notify() {
    for (const listener of this._listeners) {
      listener(this._addresses);
    }
  }
}

// =============================================================================
// AddressRenderer — UI layer
// Responsible ONLY for producing / injecting HTML. No API calls, no state writes.
// =============================================================================

class AddressRenderer {
  /**
   * @param {HTMLElement} container  Root element (#addresses-details-container)
   * @param {Object}      t          i18n strings
   * @param {string}      addressesUrl
   */
  constructor(container, t, addressesUrl) {
    this._container   = container;
    this.t            = t;
    this._addressesUrl = addressesUrl;
  }

  // ── Utility ──────────────────────────────────────────────────────────────

  _esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Loading state ─────────────────────────────────────────────────────────

  renderLoading() {
    // Target the list root so we don't destroy the static benefits banner
    // or any other sibling HTML provided by the Liquid section.
    const root = this._container.querySelector('#addresses-list-root') || this._container;
    root.innerHTML = `
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this.t.loading}</p>
      </div>
    `;
  }

  // ── Page shell ─────────────────────────────────────────────────────────────

  renderPageShell() {
    // Layout (sidebar + main shell) is provided by the
    // my-account-layout Liquid snippet — no JS rendering needed.
  }

  // ── Address list ──────────────────────────────────────────────────────────

  /** Re-render only the list root — called on every state change. */
  renderAddressList(addresses) {
    const root = this._container.querySelector('#addresses-list-root') || this._container;

    const shipping = addresses.filter(a => (a.extension_attributes?.type ?? 'shipping') !== 'billing');
    const billing  = addresses.filter(a => a.extension_attributes?.type === 'billing');

    root.innerHTML = `
      <div class="addresses-details__wrapper">
        <div class="addresses-details__section">
          <h3 class="addresses-details__section-title">${this.t.address_shipping}</h3>
          <div class="addresses-details__list" id="shipping-list">
            ${shipping.map(a => this.renderCard(a)).join('')}
          </div>
          <div class="addresses-details__action-area mt-40" data-area="shipping">
            <button type="button" class="addresses-details__new-btn" data-action="new-address" data-type="shipping">
              ${this.t.address_new_btn}
            </button>
            <div class="my-account__address-form-container" data-id="new-shipping"></div>
          </div>
        </div>

        <div class="addresses-details__section mt-40">
          <h3 class="addresses-details__section-title">${this.t.address_billing}</h3>
          <div class="addresses-details__list" id="billing-list">
            ${billing.map(a => this.renderCard(a)).join('')}
          </div>
          <div class="addresses-details__action-area mt-40" data-area="billing">
            <button type="button" class="addresses-details__new-btn" data-action="new-address" data-type="billing">
              ${this.t.address_new_btn}
            </button>
            <div class="my-account__address-form-container" data-id="new-billing"></div>
          </div>
        </div>
      </div>
    `;
  }

  /** @returns {string} HTML for a single address card. */
  renderCard(addr) {
    const ext        = addr.extension_attributes ?? {};
    const showBadge  = ext.is_default_billing === true || ext.is_default_shipping === true;

    return `
      <div class="addresses-details__card" data-id="${addr.id}">
        <div class="addresses-details__card-info">
          ${showBadge ? `<span class="addresses-details__default-badge">${this.t.address_default_badge}</span>` : ''}
          <p class="addresses-details__name">${this._esc(addr.last_name || '')} ${this._esc(addr.first_name || '')}</p>
          <p>${this._esc(addr.zip || '')}</p>
          <p>${this._esc(addr.province || '')}</p>
          <p>${this._esc(addr.city || '')}</p>
          <p>${this._esc(addr.address1 || '')}</p>
          ${addr.address2 ? `<p>${this._esc(addr.address2)}</p>` : ''}
          ${addr.phone    ? `<p>${this._esc(addr.phone)}</p>`    : ''}
        </div>
        <div class="addresses-details__actions">
          <button type="button" class="my-account__text-btn" data-action="edit-address" data-id="${addr.id}">
            ${this.t.address_edit}
          </button>
          <button type="button" class="my-account__text-btn" data-action="delete-address" data-id="${addr.id}">
            ${this.t.address_delete}
          </button>
        </div>
      </div>
      <div class="my-account__address-form-container" data-id="${addr.id}"></div>
    `;
  }

  /** @returns {string} HTML for the address create/edit form. */
  renderForm(address = null, type = 'billing') {
    const PREFECTURES = ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];

    // Shopify Admin REST API may return province in English (e.g. "Tokyo").
    // Normalise to Japanese name so the select pre-selects correctly.
    const PREFECTURE_EN_JA = {
      'Aichi':'愛知県','Akita':'秋田県','Aomori':'青森県','Chiba':'千葉県',
      'Ehime':'愛媛県','Fukui':'福井県','Fukuoka':'福岡県','Fukushima':'福島県',
      'Gifu':'岐阜県','Gunma':'群馬県','Hiroshima':'広島県','Hokkaido':'北海道',
      'Hyogo':'兵庫県','Ibaraki':'茨城県','Ishikawa':'石川県','Iwate':'岩手県',
      'Kagawa':'香川県','Kagoshima':'鹿児島県','Kanagawa':'神奈川県','Kochi':'高知県',
      'Kumamoto':'熊本県','Kyoto':'京都府','Mie':'三重県','Miyagi':'宮城県',
      'Miyazaki':'宮崎県','Nagano':'長野県','Nagasaki':'長崎県','Nara':'奈良県',
      'Niigata':'新潟県','Oita':'大分県','Okayama':'岡山県','Okinawa':'沖縄県',
      'Osaka':'大阪府','Saga':'佐賀県','Saitama':'埼玉県','Shiga':'滋賀県',
      'Shimane':'島根県','Shizuoka':'静岡県','Tochigi':'栃木県','Tokushima':'徳島県',
      'Tokyo':'東京都','Tottori':'鳥取県','Toyama':'富山県','Wakayama':'和歌山県',
      'Yamagata':'山形県','Yamaguchi':'山口県','Yamanashi':'山梨県',
    };
    const rawProvince       = address?.province || '';
    const normalizedProvince = PREFECTURE_EN_JA[rawProvince] || rawProvince;

    const ext           = address?.extension_attributes ?? {};
    const lastnameKana  = ext.lastname_kana  ?? '';
    const firstnameKana = ext.firstname_kana ?? '';
    const isDefBill     = ext.is_default_billing  === true;
    const isDefShip     = ext.is_default_shipping === true;

    const defaultCheckbox = type === 'billing'
      ? `<label class="addresses-details__checkbox-label">
           <input type="checkbox" name="is_default_billing" value="1"${isDefBill ? ' checked' : ''}>
           ${this.t.default_billing_label}
         </label>`
      : `<label class="addresses-details__checkbox-label">
           <input type="checkbox" name="is_default_shipping" value="1"${isDefShip ? ' checked' : ''}>
           ${this.t.default_shipping_label}
         </label>`;

    const provinceOptions = PREFECTURES.map(p =>
      `<option value="${p}"${normalizedProvince === p ? ' selected' : ''}>${p}</option>`
    ).join('');

    return `
      <form class="addresses-details__form" data-id="${address?.id || ''}" data-type="${type}" data-province-raw="${this._esc(rawProvince)}">
        <div class="addresses-details__form-row">
          <div class="addresses-details__field">
            <label>${this.t.last_name} *</label>
            <input type="text" name="last_name" class="my-account__input" value="${this._esc(address?.last_name || '')}" required>
          </div>
          <div class="addresses-details__field">
            <label>${this.t.first_name} *</label>
            <input type="text" name="first_name" class="my-account__input" value="${this._esc(address?.first_name || '')}" required>
          </div>
        </div>

        <div class="addresses-details__form-row">
          <div class="addresses-details__field">
            <label>${this.t.furigana_last} *</label>
            <input type="text" name="lastname_kana" class="my-account__input" value="${this._esc(lastnameKana)}" required>
          </div>
          <div class="addresses-details__field">
            <label>${this.t.furigana_first} *</label>
            <input type="text" name="firstname_kana" class="my-account__input" value="${this._esc(firstnameKana)}" required>
          </div>
        </div>

        <div class="addresses-details__field">
          <label>${this.t.zip} *</label>
          <input type="text" name="zip" class="my-account__input" value="${this._esc(address?.zip || '')}" required placeholder="例：060-0000" maxlength="8" data-zip-autofill>
          <span class="my-account__field-error" data-error-for="zip-lookup" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${this.t.province} *</label>
          <select name="province" class="my-account__input" required>
            <option value="" disabled ${!address?.province ? 'selected' : ''}>${this.t.province_placeholder}</option>
            ${provinceOptions}
          </select>
        </div>

        <div class="addresses-details__field">
          <label>${this.t.city} *</label>
          <input type="text" name="city" class="my-account__input" value="${this._esc(address?.city || '')}" required>
        </div>

        <div class="addresses-details__field">
          <label>${this.t.address1} *</label>
          <input type="text" name="address1" class="my-account__input" value="${this._esc(address?.address1 || '')}" required>
        </div>

        <div class="addresses-details__field">
          <label>${this.t.address2}</label>
          <input type="text" name="address2" class="my-account__input" value="${this._esc(address?.address2 || '')}">
        </div>

        <div class="addresses-details__field">
          <label>${this.t.phone} *</label>
          <input type="tel" name="phone" class="my-account__input" value="${this._esc(address?.phone || '')}" required>
          <span class="my-account__field-error" data-error-for="address-phone" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field addresses-details__field--checkbox">
          ${defaultCheckbox}
        </div>

        <p class="addresses-details__required-label">${this.t.required}</p>
        <div class="my-account__form-message my-account__form-message--error" style="display:none;"></div>

        <button type="submit" class="addresses-details__submit-btn">${this.t.address_submit}</button>
        <button type="button" class="addresses-details__cancel-btn" data-action="cancel-address">${this.t.address_cancel}</button>
      </form>
    `;
  }

  // ── Form helpers ──────────────────────────────────────────────────────────

  /** Close all open forms and restore card / button visibility. */
  closeAllForms() {
    this._container.querySelectorAll('.my-account__address-form-container').forEach(c => { c.innerHTML = ''; });
    this._container.querySelectorAll('.addresses-details__card').forEach(c => { c.style.display = ''; });
    this._container.querySelectorAll('.addresses-details__actions').forEach(a => { a.style.display = ''; });
    this._container.querySelectorAll('[data-action="new-address"]').forEach(b => { b.style.display = ''; });
  }

  /** Inject a form into the container slot for `addressId`. */
  openForm(addressId, address, type) {
    const slot = this._container.querySelector(`.my-account__address-form-container[data-id="${addressId}"]`);
    if (slot) slot.innerHTML = this.renderForm(address, type);
  }

  // ── Benefits banner ───────────────────────────────────────────────────────

  _renderBenefits() {
    return `
      <div class="my-account__benefits-banner mt-40">
        <h3 class="my-account__benefits-title">${this.t.benefits_title}</h3>
        <p class="my-account__benefits-subtitle">${this.t.benefits_subtitle}</p>
        <div class="my-account__benefits-icons">
          <div class="my-account__benefit-item">
            <div class="my-account__benefit-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2a4b38" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 11h16"/><path d="M12 11V7"/><path d="M8 7a4 4 0 0 1 8 0v4H8V7z"/></svg>
            </div>
            <span class="my-account__benefit-text">${this.t.benefit_1}</span>
          </div>
          <div class="my-account__benefit-item">
            <div class="my-account__benefit-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2a4b38" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <span class="my-account__benefit-text">${this.t.benefit_2}</span>
          </div>
          <div class="my-account__benefit-item">
            <div class="my-account__benefit-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2a4b38" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-2-2H5L3 8v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z"/><path d="M3 8h18"/><path d="M12 3v5"/><path d="M16 12a4 4 0 0 1-8 0"/></svg>
            </div>
            <span class="my-account__benefit-text">${this.t.benefit_3}</span>
          </div>
        </div>
      </div>
    `;
  }
}

// =============================================================================
// AddressesPage — controller
// Coordinates AddressService, AddressStore and AddressRenderer.
// Handles init, event binding, form submission, delete and set-default logic.
// =============================================================================

class AddressesDetailsPage {
  constructor() {
    this.container = document.getElementById('addresses-details-container');
    if (!this.container) return;

    // data-* attributes are on #addresses-details-container itself
    const d = this.container.dataset;

    const token       = localStorage.getItem('shopifyCustomerAccessToken');
    const apiBaseUrl  = (d.apiBaseUrl || d.apiBase || '').replace(/\/+$/, '');
    const addressesUrl = d.addressesUrl || '/pages/addresses-details';

    const t = {
      nav_profile:  d.tNavProfile  || 'お客様情報',
      nav_orders:   d.tNavOrders   || 'ご注文履歴',
      nav_addresses: d.tNavAddresses || 'アドレス帳',
      nav_cards:    d.tNavCards    || '保存カード',
      nav_shipping: d.tNavShipping || '配信設定',

      address_edit:    d.tAddressEdit    || '編集',
      address_delete:  d.tAddressDelete  || '削除',
      address_new_btn: d.tAddressNew     || '新しい住所を登録する',
      address_shipping: d.tAddressShipping || '配送先住所',
      address_billing:  d.tAddressBilling  || 'ご依頼主住所',
      address_cancel:  d.tAddressCancel  || 'キャンセル',
      address_submit:  d.tAddressSubmit  || '決定',
      address_default_badge:    d.tAddressDefaultBadge    || 'デフォルト',
      default_billing_label:    d.tDefaultBillingLabel    || 'デフォルトの請求先住所に設定する',
      default_shipping_label:   d.tDefaultShippingLabel   || 'デフォルトの配送先住所に設定する',

      zip:      d.tZip      || '郵便番号',
      province: d.tProvince || '都道府県',
      province_placeholder: d.tProvincePlaceholder || '都道府県を選択',
      city:     d.tCity     || '市区町村',
      address1: d.tAddress1 || '丁番・番地',
      address2: d.tAddress2 || 'マンション・建物名',
      last_name:     d.tLastName     || '姓',
      first_name:    d.tFirstName    || '名',
      furigana_last:  d.tFuriganaLast  || 'フリガナ（姓）',
      furigana_first: d.tFuriganaFirst || 'フリガナ（名）',
      phone:    d.tPhone    || '電話番号',
      required: d.tRequired || '* 必須',
      loading:  d.tLoading  || '読み込み中...',
      confirm_delete: d.tConfirmDelete || '本当にこの住所を削除しますか？',
      delete_error:   d.tDeleteError   || '削除に失敗しました。',
      phone_invalid:  d.tPhoneInvalid  || '無効な電話番号です',
      save_error:     d.tSaveError     || '保存に失敗しました。',
      benefits_title:    d.tBenefitsTitle    || 'マイアカウント特典',
      benefits_subtitle: d.tBenefitsSubtitle || 'diptyqueのアカウントを作成すると、以下の特典をご利用いただけます。',
      benefit_1: d.tBenefit1 || 'お買い物の履歴をいつでも確認可能',
      benefit_2: d.tBenefit2 || '気になるアイテムをお気に入りに保存',
      benefit_3: d.tBenefit3 || 'ご注文履歴・配送状況の確認',
    };

    const storefrontEndpoint = d.storefrontEndpoint || '';
    const storefrontToken    = d.storefrontToken    || '';

    this._service  = new AddressService(apiBaseUrl, () => token, storefrontEndpoint, storefrontToken);
    this._store    = new AddressStore();
    this._renderer = new AddressRenderer(this.container, t, addressesUrl);

    // Subscribe renderer to store — every state change re-renders the list
    this._store.subscribe(addresses => this._renderer.renderAddressList(addresses));

    this.init();
  }


  // ── Init ─────────────────────────────────────────────────────────────────

  async init() {
    const token = localStorage.getItem('shopifyCustomerAccessToken');
    if (!token) {
      window.location.href = '/account/login';
      return;
    }

    this._renderer.renderLoading();

    try {
      const addresses = await this._service.getAddresses();
      this._store.set(addresses);
      // Shell is in Liquid — render the list directly into #addresses-list-root
      this._renderer.renderAddressList(this._store.get());
    } catch (err) {
      console.error('[AddressesPage] Failed to load addresses', err);
      if (err.status === 401 || err.status === 403) {
        window.location.href = '/account/login';
        return;
      }
      const root = this.container.querySelector('#addresses-list-root') || this.container;
      root.innerHTML = `
        <p class="my-account__form-message--error" style="margin-top:20px;">
          ${this._renderer.t.save_error}
        </p>
      `;
    }

    this.bindEvents();
  }

  // ── Events ───────────────────────────────────────────────────────────────

  bindEvents() {
    this.container.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;

      // ── New address ──
      if (action === 'new-address') {
        const type = btn.dataset.type || 'billing';
        this._renderer.closeAllForms();
        btn.style.display = 'none';
        const slotId = `new-${type}`;
        this._renderer.openForm(slotId, null, type);
        return;
      }

      // ── Edit address ──
      if (action === 'edit-address') {
        const id      = btn.dataset.id;
        const address = this._store.find(id);
        console.log('[AddressesPage] edit address data:', JSON.parse(JSON.stringify(address ?? {})));
        if (!address) return;
        const type    = address.extension_attributes?.type || 'shipping';
        this._renderer.closeAllForms();
        const card = this.container.querySelector(`.addresses-details__card[data-id="${id}"]`);
        if (card) {
          const actions = card.querySelector('.addresses-details__actions');
          if (actions) actions.style.display = 'none';
        }
        this._renderer.openForm(id, address, type);
        return;
      }

      // ── Cancel form ──
      if (action === 'cancel-address') {
        this._renderer.closeAllForms();
        return;
      }

      // ── Delete address ──
      if (action === 'delete-address') {
        const t   = this._renderer.t;
        const id  = btn.dataset.id;
        if (!confirm(t.confirm_delete)) return;

        btn.textContent = '...';
        btn.disabled    = true;

        try {
          await this._service.deleteAddress(id);
          const updated = await this._service.getAddresses();
          this._store.set(updated);
        } catch (err) {
          console.error('[AddressesPage] Delete failed', err);
          btn.textContent = this._renderer.t.address_delete;
          btn.disabled    = false;
          alert(this._renderer.t.delete_error);
        }
        return;
      }
    });

    // ── Form submit ──
    this.container.addEventListener('submit', async (e) => {
      const form = e.target.closest('.addresses-details__form');
      if (!form) return;
      e.preventDefault();
      await this.handleSubmitAddressForm(form);
    });

    // ── Zip auto-fill (fires when 7 digits are fully entered) ──
    let _zipTimer = null;
    this.container.addEventListener('input', (e) => {
      const zipInput = e.target.closest('[data-zip-autofill]');
      if (!zipInput) return;
      clearTimeout(_zipTimer);
      const digits = zipInput.value.replace(/[^0-9]/g, '');
      if (digits.length < 7) return;
      _zipTimer = setTimeout(() => this._doZipLookup(zipInput), 300);
    });
  }

  // ── Zip lookup ──────────────────────────────────────────────────────────

  async _doZipLookup(zipInput) {
    const form   = zipInput.closest('.addresses-details__form');
    if (!form) return;
    const errEl  = form.querySelector('[data-error-for="zip-lookup"]');
    const digits = zipInput.value.replace(/[^0-9]/g, '');
    if (errEl) errEl.textContent = '';

    try {
      const res  = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`);
      const json = await res.json();

      if (!json.results || json.results.length === 0) {
        if (errEl) errEl.textContent = '該当する住所が見つかりませんでした。';
        return;
      }

      const result     = json.results[0];
      const prefecture = result.address1 || '';
      const city       = result.address2 || '';
      const town       = result.address3 || '';

      // Fill province select
      const provinceEl = form.querySelector('[name="province"]');
      if (provinceEl) {
        const opt = Array.from(provinceEl.options).find(o => o.value === prefecture);
        if (opt) provinceEl.value = prefecture;
      }

      // Fill city
      const cityEl = form.querySelector('[name="city"]');
      if (cityEl) cityEl.value = city;

      // Fill address1 with town only if the field is empty
      const addr1El = form.querySelector('[name="address1"]');
      if (addr1El && !addr1El.value.trim()) addr1El.value = town;

    } catch (err) {
      console.error('[ZipLookup] failed', err);
      if (errEl) errEl.textContent = '住所検索に失敗しました。';
    }
  }

  // ── Form submission ───────────────────────────────────────────────────────

  async handleSubmitAddressForm(form) {
    const t      = this._renderer.t;
    const id     = form.dataset.id;
    const type   = form.dataset.type || 'billing';
    const isEdit = Boolean(id);

    // Phone validation
    const phoneEl  = form.querySelector('[name="phone"]');
    const phoneErr = form.querySelector('[data-error-for="address-phone"]');
    if (phoneEl && phoneErr) {
      const ok = /^[0-9\-+\s()]{7,20}$/.test(phoneEl.value.trim());
      phoneErr.textContent = ok ? '' : t.phone_invalid;
      if (!ok) { phoneEl.focus(); return; }
    }

    // Collect fields

    const data = new FormData(form);
    const fields = {
      type,
      first_name:     data.get('first_name')?.trim()     || '',
      last_name:      data.get('last_name')?.trim()       || '',
      firstname_kana: data.get('firstname_kana')?.trim()  || '',
      lastname_kana:  data.get('lastname_kana')?.trim()   || '',
      zip:            data.get('zip')?.trim()             || '',
      province:       data.get('province')?.trim()        || '',
      city:           data.get('city')?.trim()            || '',
      address1:       data.get('address1')?.trim()        || '',
      address2:       data.get('address2')?.trim()        || '',
      phone:          data.get('phone')?.trim()           || '',
      country:        'Japan',
      is_default_billing:  !!data.get('is_default_billing'),
      is_default_shipping: !!data.get('is_default_shipping'),
    };

    const submitBtn = form.querySelector('[type="submit"]');
    const errorEl   = form.querySelector('.my-account__form-message--error');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '...'; }
    if (errorEl)   { errorEl.style.display = 'none'; }

    try {
      if (isEdit) {
        await this._service.updateAddress(id, fields);
      } else {
        await this._service.createAddress(fields);
      }

      const updated = await this._service.getAddresses();
      this._store.set(updated);
      // list re-render handled by store subscription; forms are cleared after re-render
    } catch (err) {
      console.error('[AddressesPage] Save failed', err);
      if (errorEl) {
        errorEl.textContent    = err.message || t.save_error;
        errorEl.style.display  = 'block';
      }
      if (submitBtn) {
        submitBtn.disabled    = false;
        submitBtn.textContent = t.address_submit;
      }
    }
  }

  // ── Set default ───────────────────────────────────────────────────────────

  async handleSetDefault(addressId, defaultType) {
    // Optimistic update
    this._store.update(addresses => addresses.map(a => ({
      ...a,
      extension_attributes: {
        ...(a.extension_attributes ?? {}),
        [defaultType === 'billing' ? 'is_default_billing' : 'is_default_shipping']:
          String(a.id) === String(addressId),
      },
    })));

    try {
      if (defaultType === 'billing') {
        await this._service.setDefaultBilling(addressId);
      } else {
        await this._service.setDefaultShipping(addressId);
      }
      // Sync authoritative state from server
      const updated = await this._service.getAddresses();
      this._store.set(updated);
    } catch (err) {
      console.error('[AddressesPage] Set default failed', err);
      // Rollback: re-fetch from server
      const rollback = await this._service.getAddresses();
      this._store.set(rollback);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AddressesDetailsPage();
});

