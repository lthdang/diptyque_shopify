/**
 * controllers/address.js — Address controller
 * Wires DiptyqueAddressApi ↔ diptyqueAddressStore ↔ DiptyqueAddressRenderer
 */

'use strict';

import { diptyqueAddressStore } from '../store.js';

export class DiptyqueAddressController {
  /**
   * @param {import('../api/address').DiptyqueAddressApi}         api
   * @param {import('../ui/address').DiptyqueAddressRenderer}     renderer
   */
  constructor(api, renderer) {
    this._api      = api;
    this._renderer = renderer;
    this._store    = diptyqueAddressStore;

    this._store.subscribe(state => renderer.render(state));

    renderer.on('address:edit',   (id)      => this._onEdit(id));
    renderer.on('address:delete', (id, btn) => this._onDelete(id, btn));
    renderer.on('address:save',   (form)    => this._onSave(form));
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  async load(accessToken) {
    if (!accessToken) {
      window.location.href = '/';
      return;
    }

    this._accessToken = accessToken;
    this._store.set({ status: 'loading', addresses: [], error: null });

    try {
      const addresses = await this._api.list(accessToken);
      this._store.set({ status: 'ready', addresses, error: null });
    } catch (err) {
      console.error('[AddressController] Failed to load addresses', err);
      if (err.status === 401 || err.status === 403) {
        window.location.href = '/';
        return;
      }
      this._store.set({ status: 'error', addresses: [], error: err.message });
    }
  }

  // ── Reload helper ──────────────────────────────────────────────────────────

  async _reload() {
    try {
      const addresses = await this._api.list(this._accessToken);
      this._store.set({ status: 'ready', addresses, error: null });
    } catch (err) {
      console.error('[AddressController] Reload failed', err);
      this._store.set({ status: 'error', addresses: [], error: err.message });
    }
  }

  // ── Edit ───────────────────────────────────────────────────────────────────

  _onEdit(id) {
    const address = this._store.get().addresses.find(a => String(a.id) === String(id));
    if (!address) { console.warn('[AddressController] Address not found:', id); return; }

    const type = address.extension_attributes?.type || 'shipping';
    this._renderer.closeAllForms();

    const card = this._renderer._container.querySelector(`.addresses-details__card[data-id="${id}"]`);
    if (card) {
      const actions = card.querySelector('.addresses-details__actions');
      if (actions) actions.style.display = 'none';
    }
    this._renderer.openForm(id, address, type);
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async _onDelete(id, btn) {
    const t = this._renderer.t;
    if (!confirm(t('confirm_delete', '本当にこの住所を削除しますか？'))) return;

    if (btn) { btn.textContent = '...'; btn.disabled = true; }

    const snapshot = this._store.get().addresses;
    this._store.update(s => ({
      ...s,
      addresses: s.addresses.filter(a => String(a.id) !== String(id)),
    }));

    try {
      await this._api.delete(id);
      await this._reload();
    } catch (err) {
      console.error('[AddressController] Delete failed', err);
      this._store.update(s => ({ ...s, addresses: snapshot }));
      if (btn) { btn.textContent = t('address_delete', '削除'); btn.disabled = false; }
      alert(t('delete_error', '削除に失敗しました。'));
    }
  }

  // ── Save (create or update) ────────────────────────────────────────────────

  async _onSave(form) {
    const t      = this._renderer.t;
    const id     = form.dataset.id;
    const type   = form.dataset.type || 'billing';
    const isEdit = Boolean(id);

    const data   = new FormData(form);
    const errors = this._validate(data, t);

    if (Object.keys(errors).length) {
      this._showFormErrors(form, errors);
      return;
    }

    const fields = {
      type,
      first_name:          (data.get('first_name')     || '').trim(),
      last_name:           (data.get('last_name')      || '').trim(),
      firstname_kana:      (data.get('firstname_kana') || '').trim(),
      lastname_kana:       (data.get('lastname_kana')  || '').trim(),
      zip:                 (data.get('zip')            || '').trim(),
      province:            (data.get('province')       || '').trim(),
      city:                (data.get('city')           || '').trim(),
      address1:            (data.get('address1')       || '').trim(),
      address2:            (data.get('address2')       || '').trim(),
      phone:               (data.get('phone')          || '').trim(),
      country:             'Japan',
      is_default_billing:  Boolean(data.get('is_default_billing')),
      is_default_shipping: Boolean(data.get('is_default_shipping')),
    };

    this._renderer.setSubmitState(id || `new-${type}`, true);
    const errorEl = form.querySelector('.my-account__form-message--error');
    if (errorEl) errorEl.style.display = 'none';

    try {
      if (isEdit) {
        await this._api.update(id, fields);
      } else {
        await this._api.create(fields);
      }
      await this._reload();
    } catch (err) {
      console.error('[AddressController] Save failed', err);
      if (errorEl) {
        errorEl.textContent   = err.message || t('save_error', '保存に失敗しました。');
        errorEl.style.display = 'block';
      }
      this._renderer.setSubmitState(id || `new-${type}`, false);
    }
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  _validate(data, t) {
    const errors  = {};
    const kanaRe  = /^[ァ-ヶーｦ-ﾟ\s\u3000]+$/;
    const required = ['last_name', 'first_name', 'lastname_kana', 'firstname_kana',
                      'zip', 'province', 'city', 'address1', 'phone'];

    for (const name of required) {
      if (!data.get(name)?.trim()) errors[name] = '必須項目です';
    }
    for (const name of ['lastname_kana', 'firstname_kana']) {
      const val = data.get(name)?.trim() || '';
      if (val && !errors[name] && !kanaRe.test(val)) {
        errors[name] = 'カタカナで入力してください';
      }
    }
    const zipDigits = (data.get('zip') || '').replace(/[^0-9]/g, '');
    if (data.get('zip')?.trim() && !errors.zip && zipDigits.length !== 7) {
      errors.zip = '郵便番号は7桁で入力してください（例：0600000）';
    }
    const phone = data.get('phone')?.trim() || '';
    if (phone && !errors.phone && !/^[0-9\-+\s()]{7,20}$/.test(phone)) {
      errors.phone = t('phone_invalid', '無効な電話番号です');
    }
    return errors;
  }

  _showFormErrors(form, errors) {
    Object.entries(errors).forEach(([name, msg]) => {
      const errEl   = form.querySelector(`[data-error-for="${name}"]`);
      const inputEl = form.querySelector(`[name="${name}"]`);
      if (errEl)   errEl.textContent = msg;
      if (inputEl) inputEl.classList.add('is-invalid');
    });
    const firstInvalid = form.querySelector('.is-invalid');
    if (firstInvalid) firstInvalid.focus();
  }
}
