/**
 * ui/profile.js — Profile & password form renderer
 * No API calls, no state writes.
 */

'use strict';

import { getMetafieldValue, isoToDisplayDate, escapeHtml } from '../utils/index.js';

export class DiptyqueProfileRenderer {
  /**
   * @param {HTMLElement} container
   * @param {Function}    t          i18n lookup fn
   */
  constructor(container, t) {
    this._el        = container;
    this._t         = t;
    this._handlers  = {};
    this._dobPicker = null;
  }

  // ── Event dispatch ─────────────────────────────────────────────────────────

  on(action, handler) { this._handlers[action] = handler; }

  _emit(action, ...args) {
    if (this._handlers[action]) {
      this._handlers[action](...args);
    } else {
      console.warn('[ProfileRenderer] No handler for:', action);
    }
  }

  // ── Public render ──────────────────────────────────────────────────────────

  renderLoading() {
    this._el.innerHTML = `
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this._t('loading', '読み込み中...')}</p>
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
        <h2>${this._t('login_required', 'ログインが必要です')}</h2>
        <p>${this._t('login_prompt', 'アカウント情報を表示するにはログインしてください。')}</p>
        <button type="button" class="my-account__login-btn button" data-open-account-modal="login">
          ${this._t('login_btn', 'ログイン')}
        </button>
      </div>`;
  }

  renderDashboard(customer) {
    const t   = this._t;
    const mfs = customer.metafields || [];

    const lastKana  = escapeHtml(getMetafieldValue(mfs, 'registration', 'last_name_kana'));
    const firstKana = escapeHtml(getMetafieldValue(mfs, 'registration', 'first_name_kana'));
    const dob       = escapeHtml(isoToDisplayDate(getMetafieldValue(mfs, 'registration', 'birthday')));

    this._el.innerHTML = `
      <!-- ── Profile section ────────────────────────────────────────── -->
      <div class="my-account__form-section" data-section="profile">
        <h2 class="my-account__section-heading">${t('profile_title', 'お客様情報')}</h2>
        <div class="my-account__form-grid">

          <div class="my-account__form-field">
            <label for="ma-lastName">${t('last_name', '姓')} *</label>
            <input id="ma-lastName" name="lastName" data-field="lastName"
              class="my-account__input" type="text"
              value="${escapeHtml(customer.lastName || '')}"
              placeholder="${t('last_name', '姓')}" autocomplete="family-name">
            <span class="my-account__field-error" data-error-for="lastName" aria-live="polite"></span>
          </div>

          <div class="my-account__form-field">
            <label for="ma-firstName">${t('first_name', '名')} *</label>
            <input id="ma-firstName" name="firstName" data-field="firstName"
              class="my-account__input" type="text"
              value="${escapeHtml(customer.firstName || '')}"
              placeholder="${t('first_name', '名')}" autocomplete="given-name">
            <span class="my-account__field-error" data-error-for="firstName" aria-live="polite"></span>
          </div>

          <div class="my-account__form-field">
            <label for="ma-last-name-kana">${t('furigana_last', 'フリガナ（姓）')} *</label>
            <input id="ma-last-name-kana" name="last_name_kana" data-field="last_name_kana"
              class="my-account__input" type="text"
              value="${lastKana}" placeholder="${t('furigana_last', 'フリガナ（姓）')}">
            <span class="my-account__field-error" data-error-for="last_name_kana" aria-live="polite"></span>
          </div>

          <div class="my-account__form-field">
            <label for="ma-first-name-kana">${t('furigana_first', 'フリガナ（名）')} *</label>
            <input id="ma-first-name-kana" name="first_name_kana" data-field="first_name_kana"
              class="my-account__input" type="text"
              value="${firstKana}" placeholder="${t('furigana_first', 'フリガナ（名）')}">
            <span class="my-account__field-error" data-error-for="first_name_kana" aria-live="polite"></span>
          </div>
        </div>

        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label for="ma-dob">${t('dob', '生年月日')} <span class="my-account__info-icon">?</span></label>
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
          <label for="ma-phone">${t('phone', '電話番号')} *</label>
          <input id="ma-phone" name="phone" data-field="phone"
            class="my-account__input" type="tel"
            value="${escapeHtml(customer.phone || '')}"
            placeholder="012322222" autocomplete="tel">
          <span class="my-account__field-error" data-error-for="phone" aria-live="polite"></span>
        </div>

        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label for="ma-email">${t('email', 'Eメールアドレス')} *</label>
          <input id="ma-email" name="email" data-field="email"
            class="my-account__input" type="email"
            value="${escapeHtml(customer.email || '')}"
            placeholder="your@email.com" autocomplete="email">
          <span class="my-account__field-error" data-error-for="email" aria-live="polite"></span>
        </div>

        <!-- Email change requires current password verification -->
        <div class="my-account__form-field my-account__form-field--full mt-16 my-account__form-field--hidden"
             data-profile-email-verify>
          <label for="ma-profileCurrentPassword">${t('current_password', '現在のパスワード')} *</label>
          <div class="my-account__password-input">
            <input id="ma-profileCurrentPassword" name="profileCurrentPassword"
              data-field="profileCurrentPassword"
              class="my-account__input" type="password"
              placeholder="${t('current_password', '現在のパスワード')}" autocomplete="current-password">
            ${this._eyeIcon()}
          </div>
          <span class="my-account__field-error" data-error-for="profileCurrentPassword" aria-live="polite"></span>
        </div>

        <p class="my-account__required-text">${t('required', '* 必須')}</p>
        <div class="my-account__form-message" data-form-message="profile" role="alert" aria-live="polite"></div>
        <button type="button" class="my-account__submit-btn" data-submit="profile">${t('submit', '確定')}</button>
      </div>

      <!-- ── Password section ──────────────────────────────────────── -->
      <div class="my-account__form-section mt-40" data-section="password">
        <h2 class="my-account__section-heading">${t('login_info_title', 'ログイン情報')}</h2>
        ${this._passwordField('currentPassword', t('password', 'パスワード'), 'current-password')}
        ${this._passwordField('newPassword', t('new_password', '新しいパスワード'), 'new-password', true)}
        <p class="my-account__password-hint">${t('password_hint', 'ⓘ パスワードは8文字以上で、英字・数字・記号を含む必要があります。')}</p>
        ${this._passwordField('confirmPassword', t('password_confirm', 'パスワード（再入力）'), 'new-password')}

        <div class="my-account__form-message" data-form-message="password" role="alert" aria-live="polite"></div>
        <button type="button" class="my-account__submit-btn" data-submit="password">${t('submit', '確定')}</button>
      </div>
`;

    this._bindEvents(customer);
    this._initDobPicker();
  }

