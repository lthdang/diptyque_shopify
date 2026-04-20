/**
 * ui/address.js — Address page renderer
 * No API calls, no state writes.
 */

'use strict';

import { escapeHtml, normalizeProvince } from '../utils/index.js';

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県',
  '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県',
  '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

export class DiptyqueAddressRenderer {
  /**
   * @param {HTMLElement} container  #addresses-details-container
   * @param {Function}    t          i18n lookup fn
   */
  constructor(container, t) {
    this._container = container;
    this.t          = t;
    this._handlers  = {};
    this._zipTimer  = null;
  }

  // ── Event dispatch ─────────────────────────────────────────────────────────

  on(action, handler) { this._handlers[action] = handler; }

  _emit(action, ...args) {
    if (this._handlers[action]) this._handlers[action](...args);
  }

  // ── Top-level render ───────────────────────────────────────────────────────

  renderLoading() {
    const root = this._listRoot();
    root.innerHTML = `
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this.t('loading', '読み込み中...')}</p>
      </div>`;
  }

  render(state) {
    if (state.status === 'loading') { this.renderLoading(); return; }
    if (state.status === 'error')   { this._renderError(state.error); return; }
    if (state.status === 'ready')   { this.renderAddressList(state.addresses); }
  }

  renderAddressList(addresses) {
    const t        = this.t;
    const root     = this._listRoot();
    const shipping = addresses.filter(a => (a.extension_attributes?.type ?? 'shipping') !== 'billing');
    const billing  = addresses.filter(a => a.extension_attributes?.type === 'billing');

    root.innerHTML = `
      <div class="addresses-details__wrapper">
        <div class="addresses-details__section">
          <h3 class="addresses-details__section-title">${t('address_shipping', '配送先住所')}</h3>
          <div class="addresses-details__list" id="shipping-list">
            ${shipping.map(a => this.renderCard(a)).join('')}
          </div>
          <div class="addresses-details__action-area mt-40" data-area="shipping">
            <button type="button" class="addresses-details__new-btn"
                    data-action="new-address" data-type="shipping">
              ${t('address_new_btn', '新しい住所を登録する')}
            </button>
            <div class="my-account__address-form-container" data-id="new-shipping"></div>
          </div>
        </div>

        <div class="addresses-details__section mt-40">
          <h3 class="addresses-details__section-title">${t('address_billing', 'ご依頼主住所')}</h3>
          <div class="addresses-details__list" id="billing-list">
            ${billing.map(a => this.renderCard(a)).join('')}
          </div>
          <div class="addresses-details__action-area mt-40" data-area="billing">
            <button type="button" class="addresses-details__new-btn"
                    data-action="new-address" data-type="billing">
              ${t('address_new_btn', '新しい住所を登録する')}
            </button>
            <div class="my-account__address-form-container" data-id="new-billing"></div>
          </div>
        </div>
      </div>`;

    this._bindListEvents();
  }

  renderCard(addr) {
    const t        = this.t;
    const ext      = addr.extension_attributes ?? {};
    const showBadge = ext.is_default_billing === true || ext.is_default_shipping === true;

    return `
      <div class="addresses-details__card" data-id="${addr.id}">
        <div class="addresses-details__card-info">
          ${showBadge ? `<span class="addresses-details__default-badge">${t('address_default_badge', 'デフォルト')}</span>` : ''}
          <p class="addresses-details__name">${escapeHtml(addr.last_name || '')} ${escapeHtml(addr.first_name || '')}</p>
          <p>${escapeHtml(addr.zip || '')}</p>
          <p>${escapeHtml(normalizeProvince(addr.province || ''))}</p>
          <p>${escapeHtml(addr.city || '')}</p>
          <p>${escapeHtml(addr.address1 || '')}</p>
          ${addr.address2 ? `<p>${escapeHtml(addr.address2)}</p>` : ''}
          ${addr.phone    ? `<p>${escapeHtml(addr.phone)}</p>`    : ''}
        </div>
        <div class="addresses-details__actions">
          <button type="button" class="my-account__text-btn"
                  data-action="edit-address" data-id="${addr.id}">
            ${t('address_edit', '編集')}
          </button>
          <button type="button" class="my-account__text-btn"
                  data-action="delete-address" data-id="${addr.id}">
            ${t('address_delete', '削除')}
          </button>
        </div>
      </div>
      <div class="my-account__address-form-container" data-id="${addr.id}"></div>`;
  }

