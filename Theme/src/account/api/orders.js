/**
 * api/orders.js — Order history API
 */

'use strict';

const GET_ORDERS_QUERY = /* graphql */ `
  query GetCustomerOrders($token: String!, $first: Int!) {
    customer(customerAccessToken: $token) {
      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
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
    }
  }
`;

export class DiptyqueOrderApi {
  /** @param {import('./storefront').DiptyqueStorefrontClient} storefrontClient */
  constructor(storefrontClient) {
    this._sf = storefrontClient;
  }

  /**
   * Fetch the customer's recent orders.
   * @param {string} accessToken
   * @param {number} [limit=20]
   * @returns {Promise<Object[]>}
   */
  async list(accessToken, limit = 20) {
    const data = await this._sf.request(GET_ORDERS_QUERY, {
      token: accessToken,
      first: limit,
    });
    return (data.customer?.orders?.edges ?? []).map(e => e.node);
  }
}
