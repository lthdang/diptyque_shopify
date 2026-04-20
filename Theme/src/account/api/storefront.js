/**
 * api/storefront.js — Thin Shopify Storefront GraphQL wrapper
 */

'use strict';

export class DiptyqueStorefrontClient {
  /**
   * @param {string} endpoint  Full Storefront GraphQL endpoint URL
   * @param {string} token     Public Storefront access token
   */
  constructor(endpoint, token) {
    if (!endpoint) throw new Error('[DiptyqueStorefrontClient] endpoint is required');
    if (!token)    throw new Error('[DiptyqueStorefrontClient] token is required');
    this._endpoint = endpoint;
    this._token    = token;
  }

  /**
   * Execute a GraphQL operation.
   * @param {string} query
   * @param {Object} [variables]
   * @returns {Promise<Object>}  `data` field from the GraphQL response
   */
  async request(query, variables = {}) {
    let res;
    try {
      res = await fetch(this._endpoint, {
        method:  'POST',
        headers: {
          'Content-Type':                      'application/json',
          'Accept':                            'application/json',
          'X-Shopify-Storefront-Access-Token': this._token,
        },
        body: JSON.stringify({ query, variables }),
      });
    } catch (networkErr) {
      throw new Error('[StorefrontClient] Network error: ' + networkErr.message);
    }

    if (!res.ok) {
      throw new Error('[StorefrontClient] HTTP ' + res.status + ' ' + res.statusText);
    }

    const json = await res.json();

    if (json.errors && json.errors.length) {
      const msg = json.errors.map(e => e.message).join('; ');
      throw new Error('[StorefrontClient] GraphQL error: ' + msg);
    }

    return json.data || {};
  }
}