  renderForm(address = null, type = 'billing') {
    const t   = this.t;
    const ext = address?.extension_attributes ?? {};

    const rawProvince        = address?.province || '';
    const normalizedProvince = normalizeProvince(rawProvince);
    const lastnameKana       = ext.lastname_kana  ?? '';
    const firstnameKana      = ext.firstname_kana ?? '';
    const isDefBill          = ext.is_default_billing  === true;
    const isDefShip          = ext.is_default_shipping === true;

    const defaultCheckbox = type === 'billing'
      ? `<label class="addresses-details__checkbox-label">
           <input type="checkbox" name="is_default_billing" value="1"${isDefBill ? ' checked' : ''}>
           ${t('default_billing_label', 'デフォルトの請求先住所に設定する')}
         </label>`
      : `<label class="addresses-details__checkbox-label">
           <input type="checkbox" name="is_default_shipping" value="1"${isDefShip ? ' checked' : ''}>
           ${t('default_shipping_label', 'デフォルトの配送先住所に設定する')}
         </label>`;

    const provinceOptions = PREFECTURES.map(p =>
      `<option value="${p}"${normalizedProvince === p ? ' selected' : ''}>${p}</option>`
    ).join('');

    return `
      <form class="addresses-details__form" novalidate
            data-id="${address?.id || ''}" data-type="${type}"
            data-province-raw="${escapeHtml(rawProvince)}">

        <div class="addresses-details__form-row">
          <div class="addresses-details__field">
            <label>${t('last_name', '姓')} *</label>
            <input type="text" name="last_name" class="my-account__input"
                   value="${escapeHtml(address?.last_name || '')}" required>
            <span class="my-account__field-error" data-error-for="last_name" aria-live="polite"></span>
          </div>
          <div class="addresses-details__field">
            <label>${t('first_name', '名')} *</label>
            <input type="text" name="first_name" class="my-account__input"
                   value="${escapeHtml(address?.first_name || '')}" required>
            <span class="my-account__field-error" data-error-for="first_name" aria-live="polite"></span>
          </div>
        </div>

        <div class="addresses-details__form-row">
          <div class="addresses-details__field">
            <label>${t('furigana_last', 'フリガナ（姓）')} *</label>
            <input type="text" name="lastname_kana" class="my-account__input"
                   value="${escapeHtml(lastnameKana)}" required placeholder="例：ヤマダ">
            <span class="my-account__field-error" data-error-for="lastname_kana" aria-live="polite"></span>
          </div>
          <div class="addresses-details__field">
            <label>${t('furigana_first', 'フリガナ（名）')} *</label>
            <input type="text" name="firstname_kana" class="my-account__input"
                   value="${escapeHtml(firstnameKana)}" required placeholder="例：タロウ">
            <span class="my-account__field-error" data-error-for="firstname_kana" aria-live="polite"></span>
          </div>
        </div>

        <div class="addresses-details__field">
          <label>${t('zip', '郵便番号')} *</label>
          <input type="text" name="zip" class="my-account__input"
                 value="${escapeHtml(address?.zip || '')}" required
                 placeholder="例：060-0000" maxlength="8" data-zip-autofill>
          <span class="my-account__field-error" data-error-for="zip" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${t('province', '都道府県')} *</label>
          <select name="province" class="my-account__input" required>
            <option value="" disabled ${!address?.province ? 'selected' : ''}>
              ${t('province_placeholder', '都道府県を選択')}
            </option>
            ${provinceOptions}
          </select>
          <span class="my-account__field-error" data-error-for="province" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${t('city', '市区町村')} *</label>
          <input type="text" name="city" class="my-account__input"
                 value="${escapeHtml(address?.city || '')}" required>
          <span class="my-account__field-error" data-error-for="city" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${t('address1', '丁番・番地')} *</label>
          <input type="text" name="address1" class="my-account__input"
                 value="${escapeHtml(address?.address1 || '')}" required>
          <span class="my-account__field-error" data-error-for="address1" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${t('address2', 'マンション・建物名')}</label>
          <input type="text" name="address2" class="my-account__input"
                 value="${escapeHtml(address?.address2 || '')}">
        </div>

        <div class="addresses-details__field">
          <label>${t('phone', '電話番号')} *</label>
          <input type="tel" name="phone" class="my-account__input"
                 value="${escapeHtml(address?.phone || '')}" required>
          <span class="my-account__field-error" data-error-for="phone" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field addresses-details__field--checkbox">
          ${defaultCheckbox}
        </div>

        <p class="addresses-details__required-label">${t('required', '* 必須')}</p>
        <div class="my-account__form-message my-account__form-message--error" style="display:none;"></div>

        <button type="submit" class="addresses-details__submit-btn">
          ${t('address_submit', '決定')}
        </button>
        <button type="button" class="addresses-details__cancel-btn" data-action="cancel-address">
          ${t('address_cancel', 'キャンセル')}
        </button>
      </form>`;
  }

  // ── Form slot helpers ──────────────────────────────────────────────────────

