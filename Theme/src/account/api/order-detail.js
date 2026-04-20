/**
 * api/order-detail.js — Storefront API for a single order
 */

'use strict';

const ORDER_QUERY = /* graphql */ `
  query GetOrder($orderId: ID!) {
    node(id: $orderId) {
      ... on Order {
        id
        orderNumber: orderNumber
        processedAt
        financialStatus
        fulfillmentStatus
        totalPrice { amount currencyCode }
        subtotalPrice { amount currencyCode }
        totalShippingPrice { amount currencyCode }
        successfulFulfillments(first: 5) {
          trackingCompany
          trackingInfo { number url }
        }
        lineItems(first: 50) {
          edges {
            node {
              title
              quantity
              originalTotalPrice { amount currencyCode }
              variant {
                id
                title
                image { url altText }
                price { amount currencyCode }
              }
            }
          }
        }
        shippingAddress {
          firstName lastName
          address1 address2
          city province zip country
        }
      }
    }
  }
`;

export class DiptyqueOrderDetailApi {
  /** @param {import('./storefront').DiptyqueStorefrontClient} storefrontClient */
  constructor(storefrontClient) {
    this._sf = storefrontClient;
  }

  /**
   * Fetch a single order by numeric ID.
   * @param {string|number} numericId
   * @returns {Promise<Object|null>}
   */
  async get(numericId) {
    const orderId = `gid://shopify/Order/${numericId}`;
    const data = await this._sf.request(ORDER_QUERY, { orderId });
    return data?.node ?? null;
  }
}
