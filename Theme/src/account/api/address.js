/**
 * api/address.js — Address domain API
 * Merges Storefront (canonical) + Backend (kana, default flags) data.
 */

'use strict';

import { gidToNumericId, normalizeProvince } from '../utils/index.js';

const GET_ADDRESSES_QUERY = /* graphql */ `
  query GetCustomerAddresses($token: String!) {
    customer(customerAccessToken: $token) {
      defaultAddress { id }
      addresses(first: 50) {
        edges { node {
          id firstName lastName name company
          address1 address2 city province provinceCode
          country countryCodeV2 zip phone
        }}
      }
    }
  }
`;

export class DiptyqueAddressApi {
  /**
   * @param {import('./storefront').DiptyqueStorefrontClient} storefrontClient
   * @param {import('./backend').DiptyqueBackendClient}       backendClient
   */
  constructor(storefrontClient, backendClient) {
    this._sf = storefrontClient;
    this._be = backendClient;
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  async list(accessToken) {
    const [sfData, beData] = await Promise.all([
      this._sf.request(GET_ADDRESSES_QUERY, { token: accessToken }),
      this._be.post('/api/customers/account/addresses').catch(() => ({})),
    ]);

    const customer = sfData?.customer;
    if (!customer) return [];

    const defaultGid = customer.defaultAddress?.id ?? null;

    // Build extension_attributes map keyed by numeric address ID
    const extMap = {};
    for (const addr of (beData.addresses ?? [])) {
      extMap[String(addr.id)] = addr.extension_attributes ?? null;
    }

    return (customer.addresses?.edges ?? []).map(({ node }) => {
      const numericId = gidToNumericId(node.id);
      return {
        id:            numericId,
        first_name:    node.firstName     ?? null,
        last_name:     node.lastName      ?? null,
        name:          node.name          ?? null,
        company:       node.company       ?? null,
        address1:      node.address1      ?? null,
        address2:      node.address2      ?? null,
        city:          node.city          ?? null,
        province:      normalizeProvince(node.province ?? ''),
        province_code: node.provinceCode  ?? null,
        country:       node.country       ?? null,
        country_code:  node.countryCodeV2 ?? null,
        zip:           node.zip           ?? null,
        phone:         node.phone         ?? null,
        default:       defaultGid != null && node.id === defaultGid,
        extension_attributes: extMap[String(numericId)] ?? null,
      };
    });
  }

  // ── Write ──────────────────────────────────────────────────────────────────

  create(fields) {
    return this._be.post('/api/customers/account/addresses/create', fields);
  }

  update(addressId, fields) {
    return this._be.post('/api/customers/account/addresses/update', {
      address_id: addressId, ...fields,
    });
  }

  delete(addressId) {
    return this._be.post('/api/customers/account/addresses/delete', {
      address_id: addressId,
    });
  }
}
