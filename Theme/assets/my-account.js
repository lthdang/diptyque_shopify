class MyAccountPage {
  constructor() {
    this.container = document.getElementById('my-account-app');
    if (!this.container) return;

    this.storefrontEndpoint = this.container.dataset.storefrontEndpoint || '';
    this.storefrontToken = this.container.dataset.storefrontToken || '';
    this.shopId = this.container.dataset.shopId || '';
    this.accountApiBase = (this.container.dataset.apiBase || '').replace(/\/+$/, '');
    this.logoutUrl = this.container.dataset.logoutUrl || '/account/logout';

    this.collectTranslations();
    this.init();
  }

  collectTranslations() {
    let customTranslations = {};
    try {
      const transEl = document.getElementById('my-account-translations');
      if (transEl && transEl.textContent.trim() !== 'null') {
        customTranslations = JSON.parse(transEl.textContent) || {};
      }
    } catch (e) {
      console.warn('[MyAccount] Failed to parse custom translations:', e);
    }

    const d = this.container.dataset;
    this.t = {
      nav_profile: customTranslations.nav_profile || d.tNavProfile || 'アカウント情報',
      nav_orders: customTranslations.nav_orders || d.tNavOrders || 'ご注文履歴',
      nav_addresses: customTranslations.nav_addresses || d.tNavAddresses || 'アドレス帳',
      nav_cards: customTranslations.nav_cards || d.tNavCards || '保存カード',
      nav_shipping: customTranslations.nav_shipping || d.tNavShipping || '配信設定',
      profile_title: customTranslations.profile_title || d.tProfileTitle || 'お客様情報',
      last_name: customTranslations.last_name || d.tLastName || '姓',
      first_name: customTranslations.first_name || d.tFirstName || '名',
      furigana_last: customTranslations.furigana_last || d.tFuriganaLast || 'フリガナ（姓）',
      furigana_first: customTranslations.furigana_first || d.tFuriganaFirst || 'フリガナ（名）',
      dob: customTranslations.dob || d.tDob || '生年月日',
      phone: customTranslations.phone || d.tPhone || '電話番号',
      email: customTranslations.email || d.tEmail || 'Eメールアドレス',
      required: customTranslations.required || d.tRequired || '* 必須',
      submit: customTranslations.submit || d.tSubmit || '確定',
      login_info_title: customTranslations.login_info_title || d.tLoginInfoTitle || 'ログイン情報',
      password: customTranslations.password || d.tPassword || 'パスワード',
      current_password: customTranslations.current_password || d.tCurrentPassword || '現在のパスワード',
      new_password: customTranslations.new_password || d.tNewPassword || '新しいパスワード',
      password_hint: customTranslations.password_hint || d.tPasswordHint || 'ⓘ パスワードはアルファベット、記号、数字 すべてを1つ以上含む、8文字以上で入力してください',
      password_confirm: customTranslations.password_confirm || d.tPasswordConfirm || 'パスワード（再入力）',
      benefits_title: customTranslations.benefits_title || d.tBenefitsTitle || 'DIPTYQUEの会員特典',
      benefits_subtitle: customTranslations.benefits_subtitle || d.tBenefitsSubtitle || 'Diptyque アカウントには、様々な特典がございます：',
      benefit_1: customTranslations.benefit_1 || d.tBenefit1 || 'お誕生日に香りのサプライズ',
      benefit_2: customTranslations.benefit_2 || d.tBenefit2 || 'Diptyqueのイベントへのご招待',
      benefit_3: customTranslations.benefit_3 || d.tBenefit3 || '会員限定の特別販売へのご招待',
      logout: customTranslations.logout || d.tLogout || 'ログアウト',
      loading: '読み込み中...',
      login_required: 'ログインが必要です',
      login_prompt: 'アカウント情報を表示するにはログインしてください。',
      login_btn: 'ログイン',
      no_orders: '注文履歴はまだありません。',
      start_shopping: 'ショッピングを始める',
      qty: '数量',
      total: '合計',
      no_addresses: '登録された住所はありません。',
      default_badge: 'デフォルト',
      no_cards: '保存されたカードはありません。',
      no_shipping: '設定がありません。',
      save_success: customTranslations.save_success || d.tSaveSuccess || '情報が保存されました。',
      save_failed: customTranslations.save_failed || d.tSaveFailed || '保存に失敗しました。もう一度お試しください。',
      validation_required: customTranslations.validation_required || d.tValidationRequired || 'この項目は必須です。',
      validation_kana_invalid: customTranslations.validation_kana_invalid || d.tValidationKanaInvalid || '全角カタカナで入力してください。',
      validation_email_invalid: customTranslations.validation_email_invalid || d.tValidationEmailInvalid || '有効なメールアドレスを入力してください。',
      validation_phone_invalid: customTranslations.validation_phone_invalid || d.tValidationPhoneInvalid || '有効な電話番号を入力してください。',
      validation_dob_invalid: customTranslations.validation_dob_invalid || d.tValidationDobInvalid || 'YYYY/MM/DD 形式の有効な日付を入力してください。',
      validation_password_weak: customTranslations.validation_password_weak || d.tValidationPasswordWeak || 'パスワードは8文字以上で、英字・数字・記号を含む必要があります。',
      validation_password_mismatch: customTranslations.validation_password_mismatch || d.tValidationPasswordMismatch || 'パスワードが一致しません。',
      validation_password_required_all: customTranslations.validation_password_required_all || d.tValidationPasswordRequiredAll || 'すべてのパスワード欄を入力してください。',
      validation_current_password_required_for_email: customTranslations.validation_current_password_required_for_email || d.tValidationCurrentPasswordRequiredForEmail || 'メールアドレスを変更する場合は現在のパスワードを入力してください。',
      validation_current_password_invalid: customTranslations.validation_current_password_invalid || d.tValidationCurrentPasswordInvalid || '現在のパスワードが正しくありません。',
      validation_email_taken: customTranslations.validation_email_taken || d.tValidationEmailTaken || 'このメールアドレスは既に使用されています。',
      session_expired: customTranslations.session_expired || d.tSessionExpired || 'セッションの有効期限が切れました。再度ログインしてください。',
      update_not_supported: customTranslations.update_not_supported || d.tUpdateNotSupported || '現在のセッションではパスワードの更新はサポートされていません。',
      saving: customTranslations.saving || d.tSaving || '保存中...'
    };
  }

  async init() {
    // 1. Check native Shopify session (customer logged in via Shopify's own login page)
    const nativeCustomer = this.loadNativeCustomer();
    if (nativeCustomer) {
      this.nativeSession = true;
      this.renderDashboard(nativeCustomer);
      return;
    }

    // 2. Fall back to Storefront API token in localStorage
    const session = this.loadSession();
    if (!session) {
      this.showLoginPrompt();
      return;
    }

    // Verify token is still valid by fetching customer data
    try {
      this.showLoading();
      const customer = await this.fetchFullCustomer(session.accessToken);
      if (!customer) {
        this.clearSession();
        this.showLoginPrompt();
        return;
      }
      // Update cached customer data
      localStorage.setItem('shopifyCustomer', JSON.stringify(customer));
      this.renderDashboard(customer);
    } catch (err) {
      console.error('[MyAccount] Failed to fetch customer:', err);
      this.clearSession();
      this.showLoginPrompt();
    }
  }

  loadNativeCustomer() {
    const el = document.getElementById('my-account-native-customer');
    if (!el) return null;
    try {
      return JSON.parse(el.textContent || 'null') || null;
    } catch (e) {
      console.warn('[MyAccount] Failed to parse native customer data:', e);
      return null;
    }
  }

  loadSession() {
    const token = localStorage.getItem('shopifyCustomerAccessToken');
    const expiresAt = localStorage.getItem('shopifyCustomerAccessTokenExpiresAt');
    if (!token || !expiresAt) return null;
    if (new Date(expiresAt) <= new Date()) {
      this.clearSession();
      return null;
    }
    return { accessToken: token, expiresAt };
  }

  clearSession() {
    localStorage.removeItem('shopifyCustomerAccessToken');
    localStorage.removeItem('shopifyCustomerAccessTokenExpiresAt');
    localStorage.removeItem('shopifyCustomer');
  }

  async storefrontRequest(query, variables = {}) {
    const response = await fetch(this.storefrontEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Shopify-Storefront-Access-Token': this.storefrontToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Storefront API HTTP ${response.status}`);
    }

    const json = await response.json();
    if (json.errors?.length) {
      throw new Error(json.errors[0]?.message || 'GraphQL error');
    }
    return json;
  }

  async fetchFullCustomer(accessToken) {
    const query = `
      query getCustomer($token: String!) {
        customer(customerAccessToken: $token) {
          id
          firstName
          lastName
          email
          phone
          acceptsMarketing
          metafields(identifiers: [
            {namespace: "registration", key: "first_name_kana"},
            {namespace: "registration", key: "last_name_kana"},
            {namespace: "registration", key: "birthday"}
          ]) {
            namespace
            key
            value
            type
          }
          defaultAddress {
            id
            firstName
            lastName
            address1
            address2
            city
            province
            zip
            country
            phone
          }
          addresses(first: 10) {
            edges {
              node {
                id
                firstName
                lastName
                address1
                address2
                city
                province
                zip
                country
                phone
              }
            }
          }
          orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
            edges {
              node {
                id
                name
                processedAt
                financialStatus
                fulfillmentStatus
                totalPrice {
                  amount
                  currencyCode
                }
                lineItems(first: 50) {
                  edges {
                    node {
                      title
                      quantity
                      variant {
                        title
                        image {
                          url(transform: { maxWidth: 120 })
                        }
                        price {
                          amount
                          currencyCode
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;
    const data = await this.storefrontRequest(query, { token: accessToken });
    return data.data?.customer || null;
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  showLoading() {
    this.container.innerHTML = `
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this.t.loading}</p>
      </div>
    `;
  }

  showLoginPrompt() {
    this.container.innerHTML = `
      <div class="my-account__not-logged-in">
        <div class="my-account__not-logged-in-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <h2>${this.t.login_required}</h2>
        <p>${this.t.login_prompt}</p>
        <button type="button" class="my-account__login-btn button" data-open-account-modal="login">
          ${this.t.login_btn}
        </button>
      </div>
    `;
  }

  renderDashboard(customer) {
    this.currentCustomer = customer;
    const orders = customer.orders?.edges?.map(e => e.node) || [];
    const addresses = customer.addresses?.edges?.map(e => e.node) || [];
    const activeTab = this.resolveInitialTab();

    this.container.innerHTML = `
      <div class="my-account__layout">

        <!-- Sidebar -->
        <aside class="my-account__sidebar">
          <nav class="my-account__nav">
            <button class="my-account__nav-item my-account__nav-item--active" data-tab="profile">
              <span>${this.t.nav_profile}</span>
              <span class="my-account__nav-arrow">▶</span>
            </button>
            <button class="my-account__nav-item" data-tab="orders">
              <span>${this.t.nav_orders}</span>
              <span class="my-account__nav-arrow">▶</span>
            </button>
            <button class="my-account__nav-item" data-tab="addresses">
              <span>${this.t.nav_addresses}</span>
              <span class="my-account__nav-arrow">▶</span>
            </button>
            <button class="my-account__nav-item" data-tab="cards">
              <span>${this.t.nav_cards}</span>
              <span class="my-account__nav-arrow">▶</span>
            </button>
            <button class="my-account__nav-item" data-tab="shipping">
              <span>${this.t.nav_shipping}</span>
              <span class="my-account__nav-arrow">▶</span>
            </button>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="my-account__main">
          <div class="my-account__panel my-account__panel--active" data-panel="profile">
            ${this.renderProfile(customer)}
          </div>
          <div class="my-account__panel" data-panel="orders">
            ${this.renderOrders(orders)}
          </div>
          <div class="my-account__panel" data-panel="addresses">
            ${this.renderAddresses(addresses, customer.defaultAddress)}
          </div>
          <div class="my-account__panel" data-panel="cards">
            <p style="font-size: 0.8rem; opacity: 0.6; margin-top:20px;">${this.t.no_cards}</p>
          </div>
          <div class="my-account__panel" data-panel="shipping">
            <p style="font-size: 0.8rem; opacity: 0.6; margin-top:20px;">${this.t.no_shipping}</p>
          </div>
        </main>

      </div>
    `;

    this.bindDashboardEvents();
    this.initDobPicker();
    this.setActiveTab(activeTab, false);
  }

  renderOrders(orders) {
    if (!orders.length) {
      return `
        <div class="my-account__empty">
          <p>${this.t.no_orders}</p>
          <a href="/collections/all" class="my-account__shop-btn button">${this.t.start_shopping}</a>
        </div>
      `;
    }

    return `
      <div class="my-account__orders">
        ${orders.map(order => `
          <div class="my-account__order">
            <div class="my-account__order-header">
              <div class="my-account__order-info">
                <span class="my-account__order-name">${this.escapeHtml(order.name)}</span>
                <span class="my-account__order-date">${this.formatDate(order.processedAt)}</span>
              </div>
              <div class="my-account__order-status">
                <span class="my-account__status-badge my-account__status-badge--${(order.financialStatus || '').toLowerCase()}">
                  ${this.translateStatus(order.financialStatus)}
                </span>
                <span class="my-account__status-badge my-account__status-badge--${(order.fulfillmentStatus || 'unfulfilled').toLowerCase()}">
                  ${this.translateFulfillment(order.fulfillmentStatus)}
                </span>
              </div>
            </div>
            <div class="my-account__order-items">
              ${(order.lineItems?.edges || []).map(({ node: item }) => `
                <div class="my-account__order-item">
                  ${item.variant?.image?.url
        ? `<img src="${item.variant.image.url}" alt="${this.escapeHtml(item.title)}" class="my-account__item-image" loading="lazy">`
        : '<div class="my-account__item-image my-account__item-image--placeholder"></div>'
      }
                  <div class="my-account__item-details">
                    <p class="my-account__item-title">${this.escapeHtml(item.title)}</p>
                    ${item.variant?.title && item.variant.title !== 'Default Title'
        ? `<p class="my-account__item-variant">${this.escapeHtml(item.variant.title)}</p>`
        : ''
      }
                    <p class="my-account__item-qty">${this.t.qty}: ${item.quantity}</p>
                  </div>
                  <div class="my-account__item-price">
                    ${this.renderLineItemPrice(item)}
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="my-account__order-total">
              <span>${this.t.total}</span>
              <span class="my-account__order-total-amount">
                ${this.renderOrderTotal(order)}
              </span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderProfile(customer) {
    // Read kana/birthday from registration metafields (namespace: "registration")
    const mfs = customer.metafields || [];
    const last_name_kana = this.escapeHtml(this._getMetafieldValue(mfs, 'registration', 'last_name_kana'));
    const first_name_kana = this.escapeHtml(this._getMetafieldValue(mfs, 'registration', 'first_name_kana'));
    const dob = this.escapeHtml(this._isoToDisplay(this._getMetafieldValue(mfs, 'registration', 'birthday')));

    return `
      <div class="my-account__form-section" data-section="profile">
        <h2 class="my-account__section-heading">${this.t.profile_title}</h2>
        <div class="my-account__form-grid">
          <div class="my-account__form-field">
            <label for="ma-lastName">${this.t.last_name} *</label>
            <input id="ma-lastName" name="lastName" data-field="lastName"
              class="my-account__input" type="text"
              value="${this.escapeHtml(customer.lastName || '')}"
              placeholder="${this.t.last_name}" autocomplete="family-name" />
            <span class="my-account__field-error" data-error-for="lastName" aria-live="polite"></span>
          </div>
          <div class="my-account__form-field">
            <label for="ma-firstName">${this.t.first_name} *</label>
            <input id="ma-firstName" name="firstName" data-field="firstName"
              class="my-account__input" type="text"
              value="${this.escapeHtml(customer.firstName || '')}"
              placeholder="${this.t.first_name}" autocomplete="given-name" />
            <span class="my-account__field-error" data-error-for="firstName" aria-live="polite"></span>
          </div>
          <div class="my-account__form-field">
            <label for="ma-last-name-kana">${this.t.furigana_last} *</label>
            <input id="ma-last-name-kana" name="last_name_kana" data-field="last_name_kana"
              class="my-account__input" type="text"
              value="${last_name_kana}" placeholder="${this.t.furigana_last}" />
            <span class="my-account__field-error" data-error-for="last_name_kana" aria-live="polite"></span>
          </div>
          <div class="my-account__form-field">
            <label for="ma-first-name-kana">${this.t.furigana_first} *</label>
            <input id="ma-first-name-kana" name="first_name_kana" data-field="first_name_kana"
              class="my-account__input" type="text"
              value="${first_name_kana}" placeholder="${this.t.furigana_first}" />
            <span class="my-account__field-error" data-error-for="first_name_kana" aria-live="polite"></span>
          </div>
        </div>

        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label for="ma-dob">${this.t.dob} <span class="my-account__info-icon">?</span></label>
          <div class="my-account__date-input">
             <input id="ma-dob" name="dob" data-field="dob"
               class="my-account__input" type="text"
               value="${dob}" placeholder="YYYY/MM/DD" />
             <span id="ma-dob-toggle" class="my-account__calendar-icon" style="cursor:pointer;">
                <svg style="pointer-events: none;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
             </span>
          </div>
          <span class="my-account__field-error" data-error-for="dob" aria-live="polite"></span>
        </div>

        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label for="ma-phone">${this.t.phone} *</label>
          <input id="ma-phone" name="phone" data-field="phone"
            class="my-account__input" type="tel"
            value="${this.escapeHtml(customer.phone || '')}"
            placeholder="012322222" autocomplete="tel" />
          <span class="my-account__field-error" data-error-for="phone" aria-live="polite"></span>
        </div>

        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label for="ma-email">${this.t.email} *</label>
          <input id="ma-email" name="email" data-field="email"
            class="my-account__input" type="email"
            value="${this.escapeHtml(customer.email || '')}"
            placeholder="your@email.com" autocomplete="email" />
          <span class="my-account__field-error" data-error-for="email" aria-live="polite"></span>
        </div>
        <div class="my-account__form-field my-account__form-field--full mt-16 my-account__form-field--hidden" data-profile-email-verify>
          <label for="ma-profileCurrentPassword">${this.t.current_password} *</label>
          <div class="my-account__password-input">
            <input id="ma-profileCurrentPassword" name="profileCurrentPassword" data-field="profileCurrentPassword"
              class="my-account__input" type="password"
              placeholder="${this.t.current_password}" autocomplete="current-password" />
            <button type="button" class="my-account__password-toggle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
          <span class="my-account__field-error" data-error-for="profileCurrentPassword" aria-live="polite"></span>
        </div>

        <p class="my-account__required-text">${this.t.required}</p>
        <div class="my-account__form-message" data-form-message="profile" role="alert" aria-live="polite"></div>
        <button type="button" class="my-account__submit-btn" data-submit="profile">${this.t.submit}</button>
      </div>

      <div class="my-account__form-section mt-40" data-section="password">
        <h2 class="my-account__section-heading">${this.t.login_info_title}</h2>
        <div class="my-account__form-field my-account__form-field--full">
          <label for="ma-currentPassword">${this.t.password} *</label>
          <div class="my-account__password-input">
            <input id="ma-currentPassword" name="currentPassword" data-field="currentPassword"
              class="my-account__input" type="password"
              placeholder="${this.t.password}" autocomplete="current-password" />
            <button type="button" class="my-account__password-toggle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
          <span class="my-account__field-error" data-error-for="currentPassword" aria-live="polite"></span>
        </div>
        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label for="ma-newPassword">${this.t.new_password} *</label>
          <div class="my-account__password-input">
            <input id="ma-newPassword" name="newPassword" data-field="newPassword"
              class="my-account__input" type="password"
              placeholder="${this.t.new_password}" autocomplete="new-password" />
            <button type="button" class="my-account__password-toggle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
          <span class="my-account__field-error" data-error-for="newPassword" aria-live="polite"></span>
        </div>
        <p class="my-account__password-hint">${this.t.password_hint}</p>
        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label for="ma-confirmPassword">${this.t.password_confirm} *</label>
          <div class="my-account__password-input">
            <input id="ma-confirmPassword" name="confirmPassword" data-field="confirmPassword"
              class="my-account__input" type="password"
              placeholder="${this.t.password}" autocomplete="new-password" />
            <button type="button" class="my-account__password-toggle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
          <span class="my-account__field-error" data-error-for="confirmPassword" aria-live="polite"></span>
        </div>

        <div class="my-account__form-message" data-form-message="password" role="alert" aria-live="polite"></div>
        <button type="button" class="my-account__submit-btn" data-submit="password">${this.t.submit}</button>
      </div>

      <!-- Benefits -->
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

  renderAddresses(addresses, defaultAddress) {
    if (!addresses.length) {
      return `
        <div class="my-account__empty">
          <p>${this.t.no_addresses}</p>
        </div>
      `;
    }

    return `
      <div class="my-account__addresses">
        ${addresses.map(addr => `
          <div class="my-account__address-card ${defaultAddress?.id === addr.id ? 'my-account__address-card--default' : ''}">
            ${defaultAddress?.id === addr.id ? `<span class="my-account__default-badge">${this.t.default_badge}</span>` : ''}
            <p class="my-account__address-name">${this.escapeHtml(addr.lastName || '')} ${this.escapeHtml(addr.firstName || '')}</p>
            <p>${this.escapeHtml(addr.address1 || '')}</p>
            ${addr.address2 ? `<p>${this.escapeHtml(addr.address2)}</p>` : ''}
            <p>${this.escapeHtml(addr.city || '')} ${this.escapeHtml(addr.province || '')} ${this.escapeHtml(addr.zip || '')}</p>
            <p>${this.escapeHtml(addr.country || '')}</p>
            ${addr.phone ? `<p>${this.escapeHtml(addr.phone)}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Form helpers
  // ---------------------------------------------------------------------------

  getProfileFormData() {
    const panel = this.container.querySelector('[data-panel="profile"]');
    const g = (field) => (panel.querySelector(`[data-field="${field}"]`)?.value ?? '').trim();
    return {
      lastName: g('lastName'),
      firstName: g('firstName'),
      last_name_kana: g('last_name_kana'),
      first_name_kana: g('first_name_kana'),
      dob: g('dob'),
      phone: g('phone'),
      email: g('email'),
      profileCurrentPassword: g('profileCurrentPassword'),
    };
  }

  getPasswordFormData() {
    const panel = this.container.querySelector('[data-panel="profile"]');
    const g = (field) => panel.querySelector(`[data-field="${field}"]`)?.value ?? '';
    return {
      currentPassword: g('currentPassword'),
      newPassword: g('newPassword'),
      confirmPassword: g('confirmPassword'),
    };
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  validateProfile(data) {
    const errors = {};
    const kanaRegex = /^[\u30A0-\u30FF\u30FC\s]+$/; // Full-width katakana
    const required = ['lastName', 'firstName', 'last_name_kana', 'first_name_kana', 'phone', 'email'];
    for (const key of required) {
      if (!data[key]) errors[key] = this.t.validation_required;
    }
    if (data.last_name_kana && !errors.last_name_kana) {
      if (!kanaRegex.test(data.last_name_kana)) errors.last_name_kana = this.t.validation_kana_invalid;
    }
    if (data.first_name_kana && !errors.first_name_kana) {
      if (!kanaRegex.test(data.first_name_kana)) errors.first_name_kana = this.t.validation_kana_invalid;
    }
    if (data.email && !errors.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = this.t.validation_email_invalid;
      }
    }
    if (data.phone && !errors.phone) {
      const raw = data.phone;
      if (!/^[0-9+()\-\s]+$/.test(raw)) {
        errors.phone = this.t.validation_phone_invalid;
      } else {
        const digits = raw.replace(/\D/g, '');
        if (digits.length < 8 || digits.length > 15) {
          errors.phone = this.t.validation_phone_invalid;
        } else {
          let e164 = raw.startsWith('+') ? `+${digits}` : `+81${digits.startsWith('0') ? digits.slice(1) : digits}`;
          const digitsOnly = e164.replace('+', '');
          if (digitsOnly.startsWith('81')) {
            const localLen = digitsOnly.length - 2;
            if (localLen !== 9 && localLen !== 10) errors.phone = this.t.validation_phone_invalid;
          } else if (digitsOnly.startsWith('84')) {
            const localPart = digitsOnly.slice(2);
            if (!/^[235789]\d{8,9}$/.test(localPart)) errors.phone = this.t.validation_phone_invalid;
          }
        }
      }
    }
    if (data.dob) {
      if (!/^\d{4}\/\d{2}\/\d{2}$/.test(data.dob)) {
        errors.dob = this.t.validation_dob_invalid;
      } else {
        const [y, m, d] = data.dob.split('/').map(Number);
        const date = new Date(y, m - 1, d);
        const valid = date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
        if (!valid || date > new Date()) errors.dob = this.t.validation_dob_invalid;
      }
    }
    return errors;
  }

  validatePassword(data) {
    const errors = {};
    const any = data.currentPassword || data.newPassword || data.confirmPassword;
    if (!any) return errors; // all empty = no change requested
    if (!data.currentPassword) errors.currentPassword = this.t.validation_required;
    if (!data.newPassword) {
      errors.newPassword = this.t.validation_required;
    } else {
      const strong = data.newPassword.length >= 8
        && /[a-zA-Z]/.test(data.newPassword)
        && /\d/.test(data.newPassword)
        && /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/.test(data.newPassword);
      if (!strong) errors.newPassword = this.t.validation_password_weak;
    }
    if (!data.confirmPassword) {
      errors.confirmPassword = this.t.validation_required;
    } else if (data.newPassword && data.confirmPassword !== data.newPassword) {
      errors.confirmPassword = this.t.validation_password_mismatch;
    }
    return errors;
  }

  // ---------------------------------------------------------------------------
  // UI error helpers
  // ---------------------------------------------------------------------------

  renderFieldError(fieldName, message) {
    const panel = this.container.querySelector('[data-panel="profile"]');
    const input = panel?.querySelector(`[data-field="${fieldName}"]`);
    const errorEl = panel?.querySelector(`[data-error-for="${fieldName}"]`);
    if (input) {
      input.classList.add('my-account__input--error');
      input.setAttribute('aria-invalid', 'true');
    }
    if (errorEl) errorEl.textContent = message;
  }

  clearFieldError(fieldName) {
    const panel = this.container.querySelector('[data-panel="profile"]');
    const input = panel?.querySelector(`[data-field="${fieldName}"]`);
    const errorEl = panel?.querySelector(`[data-error-for="${fieldName}"]`);
    if (input) {
      input.classList.remove('my-account__input--error');
      input.removeAttribute('aria-invalid');
    }
    if (errorEl) errorEl.textContent = '';
  }

  setFormMessage(type, message, section) {
    const msgEl = this.container.querySelector(`[data-form-message="${section}"]`);
    if (!msgEl) return;
    msgEl.textContent = message;
    msgEl.className = type
      ? `my-account__form-message my-account__form-message--${type}`
      : 'my-account__form-message';
    if (type === 'success') {
      setTimeout(() => {
        if (msgEl.textContent === message) {
          msgEl.textContent = '';
          msgEl.className = 'my-account__form-message';
        }
      }, 6000);
    }
  }

  setSubmitLoading(section, loading) {
    const btn = this.container.querySelector(`[data-submit="${section}"]`);
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.dataset.originalText = btn.textContent;
      btn.textContent = this.t.saving;
      btn.classList.add('my-account__submit-btn--loading');
    } else {
      btn.textContent = btn.dataset.originalText || this.t.submit;
      delete btn.dataset.originalText;
      btn.classList.remove('my-account__submit-btn--loading');
    }
  }

  // ---------------------------------------------------------------------------
  // Submit — Profile
  // ---------------------------------------------------------------------------

  async submitProfileUpdate() {
    if (this._profileSubmitting) return;
    this._profileSubmitting = true;
    this.setSubmitLoading('profile', true);
    this.setFormMessage('', '', 'profile');

    const profileFields = ['lastName', 'firstName', 'last_name_kana', 'first_name_kana', 'dob', 'phone', 'email', 'profileCurrentPassword'];
    profileFields.forEach(f => this.clearFieldError(f));

    const data = this.getProfileFormData();
    const errors = this.validateProfile(data);
    const emailChanged = this.hasEmailChanged(data.email);
    const sfToken = localStorage.getItem('shopifyCustomerAccessToken');

    // Require current password for email change to verify authority via backend
    if (emailChanged && !data.profileCurrentPassword) {
      errors.profileCurrentPassword = this.t.validation_current_password_required_for_email;
    }

    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([f, msg]) => this.renderFieldError(f, msg));
      this.setSubmitLoading('profile', false);
      this._profileSubmitting = false;
      return;
    }

    try {
      await this._updateProfileViaBackend(data);
    } catch (err) {
      console.error('[MyAccount] Profile update error:', err);
      if (err.isPasswordError || err.status === 401) {
        this.renderFieldError('profileCurrentPassword', this.t.validation_current_password_invalid);
        this.setFormMessage('error', this.t.validation_current_password_invalid, 'profile');
      } else {
        this.setFormMessage('error', err.message || this.t.save_failed, 'profile');
      }
    } finally {
      this.setSubmitLoading('profile', false);
      this._profileSubmitting = false;
    }
  }

  hasEmailChanged(nextEmail) {
    const currentEmail = (this.currentCustomer?.email || '').trim().toLowerCase();
    return currentEmail && currentEmail !== (nextEmail || '').trim().toLowerCase();
  }

  updateEmailVerificationVisibility() {
    const panel = this.container.querySelector('[data-panel="profile"]');
    if (!panel) return;

    const verifyField = panel.querySelector('[data-profile-email-verify]');
    if (!verifyField) return;

    const data = this.getProfileFormData();
    const changed = this.hasEmailChanged(data.email);

    verifyField.classList.toggle('my-account__form-field--hidden', !changed);
    if (!changed) {
      const input = panel.querySelector('[data-field="profileCurrentPassword"]');
      if (input) input.value = '';
      this.clearFieldError('profileCurrentPassword');
    }
  }
  async _verifyPasswordViaStorefront(password) {
    const email = this.currentCustomer?.email;
    if (!email) throw new Error('No customer email available for verification.');

    const mutation = `
      mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
        customerAccessTokenCreate(input: $input) {
          customerAccessToken { accessToken }
          customerUserErrors { field message code }
        }
      }
    `;

    let json;
    try {
      json = await this.storefrontRequest(mutation, { input: { email, password } });
    } catch (err) {
      console.error('[MyAccount] Storefront verify password request failed:', err);
      const pwdErr = new Error(this.t.validation_current_password_invalid);
      pwdErr.status = 401;
      pwdErr.isPasswordError = true;
      throw pwdErr;
    }

    const result = json?.data?.customerAccessTokenCreate;
    const userErrors = result?.customerUserErrors || [];
    const accessToken = result?.customerAccessToken?.accessToken;

    if (userErrors.length > 0 || !accessToken) {
      const pwdErr = new Error(this.t.validation_current_password_invalid);
      pwdErr.status = 401;
      pwdErr.isPasswordError = true;
      throw pwdErr;
    }

    return accessToken;
  }

  async _updateProfileViaBackend(data) {
    if (!this.accountApiBase) {
      console.error('[MyAccount] Backend API base URL not configured.');
      throw new Error('API not configured');
    }

    const emailChanged = this.hasEmailChanged(data.email);

    // Step 1: If email is being changed, verify current password via Storefront API first
    if (emailChanged && data.profileCurrentPassword) {
      await this._verifyPasswordViaStorefront(data.profileCurrentPassword);
      // throws if wrong — caught by caller
    }

    // Step 2: Call the actual update API
    // Get current Storefront access token (may have been refreshed during verify)
    const sfToken = localStorage.getItem('shopifyCustomerAccessToken') || '';

    const payload = {
      customer_access_token: sfToken,
      first_name: data.firstName,
      last_name: data.lastName,
      first_name_kana: data.first_name_kana,
      last_name_kana: data.last_name_kana,
      email: data.email,
      phone: data.phone,
      birthday: data.dob ? this._displayToIso(data.dob) : '',
      current_password: data.profileCurrentPassword || '',
    };

    const result = await this.accountApiRequest('api/customers/account/update-profile', payload);

    // Update local state with returned customer data if available
    if (result.customer) {
      this.currentCustomer = { ...this.currentCustomer, ...result.customer };
      if (!this.nativeSession) {
        localStorage.setItem('shopifyCustomer', JSON.stringify(this.currentCustomer));
      }
    }

    this.setFormMessage('success', this.t.save_success, 'profile');
    this.updateEmailVerificationVisibility();
  }

  async _updatePasswordViaBackend(data) {
    if (!this.accountApiBase) {
      console.error('[MyAccount] Backend API base URL not configured.');
      throw new Error('API not configured');
    }

    // Step 1: Verify current password via Storefront API first
    const verifiedToken = await this._verifyPasswordViaStorefront(data.currentPassword);
    // throws if wrong — caught by caller

    // Step 2: Current password verified — call the actual password update API
    await this.accountApiRequest('api/customers/account/update-password', {
      customer_access_token: verifiedToken,
      current_password: data.currentPassword,
      new_password: data.newPassword,
    });

    this.setFormMessage('success', this.t.save_success, 'password');

    // Clear password fields
    const passwordPanel = this.container.querySelector('[data-panel="password"]');
    const profilePanel = this.container.querySelector('[data-panel="profile"]');
    const panel = passwordPanel || profilePanel;
    ['currentPassword', 'newPassword', 'confirmPassword'].forEach(f => {
      const input = panel?.querySelector(`[data-field="${f}"]`);
      if (input) input.value = '';
    });
  }


  async accountApiRequest(path, payload) {
    if (!this.accountApiBase) {
      console.error('[MyAccount] accountApiBase is not set. Please configure be_api_base_url in Theme Settings.');
      throw new Error('Backend API URL is not configured.');
    }

    const url = `${this.accountApiBase}/${path}`;
    console.log('[MyAccount] API request:', url, payload);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      const err = new Error(json?.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.code = json?.code;
      throw err;
    }
    return json.data || {};
  }

  _upsertMetafieldState(namespace, key, value, type) {
    const metafields = Array.isArray(this.currentCustomer?.metafields)
      ? [...this.currentCustomer.metafields]
      : [];
    const idx = metafields.findIndex((m) => m?.namespace === namespace && m?.key === key);
    const next = { namespace, key, value, type };
    if (idx >= 0) metafields[idx] = next;
    else metafields.push(next);
    this.currentCustomer.metafields = metafields;
  }

  _applyProfileToState(data) {
    this.currentCustomer = this.currentCustomer || {};
    this.currentCustomer.firstName = data.firstName;
    this.currentCustomer.lastName = data.lastName;
    this.currentCustomer.phone = data.phone;
    this.currentCustomer.email = data.email;
    if (data.last_name_kana !== undefined) {
      this._upsertMetafieldState('registration', 'last_name_kana', data.last_name_kana, 'single_line_text_field');
    }
    if (data.first_name_kana !== undefined) {
      this._upsertMetafieldState('registration', 'first_name_kana', data.first_name_kana, 'single_line_text_field');
    }
    if (data.dob) {
      this._upsertMetafieldState('registration', 'birthday', this._displayToIso(data.dob), 'date');
    }
    localStorage.setItem('shopifyCustomer', JSON.stringify(this.currentCustomer));
  }

  async _updateProfileViaStorefront(sfToken, data) {
    const emailChanged = this.hasEmailChanged(data.email);

    // Step 1: if email is being changed, verify current password first
    if (emailChanged) {
      if (!data.profileCurrentPassword) {
        this.renderFieldError('profileCurrentPassword', this.t.validation_current_password_required_for_email);
        this.setFormMessage('error', this.t.validation_current_password_required_for_email, 'profile');
        return;
      }

      const verifyMutation = `
        mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
          customerAccessTokenCreate(input: $input) {
            customerAccessToken { accessToken expiresAt }
            customerUserErrors { field message code }
          }
        }
      `;
      let verifyJson;
      try {
        verifyJson = await this.storefrontRequest(verifyMutation, {
          input: { email: this.currentCustomer.email, password: data.profileCurrentPassword },
        });
      } catch (err) {
        console.error('[MyAccount] Password verify failed:', err);
        this.setFormMessage('error', this.t.save_failed, 'profile');
        return;
      }

      const verifyResult = verifyJson.data?.customerAccessTokenCreate;
      const verifyErrors = verifyResult?.customerUserErrors || [];
      const verifiedToken = verifyResult?.customerAccessToken?.accessToken;

      if (verifyErrors.length > 0 || !verifiedToken) {
        this.renderFieldError('profileCurrentPassword', this.t.validation_current_password_invalid);
        this.setFormMessage('error', this.t.validation_current_password_invalid, 'profile');
        return; // hard stop — wrong password
      }

      // Use the fresh verified token for the update call
      sfToken = verifiedToken;

      // Persist the new token to localStorage as well
      const verifiedExpiry = verifyResult?.customerAccessToken?.expiresAt;
      if (verifiedExpiry) {
        localStorage.setItem('shopifyCustomerAccessToken', verifiedToken);
        localStorage.setItem('shopifyCustomerAccessTokenExpiresAt', verifiedExpiry);
      }
    }

    // Step 2: update profile
    const mutation = `
      mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
        customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
          customer { firstName lastName email phone }
          customerAccessToken { accessToken expiresAt }
          customerUserErrors { field message code }
        }
      }
    `;

    const customerInput = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
    };
    if (data.phone) customerInput.phone = data.phone;

    let json;
    try {
      json = await this.storefrontRequest(mutation, {
        customerAccessToken: sfToken,
        customer: customerInput,
      });
    } catch (err) {
      console.error('[MyAccount] Storefront customerUpdate failed:', err);
      this.setFormMessage('error', this.t.save_failed, 'profile');
      return;
    }

    const result = json.data?.customerUpdate;
    const userErrors = result?.customerUserErrors || [];
    if (userErrors.length) {
      const accessDenied = userErrors.find(e => e.message?.toLowerCase().includes('access denied'));
      const emailErr = userErrors.find(e => e.field?.includes('email') || e.code === 'TAKEN');
      const phoneErr = userErrors.find(e => e.field?.includes('phone'));
      if (accessDenied) {
        this.setFormMessage('error', this.t.save_failed, 'profile');
        console.error('[MyAccount] customerUpdate access denied — enable unauthenticated_write_customers scope on your Storefront API token in Shopify Admin.');
        return;
      }
      if (emailErr) this.renderFieldError('email', this.t.validation_email_taken || emailErr.message);
      if (phoneErr) this.renderFieldError('phone', phoneErr.message);
      this.setFormMessage('error', userErrors[0].message || this.t.save_failed, 'profile');
      return;
    }

    // Persist renewed access token if email was changed
    const newToken = result?.customerAccessToken;
    if (newToken?.accessToken) {
      localStorage.setItem('shopifyCustomerAccessToken', newToken.accessToken);
      localStorage.setItem('shopifyCustomerAccessTokenExpiresAt', newToken.expiresAt);
    }

    // Update metafields (kana, birthday) via Customer Account API
    try { await this._updateMetafields(data); } catch (e) { console.warn('[MyAccount] Metafield update failed:', e); }

    this._applyProfileToState(data);
    const profilePwd = this.container.querySelector('[data-field="profileCurrentPassword"]');
    if (profilePwd) profilePwd.value = '';
    this.updateEmailVerificationVisibility();
    this.setFormMessage('success', this.t.save_success, 'profile');
  }

  _getNativeCSRFToken() {
    return document.querySelector('#ma-native-form [name="authenticity_token"]')?.value || '';
  }

  async _updateProfileNative(data) {
    // POST to Shopify's native account endpoint (used when customer is in a native session)
    const formData = new URLSearchParams();
    formData.append('form_type', 'customer');
    formData.append('utf8', '✓');
    formData.append('customer[first_name]', data.firstName);
    formData.append('customer[last_name]', data.lastName);
    formData.append('customer[email]', data.email);
    if (data.phone) formData.append('customer[phone]', data.phone);
    const csrfToken = this._getNativeCSRFToken();
    if (csrfToken) formData.append('authenticity_token', csrfToken);

    const res = await fetch('/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
      credentials: 'same-origin',
    });
    // Shopify redirects (302) on success; fetch follows it and gives 200
    if (res.ok || res.redirected) {
      try { await this._updateMetafields(data); } catch (e) { console.warn('[MyAccount] Metafield update failed:', e); }
      this.setFormMessage('success', this.t.save_success, 'profile');
    } else {
      this.setFormMessage('error', this.t.save_failed, 'profile');
    }
  }

  /**
   * Write kana + birthday metafields via the Customer Account API.
   * Requires dp_ca_token (OAuth PKCE token) in sessionStorage.
   * The Storefront API customerUpdate mutation does NOT support metafields.
   */
  async _updateMetafields(data) {
    const metafieldsInput = [];
    if (data.last_name_kana) metafieldsInput.push({ namespace: 'registration', key: 'last_name_kana', value: data.last_name_kana, type: 'single_line_text_field' });
    if (data.first_name_kana) metafieldsInput.push({ namespace: 'registration', key: 'first_name_kana', value: data.first_name_kana, type: 'single_line_text_field' });
    if (data.dob) metafieldsInput.push({ namespace: 'registration', key: 'birthday', value: this._displayToIso(data.dob), type: 'date' });
    if (!metafieldsInput.length) return;

    const caToken = sessionStorage.getItem('dp_ca_token');
    if (!caToken) {
      console.warn('[MyAccount] No Customer Account API token (dp_ca_token) — metafields not updated.');
      return;
    }

    const mutation = `
      mutation customerMetafieldsSet($metafields: [CustomerMetafieldsSetInput!]!) {
        customerMetafieldsSet(metafields: $metafields) {
          metafields { namespace key value }
          userErrors { field message code }
        }
      }
    `;
    const res = await fetch('https://shopify.com/account/customer/api/2024-10/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': caToken },
      body: JSON.stringify({ query: mutation, variables: { metafields: metafieldsInput } }),
    });
    if (!res.ok) throw new Error(`Customer Account API HTTP ${res.status}`);
    const json = await res.json();
    if (json.errors?.length) throw new Error(json.errors[0]?.message || 'GraphQL error');
    const userErrors = json.data?.customerMetafieldsSet?.userErrors || [];
    if (userErrors.length) throw new Error(userErrors[0]?.message || 'Metafield error');
  }

  // ---------------------------------------------------------------------------
  // Submit — Password
  // ---------------------------------------------------------------------------

  async submitPasswordUpdate() {
    if (this._passwordSubmitting) return;
    this._passwordSubmitting = true;
    this.setSubmitLoading('password', true);
    this.setFormMessage('', '', 'password');

    ['currentPassword', 'newPassword', 'confirmPassword'].forEach(f => this.clearFieldError(f));

    const data = this.getPasswordFormData();
    const any = data.currentPassword || data.newPassword || data.confirmPassword;
    if (!any) {
      // Nothing entered — no-op
      this.setSubmitLoading('password', false);
      this._passwordSubmitting = false;
      return;
    }

    const errors = this.validatePassword(data);
    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([f, msg]) => this.renderFieldError(f, msg));
      this.setSubmitLoading('password', false);
      this._passwordSubmitting = false;
      return;
    }

    try {
      await this._updatePasswordViaBackend(data);
    } catch (err) {
      console.error('[MyAccount] Password update error:', err);
      if (err.isPasswordError || err.status === 401) {
        this.renderFieldError('currentPassword', this.t.validation_current_password_invalid);
        this.setFormMessage('error', this.t.validation_current_password_invalid, 'password');
      } else {
        this.setFormMessage('error', err.message || this.t.save_failed, 'password');
      }
    } finally {
      this.setSubmitLoading('password', false);
      this._passwordSubmitting = false;
    }
  }

  async _updatePasswordViaStorefront(sfToken, data) {
    const email = this.currentCustomer?.email;

    // Step 1: verify current password by attempting a new access token
    const verifyMutation = `
      mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
        customerAccessTokenCreate(input: $input) {
          customerAccessToken { accessToken }
          customerUserErrors { field message code }
        }
      }
    `;
    let verifyJson;
    try {
      verifyJson = await this.storefrontRequest(verifyMutation, {
        input: { email, password: data.currentPassword },
      });
    } catch (err) {
      console.error('[MyAccount] Password verify failed:', err);
      this.setFormMessage('error', this.t.save_failed, 'password');
      return;
    }

    const verifyResult = verifyJson.data?.customerAccessTokenCreate;
    const verifyErrors = verifyResult?.customerUserErrors || [];
    const verifiedToken = verifyResult?.customerAccessToken?.accessToken;

    if (verifyErrors.length > 0 || !verifiedToken) {
      this.renderFieldError('currentPassword', this.t.validation_current_password_invalid);
      this.setFormMessage('error', this.t.validation_current_password_invalid, 'password');
      return; // ← hard stop: wrong password, do NOT proceed
    }

    // Step 2: update password (only reached if current password verified successfully)
    // Use the fresh verifiedToken from step 1 — the stored sfToken may have expired
    const updateMutation = `
      mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
        customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
          customerAccessToken { accessToken expiresAt }
          customerUserErrors { field message code }
        }
      }
    `;
    let updateJson;
    try {
      updateJson = await this.storefrontRequest(updateMutation, {
        customerAccessToken: verifiedToken,
        customer: { password: data.newPassword },
      });
    } catch (err) {
      console.error('[MyAccount] Password update failed:', err);
      this.setFormMessage('error', this.t.save_failed, 'password');
      return;
    }

    const updateResult = updateJson.data?.customerUpdate;
    const userErrors = updateResult?.customerUserErrors || [];
    if (userErrors.length) {
      const pwdErr = userErrors.find(e => e.field?.includes('password'));
      if (pwdErr) this.renderFieldError('newPassword', this.t.validation_password_weak || pwdErr.message);
      this.setFormMessage('error', userErrors[0].message || this.t.save_failed, 'password');
      return;
    }

    // Persist renewed access token
    const newToken = updateResult?.customerAccessToken;
    if (newToken?.accessToken) {
      localStorage.setItem('shopifyCustomerAccessToken', newToken.accessToken);
      localStorage.setItem('shopifyCustomerAccessTokenExpiresAt', newToken.expiresAt);
    }

    ['currentPassword', 'newPassword', 'confirmPassword'].forEach(f => {
      const el = this.container.querySelector(`[data-field="${f}"]`);
      if (el) el.value = '';
    });
    this.setFormMessage('success', this.t.save_success, 'password');
  }

  async _updatePasswordNative(data) {
    const formData = new URLSearchParams();
    formData.append('form_type', 'customer');
    formData.append('utf8', '✓');
    formData.append('customer[password]', data.newPassword);
    formData.append('customer[password_confirmation]', data.confirmPassword);
    const csrfToken = this._getNativeCSRFToken();
    if (csrfToken) formData.append('authenticity_token', csrfToken);

    const res = await fetch('/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
      credentials: 'same-origin',
    });
    if (res.ok || res.redirected) {
      ['currentPassword', 'newPassword', 'confirmPassword'].forEach(f => {
        const el = this.container.querySelector(`[data-field="${f}"]`);
        if (el) el.value = '';
      });
      this.setFormMessage('success', this.t.save_success, 'password');
    } else {
      this.setFormMessage('error', this.t.save_failed, 'password');
    }
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  initDobPicker() {
    // Reset so it can be re-initialised on each renderDashboard call
    if (this._dobPicker) {
      this._dobPicker.destroy();
      this._dobPicker = null;
    }

    const input = document.getElementById('ma-dob');
    const toggle = document.getElementById('ma-dob-toggle');
    if (!input) return;

    const doInit = () => {
      const locale =
        typeof flatpickr !== 'undefined' &&
          typeof flatpickr.l10ns !== 'undefined' &&
          flatpickr.l10ns.ja
          ? flatpickr.l10ns.ja
          : 'default';

      const fp = flatpickr(input, {
        dateFormat: 'Y/m/d',
        allowInput: true,
        disableMobile: false,
        locale,
        maxDate: 'today',
        minDate: '1900-01-01',
        appendTo: document.body,
        onReady(_d, _s, instance) {
          instance.input.removeAttribute('readonly');
        },
        onChange(_selectedDates, _dateStr, _instance) {
          input.dispatchEvent(new Event('input', { bubbles: true }));
        },
      });

      if (toggle) {
        toggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          fp.open();
        });
      }

      // Also open when clicking the input itself
      input.addEventListener('click', () => {
        fp.open();
      });

      this._dobPicker = fp;
    };

    if (typeof flatpickr !== 'undefined') {
      doInit();
    } else {
      const interval = setInterval(() => {
        if (typeof flatpickr !== 'undefined') {
          clearInterval(interval);
          doInit();
        }
      }, 50);
    }
  }

  bindDashboardEvents() {
    // Password toggles
    this.container.querySelectorAll('.my-account__password-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.previousElementSibling;
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btn.innerHTML = isPass
          ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'
          : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      });
    });

    // Tab switching
    this.container.querySelectorAll('.my-account__nav-item').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        this.setActiveTab(target, true);
      });
    });

    this._handleHashChange = () => {
      const tab = this.getTabFromHash();
      if (tab) this.setActiveTab(tab, false);
    };
    window.addEventListener('hashchange', this._handleHashChange);

    // Profile submit
    this.container.querySelector('[data-submit="profile"]')?.addEventListener('click', () => {
      this.submitProfileUpdate();
    });

    // Password submit
    this.container.querySelector('[data-submit="password"]')?.addEventListener('click', () => {
      this.submitPasswordUpdate();
    });

    // Real-time validation: clear error when user corrects a field
    this.container.querySelectorAll('[data-field]').forEach(input => {
      input.addEventListener('input', () => {
        this.clearFieldError(input.dataset.field);
      });
    });
    this.container.querySelector('[data-field="email"]')?.addEventListener('input', () => {
      this.updateEmailVerificationVisibility();
    });
    this.updateEmailVerificationVisibility();

    // Logout
    document.getElementById('my-account-logout')?.addEventListener('click', () => {
      if (this.nativeSession) {
        // Native Shopify session — clear localStorage and redirect to Shopify logout
        localStorage.removeItem('shopifyCustomerAccessToken');
        localStorage.removeItem('shopifyCustomerAccessTokenExpiresAt');
        localStorage.removeItem('shopifyCustomer');
        window.location.href = this.logoutUrl;
      } else {
        logoutCustomer();
      }
    });
  }

  resolveInitialTab() {
    return this.getTabFromHash() || this.getTabFromSearchParam() || 'profile';
  }

  getTabFromHash() {
    const raw = (window.location.hash || '').replace(/^#/, '').trim();
    return this.isValidTab(raw) ? raw : '';
  }

  getTabFromSearchParam() {
    const tab = new URLSearchParams(window.location.search).get('tab');
    return this.isValidTab(tab) ? tab : '';
  }

  isValidTab(tab) {
    return ['profile', 'orders', 'addresses', 'cards', 'shipping'].includes(tab);
  }

  setActiveTab(tab, updateHash) {
    const safeTab = this.isValidTab(tab) ? tab : 'profile';
    this.container.querySelectorAll('.my-account__nav-item').forEach((t) => {
      t.classList.toggle('my-account__nav-item--active', t.dataset.tab === safeTab);
    });
    this.container.querySelectorAll('.my-account__panel').forEach((p) => {
      p.classList.toggle('my-account__panel--active', p.dataset.panel === safeTab);
    });

    if (updateHash) {
      const nextHash = safeTab === 'profile' ? '' : `#${safeTab}`;
      if (window.location.hash !== nextHash) {
        if (nextHash) {
          window.location.hash = nextHash;
        } else {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }
  }

  getOrderTotal(order) {
    return order?.totalPrice || order?.totalPriceV2 || null;
  }

  getLineItemPrice(item) {
    return item?.variant?.price || item?.originalTotalPrice || null;
  }

  renderOrderTotal(order) {
    const total = this.getOrderTotal(order);
    return total ? this.formatMoney(total.amount, total.currencyCode) : '';
  }

  renderLineItemPrice(item) {
    const price = this.getLineItemPrice(item);
    return price ? this.formatMoney(price.amount, price.currencyCode) : '';
  }

  // ---------------------------------------------------------------------------
  // Metafield helpers
  // ---------------------------------------------------------------------------

  /**
   * Find a metafield value from an array of { namespace, key, value, type } objects.
   * Works for both native (liquid JSON) and Storefront API responses.
   */
  _getMetafieldValue(metafields, namespace, key) {
    if (!Array.isArray(metafields)) return '';
    return metafields.find(m => m.namespace === namespace && m.key === key)?.value || '';
  }

  /** Convert ISO date "YYYY-MM-DD" → display "YYYY/MM/DD" */
  _isoToDisplay(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || '';
    return iso.replace(/-/g, '/');
  }

  /** Convert display date "YYYY/MM/DD" → ISO "YYYY-MM-DD" */
  _displayToIso(display) {
    if (!display || !/^\d{4}\/\d{2}\/\d{2}$/.test(display)) return display || '';
    return display.replace(/\//g, '-');
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }

  formatMoney(amount, currency) {
    const num = parseFloat(amount);
    if (isNaN(num)) return '';
    if (currency === 'JPY') return `¥${Math.round(num).toLocaleString()}`;
    return `${currency} ${num.toFixed(2)}`;
  }

  translateStatus(status) {
    const map = {
      PAID: '支払い済み',
      PENDING: '保留中',
      REFUNDED: '返金済み',
      PARTIALLY_REFUNDED: '一部返金',
      VOIDED: '無効',
      AUTHORIZED: '承認済み',
    };
    return map[status] || status || '—';
  }

  translateFulfillment(status) {
    const map = {
      FULFILLED: '発送済み',
      PARTIAL: '一部発送',
      UNFULFILLED: '未発送',
      RESTOCKED: '再入荷',
    };
    return map[status] || status || '未発送';
  }
}

// ---------------------------------------------------------------------------
// Logout helper — clears session and reloads
// ---------------------------------------------------------------------------
function logoutCustomer() {
  localStorage.removeItem('shopifyCustomerAccessToken');
  localStorage.removeItem('shopifyCustomerAccessTokenExpiresAt');
  localStorage.removeItem('shopifyCustomer');
  window.location.href = '/';
}

// ---------------------------------------------------------------------------
// Header UI update — show dropdown with My Account + Logout when logged in
// ---------------------------------------------------------------------------
function updateHeaderAccountState() {
  const sfToken = localStorage.getItem('shopifyCustomerAccessToken');
  const sfExpires = localStorage.getItem('shopifyCustomerAccessTokenExpiresAt');
  const isLoggedIn = sfToken && sfExpires && new Date(sfExpires) > new Date();

  const accountBtn = document.querySelector('.account-button');
  if (!accountBtn) return;

  // Avoid double-init
  if (accountBtn.dataset.accountInitialized) return;
  accountBtn.dataset.accountInitialized = 'true';

  if (!isLoggedIn) return;

  // Inject dropdown styles once
  if (!document.getElementById('account-dropdown-styles')) {
    const style = document.createElement('style');
    style.id = 'account-dropdown-styles';
    style.textContent = `
      .account-button { position: relative; }
      .account-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 160px;
        background: var(--color-background);
        border: 1px solid var(--color-border, #e0e0e0);
        box-shadow: 0 8px 24px rgba(0,0,0,0.10);
        z-index: 1100;
        display: none;
        flex-direction: column;
      }
      .account-dropdown.is-open { display: flex; }
      .account-dropdown__item {
        display: block;
        padding: 12px 16px;
        font-size: 0.78rem;
        letter-spacing: 0.04em;
        color: var(--color-foreground);
        text-decoration: none;
        background: none;
        border: none;
        text-align: left;
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.15s;
      }
      .account-dropdown__item:hover { background: rgba(0,0,0,0.04); }
      .account-dropdown__item + .account-dropdown__item {
        border-top: 1px solid var(--color-border, #e0e0e0);
      }
    `;
    document.head.appendChild(style);
  }

  // Replace modal trigger button with a toggle button
  const existing = accountBtn.querySelector('[data-open-account-modal]');
  if (existing) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = existing.className;
    toggle.setAttribute('aria-label', existing.getAttribute('aria-label') || 'Account');
    toggle.setAttribute('aria-haspopup', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = existing.innerHTML;
    existing.replaceWith(toggle);

    // Build dropdown
    const t = window.headerTranslations || { myAccount: 'マイアカウント', logout: 'ログアウト' };
    const dropdown = document.createElement('div');
    dropdown.className = 'account-dropdown';
    dropdown.setAttribute('role', 'menu');
    dropdown.innerHTML = `
      <a href="/pages/my-account" class="account-dropdown__item" role="menuitem">${t.myAccount}</a>
      <button type="button" class="account-dropdown__item" id="header-logout-btn" role="menuitem">${t.logout}</button>
    `;
    accountBtn.appendChild(dropdown);

    // Toggle open/close
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Logout button — clears all session types
    dropdown.querySelector('#header-logout-btn')?.addEventListener('click', () => {
      logoutCustomer();
    });

    // Close when clicking outside
    document.addEventListener('click', () => {
      dropdown.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dropdown.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

// Init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new MyAccountPage();
    updateHeaderAccountState();
  });
} else {
  new MyAccountPage();
  updateHeaderAccountState();
}
