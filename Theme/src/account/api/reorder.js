/**
 * api/reorder.js — Re-add all items from a past order to the cart
 *
 * Uses Shopify's Ajax Cart API (`/cart/add.js`).
 * Works entirely client-side — no backend token required.
 *
 * @example
 *   import { reorder } from './reorder.js';
 *   const result = await reorder(order);
 *   // result → { added: [...], failed: [...], cartUrl: '/cart' }
 */

'use strict';

const CART_ADD_URL = '/cart/add.js';

/**
 * Extract { variantId (numeric), quantity } pairs from a Storefront order object.
 * Skips line items with no variant (deleted products).
 *
 * @param {Object} order  Shopify Storefront order node
 * @returns {{ variantId: number, quantity: number, title: string }[]}
 */
function extractLineItems(order) {
  const edges = order?.lineItems?.edges ?? [];
  const items = [];

  for (const { node } of edges) {
    if (!node.variant?.id) continue; // variant deleted / unavailable — skip

    // GID → numeric  e.g. "gid://shopify/ProductVariant/12345" → 12345
    const match = node.variant.id.match(/\/(\d+)$/);
    if (!match) continue;

    items.push({
      variantId: Number(match[1]),
      quantity:  node.quantity ?? 1,
      title:     node.title,
    });
  }

  return items;
}

/**
 * Add a single line item to the cart via Ajax Cart API.
 * Resolves with the response JSON on success, rejects with an enriched error.
 *
 * @param {{ variantId: number, quantity: number }} item
 * @returns {Promise<Object>}
 */
async function addToCart(item) {
  let res;
  try {
    res = await fetch(CART_ADD_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify({ id: item.variantId, quantity: item.quantity }),
    });
  } catch (networkErr) {
    const err     = new Error('Network error: ' + networkErr.message);
    err.item      = item;
    err.networkErr = true;
    throw err;
  }

  let json;
  try { json = await res.json(); } catch { json = {}; }

  if (!res.ok) {
    const err    = new Error(json.description || json.message || 'HTTP ' + res.status);
    err.item     = item;
    err.status   = res.status;
    err.response = json;
    throw err;
  }

  return json;
}

/**
 * Re-order: add all eligible line items from a past order back to the cart.
 *
 * @param {Object} order  Shopify Storefront order node (with lineItems edges)
 * @returns {Promise<{
 *   added:   { variantId: number, quantity: number, title: string }[],
 *   failed:  { variantId: number, title: string, reason: string }[],
 *   cartUrl: string,
 * }>}
 */
export async function reorder(order) {
  const items = extractLineItems(order);

  if (!items.length) {
    return { added: [], failed: [], cartUrl: '/cart' };
  }

  const added  = [];
  const failed = [];

  // Add items sequentially to avoid race conditions on the cart
  for (const item of items) {
    try {
      await addToCart(item);
      added.push(item);
    } catch (err) {
      console.warn('[reorder] Failed to add item to cart', item, err);
      failed.push({
        variantId: item.variantId,
        title:     item.title,
        reason:    err.message,
      });
    }
  }

  return { added, failed, cartUrl: '/cart' };
}