  // ── Field-level feedback ───────────────────────────────────────────────────

  setFieldError(fieldName, message) {
    const input = this._el.querySelector(`[data-field="${fieldName}"]`);
    const errEl = this._el.querySelector(`[data-error-for="${fieldName}"]`);
    if (input) { input.classList.add('my-account__input--error'); input.setAttribute('aria-invalid', 'true'); }
    if (errEl) errEl.textContent = message;
  }

  clearFieldError(fieldName) {
    const input = this._el.querySelector(`[data-field="${fieldName}"]`);
    const errEl = this._el.querySelector(`[data-error-for="${fieldName}"]`);
    if (input) { input.classList.remove('my-account__input--error'); input.removeAttribute('aria-invalid'); }
    if (errEl) errEl.textContent = '';
  }

  setFormMessage(type, message, section) {
    const msgEl = this._el.querySelector(`[data-form-message="${section}"]`);
    if (!msgEl) return;
    msgEl.textContent = message;
    msgEl.className   = type
      ? `my-account__form-message my-account__form-message--${type}`
      : 'my-account__form-message';
    if (type === 'success') {
      setTimeout(() => {
        if (msgEl.textContent === message) {
          msgEl.textContent = '';
          msgEl.className   = 'my-account__form-message';
        }
      }, 6000);
    }
  }

