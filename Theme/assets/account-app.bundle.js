(function(){"use strict";function ie(i){let e={};try{const t=document.getElementById(i);t&&t.textContent.trim()!=="null"&&(e=JSON.parse(t.textContent)||{})}catch(t){console.warn("[DiptyqueAccount] Failed to parse i18n from #"+i,t)}return function(r,s){return r in e?e[r]:s!==void 0?s:(console.warn("[DiptyqueAccount] Missing i18n key:",r),r)}}function ne(i){try{const e=document.getElementById(i);if(e)return JSON.parse(e.textContent)||{}}catch(e){console.warn("[DiptyqueAccount] Failed to parse config from #"+i,e)}return{}}function c(i){if(!i&&i!==0)return"";const e=document.createElement("div");return e.textContent=String(i),e.innerHTML}function oe(i){return!i||!/^\d{4}-\d{2}-\d{2}$/.test(i)?i||"":i.replace(/-/g,"/")}function le(i){return!i||!/^\d{4}\/\d{2}\/\d{2}$/.test(i)?i||"":i.replace(/\//g,"-")}function de(i){if(!i)return null;const e=i.match(/\/(\d+)/);return e?Number(e[1]):null}function T(i,e,t){if(!Array.isArray(i))return"";const r=i.find(s=>s&&s.namespace===e&&s.key===t);return r&&r.value||""}const ce={Aichi:"愛知県",Akita:"秋田県",Aomori:"青森県",Chiba:"千葉県",Ehime:"愛媛県",Fukui:"福井県",Fukuoka:"福岡県",Fukushima:"福島県",Gifu:"岐阜県",Gunma:"群馬県",Hiroshima:"広島県",Hokkaido:"北海道",Hokkaidō:"北海道",Hyogo:"兵庫県",Hyōgo:"兵庫県",Ibaraki:"茨城県",Ishikawa:"石川県",Iwate:"岩手県",Kagawa:"香川県",Kagoshima:"鹿児島県",Kanagawa:"神奈川県",Kochi:"高知県",Kōchi:"高知県",Kumamoto:"熊本県",Kyoto:"京都府",Kyōto:"京都府",Mie:"三重県",Miyagi:"宮城県",Miyazaki:"宮崎県",Nagano:"長野県",Nagasaki:"長崎県",Nara:"奈良県",Niigata:"新潟県",Oita:"大分県",Ōita:"大分県",Okayama:"岡山県",Okinawa:"沖縄県",Osaka:"大阪府",Ōsaka:"大阪府",Saga:"佐賀県",Saitama:"埼玉県",Shiga:"滋賀県",Shimane:"島根県",Shizuoka:"静岡県",Tochigi:"栃木県",Tokushima:"徳島県",Tokyo:"東京都",Tōkyō:"東京都",Tottori:"鳥取県",Toyama:"富山県",Wakayama:"和歌山県",Yamagata:"山形県",Yamaguchi:"山口県",Yamanashi:"山梨県"};function A(i){return ce[i]||i}const N="shopifyCustomerAccessToken",q="shopifyCustomerAccessTokenExpiresAt",ue="shopifyCustomer",U={get(){if(document.getElementById("my-account-native-customer"))return{token:null,isNative:!0};const i=localStorage.getItem(N),e=localStorage.getItem(q);return!i||!e?null:new Date(e)<=new Date?(this.clear(),null):{token:i,isNative:!1}},save(i,e){localStorage.setItem(N,i),localStorage.setItem(q,e)},clear(){localStorage.removeItem(N),localStorage.removeItem(q),localStorage.removeItem(ue)},getToken(){const i=this.get();return i?i.token:null},isNative(){return!!document.getElementById("my-account-native-customer")}},L={get(){const i=document.getElementById("my-account-native-customer");if(!i)return null;try{return JSON.parse(i.textContent||"null")||null}catch(e){return console.warn("[DiptyqueAccount] Failed to parse #ma-native-customer JSON",e),null}}};function j(){var i;return((i=document.querySelector('#ma-native-form [name="authenticity_token"]'))==null?void 0:i.value)||""}function Y(i){U.clear(),sessionStorage.removeItem("dp_ca_token"),window.location.href=i||"/"}const B=["profile","orders","addresses","order","newsletter","saved-cards"],v="profile";function _e(){const i=new URLSearchParams(window.location.search),e=(i.get("tab")||"").trim().toLowerCase(),t=B.includes(e)?e:v,r=i.get("id")||null;return{view:t,id:r}}function g(i,e=!1){const{view:t=v,id:r=null}=i,s=B.includes(t)?t:v,a=new URLSearchParams;s!==v&&a.set("tab",s),r&&a.set("id",r);const n=a.toString()?`?${a.toString()}`:"",o=`${window.location.pathname}${n}`;e?history.replaceState({view:s,id:r},"",o):history.pushState({view:s,id:r},"",o),window.dispatchEvent(new CustomEvent("account:routechange",{detail:{view:s,id:r}}))}class pe{constructor({root:e,pages:t,context:r,navItems:s}){this._root=e,this._pages=t,this._context=r,this._navItems=s||document.querySelectorAll("[data-view]"),this._current=null,this._viewEl=null,this._onRouteChange=this._onRouteChange.bind(this),this._onPopState=this._onPopState.bind(this)}start(){window.addEventListener("account:routechange",this._onRouteChange),window.addEventListener("popstate",this._onPopState),this._renderFromURL()}destroy(){window.removeEventListener("account:routechange",this._onRouteChange),window.removeEventListener("popstate",this._onPopState),this._unmountCurrent()}_onRouteChange(e){const{view:t,id:r}=e.detail;this._renderPage(t,r)}_onPopState(){this._renderFromURL()}_renderFromURL(){const{view:e,id:t}=_e();this._renderPage(e,t)}async _renderPage(e,t){const r=t?`${e}:${t}`:e;if(this._current===r)return;const s=this._pages[e]||this._pages[v];this._unmountCurrent();const a=document.createElement("div");a.className="account-view",a.dataset.view=e,this._root.appendChild(a),this._viewEl=a,this._current=r,this._updateNav(e);try{await s.mount(a,{...this._context,id:t})}catch(n){console.error(`[AccountRouter] Failed to mount view "${e}"`,n),a.innerHTML='<p class="account-view__error">ページを読み込めませんでした。</p>'}}_unmountCurrent(){if(this._current&&this._pages[this._current.split(":")[0]])try{this._pages[this._current.split(":")[0]].unmount()}catch{}this._viewEl&&(this._viewEl.remove(),this._viewEl=null),this._current=null}_updateNav(e){this._navItems.forEach(t=>{const r=t.dataset.view===e||t.dataset.view==="orders"&&e==="order";t.classList.toggle("my-account__nav-item--active",r)})}}class w{constructor(e,t){if(!e)throw new Error("[DiptyqueStorefrontClient] endpoint is required");if(!t)throw new Error("[DiptyqueStorefrontClient] token is required");this._endpoint=e,this._token=t}async request(e,t={}){let r;try{r=await fetch(this._endpoint,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json","X-Shopify-Storefront-Access-Token":this._token},body:JSON.stringify({query:e,variables:t})})}catch(a){throw new Error("[StorefrontClient] Network error: "+a.message)}if(!r.ok)throw new Error("[StorefrontClient] HTTP "+r.status+" "+r.statusText);const s=await r.json();if(s.errors&&s.errors.length){const a=s.errors.map(n=>n.message).join("; ");throw new Error("[StorefrontClient] GraphQL error: "+a)}return s.data||{}}}class D{constructor(e,t){if(!e)throw new Error("[DiptyqueBackendClient] baseUrl is required");if(!t)throw new Error("[DiptyqueBackendClient] getToken callback is required");this._base=e.replace(/\/+$/,""),this._getToken=t}async post(e,t={}){const r=this._base+e;let s;try{s=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customer_access_token:this._getToken(),...t})})}catch(n){throw new Error("[BackendClient] Network error: "+n.message)}let a;try{a=await s.json()}catch{a={}}if(!s.ok||a.success===!1){const n=new Error(a.message||"HTTP "+s.status);throw n.status=s.status,n.code=a.code,n.response=a,console.warn("[BackendClient]",s.status,r,a),n}return a.data!==void 0?a.data:a}}const me=`
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
`,he=`
  mutation CustomerTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken { accessToken expiresAt }
      customerUserErrors  { field message code }
    }
  }
`,fe=`
  mutation CustomerMetafieldsSet($metafields: [CustomerMetafieldsSetInput!]!) {
    customerMetafieldsSet(metafields: $metafields) {
      metafields { namespace key value }
      userErrors  { field message code }
    }
  }
`,ye="https://shopify.com/account/customer/api/2024-10/graphql";function ge(i){if(!i)return null;const e=String(i).trim();if(/^\+\d{7,15}$/.test(e))return e;const t=e.replace(/[\s\-().]/g,"");return/^\d+$/.test(t)&&/^0\d{9,10}$/.test(t)?"+81"+t.slice(1):null}class be{constructor(e,t){this._sf=e,this._be=t}async createAccessToken(e,t){var n,o,d;const s=(await this._sf.request(he,{input:{email:e,password:t}})).customerAccessTokenCreate,a=(s==null?void 0:s.customerUserErrors)||[];if(a.length||!((n=s==null?void 0:s.customerAccessToken)!=null&&n.accessToken)){const l=new Error(((o=a[0])==null?void 0:o.message)||"Invalid credentials");throw l.isAuthError=!0,l.code=((d=a[0])==null?void 0:d.code)||"UNIDENTIFIED_CUSTOMER",l}return s.customerAccessToken}async verifyPassword(e,t){return(await this.createAccessToken(e,t).catch(()=>{const s=new Error("currentPasswordInvalid");throw s.isPasswordError=!0,s.status=401,s})).accessToken}async fetchCustomer(e){return(await this._sf.request(me,{token:e})).customer||null}async updateProfile(e){return this._be.post("/api/customers/account/update-profile",{first_name:e.firstName,last_name:e.lastName,first_name_kana:e.first_name_kana,last_name_kana:e.last_name_kana,email:e.email,phone:e.phone,birthday:e.birthday||"",current_password:e.current_password||""})}async updatePassword(e,t){return this._be.post("/api/customers/account/update-password",{current_password:e,new_password:t})}async updateMetafields(e){var o,d,l,u,_;const t=[];if(e.last_name_kana&&t.push({namespace:"registration",key:"last_name_kana",value:e.last_name_kana,type:"single_line_text_field"}),e.first_name_kana&&t.push({namespace:"registration",key:"first_name_kana",value:e.first_name_kana,type:"single_line_text_field"}),e.birthday&&t.push({namespace:"registration",key:"birthday",value:e.birthday,type:"date"}),!t.length)return;const r=sessionStorage.getItem("dp_ca_token");if(!r){console.warn("[CustomerApi] No dp_ca_token — metafields not updated");return}const s=await fetch(ye,{method:"POST",headers:{"Content-Type":"application/json",Authorization:r},body:JSON.stringify({query:fe,variables:{metafields:t}})});if(!s.ok)throw new Error("[CustomerApi] Customer Account API HTTP "+s.status);const a=await s.json();if((o=a.errors)!=null&&o.length)throw new Error(((d=a.errors[0])==null?void 0:d.message)||"Metafield GraphQL error");const n=((u=(l=a.data)==null?void 0:l.customerMetafieldsSet)==null?void 0:u.userErrors)||[];if(n.length)throw new Error(((_=n[0])==null?void 0:_.message)||"Metafield error")}async updateProfileNative(e,t){const r=new URLSearchParams;if(r.append("form_type","customer"),r.append("utf8","✓"),r.append("customer[first_name]",e.firstName||""),r.append("customer[last_name]",e.lastName||""),r.append("customer[email]",e.email||""),e.phone){const a=ge(e.phone);a&&r.append("customer[phone]",a)}t&&r.append("authenticity_token",t);const s=await fetch("/account",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:r.toString(),credentials:"same-origin"});if(!s.ok&&!s.redirected){const a=new Error("Native profile update failed: HTTP "+s.status);throw a.status=s.status,a.isNative=!0,a}}async updatePasswordNative(e,t,r){const s=new URLSearchParams;s.append("form_type","customer"),s.append("utf8","✓"),s.append("customer[password]",e),s.append("customer[password_confirmation]",t),r&&s.append("authenticity_token",r);const a=await fetch("/account",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:s.toString(),credentials:"same-origin"});if(!a.ok&&!a.redirected)throw new Error("Native password update failed: HTTP "+a.status)}}class ve{constructor(e,t){this._el=e,this._t=t,this._handlers={},this._dobPicker=null}on(e,t){this._handlers[e]=t}_emit(e,...t){this._handlers[e]?this._handlers[e](...t):console.warn("[ProfileRenderer] No handler for:",e)}renderLoading(){this._el.innerHTML=`
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
      </div>`}renderDashboard(e){const t=this._t,r=e.metafields||[],s=c(T(r,"registration","last_name_kana")),a=c(T(r,"registration","first_name_kana")),n=c(oe(T(r,"registration","birthday")));this._el.innerHTML=`
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
      </div>`}_bindEvents(e){var t,r;this._el.querySelectorAll(".my-account__password-toggle").forEach(s=>{s.addEventListener("click",()=>{const a=s.previousElementSibling,n=a.type==="password";a.type=n?"text":"password",s.innerHTML=n?'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>':'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'})}),(t=this._el.querySelector('[data-submit="profile"]'))==null||t.addEventListener("click",()=>{this._emit("profile:submit",this.getProfileFormData())}),(r=this._el.querySelector('[data-submit="password"]'))==null||r.addEventListener("click",()=>{this._emit("password:submit",this.getPasswordFormData())}),this._el.querySelectorAll("[data-field]").forEach(s=>{s.addEventListener("input",()=>{if(this.clearFieldError(s.dataset.field),s.dataset.field==="email"){const a=(e.email||"").toLowerCase().trim()!==s.value.toLowerCase().trim();this.showEmailVerifyField(a)}})}),this.showEmailVerifyField(!1)}_initDobPicker(){if(this._dobPicker){try{this._dobPicker.destroy()}catch{}this._dobPicker=null}const e=document.getElementById("ma-dob"),t=document.getElementById("ma-dob-toggle");if(!e)return;const r=()=>{var n;const s=typeof flatpickr<"u"&&((n=flatpickr.l10ns)!=null&&n.ja)?flatpickr.l10ns.ja:"default",a=flatpickr(e,{dateFormat:"Y/m/d",allowInput:!0,disableMobile:!1,locale:s,maxDate:"today",minDate:"1900-01-01",appendTo:document.body,onReady(o,d,l){l.input.removeAttribute("readonly")},onChange(){e.dispatchEvent(new Event("input",{bubbles:!0}))}});t==null||t.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation(),a.open()}),e.addEventListener("click",()=>a.open()),this._dobPicker=a};if(typeof flatpickr<"u")r();else{const s=setInterval(()=>{typeof flatpickr<"u"&&(clearInterval(s),r())},50)}}}function I(i){let e=i;const t=new Set,r=()=>t.forEach(s=>{try{s(e)}catch(a){console.error("[DiptyqueStore] Subscriber error",a)}});return{get(){return e},set(s){e=s,r()},update(s){e=s(e),r()},subscribe(s){return t.add(s),()=>t.delete(s)},find(s){return(Array.isArray(e)?e:(e==null?void 0:e.items)??(e==null?void 0:e.orders)??[]).find(s)}}}const we=I({status:"idle",customer:null,error:null}),$e=I({status:"idle",addresses:[],error:null}),ke=I({status:"idle",orders:[],hasNextPage:!1,endCursor:null,loadingMore:!1,error:null});class Ee{constructor(e,t,r={}){this._api=e,this._renderer=t,this._isNative=r.isNative||!1,this._logoutUrl=r.logoutUrl||"/account/logout",this._getNativeSession=r.getNativeSession||null,this._store=we,this._store.subscribe(s=>{if(s.status==="loading"){t.renderLoading();return}if(s.status==="error"){window.location.href="/";return}s.status==="ready"&&s.customer&&(t.renderDashboard(s.customer),this._bindRendererActions())})}async load(e,t=null){var r,s;if(t){this._store.set({status:"ready",customer:t,error:null});return}if(!e){this._store.set({status:"error",customer:null,error:"no_session"});return}this._store.set({status:"loading",customer:null,error:null});try{const a=await this._api.fetchCustomer(e);if(!a){const n=(r=this._getNativeSession)==null?void 0:r.call(this);n?this._store.set({status:"ready",customer:n,error:null}):this._store.set({status:"error",customer:null,error:"invalid_token"});return}this._store.set({status:"ready",customer:a,error:null})}catch(a){console.error("[ProfileController] Failed to load customer",a);const n=(s=this._getNativeSession)==null?void 0:s.call(this);n?this._store.set({status:"ready",customer:n,error:null}):this._store.set({status:"error",customer:null,error:a.message})}}_bindRendererActions(){var e;this._renderer.on("profile:submit",t=>this._handleProfileSubmit(t)),this._renderer.on("password:submit",t=>this._handlePasswordSubmit(t)),(e=document.getElementById("my-account-logout"))==null||e.addEventListener("click",()=>{Y(this._isNative?this._logoutUrl:"/")},{once:!0})}async _handleProfileSubmit(e){var d;if(this._profileBusy)return;this._profileBusy=!0;const t=this._renderer._t,r=this._renderer;r.setSubmitState("profile",!0,t("saving","保存中...")),r.setFormMessage("","","profile"),["lastName","firstName","last_name_kana","first_name_kana","dob","phone","email","profileCurrentPassword"].forEach(l=>r.clearFieldError(l));const a=this._validateProfile(e,t);if((((d=this._store.get().customer)==null?void 0:d.email)||"").toLowerCase()!==(e.email||"").toLowerCase()&&!e.profileCurrentPassword&&(a.profileCurrentPassword=t("validation_current_password_required_for_email","メールアドレスを変更する場合は現在のパスワードを入力してください。")),Object.keys(a).length){Object.entries(a).forEach(([l,u])=>r.setFieldError(l,u)),r.setSubmitState("profile",!1),this._profileBusy=!1;return}try{const l={firstName:e.firstName,lastName:e.lastName,first_name_kana:e.first_name_kana,last_name_kana:e.last_name_kana,email:e.email,phone:e.phone,birthday:e.dob?le(e.dob):"",current_password:e.profileCurrentPassword||""};this._isNative?await this._api.updateProfileNative(l,j()):await this._api.updateProfile(l);try{await this._api.updateMetafields({last_name_kana:l.last_name_kana,first_name_kana:l.first_name_kana,birthday:l.birthday})}catch(u){console.warn("[ProfileController] Metafield update skipped:",u.message)}this._store.update(u=>({...u,customer:{...u.customer,firstName:e.firstName,lastName:e.lastName,email:e.email,phone:e.phone}})),r.setFormMessage("success",t("save_success","情報が保存されました。"),"profile")}catch(l){console.error("[ProfileController] Profile update error",l),l.isPasswordError||l.status===401?r.setFieldError("profileCurrentPassword",t("validation_current_password_invalid","現在のパスワードが正しくありません。")):l.code==="TAKEN"?r.setFieldError("email",t("validation_email_taken","このメールアドレスは既に使用されています。")):r.setFormMessage("error",l.message||t("save_failed","保存に失敗しました。"),"profile")}finally{r.setSubmitState("profile",!1),this._profileBusy=!1}}async _handlePasswordSubmit(e){if(this._passwordBusy)return;this._passwordBusy=!0;const t=this._renderer._t,r=this._renderer;if(r.setSubmitState("password",!0,t("saving","保存中...")),r.setFormMessage("","","password"),["currentPassword","newPassword","confirmPassword"].forEach(a=>r.clearFieldError(a)),!e.currentPassword&&!e.newPassword&&!e.confirmPassword){r.setSubmitState("password",!1),this._passwordBusy=!1;return}const s=this._validatePassword(e,t);if(Object.keys(s).length){Object.entries(s).forEach(([a,n])=>r.setFieldError(a,n)),r.setSubmitState("password",!1),this._passwordBusy=!1;return}try{const a=this._store.get().customer;if(this._isNative)await this._api.updatePasswordNative(e.newPassword,e.confirmPassword,j());else{await this._api.updatePassword(e.currentPassword,e.newPassword),U.clear(),r.clearPasswordFields(),r.setFormMessage("success",t("password_changed_relogin","パスワードを変更しました。再度ログインしてください。"),"password"),setTimeout(()=>{window.location.href="/"},2e3);return}r.clearPasswordFields(),r.setFormMessage("success",t("save_success","情報が保存されました。"),"password")}catch(a){console.error("[ProfileController] Password update error",a),a.isPasswordError||a.status===401?r.setFieldError("currentPassword",t("validation_current_password_invalid","現在のパスワードが正しくありません。")):r.setFormMessage("error",a.message||t("save_failed","保存に失敗しました。"),"password")}finally{r.setSubmitState("password",!1),this._passwordBusy=!1}}_validateProfile(e,t){const r={},s=/^[\u30A0-\u30FF\u30FC\s]+$/,a=["lastName","firstName","last_name_kana","first_name_kana","phone","email"];for(const n of a)e[n]||(r[n]=t("validation_required","この項目は必須です。"));if(e.last_name_kana&&!r.last_name_kana&&!s.test(e.last_name_kana)&&(r.last_name_kana=t("validation_kana_invalid","全角カタカナで入力してください。")),e.first_name_kana&&!r.first_name_kana&&!s.test(e.first_name_kana)&&(r.first_name_kana=t("validation_kana_invalid","全角カタカナで入力してください。")),e.email&&!r.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email)&&(r.email=t("validation_email_invalid","有効なメールアドレスを入力してください。")),e.phone&&!r.phone){const n=e.phone;if(!/^[0-9+()\-\s]+$/.test(n))r.phone=t("validation_phone_invalid","有効な電話番号を入力してください。");else{const o=n.replace(/\D/g,"");(o.length<8||o.length>15)&&(r.phone=t("validation_phone_invalid","有効な電話番号を入力してください。"))}}if(e.dob)if(!/^\d{4}\/\d{2}\/\d{2}$/.test(e.dob))r.dob=t("validation_dob_invalid","YYYY/MM/DD 形式の有効な日付を入力してください。");else{const[n,o,d]=e.dob.split("/").map(Number),l=new Date(n,o-1,d);(!(l.getFullYear()===n&&l.getMonth()===o-1&&l.getDate()===d)||l>new Date)&&(r.dob=t("validation_dob_invalid","YYYY/MM/DD 形式の有効な日付を入力してください。"))}return r}_validatePassword(e,t){const r={};return e.currentPassword||(r.currentPassword=t("validation_required","この項目は必須です。")),e.newPassword?e.newPassword.length>=8&&/[a-zA-Z]/.test(e.newPassword)&&/\d/.test(e.newPassword)&&/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/.test(e.newPassword)||(r.newPassword=t("validation_password_weak","パスワードは8文字以上で、英字・数字・記号を含む必要があります。")):r.newPassword=t("validation_required","この項目は必須です。"),e.confirmPassword?e.newPassword&&e.confirmPassword!==e.newPassword&&(r.confirmPassword=t("validation_password_mismatch","パスワードが一致しません。")):r.confirmPassword=t("validation_required","この項目は必須です。"),r}}let E=null;const Se={async mount(i,e){const{config:t,t:r,token:s}=e,a=new w(t.storefrontEndpoint,t.storefrontToken),n=new D(t.apiBase,()=>localStorage.getItem("shopifyCustomerAccessToken")),o=new be(a,n),d=new ve(i,r);E=new Ee(o,d,{isNative:!1,logoutUrl:t.logoutUrl||"/account/logout",getNativeSession:()=>L.get()});const l=L.get();l?E.load(null,l):E.load(s)},unmount(){E=null}},xe=`
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
              trackingCompany
              trackingInfo { number url }
            }
            totalShippingPrice { amount currencyCode }
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
`;class Pe{constructor(e){this._sf=e}async list(e,t=10,r=null){var o;const s={token:e,first:t};r&&(s.after=r);const a=await this._sf.request(xe,s),n=((o=a==null?void 0:a.customer)==null?void 0:o.orders)??{edges:[],pageInfo:{hasNextPage:!1,endCursor:null}};return{orders:n.edges.map(d=>({...d.node,_cursor:d.cursor})),pageInfo:n.pageInfo}}}function F(i,e="YYYY/MM/DD"){if(!i)return"";const t=new Date(i);if(isNaN(t))return String(i);const r={YYYY:t.getFullYear(),MM:String(t.getMonth()+1).padStart(2,"0"),M:t.getMonth()+1,DD:String(t.getDate()).padStart(2,"0"),D:t.getDate()};return e.replace(/YYYY|MM|DD|M|D/g,s=>r[s])}function m(i){if(!i)return"";const e=parseFloat(i.amount??0),t=i.currencyCode??"JPY";try{return new Intl.NumberFormat("ja-JP",{style:"currency",currency:t,minimumFractionDigits:t==="JPY"?0:2}).format(e)}catch{return`${t} ${e}`}}const Ce={PAID:{label:"支払い済み",modifier:"paid"},PENDING:{label:"処理中",modifier:"pending"},AUTHORIZED:{label:"処理中",modifier:"pending"},PARTIALLY_PAID:{label:"処理中",modifier:"pending"},REFUNDED:{label:"返金済み",modifier:"refunded"},PARTIALLY_REFUNDED:{label:"返金済み",modifier:"refunded"},VOIDED:{label:"キャンセル",modifier:"cancelled"}},Te={FULFILLED:{label:"配送済み",modifier:"fulfilled"},PARTIAL:{label:"一部配送",modifier:"partial"},UNFULFILLED:{label:"準備中",modifier:"unfulfilled"},IN_TRANSIT:{label:"配送中",modifier:"in-transit"},DELIVERED:{label:"配達完了",modifier:"delivered"}};function K(i){return Ce[i==null?void 0:i.toUpperCase()]??{label:"処理中",modifier:"pending"}}function J(i){return i?Te[i==null?void 0:i.toUpperCase()]??null:null}function G(i){const e=(i.financialStatus??"").toUpperCase(),t=(i.fulfillmentStatus??"").toUpperCase();return e==="REFUNDED"||e==="PARTIALLY_REFUNDED"?"returned":e==="VOIDED"?"cancelled":t==="FULFILLED"||t==="DELIVERED"||t==="IN_TRANSIT"?"shipped":"processing"}const V=[{key:"all",labelKey:"tab_all"},{key:"processing",labelKey:"tab_processing"},{key:"shipped",labelKey:"tab_shipped"},{key:"cancelled",labelKey:"tab_cancelled"},{key:"returned",labelKey:"tab_returned"}];class Ae{constructor(e,t){this._container=e,this.t=t,this._handlers={},this._activeTab="all",this._expanded=new Set,this._bound=!1}on(e,t){this._handlers[e]=t}_emit(e,...t){this._handlers[e]&&this._handlers[e](...t)}render(e){if(e.status==="loading"&&!e.orders.length){this._renderLoading();return}if(e.status==="error"){this._renderError(e.error);return}this._renderPage(e)}_renderLoading(){this._container.innerHTML=`
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this.t("loading","読み込み中...")}</p>
      </div>`}_renderError(e){this._container.innerHTML=`
      <p class="my-account__form-message--error" style="margin-top:20px;">
        ${c(e||this.t("load_error","注文履歴の読み込みに失敗しました。"))}
      </p>`}_renderPage(e){const{orders:t,hasNextPage:r,loadingMore:s}=e,a=this._filterOrders(t,this._activeTab),n=`<p class="order-history__notice">${this.t("order_history_notice","本ページでは2021年以降のご注文履歴をご確認いただけます。2020年以前のご注文に関するお問い合わせはカスタマーサービスへご連絡ください。")}</p>`,o=this._renderTabs(t),d=a.length?a.map(_=>this._renderOrderCard(_)).join(""):this._renderEmpty(),l=r?`<div class="order-history__load-more-wrap">
           <button class="order-history__load-more-btn${s?" is-loading":""}"
                   data-action="load-more" ${s?"disabled":""}>
             ${s?this.t("loading","読み込み中..."):this.t("load_more","さらに表示する")}
           </button>
         </div>`:"",u=this._renderSupportBlock();this._container.innerHTML=`
      <div class="order-history">
        ${n}
        ${o}
        <div class="order-history__list" id="order-history-list">
          ${d}
        </div>
        ${l}
        ${u}
      </div>`,this._bindEvents()}_filterOrders(e,t){return t==="all"?e:e.filter(r=>G(r)===t)}_renderTabs(e=[]){const t={};return t.all=e.length,V.filter(r=>r.key!=="all").forEach(r=>{t[r.key]=e.filter(s=>G(s)===r.key).length}),`
      <div class="order-history__tabs" role="tablist">
        ${V.map(r=>`
          <button class="order-history__tab${this._activeTab===r.key?" is-active":""}"
                  role="tab" aria-selected="${this._activeTab===r.key}"
                  data-action="tab" data-tab="${r.key}">
            ${this.t(r.labelKey,r.key)}
            <span class="order-history__tab-count">${t[r.key]}</span>
          </button>
        `).join("")}
      </div>`}_renderOrderCard(e){var y,p,S,x,P,C;const t=K(e.financialStatus),r=J(e.fulfillmentStatus),s=t?t.label:r.label,a=t?t.modifier:r.modifier,n=F(e.processedAt,"YYYY年M月D日"),o=this._expanded.has(e.id),d=this._resolveTracking(e),l=((y=e.lineItems)==null?void 0:y.edges)??[],u=(p=l[0])==null?void 0:p.node,_=((x=(S=u==null?void 0:u.variant)==null?void 0:S.image)==null?void 0:x.url)??"",f=((C=(P=u==null?void 0:u.variant)==null?void 0:P.image)==null?void 0:C.altText)??(u==null?void 0:u.title)??"",h=l.reduce((k,{node:z})=>k+(z.quantity??1),0);return`
      <div class="order-history__card" data-order-id="${c(e.id)}">
        <div class="order-history__card-header">
          <span class="order-history__status order-history__status--${a}">${s}</span>
          <span class="order-history__date">${n}</span>
        </div>

        <div class="order-history__card-body">
          <div class="order-history__card-thumb">
            ${_?`<img src="${c(_)}" alt="${c(f)}" loading="lazy">`:'<div class="order-history__card-thumb-placeholder"></div>'}
            <span class="order-history__card-thumb-count">${h}</span>
          </div>

          <div class="order-history__card-info">
            <p class="order-history__order-id">
              ${this.t("order_id_label","ご注文ID")} <strong>${c(e.name)}</strong>
            </p>

            <p class="order-history__tracking${d?"":" order-history__tracking--unavailable"}">
              ${d?`<a href="${c(d.url)}" target="_blank" rel="noopener">${c(d.number)}</a>`:this.t("order_tracking_unavailable","トラッキングはご利用できません")}
            </p>

            <button class="order-history__toggle${o?" is-open":""}"
                    data-action="toggle-detail" data-order-id="${c(e.id)}">
              ${this.t("order_toggle_detail","ご注文詳細をみる")}
              <span class="order-history__toggle-arrow">▶</span>
            </button>
          </div>
        </div>

        <div class="order-history__detail${o?" is-open":""}" data-detail-id="${c(e.id)}">
          <div class="order-history__detail-inner">
            ${this._renderLineItems(e)}
            ${this._renderAddresses(e)}
            ${this._renderPayment(e)}
            ${this._renderDetailActions(e)}
          </div>
        </div>
      </div>`}_resolveTracking(e){var r;const t=e.successfulFulfillments??[];for(const s of t){const a=(r=s.trackingInfo)==null?void 0:r[0];if(a!=null&&a.number)return a}return null}_renderLineItems(e){var s;const t=((s=e.lineItems)==null?void 0:s.edges)??[];return t.length?`<div class="order-history__items">${t.map(({node:a})=>{var l,u,_;const n=(l=a.variant)==null?void 0:l.image,o=m(a.originalTotalPrice??((u=a.variant)==null?void 0:u.price)),d=(_=a.variant)!=null&&_.title&&a.variant.title!=="Default Title"?`<span class="order-history__item-variant">${c(a.variant.title)}</span>`:"";return`
        <div class="order-history__item">
          <div class="order-history__item-image${n?"":" order-history__item-image--placeholder"}">
            ${n?`<img src="${c(n.url)}" alt="${c(n.altText??a.title)}" loading="lazy">`:""}
          </div>
          <div class="order-history__item-info">
            <p class="order-history__item-name">${c(a.title)}</p>
            ${d}
            <p class="order-history__item-meta">数量: ${a.quantity}</p>
          </div>
          <p class="order-history__item-price">${o}</p>
        </div>`}).join("")}</div>`:""}_renderAddresses(e){const t=e.shippingAddress,r=e.billingAddress;if(!t&&!r)return"";const s=a=>a?[`${c(a.lastName??"")} ${c(a.firstName??"")}`.trim(),a.zip&&a.province?`〒${c(a.zip)} ${c(a.province)}`:"",a.city?c(a.city):"",a.address1?c(a.address1):"",a.address2?c(a.address2):"",a.phone?c(a.phone):""].filter(Boolean).join("<br>"):"—";return`
      <div class="order-history__addresses">
        <div class="order-history__address-col">
          <h4 class="order-history__address-title">${this.t("order_shipping_address","配送先情報")}</h4>
          <p class="order-history__address-body">${s(t)}</p>
          <p class="order-history__shipping-time">${this.t("order_shipping_time","配送時間: 指定しない")}</p>
        </div>
        <div class="order-history__address-col">
          <h4 class="order-history__address-title">${this.t("order_billing_address","ご依頼主")}</h4>
          <p class="order-history__address-body">${s(r)}</p>
        </div>
      </div>`}_renderPayment(e){const t=m(e.subtotalPrice),r=m(e.totalTax),s=m(e.currentTotalPrice);return`
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
          <span>${s}</span>
        </div>
      </div>`}_renderDetailActions(e){return`
      <div class="order-history__detail-actions">
        <button class="order-history__receipt-btn"
                data-action="print-receipt" data-order-id="${c(e.id)}">
          ${this.t("order_download_receipt","領収書をダウンロードする")}
        </button>
        <button class="order-history__reorder-link"
                data-action="reorder" data-order-id="${c(e.id)}">
          ${this.t("order_reorder","もう一度注文する")}
        </button>
      </div>`}_renderEmpty(){return`
      <div class="my-account__empty">
        <p>${this.t("no_orders","注文履歴はまだありません。")}</p>
        <a href="/collections/all" class="button">${this.t("start_shopping","ショッピングを始める")}</a>
      </div>`}_renderSupportBlock(){return`
      <section class="order-history__support" aria-label="${this.t("order_support_title","何かお困りですか？")}">
        <h3 class="order-history__support-title">${this.t("order_support_title","何かお困りですか？")}</h3>

        <p class="order-history__support-body">
          ${this.t("order_support_body_line1","ご不明な点がございましたらカスタマーサービスまで")}<br>
          ${this.t("order_support_body_line2","お問い合わせください。")}<br>
          ${this.t("order_support_body_line3","ご注文でお困りの際は、カスタマーサービスにてご")}<br>
          ${this.t("order_support_body_line4","注文を承りますので、お問合せフォームよりお申し")}<br>
          ${this.t("order_support_body_line5","付けください。")}
        </p>

        <a href="/pages/contact" class="order-history__support-contact-btn">
          ・ ${this.t("contact_btn","お問い合わせフォーム")} ・
        </a>

        <p class="order-history__support-hours-label">${this.t("order_support_hours_label","カスタマーサービス 営業時間")}</p>
        <p class="order-history__support-hours-text">
          ${this.t("order_support_hours_line1","月曜日 - 金曜日： 10. 00 - 16. 00")}<br>
          ${this.t("order_support_hours_line2","（土日祝日を除く）")}
        </p>

        <a href="/pages/faq" class="order-history__support-help-link">${this.t("help_guide_link","オンラインヘルプガイドはこちら")}</a>
      </section>`}_bindEvents(){this._bound||(this._bound=!0,this._container.addEventListener("click",e=>{const t=e.target.closest("[data-action]");if(!t)return;const r=t.dataset.action;if(r==="tab"){this._activeTab=t.dataset.tab,this._emit("order:tab-change",this._activeTab);return}if(r==="load-more"){this._emit("order:load-more");return}if(r==="toggle-detail"){const s=t.dataset.orderId;this._expanded.has(s)?this._expanded.delete(s):this._expanded.add(s);const a=this._container.querySelector(`.order-history__card[data-order-id="${CSS.escape(s)}"]`),n=this._container.querySelector(`.order-history__detail[data-detail-id="${CSS.escape(s)}"]`);if(a){const o=a.querySelector('[data-action="toggle-detail"]'),d=this._expanded.has(s);o==null||o.classList.toggle("is-open",d),n==null||n.classList.toggle("is-open",d)}return}r==="reorder"&&(t.disabled=!0,t.textContent=this.t("loading","読み込み中..."),t.classList.add("is-loading"),this._emit("order:reorder",t.dataset.orderId)),r==="print-receipt"&&this._emit("order:print-receipt",t.dataset.orderId)}))}setLoadingMore(e){const t=this._container.querySelector('[data-action="load-more"]');t&&(t.disabled=e,t.textContent=e?this.t("loading","読み込み中..."):this.t("load_more","さらに表示する"),t.classList.toggle("is-loading",e))}setReordering(e,t){const r=this._container.querySelector(`[data-action="reorder"][data-order-id="${CSS.escape(e)}"]`);r&&(r.disabled=t,r.textContent=t?this.t("loading","読み込み中..."):this.t("order_reorder","もう一度注文する"),r.classList.toggle("is-loading",t))}}const Ne="/cart/add.js";function qe(i){var r,s;const e=((r=i==null?void 0:i.lineItems)==null?void 0:r.edges)??[],t=[];for(const{node:a}of e){if(!((s=a.variant)!=null&&s.id))continue;const n=a.variant.id.match(/\/(\d+)$/);n&&t.push({variantId:Number(n[1]),quantity:a.quantity??1,title:a.title})}return t}async function Le(i){let e;try{e=await fetch(Ne,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({id:i.variantId,quantity:i.quantity})})}catch(r){const s=new Error("Network error: "+r.message);throw s.item=i,s.networkErr=!0,s}let t;try{t=await e.json()}catch{t={}}if(!e.ok){const r=new Error(t.description||t.message||"HTTP "+e.status);throw r.item=i,r.status=e.status,r.response=t,r}return t}async function De(i){const e=qe(i);if(!e.length)return{added:[],failed:[],cartUrl:"/cart"};const t=[],r=[];for(const s of e)try{await Le(s),t.push(s)}catch(a){console.warn("[reorder] Failed to add item to cart",s,a),r.push({variantId:s.variantId,title:s.title,reason:a.message})}return{added:t,failed:r,cartUrl:"/cart"}}function Q(i){if(!i)return"—";const e=[i.lastName,i.firstName].filter(Boolean).join(""),t=[i.zip,i.province,i.city].filter(Boolean).join(",");return[e,t,i.address1,i.address2,i.country,i.phone].filter(Boolean).join("<br>")}function Ie(i,e,t){var h,y;const r=i.billingAddress||i.shippingAddress||{},s=i.shippingAddress||{},a=t||"";let n="—";if(Array.isArray(i.successfulFulfillments)&&i.successfulFulfillments.length){const p=i.successfulFulfillments[0].trackingCompany;p&&(n=p)}let o="¥0";(h=i.totalShippingPrice)!=null&&h.amount&&(o=m(i.totalShippingPrice));const d=(((y=i.lineItems)==null?void 0:y.edges)??[]).map(({node:p})=>{var X,ee,te,re,se;const S=p.title+((X=p.variant)!=null&&X.title&&p.variant.title!=="Default Title"?`<br><span style="font-size:11px;color:#555;">${p.variant.title}</span>`:""),x=((ee=p.variant)==null?void 0:ee.sku)??"",P=p.originalTotalPrice?m(p.originalTotalPrice):"",C=p.quantity??1;let k="";if((te=p.taxLines)!=null&&te.length){const H=p.taxLines.reduce((lt,dt)=>{var ae;return lt+parseFloat(((ae=dt.price)==null?void 0:ae.amount)??0)},0);k=m({amount:String(H),currencyCode:((re=p.originalTotalPrice)==null?void 0:re.currencyCode)??"JPY"})}else if((se=p.originalTotalPrice)!=null&&se.amount){const H=Math.round(parseFloat(p.originalTotalPrice.amount)/11);k=m({amount:String(H),currencyCode:p.originalTotalPrice.currencyCode??"JPY"})}const z=p.originalTotalPrice?m({amount:String(parseFloat(p.originalTotalPrice.amount)),currencyCode:p.originalTotalPrice.currencyCode}):"";return`<tr>
      <td class="td-left">${S}</td>
      <td class="td-center">${x}</td>
      <td class="td-right">${P}</td>
      <td class="td-center">${C}</td>
      <td class="td-right">${k}</td>
      <td class="td-right">${z}</td>
    </tr>`}).join(""),l=i.subtotalPrice?m(i.subtotalPrice):"",u=i.totalTax?m(i.totalTax):"",_=i.currentTotalPrice?m(i.currentTotalPrice):"",f=i.receiptNumber??i.orderNumber??i.name??"";return`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>領収書 — ${i.name}</title>
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
    領収書番号${f}<br>
    注文 # ${i.name}<br>
    注文日: ${F(i.processedAt,"YYYY/MM/DD")}
  </div>

  <table class="info-table">
    <tr>
      <th>ご請求先：</th>
      <th>発送先：</th>
    </tr>
    <tr>
      <td>${Q(r)}</td>
      <td>${Q(s)}</td>
    </tr>
    <tr>
      <th>お支払方法：</th>
      <th>発送方法：</th>
    </tr>
    <tr>
      <td>${a}</td>
      <td>${n}<br><br>（配送料合計 ${o}）</td>
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
    <tbody>${d}</tbody>
  </table>

  <div class="totals-wrap">
    <table class="totals-table">
      <tr><td class="t-label">合計:</td><td class="t-value">${l}</td></tr>
      <tr><td class="t-label">Custom Fees:</td><td class="t-value">¥0</td></tr>
      <tr><td class="t-label">合計 (税抜):</td><td class="t-value">${l}</td></tr>
      <tr><td class="t-label">税(10%):</td><td class="t-value">${u}</td></tr>
      <tr class="t-grand"><td class="t-label">合計 (税込):</td><td class="t-value">${_}</td></tr>
    </table>
  </div>

