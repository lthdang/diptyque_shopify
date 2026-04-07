/**
 * Custom Account Page
 * Supports three auth modes (in priority order):
 *  1. Native Shopify session  – customer logged in via Shopify Liquid ({% if customer %})
 *  2. PKCE / Customer Account API – sessionStorage(dp_ca_token) from OAuth flow
 *  3. Storefront API token  – localStorage(shopifyCustomerAccessToken) from register auto-login
 */

class MyAccountPage {
  constructor() {
    this.container = document.getElementById('my-account-app');
    if (!this.container) return;

    this.storefrontEndpoint = this.container.dataset.storefrontEndpoint || '';
    this.storefrontToken = this.container.dataset.storefrontToken || '';
    this.shopId = this.container.dataset.shopId || '';
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
      no_shipping: '設定がありません。'
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

    // 2. Check Customer Account API token (OAuth PKCE flow)
    const caToken = this.loadCaToken();
    if (caToken) {
      try {
        this.showLoading();
        const customer = await this.fetchCustomerAccountData(caToken);
        if (customer) {
          this.caSession = true;
          this.renderDashboard(customer);
          return;
        }
      } catch (err) {
        console.warn('[MyAccount] CA token fetch failed:', err);
        this.clearCaToken();
      }
    }

    // 3. Fall back to Storefront API token in localStorage
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

  // ---------------------------------------------------------------------------
  // Customer Account API (OAuth PKCE) helpers
  // ---------------------------------------------------------------------------

  loadCaToken() {
    const token = sessionStorage.getItem('dp_ca_token');
    const exp   = parseInt(sessionStorage.getItem('dp_ca_token_exp') || '0', 10);
    if (!token) return null;
    if (exp && Date.now() > exp) {
      this.clearCaToken();
      return null;
    }
    return token;
  }

  clearCaToken() {
    sessionStorage.removeItem('dp_ca_token');
    sessionStorage.removeItem('dp_ca_token_exp');
  }

  async fetchCustomerAccountData(token) {
    const query = `
      query {
        customer {
          id
          firstName
          lastName
          emailAddress { emailAddress }
          phoneNumber { phoneNumber }
          orders(first: 20) {
            edges {
              node {
                id
                name
                processedAt
                financialStatus
                fulfillmentStatus
                totalPrice { amount currencyCode }
                lineItems(first: 5) {
                  edges {
                    node {
                      title
                      quantity
                      price { amount currencyCode }
                    }
                  }
                }
              }
            }
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
                phoneNumber
              }
            }
          }
          defaultAddress {
            id
          }
        }
      }
    `;

    const res = await fetch('https://shopify.com/account/customer/api/2024-04/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      throw new Error(`Customer Account API HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json.errors?.length) {
      throw new Error(json.errors[0]?.message || 'GraphQL error');
    }

    const c = json.data?.customer;
    if (!c) return null;

    // Normalise to same shape as Storefront API customer object
    return {
      id:               c.id,
      firstName:        c.firstName || '',
      lastName:         c.lastName  || '',
      email:            c.emailAddress?.emailAddress || '',
      phone:            c.phoneNumber?.phoneNumber || '',
      acceptsMarketing: false,
      defaultAddress:   c.defaultAddress ? { id: c.defaultAddress.id } : null,
      orders: {
        edges: (c.orders?.edges || []).map(({ node: o }) => ({
          node: {
            id:               o.id,
            name:             o.name,
            processedAt:      o.processedAt,
            financialStatus:  o.financialStatus,
            fulfillmentStatus: o.fulfillmentStatus,
            totalPriceV2:    { amount: o.totalPrice?.amount, currencyCode: o.totalPrice?.currencyCode },
            lineItems: {
              edges: (o.lineItems?.edges || []).map(({ node: li }) => ({
                node: {
                  title:    li.title,
                  quantity: li.quantity,
                  originalTotalPrice: { amount: li.price?.amount, currencyCode: li.price?.currencyCode },
                }
              }))
            }
          }
        }))
      },
      addresses: {
        edges: (c.addresses?.edges || []).map(({ node: a }) => ({
          node: {
            id:        a.id,
            firstName: a.firstName || '',
            lastName:  a.lastName  || '',
            address1:  a.address1  || '',
            address2:  a.address2  || '',
            city:      a.city      || '',
            province:  a.province  || '',
            zip:       a.zip       || '',
            country:   a.country   || '',
            phone:     a.phoneNumber || '',
          }
        }))
      }
    };
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
            <button class="my-account__nav-item my-account__nav-logout" id="my-account-logout">
              <span>${this.t.logout}</span>
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
    return `
      <div class="my-account__form-section">
        <h2 class="my-account__section-heading">${this.t.profile_title}</h2>
        <div class="my-account__form-grid">
          <div class="my-account__form-field">
            <label>${this.t.last_name} *</label>
            <input class="my-account__input" type="text" value="${this.escapeHtml(customer.lastName || '')}" placeholder="${this.t.last_name}" />
          </div>
          <div class="my-account__form-field">
            <label>${this.t.first_name} *</label>
            <input class="my-account__input" type="text" value="${this.escapeHtml(customer.firstName || '')}" placeholder="${this.t.first_name}" />
          </div>
          <div class="my-account__form-field">
            <label>${this.t.furigana_last} *</label>
            <input class="my-account__input" type="text" placeholder="${this.t.furigana_last}" />
          </div>
          <div class="my-account__form-field">
            <label>${this.t.furigana_first} *</label>
            <input class="my-account__input" type="text" placeholder="${this.t.furigana_first}" />
          </div>
        </div>

        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label>${this.t.dob} <span class="my-account__info-icon">?</span></label>
          <div class="my-account__date-input">
             <input class="my-account__input" type="text" value="1987/09/07" placeholder="YYYY/MM/DD" />
             <span class="my-account__calendar-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
             </span>
          </div>
        </div>

        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label>${this.t.phone} *</label>
          <input class="my-account__input" type="tel" value="${this.escapeHtml(customer.phone || '')}" placeholder="012322222" />
        </div>

        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label>${this.t.email} *</label>
          <input class="my-account__input" type="email" value="${this.escapeHtml(customer.email || '')}" placeholder="vtxml@ninepoints.vn" />
        </div>

        <p class="my-account__required-text">${this.t.required}</p>

        <button type="button" class="my-account__submit-btn">${this.t.submit}</button>
      </div>

      <div class="my-account__form-section mt-40">
        <h2 class="my-account__section-heading">${this.t.login_info_title}</h2>
        <div class="my-account__form-field my-account__form-field--full">
          <label>${this.t.password} *</label>
          <div class="my-account__password-input">
            <input class="my-account__input" type="password" placeholder="${this.t.password}" />
            <button type="button" class="my-account__password-toggle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
        </div>
        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label>${this.t.new_password} *</label>
          <div class="my-account__password-input">
            <input class="my-account__input" type="password" placeholder="${this.t.new_password}" />
            <button type="button" class="my-account__password-toggle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
        </div>
        <p class="my-account__password-hint">${this.t.password_hint}</p>
        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label>${this.t.password_confirm} *</label>
          <div class="my-account__password-input">
            <input class="my-account__input" type="password" placeholder="${this.t.password}" />
            <button type="button" class="my-account__password-toggle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
        </div>

        <button type="button" class="my-account__submit-btn">${this.t.submit}</button>
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
  // Events
  // ---------------------------------------------------------------------------

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

    // Logout
    document.getElementById('my-account-logout')?.addEventListener('click', () => {
      if (this.nativeSession) {
        // Native Shopify session — clear localStorage and redirect to Shopify logout
        localStorage.removeItem('shopifyCustomerAccessToken');
        localStorage.removeItem('shopifyCustomerAccessTokenExpiresAt');
        localStorage.removeItem('shopifyCustomer');
        window.location.href = this.logoutUrl;
      } else if (this.caSession) {
        // Customer Account API session — clear tokens and reload
        this.clearCaToken();
        localStorage.removeItem('dp_ca_refresh_token');
        window.location.replace('/pages/my-account');
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
  // Check PKCE CA token first, then Storefront API localStorage token
  const caToken  = sessionStorage.getItem('dp_ca_token');
  const caExp    = parseInt(sessionStorage.getItem('dp_ca_token_exp') || '0', 10);
  const caValid  = caToken && (!caExp || Date.now() < caExp);

  const sfToken    = localStorage.getItem('shopifyCustomerAccessToken');
  const sfExpires  = localStorage.getItem('shopifyCustomerAccessTokenExpiresAt');
  const sfValid    = sfToken && sfExpires && new Date(sfExpires) > new Date();

  const isLoggedIn = caValid || sfValid;

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
      sessionStorage.removeItem('dp_ca_token');
      sessionStorage.removeItem('dp_ca_token_exp');
      localStorage.removeItem('dp_ca_refresh_token');
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