  closeAllForms() {
    this._container.querySelectorAll('.my-account__address-form-container').forEach(c => {
      c.innerHTML = '';
    });
    this._container.querySelectorAll('.addresses-details__card').forEach(c => {
      c.style.display = '';
    });
    this._container.querySelectorAll('.addresses-details__actions').forEach(a => {
      a.style.display = '';
    });
    this._container.querySelectorAll('[data-action="new-address"]').forEach(b => {
      b.style.display = '';
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
    const form  = this._container.querySelector(`.addresses-details__form[data-id="${addressId}"]`);
    const errEl = form?.querySelector('.my-account__form-message--error');
    if (!errEl) return;
    errEl.textContent   = message;
    errEl.style.display = 'block';
  }

  setSubmitState(addressId, loading, label) {
    const form = this._container.querySelector(`.addresses-details__form[data-id="${addressId}"]`);
    const btn  = form?.querySelector('[type="submit"]');
    if (!btn) return;
    btn.disabled    = loading;
    btn.textContent = loading ? (label || '...') : this.t('address_submit', '決定');
  }

  // ── Private ────────────────────────────────────────────────────────────────

  _listRoot() {
    return this._container.querySelector('#addresses-list-root') || this._container;
  }

  _renderError(message) {
    this._listRoot().innerHTML = `
      <p class="my-account__form-message--error" style="margin-top:20px;">
        ${message || this.t('save_error', '保存に失敗しました。')}
      </p>`;
  }

  _bindListEvents() {
    if (this._listBound) return;
    this._listBound = true;

    this._container.addEventListener('click', (e) => {
      const btn    = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;

      if (action === 'new-address') {
        const type = btn.dataset.type || 'billing';
        this.closeAllForms();
        btn.style.display = 'none';
        this.openForm('new-' + type, null, type);
        return;
      }
      if (action === 'edit-address') { this._emit('address:edit', btn.dataset.id); return; }
      if (action === 'cancel-address') { this.closeAllForms(); return; }
      if (action === 'delete-address') { this._emit('address:delete', btn.dataset.id, btn); return; }
    }, { capture: false });

    this._container.addEventListener('submit', async (e) => {
      const form = e.target.closest('.addresses-details__form');
      if (!form) return;
      e.preventDefault();
      this._emit('address:save', form);
    });

    this._container.addEventListener('input', (e) => {
      const el = e.target.closest('[name]');
      if (!el) return;
      el.classList.remove('is-invalid');
      const errEl = el.closest('.addresses-details__field')
        ?.querySelector(`[data-error-for="${el.name}"]`);
      if (errEl) errEl.textContent = '';

      if (el.matches('[data-zip-autofill]')) this._scheduleZipLookup(el);
    });

    this._container.addEventListener('change', (e) => {
      const el = e.target.closest('[name]');
      if (!el) return;
      el.classList.remove('is-invalid');
      const errEl = el.closest('.addresses-details__field')
        ?.querySelector(`[data-error-for="${el.name}"]`);
      if (errEl) errEl.textContent = '';
    });
  }

  _bindFormEvents() {
    // Delegated listener in _bindListEvents handles newly added forms too
  }

  // ── Zip auto-fill ──────────────────────────────────────────────────────────

  _scheduleZipLookup(zipInput) {
    clearTimeout(this._zipTimer);
    const digits = zipInput.value.replace(/[^0-9]/g, '');
    if (digits.length < 7) return;
    this._zipTimer = setTimeout(() => this._doZipLookup(zipInput), 300);
  }

  async _doZipLookup(zipInput) {
    const form   = zipInput.closest('.addresses-details__form');
    if (!form) return;
    const errEl  = form.querySelector('[data-error-for="zip"]');
    const digits = zipInput.value.replace(/[^0-9]/g, '');
    if (errEl) errEl.textContent = '';

    try {
      const res  = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`);
      const json = await res.json();

      if (!json.results?.length) {
        if (errEl) errEl.textContent = '該当する住所が見つかりませんでした。';
        return;
      }
      const r       = json.results[0];
      const provEl  = form.querySelector('[name="province"]');
      const cityEl  = form.querySelector('[name="city"]');
      const addr1El = form.querySelector('[name="address1"]');

      if (provEl) {
        const opt = Array.from(provEl.options).find(o => o.value === r.address1);
        if (opt) provEl.value = r.address1;
      }
      if (cityEl)  cityEl.value = r.address2 || '';
      if (addr1El && !addr1El.value.trim()) addr1El.value = r.address3 || '';
    } catch (err) {
      console.error('[AddressRenderer] Zip lookup failed', err);
      if (errEl) errEl.textContent = '住所検索に失敗しました。';
    }
  }
}
