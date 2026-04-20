(function(){"use strict";function K(n){let e={};try{const t=document.getElementById(n);t&&t.textContent.trim()!=="null"&&(e=JSON.parse(t.textContent)||{})}catch(t){console.warn("[DiptyqueAccount] Failed to parse i18n from #"+n,t)}return function(s,r){return s in e?e[s]:r!==void 0?r:(console.warn("[DiptyqueAccount] Missing i18n key:",s),s)}}function V(n){try{const e=document.getElementById(n);if(e)return JSON.parse(e.textContent)||{}}catch(e){console.warn("[DiptyqueAccount] Failed to parse config from #"+n,e)}return{}}function c(n){if(!n&&n!==0)return"";const e=document.createElement("div");return e.textContent=String(n),e.innerHTML}function G(n){return!n||!/^\d{4}-\d{2}-\d{2}$/.test(n)?n||"":n.replace(/-/g,"/")}function J(n){return!n||!/^\d{4}\/\d{2}\/\d{2}$/.test(n)?n||"":n.replace(/\//g,"-")}function Z(n){if(!n)return null;const e=n.match(/\/(\d+)/);return e?Number(e[1]):null}function $(n,e,t){if(!Array.isArray(n))return"";const s=n.find(r=>r&&r.namespace===e&&r.key===t);return s&&s.value||""}const Q={Aichi:"愛知県",Akita:"秋田県",Aomori:"青森県",Chiba:"千葉県",Ehime:"愛媛県",Fukui:"福井県",Fukuoka:"福岡県",Fukushima:"福島県",Gifu:"岐阜県",Gunma:"群馬県",Hiroshima:"広島県",Hokkaido:"北海道",Hokkaidō:"北海道",Hyogo:"兵庫県",Hyōgo:"兵庫県",Ibaraki:"茨城県",Ishikawa:"石川県",Iwate:"岩手県",Kagawa:"香川県",Kagoshima:"鹿児島県",Kanagawa:"神奈川県",Kochi:"高知県",Kōchi:"高知県",Kumamoto:"熊本県",Kyoto:"京都府",Kyōto:"京都府",Mie:"三重県",Miyagi:"宮城県",Miyazaki:"宮崎県",Nagano:"長野県",Nagasaki:"長崎県",Nara:"奈良県",Niigata:"新潟県",Oita:"大分県",Ōita:"大分県",Okayama:"岡山県",Okinawa:"沖縄県",Osaka:"大阪府",Ōsaka:"大阪府",Saga:"佐賀県",Saitama:"埼玉県",Shiga:"滋賀県",Shimane:"島根県",Shizuoka:"静岡県",Tochigi:"栃木県",Tokushima:"徳島県",Tokyo:"東京都",Tōkyō:"東京都",Tottori:"鳥取県",Toyama:"富山県",Wakayama:"和歌山県",Yamagata:"山形県",Yamaguchi:"山口県",Yamanashi:"山梨県"};function E(n){return Q[n]||n}const S="shopifyCustomerAccessToken",P="shopifyCustomerAccessTokenExpiresAt",W="shopifyCustomer",x={get(){if(document.getElementById("my-account-native-customer"))return{token:null,isNative:!0};const n=localStorage.getItem(S),e=localStorage.getItem(P);return!n||!e?null:new Date(e)<=new Date?(this.clear(),null):{token:n,isNative:!1}},save(n,e){localStorage.setItem(S,n),localStorage.setItem(P,e)},clear(){localStorage.removeItem(S),localStorage.removeItem(P),localStorage.removeItem(W)},getToken(){const n=this.get();return n?n.token:null},isNative(){return!!document.getElementById("my-account-native-customer")}},C={get(){const n=document.getElementById("my-account-native-customer");if(!n)return null;try{return JSON.parse(n.textContent||"null")||null}catch(e){return console.warn("[DiptyqueAccount] Failed to parse #ma-native-customer JSON",e),null}}};function N(){var n;return((n=document.querySelector('#ma-native-form [name="authenticity_token"]'))==null?void 0:n.value)||""}function q(n){x.clear(),sessionStorage.removeItem("dp_ca_token"),window.location.href=n||"/"}const L=["profile","orders","addresses","order"],y="profile";function X(){const n=new URLSearchParams(window.location.search),e=(n.get("tab")||"").trim().toLowerCase(),t=L.includes(e)?e:y,s=n.get("id")||null;return{view:t,id:s}}function h(n,e=!1){const{view:t=y,id:s=null}=n,r=L.includes(t)?t:y,a=new URLSearchParams;r!==y&&a.set("tab",r),s&&a.set("id",s);const i=a.toString()?`?${a.toString()}`:"",l=`${window.location.pathname}${i}`;e?history.replaceState({view:r,id:s},"",l):history.pushState({view:r,id:s},"",l),window.dispatchEvent(new CustomEvent("account:routechange",{detail:{view:r,id:s}}))}class ee{constructor({root:e,pages:t,context:s,navItems:r}){this._root=e,this._pages=t,this._context=s,this._navItems=r||document.querySelectorAll("[data-view]"),this._current=null,this._viewEl=null,this._onRouteChange=this._onRouteChange.bind(this),this._onPopState=this._onPopState.bind(this)}start(){window.addEventListener("account:routechange",this._onRouteChange),window.addEventListener("popstate",this._onPopState),this._renderFromURL()}destroy(){window.removeEventListener("account:routechange",this._onRouteChange),window.removeEventListener("popstate",this._onPopState),this._unmountCurrent()}_onRouteChange(e){const{view:t,id:s}=e.detail;this._renderPage(t,s)}_onPopState(){this._renderFromURL()}_renderFromURL(){const{view:e,id:t}=X();this._renderPage(e,t)}async _renderPage(e,t){const s=t?`${e}:${t}`:e;if(this._current===s)return;const r=this._pages[e]||this._pages[y];this._unmountCurrent();const a=document.createElement("div");a.className="account-view",a.dataset.view=e,this._root.appendChild(a),this._viewEl=a,this._current=s,this._updateNav(e);try{await r.mount(a,{...this._context,id:t})}catch(i){console.error(`[AccountRouter] Failed to mount view "${e}"`,i),a.innerHTML='<p class="account-view__error">ページを読み込めませんでした。</p>'}}_unmountCurrent(){if(this._current&&this._pages[this._current.split(":")[0]])try{this._pages[this._current.split(":")[0]].unmount()}catch{}this._viewEl&&(this._viewEl.remove(),this._viewEl=null),this._current=null}_updateNav(e){this._navItems.forEach(t=>{const s=t.dataset.view===e||t.dataset.view==="orders"&&e==="order";t.classList.toggle("my-account__nav-item--active",s)})}}class b{constructor(e,t){if(!e)throw new Error("[DiptyqueStorefrontClient] endpoint is required");if(!t)throw new Error("[DiptyqueStorefrontClient] token is required");this._endpoint=e,this._token=t}async request(e,t={}){let s;try{s=await fetch(this._endpoint,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json","X-Shopify-Storefront-Access-Token":this._token},body:JSON.stringify({query:e,variables:t})})}catch(a){throw new Error("[StorefrontClient] Network error: "+a.message)}if(!s.ok)throw new Error("[StorefrontClient] HTTP "+s.status+" "+s.statusText);const r=await s.json();if(r.errors&&r.errors.length){const a=r.errors.map(i=>i.message).join("; ");throw new Error("[StorefrontClient] GraphQL error: "+a)}return r.data||{}}}class I{constructor(e,t){if(!e)throw new Error("[DiptyqueBackendClient] baseUrl is required");if(!t)throw new Error("[DiptyqueBackendClient] getToken callback is required");this._base=e.replace(/\/+$/,""),this._getToken=t}async post(e,t={}){const s=this._base+e;let r;try{r=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customer_access_token:this._getToken(),...t})})}catch(i){throw new Error("[BackendClient] Network error: "+i.message)}let a;try{a=await r.json()}catch{a={}}if(!r.ok||a.success===!1){const i=new Error(a.message||"HTTP "+r.status);throw i.status=r.status,i.code=a.code,i.response=a,console.warn("[BackendClient]",r.status,s,a),i}return a.data!==void 0?a.data:a}}const te=`
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
`,se=`
  mutation CustomerTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken { accessToken expiresAt }
      customerUserErrors  { field message code }
    }
  }
`,re=`
  mutation CustomerMetafieldsSet($metafields: [CustomerMetafieldsSetInput!]!) {
    customerMetafieldsSet(metafields: $metafields) {
      metafields { namespace key value }
      userErrors  { field message code }
    }
  }
`,ae="https://shopify.com/account/customer/api/2024-10/graphql";function ie(n){if(!n)return null;const e=String(n).trim();if(/^\+\d{7,15}$/.test(e))return e;const t=e.replace(/[\s\-().]/g,"");return/^\d+$/.test(t)&&/^0\d{9,10}$/.test(t)?"+81"+t.slice(1):null}class ne{constructor(e,t){this._sf=e,this._be=t}async createAccessToken(e,t){var i,l,d;const r=(await this._sf.request(se,{input:{email:e,password:t}})).customerAccessTokenCreate,a=(r==null?void 0:r.customerUserErrors)||[];if(a.length||!((i=r==null?void 0:r.customerAccessToken)!=null&&i.accessToken)){const o=new Error(((l=a[0])==null?void 0:l.message)||"Invalid credentials");throw o.isAuthError=!0,o.code=((d=a[0])==null?void 0:d.code)||"UNIDENTIFIED_CUSTOMER",o}return r.customerAccessToken}async verifyPassword(e,t){return(await this.createAccessToken(e,t).catch(()=>{const r=new Error("currentPasswordInvalid");throw r.isPasswordError=!0,r.status=401,r})).accessToken}async fetchCustomer(e){return(await this._sf.request(te,{token:e})).customer||null}async updateProfile(e){return this._be.post("/api/customers/account/update-profile",{first_name:e.firstName,last_name:e.lastName,first_name_kana:e.first_name_kana,last_name_kana:e.last_name_kana,email:e.email,phone:e.phone,birthday:e.birthday||"",current_password:e.current_password||""})}async updatePassword(e,t){return this._be.post("/api/customers/account/update-password",{current_password:e,new_password:t})}async updateMetafields(e){var l,d,o,u,_;const t=[];if(e.last_name_kana&&t.push({namespace:"registration",key:"last_name_kana",value:e.last_name_kana,type:"single_line_text_field"}),e.first_name_kana&&t.push({namespace:"registration",key:"first_name_kana",value:e.first_name_kana,type:"single_line_text_field"}),e.birthday&&t.push({namespace:"registration",key:"birthday",value:e.birthday,type:"date"}),!t.length)return;const s=sessionStorage.getItem("dp_ca_token");if(!s){console.warn("[CustomerApi] No dp_ca_token — metafields not updated");return}const r=await fetch(ae,{method:"POST",headers:{"Content-Type":"application/json",Authorization:s},body:JSON.stringify({query:re,variables:{metafields:t}})});if(!r.ok)throw new Error("[CustomerApi] Customer Account API HTTP "+r.status);const a=await r.json();if((l=a.errors)!=null&&l.length)throw new Error(((d=a.errors[0])==null?void 0:d.message)||"Metafield GraphQL error");const i=((u=(o=a.data)==null?void 0:o.customerMetafieldsSet)==null?void 0:u.userErrors)||[];if(i.length)throw new Error(((_=i[0])==null?void 0:_.message)||"Metafield error")}async updateProfileNative(e,t){const s=new URLSearchParams;if(s.append("form_type","customer"),s.append("utf8","✓"),s.append("customer[first_name]",e.firstName||""),s.append("customer[last_name]",e.lastName||""),s.append("customer[email]",e.email||""),e.phone){const a=ie(e.phone);a&&s.append("customer[phone]",a)}t&&s.append("authenticity_token",t);const r=await fetch("/account",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:s.toString(),credentials:"same-origin"});if(!r.ok&&!r.redirected){const a=new Error("Native profile update failed: HTTP "+r.status);throw a.status=r.status,a.isNative=!0,a}}async updatePasswordNative(e,t,s){const r=new URLSearchParams;r.append("form_type","customer"),r.append("utf8","✓"),r.append("customer[password]",e),r.append("customer[password_confirmation]",t),s&&r.append("authenticity_token",s);const a=await fetch("/account",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:r.toString(),credentials:"same-origin"});if(!a.ok&&!a.redirected)throw new Error("Native password update failed: HTTP "+a.status)}}class oe{constructor(e,t){this._el=e,this._t=t,this._handlers={},this._dobPicker=null}on(e,t){this._handlers[e]=t}_emit(e,...t){this._handlers[e]?this._handlers[e](...t):console.warn("[ProfileRenderer] No handler for:",e)}renderLoading(){this._el.innerHTML=`
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
      </div>`}renderDashboard(e){const t=this._t,s=e.metafields||[],r=c($(s,"registration","last_name_kana")),a=c($(s,"registration","first_name_kana")),i=c(G($(s,"registration","birthday")));this._el.innerHTML=`
      <!-- ── Profile section ────────────────────────────────────────── -->
      <div class="my-account__form-section" data-section="profile">
        <h2 class="my-account__section-heading">${t("profile_title","お客様情報")}</h2>
        <div class="my-account__form-grid">

          <div class="my-account__form-field">
            <label for="ma-lastName">${t("last_name","姓")} *</label>
            <input id="ma-lastName" name="lastName" data-field="lastName"
              class="my-account__input" type="text"
              value="${c(e.lastName||"")}"
              placeholder="${t("last_name","姓")}" autocomplete="family-name">
            <span class="my-account__field-error" data-error-for="lastName" aria-live="polite"></span>
          </div>

          <div class="my-account__form-field">
            <label for="ma-firstName">${t("first_name","名")} *</label>
            <input id="ma-firstName" name="firstName" data-field="firstName"
              class="my-account__input" type="text"
              value="${c(e.firstName||"")}"
              placeholder="${t("first_name","名")}" autocomplete="given-name">
            <span class="my-account__field-error" data-error-for="firstName" aria-live="polite"></span>
          </div>

          <div class="my-account__form-field">
            <label for="ma-last-name-kana">${t("furigana_last","フリガナ（姓）")} *</label>
            <input id="ma-last-name-kana" name="last_name_kana" data-field="last_name_kana"
              class="my-account__input" type="text"
              value="${r}" placeholder="${t("furigana_last","フリガナ（姓）")}">
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
              value="${i}" placeholder="YYYY/MM/DD">
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
            value="${c(e.phone||"")}"
            placeholder="012322222" autocomplete="tel">
          <span class="my-account__field-error" data-error-for="phone" aria-live="polite"></span>
        </div>

        <div class="my-account__form-field my-account__form-field--full mt-16">
          <label for="ma-email">${t("email","Eメールアドレス")} *</label>
          <input id="ma-email" name="email" data-field="email"
            class="my-account__input" type="email"
            value="${c(e.email||"")}"
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
    `,this._bindEvents(e),this._initDobPicker()}setFieldError(e,t){const s=this._el.querySelector(`[data-field="${e}"]`),r=this._el.querySelector(`[data-error-for="${e}"]`);s&&(s.classList.add("my-account__input--error"),s.setAttribute("aria-invalid","true")),r&&(r.textContent=t)}clearFieldError(e){const t=this._el.querySelector(`[data-field="${e}"]`),s=this._el.querySelector(`[data-error-for="${e}"]`);t&&(t.classList.remove("my-account__input--error"),t.removeAttribute("aria-invalid")),s&&(s.textContent="")}setFormMessage(e,t,s){const r=this._el.querySelector(`[data-form-message="${s}"]`);r&&(r.textContent=t,r.className=e?`my-account__form-message my-account__form-message--${e}`:"my-account__form-message",e==="success"&&setTimeout(()=>{r.textContent===t&&(r.textContent="",r.className="my-account__form-message")},6e3))}setSubmitState(e,t,s){const r=this._el.querySelector(`[data-submit="${e}"]`);r&&(r.disabled=t,t?(r.dataset.originalText=r.textContent,r.textContent=s||"...",r.classList.add("my-account__submit-btn--loading")):(r.textContent=r.dataset.originalText||this._t("submit","確定"),delete r.dataset.originalText,r.classList.remove("my-account__submit-btn--loading")))}showEmailVerifyField(e){const t=this._el.querySelector("[data-profile-email-verify]");if(t&&(t.classList.toggle("my-account__form-field--hidden",!e),!e)){const s=t.querySelector('[data-field="profileCurrentPassword"]');s&&(s.value=""),this.clearFieldError("profileCurrentPassword")}}getProfileFormData(){const e=t=>{var s;return(((s=this._el.querySelector(`[data-field="${t}"]`))==null?void 0:s.value)??"").trim()};return{lastName:e("lastName"),firstName:e("firstName"),last_name_kana:e("last_name_kana"),first_name_kana:e("first_name_kana"),dob:e("dob"),phone:e("phone"),email:e("email"),profileCurrentPassword:e("profileCurrentPassword")}}getPasswordFormData(){const e=t=>{var s;return((s=this._el.querySelector(`[data-field="${t}"]`))==null?void 0:s.value)??""};return{currentPassword:e("currentPassword"),newPassword:e("newPassword"),confirmPassword:e("confirmPassword")}}clearPasswordFields(){["currentPassword","newPassword","confirmPassword"].forEach(e=>{const t=this._el.querySelector(`[data-field="${e}"]`);t&&(t.value="")})}_eyeIcon(){return`<button type="button" class="my-account__password-toggle">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    </button>`}_passwordField(e,t,s,r=!1){return`
      <div class="my-account__form-field my-account__form-field--full${r?" mt-16":""}">
        <label for="ma-${e}">${t} *</label>
        <div class="my-account__password-input">
          <input id="ma-${e}" name="${e}" data-field="${e}"
            class="my-account__input" type="password"
            placeholder="${t}" autocomplete="${s}">
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
      </div>`}_bindEvents(e){var t,s;this._el.querySelectorAll(".my-account__password-toggle").forEach(r=>{r.addEventListener("click",()=>{const a=r.previousElementSibling,i=a.type==="password";a.type=i?"text":"password",r.innerHTML=i?'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>':'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'})}),(t=this._el.querySelector('[data-submit="profile"]'))==null||t.addEventListener("click",()=>{this._emit("profile:submit",this.getProfileFormData())}),(s=this._el.querySelector('[data-submit="password"]'))==null||s.addEventListener("click",()=>{this._emit("password:submit",this.getPasswordFormData())}),this._el.querySelectorAll("[data-field]").forEach(r=>{r.addEventListener("input",()=>{if(this.clearFieldError(r.dataset.field),r.dataset.field==="email"){const a=(e.email||"").toLowerCase().trim()!==r.value.toLowerCase().trim();this.showEmailVerifyField(a)}})}),this.showEmailVerifyField(!1)}_initDobPicker(){if(this._dobPicker){try{this._dobPicker.destroy()}catch{}this._dobPicker=null}const e=document.getElementById("ma-dob"),t=document.getElementById("ma-dob-toggle");if(!e)return;const s=()=>{var i;const r=typeof flatpickr<"u"&&((i=flatpickr.l10ns)!=null&&i.ja)?flatpickr.l10ns.ja:"default",a=flatpickr(e,{dateFormat:"Y/m/d",allowInput:!0,disableMobile:!1,locale:r,maxDate:"today",minDate:"1900-01-01",appendTo:document.body,onReady(l,d,o){o.input.removeAttribute("readonly")},onChange(){e.dispatchEvent(new Event("input",{bubbles:!0}))}});t==null||t.addEventListener("click",l=>{l.preventDefault(),l.stopPropagation(),a.open()}),e.addEventListener("click",()=>a.open()),this._dobPicker=a};if(typeof flatpickr<"u")s();else{const r=setInterval(()=>{typeof flatpickr<"u"&&(clearInterval(r),s())},50)}}}function T(n){let e=n;const t=new Set,s=()=>t.forEach(r=>{try{r(e)}catch(a){console.error("[DiptyqueStore] Subscriber error",a)}});return{get(){return e},set(r){e=r,s()},update(r){e=r(e),s()},subscribe(r){return t.add(r),()=>t.delete(r)},find(r){return(Array.isArray(e)?e:(e==null?void 0:e.items)??[]).find(r)}}}const le=T({status:"idle",customer:null,error:null}),de=T({status:"idle",addresses:[],error:null}),ce=T({status:"idle",orders:[],hasNextPage:!1,endCursor:null,loadingMore:!1,error:null});class ue{constructor(e,t,s={}){this._api=e,this._renderer=t,this._isNative=s.isNative||!1,this._logoutUrl=s.logoutUrl||"/account/logout",this._getNativeSession=s.getNativeSession||null,this._store=le,this._store.subscribe(r=>{if(r.status==="loading"){t.renderLoading();return}if(r.status==="error"){window.location.href="/";return}r.status==="ready"&&r.customer&&(t.renderDashboard(r.customer),this._bindRendererActions())})}async load(e,t=null){var s,r;if(t){this._store.set({status:"ready",customer:t,error:null});return}if(!e){this._store.set({status:"error",customer:null,error:"no_session"});return}this._store.set({status:"loading",customer:null,error:null});try{const a=await this._api.fetchCustomer(e);if(!a){const i=(s=this._getNativeSession)==null?void 0:s.call(this);i?this._store.set({status:"ready",customer:i,error:null}):this._store.set({status:"error",customer:null,error:"invalid_token"});return}this._store.set({status:"ready",customer:a,error:null})}catch(a){console.error("[ProfileController] Failed to load customer",a);const i=(r=this._getNativeSession)==null?void 0:r.call(this);i?this._store.set({status:"ready",customer:i,error:null}):this._store.set({status:"error",customer:null,error:a.message})}}_bindRendererActions(){var e;this._renderer.on("profile:submit",t=>this._handleProfileSubmit(t)),this._renderer.on("password:submit",t=>this._handlePasswordSubmit(t)),(e=document.getElementById("my-account-logout"))==null||e.addEventListener("click",()=>{q(this._isNative?this._logoutUrl:"/")},{once:!0})}async _handleProfileSubmit(e){var d;if(this._profileBusy)return;this._profileBusy=!0;const t=this._renderer._t,s=this._renderer;s.setSubmitState("profile",!0,t("saving","保存中...")),s.setFormMessage("","","profile"),["lastName","firstName","last_name_kana","first_name_kana","dob","phone","email","profileCurrentPassword"].forEach(o=>s.clearFieldError(o));const a=this._validateProfile(e,t);if((((d=this._store.get().customer)==null?void 0:d.email)||"").toLowerCase()!==(e.email||"").toLowerCase()&&!e.profileCurrentPassword&&(a.profileCurrentPassword=t("validation_current_password_required_for_email","メールアドレスを変更する場合は現在のパスワードを入力してください。")),Object.keys(a).length){Object.entries(a).forEach(([o,u])=>s.setFieldError(o,u)),s.setSubmitState("profile",!1),this._profileBusy=!1;return}try{const o={firstName:e.firstName,lastName:e.lastName,first_name_kana:e.first_name_kana,last_name_kana:e.last_name_kana,email:e.email,phone:e.phone,birthday:e.dob?J(e.dob):"",current_password:e.profileCurrentPassword||""};this._isNative?await this._api.updateProfileNative(o,N()):await this._api.updateProfile(o);try{await this._api.updateMetafields({last_name_kana:o.last_name_kana,first_name_kana:o.first_name_kana,birthday:o.birthday})}catch(u){console.warn("[ProfileController] Metafield update skipped:",u.message)}this._store.update(u=>({...u,customer:{...u.customer,firstName:e.firstName,lastName:e.lastName,email:e.email,phone:e.phone}})),s.setFormMessage("success",t("save_success","情報が保存されました。"),"profile")}catch(o){console.error("[ProfileController] Profile update error",o),o.isPasswordError||o.status===401?s.setFieldError("profileCurrentPassword",t("validation_current_password_invalid","現在のパスワードが正しくありません。")):o.code==="TAKEN"?s.setFieldError("email",t("validation_email_taken","このメールアドレスは既に使用されています。")):s.setFormMessage("error",o.message||t("save_failed","保存に失敗しました。"),"profile")}finally{s.setSubmitState("profile",!1),this._profileBusy=!1}}async _handlePasswordSubmit(e){if(this._passwordBusy)return;this._passwordBusy=!0;const t=this._renderer._t,s=this._renderer;if(s.setSubmitState("password",!0,t("saving","保存中...")),s.setFormMessage("","","password"),["currentPassword","newPassword","confirmPassword"].forEach(a=>s.clearFieldError(a)),!e.currentPassword&&!e.newPassword&&!e.confirmPassword){s.setSubmitState("password",!1),this._passwordBusy=!1;return}const r=this._validatePassword(e,t);if(Object.keys(r).length){Object.entries(r).forEach(([a,i])=>s.setFieldError(a,i)),s.setSubmitState("password",!1),this._passwordBusy=!1;return}try{const a=this._store.get().customer;if(this._isNative)await this._api.updatePasswordNative(e.newPassword,e.confirmPassword,N());else{await this._api.updatePassword(e.currentPassword,e.newPassword),x.clear(),s.clearPasswordFields(),s.setFormMessage("success",t("password_changed_relogin","パスワードを変更しました。再度ログインしてください。"),"password"),setTimeout(()=>{window.location.href="/"},2e3);return}s.clearPasswordFields(),s.setFormMessage("success",t("save_success","情報が保存されました。"),"password")}catch(a){console.error("[ProfileController] Password update error",a),a.isPasswordError||a.status===401?s.setFieldError("currentPassword",t("validation_current_password_invalid","現在のパスワードが正しくありません。")):s.setFormMessage("error",a.message||t("save_failed","保存に失敗しました。"),"password")}finally{s.setSubmitState("password",!1),this._passwordBusy=!1}}_validateProfile(e,t){const s={},r=/^[\u30A0-\u30FF\u30FC\s]+$/,a=["lastName","firstName","last_name_kana","first_name_kana","phone","email"];for(const i of a)e[i]||(s[i]=t("validation_required","この項目は必須です。"));if(e.last_name_kana&&!s.last_name_kana&&!r.test(e.last_name_kana)&&(s.last_name_kana=t("validation_kana_invalid","全角カタカナで入力してください。")),e.first_name_kana&&!s.first_name_kana&&!r.test(e.first_name_kana)&&(s.first_name_kana=t("validation_kana_invalid","全角カタカナで入力してください。")),e.email&&!s.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email)&&(s.email=t("validation_email_invalid","有効なメールアドレスを入力してください。")),e.phone&&!s.phone){const i=e.phone;if(!/^[0-9+()\-\s]+$/.test(i))s.phone=t("validation_phone_invalid","有効な電話番号を入力してください。");else{const l=i.replace(/\D/g,"");(l.length<8||l.length>15)&&(s.phone=t("validation_phone_invalid","有効な電話番号を入力してください。"))}}if(e.dob)if(!/^\d{4}\/\d{2}\/\d{2}$/.test(e.dob))s.dob=t("validation_dob_invalid","YYYY/MM/DD 形式の有効な日付を入力してください。");else{const[i,l,d]=e.dob.split("/").map(Number),o=new Date(i,l-1,d);(!(o.getFullYear()===i&&o.getMonth()===l-1&&o.getDate()===d)||o>new Date)&&(s.dob=t("validation_dob_invalid","YYYY/MM/DD 形式の有効な日付を入力してください。"))}return s}_validatePassword(e,t){const s={};return e.currentPassword||(s.currentPassword=t("validation_required","この項目は必須です。")),e.newPassword?e.newPassword.length>=8&&/[a-zA-Z]/.test(e.newPassword)&&/\d/.test(e.newPassword)&&/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/.test(e.newPassword)||(s.newPassword=t("validation_password_weak","パスワードは8文字以上で、英字・数字・記号を含む必要があります。")):s.newPassword=t("validation_required","この項目は必須です。"),e.confirmPassword?e.newPassword&&e.confirmPassword!==e.newPassword&&(s.confirmPassword=t("validation_password_mismatch","パスワードが一致しません。")):s.confirmPassword=t("validation_required","この項目は必須です。"),s}}let w=null;const _e={async mount(n,e){const{config:t,t:s,token:r}=e,a=new b(t.storefrontEndpoint,t.storefrontToken),i=new I(t.apiBase,()=>localStorage.getItem("shopifyCustomerAccessToken")),l=new ne(a,i),d=new oe(n,s);w=new ue(l,d,{isNative:!1,logoutUrl:t.logoutUrl||"/account/logout",getNativeSession:()=>C.get()});const o=C.get();o?w.load(null,o):w.load(r)},unmount(){w=null}},pe=`
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
`;class me{constructor(e){this._sf=e}async list(e,t=10,s=null){var l;const r={token:e,first:t};s&&(r.after=s);const a=await this._sf.request(pe,r),i=((l=a==null?void 0:a.customer)==null?void 0:l.orders)??{edges:[],pageInfo:{hasNextPage:!1,endCursor:null}};return{orders:i.edges.map(d=>({...d.node,_cursor:d.cursor})),pageInfo:i.pageInfo}}}function F(n){if(!n)return"";try{return new Date(n).toLocaleDateString("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit"})}catch{return n}}function f(n){if(!n)return"";const e=parseFloat(n.amount??0),t=n.currencyCode??"JPY";try{return new Intl.NumberFormat("ja-JP",{style:"currency",currency:t,minimumFractionDigits:t==="JPY"?0:2}).format(e)}catch{return`${t} ${e}`}}const fe={PAID:{label:"発送済み",modifier:"paid"},PENDING:{label:"処理中",modifier:"pending"},AUTHORIZED:{label:"処理中",modifier:"pending"},PARTIALLY_PAID:{label:"処理中",modifier:"pending"},REFUNDED:{label:"返金済み",modifier:"refunded"},PARTIALLY_REFUNDED:{label:"返金済み",modifier:"refunded"},VOIDED:{label:"キャンセル",modifier:"cancelled"}},he={FULFILLED:{label:"配送済み",modifier:"fulfilled"},PARTIAL:{label:"一部配送",modifier:"partial"},UNFULFILLED:{label:"準備中",modifier:"unfulfilled"},IN_TRANSIT:{label:"配送中",modifier:"in-transit"},DELIVERED:{label:"配達完了",modifier:"delivered"}};function M(n){return fe[n==null?void 0:n.toUpperCase()]??{label:"処理中",modifier:"pending"}}function D(n){return n?he[n==null?void 0:n.toUpperCase()]??null:null}function ye(n){const e=(n.financialStatus??"").toUpperCase(),t=(n.fulfillmentStatus??"").toUpperCase();return e==="REFUNDED"||e==="PARTIALLY_REFUNDED"?"returned":e==="VOIDED"?"cancelled":t==="FULFILLED"||t==="DELIVERED"||t==="IN_TRANSIT"?"shipped":"processing"}const ge=[{key:"all",labelKey:"tab_all"},{key:"processing",labelKey:"tab_processing"},{key:"shipped",labelKey:"tab_shipped"},{key:"cancelled",labelKey:"tab_cancelled"},{key:"returned",labelKey:"tab_returned"}];class ve{constructor(e,t){this._container=e,this.t=t,this._handlers={},this._activeTab="all",this._expanded=new Set,this._bound=!1}on(e,t){this._handlers[e]=t}_emit(e,...t){this._handlers[e]&&this._handlers[e](...t)}render(e){if(e.status==="loading"&&!e.orders.length){this._renderLoading();return}if(e.status==="error"){this._renderError(e.error);return}this._renderPage(e)}_renderLoading(){this._container.innerHTML=`
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this.t("loading","読み込み中...")}</p>
      </div>`}_renderError(e){this._container.innerHTML=`
      <p class="my-account__form-message--error" style="margin-top:20px;">
        ${c(e||this.t("load_error","注文履歴の読み込みに失敗しました。"))}
      </p>`}_renderPage(e){const{orders:t,hasNextPage:s,loadingMore:r}=e,a=this._filterOrders(t,this._activeTab),i=`<p class="order-history__notice">${this.t("order_history_notice","本ページでは2021年以降のご注文履歴をご確認いただけます。2020年以前のご注文に関するお問い合わせはカスタマーサービスへご連絡ください。")}</p>`,l=this._renderTabs(),d=a.length?a.map(u=>this._renderOrderCard(u)).join(""):this._renderEmpty(),o=s?`<div class="order-history__load-more-wrap">
           <button class="order-history__load-more-btn${r?" is-loading":""}"
                   data-action="load-more" ${r?"disabled":""}>
             ${r?this.t("loading","読み込み中..."):this.t("load_more","さらに表示する")}
           </button>
         </div>`:"";this._container.innerHTML=`
      <div class="order-history">
        ${i}
        ${l}
        <div class="order-history__list" id="order-history-list">
          ${d}
        </div>
        ${o}
      </div>`,this._bindEvents()}_filterOrders(e,t){return t==="all"?e:e.filter(s=>ye(s)===t)}_renderTabs(){return`
      <div class="order-history__tabs" role="tablist">
        ${ge.map(e=>`
          <button class="order-history__tab${this._activeTab===e.key?" is-active":""}"
                  role="tab" aria-selected="${this._activeTab===e.key}"
                  data-action="tab" data-tab="${e.key}">
            ${this.t(e.labelKey,e.key)}
          </button>
        `).join("")}
      </div>`}_renderOrderCard(e){var v,U,B,z,j,Y;const t=M(e.financialStatus),s=D(e.fulfillmentStatus),r=s?s.label:t.label,a=s?s.modifier:t.modifier,i=F(e.processedAt),l=this._expanded.has(e.id),d=this._resolveTracking(e),o=((v=e.lineItems)==null?void 0:v.edges)??[],u=(U=o[0])==null?void 0:U.node,_=((z=(B=u==null?void 0:u.variant)==null?void 0:B.image)==null?void 0:z.url)??"",m=((Y=(j=u==null?void 0:u.variant)==null?void 0:j.image)==null?void 0:Y.altText)??(u==null?void 0:u.title)??"",p=o.reduce((Me,{node:De})=>Me+(De.quantity??1),0);return`
      <div class="order-history__card" data-order-id="${c(e.id)}">
        <div class="order-history__card-header">
          <span class="order-history__status order-history__status--${a}">${r}</span>
          <span class="order-history__date">${i}</span>
        </div>

        <div class="order-history__card-body">
          <div class="order-history__card-thumb">
            ${_?`<img src="${c(_)}" alt="${c(m)}" loading="lazy">`:'<div class="order-history__card-thumb-placeholder"></div>'}
            <span class="order-history__card-thumb-count">${p}</span>
          </div>

          <div class="order-history__card-info">
            <p class="order-history__order-id">
              ${this.t("order_id_label","ご注文ID")} <strong>${c(e.name)}</strong>
            </p>

            <p class="order-history__tracking${d?"":" order-history__tracking--unavailable"}">
              ${d?`<a href="${c(d.url)}" target="_blank" rel="noopener">${c(d.number)}</a>`:this.t("order_tracking_unavailable","トラッキングはご利用できません")}
            </p>

            <button class="order-history__toggle${l?" is-open":""}"
                    data-action="toggle-detail" data-order-id="${c(e.id)}">
              ${this.t("order_toggle_detail","ご注文詳細をみる")}
              <span class="order-history__toggle-arrow">▶</span>
            </button>
          </div>
        </div>

        <div class="order-history__detail${l?" is-open":""}" data-detail-id="${c(e.id)}">
          <div class="order-history__detail-inner">
            ${this._renderLineItems(e)}
            ${this._renderAddresses(e)}
            ${this._renderPayment(e)}
            ${this._renderDetailActions(e)}
          </div>
        </div>
      </div>`}_resolveTracking(e){var s;const t=e.successfulFulfillments??[];for(const r of t){const a=(s=r.trackingInfo)==null?void 0:s[0];if(a!=null&&a.number)return a}return null}_renderLineItems(e){var r;const t=((r=e.lineItems)==null?void 0:r.edges)??[];return t.length?`<div class="order-history__items">${t.map(({node:a})=>{var o,u,_;const i=(o=a.variant)==null?void 0:o.image,l=f(a.originalTotalPrice??((u=a.variant)==null?void 0:u.price)),d=(_=a.variant)!=null&&_.title&&a.variant.title!=="Default Title"?`<span class="order-history__item-variant">${c(a.variant.title)}</span>`:"";return`
        <div class="order-history__item">
          <div class="order-history__item-image${i?"":" order-history__item-image--placeholder"}">
            ${i?`<img src="${c(i.url)}" alt="${c(i.altText??a.title)}" loading="lazy">`:""}
          </div>
          <div class="order-history__item-info">
            <p class="order-history__item-name">${c(a.title)}</p>
            ${d}
            <p class="order-history__item-meta">数量: ${a.quantity}</p>
          </div>
          <p class="order-history__item-price">${l}</p>
        </div>`}).join("")}</div>`:""}_renderAddresses(e){const t=e.shippingAddress,s=e.billingAddress;if(!t&&!s)return"";const r=a=>a?[`${c(a.lastName??"")} ${c(a.firstName??"")}`.trim(),a.zip&&a.province?`〒${c(a.zip)} ${c(a.province)}`:"",a.city?c(a.city):"",a.address1?c(a.address1):"",a.address2?c(a.address2):"",a.phone?c(a.phone):""].filter(Boolean).join("<br>"):"—";return`
      <div class="order-history__addresses">
        <div class="order-history__address-col">
          <h4 class="order-history__address-title">${this.t("order_shipping_address","配送先情報")}</h4>
          <p class="order-history__address-body">${r(t)}</p>
          <p class="order-history__shipping-time">${this.t("order_shipping_time","配送時間: 指定しない")}</p>
        </div>
        <div class="order-history__address-col">
          <h4 class="order-history__address-title">${this.t("order_billing_address","ご依頼主")}</h4>
          <p class="order-history__address-body">${r(s)}</p>
        </div>
      </div>`}_renderPayment(e){const t=f(e.subtotalPrice),s=f(e.totalTax),r=f(e.currentTotalPrice);return`
      <div class="order-history__payment">
        <h4 class="order-history__payment-title">${this.t("order_payment_details","お支払い明細")}</h4>
        <div class="order-history__payment-row">
          <span>${this.t("order_subtotal","小計")}</span>
          <span>${t}</span>
        </div>
        <div class="order-history__payment-row">
          <span>${this.t("order_tax","税")}</span>
          <span>${s}</span>
        </div>
        <div class="order-history__payment-row order-history__payment-row--total">
          <span>${this.t("order_grand_total","合計 (税込)")}</span>
          <span>${r}</span>
        </div>
      </div>`}_renderDetailActions(e){const t=e.statusUrl??"#";return`
      <div class="order-history__detail-actions">
        <a href="${c(t)}" target="_blank" rel="noopener"
           class="order-history__receipt-btn">
          ${this.t("order_download_receipt","領収書をダウンロードする")}
        </a>
        <button class="order-history__reorder-link"
                data-action="reorder" data-order-id="${c(e.id)}">
          ${this.t("order_reorder","もう一度注文する")}
        </button>
      </div>`}_renderEmpty(){return`
      <div class="my-account__empty">
        <p>${this.t("no_orders","注文履歴はまだありません。")}</p>
        <a href="/collections/all" class="button">${this.t("start_shopping","ショッピングを始める")}</a>
      </div>`}_bindEvents(){this._bound||(this._bound=!0,this._container.addEventListener("click",e=>{const t=e.target.closest("[data-action]");if(!t)return;const s=t.dataset.action;if(s==="tab"){this._activeTab=t.dataset.tab,this._emit("order:tab-change",this._activeTab);return}if(s==="load-more"){this._emit("order:load-more");return}if(s==="toggle-detail"){const r=t.dataset.orderId;this._expanded.has(r)?this._expanded.delete(r):this._expanded.add(r);const a=this._container.querySelector(`.order-history__card[data-order-id="${CSS.escape(r)}"]`),i=this._container.querySelector(`.order-history__detail[data-detail-id="${CSS.escape(r)}"]`);if(a){const l=a.querySelector('[data-action="toggle-detail"]'),d=this._expanded.has(r);l==null||l.classList.toggle("is-open",d),i==null||i.classList.toggle("is-open",d)}return}s==="reorder"&&this._emit("order:reorder",t.dataset.orderId)}))}setLoadingMore(e){const t=this._container.querySelector('[data-action="load-more"]');t&&(t.disabled=e,t.textContent=e?this.t("loading","読み込み中..."):this.t("load_more","さらに表示する"),t.classList.toggle("is-loading",e))}}const R=10;class be{constructor(e,t){this._api=e,this._renderer=t,this._store=ce,this._token=null,this._unsubscribe=this._store.subscribe(s=>t.render(s)),t.on("order:tab-change",()=>{t.render(this._store.get())}),t.on("order:load-more",()=>this._loadMore())}destroy(){this._unsubscribe&&this._unsubscribe()}async load(e){if(!e){window.location.href="/";return}this._token=e,this._store.set({status:"loading",orders:[],hasNextPage:!1,endCursor:null,loadingMore:!1,error:null});try{const{orders:t,pageInfo:s}=await this._api.list(e,R,null);this._store.set({status:"ready",orders:t,hasNextPage:s.hasNextPage,endCursor:s.endCursor,loadingMore:!1,error:null})}catch(t){if(console.error("[OrderHistoryController] Load failed",t),t.status===401||t.status===403){window.location.href="/";return}this._store.set({status:"error",orders:[],hasNextPage:!1,endCursor:null,loadingMore:!1,error:t.message})}}async _loadMore(){const e=this._store.get();if(!(!e.hasNextPage||e.loadingMore)){this._store.update(t=>({...t,loadingMore:!0}));try{const{orders:t,pageInfo:s}=await this._api.list(this._token,R,e.endCursor);this._store.update(r=>({...r,orders:[...r.orders,...t],hasNextPage:s.hasNextPage,endCursor:s.endCursor,loadingMore:!1}))}catch(t){console.error("[OrderHistoryController] Load more failed",t),this._store.update(s=>({...s,loadingMore:!1}))}}}}let g=null;const we={async mount(n,e){const{config:t,t:s,token:r}=e,a=new b(t.storefrontEndpoint,t.storefrontToken),i=new me(a),l=new ve(n,s);if(g=new be(i,l),!r){h({view:"profile"});return}l.on("order:view-detail",d=>{h({view:"order",id:d})}),g.load(r)},unmount(){g&&g.destroy(),g=null}},ke=`
  query GetCustomerAddresses($token: String!) {
    customer(customerAccessToken: $token) {
      defaultAddress { id }
      addresses(first: 50) {
        edges { node {
          id firstName lastName name company
          address1 address2 city province provinceCode
          country countryCodeV2 zip phone
        }}
      }
    }
  }
`;class $e{constructor(e,t){this._sf=e,this._be=t}async list(e){var l,d;const[t,s]=await Promise.all([this._sf.request(ke,{token:e}),this._be.post("/api/customers/account/addresses").catch(()=>({}))]),r=t==null?void 0:t.customer;if(!r)return[];const a=((l=r.defaultAddress)==null?void 0:l.id)??null,i={};for(const o of s.addresses??[])i[String(o.id)]=o.extension_attributes??null;return(((d=r.addresses)==null?void 0:d.edges)??[]).map(({node:o})=>{const u=Z(o.id);return{id:u,first_name:o.firstName??null,last_name:o.lastName??null,name:o.name??null,company:o.company??null,address1:o.address1??null,address2:o.address2??null,city:o.city??null,province:E(o.province??""),province_code:o.provinceCode??null,country:o.country??null,country_code:o.countryCodeV2??null,zip:o.zip??null,phone:o.phone??null,default:a!=null&&o.id===a,extension_attributes:i[String(u)]??null}})}create(e){return this._be.post("/api/customers/account/addresses/create",e)}update(e,t){return this._be.post("/api/customers/account/addresses/update",{address_id:e,...t})}delete(e){return this._be.post("/api/customers/account/addresses/delete",{address_id:e})}setDefaultBilling(e){return this._be.post("/api/customers/account/addresses/set-default-billing",{address_id:e})}setDefaultShipping(e){return this._be.post("/api/customers/account/addresses/set-default-shipping",{address_id:e})}}const Ee=["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"];class Se{constructor(e,t){this._container=e,this.t=t,this._handlers={},this._zipTimer=null}on(e,t){this._handlers[e]=t}_emit(e,...t){this._handlers[e]&&this._handlers[e](...t)}renderLoading(){const e=this._listRoot();e.innerHTML=`
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this.t("loading","読み込み中...")}</p>
      </div>`}render(e){if(e.status==="loading"){this.renderLoading();return}if(e.status==="error"){this._renderError(e.error);return}e.status==="ready"&&this.renderAddressList(e.addresses)}renderAddressList(e){const t=this.t,s=this._listRoot(),r=e.filter(i=>{var l;return(((l=i.extension_attributes)==null?void 0:l.type)??"shipping")!=="billing"}),a=e.filter(i=>{var l;return((l=i.extension_attributes)==null?void 0:l.type)==="billing"});s.innerHTML=`
      <div class="addresses-details__wrapper">
        <div class="addresses-details__section">
          <h3 class="addresses-details__section-title">${t("address_shipping","配送先住所")}</h3>
          <div class="addresses-details__list" id="shipping-list">
            ${r.map(i=>this.renderCard(i)).join("")}
          </div>
          <div class="addresses-details__action-area mt-40" data-area="shipping">
            <button type="button" class="addresses-details__new-btn"
                    data-action="new-address" data-type="shipping">
              ${t("address_new_btn","新しい住所を登録する")}
            </button>
            <div class="my-account__address-form-container" data-id="new-shipping"></div>
          </div>
        </div>

        <div class="addresses-details__section mt-40">
          <h3 class="addresses-details__section-title">${t("address_billing","ご依頼主住所")}</h3>
          <div class="addresses-details__list" id="billing-list">
            ${a.map(i=>this.renderCard(i)).join("")}
          </div>
          <div class="addresses-details__action-area mt-40" data-area="billing">
            <button type="button" class="addresses-details__new-btn"
                    data-action="new-address" data-type="billing">
              ${t("address_new_btn","新しい住所を登録する")}
            </button>
            <div class="my-account__address-form-container" data-id="new-billing"></div>
          </div>
        </div>
      </div>`,this._bindListEvents()}renderCard(e){const t=this.t,s=e.extension_attributes??{},r=s.is_default_billing===!0||s.is_default_shipping===!0;return`
      <div class="addresses-details__card" data-id="${e.id}">
        <div class="addresses-details__card-info">
          ${r?`<span class="addresses-details__default-badge">${t("address_default_badge","デフォルト")}</span>`:""}
          <p class="addresses-details__name">${c(e.last_name||"")} ${c(e.first_name||"")}</p>
          <p>${c(e.zip||"")}</p>
          <p>${c(E(e.province||""))}</p>
          <p>${c(e.city||"")}</p>
          <p>${c(e.address1||"")}</p>
          ${e.address2?`<p>${c(e.address2)}</p>`:""}
          ${e.phone?`<p>${c(e.phone)}</p>`:""}
        </div>
        <div class="addresses-details__actions">
          <button type="button" class="my-account__text-btn"
                  data-action="edit-address" data-id="${e.id}">
            ${t("address_edit","編集")}
          </button>
          <button type="button" class="my-account__text-btn"
                  data-action="delete-address" data-id="${e.id}">
            ${t("address_delete","削除")}
          </button>
        </div>
      </div>
      <div class="my-account__address-form-container" data-id="${e.id}"></div>`}renderForm(e=null,t="billing"){const s=this.t,r=(e==null?void 0:e.extension_attributes)??{},a=(e==null?void 0:e.province)||"",i=E(a),l=r.lastname_kana??"",d=r.firstname_kana??"",o=r.is_default_billing===!0,u=r.is_default_shipping===!0,_=t==="billing"?`<label class="addresses-details__checkbox-label">
           <input type="checkbox" name="is_default_billing" value="1"${o?" checked":""}>
           ${s("default_billing_label","デフォルトの請求先住所に設定する")}
         </label>`:`<label class="addresses-details__checkbox-label">
           <input type="checkbox" name="is_default_shipping" value="1"${u?" checked":""}>
           ${s("default_shipping_label","デフォルトの配送先住所に設定する")}
         </label>`,m=Ee.map(p=>`<option value="${p}"${i===p?" selected":""}>${p}</option>`).join("");return`
      <form class="addresses-details__form" novalidate
            data-id="${(e==null?void 0:e.id)||""}" data-type="${t}"
            data-province-raw="${c(a)}">

        <div class="addresses-details__form-row">
          <div class="addresses-details__field">
            <label>${s("last_name","姓")} *</label>
            <input type="text" name="last_name" class="my-account__input"
                   value="${c((e==null?void 0:e.last_name)||"")}" required>
            <span class="my-account__field-error" data-error-for="last_name" aria-live="polite"></span>
          </div>
          <div class="addresses-details__field">
            <label>${s("first_name","名")} *</label>
            <input type="text" name="first_name" class="my-account__input"
                   value="${c((e==null?void 0:e.first_name)||"")}" required>
            <span class="my-account__field-error" data-error-for="first_name" aria-live="polite"></span>
          </div>
        </div>

        <div class="addresses-details__form-row">
          <div class="addresses-details__field">
            <label>${s("furigana_last","フリガナ（姓）")} *</label>
            <input type="text" name="lastname_kana" class="my-account__input"
                   value="${c(l)}" required placeholder="例：ヤマダ">
            <span class="my-account__field-error" data-error-for="lastname_kana" aria-live="polite"></span>
          </div>
          <div class="addresses-details__field">
            <label>${s("furigana_first","フリガナ（名）")} *</label>
            <input type="text" name="firstname_kana" class="my-account__input"
                   value="${c(d)}" required placeholder="例：タロウ">
            <span class="my-account__field-error" data-error-for="firstname_kana" aria-live="polite"></span>
          </div>
        </div>

        <div class="addresses-details__field">
          <label>${s("zip","郵便番号")} *</label>
          <input type="text" name="zip" class="my-account__input"
                 value="${c((e==null?void 0:e.zip)||"")}" required
                 placeholder="例：060-0000" maxlength="8" data-zip-autofill>
          <span class="my-account__field-error" data-error-for="zip" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${s("province","都道府県")} *</label>
          <select name="province" class="my-account__input" required>
            <option value="" disabled ${e!=null&&e.province?"":"selected"}>
              ${s("province_placeholder","都道府県を選択")}
            </option>
            ${m}
          </select>
          <span class="my-account__field-error" data-error-for="province" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${s("city","市区町村")} *</label>
          <input type="text" name="city" class="my-account__input"
                 value="${c((e==null?void 0:e.city)||"")}" required>
          <span class="my-account__field-error" data-error-for="city" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${s("address1","丁番・番地")} *</label>
          <input type="text" name="address1" class="my-account__input"
                 value="${c((e==null?void 0:e.address1)||"")}" required>
          <span class="my-account__field-error" data-error-for="address1" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${s("address2","マンション・建物名")}</label>
          <input type="text" name="address2" class="my-account__input"
                 value="${c((e==null?void 0:e.address2)||"")}">
        </div>

        <div class="addresses-details__field">
          <label>${s("phone","電話番号")} *</label>
          <input type="tel" name="phone" class="my-account__input"
                 value="${c((e==null?void 0:e.phone)||"")}" required>
          <span class="my-account__field-error" data-error-for="phone" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field addresses-details__field--checkbox">
          ${_}
        </div>

        <p class="addresses-details__required-label">${s("required","* 必須")}</p>
        <div class="my-account__form-message my-account__form-message--error" style="display:none;"></div>

        <button type="submit" class="addresses-details__submit-btn">
          ${s("address_submit","決定")}
        </button>
        <button type="button" class="addresses-details__cancel-btn" data-action="cancel-address">
          ${s("address_cancel","キャンセル")}
        </button>
      </form>`}closeAllForms(){this._container.querySelectorAll(".my-account__address-form-container").forEach(e=>{e.innerHTML=""}),this._container.querySelectorAll(".addresses-details__card").forEach(e=>{e.style.display=""}),this._container.querySelectorAll(".addresses-details__actions").forEach(e=>{e.style.display=""}),this._container.querySelectorAll('[data-action="new-address"]').forEach(e=>{e.style.display=""})}openForm(e,t,s){const r=this._container.querySelector(`.my-account__address-form-container[data-id="${e}"]`);r&&(r.innerHTML=this.renderForm(t,s)),this._bindFormEvents()}setFormError(e,t){const s=this._container.querySelector(`.addresses-details__form[data-id="${e}"]`),r=s==null?void 0:s.querySelector(".my-account__form-message--error");r&&(r.textContent=t,r.style.display="block")}setSubmitState(e,t,s){const r=this._container.querySelector(`.addresses-details__form[data-id="${e}"]`),a=r==null?void 0:r.querySelector('[type="submit"]');a&&(a.disabled=t,a.textContent=t?s||"...":this.t("address_submit","決定"))}_listRoot(){return this._container.querySelector("#addresses-list-root")||this._container}_renderError(e){this._listRoot().innerHTML=`
      <p class="my-account__form-message--error" style="margin-top:20px;">
        ${e||this.t("save_error","保存に失敗しました。")}
      </p>`}_bindListEvents(){this._listBound||(this._listBound=!0,this._container.addEventListener("click",e=>{const t=e.target.closest("[data-action]");if(!t)return;const s=t.dataset.action;if(s==="new-address"){const r=t.dataset.type||"billing";this.closeAllForms(),t.style.display="none",this.openForm("new-"+r,null,r);return}if(s==="edit-address"){this._emit("address:edit",t.dataset.id);return}if(s==="cancel-address"){this.closeAllForms();return}if(s==="delete-address"){this._emit("address:delete",t.dataset.id,t);return}},{capture:!1}),this._container.addEventListener("submit",async e=>{const t=e.target.closest(".addresses-details__form");t&&(e.preventDefault(),this._emit("address:save",t))}),this._container.addEventListener("input",e=>{var r;const t=e.target.closest("[name]");if(!t)return;t.classList.remove("is-invalid");const s=(r=t.closest(".addresses-details__field"))==null?void 0:r.querySelector(`[data-error-for="${t.name}"]`);s&&(s.textContent=""),t.matches("[data-zip-autofill]")&&this._scheduleZipLookup(t)}),this._container.addEventListener("change",e=>{var r;const t=e.target.closest("[name]");if(!t)return;t.classList.remove("is-invalid");const s=(r=t.closest(".addresses-details__field"))==null?void 0:r.querySelector(`[data-error-for="${t.name}"]`);s&&(s.textContent="")}))}_bindFormEvents(){}_scheduleZipLookup(e){clearTimeout(this._zipTimer),!(e.value.replace(/[^0-9]/g,"").length<7)&&(this._zipTimer=setTimeout(()=>this._doZipLookup(e),300))}async _doZipLookup(e){var a;const t=e.closest(".addresses-details__form");if(!t)return;const s=t.querySelector('[data-error-for="zip"]'),r=e.value.replace(/[^0-9]/g,"");s&&(s.textContent="");try{const l=await(await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${r}`)).json();if(!((a=l.results)!=null&&a.length)){s&&(s.textContent="該当する住所が見つかりませんでした。");return}const d=l.results[0],o=t.querySelector('[name="province"]'),u=t.querySelector('[name="city"]'),_=t.querySelector('[name="address1"]');o&&Array.from(o.options).find(p=>p.value===d.address1)&&(o.value=d.address1),u&&(u.value=d.address2||""),_&&!_.value.trim()&&(_.value=d.address3||"")}catch(i){console.error("[AddressRenderer] Zip lookup failed",i),s&&(s.textContent="住所検索に失敗しました。")}}}class Pe{constructor(e,t){this._api=e,this._renderer=t,this._store=de,this._store.subscribe(s=>t.render(s)),t.on("address:edit",s=>this._onEdit(s)),t.on("address:delete",(s,r)=>this._onDelete(s,r)),t.on("address:save",s=>this._onSave(s))}async load(e){if(!e){window.location.href="/";return}this._accessToken=e,this._store.set({status:"loading",addresses:[],error:null});try{const t=await this._api.list(e);this._store.set({status:"ready",addresses:t,error:null})}catch(t){if(console.error("[AddressController] Failed to load addresses",t),t.status===401||t.status===403){window.location.href="/";return}this._store.set({status:"error",addresses:[],error:t.message})}}async _reload(){try{const e=await this._api.list(this._accessToken);this._store.set({status:"ready",addresses:e,error:null})}catch(e){console.error("[AddressController] Reload failed",e),this._store.set({status:"error",addresses:[],error:e.message})}}_onEdit(e){var a;const t=this._store.get().addresses.find(i=>String(i.id)===String(e));if(!t){console.warn("[AddressController] Address not found:",e);return}const s=((a=t.extension_attributes)==null?void 0:a.type)||"shipping";this._renderer.closeAllForms();const r=this._renderer._container.querySelector(`.addresses-details__card[data-id="${e}"]`);if(r){const i=r.querySelector(".addresses-details__actions");i&&(i.style.display="none")}this._renderer.openForm(e,t,s)}async _onDelete(e,t){const s=this._renderer.t;if(!confirm(s("confirm_delete","本当にこの住所を削除しますか？")))return;t&&(t.textContent="...",t.disabled=!0);const r=this._store.get().addresses;this._store.update(a=>({...a,addresses:a.addresses.filter(i=>String(i.id)!==String(e))}));try{await this._api.delete(e),await this._reload()}catch(a){console.error("[AddressController] Delete failed",a),this._store.update(i=>({...i,addresses:r})),t&&(t.textContent=s("address_delete","削除"),t.disabled=!1),alert(s("delete_error","削除に失敗しました。"))}}async _onSave(e){const t=this._renderer.t,s=e.dataset.id,r=e.dataset.type||"billing",a=!!s,i=new FormData(e),l=this._validate(i,t);if(Object.keys(l).length){this._showFormErrors(e,l);return}const d={type:r,first_name:(i.get("first_name")||"").trim(),last_name:(i.get("last_name")||"").trim(),firstname_kana:(i.get("firstname_kana")||"").trim(),lastname_kana:(i.get("lastname_kana")||"").trim(),zip:(i.get("zip")||"").trim(),province:(i.get("province")||"").trim(),city:(i.get("city")||"").trim(),address1:(i.get("address1")||"").trim(),address2:(i.get("address2")||"").trim(),phone:(i.get("phone")||"").trim(),country:"Japan",is_default_billing:!!i.get("is_default_billing"),is_default_shipping:!!i.get("is_default_shipping")};this._renderer.setSubmitState(s||`new-${r}`,!0);const o=e.querySelector(".my-account__form-message--error");o&&(o.style.display="none");try{a?await this._api.update(s,d):await this._api.create(d),await this._reload()}catch(u){console.error("[AddressController] Save failed",u),o&&(o.textContent=u.message||t("save_error","保存に失敗しました。"),o.style.display="block"),this._renderer.setSubmitState(s||`new-${r}`,!1)}}_validate(e,t){var d,o,u,_;const s={},r=/^[ァ-ヶーｦ-ﾟ\s\u3000]+$/,a=["last_name","first_name","lastname_kana","firstname_kana","zip","province","city","address1","phone"];for(const m of a)(d=e.get(m))!=null&&d.trim()||(s[m]="必須項目です");for(const m of["lastname_kana","firstname_kana"]){const p=((o=e.get(m))==null?void 0:o.trim())||"";p&&!s[m]&&!r.test(p)&&(s[m]="カタカナで入力してください")}const i=(e.get("zip")||"").replace(/[^0-9]/g,"");(u=e.get("zip"))!=null&&u.trim()&&!s.zip&&i.length!==7&&(s.zip="郵便番号は7桁で入力してください（例：0600000）");const l=((_=e.get("phone"))==null?void 0:_.trim())||"";return l&&!s.phone&&!/^[0-9\-+\s()]{7,20}$/.test(l)&&(s.phone=t("phone_invalid","無効な電話番号です")),s}_showFormErrors(e,t){Object.entries(t).forEach(([r,a])=>{const i=e.querySelector(`[data-error-for="${r}"]`),l=e.querySelector(`[name="${r}"]`);i&&(i.textContent=a),l&&l.classList.add("is-invalid")});const s=e.querySelector(".is-invalid");s&&s.focus()}}let A=null;const Ce={async mount(n,e){const{config:t,t:s,token:r}=e,a=new b(t.storefrontEndpoint,t.storefrontToken),i=new I(t.apiBase,()=>localStorage.getItem("shopifyCustomerAccessToken"));if(!r){h({view:"profile"});return}const l=new $e(a,i),d=new Se(n,s);A=new Pe(l,d),A.load(r)},unmount(){A=null}},Te=`
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
`;let k=!1;function Ae(n){return`gid://shopify/Order/${n}`}function xe(n,e){n.innerHTML=`<div class="order-detail__loading">${e("loading","読み込み中…")}</div>`}function O(n,e){n.innerHTML=`<div class="order-detail__error">${e}</div>`}function Ne(n,e,t){var u;const s=M(e.financialStatus)||{},r=D(e.fulfillmentStatus)||{},a=s.label||r.label||e.financialStatus,i=s.modifier||r.modifier||"default",l=e.lineItems.edges.map(({node:_})=>{var p,v;return`
      <div class="order-detail__item">
        ${(p=_.variant)!=null&&p.image?`<img src="${_.variant.image.url}" alt="${_.variant.image.altText||_.title}" class="order-detail__item-img">`:'<div class="order-detail__item-img order-detail__item-img--placeholder"></div>'}
        <div class="order-detail__item-info">
          <p class="order-detail__item-title">${_.title}</p>
          ${(v=_.variant)!=null&&v.title&&_.variant.title!=="Default Title"?`<p class="order-detail__item-variant">${_.variant.title}</p>`:""}
          <p class="order-detail__item-qty">${t("qty","数量")}: ${_.quantity}</p>
        </div>
        <p class="order-detail__item-price">${f(_.originalTotalPrice)}</p>
      </div>`}).join(""),d=e.shippingAddress,o=d?`<address class="order-detail__address">
        ${d.lastName} ${d.firstName}<br>
        ${d.address1}${d.address2?" "+d.address2:""}<br>
        ${d.city} ${d.province} ${d.zip}<br>
        ${d.country}
       </address>`:"";n.innerHTML=`
    <div class="order-detail">
      <button type="button" class="order-detail__back js-order-detail-back">
        ← ${t("nav_orders","注文履歴")}
      </button>

      <header class="order-detail__header">
        <h2 class="order-detail__number">${t("order_number","注文番号")} #${e.orderNumber}</h2>
        <time class="order-detail__date" datetime="${e.processedAt}">
          ${F(e.processedAt)}
        </time>
        <span class="order-detail__status order-detail__status--${i}">
          ${a}
        </span>
      </header>

      <section class="order-detail__items">
        <h3 class="order-detail__section-title">${t("order_items","商品")}</h3>
        ${l}
      </section>

      <section class="order-detail__totals">
        <div class="order-detail__total-row">
          <span>${t("subtotal","小計")}</span>
          <span>${f(e.subtotalPrice)}</span>
        </div>
        <div class="order-detail__total-row">
          <span>${t("shipping","配送料")}</span>
          <span>${f(e.totalShippingPrice)}</span>
        </div>
        <div class="order-detail__total-row order-detail__total-row--grand">
          <span>${t("total","合計")}</span>
          <span>${f(e.totalPrice)}</span>
        </div>
      </section>

      ${d?`<section class="order-detail__shipping">
        <h3 class="order-detail__section-title">${t("shipping_address","配送先")}</h3>
        ${o}
      </section>`:""}
    </div>
  `,(u=n.querySelector(".js-order-detail-back"))==null||u.addEventListener("click",()=>{h({view:"orders"})})}const qe={async mount(n,e){var i;const{config:t,t:s,token:r,id:a}=e;if(k=!1,!a){h({view:"orders"});return}xe(n,s);try{const d=await new b(t.storefrontEndpoint,t.storefrontToken).request(Te,{orderId:Ae(a)});if(k)return;const o=(i=d==null?void 0:d.data)==null?void 0:i.node;if(!o){O(n,s("order_not_found","注文が見つかりませんでした。"));return}Ne(n,o,s)}catch(l){if(k)return;console.error("[OrderDetailPage] Failed to load order",l),O(n,s("order_load_error","注文の読み込みに失敗しました。"))}},unmount(){k=!0}};function Le(){const n=localStorage.getItem("shopifyCustomerAccessToken"),e=localStorage.getItem("shopifyCustomerAccessTokenExpiresAt");return n&&e&&new Date(e)>new Date?{token:n,isNative:!1}:C.get()?{token:null,isNative:!0}:null}function Ie(n){var d;const e=document.querySelector(".account-button");if(!e||e.dataset.accountInitialized)return;e.dataset.accountInitialized="true";const t=localStorage.getItem("shopifyCustomerAccessToken"),s=localStorage.getItem("shopifyCustomerAccessTokenExpiresAt");if(!(t&&s&&new Date(s)>new Date))return;const a=e.querySelector("[data-open-account-modal]");if(!a)return;const i=document.createElement("button");i.type="button",i.className=a.className,i.setAttribute("aria-label",a.getAttribute("aria-label")||"Account"),i.setAttribute("aria-haspopup","true"),i.setAttribute("aria-expanded","false"),i.innerHTML=a.innerHTML,a.replaceWith(i);const l=document.createElement("div");l.className="account-dropdown",l.setAttribute("role","menu"),l.innerHTML=`
    <a href="/pages/account" class="account-dropdown__item" role="menuitem">
      ${n("header_my_account","マイアカウント")}
    </a>
    <button type="button" class="account-dropdown__item" id="header-logout-btn" role="menuitem">
      ${n("logout","ログアウト")}
    </button>`,e.appendChild(l),i.addEventListener("click",o=>{o.stopPropagation();const u=l.classList.toggle("is-open");i.setAttribute("aria-expanded",String(u))}),(d=l.querySelector("#header-logout-btn"))==null||d.addEventListener("click",()=>{q("/")}),document.addEventListener("click",()=>{l.classList.remove("is-open"),i.setAttribute("aria-expanded","false")}),document.addEventListener("keydown",o=>{o.key==="Escape"&&(l.classList.remove("is-open"),i.setAttribute("aria-expanded","false"))})}function Fe(){document.querySelectorAll("[data-view]").forEach(n=>{n.addEventListener("click",e=>{e.preventDefault();const t=n.dataset.view;t&&h({view:t})})})}function H(){const n=document.getElementById("account-root");if(!n)return;const e=Le();if(!e){window.location.href="/";return}const t=V("account-config"),s=K("account-i18n");if(!t.storefrontEndpoint||!t.storefrontToken){console.error("[account-app] Missing storefront config in #account-config");return}const r={config:t,t:s,token:e.token},a=new ee({root:n,pages:{profile:_e,orders:we,addresses:Ce,order:qe},context:r,navItems:document.querySelectorAll("[data-view]")});Fe(),a.start(),Ie(s)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",H):H()})();