  setSubmitState(section, loading, savingLabel) {
    const btn = this._el.querySelector(`[data-submit="${section}"]`);
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.dataset.originalText = btn.textContent;
      btn.textContent = savingLabel || '...';
      btn.classList.add('my-account__submit-btn--loading');
    } else {
      btn.textContent = btn.dataset.originalText || this._t('submit', '確定');
      delete btn.dataset.originalText;
      btn.classList.remove('my-account__submit-btn--loading');
    }
  }

  showEmailVerifyField(visible) {
    const field = this._el.querySelector('[data-profile-email-verify]');
    if (!field) return;
    field.classList.toggle('my-account__form-field--hidden', !visible);
    if (!visible) {
      const input = field.querySelector('[data-field="profileCurrentPassword"]');
      if (input) input.value = '';
      this.clearFieldError('profileCurrentPassword');
    }
  }

  getProfileFormData() {
    const g = (field) => (this._el.querySelector(`[data-field="${field}"]`)?.value ?? '').trim();
    return {
      lastName:               g('lastName'),
      firstName:              g('firstName'),
      last_name_kana:         g('last_name_kana'),
      first_name_kana:        g('first_name_kana'),
      dob:                    g('dob'),
      phone:                  g('phone'),
      email:                  g('email'),
      profileCurrentPassword: g('profileCurrentPassword'),
    };
  }

  getPasswordFormData() {
    const g = (field) => this._el.querySelector(`[data-field="${field}"]`)?.value ?? '';
    return {
      currentPassword: g('currentPassword'),
      newPassword:     g('newPassword'),
      confirmPassword: g('confirmPassword'),
    };
  }

  clearPasswordFields() {
    ['currentPassword', 'newPassword', 'confirmPassword'].forEach(f => {
      const el = this._el.querySelector(`[data-field="${f}"]`);
      if (el) el.value = '';
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
      <div class="my-account__form-field my-account__form-field--full${addHintGap ? ' mt-16' : ''}">
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
    this._el.querySelectorAll('.my-account__password-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const input  = btn.previousElementSibling;
        const isPass = input.type === 'password';
        input.type   = isPass ? 'text' : 'password';
        btn.innerHTML = isPass
          ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
          : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
      });
    });

    this._el.querySelector('[data-submit="profile"]')?.addEventListener('click', () => {
      this._emit('profile:submit', this.getProfileFormData());
    });

    this._el.querySelector('[data-submit="password"]')?.addEventListener('click', () => {
      this._emit('password:submit', this.getPasswordFormData());
    });

    this._el.querySelectorAll('[data-field]').forEach(input => {
      input.addEventListener('input', () => {
        this.clearFieldError(input.dataset.field);
        if (input.dataset.field === 'email') {
          const changed = (customer.email || '').toLowerCase().trim()
            !== input.value.toLowerCase().trim();
          this.showEmailVerifyField(changed);
        }
      });
    });

    this.showEmailVerifyField(false);
  }

  _initDobPicker() {
    if (this._dobPicker) { try { this._dobPicker.destroy(); } catch (_) {} this._dobPicker = null; }
    const input  = document.getElementById('ma-dob');
    const toggle = document.getElementById('ma-dob-toggle');
    if (!input) return;

    const doInit = () => {
      /* global flatpickr */
      const locale = (typeof flatpickr !== 'undefined' && flatpickr.l10ns?.ja)
        ? flatpickr.l10ns.ja : 'default';

      const fp = flatpickr(input, {
        dateFormat:    'Y/m/d',
        allowInput:    true,
        disableMobile: false,
        locale,
        maxDate: 'today',
        minDate: '1900-01-01',
        appendTo: document.body,
        onReady(_d, _s, instance) { instance.input.removeAttribute('readonly'); },
        onChange() { input.dispatchEvent(new Event('input', { bubbles: true })); },
      });
      toggle?.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); fp.open(); });
      input.addEventListener('click', () => fp.open());
      this._dobPicker = fp;
    };

    if (typeof flatpickr !== 'undefined') {
      doInit();
    } else {
      const iv = setInterval(() => {
        if (typeof flatpickr !== 'undefined') { clearInterval(iv); doInit(); }
      }, 50);
    }
  }
}
