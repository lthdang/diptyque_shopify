(function(){"use strict";function y(o){let e={};try{const t=document.getElementById(o);t&&t.textContent.trim()!=="null"&&(e=JSON.parse(t.textContent)||{})}catch(t){console.warn("[DiptyqueAccount] Failed to parse i18n from #"+o,t)}return function(s,a){return s in e?e[s]:a!==void 0?a:(console.warn("[DiptyqueAccount] Missing i18n key:",s),s)}}function g(o){try{const e=document.getElementById(o);if(e)return JSON.parse(e.textContent)||{}}catch(e){console.warn("[DiptyqueAccount] Failed to parse config from #"+o,e)}return{}}function d(o){if(!o&&o!==0)return"";const e=document.createElement("div");return e.textContent=String(o),e.innerHTML}function v(o){if(!o)return null;const e=o.match(/\/(\d+)/);return e?Number(e[1]):null}const b={Aichi:"愛知県",Akita:"秋田県",Aomori:"青森県",Chiba:"千葉県",Ehime:"愛媛県",Fukui:"福井県",Fukuoka:"福岡県",Fukushima:"福島県",Gifu:"岐阜県",Gunma:"群馬県",Hiroshima:"広島県",Hokkaido:"北海道",Hokkaidō:"北海道",Hyogo:"兵庫県",Hyōgo:"兵庫県",Ibaraki:"茨城県",Ishikawa:"石川県",Iwate:"岩手県",Kagawa:"香川県",Kagoshima:"鹿児島県",Kanagawa:"神奈川県",Kochi:"高知県",Kōchi:"高知県",Kumamoto:"熊本県",Kyoto:"京都府",Kyōto:"京都府",Mie:"三重県",Miyagi:"宮城県",Miyazaki:"宮崎県",Nagano:"長野県",Nagasaki:"長崎県",Nara:"奈良県",Niigata:"新潟県",Oita:"大分県",Ōita:"大分県",Okayama:"岡山県",Okinawa:"沖縄県",Osaka:"大阪府",Ōsaka:"大阪府",Saga:"佐賀県",Saitama:"埼玉県",Shiga:"滋賀県",Shimane:"島根県",Shizuoka:"静岡県",Tochigi:"栃木県",Tokushima:"徳島県",Tokyo:"東京都",Tōkyō:"東京都",Tottori:"鳥取県",Toyama:"富山県",Wakayama:"和歌山県",Yamagata:"山形県",Yamaguchi:"山口県",Yamanashi:"山梨県"};function f(o){return b[o]||o}const k={get(){const o=document.getElementById("my-account-native-customer");if(!o)return null;try{return JSON.parse(o.textContent||"null")||null}catch(e){return console.warn("[DiptyqueAccount] Failed to parse #ma-native-customer JSON",e),null}}};class w{constructor(e,t){if(!e)throw new Error("[DiptyqueStorefrontClient] endpoint is required");if(!t)throw new Error("[DiptyqueStorefrontClient] token is required");this._endpoint=e,this._token=t}async request(e,t={}){let s;try{s=await fetch(this._endpoint,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json","X-Shopify-Storefront-Access-Token":this._token},body:JSON.stringify({query:e,variables:t})})}catch(i){throw new Error("[StorefrontClient] Network error: "+i.message)}if(!s.ok)throw new Error("[StorefrontClient] HTTP "+s.status+" "+s.statusText);const a=await s.json();if(a.errors&&a.errors.length){const i=a.errors.map(r=>r.message).join("; ");throw new Error("[StorefrontClient] GraphQL error: "+i)}return a.data||{}}}class ${constructor(e,t){if(!e)throw new Error("[DiptyqueBackendClient] baseUrl is required");if(!t)throw new Error("[DiptyqueBackendClient] getToken callback is required");this._base=e.replace(/\/+$/,""),this._getToken=t}async post(e,t={}){const s=this._base+e;let a;try{a=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customer_access_token:this._getToken(),...t})})}catch(r){throw new Error("[BackendClient] Network error: "+r.message)}let i;try{i=await a.json()}catch{i={}}if(!a.ok||i.success===!1){const r=new Error(i.message||"HTTP "+a.status);throw r.status=a.status,r.code=i.code,r.response=i,console.warn("[BackendClient]",a.status,s,i),r}return i.data!==void 0?i.data:i}}const S=`
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
`;class E{constructor(e,t){this._sf=e,this._be=t}async list(e){var l,c;const[t,s]=await Promise.all([this._sf.request(S,{token:e}),this._be.post("/api/customers/account/addresses").catch(()=>({}))]),a=t==null?void 0:t.customer;if(!a)return[];const i=((l=a.defaultAddress)==null?void 0:l.id)??null,r={};for(const n of s.addresses??[])r[String(n.id)]=n.extension_attributes??null;return(((c=a.addresses)==null?void 0:c.edges)??[]).map(({node:n})=>{const u=v(n.id);return{id:u,first_name:n.firstName??null,last_name:n.lastName??null,name:n.name??null,company:n.company??null,address1:n.address1??null,address2:n.address2??null,city:n.city??null,province:f(n.province??""),province_code:n.provinceCode??null,country:n.country??null,country_code:n.countryCodeV2??null,zip:n.zip??null,phone:n.phone??null,default:i!=null&&n.id===i,extension_attributes:r[String(u)]??null}})}create(e){return this._be.post("/api/customers/account/addresses/create",e)}update(e,t){return this._be.post("/api/customers/account/addresses/update",{address_id:e,...t})}delete(e){return this._be.post("/api/customers/account/addresses/delete",{address_id:e})}setDefaultBilling(e){return this._be.post("/api/customers/account/addresses/set-default-billing",{address_id:e})}setDefaultShipping(e){return this._be.post("/api/customers/account/addresses/set-default-shipping",{address_id:e})}}const q=["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"];class C{constructor(e,t){this._container=e,this.t=t,this._handlers={},this._zipTimer=null}on(e,t){this._handlers[e]=t}_emit(e,...t){this._handlers[e]&&this._handlers[e](...t)}renderLoading(){const e=this._listRoot();e.innerHTML=`
      <div class="my-account__loading">
        <div class="my-account__spinner"></div>
        <p>${this.t("loading","読み込み中...")}</p>
      </div>`}render(e){if(e.status==="loading"){this.renderLoading();return}if(e.status==="error"){this._renderError(e.error);return}e.status==="ready"&&this.renderAddressList(e.addresses)}renderAddressList(e){const t=this.t,s=this._listRoot(),a=e.filter(r=>{var l;return(((l=r.extension_attributes)==null?void 0:l.type)??"shipping")!=="billing"}),i=e.filter(r=>{var l;return((l=r.extension_attributes)==null?void 0:l.type)==="billing"});s.innerHTML=`
      <div class="addresses-details__wrapper">
        <div class="addresses-details__section">
          <h3 class="addresses-details__section-title">${t("address_shipping","配送先住所")}</h3>
          <div class="addresses-details__list" id="shipping-list">
            ${a.map(r=>this.renderCard(r)).join("")}
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
            ${i.map(r=>this.renderCard(r)).join("")}
          </div>
          <div class="addresses-details__action-area mt-40" data-area="billing">
            <button type="button" class="addresses-details__new-btn"
                    data-action="new-address" data-type="billing">
              ${t("address_new_btn","新しい住所を登録する")}
            </button>
            <div class="my-account__address-form-container" data-id="new-billing"></div>
          </div>
        </div>
      </div>`,this._bindListEvents()}renderCard(e){const t=this.t,s=e.extension_attributes??{},a=s.is_default_billing===!0||s.is_default_shipping===!0;return`
      <div class="addresses-details__card" data-id="${e.id}">
        <div class="addresses-details__card-info">
          ${a?`<span class="addresses-details__default-badge">${t("address_default_badge","デフォルト")}</span>`:""}
          <p class="addresses-details__name">${d(e.last_name||"")} ${d(e.first_name||"")}</p>
          <p>${d(e.zip||"")}</p>
          <p>${d(f(e.province||""))}</p>
          <p>${d(e.city||"")}</p>
          <p>${d(e.address1||"")}</p>
          ${e.address2?`<p>${d(e.address2)}</p>`:""}
          ${e.phone?`<p>${d(e.phone)}</p>`:""}
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
      <div class="my-account__address-form-container" data-id="${e.id}"></div>`}renderForm(e=null,t="billing"){const s=this.t,a=(e==null?void 0:e.extension_attributes)??{},i=(e==null?void 0:e.province)||"",r=f(i),l=a.lastname_kana??"",c=a.firstname_kana??"",n=a.is_default_billing===!0,u=a.is_default_shipping===!0,_=t==="billing"?`<label class="addresses-details__checkbox-label">
           <input type="checkbox" name="is_default_billing" value="1"${n?" checked":""}>
           ${s("default_billing_label","デフォルトの請求先住所に設定する")}
         </label>`:`<label class="addresses-details__checkbox-label">
           <input type="checkbox" name="is_default_shipping" value="1"${u?" checked":""}>
           ${s("default_shipping_label","デフォルトの配送先住所に設定する")}
         </label>`,p=q.map(m=>`<option value="${m}"${r===m?" selected":""}>${m}</option>`).join("");return`
      <form class="addresses-details__form" novalidate
            data-id="${(e==null?void 0:e.id)||""}" data-type="${t}"
            data-province-raw="${d(i)}">

        <div class="addresses-details__form-row">
          <div class="addresses-details__field">
            <label>${s("last_name","姓")} *</label>
            <input type="text" name="last_name" class="my-account__input"
                   value="${d((e==null?void 0:e.last_name)||"")}" required>
            <span class="my-account__field-error" data-error-for="last_name" aria-live="polite"></span>
          </div>
          <div class="addresses-details__field">
            <label>${s("first_name","名")} *</label>
            <input type="text" name="first_name" class="my-account__input"
                   value="${d((e==null?void 0:e.first_name)||"")}" required>
            <span class="my-account__field-error" data-error-for="first_name" aria-live="polite"></span>
          </div>
        </div>

        <div class="addresses-details__form-row">
          <div class="addresses-details__field">
            <label>${s("furigana_last","フリガナ（姓）")} *</label>
            <input type="text" name="lastname_kana" class="my-account__input"
                   value="${d(l)}" required placeholder="例：ヤマダ">
            <span class="my-account__field-error" data-error-for="lastname_kana" aria-live="polite"></span>
          </div>
          <div class="addresses-details__field">
            <label>${s("furigana_first","フリガナ（名）")} *</label>
            <input type="text" name="firstname_kana" class="my-account__input"
                   value="${d(c)}" required placeholder="例：タロウ">
            <span class="my-account__field-error" data-error-for="firstname_kana" aria-live="polite"></span>
          </div>
        </div>

        <div class="addresses-details__field">
          <label>${s("zip","郵便番号")} *</label>
          <input type="text" name="zip" class="my-account__input"
                 value="${d((e==null?void 0:e.zip)||"")}" required
                 placeholder="例：060-0000" maxlength="8" data-zip-autofill>
          <span class="my-account__field-error" data-error-for="zip" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${s("province","都道府県")} *</label>
          <select name="province" class="my-account__input" required>
            <option value="" disabled ${e!=null&&e.province?"":"selected"}>
              ${s("province_placeholder","都道府県を選択")}
            </option>
            ${p}
          </select>
          <span class="my-account__field-error" data-error-for="province" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${s("city","市区町村")} *</label>
          <input type="text" name="city" class="my-account__input"
                 value="${d((e==null?void 0:e.city)||"")}" required>
          <span class="my-account__field-error" data-error-for="city" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${s("address1","丁番・番地")} *</label>
          <input type="text" name="address1" class="my-account__input"
                 value="${d((e==null?void 0:e.address1)||"")}" required>
          <span class="my-account__field-error" data-error-for="address1" aria-live="polite"></span>
        </div>

        <div class="addresses-details__field">
          <label>${s("address2","マンション・建物名")}</label>
          <input type="text" name="address2" class="my-account__input"
                 value="${d((e==null?void 0:e.address2)||"")}">
        </div>

        <div class="addresses-details__field">
          <label>${s("phone","電話番号")} *</label>
          <input type="tel" name="phone" class="my-account__input"
                 value="${d((e==null?void 0:e.phone)||"")}" required>
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
      </form>`}closeAllForms(){this._container.querySelectorAll(".my-account__address-form-container").forEach(e=>{e.innerHTML=""}),this._container.querySelectorAll(".addresses-details__card").forEach(e=>{e.style.display=""}),this._container.querySelectorAll(".addresses-details__actions").forEach(e=>{e.style.display=""}),this._container.querySelectorAll('[data-action="new-address"]').forEach(e=>{e.style.display=""})}openForm(e,t,s){const a=this._container.querySelector(`.my-account__address-form-container[data-id="${e}"]`);a&&(a.innerHTML=this.renderForm(t,s)),this._bindFormEvents()}setFormError(e,t){const s=this._container.querySelector(`.addresses-details__form[data-id="${e}"]`),a=s==null?void 0:s.querySelector(".my-account__form-message--error");a&&(a.textContent=t,a.style.display="block")}setSubmitState(e,t,s){const a=this._container.querySelector(`.addresses-details__form[data-id="${e}"]`),i=a==null?void 0:a.querySelector('[type="submit"]');i&&(i.disabled=t,i.textContent=t?s||"...":this.t("address_submit","決定"))}_listRoot(){return this._container.querySelector("#addresses-list-root")||this._container}_renderError(e){this._listRoot().innerHTML=`
      <p class="my-account__form-message--error" style="margin-top:20px;">
        ${e||this.t("save_error","保存に失敗しました。")}
      </p>`}_bindListEvents(){this._listBound||(this._listBound=!0,this._container.addEventListener("click",e=>{const t=e.target.closest("[data-action]");if(!t)return;const s=t.dataset.action;if(s==="new-address"){const a=t.dataset.type||"billing";this.closeAllForms(),t.style.display="none",this.openForm("new-"+a,null,a);return}if(s==="edit-address"){this._emit("address:edit",t.dataset.id);return}if(s==="cancel-address"){this.closeAllForms();return}if(s==="delete-address"){this._emit("address:delete",t.dataset.id,t);return}},{capture:!1}),this._container.addEventListener("submit",async e=>{const t=e.target.closest(".addresses-details__form");t&&(e.preventDefault(),this._emit("address:save",t))}),this._container.addEventListener("input",e=>{var a;const t=e.target.closest("[name]");if(!t)return;t.classList.remove("is-invalid");const s=(a=t.closest(".addresses-details__field"))==null?void 0:a.querySelector(`[data-error-for="${t.name}"]`);s&&(s.textContent=""),t.matches("[data-zip-autofill]")&&this._scheduleZipLookup(t)}),this._container.addEventListener("change",e=>{var a;const t=e.target.closest("[name]");if(!t)return;t.classList.remove("is-invalid");const s=(a=t.closest(".addresses-details__field"))==null?void 0:a.querySelector(`[data-error-for="${t.name}"]`);s&&(s.textContent="")}))}_bindFormEvents(){}_scheduleZipLookup(e){clearTimeout(this._zipTimer),!(e.value.replace(/[^0-9]/g,"").length<7)&&(this._zipTimer=setTimeout(()=>this._doZipLookup(e),300))}async _doZipLookup(e){var i;const t=e.closest(".addresses-details__form");if(!t)return;const s=t.querySelector('[data-error-for="zip"]'),a=e.value.replace(/[^0-9]/g,"");s&&(s.textContent="");try{const l=await(await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${a}`)).json();if(!((i=l.results)!=null&&i.length)){s&&(s.textContent="該当する住所が見つかりませんでした。");return}const c=l.results[0],n=t.querySelector('[name="province"]'),u=t.querySelector('[name="city"]'),_=t.querySelector('[name="address1"]');n&&Array.from(n.options).find(m=>m.value===c.address1)&&(n.value=c.address1),u&&(u.value=c.address2||""),_&&!_.value.trim()&&(_.value=c.address3||"")}catch(r){console.error("[AddressRenderer] Zip lookup failed",r),s&&(s.textContent="住所検索に失敗しました。")}}}function x(o){let e=o;const t=new Set,s=()=>t.forEach(a=>{try{a(e)}catch(i){console.error("[DiptyqueStore] Subscriber error",i)}});return{get(){return e},set(a){e=a,s()},update(a){e=a(e),s()},subscribe(a){return t.add(a),()=>t.delete(a)},find(a){return(Array.isArray(e)?e:(e==null?void 0:e.items)??[]).find(a)}}}const A=x({status:"idle",addresses:[],error:null});class T{constructor(e,t){this._api=e,this._renderer=t,this._store=A,this._store.subscribe(s=>t.render(s)),t.on("address:edit",s=>this._onEdit(s)),t.on("address:delete",(s,a)=>this._onDelete(s,a)),t.on("address:save",s=>this._onSave(s))}async load(e){if(!e){window.location.href="/";return}this._accessToken=e,this._store.set({status:"loading",addresses:[],error:null});try{const t=await this._api.list(e);this._store.set({status:"ready",addresses:t,error:null})}catch(t){if(console.error("[AddressController] Failed to load addresses",t),t.status===401||t.status===403){window.location.href="/";return}this._store.set({status:"error",addresses:[],error:t.message})}}async _reload(){try{const e=await this._api.list(this._accessToken);this._store.set({status:"ready",addresses:e,error:null})}catch(e){console.error("[AddressController] Reload failed",e),this._store.set({status:"error",addresses:[],error:e.message})}}_onEdit(e){var i;const t=this._store.get().addresses.find(r=>String(r.id)===String(e));if(!t){console.warn("[AddressController] Address not found:",e);return}const s=((i=t.extension_attributes)==null?void 0:i.type)||"shipping";this._renderer.closeAllForms();const a=this._renderer._container.querySelector(`.addresses-details__card[data-id="${e}"]`);if(a){const r=a.querySelector(".addresses-details__actions");r&&(r.style.display="none")}this._renderer.openForm(e,t,s)}async _onDelete(e,t){const s=this._renderer.t;if(!confirm(s("confirm_delete","本当にこの住所を削除しますか？")))return;t&&(t.textContent="...",t.disabled=!0);const a=this._store.get().addresses;this._store.update(i=>({...i,addresses:i.addresses.filter(r=>String(r.id)!==String(e))}));try{await this._api.delete(e),await this._reload()}catch(i){console.error("[AddressController] Delete failed",i),this._store.update(r=>({...r,addresses:a})),t&&(t.textContent=s("address_delete","削除"),t.disabled=!1),alert(s("delete_error","削除に失敗しました。"))}}async _onSave(e){const t=this._renderer.t,s=e.dataset.id,a=e.dataset.type||"billing",i=!!s,r=new FormData(e),l=this._validate(r,t);if(Object.keys(l).length){this._showFormErrors(e,l);return}const c={type:a,first_name:(r.get("first_name")||"").trim(),last_name:(r.get("last_name")||"").trim(),firstname_kana:(r.get("firstname_kana")||"").trim(),lastname_kana:(r.get("lastname_kana")||"").trim(),zip:(r.get("zip")||"").trim(),province:(r.get("province")||"").trim(),city:(r.get("city")||"").trim(),address1:(r.get("address1")||"").trim(),address2:(r.get("address2")||"").trim(),phone:(r.get("phone")||"").trim(),country:"Japan",is_default_billing:!!r.get("is_default_billing"),is_default_shipping:!!r.get("is_default_shipping")};this._renderer.setSubmitState(s||`new-${a}`,!0);const n=e.querySelector(".my-account__form-message--error");n&&(n.style.display="none");try{i?await this._api.update(s,c):await this._api.create(c),await this._reload()}catch(u){console.error("[AddressController] Save failed",u),n&&(n.textContent=u.message||t("save_error","保存に失敗しました。"),n.style.display="block"),this._renderer.setSubmitState(s||`new-${a}`,!1)}}_validate(e,t){var c,n,u,_;const s={},a=/^[ァ-ヶーｦ-ﾟ\s\u3000]+$/,i=["last_name","first_name","lastname_kana","firstname_kana","zip","province","city","address1","phone"];for(const p of i)(c=e.get(p))!=null&&c.trim()||(s[p]="必須項目です");for(const p of["lastname_kana","firstname_kana"]){const m=((n=e.get(p))==null?void 0:n.trim())||"";m&&!s[p]&&!a.test(m)&&(s[p]="カタカナで入力してください")}const r=(e.get("zip")||"").replace(/[^0-9]/g,"");(u=e.get("zip"))!=null&&u.trim()&&!s.zip&&r.length!==7&&(s.zip="郵便番号は7桁で入力してください（例：0600000）");const l=((_=e.get("phone"))==null?void 0:_.trim())||"";return l&&!s.phone&&!/^[0-9\-+\s()]{7,20}$/.test(l)&&(s.phone=t("phone_invalid","無効な電話番号です")),s}_showFormErrors(e,t){Object.entries(t).forEach(([a,i])=>{const r=e.querySelector(`[data-error-for="${a}"]`),l=e.querySelector(`[name="${a}"]`);r&&(r.textContent=i),l&&l.classList.add("is-invalid")});const s=e.querySelector(".is-invalid");s&&s.focus()}}function h(){const o=document.getElementById("addresses-details-container");if(!o)return;const e=k.get(),t=localStorage.getItem("shopifyCustomerAccessToken"),s=localStorage.getItem("shopifyCustomerAccessTokenExpiresAt"),i=t&&s&&new Date(s)>new Date?{token:t}:null;if(!e&&!i){window.location.href="/";return}const r=g("ad-config"),l=y("ad-i18n");if(!r.storefrontEndpoint||!r.storefrontToken){console.error("[account-boot-addresses] Missing storefront config in #ad-config");return}const c=new w(r.storefrontEndpoint,r.storefrontToken),n=new $(r.apiBase,()=>localStorage.getItem("shopifyCustomerAccessToken")),u=new E(c,n),_=new C(o,l);new T(u,_).load((i==null?void 0:i.token)||null)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",h):h()})();
