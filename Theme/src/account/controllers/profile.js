/**
 * controllers/profile.js — Profile & Password controller
 * Wires DiptyqueCustomerApi ↔ diptyqueCustomerStore ↔ DiptyqueProfileRenderer
 */

'use strict';

import { diptyqueCustomerStore } from '../store.js';
import { displayToIsoDate }      from '../utils/index.js';
import { getNativeCSRFToken, logoutAccount, DiptyqueTokenStore } from '../auth.js';

export class DiptyqueProfileController {
  /**
   * @param {import('../api/customer').DiptyqueCustomerApi}       api
   * @param {import('../ui/profile').DiptyqueProfileRenderer}     renderer
   * @param {{ isNative?: boolean, logoutUrl?: string }}          options
   */
  constructor(api, renderer, options = {}) {
    this._api             = api;
    this._renderer        = renderer;
    this._isNative        = options.isNative        || false;
    this._logoutUrl       = options.logoutUrl       || '/account/logout';
    this._getNativeSession= options.getNativeSession || null;
    this._store           = diptyqueCustomerStore;

    this._store.subscribe(state => {
      if (state.status === 'loading') { renderer.renderLoading(); return; }
      if (state.status === 'error')   { window.location.href = '/'; return; }
      if (state.status === 'ready' && state.customer) {
        renderer.renderDashboard(state.customer);
        this._bindRendererActions();
      }
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  async load(accessToken, nativeCustomer = null) {
    if (nativeCustomer) {
      this._store.set({ status: 'ready', customer: nativeCustomer, error: null });
      return;
    }

    if (!accessToken) {
      this._store.set({ status: 'error', customer: null, error: 'no_session' });
      return;
    }

    this._store.set({ status: 'loading', customer: null, error: null });
    try {
      const customer = await this._api.fetchCustomer(accessToken);
      if (!customer) {
        // Token is no longer valid — fall back to native session data if available
        // so the user can still see their profile without being shown a login prompt.
        const nativeFallback = this._getNativeSession?.();
        if (nativeFallback) {
          this._store.set({ status: 'ready', customer: nativeFallback, error: null });
        } else {
          this._store.set({ status: 'error', customer: null, error: 'invalid_token' });
        }
        return;
      }
      this._store.set({ status: 'ready', customer, error: null });
    } catch (err) {
      console.error('[ProfileController] Failed to load customer', err);
      // On network failure, also try native session fallback
      const nativeFallback = this._getNativeSession?.();
      if (nativeFallback) {
        this._store.set({ status: 'ready', customer: nativeFallback, error: null });
      } else {
        this._store.set({ status: 'error', customer: null, error: err.message });
      }
    }
  }

  // ── Event wiring ───────────────────────────────────────────────────────────

  _bindRendererActions() {
    this._renderer.on('profile:submit',  (formData) => this._handleProfileSubmit(formData));
    this._renderer.on('password:submit', (formData) => this._handlePasswordSubmit(formData));

    document.getElementById('my-account-logout')?.addEventListener('click', () => {
      logoutAccount(this._isNative ? this._logoutUrl : '/');
    }, { once: true });
  }

  // ── Profile submit ─────────────────────────────────────────────────────────

  async _handleProfileSubmit(formData) {
    if (this._profileBusy) return;
    this._profileBusy = true;

    const t        = this._renderer._t;
    const renderer = this._renderer;

    renderer.setSubmitState('profile', true, t('saving', '保存中...'));
    renderer.setFormMessage('', '', 'profile');

    const fields = [
      'lastName', 'firstName', 'last_name_kana', 'first_name_kana',
      'dob', 'phone', 'email', 'profileCurrentPassword',
    ];
    fields.forEach(f => renderer.clearFieldError(f));

    const errors       = this._validateProfile(formData, t);
    const currentEmail = this._store.get().customer?.email || '';
    const emailChanged = currentEmail.toLowerCase() !== (formData.email || '').toLowerCase();

    if (emailChanged && !formData.profileCurrentPassword) {
      errors.profileCurrentPassword = t(
        'validation_current_password_required_for_email',
        'メールアドレスを変更する場合は現在のパスワードを入力してください。'
      );
    }

    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([f, msg]) => renderer.setFieldError(f, msg));
      renderer.setSubmitState('profile', false);
      this._profileBusy = false;
      return;
    }

    try {
      const payload = {
        firstName:        formData.firstName,
        lastName:         formData.lastName,
        first_name_kana:  formData.first_name_kana,
        last_name_kana:   formData.last_name_kana,
        email:            formData.email,
        phone:            formData.phone,
        birthday:         formData.dob ? displayToIsoDate(formData.dob) : '',
        current_password: formData.profileCurrentPassword || '',
      };

      if (this._isNative) {
        await this._api.updateProfileNative(payload, getNativeCSRFToken());
      } else {
        await this._api.updateProfile(payload);
      }

      try {
        await this._api.updateMetafields({
          last_name_kana:  payload.last_name_kana,
          first_name_kana: payload.first_name_kana,
          birthday:        payload.birthday,
        });
      } catch (mfErr) {
        console.warn('[ProfileController] Metafield update skipped:', mfErr.message);
      }

      this._store.update(s => ({
        ...s,
        customer: {
          ...s.customer,
          firstName: formData.firstName,
          lastName:  formData.lastName,
          email:     formData.email,
          phone:     formData.phone,
        },
      }));

      renderer.setFormMessage('success', t('save_success', '情報が保存されました。'), 'profile');

    } catch (err) {
      console.error('[ProfileController] Profile update error', err);
      if (err.isPasswordError || err.status === 401) {
        renderer.setFieldError('profileCurrentPassword',
          t('validation_current_password_invalid', '現在のパスワードが正しくありません。'));
      } else if (err.code === 'TAKEN') {
        renderer.setFieldError('email', t('validation_email_taken', 'このメールアドレスは既に使用されています。'));
      } else {
        renderer.setFormMessage('error', err.message || t('save_failed', '保存に失敗しました。'), 'profile');
      }
    } finally {
      renderer.setSubmitState('profile', false);
      this._profileBusy = false;
    }
  }

  // ── Password submit ────────────────────────────────────────────────────────

  async _handlePasswordSubmit(formData) {
    if (this._passwordBusy) return;
    this._passwordBusy = true;

    const t        = this._renderer._t;
    const renderer = this._renderer;

    renderer.setSubmitState('password', true, t('saving', '保存中...'));
    renderer.setFormMessage('', '', 'password');
    ['currentPassword', 'newPassword', 'confirmPassword'].forEach(f => renderer.clearFieldError(f));

    if (!formData.currentPassword && !formData.newPassword && !formData.confirmPassword) {
      renderer.setSubmitState('password', false);
      this._passwordBusy = false;
      return;
    }

    const errors = this._validatePassword(formData, t);
    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([f, msg]) => renderer.setFieldError(f, msg));
      renderer.setSubmitState('password', false);
      this._passwordBusy = false;
      return;
    }

