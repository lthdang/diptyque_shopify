/**
 * utils/formatPrice.js — Price formatter for order history
 */

'use strict';

/**
 * Format a Shopify money object to a localized string.
 * @param {{ amount: string, currencyCode: string }} money
 * @returns {string}  e.g. "¥12,000"
 */
export function formatPrice(money) {
  if (!money) return '';
  const amount   = parseFloat(money.amount ?? 0);
  const currency = money.currencyCode ?? 'JPY';
  try {
    return new Intl.NumberFormat('ja-JP', {
      style:    'currency',
      currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
