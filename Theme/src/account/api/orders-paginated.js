/**
 * api/orders-paginated.js — Paginated Order history API
 * Uses the Storefront API with cursor-based pagination.
 */

'use strict';

const GET_ORDERS_PAGINATED_QUERY = /* graphql */ `
  query GetCustomerOrdersPaginated($token: String!, $first: Int!, $after: String) {
    customer(customerAccessToken: $token) {
      orders(first: $first, after: $after, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          cursor
          node {
            id
            name
            processedAt
            financialStatus
            fulfillmentStatus
            statusUrl
            currentTotalPrice { amount currencyCode }
            subtotalPrice     { amount currencyCode }
            totalTax          { amount currencyCode }
            shippingAddress {
              firstName lastName
              address1 address2
              city province zip country phone
            }
            billingAddress {
              firstName lastName
              address1 address2
              city province zip country phone
            }
            successfulFulfillments(first: 5) {
              trackingCompany
              trackingInfo { number url }
            }
            totalShippingPrice { amount currencyCode }
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                  originalTotalPrice { amount currencyCode }
                  variant {
                    id
                    title
                    image { url(transform: { maxWidth: 240 }) altText }
                    price { amount currencyCode }
                  }
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export class DiptyqueOrderPaginatedApi {
  /** @param {import('./storefront').DiptyqueStorefrontClient} storefrontClient */
  constructor(storefrontClient) {
    this._sf = storefrontClient;
  }

  /**
   * Fetch a page of orders.
   * @param {string}      accessToken
   * @param {number}      [pageSize=10]
   * @param {string|null} [after=null]   cursor for next page
   * @returns {Promise<{ orders: Object[], pageInfo: Object }>}
   */
  async list(accessToken, pageSize = 10, after = null) {
    const variables = { token: accessToken, first: pageSize };
    if (after) variables.after = after;

    const data = await this._sf.request(GET_ORDERS_PAGINATED_QUERY, variables);
    const conn  = data?.customer?.orders ?? { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };

    return {
      orders:   conn.edges.map(e => ({ ...e.node, _cursor: e.cursor })),
      pageInfo: conn.pageInfo,
    };
  }
}
