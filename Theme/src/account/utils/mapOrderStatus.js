/**
 * utils/mapOrderStatus.js — Shopify financial/fulfillment status → UI label
 */

'use strict';

/** Map Shopify financialStatus → Japanese UI label + CSS modifier */
const FINANCIAL_STATUS_MAP = {
  PAID:              { label: '支払い済み',  modifier: 'paid' },
  PENDING:           { label: '処理中',    modifier: 'pending' },
  AUTHORIZED:        { label: '処理中',    modifier: 'pending' },
  PARTIALLY_PAID:    { label: '処理中',    modifier: 'pending' },
  REFUNDED:          { label: '返金済み',  modifier: 'refunded' },
  PARTIALLY_REFUNDED:{ label: '返金済み',  modifier: 'refunded' },
  VOIDED:            { label: 'キャンセル',modifier: 'cancelled' },
};

/** Map Shopify fulfillmentStatus → Japanese UI label */
const FULFILLMENT_STATUS_MAP = {
  FULFILLED:         { label: '配送済み',  modifier: 'fulfilled' },
  PARTIAL:           { label: '一部配送',  modifier: 'partial' },
  UNFULFILLED:       { label: '準備中',    modifier: 'unfulfilled' },
  IN_TRANSIT:        { label: '配送中',    modifier: 'in-transit' },
  DELIVERED:         { label: '配達完了',  modifier: 'delivered' },
};

/**
 * @param {string} financialStatus
 * @returns {{ label: string, modifier: string }}
 */
export function mapFinancialStatus(financialStatus) {
  return FINANCIAL_STATUS_MAP[financialStatus?.toUpperCase()] ?? { label: '処理中', modifier: 'pending' };
}

/**
 * @param {string|null} fulfillmentStatus
 * @returns {{ label: string, modifier: string }}
 */
export function mapFulfillmentStatus(fulfillmentStatus) {
  if (!fulfillmentStatus) return null;
  return FULFILLMENT_STATUS_MAP[fulfillmentStatus?.toUpperCase()] ?? null;
}

/**
 * Determine which tab filter a given order belongs to.
 * @param {Object} order
 * @returns {'all'|'processing'|'shipped'|'cancelled'|'returned'}
 */
export function getOrderTab(order) {
  const fs = (order.financialStatus ?? '').toUpperCase();
  const ff = (order.fulfillmentStatus ?? '').toUpperCase();

  if (fs === 'REFUNDED' || fs === 'PARTIALLY_REFUNDED') return 'returned';
  if (fs === 'VOIDED') return 'cancelled';
  if (ff === 'FULFILLED' || ff === 'DELIVERED' || ff === 'IN_TRANSIT') return 'shipped';
  return 'processing';
}
