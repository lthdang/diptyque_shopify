/**
 * utils.js — Shared pure utilities
 * No dependencies on other account modules.
 */

'use strict';

// ── i18n ───────────────────────────────────────────────────────────────────

/**
 * Parse a <script type="application/json"> element by id and return a
 * translation lookup function t(key, fallback).
 * @param {string} elementId
 * @returns {(key: string, fallback?: string) => string}
 */
export function loadI18n(elementId) {
  let strings = {};
  try {
    const el = document.getElementById(elementId);
    if (el && el.textContent.trim() !== 'null') {
      strings = JSON.parse(el.textContent) || {};
    }
  } catch (e) {
    console.warn('[DiptyqueAccount] Failed to parse i18n from #' + elementId, e);
  }
  return function t(key, fallback) {
    if (key in strings) return strings[key];
    if (fallback !== undefined) return fallback;
    console.warn('[DiptyqueAccount] Missing i18n key:', key);
    return key;
  };
}

// ── Config loader ──────────────────────────────────────────────────────────

/**
 * Parse a <script type="application/json"> element into an object.
 * @param {string} elementId
 * @returns {Object}
 */
export function loadConfig(elementId) {
  try {
    const el = document.getElementById(elementId);
    if (el) return JSON.parse(el.textContent) || {};
  } catch (e) {
    console.warn('[DiptyqueAccount] Failed to parse config from #' + elementId, e);
  }
  return {};
}

// ── HTML escaping ──────────────────────────────────────────────────────────

/** Safely escape a string for HTML attribute / innerHTML insertion. */
export function escapeHtml(str) {
  if (!str && str !== 0) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// ── Date helpers ───────────────────────────────────────────────────────────

/** Convert stored ISO date "YYYY-MM-DD" → display "YYYY/MM/DD". */
export function isoToDisplayDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || '';
  return iso.replace(/-/g, '/');
}

/** Convert display date "YYYY/MM/DD" → stored ISO "YYYY-MM-DD". */
export function displayToIsoDate(display) {
  if (!display || !/^\d{4}\/\d{2}\/\d{2}$/.test(display)) return display || '';
  return display.replace(/\//g, '-');
}

// ── Money helpers ──────────────────────────────────────────────────────────

// ── GID helpers ────────────────────────────────────────────────────────────

/**
 * Extract the numeric ID from a Shopify GID.
 * "gid://shopify/MailingAddress/12345?model_name=CustomerAddress" → 12345
 * @param {string|null} gid
 * @returns {number|null}
 */
export function gidToNumericId(gid) {
  if (!gid) return null;
  const m = gid.match(/\/(\d+)/);
  return m ? Number(m[1]) : null;
}

// ── Status translation helpers ─────────────────────────────────────────────

export function translateOrderStatus(status) {
  const map = {
    PAID: '支払い済み',
    PENDING: '保留中',
    REFUNDED: '返金済み',
    PARTIALLY_REFUNDED: '一部返金',
    VOIDED: '無効',
    AUTHORIZED: '承認済み',
  };
  return map[status] || status || '—';
}

export function translateFulfillmentStatus(status) {
  const map = {
    FULFILLED: '発送済み',
    PARTIAL: '一部発送',
    UNFULFILLED: '未発送',
    RESTOCKED: '再入荷',
  };
  return map[status] || status || '未発送';
}

// ── Metafield helpers ──────────────────────────────────────────────────────

/**
 * Find a metafield value from an array of { namespace, key, value } objects.
 * @param {Array} metafields
 * @param {string} namespace
 * @param {string} key
 * @returns {string}
 */
export function getMetafieldValue(metafields, namespace, key) {
  if (!Array.isArray(metafields)) return '';
  const mf = metafields.find(m => m && m.namespace === namespace && m.key === key);
  return mf ? (mf.value || '') : '';
}

// ── Province normalisation ─────────────────────────────────────────────────

const PREFECTURE_EN_JA = {
  'Aichi': '愛知県', 'Akita': '秋田県', 'Aomori': '青森県', 'Chiba': '千葉県',
  'Ehime': '愛媛県', 'Fukui': '福井県', 'Fukuoka': '福岡県', 'Fukushima': '福島県',
  'Gifu': '岐阜県', 'Gunma': '群馬県', 'Hiroshima': '広島県',
  'Hokkaido': '北海道', 'Hokkaidō': '北海道',
  'Hyogo': '兵庫県', 'Hyōgo': '兵庫県',
  'Ibaraki': '茨城県', 'Ishikawa': '石川県', 'Iwate': '岩手県',
  'Kagawa': '香川県', 'Kagoshima': '鹿児島県', 'Kanagawa': '神奈川県',
  'Kochi': '高知県', 'Kōchi': '高知県',
  'Kumamoto': '熊本県', 'Kyoto': '京都府', 'Kyōto': '京都府',
  'Mie': '三重県', 'Miyagi': '宮城県', 'Miyazaki': '宮崎県',
  'Nagano': '長野県', 'Nagasaki': '長崎県', 'Nara': '奈良県',
  'Niigata': '新潟県',
  'Oita': '大分県', 'Ōita': '大分県',
  'Okayama': '岡山県', 'Okinawa': '沖縄県',
  'Osaka': '大阪府', 'Ōsaka': '大阪府',
  'Saga': '佐賀県', 'Saitama': '埼玉県', 'Shiga': '滋賀県',
  'Shimane': '島根県', 'Shizuoka': '静岡県', 'Tochigi': '栃木県', 'Tokushima': '徳島県',
  'Tokyo': '東京都', 'Tōkyō': '東京都',
  'Tottori': '鳥取県', 'Toyama': '富山県',
  'Wakayama': '和歌山県',
  'Yamagata': '山形県', 'Yamaguchi': '山口県', 'Yamanashi': '山梨県',
};

/** Convert an English prefecture name to Japanese. */
export function normalizeProvince(province) {
  return PREFECTURE_EN_JA[province] || province;
}
