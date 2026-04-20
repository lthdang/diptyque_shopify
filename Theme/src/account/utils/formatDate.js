/**
 * utils/formatDate.js — Date formatter for order history
 */

'use strict';

/**
 * Format an ISO date string with a given format.
 * @param {string} isoString  e.g. "2024-10-01T12:00:00Z"
 * @param {string} [format]   e.g. 'YYYY/MM/DD' (default), 'YYYY年M月D日'
 * @returns {string}
 */
export function formatDate(isoString, format = 'YYYY/MM/DD') {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d)) return String(isoString);
  const map = {
    YYYY: d.getFullYear(),
    MM: String(d.getMonth() + 1).padStart(2, '0'),
    M: d.getMonth() + 1,
    DD: String(d.getDate()).padStart(2, '0'),
    D: d.getDate(),
  };
  return format.replace(/YYYY|MM|DD|M|D/g, (key) => map[key]);
}
