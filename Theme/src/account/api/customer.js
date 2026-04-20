/**
 * api/customer.js — Customer domain API
 * Handles profile, password, metafields, and native session mutations.
 */

'use strict';

// ── GraphQL ────────────────────────────────────────────────────────────────

const FETCH_CUSTOMER_QUERY = /* graphql */ `
  query GetCustomer($token: String!) {
    customer(customerAccessToken: $token) {
      id firstName lastName email phone acceptsMarketing
      metafields(identifiers: [
        { namespace: "registration", key: "first_name_kana" }
        { namespace: "registration", key: "last_name_kana" }
        { namespace: "registration", key: "birthday" }
      ]) { namespace key value type }
      orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
        edges { node {
          id name processedAt financialStatus fulfillmentStatus
          totalPrice { amount currencyCode }
          lineItems(first: 50) {
            edges { node {
              title quantity
              variant {
                title
                image { url(transform: { maxWidth: 120 }) }
                price { amount currencyCode }
              }
            }}
          }
        }}
      }
      defaultAddress { id firstName lastName address1 city zip country phone }
      addresses(first: 20) {
        edges { node { id firstName lastName address1 address2 city province zip country phone } }
      }
    }
  }
`;

const CREATE_TOKEN_MUTATION = /* graphql */ `
  mutation CustomerTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken { accessToken expiresAt }
      customerUserErrors  { field message code }
    }
  }
`;

const UPDATE_CUSTOMER_MUTATION = /* graphql */ `
  mutation CustomerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
    customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
      customer { firstName lastName email phone }
      customerAccessToken { accessToken expiresAt }
      customerUserErrors  { field message code }
    }
  }
`;

const METAFIELDS_SET_MUTATION = /* graphql */ `
  mutation CustomerMetafieldsSet($metafields: [CustomerMetafieldsSetInput!]!) {
    customerMetafieldsSet(metafields: $metafields) {
      metafields { namespace key value }
      userErrors  { field message code }
    }
  }
`;

const CUSTOMER_ACCOUNT_API_ENDPOINT =
  'https://shopify.com/account/customer/api/2024-10/graphql';

// ── Phone normalization ────────────────────────────────────────────────────

/**
 * Convert a phone number to E.164 format for Japan (+81).
 * Accepts: +819012345678, 09012345678, 090-1234-5678, etc.
 * Returns null if the number cannot be reliably normalized.
 * @param {string} raw
 * @returns {string|null}
 */
