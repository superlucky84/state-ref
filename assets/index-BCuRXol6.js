(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))a(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&a(o)}).observe(document,{childList:!0,subtree:!0});function c(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(i){if(i.ep)return;i.ep=!0;const s=c(i);fetch(i.href,s)}})();const ve=Symbol.for("lithentWDomSymbol"),be={value:""},he={value:null},oe={value:!1},_=new WeakMap,Lt=new WeakSet,Nr=r=>{_.set(r,{vd:{value:null},up:()=>{},upR:[],upS:{value:0},upD:[],upCB:[],mts:[],umts:[],wdCB:[]})},Me=()=>he.value,bt=(r,n)=>{const c=_.get(r);return c?c[n]:null},Mr=r=>{he.value=r},Or=r=>{he.value=r,Nr(r)},Lr=r=>{const n=_.get(r);n&&(n.umts.forEach(c=>c()),n.umts=[])},ee=r=>r.getParent&&r.getParent(),Se=Object.entries,Ft=Object.keys,xe=r=>typeof r=="object"&&r!==null,Oe=Object.assign,ue=r=>xe(r)&&!("resolve"in r),Ae=(r,n)=>ue(r)&&r.type===n,Fr=(r,n)=>"ctor"in r?r.ctor===(n&&n.ctor):r===(n&&n.ctor),Ur=(r,n)=>!!(ue(r)&&n&&n.type==="f"&&n.children&&n.children.length===(r.children&&r.children.length)),qr=(r,n)=>!!(ue(r)&&n&&n.type==="e"&&n.tag===r.tag&&n.children&&n.children.length===(r.children&&r.children.length)),vt=(r,n)=>!!(ue(r)&&n&&n.type===r.type),_r=(r,n)=>!!(ue(r)&&n&&n.type===r.type&&(le((r.children||[])[0])&&le((n.children||[])[0])||n.children&&r.children&&n.children.length===r.children.length)),G=r=>(r&&r.compProps&&r.compProps.key)??(r&&r.props&&r.props.key),se=r=>r&&["f","l"].includes(r),Le=r=>typeof r=="function"&&!Ut(r)||xe(r)&&"resolve"in r,Ut=r=>typeof r=="function"&&r===je,Vr=r=>ue(r)&&!r.type,le=r=>qt(G(r)),qt=r=>r!=null,wt=(r,n)=>r==="style"&&xe(n),jr=(r,n)=>r==="ref"&&xe(n),Br=(r,n)=>{const c=Object.getOwnPropertyDescriptor(r.constructor.prototype,n);return c&&c.get&&c.set},Kr=r=>Le(r)?"c":Ae(r,"f")?"f":Ae(r,"e")?"e":Ae(r,"l")?"l":Ae(r,"t")?"t":"et",$r={c:Fr,l:_r,t:vt,e:qr,f:Ur,et:vt},_t=r=>{const n=Me();if(n){const c=_.get(n);c&&c.umts.push(r)}},Fe=r=>{const{compKey:n}=r;n&&Jr(n),Vt(r)},Vt=r=>{(r.children||[]).forEach(n=>{n.compKey?Fe(n):Vt(n)})},Jr=r=>{Lr(r),_.delete(r)};let Ze=[];const zr=r=>{r.compKey&&Ze.push(r)},Ee=()=>{Ze.forEach(r=>Gr(r)),Ze=[]},Hr=r=>{const n=Me();if(n){const c=_.get(n);c&&c.mts.push(r)}},Gr=r=>{const{compKey:n}=r;if(n){const c=_.get(n);if(!c)return;const{mts:a,upS:i}=c;he.value=n,i&&(i.value=0),a&&(c.mts=[],a.forEach(s=>{const o=s();o&&_t(o)}))}},Qr=r=>{const{compKey:n}=r;if(n){const c=_.get(n),a=c&&c.wdCB;he.value=n,a&&a.length>0&&(c.wdCB=[],a.forEach(i=>{const s=i();s&&typeof s=="function"&&_t(s)}))}},Yr=r=>{const{compKey:n}=r;if(n){const c=_.get(n);if(!c)return;const{upCB:a,upS:i}=c;he.value=n,i&&(i.value=0),r.ctor&&a&&(c.upCB=[],a.forEach(s=>s()))}},Ie=()=>new DocumentFragment,Zr=r=>document.createElement(r),Xr=(r,n,c,a)=>{r.isRoot=!0,n=n||document.body,r.we=n;const i=qe(r,a);return n.tagName==="HTML"?n.replaceWith(i):n.appendChild(i),Ee(),()=>{const s=_.get(r.compProps||{}),o=s&&s.vd.value||r;o!==r&&Fe(o),Ue(o),en(o)}},Ue=r=>{r.props&&r.el&&$t(r.props,r.el),(r.children||[]).forEach(n=>{Ue(n)})},en=r=>jt(r,r.we),it=r=>{r.op&&r.el&&$t(r.op,r.el);const n=ee(r),c=r.isRoot?r.we:n?_e(n):void 0;c&&jt(r,c)},jt=(r,n)=>{n&&r.el&&(r.el.nodeType===11||(r==null?void 0:r.tag)==="portal"?Bt(r):[1,3].includes(r.el.nodeType)&&n.removeChild(r.el),delete r.el)},Bt=(r,n)=>{(r&&r.oc||r&&r.children||[]).forEach(c=>{const a=c.el&&c.el.nodeType;if(a)if([1,3].includes(a)){const i=c.el;i.tagName==="HTML"?i.innerHTML="":i.remove()}else a===11&&Bt(c)})},Xe=r=>{it(r),Pe(r)},tn=r=>{rt(r);const n=ee(r);if(!n){if(r.isRoot){const c=et(r);Pe(r,c)}return}if(n.nr!=="L"){const c=et(r);Pe(r,c)}},Pe=(r,n)=>{n||(n=qe(r));const c=ee(r);if(!c||!c.type){r.isRoot&&r.we&&n&&r.tag!=="portal"&&(r.ae?r.we.insertBefore(n,r.ae):r.we.tagName==="HTML"?r.we.replaceWith(n):r.we.appendChild(n),Ee());return}const a=_e(c),i=c.type==="l"&&c.nr&&c.nr!=="L"?tt(c,ee(c)):tt(r,c);n&&a&&(r.tag!=="portal"&&(i?a.insertBefore(n,i):a.appendChild(n)),Ee())},et=r=>se(r.type)?(r&&r.children||[]).reduce((n,c)=>{const a=et(c);return a&&n.appendChild(a),n},Ie()):r.el,tt=(r,n)=>{const c=n.children||[],a=c.indexOf(r)+1,i=c.slice(a),s=Kt(i),o=n.type||"";if(s)return s;if(!n.isRoot&&se(o))return tt(n,ee(n));if(n.isRoot&&se(o)&&n.ae)return n.ae},Kt=r=>r.reduce((n,c)=>{if(n)return n;const{type:a,el:i}=c;if(a&&se(a)){const s=Kt(c.children||[]);if(s)return s}return i&&i.nodeType!==11?i:n},void 0),rn=r=>{const n=ee(r),c=r.el;if(r.isRoot&&!n&&c){Xe(r);return}if(n&&n.type&&c)if(c.nodeType===11)Xe(r);else{const a=_e(n),i=qe(r);a&&r.tag!=="portal"&&a.replaceChild(i,c),Ee()}},$t=(r,n)=>{Se(r||{}).forEach(([c,a])=>{c.match(/^on/)&&n.removeEventListener(c.slice(2).toLowerCase(),a)})},rt=r=>{if(r.type==="t"){cn(r);return}if(r.el){const{op:n,props:c}=r;zt(c,r.el,n),delete r.op,r.tag==="input"&&(r.el.value=String(c&&c.value||""))}(r.children||[]).forEach(n=>Jt(n)),Yr(r)},Jt=r=>{const{nr:n}=r;n!==void 0&&n!=="N"&&(nn[n](r),delete r.nr,delete r.oc,delete r.op)},nn={A:Pe,D:it,R:rn,U:rt,S:Xe,T:tn,L:rt},cn=r=>{r.el&&(r.el.nodeValue=String(r.text))},zt=(r,n,c,a)=>{const i=c||{};Se(r||{}).forEach(([s,o])=>{if(o===i[s]){delete i[s];return}s==="key"||o===i[s]||s==="portal"&&xe(o)||(s==="innerHTML"&&typeof o=="string"?n.innerHTML=o:wt(s,o)?ln(o,wt(s,i.style)?i.style:{},n):jr(s,o)?o.value=n:s.match(/^on/)?sn(n,s,o,i[s]):s&&(s!=="type"&&Br(n,s)?n[s]=o:an(s==="className"?"class":s,n,o))),delete i[s]}),Ft(i).forEach(s=>n.removeAttribute(s))},an=(r,n,c)=>be.value&&r!=="xmlns"?n.setAttributeNS(null,r,c):n.setAttribute(r,c),qe=(r,n)=>{let c;const{type:a,tag:i,text:s,props:o,children:l=[]}=r,d=se(a);if(Qr(r),i==="svg"&&(be.value=String(o&&o.xmlns)),!n){if(!a)c=Ie();else if(d)c=Ie();else if(a==="e"&&i)i==="portal"&&o&&o.portal?c=o.portal:c=be.value?document.createElementNS(be.value,i):Zr(i);else if(a==="t"&&qt(s))c=document.createTextNode(String(s));else throw Error("Invalid wDom");r.el=c}return on(l,c,n),zt(o,c,null),zr(r),i==="svg"&&(be.value=""),c},on=(r,n,c)=>{const a=r.reduce((i,s)=>{if(s.type){const o=qe(s,c);s.tag!=="portal"&&!c&&i.appendChild(o)}return i},Ie());n&&a.hasChildNodes()&&n.appendChild(a)},sn=(r,n,c,a)=>{const i=n.slice(2).toLowerCase();a!==c&&(a&&r.removeEventListener(i,a),c&&r.addEventListener(i,c))},ln=(r,n,c)=>{const a={...n},i=c instanceof HTMLElement?c:null,s=i==null?void 0:i.style;if(!s)return;const o=s;Se(r).forEach(([l,d])=>{o[l]=d,delete a[l]}),Se(a).forEach(([l])=>{o[l]=""})},_e=r=>{const n=se(r.type);return r.isRoot&&n?r.we:n?_e(ee(r)):r.el},Ve=(r,n)=>dn(r,$r[Kr(r)](r,n),n),dn=(r,n,c)=>{const a=yn(r,n,c),i=un(a,n,c),s=i==="N";return s||(a.children=bn(a,n,c)),a.nr=i,hn(a,c,i),!s&&c&&(c.il=!0,delete c.children),(c==null?void 0:c.tag)==="portal"&&(a.tag="portal"),a},hn=(r,n,c)=>{c!=="A"&&n&&(r.el=n.el),(c==="D"||c==="R"||c==="S")&&(n&&(Fe(n),Ue(n)),r.oc=n&&n.children),r.op=n&&n.props},un=(r,n,c)=>{if(Vr(r))return"D";if(r.type==="t"&&n&&r.text===(c&&c.text)||r===c)return"N";if(!(c&&c.type))return"A";const a=ee(c),i=!r.isRoot&&a&&a.type==="l"&&le(r);let s=n?i?"T":"U":i?"S":"R";return r.type==="l"&&s==="U"&&c&&pn(r,c)&&(s="L"),s},pn=(r,n)=>{if(!le((r.children||[])[0])||!le((n.children||[])[0]))return!1;const c=[...n&&n.children||[]],a=[...r&&r.children||[]].filter(o=>c.find(l=>G(o)===G(l))),i=c.filter(o=>a.find(l=>G(o)===G(l)));let s=i.length===a.length;return s&&(s=i.every((o,l)=>G(o)===G(a[l]))),s},gn=(r,n)=>{r&&n!==r&&(Ft(r).forEach(c=>delete r[c]),Se(n||{}).forEach(([c,a])=>r[c]=a))},fn=(r,n)=>{r&&(r.splice(0,r.length),n&&n.forEach(c=>r.push(c)))},mn=(r,n)=>{const{compProps:c,compChild:a}=r,{props:i,children:s}=n;return c&&gn(c,i),a&&s&&a!==s&&fn(a,s),r.reRender&&r.reRender()},yn=(r,n,c)=>Le(r)?n&&c?mn(c,r):r.resolve():r,bn=(r,n,c)=>n&&c?wn(r,c):vn(r),vn=r=>(r.children||[]).map(n=>Oe(Ve(n),{getParent:()=>r})),wn=(r,n)=>r.type==="l"&&le((r.children||[])[0])?Sn(r,n):(r.children||[]).map((c,a)=>Oe(Ve(c,(n.children||[])[a]),{getParent:()=>r})),Sn=(r,n)=>{const[c,a]=kn(r,n);return a.forEach(i=>{Fe(i),Ue(i),it(i)}),c},kn=(r,n)=>{const c=[...n.children||[]];return[(r.children||[]).map(a=>{const i=Rn(a,c),s=Ve(a,i);return i&&c.splice(c.indexOf(i),1),s.getParent=()=>r,s}),c]},Rn=(r,n)=>n.find(c=>G(c)===G(r)),nt=new Map;let ct=!1;const xn=(r,n)=>{const c=_.get(r);c&&(c.up=()=>{nt.set(r,n),ct||(ct=!0,queueMicrotask(Cn))})},Ht=r=>()=>{const n=_.get(r),c=n&&n.up;return c?(c(),!0):!1},Cn=()=>{nt.forEach(r=>{r()}),nt.clear(),ct=!1},Tn=()=>{const r=Me();if(!r)return;const n=_.get(r),c=n&&n.upR;c&&c.length&&c.forEach(a=>a())},je=(r,...n)=>({type:"f",[ve]:!0,children:n}),St=(r,n,...c)=>{const a={value:void 0},i=Gt(a,c),s=In(r,n||{},i);return Le(s)||(a.value=s),s},u=r=>(n,c)=>r,An=r=>(n,c)=>(Lt.add(r),r),Wn=(r,n,c)=>{const a=(i,s)=>{if(!(!i||s.has(i))){if(s.add(i),i.compChild){const o=i.compChild.indexOf(n);o!==-1&&i.compChild.splice(o,1,c)}a(i.getParent?i.getParent():void 0,s)}};a(r,new Set)},En=(r,n,c,a)=>{if(a.il)return;oe.value=!0;const i=Yt(r,n,c),s=Ve(i,a),{isRoot:o,getParent:l,we:d,ae:y}=a;if(s.getParent=l,!o&&l){const w=l(),R=w&&w.children||[],k=R.indexOf(a);k!==-1&&R.splice(k,1,s),Wn(w,a,s)}else s.isRoot=!0,s.we=d,s.ae=y;oe.value=!1,Jt(s)},In=(r,n,c)=>{if(Ut(r))return je(n,...c);if(Le(r)){const a=Yt(r,n,c);return oe.value?a:a.resolve()}return{type:"e",[ve]:!0,tag:r,props:n,children:c}},Gt=(r,n)=>n.map(c=>Oe(Qt(c),{getParent:()=>r.value})),Qt=r=>{if(r==null||r===!1)return{type:null,[ve]:!0};if(Array.isArray(r)){const n={value:void 0},c=Gt(n,r),a={type:"l",[ve]:!0,children:c};return n.value=a,a}else if(typeof r=="string"||typeof r=="number")return{type:"t",[ve]:!0,text:r};return r},Pn=(r,n,c)=>(a=n)=>{const i=oe.value;oe.value=!1,Or(a);const s=r(n,c);let o;if(typeof s=="function"){const d=s;o=Lt.has(d)?d(n,c):d(Ht(a),n,c)}else o=d=>r(d,c);const l=Dn(o,a,r,n,c);return oe.value=i,l},Yt=(r,n,c)=>{const a=r,i=c,s=Pn(r,n,i);return{ctor:a,props:n,children:i,resolve:s}},Dn=(r,n,c,a,i)=>{const s=y=>Qt(r(y)),{wrappedComponentMaker:o,customNode:l}=On(s,a),d=Nn(o,n,c,a,i);return Zt(l,n,c,a,i,d),l},Nn=(r,n,c,a,i)=>{const s=()=>Mn(r,n,c,a,i,s);return s},Mn=(r,n,c,a,i,s)=>{Mr(n),Tn();const o=r(a);return Zt(o,n,c,a,i,s),o},On=(r,n)=>{const c=i=>{const s=r(i),o=je({},s);return s.getParent=()=>o,o},a=c(n);return{wrappedComponentMaker:c,customNode:a}},Zt=(r,n,c,a,i,s)=>{Oe(r,{compProps:a,compChild:i,ctor:c,compKey:n,reRender:s}),xn(n,()=>En(c,r.compProps||a,r.compChild||i,r)),bt(n,"vd")&&(bt(n,"vd").value=r)},Ln=r=>({value:r}),Fn=()=>{const r=Me();return r?Ht(r):()=>!1};function e(r,n,c,a,i,s){const{children:o,...l}=n;if(o!=null){const d=Array.isArray(o)?o:[o];return St(r,{...l,key:c},...d)}return St(r,{...l,key:c})}const Un={cache:!0};function qn(r){const n={value:!1},c=!Array.isArray(r)&&typeof r=="object"&&r!==null?r:{value:r},a=new Set,i=[],s=new WeakMap,o=(l,d,y)=>{const{cache:w}=Object.assign({},Un,y||{});if(w&&l&&s.has(l))return s.get(l);const R={},k=new Set;let T={value:null},E=()=>{};return i.push(R),l&&d&&(E=()=>l(T.value),T.value=kt(c,n,a,k,i,E,R),n.value=!0,d(T.value),n.value=!1),T.value||(T.value=kt(c,n,a,k,i),l&&(E=()=>l(T.value),a.add(E))),l&&(Vn(E,a,R,k),s.set(l,T.value)),T.value};return{useStore(l,d){const y=Fn();return o(y,l,d)},watch(l,d,y){return o(l,d,y)}}}function kt(r,n,c,a,i,s,o){return new Proxy(r,{get(l,d){return s&&o&&n.value&&(o[d]??(o[d]=new Set),o[d].has(s)||(o[d].add(s),a.add(d))),l[d]},set(l,d,y){return l[d]===y||(l[d]=y,_n(c,i,d)),!0}})}function _n(r,n=[],c){const a=new Set;xt(r).forEach(i=>a.add(i)),(n||[]).forEach(i=>{const s=i[c]||new Set;xt(s).forEach(o=>a.add(o)),Rt(a,s)}),Rt(a,r)}function Rt(r,n){r.forEach(c=>{n.delete(c)})}function xt(r){const n=[];return r.forEach(c=>{c()===!1&&n.push(c)}),n}function Vn(r,n,c,a){const i=r();i instanceof AbortSignal&&i.addEventListener("abort",()=>{const s=c||{};n.delete(r),Object.entries(s).forEach(([o,l])=>{l.delete(r),a.delete(o)})})}const Xt="/ko",jn=r=>r.startsWith("/")?r:`/${r}`,Bn=r=>jn(r||"/").replace(/^\/ko(?=\/|$)/,"")||"/",er=()=>location.hash.slice(1)||"/",we=(r,n)=>{const c=Bn(r);return n==="ko"?`${Xt}${c}`:c},Kn=()=>{const r=localStorage.getItem("stateref-theme");return r==="light"||r==="dark"?r:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"},Be=qn({theme:Kn(),route:er(),sidebarOpen:!1}),Q=Be.watch(),tr=r=>{Q.theme=r,localStorage.setItem("stateref-theme",r),r==="dark"?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark")},$n=()=>{tr(Q.theme==="light"?"dark":"light")},Z=()=>Q.route.startsWith(Xt),rr=r=>{Q.route=r,location.hash=`#${r}`,Q.sidebarOpen=!1,window.scrollTo(0,0)},Ke=r=>{const n=Z()?"ko":"en",c=we(r,n);rr(c)},Jn=r=>{const n=we(Q.route,r);n!==Q.route&&rr(n)},Ct=()=>{Jn(Z()?"en":"ko")};window.addEventListener("hashchange",()=>{Q.route=er(),window.scrollTo(0,0)});tr(Q.theme);const zn=u(r=>{const n=Be.watch(r);return()=>e("header",{class:"sticky top-0 z-50 bg-white dark:bg-[#1b1b1f] border-b border-gray-200 dark:border-gray-800",children:e("div",{class:"mx-auto max-w-[1440px]",children:e("div",{class:"flex h-16",children:[e("div",{class:"w-auto lg:w-64 flex-shrink-0 flex items-center px-6 md:px-12",children:e("a",{href:"#/",onClick:c=>{c.preventDefault(),Ke("/")},class:"flex items-center gap-3 hover:opacity-80 transition-opacity",children:[e("img",{src:"/state-ref/stateref.png",alt:"StateRef Logo",class:"w-8 h-8 rounded-lg"}),e("span",{class:"text-xl font-bold text-gray-900 dark:text-white",children:"StateRef"})]})}),e("div",{class:"flex-1 w-full min-w-0 px-6 md:px-12",children:e("div",{class:"max-w-full md:max-w-[43rem] flex items-center justify-end h-16",children:[e("div",{class:"flex items-center border border-gray-200 dark:border-gray-700 rounded-full text-xs font-semibold overflow-hidden",children:[e("button",{type:"button",onClick:()=>!Z()||Ct(),class:`px-3 py-1 transition-colors ${Z()?"text-gray-600 dark:text-gray-300":"bg-indigo-500 text-white"}`,"aria-pressed":!Z(),children:"EN"}),e("button",{type:"button",onClick:()=>Z()||Ct(),class:`px-3 py-1 transition-colors ${Z()?"bg-indigo-500 text-white":"text-gray-600 dark:text-gray-300"}`,"aria-pressed":Z(),children:"KO"})]}),e("button",{onClick:$n,class:"hidden sm:inline-flex ml-6 relative items-center h-9 w-16 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 bg-gray-200 dark:bg-gray-700","aria-label":"Toggle dark mode",title:n.theme==="dark"?"Switch to light mode":"Switch to dark mode",children:e("span",{class:`inline-block h-7 w-7 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${n.theme==="dark"?"translate-x-8":"translate-x-1"}`,children:e("span",{class:"flex items-center justify-center h-full",children:n.theme==="dark"?e("svg",{class:"w-4 h-4 text-gray-600",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",xmlns:"http://www.w3.org/2000/svg",children:e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"})}):e("svg",{class:"w-4 h-4 text-yellow-500",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",xmlns:"http://www.w3.org/2000/svg",children:e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"})})})})}),e("a",{href:"https://github.com/superlucky84/state-ref",target:"_blank",rel:"noopener noreferrer",class:"hidden sm:flex ml-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors","aria-label":"GitHub",children:e("svg",{xmlns:"http://www.w3.org/2000/svg",class:"w-5 h-5 text-gray-700 dark:text-gray-300",fill:"currentColor",viewBox:"0 0 24 24",children:e("path",{"fill-rule":"evenodd",d:"M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z","clip-rule":"evenodd"})})}),e("button",{class:"lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md p-2 ml-4","aria-label":"Toggle sidebar",onClick:()=>{n.sidebarOpen=!n.sidebarOpen},children:e("svg",{class:"w-6 h-6 text-gray-600 dark:text-gray-300",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",xmlns:"http://www.w3.org/2000/svg",children:e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M4 6h16M4 12h16M4 18h16"})})})]})})]})})})}),Ge=[{text:{en:"Getting Started",ko:"시작하기"},items:[{text:{en:"Introduction",ko:"소개"},link:"/guide/introduction"},{text:{en:"Quick Start",ko:"빠른 시작"},link:"/guide/quick-start"},{text:{en:"GitHub",ko:"GitHub"},link:"https://github.com/superlucky84/state-ref",external:!0},{text:{en:"AI Agent Skills",ko:"AI Agent Skills"},link:"/ai-agent-skills"},{text:{en:"AI Agent Role Add-on",ko:"AI Agent Role Add-on"},link:"/ai-agent-addon"}]},{text:{en:"Core Concepts",ko:"핵심 개념"},items:[{text:{en:"createStore",ko:"createStore"},link:"/guide/create-store"},{text:{en:"Watch Function",ko:"Watch 함수"},link:"/guide/watch"},{text:{en:"Understanding References",ko:"참조 이해하기"},link:"/guide/references"},{text:{en:"StateRefStore",ko:"StateRefStore"},link:"/guide/state-ref-store"},{text:{en:"Subscription",ko:"구독"},link:"/guide/subscription"},{text:{en:"Primitive Types",ko:"원시 타입"},link:"/guide/primitives"}]},{text:{en:"Advanced Usage",ko:"고급 사용법"},items:[{text:{en:"createComputed",ko:"createComputed"},link:"/guide/computed"},{text:{en:"combineWatch",ko:"combineWatch"},link:"/guide/combine-watch"},{text:{en:"Manual Sync (Flux)",ko:"수동 동기화 (Flux)"},link:"/guide/manual-sync"},{text:{en:"batch",ko:"batch"},link:"/guide/batch"}]},{text:{en:"Local Draft",ko:"로컬 draft"},items:[{text:{en:"createDraft",ko:"createDraft"},link:"/guide/draft"},{text:{en:"apply, reset, discard",ko:"apply · reset · discard"},link:"/guide/draft-apply"},{text:{en:"Conflicts",ko:"충돌과 해소"},link:"/guide/draft-conflicts"},{text:{en:"Lifetime",ko:"수명과 정리"},link:"/guide/draft-lifetime"}]},{text:{en:"Server Sync",ko:"서버 동기화"},items:[{text:{en:"createSyncClient",ko:"createSyncClient"},link:"/guide/sync"},{text:{en:"query and resource",ko:"query와 resource"},link:"/guide/sync-query"},{text:{en:"mutation and link",ko:"mutation과 link"},link:"/guide/sync-mutation"},{text:{en:"Edit Lifecycle",ko:"편집의 생애"},link:"/guide/sync-lifecycle"},{text:{en:"display and reactive keys",ko:"표시와 반응형 key"},link:"/guide/sync-view"},{text:{en:"Infinite Queries",ko:"무한 조회"},link:"/guide/sync-infinite"},{text:{en:"Streaming",ko:"스트리밍"},link:"/guide/sync-stream"},{text:{en:"Automatic Refetch",ko:"자동 재조회"},link:"/guide/sync-refetch"},{text:{en:"Persistence and SSR",ko:"영속화와 SSR"},link:"/guide/sync-persistence"},{text:{en:"Observation",ko:"관측"},link:"/guide/sync-observation"},{text:{en:"Form Save Recipe",ko:"폼 저장 레시피"},link:"/guide/sync-form"}]},{text:{en:"Helper Functions",ko:"헬퍼 함수"},items:[{text:{en:"Lens Pattern",ko:"Lens 패턴"},link:"/guide/lens"},{text:{en:"copyable",ko:"copyable"},link:"/guide/copyable"},{text:{en:"cloneDeep",ko:"cloneDeep"},link:"/guide/clone-deep"}]},{text:{en:"Framework Integration",ko:"프레임워크 연동"},items:[{text:{en:"React",ko:"React"},link:"/guide/react"},{text:{en:"Preact",ko:"Preact"},link:"/guide/preact"},{text:{en:"Vue",ko:"Vue"},link:"/guide/vue"},{text:{en:"Svelte",ko:"Svelte"},link:"/guide/svelte"},{text:{en:"Solid",ko:"Solid"},link:"/guide/solid"},{text:{en:"Lithent",ko:"Lithent"},link:"/guide/lithent"},{text:{en:"Custom Connector",ko:"커스텀 커넥터"},link:"/guide/custom-connector"}]},{text:{en:"API Reference",ko:"API 레퍼런스"},items:[{text:{en:"Core API",ko:"코어 API"},link:"/api/core"},{text:{en:"Helper API",ko:"헬퍼 API"},link:"/api/helpers"},{text:{en:"TypeScript Types",ko:"TypeScript 타입"},link:"/api/types"},{text:{en:"Draft API",ko:"Draft API"},link:"/api/draft"},{text:{en:"Sync API",ko:"Sync API"},link:"/api/sync"},{text:{en:"Plugin API",ko:"Plugin API"},link:"/api/plugin"}]}],Qe=r=>r.replace(/\/+$/,"")||"/",Hn=u(r=>{const n=Be.watch(r),c=Object.fromEntries(Ge.map(o=>[o.text.en,!1]));let a="";const i=o=>{const l=n.route.startsWith("/ko")?"ko":"en";Ke(we(o,l))},s=o=>{c[o]=!c[o],r()};return()=>{const o=n.route!==a,l=Qe(n.route),d=n.route.startsWith("/ko")?"ko":"en",y=R=>Qe(we(R,d));o&&(l==="/"||l==="/ko")&&Ge.forEach(R=>{c[R.text.en]=!1});const w=e(je,{children:[n.sidebarOpen&&e("div",{class:"fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden",onClick:()=>{n.sidebarOpen=!1}}),e("aside",{class:`
            fixed lg:sticky top-16 left-0 z-40
            w-64 h-[calc(100vh-4rem)] flex-shrink-0
            bg-white dark:bg-[#1b1b1f]
            border-r border-gray-200 dark:border-gray-800
            overflow-y-auto
            transition-transform duration-300
            ${n.sidebarOpen?"translate-x-0":"-translate-x-full lg:translate-x-0"}
          `,children:e("nav",{class:"pl-6 md:pl-12 pr-3 md:pr-4 py-6",children:Ge.map(R=>{const k=R.text.en;o&&l!=="/"&&l!=="/ko"&&R.items.some(A=>A.external?!1:y(A.link)===l)&&(c[k]=!0);const T=c[k];return e("div",{class:"mb-3",children:[e("button",{class:"mb-1 w-full flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider",onClick:()=>s(k),children:[e("span",{children:R.text[d]}),e("span",{class:"text-base leading-none",children:T?"▾":"▸"})]}),e("ul",{class:`
                      space-y-0 overflow-hidden transition-all duration-200 ease-in-out
                      ${T?"max-h-[800px] opacity-100":"max-h-0 opacity-0 pointer-events-none"}
                    `,"aria-hidden":!T,children:R.items.map(E=>{const A=E.external,O=A?E.link:we(E.link,d),z=A?!1:l===Qe(O);return e("li",{children:e("a",{href:O,target:A?"_blank":void 0,rel:A?"noreferrer":void 0,onClick:A?void 0:D=>{D.preventDefault(),i(E.link)},class:`
                              block px-2 py-1.5 rounded-md text-sm font-normal transition-colors
                              ${z?"text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20":"text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800"}
                            `,children:E.text[d]})})})})]})})})})]});return a=n.route,w}}),Gn=[{title:"Getting Started",description:"Learn the basics of StateRef",icon:"🚀",theme:{gradient:"from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",borderColor:"border-blue-200 dark:border-blue-800",hoverBorder:"hover:border-blue-400 dark:hover:border-blue-600",tagBg:"bg-blue-100 dark:bg-blue-900/40",tagHover:"hover:bg-blue-200 dark:hover:bg-blue-800/60",textColor:"text-blue-900 dark:text-blue-100"},items:[{text:"Introduction",link:"/guide/introduction"},{text:"Quick Start",link:"/guide/quick-start"}]},{title:"Core Concepts",description:"Understand the fundamental concepts",icon:"⚡",theme:{gradient:"from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",borderColor:"border-green-200 dark:border-green-800",hoverBorder:"hover:border-green-400 dark:hover:border-green-600",tagBg:"bg-green-100 dark:bg-green-900/40",tagHover:"hover:bg-green-200 dark:hover:bg-green-800/60",textColor:"text-green-900 dark:text-green-100"},items:[{text:"createStore",link:"/guide/create-store"},{text:"Watch Function",link:"/guide/watch"},{text:"Lens Pattern",link:"/guide/lens"}]},{title:"Helper Functions",description:"Powerful utilities for state management",icon:"🔧",theme:{gradient:"from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",borderColor:"border-purple-200 dark:border-purple-800",hoverBorder:"hover:border-purple-400 dark:hover:border-purple-600",tagBg:"bg-purple-100 dark:bg-purple-900/40",tagHover:"hover:bg-purple-200 dark:hover:bg-purple-800/60",textColor:"text-purple-900 dark:text-purple-100"},items:[{text:"copyable",link:"/guide/copyable"},{text:"createComputed",link:"/guide/computed"},{text:"combineWatch",link:"/guide/combine-watch"}]},{title:"Framework Integration",description:"Connect with your favorite UI framework",icon:"🔗",theme:{gradient:"from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20",borderColor:"border-orange-200 dark:border-orange-800",hoverBorder:"hover:border-orange-400 dark:hover:border-orange-600",tagBg:"bg-orange-100 dark:bg-orange-900/40",tagHover:"hover:bg-orange-200 dark:hover:bg-orange-800/60",textColor:"text-orange-900 dark:text-orange-100"},items:[{text:"React",link:"/guide/react"},{text:"Vue",link:"/guide/vue"},{text:"Svelte",link:"/guide/svelte"},{text:"Solid",link:"/guide/solid"}]}],Qn=u(r=>{const n=c=>{Ke(c)};return()=>e("div",{children:[e("div",{class:"mb-12",children:[e("h1",{class:"text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4",children:"StateRef Documentation"}),e("p",{class:"text-lg text-gray-600 dark:text-gray-400 mb-6",children:"Universal state management library focused on data immutability"}),e("p",{class:"text-base text-gray-600 dark:text-gray-400",children:"StateRef combines proxies and the functional programming lens pattern to efficiently and safely access and modify deeply structured data."})]}),e("div",{class:"mb-12 grid gap-4 md:grid-cols-2",children:[e("div",{class:"p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10",children:[e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"🎯 Fine-grained Reactivity"}),e("p",{class:"text-sm text-gray-600 dark:text-gray-400",children:"Proxy-based tracking ensures only the components that need to update will re-render"})]}),e("div",{class:"p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10",children:[e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"🔒 Immutable by Default"}),e("p",{class:"text-sm text-gray-600 dark:text-gray-400",children:"Copy-on-write pattern ensures safe state updates without mutations"})]}),e("div",{class:"p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10",children:[e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"🔌 Framework Agnostic"}),e("p",{class:"text-sm text-gray-600 dark:text-gray-400",children:"Easy integration with React, Vue, Svelte, Solid, and more"})]}),e("div",{class:"p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10",children:[e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"📦 Lightweight"}),e("p",{class:"text-sm text-gray-600 dark:text-gray-400",children:"Small bundle size with zero dependencies"})]})]}),e("div",{class:"space-y-6",children:Gn.map(c=>e("div",{class:`bg-gradient-to-r ${c.theme.gradient} rounded-lg border ${c.theme.borderColor} ${c.theme.hoverBorder} p-6 transition-all hover:shadow-xl`,children:[e("div",{class:"flex items-start gap-4 mb-4",children:[e("span",{class:"text-4xl flex-shrink-0",children:c.icon}),e("div",{class:"flex-1",children:[e("h2",{class:`text-2xl font-bold ${c.theme.textColor} mb-2`,children:c.title}),e("p",{class:"text-sm text-gray-700 dark:text-gray-300",children:c.description})]})]}),e("div",{class:"flex flex-wrap gap-2",children:c.items.map(a=>e("a",{href:a.link,onClick:i=>{i.preventDefault(),n(a.link)},class:`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${c.theme.tagBg} ${c.theme.tagHover} ${c.theme.textColor} transition-all hover:shadow-md`,children:a.text},a.link))})]},c.title))})]})}),Yn=[{title:"시작하기",description:"StateRef의 기본을 배워보세요",icon:"🚀",theme:{gradient:"from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",borderColor:"border-blue-200 dark:border-blue-800",hoverBorder:"hover:border-blue-400 dark:hover:border-blue-600",tagBg:"bg-blue-100 dark:bg-blue-900/40",tagHover:"hover:bg-blue-200 dark:hover:bg-blue-800/60",textColor:"text-blue-900 dark:text-blue-100"},items:[{text:"소개",link:"/guide/introduction"},{text:"빠른 시작",link:"/guide/quick-start"}]},{title:"핵심 개념",description:"기본 개념을 이해해보세요",icon:"⚡",theme:{gradient:"from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",borderColor:"border-green-200 dark:border-green-800",hoverBorder:"hover:border-green-400 dark:hover:border-green-600",tagBg:"bg-green-100 dark:bg-green-900/40",tagHover:"hover:bg-green-200 dark:hover:bg-green-800/60",textColor:"text-green-900 dark:text-green-100"},items:[{text:"createStore",link:"/guide/create-store"},{text:"Watch 함수",link:"/guide/watch"},{text:"Lens 패턴",link:"/guide/lens"}]},{title:"헬퍼 함수",description:"강력한 상태 관리 유틸리티",icon:"🔧",theme:{gradient:"from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",borderColor:"border-purple-200 dark:border-purple-800",hoverBorder:"hover:border-purple-400 dark:hover:border-purple-600",tagBg:"bg-purple-100 dark:bg-purple-900/40",tagHover:"hover:bg-purple-200 dark:hover:bg-purple-800/60",textColor:"text-purple-900 dark:text-purple-100"},items:[{text:"copyable",link:"/guide/copyable"},{text:"createComputed",link:"/guide/computed"},{text:"combineWatch",link:"/guide/combine-watch"}]},{title:"프레임워크 연동",description:"좋아하는 UI 프레임워크와 연결하세요",icon:"🔗",theme:{gradient:"from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20",borderColor:"border-orange-200 dark:border-orange-800",hoverBorder:"hover:border-orange-400 dark:hover:border-orange-600",tagBg:"bg-orange-100 dark:bg-orange-900/40",tagHover:"hover:bg-orange-200 dark:hover:bg-orange-800/60",textColor:"text-orange-900 dark:text-orange-100"},items:[{text:"React",link:"/guide/react"},{text:"Vue",link:"/guide/vue"},{text:"Svelte",link:"/guide/svelte"},{text:"Solid",link:"/guide/solid"}]}],Zn=u(()=>{const r=n=>{Ke(n)};return()=>e("div",{children:[e("div",{class:"mb-12",children:[e("h1",{class:"text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4",children:"StateRef 문서"}),e("p",{class:"text-lg text-gray-600 dark:text-gray-400 mb-6",children:"데이터 불변성에 초점을 맞춘 범용 상태 관리 라이브러리"}),e("p",{class:"text-base text-gray-600 dark:text-gray-400",children:"StateRef는 프록시와 함수형 프로그래밍 렌즈 패턴을 결합하여 깊게 중첩된 데이터를 효율적이고 안전하게 접근하고 수정합니다."})]}),e("div",{class:"mb-12 grid gap-4 md:grid-cols-2",children:[e("div",{class:"p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10",children:[e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"🎯 세밀한 반응성"}),e("p",{class:"text-sm text-gray-600 dark:text-gray-400",children:"프록시 기반 추적으로 업데이트가 필요한 컴포넌트만 다시 렌더링됩니다"})]}),e("div",{class:"p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10",children:[e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"🔒 기본 불변성"}),e("p",{class:"text-sm text-gray-600 dark:text-gray-400",children:"Copy-on-write 패턴으로 변경 없이 안전한 상태 업데이트를 보장합니다"})]}),e("div",{class:"p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10",children:[e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"🔌 프레임워크 독립적"}),e("p",{class:"text-sm text-gray-600 dark:text-gray-400",children:"React, Vue, Svelte, Solid 등과 쉽게 통합됩니다"})]}),e("div",{class:"p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10",children:[e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"📦 경량"}),e("p",{class:"text-sm text-gray-600 dark:text-gray-400",children:"의존성 없이 작은 번들 크기를 유지합니다"})]})]}),e("div",{class:"space-y-6",children:Yn.map(n=>e("div",{class:`bg-gradient-to-r ${n.theme.gradient} rounded-lg border ${n.theme.borderColor} ${n.theme.hoverBorder} p-6 transition-all hover:shadow-xl`,children:[e("div",{class:"flex items-start gap-4 mb-4",children:[e("span",{class:"text-4xl flex-shrink-0",children:n.icon}),e("div",{class:"flex-1",children:[e("h2",{class:`text-2xl font-bold ${n.theme.textColor} mb-2`,children:n.title}),e("p",{class:"text-sm text-gray-700 dark:text-gray-300",children:n.description})]})]}),e("div",{class:"flex flex-wrap gap-2",children:n.items.map(c=>e("a",{href:c.link,onClick:a=>{a.preventDefault(),r(c.link)},class:`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${n.theme.tagBg} ${n.theme.tagHover} ${n.theme.textColor} transition-all hover:shadow-md`,children:c.text},c.link))})]},n.title))})]})});function Xn(r){return r&&r.__esModule&&Object.prototype.hasOwnProperty.call(r,"default")?r.default:r}function nr(r){return r instanceof Map?r.clear=r.delete=r.set=function(){throw new Error("map is read-only")}:r instanceof Set&&(r.add=r.clear=r.delete=function(){throw new Error("set is read-only")}),Object.freeze(r),Object.getOwnPropertyNames(r).forEach(n=>{const c=r[n],a=typeof c;(a==="object"||a==="function")&&!Object.isFrozen(c)&&nr(c)}),r}class Tt{constructor(n){n.data===void 0&&(n.data={}),this.data=n.data,this.isMatchIgnored=!1}ignoreMatch(){this.isMatchIgnored=!0}}function cr(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;")}function X(r,...n){const c=Object.create(null);for(const a in r)c[a]=r[a];return n.forEach(function(a){for(const i in a)c[i]=a[i]}),c}const ec="</span>",At=r=>!!r.scope,tc=(r,{prefix:n})=>{if(r.startsWith("language:"))return r.replace("language:","language-");if(r.includes(".")){const c=r.split(".");return[`${n}${c.shift()}`,...c.map((a,i)=>`${a}${"_".repeat(i+1)}`)].join(" ")}return`${n}${r}`};class rc{constructor(n,c){this.buffer="",this.classPrefix=c.classPrefix,n.walk(this)}addText(n){this.buffer+=cr(n)}openNode(n){if(!At(n))return;const c=tc(n.scope,{prefix:this.classPrefix});this.span(c)}closeNode(n){At(n)&&(this.buffer+=ec)}value(){return this.buffer}span(n){this.buffer+=`<span class="${n}">`}}const Wt=(r={})=>{const n={children:[]};return Object.assign(n,r),n};class ot{constructor(){this.rootNode=Wt(),this.stack=[this.rootNode]}get top(){return this.stack[this.stack.length-1]}get root(){return this.rootNode}add(n){this.top.children.push(n)}openNode(n){const c=Wt({scope:n});this.add(c),this.stack.push(c)}closeNode(){if(this.stack.length>1)return this.stack.pop()}closeAllNodes(){for(;this.closeNode(););}toJSON(){return JSON.stringify(this.rootNode,null,4)}walk(n){return this.constructor._walk(n,this.rootNode)}static _walk(n,c){return typeof c=="string"?n.addText(c):c.children&&(n.openNode(c),c.children.forEach(a=>this._walk(n,a)),n.closeNode(c)),n}static _collapse(n){typeof n!="string"&&n.children&&(n.children.every(c=>typeof c=="string")?n.children=[n.children.join("")]:n.children.forEach(c=>{ot._collapse(c)}))}}class nc extends ot{constructor(n){super(),this.options=n}addText(n){n!==""&&this.add(n)}startScope(n){this.openNode(n)}endScope(){this.closeNode()}__addSublanguage(n,c){const a=n.root;c&&(a.scope=`language:${c}`),this.add(a)}toHTML(){return new rc(this,this.options).value()}finalize(){return this.closeAllNodes(),!0}}function ke(r){return r?typeof r=="string"?r:r.source:null}function ar(r){return ne("(?=",r,")")}function cc(r){return ne("(?:",r,")*")}function ac(r){return ne("(?:",r,")?")}function ne(...r){return r.map(c=>ke(c)).join("")}function ic(r){const n=r[r.length-1];return typeof n=="object"&&n.constructor===Object?(r.splice(r.length-1,1),n):{}}function st(...r){return"("+(ic(r).capture?"":"?:")+r.map(a=>ke(a)).join("|")+")"}function ir(r){return new RegExp(r.toString()+"|").exec("").length-1}function oc(r,n){const c=r&&r.exec(n);return c&&c.index===0}const sc=/\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;function lt(r,{joinWith:n}){let c=0;return r.map(a=>{c+=1;const i=c;let s=ke(a),o="";for(;s.length>0;){const l=sc.exec(s);if(!l){o+=s;break}o+=s.substring(0,l.index),s=s.substring(l.index+l[0].length),l[0][0]==="\\"&&l[1]?o+="\\"+String(Number(l[1])+i):(o+=l[0],l[0]==="("&&c++)}return o}).map(a=>`(${a})`).join(n)}const lc=/\b\B/,or="[a-zA-Z]\\w*",dt="[a-zA-Z_]\\w*",sr="\\b\\d+(\\.\\d+)?",lr="(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)",dr="\\b(0b[01]+)",dc="!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~",hc=(r={})=>{const n=/^#![ ]*\//;return r.binary&&(r.begin=ne(n,/.*\b/,r.binary,/\b.*/)),X({scope:"meta",begin:n,end:/$/,relevance:0,"on:begin":(c,a)=>{c.index!==0&&a.ignoreMatch()}},r)},Re={begin:"\\\\[\\s\\S]",relevance:0},uc={scope:"string",begin:"'",end:"'",illegal:"\\n",contains:[Re]},pc={scope:"string",begin:'"',end:'"',illegal:"\\n",contains:[Re]},gc={begin:/\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/},$e=function(r,n,c={}){const a=X({scope:"comment",begin:r,end:n,contains:[]},c);a.contains.push({scope:"doctag",begin:"[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",end:/(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,excludeBegin:!0,relevance:0});const i=st("I","a","is","so","us","to","at","if","in","it","on",/[A-Za-z]+['](d|ve|re|ll|t|s|n)/,/[A-Za-z]+[-][a-z]+/,/[A-Za-z][a-z]{2,}/);return a.contains.push({begin:ne(/[ ]+/,"(",i,/[.]?[:]?([.][ ]|[ ])/,"){3}")}),a},fc=$e("//","$"),mc=$e("/\\*","\\*/"),yc=$e("#","$"),bc={scope:"number",begin:sr,relevance:0},vc={scope:"number",begin:lr,relevance:0},wc={scope:"number",begin:dr,relevance:0},Sc={scope:"regexp",begin:/\/(?=[^/\n]*\/)/,end:/\/[gimuy]*/,contains:[Re,{begin:/\[/,end:/\]/,relevance:0,contains:[Re]}]},kc={scope:"title",begin:or,relevance:0},Rc={scope:"title",begin:dt,relevance:0},xc={begin:"\\.\\s*"+dt,relevance:0},Cc=function(r){return Object.assign(r,{"on:begin":(n,c)=>{c.data._beginMatch=n[1]},"on:end":(n,c)=>{c.data._beginMatch!==n[1]&&c.ignoreMatch()}})};var We=Object.freeze({__proto__:null,APOS_STRING_MODE:uc,BACKSLASH_ESCAPE:Re,BINARY_NUMBER_MODE:wc,BINARY_NUMBER_RE:dr,COMMENT:$e,C_BLOCK_COMMENT_MODE:mc,C_LINE_COMMENT_MODE:fc,C_NUMBER_MODE:vc,C_NUMBER_RE:lr,END_SAME_AS_BEGIN:Cc,HASH_COMMENT_MODE:yc,IDENT_RE:or,MATCH_NOTHING_RE:lc,METHOD_GUARD:xc,NUMBER_MODE:bc,NUMBER_RE:sr,PHRASAL_WORDS_MODE:gc,QUOTE_STRING_MODE:pc,REGEXP_MODE:Sc,RE_STARTERS_RE:dc,SHEBANG:hc,TITLE_MODE:kc,UNDERSCORE_IDENT_RE:dt,UNDERSCORE_TITLE_MODE:Rc});function Tc(r,n){r.input[r.index-1]==="."&&n.ignoreMatch()}function Ac(r,n){r.className!==void 0&&(r.scope=r.className,delete r.className)}function Wc(r,n){n&&r.beginKeywords&&(r.begin="\\b("+r.beginKeywords.split(" ").join("|")+")(?!\\.)(?=\\b|\\s)",r.__beforeBegin=Tc,r.keywords=r.keywords||r.beginKeywords,delete r.beginKeywords,r.relevance===void 0&&(r.relevance=0))}function Ec(r,n){Array.isArray(r.illegal)&&(r.illegal=st(...r.illegal))}function Ic(r,n){if(r.match){if(r.begin||r.end)throw new Error("begin & end are not supported with match");r.begin=r.match,delete r.match}}function Pc(r,n){r.relevance===void 0&&(r.relevance=1)}const Dc=(r,n)=>{if(!r.beforeMatch)return;if(r.starts)throw new Error("beforeMatch cannot be used with starts");const c=Object.assign({},r);Object.keys(r).forEach(a=>{delete r[a]}),r.keywords=c.keywords,r.begin=ne(c.beforeMatch,ar(c.begin)),r.starts={relevance:0,contains:[Object.assign(c,{endsParent:!0})]},r.relevance=0,delete c.beforeMatch},Nc=["of","and","for","in","not","or","if","then","parent","list","value"],Mc="keyword";function hr(r,n,c=Mc){const a=Object.create(null);return typeof r=="string"?i(c,r.split(" ")):Array.isArray(r)?i(c,r):Object.keys(r).forEach(function(s){Object.assign(a,hr(r[s],n,s))}),a;function i(s,o){n&&(o=o.map(l=>l.toLowerCase())),o.forEach(function(l){const d=l.split("|");a[d[0]]=[s,Oc(d[0],d[1])]})}}function Oc(r,n){return n?Number(n):Lc(r)?0:1}function Lc(r){return Nc.includes(r.toLowerCase())}const Et={},re=r=>{console.error(r)},It=(r,...n)=>{console.log(`WARN: ${r}`,...n)},ie=(r,n)=>{Et[`${r}/${n}`]||(console.log(`Deprecated as of ${r}. ${n}`),Et[`${r}/${n}`]=!0)},De=new Error;function ur(r,n,{key:c}){let a=0;const i=r[c],s={},o={};for(let l=1;l<=n.length;l++)o[l+a]=i[l],s[l+a]=!0,a+=ir(n[l-1]);r[c]=o,r[c]._emit=s,r[c]._multi=!0}function Fc(r){if(Array.isArray(r.begin)){if(r.skip||r.excludeBegin||r.returnBegin)throw re("skip, excludeBegin, returnBegin not compatible with beginScope: {}"),De;if(typeof r.beginScope!="object"||r.beginScope===null)throw re("beginScope must be object"),De;ur(r,r.begin,{key:"beginScope"}),r.begin=lt(r.begin,{joinWith:""})}}function Uc(r){if(Array.isArray(r.end)){if(r.skip||r.excludeEnd||r.returnEnd)throw re("skip, excludeEnd, returnEnd not compatible with endScope: {}"),De;if(typeof r.endScope!="object"||r.endScope===null)throw re("endScope must be object"),De;ur(r,r.end,{key:"endScope"}),r.end=lt(r.end,{joinWith:""})}}function qc(r){r.scope&&typeof r.scope=="object"&&r.scope!==null&&(r.beginScope=r.scope,delete r.scope)}function _c(r){qc(r),typeof r.beginScope=="string"&&(r.beginScope={_wrap:r.beginScope}),typeof r.endScope=="string"&&(r.endScope={_wrap:r.endScope}),Fc(r),Uc(r)}function Vc(r){function n(o,l){return new RegExp(ke(o),"m"+(r.case_insensitive?"i":"")+(r.unicodeRegex?"u":"")+(l?"g":""))}class c{constructor(){this.matchIndexes={},this.regexes=[],this.matchAt=1,this.position=0}addRule(l,d){d.position=this.position++,this.matchIndexes[this.matchAt]=d,this.regexes.push([d,l]),this.matchAt+=ir(l)+1}compile(){this.regexes.length===0&&(this.exec=()=>null);const l=this.regexes.map(d=>d[1]);this.matcherRe=n(lt(l,{joinWith:"|"}),!0),this.lastIndex=0}exec(l){this.matcherRe.lastIndex=this.lastIndex;const d=this.matcherRe.exec(l);if(!d)return null;const y=d.findIndex((R,k)=>k>0&&R!==void 0),w=this.matchIndexes[y];return d.splice(0,y),Object.assign(d,w)}}class a{constructor(){this.rules=[],this.multiRegexes=[],this.count=0,this.lastIndex=0,this.regexIndex=0}getMatcher(l){if(this.multiRegexes[l])return this.multiRegexes[l];const d=new c;return this.rules.slice(l).forEach(([y,w])=>d.addRule(y,w)),d.compile(),this.multiRegexes[l]=d,d}resumingScanAtSamePosition(){return this.regexIndex!==0}considerAll(){this.regexIndex=0}addRule(l,d){this.rules.push([l,d]),d.type==="begin"&&this.count++}exec(l){const d=this.getMatcher(this.regexIndex);d.lastIndex=this.lastIndex;let y=d.exec(l);if(this.resumingScanAtSamePosition()&&!(y&&y.index===this.lastIndex)){const w=this.getMatcher(0);w.lastIndex=this.lastIndex+1,y=w.exec(l)}return y&&(this.regexIndex+=y.position+1,this.regexIndex===this.count&&this.considerAll()),y}}function i(o){const l=new a;return o.contains.forEach(d=>l.addRule(d.begin,{rule:d,type:"begin"})),o.terminatorEnd&&l.addRule(o.terminatorEnd,{type:"end"}),o.illegal&&l.addRule(o.illegal,{type:"illegal"}),l}function s(o,l){const d=o;if(o.isCompiled)return d;[Ac,Ic,_c,Dc].forEach(w=>w(o,l)),r.compilerExtensions.forEach(w=>w(o,l)),o.__beforeBegin=null,[Wc,Ec,Pc].forEach(w=>w(o,l)),o.isCompiled=!0;let y=null;return typeof o.keywords=="object"&&o.keywords.$pattern&&(o.keywords=Object.assign({},o.keywords),y=o.keywords.$pattern,delete o.keywords.$pattern),y=y||/\w+/,o.keywords&&(o.keywords=hr(o.keywords,r.case_insensitive)),d.keywordPatternRe=n(y,!0),l&&(o.begin||(o.begin=/\B|\b/),d.beginRe=n(d.begin),!o.end&&!o.endsWithParent&&(o.end=/\B|\b/),o.end&&(d.endRe=n(d.end)),d.terminatorEnd=ke(d.end)||"",o.endsWithParent&&l.terminatorEnd&&(d.terminatorEnd+=(o.end?"|":"")+l.terminatorEnd)),o.illegal&&(d.illegalRe=n(o.illegal)),o.contains||(o.contains=[]),o.contains=[].concat(...o.contains.map(function(w){return jc(w==="self"?o:w)})),o.contains.forEach(function(w){s(w,d)}),o.starts&&s(o.starts,l),d.matcher=i(d),d}if(r.compilerExtensions||(r.compilerExtensions=[]),r.contains&&r.contains.includes("self"))throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");return r.classNameAliases=X(r.classNameAliases||{}),s(r)}function pr(r){return r?r.endsWithParent||pr(r.starts):!1}function jc(r){return r.variants&&!r.cachedVariants&&(r.cachedVariants=r.variants.map(function(n){return X(r,{variants:null},n)})),r.cachedVariants?r.cachedVariants:pr(r)?X(r,{starts:r.starts?X(r.starts):null}):Object.isFrozen(r)?X(r):r}var Bc="11.11.1";class Kc extends Error{constructor(n,c){super(n),this.name="HTMLInjectionError",this.html=c}}const Ye=cr,Pt=X,Dt=Symbol("nomatch"),$c=7,gr=function(r){const n=Object.create(null),c=Object.create(null),a=[];let i=!0;const s="Could not find the language '{}', did you forget to load/include a language module?",o={disableAutodetect:!0,name:"Plain text",contains:[]};let l={ignoreUnescapedHTML:!1,throwUnescapedHTML:!1,noHighlightRe:/^(no-?highlight)$/i,languageDetectRe:/\blang(?:uage)?-([\w-]+)\b/i,classPrefix:"hljs-",cssSelector:"pre code",languages:null,__emitter:nc};function d(h){return l.noHighlightRe.test(h)}function y(h){let f=h.className+" ";f+=h.parentNode?h.parentNode.className:"";const g=l.languageDetectRe.exec(f);if(g){const v=L(g[1]);return v||(It(s.replace("{}",g[1])),It("Falling back to no-highlight mode for this block.",h)),v?g[1]:"no-highlight"}return f.split(/\s+/).find(v=>d(v)||L(v))}function w(h,f,g){let v="",x="";typeof f=="object"?(v=h,g=f.ignoreIllegals,x=f.language):(ie("10.7.0","highlight(lang, code, ...args) has been deprecated."),ie("10.7.0",`Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`),x=h,v=f),g===void 0&&(g=!0);const I={code:v,language:x};Y("before:highlight",I);const N=I.result?I.result:R(I.language,I.code,g);return N.code=I.code,Y("after:highlight",N),N}function R(h,f,g,v){const x=Object.create(null);function I(p,m){return p.keywords[m]}function N(){if(!b.keywords){P.addText(W);return}let p=0;b.keywordPatternRe.lastIndex=0;let m=b.keywordPatternRe.exec(W),S="";for(;m;){S+=W.substring(p,m.index);const C=J.case_insensitive?m[0].toLowerCase():m[0],M=I(b,C);if(M){const[H,Pr]=M;if(P.addText(S),S="",x[C]=(x[C]||0)+1,x[C]<=$c&&(Te+=Pr),H.startsWith("_"))S+=m[0];else{const Dr=J.classNameAliases[H]||H;$(m[0],Dr)}}else S+=m[0];p=b.keywordPatternRe.lastIndex,m=b.keywordPatternRe.exec(W)}S+=W.substring(p),P.addText(S)}function K(){if(W==="")return;let p=null;if(typeof b.subLanguage=="string"){if(!n[b.subLanguage]){P.addText(W);return}p=R(b.subLanguage,W,!0,yt[b.subLanguage]),yt[b.subLanguage]=p._top}else p=T(W,b.subLanguage.length?b.subLanguage:null);b.relevance>0&&(Te+=p.relevance),P.__addSublanguage(p._emitter,p.language)}function U(){b.subLanguage!=null?K():N(),W=""}function $(p,m){p!==""&&(P.startScope(m),P.addText(p),P.endScope())}function pt(p,m){let S=1;const C=m.length-1;for(;S<=C;){if(!p._emit[S]){S++;continue}const M=J.classNameAliases[p[S]]||p[S],H=m[S];M?$(H,M):(W=H,N(),W=""),S++}}function gt(p,m){return p.scope&&typeof p.scope=="string"&&P.openNode(J.classNameAliases[p.scope]||p.scope),p.beginScope&&(p.beginScope._wrap?($(W,J.classNameAliases[p.beginScope._wrap]||p.beginScope._wrap),W=""):p.beginScope._multi&&(pt(p.beginScope,m),W="")),b=Object.create(p,{parent:{value:b}}),b}function ft(p,m,S){let C=oc(p.endRe,S);if(C){if(p["on:end"]){const M=new Tt(p);p["on:end"](m,M),M.isMatchIgnored&&(C=!1)}if(C){for(;p.endsParent&&p.parent;)p=p.parent;return p}}if(p.endsWithParent)return ft(p.parent,m,S)}function Tr(p){return b.matcher.regexIndex===0?(W+=p[0],1):(He=!0,0)}function Ar(p){const m=p[0],S=p.rule,C=new Tt(S),M=[S.__beforeBegin,S["on:begin"]];for(const H of M)if(H&&(H(p,C),C.isMatchIgnored))return Tr(m);return S.skip?W+=m:(S.excludeBegin&&(W+=m),U(),!S.returnBegin&&!S.excludeBegin&&(W=m)),gt(S,p),S.returnBegin?0:m.length}function Wr(p){const m=p[0],S=f.substring(p.index),C=ft(b,p,S);if(!C)return Dt;const M=b;b.endScope&&b.endScope._wrap?(U(),$(m,b.endScope._wrap)):b.endScope&&b.endScope._multi?(U(),pt(b.endScope,p)):M.skip?W+=m:(M.returnEnd||M.excludeEnd||(W+=m),U(),M.excludeEnd&&(W=m));do b.scope&&P.closeNode(),!b.skip&&!b.subLanguage&&(Te+=b.relevance),b=b.parent;while(b!==C.parent);return C.starts&&gt(C.starts,p),M.returnEnd?0:m.length}function Er(){const p=[];for(let m=b;m!==J;m=m.parent)m.scope&&p.unshift(m.scope);p.forEach(m=>P.openNode(m))}let Ce={};function mt(p,m){const S=m&&m[0];if(W+=p,S==null)return U(),0;if(Ce.type==="begin"&&m.type==="end"&&Ce.index===m.index&&S===""){if(W+=f.slice(m.index,m.index+1),!i){const C=new Error(`0 width match regex (${h})`);throw C.languageName=h,C.badRule=Ce.rule,C}return 1}if(Ce=m,m.type==="begin")return Ar(m);if(m.type==="illegal"&&!g){const C=new Error('Illegal lexeme "'+S+'" for mode "'+(b.scope||"<unnamed>")+'"');throw C.mode=b,C}else if(m.type==="end"){const C=Wr(m);if(C!==Dt)return C}if(m.type==="illegal"&&S==="")return W+=`
`,1;if(ze>1e5&&ze>m.index*3)throw new Error("potential infinite loop, way more iterations than matches");return W+=S,S.length}const J=L(h);if(!J)throw re(s.replace("{}",h)),new Error('Unknown language: "'+h+'"');const Ir=Vc(J);let Je="",b=v||Ir;const yt={},P=new l.__emitter(l);Er();let W="",Te=0,te=0,ze=0,He=!1;try{if(J.__emitTokens)J.__emitTokens(f,P);else{for(b.matcher.considerAll();;){ze++,He?He=!1:b.matcher.considerAll(),b.matcher.lastIndex=te;const p=b.matcher.exec(f);if(!p)break;const m=f.substring(te,p.index),S=mt(m,p);te=p.index+S}mt(f.substring(te))}return P.finalize(),Je=P.toHTML(),{language:h,value:Je,relevance:Te,illegal:!1,_emitter:P,_top:b}}catch(p){if(p.message&&p.message.includes("Illegal"))return{language:h,value:Ye(f),illegal:!0,relevance:0,_illegalBy:{message:p.message,index:te,context:f.slice(te-100,te+100),mode:p.mode,resultSoFar:Je},_emitter:P};if(i)return{language:h,value:Ye(f),illegal:!1,relevance:0,errorRaised:p,_emitter:P,_top:b};throw p}}function k(h){const f={value:Ye(h),illegal:!1,relevance:0,_top:o,_emitter:new l.__emitter(l)};return f._emitter.addText(h),f}function T(h,f){f=f||l.languages||Object.keys(n);const g=k(h),v=f.filter(L).filter(ae).map(U=>R(U,h,!1));v.unshift(g);const x=v.sort((U,$)=>{if(U.relevance!==$.relevance)return $.relevance-U.relevance;if(U.language&&$.language){if(L(U.language).supersetOf===$.language)return 1;if(L($.language).supersetOf===U.language)return-1}return 0}),[I,N]=x,K=I;return K.secondBest=N,K}function E(h,f,g){const v=f&&c[f]||g;h.classList.add("hljs"),h.classList.add(`language-${v}`)}function A(h){let f=null;const g=y(h);if(d(g))return;if(Y("before:highlightElement",{el:h,language:g}),h.dataset.highlighted){console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.",h);return}if(h.children.length>0&&(l.ignoreUnescapedHTML||(console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."),console.warn("https://github.com/highlightjs/highlight.js/wiki/security"),console.warn("The element with unescaped HTML:"),console.warn(h)),l.throwUnescapedHTML))throw new Kc("One of your code blocks includes unescaped HTML.",h.innerHTML);f=h;const v=f.textContent,x=g?w(v,{language:g,ignoreIllegals:!0}):T(v);h.innerHTML=x.value,h.dataset.highlighted="yes",E(h,g,x.language),h.result={language:x.language,re:x.relevance,relevance:x.relevance},x.secondBest&&(h.secondBest={language:x.secondBest.language,relevance:x.secondBest.relevance}),Y("after:highlightElement",{el:h,result:x,text:v})}function O(h){l=Pt(l,h)}const z=()=>{j(),ie("10.6.0","initHighlighting() deprecated.  Use highlightAll() now.")};function D(){j(),ie("10.6.0","initHighlightingOnLoad() deprecated.  Use highlightAll() now.")}let V=!1;function j(){function h(){j()}if(document.readyState==="loading"){V||window.addEventListener("DOMContentLoaded",h,!1),V=!0;return}document.querySelectorAll(l.cssSelector).forEach(A)}function B(h,f){let g=null;try{g=f(r)}catch(v){if(re("Language definition for '{}' could not be registered.".replace("{}",h)),i)re(v);else throw v;g=o}g.name||(g.name=h),n[h]=g,g.rawDefinition=f.bind(null,r),g.aliases&&ce(g.aliases,{languageName:h})}function F(h){delete n[h];for(const f of Object.keys(c))c[f]===h&&delete c[f]}function pe(){return Object.keys(n)}function L(h){return h=(h||"").toLowerCase(),n[h]||n[c[h]]}function ce(h,{languageName:f}){typeof h=="string"&&(h=[h]),h.forEach(g=>{c[g.toLowerCase()]=f})}function ae(h){const f=L(h);return f&&!f.disableAutodetect}function ge(h){h["before:highlightBlock"]&&!h["before:highlightElement"]&&(h["before:highlightElement"]=f=>{h["before:highlightBlock"](Object.assign({block:f.el},f))}),h["after:highlightBlock"]&&!h["after:highlightElement"]&&(h["after:highlightElement"]=f=>{h["after:highlightBlock"](Object.assign({block:f.el},f))})}function fe(h){ge(h),a.push(h)}function me(h){const f=a.indexOf(h);f!==-1&&a.splice(f,1)}function Y(h,f){const g=h;a.forEach(function(v){v[g]&&v[g](f)})}function ye(h){return ie("10.7.0","highlightBlock will be removed entirely in v12.0"),ie("10.7.0","Please use highlightElement now."),A(h)}Object.assign(r,{highlight:w,highlightAuto:T,highlightAll:j,highlightElement:A,highlightBlock:ye,configure:O,initHighlighting:z,initHighlightingOnLoad:D,registerLanguage:B,unregisterLanguage:F,listLanguages:pe,getLanguage:L,registerAliases:ce,autoDetection:ae,inherit:Pt,addPlugin:fe,removePlugin:me}),r.debugMode=function(){i=!1},r.safeMode=function(){i=!0},r.versionString=Bc,r.regex={concat:ne,lookahead:ar,either:st,optional:ac,anyNumberOfTimes:cc};for(const h in We)typeof We[h]=="object"&&nr(We[h]);return Object.assign(r,We),r},de=gr({});de.newInstance=()=>gr({});var Jc=de;de.HighlightJS=de;de.default=de;const q=Xn(Jc),Ne="[A-Za-z$_][0-9A-Za-z$_]*",fr=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends","using"],mr=["true","false","null","undefined","NaN","Infinity"],yr=["Object","Function","Boolean","Symbol","Math","Date","Number","BigInt","String","RegExp","Array","Float32Array","Float64Array","Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Int32Array","Uint16Array","Uint32Array","BigInt64Array","BigUint64Array","Set","Map","WeakSet","WeakMap","ArrayBuffer","SharedArrayBuffer","Atomics","DataView","JSON","Promise","Generator","GeneratorFunction","AsyncFunction","Reflect","Proxy","Intl","WebAssembly"],br=["Error","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],vr=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],wr=["arguments","this","super","console","window","document","localStorage","sessionStorage","module","global"],Sr=[].concat(vr,yr,br);function zc(r){const n=r.regex,c=(g,{after:v})=>{const x="</"+g[0].slice(1);return g.input.indexOf(x,v)!==-1},a=Ne,i={begin:"<>",end:"</>"},s=/<[A-Za-z0-9\\._:-]+\s*\/>/,o={begin:/<[A-Za-z0-9\\._:-]+/,end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(g,v)=>{const x=g[0].length+g.index,I=g.input[x];if(I==="<"||I===","){v.ignoreMatch();return}I===">"&&(c(g,{after:x})||v.ignoreMatch());let N;const K=g.input.substring(x);if(N=K.match(/^\s*=/)){v.ignoreMatch();return}if((N=K.match(/^\s+extends\s+/))&&N.index===0){v.ignoreMatch();return}}},l={$pattern:Ne,keyword:fr,literal:mr,built_in:Sr,"variable.language":wr},d="[0-9](_?[0-9])*",y=`\\.(${d})`,w="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",R={className:"number",variants:[{begin:`(\\b(${w})((${y})|\\.)?|(${y}))[eE][+-]?(${d})\\b`},{begin:`\\b(${w})\\b((${y})\\b|\\.)?|(${y})\\b`},{begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{begin:"\\b0[0-7]+n?\\b"}],relevance:0},k={className:"subst",begin:"\\$\\{",end:"\\}",keywords:l,contains:[]},T={begin:".?html`",end:"",starts:{end:"`",returnEnd:!1,contains:[r.BACKSLASH_ESCAPE,k],subLanguage:"xml"}},E={begin:".?css`",end:"",starts:{end:"`",returnEnd:!1,contains:[r.BACKSLASH_ESCAPE,k],subLanguage:"css"}},A={begin:".?gql`",end:"",starts:{end:"`",returnEnd:!1,contains:[r.BACKSLASH_ESCAPE,k],subLanguage:"graphql"}},O={className:"string",begin:"`",end:"`",contains:[r.BACKSLASH_ESCAPE,k]},D={className:"comment",variants:[r.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,excludeBegin:!0,relevance:0},{className:"variable",begin:a+"(?=\\s*(-)|$)",endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]}),r.C_BLOCK_COMMENT_MODE,r.C_LINE_COMMENT_MODE]},V=[r.APOS_STRING_MODE,r.QUOTE_STRING_MODE,T,E,A,O,{match:/\$\d+/},R];k.contains=V.concat({begin:/\{/,end:/\}/,keywords:l,contains:["self"].concat(V)});const j=[].concat(D,k.contains),B=j.concat([{begin:/(\s*)\(/,end:/\)/,keywords:l,contains:["self"].concat(j)}]),F={className:"params",begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:l,contains:B},pe={variants:[{match:[/class/,/\s+/,a,/\s+/,/extends/,/\s+/,n.concat(a,"(",n.concat(/\./,a),")*")],scope:{1:"keyword",3:"title.class",5:"keyword",7:"title.class.inherited"}},{match:[/class/,/\s+/,a],scope:{1:"keyword",3:"title.class"}}]},L={relevance:0,match:n.either(/\bJSON/,/\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,/\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,/\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),className:"title.class",keywords:{_:[...yr,...br]}},ce={label:"use_strict",className:"meta",relevance:10,begin:/^\s*['"]use (strict|asm)['"]/},ae={variants:[{match:[/function/,/\s+/,a,/(?=\s*\()/]},{match:[/function/,/\s*(?=\()/]}],className:{1:"keyword",3:"title.function"},label:"func.def",contains:[F],illegal:/%/},ge={relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,className:"variable.constant"};function fe(g){return n.concat("(?!",g.join("|"),")")}const me={match:n.concat(/\b/,fe([...vr,"super","import"].map(g=>`${g}\\s*\\(`)),a,n.lookahead(/\s*\(/)),className:"title.function",relevance:0},Y={begin:n.concat(/\./,n.lookahead(n.concat(a,/(?![0-9A-Za-z$_(])/))),end:a,excludeBegin:!0,keywords:"prototype",className:"property",relevance:0},ye={match:[/get|set/,/\s+/,a,/(?=\()/],className:{1:"keyword",3:"title.function"},contains:[{begin:/\(\)/},F]},h="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+r.UNDERSCORE_IDENT_RE+")\\s*=>",f={match:[/const|var|let/,/\s+/,a,/\s*/,/=\s*/,/(async\s*)?/,n.lookahead(h)],keywords:"async",className:{1:"keyword",3:"title.function"},contains:[F]};return{name:"JavaScript",aliases:["js","jsx","mjs","cjs"],keywords:l,exports:{PARAMS_CONTAINS:B,CLASS_REFERENCE:L},illegal:/#(?![$_A-z])/,contains:[r.SHEBANG({label:"shebang",binary:"node",relevance:5}),ce,r.APOS_STRING_MODE,r.QUOTE_STRING_MODE,T,E,A,O,D,{match:/\$\d+/},R,L,{scope:"attr",match:a+n.lookahead(":"),relevance:0},f,{begin:"("+r.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",keywords:"return throw case",relevance:0,contains:[D,r.REGEXP_MODE,{className:"function",begin:h,returnBegin:!0,end:"\\s*=>",contains:[{className:"params",variants:[{begin:r.UNDERSCORE_IDENT_RE,relevance:0},{className:null,begin:/\(\s*\)/,skip:!0},{begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:l,contains:B}]}]},{begin:/,/,relevance:0},{match:/\s+/,relevance:0},{variants:[{begin:i.begin,end:i.end},{match:s},{begin:o.begin,"on:begin":o.isTrulyOpeningTag,end:o.end}],subLanguage:"xml",contains:[{begin:o.begin,end:o.end,skip:!0,contains:["self"]}]}]},ae,{beginKeywords:"while if switch catch for"},{begin:"\\b(?!function)"+r.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",returnBegin:!0,label:"func.def",contains:[F,r.inherit(r.TITLE_MODE,{begin:a,className:"title.function"})]},{match:/\.\.\./,relevance:0},Y,{match:"\\$"+a,relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},contains:[F]},me,ge,pe,ye,{match:/\$[(.]/}]}}function ht(r){const n=r.regex,c=zc(r),a=Ne,i=["any","void","number","boolean","string","object","never","symbol","bigint","unknown"],s={begin:[/namespace/,/\s+/,r.IDENT_RE],beginScope:{1:"keyword",3:"title.class"}},o={beginKeywords:"interface",end:/\{/,excludeEnd:!0,keywords:{keyword:"interface extends",built_in:i},contains:[c.exports.CLASS_REFERENCE]},l={className:"meta",relevance:10,begin:/^\s*['"]use strict['"]/},d=["type","interface","public","private","protected","implements","declare","abstract","readonly","enum","override","satisfies"],y={$pattern:Ne,keyword:fr.concat(d),literal:mr,built_in:Sr.concat(i),"variable.language":wr},w={className:"meta",begin:"@"+a},R=(A,O,z)=>{const D=A.contains.findIndex(V=>V.label===O);if(D===-1)throw new Error("can not find mode to replace");A.contains.splice(D,1,z)};Object.assign(c.keywords,y),c.exports.PARAMS_CONTAINS.push(w);const k=c.contains.find(A=>A.scope==="attr"),T=Object.assign({},k,{match:n.concat(a,n.lookahead(/\s*\?:/))});c.exports.PARAMS_CONTAINS.push([c.exports.CLASS_REFERENCE,k,T]),c.contains=c.contains.concat([w,s,o,T]),R(c,"shebang",r.SHEBANG()),R(c,"use_strict",l);const E=c.contains.find(A=>A.label==="func.def");return E.relevance=0,Object.assign(c,{name:"TypeScript",aliases:["ts","tsx","mts","cts"]}),c}const Nt="[A-Za-z$_][0-9A-Za-z$_]*",Hc=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends","using"],Gc=["true","false","null","undefined","NaN","Infinity"],kr=["Object","Function","Boolean","Symbol","Math","Date","Number","BigInt","String","RegExp","Array","Float32Array","Float64Array","Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Int32Array","Uint16Array","Uint32Array","BigInt64Array","BigUint64Array","Set","Map","WeakSet","WeakMap","ArrayBuffer","SharedArrayBuffer","Atomics","DataView","JSON","Promise","Generator","GeneratorFunction","AsyncFunction","Reflect","Proxy","Intl","WebAssembly"],Rr=["Error","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],xr=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],Qc=["arguments","this","super","console","window","document","localStorage","sessionStorage","module","global"],Yc=[].concat(xr,kr,Rr);function Cr(r){const n=r.regex,c=(g,{after:v})=>{const x="</"+g[0].slice(1);return g.input.indexOf(x,v)!==-1},a=Nt,i={begin:"<>",end:"</>"},s=/<[A-Za-z0-9\\._:-]+\s*\/>/,o={begin:/<[A-Za-z0-9\\._:-]+/,end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(g,v)=>{const x=g[0].length+g.index,I=g.input[x];if(I==="<"||I===","){v.ignoreMatch();return}I===">"&&(c(g,{after:x})||v.ignoreMatch());let N;const K=g.input.substring(x);if(N=K.match(/^\s*=/)){v.ignoreMatch();return}if((N=K.match(/^\s+extends\s+/))&&N.index===0){v.ignoreMatch();return}}},l={$pattern:Nt,keyword:Hc,literal:Gc,built_in:Yc,"variable.language":Qc},d="[0-9](_?[0-9])*",y=`\\.(${d})`,w="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",R={className:"number",variants:[{begin:`(\\b(${w})((${y})|\\.)?|(${y}))[eE][+-]?(${d})\\b`},{begin:`\\b(${w})\\b((${y})\\b|\\.)?|(${y})\\b`},{begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{begin:"\\b0[0-7]+n?\\b"}],relevance:0},k={className:"subst",begin:"\\$\\{",end:"\\}",keywords:l,contains:[]},T={begin:".?html`",end:"",starts:{end:"`",returnEnd:!1,contains:[r.BACKSLASH_ESCAPE,k],subLanguage:"xml"}},E={begin:".?css`",end:"",starts:{end:"`",returnEnd:!1,contains:[r.BACKSLASH_ESCAPE,k],subLanguage:"css"}},A={begin:".?gql`",end:"",starts:{end:"`",returnEnd:!1,contains:[r.BACKSLASH_ESCAPE,k],subLanguage:"graphql"}},O={className:"string",begin:"`",end:"`",contains:[r.BACKSLASH_ESCAPE,k]},D={className:"comment",variants:[r.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,excludeBegin:!0,relevance:0},{className:"variable",begin:a+"(?=\\s*(-)|$)",endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]}),r.C_BLOCK_COMMENT_MODE,r.C_LINE_COMMENT_MODE]},V=[r.APOS_STRING_MODE,r.QUOTE_STRING_MODE,T,E,A,O,{match:/\$\d+/},R];k.contains=V.concat({begin:/\{/,end:/\}/,keywords:l,contains:["self"].concat(V)});const j=[].concat(D,k.contains),B=j.concat([{begin:/(\s*)\(/,end:/\)/,keywords:l,contains:["self"].concat(j)}]),F={className:"params",begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:l,contains:B},pe={variants:[{match:[/class/,/\s+/,a,/\s+/,/extends/,/\s+/,n.concat(a,"(",n.concat(/\./,a),")*")],scope:{1:"keyword",3:"title.class",5:"keyword",7:"title.class.inherited"}},{match:[/class/,/\s+/,a],scope:{1:"keyword",3:"title.class"}}]},L={relevance:0,match:n.either(/\bJSON/,/\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,/\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,/\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),className:"title.class",keywords:{_:[...kr,...Rr]}},ce={label:"use_strict",className:"meta",relevance:10,begin:/^\s*['"]use (strict|asm)['"]/},ae={variants:[{match:[/function/,/\s+/,a,/(?=\s*\()/]},{match:[/function/,/\s*(?=\()/]}],className:{1:"keyword",3:"title.function"},label:"func.def",contains:[F],illegal:/%/},ge={relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,className:"variable.constant"};function fe(g){return n.concat("(?!",g.join("|"),")")}const me={match:n.concat(/\b/,fe([...xr,"super","import"].map(g=>`${g}\\s*\\(`)),a,n.lookahead(/\s*\(/)),className:"title.function",relevance:0},Y={begin:n.concat(/\./,n.lookahead(n.concat(a,/(?![0-9A-Za-z$_(])/))),end:a,excludeBegin:!0,keywords:"prototype",className:"property",relevance:0},ye={match:[/get|set/,/\s+/,a,/(?=\()/],className:{1:"keyword",3:"title.function"},contains:[{begin:/\(\)/},F]},h="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+r.UNDERSCORE_IDENT_RE+")\\s*=>",f={match:[/const|var|let/,/\s+/,a,/\s*/,/=\s*/,/(async\s*)?/,n.lookahead(h)],keywords:"async",className:{1:"keyword",3:"title.function"},contains:[F]};return{name:"JavaScript",aliases:["js","jsx","mjs","cjs"],keywords:l,exports:{PARAMS_CONTAINS:B,CLASS_REFERENCE:L},illegal:/#(?![$_A-z])/,contains:[r.SHEBANG({label:"shebang",binary:"node",relevance:5}),ce,r.APOS_STRING_MODE,r.QUOTE_STRING_MODE,T,E,A,O,D,{match:/\$\d+/},R,L,{scope:"attr",match:a+n.lookahead(":"),relevance:0},f,{begin:"("+r.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",keywords:"return throw case",relevance:0,contains:[D,r.REGEXP_MODE,{className:"function",begin:h,returnBegin:!0,end:"\\s*=>",contains:[{className:"params",variants:[{begin:r.UNDERSCORE_IDENT_RE,relevance:0},{className:null,begin:/\(\s*\)/,skip:!0},{begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:l,contains:B}]}]},{begin:/,/,relevance:0},{match:/\s+/,relevance:0},{variants:[{begin:i.begin,end:i.end},{match:s},{begin:o.begin,"on:begin":o.isTrulyOpeningTag,end:o.end}],subLanguage:"xml",contains:[{begin:o.begin,end:o.end,skip:!0,contains:["self"]}]}]},ae,{beginKeywords:"while if switch catch for"},{begin:"\\b(?!function)"+r.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",returnBegin:!0,label:"func.def",contains:[F,r.inherit(r.TITLE_MODE,{begin:a,className:"title.function"})]},{match:/\.\.\./,relevance:0},Y,{match:"\\$"+a,relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},contains:[F]},me,ge,pe,ye,{match:/\$[(.]/}]}}function ut(r){const n=r.regex,c=n.concat(/[\p{L}_]/u,n.optional(/[\p{L}0-9_.-]*:/u),/[\p{L}0-9_.-]*/u),a=/[\p{L}0-9._:-]+/u,i={className:"symbol",begin:/&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/},s={begin:/\s/,contains:[{className:"keyword",begin:/#?[a-z_][a-z1-9_-]+/,illegal:/\n/}]},o=r.inherit(s,{begin:/\(/,end:/\)/}),l=r.inherit(r.APOS_STRING_MODE,{className:"string"}),d=r.inherit(r.QUOTE_STRING_MODE,{className:"string"}),y={endsWithParent:!0,illegal:/</,relevance:0,contains:[{className:"attr",begin:a,relevance:0},{begin:/=\s*/,relevance:0,contains:[{className:"string",endsParent:!0,variants:[{begin:/"/,end:/"/,contains:[i]},{begin:/'/,end:/'/,contains:[i]},{begin:/[^\s"'=<>`]+/}]}]}]};return{name:"HTML, XML",aliases:["html","xhtml","rss","atom","xjb","xsd","xsl","plist","wsf","svg"],case_insensitive:!0,unicodeRegex:!0,contains:[{className:"meta",begin:/<![a-z]/,end:/>/,relevance:10,contains:[s,d,l,o,{begin:/\[/,end:/\]/,contains:[{className:"meta",begin:/<![a-z]/,end:/>/,contains:[s,o,d,l]}]}]},r.COMMENT(/<!--/,/-->/,{relevance:10}),{begin:/<!\[CDATA\[/,end:/\]\]>/,relevance:10},i,{className:"meta",end:/\?>/,variants:[{begin:/<\?xml/,relevance:10,contains:[d]},{begin:/<\?[a-z][a-z0-9]+/}]},{className:"tag",begin:/<style(?=\s|>)/,end:/>/,keywords:{name:"style"},contains:[y],starts:{end:/<\/style>/,returnEnd:!0,subLanguage:["css","xml"]}},{className:"tag",begin:/<script(?=\s|>)/,end:/>/,keywords:{name:"script"},contains:[y],starts:{end:/<\/script>/,returnEnd:!0,subLanguage:["javascript","handlebars","xml"]}},{className:"tag",begin:/<>|<\/>/},{className:"tag",begin:n.concat(/</,n.lookahead(n.concat(c,n.either(/\/>/,/>/,/\s/)))),end:/\/?>/,contains:[{className:"name",begin:c,relevance:0,starts:y}]},{className:"tag",begin:n.concat(/<\//,n.lookahead(n.concat(c,/>/))),contains:[{className:"name",begin:c,relevance:0},{begin:/>/,relevance:0,endsParent:!0}]}]}}function Zc(r){const n=r.regex,c={},a={begin:/\$\{/,end:/\}/,contains:["self",{begin:/:-/,contains:[c]}]};Object.assign(c,{className:"variable",variants:[{begin:n.concat(/\$[\w\d#@][\w\d_]*/,"(?![\\w\\d])(?![$])")},a]});const i={className:"subst",begin:/\$\(/,end:/\)/,contains:[r.BACKSLASH_ESCAPE]},s=r.inherit(r.COMMENT(),{match:[/(^|\s)/,/#.*$/],scope:{2:"comment"}}),o={begin:/<<-?\s*(?=\w+)/,starts:{contains:[r.END_SAME_AS_BEGIN({begin:/(\w+)/,end:/(\w+)/,className:"string"})]}},l={className:"string",begin:/"/,end:/"/,contains:[r.BACKSLASH_ESCAPE,c,i]};i.contains.push(l);const d={match:/\\"/},y={className:"string",begin:/'/,end:/'/},w={match:/\\'/},R={begin:/\$?\(\(/,end:/\)\)/,contains:[{begin:/\d+#[0-9a-f]+/,className:"number"},r.NUMBER_MODE,c]},k=["fish","bash","zsh","sh","csh","ksh","tcsh","dash","scsh"],T=r.SHEBANG({binary:`(${k.join("|")})`,relevance:10}),E={className:"function",begin:/\w[\w\d_]*\s*\(\s*\)\s*\{/,returnBegin:!0,contains:[r.inherit(r.TITLE_MODE,{begin:/\w[\w\d_]*/})],relevance:0},A=["if","then","else","elif","fi","time","for","while","until","in","do","done","case","esac","coproc","function","select"],O=["true","false"],z={match:/(\/[a-z._-]+)+/},D=["break","cd","continue","eval","exec","exit","export","getopts","hash","pwd","readonly","return","shift","test","times","trap","umask","unset"],V=["alias","bind","builtin","caller","command","declare","echo","enable","help","let","local","logout","mapfile","printf","read","readarray","source","sudo","type","typeset","ulimit","unalias"],j=["autoload","bg","bindkey","bye","cap","chdir","clone","comparguments","compcall","compctl","compdescribe","compfiles","compgroups","compquote","comptags","comptry","compvalues","dirs","disable","disown","echotc","echoti","emulate","fc","fg","float","functions","getcap","getln","history","integer","jobs","kill","limit","log","noglob","popd","print","pushd","pushln","rehash","sched","setcap","setopt","stat","suspend","ttyctl","unfunction","unhash","unlimit","unsetopt","vared","wait","whence","where","which","zcompile","zformat","zftp","zle","zmodload","zparseopts","zprof","zpty","zregexparse","zsocket","zstyle","ztcp"],B=["chcon","chgrp","chown","chmod","cp","dd","df","dir","dircolors","ln","ls","mkdir","mkfifo","mknod","mktemp","mv","realpath","rm","rmdir","shred","sync","touch","truncate","vdir","b2sum","base32","base64","cat","cksum","comm","csplit","cut","expand","fmt","fold","head","join","md5sum","nl","numfmt","od","paste","ptx","pr","sha1sum","sha224sum","sha256sum","sha384sum","sha512sum","shuf","sort","split","sum","tac","tail","tr","tsort","unexpand","uniq","wc","arch","basename","chroot","date","dirname","du","echo","env","expr","factor","groups","hostid","id","link","logname","nice","nohup","nproc","pathchk","pinky","printenv","printf","pwd","readlink","runcon","seq","sleep","stat","stdbuf","stty","tee","test","timeout","tty","uname","unlink","uptime","users","who","whoami","yes"];return{name:"Bash",aliases:["sh","zsh"],keywords:{$pattern:/\b[a-z][a-z0-9._-]+\b/,keyword:A,literal:O,built_in:[...D,...V,"set","shopt",...j,...B]},contains:[T,r.SHEBANG(),E,R,s,o,z,l,d,y,w,c]}}function Xc(r){const n={className:"attr",begin:/"(\\.|[^\\"\r\n])*"(?=\s*:)/,relevance:1.01},c={match:/[{}[\],:]/,className:"punctuation",relevance:0},a=["true","false","null"],i={scope:"literal",beginKeywords:a.join(" ")};return{name:"JSON",aliases:["jsonc"],keywords:{literal:a},contains:[n,c,r.QUOTE_STRING_MODE,i,r.C_NUMBER_MODE,r.C_LINE_COMMENT_MODE,r.C_BLOCK_COMMENT_MODE],illegal:"\\S"}}const ea=r=>({IMPORTANT:{scope:"meta",begin:"!important"},BLOCK_COMMENT:r.C_BLOCK_COMMENT_MODE,HEXCOLOR:{scope:"number",begin:/#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/},FUNCTION_DISPATCH:{className:"built_in",begin:/[\w-]+(?=\()/},ATTRIBUTE_SELECTOR_MODE:{scope:"selector-attr",begin:/\[/,end:/\]/,illegal:"$",contains:[r.APOS_STRING_MODE,r.QUOTE_STRING_MODE]},CSS_NUMBER_MODE:{scope:"number",begin:r.NUMBER_RE+"(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",relevance:0},CSS_VARIABLE:{className:"attr",begin:/--[A-Za-z_][A-Za-z0-9_-]*/}}),ta=["a","abbr","address","article","aside","audio","b","blockquote","body","button","canvas","caption","cite","code","dd","del","details","dfn","div","dl","dt","em","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","html","i","iframe","img","input","ins","kbd","label","legend","li","main","mark","menu","nav","object","ol","optgroup","option","p","picture","q","quote","samp","section","select","source","span","strong","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","ul","var","video"],ra=["defs","g","marker","mask","pattern","svg","switch","symbol","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feFlood","feGaussianBlur","feImage","feMerge","feMorphology","feOffset","feSpecularLighting","feTile","feTurbulence","linearGradient","radialGradient","stop","circle","ellipse","image","line","path","polygon","polyline","rect","text","use","textPath","tspan","foreignObject","clipPath"],na=[...ta,...ra],ca=["any-hover","any-pointer","aspect-ratio","color","color-gamut","color-index","device-aspect-ratio","device-height","device-width","display-mode","forced-colors","grid","height","hover","inverted-colors","monochrome","orientation","overflow-block","overflow-inline","pointer","prefers-color-scheme","prefers-contrast","prefers-reduced-motion","prefers-reduced-transparency","resolution","scan","scripting","update","width","min-width","max-width","min-height","max-height"].sort().reverse(),aa=["active","any-link","blank","checked","current","default","defined","dir","disabled","drop","empty","enabled","first","first-child","first-of-type","fullscreen","future","focus","focus-visible","focus-within","has","host","host-context","hover","indeterminate","in-range","invalid","is","lang","last-child","last-of-type","left","link","local-link","not","nth-child","nth-col","nth-last-child","nth-last-col","nth-last-of-type","nth-of-type","only-child","only-of-type","optional","out-of-range","past","placeholder-shown","read-only","read-write","required","right","root","scope","target","target-within","user-invalid","valid","visited","where"].sort().reverse(),ia=["after","backdrop","before","cue","cue-region","first-letter","first-line","grammar-error","marker","part","placeholder","selection","slotted","spelling-error"].sort().reverse(),oa=["accent-color","align-content","align-items","align-self","alignment-baseline","all","anchor-name","animation","animation-composition","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-range","animation-range-end","animation-range-start","animation-timeline","animation-timing-function","appearance","aspect-ratio","backdrop-filter","backface-visibility","background","background-attachment","background-blend-mode","background-clip","background-color","background-image","background-origin","background-position","background-position-x","background-position-y","background-repeat","background-size","baseline-shift","block-size","border","border-block","border-block-color","border-block-end","border-block-end-color","border-block-end-style","border-block-end-width","border-block-start","border-block-start-color","border-block-start-style","border-block-start-width","border-block-style","border-block-width","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-end-end-radius","border-end-start-radius","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-inline","border-inline-color","border-inline-end","border-inline-end-color","border-inline-end-style","border-inline-end-width","border-inline-start","border-inline-start-color","border-inline-start-style","border-inline-start-width","border-inline-style","border-inline-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-start-end-radius","border-start-start-radius","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-align","box-decoration-break","box-direction","box-flex","box-flex-group","box-lines","box-ordinal-group","box-orient","box-pack","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","caret-color","clear","clip","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","color-scheme","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","contain","contain-intrinsic-block-size","contain-intrinsic-height","contain-intrinsic-inline-size","contain-intrinsic-size","contain-intrinsic-width","container","container-name","container-type","content","content-visibility","counter-increment","counter-reset","counter-set","cue","cue-after","cue-before","cursor","cx","cy","direction","display","dominant-baseline","empty-cells","enable-background","field-sizing","fill","fill-opacity","fill-rule","filter","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","flood-color","flood-opacity","flow","font","font-display","font-family","font-feature-settings","font-kerning","font-language-override","font-optical-sizing","font-palette","font-size","font-size-adjust","font-smooth","font-smoothing","font-stretch","font-style","font-synthesis","font-synthesis-position","font-synthesis-small-caps","font-synthesis-style","font-synthesis-weight","font-variant","font-variant-alternates","font-variant-caps","font-variant-east-asian","font-variant-emoji","font-variant-ligatures","font-variant-numeric","font-variant-position","font-variation-settings","font-weight","forced-color-adjust","gap","glyph-orientation-horizontal","glyph-orientation-vertical","grid","grid-area","grid-auto-columns","grid-auto-flow","grid-auto-rows","grid-column","grid-column-end","grid-column-start","grid-gap","grid-row","grid-row-end","grid-row-start","grid-template","grid-template-areas","grid-template-columns","grid-template-rows","hanging-punctuation","height","hyphenate-character","hyphenate-limit-chars","hyphens","icon","image-orientation","image-rendering","image-resolution","ime-mode","initial-letter","initial-letter-align","inline-size","inset","inset-area","inset-block","inset-block-end","inset-block-start","inset-inline","inset-inline-end","inset-inline-start","isolation","justify-content","justify-items","justify-self","kerning","left","letter-spacing","lighting-color","line-break","line-height","line-height-step","list-style","list-style-image","list-style-position","list-style-type","margin","margin-block","margin-block-end","margin-block-start","margin-bottom","margin-inline","margin-inline-end","margin-inline-start","margin-left","margin-right","margin-top","margin-trim","marker","marker-end","marker-mid","marker-start","marks","mask","mask-border","mask-border-mode","mask-border-outset","mask-border-repeat","mask-border-slice","mask-border-source","mask-border-width","mask-clip","mask-composite","mask-image","mask-mode","mask-origin","mask-position","mask-repeat","mask-size","mask-type","masonry-auto-flow","math-depth","math-shift","math-style","max-block-size","max-height","max-inline-size","max-width","min-block-size","min-height","min-inline-size","min-width","mix-blend-mode","nav-down","nav-index","nav-left","nav-right","nav-up","none","normal","object-fit","object-position","offset","offset-anchor","offset-distance","offset-path","offset-position","offset-rotate","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-anchor","overflow-block","overflow-clip-margin","overflow-inline","overflow-wrap","overflow-x","overflow-y","overlay","overscroll-behavior","overscroll-behavior-block","overscroll-behavior-inline","overscroll-behavior-x","overscroll-behavior-y","padding","padding-block","padding-block-end","padding-block-start","padding-bottom","padding-inline","padding-inline-end","padding-inline-start","padding-left","padding-right","padding-top","page","page-break-after","page-break-before","page-break-inside","paint-order","pause","pause-after","pause-before","perspective","perspective-origin","place-content","place-items","place-self","pointer-events","position","position-anchor","position-visibility","print-color-adjust","quotes","r","resize","rest","rest-after","rest-before","right","rotate","row-gap","ruby-align","ruby-position","scale","scroll-behavior","scroll-margin","scroll-margin-block","scroll-margin-block-end","scroll-margin-block-start","scroll-margin-bottom","scroll-margin-inline","scroll-margin-inline-end","scroll-margin-inline-start","scroll-margin-left","scroll-margin-right","scroll-margin-top","scroll-padding","scroll-padding-block","scroll-padding-block-end","scroll-padding-block-start","scroll-padding-bottom","scroll-padding-inline","scroll-padding-inline-end","scroll-padding-inline-start","scroll-padding-left","scroll-padding-right","scroll-padding-top","scroll-snap-align","scroll-snap-stop","scroll-snap-type","scroll-timeline","scroll-timeline-axis","scroll-timeline-name","scrollbar-color","scrollbar-gutter","scrollbar-width","shape-image-threshold","shape-margin","shape-outside","shape-rendering","speak","speak-as","src","stop-color","stop-opacity","stroke","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke-width","tab-size","table-layout","text-align","text-align-all","text-align-last","text-anchor","text-combine-upright","text-decoration","text-decoration-color","text-decoration-line","text-decoration-skip","text-decoration-skip-ink","text-decoration-style","text-decoration-thickness","text-emphasis","text-emphasis-color","text-emphasis-position","text-emphasis-style","text-indent","text-justify","text-orientation","text-overflow","text-rendering","text-shadow","text-size-adjust","text-transform","text-underline-offset","text-underline-position","text-wrap","text-wrap-mode","text-wrap-style","timeline-scope","top","touch-action","transform","transform-box","transform-origin","transform-style","transition","transition-behavior","transition-delay","transition-duration","transition-property","transition-timing-function","translate","unicode-bidi","user-modify","user-select","vector-effect","vertical-align","view-timeline","view-timeline-axis","view-timeline-inset","view-timeline-name","view-transition-name","visibility","voice-balance","voice-duration","voice-family","voice-pitch","voice-range","voice-rate","voice-stress","voice-volume","white-space","white-space-collapse","widows","width","will-change","word-break","word-spacing","word-wrap","writing-mode","x","y","z-index","zoom"].sort().reverse();function sa(r){const n=r.regex,c=ea(r),a={begin:/-(webkit|moz|ms|o)-(?=[a-z])/},i="and or not only",s=/@-?\w[\w]*(-\w+)*/,o="[a-zA-Z-][a-zA-Z0-9_-]*",l=[r.APOS_STRING_MODE,r.QUOTE_STRING_MODE];return{name:"CSS",case_insensitive:!0,illegal:/[=|'\$]/,keywords:{keyframePosition:"from to"},classNameAliases:{keyframePosition:"selector-tag"},contains:[c.BLOCK_COMMENT,a,c.CSS_NUMBER_MODE,{className:"selector-id",begin:/#[A-Za-z0-9_-]+/,relevance:0},{className:"selector-class",begin:"\\."+o,relevance:0},c.ATTRIBUTE_SELECTOR_MODE,{className:"selector-pseudo",variants:[{begin:":("+aa.join("|")+")"},{begin:":(:)?("+ia.join("|")+")"}]},c.CSS_VARIABLE,{className:"attribute",begin:"\\b("+oa.join("|")+")\\b"},{begin:/:/,end:/[;}{]/,contains:[c.BLOCK_COMMENT,c.HEXCOLOR,c.IMPORTANT,c.CSS_NUMBER_MODE,...l,{begin:/(url|data-uri)\(/,end:/\)/,relevance:0,keywords:{built_in:"url data-uri"},contains:[...l,{className:"string",begin:/[^)]/,endsWithParent:!0,excludeEnd:!0}]},c.FUNCTION_DISPATCH]},{begin:n.lookahead(/@/),end:"[{;]",relevance:0,illegal:/:/,contains:[{className:"keyword",begin:s},{begin:/\s/,endsWithParent:!0,excludeEnd:!0,relevance:0,keywords:{$pattern:/[a-z-]+/,keyword:i,attribute:ca.join(" ")},contains:[{begin:/[a-z-]+(?=:)/,className:"attribute"},...l,c.CSS_NUMBER_MODE]}]},{className:"selector-tag",begin:"\\b("+na.join("|")+")\\b"}]}}q.registerLanguage("typescript",ht);q.registerLanguage("tsx",ht);q.registerLanguage("javascript",Cr);q.registerLanguage("js",Cr);q.registerLanguage("css",sa);q.registerLanguage("xml",ut);q.registerLanguage("html",ut);q.registerLanguage("jsx",ht);q.registerLanguage("bash",Zc);q.registerLanguage("json",Xc);q.registerLanguage("vue",ut);const la=r=>r.includes("lTag`"),da=r=>r.replace(/lTag`/g,"html`"),ha=r=>r.replace(/html`/g,"lTag`"),t=An(()=>{const r=Ln(null);return Hr(()=>{var o;if(!r.value)return;const n=((o=r.value.className.match(/language-(\w+)/))==null?void 0:o[1])||"typescript";if(n==="bash"){q.highlightElement(r.value),r.value.innerHTML&&(r.value.innerHTML=r.value.innerHTML.replace(/^(\s*)\$(\s)/gm,'$1<span class="bash-prompt">$</span>$2'));return}const c=r.value.textContent||"",a=la(c),i=a?da(c):c,s=q.highlight(i,{language:n}).value;r.value.innerHTML=a?ha(s):s}),({code:n,language:c})=>e("pre",{class:"code-block bg-gray-100 dark:bg-[#1e1e1e] p-6 rounded-lg overflow-x-auto mb-6 text-xs md:text-sm border border-gray-200 dark:border-gray-800",children:e("code",{ref:r,class:`language-${c||"typescript"}`,children:n})})}),at=u(()=>()=>e("div",{children:[e("h1",{children:"Introduction"}),e("p",{children:"StateRef is a universal state management library focused on data immutability. It combines proxies and the functional programming lens pattern to efficiently and safely access and modify deeply structured data."}),e("h2",{children:"Why StateRef?"}),e("p",{children:"Modern applications often deal with complex, deeply nested state. StateRef provides a simple yet powerful way to manage this state while maintaining immutability and fine-grained reactivity."}),e("h3",{children:"Key Features"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Proxy-based Reactivity"})," - Automatic dependency tracking using JavaScript Proxies"]}),e("li",{children:[e("strong",{children:"Immutable Updates"})," - Copy-on-write pattern ensures safe state modifications"]}),e("li",{children:[e("strong",{children:"Lens Pattern"})," - Functional lenses for elegant deep updates"]}),e("li",{children:[e("strong",{children:"Framework Agnostic"})," - Easy integration with React, Vue, Svelte, Solid, and more"]}),e("li",{children:[e("strong",{children:"TypeScript Support"})," - Full type safety and inference"]}),e("li",{children:[e("strong",{children:"Lightweight"})," - Small bundle size with zero dependencies"]})]}),e("h2",{children:"Core Concepts"}),e("h3",{children:"Watch Function"}),e("p",{children:["The ",e("code",{children:"Watch"})," function is the fundamental abstraction in StateRef. It serves dual purposes:"]}),e("ul",{children:[e("li",{children:["Called with no arguments: returns a ",e("code",{children:"StateRefStore"})," for reading/writing values"]}),e("li",{children:["Called with a callback: subscribes to changes (callback receives"," ",e("code",{children:"StateRefStore"})," and ",e("code",{children:"isFirst"})," boolean)"]})]}),e("h3",{children:"StateRefStore"}),e("p",{children:["The ",e("code",{children:"StateRefStore"})," is a proxied reference that allows you to access values via the ",e("code",{children:".value"})," property. The proxy automatically tracks which properties are accessed during subscription callbacks, enabling fine-grained reactivity."]}),e("h3",{children:"Copy-on-Write"}),e("p",{children:"All mutations create new object references at the modified path while sharing unchanged subtrees. This enables efficient immutability checks via reference equality."}),e("h2",{children:"Installation"}),e(t,{language:"bash",code:`# Core library
$ npm install state-ref

# Framework connectors (choose what you need)
$ npm install @stateref/connect-react
$ npm install @stateref/connect-vue
$ npm install @stateref/connect-svelte
$ npm install @stateref/connect-solid`}),e("h2",{children:"Basic Example"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

// Create a store
const watch = createStore({ count: 0 });

// Subscribe to changes
watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  // First run: Count: 0
});

// Update the value
const store = watch();
store.count.value = 1;
// Logs: Count: 1`}),e("h2",{children:"Usage with React"}),e("p",{children:["StateRef can be easily integrated with React using the"," ",e("code",{children:"connectReact"})," helper:"]}),e(t,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const watch = createStore({ count: 0 });
export const useCountStore = connectReact(watch);`}),e(t,{language:"tsx",code:`// Counter.tsx
import { useCountStore } from './store';

function Counter() {
  const { count } = useCountStore();

  return (
    <button onClick={() => count.value++}>
      Count: {count.value}
    </button>
  );
}`}),e("p",{children:["The component automatically re-renders when ",e("code",{children:"count.value"})," ","changes. Learn more in the ",e("a",{href:"#/guide/react",children:"React Integration"})," ","guide."]}),e("h2",{children:"Next Steps"}),e("p",{children:["Ready to dive deeper? Check out the"," ",e("a",{href:"#/guide/quick-start",children:"Quick Start"})," guide to learn how to use StateRef in your projects."]})]})),ua=u(()=>()=>e("div",{children:[e("h1",{children:"소개"}),e("p",{children:"StateRef는 데이터 불변성에 초점을 맞춘 범용 상태 관리 라이브러리입니다. 프록시와 함수형 프로그래밍 렌즈 패턴을 결합하여 깊게 중첩된 데이터를 효율적이고 안전하게 접근하고 수정합니다."}),e("h2",{children:"왜 StateRef인가?"}),e("p",{children:"현대 애플리케이션은 복잡하고 깊게 중첩된 상태를 다루는 경우가 많습니다. StateRef는 불변성과 세밀한 반응성을 유지하면서 이러한 상태를 관리할 수 있는 간단하면서도 강력한 방법을 제공합니다."}),e("h3",{children:"주요 기능"}),e("ul",{children:[e("li",{children:[e("strong",{children:"프록시 기반 반응성"})," - JavaScript 프록시를 사용한 자동 의존성 추적"]}),e("li",{children:[e("strong",{children:"불변 업데이트"})," - Copy-on-write 패턴으로 안전한 상태 수정 보장"]}),e("li",{children:[e("strong",{children:"렌즈 패턴"})," - 깊은 업데이트를 위한 우아한 함수형 렌즈"]}),e("li",{children:[e("strong",{children:"프레임워크 독립적"})," - React, Vue, Svelte, Solid 등과 쉽게 통합"]}),e("li",{children:[e("strong",{children:"TypeScript 지원"})," - 완전한 타입 안전성과 추론"]}),e("li",{children:[e("strong",{children:"경량"})," - 의존성 없이 작은 번들 크기"]})]}),e("h2",{children:"핵심 개념"}),e("h3",{children:"Watch 함수"}),e("p",{children:[e("code",{children:"Watch"})," 함수는 StateRef의 기본 추상화입니다. 두 가지 용도로 사용됩니다:"]}),e("ul",{children:[e("li",{children:["인자 없이 호출: 값을 읽고 쓰기 위한 ",e("code",{children:"StateRefStore"})," 반환"]}),e("li",{children:["콜백과 함께 호출: 변경 사항 구독 (콜백은 ",e("code",{children:"StateRefStore"}),"와"," ",e("code",{children:"isFirst"})," 불리언을 받음)"]})]}),e("h3",{children:"StateRefStore"}),e("p",{children:[e("code",{children:"StateRefStore"}),"는 ",e("code",{children:".value"})," 속성을 통해 값에 접근할 수 있는 프록시 참조입니다. 프록시는 구독 콜백 동안 접근되는 속성을 자동으로 추적하여 세밀한 반응성을 가능하게 합니다."]}),e("h3",{children:"Copy-on-Write"}),e("p",{children:"모든 변경은 수정된 경로에 새로운 객체 참조를 생성하고 변경되지 않은 하위 트리는 공유합니다. 이를 통해 참조 동등성을 통한 효율적인 불변성 검사가 가능합니다."}),e("h2",{children:"설치"}),e(t,{language:"bash",code:`# 코어 라이브러리
$ npm install state-ref

# 프레임워크 커넥터 (필요한 것만 선택)
$ npm install @stateref/connect-react
$ npm install @stateref/connect-vue
$ npm install @stateref/connect-svelte
$ npm install @stateref/connect-solid`}),e("h2",{children:"기본 예제"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

// 스토어 생성
const watch = createStore({ count: 0 });

// 변경 사항 구독
watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  // 첫 실행: Count: 0
});

// 값 업데이트
const store = watch();
store.count.value = 1;
// 로그: Count: 1`}),e("h2",{children:"React와 함께 사용하기"}),e("p",{children:["StateRef는 ",e("code",{children:"connectReact"})," 헬퍼를 사용하여 React와 쉽게 통합할 수 있습니다:"]}),e(t,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const watch = createStore({ count: 0 });
export const useCountStore = connectReact(watch);`}),e(t,{language:"tsx",code:`// Counter.tsx
import { useCountStore } from './store';

function Counter() {
  const { count } = useCountStore();

  return (
    <button onClick={() => count.value++}>
      Count: {count.value}
    </button>
  );
}`}),e("p",{children:[e("code",{children:"count.value"}),"가 변경되면 컴포넌트가 자동으로 다시 렌더링됩니다. 자세한 내용은 ",e("a",{href:"#/ko/guide/react",children:"React 연동"})," ","가이드를 참고하세요."]}),e("h2",{children:"다음 단계"}),e("p",{children:["더 자세히 알아볼 준비가 되셨나요?"," ",e("a",{href:"#/ko/guide/quick-start",children:"빠른 시작"})," 가이드를 확인하여 프로젝트에서 StateRef를 사용하는 방법을 배워보세요."]})]})),pa=u(()=>()=>e("div",{children:[e("h1",{children:"Quick Start"}),e("p",{children:"This guide will help you get started with StateRef in just a few minutes. You'll learn how to create a store, subscribe to changes, and update values."}),e("h2",{children:"Installation"}),e("p",{children:"First, install the core library:"}),e(t,{language:"bash",code:"$ npm install state-ref"}),e("h2",{children:"Creating Your First Store"}),e("p",{children:["Use ",e("code",{children:"createStore()"})," to create a reactive store with an initial value:"]}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

// Create a store with an object
const watch = createStore({ count: 0, name: 'StateRef' });

// Or with a primitive value
const numberWatch = createStore(42);`}),e("h2",{children:"Reading and Writing Values"}),e("p",{children:["Access and modify values using the ",e("code",{children:".value"})," property:"]}),e(t,{language:"typescript",code:`// Get a reference to the store
const store = watch();

// Read values
console.log(store.count.value); // 0

// Write values
store.count.value = 10;
store.name.value = 'Updated';`}),e("h2",{children:"Subscribing to Changes"}),e("p",{children:["Pass a callback function to ",e("code",{children:"watch()"})," to subscribe to state changes. The callback receives the store reference and an"," ",e("code",{children:"isFirst"})," flag:"]}),e(t,{language:"typescript",code:`watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  console.log('Is first run?', isFirst);
  // First run: Count: 0, Is first run? true
});

// Update triggers the callback
const store = watch();
store.count.value = 5;
// Logs: Count: 5, Is first run? false`}),e("h2",{children:"Understanding References"}),e("p",{children:["The ",e("code",{children:"watch"})," function returns the same reference whether called with or without a callback. Both the returned reference (",e("code",{children:"outerRef"}),") and the callback argument (",e("code",{children:"innerRef"}),") track dependencies:"]}),e(t,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2 });

// Subscribe and get a tracked reference
const outerRef = watch((innerRef, isFirst) => {
  // innerRef and outerRef are the same reference
  console.log(innerRef.x.value);
});

// Both trigger the subscription
outerRef.x.value = 10;  // ✓ Triggers callback
innerRef.x.value = 20;  // ✓ Triggers callback

// Untracked reference
const anotherRef = watch();
anotherRef.y.value = 5;  // ✗ Does NOT trigger callback`}),e("h3",{children:"Key Points"}),e("ul",{children:[e("li",{children:["Only values accessed through a ",e("strong",{children:"subscribed reference"})," ","trigger updates"]}),e("li",{children:["Both ",e("code",{children:"innerRef"})," and ",e("code",{children:"outerRef"})," are tracked when created with a callback"]}),e("li",{children:["References created without a callback are ",e("strong",{children:"not tracked"})]})]}),e("h2",{children:"Canceling Subscriptions"}),e("p",{children:["Use ",e("code",{children:"AbortController"})," to unsubscribe from changes:"]}),e(t,{language:"typescript",code:`const abortController = new AbortController();

watch((store) => {
  console.log('Count:', store.count.value);
  return abortController.signal;
});

// Later, cancel the subscription
abortController.abort();`}),e("h2",{children:"Working with Primitive Types"}),e("p",{children:"StateRef works seamlessly with primitive types like numbers and strings:"}),e(t,{language:"typescript",code:`const numberWatch = createStore(100);

numberWatch((store) => {
  console.log('Number:', store.value);
});

const numStore = numberWatch();
numStore.value = 200; // Triggers callback`}),e("h2",{children:"Next Steps"}),e("p",{children:"Now that you understand the basics, explore these topics:"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore API"})," - Deep dive into store creation"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - Advanced watch patterns"]}),e("li",{children:[e("a",{href:"#/guide/react",children:"React Integration"})," - Use StateRef with React"]}),e("li",{children:[e("a",{href:"#/guide/computed",children:"createComputed"})," - Derive values from multiple stores"]})]})]})),ga=u(()=>()=>e("div",{children:[e("h1",{children:"빠른 시작"}),e("p",{children:"이 가이드는 몇 분 안에 StateRef를 시작할 수 있도록 도와줍니다. 스토어 생성, 변경 사항 구독, 값 업데이트 방법을 배워보세요."}),e("h2",{children:"설치"}),e("p",{children:"먼저 코어 라이브러리를 설치합니다:"}),e(t,{language:"bash",code:"$ npm install state-ref"}),e("h2",{children:"첫 번째 스토어 만들기"}),e("p",{children:[e("code",{children:"createStore()"}),"를 사용하여 초기값과 함께 반응형 스토어를 생성합니다:"]}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

// 객체로 스토어 생성
const watch = createStore({ count: 0, name: 'StateRef' });

// 또는 원시 타입 값으로 생성
const numberWatch = createStore(42);`}),e("h2",{children:"값 읽기와 쓰기"}),e("p",{children:[e("code",{children:".value"})," 속성을 사용하여 값에 접근하고 수정합니다:"]}),e(t,{language:"typescript",code:`// 스토어 참조 얻기
const store = watch();

// 값 읽기
console.log(store.count.value); // 0

// 값 쓰기
store.count.value = 10;
store.name.value = '업데이트됨';`}),e("h2",{children:"변경 사항 구독하기"}),e("p",{children:[e("code",{children:"watch()"}),"에 콜백 함수를 전달하여 상태 변경을 구독합니다. 콜백은 스토어 참조와 ",e("code",{children:"isFirst"})," 플래그를 받습니다:"]}),e(t,{language:"typescript",code:`watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  console.log('첫 실행?', isFirst);
  // 첫 실행: Count: 0, 첫 실행? true
});

// 업데이트가 콜백을 트리거합니다
const store = watch();
store.count.value = 5;
// 로그: Count: 5, 첫 실행? false`}),e("h2",{children:"참조 이해하기"}),e("p",{children:[e("code",{children:"watch"})," 함수는 콜백과 함께 호출하든 안하든 같은 참조를 반환합니다. 반환된 참조(",e("code",{children:"outerRef"}),")와 콜백 인자(",e("code",{children:"innerRef"}),") 모두 의존성을 추적합니다:"]}),e(t,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2 });

// 구독하고 추적된 참조 얻기
const outerRef = watch((innerRef, isFirst) => {
  // innerRef와 outerRef는 같은 참조입니다
  console.log(innerRef.x.value);
});

// 둘 다 구독을 트리거합니다
outerRef.x.value = 10;  // ✓ 콜백 트리거
innerRef.x.value = 20;  // ✓ 콜백 트리거

// 추적되지 않는 참조
const anotherRef = watch();
anotherRef.y.value = 5;  // ✗ 콜백 트리거 안 함`}),e("h3",{children:"핵심 포인트"}),e("ul",{children:[e("li",{children:[e("strong",{children:"구독된 참조"}),"를 통해 접근한 값만 업데이트를 트리거합니다"]}),e("li",{children:["콜백과 함께 생성된 경우 ",e("code",{children:"innerRef"}),"와 ",e("code",{children:"outerRef"})," ","모두 추적됩니다"]}),e("li",{children:["콜백 없이 생성된 참조는 ",e("strong",{children:"추적되지 않습니다"})]})]}),e("h2",{children:"구독 취소하기"}),e("p",{children:[e("code",{children:"AbortController"}),"를 사용하여 변경 사항 구독을 해제합니다:"]}),e(t,{language:"typescript",code:`const abortController = new AbortController();

watch((store) => {
  console.log('Count:', store.count.value);
  return abortController.signal;
});

// 나중에 구독 취소
abortController.abort();`}),e("h2",{children:"원시 타입 다루기"}),e("p",{children:"StateRef는 숫자나 문자열 같은 원시 타입과도 완벽하게 작동합니다:"}),e(t,{language:"typescript",code:`const numberWatch = createStore(100);

numberWatch((store) => {
  console.log('Number:', store.value);
});

const numStore = numberWatch();
numStore.value = 200; // 콜백 트리거`}),e("h2",{children:"다음 단계"}),e("p",{children:"이제 기본을 이해했으니, 다음 주제들을 탐색해보세요:"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore API"})," - 스토어 생성 깊이 알아보기"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - 고급 watch 패턴"]}),e("li",{children:[e("a",{href:"#/ko/guide/react",children:"React 연동"})," - React와 함께 StateRef 사용하기"]}),e("li",{children:[e("a",{href:"#/ko/guide/computed",children:"createComputed"})," - 여러 스토어에서 값 파생하기"]})]})]})),fa=u(()=>()=>e("div",{children:[e("h1",{children:"createStore"}),e("p",{children:["The ",e("code",{children:"createStore"})," function is the primary way to create a reactive state store in StateRef. It accepts an initial value and returns a ",e("code",{children:"watch"})," function that you use to access and subscribe to the state."]}),e("h2",{children:"Basic Usage"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

// Create a store with an initial value
const watch = createStore({ count: 0, name: 'StateRef' });`}),e("h2",{children:"Syntax"}),e(t,{language:"typescript",code:"createStore<T>(initialValue: T): Watch<T>"}),e("h3",{children:"Parameters"}),e("ul",{children:e("li",{children:[e("code",{children:"initialValue"})," - The initial state value. Can be any type: object, array, primitive, etc."]})}),e("h3",{children:"Returns"}),e("p",{children:["Returns a ",e("code",{children:"Watch"})," function that serves dual purposes:"]}),e("ul",{children:[e("li",{children:[e("strong",{children:"Without arguments"}),": Returns a"," ",e("code",{children:"StateRefStore"})," reference for reading/writing values"]}),e("li",{children:[e("strong",{children:"With callback"}),": Subscribes to changes and returns a tracked ",e("code",{children:"StateRefStore"})," reference"]})]}),e("h2",{children:"Creating Object Stores"}),e("p",{children:"Object stores are the most common use case. They allow you to manage complex nested state:"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: {
    name: 'John',
    age: 30,
    settings: {
      theme: 'dark',
      notifications: true
    }
  },
  todos: [
    { id: 1, text: 'Learn StateRef', done: false },
    { id: 2, text: 'Build app', done: false }
  ]
});

// Access nested values
const store = watch();
console.log(store.user.name.value); // 'John'
console.log(store.todos[0].text.value); // 'Learn StateRef'

// Update nested values
store.user.settings.theme.value = 'light';
store.todos[0].done.value = true;`}),e("h2",{children:"Creating Primitive Stores"}),e("p",{children:"StateRef also works seamlessly with primitive types like numbers, strings, and booleans:"}),e(t,{language:"typescript",code:`// Number store
const countWatch = createStore(0);
const count = countWatch();
count.value = 10;

// String store
const nameWatch = createStore('StateRef');
const name = nameWatch();
name.value = 'Updated Name';

// Boolean store
const toggleWatch = createStore(false);
const toggle = toggleWatch();
toggle.value = true;`}),e("h2",{children:"TypeScript Type Inference"}),e("p",{children:"StateRef provides full TypeScript support with automatic type inference:"}),e(t,{language:"typescript",code:`// Type is inferred from initial value
const watch = createStore({ count: 0 });
// watch: Watch<{ count: number }>

// Explicit type annotation
const watch = createStore<{ count: number }>({ count: 0 });

// Generic type
interface User {
  id: number;
  name: string;
  email: string;
}

const userWatch = createStore<User>({
  id: 1,
  name: 'John',
  email: 'john@example.com'
});`}),e("h2",{children:"Using the Returned Watch Function"}),e("p",{children:["The ",e("code",{children:"watch"})," function returned by ",e("code",{children:"createStore"})," is the core interface for your store:"]}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0 });

// Get a reference without subscribing
const store = watch();
store.count.value = 10;

// Subscribe to changes
watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  console.log('Is first run?', isFirst);
});

// Both forms can be used together
const trackedStore = watch((store) => {
  console.log('Count changed:', store.count.value);
});

// This update triggers the subscription
trackedStore.count.value = 20;`}),e("h2",{children:"Auto-sync Mode"}),e("p",{children:["By default, ",e("code",{children:"createStore"})," operates in"," ",e("strong",{children:"auto-sync"})," mode, which means changes immediately trigger subscriptions:"]}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0 });

watch((store) => {
  console.log('Count:', store.count.value);
});

const store = watch();
store.count.value = 1; // ✓ Immediately triggers subscription
store.count.value = 2; // ✓ Immediately triggers subscription`}),e("p",{children:["For manual control over when updates propagate, see"," ",e("a",{href:"#/guide/manual-sync",children:"Manual Sync (Flux)"}),"."]}),e("h2",{children:"Working with Arrays"}),e("p",{children:"Arrays are fully supported with copy-on-write semantics:"}),e(t,{language:"typescript",code:`const watch = createStore({
  items: [1, 2, 3, 4, 5]
});

const store = watch();

// Access array elements
console.log(store.items[0].value); // 1

// Update array elements
store.items[0].value = 10;

// Replace entire array (creates new reference)
store.items.value = [10, 20, 30];

// Array methods work on .value
store.items.value.push(40);
store.items.value = [...store.items.value]; // Trigger update`}),e("h2",{children:"Best Practices"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Keep stores focused"})," - Create separate stores for different domains of your application"]}),e("li",{children:[e("strong",{children:"Use TypeScript"})," - Type your stores for better IDE support and type safety"]}),e("li",{children:[e("strong",{children:"Initialize with complete state"})," - Provide all properties in the initial value to ensure proper type inference"]}),e("li",{children:[e("strong",{children:"Don't create stores in render functions"})," - Create stores at the module level or in hooks"]})]}),e("h2",{children:"Common Patterns"}),e("h3",{children:"Single Store Module"}),e(t,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';

export const appWatch = createStore({
  user: null as User | null,
  theme: 'light' as 'light' | 'dark',
  isLoading: false
});`}),e("h3",{children:"Multiple Stores"}),e(t,{language:"typescript",code:`// stores/user.ts
export const userWatch = createStore<User | null>(null);

// stores/settings.ts
export const settingsWatch = createStore({
  theme: 'light',
  language: 'en'
});

// stores/todos.ts
export const todosWatch = createStore<Todo[]>([]);`}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - Understanding the watch function"]}),e("li",{children:[e("a",{href:"#/guide/state-ref-store",children:"StateRefStore"})," - Working with store references"]}),e("li",{children:[e("a",{href:"#/guide/manual-sync",children:"Manual Sync"})," - createStoreManualSync for Flux-like patterns"]})]})]})),ma=u(()=>()=>e("div",{children:[e("h1",{children:"createStore"}),e("p",{children:[e("code",{children:"createStore"})," 함수는 StateRef에서 반응형 상태 스토어를 생성하는 주요 방법입니다. 초기값을 받아서 상태에 접근하고 구독할 수 있는"," ",e("code",{children:"watch"})," 함수를 반환합니다."]}),e("h2",{children:"기본 사용법"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

// 초기값으로 스토어 생성
const watch = createStore({ count: 0, name: 'StateRef' });`}),e("h2",{children:"문법"}),e(t,{language:"typescript",code:"createStore<T>(initialValue: T): Watch<T>"}),e("h3",{children:"매개변수"}),e("ul",{children:e("li",{children:[e("code",{children:"initialValue"})," - 초기 상태 값. 객체, 배열, 원시 타입 등 모든 타입 가능"]})}),e("h3",{children:"반환값"}),e("p",{children:[e("code",{children:"Watch"})," 함수를 반환하며, 두 가지 용도로 사용됩니다:"]}),e("ul",{children:[e("li",{children:[e("strong",{children:"인자 없이 호출"}),": 값을 읽고 쓰기 위한"," ",e("code",{children:"StateRefStore"})," 참조 반환"]}),e("li",{children:[e("strong",{children:"콜백과 함께 호출"}),": 변경 사항을 구독하고 추적되는"," ",e("code",{children:"StateRefStore"})," 참조 반환"]})]}),e("h2",{children:"객체 스토어 생성"}),e("p",{children:"객체 스토어가 가장 일반적인 사용 사례입니다. 복잡한 중첩 상태를 관리할 수 있습니다:"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: {
    name: 'John',
    age: 30,
    settings: {
      theme: 'dark',
      notifications: true
    }
  },
  todos: [
    { id: 1, text: 'StateRef 배우기', done: false },
    { id: 2, text: '앱 만들기', done: false }
  ]
});

// 중첩된 값 접근
const store = watch();
console.log(store.user.name.value); // 'John'
console.log(store.todos[0].text.value); // 'StateRef 배우기'

// 중첩된 값 업데이트
store.user.settings.theme.value = 'light';
store.todos[0].done.value = true;`}),e("h2",{children:"원시 타입 스토어 생성"}),e("p",{children:"StateRef는 숫자, 문자열, 불리언 같은 원시 타입과도 완벽하게 작동합니다:"}),e(t,{language:"typescript",code:`// 숫자 스토어
const countWatch = createStore(0);
const count = countWatch();
count.value = 10;

// 문자열 스토어
const nameWatch = createStore('StateRef');
const name = nameWatch();
name.value = '업데이트된 이름';

// 불리언 스토어
const toggleWatch = createStore(false);
const toggle = toggleWatch();
toggle.value = true;`}),e("h2",{children:"TypeScript 타입 추론"}),e("p",{children:"StateRef는 자동 타입 추론과 함께 완전한 TypeScript 지원을 제공합니다:"}),e(t,{language:"typescript",code:`// 초기값으로부터 타입 추론
const watch = createStore({ count: 0 });
// watch: Watch<{ count: number }>

// 명시적 타입 지정
const watch = createStore<{ count: number }>({ count: 0 });

// 제네릭 타입
interface User {
  id: number;
  name: string;
  email: string;
}

const userWatch = createStore<User>({
  id: 1,
  name: 'John',
  email: 'john@example.com'
});`}),e("h2",{children:"반환된 Watch 함수 사용하기"}),e("p",{children:[e("code",{children:"createStore"}),"가 반환하는 ",e("code",{children:"watch"})," 함수가 스토어의 핵심 인터페이스입니다:"]}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0 });

// 구독 없이 참조 얻기
const store = watch();
store.count.value = 10;

// 변경 사항 구독
watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  console.log('첫 실행?', isFirst);
});

// 두 형태를 함께 사용 가능
const trackedStore = watch((store) => {
  console.log('Count 변경됨:', store.count.value);
});

// 이 업데이트는 구독을 트리거합니다
trackedStore.count.value = 20;`}),e("h2",{children:"자동 동기화 모드"}),e("p",{children:["기본적으로 ",e("code",{children:"createStore"}),"는 ",e("strong",{children:"자동 동기화"})," ","모드로 동작하며, 변경 사항이 즉시 구독을 트리거합니다:"]}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0 });

watch((store) => {
  console.log('Count:', store.count.value);
});

const store = watch();
store.count.value = 1; // ✓ 즉시 구독 트리거
store.count.value = 2; // ✓ 즉시 구독 트리거`}),e("p",{children:["업데이트 전파 시점을 수동으로 제어하려면"," ",e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화 (Flux)"}),"를 참고하세요."]}),e("h2",{children:"배열 다루기"}),e("p",{children:"배열은 copy-on-write 의미론과 함께 완전히 지원됩니다:"}),e(t,{language:"typescript",code:`const watch = createStore({
  items: [1, 2, 3, 4, 5]
});

const store = watch();

// 배열 요소 접근
console.log(store.items[0].value); // 1

// 배열 요소 업데이트
store.items[0].value = 10;

// 전체 배열 교체 (새 참조 생성)
store.items.value = [10, 20, 30];

// 배열 메서드는 .value에서 작동
store.items.value.push(40);
store.items.value = [...store.items.value]; // 업데이트 트리거`}),e("h2",{children:"모범 사례"}),e("ul",{children:[e("li",{children:[e("strong",{children:"스토어를 집중되게 유지"})," - 애플리케이션의 다른 도메인에 대해 별도의 스토어 생성"]}),e("li",{children:[e("strong",{children:"TypeScript 사용"})," - 더 나은 IDE 지원과 타입 안전성을 위해 스토어에 타입 지정"]}),e("li",{children:[e("strong",{children:"완전한 상태로 초기화"})," - 적절한 타입 추론을 위해 초기값에 모든 속성 제공"]}),e("li",{children:[e("strong",{children:"렌더 함수에서 스토어 생성 금지"})," - 모듈 레벨이나 훅에서 스토어 생성"]})]}),e("h2",{children:"일반적인 패턴"}),e("h3",{children:"단일 스토어 모듈"}),e(t,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';

export const appWatch = createStore({
  user: null as User | null,
  theme: 'light' as 'light' | 'dark',
  isLoading: false
});`}),e("h3",{children:"여러 스토어"}),e(t,{language:"typescript",code:`// stores/user.ts
export const userWatch = createStore<User | null>(null);

// stores/settings.ts
export const settingsWatch = createStore({
  theme: 'light',
  language: 'ko'
});

// stores/todos.ts
export const todosWatch = createStore<Todo[]>([]);`}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - watch 함수 이해하기"]}),e("li",{children:[e("a",{href:"#/ko/guide/state-ref-store",children:"StateRefStore"})," - 스토어 참조 다루기"]}),e("li",{children:[e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화"})," - Flux 패턴을 위한 createStoreManualSync"]})]})]})),ya=u(()=>()=>e("div",{children:[e("h1",{children:"Watch Function"}),e("p",{children:["The ",e("code",{children:"watch"})," function is the core interface returned by"," ",e("code",{children:"createStore()"}),". It serves dual purposes: accessing state references and subscribing to state changes."]}),e("h2",{children:"Overview"}),e("p",{children:["When you call ",e("code",{children:"createStore()"}),", it returns a"," ",e("code",{children:"watch"})," function that can be used in two ways:"]}),e("ul",{children:[e("li",{children:[e("strong",{children:"Without arguments"}),": Returns a"," ",e("code",{children:"StateRefStore"})," reference for reading/writing values"]}),e("li",{children:[e("strong",{children:"With a callback"}),": Subscribes to changes and returns a tracked ",e("code",{children:"StateRefStore"})," reference"]})]}),e("h2",{children:"Basic Usage"}),e("h3",{children:"Getting a Reference (No Subscription)"}),e("p",{children:["Call ",e("code",{children:"watch()"})," without arguments to get a reference for reading and writing state:"]}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

const watch = createStore({ count: 0, name: 'StateRef' });

// Get a reference without subscribing
const store = watch();

// Read values
console.log(store.count.value); // 0
console.log(store.name.value);  // 'StateRef'

// Write values
store.count.value = 10;
store.name.value = 'Updated';`}),e("h3",{children:"Subscribing to Changes"}),e("p",{children:["Call ",e("code",{children:"watch()"})," with a callback function to subscribe to state changes:"]}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0 });

// Subscribe to changes
watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  console.log('Is first run?', isFirst);
});

// Updates will trigger the callback
const store = watch();
store.count.value = 1; // Logs: "Count: 1" and "Is first run? false"`}),e("h2",{children:"Callback Signature"}),e("p",{children:"The subscription callback receives two parameters:"}),e(t,{language:"typescript",code:`type RenewCallback<T> = (
  store: StateRefStore<T>,
  isFirst: boolean
) => void | AbortSignal;`}),e("h3",{children:"Parameters"}),e("ul",{children:[e("li",{children:[e("code",{children:"store"})," - The ",e("code",{children:"StateRefStore"})," reference (innerRef) that is automatically tracked"]}),e("li",{children:[e("code",{children:"isFirst"})," - Boolean indicating if this is the first execution of the callback"]})]}),e("h3",{children:"Return Value"}),e("p",{children:["The callback can optionally return an ",e("code",{children:"AbortSignal"})," to unsubscribe when the signal is aborted."]}),e("h2",{children:"Understanding isFirst Parameter"}),e("p",{children:["The ",e("code",{children:"isFirst"})," parameter helps distinguish between the initial callback execution and subsequent updates:"]}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0 });

watch((store, isFirst) => {
  if (isFirst) {
    console.log('Initial setup, count:', store.count.value);
  } else {
    console.log('Count updated to:', store.count.value);
  }
});

// Output: "Initial setup, count: 0"

const store = watch();
store.count.value = 5;
// Output: "Count updated to: 5"`}),e("h2",{children:"InnerRef vs OuterRef"}),e("p",{children:["Understanding innerRef and outerRef is crucial: they are"," ",e("strong",{children:"the same reference"}),", both bound to the subscription. What matters is"," ",e("strong",{children:"which reference you use to READ properties"}),"during the callback."]}),e(t,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2 });

const anotherRef = watch();  // Unbound reference

// The callback receives innerRef
const outerRef = watch((innerRef, isFirst) => {
  // Reading x via innerRef → x is TRACKED
  console.log('x changed:', innerRef.x.value);

  // Reading y via unbound ref → y is NOT tracked
  console.log('y value:', anotherRef.y.value);
});

// Both trigger the callback (x was READ via innerRef)
outerRef.x.value = 10;
// ✓ Logs: "x changed: 10"

anotherRef.x.value = 20;
// ✓ Logs: "x changed: 20" (x is tracked!)

// Neither triggers the callback (y was READ via unbound ref)
outerRef.y.value = 10;    // ✗ Does NOT trigger
anotherRef.y.value = 20;  // ✗ Does NOT trigger`}),e("p",{children:[e("strong",{children:"Key principle"}),": Tracking is based on which reference was used to READ the property during subscription, not which reference is used to WRITE it later."]}),e("h2",{children:"Unsubscribing with AbortController"}),e("p",{children:["Use ",e("code",{children:"AbortController"})," to cancel subscriptions:"]}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0 });
const controller = new AbortController();

// Return the abort signal from the callback
watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  return controller.signal;
});

const store = watch();
store.count.value = 1; // ✓ Triggers callback

// Cancel subscription
controller.abort();

store.count.value = 2; // ✗ Does NOT trigger callback (unsubscribed)`}),e("h2",{children:"Multiple Subscriptions"}),e("p",{children:"You can create multiple independent subscriptions to the same store:"}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0 });

// First subscription
const ref1 = watch((store) => {
  console.log('Subscription 1:', store.count.value);
});

// Second subscription
const ref2 = watch((store) => {
  console.log('Subscription 2:', store.count.value);
});

// Both subscriptions are independent
ref1.count.value = 10;
// Output:
// "Subscription 1: 10"

ref2.count.value = 20;
// Output:
// "Subscription 2: 20"`}),e("h2",{children:"Combining Reference Access and Subscription"}),e("p",{children:"The subscription callback returns a tracked reference, which you can use immediately:"}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0, name: 'StateRef' });

// Subscribe and get the tracked reference
const trackedStore = watch((store) => {
  console.log('State changed:', store.count.value);
});

// Also get an untracked reference for other operations
const untrackedStore = watch();

// Update via tracked reference - triggers callback
trackedStore.count.value = 5;
// ✓ Logs: "State changed: 5"

// Writing a tracked path through an untracked ref still notifies subscribers
untrackedStore.count.value = 10;
// ✓ Logs: "State changed: 10"`}),e("h2",{children:"Selective Property Tracking"}),e("p",{children:"Subscriptions only track properties that are accessed within the callback:"}),e(t,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2, z: 3 });

const store = watch((innerRef) => {
  // Only accessing x, so only x changes trigger this callback
  console.log('x changed:', innerRef.x.value);
});

store.x.value = 10; // ✓ Triggers callback
store.y.value = 20; // ✗ Does NOT trigger (y was never accessed)
store.z.value = 30; // ✗ Does NOT trigger (z was never accessed)`}),e("h2",{children:"Common Patterns"}),e("h3",{children:"Component Integration"}),e(t,{language:"typescript",code:`// In a UI framework component
const MyComponent = () => {
  const store = appWatch((innerRef) => {
    // This triggers re-render when count changes
    console.log('Count updated:', innerRef.count.value);

    // Return component's cleanup signal
    return cleanupSignal;
  });

  return <div>{store.count.value}</div>;
};`}),e("h3",{children:"Derived State"}),e(t,{language:"typescript",code:`const watch = createStore({ firstName: 'John', lastName: 'Doe' });

watch((store) => {
  const fullName = \`\${store.firstName.value} \${store.lastName.value}\`;
  console.log('Full name:', fullName);
});

const store = watch();
store.firstName.value = 'Jane';
// Logs: "Full name: Jane Doe"`}),e("h3",{children:"Side Effects"}),e(t,{language:"typescript",code:`const watch = createStore({ userId: null });

watch((store, isFirst) => {
  // Access .value first to collect subscription
  const userId = store.userId.value;
  if (!isFirst && userId) {
    // Fetch user data when userId changes
    fetchUserData(userId);
  }
});`}),e("h2",{children:"Best Practices"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Use isFirst for initialization"})," - Distinguish setup logic from update logic"]}),e("li",{children:[e("strong",{children:"Return AbortSignal for cleanup"})," - Always clean up subscriptions in components"]}),e("li",{children:[e("strong",{children:"Be mindful of tracking"})," - Only the outerRef (returned by subscription) is tracked"]}),e("li",{children:[e("strong",{children:"Access only needed properties"})," - Subscriptions track only accessed properties"]}),e("li",{children:[e("strong",{children:"Avoid creating references in loops"})," - Create watch references at module or component level"]})]}),e("h2",{children:"Type Safety"}),e("p",{children:"The watch function is fully typed with TypeScript:"}),e(t,{language:"typescript",code:`interface User {
  id: number;
  name: string;
  email: string;
}

const watch = createStore<User>({
  id: 1,
  name: 'John',
  email: 'john@example.com'
});

// Type-safe reference access
const store = watch();
store.name.value = 'Jane';      // ✓ OK
store.age.value = 30;            // ✗ Error: Property 'age' does not exist

// Type-safe subscription
watch((innerRef) => {
  const name: string = innerRef.name.value;  // ✓ Type inferred correctly
  const id: number = innerRef.id.value;      // ✓ Type inferred correctly
});`}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - Creating stores that return watch functions"]}),e("li",{children:[e("a",{href:"#/guide/references",children:"Understanding References"})," - Deep dive into innerRef, outerRef, and unbound references"]}),e("li",{children:[e("a",{href:"#/guide/subscription",children:"Subscription"})," - Advanced subscription patterns"]}),e("li",{children:[e("a",{href:"#/guide/state-ref-store",children:"StateRefStore"})," - Working with store references"]})]})]})),ba=u(()=>()=>e("div",{children:[e("h1",{children:"Watch 함수"}),e("p",{children:[e("code",{children:"watch"})," 함수는 ",e("code",{children:"createStore()"}),"가 반환하는 핵심 인터페이스입니다. 상태 참조 접근과 상태 변경 구독이라는 두 가지 목적으로 사용됩니다."]}),e("h2",{children:"개요"}),e("p",{children:[e("code",{children:"createStore()"}),"를 호출하면 두 가지 방식으로 사용할 수 있는"," ",e("code",{children:"watch"})," 함수를 반환합니다:"]}),e("ul",{children:[e("li",{children:[e("strong",{children:"인자 없이 호출"}),": 값을 읽고 쓰기 위한"," ",e("code",{children:"StateRefStore"})," 참조 반환"]}),e("li",{children:[e("strong",{children:"콜백과 함께 호출"}),": 변경 사항을 구독하고 추적되는"," ",e("code",{children:"StateRefStore"})," 참조 반환"]})]}),e("h2",{children:"기본 사용법"}),e("h3",{children:"참조 얻기 (구독 없음)"}),e("p",{children:["인자 없이 ",e("code",{children:"watch()"}),"를 호출하여 상태를 읽고 쓰기 위한 참조를 얻습니다:"]}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

const watch = createStore({ count: 0, name: 'StateRef' });

// 구독 없이 참조 얻기
const store = watch();

// 값 읽기
console.log(store.count.value); // 0
console.log(store.name.value);  // 'StateRef'

// 값 쓰기
store.count.value = 10;
store.name.value = '업데이트됨';`}),e("h3",{children:"변경 사항 구독하기"}),e("p",{children:["콜백 함수와 함께 ",e("code",{children:"watch()"}),"를 호출하여 상태 변경을 구독합니다:"]}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0 });

// 변경 사항 구독
watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  console.log('첫 실행?', isFirst);
});

// 업데이트는 콜백을 트리거합니다
const store = watch();
store.count.value = 1; // 로그: "Count: 1" 및 "첫 실행? false"`}),e("h2",{children:"콜백 시그니처"}),e("p",{children:"구독 콜백은 두 개의 파라미터를 받습니다:"}),e(t,{language:"typescript",code:`type RenewCallback<T> = (
  store: StateRefStore<T>,
  isFirst: boolean
) => void | AbortSignal;`}),e("h3",{children:"파라미터"}),e("ul",{children:[e("li",{children:[e("code",{children:"store"})," - 자동으로 추적되는 ",e("code",{children:"StateRefStore"})," 참조 (innerRef)"]}),e("li",{children:[e("code",{children:"isFirst"})," - 콜백의 첫 실행인지 나타내는 불리언 값"]})]}),e("h3",{children:"반환값"}),e("p",{children:["콜백은 선택적으로 ",e("code",{children:"AbortSignal"}),"을 반환하여 시그널이 중단되면 구독을 취소할 수 있습니다."]}),e("h2",{children:"isFirst 파라미터 이해하기"}),e("p",{children:[e("code",{children:"isFirst"})," 파라미터는 초기 콜백 실행과 이후 업데이트를 구분하는 데 도움이 됩니다:"]}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0 });

watch((store, isFirst) => {
  if (isFirst) {
    console.log('초기 설정, count:', store.count.value);
  } else {
    console.log('Count 업데이트됨:', store.count.value);
  }
});

// 출력: "초기 설정, count: 0"

const store = watch();
store.count.value = 5;
// 출력: "Count 업데이트됨: 5"`}),e("h2",{children:"InnerRef vs OuterRef"}),e("p",{children:["innerRef와 outerRef를 이해하는 것이 중요합니다: 둘은"," ",e("strong",{children:"동일한 참조"}),"이며, 둘 다 구독에 바인딩되어 있습니다. 중요한 것은 콜백 중에"," ",e("strong",{children:"어떤 참조로 프로퍼티를 읽는가(READ)"}),"입니다."]}),e(t,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2 });

const anotherRef = watch();  // 언바운드 참조

// 콜백은 innerRef를 받습니다
const outerRef = watch((innerRef, isFirst) => {
  // innerRef로 x 읽기 → x가 추적됨
  console.log('x 변경됨:', innerRef.x.value);

  // 언바운드 참조로 y 읽기 → y는 추적되지 않음
  console.log('y 값:', anotherRef.y.value);
});

// 둘 다 콜백 트리거 (x는 innerRef로 읽었음)
outerRef.x.value = 10;
// ✓ 로그: "x 변경됨: 10"

anotherRef.x.value = 20;
// ✓ 로그: "x 변경됨: 20" (x가 추적되어 있음!)

// 둘 다 콜백 트리거 안 함 (y는 언바운드 참조로 읽었음)
outerRef.y.value = 10;    // ✗ 트리거 안 함
anotherRef.y.value = 20;  // ✗ 트리거 안 함`}),e("p",{children:[e("strong",{children:"핵심 원칙"}),": 추적은 구독 중에 어떤 참조로 프로퍼티를 읽었는가(READ)에 기반하며, 나중에 어떤 참조로 쓰는가(WRITE)는 상관없습니다."]}),e("h2",{children:"AbortController로 구독 취소하기"}),e("p",{children:[e("code",{children:"AbortController"}),"를 사용하여 구독을 취소합니다:"]}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0 });
const controller = new AbortController();

// 콜백에서 abort 시그널 반환
watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  return controller.signal;
});

const store = watch();
store.count.value = 1; // ✓ 콜백 트리거

// 구독 취소
controller.abort();

store.count.value = 2; // ✗ 콜백 트리거하지 않음 (구독 취소됨)`}),e("h2",{children:"여러 구독"}),e("p",{children:"동일한 스토어에 여러 독립적인 구독을 만들 수 있습니다:"}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0 });

// 첫 번째 구독
const ref1 = watch((store) => {
  console.log('구독 1:', store.count.value);
});

// 두 번째 구독
const ref2 = watch((store) => {
  console.log('구독 2:', store.count.value);
});

// 두 구독은 독립적입니다
ref1.count.value = 10;
// 출력:
// "구독 1: 10"

ref2.count.value = 20;
// 출력:
// "구독 2: 20"`}),e("h2",{children:"참조 접근과 구독 결합하기"}),e("p",{children:"구독 콜백은 추적되는 참조를 반환하며, 즉시 사용할 수 있습니다:"}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0, name: 'StateRef' });

// 구독하고 추적되는 참조 얻기
const trackedStore = watch((store) => {
  console.log('상태 변경됨:', store.count.value);
});

// 다른 작업을 위해 추적되지 않는 참조도 얻기
const untrackedStore = watch();

// 추적되는 참조를 통한 업데이트 - 콜백 트리거
trackedStore.count.value = 5;
// ✓ 로그: "상태 변경됨: 5"

// 추적되지 않는 참조로 써도, 이미 추적된 경로라면 콜백이 실행됩니다
untrackedStore.count.value = 10;
// ✓ 로그: "상태 변경됨: 10"`}),e("h2",{children:"선택적 프로퍼티 추적"}),e("p",{children:"구독은 콜백 내에서 접근된 프로퍼티만 추적합니다:"}),e(t,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2, z: 3 });

const store = watch((innerRef) => {
  // x만 접근하므로, x 변경만 이 콜백을 트리거합니다
  console.log('x 변경됨:', innerRef.x.value);
});

store.x.value = 10; // ✓ 콜백 트리거
store.y.value = 20; // ✗ 트리거하지 않음 (y는 접근하지 않음)
store.z.value = 30; // ✗ 트리거하지 않음 (z는 접근하지 않음)`}),e("h2",{children:"일반적인 패턴"}),e("h3",{children:"컴포넌트 통합"}),e(t,{language:"typescript",code:`// UI 프레임워크 컴포넌트에서
const MyComponent = () => {
  const store = appWatch((innerRef) => {
    // count 변경 시 리렌더링 트리거
    console.log('Count 업데이트됨:', innerRef.count.value);

    // 컴포넌트의 정리 시그널 반환
    return cleanupSignal;
  });

  return <div>{store.count.value}</div>;
};`}),e("h3",{children:"파생 상태"}),e(t,{language:"typescript",code:`const watch = createStore({ firstName: 'John', lastName: 'Doe' });

watch((store) => {
  const fullName = \`\${store.firstName.value} \${store.lastName.value}\`;
  console.log('전체 이름:', fullName);
});

const store = watch();
store.firstName.value = 'Jane';
// 로그: "전체 이름: Jane Doe"`}),e("h3",{children:"사이드 이펙트"}),e(t,{language:"typescript",code:`const watch = createStore({ userId: null });

watch((store, isFirst) => {
  // 먼저 .value에 접근하여 구독 수집
  const userId = store.userId.value;
  if (!isFirst && userId) {
    // userId 변경 시 사용자 데이터 가져오기
    fetchUserData(userId);
  }
});`}),e("h2",{children:"모범 사례"}),e("ul",{children:[e("li",{children:[e("strong",{children:"초기화에 isFirst 사용"})," - 설정 로직과 업데이트 로직 구분"]}),e("li",{children:[e("strong",{children:"정리를 위해 AbortSignal 반환"})," - 컴포넌트에서 항상 구독 정리"]}),e("li",{children:[e("strong",{children:"추적에 주의"})," - outerRef(구독이 반환한 참조)만 추적됨"]}),e("li",{children:[e("strong",{children:"필요한 프로퍼티만 접근"})," - 구독은 접근된 프로퍼티만 추적"]}),e("li",{children:[e("strong",{children:"루프에서 참조 생성 금지"})," - 모듈 또는 컴포넌트 레벨에서 watch 참조 생성"]})]}),e("h2",{children:"타입 안전성"}),e("p",{children:"watch 함수는 TypeScript와 완전히 타입이 지정됩니다:"}),e(t,{language:"typescript",code:`interface User {
  id: number;
  name: string;
  email: string;
}

const watch = createStore<User>({
  id: 1,
  name: 'John',
  email: 'john@example.com'
});

// 타입 안전한 참조 접근
const store = watch();
store.name.value = 'Jane';      // ✓ OK
store.age.value = 30;            // ✗ 에러: 프로퍼티 'age'가 존재하지 않음

// 타입 안전한 구독
watch((innerRef) => {
  const name: string = innerRef.name.value;  // ✓ 타입이 올바르게 추론됨
  const id: number = innerRef.id.value;      // ✓ 타입이 올바르게 추론됨
});`}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - watch 함수를 반환하는 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/references",children:"참조 이해하기"})," - innerRef, outerRef, 언바운드 참조 심층 분석"]}),e("li",{children:[e("a",{href:"#/ko/guide/subscription",children:"구독"})," - 고급 구독 패턴"]}),e("li",{children:[e("a",{href:"#/ko/guide/state-ref-store",children:"StateRefStore"})," - 스토어 참조 다루기"]})]})]})),va=u(()=>()=>e("div",{children:[e("h1",{children:"Understanding References"}),e("p",{children:["StateRef uses a reference-based tracking system to determine which state changes should trigger subscriptions. Understanding the difference between ",e("strong",{children:"innerRef"}),", ",e("strong",{children:"outerRef"}),", and"," ",e("strong",{children:"unbound references"})," is crucial for effective state management."]}),e("h2",{children:"Three Types of References"}),e("p",{children:"When working with StateRef, you'll encounter three types of references:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"innerRef"})," - The reference passed as the first parameter to subscription callbacks"]}),e("li",{children:[e("strong",{children:"outerRef"})," - The reference returned by"," ",e("code",{children:"watch()"})," when subscribing"]}),e("li",{children:[e("strong",{children:"Unbound reference"})," - References created by calling"," ",e("code",{children:"watch()"})," without a callback"]})]}),e("h2",{children:"InnerRef and OuterRef: The Same Reference"}),e("p",{children:["The most important concept to understand is that"," ",e("strong",{children:"innerRef and outerRef are the same reference"}),". Both are bound to the subscription and tracked for changes."]}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

const watch = createStore({ rowCount: 5, columnCount: 10 });

const subscribeCallback = (innerRef, isFirst) => {
  const matrixCount = innerRef.rowCount.value * innerRef.columnCount.value;
  console.log('Matrix count:', matrixCount);
};

// outerRef: Returned by watch(), bound to subscribeCallback
const outerRef = watch(subscribeCallback);

// Key insight: innerRef and outerRef are the SAME reference
// Both are tracked by the subscription`}),e("h2",{children:"Key Principle: Tracking is Based on Reading, Not Writing"}),e("p",{children:["The most important concept:"," ",e("strong",{children:"What matters is which reference you use to READ a property during subscription, not which reference you use to WRITE it later"}),"."]}),e(t,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2 });

const anotherRef = watch();  // Unbound reference

const outerRef = watch((innerRef) => {
  // Reading x via innerRef → x is TRACKED
  console.log('x changed:', innerRef.x.value);

  // Reading y via anotherRef → y is NOT tracked
  console.log('y value:', anotherRef.y.value);
});

// Both trigger the callback (x was read via innerRef)
outerRef.x.value = 10;    // ✓ Triggers callback
anotherRef.x.value = 20;  // ✓ Triggers callback (because x is tracked!)

// Neither triggers the callback (y was read via anotherRef)
outerRef.y.value = 10;    // ✗ Does NOT trigger (y not tracked)
anotherRef.y.value = 20;  // ✗ Does NOT trigger (y not tracked)`}),e("h2",{children:"Unbound References"}),e("p",{children:["An unbound reference is created by calling ",e("code",{children:"watch()"})," without a callback. These references can read and write state but don't register any tracking."]}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0, name: 'StateRef' });

// Unbound reference - no tracking
const unboundRef = watch();

// Read values
console.log(unboundRef.count.value);  // 0

// Writes notify any existing subscriber that tracks count; this ref adds none
unboundRef.count.value = 10;

// This reference exists independently of any subscription`}),e("h2",{children:"Selective Property Tracking"}),e("p",{children:["Only properties"," ",e("strong",{children:"read via tracked references (innerRef/outerRef)"})," within the subscription callback are tracked. Once a property is tracked,"," ",e("strong",{children:"any reference can modify it and trigger the callback"}),"."]}),e(t,{language:"typescript",code:`const watch = createStore({
  rowCount: 5,
  columnCount: 10,
  etcCount: 3
});

// Create an unbound reference BEFORE subscription
const anotherRef = watch();

const subscribeCallback = (innerRef, isFirst) => {
  const result =
    innerRef.rowCount.value *      // ← Read via innerRef → TRACKED
    innerRef.columnCount.value *   // ← Read via innerRef → TRACKED
    anotherRef.etcCount.value;     // ← Read via unbound ref → NOT tracked

  console.log('Result:', result);
};

const outerRef = watch(subscribeCallback);

// Both trigger (rowCount was READ via innerRef → tracked)
anotherRef.rowCount.value = 10;     // ✓ Triggers
outerRef.rowCount.value = 15;       // ✓ Triggers

// Both trigger (columnCount was READ via innerRef → tracked)
anotherRef.columnCount.value = 5;   // ✓ Triggers
outerRef.columnCount.value = 8;     // ✓ Triggers

// Neither triggers (etcCount was READ via unbound ref → not tracked)
anotherRef.etcCount.value = 2;      // ✗ Does NOT trigger
outerRef.etcCount.value = 7;        // ✗ Does NOT trigger`}),e("p",{children:[e("strong",{children:"Key principle"}),": Tracking is determined by"," ",e("em",{children:"which reference was used to READ the property during subscription"}),", not which reference is used to WRITE it later. Once tracked, any write triggers the callback."]}),e("h2",{children:"Why This Design?"}),e("p",{children:"This reference-based tracking system provides several benefits:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Fine-grained control"})," - You decide exactly which properties trigger updates"]}),e("li",{children:[e("strong",{children:"Performance"})," - Only tracked properties cause re-renders"]}),e("li",{children:[e("strong",{children:"Flexibility"})," - Mix tracked and untracked access in the same callback"]}),e("li",{children:[e("strong",{children:"UI integration"})," - OuterRef makes component integration seamless"]})]}),e("h2",{children:"Practical Example: Component Integration"}),e("p",{children:"The outerRef design makes UI library integration particularly elegant. Here's an example using a hypothetical component framework:"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

const watch = createStore({ count: 0 });

const Component = mount((renew) => {
  // Pass renew as the subscription callback
  // It returns outerRef for use in the component
  const countRef = watch(renew);

  const increment = () => {
    // Update via outerRef - triggers renew
    countRef.value += 1;
  };

  return () => (
    <button onClick={increment}>
      Count: {countRef.value}
    </button>
  );
});`}),e("h2",{children:"Multiple Independent Subscriptions"}),e("p",{children:"Each subscription has its own tracking context based on what properties were READ during its callback. Multiple subscriptions can coexist independently:"}),e(t,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2 });

// First subscription: reads x → tracks x
const ref1 = watch((innerRef) => {
  console.log('Subscription 1 - x:', innerRef.x.value);
});

// Second subscription: reads y → tracks y
const ref2 = watch((innerRef) => {
  console.log('Subscription 2 - y:', innerRef.y.value);
});

// Triggers only first subscription (only subscription 1 tracks x)
ref1.x.value = 10;  // Logs: "Subscription 1 - x: 10"
ref2.x.value = 15;  // Also logs: "Subscription 1 - x: 15"

// Triggers only second subscription (only subscription 2 tracks y)
ref2.y.value = 20;  // Logs: "Subscription 2 - y: 20"
ref1.y.value = 25;  // Also logs: "Subscription 2 - y: 25"

// Each subscription has independent tracking`}),e("h2",{children:"Common Patterns"}),e("h3",{children:"Avoiding Unintended Tracking"}),e(t,{language:"typescript",code:`const watch = createStore({ config: { theme: 'dark' }, data: [] });

// Create unbound ref for config (read-only, shouldn't trigger updates)
const configRef = watch();

const dataRef = watch((innerRef) => {
  // Only track data changes, not config
  console.log('Data updated:', innerRef.data.value);
  console.log('Current theme:', configRef.config.theme.value);
});

// Triggers callback (data is tracked)
dataRef.data.value = [1, 2, 3];

// Doesn't trigger callback (config accessed via unbound ref)
configRef.config.theme.value = 'light';`}),e("h3",{children:"Mixed Tracking Strategy"}),e(t,{language:"typescript",code:`const watch = createStore({
  settings: { lang: 'en', notifications: true },
  user: { name: 'John', email: 'john@example.com' }
});

const settingsRef = watch();  // Unbound - for static config

const userRef = watch((innerRef) => {
  // Track user changes
  console.log('User:', innerRef.name.value, innerRef.email.value);

  // Access settings without tracking
  console.log('Language:', settingsRef.settings.lang.value);
});

// Triggers callback
userRef.name.value = 'Jane';

// Doesn't trigger callback
settingsRef.settings.lang.value = 'ko';`}),e("h2",{children:"Visual Summary"}),e(t,{language:"typescript",code:`const watch = createStore({ a: 1, b: 2, c: 3 });

// ┌──────────────────────────────────────────┐
// │  Subscription Callback                   │
// ├──────────────────────────────────────────┤
// │  innerRef.a.value  ← READ via innerRef   │
// │  innerRef.b.value  ← READ via innerRef   │
// │  (c is never read)                       │
// └──────────────────────────────────────────┘
//         ↓
// ┌──────────────────────────────────────────┐
// │  Tracking Result                         │
// │  - 'a' is TRACKED                        │
// │  - 'b' is TRACKED                        │
// │  - 'c' is NOT tracked                    │
// └──────────────────────────────────────────┘
//         ↓
// ┌──────────────────────────────────────────┐
// │  ANY write to tracked properties         │
// │  triggers the callback                   │
// │                                          │
// │  outerRef.a.value = 10   ✓ triggers      │
// │  unboundRef.a.value = 10 ✓ triggers      │
// │  outerRef.b.value = 20   ✓ triggers      │
// │  unboundRef.b.value = 20 ✓ triggers      │
// │                                          │
// │  outerRef.c.value = 30   ✗ no trigger    │
// │  unboundRef.c.value = 30 ✗ no trigger    │
// └──────────────────────────────────────────┘

const outerRef = watch((innerRef) => {
  console.log(innerRef.a.value, innerRef.b.value);
});

const unboundRef = watch();

// Both trigger because 'a' was READ via innerRef
unboundRef.a.value = 10;  // ✓ Triggers
outerRef.a.value = 20;    // ✓ Triggers`}),e("h2",{children:"Best Practices"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Read via innerRef to track"})," - Properties read via innerRef/outerRef are tracked; read via unbound refs to avoid tracking"]}),e("li",{children:[e("strong",{children:"Use unbound refs for static data"})," - Read configuration or constants via unbound refs so they don't trigger updates"]}),e("li",{children:[e("strong",{children:"Be explicit about tracking"})," - Make it clear which properties are tracked by choosing the right ref for reading"]}),e("li",{children:[e("strong",{children:"Remember: READ determines tracking, WRITE doesn't"})," - Any ref can trigger updates to tracked properties"]}),e("li",{children:[e("strong",{children:"Leverage outerRef for components"})," - Makes UI library integration natural"]}),e("li",{children:[e("strong",{children:"Understand the tracking context"})," - Each subscription has independent tracking"]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - Understanding the watch function API"]}),e("li",{children:[e("a",{href:"#/guide/subscription",children:"Subscription"})," - Advanced subscription patterns"]}),e("li",{children:[e("a",{href:"#/guide/state-ref-store",children:"StateRefStore"})," - Working with store references"]}),e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - Creating stores"]})]})]})),wa=u(()=>()=>e("div",{children:[e("h1",{children:"참조 이해하기"}),e("p",{children:["StateRef는 참조 기반 추적 시스템을 사용하여 어떤 상태 변경이 구독을 트리거해야 하는지 결정합니다.",e("strong",{children:"innerRef"}),", ",e("strong",{children:"outerRef"}),","," ",e("strong",{children:"언바운드 참조"}),"의 차이를 이해하는 것은 효과적인 상태 관리에 필수적입니다."]}),e("h2",{children:"세 가지 참조 타입"}),e("p",{children:"StateRef를 사용할 때 세 가지 타입의 참조를 만나게 됩니다:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"innerRef"})," - 구독 콜백의 첫 번째 파라미터로 전달되는 참조"]}),e("li",{children:[e("strong",{children:"outerRef"})," - 구독 시 ",e("code",{children:"watch()"}),"가 반환하는 참조"]}),e("li",{children:[e("strong",{children:"언바운드 참조"})," - 콜백 없이 ",e("code",{children:"watch()"}),"를 호출하여 생성된 참조"]})]}),e("h2",{children:"InnerRef와 OuterRef: 동일한 참조"}),e("p",{children:["이해해야 할 가장 중요한 개념은"," ",e("strong",{children:"innerRef와 outerRef가 동일한 참조"}),"라는 것입니다. 둘 다 구독에 바인딩되어 있으며 변경 사항이 추적됩니다."]}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

const watch = createStore({ rowCount: 5, columnCount: 10 });

const subscribeCallback = (innerRef, isFirst) => {
  const matrixCount = innerRef.rowCount.value * innerRef.columnCount.value;
  console.log('매트릭스 개수:', matrixCount);
};

// outerRef: watch()가 반환, subscribeCallback에 바인딩됨
const outerRef = watch(subscribeCallback);

// 핵심 인사이트: innerRef와 outerRef는 동일한 참조입니다
// 둘 다 구독에 의해 추적됩니다`}),e("h2",{children:"핵심 원칙: 추적은 읽기 기반이지, 쓰기 기반이 아닙니다"}),e("p",{children:["가장 중요한 개념:"," ",e("strong",{children:"중요한 것은 구독 중에 어떤 참조로 프로퍼티를 읽었는가(READ)이며, 나중에 어떤 참조로 쓰는가(WRITE)는 상관없습니다"}),"."]}),e(t,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2 });

const anotherRef = watch();  // 언바운드 참조

const outerRef = watch((innerRef) => {
  // innerRef로 x 읽기 → x가 추적됨
  console.log('x 변경됨:', innerRef.x.value);

  // anotherRef로 y 읽기 → y는 추적되지 않음
  console.log('y 값:', anotherRef.y.value);
});

// 둘 다 콜백 트리거 (x는 innerRef로 읽었음)
outerRef.x.value = 10;    // ✓ 콜백 트리거
anotherRef.x.value = 20;  // ✓ 콜백 트리거 (x가 추적되기 때문!)

// 둘 다 콜백 트리거 안 함 (y는 anotherRef로 읽었음)
outerRef.y.value = 10;    // ✗ 트리거 안 함 (y 추적 안 됨)
anotherRef.y.value = 20;  // ✗ 트리거 안 함 (y 추적 안 됨)`}),e("h2",{children:"언바운드 참조"}),e("p",{children:["언바운드 참조는 콜백 없이 ",e("code",{children:"watch()"}),"를 호출하여 생성됩니다. 이러한 참조는 상태를 읽고 쓸 수 있지만 추적을 등록하지 않습니다."]}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0, name: 'StateRef' });

// 언바운드 참조 - 추적 없음
const unboundRef = watch();

// 값 읽기
console.log(unboundRef.count.value);  // 0

// 값 쓰기 - count를 추적 중인 기존 구독에는 알림, 이 참조는 구독하지 않음
unboundRef.count.value = 10;

// 이 참조는 어떤 구독과도 독립적으로 존재합니다`}),e("h2",{children:"선택적 프로퍼티 추적"}),e("p",{children:["구독 콜백 내에서"," ",e("strong",{children:"추적되는 참조(innerRef/outerRef)를 통해 읽은"})," 프로퍼티만 추적됩니다. 프로퍼티가 일단 추적되면,"," ",e("strong",{children:"어떤 참조로든 수정하면 콜백이 트리거됩니다"}),"."]}),e(t,{language:"typescript",code:`const watch = createStore({
  rowCount: 5,
  columnCount: 10,
  etcCount: 3
});

// 구독 전에 언바운드 참조 생성
const anotherRef = watch();

const subscribeCallback = (innerRef, isFirst) => {
  const result =
    innerRef.rowCount.value *      // ← innerRef로 읽음 → 추적됨
    innerRef.columnCount.value *   // ← innerRef로 읽음 → 추적됨
    anotherRef.etcCount.value;     // ← 언바운드 참조로 읽음 → 추적 안 됨

  console.log('결과:', result);
};

const outerRef = watch(subscribeCallback);

// 둘 다 트리거 (rowCount는 innerRef로 읽었음 → 추적됨)
anotherRef.rowCount.value = 10;     // ✓ 트리거
outerRef.rowCount.value = 15;       // ✓ 트리거

// 둘 다 트리거 (columnCount는 innerRef로 읽었음 → 추적됨)
anotherRef.columnCount.value = 5;   // ✓ 트리거
outerRef.columnCount.value = 8;     // ✓ 트리거

// 둘 다 트리거 안 함 (etcCount는 언바운드 참조로 읽었음 → 추적 안 됨)
anotherRef.etcCount.value = 2;      // ✗ 트리거 안 함
outerRef.etcCount.value = 7;        // ✗ 트리거 안 함`}),e("p",{children:[e("strong",{children:"핵심 원칙"}),": 추적은"," ",e("em",{children:"구독 중에 어떤 참조로 프로퍼티를 읽었는지(READ)"}),"에 의해 결정되며, 나중에 어떤 참조로 쓰는지(WRITE)는 상관없습니다. 일단 추적되면, 어떤 쓰기든 콜백을 트리거합니다."]}),e("h2",{children:"왜 이런 디자인인가?"}),e("p",{children:"이 참조 기반 추적 시스템은 여러 이점을 제공합니다:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"세밀한 제어"})," - 어떤 프로퍼티가 업데이트를 트리거할지 정확하게 결정"]}),e("li",{children:[e("strong",{children:"성능"})," - 추적된 프로퍼티만 리렌더링을 발생시킴"]}),e("li",{children:[e("strong",{children:"유연성"})," - 동일한 콜백에서 추적되는 접근과 추적되지 않는 접근을 혼합"]}),e("li",{children:[e("strong",{children:"UI 통합"})," - OuterRef가 컴포넌트 통합을 원활하게 만듦"]})]}),e("h2",{children:"실용 예제: 컴포넌트 통합"}),e("p",{children:"outerRef 디자인은 UI 라이브러리 통합을 특히 우아하게 만듭니다. 가상의 컴포넌트 프레임워크를 사용한 예제입니다:"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

const watch = createStore({ count: 0 });

const Component = mount((renew) => {
  // renew를 구독 콜백으로 전달
  // 컴포넌트에서 사용할 outerRef를 반환
  const countRef = watch(renew);

  const increment = () => {
    // outerRef를 통한 업데이트 - renew 트리거
    countRef.value += 1;
  };

  return () => (
    <button onClick={increment}>
      Count: {countRef.value}
    </button>
  );
});`}),e("h2",{children:"여러 독립적인 구독"}),e("p",{children:"각 구독은 콜백 중에 읽은(READ) 프로퍼티에 기반한 자체 추적 컨텍스트를 가집니다. 여러 구독이 독립적으로 공존할 수 있습니다:"}),e(t,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2 });

// 첫 번째 구독: x 읽음 → x 추적
const ref1 = watch((innerRef) => {
  console.log('구독 1 - x:', innerRef.x.value);
});

// 두 번째 구독: y 읽음 → y 추적
const ref2 = watch((innerRef) => {
  console.log('구독 2 - y:', innerRef.y.value);
});

// 첫 번째 구독만 트리거 (구독 1만 x를 추적)
ref1.x.value = 10;  // 로그: "구독 1 - x: 10"
ref2.x.value = 15;  // 역시 로그: "구독 1 - x: 15"

// 두 번째 구독만 트리거 (구독 2만 y를 추적)
ref2.y.value = 20;  // 로그: "구독 2 - y: 20"
ref1.y.value = 25;  // 역시 로그: "구독 2 - y: 25"

// 각 구독은 독립적인 추적을 가집니다`}),e("h2",{children:"일반적인 패턴"}),e("h3",{children:"의도하지 않은 추적 방지"}),e(t,{language:"typescript",code:`const watch = createStore({ config: { theme: 'dark' }, data: [] });

// config를 위한 언바운드 참조 생성 (읽기 전용, 업데이트를 트리거하면 안 됨)
const configRef = watch();

const dataRef = watch((innerRef) => {
  // data 변경만 추적, config는 추적하지 않음
  console.log('데이터 업데이트됨:', innerRef.data.value);
  console.log('현재 테마:', configRef.config.theme.value);
});

// 콜백 트리거 (data가 추적됨)
dataRef.data.value = [1, 2, 3];

// 콜백 트리거하지 않음 (config는 언바운드 참조를 통해 접근됨)
configRef.config.theme.value = 'light';`}),e("h3",{children:"혼합 추적 전략"}),e(t,{language:"typescript",code:`const watch = createStore({
  settings: { lang: 'ko', notifications: true },
  user: { name: 'John', email: 'john@example.com' }
});

const settingsRef = watch();  // 언바운드 - 정적 설정용

const userRef = watch((innerRef) => {
  // user 변경 추적
  console.log('사용자:', innerRef.name.value, innerRef.email.value);

  // 추적 없이 settings 접근
  console.log('언어:', settingsRef.settings.lang.value);
});

// 콜백 트리거
userRef.name.value = 'Jane';

// 콜백 트리거하지 않음
settingsRef.settings.lang.value = 'en';`}),e("h2",{children:"시각적 요약"}),e(t,{language:"typescript",code:`const watch = createStore({ a: 1, b: 2, c: 3 });

// ┌──────────────────────────────────────────┐
// │  구독 콜백                               │
// ├──────────────────────────────────────────┤
// │  innerRef.a.value  ← innerRef로 읽음     │
// │  innerRef.b.value  ← innerRef로 읽음     │
// │  (c는 읽지 않음)                         │
// └──────────────────────────────────────────┘
//         ↓
// ┌──────────────────────────────────────────┐
// │  추적 결과                               │
// │  - 'a'가 추적됨                          │
// │  - 'b'가 추적됨                          │
// │  - 'c'는 추적 안 됨                      │
// └──────────────────────────────────────────┘
//         ↓
// ┌──────────────────────────────────────────┐
// │  추적된 프로퍼티에 대한 모든 쓰기는      │
// │  콜백을 트리거합니다                     │
// │                                          │
// │  outerRef.a.value = 10   ✓ 트리거        │
// │  unboundRef.a.value = 10 ✓ 트리거        │
// │  outerRef.b.value = 20   ✓ 트리거        │
// │  unboundRef.b.value = 20 ✓ 트리거        │
// │                                          │
// │  outerRef.c.value = 30   ✗ 트리거 안 함  │
// │  unboundRef.c.value = 30 ✗ 트리거 안 함  │
// └──────────────────────────────────────────┘

const outerRef = watch((innerRef) => {
  console.log(innerRef.a.value, innerRef.b.value);
});

const unboundRef = watch();

// 둘 다 트리거 ('a'는 innerRef로 읽었음)
unboundRef.a.value = 10;  // ✓ 트리거
outerRef.a.value = 20;    // ✓ 트리거`}),e("h2",{children:"모범 사례"}),e("ul",{children:[e("li",{children:[e("strong",{children:"추적하려면 innerRef로 읽기"})," - innerRef/outerRef로 읽은 프로퍼티는 추적됨; 추적을 피하려면 언바운드 참조로 읽기"]}),e("li",{children:[e("strong",{children:"정적 데이터에 언바운드 참조 사용"})," - 설정이나 상수는 언바운드 참조로 읽어서 업데이트를 트리거하지 않도록 하기"]}),e("li",{children:[e("strong",{children:"추적에 대해 명시적으로"})," - 읽기에 올바른 참조를 선택하여 어떤 프로퍼티가 추적되는지 명확히 하기"]}),e("li",{children:[e("strong",{children:"기억하기: 읽기(READ)가 추적을 결정, 쓰기(WRITE)는 아님"})," ","- 어떤 참조든 추적된 프로퍼티에 대한 업데이트를 트리거 가능"]}),e("li",{children:[e("strong",{children:"컴포넌트에 outerRef 활용"})," - UI 라이브러리 통합을 자연스럽게 만듦"]}),e("li",{children:[e("strong",{children:"추적 컨텍스트 이해"})," - 각 구독은 독립적인 추적을 가짐"]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - watch 함수 API 이해하기"]}),e("li",{children:[e("a",{href:"#/ko/guide/subscription",children:"구독"})," - 고급 구독 패턴"]}),e("li",{children:[e("a",{href:"#/ko/guide/state-ref-store",children:"StateRefStore"})," - 스토어 참조 다루기"]}),e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 스토어 생성"]})]})]})),Sa=u(()=>()=>e("div",{children:[e("h1",{children:"StateRefStore"}),e("p",{children:[e("code",{children:"StateRefStore"})," is the proxied reference type returned by the"," ",e("code",{children:"watch()"})," function. It wraps your state with a Proxy that enables reactive tracking and provides access to values through the"," ",e("code",{children:".value"})," property."]}),e("h2",{children:"The .value Property"}),e("p",{children:["All state access in StateRef happens through the ",e("code",{children:".value"})," ","property. This is the fundamental interface for both reading and writing state:"]}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

const watch = createStore({ count: 0, name: 'StateRef' });
const store = watch();

// Read values via .value
const currentCount = store.count.value;      // 0
const currentName = store.name.value;        // 'StateRef'

// Write values via .value
store.count.value = 10;
store.name.value = 'Updated';

console.log(store.count.value);  // 10`}),e("h2",{children:"Proxy-Based Reactivity"}),e("p",{children:"StateRefStore uses JavaScript Proxies to intercept property access. When you access a property, you get another proxy wrapping that nested value:"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: {
    profile: {
      name: 'John',
      age: 30
    }
  }
});

const store = watch();

// Each property access returns a proxy
console.log(store);              // Proxy wrapping entire state
console.log(store.user);         // Proxy wrapping user object
console.log(store.user.profile); // Proxy wrapping profile object

// Only .value gives you the actual value
console.log(store.user.profile.name.value);  // 'John' (actual string)`}),e("h2",{children:"Deep Nested Access"}),e("p",{children:"StateRefStore supports arbitrarily deep nesting. Each level returns a new proxy, allowing natural chained property access:"}),e(t,{language:"typescript",code:`const watch = createStore({
  company: {
    departments: {
      engineering: {
        teams: {
          frontend: {
            members: ['Alice', 'Bob']
          }
        }
      }
    }
  }
});

const store = watch();

// Deep nested read
const members = store.company.departments.engineering.teams.frontend.members.value;
console.log(members);  // ['Alice', 'Bob']

// Deep nested write
store.company.departments.engineering.teams.frontend.members.value = [
  'Alice', 'Bob', 'Charlie'
];`}),e("h2",{children:"Working with Objects"}),e("p",{children:"When working with object properties, you can update individual fields or replace entire objects:"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: {
    name: 'John',
    age: 30,
    email: 'john@example.com'
  }
});

const store = watch();

// Update individual properties
store.user.name.value = 'Jane';
store.user.age.value = 31;

// Replace entire object
store.user.value = {
  name: 'Bob',
  age: 25,
  email: 'bob@example.com'
};`}),e("h2",{children:"Working with Arrays"}),e("p",{children:"Arrays work seamlessly with StateRefStore, supporting both index access and array replacement:"}),e(t,{language:"typescript",code:`const watch = createStore({
  todos: [
    { id: 1, text: 'Learn StateRef', done: false },
    { id: 2, text: 'Build app', done: false }
  ]
});

const store = watch();

// Access array elements by index
console.log(store.todos[0].text.value);  // 'Learn StateRef'

// Update array element properties
store.todos[0].done.value = true;

// Update entire array element
store.todos[1].value = { id: 2, text: 'Build amazing app', done: true };

// Replace entire array (creates new reference)
store.todos.value = [
  { id: 1, text: 'New task', done: false }
];

// Array methods work on .value
const currentTodos = store.todos.value;
currentTodos.push({ id: 3, text: 'Deploy', done: false });
store.todos.value = [...currentTodos];  // Trigger update`}),e("h2",{children:"Copy-on-Write Semantics"}),e("p",{children:"StateRef uses copy-on-write to maintain immutability. When you update a nested property, only the path to that property is copied, sharing unchanged subtrees:"}),e(t,{language:"typescript",code:`const watch = createStore({
  a: { b: { c: 1 }, d: 2 },
  e: 3
});

const store = watch();

// Save original references
const originalA = store.a.value;
const originalB = store.a.b.value;

// Update deeply nested value
store.a.b.c.value = 10;

// Path to the change has new references
console.log(store.a.value === originalA);      // false (new reference)
console.log(store.a.b.value === originalB);    // false (new reference)

// Unchanged branches keep their references
const originalE = store.e.value;
console.log(store.e.value === originalE);      // true (same reference)`}),e("h2",{children:"Primitive Types"}),e("p",{children:["StateRefStore also works with primitive types (number, string, boolean). For primitives, the store itself has a ",e("code",{children:".value"})," property:"]}),e(t,{language:"typescript",code:`// Number store
const countWatch = createStore(0);
const count = countWatch();
console.log(count.value);  // 0
count.value = 10;
console.log(count.value);  // 10

// String store
const nameWatch = createStore('StateRef');
const name = nameWatch();
console.log(name.value);   // 'StateRef'
name.value = 'Updated';

// Boolean store
const toggleWatch = createStore(false);
const toggle = toggleWatch();
console.log(toggle.value);  // false
toggle.value = true;`}),e("h2",{children:"Type Safety with TypeScript"}),e("p",{children:"StateRefStore is fully typed with TypeScript, providing autocomplete and type checking:"}),e(t,{language:"typescript",code:`interface User {
  id: number;
  name: string;
  email: string;
}

const watch = createStore<User>({
  id: 1,
  name: 'John',
  email: 'john@example.com'
});

const store = watch();

// TypeScript knows the structure
store.name.value = 'Jane';         // ✓ OK
store.email.value = 'jane@...';    // ✓ OK

store.age.value = 30;               // ✗ Error: Property 'age' does not exist
store.name.value = 123;             // ✗ Error: Type 'number' is not assignable to 'string'

// Type inference works
const userName: string = store.name.value;  // ✓ Correctly inferred as string
const userId: number = store.id.value;      // ✓ Correctly inferred as number`}),e("h2",{children:"Reading Without .value"}),e("p",{children:["If you access a property without ",e("code",{children:".value"}),", you get the proxy itself, not the actual value:"]}),e(t,{language:"typescript",code:`const watch = createStore({ count: 10 });
const store = watch();

// Without .value - returns proxy
const countProxy = store.count;
console.log(countProxy);        // Proxy object

// With .value - returns actual value
const countValue = store.count.value;
console.log(countValue);        // 10

// Common mistake
if (store.count === 10) {       // ✗ Wrong: comparing proxy to number
  // This won't work as expected
}

// Correct way
if (store.count.value === 10) { // ✓ Correct: comparing value to number
  // This works
}`}),e("h2",{children:"Reference Equality"}),e("p",{children:"StateRefStore maintains reference equality for unchanged objects, which is crucial for optimization in UI frameworks:"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: { name: 'John' },
  settings: { theme: 'dark' }
});

const store = watch();

// Save references
const userRef1 = store.user.value;
const settingsRef1 = store.settings.value;

// Update settings
store.settings.theme.value = 'light';

// Get references again
const userRef2 = store.user.value;
const settingsRef2 = store.settings.value;

// User unchanged - same reference
console.log(userRef1 === userRef2);      // true

// Settings changed - new reference
console.log(settingsRef1 === settingsRef2);  // false`}),e("h2",{children:"Common Patterns"}),e("h3",{children:"Conditional Updates"}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0, max: 10 });
const store = watch();

const increment = () => {
  if (store.count.value < store.max.value) {
    store.count.value += 1;
  }
};`}),e("h3",{children:"Batch Updates"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: { name: '', email: '', age: 0 }
});
const store = watch();

// Individual updates (triggers subscription for each)
store.user.name.value = 'John';
store.user.email.value = 'john@example.com';
store.user.age.value = 30;

// Better: Single update (triggers subscription once)
store.user.value = {
  name: 'John',
  email: 'john@example.com',
  age: 30
};`}),e("h3",{children:"Reading for Computation"}),e(t,{language:"typescript",code:`const watch = createStore({
  width: 10,
  height: 20
});
const store = watch();

// Compute derived value
const area = store.width.value * store.height.value;
console.log(area);  // 200

// Update and recompute
store.width.value = 15;
const newArea = store.width.value * store.height.value;
console.log(newArea);  // 300`}),e("h2",{children:"Performance Considerations"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Proxy overhead is minimal"})," - Modern JavaScript engines optimize proxy access well"]}),e("li",{children:[e("strong",{children:"Copy-on-write is efficient"})," - Only changed paths are copied, unchanged data is shared"]}),e("li",{children:[e("strong",{children:"Reference equality enables optimization"})," - UI frameworks can skip rendering unchanged subtrees"]}),e("li",{children:[e("strong",{children:"Batch updates when possible"})," - Update entire objects instead of individual properties to reduce subscription triggers"]})]}),e("h2",{children:"Best Practices"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Always use .value for actual values"})," - Remember that property access without .value returns a proxy"]}),e("li",{children:[e("strong",{children:"Prefer immutable updates"})," - Replace objects/arrays rather than mutating them when possible"]}),e("li",{children:[e("strong",{children:"Leverage reference equality"})," - Use strict equality checks for optimization"]}),e("li",{children:[e("strong",{children:"Type your stores"})," - Use TypeScript interfaces for better type safety and autocomplete"]}),e("li",{children:[e("strong",{children:"Batch related updates"})," - Update entire objects to minimize subscription triggers"]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - Creating stores that return StateRefStore references"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - Getting StateRefStore references via watch"]}),e("li",{children:[e("a",{href:"#/guide/references",children:"Understanding References"})," - How StateRefStore references work with tracking"]}),e("li",{children:[e("a",{href:"#/guide/primitives",children:"Primitive Types"})," - Working with primitive type stores"]})]})]})),ka=u(()=>()=>e("div",{children:[e("h1",{children:"StateRefStore"}),e("p",{children:[e("code",{children:"StateRefStore"}),"는 ",e("code",{children:"watch()"})," 함수가 반환하는 프록시 참조 타입입니다. 상태를 Proxy로 감싸서 반응형 추적을 가능하게 하며"," ",e("code",{children:".value"})," 프로퍼티를 통해 값에 접근할 수 있도록 합니다."]}),e("h2",{children:".value 프로퍼티"}),e("p",{children:["StateRef의 모든 상태 접근은 ",e("code",{children:".value"})," 프로퍼티를 통해 이루어집니다. 이것은 상태를 읽고 쓰는 기본 인터페이스입니다:"]}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

const watch = createStore({ count: 0, name: 'StateRef' });
const store = watch();

// .value를 통해 값 읽기
const currentCount = store.count.value;      // 0
const currentName = store.name.value;        // 'StateRef'

// .value를 통해 값 쓰기
store.count.value = 10;
store.name.value = '업데이트됨';

console.log(store.count.value);  // 10`}),e("h2",{children:"프록시 기반 반응성"}),e("p",{children:"StateRefStore는 JavaScript Proxy를 사용하여 프로퍼티 접근을 가로챕니다. 프로퍼티에 접근하면 중첩된 값을 감싼 또 다른 프록시를 얻게 됩니다:"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: {
    profile: {
      name: 'John',
      age: 30
    }
  }
});

const store = watch();

// 각 프로퍼티 접근은 프록시를 반환합니다
console.log(store);              // 전체 상태를 감싼 Proxy
console.log(store.user);         // user 객체를 감싼 Proxy
console.log(store.user.profile); // profile 객체를 감싼 Proxy

// .value만 실제 값을 줍니다
console.log(store.user.profile.name.value);  // 'John' (실제 문자열)`}),e("h2",{children:"깊은 중첩 접근"}),e("p",{children:"StateRefStore는 임의로 깊은 중첩을 지원합니다. 각 레벨은 새 프록시를 반환하여 자연스러운 체인 프로퍼티 접근을 가능하게 합니다:"}),e(t,{language:"typescript",code:`const watch = createStore({
  company: {
    departments: {
      engineering: {
        teams: {
          frontend: {
            members: ['Alice', 'Bob']
          }
        }
      }
    }
  }
});

const store = watch();

// 깊은 중첩 읽기
const members = store.company.departments.engineering.teams.frontend.members.value;
console.log(members);  // ['Alice', 'Bob']

// 깊은 중첩 쓰기
store.company.departments.engineering.teams.frontend.members.value = [
  'Alice', 'Bob', 'Charlie'
];`}),e("h2",{children:"객체 다루기"}),e("p",{children:"객체 프로퍼티로 작업할 때 개별 필드를 업데이트하거나 전체 객체를 교체할 수 있습니다:"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: {
    name: 'John',
    age: 30,
    email: 'john@example.com'
  }
});

const store = watch();

// 개별 프로퍼티 업데이트
store.user.name.value = 'Jane';
store.user.age.value = 31;

// 전체 객체 교체
store.user.value = {
  name: 'Bob',
  age: 25,
  email: 'bob@example.com'
};`}),e("h2",{children:"배열 다루기"}),e("p",{children:"배열은 StateRefStore와 원활하게 작동하며, 인덱스 접근과 배열 교체를 모두 지원합니다:"}),e(t,{language:"typescript",code:`const watch = createStore({
  todos: [
    { id: 1, text: 'StateRef 배우기', done: false },
    { id: 2, text: '앱 만들기', done: false }
  ]
});

const store = watch();

// 인덱스로 배열 요소 접근
console.log(store.todos[0].text.value);  // 'StateRef 배우기'

// 배열 요소 프로퍼티 업데이트
store.todos[0].done.value = true;

// 전체 배열 요소 업데이트
store.todos[1].value = { id: 2, text: '멋진 앱 만들기', done: true };

// 전체 배열 교체 (새 참조 생성)
store.todos.value = [
  { id: 1, text: '새 작업', done: false }
];

// 배열 메서드는 .value에서 작동
const currentTodos = store.todos.value;
currentTodos.push({ id: 3, text: '배포', done: false });
store.todos.value = [...currentTodos];  // 업데이트 트리거`}),e("h2",{children:"Copy-on-Write 의미론"}),e("p",{children:"StateRef는 불변성을 유지하기 위해 copy-on-write를 사용합니다. 중첩된 프로퍼티를 업데이트하면 해당 프로퍼티로의 경로만 복사되고 변경되지 않은 하위 트리는 공유됩니다:"}),e(t,{language:"typescript",code:`const watch = createStore({
  a: { b: { c: 1 }, d: 2 },
  e: 3
});

const store = watch();

// 원본 참조 저장
const originalA = store.a.value;
const originalB = store.a.b.value;

// 깊게 중첩된 값 업데이트
store.a.b.c.value = 10;

// 변경 경로는 새 참조를 가짐
console.log(store.a.value === originalA);      // false (새 참조)
console.log(store.a.b.value === originalB);    // false (새 참조)

// 변경되지 않은 브랜치는 참조 유지
const originalE = store.e.value;
console.log(store.e.value === originalE);      // true (같은 참조)`}),e("h2",{children:"원시 타입"}),e("p",{children:["StateRefStore는 원시 타입(number, string, boolean)과도 작동합니다. 원시 타입의 경우 스토어 자체가 ",e("code",{children:".value"})," 프로퍼티를 가집니다:"]}),e(t,{language:"typescript",code:`// 숫자 스토어
const countWatch = createStore(0);
const count = countWatch();
console.log(count.value);  // 0
count.value = 10;
console.log(count.value);  // 10

// 문자열 스토어
const nameWatch = createStore('StateRef');
const name = nameWatch();
console.log(name.value);   // 'StateRef'
name.value = '업데이트됨';

// 불리언 스토어
const toggleWatch = createStore(false);
const toggle = toggleWatch();
console.log(toggle.value);  // false
toggle.value = true;`}),e("h2",{children:"TypeScript 타입 안전성"}),e("p",{children:"StateRefStore는 TypeScript와 완전히 타입이 지정되어 자동 완성과 타입 체크를 제공합니다:"}),e(t,{language:"typescript",code:`interface User {
  id: number;
  name: string;
  email: string;
}

const watch = createStore<User>({
  id: 1,
  name: 'John',
  email: 'john@example.com'
});

const store = watch();

// TypeScript가 구조를 알고 있음
store.name.value = 'Jane';         // ✓ OK
store.email.value = 'jane@...';    // ✓ OK

store.age.value = 30;               // ✗ 에러: 프로퍼티 'age'가 존재하지 않음
store.name.value = 123;             // ✗ 에러: 타입 'number'는 'string'에 할당할 수 없음

// 타입 추론이 작동
const userName: string = store.name.value;  // ✓ string으로 올바르게 추론
const userId: number = store.id.value;      // ✓ number로 올바르게 추론`}),e("h2",{children:".value 없이 읽기"}),e("p",{children:[e("code",{children:".value"})," 없이 프로퍼티에 접근하면 실제 값이 아닌 프록시 자체를 얻게 됩니다:"]}),e(t,{language:"typescript",code:`const watch = createStore({ count: 10 });
const store = watch();

// .value 없이 - 프록시 반환
const countProxy = store.count;
console.log(countProxy);        // Proxy 객체

// .value와 함께 - 실제 값 반환
const countValue = store.count.value;
console.log(countValue);        // 10

// 흔한 실수
if (store.count === 10) {       // ✗ 잘못됨: 프록시를 숫자와 비교
  // 예상대로 작동하지 않음
}

// 올바른 방법
if (store.count.value === 10) { // ✓ 올바름: 값을 숫자와 비교
  // 작동함
}`}),e("h2",{children:"참조 동등성"}),e("p",{children:"StateRefStore는 변경되지 않은 객체에 대해 참조 동등성을 유지하며, 이는 UI 프레임워크의 최적화에 중요합니다:"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: { name: 'John' },
  settings: { theme: 'dark' }
});

const store = watch();

// 참조 저장
const userRef1 = store.user.value;
const settingsRef1 = store.settings.value;

// settings 업데이트
store.settings.theme.value = 'light';

// 참조 다시 얻기
const userRef2 = store.user.value;
const settingsRef2 = store.settings.value;

// user 변경 없음 - 같은 참조
console.log(userRef1 === userRef2);      // true

// settings 변경됨 - 새 참조
console.log(settingsRef1 === settingsRef2);  // false`}),e("h2",{children:"일반적인 패턴"}),e("h3",{children:"조건부 업데이트"}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0, max: 10 });
const store = watch();

const increment = () => {
  if (store.count.value < store.max.value) {
    store.count.value += 1;
  }
};`}),e("h3",{children:"배치 업데이트"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: { name: '', email: '', age: 0 }
});
const store = watch();

// 개별 업데이트 (각각 구독 트리거)
store.user.name.value = 'John';
store.user.email.value = 'john@example.com';
store.user.age.value = 30;

// 더 나음: 단일 업데이트 (한 번만 구독 트리거)
store.user.value = {
  name: 'John',
  email: 'john@example.com',
  age: 30
};`}),e("h3",{children:"계산을 위한 읽기"}),e(t,{language:"typescript",code:`const watch = createStore({
  width: 10,
  height: 20
});
const store = watch();

// 파생 값 계산
const area = store.width.value * store.height.value;
console.log(area);  // 200

// 업데이트 및 재계산
store.width.value = 15;
const newArea = store.width.value * store.height.value;
console.log(newArea);  // 300`}),e("h2",{children:"성능 고려사항"}),e("ul",{children:[e("li",{children:[e("strong",{children:"프록시 오버헤드는 최소"})," - 최신 JavaScript 엔진은 프록시 접근을 잘 최적화함"]}),e("li",{children:[e("strong",{children:"Copy-on-write는 효율적"})," - 변경된 경로만 복사되고 변경되지 않은 데이터는 공유됨"]}),e("li",{children:[e("strong",{children:"참조 동등성이 최적화를 가능하게 함"})," - UI 프레임워크가 변경되지 않은 하위 트리의 렌더링을 건너뛸 수 있음"]}),e("li",{children:[e("strong",{children:"가능하면 배치 업데이트"})," - 개별 프로퍼티 대신 전체 객체를 업데이트하여 구독 트리거 줄이기"]})]}),e("h2",{children:"모범 사례"}),e("ul",{children:[e("li",{children:[e("strong",{children:"실제 값에는 항상 .value 사용"})," - .value 없는 프로퍼티 접근은 프록시를 반환한다는 것을 기억하기"]}),e("li",{children:[e("strong",{children:"불변 업데이트 선호"})," - 가능하면 객체/배열을 변경하지 말고 교체하기"]}),e("li",{children:[e("strong",{children:"참조 동등성 활용"})," - 최적화를 위해 엄격한 동등성 체크 사용"]}),e("li",{children:[e("strong",{children:"스토어에 타입 지정"})," - 더 나은 타입 안전성과 자동 완성을 위해 TypeScript 인터페이스 사용"]}),e("li",{children:[e("strong",{children:"관련 업데이트 배치"})," - 구독 트리거를 최소화하기 위해 전체 객체 업데이트"]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - StateRefStore 참조를 반환하는 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - watch를 통해 StateRefStore 참조 얻기"]}),e("li",{children:[e("a",{href:"#/ko/guide/references",children:"참조 이해하기"})," - StateRefStore 참조가 추적과 어떻게 작동하는지"]}),e("li",{children:[e("a",{href:"#/ko/guide/primitives",children:"원시 타입"})," - 원시 타입 스토어 다루기"]})]})]})),Ra=u(()=>()=>e("div",{children:[e("h1",{children:"Subscription"}),e("p",{children:["Subscriptions in StateRef allow you to react to state changes automatically. When you pass a callback to the ",e("code",{children:"watch()"})," ","function, it creates a subscription that runs whenever tracked properties change."]}),e("h2",{children:"Basic Subscription"}),e("p",{children:["Create a subscription by passing a callback function to"," ",e("code",{children:"watch()"}),":"]}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

const watch = createStore({ count: 0, name: 'StateRef' });

// Subscribe to changes
watch((store, isFirst) => {
  console.log('State changed!');
  console.log('Count:', store.count.value);
  console.log('Name:', store.name.value);
  console.log('Is first run?', isFirst);
});

// Trigger the subscription
const ref = watch();
ref.count.value = 10;  // Logs all the values above`}),e("h2",{children:"Subscription Callback Signature"}),e("p",{children:["The subscription callback receives two parameters and can optionally return an ",e("code",{children:"AbortSignal"}),":"]}),e(t,{language:"typescript",code:`type RenewCallback<T> = (
  store: StateRefStore<T>,
  isFirst: boolean
) => void | AbortSignal;

// Example usage
watch((store, isFirst) => {
  // store: StateRefStore - the tracked reference
  // isFirst: boolean - true on first execution, false on updates

  console.log(store.count.value);

  // Optionally return AbortSignal for cleanup
  return abortController.signal;
});`}),e("h2",{children:"The isFirst Parameter"}),e("p",{children:["The ",e("code",{children:"isFirst"})," parameter indicates whether this is the initial execution or a subsequent update. This is useful for setup logic:"]}),e(t,{language:"typescript",code:`const watch = createStore({ userId: null, data: null });

watch((store, isFirst) => {
  // Access .value first to collect subscription
  const userId = store.userId.value;

  if (isFirst) {
    // Runs only once on initial subscription
    console.log('Subscription initialized');
    return;
  }

  // Runs on every update
  if (userId) {
    console.log('Fetching data for user:', userId);
    fetchUserData(userId);
  }
});`}),e("h3",{children:"Common isFirst Patterns"}),e(t,{language:"typescript",code:`const watch = createStore({ items: [] });

// Pattern 1: Skip initial run
watch((store, isFirst) => {
  // Access .value first to collect subscription
  const items = store.items.value;
  if (isFirst) return;
  console.log('Items updated:', items);
});

// Pattern 2: Different logic for initial vs updates
watch((store, isFirst) => {
  const items = store.items.value;
  if (isFirst) {
    console.log('Initial items:', items);
  } else {
    console.log('Items changed to:', items);
  }
});

// Pattern 3: Run on both, but with conditional logic
watch((store, isFirst) => {
  console.log(isFirst ? 'Loading items' : 'Reloading items');
  loadItems(store.items.value);
});`}),e("h2",{children:"Unsubscribing with AbortController"}),e("p",{children:["Use ",e("code",{children:"AbortController"})," to cancel subscriptions when they're no longer needed:"]}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0 });
const controller = new AbortController();

// Return the abort signal from the callback
watch((store) => {
  console.log('Count:', store.count.value);
  return controller.signal;
});

const ref = watch();
ref.count.value = 1;  // ✓ Triggers subscription

// Cancel the subscription
controller.abort();

ref.count.value = 2;  // ✗ Does NOT trigger (unsubscribed)`}),e("h3",{children:"Component Cleanup Pattern"}),e(t,{language:"typescript",code:`const Component = () => {
  const controller = new AbortController();

  // Subscribe with cleanup
  const store = appWatch((innerRef) => {
    console.log('Component state:', innerRef.value);
    return controller.signal;
  });

  // Cleanup on component unmount
  onUnmount(() => {
    controller.abort();
  });

  return <div>{store.value}</div>;
};`}),e("h2",{children:"Multiple Subscriptions"}),e("p",{children:"You can create multiple independent subscriptions to the same store. Each subscription tracks only the properties it accesses:"}),e(t,{language:"typescript",code:`const watch = createStore({
  count: 0,
  name: 'StateRef',
  theme: 'dark'
});

// Subscription 1: tracks count
const controller1 = new AbortController();
watch((store) => {
  console.log('Count subscription:', store.count.value);
  return controller1.signal;
});

// Subscription 2: tracks name
const controller2 = new AbortController();
watch((store) => {
  console.log('Name subscription:', store.name.value);
  return controller2.signal;
});

// Subscription 3: tracks count and theme
const controller3 = new AbortController();
watch((store) => {
  console.log('Multi subscription:', store.count.value, store.theme.value);
  return controller3.signal;
});

const ref = watch();

ref.count.value = 10;   // Triggers subscriptions 1 and 3
ref.name.value = 'New'; // Triggers subscription 2 only
ref.theme.value = 'light'; // Triggers subscription 3 only`}),e("h2",{children:"Subscription Lifecycle"}),e("p",{children:"Understanding the subscription lifecycle helps prevent memory leaks and unexpected behavior:"}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0 });

// 1. Subscription created
const controller = new AbortController();

const trackedRef = watch((store, isFirst) => {
  // 2. Callback executed immediately (isFirst = true)
  console.log('Subscription running, isFirst:', isFirst);
  console.log('Count:', store.count.value);

  // 3. Return signal for cleanup
  return controller.signal;
});

// 4. State changes trigger the callback (isFirst = false)
trackedRef.count.value = 10;

// 5. Abort signal cancels the subscription
controller.abort();

// 6. Subscription is cleaned up, no more callbacks
trackedRef.count.value = 20;  // No callback triggered`}),e("h2",{children:"Selective Property Tracking"}),e("p",{children:"Subscriptions only react to properties that were READ via tracked references (innerRef/outerRef) during the callback:"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'en' }
});

const unboundRef = watch();

watch((store) => {
  // Only user.name is tracked (read via tracked ref)
  console.log('Name:', store.user.name.value);

  // settings.theme is NOT tracked (read via unbound ref)
  console.log('Theme:', unboundRef.settings.theme.value);
});

const ref = watch();

ref.user.name.value = 'Jane';        // ✓ Triggers subscription
ref.user.age.value = 31;             // ✗ Does NOT trigger (age not accessed)
ref.settings.theme.value = 'light';  // ✗ Does NOT trigger (read via unbound ref)`}),e("h2",{children:"Derived State Pattern"}),e("p",{children:"Use subscriptions to compute derived state that depends on multiple properties:"}),e(t,{language:"typescript",code:`const watch = createStore({
  firstName: 'John',
  lastName: 'Doe',
  fullName: ''
});

// Update fullName whenever firstName or lastName changes
watch((store, isFirst) => {
  const fullName = \`\${store.firstName.value} \${store.lastName.value}\`;

  // Avoid infinite loop by checking if value actually changed
  if (store.fullName.value !== fullName) {
    store.fullName.value = fullName;
  }
});

const ref = watch();
ref.firstName.value = 'Jane';
// fullName automatically updated to "Jane Doe"`}),e("h2",{children:"Side Effects Pattern"}),e("p",{children:"Subscriptions are perfect for side effects like API calls, logging, or analytics:"}),e(t,{language:"typescript",code:`const watch = createStore({ searchQuery: '', results: [] });

watch((store, isFirst) => {
  // Access .value first to collect subscription
  const query = store.searchQuery.value;

  if (isFirst) return; // Skip initial run

  if (query.length > 2) {
    // Trigger API call when search query changes
    fetch(\`/api/search?q=\${query}\`)
      .then(res => res.json())
      .then(data => {
        store.results.value = data;
      });
  }
});`}),e("h3",{children:"Debouncing Pattern"}),e(t,{language:"typescript",code:`const watch = createStore({ searchQuery: '' });

let timeoutId: NodeJS.Timeout;

watch((store, isFirst) => {
  // Access .value first to collect subscription
  const query = store.searchQuery.value;

  if (isFirst) return;

  // Debounce the API call
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    console.log('Searching for:', query);
    performSearch(query);
  }, 300);

  // Note: In a real app, you'd need to manage cleanup
  // of the timeout via AbortSignal or component lifecycle
});`}),e("h2",{children:"Conditional Subscriptions"}),e("p",{children:"You can create subscriptions conditionally based on application state:"}),e(t,{language:"typescript",code:`const watch = createStore({
  isLoggedIn: false,
  userId: null,
  userData: null
});

let userDataSubscription: AbortController | null = null;

// Subscribe to user state changes only when logged in
watch((store, isFirst) => {
  if (store.isLoggedIn.value) {
    // User logged in - create subscription
    if (!userDataSubscription) {
      userDataSubscription = new AbortController();

      watch((innerStore) => {
        fetchUserData(innerStore.userId.value);
        return userDataSubscription!.signal;
      });
    }
  } else {
    // User logged out - cancel subscription
    if (userDataSubscription) {
      userDataSubscription.abort();
      userDataSubscription = null;
    }
  }
});`}),e("h2",{children:"Subscription Performance"}),e("p",{children:"Keep subscriptions efficient by following these guidelines:"}),e(t,{language:"typescript",code:`const watch = createStore({ items: [], filter: '', sort: 'asc' });

// ✗ Bad: Doing expensive work on every change
watch((store) => {
  const filtered = store.items.value
    .filter(item => item.name.includes(store.filter.value))
    .sort((a, b) => store.sort.value === 'asc' ? a.id - b.id : b.id - a.id);

  // This runs on EVERY change, even if items didn't change
  console.log(filtered);
});

// ✓ Good: Use createComputed for expensive derived state
import { createComputed } from 'state-ref';

const filteredWatch = createComputed([watch], ([store]) => {
  return store.items.value
    .filter(item => item.name.includes(store.filter.value))
    .sort((a, b) => store.sort.value === 'asc' ? a.id - b.id : b.id - a.id);
});`}),e("h2",{children:"Best Practices"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Always clean up subscriptions"})," - Use AbortController to prevent memory leaks"]}),e("li",{children:[e("strong",{children:"Use isFirst for initialization"})," - Distinguish setup from updates"]}),e("li",{children:[e("strong",{children:"Keep callbacks focused"})," - Each subscription should have a single responsibility"]}),e("li",{children:[e("strong",{children:"Avoid infinite loops"})," - Don't update tracked properties without checking if values changed"]}),e("li",{children:[e("strong",{children:"Be mindful of what you track"})," - Only read properties you actually need to react to"]}),e("li",{children:[e("strong",{children:"Use createComputed for derived state"})," - More efficient than manual subscriptions"]}),e("li",{children:[e("strong",{children:"Debounce expensive operations"})," - Don't perform heavy work on every update"]})]}),e("h2",{children:"Common Pitfalls"}),e("h3",{children:"Infinite Loop"}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0 });

// ✗ Bad: Creates infinite loop
watch((store) => {
  store.count.value += 1;  // Updates count, triggers subscription again
});

// ✓ Good: Use conditional logic
watch((store, isFirst) => {
  // Access .value first to collect subscription
  const count = store.count.value;
  if (!isFirst && count < 10) {
    store.count.value = count + 1;
  }
});`}),e("h3",{children:"Forgotten Cleanup"}),e(t,{language:"typescript",code:`// ✗ Bad: No cleanup
const Component = () => {
  watch((store) => {
    console.log(store.value);
    // Subscription never cleaned up - memory leak!
  });
};

// ✓ Good: Always clean up
const Component = () => {
  const controller = new AbortController();

  watch((store) => {
    console.log(store.value);
    return controller.signal;
  });

  onUnmount(() => controller.abort());
};`}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - Understanding the watch function"]}),e("li",{children:[e("a",{href:"#/guide/references",children:"Understanding References"})," - How tracking works"]}),e("li",{children:[e("a",{href:"#/guide/computed",children:"createComputed"})," - Efficient derived state"]}),e("li",{children:[e("a",{href:"#/guide/combine-watch",children:"combineWatch"})," - Combining multiple subscriptions"]})]})]})),xa=u(()=>()=>e("div",{children:[e("h1",{children:"구독"}),e("p",{children:["StateRef의 구독을 사용하면 상태 변경에 자동으로 반응할 수 있습니다.",e("code",{children:"watch()"})," 함수에 콜백을 전달하면 추적된 프로퍼티가 변경될 때마다 실행되는 구독이 생성됩니다."]}),e("h2",{children:"기본 구독"}),e("p",{children:[e("code",{children:"watch()"}),"에 콜백 함수를 전달하여 구독을 생성합니다:"]}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

const watch = createStore({ count: 0, name: 'StateRef' });

// 변경 사항 구독
watch((store, isFirst) => {
  console.log('상태 변경됨!');
  console.log('Count:', store.count.value);
  console.log('Name:', store.name.value);
  console.log('첫 실행?', isFirst);
});

// 구독 트리거
const ref = watch();
ref.count.value = 10;  // 위의 모든 값 로그`}),e("h2",{children:"구독 콜백 시그니처"}),e("p",{children:["구독 콜백은 두 개의 파라미터를 받으며 선택적으로"," ",e("code",{children:"AbortSignal"}),"을 반환할 수 있습니다:"]}),e(t,{language:"typescript",code:`type RenewCallback<T> = (
  store: StateRefStore<T>,
  isFirst: boolean
) => void | AbortSignal;

// 사용 예제
watch((store, isFirst) => {
  // store: StateRefStore - 추적되는 참조
  // isFirst: boolean - 첫 실행에는 true, 업데이트에는 false

  console.log(store.count.value);

  // 정리를 위해 선택적으로 AbortSignal 반환
  return abortController.signal;
});`}),e("h2",{children:"isFirst 파라미터"}),e("p",{children:[e("code",{children:"isFirst"})," 파라미터는 초기 실행인지 이후 업데이트인지를 나타냅니다. 설정 로직에 유용합니다:"]}),e(t,{language:"typescript",code:`const watch = createStore({ userId: null, data: null });

watch((store, isFirst) => {
  // 먼저 .value에 접근하여 구독 수집
  const userId = store.userId.value;

  if (isFirst) {
    // 초기 구독 시 한 번만 실행
    console.log('구독 초기화됨');
    return;
  }

  // 모든 업데이트마다 실행
  if (userId) {
    console.log('사용자 데이터 가져오기:', userId);
    fetchUserData(userId);
  }
});`}),e("h3",{children:"일반적인 isFirst 패턴"}),e(t,{language:"typescript",code:`const watch = createStore({ items: [] });

// 패턴 1: 초기 실행 건너뛰기
watch((store, isFirst) => {
  // 먼저 .value에 접근하여 구독 수집
  const items = store.items.value;
  if (isFirst) return;
  console.log('아이템 업데이트됨:', items);
});

// 패턴 2: 초기 vs 업데이트에 다른 로직
watch((store, isFirst) => {
  const items = store.items.value;
  if (isFirst) {
    console.log('초기 아이템:', items);
  } else {
    console.log('아이템 변경됨:', items);
  }
});

// 패턴 3: 둘 다 실행하지만 조건부 로직
watch((store, isFirst) => {
  console.log(isFirst ? '아이템 로딩' : '아이템 재로딩');
  loadItems(store.items.value);
});`}),e("h2",{children:"AbortController로 구독 취소하기"}),e("p",{children:[e("code",{children:"AbortController"}),"를 사용하여 더 이상 필요하지 않은 구독을 취소합니다:"]}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0 });
const controller = new AbortController();

// 콜백에서 abort 시그널 반환
watch((store) => {
  console.log('Count:', store.count.value);
  return controller.signal;
});

const ref = watch();
ref.count.value = 1;  // ✓ 구독 트리거

// 구독 취소
controller.abort();

ref.count.value = 2;  // ✗ 트리거 안 함 (구독 취소됨)`}),e("h3",{children:"컴포넌트 정리 패턴"}),e(t,{language:"typescript",code:`const Component = () => {
  const controller = new AbortController();

  // 정리와 함께 구독
  const store = appWatch((innerRef) => {
    console.log('컴포넌트 상태:', innerRef.value);
    return controller.signal;
  });

  // 컴포넌트 언마운트 시 정리
  onUnmount(() => {
    controller.abort();
  });

  return <div>{store.value}</div>;
};`}),e("h2",{children:"여러 구독"}),e("p",{children:"동일한 스토어에 여러 독립적인 구독을 만들 수 있습니다. 각 구독은 접근하는 프로퍼티만 추적합니다:"}),e(t,{language:"typescript",code:`const watch = createStore({
  count: 0,
  name: 'StateRef',
  theme: 'dark'
});

// 구독 1: count 추적
const controller1 = new AbortController();
watch((store) => {
  console.log('Count 구독:', store.count.value);
  return controller1.signal;
});

// 구독 2: name 추적
const controller2 = new AbortController();
watch((store) => {
  console.log('Name 구독:', store.name.value);
  return controller2.signal;
});

// 구독 3: count와 theme 추적
const controller3 = new AbortController();
watch((store) => {
  console.log('멀티 구독:', store.count.value, store.theme.value);
  return controller3.signal;
});

const ref = watch();

ref.count.value = 10;   // 구독 1과 3 트리거
ref.name.value = 'New'; // 구독 2만 트리거
ref.theme.value = 'light'; // 구독 3만 트리거`}),e("h2",{children:"구독 생명주기"}),e("p",{children:"구독 생명주기를 이해하면 메모리 누수와 예상치 못한 동작을 방지할 수 있습니다:"}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0 });

// 1. 구독 생성
const controller = new AbortController();

const trackedRef = watch((store, isFirst) => {
  // 2. 콜백 즉시 실행 (isFirst = true)
  console.log('구독 실행 중, isFirst:', isFirst);
  console.log('Count:', store.count.value);

  // 3. 정리를 위한 시그널 반환
  return controller.signal;
});

// 4. 상태 변경이 콜백 트리거 (isFirst = false)
trackedRef.count.value = 10;

// 5. Abort 시그널이 구독 취소
controller.abort();

// 6. 구독 정리됨, 더 이상 콜백 없음
trackedRef.count.value = 20;  // 콜백 트리거 안 됨`}),e("h2",{children:"선택적 프로퍼티 추적"}),e("p",{children:"구독은 콜백 중에 추적되는 참조(innerRef/outerRef)를 통해 읽은 프로퍼티에만 반응합니다:"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'ko' }
});

const unboundRef = watch();

watch((store) => {
  // user.name만 추적됨 (추적되는 참조로 읽음)
  console.log('이름:', store.user.name.value);

  // settings.theme는 추적 안 됨 (언바운드 참조로 읽음)
  console.log('테마:', unboundRef.settings.theme.value);
});

const ref = watch();

ref.user.name.value = 'Jane';        // ✓ 구독 트리거
ref.user.age.value = 31;             // ✗ 트리거 안 함 (age 접근 안 함)
ref.settings.theme.value = 'light';  // ✗ 트리거 안 함 (언바운드 참조로 읽음)`}),e("h2",{children:"파생 상태 패턴"}),e("p",{children:"여러 프로퍼티에 의존하는 파생 상태를 계산하기 위해 구독을 사용합니다:"}),e(t,{language:"typescript",code:`const watch = createStore({
  firstName: 'John',
  lastName: 'Doe',
  fullName: ''
});

// firstName이나 lastName이 변경될 때마다 fullName 업데이트
watch((store, isFirst) => {
  const fullName = \`\${store.firstName.value} \${store.lastName.value}\`;

  // 값이 실제로 변경되었는지 확인하여 무한 루프 방지
  if (store.fullName.value !== fullName) {
    store.fullName.value = fullName;
  }
});

const ref = watch();
ref.firstName.value = 'Jane';
// fullName이 자동으로 "Jane Doe"로 업데이트됨`}),e("h2",{children:"사이드 이펙트 패턴"}),e("p",{children:"구독은 API 호출, 로깅, 분석과 같은 사이드 이펙트에 완벽합니다:"}),e(t,{language:"typescript",code:`const watch = createStore({ searchQuery: '', results: [] });

watch((store, isFirst) => {
  // 먼저 .value에 접근하여 구독 수집
  const query = store.searchQuery.value;

  if (isFirst) return; // 초기 실행 건너뛰기

  if (query.length > 2) {
    // 검색 쿼리 변경 시 API 호출 트리거
    fetch(\`/api/search?q=\${query}\`)
      .then(res => res.json())
      .then(data => {
        store.results.value = data;
      });
  }
});`}),e("h3",{children:"디바운싱 패턴"}),e(t,{language:"typescript",code:`const watch = createStore({ searchQuery: '' });

let timeoutId: NodeJS.Timeout;

watch((store, isFirst) => {
  // 먼저 .value에 접근하여 구독 수집
  const query = store.searchQuery.value;

  if (isFirst) return;

  // API 호출 디바운싱
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    console.log('검색 중:', query);
    performSearch(query);
  }, 300);

  // 참고: 실제 앱에서는 AbortSignal이나 컴포넌트 생명주기를 통해
  // 타임아웃 정리를 관리해야 합니다
});`}),e("h2",{children:"조건부 구독"}),e("p",{children:"애플리케이션 상태에 따라 조건부로 구독을 생성할 수 있습니다:"}),e(t,{language:"typescript",code:`const watch = createStore({
  isLoggedIn: false,
  userId: null,
  userData: null
});

let userDataSubscription: AbortController | null = null;

// 로그인 시에만 사용자 상태 변경 구독
watch((store, isFirst) => {
  if (store.isLoggedIn.value) {
    // 사용자 로그인 - 구독 생성
    if (!userDataSubscription) {
      userDataSubscription = new AbortController();

      watch((innerStore) => {
        fetchUserData(innerStore.userId.value);
        return userDataSubscription!.signal;
      });
    }
  } else {
    // 사용자 로그아웃 - 구독 취소
    if (userDataSubscription) {
      userDataSubscription.abort();
      userDataSubscription = null;
    }
  }
});`}),e("h2",{children:"구독 성능"}),e("p",{children:"다음 가이드라인을 따라 구독을 효율적으로 유지하세요:"}),e(t,{language:"typescript",code:`const watch = createStore({ items: [], filter: '', sort: 'asc' });

// ✗ 나쁨: 모든 변경마다 비용이 많이 드는 작업 수행
watch((store) => {
  const filtered = store.items.value
    .filter(item => item.name.includes(store.filter.value))
    .sort((a, b) => store.sort.value === 'asc' ? a.id - b.id : b.id - a.id);

  // items가 변경되지 않았어도 모든 변경마다 실행됨
  console.log(filtered);
});

// ✓ 좋음: 비용이 많이 드는 파생 상태에 createComputed 사용
import { createComputed } from 'state-ref';

const filteredWatch = createComputed([watch], ([store]) => {
  return store.items.value
    .filter(item => item.name.includes(store.filter.value))
    .sort((a, b) => store.sort.value === 'asc' ? a.id - b.id : b.id - a.id);
});`}),e("h2",{children:"모범 사례"}),e("ul",{children:[e("li",{children:[e("strong",{children:"항상 구독 정리"})," - 메모리 누수를 방지하기 위해 AbortController 사용"]}),e("li",{children:[e("strong",{children:"초기화에 isFirst 사용"})," - 설정과 업데이트 구분"]}),e("li",{children:[e("strong",{children:"콜백을 집중되게 유지"})," - 각 구독은 단일 책임을 가져야 함"]}),e("li",{children:[e("strong",{children:"무한 루프 방지"})," - 값이 변경되었는지 확인하지 않고 추적된 프로퍼티를 업데이트하지 말기"]}),e("li",{children:[e("strong",{children:"추적하는 것에 주의"})," - 실제로 반응해야 하는 프로퍼티만 읽기"]}),e("li",{children:[e("strong",{children:"파생 상태에 createComputed 사용"})," - 수동 구독보다 효율적"]}),e("li",{children:[e("strong",{children:"비용이 많이 드는 작업 디바운싱"})," - 모든 업데이트마다 무거운 작업 수행하지 말기"]})]}),e("h2",{children:"일반적인 함정"}),e("h3",{children:"무한 루프"}),e(t,{language:"typescript",code:`const watch = createStore({ count: 0 });

// ✗ 나쁨: 무한 루프 생성
watch((store) => {
  store.count.value += 1;  // count 업데이트, 구독 다시 트리거
});

// ✓ 좋음: 조건부 로직 사용
watch((store, isFirst) => {
  // 먼저 .value에 접근하여 구독 수집
  const count = store.count.value;
  if (!isFirst && count < 10) {
    store.count.value = count + 1;
  }
});`}),e("h3",{children:"잊어버린 정리"}),e(t,{language:"typescript",code:`// ✗ 나쁨: 정리 없음
const Component = () => {
  watch((store) => {
    console.log(store.value);
    // 구독이 절대 정리되지 않음 - 메모리 누수!
  });
};

// ✓ 좋음: 항상 정리
const Component = () => {
  const controller = new AbortController();

  watch((store) => {
    console.log(store.value);
    return controller.signal;
  });

  onUnmount(() => controller.abort());
};`}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - watch 함수 이해하기"]}),e("li",{children:[e("a",{href:"#/ko/guide/references",children:"참조 이해하기"})," - 추적 작동 방식"]}),e("li",{children:[e("a",{href:"#/ko/guide/computed",children:"createComputed"})," - 효율적인 파생 상태"]}),e("li",{children:[e("a",{href:"#/ko/guide/combine-watch",children:"combineWatch"})," - 여러 구독 결합"]})]})]})),Ca=u(()=>()=>e("div",{children:[e("h1",{children:"Primitive Types"}),e("p",{children:"StateRef works seamlessly with primitive types like numbers, strings, and booleans. While object stores are more common, primitive stores are useful for simple counters, toggles, or any single-value state."}),e("h2",{children:"Creating Primitive Stores"}),e("p",{children:["Create a primitive store by passing a primitive value to"," ",e("code",{children:"createStore()"}),":"]}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

// Number store
const countWatch = createStore(0);

// String store
const nameWatch = createStore('StateRef');

// Boolean store
const toggleWatch = createStore(false);

// Null/undefined stores
const nullableWatch = createStore<string | null>(null);`}),e("h2",{children:"Reading and Writing Values"}),e("p",{children:["For primitive stores, access the value directly via ",e("code",{children:".value"})," ","on the store reference:"]}),e(t,{language:"typescript",code:`const countWatch = createStore(100);
const count = countWatch();

// Read value
console.log(count.value);  // 100

// Write value
count.value = 200;
console.log(count.value);  // 200

// Increment
count.value += 1;
console.log(count.value);  // 201`}),e("h2",{children:"Subscribing to Changes"}),e("p",{children:"Subscribe to primitive store changes just like object stores:"}),e(t,{language:"typescript",code:`const countWatch = createStore(0);

// Subscribe to changes
countWatch((store, isFirst) => {
  console.log('Count:', store.value);
  console.log('Is first run?', isFirst);
});

// Trigger updates
const count = countWatch();
count.value = 10;  // Logs: Count: 10, Is first run? false
count.value = 20;  // Logs: Count: 20, Is first run? false`}),e("h2",{children:"TypeScript Type Inference"}),e("p",{children:"TypeScript automatically infers the type from the initial value, or you can explicitly specify the type:"}),e(t,{language:"typescript",code:`// Type inferred as number
const countWatch = createStore(0);

// Type inferred as string
const nameWatch = createStore('hello');

// Explicit type annotation
const scoreWatch = createStore<number>(0);

// Union types
const statusWatch = createStore<'idle' | 'loading' | 'done'>('idle');

// Nullable types
const userIdWatch = createStore<number | null>(null);`}),e("h2",{children:"Comparison with Object Stores"}),e("p",{children:"The key difference between primitive and object stores is the access pattern:"}),e(t,{language:"typescript",code:`// Object store
const objWatch = createStore({ count: 0 });
const objStore = objWatch();
console.log(objStore.count.value);  // Access nested property
objStore.count.value = 10;

// Primitive store
const primWatch = createStore(0);
const primStore = primWatch();
console.log(primStore.value);  // Access value directly
primStore.value = 10;`}),e("h2",{children:"Common Use Cases"}),e("h3",{children:"Counter"}),e(t,{language:"typescript",code:`const countWatch = createStore(0);

const increment = () => {
  const count = countWatch();
  count.value += 1;
};

const decrement = () => {
  const count = countWatch();
  count.value -= 1;
};

const reset = () => {
  const count = countWatch();
  count.value = 0;
};`}),e("h3",{children:"Toggle"}),e(t,{language:"typescript",code:`const toggleWatch = createStore(false);

const toggle = () => {
  const state = toggleWatch();
  state.value = !state.value;
};

// Subscribe to toggle changes
toggleWatch((store) => {
  console.log('Toggle is now:', store.value ? 'ON' : 'OFF');
});`}),e("h3",{children:"Text Input"}),e(t,{language:"typescript",code:`const inputWatch = createStore('');

// In a component
const handleChange = (e: Event) => {
  const input = inputWatch();
  input.value = (e.target as HTMLInputElement).value;
};

// Subscribe to input changes
inputWatch((store, isFirst) => {
  const value = store.value;
  if (isFirst) return;

  console.log('Input changed to:', value);
});`}),e("h3",{children:"Loading State"}),e(t,{language:"typescript",code:`const loadingWatch = createStore(false);

const fetchData = async () => {
  const loading = loadingWatch();
  loading.value = true;

  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } finally {
    loading.value = false;
  }
};`}),e("h2",{children:"Using with AbortController"}),e("p",{children:["Cancel subscriptions to primitive stores using"," ",e("code",{children:"AbortController"}),":"]}),e(t,{language:"typescript",code:`const countWatch = createStore(0);
const controller = new AbortController();

countWatch((store) => {
  console.log('Count:', store.value);
  return controller.signal;
});

const count = countWatch();
count.value = 1;  // Logs: Count: 1

controller.abort();

count.value = 2;  // No log (subscription cancelled)`}),e("h2",{children:"Combining with createComputed"}),e("p",{children:["Primitive stores work well with ",e("code",{children:"createComputed"})," for derived values:"]}),e(t,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';

const widthWatch = createStore(10);
const heightWatch = createStore(20);

// Computed area from two primitive stores
const areaWatch = createComputed(
  [widthWatch, heightWatch],
  ([width, height]) => width.value * height.value
);

// Subscribe to computed value
areaWatch((store) => {
  console.log('Area:', store.value);
});

// Update triggers computed recalculation
const width = widthWatch();
width.value = 15;  // Logs: Area: 300`}),e("h2",{children:"Framework Integration"}),e("p",{children:"Primitive stores integrate with UI frameworks the same way as object stores:"}),e(t,{language:"typescript",code:`// React example
import { connectReact } from '@stateref/connect-react';
import { createStore } from 'state-ref';

const countWatch = createStore(0);
const useCount = connectReact(countWatch);

function Counter() {
  const count = useCount();

  return (
    <div>
      <p>Count: {count.value}</p>
      <button onClick={() => count.value++}>Increment</button>
    </div>
  );
}`}),e("h2",{children:"Best Practices"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Use primitive stores for simple state"})," - Counters, toggles, single values"]}),e("li",{children:[e("strong",{children:"Use object stores for complex state"})," - Multiple related values"]}),e("li",{children:[e("strong",{children:"Type your stores"})," - Especially for union types and nullable values"]}),e("li",{children:[e("strong",{children:"Consider combining stores"})," - Use"," ",e("code",{children:"createComputed"})," or ",e("code",{children:"combineWatch"})," when primitive stores need to work together"]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - Creating stores"]}),e("li",{children:[e("a",{href:"#/guide/state-ref-store",children:"StateRefStore"})," - Working with store references"]}),e("li",{children:[e("a",{href:"#/guide/computed",children:"createComputed"})," - Deriving values from stores"]}),e("li",{children:[e("a",{href:"#/guide/combine-watch",children:"combineWatch"})," - Combining multiple stores"]})]})]})),Ta=u(()=>()=>e("div",{children:[e("h1",{children:"원시 타입"}),e("p",{children:"StateRef는 숫자, 문자열, 불리언 같은 원시 타입과도 완벽하게 작동합니다. 객체 스토어가 더 일반적이지만, 원시 타입 스토어는 간단한 카운터, 토글, 또는 단일 값 상태에 유용합니다."}),e("h2",{children:"원시 타입 스토어 생성"}),e("p",{children:[e("code",{children:"createStore()"}),"에 원시 값을 전달하여 원시 타입 스토어를 생성합니다:"]}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

// 숫자 스토어
const countWatch = createStore(0);

// 문자열 스토어
const nameWatch = createStore('StateRef');

// 불리언 스토어
const toggleWatch = createStore(false);

// Null/undefined 스토어
const nullableWatch = createStore<string | null>(null);`}),e("h2",{children:"값 읽기와 쓰기"}),e("p",{children:["원시 타입 스토어의 경우, 스토어 참조에서 ",e("code",{children:".value"}),"를 통해 직접 값에 접근합니다:"]}),e(t,{language:"typescript",code:`const countWatch = createStore(100);
const count = countWatch();

// 값 읽기
console.log(count.value);  // 100

// 값 쓰기
count.value = 200;
console.log(count.value);  // 200

// 증가
count.value += 1;
console.log(count.value);  // 201`}),e("h2",{children:"변경 사항 구독"}),e("p",{children:"객체 스토어와 마찬가지로 원시 타입 스토어의 변경 사항을 구독합니다:"}),e(t,{language:"typescript",code:`const countWatch = createStore(0);

// 변경 사항 구독
countWatch((store, isFirst) => {
  console.log('Count:', store.value);
  console.log('첫 실행?', isFirst);
});

// 업데이트 트리거
const count = countWatch();
count.value = 10;  // 로그: Count: 10, 첫 실행? false
count.value = 20;  // 로그: Count: 20, 첫 실행? false`}),e("h2",{children:"TypeScript 타입 추론"}),e("p",{children:"TypeScript는 초기값에서 자동으로 타입을 추론하거나, 명시적으로 타입을 지정할 수 있습니다:"}),e(t,{language:"typescript",code:`// number로 타입 추론
const countWatch = createStore(0);

// string으로 타입 추론
const nameWatch = createStore('hello');

// 명시적 타입 지정
const scoreWatch = createStore<number>(0);

// 유니온 타입
const statusWatch = createStore<'idle' | 'loading' | 'done'>('idle');

// 널러블 타입
const userIdWatch = createStore<number | null>(null);`}),e("h2",{children:"객체 스토어와의 비교"}),e("p",{children:"원시 타입과 객체 스토어의 주요 차이점은 접근 패턴입니다:"}),e(t,{language:"typescript",code:`// 객체 스토어
const objWatch = createStore({ count: 0 });
const objStore = objWatch();
console.log(objStore.count.value);  // 중첩 프로퍼티 접근
objStore.count.value = 10;

// 원시 타입 스토어
const primWatch = createStore(0);
const primStore = primWatch();
console.log(primStore.value);  // 직접 값 접근
primStore.value = 10;`}),e("h2",{children:"일반적인 사용 사례"}),e("h3",{children:"카운터"}),e(t,{language:"typescript",code:`const countWatch = createStore(0);

const increment = () => {
  const count = countWatch();
  count.value += 1;
};

const decrement = () => {
  const count = countWatch();
  count.value -= 1;
};

const reset = () => {
  const count = countWatch();
  count.value = 0;
};`}),e("h3",{children:"토글"}),e(t,{language:"typescript",code:`const toggleWatch = createStore(false);

const toggle = () => {
  const state = toggleWatch();
  state.value = !state.value;
};

// 토글 변경 구독
toggleWatch((store) => {
  console.log('토글 상태:', store.value ? '켜짐' : '꺼짐');
});`}),e("h3",{children:"텍스트 입력"}),e(t,{language:"typescript",code:`const inputWatch = createStore('');

// 컴포넌트에서
const handleChange = (e: Event) => {
  const input = inputWatch();
  input.value = (e.target as HTMLInputElement).value;
};

// 입력 변경 구독
inputWatch((store, isFirst) => {
  const value = store.value;
  if (isFirst) return;

  console.log('입력 변경됨:', value);
});`}),e("h3",{children:"로딩 상태"}),e(t,{language:"typescript",code:`const loadingWatch = createStore(false);

const fetchData = async () => {
  const loading = loadingWatch();
  loading.value = true;

  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } finally {
    loading.value = false;
  }
};`}),e("h2",{children:"AbortController 사용하기"}),e("p",{children:[e("code",{children:"AbortController"}),"를 사용하여 원시 타입 스토어의 구독을 취소합니다:"]}),e(t,{language:"typescript",code:`const countWatch = createStore(0);
const controller = new AbortController();

countWatch((store) => {
  console.log('Count:', store.value);
  return controller.signal;
});

const count = countWatch();
count.value = 1;  // 로그: Count: 1

controller.abort();

count.value = 2;  // 로그 없음 (구독 취소됨)`}),e("h2",{children:"createComputed와 결합하기"}),e("p",{children:["원시 타입 스토어는 파생 값을 위해 ",e("code",{children:"createComputed"}),"와 잘 작동합니다:"]}),e(t,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';

const widthWatch = createStore(10);
const heightWatch = createStore(20);

// 두 원시 타입 스토어에서 계산된 면적
const areaWatch = createComputed(
  [widthWatch, heightWatch],
  ([width, height]) => width.value * height.value
);

// 계산된 값 구독
areaWatch((store) => {
  console.log('면적:', store.value);
});

// 업데이트가 계산된 값 재계산을 트리거
const width = widthWatch();
width.value = 15;  // 로그: 면적: 300`}),e("h2",{children:"프레임워크 연동"}),e("p",{children:"원시 타입 스토어는 객체 스토어와 동일한 방식으로 UI 프레임워크와 연동됩니다:"}),e(t,{language:"typescript",code:`// React 예제
import { connectReact } from '@stateref/connect-react';
import { createStore } from 'state-ref';

const countWatch = createStore(0);
const useCount = connectReact(countWatch);

function Counter() {
  const count = useCount();

  return (
    <div>
      <p>Count: {count.value}</p>
      <button onClick={() => count.value++}>증가</button>
    </div>
  );
}`}),e("h2",{children:"모범 사례"}),e("ul",{children:[e("li",{children:[e("strong",{children:"간단한 상태에 원시 타입 스토어 사용"})," - 카운터, 토글, 단일 값"]}),e("li",{children:[e("strong",{children:"복잡한 상태에 객체 스토어 사용"})," - 여러 관련 값"]}),e("li",{children:[e("strong",{children:"스토어에 타입 지정"})," - 특히 유니온 타입과 널러블 값에"]}),e("li",{children:[e("strong",{children:"스토어 결합 고려"})," - 원시 타입 스토어들이 함께 작동해야 할 때 ",e("code",{children:"createComputed"}),"나 ",e("code",{children:"combineWatch"})," 사용"]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/state-ref-store",children:"StateRefStore"})," - 스토어 참조 다루기"]}),e("li",{children:[e("a",{href:"#/ko/guide/computed",children:"createComputed"})," - 스토어에서 값 파생"]}),e("li",{children:[e("a",{href:"#/ko/guide/combine-watch",children:"combineWatch"})," - 여러 스토어 결합"]})]})]})),Aa=u(()=>()=>e("div",{children:[e("h1",{children:"createComputed"}),e("p",{children:[e("code",{children:"createComputed"})," is a helper function that combines multiple watches to produce a new computed (derived) value. It executes a callback function whenever the computed value changes."]}),e("p",{children:["A watch created with ",e("code",{children:"createComputed"})," can be used just like any other watch, including integrations such as"," ",e("code",{children:"connectReact"})," or ",e("code",{children:"connectPreact"}),"."]}),e("h2",{children:"Basic Usage"}),e(t,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';

const watch1 = createStore(10);
const watch2 = createStore(20);

// Create a computed watch from two stores
const sumWatch = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value + ref2.value
);

// Get the computed value
const sumRef = sumWatch();
console.log(sumRef.value);  // 30

// Update a source store
const num1 = watch1();
num1.value = 15;
console.log(sumRef.value);  // 35`}),e("h2",{children:"Syntax"}),e(t,{language:"typescript",code:`createComputed<W extends readonly Watch<any>[], R>(
  watches: W,
  callback: (refs: StateRefsTuple<W>) => R
): (computedCallback?: (proxy: { value: R }, isFirst: boolean) => void) => { value: R }`}),e("h3",{children:"Parameters"}),e("ul",{children:[e("li",{children:[e("code",{children:"watches"})," - An array of watch functions to combine"]}),e("li",{children:[e("code",{children:"callback"})," - A function that receives the store references and returns the computed value"]})]}),e("h3",{children:"Returns"}),e("p",{children:"Returns a watch-like function that can be called with or without a callback:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Without callback"}),": Returns a read-only proxy with"," ",e("code",{children:".value"})]}),e("li",{children:[e("strong",{children:"With callback"}),": Subscribes to changes and returns the same proxy"]})]}),e("h2",{children:"Subscribing to Computed Values"}),e("p",{children:"Pass a callback to subscribe to computed value changes:"}),e(t,{language:"typescript",code:`const watch1 = createStore(100);
const watch2 = createStore(50);

const diffWatch = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value - ref2.value
);

// Subscribe to computed changes
diffWatch((computedRef, isFirst) => {
  console.log('Difference:', computedRef.value);
  console.log('Is first run?', isFirst);
});
// Logs: Difference: 50, Is first run? true

// Update triggers recomputation
const num1 = watch1();
num1.value = 200;
// Logs: Difference: 150, Is first run? false`}),e("h2",{children:"Cancelling a Subscription"}),e("p",{children:["A subscription made here is cancelled the same way as any other: return an ",e("code",{children:"AbortSignal"})," from the callback and abort it, or return"," ",e("code",{children:"false"})," to drop the subscription after that run. Both reach the inner subscriptions this helper opens on your behalf."]}),e(t,{language:"typescript",code:`const abortController = new AbortController();

computedWatch((refs, isFirst) => {
  read(refs);
  if (isFirst) return abortController.signal;
  return abortController.signal;
});

abortController.abort();  // every inner subscription goes with it

// Or, to stop after a condition is met:
computedWatch((refs, isFirst) => {
  if (done(refs)) return false;
});`}),e("h2",{children:"Read-Only Values"}),e("p",{children:"Computed values are read-only. Attempting to set the value will show a warning:"}),e(t,{language:"typescript",code:`const watch1 = createStore(10);
const watch2 = createStore(20);

const sumWatch = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value + ref2.value
);

const sumRef = sumWatch();

// Reading works
console.log(sumRef.value);  // 30

// Writing shows a warning
sumRef.value = 100;  // Console warning: "Can not setting"
console.log(sumRef.value);  // Still 30`}),e("h2",{children:"Complex Computed Values"}),e("p",{children:"The computed callback can return any type, including objects:"}),e(t,{language:"typescript",code:`const userWatch = createStore({ firstName: 'John', lastName: 'Doe' });
const settingsWatch = createStore({ showFullName: true });

const displayNameWatch = createComputed(
  [userWatch, settingsWatch],
  ([user, settings]) => {
    if (settings.showFullName.value) {
      return {
        name: \`\${user.firstName.value} \${user.lastName.value}\`,
        initials: \`\${user.firstName.value[0]}\${user.lastName.value[0]}\`
      };
    }
    return {
      name: user.firstName.value,
      initials: user.firstName.value[0]
    };
  }
);

const displayRef = displayNameWatch();
console.log(displayRef.value);
// { name: 'John Doe', initials: 'JD' }`}),e("h2",{children:"Combining Multiple Stores"}),e("p",{children:"You can combine any number of stores in a single computed:"}),e(t,{language:"typescript",code:`const priceWatch = createStore(100);
const quantityWatch = createStore(3);
const taxRateWatch = createStore(0.1);
const discountWatch = createStore(10);

const totalWatch = createComputed(
  [priceWatch, quantityWatch, taxRateWatch, discountWatch],
  ([price, quantity, taxRate, discount]) => {
    const subtotal = price.value * quantity.value;
    const tax = subtotal * taxRate.value;
    const total = subtotal + tax - discount.value;
    return {
      subtotal,
      tax,
      discount: discount.value,
      total
    };
  }
);

const total = totalWatch();
console.log(total.value);
// { subtotal: 300, tax: 30, discount: 10, total: 320 }`}),e("h2",{children:"Using with Framework Connectors"}),e("p",{children:"Computed watches work seamlessly with framework connectors:"}),e(t,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

// Source stores
const widthWatch = createStore(10);
const heightWatch = createStore(20);

// Computed store
const areaWatch = createComputed(
  [widthWatch, heightWatch],
  ([width, height]) => width.value * height.value
);

// Create React hook from computed watch
const useArea = connectReact(areaWatch);

function AreaDisplay() {
  const area = useArea();

  return <div>Area: {area.value}</div>;
}`}),e("h2",{children:"Chaining Computed Values"}),e("p",{children:"Computed watches can be used as inputs to other computed watches:"}),e(t,{language:"typescript",code:`const baseWatch = createStore(100);
const multiplierWatch = createStore(2);

// First computed
const multipliedWatch = createComputed(
  [baseWatch, multiplierWatch],
  ([base, mult]) => base.value * mult.value
);

// Second computed using the first
const formattedWatch = createComputed(
  [multipliedWatch],
  ([multiplied]) => \`Result: \${multiplied.value}\`
);

const formatted = formattedWatch();
console.log(formatted.value);  // "Result: 200"

// Update base value
const base = baseWatch();
base.value = 50;
console.log(formatted.value);  // "Result: 100"`}),e("h2",{children:"TypeScript Support"}),e("p",{children:[e("code",{children:"createComputed"})," provides full TypeScript inference:"]}),e(t,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';
import type { Watch } from 'state-ref';

interface User {
  name: string;
  age: number;
}

const userWatch = createStore<User>({ name: 'John', age: 30 });
const multiplierWatch = createStore<number>(2);

// Return type is automatically inferred
const computedWatch = createComputed(
  [userWatch, multiplierWatch],
  ([user, mult]) => ({
    userName: user.name.value,        // string
    doubleAge: user.age.value * mult.value  // number
  })
);

const result = computedWatch();
// result.value is typed as { userName: string; doubleAge: number }`}),e("p",{children:["Calling ",e("code",{children:"computedWatch()"})," without a callback creates no subscriptions. After the initial calculation, reads reuse the same result object until a ref value read by the calculation changes. The next read then computes from current inputs, even before a manual"," ",e("code",{children:"sync()"}),". Subscriber notifications still wait for"," ",e("code",{children:"sync()"})," in manual mode. Keep calculations pure and read dependencies through the supplied refs."]}),e("h2",{children:"Performance Considerations"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Computed values are cached"})," - The callback only runs when source values change"]}),e("li",{children:[e("strong",{children:"Fine-grained updates"})," - Only accessed properties trigger recomputation"]}),e("li",{children:[e("strong",{children:"Avoid heavy computations"})," - Keep callback functions efficient"]})]}),e(t,{language:"typescript",code:`// Good: Simple computation
const simpleComputed = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value + ref2.value
);

// Caution: Heavy computation - consider memoization
const heavyComputed = createComputed(
  [itemsWatch, filterWatch],
  ([items, filter]) => {
    // This runs on every change
    return items.value
      .filter(item => item.name.includes(filter.value))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
);`}),e("h2",{children:"Comparison with combineWatch"}),e("p",{children:[e("code",{children:"createComputed"})," and ",e("code",{children:"combineWatch"})," serve different purposes:"]}),e("ul",{children:[e("li",{children:[e("strong",{children:"createComputed"})," - Derives a ",e("em",{children:"new value"})," from multiple stores"]}),e("li",{children:[e("strong",{children:"combineWatch"})," - Groups multiple stores into a"," ",e("em",{children:"tuple structure"})]})]}),e(t,{language:"typescript",code:`import { createStore, createComputed, combineWatch } from 'state-ref';

const watch1 = createStore(10);
const watch2 = createStore(20);

// createComputed: Returns a derived value
const sumWatch = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value + ref2.value
);
const sum = sumWatch();
console.log(sum.value);  // 30 (single value)

// combineWatch: Returns grouped stores
const combinedWatch = combineWatch([watch1, watch2]);
const combined = combinedWatch();
console.log(combined[0].value);  // 10
console.log(combined[1].value);  // 20`}),e("h2",{children:"Best Practices"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Keep computations pure"})," - No side effects in the callback"]}),e("li",{children:[e("strong",{children:"Access only needed values"})," - Don't read properties you don't use"]}),e("li",{children:[e("strong",{children:"Use for derived state"})," - Perfect for values that depend on other state"]}),e("li",{children:[e("strong",{children:"Prefer over manual subscriptions"})," - Cleaner and more efficient"]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - Creating source stores"]}),e("li",{children:[e("a",{href:"#/guide/combine-watch",children:"combineWatch"})," - Grouping multiple watches"]}),e("li",{children:[e("a",{href:"#/guide/subscription",children:"Subscription"})," - Understanding subscriptions"]}),e("li",{children:[e("a",{href:"#/guide/react",children:"React Integration"})," - Using with React"]})]})]})),Wa=u(()=>()=>e("div",{children:[e("h1",{children:"createComputed"}),e("p",{children:[e("code",{children:"createComputed"}),"는 여러 watch를 결합하여 새로운 계산된(파생) 값을 생성하는 헬퍼 함수입니다. 계산된 값이 변경될 때마다 콜백 함수를 실행합니다."]}),e("p",{children:[e("code",{children:"createComputed"}),"로 생성된 watch는 다른 watch처럼 사용할 수 있으며,",e("code",{children:"connectReact"}),"나 ",e("code",{children:"connectPreact"})," 같은 연동에서도 사용할 수 있습니다."]}),e("h2",{children:"기본 사용법"}),e(t,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';

const watch1 = createStore(10);
const watch2 = createStore(20);

// 두 스토어에서 계산된 watch 생성
const sumWatch = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value + ref2.value
);

// 계산된 값 가져오기
const sumRef = sumWatch();
console.log(sumRef.value);  // 30

// 소스 스토어 업데이트
const num1 = watch1();
num1.value = 15;
console.log(sumRef.value);  // 35`}),e("h2",{children:"문법"}),e(t,{language:"typescript",code:`createComputed<W extends readonly Watch<any>[], R>(
  watches: W,
  callback: (refs: StateRefsTuple<W>) => R
): (computedCallback?: (proxy: { value: R }, isFirst: boolean) => void) => { value: R }`}),e("h3",{children:"매개변수"}),e("ul",{children:[e("li",{children:[e("code",{children:"watches"})," - 결합할 watch 함수 배열"]}),e("li",{children:[e("code",{children:"callback"})," - 스토어 참조를 받아 계산된 값을 반환하는 함수"]})]}),e("h3",{children:"반환값"}),e("p",{children:"콜백 유무에 따라 호출할 수 있는 watch와 유사한 함수를 반환합니다:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"콜백 없이"}),": ",e("code",{children:".value"}),"를 가진 읽기 전용 프록시 반환"]}),e("li",{children:[e("strong",{children:"콜백과 함께"}),": 변경 사항을 구독하고 동일한 프록시 반환"]})]}),e("h2",{children:"구독 해제"}),e("p",{children:["여기서 만든 구독도 해제 방법은 같습니다. 콜백에서"," ",e("code",{children:"AbortSignal"}),"을 반환한 뒤 abort하거나, ",e("code",{children:"false"}),"를 반환해 그 실행 이후 구독을 끊습니다. 두 방법 모두 이 헬퍼가 내부적으로 연 구독까지 함께 정리합니다."]}),e(t,{language:"typescript",code:`const abortController = new AbortController();

computedWatch((refs, isFirst) => {
  read(refs);
  return abortController.signal;
});

abortController.abort();  // 내부 구독까지 모두 해제된다

// 조건이 충족되면 멈추고 싶다면:
computedWatch((refs, isFirst) => {
  if (done(refs)) return false;
});`}),e("h2",{children:"계산된 값 구독"}),e("p",{children:"콜백을 전달하여 계산된 값 변경을 구독합니다:"}),e(t,{language:"typescript",code:`const watch1 = createStore(100);
const watch2 = createStore(50);

const diffWatch = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value - ref2.value
);

// 계산된 값 변경 구독
diffWatch((computedRef, isFirst) => {
  console.log('차이:', computedRef.value);
  console.log('첫 실행?', isFirst);
});
// 로그: 차이: 50, 첫 실행? true

// 업데이트가 재계산 트리거
const num1 = watch1();
num1.value = 200;
// 로그: 차이: 150, 첫 실행? false`}),e("h2",{children:"읽기 전용 값"}),e("p",{children:"계산된 값은 읽기 전용입니다. 값을 설정하려고 하면 경고가 표시됩니다:"}),e(t,{language:"typescript",code:`const watch1 = createStore(10);
const watch2 = createStore(20);

const sumWatch = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value + ref2.value
);

const sumRef = sumWatch();

// 읽기는 작동함
console.log(sumRef.value);  // 30

// 쓰기는 경고 표시
sumRef.value = 100;  // 콘솔 경고: "Can not setting"
console.log(sumRef.value);  // 여전히 30`}),e("h2",{children:"복잡한 계산된 값"}),e("p",{children:"계산 콜백은 객체를 포함한 모든 타입을 반환할 수 있습니다:"}),e(t,{language:"typescript",code:`const userWatch = createStore({ firstName: 'John', lastName: 'Doe' });
const settingsWatch = createStore({ showFullName: true });

const displayNameWatch = createComputed(
  [userWatch, settingsWatch],
  ([user, settings]) => {
    if (settings.showFullName.value) {
      return {
        name: \`\${user.firstName.value} \${user.lastName.value}\`,
        initials: \`\${user.firstName.value[0]}\${user.lastName.value[0]}\`
      };
    }
    return {
      name: user.firstName.value,
      initials: user.firstName.value[0]
    };
  }
);

const displayRef = displayNameWatch();
console.log(displayRef.value);
// { name: 'John Doe', initials: 'JD' }`}),e("h2",{children:"여러 스토어 결합"}),e("p",{children:"단일 computed에서 여러 스토어를 결합할 수 있습니다:"}),e(t,{language:"typescript",code:`const priceWatch = createStore(100);
const quantityWatch = createStore(3);
const taxRateWatch = createStore(0.1);
const discountWatch = createStore(10);

const totalWatch = createComputed(
  [priceWatch, quantityWatch, taxRateWatch, discountWatch],
  ([price, quantity, taxRate, discount]) => {
    const subtotal = price.value * quantity.value;
    const tax = subtotal * taxRate.value;
    const total = subtotal + tax - discount.value;
    return {
      subtotal,
      tax,
      discount: discount.value,
      total
    };
  }
);

const total = totalWatch();
console.log(total.value);
// { subtotal: 300, tax: 30, discount: 10, total: 320 }`}),e("h2",{children:"프레임워크 커넥터와 사용"}),e("p",{children:"계산된 watch는 프레임워크 커넥터와 원활하게 작동합니다:"}),e(t,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

// 소스 스토어
const widthWatch = createStore(10);
const heightWatch = createStore(20);

// 계산된 스토어
const areaWatch = createComputed(
  [widthWatch, heightWatch],
  ([width, height]) => width.value * height.value
);

// 계산된 watch에서 React 훅 생성
const useArea = connectReact(areaWatch);

function AreaDisplay() {
  const area = useArea();

  return <div>면적: {area.value}</div>;
}`}),e("h2",{children:"계산된 값 체이닝"}),e("p",{children:"계산된 watch를 다른 계산된 watch의 입력으로 사용할 수 있습니다:"}),e(t,{language:"typescript",code:`const baseWatch = createStore(100);
const multiplierWatch = createStore(2);

// 첫 번째 computed
const multipliedWatch = createComputed(
  [baseWatch, multiplierWatch],
  ([base, mult]) => base.value * mult.value
);

// 첫 번째를 사용하는 두 번째 computed
const formattedWatch = createComputed(
  [multipliedWatch],
  ([multiplied]) => \`결과: \${multiplied.value}\`
);

const formatted = formattedWatch();
console.log(formatted.value);  // "결과: 200"

// base 값 업데이트
const base = baseWatch();
base.value = 50;
console.log(formatted.value);  // "결과: 100"`}),e("h2",{children:"TypeScript 지원"}),e("p",{children:[e("code",{children:"createComputed"}),"는 완전한 TypeScript 추론을 제공합니다:"]}),e(t,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';
import type { Watch } from 'state-ref';

interface User {
  name: string;
  age: number;
}

const userWatch = createStore<User>({ name: 'John', age: 30 });
const multiplierWatch = createStore<number>(2);

// 반환 타입이 자동으로 추론됨
const computedWatch = createComputed(
  [userWatch, multiplierWatch],
  ([user, mult]) => ({
    userName: user.name.value,        // string
    doubleAge: user.age.value * mult.value  // number
  })
);

const result = computedWatch();
// result.value는 { userName: string; doubleAge: number } 타입`}),e("p",{children:["콜백 없는 ",e("code",{children:"computedWatch()"}),"는 구독을 만들지 않습니다. 최초 계산 후에는 읽었던 ref 값이 바뀌었을 때만 다음 읽기에서 다시 계산하고, 그대로면 같은 결과 객체를 재사용합니다. ",e("code",{children:"sync()"})," 전에도 최신 원본을 읽으며, 구독 콜백에 대한 알림은 수동 모드의 ",e("code",{children:"sync()"}),"에서 실행됩니다. 계산은 전달받은 ref를 읽는 순수 함수로 작성하세요."]}),e("h2",{children:"성능 고려사항"}),e("ul",{children:[e("li",{children:[e("strong",{children:"계산된 값은 캐시됨"})," - 콜백은 소스 값이 변경될 때만 실행됨"]}),e("li",{children:[e("strong",{children:"세밀한 업데이트"})," - 접근한 프로퍼티만 재계산을 트리거함"]}),e("li",{children:[e("strong",{children:"무거운 계산 피하기"})," - 콜백 함수를 효율적으로 유지하기"]})]}),e(t,{language:"typescript",code:`// 좋음: 간단한 계산
const simpleComputed = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value + ref2.value
);

// 주의: 무거운 계산 - 메모이제이션 고려
const heavyComputed = createComputed(
  [itemsWatch, filterWatch],
  ([items, filter]) => {
    // 매 변경마다 실행됨
    return items.value
      .filter(item => item.name.includes(filter.value))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
);`}),e("h2",{children:"combineWatch와 비교"}),e("p",{children:[e("code",{children:"createComputed"}),"와 ",e("code",{children:"combineWatch"}),"는 다른 목적을 가지고 있습니다:"]}),e("ul",{children:[e("li",{children:[e("strong",{children:"createComputed"})," - 여러 스토어에서 ",e("em",{children:"새로운 값"}),"을 파생"]}),e("li",{children:[e("strong",{children:"combineWatch"})," - 여러 스토어를 ",e("em",{children:"튜플 구조"}),"로 그룹화"]})]}),e(t,{language:"typescript",code:`import { createStore, createComputed, combineWatch } from 'state-ref';

const watch1 = createStore(10);
const watch2 = createStore(20);

// createComputed: 파생된 값 반환
const sumWatch = createComputed(
  [watch1, watch2],
  ([ref1, ref2]) => ref1.value + ref2.value
);
const sum = sumWatch();
console.log(sum.value);  // 30 (단일 값)

// combineWatch: 그룹화된 스토어 반환
const combinedWatch = combineWatch([watch1, watch2]);
const combined = combinedWatch();
console.log(combined[0].value);  // 10
console.log(combined[1].value);  // 20`}),e("h2",{children:"모범 사례"}),e("ul",{children:[e("li",{children:[e("strong",{children:"순수한 계산 유지"})," - 콜백에서 사이드 이펙트 없이"]}),e("li",{children:[e("strong",{children:"필요한 값만 접근"})," - 사용하지 않는 프로퍼티는 읽지 않기"]}),e("li",{children:[e("strong",{children:"파생 상태에 사용"})," - 다른 상태에 의존하는 값에 완벽"]}),e("li",{children:[e("strong",{children:"수동 구독보다 선호"})," - 더 깔끔하고 효율적"]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 소스 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/combine-watch",children:"combineWatch"})," - 여러 watch 그룹화"]}),e("li",{children:[e("a",{href:"#/ko/guide/subscription",children:"구독"})," - 구독 이해하기"]}),e("li",{children:[e("a",{href:"#/ko/guide/react",children:"React 연동"})," - React와 함께 사용"]})]})]})),Ea=u(()=>()=>e("div",{children:[e("h1",{children:"combineWatch"}),e("p",{children:[e("code",{children:"combineWatch"})," is a helper function that observes multiple"," ",e("code",{children:"Watch"})," instances together and produces a new"," ",e("code",{children:"Watch"})," that delivers their combined values as a tuple-like structure."]}),e("p",{children:["Unlike ",e("code",{children:"createComputed"}),", which produces a single derived value,",e("code",{children:"combineWatch"})," focuses on grouping multiple watches so you can react to changes from any of them in a single subscription."]}),e("h2",{children:"Basic Usage"}),e(t,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';

const countWatch = createStore(100);
const textWatch = createStore('hello');

// Combine multiple watches into one
const combinedWatch = combineWatch([countWatch, textWatch]);

// Subscribe to combined changes
combinedWatch(([countRef, textRef], isFirst) => {
  console.log('Count:', countRef.value);
  console.log('Text:', textRef.value);
  console.log('Is first?', isFirst);
});

// Update any watch triggers the callback
const count = countWatch();
count.value = 200;
// Logs: Count: 200, Text: hello, Is first? false`}),e("h2",{children:"Syntax"}),e(t,{language:"typescript",code:`combineWatch<W extends readonly Watch<any>[]>(
  watches: [...W]
): Watch<CombinedValue<W>>`}),e("h3",{children:"Parameters"}),e("ul",{children:e("li",{children:[e("code",{children:"watches"})," - An array of watch functions to combine"]})}),e("h3",{children:"Returns"}),e("p",{children:["Returns a new ",e("code",{children:"Watch"})," function that provides access to all combined stores as a tuple. The returned watch can be used like any other watch function."]}),e("h2",{children:"Accessing Combined Values"}),e("p",{children:"The combined store is accessed as a tuple (array) by index:"}),e(t,{language:"typescript",code:`const watch1 = createStore(10);
const watch2 = createStore('hello');
const watch3 = createStore(true);

const combinedWatch = combineWatch([watch1, watch2, watch3]);

// Without callback - get reference
const combined = combinedWatch();

// Access by index
console.log(combined[0].value);  // 10 (number)
console.log(combined[1].value);  // 'hello' (string)
console.log(combined[2].value);  // true (boolean)

// Update individual stores
combined[0].value = 20;
combined[1].value = 'world';`}),e("h2",{children:"Subscribing to Changes"}),e("p",{children:"Pass a callback to subscribe to changes from any of the combined watches:"}),e(t,{language:"typescript",code:`const userWatch = createStore({ name: 'John' });
const settingsWatch = createStore({ theme: 'dark' });

const combinedWatch = combineWatch([userWatch, settingsWatch]);

combinedWatch(([userRef, settingsRef], isFirst) => {
  // Access .value first to collect subscriptions
  const userName = userRef.name.value;
  const theme = settingsRef.theme.value;

  if (isFirst) {
    console.log('Initial state');
    return;
  }

  console.log(\`User: \${userName}, Theme: \${theme}\`);
});

// Either update triggers the callback
const user = userWatch();
user.name.value = 'Jane';
// Logs: User: Jane, Theme: dark`}),e("h2",{children:"Cancelling a Subscription"}),e("p",{children:["A subscription made here is cancelled the same way as any other: return an ",e("code",{children:"AbortSignal"})," from the callback and abort it, or return"," ",e("code",{children:"false"})," to drop the subscription after that run. Both reach the inner subscriptions this helper opens on your behalf."]}),e(t,{language:"typescript",code:`const abortController = new AbortController();

combinedWatch((refs, isFirst) => {
  read(refs);
  if (isFirst) return abortController.signal;
  return abortController.signal;
});

abortController.abort();  // every inner subscription goes with it

// Or, to stop after a condition is met:
combinedWatch((refs, isFirst) => {
  if (done(refs)) return false;
});`}),e("h2",{children:"Nested Combination"}),e("p",{children:["You can nest ",e("code",{children:"combineWatch"})," to observe more complex structures:"]}),e(t,{language:"typescript",code:`const countWatch = createStore(100);
const textWatch = createStore('hello');
const toggleWatch = createStore(false);

// Combine countWatch and textWatch
const combinedCountTextWatch = combineWatch([countWatch, textWatch]);

// Nest the combined watch with toggleWatch
const combinedAllWatch = combineWatch([combinedCountTextWatch, toggleWatch]);

combinedAllWatch(([countTextRef, toggleRef], isFirst) => {
  const [countRef, textRef] = countTextRef;

  console.log('Count:', countRef.value);
  console.log('Text:', textRef.value);
  console.log('Toggle:', toggleRef.value);
});`}),e("h2",{children:"Read-Only Root Value"}),e("p",{children:["The combined store's root ",e("code",{children:".value"})," is read-only and shows a warning if accessed directly. Always access individual stores by index:"]}),e(t,{language:"typescript",code:`const watch1 = createStore(10);
const watch2 = createStore(20);

const combinedWatch = combineWatch([watch1, watch2]);
const combined = combinedWatch();

// ✗ Avoid: Accessing .value directly on combined store
console.log(combined.value);  // Warning + returns [10, 20]

// ✓ Correct: Access individual stores by index
console.log(combined[0].value);  // 10
console.log(combined[1].value);  // 20

// ✗ Cannot assign to combined .value
combined.value = [30, 40];  // Warning, no effect

// ✓ Update individual stores
combined[0].value = 30;
combined[1].value = 40;`}),e("h2",{children:"Using with as const"}),e("p",{children:["For better TypeScript inference, use ",e("code",{children:"as const"})," with the watches array:"]}),e(t,{language:"typescript",code:`const countWatch = createStore(100);
const textWatch = createStore('hello');

// With 'as const' for precise tuple typing
const combinedWatch = combineWatch([countWatch, textWatch] as const);

combinedWatch(([countRef, textRef]) => {
  // TypeScript knows:
  // countRef.value is number
  // textRef.value is string
  console.log(countRef.value + 1);      // OK
  console.log(textRef.value.toUpperCase());  // OK
});`}),e("h2",{children:"Framework Integration"}),e("p",{children:"Combined watches work with framework connectors:"}),e(t,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const userWatch = createStore({ name: 'John' });
const cartWatch = createStore({ items: [] });

const combinedWatch = combineWatch([userWatch, cartWatch]);

// Create React hook from combined watch
const useCombinedStore = connectReact(combinedWatch);

function Dashboard() {
  const [user, cart] = useCombinedStore();

  return (
    <div>
      <p>User: {user.name.value}</p>
      <p>Cart items: {cart.items.value.length}</p>
    </div>
  );
}`}),e("h2",{children:"Comparison with createComputed"}),e("p",{children:"Choose the right tool based on your needs:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"combineWatch"})," - Groups stores, maintains individual access"]}),e("li",{children:[e("strong",{children:"createComputed"})," - Derives a new single value from stores"]})]}),e(t,{language:"typescript",code:`import { createStore, combineWatch, createComputed } from 'state-ref';

const widthWatch = createStore(10);
const heightWatch = createStore(20);

// combineWatch: Group stores as tuple
const dimensionsWatch = combineWatch([widthWatch, heightWatch]);
const dimensions = dimensionsWatch();
console.log(dimensions[0].value);  // 10 (width)
console.log(dimensions[1].value);  // 20 (height)

// createComputed: Derive new value
const areaWatch = createComputed(
  [widthWatch, heightWatch],
  ([w, h]) => w.value * h.value
);
const area = areaWatch();
console.log(area.value);  // 200 (computed area)`}),e("h2",{children:"Use Cases"}),e("h3",{children:"Coordinating Multiple Stores"}),e(t,{language:"typescript",code:`const authWatch = createStore({ user: null, token: null });
const uiWatch = createStore({ theme: 'light', sidebar: true });
const dataWatch = createStore({ items: [], loading: false });

// Combine all app state
const appWatch = combineWatch([authWatch, uiWatch, dataWatch]);

appWatch(([auth, ui, data], isFirst) => {
  const user = auth.user.value;
  const theme = ui.theme.value;
  const loading = data.loading.value;

  if (isFirst) return;

  console.log('App state changed');
  console.log(\`User: \${user}, Theme: \${theme}, Loading: \${loading}\`);
});`}),e("h3",{children:"Form with Multiple Fields"}),e(t,{language:"typescript",code:`const nameWatch = createStore('');
const emailWatch = createStore('');
const ageWatch = createStore(0);

const formWatch = combineWatch([nameWatch, emailWatch, ageWatch]);

// Validate form on any change
formWatch(([name, email, age], isFirst) => {
  const nameVal = name.value;
  const emailVal = email.value;
  const ageVal = age.value;

  if (isFirst) return;

  const isValid = nameVal.length > 0 &&
                  emailVal.includes('@') &&
                  ageVal >= 18;

  console.log('Form valid:', isValid);
});`}),e("h2",{children:"TypeScript Support"}),e("p",{children:[e("code",{children:"combineWatch"})," preserves type information for each store in the tuple:"]}),e(t,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';

interface User {
  id: number;
  name: string;
}

interface Settings {
  theme: 'light' | 'dark';
  lang: string;
}

const userWatch = createStore<User>({ id: 1, name: 'John' });
const settingsWatch = createStore<Settings>({ theme: 'light', lang: 'en' });

const combinedWatch = combineWatch([userWatch, settingsWatch] as const);

combinedWatch(([userRef, settingsRef]) => {
  // Fully typed access
  const userId: number = userRef.id.value;
  const userName: string = userRef.name.value;
  const theme: 'light' | 'dark' = settingsRef.theme.value;
  const lang: string = settingsRef.lang.value;

  console.log(userId, userName, theme, lang);
});`}),e("h2",{children:"Best Practices"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Use for grouping related stores"})," - When you need to react to multiple stores together"]}),e("li",{children:[e("strong",{children:"Access by index"})," - Always use ",e("code",{children:"combined[0]"}),", ",e("code",{children:"combined[1]"}),", etc."]}),e("li",{children:[e("strong",{children:["Use ",e("code",{children:"as const"})]})," ","- For better TypeScript tuple inference"]}),e("li",{children:[e("strong",{children:"Prefer createComputed for derived values"})," - Use combineWatch only when you need individual store access"]}),e("li",{children:[e("strong",{children:"Access .value first in callbacks"})," - Ensure subscription collection before conditionals"]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/computed",children:"createComputed"})," - Deriving single values from stores"]}),e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - Creating individual stores"]}),e("li",{children:[e("a",{href:"#/guide/subscription",children:"Subscription"})," - Understanding subscriptions"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - The watch function API"]})]})]})),Ia=u(()=>()=>e("div",{children:[e("h1",{children:"combineWatch"}),e("p",{children:[e("code",{children:"combineWatch"}),"는 여러 ",e("code",{children:"Watch"})," 인스턴스를 함께 관찰하고 그 결합된 값을 튜플과 같은 구조로 전달하는 새로운"," ",e("code",{children:"Watch"}),"를 생성하는 헬퍼 함수입니다."]}),e("p",{children:["단일 파생 값을 생성하는 ",e("code",{children:"createComputed"}),"와 달리,",e("code",{children:"combineWatch"}),"는 여러 watch를 그룹화하여 단일 구독에서 어떤 것이든 변경에 반응할 수 있게 하는 데 초점을 맞춥니다."]}),e("h2",{children:"기본 사용법"}),e(t,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';

const countWatch = createStore(100);
const textWatch = createStore('hello');

// 여러 watch를 하나로 결합
const combinedWatch = combineWatch([countWatch, textWatch]);

// 결합된 변경 사항 구독
combinedWatch(([countRef, textRef], isFirst) => {
  console.log('Count:', countRef.value);
  console.log('Text:', textRef.value);
  console.log('첫 실행?', isFirst);
});

// 어떤 watch든 업데이트하면 콜백 트리거
const count = countWatch();
count.value = 200;
// 로그: Count: 200, Text: hello, 첫 실행? false`}),e("h2",{children:"문법"}),e(t,{language:"typescript",code:`combineWatch<W extends readonly Watch<any>[]>(
  watches: [...W]
): Watch<CombinedValue<W>>`}),e("h3",{children:"매개변수"}),e("ul",{children:e("li",{children:[e("code",{children:"watches"})," - 결합할 watch 함수 배열"]})}),e("h3",{children:"반환값"}),e("p",{children:["모든 결합된 스토어에 튜플로 접근할 수 있는 새로운 ",e("code",{children:"Watch"})," ","함수를 반환합니다. 반환된 watch는 다른 watch 함수처럼 사용할 수 있습니다."]}),e("h2",{children:"구독 해제"}),e("p",{children:["여기서 만든 구독도 해제 방법은 같습니다. 콜백에서"," ",e("code",{children:"AbortSignal"}),"을 반환한 뒤 abort하거나, ",e("code",{children:"false"}),"를 반환해 그 실행 이후 구독을 끊습니다. 두 방법 모두 이 헬퍼가 내부적으로 연 구독까지 함께 정리합니다."]}),e(t,{language:"typescript",code:`const abortController = new AbortController();

combinedWatch((refs, isFirst) => {
  read(refs);
  return abortController.signal;
});

abortController.abort();  // 내부 구독까지 모두 해제된다

// 조건이 충족되면 멈추고 싶다면:
combinedWatch((refs, isFirst) => {
  if (done(refs)) return false;
});`}),e("h2",{children:"결합된 값 접근"}),e("p",{children:"결합된 스토어는 인덱스로 튜플(배열)처럼 접근합니다:"}),e(t,{language:"typescript",code:`const watch1 = createStore(10);
const watch2 = createStore('hello');
const watch3 = createStore(true);

const combinedWatch = combineWatch([watch1, watch2, watch3]);

// 콜백 없이 - 참조 얻기
const combined = combinedWatch();

// 인덱스로 접근
console.log(combined[0].value);  // 10 (number)
console.log(combined[1].value);  // 'hello' (string)
console.log(combined[2].value);  // true (boolean)

// 개별 스토어 업데이트
combined[0].value = 20;
combined[1].value = 'world';`}),e("h2",{children:"변경 사항 구독"}),e("p",{children:"콜백을 전달하여 결합된 watch 중 어느 것이든 변경을 구독합니다:"}),e(t,{language:"typescript",code:`const userWatch = createStore({ name: 'John' });
const settingsWatch = createStore({ theme: 'dark' });

const combinedWatch = combineWatch([userWatch, settingsWatch]);

combinedWatch(([userRef, settingsRef], isFirst) => {
  // 먼저 .value에 접근하여 구독 수집
  const userName = userRef.name.value;
  const theme = settingsRef.theme.value;

  if (isFirst) {
    console.log('초기 상태');
    return;
  }

  console.log(\`사용자: \${userName}, 테마: \${theme}\`);
});

// 어느 쪽이든 업데이트하면 콜백 트리거
const user = userWatch();
user.name.value = 'Jane';
// 로그: 사용자: Jane, 테마: dark`}),e("h2",{children:"중첩 결합"}),e("p",{children:[e("code",{children:"combineWatch"}),"를 중첩하여 더 복잡한 구조를 관찰할 수 있습니다:"]}),e(t,{language:"typescript",code:`const countWatch = createStore(100);
const textWatch = createStore('hello');
const toggleWatch = createStore(false);

// countWatch와 textWatch 결합
const combinedCountTextWatch = combineWatch([countWatch, textWatch]);

// 결합된 watch를 toggleWatch와 중첩
const combinedAllWatch = combineWatch([combinedCountTextWatch, toggleWatch]);

combinedAllWatch(([countTextRef, toggleRef], isFirst) => {
  const [countRef, textRef] = countTextRef;

  console.log('Count:', countRef.value);
  console.log('Text:', textRef.value);
  console.log('Toggle:', toggleRef.value);
});`}),e("h2",{children:"읽기 전용 루트 값"}),e("p",{children:["결합된 스토어의 루트 ",e("code",{children:".value"}),"는 읽기 전용이며 직접 접근하면 경고가 표시됩니다. 항상 인덱스로 개별 스토어에 접근하세요:"]}),e(t,{language:"typescript",code:`const watch1 = createStore(10);
const watch2 = createStore(20);

const combinedWatch = combineWatch([watch1, watch2]);
const combined = combinedWatch();

// ✗ 피하기: 결합된 스토어에서 .value 직접 접근
console.log(combined.value);  // 경고 + [10, 20] 반환

// ✓ 올바름: 인덱스로 개별 스토어 접근
console.log(combined[0].value);  // 10
console.log(combined[1].value);  // 20

// ✗ 결합된 .value에 할당 불가
combined.value = [30, 40];  // 경고, 효과 없음

// ✓ 개별 스토어 업데이트
combined[0].value = 30;
combined[1].value = 40;`}),e("h2",{children:"as const 사용"}),e("p",{children:["더 나은 TypeScript 추론을 위해 watches 배열에 ",e("code",{children:"as const"}),"를 사용하세요:"]}),e(t,{language:"typescript",code:`const countWatch = createStore(100);
const textWatch = createStore('hello');

// 정확한 튜플 타이핑을 위해 'as const' 사용
const combinedWatch = combineWatch([countWatch, textWatch] as const);

combinedWatch(([countRef, textRef]) => {
  // TypeScript가 알고 있음:
  // countRef.value는 number
  // textRef.value는 string
  console.log(countRef.value + 1);      // OK
  console.log(textRef.value.toUpperCase());  // OK
});`}),e("h2",{children:"프레임워크 연동"}),e("p",{children:"결합된 watch는 프레임워크 커넥터와 함께 작동합니다:"}),e(t,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const userWatch = createStore({ name: 'John' });
const cartWatch = createStore({ items: [] });

const combinedWatch = combineWatch([userWatch, cartWatch]);

// 결합된 watch에서 React 훅 생성
const useCombinedStore = connectReact(combinedWatch);

function Dashboard() {
  const [user, cart] = useCombinedStore();

  return (
    <div>
      <p>사용자: {user.name.value}</p>
      <p>장바구니 항목: {cart.items.value.length}</p>
    </div>
  );
}`}),e("h2",{children:"createComputed와 비교"}),e("p",{children:"필요에 따라 올바른 도구를 선택하세요:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"combineWatch"})," - 스토어 그룹화, 개별 접근 유지"]}),e("li",{children:[e("strong",{children:"createComputed"})," - 스토어에서 새로운 단일 값 파생"]})]}),e(t,{language:"typescript",code:`import { createStore, combineWatch, createComputed } from 'state-ref';

const widthWatch = createStore(10);
const heightWatch = createStore(20);

// combineWatch: 스토어를 튜플로 그룹화
const dimensionsWatch = combineWatch([widthWatch, heightWatch]);
const dimensions = dimensionsWatch();
console.log(dimensions[0].value);  // 10 (width)
console.log(dimensions[1].value);  // 20 (height)

// createComputed: 새 값 파생
const areaWatch = createComputed(
  [widthWatch, heightWatch],
  ([w, h]) => w.value * h.value
);
const area = areaWatch();
console.log(area.value);  // 200 (계산된 면적)`}),e("h2",{children:"사용 사례"}),e("h3",{children:"여러 스토어 조정"}),e(t,{language:"typescript",code:`const authWatch = createStore({ user: null, token: null });
const uiWatch = createStore({ theme: 'light', sidebar: true });
const dataWatch = createStore({ items: [], loading: false });

// 모든 앱 상태 결합
const appWatch = combineWatch([authWatch, uiWatch, dataWatch]);

appWatch(([auth, ui, data], isFirst) => {
  const user = auth.user.value;
  const theme = ui.theme.value;
  const loading = data.loading.value;

  if (isFirst) return;

  console.log('앱 상태 변경됨');
  console.log(\`사용자: \${user}, 테마: \${theme}, 로딩: \${loading}\`);
});`}),e("h3",{children:"여러 필드가 있는 폼"}),e(t,{language:"typescript",code:`const nameWatch = createStore('');
const emailWatch = createStore('');
const ageWatch = createStore(0);

const formWatch = combineWatch([nameWatch, emailWatch, ageWatch]);

// 모든 변경에 폼 유효성 검사
formWatch(([name, email, age], isFirst) => {
  const nameVal = name.value;
  const emailVal = email.value;
  const ageVal = age.value;

  if (isFirst) return;

  const isValid = nameVal.length > 0 &&
                  emailVal.includes('@') &&
                  ageVal >= 18;

  console.log('폼 유효:', isValid);
});`}),e("h2",{children:"TypeScript 지원"}),e("p",{children:[e("code",{children:"combineWatch"}),"는 튜플의 각 스토어에 대한 타입 정보를 보존합니다:"]}),e(t,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';

interface User {
  id: number;
  name: string;
}

interface Settings {
  theme: 'light' | 'dark';
  lang: string;
}

const userWatch = createStore<User>({ id: 1, name: 'John' });
const settingsWatch = createStore<Settings>({ theme: 'light', lang: 'ko' });

const combinedWatch = combineWatch([userWatch, settingsWatch] as const);

combinedWatch(([userRef, settingsRef]) => {
  // 완전한 타입 접근
  const userId: number = userRef.id.value;
  const userName: string = userRef.name.value;
  const theme: 'light' | 'dark' = settingsRef.theme.value;
  const lang: string = settingsRef.lang.value;

  console.log(userId, userName, theme, lang);
});`}),e("h2",{children:"모범 사례"}),e("ul",{children:[e("li",{children:[e("strong",{children:"관련 스토어 그룹화에 사용"})," - 여러 스토어에 함께 반응해야 할 때"]}),e("li",{children:[e("strong",{children:"인덱스로 접근"})," - 항상 ",e("code",{children:"combined[0]"}),","," ",e("code",{children:"combined[1]"})," 등 사용"]}),e("li",{children:[e("strong",{children:[e("code",{children:"as const"})," 사용"]})," ","- 더 나은 TypeScript 튜플 추론을 위해"]}),e("li",{children:[e("strong",{children:"파생 값에는 createComputed 선호"})," - 개별 스토어 접근이 필요할 때만 combineWatch 사용"]}),e("li",{children:[e("strong",{children:"콜백에서 .value 먼저 접근"})," - 조건문 전에 구독 수집 보장"]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/computed",children:"createComputed"})," - 스토어에서 단일 값 파생"]}),e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 개별 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/subscription",children:"구독"})," - 구독 이해하기"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - watch 함수 API"]})]})]})),Pa=u(()=>()=>e("div",{children:[e("h1",{children:"batch"}),e("p",{children:[e("code",{children:"batch"})," groups several writes into one synchronous notification pass. A subscriber that reads two paths runs once with the final values instead of once per write."]}),e("p",{children:["It ships as a separate entry point. Importing ",e("code",{children:"state-ref"})," ","alone does not load it, so the core bundle stays the same size for apps that never call it."]}),e("h2",{children:"Basic Usage"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';
import { batch } from 'state-ref/batch';

const watch = createStore({ b: 0, c: 0 });

watch(state => {
  console.log(state.b.value, state.c.value);
}); // runs once immediately to collect both dependencies

const ref = watch();

batch(() => {
  ref.b.value = 3;
  ref.c.value = 4;
}); // the subscriber runs once with 3, 4 - before batch returns`}),e("p",{children:["Without the batch, that subscriber would run twice: once for"," ",e("code",{children:"b"})," and once for ",e("code",{children:"c"}),"."]}),e("h2",{children:"Values Change Immediately"}),e("p",{children:[e("code",{children:"batch"})," defers ",e("em",{children:"notification"}),", not the write. Inside the callback every read already sees the new value."]}),e(t,{language:"typescript",code:`batch(() => {
  ref.b.value = 3;
  console.log(ref.b.value); // 3 - already written
  ref.c.value = ref.b.value + 1; // reads the fresh value
});`}),e("h2",{children:"Writing From a Subscriber"}),e("p",{children:["The ref passed into a ",e("code",{children:"watch"})," callback can write inside a batch too."]}),e(t,{language:"typescript",code:`watch((state, isFirst) => {
  if (isFirst) return;
  batch(() => {
    state.b.value += 1;
    state.c.value += 1;
  });
});`}),e("h2",{children:"Nesting"}),e("p",{children:"Nested calls flush only at the outermost boundary, so a helper that batches internally stays correct when a caller wraps it in another batch."}),e(t,{language:"typescript",code:`batch(() => {
  ref.b.value = 1;
  batch(() => {
    ref.c.value = 2;
  }); // does not flush here
}); // flushes once, here`}),e("h2",{children:"What batch Does Not Do"}),e("ul",{children:[e("li",{children:[e("strong",{children:"It is not a transaction."})," If the callback throws, the writes already made stay written. Nothing is rolled back."]}),e("li",{children:[e("strong",{children:["It cannot span an ",e("code",{children:"await"}),"."]})," ","The pass is synchronous; writes made after an await are outside the batch."]}),e("li",{children:[e("strong",{children:"It does not change ordinary writes."})," Writes outside a batch still notify synchronously, one per write."]}),e("li",{children:[e("strong",{children:["It does not replace ",e("code",{children:"sync()"}),"."]})," ","A store made with ",e("code",{children:"createStoreManualSync"})," still requires its explicit call."]})]}),e("h2",{children:"UMD"}),e("p",{children:["The UMD build is a companion script. Load ",e("code",{children:"state-ref.umd.js"})," ","first, then ",e("code",{children:"state-ref.batch.umd.js"}),", and call"," ",e("code",{children:"stateRefBatch.batch"}),"."]}),e(t,{language:"html",code:`<script src="state-ref.umd.js"><\/script>
<script src="state-ref.batch.umd.js"><\/script>
<script>
  const watch = stateRef.createStore({ b: 0, c: 0 });
  const ref = watch();
  stateRefBatch.batch(() => {
    ref.b.value = 3;
    ref.c.value = 4;
  });
<\/script>`}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/manual-sync",children:"Manual Sync (Flux)"})," - the other way to control when subscribers run"]}),e("li",{children:[e("a",{href:"#/guide/subscription",children:"Subscription"})," - how dependencies are collected"]}),e("li",{children:[e("a",{href:"#/guide/draft",children:"createDraft"})," - a separate entry point for local edit sessions"]})]})]})),Da=u(()=>()=>e("div",{children:[e("h1",{children:"batch"}),e("p",{children:[e("code",{children:"batch"}),"는 여러 번의 쓰기를 하나의 동기 알림 패스로 묶습니다. 두 경로를 읽는 구독자가 쓰기마다 한 번씩이 아니라, 최종 값으로 한 번만 실행됩니다."]}),e("p",{children:["별도 진입점입니다. ",e("code",{children:"state-ref"}),"만 import하면 로드되지 않으므로, 쓰지 않는 앱의 코어 번들 크기는 그대로입니다."]}),e("h2",{children:"기본 사용법"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';
import { batch } from 'state-ref/batch';

const watch = createStore({ b: 0, c: 0 });

watch(state => {
  console.log(state.b.value, state.c.value);
}); // 의존성 수집을 위해 즉시 한 번 실행된다

const ref = watch();

batch(() => {
  ref.b.value = 3;
  ref.c.value = 4;
}); // 구독자가 3, 4로 한 번만 실행된다 — batch가 반환되기 전에`}),e("p",{children:["batch가 없으면 그 구독자는 두 번 실행됩니다. ",e("code",{children:"b"}),"에 한 번,"," ",e("code",{children:"c"}),"에 한 번."]}),e("h2",{children:"값은 즉시 바뀐다"}),e("p",{children:[e("code",{children:"batch"}),"가 미루는 것은 ",e("em",{children:"알림"}),"이지 쓰기가 아닙니다. 콜백 안에서 읽으면 이미 새 값이 보입니다."]}),e(t,{language:"typescript",code:`batch(() => {
  ref.b.value = 3;
  console.log(ref.b.value); // 3 — 이미 쓰였다
  ref.c.value = ref.b.value + 1; // 방금 쓴 값을 읽는다
});`}),e("h2",{children:"구독자 안에서 쓰기"}),e("p",{children:[e("code",{children:"watch"})," 콜백이 받은 ref도 batch 안에서 쓸 수 있습니다."]}),e(t,{language:"typescript",code:`watch((state, isFirst) => {
  if (isFirst) return;
  batch(() => {
    state.b.value += 1;
    state.c.value += 1;
  });
});`}),e("h2",{children:"중첩"}),e("p",{children:"중첩 호출은 가장 바깥 경계에서만 flush합니다. 내부적으로 batch를 쓰는 헬퍼를 호출자가 다시 batch로 감싸도 동작이 유지됩니다."}),e(t,{language:"typescript",code:`batch(() => {
  ref.b.value = 1;
  batch(() => {
    ref.c.value = 2;
  }); // 여기서는 flush하지 않는다
}); // 여기서 한 번 flush한다`}),e("h2",{children:"batch가 하지 않는 것"}),e("ul",{children:[e("li",{children:[e("strong",{children:"트랜잭션이 아닙니다."})," 콜백이 예외를 던져도 이미 한 쓰기는 그대로 남습니다. 되돌리지 않습니다."]}),e("li",{children:[e("strong",{children:[e("code",{children:"await"}),"를 건너뛸 수 없습니다."]})," ","패스는 동기적이므로, await 이후의 쓰기는 batch 밖입니다."]}),e("li",{children:[e("strong",{children:"일반 쓰기를 바꾸지 않습니다."})," batch 밖의 쓰기는 여전히 쓸 때마다 동기적으로 알립니다."]}),e("li",{children:[e("strong",{children:[e("code",{children:"sync()"}),"를 대체하지 않습니다."]})," ",e("code",{children:"createStoreManualSync"}),"로 만든 스토어는 여전히 명시적 호출이 필요합니다."]})]}),e("h2",{children:"UMD"}),e("p",{children:["UMD 빌드는 동반 스크립트입니다. ",e("code",{children:"state-ref.umd.js"}),"를 먼저 불러오고 그다음 ",e("code",{children:"state-ref.batch.umd.js"}),"를 불러온 뒤"," ",e("code",{children:"stateRefBatch.batch"}),"를 호출합니다."]}),e(t,{language:"html",code:`<script src="state-ref.umd.js"><\/script>
<script src="state-ref.batch.umd.js"><\/script>
<script>
  const watch = stateRef.createStore({ b: 0, c: 0 });
  const ref = watch();
  stateRefBatch.batch(() => {
    ref.b.value = 3;
    ref.c.value = 4;
  });
<\/script>`}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화 (Flux)"})," - 구독자 실행 시점을 제어하는 다른 방법"]}),e("li",{children:[e("a",{href:"#/ko/guide/subscription",children:"구독"})," - 의존성이 수집되는 방식"]}),e("li",{children:[e("a",{href:"#/ko/guide/draft",children:"createDraft"})," - 로컬 편집 세션을 위한 또 다른 진입점"]})]})]})),Na=u(()=>()=>e("div",{children:[e("h1",{children:"createDraft"}),e("p",{children:["A draft is an independent local edit session over an existing ref. Edits stay inside the draft until you ",e("code",{children:"apply()"})," them, so a form can hold half-finished input without the rest of the screen seeing it."]}),e("p",{children:["It ships as a separate entry point. Importing ",e("code",{children:"state-ref"})," ","alone does not load it."]}),e("h2",{children:"Basic Usage"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';
import { createDraft } from 'state-ref/draft';

const source = createStore({ address: { city: 'Seoul', zip: 100 } })();

const editor = createDraft(source.address);
editor.ref.city.value = 'Busan';

editor.isDirty();  // true
editor.changes();  // city: Seoul -> Busan
editor.apply();    // merges into the source locally; contacts no server
editor.discard();  // releases subscriptions and closes the session`}),e("h2",{children:"It Starts From the Current Value"}),e("p",{children:["A draft copies the source's value ",e("em",{children:"at the moment it is branched"}),", and it does not inherit the source's own change history. A source that is already dirty produces a draft that is clean."]}),e(t,{language:"typescript",code:`// the source already holds an unsaved edit
source.address.city.value = 'Busan';

const editor = createDraft(source.address);

editor.ref.city.value;     // 'Busan'  - the branch point
editor.isDirty();          // false    - not the parent's history
editor.changes();          // []

editor.ref.city.value = 'Daejeon';
editor.changes()[0].before; // { exists: true, value: 'Busan' }`}),e("p",{children:["The ",e("code",{children:"before"})," of that change is ",e("code",{children:"'Busan'"}),", not the source's original ",e("code",{children:"'Seoul'"}),": a change is relative to where the draft branched, not to where the source started."]}),e("h2",{children:"Two Drafts Over One Source"}),e("p",{children:"Drafts are independent of each other. Editing one does not touch the other, and neither touches the source until it applies."}),e(t,{language:"typescript",code:`const a = createDraft(source.address);
const b = createDraft(source.address);

a.ref.city.value = 'Daejeon';

a.ref.city.value;            // 'Daejeon'
b.ref.city.value;            // unchanged
source.address.city.value;   // unchanged`}),e("h2",{children:"Reading the Draft"}),e("p",{children:[e("code",{children:"draft.ref"})," reads and writes the draft's own value."," ",e("code",{children:"draft.watch"})," has the same ",e("code",{children:"Watch"})," shape the UI connectors accept, so a draft binds to a component exactly like a store."]}),e(t,{language:"typescript",code:`// with a connector, e.g. React
const useDraft = connectReact(editor.watch);

function CityField() {
  const state = useDraft();
  return (
    <input
      value={state.city.value}
      onChange={event => (state.city.value = event.target.value)}
    />
  );
}`}),e("h2",{children:"Status"}),e("p",{children:[e("code",{children:"draft.status"})," exposes ",e("code",{children:"dirty"}),","," ",e("code",{children:"conflicts"})," and ",e("code",{children:"version"})," as reactive values, without adding any field to the payload you are editing."," ",e("code",{children:"draft.watchStatus"})," is its subscribable form."]}),e(t,{language:"typescript",code:`editor.status.dirty.value;      // boolean
editor.status.conflicts.value;  // number
editor.status.version.value;    // number

// or subscribe
editor.watchStatus(status => {
  console.log(status.dirty.value, status.conflicts.value);
});

// the same three, read once
editor.isDirty();
editor.version();`}),e("h2",{children:"Changes"}),e("p",{children:[e("code",{children:"changes()"})," returns one row per edited path. Each row carries what the draft had at the branch point (",e("code",{children:"before"}),"), what it holds now (",e("code",{children:"after"}),"), and what the source holds at this moment (",e("code",{children:"source"}),")."]}),e(t,{language:"typescript",code:`const [change] = editor.changes();

change.path;      // ['city']
change.before;    // { exists: true, value: 'Seoul' }
change.after;     // { exists: true, value: 'Busan' }
change.source;    // { exists: true, value: 'Seoul' }  - right now
change.conflict;  // false
change.id;        // stable within this session
change.version;   // the draft version this row was read at`}),e("p",{children:[e("code",{children:"before"}),", ",e("code",{children:"after"})," and ",e("code",{children:"source"})," are"," ",e("code",{children:"{ exists, value }"}),' rather than bare values, because "the path is absent" and "the path holds'," ",e("code",{children:"undefined"}),'" are different facts.']}),e("h2",{children:"Arrays Are One Field"}),e("p",{children:["Editing one element records a change for the"," ",e("strong",{children:"whole array"}),", not for the index. An index is a position, not an identity: if the source reorders, an index-level change would silently land on a different item."]}),e(t,{language:"typescript",code:`const editor = createDraft(source);
editor.ref.contacts[0].name.value = 'Kim';

editor.changes()[0].path; // ['contacts'] - not ['contacts', '0', 'name']`}),e("h2",{children:"What a Draft Accepts"}),e("p",{children:"Drafts edit acyclic plain data and dense arrays. Rejected, each with its own error:"}),e("ul",{children:[e("li",{children:["functions, ",e("code",{children:"Date"}),", ",e("code",{children:"Map"})," and similar non-plain values"]}),e("li",{children:"core-reserved payload keys"}),e("li",{children:["direct mutation of an object you obtained through the draft's"," ",e("code",{children:".value"})," - copy it instead"]})]}),e("h2",{children:"UMD"}),e("p",{children:["The UMD build is a companion script. Load ",e("code",{children:"state-ref.umd.js"})," ","first, then ",e("code",{children:"state-ref.draft.umd.js"}),", and use the"," ",e("code",{children:"stateRefDraft"})," global."]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/draft-apply",children:"apply, reset and discard"})," - moving edits into the source, and ending the session"]}),e("li",{children:[e("a",{href:"#/guide/draft-conflicts",children:"Conflicts"})," - what happens when the source moves underneath"]}),e("li",{children:[e("a",{href:"#/guide/draft-lifetime",children:"Lifetime"})," - subscriptions and cleanup"]}),e("li",{children:[e("a",{href:"#/api/draft",children:"Draft API"})," - the full type surface"]})]})]})),Ma=u(()=>()=>e("div",{children:[e("h1",{children:"createDraft"}),e("p",{children:["draft는 기존 ref 위에 만드는 독립된 로컬 편집 세션입니다. 편집은"," ",e("code",{children:"apply()"}),"를 부를 때까지 draft 안에 머물기 때문에, 폼이 완성되지 않은 입력을 들고 있어도 화면의 다른 곳은 그것을 보지 않습니다."]}),e("p",{children:["별도 진입점입니다. ",e("code",{children:"state-ref"}),"만 import하면 로드되지 않습니다."]}),e("h2",{children:"기본 사용법"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';
import { createDraft } from 'state-ref/draft';

const source = createStore({ address: { city: 'Seoul', zip: 100 } })();

const editor = createDraft(source.address);
editor.ref.city.value = 'Busan';

editor.isDirty();  // true
editor.changes();  // city: Seoul -> Busan
editor.apply();    // 원본에 로컬로 병합한다. 서버와 통신하지 않는다
editor.discard();  // 구독을 놓고 세션을 닫는다`}),e("h2",{children:"분기한 시점의 값에서 시작한다"}),e("p",{children:["draft는 ",e("em",{children:"분기하는 순간의"})," 원본 값을 복사하고, 원본이 가진 변경 기록은 물려받지 않습니다. 이미 dirty한 원본에서 분기해도 draft는 깨끗합니다."]}),e(t,{language:"typescript",code:`// 원본이 이미 저장되지 않은 편집을 들고 있다
source.address.city.value = 'Busan';

const editor = createDraft(source.address);

editor.ref.city.value;     // 'Busan'  — 분기 지점
editor.isDirty();          // false    — 부모의 기록이 아니다
editor.changes();          // []

editor.ref.city.value = 'Daejeon';
editor.changes()[0].before; // { exists: true, value: 'Busan' }`}),e("p",{children:["그 변경의 ",e("code",{children:"before"}),"는 원본이 출발했던 ",e("code",{children:"'Seoul'"}),"이 아니라 ",e("code",{children:"'Busan'"}),"입니다. 변경은 원본의 출발점이 아니라"," ",e("strong",{children:"draft가 갈라져 나온 지점"}),"을 기준으로 합니다."]}),e("h2",{children:"한 원본 위의 두 draft"}),e("p",{children:"draft끼리는 서로 독립입니다. 하나를 편집해도 다른 하나에 닿지 않고, 적용하기 전까지는 원본에도 닿지 않습니다."}),e(t,{language:"typescript",code:`const a = createDraft(source.address);
const b = createDraft(source.address);

a.ref.city.value = 'Daejeon';

a.ref.city.value;            // 'Daejeon'
b.ref.city.value;            // 그대로
source.address.city.value;   // 그대로`}),e("h2",{children:"draft 읽기"}),e("p",{children:[e("code",{children:"draft.ref"}),"는 draft 자신의 값을 읽고 씁니다."," ",e("code",{children:"draft.watch"}),"는 UI 커넥터가 받는 ",e("code",{children:"Watch"}),"와 같은 모양이라, draft를 컴포넌트에 연결하는 방법이 스토어와 똑같습니다."]}),e(t,{language:"typescript",code:`// 커넥터와 함께, 예를 들어 React
const useDraft = connectReact(editor.watch);

function CityField() {
  const state = useDraft();
  return (
    <input
      value={state.city.value}
      onChange={event => (state.city.value = event.target.value)}
    />
  );
}`}),e("h2",{children:"상태"}),e("p",{children:[e("code",{children:"draft.status"}),"는 ",e("code",{children:"dirty"}),"·",e("code",{children:"conflicts"}),"·",e("code",{children:"version"}),"을 반응형 값으로 냅니다. 편집 중인 payload에는 어떤 필드도 더하지 않습니다. ",e("code",{children:"draft.watchStatus"}),"는 그것의 구독 가능한 형태입니다."]}),e(t,{language:"typescript",code:`editor.status.dirty.value;      // boolean
editor.status.conflicts.value;  // number
editor.status.version.value;    // number

// 또는 구독
editor.watchStatus(status => {
  console.log(status.dirty.value, status.conflicts.value);
});

// 같은 값을 한 번만 읽기
editor.isDirty();
editor.version();`}),e("h2",{children:"변경 목록"}),e("p",{children:[e("code",{children:"changes()"}),"는 편집한 경로마다 한 줄을 냅니다. 각 줄은 분기 시점의 값(",e("code",{children:"before"}),"), 지금 draft가 든 값(",e("code",{children:"after"}),"), 그리고 ",e("strong",{children:"지금 이 순간 원본이 든 값"}),"(",e("code",{children:"source"}),")을 함께 들고 있습니다."]}),e(t,{language:"typescript",code:`const [change] = editor.changes();

change.path;      // ['city']
change.before;    // { exists: true, value: 'Seoul' }
change.after;     // { exists: true, value: 'Busan' }
change.source;    // { exists: true, value: 'Seoul' }  — 현재
change.conflict;  // false
change.id;        // 이 세션 안에서 안정적이다
change.version;   // 이 줄을 읽은 draft 버전`}),e("p",{children:[e("code",{children:"before"}),"·",e("code",{children:"after"}),"·",e("code",{children:"source"}),"가 값 자체가 아니라 ",e("code",{children:"{ exists, value }"}),'인 이유는, "경로가 없다"와 "경로가 ',e("code",{children:"undefined"}),'를 담고 있다"가 서로 다른 사실이기 때문입니다.']}),e("h2",{children:"배열은 한 필드다"}),e("p",{children:["원소 하나를 고쳐도 변경은 ",e("strong",{children:"배열 전체"}),"로 기록됩니다. 인덱스는 위치이지 정체성이 아니므로, 원본이 재정렬되면 인덱스 단위의 변경은 조용히 다른 항목에 내려앉게 됩니다."]}),e(t,{language:"typescript",code:`const editor = createDraft(source);
editor.ref.contacts[0].name.value = 'Kim';

editor.changes()[0].path; // ['contacts'] — ['contacts','0','name']이 아니다`}),e("h2",{children:"draft가 받는 것"}),e("p",{children:"draft는 순환 없는 평범한 데이터와 조밀한 배열을 편집합니다. 다음은 각각 자기 오류로 거절합니다."}),e("ul",{children:[e("li",{children:["함수, ",e("code",{children:"Date"}),", ",e("code",{children:"Map"})," 같은 평범하지 않은 값"]}),e("li",{children:"코어가 예약한 payload 키"}),e("li",{children:["draft의 ",e("code",{children:".value"}),"로 얻은 객체를 직접 변형하는 것 — 복사해서 쓰세요"]})]}),e("h2",{children:"UMD"}),e("p",{children:["UMD 빌드는 동반 스크립트입니다. ",e("code",{children:"state-ref.umd.js"}),"를 먼저 불러오고 그다음 ",e("code",{children:"state-ref.draft.umd.js"}),"를 불러온 뒤"," ",e("code",{children:"stateRefDraft"})," 전역을 씁니다."]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/draft-apply",children:"apply · reset · discard"})," - 편집을 원본으로 옮기고 세션을 끝내기"]}),e("li",{children:[e("a",{href:"#/ko/guide/draft-conflicts",children:"충돌과 해소"})," - 원본이 밑에서 움직였을 때"]}),e("li",{children:[e("a",{href:"#/ko/guide/draft-lifetime",children:"수명과 정리"})," - 구독과 정리"]}),e("li",{children:[e("a",{href:"#/ko/api/draft",children:"Draft API"})," - 전체 타입 표면"]})]})]})),Oa=u(()=>()=>e("div",{children:[e("h1",{children:"apply, reset and discard"}),e("p",{children:["A draft ends in one of three ways: its edits move into the source (",e("code",{children:"apply"}),"), its edits are thrown away but the session stays open (",e("code",{children:"reset"}),"), or the session closes (",e("code",{children:"discard"}),")."]}),e("h2",{children:"apply"}),e("p",{children:[e("code",{children:"apply()"})," merges the edited paths into the source's"," ",e("strong",{children:"latest"})," value and answers a result object rather than throwing."]}),e(t,{language:"typescript",code:`const editor = createDraft(source.address);
editor.ref.city.value = 'Busan';

const result = editor.apply();
// { ok: true, applied: 1 }

source.address.value; // { city: 'Busan', zip: 100 }`}),e("p",{children:"It is a local merge. Nothing is sent anywhere - a draft has no idea whether a server exists."}),e("h3",{children:"After a successful apply"}),e("p",{children:["The session stays open and rebases: the applied edits are gone from"," ",e("code",{children:"changes()"})," and the draft is clean again. You can keep editing."]}),e(t,{language:"typescript",code:`editor.apply();      // { ok: true, applied: 1 }

editor.changes();    // []
editor.isDirty();    // false
editor.ref.city.value; // 'Busan' - now agreeing with the source`}),e("h3",{children:"Applying with nothing to apply"}),e("p",{children:"A clean draft applies successfully and reports zero. It is not an error - there was simply nothing to move."}),e(t,{language:"typescript",code:"createDraft(source.address).apply(); // { ok: true, applied: 0 }"}),e("h3",{children:"When apply refuses"}),e("p",{children:["A refusal carries a ",e("code",{children:"reason"})," and changes nothing. The source is left exactly as it was."]}),e(t,{language:"typescript",code:`const result = editor.apply();

if (!result.ok) {
  switch (result.reason) {
    case 'conflict':
      // the path still exists, but it no longer holds what the draft
      // branched from - see the Conflicts page
      break;
    case 'missing-source':
      // the path the draft was branched from no longer exists at all
      break;
    case 'invalid-source':
      // the source ref cannot be written through
      break;
    case 'readonly':
      // the source refuses every write - e.g. a readonly sync query
      break;
  }
}`}),e("p",{children:[e("code",{children:"conflict"})," and ",e("code",{children:"missing-source"})," are the two you will actually meet, and the line between them is whether"," ",e("strong",{children:"the path is still there"}),":"]}),e(t,{language:"typescript",code:`// the value changed under the draft -> conflict
source.address.city.value = 'Gwangju';
editor.apply(); // { ok: false, reason: 'conflict' }

// the parent was removed out from under a child draft -> missing-source
const room = createDraft(source.office.room);
room.ref.value = '999';
source.office.value = null;
room.apply(); // { ok: false, reason: 'missing-source' }`}),e("p",{children:"A type swap counts as a conflict, not a missing source: the path is alive, it just holds a different kind of thing."}),e(t,{language:"typescript",code:`source.office.room.value = ['301']; // string -> string[]
room.apply(); // { ok: false, reason: 'conflict' }`}),e("p",{children:[e("code",{children:"readonly"})," is not reachable from a plain store. It appears when the source is a ref that refuses writes, which in practice means a query opened with ",e("code",{children:"editable: false"})," in"," ",e("a",{href:"#/guide/sync-query",children:"@stateref/sync"}),". Such a source can still be branched and edited; only ",e("code",{children:"apply()"})," refuses."]}),e("h3",{children:"apply is atomic"}),e("p",{children:["Every edited path is written in one pass, and the check happens"," ",e("strong",{children:"before"})," the source is touched. A refusal never leaves half the edits applied."]}),e("h2",{children:"reset"}),e("p",{children:[e("code",{children:"reset()"})," throws the local edits away and keeps the session open. The draft returns to the source's current value."]}),e(t,{language:"typescript",code:`editor.ref.city.value = 'Busan';
editor.isDirty(); // true

editor.reset();

editor.ref.city.value; // 'Seoul' - back to the source
editor.isDirty();      // false
editor.changes();      // []

// still usable
editor.ref.city.value = 'Daejeon';`}),e("p",{children:'This is what a "Cancel" button on a form wants: the input goes away, the form stays open.'}),e("h2",{children:"discard"}),e("p",{children:[e("code",{children:"discard()"})," ends the session and releases the subscriptions the draft held. It does not undo anything that was already applied."]}),e(t,{language:"typescript",code:`editor.apply();   // the source now holds 'Busan'
editor.discard();

source.address.city.value; // 'Busan' - discard is not an undo`}),e("p",{children:"After discarding, every access refuses explicitly rather than returning a stale value:"}),e(t,{language:"typescript",code:`editor.ref.city.value = 'X'; // throws: This draft has been discarded.
editor.changes();            // throws: This draft has been discarded.`}),e("p",{children:"That refusal is deliberate. A discarded draft that kept answering would let a component keep writing into a session nobody is listening to."}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/draft-conflicts",children:"Conflicts"})," - reading a conflict and resolving it"]}),e("li",{children:[e("a",{href:"#/guide/draft-lifetime",children:"Lifetime"})," - what a draft holds and when it lets go"]}),e("li",{children:[e("a",{href:"#/guide/sync-query",children:"query and resource"})," - where"," ",e("code",{children:"readonly"})," comes from"]})]})]})),La=u(()=>()=>e("div",{children:[e("h1",{children:"apply · reset · discard"}),e("p",{children:["draft가 끝나는 방법은 셋입니다. 편집을 원본으로 옮기거나(",e("code",{children:"apply"}),"), 편집을 버리되 세션은 열어 두거나(",e("code",{children:"reset"}),"), 세션을 닫거나(",e("code",{children:"discard"}),")."]}),e("h2",{children:"apply"}),e("p",{children:[e("code",{children:"apply()"}),"는 편집한 경로들을 원본의 ",e("strong",{children:"최신"})," 값에 병합하고, 예외를 던지는 대신 결과 객체를 답합니다."]}),e(t,{language:"typescript",code:`const editor = createDraft(source.address);
editor.ref.city.value = 'Busan';

const result = editor.apply();
// { ok: true, applied: 1 }

source.address.value; // { city: 'Busan', zip: 100 }`}),e("p",{children:"로컬 병합입니다. 어디로도 보내지 않습니다 — draft는 서버가 있는지조차 모릅니다."}),e("h3",{children:"성공한 뒤"}),e("p",{children:["세션은 열린 채로 rebase합니다. 적용된 편집은 ",e("code",{children:"changes()"}),"에서 사라지고 draft는 다시 깨끗해집니다. 계속 편집할 수 있습니다."]}),e(t,{language:"typescript",code:`editor.apply();      // { ok: true, applied: 1 }

editor.changes();    // []
editor.isDirty();    // false
editor.ref.city.value; // 'Busan' — 이제 원본과 같다`}),e("h3",{children:"적용할 것이 없을 때"}),e("p",{children:"깨끗한 draft는 성공으로 답하고 0을 보고합니다. 오류가 아니라, 옮길 것이 없었을 뿐입니다."}),e(t,{language:"typescript",code:"createDraft(source.address).apply(); // { ok: true, applied: 0 }"}),e("h3",{children:"거절할 때"}),e("p",{children:["거절은 ",e("code",{children:"reason"}),"을 들고 오고 아무것도 바꾸지 않습니다. 원본은 있던 그대로 남습니다."]}),e(t,{language:"typescript",code:`const result = editor.apply();

if (!result.ok) {
  switch (result.reason) {
    case 'conflict':
      // 경로는 아직 있지만, draft가 분기한 값을 더는 들고 있지 않다
      // — 충돌 문서를 보라
      break;
    case 'missing-source':
      // draft가 분기한 경로 자체가 사라졌다
      break;
    case 'invalid-source':
      // 원본 ref로는 쓸 수 없다
      break;
    case 'readonly':
      // 원본이 모든 쓰기를 거절한다 — 예: readonly sync 조회
      break;
  }
}`}),e("p",{children:["실제로 만나게 되는 것은 ",e("code",{children:"conflict"}),"와"," ",e("code",{children:"missing-source"})," 둘이고, 그 경계는"," ",e("strong",{children:"경로가 아직 살아 있는가"}),"입니다."]}),e(t,{language:"typescript",code:`// draft 밑에서 값이 바뀌었다 -> conflict
source.address.city.value = 'Gwangju';
editor.apply(); // { ok: false, reason: 'conflict' }

// 자식 draft 밑에서 부모가 사라졌다 -> missing-source
const room = createDraft(source.office.room);
room.ref.value = '999';
source.office.value = null;
room.apply(); // { ok: false, reason: 'missing-source' }`}),e("p",{children:"타입 교체는 missing-source가 아니라 충돌입니다. 경로는 살아 있고, 다른 종류의 것을 담고 있을 뿐입니다."}),e(t,{language:"typescript",code:`source.office.room.value = ['301']; // string -> string[]
room.apply(); // { ok: false, reason: 'conflict' }`}),e("p",{children:[e("code",{children:"readonly"}),"는 평범한 스토어에서는 나오지 않습니다. 원본이 쓰기를 거절하는 ref일 때 나오고, 실제로는"," ",e("a",{href:"#/ko/guide/sync-query",children:"@stateref/sync"}),"에서"," ",e("code",{children:"editable: false"}),"로 연 조회를 뜻합니다. 그런 원본도 분기하고 편집할 수는 있고, ",e("code",{children:"apply()"}),"만 거절합니다."]}),e("h3",{children:"apply는 원자적이다"}),e("p",{children:["편집한 모든 경로가 한 패스에 쓰이고, 검사는 원본에 닿기"," ",e("strong",{children:"전에"})," 끝납니다. 거절이 절반만 적용된 상태를 남기는 일은 없습니다."]}),e("h2",{children:"reset"}),e("p",{children:[e("code",{children:"reset()"}),"은 로컬 편집을 버리고 세션은 열어 둡니다. draft는 원본의 현재 값으로 돌아갑니다."]}),e(t,{language:"typescript",code:`editor.ref.city.value = 'Busan';
editor.isDirty(); // true

editor.reset();

editor.ref.city.value; // 'Seoul' — 원본으로 되돌아왔다
editor.isDirty();      // false
editor.changes();      // []

// 계속 쓸 수 있다
editor.ref.city.value = 'Daejeon';`}),e("p",{children:'폼의 "취소" 버튼이 원하는 동작이 이것입니다. 입력은 사라지고, 폼은 열려 있습니다.'}),e("h2",{children:"discard"}),e("p",{children:[e("code",{children:"discard()"}),"는 세션을 끝내고 draft가 들고 있던 구독을 놓습니다. 이미 적용된 것을 되돌리지는 않습니다."]}),e(t,{language:"typescript",code:`editor.apply();   // 원본이 이제 'Busan'을 든다
editor.discard();

source.address.city.value; // 'Busan' — discard는 undo가 아니다`}),e("p",{children:"폐기한 뒤에는 모든 접근이 낡은 값을 돌려주는 대신 명시적으로 거절합니다."}),e(t,{language:"typescript",code:`editor.ref.city.value = 'X'; // throws: This draft has been discarded.
editor.changes();            // throws: This draft has been discarded.`}),e("p",{children:"이 거절은 의도된 것입니다. 폐기한 draft가 계속 답한다면, 아무도 듣지 않는 세션에 컴포넌트가 계속 쓰게 됩니다."}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/draft-conflicts",children:"충돌과 해소"})," - 충돌을 읽고 해소하기"]}),e("li",{children:[e("a",{href:"#/ko/guide/draft-lifetime",children:"수명과 정리"})," - draft가 무엇을 들고 언제 놓는가"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-query",children:"query와 resource"})," -"," ",e("code",{children:"readonly"}),"가 나오는 곳"]})]})]})),Fa=u(()=>()=>e("div",{children:[e("h1",{children:"Conflicts"}),e("p",{children:["A draft holds edits while the source keeps living. When the source moves under a path the draft has edited, that change becomes a"," ",e("strong",{children:"conflict"}),": two answers now exist for one field and the draft will not pick between them for you."]}),e("h2",{children:"A Conflict Appears Before You Apply"}),e("p",{children:["You do not have to call ",e("code",{children:"apply()"})," to find out. The change row flips the moment the source moves."]}),e(t,{language:"typescript",code:`const editor = createDraft(source.address);
editor.ref.city.value = 'Busan';

// somebody else moves the source
source.address.city.value = 'Gwangju';

const [change] = editor.changes();
change.before;   // { exists: true, value: 'Seoul' }   - the branch point
change.after;    // { exists: true, value: 'Busan' }   - what the draft holds
change.source;   // { exists: true, value: 'Gwangju' } - what the source holds now
change.conflict; // true

editor.status.conflicts.value; // 1
editor.apply();                // { ok: false, reason: 'conflict' }`}),e("p",{children:"The three values are the whole story: where the draft started, where it went, and where the source went. A screen can render exactly that and let a person choose."}),e("h2",{children:"Resolving"}),e("p",{children:[e("code",{children:"resolve(change, choice)"})," settles one change. The choice is which side wins."]}),e(t,{language:"typescript",code:`// take the source's value and drop this edit
editor.resolve(editor.changes()[0], 'source');
// { ok: true }
editor.ref.city.value; // 'Gwangju'
editor.isDirty();      // false - the edit is gone
editor.changes();      // []

// or keep the draft's value and re-base the edit onto the new source
editor.resolve(editor.changes()[0], 'draft');
// { ok: true }  - the change stays, no longer in conflict`}),e("p",{children:[e("code",{children:"'source'"})," removes the edit. ",e("code",{children:"'draft'"})," keeps it and moves its ",e("code",{children:"before"})," to the source's current value, so the row stops being a conflict and a later ",e("code",{children:"apply()"})," can go through."]}),e("h2",{children:"Resolve Refuses a Stale Row"}),e("p",{children:["A ",e("code",{children:"DraftChange"})," is a snapshot taken at a particular draft version. If the draft moved since you read it, resolving with that old row is refused - it would settle a question that has already changed."]}),e(t,{language:"typescript",code:`const row = editor.changes()[0];

editor.ref.zip.value = 999;   // the draft version moves

editor.resolve(row, 'draft'); // { ok: false, reason: 'stale' }

// read it again and it works
editor.resolve(editor.changes()[0], 'draft'); // { ok: true }`}),e("p",{children:["A row from a ",e("em",{children:"different"})," draft is refused the same way. Each change carries an opaque ",e("code",{children:"owner"}),", and one draft never accepts another's."]}),e(t,{language:"typescript",code:`const a = createDraft(source.address);
const b = createDraft(source.address);

a.resolve(b.changes()[0], 'draft'); // { ok: false, reason: 'stale' }`}),e("h3",{children:"The other two refusals"}),e("ul",{children:[e("li",{children:[e("code",{children:"missing-source"})," - the path the draft branched from is gone entirely, so there is no source side to choose."]}),e("li",{children:[e("code",{children:"boundary"})," - keeping the draft's value would require writing somewhere the source's shape does not allow."]})]}),e("h2",{children:"A Resolution Loop"}),e("p",{children:"Because a resolve invalidates the rows you were holding, read the list again on each pass rather than iterating a snapshot."}),e(t,{language:"typescript",code:`function resolveAll(draft, choice: 'source' | 'draft') {
  for (;;) {
    const next = draft.changes().find(change => change.conflict);
    if (!next) return;

    const result = draft.resolve(next, choice);
    if (!result.ok) return result; // missing-source or boundary
  }
}`}),e("h2",{children:"Conflicts Are Not Errors"}),e("p",{children:["A conflict is a fact about two edits, not a failure. The draft keeps working: you can go on editing other fields, and only the conflicting rows block ",e("code",{children:"apply()"}),". The library refuses to guess, which is why the choice is an API call and not a merge strategy option."]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/draft-apply",children:"apply, reset and discard"})," - what a conflict does to ",e("code",{children:"apply()"})]}),e("li",{children:[e("a",{href:"#/guide/draft",children:"createDraft"})," - reading"," ",e("code",{children:"changes()"})]}),e("li",{children:[e("a",{href:"#/guide/sync-query",children:"query and resource"})," - the same change model over a server baseline"]})]})]})),Ua=u(()=>()=>e("div",{children:[e("h1",{children:"충돌과 해소"}),e("p",{children:["draft가 편집을 들고 있는 동안에도 원본은 계속 살아 있습니다. draft가 편집한 경로 밑에서 원본이 움직이면 그 변경은 ",e("strong",{children:"충돌"}),"이 됩니다. 한 필드에 답이 둘 생긴 것이고, draft는 대신 골라 주지 않습니다."]}),e("h2",{children:"충돌은 apply 전에 보인다"}),e("p",{children:["알아내기 위해 ",e("code",{children:"apply()"}),"를 부를 필요가 없습니다. 원본이 움직이는 순간 변경 줄이 바뀝니다."]}),e(t,{language:"typescript",code:`const editor = createDraft(source.address);
editor.ref.city.value = 'Busan';

// 다른 곳에서 원본을 움직인다
source.address.city.value = 'Gwangju';

const [change] = editor.changes();
change.before;   // { exists: true, value: 'Seoul' }   — 분기 지점
change.after;    // { exists: true, value: 'Busan' }   — draft가 든 값
change.source;   // { exists: true, value: 'Gwangju' } — 지금 원본이 든 값
change.conflict; // true

editor.status.conflicts.value; // 1
editor.apply();                // { ok: false, reason: 'conflict' }`}),e("p",{children:"이 세 값이 이야기의 전부입니다. draft가 어디서 시작했고, 어디로 갔고, 원본이 어디로 갔는가. 화면은 그대로 그려 주고 사람이 고르게 하면 됩니다."}),e("h2",{children:"해소하기"}),e("p",{children:[e("code",{children:"resolve(change, choice)"}),"가 변경 하나를 정리합니다. choice는 어느 쪽을 택할지입니다."]}),e(t,{language:"typescript",code:`// 원본 값을 받아들이고 이 편집을 버린다
editor.resolve(editor.changes()[0], 'source');
// { ok: true }
editor.ref.city.value; // 'Gwangju'
editor.isDirty();      // false — 편집이 사라졌다
editor.changes();      // []

// 또는 draft 값을 지키고, 편집을 새 원본 위로 다시 얹는다
editor.resolve(editor.changes()[0], 'draft');
// { ok: true }  — 변경은 남고, 더는 충돌이 아니다`}),e("p",{children:[e("code",{children:"'source'"}),"는 편집을 제거합니다. ",e("code",{children:"'draft'"}),"는 편집을 지키면서 그 ",e("code",{children:"before"}),"를 원본의 현재 값으로 옮기므로, 그 줄은 충돌이 아니게 되고 이후의 ",e("code",{children:"apply()"}),"가 통과할 수 있습니다."]}),e("h2",{children:"낡은 줄은 거절한다"}),e("p",{children:[e("code",{children:"DraftChange"}),"는 특정 draft 버전에서 찍은 스냅숏입니다. 읽은 뒤 draft가 움직였다면 그 낡은 줄로 해소하는 것은 거절됩니다 — 이미 바뀐 질문에 답하는 셈이기 때문입니다."]}),e(t,{language:"typescript",code:`const row = editor.changes()[0];

editor.ref.zip.value = 999;   // draft 버전이 올라간다

editor.resolve(row, 'draft'); // { ok: false, reason: 'stale' }

// 다시 읽으면 된다
editor.resolve(editor.changes()[0], 'draft'); // { ok: true }`}),e("p",{children:[e("em",{children:"다른"})," draft의 줄도 같은 방식으로 거절됩니다. 각 변경은 불투명한"," ",e("code",{children:"owner"}),"를 들고 있고, 한 draft는 다른 draft의 것을 절대 받지 않습니다."]}),e(t,{language:"typescript",code:`const a = createDraft(source.address);
const b = createDraft(source.address);

a.resolve(b.changes()[0], 'draft'); // { ok: false, reason: 'stale' }`}),e("h3",{children:"나머지 두 거절"}),e("ul",{children:[e("li",{children:[e("code",{children:"missing-source"})," - draft가 분기한 경로가 통째로 사라져서, 고를 원본 쪽이 없다."]}),e("li",{children:[e("code",{children:"boundary"})," - draft 값을 지키려면 원본의 구조가 허용하지 않는 곳에 써야 한다."]})]}),e("h2",{children:"해소 루프"}),e("p",{children:"해소는 들고 있던 줄을 무효로 만들므로, 스냅숏을 순회하지 말고 매번 목록을 다시 읽으세요."}),e(t,{language:"typescript",code:`function resolveAll(draft, choice: 'source' | 'draft') {
  for (;;) {
    const next = draft.changes().find(change => change.conflict);
    if (!next) return;

    const result = draft.resolve(next, choice);
    if (!result.ok) return result; // missing-source 또는 boundary
  }
}`}),e("h2",{children:"충돌은 오류가 아니다"}),e("p",{children:["충돌은 두 편집에 대한 사실이지 실패가 아닙니다. draft는 계속 동작합니다. 다른 필드는 그대로 편집할 수 있고, ",e("code",{children:"apply()"}),"를 막는 것은 충돌 난 줄뿐입니다. 라이브러리가 추측하기를 거부하기 때문에 선택이 병합 전략 옵션이 아니라 API 호출인 것입니다."]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/draft-apply",children:"apply · reset · discard"})," - 충돌이"," ",e("code",{children:"apply()"}),"에 하는 일"]}),e("li",{children:[e("a",{href:"#/ko/guide/draft",children:"createDraft"})," - ",e("code",{children:"changes()"})," ","읽기"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-query",children:"query와 resource"})," - 서버 기준 위의 같은 변경 모델"]})]})]})),qa=u(()=>()=>e("div",{children:[e("h1",{children:"Draft Lifetime"}),e("p",{children:"A draft is a session, not a value. It subscribes to the source so it can tell you when a change turns into a conflict, and those subscriptions live until you close it."}),e("h2",{children:"Close What You Open"}),e("p",{children:[e("code",{children:"discard()"})," is the only thing that ends a draft. A draft that is merely unreachable is still subscribed."]}),e(t,{language:"typescript",code:`const editor = createDraft(source.address);

// ... the screen uses it ...

editor.discard(); // releases the subscriptions it held`}),e("p",{children:"Pair it with whatever owns the screen. In a component, that is the unmount path:"}),e(t,{language:"typescript",code:`// React
useEffect(() => {
  const editor = createDraft(source.address);
  setEditor(editor);
  return () => editor.discard();
}, []);`}),e("h2",{children:"Branch and Close Repeatedly"}),e("p",{children:"Opening and closing a draft leaves nothing behind. A source edit wakes only the drafts that are still open."}),e(t,{language:"typescript",code:`for (let i = 0; i < 20; i += 1) {
  const editor = createDraft(source.address);
  editor.ref.city.value = 'Busan';
  editor.discard();
}

// a later source write wakes none of those twenty
source.address.city.value = 'Daejeon';`}),e("p",{children:"If you keep two open instead, exactly two wake up. That difference - zero versus two - is how a leak would show itself."}),e("h2",{children:"A Draft Is Not the Source's Child"}),e("p",{children:"Discarding a draft does not touch the source, and the source does not own the draft. Nothing is reference-counted between them."}),e(t,{language:"typescript",code:`editor.apply();   // the source keeps this
editor.discard(); // and keeps it after the draft is gone`}),e("p",{children:"The reverse also holds: a draft outlives the screen that made it, if you let it. A wizard can branch on step one and apply on step three, as long as something holds the handle."}),e("h2",{children:"After discard"}),e("p",{children:'Every access refuses explicitly. There is no "last known value" to read.'}),e(t,{language:"typescript",code:`editor.discard();

editor.ref.city.value;  // throws: This draft has been discarded.
editor.changes();       // throws: This draft has been discarded.
editor.isDirty();       // throws: This draft has been discarded.
editor.apply();         // throws: This draft has been discarded.`}),e("p",{children:"If your UI can render after the session ends, keep your own flag and stop reading the draft - do not catch the error per row."}),e(t,{language:"typescript",code:`let open = true;

function close() {
  editor.discard();
  open = false;
}

// render
open ? <DraftRows draft={editor} /> : <p>Closed</p>;`}),e("h2",{children:"Subscriptions the Draft Hands Out"}),e("p",{children:[e("code",{children:"draft.watch"})," and ",e("code",{children:"draft.watchStatus"})," follow the same rules as a store's ",e("code",{children:"watch"}),": a callback collects dependencies on its first run, and it keeps running until its own subscription ends. Discarding the draft ends all of them at once."]}),e(t,{language:"typescript",code:`const controller = new AbortController();

editor.watchStatus(status => {
  // read what you are handed, or nothing is registered
  void status.dirty.value;
  void status.conflicts.value;
  return controller.signal;
});

controller.abort(); // ends this one subscription
editor.discard();   // ends everything the draft holds`}),e("p",{children:"Note the reads inside the callback. A callback that reads nothing registers no dependency and is never woken again - it will report a cheerful, permanent zero."}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/draft-apply",children:"apply, reset and discard"})," - ending a session"]}),e("li",{children:[e("a",{href:"#/guide/subscription",children:"Subscription"})," - how dependencies and cleanup work in the core"]}),e("li",{children:[e("a",{href:"#/guide/sync-observation",children:"Observation"})," - counting what a sync client still holds"]})]})]})),_a=u(()=>()=>e("div",{children:[e("h1",{children:"수명과 정리"}),e("p",{children:"draft는 값이 아니라 세션입니다. 변경이 언제 충돌이 되는지 알려 주기 위해 원본을 구독하고, 그 구독은 세션을 닫을 때까지 살아 있습니다."}),e("h2",{children:"연 것은 닫는다"}),e("p",{children:["draft를 끝내는 것은 ",e("code",{children:"discard()"}),"뿐입니다. 단지 도달할 수 없게 된 draft는 여전히 구독 중입니다."]}),e(t,{language:"typescript",code:`const editor = createDraft(source.address);

// ... 화면이 사용한다 ...

editor.discard(); // 들고 있던 구독을 놓는다`}),e("p",{children:"화면을 소유한 쪽과 짝지으세요. 컴포넌트라면 언마운트 경로입니다."}),e(t,{language:"typescript",code:`// React
useEffect(() => {
  const editor = createDraft(source.address);
  setEditor(editor);
  return () => editor.discard();
}, []);`}),e("h2",{children:"반복해서 열고 닫기"}),e("p",{children:"draft를 열고 닫는 것은 아무것도 남기지 않습니다. 원본을 고치면 아직 열려 있는 draft만 깨어납니다."}),e(t,{language:"typescript",code:`for (let i = 0; i < 20; i += 1) {
  const editor = createDraft(source.address);
  editor.ref.city.value = 'Busan';
  editor.discard();
}

// 이후의 원본 쓰기는 저 스무 개 중 아무것도 깨우지 않는다
source.address.city.value = 'Daejeon';`}),e("p",{children:"대신 두 개를 열어 두면 정확히 둘이 깨어납니다. 0과 2의 이 차이가 누수를 드러내는 방식입니다."}),e("h2",{children:"draft는 원본의 자식이 아니다"}),e("p",{children:"draft를 폐기해도 원본에 닿지 않고, 원본이 draft를 소유하지도 않습니다. 둘 사이에 참조 카운트 같은 것은 없습니다."}),e(t,{language:"typescript",code:`editor.apply();   // 원본이 이것을 가진다
editor.discard(); // draft가 사라진 뒤에도 그대로 가진다`}),e("p",{children:"반대도 성립합니다. 놓아 두면 draft는 자기를 만든 화면보다 오래 삽니다. 핸들을 누군가 들고 있는 한, 마법사 UI가 1단계에서 분기해 3단계에서 적용할 수 있습니다."}),e("h2",{children:"폐기한 뒤"}),e("p",{children:'모든 접근이 명시적으로 거절합니다. 읽을 "마지막으로 알려진 값" 같은 것은 없습니다.'}),e(t,{language:"typescript",code:`editor.discard();

editor.ref.city.value;  // throws: This draft has been discarded.
editor.changes();       // throws: This draft has been discarded.
editor.isDirty();       // throws: This draft has been discarded.
editor.apply();         // throws: This draft has been discarded.`}),e("p",{children:"세션이 끝난 뒤에도 UI가 렌더될 수 있다면, 자체 플래그를 두고 draft 읽기를 멈추세요. 행마다 예외를 잡지 마세요."}),e(t,{language:"typescript",code:`let open = true;

function close() {
  editor.discard();
  open = false;
}

// 렌더
open ? <DraftRows draft={editor} /> : <p>Closed</p>;`}),e("h2",{children:"draft가 내주는 구독"}),e("p",{children:[e("code",{children:"draft.watch"}),"와 ",e("code",{children:"draft.watchStatus"}),"는 스토어의"," ",e("code",{children:"watch"}),"와 같은 규칙을 따릅니다. 콜백은 첫 실행에서 의존성을 수집하고, 자기 구독이 끝날 때까지 계속 실행됩니다. draft를 폐기하면 전부 한 번에 끝납니다."]}),e(t,{language:"typescript",code:`const controller = new AbortController();

editor.watchStatus(status => {
  // 건네받은 것을 읽어야 한다. 읽지 않으면 아무것도 등록되지 않는다
  void status.dirty.value;
  void status.conflicts.value;
  return controller.signal;
});

controller.abort(); // 이 구독 하나만 끝낸다
editor.discard();   // draft가 든 것을 전부 끝낸다`}),e("p",{children:"콜백 안의 읽기에 주목하세요. 아무것도 읽지 않는 콜백은 의존성을 등록하지 않아 다시는 깨어나지 않습니다 — 그리고 영원히 0을 답합니다."}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/draft-apply",children:"apply · reset · discard"})," - 세션 끝내기"]}),e("li",{children:[e("a",{href:"#/ko/guide/subscription",children:"구독"})," - 코어의 의존성과 정리"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-observation",children:"관측"})," - sync client가 아직 무엇을 들고 있는지 세기"]})]})]})),Va=u(()=>()=>e("div",{children:[e("h1",{children:"createSyncClient"}),e("p",{children:[e("code",{children:"@stateref/sync"})," is a separate package that adds a shared query cache, an ",e("strong",{children:"editable"})," resource ref over the server baseline, and mutations. Importing ",e("code",{children:"state-ref"})," alone does not load it."]}),e("p",{children:["What makes it different from a plain query cache: the cached value is not read-only. You edit it through an ordinary ",e("code",{children:"state-ref"})," ","ref, and the client keeps the server baseline and your local edit as two separate things it can still tell apart."]}),e("h2",{children:"Install"}),e(t,{language:"bash",code:"npm install state-ref @stateref/sync"}),e("h2",{children:"A First Query"}),e(t,{language:"typescript",code:`import { createSyncClient } from '@stateref/sync';

type Account = { address: { city: string } };

const client = createSyncClient(); // one per app, or one per SSR request

const account = client.query({
  queryKey: ['account', 1],
  queryFn: async ({ signal }): Promise<Account> => {
    const response = await fetch('/account/1', { signal });
    return response.json();
  },
});

await account.load();

account.ref.address.city.value = 'Busan'; // a local edit, not a network write
account.isDirty();  // true
account.changes();  // server baseline -> current local edit`}),e("p",{children:[e("code",{children:"account.ref"})," is a ",e("code",{children:"state-ref"})," ref, so every connector binds to it the same way a store does."]}),e("h2",{children:"The Client"}),e("p",{children:"The client owns its cache. Two handles with the same key in the same client share one baseline, one in-flight READ, and one local edit."}),e(t,{language:"typescript",code:`const a = client.query(options);
const b = client.query(options); // same key

a.ref.address.city.value = 'Busan';
b.ref.address.city.value;        // 'Busan' - the same resource

// a different client is a different cache
const other = createSyncClient();
other.query(options).ref.address.city.value; // unaffected`}),e("p",{children:"Create a separate client for each SSR request. A shared client would leak one request's data into another's."}),e("h2",{children:"Defaults"}),e("ul",{children:[e("li",{children:[e("code",{children:"staleTime: 0"})," - a baseline is stale as soon as it lands"]}),e("li",{children:["inactive ",e("code",{children:"gcTime"}),": 5 minutes, infinite for"," ",e("code",{children:["createSyncClient(","{ ssr: true }",")"]})]}),e("li",{children:"three query retries in a client, zero in SSR"}),e("li",{children:[e("code",{children:"queryKey"})," must be an acyclic, JSON-compatible array; object key order is ignored when it is hashed"]})]}),e("h2",{children:"Nothing Starts by Itself"}),e("p",{children:["A fixed-key query needs an explicit ",e("code",{children:"load()"}),". The exceptions are a mutation response, ",e("code",{children:"acceptServer"}),", and an active"," ",e("a",{href:"#/guide/sync-view",children:"reactive key"}),", which loads on its own."]}),e("p",{children:["And in the other direction:"," ",e("strong",{children:"a local edit never writes to a server."})," Saving is always an explicit mutation."]}),e("h2",{children:"Scope and Limits"}),e("p",{children:["This package covers a defined comparison scope, and the project tracks it row by row rather than claiming parity. Four of the nine rows are recorded as ",e("strong",{children:"partial"}),":"]}),e("ul",{children:[e("li",{children:[e("strong",{children:"pagination / infinite"})," - no reactive key switching for infinite queries; ",e("code",{children:"infiniteQuery"})," takes a fixed key only"]}),e("li",{children:[e("strong",{children:"SSR"})," - cache transfer is supported; framework-specific loading and error boundaries are not part of the package"]}),e("li",{children:[e("strong",{children:"devtools / observation"})," - a read-only metadata boundary, not a devtools or plugin compatibility API"]}),e("li",{children:[e("strong",{children:"reactive options across connectors"})," - supported through a reactive key, with per-connector differences"]})]}),e("p",{children:"No equivalence with any other library is declared. When a behaviour matters to you, check it against the package's own tests rather than against an option name that looks familiar."}),e("h2",{children:"Where to Go Next"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/sync-query",children:"query and resource"})," - loading, editing, and reading changes"]}),e("li",{children:[e("a",{href:"#/guide/sync-mutation",children:"mutation and link"})," - sending an edit and accepting the result"]}),e("li",{children:[e("a",{href:"#/guide/sync-lifecycle",children:"Edit Lifecycle"})," - what"," ",e("code",{children:"capture()"})," freezes and what each result does to your edits"]}),e("li",{children:[e("a",{href:"#/guide/sync-view",children:"display and reactive keys"})," - placeholders, selection, and reactive keys"]}),e("li",{children:[e("a",{href:"#/guide/sync-infinite",children:"Infinite Queries"})," - lists that grow page by page"]}),e("li",{children:[e("a",{href:"#/guide/sync-stream",children:"Streaming"})," - WebSocket and NDJSON pushes shown as they arrive"]}),e("li",{children:[e("a",{href:"#/guide/sync-refetch",children:"Automatic refetch"})," - focus, reconnect, polling, and network mode"]}),e("li",{children:[e("a",{href:"#/guide/sync-persistence",children:"Persistence and SSR"})," - snapshots and offline queues"]}),e("li",{children:[e("a",{href:"#/guide/sync-observation",children:"Observation"})," - what the client is holding"]}),e("li",{children:[e("a",{href:"#/guide/sync-form",children:"Form Save Recipe"})," - a draft form saved through a mutation, end to end"]}),e("li",{children:[e("a",{href:"#/api/sync",children:"Sync API"})," - the full surface"]})]})]})),ja=u(()=>()=>e("div",{children:[e("h1",{children:"createSyncClient"}),e("p",{children:[e("code",{children:"@stateref/sync"}),"는 공유 조회 캐시, 서버 기준 위의"," ",e("strong",{children:"편집 가능한"})," resource ref, 그리고 mutation을 더하는 별도 패키지입니다. ",e("code",{children:"state-ref"}),"만 import하면 로드되지 않습니다."]}),e("p",{children:["평범한 조회 캐시와 갈리는 지점은 이것입니다. 캐시된 값이 읽기 전용이 아닙니다. 평범한 ",e("code",{children:"state-ref"})," ref로 편집하고, client는 서버 기준과 로컬 편집을 ",e("strong",{children:"구별할 수 있는 두 가지"}),"로 계속 들고 있습니다."]}),e("h2",{children:"설치"}),e(t,{language:"bash",code:"npm install state-ref @stateref/sync"}),e("h2",{children:"첫 조회"}),e(t,{language:"typescript",code:`import { createSyncClient } from '@stateref/sync';

type Account = { address: { city: string } };

const client = createSyncClient(); // 앱당 하나, 또는 SSR 요청당 하나

const account = client.query({
  queryKey: ['account', 1],
  queryFn: async ({ signal }): Promise<Account> => {
    const response = await fetch('/account/1', { signal });
    return response.json();
  },
});

await account.load();

account.ref.address.city.value = 'Busan'; // 로컬 편집이다. 네트워크 쓰기가 아니다
account.isDirty();  // true
account.changes();  // 서버 기준 -> 현재 로컬 편집`}),e("p",{children:[e("code",{children:"account.ref"}),"는 ",e("code",{children:"state-ref"})," ref이므로, 모든 커넥터가 스토어와 똑같은 방식으로 연결합니다."]}),e("h2",{children:"client"}),e("p",{children:"client는 자기 캐시를 소유합니다. 같은 client에서 같은 key를 쓰는 두 핸들은 하나의 기준, 하나의 진행 중 READ, 하나의 로컬 편집을 공유합니다."}),e(t,{language:"typescript",code:`const a = client.query(options);
const b = client.query(options); // 같은 key

a.ref.address.city.value = 'Busan';
b.ref.address.city.value;        // 'Busan' — 같은 resource다

// 다른 client는 다른 캐시다
const other = createSyncClient();
other.query(options).ref.address.city.value; // 영향 없음`}),e("p",{children:"SSR 요청마다 별도 client를 만드세요. client를 공유하면 한 요청의 데이터가 다른 요청으로 샙니다."}),e("h2",{children:"기본값"}),e("ul",{children:[e("li",{children:[e("code",{children:"staleTime: 0"})," — 기준은 도착하자마자 stale이다"]}),e("li",{children:["비활성 ",e("code",{children:"gcTime"}),": 5분,"," ",e("code",{children:["createSyncClient(","{ ssr: true }",")"]}),"에서는 무한"]}),e("li",{children:"client에서 조회 재시도 3회, SSR에서는 0회"}),e("li",{children:[e("code",{children:"queryKey"}),"는 순환 없는 JSON 호환 배열이어야 하며, 해시할 때 객체 키 순서는 무시한다"]})]}),e("h2",{children:"스스로 시작하는 것은 없다"}),e("p",{children:["고정 key 조회는 명시적인 ",e("code",{children:"load()"}),"가 필요합니다. 예외는 mutation 응답, ",e("code",{children:"acceptServer"}),", 그리고 스스로 로드하는 활성"," ",e("a",{href:"#/ko/guide/sync-view",children:"반응형 key"}),"입니다."]}),e("p",{children:["반대 방향도 마찬가지입니다."," ",e("strong",{children:"로컬 편집은 절대 서버에 쓰지 않습니다."})," 저장은 언제나 명시적인 mutation입니다."]}),e("h2",{children:"범위와 한계"}),e("p",{children:["이 패키지는 정해진 비교 범위를 다루고, 프로젝트는 그것을 동등성 선언이 아니라 ",e("strong",{children:"행 단위로"})," 추적합니다. 아홉 행 중 넷이"," ",e("strong",{children:"부분 지원"}),"으로 기록돼 있습니다."]}),e("ul",{children:[e("li",{children:[e("strong",{children:"pagination / infinite"})," — 무한 조회의 반응형 key 전환이 없다. ",e("code",{children:"infiniteQuery"}),"는 고정 key만 받는다"]}),e("li",{children:[e("strong",{children:"SSR"})," — 캐시 전송은 지원한다. 프레임워크별 로딩·오류 경계는 패키지의 범위가 아니다"]}),e("li",{children:[e("strong",{children:"devtools / 관측"})," — 읽기 전용 메타데이터 경계이며, devtools나 플러그인 호환 API가 아니다"]}),e("li",{children:[e("strong",{children:"커넥터 전반의 반응형 옵션"})," — 반응형 key로 지원하며 커넥터별 차이가 있다"]})]}),e("p",{children:"어떤 라이브러리와의 동등성도 선언하지 않습니다. 특정 동작이 중요하다면, 익숙해 보이는 옵션 이름이 아니라 패키지 자체의 테스트에 대조해 확인하세요."}),e("h2",{children:"다음으로"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/sync-query",children:"query와 resource"})," - 로드·편집·변경 읽기"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-mutation",children:"mutation과 link"})," - 편집을 보내고 결과를 수용하기"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-lifecycle",children:"편집의 생애"})," -"," ",e("code",{children:"capture()"}),"가 얼리는 것과 결과마다 편집에 일어나는 일"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-view",children:"표시와 반응형 key"})," - placeholder·선택·반응형 key"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-infinite",children:"무한 조회"})," - 페이지가 쌓이는 목록"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-stream",children:"스트리밍"})," - 도착할 때마다 보이는 WebSocket·NDJSON push"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-refetch",children:"자동 재조회"})," - focus·reconnect·polling·network mode"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-persistence",children:"영속화와 SSR"})," - 스냅숏과 오프라인 큐"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-observation",children:"관측"})," - client가 무엇을 들고 있는가"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-form",children:"폼 저장 레시피"})," - draft 폼을 mutation으로 저장하기, 처음부터 끝까지"]}),e("li",{children:[e("a",{href:"#/ko/api/sync",children:"Sync API"})," - 전체 표면"]})]})]})),Ba=u(()=>()=>e("div",{children:[e("h1",{children:"query and resource"}),e("p",{children:["A query handle holds two things at once: the"," ",e("strong",{children:"server baseline"})," the last READ confirmed, and the"," ",e("strong",{children:"local edit"})," you have made on top of it. Keeping them apart is what lets the client tell an unsaved field from a stale one."]}),e("h2",{children:"Reading"}),e(t,{language:"typescript",code:`const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
});

await account.load();      // uses a fresh cached result if there is one
await account.refetch();   // forces a READ
account.invalidate();      // marks the key stale, excludes an older in-flight response
account.dispose();         // releases this handle's subscriptions`}),e("p",{children:[e("code",{children:"account.status"})," is readable before the first load."," ",e("code",{children:"account.ref"})," and ",e("code",{children:"account.watch"})," ",e("strong",{children:"throw"})," until a load has succeeded - there is no baseline to hand out, and returning a fake one is exactly what a loading screen must not do."]}),e(t,{language:"typescript",code:`const status = account.status.value;

status.status;      // 'pending' | 'success' | 'error'
status.fetchStatus; // 'idle' | 'fetching' | 'paused'
status.loaded;      // whether a baseline exists
status.error;
status.updatedAt;
status.invalidated;

// the editing axis, kept separate from the loading axis
status.dirty;
status.conflicts;
status.version;
status.pending;      // linked WRITEs in flight
status.unconfirmed;  // a WRITE outcome that was never confirmed`}),e("h2",{children:"Binding to a Component"}),e("p",{children:[e("code",{children:"account.watch"})," and ",e("code",{children:"account.watchStatus"})," use the"," ",e("code",{children:"state-ref"})," ",e("code",{children:"Watch"})," shape, so the connectors take them directly."]}),e(t,{language:"typescript",code:`const useAccount = connectReact(account.watch);
const useAccountStatus = connectReact(account.watchStatus);

function CityField() {
  const state = useAccount();
  return (
    <input
      value={state.address.city.value}
      onChange={event => (state.address.city.value = event.target.value)}
    />
  );
}`}),e("p",{children:["Mount the value half only once ",e("code",{children:"loaded"})," is true, the same way the ref itself refuses before then."]}),e("h2",{children:"Editing Is Local"}),e("p",{children:"A ref write changes the resource in this client and nothing else. No request is made."}),e(t,{language:"typescript",code:`account.ref.address.city.value = 'Busan';

account.isDirty();  // true
account.changes();  // one row: address.city, Seoul -> Busan
account.version();  // a local revision counter`}),e("p",{children:"Another handle on the same key in the same client sees that edit immediately - it is one resource, not a copy per handle."}),e("h2",{children:"Changes"}),e("p",{children:[e("code",{children:"changes()"})," is the same change model the"," ",e("a",{href:"#/guide/draft",children:"local draft"})," uses, with the server baseline playing the role of the source."]}),e(t,{language:"typescript",code:`const [change] = account.changes();

change.path;      // ['address', 'city']
change.before;    // the server baseline
change.after;     // the local value
change.conflict;  // true when a READ brought a different value for this path
change.id;`}),e("p",{children:["Arrays are tracked as ",e("strong",{children:"one atomic field"}),". Editing one element records a change for the whole array, because an index is a position rather than an identity."]}),e("h2",{children:"A READ Rebases, It Does Not Overwrite"}),e("p",{children:"When a later READ lands, your local edits stay. A path the server moved underneath becomes a conflict instead of being silently replaced."}),e(t,{language:"typescript",code:`account.ref.address.city.value = 'Busan'; // local

await account.refetch();  // the server now says 'Gwangju' for that path

account.status.value.conflicts;      // 1
account.changes()[0].conflict;       // true
account.ref.address.city.value;      // still 'Busan' - your edit was kept`}),e("p",{children:["A query handle has no ",e("code",{children:"resolve()"}),". Taking the server value, keeping yours by saving it, or letting a person choose is covered in"," ",e("a",{href:"#/guide/sync-lifecycle",children:"Edit Lifecycle"}),"."]}),e("h2",{children:"Accepting a Known Server Value"}),e("p",{children:[e("code",{children:"acceptServer(value)"})," moves the baseline without sending anything. It is a cache-only acceptance and it excludes an older READ that is still in flight."]}),e(t,{language:"typescript",code:"account.acceptServer(knownAccount);"}),e("p",{children:"It refuses while a linked WRITE is pending on that query - the baseline is being decided by an operation that has not answered yet."}),e("h2",{children:"Readonly Queries"}),e("p",{children:["Pass ",e("code",{children:"editable: false"})," for data you never edit, or data that is not a plain tree (a ",e("code",{children:"Date"}),", for example). Ref setters are then rejected."]}),e(t,{language:"typescript",code:`const settings = client.query({
  queryKey: ['settings'],
  queryFn: ({ signal }) => api.readSettings({ signal }),
  editable: false,
});

settings.ref.theme.value = 'dark'; // throws: This query is readonly.`}),e("p",{children:["A readonly query still has ",e("code",{children:"changes()"})," and"," ",e("code",{children:"version"}),"; they are permanently empty and zero. What it refuses is ",e("code",{children:"capture()"}),". An empty review surface and an absent one are different facts, and the empty list is how you tell them apart."]}),e("p",{children:["What ",e("code",{children:"capture()"})," freezes on an editable query, and what happens to your edits after a save, is in"," ",e("a",{href:"#/guide/sync-lifecycle",children:"Edit Lifecycle"})," - along with how to settle a conflict on a query."]}),e("h2",{children:"What the Resource Accepts"}),e("p",{children:["Editable data defaults to a plain, acyclic tree with dense arrays. Rejected: reserved proxy keys, and direct mutation of an object returned by ",e("code",{children:".value"}),". Results returned by"," ",e("code",{children:"load/fetch/ensure"})," are frozen copies - edit through the ref."]}),e("h2",{children:"Preparing the Cache"}),e(t,{language:"typescript",code:`await client.prefetch(options); // cache on success, swallow a load rejection
const fresh = await client.fetch(options);   // fresh cache or a READ; throws
const cached = await client.ensure(options); // confirmed cache, even if stale

const seeded = client.query({ ...options, initialData: knownAccount });`}),e("p",{children:["These share the client's cache and in-flight READ by key, and their temporary options do not replace an existing handle's options. Use"," ",e("code",{children:"initialData"})," only for a complete, confirmed server value: it becomes the editable baseline."]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/sync-mutation",children:"mutation and link"})," - sending those changes"]}),e("li",{children:[e("a",{href:"#/guide/draft-conflicts",children:"Conflicts"})," - the same conflict model, on a local draft"]}),e("li",{children:[e("a",{href:"#/guide/sync-view",children:"display and reactive keys"})," - per-observer display state"]})]})]})),Ka=u(()=>()=>e("div",{children:[e("h1",{children:"query와 resource"}),e("p",{children:["조회 핸들은 두 가지를 동시에 듭니다. 마지막 READ가 확인한"," ",e("strong",{children:"서버 기준"}),"과, 그 위에 올린 ",e("strong",{children:"로컬 편집"}),"입니다. 이 둘을 갈라 두는 것이 저장되지 않은 필드와 낡은 필드를 구별하게 해 줍니다."]}),e("h2",{children:"읽기"}),e(t,{language:"typescript",code:`const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
});

await account.load();      // 신선한 캐시가 있으면 그것을 쓴다
await account.refetch();   // 강제로 READ한다
account.invalidate();      // key를 stale로 만들고, 앞선 진행 중 응답을 배제한다
account.dispose();         // 이 핸들의 구독을 놓는다`}),e("p",{children:[e("code",{children:"account.status"}),"는 첫 로드 전에도 읽을 수 있습니다."," ",e("code",{children:"account.ref"}),"와 ",e("code",{children:"account.watch"}),"는 로드가 성공할 때까지 ",e("strong",{children:"던집니다"})," — 내줄 기준이 없고, 가짜 기준을 돌려주는 것이야말로 로딩 화면이 해서는 안 되는 일이기 때문입니다."]}),e(t,{language:"typescript",code:`const status = account.status.value;

status.status;      // 'pending' | 'success' | 'error'
status.fetchStatus; // 'idle' | 'fetching' | 'paused'
status.loaded;      // 기준이 있는가
status.error;
status.updatedAt;
status.invalidated;

// 로딩 축과 분리된 편집 축
status.dirty;
status.conflicts;
status.version;
status.pending;      // 진행 중인 연결 WRITE
status.unconfirmed;  // 끝내 확인되지 않은 WRITE 결과`}),e("h2",{children:"컴포넌트에 연결하기"}),e("p",{children:[e("code",{children:"account.watch"}),"와 ",e("code",{children:"account.watchStatus"}),"는"," ",e("code",{children:"state-ref"}),"의 ",e("code",{children:"Watch"})," 모양이라 커넥터가 그대로 받습니다."]}),e(t,{language:"typescript",code:`const useAccount = connectReact(account.watch);
const useAccountStatus = connectReact(account.watchStatus);

function CityField() {
  const state = useAccount();
  return (
    <input
      value={state.address.city.value}
      onChange={event => (state.address.city.value = event.target.value)}
    />
  );
}`}),e("p",{children:["값 쪽은 ",e("code",{children:"loaded"}),"가 true가 된 뒤에만 마운트하세요. ref 자신이 그 전에는 거절하는 것과 같은 이유입니다."]}),e("h2",{children:"편집은 로컬이다"}),e("p",{children:"ref 쓰기는 이 client의 resource를 바꾸고 그것으로 끝입니다. 어떤 요청도 나가지 않습니다."}),e(t,{language:"typescript",code:`account.ref.address.city.value = 'Busan';

account.isDirty();  // true
account.changes();  // 한 줄: address.city, Seoul -> Busan
account.version();  // 로컬 리비전 카운터`}),e("p",{children:"같은 client에서 같은 key를 쓰는 다른 핸들은 그 편집을 즉시 봅니다. 핸들마다 복사본이 아니라 하나의 resource이기 때문입니다."}),e("h2",{children:"변경 목록"}),e("p",{children:[e("code",{children:"changes()"}),"는 ",e("a",{href:"#/ko/guide/draft",children:"로컬 draft"}),"가 쓰는 것과 같은 변경 모델이고, 원본 자리에 서버 기준이 들어갑니다."]}),e(t,{language:"typescript",code:`const [change] = account.changes();

change.path;      // ['address', 'city']
change.before;    // 서버 기준
change.after;     // 로컬 값
change.conflict;  // READ가 이 경로에 다른 값을 들고 왔을 때 true
change.id;`}),e("p",{children:["배열은 ",e("strong",{children:"하나의 원자적 필드"}),"로 추적됩니다. 원소 하나를 고쳐도 배열 전체의 변경으로 기록됩니다. 인덱스는 정체성이 아니라 위치이기 때문입니다."]}),e("h2",{children:"READ는 덮어쓰지 않고 rebase한다"}),e("p",{children:"나중에 READ가 도착해도 로컬 편집은 남습니다. 서버가 밑에서 움직인 경로는 조용히 교체되는 대신 충돌이 됩니다."}),e(t,{language:"typescript",code:`account.ref.address.city.value = 'Busan'; // 로컬

await account.refetch();  // 서버는 이제 그 경로에 'Gwangju'라고 답한다

account.status.value.conflicts;      // 1
account.changes()[0].conflict;       // true
account.ref.address.city.value;      // 여전히 'Busan' — 편집이 지켜졌다`}),e("p",{children:["조회 핸들에는 ",e("code",{children:"resolve()"}),"가 없습니다. 서버 값을 받거나, 내 값을 저장해서 지키거나, 사람이 고르게 하는 방법은"," ",e("a",{href:"#/ko/guide/sync-lifecycle",children:"편집의 생애"}),"에 있습니다."]}),e("h2",{children:"알려진 서버 값 수용"}),e("p",{children:[e("code",{children:"acceptServer(value)"}),"는 아무것도 보내지 않고 기준을 옮깁니다. 캐시 전용 수용이고, 아직 떠 있는 앞선 READ를 배제합니다."]}),e(t,{language:"typescript",code:"account.acceptServer(knownAccount);"}),e("p",{children:"그 조회에 연결된 WRITE가 진행 중이면 거절합니다 — 아직 답하지 않은 작업이 기준을 정하고 있는 중이기 때문입니다."}),e("h2",{children:"readonly 조회"}),e("p",{children:["절대 편집하지 않는 데이터나, 평범한 트리가 아닌 데이터(예:"," ",e("code",{children:"Date"}),")에는 ",e("code",{children:"editable: false"}),"를 주세요. ref setter가 거절됩니다."]}),e(t,{language:"typescript",code:`const settings = client.query({
  queryKey: ['settings'],
  queryFn: ({ signal }) => api.readSettings({ signal }),
  editable: false,
});

settings.ref.theme.value = 'dark'; // throws: This query is readonly.`}),e("p",{children:["readonly 조회에도 ",e("code",{children:"changes()"}),"와 ",e("code",{children:"version"}),"은"," ",e("strong",{children:"있습니다."})," 영원히 비어 있고 0일 뿐입니다. 거절하는 것은"," ",e("code",{children:"capture()"}),"입니다. 비어 있는 검토 표면과 존재하지 않는 표면은 다른 사실이고, 그 빈 목록이 둘을 가릅니다."]}),e("p",{children:["편집 가능한 조회에서 ",e("code",{children:"capture()"}),"가 무엇을 얼리고 저장 뒤 편집이 어떻게 되는지는"," ",e("a",{href:"#/ko/guide/sync-lifecycle",children:"편집의 생애"}),"를 보세요. 조회에서 난 충돌을 푸는 방법도 거기 있습니다."]}),e("h2",{children:"resource가 받는 것"}),e("p",{children:["편집 가능한 데이터는 기본적으로 순환 없는 평범한 트리와 조밀한 배열입니다. 예약된 프록시 키와, ",e("code",{children:".value"}),"가 돌려준 객체를 직접 변형하는 것은 거절합니다. ",e("code",{children:"load/fetch/ensure"}),"가 돌려주는 결과는 얼린 복사본이므로 ref로 편집하세요."]}),e("h2",{children:"캐시 준비하기"}),e(t,{language:"typescript",code:`await client.prefetch(options); // 성공하면 캐시하고, 로드 거절은 삼킨다
const fresh = await client.fetch(options);   // 신선한 캐시 또는 READ. 오류는 던진다
const cached = await client.ensure(options); // 확인된 캐시. stale이어도 준다

const seeded = client.query({ ...options, initialData: knownAccount });`}),e("p",{children:["이들은 client의 캐시와 진행 중 READ를 key로 공유하고, 임시 옵션이 기존 핸들의 옵션을 대체하지 않습니다. ",e("code",{children:"initialData"}),"는 완전하고 확인된 서버 값에만 쓰세요 — 그것이 편집 기준이 됩니다."]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/sync-mutation",children:"mutation과 link"})," - 그 변경을 보내기"]}),e("li",{children:[e("a",{href:"#/ko/guide/draft-conflicts",children:"충돌과 해소"})," - 로컬 draft에서 같은 충돌 모델"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-view",children:"표시와 반응형 key"})," - 관찰자별 표시 상태"]})]})]})),$a=u(()=>()=>e("div",{children:[e("h1",{children:"mutation and link"}),e("p",{children:["A local edit never reaches a server on its own. Sending one is an explicit mutation, and ",e("em",{children:"linking"})," that mutation to a query is what tells the client which edits the write was about."]}),e("h2",{children:"Capture, Then Run"}),e("p",{children:"Mutation input can have a completely different shape from the query data, so the client cannot infer which fields you saved. You capture the edits you intend to submit immediately before running."}),e(t,{language:"typescript",code:`const submission = account.capture();

const save = client.mutation({
  mutationFn: (input: { city: string }, { signal, idempotencyKey }) =>
    api.saveCity(input, { signal, idempotencyKey }),
});

const result = await save.run(
  { city: submission.value.address.city },
  {
    links: [
      {
        query: account,
        submission,
        accept: { kind: 'refetch' },
        onReject: 'keep',
      },
    ],
  }
);`}),e("p",{children:[e("code",{children:"capture()"})," freezes three things at this moment: the whole current value, the change rows (all of them, or only the IDs you pass), and the resource version. Any later edit - to any field - or a completed READ moves the version, and the link then refuses the submission before the WRITE is sent - capture late, not early."]}),e("p",{children:["Why it exists, what happens to each edit after the write, and how a conflict is settled are all in"," ",e("a",{href:"#/guide/sync-lifecycle",children:"Edit Lifecycle"}),"."]}),e("p",{children:[e("code",{children:"run"})," clones the input with ",e("code",{children:"structuredClone"})," ","before calling ",e("code",{children:"mutationFn"}),", so the input must be cloneable."]}),e("h2",{children:"Accepting the Result"}),e("p",{children:["Each link chooses, with an ",e("code",{children:"accept"})," object, how the new baseline is decided after a successful WRITE:"]}),e("ul",{children:[e("li",{children:[e("code",{children:"{ kind: 'refetch' }"})," - read the server again after the write"]}),e("li",{children:[e("code",{children:"{ kind: 'response', select }"})," - map the mutation response into the baseline"]}),e("li",{children:[e("code",{children:"{ kind: 'submitted' }"})," - take the submitted values as the new baseline. Only when the server contract guarantees they were accepted as sent. Requires a ",e("code",{children:"submission"})]}),e("li",{children:[e("code",{children:"{ kind: 'none' }"})," - the default when"," ",e("code",{children:"accept"})," is omitted. The baseline does not move, the edits stay dirty, and ",e("code",{children:"status.unconfirmed"})," turns true until a successful READ"]})]}),e("p",{children:["Only the persisted API (",e("code",{children:"linked.stage"})," in"," ",e("a",{href:"#/guide/sync-persistence",children:"Persistence and SSR"}),") takes these as plain strings (",e("code",{children:"'submitted'"}),"), because it has to serialize them. ",e("code",{children:"run"})," and ",e("code",{children:"start"})," take the objects above."]}),e("h2",{children:"What a Linked Result Can Be"}),e(t,{language:"typescript",code:`// result.kind
'success'     // the WRITE succeeded and acceptance completed
'sync-error'  // the WRITE succeeded, but acceptance or the follow-up READ failed
'rejected'    // the server explicitly refused (MutationRejectedError)
'unknown'     // the transport outcome is uncertain`}),e("p",{children:"The last two are the ones worth designing for:"}),e("ul",{children:[e("li",{children:[e("strong",{children:[e("code",{children:"unknown"})," keeps your edits and is never automatically retried."]})," ","The client does not know whether the server applied the write. An explicit retry needs a server-supported ",e("code",{children:"idempotencyKey"}),"."]}),e("li",{children:[e("strong",{children:[e("code",{children:"sync-error"})," must be reconciled with a new READ or a known server value"]})," ","- not by resending the write that already succeeded."]})]}),e("p",{children:["A confirmed rejection can keep the edits (",e("code",{children:"onReject: 'keep'"}),") or remove only the unchanged submitted ones (",e("code",{children:"onReject: 'remove'"}),"). Input you typed while the WRITE was in flight survives either way, including a return to the old baseline. Callback failures are reported as ",e("code",{children:"callbackError"})," without changing the write result."]}),e("h2",{children:"How a Result Is Classified"}),e("p",{children:["The client cannot tell a refusal from a lost connection by itself."," ",e("code",{children:"rejected"})," is reported ",e("strong",{children:"only"})," when"," ",e("code",{children:"mutationFn"})," throws ",e("code",{children:"MutationRejectedError"}),". Any other throw, and an abort, is ",e("code",{children:"unknown"}),"."]}),e(t,{language:"typescript",code:`import { MutationRejectedError } from '@stateref/sync';

const save = client.mutation({
  mutationFn: async (input: { name: string }, { signal }) => {
    const response = await fetch('/account', {
      method: 'PUT',
      body: JSON.stringify(input),
      signal,
    });
    if (response.status === 422) {
      // the server read the request and refused it
      throw new MutationRejectedError('name taken', await response.json());
    }
    if (!response.ok) throw new Error('HTTP ' + response.status); // -> 'unknown'
    return response.json();
  },
});

const result = await save.run({ name: 'Lee' });
if (result.kind === 'rejected') {
  (result.error as MutationRejectedError).reason; // the second argument above
}`}),e("h2",{children:"Retry"}),e("p",{children:["A mutation is attempted once by default. ",e("code",{children:"retry"})," is opt-in per run and requires an ",e("code",{children:"idempotencyKey"})," - without one,"," ",e("code",{children:"run"})," refuses with"," ",e("code",{children:"Mutation retry requires an idempotencyKey."})," A"," ",e("code",{children:"MutationRejectedError"})," is never retried; the server already answered."]}),e(t,{language:"typescript",code:`await save.run(input, {
  retry: 2,                        // up to 3 attempts
  idempotencyKey: 'account-1-save-42',
  retryDelay: attempt => 500 * attempt,
});`}),e("p",{children:["Inside ",e("code",{children:"mutationFn"}),", the second argument carries"," ",e("code",{children:"signal"}),", ",e("code",{children:"operationId"}),", ",e("code",{children:"attempt"})," and"," ",e("code",{children:"idempotencyKey"}),". Once an operation has settled as"," ",e("code",{children:"unknown"}),", nothing resends it."]}),e("h2",{children:"Callbacks"}),e("p",{children:[e("code",{children:"onSuccess"}),", ",e("code",{children:"onError"})," and ",e("code",{children:"onSettled"})," ","go in the mutation options. A callback that throws does not change the result: ",e("code",{children:"kind"})," stays what it was and the error is reported as"," ",e("code",{children:"callbackError"}),"."]}),e("h2",{children:"dirty and pending Are Different Axes"}),e("p",{children:["The linked query's ",e("code",{children:"status.pending"})," tracks the operation;"," ",e("code",{children:"status.dirty"})," tracks unsaved input. A field can be clean while a write is in flight, and dirty while nothing is being sent."]}),e("h2",{children:"Showing That a Save Is in Progress"}),e("p",{children:["Progress lives in two places, and they watch different things. Both are readonly refs, and ",e("code",{children:"watchStatus"})," plugs into a connector as is."]}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{}),e("th",{children:["The query's ",e("code",{children:"account.status"})]}),e("th",{children:["The mutation's ",e("code",{children:"save.status"})]})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:"What it watches"}),e("td",{children:"The data: is a linked write in flight for this query"}),e("td",{children:"The command: the operations sent through this handle"})]}),e("tr",{children:[e("td",{children:"In progress"}),e("td",{children:[e("code",{children:"pending"})," is 0 or 1 (one linked write at a time)"]}),e("td",{children:[e("code",{children:"pending"})," = unsettled operations on this handle, including ones waiting for their scope"]})]}),e("tr",{children:[e("td",{children:"Unlinked commands"}),e("td",{children:"Do not show up"}),e("td",{children:"Show up - the only place they do"})]}),e("tr",{children:[e("td",{children:"The result"}),e("td",{children:["No kind. After ",e("code",{children:"unknown"})," or ",e("code",{children:"sync-error"}),","," ",e("code",{children:"unconfirmed"})," turns true; ",e("code",{children:"rejected"})," leaves no trace"]}),e("td",{children:[e("code",{children:"phase"})," is ",e("code",{children:"'success'"}),","," ",e("code",{children:"'rejected'"}),", ",e("code",{children:"'unknown'"})," or"," ",e("code",{children:"'sync-error'"}),"; ",e("code",{children:"error"})," holds what was thrown"]})]})]})]}),e("p",{children:["An operation linked to several queries sets each query's"," ",e("code",{children:"pending"})," to 1. Input keeps working during the write, so"," ",e("code",{children:"pending"})," and ",e("code",{children:"dirty"})," being true together is normal."]}),e("h3",{children:"Saving Is pending, Not phase"}),e("p",{children:["A handle's ",e("code",{children:"phase"})," follows"," ",e("strong",{children:"the most recent event"}),". With two operations in flight, when one finishes ",e("code",{children:"phase"})," becomes ",e("code",{children:"'success'"})," ","while the other is still running."]}),e(t,{language:"typescript",code:`const a = send.start(inputA);
const b = send.start(inputB);
send.status.value; // { phase: 'pending', pending: 2, operationId: 3, ... }

// a finished first
send.status.value; // { phase: 'success', pending: 1, operationId: 2, ... } — b is still running`}),e("p",{children:['So decide "saving" with ',e("code",{children:"pending.value > 0"}),", and use ",e("code",{children:"phase"})," and ",e("code",{children:"error"})," to show a finished result. To show each operation separately, use the ",e("code",{children:"operation.status"})," ","that ",e("code",{children:"start()"})," returns - its ",e("code",{children:"pending"})," is 0 or 1, and an operation still waiting for its scope is already"," ",e("code",{children:"'pending'"}),"."]}),e("h3",{children:"On the Screen"}),e(t,{language:"typescript",code:`const useAccountStatus = connectReact(account.watchStatus);
const useSaveStatus = connectReact(save.watchStatus);

function SaveBar() {
  const status = useAccountStatus(); // the data side
  const saving = useSaveStatus();    // the command side — only for the result
  return (
    <>
      {status.pending.value > 0 && <span>Saving…</span>}
      {status.dirty.value && <span>Unsaved changes</span>}
      {status.unconfirmed.value && <span>Save not confirmed</span>}
      {saving.phase.value === 'rejected' && <span>Save refused</span>}
      <button disabled={status.pending.value > 0} onClick={onSave}>
        Save
      </button>
    </>
  );
}`}),e("p",{children:["For a form saved through one link, the query's ",e("code",{children:"status"})," ","alone covers the saving indicator and the disabled button. Add the mutation's ",e("code",{children:"status"})," when you need the result kind or"," ",e("code",{children:"error"})," - a refusal message, say - or to show progress for an unlinked command."]}),e("ul",{children:[e("li",{children:["Seen through ",e("code",{children:"watchStatus"}),", ",e("code",{children:"phase"})," goes"," ",e("code",{children:"'idle'"})," → ",e("code",{children:"'pending'"})," → the result within one run."]}),e("li",{children:["A run that throws before the WRITE, such as a stale submission, leaves the status untouched (still ",e("code",{children:"'idle'"}),")."]}),e("li",{children:"Neither status can be written to; a write throws."})]}),e("h2",{children:"Unlinked Mutations"}),e("p",{children:'A mutation with no links runs independently and never clears resource edits. That is the right shape for a command that is not "save this form".'}),e(t,{language:"typescript",code:`const sendNote = client.mutation({
  mutationFn: (input: { note: string }) => api.sendNote(input),
});

await sendNote.run({ note: 'Hello' }); // no link, no resource involved`}),e("h2",{children:"Ordering"}),e("p",{children:["Independent mutations run concurrently by default. Pass the same"," ",e("code",{children:"scope"})," string to run them in start order, callbacks included; a failure does not block the next one."]}),e(t,{language:"typescript",code:`await Promise.all([
  sendNote.run({ note: 'first' }, { scope: 'notes' }),
  sendNote.run({ note: 'second' }, { scope: 'notes' }), // waits for the first
]);`}),e("p",{children:["A query permits ",e("strong",{children:"one linked operation at a time"}),". A second linked write on the same query is refused rather than queued - sequence them by awaiting the first result and capturing the current edits again."]}),e("p",{children:["A multi-query link does not promise atomicity across servers or queries. If only some links fail to reconcile, the job is ",e("code",{children:"sync-error"})," ","and the links that already applied are not rolled back."]}),e("h2",{children:"start, for More Control"}),e("p",{children:[e("code",{children:"start"})," returns the operation instead of a promise - useful when the UI needs to show or cancel an individual operation."]}),e(t,{language:"typescript",code:`const operation = save.start(input, { links });
operation.id;                  // operation ID
operation.status.phase.value;  // 'pending', then the result kind
operation.watchStatus;         // Watch shape for a connector
operation.abort();             // settles as 'unknown'
const result = await operation.result;
operation.dispose();

save.status.phase.value;       // the handle's latest operation
// { phase: 'idle' | 'pending' | result kind, pending, operationId, error }`}),e("h2",{children:"Honest Mapping Is the Caller's Job"}),e("p",{children:"The library cannot infer which fields a free-form DTO saved. If you tell a link that a change was submitted when it was not, the baseline will be wrong and nothing will catch it. Map the actual DTO to the captured changes honestly."}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/sync-lifecycle",children:"Edit Lifecycle"})," - what"," ",e("code",{children:"capture()"})," freezes and what each result does to your edits"]}),e("li",{children:[e("a",{href:"#/guide/sync-query",children:"query and resource"})," -"," ",e("code",{children:"acceptServer()"})]}),e("li",{children:[e("a",{href:"#/guide/sync-persistence",children:"Persistence and SSR"})," - queued commands and persisted submissions"]}),e("li",{children:[e("a",{href:"#/guide/sync-observation",children:"Observation"})," - watching WRITEs in flight"]})]})]})),Ja=u(()=>()=>e("div",{children:[e("h1",{children:"mutation과 link"}),e("p",{children:["로컬 편집은 스스로 서버에 닿지 않습니다. 보내는 것은 명시적인 mutation이고, 그 mutation을 조회에 ",e("em",{children:"연결"}),"하는 것이 이 쓰기가 어떤 편집에 대한 것인지 client에 알려 주는 방법입니다."]}),e("h2",{children:"고정하고 실행하기"}),e("p",{children:"mutation 입력은 조회 데이터와 전혀 다른 모양일 수 있으므로, client는 어떤 필드를 저장했는지 추론할 수 없습니다. 제출할 편집을 실행 직전에 고정합니다."}),e(t,{language:"typescript",code:`const submission = account.capture();

const save = client.mutation({
  mutationFn: (input: { city: string }, { signal, idempotencyKey }) =>
    api.saveCity(input, { signal, idempotencyKey }),
});

const result = await save.run(
  { city: submission.value.address.city },
  {
    links: [
      {
        query: account,
        submission,
        accept: { kind: 'refetch' },
        onReject: 'keep',
      },
    ],
  }
);`}),e("p",{children:[e("code",{children:"capture()"}),"는 이 순간의 세 가지를 얼립니다. 현재 값 전체, 변경 줄(전부, 또는 넘긴 ID만), 그리고 resource 버전입니다. 그 뒤에"," ",e("strong",{children:"어느 필드든"})," 한 번 편집하거나 READ가 끝나면 버전이 움직이고, link는 WRITE를 보내기 전에 그 제출을 거절합니다 — 일찍 말고 늦게 고정하세요."]}),e("p",{children:["왜 필요한지, 쓰기 뒤에 각 편집이 어떻게 되는지, 충돌은 어떻게 푸는지는"," ",e("a",{href:"#/ko/guide/sync-lifecycle",children:"편집의 생애"}),"에 모았습니다."]}),e("p",{children:[e("code",{children:"run"}),"은 ",e("code",{children:"mutationFn"}),"을 부르기 전에 입력을"," ",e("code",{children:"structuredClone"}),"으로 복제하므로, 입력은 복제 가능해야 합니다."]}),e("h2",{children:"결과 수용 방식"}),e("p",{children:["link마다 ",e("code",{children:"accept"})," 객체로, WRITE가 성공한 뒤 새 기준을 어떻게 정할지 고릅니다."]}),e("ul",{children:[e("li",{children:[e("code",{children:"{ kind: 'refetch' }"})," - 쓰기 뒤 서버를 다시 읽는다"]}),e("li",{children:[e("code",{children:"{ kind: 'response', select }"})," - mutation 응답을 기준으로 매핑한다"]}),e("li",{children:[e("code",{children:"{ kind: 'submitted' }"})," - 보낸 값을 새 기준으로 삼는다. 보낸 값이 그대로 수용됐음을 서버 계약이 보장할 때만."," ",e("code",{children:"submission"}),"이 필요하다"]}),e("li",{children:[e("code",{children:"{ kind: 'none' }"})," - ",e("code",{children:"accept"}),"를 생략하면 이것이다. 기준은 움직이지 않고, 편집은 dirty로 남고,"," ",e("code",{children:"status.unconfirmed"}),"가 성공한 READ가 올 때까지 true가 된다"]})]}),e("p",{children:["문자열(",e("code",{children:"'submitted'"}),")로 받는 것은 직렬화해야 하는 영속 API(",e("a",{href:"#/ko/guide/sync-persistence",children:"영속화와 SSR"}),"의"," ",e("code",{children:"linked.stage"}),")뿐입니다. ",e("code",{children:"run"}),"과"," ",e("code",{children:"start"}),"는 위의 객체를 받습니다."]}),e("h2",{children:"연결된 결과가 될 수 있는 것"}),e(t,{language:"typescript",code:`// result.kind
'success'     // WRITE가 성공했고 수용도 끝났다
'sync-error'  // WRITE는 성공했으나 수용이나 후속 READ가 실패했다
'rejected'    // 서버가 명시적으로 거절했다 (MutationRejectedError)
'unknown'     // 전송 결과가 불확실하다`}),e("p",{children:"설계할 때 신경 써야 하는 것은 뒤의 둘입니다."}),e("ul",{children:[e("li",{children:[e("strong",{children:[e("code",{children:"unknown"}),"은 편집을 지키고 절대 자동으로 재전송하지 않습니다."]})," ","서버가 쓰기를 적용했는지 client는 모릅니다. 명시적 재시도는 서버가 지원하는 ",e("code",{children:"idempotencyKey"}),"가 필요합니다."]}),e("li",{children:[e("strong",{children:[e("code",{children:"sync-error"}),"는 새 READ나 알려진 서버 값으로 화해해야 합니다."]})," ","이미 성공한 쓰기를 다시 보내는 것으로 해결하지 마세요."]})]}),e("p",{children:["확정된 거절은 편집을 지키거나(",e("code",{children:"onReject: 'keep'"}),") 바뀌지 않은 제출 항목만 되돌릴 수 있습니다(",e("code",{children:"onReject: 'remove'"}),"). WRITE가 떠 있는 동안 입력한 것은 어느 쪽이든 살아남고, 옛 기준으로 되돌린 것까지 포함합니다. 콜백 실패는 쓰기 결과를 바꾸지 않고"," ",e("code",{children:"callbackError"}),"로 보고됩니다."]}),e("h2",{children:"결과가 갈리는 기준"}),e("p",{children:["client는 거절과 끊긴 연결을 스스로 구별할 수 없습니다."," ",e("code",{children:"rejected"}),"는 ",e("code",{children:"mutationFn"}),"이"," ",e("code",{children:"MutationRejectedError"}),"를 던질 때",e("strong",{children:"만"})," ","보고됩니다. 그 밖의 모든 예외와 abort는 ",e("code",{children:"unknown"}),"입니다."]}),e(t,{language:"typescript",code:`import { MutationRejectedError } from '@stateref/sync';

const save = client.mutation({
  mutationFn: async (input: { name: string }, { signal }) => {
    const response = await fetch('/account', {
      method: 'PUT',
      body: JSON.stringify(input),
      signal,
    });
    if (response.status === 422) {
      // 서버가 요청을 읽고 거절했다
      throw new MutationRejectedError('name taken', await response.json());
    }
    if (!response.ok) throw new Error('HTTP ' + response.status); // -> 'unknown'
    return response.json();
  },
});

const result = await save.run({ name: 'Lee' });
if (result.kind === 'rejected') {
  (result.error as MutationRejectedError).reason; // 위의 두 번째 인자
}`}),e("h2",{children:"재시도"}),e("p",{children:["mutation은 기본적으로 한 번만 시도합니다. ",e("code",{children:"retry"}),"는 실행마다 켜는 opt-in이고 ",e("code",{children:"idempotencyKey"}),"가 필요합니다 — 없으면"," ",e("code",{children:"run"}),"이"," ",e("code",{children:"Mutation retry requires an idempotencyKey."}),"로 거절합니다."," ",e("code",{children:"MutationRejectedError"}),"는 재시도하지 않습니다. 서버가 이미 답했기 때문입니다."]}),e(t,{language:"typescript",code:`await save.run(input, {
  retry: 2,                        // 최대 3번 시도
  idempotencyKey: 'account-1-save-42',
  retryDelay: attempt => 500 * attempt,
});`}),e("p",{children:[e("code",{children:"mutationFn"}),"의 두 번째 인자에는 ",e("code",{children:"signal"}),","," ",e("code",{children:"operationId"}),", ",e("code",{children:"attempt"}),","," ",e("code",{children:"idempotencyKey"}),"가 들어 있습니다. 작업이 ",e("code",{children:"unknown"}),"으로 끝난 뒤에는 아무것도 그것을 다시 보내지 않습니다."]}),e("h2",{children:"콜백"}),e("p",{children:[e("code",{children:"onSuccess"}),", ",e("code",{children:"onError"}),", ",e("code",{children:"onSettled"}),"는 mutation 옵션에 둡니다. 콜백이 던져도 결과는 바뀌지 않습니다."," ",e("code",{children:"kind"}),"는 그대로이고 그 오류는 ",e("code",{children:"callbackError"}),"로 보고됩니다."]}),e("h2",{children:"dirty와 pending은 다른 축이다"}),e("p",{children:["연결된 조회의 ",e("code",{children:"status.pending"}),"은 작업을 추적하고,"," ",e("code",{children:"status.dirty"}),"는 저장되지 않은 입력을 추적합니다. 쓰기가 떠 있는데 필드는 깨끗할 수 있고, 아무것도 보내지 않는데 dirty일 수 있습니다."]}),e("h2",{children:"저장 중 표시하기"}),e("p",{children:["진행 상태는 두 곳에 있고, 보는 대상이 다릅니다. 둘 다 읽기 전용 ref이고"," ",e("code",{children:"watchStatus"}),"가 커넥터에 그대로 연결됩니다."]}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{}),e("th",{children:["조회의 ",e("code",{children:"account.status"})]}),e("th",{children:["mutation의 ",e("code",{children:"save.status"})]})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:"무엇을 보나"}),e("td",{children:"데이터: 이 조회에 연결된 쓰기가 진행 중인가"}),e("td",{children:"명령: 이 핸들로 보낸 작업들"})]}),e("tr",{children:[e("td",{children:"진행 중"}),e("td",{children:[e("code",{children:"pending"})," 0 또는 1 (연결 쓰기는 한 번에 하나)"]}),e("td",{children:[e("code",{children:"pending"})," = 이 핸들에서 끝나지 않은 작업 수. scope를 기다리는 작업도 센다"]})]}),e("tr",{children:[e("td",{children:"link 없는 명령"}),e("td",{children:"나타나지 않는다"}),e("td",{children:"보인다 — 유일한 창구"})]}),e("tr",{children:[e("td",{children:"결과"}),e("td",{children:["종류가 없다. ",e("code",{children:"unknown"}),"·",e("code",{children:"sync-error"})," 뒤에"," ",e("code",{children:"unconfirmed"}),"가 true가 될 뿐, ",e("code",{children:"rejected"}),"는 흔적이 없다"]}),e("td",{children:[e("code",{children:"phase"}),"가 ",e("code",{children:"'success'"}),"·",e("code",{children:"'rejected'"}),"·",e("code",{children:"'unknown'"}),"·",e("code",{children:"'sync-error'"}),", ",e("code",{children:"error"}),"에 던져진 오류"]})]})]})]}),e("p",{children:["여러 조회를 link한 작업은 각 조회의 ",e("code",{children:"pending"}),"을 따로 1로 만듭니다. 쓰는 동안에도 입력은 계속되므로 ",e("code",{children:"pending"}),"과"," ",e("code",{children:"dirty"}),"가 함께 true인 것이 정상입니다."]}),e("h3",{children:"저장 중인지는 phase가 아니라 pending으로"}),e("p",{children:["핸들의 ",e("code",{children:"phase"}),"는 ",e("strong",{children:"가장 최근에 일어난 사건"}),"을 따라갑니다. 작업 둘이 떠 있다가 하나가 끝나면 다른 하나가 아직 도는데도"," ",e("code",{children:"phase"}),"는 ",e("code",{children:"'success'"}),"가 됩니다."]}),e(t,{language:"typescript",code:`const a = send.start(inputA);
const b = send.start(inputB);
send.status.value; // { phase: 'pending', pending: 2, operationId: 3, ... }

// a가 먼저 끝났다
send.status.value; // { phase: 'success', pending: 1, operationId: 2, ... } — b는 아직 돈다`}),e("p",{children:['그래서 "저장 중"은 ',e("code",{children:"pending.value > 0"}),"으로 판정하고, ",e("code",{children:"phase"}),"와 ",e("code",{children:"error"}),"는 끝난 결과를 보여 줄 때 씁니다. 작업 하나하나를 따로 보여야 하면 ",e("code",{children:"start()"}),"가 돌려주는 ",e("code",{children:"operation.status"}),"를 씁니다 — 그"," ",e("code",{children:"pending"}),"은 0 또는 1이고, scope 때문에 아직 시작하지 못한 작업도 ",e("code",{children:"'pending'"}),"입니다."]}),e("h3",{children:"화면에 붙이기"}),e(t,{language:"typescript",code:`const useAccountStatus = connectReact(account.watchStatus);
const useSaveStatus = connectReact(save.watchStatus);

function SaveBar() {
  const status = useAccountStatus(); // 데이터 쪽
  const saving = useSaveStatus();    // 명령 쪽 — 결과 표시에만
  return (
    <>
      {status.pending.value > 0 && <span>저장 중…</span>}
      {status.dirty.value && <span>저장하지 않은 변경 있음</span>}
      {status.unconfirmed.value && <span>저장 여부 확인 필요</span>}
      {saving.phase.value === 'rejected' && <span>저장 거절됨</span>}
      <button disabled={status.pending.value > 0} onClick={onSave}>
        저장
      </button>
    </>
  );
}`}),e("p",{children:["link가 하나뿐인 폼 저장이라면 저장 중 표시와 버튼 비활성화는 조회의"," ",e("code",{children:"status"}),"만으로 충분합니다. mutation의 ",e("code",{children:"status"}),"는 거절 메시지처럼 결과 종류나 ",e("code",{children:"error"}),"가 필요할 때, 그리고 link 없는 명령의 진행을 보일 때 더합니다."]}),e("ul",{children:[e("li",{children:[e("code",{children:"watchStatus"}),"로 본 ",e("code",{children:"phase"}),"는 한 번의 실행에서"," ",e("code",{children:"'idle'"})," → ",e("code",{children:"'pending'"})," → 결과 순서로 바뀝니다."]}),e("li",{children:["낡은 제출처럼 WRITE 전에 던지는 실행은 status를 바꾸지 않습니다(",e("code",{children:"'idle'"})," 그대로)."]}),e("li",{children:"두 status 모두 쓸 수 없습니다. 쓰면 던집니다."})]}),e("h2",{children:"연결하지 않은 mutation"}),e("p",{children:'link가 없는 mutation은 독립적으로 실행되고 resource 편집을 절대 지우지 않습니다. "이 폼을 저장"이 아닌 명령에 맞는 모양입니다.'}),e(t,{language:"typescript",code:`const sendNote = client.mutation({
  mutationFn: (input: { note: string }) => api.sendNote(input),
});

await sendNote.run({ note: 'Hello' }); // link 없음, resource와 무관`}),e("h2",{children:"순서"}),e("p",{children:["독립 mutation은 기본적으로 동시에 실행됩니다. 같은 ",e("code",{children:"scope"})," ","문자열을 주면 콜백까지 포함해 시작 순서대로 실행되고, 하나가 실패해도 다음을 막지 않습니다."]}),e(t,{language:"typescript",code:`await Promise.all([
  sendNote.run({ note: 'first' }, { scope: 'notes' }),
  sendNote.run({ note: 'second' }, { scope: 'notes' }), // 첫째를 기다린다
]);`}),e("p",{children:["한 조회는 ",e("strong",{children:"연결된 작업을 한 번에 하나만"})," 허용합니다. 같은 조회에 두 번째 연결 쓰기는 큐에 쌓이는 것이 아니라 거절됩니다 — 앞선 결과를 await하고 현재 편집을 다시 고정해서 순서를 만드세요."]}),e("p",{children:["여러 조회를 묶은 link는 서버 간·조회 간 원자성을 약속하지 않습니다. 일부 link만 화해에 실패하면 그 작업은 ",e("code",{children:"sync-error"}),"이고, 이미 적용된 link는 되돌리지 않습니다."]}),e("h2",{children:"더 세밀한 제어가 필요하면 start"}),e("p",{children:[e("code",{children:"start"}),"는 Promise 대신 작업 자체를 돌려줍니다. UI가 개별 작업을 보여 주거나 취소해야 할 때 씁니다."]}),e(t,{language:"typescript",code:`const operation = save.start(input, { links });
operation.id;                  // 작업 ID
operation.status.phase.value;  // 'pending', 끝나면 결과 kind
operation.watchStatus;         // 커넥터가 받는 Watch 모양
operation.abort();             // 'unknown'으로 끝난다
const result = await operation.result;
operation.dispose();

save.status.phase.value;       // 핸들의 가장 최근 작업
// { phase: 'idle' | 'pending' | 결과 kind, pending, operationId, error }`}),e("h2",{children:"정직한 매핑은 호출자의 몫이다"}),e("p",{children:"자유 형식 DTO가 어떤 필드를 저장했는지 라이브러리는 추론할 수 없습니다. 제출하지 않은 변경을 제출했다고 link에 말하면 기준이 틀리게 되고, 그것을 잡아 줄 장치는 없습니다. 실제 DTO와 고정한 변경을 정직하게 대응시키세요."}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/sync-lifecycle",children:"편집의 생애"})," -"," ",e("code",{children:"capture()"}),"가 얼리는 것과 결과마다 편집에 일어나는 일"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-query",children:"query와 resource"})," -"," ",e("code",{children:"acceptServer()"})]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-persistence",children:"영속화와 SSR"})," - 큐에 넣은 명령과 영속화한 제출"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-observation",children:"관측"})," - 떠 있는 WRITE 보기"]})]})]})),za=u(()=>()=>e("div",{children:[e("h1",{children:"Edit Lifecycle: From capture to Acceptance"}),e("p",{children:["This page follows one edit: typed into a ref, made dirty, frozen by"," ",e("code",{children:"capture()"}),", sent by a mutation, and then cleared or kept depending on the result. The rules were spread across several pages; here they are in one line."]}),e("h2",{children:"Four Words"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Word"}),e("th",{children:"Meaning"}),e("th",{children:"Where you see it"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:"baseline"}),e("td",{children:"The value the server last confirmed. A READ or an acceptance moves it"}),e("td",{children:e("code",{children:"change.before"})})]}),e("tr",{children:[e("td",{children:"local edit"}),e("td",{children:"A value on top of the baseline that the server does not know yet. Writing to the ref creates one"}),e("td",{children:[e("code",{children:"changes()"}),", ",e("code",{children:"status.dirty"})]})]}),e("tr",{children:[e("td",{children:"submission"}),e("td",{children:[`The caller's statement "this WRITE is about these edits". `,e("code",{children:"capture()"})," makes it"]}),e("td",{children:e("code",{children:"link.submission"})})]}),e("tr",{children:[e("td",{children:"acceptance"}),e("td",{children:"Moving the baseline to a new value after a successful WRITE"}),e("td",{children:e("code",{children:"link.accept"})})]})]})]}),e("h2",{children:"At a Glance"}),e(t,{language:"bash",code:`write to the ref ───────► a row appears in changes() (dirty)
      │
      │ capture()           freezes value · rows · version
      ▼
run(input, { links: [{ query, submission, accept }] })
      │
      │ same version? ── no ─► 'Submission is stale' (no WRITE)
      ▼
    WRITE
      ├─ success ───────► move the baseline per accept ─► submitted rows clear
      ├─ rejected ──────► onReject: 'keep' keeps them, 'remove' reverts them
      ├─ unknown ───────► edits stay, unconfirmed. Nothing is resent
      └─ sync-error ────► WRITE succeeded, acceptance failed. Edits stay, unconfirmed`}),e("h2",{children:"1. Editing"}),e("p",{children:"Writing to the ref creates one change row per edited path, and every write moves the resource version by one. Assigning the same value again is not a write and does not move the version."}),e(t,{language:"typescript",code:`// server: { address: { city: 'Seoul', zip: '100' }, name: 'Kim' }
await account.load();
account.version(); // 0

account.ref.address.city.value = 'Busan';
account.ref.name.value = 'Lee';
account.version(); // 2

account.changes();
// [
//   { id: 1, path: ['address', 'city'], before: { exists: true, value: 'Seoul' },
//     after: { exists: true, value: 'Busan' }, conflict: false, ... },
//   { id: 2, path: ['name'], before: { exists: true, value: 'Kim' },
//     after: { exists: true, value: 'Lee' }, conflict: false, ... },
// ]`}),e("h2",{children:"2. Why capture Exists"}),e("p",{children:["The input you send (the DTO) can have a different shape from the query data. If the save API takes only ",e("code",{children:"{ city: 'Busan' }"}),", the client has no way to know which of the two edits that DTO saved. Names do not line up reliably, and APIs that merge or split fields are common."]}),e("p",{children:["So the caller says it. Passing the submission that"," ",e("code",{children:"capture()"}),' made to a link is the statement "this WRITE is about these rows". With it, the client can clear exactly those rows on success and revert exactly those rows on rejection.']}),e("h2",{children:"3. What capture Freezes"}),e(t,{language:"typescript",code:`const submission = account.capture();
submission.version; // 2 — the resource version right now
submission.value;   // { address: { city: 'Busan', zip: '100' }, name: 'Lee' } (frozen copy)
submission.changes; // the two current rows (frozen copies)`}),e("ul",{children:[e("li",{children:[e("code",{children:"value"})," is the ",e("strong",{children:"whole current value"}),", edits included. Build the DTO from it and the payload cannot drift if something writes to the ref after the capture."]}),e("li",{children:[e("code",{children:"changes"}),' are the rows being submitted: all of them with no argument, or only the IDs you pass (see "Partial Save").']}),e("li",{children:[e("code",{children:"version"})," is what the staleness check compares (next section)."]}),e("li",{children:["Capture succeeds with no edits; the submission just has empty"," ",e("code",{children:"changes"}),"."]})]}),e("p",{children:"capture itself refuses in three cases:"}),e(t,{language:"typescript",code:`account.capture([999]);   // TypeError: Unknown or repeated resource change ID.
account.capture([1, 1]);  // TypeError: Unknown or repeated resource change ID.
settings.capture();       // an editable: false query — TypeError: This query is readonly.`}),e("h2",{children:"4. Stale Submissions"}),e("p",{children:["If the version moves between the capture and ",e("code",{children:"run"}),", the submission is stale. The link refuses it ",e("strong",{children:"before"})," the WRITE is sent, and ",e("code",{children:"mutationFn"})," is never called."]}),e(t,{language:"typescript",code:`const submission = account.capture();
account.ref.address.zip.value = '200'; // even a field outside the submission

save.start(input, { links: [{ query: account, submission, accept: { kind: 'submitted' } }] });
// throws synchronously: Error: Submission is stale. Capture the current edits again.

await save.run(input, { links: [{ query: account, submission, accept: { kind: 'submitted' } }] });
// rejects with the same message`}),e("ul",{children:[e("li",{children:["An edit to ",e("strong",{children:"any"})," field makes it stale. The check uses the version, not the path."]}),e("li",{children:["A completed READ makes it stale too: ",e("code",{children:"refetch()"})," moves the baseline and the version."]}),e("li",{children:"Assigning the same value again does not."})]}),e("p",{children:["So capture"," ",e("strong",{children:"right before sending, in the same synchronous flow"})," - capture in the save button's handler and call ",e("code",{children:"run"})," ","immediately. If an await sits in between, such as a confirmation dialog, capture again after it."]}),e("h2",{children:"5. While the WRITE Is in Flight"}),e("p",{children:["Once ",e("code",{children:"run"})," starts, the query's"," ",e("code",{children:"status.pending"})," is 1, and until the result arrives:"]}),e("ul",{children:[e("li",{children:[e("strong",{children:"Input keeps working."})," An edit made during the WRITE is separate from the submission and survives whatever the result is."]}),e("li",{children:["A second linked write is refused, not queued:"," ",e("code",{children:"A linked operation is already pending for this query."})]}),e("li",{children:[e("code",{children:"acceptServer()"})," is refused:"," ",e("code",{children:"A linked operation is pending for this query."})]}),e("li",{children:"Automatic READs (focus, reconnect, polling) hold off. The unanswered operation is still deciding the baseline."})]}),e(t,{language:"typescript",code:`account.ref.address.city.value = 'Busan';
const submission = account.capture();
const pending = save.run({ city: 'Busan' }, {
  links: [{ query: account, submission, accept: { kind: 'submitted' } }],
});

account.ref.address.zip.value = '999'; // input during the WRITE

await pending; // { kind: 'success', ... }
account.ref.value;  // { address: { city: 'Busan', zip: '999' }, ... }
account.changes();  // only the zip row remains (before: '100')`}),e("h2",{children:"6. What Each Result Does to Your Edits"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Result"}),e("th",{children:"Baseline"}),e("th",{children:"Submitted edits"}),e("th",{children:e("code",{children:"unconfirmed"})})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:[e("code",{children:"success"})," + ",e("code",{children:"{ kind: 'submitted' }"})]}),e("td",{children:"moves to the submitted values"}),e("td",{children:"cleared"}),e("td",{children:"false"})]}),e("tr",{children:[e("td",{children:[e("code",{children:"success"})," + ",e("code",{children:"{ kind: 'response' }"})]}),e("td",{children:["moves to ",e("code",{children:"select(response)"})]}),e("td",{children:["cleared. If the server corrected the value (",e("code",{children:"lee"})," →"," ",e("code",{children:"LEE"}),"), the corrected value shows"]}),e("td",{children:"false"})]}),e("tr",{children:[e("td",{children:[e("code",{children:"success"})," + ",e("code",{children:"{ kind: 'refetch' }"})]}),e("td",{children:"moves to the re-read value"}),e("td",{children:"cleared"}),e("td",{children:"false"})]}),e("tr",{children:[e("td",{children:[e("code",{children:"success"})," + ",e("code",{children:"{ kind: 'none' }"})," (the default)"]}),e("td",{children:"unchanged"}),e("td",{children:[e("strong",{children:"kept"})," (still dirty)"]}),e("td",{children:"true, until the next successful READ"})]}),e("tr",{children:[e("td",{children:[e("code",{children:"rejected"})," + ",e("code",{children:"onReject: 'keep'"})," (the default)"]}),e("td",{children:"unchanged"}),e("td",{children:"kept"}),e("td",{children:"false"})]}),e("tr",{children:[e("td",{children:[e("code",{children:"rejected"})," + ",e("code",{children:"onReject: 'remove'"})]}),e("td",{children:"unchanged"}),e("td",{children:"rows not edited again during the WRITE revert to the baseline"}),e("td",{children:"false"})]}),e("tr",{children:[e("td",{children:e("code",{children:"unknown"})}),e("td",{children:"unchanged"}),e("td",{children:"kept. Nothing is resent"}),e("td",{children:"true"})]}),e("tr",{children:[e("td",{children:e("code",{children:"sync-error"})}),e("td",{children:"unchanged. With several links, the ones already accepted are not rolled back"}),e("td",{children:"kept"}),e("td",{children:"true"})]})]})]}),e("p",{children:["In every row, ",e("strong",{children:"edits made during the WRITE survive."})," ","Success clears only the rows that were in the submission; later input continues as edits on top of the new baseline."]}),e("p",{children:"A link can exist without a submission, but combinations that only make sense with one are refused:"}),e(t,{language:"typescript",code:`{ query, accept: { kind: 'submitted' } } // TypeError: Submitted acceptance requires a submission.
{ query, onReject: 'remove' }             // TypeError: Removing rejected edits requires a submission.
{ query: account, submission: other.capture() } // TypeError: Submission belongs to another resource.`}),e("p",{children:["How ",e("code",{children:"rejected"})," and ",e("code",{children:"unknown"})," are told apart (",e("code",{children:"MutationRejectedError"}),") and the retry rules are in"," ",e("a",{href:"#/guide/sync-mutation",children:"mutation and link"}),"."]}),e("h2",{children:"7. Partial Save"}),e("p",{children:["When a screen saves only some of the edits, pick change-row"," ",e("code",{children:"id"}),"s and capture those. Rows you did not submit stay dirty."]}),e(t,{language:"typescript",code:`account.ref.address.city.value = 'Busan';
account.ref.address.zip.value = '200';

const cityId = account
  .changes()
  .find(change => change.path.join('.') === 'address.city')!.id;
const submission = account.capture([cityId]);

submission.changes.map(change => change.path); // [['address', 'city']]
submission.value.address.zip;                  // '200' — value is still the whole thing

await saveCity.run(
  { city: submission.value.address.city },
  { links: [{ query: account, submission, accept: { kind: 'submitted' } }] }
);
account.changes(); // only the zip row remains`}),e("p",{children:[e("code",{children:"value"})," is the whole value regardless of which rows you picked. Keeping the DTO fields and the picked rows in agreement is the caller's job - claim a change was submitted when it was not and the baseline goes wrong, with nothing to catch it."]}),e("h2",{children:"8. Settling a Conflict on a Query"}),e("p",{children:"When a READ brings a different value for a path that still has an edit, that row becomes a conflict. The screen keeps showing the local value."}),e(t,{language:"typescript",code:`account.ref.address.city.value = 'Busan';
await account.refetch(); // the server now says 'Gwangju'

const [change] = account.changes();
change.before;   // { exists: true, value: 'Gwangju' } — the new baseline
change.after;    // { exists: true, value: 'Busan' }   — the local value
change.conflict; // true
account.status.value.conflicts; // 1
account.ref.address.city.value;  // 'Busan'`}),e("p",{children:["Unlike a ",e("a",{href:"#/guide/draft-conflicts",children:"draft"}),", a query handle has"," ",e("strong",{children:"no"})," ",e("code",{children:"resolve()"}),". With what exists today there are three ways to settle it."]}),e("h3",{children:"Take the server value"}),e("p",{children:["Write the new baseline value (",e("code",{children:"change.before.value"}),") to that path. The local edit now equals the baseline and the row disappears."]}),e(t,{language:"typescript",code:`account.ref.address.city.value = change.before.value as string; // 'Gwangju'
account.isDirty();              // false
account.status.value.conflicts; // 0`}),e("h3",{children:"Keep your value"}),e("p",{children:["Writing your value again does not settle it - neither the same value nor a third one clears the conflict, because the server still does not know it. Keeping your value means ",e("strong",{children:"saving it"}),"."]}),e(t,{language:"typescript",code:`const submission = account.capture();
await save.run(
  { city: submission.value.address.city },
  { links: [{ query: account, submission, accept: { kind: 'submitted' } }] }
);
account.isDirty();              // false
account.status.value.conflicts; // 0
account.ref.address.city.value; // 'Busan'`}),e("p",{children:["Accepting with ",e("code",{children:"{ kind: 'refetch' }"})," settles it too; the value the server answers with then becomes the baseline."]}),e("h3",{children:"Let a person choose"}),e("p",{children:["To show both values side by side and let someone pick, render the"," ",e("code",{children:"before"})," and ",e("code",{children:"after"})," above and run one of the two paths depending on the choice. If a separate form is doing the editing, keeping that form in a draft is easier - you get the draft's"," ",e("code",{children:"resolve()"})," as is. See"," ",e("a",{href:"#/guide/sync-form",children:"Form Save Recipe"}),"."]}),e("p",{children:["If you already know a server value equal to the local one,"," ",e("code",{children:"acceptServer(value)"})," clears the row too. It sends nothing and only moves the baseline."]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/sync-mutation",children:"mutation and link"})," - result classification, retry, ",e("code",{children:"start()"})]}),e("li",{children:[e("a",{href:"#/guide/sync-query",children:"query and resource"})," - the change list and rebasing"]}),e("li",{children:[e("a",{href:"#/guide/sync-form",children:"Form Save Recipe"})," - the save flow with a draft"]}),e("li",{children:[e("a",{href:"#/guide/sync-persistence",children:"Persistence and SSR"})," - carrying a submission across a restart"]})]})]})),Ha=u(()=>()=>e("div",{children:[e("h1",{children:"편집의 생애: capture에서 수용까지"}),e("p",{children:["이 장은 편집 하나를 따라갑니다. 입력해서 dirty가 되고,"," ",e("code",{children:"capture()"}),"로 고정되고, mutation으로 나가고, 결과에 따라 지워지거나 남는 과정입니다. 다른 장에 흩어져 있던 규칙을 한 흐름으로 모았습니다."]}),e("h2",{children:"네 단어"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"단어"}),e("th",{children:"뜻"}),e("th",{children:"어디서 보나"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:"기준 (baseline)"}),e("td",{children:"서버가 마지막으로 확인해 준 값. READ나 수용이 옮긴다"}),e("td",{children:e("code",{children:"change.before"})})]}),e("tr",{children:[e("td",{children:"로컬 편집"}),e("td",{children:"기준 위에 올린, 아직 서버가 모르는 값. ref에 쓰면 생긴다"}),e("td",{children:[e("code",{children:"changes()"}),", ",e("code",{children:"status.dirty"})]})]}),e("tr",{children:[e("td",{children:"제출 (submission)"}),e("td",{children:['"이 WRITE는 이 편집들에 대한 것이다"라는 호출자의 진술.'," ",e("code",{children:"capture()"}),"가 만든다"]}),e("td",{children:e("code",{children:"link.submission"})})]}),e("tr",{children:[e("td",{children:"수용 (acceptance)"}),e("td",{children:"WRITE가 성공한 뒤 기준을 새 값으로 옮기는 것"}),e("td",{children:e("code",{children:"link.accept"})})]})]})]}),e("h2",{children:"한눈에 보기"}),e(t,{language:"bash",code:`ref에 쓴다 ─────────────► changes()에 줄이 생긴다 (dirty)
      │
      │ capture()           값 · 변경 줄 · 버전을 얼린다
      ▼
run(input, { links: [{ query, submission, accept }] })
      │
      │ 버전이 그대로인가? ── 아니오 ─► 'Submission is stale' (WRITE 없음)
      ▼
    WRITE
      ├─ 성공 ──────────► accept에 따라 기준을 옮긴다 ─► 제출한 줄이 지워진다
      ├─ rejected ──────► onReject: 'keep' 이면 남기고, 'remove' 면 되돌린다
      ├─ unknown ───────► 편집은 남고 unconfirmed. 다시 보내지 않는다
      └─ sync-error ────► WRITE는 성공, 수용이 실패. 편집은 남고 unconfirmed`}),e("h2",{children:"1. 편집"}),e("p",{children:"ref에 쓰면 편집한 경로마다 변경 줄이 하나 생기고, 쓸 때마다 resource 버전이 하나 오릅니다. 같은 값을 다시 대입하는 것은 쓰기가 아니라서 버전이 오르지 않습니다."}),e(t,{language:"typescript",code:`// 서버: { address: { city: '서울', zip: '100' }, name: 'Kim' }
await account.load();
account.version(); // 0

account.ref.address.city.value = '부산';
account.ref.name.value = 'Lee';
account.version(); // 2

account.changes();
// [
//   { id: 1, path: ['address', 'city'], before: { exists: true, value: '서울' },
//     after: { exists: true, value: '부산' }, conflict: false, ... },
//   { id: 2, path: ['name'], before: { exists: true, value: 'Kim' },
//     after: { exists: true, value: 'Lee' }, conflict: false, ... },
// ]`}),e("h2",{children:"2. capture가 왜 필요한가"}),e("p",{children:["mutation에 보내는 입력(DTO)은 조회 데이터와 모양이 다를 수 있습니다. 위 편집을 저장하는 API가 ",e("code",{children:"{ city: '부산' }"}),"만 받는다면, client는 그 DTO가 두 편집 중 어느 것을 저장했는지 알 방법이 없습니다. 이름으로 맞춰 볼 수도 없고, 필드가 합쳐지거나 나뉘는 API도 흔합니다."]}),e("p",{children:["그래서 호출자가 직접 말합니다. ",e("code",{children:"capture()"}),'가 만든 제출을 link에 넘기는 것이 "이 WRITE는 이 줄들에 대한 것이다"라는 진술입니다. client는 그 진술에 따라 성공하면 그 줄들만 지우고, 거절되면 그 줄들만 되돌릴 수 있습니다.']}),e("h2",{children:"3. capture가 얼리는 것"}),e(t,{language:"typescript",code:`const submission = account.capture();
submission.version; // 2 — 지금의 resource 버전
submission.value;   // { address: { city: '부산', zip: '100' }, name: 'Lee' } (얼린 복사본)
submission.changes; // 지금의 변경 줄 두 개 (얼린 복사본)`}),e("ul",{children:[e("li",{children:[e("code",{children:"value"}),"는 편집이 반영된 ",e("strong",{children:"현재 값 전체"}),"입니다. DTO를 만들 때 여기서 읽으면, 캡처 뒤에 누가 ref를 고쳐도 보낼 값이 흔들리지 않습니다."]}),e("li",{children:[e("code",{children:"changes"}),'는 제출하는 줄입니다. 인자가 없으면 전부, ID 배열을 주면 그 줄만 담습니다(아래 "부분 저장").']}),e("li",{children:[e("code",{children:"version"}),"은 낡음 판정에 씁니다(다음 절)."]}),e("li",{children:["편집이 없어도 capture는 성공합니다. ",e("code",{children:"changes"}),"가 빈 제출이 됩니다."]})]}),e("p",{children:"capture 자체가 거절하는 경우는 셋입니다."}),e(t,{language:"typescript",code:`account.capture([999]);   // TypeError: Unknown or repeated resource change ID.
account.capture([1, 1]);  // TypeError: Unknown or repeated resource change ID.
settings.capture();       // editable: false 조회 — TypeError: This query is readonly.`}),e("h2",{children:"4. 낡은 제출"}),e("p",{children:["캡처한 뒤 ",e("code",{children:"run"}),"하기 전에 버전이 움직이면 그 제출은 낡습니다. link는 WRITE를 보내기 ",e("strong",{children:"전에"})," 거절하고"," ",e("code",{children:"mutationFn"}),"은 호출되지 않습니다."]}),e(t,{language:"typescript",code:`const submission = account.capture();
account.ref.address.zip.value = '200'; // 제출과 무관한 필드라도

save.start(input, { links: [{ query: account, submission, accept: { kind: 'submitted' } }] });
// 동기로 던진다: Error: Submission is stale. Capture the current edits again.

await save.run(input, { links: [{ query: account, submission, accept: { kind: 'submitted' } }] });
// 같은 메시지로 reject한다`}),e("ul",{children:[e("li",{children:[e("strong",{children:"어느 필드든"})," 편집하면 낡습니다. 판정은 경로가 아니라 버전으로 합니다."]}),e("li",{children:["READ가 끝나도 낡습니다. ",e("code",{children:"refetch()"}),"가 기준을 옮기면 버전이 오릅니다."]}),e("li",{children:"같은 값을 다시 대입하는 것은 낡게 하지 않습니다."})]}),e("p",{children:["그래서 capture는 ",e("strong",{children:"보내기 직전에, 같은 동기 흐름에서"})," ","합니다. 저장 버튼의 핸들러에서 capture하고 바로 ",e("code",{children:"run"}),"을 부르면 됩니다. 사용자가 확인 대화상자를 보는 동안처럼 사이에 await가 끼면, 그 뒤에 다시 capture하세요."]}),e("h2",{children:"5. 쓰는 동안"}),e("p",{children:[e("code",{children:"run"}),"이 시작하면 그 조회의 ",e("code",{children:"status.pending"}),"이 1이 되고, 결과가 나올 때까지 이 조회에는 다음이 적용됩니다."]}),e("ul",{children:[e("li",{children:[e("strong",{children:"입력은 계속 받습니다."})," 쓰는 중에 한 편집은 제출과 별개로 남고, 결과가 어떻든 살아남습니다."]}),e("li",{children:["두 번째 연결 쓰기는 큐에 쌓이지 않고 거절됩니다:"," ",e("code",{children:"A linked operation is already pending for this query."})]}),e("li",{children:[e("code",{children:"acceptServer()"}),"도 거절됩니다:"," ",e("code",{children:"A linked operation is pending for this query."})]}),e("li",{children:"focus·reconnect·polling 같은 자동 READ가 멈춥니다. 아직 답하지 않은 작업이 기준을 정하는 중이기 때문입니다."})]}),e(t,{language:"typescript",code:`account.ref.address.city.value = '부산';
const submission = account.capture();
const pending = save.run({ city: '부산' }, {
  links: [{ query: account, submission, accept: { kind: 'submitted' } }],
});

account.ref.address.zip.value = '999'; // 쓰는 중의 입력

await pending; // { kind: 'success', ... }
account.ref.value;  // { address: { city: '부산', zip: '999' }, ... }
account.changes();  // zip 한 줄만 남는다 (before: '100')`}),e("h2",{children:"6. 결과마다 편집에 일어나는 일"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"결과"}),e("th",{children:"기준"}),e("th",{children:"제출한 편집"}),e("th",{children:e("code",{children:"unconfirmed"})})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:[e("code",{children:"success"})," + ",e("code",{children:"{ kind: 'submitted' }"})]}),e("td",{children:"제출한 값으로 옮긴다"}),e("td",{children:"지워진다"}),e("td",{children:"false"})]}),e("tr",{children:[e("td",{children:[e("code",{children:"success"})," + ",e("code",{children:"{ kind: 'response' }"})]}),e("td",{children:[e("code",{children:"select(응답)"}),"으로 옮긴다"]}),e("td",{children:["지워진다. 서버가 값을 고쳐 보냈으면(",e("code",{children:"lee"})," →"," ",e("code",{children:"LEE"}),") 고친 값이 보인다"]}),e("td",{children:"false"})]}),e("tr",{children:[e("td",{children:[e("code",{children:"success"})," + ",e("code",{children:"{ kind: 'refetch' }"})]}),e("td",{children:"다시 읽은 값으로 옮긴다"}),e("td",{children:"지워진다"}),e("td",{children:"false"})]}),e("tr",{children:[e("td",{children:[e("code",{children:"success"})," + ",e("code",{children:"{ kind: 'none' }"})," (생략 시 기본)"]}),e("td",{children:"그대로"}),e("td",{children:[e("strong",{children:"남는다"})," (dirty 유지)"]}),e("td",{children:"true — 다음 성공한 READ까지"})]}),e("tr",{children:[e("td",{children:[e("code",{children:"rejected"})," + ",e("code",{children:"onReject: 'keep'"})," (기본)"]}),e("td",{children:"그대로"}),e("td",{children:"남는다"}),e("td",{children:"false"})]}),e("tr",{children:[e("td",{children:[e("code",{children:"rejected"})," + ",e("code",{children:"onReject: 'remove'"})]}),e("td",{children:"그대로"}),e("td",{children:"쓰는 중에 다시 고치지 않은 줄만 기준 값으로 되돌린다"}),e("td",{children:"false"})]}),e("tr",{children:[e("td",{children:e("code",{children:"unknown"})}),e("td",{children:"그대로"}),e("td",{children:"남는다. 다시 보내지 않는다"}),e("td",{children:"true"})]}),e("tr",{children:[e("td",{children:e("code",{children:"sync-error"})}),e("td",{children:"그대로. 여러 link 중 이미 수용한 link는 되돌리지 않는다"}),e("td",{children:"남는다"}),e("td",{children:"true"})]})]})]}),e("p",{children:["어느 행이든 ",e("strong",{children:"쓰는 중에 입력한 편집은 남습니다."})," 성공으로 지워지는 것은 제출에 들어 있던 줄뿐이고, 그 뒤의 입력은 새 기준 위의 편집으로 이어집니다."]}),e("p",{children:"제출 없이 만들 수 있는 link도 있지만, 제출이 있어야만 뜻이 서는 조합은 거절합니다."}),e(t,{language:"typescript",code:`{ query, accept: { kind: 'submitted' } } // TypeError: Submitted acceptance requires a submission.
{ query, onReject: 'remove' }             // TypeError: Removing rejected edits requires a submission.
{ query: account, submission: other.capture() } // TypeError: Submission belongs to another resource.`}),e("p",{children:[e("code",{children:"rejected"}),"와 ",e("code",{children:"unknown"}),"이 어떻게 갈리는지(",e("code",{children:"MutationRejectedError"}),")와 재시도 규칙은"," ",e("a",{href:"#/ko/guide/sync-mutation",children:"mutation과 link"}),"에 있습니다."]}),e("h2",{children:"7. 부분 저장"}),e("p",{children:["편집한 것 중 일부만 저장하는 화면이면 변경 줄의 ",e("code",{children:"id"}),"를 골라 capture합니다. 저장하지 않은 줄은 dirty로 남습니다."]}),e(t,{language:"typescript",code:`account.ref.address.city.value = '부산';
account.ref.address.zip.value = '200';

const cityId = account
  .changes()
  .find(change => change.path.join('.') === 'address.city')!.id;
const submission = account.capture([cityId]);

submission.changes.map(change => change.path); // [['address', 'city']]
submission.value.address.zip;                  // '200' — value는 여전히 전체다

await saveCity.run(
  { city: submission.value.address.city },
  { links: [{ query: account, submission, accept: { kind: 'submitted' } }] }
);
account.changes(); // zip 한 줄만 남는다`}),e("p",{children:[e("code",{children:"value"}),"는 고른 줄과 상관없이 전체 값입니다. DTO에 넣는 필드와 고른 줄을 맞추는 것은 호출자의 몫입니다 — 제출하지 않은 변경을 제출했다고 말하면 기준이 틀어지고, 그것을 잡아 줄 장치는 없습니다."]}),e("h2",{children:"8. 조회에서 난 충돌 풀기"}),e("p",{children:"편집이 남아 있는 경로에 READ가 다른 값을 들고 오면 그 줄은 충돌이 됩니다. 화면은 여전히 로컬 값을 보여 줍니다."}),e(t,{language:"typescript",code:`account.ref.address.city.value = '부산';
await account.refetch(); // 서버는 이제 '광주'

const [change] = account.changes();
change.before;  // { exists: true, value: '광주' } — 새 기준
change.after;   // { exists: true, value: '부산' } — 로컬 값
change.conflict; // true
account.status.value.conflicts; // 1
account.ref.address.city.value;  // '부산'`}),e("p",{children:[e("a",{href:"#/ko/guide/draft-conflicts",children:"draft"}),"와 달리 조회 핸들에는"," ",e("code",{children:"resolve()"}),"가 ",e("strong",{children:"없습니다."})," 지금 있는 수단으로 푸는 방법은 셋입니다."]}),e("h3",{children:"서버 값을 받는다"}),e("p",{children:["그 경로에 새 기준 값(",e("code",{children:"change.before.value"}),")을 쓰면 로컬 편집이 기준과 같아져 줄이 사라집니다."]}),e(t,{language:"typescript",code:`account.ref.address.city.value = change.before.value as string; // '광주'
account.isDirty();              // false
account.status.value.conflicts; // 0`}),e("h3",{children:"내 값을 지킨다"}),e("p",{children:["로컬 값을 다시 쓰는 것으로는 풀리지 않습니다. 같은 값을 써도, 세 번째 값을 써도 충돌은 그대로입니다 — 서버가 아직 모르는 값이기 때문입니다. 내 값을 지키는 방법은 그것을 ",e("strong",{children:"저장하는 것"}),"입니다."]}),e(t,{language:"typescript",code:`const submission = account.capture();
await save.run(
  { city: submission.value.address.city },
  { links: [{ query: account, submission, accept: { kind: 'submitted' } }] }
);
account.isDirty();              // false
account.status.value.conflicts; // 0
account.ref.address.city.value; // '부산'`}),e("p",{children:[e("code",{children:"{ kind: 'refetch' }"}),"로 수용해도 충돌은 풀립니다. 그때는 서버가 다시 답한 값이 기준이 됩니다."]}),e("h3",{children:"사람이 고르게 한다"}),e("p",{children:["두 값을 나란히 보여 주고 고르게 하려면, 위의 ",e("code",{children:"before"}),"와"," ",e("code",{children:"after"}),"를 그대로 그리고 고른 쪽에 따라 앞의 두 방법 중 하나를 실행하면 됩니다. 편집 중인 폼이 따로 있다면 그 폼을 draft로 두는 편이 편합니다 — draft의 ",e("code",{children:"resolve()"}),"를 그대로 쓸 수 있습니다."," ",e("a",{href:"#/ko/guide/sync-form",children:"폼 저장 레시피"}),"를 보세요."]}),e("p",{children:["이미 알고 있는 서버 값이 로컬 값과 같다면"," ",e("code",{children:"acceptServer(value)"}),"도 줄을 지웁니다. 아무것도 보내지 않고 기준만 옮깁니다."]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/sync-mutation",children:"mutation과 link"})," - 결과 분류, 재시도, ",e("code",{children:"start()"})]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-query",children:"query와 resource"})," - 변경 목록과 rebase"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-form",children:"폼 저장 레시피"})," - draft와 함께 쓰는 저장 흐름"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-persistence",children:"영속화와 SSR"})," - 제출을 재시작 너머로 가져가기"]})]})]})),Ga=u(()=>()=>e("div",{children:[e("h1",{children:"display and reactive keys"}),e("p",{children:["A display is ",e("strong",{children:"state that belongs to one observer"}),". A placeholder, a selection, a comparison - none of them belong in the shared cache, because two screens looking at one key may want to show it differently."]}),e("p",{children:["It is not a separate object you open. ",e("code",{children:"select"}),","," ",e("code",{children:"placeholderData"})," and ",e("code",{children:"equals"})," are options on the query, and what they produce is the handle's ",e("code",{children:"display"}),"."]}),e("h2",{children:"display"}),e(t,{language:"typescript",code:`const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
  placeholderData: previewAccount,
  select: account => account.address.city,
});

account.display.data.value;              // this observer's placeholder, or its selected value
await account.load();                    // an explicit READ
account.ref.address.city.value = 'Busan'; // edits the shared resource
account.dispose();`}),e("p",{children:["One handle holds both: ",e("code",{children:"ref"})," is the resource you edit, and"," ",e("code",{children:"display"})," is what you render. Editing never goes through the display - a display can be a selected string, or a placeholder that was never on the server, and neither is something you can write back."]}),e("h3",{children:"One vocabulary"}),e("p",{children:[e("code",{children:"display"})," and ",e("code",{children:"watchDisplay"})," are"," ",e("strong",{children:"readonly"}),", and the state is the query status plus five fields. The status fields keep their names, so you do not learn them twice:"]}),e(t,{language:"typescript",code:`account.display.data.value;          // the selected value, or undefined
account.display.isPlaceholder.value; // showing placeholderData
account.display.errorSource.value;   // 'query' | 'select' | 'source' | null
account.display.queryKey.value;      // ['account', 1]
account.display.enabled.value;       // false only while a reactive key resolves to nothing

account.display.status.value;        // 'pending' | 'success' | 'error'
account.display.fetchStatus.value;   // same field as account.status.fetchStatus
account.display.dirty.value;         // ...and so on, for every status field`}),e("p",{children:["There is no ",e("code",{children:"phase"}),". It used to be ",e("code",{children:"status"})," with"," ",e("code",{children:"'placeholder'"})," added, and ",e("code",{children:"isPlaceholder"})," already carries that fact. If you want the old four words back, derive them:"]}),e(t,{language:"typescript",code:`const phase = account.display.isPlaceholder.value
  ? 'placeholder'
  : account.display.status.value;`}),e("p",{children:[e("code",{children:"display"})," is built the first time you touch it. A consumer that only edits the resource never pays for one."]}),e("h3",{children:"Placeholder and select"}),e("ul",{children:[e("li",{children:["A placeholder is observer-local. It never enters"," ",e("code",{children:"dehydrate()"})," or the editable resource, and it disappears after a first READ error."]}),e("li",{children:"A refetch error keeps previously loaded data rather than dropping to the placeholder."}),e("li",{children:[e("code",{children:"select"})," sees current local edits, but its result never replaces the cached query shape."]}),e("li",{children:["An optional ",e("code",{children:"equals"})," compares selected values (default"," ",e("code",{children:"Object.is"}),"). A select or comparison error affects that observer alone, not the shared query. When ",e("code",{children:"equals"})," answers true the previous selected value is kept, so nothing watching"," ",e("code",{children:"data"})," is woken."]})]}),e("p",{children:["A fixed key does ",e("strong",{children:"not"})," start a READ on its own."]}),e("h2",{children:"A reactive key"}),e("p",{children:["For a key that changes - a selected id, a page number, a dependent query - give ",e("code",{children:"query"})," a ",e("code",{children:"state-ref"})," source instead of a key."]}),e(t,{language:"typescript",code:`import { create } from 'state-ref';

const input = create({ accountId: null as number | null, enabled: false });

const live = client.query({
  source: input.watch,
  resolve: ({ accountId, enabled }) =>
    accountId === null
      ? null
      : {
          queryKey: ['account', accountId],
          queryFn: ({ signal }) => api.readAccount(accountId, { signal }),
          enabled,
        },
  select: account => account.address.city,
});

input.updateRef.accountId.value = 1;
input.updateRef.enabled.value = true; // starts a READ automatically

live.display.data.value;     // the selected current key only
live.display.queryKey.value; // ['account', 1]
live.display.enabled.value;

// after the baseline loads
live.ref.address.city.value = 'Busan';

live.dispose();`}),e("p",{children:["Returning ",e("code",{children:"null"}),", or ",e("code",{children:"enabled: false"}),", clears the display and releases the current query. ",e("code",{children:"display"})," is one stable observation point for the handle's whole life, and it reports"," ",e("code",{children:"enabled"})," and ",e("code",{children:"queryKey"})," even while there is no active key."]}),e("p",{children:["In that state ",e("code",{children:"ref"}),", ",e("code",{children:"watch"}),", ",e("code",{children:"status"})," ","and the operations throw ",e("code",{children:"This query has no active key."})," - so check ",e("code",{children:"display.enabled"})," before reaching for the resource."]}),e("h3",{children:"What happens on a key switch"}),e("ul",{children:[e("li",{children:"The query underneath is disposed; a ref you captured from the previous key refuses every access afterwards."}),e("li",{children:["An ",e("strong",{children:"unowned"})," in-flight READ is aborted and cannot install a late result."]}),e("li",{children:["If ",e("strong",{children:"another owner holds the same key"}),", its shared READ keeps running and its result lands in that owner's display - not in yours."]}),e("li",{children:"Each source update reconnects with the new options, including when the key is unchanged."})]}),e("p",{children:"That third point is the one worth remembering: whether the old READ is cancelled depends on whether anyone else was still watching that key."}),e("h2",{children:"Connectors"}),e("p",{children:"Every connector has a readonly display binding, so a display never hands out setters:"}),e(t,{language:"typescript",code:`import { connectReactView } from '@stateref/connect-react';

const useLive = connectReactView(live.watchDisplay);

function CityDisplay() {
  const state = useLive();
  return <span>{state.data.value ?? '-'}</span>;
}`}),e("p",{children:["The same exists as ",e("code",{children:"connectPreactView"}),","," ",e("code",{children:"connectVueView"}),", ",e("code",{children:"connectSvelteView"})," and"," ",e("code",{children:"connectSolidView"}),"."]}),e("p",{children:[e("strong",{children:"A connector unmount ends that component's subscription and nothing else."})," ","The handle is released by whoever owns it, by calling"," ",e("code",{children:"live.dispose()"}),". Two components can watch one display and closing one screen does not take the other's data away."]}),e("h2",{children:"Pagination"}),e("p",{children:["For numbered pages, put the page in the key your source resolves to. Each page then has its own cache entry. A ",e("code",{children:"placeholderData"})," ","value is only a preview for the new key; it never becomes that page's server baseline. Prepare a page with ",e("code",{children:"prefetch"}),","," ",e("code",{children:"fetch"})," or ",e("code",{children:"ensure"})," on the same key."]}),e("p",{children:["For an accumulating list, use ",e("code",{children:"client.infiniteQuery"})," - see"," ",e("a",{href:"#/guide/sync-infinite",children:"Infinite Queries"}),". It takes the same display options, its pages are readonly, and it takes a"," ",e("strong",{children:"fixed key only"}),": a reactive key has no infinite equivalent."]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/sync-query",children:"query and resource"})," - the shared baseline a display shows"]}),e("li",{children:[e("a",{href:"#/guide/sync-refetch",children:"Automatic refetch"})," - an active reactive key performs the first load"]}),e("li",{children:[e("a",{href:"#/guide/custom-connector",children:"Custom Connector"})," - the"," ",e("code",{children:"Watch"})," shape a display binding needs"]})]})]})),Qa=u(()=>()=>e("div",{children:[e("h1",{children:"Form Save Recipe"}),e("p",{children:["This page walks through editing server data in a form and saving it, start to finish. It assembles the parts from earlier pages - a query, a"," ",e("a",{href:"#/guide/draft",children:"draft"}),", and"," ",e("a",{href:"#/guide/sync-lifecycle",children:"capture and acceptance"})," - into one screen."]}),e("h2",{children:"First Choice: Use a Draft or Not"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{}),e("th",{children:"Edit the query ref directly"}),e("th",{children:"A draft on the query"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:"Where input shows"}),e("td",{children:"Immediately, on every screen watching the key"}),e("td",{children:["Only inside this form until ",e("code",{children:"apply()"})]})]}),e("tr",{children:[e("td",{children:"Cancel"}),e("td",{children:"Write the server value back field by field"}),e("td",{children:["One ",e("code",{children:"reset()"})]})]}),e("tr",{children:[e("td",{children:"Settling conflicts"}),e("td",{children:["No ",e("code",{children:"resolve()"})," - use section 8 of"," ",e("a",{href:"#/guide/sync-lifecycle",children:"Edit Lifecycle"})]}),e("td",{children:["The draft's ",e("code",{children:"resolve()"})]})]}),e("tr",{children:[e("td",{children:"Partial save"}),e("td",{children:["Per field, with ",e("code",{children:"capture(ids)"})]}),e("td",{children:["One draft becomes ",e("strong",{children:"one row"})," on the query (below)"]})]})]})]}),e("p",{children:["If the form is the only place that edits the data and it is fine for input to show elsewhere right away, editing the ref directly is simpler - the examples in ",e("a",{href:"#/guide/sync-lifecycle",children:"Edit Lifecycle"})," do that. This page covers the other kind: a form that changes nothing until Save is pressed, which means a draft."]}),e("h2",{children:"1. Open"}),e(t,{language:"typescript",code:`import { createSyncClient } from '@stateref/sync';
import { createDraft } from 'state-ref/draft';

const client = createSyncClient();
const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
});
await account.load();

// open it on the narrowest subtree the form edits
const form = createDraft(account.ref.address);`}),e("h3",{children:"Open the Draft Narrow"}),e("p",{children:[e("code",{children:"apply()"})," writes the draft root in one assignment, so the query records it as ",e("strong",{children:"one row"})," at the path the draft was opened on. Opened on ",e("code",{children:"account.ref.address"})," as above, the row path is ",e("code",{children:"['address']"}),"; opened on the query root (",e("code",{children:"account.ref"}),"), it is ",e("code",{children:"[]"}),"."]}),e("p",{children:["Apply a root draft and, before you save, a server change to"," ",e("strong",{children:"a field the form never touched"})," becomes a conflict - the root row covers every field."]}),e(t,{language:"typescript",code:`const form = createDraft(account.ref); // the root
form.ref.address.city.value = 'Busan';
form.apply();

// the server changed only name, 'Kim' -> 'Choi'
await account.refetch();
account.changes(); // [{ path: [], conflict: true, ... }]
account.ref.name.value; // 'Kim' — the new name does not show`}),e("p",{children:["Opened on ",e("code",{children:"address"}),", the same situation leaves a"," ",e("code",{children:"['address']"})," row with no conflict, and ",e("code",{children:"name"})," ","updates to ",e("code",{children:"'Choi'"}),". If the form edits several subtrees, one draft per subtree is an option."]}),e("h2",{children:"2. Bind the Inputs"}),e(t,{language:"typescript",code:`import { connectReact } from '@stateref/connect-react';

const useForm = connectReact(form.watch);
const useFormStatus = connectReact(form.watchStatus);
const useAccountStatus = connectReact(account.watchStatus);

function AddressForm() {
  const address = useForm();
  const status = useFormStatus();
  const saving = useAccountStatus().pending.value > 0;
  return (
    <>
      <input
        value={address.city.value}
        onChange={event => (address.city.value = event.target.value)}
      />
      <button disabled={!status.dirty.value || saving} onClick={save}>
        Save
      </button>
      <button onClick={() => form.reset()}>Cancel</button>
      {saving && <span>Saving…</span>}
    </>
  );
}`}),e("p",{children:["The Save button is on only while the draft is dirty and no save is in flight. Whether a save is in flight lives on the ",e("strong",{children:"query"}),"'s ",e("code",{children:"status.pending"}),", not on the draft - the write is linked to the query (",e("a",{href:"#/guide/sync-mutation",children:"Showing That a Save Is in Progress"}),")."]}),e("p",{children:["Input goes only to the draft, so other screens showing the same account do not change before the save. Cancel is one ",e("code",{children:"reset()"}),", and the form stays open."]}),e("h2",{children:"3. Save"}),e(t,{language:"typescript",code:`const saveAddress = client.mutation({
  mutationFn: (input: { address: Address }, { signal }) =>
    api.saveAddress(input, { signal }),
});

async function save() {
  // (1) draft -> query. Stops here on a conflict
  const applied = form.apply();
  if (!applied.ok) return applied; // { ok: false, reason: 'conflict' } and so on

  // (2) freeze the query's edits and send right away — no await in between
  const submission = account.capture();
  return saveAddress.run(
    { address: submission.value.address },
    { links: [{ query: account, submission, accept: { kind: 'refetch' } }] }
  );
}`}),e("ul",{children:[e("li",{children:["With no await between ",e("code",{children:"apply()"})," and ",e("code",{children:"capture()"}),", the submission has no chance to go stale (",e("a",{href:"#/guide/sync-lifecycle",children:"Stale Submissions"}),")."]}),e("li",{children:["Build the DTO from ",e("code",{children:"submission.value"}),". The query recorded one ",e("code",{children:"['address']"})," row, so sending the whole"," ",e("code",{children:"address"})," is the honest match for that row."]}),e("li",{children:[e("code",{children:"{ kind: 'refetch' }"})," re-reads the server after the write and takes that as the new baseline - the safe choice when the API normalizes values."]})]}),e("p",{children:"On success both the query and the draft are clean, and the form shows the saved value."}),e(t,{language:"typescript",code:`const result = await save(); // { kind: 'success', ... }
account.isDirty();      // false
form.isDirty();         // false
form.ref.city.value;    // 'Busan'`}),e("h2",{children:"4. When the Server Moved Before the Save"}),e("p",{children:["If a READ changes the same field while the form is open, the draft row becomes a conflict and ",e("code",{children:"apply()"})," stops. Show the three values and let the person choose."]}),e(t,{language:"typescript",code:`form.ref.city.value = 'Busan';
await account.refetch(); // the server now says 'Gwangju'

form.changes();
// [{ path: ['city'], before: 'Seoul', after: 'Busan', source: 'Gwangju', conflict: true, ... }]
form.apply(); // { ok: false, reason: 'conflict' }

// the person chose "keep mine"
form.resolve(form.changes()[0], 'draft'); // { ok: true }
form.apply();                             // { ok: true, applied: 1 }
// then capture + run`}),e("p",{children:['For "take the server value", resolve with'," ",e("code",{children:"'source'"}),": the edit goes away and the form shows"," ",e("code",{children:"'Gwangju'"}),". Resolving invalidates the rows you were holding, so read ",e("code",{children:"changes()"})," again each time (",e("a",{href:"#/guide/draft-conflicts",children:"Conflicts"}),")."]}),e("h2",{children:"5. Handling the Result"}),e(t,{language:"typescript",code:`const result = await save();
if ('ok' in result) {
  // apply stopped — section 4
} else {
  switch (result.kind) {
    case 'success':
      break;
    case 'rejected':
      // the server refused (MutationRejectedError); the edits stay on the query
      showError(result.error);
      break;
    case 'unknown':
    case 'sync-error':
      // unknown: it may or may not have applied / sync-error: it applied, acceptance failed
      // either way, do not resend — read again to reconcile
      await account.refetch();
      break;
  }
}`}),e("ul",{children:[e("li",{children:[e("code",{children:"rejected"}),": omitting ",e("code",{children:"onReject"})," means"," ",e("code",{children:"'keep'"}),", so the input is not lost; the person can fix it and save again."]}),e("li",{children:[e("code",{children:"unknown"})," and ",e("code",{children:"sync-error"}),": the edits stay and"," ",e("code",{children:"status.unconfirmed"})," is true until a successful READ. Nothing is resent automatically."]})]}),e("h2",{children:"6. Close"}),e("p",{children:["A draft subscribes to its source, so release it with"," ",e("code",{children:"discard()"})," when the form closes. Whoever opened the query handle calls ",e("code",{children:"dispose()"}),"."]}),e(t,{language:"typescript",code:`useEffect(() => () => {
  form.discard();
  account.dispose();
}, []);`}),e("h2",{children:"Not on a Readonly Query"}),e("p",{children:["You can open and edit a draft on a query opened with"," ",e("code",{children:"editable: false"}),", but ",e("code",{children:"apply()"})," answers"," ",e("code",{children:"{ ok: false, reason: 'readonly' }"}),". For a form that saves, open the query as editable."]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/sync-lifecycle",children:"Edit Lifecycle"})," - capture, staleness, what each result does"]}),e("li",{children:e("a",{href:"#/guide/draft-apply",children:"apply, reset, discard"})}),e("li",{children:e("a",{href:"#/guide/draft-conflicts",children:"Conflicts"})}),e("li",{children:[e("a",{href:"#/guide/react",children:"React"})," - the other connectors have the same shape"]})]})]})),Ya=u(()=>()=>e("div",{children:[e("h1",{children:"폼 저장 레시피"}),e("p",{children:["서버 데이터를 폼으로 고치고 저장하는 흐름을 처음부터 끝까지 보여 줍니다. 앞 장들의 부품 — 조회, ",e("a",{href:"#/ko/guide/draft",children:"draft"}),","," ",e("a",{href:"#/ko/guide/sync-lifecycle",children:"capture와 수용"})," — 을 한 화면에 조립한 것입니다."]}),e("h2",{children:"먼저 고를 것: draft를 쓸 것인가"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{}),e("th",{children:"조회 ref를 직접 편집"}),e("th",{children:"조회 위에 draft"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:"입력이 보이는 곳"}),e("td",{children:"같은 key를 보는 모든 화면에 즉시"}),e("td",{children:[e("code",{children:"apply()"})," 전까지 이 폼 안에서만"]})]}),e("tr",{children:[e("td",{children:"취소"}),e("td",{children:"필드마다 서버 값을 다시 써야 한다"}),e("td",{children:[e("code",{children:"reset()"})," 한 번"]})]}),e("tr",{children:[e("td",{children:"충돌 해소"}),e("td",{children:[e("code",{children:"resolve()"})," 없음 —"," ",e("a",{href:"#/ko/guide/sync-lifecycle",children:"편집의 생애"})," 8절의 방법"]}),e("td",{children:["draft의 ",e("code",{children:"resolve()"})]})]}),e("tr",{children:[e("td",{children:"부분 저장"}),e("td",{children:["필드 단위 ",e("code",{children:"capture(ids)"})]}),e("td",{children:["draft 하나가 조회에 ",e("strong",{children:"한 줄"}),"로 들어간다(아래)"]})]})]})]}),e("p",{children:["폼이 그 데이터를 고치는 유일한 곳이고 입력이 바로 다른 화면에 보여도 괜찮다면 ref를 직접 편집하는 쪽이 단순합니다 —"," ",e("a",{href:"#/ko/guide/sync-lifecycle",children:"편집의 생애"}),'의 예제가 그 방식입니다. 이 장은 "저장을 누르기 전에는 아무 데도 반영하지 않는" 폼, 즉 draft를 쓰는 쪽을 다룹니다.']}),e("h2",{children:"1. 열기"}),e(t,{language:"typescript",code:`import { createSyncClient } from '@stateref/sync';
import { createDraft } from 'state-ref/draft';

const client = createSyncClient();
const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
});
await account.load();

// 폼이 고치는 가장 좁은 하위 트리에 연다
const form = createDraft(account.ref.address);`}),e("h3",{children:"draft는 좁게 연다"}),e("p",{children:[e("code",{children:"apply()"}),"는 draft 루트에 값을 한 번에 씁니다. 그래서 조회 쪽에는 draft를 연 경로의 편집 ",e("strong",{children:"한 줄"}),"로 기록됩니다. 위처럼 ",e("code",{children:"account.ref.address"}),"에 열면 줄의 경로는"," ",e("code",{children:"['address']"}),"이고, 조회 루트(",e("code",{children:"account.ref"}),")에 열면"," ",e("code",{children:"[]"}),"입니다."]}),e("p",{children:["루트에 연 draft를 적용해 두면, 저장하기 전에 서버가"," ",e("strong",{children:"폼과 무관한 필드"}),"를 바꿔도 충돌이 됩니다. 루트 줄이 모든 필드를 덮고 있기 때문입니다."]}),e(t,{language:"typescript",code:`const form = createDraft(account.ref); // 루트
form.ref.address.city.value = '부산';
form.apply();

// 서버가 name만 'Kim' -> 'Choi'로 바꿨다
await account.refetch();
account.changes(); // [{ path: [], conflict: true, ... }]
account.ref.name.value; // 'Kim' — 새 이름이 보이지 않는다`}),e("p",{children:[e("code",{children:"address"}),"에 열었다면 같은 상황에서 줄은"," ",e("code",{children:"['address']"}),"이고 충돌이 아니며, ",e("code",{children:"name"}),"은"," ",e("code",{children:"'Choi'"}),"로 갱신됩니다. 폼이 여러 하위 트리를 고친다면 트리마다 draft를 하나씩 여는 것도 방법입니다."]}),e("h2",{children:"2. 입력에 연결하기"}),e(t,{language:"typescript",code:`import { connectReact } from '@stateref/connect-react';

const useForm = connectReact(form.watch);
const useFormStatus = connectReact(form.watchStatus);
const useAccountStatus = connectReact(account.watchStatus);

function AddressForm() {
  const address = useForm();
  const status = useFormStatus();
  const saving = useAccountStatus().pending.value > 0;
  return (
    <>
      <input
        value={address.city.value}
        onChange={event => (address.city.value = event.target.value)}
      />
      <button disabled={!status.dirty.value || saving} onClick={save}>
        저장
      </button>
      <button onClick={() => form.reset()}>취소</button>
      {saving && <span>저장 중…</span>}
    </>
  );
}`}),e("p",{children:["저장 버튼은 draft가 dirty이고 저장이 진행 중이 아닐 때만 켭니다. 저장 중인지는 draft가 아니라 ",e("strong",{children:"조회"}),"의"," ",e("code",{children:"status.pending"}),"에 있습니다 — 쓰기는 조회에 연결되기 때문입니다(",e("a",{href:"#/ko/guide/sync-mutation",children:"저장 중 표시하기"}),")."]}),e("p",{children:["입력은 draft에만 쓰이므로 같은 계정을 보여 주는 다른 화면은 저장 전까지 바뀌지 않습니다. 취소는 ",e("code",{children:"reset()"})," 한 번이고 폼은 열린 채로 남습니다."]}),e("h2",{children:"3. 저장하기"}),e(t,{language:"typescript",code:`const saveAddress = client.mutation({
  mutationFn: (input: { address: Address }, { signal }) =>
    api.saveAddress(input, { signal }),
});

async function save() {
  // (1) draft -> 조회. 충돌이 있으면 여기서 멈춘다
  const applied = form.apply();
  if (!applied.ok) return applied; // { ok: false, reason: 'conflict' } 등

  // (2) 조회의 편집을 고정하고 곧바로 보낸다 — 사이에 await가 없다
  const submission = account.capture();
  return saveAddress.run(
    { address: submission.value.address },
    { links: [{ query: account, submission, accept: { kind: 'refetch' } }] }
  );
}`}),e("ul",{children:[e("li",{children:[e("code",{children:"apply()"}),"와 ",e("code",{children:"capture()"})," 사이에 await가 없으므로 제출이 낡을 틈이 없습니다(",e("a",{href:"#/ko/guide/sync-lifecycle",children:"낡은 제출"}),")."]}),e("li",{children:["DTO는 ",e("code",{children:"submission.value"}),"에서 만듭니다. 조회에 기록된 줄이"," ",e("code",{children:"['address']"}),"이므로 ",e("code",{children:"address"})," 전체를 보내는 것이 그 줄과 정직하게 맞습니다."]}),e("li",{children:[e("code",{children:"{ kind: 'refetch' }"}),"는 쓰기 뒤 서버를 다시 읽어 새 기준으로 삼습니다. 서버가 값을 정규화하는 API라면 이쪽이 안전합니다."]})]}),e("p",{children:"성공하면 조회와 draft가 모두 깨끗해지고, 폼은 저장된 값을 보여 줍니다."}),e(t,{language:"typescript",code:`const result = await save(); // { kind: 'success', ... }
account.isDirty();      // false
form.isDirty();         // false
form.ref.city.value;    // '부산'`}),e("h2",{children:"4. 저장 전에 서버가 움직였다면"}),e("p",{children:["폼이 열려 있는 동안 READ가 같은 필드를 바꿔 오면 draft의 줄이 충돌이 되고 ",e("code",{children:"apply()"}),"가 멈춥니다. 세 값을 그대로 보여 주고 고르게 하면 됩니다."]}),e(t,{language:"typescript",code:`form.ref.city.value = '부산';
await account.refetch(); // 서버는 이제 '광주'

form.changes();
// [{ path: ['city'], before: '서울', after: '부산', source: '광주', conflict: true, ... }]
form.apply(); // { ok: false, reason: 'conflict' }

// 사용자가 '내 값 유지'를 골랐다
form.resolve(form.changes()[0], 'draft'); // { ok: true }
form.apply();                             // { ok: true, applied: 1 }
// 이어서 capture + run`}),e("p",{children:['"서버 값 받기"를 골랐다면 ',e("code",{children:"'source'"}),"로 해소합니다. 그 편집은 사라지고 폼은 ",e("code",{children:"'광주'"}),"를 보여 줍니다. 해소는 들고 있던 줄을 무효로 만들므로 매번 ",e("code",{children:"changes()"}),"를 다시 읽으세요(",e("a",{href:"#/ko/guide/draft-conflicts",children:"충돌과 해소"}),")."]}),e("h2",{children:"5. 결과 처리"}),e(t,{language:"typescript",code:`const result = await save();
if ('ok' in result) {
  // apply가 멈췄다 — 4절
} else {
  switch (result.kind) {
    case 'success':
      break;
    case 'rejected':
      // 서버가 거절했다(MutationRejectedError). 편집은 조회에 남아 있다
      showError(result.error);
      break;
    case 'unknown':
    case 'sync-error':
      // unknown: 적용됐는지 모른다 / sync-error: 적용됐지만 수용이 실패했다
      // 어느 쪽이든 다시 보내지 말고 다시 읽어 화해한다
      await account.refetch();
      break;
  }
}`}),e("ul",{children:[e("li",{children:[e("code",{children:"rejected"}),": ",e("code",{children:"onReject"}),"를 생략하면"," ",e("code",{children:"'keep'"}),"이라 입력이 사라지지 않습니다. 사용자가 고쳐 다시 저장할 수 있습니다."]}),e("li",{children:[e("code",{children:"unknown"}),"·",e("code",{children:"sync-error"}),": 편집은 남고"," ",e("code",{children:"status.unconfirmed"}),"가 true입니다. 성공한 READ가 그것을 풉니다. 자동으로 다시 보내는 일은 없습니다."]})]}),e("h2",{children:"6. 닫기"}),e("p",{children:["draft는 원본을 구독하므로 폼을 닫을 때 ",e("code",{children:"discard()"}),"로 놓습니다. 조회 핸들도 그것을 연 쪽이 ",e("code",{children:"dispose()"}),"합니다."]}),e(t,{language:"typescript",code:`useEffect(() => () => {
  form.discard();
  account.dispose();
}, []);`}),e("h2",{children:"readonly 조회에는 쓸 수 없다"}),e("p",{children:[e("code",{children:"editable: false"}),"로 연 조회 위에도 draft를 열고 편집할 수는 있지만 ",e("code",{children:"apply()"}),"가"," ",e("code",{children:"{ ok: false, reason: 'readonly' }"}),"로 답합니다. 저장할 폼이라면 조회를 편집 가능하게 여세요."]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/sync-lifecycle",children:"편집의 생애"})," - capture, 낡음, 결과별 동작"]}),e("li",{children:e("a",{href:"#/ko/guide/draft-apply",children:"apply · reset · discard"})}),e("li",{children:e("a",{href:"#/ko/guide/draft-conflicts",children:"충돌과 해소"})}),e("li",{children:[e("a",{href:"#/ko/guide/react",children:"React"})," - 다른 커넥터도 같은 모양"]})]})]})),Za=u(()=>()=>e("div",{children:[e("h1",{children:"Infinite Queries"}),e("p",{children:['For a list that grows page by page - a "load more" button or infinite scroll - use ',e("code",{children:"client.infiniteQuery"}),". It holds several pages in order under one key, and the page you just received tells it where the next one comes from."]}),e("p",{children:["If the screen shows one numbered page at a time, this is not the page you want: put the page number in the key with a"," ",e("a",{href:"#/guide/sync-view",children:"reactive key"})," instead."]}),e("h2",{children:"Basic Usage"}),e(t,{language:"typescript",code:`type Page = { items: Item[]; next: number | null };

const feed = client.infiniteQuery({
  queryKey: ['feed'],
  initialPageParam: 0,
  queryFn: ({ pageParam, signal }): Promise<Page> =>
    api.readFeed({ cursor: pageParam, signal }),
  getNextPageParam: lastPage => lastPage.next, // null means the end
});

await feed.load();         // reads the first page only
feed.ref.value.pages;      // [page0]
feed.ref.value.pageParams; // [0]

if (feed.hasNextPage()) {
  await feed.fetchNextPage(); // pages: [page0, page1], pageParams: [0, 1]
}`}),e("p",{children:["The data is ",e("code",{children:"{ pages, pageParams }"}),"."," ",e("code",{children:"pageParams[i]"})," is the value used to read"," ",e("code",{children:"pages[i]"}),", and the two always have the same length."]}),e("h2",{children:"Deciding the Next Page"}),e(t,{language:"typescript",code:`getNextPageParam: (lastPage, pages, lastPageParam, pageParams) =>
  lastPage.next ?? null,

// optional; only if the list can also be read backwards
getPreviousPageParam: (firstPage, pages, firstPageParam, pageParams) =>
  firstPageParam > 0 ? firstPageParam - 1 : null,`}),e("ul",{children:[e("li",{children:["Answering ",e("code",{children:"null"})," or ",e("code",{children:"undefined"})," marks the end in that direction. ",e("code",{children:"hasNextPage()"})," becomes ",e("code",{children:"false"}),", and ",e("code",{children:"fetchNextPage()"})," then returns the current data without a request."]}),e("li",{children:["Without ",e("code",{children:"getPreviousPageParam"}),","," ",e("code",{children:"hasPreviousPage()"})," is always ",e("code",{children:"false"}),"."]}),e("li",{children:["A ",e("code",{children:"pageParam"})," must be JSON-compatible; it goes into snapshots."]})]}),e("h2",{children:"maxPages"}),e("p",{children:"To keep a long list from growing in memory forever, cap the number of pages held. When it overflows, a page drops off the opposite end."}),e(t,{language:"typescript",code:`const feed = client.infiniteQuery({ ...options, maxPages: 2 });

await feed.load();          // pageParams: [0]
await feed.fetchNextPage(); // [0, 1]
await feed.fetchNextPage(); // [1, 2] — 0 dropped off the front
feed.hasPreviousPage();     // true (with getPreviousPageParam)
await feed.fetchPreviousPage(); // [0, 1] — this time 2 dropped off the back`}),e("h2",{children:"Reading Again"}),e("p",{children:[e("code",{children:"refetch()"})," and automatic refetches re-read as many pages as you hold,"," ",e("strong",{children:"in order, starting from the first held page's value"}),". From the second page on, the value is recomputed from the page just read rather than reused, so if the list changed on the server the page boundaries line up again. If ",e("code",{children:"getNextPageParam"})," reports the end partway, it finishes with fewer pages."]}),e(t,{language:"typescript",code:`// holding pageParams: [0, 1]
await feed.refetch(); // reads 0, then 1`}),e("p",{children:["The other options - ",e("code",{children:"staleTime"}),", ",e("code",{children:"gcTime"}),","," ",e("code",{children:"retry"}),", ",e("code",{children:"networkMode"}),","," ",e("code",{children:"refetchOnFocus"})," and so on - work as they do for"," ",e("a",{href:"#/guide/sync-refetch",children:"ordinary queries"}),"."]}),e("h2",{children:"It Is Read-Only"}),e("p",{children:["Infinite pages cannot be edited. Writing to ",e("code",{children:"ref"})," is refused with ",e("code",{children:"This query is readonly."}),", and the handle has neither"," ",e("code",{children:"changes()"})," nor ",e("code",{children:"capture()"}),". If the screen edits one item of the list, open that item as an ordinary query, save it, and then ",e("code",{children:"invalidate()"})," or ",e("code",{children:"refetch()"})," the infinite query."]}),e("p",{children:["As with ordinary queries, reading ",e("code",{children:"ref"})," before a load throws"," ",e("code",{children:"Query data is not loaded. Call load() first."})]}),e("h2",{children:"Flattening for the Screen"}),e("p",{children:["A ",e("code",{children:"select"})," that flattens the pages keeps the rendering code simple. Display is per observer, so the cache keeps the page shape."]}),e(t,{language:"typescript",code:`const feed = client.infiniteQuery({
  ...options,
  select: data => data.pages.flatMap(page => page.items),
});

await feed.load();
await feed.fetchNextPage();
feed.display.data.value; // [...page0.items, ...page1.items]

// React
const useFeed = connectReactView(feed.watchDisplay);`}),e("h2",{children:"Limits"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Fixed keys only."})," There is no infinite counterpart of a reactive key (",e("code",{children:"{ source, resolve }"}),"). When a search term changes, ",e("code",{children:"dispose()"})," the old handle and open a new one with the new key."]}),e("li",{children:["Prepare the cache with ",e("code",{children:"client.prefetchInfinite"}),","," ",e("code",{children:"fetchInfinite"})," and ",e("code",{children:"ensureInfinite"})," - the same rules as ",e("code",{children:"prefetch"}),", ",e("code",{children:"fetch"})," and"," ",e("code",{children:"ensure"})," for ordinary queries."]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/sync-view",children:"display and reactive keys"})," - numbered pages and ",e("code",{children:"select"})]}),e("li",{children:[e("a",{href:"#/guide/sync-refetch",children:"Automatic Refetch"})," - the same policies apply"]}),e("li",{children:[e("a",{href:"#/api/sync",children:"Sync API"})," - ",e("code",{children:"InfiniteQueryOptions"})," ","and the handle shape"]})]})]})),Xa=u(()=>()=>e("div",{children:[e("h1",{children:"무한 조회"}),e("p",{children:['"더 보기" 버튼이나 스크롤로 페이지가 쌓이는 목록에는'," ",e("code",{children:"client.infiniteQuery"}),"를 씁니다. 한 key 아래에 여러 페이지를 순서대로 들고, 다음 페이지를 어디서 읽을지는 방금 받은 페이지가 알려 줍니다."]}),e("p",{children:["번호가 붙은 페이지를 한 번에 한 장씩 보여 주는 화면이라면 이 장이 아니라"," ",e("a",{href:"#/ko/guide/sync-view",children:"반응형 key"}),"로 페이지 번호를 key에 넣는 편이 맞습니다."]}),e("h2",{children:"기본 사용법"}),e(t,{language:"typescript",code:`type Page = { items: Item[]; next: number | null };

const feed = client.infiniteQuery({
  queryKey: ['feed'],
  initialPageParam: 0,
  queryFn: ({ pageParam, signal }): Promise<Page> =>
    api.readFeed({ cursor: pageParam, signal }),
  getNextPageParam: lastPage => lastPage.next, // null이면 끝
});

await feed.load();        // 첫 페이지만 읽는다
feed.ref.value.pages;     // [page0]
feed.ref.value.pageParams; // [0]

if (feed.hasNextPage()) {
  await feed.fetchNextPage(); // pages: [page0, page1], pageParams: [0, 1]
}`}),e("p",{children:["데이터는 ",e("code",{children:"{ pages, pageParams }"}),"입니다."," ",e("code",{children:"pageParams[i]"}),"가 ",e("code",{children:"pages[i]"}),"를 읽을 때 쓴 값이고, 둘은 늘 같은 길이입니다."]}),e("h2",{children:"다음 페이지를 정하는 함수"}),e(t,{language:"typescript",code:`getNextPageParam: (lastPage, pages, lastPageParam, pageParams) =>
  lastPage.next ?? null,

// 선택. 앞쪽으로도 읽을 수 있을 때만
getPreviousPageParam: (firstPage, pages, firstPageParam, pageParams) =>
  firstPageParam > 0 ? firstPageParam - 1 : null,`}),e("ul",{children:[e("li",{children:[e("code",{children:"null"}),"이나 ",e("code",{children:"undefined"}),"를 답하면 그 방향의 끝입니다. ",e("code",{children:"hasNextPage()"}),"가 ",e("code",{children:"false"}),"가 되고, 그때"," ",e("code",{children:"fetchNextPage()"}),"는 요청 없이 현재 데이터를 돌려줍니다."]}),e("li",{children:[e("code",{children:"getPreviousPageParam"}),"이 없으면"," ",e("code",{children:"hasPreviousPage()"}),"는 항상 ",e("code",{children:"false"}),"입니다."]}),e("li",{children:["페이지 값(",e("code",{children:"pageParam"}),")은 JSON 호환이어야 합니다. 스냅숏에 들어가기 때문입니다."]})]}),e("h2",{children:"maxPages"}),e("p",{children:"긴 목록이 메모리에 끝없이 쌓이지 않게 들고 있을 페이지 수를 제한할 수 있습니다. 넘치면 반대쪽 끝의 페이지가 빠집니다."}),e(t,{language:"typescript",code:`const feed = client.infiniteQuery({ ...options, maxPages: 2 });

await feed.load();          // pageParams: [0]
await feed.fetchNextPage(); // [0, 1]
await feed.fetchNextPage(); // [1, 2] — 앞의 0이 빠졌다
feed.hasPreviousPage();     // true (getPreviousPageParam이 있을 때)
await feed.fetchPreviousPage(); // [0, 1] — 이번에는 뒤의 2가 빠졌다`}),e("h2",{children:"다시 읽기"}),e("p",{children:[e("code",{children:"refetch()"}),"와 자동 재조회는 지금 들고 있는 페이지 수만큼,"," ",e("strong",{children:"들고 있는 첫 페이지의 값부터 순서대로"})," 다시 읽습니다. 두 번째부터의 값은 저장해 둔 것을 쓰지 않고 방금 읽은 페이지로부터 다시 계산하므로, 서버에서 목록이 바뀌었다면 페이지 경계도 새로 맞춰집니다. 도중에 ",e("code",{children:"getNextPageParam"}),"이 끝을 답하면 그만큼 적은 페이지로 끝납니다."]}),e(t,{language:"typescript",code:`// pageParams: [0, 1]를 들고 있을 때
await feed.refetch(); // 0, 1 순서로 두 번 읽는다`}),e("p",{children:[e("code",{children:"staleTime"}),", ",e("code",{children:"gcTime"}),", ",e("code",{children:"retry"}),","," ",e("code",{children:"networkMode"}),", ",e("code",{children:"refetchOnFocus"})," 같은 나머지 옵션은"," ",e("a",{href:"#/ko/guide/sync-refetch",children:"일반 조회"}),"와 같습니다."]}),e("h2",{children:"읽기 전용이다"}),e("p",{children:["무한 조회의 페이지는 편집할 수 없습니다. ",e("code",{children:"ref"}),"에 쓰면"," ",e("code",{children:"This query is readonly."}),"로 거절하고, 핸들에는"," ",e("code",{children:"changes()"}),"도 ",e("code",{children:"capture()"}),"도 없습니다. 목록의 한 항목을 고치는 화면이라면 그 항목을 일반 조회로 따로 열고, 저장한 뒤 무한 조회를 ",e("code",{children:"invalidate()"}),"하거나 ",e("code",{children:"refetch()"}),"하세요."]}),e("p",{children:["로드 전에 ",e("code",{children:"ref"}),"를 읽으면"," ",e("code",{children:"Query data is not loaded. Call load() first."}),"로 던지는 것은 일반 조회와 같습니다."]}),e("h2",{children:"화면에 펼치기"}),e("p",{children:[e("code",{children:"select"}),"로 페이지를 평평한 목록으로 바꾸면 화면 쪽 코드가 단순해집니다. 표시는 관찰자마다 따로라서 캐시는 페이지 모양 그대로 남습니다."]}),e(t,{language:"typescript",code:`const feed = client.infiniteQuery({
  ...options,
  select: data => data.pages.flatMap(page => page.items),
});

await feed.load();
await feed.fetchNextPage();
feed.display.data.value; // [...page0.items, ...page1.items]

// React
const useFeed = connectReactView(feed.watchDisplay);`}),e("h2",{children:"한계"}),e("ul",{children:[e("li",{children:[e("strong",{children:"고정 key만 받습니다."})," 반응형 key(",e("code",{children:"{ source, resolve }"}),")의 무한 조회판은 없습니다. 검색어가 바뀌면 이전 핸들을 ",e("code",{children:"dispose()"}),"하고 새 key로 다시 여세요."]}),e("li",{children:["캐시 준비는 ",e("code",{children:"client.prefetchInfinite"}),"·",e("code",{children:"fetchInfinite"}),"·",e("code",{children:"ensureInfinite"}),"로 합니다. 일반 조회의 ",e("code",{children:"prefetch"}),"·",e("code",{children:"fetch"}),"·",e("code",{children:"ensure"}),"와 같은 규칙입니다."]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/sync-view",children:"표시와 반응형 key"})," - 번호 페이지와"," ",e("code",{children:"select"})]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-refetch",children:"자동 재조회"})," - 무한 조회에도 같은 정책"]}),e("li",{children:[e("a",{href:"#/ko/api/sync",children:"Sync API"})," -"," ",e("code",{children:"InfiniteQueryOptions"}),"와 핸들 모양"]})]})]})),ei=u(()=>()=>e("div",{children:[e("h1",{children:"Streaming"}),e("p",{children:["When the server pushes data - a WebSocket, an NDJSON response, a progress feed - use ",e("code",{children:"streamQuery"}),". It connects a push source to an ordinary query, and"," ",e("strong",{children:"every message shows on screen as it arrives"})," instead of after the whole response."]}),e("p",{children:["A stream does not replace the query. It writes into the same cache entry as ",e("code",{children:"queryFn"})," does, so ",e("code",{children:"ref"}),", ",e("code",{children:"watch"}),","," ",e("code",{children:"display"}),", local edits and mutations keep working on a streamed query."]}),e("h2",{children:"Basic Usage"}),e(t,{language:"typescript",code:`import { createSyncClient, ndjsonMessages, streamQuery } from '@stateref/sync';

type Report = { rows: string[] };
type Row = { row: string };

const client = createSyncClient();
const report = client.query<Report>({
  queryKey: ['report'],
  queryFn: () => ({ rows: [] }),
});

const stream = streamQuery<Report, Row>(report, {
  // called on start and again on every refetch()
  source: () => ndjsonMessages<Row>(signal => fetch('/report', { signal })),
  // fold one message into the next server value
  reduce: (current, message) => ({
    rows: [...(current?.rows ?? []), message.row],
  }),
});

// Before the first message the query has no data: ref and watch throw.
// The display is readable from the start.
report.display.data.value?.rows ?? []; // [] → ['a'] → ['a', 'b'] → …
stream.status.value; // { state: 'open', received: 2, queued: 0, buffered: 0, error: null }

// After the first message (or a load), report.ref.rows.value works too.`}),e("p",{children:["You do not have to call ",e("code",{children:"load()"})," first: the first message loads an empty query. If the query is already loaded or hydrated, the stream folds onto that value instead of wiping it."]}),e("h2",{children:"Sources"}),e("p",{children:[e("code",{children:"source"})," is a function that opens a new connection each time it is called. It returns an async iterable or a subscribe function"," ",e("code",{children:"(sink, signal) => teardown"}),". Two ready-made sources cover the common cases."]}),e(t,{language:"typescript",code:`// NDJSON: one JSON value per line
ndjsonMessages<Row>(signal => fetch('/report', { signal })) // lazy request
ndjsonMessages<Row>(response)                               // a Response or body you already have

// WebSocket: JSON.parse by default, or your own parser
webSocketMessages<Row>(new WebSocket('wss://example.com/report'))
webSocketMessages<Row>(socket, data => decode(data))

// Anything else: an async iterable ...
source: () => myAsyncGenerator()
// ... or a subscribe function
source: () => (sink, signal) => {
  const offItem = feed.on('item', item => sink.next(item));
  const offEnd = feed.on('end', () => sink.complete());
  const offFail = feed.on('fail', error => sink.error(error));
  // teardown: remove every listener this run added
  return () => {
    offItem();
    offEnd();
    offFail();
  };
}`}),e("ul",{children:[e("li",{children:[e("code",{children:"ndjsonMessages"})," handles a line split across network chunks (including multi-byte characters), skips blank lines and reads a last line without a newline. Invalid JSON fails the run. Closing the stream aborts the request and cancels the reader."]}),e("li",{children:[e("code",{children:"webSocketMessages"})," completes the run on a clean close and fails it on any other close. Closing the stream closes the socket."]})]}),e("h2",{children:"reduce Is a Reducer"}),e("p",{children:["The library does not interpret messages. The server decides what a message looks like, and ",e("code",{children:"reduce"})," decides what it does to the data - the same shape as a Redux reducer. When the server sends events, switch on their type."]}),e(t,{language:"typescript",code:`type State = { todos: Todo[] };
type Action =
  | { type: 'added'; todo: Todo }
  | { type: 'removed'; id: string }
  | { type: 'snapshot'; state: State };

streamQuery<State, Action>(todos, {
  source: () => webSocketMessages<Action>(new WebSocket(url)),
  reduce: (state, action) => {
    const list = state?.todos ?? [];
    switch (action.type) {
      case 'added':
        return { todos: [...list, action.todo] };
      case 'removed':
        return { todos: list.filter(t => t.id !== action.id) };
      case 'snapshot':
        return action.state;
      default:
        // ignore actions this client does not know yet;
        // state is undefined if the very first message is one of them
        return state ?? { todos: [] };
    }
  },
});`}),e("ul",{children:[e("li",{children:[e("code",{children:"current"})," is the ",e("strong",{children:"server value"}),", never the user's local edits. It is ",e("code",{children:"undefined"})," before the first load. Read the same value yourself with"," ",e("code",{children:"query.serverValue()"}),"."]}),e("li",{children:[e("strong",{children:["Treat ",e("code",{children:"current"})," as immutable and return a new value."]})," ","The server value of editable data is frozen, so mutating it throws. But when several messages are folded together (a throttle window, or messages held for a save), ",e("code",{children:"current"})," can be the value your previous ",e("code",{children:"reduce"})," call returned, which is not frozen - mutating it would not throw, it would silently share state."]}),e("li",{children:["TypeScript types are not checked at run time. If the server format may change, validate inside the WebSocket ",e("code",{children:"parse"})," function or inside ",e("code",{children:"reduce"}),"."]})]}),e("h2",{children:"Edits and Saves"}),e("p",{children:["Each message is applied with ",e("code",{children:"acceptServer"}),", so a stream behaves like a series of server reads."]}),e("ul",{children:[e("li",{children:["The user's local edits stay on top of every new server value. If the server changes a field the user is editing, it shows up in"," ",e("code",{children:"status.conflicts"}),". See"," ",e("a",{href:"#/guide/sync-lifecycle",children:"Edit Lifecycle"}),"."]}),e("li",{children:["While a linked save on the query is pending, messages are"," ",e("strong",{children:"held"})," (",e("code",{children:"stream.status.queued"}),"). When the save settles they are folded, in order, on top of the value the save accepted, and nothing overtakes the save. They are only discarded if you cancel first: ",e("code",{children:"close()"}),", or a ",e("code",{children:"reset"})," /"," ",e("code",{children:"replace"})," restart (see ",e("em",{children:"How a Run Ends"})," below)."]})]}),e("h2",{children:"Restarting: refetch({ mode })"}),e("p",{children:["Updating the screen per message is the default inside a run; a"," ",e("code",{children:"replace"})," run (shown once at the end) and"," ",e("code",{children:"throttle"})," (coalesced) are the exceptions, and both still fold every message. A mode only matters when you"," ",e("strong",{children:"restart"})," the stream, and it decides what happens to the data the previous run left on screen. You pick it per call."]}),e(t,{language:"typescript",code:`const stream = streamQuery(report, {
  source,
  reduce,
  initialValue: () => ({ rows: [] }), // what reset / replace start from
});

stream.refetch();                    // 'reset' (the default)
stream.refetch({ mode: 'append' });  // e.g. after a reconnect
stream.refetch({ mode: 'replace' }); // e.g. a "refresh" button`}),e("ul",{children:[e("li",{children:[e("code",{children:"initialValue"})," is not called on the first run - that run always folds onto the current value. It is called on each"," ",e("code",{children:"reset"})," or ",e("code",{children:"replace"})," restart; if it throws, that run fails."]}),e("li",{children:[e("code",{children:"refetch()"})," throws after ",e("code",{children:"close()"}),", and for an unknown mode - in that case before the current run is touched."]})]}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"mode"}),e("th",{children:"when the new run starts"}),e("th",{children:"while its messages arrive"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"reset"})}),e("td",{children:["shows ",e("code",{children:"initialValue"})," at once (without one, keeps the old data until the first new message)"]}),e("td",{children:"updates per message, from scratch"})]}),e("tr",{children:[e("td",{children:e("code",{children:"append"})}),e("td",{children:"keeps what is shown"}),e("td",{children:"updates per message, added to it"})]}),e("tr",{children:[e("td",{children:e("code",{children:"replace"})}),e("td",{children:"keeps what is shown"}),e("td",{children:["folded off screen (",e("code",{children:"status.buffered"}),"), swapped in once when the run completes; a failed run is dropped"]})]})]})]}),e("p",{children:[e("code",{children:"query.refetch()"})," is a different thing: it runs"," ",e("code",{children:"queryFn"})," once and does not touch the stream."]}),e("h2",{children:"Throttling Screen Updates"}),e("p",{children:["A busy source can re-render too often. ",e("code",{children:"throttle"})," limits how often the value is published:"]}),e(t,{language:"typescript",code:`streamQuery(report, { source, reduce, throttle: 100 });     // at most once per 100 ms
streamQuery(report, { source, reduce, throttle: 'frame' }); // at most once per animation frame`}),e("ul",{children:[e("li",{children:[e("strong",{children:"No message is dropped."})," Every message is still folded by ",e("code",{children:"reduce"}),"; only the publishes are coalesced. 50 messages in one window become one screen update that contains all 50."]}),e("li",{children:"The first message of a run - and the first one after a quiet window - shows at once."}),e("li",{children:["Completion, an error and ",e("code",{children:"close()"})," publish what the window still holds without waiting."]}),e("li",{children:[e("code",{children:"'frame'"})," uses ",e("code",{children:"requestAnimationFrame"}),"; where there is none (server, tests) it falls back to a 16 ms timer. Browsers pause animation frames in background tabs, so updates wait until the tab is visible again."]})]}),e("h2",{children:"Status, Errors and Cleanup"}),e(t,{language:"typescript",code:`stream.status.value
// {
//   state: 'open' | 'complete' | 'error' | 'closed',
//   received: number, // messages of this run applied to the query
//   queued: number,   // held while a linked save is pending
//   buffered: number, // folded off screen by a 'replace' run
//   error: unknown,
// }

streamQuery(report, {
  source,
  reduce,
  onError: error => toast(String(error)), // once per failed run
});

stream.close(); // stop for good: aborts the request / closes the socket`}),e("h3",{children:"How a Run Ends"}),e("p",{children:"A run that ends by itself keeps what it received. A run that you cancel discards what is still waiting."}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"ending"}),e("th",{children:"messages not shown yet"}),e("th",{children:"state"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:"source completes"}),e("td",{children:"applied first (after a pending save, if one holds them)"}),e("td",{children:e("code",{children:"complete"})})]}),e("tr",{children:[e("td",{children:"source error or throw"}),e("td",{children:"applied first (after a pending save, if one holds them)"}),e("td",{children:e("code",{children:"error"})})]}),e("tr",{children:[e("td",{children:[e("code",{children:"reduce"})," throws"]}),e("td",{children:"what was folded before the bad message is applied"}),e("td",{children:e("code",{children:"error"})})]}),e("tr",{children:[e("td",{children:e("code",{children:"close()"})}),e("td",{children:"a throttle window is applied; messages held for a pending save are discarded"}),e("td",{children:e("code",{children:"closed"})})]}),e("tr",{children:[e("td",{children:[e("code",{children:"refetch()"})," with ",e("code",{children:"reset"})," /"," ",e("code",{children:"replace"})]}),e("td",{children:"discarded with the old run"}),e("td",{children:["new run, ",e("code",{children:"open"})]})]}),e("tr",{children:[e("td",{children:e("code",{children:"refetch({ mode: 'append' })"})}),e("td",{children:"kept and applied in the new run"}),e("td",{children:["new run, ",e("code",{children:"open"})]})]}),e("tr",{children:[e("td",{children:["a ",e("code",{children:"replace"})," run fails"]}),e("td",{children:"its off-screen result is discarded; the old data stays"}),e("td",{children:e("code",{children:"error"})})]})]})]}),e("ul",{children:[e("li",{children:["When the source ends while a save holds messages, ",e("code",{children:"state"})," ","stays ",e("code",{children:"open"})," (with ",e("code",{children:"queued > 0"}),") until they are applied; only then does it become ",e("code",{children:"complete"})," or"," ",e("code",{children:"error"}),", and ",e("code",{children:"onError"})," is called then."]}),e("li",{children:["If the source throws synchronously on the ",e("strong",{children:"first"})," run,"," ",e("code",{children:"onError"})," is called and the error is also rethrown from"," ",e("code",{children:"streamQuery()"}),". On a restart it is only reported."]}),e("li",{children:["There is no automatic reconnect. Call ",e("code",{children:"stream.refetch()"})," ","from ",e("code",{children:"onError"})," or from a status observer when you want one."]}),e("li",{children:[e("code",{children:"status"})," is readonly. Pass ",e("code",{children:"stream.watchStatus"})," ","to a connector like any other Watch."]})]}),e("h2",{children:"In a Component"}),e("p",{children:["A query that only the stream fills has no data until the first message, and ",e("code",{children:"ref"}),"/",e("code",{children:"watch"})," throw before a load. Bind the"," ",e("a",{href:"#/guide/sync-view",children:"display"})," instead; it is readable from the start and follows every streamed value."]}),e(t,{language:"typescript",code:`import { connectReact, connectReactView } from '@stateref/connect-react';

// display works before the first message; report.watch throws until then
const useReport = connectReactView(report.watchDisplay);
const useStreamStatus = connectReact(stream.watchStatus);

function ReportView() {
  const rows = useReport().data.value?.rows ?? [];
  const { state, received } = useStreamStatus().value;
  return (
    <>
      <p>{state === 'open' ? \`Receiving… (\${received})\` : state}</p>
      <ul>{rows.map(row => <li key={row}>{row}</li>)}</ul>
    </>
  );
}

// call stream.close() when the screen goes away`}),e("h2",{children:"Limits"}),e("ul",{children:[e("li",{children:["No automatic reconnect or backoff, no Server-Sent Events helper, no reordering or de-duplication of messages. Wrap an"," ",e("code",{children:"EventSource"})," in a subscribe function if you need SSE."]}),e("li",{children:["A stream on a ",e("a",{href:"#/guide/sync-view",children:"reactive key"})," query does not reopen when the key changes. Open one stream per key."]}),e("li",{children:["Automatic refetches (focus, reconnect, polling) run"," ",e("code",{children:"queryFn"}),"; they do not restart the stream. A stream message excludes an older in-flight read."]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/sync-query",children:"query and resource"})," - the query a stream writes into"]}),e("li",{children:[e("a",{href:"#/guide/sync-lifecycle",children:"Edit Lifecycle"})," - how edits ride on top of new server values"]}),e("li",{children:[e("a",{href:"#/api/sync",children:"Sync API"})," - ",e("code",{children:"streamQuery"})," and"," ",e("code",{children:"QueryStreamOptions"})]})]})]})),ti=u(()=>()=>e("div",{children:[e("h1",{children:"스트리밍"}),e("p",{children:["WebSocket, NDJSON 응답, 진행 상황 피드처럼 서버가 데이터를 밀어주는 경우에는 ",e("code",{children:"streamQuery"}),"를 씁니다. push source를 일반 query에 연결하며, 응답이 다 끝난 뒤가 아니라"," ",e("strong",{children:"메시지가 도착할 때마다 화면에 반영됩니다"}),"."]}),e("p",{children:["스트림은 query를 대체하지 않습니다. ",e("code",{children:"queryFn"}),"과 같은 캐시 항목에 값을 쓰므로, 스트리밍 중인 query에서도 ",e("code",{children:"ref"}),","," ",e("code",{children:"watch"}),", ",e("code",{children:"display"}),", 로컬 편집, mutation이 그대로 동작합니다."]}),e("h2",{children:"기본 사용법"}),e(t,{language:"typescript",code:`import { createSyncClient, ndjsonMessages, streamQuery } from '@stateref/sync';

type Report = { rows: string[] };
type Row = { row: string };

const client = createSyncClient();
const report = client.query<Report>({
  queryKey: ['report'],
  queryFn: () => ({ rows: [] }),
});

const stream = streamQuery<Report, Row>(report, {
  // 시작할 때, 그리고 refetch()할 때마다 호출된다
  source: () => ndjsonMessages<Row>(signal => fetch('/report', { signal })),
  // 메시지 하나를 다음 서버 값으로 접는다
  reduce: (current, message) => ({
    rows: [...(current?.rows ?? []), message.row],
  }),
});

// 첫 메시지 전에는 query에 데이터가 없어서 ref와 watch가 예외를 던진다.
// display는 처음부터 읽을 수 있다.
report.display.data.value?.rows ?? []; // [] → ['a'] → ['a', 'b'] → …
stream.status.value; // { state: 'open', received: 2, queued: 0, buffered: 0, error: null }

// 첫 메시지(또는 load) 이후에는 report.ref.rows.value도 동작한다.`}),e("p",{children:["먼저 ",e("code",{children:"load()"}),"를 부를 필요는 없습니다. 첫 메시지가 빈 query를 로드합니다. 이미 로드되거나 hydrate된 query라면 그 값을 지우지 않고 그 위에 이어서 접습니다."]}),e("h2",{children:"source"}),e("p",{children:[e("code",{children:"source"}),"는 호출될 때마다 새 연결을 여는 함수입니다. async iterable이나 구독 함수 ",e("code",{children:"(sink, signal) => teardown"}),"을 반환합니다. 흔한 경우는 기성 source 두 개로 해결됩니다."]}),e(t,{language:"typescript",code:`// NDJSON: 한 줄에 JSON 값 하나
ndjsonMessages<Row>(signal => fetch('/report', { signal })) // 요청을 늦게 시작
ndjsonMessages<Row>(response)                               // 이미 받은 Response나 body

// WebSocket: 기본은 JSON.parse, 직접 파서를 줄 수도 있다
webSocketMessages<Row>(new WebSocket('wss://example.com/report'))
webSocketMessages<Row>(socket, data => decode(data))

// 그 밖의 것: async iterable ...
source: () => myAsyncGenerator()
// ... 또는 구독 함수
source: () => (sink, signal) => {
  const offItem = feed.on('item', item => sink.next(item));
  const offEnd = feed.on('end', () => sink.complete());
  const offFail = feed.on('fail', error => sink.error(error));
  // 정리 함수: 이번 run이 붙인 리스너를 모두 뗀다
  return () => {
    offItem();
    offEnd();
    offFail();
  };
}`}),e("ul",{children:[e("li",{children:[e("code",{children:"ndjsonMessages"}),"는 네트워크 chunk 경계에서 잘린 줄(멀티바이트 문자 포함)을 이어 붙이고, 빈 줄은 건너뛰며, 줄바꿈 없는 마지막 줄도 읽습니다. 잘못된 JSON은 run을 실패시킵니다. 스트림을 닫으면 요청을 중단하고 reader를 취소합니다."]}),e("li",{children:[e("code",{children:"webSocketMessages"}),"는 정상 종료(clean close)면 run을 완료하고, 그 외의 종료면 실패시킵니다. 스트림을 닫으면 소켓도 닫습니다."]})]}),e("h2",{children:"reduce는 리듀서다"}),e("p",{children:["라이브러리는 메시지를 해석하지 않습니다. 메시지 형식은 서버가 정하고, 그 메시지가 데이터를 어떻게 바꾸는지는 ",e("code",{children:"reduce"}),"가 정합니다. Redux 리듀서와 같은 모양입니다. 서버가 이벤트를 보낸다면 type으로 나눕니다."]}),e(t,{language:"typescript",code:`type State = { todos: Todo[] };
type Action =
  | { type: 'added'; todo: Todo }
  | { type: 'removed'; id: string }
  | { type: 'snapshot'; state: State };

streamQuery<State, Action>(todos, {
  source: () => webSocketMessages<Action>(new WebSocket(url)),
  reduce: (state, action) => {
    const list = state?.todos ?? [];
    switch (action.type) {
      case 'added':
        return { todos: [...list, action.todo] };
      case 'removed':
        return { todos: list.filter(t => t.id !== action.id) };
      case 'snapshot':
        return action.state;
      default:
        // 이 클라이언트가 아직 모르는 액션은 무시한다;
        // 맨 처음 메시지가 그런 액션이면 state는 undefined다
        return state ?? { todos: [] };
    }
  },
});`}),e("ul",{children:[e("li",{children:[e("code",{children:"current"}),"는 ",e("strong",{children:"서버 값"}),"이며, 사용자의 로컬 편집은 들어 있지 않습니다. 첫 로드 전에는 ",e("code",{children:"undefined"}),"입니다. 같은 값을 ",e("code",{children:"query.serverValue()"}),"로 직접 읽을 수 있습니다."]}),e("li",{children:[e("strong",{children:[e("code",{children:"current"}),"는 불변 값으로 다루고 새 값을 반환하세요."]})," ","편집 가능한 데이터의 서버 값은 freeze되어 있어 직접 바꾸면 예외가 납니다. 하지만 여러 메시지를 한꺼번에 접을 때(throttle 구간, 저장 때문에 보류된 메시지)는 ",e("code",{children:"current"}),"가 직전"," ",e("code",{children:"reduce"})," 호출이 반환한 값일 수 있고, 이 값은 freeze되어 있지 않습니다. 직접 바꿔도 예외 없이 상태가 조용히 공유됩니다."]}),e("li",{children:["TypeScript 타입은 런타임에 검사되지 않습니다. 서버 형식이 바뀔 수 있다면 WebSocket의 ",e("code",{children:"parse"})," 함수나 ",e("code",{children:"reduce"})," ","안에서 검증하세요."]})]}),e("h2",{children:"편집과 저장"}),e("p",{children:["메시지마다 ",e("code",{children:"acceptServer"}),"로 반영되므로, 스트림은 서버 읽기가 연달아 일어나는 것과 같게 동작합니다."]}),e("ul",{children:[e("li",{children:["사용자의 로컬 편집은 새 서버 값 위에 계속 유지됩니다. 사용자가 고치는 필드를 서버가 바꾸면 ",e("code",{children:"status.conflicts"}),"에 나타납니다."," ",e("a",{href:"#/ko/guide/sync-lifecycle",children:"편집의 생애"}),"를 보세요."]}),e("li",{children:["query에 연결된 저장이 진행 중이면 메시지는 ",e("strong",{children:"보류됩니다"}),"(",e("code",{children:"stream.status.queued"}),"). 저장이 끝나면 저장이 수용한 값 위에 순서대로 접히고, 저장을 앞지르는 메시지는 없습니다. 먼저 취소한 경우에만 버려집니다: ",e("code",{children:"close()"}),", 또는 ",e("code",{children:"reset"}),"/",e("code",{children:"replace"})," 재시작(아래 ",e("em",{children:"run이 끝나는 방식"})," 참고)."]})]}),e("h2",{children:"다시 시작하기: refetch({ mode })"}),e("p",{children:["run 안에서는 기본적으로 메시지마다 화면이 바뀝니다. 예외는"," ",e("code",{children:"replace"})," run(끝날 때 한 번 표시)과 ",e("code",{children:"throttle"}),"(묶어서 표시)이며, 둘 다 메시지는 모두 접습니다. 모드는 스트림을"," ",e("strong",{children:"다시 시작할 때"}),"만 의미가 있고, 이전 run이 화면에 남긴 데이터를 어떻게 할지 정합니다. 호출할 때마다 고릅니다."]}),e(t,{language:"typescript",code:`const stream = streamQuery(report, {
  source,
  reduce,
  initialValue: () => ({ rows: [] }), // reset / replace가 시작하는 값
});

stream.refetch();                    // 'reset' (기본값)
stream.refetch({ mode: 'append' });  // 예: 재연결 뒤
stream.refetch({ mode: 'replace' }); // 예: "새로고침" 버튼`}),e("ul",{children:[e("li",{children:[e("code",{children:"initialValue"}),"는 첫 run에서는 호출되지 않습니다. 첫 run은 항상 현재 값 위에 접습니다. ",e("code",{children:"reset"}),"·",e("code",{children:"replace"})," ","재시작마다 호출되며, 예외를 던지면 그 run이 실패합니다."]}),e("li",{children:[e("code",{children:"refetch()"}),"는 ",e("code",{children:"close()"})," 뒤에 부르거나 알 수 없는 모드를 주면 예외를 던집니다. 후자는 현재 run을 건드리기 전에 던집니다."]})]}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"모드"}),e("th",{children:"새 run이 시작될 때"}),e("th",{children:"메시지가 도착하는 동안"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"reset"})}),e("td",{children:[e("code",{children:"initialValue"}),"를 바로 보여 줌(없으면 새 첫 메시지까지 이전 데이터 유지)"]}),e("td",{children:"처음부터 메시지마다 갱신"})]}),e("tr",{children:[e("td",{children:e("code",{children:"append"})}),e("td",{children:"보이는 데이터 유지"}),e("td",{children:"그 뒤에 메시지마다 이어 붙임"})]}),e("tr",{children:[e("td",{children:e("code",{children:"replace"})}),e("td",{children:"보이는 데이터 유지"}),e("td",{children:["화면 밖에서 접다가(",e("code",{children:"status.buffered"}),") run이 끝나면 한 번에 교체; 실패한 run은 버림"]})]})]})]}),e("p",{children:[e("code",{children:"query.refetch()"}),"는 다른 것입니다. ",e("code",{children:"queryFn"}),"을 한 번 실행할 뿐 스트림에는 손대지 않습니다."]}),e("h2",{children:"화면 갱신 throttle"}),e("p",{children:["메시지가 몰려오면 렌더가 너무 잦아질 수 있습니다. ",e("code",{children:"throttle"}),"로 반영 빈도를 제한합니다."]}),e(t,{language:"typescript",code:`streamQuery(report, { source, reduce, throttle: 100 });     // 최대 100ms에 한 번
streamQuery(report, { source, reduce, throttle: 'frame' }); // 최대 애니메이션 프레임마다 한 번`}),e("ul",{children:[e("li",{children:[e("strong",{children:"메시지는 하나도 버리지 않습니다."})," 모든 메시지가"," ",e("code",{children:"reduce"}),"를 거치고, 반영만 묶입니다. 한 구간에 50개가 오면 50개가 모두 담긴 화면 갱신이 한 번 일어납니다."]}),e("li",{children:"run의 첫 메시지와 한동안 조용하다가 온 첫 메시지는 바로 보입니다."}),e("li",{children:["완료, 오류, ",e("code",{children:"close()"})," 때는 기다리지 않고 남은 것을 반영합니다."]}),e("li",{children:[e("code",{children:"'frame'"}),"은 ",e("code",{children:"requestAnimationFrame"}),"을 쓰고, 없는 환경(서버, 테스트)에서는 16ms 타이머로 대신합니다. 브라우저는 백그라운드 탭에서 애니메이션 프레임을 멈추므로, 탭이 다시 보일 때까지 반영이 미뤄집니다."]})]}),e("h2",{children:"상태, 오류, 정리"}),e(t,{language:"typescript",code:`stream.status.value
// {
//   state: 'open' | 'complete' | 'error' | 'closed',
//   received: number, // 이번 run에서 query에 반영된 메시지 수
//   queued: number,   // 연결된 저장이 끝나기를 기다리며 보류 중인 수
//   buffered: number, // 'replace' run이 화면 밖에서 접은 수
//   error: unknown,
// }

streamQuery(report, {
  source,
  reduce,
  onError: error => toast(String(error)), // 실패한 run마다 한 번
});

stream.close(); // 완전히 멈춤: 요청을 중단하고 소켓을 닫는다`}),e("h3",{children:"run이 끝나는 방식"}),e("p",{children:"스스로 끝난 run은 받은 것을 남깁니다. 사용자가 취소한 run은 아직 기다리던 것을 버립니다."}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"종료"}),e("th",{children:"아직 표시되지 않은 메시지"}),e("th",{children:"state"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:"source 완료"}),e("td",{children:"먼저 반영(저장이 보류 중이면 저장 뒤에)"}),e("td",{children:e("code",{children:"complete"})})]}),e("tr",{children:[e("td",{children:"source 오류·예외"}),e("td",{children:"먼저 반영(저장이 보류 중이면 저장 뒤에)"}),e("td",{children:e("code",{children:"error"})})]}),e("tr",{children:[e("td",{children:[e("code",{children:"reduce"})," 예외"]}),e("td",{children:"잘못된 메시지 직전까지 접은 값을 반영"}),e("td",{children:e("code",{children:"error"})})]}),e("tr",{children:[e("td",{children:e("code",{children:"close()"})}),e("td",{children:"throttle 구간은 반영; 저장 때문에 보류된 메시지는 버림"}),e("td",{children:e("code",{children:"closed"})})]}),e("tr",{children:[e("td",{children:[e("code",{children:"reset"}),"/",e("code",{children:"replace"}),"로 ",e("code",{children:"refetch()"})]}),e("td",{children:"이전 run과 함께 버림"}),e("td",{children:["새 run, ",e("code",{children:"open"})]})]}),e("tr",{children:[e("td",{children:e("code",{children:"refetch({ mode: 'append' })"})}),e("td",{children:"유지하고 새 run에서 반영"}),e("td",{children:["새 run, ",e("code",{children:"open"})]})]}),e("tr",{children:[e("td",{children:[e("code",{children:"replace"})," run 실패"]}),e("td",{children:"화면 밖 결과는 버리고 이전 데이터 유지"}),e("td",{children:e("code",{children:"error"})})]})]})]}),e("ul",{children:[e("li",{children:["저장이 메시지를 보류한 상태에서 source가 끝나면, 보류분이 반영될 때까지 ",e("code",{children:"state"}),"는 ",e("code",{children:"open"}),"(",e("code",{children:"queued > 0"}),")으로 남습니다. 그 뒤에 ",e("code",{children:"complete"}),"나 ",e("code",{children:"error"}),"가 되고, ",e("code",{children:"onError"}),"도 그때 호출됩니다."]}),e("li",{children:[e("strong",{children:"첫"})," run에서 source가 동기로 예외를 던지면"," ",e("code",{children:"onError"}),"가 호출되고, 같은 오류가"," ",e("code",{children:"streamQuery()"})," 호출자에게도 다시 던져집니다. 재시작에서는 보고만 합니다."]}),e("li",{children:["자동 재연결은 없습니다. 필요하면 ",e("code",{children:"onError"}),"나 상태 관찰에서"," ",e("code",{children:"stream.refetch()"}),"를 부르세요."]}),e("li",{children:[e("code",{children:"status"}),"는 읽기 전용입니다. ",e("code",{children:"stream.watchStatus"}),"를 다른 Watch처럼 커넥터에 넘기면 됩니다."]})]}),e("h2",{children:"컴포넌트에서"}),e("p",{children:["스트림으로만 채우는 query는 첫 메시지 전까지 데이터가 없고,"," ",e("code",{children:"ref"}),"/",e("code",{children:"watch"}),"는 로드 전에 예외를 던집니다. 대신"," ",e("a",{href:"#/ko/guide/sync-view",children:"display"}),"를 연결하세요. 처음부터 읽을 수 있고 스트림으로 들어오는 값을 모두 따라갑니다."]}),e(t,{language:"typescript",code:`import { connectReact, connectReactView } from '@stateref/connect-react';

// display는 첫 메시지 전에도 동작한다; report.watch는 그때까지 예외를 던진다
const useReport = connectReactView(report.watchDisplay);
const useStreamStatus = connectReact(stream.watchStatus);

function ReportView() {
  const rows = useReport().data.value?.rows ?? [];
  const { state, received } = useStreamStatus().value;
  return (
    <>
      <p>{state === 'open' ? \`받는 중… (\${received})\` : state}</p>
      <ul>{rows.map(row => <li key={row}>{row}</li>)}</ul>
    </>
  );
}

// 화면이 사라질 때 stream.close()를 부른다`}),e("h2",{children:"제한"}),e("ul",{children:[e("li",{children:["자동 재연결·backoff, Server-Sent Events 전용 helper, 메시지 순서 재정렬·중복 제거는 없습니다. SSE가 필요하면 ",e("code",{children:"EventSource"}),"를 구독 함수로 감싸세요."]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-view",children:"반응형 key"})," query에 연결한 스트림은 key가 바뀌어도 다시 열리지 않습니다. key마다 스트림을 따로 여세요."]}),e("li",{children:["자동 재조회(focus, reconnect, polling)는 ",e("code",{children:"queryFn"}),"을 실행하며 스트림을 재시작하지 않습니다. 스트림 메시지는 진행 중이던 이전 읽기를 배제합니다."]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/sync-query",children:"query와 resource"})," - 스트림이 값을 쓰는 query"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-lifecycle",children:"편집의 생애"})," - 새 서버 값 위에 편집이 유지되는 방식"]}),e("li",{children:[e("a",{href:"#/ko/api/sync",children:"Sync API"})," - ",e("code",{children:"streamQuery"}),"와"," ",e("code",{children:"QueryStreamOptions"})]})]})]})),ri=u(()=>()=>e("div",{children:[e("h1",{children:"표시(display)와 반응형 key"}),e("p",{children:["표시는 ",e("strong",{children:"관찰자 한 명에게 속한 상태"}),"입니다. placeholder, 선택, 비교 — 어느 것도 공유 캐시에 들어가지 않습니다. 한 key를 보는 두 화면이 서로 다르게 보여 주고 싶을 수 있기 때문입니다."]}),e("p",{children:["따로 여는 객체가 아닙니다. ",e("code",{children:"select"}),","," ",e("code",{children:"placeholderData"}),", ",e("code",{children:"equals"}),"는 조회의 옵션이고, 그 결과가 핸들의 ",e("code",{children:"display"}),"입니다."]}),e("h2",{children:"display"}),e(t,{language:"typescript",code:`const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
  placeholderData: previewAccount,
  select: account => account.address.city,
});

account.display.data.value;              // 이 관찰자의 placeholder 또는 선택된 값
await account.load();                    // 명시적 READ
account.ref.address.city.value = 'Busan'; // 공유 resource를 편집한다
account.dispose();`}),e("p",{children:["한 핸들이 둘을 다 듭니다. ",e("code",{children:"ref"}),"는 편집하는 자원이고"," ",e("code",{children:"display"}),"는 그리는 것입니다. 편집은 표시를 지나지 않습니다 — 표시는 선택된 문자열일 수도, 서버에 없던 placeholder일 수도 있고, 둘 다 되돌려 쓸 수 있는 것이 아닙니다."]}),e("h3",{children:"어휘는 하나입니다"}),e("p",{children:[e("code",{children:"display"}),"와 ",e("code",{children:"watchDisplay"}),"는"," ",e("strong",{children:"읽기 전용"}),"이고, 상태는 조회 status에 다섯 필드를 더한 것입니다. status 필드는 이름이 그대로라 두 번 배우지 않습니다."]}),e(t,{language:"typescript",code:`account.display.data.value;          // 선택된 값, 또는 undefined
account.display.isPlaceholder.value; // placeholderData를 보이는 중
account.display.errorSource.value;   // 'query' | 'select' | 'source' | null
account.display.queryKey.value;      // ['account', 1]
account.display.enabled.value;       // 반응형 key가 아무것도 가리키지 않을 때만 false

account.display.status.value;        // 'pending' | 'success' | 'error'
account.display.fetchStatus.value;   // account.status.fetchStatus와 같은 필드
account.display.dirty.value;         // ...status의 모든 필드가 이렇게 있습니다`}),e("p",{children:[e("code",{children:"phase"}),"는 없습니다. ",e("code",{children:"status"}),"에"," ",e("code",{children:"'placeholder'"}),"를 더한 값이었고, 그 사실은"," ",e("code",{children:"isPlaceholder"}),"가 이미 들고 있었습니다. 예전 네 단어가 필요하면 유도하면 됩니다."]}),e(t,{language:"typescript",code:`const phase = account.display.isPlaceholder.value
  ? 'placeholder'
  : account.display.status.value;`}),e("p",{children:[e("code",{children:"display"}),"는 처음 건드릴 때 만들어집니다. 자원만 편집하는 소비자는 표시의 비용을 지지 않습니다."]}),e("h3",{children:"placeholder와 select"}),e("ul",{children:[e("li",{children:["placeholder는 관찰자마다 따로입니다. ",e("code",{children:"dehydrate()"}),"나 편집 가능한 resource에 들어가지 않고, 첫 READ가 실패하면 사라집니다."]}),e("li",{children:"재조회 실패는 placeholder로 떨어지지 않고 이전에 불러온 데이터를 유지합니다."}),e("li",{children:[e("code",{children:"select"}),"는 현재 로컬 편집을 봅니다. 다만 그 결과가 캐시된 조회 모양을 대신하지는 않습니다."]}),e("li",{children:["선택값 비교는 ",e("code",{children:"equals"}),"로 바꿀 수 있습니다(기본"," ",e("code",{children:"Object.is"}),"). 선택이나 비교가 실패하면"," ",e("strong",{children:"그 관찰자만"})," 오류가 되고 공유 조회는 그대로입니다."," ",e("code",{children:"equals"}),"가 같다고 답하면 이전 선택값을 그대로 두므로"," ",e("code",{children:"data"}),"를 보는 구독이 깨어나지 않습니다."]})]}),e("p",{children:["고정 key는 스스로 READ를 시작하지 ",e("strong",{children:"않습니다"}),"."]}),e("h2",{children:"반응형 key"}),e("p",{children:["key가 바뀌는 경우 — 선택된 id, 페이지 번호, 의존 조회 — 에는"," ",e("code",{children:"query"}),"에 key 대신 ",e("code",{children:"state-ref"})," 원본을 줍니다."]}),e(t,{language:"typescript",code:`import { create } from 'state-ref';

const input = create({ accountId: null as number | null, enabled: false });

const live = client.query({
  source: input.watch,
  resolve: ({ accountId, enabled }) =>
    accountId === null
      ? null
      : {
          queryKey: ['account', accountId],
          queryFn: ({ signal }) => api.readAccount(accountId, { signal }),
          enabled,
        },
  select: account => account.address.city,
});

input.updateRef.accountId.value = 1;
input.updateRef.enabled.value = true; // 자동으로 READ를 시작한다

live.display.data.value;     // 현재 key의 선택값만
live.display.queryKey.value; // ['account', 1]
live.display.enabled.value;

// 기준이 로드된 뒤
live.ref.address.city.value = 'Busan';

live.dispose();`}),e("p",{children:[e("code",{children:"null"}),"을 답하거나 ",e("code",{children:"enabled: false"}),"이면 표시를 비우고 현재 조회를 놓습니다. ",e("code",{children:"display"}),"는 핸들의 수명 내내 같은 관찰점이며, 활성 key가 없을 때도 ",e("code",{children:"enabled"}),"와"," ",e("code",{children:"queryKey"}),"를 답합니다."]}),e("p",{children:["그 상태에서 ",e("code",{children:"ref"}),", ",e("code",{children:"watch"}),", ",e("code",{children:"status"}),"와 조작들은 ",e("code",{children:"This query has no active key."}),"로 던집니다. 자원에 손을 뻗기 전에 ",e("code",{children:"display.enabled"}),"를 확인하세요."]}),e("h3",{children:"key가 바뀔 때 일어나는 일"}),e("ul",{children:[e("li",{children:"아래의 조회가 해제됩니다. 이전 key에서 손에 든 ref는 이후 모든 접근을 거절합니다."}),e("li",{children:[e("strong",{children:"주인이 없어진"})," 진행 중 READ는 abort되고 늦은 결과를 기준에 넣지 못합니다."]}),e("li",{children:[e("strong",{children:"같은 key를 든 다른 소유자가 있으면"})," 공유 READ는 계속 돌고, 그 결과는 그 소유자의 표시로 갑니다 — 내 표시가 아닙니다."]}),e("li",{children:"원본이 다시 발행되면 key가 같아도 새 옵션으로 재연결합니다."})]}),e("p",{children:["기억할 것은 세 번째입니다. 이전 READ가 취소되는지는"," ",e("strong",{children:"그 key를 아직 보고 있는 사람이 있는지"}),"로 갈립니다."]}),e("h2",{children:"커넥터"}),e("p",{children:"커넥터마다 읽기 전용 표시 연결이 있어서, 표시가 setter를 내주는 일은 없습니다."}),e(t,{language:"typescript",code:`import { connectReactView } from '@stateref/connect-react';

const useLive = connectReactView(live.watchDisplay);

function CityDisplay() {
  const state = useLive();
  return <span>{state.data.value ?? '-'}</span>;
}`}),e("p",{children:[e("code",{children:"connectPreactView"}),", ",e("code",{children:"connectVueView"}),","," ",e("code",{children:"connectSvelteView"}),", ",e("code",{children:"connectSolidView"}),"도 같습니다."]}),e("p",{children:[e("strong",{children:"커넥터의 언마운트는 그 컴포넌트의 구독만 끝냅니다."})," ","핸들은 그것을 소유한 쪽이 ",e("code",{children:"live.dispose()"}),"로 놓습니다. 두 컴포넌트가 한 표시를 볼 수 있고, 한 화면을 닫는다고 다른 화면의 데이터가 사라지지 않습니다."]}),e("h2",{children:"페이지네이션"}),e("p",{children:["번호 페이지는 원본이 답하는 key에 페이지를 넣습니다. 그러면 페이지마다 자기 캐시 항목을 가집니다. ",e("code",{children:"placeholderData"}),"는 새 key의 미리보기일 뿐 그 페이지의 서버 기준이 되지 않습니다. 같은 key에"," ",e("code",{children:"prefetch"}),", ",e("code",{children:"fetch"}),", ",e("code",{children:"ensure"}),"로 페이지를 준비할 수 있습니다."]}),e("p",{children:["쌓이는 목록은 ",e("code",{children:"client.infiniteQuery"}),"를 씁니다 —"," ",e("a",{href:"#/ko/guide/sync-infinite",children:"무한 조회"}),"를 보세요. 같은 표시 옵션을 받고, 페이지는 읽기 전용이며, ",e("strong",{children:"고정 key만"})," ","받습니다. 반응형 key의 무한 조회 대응물은 없습니다."]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/sync-query",children:"query와 resource"})," — 표시가 보여 주는 공유 기준"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-refetch",children:"자동 재조회"})," — 활성 반응형 key가 첫 로드를 수행합니다"]}),e("li",{children:[e("a",{href:"#/ko/guide/custom-connector",children:"커스텀 커넥터"})," — 표시 연결에 필요한 ",e("code",{children:"Watch"})," 모양"]})]})]})),ni=u(()=>()=>e("div",{children:[e("h1",{children:"Automatic Refetch"}),e("p",{children:["Focus, reconnect and polling policies become active"," ",e("strong",{children:["after a handle's first ",e("code",{children:"load()"})," or ",e("code",{children:"refetch()"})]}),". An active ",e("a",{href:"#/guide/sync-view",children:"reactive key"})," performs that first load itself. Nothing polls a query you never read."]}),e("h2",{children:"The Environment"}),e("p",{children:["The package does not read browser globals on its own. Focus and connectivity arrive through a ",e("code",{children:"SyncEnvironment"})," you inject into the client, and the browser adapter must be called where browser globals actually exist."]}),e(t,{language:"typescript",code:`import { createBrowserSyncEnvironment, createSyncClient } from '@stateref/sync';

const environment = createBrowserSyncEnvironment();
const client = createSyncClient({ environment });`}),e("p",{children:"Without an environment there are no focus or reconnect events at all, and polling treats the host as focused and online. An SSR client creates neither event subscriptions nor polling timers."}),e("h2",{children:"Policies"}),e(t,{language:"typescript",code:`const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
  staleTime: 30_000,

  refetchOnFocus: true,          // default: stale data only
  refetchOnReconnect: 'always',  // include fresh data
  refetchInterval: 60_000,       // opt-in polling
  refetchIntervalInBackground: false, // default
});

await account.load(); // the policies start here`}),e("ul",{children:[e("li",{children:[e("code",{children:"true"})," refetches only when the data is stale;"," ",e("code",{children:"'always'"})," refetches even fresh data; ",e("code",{children:"false"})," ","disables the policy."]}),e("li",{children:"Events run only while the environment is focused. Online modes also require connectivity."}),e("li",{children:["Polling is opt-in and pauses in the background unless"," ",e("code",{children:"refetchIntervalInBackground"})," says otherwise."]})]}),e("h2",{children:"Sharing and Blocking"}),e("ul",{children:[e("li",{children:["Same-key observers and an already running READ share"," ",e("strong",{children:"one request"}),"."]}),e("li",{children:"Automatic results use the normal rebase rules: your local edits stay, and an overlapping server change becomes a conflict."}),e("li",{children:[e("strong",{children:"Linked WRITEs block automatic READs"})," on that query - the baseline is being decided by an operation that has not answered."]})]}),e("h2",{children:"Cleanup"}),e("p",{children:"Disposing the last started observer removes the environment subscription, and disposing each handle clears its polling timer."}),e("h2",{children:"Network Mode"}),e("p",{children:"Each query picks how it behaves while the host is offline."}),e(t,{language:"typescript",code:`networkMode: 'online'       // the default
networkMode: 'always'
networkMode: 'offlineFirst'`}),e("ul",{children:[e("li",{children:[e("strong",{children:e("code",{children:"'online'"})})," ","- an offline READ stays pending with"," ",e("code",{children:"status.fetchStatus.value === 'paused'"})," and resumes on reconnect."]}),e("li",{children:[e("strong",{children:e("code",{children:"'always'"})})," ","- runs and retries offline. Its default reconnect-refetch policy is"," ",e("code",{children:"false"}),", though an explicit ",e("code",{children:"refetchOnReconnect"})," ","can enable it. It can also refetch on focus or poll while offline."]}),e("li",{children:[e("strong",{children:e("code",{children:"'offlineFirst'"})})," ","- tries the query function once while offline, which allows a local cache hit, then pauses a failed retry until reconnect."]})]}),e("p",{children:"A paused request keeps its previous data and local edits. Invalidation or disposal cancels the wait. SSR treats the environment as online."}),e("p",{children:[e("code",{children:"navigator.onLine"})," is only a hint, which is why the environment is injectable: a host that knows better can say so. A query that needs no network at all can use ",e("code",{children:"'always'"}),"."]}),e("h2",{children:"Mutations Are Not Covered by This"}),e("p",{children:["Mutations keep their own explicit retry and unknown-result rules - an"," ",e("code",{children:"unknown"})," write is never resent automatically, whatever the network mode says. For offline commands, use the explicit queue in"," ",e("a",{href:"#/guide/sync-persistence",children:"Persistence and SSR"}),"."]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/sync-query",children:"query and resource"})," - what a rebase does to your edits"]}),e("li",{children:[e("a",{href:"#/guide/sync-observation",children:"Observation"})," - counting environment listeners"]}),e("li",{children:[e("a",{href:"#/guide/sync-mutation",children:"mutation and link"})," - why a linked WRITE blocks a READ"]})]})]})),ci=u(()=>()=>e("div",{children:[e("h1",{children:"자동 재조회"}),e("p",{children:["focus·reconnect·polling 정책은"," ",e("strong",{children:["핸들의 첫 ",e("code",{children:"load()"})," 또는 ",e("code",{children:"refetch()"})," 이후에"]})," ","활성화됩니다. 활성 ",e("a",{href:"#/ko/guide/sync-view",children:"반응형 key"}),"는 그 첫 로드를 스스로 합니다. 한 번도 읽지 않은 조회를 polling하는 일은 없습니다."]}),e("h2",{children:"environment"}),e("p",{children:["이 패키지는 브라우저 전역을 스스로 읽지 않습니다. focus와 연결 상태는 client에 주입하는 ",e("code",{children:"SyncEnvironment"}),"를 통해 들어오고, 브라우저 어댑터는 브라우저 전역이 실제로 있는 곳에서 호출해야 합니다."]}),e(t,{language:"typescript",code:`import { createBrowserSyncEnvironment, createSyncClient } from '@stateref/sync';

const environment = createBrowserSyncEnvironment();
const client = createSyncClient({ environment });`}),e("p",{children:"environment가 없으면 focus·reconnect 사건 자체가 없고, polling은 호스트를 focused·online으로 취급합니다. SSR client는 사건 구독도 polling 타이머도 만들지 않습니다."}),e("h2",{children:"정책"}),e(t,{language:"typescript",code:`const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.readAccount(1, { signal }),
  staleTime: 30_000,

  refetchOnFocus: true,          // 기본값: stale일 때만
  refetchOnReconnect: 'always',  // 신선한 데이터도 다시 읽는다
  refetchInterval: 60_000,       // opt-in polling
  refetchIntervalInBackground: false, // 기본값
});

await account.load(); // 정책은 여기서 시작한다`}),e("ul",{children:[e("li",{children:[e("code",{children:"true"}),"는 데이터가 stale일 때만, ",e("code",{children:"'always'"}),"는 신선해도 다시 읽습니다. ",e("code",{children:"false"}),"는 그 정책을 끕니다."]}),e("li",{children:"사건은 environment가 focused인 동안에만 돕니다. online 모드는 연결까지 필요합니다."}),e("li",{children:["polling은 opt-in이고, ",e("code",{children:"refetchIntervalInBackground"}),"로 달리 말하지 않는 한 백그라운드에서 멈춥니다."]})]}),e("h2",{children:"공유와 차단"}),e("ul",{children:[e("li",{children:["같은 key의 관찰자들과 이미 돌고 있는 READ는 ",e("strong",{children:"요청 하나"}),"를 공유합니다."]}),e("li",{children:"자동 결과도 평범한 rebase 규칙을 씁니다. 로컬 편집은 남고, 겹치는 서버 변경은 충돌이 됩니다."}),e("li",{children:[e("strong",{children:"연결된 WRITE는 그 조회의 자동 READ를 막습니다"})," — 아직 답하지 않은 작업이 기준을 정하는 중이기 때문입니다."]})]}),e("h2",{children:"정리"}),e("p",{children:"마지막으로 시작한 관찰자를 해제하면 environment 구독이 사라지고, 핸들을 해제하면 그 polling 타이머가 정리됩니다."}),e("h2",{children:"network mode"}),e("p",{children:"조회마다 호스트가 오프라인일 때의 동작을 고릅니다."}),e(t,{language:"typescript",code:`networkMode: 'online'       // 기본값
networkMode: 'always'
networkMode: 'offlineFirst'`}),e("ul",{children:[e("li",{children:[e("strong",{children:e("code",{children:"'online'"})})," ","— 오프라인 READ는 ",e("code",{children:"status.fetchStatus.value === 'paused'"}),"로 대기하고 재연결 시 재개합니다."]}),e("li",{children:[e("strong",{children:e("code",{children:"'always'"})})," ","— 오프라인에서도 실행하고 재시도합니다. 기본 재연결 재조회 정책은"," ",e("code",{children:"false"}),"지만 ",e("code",{children:"refetchOnReconnect"}),"를 명시하면 켤 수 있습니다. 오프라인에서 focus 재조회나 polling도 할 수 있습니다."]}),e("li",{children:[e("strong",{children:e("code",{children:"'offlineFirst'"})})," ","— 오프라인에서 조회 함수를 한 번 시도해 로컬 캐시 적중을 허용하고, 실패한 재시도는 재연결까지 멈춥니다."]})]}),e("p",{children:"멈춘 요청은 앞선 데이터와 로컬 편집을 그대로 지킵니다. 무효화나 해제가 그 대기를 취소합니다. SSR은 environment를 online으로 취급합니다."}),e("p",{children:[e("code",{children:"navigator.onLine"}),"은 힌트일 뿐이고, environment를 주입 가능하게 둔 이유가 그것입니다 — 더 잘 아는 호스트가 그렇게 말할 수 있습니다. 네트워크가 전혀 필요 없는 조회는 ",e("code",{children:"'always'"}),"를 쓰면 됩니다."]}),e("h2",{children:"mutation은 여기에 해당하지 않는다"}),e("p",{children:["mutation은 자기만의 명시적 재시도와 unknown 결과 규칙을 지킵니다. network mode가 무엇이든 ",e("code",{children:"unknown"})," 쓰기는 자동으로 다시 보내지 않습니다. 오프라인 명령은"," ",e("a",{href:"#/ko/guide/sync-persistence",children:"영속화와 SSR"}),"의 명시적 큐를 쓰세요."]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/sync-query",children:"query와 resource"})," - rebase가 편집에 하는 일"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-observation",children:"관측"})," - environment listener 세기"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-mutation",children:"mutation과 link"})," - 연결된 WRITE가 READ를 막는 이유"]})]})]})),ai=u(()=>()=>e("div",{children:[e("h1",{children:"Persistence and SSR"}),e("p",{children:["There are four separate storage stories here, and they are deliberately not one feature: an SSR cache transfer, a clean-baseline snapshot, a local-edit recovery snapshot, and an offline command queue. Each answers a different question, and each wants"," ",e("strong",{children:"its own storage key with one writer"}),"."]}),e("h2",{children:"SSR Cache Transfer"}),e("p",{children:["Transfer only ",e("strong",{children:"settled, clean"})," server baselines between two separate clients."]}),e(t,{language:"typescript",code:`const server = createSyncClient({ ssr: true });
const source = server.query(options);
await source.load();
const snapshot = JSON.parse(JSON.stringify(server.dehydrate()));

const browser = createSyncClient();
browser.hydrate(snapshot); // before creating any query handles
const restored = browser.query(options);`}),e("p",{children:"The snapshot preserves query keys, server data, freshness times, invalidation and editability. Data must be JSON-compatible."}),e("p",{children:[e("code",{children:"dehydrate()"})," ",e("strong",{children:"rejects"})," local edits, in-flight READ or linked WRITE operations, and unconfirmed WRITE outcomes rather than silently dropping them. That refusal is the point: a snapshot that quietly lost an unsaved edit would be worse than no snapshot."]}),e("p",{children:[e("code",{children:"status.unconfirmed"})," stays true after an unknown WRITE outcome or a failed post-WRITE reconciliation, until a successful READ or an accepted known server value. Such entries are retained through GC."]}),e("p",{children:["This is cache transfer - ",e("strong",{children:"not"})," local-edit persistence and"," ",e("strong",{children:"not"})," offline mutation recovery."]}),e("h2",{children:"Clean Baseline Snapshot"}),e("p",{children:"Save and restore are explicit, and restore requires a new, empty client."}),e(t,{language:"typescript",code:`import { saveSyncSnapshot, restoreSyncSnapshot } from '@stateref/sync';

const options = { key: 'account-baseline', buster: 'api-v1', maxAge: 60_000 };

await saveSyncSnapshot(client, localStorage, options);

const restored = createSyncClient();
await restoreSyncSnapshot(restored, localStorage, options);`}),e("ul",{children:[e("li",{children:[e("code",{children:"saveSyncSnapshot"})," rejects dirty resources, pending READs, linked WRITEs and unconfirmed baselines."]}),e("li",{children:["Expired or differently busted snapshots are"," ",e("strong",{children:"ignored without deleting"})," the stored data."]}),e("li",{children:["A malformed snapshot throws ",e("em",{children:"before"})," changing the client."]}),e("li",{children:[e("code",{children:"localStorage"})," is only an example; ",e("code",{children:"SyncStorage"})," ","also accepts asynchronous methods. Scope the key to the current user and data partition."]})]}),e("h2",{children:"Local Recovery Snapshot"}),e("p",{children:"To keep local edits and an unconfirmed baseline, use the separate schema 2 recovery snapshot. It carries the server baseline, the displayed value, change IDs and conflict origins."}),e(t,{language:"typescript",code:`import {
  saveLocalSyncSnapshot,
  restoreLocalSyncSnapshot,
} from '@stateref/sync';

const localOptions = { key: 'account-local', buster: 'api-v1', maxAge: 60_000 };

await saveLocalSyncSnapshot(client, localStorage, localOptions);

const recovered = createSyncClient();
await restoreLocalSyncSnapshot(recovered, localStorage, localOptions);`}),e("p",{children:"Restore starts no READ and no WRITE. Recreate the query handle with its query function; a later READ rebases the restored edit through the normal conflict rules. An unconfirmed WRITE stays unconfirmed until a successful READ or an explicit known server value."}),e("p",{children:["A saved local snapshot does ",e("strong",{children:"not"})," contain an active mutation's DTO or submission record, so it cannot resume a linked WRITE."]}),e("h2",{children:"A Persisted Linked Submission"}),e("p",{children:"To survive a restart in the middle of a save, keep the DTO and the recovery snapshot together under their own key."}),e(t,{language:"typescript",code:`import { openPersistedLinkedMutation } from '@stateref/sync';

const linked = await openPersistedLinkedMutation({
  storage: localStorage,
  key: 'account-linked',
  buster: 'api-v1',
  isOnline: () => navigator.onLine,
});

await linked.stage(client, {
  id: 'city-42',
  input: { city: account.ref.address.city.value },
  idempotencyKey: 'city-42',
  links: [
    {
      query: account,
      ids: account
        .changes()
        .filter(change => change.path.join('.') === 'address.city')
        .map(change => change.id),
      accept: 'submitted',
    },
    { query: preferences, accept: 'refetch', onReject: 'remove' },
  ],
});

// null while offline; the handles must match the staged keys, in any order
const outcome = await linked.send(client, [account, preferences], save);`}),e("p",{children:[e("code",{children:"ids"})," are change-row IDs - the same ones"," ",e("code",{children:"capture(ids)"})," takes. ",e("code",{children:"stage"})," captures them for you, and a link without ",e("code",{children:"ids"})," submits every current row. Note the string acceptance names (",e("code",{children:"'submitted'"}),"): this API serializes them, while ",e("code",{children:"mutation.run"})," takes"," ",e("code",{children:"{ kind: 'submitted' }"}),". What a submission is and when it goes stale: ",e("a",{href:"#/guide/sync-lifecycle",children:"Edit Lifecycle"}),"."]}),e("p",{children:[e("code",{children:"send"})," rechecks every link first and starts no WRITE if any one of them changed. It writes an ",e("code",{children:"inFlight"})," marker and an unconfirmed recovery snapshot ",e("em",{children:"before"})," calling"," ",e("code",{children:"mutationFn"}),". A failed marker write prevents the WRITE entirely."]}),e("p",{children:[e("strong",{children:["On restart an ",e("code",{children:"inFlight"})," record becomes"," ",e("code",{children:"unknown"}),"."]})," ","Inspect and reconcile it with the server before calling"," ",e("code",{children:"discard()"}),". It is never replayed automatically."]}),e("p",{children:["Each link carries a serializable ",e("code",{children:"none"}),","," ",e("code",{children:"submitted"})," or ",e("code",{children:"refetch"})," acceptance and its own rejection policy. ",e("code",{children:"response.select"})," needs a function, so that acceptance still requires a direct ",e("code",{children:"mutation.run"}),"."]}),e("h3",{children:"checkpoint"}),e("p",{children:["Open the record with ",e("code",{children:"checkpoint: true"})," to keep edits made"," ",e("em",{children:"during"})," the WRITE durable as well. The snapshot is refreshed on every local change, bursts collapse into one trailing write, and a failed checkpoint leaves the previous snapshot without cancelling the WRITE. It costs one storage write per change, so it is off by default."]}),e("h2",{children:"Offline Command Queue"}),e("p",{children:"For an independent command, queue a JSON DTO with a server-supported idempotency key."}),e(t,{language:"typescript",code:`import { openPersistedMutationQueue } from '@stateref/sync';

const send = client.mutation({
  mutationFn: (input: { note: string }, { idempotencyKey }) =>
    api.sendNote(input, { idempotencyKey }),
});

const queue = await openPersistedMutationQueue({
  storage: localStorage,
  key: 'pending-notes',
  buster: 'api-v1',
  maxAge: 24 * 60 * 60 * 1000,
  commands: { send },
  isOnline: () => navigator.onLine,
});

await queue.enqueue({
  id: 'note-42',
  command: 'send',
  input: { note: 'Hello' },
  idempotencyKey: 'note-42',
});

await queue.resume();

// or let a reconnect call resume() for you
const stopAutoResume = queue.autoResume(environment, {
  onSettled: results => console.log(results.map(item => item.result.kind)),
  onError: error => report(error),
});`}),e("p",{children:[e("code",{children:"autoResume"})," automates only ",e("strong",{children:"when"})," ",e("code",{children:"resume()"})," runs, never which jobs may run. It reacts to"," ",e("code",{children:"reconnect"})," rather than focus, checks"," ",e("code",{children:"environment.isOnline()"})," first, and runs once immediately if it attaches while already online. Runs never overlap. An automatic resume never calls ",e("code",{children:"retryUnknown"}),"."]}),e("p",{children:"A linked submission is deliberately excluded from the queue: sending one needs live query handles and a local state only the app knows is still current."}),e("h3",{children:"Unknown jobs block the queue"}),e("ul",{children:[e("li",{children:["The queue writes an ",e("code",{children:"inFlight"})," marker before every WRITE. On restart that job becomes ",e("code",{children:"unknown"}),", and it and later jobs are held."]}),e("li",{children:[e("code",{children:"retryUnknown(id)"})," reuses the key - use it only when the server guarantees idempotency for that key, or after reconciling with the server."]}),e("li",{children:[e("code",{children:"discard(id)"})," is explicit, and cannot cancel an in-flight server WRITE."]}),e("li",{children:["Commands older than ",e("code",{children:"maxAge"})," stay queued and block later jobs until you review or discard them. They are not dropped."]})]}),e("p",{children:"The queue does not serialize resource submissions, local edits, mutation callbacks or query handles. Recreate the command registry for each new client, and invalidate or refetch affected queries after a successful command."}),e("h2",{children:"One Writer Per Key"}),e("p",{children:"Use separate storage keys for linked submissions, clean baselines, local snapshots and standalone commands - and exactly one writer for each."}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/sync-mutation",children:"mutation and link"})," - what"," ",e("code",{children:"unknown"})," and ",e("code",{children:"sync-error"})," mean"]}),e("li",{children:[e("a",{href:"#/guide/sync-refetch",children:"Automatic refetch"})," - network mode while offline"]}),e("li",{children:[e("a",{href:"#/api/sync",children:"Sync API"})," - the full surface"]})]})]})),ii=u(()=>()=>e("div",{children:[e("h1",{children:"영속화와 SSR"}),e("p",{children:["여기에는 네 가지 저장 이야기가 있고, 일부러 하나의 기능으로 묶지 않았습니다. SSR 캐시 전송, 깨끗한 기준 스냅숏, 로컬 편집 복구 스냅숏, 오프라인 명령 큐. 각각 다른 질문에 답하고, 각각"," ",e("strong",{children:"자기 저장 키와 단일 작성자"}),"를 원합니다."]}),e("h2",{children:"SSR 캐시 전송"}),e("p",{children:["서로 다른 두 client 사이에는 ",e("strong",{children:"종료되고 깨끗한"})," 서버 기준만 옮깁니다."]}),e(t,{language:"typescript",code:`const server = createSyncClient({ ssr: true });
const source = server.query(options);
await source.load();
const snapshot = JSON.parse(JSON.stringify(server.dehydrate()));

const browser = createSyncClient();
browser.hydrate(snapshot); // 조회 핸들을 만들기 전에
const restored = browser.query(options);`}),e("p",{children:"스냅숏은 조회 key, 서버 데이터, 신선도 시각, 무효화, 편집 가능 여부를 보존합니다. 데이터는 JSON 호환이어야 합니다."}),e("p",{children:[e("code",{children:"dehydrate()"}),"는 로컬 편집, 진행 중인 READ나 연결 WRITE, 확인되지 않은 WRITE 결과를 조용히 버리는 대신"," ",e("strong",{children:"거절합니다."})," 그 거절이 핵심입니다. 저장되지 않은 편집을 조용히 잃는 스냅숏은 스냅숏이 없는 것보다 나쁩니다."]}),e("p",{children:[e("code",{children:"status.unconfirmed"}),"는 unknown WRITE 결과나 실패한 사후 화해 이후, 성공한 READ나 수용된 알려진 서버 값이 나올 때까지 true로 남습니다. 그런 항목은 GC를 거쳐도 유지됩니다."]}),e("p",{children:["이것은 캐시 전송입니다. 로컬 편집 영속화가 ",e("strong",{children:"아니고"})," ","오프라인 mutation 복구도 ",e("strong",{children:"아닙니다."})]}),e("h2",{children:"깨끗한 기준 스냅숏"}),e("p",{children:"저장과 복원은 명시적인 작업이고, 복원은 비어 있는 새 client를 요구합니다."}),e(t,{language:"typescript",code:`import { saveSyncSnapshot, restoreSyncSnapshot } from '@stateref/sync';

const options = { key: 'account-baseline', buster: 'api-v1', maxAge: 60_000 };

await saveSyncSnapshot(client, localStorage, options);

const restored = createSyncClient();
await restoreSyncSnapshot(restored, localStorage, options);`}),e("ul",{children:[e("li",{children:[e("code",{children:"saveSyncSnapshot"}),"은 dirty resource, 진행 중 READ, 연결 WRITE, 확인되지 않은 기준을 거절합니다."]}),e("li",{children:["만료됐거나 buster가 다른 스냅숏은"," ",e("strong",{children:"저장된 데이터를 지우지 않고 무시"}),"합니다."]}),e("li",{children:["형식이 깨진 스냅숏은 client를 바꾸기 ",e("em",{children:"전에"})," 던집니다."]}),e("li",{children:[e("code",{children:"localStorage"}),"는 예시일 뿐이고 ",e("code",{children:"SyncStorage"}),"는 비동기 메서드도 받습니다. 키는 현재 사용자와 데이터 파티션 범위로 한정하세요."]})]}),e("h2",{children:"로컬 복구 스냅숏"}),e("p",{children:"로컬 편집과 확인되지 않은 기준을 지키려면 별도의 schema 2 복구 스냅숏을 쓰세요. 서버 기준, 표시 값, 변경 ID, 충돌 출처를 담습니다."}),e(t,{language:"typescript",code:`import {
  saveLocalSyncSnapshot,
  restoreLocalSyncSnapshot,
} from '@stateref/sync';

const localOptions = { key: 'account-local', buster: 'api-v1', maxAge: 60_000 };

await saveLocalSyncSnapshot(client, localStorage, localOptions);

const recovered = createSyncClient();
await restoreLocalSyncSnapshot(recovered, localStorage, localOptions);`}),e("p",{children:"복원은 READ도 WRITE도 시작하지 않습니다. 조회 함수와 함께 조회 핸들을 다시 만드세요. 이후의 READ가 복원된 편집을 평범한 충돌 규칙으로 rebase합니다. 확인되지 않은 WRITE는 성공한 READ나 명시적인 알려진 서버 값이 나올 때까지 그대로 남습니다."}),e("p",{children:["저장된 로컬 스냅숏에는 진행 중이던 mutation의 DTO나 제출 기록이"," ",e("strong",{children:"없으므로"}),", 연결 WRITE를 재개할 수 없습니다."]}),e("h2",{children:"영속화한 연결 제출"}),e("p",{children:"저장 도중의 재시작을 견디려면 DTO와 복구 스냅숏을 자기 키 아래에 함께 두세요."}),e(t,{language:"typescript",code:`import { openPersistedLinkedMutation } from '@stateref/sync';

const linked = await openPersistedLinkedMutation({
  storage: localStorage,
  key: 'account-linked',
  buster: 'api-v1',
  isOnline: () => navigator.onLine,
});

await linked.stage(client, {
  id: 'city-42',
  input: { city: account.ref.address.city.value },
  idempotencyKey: 'city-42',
  links: [
    {
      query: account,
      ids: account
        .changes()
        .filter(change => change.path.join('.') === 'address.city')
        .map(change => change.id),
      accept: 'submitted',
    },
    { query: preferences, accept: 'refetch', onReject: 'remove' },
  ],
});

// 오프라인이면 null. 핸들은 staged key와 맞아야 하며 순서는 상관없다
const outcome = await linked.send(client, [account, preferences], save);`}),e("p",{children:[e("code",{children:"ids"}),"는 변경 줄 ID입니다 — ",e("code",{children:"capture(ids)"}),"가 받는 것과 같습니다. ",e("code",{children:"stage"}),"가 대신 capture하고, ",e("code",{children:"ids"}),"가 없는 link는 현재의 모든 줄을 제출합니다. 수용 이름이 문자열(",e("code",{children:"'submitted'"}),")인 것에 주의하세요. 이 API는 그것을 직렬화하고,"," ",e("code",{children:"mutation.run"}),"은 ",e("code",{children:"{ kind: 'submitted' }"}),"를 받습니다. 제출이 무엇이고 언제 낡는지는"," ",e("a",{href:"#/ko/guide/sync-lifecycle",children:"편집의 생애"}),"를 보세요."]}),e("p",{children:[e("code",{children:"send"}),"는 모든 link를 먼저 다시 확인하고, 하나라도 바뀌었으면 WRITE를 시작하지 않습니다. ",e("code",{children:"mutationFn"}),"을 부르기"," ",e("em",{children:"전에"})," ",e("code",{children:"inFlight"})," 표시와 확인되지 않은 복구 스냅숏을 씁니다. 그 표시 쓰기가 실패하면 WRITE 자체가 일어나지 않습니다."]}),e("p",{children:[e("strong",{children:["재시작하면 ",e("code",{children:"inFlight"})," 기록은 ",e("code",{children:"unknown"}),"이 됩니다."]})," ",e("code",{children:"discard()"}),"를 부르기 전에 서버와 대조해 화해하세요. 절대 자동으로 재생되지 않습니다."]}),e("p",{children:["각 link는 직렬화 가능한 ",e("code",{children:"none"}),"·",e("code",{children:"submitted"}),"·",e("code",{children:"refetch"})," 수용 정책과 자기 거절 정책을 들고 있습니다."," ",e("code",{children:"response.select"}),"는 함수가 필요하므로 그 수용은 여전히 직접"," ",e("code",{children:"mutation.run"}),"을 요구합니다."]}),e("h3",{children:"checkpoint"}),e("p",{children:[e("code",{children:"checkpoint: true"}),"로 열면 WRITE가 도는 ",e("em",{children:"동안"})," 한 편집까지 지속시킵니다. 로컬 변경마다 스냅숏을 갱신하고, 몰아치는 변경은 마지막 한 번의 쓰기로 합쳐지며, checkpoint가 실패해도 이전 스냅숏이 남고 WRITE는 취소되지 않습니다. 변경마다 저장소 쓰기가 한 번씩 드니까 기본은 꺼져 있습니다."]}),e("h2",{children:"오프라인 명령 큐"}),e("p",{children:"독립 명령은 서버가 지원하는 idempotency 키와 함께 JSON DTO를 큐에 넣습니다."}),e(t,{language:"typescript",code:`import { openPersistedMutationQueue } from '@stateref/sync';

const send = client.mutation({
  mutationFn: (input: { note: string }, { idempotencyKey }) =>
    api.sendNote(input, { idempotencyKey }),
});

const queue = await openPersistedMutationQueue({
  storage: localStorage,
  key: 'pending-notes',
  buster: 'api-v1',
  maxAge: 24 * 60 * 60 * 1000,
  commands: { send },
  isOnline: () => navigator.onLine,
});

await queue.enqueue({
  id: 'note-42',
  command: 'send',
  input: { note: 'Hello' },
  idempotencyKey: 'note-42',
});

await queue.resume();

// 또는 재연결이 resume()을 부르게 한다
const stopAutoResume = queue.autoResume(environment, {
  onSettled: results => console.log(results.map(item => item.result.kind)),
  onError: error => report(error),
});`}),e("p",{children:[e("code",{children:"autoResume"}),"이 자동화하는 것은 ",e("code",{children:"resume()"}),"이"," ",e("strong",{children:"언제"})," 도는가뿐이고, 어떤 작업이 돌아도 되는지는 절대 아닙니다. focus가 아니라 ",e("code",{children:"reconnect"}),"에 반응하고,"," ",e("code",{children:"environment.isOnline()"}),"을 먼저 확인하며, 이미 온라인인 상태에서 붙으면 즉시 한 번 돕니다. 실행은 겹치지 않습니다. 자동 재개는"," ",e("code",{children:"retryUnknown"}),"을 절대 부르지 않습니다."]}),e("p",{children:"연결 제출은 일부러 큐에서 제외했습니다. 그것을 보내려면 살아 있는 조회 핸들과, 아직 유효한지 앱만 아는 로컬 상태가 필요하기 때문입니다."}),e("h3",{children:"unknown 작업은 큐를 막는다"}),e("ul",{children:[e("li",{children:["큐는 모든 WRITE 앞에 ",e("code",{children:"inFlight"})," 표시를 씁니다. 재시작하면 그 작업이 ",e("code",{children:"unknown"}),"이 되고, 그것과 이후 작업이 붙들립니다."]}),e("li",{children:[e("code",{children:"retryUnknown(id)"}),"은 같은 키를 재사용합니다. 서버가 그 키의 멱등성을 보장하거나, 서버와 화해를 마친 뒤에만 쓰세요."]}),e("li",{children:[e("code",{children:"discard(id)"}),"는 명시적이고, 이미 나간 서버 WRITE를 취소할 수 없습니다."]}),e("li",{children:[e("code",{children:"maxAge"}),"보다 오래된 명령은 큐에 남아 이후 작업을 막습니다. 검토하거나 버릴 때까지 사라지지 않습니다."]})]}),e("p",{children:"큐는 resource 제출, 로컬 편집, mutation 콜백, 조회 핸들을 직렬화하지 않습니다. 새 client마다 명령 레지스트리를 다시 만들고, 명령이 성공하면 영향받은 조회를 무효화하거나 재조회하세요."}),e("h2",{children:"키 하나에 작성자 하나"}),e("p",{children:"연결 제출, 깨끗한 기준, 로컬 스냅숏, 독립 명령은 각각 다른 저장 키를 쓰고, 키마다 작성자는 정확히 하나여야 합니다."}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/sync-mutation",children:"mutation과 link"})," -"," ",e("code",{children:"unknown"}),"과 ",e("code",{children:"sync-error"}),"의 뜻"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-refetch",children:"자동 재조회"})," - 오프라인에서의 network mode"]}),e("li",{children:[e("a",{href:"#/ko/api/sync",children:"Sync API"})," - 전체 표면"]})]})]})),oi=u(()=>()=>e("div",{children:[e("h1",{children:"Observation"}),e("p",{children:["Tools can inspect what a client is holding without reading any query payload. This is a ",e("strong",{children:"read-only metadata boundary"})," - not a devtools or plugin compatibility API for any other library."]}),e("h2",{children:"The Cache"}),e(t,{language:"typescript",code:`const stopObserving = client.subscribeCache(event => {
  // event.type: 'added' | 'updated' | 'removed'
  console.log(event.type, event.entry.queryKey, event.entry.status);
});

const currentCache = client.inspectCache();

stopObserving();`}),e("p",{children:["Each entry carries its ",e("code",{children:"queryKey"}),", its ",e("code",{children:"kind"}),", the number of active handles (",e("code",{children:"owners"}),") and its"," ",e("code",{children:"status"}),"."]}),e("p",{children:[e("code",{children:"inspectCache()"})," reports the"," ",e("strong",{children:"current client only"}),'. Two clients holding the same key answer separately, which is what makes "per client" a checkable statement rather than an assumption.']}),e("h3",{children:"What is not in an event"}),e("p",{children:["Query data, local edits, mutation inputs and the caller-owned"," ",e("code",{children:"status.error"})," object are ",e("strong",{children:"omitted"}),". The observed field list is the evidence: if a payload ever leaked, the set of keys on the entry would visibly change."]}),e("p",{children:"Events retain their metadata from the moment of the change and arrive in order, in a microtask, after the current synchronous cache transition. Listener errors do not change query outcomes. Dispose the listener with the function it returned."}),e("h2",{children:"WRITE Operations"}),e(t,{language:"typescript",code:`const stopWatching = client.subscribeMutations(event => {
  // event.type: 'started' | 'updated' | 'settled'
  console.log(event.entry.operationId, event.entry.phase, event.entry.linkedKeys);
});

const running = client.inspectMutations();

stopWatching();`}),e("p",{children:[e("code",{children:"inspectMutations()"})," lists only operations that have"," ",e("strong",{children:"not settled yet"}),", in start order."]}),e("ul",{children:[e("li",{children:[e("code",{children:"phase"})," here is diagnostic and differs from"," ",e("code",{children:"MutationStatus.phase"}),". ",e("code",{children:"queued"})," means the operation is waiting on its ",e("code",{children:"scope"})," - it has not been sent."]}),e("li",{children:[e("code",{children:"updated"})," events report the ",e("code",{children:"queued"})," to"," ",e("code",{children:"pending"})," transition and each retry ",e("code",{children:"attempt"}),"."]}),e("li",{children:["A ",e("code",{children:"settled"})," event carries the final snapshot and"," ",e("strong",{children:"the client then drops the operation"})," - keep your own history if you need one."]}),e("li",{children:"An operation that throws before it becomes pending (a stale submission, for example) produces no event at all."})]}),e("p",{children:["The input, the response, caller-owned error objects and the"," ",e("code",{children:"idempotencyKey"})," value are omitted; ",e("code",{children:"idempotent"})," ","only reports ",e("em",{children:"whether"})," a key was supplied."]}),e("h3",{children:"A success phase is not permission to resend"}),e("p",{children:["Observing a ",e("code",{children:"success"})," phase is a diagnostic signal, never a reason to resend an ",e("code",{children:"unknown"})," or ",e("code",{children:"sync-error"})," ","operation. Those still need the explicit reconciliation described in"," ",e("a",{href:"#/guide/sync-mutation",children:"mutation and link"}),"."]}),e("h2",{children:"Separate the Watching From the Watched"}),e("p",{children:"If a panel repaints itself using the very handle it is testing, releasing that handle freezes the panel - and the frozen numbers look like a result. Keep one subscription for repainting and a different one for the thing under observation."}),e(t,{language:"typescript",code:`// lives for the whole app; only triggers a repaint
const offRepaint = client.subscribeCache(() => repaint());

// the one a "stop observing" button releases, and the one the panel counts
let offObserved = client.subscribeCache(event => {
  seen += 1;
});`}),e("p",{children:['With the split, "no events since I unsubscribed" is a claim about ',e("em",{children:"that listener"}),", because another listener in the same flow is still updating the table."]}),e("h2",{children:'owners 0 Is Not "Gone From the Cache"'}),e("p",{children:["Releasing the last handle for a key drops its ",e("code",{children:"owners"})," to zero, but the entry stays in the cache until GC or"," ",e("code",{children:"client.remove()"}),". ",e("code",{children:"client.size()"})," does not move. They are different facts, and a tool that conflates them will report a leak that is not there."]}),e(t,{language:"typescript",code:"client.remove(['account', 1]); // boolean: refused while anything holds it"}),e("p",{children:[e("code",{children:"remove()"})," answers a bare boolean. The reasons an entry is retained - owners, dirty, unconfirmed, a pending status - are composed by your app from ",e("code",{children:"inspectCache()"})," plus the query status."]}),e("h2",{children:"A Callback That Reads Nothing Registers Nothing"}),e("p",{children:["This applies to any ",e("code",{children:"watch"})," you use for measuring. A callback that never reads the state it is handed collects no dependency, is never woken again, and reports a permanent zero. Before believing a zero, check that the instrument can count to one."]}),e(t,{language:"typescript",code:`account.watchStatus(status => {
  void status.dirty.value; // read, or nothing is registered
  notices += 1;
});`}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/sync-mutation",children:"mutation and link"})," - what the phases mean"]}),e("li",{children:[e("a",{href:"#/guide/sync-refetch",children:"Automatic refetch"})," - environment listeners and polling timers"]}),e("li",{children:[e("a",{href:"#/api/plugin",children:"Plugin API"})," - the core-side seam this is built on"]})]})]})),si=u(()=>()=>e("div",{children:[e("h1",{children:"관측"}),e("p",{children:["도구는 조회 payload를 전혀 읽지 않고도 client가 무엇을 들고 있는지 볼 수 있습니다. 이것은 ",e("strong",{children:"읽기 전용 메타데이터 경계"}),"이지, 다른 라이브러리의 devtools나 플러그인 호환 API가 아닙니다."]}),e("h2",{children:"캐시"}),e(t,{language:"typescript",code:`const stopObserving = client.subscribeCache(event => {
  // event.type: 'added' | 'updated' | 'removed'
  console.log(event.type, event.entry.queryKey, event.entry.status);
});

const currentCache = client.inspectCache();

stopObserving();`}),e("p",{children:["각 항목은 ",e("code",{children:"queryKey"}),", ",e("code",{children:"kind"}),", 활성 핸들 수(",e("code",{children:"owners"}),"), ",e("code",{children:"status"}),"를 들고 있습니다."]}),e("p",{children:[e("code",{children:"inspectCache()"}),"는 ",e("strong",{children:"현재 client만"}),' 보고합니다. 같은 key를 든 두 client가 따로 답하고, 그래서 "client별"이 가정이 아니라 확인 가능한 진술이 됩니다.']}),e("h3",{children:"이벤트에 없는 것"}),e("p",{children:["조회 데이터, 로컬 편집, mutation 입력, 그리고 호출자 소유인"," ",e("code",{children:"status.error"})," 객체는 ",e("strong",{children:"빠져 있습니다."})," 관측된 필드 목록 자체가 증거입니다. payload가 샜다면 항목의 키 집합이 눈에 띄게 달라집니다."]}),e("p",{children:"이벤트는 변경 시점의 메타데이터를 그대로 들고, 현재의 동기 캐시 전이가 끝난 뒤 마이크로태스크에서 순서대로 도착합니다. listener에서 난 오류는 조회 결과를 바꾸지 않습니다. 돌려받은 함수로 listener를 해제하세요."}),e("h2",{children:"WRITE 작업"}),e(t,{language:"typescript",code:`const stopWatching = client.subscribeMutations(event => {
  // event.type: 'started' | 'updated' | 'settled'
  console.log(event.entry.operationId, event.entry.phase, event.entry.linkedKeys);
});

const running = client.inspectMutations();

stopWatching();`}),e("p",{children:[e("code",{children:"inspectMutations()"}),"는 ",e("strong",{children:"아직 종료되지 않은"})," ","작업만 시작 순서대로 나열합니다."]}),e("ul",{children:[e("li",{children:["여기의 ",e("code",{children:"phase"}),"는 진단용이고"," ",e("code",{children:"MutationStatus.phase"}),"와 다릅니다. ",e("code",{children:"queued"}),"는 그 작업이 자기 ",e("code",{children:"scope"}),"를 기다리는 중이라는 뜻입니다 — 아직 나가지 않았습니다."]}),e("li",{children:[e("code",{children:"updated"})," 이벤트는 ",e("code",{children:"queued"})," →"," ",e("code",{children:"pending"})," 전이와 재시도 ",e("code",{children:"attempt"}),"마다 옵니다."]}),e("li",{children:[e("code",{children:"settled"})," 이벤트는 마지막 스냅숏을 들고 오고,"," ",e("strong",{children:"그 뒤 client는 그 작업을 버립니다"})," — 이력이 필요하다면 직접 보관하세요."]}),e("li",{children:"pending이 되기 전에 던진 작업(예: 낡은 제출)은 이벤트를 전혀 내지 않습니다."})]}),e("p",{children:["입력, 응답, 호출자 소유 오류 객체, ",e("code",{children:"idempotencyKey"})," 값은 빠져 있습니다. ",e("code",{children:"idempotent"}),"는 키가 주어졌는지 ",e("em",{children:"여부"}),"만 알려 줍니다."]}),e("h3",{children:"success phase는 재전송 허가가 아니다"}),e("p",{children:[e("code",{children:"success"})," phase를 관측하는 것은 진단 신호일 뿐,"," ",e("code",{children:"unknown"}),"이나 ",e("code",{children:"sync-error"})," 작업을 다시 보낼 근거가 절대 아닙니다. 그것들은"," ",e("a",{href:"#/ko/guide/sync-mutation",children:"mutation과 link"}),"에 적힌 명시적 화해가 필요합니다."]}),e("h2",{children:"보는 것과 보이는 것을 분리하라"}),e("p",{children:"패널이 시험 대상인 바로 그 핸들로 자기를 다시 그린다면, 그 핸들을 놓는 순간 패널이 얼어붙습니다 — 그리고 얼어붙은 숫자는 결과처럼 보입니다. 다시 그리는 구독과 관측 대상 구독을 따로 두세요."}),e(t,{language:"typescript",code:`// 앱 수명 동안 살아 있고, 다시 그리기만 한다
const offRepaint = client.subscribeCache(() => repaint());

// "관측 해제" 버튼이 놓는 쪽이자, 패널이 세는 쪽
let offObserved = client.subscribeCache(event => {
  seen += 1;
});`}),e("p",{children:['이렇게 나누면 "해제한 뒤로 이벤트가 없다"가'," ",e("em",{children:"그 listener에 대한"})," 주장이 됩니다. 같은 흐름의 다른 listener는 표를 계속 갱신하고 있기 때문입니다."]}),e("h2",{children:'owners 0은 "캐시에서 사라짐"이 아니다'}),e("p",{children:["어떤 key의 마지막 핸들을 놓으면 ",e("code",{children:"owners"}),"가 0이 되지만, 그 항목은 GC나 ",e("code",{children:"client.remove()"})," 전까지 캐시에 남습니다."," ",e("code",{children:"client.size()"}),"는 움직이지 않습니다. 서로 다른 사실이고, 둘을 섞는 도구는 있지도 않은 누수를 보고하게 됩니다."]}),e(t,{language:"typescript",code:"client.remove(['account', 1]); // boolean: 무언가 붙잡고 있으면 거절한다"}),e("p",{children:[e("code",{children:"remove()"}),"는 맨 불리언을 답합니다. 항목이 유지되는 이유 — owners, dirty, unconfirmed, 진행 중 status — 는 앱이"," ",e("code",{children:"inspectCache()"}),"와 조회 상태로 직접 조합합니다."]}),e("h2",{children:"아무것도 읽지 않는 콜백은 아무것도 등록하지 않는다"}),e("p",{children:["계측에 쓰는 모든 ",e("code",{children:"watch"}),"에 해당합니다. 건네받은 상태를 읽지 않는 콜백은 의존성을 수집하지 않고, 다시 깨어나지 않으며, 영원히 0을 보고합니다. 0을 믿기 전에 그 계측기가 1까지 셀 수 있는지 확인하세요."]}),e(t,{language:"typescript",code:`account.watchStatus(status => {
  void status.dirty.value; // 읽어야 한다. 아니면 아무것도 등록되지 않는다
  notices += 1;
});`}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/sync-mutation",children:"mutation과 link"})," - phase의 뜻"]}),e("li",{children:[e("a",{href:"#/ko/guide/sync-refetch",children:"자동 재조회"})," - environment listener와 polling 타이머"]}),e("li",{children:[e("a",{href:"#/ko/api/plugin",children:"Plugin API"})," - 이것이 서 있는 코어 쪽 이음새"]})]})]})),li=u(()=>()=>e("div",{children:[e("h1",{children:"Manual Sync (Flux)"}),e("p",{children:[e("code",{children:"createStoreManualSync"})," lets you control when updates notify subscribers. This is useful for Flux-style action flows, batching multiple changes, or enforcing a strict “read-only in views” policy."]}),e("h2",{children:"Basic Usage"}),e(t,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';

const { watch, updateRef, sync } = createStoreManualSync({
  count: 0,
  user: { name: 'Lee' }
});

// Subscribe (reads are tracked)
watch((store, isFirst) => {
  console.log('Count:', store.count.value, 'First?', isFirst);
});

// Read-only reference for consumers
const store = watch();
console.log(store.user.name.value); // 'Lee'

// Mutate through updateRef
updateRef.count.value += 1;
updateRef.user.name.value = 'Min';

// Notify subscribers explicitly
sync();`}),e("h2",{children:"How It Works"}),e("ul",{children:[e("li",{children:[e("strong",{children:"watch"})," returns a read-only reference in manual mode"]}),e("li",{children:[e("strong",{children:"updateRef"})," is the writable reference used by actions"]}),e("li",{children:[e("strong",{children:"sync()"})," flushes changes and triggers subscriptions"]})]}),e("h2",{children:"Read-Only in Views"}),e("p",{children:["In manual sync, direct mutation from ",e("code",{children:"watch()"})," is blocked and throws an error. Always update via ",e("code",{children:"updateRef"}),"."]}),e(t,{language:"typescript",code:`const { watch, updateRef } = createStoreManualSync({ count: 0 });

const store = watch();

// ✗ Not allowed in manual sync
store.count.value = 1; // Error: direct modification is not allowed

// ✓ Allowed
updateRef.count.value = 1;`}),e("h2",{children:"Flux-Style Actions"}),e("p",{children:["Keep mutations inside action functions, then call ",e("code",{children:"sync()"})," to publish updates."]}),e(t,{language:"typescript",code:`type Profile = { john: { age: number } };

const { watch, updateRef, sync } = createStoreManualSync<Profile>({
  john: { age: 20 }
});

export const changeJohnAge = (age: number) => {
  updateRef.john.age.value = age;
  sync();
};

// View layer
watch(store => {
  console.log('John age:', store.john.age.value);
});`}),e("h2",{children:"Batch Multiple Updates"}),e("p",{children:["Make several changes first, then call ",e("code",{children:"sync()"})," once to reduce re-renders or side effects."]}),e(t,{language:"typescript",code:`const { updateRef, sync } = createStoreManualSync({
  count: 0,
  theme: 'light',
  sidebar: true
});

updateRef.count.value += 1;
updateRef.theme.value = 'dark';
updateRef.sidebar.value = false;

// Single flush
sync();`}),e("h2",{children:"Using with Framework Connectors"}),e("p",{children:["Manual sync works with connectors because ",e("code",{children:"watch"})," is still the subscription source."]}),e(t,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounterStore = connectReact(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};

function Counter() {
  const { count } = useCounterStore();
  return <button onClick={increment}>{count.value}</button>;
}`}),e("h2",{children:"API Summary"}),e("ul",{children:[e("li",{children:[e("code",{children:"createStoreManualSync(initial)"})," →"," ",e("code",{children:"{ watch, updateRef, sync }"})]}),e("li",{children:[e("code",{children:"watch(callback?)"})," - subscribe or get a read-only reference"]}),e("li",{children:[e("code",{children:"updateRef"})," - writable reference for actions"]}),e("li",{children:[e("code",{children:"sync()"})," - flushes changes to subscribers"]})]}),e("h2",{children:"Best Practices"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Centralize writes"})," in action functions"]}),e("li",{children:[e("strong",{children:"Batch updates"})," and call ",e("code",{children:"sync()"})," once"]}),e("li",{children:[e("strong",{children:"Keep views read-only"})," to avoid accidental mutations"]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - automatic sync mode"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - subscription basics"]}),e("li",{children:[e("a",{href:"#/guide/subscription",children:"Subscription"})," - lifecycle and cleanup"]})]})]})),di=u(()=>()=>e("div",{children:[e("h1",{children:"수동 동기화 (Flux)"}),e("p",{children:[e("code",{children:"createStoreManualSync"}),"는 업데이트를 언제 구독자에게 전파할지 직접 제어합니다. Flux 스타일의 액션 흐름, 여러 변경을 배치 처리, “뷰는 읽기 전용” 규칙을 적용할 때 유용합니다."]}),e("h2",{children:"기본 사용법"}),e(t,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';

const { watch, updateRef, sync } = createStoreManualSync({
  count: 0,
  user: { name: 'Lee' }
});

// 구독 (읽기가 추적됨)
watch((store, isFirst) => {
  console.log('Count:', store.count.value, 'First?', isFirst);
});

// 소비자용 읽기 전용 참조
const store = watch();
console.log(store.user.name.value); // 'Lee'

// updateRef로 변경
updateRef.count.value += 1;
updateRef.user.name.value = 'Min';

// 변경 사항 전파
sync();`}),e("h2",{children:"동작 방식"}),e("ul",{children:[e("li",{children:[e("strong",{children:"watch"}),"는 수동 모드에서 읽기 전용 참조를 반환"]}),e("li",{children:[e("strong",{children:"updateRef"}),"는 액션에서 사용하는 쓰기 전용 참조"]}),e("li",{children:[e("strong",{children:"sync()"}),"가 변경을 플러시하고 구독을 트리거"]})]}),e("h2",{children:"뷰에서 읽기 전용"}),e("p",{children:["수동 동기화에서는 ",e("code",{children:"watch()"}),"로 받은 참조를 직접 수정할 수 없습니다. 반드시 ",e("code",{children:"updateRef"}),"로 업데이트하세요."]}),e(t,{language:"typescript",code:`const { watch, updateRef } = createStoreManualSync({ count: 0 });

const store = watch();

// ✗ 수동 동기화에서는 불가
store.count.value = 1; // Error: direct modification is not allowed

// ✓ 가능
updateRef.count.value = 1;`}),e("h2",{children:"Flux 스타일 액션"}),e("p",{children:["변경 로직을 액션 함수로 모으고, 마지막에 ",e("code",{children:"sync()"}),"로 전파하세요."]}),e(t,{language:"typescript",code:`type Profile = { john: { age: number } };

const { watch, updateRef, sync } = createStoreManualSync<Profile>({
  john: { age: 20 }
});

export const changeJohnAge = (age: number) => {
  updateRef.john.age.value = age;
  sync();
};

// 뷰 레이어
watch(store => {
  console.log('John age:', store.john.age.value);
});`}),e("h2",{children:"여러 변경 배치 처리"}),e("p",{children:["여러 값을 변경한 뒤 ",e("code",{children:"sync()"}),"를 한 번만 호출하면 불필요한 렌더링이나 부수 효과를 줄일 수 있습니다."]}),e(t,{language:"typescript",code:`const { updateRef, sync } = createStoreManualSync({
  count: 0,
  theme: 'light',
  sidebar: true
});

updateRef.count.value += 1;
updateRef.theme.value = 'dark';
updateRef.sidebar.value = false;

// 한 번에 플러시
sync();`}),e("h2",{children:"프레임워크 커넥터와 함께 사용"}),e("p",{children:["수동 동기화에서도 ",e("code",{children:"watch"}),"는 구독의 출발점이므로 커넥터와 함께 사용할 수 있습니다."]}),e(t,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounterStore = connectReact(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};

function Counter() {
  const { count } = useCounterStore();
  return <button onClick={increment}>{count.value}</button>;
}`}),e("h2",{children:"API 요약"}),e("ul",{children:[e("li",{children:[e("code",{children:"createStoreManualSync(initial)"})," →"," ",e("code",{children:"{ watch, updateRef, sync }"})]}),e("li",{children:[e("code",{children:"watch(callback?)"})," - 구독 또는 읽기 전용 참조 획득"]}),e("li",{children:[e("code",{children:"updateRef"})," - 액션에서 사용하는 쓰기 참조"]}),e("li",{children:[e("code",{children:"sync()"})," - 변경 사항을 구독자에게 전파"]})]}),e("h2",{children:"모범 사례"}),e("ul",{children:[e("li",{children:e("strong",{children:"쓰기 로직을 액션으로 중앙화"})}),e("li",{children:[e("strong",{children:"여러 변경을 묶고"})," ",e("code",{children:"sync()"}),"를 한 번 호출"]}),e("li",{children:[e("strong",{children:"뷰는 읽기 전용"}),"으로 유지"]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 자동 동기화 모드"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - 구독 기본"]}),e("li",{children:[e("a",{href:"#/ko/guide/subscription",children:"구독"})," - 라이프사이클과 해제"]})]})]})),hi=u(()=>()=>e("div",{children:[e("h1",{children:"Lens Pattern"}),e("p",{children:["The ",e("code",{children:"lens"})," helper provides immutable, deep updates by describing a path into your data. StateRef uses the same lens pattern internally, and you can use it directly for custom immutable updates."]}),e("h2",{children:"Basic Usage"}),e(t,{language:"typescript",code:`import { lens } from 'state-ref';

type State = {
  user: { name: string; age: number };
  settings: { theme: string };
};

const state: State = {
  user: { name: 'Lee', age: 20 },
  settings: { theme: 'light' }
};

const nameLens = lens<State>().chain('user').chain('name');

// Read
const name = nameLens.get(state); // 'Lee'

// Update (returns a new root object)
const next = nameLens.set('Min')(state);
console.log(next.user.name); // 'Min'`}),e("h2",{children:"Chaining Deep Paths"}),e("p",{children:["Use ",e("code",{children:"chain"})," with object keys and array indices to build deep paths."]}),e(t,{language:"typescript",code:`type State = {
  todos: { title: string; done: boolean }[];
};

const state: State = {
  todos: [
    { title: 'Write docs', done: false },
    { title: 'Ship', done: false }
  ]
};

const firstTitle = lens<State>().chain('todos').chain(0).chain('title');
const next = firstTitle.set('Review docs')(state);

console.log(next.todos[0].title); // 'Review docs'`}),e("h2",{children:"Reusable Lenses"}),e("p",{children:"Build reusable lenses by chaining from a base lens."}),e(t,{language:"typescript",code:`type State = { user: { name: string; email: string } };

const userLens = lens<State>().chain('user');
const userNameLens = userLens.chain('name');
const userEmailLens = userLens.chain('email');`}),e("h2",{children:"Immutability (Copy-On-Write)"}),e("p",{children:[e("code",{children:"set()"})," performs shallow copies only along the path, keeping unrelated branches referentially equal."]}),e(t,{language:"typescript",code:`type State = {
  user: { name: string };
  settings: { theme: string };
};

const state: State = {
  user: { name: 'Lee' },
  settings: { theme: 'light' }
};

const nameLens = lens<State>().chain('user').chain('name');
const next = nameLens.set('Min')(state);

console.log(next !== state); // true
console.log(next.user !== state.user); // true
console.log(next.settings === state.settings); // true`}),e("h2",{children:"TypeScript Support"}),e("p",{children:[e("code",{children:"lens"})," preserves types through ",e("code",{children:"chain"}),", so",e("code",{children:"get"})," and ",e("code",{children:"set"})," are strongly typed."]}),e(t,{language:"typescript",code:`type State = { user: { name: string; age: number } };

const nameLens = lens<State>().chain('user').chain('name');

const name: string = nameLens.get({ user: { name: 'Lee', age: 20 } });
const next = nameLens.set('Min')({ user: { name: 'Lee', age: 20 } });`}),e("h2",{children:"When to Use"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Custom immutable updates"})," outside StateRef stores"]}),e("li",{children:[e("strong",{children:"Integration code"})," that needs predictable deep writes"]}),e("li",{children:[e("strong",{children:"Internal helpers"})," for shared update logic"]})]}),e("h2",{children:"API Summary"}),e(t,{language:"typescript",code:`lens<T>(sceneList?: (string | number | symbol)[]): Lens<T, T>

class Lens<Root, Focus> {
  chain(prop: string | number | symbol): Lens<Root, any>;
  get(target: Root): Focus;
  set(value: Focus): (target: Root) => Root;
}`}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - StateRef store creation"]}),e("li",{children:[e("a",{href:"#/guide/state-ref-store",children:"StateRefStore"})," - proxy references"]}),e("li",{children:[e("a",{href:"#/guide/computed",children:"createComputed"})," - derived values"]})]})]})),ui=u(()=>()=>e("div",{children:[e("h1",{children:"Lens 패턴"}),e("p",{children:[e("code",{children:"lens"})," 헬퍼는 데이터 경로를 설명해 불변 업데이트를 수행합니다. StateRef 내부도 동일한 렌즈 패턴을 사용하며, 직접 사용하면 커스텀 불변 업데이트를 만들 수 있습니다."]}),e("h2",{children:"기본 사용법"}),e(t,{language:"typescript",code:`import { lens } from 'state-ref';

type State = {
  user: { name: string; age: number };
  settings: { theme: string };
};

const state: State = {
  user: { name: 'Lee', age: 20 },
  settings: { theme: 'light' }
};

const nameLens = lens<State>().chain('user').chain('name');

// 읽기
const name = nameLens.get(state); // 'Lee'

// 업데이트 (새 루트 객체 반환)
const next = nameLens.set('Min')(state);
console.log(next.user.name); // 'Min'`}),e("h2",{children:"깊은 경로 체이닝"}),e("p",{children:[e("code",{children:"chain"}),"은 객체 키와 배열 인덱스를 모두 사용할 수 있습니다."]}),e(t,{language:"typescript",code:`type State = {
  todos: { title: string; done: boolean }[];
};

const state: State = {
  todos: [
    { title: 'Write docs', done: false },
    { title: 'Ship', done: false }
  ]
};

const firstTitle = lens<State>().chain('todos').chain(0).chain('title');
const next = firstTitle.set('Review docs')(state);

console.log(next.todos[0].title); // 'Review docs'`}),e("h2",{children:"재사용 가능한 렌즈"}),e("p",{children:"기본 렌즈에서 파생하여 여러 경로를 쉽게 구성할 수 있습니다."}),e(t,{language:"typescript",code:`type State = { user: { name: string; email: string } };

const userLens = lens<State>().chain('user');
const userNameLens = userLens.chain('name');
const userEmailLens = userLens.chain('email');`}),e("h2",{children:"불변성 (Copy-On-Write)"}),e("p",{children:[e("code",{children:"set()"}),"은 경로에 해당하는 부분만 얕은 복사를 수행하며, 나머지 경로는 동일한 참조를 유지합니다."]}),e(t,{language:"typescript",code:`type State = {
  user: { name: string };
  settings: { theme: string };
};

const state: State = {
  user: { name: 'Lee' },
  settings: { theme: 'light' }
};

const nameLens = lens<State>().chain('user').chain('name');
const next = nameLens.set('Min')(state);

console.log(next !== state); // true
console.log(next.user !== state.user); // true
console.log(next.settings === state.settings); // true`}),e("h2",{children:"TypeScript 지원"}),e("p",{children:[e("code",{children:"lens"}),"는 ",e("code",{children:"chain"}),"을 통해 타입 정보를 유지하므로",e("code",{children:"get"}),"/",e("code",{children:"set"}),"이 안전하게 추론됩니다."]}),e(t,{language:"typescript",code:`type State = { user: { name: string; age: number } };

const nameLens = lens<State>().chain('user').chain('name');

const name: string = nameLens.get({ user: { name: 'Lee', age: 20 } });
const next = nameLens.set('Min')({ user: { name: 'Lee', age: 20 } });`}),e("h2",{children:"사용 시점"}),e("ul",{children:[e("li",{children:[e("strong",{children:"커스텀 불변 업데이트"}),"가 필요할 때"]}),e("li",{children:[e("strong",{children:"통합 코드"}),"에서 예측 가능한 깊은 업데이트가 필요할 때"]}),e("li",{children:[e("strong",{children:"공통 업데이트 로직"}),"을 재사용하고 싶을 때"]})]}),e("h2",{children:"API 요약"}),e(t,{language:"typescript",code:`lens<T>(sceneList?: (string | number | symbol)[]): Lens<T, T>

class Lens<Root, Focus> {
  chain(prop: string | number | symbol): Lens<Root, any>;
  get(target: Root): Focus;
  set(value: Focus): (target: Root) => Root;
}`}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/state-ref-store",children:"StateRefStore"})," - 프록시 참조"]}),e("li",{children:[e("a",{href:"#/ko/guide/computed",children:"createComputed"})," - 파생 값"]})]})]})),pi=u(()=>()=>e("div",{children:[e("h1",{children:"copyable"}),e("p",{children:[e("code",{children:"copyable"})," creates a proxy that builds a path through property access and returns a new root object with copy-on-write updates via",e("code",{children:"writeCopy"}),". It’s useful when you need immutable updates outside of StateRef stores."]}),e("h2",{children:"Basic Usage"}),e(t,{language:"typescript",code:`import { copyable } from 'state-ref';

type State = {
  user: { name: string; age: number };
  settings: { theme: string };
};

const state: State = {
  user: { name: 'Lee', age: 20 },
  settings: { theme: 'light' }
};

const c = copyable(state);

// Build path via property access, then write
const next = c.user.name.writeCopy('Min');

console.log(state.user.name); // 'Lee'
console.log(next.user.name);  // 'Min'`}),e("h2",{children:"Deep Updates (Arrays Included)"}),e(t,{language:"typescript",code:`type State = {
  todos: { title: string; done: boolean }[];
};

const state: State = {
  todos: [
    { title: 'Write docs', done: false },
    { title: 'Ship', done: false }
  ]
};

const c = copyable(state);
const next = c.todos[1].done.writeCopy(true);

console.log(next.todos[1].done); // true`}),e("h2",{children:"Read-Only Proxy"}),e("p",{children:["Direct assignment is not allowed. Use ",e("code",{children:"writeCopy"})," for changes."]}),e(t,{language:"typescript",code:`const state = { count: 0 };
const c = copyable(state);

// ✗ Not allowed
c.count = 1; // Error: Property modification is not supported

// ✓ Allowed
const next = c.count.writeCopy(1);`}),e("h2",{children:"Copy-On-Write Behavior"}),e("p",{children:"Only the path you update is shallow-copied. Unrelated branches keep the same references."}),e(t,{language:"typescript",code:`const state = {
  user: { name: 'Lee' },
  settings: { theme: 'light' }
};

const c = copyable(state);
const next = c.user.name.writeCopy('Min');

console.log(next !== state); // true
console.log(next.user !== state.user); // true
console.log(next.settings === state.settings); // true`}),e("h2",{children:"Important: Use the Latest Root"}),e("p",{children:[e("code",{children:"copyable"})," writes against the root object you pass in. If you create a new root, call ",e("code",{children:"copyable"})," again with that new object."]}),e(t,{language:"typescript",code:`let state = { count: 0 };

let c = copyable(state);
state = c.count.writeCopy(1);

// Recreate copyable with the latest root
c = copyable(state);
state = c.count.writeCopy(2);`}),e("h2",{children:"API Summary"}),e(t,{language:"typescript",code:`copyable<T>(orig: T): Copyable<T>

type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(v: V) => Root;
};`}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/lens",children:"Lens Pattern"})," - path-based immutable updates"]}),e("li",{children:[e("a",{href:"#/guide/clone-deep",children:"cloneDeep"})," - full deep copy utility"]}),e("li",{children:[e("a",{href:"#/guide/state-ref-store",children:"StateRefStore"})," - proxy updates in stores"]})]})]})),gi=u(()=>()=>e("div",{children:[e("h1",{children:"copyable"}),e("p",{children:[e("code",{children:"copyable"}),"는 프로퍼티 접근으로 경로를 구성하고,",e("code",{children:"writeCopy"}),"로 copy-on-write 업데이트를 수행해 새로운 루트 객체를 반환합니다. StateRef 스토어 밖에서 불변 업데이트가 필요할 때 유용합니다."]}),e("h2",{children:"기본 사용법"}),e(t,{language:"typescript",code:`import { copyable } from 'state-ref';

type State = {
  user: { name: string; age: number };
  settings: { theme: string };
};

const state: State = {
  user: { name: 'Lee', age: 20 },
  settings: { theme: 'light' }
};

const c = copyable(state);

// 프로퍼티 접근으로 경로 구성 후 write
const next = c.user.name.writeCopy('Min');

console.log(state.user.name); // 'Lee'
console.log(next.user.name);  // 'Min'`}),e("h2",{children:"깊은 업데이트 (배열 포함)"}),e(t,{language:"typescript",code:`type State = {
  todos: { title: string; done: boolean }[];
};

const state: State = {
  todos: [
    { title: 'Write docs', done: false },
    { title: 'Ship', done: false }
  ]
};

const c = copyable(state);
const next = c.todos[1].done.writeCopy(true);

console.log(next.todos[1].done); // true`}),e("h2",{children:"읽기 전용 프록시"}),e("p",{children:["직접 할당은 허용되지 않습니다. 변경은 반드시",e("code",{children:"writeCopy"}),"로 수행하세요."]}),e(t,{language:"typescript",code:`const state = { count: 0 };
const c = copyable(state);

// ✗ 불가
c.count = 1; // Error: Property modification is not supported

// ✓ 가능
const next = c.count.writeCopy(1);`}),e("h2",{children:"Copy-On-Write 동작"}),e("p",{children:"업데이트 경로만 얕은 복사가 일어나며, 나머지 브랜치는 동일한 참조를 유지합니다."}),e(t,{language:"typescript",code:`const state = {
  user: { name: 'Lee' },
  settings: { theme: 'light' }
};

const c = copyable(state);
const next = c.user.name.writeCopy('Min');

console.log(next !== state); // true
console.log(next.user !== state.user); // true
console.log(next.settings === state.settings); // true`}),e("h2",{children:"중요: 최신 루트 사용"}),e("p",{children:[e("code",{children:"copyable"}),"은 전달한 루트 객체를 기준으로 업데이트합니다. 새 루트가 만들어졌다면 다시 ",e("code",{children:"copyable"}),"을 호출하세요."]}),e(t,{language:"typescript",code:`let state = { count: 0 };

let c = copyable(state);
state = c.count.writeCopy(1);

// 최신 루트로 재생성
c = copyable(state);
state = c.count.writeCopy(2);`}),e("h2",{children:"API 요약"}),e(t,{language:"typescript",code:`copyable<T>(orig: T): Copyable<T>

type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(v: V) => Root;
};`}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/lens",children:"Lens 패턴"})," - 경로 기반 불변 업데이트"]}),e("li",{children:[e("a",{href:"#/ko/guide/clone-deep",children:"cloneDeep"})," - 전체 깊은 복사"]}),e("li",{children:[e("a",{href:"#/ko/guide/state-ref-store",children:"StateRefStore"})," - 스토어 프록시 업데이트"]})]})]})),fi=u(()=>()=>e("div",{children:[e("h1",{children:"cloneDeep"}),e("p",{children:[e("code",{children:"cloneDeep"})," creates a recursive deep copy of plain objects and arrays. It’s a small utility for cases where you need an independent copy of nested data."]}),e("h2",{children:"Basic Usage"}),e(t,{language:"typescript",code:`import { cloneDeep } from 'state-ref';

const original = {
  user: { name: 'Lee', tags: ['dev', 'docs'] },
  count: 1
};

const copy = cloneDeep(original);

copy.user.name = 'Min';
copy.user.tags.push('review');

console.log(original.user.name); // 'Lee'
console.log(original.user.tags); // ['dev', 'docs']`}),e("h2",{children:"Arrays and Objects"}),e(t,{language:"typescript",code:`const list = [{ id: 1 }, { id: 2 }];
const next = cloneDeep(list);

next[0].id = 999;
console.log(list[0].id); // 1`}),e("h2",{children:"What It Copies"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Plain objects"})," (own enumerable properties)"]}),e("li",{children:[e("strong",{children:"Arrays"})," (recursively deep-copied)"]}),e("li",{children:[e("strong",{children:"Primitives"})," are returned as-is"]})]}),e("h2",{children:"Limitations"}),e("p",{children:[e("code",{children:"cloneDeep"})," is intentionally minimal. It does not handle special object types or circular references."]}),e("ul",{children:[e("li",{children:[e("strong",{children:"Not supported"}),": Date, Map, Set, class instances, functions, symbols, or circular references"]}),e("li",{children:[e("strong",{children:"Prototype is not preserved"})," (plain object output)"]})]}),e("h2",{children:"When to Use"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Test fixtures"})," or quick cloning of JSON-like data"]}),e("li",{children:[e("strong",{children:"Defensive copies"})," before in-place changes"]}),e("li",{children:[e("strong",{children:"Lightweight utilities"})," without extra dependencies"]})]}),e("h2",{children:"API Summary"}),e(t,{language:"typescript",code:"cloneDeep<T>(value: T): T"}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/copyable",children:"copyable"})," - copy-on-write updates"]}),e("li",{children:[e("a",{href:"#/guide/lens",children:"Lens Pattern"})," - path-based immutable updates"]})]})]})),mi=u(()=>()=>e("div",{children:[e("h1",{children:"cloneDeep"}),e("p",{children:[e("code",{children:"cloneDeep"}),"는 평범한 객체와 배열을 재귀적으로 깊은 복사합니다. 중첩된 데이터를 독립적으로 복제해야 할 때 사용하는 가벼운 유틸리티입니다."]}),e("h2",{children:"기본 사용법"}),e(t,{language:"typescript",code:`import { cloneDeep } from 'state-ref';

const original = {
  user: { name: 'Lee', tags: ['dev', 'docs'] },
  count: 1
};

const copy = cloneDeep(original);

copy.user.name = 'Min';
copy.user.tags.push('review');

console.log(original.user.name); // 'Lee'
console.log(original.user.tags); // ['dev', 'docs']`}),e("h2",{children:"배열과 객체"}),e(t,{language:"typescript",code:`const list = [{ id: 1 }, { id: 2 }];
const next = cloneDeep(list);

next[0].id = 999;
console.log(list[0].id); // 1`}),e("h2",{children:"복사 범위"}),e("ul",{children:[e("li",{children:[e("strong",{children:"평범한 객체"})," (열거 가능한 own 프로퍼티)"]}),e("li",{children:[e("strong",{children:"배열"})," (재귀적 깊은 복사)"]}),e("li",{children:[e("strong",{children:"원시값"}),"은 그대로 반환"]})]}),e("h2",{children:"제한 사항"}),e("p",{children:[e("code",{children:"cloneDeep"}),"는 단순함을 우선한 구현입니다. 특수 객체나 순환 참조는 지원하지 않습니다."]}),e("ul",{children:[e("li",{children:[e("strong",{children:"미지원"}),": Date, Map, Set, 클래스 인스턴스, 함수, 심볼, 순환 참조"]}),e("li",{children:[e("strong",{children:"프로토타입 보존 없음"})," (plain object로 복사)"]})]}),e("h2",{children:"사용 시점"}),e("ul",{children:[e("li",{children:[e("strong",{children:"테스트 픽스처"})," 또는 JSON 유사 데이터 복사"]}),e("li",{children:[e("strong",{children:"방어적 복사"}),"가 필요할 때"]}),e("li",{children:[e("strong",{children:"가벼운 유틸"}),"로 빠르게 처리하고 싶을 때"]})]}),e("h2",{children:"API 요약"}),e(t,{language:"typescript",code:"cloneDeep<T>(value: T): T"}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/copyable",children:"copyable"})," - copy-on-write 업데이트"]}),e("li",{children:[e("a",{href:"#/ko/guide/lens",children:"Lens 패턴"})," - 경로 기반 불변 업데이트"]})]})]})),yi=u(()=>()=>e("div",{children:[e("h1",{children:"React Integration"}),e("p",{children:["Use ",e("code",{children:"@stateref/connect-react"})," to connect a StateRef store to React. It provides a hook that re-renders on changes automatically."]}),e("h2",{children:"Install"}),e(t,{language:"bash",code:"pnpm add state-ref @stateref/connect-react"}),e("h2",{children:"Supported Versions"}),e("p",{children:["React 18 and 19 (",e("code",{children:"react ^18.0.0 || ^19.0.0"}),"). The package major follows the newest React it supports, so"," ",e("code",{children:"@stateref/connect-react"})," 19.x still works with React 18."]}),e("h2",{children:"Basic Usage"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

// Create a React hook from the watch
export const useProfileStore = connectReact(watch);`}),e(t,{language:"tsx",code:`import { useProfileStore } from './profileStore';

export function ProfileCard() {
  const { name, age } = useProfileStore();

  return (
    <div>
      <p>{name.value}</p>
      <button onClick={() => (age.value += 1)}>
        Age: {age.value}
      </button>
    </div>
  );
}`}),e("h2",{children:"How Updates Work"}),e("ul",{children:[e("li",{children:"The hook subscribes on mount and re-renders when tracked values change"}),e("li",{children:["Updates are driven by reading ",e("code",{children:".value"})," in the render"]}),e("li",{children:"Cleanup is automatic on unmount (AbortController)"})]}),e("h2",{children:"Manual Sync with Actions"}),e("p",{children:["If you use ",e("code",{children:"createStoreManualSync"}),", keep writes in actions and call ",e("code",{children:"sync()"})," after updates."]}),e(t,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounterStore = connectReact(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(t,{language:"tsx",code:`import { useCounterStore, increment } from './counterStore';

export function Counter() {
  const { count } = useCounterStore();
  return <button onClick={increment}>{count.value}</button>;
}`}),e("h2",{children:"TypeScript Tips"}),e("p",{children:["The hook preserves types from ",e("code",{children:"createStore"}),", so you get strongly typed refs in components."]}),e(t,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectReact(watch);

// useTodo() returns StateRefStore<Todo>`}),e("h2",{children:"Readonly Query Views"}),e("p",{children:[e("code",{children:"connectReactView"})," binds a readonly query view from"," ",e("a",{href:"#/guide/sync-view",children:"@stateref/sync"}),". It takes the same"," ",e("code",{children:"Watch"})," shape as ",e("code",{children:"connectReact"})," but never hands out setters, because a display can be a selected value or a placeholder that was never on the server."]}),e(t,{language:"tsx",code:`const useLive = connectReactView(live.watchDisplay);

function CityDisplay() {
  const state = useLive();
  if (state.status.value === 'pending') return <span>Loading…</span>;
  return <span>{state.data.value ?? '-'}</span>;
}`}),e("p",{children:["Edit the actual data through ",e("code",{children:"live.ref"})," once it has loaded, not through the display. Unmounting this component ends"," ",e("strong",{children:"its own subscription only"})," - the view itself is released by whoever owns it, with ",e("code",{children:"live.dispose()"}),", so a second screen watching the same view keeps working."]}),e("h2",{children:"How the Hook Subscribes"}),e("ul",{children:[e("li",{children:["It is built on ",e("code",{children:"useSyncExternalStore"}),", React's contract for external stores. The subscription is made after commit and ended by React, so ",e("code",{children:"<StrictMode>"})," and renders React throws away leave nothing behind."]}),e("li",{children:[e("strong",{children:"A mount renders twice."})," state-ref learns what a component reads while it renders through a subscribed reference, and there is none before the first commit. The first render paints with the correct values; the second, through the subscribed reference, collects the paths. After that, only a change to a path the component read re-renders it."]}),e("li",{children:["A server render uses ",e("code",{children:"getServerSnapshot"})," and subscribes to nothing."]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - store creation"]}),e("li",{children:[e("a",{href:"#/guide/manual-sync",children:"Manual Sync (Flux)"})," - action-based updates"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - subscription behavior"]})]})]})),bi=u(()=>()=>e("div",{children:[e("h1",{children:"React 연동"}),e("p",{children:[e("code",{children:"@stateref/connect-react"}),"를 사용하면 StateRef 스토어를 React에 연결할 수 있습니다. 변경이 발생하면 컴포넌트가 자동으로 리렌더링됩니다."]}),e("h2",{children:"설치"}),e(t,{language:"bash",code:"pnpm add state-ref @stateref/connect-react"}),e("h2",{children:"지원 버전"}),e("p",{children:["React 18과 19(",e("code",{children:"react ^18.0.0 || ^19.0.0"}),"). 패키지 메이저는 지원하는 가장 새 React를 따르므로 ",e("code",{children:"@stateref/connect-react"})," ","19.x는 React 18에서도 동작합니다."]}),e("h2",{children:"기본 사용법"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

// watch로 React 훅 생성
export const useProfileStore = connectReact(watch);`}),e(t,{language:"tsx",code:`import { useProfileStore } from './profileStore';

export function ProfileCard() {
  const { name, age } = useProfileStore();

  return (
    <div>
      <p>{name.value}</p>
      <button onClick={() => (age.value += 1)}>
        Age: {age.value}
      </button>
    </div>
  );
}`}),e("h2",{children:"업데이트 동작"}),e("ul",{children:[e("li",{children:"훅은 마운트 시 구독하고, 추적된 값이 바뀌면 리렌더링됩니다"}),e("li",{children:["렌더에서 ",e("code",{children:".value"}),"를 읽는 것이 추적의 기준입니다"]}),e("li",{children:"언마운트 시 자동으로 정리됩니다 (AbortController)"})]}),e("h2",{children:"수동 동기화 + 액션"}),e("p",{children:[e("code",{children:"createStoreManualSync"}),"를 사용할 때는 액션에서 업데이트하고",e("code",{children:"sync()"}),"로 전파하세요."]}),e(t,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounterStore = connectReact(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(t,{language:"tsx",code:`import { useCounterStore, increment } from './counterStore';

export function Counter() {
  const { count } = useCounterStore();
  return <button onClick={increment}>{count.value}</button>;
}`}),e("h2",{children:"TypeScript 팁"}),e("p",{children:[e("code",{children:"createStore"}),"의 타입이 훅으로 그대로 전달되므로 컴포넌트에서 타입이 안전하게 유지됩니다."]}),e(t,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectReact(watch);

// useTodo()는 StateRefStore<Todo> 반환`}),e("h2",{children:"읽기 전용 조회 view"}),e("p",{children:[e("code",{children:"connectReactView"}),"는"," ",e("a",{href:"#/ko/guide/sync-view",children:"@stateref/sync"}),"의 읽기 전용 조회 view를 연결합니다. ",e("code",{children:"connectReact"}),"와 같은 ",e("code",{children:"Watch"})," ","모양을 받지만 setter는 내주지 않습니다. 표시는 선택된 값일 수도, 서버에 존재한 적 없는 placeholder일 수도 있기 때문입니다."]}),e(t,{language:"tsx",code:`const useLive = connectReactView(live.watchDisplay);

function CityDisplay() {
  const state = useLive();
  if (state.status.value === 'pending') return <span>불러오는 중…</span>;
  return <span>{state.data.value ?? '-'}</span>;
}`}),e("p",{children:["실제 데이터는 로드된 뒤 ",e("code",{children:"live.ref"}),"로 편집하세요. 표시로 하지 않습니다. 이 컴포넌트의 언마운트는 ",e("strong",{children:"자기 구독만"})," 끝냅니다 — view 자체는 소유자가 ",e("code",{children:"live.dispose()"}),"로 놓으므로, 같은 view를 보는 둘째 화면은 계속 동작합니다."]}),e("h2",{children:"훅이 구독하는 방식"}),e("ul",{children:[e("li",{children:["React가 외부 스토어에 정한 계약인 ",e("code",{children:"useSyncExternalStore"})," ","위에 있습니다. 구독은 커밋 뒤에 만들어지고 React가 끝내므로,"," ",e("code",{children:"<StrictMode>"}),"나 React가 버린 렌더가 아무것도 남기지 않습니다."]}),e("li",{children:[e("strong",{children:"마운트는 두 번 렌더됩니다."})," state-ref는 구독된 참조로 렌더하는 동안 무엇을 읽는지 알아내는데, 첫 커밋 전에는 그런 참조가 없습니다. 첫 렌더는 올바른 값으로 그리고, 두 번째 렌더가 구독된 참조로 읽어 경로를 모읍니다. 그 뒤로는 읽은 경로가 바뀔 때만 다시 렌더됩니다."]}),e("li",{children:["서버 렌더는 ",e("code",{children:"getServerSnapshot"}),"을 쓰고 아무것도 구독하지 않습니다."]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화 (Flux)"})," - 액션 기반 업데이트"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - 구독 동작"]})]})]})),vi=u(()=>()=>e("div",{children:[e("h1",{children:"Preact Integration"}),e("p",{children:["Use ",e("code",{children:"@stateref/connect-preact"})," to connect a StateRef store to Preact. It provides a hook that re-renders on changes automatically."]}),e("h2",{children:"Install"}),e(t,{language:"bash",code:"pnpm add state-ref @stateref/connect-preact"}),e("h2",{children:"Supported Versions"}),e("p",{children:["Preact 10 (",e("code",{children:"preact ^10.0.0"}),"). It uses"," ",e("code",{children:"preact/hooks"})," only - no ",e("code",{children:"preact/compat"}),"."]}),e("h2",{children:"Basic Usage"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';
import { connectPreact } from '@stateref/connect-preact';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

// Create a Preact hook from the watch
export const useProfileStore = connectPreact(watch);`}),e(t,{language:"tsx",code:`import { useProfileStore } from './profileStore';

export function ProfileCard() {
  const { name, age } = useProfileStore();

  return (
    <div>
      <p>{name.value}</p>
      <button onClick={() => (age.value += 1)}>
        Age: {age.value}
      </button>
    </div>
  );
}`}),e("h2",{children:"How Updates Work"}),e("ul",{children:[e("li",{children:"The hook subscribes on mount and re-renders when tracked values change"}),e("li",{children:["Updates are driven by reading ",e("code",{children:".value"})," in the render"]}),e("li",{children:"Cleanup is automatic on unmount (AbortController)"})]}),e("h2",{children:"Preact vs React"}),e("p",{children:["The Preact connector is nearly identical to the React version. The main difference is that it uses ",e("code",{children:"preact/hooks"})," instead of React's hooks:"]}),e(t,{language:"typescript",code:`// React
import { connectReact } from '@stateref/connect-react';

// Preact
import { connectPreact } from '@stateref/connect-preact';

// Usage is the same
const useStore = connectPreact(watch);`}),e("h2",{children:"Manual Sync with Actions"}),e("p",{children:["If you use ",e("code",{children:"createStoreManualSync"}),", keep writes in actions and call ",e("code",{children:"sync()"})," after updates."]}),e(t,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';
import { connectPreact } from '@stateref/connect-preact';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounterStore = connectPreact(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(t,{language:"tsx",code:`import { useCounterStore, increment } from './counterStore';

export function Counter() {
  const { count } = useCounterStore();
  return <button onClick={increment}>{count.value}</button>;
}`}),e("h2",{children:"TypeScript Tips"}),e("p",{children:["The hook preserves types from ",e("code",{children:"createStore"}),", so you get strongly typed refs in components."]}),e(t,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectPreact(watch);

// useTodo() returns StateRefStore<Todo>`}),e("h2",{children:"Readonly Query Views"}),e("p",{children:[e("code",{children:"connectPreactView"})," binds a readonly query view from"," ",e("a",{href:"#/guide/sync-view",children:"@stateref/sync"}),". It takes the same"," ",e("code",{children:"Watch"})," shape as ",e("code",{children:"connectPreact"})," but never hands out setters, because a display can be a selected value or a placeholder that was never on the server."]}),e(t,{language:"tsx",code:`const useLive = connectPreactView(live.watchDisplay);

function CityDisplay() {
  const state = useLive();
  return <span>{state.data.value ?? '-'}</span>;
}`}),e("p",{children:["Edit the actual data through ",e("code",{children:"live.ref"})," once it has loaded, not through the display. Unmounting this component ends"," ",e("strong",{children:"its own subscription only"})," - the view itself is released by whoever owns it, with ",e("code",{children:"live.dispose()"}),", so a second screen watching the same view keeps working."]}),e("h2",{children:"How the Hook Subscribes"}),e("ul",{children:[e("li",{children:"The subscription is made in an effect, after commit, and released by its cleanup. A render that suspends never commits, so it leaves nothing behind."}),e("li",{children:[e("strong",{children:"A mount renders twice"}),", for the same reason as the React connector: the first render paints with the correct values, the second collects the paths the component reads."]}),e("li",{children:"A server render runs no effects and subscribes to nothing."})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - store creation"]}),e("li",{children:[e("a",{href:"#/guide/manual-sync",children:"Manual Sync (Flux)"})," - action-based updates"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - subscription behavior"]}),e("li",{children:[e("a",{href:"#/guide/react",children:"React"})," - React integration (nearly identical API)"]})]})]})),wi=u(()=>()=>e("div",{children:[e("h1",{children:"Preact 연동"}),e("p",{children:[e("code",{children:"@stateref/connect-preact"}),"를 사용하여 StateRef 스토어를 Preact에 연결합니다. 변경 사항이 있을 때 자동으로 리렌더링되는 훅을 제공합니다."]}),e("h2",{children:"설치"}),e(t,{language:"bash",code:"pnpm add state-ref @stateref/connect-preact"}),e("h2",{children:"지원 버전"}),e("p",{children:["Preact 10(",e("code",{children:"preact ^10.0.0"}),"). ",e("code",{children:"preact/hooks"}),"만 쓰고"," ",e("code",{children:"preact/compat"}),"은 필요 없습니다."]}),e("h2",{children:"기본 사용법"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';
import { connectPreact } from '@stateref/connect-preact';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

// watch로 Preact 훅 생성
export const useProfileStore = connectPreact(watch);`}),e(t,{language:"tsx",code:`import { useProfileStore } from './profileStore';

export function ProfileCard() {
  const { name, age } = useProfileStore();

  return (
    <div>
      <p>{name.value}</p>
      <button onClick={() => (age.value += 1)}>
        나이: {age.value}
      </button>
    </div>
  );
}`}),e("h2",{children:"업데이트 동작 방식"}),e("ul",{children:[e("li",{children:"훅은 마운트 시 구독하고 추적된 값이 변경되면 리렌더링합니다"}),e("li",{children:["업데이트는 렌더링에서 ",e("code",{children:".value"}),"를 읽는 것으로 구동됩니다"]}),e("li",{children:"언마운트 시 자동으로 정리됩니다 (AbortController)"})]}),e("h2",{children:"Preact vs React"}),e("p",{children:["Preact 커넥터는 React 버전과 거의 동일합니다. 주요 차이점은 React의 hooks 대신 ",e("code",{children:"preact/hooks"}),"를 사용한다는 것입니다:"]}),e(t,{language:"typescript",code:`// React
import { connectReact } from '@stateref/connect-react';

// Preact
import { connectPreact } from '@stateref/connect-preact';

// 사용법은 동일
const useStore = connectPreact(watch);`}),e("h2",{children:"액션과 함께 수동 동기화"}),e("p",{children:[e("code",{children:"createStoreManualSync"}),"를 사용하는 경우 쓰기는 액션에서 처리하고 업데이트 후 ",e("code",{children:"sync()"}),"를 호출합니다."]}),e(t,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';
import { connectPreact } from '@stateref/connect-preact';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounterStore = connectPreact(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(t,{language:"tsx",code:`import { useCounterStore, increment } from './counterStore';

export function Counter() {
  const { count } = useCounterStore();
  return <button onClick={increment}>{count.value}</button>;
}`}),e("h2",{children:"TypeScript 팁"}),e("p",{children:["훅은 ",e("code",{children:"createStore"}),"의 타입을 유지하므로 컴포넌트에서 강력한 타입의 참조를 얻을 수 있습니다."]}),e(t,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectPreact(watch);

// useTodo()는 StateRefStore<Todo>를 반환`}),e("h2",{children:"읽기 전용 조회 view"}),e("p",{children:[e("code",{children:"connectPreactView"}),"는"," ",e("a",{href:"#/ko/guide/sync-view",children:"@stateref/sync"}),"의 읽기 전용 조회 view를 연결합니다. ",e("code",{children:"connectPreact"}),"와 같은 ",e("code",{children:"Watch"})," ","모양을 받지만 setter는 내주지 않습니다. 표시는 선택된 값일 수도, 서버에 존재한 적 없는 placeholder일 수도 있기 때문입니다."]}),e(t,{language:"tsx",code:`const useLive = connectPreactView(live.watchDisplay);

function CityDisplay() {
  const state = useLive();
  return <span>{state.data.value ?? '-'}</span>;
}`}),e("p",{children:["실제 데이터는 로드된 뒤 ",e("code",{children:"live.ref"}),"로 편집하세요. 표시로 하지 않습니다. 이 컴포넌트의 언마운트는 ",e("strong",{children:"자기 구독만"})," 끝냅니다 — view 자체는 소유자가 ",e("code",{children:"live.dispose()"}),"로 놓으므로, 같은 view를 보는 둘째 화면은 계속 동작합니다."]}),e("h2",{children:"훅이 구독하는 방식"}),e("ul",{children:[e("li",{children:"구독은 커밋 뒤 effect에서 만들어지고 그 정리 함수가 놓습니다. suspend된 렌더는 커밋되지 않으므로 아무것도 남기지 않습니다."}),e("li",{children:[e("strong",{children:"마운트는 두 번 렌더됩니다."})," React 커넥터와 같은 이유입니다. 첫 렌더는 올바른 값으로 그리고, 두 번째 렌더가 컴포넌트가 읽는 경로를 모읍니다."]}),e("li",{children:"서버 렌더는 effect를 돌리지 않으므로 아무것도 구독하지 않습니다."})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화 (Flux)"})," - 액션 기반 업데이트"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - 구독 동작"]}),e("li",{children:[e("a",{href:"#/ko/guide/react",children:"React"})," - React 연동 (거의 동일한 API)"]})]})]})),Si=u(()=>()=>e("div",{children:[e("h1",{children:"Vue Integration"}),e("p",{children:["Use ",e("code",{children:"@stateref/connect-vue"})," to connect a StateRef store to Vue 3. It bridges StateRef's reactivity with Vue's reactive system."]}),e("h2",{children:"Install"}),e(t,{language:"bash",code:"pnpm add state-ref @stateref/connect-vue"}),e("h2",{children:"Supported Versions"}),e("p",{children:["Vue 3.2 and later (",e("code",{children:"vue ^3.2.0"}),"); the connector releases with"," ",e("code",{children:"onScopeDispose"}),", which arrived in 3.2."]}),e("h2",{children:"Basic Usage"}),e("p",{children:"The Vue connector uses a callback pattern to select which part of the store to track:"}),e(t,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';
import { connectVue } from '@stateref/connect-vue';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

export const useProfile = connectVue(watch);`}),e(t,{language:"vue",code:`<script setup lang="ts">
import { useProfile } from './store';

// Select which property to track
const name = useProfile(store => store.name);
const age = useProfile(store => store.age);
<\/script>

<template>
  <div>
    <p>{{ name.value }}</p>
    <button @click="age.value++">
      Age: {{ age.value }}
    </button>
  </div>
</template>`}),e("h2",{children:"How It Works"}),e("p",{children:"The Vue connector creates a bridge between StateRef and Vue's reactivity:"}),e("ul",{children:[e("li",{children:[e("code",{children:"connectVue(watch)"})," returns a function that accepts a selector callback"]}),e("li",{children:"The selector receives the StateRefStore and returns the specific property to track"}),e("li",{children:["Returns a Vue ",e("code",{children:"Reactive"})," object with a ",e("code",{children:".value"})," ","property"]}),e("li",{children:"Two-way binding: Vue changes sync back to StateRef, and vice versa"}),e("li",{children:"Cleanup is automatic on component unmount"})]}),e("h2",{children:"Selecting Properties"}),e("p",{children:"Use the selector callback to pick specific properties:"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'en' }
});

const useStore = connectVue(watch);

// In component
const userName = useStore(store => store.user.name);
const userAge = useStore(store => store.user.age);
const theme = useStore(store => store.settings.theme);

// Access values
console.log(userName.value);  // 'John'
console.log(theme.value);     // 'dark'

// Update values
userName.value = 'Jane';
theme.value = 'light';`}),e("h2",{children:"Working with Objects"}),e("p",{children:"You can also select entire objects:"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: { name: 'John', age: 30 }
});

const useStore = connectVue(watch);

// Select entire user object
const user = useStore(store => store.user);

// Access nested values
console.log(user.value.name);  // 'John'
console.log(user.value.age);   // 30

// Replace entire object
user.value = { name: 'Jane', age: 25 };`}),e("h2",{children:"Manual Sync with Actions"}),e("p",{children:["With ",e("code",{children:"createStoreManualSync"}),", keep writes in actions:"]}),e(t,{language:"typescript",code:`// store.ts
import { createStoreManualSync } from 'state-ref';
import { connectVue } from '@stateref/connect-vue';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounter = connectVue(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(t,{language:"vue",code:`<script setup lang="ts">
import { useCounter, increment } from './store';

const count = useCounter(store => store.count);
<\/script>

<template>
  <button @click="increment">
    Count: {{ count.value }}
  </button>
</template>`}),e("h2",{children:"Composition API Pattern"}),e("p",{children:"Organize your store access in a composable:"}),e(t,{language:"typescript",code:`// composables/useProfileStore.ts
import { createStore } from 'state-ref';
import { connectVue } from '@stateref/connect-vue';

type Profile = {
  name: string;
  age: number;
  email: string;
};

const watch = createStore<Profile>({
  name: 'John',
  age: 30,
  email: 'john@example.com'
});

const useStore = connectVue(watch);

export function useProfileStore() {
  const name = useStore(store => store.name);
  const age = useStore(store => store.age);
  const email = useStore(store => store.email);

  const incrementAge = () => {
    age.value += 1;
  };

  return {
    name,
    age,
    email,
    incrementAge
  };
}`}),e(t,{language:"vue",code:`<script setup lang="ts">
import { useProfileStore } from './composables/useProfileStore';

const { name, age, email, incrementAge } = useProfileStore();
<\/script>

<template>
  <div>
    <p>Name: {{ name.value }}</p>
    <p>Email: {{ email.value }}</p>
    <button @click="incrementAge">
      Age: {{ age.value }}
    </button>
  </div>
</template>`}),e("h2",{children:"TypeScript Tips"}),e("p",{children:"The connector preserves types from your store:"}),e(t,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectVue(watch);

// TypeScript knows the types
const title = useTodo(store => store.title);
// title is Reactive<{ value: string }>

const done = useTodo(store => store.done);
// done is Reactive<{ value: boolean }>`}),e("h2",{children:"Readonly Query Views"}),e("p",{children:[e("code",{children:"connectVueView"})," binds a readonly query view from"," ",e("a",{href:"#/guide/sync-view",children:"@stateref/sync"}),". It takes the same"," ",e("code",{children:"Watch"})," shape as ",e("code",{children:"connectVue"})," but never hands out setters, because a display can be a selected value or a placeholder that was never on the server."]}),e(t,{language:"vue",code:`<script setup lang="ts">
const view = connectVueView(live.watchDisplay);
const city = view(ref => ref.data.value);
const phase = view(ref => (ref.isPlaceholder.value ? 'placeholder' : ref.status.value));
<\/script>

<template>
  <span>{{ phase === 'pending' ? '…' : city ?? '-' }}</span>
</template>`}),e("p",{children:["Edit the actual data through ",e("code",{children:"live.ref"})," once it has loaded, not through the display. Unmounting this component ends"," ",e("strong",{children:"its own subscription only"})," - the view itself is released by whoever owns it, with ",e("code",{children:"live.dispose()"}),", so a second screen watching the same view keeps working."]}),e("h2",{children:"Writing Rules"}),e("ul",{children:[e("li",{children:["Assigning ",e("code",{children:".value"})," writes the store"," ",e("strong",{children:"synchronously"}),"; reading the store right after sees the new value."]}),e("li",{children:[e("strong",{children:"A selected object or array is readonly."})," ",e("code",{children:"user.value.name = 'x'"})," is refused with Vue's readonly warning in development and the store is untouched. Select the leaf (",e("code",{children:"useStore(s => s.user.name).value = 'x'"}),") or replace the whole value (",e("code",{children:["user.value = ","{ ...user.value, name }"]}),"). The rule behind it: a write that passes through the connector reaches the store, a change that does not is refused."]}),e("li",{children:["The subscription follows the scope the connector was called in - a component's setup, or an ",e("code",{children:"effectScope"})," a composable runs in - and a write after that scope stops goes nowhere."]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - store creation"]}),e("li",{children:[e("a",{href:"#/guide/manual-sync",children:"Manual Sync (Flux)"})," - action-based updates"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - subscription behavior"]}),e("li",{children:[e("a",{href:"#/guide/react",children:"React"})," - React integration"]})]})]})),ki=u(()=>()=>e("div",{children:[e("h1",{children:"Vue 연동"}),e("p",{children:[e("code",{children:"@stateref/connect-vue"}),"를 사용하여 StateRef 스토어를 Vue 3에 연결합니다. StateRef의 반응성과 Vue의 reactive 시스템을 연결합니다."]}),e("h2",{children:"설치"}),e(t,{language:"bash",code:"pnpm add state-ref @stateref/connect-vue"}),e("h2",{children:"지원 버전"}),e("p",{children:["Vue 3.2 이상(",e("code",{children:"vue ^3.2.0"}),"). 해제에 3.2에서 생긴"," ",e("code",{children:"onScopeDispose"}),"를 씁니다."]}),e("h2",{children:"기본 사용법"}),e("p",{children:"Vue 커넥터는 스토어에서 추적할 부분을 선택하기 위해 콜백 패턴을 사용합니다:"}),e(t,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';
import { connectVue } from '@stateref/connect-vue';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

export const useProfile = connectVue(watch);`}),e(t,{language:"vue",code:`<script setup lang="ts">
import { useProfile } from './store';

// 추적할 프로퍼티 선택
const name = useProfile(store => store.name);
const age = useProfile(store => store.age);
<\/script>

<template>
  <div>
    <p>{{ name.value }}</p>
    <button @click="age.value++">
      나이: {{ age.value }}
    </button>
  </div>
</template>`}),e("h2",{children:"작동 방식"}),e("p",{children:"Vue 커넥터는 StateRef와 Vue의 반응성 사이에 브릿지를 생성합니다:"}),e("ul",{children:[e("li",{children:[e("code",{children:"connectVue(watch)"}),"는 셀렉터 콜백을 받는 함수를 반환합니다"]}),e("li",{children:"셀렉터는 StateRefStore를 받아서 추적할 특정 프로퍼티를 반환합니다"}),e("li",{children:[e("code",{children:".value"})," 프로퍼티를 가진 Vue ",e("code",{children:"Reactive"})," 객체를 반환합니다"]}),e("li",{children:"양방향 바인딩: Vue 변경이 StateRef로, 그리고 그 반대로도 동기화됩니다"}),e("li",{children:"컴포넌트 언마운트 시 자동으로 정리됩니다"})]}),e("h2",{children:"프로퍼티 선택하기"}),e("p",{children:"셀렉터 콜백을 사용하여 특정 프로퍼티를 선택합니다:"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'ko' }
});

const useStore = connectVue(watch);

// 컴포넌트에서
const userName = useStore(store => store.user.name);
const userAge = useStore(store => store.user.age);
const theme = useStore(store => store.settings.theme);

// 값 접근
console.log(userName.value);  // 'John'
console.log(theme.value);     // 'dark'

// 값 업데이트
userName.value = 'Jane';
theme.value = 'light';`}),e("h2",{children:"객체 다루기"}),e("p",{children:"전체 객체를 선택할 수도 있습니다:"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: { name: 'John', age: 30 }
});

const useStore = connectVue(watch);

// 전체 user 객체 선택
const user = useStore(store => store.user);

// 중첩된 값 접근
console.log(user.value.name);  // 'John'
console.log(user.value.age);   // 30

// 전체 객체 교체
user.value = { name: 'Jane', age: 25 };`}),e("h2",{children:"액션과 함께 수동 동기화"}),e("p",{children:[e("code",{children:"createStoreManualSync"}),"를 사용하면 쓰기는 액션에서 처리합니다:"]}),e(t,{language:"typescript",code:`// store.ts
import { createStoreManualSync } from 'state-ref';
import { connectVue } from '@stateref/connect-vue';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounter = connectVue(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(t,{language:"vue",code:`<script setup lang="ts">
import { useCounter, increment } from './store';

const count = useCounter(store => store.count);
<\/script>

<template>
  <button @click="increment">
    Count: {{ count.value }}
  </button>
</template>`}),e("h2",{children:"Composition API 패턴"}),e("p",{children:"composable에서 스토어 접근을 구성합니다:"}),e(t,{language:"typescript",code:`// composables/useProfileStore.ts
import { createStore } from 'state-ref';
import { connectVue } from '@stateref/connect-vue';

type Profile = {
  name: string;
  age: number;
  email: string;
};

const watch = createStore<Profile>({
  name: 'John',
  age: 30,
  email: 'john@example.com'
});

const useStore = connectVue(watch);

export function useProfileStore() {
  const name = useStore(store => store.name);
  const age = useStore(store => store.age);
  const email = useStore(store => store.email);

  const incrementAge = () => {
    age.value += 1;
  };

  return {
    name,
    age,
    email,
    incrementAge
  };
}`}),e(t,{language:"vue",code:`<script setup lang="ts">
import { useProfileStore } from './composables/useProfileStore';

const { name, age, email, incrementAge } = useProfileStore();
<\/script>

<template>
  <div>
    <p>이름: {{ name.value }}</p>
    <p>이메일: {{ email.value }}</p>
    <button @click="incrementAge">
      나이: {{ age.value }}
    </button>
  </div>
</template>`}),e("h2",{children:"TypeScript 팁"}),e("p",{children:"커넥터는 스토어의 타입을 유지합니다:"}),e(t,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectVue(watch);

// TypeScript가 타입을 알고 있음
const title = useTodo(store => store.title);
// title은 Reactive<{ value: string }>

const done = useTodo(store => store.done);
// done은 Reactive<{ value: boolean }>`}),e("h2",{children:"읽기 전용 조회 view"}),e("p",{children:[e("code",{children:"connectVueView"}),"는"," ",e("a",{href:"#/ko/guide/sync-view",children:"@stateref/sync"}),"의 읽기 전용 조회 view를 연결합니다. ",e("code",{children:"connectVue"}),"와 같은 ",e("code",{children:"Watch"})," ","모양을 받지만 setter는 내주지 않습니다. 표시는 선택된 값일 수도, 서버에 존재한 적 없는 placeholder일 수도 있기 때문입니다."]}),e(t,{language:"vue",code:`<script setup lang="ts">
const view = connectVueView(live.watchDisplay);
const city = view(ref => ref.data.value);
const phase = view(ref => (ref.isPlaceholder.value ? 'placeholder' : ref.status.value));
<\/script>

<template>
  <span>{{ phase === 'pending' ? '…' : city ?? '-' }}</span>
</template>`}),e("p",{children:["실제 데이터는 로드된 뒤 ",e("code",{children:"live.ref"}),"로 편집하세요. 표시로 하지 않습니다. 이 컴포넌트의 언마운트는 ",e("strong",{children:"자기 구독만"})," 끝냅니다 — view 자체는 소유자가 ",e("code",{children:"live.dispose()"}),"로 놓으므로, 같은 view를 보는 둘째 화면은 계속 동작합니다."]}),e("h2",{children:"쓰기 규칙"}),e("ul",{children:[e("li",{children:[e("code",{children:".value"}),"에 대입하면 스토어에 ",e("strong",{children:"즉시"})," 씁니다. 바로 뒤에 스토어를 읽으면 새 값이 보입니다."]}),e("li",{children:[e("strong",{children:"선택한 객체와 배열은 읽기 전용입니다."})," ",e("code",{children:"user.value.name = 'x'"}),"는 개발 모드에서 Vue의 readonly 경고와 함께 거절되고 스토어는 바뀌지 않습니다. 리프를 선택하거나(",e("code",{children:"useStore(s => s.user.name).value = 'x'"}),") 값을 통째로 바꾸세요(",e("code",{children:["user.value = ","{ ...user.value, name }"]}),"). 원칙은 하나입니다. 커넥터를 지나가는 쓰기는 스토어에 닿고, 지나가지 않는 변경은 막습니다."]}),e("li",{children:["구독은 커넥터를 부른 스코프 — 컴포넌트의 setup, 또는 컴포저블이 도는"," ",e("code",{children:"effectScope"})," — 를 따르고, 그 스코프가 끝난 뒤의 쓰기는 어디에도 닿지 않습니다."]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화 (Flux)"})," - 액션 기반 업데이트"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - 구독 동작"]}),e("li",{children:[e("a",{href:"#/ko/guide/react",children:"React"})," - React 연동"]})]})]})),Ri=u(()=>()=>e("div",{children:[e("h1",{children:"Svelte Integration"}),e("p",{children:["Use ",e("code",{children:"@stateref/connect-svelte"})," to connect a StateRef store to Svelte. It returns Svelte ",e("code",{children:"Writable"})," stores that integrate with Svelte's reactivity."]}),e("h2",{children:"Install"}),e(t,{language:"bash",code:"pnpm add state-ref @stateref/connect-svelte"}),e("h2",{children:"Supported Versions"}),e("p",{children:["Svelte 4 and 5 (",e("code",{children:"svelte ^4.0.0 || ^5.0.0"}),"). The package major follows the newest Svelte it supports, so"," ",e("code",{children:"@stateref/connect-svelte"}),' 5.x still works with Svelte 4. The store API below works in both; Svelte 5 also has a runes entry (see "Svelte 5 Runes" below).']}),e("h2",{children:"Basic Usage"}),e("p",{children:"The Svelte connector uses a callback pattern to select which part of the store to track:"}),e(t,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';
import { connectSvelte } from '@stateref/connect-svelte';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

export const useProfile = connectSvelte(watch);`}),e(t,{language:"html",code:`<script lang="ts">
  import { useProfile } from './store';

  // Select which property to track - returns Svelte Writable
  const name = useProfile(store => store.name);
  const age = useProfile(store => store.age);
<\/script>

<div>
  <p>{$name}</p>
  <button on:click={() => $age += 1}>
    Age: {$age}
  </button>
</div>`}),e("h2",{children:"How It Works"}),e("p",{children:"The Svelte connector bridges StateRef with Svelte's store system:"}),e("ul",{children:[e("li",{children:[e("code",{children:"connectSvelte(watch)"})," returns a function that accepts a selector callback"]}),e("li",{children:"The selector receives the StateRefStore and returns the specific property to track"}),e("li",{children:["Returns a Svelte ",e("code",{children:"Writable"})," store"]}),e("li",{children:["Use the ",e("code",{children:"$"})," prefix to access and update values reactively"]}),e("li",{children:"Two-way binding: Svelte changes sync back to StateRef, and vice versa"}),e("li",{children:"Cleanup is automatic on component destroy"})]}),e("h2",{children:"Selecting Properties"}),e("p",{children:"Use the selector callback to pick specific properties:"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'en' }
});

const useStore = connectSvelte(watch);`}),e(t,{language:"html",code:`<script>
  import { useStore } from './store';

  const userName = useStore(store => store.user.name);
  const userAge = useStore(store => store.user.age);
  const theme = useStore(store => store.settings.theme);
<\/script>

<!-- Access values with $ prefix -->
<p>Name: {$userName}</p>
<p>Theme: {$theme}</p>

<!-- Update values -->
<button on:click={() => $userName = 'Jane'}>Change Name</button>
<button on:click={() => $theme = 'light'}>Toggle Theme</button>`}),e("h2",{children:"Working with Objects"}),e("p",{children:"You can also select entire objects:"}),e(t,{language:"html",code:`<script>
  import { useStore } from './store';

  // Select entire user object
  const user = useStore(store => store.user);
<\/script>

<!-- Access nested values -->
<p>Name: {$user.name}</p>
<p>Age: {$user.age}</p>

<!-- Replace entire object -->
<button on:click={() => $user = { name: 'Jane', age: 25 }}>
  Update User
</button>`}),e("h2",{children:"Manual Sync with Actions"}),e("p",{children:["With ",e("code",{children:"createStoreManualSync"}),", keep writes in actions:"]}),e(t,{language:"typescript",code:`// store.ts
import { createStoreManualSync } from 'state-ref';
import { connectSvelte } from '@stateref/connect-svelte';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounter = connectSvelte(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(t,{language:"html",code:`<script>
  import { useCounter, increment } from './store';

  const count = useCounter(store => store.count);
<\/script>

<button on:click={increment}>
  Count: {$count}
</button>`}),e("h2",{children:"Using with Svelte's Reactive Statements"}),e("p",{children:"Combine with Svelte's reactive statements for derived values:"}),e(t,{language:"html",code:`<script>
  import { useStore } from './store';

  const firstName = useStore(store => store.firstName);
  const lastName = useStore(store => store.lastName);

  // Reactive derived value
  $: fullName = \`\${$firstName} \${$lastName}\`;
<\/script>

<p>Full Name: {fullName}</p>
<input bind:value={$firstName} placeholder="First Name" />
<input bind:value={$lastName} placeholder="Last Name" />`}),e("h2",{children:"Two-Way Binding with bind:value"}),e("p",{children:"Svelte's two-way binding works seamlessly:"}),e(t,{language:"html",code:`<script>
  import { useStore } from './store';

  const name = useStore(store => store.name);
  const email = useStore(store => store.email);
<\/script>

<!-- Two-way binding -->
<input bind:value={$name} placeholder="Name" />
<input bind:value={$email} type="email" placeholder="Email" />

<p>Name: {$name}</p>
<p>Email: {$email}</p>`}),e("h2",{children:"TypeScript Tips"}),e("p",{children:"The connector preserves types from your store:"}),e(t,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectSvelte(watch);

// TypeScript knows the types
const title = useTodo(store => store.title);
// title is Writable<string>

const done = useTodo(store => store.done);
// done is Writable<boolean>`}),e("h2",{children:"Readonly Query Views"}),e("p",{children:[e("code",{children:"connectSvelteView"})," binds a readonly query view from"," ",e("a",{href:"#/guide/sync-view",children:"@stateref/sync"}),". It takes the same"," ",e("code",{children:"Watch"})," shape as ",e("code",{children:"connectSvelte"})," but never hands out setters, because a display can be a selected value or a placeholder that was never on the server."]}),e(t,{language:"html",code:`<script lang="ts">
  const view = connectSvelteView(live.watchDisplay);
  const city = view(ref => ref.data.value);
<\/script>

<span>{$city ?? '-'}</span>`}),e("p",{children:["Edit the actual data through ",e("code",{children:"live.ref"})," once it has loaded, not through the display. Unmounting this component ends"," ",e("strong",{children:"its own subscription only"})," - the view itself is released by whoever owns it, with ",e("code",{children:"live.dispose()"}),", so a second screen watching the same view keeps working."]}),e("h2",{children:"Writing Rules"}),e("ul",{children:[e("li",{children:[e("code",{children:"$user.name = 'Jane'"})," is a real store write. Svelte compiles it into ",e("code",{children:"user.set(...)"}),", which passes through the connector; the connector hands Svelte a copy, so the store changes only when that ",e("code",{children:"set"})," arrives, with a correct"," ",e("code",{children:"before"}),"."]}),e("li",{children:"When the component is destroyed, the store stops writing back."})]}),e("h2",{children:"Svelte 5 Runes"}),e("p",{children:[e("code",{children:"@stateref/connect-svelte/runes"})," is a separate, ESM-only entry for Svelte 5 (",e("code",{children:"svelte/reactivity"})," does not exist in Svelte 4). A selection is an object with ",e("code",{children:".value"}),":"]}),e(t,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';
import { connectSvelteRunes } from '@stateref/connect-svelte/runes';

export const watch = createStore({ user: { name: 'John', age: 30 } });
export const useStore = connectSvelteRunes(watch);`}),e(t,{language:"html",code:`<script lang="ts">
  import { useStore } from './store';

  const name = useStore(s => s.user.name);
  const user = useStore(s => s.user);
<\/script>

<p>{name.value} ({user.value.age})</p>
<button onclick={() => (name.value = 'Jane')}>Rename</button>
<button onclick={() => (user.value = { ...user.value, age: 31 })}>Age</button>`}),e("ul",{children:[e("li",{children:["It subscribes while a template, ",e("code",{children:"$effect"})," or"," ",e("code",{children:"$derived"})," reads ",e("code",{children:".value"}),", and releases when the last reader goes away."]}),e("li",{children:["Assigning ",e("code",{children:".value"})," writes the store synchronously. A selected object or array is a frozen copy, so"," ",e("code",{children:"user.value.age = 31"})," throws - it does not pass through the connector."]}),e("li",{children:[e("strong",{children:"It is not tied to a component."})," A selection made at module level works, and a write through it always reaches the store - unlike the store API, which stops writing back when its component is destroyed."]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - store creation"]}),e("li",{children:[e("a",{href:"#/guide/manual-sync",children:"Manual Sync (Flux)"})," - action-based updates"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - subscription behavior"]}),e("li",{children:[e("a",{href:"#/guide/vue",children:"Vue"})," - Vue integration (similar pattern)"]})]})]})),xi=u(()=>()=>e("div",{children:[e("h1",{children:"Svelte 연동"}),e("p",{children:[e("code",{children:"@stateref/connect-svelte"}),"를 사용하여 StateRef 스토어를 Svelte에 연결합니다. Svelte의 반응성과 통합되는 Svelte"," ",e("code",{children:"Writable"})," 스토어를 반환합니다."]}),e("h2",{children:"설치"}),e(t,{language:"bash",code:"pnpm add state-ref @stateref/connect-svelte"}),e("h2",{children:"지원 버전"}),e("p",{children:["Svelte 4와 5(",e("code",{children:"svelte ^4.0.0 || ^5.0.0"}),"). 패키지 메이저는 지원하는 가장 새 Svelte를 따르므로 ",e("code",{children:"@stateref/connect-svelte"})," ",'5.x는 Svelte 4에서도 동작합니다. 아래의 store API는 두 버전 모두에서 쓰고, Svelte 5에는 runes 진입점도 있습니다(아래 "Svelte 5 runes").']}),e("h2",{children:"기본 사용법"}),e("p",{children:"Svelte 커넥터는 스토어에서 추적할 부분을 선택하기 위해 콜백 패턴을 사용합니다:"}),e(t,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';
import { connectSvelte } from '@stateref/connect-svelte';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

export const useProfile = connectSvelte(watch);`}),e(t,{language:"html",code:`<script lang="ts">
  import { useProfile } from './store';

  // 추적할 프로퍼티 선택 - Svelte Writable 반환
  const name = useProfile(store => store.name);
  const age = useProfile(store => store.age);
<\/script>

<div>
  <p>{$name}</p>
  <button on:click={() => $age += 1}>
    나이: {$age}
  </button>
</div>`}),e("h2",{children:"작동 방식"}),e("p",{children:"Svelte 커넥터는 StateRef와 Svelte의 스토어 시스템을 연결합니다:"}),e("ul",{children:[e("li",{children:[e("code",{children:"connectSvelte(watch)"}),"는 셀렉터 콜백을 받는 함수를 반환합니다"]}),e("li",{children:"셀렉터는 StateRefStore를 받아서 추적할 특정 프로퍼티를 반환합니다"}),e("li",{children:["Svelte ",e("code",{children:"Writable"})," 스토어를 반환합니다"]}),e("li",{children:[e("code",{children:"$"})," 접두사를 사용하여 값을 반응적으로 접근하고 업데이트합니다"]}),e("li",{children:"양방향 바인딩: Svelte 변경이 StateRef로, 그리고 그 반대로도 동기화됩니다"}),e("li",{children:"컴포넌트 파괴 시 자동으로 정리됩니다"})]}),e("h2",{children:"프로퍼티 선택하기"}),e("p",{children:"셀렉터 콜백을 사용하여 특정 프로퍼티를 선택합니다:"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'ko' }
});

const useStore = connectSvelte(watch);`}),e(t,{language:"html",code:`<script>
  import { useStore } from './store';

  const userName = useStore(store => store.user.name);
  const userAge = useStore(store => store.user.age);
  const theme = useStore(store => store.settings.theme);
<\/script>

<!-- $ 접두사로 값 접근 -->
<p>이름: {$userName}</p>
<p>테마: {$theme}</p>

<!-- 값 업데이트 -->
<button on:click={() => $userName = 'Jane'}>이름 변경</button>
<button on:click={() => $theme = 'light'}>테마 토글</button>`}),e("h2",{children:"객체 다루기"}),e("p",{children:"전체 객체를 선택할 수도 있습니다:"}),e(t,{language:"html",code:`<script>
  import { useStore } from './store';

  // 전체 user 객체 선택
  const user = useStore(store => store.user);
<\/script>

<!-- 중첩된 값 접근 -->
<p>이름: {$user.name}</p>
<p>나이: {$user.age}</p>

<!-- 전체 객체 교체 -->
<button on:click={() => $user = { name: 'Jane', age: 25 }}>
  사용자 업데이트
</button>`}),e("h2",{children:"액션과 함께 수동 동기화"}),e("p",{children:[e("code",{children:"createStoreManualSync"}),"를 사용하면 쓰기는 액션에서 처리합니다:"]}),e(t,{language:"typescript",code:`// store.ts
import { createStoreManualSync } from 'state-ref';
import { connectSvelte } from '@stateref/connect-svelte';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounter = connectSvelte(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(t,{language:"html",code:`<script>
  import { useCounter, increment } from './store';

  const count = useCounter(store => store.count);
<\/script>

<button on:click={increment}>
  Count: {$count}
</button>`}),e("h2",{children:"Svelte의 반응형 구문과 함께 사용"}),e("p",{children:"파생 값을 위해 Svelte의 반응형 구문과 결합합니다:"}),e(t,{language:"html",code:`<script>
  import { useStore } from './store';

  const firstName = useStore(store => store.firstName);
  const lastName = useStore(store => store.lastName);

  // 반응형 파생 값
  $: fullName = \`\${$firstName} \${$lastName}\`;
<\/script>

<p>전체 이름: {fullName}</p>
<input bind:value={$firstName} placeholder="이름" />
<input bind:value={$lastName} placeholder="성" />`}),e("h2",{children:"bind:value와 양방향 바인딩"}),e("p",{children:"Svelte의 양방향 바인딩이 원활하게 작동합니다:"}),e(t,{language:"html",code:`<script>
  import { useStore } from './store';

  const name = useStore(store => store.name);
  const email = useStore(store => store.email);
<\/script>

<!-- 양방향 바인딩 -->
<input bind:value={$name} placeholder="이름" />
<input bind:value={$email} type="email" placeholder="이메일" />

<p>이름: {$name}</p>
<p>이메일: {$email}</p>`}),e("h2",{children:"TypeScript 팁"}),e("p",{children:"커넥터는 스토어의 타입을 유지합니다:"}),e(t,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectSvelte(watch);

// TypeScript가 타입을 알고 있음
const title = useTodo(store => store.title);
// title은 Writable<string>

const done = useTodo(store => store.done);
// done은 Writable<boolean>`}),e("h2",{children:"읽기 전용 조회 view"}),e("p",{children:[e("code",{children:"connectSvelteView"}),"는"," ",e("a",{href:"#/ko/guide/sync-view",children:"@stateref/sync"}),"의 읽기 전용 조회 view를 연결합니다. ",e("code",{children:"connectSvelte"}),"와 같은 ",e("code",{children:"Watch"})," ","모양을 받지만 setter는 내주지 않습니다. 표시는 선택된 값일 수도, 서버에 존재한 적 없는 placeholder일 수도 있기 때문입니다."]}),e(t,{language:"html",code:`<script lang="ts">
  const view = connectSvelteView(live.watchDisplay);
  const city = view(ref => ref.data.value);
<\/script>

<span>{$city ?? '-'}</span>`}),e("p",{children:["실제 데이터는 로드된 뒤 ",e("code",{children:"live.ref"}),"로 편집하세요. 표시로 하지 않습니다. 이 컴포넌트의 언마운트는 ",e("strong",{children:"자기 구독만"})," 끝냅니다 — view 자체는 소유자가 ",e("code",{children:"live.dispose()"}),"로 놓으므로, 같은 view를 보는 둘째 화면은 계속 동작합니다."]}),e("h2",{children:"쓰기 규칙"}),e("ul",{children:[e("li",{children:[e("code",{children:"$user.name = 'Jane'"}),"은 실제 스토어 쓰기입니다. Svelte가 이것을 ",e("code",{children:"user.set(...)"}),"으로 컴파일해 커넥터를 지나가게 하고, 커넥터는 Svelte에 복사본을 주므로 스토어는 그 ",e("code",{children:"set"}),"이 도착할 때 올바른 ",e("code",{children:"before"}),"와 함께 바뀝니다."]}),e("li",{children:"컴포넌트가 사라지면 스토어로의 되쓰기도 멈춥니다."})]}),e("h2",{children:"Svelte 5 runes"}),e("p",{children:[e("code",{children:"@stateref/connect-svelte/runes"}),"는 Svelte 5용 별도 진입점이고 ESM 전용입니다(Svelte 4에는 ",e("code",{children:"svelte/reactivity"}),"가 없습니다). 선택은 ",e("code",{children:".value"}),"를 가진 객체입니다."]}),e(t,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';
import { connectSvelteRunes } from '@stateref/connect-svelte/runes';

export const watch = createStore({ user: { name: 'John', age: 30 } });
export const useStore = connectSvelteRunes(watch);`}),e(t,{language:"html",code:`<script lang="ts">
  import { useStore } from './store';

  const name = useStore(s => s.user.name);
  const user = useStore(s => s.user);
<\/script>

<p>{name.value} ({user.value.age})</p>
<button onclick={() => (name.value = 'Jane')}>Rename</button>
<button onclick={() => (user.value = { ...user.value, age: 31 })}>Age</button>`}),e("ul",{children:[e("li",{children:["템플릿, ",e("code",{children:"$effect"}),", ",e("code",{children:"$derived"}),"가"," ",e("code",{children:".value"}),"를 읽는 동안 구독하고, 마지막 읽는 쪽이 사라지면 놓습니다."]}),e("li",{children:[e("code",{children:".value"}),"에 대입하면 스토어에 즉시 씁니다. 선택한 객체·배열은 얼린 복사본이라 ",e("code",{children:"user.value.age = 31"}),"은 오류가 납니다 — 커넥터를 지나가지 않기 때문입니다."]}),e("li",{children:[e("strong",{children:"컴포넌트에 묶이지 않습니다."})," 모듈 수준에서 만든 선택도 동작하고, 그것을 통한 쓰기는 언제나 스토어에 닿습니다. 컴포넌트가 사라지면 되쓰기를 멈추는 store API와 다른 점입니다."]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화 (Flux)"})," - 액션 기반 업데이트"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - 구독 동작"]}),e("li",{children:[e("a",{href:"#/ko/guide/vue",children:"Vue"})," - Vue 연동 (유사한 패턴)"]})]})]})),Ci=u(()=>()=>e("div",{children:[e("h1",{children:"Solid Integration"}),e("p",{children:["Use ",e("code",{children:"@stateref/connect-solid"})," to connect a StateRef store to Solid.js. It returns Solid ",e("code",{children:"Signal"})," pairs that integrate with Solid's fine-grained reactivity."]}),e("h2",{children:"Install"}),e(t,{language:"bash",code:"pnpm add state-ref @stateref/connect-solid"}),e("h2",{children:"Supported Versions"}),e("p",{children:["Solid 1.9 (",e("code",{children:"solid-js ^1.9.1"}),")."]}),e("h2",{children:"Basic Usage"}),e("p",{children:"The Solid connector uses a callback pattern to select which part of the store to track:"}),e(t,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';
import { connectSolid } from '@stateref/connect-solid';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

export const useProfile = connectSolid(watch);`}),e(t,{language:"tsx",code:`import { useProfile } from './store';

function ProfileCard() {
  // Returns [getter, setter] Signal pair
  const [name, setName] = useProfile(store => store.name);
  const [age, setAge] = useProfile(store => store.age);

  return (
    <div>
      <p>{name()}</p>
      <button onClick={() => setAge(prev => prev + 1)}>
        Age: {age()}
      </button>
    </div>
  );
}`}),e("h2",{children:"How It Works"}),e("p",{children:"The Solid connector bridges StateRef with Solid's signal system:"}),e("ul",{children:[e("li",{children:[e("code",{children:"connectSolid(watch)"})," returns a function that accepts a selector callback"]}),e("li",{children:"The selector receives the StateRefStore and returns the specific property to track"}),e("li",{children:["Returns a Solid ",e("code",{children:"Signal"})," pair:"," ",e("code",{children:"[getter, setter]"})]}),e("li",{children:["Call the getter function to read values: ",e("code",{children:"name()"})]}),e("li",{children:["Use the setter function to update values: ",e("code",{children:"setName('Jane')"})]}),e("li",{children:"Two-way binding: Solid changes sync back to StateRef, and vice versa"}),e("li",{children:["Cleanup is automatic via ",e("code",{children:"onCleanup"})]})]}),e("h2",{children:"Selecting Properties"}),e("p",{children:"Use the selector callback to pick specific properties:"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'en' }
});

const useStore = connectSolid(watch);`}),e(t,{language:"tsx",code:`import { useStore } from './store';

function Settings() {
  const [userName, setUserName] = useStore(store => store.user.name);
  const [userAge, setUserAge] = useStore(store => store.user.age);
  const [theme, setTheme] = useStore(store => store.settings.theme);

  return (
    <div>
      {/* Access values with getter function */}
      <p>Name: {userName()}</p>
      <p>Theme: {theme()}</p>

      {/* Update values with setter function */}
      <button onClick={() => setUserName('Jane')}>Change Name</button>
      <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
        Toggle Theme
      </button>
    </div>
  );
}`}),e("h2",{children:"Working with Objects"}),e("p",{children:"You can also select entire objects:"}),e(t,{language:"tsx",code:`import { useStore } from './store';

function UserCard() {
  // Select entire user object
  const [user, setUser] = useStore(store => store.user);

  return (
    <div>
      {/* Access nested values */}
      <p>Name: {user().name}</p>
      <p>Age: {user().age}</p>

      {/* Replace entire object */}
      <button onClick={() => setUser({ name: 'Jane', age: 25 })}>
        Update User
      </button>
    </div>
  );
}`}),e("h2",{children:"Manual Sync with Actions"}),e("p",{children:["With ",e("code",{children:"createStoreManualSync"}),", keep writes in actions:"]}),e(t,{language:"typescript",code:`// store.ts
import { createStoreManualSync } from 'state-ref';
import { connectSolid } from '@stateref/connect-solid';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounter = connectSolid(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(t,{language:"tsx",code:`import { useCounter, increment } from './store';

function Counter() {
  const [count] = useCounter(store => store.count);

  return (
    <button onClick={increment}>
      Count: {count()}
    </button>
  );
}`}),e("h2",{children:"Using with Solid's Reactive Primitives"}),e("p",{children:"Combine with Solid's reactive primitives for derived values:"}),e(t,{language:"tsx",code:`import { createMemo } from 'solid-js';
import { useStore } from './store';

function FullName() {
  const [firstName] = useStore(store => store.firstName);
  const [lastName] = useStore(store => store.lastName);

  // Derived value using createMemo
  const fullName = createMemo(() => \`\${firstName()} \${lastName()}\`);

  return <p>Full Name: {fullName()}</p>;
}`}),e("h2",{children:"Input Binding Pattern"}),e("p",{children:"Handle input binding with Solid:"}),e(t,{language:"tsx",code:`import { useStore } from './store';

function Form() {
  const [name, setName] = useStore(store => store.name);
  const [email, setEmail] = useStore(store => store.email);

  return (
    <div>
      <input
        value={name()}
        onInput={(e) => setName(e.currentTarget.value)}
        placeholder="Name"
      />
      <input
        value={email()}
        onInput={(e) => setEmail(e.currentTarget.value)}
        type="email"
        placeholder="Email"
      />

      <p>Name: {name()}</p>
      <p>Email: {email()}</p>
    </div>
  );
}`}),e("h2",{children:"TypeScript Tips"}),e("p",{children:"The connector preserves types from your store:"}),e(t,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectSolid(watch);

// TypeScript knows the types
const [title, setTitle] = useTodo(store => store.title);
// title is Accessor<string>, setTitle is Setter<string>

const [done, setDone] = useTodo(store => store.done);
// done is Accessor<boolean>, setDone is Setter<boolean>`}),e("h2",{children:"Readonly Query Views"}),e("p",{children:[e("code",{children:"connectSolidView"})," binds a readonly query view from"," ",e("a",{href:"#/guide/sync-view",children:"@stateref/sync"}),". It takes the same"," ",e("code",{children:"Watch"})," shape as ",e("code",{children:"connectSolid"})," but never hands out setters, because a display can be a selected value or a placeholder that was never on the server."]}),e(t,{language:"tsx",code:`function CityDisplay() {
  const view = connectSolidView(live.watchDisplay);
  const city = view(ref => ref.data.value);
  return <span>{city() ?? '-'}</span>;
}`}),e("p",{children:["Edit the actual data through ",e("code",{children:"live.ref"})," once it has loaded, not through the display. Unmounting this component ends"," ",e("strong",{children:"its own subscription only"})," - the view itself is released by whoever owns it, with ",e("code",{children:"live.dispose()"}),", so a second screen watching the same view keeps working."]}),e("h2",{children:"Writing Rules"}),e("ul",{children:[e("li",{children:["The setter writes the store directly and"," ",e("strong",{children:"synchronously"}),", including a functional update:"," ",e("code",{children:["setUser(prev => (","{ ...prev, name: 'Jane' }","))"]}),"."]}),e("li",{children:[e("strong",{children:"The accessor returns a frozen copy of an object or array."})," ",e("code",{children:"user().name = 'x'"}),", or a functional update that mutates"," ",e("code",{children:"prev"})," and returns it, throws a TypeError and the store is untouched - neither passes through the connector. Return a new value from the setter instead."]}),e("li",{children:["A server render is detected with ",e("code",{children:"isServer"})," and subscribes to nothing."]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - store creation"]}),e("li",{children:[e("a",{href:"#/guide/manual-sync",children:"Manual Sync (Flux)"})," - action-based updates"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - subscription behavior"]}),e("li",{children:[e("a",{href:"#/guide/svelte",children:"Svelte"})," - Svelte integration"]})]})]})),Ti=u(()=>()=>e("div",{children:[e("h1",{children:"Solid 연동"}),e("p",{children:[e("code",{children:"@stateref/connect-solid"}),"를 사용하여 StateRef 스토어를 Solid.js에 연결합니다. Solid의 세밀한 반응성과 통합되는 Solid"," ",e("code",{children:"Signal"})," 쌍을 반환합니다."]}),e("h2",{children:"설치"}),e(t,{language:"bash",code:"pnpm add state-ref @stateref/connect-solid"}),e("h2",{children:"지원 버전"}),e("p",{children:["Solid 1.9(",e("code",{children:"solid-js ^1.9.1"}),")."]}),e("h2",{children:"기본 사용법"}),e("p",{children:"Solid 커넥터는 스토어에서 추적할 부분을 선택하기 위해 콜백 패턴을 사용합니다:"}),e(t,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';
import { connectSolid } from '@stateref/connect-solid';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

export const useProfile = connectSolid(watch);`}),e(t,{language:"tsx",code:`import { useProfile } from './store';

function ProfileCard() {
  // [getter, setter] Signal 쌍 반환
  const [name, setName] = useProfile(store => store.name);
  const [age, setAge] = useProfile(store => store.age);

  return (
    <div>
      <p>{name()}</p>
      <button onClick={() => setAge(prev => prev + 1)}>
        나이: {age()}
      </button>
    </div>
  );
}`}),e("h2",{children:"작동 방식"}),e("p",{children:"Solid 커넥터는 StateRef와 Solid의 시그널 시스템을 연결합니다:"}),e("ul",{children:[e("li",{children:[e("code",{children:"connectSolid(watch)"}),"는 셀렉터 콜백을 받는 함수를 반환합니다"]}),e("li",{children:"셀렉터는 StateRefStore를 받아서 추적할 특정 프로퍼티를 반환합니다"}),e("li",{children:["Solid ",e("code",{children:"Signal"})," 쌍을 반환합니다:"," ",e("code",{children:"[getter, setter]"})]}),e("li",{children:["getter 함수를 호출하여 값을 읽습니다: ",e("code",{children:"name()"})]}),e("li",{children:["setter 함수를 사용하여 값을 업데이트합니다:"," ",e("code",{children:"setName('Jane')"})]}),e("li",{children:"양방향 바인딩: Solid 변경이 StateRef로, 그리고 그 반대로도 동기화됩니다"}),e("li",{children:[e("code",{children:"onCleanup"}),"을 통해 자동으로 정리됩니다"]})]}),e("h2",{children:"프로퍼티 선택하기"}),e("p",{children:"셀렉터 콜백을 사용하여 특정 프로퍼티를 선택합니다:"}),e(t,{language:"typescript",code:`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'ko' }
});

const useStore = connectSolid(watch);`}),e(t,{language:"tsx",code:`import { useStore } from './store';

function Settings() {
  const [userName, setUserName] = useStore(store => store.user.name);
  const [userAge, setUserAge] = useStore(store => store.user.age);
  const [theme, setTheme] = useStore(store => store.settings.theme);

  return (
    <div>
      {/* getter 함수로 값 접근 */}
      <p>이름: {userName()}</p>
      <p>테마: {theme()}</p>

      {/* setter 함수로 값 업데이트 */}
      <button onClick={() => setUserName('Jane')}>이름 변경</button>
      <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
        테마 토글
      </button>
    </div>
  );
}`}),e("h2",{children:"객체 다루기"}),e("p",{children:"전체 객체를 선택할 수도 있습니다:"}),e(t,{language:"tsx",code:`import { useStore } from './store';

function UserCard() {
  // 전체 user 객체 선택
  const [user, setUser] = useStore(store => store.user);

  return (
    <div>
      {/* 중첩된 값 접근 */}
      <p>이름: {user().name}</p>
      <p>나이: {user().age}</p>

      {/* 전체 객체 교체 */}
      <button onClick={() => setUser({ name: 'Jane', age: 25 })}>
        사용자 업데이트
      </button>
    </div>
  );
}`}),e("h2",{children:"액션과 함께 수동 동기화"}),e("p",{children:[e("code",{children:"createStoreManualSync"}),"를 사용하면 쓰기는 액션에서 처리합니다:"]}),e(t,{language:"typescript",code:`// store.ts
import { createStoreManualSync } from 'state-ref';
import { connectSolid } from '@stateref/connect-solid';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounter = connectSolid(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(t,{language:"tsx",code:`import { useCounter, increment } from './store';

function Counter() {
  const [count] = useCounter(store => store.count);

  return (
    <button onClick={increment}>
      Count: {count()}
    </button>
  );
}`}),e("h2",{children:"Solid의 반응형 프리미티브와 함께 사용"}),e("p",{children:"파생 값을 위해 Solid의 반응형 프리미티브와 결합합니다:"}),e(t,{language:"tsx",code:`import { createMemo } from 'solid-js';
import { useStore } from './store';

function FullName() {
  const [firstName] = useStore(store => store.firstName);
  const [lastName] = useStore(store => store.lastName);

  // createMemo로 파생 값 생성
  const fullName = createMemo(() => \`\${firstName()} \${lastName()}\`);

  return <p>전체 이름: {fullName()}</p>;
}`}),e("h2",{children:"입력 바인딩 패턴"}),e("p",{children:"Solid에서 입력 바인딩을 처리합니다:"}),e(t,{language:"tsx",code:`import { useStore } from './store';

function Form() {
  const [name, setName] = useStore(store => store.name);
  const [email, setEmail] = useStore(store => store.email);

  return (
    <div>
      <input
        value={name()}
        onInput={(e) => setName(e.currentTarget.value)}
        placeholder="이름"
      />
      <input
        value={email()}
        onInput={(e) => setEmail(e.currentTarget.value)}
        type="email"
        placeholder="이메일"
      />

      <p>이름: {name()}</p>
      <p>이메일: {email()}</p>
    </div>
  );
}`}),e("h2",{children:"TypeScript 팁"}),e("p",{children:"커넥터는 스토어의 타입을 유지합니다:"}),e(t,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectSolid(watch);

// TypeScript가 타입을 알고 있음
const [title, setTitle] = useTodo(store => store.title);
// title은 Accessor<string>, setTitle은 Setter<string>

const [done, setDone] = useTodo(store => store.done);
// done은 Accessor<boolean>, setDone은 Setter<boolean>`}),e("h2",{children:"읽기 전용 조회 view"}),e("p",{children:[e("code",{children:"connectSolidView"}),"는"," ",e("a",{href:"#/ko/guide/sync-view",children:"@stateref/sync"}),"의 읽기 전용 조회 view를 연결합니다. ",e("code",{children:"connectSolid"}),"와 같은 ",e("code",{children:"Watch"})," ","모양을 받지만 setter는 내주지 않습니다. 표시는 선택된 값일 수도, 서버에 존재한 적 없는 placeholder일 수도 있기 때문입니다."]}),e(t,{language:"tsx",code:`function CityDisplay() {
  const view = connectSolidView(live.watchDisplay);
  const city = view(ref => ref.data.value);
  return <span>{city() ?? '-'}</span>;
}`}),e("p",{children:["실제 데이터는 로드된 뒤 ",e("code",{children:"live.ref"}),"로 편집하세요. 표시로 하지 않습니다. 이 컴포넌트의 언마운트는 ",e("strong",{children:"자기 구독만"})," 끝냅니다 — view 자체는 소유자가 ",e("code",{children:"live.dispose()"}),"로 놓으므로, 같은 view를 보는 둘째 화면은 계속 동작합니다."]}),e("h2",{children:"쓰기 규칙"}),e("ul",{children:[e("li",{children:["setter는 스토어에 직접, ",e("strong",{children:"즉시"})," 씁니다. 함수형 갱신도 됩니다:"," ",e("code",{children:["setUser(prev => (","{ ...prev, name: 'Jane' }","))"]}),"."]}),e("li",{children:[e("strong",{children:"accessor는 객체·배열의 얼린 복사본을 돌려줍니다."})," ",e("code",{children:"user().name = 'x'"}),"나 ",e("code",{children:"prev"}),"를 바꿔 그대로 돌려주는 함수형 갱신은 TypeError를 내고 스토어는 바뀌지 않습니다 — 둘 다 커넥터를 지나가지 않기 때문입니다. setter에 새 값을 돌려주세요."]}),e("li",{children:["서버 렌더는 ",e("code",{children:"isServer"}),"로 판정하고 아무것도 구독하지 않습니다."]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화 (Flux)"})," - 액션 기반 업데이트"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - 구독 동작"]}),e("li",{children:[e("a",{href:"#/ko/guide/svelte",children:"Svelte"})," - Svelte 연동"]})]})]})),Ai=u(()=>()=>e("div",{children:[e("h1",{children:"Lithent Integration"}),e("p",{children:["Lithent is a lightweight Virtual DOM library. StateRef integrates directly with Lithent without needing a separate connector package. Simply pass the ",e("code",{children:"renew"})," function to ",e("code",{children:"watch()"}),"."]}),e("h2",{children:"Install"}),e(t,{language:"bash",code:"pnpm add state-ref lithent"}),e("h2",{children:"Basic Usage"}),e("p",{children:["Pass the ",e("code",{children:"renew"})," function from ",e("code",{children:"mount()"})," directly to ",e("code",{children:"watch()"}),":"]}),e(t,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';

type Profile = { name: string; age: number };

export const profileStore = createStore<Profile>({ name: 'Lee', age: 20 });`}),e(t,{language:"tsx",code:`import { mount } from 'lithent';
import { profileStore } from './store';

export const ProfileCard = mount(renew => {
  // Pass renew directly to watch - no connector needed
  const store = profileStore(renew);

  return () => (
    <div>
      <p>Name: {store.name.value}</p>
      <button onClick={() => store.age.value += 1}>
        Age: {store.age.value}
      </button>
    </div>
  );
});`}),e("h2",{children:"How It Works"}),e("p",{children:"Lithent's architecture makes StateRef integration seamless:"}),e("ul",{children:[e("li",{children:[e("code",{children:"mount(renew => ...)"})," provides a ",e("code",{children:"renew"})," ","function that triggers re-renders"]}),e("li",{children:[e("code",{children:"watch(renew)"})," registers ",e("code",{children:"renew"})," as a subscriber"]}),e("li",{children:["Returns a ",e("code",{children:"StateRefStore"})," for reading and writing values"]}),e("li",{children:["Access values via ",e("code",{children:".value"})," property"]}),e("li",{children:["When values change, ",e("code",{children:"renew"})," is called automatically"]}),e("li",{children:"The component re-renders with updated values"})]}),e("h2",{children:"Component Structure"}),e("p",{children:"Lithent components have two phases - setup and render:"}),e(t,{language:"tsx",code:`import { mount } from 'lithent';
import { profileStore } from './store';

export const MyComponent = mount(renew => {
  // Setup phase: runs once when component mounts
  const store = profileStore(renew);

  // You can define handlers here
  const incrementAge = () => {
    store.age.value += 1;
  };

  // Return render function
  return () => (
    // Render phase: runs on every update
    <div>
      <p>{store.name.value}</p>
      <button onClick={incrementAge}>
        Age: {store.age.value}
      </button>
    </div>
  );
});`}),e("h2",{children:"Multiple Stores"}),e("p",{children:"Subscribe to multiple stores in a single component:"}),e(t,{language:"typescript",code:`// stores.ts
import { createStore } from 'state-ref';

export const userStore = createStore({ name: 'John', age: 30 });
export const settingsStore = createStore({ theme: 'dark', lang: 'en' });`}),e(t,{language:"tsx",code:`import { mount } from 'lithent';
import { userStore, settingsStore } from './stores';

export const Dashboard = mount(renew => {
  // Subscribe to multiple stores with the same renew
  const user = userStore(renew);
  const settings = settingsStore(renew);

  return () => (
    <div class={settings.theme.value}>
      <h1>Welcome, {user.name.value}!</h1>
      <p>Language: {settings.lang.value}</p>
      <button onClick={() => {
        settings.theme.value = settings.theme.value === 'dark' ? 'light' : 'dark';
      }}>
        Toggle Theme
      </button>
    </div>
  );
});`}),e("h2",{children:"Nested Properties"}),e("p",{children:"Access deeply nested values naturally:"}),e(t,{language:"tsx",code:`import { mount } from 'lithent';
import { createStore } from 'state-ref';

const appStore = createStore({
  user: {
    profile: {
      name: 'John',
      avatar: '/img/default.png'
    },
    preferences: {
      notifications: true
    }
  }
});

export const UserProfile = mount(renew => {
  const store = appStore(renew);

  return () => (
    <div>
      <img src={store.user.profile.avatar.value} alt="avatar" />
      <p>{store.user.profile.name.value}</p>
      <label>
        <input
          type="checkbox"
          checked={store.user.preferences.notifications.value}
          onChange={(e) => {
            store.user.preferences.notifications.value = e.target.checked;
          }}
        />
        Enable notifications
      </label>
    </div>
  );
});`}),e("h2",{children:"Manual Sync with Actions"}),e("p",{children:["Use ",e("code",{children:"createStoreManualSync"})," for Flux-style state management:"]}),e(t,{language:"typescript",code:`// store.ts
import { createStoreManualSync } from 'state-ref';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const counterStore = watch;

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};

export const decrement = () => {
  updateRef.count.value -= 1;
  sync();
};`}),e(t,{language:"tsx",code:`import { mount } from 'lithent';
import { counterStore, increment, decrement } from './store';

export const Counter = mount(renew => {
  const store = counterStore(renew);

  return () => (
    <div>
      <button onClick={decrement}>-</button>
      <span>{store.count.value}</span>
      <button onClick={increment}>+</button>
    </div>
  );
});`}),e("h2",{children:"Using with Helper Functions"}),e("p",{children:"Combine with StateRef helper functions:"}),e(t,{language:"tsx",code:`import { mount } from 'lithent';
import { createStore, createComputed, combineWatch } from 'state-ref';

const firstNameStore = createStore({ value: 'John' });
const lastNameStore = createStore({ value: 'Doe' });

// Create computed value
const fullName = createComputed(
  [firstNameStore, lastNameStore],
  (first, last) => \`\${first.value.value} \${last.value.value}\`
);

export const NameDisplay = mount(renew => {
  const firstName = firstNameStore(renew);
  const lastName = lastNameStore(renew);
  const computed = fullName(renew);

  return () => (
    <div>
      <input
        value={firstName.value.value}
        onInput={(e) => firstName.value.value = e.target.value}
      />
      <input
        value={lastName.value.value}
        onInput={(e) => lastName.value.value = e.target.value}
      />
      <p>Full name: {computed.value}</p>
    </div>
  );
});`}),e("h2",{children:"Form Handling"}),e("p",{children:"Handle form inputs with direct binding:"}),e(t,{language:"tsx",code:`import { mount } from 'lithent';
import { createStore } from 'state-ref';

const formStore = createStore({
  name: '',
  email: '',
  message: ''
});

export const ContactForm = mount(renew => {
  const form = formStore(renew);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log({
      name: form.name.value,
      email: form.email.value,
      message: form.message.value
    });
  };

  return () => (
    <form onSubmit={handleSubmit}>
      <input
        value={form.name.value}
        onInput={(e) => form.name.value = e.target.value}
        placeholder="Name"
      />
      <input
        value={form.email.value}
        onInput={(e) => form.email.value = e.target.value}
        type="email"
        placeholder="Email"
      />
      <textarea
        value={form.message.value}
        onInput={(e) => form.message.value = e.target.value}
        placeholder="Message"
      />
      <button type="submit">Send</button>
    </form>
  );
});`}),e("h2",{children:"TypeScript Tips"}),e("p",{children:"Full type inference works automatically:"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

type Todo = { title: string; done: boolean };
const todoStore = createStore<Todo>({ title: 'Write docs', done: false });

// In component
const store = todoStore(renew);
// store.title is StateRefStore<string>
// store.title.value is string
// store.done.value is boolean`}),e("h2",{children:"Why No Connector?"}),e("p",{children:"Unlike other frameworks, Lithent doesn't need a connector because:"}),e("ul",{children:[e("li",{children:["Lithent's ",e("code",{children:"renew"})," function has the exact signature StateRef expects"]}),e("li",{children:"The setup/render separation aligns perfectly with subscription patterns"}),e("li",{children:"No framework-specific reactivity system to bridge"}),e("li",{children:"Direct integration means zero overhead"})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - store creation"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - subscription behavior"]}),e("li",{children:[e("a",{href:"#/guide/manual-sync",children:"Manual Sync (Flux)"})," - action-based updates"]}),e("li",{children:[e("a",{href:"#/guide/computed",children:"createComputed"})," - derived values"]})]})]})),Wi=u(()=>()=>e("div",{children:[e("h1",{children:"Lithent 연동"}),e("p",{children:["Lithent는 경량 Virtual DOM 라이브러리입니다. StateRef는 별도의 커넥터 패키지 없이 Lithent와 직접 통합됩니다. 단순히 ",e("code",{children:"renew"})," 함수를"," ",e("code",{children:"watch()"}),"에 전달하면 됩니다."]}),e("h2",{children:"설치"}),e(t,{language:"bash",code:"pnpm add state-ref lithent"}),e("h2",{children:"기본 사용법"}),e("p",{children:[e("code",{children:"mount()"}),"에서 받은 ",e("code",{children:"renew"})," 함수를"," ",e("code",{children:"watch()"}),"에 직접 전달합니다:"]}),e(t,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';

type Profile = { name: string; age: number };

export const profileStore = createStore<Profile>({ name: 'Lee', age: 20 });`}),e(t,{language:"tsx",code:`import { mount } from 'lithent';
import { profileStore } from './store';

export const ProfileCard = mount(renew => {
  // renew를 watch에 직접 전달 - 커넥터 불필요
  const store = profileStore(renew);

  return () => (
    <div>
      <p>이름: {store.name.value}</p>
      <button onClick={() => store.age.value += 1}>
        나이: {store.age.value}
      </button>
    </div>
  );
});`}),e("h2",{children:"작동 방식"}),e("p",{children:"Lithent의 아키텍처는 StateRef 통합을 매끄럽게 만듭니다:"}),e("ul",{children:[e("li",{children:[e("code",{children:"mount(renew => ...)"}),"는 리렌더링을 트리거하는"," ",e("code",{children:"renew"})," 함수를 제공합니다"]}),e("li",{children:[e("code",{children:"watch(renew)"}),"는 ",e("code",{children:"renew"}),"를 구독자로 등록합니다"]}),e("li",{children:["값을 읽고 쓰기 위한 ",e("code",{children:"StateRefStore"}),"를 반환합니다"]}),e("li",{children:[e("code",{children:".value"})," 프로퍼티로 값에 접근합니다"]}),e("li",{children:["값이 변경되면 ",e("code",{children:"renew"}),"가 자동으로 호출됩니다"]}),e("li",{children:"컴포넌트가 업데이트된 값으로 리렌더링됩니다"})]}),e("h2",{children:"컴포넌트 구조"}),e("p",{children:"Lithent 컴포넌트는 설정과 렌더 두 단계로 구성됩니다:"}),e(t,{language:"tsx",code:`import { mount } from 'lithent';
import { profileStore } from './store';

export const MyComponent = mount(renew => {
  // 설정 단계: 컴포넌트 마운트 시 한 번 실행
  const store = profileStore(renew);

  // 여기서 핸들러를 정의할 수 있음
  const incrementAge = () => {
    store.age.value += 1;
  };

  // 렌더 함수 반환
  return () => (
    // 렌더 단계: 업데이트마다 실행
    <div>
      <p>{store.name.value}</p>
      <button onClick={incrementAge}>
        나이: {store.age.value}
      </button>
    </div>
  );
});`}),e("h2",{children:"여러 스토어 사용"}),e("p",{children:"하나의 컴포넌트에서 여러 스토어를 구독합니다:"}),e(t,{language:"typescript",code:`// stores.ts
import { createStore } from 'state-ref';

export const userStore = createStore({ name: 'John', age: 30 });
export const settingsStore = createStore({ theme: 'dark', lang: 'ko' });`}),e(t,{language:"tsx",code:`import { mount } from 'lithent';
import { userStore, settingsStore } from './stores';

export const Dashboard = mount(renew => {
  // 동일한 renew로 여러 스토어 구독
  const user = userStore(renew);
  const settings = settingsStore(renew);

  return () => (
    <div class={settings.theme.value}>
      <h1>환영합니다, {user.name.value}님!</h1>
      <p>언어: {settings.lang.value}</p>
      <button onClick={() => {
        settings.theme.value = settings.theme.value === 'dark' ? 'light' : 'dark';
      }}>
        테마 토글
      </button>
    </div>
  );
});`}),e("h2",{children:"중첩된 프로퍼티"}),e("p",{children:"깊게 중첩된 값에 자연스럽게 접근합니다:"}),e(t,{language:"tsx",code:`import { mount } from 'lithent';
import { createStore } from 'state-ref';

const appStore = createStore({
  user: {
    profile: {
      name: 'John',
      avatar: '/img/default.png'
    },
    preferences: {
      notifications: true
    }
  }
});

export const UserProfile = mount(renew => {
  const store = appStore(renew);

  return () => (
    <div>
      <img src={store.user.profile.avatar.value} alt="avatar" />
      <p>{store.user.profile.name.value}</p>
      <label>
        <input
          type="checkbox"
          checked={store.user.preferences.notifications.value}
          onChange={(e) => {
            store.user.preferences.notifications.value = e.target.checked;
          }}
        />
        알림 활성화
      </label>
    </div>
  );
});`}),e("h2",{children:"액션과 함께 수동 동기화"}),e("p",{children:["Flux 스타일 상태 관리를 위해 ",e("code",{children:"createStoreManualSync"}),"를 사용합니다:"]}),e(t,{language:"typescript",code:`// store.ts
import { createStoreManualSync } from 'state-ref';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const counterStore = watch;

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};

export const decrement = () => {
  updateRef.count.value -= 1;
  sync();
};`}),e(t,{language:"tsx",code:`import { mount } from 'lithent';
import { counterStore, increment, decrement } from './store';

export const Counter = mount(renew => {
  const store = counterStore(renew);

  return () => (
    <div>
      <button onClick={decrement}>-</button>
      <span>{store.count.value}</span>
      <button onClick={increment}>+</button>
    </div>
  );
});`}),e("h2",{children:"헬퍼 함수와 함께 사용"}),e("p",{children:"StateRef 헬퍼 함수와 결합합니다:"}),e(t,{language:"tsx",code:`import { mount } from 'lithent';
import { createStore, createComputed, combineWatch } from 'state-ref';

const firstNameStore = createStore({ value: 'John' });
const lastNameStore = createStore({ value: 'Doe' });

// computed 값 생성
const fullName = createComputed(
  [firstNameStore, lastNameStore],
  (first, last) => \`\${first.value.value} \${last.value.value}\`
);

export const NameDisplay = mount(renew => {
  const firstName = firstNameStore(renew);
  const lastName = lastNameStore(renew);
  const computed = fullName(renew);

  return () => (
    <div>
      <input
        value={firstName.value.value}
        onInput={(e) => firstName.value.value = e.target.value}
      />
      <input
        value={lastName.value.value}
        onInput={(e) => lastName.value.value = e.target.value}
      />
      <p>전체 이름: {computed.value}</p>
    </div>
  );
});`}),e("h2",{children:"폼 처리"}),e("p",{children:"직접 바인딩으로 폼 입력을 처리합니다:"}),e(t,{language:"tsx",code:`import { mount } from 'lithent';
import { createStore } from 'state-ref';

const formStore = createStore({
  name: '',
  email: '',
  message: ''
});

export const ContactForm = mount(renew => {
  const form = formStore(renew);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log({
      name: form.name.value,
      email: form.email.value,
      message: form.message.value
    });
  };

  return () => (
    <form onSubmit={handleSubmit}>
      <input
        value={form.name.value}
        onInput={(e) => form.name.value = e.target.value}
        placeholder="이름"
      />
      <input
        value={form.email.value}
        onInput={(e) => form.email.value = e.target.value}
        type="email"
        placeholder="이메일"
      />
      <textarea
        value={form.message.value}
        onInput={(e) => form.message.value = e.target.value}
        placeholder="메시지"
      />
      <button type="submit">전송</button>
    </form>
  );
});`}),e("h2",{children:"TypeScript 팁"}),e("p",{children:"완전한 타입 추론이 자동으로 작동합니다:"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

type Todo = { title: string; done: boolean };
const todoStore = createStore<Todo>({ title: 'Write docs', done: false });

// 컴포넌트에서
const store = todoStore(renew);
// store.title은 StateRefStore<string>
// store.title.value는 string
// store.done.value는 boolean`}),e("h2",{children:"왜 커넥터가 필요 없나요?"}),e("p",{children:"다른 프레임워크와 달리 Lithent는 커넥터가 필요 없습니다:"}),e("ul",{children:[e("li",{children:["Lithent의 ",e("code",{children:"renew"})," 함수는 StateRef가 기대하는 정확한 시그니처를 가집니다"]}),e("li",{children:"설정/렌더 분리가 구독 패턴과 완벽하게 일치합니다"}),e("li",{children:"연결해야 할 프레임워크별 반응성 시스템이 없습니다"}),e("li",{children:"직접 통합은 오버헤드가 전혀 없습니다"})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - 구독 동작"]}),e("li",{children:[e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화 (Flux)"})," - 액션 기반 업데이트"]}),e("li",{children:[e("a",{href:"#/ko/guide/computed",children:"createComputed"})," - 파생 값"]})]})]})),Ei=u(()=>()=>e("div",{children:[e("h1",{children:"Custom Connector"}),e("p",{children:"Learn how to create your own connector to integrate StateRef with any UI framework. This guide walks through the patterns used by official connectors."}),e("h2",{children:"Core Concepts"}),e("p",{children:"A connector bridges StateRef's subscription system with a framework's reactivity:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Subscribe"}),": Call ",e("code",{children:"watch(callback)"})," to receive updates"]}),e("li",{children:[e("strong",{children:"Trigger re-render"}),": When StateRef notifies, update the framework's state"]}),e("li",{children:[e("strong",{children:"Cleanup"}),": Use ",e("code",{children:"AbortController"})," to unsubscribe on unmount"]}),e("li",{children:[e("strong",{children:"Two-way sync"}),": Optionally sync framework state back to StateRef"]})]}),e("h2",{children:"The Watch Callback Signature"}),e("p",{children:["The ",e("code",{children:"watch"})," function accepts a callback with this signature:"]}),e(t,{language:"typescript",code:`type Renew<T> = (
  store: StateRefStore<T>,
  isFirst: boolean
) => AbortSignal | void;`}),e("ul",{children:[e("li",{children:[e("code",{children:"store"}),": The StateRefStore for reading/writing values"]}),e("li",{children:[e("code",{children:"isFirst"}),": ",e("code",{children:"true"})," on initial call,"," ",e("code",{children:"false"})," on updates"]}),e("li",{children:["Return an ",e("code",{children:"AbortSignal"})," to enable unsubscription"]})]}),e("h2",{children:"Pattern 1: Direct Hook (React-style)"}),e("p",{children:["The simplest pattern returns a hook that provides the store directly. This is how ",e("code",{children:"connectReact"})," works:"]}),e(t,{language:"typescript",code:`import { useState, useRef, useEffect } from 'react';
import type { StateRefStore, Watch } from 'state-ref';

export function connectReact<T>(watch: Watch<T>) {
  // Create a custom hook factory
  const useForceUpdate = () => {
    const [, setDummy] = useState(0);
    const abortController = useRef(new AbortController());

    // Create the renewal callback
    const forceUpdateRef = useRef((
      _: StateRefStore<T>,
      isFirst: boolean
    ) => {
      // Skip re-render on first call (initial subscription)
      if (!isFirst) {
        setDummy(prev => prev + 1);
      }
      // Return signal for cleanup
      return abortController.current.signal;
    });

    // Cleanup on unmount
    useEffect(() => () => abortController.current.abort(), []);

    return forceUpdateRef.current;
  };

  // Return hook that subscribes and returns store
  return () => watch(useForceUpdate());
}`}),e("p",{children:"Key points:"}),e("ul",{children:[e("li",{children:["Use ",e("code",{children:"useState"})," with a dummy counter to force re-renders"]}),e("li",{children:[e("code",{children:"isFirst"})," check prevents unnecessary initial re-render"]}),e("li",{children:[e("code",{children:"AbortController"})," handles cleanup when component unmounts"]}),e("li",{children:["Returns the ",e("code",{children:"StateRefStore"})," directly for"," ",e("code",{children:".value"})," access"]})]}),e("h2",{children:"Pattern 2: Selector Callback (Vue-style)"}),e("p",{children:"For frameworks with their own reactivity, use a selector pattern that returns framework-native reactive objects:"}),e(t,{language:"typescript",code:`import { reactive, watch, onUnmounted } from 'vue';
import type { Reactive, UnwrapRef } from 'vue';
import { cloneDeep } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';

export function connectVue<T>(refWatch: Watch<T>) {
  // Return a function that accepts a selector
  return <V>(
    callback: (store: StateRefStore<T>) => StateRefStore<V>
  ): Reactive<{ value: V }> => {
    const abortController = new AbortController();
    let reactiveValue!: Reactive<{ value: V }>;
    let stateRef!: StateRefStore<V>;
    let changing = false;

    // Helper to prevent sync loops
    const change = (cb: () => void) => {
      changing = true;
      cb();
      queueMicrotask(() => (changing = false));
    };

    // Cleanup on unmount
    onUnmounted(() => abortController.abort());

    // Subscribe to StateRef
    refWatch(stateInnerRef => {
      stateRef = callback(stateInnerRef);

      if (reactiveValue?.value !== stateRef.value && !changing) {
        change(() => {
          if (reactiveValue?.value) {
            reactiveValue.value = stateRef.value as UnwrapRef<V>;
          } else {
            reactiveValue = reactive({ value: stateRef.value });
          }
        });
      }

      return abortController.signal;
    });

    // Watch Vue reactive for two-way sync
    watch(reactiveValue, newValues => {
      if (stateRef.value !== newValues.value && !changing) {
        const newV = typeof newValues.value === 'object'
          ? cloneDeep(newValues.value)
          : newValues.value;

        change(() => {
          stateRef.value = newV as V;
        });
      }
    });

    return reactiveValue;
  };
}`}),e("p",{children:"Key points:"}),e("ul",{children:[e("li",{children:"Selector callback lets users pick specific properties to track"}),e("li",{children:["Returns framework-native reactive object (Vue's ",e("code",{children:"Reactive"}),")"]}),e("li",{children:[e("code",{children:"changing"})," flag prevents infinite sync loops"]}),e("li",{children:[e("code",{children:"cloneDeep"})," ensures proper object copying"]}),e("li",{children:"Two-way sync: Vue changes update StateRef, StateRef changes update Vue"})]}),e("h2",{children:"Pattern 3: Signal Pair (Solid-style)"}),e("p",{children:"For frameworks with signal patterns, return getter/setter pairs:"}),e(t,{language:"typescript",code:`import { createSignal, onCleanup } from 'solid-js';
import type { Accessor, Setter } from 'solid-js';
import type { StateRefStore, Watch } from 'state-ref';

export function connectSolid<T>(refWatch: Watch<T>) {
  return <V>(
    callback: (store: StateRefStore<T>) => StateRefStore<V>
  ): [Accessor<V>, Setter<V>] => {
    const abortController = new AbortController();
    let stateRef!: StateRefStore<V>;
    let changing = false;

    const change = (cb: () => void) => {
      changing = true;
      cb();
      queueMicrotask(() => (changing = false));
    };

    // Get initial value
    const initialStore = refWatch();
    const initialRef = callback(initialStore);
    const [value, setValue] = createSignal<V>(initialRef.value);

    onCleanup(() => abortController.abort());

    // Subscribe to StateRef changes
    refWatch(stateInnerRef => {
      stateRef = callback(stateInnerRef);

      if (value() !== stateRef.value && !changing) {
        change(() => setValue(() => stateRef.value));
      }

      return abortController.signal;
    });

    // Custom setter that syncs back to StateRef
    const customSetter: Setter<V> = (newValue) => {
      const resolvedValue = typeof newValue === 'function'
        ? (newValue as (prev: V) => V)(value())
        : newValue;

      if (stateRef.value !== resolvedValue && !changing) {
        change(() => {
          stateRef.value = resolvedValue as V;
          setValue(() => resolvedValue as V);
        });
      }

      return resolvedValue as V;
    };

    return [value, customSetter as Setter<V>];
  };
}`}),e("h2",{children:"Building Your Own Connector"}),e("p",{children:"Follow these steps to create a connector for any framework:"}),e("h3",{children:"Step 1: Identify the Re-render Mechanism"}),e("p",{children:"Every UI framework has a way to trigger re-renders:"}),e(t,{language:"typescript",code:`// React: useState setter
const [, setDummy] = useState(0);
const rerender = () => setDummy(n => n + 1);

// Vue: reactive()
const state = reactive({ value: initialValue });
// Mutating state.value triggers re-render

// Svelte: writable()
const store = writable(initialValue);
// Calling store.set() triggers re-render

// Solid: createSignal()
const [value, setValue] = createSignal(initialValue);
// Calling setValue() triggers re-render`}),e("h3",{children:"Step 2: Set Up Subscription"}),e(t,{language:"typescript",code:`const abortController = new AbortController();

watch(store => {
  // Access .value to register tracking
  const currentValue = store.someProperty.value;

  // Update framework state here
  frameworkState = currentValue;

  // Return signal for cleanup
  return abortController.signal;
});`}),e("h3",{children:"Step 3: Handle Cleanup"}),e(t,{language:"typescript",code:`// React
useEffect(() => () => abortController.abort(), []);

// Vue
onUnmounted(() => abortController.abort());

// Svelte
onDestroy(() => abortController.abort());

// Solid
onCleanup(() => abortController.abort());`}),e("h3",{children:"Step 4: Two-Way Sync (Optional)"}),e(t,{language:"typescript",code:`let changing = false;

const change = (cb: () => void) => {
  changing = true;
  cb();
  queueMicrotask(() => (changing = false));
};

// When StateRef changes -> update framework
watch(store => {
  if (!changing) {
    change(() => {
      frameworkState = store.prop.value;
    });
  }
  return abortController.signal;
});

// When framework changes -> update StateRef
frameworkWatch(newValue => {
  if (!changing) {
    change(() => {
      stateRef.prop.value = newValue;
    });
  }
});`}),e("h2",{children:"Minimal Example"}),e("p",{children:"Here's a minimal connector for a hypothetical framework:"}),e(t,{language:"typescript",code:`import type { StateRefStore, Watch } from 'state-ref';

export function connectMyFramework<T>(watch: Watch<T>) {
  return () => {
    const abortController = new AbortController();
    let store!: StateRefStore<T>;

    // Subscribe
    watch((stateRef, isFirst) => {
      store = stateRef;

      if (!isFirst) {
        // Trigger re-render using framework's mechanism
        myFrameworkRerender();
      }

      return abortController.signal;
    });

    // Setup cleanup
    myFrameworkOnDestroy(() => abortController.abort());

    return store;
  };
}`}),e("h2",{children:"Important Considerations"}),e("ul",{children:[e("li",{children:[e("strong",{children:"isFirst check"}),": Skip re-render on initial subscription to avoid double render"]}),e("li",{children:[e("strong",{children:"Sync loop prevention"}),": Use a ",e("code",{children:"changing"})," ","flag for two-way binding"]}),e("li",{children:[e("strong",{children:"Object cloning"}),": Use ",e("code",{children:"cloneDeep"})," when passing objects between systems"]}),e("li",{children:[e("strong",{children:"AbortController"}),": Always return the signal and abort on cleanup"]}),e("li",{children:[e("strong",{children:"queueMicrotask"}),": Reset flags asynchronously to handle batched updates"]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - understanding watch behavior"]}),e("li",{children:[e("a",{href:"#/guide/subscription",children:"Subscription"})," - subscription patterns"]}),e("li",{children:[e("a",{href:"#/guide/react",children:"React"})," - React connector usage"]}),e("li",{children:[e("a",{href:"#/guide/vue",children:"Vue"})," - Vue connector usage"]}),e("li",{children:[e("a",{href:"#/guide/lithent",children:"Lithent"})," - direct integration without connector"]})]})]})),Ii=u(()=>()=>e("div",{children:[e("h1",{children:"커스텀 커넥터"}),e("p",{children:"StateRef를 어떤 UI 프레임워크와도 통합할 수 있는 커스텀 커넥터를 만드는 방법을 알아봅니다. 이 가이드는 공식 커넥터에서 사용되는 패턴을 설명합니다."}),e("h2",{children:"핵심 개념"}),e("p",{children:"커넥터는 StateRef의 구독 시스템과 프레임워크의 반응성을 연결합니다:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"구독"}),": ",e("code",{children:"watch(callback)"}),"을 호출하여 업데이트를 받습니다"]}),e("li",{children:[e("strong",{children:"리렌더 트리거"}),": StateRef가 알릴 때 프레임워크의 상태를 업데이트합니다"]}),e("li",{children:[e("strong",{children:"정리"}),": ",e("code",{children:"AbortController"}),"를 사용하여 언마운트 시 구독 해제합니다"]}),e("li",{children:[e("strong",{children:"양방향 동기화"}),": 선택적으로 프레임워크 상태를 StateRef로 다시 동기화합니다"]})]}),e("h2",{children:"Watch 콜백 시그니처"}),e("p",{children:[e("code",{children:"watch"})," 함수는 다음 시그니처의 콜백을 받습니다:"]}),e(t,{language:"typescript",code:`type Renew<T> = (
  store: StateRefStore<T>,
  isFirst: boolean
) => AbortSignal | void;`}),e("ul",{children:[e("li",{children:[e("code",{children:"store"}),": 값을 읽고 쓰기 위한 StateRefStore"]}),e("li",{children:[e("code",{children:"isFirst"}),": 초기 호출 시 ",e("code",{children:"true"}),", 업데이트 시"," ",e("code",{children:"false"})]}),e("li",{children:["구독 해제를 위해 ",e("code",{children:"AbortSignal"}),"을 반환합니다"]})]}),e("h2",{children:"패턴 1: 직접 훅 (React 스타일)"}),e("p",{children:["가장 단순한 패턴은 스토어를 직접 제공하는 훅을 반환합니다.",e("code",{children:"connectReact"}),"의 동작 방식입니다:"]}),e(t,{language:"typescript",code:`import { useState, useRef, useEffect } from 'react';
import type { StateRefStore, Watch } from 'state-ref';

export function connectReact<T>(watch: Watch<T>) {
  // 커스텀 훅 팩토리 생성
  const useForceUpdate = () => {
    const [, setDummy] = useState(0);
    const abortController = useRef(new AbortController());

    // 갱신 콜백 생성
    const forceUpdateRef = useRef((
      _: StateRefStore<T>,
      isFirst: boolean
    ) => {
      // 첫 번째 호출(초기 구독)에서는 리렌더 건너뛰기
      if (!isFirst) {
        setDummy(prev => prev + 1);
      }
      // 정리를 위한 시그널 반환
      return abortController.current.signal;
    });

    // 언마운트 시 정리
    useEffect(() => () => abortController.current.abort(), []);

    return forceUpdateRef.current;
  };

  // 구독하고 스토어를 반환하는 훅 반환
  return () => watch(useForceUpdate());
}`}),e("p",{children:"핵심 포인트:"}),e("ul",{children:[e("li",{children:["더미 카운터와 ",e("code",{children:"useState"}),"를 사용하여 강제 리렌더"]}),e("li",{children:[e("code",{children:"isFirst"})," 검사로 불필요한 초기 리렌더 방지"]}),e("li",{children:["컴포넌트 언마운트 시 ",e("code",{children:"AbortController"}),"가 정리 처리"]}),e("li",{children:[e("code",{children:".value"})," 접근을 위해 ",e("code",{children:"StateRefStore"}),"를 직접 반환"]})]}),e("h2",{children:"패턴 2: 셀렉터 콜백 (Vue 스타일)"}),e("p",{children:"자체 반응성이 있는 프레임워크의 경우, 프레임워크 네이티브 반응형 객체를 반환하는 셀렉터 패턴을 사용합니다:"}),e(t,{language:"typescript",code:`import { reactive, watch, onUnmounted } from 'vue';
import type { Reactive, UnwrapRef } from 'vue';
import { cloneDeep } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';

export function connectVue<T>(refWatch: Watch<T>) {
  // 셀렉터를 받는 함수 반환
  return <V>(
    callback: (store: StateRefStore<T>) => StateRefStore<V>
  ): Reactive<{ value: V }> => {
    const abortController = new AbortController();
    let reactiveValue!: Reactive<{ value: V }>;
    let stateRef!: StateRefStore<V>;
    let changing = false;

    // 동기화 루프 방지 헬퍼
    const change = (cb: () => void) => {
      changing = true;
      cb();
      queueMicrotask(() => (changing = false));
    };

    // 언마운트 시 정리
    onUnmounted(() => abortController.abort());

    // StateRef 구독
    refWatch(stateInnerRef => {
      stateRef = callback(stateInnerRef);

      if (reactiveValue?.value !== stateRef.value && !changing) {
        change(() => {
          if (reactiveValue?.value) {
            reactiveValue.value = stateRef.value as UnwrapRef<V>;
          } else {
            reactiveValue = reactive({ value: stateRef.value });
          }
        });
      }

      return abortController.signal;
    });

    // 양방향 동기화를 위해 Vue reactive 감시
    watch(reactiveValue, newValues => {
      if (stateRef.value !== newValues.value && !changing) {
        const newV = typeof newValues.value === 'object'
          ? cloneDeep(newValues.value)
          : newValues.value;

        change(() => {
          stateRef.value = newV as V;
        });
      }
    });

    return reactiveValue;
  };
}`}),e("p",{children:"핵심 포인트:"}),e("ul",{children:[e("li",{children:"셀렉터 콜백으로 사용자가 추적할 특정 프로퍼티 선택 가능"}),e("li",{children:["프레임워크 네이티브 반응형 객체 반환 (Vue의 ",e("code",{children:"Reactive"}),")"]}),e("li",{children:[e("code",{children:"changing"})," 플래그로 무한 동기화 루프 방지"]}),e("li",{children:[e("code",{children:"cloneDeep"}),"으로 적절한 객체 복사 보장"]}),e("li",{children:"양방향 동기화: Vue 변경은 StateRef 업데이트, StateRef 변경은 Vue 업데이트"})]}),e("h2",{children:"패턴 3: 시그널 쌍 (Solid 스타일)"}),e("p",{children:"시그널 패턴이 있는 프레임워크의 경우, getter/setter 쌍을 반환합니다:"}),e(t,{language:"typescript",code:`import { createSignal, onCleanup } from 'solid-js';
import type { Accessor, Setter } from 'solid-js';
import type { StateRefStore, Watch } from 'state-ref';

export function connectSolid<T>(refWatch: Watch<T>) {
  return <V>(
    callback: (store: StateRefStore<T>) => StateRefStore<V>
  ): [Accessor<V>, Setter<V>] => {
    const abortController = new AbortController();
    let stateRef!: StateRefStore<V>;
    let changing = false;

    const change = (cb: () => void) => {
      changing = true;
      cb();
      queueMicrotask(() => (changing = false));
    };

    // 초기값 가져오기
    const initialStore = refWatch();
    const initialRef = callback(initialStore);
    const [value, setValue] = createSignal<V>(initialRef.value);

    onCleanup(() => abortController.abort());

    // StateRef 변경 구독
    refWatch(stateInnerRef => {
      stateRef = callback(stateInnerRef);

      if (value() !== stateRef.value && !changing) {
        change(() => setValue(() => stateRef.value));
      }

      return abortController.signal;
    });

    // StateRef로 다시 동기화하는 커스텀 setter
    const customSetter: Setter<V> = (newValue) => {
      const resolvedValue = typeof newValue === 'function'
        ? (newValue as (prev: V) => V)(value())
        : newValue;

      if (stateRef.value !== resolvedValue && !changing) {
        change(() => {
          stateRef.value = resolvedValue as V;
          setValue(() => resolvedValue as V);
        });
      }

      return resolvedValue as V;
    };

    return [value, customSetter as Setter<V>];
  };
}`}),e("h2",{children:"직접 커넥터 만들기"}),e("p",{children:"어떤 프레임워크든 커넥터를 만들려면 다음 단계를 따르세요:"}),e("h3",{children:"1단계: 리렌더 메커니즘 파악"}),e("p",{children:"모든 UI 프레임워크에는 리렌더를 트리거하는 방법이 있습니다:"}),e(t,{language:"typescript",code:`// React: useState setter
const [, setDummy] = useState(0);
const rerender = () => setDummy(n => n + 1);

// Vue: reactive()
const state = reactive({ value: initialValue });
// state.value를 변경하면 리렌더 트리거

// Svelte: writable()
const store = writable(initialValue);
// store.set() 호출하면 리렌더 트리거

// Solid: createSignal()
const [value, setValue] = createSignal(initialValue);
// setValue() 호출하면 리렌더 트리거`}),e("h3",{children:"2단계: 구독 설정"}),e(t,{language:"typescript",code:`const abortController = new AbortController();

watch(store => {
  // .value에 접근하여 추적 등록
  const currentValue = store.someProperty.value;

  // 여기서 프레임워크 상태 업데이트
  frameworkState = currentValue;

  // 정리를 위한 시그널 반환
  return abortController.signal;
});`}),e("h3",{children:"3단계: 정리 처리"}),e(t,{language:"typescript",code:`// React
useEffect(() => () => abortController.abort(), []);

// Vue
onUnmounted(() => abortController.abort());

// Svelte
onDestroy(() => abortController.abort());

// Solid
onCleanup(() => abortController.abort());`}),e("h3",{children:"4단계: 양방향 동기화 (선택)"}),e(t,{language:"typescript",code:`let changing = false;

const change = (cb: () => void) => {
  changing = true;
  cb();
  queueMicrotask(() => (changing = false));
};

// StateRef 변경 -> 프레임워크 업데이트
watch(store => {
  if (!changing) {
    change(() => {
      frameworkState = store.prop.value;
    });
  }
  return abortController.signal;
});

// 프레임워크 변경 -> StateRef 업데이트
frameworkWatch(newValue => {
  if (!changing) {
    change(() => {
      stateRef.prop.value = newValue;
    });
  }
});`}),e("h2",{children:"최소 예제"}),e("p",{children:"가상의 프레임워크를 위한 최소 커넥터입니다:"}),e(t,{language:"typescript",code:`import type { StateRefStore, Watch } from 'state-ref';

export function connectMyFramework<T>(watch: Watch<T>) {
  return () => {
    const abortController = new AbortController();
    let store!: StateRefStore<T>;

    // 구독
    watch((stateRef, isFirst) => {
      store = stateRef;

      if (!isFirst) {
        // 프레임워크의 메커니즘으로 리렌더 트리거
        myFrameworkRerender();
      }

      return abortController.signal;
    });

    // 정리 설정
    myFrameworkOnDestroy(() => abortController.abort());

    return store;
  };
}`}),e("h2",{children:"중요 고려사항"}),e("ul",{children:[e("li",{children:[e("strong",{children:"isFirst 검사"}),": 초기 구독에서 리렌더를 건너뛰어 이중 렌더 방지"]}),e("li",{children:[e("strong",{children:"동기화 루프 방지"}),": 양방향 바인딩에"," ",e("code",{children:"changing"})," 플래그 사용"]}),e("li",{children:[e("strong",{children:"객체 복제"}),": 시스템 간 객체 전달 시"," ",e("code",{children:"cloneDeep"})," 사용"]}),e("li",{children:[e("strong",{children:"AbortController"}),": 항상 시그널을 반환하고 정리 시 abort 호출"]}),e("li",{children:[e("strong",{children:"queueMicrotask"}),": 일괄 업데이트 처리를 위해 플래그를 비동기로 리셋"]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - watch 동작 이해"]}),e("li",{children:[e("a",{href:"#/ko/guide/subscription",children:"구독"})," - 구독 패턴"]}),e("li",{children:[e("a",{href:"#/ko/guide/react",children:"React"})," - React 커넥터 사용법"]}),e("li",{children:[e("a",{href:"#/ko/guide/vue",children:"Vue"})," - Vue 커넥터 사용법"]}),e("li",{children:[e("a",{href:"#/ko/guide/lithent",children:"Lithent"})," - 커넥터 없는 직접 통합"]})]})]})),Pi=u(()=>()=>e("div",{children:[e("h1",{children:"Core API"}),e("p",{children:["This page documents the core functions exported from"," ",e("code",{children:"state-ref"}),". These are the fundamental building blocks for state management."]}),e("h2",{children:"createStore"}),e("p",{children:"Creates a reactive store with the given initial value and returns a watch function."}),e("h3",{children:"Signature"}),e(t,{language:"typescript",code:`function createStore<V>(
  initialValue: V,
  createOption?: { trackDeps?: boolean }
): Watch<V>`}),e("h3",{children:"Parameters"}),e("ul",{children:[e("li",{children:[e("code",{children:"initialValue: V"})," - The initial value of the store. Can be a primitive (number, string, boolean) or an object/array."]}),e("li",{children:[e("code",{children:"createOption.trackDeps"})," (optional, default:"," ",e("code",{children:"false"}),"; new in 3.0.0) - Re-collects what each subscriber reads on every run, so a path a callback has stopped reading stops waking it. Off by default: it costs about 1.4x per notification and saves whole notifications, so it pays once it removes roughly 40% of them - a subscriber with no conditional reads removes none. Turn it on where the branch condition lives in the store."]})]}),e(t,{language:"typescript",code:`const watch = createStore(
  { flag: true, a: 0, b: 0 },
  { trackDeps: true }
);

watch(ref => {
  // Only one of "a" and "b" is read on any given run.
  console.log(ref.flag.value ? ref.a.value : ref.b.value);
});

// After flag flips to false, writing to "a" no longer wakes the subscriber.
// Without trackDeps (the default) it still would.`}),e("h3",{children:"Returns"}),e("p",{children:["Returns a ",e("code",{children:"Watch<V>"})," function that can be called to access the store or subscribe to changes."]}),e("h3",{children:"Example"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

// Primitive store
const countWatch = createStore(0);

// Object store
const userWatch = createStore({ name: 'John', age: 30 });

// Array store
const itemsWatch = createStore(['a', 'b', 'c']);

// Access without subscription
const count = countWatch();
console.log(count.value);  // 0

// Access with subscription
countWatch((ref, isFirst) => {
  const value = ref.value;  // Access first for subscription
  if (isFirst) return;
  console.log('Count changed:', value);
});`}),e("h2",{children:"createStoreManualSync"}),e("p",{children:["Creates a store with manual synchronization control. Updates are not automatically propagated to subscribers until ",e("code",{children:"sync()"})," is called."]}),e("h3",{children:"Signature"}),e(t,{language:"typescript",code:`function createStoreManualSync<V>(initialValue: V): ManualSyncStore<V>

type ManualSyncStore<V> = {
  watch: Watch<V>;           // Read-only subscription
  updateRef: StateRefStore<V>;  // Reference for updates
  sync: () => void;          // Trigger synchronization
}`}),e("h3",{children:"Parameters"}),e("ul",{children:e("li",{children:[e("code",{children:"initialValue: V"})," - The initial value of the store."]})}),e("h3",{children:"Returns"}),e("p",{children:["Returns a ",e("code",{children:"ManualSyncStore<V>"})," object with three properties:"]}),e("ul",{children:[e("li",{children:[e("code",{children:"watch"})," - A watch function for read-only subscriptions"]}),e("li",{children:[e("code",{children:"updateRef"})," - A reference for updating values (writes don't trigger subscribers)"]}),e("li",{children:[e("code",{children:"sync()"})," - A function to manually trigger all pending updates to subscribers"]})]}),e("h3",{children:"Example"}),e(t,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

// Subscribe to changes
watch((ref, isFirst) => {
  const count = ref.count.value;
  if (isFirst) return;
  console.log('Synced count:', count);
});

// Update value (no subscriber notification yet)
updateRef.count.value = 10;
updateRef.count.value = 20;
updateRef.count.value = 30;

// Manually sync - subscribers notified once with final value
sync();
// Logs: "Synced count: 30"`}),e("h2",{children:"createComputed"}),e("p",{children:"Creates a computed (derived) value from one or more watches. The computed value is read-only and automatically updates when source stores change."}),e("h3",{children:"Signature"}),e(t,{language:"typescript",code:`function createComputed<W extends readonly Watch<any>[], R>(
  watches: W,
  callback: (refs: StateRefsTuple<W>) => R
): (computedCallback?: (proxy: { value: R }, isFirst: boolean) => void) => { value: R }`}),e("h3",{children:"Parameters"}),e("ul",{children:[e("li",{children:[e("code",{children:"watches: W"})," - An array of watch functions to combine"]}),e("li",{children:[e("code",{children:"callback: (refs) => R"})," - A function that receives the store references and returns the computed value"]})]}),e("h3",{children:"Returns"}),e("p",{children:["Returns a watch-like function that provides access to the computed value via ",e("code",{children:".value"}),". The returned value is read-only; attempting to set it will show a warning."]}),e("h3",{children:"Example"}),e(t,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';

const priceWatch = createStore(100);
const quantityWatch = createStore(3);

// Create computed value
const totalWatch = createComputed(
  [priceWatch, quantityWatch],
  ([price, quantity]) => price.value * quantity.value
);

// Access computed value
const total = totalWatch();
console.log(total.value);  // 300

// Subscribe to computed changes
totalWatch((ref, isFirst) => {
  const value = ref.value;
  if (isFirst) return;
  console.log('Total changed:', value);
});

// Update source triggers recomputation
const price = priceWatch();
price.value = 150;
// Logs: "Total changed: 450"`}),e("h2",{children:"combineWatch"}),e("p",{children:["Combines multiple watches into a single watch that delivers their values as a tuple. Unlike ",e("code",{children:"createComputed"}),", it preserves individual store access."]}),e("h3",{children:"Signature"}),e(t,{language:"typescript",code:`function combineWatch<W extends readonly Watch<any>[]>(
  watches: [...W]
): Watch<CombinedValue<W>>`}),e("h3",{children:"Parameters"}),e("ul",{children:e("li",{children:[e("code",{children:"watches: W"})," - An array of watch functions to combine"]})}),e("h3",{children:"Returns"}),e("p",{children:["Returns a new ",e("code",{children:"Watch"})," function. The returned store provides access to individual stores by index (e.g., ",e("code",{children:"combined[0]"}),","," ",e("code",{children:"combined[1]"}),")."]}),e("h3",{children:"Example"}),e(t,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';

const userWatch = createStore({ name: 'John' });
const settingsWatch = createStore({ theme: 'dark' });

// Combine watches
const combinedWatch = combineWatch([userWatch, settingsWatch]);

// Access by index
const combined = combinedWatch();
console.log(combined[0].name.value);  // 'John'
console.log(combined[1].theme.value); // 'dark'

// Subscribe to any change
combinedWatch(([user, settings], isFirst) => {
  const name = user.name.value;
  const theme = settings.theme.value;
  if (isFirst) return;
  console.log(\`User: \${name}, Theme: \${theme}\`);
});`}),e("h2",{children:"Watch Function"}),e("p",{children:["The ",e("code",{children:"Watch"})," type represents the function returned by"," ",e("code",{children:"createStore"}),"."]}),e("h3",{children:"Type Definition"}),e(t,{language:"typescript",code:`type Watch<V> = (
  renew?: Renew<StateRefStore<V>>,
  userOption?: { cache?: boolean; editable?: boolean }
) => StateRefStore<V>`}),e("h3",{children:"Parameters"}),e("ul",{children:[e("li",{children:[e("code",{children:"renew"})," (optional) - Callback function invoked on state changes"]}),e("li",{children:[e("code",{children:"userOption.cache"})," (optional, default: ",e("code",{children:"true"}),") - Whether to cache the proxy for the same renew function"]}),e("li",{children:[e("code",{children:"userOption.editable"})," (optional, default: ",e("code",{children:"true"}),") - Whether the returned reference can modify the store"]})]}),e("h3",{children:"Renew Callback"}),e(t,{language:"typescript",code:`type Renew<G> = (
  store: G,
  isFirst: boolean
) => boolean | AbortSignal | void

// Example with AbortSignal
const controller = new AbortController();

watch((ref, isFirst) => {
  const value = ref.value;
  if (isFirst) return controller.signal;
  console.log('Value:', value);
});

// Later, unsubscribe
controller.abort();`}),e("h2",{children:"StateRefStore"}),e("p",{children:["The ",e("code",{children:"StateRefStore"})," type represents the proxy object returned when calling a watch function. It provides reactive access to state via the ",e("code",{children:".value"})," property."]}),e("h3",{children:"Type Definition"}),e(t,{language:"typescript",code:`type StateRefStore<S> = S extends object
  ? {
      [K in keyof S]: StateRefStore<S[K]>;
    } & {
      value: S;
    }
  : { value: S }`}),e("h3",{children:"Behavior"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Object types"}),": Can navigate nested properties, each with its own ",e("code",{children:".value"})]}),e("li",{children:[e("strong",{children:"Primitive types"}),": Access and modify via"," ",e("code",{children:".value"})]}),e("li",{children:[e("strong",{children:["Reading ",e("code",{children:".value"})]}),": Registers a subscription for that property"]}),e("li",{children:[e("strong",{children:["Writing ",e("code",{children:".value"})]}),": Updates the store and notifies subscribers"]})]}),e(t,{language:"typescript",code:`const watch = createStore({ user: { name: 'John', age: 30 } });
const ref = watch();

// Deep navigation
ref.user.name.value;           // 'John'
ref.user.age.value;            // 30
ref.user.value;                // { name: 'John', age: 30 }
ref.value;                     // { user: { name: 'John', age: 30 } }

// Update
ref.user.name.value = 'Jane';  // Updates and notifies
ref.user.value = { name: 'Bob', age: 25 };  // Replace entire user object`}),e("h2",{children:"ManualSyncStore"}),e("p",{children:["The type returned by ",e("code",{children:"createStoreManualSync"}),"."]}),e("h3",{children:"Type Definition"}),e(t,{language:"typescript",code:`type ManualSyncStore<V> = {
  watch: Watch<V>;           // For subscribing to changes
  updateRef: StateRefStore<V>;  // For updating values
  sync: () => void;          // For triggering sync
}`}),e("h2",{children:"Summary Table"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Function"}),e("th",{children:"Purpose"}),e("th",{children:"Auto Sync"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"createStore"})}),e("td",{children:"Create a reactive store"}),e("td",{children:"Yes"})]}),e("tr",{children:[e("td",{children:e("code",{children:"createStoreManualSync"})}),e("td",{children:"Create store with manual sync control"}),e("td",{children:"No"})]}),e("tr",{children:[e("td",{children:e("code",{children:"createComputed"})}),e("td",{children:"Derive new value from stores"}),e("td",{children:"Yes"})]}),e("tr",{children:[e("td",{children:e("code",{children:"combineWatch"})}),e("td",{children:"Group stores as tuple"}),e("td",{children:"Yes"})]})]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore Guide"})," - Detailed usage guide"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function Guide"})," - Understanding watch functions"]}),e("li",{children:[e("a",{href:"#/guide/manual-sync",children:"Manual Sync Guide"})," - Flux pattern with manual sync"]}),e("li",{children:[e("a",{href:"#/api/helpers",children:"Helper API"})," - lens, copyable, cloneDeep"]}),e("li",{children:[e("a",{href:"#/api/types",children:"TypeScript Types"})," - Complete type definitions"]})]})]})),Di=u(()=>()=>e("div",{children:[e("h1",{children:"Core API"}),e("p",{children:["이 페이지는 ",e("code",{children:"state-ref"}),"에서 내보내는 핵심 함수들을 문서화합니다. 이들은 상태 관리의 기본 구성 요소입니다."]}),e("h2",{children:"createStore"}),e("p",{children:"주어진 초기값으로 반응형 스토어를 생성하고 watch 함수를 반환합니다."}),e("h3",{children:"시그니처"}),e(t,{language:"typescript",code:`function createStore<V>(
  initialValue: V,
  createOption?: { trackDeps?: boolean }
): Watch<V>`}),e("h3",{children:"매개변수"}),e("ul",{children:[e("li",{children:[e("code",{children:"createOption.trackDeps"})," (선택, 기본값 ",e("code",{children:"false"}),"; 3.0.0에서 신설) - 실행할 때마다 각 구독자가 읽은 경로를 다시 수집합니다. 콜백이 더 이상 읽지 않는 경로는 그 구독자를 깨우지 않습니다. 기본값이 꺼짐인 이유는 거래 폭이 좁기 때문입니다 — 알림 1건당 약 1.4배를 내고 알림을 통째로 없애므로, 알림의 40%가량이 사라져야 이득입니다. 조건부 읽기가 없는 구독자는 없앨 알림이 없습니다. 분기 조건이 스토어 안에 있는 구독자에서 켜십시오."]}),e("li",{children:[e("code",{children:"initialValue: V"})," - 스토어의 초기값. 원시 타입(number, string, boolean) 또는 객체/배열이 될 수 있습니다."]})]}),e("h3",{children:"반환값"}),e("p",{children:["스토어에 접근하거나 변경을 구독할 수 있는 ",e("code",{children:"Watch<V>"})," ","함수를 반환합니다."]}),e("h3",{children:"예제"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';

// 원시 타입 스토어
const countWatch = createStore(0);

// 객체 스토어
const userWatch = createStore({ name: 'John', age: 30 });

// 배열 스토어
const itemsWatch = createStore(['a', 'b', 'c']);

// 구독 없이 접근
const count = countWatch();
console.log(count.value);  // 0

// 구독과 함께 접근
countWatch((ref, isFirst) => {
  const value = ref.value;  // 구독을 위해 먼저 접근
  if (isFirst) return;
  console.log('Count 변경됨:', value);
});`}),e("h2",{children:"createStoreManualSync"}),e("p",{children:["수동 동기화 제어가 있는 스토어를 생성합니다. ",e("code",{children:"sync()"}),"가 호출될 때까지 업데이트가 구독자에게 자동으로 전파되지 않습니다."]}),e("h3",{children:"시그니처"}),e(t,{language:"typescript",code:`function createStoreManualSync<V>(initialValue: V): ManualSyncStore<V>

type ManualSyncStore<V> = {
  watch: Watch<V>;           // 읽기 전용 구독
  updateRef: StateRefStore<V>;  // 업데이트용 참조
  sync: () => void;          // 동기화 트리거
}`}),e("h3",{children:"매개변수"}),e("ul",{children:e("li",{children:[e("code",{children:"initialValue: V"})," - 스토어의 초기값."]})}),e("h3",{children:"반환값"}),e("p",{children:["세 가지 프로퍼티를 가진 ",e("code",{children:"ManualSyncStore<V>"})," 객체를 반환합니다:"]}),e("ul",{children:[e("li",{children:[e("code",{children:"watch"})," - 읽기 전용 구독을 위한 watch 함수"]}),e("li",{children:[e("code",{children:"updateRef"})," - 값 업데이트를 위한 참조 (쓰기가 구독자를 트리거하지 않음)"]}),e("li",{children:[e("code",{children:"sync()"})," - 모든 대기 중인 업데이트를 구독자에게 수동으로 트리거하는 함수"]})]}),e("h3",{children:"예제"}),e(t,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

// 변경 사항 구독
watch((ref, isFirst) => {
  const count = ref.count.value;
  if (isFirst) return;
  console.log('동기화된 count:', count);
});

// 값 업데이트 (아직 구독자 알림 없음)
updateRef.count.value = 10;
updateRef.count.value = 20;
updateRef.count.value = 30;

// 수동 동기화 - 구독자는 최종 값으로 한 번만 알림 받음
sync();
// 로그: "동기화된 count: 30"`}),e("h2",{children:"createComputed"}),e("p",{children:"하나 이상의 watch에서 계산된(파생) 값을 생성합니다. 계산된 값은 읽기 전용이며 소스 스토어가 변경되면 자동으로 업데이트됩니다."}),e("h3",{children:"시그니처"}),e(t,{language:"typescript",code:`function createComputed<W extends readonly Watch<any>[], R>(
  watches: W,
  callback: (refs: StateRefsTuple<W>) => R
): (computedCallback?: (proxy: { value: R }, isFirst: boolean) => void) => { value: R }`}),e("h3",{children:"매개변수"}),e("ul",{children:[e("li",{children:[e("code",{children:"watches: W"})," - 결합할 watch 함수 배열"]}),e("li",{children:[e("code",{children:"callback: (refs) => R"})," - 스토어 참조를 받아 계산된 값을 반환하는 함수"]})]}),e("h3",{children:"반환값"}),e("p",{children:[e("code",{children:".value"}),"를 통해 계산된 값에 접근할 수 있는 watch 유사 함수를 반환합니다. 반환된 값은 읽기 전용이며, 설정하려고 하면 경고가 표시됩니다."]}),e("h3",{children:"예제"}),e(t,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';

const priceWatch = createStore(100);
const quantityWatch = createStore(3);

// 계산된 값 생성
const totalWatch = createComputed(
  [priceWatch, quantityWatch],
  ([price, quantity]) => price.value * quantity.value
);

// 계산된 값 접근
const total = totalWatch();
console.log(total.value);  // 300

// 계산된 값 변경 구독
totalWatch((ref, isFirst) => {
  const value = ref.value;
  if (isFirst) return;
  console.log('Total 변경됨:', value);
});

// 소스 업데이트가 재계산 트리거
const price = priceWatch();
price.value = 150;
// 로그: "Total 변경됨: 450"`}),e("h2",{children:"combineWatch"}),e("p",{children:["여러 watch를 값을 튜플로 전달하는 단일 watch로 결합합니다.",e("code",{children:"createComputed"}),"와 달리 개별 스토어 접근을 유지합니다."]}),e("h3",{children:"시그니처"}),e(t,{language:"typescript",code:`function combineWatch<W extends readonly Watch<any>[]>(
  watches: [...W]
): Watch<CombinedValue<W>>`}),e("h3",{children:"매개변수"}),e("ul",{children:e("li",{children:[e("code",{children:"watches: W"})," - 결합할 watch 함수 배열"]})}),e("h3",{children:"반환값"}),e("p",{children:["새로운 ",e("code",{children:"Watch"})," 함수를 반환합니다. 반환된 스토어는 인덱스로 개별 스토어에 접근할 수 있습니다 (예: ",e("code",{children:"combined[0]"}),","," ",e("code",{children:"combined[1]"}),")."]}),e("h3",{children:"예제"}),e(t,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';

const userWatch = createStore({ name: 'John' });
const settingsWatch = createStore({ theme: 'dark' });

// watch 결합
const combinedWatch = combineWatch([userWatch, settingsWatch]);

// 인덱스로 접근
const combined = combinedWatch();
console.log(combined[0].name.value);  // 'John'
console.log(combined[1].theme.value); // 'dark'

// 모든 변경 구독
combinedWatch(([user, settings], isFirst) => {
  const name = user.name.value;
  const theme = settings.theme.value;
  if (isFirst) return;
  console.log(\`사용자: \${name}, 테마: \${theme}\`);
});`}),e("h2",{children:"Watch 함수"}),e("p",{children:[e("code",{children:"Watch"})," 타입은 ",e("code",{children:"createStore"}),"가 반환하는 함수를 나타냅니다."]}),e("h3",{children:"타입 정의"}),e(t,{language:"typescript",code:`type Watch<V> = (
  renew?: Renew<StateRefStore<V>>,
  userOption?: { cache?: boolean; editable?: boolean }
) => StateRefStore<V>`}),e("h3",{children:"매개변수"}),e("ul",{children:[e("li",{children:[e("code",{children:"renew"})," (선택) - 상태 변경 시 호출되는 콜백 함수"]}),e("li",{children:[e("code",{children:"userOption.cache"})," (선택, 기본값: ",e("code",{children:"true"}),") - 동일한 renew 함수에 대해 프록시를 캐시할지 여부"]}),e("li",{children:[e("code",{children:"userOption.editable"})," (선택, 기본값: ",e("code",{children:"true"}),") - 반환된 참조가 스토어를 수정할 수 있는지 여부"]})]}),e("h3",{children:"Renew 콜백"}),e(t,{language:"typescript",code:`type Renew<G> = (
  store: G,
  isFirst: boolean
) => boolean | AbortSignal | void

// AbortSignal 사용 예제
const controller = new AbortController();

watch((ref, isFirst) => {
  const value = ref.value;
  if (isFirst) return controller.signal;
  console.log('Value:', value);
});

// 나중에 구독 취소
controller.abort();`}),e("h2",{children:"StateRefStore"}),e("p",{children:[e("code",{children:"StateRefStore"})," 타입은 watch 함수를 호출할 때 반환되는 프록시 객체를 나타냅니다. ",e("code",{children:".value"})," 프로퍼티를 통해 상태에 대한 반응형 접근을 제공합니다."]}),e("h3",{children:"타입 정의"}),e(t,{language:"typescript",code:`type StateRefStore<S> = S extends object
  ? {
      [K in keyof S]: StateRefStore<S[K]>;
    } & {
      value: S;
    }
  : { value: S }`}),e("h3",{children:"동작"}),e("ul",{children:[e("li",{children:[e("strong",{children:"객체 타입"}),": 중첩된 프로퍼티를 탐색할 수 있으며, 각각 자체 ",e("code",{children:".value"}),"를 가짐"]}),e("li",{children:[e("strong",{children:"원시 타입"}),": ",e("code",{children:".value"}),"로 접근 및 수정"]}),e("li",{children:[e("strong",{children:[e("code",{children:".value"})," 읽기"]}),": 해당 프로퍼티에 대한 구독 등록"]}),e("li",{children:[e("strong",{children:[e("code",{children:".value"})," 쓰기"]}),": 스토어를 업데이트하고 구독자에게 알림"]})]}),e(t,{language:"typescript",code:`const watch = createStore({ user: { name: 'John', age: 30 } });
const ref = watch();

// 깊은 탐색
ref.user.name.value;           // 'John'
ref.user.age.value;            // 30
ref.user.value;                // { name: 'John', age: 30 }
ref.value;                     // { user: { name: 'John', age: 30 } }

// 업데이트
ref.user.name.value = 'Jane';  // 업데이트하고 알림
ref.user.value = { name: 'Bob', age: 25 };  // 전체 user 객체 교체`}),e("h2",{children:"ManualSyncStore"}),e("p",{children:[e("code",{children:"createStoreManualSync"}),"가 반환하는 타입입니다."]}),e("h3",{children:"타입 정의"}),e(t,{language:"typescript",code:`type ManualSyncStore<V> = {
  watch: Watch<V>;           // 변경 구독용
  updateRef: StateRefStore<V>;  // 값 업데이트용
  sync: () => void;          // 동기화 트리거용
}`}),e("h2",{children:"요약 표"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"함수"}),e("th",{children:"목적"}),e("th",{children:"자동 동기화"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"createStore"})}),e("td",{children:"반응형 스토어 생성"}),e("td",{children:"예"})]}),e("tr",{children:[e("td",{children:e("code",{children:"createStoreManualSync"})}),e("td",{children:"수동 동기화 제어가 있는 스토어 생성"}),e("td",{children:"아니오"})]}),e("tr",{children:[e("td",{children:e("code",{children:"createComputed"})}),e("td",{children:"스토어에서 새 값 파생"}),e("td",{children:"예"})]}),e("tr",{children:[e("td",{children:e("code",{children:"combineWatch"})}),e("td",{children:"스토어를 튜플로 그룹화"}),e("td",{children:"예"})]})]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore 가이드"})," - 상세 사용 가이드"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수 가이드"})," - watch 함수 이해하기"]}),e("li",{children:[e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화 가이드"})," - 수동 동기화를 통한 Flux 패턴"]}),e("li",{children:[e("a",{href:"#/ko/api/helpers",children:"헬퍼 API"})," - lens, copyable, cloneDeep"]}),e("li",{children:[e("a",{href:"#/ko/api/types",children:"TypeScript 타입"})," - 전체 타입 정의"]})]})]})),Ni=u(()=>()=>e("div",{children:[e("h1",{children:"Helper API"}),e("p",{children:["This page documents the helper functions exported from"," ",e("code",{children:"state-ref"}),". These utilities assist with immutable updates and deep copying."]}),e("h2",{children:"lens"}),e("p",{children:"Creates a lens for navigating and immutably updating nested data structures. Lenses provide a functional approach to accessing and modifying deeply nested properties."}),e("h3",{children:"Signature"}),e(t,{language:"typescript",code:`function lens<T extends object>(
  sceneList?: (string | number | symbol)[]
): Lens<T, T>`}),e("h3",{children:"Parameters"}),e("ul",{children:e("li",{children:[e("code",{children:"sceneList"})," (optional) - Initial path array for the lens. Defaults to empty array."]})}),e("h3",{children:"Returns"}),e("p",{children:["Returns a ",e("code",{children:"Lens"})," instance with the following methods:"]}),e("h3",{children:"Lens Class"}),e(t,{language:"typescript",code:`class Lens<Root extends object, Focus = Root> {
  // Navigate to a nested property
  chain<K extends keyof Focus>(prop: K): Lens<Root, Focus[K]>

  // Get the focused value from an object
  get(targetObject: Root): Focus

  // Create an immutable update function
  set(value: Focus): (targetObject: Root) => Root
}`}),e("h3",{children:"Methods"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Method"}),e("th",{children:"Description"}),e("th",{children:"Returns"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"chain(prop)"})}),e("td",{children:"Navigate to a nested property"}),e("td",{children:["New ",e("code",{children:"Lens"})," focused on the property"]})]}),e("tr",{children:[e("td",{children:e("code",{children:"get(obj)"})}),e("td",{children:"Extract the focused value"}),e("td",{children:"The value at the focused path"})]}),e("tr",{children:[e("td",{children:e("code",{children:"set(value)"})}),e("td",{children:"Create an update function"}),e("td",{children:"Function that returns a new object with the update"})]})]})]}),e("h3",{children:"Example"}),e(t,{language:"typescript",code:`import { lens } from 'state-ref';

interface State {
  user: {
    profile: {
      name: string;
      age: number;
    };
    settings: {
      theme: string;
    };
  };
}

const state: State = {
  user: {
    profile: { name: 'John', age: 30 },
    settings: { theme: 'dark' }
  }
};

// Create a lens and navigate to nested property
const nameLens = lens<State>().chain('user').chain('profile').chain('name');

// Get the value
console.log(nameLens.get(state));  // 'John'

// Set the value (returns new object, original unchanged)
const newState = nameLens.set('Jane')(state);
console.log(newState.user.profile.name);  // 'Jane'
console.log(state.user.profile.name);     // 'John' (unchanged)

// Works with arrays too
interface ListState {
  items: { id: number; name: string }[];
}

const listState: ListState = {
  items: [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
  ]
};

const firstItemNameLens = lens<ListState>()
  .chain('items')
  .chain(0)
  .chain('name');

console.log(firstItemNameLens.get(listState));  // 'Item 1'`}),e("h2",{children:"copyable"}),e("p",{children:["Wraps an object to provide a convenient ",e("code",{children:"writeCopy"})," method for immutable updates. Combines lens navigation with a fluent API."]}),e("h3",{children:"Signature"}),e(t,{language:"typescript",code:`function copyable<T extends { [key: string | symbol]: unknown }>(
  origObj: T,
  lensInit?: Lens<T, any>
): Copyable<T>

type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(value: V) => Root;
}`}),e("h3",{children:"Parameters"}),e("ul",{children:[e("li",{children:[e("code",{children:"origObj: T"})," - The object to wrap"]}),e("li",{children:[e("code",{children:"lensInit"})," (optional) - Initial lens for the wrapper"]})]}),e("h3",{children:"Returns"}),e("p",{children:["Returns a ",e("code",{children:"Copyable"})," proxy that allows:"]}),e("ul",{children:[e("li",{children:"Property navigation (like regular object access)"}),e("li",{children:[e("code",{children:"writeCopy(value)"})," method to create an immutable update"]})]}),e("h3",{children:"Example"}),e(t,{language:"typescript",code:`import { copyable } from 'state-ref';

const state = {
  user: {
    name: 'John',
    profile: {
      age: 30,
      city: 'Seoul'
    }
  }
};

// Navigate and update immutably
const newState = copyable(state).user.profile.age.writeCopy(31);

console.log(newState.user.profile.age);  // 31
console.log(state.user.profile.age);     // 30 (unchanged)

// Multiple updates
const state2 = copyable(newState).user.name.writeCopy('Jane');
console.log(state2.user.name);           // 'Jane'
console.log(state2.user.profile.age);    // 31

// Direct property assignment throws error
try {
  copyable(state).user.name = 'Jane';  // Error!
} catch (e) {
  console.log(e.message);
  // "Property modification is not supported on a copyable object..."
}`}),e("h3",{children:"Use with StateRef"}),e(t,{language:"typescript",code:`import { createStore, copyable } from 'state-ref';

const watch = createStore({
  todos: [
    { id: 1, text: 'Learn StateRef', done: false },
    { id: 2, text: 'Build app', done: false }
  ]
});

const ref = watch();

// Update nested array item immutably
ref.todos.value = copyable(ref.todos.value)[0].done.writeCopy(true);

console.log(ref.todos.value[0].done);  // true`}),e("h2",{children:"cloneDeep"}),e("p",{children:"Creates a deep copy of a value. Recursively clones objects and arrays."}),e("h3",{children:"Signature"}),e(t,{language:"typescript",code:"function cloneDeep<T>(value: T): T"}),e("h3",{children:"Parameters"}),e("ul",{children:e("li",{children:[e("code",{children:"value: T"})," - The value to clone"]})}),e("h3",{children:"Returns"}),e("p",{children:"Returns a deep copy of the input value. For primitives, returns the value as-is. For objects and arrays, creates new instances with recursively cloned contents."}),e("h3",{children:"Behavior"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Input Type"}),e("th",{children:"Behavior"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:[e("code",{children:"null"})," / ",e("code",{children:"undefined"})]}),e("td",{children:"Returns as-is"})]}),e("tr",{children:[e("td",{children:"Primitives (number, string, boolean)"}),e("td",{children:"Returns as-is"})]}),e("tr",{children:[e("td",{children:"Arrays"}),e("td",{children:"Creates new array with cloned elements"})]}),e("tr",{children:[e("td",{children:"Objects"}),e("td",{children:"Creates new object with cloned properties"})]})]})]}),e("h3",{children:"Example"}),e(t,{language:"typescript",code:`import { cloneDeep } from 'state-ref';

const original = {
  name: 'John',
  scores: [85, 90, 78],
  address: {
    city: 'Seoul',
    zip: '12345'
  }
};

const cloned = cloneDeep(original);

// Modifications to clone don't affect original
cloned.name = 'Jane';
cloned.scores.push(95);
cloned.address.city = 'Busan';

console.log(original.name);           // 'John'
console.log(original.scores);         // [85, 90, 78]
console.log(original.address.city);   // 'Seoul'

console.log(cloned.name);             // 'Jane'
console.log(cloned.scores);           // [85, 90, 78, 95]
console.log(cloned.address.city);     // 'Busan'

// Primitives
console.log(cloneDeep(42));           // 42
console.log(cloneDeep('hello'));      // 'hello'
console.log(cloneDeep(null));         // null`}),e("h3",{children:"Use Cases"}),e(t,{language:"typescript",code:`import { createStore, cloneDeep } from 'state-ref';

const watch = createStore({
  items: [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
  ]
});

const ref = watch();

// Clone before making multiple mutations
const newItems = cloneDeep(ref.items.value);
newItems[0].name = 'Updated Item 1';
newItems.push({ id: 3, name: 'Item 3' });

// Assign the cloned and modified array
ref.items.value = newItems;`}),e("h2",{children:"Summary Table"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Function"}),e("th",{children:"Purpose"}),e("th",{children:"Mutates Original"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"lens"})}),e("td",{children:"Navigate and update nested structures"}),e("td",{children:"No"})]}),e("tr",{children:[e("td",{children:e("code",{children:"copyable"})}),e("td",{children:"Fluent API for immutable updates"}),e("td",{children:"No"})]}),e("tr",{children:[e("td",{children:e("code",{children:"cloneDeep"})}),e("td",{children:"Deep copy values"}),e("td",{children:"No (creates copy)"})]})]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/lens",children:"Lens Pattern Guide"})," - Detailed lens usage guide"]}),e("li",{children:[e("a",{href:"#/guide/copyable",children:"copyable Guide"})," - copyable usage guide"]}),e("li",{children:[e("a",{href:"#/guide/clone-deep",children:"cloneDeep Guide"})," - cloneDeep usage guide"]}),e("li",{children:[e("a",{href:"#/api/core",children:"Core API"})," - createStore, createComputed, combineWatch"]}),e("li",{children:[e("a",{href:"#/api/types",children:"TypeScript Types"})," - Complete type definitions"]})]})]})),Mi=u(()=>()=>e("div",{children:[e("h1",{children:"Helper API"}),e("p",{children:["이 페이지는 ",e("code",{children:"state-ref"}),"에서 내보내는 헬퍼 함수들을 문서화합니다. 이 유틸리티들은 불변 업데이트와 깊은 복사를 지원합니다."]}),e("h2",{children:"lens"}),e("p",{children:"중첩된 데이터 구조를 탐색하고 불변하게 업데이트하기 위한 렌즈를 생성합니다. 렌즈는 깊게 중첩된 프로퍼티에 접근하고 수정하는 함수형 접근 방식을 제공합니다."}),e("h3",{children:"시그니처"}),e(t,{language:"typescript",code:`function lens<T extends object>(
  sceneList?: (string | number | symbol)[]
): Lens<T, T>`}),e("h3",{children:"매개변수"}),e("ul",{children:e("li",{children:[e("code",{children:"sceneList"})," (선택) - 렌즈의 초기 경로 배열. 기본값은 빈 배열."]})}),e("h3",{children:"반환값"}),e("p",{children:["다음 메서드를 가진 ",e("code",{children:"Lens"})," 인스턴스를 반환합니다:"]}),e("h3",{children:"Lens 클래스"}),e(t,{language:"typescript",code:`class Lens<Root extends object, Focus = Root> {
  // 중첩된 프로퍼티로 탐색
  chain<K extends keyof Focus>(prop: K): Lens<Root, Focus[K]>

  // 객체에서 포커스된 값 가져오기
  get(targetObject: Root): Focus

  // 불변 업데이트 함수 생성
  set(value: Focus): (targetObject: Root) => Root
}`}),e("h3",{children:"메서드"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"메서드"}),e("th",{children:"설명"}),e("th",{children:"반환값"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"chain(prop)"})}),e("td",{children:"중첩된 프로퍼티로 탐색"}),e("td",{children:["해당 프로퍼티에 포커스된 새 ",e("code",{children:"Lens"})]})]}),e("tr",{children:[e("td",{children:e("code",{children:"get(obj)"})}),e("td",{children:"포커스된 값 추출"}),e("td",{children:"포커스된 경로의 값"})]}),e("tr",{children:[e("td",{children:e("code",{children:"set(value)"})}),e("td",{children:"업데이트 함수 생성"}),e("td",{children:"업데이트가 적용된 새 객체를 반환하는 함수"})]})]})]}),e("h3",{children:"예제"}),e(t,{language:"typescript",code:`import { lens } from 'state-ref';

interface State {
  user: {
    profile: {
      name: string;
      age: number;
    };
    settings: {
      theme: string;
    };
  };
}

const state: State = {
  user: {
    profile: { name: 'John', age: 30 },
    settings: { theme: 'dark' }
  }
};

// 렌즈를 생성하고 중첩된 프로퍼티로 탐색
const nameLens = lens<State>().chain('user').chain('profile').chain('name');

// 값 가져오기
console.log(nameLens.get(state));  // 'John'

// 값 설정 (새 객체 반환, 원본 변경 없음)
const newState = nameLens.set('Jane')(state);
console.log(newState.user.profile.name);  // 'Jane'
console.log(state.user.profile.name);     // 'John' (변경 없음)

// 배열에서도 작동
interface ListState {
  items: { id: number; name: string }[];
}

const listState: ListState = {
  items: [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
  ]
};

const firstItemNameLens = lens<ListState>()
  .chain('items')
  .chain(0)
  .chain('name');

console.log(firstItemNameLens.get(listState));  // 'Item 1'`}),e("h2",{children:"copyable"}),e("p",{children:["객체를 감싸서 불변 업데이트를 위한 편리한 ",e("code",{children:"writeCopy"})," ","메서드를 제공합니다. 렌즈 탐색과 플루언트 API를 결합합니다."]}),e("h3",{children:"시그니처"}),e(t,{language:"typescript",code:`function copyable<T extends { [key: string | symbol]: unknown }>(
  origObj: T,
  lensInit?: Lens<T, any>
): Copyable<T>

type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(value: V) => Root;
}`}),e("h3",{children:"매개변수"}),e("ul",{children:[e("li",{children:[e("code",{children:"origObj: T"})," - 감쌀 객체"]}),e("li",{children:[e("code",{children:"lensInit"})," (선택) - 래퍼의 초기 렌즈"]})]}),e("h3",{children:"반환값"}),e("p",{children:["다음을 허용하는 ",e("code",{children:"Copyable"})," 프록시를 반환합니다:"]}),e("ul",{children:[e("li",{children:"프로퍼티 탐색 (일반 객체 접근처럼)"}),e("li",{children:["불변 업데이트를 생성하는 ",e("code",{children:"writeCopy(value)"})," 메서드"]})]}),e("h3",{children:"예제"}),e(t,{language:"typescript",code:`import { copyable } from 'state-ref';

const state = {
  user: {
    name: 'John',
    profile: {
      age: 30,
      city: 'Seoul'
    }
  }
};

// 탐색하고 불변하게 업데이트
const newState = copyable(state).user.profile.age.writeCopy(31);

console.log(newState.user.profile.age);  // 31
console.log(state.user.profile.age);     // 30 (변경 없음)

// 여러 번 업데이트
const state2 = copyable(newState).user.name.writeCopy('Jane');
console.log(state2.user.name);           // 'Jane'
console.log(state2.user.profile.age);    // 31

// 직접 프로퍼티 할당은 에러 발생
try {
  copyable(state).user.name = 'Jane';  // Error!
} catch (e) {
  console.log(e.message);
  // "Property modification is not supported on a copyable object..."
}`}),e("h3",{children:"StateRef와 함께 사용"}),e(t,{language:"typescript",code:`import { createStore, copyable } from 'state-ref';

const watch = createStore({
  todos: [
    { id: 1, text: 'Learn StateRef', done: false },
    { id: 2, text: 'Build app', done: false }
  ]
});

const ref = watch();

// 중첩된 배열 항목을 불변하게 업데이트
ref.todos.value = copyable(ref.todos.value)[0].done.writeCopy(true);

console.log(ref.todos.value[0].done);  // true`}),e("h2",{children:"cloneDeep"}),e("p",{children:"값의 깊은 복사본을 생성합니다. 객체와 배열을 재귀적으로 복제합니다."}),e("h3",{children:"시그니처"}),e(t,{language:"typescript",code:"function cloneDeep<T>(value: T): T"}),e("h3",{children:"매개변수"}),e("ul",{children:e("li",{children:[e("code",{children:"value: T"})," - 복제할 값"]})}),e("h3",{children:"반환값"}),e("p",{children:"입력 값의 깊은 복사본을 반환합니다. 원시 타입은 그대로 반환합니다. 객체와 배열은 재귀적으로 복제된 내용으로 새 인스턴스를 생성합니다."}),e("h3",{children:"동작"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"입력 타입"}),e("th",{children:"동작"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:[e("code",{children:"null"})," / ",e("code",{children:"undefined"})]}),e("td",{children:"그대로 반환"})]}),e("tr",{children:[e("td",{children:"원시 타입 (number, string, boolean)"}),e("td",{children:"그대로 반환"})]}),e("tr",{children:[e("td",{children:"배열"}),e("td",{children:"복제된 요소로 새 배열 생성"})]}),e("tr",{children:[e("td",{children:"객체"}),e("td",{children:"복제된 프로퍼티로 새 객체 생성"})]})]})]}),e("h3",{children:"예제"}),e(t,{language:"typescript",code:`import { cloneDeep } from 'state-ref';

const original = {
  name: 'John',
  scores: [85, 90, 78],
  address: {
    city: 'Seoul',
    zip: '12345'
  }
};

const cloned = cloneDeep(original);

// 복제본 수정은 원본에 영향 없음
cloned.name = 'Jane';
cloned.scores.push(95);
cloned.address.city = 'Busan';

console.log(original.name);           // 'John'
console.log(original.scores);         // [85, 90, 78]
console.log(original.address.city);   // 'Seoul'

console.log(cloned.name);             // 'Jane'
console.log(cloned.scores);           // [85, 90, 78, 95]
console.log(cloned.address.city);     // 'Busan'

// 원시 타입
console.log(cloneDeep(42));           // 42
console.log(cloneDeep('hello'));      // 'hello'
console.log(cloneDeep(null));         // null`}),e("h3",{children:"사용 사례"}),e(t,{language:"typescript",code:`import { createStore, cloneDeep } from 'state-ref';

const watch = createStore({
  items: [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
  ]
});

const ref = watch();

// 여러 변경 전에 복제
const newItems = cloneDeep(ref.items.value);
newItems[0].name = 'Updated Item 1';
newItems.push({ id: 3, name: 'Item 3' });

// 복제하고 수정한 배열 할당
ref.items.value = newItems;`}),e("h2",{children:"요약 표"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"함수"}),e("th",{children:"목적"}),e("th",{children:"원본 변경"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"lens"})}),e("td",{children:"중첩 구조 탐색 및 업데이트"}),e("td",{children:"아니오"})]}),e("tr",{children:[e("td",{children:e("code",{children:"copyable"})}),e("td",{children:"불변 업데이트를 위한 플루언트 API"}),e("td",{children:"아니오"})]}),e("tr",{children:[e("td",{children:e("code",{children:"cloneDeep"})}),e("td",{children:"값 깊은 복사"}),e("td",{children:"아니오 (복사본 생성)"})]})]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/lens",children:"Lens 패턴 가이드"})," - 상세 lens 사용 가이드"]}),e("li",{children:[e("a",{href:"#/ko/guide/copyable",children:"copyable 가이드"})," - copyable 사용 가이드"]}),e("li",{children:[e("a",{href:"#/ko/guide/clone-deep",children:"cloneDeep 가이드"})," - cloneDeep 사용 가이드"]}),e("li",{children:[e("a",{href:"#/ko/api/core",children:"코어 API"})," - createStore, createComputed, combineWatch"]}),e("li",{children:[e("a",{href:"#/ko/api/types",children:"TypeScript 타입"})," - 전체 타입 정의"]})]})]})),Oi=u(()=>()=>e("div",{children:[e("h1",{children:"Draft API"}),e("p",{children:["Everything exported from ",e("code",{children:"state-ref/draft"}),". See"," ",e("a",{href:"#/guide/draft",children:"createDraft"})," for the guide."]}),e("h2",{children:"createDraft"}),e(t,{language:"typescript",code:"function createDraft<T>(source: StateRefStore<T>): Draft<T>"}),e("p",{children:["Opens an independent local edit session over ",e("code",{children:"source"}),", starting from its value at the moment of the call. The source may be a whole store ref or any child ref under it."]}),e("h2",{children:"Draft"}),e(t,{language:"typescript",code:`type Draft<T> = Readonly<{
  ref: StateRefStore<T>;
  watch: Watch<T>;
  status: StateRefStore<DraftStatus>;
  watchStatus: Watch<DraftStatus>;
  isDirty: () => boolean;
  changes: () => readonly DraftChange[];
  version: () => number;
  apply: () => DraftApplyResult;
  resolve: (
    change: DraftChange,
    choice: 'source' | 'draft'
  ) => DraftResolveResult;
  reset: () => void;
  discard: () => void;
}>`}),e("ul",{children:[e("li",{children:[e("code",{children:"ref"})," - reads and writes the draft's own value."]}),e("li",{children:[e("code",{children:"watch"})," / ",e("code",{children:"watchStatus"})," - the ",e("code",{children:"Watch"})," ","shape the UI connectors accept."]}),e("li",{children:[e("code",{children:"status"})," - reactive ",e("code",{children:"dirty"}),","," ",e("code",{children:"conflicts"})," and ",e("code",{children:"version"}),", without adding fields to the payload."]}),e("li",{children:[e("code",{children:"reset()"})," - drops local edits, keeps the session open."]}),e("li",{children:[e("code",{children:"discard()"})," - ends the session and releases its subscriptions. Every later access throws"," ",e("code",{children:"This draft has been discarded."})]})]}),e("h2",{children:"DraftStatus"}),e(t,{language:"typescript",code:`type DraftStatus = Readonly<{
  dirty: boolean;
  conflicts: number;
  version: number;
}>`}),e("h2",{children:"DraftValue"}),e(t,{language:"typescript",code:"type DraftValue = Readonly<{ exists: boolean; value: unknown }>"}),e("p",{children:['A wrapper rather than a bare value, so "the path is absent" and "the path holds ',e("code",{children:"undefined"}),'" stay distinct.']}),e("h2",{children:"DraftChange"}),e(t,{language:"typescript",code:`type DraftChange = Readonly<{
  /** Opaque identity; a change from another draft is never accepted here. */
  owner: object;
  id: number;
  version: number;
  path: readonly (string | number)[];
  before: DraftValue;   // the value at the branch point
  after: DraftValue;    // what the draft holds now
  source: DraftValue;   // what the source holds right now
  conflict: boolean;
}>`}),e("p",{children:"One row per edited path. An array is tracked as one atomic field, so editing an element records a change for the array."}),e("h2",{children:"DraftApplyResult"}),e(t,{language:"typescript",code:`type DraftApplyResult =
  | Readonly<{ ok: true; applied: number }>
  | Readonly<{
      ok: false;
      reason: 'readonly' | 'missing-source' | 'invalid-source' | 'conflict';
    }>`}),e("p",{children:["A refusal changes nothing. The reasons are checked in this order: the source path being gone or unwritable, then ",e("code",{children:"readonly"}),", then conflicts."]}),e("ul",{children:[e("li",{children:[e("code",{children:"conflict"})," - the path still exists but no longer holds what the draft branched from, including a type swap."]}),e("li",{children:[e("code",{children:"missing-source"})," - the path itself is gone."]}),e("li",{children:[e("code",{children:"invalid-source"})," - the source ref cannot be written through."]}),e("li",{children:[e("code",{children:"readonly"})," - the source refuses every write; in practice a query opened with ",e("code",{children:"editable: false"}),"."]}),e("li",{children:[e("code",{children:"applied"})," - how many paths were written. A clean draft answers ",e("code",{children:"{ ok: true, applied: 0 }"}),"."]})]}),e("h2",{children:"DraftResolveResult"}),e(t,{language:"typescript",code:`type DraftResolveResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: 'stale' | 'missing-source' | 'boundary' }>`}),e("ul",{children:[e("li",{children:[e("code",{children:"stale"})," - the change belongs to another draft, or the draft version has moved since the row was read. Read ",e("code",{children:"changes()"})," ","again."]}),e("li",{children:[e("code",{children:"missing-source"})," - there is no source side left to choose."]}),e("li",{children:[e("code",{children:"boundary"})," - keeping the draft's value would require writing where the source's shape does not allow."]})]}),e("h2",{children:"UMD"}),e("p",{children:["Load ",e("code",{children:"state-ref.umd.js"})," before"," ",e("code",{children:"state-ref.draft.umd.js"}),", then use the"," ",e("code",{children:"stateRefDraft"})," global."]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/draft",children:"createDraft"})," - the guide"]}),e("li",{children:e("a",{href:"#/guide/draft-conflicts",children:"Conflicts"})}),e("li",{children:[e("a",{href:"#/api/sync",children:"Sync API"})," - the same change model over a server baseline"]})]})]})),Li=u(()=>()=>e("div",{children:[e("h1",{children:"Draft API"}),e("p",{children:[e("code",{children:"state-ref/draft"}),"가 내보내는 전부입니다. 설명은"," ",e("a",{href:"#/ko/guide/draft",children:"createDraft"}),"를 보세요."]}),e("h2",{children:"createDraft"}),e(t,{language:"typescript",code:"function createDraft<T>(source: StateRefStore<T>): Draft<T>"}),e("p",{children:[e("code",{children:"source"})," 위에 독립된 로컬 편집 세션을 열고, 호출 시점의 그 값에서 시작합니다. source는 스토어 전체 ref일 수도, 그 아래 아무 자식 ref일 수도 있습니다."]}),e("h2",{children:"Draft"}),e(t,{language:"typescript",code:`type Draft<T> = Readonly<{
  ref: StateRefStore<T>;
  watch: Watch<T>;
  status: StateRefStore<DraftStatus>;
  watchStatus: Watch<DraftStatus>;
  isDirty: () => boolean;
  changes: () => readonly DraftChange[];
  version: () => number;
  apply: () => DraftApplyResult;
  resolve: (
    change: DraftChange,
    choice: 'source' | 'draft'
  ) => DraftResolveResult;
  reset: () => void;
  discard: () => void;
}>`}),e("ul",{children:[e("li",{children:[e("code",{children:"ref"})," - draft 자신의 값을 읽고 쓴다."]}),e("li",{children:[e("code",{children:"watch"})," / ",e("code",{children:"watchStatus"})," - UI 커넥터가 받는"," ",e("code",{children:"Watch"})," 모양."]}),e("li",{children:[e("code",{children:"status"})," - payload에 필드를 더하지 않고 내는 반응형"," ",e("code",{children:"dirty"}),"·",e("code",{children:"conflicts"}),"·",e("code",{children:"version"}),"."]}),e("li",{children:[e("code",{children:"reset()"})," - 로컬 편집을 버리고 세션은 열어 둔다."]}),e("li",{children:[e("code",{children:"discard()"})," - 세션을 끝내고 구독을 놓는다. 이후의 모든 접근은 ",e("code",{children:"This draft has been discarded."}),"로 던진다."]})]}),e("h2",{children:"DraftStatus"}),e(t,{language:"typescript",code:`type DraftStatus = Readonly<{
  dirty: boolean;
  conflicts: number;
  version: number;
}>`}),e("h2",{children:"DraftValue"}),e(t,{language:"typescript",code:"type DraftValue = Readonly<{ exists: boolean; value: unknown }>"}),e("p",{children:['맨 값이 아니라 감싼 형태인 이유는, "경로가 없다"와 "경로가 ',e("code",{children:"undefined"}),'를 담고 있다"를 구별하기 위해서입니다.']}),e("h2",{children:"DraftChange"}),e(t,{language:"typescript",code:`type DraftChange = Readonly<{
  /** 불투명한 정체성. 다른 draft의 변경은 여기서 절대 받지 않는다. */
  owner: object;
  id: number;
  version: number;
  path: readonly (string | number)[];
  before: DraftValue;   // 분기 시점의 값
  after: DraftValue;    // draft가 지금 든 값
  source: DraftValue;   // 원본이 지금 든 값
  conflict: boolean;
}>`}),e("p",{children:"편집한 경로마다 한 줄입니다. 배열은 하나의 원자적 필드로 추적되므로 원소를 고치면 배열의 변경으로 기록됩니다."}),e("h2",{children:"DraftApplyResult"}),e(t,{language:"typescript",code:`type DraftApplyResult =
  | Readonly<{ ok: true; applied: number }>
  | Readonly<{
      ok: false;
      reason: 'readonly' | 'missing-source' | 'invalid-source' | 'conflict';
    }>`}),e("p",{children:["거절은 아무것도 바꾸지 않습니다. 검사 순서는 원본 경로가 사라졌거나 쓸 수 없는 경우, 그다음 ",e("code",{children:"readonly"}),", 그다음 충돌입니다."]}),e("ul",{children:[e("li",{children:[e("code",{children:"conflict"})," - 경로는 아직 있지만 draft가 분기한 값을 더는 들고 있지 않다. 타입 교체도 여기에 포함된다."]}),e("li",{children:[e("code",{children:"missing-source"})," - 경로 자체가 사라졌다."]}),e("li",{children:[e("code",{children:"invalid-source"})," - 원본 ref로는 쓸 수 없다."]}),e("li",{children:[e("code",{children:"readonly"})," - 원본이 모든 쓰기를 거절한다. 실제로는"," ",e("code",{children:"editable: false"}),"로 연 조회."]}),e("li",{children:[e("code",{children:"applied"})," - 쓰인 경로 수. 깨끗한 draft는"," ",e("code",{children:"{ ok: true, applied: 0 }"}),"으로 답한다."]})]}),e("h2",{children:"DraftResolveResult"}),e(t,{language:"typescript",code:`type DraftResolveResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: 'stale' | 'missing-source' | 'boundary' }>`}),e("ul",{children:[e("li",{children:[e("code",{children:"stale"})," - 그 변경이 다른 draft의 것이거나, 줄을 읽은 뒤 draft 버전이 움직였다. ",e("code",{children:"changes()"}),"를 다시 읽으세요."]}),e("li",{children:[e("code",{children:"missing-source"})," - 고를 원본 쪽이 남아 있지 않다."]}),e("li",{children:[e("code",{children:"boundary"})," - draft 값을 지키려면 원본의 구조가 허용하지 않는 곳에 써야 한다."]})]}),e("h2",{children:"UMD"}),e("p",{children:[e("code",{children:"state-ref.umd.js"}),"를 ",e("code",{children:"state-ref.draft.umd.js"}),"보다 먼저 불러온 뒤 ",e("code",{children:"stateRefDraft"})," 전역을 쓰세요."]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/draft",children:"createDraft"})," - 가이드"]}),e("li",{children:e("a",{href:"#/ko/guide/draft-conflicts",children:"충돌과 해소"})}),e("li",{children:[e("a",{href:"#/ko/api/sync",children:"Sync API"})," - 서버 기준 위의 같은 변경 모델"]})]})]})),Fi=u(()=>()=>e("div",{children:[e("h1",{children:"Sync API"}),e("p",{children:["The surface of ",e("code",{children:"@stateref/sync"}),". See"," ",e("a",{href:"#/guide/sync",children:"createSyncClient"})," for the guides, and the package README for the full prose on every rule."]}),e("h2",{children:"createSyncClient"}),e(t,{language:"typescript",code:`function createSyncClient(options?: {
  ssr?: boolean;
  environment?: SyncEnvironment;
}): SyncClient`}),e("p",{children:["One client per app, or one per SSR request. An SSR client uses an infinite ",e("code",{children:"gcTime"}),", zero query retries, and creates no environment subscriptions or polling timers."]}),e("h2",{children:"SyncClient"}),e("h3",{children:"Queries"}),e(t,{language:"typescript",code:`client.query<T, S>(options): QueryHandle<T, S>          // fixed key
client.query<I, T, S>({ source, resolve, ...display }): QueryHandle<T, S>  // reactive key

client.fetch<T>(options): Promise<T>     // fresh cache or a READ; throws
client.prefetch<T>(options): Promise<void> // caches success, swallows rejection
client.ensure<T>(options): Promise<T>    // confirmed cache, even if stale`}),e("h3",{children:"Infinite queries"}),e(t,{language:"typescript",code:`client.infiniteQuery<Page, Param, S>(options): InfiniteQueryHandle<Page, Param, S>

client.fetchInfinite(options)
client.prefetchInfinite(options)
client.ensureInfinite(options)`}),e("p",{children:["Infinite pages are readonly, and ",e("code",{children:"infiniteQuery"})," takes a fixed key only - a reactive key has no infinite equivalent."]}),e("p",{children:["Guide: ",e("a",{href:"#/guide/sync-infinite",children:"Infinite Queries"}),"."]}),e(t,{language:"typescript",code:`// InfiniteQueryOptions<Page, Param> — QueryOptions without queryFn / editable / initialData, plus:
{
  queryFn: (context: { signal: AbortSignal; pageParam: Param }) => Page | Promise<Page>;
  initialPageParam: Param;   // JSON-compatible
  getNextPageParam: (lastPage, pages, lastPageParam, pageParams) => Param | null | undefined;
  getPreviousPageParam?: (firstPage, pages, firstPageParam, pageParams) => Param | null | undefined;
  maxPages?: number;
  initialData?: { pages: Page[]; pageParams: Param[] };
}

// InfiniteQueryHandle — data is { pages, pageParams }
handle.ref / handle.watch          // readonly
handle.status / handle.watchStatus
handle.display / handle.watchDisplay
handle.load()                      // the first page only
handle.refetch()                   // re-reads held pages from the first
handle.fetchNextPage() / handle.fetchPreviousPage()
handle.hasNextPage() / handle.hasPreviousPage()
handle.invalidate()
handle.dispose()
// no changes(), no capture()`}),e("h3",{children:"Mutations"}),e(t,{language:"typescript",code:"client.mutation<I, T>(options): MutationHandle<I, T>"}),e("h3",{children:"Cache"}),e(t,{language:"typescript",code:`client.invalidate(key: QueryKey): void
client.remove(key: QueryKey): boolean   // refused while anything holds the entry
client.size(): number

client.dehydrate()
client.hydrate(snapshot)
client.dehydrateLocal(options?: { inFlight?: 'reject' | 'unconfirmed' })
client.hydrateLocal(snapshot)   // into an empty client; starts no READ or WRITE`}),e("h3",{children:"Observation"}),e(t,{language:"typescript",code:`client.inspectCache(): readonly SyncCacheEntry[]
client.subscribeCache(listener): () => void

client.inspectMutations(): readonly SyncMutationEntry[]
client.subscribeMutations(listener): () => void`}),e("p",{children:["A read-only metadata boundary. Query data, local edits, mutation inputs and caller-owned error objects are omitted. See"," ",e("a",{href:"#/guide/sync-observation",children:"Observation"}),"."]}),e("h2",{children:"QueryOptions"}),e(t,{language:"typescript",code:`{
  queryKey: QueryKey;        // acyclic, JSON-compatible array
  queryFn: (context: { signal: AbortSignal }) => T | Promise<T>;

  editable?: boolean;        // default true
  initialData?: T;
  initialUpdatedAt?: number;
  staleTime?: number;        // default 0
  gcTime?: number;           // default 5 minutes; infinite in SSR
  retry?: number;
  retryDelay?: (attempt: number) => number;

  networkMode?: 'online' | 'always' | 'offlineFirst';  // default 'online'
  refetchOnFocus?: boolean | 'always';                 // default true
  refetchOnReconnect?: boolean | 'always';             // default true
  refetchInterval?: number | false;
  refetchIntervalInBackground?: boolean;               // default false
}`}),e("h2",{children:"QueryHandle"}),e(t,{language:"typescript",code:`handle.queryKey     // the key this handle was opened with
handle.ref          // editable resource ref; throws before a first load
handle.watch        // the Watch shape; throws before a first load
handle.status       // readable from the start
handle.watchStatus

handle.load()       // uses a fresh cached result when there is one
handle.refetch()    // forces a READ
handle.invalidate() // marks stale, excludes an older in-flight response
handle.dispose()    // releases this handle's subscriptions

handle.isDirty()
handle.changes()
handle.version()
handle.capture(ids?)        // ResourceSubmission: frozen value + rows + version
handle.acceptServer(value)  // cache-only acceptance; sends no WRITE
handle.serverValue()        // the server baseline without local edits; undefined before a load`}),e("h3",{children:"QueryStatus"}),e(t,{language:"typescript",code:`{
  status: 'pending' | 'success' | 'error';
  fetchStatus: 'idle' | 'fetching' | 'paused';
  loaded: boolean;
  error: unknown | null;
  updatedAt: number | null;
  invalidated: boolean;

  // the editing axis, kept separate
  dirty: boolean;
  conflicts: number;
  version: number;
  pending: number;
  unconfirmed: boolean;
}`}),e("h3",{children:"ResourceChange and ResourceSubmission"}),e("p",{children:["What ",e("code",{children:"changes()"})," and ",e("code",{children:"capture()"})," return. See"," ",e("a",{href:"#/guide/sync-lifecycle",children:"Edit Lifecycle"})," for how they are used."]}),e(t,{language:"typescript",code:`type ResourceValue = Readonly<{ exists: boolean; value: unknown }>;

type ResourceChange = Readonly<{
  owner: object;           // the resource it belongs to
  id: number;              // what capture(ids) takes
  version: number;         // resource version when read
  path: readonly (string | number)[];
  before: ResourceValue;   // the baseline
  after: ResourceValue;    // the local value
  conflict: boolean;       // a READ brought a different value here
}>;

type ResourceSubmission<T> = Readonly<{
  owner: object;
  version: number;         // stale once the resource version moves
  value: T;                // the whole current value, frozen
  changes: readonly ResourceChange[]; // all rows, or the ids passed
}>;`}),e("h2",{children:"Display"}),e(t,{language:"typescript",code:`// display options, on the query itself
{ placeholderData?: T; select?: (data: T) => S; equals?: (a: S, b: S) => boolean }

// query.display / query.watchDisplay - readonly, built on first access
QueryStatus & { data, isPlaceholder, errorSource, queryKey, enabled }

// no phase: derive it
const phase = q.display.isPlaceholder.value ? 'placeholder' : q.display.status.value;

// with a reactive key and no active key, ref / watch / status throw
// 'This query has no active key.'; display.enabled stays readable.`}),e("p",{children:"A fixed key does not start a READ. An active reactive key does."}),e("h2",{children:"Streaming"}),e(t,{language:"typescript",code:`streamQuery<T, M>(query, options: QueryStreamOptions<T, M>): QueryStream

// QueryStreamOptions<T, M>
{
  source: () => StreamSource<M>;  // called on start and on every refetch()
  reduce: (current: T | undefined, message: M) => T; // current = server value; treat as immutable (a batched intermediate may not be frozen)
  initialValue?: () => T;         // used by 'reset' / 'replace' restarts, never by the first run; a throw fails the run
  throttle?: number | 'frame';    // coalesce publishes; default 0
  onError?: (reason: unknown) => void; // once per failed run; a first-run sync source throw is also rethrown
}

// StreamSource<M>
AsyncIterable<M> | ((sink: StreamSink<M>, signal: AbortSignal) => void | (() => void))
// StreamSink<M> = { next(message), error(reason), complete() }

// QueryStream
stream.status       // readonly; QueryStreamStatus
stream.watchStatus
stream.refetch(options?: StreamRefetchOptions) // throws after close() or for an unknown mode
stream.close()

type StreamRefetchMode = 'reset' | 'append' | 'replace';
type StreamRefetchOptions = { mode?: StreamRefetchMode }; // default 'reset'

// QueryStreamStatus
{
  state: 'open' | 'complete' | 'error' | 'closed';
  received: number;  // messages of this run applied
  queued: number;    // held while a linked WRITE is pending
  buffered: number;  // folded off screen by a 'replace' run
  error: unknown;
}

ndjsonMessages<M>(input: Response | ReadableStream<Uint8Array> | (signal => Response | ReadableStream | Promise<...>)): StreamSource<M>
webSocketMessages<M>(socket: WebSocketLike, parse?: (data: unknown) => M): StreamSource<M>

// WebSocketLike — a browser WebSocket fits
{
  readonly readyState: number; // 0 CONNECTING, 1 OPEN, 2 CLOSING, 3 CLOSED
  addEventListener(type: 'message', listener: (event: { data: unknown }) => void): void;
  addEventListener(type: 'error', listener: (event: unknown) => void): void;
  addEventListener(type: 'close', listener: (event: { code: number; reason: string; wasClean: boolean }) => void): void;
  removeEventListener(type: string, listener: (event: any) => void): void;
  close(code?: number, reason?: string): void;
}`}),e("p",{children:["Guide: ",e("a",{href:"#/guide/sync-stream",children:"Streaming"}),"."]}),e("h2",{children:"Mutations"}),e(t,{language:"typescript",code:`client.mutation({
  mutationFn: (input, context: {
    signal: AbortSignal;
    operationId: number;
    attempt: number;          // 0 on the first try
    idempotencyKey?: string;
  }) => T | Promise<T>;
  onSuccess?: (data, input, operationId) => void | Promise<void>;
  onError?: (error, input, operationId) => void | Promise<void>;
  onSettled?: (result, input) => void | Promise<void>;
})

mutation.run(input, options?): Promise<MutationResult>
mutation.start(input, options?): MutationOperation
mutation.status / mutation.watchStatus   // the latest operation
mutation.dispose()

// options
{
  scope?: string;          // same scope runs in start order
  signal?: AbortSignal;    // aborting settles as 'unknown'
  retry?: number;          // opt-in; requires idempotencyKey
  retryDelay?: (attempt: number) => number;
  idempotencyKey?: string;
  links?: Array<{
    query: QueryHandle<any>;
    submission?: ResourceSubmission<any>;
    accept?:                          // default { kind: 'none' }
      | { kind: 'none' | 'refetch' | 'submitted' }
      | { kind: 'response'; select: (response: T) => any };
    onReject?: 'keep' | 'remove';     // 'remove' requires a submission
  }>;
}

// result.kind
'success' | 'sync-error' | 'rejected' | 'unknown'`}),e("p",{children:[e("code",{children:"unknown"})," keeps the edits and is never retried automatically."," ",e("code",{children:"sync-error"})," is reconciled with a new READ or a known server value, not by resending."]}),e("h3",{children:"MutationOperation, MutationStatus, MutationResult"}),e(t,{language:"typescript",code:`type MutationOperation<T> = Readonly<{
  id: number;
  status: StateRefStore<MutationStatus>;
  watchStatus: Watch<MutationStatus>;
  result: Promise<MutationResult<T>>;
  abort: () => void;       // settles as 'unknown'
  dispose: () => void;
}>;

type MutationStatus = Readonly<{
  phase: 'idle' | 'pending' | 'success' | 'sync-error' | 'rejected' | 'unknown';
  pending: number;
  operationId: number | null;
  error: unknown | null;
}>;

type MutationResult<T> =
  | { kind: 'success'; operationId: number; data: T; callbackError?: unknown }
  | { kind: 'sync-error'; operationId: number; data: T; error: unknown; callbackError?: unknown }
  | {
      kind: 'rejected' | 'unknown';
      operationId: number;
      error: unknown;          // a MutationRejectedError for 'rejected'
      recoveryError?: unknown; // onReject: 'remove' failed to revert
      callbackError?: unknown;
    };

class MutationRejectedError extends Error {
  constructor(message: string, reason?: unknown);
  readonly reason?: unknown;
}`}),e("h2",{children:"Environment"}),e(t,{language:"typescript",code:`import { createBrowserSyncEnvironment } from '@stateref/sync';

const environment = createBrowserSyncEnvironment(); // browser globals only`}),e(t,{language:"typescript",code:`type SyncEnvironment = Readonly<{
  subscribe: (listener: (event: 'focus' | 'reconnect') => void) => () => void;
  isFocused: () => boolean;
  isOnline: () => boolean;
}>;`}),e("p",{children:"Implement this yourself when the host knows better than browser globals - a native shell, a test, or a custom connectivity probe."}),e("h2",{children:"Persistence"}),e(t,{language:"typescript",code:`saveSyncSnapshot(client, storage, options)
restoreSyncSnapshot(client, storage, options)   // a new, empty client

saveLocalSyncSnapshot(client, storage, options)
restoreLocalSyncSnapshot(client, storage, options)

openPersistedLinkedMutation({ storage, key, buster, isOnline?, checkpoint? })
openPersistedMutationQueue({ storage, key, buster, maxAge?, commands, isOnline? })`}),e("p",{children:["Each wants its own storage key with exactly one writer. See"," ",e("a",{href:"#/guide/sync-persistence",children:"Persistence and SSR"}),"."]}),e(t,{language:"typescript",code:`type SyncStorage = Readonly<{
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
}>;

// options for save/restore(Local)SyncSnapshot
{ key: string; buster: string; maxAge?: number /* default Infinity */ }`}),e("p",{children:[e("code",{children:"localStorage"})," fits as is; the async signatures let an IndexedDB or native store fit too."]}),e("h2",{children:"Scope"}),e("p",{children:"The project tracks its comparison scope row by row and declares no equivalence with any other library. Four rows are recorded as partial - infinite key switching, framework SSR boundaries, the observation boundary, and per-connector differences in reactive options."}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/sync",children:"createSyncClient"})," - the guide"]}),e("li",{children:e("a",{href:"#/api/draft",children:"Draft API"})}),e("li",{children:e("a",{href:"#/api/plugin",children:"Plugin API"})})]})]})),Ui=u(()=>()=>e("div",{children:[e("h1",{children:"Sync API"}),e("p",{children:[e("code",{children:"@stateref/sync"}),"의 표면입니다. 설명은"," ",e("a",{href:"#/ko/guide/sync",children:"createSyncClient"}),"를, 모든 규칙의 자세한 서술은 패키지 README를 보세요."]}),e("h2",{children:"createSyncClient"}),e(t,{language:"typescript",code:`function createSyncClient(options?: {
  ssr?: boolean;
  environment?: SyncEnvironment;
}): SyncClient`}),e("p",{children:["앱당 하나, 또는 SSR 요청당 하나입니다. SSR client는 무한"," ",e("code",{children:"gcTime"}),"과 조회 재시도 0을 쓰고, environment 구독도 polling 타이머도 만들지 않습니다."]}),e("h2",{children:"SyncClient"}),e("h3",{children:"조회"}),e(t,{language:"typescript",code:`client.query<T, S>(options): QueryHandle<T, S>          // fixed key
client.query<I, T, S>({ source, resolve, ...display }): QueryHandle<T, S>  // reactive key

client.fetch<T>(options): Promise<T>     // fresh cache or a READ; throws
client.prefetch<T>(options): Promise<void> // caches success, swallows rejection
client.ensure<T>(options): Promise<T>    // confirmed cache, even if stale`}),e("h3",{children:"무한 조회"}),e(t,{language:"typescript",code:`client.infiniteQuery<Page, Param, S>(options): InfiniteQueryHandle<Page, Param, S>

client.fetchInfinite(options)
client.prefetchInfinite(options)
client.ensureInfinite(options)`}),e("p",{children:["무한 페이지는 읽기 전용이고 ",e("code",{children:"infiniteQuery"}),"는 고정 key만 받습니다. 반응형 key의 무한 조회판은 없습니다."]}),e("p",{children:["가이드: ",e("a",{href:"#/ko/guide/sync-infinite",children:"무한 조회"}),"."]}),e(t,{language:"typescript",code:`// InfiniteQueryOptions<Page, Param> — QueryOptions without queryFn / editable / initialData, plus:
{
  queryFn: (context: { signal: AbortSignal; pageParam: Param }) => Page | Promise<Page>;
  initialPageParam: Param;   // JSON-compatible
  getNextPageParam: (lastPage, pages, lastPageParam, pageParams) => Param | null | undefined;
  getPreviousPageParam?: (firstPage, pages, firstPageParam, pageParams) => Param | null | undefined;
  maxPages?: number;
  initialData?: { pages: Page[]; pageParams: Param[] };
}

// InfiniteQueryHandle — data is { pages, pageParams }
handle.ref / handle.watch          // readonly
handle.status / handle.watchStatus
handle.display / handle.watchDisplay
handle.load()                      // the first page only
handle.refetch()                   // re-reads held pages from the first
handle.fetchNextPage() / handle.fetchPreviousPage()
handle.hasNextPage() / handle.hasPreviousPage()
handle.invalidate()
handle.dispose()
// no changes(), no capture()`}),e("h3",{children:"mutation"}),e(t,{language:"typescript",code:"client.mutation<I, T>(options): MutationHandle<I, T>"}),e("h3",{children:"캐시"}),e(t,{language:"typescript",code:`client.invalidate(key: QueryKey): void
client.remove(key: QueryKey): boolean   // refused while anything holds the entry
client.size(): number

client.dehydrate()
client.hydrate(snapshot)
client.dehydrateLocal(options?: { inFlight?: 'reject' | 'unconfirmed' })
client.hydrateLocal(snapshot)   // into an empty client; starts no READ or WRITE`}),e("h3",{children:"관측"}),e(t,{language:"typescript",code:`client.inspectCache(): readonly SyncCacheEntry[]
client.subscribeCache(listener): () => void

client.inspectMutations(): readonly SyncMutationEntry[]
client.subscribeMutations(listener): () => void`}),e("p",{children:["읽기 전용 메타데이터 경계입니다. 조회 데이터, 로컬 편집, mutation 입력, 호출자 소유 오류 객체는 빠져 있습니다."," ",e("a",{href:"#/ko/guide/sync-observation",children:"관측"}),"을 보세요."]}),e("h2",{children:"QueryOptions"}),e(t,{language:"typescript",code:`{
  queryKey: QueryKey;        // acyclic, JSON-compatible array
  queryFn: (context: { signal: AbortSignal }) => T | Promise<T>;

  editable?: boolean;        // default true
  initialData?: T;
  initialUpdatedAt?: number;
  staleTime?: number;        // default 0
  gcTime?: number;           // default 5 minutes; infinite in SSR
  retry?: number;
  retryDelay?: (attempt: number) => number;

  networkMode?: 'online' | 'always' | 'offlineFirst';  // default 'online'
  refetchOnFocus?: boolean | 'always';                 // default true
  refetchOnReconnect?: boolean | 'always';             // default true
  refetchInterval?: number | false;
  refetchIntervalInBackground?: boolean;               // default false
}`}),e("h2",{children:"QueryHandle"}),e(t,{language:"typescript",code:`handle.queryKey     // the key this handle was opened with
handle.ref          // editable resource ref; throws before a first load
handle.watch        // the Watch shape; throws before a first load
handle.status       // readable from the start
handle.watchStatus

handle.load()       // uses a fresh cached result when there is one
handle.refetch()    // forces a READ
handle.invalidate() // marks stale, excludes an older in-flight response
handle.dispose()    // releases this handle's subscriptions

handle.isDirty()
handle.changes()
handle.version()
handle.capture(ids?)        // ResourceSubmission: frozen value + rows + version
handle.acceptServer(value)  // cache-only acceptance; sends no WRITE
handle.serverValue()        // 로컬 편집을 뺀 서버 기준값; 로드 전에는 undefined`}),e("h3",{children:"QueryStatus"}),e(t,{language:"typescript",code:`{
  status: 'pending' | 'success' | 'error';
  fetchStatus: 'idle' | 'fetching' | 'paused';
  loaded: boolean;
  error: unknown | null;
  updatedAt: number | null;
  invalidated: boolean;

  // the editing axis, kept separate
  dirty: boolean;
  conflicts: number;
  version: number;
  pending: number;
  unconfirmed: boolean;
}`}),e("h3",{children:"ResourceChange와 ResourceSubmission"}),e("p",{children:[e("code",{children:"changes()"}),"와 ",e("code",{children:"capture()"}),"가 돌려주는 것입니다. 어떻게 쓰이는지는 ",e("a",{href:"#/ko/guide/sync-lifecycle",children:"편집의 생애"}),"를 보세요."]}),e(t,{language:"typescript",code:`type ResourceValue = Readonly<{ exists: boolean; value: unknown }>;

type ResourceChange = Readonly<{
  owner: object;           // the resource it belongs to
  id: number;              // what capture(ids) takes
  version: number;         // resource version when read
  path: readonly (string | number)[];
  before: ResourceValue;   // the baseline
  after: ResourceValue;    // the local value
  conflict: boolean;       // a READ brought a different value here
}>;

type ResourceSubmission<T> = Readonly<{
  owner: object;
  version: number;         // stale once the resource version moves
  value: T;                // the whole current value, frozen
  changes: readonly ResourceChange[]; // all rows, or the ids passed
}>;`}),e("h2",{children:"표시(display)"}),e(t,{language:"typescript",code:`// display options, on the query itself
{ placeholderData?: T; select?: (data: T) => S; equals?: (a: S, b: S) => boolean }

// query.display / query.watchDisplay - readonly, built on first access
QueryStatus & { data, isPlaceholder, errorSource, queryKey, enabled }

// no phase: derive it
const phase = q.display.isPlaceholder.value ? 'placeholder' : q.display.status.value;

// with a reactive key and no active key, ref / watch / status throw
// 'This query has no active key.'; display.enabled stays readable.`}),e("p",{children:"고정 key는 READ를 시작하지 않습니다. 활성 반응형 key는 시작합니다."}),e("h2",{children:"스트리밍"}),e(t,{language:"typescript",code:`streamQuery<T, M>(query, options: QueryStreamOptions<T, M>): QueryStream

// QueryStreamOptions<T, M>
{
  source: () => StreamSource<M>;  // 시작할 때와 refetch()마다 호출
  reduce: (current: T | undefined, message: M) => T; // current = 서버 값; 불변으로 다룰 것 (묶음 안의 중간값은 freeze되지 않을 수 있음)
  initialValue?: () => T;         // 'reset' / 'replace' 재시작에만 쓰임(첫 run 제외); 예외면 run 실패
  throttle?: number | 'frame';    // 반영을 묶는다; 기본 0
  onError?: (reason: unknown) => void; // 실패한 run마다 한 번; 첫 run의 동기 source 예외는 다시 던져지기도 함
}

// StreamSource<M>
AsyncIterable<M> | ((sink: StreamSink<M>, signal: AbortSignal) => void | (() => void))
// StreamSink<M> = { next(message), error(reason), complete() }

// QueryStream
stream.status       // 읽기 전용; QueryStreamStatus
stream.watchStatus
stream.refetch(options?: StreamRefetchOptions) // close() 뒤나 알 수 없는 모드면 예외
stream.close()

type StreamRefetchMode = 'reset' | 'append' | 'replace';
type StreamRefetchOptions = { mode?: StreamRefetchMode }; // 기본 'reset'

// QueryStreamStatus
{
  state: 'open' | 'complete' | 'error' | 'closed';
  received: number;  // 이번 run에서 반영된 메시지 수
  queued: number;    // 연결된 WRITE를 기다리며 보류 중인 수
  buffered: number;  // 'replace' run이 화면 밖에서 접은 수
  error: unknown;
}

ndjsonMessages<M>(input: Response | ReadableStream<Uint8Array> | (signal => Response | ReadableStream | Promise<...>)): StreamSource<M>
webSocketMessages<M>(socket: WebSocketLike, parse?: (data: unknown) => M): StreamSource<M>

// WebSocketLike — 브라우저 WebSocket이 그대로 맞는다
{
  readonly readyState: number; // 0 CONNECTING, 1 OPEN, 2 CLOSING, 3 CLOSED
  addEventListener(type: 'message', listener: (event: { data: unknown }) => void): void;
  addEventListener(type: 'error', listener: (event: unknown) => void): void;
  addEventListener(type: 'close', listener: (event: { code: number; reason: string; wasClean: boolean }) => void): void;
  removeEventListener(type: string, listener: (event: any) => void): void;
  close(code?: number, reason?: string): void;
}`}),e("p",{children:["가이드: ",e("a",{href:"#/ko/guide/sync-stream",children:"스트리밍"}),"."]}),e("h2",{children:"mutation"}),e(t,{language:"typescript",code:`client.mutation({
  mutationFn: (input, context: {
    signal: AbortSignal;
    operationId: number;
    attempt: number;          // 0 on the first try
    idempotencyKey?: string;
  }) => T | Promise<T>;
  onSuccess?: (data, input, operationId) => void | Promise<void>;
  onError?: (error, input, operationId) => void | Promise<void>;
  onSettled?: (result, input) => void | Promise<void>;
})

mutation.run(input, options?): Promise<MutationResult>
mutation.start(input, options?): MutationOperation
mutation.status / mutation.watchStatus   // the latest operation
mutation.dispose()

// options
{
  scope?: string;          // same scope runs in start order
  signal?: AbortSignal;    // aborting settles as 'unknown'
  retry?: number;          // opt-in; requires idempotencyKey
  retryDelay?: (attempt: number) => number;
  idempotencyKey?: string;
  links?: Array<{
    query: QueryHandle<any>;
    submission?: ResourceSubmission<any>;
    accept?:                          // default { kind: 'none' }
      | { kind: 'none' | 'refetch' | 'submitted' }
      | { kind: 'response'; select: (response: T) => any };
    onReject?: 'keep' | 'remove';     // 'remove' requires a submission
  }>;
}

// result.kind
'success' | 'sync-error' | 'rejected' | 'unknown'`}),e("p",{children:[e("code",{children:"unknown"}),"은 편집을 지키고 자동으로 재시도하지 않습니다."," ",e("code",{children:"sync-error"}),"는 재전송이 아니라 새 READ나 알려진 서버 값으로 화해합니다."]}),e("h3",{children:"MutationOperation, MutationStatus, MutationResult"}),e(t,{language:"typescript",code:`type MutationOperation<T> = Readonly<{
  id: number;
  status: StateRefStore<MutationStatus>;
  watchStatus: Watch<MutationStatus>;
  result: Promise<MutationResult<T>>;
  abort: () => void;       // settles as 'unknown'
  dispose: () => void;
}>;

type MutationStatus = Readonly<{
  phase: 'idle' | 'pending' | 'success' | 'sync-error' | 'rejected' | 'unknown';
  pending: number;
  operationId: number | null;
  error: unknown | null;
}>;

type MutationResult<T> =
  | { kind: 'success'; operationId: number; data: T; callbackError?: unknown }
  | { kind: 'sync-error'; operationId: number; data: T; error: unknown; callbackError?: unknown }
  | {
      kind: 'rejected' | 'unknown';
      operationId: number;
      error: unknown;          // a MutationRejectedError for 'rejected'
      recoveryError?: unknown; // onReject: 'remove' failed to revert
      callbackError?: unknown;
    };

class MutationRejectedError extends Error {
  constructor(message: string, reason?: unknown);
  readonly reason?: unknown;
}`}),e("h2",{children:"environment"}),e(t,{language:"typescript",code:`import { createBrowserSyncEnvironment } from '@stateref/sync';

const environment = createBrowserSyncEnvironment(); // browser globals only`}),e(t,{language:"typescript",code:`type SyncEnvironment = Readonly<{
  subscribe: (listener: (event: 'focus' | 'reconnect') => void) => () => void;
  isFocused: () => boolean;
  isOnline: () => boolean;
}>;`}),e("p",{children:"호스트가 브라우저 전역보다 잘 아는 경우 — 네이티브 셸, 테스트, 자체 연결 검사 — 에는 이것을 직접 구현해 주입합니다."}),e("h2",{children:"영속화"}),e(t,{language:"typescript",code:`saveSyncSnapshot(client, storage, options)
restoreSyncSnapshot(client, storage, options)   // a new, empty client

saveLocalSyncSnapshot(client, storage, options)
restoreLocalSyncSnapshot(client, storage, options)

openPersistedLinkedMutation({ storage, key, buster, isOnline?, checkpoint? })
openPersistedMutationQueue({ storage, key, buster, maxAge?, commands, isOnline? })`}),e("p",{children:["각각 자기 저장 키와 정확히 하나의 작성자를 원합니다."," ",e("a",{href:"#/ko/guide/sync-persistence",children:"영속화와 SSR"}),"을 보세요."]}),e(t,{language:"typescript",code:`type SyncStorage = Readonly<{
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
}>;

// options for save/restore(Local)SyncSnapshot
{ key: string; buster: string; maxAge?: number /* default Infinity */ }`}),e("p",{children:[e("code",{children:"localStorage"}),"가 그대로 맞고, 비동기 시그니처라 IndexedDB나 네이티브 저장소도 맞출 수 있습니다."]}),e("h2",{children:"범위"}),e("p",{children:"프로젝트는 비교 범위를 행 단위로 추적하고, 어떤 라이브러리와의 동등성도 선언하지 않습니다. 네 행이 부분 지원으로 기록돼 있습니다 — 무한 조회의 key 전환, 프레임워크 SSR 경계, 관측 경계, 반응형 옵션의 커넥터별 차이."}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/sync",children:"createSyncClient"})," - 가이드"]}),e("li",{children:e("a",{href:"#/ko/api/draft",children:"Draft API"})}),e("li",{children:e("a",{href:"#/ko/api/plugin",children:"Plugin API"})})]})]})),qi=u(()=>()=>e("div",{children:[e("h1",{children:"Plugin API"}),e("p",{children:[e("code",{children:"state-ref/plugin"})," is the seam that"," ",e("code",{children:"state-ref/draft"})," and ",e("code",{children:"@stateref/sync"})," are built on. It lets a package look at a ref - where it points, whether it is writable, what it currently reads - and observe writes, without going through the subscription system a UI uses."]}),e("p",{children:[e("strong",{children:"Read this framing first."})," The source calls it"," ",e("em",{children:'"an optional integration surface for draft and sync packages"'})," ","and"," ",e("em",{children:'"an internal, opt-in view of a ref … not part of the package root API"'}),". It is documented here because building your own layer on top of"," ",e("code",{children:"state-ref"})," is the case it exists for - not because it carries the same stability promise as the root exports. If you only need to read and write state, you do not need this page."]}),e("h2",{children:"connectRef"}),e(t,{language:"typescript",code:`import { connectRef } from 'state-ref/plugin';

function connectRef<T>(source: StateRefStore<T>): RefConnection<T>

type RefConnection<T> = {
  readonly owner: object;
  readonly parent: RefPathCursor;
  readonly segment: string | symbol | null;
  readonly editable: boolean;
  readonly read: () => T | undefined;
  readonly exists: () => boolean;
};`}),e("p",{children:["Turns a ref into a description of itself. It throws"," ",e("code",{children:"Expected a state-ref reference."})," for anything that is not one."]}),e("ul",{children:[e("li",{children:[e("code",{children:"owner"})," - the root object this ref belongs to. Two refs from the same store share it."]}),e("li",{children:[e("code",{children:"parent"})," / ",e("code",{children:"segment"})," - where the ref points."," ",e("code",{children:"segment"})," is ",e("code",{children:"null"})," for a root ref."]}),e("li",{children:[e("code",{children:"editable"})," - whether writes are allowed through it. This is what a layer must consult before offering an edit; a readonly query's ref answers ",e("code",{children:"false"}),"."]}),e("li",{children:[e("code",{children:"read()"})," - the current value, or ",e("code",{children:"undefined"}),"."]}),e("li",{children:[e("code",{children:"exists()"})," - whether the path is present at all. Separate from ",e("code",{children:"read()"}),", because a path holding"," ",e("code",{children:"undefined"})," and a path that is gone are different facts - the same distinction ",e("code",{children:"DraftValue"})," carries."]})]}),e("h2",{children:"observeRef"}),e(t,{language:"typescript",code:`import { observeRef } from 'state-ref/plugin';

function observeRef<T>(
  source: StateRefStore<T>,
  callback: (value: T | undefined) => void
): () => void`}),e("p",{children:["Listens to ",e("strong",{children:"that path only"})," and returns a disposer. The ordinary runner still decides whether the value actually changed, including when an ancestor replaces the whole branch, so a callback is not woken by an unrelated write that happened to pass overhead."]}),e(t,{language:"typescript",code:`const stop = observeRef(source.address.city, value => {
  console.log('city is now', value);
});

stop();`}),e("h2",{children:"Write Observation"}),e("p",{children:"A store can report every successful ref setter, before its subscribers run. The hook is installed when the store is created."}),e(t,{language:"typescript",code:`import { create } from 'state-ref';

const store = create(
  { address: { city: 'Seoul' } },
  {
    // the parameter type is inferred; see the shape below
    onWrite: write => {
      write.parent;   // a path cursor - the core's stable path nodes
      write.segment;  // the key written, or null for a root write
      write.before;
      write.after;
    },
  }
);`}),e("p",{children:"The cursor uses the core's path nodes rather than an array, so an ordinary setter does not pay for building a path nobody reads. A layer that records the write materializes the path itself."}),e("p",{children:"Its shape:"}),e(t,{language:"typescript",code:`type RefWrite = Readonly<{
  parent: RefPathCursor;
  segment: string | symbol | null;
  before: unknown;
  after: unknown;
}>;

type RefPathCursor = {
  readonly segment: string | symbol;
  readonly parent: RefPathCursor | null;
};`}),e("p",{children:["Two things about this boundary are worth stating plainly rather than discovering later. ",e("code",{children:"onWrite"})," is an option of"," ",e("code",{children:"create"}),", and ",e("code",{children:"create"})," is marked in the core source as an internal seam rather than documented API -"," ",e("code",{children:"createStore"})," does not take it. And ",e("code",{children:"RefWrite"})," ","itself is ",e("strong",{children:"not exported"})," from ",e("code",{children:"state-ref"})," or"," ",e("code",{children:"state-ref/plugin"}),", so the callback parameter is typed by inference. That is the honest state of this surface today."]}),e("h2",{children:"guardWriteObserver"}),e(t,{language:"typescript",code:`import { guardWriteObserver } from 'state-ref/plugin';

const onWrite = guardWriteObserver(write => {
  // ...
});`}),e("p",{children:["Wraps an observer so that a write attempted ",e("em",{children:"from inside it"})," is rejected with"," ",e("code",{children:"A write observer cannot write to its own store."})," - before the nested setter can publish and overwrite the outer tree. Use it whenever your observer runs code that might write back."]}),e("h2",{children:"createWriteJournal"}),e(t,{language:"typescript",code:`import { createWriteJournal } from 'state-ref/plugin';

const journal = createWriteJournal();

const store = create(value, { onWrite: journal.onWrite });

journal.version();      // advances on every write
journal.entries();      // a copy of the user writes so far
journal.lastOrigin();
journal.clearEntries(); // after folding them into your own change model

journal.runAs('accepted-server-result', () => {
  ref.address.city.value = fromServer; // advances version, records no entry
});`}),e("p",{children:["An opt-in edit log for one owner. The point is the ",e("code",{children:"origin"})," ","distinction:"]}),e(t,{language:"typescript",code:`type WriteOrigin =
  | 'user'
  | 'source-refresh'
  | 'accepted-server-result'
  | 'rollback';

type JournalEntry = Readonly<{ version: number; write: RefWrite }>;`}),e("p",{children:["Only ",e("code",{children:"'user'"})," writes become entries. A baseline refresh, an accepted server result and a rollback all"," ",e("strong",{children:"advance the version"}),` but are not the user's changes - which is exactly what lets a resource tell "you edited this" from "the server moved it". Wrap the synchronous setter with`," ",e("code",{children:"runAs"}),", not an async request or a promise chain."]}),e("p",{children:"The observer mutates its private array only after all validation, and never calls user code."}),e("h2",{children:"Where This Is Used"}),e("p",{children:[e("a",{href:"#/guide/draft",children:"createDraft"})," uses it to know its source's path, editability and current value, and to journal edits into"," ",e("code",{children:"changes()"}),". ",e("a",{href:"#/guide/sync",children:"@stateref/sync"})," uses the same surface to keep a server baseline and a local edit apart on one ref."]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/custom-connector",children:"Custom Connector"})," - the ordinary way to integrate a UI library"]}),e("li",{children:e("a",{href:"#/api/draft",children:"Draft API"})}),e("li",{children:[e("a",{href:"#/guide/sync-observation",children:"Observation"})," - the sync-side boundary built on this"]})]})]})),_i=u(()=>()=>e("div",{children:[e("h1",{children:"Plugin API"}),e("p",{children:[e("code",{children:"state-ref/plugin"}),"은 ",e("code",{children:"state-ref/draft"}),"와"," ",e("code",{children:"@stateref/sync"}),"가 서 있는 이음새입니다. UI가 쓰는 구독 시스템을 거치지 않고, 패키지가 ref를 들여다보고(어디를 가리키는지, 쓸 수 있는지, 지금 무엇을 읽는지) 쓰기를 관측할 수 있게 해 줍니다."]}),e("p",{children:[e("strong",{children:"먼저 이 전제를 읽으세요."})," 소스는 이것을"," ",e("em",{children:'"draft와 sync 패키지를 위한 선택적 통합 표면"'}),"이자"," ",e("em",{children:'"ref에 대한 내부적이고 opt-in인 뷰 … 패키지 루트 API가 아님"'}),"이라고 적고 있습니다. 여기에 문서화하는 이유는 ",e("code",{children:"state-ref"})," ","위에 자기 층을 만드는 것이 이것이 존재하는 이유이기 때문이지, 루트 export와 같은 안정성 약속을 진다는 뜻이 아닙니다. 상태를 읽고 쓰기만 한다면 이 문서는 필요 없습니다."]}),e("h2",{children:"connectRef"}),e(t,{language:"typescript",code:`import { connectRef } from 'state-ref/plugin';

function connectRef<T>(source: StateRefStore<T>): RefConnection<T>

type RefConnection<T> = {
  readonly owner: object;
  readonly parent: RefPathCursor;
  readonly segment: string | symbol | null;
  readonly editable: boolean;
  readonly read: () => T | undefined;
  readonly exists: () => boolean;
};`}),e("p",{children:["ref를 자기 자신에 대한 설명으로 바꿉니다. ref가 아닌 것에는"," ",e("code",{children:"Expected a state-ref reference."}),"로 던집니다."]}),e("ul",{children:[e("li",{children:[e("code",{children:"owner"})," - 이 ref가 속한 루트 객체. 같은 스토어의 두 ref는 이것을 공유한다."]}),e("li",{children:[e("code",{children:"parent"})," / ",e("code",{children:"segment"})," - ref가 가리키는 위치. 루트 ref면 ",e("code",{children:"segment"}),"는 ",e("code",{children:"null"}),"이다."]}),e("li",{children:[e("code",{children:"editable"})," - 이 ref로 쓰기가 허용되는가. 어떤 층이든 편집을 제공하기 전에 확인해야 하는 값이고, readonly 조회의 ref는"," ",e("code",{children:"false"}),"로 답한다."]}),e("li",{children:[e("code",{children:"read()"})," - 현재 값, 또는 ",e("code",{children:"undefined"}),"."]}),e("li",{children:[e("code",{children:"exists()"})," - 그 경로가 존재하는가. ",e("code",{children:"read()"}),"와 따로 있는 이유는 ",e("code",{children:"undefined"}),"를 담은 경로와 사라진 경로가 다른 사실이기 때문입니다 — ",e("code",{children:"DraftValue"}),"가 지고 있는 것과 같은 구별입니다."]})]}),e("h2",{children:"observeRef"}),e(t,{language:"typescript",code:`import { observeRef } from 'state-ref/plugin';

function observeRef<T>(
  source: StateRefStore<T>,
  callback: (value: T | undefined) => void
): () => void`}),e("p",{children:[e("strong",{children:"그 경로만"})," 듣고 해제 함수를 돌려줍니다. 값이 실제로 바뀌었는지는 평범한 runner가 계속 판단하므로 — 조상이 가지 전체를 교체한 경우까지 포함해서 — 지나가기만 한 무관한 쓰기로는 콜백이 깨지 않습니다."]}),e(t,{language:"typescript",code:`const stop = observeRef(source.address.city, value => {
  console.log('city is now', value);
});

stop();`}),e("h2",{children:"쓰기 관측"}),e("p",{children:"스토어는 성공한 모든 ref setter를, 구독자가 돌기 전에 보고할 수 있습니다. 이 훅은 스토어를 만들 때 설치합니다."}),e(t,{language:"typescript",code:`import { create } from 'state-ref';

const store = create(
  { address: { city: 'Seoul' } },
  {
    // 인자 타입은 추론된다. 모양은 아래를 보라
    onWrite: write => {
      write.parent;   // 경로 커서 — 코어의 안정적인 path node
      write.segment;  // 쓰인 키, 루트 쓰기면 null
      write.before;
      write.after;
    },
  }
);`}),e("p",{children:"커서가 배열이 아니라 코어의 path node인 이유는, 평범한 setter가 아무도 읽지 않는 경로를 만드는 비용을 내지 않게 하기 위해서입니다. 쓰기를 기록하는 층이 경로를 직접 만들어 씁니다."}),e("p",{children:"모양:"}),e(t,{language:"typescript",code:`type RefWrite = Readonly<{
  parent: RefPathCursor;
  segment: string | symbol | null;
  before: unknown;
  after: unknown;
}>;

type RefPathCursor = {
  readonly segment: string | symbol;
  readonly parent: RefPathCursor | null;
};`}),e("p",{children:["이 경계에 대해 나중에 발견하기보다 먼저 알아 두는 편이 나은 것이 둘 있습니다. ",e("code",{children:"onWrite"}),"는 ",e("code",{children:"create"}),"의 옵션인데,"," ",e("code",{children:"create"}),"는 코어 소스에서 문서화된 API가 아니라 내부 이음새로 표시돼 있습니다(",e("code",{children:"createStore"}),"는 받지 않습니다). 그리고"," ",e("code",{children:"RefWrite"})," 자체가 ",e("code",{children:"state-ref"}),"에서도"," ",e("code",{children:"state-ref/plugin"}),"에서도 ",e("strong",{children:"export되지 않으므로"}),", 콜백 인자는 추론으로 타입이 붙습니다. 이것이 지금 이 표면의 정직한 상태입니다."]}),e("h2",{children:"guardWriteObserver"}),e(t,{language:"typescript",code:`import { guardWriteObserver } from 'state-ref/plugin';

const onWrite = guardWriteObserver(write => {
  // ...
});`}),e("p",{children:["관측자를 감싸서, ",e("em",{children:"그 안에서"})," 시도한 쓰기를"," ",e("code",{children:"A write observer cannot write to its own store."}),"로 거절합니다. 중첩된 setter가 바깥 트리를 발행해 덮어쓰기 전에 막습니다. 관측자가 되돌려 쓸 수 있는 코드를 실행한다면 쓰세요."]}),e("h2",{children:"createWriteJournal"}),e(t,{language:"typescript",code:`import { createWriteJournal } from 'state-ref/plugin';

const journal = createWriteJournal();

const store = create(value, { onWrite: journal.onWrite });

journal.version();      // 쓰기마다 올라간다
journal.entries();      // 지금까지의 user 쓰기 복사본
journal.lastOrigin();
journal.clearEntries(); // 자기 변경 모델로 접어 넣은 뒤에

journal.runAs('accepted-server-result', () => {
  ref.address.city.value = fromServer; // version은 올리고 항목은 남기지 않는다
});`}),e("p",{children:["소유자 하나를 위한 opt-in 편집 로그입니다. 핵심은 ",e("code",{children:"origin"})," ","구별입니다."]}),e(t,{language:"typescript",code:`type WriteOrigin =
  | 'user'
  | 'source-refresh'
  | 'accepted-server-result'
  | 'rollback';

type JournalEntry = Readonly<{ version: number; write: RefWrite }>;`}),e("p",{children:[e("code",{children:"'user'"})," 쓰기만 항목이 됩니다. 기준 갱신, 수용된 서버 결과, 롤백은 모두 ",e("strong",{children:"version은 올리지만"}),' 사용자의 변경이 아닙니다 — 그리고 그것이 resource가 "당신이 편집했다"와 "서버가 움직였다"를 가르는 방법입니다. ',e("code",{children:"runAs"}),"로는 동기 setter를 감싸세요. 비동기 요청이나 promise 체인이 아닙니다."]}),e("p",{children:"관측자는 모든 검증이 끝난 뒤에야 자기 비공개 배열을 바꾸고, 사용자 코드를 절대 호출하지 않습니다."}),e("h2",{children:"어디에 쓰이는가"}),e("p",{children:[e("a",{href:"#/ko/guide/draft",children:"createDraft"}),"가 원본의 경로, 편집 가능 여부, 현재 값을 알고 편집을 ",e("code",{children:"changes()"}),"로 기록하는 데 씁니다."," ",e("a",{href:"#/ko/guide/sync",children:"@stateref/sync"}),"는 같은 표면으로 한 ref 위에서 서버 기준과 로컬 편집을 갈라 둡니다."]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/custom-connector",children:"커스텀 커넥터"})," - UI 라이브러리를 연동하는 평범한 방법"]}),e("li",{children:e("a",{href:"#/ko/api/draft",children:"Draft API"})}),e("li",{children:[e("a",{href:"#/ko/guide/sync-observation",children:"관측"})," - 이 위에 선 sync 쪽 경계"]})]})]})),Vi=u(()=>()=>e("div",{children:[e("h1",{children:"TypeScript Types"}),e("p",{children:["This page documents the TypeScript types exported from"," ",e("code",{children:"state-ref"}),". These types provide full type safety when working with stores."]}),e("h2",{children:"Importing Types"}),e(t,{language:"typescript",code:`import type {
  StateRefStore,
  Watch,
  Renew,
  ManualSyncStore,
  Copyable
} from 'state-ref';`}),e("h2",{children:"Core Types"}),e("h3",{children:"StateRefStore<S>"}),e("p",{children:["The proxy type returned when calling a watch function. Provides reactive access to state via the ",e("code",{children:".value"})," property."]}),e(t,{language:"typescript",code:`type StateRefStore<S> = S extends object
  ? {
      [K in keyof S]: StateRefStore<S[K]>;
    } & {
      value: S;
    }
  : { value: S };`}),e("h4",{children:"Behavior"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Object types"}),": Each property becomes a nested"," ",e("code",{children:"StateRefStore"}),", plus a ",e("code",{children:".value"})," property for the whole object"]}),e("li",{children:[e("strong",{children:"Primitive types"}),": Simple wrapper with only"," ",e("code",{children:".value"})," property"]})]}),e("h4",{children:"Example"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';
import type { StateRefStore } from 'state-ref';

// For object type
interface User {
  name: string;
  age: number;
}

const userWatch = createStore<User>({ name: 'John', age: 30 });
const userRef: StateRefStore<User> = userWatch();

// Type structure:
// userRef.name        → StateRefStore<string>
// userRef.name.value  → string
// userRef.age         → StateRefStore<number>
// userRef.age.value   → number
// userRef.value       → User

// For primitive type
const countWatch = createStore<number>(0);
const countRef: StateRefStore<number> = countWatch();

// Type structure:
// countRef.value → number`}),e("h3",{children:"Watch<V>"}),e("p",{children:["The function type returned by ",e("code",{children:"createStore"}),". Used to access the store or subscribe to changes."]}),e("p",{children:["Called ",e("strong",{children:"with"})," a callback it subscribes and returns the reference bound to that subscription. Called ",e("strong",{children:"without"})," ","one it hands back a live reference that does not subscribe: reads and writes through it stay current, but it registers no notification path of its own. See ",e("a",{href:"#/guide/references",children:"Understanding References"}),"."]}),e(t,{language:"typescript",code:`type Watch<V> = (
  renew?: Renew<StateRefStore<V>>,
  userOption?: { cache?: boolean; editable?: boolean }
) => StateRefStore<V>;`}),e("h4",{children:"Parameters"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Parameter"}),e("th",{children:"Type"}),e("th",{children:"Description"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"renew"})}),e("td",{children:e("code",{children:"Renew<StateRefStore<V>>"})}),e("td",{children:"Optional callback for subscriptions"})]}),e("tr",{children:[e("td",{children:e("code",{children:"userOption.cache"})}),e("td",{children:e("code",{children:"boolean"})}),e("td",{children:"Cache proxy for same renew (default: true)"})]}),e("tr",{children:[e("td",{children:e("code",{children:"userOption.editable"})}),e("td",{children:e("code",{children:"boolean"})}),e("td",{children:"Allow modifications (default: true)"})]})]})]}),e("h4",{children:"Example"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';
import type { Watch } from 'state-ref';

interface AppState {
  count: number;
  user: { name: string };
}

// Watch type is inferred
const watch = createStore<AppState>({ count: 0, user: { name: 'John' } });

// Explicit type annotation
const typedWatch: Watch<AppState> = watch;

// Call without callback - just get reference
const ref = typedWatch();

// Call with callback - subscribe to changes
typedWatch((store, isFirst) => {
  console.log(store.count.value);
});`}),e("h3",{children:"Renew<G>"}),e("p",{children:"The callback function type for store subscriptions."}),e(t,{language:"typescript",code:`type Renew<G> = (
  store: G,
  isFirst: boolean
) => boolean | AbortSignal | void;`}),e("h4",{children:"Parameters"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Parameter"}),e("th",{children:"Type"}),e("th",{children:"Description"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"store"})}),e("td",{children:e("code",{children:"G"})}),e("td",{children:"The StateRefStore proxy"})]}),e("tr",{children:[e("td",{children:e("code",{children:"isFirst"})}),e("td",{children:e("code",{children:"boolean"})}),e("td",{children:"True on first invocation"})]})]})]}),e("h4",{children:"Return Values"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Return Type"}),e("th",{children:"Effect"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"void"})}),e("td",{children:"Continue subscription"})]}),e("tr",{children:[e("td",{children:e("code",{children:"false"})}),e("td",{children:"Unsubscribe immediately"})]}),e("tr",{children:[e("td",{children:e("code",{children:"AbortSignal"})}),e("td",{children:"Unsubscribe when signal aborts"})]})]})]}),e("h4",{children:"Example"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';
import type { Renew, StateRefStore } from 'state-ref';

interface Counter {
  value: number;
}

const watch = createStore<Counter>({ value: 0 });

// Explicit renew function type
const callback: Renew<StateRefStore<Counter>> = (store, isFirst) => {
  const value = store.value.value;
  if (isFirst) return;

  console.log('Value changed:', value);

  // Return false to unsubscribe
  if (value >= 10) {
    return false;
  }
};

watch(callback);`}),e("h3",{children:"ManualSyncStore<V>"}),e("p",{children:["The return type of ",e("code",{children:"createStoreManualSync"}),"."]}),e(t,{language:"typescript",code:`type ManualSyncStore<V> = {
  watch: Watch<V>;
  updateRef: StateRefStore<V>;
  sync: () => void;
};`}),e("h4",{children:"Properties"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Property"}),e("th",{children:"Type"}),e("th",{children:"Description"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"watch"})}),e("td",{children:e("code",{children:"Watch<V>"})}),e("td",{children:"Watch function for subscriptions"})]}),e("tr",{children:[e("td",{children:e("code",{children:"updateRef"})}),e("td",{children:e("code",{children:"StateRefStore<V>"})}),e("td",{children:"Reference for updating values"})]}),e("tr",{children:[e("td",{children:e("code",{children:"sync"})}),e("td",{children:e("code",{children:"() => void"})}),e("td",{children:"Function to trigger synchronization"})]})]})]}),e("h4",{children:"Example"}),e(t,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';
import type { ManualSyncStore } from 'state-ref';

interface State {
  items: string[];
}

const store: ManualSyncStore<State> = createStoreManualSync({ items: [] });

const { watch, updateRef, sync } = store;

// Subscribe
watch((ref, isFirst) => {
  const items = ref.items.value;
  if (isFirst) return;
  console.log('Items synced:', items);
});

// Update without notification
updateRef.items.value = ['a', 'b', 'c'];

// Manually sync
sync();`}),e("h2",{children:"Helper Types"}),e("h3",{children:"Copyable<T, Root>"}),e("p",{children:["The type returned by the ",e("code",{children:"copyable"})," function."]}),e(t,{language:"typescript",code:`type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(value: V) => Root;
};`}),e("h4",{children:"Example"}),e(t,{language:"typescript",code:`import { copyable } from 'state-ref';
import type { Copyable } from 'state-ref';

interface State {
  user: {
    name: string;
    age: number;
  };
}

const state: State = { user: { name: 'John', age: 30 } };

// Copyable wraps the type
const wrapped: Copyable<State> = copyable(state);

// Navigate and get writeCopy
const newState: State = wrapped.user.name.writeCopy('Jane');`}),e("h3",{children:"StateRefsTuple<W>"}),e("p",{children:["Utility type that converts an array of Watch types to an array of StateRefStore types. Used internally by ",e("code",{children:"createComputed"})," and"," ",e("code",{children:"combineWatch"}),"."]}),e(t,{language:"typescript",code:`type StateRefsTuple<W extends readonly Watch<any>[]> = {
  -readonly [K in keyof W]: W[K] extends Watch<infer T>
    ? StateRefStore<T>
    : never;
};`}),e("h4",{children:"Example"}),e(t,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';

const watch1 = createStore(10);      // Watch<number>
const watch2 = createStore('hello'); // Watch<string>

// In createComputed callback, refs is StateRefsTuple<[Watch<number>, Watch<string>]>
// Which equals [StateRefStore<number>, StateRefStore<string>]
const computed = createComputed(
  [watch1, watch2],
  ([numRef, strRef]) => {
    // numRef: StateRefStore<number>
    // strRef: StateRefStore<string>
    return \`\${strRef.value}: \${numRef.value}\`;
  }
);`}),e("h3",{children:"CombinedValue<W>"}),e("p",{children:["Utility type that extracts the value types from an array of Watch types. Used by ",e("code",{children:"combineWatch"})," return type."]}),e(t,{language:"typescript",code:`type CombinedValue<W extends readonly Watch<any>[]> = {
  [K in keyof W]: W[K] extends Watch<infer T> ? T : never;
};`}),e("h4",{children:"Example"}),e(t,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';

const numWatch = createStore(10);       // Watch<number>
const strWatch = createStore('hello');  // Watch<string>

// combineWatch returns Watch<CombinedValue<[Watch<number>, Watch<string>]>>
// Which equals Watch<[number, string]>
const combined = combineWatch([numWatch, strWatch]);

// The store type is StateRefStore<[number, string]>
const store = combined();`}),e("h2",{children:"Internal Types"}),e("p",{children:"These types are used internally and generally not needed for typical usage."}),e("h3",{children:"StoreType<V>"}),e(t,{language:"typescript",code:"type StoreType<V> = { root: V };"}),e("p",{children:"Internal wrapper that adds a root property to the store value."}),e("h3",{children:"Run"}),e(t,{language:"typescript",code:"type Run = null | ((isFirst?: boolean) => boolean | AbortSignal | void);"}),e("p",{children:"Internal type for subscriber functions."}),e("h3",{children:"RunInfo<A>"}),e(t,{language:"typescript",code:`type RunInfo<A> = {
  value: A;
  getNextValue: () => A;
  key: string;
  primitiveSetter?: (newValue: A) => void;
};`}),e("p",{children:"Internal type for tracking subscription information."}),e("h3",{children:"StoreRenderList<A>"}),e(t,{language:"typescript",code:`type RenderListSub<A> = Map<string, RunInfo<A>>;
type StoreRenderList<A> = Map<Run, RenderListSub<A>>;`}),e("p",{children:"Internal type for managing subscriber lists."}),e("h2",{children:"Type Summary"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Type"}),e("th",{children:"Purpose"}),e("th",{children:"Commonly Used"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"StateRefStore<S>"})}),e("td",{children:"Proxy store type"}),e("td",{children:"Yes"})]}),e("tr",{children:[e("td",{children:e("code",{children:"Watch<V>"})}),e("td",{children:"Watch function type"}),e("td",{children:"Yes"})]}),e("tr",{children:[e("td",{children:e("code",{children:"Renew<G>"})}),e("td",{children:"Subscription callback type"}),e("td",{children:"Yes"})]}),e("tr",{children:[e("td",{children:e("code",{children:"ManualSyncStore<V>"})}),e("td",{children:"Manual sync store type"}),e("td",{children:"Yes"})]}),e("tr",{children:[e("td",{children:e("code",{children:"Copyable<T>"})}),e("td",{children:"Copyable wrapper type"}),e("td",{children:"Sometimes"})]}),e("tr",{children:[e("td",{children:e("code",{children:"StateRefsTuple<W>"})}),e("td",{children:"Utility for computed"}),e("td",{children:"Rarely"})]}),e("tr",{children:[e("td",{children:e("code",{children:"CombinedValue<W>"})}),e("td",{children:"Utility for combine"}),e("td",{children:"Rarely"})]})]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/api/core",children:"Core API"})," - createStore, createComputed, combineWatch"]}),e("li",{children:[e("a",{href:"#/api/helpers",children:"Helper API"})," - lens, copyable, cloneDeep"]}),e("li",{children:[e("a",{href:"#/guide/subscription",children:"Subscription Guide"})," - Understanding Renew callbacks"]})]})]})),ji=u(()=>()=>e("div",{children:[e("h1",{children:"TypeScript 타입"}),e("p",{children:["이 페이지는 ",e("code",{children:"state-ref"}),"에서 내보내는 TypeScript 타입들을 문서화합니다. 이 타입들은 스토어 작업 시 완전한 타입 안전성을 제공합니다."]}),e("h2",{children:"타입 가져오기"}),e(t,{language:"typescript",code:`import type {
  StateRefStore,
  Watch,
  Renew,
  ManualSyncStore,
  Copyable
} from 'state-ref';`}),e("h2",{children:"핵심 타입"}),e("h3",{children:"StateRefStore<S>"}),e("p",{children:["watch 함수를 호출할 때 반환되는 프록시 타입입니다.",e("code",{children:".value"})," 프로퍼티를 통해 상태에 대한 반응형 접근을 제공합니다."]}),e(t,{language:"typescript",code:`type StateRefStore<S> = S extends object
  ? {
      [K in keyof S]: StateRefStore<S[K]>;
    } & {
      value: S;
    }
  : { value: S };`}),e("h4",{children:"동작"}),e("ul",{children:[e("li",{children:[e("strong",{children:"객체 타입"}),": 각 프로퍼티가 중첩된"," ",e("code",{children:"StateRefStore"}),"가 되고, 전체 객체를 위한"," ",e("code",{children:".value"})," 프로퍼티가 추가됨"]}),e("li",{children:[e("strong",{children:"원시 타입"}),": ",e("code",{children:".value"})," 프로퍼티만 있는 간단한 래퍼"]})]}),e("h4",{children:"예제"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';
import type { StateRefStore } from 'state-ref';

// 객체 타입의 경우
interface User {
  name: string;
  age: number;
}

const userWatch = createStore<User>({ name: 'John', age: 30 });
const userRef: StateRefStore<User> = userWatch();

// 타입 구조:
// userRef.name        → StateRefStore<string>
// userRef.name.value  → string
// userRef.age         → StateRefStore<number>
// userRef.age.value   → number
// userRef.value       → User

// 원시 타입의 경우
const countWatch = createStore<number>(0);
const countRef: StateRefStore<number> = countWatch();

// 타입 구조:
// countRef.value → number`}),e("h3",{children:"Watch<V>"}),e("p",{children:[e("code",{children:"createStore"}),"가 반환하는 함수 타입입니다. 스토어에 접근하거나 변경을 구독하는 데 사용됩니다."]}),e("p",{children:["콜백과 ",e("strong",{children:"함께"})," 부르면 구독하고 그 구독에 바인딩된 참조를 돌려줍니다. 콜백 ",e("strong",{children:"없이"})," 부르면 구독하지 않는 살아 있는 참조를 돌려줍니다 — 그 참조로 읽고 쓰는 값은 항상 최신이지만, 자기 알림 경로를 등록하지는 않습니다."," ",e("a",{href:"#/ko/guide/references",children:"참조 이해하기"}),"를 보세요."]}),e(t,{language:"typescript",code:`type Watch<V> = (
  renew?: Renew<StateRefStore<V>>,
  userOption?: { cache?: boolean; editable?: boolean }
) => StateRefStore<V>;`}),e("h4",{children:"매개변수"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"매개변수"}),e("th",{children:"타입"}),e("th",{children:"설명"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"renew"})}),e("td",{children:e("code",{children:"Renew<StateRefStore<V>>"})}),e("td",{children:"구독을 위한 선택적 콜백"})]}),e("tr",{children:[e("td",{children:e("code",{children:"userOption.cache"})}),e("td",{children:e("code",{children:"boolean"})}),e("td",{children:"동일한 renew에 대해 프록시 캐시 (기본값: true)"})]}),e("tr",{children:[e("td",{children:e("code",{children:"userOption.editable"})}),e("td",{children:e("code",{children:"boolean"})}),e("td",{children:"수정 허용 (기본값: true)"})]})]})]}),e("h4",{children:"예제"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';
import type { Watch } from 'state-ref';

interface AppState {
  count: number;
  user: { name: string };
}

// Watch 타입이 추론됨
const watch = createStore<AppState>({ count: 0, user: { name: 'John' } });

// 명시적 타입 어노테이션
const typedWatch: Watch<AppState> = watch;

// 콜백 없이 호출 - 참조만 가져오기
const ref = typedWatch();

// 콜백과 함께 호출 - 변경 구독
typedWatch((store, isFirst) => {
  console.log(store.count.value);
});`}),e("h3",{children:"Renew<G>"}),e("p",{children:"스토어 구독을 위한 콜백 함수 타입입니다."}),e(t,{language:"typescript",code:`type Renew<G> = (
  store: G,
  isFirst: boolean
) => boolean | AbortSignal | void;`}),e("h4",{children:"매개변수"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"매개변수"}),e("th",{children:"타입"}),e("th",{children:"설명"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"store"})}),e("td",{children:e("code",{children:"G"})}),e("td",{children:"StateRefStore 프록시"})]}),e("tr",{children:[e("td",{children:e("code",{children:"isFirst"})}),e("td",{children:e("code",{children:"boolean"})}),e("td",{children:"첫 번째 호출 시 true"})]})]})]}),e("h4",{children:"반환값"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"반환 타입"}),e("th",{children:"효과"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"void"})}),e("td",{children:"구독 계속"})]}),e("tr",{children:[e("td",{children:e("code",{children:"false"})}),e("td",{children:"즉시 구독 취소"})]}),e("tr",{children:[e("td",{children:e("code",{children:"AbortSignal"})}),e("td",{children:"시그널 abort 시 구독 취소"})]})]})]}),e("h4",{children:"예제"}),e(t,{language:"typescript",code:`import { createStore } from 'state-ref';
import type { Renew, StateRefStore } from 'state-ref';

interface Counter {
  value: number;
}

const watch = createStore<Counter>({ value: 0 });

// 명시적 renew 함수 타입
const callback: Renew<StateRefStore<Counter>> = (store, isFirst) => {
  const value = store.value.value;
  if (isFirst) return;

  console.log('값 변경됨:', value);

  // false 반환으로 구독 취소
  if (value >= 10) {
    return false;
  }
};

watch(callback);`}),e("h3",{children:"ManualSyncStore<V>"}),e("p",{children:[e("code",{children:"createStoreManualSync"}),"의 반환 타입입니다."]}),e(t,{language:"typescript",code:`type ManualSyncStore<V> = {
  watch: Watch<V>;
  updateRef: StateRefStore<V>;
  sync: () => void;
};`}),e("h4",{children:"프로퍼티"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"프로퍼티"}),e("th",{children:"타입"}),e("th",{children:"설명"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"watch"})}),e("td",{children:e("code",{children:"Watch<V>"})}),e("td",{children:"구독을 위한 watch 함수"})]}),e("tr",{children:[e("td",{children:e("code",{children:"updateRef"})}),e("td",{children:e("code",{children:"StateRefStore<V>"})}),e("td",{children:"값 업데이트를 위한 참조"})]}),e("tr",{children:[e("td",{children:e("code",{children:"sync"})}),e("td",{children:e("code",{children:"() => void"})}),e("td",{children:"동기화를 트리거하는 함수"})]})]})]}),e("h4",{children:"예제"}),e(t,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';
import type { ManualSyncStore } from 'state-ref';

interface State {
  items: string[];
}

const store: ManualSyncStore<State> = createStoreManualSync({ items: [] });

const { watch, updateRef, sync } = store;

// 구독
watch((ref, isFirst) => {
  const items = ref.items.value;
  if (isFirst) return;
  console.log('항목 동기화됨:', items);
});

// 알림 없이 업데이트
updateRef.items.value = ['a', 'b', 'c'];

// 수동 동기화
sync();`}),e("h2",{children:"헬퍼 타입"}),e("h3",{children:"Copyable<T, Root>"}),e("p",{children:[e("code",{children:"copyable"})," 함수가 반환하는 타입입니다."]}),e(t,{language:"typescript",code:`type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(value: V) => Root;
};`}),e("h4",{children:"예제"}),e(t,{language:"typescript",code:`import { copyable } from 'state-ref';
import type { Copyable } from 'state-ref';

interface State {
  user: {
    name: string;
    age: number;
  };
}

const state: State = { user: { name: 'John', age: 30 } };

// Copyable이 타입을 감쌈
const wrapped: Copyable<State> = copyable(state);

// 탐색하고 writeCopy 가져오기
const newState: State = wrapped.user.name.writeCopy('Jane');`}),e("h3",{children:"StateRefsTuple<W>"}),e("p",{children:["Watch 타입 배열을 StateRefStore 타입 배열로 변환하는 유틸리티 타입입니다.",e("code",{children:"createComputed"}),"와 ",e("code",{children:"combineWatch"}),"에서 내부적으로 사용됩니다."]}),e(t,{language:"typescript",code:`type StateRefsTuple<W extends readonly Watch<any>[]> = {
  -readonly [K in keyof W]: W[K] extends Watch<infer T>
    ? StateRefStore<T>
    : never;
};`}),e("h4",{children:"예제"}),e(t,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';

const watch1 = createStore(10);      // Watch<number>
const watch2 = createStore('hello'); // Watch<string>

// createComputed 콜백에서 refs는 StateRefsTuple<[Watch<number>, Watch<string>]>
// 이는 [StateRefStore<number>, StateRefStore<string>]와 같음
const computed = createComputed(
  [watch1, watch2],
  ([numRef, strRef]) => {
    // numRef: StateRefStore<number>
    // strRef: StateRefStore<string>
    return \`\${strRef.value}: \${numRef.value}\`;
  }
);`}),e("h3",{children:"CombinedValue<W>"}),e("p",{children:["Watch 타입 배열에서 값 타입을 추출하는 유틸리티 타입입니다.",e("code",{children:"combineWatch"})," 반환 타입에서 사용됩니다."]}),e(t,{language:"typescript",code:`type CombinedValue<W extends readonly Watch<any>[]> = {
  [K in keyof W]: W[K] extends Watch<infer T> ? T : never;
};`}),e("h4",{children:"예제"}),e(t,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';

const numWatch = createStore(10);       // Watch<number>
const strWatch = createStore('hello');  // Watch<string>

// combineWatch는 Watch<CombinedValue<[Watch<number>, Watch<string>]>> 반환
// 이는 Watch<[number, string]>와 같음
const combined = combineWatch([numWatch, strWatch]);

// 스토어 타입은 StateRefStore<[number, string]>
const store = combined();`}),e("h2",{children:"내부 타입"}),e("p",{children:"이 타입들은 내부적으로 사용되며 일반적인 사용에는 필요하지 않습니다."}),e("h3",{children:"StoreType<V>"}),e(t,{language:"typescript",code:"type StoreType<V> = { root: V };"}),e("p",{children:"스토어 값에 root 프로퍼티를 추가하는 내부 래퍼입니다."}),e("h3",{children:"Run"}),e(t,{language:"typescript",code:"type Run = null | ((isFirst?: boolean) => boolean | AbortSignal | void);"}),e("p",{children:"구독자 함수를 위한 내부 타입입니다."}),e("h3",{children:"RunInfo<A>"}),e(t,{language:"typescript",code:`type RunInfo<A> = {
  value: A;
  getNextValue: () => A;
  key: string;
  primitiveSetter?: (newValue: A) => void;
};`}),e("p",{children:"구독 정보를 추적하기 위한 내부 타입입니다."}),e("h3",{children:"StoreRenderList<A>"}),e(t,{language:"typescript",code:`type RenderListSub<A> = Map<string, RunInfo<A>>;
type StoreRenderList<A> = Map<Run, RenderListSub<A>>;`}),e("p",{children:"구독자 목록을 관리하기 위한 내부 타입입니다."}),e("h2",{children:"타입 요약"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"타입"}),e("th",{children:"목적"}),e("th",{children:"자주 사용"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"StateRefStore<S>"})}),e("td",{children:"프록시 스토어 타입"}),e("td",{children:"예"})]}),e("tr",{children:[e("td",{children:e("code",{children:"Watch<V>"})}),e("td",{children:"Watch 함수 타입"}),e("td",{children:"예"})]}),e("tr",{children:[e("td",{children:e("code",{children:"Renew<G>"})}),e("td",{children:"구독 콜백 타입"}),e("td",{children:"예"})]}),e("tr",{children:[e("td",{children:e("code",{children:"ManualSyncStore<V>"})}),e("td",{children:"수동 동기화 스토어 타입"}),e("td",{children:"예"})]}),e("tr",{children:[e("td",{children:e("code",{children:"Copyable<T>"})}),e("td",{children:"Copyable 래퍼 타입"}),e("td",{children:"가끔"})]}),e("tr",{children:[e("td",{children:e("code",{children:"StateRefsTuple<W>"})}),e("td",{children:"computed용 유틸리티"}),e("td",{children:"드물게"})]}),e("tr",{children:[e("td",{children:e("code",{children:"CombinedValue<W>"})}),e("td",{children:"combine용 유틸리티"}),e("td",{children:"드물게"})]})]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/api/core",children:"코어 API"})," - createStore, createComputed, combineWatch"]}),e("li",{children:[e("a",{href:"#/ko/api/helpers",children:"헬퍼 API"})," - lens, copyable, cloneDeep"]}),e("li",{children:[e("a",{href:"#/ko/guide/subscription",children:"구독 가이드"})," - Renew 콜백 이해하기"]})]})]})),Bi=()=>e("div",{class:"prose prose-lg dark:prose-invert max-w-none",children:[e("h1",{class:"text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white mb-6",children:"AI Agent Skills"}),e("p",{class:"text-lg text-gray-600 dark:text-gray-400 mb-8",children:"Help AI coding assistants write state-ref-style reactive code automatically"}),e("div",{class:"bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 mb-8",children:[e("h3",{class:"text-lg font-medium text-purple-900 dark:text-purple-200 mb-2",children:"Experimental by Design"}),e("p",{class:"text-sm text-purple-800 dark:text-purple-300",children:"This specification explores how state-ref can be applied as a first-class behavioral constraint for AI coding agents."})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"What is AI Agent Skills?"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"state-ref includes an AI agent skills package that helps AI coding assistants (Claude Code, GitHub Copilot, Cursor, etc.) automatically write state-ref-style reactive code."}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"When you have this skills package in your project, AI assistants will:"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:["Use ",e("code",{class:"text-sm",children:"createStore"})," for reactive state management"]}),e("li",{children:["Access values via ",e("code",{class:"text-sm",children:".value"})," property correctly"]}),e("li",{children:["Use ",e("code",{class:"text-sm",children:"watch(callback)"})," for subscriptions with proper dependency tracking"]}),e("li",{children:["Handle ",e("code",{class:"text-sm",children:"AbortController"})," for cleanup"]}),e("li",{children:["Use framework connectors (",e("code",{class:"text-sm",children:"connectReact"}),","," ",e("code",{class:"text-sm",children:"connectVue"}),", etc.) appropriately"]}),e("li",{children:["Apply ",e("code",{class:"text-sm",children:"createStoreManualSync"})," for Flux-like patterns"]}),e("li",{children:["Write only through the connector (",e("code",{class:"text-sm",children:".value"})," of a selection or the setter), never by mutating a selected object"]}),e("li",{children:["Use ",e("code",{class:"text-sm",children:"createDraft"})," for edit-then-commit UIs and ",e("code",{class:"text-sm",children:"batch"})," for grouped writes"]}),e("li",{children:["With ",e("code",{class:"text-sm",children:"@stateref/sync"})," installed, load queries and save with ",e("code",{class:"text-sm",children:"capture()"})," and"," ",e("code",{class:"text-sm",children:"mutation.run"})," correctly"]})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Setup for Claude Code"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["Copy the skills folder to your project's"," ",e("code",{class:"text-sm",children:".claude/skills/"})," directory:"]}),e(t,{language:"bash",code:`# Unix/macOS/Linux
mkdir -p .claude/skills/state-ref
cp -R node_modules/state-ref/dist/skills/state-ref/* .claude/skills/state-ref/

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path .claude/skills/state-ref
Copy-Item node_modules/state-ref/dist/skills/state-ref/* .claude/skills/state-ref -Recurse

# Or manually create the directory and copy
mkdir -p .claude/skills/state-ref
cp -R node_modules/state-ref/dist/skills/state-ref/* .claude/skills/state-ref/`}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["If your tool expects a single file, point it to"," ",e("code",{class:"text-sm",children:".claude/skills/state-ref/SKILL.md"})," or link that file to ",e("code",{class:"text-sm",children:".claude/skills/state-ref.md"}),"."]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Setup for Codex"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["Copy the Codex skill to your project's"," ",e("code",{class:"text-sm",children:"$CODEX_HOME/skills/"})," directory (default:"," ",e("code",{class:"text-sm",children:"~/.codex/skills"}),"):"]}),e(t,{language:"bash",code:`# Unix/macOS/Linux
mkdir -p ~/.codex/skills/state-ref
cp -R node_modules/state-ref/dist/skills/state-ref/* ~/.codex/skills/state-ref/

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$HOME/.codex/skills/state-ref"
Copy-Item node_modules/state-ref/dist/skills/state-ref/* $HOME/.codex/skills/state-ref -Recurse`}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Recommended: Add CLAUDE.md to Your Project"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["For better reliability, create a ",e("code",{class:"text-sm",children:"CLAUDE.md"})," ","file in your project root. This ensures AI agents read the state-ref skills package before writing code."]}),e(t,{language:"bash",code:`# Project Instructions for AI Agents

## CRITICAL: state-ref Requirements

**Before writing ANY code, you MUST:**

1. Read \`.claude/skills/state-ref/SKILL.md\` **completely**
2. Follow the common-mistakes section **strictly**
3. Use the patterns shown in examples

**Non-negotiable rules:**
- Always access values via \`.value\` property
- Track dependencies inside subscription callbacks only
- Use \`AbortController.signal\` for cleanup
- In manual-sync mode, use \`updateRef\` and call \`sync()\`

**This is not optional - violating these patterns will break the codebase.**`}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6 mt-6",children:["Place this file as ",e("code",{class:"text-sm",children:"CLAUDE.md"})," in your project root. Claude Code will automatically read this file at the start of every conversation."]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"How It Works"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"Once configured, AI assistants will automatically apply state-ref coding patterns when helping you write code."}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8",children:"Example: Before Skills File"}),e(t,{language:"typescript",code:`// AI might suggest manual state management
let count = 0;
const listeners: (() => void)[] = [];

function subscribe(callback: () => void) {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) listeners.splice(index, 1);
  };
}

function setCount(value: number) {
  count = value;
  listeners.forEach(fn => fn());
}`}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8",children:"Example: After Skills File"}),e(t,{language:"typescript",code:`// AI suggests state-ref reactive style
import { createStore } from 'state-ref';

const watch = createStore({ count: 0 });

// Subscribe to changes
watch((ref, isFirst) => {
  console.log('Count:', ref.count.value);
});

// Update state
const ref = watch();
ref.count.value = 10;`}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Skills File Location"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["The skills package is located at"," ",e("code",{class:"text-sm",children:"node_modules/state-ref/dist/skills/state-ref/"})," ","after installation (includes ",e("code",{class:"text-sm",children:"SKILL.md"}),","," ",e("code",{class:"text-sm",children:"examples/"}),","," ",e("code",{class:"text-sm",children:"reference/"}),", and"," ",e("code",{class:"text-sm",children:"constraints/"}),")."]}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["You can also view it in the"," ",e("a",{href:"https://github.com/superlucky84/state-ref/blob/main/skills/state-ref/SKILL.md",target:"_blank",rel:"noopener noreferrer",class:"text-blue-600 dark:text-blue-400 hover:underline",children:"GitHub repository"}),"."]}),e("div",{class:"bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mt-6",children:e("p",{class:"text-sm md:text-base text-blue-900 dark:text-blue-200 leading-relaxed",children:[e("span",{class:"font-medium",children:"Tip:"}),' After setting up the skills package, you can ask your AI assistant questions like "refactor this to use state-ref" or "add reactive state management", and it will automatically apply the patterns.']})})]}),Ki=()=>e("div",{class:"prose prose-lg dark:prose-invert max-w-none",children:[e("h1",{class:"text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white mb-6",children:"AI Agent Skills"}),e("p",{class:"text-lg text-gray-600 dark:text-gray-400 mb-8",children:"AI 코딩 어시스턴트가 state-ref 스타일의 반응형 코드를 자동으로 작성하도록 도와줍니다"}),e("div",{class:"bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 mb-8",children:[e("h3",{class:"text-lg font-medium text-purple-900 dark:text-purple-200 mb-2",children:"실험적 기능"}),e("p",{class:"text-sm text-purple-800 dark:text-purple-300",children:"이 스펙은 state-ref가 AI 코딩 에이전트의 일급 행동 제약으로 어떻게 적용될 수 있는지 탐구합니다."})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"AI Agent Skills란?"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"state-ref에는 AI 코딩 어시스턴트(Claude Code, GitHub Copilot, Cursor 등)가 자동으로 state-ref 스타일의 반응형 코드를 작성하도록 돕는 AI 에이전트 스킬 패키지가 포함되어 있습니다."}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"프로젝트에 이 스킬 패키지가 있으면, AI 어시스턴트는 다음을 수행합니다:"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:["반응형 상태 관리를 위해 ",e("code",{class:"text-sm",children:"createStore"})," 사용"]}),e("li",{children:[e("code",{class:"text-sm",children:".value"})," 속성을 통해 값에 올바르게 접근"]}),e("li",{children:["적절한 의존성 추적과 함께 ",e("code",{class:"text-sm",children:"watch(callback)"}),"을 사용한 구독"]}),e("li",{children:["정리를 위한 ",e("code",{class:"text-sm",children:"AbortController"})," 처리"]}),e("li",{children:["프레임워크 커넥터(",e("code",{class:"text-sm",children:"connectReact"}),","," ",e("code",{class:"text-sm",children:"connectVue"})," 등)를 적절히 사용"]}),e("li",{children:["Flux 패턴을 위한 ",e("code",{class:"text-sm",children:"createStoreManualSync"})," 적용"]}),e("li",{children:["커넥터를 거쳐서만 쓰기(선택값의 ",e("code",{class:"text-sm",children:".value"}),"나 setter). 선택한 객체를 직접 바꾸지 않기"]}),e("li",{children:["편집 후 확정하는 화면에는 ",e("code",{class:"text-sm",children:"createDraft"}),", 여러 쓰기를 묶을 때는 ",e("code",{class:"text-sm",children:"batch"})," 사용"]}),e("li",{children:[e("code",{class:"text-sm",children:"@stateref/sync"}),"가 설치돼 있으면 조회를 불러오고 ",e("code",{class:"text-sm",children:"capture()"}),"와"," ",e("code",{class:"text-sm",children:"mutation.run"}),"으로 올바르게 저장"]})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Claude Code 설정"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["skills 폴더를 프로젝트의 ",e("code",{class:"text-sm",children:".claude/skills/"})," ","디렉토리에 복사하세요:"]}),e(t,{language:"bash",code:`# Unix/macOS/Linux
mkdir -p .claude/skills/state-ref
cp -R node_modules/state-ref/dist/skills/state-ref/* .claude/skills/state-ref/

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path .claude/skills/state-ref
Copy-Item node_modules/state-ref/dist/skills/state-ref/* .claude/skills/state-ref -Recurse

# 또는 수동으로 디렉토리를 만들고 복사
mkdir -p .claude/skills/state-ref
cp -R node_modules/state-ref/dist/skills/state-ref/* .claude/skills/state-ref/`}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["도구가 단일 파일을 기대하는 경우,"," ",e("code",{class:"text-sm",children:".claude/skills/state-ref/SKILL.md"}),"를 가리키거나 해당 파일을"," ",e("code",{class:"text-sm",children:".claude/skills/state-ref.md"}),"로 링크하세요."]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Codex 설정"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["Codex 스킬을 프로젝트의 ",e("code",{class:"text-sm",children:"$CODEX_HOME/skills/"})," ","디렉토리(기본값: ",e("code",{class:"text-sm",children:"~/.codex/skills"}),")에 복사하세요:"]}),e(t,{language:"bash",code:`# Unix/macOS/Linux
mkdir -p ~/.codex/skills/state-ref
cp -R node_modules/state-ref/dist/skills/state-ref/* ~/.codex/skills/state-ref/

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$HOME/.codex/skills/state-ref"
Copy-Item node_modules/state-ref/dist/skills/state-ref/* $HOME/.codex/skills/state-ref -Recurse`}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"권장: 프로젝트에 CLAUDE.md 추가"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["더 나은 신뢰성을 위해 프로젝트 루트에"," ",e("code",{class:"text-sm",children:"CLAUDE.md"})," 파일을 생성하세요. 이렇게 하면 AI 에이전트가 코드를 작성하기 전에 state-ref 스킬 패키지를 읽게 됩니다."]}),e(t,{language:"bash",code:`# AI 에이전트를 위한 프로젝트 지침

## 중요: state-ref 요구사항

**코드를 작성하기 전에 반드시:**

1. \`.claude/skills/state-ref/SKILL.md\`를 **완전히** 읽으세요
2. common-mistakes 섹션을 **엄격히** 따르세요
3. 예제에 표시된 패턴을 사용하세요

**협상 불가 규칙:**
- 항상 \`.value\` 속성을 통해 값에 접근
- 구독 콜백 내부에서만 의존성 추적
- 정리를 위해 \`AbortController.signal\` 사용
- manual-sync 모드에서는 \`updateRef\`를 사용하고 \`sync()\` 호출

**이것은 선택사항이 아닙니다 - 이 패턴을 위반하면 코드베이스가 손상됩니다.**`}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6 mt-6",children:["이 파일을 프로젝트 루트에 ",e("code",{class:"text-sm",children:"CLAUDE.md"}),"로 배치하세요. Claude Code는 모든 대화 시작 시 자동으로 이 파일을 읽습니다."]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"작동 방식"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"설정이 완료되면, AI 어시스턴트는 코드 작성을 도울 때 자동으로 state-ref 코딩 패턴을 적용합니다."}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8",children:"예제: Skills 파일 적용 전"}),e(t,{language:"typescript",code:`// AI가 수동 상태 관리를 제안할 수 있음
let count = 0;
const listeners: (() => void)[] = [];

function subscribe(callback: () => void) {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) listeners.splice(index, 1);
  };
}

function setCount(value: number) {
  count = value;
  listeners.forEach(fn => fn());
}`}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8",children:"예제: Skills 파일 적용 후"}),e(t,{language:"typescript",code:`// AI가 state-ref 반응형 스타일을 제안
import { createStore } from 'state-ref';

const watch = createStore({ count: 0 });

// 변경 사항 구독
watch((ref, isFirst) => {
  console.log('Count:', ref.count.value);
});

// 상태 업데이트
const ref = watch();
ref.count.value = 10;`}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Skills 파일 위치"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["스킬 패키지는 설치 후"," ",e("code",{class:"text-sm",children:"node_modules/state-ref/dist/skills/state-ref/"}),"에 위치합니다 (",e("code",{class:"text-sm",children:"SKILL.md"}),","," ",e("code",{class:"text-sm",children:"examples/"}),","," ",e("code",{class:"text-sm",children:"reference/"}),","," ",e("code",{class:"text-sm",children:"constraints/"})," 포함)."]}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:[" ",e("a",{href:"https://github.com/superlucky84/state-ref/blob/main/skills/state-ref/SKILL.md",target:"_blank",rel:"noopener noreferrer",class:"text-blue-600 dark:text-blue-400 hover:underline",children:"GitHub 저장소"}),"에서도 확인할 수 있습니다."]}),e("div",{class:"bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mt-6",children:e("p",{class:"text-sm md:text-base text-blue-900 dark:text-blue-200 leading-relaxed",children:[e("span",{class:"font-medium",children:"팁:"}),' 스킬 패키지를 설정한 후, AI 어시스턴트에게 "state-ref를 사용하여 리팩토링해줘" 또는 "반응형 상태 관리를 추가해줘"와 같은 질문을 하면 자동으로 패턴이 적용됩니다.']})})]}),$i="You are a coding agent with state-ref reactive state management guidance enabled.\n\nACTIVATION CONDITIONS:\n\nThese guidelines apply ONLY when state-ref is installed in the current project.\n\nBefore suggesting state-ref patterns, verify state-ref availability:\n1. Check if `package.json` contains state-ref in dependencies or devDependencies\n2. Check if `node_modules/state-ref` directory exists\n3. Check if state-ref imports are present in existing code\n\nIf state-ref is NOT installed:\n- Do not enforce these guidelines\n- Use standard state management practices appropriate for the project\n- Never suggest installing state-ref unless explicitly requested\n\nIf state-ref IS installed:\n- Apply all guidelines below\n- Suggest state-ref alternatives for complex state management\n- Prioritize fine-grained reactivity patterns for clarity and performance\n\nCODING GUIDELINES:\n\n1. STORE CREATION\n   - Use `createStore<T>(initialValue)` for auto-sync mode (default)\n   - Use `createStoreManualSync<T>(initialValue)` for Flux-like patterns\n   - Always specify generic type for complex objects\n   - Primitive types (number, string) work directly\n\n2. VALUE ACCESS\n   - Always access values via `.value` property\n   - `stateRef.user.name` returns proxy, not the actual value\n   - `stateRef.user.name.value` returns the actual value\n   - Assignments must also use `.value`: `ref.count.value = 10`\n\n3. SUBSCRIPTION PATTERNS\n   - Use `watch(callback)` to subscribe to changes\n   - Callback signature: `(stateRef, isFirst) => AbortSignal | void`\n   - `isFirst` is true on initial run, false on subsequent updates\n   - Only `.value` reads inside callback are tracked as dependencies\n   - Return `AbortController.signal` for cleanup/unsubscription\n\n4. DEPENDENCY TRACKING\n   - Use the callback's ref parameter (innerRef), not external refs\n   - External refs created by `watch()` without callback are NOT tracked\n   - Both innerRef (callback arg) and outerRef (return value) are same reference\n   - Changes to non-tracked properties don't trigger re-runs\n\n5. MANUAL SYNC MODE (FLUX-LIKE)\n   - Destructure: `const { watch, updateRef, sync } = createStoreManualSync(...)`\n   - `watch` refs are read-only in this mode\n   - Modify state only via `updateRef`\n   - Call `sync()` to notify all subscribers\n   - Create action functions that encapsulate updateRef + sync\n\n6. FRAMEWORK INTEGRATION\n   - React: `const useStore = connectReact(watch)`; `useStore()` returns the ref\n   - Preact: `const useStore = connectPreact(watch)`; same shape as React\n   - Vue: `connectVue(watch)(s => s.user.age)` returns a reactive `{ value }`\n   - Svelte: `connectSvelte(watch)(s => s.user.age)` returns a Writable (`$age`)\n   - Svelte 5 runes: `connectSvelteRunes(watch)(select)` from\n     `@stateref/connect-svelte/runes` returns `{ value }`\n   - Solid: `connectSolid(watch)(s => s.user.age)` returns `[get, set]`\n   - Lithent: Use `watch(renew)` directly\n   - WRITE RULE: only a write that passes through the connector reaches the\n     store. Assign `.value` of a selection (Solid: call the setter) or replace\n     the whole object. Never mutate an object read from a selection: Vue makes\n     it readonly, Solid and Svelte runes hand out frozen copies. Svelte's\n     `$user.name = x` is fine (it compiles to `set`).\n   - React/Preact render a component twice on mount (the second render\n     collects dependencies); do not \"fix\" this\n   - For a `@stateref/sync` query's display use `connectReactView`,\n     `connectPreactView`, `connectVueView`, `connectSvelteView`,\n     `connectSolidView` with `query.watchDisplay` (readonly)\n\n7. COMBINING STORES\n   - Use `combineWatch([watch1, watch2] as const)` for multiple stores\n   - Use `as const` for proper TypeScript inference\n   - Nested combinations are supported\n\n8. COMPUTED VALUES\n   - Use `createComputed([watches], callback)` for derived values\n   - Computed values are read-only\n   - Can be used with framework connectors like regular watches\n\n9. IMMUTABILITY\n   - state-ref uses copy-on-write internally\n   - Avoid direct mutation; always assign via `.value`\n   - Use `copyable()` helper for manual copy-on-write when needed\n   - Use `lens()` for functional lens-style immutable updates\n\n10. PRACTICAL BALANCE\n    - Use state-ref for shared state across components\n    - Simple local state can use native framework state (useState, ref, etc.)\n    - Don't overcomplicate simple scenarios\n\n11. LOCAL EDITS AND BATCHING (state-ref 3.1)\n    - Edit-then-commit UI (form, dialog): `createDraft(ref)` from\n      `state-ref/draft`; edit `draft.ref`, then `apply()`, `reset()` or\n      `discard()`\n    - `apply()` does not throw on conflict: check `result.ok` / `result.reason`\n      and settle conflicts with `draft.resolve(change, 'source' | 'draft')`\n    - `apply()` only updates the local store; it never contacts a server\n    - Several synchronous writes, one notification pass: `batch(() => {...})`\n      from `state-ref/batch` (no rollback, cannot span `await`)\n\n12. SERVER DATA (only when `@stateref/sync` is installed)\n    - One `createSyncClient()` per app; one per request for SSR\n    - `client.query({ queryKey, queryFn })`, then `await query.load()`; `ref`\n      throws before the first load\n    - Edits to `query.ref` are local and never save by themselves\n    - Save: `const submission = query.capture()` immediately before\n      `mutation.run(dto, { links: [{ query, submission, accept: { kind: 'refetch' } }] })`\n    - `accept` in `run()` is an object (`{ kind: 'none' | 'submitted' |\n      'refetch' }` or `{ kind: 'response', select }`), never a string\n    - Only `MutationRejectedError` yields `rejected`; other errors yield\n      `unknown`, which keeps edits and must not be blindly resent\n    - `retry` requires an `idempotencyKey` the server honours\n    - \"Saving\" is `status.pending.value > 0`, not `phase === 'pending'`\n    - Details: node_modules/state-ref/dist/skills/state-ref/reference/server-sync.md\n\nIMPORT PATHS:\n- Core: `import { createStore, createStoreManualSync, combineWatch, createComputed } from 'state-ref'`\n- Helpers: `import { lens, copyable, cloneDeep } from 'state-ref'`\n- Drafts: `import { createDraft } from 'state-ref/draft'`\n- Batch: `import { batch } from 'state-ref/batch'`\n- React: `import { connectReact, connectReactView } from '@stateref/connect-react'`\n- Preact: `import { connectPreact, connectPreactView } from '@stateref/connect-preact'`\n- Vue: `import { connectVue, connectVueView } from '@stateref/connect-vue'`\n- Svelte: `import { connectSvelte, connectSvelteView } from '@stateref/connect-svelte'`\n- Svelte 5 runes: `import { connectSvelteRunes } from '@stateref/connect-svelte/runes'`\n- Solid: `import { connectSolid, connectSolidView } from '@stateref/connect-solid'`\n- Server sync: `import { createSyncClient, MutationRejectedError } from '@stateref/sync'`\n\nGUIDANCE APPROACH:\nWhen user requests could benefit from state-ref patterns:\n1. Provide solution using state-ref patterns\n2. Explain advantages of the reactive approach\n3. If user prefers other state management, respect their choice\n\nWhen existing code could be improved with state-ref:\n1. Suggest state-ref refactoring when it adds clarity or performance\n2. Explain the benefits of fine-grained reactivity\n3. Don't force refactoring for trivial improvements\n\nREFERENCE MATERIALS (NOT PART OF BEHAVIORAL RULES):\n\nFor detailed guidance on state-ref patterns and usage, refer to:\nnode_modules/state-ref/dist/skills/state-ref/\n\nThis reference material provides comprehensive examples, troubleshooting tips,\nand pattern guidance that complements the behavioral guidelines above.",Ji=()=>e("div",{class:"prose prose-lg dark:prose-invert max-w-none",children:[e("h1",{class:"text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white mb-6",children:"AI Agent Role Add-on"}),e("p",{class:"text-lg text-gray-600 dark:text-gray-400 mb-8",children:"A reusable behavior module that conditionally guides state-ref patterns in AI coding agents"}),e("div",{class:"bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 mb-8",children:[e("h3",{class:"text-lg font-medium text-purple-900 dark:text-purple-200 mb-2",children:"Experimental by Design"}),e("p",{class:"text-sm text-purple-800 dark:text-purple-300",children:"This specification explores how state-ref can be applied as a first-class behavioral constraint for AI coding agents."})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"What is Agent Role Add-on?"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"The state-ref Agent Role Add-on is a copy-paste ready behavior extension for AI coding agents (OpenCode, custom agents, IDE extensions, etc.). Unlike skills packages that are project-specific, this add-on is attached directly to your agent's system prompt, making it work across all your projects."}),e("div",{class:"bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-6",children:e("p",{class:"text-sm md:text-base text-blue-900 dark:text-blue-200 leading-relaxed",children:[e("span",{class:"font-medium",children:"Key Difference:"})," Skills files are per-project configurations. Agent add-ons are global agent behaviors that activate conditionally based on project context."]})}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8",children:"Key Features"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:[e("strong",{children:"Conditional Activation:"})," Only suggests state-ref patterns when state-ref is detected in the project"]}),e("li",{children:[e("strong",{children:"Auto-Detection:"})," Checks"," ",e("code",{class:"text-sm",children:"package.json"}),","," ",e("code",{class:"text-sm",children:"node_modules"}),", and existing imports"]}),e("li",{children:[e("strong",{children:"Respects Non-state-ref Projects:"})," Uses standard coding practices when state-ref isn't installed"]}),e("li",{children:[e("strong",{children:"Single Configuration:"})," Works across multiple projects with different technology stacks"]}),e("li",{children:[e("strong",{children:"Copy-Paste Ready:"})," No complex setup, just paste into your agent's system prompt"]})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"When to Use This Add-on"}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"Use When:"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:"You work across multiple projects, some using state-ref and others not"}),e("li",{children:"You want automatic pattern guidance when state-ref is detected"}),e("li",{children:"Your team adopts state-ref selectively per project"}),e("li",{children:"You need a single agent configuration that adapts to project context"})]}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"Don't Use When:"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:"You exclusively work on projects that never use state-ref"}),e("li",{children:"You prefer manual control over when to apply reactive patterns"}),e("li",{children:"Your agent configuration is project-specific rather than global"})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"How to Attach This Add-on"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"Copy the behavioral constraints block below and paste it into your AI agent's system prompt or configuration."}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"Copy This Block"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4",children:"Copy the entire add-on configuration below:"}),e(t,{language:"bash",code:$i}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Integration Examples"}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"OpenCode (.opencode/config.yaml)"}),e(t,{language:"bash",code:`agent:
  role: "Your Agent Role"
  extensions:
    - type: "state-ref-addon"
      content: |
        [Paste the state-ref constraints block here]`}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"Custom Agent System Prompt"}),e(t,{language:"bash",code:`<your-existing-agent-role>
  <identity>
    You are a [your agent description]...
  </identity>

  <capabilities>
    [your agent capabilities]...
  </capabilities>

  <!-- INSERT state-ref BEHAVIORAL CONSTRAINTS HERE -->
  <coding-constraints>
    [Paste the state-ref constraints block here]
  </coding-constraints>

  <workflow>
    [your agent workflow]...
  </workflow>
</your-existing-agent-role>`}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"How It Works"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"The add-on uses conditional logic to adapt its behavior based on the project context:"}),e("div",{class:"space-y-6 mb-6",children:[e("div",{class:"bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800",children:[e("h4",{class:"text-lg font-medium text-green-900 dark:text-green-200 mb-2",children:"When state-ref is installed"}),e("p",{class:"text-sm text-green-800 dark:text-green-300",children:"The agent suggests state-ref patterns, explains benefits of reactive approaches, and respects user preferences while prioritizing fine-grained reactivity for clarity."})]}),e("div",{class:"bg-gray-50 dark:bg-gray-800/20 p-6 rounded-lg border border-gray-200 dark:border-gray-700",children:[e("h4",{class:"text-lg font-medium text-gray-900 dark:text-gray-200 mb-2",children:"When state-ref is NOT installed"}),e("p",{class:"text-sm text-gray-700 dark:text-gray-400",children:"The agent uses standard coding practices appropriate for the project, never mentions state-ref, and respects existing conventions."})]})]}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8",children:"Detection Mechanism"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4",children:"The agent verifies state-ref availability through:"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:[e("code",{class:"text-sm",children:"package.json"})," dependency declarations (most reliable)"]}),e("li",{children:[e("code",{class:"text-sm",children:"node_modules"})," directory presence (installation confirmation)"]}),e("li",{children:"Existing import statements (usage confirmation)"})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Full Documentation"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["The complete add-on documentation is available at"," ",e("code",{class:"text-sm",children:"node_modules/state-ref/dist/ai-addons/state-ref-agent-addon.md"})," ","after installation."]}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["You can also view it in the"," ",e("a",{href:"https://github.com/superlucky84/state-ref/blob/main/state-ref-agent-addon.md",target:"_blank",rel:"noopener noreferrer",class:"text-blue-600 dark:text-blue-400 hover:underline",children:"GitHub repository"}),"."]}),e("div",{class:"bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 mt-6",children:e("p",{class:"text-sm md:text-base text-yellow-900 dark:text-yellow-200 leading-relaxed",children:[e("span",{class:"font-medium",children:"Important:"})," This add-on is designed for agents with system prompt support. For project-specific AI assistance (like Claude Code's skills), use the"," ",e("a",{href:"#/ai-agent-skills",class:"text-yellow-700 dark:text-yellow-300 hover:underline",children:"AI Agent Skills"})," ","file instead."]})})]}),zi="You are a coding agent with state-ref reactive state management guidance enabled.\n\nACTIVATION CONDITIONS:\n\nThese guidelines apply ONLY when state-ref is installed in the current project.\n\nBefore suggesting state-ref patterns, verify state-ref availability:\n1. Check if `package.json` contains state-ref in dependencies or devDependencies\n2. Check if `node_modules/state-ref` directory exists\n3. Check if state-ref imports are present in existing code\n\nIf state-ref is NOT installed:\n- Do not enforce these guidelines\n- Use standard state management practices appropriate for the project\n- Never suggest installing state-ref unless explicitly requested\n\nIf state-ref IS installed:\n- Apply all guidelines below\n- Suggest state-ref alternatives for complex state management\n- Prioritize fine-grained reactivity patterns for clarity and performance\n\nCODING GUIDELINES:\n\n1. STORE CREATION\n   - Use `createStore<T>(initialValue)` for auto-sync mode (default)\n   - Use `createStoreManualSync<T>(initialValue)` for Flux-like patterns\n   - Always specify generic type for complex objects\n   - Primitive types (number, string) work directly\n\n2. VALUE ACCESS\n   - Always access values via `.value` property\n   - `stateRef.user.name` returns proxy, not the actual value\n   - `stateRef.user.name.value` returns the actual value\n   - Assignments must also use `.value`: `ref.count.value = 10`\n\n3. SUBSCRIPTION PATTERNS\n   - Use `watch(callback)` to subscribe to changes\n   - Callback signature: `(stateRef, isFirst) => AbortSignal | void`\n   - `isFirst` is true on initial run, false on subsequent updates\n   - Only `.value` reads inside callback are tracked as dependencies\n   - Return `AbortController.signal` for cleanup/unsubscription\n\n4. DEPENDENCY TRACKING\n   - Use the callback's ref parameter (innerRef), not external refs\n   - External refs created by `watch()` without callback are NOT tracked\n   - Both innerRef (callback arg) and outerRef (return value) are same reference\n   - Changes to non-tracked properties don't trigger re-runs\n\n5. MANUAL SYNC MODE (FLUX-LIKE)\n   - Destructure: `const { watch, updateRef, sync } = createStoreManualSync(...)`\n   - `watch` refs are read-only in this mode\n   - Modify state only via `updateRef`\n   - Call `sync()` to notify all subscribers\n   - Create action functions that encapsulate updateRef + sync\n\n6. FRAMEWORK INTEGRATION\n   - React: `const useStore = connectReact(watch)`; `useStore()` returns the ref\n   - Preact: `const useStore = connectPreact(watch)`; same shape as React\n   - Vue: `connectVue(watch)(s => s.user.age)` returns a reactive `{ value }`\n   - Svelte: `connectSvelte(watch)(s => s.user.age)` returns a Writable (`$age`)\n   - Svelte 5 runes: `connectSvelteRunes(watch)(select)` from\n     `@stateref/connect-svelte/runes` returns `{ value }`\n   - Solid: `connectSolid(watch)(s => s.user.age)` returns `[get, set]`\n   - Lithent: Use `watch(renew)` directly\n   - WRITE RULE: only a write that passes through the connector reaches the\n     store. Assign `.value` of a selection (Solid: call the setter) or replace\n     the whole object. Never mutate an object read from a selection: Vue makes\n     it readonly, Solid and Svelte runes hand out frozen copies. Svelte's\n     `$user.name = x` is fine (it compiles to `set`).\n   - React/Preact render a component twice on mount (the second render\n     collects dependencies); do not \"fix\" this\n   - For a `@stateref/sync` query's display use `connectReactView`,\n     `connectPreactView`, `connectVueView`, `connectSvelteView`,\n     `connectSolidView` with `query.watchDisplay` (readonly)\n\n7. COMBINING STORES\n   - Use `combineWatch([watch1, watch2] as const)` for multiple stores\n   - Use `as const` for proper TypeScript inference\n   - Nested combinations are supported\n\n8. COMPUTED VALUES\n   - Use `createComputed([watches], callback)` for derived values\n   - Computed values are read-only\n   - Can be used with framework connectors like regular watches\n\n9. IMMUTABILITY\n   - state-ref uses copy-on-write internally\n   - Avoid direct mutation; always assign via `.value`\n   - Use `copyable()` helper for manual copy-on-write when needed\n   - Use `lens()` for functional lens-style immutable updates\n\n10. PRACTICAL BALANCE\n    - Use state-ref for shared state across components\n    - Simple local state can use native framework state (useState, ref, etc.)\n    - Don't overcomplicate simple scenarios\n\n11. LOCAL EDITS AND BATCHING (state-ref 3.1)\n    - Edit-then-commit UI (form, dialog): `createDraft(ref)` from\n      `state-ref/draft`; edit `draft.ref`, then `apply()`, `reset()` or\n      `discard()`\n    - `apply()` does not throw on conflict: check `result.ok` / `result.reason`\n      and settle conflicts with `draft.resolve(change, 'source' | 'draft')`\n    - `apply()` only updates the local store; it never contacts a server\n    - Several synchronous writes, one notification pass: `batch(() => {...})`\n      from `state-ref/batch` (no rollback, cannot span `await`)\n\n12. SERVER DATA (only when `@stateref/sync` is installed)\n    - One `createSyncClient()` per app; one per request for SSR\n    - `client.query({ queryKey, queryFn })`, then `await query.load()`; `ref`\n      throws before the first load\n    - Edits to `query.ref` are local and never save by themselves\n    - Save: `const submission = query.capture()` immediately before\n      `mutation.run(dto, { links: [{ query, submission, accept: { kind: 'refetch' } }] })`\n    - `accept` in `run()` is an object (`{ kind: 'none' | 'submitted' |\n      'refetch' }` or `{ kind: 'response', select }`), never a string\n    - Only `MutationRejectedError` yields `rejected`; other errors yield\n      `unknown`, which keeps edits and must not be blindly resent\n    - `retry` requires an `idempotencyKey` the server honours\n    - \"Saving\" is `status.pending.value > 0`, not `phase === 'pending'`\n    - Details: node_modules/state-ref/dist/skills/state-ref/reference/server-sync.md\n\nIMPORT PATHS:\n- Core: `import { createStore, createStoreManualSync, combineWatch, createComputed } from 'state-ref'`\n- Helpers: `import { lens, copyable, cloneDeep } from 'state-ref'`\n- Drafts: `import { createDraft } from 'state-ref/draft'`\n- Batch: `import { batch } from 'state-ref/batch'`\n- React: `import { connectReact, connectReactView } from '@stateref/connect-react'`\n- Preact: `import { connectPreact, connectPreactView } from '@stateref/connect-preact'`\n- Vue: `import { connectVue, connectVueView } from '@stateref/connect-vue'`\n- Svelte: `import { connectSvelte, connectSvelteView } from '@stateref/connect-svelte'`\n- Svelte 5 runes: `import { connectSvelteRunes } from '@stateref/connect-svelte/runes'`\n- Solid: `import { connectSolid, connectSolidView } from '@stateref/connect-solid'`\n- Server sync: `import { createSyncClient, MutationRejectedError } from '@stateref/sync'`\n\nGUIDANCE APPROACH:\nWhen user requests could benefit from state-ref patterns:\n1. Provide solution using state-ref patterns\n2. Explain advantages of the reactive approach\n3. If user prefers other state management, respect their choice\n\nWhen existing code could be improved with state-ref:\n1. Suggest state-ref refactoring when it adds clarity or performance\n2. Explain the benefits of fine-grained reactivity\n3. Don't force refactoring for trivial improvements\n\nREFERENCE MATERIALS (NOT PART OF BEHAVIORAL RULES):\n\nFor detailed guidance on state-ref patterns and usage, refer to:\nnode_modules/state-ref/dist/skills/state-ref/\n\nThis reference material provides comprehensive examples, troubleshooting tips,\nand pattern guidance that complements the behavioral guidelines above.",Hi=()=>e("div",{class:"prose prose-lg dark:prose-invert max-w-none",children:[e("h1",{class:"text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white mb-6",children:"AI Agent Role Add-on"}),e("p",{class:"text-lg text-gray-600 dark:text-gray-400 mb-8",children:"AI 코딩 에이전트에서 state-ref 패턴을 조건부로 가이드하는 재사용 가능한 행동 모듈"}),e("div",{class:"bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 mb-8",children:[e("h3",{class:"text-lg font-medium text-purple-900 dark:text-purple-200 mb-2",children:"실험적 기능"}),e("p",{class:"text-sm text-purple-800 dark:text-purple-300",children:"이 스펙은 state-ref가 AI 코딩 에이전트의 일급 행동 제약으로 어떻게 적용될 수 있는지 탐구합니다."})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Agent Role Add-on이란?"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"state-ref Agent Role Add-on은 AI 코딩 에이전트(OpenCode, 커스텀 에이전트, IDE 확장 등)를 위한 복사-붙여넣기 준비된 행동 확장입니다. 프로젝트별 스킬 패키지와 달리, 이 add-on은 에이전트의 시스템 프롬프트에 직접 첨부되어 모든 프로젝트에서 작동합니다."}),e("div",{class:"bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-6",children:e("p",{class:"text-sm md:text-base text-blue-900 dark:text-blue-200 leading-relaxed",children:[e("span",{class:"font-medium",children:"주요 차이점:"})," Skills 파일은 프로젝트별 구성입니다. Agent add-on은 프로젝트 컨텍스트에 따라 조건부로 활성화되는 글로벌 에이전트 행동입니다."]})}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8",children:"주요 기능"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:[e("strong",{children:"조건부 활성화:"})," 프로젝트에서 state-ref가 감지된 경우에만 state-ref 패턴을 제안"]}),e("li",{children:[e("strong",{children:"자동 감지:"})," ",e("code",{class:"text-sm",children:"package.json"}),","," ",e("code",{class:"text-sm",children:"node_modules"}),", 기존 import 확인"]}),e("li",{children:[e("strong",{children:"비 state-ref 프로젝트 존중:"})," state-ref가 설치되지 않은 경우 표준 코딩 관행 사용"]}),e("li",{children:[e("strong",{children:"단일 구성:"})," 다양한 기술 스택을 가진 여러 프로젝트에서 작동"]}),e("li",{children:[e("strong",{children:"복사-붙여넣기 준비:"})," 복잡한 설정 없이 에이전트의 시스템 프롬프트에 붙여넣기만 하면 됨"]})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"이 Add-on을 사용해야 할 때"}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"사용해야 할 때:"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:"state-ref를 사용하는 프로젝트와 사용하지 않는 프로젝트를 오가며 작업할 때"}),e("li",{children:"state-ref가 감지되면 자동으로 패턴 가이드를 원할 때"}),e("li",{children:"팀이 프로젝트별로 선택적으로 state-ref를 채택할 때"}),e("li",{children:"프로젝트 컨텍스트에 맞게 적응하는 단일 에이전트 구성이 필요할 때"})]}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"사용하지 말아야 할 때:"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:"state-ref를 절대 사용하지 않는 프로젝트에서만 작업할 때"}),e("li",{children:"반응형 패턴을 적용할 시점을 수동으로 제어하길 원할 때"}),e("li",{children:"에이전트 구성이 글로벌이 아닌 프로젝트별일 때"})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"이 Add-on 첨부 방법"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"아래의 행동 제약 블록을 복사하여 AI 에이전트의 시스템 프롬프트 또는 구성에 붙여넣으세요."}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"이 블록 복사하기"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4",children:"아래의 전체 add-on 구성을 복사하세요:"}),e(t,{language:"bash",code:zi}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"통합 예제"}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"OpenCode (.opencode/config.yaml)"}),e(t,{language:"bash",code:`agent:
  role: "Your Agent Role"
  extensions:
    - type: "state-ref-addon"
      content: |
        [여기에 state-ref 제약 블록을 붙여넣으세요]`}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"커스텀 에이전트 시스템 프롬프트"}),e(t,{language:"bash",code:`<your-existing-agent-role>
  <identity>
    You are a [에이전트 설명]...
  </identity>

  <capabilities>
    [에이전트 능력]...
  </capabilities>

  <!-- 여기에 state-ref 행동 제약 삽입 -->
  <coding-constraints>
    [여기에 state-ref 제약 블록을 붙여넣으세요]
  </coding-constraints>

  <workflow>
    [에이전트 워크플로우]...
  </workflow>
</your-existing-agent-role>`}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"작동 방식"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"add-on은 프로젝트 컨텍스트에 따라 행동을 조정하는 조건부 로직을 사용합니다:"}),e("div",{class:"space-y-6 mb-6",children:[e("div",{class:"bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800",children:[e("h4",{class:"text-lg font-medium text-green-900 dark:text-green-200 mb-2",children:"state-ref가 설치된 경우"}),e("p",{class:"text-sm text-green-800 dark:text-green-300",children:"에이전트가 state-ref 패턴을 제안하고, 반응형 접근 방식의 이점을 설명하며, 명확성을 위해 세밀한 반응성을 우선시하면서 사용자 선호도를 존중합니다."})]}),e("div",{class:"bg-gray-50 dark:bg-gray-800/20 p-6 rounded-lg border border-gray-200 dark:border-gray-700",children:[e("h4",{class:"text-lg font-medium text-gray-900 dark:text-gray-200 mb-2",children:"state-ref가 설치되지 않은 경우"}),e("p",{class:"text-sm text-gray-700 dark:text-gray-400",children:"에이전트가 프로젝트에 적합한 표준 코딩 관행을 사용하고, state-ref를 언급하지 않으며, 기존 규칙을 존중합니다."})]})]}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8",children:"감지 메커니즘"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4",children:"에이전트는 다음을 통해 state-ref 가용성을 확인합니다:"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:[e("code",{class:"text-sm",children:"package.json"})," 의존성 선언 (가장 신뢰할 수 있음)"]}),e("li",{children:[e("code",{class:"text-sm",children:"node_modules"})," 디렉토리 존재 (설치 확인)"]}),e("li",{children:"기존 import 문 (사용 확인)"})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"전체 문서"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["완전한 add-on 문서는 설치 후"," ",e("code",{class:"text-sm",children:"node_modules/state-ref/dist/ai-addons/state-ref-agent-addon.md"}),"에서 확인할 수 있습니다."]}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:[" ",e("a",{href:"https://github.com/superlucky84/state-ref/blob/main/state-ref-agent-addon.md",target:"_blank",rel:"noopener noreferrer",class:"text-blue-600 dark:text-blue-400 hover:underline",children:"GitHub 저장소"}),"에서도 확인할 수 있습니다."]}),e("div",{class:"bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 mt-6",children:e("p",{class:"text-sm md:text-base text-yellow-900 dark:text-yellow-200 leading-relaxed",children:[e("span",{class:"font-medium",children:"중요:"})," 이 add-on은 시스템 프롬프트를 지원하는 에이전트를 위해 설계되었습니다. 프로젝트별 AI 지원(Claude Code의 skills 등)의 경우"," ",e("a",{href:"#/ko/ai-agent-skills",class:"text-yellow-700 dark:text-yellow-300 hover:underline",children:"AI Agent Skills"})," ","파일을 대신 사용하세요."]})})]}),Mt=r=>r.replace(/\/+$/,"")||"/",Ot={"/":Qn,"/ko":Zn,"/guide/introduction":at,"/ko/guide/introduction":ua,"/guide/quick-start":pa,"/ko/guide/quick-start":ga,"/guide/create-store":fa,"/ko/guide/create-store":ma,"/guide/watch":ya,"/ko/guide/watch":ba,"/guide/references":va,"/ko/guide/references":wa,"/guide/state-ref-store":Sa,"/ko/guide/state-ref-store":ka,"/guide/subscription":Ra,"/ko/guide/subscription":xa,"/guide/primitives":Ca,"/ko/guide/primitives":Ta,"/guide/computed":Aa,"/ko/guide/computed":Wa,"/guide/combine-watch":Ea,"/ko/guide/combine-watch":Ia,"/guide/manual-sync":li,"/ko/guide/manual-sync":di,"/guide/batch":Pa,"/ko/guide/batch":Da,"/guide/draft":Na,"/ko/guide/draft":Ma,"/guide/draft-apply":Oa,"/ko/guide/draft-apply":La,"/guide/draft-conflicts":Fa,"/ko/guide/draft-conflicts":Ua,"/guide/draft-lifetime":qa,"/ko/guide/draft-lifetime":_a,"/guide/sync":Va,"/ko/guide/sync":ja,"/guide/sync-query":Ba,"/ko/guide/sync-query":Ka,"/guide/sync-mutation":$a,"/ko/guide/sync-mutation":Ja,"/guide/sync-lifecycle":za,"/ko/guide/sync-lifecycle":Ha,"/guide/sync-view":Ga,"/ko/guide/sync-view":ri,"/guide/sync-form":Qa,"/ko/guide/sync-form":Ya,"/guide/sync-infinite":Za,"/ko/guide/sync-infinite":Xa,"/guide/sync-stream":ei,"/ko/guide/sync-stream":ti,"/guide/sync-refetch":ni,"/ko/guide/sync-refetch":ci,"/guide/sync-persistence":ai,"/ko/guide/sync-persistence":ii,"/guide/sync-observation":oi,"/ko/guide/sync-observation":si,"/guide/lens":hi,"/ko/guide/lens":ui,"/guide/copyable":pi,"/ko/guide/copyable":gi,"/guide/clone-deep":fi,"/ko/guide/clone-deep":mi,"/guide/react":yi,"/ko/guide/react":bi,"/guide/preact":vi,"/ko/guide/preact":wi,"/guide/vue":Si,"/ko/guide/vue":ki,"/guide/svelte":Ri,"/ko/guide/svelte":xi,"/guide/solid":Ci,"/ko/guide/solid":Ti,"/guide/lithent":Ai,"/ko/guide/lithent":Wi,"/guide/custom-connector":Ei,"/ko/guide/custom-connector":Ii,"/api/core":Pi,"/ko/api/core":Di,"/api/helpers":Ni,"/ko/api/helpers":Mi,"/api/types":Vi,"/ko/api/types":ji,"/api/draft":Oi,"/ko/api/draft":Li,"/api/sync":Fi,"/ko/api/sync":Ui,"/api/plugin":qi,"/ko/api/plugin":_i,"/ai-agent-skills":Bi,"/ko/ai-agent-skills":Ki,"/ai-agent-addon":Ji,"/ko/ai-agent-addon":Hi},Gi=r=>{const n=Mt(r),c=Ot[n];if(c)return c;if(n.startsWith("/ko")){const a=Mt(n.replace(/^\/ko/,"")||"/");return Ot[a]||at}return at},Qi=u(r=>{const n=Be.watch(r);return()=>{const c=Gi(n.route);return e("div",{class:"min-h-screen bg-white dark:bg-[#1b1b1f] transition-colors",children:[e(zn,{}),e("div",{class:"mx-auto max-w-[1440px]",children:e("div",{class:"flex",children:[e(Hn,{}),e("main",{class:"flex-1 w-full min-w-0 px-6 md:px-12 py-8 max-w-full",children:e("div",{class:"max-w-full md:max-w-[43rem] page-shell",children:e(c,{})})})]})})]})}});Xr(e(Qi,{}),document.body);
//# sourceMappingURL=index-BCuRXol6.js.map
