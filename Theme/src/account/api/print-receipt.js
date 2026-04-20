/**
 * api/print-receipt.js — Opens a formatted print dialog for a single order
 */

'use strict';

import { formatDate }  from '../utils/formatDate.js';
import { formatPrice } from '../utils/formatPrice.js';

/**
 * Format an address object into HTML lines matching the image layout:
 * Name → zip,province,city → address1 → address2 → country → phone
 */
function fmtAddr(a) {
  if (!a) return '—';
  const name = [a.lastName, a.firstName].filter(Boolean).join('');
  const cityLine = [a.zip, a.province, a.city].filter(Boolean).join(',');
  return [name, cityLine, a.address1, a.address2, a.country, a.phone]
    .filter(Boolean)
    .join('<br>');
}

function buildReceiptHtml(order, t, paymentGateway) {
  /* ── Addresses ── */
  const bill = order.billingAddress  || order.shippingAddress || {};
  const ship = order.shippingAddress || {};

  /* ── Payment method ── */
  /* Liquid order.payment_gateway — injected via #oh-payment-gateways script block */
  const paymentMethod = paymentGateway || '';

  /* ── Shipping method: use trackingCompany from successfulFulfillments ── */
  let shippingMethod = '—';
  if (Array.isArray(order.successfulFulfillments) && order.successfulFulfillments.length) {
    const company = order.successfulFulfillments[0].trackingCompany;
    if (company) shippingMethod = company;
  }

  /* ── Shipping fee: use totalShippingPrice from query ── */
  let shippingFee = '¥0';
  if (order.totalShippingPrice?.amount) {
    shippingFee = formatPrice(order.totalShippingPrice);
  }

  /* ── Line items ── */
  const itemRows = (order.lineItems?.edges ?? []).map(({ node }) => {
    const label   = node.title + (
      node.variant?.title && node.variant.title !== 'Default Title'
        ? `<br><span style="font-size:11px;color:#555;">${node.variant.title}</span>` : ''
    );
    const sku     = node.variant?.sku ?? '';
    const excl    = node.originalTotalPrice ? formatPrice(node.originalTotalPrice) : '';
    const qty     = node.quantity ?? 1;
    // Tax per line: try taxLines, else derive 10%
    let taxAmt = '';
    if (node.taxLines?.length) {
      const sum = node.taxLines.reduce((s, l) => s + parseFloat(l.price?.amount ?? 0), 0);
      taxAmt = formatPrice({ amount: String(sum), currencyCode: node.originalTotalPrice?.currencyCode ?? 'JPY' });
    } else if (node.originalTotalPrice?.amount) {
      const derived = Math.round(parseFloat(node.originalTotalPrice.amount) / 11);
      taxAmt = formatPrice({ amount: String(derived), currencyCode: node.originalTotalPrice.currencyCode ?? 'JPY' });
    }
    const inclAmt = node.originalTotalPrice
      ? formatPrice({ amount: String(parseFloat(node.originalTotalPrice.amount)), currencyCode: node.originalTotalPrice.currencyCode })
      : '';
    return `<tr>
      <td class="td-left">${label}</td>
      <td class="td-center">${sku}</td>
      <td class="td-right">${excl}</td>
      <td class="td-center">${qty}</td>
      <td class="td-right">${taxAmt}</td>
      <td class="td-right">${inclAmt}</td>
    </tr>`;
  }).join('');

  /* ── Totals ── */
  const subtotal   = order.subtotalPrice      ? formatPrice(order.subtotalPrice)      : '';
  const taxTotal   = order.totalTax           ? formatPrice(order.totalTax)           : '';
  const grandTotal = order.currentTotalPrice  ? formatPrice(order.currentTotalPrice)  : '';

  /* ── Receipt number (Shopify order number as-is, no extra field) ── */
  const receiptNo = order.receiptNumber ?? order.orderNumber ?? order.name ?? '';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>領収書 — ${order.name}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #111;
      background: #fff;
      padding: 40px 48px;
      max-width: 820px;
      margin: 0 auto;
    }

    /* ─── Logo ─── */
    .logo-wrap {
      text-align: center;
      margin-bottom: 4px;
    }
    .logo-diptyque {
      font-family: 'Times New Roman', Times, serif;
      font-size: 56px;
      font-weight: 400;
      letter-spacing: 0.06em;
      line-height: 1;
    }
    .logo-paris {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 18px;
      letter-spacing: 0.22em;
      text-align: center;
      margin-bottom: 24px;
    }

    /* ─── Company info ─── */
    .company-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 10px;
    }
    .company-info {
      font-size: 12px;
      line-height: 1.8;
      text-align: right;
    }

    /* ─── Order meta dark header bar ─── */
    .order-meta-bar {
      background: #666;
      color: #fff;
      padding: 10px 14px;
      font-size: 13px;
      line-height: 1.8;
      margin-bottom: 0;
    }

    /* ─── Info table (addresses + payment/shipping) ─── */
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      border: 1px solid #bbb;
    }
    .info-table th {
      background: #f2f2f2;
      font-weight: 400;
      font-size: 13px;
      text-align: left;
      padding: 9px 14px;
      border: 1px solid #bbb;
      width: 50%;
    }
    .info-table td {
      vertical-align: top;
      font-size: 13px;
      padding: 10px 14px;
      border: 1px solid #bbb;
      line-height: 1.8;
      width: 50%;
    }

    /* ─── Items table ─── */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
    }
    .items-table thead tr {
      border-bottom: 1px solid #bbb;
    }
    .items-table th {
      font-size: 13px;
      font-weight: 400;
      padding: 8px 10px;
      text-align: left;
      border: none;
      border-bottom: 1px solid #bbb;
      white-space: nowrap;
    }
    .items-table td {
      font-size: 13px;
      padding: 10px 10px;
      border: none;
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }
    .td-left   { text-align: left; }
    .td-center { text-align: center; }
    .td-right  { text-align: right; white-space: nowrap; }

    /* ─── Totals ─── */
    .totals-wrap {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
    }
    .totals-table {
      border-collapse: collapse;
      font-size: 13px;
      min-width: 280px;
    }
    .totals-table td {
      padding: 3px 0 3px 20px;
      border: none;
    }
    .totals-table .t-label { text-align: right; color: #333; white-space: nowrap; }
    .totals-table .t-value { text-align: right; white-space: nowrap; }
    .totals-table .t-grand td { font-weight: bold; }

    @media print {
      html, body {
        width: 100%;
      }
      body {
        padding: 40px 48px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>

  <div class="logo-wrap">
    <div class="logo-diptyque">DIPTYQUE</div>
  </div>
  <div class="logo-paris">PARIS</div>

  <div class="company-row">
    <div class="company-info">
      Diptyque Japan株式会社<br>
      登録番号：T1011001062003
    </div>
  </div>

  <div class="order-meta-bar">
    領収書番号${receiptNo}<br>
    注文 # ${order.name}<br>
    注文日: ${formatDate(order.processedAt, 'YYYY/MM/DD')}
  </div>

  <table class="info-table">
    <tr>
      <th>ご請求先：</th>
      <th>発送先：</th>
    </tr>
    <tr>
      <td>${fmtAddr(bill)}</td>
      <td>${fmtAddr(ship)}</td>
    </tr>
    <tr>
      <th>お支払方法：</th>
      <th>発送方法：</th>
    </tr>
    <tr>
      <td>${paymentMethod}</td>
      <td>${shippingMethod}<br><br>（配送料合計 ${shippingFee}）</td>
    </tr>
  </table>

  <table class="items-table">
    <thead>
      <tr>
        <th class="td-left" style="width:38%;">製品</th>
        <th class="td-center">SKU</th>
        <th class="td-right">合計 (税抜き)</th>
        <th class="td-center">数量</th>
        <th class="td-right">税 (10%)</th>
        <th class="td-right">合計</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals-wrap">
    <table class="totals-table">
      <tr><td class="t-label">合計:</td><td class="t-value">${subtotal}</td></tr>
      <tr><td class="t-label">Custom Fees:</td><td class="t-value">¥0</td></tr>
      <tr><td class="t-label">合計 (税抜):</td><td class="t-value">${subtotal}</td></tr>
      <tr><td class="t-label">税(10%):</td><td class="t-value">${taxTotal}</td></tr>
      <tr class="t-grand"><td class="t-label">合計 (税込):</td><td class="t-value">${grandTotal}</td></tr>
    </table>
  </div>

</body>
</html>`;
}

/**
 * Read the payment-gateway map pre-rendered by Liquid into the page.
 * Returns a map of { "gid://shopify/Order/123": "credit" } or {}.
 */
function getPaymentGatewayMap() {
  try {
    const el = document.getElementById('oh-payment-gateways');
    return el ? JSON.parse(el.textContent) : {};
  } catch {
    return {};
  }
}

/**
 * Print a formatted receipt without opening a visible browser popup window.
 * Payment gateway is read from the Liquid-rendered map (no extra API call).
 * @param {Object}   order
 * @param {Function} t      i18n lookup fn
 */
export function printReceipt(order, t) {
  const gatewayMap = getPaymentGatewayMap();
  const paymentGateway = gatewayMap[order.id] || null;
  const html = buildReceiptHtml(order, t, paymentGateway);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';

  const cleanup = () => {
    window.setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 500);
  };

  document.body.appendChild(iframe);
  const win = iframe.contentWindow;
  if (!win) {
    cleanup();
    if (order.statusUrl) window.open(order.statusUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  win.document.write(html);
  win.document.close();

  window.setTimeout(() => {
    try {
      win.focus();
      win.onafterprint = cleanup;
      win.print();
      window.setTimeout(cleanup, 3000);
    } catch (err) {
      cleanup();
      console.error('[printReceipt] Print failed', err);
      if (order.statusUrl) window.open(order.statusUrl, '_blank', 'noopener,noreferrer');
    }
  }, 350);
}
