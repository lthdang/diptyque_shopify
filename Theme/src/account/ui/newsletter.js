/**
 * ui/newsletter.js — Newsletter page renderer
 * No API calls, no state writes.
 */

'use strict';

export class DiptyqueNewsletterRenderer {
  /**
   * @param {HTMLElement} container
   * @param {Function} t
   */
  constructor(container, t) {
    this._container = container;
    this._t = t;
    this._handlers = {};
  }

  on(action, handler) { this._handlers[action] = handler; }

  _emit(action, ...args) {
    if (this._handlers[action]) this._handlers[action](...args);
  }

  renderLoading() {
    this._container.innerHTML = `
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this._t('loading', '読み込み中...')}</p>
      </div>`;
  }

  /**
   * @param {{ sms_opt_in?: boolean, mail_opt_in?: boolean, postal_opt_in?: boolean }} prefs
   */
  render(prefs = {}) {
    this._container.innerHTML = `
      <div class="newsletter-page">
        <section class="newsletter-page__form-section">
          <p class="newsletter-page__title">${this._t('newsletter_title', 'ディブティックの最新情報や特別なご案内のお受け取り方法をお選びください')}</p>

          <div class="newsletter-page__options">
            <label class="newsletter-page__option">
              <input type="checkbox" name="newsletter_channel" value="email" class="newsletter-page__checkbox"${prefs.mail_opt_in ? ' checked' : ''}>
              <span class="newsletter-page__option-label">${this._t('newsletter_email', 'メールで')}</span>
            </label>
            <label class="newsletter-page__option">
              <input type="checkbox" name="newsletter_channel" value="sms" class="newsletter-page__checkbox"${prefs.sms_opt_in ? ' checked' : ''}>
              <span class="newsletter-page__option-label">${this._t('newsletter_sms', 'SMS/電話で')}</span>
            </label>
            <label class="newsletter-page__option">
              <input type="checkbox" name="newsletter_channel" value="postal" class="newsletter-page__checkbox"${prefs.postal_opt_in ? ' checked' : ''}>
              <span class="newsletter-page__option-label">${this._t('newsletter_postal', '郵送で')}</span>
            </label>
          </div>

          <button type="button" class="newsletter-page__submit" data-action="newsletter-submit">
            ${this._t('newsletter_submit', '登録する')}
          </button>

          <p class="newsletter-page__note">${this._t('newsletter_note', '')}</p>

          <div class="newsletter-page__success" aria-live="polite" hidden>
            ${this._t('newsletter_success', 'ご登録ありがとうございます。')}
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

    this._container.querySelector('[data-action="newsletter-submit"]')?.addEventListener('click', () => {
      const checked = new Set(
        [...this._container.querySelectorAll('.newsletter-page__checkbox:checked')].map((el) => el.value),
      );

      this._emit('newsletter:submit', {
        sms_opt_in: checked.has('sms'),
        mail_opt_in: checked.has('email'),
        postal_opt_in: checked.has('postal'),
      });
    });
  }

  setSubmitState(loading) {
    const btn = this._container.querySelector('.newsletter-page__submit');
    if (!btn) return;

    btn.disabled = loading;
    btn.textContent = loading
      ? this._t('saving', '登録中...')
      : this._t('newsletter_submit', '登録する');
  }

  showSuccess(message) {
    const successEl = this._container.querySelector('.newsletter-page__success');
    const errorEl = this._container.querySelector('.newsletter-page__error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
    if (successEl) {
      successEl.textContent = message;
      successEl.hidden = false;
    }
  }

  showError(message) {
    const successEl = this._container.querySelector('.newsletter-page__success');
    const errorEl = this._container.querySelector('.newsletter-page__error');
    if (successEl) {
      successEl.hidden = true;
    }
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
  }
}