</body>
</html>`}function Fe(){try{const i=document.getElementById("oh-payment-gateways");return i?JSON.parse(i.textContent):{}}catch{return{}}}function Me(i,e){const r=Fe()[i.id]||null,s=Ie(i,e,r),a=document.createElement("iframe");a.setAttribute("aria-hidden","true"),a.style.position="fixed",a.style.right="0",a.style.bottom="0",a.style.width="0",a.style.height="0",a.style.border="0",a.style.visibility="hidden";const n=()=>{window.setTimeout(()=>{a.parentNode&&a.parentNode.removeChild(a)},500)};document.body.appendChild(a);const o=a.contentWindow;if(!o){n(),i.statusUrl&&window.open(i.statusUrl,"_blank","noopener,noreferrer");return}o.document.write(s),o.document.close(),window.setTimeout(()=>{try{o.focus(),o.onafterprint=n,o.print(),window.setTimeout(n,3e3)}catch(d){n(),console.error("[printReceipt] Print failed",d),i.statusUrl&&window.open(i.statusUrl,"_blank","noopener,noreferrer")}},350)}const W=10;class Re{constructor(e,t){this._api=e,this._renderer=t,this._store=ke,this._token=null,this._unsubscribe=this._store.subscribe(r=>t.render(r)),t.on("order:tab-change",()=>{t.render(this._store.get())}),t.on("order:load-more",()=>this._loadMore()),t.on("order:reorder",r=>this._reorder(r)),t.on("order:print-receipt",r=>this._printReceipt(r))}destroy(){this._unsubscribe&&this._unsubscribe()}async load(e){if(!e){window.location.href="/";return}this._token=e,this._store.set({status:"loading",orders:[],hasNextPage:!1,endCursor:null,loadingMore:!1,error:null});try{const{orders:t,pageInfo:r}=await this._api.list(e,W,null);this._store.set({status:"ready",orders:t,hasNextPage:r.hasNextPage,endCursor:r.endCursor,loadingMore:!1,error:null})}catch(t){if(console.error("[OrderHistoryController] Load failed",t),t.status===401||t.status===403){window.location.href="/";return}this._store.set({status:"error",orders:[],hasNextPage:!1,endCursor:null,loadingMore:!1,error:t.message})}}async _loadMore(){const e=this._store.get();if(!(!e.hasNextPage||e.loadingMore)){this._store.update(t=>({...t,loadingMore:!0}));try{const{orders:t,pageInfo:r}=await this._api.list(this._token,W,e.endCursor);this._store.update(s=>({...s,orders:[...s.orders,...t],hasNextPage:r.hasNextPage,endCursor:r.endCursor,loadingMore:!1}))}catch(t){console.error("[OrderHistoryController] Load more failed",t),this._store.update(r=>({...r,loadingMore:!1}))}}}_printReceipt(e){var r;const t=(r=this._store.get().orders)==null?void 0:r.find(s=>s.id===e);if(!t){console.warn("[OrderHistoryController] PrintReceipt: order not found",e);return}Me(t,this._renderer.t)}async _reorder(e){var n;const t=(n=this._store.get().orders)==null?void 0:n.find(o=>o.id===e);if(!t){console.warn("[OrderHistoryController] Reorder: order not found in store",e);return}const{added:r,failed:s,cartUrl:a}=await De(t);if(r.length&&!s.length){window.location.href=a;return}if(r.length&&s.length){const o=s.map(d=>d.title).join(", ");console.warn(`[reorder] ${s.length} item(s) could not be added: ${o}`),window.location.href=a;return}this._renderer.setReordering(e,!1),console.error("[reorder] No items could be added to cart",s),alert(s.map(o=>`• ${o.title}: ${o.reason}`).join(`
`)||"商品をカートに追加できませんでした。")}}let $=null;const Oe={async mount(i,e){const{config:t,t:r,token:s}=e,a=new w(t.storefrontEndpoint,t.storefrontToken),n=new Pe(a),o=new Ae(i,r);if($=new Re(n,o),!s){g({view:"profile"});return}o.on("order:view-detail",d=>{g({view:"order",id:d})}),$.load(s)},unmount(){$&&$.destroy(),$=null}},ze=`
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
`;class He{constructor(e,t){this._sf=e,this._be=t}async list(e){var o,d;const[t,r]=await Promise.all([this._sf.request(ze,{token:e}),this._be.post("/api/customers/account/addresses").catch(()=>({}))]),s=t==null?void 0:t.customer;if(!s)return[];const a=((o=s.defaultAddress)==null?void 0:o.id)??null,n={};for(const l of r.addresses??[])n[String(l.id)]=l.extension_attributes??null;return(((d=s.addresses)==null?void 0:d.edges)??[]).map(({node:l})=>{const u=de(l.id);return{id:u,first_name:l.firstName??null,last_name:l.lastName??null,name:l.name??null,company:l.company??null,address1:l.address1??null,address2:l.address2??null,city:l.city??null,province:A(l.province??""),province_code:l.provinceCode??null,country:l.country??null,country_code:l.countryCodeV2??null,zip:l.zip??null,phone:l.phone??null,default:a!=null&&l.id===a,extension_attributes:n[String(u)]??null}})}create(e){return this._be.post("/api/customers/account/addresses/create",e)}update(e,t){return this._be.post("/api/customers/account/addresses/update",{address_id:e,...t})}delete(e){return this._be.post("/api/customers/account/addresses/delete",{address_id:e})}}const Ue=["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"];class je{constructor(e,t){this._container=e,this.t=t,this._handlers={},this._zipTimer=null}on(e,t){this._handlers[e]=t}_emit(e,...t){this._handlers[e]&&this._handlers[e](...t)}renderLoading(){const e=this._listRoot();e.innerHTML=`
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this.t("loading","読み込み中...")}</p>
      </div>`}render(e){if(e.status==="loading"){this.renderLoading();return}if(e.status==="error"){this._renderError(e.error);return}e.status==="ready"&&this.renderAddressList(e.addresses)}renderAddressList(e){const t=this.t,r=this._listRoot(),s=e.filter(n=>{var o;return(((o=n.extension_attributes)==null?void 0:o.type)??"shipping")!=="billing"}),a=e.filter(n=>{var o;return((o=n.extension_attributes)==null?void 0:o.type)==="billing"});r.innerHTML=`
      <div class="addresses-details__wrapper">
        <div class="addresses-details__section">
          <h3 class="addresses-details__section-title">${t("address_shipping","配送先住所")}</h3>
          <div class="addresses-details__list" id="shipping-list">
            ${s.map(n=>this.renderCard(n)).join("")}
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
            ${a.map(n=>this.renderCard(n)).join("")}
          </div>
          <div class="addresses-details__action-area mt-40" data-area="billing">
            <button type="button" class="addresses-details__new-btn"
                    data-action="new-address" data-type="billing">
              ${t("address_new_btn","新しい住所を登録する")}
            </button>
            <div class="my-account__address-form-container" data-id="new-billing"></div>
          </div>
        </div>
      </div>`,this._bindListEvents()}renderCard(e){const t=this.t,r=e.extension_attributes??{},s=r.is_default_billing===!0||r.is_default_shipping===!0;return`
      <div class="addresses-details__card" data-id="${e.id}">
        <div class="addresses-details__card-info">
          ${s?`<span class="addresses-details__default-badge">${t("address_default_badge","デフォルト")}</span>`:""}
          <p class="addresses-details__name">${c(e.last_name||"")} ${c(e.first_name||"")}</p>
          <p>${c(e.zip||"")}</p>
          <p>${c(A(e.province||""))}</p>
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
      <div class="my-account__address-form-container" data-id="${e.id}"></div>`}renderForm(e=null,t="billing"){const r=this.t,s=(e==null?void 0:e.extension_attributes)??{},a=(e==null?void 0:e.province)||"",n=A(a),o=s.lastname_kana??"",d=s.firstname_kana??"",l=s.is_default_billing===!0,u=s.is_default_shipping===!0,_=t==="billing"?`<label class="addresses-details__checkbox-label">
           <input type="checkbox" name="is_default_billing" value="1"${l?" checked":""}>
           ${r("default_billing_label","デフォルトの請求先住所に設定する")}
         </label>`:`<label class="addresses-details__checkbox-label">
           <input type="checkbox" name="is_default_shipping" value="1"${u?" checked":""}>
           ${r("default_shipping_label","デフォルトの配送先住所に設定する")}
         </label>`,f=Ue.map(h=>`<option value="${h}"${n===h?" selected":""}>${h}</option>`).join("");return`
      <form class="addresses-details__form" novalidate
            data-id="${(e==null?void 0:e.id)||""}" data-type="${t}"
            data-province-raw="${c(a)}">

        <div class="addresses-details__form-row">
          <div class="addresses-details__field">
            <label>${r("last_name","姓")} *</label>
            <input type="text" name="last_name" class="my-account__input"
                   value="${c((e==null?void 0:e.last_name)||"")}" required>
            <span class="my-account__field-error" data-error-for="last_name" aria-live="polite"></span>
          </div>
          <div class="addresses-details__field">
            <label>${r("first_name","名")} *</label>
            <input type="text" name="first_name" class="my-account__input"
                   value="${c((e==null?void 0:e.first_name)||"")}" required>
            <span class="my-account__field-error" data-error-for="first_name" aria-live="polite"></span>
          </div>
        </div>

        <div class="addresses-details__form-row">
          <div class="addresses-details__field">
            <label>${r("furigana_last","フリガナ（姓）")} *</label>
            <input type="text" name="lastname_kana" class="my-account__input"
                   value="${c(o)}" required placeholder="例：ヤマダ">
            <span class="my-account__field-error" data-error-for="lastname_kana" aria-live="polite"></span>
          </div>
          <div class="addresses-details__field">
            <label>${r("furigana_first","フリガナ（名）")} *</label>
            <input type="text" name="firstname_kana" class="my-account__input"
                   value="${c(d)}" required placeholder="例：タロウ">
            <span class="my-account__field-error" data-error-for="firstname_kana" aria-live="polite"></span>
          </div>
        </div>

        <div class="addresses-details__field">
          <label>${r("zip","郵便番号")} *</label>
          <input type="text" name="zip" class="my-account__input"
                 value="${c((e==null?void 0:e.zip)||"")}" required
                 placeholder="例：060-0000" maxlength="8" data-zip-autofill>
          <span class="my-account__field-error" data-error-for="zip" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${r("province","都道府県")} *</label>
          <select name="province" class="my-account__input" required>
            <option value="" disabled ${e!=null&&e.province?"":"selected"}>
              ${r("province_placeholder","都道府県を選択")}
            </option>
            ${f}
          </select>
          <span class="my-account__field-error" data-error-for="province" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${r("city","市区町村")} *</label>
          <input type="text" name="city" class="my-account__input"
                 value="${c((e==null?void 0:e.city)||"")}" required>
          <span class="my-account__field-error" data-error-for="city" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${r("address1","丁番・番地")} *</label>
          <input type="text" name="address1" class="my-account__input"
                 value="${c((e==null?void 0:e.address1)||"")}" required>
          <span class="my-account__field-error" data-error-for="address1" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${r("address2","マンション・建物名")}</label>
          <input type="text" name="address2" class="my-account__input"
                 value="${c((e==null?void 0:e.address2)||"")}">
        </div>

        <div class="addresses-details__field">
          <label>${r("phone","電話番号")} *</label>
          <input type="tel" name="phone" class="my-account__input"
                 value="${c((e==null?void 0:e.phone)||"")}" required>
          <span class="my-account__field-error" data-error-for="phone" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field addresses-details__field--checkbox">
          ${_}
        </div>

        <p class="addresses-details__required-label">${r("required","* 必須")}</p>
        <div class="my-account__form-message my-account__form-message--error" style="display:none;"></div>

        <button type="submit" class="addresses-details__submit-btn">
          ${r("address_submit","決定")}
        </button>
        <button type="button" class="addresses-details__cancel-btn" data-action="cancel-address">
          ${r("address_cancel","キャンセル")}
        </button>
      </form>`}closeAllForms(){this._container.querySelectorAll(".my-account__address-form-container").forEach(e=>{e.innerHTML=""}),this._container.querySelectorAll(".addresses-details__card").forEach(e=>{e.style.display=""}),this._container.querySelectorAll(".addresses-details__actions").forEach(e=>{e.style.display=""}),this._container.querySelectorAll('[data-action="new-address"]').forEach(e=>{e.style.display=""})}openForm(e,t,r){const s=this._container.querySelector(`.my-account__address-form-container[data-id="${e}"]`);s&&(s.innerHTML=this.renderForm(t,r)),this._bindFormEvents()}setFormError(e,t){const r=this._container.querySelector(`.addresses-details__form[data-id="${e}"]`),s=r==null?void 0:r.querySelector(".my-account__form-message--error");s&&(s.textContent=t,s.style.display="block")}setSubmitState(e,t,r){const s=this._container.querySelector(`.addresses-details__form[data-id="${e}"]`),a=s==null?void 0:s.querySelector('[type="submit"]');a&&(a.disabled=t,a.textContent=t?r||"...":this.t("address_submit","決定"))}_listRoot(){return this._container.querySelector("#addresses-list-root")||this._container}_renderError(e){this._listRoot().innerHTML=`
      <p class="my-account__form-message--error" style="margin-top:20px;">
        ${e||this.t("save_error","保存に失敗しました。")}
      </p>`}_bindListEvents(){this._listBound||(this._listBound=!0,this._container.addEventListener("click",e=>{const t=e.target.closest("[data-action]");if(!t)return;const r=t.dataset.action;if(r==="new-address"){const s=t.dataset.type||"billing";this.closeAllForms(),t.style.display="none",this.openForm("new-"+s,null,s);return}if(r==="edit-address"){this._emit("address:edit",t.dataset.id);return}if(r==="cancel-address"){this.closeAllForms();return}if(r==="delete-address"){this._emit("address:delete",t.dataset.id,t);return}},{capture:!1}),this._container.addEventListener("submit",async e=>{const t=e.target.closest(".addresses-details__form");t&&(e.preventDefault(),this._emit("address:save",t))}),this._container.addEventListener("input",e=>{var s;const t=e.target.closest("[name]");if(!t)return;t.classList.remove("is-invalid");const r=(s=t.closest(".addresses-details__field"))==null?void 0:s.querySelector(`[data-error-for="${t.name}"]`);r&&(r.textContent=""),t.matches("[data-zip-autofill]")&&this._scheduleZipLookup(t)}),this._container.addEventListener("change",e=>{var s;const t=e.target.closest("[name]");if(!t)return;t.classList.remove("is-invalid");const r=(s=t.closest(".addresses-details__field"))==null?void 0:s.querySelector(`[data-error-for="${t.name}"]`);r&&(r.textContent="")}))}_bindFormEvents(){}_scheduleZipLookup(e){clearTimeout(this._zipTimer),!(e.value.replace(/[^0-9]/g,"").length<7)&&(this._zipTimer=setTimeout(()=>this._doZipLookup(e),300))}async _doZipLookup(e){var a;const t=e.closest(".addresses-details__form");if(!t)return;const r=t.querySelector('[data-error-for="zip"]'),s=e.value.replace(/[^0-9]/g,"");r&&(r.textContent="");try{const o=await(await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${s}`)).json();if(!((a=o.results)!=null&&a.length)){r&&(r.textContent="該当する住所が見つかりませんでした。");return}const d=o.results[0],l=t.querySelector('[name="province"]'),u=t.querySelector('[name="city"]'),_=t.querySelector('[name="address1"]');l&&Array.from(l.options).find(h=>h.value===d.address1)&&(l.value=d.address1),u&&(u.value=d.address2||""),_&&!_.value.trim()&&(_.value=d.address3||"")}catch(n){console.error("[AddressRenderer] Zip lookup failed",n),r&&(r.textContent="住所検索に失敗しました。")}}}class Ye{constructor(e,t){this._api=e,this._renderer=t,this._store=$e,this._store.subscribe(r=>t.render(r)),t.on("address:edit",r=>this._onEdit(r)),t.on("address:delete",(r,s)=>this._onDelete(r,s)),t.on("address:save",r=>this._onSave(r))}async load(e){if(!e){window.location.href="/";return}this._accessToken=e,this._store.set({status:"loading",addresses:[],error:null});try{const t=await this._api.list(e);this._store.set({status:"ready",addresses:t,error:null})}catch(t){if(console.error("[AddressController] Failed to load addresses",t),t.status===401||t.status===403){window.location.href="/";return}this._store.set({status:"error",addresses:[],error:t.message})}}async _reload(){try{const e=await this._api.list(this._accessToken);this._store.set({status:"ready",addresses:e,error:null})}catch(e){console.error("[AddressController] Reload failed",e),this._store.set({status:"error",addresses:[],error:e.message})}}_onEdit(e){var a;const t=this._store.get().addresses.find(n=>String(n.id)===String(e));if(!t){console.warn("[AddressController] Address not found:",e);return}const r=((a=t.extension_attributes)==null?void 0:a.type)||"shipping";this._renderer.closeAllForms();const s=this._renderer._container.querySelector(`.addresses-details__card[data-id="${e}"]`);if(s){const n=s.querySelector(".addresses-details__actions");n&&(n.style.display="none")}this._renderer.openForm(e,t,r)}async _onDelete(e,t){const r=this._renderer.t;if(!confirm(r("confirm_delete","本当にこの住所を削除しますか？")))return;t&&(t.textContent="...",t.disabled=!0);const s=this._store.get().addresses;this._store.update(a=>({...a,addresses:a.addresses.filter(n=>String(n.id)!==String(e))}));try{await this._api.delete(e),await this._reload()}catch(a){console.error("[AddressController] Delete failed",a),this._store.update(n=>({...n,addresses:s})),t&&(t.textContent=r("address_delete","削除"),t.disabled=!1),alert(r("delete_error","削除に失敗しました。"))}}async _onSave(e){const t=this._renderer.t,r=e.dataset.id,s=e.dataset.type||"billing",a=!!r,n=new FormData(e),o=this._validate(n,t);if(Object.keys(o).length){this._showFormErrors(e,o);return}const d={type:s,first_name:(n.get("first_name")||"").trim(),last_name:(n.get("last_name")||"").trim(),firstname_kana:(n.get("firstname_kana")||"").trim(),lastname_kana:(n.get("lastname_kana")||"").trim(),zip:(n.get("zip")||"").trim(),province:(n.get("province")||"").trim(),city:(n.get("city")||"").trim(),address1:(n.get("address1")||"").trim(),address2:(n.get("address2")||"").trim(),phone:(n.get("phone")||"").trim(),country:"Japan",is_default_billing:!!n.get("is_default_billing"),is_default_shipping:!!n.get("is_default_shipping")};this._renderer.setSubmitState(r||`new-${s}`,!0);const l=e.querySelector(".my-account__form-message--error");l&&(l.style.display="none");try{a?await this._api.update(r,d):await this._api.create(d),await this._reload()}catch(u){console.error("[AddressController] Save failed",u),l&&(l.textContent=u.message||t("save_error","保存に失敗しました。"),l.style.display="block"),this._renderer.setSubmitState(r||`new-${s}`,!1)}}_validate(e,t){var d,l,u,_;const r={},s=/^[ァ-ヶーｦ-ﾟ\s\u3000]+$/,a=["last_name","first_name","lastname_kana","firstname_kana","zip","province","city","address1","phone"];for(const f of a)(d=e.get(f))!=null&&d.trim()||(r[f]="必須項目です");for(const f of["lastname_kana","firstname_kana"]){const h=((l=e.get(f))==null?void 0:l.trim())||"";h&&!r[f]&&!s.test(h)&&(r[f]="カタカナで入力してください")}const n=(e.get("zip")||"").replace(/[^0-9]/g,"");(u=e.get("zip"))!=null&&u.trim()&&!r.zip&&n.length!==7&&(r.zip="郵便番号は7桁で入力してください（例：0600000）");const o=((_=e.get("phone"))==null?void 0:_.trim())||"";return o&&!r.phone&&!/^[0-9\-+\s()]{7,20}$/.test(o)&&(r.phone=t("phone_invalid","無効な電話番号です")),r}_showFormErrors(e,t){Object.entries(t).forEach(([s,a])=>{const n=e.querySelector(`[data-error-for="${s}"]`),o=e.querySelector(`[name="${s}"]`);n&&(n.textContent=a),o&&o.classList.add("is-invalid")});const r=e.querySelector(".is-invalid");r&&r.focus()}}let M=null;const Be={async mount(i,e){const{config:t,t:r,token:s}=e,a=new w(t.storefrontEndpoint,t.storefrontToken),n=new D(t.apiBase,()=>localStorage.getItem("shopifyCustomerAccessToken"));if(!s){g({view:"profile"});return}const o=new He(a,n),d=new je(i,r);M=new Ye(o,d),M.load(s)},unmount(){M=null}},Ke=`
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
`;class Je{constructor(e){this._sf=e}async get(e){const t=`gid://shopify/Order/${e}`,r=await this._sf.request(Ke,{orderId:t});return(r==null?void 0:r.node)??null}}class Ge{constructor(e,t){this._container=e,this.t=t}renderLoading(){this._container.innerHTML=`
      <div class="order-detail__loading">${this.t("loading","読み込み中…")}</div>`}renderError(e){this._container.innerHTML=`
      <div class="order-detail__error">${e}</div>`}renderOrder(e){var u;const t=this.t,r=K(e.financialStatus)||{},s=J(e.fulfillmentStatus)||{},a=r.label||s.label||e.financialStatus,n=r.modifier||s.modifier||"default",o=e.lineItems.edges.map(({node:_})=>{var h,y;return`
        <div class="order-detail__item">
          ${(h=_.variant)!=null&&h.image?`<img src="${_.variant.image.url}" alt="${_.variant.image.altText||_.title}" class="order-detail__item-img">`:'<div class="order-detail__item-img order-detail__item-img--placeholder"></div>'}
          <div class="order-detail__item-info">
            <p class="order-detail__item-title">${_.title}</p>
            ${(y=_.variant)!=null&&y.title&&_.variant.title!=="Default Title"?`<p class="order-detail__item-variant">${_.variant.title}</p>`:""}
            <p class="order-detail__item-qty">${t("qty","数量")}: ${_.quantity}</p>
          </div>
          <p class="order-detail__item-price">${m(_.originalTotalPrice)}</p>
        </div>`}).join(""),d=e.shippingAddress,l=d?`<address class="order-detail__address">
          ${d.lastName} ${d.firstName}<br>
          ${d.address1}${d.address2?" "+d.address2:""}<br>
          ${d.city} ${d.province} ${d.zip}<br>
          ${d.country}
         </address>`:"";this._container.innerHTML=`
      <div class="order-detail">
        <button type="button" class="order-detail__back js-order-detail-back">
          ← ${t("nav_orders","注文履歴")}
        </button>

        <header class="order-detail__header">
          <h2 class="order-detail__number">${t("order_number","注文番号")} #${e.orderNumber}</h2>
          <time class="order-detail__date" datetime="${e.processedAt}">
            ${F(e.processedAt)}
          </time>
          <span class="order-detail__status order-detail__status--${n}">
            ${a}
          </span>
        </header>

        <section class="order-detail__items">
          <h3 class="order-detail__section-title">${t("order_items","商品")}</h3>
          ${o}
        </section>

        <section class="order-detail__totals">
          <div class="order-detail__total-row">
            <span>${t("subtotal","小計")}</span>
            <span>${m(e.subtotalPrice)}</span>
          </div>
          <div class="order-detail__total-row">
            <span>${t("shipping","配送料")}</span>
            <span>${m(e.totalShippingPrice)}</span>
          </div>
          <div class="order-detail__total-row order-detail__total-row--grand">
            <span>${t("total","合計")}</span>
            <span>${m(e.totalPrice)}</span>
          </div>
        </section>

        ${d?`<section class="order-detail__shipping">
          <h3 class="order-detail__section-title">${t("shipping_address","配送先")}</h3>
          ${l}
        </section>`:""}
      </div>`,(u=this._container.querySelector(".js-order-detail-back"))==null||u.addEventListener("click",()=>g({view:"orders"}))}}class Ve{constructor(e,t){this._api=e,this._renderer=t,this._aborted=!1}async load(e,t){if(this._aborted=!1,!e){g({view:"orders"});return}this._renderer.renderLoading();try{const r=await this._api.get(e);if(this._aborted)return;if(!r){this._renderer.renderError(t("order_not_found","注文が見つかりませんでした。"));return}this._renderer.renderOrder(r)}catch(r){if(this._aborted)return;console.error("[OrderDetailController] Failed to load order",r),this._renderer.renderError(t("order_load_error","注文の読み込みに失敗しました。"))}}destroy(){this._aborted=!0}}let b=null;const Qe={async mount(i,e){const{config:t,t:r,id:s}=e,a=new w(t.storefrontEndpoint,t.storefrontToken),n=new Je(a),o=new Ge(i,r);b=new Ve(n,o),b.load(s,r)},unmount(){b==null||b.destroy(),b=null}},We=`
  query GetNewsletterPrefs($token: String!) {
    customer(customerAccessToken: $token) {
      metafields(identifiers: [
        { namespace: "registration", key: "mail_opt_in"   }
        { namespace: "registration", key: "sms_opt_in"    }
        { namespace: "registration", key: "postal_opt_in" }
      ]) { key value }
    }
  }
`;class Ze{constructor(e,t){this._sf=e,this._be=t}async fetchPreferences(e){var a;const t=await this._sf.request(We,{token:e}),r=(((a=t==null?void 0:t.customer)==null?void 0:a.metafields)??[]).filter(Boolean).map(n=>[n.key,n.value==="true"]),s=Object.fromEntries(r);return{sms_opt_in:!!s.sms_opt_in,mail_opt_in:!!s.mail_opt_in,postal_opt_in:!!s.postal_opt_in}}async updatePreferences(e){return this._be.post("/api/customers/account/update-newsletter",e)}}class Xe{constructor(e,t){this._container=e,this._t=t,this._handlers={}}on(e,t){this._handlers[e]=t}_emit(e,...t){this._handlers[e]&&this._handlers[e](...t)}renderLoading(){this._container.innerHTML=`
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this._t("loading","読み込み中...")}</p>
      </div>`}render(e={}){var t;this._container.innerHTML=`
      <div class="newsletter-page">
        <section class="newsletter-page__form-section">
          <p class="newsletter-page__title">${this._t("newsletter_title","ディブティックの最新情報や特別なご案内のお受け取り方法をお選びください")}</p>

          <div class="newsletter-page__options">
            <label class="newsletter-page__option">
              <input type="checkbox" name="newsletter_channel" value="email" class="newsletter-page__checkbox"${e.mail_opt_in?" checked":""}>
              <span class="newsletter-page__option-label">${this._t("newsletter_email","メールで")}</span>
            </label>
            <label class="newsletter-page__option">
              <input type="checkbox" name="newsletter_channel" value="sms" class="newsletter-page__checkbox"${e.sms_opt_in?" checked":""}>
              <span class="newsletter-page__option-label">${this._t("newsletter_sms","SMS/電話で")}</span>
            </label>
            <label class="newsletter-page__option">
              <input type="checkbox" name="newsletter_channel" value="postal" class="newsletter-page__checkbox"${e.postal_opt_in?" checked":""}>
              <span class="newsletter-page__option-label">${this._t("newsletter_postal","郵送で")}</span>
            </label>
          </div>

          <button type="button" class="newsletter-page__submit" data-action="newsletter-submit">
            ${this._t("newsletter_submit","登録する")}
          </button>

          <p class="newsletter-page__note">${this._t("newsletter_note","")}</p>

          <div class="newsletter-page__success" aria-live="polite" hidden>
            ${this._t("newsletter_success","ご登録ありがとうございます。")}
          </div>
          <div class="newsletter-page__error" aria-live="polite" hidden></div>
        </section>
      </div>

      <style>
        .newsletter-page__form-section { margin-bottom: 48px; }
        .newsletter-page__title {
          font-size: 0.88rem;
          line-height: 1.7;
          margin-bottom: 24px;
          color: var(--color-foreground);
        }
        .newsletter-page__options {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 28px;
        }
        .newsletter-page__option {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }
        .newsletter-page__checkbox {
          width: 18px;
          height: 18px;
          accent-color: #2a4b38;
          cursor: pointer;
          flex-shrink: 0;
        }
        .newsletter-page__option-label {
          font-size: 0.88rem;
          color: var(--color-foreground);
        }
        .newsletter-page__submit {
          display: block;
          width: 100%;
          padding: 14px 24px;
          background: #1a1a1a;
          color: #fff;
          border: none;
          font-size: 0.82rem;
          letter-spacing: 0.06em;
          cursor: pointer;
          text-align: center;
          transition: background 0.2s;
          margin-bottom: 20px;
        }
        .newsletter-page__submit:hover { background: #333; }
        .newsletter-page__submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .newsletter-page__note {
          font-size: 0.72rem;
          color: #888;
          line-height: 1.6;
        }
        .newsletter-page__success {
          margin-top: 12px;
          font-size: 0.84rem;
          color: #2a4b38;
          font-weight: 500;
        }
        .newsletter-page__error {
          margin-top: 12px;
          font-size: 0.84rem;
          color: #c0392b;
        }
      </style>
    `,(t=this._container.querySelector('[data-action="newsletter-submit"]'))==null||t.addEventListener("click",()=>{const r=new Set([...this._container.querySelectorAll(".newsletter-page__checkbox:checked")].map(s=>s.value));this._emit("newsletter:submit",{sms_opt_in:r.has("sms"),mail_opt_in:r.has("email"),postal_opt_in:r.has("postal")})})}setSubmitState(e){const t=this._container.querySelector(".newsletter-page__submit");t&&(t.disabled=e,t.textContent=e?this._t("saving","登録中..."):this._t("newsletter_submit","登録する"))}showSuccess(e){const t=this._container.querySelector(".newsletter-page__success"),r=this._container.querySelector(".newsletter-page__error");r&&(r.textContent="",r.hidden=!0),t&&(t.textContent=e,t.hidden=!1)}showError(e){const t=this._container.querySelector(".newsletter-page__success"),r=this._container.querySelector(".newsletter-page__error");t&&(t.hidden=!0),r&&(r.textContent=e,r.hidden=!1)}}class et{constructor(e,t){this._api=e,this._renderer=t,this._token=null,this._renderer.on("newsletter:submit",r=>this._onSubmit(r))}async load(e){this._token=e,this._renderer.renderLoading();try{const t=await this._api.fetchPreferences(e);this._renderer.render(t)}catch(t){console.error("[NewsletterController] Failed to load preferences",t),this._renderer.render({}),this._renderer.showError("保存状況を読み込めませんでした。")}}async _onSubmit(e){this._renderer.setSubmitState(!0);try{await this._api.updatePreferences(e),this._renderer.showSuccess("ご登録ありがとうございます。")}catch(t){console.error("[NewsletterController] Update failed",t),this._renderer.showError("保存に失敗しました。もう一度お試しください。")}finally{this._renderer.setSubmitState(!1)}}}let R=null;const tt={async mount(i,e){const{config:t,t:r,token:s}=e;if(!s){g({view:"profile"});return}const a=new w(t.storefrontEndpoint,t.storefrontToken),n=new D(t.apiBase,()=>localStorage.getItem("shopifyCustomerAccessToken")),o=new Ze(a,n),d=new Xe(i,r);R=new et(o,d),R.load(s)},unmount(){R=null}};class rt{constructor(e,t){this._container=e,this._t=t}render(){this._container.innerHTML=`
      <div class="saved-cards-page">
        <div class="saved-cards-page__content">
          <p class="saved-cards-page__empty">
            ${this._t("saved_cards_empty","決済方法が保存されていません。")}
          </p>
        </div>
      </div>

      <style>
        .saved-cards-page {
          max-width: 560px;
        }

        .saved-cards-page__empty {
          font-size: 0.88rem;
          color: var(--color-foreground);
          line-height: 1.6;
        }
      </style>
    `}}class st{constructor(e){this._renderer=e}load(){this._renderer.render()}}let O=null;const at={async mount(i,e){const t=new rt(i,e.t);O=new st(t),O.load()},unmount(){O=null}};function it(){const i=localStorage.getItem("shopifyCustomerAccessToken"),e=localStorage.getItem("shopifyCustomerAccessTokenExpiresAt");return i&&e&&new Date(e)>new Date?{token:i,isNative:!1}:L.get()?{token:null,isNative:!0}:null}function nt(i){var d;const e=document.querySelector(".account-button");if(!e||e.dataset.accountInitialized)return;e.dataset.accountInitialized="true";const t=localStorage.getItem("shopifyCustomerAccessToken"),r=localStorage.getItem("shopifyCustomerAccessTokenExpiresAt");if(!(t&&r&&new Date(r)>new Date))return;const a=e.querySelector("[data-open-account-modal]");if(!a)return;const n=document.createElement("button");n.type="button",n.className=a.className,n.setAttribute("aria-label",a.getAttribute("aria-label")||"Account"),n.setAttribute("aria-haspopup","true"),n.setAttribute("aria-expanded","false"),n.innerHTML=a.innerHTML,a.replaceWith(n);const o=document.createElement("div");o.className="account-dropdown",o.setAttribute("role","menu"),o.innerHTML=`
    <a href="/pages/account" class="account-dropdown__item" role="menuitem">
      ${i("header_my_account","マイアカウント")}
    </a>
    <button type="button" class="account-dropdown__item" id="header-logout-btn" role="menuitem">
      ${i("logout","ログアウト")}
    </button>`,e.appendChild(o),n.addEventListener("click",l=>{l.stopPropagation();const u=o.classList.toggle("is-open");n.setAttribute("aria-expanded",String(u))}),(d=o.querySelector("#header-logout-btn"))==null||d.addEventListener("click",()=>{Y("/")}),document.addEventListener("click",()=>{o.classList.remove("is-open"),n.setAttribute("aria-expanded","false")}),document.addEventListener("keydown",l=>{l.key==="Escape"&&(o.classList.remove("is-open"),n.setAttribute("aria-expanded","false"))})}function ot(){document.querySelectorAll("[data-view]").forEach(i=>{i.addEventListener("click",e=>{e.preventDefault();const t=i.dataset.view;t&&g({view:t})})})}function Z(){const i=document.getElementById("account-root");if(!i)return;const e=it();if(!e){window.location.href="/";return}const t=ne("account-config"),r=ie("account-i18n");if(!t.storefrontEndpoint||!t.storefrontToken){console.error("[account-app] Missing storefront config in #account-config");return}const s={config:t,t:r,token:e.token},a=new pe({root:i,pages:{profile:Se,orders:Oe,addresses:Be,order:Qe,newsletter:tt,"saved-cards":at},context:s,navItems:document.querySelectorAll("[data-view]")});ot(),a.start(),nt(r)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Z):Z()})();
