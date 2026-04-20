(function(){"use strict";function E(n){let e={};try{const t=document.getElementById(n);t&&t.textContent.trim()!=="null"&&(e=JSON.parse(t.textContent)||{})}catch(t){console.warn("[DiptyqueAccount] Failed to parse i18n from #"+n,t)}return function(r,o){return r in e?e[r]:o!==void 0?o:(console.warn("[DiptyqueAccount] Missing i18n key:",r),r)}}function T(n){try{const e=document.getElementById(n);if(e)return JSON.parse(e.textContent)||{}}catch(e){console.warn("[DiptyqueAccount] Failed to parse config from #"+n,e)}return{}}function i(n){if(!n&&n!==0)return"";const e=document.createElement("div");return e.textContent=String(n),e.innerHTML}const D={get(){const n=document.getElementById("my-account-native-customer");if(!n)return null;try{return JSON.parse(n.textContent||"null")||null}catch(e){return console.warn("[DiptyqueAccount] Failed to parse #ma-native-customer JSON",e),null}}};class A{constructor(e,t){if(!e)throw new Error("[DiptyqueStorefrontClient] endpoint is required");if(!t)throw new Error("[DiptyqueStorefrontClient] token is required");this._endpoint=e,this._token=t}async request(e,t={}){let r;try{r=await fetch(this._endpoint,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json","X-Shopify-Storefront-Access-Token":this._token},body:JSON.stringify({query:e,variables:t})})}catch(s){throw new Error("[StorefrontClient] Network error: "+s.message)}if(!r.ok)throw new Error("[StorefrontClient] HTTP "+r.status+" "+r.statusText);const o=await r.json();if(o.errors&&o.errors.length){const s=o.errors.map(a=>a.message).join("; ");throw new Error("[StorefrontClient] GraphQL error: "+s)}return o.data||{}}}const C=`
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
              trackingInfo { number url }
            }
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
`;class w{constructor(e){this._sf=e}async list(e,t=10,r=null){var d;const o={token:e,first:t};r&&(o.after=r);const s=await this._sf.request(C,o),a=((d=s==null?void 0:s.customer)==null?void 0:d.orders)??{edges:[],pageInfo:{hasNextPage:!1,endCursor:null}};return{orders:a.edges.map(l=>({...l.node,_cursor:l.cursor})),pageInfo:a.pageInfo}}}function S(n){if(!n)return"";try{return new Date(n).toLocaleDateString("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit"})}catch{return n}}function h(n){if(!n)return"";const e=parseFloat(n.amount??0),t=n.currencyCode??"JPY";try{return new Intl.NumberFormat("ja-JP",{style:"currency",currency:t,minimumFractionDigits:t==="JPY"?0:2}).format(e)}catch{return`${t} ${e}`}}const I={PAID:{label:"発送済み",modifier:"paid"},PENDING:{label:"処理中",modifier:"pending"},AUTHORIZED:{label:"処理中",modifier:"pending"},PARTIALLY_PAID:{label:"処理中",modifier:"pending"},REFUNDED:{label:"返金済み",modifier:"refunded"},PARTIALLY_REFUNDED:{label:"返金済み",modifier:"refunded"},VOIDED:{label:"キャンセル",modifier:"cancelled"}},P={FULFILLED:{label:"配送済み",modifier:"fulfilled"},PARTIAL:{label:"一部配送",modifier:"partial"},UNFULFILLED:{label:"準備中",modifier:"unfulfilled"},IN_TRANSIT:{label:"配送中",modifier:"in-transit"},DELIVERED:{label:"配達完了",modifier:"delivered"}};function L(n){return I[n==null?void 0:n.toUpperCase()]??{label:"処理中",modifier:"pending"}}function N(n){return n?P[n==null?void 0:n.toUpperCase()]??null:null}function k(n){const e=(n.financialStatus??"").toUpperCase(),t=(n.fulfillmentStatus??"").toUpperCase();return e==="REFUNDED"||e==="PARTIALLY_REFUNDED"?"returned":e==="VOIDED"?"cancelled":t==="FULFILLED"||t==="DELIVERED"||t==="IN_TRANSIT"?"shipped":"processing"}const x=[{key:"all",labelKey:"tab_all"},{key:"processing",labelKey:"tab_processing"},{key:"shipped",labelKey:"tab_shipped"},{key:"cancelled",labelKey:"tab_cancelled"},{key:"returned",labelKey:"tab_returned"}];class q{constructor(e,t){this._container=e,this.t=t,this._handlers={},this._activeTab="all",this._expanded=new Set,this._bound=!1}on(e,t){this._handlers[e]=t}_emit(e,...t){this._handlers[e]&&this._handlers[e](...t)}render(e){if(e.status==="loading"&&!e.orders.length){this._renderLoading();return}if(e.status==="error"){this._renderError(e.error);return}this._renderPage(e)}_renderLoading(){this._container.innerHTML=`
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this.t("loading","読み込み中...")}</p>
      </div>`}_renderError(e){this._container.innerHTML=`
      <p class="my-account__form-message--error" style="margin-top:20px;">
        ${i(e||this.t("load_error","注文履歴の読み込みに失敗しました。"))}
      </p>`}_renderPage(e){const{orders:t,hasNextPage:r,loadingMore:o}=e,s=this._filterOrders(t,this._activeTab),a=`<p class="order-history__notice">${this.t("order_history_notice","本ページでは2021年以降のご注文履歴をご確認いただけます。2020年以前のご注文に関するお問い合わせはカスタマーサービスへご連絡ください。")}</p>`,d=this._renderTabs(),l=s.length?s.map(c=>this._renderOrderCard(c)).join(""):this._renderEmpty(),u=r?`<div class="order-history__load-more-wrap">
           <button class="order-history__load-more-btn${o?" is-loading":""}"
                   data-action="load-more" ${o?"disabled":""}>
             ${o?this.t("loading","読み込み中..."):this.t("load_more","さらに表示する")}
           </button>
         </div>`:"";this._container.innerHTML=`
      <div class="order-history">
        ${a}
        ${d}
        <div class="order-history__list" id="order-history-list">
          ${l}
        </div>
        ${u}
      </div>`,this._bindEvents()}_filterOrders(e,t){return t==="all"?e:e.filter(r=>k(r)===t)}_renderTabs(){return`
      <div class="order-history__tabs" role="tablist">
        ${x.map(e=>`
          <button class="order-history__tab${this._activeTab===e.key?" is-active":""}"
                  role="tab" aria-selected="${this._activeTab===e.key}"
                  data-action="tab" data-tab="${e.key}">
            ${this.t(e.labelKey,e.key)}
          </button>
        `).join("")}
      </div>`}_renderOrderCard(e){var y,g,m,b,v,$;const t=L(e.financialStatus),r=N(e.fulfillmentStatus),o=r?r.label:t.label,s=r?r.modifier:t.modifier,a=S(e.processedAt),d=this._expanded.has(e.id),l=this._resolveTracking(e),u=((y=e.lineItems)==null?void 0:y.edges)??[],c=(g=u[0])==null?void 0:g.node,_=((b=(m=c==null?void 0:c.variant)==null?void 0:m.image)==null?void 0:b.url)??"",U=(($=(v=c==null?void 0:c.variant)==null?void 0:v.image)==null?void 0:$.altText)??(c==null?void 0:c.title)??"",R=u.reduce((H,{node:j})=>H+(j.quantity??1),0);return`
      <div class="order-history__card" data-order-id="${i(e.id)}">
        <div class="order-history__card-header">
          <span class="order-history__status order-history__status--${s}">${o}</span>
          <span class="order-history__date">${a}</span>
        </div>

        <div class="order-history__card-body">
          <div class="order-history__card-thumb">
            ${_?`<img src="${i(_)}" alt="${i(U)}" loading="lazy">`:'<div class="order-history__card-thumb-placeholder"></div>'}
            <span class="order-history__card-thumb-count">${R}</span>
          </div>

          <div class="order-history__card-info">
            <p class="order-history__order-id">
              ${this.t("order_id_label","ご注文ID")} <strong>${i(e.name)}</strong>
            </p>

            <p class="order-history__tracking${l?"":" order-history__tracking--unavailable"}">
              ${l?`<a href="${i(l.url)}" target="_blank" rel="noopener">${i(l.number)}</a>`:this.t("order_tracking_unavailable","トラッキングはご利用できません")}
            </p>

            <button class="order-history__toggle${d?" is-open":""}"
                    data-action="toggle-detail" data-order-id="${i(e.id)}">
              ${this.t("order_toggle_detail","ご注文詳細をみる")}
              <span class="order-history__toggle-arrow">▶</span>
            </button>
          </div>
        </div>

        <div class="order-history__detail${d?" is-open":""}" data-detail-id="${i(e.id)}">
          <div class="order-history__detail-inner">
            ${this._renderLineItems(e)}
            ${this._renderAddresses(e)}
            ${this._renderPayment(e)}
            ${this._renderDetailActions(e)}
          </div>
        </div>
      </div>`}_resolveTracking(e){var r;const t=e.successfulFulfillments??[];for(const o of t){const s=(r=o.trackingInfo)==null?void 0:r[0];if(s!=null&&s.number)return s}return null}_renderLineItems(e){var o;const t=((o=e.lineItems)==null?void 0:o.edges)??[];return t.length?`<div class="order-history__items">${t.map(({node:s})=>{var u,c,_;const a=(u=s.variant)==null?void 0:u.image,d=h(s.originalTotalPrice??((c=s.variant)==null?void 0:c.price)),l=(_=s.variant)!=null&&_.title&&s.variant.title!=="Default Title"?`<span class="order-history__item-variant">${i(s.variant.title)}</span>`:"";return`
        <div class="order-history__item">
          <div class="order-history__item-image${a?"":" order-history__item-image--placeholder"}">
            ${a?`<img src="${i(a.url)}" alt="${i(a.altText??s.title)}" loading="lazy">`:""}
          </div>
          <div class="order-history__item-info">
            <p class="order-history__item-name">${i(s.title)}</p>
            ${l}
            <p class="order-history__item-meta">数量: ${s.quantity}</p>
          </div>
          <p class="order-history__item-price">${d}</p>
        </div>`}).join("")}</div>`:""}_renderAddresses(e){const t=e.shippingAddress,r=e.billingAddress;if(!t&&!r)return"";const o=s=>s?[`${i(s.lastName??"")} ${i(s.firstName??"")}`.trim(),s.zip&&s.province?`〒${i(s.zip)} ${i(s.province)}`:"",s.city?i(s.city):"",s.address1?i(s.address1):"",s.address2?i(s.address2):"",s.phone?i(s.phone):""].filter(Boolean).join("<br>"):"—";return`
      <div class="order-history__addresses">
        <div class="order-history__address-col">
          <h4 class="order-history__address-title">${this.t("order_shipping_address","配送先情報")}</h4>
          <p class="order-history__address-body">${o(t)}</p>
          <p class="order-history__shipping-time">${this.t("order_shipping_time","配送時間: 指定しない")}</p>
        </div>
        <div class="order-history__address-col">
          <h4 class="order-history__address-title">${this.t("order_billing_address","ご依頼主")}</h4>
          <p class="order-history__address-body">${o(r)}</p>
        </div>
      </div>`}_renderPayment(e){const t=h(e.subtotalPrice),r=h(e.totalTax),o=h(e.currentTotalPrice);return`
      <div class="order-history__payment">
        <h4 class="order-history__payment-title">${this.t("order_payment_details","お支払い明細")}</h4>
        <div class="order-history__payment-row">
          <span>${this.t("order_subtotal","小計")}</span>
          <span>${t}</span>
        </div>
        <div class="order-history__payment-row">
          <span>${this.t("order_tax","税")}</span>
          <span>${r}</span>
        </div>
        <div class="order-history__payment-row order-history__payment-row--total">
          <span>${this.t("order_grand_total","合計 (税込)")}</span>
          <span>${o}</span>
        </div>
      </div>`}_renderDetailActions(e){const t=e.statusUrl??"#";return`
      <div class="order-history__detail-actions">
        <a href="${i(t)}" target="_blank" rel="noopener"
           class="order-history__receipt-btn">
          ${this.t("order_download_receipt","領収書をダウンロードする")}
        </a>
        <button class="order-history__reorder-link"
                data-action="reorder" data-order-id="${i(e.id)}">
          ${this.t("order_reorder","もう一度注文する")}
        </button>
      </div>`}_renderEmpty(){return`
      <div class="my-account__empty">
        <p>${this.t("no_orders","注文履歴はまだありません。")}</p>
        <a href="/collections/all" class="button">${this.t("start_shopping","ショッピングを始める")}</a>
      </div>`}_bindEvents(){this._bound||(this._bound=!0,this._container.addEventListener("click",e=>{const t=e.target.closest("[data-action]");if(!t)return;const r=t.dataset.action;if(r==="tab"){this._activeTab=t.dataset.tab,this._emit("order:tab-change",this._activeTab);return}if(r==="load-more"){this._emit("order:load-more");return}if(r==="toggle-detail"){const o=t.dataset.orderId;this._expanded.has(o)?this._expanded.delete(o):this._expanded.add(o);const s=this._container.querySelector(`.order-history__card[data-order-id="${CSS.escape(o)}"]`),a=this._container.querySelector(`.order-history__detail[data-detail-id="${CSS.escape(o)}"]`);if(s){const d=s.querySelector('[data-action="toggle-detail"]'),l=this._expanded.has(o);d==null||d.classList.toggle("is-open",l),a==null||a.classList.toggle("is-open",l)}return}r==="reorder"&&this._emit("order:reorder",t.dataset.orderId)}))}setLoadingMore(e){const t=this._container.querySelector('[data-action="load-more"]');t&&(t.disabled=e,t.textContent=e?this.t("loading","読み込み中..."):this.t("load_more","さらに表示する"),t.classList.toggle("is-loading",e))}}function O(n){let e=n;const t=new Set,r=()=>t.forEach(o=>{try{o(e)}catch(s){console.error("[DiptyqueStore] Subscriber error",s)}});return{get(){return e},set(o){e=o,r()},update(o){e=o(e),r()},subscribe(o){return t.add(o),()=>t.delete(o)},find(o){return(Array.isArray(e)?e:(e==null?void 0:e.items)??[]).find(o)}}}const M=O({status:"idle",orders:[],hasNextPage:!1,endCursor:null,loadingMore:!1,error:null}),p=10;class F{constructor(e,t){this._api=e,this._renderer=t,this._store=M,this._token=null,this._unsubscribe=this._store.subscribe(r=>t.render(r)),t.on("order:tab-change",()=>{t.render(this._store.get())}),t.on("order:load-more",()=>this._loadMore())}destroy(){this._unsubscribe&&this._unsubscribe()}async load(e){if(!e){window.location.href="/";return}this._token=e,this._store.set({status:"loading",orders:[],hasNextPage:!1,endCursor:null,loadingMore:!1,error:null});try{const{orders:t,pageInfo:r}=await this._api.list(e,p,null);this._store.set({status:"ready",orders:t,hasNextPage:r.hasNextPage,endCursor:r.endCursor,loadingMore:!1,error:null})}catch(t){if(console.error("[OrderHistoryController] Load failed",t),t.status===401||t.status===403){window.location.href="/";return}this._store.set({status:"error",orders:[],hasNextPage:!1,endCursor:null,loadingMore:!1,error:t.message})}}async _loadMore(){const e=this._store.get();if(!(!e.hasNextPage||e.loadingMore)){this._store.update(t=>({...t,loadingMore:!0}));try{const{orders:t,pageInfo:r}=await this._api.list(this._token,p,e.endCursor);this._store.update(o=>({...o,orders:[...o.orders,...t],hasNextPage:r.hasNextPage,endCursor:r.endCursor,loadingMore:!1}))}catch(t){console.error("[OrderHistoryController] Load more failed",t),this._store.update(r=>({...r,loadingMore:!1}))}}}}function f(){const n=document.getElementById("order-history-container");if(!n)return;const e=D.get(),t=localStorage.getItem("shopifyCustomerAccessToken"),r=localStorage.getItem("shopifyCustomerAccessTokenExpiresAt"),s=t&&r&&new Date(r)>new Date?t:null;if(!e&&!s){window.location.href="/";return}const a=T("oh-config"),d=E("oh-i18n");if(!a.storefrontEndpoint||!a.storefrontToken){console.error("[order-history-boot] Missing storefront config in #oh-config");return}const l=new A(a.storefrontEndpoint,a.storefrontToken),u=new w(l),c=new q(n,d);new F(u,c).load(s)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",f):f()})();
