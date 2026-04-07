const REGISTER_API_URL = 'https://diptyqueshopifybe.vercel.app/api/register';

class AccountModal {
  constructor() {
    this.modal = document.getElementById('account-modal');
    this.overlay = document.getElementById('account-modal-overlay');
    this.closeBtn = document.getElementById('account-modal-close');
    this.panelEmail = document.getElementById('account-panel-email');
    this.panelLogin = document.getElementById('account-panel-login');
    this.panelRegister = document.getElementById('account-panel-register');
    this.goRegisterBtn = document.getElementById('account-modal-go-register');
    this.i18n = this.loadI18n();
    this.shopId = this.modal?.dataset.shopId || '';
    this.shopDomain = this.modal?.dataset.shopDomain || '';
    this.clientId = this.modal?.dataset.clientId || '';

    if (!this.modal) return;

    this.bindEvents();
    this.initPasswordToggles();
    this.initForms();
  }

  loadI18n() {
    const el = document.getElementById('account-modal-i18n');
    if (!el) return {};
    try {
      return JSON.parse(el.textContent || '{}') || {};
    } catch {
      return {};
    }
  }

  bindEvents() {
    // Open via global trigger buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-account-modal]')) {
        e.preventDefault();
        const view = e.target.closest('[data-open-account-modal]').dataset.openAccountModal || 'email';
        this.open(view);
      }
    });

    // Close button
    this.closeBtn?.addEventListener('click', () => this.close());

    // Overlay click closes modal
    this.overlay?.addEventListener('click', () => this.close());

    // Email step: Continue button
    document.getElementById('account-modal-email-continue')?.addEventListener('click', () => {
      this._handleEmailContinue();
    });

    // Email step: Enter key on email input
    document.getElementById('modal-EmailStep')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this._handleEmailContinue(); }
    });

    // "Change email" buttons: go back to email panel
    document.getElementById('account-modal-change-email-login')?.addEventListener('click', () => {
      this.showPanel('email');
    });
    document.getElementById('account-modal-change-email-register')?.addEventListener('click', () => {
      this.showPanel('email');
    });

    // Switch to register from login
    this.goRegisterBtn?.addEventListener('click', () => {
      const email = document.getElementById('modal-CustomerEmail')?.value?.trim()
        || document.getElementById('modal-EmailStep')?.value?.trim();
      this.showPanel('register', email);
    });

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) this.close();
    });
  }

  initPasswordToggles() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.account-modal__password-toggle');
      if (!btn) return;
      const wrapper = btn.closest('.account-modal__input-wrapper');
      const input = wrapper?.querySelector('.account-modal__input');
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  }

  // ---------------------------------------------------------------------------
  // Forms – capture-phase listener prevents ALL other handlers from firing
  // ---------------------------------------------------------------------------
  initForms() {
    document.addEventListener(
      'submit',
      (e) => {
        const form = e.target;
        if (form.id === 'CustomerRegisterForm') {
          e.preventDefault();
          e.stopImmediatePropagation();
          this._handleRegisterSubmit(form);
        }
      },
      true
    );

    // Clear individual field error on user input
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('account-modal__input')) {
        this.clearFieldError(e.target);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Email step handler
  // ---------------------------------------------------------------------------
  _handleEmailContinue() {
    const emailInput = document.getElementById('modal-EmailStep');
    const panel = this.panelEmail;
    if (!emailInput) return;

    this.clearFieldError(emailInput);
    const summaryEl = panel?.querySelector('.account-modal__form-errors');
    if (summaryEl) { summaryEl.textContent = ''; summaryEl.hidden = true; }

    const email = emailInput.value.trim();
    const required = this.i18n.required || 'This field is required.';
    const emailMsg = this.i18n.email || 'Please enter a valid email address.';

    if (!email) { this.setFieldError(emailInput, required); emailInput.focus(); return; }
    if (!this.isValidEmail(email)) { this.setFieldError(emailInput, emailMsg); emailInput.focus(); return; }

    // Go straight to login panel (which now shows the redirect button)
    this.showPanel('login', email);
  }

  _handleRegisterSubmit(form) {
    const result = this.validateRegisterForm(form);
    if (!result.ok) {
      result.firstInvalid?.focus();
      return;
    }
    this.setSubmitting(form, true);
    this._submitRegisterForm(form, result.meta);
  }

  async _submitRegisterForm(form, meta) {
    const payload = this.buildRegisterPayload(form, meta);

    try {
      const response = await fetch(REGISTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let data = {};
      try { data = await response.json(); } catch { /* non-JSON body */ }

      // Success — redirect via PKCE so checkout session is set correctly
      if (response.ok && data.success !== false) {
        this.close();
        await this.startPkceLogin();
        return;
      }

      // Email already exists
      if (
        response.status === 409 ||
        (data.message && /already.*exists|already.*taken|email.*taken|email.*exists/i.test(data.message))
      ) {
        // Show login panel — email already exists
        this.showPanel('login', payload.email);
        return;
      }

      // Field-level validation errors from API
      const errors = this.normalizeApiErrors(data);
      if (Object.keys(errors.fields).length || errors.summary) {
        if (!errors.summary) {
          errors.summary = this.i18n.api_error || 'Please correct the errors below.';
        }
        this._displayServerErrors(form, errors);
        this.setSubmitting(form, false);
        return;
      }

      // Generic server error
      this._displayServerErrors(form, {
        summary: data.message || this.i18n.api_error || 'An unexpected error occurred. Please try again.',
      });
      this.setSubmitting(form, false);
    } catch (err) {
      console.error('Registration API error:', err);
      this._displayServerErrors(form, {
        summary: this.i18n.network_error || 'Network error. Please check your connection and try again.',
      });
      this.setSubmitting(form, false);
    }
  }

  buildRegisterPayload(form, meta) {
    const val = (id) => (form.querySelector(`#${id}`)?.value ?? '').trim();
    const acceptsMarketingEl = form.querySelector('input[name="customer[accepts_marketing]"]');
    return {
      first_name: val('modal-RegisterFirstName'),
      last_name: val('modal-RegisterLastName'),
      email: val('modal-RegisterEmail'),
      password: val('modal-RegisterPassword'),
      password_confirmation: val('modal-RegisterPasswordConfirm'),
      phone: meta.phone || val('modal-RegisterPhone'),
      first_name_kana: meta.first_name_kana || val('modal-RegisterFirstNameKana'),
      last_name_kana: meta.last_name_kana || val('modal-RegisterLastNameKana'),
      birthday: meta.birthdate || '',
      sms_opt_in: Boolean(meta.sms_opt_in),
      mail_opt_in: Boolean(meta.mail_opt_in),
      accepts_marketing: Boolean(acceptsMarketingEl?.checked),
    };
  }

  normalizeApiErrors(data) {
    const fieldMap = {
      email: 'modal-RegisterEmail',
      password: 'modal-RegisterPassword',
      password_confirmation: 'modal-RegisterPasswordConfirm',
      first_name: 'modal-RegisterFirstName',
      last_name: 'modal-RegisterLastName',
      phone: 'modal-RegisterPhone',
      first_name_kana: 'modal-RegisterFirstNameKana',
      last_name_kana: 'modal-RegisterLastNameKana',
      birthday: 'modal-RegisterBirthdate',
    };
    const errors = { summary: data.message || data.error || '', fields: {} };
    if (data.errors && typeof data.errors === 'object') {
      for (const [key, messages] of Object.entries(data.errors)) {
        const fieldId = fieldMap[key];
        if (fieldId) {
          errors.fields[fieldId] = Array.isArray(messages) ? messages[0] : String(messages);
        }
      }
    }
    return errors;
  }

  _displayServerErrors(form, errors) {
    // Clear previous errors
    form.querySelectorAll('.account-modal__error').forEach(el => {
      el.textContent = '';
      el.hidden = true;
    });
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    const summaryEl = form.closest('.account-modal__panel').querySelector('.account-modal__form-errors');
    if (summaryEl) {
      summaryEl.textContent = errors.summary || '';
      summaryEl.hidden = !errors.summary;
    }

    // Display field errors
    for (const [fieldId, message] of Object.entries(errors.fields)) {
      const errorEl = form.querySelector(`[data-error-for="${fieldId}"]`);
      const input = form.querySelector(`#${fieldId}`);
      if (errorEl && message) {
        errorEl.textContent = message;
        errorEl.hidden = false;
        if (input) input.classList.add('is-invalid');
      }
    }

    // Focus first invalid field or summary
    const firstInvalid = form.querySelector('.is-invalid') || summaryEl;
    if (firstInvalid && !firstInvalid.hidden) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (firstInvalid.tagName === 'INPUT') firstInvalid.focus();
    }
  }

  // ---------------------------------------------------------------------------
  // Submit button state
  // ---------------------------------------------------------------------------
  setSubmitting(form, busy) {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    btn.disabled = busy;
    btn.setAttribute('aria-busy', busy ? 'true' : 'false');
  }

  // ---------------------------------------------------------------------------
  // Field error helpers — look up error element inside the closest <form>
  // Avoids CSS.escape and cached form references entirely.
  // ---------------------------------------------------------------------------
  getErrorEl(input) {
    const form = input.closest('form');
    if (!form) return null;
    const all = form.querySelectorAll('[data-error-for]');
    for (let i = 0; i < all.length; i++) {
      if (all[i].dataset.errorFor === input.id) return all[i];
    }
    return null;
  }

  setFieldError(input, message) {
    if (!input) return;
    input.classList.add('is-invalid');
    const el = this.getErrorEl(input);
    if (el) { el.textContent = message; el.hidden = false; }
  }

  clearFieldError(input) {
    if (!input) return;
    input.classList.remove('is-invalid');
    const el = this.getErrorEl(input);
    if (el) { el.textContent = ''; el.hidden = true; }
  }

  // ---------------------------------------------------------------------------
  // Register validation
  // ---------------------------------------------------------------------------
  validateRegisterForm(form) {
    const lastName = form.querySelector('#modal-RegisterLastName');
    const firstName = form.querySelector('#modal-RegisterFirstName');
    const lastNameKana = form.querySelector('#modal-RegisterLastNameKana');
    const firstNameKana = form.querySelector('#modal-RegisterFirstNameKana');
    const birthdate = form.querySelector('#modal-RegisterBirthdate');
    const phone = form.querySelector('#modal-RegisterPhone');
    const email = form.querySelector('#modal-RegisterEmail');
    const password = form.querySelector('#modal-RegisterPassword');
    const passwordConfirm = form.querySelector('#modal-RegisterPasswordConfirm');
    const smsOptIn = form.querySelector('#modal-RegisterSmsOptIn');
    const mailOptIn = form.querySelector('#modal-RegisterMailOptIn');

    const requiredMsg = this.i18n.required || 'This field is required.';
    const errors = [];
    const pushError = (input, message) => {
      errors.push({ input, message });
      this.setFieldError(input, message);
    };

    const isBlank = (value) => !value || !String(value).trim();
    const kanaRegex = /^[\u30A0-\u30FFー\s]+$/;

    [lastName, firstName, lastNameKana, firstNameKana, phone, email, password, passwordConfirm].forEach((input) => {
      if (!input) return;
      this.clearFieldError(input);
    });
    if (birthdate) this.clearFieldError(birthdate);

    if (isBlank(lastName?.value)) pushError(lastName, requiredMsg);
    if (isBlank(firstName?.value)) pushError(firstName, requiredMsg);

    if (isBlank(lastNameKana?.value)) {
      pushError(lastNameKana, requiredMsg);
    } else if (!kanaRegex.test(String(lastNameKana.value).trim())) {
      pushError(lastNameKana, this.i18n.kana || 'Please use Katakana characters.');
    }

    if (isBlank(firstNameKana?.value)) {
      pushError(firstNameKana, requiredMsg);
    } else if (!kanaRegex.test(String(firstNameKana.value).trim())) {
      pushError(firstNameKana, this.i18n.kana || 'Please use Katakana characters.');
    }

    const birthdateIso = this.normalizeBirthdate(birthdate?.value);
    if (birthdate?.value && !birthdateIso) {
      pushError(birthdate, this.i18n.date || 'Please enter a valid date (YYYY/MM/DD).');
    }

    const phoneNormalized = this.normalizePhone(phone?.value);
    if (isBlank(phone?.value)) {
      pushError(phone, requiredMsg);
    } else if (!phoneNormalized) {
      pushError(phone, this.i18n.phone || 'Please enter a valid phone number.');
    }

    if (isBlank(email?.value)) {
      pushError(email, requiredMsg);
    } else if (!this.isValidEmail(email.value)) {
      pushError(email, this.i18n.email || 'Please enter a valid email address.');
    }

    const pass = String(password?.value || '');
    if (isBlank(pass)) {
      pushError(password, requiredMsg);
    } else if (pass.length < 8) {
      pushError(password, this.i18n.password_min || 'Password must be at least 8 characters.');
    }

    const passConfirm = String(passwordConfirm?.value || '');
    if (isBlank(passConfirm)) {
      pushError(passwordConfirm, requiredMsg);
    } else if (pass && passConfirm && pass !== passConfirm) {
      pushError(passwordConfirm, this.i18n.password_mismatch || 'Passwords do not match.');
    }

    if (errors.length) {
      return { ok: false, firstInvalid: errors[0].input, meta: {} };
    }

    return {
      ok: true,
      meta: {
        last_name_kana: String(lastNameKana?.value || '').trim(),
        first_name_kana: String(firstNameKana?.value || '').trim(),
        birthdate: birthdateIso || '',
        phone: phoneNormalized || String(phone?.value || '').trim(),
        sms_opt_in: Boolean(smsOptIn?.checked),
        mail_opt_in: Boolean(mailOptIn?.checked),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Birthdate picker — flatpickr with Japanese locale + fallback
  // Called once on first showPanel('register'); subsequent calls are no-ops.
  // ---------------------------------------------------------------------------
  initBirthdatePicker() {
    if (this._birthdatePicker) return; // already initialised

    const input  = document.getElementById('modal-RegisterBirthdate');
    const toggle = document.getElementById('modal-RegisterBirthdateToggle');
    if (!input) return;

    const doInit = () => {
      const locale =
        typeof flatpickr.l10ns !== 'undefined' && flatpickr.l10ns.ja
          ? flatpickr.l10ns.ja
          : 'default';

      const fp = flatpickr(input, {
        dateFormat:    'Y/m/d',
        allowInput:    true,
        disableMobile: false,
        locale,
        maxDate: 'today',
        minDate: '1900-01-01',
        // Append to body so modal overflow:auto never clips the calendar.
        appendTo: document.body,
        onReady(_d, _s, instance) {
          // flatpickr marks input readonly — remove for direct typing support.
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

      this._birthdatePicker = fp;
    };

    if (typeof flatpickr !== 'undefined') {
      doInit();
    } else {
      // flatpickr not yet available — poll until it is (handles slow networks).
      const interval = setInterval(() => {
        if (typeof flatpickr !== 'undefined') {
          clearInterval(interval);
          doInit();
        }
      }, 50);
    }
  }

  isValidEmail(email) {
    const value = String(email || '').trim();
    if (!value) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  normalizeBirthdate(value) {
    // Prefer flatpickr's parsed Date object — avoids string-parse edge-cases
    if (this._birthdatePicker?.selectedDates?.length) {
      const d = this._birthdatePicker.selectedDates[0];
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${d.getFullYear()}-${mm}-${dd}`;
    }
    // Fallback: parse manually-typed YYYY/MM/DD or YYYY-MM-DD
    const raw = String(value || '').trim();
    if (!raw) return '';
    const m = raw.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
    if (!m) return '';
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (year < 1900 || year > 2100) return '';
    if (month < 1 || month > 12) return '';
    if (day < 1 || day > 31) return '';
    const dt = new Date(Date.UTC(year, month - 1, day));
    if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) return '';
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  normalizePhone(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (!/^[0-9+()\-\s]+$/.test(raw)) return '';
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 8) return '';
    // Already in E.164 format
    if (raw.startsWith('+')) return `+${digits}`;
    // Japanese local number: starts with 0, e.g. 0123232222 → +81123232222
    if (digits.startsWith('0')) return `+81${digits.slice(1)}`;
    // Assume already a national number without leading 0
    return `+81${digits}`;
  }

  applyCustomerNote(form, meta) {
    const noteInput = form.querySelector('#modal-RegisterCustomerNote');
    if (!noteInput) return;

    const lines = [
      'DP_META_V1',
      `last_name_kana=${meta.last_name_kana || ''}`,
      `first_name_kana=${meta.first_name_kana || ''}`,
      `birthdate=${meta.birthdate || ''}`,
      `sms_opt_in=${meta.sms_opt_in ? 'true' : 'false'}`,
      `mail_opt_in=${meta.mail_opt_in ? 'true' : 'false'}`,
      `phone=${meta.phone || ''}`,
    ];
    noteInput.value = lines.join('\n');
  }

  open(view = 'email') {
    if (!this.modal) return;

    // If user has a valid CA token (PKCE session), go to account page directly
    const caToken = sessionStorage.getItem('dp_ca_token');
    const caExp   = parseInt(sessionStorage.getItem('dp_ca_token_exp') || '0', 10);
    if (caToken && (!caExp || Date.now() < caExp)) {
      window.location.href = '/pages/my-account';
      return;
    }

    // Check URL for panel state
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'register') {
      view = 'register';
    } else if (window.location.hash === '#recover') {
      view = 'login';
    }

    this.modal.removeAttribute('hidden');
    this.overlay?.classList.add('is-open');

    // Force reflow so transition plays
    this.modal.offsetHeight;
    this.modal.classList.add('is-open');

    this.showPanel(view);
    this.modal.focus?.();
    document.body.style.overflow = 'hidden';
  }

  // view: 'email' | 'login' | 'register'
  // email: optional, pre-populates badge and hidden inputs
  showPanel(view, email) {
    const panels = ['email', 'login', 'register'];
    const panelEls = {
      email: this.panelEmail,
      login: this.panelLogin,
      register: this.panelRegister,
    };

    // Populate email from current step if not provided
    if (!email) {
      email = document.getElementById('modal-EmailStep')?.value?.trim()
        || document.getElementById('modal-CustomerEmail')?.value?.trim()
        || document.getElementById('modal-RegisterEmail')?.value?.trim()
        || '';
    }

    // Hide all panels
    panels.forEach((p) => panelEls[p]?.setAttribute('hidden', ''));

    // Show target panel
    panelEls[view]?.removeAttribute('hidden');

    // Sync email into each panel
    if (email) {
      const emailStep = document.getElementById('modal-EmailStep');
      if (emailStep && !emailStep.value) emailStep.value = email;

      // Login badge + hidden input
      const loginHidden = document.getElementById('modal-CustomerEmail');
      if (loginHidden) loginHidden.value = email;
      const loginDisplay = document.getElementById('modal-LoginEmailDisplay');
      if (loginDisplay) loginDisplay.textContent = email;

      // Register badge + hidden input
      const registerHidden = document.getElementById('modal-RegisterEmail');
      if (registerHidden) registerHidden.value = email;
      const registerDisplay = document.getElementById('modal-RegisterEmailDisplay');
      if (registerDisplay) registerDisplay.textContent = email;
    }

    if (view === 'register') {
      this.resetRegisterForm();
      // Restore email after reset (reset clears hidden inputs too)
      if (email) {
        const registerHidden = document.getElementById('modal-RegisterEmail');
        if (registerHidden) registerHidden.value = email;
        const registerDisplay = document.getElementById('modal-RegisterEmailDisplay');
        if (registerDisplay) registerDisplay.textContent = email;
      }
      this.initBirthdatePicker();
    }

    // Scroll modal body to top on panel switch
    const body = this.modal?.querySelector('.account-modal__body');
    if (body) body.scrollTop = 0;
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('is-open');
    this.overlay?.classList.remove('is-open');
    document.body.style.overflow = '';

    // Re-enable submit buttons so reopening the modal works correctly
    ['CustomerRegisterForm'].forEach((id) => {
      const form = document.getElementById(id);
      if (form) this.setSubmitting(form, false);
    });

    const onEnd = () => {
      this.modal.setAttribute('hidden', '');
      this.modal.removeEventListener('transitionend', onEnd);
    };
    this.modal.addEventListener('transitionend', onEnd);
  }

  resetRegisterForm() {
    const form = document.getElementById('CustomerRegisterForm');
    if (!form) return;
    // Reset all inputs
    form.querySelectorAll('input').forEach((el) => {
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = false;
      } else if (
        el.type === 'hidden' &&
        (el.name === 'form_type' || el.name === 'utf8')
      ) {
        // Do not reset Shopify system hidden fields
        return;
      } else {
        el.value = '';
      }
    });
    // Hide all error messages
    form.querySelectorAll('.account-modal__error').forEach((el) => {
      el.textContent = '';
      el.hidden = true;
    });
    // Remove invalid class
    form.querySelectorAll('.is-invalid').forEach((el) => {
      el.classList.remove('is-invalid');
    });
    // Reset flatpickr if exists
    if (this._birthdatePicker) {
      this._birthdatePicker.clear();
    }
  }

  // ---------------------------------------------------------------------------
  // PKCE OAuth helpers
  // ---------------------------------------------------------------------------

  async startPkceLogin() {
    if (!this.clientId || !this.shopId || !this.shopDomain) {
      console.error('[PKCE] Missing clientId, shopId, or shopDomain. Check theme settings.');
      return;
    }

    const verifier   = this._generateCodeVerifier();
    const challenge  = await this._generateCodeChallenge(verifier);
    const state      = this._randomString(32);
    const nonce      = this._randomString(16);
    const redirectUri = 'https://' + this.shopDomain + '/pages/auth-callback';

    sessionStorage.setItem('dp_pkce_verifier', verifier);
    sessionStorage.setItem('dp_oauth_state',   state);
    sessionStorage.setItem('dp_pkce_nonce',    nonce);
    sessionStorage.setItem('dp_post_login_redirect', '/pages/my-account');

    const params = new URLSearchParams({
      client_id:             this.clientId,
      response_type:         'code',
      redirect_uri:          redirectUri,
      scope:                 'openid email',
      state:                 state,
      nonce:                 nonce,
      code_challenge:        challenge,
      code_challenge_method: 'S256',
    });

    window.location.href =
      'https://shopify.com/authentication/' + this.shopId + '/oauth/authorize?' + params.toString();
  }

  _generateCodeVerifier() {
    const arr = new Uint8Array(64);
    crypto.getRandomValues(arr);
    return btoa(String.fromCharCode(...arr))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  async _generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data    = encoder.encode(verifier);
    const digest  = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  _randomString(length) {
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);
    return btoa(String.fromCharCode(...arr))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      .slice(0, length);
  }

  isOpen() {
    return this.modal && !this.modal.hasAttribute('hidden');
  }
}

// Initialise once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new AccountModal());
} else {
  new AccountModal();
}
