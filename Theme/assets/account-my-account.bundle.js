(function(){"use strict";function N(o){let e={};try{const t=document.getElementById(o);t&&t.textContent.trim()!=="null"&&(e=JSON.parse(t.textContent)||{})}catch(t){console.warn("[DiptyqueAccount] Failed to parse i18n from #"+o,t)}return function(r,s){return r in e?e[r]:s!==void 0?s:(console.warn("[DiptyqueAccount] Missing i18n key:",r),r)}}function x(o){try{const e=document.getElementById(o);if(e)return JSON.parse(e.textContent)||{}}catch(e){console.warn("[DiptyqueAccount] Failed to parse config from #"+o,e)}return{}}function u(o){if(!o&&o!==0)return"";const e=document.createElement("div");return e.textContent=String(o),e.innerHTML}function A(o){if(!o)return"";const e=new Date(o);return isNaN(e)?String(o):e.getFullYear()+"/"+String(e.getMonth()+1).padStart(2,"0")+"/"+String(e.getDate()).padStart(2,"0")}function q(o){return!o||!/^\d{4}-\d{2}-\d{2}$/.test(o)?o||"":o.replace(/-/g,"/")}function L(o){return!o||!/^\d{4}\/\d{2}\/\d{2}$/.test(o)?o||"":o.replace(/\//g,"-")}function b(o,e){const t=parseFloat(o);return isNaN(t)?"":e==="JPY"?"¥"+Math.round(t).toLocaleString("ja-JP"):e+" "+t.toFixed(2)}function M(o){return{PAID:"支払い済み",PENDING:"保留中",REFUNDED:"返金済み",PARTIALLY_REFUNDED:"一部返金",VOIDED:"無効",AUTHORIZED:"承認済み"}[o]||o||"—"}function I(o){return{FULFILLED:"発送済み",PARTIAL:"一部発送",UNFULFILLED:"未発送",RESTOCKED:"再入荷"}[o]||o||"未発送"}function h(o,e,t){if(!Array.isArray(o))return"";const r=o.find(s=>s&&s.namespace===e&&s.key===t);return r&&r.value||""}const y="shopifyCustomerAccessToken",w="shopifyCustomerAccessTokenExpiresAt",F="shopifyCustomer",g={get(){if(document.getElementById("my-account-native-customer"))return{token:null,isNative:!0};const o=localStorage.getItem(y),e=localStorage.getItem(w);return!o||!e?null:new Date(e)<=new Date?(this.clear(),null):{token:o,isNative:!1}},save(o,e){localStorage.setItem(y,o),localStorage.setItem(w,e)},clear(){localStorage.removeItem(y),localStorage.removeItem(w),localStorage.removeItem(F)},getToken(){const o=this.get();return o?o.token:null},isNative(){return!!document.getElementById("my-account-native-customer")}},k={get(){const o=document.getElementById("my-account-native-customer");if(!o)return null;try{return JSON.parse(o.textContent||"null")||null}catch(e){return console.warn("[DiptyqueAccount] Failed to parse #ma-native-customer JSON",e),null}}};function E(){var o;return((o=document.querySelector('#ma-native-form [name="authenticity_token"]'))==null?void 0:o.value)||""}function S(o){g.clear(),sessionStorage.removeItem("dp_ca_token"),window.location.href=o||"/"}class D{constructor(e,t){if(!e)throw new Error("[DiptyqueStorefrontClient] endpoint is required");if(!t)throw new Error("[DiptyqueStorefrontClient] token is required");this._endpoint=e,this._token=t}async request(e,t={}){let r;try{r=await fetch(this._endpoint,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json","X-Shopify-Storefront-Access-Token":this._token},body:JSON.stringify({query:e,variables:t})})}catch(a){throw new Error("[StorefrontClient] Network error: "+a.message)}if(!r.ok)throw new Error("[StorefrontClient] HTTP "+r.status+" "+r.statusText);const s=await r.json();if(s.errors&&s.errors.length){const a=s.errors.map(n=>n.message).join("; ");throw new Error("[StorefrontClient] GraphQL error: "+a)}return s.data||{}}}class O{constructor(e,t){if(!e)throw new Error("[DiptyqueBackendClient] baseUrl is required");if(!t)throw new Error("[DiptyqueBackendClient] getToken callback is required");this._base=e.replace(/\/+$/,""),this._getToken=t}async post(e,t={}){const r=this._base+e;let s;try{s=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customer_access_token:this._getToken(),...t})})}catch(n){throw new Error("[BackendClient] Network error: "+n.message)}let a;try{a=await s.json()}catch{a={}}if(!s.ok||a.success===!1){const n=new Error(a.message||"HTTP "+s.status);throw n.status=s.status,n.code=a.code,n.response=a,console.warn("[BackendClient]",s.status,r,a),n}return a.data!==void 0?a.data:a}}const B=`
  query GetCustomer($token: String!) {
    customer(customerAccessToken: $token) {
      id firstName lastName email phone acceptsMarketing
      metafields(identifiers: [
        { namespace: "registration", key: "first_name_kana" }
        { namespace: "registration", key: "last_name_kana" }
        { namespace: "registration", key: "birthday" }
      ]) { namespace key value type }
      orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
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
      defaultAddress { id firstName lastName address1 city zip country phone }
      addresses(first: 20) {
        edges { node { id firstName lastName address1 address2 city province zip country phone } }
      }
    }
  }
`,R=`
  mutation CustomerTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken { accessToken expiresAt }
      customerUserErrors  { field message code }
    }
  }
`,j=`
  mutation CustomerMetafieldsSet($metafields: [CustomerMetafieldsSetInput!]!) {
    customerMetafieldsSet(metafields: $metafields) {
      metafields { namespace key value }
      userErrors  { field message code }
    }
  }
`,H="https://shopify.com/account/customer/api/2024-10/graphql";function U(o){if(!o)return null;const e=String(o).trim();if(/^\+\d{7,15}$/.test(e))return e;const t=e.replace(/[\s\-().]/g,"");return/^\d+$/.test(t)&&/^0\d{9,10}$/.test(t)?"+81"+t.slice(1):null}class Y{constructor(e,t){this._sf=e,this._be=t}async createAccessToken(e,t){var n,c,l;const s=(await this._sf.request(R,{input:{email:e,password:t}})).customerAccessTokenCreate,a=(s==null?void 0:s.customerUserErrors)||[];if(a.length||!((n=s==null?void 0:s.customerAccessToken)!=null&&n.accessToken)){const i=new Error(((c=a[0])==null?void 0:c.message)||"Invalid credentials");throw i.isAuthError=!0,i.code=((l=a[0])==null?void 0:l.code)||"UNIDENTIFIED_CUSTOMER",i}return s.customerAccessToken}async verifyPassword(e,t){return(await this.createAccessToken(e,t).catch(()=>{const s=new Error("currentPasswordInvalid");throw s.isPasswordError=!0,s.status=401,s})).accessToken}async fetchCustomer(e){return(await this._sf.request(B,{token:e})).customer||null}async updateProfile(e){return this._be.post("/api/customers/account/update-profile",{first_name:e.firstName,last_name:e.lastName,first_name_kana:e.first_name_kana,last_name_kana:e.last_name_kana,email:e.email,phone:e.phone,birthday:e.birthday||"",current_password:e.current_password||""})}async updatePassword(e,t){return this._be.post("/api/customers/account/update-password",{current_password:e,new_password:t})}async updateMetafields(e){var c,l,i,d,m;const t=[];if(e.last_name_kana&&t.push({namespace:"registration",key:"last_name_kana",value:e.last_name_kana,type:"single_line_text_field"}),e.first_name_kana&&t.push({namespace:"registration",key:"first_name_kana",value:e.first_name_kana,type:"single_line_text_field"}),e.birthday&&t.push({namespace:"registration",key:"birthday",value:e.birthday,type:"date"}),!t.length)return;const r=sessionStorage.getItem("dp_ca_token");if(!r){console.warn("[CustomerApi] No dp_ca_token — metafields not updated");return}const s=await fetch(H,{method:"POST",headers:{"Content-Type":"application/json",Authorization:r},body:JSON.stringify({query:j,variables:{metafields:t}})});if(!s.ok)throw new Error("[CustomerApi] Customer Account API HTTP "+s.status);const a=await s.json();if((c=a.errors)!=null&&c.length)throw new Error(((l=a.errors[0])==null?void 0:l.message)||"Metafield GraphQL error");const n=((d=(i=a.data)==null?void 0:i.customerMetafieldsSet)==null?void 0:d.userErrors)||[];if(n.length)throw new Error(((m=n[0])==null?void 0:m.message)||"Metafield error")}async updateProfileNative(e,t){const r=new URLSearchParams;if(r.append("form_type","customer"),r.append("utf8","✓"),r.append("customer[first_name]",e.firstName||""),r.append("customer[last_name]",e.lastName||""),r.append("customer[email]",e.email||""),e.phone){const a=U(e.phone);a&&r.append("customer[phone]",a)}t&&r.append("authenticity_token",t);const s=await fetch("/account",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:r.toString(),credentials:"same-origin"});if(!s.ok&&!s.redirected){const a=new Error("Native profile update failed: HTTP "+s.status);throw a.status=s.status,a.isNative=!0,a}}async updatePasswordNative(e,t,r){const s=new URLSearchParams;s.append("form_type","customer"),s.append("utf8","✓"),s.append("customer[password]",e),s.append("customer[password_confirmation]",t),r&&s.append("authenticity_token",r);const a=await fetch("/account",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:s.toString(),credentials:"same-origin"});if(!a.ok&&!a.redirected)throw new Error("Native password update failed: HTTP "+a.status)}}const z=`
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
`;class K{constructor(e){this._sf=e}async list(e,t=20){var s,a;return(((a=(s=(await this._sf.request(z,{token:e,first:t})).customer)==null?void 0:s.orders)==null?void 0:a.edges)??[]).map(n=>n.node)}}class V{constructor(e,t){this._el=e,this._t=t,this._handlers={},this._dobPicker=null}on(e,t){this._handlers[e]=t}_emit(e,...t){this._handlers[e]?this._handlers[e](...t):console.warn("[ProfileRenderer] No handler for:",e)}renderLoading(){this._el.innerHTML=`
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this._t("loading","読み込み中...")}</p>
      </div>`}renderLoginPrompt(){this._el.innerHTML=`
      <div class="my-account__not-logged-in">
        <div class="my-account__not-logged-in-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <h2>${this._t("login_required","ログインが必要です")}</h2>
        <p>${this._t("login_prompt","アカウント情報を表示するにはログインしてください。")}</p>
        <button type="button" class="my-account__login-btn button" data-open-account-modal="login">
          ${this._t("login_btn","ログイン")}
        </button>
      </div>`}renderDashboard(e){const t=this._t,r=e.metafields||[],s=u(h(r,"registration","last_name_kana")),a=u(h(r,"registration","first_name_kana")),n=u(q(h(r,"registration","birthday")));this._el.innerHTML=`
      <!-- ── Profile section ────────────────────────────────────────── -->
      <div class="my-account__form-section" data-section="profile">
        <h2 class="my-account__section-heading">${t("profile_title","お客様情報")}</h2>
        <div class="my-account__form-grid">

          <div class="my-account__form-field">
            <label for="ma-lastName">${t("last_name","姓")} *</label>
            <input id="ma-lastName" name="lastName" data-field="lastName"
              class="my-account__input" type="text"
              value="${u(e.lastName||"")}"
              placeholder="${t("last_name","姓")}" autocomplete="family-name">
            <span class="my-account__field-error" data-error-for="lastName" aria-live="polite"></span>
          </div>

          <div class="my-account__form-field">
            <label for="ma-firstName">${t("first_name","名")} *</label>
            <input id="ma-firstName" name="firstName" data-field="firstName"
              class="my-account__input" type="text"
              value="${u(e.firstName||"")}"
              placeholder="${t("first_name","名")}" autocomplete="given-name">
            <span class="my-account__field-error" data-error-for="firstName" aria-live="polite"></span>
          </div>

          <div class="my-account__form-field">
            <label for="ma-last-name-kana">${t("furigana_last","フリガナ（姓）")} *</label>
            <input id="ma-last-name-kana" name="last_name_kana" data-field="last_name_kana"
              class="my-account__input" type="text"
              value="${s}" placeholder="${t("furigana_last","フリガナ（姓）")}">
            <span class="my-account__field-error" data-error-for="last_name_kana" aria-live="polite"></span>
          </div>

          <div class="my-account__form-field">
            <label for="ma-first-name-kana">${t("furigana_first","フリガナ（名）")} *</label>
            <input id="ma-first-name-kana" name="first_name_kana" data-field="first_name_kana"
              class="my-account__input" type="text"
              value="${a}" placeholder="${t("furigana_first","フリガナ（名）")}">
            <span class="my-account__field-error" data-error-for="first_name_kana" aria-live="polite"></span>
          </div>
        </div>

        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label for="ma-dob">${t("dob","生年月日")} <span class="my-account__info-icon">?</span></label>
          <div class="my-account__date-input">
            <input id="ma-dob" name="dob" data-field="dob"
              class="my-account__input" type="text"
              value="${n}" placeholder="YYYY/MM/DD">
            <span id="ma-dob-toggle" class="my-account__calendar-icon" style="cursor:pointer;">
              <svg style="pointer-events:none;" width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </span>
          </div>
          <span class="my-account__field-error" data-error-for="dob" aria-live="polite"></span>
        </div>

        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label for="ma-phone">${t("phone","電話番号")} *</label>
          <input id="ma-phone" name="phone" data-field="phone"
            class="my-account__input" type="tel"
            value="${u(e.phone||"")}"
            placeholder="012322222" autocomplete="tel">
          <span class="my-account__field-error" data-error-for="phone" aria-live="polite"></span>
        </div>

        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label for="ma-email">${t("email","Eメールアドレス")} *</label>
          <input id="ma-email" name="email" data-field="email"
            class="my-account__input" type="email"
            value="${u(e.email||"")}"
            placeholder="your@email.com" autocomplete="email">
          <span class="my-account__field-error" data-error-for="email" aria-live="polite"></span>
        </div>

        <!-- Email change requires current password verification -->
        <div class="my-account__form-field my-account__form-field--full mt-16 my-account__form-field--hidden"
             data-profile-email-verify>
          <label for="ma-profileCurrentPassword">${t("current_password","現在のパスワード")} *</label>
          <div class="my-account__password-input">
            <input id="ma-profileCurrentPassword" name="profileCurrentPassword"
              data-field="profileCurrentPassword"
              class="my-account__input" type="password"
              placeholder="${t("current_password","現在のパスワード")}" autocomplete="current-password">
            ${this._eyeIcon()}
          </div>
          <span class="my-account__field-error" data-error-for="profileCurrentPassword" aria-live="polite"></span>
        </div>

        <p class="my-account__required-text">${t("required","* 必須")}</p>
        <div class="my-account__form-message" data-form-message="profile" role="alert" aria-live="polite"></div>
        <button type="button" class="my-account__submit-btn" data-submit="profile">${t("submit","確定")}</button>
      </div>

      <!-- ── Password section ──────────────────────────────────────── -->
      <div class="my-account__form-section mt-40" data-section="password">
        <h2 class="my-account__section-heading">${t("login_info_title","ログイン情報")}</h2>
        ${this._passwordField("currentPassword",t("password","パスワード"),"current-password")}
        ${this._passwordField("newPassword",t("new_password","新しいパスワード"),"new-password",!0)}
        <p class="my-account__password-hint">${t("password_hint","ⓘ パスワードは8文字以上で、英字・数字・記号を含む必要があります。")}</p>
        ${this._passwordField("confirmPassword",t("password_confirm","パスワード（再入力）"),"new-password")}

        <div class="my-account__form-message" data-form-message="password" role="alert" aria-live="polite"></div>
        <button type="button" class="my-account__submit-btn" data-submit="password">${t("submit","確定")}</button>
      </div>

      <!-- ── Benefits banner ───────────────────────────────────────── -->
      ${this._benefitsBanner()}
    `,this._bindEvents(e),this._initDobPicker()}setFieldError(e,t){const r=this._el.querySelector(`[data-field="${e}"]`),s=this._el.querySelector(`[data-error-for="${e}"]`);r&&(r.classList.add("my-account__input--error"),r.setAttribute("aria-invalid","true")),s&&(s.textContent=t)}clearFieldError(e){const t=this._el.querySelector(`[data-field="${e}"]`),r=this._el.querySelector(`[data-error-for="${e}"]`);t&&(t.classList.remove("my-account__input--error"),t.removeAttribute("aria-invalid")),r&&(r.textContent="")}setFormMessage(e,t,r){const s=this._el.querySelector(`[data-form-message="${r}"]`);s&&(s.textContent=t,s.className=e?`my-account__form-message my-account__form-message--${e}`:"my-account__form-message",e==="success"&&setTimeout(()=>{s.textContent===t&&(s.textContent="",s.className="my-account__form-message")},6e3))}setSubmitState(e,t,r){const s=this._el.querySelector(`[data-submit="${e}"]`);s&&(s.disabled=t,t?(s.dataset.originalText=s.textContent,s.textContent=r||"...",s.classList.add("my-account__submit-btn--loading")):(s.textContent=s.dataset.originalText||this._t("submit","確定"),delete s.dataset.originalText,s.classList.remove("my-account__submit-btn--loading")))}showEmailVerifyField(e){const t=this._el.querySelector("[data-profile-email-verify]");if(t&&(t.classList.toggle("my-account__form-field--hidden",!e),!e)){const r=t.querySelector('[data-field="profileCurrentPassword"]');r&&(r.value=""),this.clearFieldError("profileCurrentPassword")}}getProfileFormData(){const e=t=>{var r;return(((r=this._el.querySelector(`[data-field="${t}"]`))==null?void 0:r.value)??"").trim()};return{lastName:e("lastName"),firstName:e("firstName"),last_name_kana:e("last_name_kana"),first_name_kana:e("first_name_kana"),dob:e("dob"),phone:e("phone"),email:e("email"),profileCurrentPassword:e("profileCurrentPassword")}}getPasswordFormData(){const e=t=>{var r;return((r=this._el.querySelector(`[data-field="${t}"]`))==null?void 0:r.value)??""};return{currentPassword:e("currentPassword"),newPassword:e("newPassword"),confirmPassword:e("confirmPassword")}}clearPasswordFields(){["currentPassword","newPassword","confirmPassword"].forEach(e=>{const t=this._el.querySelector(`[data-field="${e}"]`);t&&(t.value="")})}_eyeIcon(){return`<button type="button" class="my-account__password-toggle">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    </button>`}_passwordField(e,t,r,s=!1){return`
      <div class="my-account__form-field my-account__form-field--full${s?" mt-16":""}">
        <label for="ma-${e}">${t} *</label>
        <div class="my-account__password-input">
          <input id="ma-${e}" name="${e}" data-field="${e}"
            class="my-account__input" type="password"
            placeholder="${t}" autocomplete="${r}">
          ${this._eyeIcon()}
        </div>
        <span class="my-account__field-error" data-error-for="${e}" aria-live="polite"></span>
      </div>`}_benefitsBanner(){const e=this._t;return`
      <div class="my-account__benefits-banner mt-40">
        <h3 class="my-account__benefits-title">${e("benefits_title","DIptyqueの会員特典")}</h3>
        <p class="my-account__benefits-subtitle">${e("benefits_subtitle","Diptyque アカウントには、様々な特典がございます：")}</p>
        <div class="my-account__benefits-icons">
          <div class="my-account__benefit-item">
            <div class="my-account__benefit-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2a4b38" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 11h16"/><path d="M12 11V7"/><path d="M8 7a4 4 0 0 1 8 0v4H8V7z"/></svg>
            </div>
            <span class="my-account__benefit-text">${e("benefit_1","お誕生日に香りのサプライズ")}</span>
          </div>
          <div class="my-account__benefit-item">
            <div class="my-account__benefit-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2a4b38" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <span class="my-account__benefit-text">${e("benefit_2","Diptyqueのイベントへのご招待")}</span>
          </div>
          <div class="my-account__benefit-item">
            <div class="my-account__benefit-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2a4b38" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-2-2H5L3 8v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z"/><path d="M3 8h18"/><path d="M12 3v5"/><path d="M16 12a4 4 0 0 1-8 0"/></svg>
            </div>
            <span class="my-account__benefit-text">${e("benefit_3","会員限定の特別販売へのご招待")}</span>
          </div>
        </div>
      </div>`}_bindEvents(e){var t,r;this._el.querySelectorAll(".my-account__password-toggle").forEach(s=>{s.addEventListener("click",()=>{const a=s.previousElementSibling,n=a.type==="password";a.type=n?"text":"password",s.innerHTML=n?'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>':'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'})}),(t=this._el.querySelector('[data-submit="profile"]'))==null||t.addEventListener("click",()=>{this._emit("profile:submit",this.getProfileFormData())}),(r=this._el.querySelector('[data-submit="password"]'))==null||r.addEventListener("click",()=>{this._emit("password:submit",this.getPasswordFormData())}),this._el.querySelectorAll("[data-field]").forEach(s=>{s.addEventListener("input",()=>{if(this.clearFieldError(s.dataset.field),s.dataset.field==="email"){const a=(e.email||"").toLowerCase().trim()!==s.value.toLowerCase().trim();this.showEmailVerifyField(a)}})}),this.showEmailVerifyField(!1)}_initDobPicker(){if(this._dobPicker){try{this._dobPicker.destroy()}catch{}this._dobPicker=null}const e=document.getElementById("ma-dob"),t=document.getElementById("ma-dob-toggle");if(!e)return;const r=()=>{var n;const s=typeof flatpickr<"u"&&((n=flatpickr.l10ns)!=null&&n.ja)?flatpickr.l10ns.ja:"default",a=flatpickr(e,{dateFormat:"Y/m/d",allowInput:!0,disableMobile:!1,locale:s,maxDate:"today",minDate:"1900-01-01",appendTo:document.body,onReady(c,l,i){i.input.removeAttribute("readonly")},onChange(){e.dispatchEvent(new Event("input",{bubbles:!0}))}});t==null||t.addEventListener("click",c=>{c.preventDefault(),c.stopPropagation(),a.open()}),e.addEventListener("click",()=>a.open()),this._dobPicker=a};if(typeof flatpickr<"u")r();else{const s=setInterval(()=>{typeof flatpickr<"u"&&(clearInterval(s),r())},50)}}}class J{constructor(e,t){this._el=e,this._t=t}render(e){if(e.status==="loading"){this.renderLoading();return}if(e.status==="error"){this.renderError(e.error);return}this.renderOrders(e.orders)}renderLoading(){this._el.innerHTML=`
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this._t("loading","読み込み中...")}</p>
      </div>`}renderError(e){this._el.innerHTML=`<p class="my-account__form-message--error">${e||"エラーが発生しました。"}</p>`}renderOrders(e){const t=this._t;if(!e.length){this._el.innerHTML=`
        <div class="my-account__empty">
          <p>${t("no_orders","注文履歴はまだありません。")}</p>
          <a href="/collections/all" class="my-account__shop-btn button">
            ${t("start_shopping","ショッピングを始める")}
          </a>
        </div>`;return}this._el.innerHTML=`
      <div class="my-account__orders">
        ${e.map(r=>{var n;const s=(((n=r.lineItems)==null?void 0:n.edges)||[]).map(c=>c.node),a=r.totalPrice;return`
            <div class="my-account__order">
              <div class="my-account__order-header">
                <div class="my-account__order-info">
                  <span class="my-account__order-name">${u(r.name)}</span>
                  <span class="my-account__order-date">${A(r.processedAt)}</span>
                </div>
                <div class="my-account__order-status">
                  <span class="my-account__status-badge my-account__status-badge--${(r.financialStatus||"").toLowerCase()}">
                    ${M(r.financialStatus)}
                  </span>
                  <span class="my-account__status-badge my-account__status-badge--${(r.fulfillmentStatus||"unfulfilled").toLowerCase()}">
                    ${I(r.fulfillmentStatus)}
                  </span>
                </div>
              </div>

              <div class="my-account__order-items">
                ${s.map(c=>{var d,m,_,p;const l=(m=(d=c.variant)==null?void 0:d.image)==null?void 0:m.url,i=(_=c.variant)==null?void 0:_.price;return`
                    <div class="my-account__order-item">
                      ${l?`<img src="${l}" alt="${u(c.title)}" class="my-account__item-image" loading="lazy">`:'<div class="my-account__item-image my-account__item-image--placeholder"></div>'}
                      <div class="my-account__item-details">
                        <p class="my-account__item-title">${u(c.title)}</p>
                        ${(p=c.variant)!=null&&p.title&&c.variant.title!=="Default Title"?`<p class="my-account__item-variant">${u(c.variant.title)}</p>`:""}
                        <p class="my-account__item-qty">${t("qty","数量")}: ${c.quantity}</p>
                      </div>
                      <div class="my-account__item-price">
                        ${i?b(i.amount,i.currencyCode):""}
                      </div>
                    </div>`}).join("")}
              </div>

              <div class="my-account__order-total">
                <span>${t("total","合計")}</span>
                <span class="my-account__order-total-amount">
                  ${a?b(a.amount,a.currencyCode):""}
                </span>
              </div>
            </div>`}).join("")}
      </div>`}}function P(o){let e=o;const t=new Set,r=()=>t.forEach(s=>{try{s(e)}catch(a){console.error("[DiptyqueStore] Subscriber error",a)}});return{get(){return e},set(s){e=s,r()},update(s){e=s(e),r()},subscribe(s){return t.add(s),()=>t.delete(s)},find(s){return(Array.isArray(e)?e:(e==null?void 0:e.items)??[]).find(s)}}}const G=P({status:"idle",customer:null,error:null}),Q=P({status:"idle",orders:[],error:null});class W{constructor(e,t,r={}){this._api=e,this._renderer=t,this._isNative=r.isNative||!1,this._logoutUrl=r.logoutUrl||"/account/logout",this._getNativeSession=r.getNativeSession||null,this._store=G,this._store.subscribe(s=>{if(s.status==="loading"){t.renderLoading();return}if(s.status==="error"){window.location.href="/";return}s.status==="ready"&&s.customer&&(t.renderDashboard(s.customer),this._bindRendererActions())})}async load(e,t=null){var r,s;if(t){this._store.set({status:"ready",customer:t,error:null});return}if(!e){this._store.set({status:"error",customer:null,error:"no_session"});return}this._store.set({status:"loading",customer:null,error:null});try{const a=await this._api.fetchCustomer(e);if(!a){const n=(r=this._getNativeSession)==null?void 0:r.call(this);n?this._store.set({status:"ready",customer:n,error:null}):this._store.set({status:"error",customer:null,error:"invalid_token"});return}this._store.set({status:"ready",customer:a,error:null})}catch(a){console.error("[ProfileController] Failed to load customer",a);const n=(s=this._getNativeSession)==null?void 0:s.call(this);n?this._store.set({status:"ready",customer:n,error:null}):this._store.set({status:"error",customer:null,error:a.message})}}_bindRendererActions(){var e;this._renderer.on("profile:submit",t=>this._handleProfileSubmit(t)),this._renderer.on("password:submit",t=>this._handlePasswordSubmit(t)),(e=document.getElementById("my-account-logout"))==null||e.addEventListener("click",()=>{S(this._isNative?this._logoutUrl:"/")},{once:!0})}async _handleProfileSubmit(e){var l;if(this._profileBusy)return;this._profileBusy=!0;const t=this._renderer._t,r=this._renderer;r.setSubmitState("profile",!0,t("saving","保存中...")),r.setFormMessage("","","profile"),["lastName","firstName","last_name_kana","first_name_kana","dob","phone","email","profileCurrentPassword"].forEach(i=>r.clearFieldError(i));const a=this._validateProfile(e,t);if((((l=this._store.get().customer)==null?void 0:l.email)||"").toLowerCase()!==(e.email||"").toLowerCase()&&!e.profileCurrentPassword&&(a.profileCurrentPassword=t("validation_current_password_required_for_email","メールアドレスを変更する場合は現在のパスワードを入力してください。")),Object.keys(a).length){Object.entries(a).forEach(([i,d])=>r.setFieldError(i,d)),r.setSubmitState("profile",!1),this._profileBusy=!1;return}try{const i={firstName:e.firstName,lastName:e.lastName,first_name_kana:e.first_name_kana,last_name_kana:e.last_name_kana,email:e.email,phone:e.phone,birthday:e.dob?L(e.dob):"",current_password:e.profileCurrentPassword||""};this._isNative?await this._api.updateProfileNative(i,E()):await this._api.updateProfile(i);try{await this._api.updateMetafields({last_name_kana:i.last_name_kana,first_name_kana:i.first_name_kana,birthday:i.birthday})}catch(d){console.warn("[ProfileController] Metafield update skipped:",d.message)}this._store.update(d=>({...d,customer:{...d.customer,firstName:e.firstName,lastName:e.lastName,email:e.email,phone:e.phone}})),r.setFormMessage("success",t("save_success","情報が保存されました。"),"profile")}catch(i){console.error("[ProfileController] Profile update error",i),i.isPasswordError||i.status===401?r.setFieldError("profileCurrentPassword",t("validation_current_password_invalid","現在のパスワードが正しくありません。")):i.code==="TAKEN"?r.setFieldError("email",t("validation_email_taken","このメールアドレスは既に使用されています。")):r.setFormMessage("error",i.message||t("save_failed","保存に失敗しました。"),"profile")}finally{r.setSubmitState("profile",!1),this._profileBusy=!1}}async _handlePasswordSubmit(e){if(this._passwordBusy)return;this._passwordBusy=!0;const t=this._renderer._t,r=this._renderer;if(r.setSubmitState("password",!0,t("saving","保存中...")),r.setFormMessage("","","password"),["currentPassword","newPassword","confirmPassword"].forEach(a=>r.clearFieldError(a)),!e.currentPassword&&!e.newPassword&&!e.confirmPassword){r.setSubmitState("password",!1),this._passwordBusy=!1;return}const s=this._validatePassword(e,t);if(Object.keys(s).length){Object.entries(s).forEach(([a,n])=>r.setFieldError(a,n)),r.setSubmitState("password",!1),this._passwordBusy=!1;return}try{const a=this._store.get().customer;if(this._isNative)await this._api.updatePasswordNative(e.newPassword,e.confirmPassword,E());else{await this._api.updatePassword(e.currentPassword,e.newPassword),g.clear(),r.clearPasswordFields(),r.setFormMessage("success",t("password_changed_relogin","パスワードを変更しました。再度ログインしてください。"),"password"),setTimeout(()=>{window.location.href="/"},2e3);return}r.clearPasswordFields(),r.setFormMessage("success",t("save_success","情報が保存されました。"),"password")}catch(a){console.error("[ProfileController] Password update error",a),a.isPasswordError||a.status===401?r.setFieldError("currentPassword",t("validation_current_password_invalid","現在のパスワードが正しくありません。")):r.setFormMessage("error",a.message||t("save_failed","保存に失敗しました。"),"password")}finally{r.setSubmitState("password",!1),this._passwordBusy=!1}}_validateProfile(e,t){const r={},s=/^[\u30A0-\u30FF\u30FC\s]+$/,a=["lastName","firstName","last_name_kana","first_name_kana","phone","email"];for(const n of a)e[n]||(r[n]=t("validation_required","この項目は必須です。"));if(e.last_name_kana&&!r.last_name_kana&&!s.test(e.last_name_kana)&&(r.last_name_kana=t("validation_kana_invalid","全角カタカナで入力してください。")),e.first_name_kana&&!r.first_name_kana&&!s.test(e.first_name_kana)&&(r.first_name_kana=t("validation_kana_invalid","全角カタカナで入力してください。")),e.email&&!r.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email)&&(r.email=t("validation_email_invalid","有効なメールアドレスを入力してください。")),e.phone&&!r.phone){const n=e.phone;if(!/^[0-9+()\-\s]+$/.test(n))r.phone=t("validation_phone_invalid","有効な電話番号を入力してください。");else{const c=n.replace(/\D/g,"");(c.length<8||c.length>15)&&(r.phone=t("validation_phone_invalid","有効な電話番号を入力してください。"))}}if(e.dob)if(!/^\d{4}\/\d{2}\/\d{2}$/.test(e.dob))r.dob=t("validation_dob_invalid","YYYY/MM/DD 形式の有効な日付を入力してください。");else{const[n,c,l]=e.dob.split("/").map(Number),i=new Date(n,c-1,l);(!(i.getFullYear()===n&&i.getMonth()===c-1&&i.getDate()===l)||i>new Date)&&(r.dob=t("validation_dob_invalid","YYYY/MM/DD 形式の有効な日付を入力してください。"))}return r}_validatePassword(e,t){const r={};return e.currentPassword||(r.currentPassword=t("validation_required","この項目は必須です。")),e.newPassword?e.newPassword.length>=8&&/[a-zA-Z]/.test(e.newPassword)&&/\d/.test(e.newPassword)&&/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/.test(e.newPassword)||(r.newPassword=t("validation_password_weak","パスワードは8文字以上で、英字・数字・記号を含む必要があります。")):r.newPassword=t("validation_required","この項目は必須です。"),e.confirmPassword?e.newPassword&&e.confirmPassword!==e.newPassword&&(r.confirmPassword=t("validation_password_mismatch","パスワードが一致しません。")):r.confirmPassword=t("validation_required","この項目は必須です。"),r}}class X{constructor(e,t){this._api=e,this._renderer=t,this._store=Q,this._store.subscribe(r=>t.render(r))}async load(e,t=20){if(!e){this._store.set({status:"ready",orders:[],error:null});return}this._store.set({status:"loading",orders:[],error:null});try{const r=await this._api.list(e,t);this._store.set({status:"ready",orders:r,error:null})}catch(r){console.error("[OrderController] Failed to load orders",r),this._store.set({status:"error",orders:[],error:r.message})}}seedFromNative(e){this._store.set({status:"ready",orders:e||[],error:null})}}function Z(){const o=(window.location.hash||"").replace(/^#/,"").trim(),e=new URLSearchParams(window.location.search).get("tab")||"",t=["profile","orders","addresses","cards","shipping"];return t.includes(o)?o:t.includes(e)?e:"profile"}function v(o,e){const r=["profile","orders","addresses","cards","shipping"].includes(o)?o:"profile";if(document.querySelectorAll(".my-account__nav-item").forEach(s=>{s.classList.toggle("my-account__nav-item--active",s.dataset.tab===r)}),document.querySelectorAll(".my-account__panel").forEach(s=>{s.classList.toggle("my-account__panel--active",s.dataset.panel===r)}),e){const s=r==="profile"?"":"#"+r;window.location.hash!==s&&(s?window.location.hash=s:history.replaceState(null,"",window.location.pathname+window.location.search))}}function ee(){document.querySelectorAll(".my-account__nav-item[data-tab]").forEach(o=>{o.addEventListener("click",e=>{e.preventDefault(),v(o.dataset.tab,!0)})}),window.addEventListener("hashchange",()=>{const o=window.location.hash.replace(/^#/,"");["profile","orders","addresses","cards","shipping"].includes(o)&&v(o,!1)})}function te(o){var l;const e=localStorage.getItem("shopifyCustomerAccessToken"),t=localStorage.getItem("shopifyCustomerAccessTokenExpiresAt"),r=e&&t&&new Date(t)>new Date,s=document.querySelector(".account-button");if(!s||s.dataset.accountInitialized||(s.dataset.accountInitialized="true",!r))return;if(!document.getElementById("account-dropdown-styles")){const i=document.createElement("style");i.id="account-dropdown-styles",i.textContent=`
      .account-button{position:relative}
      .account-dropdown{position:absolute;top:calc(100% + 8px);right:0;min-width:160px;
        background:var(--color-background);border:1px solid var(--color-border,#e0e0e0);
        box-shadow:0 8px 24px rgba(0,0,0,.10);z-index:1100;display:none;flex-direction:column}
      .account-dropdown.is-open{display:flex}
      .account-dropdown__item{display:block;padding:12px 16px;font-size:.78rem;letter-spacing:.04em;
        color:var(--color-foreground);text-decoration:none;background:none;border:none;
        text-align:left;cursor:pointer;white-space:nowrap;transition:background .15s}
      .account-dropdown__item:hover{background:rgba(0,0,0,.04)}
      .account-dropdown__item+.account-dropdown__item{border-top:1px solid var(--color-border,#e0e0e0)}
    `,document.head.appendChild(i)}const a=s.querySelector("[data-open-account-modal]");if(!a)return;const n=document.createElement("button");n.type="button",n.className=a.className,n.setAttribute("aria-label",a.getAttribute("aria-label")||"Account"),n.setAttribute("aria-haspopup","true"),n.setAttribute("aria-expanded","false"),n.innerHTML=a.innerHTML,a.replaceWith(n);const c=document.createElement("div");c.className="account-dropdown",c.setAttribute("role","menu"),c.innerHTML=`
    <a href="/pages/my-account" class="account-dropdown__item" role="menuitem">
      ${o("header_my_account","マイアカウント")}
    </a>
    <button type="button" class="account-dropdown__item" id="header-logout-btn" role="menuitem">
      ${o("logout","ログアウト")}
    </button>`,s.appendChild(c),n.addEventListener("click",i=>{i.stopPropagation();const d=c.classList.toggle("is-open");n.setAttribute("aria-expanded",String(d))}),(l=c.querySelector("#header-logout-btn"))==null||l.addEventListener("click",()=>{S("/")}),document.addEventListener("click",()=>{c.classList.remove("is-open"),n.setAttribute("aria-expanded","false")}),document.addEventListener("keydown",i=>{i.key==="Escape"&&(c.classList.remove("is-open"),n.setAttribute("aria-expanded","false"))})}function C(){var T;const o=document.getElementById("my-account-app");if(!o)return;const e=x("ma-config"),t=N("ma-i18n");if(!e.storefrontEndpoint||!e.storefrontToken){console.error("[account-boot] Missing storefront config in #ma-config");return}const r=k.get(),s=localStorage.getItem("shopifyCustomerAccessToken"),a=localStorage.getItem("shopifyCustomerAccessTokenExpiresAt"),c=s&&a&&new Date(a)>new Date?{token:s}:g.get();if(!r&&!c){window.location.href="/";return}const l=new D(e.storefrontEndpoint,e.storefrontToken),i=new O(e.apiBase,()=>localStorage.getItem("shopifyCustomerAccessToken")),d=o.querySelector('[data-panel="profile"]'),m=new V(d,t),_=new Y(l,i),p=new W(_,m,{isNative:!1,logoutUrl:e.logoutUrl||"/account/logout",getNativeSession:()=>k.get()}),re=o.querySelector('[data-panel="orders"]'),se=new J(re,t),ae=new K(l),$=new X(ae,se);if(ee(),v(Z(),!1),r){p.load(null,r);const f=(((T=r.orders)==null?void 0:T.edges)||[]).map(oe=>oe.node);$.seedFromNative(f)}else{const f=c.token;p.load(f),$.load(f)}te(t)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",C):C()})();
