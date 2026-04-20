/**
 * api/newsletter.js — Newsletter preferences API layer
 */

'use strict';

const FETCH_NEWSLETTER_PREFS_QUERY = /* graphql */ `
  query GetNewsletterPrefs($token: String!) {
    customer(customerAccessToken: $token) {
      metafields(identifiers: [
        { namespace: "registration", key: "mail_opt_in"   }
        { namespace: "registration", key: "sms_opt_in"    }
        { namespace: "registration", key: "postal_opt_in" }
      ]) { key value }
    }
  }
`;

export class DiptyqueNewsletterApi {
  /**
   * @param {import('./storefront.js').DiptyqueStorefrontClient} sf
   * @param {import('./backend.js').DiptyqueBackendClient} be
   */
  constructor(sf, be) {
    this._sf = sf;
    this._be = be;
  }

  /**
   * @param {string} customerAccessToken
   * @returns {Promise<{ sms_opt_in: boolean, mail_opt_in: boolean, postal_opt_in: boolean }>}
   */
  async fetchPreferences(customerAccessToken) {
    const data = await this._sf.request(FETCH_NEWSLETTER_PREFS_QUERY, {
      token: customerAccessToken,
    });

    const pairs = (data?.customer?.metafields ?? [])
      .filter(Boolean)
      .map((mf) => [mf.key, mf.value === 'true']);

    const mapped = Object.fromEntries(pairs);

    return {
      sms_opt_in: Boolean(mapped.sms_opt_in),
      mail_opt_in: Boolean(mapped.mail_opt_in),
      postal_opt_in: Boolean(mapped.postal_opt_in),
    };
  }

  /**
   * @param {{ sms_opt_in: boolean, mail_opt_in: boolean, postal_opt_in: boolean }} payload
   */
  async updatePreferences(payload) {
    return this._be.post('/api/customers/account/update-newsletter', payload);
  }
}