function _toE164Japan(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  // Already E.164
  if (/^\+\d{7,15}$/.test(trimmed)) return trimmed;
  // Strip formatting characters
  const digits = trimmed.replace(/[\s\-().]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  // Japanese domestic: starts with 0, 10–11 digits
  if (/^0\d{9,10}$/.test(digits)) {
    return '+81' + digits.slice(1); // replace leading 0 with +81
  }
  return null;
}

// ── DiptyqueCustomerApi ────────────────────────────────────────────────────

export class DiptyqueCustomerApi {
  /**
   * @param {import('./storefront').DiptyqueStorefrontClient} storefrontClient
   * @param {import('./backend').DiptyqueBackendClient}       backendClient
   */
  constructor(storefrontClient, backendClient) {
    this._sf = storefrontClient;
    this._be = backendClient;
  }

  // ── Auth ───────────────────────────────────────────────────────────────────

  async createAccessToken(email, password) {
    const data = await this._sf.request(CREATE_TOKEN_MUTATION, {
      input: { email, password },
    });
    const result     = data.customerAccessTokenCreate;
    const userErrors = result?.customerUserErrors || [];
    if (userErrors.length || !result?.customerAccessToken?.accessToken) {
      const err       = new Error(userErrors[0]?.message || 'Invalid credentials');
      err.isAuthError = true;
      err.code        = userErrors[0]?.code || 'UNIDENTIFIED_CUSTOMER';
      throw err;
    }
    return result.customerAccessToken; // { accessToken, expiresAt }
  }

  async verifyPassword(email, password) {
    const result = await this.createAccessToken(email, password).catch(() => {
      const pwdErr          = new Error('currentPasswordInvalid');
      pwdErr.isPasswordError = true;
      pwdErr.status         = 401;
      throw pwdErr;
    });
    return result.accessToken;
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  async fetchCustomer(accessToken) {
    const data = await this._sf.request(FETCH_CUSTOMER_QUERY, { token: accessToken });
    return data.customer || null;
  }

  // ── Profile update (Backend) ───────────────────────────────────────────────

  async updateProfile(fields) {
    return this._be.post('/api/customers/account/update-profile', {
      first_name:       fields.firstName,
      last_name:        fields.lastName,
      first_name_kana:  fields.first_name_kana,
      last_name_kana:   fields.last_name_kana,
      email:            fields.email,
      phone:            fields.phone,
      birthday:         fields.birthday || '',
      current_password: fields.current_password || '',
    });
  }

  // ── Password update (Backend) ──────────────────────────────────────────────

  // Backend verifies current_password internally via its own Storefront API
  // call (server-side), so no browser-side verifyPassword step is needed.
  async updatePassword(currentPassword, newPassword) {
    return this._be.post('/api/customers/account/update-password', {
      current_password: currentPassword,
      new_password:     newPassword,
    });
  }

  // ── Metafields (Customer Account API / PKCE) ───────────────────────────────

  async updateMetafields(fields) {
    const metafieldsInput = [];
    if (fields.last_name_kana) {
      metafieldsInput.push({
        namespace: 'registration', key: 'last_name_kana',
        value: fields.last_name_kana, type: 'single_line_text_field',
      });
    }
    if (fields.first_name_kana) {
      metafieldsInput.push({
        namespace: 'registration', key: 'first_name_kana',
        value: fields.first_name_kana, type: 'single_line_text_field',
      });
    }
    if (fields.birthday) {
      metafieldsInput.push({
        namespace: 'registration', key: 'birthday',
        value: fields.birthday, type: 'date',
      });
    }

    if (!metafieldsInput.length) return;

    const caToken = sessionStorage.getItem('dp_ca_token');
    if (!caToken) {
      console.warn('[CustomerApi] No dp_ca_token — metafields not updated');
      return;
    }

    const res = await fetch(CUSTOMER_ACCOUNT_API_ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: caToken },
      body:    JSON.stringify({
        query:     METAFIELDS_SET_MUTATION,
        variables: { metafields: metafieldsInput },
      }),
    });

    if (!res.ok) throw new Error('[CustomerApi] Customer Account API HTTP ' + res.status);
    const json = await res.json();
    if (json.errors?.length) throw new Error(json.errors[0]?.message || 'Metafield GraphQL error');
    const userErrors = json.data?.customerMetafieldsSet?.userErrors || [];
    if (userErrors.length) throw new Error(userErrors[0]?.message || 'Metafield error');
  }

  // ── Native session mutations ───────────────────────────────────────────────

  async updateProfileNative(fields, csrfToken) {
    const body = new URLSearchParams();
    body.append('form_type', 'customer');
    body.append('utf8',      '✓');
    body.append('customer[first_name]', fields.firstName || '');
    body.append('customer[last_name]',  fields.lastName  || '');
    body.append('customer[email]',      fields.email     || '');

    // Shopify native form requires E.164 phone format (+819012345678).
    // Normalize Japanese domestic format; skip if conversion is not possible.
    if (fields.phone) {
      const e164 = _toE164Japan(fields.phone);
      if (e164) body.append('customer[phone]', e164);
    }

    if (csrfToken) body.append('authenticity_token', csrfToken);

    const res = await fetch('/account', {
      method:      'POST',
      headers:     { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:        body.toString(),
      credentials: 'same-origin',
    });

    // Shopify returns 422 when validation fails (e.g. taken email, bad phone).
    // Surface the status so the controller can give the user a useful message.
    if (!res.ok && !res.redirected) {
      const err    = new Error('Native profile update failed: HTTP ' + res.status);
      err.status   = res.status;
      err.isNative = true;
      throw err;
    }
  }

  async updatePasswordNative(newPassword, confirmPassword, csrfToken) {
    const body = new URLSearchParams();
    body.append('form_type',                     'customer');
    body.append('utf8',                           '✓');
    body.append('customer[password]',              newPassword);
    body.append('customer[password_confirmation]', confirmPassword);
    if (csrfToken) body.append('authenticity_token', csrfToken);

    const res = await fetch('/account', {
      method:      'POST',
      headers:     { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:        body.toString(),
      credentials: 'same-origin',
    });
    if (!res.ok && !res.redirected) {
      throw new Error('Native password update failed: HTTP ' + res.status);
    }
  }
}
