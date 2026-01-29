(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))c(a);new MutationObserver(a=>{for(const l of a)if(l.type==="childList")for(const i of l.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&c(i)}).observe(document,{childList:!0,subtree:!0});function o(a){const l={};return a.integrity&&(l.integrity=a.integrity),a.referrerPolicy&&(l.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?l.credentials="include":a.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function c(a){if(a.ep)return;a.ep=!0;const l=o(a);fetch(a.href,l)}})();const ve=Symbol.for("lithentWDomSymbol"),ye={value:""},he={value:null},ie={value:!1},V=new WeakMap,Lt=new WeakSet,Pr=t=>{V.set(t,{vd:{value:null},up:()=>{},upR:[],upS:{value:0},upD:[],upCB:[],mts:[],umts:[],wdCB:[]})},Oe=()=>he.value,yt=(t,n)=>{const o=V.get(t);return o?o[n]:null},Or=t=>{he.value=t},_r=t=>{he.value=t,Pr(t)},Lr=t=>{const n=V.get(t);n&&(n.umts.forEach(o=>o()),n.umts=[])},ee=t=>t.getParent&&t.getParent(),we=Object.entries,Ut=Object.keys,ke=t=>typeof t=="object"&&t!==null,_e=Object.assign,ue=t=>ke(t)&&!("resolve"in t),We=(t,n)=>ue(t)&&t.type===n,Ur=(t,n)=>"ctor"in t?t.ctor===(n&&n.ctor):t===(n&&n.ctor),Dr=(t,n)=>!!(ue(t)&&n&&n.type==="f"&&n.children&&n.children.length===(t.children&&t.children.length)),Fr=(t,n)=>!!(ue(t)&&n&&n.type==="e"&&n.tag===t.tag&&n.children&&n.children.length===(t.children&&t.children.length)),vt=(t,n)=>!!(ue(t)&&n&&n.type===t.type),Vr=(t,n)=>!!(ue(t)&&n&&n.type===t.type&&(se((t.children||[])[0])&&se((n.children||[])[0])||n.children&&t.children&&n.children.length===t.children.length)),q=t=>(t&&t.compProps&&t.compProps.key)??(t&&t.props&&t.props.key),le=t=>t&&["f","l"].includes(t),Le=t=>typeof t=="function"&&!Dt(t)||ke(t)&&"resolve"in t,Dt=t=>typeof t=="function"&&t===$e,Br=t=>ue(t)&&!t.type,se=t=>Ft(q(t)),Ft=t=>t!=null,St=(t,n)=>t==="style"&&ke(n),$r=(t,n)=>t==="ref"&&ke(n),jr=(t,n)=>{const o=Object.getOwnPropertyDescriptor(t.constructor.prototype,n);return o&&o.get&&o.set},Jr=t=>Le(t)?"c":We(t,"f")?"f":We(t,"e")?"e":We(t,"l")?"l":We(t,"t")?"t":"et",Hr={c:Ur,l:Vr,t:vt,e:Fr,f:Dr,et:vt},Vt=t=>{const n=Oe();if(n){const o=V.get(n);o&&o.umts.push(t)}},Ue=t=>{const{compKey:n}=t;n&&Kr(n),Bt(t)},Bt=t=>{(t.children||[]).forEach(n=>{n.compKey?Ue(n):Bt(n)})},Kr=t=>{Lr(t),V.delete(t)};let Xe=[];const zr=t=>{t.compKey&&Xe.push(t)},Ee=()=>{Xe.forEach(t=>qr(t)),Xe=[]},Gr=t=>{const n=Oe();if(n){const o=V.get(n);o&&o.mts.push(t)}},qr=t=>{const{compKey:n}=t;if(n){const o=V.get(n);if(!o)return;const{mts:c,upS:a}=o;he.value=n,a&&(a.value=0),c&&(o.mts=[],c.forEach(l=>{const i=l();i&&Vt(i)}))}},Yr=t=>{const{compKey:n}=t;if(n){const o=V.get(n),c=o&&o.wdCB;he.value=n,c&&c.length>0&&(o.wdCB=[],c.forEach(a=>{const l=a();l&&typeof l=="function"&&Vt(l)}))}},Zr=t=>{const{compKey:n}=t;if(n){const o=V.get(n);if(!o)return;const{upCB:c,upS:a}=o;he.value=n,a&&(a.value=0),t.ctor&&c&&(o.upCB=[],c.forEach(l=>l()))}},Ne=()=>new DocumentFragment,Xr=t=>document.createElement(t),Qr=(t,n,o,c)=>{t.isRoot=!0,n=n||document.body,t.we=n;const a=Fe(t,c);return n.tagName==="HTML"?n.replaceWith(a):n.appendChild(a),Ee(),()=>{const l=V.get(t.compProps||{}),i=l&&l.vd.value||t;i!==t&&Ue(i),De(i),en(i)}},De=t=>{t.props&&t.el&&Ht(t.props,t.el),(t.children||[]).forEach(n=>{De(n)})},en=t=>$t(t,t.we),at=t=>{t.op&&t.el&&Ht(t.op,t.el);const n=ee(t),o=t.isRoot?t.we:n?Ve(n):void 0;o&&$t(t,o)},$t=(t,n)=>{n&&t.el&&(t.el.nodeType===11||(t==null?void 0:t.tag)==="portal"?jt(t):[1,3].includes(t.el.nodeType)&&n.removeChild(t.el),delete t.el)},jt=(t,n)=>{(t&&t.oc||t&&t.children||[]).forEach(o=>{const c=o.el&&o.el.nodeType;if(c)if([1,3].includes(c)){const a=o.el;a.tagName==="HTML"?a.innerHTML="":a.remove()}else c===11&&jt(o)})},Qe=t=>{at(t),Ie(t)},tn=t=>{rt(t);const n=ee(t);if(!n){if(t.isRoot){const o=et(t);Ie(t,o)}return}if(n.nr!=="L"){const o=et(t);Ie(t,o)}},Ie=(t,n)=>{n||(n=Fe(t));const o=ee(t);if(!o||!o.type){t.isRoot&&t.we&&n&&t.tag!=="portal"&&(t.ae?t.we.insertBefore(n,t.ae):t.we.tagName==="HTML"?t.we.replaceWith(n):t.we.appendChild(n),Ee());return}const c=Ve(o),a=o.type==="l"&&o.nr&&o.nr!=="L"?tt(o,ee(o)):tt(t,o);n&&c&&(t.tag!=="portal"&&(a?c.insertBefore(n,a):c.appendChild(n)),Ee())},et=t=>le(t.type)?(t&&t.children||[]).reduce((n,o)=>{const c=et(o);return c&&n.appendChild(c),n},Ne()):t.el,tt=(t,n)=>{const o=n.children||[],c=o.indexOf(t)+1,a=o.slice(c),l=Jt(a),i=n.type||"";if(l)return l;if(!n.isRoot&&le(i))return tt(n,ee(n));if(n.isRoot&&le(i)&&n.ae)return n.ae},Jt=t=>t.reduce((n,o)=>{if(n)return n;const{type:c,el:a}=o;if(c&&le(c)){const l=Jt(o.children||[]);if(l)return l}return a&&a.nodeType!==11?a:n},void 0),rn=t=>{const n=ee(t),o=t.el;if(t.isRoot&&!n&&o){Qe(t);return}if(n&&n.type&&o)if(o.nodeType===11)Qe(t);else{const c=Ve(n),a=Fe(t);c&&t.tag!=="portal"&&c.replaceChild(a,o),Ee()}},Ht=(t,n)=>{we(t||{}).forEach(([o,c])=>{o.match(/^on/)&&n.removeEventListener(o.slice(2).toLowerCase(),c)})},rt=t=>{if(t.type==="t"){on(t);return}if(t.el){const{op:n,props:o}=t;zt(o,t.el,n),delete t.op,t.tag==="input"&&(t.el.value=String(o&&o.value||""))}(t.children||[]).forEach(n=>Kt(n)),Zr(t)},Kt=t=>{const{nr:n}=t;n!==void 0&&n!=="N"&&(nn[n](t),delete t.nr,delete t.oc,delete t.op)},nn={A:Ie,D:at,R:rn,U:rt,S:Qe,T:tn,L:rt},on=t=>{t.el&&(t.el.nodeValue=String(t.text))},zt=(t,n,o,c)=>{const a=o||{};we(t||{}).forEach(([l,i])=>{if(i===a[l]){delete a[l];return}l==="key"||i===a[l]||l==="portal"&&ke(i)||(l==="innerHTML"&&typeof i=="string"?n.innerHTML=i:St(l,i)?sn(i,St(l,a.style)?a.style:{},n):$r(l,i)?i.value=n:l.match(/^on/)?ln(n,l,i,a[l]):l&&(l!=="type"&&jr(n,l)?n[l]=i:cn(l==="className"?"class":l,n,i))),delete a[l]}),Ut(a).forEach(l=>n.removeAttribute(l))},cn=(t,n,o)=>ye.value&&t!=="xmlns"?n.setAttributeNS(null,t,o):n.setAttribute(t,o),Fe=(t,n)=>{let o;const{type:c,tag:a,text:l,props:i,children:s=[]}=t,d=le(c);if(Yr(t),a==="svg"&&(ye.value=String(i&&i.xmlns)),!n){if(!c)o=Ne();else if(d)o=Ne();else if(c==="e"&&a)a==="portal"&&i&&i.portal?o=i.portal:o=ye.value?document.createElementNS(ye.value,a):Xr(a);else if(c==="t"&&Ft(l))o=document.createTextNode(String(l));else throw Error("Invalid wDom");t.el=o}return an(s,o,n),zt(i,o,null),zr(t),a==="svg"&&(ye.value=""),o},an=(t,n,o)=>{const c=t.reduce((a,l)=>{if(l.type){const i=Fe(l,o);l.tag!=="portal"&&!o&&a.appendChild(i)}return a},Ne());n&&c.hasChildNodes()&&n.appendChild(c)},ln=(t,n,o,c)=>{const a=n.slice(2).toLowerCase();c!==o&&(c&&t.removeEventListener(a,c),o&&t.addEventListener(a,o))},sn=(t,n,o)=>{const c={...n},a=o instanceof HTMLElement?o:null,l=a==null?void 0:a.style;if(!l)return;const i=l;we(t).forEach(([s,d])=>{i[s]=d,delete c[s]}),we(c).forEach(([s])=>{i[s]=""})},Ve=t=>{const n=le(t.type);return t.isRoot&&n?t.we:n?Ve(ee(t)):t.el},Be=(t,n)=>dn(t,Hr[Jr(t)](t,n),n),dn=(t,n,o)=>{const c=bn(t,n,o),a=un(c,n,o),l=a==="N";return l||(c.children=yn(c,n,o)),c.nr=a,hn(c,o,a),!l&&o&&(o.il=!0,delete o.children),(o==null?void 0:o.tag)==="portal"&&(c.tag="portal"),c},hn=(t,n,o)=>{o!=="A"&&n&&(t.el=n.el),(o==="D"||o==="R"||o==="S")&&(n&&(Ue(n),De(n)),t.oc=n&&n.children),t.op=n&&n.props},un=(t,n,o)=>{if(Br(t))return"D";if(t.type==="t"&&n&&t.text===(o&&o.text)||t===o)return"N";if(!(o&&o.type))return"A";const c=ee(o),a=!t.isRoot&&c&&c.type==="l"&&se(t);let l=n?a?"T":"U":a?"S":"R";return t.type==="l"&&l==="U"&&o&&pn(t,o)&&(l="L"),l},pn=(t,n)=>{if(!se((t.children||[])[0])||!se((n.children||[])[0]))return!1;const o=[...n&&n.children||[]],c=[...t&&t.children||[]].filter(i=>o.find(s=>q(i)===q(s))),a=o.filter(i=>c.find(s=>q(i)===q(s)));let l=a.length===c.length;return l&&(l=a.every((i,s)=>q(i)===q(c[s]))),l},gn=(t,n)=>{t&&n!==t&&(Ut(t).forEach(o=>delete t[o]),we(n||{}).forEach(([o,c])=>t[o]=c))},mn=(t,n)=>{t&&(t.splice(0,t.length),n&&n.forEach(o=>t.push(o)))},fn=(t,n)=>{const{compProps:o,compChild:c}=t,{props:a,children:l}=n;return o&&gn(o,a),c&&l&&c!==l&&mn(c,l),t.reRender&&t.reRender()},bn=(t,n,o)=>Le(t)?n&&o?fn(o,t):t.resolve():t,yn=(t,n,o)=>n&&o?Sn(t,o):vn(t),vn=t=>(t.children||[]).map(n=>_e(Be(n),{getParent:()=>t})),Sn=(t,n)=>t.type==="l"&&se((t.children||[])[0])?wn(t,n):(t.children||[]).map((o,c)=>_e(Be(o,(n.children||[])[c]),{getParent:()=>t})),wn=(t,n)=>{const[o,c]=xn(t,n);return c.forEach(a=>{Ue(a),De(a),at(a)}),o},xn=(t,n)=>{const o=[...n.children||[]];return[(t.children||[]).map(c=>{const a=Rn(c,o),l=Be(c,a);return a&&o.splice(o.indexOf(a),1),l.getParent=()=>t,l}),o]},Rn=(t,n)=>n.find(o=>q(o)===q(t)),nt=new Map;let ot=!1;const kn=(t,n)=>{const o=V.get(t);o&&(o.up=()=>{nt.set(t,n),ot||(ot=!0,queueMicrotask(Cn))})},Gt=t=>()=>{const n=V.get(t),o=n&&n.up;return o?(o(),!0):!1},Cn=()=>{nt.forEach(t=>{t()}),nt.clear(),ot=!1},Tn=()=>{const t=Oe();if(!t)return;const n=V.get(t),o=n&&n.upR;o&&o.length&&o.forEach(c=>c())},$e=(t,...n)=>({type:"f",[ve]:!0,children:n}),wt=(t,n,...o)=>{const c={value:void 0},a=qt(c,o),l=Nn(t,n||{},a);return Le(l)||(c.value=l),l},f=t=>(n,o)=>t,Wn=t=>(n,o)=>(Lt.add(t),t),An=(t,n,o)=>{const c=(a,l)=>{if(!(!a||l.has(a))){if(l.add(a),a.compChild){const i=a.compChild.indexOf(n);i!==-1&&a.compChild.splice(i,1,o)}c(a.getParent?a.getParent():void 0,l)}};c(t,new Set)},En=(t,n,o,c)=>{if(c.il)return;ie.value=!0;const a=Zt(t,n,o),l=Be(a,c),{isRoot:i,getParent:s,we:d,ae:b}=c;if(l.getParent=s,!i&&s){const S=s(),R=S&&S.children||[],x=R.indexOf(c);x!==-1&&R.splice(x,1,l),An(S,c,l)}else l.isRoot=!0,l.we=d,l.ae=b;ie.value=!1,Kt(l)},Nn=(t,n,o)=>{if(Dt(t))return $e(n,...o);if(Le(t)){const c=Zt(t,n,o);return ie.value?c:c.resolve()}return{type:"e",[ve]:!0,tag:t,props:n,children:o}},qt=(t,n)=>n.map(o=>_e(Yt(o),{getParent:()=>t.value})),Yt=t=>{if(t==null||t===!1)return{type:null,[ve]:!0};if(Array.isArray(t)){const n={value:void 0},o=qt(n,t),c={type:"l",[ve]:!0,children:o};return n.value=c,c}else if(typeof t=="string"||typeof t=="number")return{type:"t",[ve]:!0,text:t};return t},In=(t,n,o)=>(c=n)=>{const a=ie.value;ie.value=!1,_r(c);const l=t(n,o);let i;if(typeof l=="function"){const d=l;i=Lt.has(d)?d(n,o):d(Gt(c),n,o)}else i=d=>t(d,o);const s=Mn(i,c,t,n,o);return ie.value=a,s},Zt=(t,n,o)=>{const c=t,a=o,l=In(t,n,a);return{ctor:c,props:n,children:a,resolve:l}},Mn=(t,n,o,c,a)=>{const l=b=>Yt(t(b)),{wrappedComponentMaker:i,customNode:s}=_n(l,c),d=Pn(i,n,o,c,a);return Xt(s,n,o,c,a,d),s},Pn=(t,n,o,c,a)=>{const l=()=>On(t,n,o,c,a,l);return l},On=(t,n,o,c,a,l)=>{Or(n),Tn();const i=t(c);return Xt(i,n,o,c,a,l),i},_n=(t,n)=>{const o=a=>{const l=t(a),i=$e({},l);return l.getParent=()=>i,i},c=o(n);return{wrappedComponentMaker:o,customNode:c}},Xt=(t,n,o,c,a,l)=>{_e(t,{compProps:c,compChild:a,ctor:o,compKey:n,reRender:l}),kn(n,()=>En(o,t.compProps||c,t.compChild||a,t)),yt(n,"vd")&&(yt(n,"vd").value=t)},Ln=t=>({value:t}),Un=()=>{const t=Oe();return t?Gt(t):()=>!1};function e(t,n,o,c,a,l){const{children:i,...s}=n;if(i!=null){const d=Array.isArray(i)?i:[i];return wt(t,{...s,key:o},...d)}return wt(t,{...s,key:o})}const Dn={cache:!0};function Fn(t){const n={value:!1},o=!Array.isArray(t)&&typeof t=="object"&&t!==null?t:{value:t},c=new Set,a=[],l=new WeakMap,i=(s,d,b)=>{const{cache:S}=Object.assign({},Dn,b||{});if(S&&s&&l.has(s))return l.get(s);const R={},x=new Set;let T={value:null},E=()=>{};return a.push(R),s&&d&&(E=()=>s(T.value),T.value=xt(o,n,c,x,a,E,R),n.value=!0,d(T.value),n.value=!1),T.value||(T.value=xt(o,n,c,x,a),s&&(E=()=>s(T.value),c.add(E))),s&&(Bn(E,c,R,x),l.set(s,T.value)),T.value};return{useStore(s,d){const b=Un();return i(b,s,d)},watch(s,d,b){return i(s,d,b)}}}function xt(t,n,o,c,a,l,i){return new Proxy(t,{get(s,d){return l&&i&&n.value&&(i[d]??(i[d]=new Set),i[d].has(l)||(i[d].add(l),c.add(d))),s[d]},set(s,d,b){return s[d]===b||(s[d]=b,Vn(o,a,d)),!0}})}function Vn(t,n=[],o){const c=new Set;kt(t).forEach(a=>c.add(a)),(n||[]).forEach(a=>{const l=a[o]||new Set;kt(l).forEach(i=>c.add(i)),Rt(c,l)}),Rt(c,t)}function Rt(t,n){t.forEach(o=>{n.delete(o)})}function kt(t){const n=[];return t.forEach(o=>{o()===!1&&n.push(o)}),n}function Bn(t,n,o,c){const a=t();a instanceof AbortSignal&&a.addEventListener("abort",()=>{const l=o||{};n.delete(t),Object.entries(l).forEach(([i,s])=>{s.delete(t),c.delete(i)})})}const Qt="/ko",$n=t=>t.startsWith("/")?t:`/${t}`,jn=t=>$n(t||"/").replace(/^\/ko(?=\/|$)/,"")||"/",er=()=>location.hash.slice(1)||"/",Se=(t,n)=>{const o=jn(t);return n==="ko"?`${Qt}${o}`:o},Jn=()=>{const t=localStorage.getItem("stateref-theme");return t==="light"||t==="dark"?t:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"},je=Fn({theme:Jn(),route:er(),sidebarOpen:!1}),Y=je.watch(),tr=t=>{Y.theme=t,localStorage.setItem("stateref-theme",t),t==="dark"?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark")},Hn=()=>{tr(Y.theme==="light"?"dark":"light")},X=()=>Y.route.startsWith(Qt),rr=t=>{Y.route=t,location.hash=`#${t}`,Y.sidebarOpen=!1,window.scrollTo(0,0)},Je=t=>{const n=X()?"ko":"en",o=Se(t,n);rr(o)},Kn=t=>{const n=Se(Y.route,t);n!==Y.route&&rr(n)},Ct=()=>{Kn(X()?"en":"ko")};window.addEventListener("hashchange",()=>{Y.route=er(),window.scrollTo(0,0)});tr(Y.theme);const zn=f(t=>{const n=je.watch(t);return()=>e("header",{class:"sticky top-0 z-50 bg-white dark:bg-[#1b1b1f] border-b border-gray-200 dark:border-gray-800",children:e("div",{class:"mx-auto max-w-[1440px]",children:e("div",{class:"flex h-16",children:[e("div",{class:"w-auto lg:w-64 flex-shrink-0 flex items-center px-6 md:px-12",children:e("a",{href:"#/",onClick:o=>{o.preventDefault(),Je("/")},class:"flex items-center gap-3 hover:opacity-80 transition-opacity",children:[e("img",{src:"/state-ref/stateref.png",alt:"StateRef Logo",class:"w-8 h-8 rounded-lg"}),e("span",{class:"text-xl font-bold text-gray-900 dark:text-white",children:"StateRef"})]})}),e("div",{class:"flex-1 w-full min-w-0 px-6 md:px-12",children:e("div",{class:"max-w-full md:max-w-[43rem] flex items-center justify-end h-16",children:[e("div",{class:"flex items-center border border-gray-200 dark:border-gray-700 rounded-full text-xs font-semibold overflow-hidden",children:[e("button",{type:"button",onClick:()=>!X()||Ct(),class:`px-3 py-1 transition-colors ${X()?"text-gray-600 dark:text-gray-300":"bg-indigo-500 text-white"}`,"aria-pressed":!X(),children:"EN"}),e("button",{type:"button",onClick:()=>X()||Ct(),class:`px-3 py-1 transition-colors ${X()?"bg-indigo-500 text-white":"text-gray-600 dark:text-gray-300"}`,"aria-pressed":X(),children:"KO"})]}),e("button",{onClick:Hn,class:"hidden sm:inline-flex ml-6 relative items-center h-9 w-16 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 bg-gray-200 dark:bg-gray-700","aria-label":"Toggle dark mode",title:n.theme==="dark"?"Switch to light mode":"Switch to dark mode",children:e("span",{class:`inline-block h-7 w-7 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${n.theme==="dark"?"translate-x-8":"translate-x-1"}`,children:e("span",{class:"flex items-center justify-center h-full",children:n.theme==="dark"?e("svg",{class:"w-4 h-4 text-gray-600",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",xmlns:"http://www.w3.org/2000/svg",children:e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"})}):e("svg",{class:"w-4 h-4 text-yellow-500",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",xmlns:"http://www.w3.org/2000/svg",children:e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"})})})})}),e("a",{href:"https://github.com/superlucky84/state-ref",target:"_blank",rel:"noopener noreferrer",class:"hidden sm:flex ml-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors","aria-label":"GitHub",children:e("svg",{xmlns:"http://www.w3.org/2000/svg",class:"w-5 h-5 text-gray-700 dark:text-gray-300",fill:"currentColor",viewBox:"0 0 24 24",children:e("path",{"fill-rule":"evenodd",d:"M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z","clip-rule":"evenodd"})})}),e("button",{class:"lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md p-2 ml-4","aria-label":"Toggle sidebar",onClick:()=>{n.sidebarOpen=!n.sidebarOpen},children:e("svg",{class:"w-6 h-6 text-gray-600 dark:text-gray-300",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",xmlns:"http://www.w3.org/2000/svg",children:e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M4 6h16M4 12h16M4 18h16"})})})]})})]})})})}),qe=[{text:{en:"Getting Started",ko:"시작하기"},items:[{text:{en:"Introduction",ko:"소개"},link:"/guide/introduction"},{text:{en:"Quick Start",ko:"빠른 시작"},link:"/guide/quick-start"},{text:{en:"GitHub",ko:"GitHub"},link:"https://github.com/superlucky84/state-ref",external:!0},{text:{en:"AI Agent Skills",ko:"AI Agent Skills"},link:"/ai-agent-skills"},{text:{en:"AI Agent Role Add-on",ko:"AI Agent Role Add-on"},link:"/ai-agent-addon"}]},{text:{en:"Core Concepts",ko:"핵심 개념"},items:[{text:{en:"createStore",ko:"createStore"},link:"/guide/create-store"},{text:{en:"Watch Function",ko:"Watch 함수"},link:"/guide/watch"},{text:{en:"Understanding References",ko:"참조 이해하기"},link:"/guide/references"},{text:{en:"StateRefStore",ko:"StateRefStore"},link:"/guide/state-ref-store"},{text:{en:"Subscription",ko:"구독"},link:"/guide/subscription"},{text:{en:"Primitive Types",ko:"원시 타입"},link:"/guide/primitives"}]},{text:{en:"Advanced Usage",ko:"고급 사용법"},items:[{text:{en:"createComputed",ko:"createComputed"},link:"/guide/computed"},{text:{en:"combineWatch",ko:"combineWatch"},link:"/guide/combine-watch"},{text:{en:"Manual Sync (Flux)",ko:"수동 동기화 (Flux)"},link:"/guide/manual-sync"}]},{text:{en:"Helper Functions",ko:"헬퍼 함수"},items:[{text:{en:"Lens Pattern",ko:"Lens 패턴"},link:"/guide/lens"},{text:{en:"copyable",ko:"copyable"},link:"/guide/copyable"},{text:{en:"cloneDeep",ko:"cloneDeep"},link:"/guide/clone-deep"}]},{text:{en:"Framework Integration",ko:"프레임워크 연동"},items:[{text:{en:"React",ko:"React"},link:"/guide/react"},{text:{en:"Preact",ko:"Preact"},link:"/guide/preact"},{text:{en:"Vue",ko:"Vue"},link:"/guide/vue"},{text:{en:"Svelte",ko:"Svelte"},link:"/guide/svelte"},{text:{en:"Solid",ko:"Solid"},link:"/guide/solid"},{text:{en:"Lithent",ko:"Lithent"},link:"/guide/lithent"},{text:{en:"Custom Connector",ko:"커스텀 커넥터"},link:"/guide/custom-connector"}]},{text:{en:"API Reference",ko:"API 레퍼런스"},items:[{text:{en:"Core API",ko:"코어 API"},link:"/api/core"},{text:{en:"Helper API",ko:"헬퍼 API"},link:"/api/helpers"},{text:{en:"TypeScript Types",ko:"TypeScript 타입"},link:"/api/types"}]}],Ye=t=>t.replace(/\/+$/,"")||"/",Gn=f(t=>{const n=je.watch(t),o=Object.fromEntries(qe.map(i=>[i.text.en,!1]));let c="";const a=i=>{const s=n.route.startsWith("/ko")?"ko":"en";Je(Se(i,s))},l=i=>{o[i]=!o[i],t()};return()=>{const i=n.route!==c,s=Ye(n.route),d=n.route.startsWith("/ko")?"ko":"en",b=R=>Ye(Se(R,d));i&&(s==="/"||s==="/ko")&&qe.forEach(R=>{o[R.text.en]=!1});const S=e($e,{children:[n.sidebarOpen&&e("div",{class:"fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden",onClick:()=>{n.sidebarOpen=!1}}),e("aside",{class:`
            fixed lg:sticky top-16 left-0 z-40
            w-64 h-[calc(100vh-4rem)] flex-shrink-0
            bg-white dark:bg-[#1b1b1f]
            border-r border-gray-200 dark:border-gray-800
            overflow-y-auto
            transition-transform duration-300
            ${n.sidebarOpen?"translate-x-0":"-translate-x-full lg:translate-x-0"}
          `,children:e("nav",{class:"pl-6 md:pl-12 pr-3 md:pr-4 py-6",children:qe.map(R=>{const x=R.text.en;i&&s!=="/"&&s!=="/ko"&&R.items.some(W=>W.external?!1:b(W.link)===s)&&(o[x]=!0);const T=o[x];return e("div",{class:"mb-3",children:[e("button",{class:"mb-1 w-full flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider",onClick:()=>l(x),children:[e("span",{children:R.text[d]}),e("span",{class:"text-base leading-none",children:T?"▾":"▸"})]}),e("ul",{class:`
                      space-y-0 overflow-hidden transition-all duration-200 ease-in-out
                      ${T?"max-h-[800px] opacity-100":"max-h-0 opacity-0 pointer-events-none"}
                    `,"aria-hidden":!T,children:R.items.map(E=>{const W=E.external,_=W?E.link:Se(E.link,d),z=W?!1:s===Ye(_);return e("li",{children:e("a",{href:_,target:W?"_blank":void 0,rel:W?"noreferrer":void 0,onClick:W?void 0:M=>{M.preventDefault(),a(E.link)},class:`
                              block px-2 py-1.5 rounded-md text-sm font-normal transition-colors
                              ${z?"text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20":"text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800"}
                            `,children:E.text[d]})})})})]})})})})]});return c=n.route,S}}),qn=[{title:"Getting Started",description:"Learn the basics of StateRef",icon:"🚀",theme:{gradient:"from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",borderColor:"border-blue-200 dark:border-blue-800",hoverBorder:"hover:border-blue-400 dark:hover:border-blue-600",tagBg:"bg-blue-100 dark:bg-blue-900/40",tagHover:"hover:bg-blue-200 dark:hover:bg-blue-800/60",textColor:"text-blue-900 dark:text-blue-100"},items:[{text:"Introduction",link:"/guide/introduction"},{text:"Quick Start",link:"/guide/quick-start"}]},{title:"Core Concepts",description:"Understand the fundamental concepts",icon:"⚡",theme:{gradient:"from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",borderColor:"border-green-200 dark:border-green-800",hoverBorder:"hover:border-green-400 dark:hover:border-green-600",tagBg:"bg-green-100 dark:bg-green-900/40",tagHover:"hover:bg-green-200 dark:hover:bg-green-800/60",textColor:"text-green-900 dark:text-green-100"},items:[{text:"createStore",link:"/guide/create-store"},{text:"Watch Function",link:"/guide/watch"},{text:"Lens Pattern",link:"/guide/lens"}]},{title:"Helper Functions",description:"Powerful utilities for state management",icon:"🔧",theme:{gradient:"from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",borderColor:"border-purple-200 dark:border-purple-800",hoverBorder:"hover:border-purple-400 dark:hover:border-purple-600",tagBg:"bg-purple-100 dark:bg-purple-900/40",tagHover:"hover:bg-purple-200 dark:hover:bg-purple-800/60",textColor:"text-purple-900 dark:text-purple-100"},items:[{text:"copyable",link:"/guide/copyable"},{text:"createComputed",link:"/guide/computed"},{text:"combineWatch",link:"/guide/combine-watch"}]},{title:"Framework Integration",description:"Connect with your favorite UI framework",icon:"🔗",theme:{gradient:"from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20",borderColor:"border-orange-200 dark:border-orange-800",hoverBorder:"hover:border-orange-400 dark:hover:border-orange-600",tagBg:"bg-orange-100 dark:bg-orange-900/40",tagHover:"hover:bg-orange-200 dark:hover:bg-orange-800/60",textColor:"text-orange-900 dark:text-orange-100"},items:[{text:"React",link:"/guide/react"},{text:"Vue",link:"/guide/vue"},{text:"Svelte",link:"/guide/svelte"},{text:"Solid",link:"/guide/solid"}]}],Yn=f(t=>{const n=o=>{Je(o)};return()=>e("div",{children:[e("div",{class:"mb-12",children:[e("h1",{class:"text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4",children:"StateRef Documentation"}),e("p",{class:"text-lg text-gray-600 dark:text-gray-400 mb-6",children:"Universal state management library focused on data immutability"}),e("p",{class:"text-base text-gray-600 dark:text-gray-400",children:"StateRef combines proxies and the functional programming lens pattern to efficiently and safely access and modify deeply structured data."})]}),e("div",{class:"mb-12 grid gap-4 md:grid-cols-2",children:[e("div",{class:"p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10",children:[e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"🎯 Fine-grained Reactivity"}),e("p",{class:"text-sm text-gray-600 dark:text-gray-400",children:"Proxy-based tracking ensures only the components that need to update will re-render"})]}),e("div",{class:"p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10",children:[e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"🔒 Immutable by Default"}),e("p",{class:"text-sm text-gray-600 dark:text-gray-400",children:"Copy-on-write pattern ensures safe state updates without mutations"})]}),e("div",{class:"p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10",children:[e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"🔌 Framework Agnostic"}),e("p",{class:"text-sm text-gray-600 dark:text-gray-400",children:"Easy integration with React, Vue, Svelte, Solid, and more"})]}),e("div",{class:"p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10",children:[e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"📦 Lightweight"}),e("p",{class:"text-sm text-gray-600 dark:text-gray-400",children:"Small bundle size with zero dependencies"})]})]}),e("div",{class:"space-y-6",children:qn.map(o=>e("div",{class:`bg-gradient-to-r ${o.theme.gradient} rounded-lg border ${o.theme.borderColor} ${o.theme.hoverBorder} p-6 transition-all hover:shadow-xl`,children:[e("div",{class:"flex items-start gap-4 mb-4",children:[e("span",{class:"text-4xl flex-shrink-0",children:o.icon}),e("div",{class:"flex-1",children:[e("h2",{class:`text-2xl font-bold ${o.theme.textColor} mb-2`,children:o.title}),e("p",{class:"text-sm text-gray-700 dark:text-gray-300",children:o.description})]})]}),e("div",{class:"flex flex-wrap gap-2",children:o.items.map(c=>e("a",{href:c.link,onClick:a=>{a.preventDefault(),n(c.link)},class:`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${o.theme.tagBg} ${o.theme.tagHover} ${o.theme.textColor} transition-all hover:shadow-md`,children:c.text},c.link))})]},o.title))})]})}),Zn=[{title:"시작하기",description:"StateRef의 기본을 배워보세요",icon:"🚀",theme:{gradient:"from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",borderColor:"border-blue-200 dark:border-blue-800",hoverBorder:"hover:border-blue-400 dark:hover:border-blue-600",tagBg:"bg-blue-100 dark:bg-blue-900/40",tagHover:"hover:bg-blue-200 dark:hover:bg-blue-800/60",textColor:"text-blue-900 dark:text-blue-100"},items:[{text:"소개",link:"/guide/introduction"},{text:"빠른 시작",link:"/guide/quick-start"}]},{title:"핵심 개념",description:"기본 개념을 이해해보세요",icon:"⚡",theme:{gradient:"from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",borderColor:"border-green-200 dark:border-green-800",hoverBorder:"hover:border-green-400 dark:hover:border-green-600",tagBg:"bg-green-100 dark:bg-green-900/40",tagHover:"hover:bg-green-200 dark:hover:bg-green-800/60",textColor:"text-green-900 dark:text-green-100"},items:[{text:"createStore",link:"/guide/create-store"},{text:"Watch 함수",link:"/guide/watch"},{text:"Lens 패턴",link:"/guide/lens"}]},{title:"헬퍼 함수",description:"강력한 상태 관리 유틸리티",icon:"🔧",theme:{gradient:"from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",borderColor:"border-purple-200 dark:border-purple-800",hoverBorder:"hover:border-purple-400 dark:hover:border-purple-600",tagBg:"bg-purple-100 dark:bg-purple-900/40",tagHover:"hover:bg-purple-200 dark:hover:bg-purple-800/60",textColor:"text-purple-900 dark:text-purple-100"},items:[{text:"copyable",link:"/guide/copyable"},{text:"createComputed",link:"/guide/computed"},{text:"combineWatch",link:"/guide/combine-watch"}]},{title:"프레임워크 연동",description:"좋아하는 UI 프레임워크와 연결하세요",icon:"🔗",theme:{gradient:"from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20",borderColor:"border-orange-200 dark:border-orange-800",hoverBorder:"hover:border-orange-400 dark:hover:border-orange-600",tagBg:"bg-orange-100 dark:bg-orange-900/40",tagHover:"hover:bg-orange-200 dark:hover:bg-orange-800/60",textColor:"text-orange-900 dark:text-orange-100"},items:[{text:"React",link:"/guide/react"},{text:"Vue",link:"/guide/vue"},{text:"Svelte",link:"/guide/svelte"},{text:"Solid",link:"/guide/solid"}]}],Xn=f(()=>{const t=n=>{Je(n)};return()=>e("div",{children:[e("div",{class:"mb-12",children:[e("h1",{class:"text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4",children:"StateRef 문서"}),e("p",{class:"text-lg text-gray-600 dark:text-gray-400 mb-6",children:"데이터 불변성에 초점을 맞춘 범용 상태 관리 라이브러리"}),e("p",{class:"text-base text-gray-600 dark:text-gray-400",children:"StateRef는 프록시와 함수형 프로그래밍 렌즈 패턴을 결합하여 깊게 중첩된 데이터를 효율적이고 안전하게 접근하고 수정합니다."})]}),e("div",{class:"mb-12 grid gap-4 md:grid-cols-2",children:[e("div",{class:"p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10",children:[e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"🎯 세밀한 반응성"}),e("p",{class:"text-sm text-gray-600 dark:text-gray-400",children:"프록시 기반 추적으로 업데이트가 필요한 컴포넌트만 다시 렌더링됩니다"})]}),e("div",{class:"p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10",children:[e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"🔒 기본 불변성"}),e("p",{class:"text-sm text-gray-600 dark:text-gray-400",children:"Copy-on-write 패턴으로 변경 없이 안전한 상태 업데이트를 보장합니다"})]}),e("div",{class:"p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10",children:[e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"🔌 프레임워크 독립적"}),e("p",{class:"text-sm text-gray-600 dark:text-gray-400",children:"React, Vue, Svelte, Solid 등과 쉽게 통합됩니다"})]}),e("div",{class:"p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10",children:[e("h3",{class:"text-lg font-semibold text-gray-900 dark:text-white mb-2",children:"📦 경량"}),e("p",{class:"text-sm text-gray-600 dark:text-gray-400",children:"의존성 없이 작은 번들 크기를 유지합니다"})]})]}),e("div",{class:"space-y-6",children:Zn.map(n=>e("div",{class:`bg-gradient-to-r ${n.theme.gradient} rounded-lg border ${n.theme.borderColor} ${n.theme.hoverBorder} p-6 transition-all hover:shadow-xl`,children:[e("div",{class:"flex items-start gap-4 mb-4",children:[e("span",{class:"text-4xl flex-shrink-0",children:n.icon}),e("div",{class:"flex-1",children:[e("h2",{class:`text-2xl font-bold ${n.theme.textColor} mb-2`,children:n.title}),e("p",{class:"text-sm text-gray-700 dark:text-gray-300",children:n.description})]})]}),e("div",{class:"flex flex-wrap gap-2",children:n.items.map(o=>e("a",{href:o.link,onClick:c=>{c.preventDefault(),t(o.link)},class:`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${n.theme.tagBg} ${n.theme.tagHover} ${n.theme.textColor} transition-all hover:shadow-md`,children:o.text},o.link))})]},n.title))})]})});function Qn(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}function nr(t){return t instanceof Map?t.clear=t.delete=t.set=function(){throw new Error("map is read-only")}:t instanceof Set&&(t.add=t.clear=t.delete=function(){throw new Error("set is read-only")}),Object.freeze(t),Object.getOwnPropertyNames(t).forEach(n=>{const o=t[n],c=typeof o;(c==="object"||c==="function")&&!Object.isFrozen(o)&&nr(o)}),t}class Tt{constructor(n){n.data===void 0&&(n.data={}),this.data=n.data,this.isMatchIgnored=!1}ignoreMatch(){this.isMatchIgnored=!0}}function or(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;")}function Q(t,...n){const o=Object.create(null);for(const c in t)o[c]=t[c];return n.forEach(function(c){for(const a in c)o[a]=c[a]}),o}const eo="</span>",Wt=t=>!!t.scope,to=(t,{prefix:n})=>{if(t.startsWith("language:"))return t.replace("language:","language-");if(t.includes(".")){const o=t.split(".");return[`${n}${o.shift()}`,...o.map((c,a)=>`${c}${"_".repeat(a+1)}`)].join(" ")}return`${n}${t}`};class ro{constructor(n,o){this.buffer="",this.classPrefix=o.classPrefix,n.walk(this)}addText(n){this.buffer+=or(n)}openNode(n){if(!Wt(n))return;const o=to(n.scope,{prefix:this.classPrefix});this.span(o)}closeNode(n){Wt(n)&&(this.buffer+=eo)}value(){return this.buffer}span(n){this.buffer+=`<span class="${n}">`}}const At=(t={})=>{const n={children:[]};return Object.assign(n,t),n};class it{constructor(){this.rootNode=At(),this.stack=[this.rootNode]}get top(){return this.stack[this.stack.length-1]}get root(){return this.rootNode}add(n){this.top.children.push(n)}openNode(n){const o=At({scope:n});this.add(o),this.stack.push(o)}closeNode(){if(this.stack.length>1)return this.stack.pop()}closeAllNodes(){for(;this.closeNode(););}toJSON(){return JSON.stringify(this.rootNode,null,4)}walk(n){return this.constructor._walk(n,this.rootNode)}static _walk(n,o){return typeof o=="string"?n.addText(o):o.children&&(n.openNode(o),o.children.forEach(c=>this._walk(n,c)),n.closeNode(o)),n}static _collapse(n){typeof n!="string"&&n.children&&(n.children.every(o=>typeof o=="string")?n.children=[n.children.join("")]:n.children.forEach(o=>{it._collapse(o)}))}}class no extends it{constructor(n){super(),this.options=n}addText(n){n!==""&&this.add(n)}startScope(n){this.openNode(n)}endScope(){this.closeNode()}__addSublanguage(n,o){const c=n.root;o&&(c.scope=`language:${o}`),this.add(c)}toHTML(){return new ro(this,this.options).value()}finalize(){return this.closeAllNodes(),!0}}function xe(t){return t?typeof t=="string"?t:t.source:null}function cr(t){return ne("(?=",t,")")}function oo(t){return ne("(?:",t,")*")}function co(t){return ne("(?:",t,")?")}function ne(...t){return t.map(o=>xe(o)).join("")}function ao(t){const n=t[t.length-1];return typeof n=="object"&&n.constructor===Object?(t.splice(t.length-1,1),n):{}}function lt(...t){return"("+(ao(t).capture?"":"?:")+t.map(c=>xe(c)).join("|")+")"}function ar(t){return new RegExp(t.toString()+"|").exec("").length-1}function io(t,n){const o=t&&t.exec(n);return o&&o.index===0}const lo=/\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;function st(t,{joinWith:n}){let o=0;return t.map(c=>{o+=1;const a=o;let l=xe(c),i="";for(;l.length>0;){const s=lo.exec(l);if(!s){i+=l;break}i+=l.substring(0,s.index),l=l.substring(s.index+s[0].length),s[0][0]==="\\"&&s[1]?i+="\\"+String(Number(s[1])+a):(i+=s[0],s[0]==="("&&o++)}return i}).map(c=>`(${c})`).join(n)}const so=/\b\B/,ir="[a-zA-Z]\\w*",dt="[a-zA-Z_]\\w*",lr="\\b\\d+(\\.\\d+)?",sr="(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)",dr="\\b(0b[01]+)",ho="!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~",uo=(t={})=>{const n=/^#![ ]*\//;return t.binary&&(t.begin=ne(n,/.*\b/,t.binary,/\b.*/)),Q({scope:"meta",begin:n,end:/$/,relevance:0,"on:begin":(o,c)=>{o.index!==0&&c.ignoreMatch()}},t)},Re={begin:"\\\\[\\s\\S]",relevance:0},po={scope:"string",begin:"'",end:"'",illegal:"\\n",contains:[Re]},go={scope:"string",begin:'"',end:'"',illegal:"\\n",contains:[Re]},mo={begin:/\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/},He=function(t,n,o={}){const c=Q({scope:"comment",begin:t,end:n,contains:[]},o);c.contains.push({scope:"doctag",begin:"[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",end:/(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,excludeBegin:!0,relevance:0});const a=lt("I","a","is","so","us","to","at","if","in","it","on",/[A-Za-z]+['](d|ve|re|ll|t|s|n)/,/[A-Za-z]+[-][a-z]+/,/[A-Za-z][a-z]{2,}/);return c.contains.push({begin:ne(/[ ]+/,"(",a,/[.]?[:]?([.][ ]|[ ])/,"){3}")}),c},fo=He("//","$"),bo=He("/\\*","\\*/"),yo=He("#","$"),vo={scope:"number",begin:lr,relevance:0},So={scope:"number",begin:sr,relevance:0},wo={scope:"number",begin:dr,relevance:0},xo={scope:"regexp",begin:/\/(?=[^/\n]*\/)/,end:/\/[gimuy]*/,contains:[Re,{begin:/\[/,end:/\]/,relevance:0,contains:[Re]}]},Ro={scope:"title",begin:ir,relevance:0},ko={scope:"title",begin:dt,relevance:0},Co={begin:"\\.\\s*"+dt,relevance:0},To=function(t){return Object.assign(t,{"on:begin":(n,o)=>{o.data._beginMatch=n[1]},"on:end":(n,o)=>{o.data._beginMatch!==n[1]&&o.ignoreMatch()}})};var Ae=Object.freeze({__proto__:null,APOS_STRING_MODE:po,BACKSLASH_ESCAPE:Re,BINARY_NUMBER_MODE:wo,BINARY_NUMBER_RE:dr,COMMENT:He,C_BLOCK_COMMENT_MODE:bo,C_LINE_COMMENT_MODE:fo,C_NUMBER_MODE:So,C_NUMBER_RE:sr,END_SAME_AS_BEGIN:To,HASH_COMMENT_MODE:yo,IDENT_RE:ir,MATCH_NOTHING_RE:so,METHOD_GUARD:Co,NUMBER_MODE:vo,NUMBER_RE:lr,PHRASAL_WORDS_MODE:mo,QUOTE_STRING_MODE:go,REGEXP_MODE:xo,RE_STARTERS_RE:ho,SHEBANG:uo,TITLE_MODE:Ro,UNDERSCORE_IDENT_RE:dt,UNDERSCORE_TITLE_MODE:ko});function Wo(t,n){t.input[t.index-1]==="."&&n.ignoreMatch()}function Ao(t,n){t.className!==void 0&&(t.scope=t.className,delete t.className)}function Eo(t,n){n&&t.beginKeywords&&(t.begin="\\b("+t.beginKeywords.split(" ").join("|")+")(?!\\.)(?=\\b|\\s)",t.__beforeBegin=Wo,t.keywords=t.keywords||t.beginKeywords,delete t.beginKeywords,t.relevance===void 0&&(t.relevance=0))}function No(t,n){Array.isArray(t.illegal)&&(t.illegal=lt(...t.illegal))}function Io(t,n){if(t.match){if(t.begin||t.end)throw new Error("begin & end are not supported with match");t.begin=t.match,delete t.match}}function Mo(t,n){t.relevance===void 0&&(t.relevance=1)}const Po=(t,n)=>{if(!t.beforeMatch)return;if(t.starts)throw new Error("beforeMatch cannot be used with starts");const o=Object.assign({},t);Object.keys(t).forEach(c=>{delete t[c]}),t.keywords=o.keywords,t.begin=ne(o.beforeMatch,cr(o.begin)),t.starts={relevance:0,contains:[Object.assign(o,{endsParent:!0})]},t.relevance=0,delete o.beforeMatch},Oo=["of","and","for","in","not","or","if","then","parent","list","value"],_o="keyword";function hr(t,n,o=_o){const c=Object.create(null);return typeof t=="string"?a(o,t.split(" ")):Array.isArray(t)?a(o,t):Object.keys(t).forEach(function(l){Object.assign(c,hr(t[l],n,l))}),c;function a(l,i){n&&(i=i.map(s=>s.toLowerCase())),i.forEach(function(s){const d=s.split("|");c[d[0]]=[l,Lo(d[0],d[1])]})}}function Lo(t,n){return n?Number(n):Uo(t)?0:1}function Uo(t){return Oo.includes(t.toLowerCase())}const Et={},re=t=>{console.error(t)},Nt=(t,...n)=>{console.log(`WARN: ${t}`,...n)},ae=(t,n)=>{Et[`${t}/${n}`]||(console.log(`Deprecated as of ${t}. ${n}`),Et[`${t}/${n}`]=!0)},Me=new Error;function ur(t,n,{key:o}){let c=0;const a=t[o],l={},i={};for(let s=1;s<=n.length;s++)i[s+c]=a[s],l[s+c]=!0,c+=ar(n[s-1]);t[o]=i,t[o]._emit=l,t[o]._multi=!0}function Do(t){if(Array.isArray(t.begin)){if(t.skip||t.excludeBegin||t.returnBegin)throw re("skip, excludeBegin, returnBegin not compatible with beginScope: {}"),Me;if(typeof t.beginScope!="object"||t.beginScope===null)throw re("beginScope must be object"),Me;ur(t,t.begin,{key:"beginScope"}),t.begin=st(t.begin,{joinWith:""})}}function Fo(t){if(Array.isArray(t.end)){if(t.skip||t.excludeEnd||t.returnEnd)throw re("skip, excludeEnd, returnEnd not compatible with endScope: {}"),Me;if(typeof t.endScope!="object"||t.endScope===null)throw re("endScope must be object"),Me;ur(t,t.end,{key:"endScope"}),t.end=st(t.end,{joinWith:""})}}function Vo(t){t.scope&&typeof t.scope=="object"&&t.scope!==null&&(t.beginScope=t.scope,delete t.scope)}function Bo(t){Vo(t),typeof t.beginScope=="string"&&(t.beginScope={_wrap:t.beginScope}),typeof t.endScope=="string"&&(t.endScope={_wrap:t.endScope}),Do(t),Fo(t)}function $o(t){function n(i,s){return new RegExp(xe(i),"m"+(t.case_insensitive?"i":"")+(t.unicodeRegex?"u":"")+(s?"g":""))}class o{constructor(){this.matchIndexes={},this.regexes=[],this.matchAt=1,this.position=0}addRule(s,d){d.position=this.position++,this.matchIndexes[this.matchAt]=d,this.regexes.push([d,s]),this.matchAt+=ar(s)+1}compile(){this.regexes.length===0&&(this.exec=()=>null);const s=this.regexes.map(d=>d[1]);this.matcherRe=n(st(s,{joinWith:"|"}),!0),this.lastIndex=0}exec(s){this.matcherRe.lastIndex=this.lastIndex;const d=this.matcherRe.exec(s);if(!d)return null;const b=d.findIndex((R,x)=>x>0&&R!==void 0),S=this.matchIndexes[b];return d.splice(0,b),Object.assign(d,S)}}class c{constructor(){this.rules=[],this.multiRegexes=[],this.count=0,this.lastIndex=0,this.regexIndex=0}getMatcher(s){if(this.multiRegexes[s])return this.multiRegexes[s];const d=new o;return this.rules.slice(s).forEach(([b,S])=>d.addRule(b,S)),d.compile(),this.multiRegexes[s]=d,d}resumingScanAtSamePosition(){return this.regexIndex!==0}considerAll(){this.regexIndex=0}addRule(s,d){this.rules.push([s,d]),d.type==="begin"&&this.count++}exec(s){const d=this.getMatcher(this.regexIndex);d.lastIndex=this.lastIndex;let b=d.exec(s);if(this.resumingScanAtSamePosition()&&!(b&&b.index===this.lastIndex)){const S=this.getMatcher(0);S.lastIndex=this.lastIndex+1,b=S.exec(s)}return b&&(this.regexIndex+=b.position+1,this.regexIndex===this.count&&this.considerAll()),b}}function a(i){const s=new c;return i.contains.forEach(d=>s.addRule(d.begin,{rule:d,type:"begin"})),i.terminatorEnd&&s.addRule(i.terminatorEnd,{type:"end"}),i.illegal&&s.addRule(i.illegal,{type:"illegal"}),s}function l(i,s){const d=i;if(i.isCompiled)return d;[Ao,Io,Bo,Po].forEach(S=>S(i,s)),t.compilerExtensions.forEach(S=>S(i,s)),i.__beforeBegin=null,[Eo,No,Mo].forEach(S=>S(i,s)),i.isCompiled=!0;let b=null;return typeof i.keywords=="object"&&i.keywords.$pattern&&(i.keywords=Object.assign({},i.keywords),b=i.keywords.$pattern,delete i.keywords.$pattern),b=b||/\w+/,i.keywords&&(i.keywords=hr(i.keywords,t.case_insensitive)),d.keywordPatternRe=n(b,!0),s&&(i.begin||(i.begin=/\B|\b/),d.beginRe=n(d.begin),!i.end&&!i.endsWithParent&&(i.end=/\B|\b/),i.end&&(d.endRe=n(d.end)),d.terminatorEnd=xe(d.end)||"",i.endsWithParent&&s.terminatorEnd&&(d.terminatorEnd+=(i.end?"|":"")+s.terminatorEnd)),i.illegal&&(d.illegalRe=n(i.illegal)),i.contains||(i.contains=[]),i.contains=[].concat(...i.contains.map(function(S){return jo(S==="self"?i:S)})),i.contains.forEach(function(S){l(S,d)}),i.starts&&l(i.starts,s),d.matcher=a(d),d}if(t.compilerExtensions||(t.compilerExtensions=[]),t.contains&&t.contains.includes("self"))throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");return t.classNameAliases=Q(t.classNameAliases||{}),l(t)}function pr(t){return t?t.endsWithParent||pr(t.starts):!1}function jo(t){return t.variants&&!t.cachedVariants&&(t.cachedVariants=t.variants.map(function(n){return Q(t,{variants:null},n)})),t.cachedVariants?t.cachedVariants:pr(t)?Q(t,{starts:t.starts?Q(t.starts):null}):Object.isFrozen(t)?Q(t):t}var Jo="11.11.1";class Ho extends Error{constructor(n,o){super(n),this.name="HTMLInjectionError",this.html=o}}const Ze=or,It=Q,Mt=Symbol("nomatch"),Ko=7,gr=function(t){const n=Object.create(null),o=Object.create(null),c=[];let a=!0;const l="Could not find the language '{}', did you forget to load/include a language module?",i={disableAutodetect:!0,name:"Plain text",contains:[]};let s={ignoreUnescapedHTML:!1,throwUnescapedHTML:!1,noHighlightRe:/^(no-?highlight)$/i,languageDetectRe:/\blang(?:uage)?-([\w-]+)\b/i,classPrefix:"hljs-",cssSelector:"pre code",languages:null,__emitter:no};function d(h){return s.noHighlightRe.test(h)}function b(h){let g=h.className+" ";g+=h.parentNode?h.parentNode.className:"";const p=s.languageDetectRe.exec(g);if(p){const v=L(p[1]);return v||(Nt(l.replace("{}",p[1])),Nt("Falling back to no-highlight mode for this block.",h)),v?p[1]:"no-highlight"}return g.split(/\s+/).find(v=>d(v)||L(v))}function S(h,g,p){let v="",k="";typeof g=="object"?(v=h,p=g.ignoreIllegals,k=g.language):(ae("10.7.0","highlight(lang, code, ...args) has been deprecated."),ae("10.7.0",`Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`),k=h,v=g),p===void 0&&(p=!0);const N={code:v,language:k};Z("before:highlight",N);const P=N.result?N.result:R(N.language,N.code,p);return P.code=N.code,Z("after:highlight",P),P}function R(h,g,p,v){const k=Object.create(null);function N(u,m){return u.keywords[m]}function P(){if(!y.keywords){I.addText(A);return}let u=0;y.keywordPatternRe.lastIndex=0;let m=y.keywordPatternRe.exec(A),w="";for(;m;){w+=A.substring(u,m.index);const C=K.case_insensitive?m[0].toLowerCase():m[0],O=N(y,C);if(O){const[G,Ir]=O;if(I.addText(w),w="",k[C]=(k[C]||0)+1,k[C]<=Ko&&(Te+=Ir),G.startsWith("_"))w+=m[0];else{const Mr=K.classNameAliases[G]||G;H(m[0],Mr)}}else w+=m[0];u=y.keywordPatternRe.lastIndex,m=y.keywordPatternRe.exec(A)}w+=A.substring(u),I.addText(w)}function J(){if(A==="")return;let u=null;if(typeof y.subLanguage=="string"){if(!n[y.subLanguage]){I.addText(A);return}u=R(y.subLanguage,A,!0,bt[y.subLanguage]),bt[y.subLanguage]=u._top}else u=T(A,y.subLanguage.length?y.subLanguage:null);y.relevance>0&&(Te+=u.relevance),I.__addSublanguage(u._emitter,u.language)}function D(){y.subLanguage!=null?J():P(),A=""}function H(u,m){u!==""&&(I.startScope(m),I.addText(u),I.endScope())}function pt(u,m){let w=1;const C=m.length-1;for(;w<=C;){if(!u._emit[w]){w++;continue}const O=K.classNameAliases[u[w]]||u[w],G=m[w];O?H(G,O):(A=G,P(),A=""),w++}}function gt(u,m){return u.scope&&typeof u.scope=="string"&&I.openNode(K.classNameAliases[u.scope]||u.scope),u.beginScope&&(u.beginScope._wrap?(H(A,K.classNameAliases[u.beginScope._wrap]||u.beginScope._wrap),A=""):u.beginScope._multi&&(pt(u.beginScope,m),A="")),y=Object.create(u,{parent:{value:y}}),y}function mt(u,m,w){let C=io(u.endRe,w);if(C){if(u["on:end"]){const O=new Tt(u);u["on:end"](m,O),O.isMatchIgnored&&(C=!1)}if(C){for(;u.endsParent&&u.parent;)u=u.parent;return u}}if(u.endsWithParent)return mt(u.parent,m,w)}function Tr(u){return y.matcher.regexIndex===0?(A+=u[0],1):(Ge=!0,0)}function Wr(u){const m=u[0],w=u.rule,C=new Tt(w),O=[w.__beforeBegin,w["on:begin"]];for(const G of O)if(G&&(G(u,C),C.isMatchIgnored))return Tr(m);return w.skip?A+=m:(w.excludeBegin&&(A+=m),D(),!w.returnBegin&&!w.excludeBegin&&(A=m)),gt(w,u),w.returnBegin?0:m.length}function Ar(u){const m=u[0],w=g.substring(u.index),C=mt(y,u,w);if(!C)return Mt;const O=y;y.endScope&&y.endScope._wrap?(D(),H(m,y.endScope._wrap)):y.endScope&&y.endScope._multi?(D(),pt(y.endScope,u)):O.skip?A+=m:(O.returnEnd||O.excludeEnd||(A+=m),D(),O.excludeEnd&&(A=m));do y.scope&&I.closeNode(),!y.skip&&!y.subLanguage&&(Te+=y.relevance),y=y.parent;while(y!==C.parent);return C.starts&&gt(C.starts,u),O.returnEnd?0:m.length}function Er(){const u=[];for(let m=y;m!==K;m=m.parent)m.scope&&u.unshift(m.scope);u.forEach(m=>I.openNode(m))}let Ce={};function ft(u,m){const w=m&&m[0];if(A+=u,w==null)return D(),0;if(Ce.type==="begin"&&m.type==="end"&&Ce.index===m.index&&w===""){if(A+=g.slice(m.index,m.index+1),!a){const C=new Error(`0 width match regex (${h})`);throw C.languageName=h,C.badRule=Ce.rule,C}return 1}if(Ce=m,m.type==="begin")return Wr(m);if(m.type==="illegal"&&!p){const C=new Error('Illegal lexeme "'+w+'" for mode "'+(y.scope||"<unnamed>")+'"');throw C.mode=y,C}else if(m.type==="end"){const C=Ar(m);if(C!==Mt)return C}if(m.type==="illegal"&&w==="")return A+=`
`,1;if(ze>1e5&&ze>m.index*3)throw new Error("potential infinite loop, way more iterations than matches");return A+=w,w.length}const K=L(h);if(!K)throw re(l.replace("{}",h)),new Error('Unknown language: "'+h+'"');const Nr=$o(K);let Ke="",y=v||Nr;const bt={},I=new s.__emitter(s);Er();let A="",Te=0,te=0,ze=0,Ge=!1;try{if(K.__emitTokens)K.__emitTokens(g,I);else{for(y.matcher.considerAll();;){ze++,Ge?Ge=!1:y.matcher.considerAll(),y.matcher.lastIndex=te;const u=y.matcher.exec(g);if(!u)break;const m=g.substring(te,u.index),w=ft(m,u);te=u.index+w}ft(g.substring(te))}return I.finalize(),Ke=I.toHTML(),{language:h,value:Ke,relevance:Te,illegal:!1,_emitter:I,_top:y}}catch(u){if(u.message&&u.message.includes("Illegal"))return{language:h,value:Ze(g),illegal:!0,relevance:0,_illegalBy:{message:u.message,index:te,context:g.slice(te-100,te+100),mode:u.mode,resultSoFar:Ke},_emitter:I};if(a)return{language:h,value:Ze(g),illegal:!1,relevance:0,errorRaised:u,_emitter:I,_top:y};throw u}}function x(h){const g={value:Ze(h),illegal:!1,relevance:0,_top:i,_emitter:new s.__emitter(s)};return g._emitter.addText(h),g}function T(h,g){g=g||s.languages||Object.keys(n);const p=x(h),v=g.filter(L).filter(ce).map(D=>R(D,h,!1));v.unshift(p);const k=v.sort((D,H)=>{if(D.relevance!==H.relevance)return H.relevance-D.relevance;if(D.language&&H.language){if(L(D.language).supersetOf===H.language)return 1;if(L(H.language).supersetOf===D.language)return-1}return 0}),[N,P]=k,J=N;return J.secondBest=P,J}function E(h,g,p){const v=g&&o[g]||p;h.classList.add("hljs"),h.classList.add(`language-${v}`)}function W(h){let g=null;const p=b(h);if(d(p))return;if(Z("before:highlightElement",{el:h,language:p}),h.dataset.highlighted){console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.",h);return}if(h.children.length>0&&(s.ignoreUnescapedHTML||(console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."),console.warn("https://github.com/highlightjs/highlight.js/wiki/security"),console.warn("The element with unescaped HTML:"),console.warn(h)),s.throwUnescapedHTML))throw new Ho("One of your code blocks includes unescaped HTML.",h.innerHTML);g=h;const v=g.textContent,k=p?S(v,{language:p,ignoreIllegals:!0}):T(v);h.innerHTML=k.value,h.dataset.highlighted="yes",E(h,p,k.language),h.result={language:k.language,re:k.relevance,relevance:k.relevance},k.secondBest&&(h.secondBest={language:k.secondBest.language,relevance:k.secondBest.relevance}),Z("after:highlightElement",{el:h,result:k,text:v})}function _(h){s=It(s,h)}const z=()=>{$(),ae("10.6.0","initHighlighting() deprecated.  Use highlightAll() now.")};function M(){$(),ae("10.6.0","initHighlightingOnLoad() deprecated.  Use highlightAll() now.")}let B=!1;function $(){function h(){$()}if(document.readyState==="loading"){B||window.addEventListener("DOMContentLoaded",h,!1),B=!0;return}document.querySelectorAll(s.cssSelector).forEach(W)}function j(h,g){let p=null;try{p=g(t)}catch(v){if(re("Language definition for '{}' could not be registered.".replace("{}",h)),a)re(v);else throw v;p=i}p.name||(p.name=h),n[h]=p,p.rawDefinition=g.bind(null,t),p.aliases&&oe(p.aliases,{languageName:h})}function U(h){delete n[h];for(const g of Object.keys(o))o[g]===h&&delete o[g]}function pe(){return Object.keys(n)}function L(h){return h=(h||"").toLowerCase(),n[h]||n[o[h]]}function oe(h,{languageName:g}){typeof h=="string"&&(h=[h]),h.forEach(p=>{o[p.toLowerCase()]=g})}function ce(h){const g=L(h);return g&&!g.disableAutodetect}function ge(h){h["before:highlightBlock"]&&!h["before:highlightElement"]&&(h["before:highlightElement"]=g=>{h["before:highlightBlock"](Object.assign({block:g.el},g))}),h["after:highlightBlock"]&&!h["after:highlightElement"]&&(h["after:highlightElement"]=g=>{h["after:highlightBlock"](Object.assign({block:g.el},g))})}function me(h){ge(h),c.push(h)}function fe(h){const g=c.indexOf(h);g!==-1&&c.splice(g,1)}function Z(h,g){const p=h;c.forEach(function(v){v[p]&&v[p](g)})}function be(h){return ae("10.7.0","highlightBlock will be removed entirely in v12.0"),ae("10.7.0","Please use highlightElement now."),W(h)}Object.assign(t,{highlight:S,highlightAuto:T,highlightAll:$,highlightElement:W,highlightBlock:be,configure:_,initHighlighting:z,initHighlightingOnLoad:M,registerLanguage:j,unregisterLanguage:U,listLanguages:pe,getLanguage:L,registerAliases:oe,autoDetection:ce,inherit:It,addPlugin:me,removePlugin:fe}),t.debugMode=function(){a=!1},t.safeMode=function(){a=!0},t.versionString=Jo,t.regex={concat:ne,lookahead:cr,either:lt,optional:co,anyNumberOfTimes:oo};for(const h in Ae)typeof Ae[h]=="object"&&nr(Ae[h]);return Object.assign(t,Ae),t},de=gr({});de.newInstance=()=>gr({});var zo=de;de.HighlightJS=de;de.default=de;const F=Qn(zo),Pe="[A-Za-z$_][0-9A-Za-z$_]*",mr=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends","using"],fr=["true","false","null","undefined","NaN","Infinity"],br=["Object","Function","Boolean","Symbol","Math","Date","Number","BigInt","String","RegExp","Array","Float32Array","Float64Array","Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Int32Array","Uint16Array","Uint32Array","BigInt64Array","BigUint64Array","Set","Map","WeakSet","WeakMap","ArrayBuffer","SharedArrayBuffer","Atomics","DataView","JSON","Promise","Generator","GeneratorFunction","AsyncFunction","Reflect","Proxy","Intl","WebAssembly"],yr=["Error","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],vr=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],Sr=["arguments","this","super","console","window","document","localStorage","sessionStorage","module","global"],wr=[].concat(vr,br,yr);function Go(t){const n=t.regex,o=(p,{after:v})=>{const k="</"+p[0].slice(1);return p.input.indexOf(k,v)!==-1},c=Pe,a={begin:"<>",end:"</>"},l=/<[A-Za-z0-9\\._:-]+\s*\/>/,i={begin:/<[A-Za-z0-9\\._:-]+/,end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(p,v)=>{const k=p[0].length+p.index,N=p.input[k];if(N==="<"||N===","){v.ignoreMatch();return}N===">"&&(o(p,{after:k})||v.ignoreMatch());let P;const J=p.input.substring(k);if(P=J.match(/^\s*=/)){v.ignoreMatch();return}if((P=J.match(/^\s+extends\s+/))&&P.index===0){v.ignoreMatch();return}}},s={$pattern:Pe,keyword:mr,literal:fr,built_in:wr,"variable.language":Sr},d="[0-9](_?[0-9])*",b=`\\.(${d})`,S="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",R={className:"number",variants:[{begin:`(\\b(${S})((${b})|\\.)?|(${b}))[eE][+-]?(${d})\\b`},{begin:`\\b(${S})\\b((${b})\\b|\\.)?|(${b})\\b`},{begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{begin:"\\b0[0-7]+n?\\b"}],relevance:0},x={className:"subst",begin:"\\$\\{",end:"\\}",keywords:s,contains:[]},T={begin:".?html`",end:"",starts:{end:"`",returnEnd:!1,contains:[t.BACKSLASH_ESCAPE,x],subLanguage:"xml"}},E={begin:".?css`",end:"",starts:{end:"`",returnEnd:!1,contains:[t.BACKSLASH_ESCAPE,x],subLanguage:"css"}},W={begin:".?gql`",end:"",starts:{end:"`",returnEnd:!1,contains:[t.BACKSLASH_ESCAPE,x],subLanguage:"graphql"}},_={className:"string",begin:"`",end:"`",contains:[t.BACKSLASH_ESCAPE,x]},M={className:"comment",variants:[t.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,excludeBegin:!0,relevance:0},{className:"variable",begin:c+"(?=\\s*(-)|$)",endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]}),t.C_BLOCK_COMMENT_MODE,t.C_LINE_COMMENT_MODE]},B=[t.APOS_STRING_MODE,t.QUOTE_STRING_MODE,T,E,W,_,{match:/\$\d+/},R];x.contains=B.concat({begin:/\{/,end:/\}/,keywords:s,contains:["self"].concat(B)});const $=[].concat(M,x.contains),j=$.concat([{begin:/(\s*)\(/,end:/\)/,keywords:s,contains:["self"].concat($)}]),U={className:"params",begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:s,contains:j},pe={variants:[{match:[/class/,/\s+/,c,/\s+/,/extends/,/\s+/,n.concat(c,"(",n.concat(/\./,c),")*")],scope:{1:"keyword",3:"title.class",5:"keyword",7:"title.class.inherited"}},{match:[/class/,/\s+/,c],scope:{1:"keyword",3:"title.class"}}]},L={relevance:0,match:n.either(/\bJSON/,/\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,/\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,/\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),className:"title.class",keywords:{_:[...br,...yr]}},oe={label:"use_strict",className:"meta",relevance:10,begin:/^\s*['"]use (strict|asm)['"]/},ce={variants:[{match:[/function/,/\s+/,c,/(?=\s*\()/]},{match:[/function/,/\s*(?=\()/]}],className:{1:"keyword",3:"title.function"},label:"func.def",contains:[U],illegal:/%/},ge={relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,className:"variable.constant"};function me(p){return n.concat("(?!",p.join("|"),")")}const fe={match:n.concat(/\b/,me([...vr,"super","import"].map(p=>`${p}\\s*\\(`)),c,n.lookahead(/\s*\(/)),className:"title.function",relevance:0},Z={begin:n.concat(/\./,n.lookahead(n.concat(c,/(?![0-9A-Za-z$_(])/))),end:c,excludeBegin:!0,keywords:"prototype",className:"property",relevance:0},be={match:[/get|set/,/\s+/,c,/(?=\()/],className:{1:"keyword",3:"title.function"},contains:[{begin:/\(\)/},U]},h="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+t.UNDERSCORE_IDENT_RE+")\\s*=>",g={match:[/const|var|let/,/\s+/,c,/\s*/,/=\s*/,/(async\s*)?/,n.lookahead(h)],keywords:"async",className:{1:"keyword",3:"title.function"},contains:[U]};return{name:"JavaScript",aliases:["js","jsx","mjs","cjs"],keywords:s,exports:{PARAMS_CONTAINS:j,CLASS_REFERENCE:L},illegal:/#(?![$_A-z])/,contains:[t.SHEBANG({label:"shebang",binary:"node",relevance:5}),oe,t.APOS_STRING_MODE,t.QUOTE_STRING_MODE,T,E,W,_,M,{match:/\$\d+/},R,L,{scope:"attr",match:c+n.lookahead(":"),relevance:0},g,{begin:"("+t.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",keywords:"return throw case",relevance:0,contains:[M,t.REGEXP_MODE,{className:"function",begin:h,returnBegin:!0,end:"\\s*=>",contains:[{className:"params",variants:[{begin:t.UNDERSCORE_IDENT_RE,relevance:0},{className:null,begin:/\(\s*\)/,skip:!0},{begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:s,contains:j}]}]},{begin:/,/,relevance:0},{match:/\s+/,relevance:0},{variants:[{begin:a.begin,end:a.end},{match:l},{begin:i.begin,"on:begin":i.isTrulyOpeningTag,end:i.end}],subLanguage:"xml",contains:[{begin:i.begin,end:i.end,skip:!0,contains:["self"]}]}]},ce,{beginKeywords:"while if switch catch for"},{begin:"\\b(?!function)"+t.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",returnBegin:!0,label:"func.def",contains:[U,t.inherit(t.TITLE_MODE,{begin:c,className:"title.function"})]},{match:/\.\.\./,relevance:0},Z,{match:"\\$"+c,relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},contains:[U]},fe,ge,pe,be,{match:/\$[(.]/}]}}function ht(t){const n=t.regex,o=Go(t),c=Pe,a=["any","void","number","boolean","string","object","never","symbol","bigint","unknown"],l={begin:[/namespace/,/\s+/,t.IDENT_RE],beginScope:{1:"keyword",3:"title.class"}},i={beginKeywords:"interface",end:/\{/,excludeEnd:!0,keywords:{keyword:"interface extends",built_in:a},contains:[o.exports.CLASS_REFERENCE]},s={className:"meta",relevance:10,begin:/^\s*['"]use strict['"]/},d=["type","interface","public","private","protected","implements","declare","abstract","readonly","enum","override","satisfies"],b={$pattern:Pe,keyword:mr.concat(d),literal:fr,built_in:wr.concat(a),"variable.language":Sr},S={className:"meta",begin:"@"+c},R=(W,_,z)=>{const M=W.contains.findIndex(B=>B.label===_);if(M===-1)throw new Error("can not find mode to replace");W.contains.splice(M,1,z)};Object.assign(o.keywords,b),o.exports.PARAMS_CONTAINS.push(S);const x=o.contains.find(W=>W.scope==="attr"),T=Object.assign({},x,{match:n.concat(c,n.lookahead(/\s*\?:/))});o.exports.PARAMS_CONTAINS.push([o.exports.CLASS_REFERENCE,x,T]),o.contains=o.contains.concat([S,l,i,T]),R(o,"shebang",t.SHEBANG()),R(o,"use_strict",s);const E=o.contains.find(W=>W.label==="func.def");return E.relevance=0,Object.assign(o,{name:"TypeScript",aliases:["ts","tsx","mts","cts"]}),o}const Pt="[A-Za-z$_][0-9A-Za-z$_]*",qo=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends","using"],Yo=["true","false","null","undefined","NaN","Infinity"],xr=["Object","Function","Boolean","Symbol","Math","Date","Number","BigInt","String","RegExp","Array","Float32Array","Float64Array","Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Int32Array","Uint16Array","Uint32Array","BigInt64Array","BigUint64Array","Set","Map","WeakSet","WeakMap","ArrayBuffer","SharedArrayBuffer","Atomics","DataView","JSON","Promise","Generator","GeneratorFunction","AsyncFunction","Reflect","Proxy","Intl","WebAssembly"],Rr=["Error","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],kr=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],Zo=["arguments","this","super","console","window","document","localStorage","sessionStorage","module","global"],Xo=[].concat(kr,xr,Rr);function Cr(t){const n=t.regex,o=(p,{after:v})=>{const k="</"+p[0].slice(1);return p.input.indexOf(k,v)!==-1},c=Pt,a={begin:"<>",end:"</>"},l=/<[A-Za-z0-9\\._:-]+\s*\/>/,i={begin:/<[A-Za-z0-9\\._:-]+/,end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(p,v)=>{const k=p[0].length+p.index,N=p.input[k];if(N==="<"||N===","){v.ignoreMatch();return}N===">"&&(o(p,{after:k})||v.ignoreMatch());let P;const J=p.input.substring(k);if(P=J.match(/^\s*=/)){v.ignoreMatch();return}if((P=J.match(/^\s+extends\s+/))&&P.index===0){v.ignoreMatch();return}}},s={$pattern:Pt,keyword:qo,literal:Yo,built_in:Xo,"variable.language":Zo},d="[0-9](_?[0-9])*",b=`\\.(${d})`,S="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",R={className:"number",variants:[{begin:`(\\b(${S})((${b})|\\.)?|(${b}))[eE][+-]?(${d})\\b`},{begin:`\\b(${S})\\b((${b})\\b|\\.)?|(${b})\\b`},{begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{begin:"\\b0[0-7]+n?\\b"}],relevance:0},x={className:"subst",begin:"\\$\\{",end:"\\}",keywords:s,contains:[]},T={begin:".?html`",end:"",starts:{end:"`",returnEnd:!1,contains:[t.BACKSLASH_ESCAPE,x],subLanguage:"xml"}},E={begin:".?css`",end:"",starts:{end:"`",returnEnd:!1,contains:[t.BACKSLASH_ESCAPE,x],subLanguage:"css"}},W={begin:".?gql`",end:"",starts:{end:"`",returnEnd:!1,contains:[t.BACKSLASH_ESCAPE,x],subLanguage:"graphql"}},_={className:"string",begin:"`",end:"`",contains:[t.BACKSLASH_ESCAPE,x]},M={className:"comment",variants:[t.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,excludeBegin:!0,relevance:0},{className:"variable",begin:c+"(?=\\s*(-)|$)",endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]}),t.C_BLOCK_COMMENT_MODE,t.C_LINE_COMMENT_MODE]},B=[t.APOS_STRING_MODE,t.QUOTE_STRING_MODE,T,E,W,_,{match:/\$\d+/},R];x.contains=B.concat({begin:/\{/,end:/\}/,keywords:s,contains:["self"].concat(B)});const $=[].concat(M,x.contains),j=$.concat([{begin:/(\s*)\(/,end:/\)/,keywords:s,contains:["self"].concat($)}]),U={className:"params",begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:s,contains:j},pe={variants:[{match:[/class/,/\s+/,c,/\s+/,/extends/,/\s+/,n.concat(c,"(",n.concat(/\./,c),")*")],scope:{1:"keyword",3:"title.class",5:"keyword",7:"title.class.inherited"}},{match:[/class/,/\s+/,c],scope:{1:"keyword",3:"title.class"}}]},L={relevance:0,match:n.either(/\bJSON/,/\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,/\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,/\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),className:"title.class",keywords:{_:[...xr,...Rr]}},oe={label:"use_strict",className:"meta",relevance:10,begin:/^\s*['"]use (strict|asm)['"]/},ce={variants:[{match:[/function/,/\s+/,c,/(?=\s*\()/]},{match:[/function/,/\s*(?=\()/]}],className:{1:"keyword",3:"title.function"},label:"func.def",contains:[U],illegal:/%/},ge={relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,className:"variable.constant"};function me(p){return n.concat("(?!",p.join("|"),")")}const fe={match:n.concat(/\b/,me([...kr,"super","import"].map(p=>`${p}\\s*\\(`)),c,n.lookahead(/\s*\(/)),className:"title.function",relevance:0},Z={begin:n.concat(/\./,n.lookahead(n.concat(c,/(?![0-9A-Za-z$_(])/))),end:c,excludeBegin:!0,keywords:"prototype",className:"property",relevance:0},be={match:[/get|set/,/\s+/,c,/(?=\()/],className:{1:"keyword",3:"title.function"},contains:[{begin:/\(\)/},U]},h="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+t.UNDERSCORE_IDENT_RE+")\\s*=>",g={match:[/const|var|let/,/\s+/,c,/\s*/,/=\s*/,/(async\s*)?/,n.lookahead(h)],keywords:"async",className:{1:"keyword",3:"title.function"},contains:[U]};return{name:"JavaScript",aliases:["js","jsx","mjs","cjs"],keywords:s,exports:{PARAMS_CONTAINS:j,CLASS_REFERENCE:L},illegal:/#(?![$_A-z])/,contains:[t.SHEBANG({label:"shebang",binary:"node",relevance:5}),oe,t.APOS_STRING_MODE,t.QUOTE_STRING_MODE,T,E,W,_,M,{match:/\$\d+/},R,L,{scope:"attr",match:c+n.lookahead(":"),relevance:0},g,{begin:"("+t.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",keywords:"return throw case",relevance:0,contains:[M,t.REGEXP_MODE,{className:"function",begin:h,returnBegin:!0,end:"\\s*=>",contains:[{className:"params",variants:[{begin:t.UNDERSCORE_IDENT_RE,relevance:0},{className:null,begin:/\(\s*\)/,skip:!0},{begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:s,contains:j}]}]},{begin:/,/,relevance:0},{match:/\s+/,relevance:0},{variants:[{begin:a.begin,end:a.end},{match:l},{begin:i.begin,"on:begin":i.isTrulyOpeningTag,end:i.end}],subLanguage:"xml",contains:[{begin:i.begin,end:i.end,skip:!0,contains:["self"]}]}]},ce,{beginKeywords:"while if switch catch for"},{begin:"\\b(?!function)"+t.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",returnBegin:!0,label:"func.def",contains:[U,t.inherit(t.TITLE_MODE,{begin:c,className:"title.function"})]},{match:/\.\.\./,relevance:0},Z,{match:"\\$"+c,relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},contains:[U]},fe,ge,pe,be,{match:/\$[(.]/}]}}function ut(t){const n=t.regex,o=n.concat(/[\p{L}_]/u,n.optional(/[\p{L}0-9_.-]*:/u),/[\p{L}0-9_.-]*/u),c=/[\p{L}0-9._:-]+/u,a={className:"symbol",begin:/&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/},l={begin:/\s/,contains:[{className:"keyword",begin:/#?[a-z_][a-z1-9_-]+/,illegal:/\n/}]},i=t.inherit(l,{begin:/\(/,end:/\)/}),s=t.inherit(t.APOS_STRING_MODE,{className:"string"}),d=t.inherit(t.QUOTE_STRING_MODE,{className:"string"}),b={endsWithParent:!0,illegal:/</,relevance:0,contains:[{className:"attr",begin:c,relevance:0},{begin:/=\s*/,relevance:0,contains:[{className:"string",endsParent:!0,variants:[{begin:/"/,end:/"/,contains:[a]},{begin:/'/,end:/'/,contains:[a]},{begin:/[^\s"'=<>`]+/}]}]}]};return{name:"HTML, XML",aliases:["html","xhtml","rss","atom","xjb","xsd","xsl","plist","wsf","svg"],case_insensitive:!0,unicodeRegex:!0,contains:[{className:"meta",begin:/<![a-z]/,end:/>/,relevance:10,contains:[l,d,s,i,{begin:/\[/,end:/\]/,contains:[{className:"meta",begin:/<![a-z]/,end:/>/,contains:[l,i,d,s]}]}]},t.COMMENT(/<!--/,/-->/,{relevance:10}),{begin:/<!\[CDATA\[/,end:/\]\]>/,relevance:10},a,{className:"meta",end:/\?>/,variants:[{begin:/<\?xml/,relevance:10,contains:[d]},{begin:/<\?[a-z][a-z0-9]+/}]},{className:"tag",begin:/<style(?=\s|>)/,end:/>/,keywords:{name:"style"},contains:[b],starts:{end:/<\/style>/,returnEnd:!0,subLanguage:["css","xml"]}},{className:"tag",begin:/<script(?=\s|>)/,end:/>/,keywords:{name:"script"},contains:[b],starts:{end:/<\/script>/,returnEnd:!0,subLanguage:["javascript","handlebars","xml"]}},{className:"tag",begin:/<>|<\/>/},{className:"tag",begin:n.concat(/</,n.lookahead(n.concat(o,n.either(/\/>/,/>/,/\s/)))),end:/\/?>/,contains:[{className:"name",begin:o,relevance:0,starts:b}]},{className:"tag",begin:n.concat(/<\//,n.lookahead(n.concat(o,/>/))),contains:[{className:"name",begin:o,relevance:0},{begin:/>/,relevance:0,endsParent:!0}]}]}}function Qo(t){const n=t.regex,o={},c={begin:/\$\{/,end:/\}/,contains:["self",{begin:/:-/,contains:[o]}]};Object.assign(o,{className:"variable",variants:[{begin:n.concat(/\$[\w\d#@][\w\d_]*/,"(?![\\w\\d])(?![$])")},c]});const a={className:"subst",begin:/\$\(/,end:/\)/,contains:[t.BACKSLASH_ESCAPE]},l=t.inherit(t.COMMENT(),{match:[/(^|\s)/,/#.*$/],scope:{2:"comment"}}),i={begin:/<<-?\s*(?=\w+)/,starts:{contains:[t.END_SAME_AS_BEGIN({begin:/(\w+)/,end:/(\w+)/,className:"string"})]}},s={className:"string",begin:/"/,end:/"/,contains:[t.BACKSLASH_ESCAPE,o,a]};a.contains.push(s);const d={match:/\\"/},b={className:"string",begin:/'/,end:/'/},S={match:/\\'/},R={begin:/\$?\(\(/,end:/\)\)/,contains:[{begin:/\d+#[0-9a-f]+/,className:"number"},t.NUMBER_MODE,o]},x=["fish","bash","zsh","sh","csh","ksh","tcsh","dash","scsh"],T=t.SHEBANG({binary:`(${x.join("|")})`,relevance:10}),E={className:"function",begin:/\w[\w\d_]*\s*\(\s*\)\s*\{/,returnBegin:!0,contains:[t.inherit(t.TITLE_MODE,{begin:/\w[\w\d_]*/})],relevance:0},W=["if","then","else","elif","fi","time","for","while","until","in","do","done","case","esac","coproc","function","select"],_=["true","false"],z={match:/(\/[a-z._-]+)+/},M=["break","cd","continue","eval","exec","exit","export","getopts","hash","pwd","readonly","return","shift","test","times","trap","umask","unset"],B=["alias","bind","builtin","caller","command","declare","echo","enable","help","let","local","logout","mapfile","printf","read","readarray","source","sudo","type","typeset","ulimit","unalias"],$=["autoload","bg","bindkey","bye","cap","chdir","clone","comparguments","compcall","compctl","compdescribe","compfiles","compgroups","compquote","comptags","comptry","compvalues","dirs","disable","disown","echotc","echoti","emulate","fc","fg","float","functions","getcap","getln","history","integer","jobs","kill","limit","log","noglob","popd","print","pushd","pushln","rehash","sched","setcap","setopt","stat","suspend","ttyctl","unfunction","unhash","unlimit","unsetopt","vared","wait","whence","where","which","zcompile","zformat","zftp","zle","zmodload","zparseopts","zprof","zpty","zregexparse","zsocket","zstyle","ztcp"],j=["chcon","chgrp","chown","chmod","cp","dd","df","dir","dircolors","ln","ls","mkdir","mkfifo","mknod","mktemp","mv","realpath","rm","rmdir","shred","sync","touch","truncate","vdir","b2sum","base32","base64","cat","cksum","comm","csplit","cut","expand","fmt","fold","head","join","md5sum","nl","numfmt","od","paste","ptx","pr","sha1sum","sha224sum","sha256sum","sha384sum","sha512sum","shuf","sort","split","sum","tac","tail","tr","tsort","unexpand","uniq","wc","arch","basename","chroot","date","dirname","du","echo","env","expr","factor","groups","hostid","id","link","logname","nice","nohup","nproc","pathchk","pinky","printenv","printf","pwd","readlink","runcon","seq","sleep","stat","stdbuf","stty","tee","test","timeout","tty","uname","unlink","uptime","users","who","whoami","yes"];return{name:"Bash",aliases:["sh","zsh"],keywords:{$pattern:/\b[a-z][a-z0-9._-]+\b/,keyword:W,literal:_,built_in:[...M,...B,"set","shopt",...$,...j]},contains:[T,t.SHEBANG(),E,R,l,i,z,s,d,b,S,o]}}function ec(t){const n={className:"attr",begin:/"(\\.|[^\\"\r\n])*"(?=\s*:)/,relevance:1.01},o={match:/[{}[\],:]/,className:"punctuation",relevance:0},c=["true","false","null"],a={scope:"literal",beginKeywords:c.join(" ")};return{name:"JSON",aliases:["jsonc"],keywords:{literal:c},contains:[n,o,t.QUOTE_STRING_MODE,a,t.C_NUMBER_MODE,t.C_LINE_COMMENT_MODE,t.C_BLOCK_COMMENT_MODE],illegal:"\\S"}}const tc=t=>({IMPORTANT:{scope:"meta",begin:"!important"},BLOCK_COMMENT:t.C_BLOCK_COMMENT_MODE,HEXCOLOR:{scope:"number",begin:/#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/},FUNCTION_DISPATCH:{className:"built_in",begin:/[\w-]+(?=\()/},ATTRIBUTE_SELECTOR_MODE:{scope:"selector-attr",begin:/\[/,end:/\]/,illegal:"$",contains:[t.APOS_STRING_MODE,t.QUOTE_STRING_MODE]},CSS_NUMBER_MODE:{scope:"number",begin:t.NUMBER_RE+"(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",relevance:0},CSS_VARIABLE:{className:"attr",begin:/--[A-Za-z_][A-Za-z0-9_-]*/}}),rc=["a","abbr","address","article","aside","audio","b","blockquote","body","button","canvas","caption","cite","code","dd","del","details","dfn","div","dl","dt","em","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","html","i","iframe","img","input","ins","kbd","label","legend","li","main","mark","menu","nav","object","ol","optgroup","option","p","picture","q","quote","samp","section","select","source","span","strong","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","ul","var","video"],nc=["defs","g","marker","mask","pattern","svg","switch","symbol","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feFlood","feGaussianBlur","feImage","feMerge","feMorphology","feOffset","feSpecularLighting","feTile","feTurbulence","linearGradient","radialGradient","stop","circle","ellipse","image","line","path","polygon","polyline","rect","text","use","textPath","tspan","foreignObject","clipPath"],oc=[...rc,...nc],cc=["any-hover","any-pointer","aspect-ratio","color","color-gamut","color-index","device-aspect-ratio","device-height","device-width","display-mode","forced-colors","grid","height","hover","inverted-colors","monochrome","orientation","overflow-block","overflow-inline","pointer","prefers-color-scheme","prefers-contrast","prefers-reduced-motion","prefers-reduced-transparency","resolution","scan","scripting","update","width","min-width","max-width","min-height","max-height"].sort().reverse(),ac=["active","any-link","blank","checked","current","default","defined","dir","disabled","drop","empty","enabled","first","first-child","first-of-type","fullscreen","future","focus","focus-visible","focus-within","has","host","host-context","hover","indeterminate","in-range","invalid","is","lang","last-child","last-of-type","left","link","local-link","not","nth-child","nth-col","nth-last-child","nth-last-col","nth-last-of-type","nth-of-type","only-child","only-of-type","optional","out-of-range","past","placeholder-shown","read-only","read-write","required","right","root","scope","target","target-within","user-invalid","valid","visited","where"].sort().reverse(),ic=["after","backdrop","before","cue","cue-region","first-letter","first-line","grammar-error","marker","part","placeholder","selection","slotted","spelling-error"].sort().reverse(),lc=["accent-color","align-content","align-items","align-self","alignment-baseline","all","anchor-name","animation","animation-composition","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-range","animation-range-end","animation-range-start","animation-timeline","animation-timing-function","appearance","aspect-ratio","backdrop-filter","backface-visibility","background","background-attachment","background-blend-mode","background-clip","background-color","background-image","background-origin","background-position","background-position-x","background-position-y","background-repeat","background-size","baseline-shift","block-size","border","border-block","border-block-color","border-block-end","border-block-end-color","border-block-end-style","border-block-end-width","border-block-start","border-block-start-color","border-block-start-style","border-block-start-width","border-block-style","border-block-width","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-end-end-radius","border-end-start-radius","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-inline","border-inline-color","border-inline-end","border-inline-end-color","border-inline-end-style","border-inline-end-width","border-inline-start","border-inline-start-color","border-inline-start-style","border-inline-start-width","border-inline-style","border-inline-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-start-end-radius","border-start-start-radius","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-align","box-decoration-break","box-direction","box-flex","box-flex-group","box-lines","box-ordinal-group","box-orient","box-pack","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","caret-color","clear","clip","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","color-scheme","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","contain","contain-intrinsic-block-size","contain-intrinsic-height","contain-intrinsic-inline-size","contain-intrinsic-size","contain-intrinsic-width","container","container-name","container-type","content","content-visibility","counter-increment","counter-reset","counter-set","cue","cue-after","cue-before","cursor","cx","cy","direction","display","dominant-baseline","empty-cells","enable-background","field-sizing","fill","fill-opacity","fill-rule","filter","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","flood-color","flood-opacity","flow","font","font-display","font-family","font-feature-settings","font-kerning","font-language-override","font-optical-sizing","font-palette","font-size","font-size-adjust","font-smooth","font-smoothing","font-stretch","font-style","font-synthesis","font-synthesis-position","font-synthesis-small-caps","font-synthesis-style","font-synthesis-weight","font-variant","font-variant-alternates","font-variant-caps","font-variant-east-asian","font-variant-emoji","font-variant-ligatures","font-variant-numeric","font-variant-position","font-variation-settings","font-weight","forced-color-adjust","gap","glyph-orientation-horizontal","glyph-orientation-vertical","grid","grid-area","grid-auto-columns","grid-auto-flow","grid-auto-rows","grid-column","grid-column-end","grid-column-start","grid-gap","grid-row","grid-row-end","grid-row-start","grid-template","grid-template-areas","grid-template-columns","grid-template-rows","hanging-punctuation","height","hyphenate-character","hyphenate-limit-chars","hyphens","icon","image-orientation","image-rendering","image-resolution","ime-mode","initial-letter","initial-letter-align","inline-size","inset","inset-area","inset-block","inset-block-end","inset-block-start","inset-inline","inset-inline-end","inset-inline-start","isolation","justify-content","justify-items","justify-self","kerning","left","letter-spacing","lighting-color","line-break","line-height","line-height-step","list-style","list-style-image","list-style-position","list-style-type","margin","margin-block","margin-block-end","margin-block-start","margin-bottom","margin-inline","margin-inline-end","margin-inline-start","margin-left","margin-right","margin-top","margin-trim","marker","marker-end","marker-mid","marker-start","marks","mask","mask-border","mask-border-mode","mask-border-outset","mask-border-repeat","mask-border-slice","mask-border-source","mask-border-width","mask-clip","mask-composite","mask-image","mask-mode","mask-origin","mask-position","mask-repeat","mask-size","mask-type","masonry-auto-flow","math-depth","math-shift","math-style","max-block-size","max-height","max-inline-size","max-width","min-block-size","min-height","min-inline-size","min-width","mix-blend-mode","nav-down","nav-index","nav-left","nav-right","nav-up","none","normal","object-fit","object-position","offset","offset-anchor","offset-distance","offset-path","offset-position","offset-rotate","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-anchor","overflow-block","overflow-clip-margin","overflow-inline","overflow-wrap","overflow-x","overflow-y","overlay","overscroll-behavior","overscroll-behavior-block","overscroll-behavior-inline","overscroll-behavior-x","overscroll-behavior-y","padding","padding-block","padding-block-end","padding-block-start","padding-bottom","padding-inline","padding-inline-end","padding-inline-start","padding-left","padding-right","padding-top","page","page-break-after","page-break-before","page-break-inside","paint-order","pause","pause-after","pause-before","perspective","perspective-origin","place-content","place-items","place-self","pointer-events","position","position-anchor","position-visibility","print-color-adjust","quotes","r","resize","rest","rest-after","rest-before","right","rotate","row-gap","ruby-align","ruby-position","scale","scroll-behavior","scroll-margin","scroll-margin-block","scroll-margin-block-end","scroll-margin-block-start","scroll-margin-bottom","scroll-margin-inline","scroll-margin-inline-end","scroll-margin-inline-start","scroll-margin-left","scroll-margin-right","scroll-margin-top","scroll-padding","scroll-padding-block","scroll-padding-block-end","scroll-padding-block-start","scroll-padding-bottom","scroll-padding-inline","scroll-padding-inline-end","scroll-padding-inline-start","scroll-padding-left","scroll-padding-right","scroll-padding-top","scroll-snap-align","scroll-snap-stop","scroll-snap-type","scroll-timeline","scroll-timeline-axis","scroll-timeline-name","scrollbar-color","scrollbar-gutter","scrollbar-width","shape-image-threshold","shape-margin","shape-outside","shape-rendering","speak","speak-as","src","stop-color","stop-opacity","stroke","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke-width","tab-size","table-layout","text-align","text-align-all","text-align-last","text-anchor","text-combine-upright","text-decoration","text-decoration-color","text-decoration-line","text-decoration-skip","text-decoration-skip-ink","text-decoration-style","text-decoration-thickness","text-emphasis","text-emphasis-color","text-emphasis-position","text-emphasis-style","text-indent","text-justify","text-orientation","text-overflow","text-rendering","text-shadow","text-size-adjust","text-transform","text-underline-offset","text-underline-position","text-wrap","text-wrap-mode","text-wrap-style","timeline-scope","top","touch-action","transform","transform-box","transform-origin","transform-style","transition","transition-behavior","transition-delay","transition-duration","transition-property","transition-timing-function","translate","unicode-bidi","user-modify","user-select","vector-effect","vertical-align","view-timeline","view-timeline-axis","view-timeline-inset","view-timeline-name","view-transition-name","visibility","voice-balance","voice-duration","voice-family","voice-pitch","voice-range","voice-rate","voice-stress","voice-volume","white-space","white-space-collapse","widows","width","will-change","word-break","word-spacing","word-wrap","writing-mode","x","y","z-index","zoom"].sort().reverse();function sc(t){const n=t.regex,o=tc(t),c={begin:/-(webkit|moz|ms|o)-(?=[a-z])/},a="and or not only",l=/@-?\w[\w]*(-\w+)*/,i="[a-zA-Z-][a-zA-Z0-9_-]*",s=[t.APOS_STRING_MODE,t.QUOTE_STRING_MODE];return{name:"CSS",case_insensitive:!0,illegal:/[=|'\$]/,keywords:{keyframePosition:"from to"},classNameAliases:{keyframePosition:"selector-tag"},contains:[o.BLOCK_COMMENT,c,o.CSS_NUMBER_MODE,{className:"selector-id",begin:/#[A-Za-z0-9_-]+/,relevance:0},{className:"selector-class",begin:"\\."+i,relevance:0},o.ATTRIBUTE_SELECTOR_MODE,{className:"selector-pseudo",variants:[{begin:":("+ac.join("|")+")"},{begin:":(:)?("+ic.join("|")+")"}]},o.CSS_VARIABLE,{className:"attribute",begin:"\\b("+lc.join("|")+")\\b"},{begin:/:/,end:/[;}{]/,contains:[o.BLOCK_COMMENT,o.HEXCOLOR,o.IMPORTANT,o.CSS_NUMBER_MODE,...s,{begin:/(url|data-uri)\(/,end:/\)/,relevance:0,keywords:{built_in:"url data-uri"},contains:[...s,{className:"string",begin:/[^)]/,endsWithParent:!0,excludeEnd:!0}]},o.FUNCTION_DISPATCH]},{begin:n.lookahead(/@/),end:"[{;]",relevance:0,illegal:/:/,contains:[{className:"keyword",begin:l},{begin:/\s/,endsWithParent:!0,excludeEnd:!0,relevance:0,keywords:{$pattern:/[a-z-]+/,keyword:a,attribute:cc.join(" ")},contains:[{begin:/[a-z-]+(?=:)/,className:"attribute"},...s,o.CSS_NUMBER_MODE]}]},{className:"selector-tag",begin:"\\b("+oc.join("|")+")\\b"}]}}F.registerLanguage("typescript",ht);F.registerLanguage("tsx",ht);F.registerLanguage("javascript",Cr);F.registerLanguage("js",Cr);F.registerLanguage("css",sc);F.registerLanguage("xml",ut);F.registerLanguage("html",ut);F.registerLanguage("jsx",ht);F.registerLanguage("bash",Qo);F.registerLanguage("json",ec);F.registerLanguage("vue",ut);const dc=t=>t.includes("lTag`"),hc=t=>t.replace(/lTag`/g,"html`"),uc=t=>t.replace(/html`/g,"lTag`"),r=Wn(()=>{const t=Ln(null);return Gr(()=>{var i;if(!t.value)return;const n=((i=t.value.className.match(/language-(\w+)/))==null?void 0:i[1])||"typescript";if(n==="bash"){F.highlightElement(t.value),t.value.innerHTML&&(t.value.innerHTML=t.value.innerHTML.replace(/^(\s*)\$(\s)/gm,'$1<span class="bash-prompt">$</span>$2'));return}const o=t.value.textContent||"",c=dc(o),a=c?hc(o):o,l=F.highlight(a,{language:n}).value;t.value.innerHTML=c?uc(l):l}),({code:n,language:o})=>e("pre",{class:"code-block bg-gray-100 dark:bg-[#1e1e1e] p-6 rounded-lg overflow-x-auto mb-6 text-xs md:text-sm border border-gray-200 dark:border-gray-800",children:e("code",{ref:t,class:`language-${o||"typescript"}`,children:n})})}),ct=f(()=>()=>e("div",{children:[e("h1",{children:"Introduction"}),e("p",{children:"StateRef is a universal state management library focused on data immutability. It combines proxies and the functional programming lens pattern to efficiently and safely access and modify deeply structured data."}),e("h2",{children:"Why StateRef?"}),e("p",{children:"Modern applications often deal with complex, deeply nested state. StateRef provides a simple yet powerful way to manage this state while maintaining immutability and fine-grained reactivity."}),e("h3",{children:"Key Features"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Proxy-based Reactivity"})," - Automatic dependency tracking using JavaScript Proxies"]}),e("li",{children:[e("strong",{children:"Immutable Updates"})," - Copy-on-write pattern ensures safe state modifications"]}),e("li",{children:[e("strong",{children:"Lens Pattern"})," - Functional lenses for elegant deep updates"]}),e("li",{children:[e("strong",{children:"Framework Agnostic"})," - Easy integration with React, Vue, Svelte, Solid, and more"]}),e("li",{children:[e("strong",{children:"TypeScript Support"})," - Full type safety and inference"]}),e("li",{children:[e("strong",{children:"Lightweight"})," - Small bundle size with zero dependencies"]})]}),e("h2",{children:"Core Concepts"}),e("h3",{children:"Watch Function"}),e("p",{children:["The ",e("code",{children:"Watch"})," function is the fundamental abstraction in StateRef. It serves dual purposes:"]}),e("ul",{children:[e("li",{children:["Called with no arguments: returns a ",e("code",{children:"StateRefStore"})," for reading/writing values"]}),e("li",{children:["Called with a callback: subscribes to changes (callback receives"," ",e("code",{children:"StateRefStore"})," and ",e("code",{children:"isFirst"})," boolean)"]})]}),e("h3",{children:"StateRefStore"}),e("p",{children:["The ",e("code",{children:"StateRefStore"})," is a proxied reference that allows you to access values via the ",e("code",{children:".value"})," property. The proxy automatically tracks which properties are accessed during subscription callbacks, enabling fine-grained reactivity."]}),e("h3",{children:"Copy-on-Write"}),e("p",{children:"All mutations create new object references at the modified path while sharing unchanged subtrees. This enables efficient immutability checks via reference equality."}),e("h2",{children:"Installation"}),e(r,{language:"bash",code:`# Core library
$ npm install state-ref

# Framework connectors (choose what you need)
$ npm install @stateref/connect-react
$ npm install @stateref/connect-vue
$ npm install @stateref/connect-svelte
$ npm install @stateref/connect-solid`}),e("h2",{children:"Basic Example"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

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
// Logs: Count: 1`}),e("h2",{children:"Usage with React"}),e("p",{children:["StateRef can be easily integrated with React using the ",e("code",{children:"connectReact"})," helper:"]}),e(r,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const watch = createStore({ count: 0 });
export const useCountStore = connectReact(watch);`}),e(r,{language:"tsx",code:`// Counter.tsx
import { useCountStore } from './store';

function Counter() {
  const { count } = useCountStore();

  return (
    <button onClick={() => count.value++}>
      Count: {count.value}
    </button>
  );
}`}),e("p",{children:["The component automatically re-renders when ",e("code",{children:"count.value"})," changes. Learn more in the ",e("a",{href:"#/guide/react",children:"React Integration"})," guide."]}),e("h2",{children:"Next Steps"}),e("p",{children:["Ready to dive deeper? Check out the ",e("a",{href:"#/guide/quick-start",children:"Quick Start"})," guide to learn how to use StateRef in your projects."]})]})),pc=f(()=>()=>e("div",{children:[e("h1",{children:"소개"}),e("p",{children:"StateRef는 데이터 불변성에 초점을 맞춘 범용 상태 관리 라이브러리입니다. 프록시와 함수형 프로그래밍 렌즈 패턴을 결합하여 깊게 중첩된 데이터를 효율적이고 안전하게 접근하고 수정합니다."}),e("h2",{children:"왜 StateRef인가?"}),e("p",{children:"현대 애플리케이션은 복잡하고 깊게 중첩된 상태를 다루는 경우가 많습니다. StateRef는 불변성과 세밀한 반응성을 유지하면서 이러한 상태를 관리할 수 있는 간단하면서도 강력한 방법을 제공합니다."}),e("h3",{children:"주요 기능"}),e("ul",{children:[e("li",{children:[e("strong",{children:"프록시 기반 반응성"})," - JavaScript 프록시를 사용한 자동 의존성 추적"]}),e("li",{children:[e("strong",{children:"불변 업데이트"})," - Copy-on-write 패턴으로 안전한 상태 수정 보장"]}),e("li",{children:[e("strong",{children:"렌즈 패턴"})," - 깊은 업데이트를 위한 우아한 함수형 렌즈"]}),e("li",{children:[e("strong",{children:"프레임워크 독립적"})," - React, Vue, Svelte, Solid 등과 쉽게 통합"]}),e("li",{children:[e("strong",{children:"TypeScript 지원"})," - 완전한 타입 안전성과 추론"]}),e("li",{children:[e("strong",{children:"경량"})," - 의존성 없이 작은 번들 크기"]})]}),e("h2",{children:"핵심 개념"}),e("h3",{children:"Watch 함수"}),e("p",{children:[e("code",{children:"Watch"})," 함수는 StateRef의 기본 추상화입니다. 두 가지 용도로 사용됩니다:"]}),e("ul",{children:[e("li",{children:["인자 없이 호출: 값을 읽고 쓰기 위한 ",e("code",{children:"StateRefStore"})," 반환"]}),e("li",{children:["콜백과 함께 호출: 변경 사항 구독 (콜백은 ",e("code",{children:"StateRefStore"}),"와"," ",e("code",{children:"isFirst"})," 불리언을 받음)"]})]}),e("h3",{children:"StateRefStore"}),e("p",{children:[e("code",{children:"StateRefStore"}),"는 ",e("code",{children:".value"})," 속성을 통해 값에 접근할 수 있는 프록시 참조입니다. 프록시는 구독 콜백 동안 접근되는 속성을 자동으로 추적하여 세밀한 반응성을 가능하게 합니다."]}),e("h3",{children:"Copy-on-Write"}),e("p",{children:"모든 변경은 수정된 경로에 새로운 객체 참조를 생성하고 변경되지 않은 하위 트리는 공유합니다. 이를 통해 참조 동등성을 통한 효율적인 불변성 검사가 가능합니다."}),e("h2",{children:"설치"}),e(r,{language:"bash",code:`# 코어 라이브러리
$ npm install state-ref

# 프레임워크 커넥터 (필요한 것만 선택)
$ npm install @stateref/connect-react
$ npm install @stateref/connect-vue
$ npm install @stateref/connect-svelte
$ npm install @stateref/connect-solid`}),e("h2",{children:"기본 예제"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

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
// 로그: Count: 1`}),e("h2",{children:"React와 함께 사용하기"}),e("p",{children:["StateRef는 ",e("code",{children:"connectReact"})," 헬퍼를 사용하여 React와 쉽게 통합할 수 있습니다:"]}),e(r,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const watch = createStore({ count: 0 });
export const useCountStore = connectReact(watch);`}),e(r,{language:"tsx",code:`// Counter.tsx
import { useCountStore } from './store';

function Counter() {
  const { count } = useCountStore();

  return (
    <button onClick={() => count.value++}>
      Count: {count.value}
    </button>
  );
}`}),e("p",{children:[e("code",{children:"count.value"}),"가 변경되면 컴포넌트가 자동으로 다시 렌더링됩니다. 자세한 내용은 ",e("a",{href:"#/ko/guide/react",children:"React 연동"})," 가이드를 참고하세요."]}),e("h2",{children:"다음 단계"}),e("p",{children:["더 자세히 알아볼 준비가 되셨나요? ",e("a",{href:"#/ko/guide/quick-start",children:"빠른 시작"})," ","가이드를 확인하여 프로젝트에서 StateRef를 사용하는 방법을 배워보세요."]})]})),gc=f(()=>()=>e("div",{children:[e("h1",{children:"Quick Start"}),e("p",{children:"This guide will help you get started with StateRef in just a few minutes. You'll learn how to create a store, subscribe to changes, and update values."}),e("h2",{children:"Installation"}),e("p",{children:"First, install the core library:"}),e(r,{language:"bash",code:"$ npm install state-ref"}),e("h2",{children:"Creating Your First Store"}),e("p",{children:["Use ",e("code",{children:"createStore()"})," to create a reactive store with an initial value:"]}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

// Create a store with an object
const watch = createStore({ count: 0, name: 'StateRef' });

// Or with a primitive value
const numberWatch = createStore(42);`}),e("h2",{children:"Reading and Writing Values"}),e("p",{children:["Access and modify values using the ",e("code",{children:".value"})," property:"]}),e(r,{language:"typescript",code:`// Get a reference to the store
const store = watch();

// Read values
console.log(store.count.value); // 0

// Write values
store.count.value = 10;
store.name.value = 'Updated';`}),e("h2",{children:"Subscribing to Changes"}),e("p",{children:["Pass a callback function to ",e("code",{children:"watch()"})," to subscribe to state changes. The callback receives the store reference and an ",e("code",{children:"isFirst"})," flag:"]}),e(r,{language:"typescript",code:`watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  console.log('Is first run?', isFirst);
  // First run: Count: 0, Is first run? true
});

// Update triggers the callback
const store = watch();
store.count.value = 5;
// Logs: Count: 5, Is first run? false`}),e("h2",{children:"Understanding References"}),e("p",{children:["The ",e("code",{children:"watch"})," function returns the same reference whether called with or without a callback. Both the returned reference (",e("code",{children:"outerRef"}),") and the callback argument (",e("code",{children:"innerRef"}),") track dependencies:"]}),e(r,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2 });

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
anotherRef.y.value = 5;  // ✗ Does NOT trigger callback`}),e("h3",{children:"Key Points"}),e("ul",{children:[e("li",{children:["Only values accessed through a ",e("strong",{children:"subscribed reference"})," trigger updates"]}),e("li",{children:["Both ",e("code",{children:"innerRef"})," and ",e("code",{children:"outerRef"})," are tracked when created with a callback"]}),e("li",{children:["References created without a callback are ",e("strong",{children:"not tracked"})]})]}),e("h2",{children:"Canceling Subscriptions"}),e("p",{children:["Use ",e("code",{children:"AbortController"})," to unsubscribe from changes:"]}),e(r,{language:"typescript",code:`const abortController = new AbortController();

watch((store) => {
  console.log('Count:', store.count.value);
  return abortController.signal;
});

// Later, cancel the subscription
abortController.abort();`}),e("h2",{children:"Working with Primitive Types"}),e("p",{children:"StateRef works seamlessly with primitive types like numbers and strings:"}),e(r,{language:"typescript",code:`const numberWatch = createStore(100);

numberWatch((store) => {
  console.log('Number:', store.value);
});

const numStore = numberWatch();
numStore.value = 200; // Triggers callback`}),e("h2",{children:"Next Steps"}),e("p",{children:"Now that you understand the basics, explore these topics:"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore API"})," - Deep dive into store creation"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - Advanced watch patterns"]}),e("li",{children:[e("a",{href:"#/guide/react",children:"React Integration"})," - Use StateRef with React"]}),e("li",{children:[e("a",{href:"#/guide/computed",children:"createComputed"})," - Derive values from multiple stores"]})]})]})),mc=f(()=>()=>e("div",{children:[e("h1",{children:"빠른 시작"}),e("p",{children:"이 가이드는 몇 분 안에 StateRef를 시작할 수 있도록 도와줍니다. 스토어 생성, 변경 사항 구독, 값 업데이트 방법을 배워보세요."}),e("h2",{children:"설치"}),e("p",{children:"먼저 코어 라이브러리를 설치합니다:"}),e(r,{language:"bash",code:"$ npm install state-ref"}),e("h2",{children:"첫 번째 스토어 만들기"}),e("p",{children:[e("code",{children:"createStore()"}),"를 사용하여 초기값과 함께 반응형 스토어를 생성합니다:"]}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

// 객체로 스토어 생성
const watch = createStore({ count: 0, name: 'StateRef' });

// 또는 원시 타입 값으로 생성
const numberWatch = createStore(42);`}),e("h2",{children:"값 읽기와 쓰기"}),e("p",{children:[e("code",{children:".value"})," 속성을 사용하여 값에 접근하고 수정합니다:"]}),e(r,{language:"typescript",code:`// 스토어 참조 얻기
const store = watch();

// 값 읽기
console.log(store.count.value); // 0

// 값 쓰기
store.count.value = 10;
store.name.value = '업데이트됨';`}),e("h2",{children:"변경 사항 구독하기"}),e("p",{children:[e("code",{children:"watch()"}),"에 콜백 함수를 전달하여 상태 변경을 구독합니다. 콜백은 스토어 참조와 ",e("code",{children:"isFirst"})," 플래그를 받습니다:"]}),e(r,{language:"typescript",code:`watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  console.log('첫 실행?', isFirst);
  // 첫 실행: Count: 0, 첫 실행? true
});

// 업데이트가 콜백을 트리거합니다
const store = watch();
store.count.value = 5;
// 로그: Count: 5, 첫 실행? false`}),e("h2",{children:"참조 이해하기"}),e("p",{children:[e("code",{children:"watch"})," 함수는 콜백과 함께 호출하든 안하든 같은 참조를 반환합니다. 반환된 참조(",e("code",{children:"outerRef"}),")와 콜백 인자(",e("code",{children:"innerRef"}),") 모두 의존성을 추적합니다:"]}),e(r,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2 });

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
anotherRef.y.value = 5;  // ✗ 콜백 트리거 안 함`}),e("h3",{children:"핵심 포인트"}),e("ul",{children:[e("li",{children:[e("strong",{children:"구독된 참조"}),"를 통해 접근한 값만 업데이트를 트리거합니다"]}),e("li",{children:["콜백과 함께 생성된 경우 ",e("code",{children:"innerRef"}),"와 ",e("code",{children:"outerRef"})," 모두 추적됩니다"]}),e("li",{children:["콜백 없이 생성된 참조는 ",e("strong",{children:"추적되지 않습니다"})]})]}),e("h2",{children:"구독 취소하기"}),e("p",{children:[e("code",{children:"AbortController"}),"를 사용하여 변경 사항 구독을 해제합니다:"]}),e(r,{language:"typescript",code:`const abortController = new AbortController();

watch((store) => {
  console.log('Count:', store.count.value);
  return abortController.signal;
});

// 나중에 구독 취소
abortController.abort();`}),e("h2",{children:"원시 타입 다루기"}),e("p",{children:"StateRef는 숫자나 문자열 같은 원시 타입과도 완벽하게 작동합니다:"}),e(r,{language:"typescript",code:`const numberWatch = createStore(100);

numberWatch((store) => {
  console.log('Number:', store.value);
});

const numStore = numberWatch();
numStore.value = 200; // 콜백 트리거`}),e("h2",{children:"다음 단계"}),e("p",{children:"이제 기본을 이해했으니, 다음 주제들을 탐색해보세요:"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore API"})," - 스토어 생성 깊이 알아보기"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - 고급 watch 패턴"]}),e("li",{children:[e("a",{href:"#/ko/guide/react",children:"React 연동"})," - React와 함께 StateRef 사용하기"]}),e("li",{children:[e("a",{href:"#/ko/guide/computed",children:"createComputed"})," - 여러 스토어에서 값 파생하기"]})]})]})),fc=f(()=>()=>e("div",{children:[e("h1",{children:"createStore"}),e("p",{children:["The ",e("code",{children:"createStore"})," function is the primary way to create a reactive state store in StateRef. It accepts an initial value and returns a ",e("code",{children:"watch"})," function that you use to access and subscribe to the state."]}),e("h2",{children:"Basic Usage"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

// Create a store with an initial value
const watch = createStore({ count: 0, name: 'StateRef' });`}),e("h2",{children:"Syntax"}),e(r,{language:"typescript",code:"createStore<T>(initialValue: T): Watch<T>"}),e("h3",{children:"Parameters"}),e("ul",{children:e("li",{children:[e("code",{children:"initialValue"})," - The initial state value. Can be any type: object, array, primitive, etc."]})}),e("h3",{children:"Returns"}),e("p",{children:["Returns a ",e("code",{children:"Watch"})," function that serves dual purposes:"]}),e("ul",{children:[e("li",{children:[e("strong",{children:"Without arguments"}),": Returns a ",e("code",{children:"StateRefStore"})," reference for reading/writing values"]}),e("li",{children:[e("strong",{children:"With callback"}),": Subscribes to changes and returns a tracked ",e("code",{children:"StateRefStore"})," reference"]})]}),e("h2",{children:"Creating Object Stores"}),e("p",{children:"Object stores are the most common use case. They allow you to manage complex nested state:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
store.todos[0].done.value = true;`}),e("h2",{children:"Creating Primitive Stores"}),e("p",{children:"StateRef also works seamlessly with primitive types like numbers, strings, and booleans:"}),e(r,{language:"typescript",code:`// Number store
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
toggle.value = true;`}),e("h2",{children:"TypeScript Type Inference"}),e("p",{children:"StateRef provides full TypeScript support with automatic type inference:"}),e(r,{language:"typescript",code:`// Type is inferred from initial value
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
});`}),e("h2",{children:"Using the Returned Watch Function"}),e("p",{children:["The ",e("code",{children:"watch"})," function returned by ",e("code",{children:"createStore"})," is the core interface for your store:"]}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0 });

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
trackedStore.count.value = 20;`}),e("h2",{children:"Auto-sync Mode"}),e("p",{children:["By default, ",e("code",{children:"createStore"})," operates in ",e("strong",{children:"auto-sync"})," mode, which means changes immediately trigger subscriptions:"]}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0 });

watch((store) => {
  console.log('Count:', store.count.value);
});

const store = watch();
store.count.value = 1; // ✓ Immediately triggers subscription
store.count.value = 2; // ✓ Immediately triggers subscription`}),e("p",{children:["For manual control over when updates propagate, see ",e("a",{href:"#/guide/manual-sync",children:"Manual Sync (Flux)"}),"."]}),e("h2",{children:"Working with Arrays"}),e("p",{children:"Arrays are fully supported with copy-on-write semantics:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
store.items.value = [...store.items.value]; // Trigger update`}),e("h2",{children:"Best Practices"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Keep stores focused"})," - Create separate stores for different domains of your application"]}),e("li",{children:[e("strong",{children:"Use TypeScript"})," - Type your stores for better IDE support and type safety"]}),e("li",{children:[e("strong",{children:"Initialize with complete state"})," - Provide all properties in the initial value to ensure proper type inference"]}),e("li",{children:[e("strong",{children:"Don't create stores in render functions"})," - Create stores at the module level or in hooks"]})]}),e("h2",{children:"Common Patterns"}),e("h3",{children:"Single Store Module"}),e(r,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';

export const appWatch = createStore({
  user: null as User | null,
  theme: 'light' as 'light' | 'dark',
  isLoading: false
});`}),e("h3",{children:"Multiple Stores"}),e(r,{language:"typescript",code:`// stores/user.ts
export const userWatch = createStore<User | null>(null);

// stores/settings.ts
export const settingsWatch = createStore({
  theme: 'light',
  language: 'en'
});

// stores/todos.ts
export const todosWatch = createStore<Todo[]>([]);`}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - Understanding the watch function"]}),e("li",{children:[e("a",{href:"#/guide/state-ref-store",children:"StateRefStore"})," - Working with store references"]}),e("li",{children:[e("a",{href:"#/guide/manual-sync",children:"Manual Sync"})," - createStoreManualSync for Flux-like patterns"]})]})]})),bc=f(()=>()=>e("div",{children:[e("h1",{children:"createStore"}),e("p",{children:[e("code",{children:"createStore"})," 함수는 StateRef에서 반응형 상태 스토어를 생성하는 주요 방법입니다. 초기값을 받아서 상태에 접근하고 구독할 수 있는 ",e("code",{children:"watch"})," 함수를 반환합니다."]}),e("h2",{children:"기본 사용법"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

// 초기값으로 스토어 생성
const watch = createStore({ count: 0, name: 'StateRef' });`}),e("h2",{children:"문법"}),e(r,{language:"typescript",code:"createStore<T>(initialValue: T): Watch<T>"}),e("h3",{children:"매개변수"}),e("ul",{children:e("li",{children:[e("code",{children:"initialValue"})," - 초기 상태 값. 객체, 배열, 원시 타입 등 모든 타입 가능"]})}),e("h3",{children:"반환값"}),e("p",{children:[e("code",{children:"Watch"})," 함수를 반환하며, 두 가지 용도로 사용됩니다:"]}),e("ul",{children:[e("li",{children:[e("strong",{children:"인자 없이 호출"}),": 값을 읽고 쓰기 위한 ",e("code",{children:"StateRefStore"})," 참조 반환"]}),e("li",{children:[e("strong",{children:"콜백과 함께 호출"}),": 변경 사항을 구독하고 추적되는 ",e("code",{children:"StateRefStore"})," 참조 반환"]})]}),e("h2",{children:"객체 스토어 생성"}),e("p",{children:"객체 스토어가 가장 일반적인 사용 사례입니다. 복잡한 중첩 상태를 관리할 수 있습니다:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
store.todos[0].done.value = true;`}),e("h2",{children:"원시 타입 스토어 생성"}),e("p",{children:"StateRef는 숫자, 문자열, 불리언 같은 원시 타입과도 완벽하게 작동합니다:"}),e(r,{language:"typescript",code:`// 숫자 스토어
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
toggle.value = true;`}),e("h2",{children:"TypeScript 타입 추론"}),e("p",{children:"StateRef는 자동 타입 추론과 함께 완전한 TypeScript 지원을 제공합니다:"}),e(r,{language:"typescript",code:`// 초기값으로부터 타입 추론
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
});`}),e("h2",{children:"반환된 Watch 함수 사용하기"}),e("p",{children:[e("code",{children:"createStore"}),"가 반환하는 ",e("code",{children:"watch"})," 함수가 스토어의 핵심 인터페이스입니다:"]}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0 });

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
trackedStore.count.value = 20;`}),e("h2",{children:"자동 동기화 모드"}),e("p",{children:["기본적으로 ",e("code",{children:"createStore"}),"는 ",e("strong",{children:"자동 동기화"})," 모드로 동작하며, 변경 사항이 즉시 구독을 트리거합니다:"]}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0 });

watch((store) => {
  console.log('Count:', store.count.value);
});

const store = watch();
store.count.value = 1; // ✓ 즉시 구독 트리거
store.count.value = 2; // ✓ 즉시 구독 트리거`}),e("p",{children:["업데이트 전파 시점을 수동으로 제어하려면 ",e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화 (Flux)"}),"를 참고하세요."]}),e("h2",{children:"배열 다루기"}),e("p",{children:"배열은 copy-on-write 의미론과 함께 완전히 지원됩니다:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
store.items.value = [...store.items.value]; // 업데이트 트리거`}),e("h2",{children:"모범 사례"}),e("ul",{children:[e("li",{children:[e("strong",{children:"스토어를 집중되게 유지"})," - 애플리케이션의 다른 도메인에 대해 별도의 스토어 생성"]}),e("li",{children:[e("strong",{children:"TypeScript 사용"})," - 더 나은 IDE 지원과 타입 안전성을 위해 스토어에 타입 지정"]}),e("li",{children:[e("strong",{children:"완전한 상태로 초기화"})," - 적절한 타입 추론을 위해 초기값에 모든 속성 제공"]}),e("li",{children:[e("strong",{children:"렌더 함수에서 스토어 생성 금지"})," - 모듈 레벨이나 훅에서 스토어 생성"]})]}),e("h2",{children:"일반적인 패턴"}),e("h3",{children:"단일 스토어 모듈"}),e(r,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';

export const appWatch = createStore({
  user: null as User | null,
  theme: 'light' as 'light' | 'dark',
  isLoading: false
});`}),e("h3",{children:"여러 스토어"}),e(r,{language:"typescript",code:`// stores/user.ts
export const userWatch = createStore<User | null>(null);

// stores/settings.ts
export const settingsWatch = createStore({
  theme: 'light',
  language: 'ko'
});

// stores/todos.ts
export const todosWatch = createStore<Todo[]>([]);`}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - watch 함수 이해하기"]}),e("li",{children:[e("a",{href:"#/ko/guide/state-ref-store",children:"StateRefStore"})," - 스토어 참조 다루기"]}),e("li",{children:[e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화"})," - Flux 패턴을 위한 createStoreManualSync"]})]})]})),yc=f(()=>()=>e("div",{children:[e("h1",{children:"Watch Function"}),e("p",{children:["The ",e("code",{children:"watch"})," function is the core interface returned by ",e("code",{children:"createStore()"}),". It serves dual purposes: accessing state references and subscribing to state changes."]}),e("h2",{children:"Overview"}),e("p",{children:["When you call ",e("code",{children:"createStore()"}),", it returns a ",e("code",{children:"watch"})," function that can be used in two ways:"]}),e("ul",{children:[e("li",{children:[e("strong",{children:"Without arguments"}),": Returns a ",e("code",{children:"StateRefStore"})," reference for reading/writing values"]}),e("li",{children:[e("strong",{children:"With a callback"}),": Subscribes to changes and returns a tracked ",e("code",{children:"StateRefStore"})," reference"]})]}),e("h2",{children:"Basic Usage"}),e("h3",{children:"Getting a Reference (No Subscription)"}),e("p",{children:["Call ",e("code",{children:"watch()"})," without arguments to get a reference for reading and writing state:"]}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

const watch = createStore({ count: 0, name: 'StateRef' });

// Get a reference without subscribing
const store = watch();

// Read values
console.log(store.count.value); // 0
console.log(store.name.value);  // 'StateRef'

// Write values
store.count.value = 10;
store.name.value = 'Updated';`}),e("h3",{children:"Subscribing to Changes"}),e("p",{children:["Call ",e("code",{children:"watch()"})," with a callback function to subscribe to state changes:"]}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0 });

// Subscribe to changes
watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  console.log('Is first run?', isFirst);
});

// Updates will trigger the callback
const store = watch();
store.count.value = 1; // Logs: "Count: 1" and "Is first run? false"`}),e("h2",{children:"Callback Signature"}),e("p",{children:"The subscription callback receives two parameters:"}),e(r,{language:"typescript",code:`type RenewCallback<T> = (
  store: StateRefStore<T>,
  isFirst: boolean
) => void | AbortSignal;`}),e("h3",{children:"Parameters"}),e("ul",{children:[e("li",{children:[e("code",{children:"store"})," - The ",e("code",{children:"StateRefStore"})," reference (innerRef) that is automatically tracked"]}),e("li",{children:[e("code",{children:"isFirst"})," - Boolean indicating if this is the first execution of the callback"]})]}),e("h3",{children:"Return Value"}),e("p",{children:["The callback can optionally return an ",e("code",{children:"AbortSignal"})," to unsubscribe when the signal is aborted."]}),e("h2",{children:"Understanding isFirst Parameter"}),e("p",{children:["The ",e("code",{children:"isFirst"})," parameter helps distinguish between the initial callback execution and subsequent updates:"]}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0 });

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
// Output: "Count updated to: 5"`}),e("h2",{children:"InnerRef vs OuterRef"}),e("p",{children:["Understanding innerRef and outerRef is crucial: they are ",e("strong",{children:"the same reference"}),", both bound to the subscription. What matters is ",e("strong",{children:"which reference you use to READ properties"}),"during the callback."]}),e(r,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2 });

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
anotherRef.y.value = 20;  // ✗ Does NOT trigger`}),e("p",{children:[e("strong",{children:"Key principle"}),": Tracking is based on which reference was used to READ the property during subscription, not which reference is used to WRITE it later."]}),e("h2",{children:"Unsubscribing with AbortController"}),e("p",{children:["Use ",e("code",{children:"AbortController"})," to cancel subscriptions:"]}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0 });
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

store.count.value = 2; // ✗ Does NOT trigger callback (unsubscribed)`}),e("h2",{children:"Multiple Subscriptions"}),e("p",{children:"You can create multiple independent subscriptions to the same store:"}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0 });

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
// "Subscription 2: 20"`}),e("h2",{children:"Combining Reference Access and Subscription"}),e("p",{children:"The subscription callback returns a tracked reference, which you can use immediately:"}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0, name: 'StateRef' });

// Subscribe and get the tracked reference
const trackedStore = watch((store) => {
  console.log('State changed:', store.count.value);
});

// Also get an untracked reference for other operations
const untrackedStore = watch();

// Update via tracked reference - triggers callback
trackedStore.count.value = 5;
// ✓ Logs: "State changed: 5"

// Update via untracked reference - does NOT trigger callback
untrackedStore.count.value = 10;
// ✗ Does NOT log anything`}),e("h2",{children:"Selective Property Tracking"}),e("p",{children:"Subscriptions only track properties that are accessed within the callback:"}),e(r,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2, z: 3 });

const store = watch((innerRef) => {
  // Only accessing x, so only x changes trigger this callback
  console.log('x changed:', innerRef.x.value);
});

store.x.value = 10; // ✓ Triggers callback
store.y.value = 20; // ✗ Does NOT trigger (y was never accessed)
store.z.value = 30; // ✗ Does NOT trigger (z was never accessed)`}),e("h2",{children:"Common Patterns"}),e("h3",{children:"Component Integration"}),e(r,{language:"typescript",code:`// In a UI framework component
const MyComponent = () => {
  const store = appWatch((innerRef) => {
    // This triggers re-render when count changes
    console.log('Count updated:', innerRef.count.value);

    // Return component's cleanup signal
    return cleanupSignal;
  });

  return <div>{store.count.value}</div>;
};`}),e("h3",{children:"Derived State"}),e(r,{language:"typescript",code:`const watch = createStore({ firstName: 'John', lastName: 'Doe' });

watch((store) => {
  const fullName = \`\${store.firstName.value} \${store.lastName.value}\`;
  console.log('Full name:', fullName);
});

const store = watch();
store.firstName.value = 'Jane';
// Logs: "Full name: Jane Doe"`}),e("h3",{children:"Side Effects"}),e(r,{language:"typescript",code:`const watch = createStore({ userId: null });

watch((store, isFirst) => {
  // Access .value first to collect subscription
  const userId = store.userId.value;
  if (!isFirst && userId) {
    // Fetch user data when userId changes
    fetchUserData(userId);
  }
});`}),e("h2",{children:"Best Practices"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Use isFirst for initialization"})," - Distinguish setup logic from update logic"]}),e("li",{children:[e("strong",{children:"Return AbortSignal for cleanup"})," - Always clean up subscriptions in components"]}),e("li",{children:[e("strong",{children:"Be mindful of tracking"})," - Only the outerRef (returned by subscription) is tracked"]}),e("li",{children:[e("strong",{children:"Access only needed properties"})," - Subscriptions track only accessed properties"]}),e("li",{children:[e("strong",{children:"Avoid creating references in loops"})," - Create watch references at module or component level"]})]}),e("h2",{children:"Type Safety"}),e("p",{children:"The watch function is fully typed with TypeScript:"}),e(r,{language:"typescript",code:`interface User {
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
});`}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - Creating stores that return watch functions"]}),e("li",{children:[e("a",{href:"#/guide/references",children:"Understanding References"})," - Deep dive into innerRef, outerRef, and unbound references"]}),e("li",{children:[e("a",{href:"#/guide/subscription",children:"Subscription"})," - Advanced subscription patterns"]}),e("li",{children:[e("a",{href:"#/guide/state-ref-store",children:"StateRefStore"})," - Working with store references"]})]})]})),vc=f(()=>()=>e("div",{children:[e("h1",{children:"Watch 함수"}),e("p",{children:[e("code",{children:"watch"})," 함수는 ",e("code",{children:"createStore()"}),"가 반환하는 핵심 인터페이스입니다. 상태 참조 접근과 상태 변경 구독이라는 두 가지 목적으로 사용됩니다."]}),e("h2",{children:"개요"}),e("p",{children:[e("code",{children:"createStore()"}),"를 호출하면 두 가지 방식으로 사용할 수 있는 ",e("code",{children:"watch"})," 함수를 반환합니다:"]}),e("ul",{children:[e("li",{children:[e("strong",{children:"인자 없이 호출"}),": 값을 읽고 쓰기 위한 ",e("code",{children:"StateRefStore"})," 참조 반환"]}),e("li",{children:[e("strong",{children:"콜백과 함께 호출"}),": 변경 사항을 구독하고 추적되는 ",e("code",{children:"StateRefStore"})," 참조 반환"]})]}),e("h2",{children:"기본 사용법"}),e("h3",{children:"참조 얻기 (구독 없음)"}),e("p",{children:["인자 없이 ",e("code",{children:"watch()"}),"를 호출하여 상태를 읽고 쓰기 위한 참조를 얻습니다:"]}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

const watch = createStore({ count: 0, name: 'StateRef' });

// 구독 없이 참조 얻기
const store = watch();

// 값 읽기
console.log(store.count.value); // 0
console.log(store.name.value);  // 'StateRef'

// 값 쓰기
store.count.value = 10;
store.name.value = '업데이트됨';`}),e("h3",{children:"변경 사항 구독하기"}),e("p",{children:["콜백 함수와 함께 ",e("code",{children:"watch()"}),"를 호출하여 상태 변경을 구독합니다:"]}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0 });

// 변경 사항 구독
watch((store, isFirst) => {
  console.log('Count:', store.count.value);
  console.log('첫 실행?', isFirst);
});

// 업데이트는 콜백을 트리거합니다
const store = watch();
store.count.value = 1; // 로그: "Count: 1" 및 "첫 실행? false"`}),e("h2",{children:"콜백 시그니처"}),e("p",{children:"구독 콜백은 두 개의 파라미터를 받습니다:"}),e(r,{language:"typescript",code:`type RenewCallback<T> = (
  store: StateRefStore<T>,
  isFirst: boolean
) => void | AbortSignal;`}),e("h3",{children:"파라미터"}),e("ul",{children:[e("li",{children:[e("code",{children:"store"})," - 자동으로 추적되는 ",e("code",{children:"StateRefStore"})," 참조 (innerRef)"]}),e("li",{children:[e("code",{children:"isFirst"})," - 콜백의 첫 실행인지 나타내는 불리언 값"]})]}),e("h3",{children:"반환값"}),e("p",{children:["콜백은 선택적으로 ",e("code",{children:"AbortSignal"}),"을 반환하여 시그널이 중단되면 구독을 취소할 수 있습니다."]}),e("h2",{children:"isFirst 파라미터 이해하기"}),e("p",{children:[e("code",{children:"isFirst"})," 파라미터는 초기 콜백 실행과 이후 업데이트를 구분하는 데 도움이 됩니다:"]}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0 });

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
// 출력: "Count 업데이트됨: 5"`}),e("h2",{children:"InnerRef vs OuterRef"}),e("p",{children:["innerRef와 outerRef를 이해하는 것이 중요합니다: 둘은 ",e("strong",{children:"동일한 참조"}),"이며, 둘 다 구독에 바인딩되어 있습니다. 중요한 것은 콜백 중에 ",e("strong",{children:"어떤 참조로 프로퍼티를 읽는가(READ)"}),"입니다."]}),e(r,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2 });

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
anotherRef.y.value = 20;  // ✗ 트리거 안 함`}),e("p",{children:[e("strong",{children:"핵심 원칙"}),": 추적은 구독 중에 어떤 참조로 프로퍼티를 읽었는가(READ)에 기반하며, 나중에 어떤 참조로 쓰는가(WRITE)는 상관없습니다."]}),e("h2",{children:"AbortController로 구독 취소하기"}),e("p",{children:[e("code",{children:"AbortController"}),"를 사용하여 구독을 취소합니다:"]}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0 });
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

store.count.value = 2; // ✗ 콜백 트리거하지 않음 (구독 취소됨)`}),e("h2",{children:"여러 구독"}),e("p",{children:"동일한 스토어에 여러 독립적인 구독을 만들 수 있습니다:"}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0 });

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
// "구독 2: 20"`}),e("h2",{children:"참조 접근과 구독 결합하기"}),e("p",{children:"구독 콜백은 추적되는 참조를 반환하며, 즉시 사용할 수 있습니다:"}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0, name: 'StateRef' });

// 구독하고 추적되는 참조 얻기
const trackedStore = watch((store) => {
  console.log('상태 변경됨:', store.count.value);
});

// 다른 작업을 위해 추적되지 않는 참조도 얻기
const untrackedStore = watch();

// 추적되는 참조를 통한 업데이트 - 콜백 트리거
trackedStore.count.value = 5;
// ✓ 로그: "상태 변경됨: 5"

// 추적되지 않는 참조를 통한 업데이트 - 콜백 트리거하지 않음
untrackedStore.count.value = 10;
// ✗ 아무것도 로그하지 않음`}),e("h2",{children:"선택적 프로퍼티 추적"}),e("p",{children:"구독은 콜백 내에서 접근된 프로퍼티만 추적합니다:"}),e(r,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2, z: 3 });

const store = watch((innerRef) => {
  // x만 접근하므로, x 변경만 이 콜백을 트리거합니다
  console.log('x 변경됨:', innerRef.x.value);
});

store.x.value = 10; // ✓ 콜백 트리거
store.y.value = 20; // ✗ 트리거하지 않음 (y는 접근하지 않음)
store.z.value = 30; // ✗ 트리거하지 않음 (z는 접근하지 않음)`}),e("h2",{children:"일반적인 패턴"}),e("h3",{children:"컴포넌트 통합"}),e(r,{language:"typescript",code:`// UI 프레임워크 컴포넌트에서
const MyComponent = () => {
  const store = appWatch((innerRef) => {
    // count 변경 시 리렌더링 트리거
    console.log('Count 업데이트됨:', innerRef.count.value);

    // 컴포넌트의 정리 시그널 반환
    return cleanupSignal;
  });

  return <div>{store.count.value}</div>;
};`}),e("h3",{children:"파생 상태"}),e(r,{language:"typescript",code:`const watch = createStore({ firstName: 'John', lastName: 'Doe' });

watch((store) => {
  const fullName = \`\${store.firstName.value} \${store.lastName.value}\`;
  console.log('전체 이름:', fullName);
});

const store = watch();
store.firstName.value = 'Jane';
// 로그: "전체 이름: Jane Doe"`}),e("h3",{children:"사이드 이펙트"}),e(r,{language:"typescript",code:`const watch = createStore({ userId: null });

watch((store, isFirst) => {
  // 먼저 .value에 접근하여 구독 수집
  const userId = store.userId.value;
  if (!isFirst && userId) {
    // userId 변경 시 사용자 데이터 가져오기
    fetchUserData(userId);
  }
});`}),e("h2",{children:"모범 사례"}),e("ul",{children:[e("li",{children:[e("strong",{children:"초기화에 isFirst 사용"})," - 설정 로직과 업데이트 로직 구분"]}),e("li",{children:[e("strong",{children:"정리를 위해 AbortSignal 반환"})," - 컴포넌트에서 항상 구독 정리"]}),e("li",{children:[e("strong",{children:"추적에 주의"})," - outerRef(구독이 반환한 참조)만 추적됨"]}),e("li",{children:[e("strong",{children:"필요한 프로퍼티만 접근"})," - 구독은 접근된 프로퍼티만 추적"]}),e("li",{children:[e("strong",{children:"루프에서 참조 생성 금지"})," - 모듈 또는 컴포넌트 레벨에서 watch 참조 생성"]})]}),e("h2",{children:"타입 안전성"}),e("p",{children:"watch 함수는 TypeScript와 완전히 타입이 지정됩니다:"}),e(r,{language:"typescript",code:`interface User {
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
});`}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - watch 함수를 반환하는 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/references",children:"참조 이해하기"})," - innerRef, outerRef, 언바운드 참조 심층 분석"]}),e("li",{children:[e("a",{href:"#/ko/guide/subscription",children:"구독"})," - 고급 구독 패턴"]}),e("li",{children:[e("a",{href:"#/ko/guide/state-ref-store",children:"StateRefStore"})," - 스토어 참조 다루기"]})]})]})),Sc=f(()=>()=>e("div",{children:[e("h1",{children:"Understanding References"}),e("p",{children:["StateRef uses a reference-based tracking system to determine which state changes should trigger subscriptions. Understanding the difference between ",e("strong",{children:"innerRef"}),", ",e("strong",{children:"outerRef"}),", and ",e("strong",{children:"unbound references"})," is crucial for effective state management."]}),e("h2",{children:"Three Types of References"}),e("p",{children:"When working with StateRef, you'll encounter three types of references:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"innerRef"})," - The reference passed as the first parameter to subscription callbacks"]}),e("li",{children:[e("strong",{children:"outerRef"})," - The reference returned by ",e("code",{children:"watch()"})," when subscribing"]}),e("li",{children:[e("strong",{children:"Unbound reference"})," - References created by calling ",e("code",{children:"watch()"})," without a callback"]})]}),e("h2",{children:"InnerRef and OuterRef: The Same Reference"}),e("p",{children:["The most important concept to understand is that ",e("strong",{children:"innerRef and outerRef are the same reference"}),". Both are bound to the subscription and tracked for changes."]}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

const watch = createStore({ rowCount: 5, columnCount: 10 });

const subscribeCallback = (innerRef, isFirst) => {
  const matrixCount = innerRef.rowCount.value * innerRef.columnCount.value;
  console.log('Matrix count:', matrixCount);
};

// outerRef: Returned by watch(), bound to subscribeCallback
const outerRef = watch(subscribeCallback);

// Key insight: innerRef and outerRef are the SAME reference
// Both are tracked by the subscription`}),e("h2",{children:"Key Principle: Tracking is Based on Reading, Not Writing"}),e("p",{children:["The most important concept: ",e("strong",{children:"What matters is which reference you use to READ a property during subscription, not which reference you use to WRITE it later"}),"."]}),e(r,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2 });

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
anotherRef.y.value = 20;  // ✗ Does NOT trigger (y not tracked)`}),e("h2",{children:"Unbound References"}),e("p",{children:["An unbound reference is created by calling ",e("code",{children:"watch()"})," without a callback. These references can read and write state but don't register any tracking."]}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0, name: 'StateRef' });

// Unbound reference - no tracking
const unboundRef = watch();

// Read values
console.log(unboundRef.count.value);  // 0

// Write values - updates state but doesn't trigger subscriptions
unboundRef.count.value = 10;

// This reference exists independently of any subscription`}),e("h2",{children:"Selective Property Tracking"}),e("p",{children:["Only properties ",e("strong",{children:"read via tracked references (innerRef/outerRef)"})," within the subscription callback are tracked. Once a property is tracked, ",e("strong",{children:"any reference can modify it and trigger the callback"}),"."]}),e(r,{language:"typescript",code:`const watch = createStore({
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
outerRef.etcCount.value = 7;        // ✗ Does NOT trigger`}),e("p",{children:[e("strong",{children:"Key principle"}),": Tracking is determined by ",e("em",{children:"which reference was used to READ the property during subscription"}),", not which reference is used to WRITE it later. Once tracked, any write triggers the callback."]}),e("h2",{children:"Why This Design?"}),e("p",{children:"This reference-based tracking system provides several benefits:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Fine-grained control"})," - You decide exactly which properties trigger updates"]}),e("li",{children:[e("strong",{children:"Performance"})," - Only tracked properties cause re-renders"]}),e("li",{children:[e("strong",{children:"Flexibility"})," - Mix tracked and untracked access in the same callback"]}),e("li",{children:[e("strong",{children:"UI integration"})," - OuterRef makes component integration seamless"]})]}),e("h2",{children:"Practical Example: Component Integration"}),e("p",{children:"The outerRef design makes UI library integration particularly elegant. Here's an example using a hypothetical component framework:"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

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
});`}),e("h2",{children:"Multiple Independent Subscriptions"}),e("p",{children:"Each subscription has its own tracking context based on what properties were READ during its callback. Multiple subscriptions can coexist independently:"}),e(r,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2 });

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

// Each subscription has independent tracking`}),e("h2",{children:"Common Patterns"}),e("h3",{children:"Avoiding Unintended Tracking"}),e(r,{language:"typescript",code:`const watch = createStore({ config: { theme: 'dark' }, data: [] });

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
configRef.config.theme.value = 'light';`}),e("h3",{children:"Mixed Tracking Strategy"}),e(r,{language:"typescript",code:`const watch = createStore({
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
settingsRef.settings.lang.value = 'ko';`}),e("h2",{children:"Visual Summary"}),e(r,{language:"typescript",code:`const watch = createStore({ a: 1, b: 2, c: 3 });

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
outerRef.a.value = 20;    // ✓ Triggers`}),e("h2",{children:"Best Practices"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Read via innerRef to track"})," - Properties read via innerRef/outerRef are tracked; read via unbound refs to avoid tracking"]}),e("li",{children:[e("strong",{children:"Use unbound refs for static data"})," - Read configuration or constants via unbound refs so they don't trigger updates"]}),e("li",{children:[e("strong",{children:"Be explicit about tracking"})," - Make it clear which properties are tracked by choosing the right ref for reading"]}),e("li",{children:[e("strong",{children:"Remember: READ determines tracking, WRITE doesn't"})," - Any ref can trigger updates to tracked properties"]}),e("li",{children:[e("strong",{children:"Leverage outerRef for components"})," - Makes UI library integration natural"]}),e("li",{children:[e("strong",{children:"Understand the tracking context"})," - Each subscription has independent tracking"]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - Understanding the watch function API"]}),e("li",{children:[e("a",{href:"#/guide/subscription",children:"Subscription"})," - Advanced subscription patterns"]}),e("li",{children:[e("a",{href:"#/guide/state-ref-store",children:"StateRefStore"})," - Working with store references"]}),e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - Creating stores"]})]})]})),wc=f(()=>()=>e("div",{children:[e("h1",{children:"참조 이해하기"}),e("p",{children:["StateRef는 참조 기반 추적 시스템을 사용하여 어떤 상태 변경이 구독을 트리거해야 하는지 결정합니다.",e("strong",{children:"innerRef"}),", ",e("strong",{children:"outerRef"}),", ",e("strong",{children:"언바운드 참조"}),"의 차이를 이해하는 것은 효과적인 상태 관리에 필수적입니다."]}),e("h2",{children:"세 가지 참조 타입"}),e("p",{children:"StateRef를 사용할 때 세 가지 타입의 참조를 만나게 됩니다:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"innerRef"})," - 구독 콜백의 첫 번째 파라미터로 전달되는 참조"]}),e("li",{children:[e("strong",{children:"outerRef"})," - 구독 시 ",e("code",{children:"watch()"}),"가 반환하는 참조"]}),e("li",{children:[e("strong",{children:"언바운드 참조"})," - 콜백 없이 ",e("code",{children:"watch()"}),"를 호출하여 생성된 참조"]})]}),e("h2",{children:"InnerRef와 OuterRef: 동일한 참조"}),e("p",{children:["이해해야 할 가장 중요한 개념은 ",e("strong",{children:"innerRef와 outerRef가 동일한 참조"}),"라는 것입니다. 둘 다 구독에 바인딩되어 있으며 변경 사항이 추적됩니다."]}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

const watch = createStore({ rowCount: 5, columnCount: 10 });

const subscribeCallback = (innerRef, isFirst) => {
  const matrixCount = innerRef.rowCount.value * innerRef.columnCount.value;
  console.log('매트릭스 개수:', matrixCount);
};

// outerRef: watch()가 반환, subscribeCallback에 바인딩됨
const outerRef = watch(subscribeCallback);

// 핵심 인사이트: innerRef와 outerRef는 동일한 참조입니다
// 둘 다 구독에 의해 추적됩니다`}),e("h2",{children:"핵심 원칙: 추적은 읽기 기반이지, 쓰기 기반이 아닙니다"}),e("p",{children:["가장 중요한 개념: ",e("strong",{children:"중요한 것은 구독 중에 어떤 참조로 프로퍼티를 읽었는가(READ)이며, 나중에 어떤 참조로 쓰는가(WRITE)는 상관없습니다"}),"."]}),e(r,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2 });

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
anotherRef.y.value = 20;  // ✗ 트리거 안 함 (y 추적 안 됨)`}),e("h2",{children:"언바운드 참조"}),e("p",{children:["언바운드 참조는 콜백 없이 ",e("code",{children:"watch()"}),"를 호출하여 생성됩니다. 이러한 참조는 상태를 읽고 쓸 수 있지만 추적을 등록하지 않습니다."]}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0, name: 'StateRef' });

// 언바운드 참조 - 추적 없음
const unboundRef = watch();

// 값 읽기
console.log(unboundRef.count.value);  // 0

// 값 쓰기 - 상태는 업데이트하지만 구독을 트리거하지 않음
unboundRef.count.value = 10;

// 이 참조는 어떤 구독과도 독립적으로 존재합니다`}),e("h2",{children:"선택적 프로퍼티 추적"}),e("p",{children:["구독 콜백 내에서 ",e("strong",{children:"추적되는 참조(innerRef/outerRef)를 통해 읽은"})," 프로퍼티만 추적됩니다. 프로퍼티가 일단 추적되면, ",e("strong",{children:"어떤 참조로든 수정하면 콜백이 트리거됩니다"}),"."]}),e(r,{language:"typescript",code:`const watch = createStore({
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
outerRef.etcCount.value = 7;        // ✗ 트리거 안 함`}),e("p",{children:[e("strong",{children:"핵심 원칙"}),": 추적은 ",e("em",{children:"구독 중에 어떤 참조로 프로퍼티를 읽었는지(READ)"}),"에 의해 결정되며, 나중에 어떤 참조로 쓰는지(WRITE)는 상관없습니다. 일단 추적되면, 어떤 쓰기든 콜백을 트리거합니다."]}),e("h2",{children:"왜 이런 디자인인가?"}),e("p",{children:"이 참조 기반 추적 시스템은 여러 이점을 제공합니다:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"세밀한 제어"})," - 어떤 프로퍼티가 업데이트를 트리거할지 정확하게 결정"]}),e("li",{children:[e("strong",{children:"성능"})," - 추적된 프로퍼티만 리렌더링을 발생시킴"]}),e("li",{children:[e("strong",{children:"유연성"})," - 동일한 콜백에서 추적되는 접근과 추적되지 않는 접근을 혼합"]}),e("li",{children:[e("strong",{children:"UI 통합"})," - OuterRef가 컴포넌트 통합을 원활하게 만듦"]})]}),e("h2",{children:"실용 예제: 컴포넌트 통합"}),e("p",{children:"outerRef 디자인은 UI 라이브러리 통합을 특히 우아하게 만듭니다. 가상의 컴포넌트 프레임워크를 사용한 예제입니다:"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

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
});`}),e("h2",{children:"여러 독립적인 구독"}),e("p",{children:"각 구독은 콜백 중에 읽은(READ) 프로퍼티에 기반한 자체 추적 컨텍스트를 가집니다. 여러 구독이 독립적으로 공존할 수 있습니다:"}),e(r,{language:"typescript",code:`const watch = createStore({ x: 1, y: 2 });

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

// 각 구독은 독립적인 추적을 가집니다`}),e("h2",{children:"일반적인 패턴"}),e("h3",{children:"의도하지 않은 추적 방지"}),e(r,{language:"typescript",code:`const watch = createStore({ config: { theme: 'dark' }, data: [] });

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
configRef.config.theme.value = 'light';`}),e("h3",{children:"혼합 추적 전략"}),e(r,{language:"typescript",code:`const watch = createStore({
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
settingsRef.settings.lang.value = 'en';`}),e("h2",{children:"시각적 요약"}),e(r,{language:"typescript",code:`const watch = createStore({ a: 1, b: 2, c: 3 });

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
outerRef.a.value = 20;    // ✓ 트리거`}),e("h2",{children:"모범 사례"}),e("ul",{children:[e("li",{children:[e("strong",{children:"추적하려면 innerRef로 읽기"})," - innerRef/outerRef로 읽은 프로퍼티는 추적됨; 추적을 피하려면 언바운드 참조로 읽기"]}),e("li",{children:[e("strong",{children:"정적 데이터에 언바운드 참조 사용"})," - 설정이나 상수는 언바운드 참조로 읽어서 업데이트를 트리거하지 않도록 하기"]}),e("li",{children:[e("strong",{children:"추적에 대해 명시적으로"})," - 읽기에 올바른 참조를 선택하여 어떤 프로퍼티가 추적되는지 명확히 하기"]}),e("li",{children:[e("strong",{children:"기억하기: 읽기(READ)가 추적을 결정, 쓰기(WRITE)는 아님"})," - 어떤 참조든 추적된 프로퍼티에 대한 업데이트를 트리거 가능"]}),e("li",{children:[e("strong",{children:"컴포넌트에 outerRef 활용"})," - UI 라이브러리 통합을 자연스럽게 만듦"]}),e("li",{children:[e("strong",{children:"추적 컨텍스트 이해"})," - 각 구독은 독립적인 추적을 가짐"]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - watch 함수 API 이해하기"]}),e("li",{children:[e("a",{href:"#/ko/guide/subscription",children:"구독"})," - 고급 구독 패턴"]}),e("li",{children:[e("a",{href:"#/ko/guide/state-ref-store",children:"StateRefStore"})," - 스토어 참조 다루기"]}),e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 스토어 생성"]})]})]})),xc=f(()=>()=>e("div",{children:[e("h1",{children:"StateRefStore"}),e("p",{children:[e("code",{children:"StateRefStore"})," is the proxied reference type returned by the ",e("code",{children:"watch()"})," function. It wraps your state with a Proxy that enables reactive tracking and provides access to values through the ",e("code",{children:".value"})," property."]}),e("h2",{children:"The .value Property"}),e("p",{children:["All state access in StateRef happens through the ",e("code",{children:".value"})," property. This is the fundamental interface for both reading and writing state:"]}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

const watch = createStore({ count: 0, name: 'StateRef' });
const store = watch();

// Read values via .value
const currentCount = store.count.value;      // 0
const currentName = store.name.value;        // 'StateRef'

// Write values via .value
store.count.value = 10;
store.name.value = 'Updated';

console.log(store.count.value);  // 10`}),e("h2",{children:"Proxy-Based Reactivity"}),e("p",{children:"StateRefStore uses JavaScript Proxies to intercept property access. When you access a property, you get another proxy wrapping that nested value:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
console.log(store.user.profile.name.value);  // 'John' (actual string)`}),e("h2",{children:"Deep Nested Access"}),e("p",{children:"StateRefStore supports arbitrarily deep nesting. Each level returns a new proxy, allowing natural chained property access:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
];`}),e("h2",{children:"Working with Objects"}),e("p",{children:"When working with object properties, you can update individual fields or replace entire objects:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
};`}),e("h2",{children:"Working with Arrays"}),e("p",{children:"Arrays work seamlessly with StateRefStore, supporting both index access and array replacement:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
store.todos.value = [...currentTodos];  // Trigger update`}),e("h2",{children:"Copy-on-Write Semantics"}),e("p",{children:"StateRef uses copy-on-write to maintain immutability. When you update a nested property, only the path to that property is copied, sharing unchanged subtrees:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
console.log(store.e.value === originalE);      // true (same reference)`}),e("h2",{children:"Primitive Types"}),e("p",{children:["StateRefStore also works with primitive types (number, string, boolean). For primitives, the store itself has a ",e("code",{children:".value"})," property:"]}),e(r,{language:"typescript",code:`// Number store
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
toggle.value = true;`}),e("h2",{children:"Type Safety with TypeScript"}),e("p",{children:"StateRefStore is fully typed with TypeScript, providing autocomplete and type checking:"}),e(r,{language:"typescript",code:`interface User {
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
const userId: number = store.id.value;      // ✓ Correctly inferred as number`}),e("h2",{children:"Reading Without .value"}),e("p",{children:["If you access a property without ",e("code",{children:".value"}),", you get the proxy itself, not the actual value:"]}),e(r,{language:"typescript",code:`const watch = createStore({ count: 10 });
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
}`}),e("h2",{children:"Reference Equality"}),e("p",{children:"StateRefStore maintains reference equality for unchanged objects, which is crucial for optimization in UI frameworks:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
console.log(settingsRef1 === settingsRef2);  // false`}),e("h2",{children:"Common Patterns"}),e("h3",{children:"Conditional Updates"}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0, max: 10 });
const store = watch();

const increment = () => {
  if (store.count.value < store.max.value) {
    store.count.value += 1;
  }
};`}),e("h3",{children:"Batch Updates"}),e(r,{language:"typescript",code:`const watch = createStore({
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
};`}),e("h3",{children:"Reading for Computation"}),e(r,{language:"typescript",code:`const watch = createStore({
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
console.log(newArea);  // 300`}),e("h2",{children:"Performance Considerations"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Proxy overhead is minimal"})," - Modern JavaScript engines optimize proxy access well"]}),e("li",{children:[e("strong",{children:"Copy-on-write is efficient"})," - Only changed paths are copied, unchanged data is shared"]}),e("li",{children:[e("strong",{children:"Reference equality enables optimization"})," - UI frameworks can skip rendering unchanged subtrees"]}),e("li",{children:[e("strong",{children:"Batch updates when possible"})," - Update entire objects instead of individual properties to reduce subscription triggers"]})]}),e("h2",{children:"Best Practices"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Always use .value for actual values"})," - Remember that property access without .value returns a proxy"]}),e("li",{children:[e("strong",{children:"Prefer immutable updates"})," - Replace objects/arrays rather than mutating them when possible"]}),e("li",{children:[e("strong",{children:"Leverage reference equality"})," - Use strict equality checks for optimization"]}),e("li",{children:[e("strong",{children:"Type your stores"})," - Use TypeScript interfaces for better type safety and autocomplete"]}),e("li",{children:[e("strong",{children:"Batch related updates"})," - Update entire objects to minimize subscription triggers"]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - Creating stores that return StateRefStore references"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - Getting StateRefStore references via watch"]}),e("li",{children:[e("a",{href:"#/guide/references",children:"Understanding References"})," - How StateRefStore references work with tracking"]}),e("li",{children:[e("a",{href:"#/guide/primitives",children:"Primitive Types"})," - Working with primitive type stores"]})]})]})),Rc=f(()=>()=>e("div",{children:[e("h1",{children:"StateRefStore"}),e("p",{children:[e("code",{children:"StateRefStore"}),"는 ",e("code",{children:"watch()"})," 함수가 반환하는 프록시 참조 타입입니다. 상태를 Proxy로 감싸서 반응형 추적을 가능하게 하며 ",e("code",{children:".value"})," 프로퍼티를 통해 값에 접근할 수 있도록 합니다."]}),e("h2",{children:".value 프로퍼티"}),e("p",{children:["StateRef의 모든 상태 접근은 ",e("code",{children:".value"})," 프로퍼티를 통해 이루어집니다. 이것은 상태를 읽고 쓰는 기본 인터페이스입니다:"]}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

const watch = createStore({ count: 0, name: 'StateRef' });
const store = watch();

// .value를 통해 값 읽기
const currentCount = store.count.value;      // 0
const currentName = store.name.value;        // 'StateRef'

// .value를 통해 값 쓰기
store.count.value = 10;
store.name.value = '업데이트됨';

console.log(store.count.value);  // 10`}),e("h2",{children:"프록시 기반 반응성"}),e("p",{children:"StateRefStore는 JavaScript Proxy를 사용하여 프로퍼티 접근을 가로챕니다. 프로퍼티에 접근하면 중첩된 값을 감싼 또 다른 프록시를 얻게 됩니다:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
console.log(store.user.profile.name.value);  // 'John' (실제 문자열)`}),e("h2",{children:"깊은 중첩 접근"}),e("p",{children:"StateRefStore는 임의로 깊은 중첩을 지원합니다. 각 레벨은 새 프록시를 반환하여 자연스러운 체인 프로퍼티 접근을 가능하게 합니다:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
];`}),e("h2",{children:"객체 다루기"}),e("p",{children:"객체 프로퍼티로 작업할 때 개별 필드를 업데이트하거나 전체 객체를 교체할 수 있습니다:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
};`}),e("h2",{children:"배열 다루기"}),e("p",{children:"배열은 StateRefStore와 원활하게 작동하며, 인덱스 접근과 배열 교체를 모두 지원합니다:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
store.todos.value = [...currentTodos];  // 업데이트 트리거`}),e("h2",{children:"Copy-on-Write 의미론"}),e("p",{children:"StateRef는 불변성을 유지하기 위해 copy-on-write를 사용합니다. 중첩된 프로퍼티를 업데이트하면 해당 프로퍼티로의 경로만 복사되고 변경되지 않은 하위 트리는 공유됩니다:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
console.log(store.e.value === originalE);      // true (같은 참조)`}),e("h2",{children:"원시 타입"}),e("p",{children:["StateRefStore는 원시 타입(number, string, boolean)과도 작동합니다. 원시 타입의 경우 스토어 자체가 ",e("code",{children:".value"})," 프로퍼티를 가집니다:"]}),e(r,{language:"typescript",code:`// 숫자 스토어
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
toggle.value = true;`}),e("h2",{children:"TypeScript 타입 안전성"}),e("p",{children:"StateRefStore는 TypeScript와 완전히 타입이 지정되어 자동 완성과 타입 체크를 제공합니다:"}),e(r,{language:"typescript",code:`interface User {
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
const userId: number = store.id.value;      // ✓ number로 올바르게 추론`}),e("h2",{children:".value 없이 읽기"}),e("p",{children:[e("code",{children:".value"})," 없이 프로퍼티에 접근하면 실제 값이 아닌 프록시 자체를 얻게 됩니다:"]}),e(r,{language:"typescript",code:`const watch = createStore({ count: 10 });
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
}`}),e("h2",{children:"참조 동등성"}),e("p",{children:"StateRefStore는 변경되지 않은 객체에 대해 참조 동등성을 유지하며, 이는 UI 프레임워크의 최적화에 중요합니다:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
console.log(settingsRef1 === settingsRef2);  // false`}),e("h2",{children:"일반적인 패턴"}),e("h3",{children:"조건부 업데이트"}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0, max: 10 });
const store = watch();

const increment = () => {
  if (store.count.value < store.max.value) {
    store.count.value += 1;
  }
};`}),e("h3",{children:"배치 업데이트"}),e(r,{language:"typescript",code:`const watch = createStore({
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
};`}),e("h3",{children:"계산을 위한 읽기"}),e(r,{language:"typescript",code:`const watch = createStore({
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
console.log(newArea);  // 300`}),e("h2",{children:"성능 고려사항"}),e("ul",{children:[e("li",{children:[e("strong",{children:"프록시 오버헤드는 최소"})," - 최신 JavaScript 엔진은 프록시 접근을 잘 최적화함"]}),e("li",{children:[e("strong",{children:"Copy-on-write는 효율적"})," - 변경된 경로만 복사되고 변경되지 않은 데이터는 공유됨"]}),e("li",{children:[e("strong",{children:"참조 동등성이 최적화를 가능하게 함"})," - UI 프레임워크가 변경되지 않은 하위 트리의 렌더링을 건너뛸 수 있음"]}),e("li",{children:[e("strong",{children:"가능하면 배치 업데이트"})," - 개별 프로퍼티 대신 전체 객체를 업데이트하여 구독 트리거 줄이기"]})]}),e("h2",{children:"모범 사례"}),e("ul",{children:[e("li",{children:[e("strong",{children:"실제 값에는 항상 .value 사용"})," - .value 없는 프로퍼티 접근은 프록시를 반환한다는 것을 기억하기"]}),e("li",{children:[e("strong",{children:"불변 업데이트 선호"})," - 가능하면 객체/배열을 변경하지 말고 교체하기"]}),e("li",{children:[e("strong",{children:"참조 동등성 활용"})," - 최적화를 위해 엄격한 동등성 체크 사용"]}),e("li",{children:[e("strong",{children:"스토어에 타입 지정"})," - 더 나은 타입 안전성과 자동 완성을 위해 TypeScript 인터페이스 사용"]}),e("li",{children:[e("strong",{children:"관련 업데이트 배치"})," - 구독 트리거를 최소화하기 위해 전체 객체 업데이트"]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - StateRefStore 참조를 반환하는 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - watch를 통해 StateRefStore 참조 얻기"]}),e("li",{children:[e("a",{href:"#/ko/guide/references",children:"참조 이해하기"})," - StateRefStore 참조가 추적과 어떻게 작동하는지"]}),e("li",{children:[e("a",{href:"#/ko/guide/primitives",children:"원시 타입"})," - 원시 타입 스토어 다루기"]})]})]})),kc=f(()=>()=>e("div",{children:[e("h1",{children:"Subscription"}),e("p",{children:["Subscriptions in StateRef allow you to react to state changes automatically. When you pass a callback to the ",e("code",{children:"watch()"})," function, it creates a subscription that runs whenever tracked properties change."]}),e("h2",{children:"Basic Subscription"}),e("p",{children:["Create a subscription by passing a callback function to ",e("code",{children:"watch()"}),":"]}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

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
ref.count.value = 10;  // Logs all the values above`}),e("h2",{children:"Subscription Callback Signature"}),e("p",{children:["The subscription callback receives two parameters and can optionally return an ",e("code",{children:"AbortSignal"}),":"]}),e(r,{language:"typescript",code:`type RenewCallback<T> = (
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
});`}),e("h2",{children:"The isFirst Parameter"}),e("p",{children:["The ",e("code",{children:"isFirst"})," parameter indicates whether this is the initial execution or a subsequent update. This is useful for setup logic:"]}),e(r,{language:"typescript",code:`const watch = createStore({ userId: null, data: null });

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
});`}),e("h3",{children:"Common isFirst Patterns"}),e(r,{language:"typescript",code:`const watch = createStore({ items: [] });

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
});`}),e("h2",{children:"Unsubscribing with AbortController"}),e("p",{children:["Use ",e("code",{children:"AbortController"})," to cancel subscriptions when they're no longer needed:"]}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0 });
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

ref.count.value = 2;  // ✗ Does NOT trigger (unsubscribed)`}),e("h3",{children:"Component Cleanup Pattern"}),e(r,{language:"typescript",code:`const Component = () => {
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
};`}),e("h2",{children:"Multiple Subscriptions"}),e("p",{children:"You can create multiple independent subscriptions to the same store. Each subscription tracks only the properties it accesses:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
ref.theme.value = 'light'; // Triggers subscription 3 only`}),e("h2",{children:"Subscription Lifecycle"}),e("p",{children:"Understanding the subscription lifecycle helps prevent memory leaks and unexpected behavior:"}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0 });

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
trackedRef.count.value = 20;  // No callback triggered`}),e("h2",{children:"Selective Property Tracking"}),e("p",{children:"Subscriptions only react to properties that were READ via tracked references (innerRef/outerRef) during the callback:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
ref.settings.theme.value = 'light';  // ✗ Does NOT trigger (read via unbound ref)`}),e("h2",{children:"Derived State Pattern"}),e("p",{children:"Use subscriptions to compute derived state that depends on multiple properties:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
// fullName automatically updated to "Jane Doe"`}),e("h2",{children:"Side Effects Pattern"}),e("p",{children:"Subscriptions are perfect for side effects like API calls, logging, or analytics:"}),e(r,{language:"typescript",code:`const watch = createStore({ searchQuery: '', results: [] });

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
});`}),e("h3",{children:"Debouncing Pattern"}),e(r,{language:"typescript",code:`const watch = createStore({ searchQuery: '' });

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
});`}),e("h2",{children:"Conditional Subscriptions"}),e("p",{children:"You can create subscriptions conditionally based on application state:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
});`}),e("h2",{children:"Subscription Performance"}),e("p",{children:"Keep subscriptions efficient by following these guidelines:"}),e(r,{language:"typescript",code:`const watch = createStore({ items: [], filter: '', sort: 'asc' });

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
});`}),e("h2",{children:"Best Practices"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Always clean up subscriptions"})," - Use AbortController to prevent memory leaks"]}),e("li",{children:[e("strong",{children:"Use isFirst for initialization"})," - Distinguish setup from updates"]}),e("li",{children:[e("strong",{children:"Keep callbacks focused"})," - Each subscription should have a single responsibility"]}),e("li",{children:[e("strong",{children:"Avoid infinite loops"})," - Don't update tracked properties without checking if values changed"]}),e("li",{children:[e("strong",{children:"Be mindful of what you track"})," - Only read properties you actually need to react to"]}),e("li",{children:[e("strong",{children:"Use createComputed for derived state"})," - More efficient than manual subscriptions"]}),e("li",{children:[e("strong",{children:"Debounce expensive operations"})," - Don't perform heavy work on every update"]})]}),e("h2",{children:"Common Pitfalls"}),e("h3",{children:"Infinite Loop"}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0 });

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
});`}),e("h3",{children:"Forgotten Cleanup"}),e(r,{language:"typescript",code:`// ✗ Bad: No cleanup
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
};`}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - Understanding the watch function"]}),e("li",{children:[e("a",{href:"#/guide/references",children:"Understanding References"})," - How tracking works"]}),e("li",{children:[e("a",{href:"#/guide/computed",children:"createComputed"})," - Efficient derived state"]}),e("li",{children:[e("a",{href:"#/guide/combine-watch",children:"combineWatch"})," - Combining multiple subscriptions"]})]})]})),Cc=f(()=>()=>e("div",{children:[e("h1",{children:"구독"}),e("p",{children:["StateRef의 구독을 사용하면 상태 변경에 자동으로 반응할 수 있습니다.",e("code",{children:"watch()"})," 함수에 콜백을 전달하면 추적된 프로퍼티가 변경될 때마다 실행되는 구독이 생성됩니다."]}),e("h2",{children:"기본 구독"}),e("p",{children:[e("code",{children:"watch()"}),"에 콜백 함수를 전달하여 구독을 생성합니다:"]}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

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
ref.count.value = 10;  // 위의 모든 값 로그`}),e("h2",{children:"구독 콜백 시그니처"}),e("p",{children:["구독 콜백은 두 개의 파라미터를 받으며 선택적으로 ",e("code",{children:"AbortSignal"}),"을 반환할 수 있습니다:"]}),e(r,{language:"typescript",code:`type RenewCallback<T> = (
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
});`}),e("h2",{children:"isFirst 파라미터"}),e("p",{children:[e("code",{children:"isFirst"})," 파라미터는 초기 실행인지 이후 업데이트인지를 나타냅니다. 설정 로직에 유용합니다:"]}),e(r,{language:"typescript",code:`const watch = createStore({ userId: null, data: null });

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
});`}),e("h3",{children:"일반적인 isFirst 패턴"}),e(r,{language:"typescript",code:`const watch = createStore({ items: [] });

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
});`}),e("h2",{children:"AbortController로 구독 취소하기"}),e("p",{children:[e("code",{children:"AbortController"}),"를 사용하여 더 이상 필요하지 않은 구독을 취소합니다:"]}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0 });
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

ref.count.value = 2;  // ✗ 트리거 안 함 (구독 취소됨)`}),e("h3",{children:"컴포넌트 정리 패턴"}),e(r,{language:"typescript",code:`const Component = () => {
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
};`}),e("h2",{children:"여러 구독"}),e("p",{children:"동일한 스토어에 여러 독립적인 구독을 만들 수 있습니다. 각 구독은 접근하는 프로퍼티만 추적합니다:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
ref.theme.value = 'light'; // 구독 3만 트리거`}),e("h2",{children:"구독 생명주기"}),e("p",{children:"구독 생명주기를 이해하면 메모리 누수와 예상치 못한 동작을 방지할 수 있습니다:"}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0 });

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
trackedRef.count.value = 20;  // 콜백 트리거 안 됨`}),e("h2",{children:"선택적 프로퍼티 추적"}),e("p",{children:"구독은 콜백 중에 추적되는 참조(innerRef/outerRef)를 통해 읽은 프로퍼티에만 반응합니다:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
ref.settings.theme.value = 'light';  // ✗ 트리거 안 함 (언바운드 참조로 읽음)`}),e("h2",{children:"파생 상태 패턴"}),e("p",{children:"여러 프로퍼티에 의존하는 파생 상태를 계산하기 위해 구독을 사용합니다:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
// fullName이 자동으로 "Jane Doe"로 업데이트됨`}),e("h2",{children:"사이드 이펙트 패턴"}),e("p",{children:"구독은 API 호출, 로깅, 분석과 같은 사이드 이펙트에 완벽합니다:"}),e(r,{language:"typescript",code:`const watch = createStore({ searchQuery: '', results: [] });

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
});`}),e("h3",{children:"디바운싱 패턴"}),e(r,{language:"typescript",code:`const watch = createStore({ searchQuery: '' });

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
});`}),e("h2",{children:"조건부 구독"}),e("p",{children:"애플리케이션 상태에 따라 조건부로 구독을 생성할 수 있습니다:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
});`}),e("h2",{children:"구독 성능"}),e("p",{children:"다음 가이드라인을 따라 구독을 효율적으로 유지하세요:"}),e(r,{language:"typescript",code:`const watch = createStore({ items: [], filter: '', sort: 'asc' });

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
});`}),e("h2",{children:"모범 사례"}),e("ul",{children:[e("li",{children:[e("strong",{children:"항상 구독 정리"})," - 메모리 누수를 방지하기 위해 AbortController 사용"]}),e("li",{children:[e("strong",{children:"초기화에 isFirst 사용"})," - 설정과 업데이트 구분"]}),e("li",{children:[e("strong",{children:"콜백을 집중되게 유지"})," - 각 구독은 단일 책임을 가져야 함"]}),e("li",{children:[e("strong",{children:"무한 루프 방지"})," - 값이 변경되었는지 확인하지 않고 추적된 프로퍼티를 업데이트하지 말기"]}),e("li",{children:[e("strong",{children:"추적하는 것에 주의"})," - 실제로 반응해야 하는 프로퍼티만 읽기"]}),e("li",{children:[e("strong",{children:"파생 상태에 createComputed 사용"})," - 수동 구독보다 효율적"]}),e("li",{children:[e("strong",{children:"비용이 많이 드는 작업 디바운싱"})," - 모든 업데이트마다 무거운 작업 수행하지 말기"]})]}),e("h2",{children:"일반적인 함정"}),e("h3",{children:"무한 루프"}),e(r,{language:"typescript",code:`const watch = createStore({ count: 0 });

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
});`}),e("h3",{children:"잊어버린 정리"}),e(r,{language:"typescript",code:`// ✗ 나쁨: 정리 없음
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
};`}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - watch 함수 이해하기"]}),e("li",{children:[e("a",{href:"#/ko/guide/references",children:"참조 이해하기"})," - 추적 작동 방식"]}),e("li",{children:[e("a",{href:"#/ko/guide/computed",children:"createComputed"})," - 효율적인 파생 상태"]}),e("li",{children:[e("a",{href:"#/ko/guide/combine-watch",children:"combineWatch"})," - 여러 구독 결합"]})]})]})),Tc=f(()=>()=>e("div",{children:[e("h1",{children:"Primitive Types"}),e("p",{children:"StateRef works seamlessly with primitive types like numbers, strings, and booleans. While object stores are more common, primitive stores are useful for simple counters, toggles, or any single-value state."}),e("h2",{children:"Creating Primitive Stores"}),e("p",{children:["Create a primitive store by passing a primitive value to ",e("code",{children:"createStore()"}),":"]}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

// Number store
const countWatch = createStore(0);

// String store
const nameWatch = createStore('StateRef');

// Boolean store
const toggleWatch = createStore(false);

// Null/undefined stores
const nullableWatch = createStore<string | null>(null);`}),e("h2",{children:"Reading and Writing Values"}),e("p",{children:["For primitive stores, access the value directly via ",e("code",{children:".value"})," on the store reference:"]}),e(r,{language:"typescript",code:`const countWatch = createStore(100);
const count = countWatch();

// Read value
console.log(count.value);  // 100

// Write value
count.value = 200;
console.log(count.value);  // 200

// Increment
count.value += 1;
console.log(count.value);  // 201`}),e("h2",{children:"Subscribing to Changes"}),e("p",{children:"Subscribe to primitive store changes just like object stores:"}),e(r,{language:"typescript",code:`const countWatch = createStore(0);

// Subscribe to changes
countWatch((store, isFirst) => {
  console.log('Count:', store.value);
  console.log('Is first run?', isFirst);
});

// Trigger updates
const count = countWatch();
count.value = 10;  // Logs: Count: 10, Is first run? false
count.value = 20;  // Logs: Count: 20, Is first run? false`}),e("h2",{children:"TypeScript Type Inference"}),e("p",{children:"TypeScript automatically infers the type from the initial value, or you can explicitly specify the type:"}),e(r,{language:"typescript",code:`// Type inferred as number
const countWatch = createStore(0);

// Type inferred as string
const nameWatch = createStore('hello');

// Explicit type annotation
const scoreWatch = createStore<number>(0);

// Union types
const statusWatch = createStore<'idle' | 'loading' | 'done'>('idle');

// Nullable types
const userIdWatch = createStore<number | null>(null);`}),e("h2",{children:"Comparison with Object Stores"}),e("p",{children:"The key difference between primitive and object stores is the access pattern:"}),e(r,{language:"typescript",code:`// Object store
const objWatch = createStore({ count: 0 });
const objStore = objWatch();
console.log(objStore.count.value);  // Access nested property
objStore.count.value = 10;

// Primitive store
const primWatch = createStore(0);
const primStore = primWatch();
console.log(primStore.value);  // Access value directly
primStore.value = 10;`}),e("h2",{children:"Common Use Cases"}),e("h3",{children:"Counter"}),e(r,{language:"typescript",code:`const countWatch = createStore(0);

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
};`}),e("h3",{children:"Toggle"}),e(r,{language:"typescript",code:`const toggleWatch = createStore(false);

const toggle = () => {
  const state = toggleWatch();
  state.value = !state.value;
};

// Subscribe to toggle changes
toggleWatch((store) => {
  console.log('Toggle is now:', store.value ? 'ON' : 'OFF');
});`}),e("h3",{children:"Text Input"}),e(r,{language:"typescript",code:`const inputWatch = createStore('');

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
});`}),e("h3",{children:"Loading State"}),e(r,{language:"typescript",code:`const loadingWatch = createStore(false);

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
};`}),e("h2",{children:"Using with AbortController"}),e("p",{children:["Cancel subscriptions to primitive stores using ",e("code",{children:"AbortController"}),":"]}),e(r,{language:"typescript",code:`const countWatch = createStore(0);
const controller = new AbortController();

countWatch((store) => {
  console.log('Count:', store.value);
  return controller.signal;
});

const count = countWatch();
count.value = 1;  // Logs: Count: 1

controller.abort();

count.value = 2;  // No log (subscription cancelled)`}),e("h2",{children:"Combining with createComputed"}),e("p",{children:["Primitive stores work well with ",e("code",{children:"createComputed"})," for derived values:"]}),e(r,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';

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
width.value = 15;  // Logs: Area: 300`}),e("h2",{children:"Framework Integration"}),e("p",{children:"Primitive stores integrate with UI frameworks the same way as object stores:"}),e(r,{language:"typescript",code:`// React example
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
}`}),e("h2",{children:"Best Practices"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Use primitive stores for simple state"})," - Counters, toggles, single values"]}),e("li",{children:[e("strong",{children:"Use object stores for complex state"})," - Multiple related values"]}),e("li",{children:[e("strong",{children:"Type your stores"})," - Especially for union types and nullable values"]}),e("li",{children:[e("strong",{children:"Consider combining stores"})," - Use ",e("code",{children:"createComputed"})," or ",e("code",{children:"combineWatch"})," when primitive stores need to work together"]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - Creating stores"]}),e("li",{children:[e("a",{href:"#/guide/state-ref-store",children:"StateRefStore"})," - Working with store references"]}),e("li",{children:[e("a",{href:"#/guide/computed",children:"createComputed"})," - Deriving values from stores"]}),e("li",{children:[e("a",{href:"#/guide/combine-watch",children:"combineWatch"})," - Combining multiple stores"]})]})]})),Wc=f(()=>()=>e("div",{children:[e("h1",{children:"원시 타입"}),e("p",{children:"StateRef는 숫자, 문자열, 불리언 같은 원시 타입과도 완벽하게 작동합니다. 객체 스토어가 더 일반적이지만, 원시 타입 스토어는 간단한 카운터, 토글, 또는 단일 값 상태에 유용합니다."}),e("h2",{children:"원시 타입 스토어 생성"}),e("p",{children:[e("code",{children:"createStore()"}),"에 원시 값을 전달하여 원시 타입 스토어를 생성합니다:"]}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

// 숫자 스토어
const countWatch = createStore(0);

// 문자열 스토어
const nameWatch = createStore('StateRef');

// 불리언 스토어
const toggleWatch = createStore(false);

// Null/undefined 스토어
const nullableWatch = createStore<string | null>(null);`}),e("h2",{children:"값 읽기와 쓰기"}),e("p",{children:["원시 타입 스토어의 경우, 스토어 참조에서 ",e("code",{children:".value"}),"를 통해 직접 값에 접근합니다:"]}),e(r,{language:"typescript",code:`const countWatch = createStore(100);
const count = countWatch();

// 값 읽기
console.log(count.value);  // 100

// 값 쓰기
count.value = 200;
console.log(count.value);  // 200

// 증가
count.value += 1;
console.log(count.value);  // 201`}),e("h2",{children:"변경 사항 구독"}),e("p",{children:"객체 스토어와 마찬가지로 원시 타입 스토어의 변경 사항을 구독합니다:"}),e(r,{language:"typescript",code:`const countWatch = createStore(0);

// 변경 사항 구독
countWatch((store, isFirst) => {
  console.log('Count:', store.value);
  console.log('첫 실행?', isFirst);
});

// 업데이트 트리거
const count = countWatch();
count.value = 10;  // 로그: Count: 10, 첫 실행? false
count.value = 20;  // 로그: Count: 20, 첫 실행? false`}),e("h2",{children:"TypeScript 타입 추론"}),e("p",{children:"TypeScript는 초기값에서 자동으로 타입을 추론하거나, 명시적으로 타입을 지정할 수 있습니다:"}),e(r,{language:"typescript",code:`// number로 타입 추론
const countWatch = createStore(0);

// string으로 타입 추론
const nameWatch = createStore('hello');

// 명시적 타입 지정
const scoreWatch = createStore<number>(0);

// 유니온 타입
const statusWatch = createStore<'idle' | 'loading' | 'done'>('idle');

// 널러블 타입
const userIdWatch = createStore<number | null>(null);`}),e("h2",{children:"객체 스토어와의 비교"}),e("p",{children:"원시 타입과 객체 스토어의 주요 차이점은 접근 패턴입니다:"}),e(r,{language:"typescript",code:`// 객체 스토어
const objWatch = createStore({ count: 0 });
const objStore = objWatch();
console.log(objStore.count.value);  // 중첩 프로퍼티 접근
objStore.count.value = 10;

// 원시 타입 스토어
const primWatch = createStore(0);
const primStore = primWatch();
console.log(primStore.value);  // 직접 값 접근
primStore.value = 10;`}),e("h2",{children:"일반적인 사용 사례"}),e("h3",{children:"카운터"}),e(r,{language:"typescript",code:`const countWatch = createStore(0);

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
};`}),e("h3",{children:"토글"}),e(r,{language:"typescript",code:`const toggleWatch = createStore(false);

const toggle = () => {
  const state = toggleWatch();
  state.value = !state.value;
};

// 토글 변경 구독
toggleWatch((store) => {
  console.log('토글 상태:', store.value ? '켜짐' : '꺼짐');
});`}),e("h3",{children:"텍스트 입력"}),e(r,{language:"typescript",code:`const inputWatch = createStore('');

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
});`}),e("h3",{children:"로딩 상태"}),e(r,{language:"typescript",code:`const loadingWatch = createStore(false);

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
};`}),e("h2",{children:"AbortController 사용하기"}),e("p",{children:[e("code",{children:"AbortController"}),"를 사용하여 원시 타입 스토어의 구독을 취소합니다:"]}),e(r,{language:"typescript",code:`const countWatch = createStore(0);
const controller = new AbortController();

countWatch((store) => {
  console.log('Count:', store.value);
  return controller.signal;
});

const count = countWatch();
count.value = 1;  // 로그: Count: 1

controller.abort();

count.value = 2;  // 로그 없음 (구독 취소됨)`}),e("h2",{children:"createComputed와 결합하기"}),e("p",{children:["원시 타입 스토어는 파생 값을 위해 ",e("code",{children:"createComputed"}),"와 잘 작동합니다:"]}),e(r,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';

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
width.value = 15;  // 로그: 면적: 300`}),e("h2",{children:"프레임워크 연동"}),e("p",{children:"원시 타입 스토어는 객체 스토어와 동일한 방식으로 UI 프레임워크와 연동됩니다:"}),e(r,{language:"typescript",code:`// React 예제
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
}`}),e("h2",{children:"모범 사례"}),e("ul",{children:[e("li",{children:[e("strong",{children:"간단한 상태에 원시 타입 스토어 사용"})," - 카운터, 토글, 단일 값"]}),e("li",{children:[e("strong",{children:"복잡한 상태에 객체 스토어 사용"})," - 여러 관련 값"]}),e("li",{children:[e("strong",{children:"스토어에 타입 지정"})," - 특히 유니온 타입과 널러블 값에"]}),e("li",{children:[e("strong",{children:"스토어 결합 고려"})," - 원시 타입 스토어들이 함께 작동해야 할 때 ",e("code",{children:"createComputed"}),"나 ",e("code",{children:"combineWatch"})," 사용"]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/state-ref-store",children:"StateRefStore"})," - 스토어 참조 다루기"]}),e("li",{children:[e("a",{href:"#/ko/guide/computed",children:"createComputed"})," - 스토어에서 값 파생"]}),e("li",{children:[e("a",{href:"#/ko/guide/combine-watch",children:"combineWatch"})," - 여러 스토어 결합"]})]})]})),Ac=f(()=>()=>e("div",{children:[e("h1",{children:"createComputed"}),e("p",{children:[e("code",{children:"createComputed"})," is a helper function that combines multiple watches to produce a new computed (derived) value. It executes a callback function whenever the computed value changes."]}),e("p",{children:["A watch created with ",e("code",{children:"createComputed"})," can be used just like any other watch, including integrations such as ",e("code",{children:"connectReact"})," or ",e("code",{children:"connectPreact"}),"."]}),e("h2",{children:"Basic Usage"}),e(r,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';

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
console.log(sumRef.value);  // 35`}),e("h2",{children:"Syntax"}),e(r,{language:"typescript",code:`createComputed<W extends readonly Watch<any>[], R>(
  watches: W,
  callback: (refs: StateRefsTuple<W>) => R
): (computedCallback?: (proxy: { value: R }, isFirst: boolean) => void) => { value: R }`}),e("h3",{children:"Parameters"}),e("ul",{children:[e("li",{children:[e("code",{children:"watches"})," - An array of watch functions to combine"]}),e("li",{children:[e("code",{children:"callback"})," - A function that receives the store references and returns the computed value"]})]}),e("h3",{children:"Returns"}),e("p",{children:"Returns a watch-like function that can be called with or without a callback:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Without callback"}),": Returns a read-only proxy with ",e("code",{children:".value"})]}),e("li",{children:[e("strong",{children:"With callback"}),": Subscribes to changes and returns the same proxy"]})]}),e("h2",{children:"Subscribing to Computed Values"}),e("p",{children:"Pass a callback to subscribe to computed value changes:"}),e(r,{language:"typescript",code:`const watch1 = createStore(100);
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
// Logs: Difference: 150, Is first run? false`}),e("h2",{children:"Read-Only Values"}),e("p",{children:"Computed values are read-only. Attempting to set the value will show a warning:"}),e(r,{language:"typescript",code:`const watch1 = createStore(10);
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
console.log(sumRef.value);  // Still 30`}),e("h2",{children:"Complex Computed Values"}),e("p",{children:"The computed callback can return any type, including objects:"}),e(r,{language:"typescript",code:`const userWatch = createStore({ firstName: 'John', lastName: 'Doe' });
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
// { name: 'John Doe', initials: 'JD' }`}),e("h2",{children:"Combining Multiple Stores"}),e("p",{children:"You can combine any number of stores in a single computed:"}),e(r,{language:"typescript",code:`const priceWatch = createStore(100);
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
// { subtotal: 300, tax: 30, discount: 10, total: 320 }`}),e("h2",{children:"Using with Framework Connectors"}),e("p",{children:"Computed watches work seamlessly with framework connectors:"}),e(r,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';
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
}`}),e("h2",{children:"Chaining Computed Values"}),e("p",{children:"Computed watches can be used as inputs to other computed watches:"}),e(r,{language:"typescript",code:`const baseWatch = createStore(100);
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
console.log(formatted.value);  // "Result: 100"`}),e("h2",{children:"TypeScript Support"}),e("p",{children:[e("code",{children:"createComputed"})," provides full TypeScript inference:"]}),e(r,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';
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
// result.value is typed as { userName: string; doubleAge: number }`}),e("h2",{children:"Performance Considerations"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Computed values are cached"})," - The callback only runs when source values change"]}),e("li",{children:[e("strong",{children:"Fine-grained updates"})," - Only accessed properties trigger recomputation"]}),e("li",{children:[e("strong",{children:"Avoid heavy computations"})," - Keep callback functions efficient"]})]}),e(r,{language:"typescript",code:`// Good: Simple computation
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
);`}),e("h2",{children:"Comparison with combineWatch"}),e("p",{children:[e("code",{children:"createComputed"})," and ",e("code",{children:"combineWatch"})," serve different purposes:"]}),e("ul",{children:[e("li",{children:[e("strong",{children:"createComputed"})," - Derives a ",e("em",{children:"new value"})," from multiple stores"]}),e("li",{children:[e("strong",{children:"combineWatch"})," - Groups multiple stores into a ",e("em",{children:"tuple structure"})]})]}),e(r,{language:"typescript",code:`import { createStore, createComputed, combineWatch } from 'state-ref';

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
console.log(combined[1].value);  // 20`}),e("h2",{children:"Best Practices"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Keep computations pure"})," - No side effects in the callback"]}),e("li",{children:[e("strong",{children:"Access only needed values"})," - Don't read properties you don't use"]}),e("li",{children:[e("strong",{children:"Use for derived state"})," - Perfect for values that depend on other state"]}),e("li",{children:[e("strong",{children:"Prefer over manual subscriptions"})," - Cleaner and more efficient"]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - Creating source stores"]}),e("li",{children:[e("a",{href:"#/guide/combine-watch",children:"combineWatch"})," - Grouping multiple watches"]}),e("li",{children:[e("a",{href:"#/guide/subscription",children:"Subscription"})," - Understanding subscriptions"]}),e("li",{children:[e("a",{href:"#/guide/react",children:"React Integration"})," - Using with React"]})]})]})),Ec=f(()=>()=>e("div",{children:[e("h1",{children:"createComputed"}),e("p",{children:[e("code",{children:"createComputed"}),"는 여러 watch를 결합하여 새로운 계산된(파생) 값을 생성하는 헬퍼 함수입니다. 계산된 값이 변경될 때마다 콜백 함수를 실행합니다."]}),e("p",{children:[e("code",{children:"createComputed"}),"로 생성된 watch는 다른 watch처럼 사용할 수 있으며,",e("code",{children:"connectReact"}),"나 ",e("code",{children:"connectPreact"})," 같은 연동에서도 사용할 수 있습니다."]}),e("h2",{children:"기본 사용법"}),e(r,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';

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
console.log(sumRef.value);  // 35`}),e("h2",{children:"문법"}),e(r,{language:"typescript",code:`createComputed<W extends readonly Watch<any>[], R>(
  watches: W,
  callback: (refs: StateRefsTuple<W>) => R
): (computedCallback?: (proxy: { value: R }, isFirst: boolean) => void) => { value: R }`}),e("h3",{children:"매개변수"}),e("ul",{children:[e("li",{children:[e("code",{children:"watches"})," - 결합할 watch 함수 배열"]}),e("li",{children:[e("code",{children:"callback"})," - 스토어 참조를 받아 계산된 값을 반환하는 함수"]})]}),e("h3",{children:"반환값"}),e("p",{children:"콜백 유무에 따라 호출할 수 있는 watch와 유사한 함수를 반환합니다:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"콜백 없이"}),": ",e("code",{children:".value"}),"를 가진 읽기 전용 프록시 반환"]}),e("li",{children:[e("strong",{children:"콜백과 함께"}),": 변경 사항을 구독하고 동일한 프록시 반환"]})]}),e("h2",{children:"계산된 값 구독"}),e("p",{children:"콜백을 전달하여 계산된 값 변경을 구독합니다:"}),e(r,{language:"typescript",code:`const watch1 = createStore(100);
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
// 로그: 차이: 150, 첫 실행? false`}),e("h2",{children:"읽기 전용 값"}),e("p",{children:"계산된 값은 읽기 전용입니다. 값을 설정하려고 하면 경고가 표시됩니다:"}),e(r,{language:"typescript",code:`const watch1 = createStore(10);
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
console.log(sumRef.value);  // 여전히 30`}),e("h2",{children:"복잡한 계산된 값"}),e("p",{children:"계산 콜백은 객체를 포함한 모든 타입을 반환할 수 있습니다:"}),e(r,{language:"typescript",code:`const userWatch = createStore({ firstName: 'John', lastName: 'Doe' });
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
// { name: 'John Doe', initials: 'JD' }`}),e("h2",{children:"여러 스토어 결합"}),e("p",{children:"단일 computed에서 여러 스토어를 결합할 수 있습니다:"}),e(r,{language:"typescript",code:`const priceWatch = createStore(100);
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
// { subtotal: 300, tax: 30, discount: 10, total: 320 }`}),e("h2",{children:"프레임워크 커넥터와 사용"}),e("p",{children:"계산된 watch는 프레임워크 커넥터와 원활하게 작동합니다:"}),e(r,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';
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
}`}),e("h2",{children:"계산된 값 체이닝"}),e("p",{children:"계산된 watch를 다른 계산된 watch의 입력으로 사용할 수 있습니다:"}),e(r,{language:"typescript",code:`const baseWatch = createStore(100);
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
console.log(formatted.value);  // "결과: 100"`}),e("h2",{children:"TypeScript 지원"}),e("p",{children:[e("code",{children:"createComputed"}),"는 완전한 TypeScript 추론을 제공합니다:"]}),e(r,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';
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
// result.value는 { userName: string; doubleAge: number } 타입`}),e("h2",{children:"성능 고려사항"}),e("ul",{children:[e("li",{children:[e("strong",{children:"계산된 값은 캐시됨"})," - 콜백은 소스 값이 변경될 때만 실행됨"]}),e("li",{children:[e("strong",{children:"세밀한 업데이트"})," - 접근한 프로퍼티만 재계산을 트리거함"]}),e("li",{children:[e("strong",{children:"무거운 계산 피하기"})," - 콜백 함수를 효율적으로 유지하기"]})]}),e(r,{language:"typescript",code:`// 좋음: 간단한 계산
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
);`}),e("h2",{children:"combineWatch와 비교"}),e("p",{children:[e("code",{children:"createComputed"}),"와 ",e("code",{children:"combineWatch"}),"는 다른 목적을 가지고 있습니다:"]}),e("ul",{children:[e("li",{children:[e("strong",{children:"createComputed"})," - 여러 스토어에서 ",e("em",{children:"새로운 값"}),"을 파생"]}),e("li",{children:[e("strong",{children:"combineWatch"})," - 여러 스토어를 ",e("em",{children:"튜플 구조"}),"로 그룹화"]})]}),e(r,{language:"typescript",code:`import { createStore, createComputed, combineWatch } from 'state-ref';

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
console.log(combined[1].value);  // 20`}),e("h2",{children:"모범 사례"}),e("ul",{children:[e("li",{children:[e("strong",{children:"순수한 계산 유지"})," - 콜백에서 사이드 이펙트 없이"]}),e("li",{children:[e("strong",{children:"필요한 값만 접근"})," - 사용하지 않는 프로퍼티는 읽지 않기"]}),e("li",{children:[e("strong",{children:"파생 상태에 사용"})," - 다른 상태에 의존하는 값에 완벽"]}),e("li",{children:[e("strong",{children:"수동 구독보다 선호"})," - 더 깔끔하고 효율적"]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 소스 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/combine-watch",children:"combineWatch"})," - 여러 watch 그룹화"]}),e("li",{children:[e("a",{href:"#/ko/guide/subscription",children:"구독"})," - 구독 이해하기"]}),e("li",{children:[e("a",{href:"#/ko/guide/react",children:"React 연동"})," - React와 함께 사용"]})]})]})),Nc=f(()=>()=>e("div",{children:[e("h1",{children:"combineWatch"}),e("p",{children:[e("code",{children:"combineWatch"})," is a helper function that observes multiple ",e("code",{children:"Watch"})," instances together and produces a new ",e("code",{children:"Watch"})," that delivers their combined values as a tuple-like structure."]}),e("p",{children:["Unlike ",e("code",{children:"createComputed"}),", which produces a single derived value,",e("code",{children:"combineWatch"})," focuses on grouping multiple watches so you can react to changes from any of them in a single subscription."]}),e("h2",{children:"Basic Usage"}),e(r,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';

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
// Logs: Count: 200, Text: hello, Is first? false`}),e("h2",{children:"Syntax"}),e(r,{language:"typescript",code:`combineWatch<W extends readonly Watch<any>[]>(
  watches: [...W]
): Watch<CombinedValue<W>>`}),e("h3",{children:"Parameters"}),e("ul",{children:e("li",{children:[e("code",{children:"watches"})," - An array of watch functions to combine"]})}),e("h3",{children:"Returns"}),e("p",{children:["Returns a new ",e("code",{children:"Watch"})," function that provides access to all combined stores as a tuple. The returned watch can be used like any other watch function."]}),e("h2",{children:"Accessing Combined Values"}),e("p",{children:"The combined store is accessed as a tuple (array) by index:"}),e(r,{language:"typescript",code:`const watch1 = createStore(10);
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
combined[1].value = 'world';`}),e("h2",{children:"Subscribing to Changes"}),e("p",{children:"Pass a callback to subscribe to changes from any of the combined watches:"}),e(r,{language:"typescript",code:`const userWatch = createStore({ name: 'John' });
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
// Logs: User: Jane, Theme: dark`}),e("h2",{children:"Nested Combination"}),e("p",{children:["You can nest ",e("code",{children:"combineWatch"})," to observe more complex structures:"]}),e(r,{language:"typescript",code:`const countWatch = createStore(100);
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
});`}),e("h2",{children:"Read-Only Root Value"}),e("p",{children:["The combined store's root ",e("code",{children:".value"})," is read-only and shows a warning if accessed directly. Always access individual stores by index:"]}),e(r,{language:"typescript",code:`const watch1 = createStore(10);
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
combined[1].value = 40;`}),e("h2",{children:"Using with as const"}),e("p",{children:["For better TypeScript inference, use ",e("code",{children:"as const"})," with the watches array:"]}),e(r,{language:"typescript",code:`const countWatch = createStore(100);
const textWatch = createStore('hello');

// With 'as const' for precise tuple typing
const combinedWatch = combineWatch([countWatch, textWatch] as const);

combinedWatch(([countRef, textRef]) => {
  // TypeScript knows:
  // countRef.value is number
  // textRef.value is string
  console.log(countRef.value + 1);      // OK
  console.log(textRef.value.toUpperCase());  // OK
});`}),e("h2",{children:"Framework Integration"}),e("p",{children:"Combined watches work with framework connectors:"}),e(r,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';
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
}`}),e("h2",{children:"Comparison with createComputed"}),e("p",{children:"Choose the right tool based on your needs:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"combineWatch"})," - Groups stores, maintains individual access"]}),e("li",{children:[e("strong",{children:"createComputed"})," - Derives a new single value from stores"]})]}),e(r,{language:"typescript",code:`import { createStore, combineWatch, createComputed } from 'state-ref';

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
console.log(area.value);  // 200 (computed area)`}),e("h2",{children:"Use Cases"}),e("h3",{children:"Coordinating Multiple Stores"}),e(r,{language:"typescript",code:`const authWatch = createStore({ user: null, token: null });
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
});`}),e("h3",{children:"Form with Multiple Fields"}),e(r,{language:"typescript",code:`const nameWatch = createStore('');
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
});`}),e("h2",{children:"TypeScript Support"}),e("p",{children:[e("code",{children:"combineWatch"})," preserves type information for each store in the tuple:"]}),e(r,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';

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
});`}),e("h2",{children:"Best Practices"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Use for grouping related stores"})," - When you need to react to multiple stores together"]}),e("li",{children:[e("strong",{children:"Access by index"})," - Always use ",e("code",{children:"combined[0]"}),", ",e("code",{children:"combined[1]"}),", etc."]}),e("li",{children:[e("strong",{children:["Use ",e("code",{children:"as const"})]})," - For better TypeScript tuple inference"]}),e("li",{children:[e("strong",{children:"Prefer createComputed for derived values"})," - Use combineWatch only when you need individual store access"]}),e("li",{children:[e("strong",{children:"Access .value first in callbacks"})," - Ensure subscription collection before conditionals"]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/computed",children:"createComputed"})," - Deriving single values from stores"]}),e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - Creating individual stores"]}),e("li",{children:[e("a",{href:"#/guide/subscription",children:"Subscription"})," - Understanding subscriptions"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - The watch function API"]})]})]})),Ic=f(()=>()=>e("div",{children:[e("h1",{children:"combineWatch"}),e("p",{children:[e("code",{children:"combineWatch"}),"는 여러 ",e("code",{children:"Watch"})," 인스턴스를 함께 관찰하고 그 결합된 값을 튜플과 같은 구조로 전달하는 새로운 ",e("code",{children:"Watch"}),"를 생성하는 헬퍼 함수입니다."]}),e("p",{children:["단일 파생 값을 생성하는 ",e("code",{children:"createComputed"}),"와 달리,",e("code",{children:"combineWatch"}),"는 여러 watch를 그룹화하여 단일 구독에서 어떤 것이든 변경에 반응할 수 있게 하는 데 초점을 맞춥니다."]}),e("h2",{children:"기본 사용법"}),e(r,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';

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
// 로그: Count: 200, Text: hello, 첫 실행? false`}),e("h2",{children:"문법"}),e(r,{language:"typescript",code:`combineWatch<W extends readonly Watch<any>[]>(
  watches: [...W]
): Watch<CombinedValue<W>>`}),e("h3",{children:"매개변수"}),e("ul",{children:e("li",{children:[e("code",{children:"watches"})," - 결합할 watch 함수 배열"]})}),e("h3",{children:"반환값"}),e("p",{children:["모든 결합된 스토어에 튜플로 접근할 수 있는 새로운 ",e("code",{children:"Watch"})," 함수를 반환합니다. 반환된 watch는 다른 watch 함수처럼 사용할 수 있습니다."]}),e("h2",{children:"결합된 값 접근"}),e("p",{children:"결합된 스토어는 인덱스로 튜플(배열)처럼 접근합니다:"}),e(r,{language:"typescript",code:`const watch1 = createStore(10);
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
combined[1].value = 'world';`}),e("h2",{children:"변경 사항 구독"}),e("p",{children:"콜백을 전달하여 결합된 watch 중 어느 것이든 변경을 구독합니다:"}),e(r,{language:"typescript",code:`const userWatch = createStore({ name: 'John' });
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
// 로그: 사용자: Jane, 테마: dark`}),e("h2",{children:"중첩 결합"}),e("p",{children:[e("code",{children:"combineWatch"}),"를 중첩하여 더 복잡한 구조를 관찰할 수 있습니다:"]}),e(r,{language:"typescript",code:`const countWatch = createStore(100);
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
});`}),e("h2",{children:"읽기 전용 루트 값"}),e("p",{children:["결합된 스토어의 루트 ",e("code",{children:".value"}),"는 읽기 전용이며 직접 접근하면 경고가 표시됩니다. 항상 인덱스로 개별 스토어에 접근하세요:"]}),e(r,{language:"typescript",code:`const watch1 = createStore(10);
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
combined[1].value = 40;`}),e("h2",{children:"as const 사용"}),e("p",{children:["더 나은 TypeScript 추론을 위해 watches 배열에 ",e("code",{children:"as const"}),"를 사용하세요:"]}),e(r,{language:"typescript",code:`const countWatch = createStore(100);
const textWatch = createStore('hello');

// 정확한 튜플 타이핑을 위해 'as const' 사용
const combinedWatch = combineWatch([countWatch, textWatch] as const);

combinedWatch(([countRef, textRef]) => {
  // TypeScript가 알고 있음:
  // countRef.value는 number
  // textRef.value는 string
  console.log(countRef.value + 1);      // OK
  console.log(textRef.value.toUpperCase());  // OK
});`}),e("h2",{children:"프레임워크 연동"}),e("p",{children:"결합된 watch는 프레임워크 커넥터와 함께 작동합니다:"}),e(r,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';
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
}`}),e("h2",{children:"createComputed와 비교"}),e("p",{children:"필요에 따라 올바른 도구를 선택하세요:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"combineWatch"})," - 스토어 그룹화, 개별 접근 유지"]}),e("li",{children:[e("strong",{children:"createComputed"})," - 스토어에서 새로운 단일 값 파생"]})]}),e(r,{language:"typescript",code:`import { createStore, combineWatch, createComputed } from 'state-ref';

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
console.log(area.value);  // 200 (계산된 면적)`}),e("h2",{children:"사용 사례"}),e("h3",{children:"여러 스토어 조정"}),e(r,{language:"typescript",code:`const authWatch = createStore({ user: null, token: null });
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
});`}),e("h3",{children:"여러 필드가 있는 폼"}),e(r,{language:"typescript",code:`const nameWatch = createStore('');
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
});`}),e("h2",{children:"TypeScript 지원"}),e("p",{children:[e("code",{children:"combineWatch"}),"는 튜플의 각 스토어에 대한 타입 정보를 보존합니다:"]}),e(r,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';

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
});`}),e("h2",{children:"모범 사례"}),e("ul",{children:[e("li",{children:[e("strong",{children:"관련 스토어 그룹화에 사용"})," - 여러 스토어에 함께 반응해야 할 때"]}),e("li",{children:[e("strong",{children:"인덱스로 접근"})," - 항상 ",e("code",{children:"combined[0]"}),", ",e("code",{children:"combined[1]"})," 등 사용"]}),e("li",{children:[e("strong",{children:[e("code",{children:"as const"})," 사용"]})," - 더 나은 TypeScript 튜플 추론을 위해"]}),e("li",{children:[e("strong",{children:"파생 값에는 createComputed 선호"})," - 개별 스토어 접근이 필요할 때만 combineWatch 사용"]}),e("li",{children:[e("strong",{children:"콜백에서 .value 먼저 접근"})," - 조건문 전에 구독 수집 보장"]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/computed",children:"createComputed"})," - 스토어에서 단일 값 파생"]}),e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 개별 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/subscription",children:"구독"})," - 구독 이해하기"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - watch 함수 API"]})]})]})),Mc=f(()=>()=>e("div",{children:[e("h1",{children:"Manual Sync (Flux)"}),e("p",{children:[e("code",{children:"createStoreManualSync"})," lets you control when updates notify subscribers. This is useful for Flux-style action flows, batching multiple changes, or enforcing a strict “read-only in views” policy."]}),e("h2",{children:"Basic Usage"}),e(r,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';

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
sync();`}),e("h2",{children:"How It Works"}),e("ul",{children:[e("li",{children:[e("strong",{children:"watch"})," returns a read-only reference in manual mode"]}),e("li",{children:[e("strong",{children:"updateRef"})," is the writable reference used by actions"]}),e("li",{children:[e("strong",{children:"sync()"})," flushes changes and triggers subscriptions"]})]}),e("h2",{children:"Read-Only in Views"}),e("p",{children:["In manual sync, direct mutation from ",e("code",{children:"watch()"})," is blocked and throws an error. Always update via ",e("code",{children:"updateRef"}),"."]}),e(r,{language:"typescript",code:`const { watch, updateRef } = createStoreManualSync({ count: 0 });

const store = watch();

// ✗ Not allowed in manual sync
store.count.value = 1; // Error: direct modification is not allowed

// ✓ Allowed
updateRef.count.value = 1;`}),e("h2",{children:"Flux-Style Actions"}),e("p",{children:["Keep mutations inside action functions, then call ",e("code",{children:"sync()"})," to publish updates."]}),e(r,{language:"typescript",code:`type Profile = { john: { age: number } };

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
});`}),e("h2",{children:"Batch Multiple Updates"}),e("p",{children:["Make several changes first, then call ",e("code",{children:"sync()"})," once to reduce re-renders or side effects."]}),e(r,{language:"typescript",code:`const { updateRef, sync } = createStoreManualSync({
  count: 0,
  theme: 'light',
  sidebar: true
});

updateRef.count.value += 1;
updateRef.theme.value = 'dark';
updateRef.sidebar.value = false;

// Single flush
sync();`}),e("h2",{children:"Using with Framework Connectors"}),e("p",{children:["Manual sync works with connectors because ",e("code",{children:"watch"})," is still the subscription source."]}),e(r,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';
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
}`}),e("h2",{children:"API Summary"}),e("ul",{children:[e("li",{children:[e("code",{children:"createStoreManualSync(initial)"})," →"," ",e("code",{children:"{ watch, updateRef, sync }"})]}),e("li",{children:[e("code",{children:"watch(callback?)"})," - subscribe or get a read-only reference"]}),e("li",{children:[e("code",{children:"updateRef"})," - writable reference for actions"]}),e("li",{children:[e("code",{children:"sync()"})," - flushes changes to subscribers"]})]}),e("h2",{children:"Best Practices"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Centralize writes"})," in action functions"]}),e("li",{children:[e("strong",{children:"Batch updates"})," and call ",e("code",{children:"sync()"})," once"]}),e("li",{children:[e("strong",{children:"Keep views read-only"})," to avoid accidental mutations"]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - automatic sync mode"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - subscription basics"]}),e("li",{children:[e("a",{href:"#/guide/subscription",children:"Subscription"})," - lifecycle and cleanup"]})]})]})),Pc=f(()=>()=>e("div",{children:[e("h1",{children:"수동 동기화 (Flux)"}),e("p",{children:[e("code",{children:"createStoreManualSync"}),"는 업데이트를 언제 구독자에게 전파할지 직접 제어합니다. Flux 스타일의 액션 흐름, 여러 변경을 배치 처리, “뷰는 읽기 전용” 규칙을 적용할 때 유용합니다."]}),e("h2",{children:"기본 사용법"}),e(r,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';

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
sync();`}),e("h2",{children:"동작 방식"}),e("ul",{children:[e("li",{children:[e("strong",{children:"watch"}),"는 수동 모드에서 읽기 전용 참조를 반환"]}),e("li",{children:[e("strong",{children:"updateRef"}),"는 액션에서 사용하는 쓰기 전용 참조"]}),e("li",{children:[e("strong",{children:"sync()"}),"가 변경을 플러시하고 구독을 트리거"]})]}),e("h2",{children:"뷰에서 읽기 전용"}),e("p",{children:["수동 동기화에서는 ",e("code",{children:"watch()"}),"로 받은 참조를 직접 수정할 수 없습니다. 반드시 ",e("code",{children:"updateRef"}),"로 업데이트하세요."]}),e(r,{language:"typescript",code:`const { watch, updateRef } = createStoreManualSync({ count: 0 });

const store = watch();

// ✗ 수동 동기화에서는 불가
store.count.value = 1; // Error: direct modification is not allowed

// ✓ 가능
updateRef.count.value = 1;`}),e("h2",{children:"Flux 스타일 액션"}),e("p",{children:["변경 로직을 액션 함수로 모으고, 마지막에 ",e("code",{children:"sync()"}),"로 전파하세요."]}),e(r,{language:"typescript",code:`type Profile = { john: { age: number } };

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
});`}),e("h2",{children:"여러 변경 배치 처리"}),e("p",{children:["여러 값을 변경한 뒤 ",e("code",{children:"sync()"}),"를 한 번만 호출하면 불필요한 렌더링이나 부수 효과를 줄일 수 있습니다."]}),e(r,{language:"typescript",code:`const { updateRef, sync } = createStoreManualSync({
  count: 0,
  theme: 'light',
  sidebar: true
});

updateRef.count.value += 1;
updateRef.theme.value = 'dark';
updateRef.sidebar.value = false;

// 한 번에 플러시
sync();`}),e("h2",{children:"프레임워크 커넥터와 함께 사용"}),e("p",{children:["수동 동기화에서도 ",e("code",{children:"watch"}),"는 구독의 출발점이므로 커넥터와 함께 사용할 수 있습니다."]}),e(r,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';
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
}`}),e("h2",{children:"API 요약"}),e("ul",{children:[e("li",{children:[e("code",{children:"createStoreManualSync(initial)"})," →"," ",e("code",{children:"{ watch, updateRef, sync }"})]}),e("li",{children:[e("code",{children:"watch(callback?)"})," - 구독 또는 읽기 전용 참조 획득"]}),e("li",{children:[e("code",{children:"updateRef"})," - 액션에서 사용하는 쓰기 참조"]}),e("li",{children:[e("code",{children:"sync()"})," - 변경 사항을 구독자에게 전파"]})]}),e("h2",{children:"모범 사례"}),e("ul",{children:[e("li",{children:e("strong",{children:"쓰기 로직을 액션으로 중앙화"})}),e("li",{children:[e("strong",{children:"여러 변경을 묶고"})," ",e("code",{children:"sync()"}),"를 한 번 호출"]}),e("li",{children:[e("strong",{children:"뷰는 읽기 전용"}),"으로 유지"]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 자동 동기화 모드"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - 구독 기본"]}),e("li",{children:[e("a",{href:"#/ko/guide/subscription",children:"구독"})," - 라이프사이클과 해제"]})]})]})),Oc=f(()=>()=>e("div",{children:[e("h1",{children:"Lens Pattern"}),e("p",{children:["The ",e("code",{children:"lens"})," helper provides immutable, deep updates by describing a path into your data. StateRef uses the same lens pattern internally, and you can use it directly for custom immutable updates."]}),e("h2",{children:"Basic Usage"}),e(r,{language:"typescript",code:`import { lens } from 'state-ref';

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
console.log(next.user.name); // 'Min'`}),e("h2",{children:"Chaining Deep Paths"}),e("p",{children:["Use ",e("code",{children:"chain"})," with object keys and array indices to build deep paths."]}),e(r,{language:"typescript",code:`type State = {
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

console.log(next.todos[0].title); // 'Review docs'`}),e("h2",{children:"Reusable Lenses"}),e("p",{children:"Build reusable lenses by chaining from a base lens."}),e(r,{language:"typescript",code:`type State = { user: { name: string; email: string } };

const userLens = lens<State>().chain('user');
const userNameLens = userLens.chain('name');
const userEmailLens = userLens.chain('email');`}),e("h2",{children:"Immutability (Copy-On-Write)"}),e("p",{children:[e("code",{children:"set()"})," performs shallow copies only along the path, keeping unrelated branches referentially equal."]}),e(r,{language:"typescript",code:`type State = {
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
console.log(next.settings === state.settings); // true`}),e("h2",{children:"TypeScript Support"}),e("p",{children:[e("code",{children:"lens"})," preserves types through ",e("code",{children:"chain"}),", so",e("code",{children:"get"})," and ",e("code",{children:"set"})," are strongly typed."]}),e(r,{language:"typescript",code:`type State = { user: { name: string; age: number } };

const nameLens = lens<State>().chain('user').chain('name');

const name: string = nameLens.get({ user: { name: 'Lee', age: 20 } });
const next = nameLens.set('Min')({ user: { name: 'Lee', age: 20 } });`}),e("h2",{children:"When to Use"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Custom immutable updates"})," outside StateRef stores"]}),e("li",{children:[e("strong",{children:"Integration code"})," that needs predictable deep writes"]}),e("li",{children:[e("strong",{children:"Internal helpers"})," for shared update logic"]})]}),e("h2",{children:"API Summary"}),e(r,{language:"typescript",code:`lens<T>(sceneList?: (string | number | symbol)[]): Lens<T, T>

class Lens<Root, Focus> {
  chain(prop: string | number | symbol): Lens<Root, any>;
  get(target: Root): Focus;
  set(value: Focus): (target: Root) => Root;
}`}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - StateRef store creation"]}),e("li",{children:[e("a",{href:"#/guide/state-ref-store",children:"StateRefStore"})," - proxy references"]}),e("li",{children:[e("a",{href:"#/guide/computed",children:"createComputed"})," - derived values"]})]})]})),_c=f(()=>()=>e("div",{children:[e("h1",{children:"Lens 패턴"}),e("p",{children:[e("code",{children:"lens"})," 헬퍼는 데이터 경로를 설명해 불변 업데이트를 수행합니다. StateRef 내부도 동일한 렌즈 패턴을 사용하며, 직접 사용하면 커스텀 불변 업데이트를 만들 수 있습니다."]}),e("h2",{children:"기본 사용법"}),e(r,{language:"typescript",code:`import { lens } from 'state-ref';

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
console.log(next.user.name); // 'Min'`}),e("h2",{children:"깊은 경로 체이닝"}),e("p",{children:[e("code",{children:"chain"}),"은 객체 키와 배열 인덱스를 모두 사용할 수 있습니다."]}),e(r,{language:"typescript",code:`type State = {
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

console.log(next.todos[0].title); // 'Review docs'`}),e("h2",{children:"재사용 가능한 렌즈"}),e("p",{children:"기본 렌즈에서 파생하여 여러 경로를 쉽게 구성할 수 있습니다."}),e(r,{language:"typescript",code:`type State = { user: { name: string; email: string } };

const userLens = lens<State>().chain('user');
const userNameLens = userLens.chain('name');
const userEmailLens = userLens.chain('email');`}),e("h2",{children:"불변성 (Copy-On-Write)"}),e("p",{children:[e("code",{children:"set()"}),"은 경로에 해당하는 부분만 얕은 복사를 수행하며, 나머지 경로는 동일한 참조를 유지합니다."]}),e(r,{language:"typescript",code:`type State = {
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
console.log(next.settings === state.settings); // true`}),e("h2",{children:"TypeScript 지원"}),e("p",{children:[e("code",{children:"lens"}),"는 ",e("code",{children:"chain"}),"을 통해 타입 정보를 유지하므로",e("code",{children:"get"}),"/",e("code",{children:"set"}),"이 안전하게 추론됩니다."]}),e(r,{language:"typescript",code:`type State = { user: { name: string; age: number } };

const nameLens = lens<State>().chain('user').chain('name');

const name: string = nameLens.get({ user: { name: 'Lee', age: 20 } });
const next = nameLens.set('Min')({ user: { name: 'Lee', age: 20 } });`}),e("h2",{children:"사용 시점"}),e("ul",{children:[e("li",{children:[e("strong",{children:"커스텀 불변 업데이트"}),"가 필요할 때"]}),e("li",{children:[e("strong",{children:"통합 코드"}),"에서 예측 가능한 깊은 업데이트가 필요할 때"]}),e("li",{children:[e("strong",{children:"공통 업데이트 로직"}),"을 재사용하고 싶을 때"]})]}),e("h2",{children:"API 요약"}),e(r,{language:"typescript",code:`lens<T>(sceneList?: (string | number | symbol)[]): Lens<T, T>

class Lens<Root, Focus> {
  chain(prop: string | number | symbol): Lens<Root, any>;
  get(target: Root): Focus;
  set(value: Focus): (target: Root) => Root;
}`}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/state-ref-store",children:"StateRefStore"})," - 프록시 참조"]}),e("li",{children:[e("a",{href:"#/ko/guide/computed",children:"createComputed"})," - 파생 값"]})]})]})),Lc=f(()=>()=>e("div",{children:[e("h1",{children:"copyable"}),e("p",{children:[e("code",{children:"copyable"})," creates a proxy that builds a path through property access and returns a new root object with copy-on-write updates via",e("code",{children:"writeCopy"}),". It’s useful when you need immutable updates outside of StateRef stores."]}),e("h2",{children:"Basic Usage"}),e(r,{language:"typescript",code:`import { copyable } from 'state-ref';

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
console.log(next.user.name);  // 'Min'`}),e("h2",{children:"Deep Updates (Arrays Included)"}),e(r,{language:"typescript",code:`type State = {
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

console.log(next.todos[1].done); // true`}),e("h2",{children:"Read-Only Proxy"}),e("p",{children:["Direct assignment is not allowed. Use ",e("code",{children:"writeCopy"})," for changes."]}),e(r,{language:"typescript",code:`const state = { count: 0 };
const c = copyable(state);

// ✗ Not allowed
c.count = 1; // Error: Property modification is not supported

// ✓ Allowed
const next = c.count.writeCopy(1);`}),e("h2",{children:"Copy-On-Write Behavior"}),e("p",{children:"Only the path you update is shallow-copied. Unrelated branches keep the same references."}),e(r,{language:"typescript",code:`const state = {
  user: { name: 'Lee' },
  settings: { theme: 'light' }
};

const c = copyable(state);
const next = c.user.name.writeCopy('Min');

console.log(next !== state); // true
console.log(next.user !== state.user); // true
console.log(next.settings === state.settings); // true`}),e("h2",{children:"Important: Use the Latest Root"}),e("p",{children:[e("code",{children:"copyable"})," writes against the root object you pass in. If you create a new root, call ",e("code",{children:"copyable"})," again with that new object."]}),e(r,{language:"typescript",code:`let state = { count: 0 };

let c = copyable(state);
state = c.count.writeCopy(1);

// Recreate copyable with the latest root
c = copyable(state);
state = c.count.writeCopy(2);`}),e("h2",{children:"API Summary"}),e(r,{language:"typescript",code:`copyable<T>(orig: T): Copyable<T>

type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(v: V) => Root;
};`}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/lens",children:"Lens Pattern"})," - path-based immutable updates"]}),e("li",{children:[e("a",{href:"#/guide/clone-deep",children:"cloneDeep"})," - full deep copy utility"]}),e("li",{children:[e("a",{href:"#/guide/state-ref-store",children:"StateRefStore"})," - proxy updates in stores"]})]})]})),Uc=f(()=>()=>e("div",{children:[e("h1",{children:"copyable"}),e("p",{children:[e("code",{children:"copyable"}),"는 프로퍼티 접근으로 경로를 구성하고,",e("code",{children:"writeCopy"}),"로 copy-on-write 업데이트를 수행해 새로운 루트 객체를 반환합니다. StateRef 스토어 밖에서 불변 업데이트가 필요할 때 유용합니다."]}),e("h2",{children:"기본 사용법"}),e(r,{language:"typescript",code:`import { copyable } from 'state-ref';

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
console.log(next.user.name);  // 'Min'`}),e("h2",{children:"깊은 업데이트 (배열 포함)"}),e(r,{language:"typescript",code:`type State = {
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

console.log(next.todos[1].done); // true`}),e("h2",{children:"읽기 전용 프록시"}),e("p",{children:["직접 할당은 허용되지 않습니다. 변경은 반드시",e("code",{children:"writeCopy"}),"로 수행하세요."]}),e(r,{language:"typescript",code:`const state = { count: 0 };
const c = copyable(state);

// ✗ 불가
c.count = 1; // Error: Property modification is not supported

// ✓ 가능
const next = c.count.writeCopy(1);`}),e("h2",{children:"Copy-On-Write 동작"}),e("p",{children:"업데이트 경로만 얕은 복사가 일어나며, 나머지 브랜치는 동일한 참조를 유지합니다."}),e(r,{language:"typescript",code:`const state = {
  user: { name: 'Lee' },
  settings: { theme: 'light' }
};

const c = copyable(state);
const next = c.user.name.writeCopy('Min');

console.log(next !== state); // true
console.log(next.user !== state.user); // true
console.log(next.settings === state.settings); // true`}),e("h2",{children:"중요: 최신 루트 사용"}),e("p",{children:[e("code",{children:"copyable"}),"은 전달한 루트 객체를 기준으로 업데이트합니다. 새 루트가 만들어졌다면 다시 ",e("code",{children:"copyable"}),"을 호출하세요."]}),e(r,{language:"typescript",code:`let state = { count: 0 };

let c = copyable(state);
state = c.count.writeCopy(1);

// 최신 루트로 재생성
c = copyable(state);
state = c.count.writeCopy(2);`}),e("h2",{children:"API 요약"}),e(r,{language:"typescript",code:`copyable<T>(orig: T): Copyable<T>

type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(v: V) => Root;
};`}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/lens",children:"Lens 패턴"})," - 경로 기반 불변 업데이트"]}),e("li",{children:[e("a",{href:"#/ko/guide/clone-deep",children:"cloneDeep"})," - 전체 깊은 복사"]}),e("li",{children:[e("a",{href:"#/ko/guide/state-ref-store",children:"StateRefStore"})," - 스토어 프록시 업데이트"]})]})]})),Dc=f(()=>()=>e("div",{children:[e("h1",{children:"cloneDeep"}),e("p",{children:[e("code",{children:"cloneDeep"})," creates a recursive deep copy of plain objects and arrays. It’s a small utility for cases where you need an independent copy of nested data."]}),e("h2",{children:"Basic Usage"}),e(r,{language:"typescript",code:`import { cloneDeep } from 'state-ref';

const original = {
  user: { name: 'Lee', tags: ['dev', 'docs'] },
  count: 1
};

const copy = cloneDeep(original);

copy.user.name = 'Min';
copy.user.tags.push('review');

console.log(original.user.name); // 'Lee'
console.log(original.user.tags); // ['dev', 'docs']`}),e("h2",{children:"Arrays and Objects"}),e(r,{language:"typescript",code:`const list = [{ id: 1 }, { id: 2 }];
const next = cloneDeep(list);

next[0].id = 999;
console.log(list[0].id); // 1`}),e("h2",{children:"What It Copies"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Plain objects"})," (own enumerable properties)"]}),e("li",{children:[e("strong",{children:"Arrays"})," (recursively deep-copied)"]}),e("li",{children:[e("strong",{children:"Primitives"})," are returned as-is"]})]}),e("h2",{children:"Limitations"}),e("p",{children:[e("code",{children:"cloneDeep"})," is intentionally minimal. It does not handle special object types or circular references."]}),e("ul",{children:[e("li",{children:[e("strong",{children:"Not supported"}),": Date, Map, Set, class instances, functions, symbols, or circular references"]}),e("li",{children:[e("strong",{children:"Prototype is not preserved"})," (plain object output)"]})]}),e("h2",{children:"When to Use"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Test fixtures"})," or quick cloning of JSON-like data"]}),e("li",{children:[e("strong",{children:"Defensive copies"})," before in-place changes"]}),e("li",{children:[e("strong",{children:"Lightweight utilities"})," without extra dependencies"]})]}),e("h2",{children:"API Summary"}),e(r,{language:"typescript",code:"cloneDeep<T>(value: T): T"}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/copyable",children:"copyable"})," - copy-on-write updates"]}),e("li",{children:[e("a",{href:"#/guide/lens",children:"Lens Pattern"})," - path-based immutable updates"]})]})]})),Fc=f(()=>()=>e("div",{children:[e("h1",{children:"cloneDeep"}),e("p",{children:[e("code",{children:"cloneDeep"}),"는 평범한 객체와 배열을 재귀적으로 깊은 복사합니다. 중첩된 데이터를 독립적으로 복제해야 할 때 사용하는 가벼운 유틸리티입니다."]}),e("h2",{children:"기본 사용법"}),e(r,{language:"typescript",code:`import { cloneDeep } from 'state-ref';

const original = {
  user: { name: 'Lee', tags: ['dev', 'docs'] },
  count: 1
};

const copy = cloneDeep(original);

copy.user.name = 'Min';
copy.user.tags.push('review');

console.log(original.user.name); // 'Lee'
console.log(original.user.tags); // ['dev', 'docs']`}),e("h2",{children:"배열과 객체"}),e(r,{language:"typescript",code:`const list = [{ id: 1 }, { id: 2 }];
const next = cloneDeep(list);

next[0].id = 999;
console.log(list[0].id); // 1`}),e("h2",{children:"복사 범위"}),e("ul",{children:[e("li",{children:[e("strong",{children:"평범한 객체"})," (열거 가능한 own 프로퍼티)"]}),e("li",{children:[e("strong",{children:"배열"})," (재귀적 깊은 복사)"]}),e("li",{children:[e("strong",{children:"원시값"}),"은 그대로 반환"]})]}),e("h2",{children:"제한 사항"}),e("p",{children:[e("code",{children:"cloneDeep"}),"는 단순함을 우선한 구현입니다. 특수 객체나 순환 참조는 지원하지 않습니다."]}),e("ul",{children:[e("li",{children:[e("strong",{children:"미지원"}),": Date, Map, Set, 클래스 인스턴스, 함수, 심볼, 순환 참조"]}),e("li",{children:[e("strong",{children:"프로토타입 보존 없음"})," (plain object로 복사)"]})]}),e("h2",{children:"사용 시점"}),e("ul",{children:[e("li",{children:[e("strong",{children:"테스트 픽스처"})," 또는 JSON 유사 데이터 복사"]}),e("li",{children:[e("strong",{children:"방어적 복사"}),"가 필요할 때"]}),e("li",{children:[e("strong",{children:"가벼운 유틸"}),"로 빠르게 처리하고 싶을 때"]})]}),e("h2",{children:"API 요약"}),e(r,{language:"typescript",code:"cloneDeep<T>(value: T): T"}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/copyable",children:"copyable"})," - copy-on-write 업데이트"]}),e("li",{children:[e("a",{href:"#/ko/guide/lens",children:"Lens 패턴"})," - 경로 기반 불변 업데이트"]})]})]})),Vc=f(()=>()=>e("div",{children:[e("h1",{children:"React Integration"}),e("p",{children:["Use ",e("code",{children:"@stateref/connect-react"})," to connect a StateRef store to React. It provides a hook that re-renders on changes automatically."]}),e("h2",{children:"Install"}),e(r,{language:"bash",code:"pnpm add state-ref @stateref/connect-react"}),e("h2",{children:"Basic Usage"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

// Create a React hook from the watch
export const useProfileStore = connectReact(watch);`}),e(r,{language:"tsx",code:`import { useProfileStore } from './profileStore';

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
}`}),e("h2",{children:"How Updates Work"}),e("ul",{children:[e("li",{children:"The hook subscribes on mount and re-renders when tracked values change"}),e("li",{children:["Updates are driven by reading ",e("code",{children:".value"})," in the render"]}),e("li",{children:"Cleanup is automatic on unmount (AbortController)"})]}),e("h2",{children:"Manual Sync with Actions"}),e("p",{children:["If you use ",e("code",{children:"createStoreManualSync"}),", keep writes in actions and call ",e("code",{children:"sync()"})," after updates."]}),e(r,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounterStore = connectReact(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(r,{language:"tsx",code:`import { useCounterStore, increment } from './counterStore';

export function Counter() {
  const { count } = useCounterStore();
  return <button onClick={increment}>{count.value}</button>;
}`}),e("h2",{children:"TypeScript Tips"}),e("p",{children:["The hook preserves types from ",e("code",{children:"createStore"}),", so you get strongly typed refs in components."]}),e(r,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectReact(watch);

// useTodo() returns StateRefStore<Todo>`}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - store creation"]}),e("li",{children:[e("a",{href:"#/guide/manual-sync",children:"Manual Sync (Flux)"})," - action-based updates"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - subscription behavior"]})]})]})),Bc=f(()=>()=>e("div",{children:[e("h1",{children:"React 연동"}),e("p",{children:[e("code",{children:"@stateref/connect-react"}),"를 사용하면 StateRef 스토어를 React에 연결할 수 있습니다. 변경이 발생하면 컴포넌트가 자동으로 리렌더링됩니다."]}),e("h2",{children:"설치"}),e(r,{language:"bash",code:"pnpm add state-ref @stateref/connect-react"}),e("h2",{children:"기본 사용법"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

// watch로 React 훅 생성
export const useProfileStore = connectReact(watch);`}),e(r,{language:"tsx",code:`import { useProfileStore } from './profileStore';

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
}`}),e("h2",{children:"업데이트 동작"}),e("ul",{children:[e("li",{children:"훅은 마운트 시 구독하고, 추적된 값이 바뀌면 리렌더링됩니다"}),e("li",{children:["렌더에서 ",e("code",{children:".value"}),"를 읽는 것이 추적의 기준입니다"]}),e("li",{children:"언마운트 시 자동으로 정리됩니다 (AbortController)"})]}),e("h2",{children:"수동 동기화 + 액션"}),e("p",{children:[e("code",{children:"createStoreManualSync"}),"를 사용할 때는 액션에서 업데이트하고",e("code",{children:"sync()"}),"로 전파하세요."]}),e(r,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';
import { connectReact } from '@stateref/connect-react';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounterStore = connectReact(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(r,{language:"tsx",code:`import { useCounterStore, increment } from './counterStore';

export function Counter() {
  const { count } = useCounterStore();
  return <button onClick={increment}>{count.value}</button>;
}`}),e("h2",{children:"TypeScript 팁"}),e("p",{children:[e("code",{children:"createStore"}),"의 타입이 훅으로 그대로 전달되므로 컴포넌트에서 타입이 안전하게 유지됩니다."]}),e(r,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectReact(watch);

// useTodo()는 StateRefStore<Todo> 반환`}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화 (Flux)"})," - 액션 기반 업데이트"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - 구독 동작"]})]})]})),$c=f(()=>()=>e("div",{children:[e("h1",{children:"Preact Integration"}),e("p",{children:["Use ",e("code",{children:"@stateref/connect-preact"})," to connect a StateRef store to Preact. It provides a hook that re-renders on changes automatically."]}),e("h2",{children:"Install"}),e(r,{language:"bash",code:"pnpm add state-ref @stateref/connect-preact"}),e("h2",{children:"Basic Usage"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';
import { connectPreact } from '@stateref/connect-preact';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

// Create a Preact hook from the watch
export const useProfileStore = connectPreact(watch);`}),e(r,{language:"tsx",code:`import { useProfileStore } from './profileStore';

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
}`}),e("h2",{children:"How Updates Work"}),e("ul",{children:[e("li",{children:"The hook subscribes on mount and re-renders when tracked values change"}),e("li",{children:["Updates are driven by reading ",e("code",{children:".value"})," in the render"]}),e("li",{children:"Cleanup is automatic on unmount (AbortController)"})]}),e("h2",{children:"Preact vs React"}),e("p",{children:["The Preact connector is nearly identical to the React version. The main difference is that it uses ",e("code",{children:"preact/hooks"})," instead of React's hooks:"]}),e(r,{language:"typescript",code:`// React
import { connectReact } from '@stateref/connect-react';

// Preact
import { connectPreact } from '@stateref/connect-preact';

// Usage is the same
const useStore = connectPreact(watch);`}),e("h2",{children:"Manual Sync with Actions"}),e("p",{children:["If you use ",e("code",{children:"createStoreManualSync"}),", keep writes in actions and call ",e("code",{children:"sync()"})," after updates."]}),e(r,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';
import { connectPreact } from '@stateref/connect-preact';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounterStore = connectPreact(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(r,{language:"tsx",code:`import { useCounterStore, increment } from './counterStore';

export function Counter() {
  const { count } = useCounterStore();
  return <button onClick={increment}>{count.value}</button>;
}`}),e("h2",{children:"TypeScript Tips"}),e("p",{children:["The hook preserves types from ",e("code",{children:"createStore"}),", so you get strongly typed refs in components."]}),e(r,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectPreact(watch);

// useTodo() returns StateRefStore<Todo>`}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - store creation"]}),e("li",{children:[e("a",{href:"#/guide/manual-sync",children:"Manual Sync (Flux)"})," - action-based updates"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - subscription behavior"]}),e("li",{children:[e("a",{href:"#/guide/react",children:"React"})," - React integration (nearly identical API)"]})]})]})),jc=f(()=>()=>e("div",{children:[e("h1",{children:"Preact 연동"}),e("p",{children:[e("code",{children:"@stateref/connect-preact"}),"를 사용하여 StateRef 스토어를 Preact에 연결합니다. 변경 사항이 있을 때 자동으로 리렌더링되는 훅을 제공합니다."]}),e("h2",{children:"설치"}),e(r,{language:"bash",code:"pnpm add state-ref @stateref/connect-preact"}),e("h2",{children:"기본 사용법"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';
import { connectPreact } from '@stateref/connect-preact';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

// watch로 Preact 훅 생성
export const useProfileStore = connectPreact(watch);`}),e(r,{language:"tsx",code:`import { useProfileStore } from './profileStore';

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
}`}),e("h2",{children:"업데이트 동작 방식"}),e("ul",{children:[e("li",{children:"훅은 마운트 시 구독하고 추적된 값이 변경되면 리렌더링합니다"}),e("li",{children:["업데이트는 렌더링에서 ",e("code",{children:".value"}),"를 읽는 것으로 구동됩니다"]}),e("li",{children:"언마운트 시 자동으로 정리됩니다 (AbortController)"})]}),e("h2",{children:"Preact vs React"}),e("p",{children:["Preact 커넥터는 React 버전과 거의 동일합니다. 주요 차이점은 React의 hooks 대신 ",e("code",{children:"preact/hooks"}),"를 사용한다는 것입니다:"]}),e(r,{language:"typescript",code:`// React
import { connectReact } from '@stateref/connect-react';

// Preact
import { connectPreact } from '@stateref/connect-preact';

// 사용법은 동일
const useStore = connectPreact(watch);`}),e("h2",{children:"액션과 함께 수동 동기화"}),e("p",{children:[e("code",{children:"createStoreManualSync"}),"를 사용하는 경우 쓰기는 액션에서 처리하고 업데이트 후 ",e("code",{children:"sync()"}),"를 호출합니다."]}),e(r,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';
import { connectPreact } from '@stateref/connect-preact';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounterStore = connectPreact(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(r,{language:"tsx",code:`import { useCounterStore, increment } from './counterStore';

export function Counter() {
  const { count } = useCounterStore();
  return <button onClick={increment}>{count.value}</button>;
}`}),e("h2",{children:"TypeScript 팁"}),e("p",{children:["훅은 ",e("code",{children:"createStore"}),"의 타입을 유지하므로 컴포넌트에서 강력한 타입의 참조를 얻을 수 있습니다."]}),e(r,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectPreact(watch);

// useTodo()는 StateRefStore<Todo>를 반환`}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화 (Flux)"})," - 액션 기반 업데이트"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - 구독 동작"]}),e("li",{children:[e("a",{href:"#/ko/guide/react",children:"React"})," - React 연동 (거의 동일한 API)"]})]})]})),Jc=f(()=>()=>e("div",{children:[e("h1",{children:"Vue Integration"}),e("p",{children:["Use ",e("code",{children:"@stateref/connect-vue"})," to connect a StateRef store to Vue 3. It bridges StateRef's reactivity with Vue's reactive system."]}),e("h2",{children:"Install"}),e(r,{language:"bash",code:"pnpm add state-ref @stateref/connect-vue"}),e("h2",{children:"Basic Usage"}),e("p",{children:"The Vue connector uses a callback pattern to select which part of the store to track:"}),e(r,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';
import { connectVue } from '@stateref/connect-vue';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

export const useProfile = connectVue(watch);`}),e(r,{language:"vue",code:`<script setup lang="ts">
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
</template>`}),e("h2",{children:"How It Works"}),e("p",{children:"The Vue connector creates a bridge between StateRef and Vue's reactivity:"}),e("ul",{children:[e("li",{children:[e("code",{children:"connectVue(watch)"})," returns a function that accepts a selector callback"]}),e("li",{children:"The selector receives the StateRefStore and returns the specific property to track"}),e("li",{children:["Returns a Vue ",e("code",{children:"Reactive"})," object with a ",e("code",{children:".value"})," property"]}),e("li",{children:"Two-way binding: Vue changes sync back to StateRef, and vice versa"}),e("li",{children:"Cleanup is automatic on component unmount"})]}),e("h2",{children:"Selecting Properties"}),e("p",{children:"Use the selector callback to pick specific properties:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
theme.value = 'light';`}),e("h2",{children:"Working with Objects"}),e("p",{children:"You can also select entire objects:"}),e(r,{language:"typescript",code:`const watch = createStore({
  user: { name: 'John', age: 30 }
});

const useStore = connectVue(watch);

// Select entire user object
const user = useStore(store => store.user);

// Access nested values
console.log(user.value.name);  // 'John'
console.log(user.value.age);   // 30

// Replace entire object
user.value = { name: 'Jane', age: 25 };`}),e("h2",{children:"Manual Sync with Actions"}),e("p",{children:["With ",e("code",{children:"createStoreManualSync"}),", keep writes in actions:"]}),e(r,{language:"typescript",code:`// store.ts
import { createStoreManualSync } from 'state-ref';
import { connectVue } from '@stateref/connect-vue';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounter = connectVue(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(r,{language:"vue",code:`<script setup lang="ts">
import { useCounter, increment } from './store';

const count = useCounter(store => store.count);
<\/script>

<template>
  <button @click="increment">
    Count: {{ count.value }}
  </button>
</template>`}),e("h2",{children:"Composition API Pattern"}),e("p",{children:"Organize your store access in a composable:"}),e(r,{language:"typescript",code:`// composables/useProfileStore.ts
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
}`}),e(r,{language:"vue",code:`<script setup lang="ts">
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
</template>`}),e("h2",{children:"TypeScript Tips"}),e("p",{children:"The connector preserves types from your store:"}),e(r,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectVue(watch);

// TypeScript knows the types
const title = useTodo(store => store.title);
// title is Reactive<{ value: string }>

const done = useTodo(store => store.done);
// done is Reactive<{ value: boolean }>`}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - store creation"]}),e("li",{children:[e("a",{href:"#/guide/manual-sync",children:"Manual Sync (Flux)"})," - action-based updates"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - subscription behavior"]}),e("li",{children:[e("a",{href:"#/guide/react",children:"React"})," - React integration"]})]})]})),Hc=f(()=>()=>e("div",{children:[e("h1",{children:"Vue 연동"}),e("p",{children:[e("code",{children:"@stateref/connect-vue"}),"를 사용하여 StateRef 스토어를 Vue 3에 연결합니다. StateRef의 반응성과 Vue의 reactive 시스템을 연결합니다."]}),e("h2",{children:"설치"}),e(r,{language:"bash",code:"pnpm add state-ref @stateref/connect-vue"}),e("h2",{children:"기본 사용법"}),e("p",{children:"Vue 커넥터는 스토어에서 추적할 부분을 선택하기 위해 콜백 패턴을 사용합니다:"}),e(r,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';
import { connectVue } from '@stateref/connect-vue';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

export const useProfile = connectVue(watch);`}),e(r,{language:"vue",code:`<script setup lang="ts">
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
</template>`}),e("h2",{children:"작동 방식"}),e("p",{children:"Vue 커넥터는 StateRef와 Vue의 반응성 사이에 브릿지를 생성합니다:"}),e("ul",{children:[e("li",{children:[e("code",{children:"connectVue(watch)"}),"는 셀렉터 콜백을 받는 함수를 반환합니다"]}),e("li",{children:"셀렉터는 StateRefStore를 받아서 추적할 특정 프로퍼티를 반환합니다"}),e("li",{children:[e("code",{children:".value"})," 프로퍼티를 가진 Vue ",e("code",{children:"Reactive"})," 객체를 반환합니다"]}),e("li",{children:"양방향 바인딩: Vue 변경이 StateRef로, 그리고 그 반대로도 동기화됩니다"}),e("li",{children:"컴포넌트 언마운트 시 자동으로 정리됩니다"})]}),e("h2",{children:"프로퍼티 선택하기"}),e("p",{children:"셀렉터 콜백을 사용하여 특정 프로퍼티를 선택합니다:"}),e(r,{language:"typescript",code:`const watch = createStore({
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
theme.value = 'light';`}),e("h2",{children:"객체 다루기"}),e("p",{children:"전체 객체를 선택할 수도 있습니다:"}),e(r,{language:"typescript",code:`const watch = createStore({
  user: { name: 'John', age: 30 }
});

const useStore = connectVue(watch);

// 전체 user 객체 선택
const user = useStore(store => store.user);

// 중첩된 값 접근
console.log(user.value.name);  // 'John'
console.log(user.value.age);   // 30

// 전체 객체 교체
user.value = { name: 'Jane', age: 25 };`}),e("h2",{children:"액션과 함께 수동 동기화"}),e("p",{children:[e("code",{children:"createStoreManualSync"}),"를 사용하면 쓰기는 액션에서 처리합니다:"]}),e(r,{language:"typescript",code:`// store.ts
import { createStoreManualSync } from 'state-ref';
import { connectVue } from '@stateref/connect-vue';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounter = connectVue(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(r,{language:"vue",code:`<script setup lang="ts">
import { useCounter, increment } from './store';

const count = useCounter(store => store.count);
<\/script>

<template>
  <button @click="increment">
    Count: {{ count.value }}
  </button>
</template>`}),e("h2",{children:"Composition API 패턴"}),e("p",{children:"composable에서 스토어 접근을 구성합니다:"}),e(r,{language:"typescript",code:`// composables/useProfileStore.ts
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
}`}),e(r,{language:"vue",code:`<script setup lang="ts">
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
</template>`}),e("h2",{children:"TypeScript 팁"}),e("p",{children:"커넥터는 스토어의 타입을 유지합니다:"}),e(r,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectVue(watch);

// TypeScript가 타입을 알고 있음
const title = useTodo(store => store.title);
// title은 Reactive<{ value: string }>

const done = useTodo(store => store.done);
// done은 Reactive<{ value: boolean }>`}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화 (Flux)"})," - 액션 기반 업데이트"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - 구독 동작"]}),e("li",{children:[e("a",{href:"#/ko/guide/react",children:"React"})," - React 연동"]})]})]})),Kc=f(()=>()=>e("div",{children:[e("h1",{children:"Svelte Integration"}),e("p",{children:["Use ",e("code",{children:"@stateref/connect-svelte"})," to connect a StateRef store to Svelte. It returns Svelte ",e("code",{children:"Writable"})," stores that integrate with Svelte's reactivity."]}),e("h2",{children:"Install"}),e(r,{language:"bash",code:"pnpm add state-ref @stateref/connect-svelte"}),e("h2",{children:"Basic Usage"}),e("p",{children:"The Svelte connector uses a callback pattern to select which part of the store to track:"}),e(r,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';
import { connectSvelte } from '@stateref/connect-svelte';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

export const useProfile = connectSvelte(watch);`}),e(r,{language:"html",code:`<script lang="ts">
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
</div>`}),e("h2",{children:"How It Works"}),e("p",{children:"The Svelte connector bridges StateRef with Svelte's store system:"}),e("ul",{children:[e("li",{children:[e("code",{children:"connectSvelte(watch)"})," returns a function that accepts a selector callback"]}),e("li",{children:"The selector receives the StateRefStore and returns the specific property to track"}),e("li",{children:["Returns a Svelte ",e("code",{children:"Writable"})," store"]}),e("li",{children:["Use the ",e("code",{children:"$"})," prefix to access and update values reactively"]}),e("li",{children:"Two-way binding: Svelte changes sync back to StateRef, and vice versa"}),e("li",{children:"Cleanup is automatic on component destroy"})]}),e("h2",{children:"Selecting Properties"}),e("p",{children:"Use the selector callback to pick specific properties:"}),e(r,{language:"typescript",code:`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'en' }
});

const useStore = connectSvelte(watch);`}),e(r,{language:"html",code:`<script>
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
<button on:click={() => $theme = 'light'}>Toggle Theme</button>`}),e("h2",{children:"Working with Objects"}),e("p",{children:"You can also select entire objects:"}),e(r,{language:"html",code:`<script>
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
</button>`}),e("h2",{children:"Manual Sync with Actions"}),e("p",{children:["With ",e("code",{children:"createStoreManualSync"}),", keep writes in actions:"]}),e(r,{language:"typescript",code:`// store.ts
import { createStoreManualSync } from 'state-ref';
import { connectSvelte } from '@stateref/connect-svelte';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounter = connectSvelte(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(r,{language:"html",code:`<script>
  import { useCounter, increment } from './store';

  const count = useCounter(store => store.count);
<\/script>

<button on:click={increment}>
  Count: {$count}
</button>`}),e("h2",{children:"Using with Svelte's Reactive Statements"}),e("p",{children:"Combine with Svelte's reactive statements for derived values:"}),e(r,{language:"html",code:`<script>
  import { useStore } from './store';

  const firstName = useStore(store => store.firstName);
  const lastName = useStore(store => store.lastName);

  // Reactive derived value
  $: fullName = \`\${$firstName} \${$lastName}\`;
<\/script>

<p>Full Name: {fullName}</p>
<input bind:value={$firstName} placeholder="First Name" />
<input bind:value={$lastName} placeholder="Last Name" />`}),e("h2",{children:"Two-Way Binding with bind:value"}),e("p",{children:"Svelte's two-way binding works seamlessly:"}),e(r,{language:"html",code:`<script>
  import { useStore } from './store';

  const name = useStore(store => store.name);
  const email = useStore(store => store.email);
<\/script>

<!-- Two-way binding -->
<input bind:value={$name} placeholder="Name" />
<input bind:value={$email} type="email" placeholder="Email" />

<p>Name: {$name}</p>
<p>Email: {$email}</p>`}),e("h2",{children:"TypeScript Tips"}),e("p",{children:"The connector preserves types from your store:"}),e(r,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectSvelte(watch);

// TypeScript knows the types
const title = useTodo(store => store.title);
// title is Writable<string>

const done = useTodo(store => store.done);
// done is Writable<boolean>`}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - store creation"]}),e("li",{children:[e("a",{href:"#/guide/manual-sync",children:"Manual Sync (Flux)"})," - action-based updates"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - subscription behavior"]}),e("li",{children:[e("a",{href:"#/guide/vue",children:"Vue"})," - Vue integration (similar pattern)"]})]})]})),zc=f(()=>()=>e("div",{children:[e("h1",{children:"Svelte 연동"}),e("p",{children:[e("code",{children:"@stateref/connect-svelte"}),"를 사용하여 StateRef 스토어를 Svelte에 연결합니다. Svelte의 반응성과 통합되는 Svelte ",e("code",{children:"Writable"})," 스토어를 반환합니다."]}),e("h2",{children:"설치"}),e(r,{language:"bash",code:"pnpm add state-ref @stateref/connect-svelte"}),e("h2",{children:"기본 사용법"}),e("p",{children:"Svelte 커넥터는 스토어에서 추적할 부분을 선택하기 위해 콜백 패턴을 사용합니다:"}),e(r,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';
import { connectSvelte } from '@stateref/connect-svelte';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

export const useProfile = connectSvelte(watch);`}),e(r,{language:"html",code:`<script lang="ts">
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
</div>`}),e("h2",{children:"작동 방식"}),e("p",{children:"Svelte 커넥터는 StateRef와 Svelte의 스토어 시스템을 연결합니다:"}),e("ul",{children:[e("li",{children:[e("code",{children:"connectSvelte(watch)"}),"는 셀렉터 콜백을 받는 함수를 반환합니다"]}),e("li",{children:"셀렉터는 StateRefStore를 받아서 추적할 특정 프로퍼티를 반환합니다"}),e("li",{children:["Svelte ",e("code",{children:"Writable"})," 스토어를 반환합니다"]}),e("li",{children:[e("code",{children:"$"})," 접두사를 사용하여 값을 반응적으로 접근하고 업데이트합니다"]}),e("li",{children:"양방향 바인딩: Svelte 변경이 StateRef로, 그리고 그 반대로도 동기화됩니다"}),e("li",{children:"컴포넌트 파괴 시 자동으로 정리됩니다"})]}),e("h2",{children:"프로퍼티 선택하기"}),e("p",{children:"셀렉터 콜백을 사용하여 특정 프로퍼티를 선택합니다:"}),e(r,{language:"typescript",code:`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'ko' }
});

const useStore = connectSvelte(watch);`}),e(r,{language:"html",code:`<script>
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
<button on:click={() => $theme = 'light'}>테마 토글</button>`}),e("h2",{children:"객체 다루기"}),e("p",{children:"전체 객체를 선택할 수도 있습니다:"}),e(r,{language:"html",code:`<script>
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
</button>`}),e("h2",{children:"액션과 함께 수동 동기화"}),e("p",{children:[e("code",{children:"createStoreManualSync"}),"를 사용하면 쓰기는 액션에서 처리합니다:"]}),e(r,{language:"typescript",code:`// store.ts
import { createStoreManualSync } from 'state-ref';
import { connectSvelte } from '@stateref/connect-svelte';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounter = connectSvelte(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(r,{language:"html",code:`<script>
  import { useCounter, increment } from './store';

  const count = useCounter(store => store.count);
<\/script>

<button on:click={increment}>
  Count: {$count}
</button>`}),e("h2",{children:"Svelte의 반응형 구문과 함께 사용"}),e("p",{children:"파생 값을 위해 Svelte의 반응형 구문과 결합합니다:"}),e(r,{language:"html",code:`<script>
  import { useStore } from './store';

  const firstName = useStore(store => store.firstName);
  const lastName = useStore(store => store.lastName);

  // 반응형 파생 값
  $: fullName = \`\${$firstName} \${$lastName}\`;
<\/script>

<p>전체 이름: {fullName}</p>
<input bind:value={$firstName} placeholder="이름" />
<input bind:value={$lastName} placeholder="성" />`}),e("h2",{children:"bind:value와 양방향 바인딩"}),e("p",{children:"Svelte의 양방향 바인딩이 원활하게 작동합니다:"}),e(r,{language:"html",code:`<script>
  import { useStore } from './store';

  const name = useStore(store => store.name);
  const email = useStore(store => store.email);
<\/script>

<!-- 양방향 바인딩 -->
<input bind:value={$name} placeholder="이름" />
<input bind:value={$email} type="email" placeholder="이메일" />

<p>이름: {$name}</p>
<p>이메일: {$email}</p>`}),e("h2",{children:"TypeScript 팁"}),e("p",{children:"커넥터는 스토어의 타입을 유지합니다:"}),e(r,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectSvelte(watch);

// TypeScript가 타입을 알고 있음
const title = useTodo(store => store.title);
// title은 Writable<string>

const done = useTodo(store => store.done);
// done은 Writable<boolean>`}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화 (Flux)"})," - 액션 기반 업데이트"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - 구독 동작"]}),e("li",{children:[e("a",{href:"#/ko/guide/vue",children:"Vue"})," - Vue 연동 (유사한 패턴)"]})]})]})),Gc=f(()=>()=>e("div",{children:[e("h1",{children:"Solid Integration"}),e("p",{children:["Use ",e("code",{children:"@stateref/connect-solid"})," to connect a StateRef store to Solid.js. It returns Solid ",e("code",{children:"Signal"})," pairs that integrate with Solid's fine-grained reactivity."]}),e("h2",{children:"Install"}),e(r,{language:"bash",code:"pnpm add state-ref @stateref/connect-solid"}),e("h2",{children:"Basic Usage"}),e("p",{children:"The Solid connector uses a callback pattern to select which part of the store to track:"}),e(r,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';
import { connectSolid } from '@stateref/connect-solid';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

export const useProfile = connectSolid(watch);`}),e(r,{language:"tsx",code:`import { useProfile } from './store';

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
}`}),e("h2",{children:"How It Works"}),e("p",{children:"The Solid connector bridges StateRef with Solid's signal system:"}),e("ul",{children:[e("li",{children:[e("code",{children:"connectSolid(watch)"})," returns a function that accepts a selector callback"]}),e("li",{children:"The selector receives the StateRefStore and returns the specific property to track"}),e("li",{children:["Returns a Solid ",e("code",{children:"Signal"})," pair: ",e("code",{children:"[getter, setter]"})]}),e("li",{children:["Call the getter function to read values: ",e("code",{children:"name()"})]}),e("li",{children:["Use the setter function to update values: ",e("code",{children:"setName('Jane')"})]}),e("li",{children:"Two-way binding: Solid changes sync back to StateRef, and vice versa"}),e("li",{children:["Cleanup is automatic via ",e("code",{children:"onCleanup"})]})]}),e("h2",{children:"Selecting Properties"}),e("p",{children:"Use the selector callback to pick specific properties:"}),e(r,{language:"typescript",code:`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'en' }
});

const useStore = connectSolid(watch);`}),e(r,{language:"tsx",code:`import { useStore } from './store';

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
}`}),e("h2",{children:"Working with Objects"}),e("p",{children:"You can also select entire objects:"}),e(r,{language:"tsx",code:`import { useStore } from './store';

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
}`}),e("h2",{children:"Manual Sync with Actions"}),e("p",{children:["With ",e("code",{children:"createStoreManualSync"}),", keep writes in actions:"]}),e(r,{language:"typescript",code:`// store.ts
import { createStoreManualSync } from 'state-ref';
import { connectSolid } from '@stateref/connect-solid';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounter = connectSolid(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(r,{language:"tsx",code:`import { useCounter, increment } from './store';

function Counter() {
  const [count] = useCounter(store => store.count);

  return (
    <button onClick={increment}>
      Count: {count()}
    </button>
  );
}`}),e("h2",{children:"Using with Solid's Reactive Primitives"}),e("p",{children:"Combine with Solid's reactive primitives for derived values:"}),e(r,{language:"tsx",code:`import { createMemo } from 'solid-js';
import { useStore } from './store';

function FullName() {
  const [firstName] = useStore(store => store.firstName);
  const [lastName] = useStore(store => store.lastName);

  // Derived value using createMemo
  const fullName = createMemo(() => \`\${firstName()} \${lastName()}\`);

  return <p>Full Name: {fullName()}</p>;
}`}),e("h2",{children:"Input Binding Pattern"}),e("p",{children:"Handle input binding with Solid:"}),e(r,{language:"tsx",code:`import { useStore } from './store';

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
}`}),e("h2",{children:"TypeScript Tips"}),e("p",{children:"The connector preserves types from your store:"}),e(r,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectSolid(watch);

// TypeScript knows the types
const [title, setTitle] = useTodo(store => store.title);
// title is Accessor<string>, setTitle is Setter<string>

const [done, setDone] = useTodo(store => store.done);
// done is Accessor<boolean>, setDone is Setter<boolean>`}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - store creation"]}),e("li",{children:[e("a",{href:"#/guide/manual-sync",children:"Manual Sync (Flux)"})," - action-based updates"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - subscription behavior"]}),e("li",{children:[e("a",{href:"#/guide/svelte",children:"Svelte"})," - Svelte integration"]})]})]})),qc=f(()=>()=>e("div",{children:[e("h1",{children:"Solid 연동"}),e("p",{children:[e("code",{children:"@stateref/connect-solid"}),"를 사용하여 StateRef 스토어를 Solid.js에 연결합니다. Solid의 세밀한 반응성과 통합되는 Solid ",e("code",{children:"Signal"})," 쌍을 반환합니다."]}),e("h2",{children:"설치"}),e(r,{language:"bash",code:"pnpm add state-ref @stateref/connect-solid"}),e("h2",{children:"기본 사용법"}),e("p",{children:"Solid 커넥터는 스토어에서 추적할 부분을 선택하기 위해 콜백 패턴을 사용합니다:"}),e(r,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';
import { connectSolid } from '@stateref/connect-solid';

type Profile = { name: string; age: number };

const watch = createStore<Profile>({ name: 'Lee', age: 20 });

export const useProfile = connectSolid(watch);`}),e(r,{language:"tsx",code:`import { useProfile } from './store';

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
}`}),e("h2",{children:"작동 방식"}),e("p",{children:"Solid 커넥터는 StateRef와 Solid의 시그널 시스템을 연결합니다:"}),e("ul",{children:[e("li",{children:[e("code",{children:"connectSolid(watch)"}),"는 셀렉터 콜백을 받는 함수를 반환합니다"]}),e("li",{children:"셀렉터는 StateRefStore를 받아서 추적할 특정 프로퍼티를 반환합니다"}),e("li",{children:["Solid ",e("code",{children:"Signal"})," 쌍을 반환합니다: ",e("code",{children:"[getter, setter]"})]}),e("li",{children:["getter 함수를 호출하여 값을 읽습니다: ",e("code",{children:"name()"})]}),e("li",{children:["setter 함수를 사용하여 값을 업데이트합니다: ",e("code",{children:"setName('Jane')"})]}),e("li",{children:"양방향 바인딩: Solid 변경이 StateRef로, 그리고 그 반대로도 동기화됩니다"}),e("li",{children:[e("code",{children:"onCleanup"}),"을 통해 자동으로 정리됩니다"]})]}),e("h2",{children:"프로퍼티 선택하기"}),e("p",{children:"셀렉터 콜백을 사용하여 특정 프로퍼티를 선택합니다:"}),e(r,{language:"typescript",code:`const watch = createStore({
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark', lang: 'ko' }
});

const useStore = connectSolid(watch);`}),e(r,{language:"tsx",code:`import { useStore } from './store';

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
}`}),e("h2",{children:"객체 다루기"}),e("p",{children:"전체 객체를 선택할 수도 있습니다:"}),e(r,{language:"tsx",code:`import { useStore } from './store';

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
}`}),e("h2",{children:"액션과 함께 수동 동기화"}),e("p",{children:[e("code",{children:"createStoreManualSync"}),"를 사용하면 쓰기는 액션에서 처리합니다:"]}),e(r,{language:"typescript",code:`// store.ts
import { createStoreManualSync } from 'state-ref';
import { connectSolid } from '@stateref/connect-solid';

const { watch, updateRef, sync } = createStoreManualSync({ count: 0 });

export const useCounter = connectSolid(watch);

export const increment = () => {
  updateRef.count.value += 1;
  sync();
};`}),e(r,{language:"tsx",code:`import { useCounter, increment } from './store';

function Counter() {
  const [count] = useCounter(store => store.count);

  return (
    <button onClick={increment}>
      Count: {count()}
    </button>
  );
}`}),e("h2",{children:"Solid의 반응형 프리미티브와 함께 사용"}),e("p",{children:"파생 값을 위해 Solid의 반응형 프리미티브와 결합합니다:"}),e(r,{language:"tsx",code:`import { createMemo } from 'solid-js';
import { useStore } from './store';

function FullName() {
  const [firstName] = useStore(store => store.firstName);
  const [lastName] = useStore(store => store.lastName);

  // createMemo로 파생 값 생성
  const fullName = createMemo(() => \`\${firstName()} \${lastName()}\`);

  return <p>전체 이름: {fullName()}</p>;
}`}),e("h2",{children:"입력 바인딩 패턴"}),e("p",{children:"Solid에서 입력 바인딩을 처리합니다:"}),e(r,{language:"tsx",code:`import { useStore } from './store';

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
}`}),e("h2",{children:"TypeScript 팁"}),e("p",{children:"커넥터는 스토어의 타입을 유지합니다:"}),e(r,{language:"typescript",code:`type Todo = { title: string; done: boolean };
const watch = createStore<Todo>({ title: 'Write', done: false });
const useTodo = connectSolid(watch);

// TypeScript가 타입을 알고 있음
const [title, setTitle] = useTodo(store => store.title);
// title은 Accessor<string>, setTitle은 Setter<string>

const [done, setDone] = useTodo(store => store.done);
// done은 Accessor<boolean>, setDone은 Setter<boolean>`}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화 (Flux)"})," - 액션 기반 업데이트"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - 구독 동작"]}),e("li",{children:[e("a",{href:"#/ko/guide/svelte",children:"Svelte"})," - Svelte 연동"]})]})]})),Yc=f(()=>()=>e("div",{children:[e("h1",{children:"Lithent Integration"}),e("p",{children:["Lithent is a lightweight Virtual DOM library. StateRef integrates directly with Lithent without needing a separate connector package. Simply pass the ",e("code",{children:"renew"})," function to ",e("code",{children:"watch()"}),"."]}),e("h2",{children:"Install"}),e(r,{language:"bash",code:"pnpm add state-ref lithent"}),e("h2",{children:"Basic Usage"}),e("p",{children:["Pass the ",e("code",{children:"renew"})," function from ",e("code",{children:"mount()"})," directly to ",e("code",{children:"watch()"}),":"]}),e(r,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';

type Profile = { name: string; age: number };

export const profileStore = createStore<Profile>({ name: 'Lee', age: 20 });`}),e(r,{language:"tsx",code:`import { mount } from 'lithent';
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
});`}),e("h2",{children:"How It Works"}),e("p",{children:"Lithent's architecture makes StateRef integration seamless:"}),e("ul",{children:[e("li",{children:[e("code",{children:"mount(renew => ...)"})," provides a ",e("code",{children:"renew"})," function that triggers re-renders"]}),e("li",{children:[e("code",{children:"watch(renew)"})," registers ",e("code",{children:"renew"})," as a subscriber"]}),e("li",{children:["Returns a ",e("code",{children:"StateRefStore"})," for reading and writing values"]}),e("li",{children:["Access values via ",e("code",{children:".value"})," property"]}),e("li",{children:["When values change, ",e("code",{children:"renew"})," is called automatically"]}),e("li",{children:"The component re-renders with updated values"})]}),e("h2",{children:"Component Structure"}),e("p",{children:"Lithent components have two phases - setup and render:"}),e(r,{language:"tsx",code:`import { mount } from 'lithent';
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
});`}),e("h2",{children:"Multiple Stores"}),e("p",{children:"Subscribe to multiple stores in a single component:"}),e(r,{language:"typescript",code:`// stores.ts
import { createStore } from 'state-ref';

export const userStore = createStore({ name: 'John', age: 30 });
export const settingsStore = createStore({ theme: 'dark', lang: 'en' });`}),e(r,{language:"tsx",code:`import { mount } from 'lithent';
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
});`}),e("h2",{children:"Nested Properties"}),e("p",{children:"Access deeply nested values naturally:"}),e(r,{language:"tsx",code:`import { mount } from 'lithent';
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
});`}),e("h2",{children:"Manual Sync with Actions"}),e("p",{children:["Use ",e("code",{children:"createStoreManualSync"})," for Flux-style state management:"]}),e(r,{language:"typescript",code:`// store.ts
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
};`}),e(r,{language:"tsx",code:`import { mount } from 'lithent';
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
});`}),e("h2",{children:"Using with Helper Functions"}),e("p",{children:"Combine with StateRef helper functions:"}),e(r,{language:"tsx",code:`import { mount } from 'lithent';
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
});`}),e("h2",{children:"Form Handling"}),e("p",{children:"Handle form inputs with direct binding:"}),e(r,{language:"tsx",code:`import { mount } from 'lithent';
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
});`}),e("h2",{children:"TypeScript Tips"}),e("p",{children:"Full type inference works automatically:"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

type Todo = { title: string; done: boolean };
const todoStore = createStore<Todo>({ title: 'Write docs', done: false });

// In component
const store = todoStore(renew);
// store.title is StateRefStore<string>
// store.title.value is string
// store.done.value is boolean`}),e("h2",{children:"Why No Connector?"}),e("p",{children:"Unlike other frameworks, Lithent doesn't need a connector because:"}),e("ul",{children:[e("li",{children:["Lithent's ",e("code",{children:"renew"})," function has the exact signature StateRef expects"]}),e("li",{children:"The setup/render separation aligns perfectly with subscription patterns"}),e("li",{children:"No framework-specific reactivity system to bridge"}),e("li",{children:"Direct integration means zero overhead"})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore"})," - store creation"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - subscription behavior"]}),e("li",{children:[e("a",{href:"#/guide/manual-sync",children:"Manual Sync (Flux)"})," - action-based updates"]}),e("li",{children:[e("a",{href:"#/guide/computed",children:"createComputed"})," - derived values"]})]})]})),Zc=f(()=>()=>e("div",{children:[e("h1",{children:"Lithent 연동"}),e("p",{children:["Lithent는 경량 Virtual DOM 라이브러리입니다. StateRef는 별도의 커넥터 패키지 없이 Lithent와 직접 통합됩니다. 단순히 ",e("code",{children:"renew"})," 함수를 ",e("code",{children:"watch()"}),"에 전달하면 됩니다."]}),e("h2",{children:"설치"}),e(r,{language:"bash",code:"pnpm add state-ref lithent"}),e("h2",{children:"기본 사용법"}),e("p",{children:[e("code",{children:"mount()"}),"에서 받은 ",e("code",{children:"renew"})," 함수를 ",e("code",{children:"watch()"}),"에 직접 전달합니다:"]}),e(r,{language:"typescript",code:`// store.ts
import { createStore } from 'state-ref';

type Profile = { name: string; age: number };

export const profileStore = createStore<Profile>({ name: 'Lee', age: 20 });`}),e(r,{language:"tsx",code:`import { mount } from 'lithent';
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
});`}),e("h2",{children:"작동 방식"}),e("p",{children:"Lithent의 아키텍처는 StateRef 통합을 매끄럽게 만듭니다:"}),e("ul",{children:[e("li",{children:[e("code",{children:"mount(renew => ...)"}),"는 리렌더링을 트리거하는 ",e("code",{children:"renew"})," 함수를 제공합니다"]}),e("li",{children:[e("code",{children:"watch(renew)"}),"는 ",e("code",{children:"renew"}),"를 구독자로 등록합니다"]}),e("li",{children:["값을 읽고 쓰기 위한 ",e("code",{children:"StateRefStore"}),"를 반환합니다"]}),e("li",{children:[e("code",{children:".value"})," 프로퍼티로 값에 접근합니다"]}),e("li",{children:["값이 변경되면 ",e("code",{children:"renew"}),"가 자동으로 호출됩니다"]}),e("li",{children:"컴포넌트가 업데이트된 값으로 리렌더링됩니다"})]}),e("h2",{children:"컴포넌트 구조"}),e("p",{children:"Lithent 컴포넌트는 설정과 렌더 두 단계로 구성됩니다:"}),e(r,{language:"tsx",code:`import { mount } from 'lithent';
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
});`}),e("h2",{children:"여러 스토어 사용"}),e("p",{children:"하나의 컴포넌트에서 여러 스토어를 구독합니다:"}),e(r,{language:"typescript",code:`// stores.ts
import { createStore } from 'state-ref';

export const userStore = createStore({ name: 'John', age: 30 });
export const settingsStore = createStore({ theme: 'dark', lang: 'ko' });`}),e(r,{language:"tsx",code:`import { mount } from 'lithent';
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
});`}),e("h2",{children:"중첩된 프로퍼티"}),e("p",{children:"깊게 중첩된 값에 자연스럽게 접근합니다:"}),e(r,{language:"tsx",code:`import { mount } from 'lithent';
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
});`}),e("h2",{children:"액션과 함께 수동 동기화"}),e("p",{children:["Flux 스타일 상태 관리를 위해 ",e("code",{children:"createStoreManualSync"}),"를 사용합니다:"]}),e(r,{language:"typescript",code:`// store.ts
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
};`}),e(r,{language:"tsx",code:`import { mount } from 'lithent';
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
});`}),e("h2",{children:"헬퍼 함수와 함께 사용"}),e("p",{children:"StateRef 헬퍼 함수와 결합합니다:"}),e(r,{language:"tsx",code:`import { mount } from 'lithent';
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
});`}),e("h2",{children:"폼 처리"}),e("p",{children:"직접 바인딩으로 폼 입력을 처리합니다:"}),e(r,{language:"tsx",code:`import { mount } from 'lithent';
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
});`}),e("h2",{children:"TypeScript 팁"}),e("p",{children:"완전한 타입 추론이 자동으로 작동합니다:"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

type Todo = { title: string; done: boolean };
const todoStore = createStore<Todo>({ title: 'Write docs', done: false });

// 컴포넌트에서
const store = todoStore(renew);
// store.title은 StateRefStore<string>
// store.title.value는 string
// store.done.value는 boolean`}),e("h2",{children:"왜 커넥터가 필요 없나요?"}),e("p",{children:"다른 프레임워크와 달리 Lithent는 커넥터가 필요 없습니다:"}),e("ul",{children:[e("li",{children:["Lithent의 ",e("code",{children:"renew"})," 함수는 StateRef가 기대하는 정확한 시그니처를 가집니다"]}),e("li",{children:"설정/렌더 분리가 구독 패턴과 완벽하게 일치합니다"}),e("li",{children:"연결해야 할 프레임워크별 반응성 시스템이 없습니다"}),e("li",{children:"직접 통합은 오버헤드가 전혀 없습니다"})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore"})," - 스토어 생성"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - 구독 동작"]}),e("li",{children:[e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화 (Flux)"})," - 액션 기반 업데이트"]}),e("li",{children:[e("a",{href:"#/ko/guide/computed",children:"createComputed"})," - 파생 값"]})]})]})),Xc=f(()=>()=>e("div",{children:[e("h1",{children:"Custom Connector"}),e("p",{children:"Learn how to create your own connector to integrate StateRef with any UI framework. This guide walks through the patterns used by official connectors."}),e("h2",{children:"Core Concepts"}),e("p",{children:"A connector bridges StateRef's subscription system with a framework's reactivity:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Subscribe"}),": Call ",e("code",{children:"watch(callback)"})," to receive updates"]}),e("li",{children:[e("strong",{children:"Trigger re-render"}),": When StateRef notifies, update the framework's state"]}),e("li",{children:[e("strong",{children:"Cleanup"}),": Use ",e("code",{children:"AbortController"})," to unsubscribe on unmount"]}),e("li",{children:[e("strong",{children:"Two-way sync"}),": Optionally sync framework state back to StateRef"]})]}),e("h2",{children:"The Watch Callback Signature"}),e("p",{children:["The ",e("code",{children:"watch"})," function accepts a callback with this signature:"]}),e(r,{language:"typescript",code:`type Renew<T> = (
  store: StateRefStore<T>,
  isFirst: boolean
) => AbortSignal | void;`}),e("ul",{children:[e("li",{children:[e("code",{children:"store"}),": The StateRefStore for reading/writing values"]}),e("li",{children:[e("code",{children:"isFirst"}),": ",e("code",{children:"true"})," on initial call, ",e("code",{children:"false"})," on updates"]}),e("li",{children:["Return an ",e("code",{children:"AbortSignal"})," to enable unsubscription"]})]}),e("h2",{children:"Pattern 1: Direct Hook (React-style)"}),e("p",{children:["The simplest pattern returns a hook that provides the store directly. This is how ",e("code",{children:"connectReact"})," works:"]}),e(r,{language:"typescript",code:`import { useState, useRef, useEffect } from 'react';
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
}`}),e("p",{children:"Key points:"}),e("ul",{children:[e("li",{children:["Use ",e("code",{children:"useState"})," with a dummy counter to force re-renders"]}),e("li",{children:[e("code",{children:"isFirst"})," check prevents unnecessary initial re-render"]}),e("li",{children:[e("code",{children:"AbortController"})," handles cleanup when component unmounts"]}),e("li",{children:["Returns the ",e("code",{children:"StateRefStore"})," directly for ",e("code",{children:".value"})," access"]})]}),e("h2",{children:"Pattern 2: Selector Callback (Vue-style)"}),e("p",{children:"For frameworks with their own reactivity, use a selector pattern that returns framework-native reactive objects:"}),e(r,{language:"typescript",code:`import { reactive, watch, onUnmounted } from 'vue';
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
}`}),e("p",{children:"Key points:"}),e("ul",{children:[e("li",{children:"Selector callback lets users pick specific properties to track"}),e("li",{children:["Returns framework-native reactive object (Vue's ",e("code",{children:"Reactive"}),")"]}),e("li",{children:[e("code",{children:"changing"})," flag prevents infinite sync loops"]}),e("li",{children:[e("code",{children:"cloneDeep"})," ensures proper object copying"]}),e("li",{children:"Two-way sync: Vue changes update StateRef, StateRef changes update Vue"})]}),e("h2",{children:"Pattern 3: Signal Pair (Solid-style)"}),e("p",{children:"For frameworks with signal patterns, return getter/setter pairs:"}),e(r,{language:"typescript",code:`import { createSignal, onCleanup } from 'solid-js';
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
}`}),e("h2",{children:"Building Your Own Connector"}),e("p",{children:"Follow these steps to create a connector for any framework:"}),e("h3",{children:"Step 1: Identify the Re-render Mechanism"}),e("p",{children:"Every UI framework has a way to trigger re-renders:"}),e(r,{language:"typescript",code:`// React: useState setter
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
// Calling setValue() triggers re-render`}),e("h3",{children:"Step 2: Set Up Subscription"}),e(r,{language:"typescript",code:`const abortController = new AbortController();

watch(store => {
  // Access .value to register tracking
  const currentValue = store.someProperty.value;

  // Update framework state here
  frameworkState = currentValue;

  // Return signal for cleanup
  return abortController.signal;
});`}),e("h3",{children:"Step 3: Handle Cleanup"}),e(r,{language:"typescript",code:`// React
useEffect(() => () => abortController.abort(), []);

// Vue
onUnmounted(() => abortController.abort());

// Svelte
onDestroy(() => abortController.abort());

// Solid
onCleanup(() => abortController.abort());`}),e("h3",{children:"Step 4: Two-Way Sync (Optional)"}),e(r,{language:"typescript",code:`let changing = false;

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
});`}),e("h2",{children:"Minimal Example"}),e("p",{children:"Here's a minimal connector for a hypothetical framework:"}),e(r,{language:"typescript",code:`import type { StateRefStore, Watch } from 'state-ref';

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
}`}),e("h2",{children:"Important Considerations"}),e("ul",{children:[e("li",{children:[e("strong",{children:"isFirst check"}),": Skip re-render on initial subscription to avoid double render"]}),e("li",{children:[e("strong",{children:"Sync loop prevention"}),": Use a ",e("code",{children:"changing"})," flag for two-way binding"]}),e("li",{children:[e("strong",{children:"Object cloning"}),": Use ",e("code",{children:"cloneDeep"})," when passing objects between systems"]}),e("li",{children:[e("strong",{children:"AbortController"}),": Always return the signal and abort on cleanup"]}),e("li",{children:[e("strong",{children:"queueMicrotask"}),": Reset flags asynchronously to handle batched updates"]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function"})," - understanding watch behavior"]}),e("li",{children:[e("a",{href:"#/guide/subscription",children:"Subscription"})," - subscription patterns"]}),e("li",{children:[e("a",{href:"#/guide/react",children:"React"})," - React connector usage"]}),e("li",{children:[e("a",{href:"#/guide/vue",children:"Vue"})," - Vue connector usage"]}),e("li",{children:[e("a",{href:"#/guide/lithent",children:"Lithent"})," - direct integration without connector"]})]})]})),Qc=f(()=>()=>e("div",{children:[e("h1",{children:"커스텀 커넥터"}),e("p",{children:"StateRef를 어떤 UI 프레임워크와도 통합할 수 있는 커스텀 커넥터를 만드는 방법을 알아봅니다. 이 가이드는 공식 커넥터에서 사용되는 패턴을 설명합니다."}),e("h2",{children:"핵심 개념"}),e("p",{children:"커넥터는 StateRef의 구독 시스템과 프레임워크의 반응성을 연결합니다:"}),e("ul",{children:[e("li",{children:[e("strong",{children:"구독"}),": ",e("code",{children:"watch(callback)"}),"을 호출하여 업데이트를 받습니다"]}),e("li",{children:[e("strong",{children:"리렌더 트리거"}),": StateRef가 알릴 때 프레임워크의 상태를 업데이트합니다"]}),e("li",{children:[e("strong",{children:"정리"}),": ",e("code",{children:"AbortController"}),"를 사용하여 언마운트 시 구독 해제합니다"]}),e("li",{children:[e("strong",{children:"양방향 동기화"}),": 선택적으로 프레임워크 상태를 StateRef로 다시 동기화합니다"]})]}),e("h2",{children:"Watch 콜백 시그니처"}),e("p",{children:[e("code",{children:"watch"})," 함수는 다음 시그니처의 콜백을 받습니다:"]}),e(r,{language:"typescript",code:`type Renew<T> = (
  store: StateRefStore<T>,
  isFirst: boolean
) => AbortSignal | void;`}),e("ul",{children:[e("li",{children:[e("code",{children:"store"}),": 값을 읽고 쓰기 위한 StateRefStore"]}),e("li",{children:[e("code",{children:"isFirst"}),": 초기 호출 시 ",e("code",{children:"true"}),", 업데이트 시 ",e("code",{children:"false"})]}),e("li",{children:["구독 해제를 위해 ",e("code",{children:"AbortSignal"}),"을 반환합니다"]})]}),e("h2",{children:"패턴 1: 직접 훅 (React 스타일)"}),e("p",{children:["가장 단순한 패턴은 스토어를 직접 제공하는 훅을 반환합니다.",e("code",{children:"connectReact"}),"의 동작 방식입니다:"]}),e(r,{language:"typescript",code:`import { useState, useRef, useEffect } from 'react';
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
}`}),e("p",{children:"핵심 포인트:"}),e("ul",{children:[e("li",{children:["더미 카운터와 ",e("code",{children:"useState"}),"를 사용하여 강제 리렌더"]}),e("li",{children:[e("code",{children:"isFirst"})," 검사로 불필요한 초기 리렌더 방지"]}),e("li",{children:["컴포넌트 언마운트 시 ",e("code",{children:"AbortController"}),"가 정리 처리"]}),e("li",{children:[e("code",{children:".value"})," 접근을 위해 ",e("code",{children:"StateRefStore"}),"를 직접 반환"]})]}),e("h2",{children:"패턴 2: 셀렉터 콜백 (Vue 스타일)"}),e("p",{children:"자체 반응성이 있는 프레임워크의 경우, 프레임워크 네이티브 반응형 객체를 반환하는 셀렉터 패턴을 사용합니다:"}),e(r,{language:"typescript",code:`import { reactive, watch, onUnmounted } from 'vue';
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
}`}),e("p",{children:"핵심 포인트:"}),e("ul",{children:[e("li",{children:"셀렉터 콜백으로 사용자가 추적할 특정 프로퍼티 선택 가능"}),e("li",{children:["프레임워크 네이티브 반응형 객체 반환 (Vue의 ",e("code",{children:"Reactive"}),")"]}),e("li",{children:[e("code",{children:"changing"})," 플래그로 무한 동기화 루프 방지"]}),e("li",{children:[e("code",{children:"cloneDeep"}),"으로 적절한 객체 복사 보장"]}),e("li",{children:"양방향 동기화: Vue 변경은 StateRef 업데이트, StateRef 변경은 Vue 업데이트"})]}),e("h2",{children:"패턴 3: 시그널 쌍 (Solid 스타일)"}),e("p",{children:"시그널 패턴이 있는 프레임워크의 경우, getter/setter 쌍을 반환합니다:"}),e(r,{language:"typescript",code:`import { createSignal, onCleanup } from 'solid-js';
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
}`}),e("h2",{children:"직접 커넥터 만들기"}),e("p",{children:"어떤 프레임워크든 커넥터를 만들려면 다음 단계를 따르세요:"}),e("h3",{children:"1단계: 리렌더 메커니즘 파악"}),e("p",{children:"모든 UI 프레임워크에는 리렌더를 트리거하는 방법이 있습니다:"}),e(r,{language:"typescript",code:`// React: useState setter
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
// setValue() 호출하면 리렌더 트리거`}),e("h3",{children:"2단계: 구독 설정"}),e(r,{language:"typescript",code:`const abortController = new AbortController();

watch(store => {
  // .value에 접근하여 추적 등록
  const currentValue = store.someProperty.value;

  // 여기서 프레임워크 상태 업데이트
  frameworkState = currentValue;

  // 정리를 위한 시그널 반환
  return abortController.signal;
});`}),e("h3",{children:"3단계: 정리 처리"}),e(r,{language:"typescript",code:`// React
useEffect(() => () => abortController.abort(), []);

// Vue
onUnmounted(() => abortController.abort());

// Svelte
onDestroy(() => abortController.abort());

// Solid
onCleanup(() => abortController.abort());`}),e("h3",{children:"4단계: 양방향 동기화 (선택)"}),e(r,{language:"typescript",code:`let changing = false;

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
});`}),e("h2",{children:"최소 예제"}),e("p",{children:"가상의 프레임워크를 위한 최소 커넥터입니다:"}),e(r,{language:"typescript",code:`import type { StateRefStore, Watch } from 'state-ref';

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
}`}),e("h2",{children:"중요 고려사항"}),e("ul",{children:[e("li",{children:[e("strong",{children:"isFirst 검사"}),": 초기 구독에서 리렌더를 건너뛰어 이중 렌더 방지"]}),e("li",{children:[e("strong",{children:"동기화 루프 방지"}),": 양방향 바인딩에 ",e("code",{children:"changing"})," 플래그 사용"]}),e("li",{children:[e("strong",{children:"객체 복제"}),": 시스템 간 객체 전달 시 ",e("code",{children:"cloneDeep"})," 사용"]}),e("li",{children:[e("strong",{children:"AbortController"}),": 항상 시그널을 반환하고 정리 시 abort 호출"]}),e("li",{children:[e("strong",{children:"queueMicrotask"}),": 일괄 업데이트 처리를 위해 플래그를 비동기로 리셋"]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수"})," - watch 동작 이해"]}),e("li",{children:[e("a",{href:"#/ko/guide/subscription",children:"구독"})," - 구독 패턴"]}),e("li",{children:[e("a",{href:"#/ko/guide/react",children:"React"})," - React 커넥터 사용법"]}),e("li",{children:[e("a",{href:"#/ko/guide/vue",children:"Vue"})," - Vue 커넥터 사용법"]}),e("li",{children:[e("a",{href:"#/ko/guide/lithent",children:"Lithent"})," - 커넥터 없는 직접 통합"]})]})]})),ea=f(()=>()=>e("div",{children:[e("h1",{children:"Core API"}),e("p",{children:["This page documents the core functions exported from ",e("code",{children:"state-ref"}),". These are the fundamental building blocks for state management."]}),e("h2",{children:"createStore"}),e("p",{children:"Creates a reactive store with the given initial value and returns a watch function."}),e("h3",{children:"Signature"}),e(r,{language:"typescript",code:"function createStore<V>(initialValue: V): Watch<V>"}),e("h3",{children:"Parameters"}),e("ul",{children:e("li",{children:[e("code",{children:"initialValue: V"})," - The initial value of the store. Can be a primitive (number, string, boolean) or an object/array."]})}),e("h3",{children:"Returns"}),e("p",{children:["Returns a ",e("code",{children:"Watch<V>"})," function that can be called to access the store or subscribe to changes."]}),e("h3",{children:"Example"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

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
});`}),e("h2",{children:"createStoreManualSync"}),e("p",{children:["Creates a store with manual synchronization control. Updates are not automatically propagated to subscribers until ",e("code",{children:"sync()"})," is called."]}),e("h3",{children:"Signature"}),e(r,{language:"typescript",code:`function createStoreManualSync<V>(initialValue: V): ManualSyncStore<V>

type ManualSyncStore<V> = {
  watch: Watch<V>;           // Read-only subscription
  updateRef: StateRefStore<V>;  // Reference for updates
  sync: () => void;          // Trigger synchronization
}`}),e("h3",{children:"Parameters"}),e("ul",{children:e("li",{children:[e("code",{children:"initialValue: V"})," - The initial value of the store."]})}),e("h3",{children:"Returns"}),e("p",{children:["Returns a ",e("code",{children:"ManualSyncStore<V>"})," object with three properties:"]}),e("ul",{children:[e("li",{children:[e("code",{children:"watch"})," - A watch function for read-only subscriptions"]}),e("li",{children:[e("code",{children:"updateRef"})," - A reference for updating values (writes don't trigger subscribers)"]}),e("li",{children:[e("code",{children:"sync()"})," - A function to manually trigger all pending updates to subscribers"]})]}),e("h3",{children:"Example"}),e(r,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';

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
// Logs: "Synced count: 30"`}),e("h2",{children:"createComputed"}),e("p",{children:"Creates a computed (derived) value from one or more watches. The computed value is read-only and automatically updates when source stores change."}),e("h3",{children:"Signature"}),e(r,{language:"typescript",code:`function createComputed<W extends readonly Watch<any>[], R>(
  watches: W,
  callback: (refs: StateRefsTuple<W>) => R
): (computedCallback?: (proxy: { value: R }, isFirst: boolean) => void) => { value: R }`}),e("h3",{children:"Parameters"}),e("ul",{children:[e("li",{children:[e("code",{children:"watches: W"})," - An array of watch functions to combine"]}),e("li",{children:[e("code",{children:"callback: (refs) => R"})," - A function that receives the store references and returns the computed value"]})]}),e("h3",{children:"Returns"}),e("p",{children:["Returns a watch-like function that provides access to the computed value via ",e("code",{children:".value"}),". The returned value is read-only; attempting to set it will show a warning."]}),e("h3",{children:"Example"}),e(r,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';

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
// Logs: "Total changed: 450"`}),e("h2",{children:"combineWatch"}),e("p",{children:["Combines multiple watches into a single watch that delivers their values as a tuple. Unlike ",e("code",{children:"createComputed"}),", it preserves individual store access."]}),e("h3",{children:"Signature"}),e(r,{language:"typescript",code:`function combineWatch<W extends readonly Watch<any>[]>(
  watches: [...W]
): Watch<CombinedValue<W>>`}),e("h3",{children:"Parameters"}),e("ul",{children:e("li",{children:[e("code",{children:"watches: W"})," - An array of watch functions to combine"]})}),e("h3",{children:"Returns"}),e("p",{children:["Returns a new ",e("code",{children:"Watch"})," function. The returned store provides access to individual stores by index (e.g., ",e("code",{children:"combined[0]"}),", ",e("code",{children:"combined[1]"}),")."]}),e("h3",{children:"Example"}),e(r,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';

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
});`}),e("h2",{children:"Watch Function"}),e("p",{children:["The ",e("code",{children:"Watch"})," type represents the function returned by ",e("code",{children:"createStore"}),"."]}),e("h3",{children:"Type Definition"}),e(r,{language:"typescript",code:`type Watch<V> = (
  renew?: Renew<StateRefStore<V>>,
  userOption?: { cache?: boolean; editable?: boolean }
) => StateRefStore<V>`}),e("h3",{children:"Parameters"}),e("ul",{children:[e("li",{children:[e("code",{children:"renew"})," (optional) - Callback function invoked on state changes"]}),e("li",{children:[e("code",{children:"userOption.cache"})," (optional, default: ",e("code",{children:"true"}),") - Whether to cache the proxy for the same renew function"]}),e("li",{children:[e("code",{children:"userOption.editable"})," (optional, default: ",e("code",{children:"true"}),") - Whether the returned reference can modify the store"]})]}),e("h3",{children:"Renew Callback"}),e(r,{language:"typescript",code:`type Renew<G> = (
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
controller.abort();`}),e("h2",{children:"StateRefStore"}),e("p",{children:["The ",e("code",{children:"StateRefStore"})," type represents the proxy object returned when calling a watch function. It provides reactive access to state via the ",e("code",{children:".value"})," property."]}),e("h3",{children:"Type Definition"}),e(r,{language:"typescript",code:`type StateRefStore<S> = S extends object
  ? {
      [K in keyof S]: StateRefStore<S[K]>;
    } & {
      value: S;
    }
  : { value: S }`}),e("h3",{children:"Behavior"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Object types"}),": Can navigate nested properties, each with its own ",e("code",{children:".value"})]}),e("li",{children:[e("strong",{children:"Primitive types"}),": Access and modify via ",e("code",{children:".value"})]}),e("li",{children:[e("strong",{children:["Reading ",e("code",{children:".value"})]}),": Registers a subscription for that property"]}),e("li",{children:[e("strong",{children:["Writing ",e("code",{children:".value"})]}),": Updates the store and notifies subscribers"]})]}),e(r,{language:"typescript",code:`const watch = createStore({ user: { name: 'John', age: 30 } });
const ref = watch();

// Deep navigation
ref.user.name.value;           // 'John'
ref.user.age.value;            // 30
ref.user.value;                // { name: 'John', age: 30 }
ref.value;                     // { user: { name: 'John', age: 30 } }

// Update
ref.user.name.value = 'Jane';  // Updates and notifies
ref.user.value = { name: 'Bob', age: 25 };  // Replace entire user object`}),e("h2",{children:"ManualSyncStore"}),e("p",{children:["The type returned by ",e("code",{children:"createStoreManualSync"}),"."]}),e("h3",{children:"Type Definition"}),e(r,{language:"typescript",code:`type ManualSyncStore<V> = {
  watch: Watch<V>;           // For subscribing to changes
  updateRef: StateRefStore<V>;  // For updating values
  sync: () => void;          // For triggering sync
}`}),e("h2",{children:"Summary Table"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Function"}),e("th",{children:"Purpose"}),e("th",{children:"Auto Sync"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"createStore"})}),e("td",{children:"Create a reactive store"}),e("td",{children:"Yes"})]}),e("tr",{children:[e("td",{children:e("code",{children:"createStoreManualSync"})}),e("td",{children:"Create store with manual sync control"}),e("td",{children:"No"})]}),e("tr",{children:[e("td",{children:e("code",{children:"createComputed"})}),e("td",{children:"Derive new value from stores"}),e("td",{children:"Yes"})]}),e("tr",{children:[e("td",{children:e("code",{children:"combineWatch"})}),e("td",{children:"Group stores as tuple"}),e("td",{children:"Yes"})]})]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/create-store",children:"createStore Guide"})," - Detailed usage guide"]}),e("li",{children:[e("a",{href:"#/guide/watch",children:"Watch Function Guide"})," - Understanding watch functions"]}),e("li",{children:[e("a",{href:"#/guide/manual-sync",children:"Manual Sync Guide"})," - Flux pattern with manual sync"]}),e("li",{children:[e("a",{href:"#/api/helpers",children:"Helper API"})," - lens, copyable, cloneDeep"]}),e("li",{children:[e("a",{href:"#/api/types",children:"TypeScript Types"})," - Complete type definitions"]})]})]})),ta=f(()=>()=>e("div",{children:[e("h1",{children:"Core API"}),e("p",{children:["이 페이지는 ",e("code",{children:"state-ref"}),"에서 내보내는 핵심 함수들을 문서화합니다. 이들은 상태 관리의 기본 구성 요소입니다."]}),e("h2",{children:"createStore"}),e("p",{children:"주어진 초기값으로 반응형 스토어를 생성하고 watch 함수를 반환합니다."}),e("h3",{children:"시그니처"}),e(r,{language:"typescript",code:"function createStore<V>(initialValue: V): Watch<V>"}),e("h3",{children:"매개변수"}),e("ul",{children:e("li",{children:[e("code",{children:"initialValue: V"})," - 스토어의 초기값. 원시 타입(number, string, boolean) 또는 객체/배열이 될 수 있습니다."]})}),e("h3",{children:"반환값"}),e("p",{children:["스토어에 접근하거나 변경을 구독할 수 있는 ",e("code",{children:"Watch<V>"})," 함수를 반환합니다."]}),e("h3",{children:"예제"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';

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
});`}),e("h2",{children:"createStoreManualSync"}),e("p",{children:["수동 동기화 제어가 있는 스토어를 생성합니다. ",e("code",{children:"sync()"}),"가 호출될 때까지 업데이트가 구독자에게 자동으로 전파되지 않습니다."]}),e("h3",{children:"시그니처"}),e(r,{language:"typescript",code:`function createStoreManualSync<V>(initialValue: V): ManualSyncStore<V>

type ManualSyncStore<V> = {
  watch: Watch<V>;           // 읽기 전용 구독
  updateRef: StateRefStore<V>;  // 업데이트용 참조
  sync: () => void;          // 동기화 트리거
}`}),e("h3",{children:"매개변수"}),e("ul",{children:e("li",{children:[e("code",{children:"initialValue: V"})," - 스토어의 초기값."]})}),e("h3",{children:"반환값"}),e("p",{children:["세 가지 프로퍼티를 가진 ",e("code",{children:"ManualSyncStore<V>"})," 객체를 반환합니다:"]}),e("ul",{children:[e("li",{children:[e("code",{children:"watch"})," - 읽기 전용 구독을 위한 watch 함수"]}),e("li",{children:[e("code",{children:"updateRef"})," - 값 업데이트를 위한 참조 (쓰기가 구독자를 트리거하지 않음)"]}),e("li",{children:[e("code",{children:"sync()"})," - 모든 대기 중인 업데이트를 구독자에게 수동으로 트리거하는 함수"]})]}),e("h3",{children:"예제"}),e(r,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';

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
// 로그: "동기화된 count: 30"`}),e("h2",{children:"createComputed"}),e("p",{children:"하나 이상의 watch에서 계산된(파생) 값을 생성합니다. 계산된 값은 읽기 전용이며 소스 스토어가 변경되면 자동으로 업데이트됩니다."}),e("h3",{children:"시그니처"}),e(r,{language:"typescript",code:`function createComputed<W extends readonly Watch<any>[], R>(
  watches: W,
  callback: (refs: StateRefsTuple<W>) => R
): (computedCallback?: (proxy: { value: R }, isFirst: boolean) => void) => { value: R }`}),e("h3",{children:"매개변수"}),e("ul",{children:[e("li",{children:[e("code",{children:"watches: W"})," - 결합할 watch 함수 배열"]}),e("li",{children:[e("code",{children:"callback: (refs) => R"})," - 스토어 참조를 받아 계산된 값을 반환하는 함수"]})]}),e("h3",{children:"반환값"}),e("p",{children:[e("code",{children:".value"}),"를 통해 계산된 값에 접근할 수 있는 watch 유사 함수를 반환합니다. 반환된 값은 읽기 전용이며, 설정하려고 하면 경고가 표시됩니다."]}),e("h3",{children:"예제"}),e(r,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';

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
// 로그: "Total 변경됨: 450"`}),e("h2",{children:"combineWatch"}),e("p",{children:["여러 watch를 값을 튜플로 전달하는 단일 watch로 결합합니다.",e("code",{children:"createComputed"}),"와 달리 개별 스토어 접근을 유지합니다."]}),e("h3",{children:"시그니처"}),e(r,{language:"typescript",code:`function combineWatch<W extends readonly Watch<any>[]>(
  watches: [...W]
): Watch<CombinedValue<W>>`}),e("h3",{children:"매개변수"}),e("ul",{children:e("li",{children:[e("code",{children:"watches: W"})," - 결합할 watch 함수 배열"]})}),e("h3",{children:"반환값"}),e("p",{children:["새로운 ",e("code",{children:"Watch"})," 함수를 반환합니다. 반환된 스토어는 인덱스로 개별 스토어에 접근할 수 있습니다 (예: ",e("code",{children:"combined[0]"}),", ",e("code",{children:"combined[1]"}),")."]}),e("h3",{children:"예제"}),e(r,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';

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
});`}),e("h2",{children:"Watch 함수"}),e("p",{children:[e("code",{children:"Watch"})," 타입은 ",e("code",{children:"createStore"}),"가 반환하는 함수를 나타냅니다."]}),e("h3",{children:"타입 정의"}),e(r,{language:"typescript",code:`type Watch<V> = (
  renew?: Renew<StateRefStore<V>>,
  userOption?: { cache?: boolean; editable?: boolean }
) => StateRefStore<V>`}),e("h3",{children:"매개변수"}),e("ul",{children:[e("li",{children:[e("code",{children:"renew"})," (선택) - 상태 변경 시 호출되는 콜백 함수"]}),e("li",{children:[e("code",{children:"userOption.cache"})," (선택, 기본값: ",e("code",{children:"true"}),") - 동일한 renew 함수에 대해 프록시를 캐시할지 여부"]}),e("li",{children:[e("code",{children:"userOption.editable"})," (선택, 기본값: ",e("code",{children:"true"}),") - 반환된 참조가 스토어를 수정할 수 있는지 여부"]})]}),e("h3",{children:"Renew 콜백"}),e(r,{language:"typescript",code:`type Renew<G> = (
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
controller.abort();`}),e("h2",{children:"StateRefStore"}),e("p",{children:[e("code",{children:"StateRefStore"})," 타입은 watch 함수를 호출할 때 반환되는 프록시 객체를 나타냅니다. ",e("code",{children:".value"})," 프로퍼티를 통해 상태에 대한 반응형 접근을 제공합니다."]}),e("h3",{children:"타입 정의"}),e(r,{language:"typescript",code:`type StateRefStore<S> = S extends object
  ? {
      [K in keyof S]: StateRefStore<S[K]>;
    } & {
      value: S;
    }
  : { value: S }`}),e("h3",{children:"동작"}),e("ul",{children:[e("li",{children:[e("strong",{children:"객체 타입"}),": 중첩된 프로퍼티를 탐색할 수 있으며, 각각 자체 ",e("code",{children:".value"}),"를 가짐"]}),e("li",{children:[e("strong",{children:"원시 타입"}),": ",e("code",{children:".value"}),"로 접근 및 수정"]}),e("li",{children:[e("strong",{children:[e("code",{children:".value"})," 읽기"]}),": 해당 프로퍼티에 대한 구독 등록"]}),e("li",{children:[e("strong",{children:[e("code",{children:".value"})," 쓰기"]}),": 스토어를 업데이트하고 구독자에게 알림"]})]}),e(r,{language:"typescript",code:`const watch = createStore({ user: { name: 'John', age: 30 } });
const ref = watch();

// 깊은 탐색
ref.user.name.value;           // 'John'
ref.user.age.value;            // 30
ref.user.value;                // { name: 'John', age: 30 }
ref.value;                     // { user: { name: 'John', age: 30 } }

// 업데이트
ref.user.name.value = 'Jane';  // 업데이트하고 알림
ref.user.value = { name: 'Bob', age: 25 };  // 전체 user 객체 교체`}),e("h2",{children:"ManualSyncStore"}),e("p",{children:[e("code",{children:"createStoreManualSync"}),"가 반환하는 타입입니다."]}),e("h3",{children:"타입 정의"}),e(r,{language:"typescript",code:`type ManualSyncStore<V> = {
  watch: Watch<V>;           // 변경 구독용
  updateRef: StateRefStore<V>;  // 값 업데이트용
  sync: () => void;          // 동기화 트리거용
}`}),e("h2",{children:"요약 표"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"함수"}),e("th",{children:"목적"}),e("th",{children:"자동 동기화"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"createStore"})}),e("td",{children:"반응형 스토어 생성"}),e("td",{children:"예"})]}),e("tr",{children:[e("td",{children:e("code",{children:"createStoreManualSync"})}),e("td",{children:"수동 동기화 제어가 있는 스토어 생성"}),e("td",{children:"아니오"})]}),e("tr",{children:[e("td",{children:e("code",{children:"createComputed"})}),e("td",{children:"스토어에서 새 값 파생"}),e("td",{children:"예"})]}),e("tr",{children:[e("td",{children:e("code",{children:"combineWatch"})}),e("td",{children:"스토어를 튜플로 그룹화"}),e("td",{children:"예"})]})]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/create-store",children:"createStore 가이드"})," - 상세 사용 가이드"]}),e("li",{children:[e("a",{href:"#/ko/guide/watch",children:"Watch 함수 가이드"})," - watch 함수 이해하기"]}),e("li",{children:[e("a",{href:"#/ko/guide/manual-sync",children:"수동 동기화 가이드"})," - 수동 동기화를 통한 Flux 패턴"]}),e("li",{children:[e("a",{href:"#/ko/api/helpers",children:"헬퍼 API"})," - lens, copyable, cloneDeep"]}),e("li",{children:[e("a",{href:"#/ko/api/types",children:"TypeScript 타입"})," - 전체 타입 정의"]})]})]})),ra=f(()=>()=>e("div",{children:[e("h1",{children:"Helper API"}),e("p",{children:["This page documents the helper functions exported from ",e("code",{children:"state-ref"}),". These utilities assist with immutable updates and deep copying."]}),e("h2",{children:"lens"}),e("p",{children:"Creates a lens for navigating and immutably updating nested data structures. Lenses provide a functional approach to accessing and modifying deeply nested properties."}),e("h3",{children:"Signature"}),e(r,{language:"typescript",code:`function lens<T extends object>(
  sceneList?: (string | number | symbol)[]
): Lens<T, T>`}),e("h3",{children:"Parameters"}),e("ul",{children:e("li",{children:[e("code",{children:"sceneList"})," (optional) - Initial path array for the lens. Defaults to empty array."]})}),e("h3",{children:"Returns"}),e("p",{children:["Returns a ",e("code",{children:"Lens"})," instance with the following methods:"]}),e("h3",{children:"Lens Class"}),e(r,{language:"typescript",code:`class Lens<Root extends object, Focus = Root> {
  // Navigate to a nested property
  chain<K extends keyof Focus>(prop: K): Lens<Root, Focus[K]>

  // Get the focused value from an object
  get(targetObject: Root): Focus

  // Create an immutable update function
  set(value: Focus): (targetObject: Root) => Root
}`}),e("h3",{children:"Methods"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Method"}),e("th",{children:"Description"}),e("th",{children:"Returns"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"chain(prop)"})}),e("td",{children:"Navigate to a nested property"}),e("td",{children:["New ",e("code",{children:"Lens"})," focused on the property"]})]}),e("tr",{children:[e("td",{children:e("code",{children:"get(obj)"})}),e("td",{children:"Extract the focused value"}),e("td",{children:"The value at the focused path"})]}),e("tr",{children:[e("td",{children:e("code",{children:"set(value)"})}),e("td",{children:"Create an update function"}),e("td",{children:"Function that returns a new object with the update"})]})]})]}),e("h3",{children:"Example"}),e(r,{language:"typescript",code:`import { lens } from 'state-ref';

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

console.log(firstItemNameLens.get(listState));  // 'Item 1'`}),e("h2",{children:"copyable"}),e("p",{children:["Wraps an object to provide a convenient ",e("code",{children:"writeCopy"})," method for immutable updates. Combines lens navigation with a fluent API."]}),e("h3",{children:"Signature"}),e(r,{language:"typescript",code:`function copyable<T extends { [key: string | symbol]: unknown }>(
  origObj: T,
  lensInit?: Lens<T, any>
): Copyable<T>

type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(value: V) => Root;
}`}),e("h3",{children:"Parameters"}),e("ul",{children:[e("li",{children:[e("code",{children:"origObj: T"})," - The object to wrap"]}),e("li",{children:[e("code",{children:"lensInit"})," (optional) - Initial lens for the wrapper"]})]}),e("h3",{children:"Returns"}),e("p",{children:["Returns a ",e("code",{children:"Copyable"})," proxy that allows:"]}),e("ul",{children:[e("li",{children:"Property navigation (like regular object access)"}),e("li",{children:[e("code",{children:"writeCopy(value)"})," method to create an immutable update"]})]}),e("h3",{children:"Example"}),e(r,{language:"typescript",code:`import { copyable } from 'state-ref';

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
}`}),e("h3",{children:"Use with StateRef"}),e(r,{language:"typescript",code:`import { createStore, copyable } from 'state-ref';

const watch = createStore({
  todos: [
    { id: 1, text: 'Learn StateRef', done: false },
    { id: 2, text: 'Build app', done: false }
  ]
});

const ref = watch();

// Update nested array item immutably
ref.todos.value = copyable(ref.todos.value)[0].done.writeCopy(true);

console.log(ref.todos.value[0].done);  // true`}),e("h2",{children:"cloneDeep"}),e("p",{children:"Creates a deep copy of a value. Recursively clones objects and arrays."}),e("h3",{children:"Signature"}),e(r,{language:"typescript",code:"function cloneDeep<T>(value: T): T"}),e("h3",{children:"Parameters"}),e("ul",{children:e("li",{children:[e("code",{children:"value: T"})," - The value to clone"]})}),e("h3",{children:"Returns"}),e("p",{children:"Returns a deep copy of the input value. For primitives, returns the value as-is. For objects and arrays, creates new instances with recursively cloned contents."}),e("h3",{children:"Behavior"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Input Type"}),e("th",{children:"Behavior"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:[e("code",{children:"null"})," / ",e("code",{children:"undefined"})]}),e("td",{children:"Returns as-is"})]}),e("tr",{children:[e("td",{children:"Primitives (number, string, boolean)"}),e("td",{children:"Returns as-is"})]}),e("tr",{children:[e("td",{children:"Arrays"}),e("td",{children:"Creates new array with cloned elements"})]}),e("tr",{children:[e("td",{children:"Objects"}),e("td",{children:"Creates new object with cloned properties"})]})]})]}),e("h3",{children:"Example"}),e(r,{language:"typescript",code:`import { cloneDeep } from 'state-ref';

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
console.log(cloneDeep(null));         // null`}),e("h3",{children:"Use Cases"}),e(r,{language:"typescript",code:`import { createStore, cloneDeep } from 'state-ref';

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
ref.items.value = newItems;`}),e("h2",{children:"Summary Table"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Function"}),e("th",{children:"Purpose"}),e("th",{children:"Mutates Original"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"lens"})}),e("td",{children:"Navigate and update nested structures"}),e("td",{children:"No"})]}),e("tr",{children:[e("td",{children:e("code",{children:"copyable"})}),e("td",{children:"Fluent API for immutable updates"}),e("td",{children:"No"})]}),e("tr",{children:[e("td",{children:e("code",{children:"cloneDeep"})}),e("td",{children:"Deep copy values"}),e("td",{children:"No (creates copy)"})]})]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/guide/lens",children:"Lens Pattern Guide"})," - Detailed lens usage guide"]}),e("li",{children:[e("a",{href:"#/guide/copyable",children:"copyable Guide"})," - copyable usage guide"]}),e("li",{children:[e("a",{href:"#/guide/clone-deep",children:"cloneDeep Guide"})," - cloneDeep usage guide"]}),e("li",{children:[e("a",{href:"#/api/core",children:"Core API"})," - createStore, createComputed, combineWatch"]}),e("li",{children:[e("a",{href:"#/api/types",children:"TypeScript Types"})," - Complete type definitions"]})]})]})),na=f(()=>()=>e("div",{children:[e("h1",{children:"Helper API"}),e("p",{children:["이 페이지는 ",e("code",{children:"state-ref"}),"에서 내보내는 헬퍼 함수들을 문서화합니다. 이 유틸리티들은 불변 업데이트와 깊은 복사를 지원합니다."]}),e("h2",{children:"lens"}),e("p",{children:"중첩된 데이터 구조를 탐색하고 불변하게 업데이트하기 위한 렌즈를 생성합니다. 렌즈는 깊게 중첩된 프로퍼티에 접근하고 수정하는 함수형 접근 방식을 제공합니다."}),e("h3",{children:"시그니처"}),e(r,{language:"typescript",code:`function lens<T extends object>(
  sceneList?: (string | number | symbol)[]
): Lens<T, T>`}),e("h3",{children:"매개변수"}),e("ul",{children:e("li",{children:[e("code",{children:"sceneList"})," (선택) - 렌즈의 초기 경로 배열. 기본값은 빈 배열."]})}),e("h3",{children:"반환값"}),e("p",{children:["다음 메서드를 가진 ",e("code",{children:"Lens"})," 인스턴스를 반환합니다:"]}),e("h3",{children:"Lens 클래스"}),e(r,{language:"typescript",code:`class Lens<Root extends object, Focus = Root> {
  // 중첩된 프로퍼티로 탐색
  chain<K extends keyof Focus>(prop: K): Lens<Root, Focus[K]>

  // 객체에서 포커스된 값 가져오기
  get(targetObject: Root): Focus

  // 불변 업데이트 함수 생성
  set(value: Focus): (targetObject: Root) => Root
}`}),e("h3",{children:"메서드"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"메서드"}),e("th",{children:"설명"}),e("th",{children:"반환값"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"chain(prop)"})}),e("td",{children:"중첩된 프로퍼티로 탐색"}),e("td",{children:["해당 프로퍼티에 포커스된 새 ",e("code",{children:"Lens"})]})]}),e("tr",{children:[e("td",{children:e("code",{children:"get(obj)"})}),e("td",{children:"포커스된 값 추출"}),e("td",{children:"포커스된 경로의 값"})]}),e("tr",{children:[e("td",{children:e("code",{children:"set(value)"})}),e("td",{children:"업데이트 함수 생성"}),e("td",{children:"업데이트가 적용된 새 객체를 반환하는 함수"})]})]})]}),e("h3",{children:"예제"}),e(r,{language:"typescript",code:`import { lens } from 'state-ref';

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

console.log(firstItemNameLens.get(listState));  // 'Item 1'`}),e("h2",{children:"copyable"}),e("p",{children:["객체를 감싸서 불변 업데이트를 위한 편리한 ",e("code",{children:"writeCopy"})," 메서드를 제공합니다. 렌즈 탐색과 플루언트 API를 결합합니다."]}),e("h3",{children:"시그니처"}),e(r,{language:"typescript",code:`function copyable<T extends { [key: string | symbol]: unknown }>(
  origObj: T,
  lensInit?: Lens<T, any>
): Copyable<T>

type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(value: V) => Root;
}`}),e("h3",{children:"매개변수"}),e("ul",{children:[e("li",{children:[e("code",{children:"origObj: T"})," - 감쌀 객체"]}),e("li",{children:[e("code",{children:"lensInit"})," (선택) - 래퍼의 초기 렌즈"]})]}),e("h3",{children:"반환값"}),e("p",{children:["다음을 허용하는 ",e("code",{children:"Copyable"})," 프록시를 반환합니다:"]}),e("ul",{children:[e("li",{children:"프로퍼티 탐색 (일반 객체 접근처럼)"}),e("li",{children:["불변 업데이트를 생성하는 ",e("code",{children:"writeCopy(value)"})," 메서드"]})]}),e("h3",{children:"예제"}),e(r,{language:"typescript",code:`import { copyable } from 'state-ref';

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
}`}),e("h3",{children:"StateRef와 함께 사용"}),e(r,{language:"typescript",code:`import { createStore, copyable } from 'state-ref';

const watch = createStore({
  todos: [
    { id: 1, text: 'Learn StateRef', done: false },
    { id: 2, text: 'Build app', done: false }
  ]
});

const ref = watch();

// 중첩된 배열 항목을 불변하게 업데이트
ref.todos.value = copyable(ref.todos.value)[0].done.writeCopy(true);

console.log(ref.todos.value[0].done);  // true`}),e("h2",{children:"cloneDeep"}),e("p",{children:"값의 깊은 복사본을 생성합니다. 객체와 배열을 재귀적으로 복제합니다."}),e("h3",{children:"시그니처"}),e(r,{language:"typescript",code:"function cloneDeep<T>(value: T): T"}),e("h3",{children:"매개변수"}),e("ul",{children:e("li",{children:[e("code",{children:"value: T"})," - 복제할 값"]})}),e("h3",{children:"반환값"}),e("p",{children:"입력 값의 깊은 복사본을 반환합니다. 원시 타입은 그대로 반환합니다. 객체와 배열은 재귀적으로 복제된 내용으로 새 인스턴스를 생성합니다."}),e("h3",{children:"동작"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"입력 타입"}),e("th",{children:"동작"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:[e("code",{children:"null"})," / ",e("code",{children:"undefined"})]}),e("td",{children:"그대로 반환"})]}),e("tr",{children:[e("td",{children:"원시 타입 (number, string, boolean)"}),e("td",{children:"그대로 반환"})]}),e("tr",{children:[e("td",{children:"배열"}),e("td",{children:"복제된 요소로 새 배열 생성"})]}),e("tr",{children:[e("td",{children:"객체"}),e("td",{children:"복제된 프로퍼티로 새 객체 생성"})]})]})]}),e("h3",{children:"예제"}),e(r,{language:"typescript",code:`import { cloneDeep } from 'state-ref';

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
console.log(cloneDeep(null));         // null`}),e("h3",{children:"사용 사례"}),e(r,{language:"typescript",code:`import { createStore, cloneDeep } from 'state-ref';

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
ref.items.value = newItems;`}),e("h2",{children:"요약 표"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"함수"}),e("th",{children:"목적"}),e("th",{children:"원본 변경"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"lens"})}),e("td",{children:"중첩 구조 탐색 및 업데이트"}),e("td",{children:"아니오"})]}),e("tr",{children:[e("td",{children:e("code",{children:"copyable"})}),e("td",{children:"불변 업데이트를 위한 플루언트 API"}),e("td",{children:"아니오"})]}),e("tr",{children:[e("td",{children:e("code",{children:"cloneDeep"})}),e("td",{children:"값 깊은 복사"}),e("td",{children:"아니오 (복사본 생성)"})]})]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/guide/lens",children:"Lens 패턴 가이드"})," - 상세 lens 사용 가이드"]}),e("li",{children:[e("a",{href:"#/ko/guide/copyable",children:"copyable 가이드"})," - copyable 사용 가이드"]}),e("li",{children:[e("a",{href:"#/ko/guide/clone-deep",children:"cloneDeep 가이드"})," - cloneDeep 사용 가이드"]}),e("li",{children:[e("a",{href:"#/ko/api/core",children:"코어 API"})," - createStore, createComputed, combineWatch"]}),e("li",{children:[e("a",{href:"#/ko/api/types",children:"TypeScript 타입"})," - 전체 타입 정의"]})]})]})),oa=f(()=>()=>e("div",{children:[e("h1",{children:"TypeScript Types"}),e("p",{children:["This page documents the TypeScript types exported from ",e("code",{children:"state-ref"}),". These types provide full type safety when working with stores."]}),e("h2",{children:"Importing Types"}),e(r,{language:"typescript",code:`import type {
  StateRefStore,
  Watch,
  Renew,
  ManualSyncStore,
  Copyable
} from 'state-ref';`}),e("h2",{children:"Core Types"}),e("h3",{children:"StateRefStore<S>"}),e("p",{children:["The proxy type returned when calling a watch function. Provides reactive access to state via the ",e("code",{children:".value"})," property."]}),e(r,{language:"typescript",code:`type StateRefStore<S> = S extends object
  ? {
      [K in keyof S]: StateRefStore<S[K]>;
    } & {
      value: S;
    }
  : { value: S };`}),e("h4",{children:"Behavior"}),e("ul",{children:[e("li",{children:[e("strong",{children:"Object types"}),": Each property becomes a nested ",e("code",{children:"StateRefStore"}),", plus a ",e("code",{children:".value"})," property for the whole object"]}),e("li",{children:[e("strong",{children:"Primitive types"}),": Simple wrapper with only ",e("code",{children:".value"})," property"]})]}),e("h4",{children:"Example"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';
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
// countRef.value → number`}),e("h3",{children:"Watch<V>"}),e("p",{children:["The function type returned by ",e("code",{children:"createStore"}),". Used to access the store or subscribe to changes."]}),e(r,{language:"typescript",code:`type Watch<V> = (
  renew?: Renew<StateRefStore<V>>,
  userOption?: { cache?: boolean; editable?: boolean }
) => StateRefStore<V>;`}),e("h4",{children:"Parameters"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Parameter"}),e("th",{children:"Type"}),e("th",{children:"Description"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"renew"})}),e("td",{children:e("code",{children:"Renew<StateRefStore<V>>"})}),e("td",{children:"Optional callback for subscriptions"})]}),e("tr",{children:[e("td",{children:e("code",{children:"userOption.cache"})}),e("td",{children:e("code",{children:"boolean"})}),e("td",{children:"Cache proxy for same renew (default: true)"})]}),e("tr",{children:[e("td",{children:e("code",{children:"userOption.editable"})}),e("td",{children:e("code",{children:"boolean"})}),e("td",{children:"Allow modifications (default: true)"})]})]})]}),e("h4",{children:"Example"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';
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
});`}),e("h3",{children:"Renew<G>"}),e("p",{children:"The callback function type for store subscriptions."}),e(r,{language:"typescript",code:`type Renew<G> = (
  store: G,
  isFirst: boolean
) => boolean | AbortSignal | void;`}),e("h4",{children:"Parameters"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Parameter"}),e("th",{children:"Type"}),e("th",{children:"Description"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"store"})}),e("td",{children:e("code",{children:"G"})}),e("td",{children:"The StateRefStore proxy"})]}),e("tr",{children:[e("td",{children:e("code",{children:"isFirst"})}),e("td",{children:e("code",{children:"boolean"})}),e("td",{children:"True on first invocation"})]})]})]}),e("h4",{children:"Return Values"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Return Type"}),e("th",{children:"Effect"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"void"})}),e("td",{children:"Continue subscription"})]}),e("tr",{children:[e("td",{children:e("code",{children:"false"})}),e("td",{children:"Unsubscribe immediately"})]}),e("tr",{children:[e("td",{children:e("code",{children:"AbortSignal"})}),e("td",{children:"Unsubscribe when signal aborts"})]})]})]}),e("h4",{children:"Example"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';
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

watch(callback);`}),e("h3",{children:"ManualSyncStore<V>"}),e("p",{children:["The return type of ",e("code",{children:"createStoreManualSync"}),"."]}),e(r,{language:"typescript",code:`type ManualSyncStore<V> = {
  watch: Watch<V>;
  updateRef: StateRefStore<V>;
  sync: () => void;
};`}),e("h4",{children:"Properties"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Property"}),e("th",{children:"Type"}),e("th",{children:"Description"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"watch"})}),e("td",{children:e("code",{children:"Watch<V>"})}),e("td",{children:"Watch function for subscriptions"})]}),e("tr",{children:[e("td",{children:e("code",{children:"updateRef"})}),e("td",{children:e("code",{children:"StateRefStore<V>"})}),e("td",{children:"Reference for updating values"})]}),e("tr",{children:[e("td",{children:e("code",{children:"sync"})}),e("td",{children:e("code",{children:"() => void"})}),e("td",{children:"Function to trigger synchronization"})]})]})]}),e("h4",{children:"Example"}),e(r,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';
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
sync();`}),e("h2",{children:"Helper Types"}),e("h3",{children:"Copyable<T, Root>"}),e("p",{children:["The type returned by the ",e("code",{children:"copyable"})," function."]}),e(r,{language:"typescript",code:`type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(value: V) => Root;
};`}),e("h4",{children:"Example"}),e(r,{language:"typescript",code:`import { copyable } from 'state-ref';
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
const newState: State = wrapped.user.name.writeCopy('Jane');`}),e("h3",{children:"StateRefsTuple<W>"}),e("p",{children:["Utility type that converts an array of Watch types to an array of StateRefStore types. Used internally by ",e("code",{children:"createComputed"})," and ",e("code",{children:"combineWatch"}),"."]}),e(r,{language:"typescript",code:`type StateRefsTuple<W extends readonly Watch<any>[]> = {
  -readonly [K in keyof W]: W[K] extends Watch<infer T>
    ? StateRefStore<T>
    : never;
};`}),e("h4",{children:"Example"}),e(r,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';

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
);`}),e("h3",{children:"CombinedValue<W>"}),e("p",{children:["Utility type that extracts the value types from an array of Watch types. Used by ",e("code",{children:"combineWatch"})," return type."]}),e(r,{language:"typescript",code:`type CombinedValue<W extends readonly Watch<any>[]> = {
  [K in keyof W]: W[K] extends Watch<infer T> ? T : never;
};`}),e("h4",{children:"Example"}),e(r,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';

const numWatch = createStore(10);       // Watch<number>
const strWatch = createStore('hello');  // Watch<string>

// combineWatch returns Watch<CombinedValue<[Watch<number>, Watch<string>]>>
// Which equals Watch<[number, string]>
const combined = combineWatch([numWatch, strWatch]);

// The store type is StateRefStore<[number, string]>
const store = combined();`}),e("h2",{children:"Internal Types"}),e("p",{children:"These types are used internally and generally not needed for typical usage."}),e("h3",{children:"StoreType<V>"}),e(r,{language:"typescript",code:"type StoreType<V> = { root: V };"}),e("p",{children:"Internal wrapper that adds a root property to the store value."}),e("h3",{children:"Run"}),e(r,{language:"typescript",code:"type Run = null | ((isFirst?: boolean) => boolean | AbortSignal | void);"}),e("p",{children:"Internal type for subscriber functions."}),e("h3",{children:"RunInfo<A>"}),e(r,{language:"typescript",code:`type RunInfo<A> = {
  value: A;
  getNextValue: () => A;
  key: string;
  primitiveSetter?: (newValue: A) => void;
};`}),e("p",{children:"Internal type for tracking subscription information."}),e("h3",{children:"StoreRenderList<A>"}),e(r,{language:"typescript",code:`type RenderListSub<A> = Map<string, RunInfo<A>>;
type StoreRenderList<A> = Map<Run, RenderListSub<A>>;`}),e("p",{children:"Internal type for managing subscriber lists."}),e("h2",{children:"Type Summary"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"Type"}),e("th",{children:"Purpose"}),e("th",{children:"Commonly Used"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"StateRefStore<S>"})}),e("td",{children:"Proxy store type"}),e("td",{children:"Yes"})]}),e("tr",{children:[e("td",{children:e("code",{children:"Watch<V>"})}),e("td",{children:"Watch function type"}),e("td",{children:"Yes"})]}),e("tr",{children:[e("td",{children:e("code",{children:"Renew<G>"})}),e("td",{children:"Subscription callback type"}),e("td",{children:"Yes"})]}),e("tr",{children:[e("td",{children:e("code",{children:"ManualSyncStore<V>"})}),e("td",{children:"Manual sync store type"}),e("td",{children:"Yes"})]}),e("tr",{children:[e("td",{children:e("code",{children:"Copyable<T>"})}),e("td",{children:"Copyable wrapper type"}),e("td",{children:"Sometimes"})]}),e("tr",{children:[e("td",{children:e("code",{children:"StateRefsTuple<W>"})}),e("td",{children:"Utility for computed"}),e("td",{children:"Rarely"})]}),e("tr",{children:[e("td",{children:e("code",{children:"CombinedValue<W>"})}),e("td",{children:"Utility for combine"}),e("td",{children:"Rarely"})]})]})]}),e("h2",{children:"Related"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/api/core",children:"Core API"})," - createStore, createComputed, combineWatch"]}),e("li",{children:[e("a",{href:"#/api/helpers",children:"Helper API"})," - lens, copyable, cloneDeep"]}),e("li",{children:[e("a",{href:"#/guide/subscription",children:"Subscription Guide"})," - Understanding Renew callbacks"]})]})]})),ca=f(()=>()=>e("div",{children:[e("h1",{children:"TypeScript 타입"}),e("p",{children:["이 페이지는 ",e("code",{children:"state-ref"}),"에서 내보내는 TypeScript 타입들을 문서화합니다. 이 타입들은 스토어 작업 시 완전한 타입 안전성을 제공합니다."]}),e("h2",{children:"타입 가져오기"}),e(r,{language:"typescript",code:`import type {
  StateRefStore,
  Watch,
  Renew,
  ManualSyncStore,
  Copyable
} from 'state-ref';`}),e("h2",{children:"핵심 타입"}),e("h3",{children:"StateRefStore<S>"}),e("p",{children:["watch 함수를 호출할 때 반환되는 프록시 타입입니다.",e("code",{children:".value"})," 프로퍼티를 통해 상태에 대한 반응형 접근을 제공합니다."]}),e(r,{language:"typescript",code:`type StateRefStore<S> = S extends object
  ? {
      [K in keyof S]: StateRefStore<S[K]>;
    } & {
      value: S;
    }
  : { value: S };`}),e("h4",{children:"동작"}),e("ul",{children:[e("li",{children:[e("strong",{children:"객체 타입"}),": 각 프로퍼티가 중첩된 ",e("code",{children:"StateRefStore"}),"가 되고, 전체 객체를 위한 ",e("code",{children:".value"})," 프로퍼티가 추가됨"]}),e("li",{children:[e("strong",{children:"원시 타입"}),": ",e("code",{children:".value"})," 프로퍼티만 있는 간단한 래퍼"]})]}),e("h4",{children:"예제"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';
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
// countRef.value → number`}),e("h3",{children:"Watch<V>"}),e("p",{children:[e("code",{children:"createStore"}),"가 반환하는 함수 타입입니다. 스토어에 접근하거나 변경을 구독하는 데 사용됩니다."]}),e(r,{language:"typescript",code:`type Watch<V> = (
  renew?: Renew<StateRefStore<V>>,
  userOption?: { cache?: boolean; editable?: boolean }
) => StateRefStore<V>;`}),e("h4",{children:"매개변수"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"매개변수"}),e("th",{children:"타입"}),e("th",{children:"설명"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"renew"})}),e("td",{children:e("code",{children:"Renew<StateRefStore<V>>"})}),e("td",{children:"구독을 위한 선택적 콜백"})]}),e("tr",{children:[e("td",{children:e("code",{children:"userOption.cache"})}),e("td",{children:e("code",{children:"boolean"})}),e("td",{children:"동일한 renew에 대해 프록시 캐시 (기본값: true)"})]}),e("tr",{children:[e("td",{children:e("code",{children:"userOption.editable"})}),e("td",{children:e("code",{children:"boolean"})}),e("td",{children:"수정 허용 (기본값: true)"})]})]})]}),e("h4",{children:"예제"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';
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
});`}),e("h3",{children:"Renew<G>"}),e("p",{children:"스토어 구독을 위한 콜백 함수 타입입니다."}),e(r,{language:"typescript",code:`type Renew<G> = (
  store: G,
  isFirst: boolean
) => boolean | AbortSignal | void;`}),e("h4",{children:"매개변수"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"매개변수"}),e("th",{children:"타입"}),e("th",{children:"설명"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"store"})}),e("td",{children:e("code",{children:"G"})}),e("td",{children:"StateRefStore 프록시"})]}),e("tr",{children:[e("td",{children:e("code",{children:"isFirst"})}),e("td",{children:e("code",{children:"boolean"})}),e("td",{children:"첫 번째 호출 시 true"})]})]})]}),e("h4",{children:"반환값"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"반환 타입"}),e("th",{children:"효과"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"void"})}),e("td",{children:"구독 계속"})]}),e("tr",{children:[e("td",{children:e("code",{children:"false"})}),e("td",{children:"즉시 구독 취소"})]}),e("tr",{children:[e("td",{children:e("code",{children:"AbortSignal"})}),e("td",{children:"시그널 abort 시 구독 취소"})]})]})]}),e("h4",{children:"예제"}),e(r,{language:"typescript",code:`import { createStore } from 'state-ref';
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

watch(callback);`}),e("h3",{children:"ManualSyncStore<V>"}),e("p",{children:[e("code",{children:"createStoreManualSync"}),"의 반환 타입입니다."]}),e(r,{language:"typescript",code:`type ManualSyncStore<V> = {
  watch: Watch<V>;
  updateRef: StateRefStore<V>;
  sync: () => void;
};`}),e("h4",{children:"프로퍼티"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"프로퍼티"}),e("th",{children:"타입"}),e("th",{children:"설명"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"watch"})}),e("td",{children:e("code",{children:"Watch<V>"})}),e("td",{children:"구독을 위한 watch 함수"})]}),e("tr",{children:[e("td",{children:e("code",{children:"updateRef"})}),e("td",{children:e("code",{children:"StateRefStore<V>"})}),e("td",{children:"값 업데이트를 위한 참조"})]}),e("tr",{children:[e("td",{children:e("code",{children:"sync"})}),e("td",{children:e("code",{children:"() => void"})}),e("td",{children:"동기화를 트리거하는 함수"})]})]})]}),e("h4",{children:"예제"}),e(r,{language:"typescript",code:`import { createStoreManualSync } from 'state-ref';
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
sync();`}),e("h2",{children:"헬퍼 타입"}),e("h3",{children:"Copyable<T, Root>"}),e("p",{children:[e("code",{children:"copyable"})," 함수가 반환하는 타입입니다."]}),e(r,{language:"typescript",code:`type Copyable<T, Root = T> = {
  [K in keyof T]: Copyable<T[K], Root>;
} & {
  writeCopy: <V = T>(value: V) => Root;
};`}),e("h4",{children:"예제"}),e(r,{language:"typescript",code:`import { copyable } from 'state-ref';
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
const newState: State = wrapped.user.name.writeCopy('Jane');`}),e("h3",{children:"StateRefsTuple<W>"}),e("p",{children:["Watch 타입 배열을 StateRefStore 타입 배열로 변환하는 유틸리티 타입입니다.",e("code",{children:"createComputed"}),"와 ",e("code",{children:"combineWatch"}),"에서 내부적으로 사용됩니다."]}),e(r,{language:"typescript",code:`type StateRefsTuple<W extends readonly Watch<any>[]> = {
  -readonly [K in keyof W]: W[K] extends Watch<infer T>
    ? StateRefStore<T>
    : never;
};`}),e("h4",{children:"예제"}),e(r,{language:"typescript",code:`import { createStore, createComputed } from 'state-ref';

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
);`}),e("h3",{children:"CombinedValue<W>"}),e("p",{children:["Watch 타입 배열에서 값 타입을 추출하는 유틸리티 타입입니다.",e("code",{children:"combineWatch"})," 반환 타입에서 사용됩니다."]}),e(r,{language:"typescript",code:`type CombinedValue<W extends readonly Watch<any>[]> = {
  [K in keyof W]: W[K] extends Watch<infer T> ? T : never;
};`}),e("h4",{children:"예제"}),e(r,{language:"typescript",code:`import { createStore, combineWatch } from 'state-ref';

const numWatch = createStore(10);       // Watch<number>
const strWatch = createStore('hello');  // Watch<string>

// combineWatch는 Watch<CombinedValue<[Watch<number>, Watch<string>]>> 반환
// 이는 Watch<[number, string]>와 같음
const combined = combineWatch([numWatch, strWatch]);

// 스토어 타입은 StateRefStore<[number, string]>
const store = combined();`}),e("h2",{children:"내부 타입"}),e("p",{children:"이 타입들은 내부적으로 사용되며 일반적인 사용에는 필요하지 않습니다."}),e("h3",{children:"StoreType<V>"}),e(r,{language:"typescript",code:"type StoreType<V> = { root: V };"}),e("p",{children:"스토어 값에 root 프로퍼티를 추가하는 내부 래퍼입니다."}),e("h3",{children:"Run"}),e(r,{language:"typescript",code:"type Run = null | ((isFirst?: boolean) => boolean | AbortSignal | void);"}),e("p",{children:"구독자 함수를 위한 내부 타입입니다."}),e("h3",{children:"RunInfo<A>"}),e(r,{language:"typescript",code:`type RunInfo<A> = {
  value: A;
  getNextValue: () => A;
  key: string;
  primitiveSetter?: (newValue: A) => void;
};`}),e("p",{children:"구독 정보를 추적하기 위한 내부 타입입니다."}),e("h3",{children:"StoreRenderList<A>"}),e(r,{language:"typescript",code:`type RenderListSub<A> = Map<string, RunInfo<A>>;
type StoreRenderList<A> = Map<Run, RenderListSub<A>>;`}),e("p",{children:"구독자 목록을 관리하기 위한 내부 타입입니다."}),e("h2",{children:"타입 요약"}),e("table",{children:[e("thead",{children:e("tr",{children:[e("th",{children:"타입"}),e("th",{children:"목적"}),e("th",{children:"자주 사용"})]})}),e("tbody",{children:[e("tr",{children:[e("td",{children:e("code",{children:"StateRefStore<S>"})}),e("td",{children:"프록시 스토어 타입"}),e("td",{children:"예"})]}),e("tr",{children:[e("td",{children:e("code",{children:"Watch<V>"})}),e("td",{children:"Watch 함수 타입"}),e("td",{children:"예"})]}),e("tr",{children:[e("td",{children:e("code",{children:"Renew<G>"})}),e("td",{children:"구독 콜백 타입"}),e("td",{children:"예"})]}),e("tr",{children:[e("td",{children:e("code",{children:"ManualSyncStore<V>"})}),e("td",{children:"수동 동기화 스토어 타입"}),e("td",{children:"예"})]}),e("tr",{children:[e("td",{children:e("code",{children:"Copyable<T>"})}),e("td",{children:"Copyable 래퍼 타입"}),e("td",{children:"가끔"})]}),e("tr",{children:[e("td",{children:e("code",{children:"StateRefsTuple<W>"})}),e("td",{children:"computed용 유틸리티"}),e("td",{children:"드물게"})]}),e("tr",{children:[e("td",{children:e("code",{children:"CombinedValue<W>"})}),e("td",{children:"combine용 유틸리티"}),e("td",{children:"드물게"})]})]})]}),e("h2",{children:"관련 문서"}),e("ul",{children:[e("li",{children:[e("a",{href:"#/ko/api/core",children:"코어 API"})," - createStore, createComputed, combineWatch"]}),e("li",{children:[e("a",{href:"#/ko/api/helpers",children:"헬퍼 API"})," - lens, copyable, cloneDeep"]}),e("li",{children:[e("a",{href:"#/ko/guide/subscription",children:"구독 가이드"})," - Renew 콜백 이해하기"]})]})]})),aa=()=>e("div",{class:"prose prose-lg dark:prose-invert max-w-none",children:[e("h1",{class:"text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white mb-6",children:"AI Agent Skills"}),e("p",{class:"text-lg text-gray-600 dark:text-gray-400 mb-8",children:"Help AI coding assistants write state-ref-style reactive code automatically"}),e("div",{class:"bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 mb-8",children:[e("h3",{class:"text-lg font-medium text-purple-900 dark:text-purple-200 mb-2",children:"Experimental by Design"}),e("p",{class:"text-sm text-purple-800 dark:text-purple-300",children:"This specification explores how state-ref can be applied as a first-class behavioral constraint for AI coding agents."})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"What is AI Agent Skills?"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"state-ref includes an AI agent skills package that helps AI coding assistants (Claude Code, GitHub Copilot, Cursor, etc.) automatically write state-ref-style reactive code."}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"When you have this skills package in your project, AI assistants will:"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:["Use ",e("code",{class:"text-sm",children:"createStore"})," for reactive state management"]}),e("li",{children:["Access values via ",e("code",{class:"text-sm",children:".value"})," property correctly"]}),e("li",{children:["Use ",e("code",{class:"text-sm",children:"watch(callback)"})," for subscriptions with proper dependency tracking"]}),e("li",{children:["Handle ",e("code",{class:"text-sm",children:"AbortController"})," for cleanup"]}),e("li",{children:["Use framework connectors (",e("code",{class:"text-sm",children:"connectReact"}),", ",e("code",{class:"text-sm",children:"connectVue"}),", etc.) appropriately"]}),e("li",{children:["Apply ",e("code",{class:"text-sm",children:"createStoreManualSync"})," for Flux-like patterns"]})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Setup for Claude Code"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["Copy the skills folder to your project's ",e("code",{class:"text-sm",children:".claude/skills/"})," directory:"]}),e(r,{language:"bash",code:`# Unix/macOS/Linux
mkdir -p .claude/skills/state-ref
cp -R node_modules/state-ref/dist/skills/state-ref/* .claude/skills/state-ref/

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path .claude/skills/state-ref
Copy-Item node_modules/state-ref/dist/skills/state-ref/* .claude/skills/state-ref -Recurse

# Or manually create the directory and copy
mkdir -p .claude/skills/state-ref
cp -R node_modules/state-ref/dist/skills/state-ref/* .claude/skills/state-ref/`}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["If your tool expects a single file, point it to ",e("code",{class:"text-sm",children:".claude/skills/state-ref/SKILL.md"})," or link that file to ",e("code",{class:"text-sm",children:".claude/skills/state-ref.md"}),"."]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Setup for Codex"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["Copy the Codex skill to your project's ",e("code",{class:"text-sm",children:"$CODEX_HOME/skills/"})," directory (default: ",e("code",{class:"text-sm",children:"~/.codex/skills"}),"):"]}),e(r,{language:"bash",code:`# Unix/macOS/Linux
mkdir -p ~/.codex/skills/state-ref
cp -R node_modules/state-ref/dist/skills/state-ref/* ~/.codex/skills/state-ref/

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$HOME/.codex/skills/state-ref"
Copy-Item node_modules/state-ref/dist/skills/state-ref/* $HOME/.codex/skills/state-ref -Recurse`}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Recommended: Add CLAUDE.md to Your Project"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["For better reliability, create a ",e("code",{class:"text-sm",children:"CLAUDE.md"})," file in your project root. This ensures AI agents read the state-ref skills package before writing code."]}),e(r,{language:"bash",code:`# Project Instructions for AI Agents

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

**This is not optional - violating these patterns will break the codebase.**`}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6 mt-6",children:["Place this file as ",e("code",{class:"text-sm",children:"CLAUDE.md"})," in your project root. Claude Code will automatically read this file at the start of every conversation."]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"How It Works"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"Once configured, AI assistants will automatically apply state-ref coding patterns when helping you write code."}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8",children:"Example: Before Skills File"}),e(r,{language:"typescript",code:`// AI might suggest manual state management
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
}`}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8",children:"Example: After Skills File"}),e(r,{language:"typescript",code:`// AI suggests state-ref reactive style
import { createStore } from 'state-ref';

const watch = createStore({ count: 0 });

// Subscribe to changes
watch((ref, isFirst) => {
  console.log('Count:', ref.count.value);
});

// Update state
const ref = watch();
ref.count.value = 10;`}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Skills File Location"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["The skills package is located at ",e("code",{class:"text-sm",children:"node_modules/state-ref/dist/skills/state-ref/"})," after installation (includes ",e("code",{class:"text-sm",children:"SKILL.md"}),", ",e("code",{class:"text-sm",children:"examples/"}),", ",e("code",{class:"text-sm",children:"reference/"}),", and ",e("code",{class:"text-sm",children:"constraints/"}),")."]}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["You can also view it in the"," ",e("a",{href:"https://github.com/superlucky84/state-ref/blob/main/skills/state-ref/SKILL.md",target:"_blank",rel:"noopener noreferrer",class:"text-blue-600 dark:text-blue-400 hover:underline",children:"GitHub repository"}),"."]}),e("div",{class:"bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mt-6",children:e("p",{class:"text-sm md:text-base text-blue-900 dark:text-blue-200 leading-relaxed",children:[e("span",{class:"font-medium",children:"Tip:"}),' After setting up the skills package, you can ask your AI assistant questions like "refactor this to use state-ref" or "add reactive state management", and it will automatically apply the patterns.']})})]}),ia=()=>e("div",{class:"prose prose-lg dark:prose-invert max-w-none",children:[e("h1",{class:"text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white mb-6",children:"AI Agent Skills"}),e("p",{class:"text-lg text-gray-600 dark:text-gray-400 mb-8",children:"AI 코딩 어시스턴트가 state-ref 스타일의 반응형 코드를 자동으로 작성하도록 도와줍니다"}),e("div",{class:"bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 mb-8",children:[e("h3",{class:"text-lg font-medium text-purple-900 dark:text-purple-200 mb-2",children:"실험적 기능"}),e("p",{class:"text-sm text-purple-800 dark:text-purple-300",children:"이 스펙은 state-ref가 AI 코딩 에이전트의 일급 행동 제약으로 어떻게 적용될 수 있는지 탐구합니다."})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"AI Agent Skills란?"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"state-ref에는 AI 코딩 어시스턴트(Claude Code, GitHub Copilot, Cursor 등)가 자동으로 state-ref 스타일의 반응형 코드를 작성하도록 돕는 AI 에이전트 스킬 패키지가 포함되어 있습니다."}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"프로젝트에 이 스킬 패키지가 있으면, AI 어시스턴트는 다음을 수행합니다:"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:["반응형 상태 관리를 위해 ",e("code",{class:"text-sm",children:"createStore"})," 사용"]}),e("li",{children:[e("code",{class:"text-sm",children:".value"})," 속성을 통해 값에 올바르게 접근"]}),e("li",{children:["적절한 의존성 추적과 함께 ",e("code",{class:"text-sm",children:"watch(callback)"}),"을 사용한 구독"]}),e("li",{children:["정리를 위한 ",e("code",{class:"text-sm",children:"AbortController"})," 처리"]}),e("li",{children:["프레임워크 커넥터(",e("code",{class:"text-sm",children:"connectReact"}),", ",e("code",{class:"text-sm",children:"connectVue"})," 등)를 적절히 사용"]}),e("li",{children:["Flux 패턴을 위한 ",e("code",{class:"text-sm",children:"createStoreManualSync"})," 적용"]})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Claude Code 설정"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["skills 폴더를 프로젝트의 ",e("code",{class:"text-sm",children:".claude/skills/"})," 디렉토리에 복사하세요:"]}),e(r,{language:"bash",code:`# Unix/macOS/Linux
mkdir -p .claude/skills/state-ref
cp -R node_modules/state-ref/dist/skills/state-ref/* .claude/skills/state-ref/

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path .claude/skills/state-ref
Copy-Item node_modules/state-ref/dist/skills/state-ref/* .claude/skills/state-ref -Recurse

# 또는 수동으로 디렉토리를 만들고 복사
mkdir -p .claude/skills/state-ref
cp -R node_modules/state-ref/dist/skills/state-ref/* .claude/skills/state-ref/`}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["도구가 단일 파일을 기대하는 경우, ",e("code",{class:"text-sm",children:".claude/skills/state-ref/SKILL.md"}),"를 가리키거나 해당 파일을 ",e("code",{class:"text-sm",children:".claude/skills/state-ref.md"}),"로 링크하세요."]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Codex 설정"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["Codex 스킬을 프로젝트의 ",e("code",{class:"text-sm",children:"$CODEX_HOME/skills/"})," 디렉토리(기본값: ",e("code",{class:"text-sm",children:"~/.codex/skills"}),")에 복사하세요:"]}),e(r,{language:"bash",code:`# Unix/macOS/Linux
mkdir -p ~/.codex/skills/state-ref
cp -R node_modules/state-ref/dist/skills/state-ref/* ~/.codex/skills/state-ref/

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$HOME/.codex/skills/state-ref"
Copy-Item node_modules/state-ref/dist/skills/state-ref/* $HOME/.codex/skills/state-ref -Recurse`}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"권장: 프로젝트에 CLAUDE.md 추가"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["더 나은 신뢰성을 위해 프로젝트 루트에 ",e("code",{class:"text-sm",children:"CLAUDE.md"})," 파일을 생성하세요. 이렇게 하면 AI 에이전트가 코드를 작성하기 전에 state-ref 스킬 패키지를 읽게 됩니다."]}),e(r,{language:"bash",code:`# AI 에이전트를 위한 프로젝트 지침

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

**이것은 선택사항이 아닙니다 - 이 패턴을 위반하면 코드베이스가 손상됩니다.**`}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6 mt-6",children:["이 파일을 프로젝트 루트에 ",e("code",{class:"text-sm",children:"CLAUDE.md"}),"로 배치하세요. Claude Code는 모든 대화 시작 시 자동으로 이 파일을 읽습니다."]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"작동 방식"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"설정이 완료되면, AI 어시스턴트는 코드 작성을 도울 때 자동으로 state-ref 코딩 패턴을 적용합니다."}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8",children:"예제: Skills 파일 적용 전"}),e(r,{language:"typescript",code:`// AI가 수동 상태 관리를 제안할 수 있음
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
}`}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8",children:"예제: Skills 파일 적용 후"}),e(r,{language:"typescript",code:`// AI가 state-ref 반응형 스타일을 제안
import { createStore } from 'state-ref';

const watch = createStore({ count: 0 });

// 변경 사항 구독
watch((ref, isFirst) => {
  console.log('Count:', ref.count.value);
});

// 상태 업데이트
const ref = watch();
ref.count.value = 10;`}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Skills 파일 위치"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["스킬 패키지는 설치 후 ",e("code",{class:"text-sm",children:"node_modules/state-ref/dist/skills/state-ref/"}),"에 위치합니다 (",e("code",{class:"text-sm",children:"SKILL.md"}),", ",e("code",{class:"text-sm",children:"examples/"}),", ",e("code",{class:"text-sm",children:"reference/"}),", ",e("code",{class:"text-sm",children:"constraints/"})," 포함)."]}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:[" ",e("a",{href:"https://github.com/superlucky84/state-ref/blob/main/skills/state-ref/SKILL.md",target:"_blank",rel:"noopener noreferrer",class:"text-blue-600 dark:text-blue-400 hover:underline",children:"GitHub 저장소"}),"에서도 확인할 수 있습니다."]}),e("div",{class:"bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mt-6",children:e("p",{class:"text-sm md:text-base text-blue-900 dark:text-blue-200 leading-relaxed",children:[e("span",{class:"font-medium",children:"팁:"}),' 스킬 패키지를 설정한 후, AI 어시스턴트에게 "state-ref를 사용하여 리팩토링해줘" 또는 "반응형 상태 관리를 추가해줘"와 같은 질문을 하면 자동으로 패턴이 적용됩니다.']})})]}),la=`You are a coding agent with state-ref reactive state management guidance enabled.

ACTIVATION CONDITIONS:

These guidelines apply ONLY when state-ref is installed in the current project.

Before suggesting state-ref patterns, verify state-ref availability:
1. Check if \`package.json\` contains state-ref in dependencies or devDependencies
2. Check if \`node_modules/state-ref\` directory exists
3. Check if state-ref imports are present in existing code

If state-ref is NOT installed:
- Do not enforce these guidelines
- Use standard state management practices appropriate for the project
- Never suggest installing state-ref unless explicitly requested

If state-ref IS installed:
- Apply all guidelines below
- Suggest state-ref alternatives for complex state management
- Prioritize fine-grained reactivity patterns for clarity and performance

CODING GUIDELINES:

1. STORE CREATION
   - Use \`createStore<T>(initialValue)\` for auto-sync mode (default)
   - Use \`createStoreManualSync<T>(initialValue)\` for Flux-like patterns
   - Always specify generic type for complex objects
   - Primitive types (number, string) work directly

2. VALUE ACCESS
   - Always access values via \`.value\` property
   - \`stateRef.user.name\` returns proxy, not the actual value
   - \`stateRef.user.name.value\` returns the actual value
   - Assignments must also use \`.value\`: \`ref.count.value = 10\`

3. SUBSCRIPTION PATTERNS
   - Use \`watch(callback)\` to subscribe to changes
   - Callback signature: \`(stateRef, isFirst) => AbortSignal | void\`
   - \`isFirst\` is true on initial run, false on subsequent updates
   - Only \`.value\` reads inside callback are tracked as dependencies
   - Return \`AbortController.signal\` for cleanup/unsubscription

4. DEPENDENCY TRACKING
   - Use the callback's ref parameter (innerRef), not external refs
   - External refs created by \`watch()\` without callback are NOT tracked
   - Both innerRef (callback arg) and outerRef (return value) are same reference
   - Changes to non-tracked properties don't trigger re-runs

5. MANUAL SYNC MODE (FLUX-LIKE)
   - Destructure: \`const { watch, updateRef, sync } = createStoreManualSync(...)\`
   - \`watch\` refs are read-only in this mode
   - Modify state only via \`updateRef\`
   - Call \`sync()\` to notify all subscribers
   - Create action functions that encapsulate updateRef + sync

6. FRAMEWORK INTEGRATION
   - React/Preact: \`const useStore = connectReact(watch)\`
   - Vue: \`const useStore = connectVue(watch)\`
   - Svelte: \`const store = connectSvelte(watch)\`
   - Solid: \`const useStore = connectSolid(watch)\`
   - Lithent: Use \`watch(renew)\` directly

IMPORT PATHS:
- Core: \`import { createStore, createStoreManualSync, combineWatch, createComputed } from 'state-ref'\`
- Helpers: \`import { lens, copyable, cloneDeep } from 'state-ref'\`
- React: \`import { connectReact } from '@stateref/connect-react'\`
- Preact: \`import { connectPreact } from '@stateref/connect-preact'\`
- Vue: \`import { connectVue } from '@stateref/connect-vue'\`
- Svelte: \`import { connectSvelte } from '@stateref/connect-svelte'\`
- Solid: \`import { connectSolid } from '@stateref/connect-solid'\`

GUIDANCE APPROACH:
When user requests could benefit from state-ref patterns:
1. Provide solution using state-ref patterns
2. Explain advantages of the reactive approach
3. If user prefers other state management, respect their choice

REFERENCE MATERIALS (NOT PART OF BEHAVIORAL RULES):

For detailed guidance on state-ref patterns and usage, refer to:
node_modules/state-ref/dist/skills/state-ref/

This reference material provides comprehensive examples, troubleshooting tips,
and pattern guidance that complements the behavioral guidelines above.`,sa=()=>e("div",{class:"prose prose-lg dark:prose-invert max-w-none",children:[e("h1",{class:"text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white mb-6",children:"AI Agent Role Add-on"}),e("p",{class:"text-lg text-gray-600 dark:text-gray-400 mb-8",children:"A reusable behavior module that conditionally guides state-ref patterns in AI coding agents"}),e("div",{class:"bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 mb-8",children:[e("h3",{class:"text-lg font-medium text-purple-900 dark:text-purple-200 mb-2",children:"Experimental by Design"}),e("p",{class:"text-sm text-purple-800 dark:text-purple-300",children:"This specification explores how state-ref can be applied as a first-class behavioral constraint for AI coding agents."})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"What is Agent Role Add-on?"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"The state-ref Agent Role Add-on is a copy-paste ready behavior extension for AI coding agents (OpenCode, custom agents, IDE extensions, etc.). Unlike skills packages that are project-specific, this add-on is attached directly to your agent's system prompt, making it work across all your projects."}),e("div",{class:"bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-6",children:e("p",{class:"text-sm md:text-base text-blue-900 dark:text-blue-200 leading-relaxed",children:[e("span",{class:"font-medium",children:"Key Difference:"})," Skills files are per-project configurations. Agent add-ons are global agent behaviors that activate conditionally based on project context."]})}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8",children:"Key Features"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:[e("strong",{children:"Conditional Activation:"})," Only suggests state-ref patterns when state-ref is detected in the project"]}),e("li",{children:[e("strong",{children:"Auto-Detection:"})," Checks ",e("code",{class:"text-sm",children:"package.json"}),", ",e("code",{class:"text-sm",children:"node_modules"}),", and existing imports"]}),e("li",{children:[e("strong",{children:"Respects Non-state-ref Projects:"})," Uses standard coding practices when state-ref isn't installed"]}),e("li",{children:[e("strong",{children:"Single Configuration:"})," Works across multiple projects with different technology stacks"]}),e("li",{children:[e("strong",{children:"Copy-Paste Ready:"})," No complex setup, just paste into your agent's system prompt"]})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"When to Use This Add-on"}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"Use When:"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:"You work across multiple projects, some using state-ref and others not"}),e("li",{children:"You want automatic pattern guidance when state-ref is detected"}),e("li",{children:"Your team adopts state-ref selectively per project"}),e("li",{children:"You need a single agent configuration that adapts to project context"})]}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"Don't Use When:"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:"You exclusively work on projects that never use state-ref"}),e("li",{children:"You prefer manual control over when to apply reactive patterns"}),e("li",{children:"Your agent configuration is project-specific rather than global"})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"How to Attach This Add-on"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"Copy the behavioral constraints block below and paste it into your AI agent's system prompt or configuration."}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"Copy This Block"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4",children:"Copy the entire add-on configuration below:"}),e(r,{language:"bash",code:la}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Integration Examples"}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"OpenCode (.opencode/config.yaml)"}),e(r,{language:"bash",code:`agent:
  role: "Your Agent Role"
  extensions:
    - type: "state-ref-addon"
      content: |
        [Paste the state-ref constraints block here]`}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"Custom Agent System Prompt"}),e(r,{language:"bash",code:`<your-existing-agent-role>
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
</your-existing-agent-role>`}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"How It Works"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"The add-on uses conditional logic to adapt its behavior based on the project context:"}),e("div",{class:"space-y-6 mb-6",children:[e("div",{class:"bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800",children:[e("h4",{class:"text-lg font-medium text-green-900 dark:text-green-200 mb-2",children:"When state-ref is installed"}),e("p",{class:"text-sm text-green-800 dark:text-green-300",children:"The agent suggests state-ref patterns, explains benefits of reactive approaches, and respects user preferences while prioritizing fine-grained reactivity for clarity."})]}),e("div",{class:"bg-gray-50 dark:bg-gray-800/20 p-6 rounded-lg border border-gray-200 dark:border-gray-700",children:[e("h4",{class:"text-lg font-medium text-gray-900 dark:text-gray-200 mb-2",children:"When state-ref is NOT installed"}),e("p",{class:"text-sm text-gray-700 dark:text-gray-400",children:"The agent uses standard coding practices appropriate for the project, never mentions state-ref, and respects existing conventions."})]})]}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8",children:"Detection Mechanism"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4",children:"The agent verifies state-ref availability through:"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:[e("code",{class:"text-sm",children:"package.json"})," dependency declarations (most reliable)"]}),e("li",{children:[e("code",{class:"text-sm",children:"node_modules"})," directory presence (installation confirmation)"]}),e("li",{children:"Existing import statements (usage confirmation)"})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Full Documentation"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["The complete add-on documentation is available at ",e("code",{class:"text-sm",children:"node_modules/state-ref/dist/ai-addons/state-ref-agent-addon.md"})," after installation."]}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["You can also view it in the"," ",e("a",{href:"https://github.com/superlucky84/state-ref/blob/main/state-ref-agent-addon.md",target:"_blank",rel:"noopener noreferrer",class:"text-blue-600 dark:text-blue-400 hover:underline",children:"GitHub repository"}),"."]}),e("div",{class:"bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 mt-6",children:e("p",{class:"text-sm md:text-base text-yellow-900 dark:text-yellow-200 leading-relaxed",children:[e("span",{class:"font-medium",children:"Important:"})," This add-on is designed for agents with system prompt support. For project-specific AI assistance (like Claude Code's skills), use the ",e("a",{href:"#/ai-agent-skills",class:"text-yellow-700 dark:text-yellow-300 hover:underline",children:"AI Agent Skills"})," file instead."]})})]}),da=`You are a coding agent with state-ref reactive state management guidance enabled.

ACTIVATION CONDITIONS:

These guidelines apply ONLY when state-ref is installed in the current project.

Before suggesting state-ref patterns, verify state-ref availability:
1. Check if \`package.json\` contains state-ref in dependencies or devDependencies
2. Check if \`node_modules/state-ref\` directory exists
3. Check if state-ref imports are present in existing code

If state-ref is NOT installed:
- Do not enforce these guidelines
- Use standard state management practices appropriate for the project
- Never suggest installing state-ref unless explicitly requested

If state-ref IS installed:
- Apply all guidelines below
- Suggest state-ref alternatives for complex state management
- Prioritize fine-grained reactivity patterns for clarity and performance

CODING GUIDELINES:

1. STORE CREATION
   - Use \`createStore<T>(initialValue)\` for auto-sync mode (default)
   - Use \`createStoreManualSync<T>(initialValue)\` for Flux-like patterns
   - Always specify generic type for complex objects
   - Primitive types (number, string) work directly

2. VALUE ACCESS
   - Always access values via \`.value\` property
   - \`stateRef.user.name\` returns proxy, not the actual value
   - \`stateRef.user.name.value\` returns the actual value
   - Assignments must also use \`.value\`: \`ref.count.value = 10\`

3. SUBSCRIPTION PATTERNS
   - Use \`watch(callback)\` to subscribe to changes
   - Callback signature: \`(stateRef, isFirst) => AbortSignal | void\`
   - \`isFirst\` is true on initial run, false on subsequent updates
   - Only \`.value\` reads inside callback are tracked as dependencies
   - Return \`AbortController.signal\` for cleanup/unsubscription

4. DEPENDENCY TRACKING
   - Use the callback's ref parameter (innerRef), not external refs
   - External refs created by \`watch()\` without callback are NOT tracked
   - Both innerRef (callback arg) and outerRef (return value) are same reference
   - Changes to non-tracked properties don't trigger re-runs

5. MANUAL SYNC MODE (FLUX-LIKE)
   - Destructure: \`const { watch, updateRef, sync } = createStoreManualSync(...)\`
   - \`watch\` refs are read-only in this mode
   - Modify state only via \`updateRef\`
   - Call \`sync()\` to notify all subscribers
   - Create action functions that encapsulate updateRef + sync

6. FRAMEWORK INTEGRATION
   - React/Preact: \`const useStore = connectReact(watch)\`
   - Vue: \`const useStore = connectVue(watch)\`
   - Svelte: \`const store = connectSvelte(watch)\`
   - Solid: \`const useStore = connectSolid(watch)\`
   - Lithent: Use \`watch(renew)\` directly

IMPORT PATHS:
- Core: \`import { createStore, createStoreManualSync, combineWatch, createComputed } from 'state-ref'\`
- Helpers: \`import { lens, copyable, cloneDeep } from 'state-ref'\`
- React: \`import { connectReact } from '@stateref/connect-react'\`
- Preact: \`import { connectPreact } from '@stateref/connect-preact'\`
- Vue: \`import { connectVue } from '@stateref/connect-vue'\`
- Svelte: \`import { connectSvelte } from '@stateref/connect-svelte'\`
- Solid: \`import { connectSolid } from '@stateref/connect-solid'\`

GUIDANCE APPROACH:
When user requests could benefit from state-ref patterns:
1. Provide solution using state-ref patterns
2. Explain advantages of the reactive approach
3. If user prefers other state management, respect their choice

REFERENCE MATERIALS (NOT PART OF BEHAVIORAL RULES):

For detailed guidance on state-ref patterns and usage, refer to:
node_modules/state-ref/dist/skills/state-ref/

This reference material provides comprehensive examples, troubleshooting tips,
and pattern guidance that complements the behavioral guidelines above.`,ha=()=>e("div",{class:"prose prose-lg dark:prose-invert max-w-none",children:[e("h1",{class:"text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white mb-6",children:"AI Agent Role Add-on"}),e("p",{class:"text-lg text-gray-600 dark:text-gray-400 mb-8",children:"AI 코딩 에이전트에서 state-ref 패턴을 조건부로 가이드하는 재사용 가능한 행동 모듈"}),e("div",{class:"bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 mb-8",children:[e("h3",{class:"text-lg font-medium text-purple-900 dark:text-purple-200 mb-2",children:"실험적 기능"}),e("p",{class:"text-sm text-purple-800 dark:text-purple-300",children:"이 스펙은 state-ref가 AI 코딩 에이전트의 일급 행동 제약으로 어떻게 적용될 수 있는지 탐구합니다."})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"Agent Role Add-on이란?"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"state-ref Agent Role Add-on은 AI 코딩 에이전트(OpenCode, 커스텀 에이전트, IDE 확장 등)를 위한 복사-붙여넣기 준비된 행동 확장입니다. 프로젝트별 스킬 패키지와 달리, 이 add-on은 에이전트의 시스템 프롬프트에 직접 첨부되어 모든 프로젝트에서 작동합니다."}),e("div",{class:"bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-6",children:e("p",{class:"text-sm md:text-base text-blue-900 dark:text-blue-200 leading-relaxed",children:[e("span",{class:"font-medium",children:"주요 차이점:"})," Skills 파일은 프로젝트별 구성입니다. Agent add-on은 프로젝트 컨텍스트에 따라 조건부로 활성화되는 글로벌 에이전트 행동입니다."]})}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8",children:"주요 기능"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:[e("strong",{children:"조건부 활성화:"})," 프로젝트에서 state-ref가 감지된 경우에만 state-ref 패턴을 제안"]}),e("li",{children:[e("strong",{children:"자동 감지:"})," ",e("code",{class:"text-sm",children:"package.json"}),", ",e("code",{class:"text-sm",children:"node_modules"}),", 기존 import 확인"]}),e("li",{children:[e("strong",{children:"비 state-ref 프로젝트 존중:"})," state-ref가 설치되지 않은 경우 표준 코딩 관행 사용"]}),e("li",{children:[e("strong",{children:"단일 구성:"})," 다양한 기술 스택을 가진 여러 프로젝트에서 작동"]}),e("li",{children:[e("strong",{children:"복사-붙여넣기 준비:"})," 복잡한 설정 없이 에이전트의 시스템 프롬프트에 붙여넣기만 하면 됨"]})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"이 Add-on을 사용해야 할 때"}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"사용해야 할 때:"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:"state-ref를 사용하는 프로젝트와 사용하지 않는 프로젝트를 오가며 작업할 때"}),e("li",{children:"state-ref가 감지되면 자동으로 패턴 가이드를 원할 때"}),e("li",{children:"팀이 프로젝트별로 선택적으로 state-ref를 채택할 때"}),e("li",{children:"프로젝트 컨텍스트에 맞게 적응하는 단일 에이전트 구성이 필요할 때"})]}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"사용하지 말아야 할 때:"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:"state-ref를 절대 사용하지 않는 프로젝트에서만 작업할 때"}),e("li",{children:"반응형 패턴을 적용할 시점을 수동으로 제어하길 원할 때"}),e("li",{children:"에이전트 구성이 글로벌이 아닌 프로젝트별일 때"})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"이 Add-on 첨부 방법"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"아래의 행동 제약 블록을 복사하여 AI 에이전트의 시스템 프롬프트 또는 구성에 붙여넣으세요."}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"이 블록 복사하기"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4",children:"아래의 전체 add-on 구성을 복사하세요:"}),e(r,{language:"bash",code:da}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"통합 예제"}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"OpenCode (.opencode/config.yaml)"}),e(r,{language:"bash",code:`agent:
  role: "Your Agent Role"
  extensions:
    - type: "state-ref-addon"
      content: |
        [여기에 state-ref 제약 블록을 붙여넣으세요]`}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-6",children:"커스텀 에이전트 시스템 프롬프트"}),e(r,{language:"bash",code:`<your-existing-agent-role>
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
</your-existing-agent-role>`}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"작동 방식"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:"add-on은 프로젝트 컨텍스트에 따라 행동을 조정하는 조건부 로직을 사용합니다:"}),e("div",{class:"space-y-6 mb-6",children:[e("div",{class:"bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800",children:[e("h4",{class:"text-lg font-medium text-green-900 dark:text-green-200 mb-2",children:"state-ref가 설치된 경우"}),e("p",{class:"text-sm text-green-800 dark:text-green-300",children:"에이전트가 state-ref 패턴을 제안하고, 반응형 접근 방식의 이점을 설명하며, 명확성을 위해 세밀한 반응성을 우선시하면서 사용자 선호도를 존중합니다."})]}),e("div",{class:"bg-gray-50 dark:bg-gray-800/20 p-6 rounded-lg border border-gray-200 dark:border-gray-700",children:[e("h4",{class:"text-lg font-medium text-gray-900 dark:text-gray-200 mb-2",children:"state-ref가 설치되지 않은 경우"}),e("p",{class:"text-sm text-gray-700 dark:text-gray-400",children:"에이전트가 프로젝트에 적합한 표준 코딩 관행을 사용하고, state-ref를 언급하지 않으며, 기존 규칙을 존중합니다."})]})]}),e("h3",{class:"text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-4 mt-8",children:"감지 메커니즘"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4",children:"에이전트는 다음을 통해 state-ref 가용성을 확인합니다:"}),e("ul",{class:"list-disc list-inside space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6",children:[e("li",{children:[e("code",{class:"text-sm",children:"package.json"})," 의존성 선언 (가장 신뢰할 수 있음)"]}),e("li",{children:[e("code",{class:"text-sm",children:"node_modules"})," 디렉토리 존재 (설치 확인)"]}),e("li",{children:"기존 import 문 (사용 확인)"})]}),e("hr",{class:"border-t border-gray-200 dark:border-gray-700 my-10"}),e("h2",{class:"text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-4",children:"전체 문서"}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:["완전한 add-on 문서는 설치 후 ",e("code",{class:"text-sm",children:"node_modules/state-ref/dist/ai-addons/state-ref-agent-addon.md"}),"에서 확인할 수 있습니다."]}),e("p",{class:"text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6",children:[" ",e("a",{href:"https://github.com/superlucky84/state-ref/blob/main/state-ref-agent-addon.md",target:"_blank",rel:"noopener noreferrer",class:"text-blue-600 dark:text-blue-400 hover:underline",children:"GitHub 저장소"}),"에서도 확인할 수 있습니다."]}),e("div",{class:"bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 mt-6",children:e("p",{class:"text-sm md:text-base text-yellow-900 dark:text-yellow-200 leading-relaxed",children:[e("span",{class:"font-medium",children:"중요:"})," 이 add-on은 시스템 프롬프트를 지원하는 에이전트를 위해 설계되었습니다. 프로젝트별 AI 지원(Claude Code의 skills 등)의 경우 ",e("a",{href:"#/ko/ai-agent-skills",class:"text-yellow-700 dark:text-yellow-300 hover:underline",children:"AI Agent Skills"})," 파일을 대신 사용하세요."]})})]}),Ot=t=>t.replace(/\/+$/,"")||"/",_t={"/":Yn,"/ko":Xn,"/guide/introduction":ct,"/ko/guide/introduction":pc,"/guide/quick-start":gc,"/ko/guide/quick-start":mc,"/guide/create-store":fc,"/ko/guide/create-store":bc,"/guide/watch":yc,"/ko/guide/watch":vc,"/guide/references":Sc,"/ko/guide/references":wc,"/guide/state-ref-store":xc,"/ko/guide/state-ref-store":Rc,"/guide/subscription":kc,"/ko/guide/subscription":Cc,"/guide/primitives":Tc,"/ko/guide/primitives":Wc,"/guide/computed":Ac,"/ko/guide/computed":Ec,"/guide/combine-watch":Nc,"/ko/guide/combine-watch":Ic,"/guide/manual-sync":Mc,"/ko/guide/manual-sync":Pc,"/guide/lens":Oc,"/ko/guide/lens":_c,"/guide/copyable":Lc,"/ko/guide/copyable":Uc,"/guide/clone-deep":Dc,"/ko/guide/clone-deep":Fc,"/guide/react":Vc,"/ko/guide/react":Bc,"/guide/preact":$c,"/ko/guide/preact":jc,"/guide/vue":Jc,"/ko/guide/vue":Hc,"/guide/svelte":Kc,"/ko/guide/svelte":zc,"/guide/solid":Gc,"/ko/guide/solid":qc,"/guide/lithent":Yc,"/ko/guide/lithent":Zc,"/guide/custom-connector":Xc,"/ko/guide/custom-connector":Qc,"/api/core":ea,"/ko/api/core":ta,"/api/helpers":ra,"/ko/api/helpers":na,"/api/types":oa,"/ko/api/types":ca,"/ai-agent-skills":aa,"/ko/ai-agent-skills":ia,"/ai-agent-addon":sa,"/ko/ai-agent-addon":ha},ua=t=>{const n=Ot(t),o=_t[n];if(o)return o;if(n.startsWith("/ko")){const c=Ot(n.replace(/^\/ko/,"")||"/");return _t[c]||ct}return ct},pa=f(t=>{const n=je.watch(t);return()=>{const o=ua(n.route);return e("div",{class:"min-h-screen bg-white dark:bg-[#1b1b1f] transition-colors",children:[e(zn,{}),e("div",{class:"mx-auto max-w-[1440px]",children:e("div",{class:"flex",children:[e(Gn,{}),e("main",{class:"flex-1 w-full min-w-0 px-6 md:px-12 py-8 max-w-full",children:e("div",{class:"max-w-full md:max-w-[43rem] page-shell",children:e(o,{})})})]})})]})}});Qr(e(pa,{}),document.body);
//# sourceMappingURL=index-DrGG30xE.js.map