    try {
      const customer = this._store.get().customer;

      if (this._isNative) {
        await this._api.updatePasswordNative(
          formData.newPassword, formData.confirmPassword, getNativeCSRFToken()
        );
      } else {
        // Call backend directly — it verifies current_password internally
        // via Storefront API on the server side, so no need to call
        // customerAccessTokenCreate from the browser (would require
        // unauthenticated_write_customers scope on the Storefront token).
        await this._api.updatePassword(formData.currentPassword, formData.newPassword);

        // Shopify invalidates all existing tokens after a password change.
        // Clear local session and redirect to home so the user re-authenticates.
        DiptyqueTokenStore.clear();
        renderer.clearPasswordFields();
        renderer.setFormMessage('success', t('password_changed_relogin', 'パスワードを変更しました。再度ログインしてください。'), 'password');
        setTimeout(() => { window.location.href = '/'; }, 2000);
        return;
      }

      renderer.clearPasswordFields();
      renderer.setFormMessage('success', t('save_success', '情報が保存されました。'), 'password');

    } catch (err) {
      console.error('[ProfileController] Password update error', err);
      if (err.isPasswordError || err.status === 401) {
        renderer.setFieldError('currentPassword',
          t('validation_current_password_invalid', '現在のパスワードが正しくありません。'));
      } else {
        renderer.setFormMessage('error', err.message || t('save_failed', '保存に失敗しました。'), 'password');
      }
    } finally {
      renderer.setSubmitState('password', false);
      this._passwordBusy = false;
    }
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  _validateProfile(data, t) {
    const errors    = {};
    const kanaRegex = /^[\u30A0-\u30FF\u30FC\s]+$/;
    const required  = ['lastName', 'firstName', 'last_name_kana', 'first_name_kana', 'phone', 'email'];

    for (const key of required) {
      if (!data[key]) errors[key] = t('validation_required', 'この項目は必須です。');
    }
    if (data.last_name_kana  && !errors.last_name_kana  && !kanaRegex.test(data.last_name_kana)) {
      errors.last_name_kana  = t('validation_kana_invalid', '全角カタカナで入力してください。');
    }
    if (data.first_name_kana && !errors.first_name_kana && !kanaRegex.test(data.first_name_kana)) {
      errors.first_name_kana = t('validation_kana_invalid', '全角カタカナで入力してください。');
    }
    if (data.email && !errors.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = t('validation_email_invalid', '有効なメールアドレスを入力してください。');
    }
    if (data.phone && !errors.phone) {
      const raw = data.phone;
      if (!/^[0-9+()\-\s]+$/.test(raw)) {
        errors.phone = t('validation_phone_invalid', '有効な電話番号を入力してください。');
      } else {
        const digits = raw.replace(/\D/g, '');
        if (digits.length < 8 || digits.length > 15) {
          errors.phone = t('validation_phone_invalid', '有効な電話番号を入力してください。');
        }
      }
    }
    if (data.dob) {
      if (!/^\d{4}\/\d{2}\/\d{2}$/.test(data.dob)) {
        errors.dob = t('validation_dob_invalid', 'YYYY/MM/DD 形式の有効な日付を入力してください。');
      } else {
        const [y, m, d] = data.dob.split('/').map(Number);
        const date = new Date(y, m - 1, d);
        const valid = date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
        if (!valid || date > new Date()) {
          errors.dob = t('validation_dob_invalid', 'YYYY/MM/DD 形式の有効な日付を入力してください。');
        }
      }
    }
    return errors;
  }

  _validatePassword(data, t) {
    const errors = {};
    if (!data.currentPassword) errors.currentPassword = t('validation_required', 'この項目は必須です。');
    if (!data.newPassword) {
      errors.newPassword = t('validation_required', 'この項目は必須です。');
    } else {
      const strong = data.newPassword.length >= 8
        && /[a-zA-Z]/.test(data.newPassword)
        && /\d/.test(data.newPassword)
        && /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/.test(data.newPassword);
      if (!strong) errors.newPassword = t('validation_password_weak',
        'パスワードは8文字以上で、英字・数字・記号を含む必要があります。');
    }
    if (!data.confirmPassword) {
      errors.confirmPassword = t('validation_required', 'この項目は必須です。');
    } else if (data.newPassword && data.confirmPassword !== data.newPassword) {
      errors.confirmPassword = t('validation_password_mismatch', 'パスワードが一致しません。');
    }
    return errors;
  }
}
