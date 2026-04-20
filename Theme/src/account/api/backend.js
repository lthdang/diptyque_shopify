/**
 * api/backend.js — Thin Diptyque backend REST wrapper
 */

'use strict';

export class DiptyqueBackendClient {
  /**
   * @param {string}          baseUrl   Backend base URL
   * @param {() => string|null} getToken  Callback returning current access token
   */
  constructor(baseUrl, getToken) {
    if (!baseUrl)  throw new Error('[DiptyqueBackendClient] baseUrl is required');
    if (!getToken) throw new Error('[DiptyqueBackendClient] getToken callback is required');
    this._base     = baseUrl.replace(/\/+$/, '');
    this._getToken = getToken;
  }

  /**
   * POST JSON to a backend endpoint.
   * Automatically merges `customer_access_token` into the request body.
   * @param {string} path   e.g. "/api/customers/account/addresses/create"
   * @param {Object} [body]
   * @returns {Promise<Object>}
   */
  async post(path, body = {}) {
    const url = this._base + path;

    let res;
    try {
      res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          customer_access_token: this._getToken(),
          ...body,
        }),
      });
    } catch (networkErr) {
      throw new Error('[BackendClient] Network error: ' + networkErr.message);
    }

    let json;
    try { json = await res.json(); } catch { json = {}; }

    if (!res.ok || json.success === false) {
      const err    = new Error(json.message || 'HTTP ' + res.status);
      err.status   = res.status;
      err.code     = json.code;
      err.response = json;
      console.warn('[BackendClient]', res.status, url, json);
      throw err;
    }

    return json.data !== undefined ? json.data : json;
  }
}
