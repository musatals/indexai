/* IndexAI — client-side progressive enhancement. No unverified product claims. */
(() => {
'use strict';
const $ = (s, root=document) => root.querySelector(s);
const E = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g,'').toLowerCase().replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[’']/g,' ');
const fold = s => norm(s).replace(/[^a-z0-9 \u0621-\u064a\u0660-\u0669]/g,' ');
// Bounded edit distance for small spelling mistakes in search words.
const similar=(a,b)=>{
 if(Math.abs(a.length-b.length)>2 || a.length<4)return false;
 const lim=a.length>6?2:1, row=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){
  let prev=row[0];row[0]=i;
  for(let j=1;j<=b.length;j++){
   const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));
   prev=old;
  }
 }
 return row[b.length]<=lim;
};

const urlSafe = v => { try {const u=new URL(v);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';} };
const getStore=(k,df)=>{try{return JSON.parse(localStorage.getItem(k))??df}catch{return df}};
const store=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const icons = {
 'search':'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
 'home':'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',
 'grid':'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
 'layers':'<path d="m12 2 9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/>',
 'compass':'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
 'compare':'<path d="M3 7h15m0 0-4-4m4 4-4 4M21 17H6m0 0 4-4m-4 4 4 4"/>',
 'heart':'<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6z"/>',
 'book':'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zm0 0A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
 'shield':'<path d="m12 22 7-4V6l-7-4-7 4v12z"/><path d="m9 12 2 2 4-4"/>',
 'sun':'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
 'moon':'<path d="M20.5 14.5A9 9 0 0 1 9.5 3.5 9 9 0 1 0 20.5 14.5z"/>',
 'arrow':'<path d="M5 12h14m-6-6 6 6-6 6"/>',
 'external':'<path d="M13 5h6v6m0-6-9 9"/><path d="M19 13v6H5V5h6"/>',
 'chevron':'<path d="m9 18 6-6-6-6"/>',
 'check':'<path d="m4 12 5 5L20 6"/>',
 'plus':'<path d="M12 5v14M5 12h14"/>',
 'x':'<path d="M5 5l14 14M19 5 5 19"/>',
 'copy':'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
 'filter':'<path d="M4 7h16M7 12h10M10 17h4"/>',
 'info':'<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7h.01"/>',
 'list':'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
 'table':'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
 'monitor':'<rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>',
 'download':'<path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/>',
 'globe':'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18M12 3c-5 5-5 13 0 18"/>',
 'spark':'<path d="m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7z"/>',
 'link':'<path d="M10 13a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7"/>',
 'clock':'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 'menu':'<path d="M4 7h16M4 12h16M4 17h16"/>',
 'alert':'<path d="m12 3 10 18H2zM12 9v5m0 3h.01"/>',
 'chart':'<path d="M4 20V9m6 11V4m6 16v-8m5 8H2"/>',
 'sort':'<path d="M4 8h14m-14 5h10m-10 5h6M18 14l3 3-3 3"/>',
 'message':'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 10 10 0 0 1-5-1l-4 2 1-4a8.5 8.5 0 1 1 17-5.5Z"/>',
 'folder':'<path d="M3 7h6l2 2h10v11H3z"/>',
 'columns':'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/>',
 'reset':'<path d="M3 12a9 9 0 1 0 2.7-6.4L3 8m0-5v5h5"/>',
 'mail':'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/>',
 'target':'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
};
const ico=(name,sz=18,cls='')=>`<svg class="icon ${cls}" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.spark}</svg>`;
let arabicTranslations={};
let arabicAliases={};
let arabicDescriptions={};
let arabicLoad=null;
const applyArabicDescriptions=()=>{for(const t of [...db.featured,...db.tools])if(arabicDescriptions[t.slug])t.descriptionAr=arabicDescriptions[t.slug];};
const applyEditorialAdditions=()=>{for(const t of db.tools){const entry=db.editorialAdditions[t.slug];if(entry)Object.assign(t,{descriptionFr:entry.fr,descriptionEn:entry.en,descriptionAr:entry.ar,officialSource:entry.officialSource,sourceReviewedAt:entry.sourceReviewedAt,currentName:entry.currentName||''});}};
async function ensureArabic(){
 if(arabicLoad)return arabicLoad;
 arabicLoad=Promise.all([import('/assets/ar-i18n.js?v=ar-hr-careers-20261124'),fetch('/data/tool-descriptions-ar.json?v=ar-education-sourced-20261123').then(r=>r.ok?r.json():{}).catch(()=>({}))]).then(([m,descriptions])=>{arabicTranslations=m.translations||{};arabicAliases=m.aliases||{};arabicDescriptions=descriptions;applyArabicDescriptions();}).catch(error=>{arabicLoad=null;console.warn('Arabic translations unavailable',error);throw error;});
 return arabicLoad;
}
const T=(fr,en)=>state.lang==='ar'?(arabicTranslations[fr]||en):state.lang==='fr'?fr:en;
const langUrl=(path)=>{
 if(!['ar','en'].includes(state.lang))return path;
 const u=new URL(path,location.origin);u.searchParams.set('lang',state.lang);
 return u.pathname+u.search+u.hash;
};
const syncLanguageLinks=()=>{if(!['ar','en'].includes(state.lang))return;document.querySelectorAll('a[data-nav]').forEach(a=>{const path=a.getAttribute('data-nav');if(path&&path.startsWith('/'))a.setAttribute('href',langUrl(path));});};
const toolDesc=t=>state.lang==='ar'?(t.descriptionAr||t.descriptionEn||t.descriptionFr):state.lang==='fr'?t.descriptionFr:(t.descriptionEn||t.descriptionFr);
const toolKind=k=>state.lang==='ar'?({'Application / service':'تطبيق أو خدمة','Technologie / plateforme / logiciel':'تقنية أو منصة أو برنامج','Agent / framework / plateforme':'وكيل أو إطار أو منصة','Annuaire':'دليل'}[k]||k):state.lang==='fr'?k:(TYPES[k]?.[1]||k);

const TYPES={'Application / service':['Application / service','App / service'], 'Technologie / plateforme / logiciel':['Technologie / plateforme / logiciel','Technology / platform / software'], 'Agent / framework / plateforme':['Agent / framework / plateforme','Agent / framework / platform'], 'Annuaire':['Annuaire','Directory']};
const kinds=()=>Array.from(new Set(db.tools.map(t=>t.kind)));
const state={lang:(['fr','en','ar'].includes(new URLSearchParams(location.search).get('lang'))?new URLSearchParams(location.search).get('lang'):getStore('indexai-lang',getStore('atlas-lang','fr'))),theme:getStore('indexai-theme','light'),favorites:getStore('indexai-favorites',getStore('atlas-favorites',[])),compare:getStore('indexai-compare',getStore('atlas-compare',[])),view:getStore('indexai-layout',getStore('atlas-layout','cards')),search:'',category:'',kind:'',link:'all',arabicOnly:new URLSearchParams(location.search).get('ar')==='1',sort:'az',page:1,mobileMenu:false,galaxyUniverse:getStore('indexai-galaxy-universe','essentiels')};
const db={tools:[],featured:[],categories:[],families:[],quality:null,toolSlug:new Map(),catSlug:new Map(),editorialAdditions:{},catalogReady:false};
const route=()=>{
 const p=decodeURI(location.pathname).split('/').filter(Boolean), search=new URLSearchParams(location.search);
 if(p[0]==='outils'&&p[1])return {type:'tool',slug:p[1]};
 if(p[0]==='categories'&&p[1])return {type:'category',slug:p[1]};
 if(['repertoire','categories','besoins','comparateur','favoris','qualite','dossiers','agents'].includes(p[0]))return {type:p[0]};
 if(search.has('q'))return {type:'repertoire'};
 return {type:'home'};
};
let current=route();
const absorbSharedComparison=()=>{if(current.type!=='comparateur'||!db.catalogReady)return;const param=new URLSearchParams(location.search).get('ids');if(!param)return;const requested=param.split(',').filter(Boolean).slice(0,4);state.compare=requested.filter(id=>db.tools.some(t=>t.id===id));store('indexai-compare',state.compare);};
let maybeLoadEditorial=()=>{};
let retryCatalog=()=>{};
const nav=(path)=>{history.pushState({lang:state.lang},'',langUrl(path));current=route();absorbSharedComparison();state.page=1;state.mobileMenu=false;window.scrollTo({top:0,behavior:'instant'});render();maybeLoadEditorial();if(!db.catalogReady&&current.type!=='home'&&current.type!=='categories')void retryCatalog();};
const category=(slug)=>db.catSlug.get(slug);
const tool=(slug)=>db.toolSlug.get(slug);
const cName=c=>state.lang==='ar'?(c?.ar||c?.en||c?.name):state.lang==='fr'?c.name:c.en;
const familyName=f=>state.lang==='ar'?(f?.ar||f?.en):state.lang==='fr'?f.fr:f.en;
const familyDescription=f=>state.lang==='ar'?(f?.descriptionAr||f?.descriptionEn):state.lang==='fr'?f.descriptionFr:f.descriptionEn;
const inFav=t=>state.favorites.includes(t.id);
const inComp=t=>state.compare.includes(t.id);
const catHue=c=>({'discover':'#9a6c47','creative':'#b97965','builders':'#577d6d','business':'#bb873b','specialized':'#947c65','directory':'#826a90'})[c?.family]||'#8fcfff';
const initials=name=>name.split(/[\s.\-]+/).filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('').slice(0,2);
const toolLogo=t=>{const c=db.categories.find(c=>c.name===t.category);const url=urlSafe(t.url);const host=url?new URL(url).hostname:'';
 return `<span class="tool-logo" style="--tile:${catHue(c)}">${host?`<img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64" alt="" loading="lazy" onload="this.parentElement.classList.add('image-loaded')" onerror="this.remove()">`:''}<span class="logo-fallback">${E(initials(t.name))}</span></span>`;
};
const catIcon=c=>({'discover':'✦','creative':'◈','builders':'⌘','business':'▣','specialized':'⬡','directory':'◎'})[c?.family]||'✦';
const abbr=s=>s.length>65?s.slice(0,62)+'…':s;
const fmt=n=>new Intl.NumberFormat(state.lang==='fr'?'fr-FR':state.lang==='ar'?'ar-MA':'en-US').format(n);
const escapePath=encodeURIComponent;

const routes=[['/','home','Accueil','Home'],['/repertoire/','grid','Répertoire','Directory'],['/agents/','spark','Agents IA','AI agents'],['/dossiers/','book','Dossiers documentés','Researched guides'],['/categories/','layers','Catégories','Categories'],['/besoins/','compass','Par besoins','By use case'],['/comparateur/','compare','Comparer','Compare'],['/favoris/','heart','Favoris','Saved'],['/qualite/','shield','Sources & qualité','Sources & quality']];
function shell(){
 const navItem=([path,ic,fr,en])=>`<a href="${path}" data-nav="${path}" class="nav-link ${((current.type==='home'&&path==='/')||(path.startsWith('/'+current.type+'/')))?'active':''}" data-tooltip="${E(T(fr,en))}" aria-label="${E(T(fr,en))}" ${((current.type==='home'&&path==='/')||(path.startsWith('/'+current.type+'/')))?'aria-current="page"':''}>${ico(ic,18)}<span>${T(fr,en)}</span>${ic==='compare'&&state.compare.length?`<span class="nav-count">${state.compare.length}</span>`:''}</a>`;
 return `<header class="topbar"><div class="topbar-inner">
  <button class="menu-toggle icon-button" data-action="toggle-menu" aria-label="${T('Afficher le menu','Open menu')}">${ico('menu')}</button>
  <a href="/" data-nav="/" class="brand" aria-label="IndexAI — ${T('Accueil','Home')}"><span class="brand-emblem"><span class="brand-monogram">i</span><span class="brand-dot a"></span><span class="brand-dot b"></span><span class="brand-dot c"></span></span><span class="brand-title">Index<span class="brand-sep">AI</span><small>${T('L’index des outils IA','The AI tools index')}</small></span></a>
  <div class="global-search"><label class="sr-only" for="globalSearch">${T('Rechercher un outil','Search for a tool')}</label>${ico('search',18)}<input id="globalSearch" type="search" autocomplete="off" placeholder="${T('Rechercher parmi 909 outils…','Search across 909 tools…')}" value="${E(state.search)}"><kbd>/</kbd><div class="search-suggestions" id="suggestions" hidden></div></div>
  <nav class="top-actions" aria-label="${T('Actions','Actions')}"><a href="/comparateur/" data-nav="/comparateur/" class="top-compare">${ico('compare',17)}<span>${T('Comparer','Compare')}</span><strong id="compareCount">${state.compare.length}</strong></a><button class="icon-button" data-action="theme" aria-label="${T('Basculer le thème','Toggle theme')}">${ico(state.theme==='dark'?'sun':'moon')}</button><div class="language-switch" role="group" aria-label="Language / Langue / اللغة">${[['fr','FR'],['en','EN'],['ar','عربي']].map(([lang,label])=>`<button class="lang-button ${state.lang===lang?'is-active':''}" data-action="lang" data-lang="${lang}" aria-label="${label}" aria-pressed="${state.lang===lang}" lang="${lang}">${label}</button>`).join('')}</div></nav>
 </div></header>
 <div class="app-layout"><aside class="sidebar ${state.mobileMenu?'expanded':''}" aria-label="${T('Navigation principale','Main navigation')}">
   <div class="side-section-label">${T('EXPLORATION','EXPLORE')}</div><nav class="sidenav">${routes.map(navItem).join('')}</nav>
   <div class="side-divider"></div><div class="side-section-label">${T('CATÉGORIES POPULAIRES','LARGEST CATEGORIES')}</div>
   <nav class="side-categories">${db.categories.slice().sort((a,b)=>b.count-a.count).slice(0,7).map(c=>`<a href="/categories/${c.slug}/" data-nav="/categories/${c.slug}/"><span class="side-mini" style="--tile:${catHue(c)}">${catIcon(c)}</span><span>${E(cName(c))}</span><span class="side-num">${c.count}</span></a>`).join('')}</nav>
   <div class="sidebar-foot"><span class="online-dot"></span>${T('Référentiel initial · 2026','Initial inventory · 2026')}<br><span class="sidebar-sub">${T('Données en cours de vérification','Verification in progress')}</span></div>
  </aside><main id="mainContent" class="main-content" tabindex="-1"></main></div>
 <footer class="footer"><div class="footer-inner"><div class="footbrand">Index<span>AI</span></div><p>${T('Cartographier l’intelligence artificielle, un outil à la fois.','Mapping AI, one tool at a time.')}<span class="foot-divider"> · </span>${fmt(db.quality?.total||db.tools.length)} ${T('références','entries')}<span class="foot-divider"> · </span>2026</p><div class="footlinks"><a href="/qualite/" data-nav="/qualite/">${T('Méthodologie','Methodology')}</a><a href="/data/tools.json" download>${T('Données JSON','JSON data')}</a><a href="/sources/atlas_outils_ia_2026.csv" download>CSV</a></div><span class="footer-editorial-credit"><span class="footer-editorial-title">${T('IndexAI · Répertoire des outils IA','IndexAI · AI Tools Directory')}</span><span class="footer-signature-text">N. Elmqaddem</span></span></div></footer>
 <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}
const headline=(eyebrow,title,sub)=>`<div class="page-intro"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${sub?`<p>${sub}</p>`:''}</div>`;
const stat=(iconName,num,desc,extra='')=>`<div class="stat-card"><span class="stat-icon">${ico(iconName,19)}</span><strong>${num}</strong><span>${desc}</span>${extra?`<small>${extra}</small>`:''}</div>`;
function catCard(c){return `<a href="/categories/${c.slug}/" data-nav="/categories/${c.slug}/" class="category-card" style="--category-accent:${catHue(c)}"><span class="category-mark">${catIcon(c)}</span><div class="category-info"><h3>${E(cName(c))}</h3><p>${fmt(c.count)} ${T('outils','tools')}</p></div><span class="cat-arrow">${ico('arrow',17)}</span></a>`;}
function toolCard(t,compact=false){const c=category(t.categorySlug), url=urlSafe(t.url);
 return `<article class="tool-card ${compact?'compact':''}" tabindex="-1" style="--category-accent:${catHue(c)}"><div class="tool-card-top"><a href="/outils/${t.slug}/" data-nav="/outils/${t.slug}/" class="tool-identity">${toolLogo(t)}<span class="tool-name-group"><strong>${E(t.name)}</strong><small>${E(c?cName(c):t.category)}</small></span></a><button class="mini-control ${inFav(t)?'selected':''}" data-action="favorite" data-id="${E(t.id)}" aria-label="${inFav(t)?T('Retirer des favoris','Remove favorite'):T('Ajouter aux favoris','Save to favorites')}" title="${T('Favoris','Favorites')}">${ico('heart',17)}</button></div>
 <div class="tool-card-info">${t.availabilityStatus==='discontinued'?`<span class="pill pill-amber">${T('Service arrêté','Discontinued')}</span>`:t.availabilityStatus==='sunsetting'?`<span class="pill pill-amber">${T('Fin de vie annoncée','Sunsetting')}</span>`:t.research?`<span class="pill pill-sourced">${T('Dossier approfondi','In-depth guide')}</span>`:''}<span class="pill pill-neutral">${E(toolKind(t.kind))}</span>${t.sharedUrlCount>1?`<span class="pill pill-amber" title="${T('Plusieurs fiches partagent ce domaine','Several records share this address')}">${ico('link',12)} ${T('URL partagée','Shared URL')}</span>`:''}</div>
 ${t.descriptionFr?`<p class="tool-card-summary" ${state.lang==='ar'?`lang="${t.descriptionAr?'ar':'en'}" dir="${t.descriptionAr?'rtl':'ltr'}"`:''}>${E(abbr(toolDesc(t)))}</p>`:`<p class="tool-card-summary tool-card-placeholder">${T('Présentation à documenter','Description pending research')}</p>`}
 <div class="tool-card-foot"><span class="muted-verify">${ico('clock',13)} ${t.pricing?.sourceUrl?T('Tarif sourcé','Pricing sourced'):t.descriptionFr?T('Synthèse éditoriale','Editorial overview'):T('À documenter','Research pending')}</span><div class="card-actions"><button class="mini-control ${inComp(t)?'selected':''}" data-action="compare" data-id="${E(t.id)}" aria-label="${inComp(t)?T('Retirer de la comparaison','Remove from comparison'):T('Comparer cet outil','Compare this tool')}" title="${T('Comparer','Compare')}">${ico(inComp(t)?'check':'compare',16)}</button><a href="/outils/${t.slug}/" data-nav="/outils/${t.slug}/" class="detail-arrow" aria-label="${T('Détails de','Details for')} ${E(t.name)}">${ico('arrow',17)}</a></div></div></article>`;
}
const needs=[
 ['rediger','✎','Rédiger et reformuler','Write and edit',['Rédaction et correction','Traduction et localisation']],
 ['analyser','◉','Rechercher et analyser','Research and analyze',['Recherche web et réponses','Recherche académique et science','Données, BI et analytique']],
 ['image','✧','Créer des images','Generate images',['Images génératives','Retouche et restauration d’images']],
 ['video','▷','Créer des vidéos','Create videos',['Vidéo générative','Montage vidéo et clips']],
 ['audio','♫','Créer de l’audio','Produce audio',['Voix et synthèse vocale','Musique et composition','Audio, podcasts et traitement']],
 ['coder','⌘','Programmer','Write code',['Programmation assistée','Création de sites et applications']],
 ['automatiser','↗','Automatiser les tâches','Automate tasks',['Automatisation et intégrations','Agents autonomes et orchestration']],
 ['apprendre','◎','Enseigner et apprendre','Teach and learn',['Éducation et tutorat','Présentations et infographies']],
 ['documents','▤','Traiter des documents','Process documents',['Extraction documentaire et OCR','Transcription et réunions']],
 ['3d','⬡','Créer en 3D et XR','Create 3D and XR',['3D, spatial et XR','Architecture, immobilier et intérieur']],
 ['security','◇','Sécuriser et contrôler','Secure and assess',['Cybersécurité et détection','Détection IA et authenticité','Prompts, tests et red teaming']],
 ['business','▣','Développer son activité','Grow a business',['Marketing et publicité','Ventes, prospection et CRM','E-commerce et retail']]
];
function needCard(n){const count=db.tools.filter(t=>n[4].includes(t.category)||t.secondaryCategories.some(c=>n[4].includes(c))).length;
 return `<a href="/besoins/?besoin=${n[0]}" data-nav="/besoins/?besoin=${n[0]}" class="need-card"><span class="need-icon">${n[1]}</span><span><strong>${T(n[2],n[3])}</strong><small>${db.catalogReady?fmt(count)+' '+T('références','entries'):fmt(db.categories.filter(c=>n[4].includes(c.name)).length)+' '+T('domaines','areas')}</small></span>${ico('arrow',16)}</a>`;
}
const galaxyUniverses=[{"id":"essentiels","fr":"Découvrir","en":"Discover","entries":[["assistants-generalistes","💬","Assistants","Assistants"],["recherche-web-et-reponses","🔎","Recherche","Search"],["images-generatives","🎨","Images","Images"],["video-generative","🎬","Vidéo","Video"],["voix-et-synthese-vocale","🎙️","Voix","Voice"],["programmation-assistee","💻","Code","Coding"],["@agents","🤖","Tous les agents","All agents"],["education-et-tutorat","📚","Éducation","Education"],["marketing-et-publicite","📣","Marketing","Marketing"],["donnees-bi-et-analytique","📊","Données","Analytics"],["3d-spatial-et-xr","🧊","3D & XR","3D & XR"],["cybersecurite-et-detection","🛡️","Sécurité","Security"]]},{"id":"agents","fr":"Agents IA","en":"AI agents","entries":[["agents-autonomes-et-orchestration","🤖","Orchestration","Orchestration"],["agents-ia-personnels","🧑‍🚀","Agents perso","Personal agents"],["agents-web-navigateurs","🌐","Agents Web","Web agents"],["agents-ia-programmation","👨‍💻","Agents code","Coding agents"],["agents-ia-entreprise","🏢","Agents métier","Work agents"],["plateformes-agents-ia","🧱","Créer agents","Agent builders"],["agents-vocaux-et-telephonie","☎️","Agents vocaux","Voice agents"]]},{"id":"creation","fr":"Créer","en":"Create","entries":[["redaction-et-correction","✍️","Rédaction","Writing"],["traduction-et-localisation","🌍","Traduction","Translate"],["retouche-et-restauration-dimages","🖼️","Retouche","Editing"],["montage-video-et-clips","🎞️","Montage","Editing video"],["avatars-presentateurs-et-doublage","🧑‍🎤","Avatars","Avatars"],["musique-et-composition","🎵","Musique","Music"],["audio-podcasts-et-traitement","🎧","Podcasts","Podcasts"],["design-graphique-et-branding","🖌️","Design","Design"],["presentations-et-infographies","📽️","Diaporamas","Slides"],["creation-de-sites-et-applications","🛠️","Sites & apps","Web & apps"],["jeux-video-et-personnages","🎮","Jeux","Games"],["architecture-immobilier-et-interieur","🏠","Architecture","Architecture"]]},{"id":"entreprise","fr":"Entreprise","en":"Business","entries":[["organisation-et-productivite","🗓️","Productivité","Productivity"],["email-et-communication","✉️","Email","Email"],["seo-et-visibilite-ia","📈","SEO","SEO"],["ventes-prospection-et-crm","🤝","Ventes & CRM","Sales & CRM"],["support-client-et-chatbots","💭","Chatbots","Chatbots"],["extraction-documentaire-et-ocr","📄","Documents","Documents"],["finance-comptabilite-et-assurance","💳","Finance","Finance"],["droit-et-conformite","⚖️","Droit","Legal"],["rh-recrutement-et-carrieres","👥","Recrutement","Hiring"],["e-commerce-et-retail","🛍️","E-commerce","E-commerce"]]},{"id":"technologies","fr":"Technologies","en":"Technology","entries":[["llm-modeles-et-fournisseurs","🧠","Modèles LLM","LLM models"],["ia-locale-inference-et-deploiement","💾","IA locale","Local AI"],["rag-bases-vectorielles-et-recherche","🧩","RAG","RAG"],["mlops-suivi-et-evaluation","⚙️","MLOps","MLOps"],["donnees-annotation-et-entrainement","🏷️","Annotation","Labeling"],["vision-robotique-et-edge-ai","🦾","Robotique","Robotics"],["detection-ia-et-authenticite","🔬","Détection IA","AI detection"],["prompts-tests-et-red-teaming","🧪","Tests prompts","Prompt tests"],["automatisation-et-integrations","🔄","Automatisation","Automation"]]},{"id":"specialises","fr":"Spécialisés","en":"Specialized","entries":[["recherche-academique-et-science","🔭","Science","Science"],["transcription-et-reunions","📝","Réunions","Meetings"],["sante-et-medecine","🩺","Santé","Health"],["agriculture-climat-et-geospatial","🌱","Climat & Geo","Climate & Geo"],["voyages-loisirs-et-vie-quotidienne","🧳","Voyages","Travel"],["annuaires-et-plateformes-de-decouverte","🗂️","Annuaires","Directories"]]}];

function visual(){
 const selected=galaxyUniverses.find(g=>g.id===state.galaxyUniverse)||galaxyUniverses[0];
 const destinations=selected.entries;
 const universes=galaxyUniverses.map(g=>`<button type="button" class="galaxy-universe ${g.id===selected.id?'is-active':''}" data-action="galaxy-universe" data-id="${g.id}" aria-pressed="${g.id===selected.id}">${E(T(g.fr,g.en))}</button>`).join('');
 const nodes=destinations.map(([slug,symbol,fr,en],i)=>{
   const c=slug==='@agents'?null:category(slug);
   if(!c&&slug!=='@agents')return '';
   const path=slug==='@agents'?'/agents/':'/categories/'+c.slug+'/';
   const label=slug==='@agents'?T('Tous les agents IA','All AI agents'):cName(c);
   const count=slug==='@agents'?db.tools.filter(t=>t.agentType).length:c.count;
   const phase=-Math.PI/2+i*2*Math.PI/destinations.length;
   const left=(50+Math.cos(phase)*37).toFixed(2);
   const top=(50+Math.sin(phase)*40).toFixed(2);
   return `<a href="${E(path)}" data-nav="${E(path)}" class="orbit-node node-${i+1}" data-orbit-index="${i}" style="left:${left}%;top:${top}%" title="${E(label)}" aria-label="${E(label)} · ${fmt(count)} ${T('outils','tools')}"><span class="orbit-symbol" aria-hidden="true">${symbol}</span><span class="orbit-node-label">${E(T(fr,en))}</span></a>`;
 }).join('');
 return `<div class="galaxy-section">
  <div class="galaxy-universes" role="group" aria-label="${T('Choisir un univers de la galaxie IA','Choose an AI galaxy universe')}">${universes}</div>
  <div class="galaxy-motion-row">
    <button type="button" class="nebula-motion-toggle" aria-label="${T('Mettre en pause les nuages et la galaxie','Pause galaxy and cloud animation')}" aria-pressed="false" title="${T('Suspendre ou reprendre le mouvement','Pause or resume motion')}"><span class="nebula-toggle-icon" aria-hidden="true">Ⅱ</span><span class="nebula-toggle-label">${T('Pause','Pause')}</span></button>
  </div>
  <div class="galaxy-visual">
    <div class="nebula-stage" id="indexaiNebula" aria-hidden="true"><canvas class="nebula-canvas" aria-hidden="true"></canvas></div>
    <div class="visual-orbit" role="navigation" aria-label="${T('Catégories IA : ','AI categories: ')+E(T(selected.fr,selected.en))}" data-orbit-count="${destinations.length}">
      <div class="orbit-ring ring-one" aria-hidden="true"></div><div class="orbit-ring ring-two" aria-hidden="true"></div><div class="orbit-ring ring-three" aria-hidden="true"></div>
      <a href="/categories/" data-nav="/categories/" class="orbit-center" title="${T('Toutes les catégories IA','All AI categories')}" aria-label="${T('Explorer les 55 catégories IA','Explore all 55 AI categories')}"><span class="orbit-glyph" aria-hidden="true">✳</span><strong>IA</strong></a>
      ${nodes}
    </div>
  </div>
  <div class="galaxy-footer">
    <a href="/categories/" data-nav="/categories/" class="orbit-all-categories">${T('Explorer les 55 catégories','Explore all 55 categories')} ${ico('arrow',13)}</a>
    <span class="orbit-caption">${T('Un écosystème · mille possibilités','One ecosystem · endless possibilities')}</span>
  </div>
 </div>`;
}
function home(){const countWithUrl=db.catalogReady?db.tools.filter(t=>t.url).length:(db.quality?.toolsWithUrl||0);
 const featured=db.catalogReady?['ChatGPT','Midjourney','Cursor','Ollama','Gamma','ElevenLabs','Perplexity','Meshy'].map(name=>db.tools.find(t=>t.name===name)).filter(Boolean):db.featured;
 return `<div class="home-screen"><div class="hero hero-nebula"><div class="hero-copy"><div class="hero-tag"><span class="live-spark"></span>${T('UN RÉPERTOIRE, DES CENTAINES DE POSSIBILITÉS','ONE DIRECTORY, HUNDREDS OF POSSIBILITIES')}</div><h1>${T('Trouvez l’outil IA <em>qui change tout.</em>','Find the AI tool <em>that changes everything.</em>')}</h1><p>${T('Explorez une cartographie structurée de l’intelligence artificielle. Recherchez, découvrez et comparez — avec des informations clairement sourcées.','Explore a structured map of artificial intelligence. Search, discover and compare — with clearly sourced information.')}</p><div class="hero-actions"><a href="/repertoire/" data-nav="/repertoire/" class="btn btn-primary">${ico('grid',18)} ${T('Explorer le répertoire','Explore directory')} ${ico('arrow',17)}</a><a href="/agents/" data-nav="/agents/" class="btn btn-ghost">${ico('spark',18)} ${T('Découvrir les agents IA','Explore AI agents')}</a><a href="/besoins/" data-nav="/besoins/" class="btn btn-ghost">${ico('compass',17)} ${T('Parcourir par besoin','Browse by use case')}</a><a class="btn btn-ghost" href="/dossiers/" data-nav="/dossiers/">${ico('book',17)} ${T('Dossiers approfondis','Detailed profiles')}</a></div><div class="hero-note">${ico('shield',15)} ${T('Transparence documentaire : aucune fiche n’est présentée comme vérifiée sans contrôle.','Editorial transparency: no tool is shown as verified without review.')}</div></div>${visual()}</div>
 <section class="stats-grid" aria-label="${T('Statistiques du catalogue','Catalog statistics')}">${stat('grid',fmt(db.quality?.total||db.tools.length),T('Outils & ressources','Tools & resources'))}${stat('layers',fmt(db.categories.length),T('Catégories','Categories'))}${stat('book',fmt(db.quality?.deepProfiles||0),T('Dossiers approfondis','Researched dossiers'),fmt(db.quality?.deepProfilesOfficialSourceReviewed||0)+' '+T('avec sources officielles','with official sources'))}${stat('link',fmt(countWithUrl),T('Liens renseignés','Listed links'))}</section>
 <section class="section-block"><div class="section-title"><div><span class="section-eyebrow">01 / ${T('EXPLORATION','EXPLORATION')}</span><h2>${T('Les grands univers de l’IA','Explore the AI landscape')}</h2><p>${T('Six portes d’entrée vers 55 catégories détaillées.','Six gateways to 50 detailed categories.')}</p></div><a href="/categories/" data-nav="/categories/" class="text-link">${T('Toutes les catégories','All categories')} ${ico('arrow',16)}</a></div><div class="families-grid">${db.families.map(f=>`<a href="/categories/?famille=${f.id}" data-nav="/categories/?famille=${f.id}" class="family-card family-${f.id}"><div class="family-number">${fmt(f.count)} ${T('outils','tools')}</div><div class="family-symbol">${E(f.symbol)}</div><div class="family-label">${E(familyName(f))}</div><div class="family-bottom"><span>${f.categories} ${T('catégories','categories')}</span>${ico('arrow',19)}</div></a>`).join('')}</div></section>
 <section class="section-block"><div class="section-title"><div><span class="section-eyebrow">02 / ${T('CAS D’USAGE','USE CASES')}</span><h2>${T('Quel est votre objectif ?','What do you want to do?')}</h2><p>${T('Partez de votre besoin, pas de la technologie.','Start with your task, not the technology.')}</p></div><a href="/besoins/" data-nav="/besoins/" class="text-link">${T('Tous les usages','All use cases')} ${ico('arrow',16)}</a></div><div class="needs-grid" id="homeNeeds">${needs.slice(0,8).map(needCard).join('')}</div></section>
 <section class="section-block"><div class="section-title"><div><span class="section-eyebrow">03 / ${T('REPÈRES DE DÉPART','STARTING POINTS')}</span><h2>${T('Quelques outils à explorer','A few tools to explore')}</h2><p>${T('Sélection éditoriale diversifiée, sans classement ni évaluation de qualité.','A varied editorial selection, not a ranking or quality assessment.')}</p></div><a href="/repertoire/" data-nav="/repertoire/" class="text-link">${T('Voir les 909 références','Browse all 909 entries')} ${ico('arrow',16)}</a></div><div id="homeFeatured">${featured.length?`<div class="tools-grid">${featured.map(t=>toolCard(t)).join('')}</div>`:`<div class="catalog-loading-inline" role="status"><span class="catalog-spinner" aria-hidden="true"></span>${T('Chargement de la sélection…','Loading featured selection…')}</div>`}</div></section>
 <div class="notice-card"><span>${ico('info',21)}</span><p><strong>${T('Inventaire en construction','Work in progress')}</strong><br>${T('Le répertoire initial est conservé; 78 outils majeurs disposent désormais de dossiers approfondis et de références datées. Les autres fiches restent à documenter.','The initial inventory is preserved; 78 major tools now have researched dossiers and dated references. Other profiles remain to be documented.')}</p><a href="/qualite/" data-nav="/qualite/">${T('Comprendre la méthode','Read our methodology')} ${ico('arrow',16)}</a></div></div>`;
}
function score(t,q){if(!q)return 1;const query=norm(q).trim();const tokens=query.split(/\s+/).filter(Boolean);
 const c=category(t.categorySlug);const name=norm(t.name), text=norm([t.name,t.category,c?.en,c?.ar,arabicAliases[t.slug]||'',...t.secondaryCategories,t.kind,t.id,t.descriptionFr||'',t.descriptionEn||'',t.descriptionAr||'',t.research?.headline||'',...(t.research?.cases||[])].join(' '));
 let val=0;if(name===query)val+=200;if(name.startsWith(query))val+=90;if(name.includes(query))val+=50;
 if(text.includes(query))val+=30;
 const words=fold(text).split(/\s+/).filter(Boolean);
 for(const word of tokens){if(name.includes(word))val+=8;else if(text.includes(word))val+=3;else if(words.some(w=>similar(word,w)))val+=1;}
 return tokens.length&&tokens.every(word=>text.includes(word)||words.some(w=>similar(word,w)))?val:0;
}
function filtered(){let items=db.tools.filter(t=>(!state.category||t.categorySlug===state.category||t.secondaryCategories.includes(category(state.category)?.name)) && (!state.kind||t.kind===state.kind) && (state.link==='all'||(state.link==='yes'?!!t.url:!t.url)) && (state.lang!=='ar'||!state.arabicOnly||!!t.descriptionAr));
 if(state.search.trim())items=items.map(t=>({t,score:score(t,state.search)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.t.name.localeCompare(b.t.name)).map(x=>x.t);
 if(state.sort==='az'&&!state.search.trim())items.sort((a,b)=>a.name.localeCompare(b.name));
 if(state.sort==='za')items.sort((a,b)=>b.name.localeCompare(a.name));
 if(state.sort==='category')items.sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name));
 if(state.sort==='id')items.sort((a,b)=>a.id.localeCompare(b.id));
 return items;
}
const selectOpts=(items, val, title, key)=>`<label class="filter-field"><span>${title}</span><select data-filter="${key}" aria-label="${title}">${items.map(([v,t])=>`<option value="${E(v)}" ${val===v?'selected':''}>${E(t)}</option>`).join('')}</select></label>`;
function filterBar(){return `<div class="filters-bar"><div class="filter-heading">${ico('filter',18)}<strong>${T('Affiner','Refine')}</strong></div><div class="filter-fields">${selectOpts([['',T('Toutes les catégories','All categories')],...db.categories.map(c=>[c.slug,cName(c)])],state.category,T('Catégorie','Category'),'category')}${selectOpts([['',T('Tous les types','All types')],...kinds().map(k=>[k,toolKind(k)])],state.kind,T('Nature','Type'),'kind')}${selectOpts([['all',T('Tous les statuts','All records')],['yes',T('URL renseignée','URL listed')],['no',T('URL manquante','Missing URL')]],state.link,T('Lien','Link'),'link')}${selectOpts([['az','A → Z'],['za','Z → A'],['category',T('Catégorie','Category')],['id',T('Ordre d’inventaire','Inventory order')]],state.sort,T('Trier','Sort'),'sort')}</div><button class="reset-btn" data-action="reset">${ico('reset',15)} ${T('Réinitialiser','Reset')}</button></div>`;}
function listTool(t){const c=category(t.categorySlug);
 return `<div class="tool-list-row"><a href="/outils/${t.slug}/" data-nav="/outils/${t.slug}/" class="list-tool-name">${toolLogo(t)}<span><strong>${E(t.name)}</strong><small>${E(toolKind(t.kind))}</small></span></a><span class="list-category" style="--category-accent:${catHue(c)}">${E(c?cName(c):t.category)}</span><span class="list-status">${ico(t.url?'link':'alert',15)} ${t.url?T('Renseigné','Listed'):T('Manquant','Missing')}</span><div class="list-actions"><button class="mini-control ${inFav(t)?'selected':''}" data-action="favorite" data-id="${t.id}" title="${T('Favoris','Favorites')}">${ico('heart',16)}</button><button class="mini-control ${inComp(t)?'selected':''}" data-action="compare" data-id="${t.id}" title="${T('Comparer','Compare')}">${ico('compare',16)}</button><a class="detail-arrow" href="/outils/${t.slug}/" data-nav="/outils/${t.slug}/">${ico('arrow',16)}</a></div></div>`;
}
function tableTools(items){return `<div class="table-scroll"><table class="data-table"><thead><tr><th>${T('Outil','Tool')}</th><th>${T('Catégorie','Category')}</th><th>${T('Nature','Type')}</th><th>${T('URL','URL')}</th><th>${T('Fiche','Record')}</th></tr></thead><tbody>${items.map(t=>{const c=category(t.categorySlug);return `<tr><td><a href="/outils/${t.slug}/" data-nav="/outils/${t.slug}/">${E(t.name)}</a></td><td>${E(c?cName(c):t.category)}</td><td>${E(toolKind(t.kind))}</td><td>${t.url?ico('check',15):'—'}</td><td><a href="/outils/${t.slug}/" data-nav="/outils/${t.slug}/">${ico('arrow',16)}</a></td></tr>`}).join('')}</tbody></table></div>`;}
function directory(){const filteredAll=filtered(), per=24, lastPage=Math.max(1,Math.ceil(filteredAll.length/per));state.page=Math.min(state.page,lastPage);const items=filteredAll.slice((state.page-1)*per,state.page*per);
 const layouts=[['cards','grid',T('Cartes','Cards')],['list','list',T('Liste','List')],['table','table',T('Tableau','Table')],['logos','monitor',T('Logos','Icons')]];
 return `${headline(T('LE RÉPERTOIRE / 909 RÉFÉRENCES','THE DIRECTORY / 909 ENTRIES'),T('Tous les outils IA, au même endroit.','Every AI tool, in one place.'),T('Recherchez dans les noms et les catégories documentées. Les caractéristiques détaillées restent à vérifier.','Search documented names and categories. Detailed characteristics are awaiting verification.'))}${state.lang==='ar'?`<p class="editorial-note arabic-coverage-note" lang="ar">تتوفر ${fmt(db.tools.filter(t=>!!t.descriptionAr).length)} بطاقة بوصف عربي من أصل ${fmt(db.tools.length)}. تبقى البطاقات الأخرى متاحة بلغتها الأصلية حتى استكمال الترجمة.</p>`:''}
 <div class="directory-search">${ico('search',21)}<label class="sr-only" for="directorySearch">${T('Rechercher dans le répertoire','Search the directory')}</label><input id="directorySearch" type="search" placeholder="${T('Nom, catégorie, type ou identifiant…','Name, category, type or ID…')}" value="${E(state.search)}">${state.search?`<button class="icon-button" data-action="clear-search" title="${T('Effacer','Clear')}">${ico('x',18)}</button>`:`<span class="search-hint">${T('909 références','909 entries')}</span>`}</div>
 ${filterBar()}${state.lang==='ar'?`<div class="arabic-filter-control"><button type="button" class="btn btn-secondary arabic-filter-button ${state.arabicOnly?'is-active':''}" data-action="arabic-filter" aria-pressed="${state.arabicOnly}" lang="ar">${ico(state.arabicOnly?'check':'filter',16)} ${state.arabicOnly?'عرض جميع الأدوات':'عرض الأدوات ذات الوصف العربي فقط'}</button></div>`:''}<div class="results-toolbar"><div><strong>${fmt(filteredAll.length)}</strong> ${T('résultats','results')} ${state.search?`<span class="result-query">« ${E(state.search)} »</span>`:''}<p>${T('Inventaire initial et nouvelles références agentiques : conditions à vérifier chez les éditeurs.','Original entries and new agent listings: verify vendor terms.')}</p></div><div class="layout-toggle" role="group" aria-label="${T('Mode d’affichage','View mode')}">${layouts.map(([val,ic,title])=>`<button data-action="layout" data-value="${val}" aria-label="${E(title)}" aria-pressed="${state.view===val}" class="${state.view===val?'active':''}" title="${E(title)}">${ico(ic,17)}</button>`).join('')}</div></div>
 ${!items.length?`<div class="empty-state">${ico('search',32)}<h3>${T('Aucun outil trouvé','No matching tools')}</h3><p>${T('Essayez de modifier la recherche ou les filtres.','Try different keywords or filters.')}</p><button class="btn btn-secondary" data-action="reset">${T('Tout afficher','Show all')}</button></div>`:state.view==='cards'?`<div class="tools-grid">${items.map(t=>toolCard(t)).join('')}</div>`:state.view==='list'?`<div class="tools-list">${items.map(listTool).join('')}</div>`:state.view==='logos'?`<div class="logos-grid">${items.map(t=>`<a class="logo-item" href="/outils/${t.slug}/" data-nav="/outils/${t.slug}/" title="${E(t.name)}">${toolLogo(t)}<span>${E(t.name)}</span></a>`).join('')}</div>`:tableTools(items)}
 ${lastPage>1?`<nav class="pagination" aria-label="${T('Pagination des résultats','Results pagination')}"><button data-action="page" data-value="${state.page-1}" ${state.page<=1?'disabled':''}>${ico('chevron',16,'flip')} ${T('Précédent','Previous')}</button><span>${T('Page','Page')} <strong>${state.page}</strong> / ${lastPage}</span><button data-action="page" data-value="${state.page+1}" ${state.page>=lastPage?'disabled':''}>${T('Suivant','Next')} ${ico('chevron',16)}</button></nav>`:''}`;
}
function categoriesPage(){const f=new URLSearchParams(location.search).get('famille')||'';let groups=db.families.filter(x=>!f||x.id===f);return `${headline(T('EXPLORATION PAR DOMAINE','EXPLORE BY DOMAIN'),T('55 catégories. Une vue complète.','55 categories. One complete view.'),T('Retrouvez chaque catégorie d’origine dans un classement thématique, sans perdre les classifications initiales.','Browse every original category in a thematic grouping, preserving the source classification.'))}<div class="family-tabs"><a href="/categories/" data-nav="/categories/" class="${!f?'active':''}">${T('Toutes','All')}</a>${db.families.map(x=>`<a href="/categories/?famille=${x.id}" data-nav="/categories/?famille=${x.id}" class="${f===x.id?'active':''}">${E(familyName(x))}</a>`).join('')}</div>${groups.map(g=>{const cs=db.categories.filter(c=>c.family===g.id);return `<section class="category-section"><div class="category-section-head"><div class="family-heading-symbol family-${g.id}">${E(g.symbol)}</div><div><h2>${E(familyName(g))}</h2><p>${familyDescription(g)}</p></div><span class="count-chip">${g.count} ${T('outils','tools')}</span></div><div class="category-grid">${cs.map(catCard).join('')}</div></section>`;}).join('')}`;}
function breadcrumbs(...crumbs){return `<nav class="breadcrumbs" aria-label="${T('Fil d’Ariane','Breadcrumb')}"><a href="/" data-nav="/">${T('Accueil','Home')}</a>${crumbs.map(([text,href])=>`${ico('chevron',13)}${href?`<a href="${href}" data-nav="${href}">${E(text)}</a>`:`<span aria-current="page">${E(text)}</span>`}`).join('')}</nav>`;}
function dossiersPage(){
 const items=db.tools.filter(t=>t.research).sort((a,b)=>a.name.localeCompare(b.name));
 const date=db.quality?.deepResearchDate||'2026-11-15';
 const fams=db.families.filter(f=>items.some(t=>category(t.categorySlug)?.family===f.id));
 return `${headline(T('DOCUMENTATION APPROFONDIE','RESEARCHED PROFILES'),T('Les outils IA incontournables, expliqués en profondeur.','Popular AI tools, explained in depth.'),T('Un premier corpus de dossiers éditoriaux avec cas d’usage, limites, confidentialité, tarification et sources primaires.','An initial set of editorial guides covering use cases, limitations, privacy, pricing, and primary sources.'))}
 <div class="dossier-intro"><div><strong>${fmt(items.length)} ${T('fiches approfondies','in-depth profiles')}</strong><p>${fmt(db.quality?.deepProfilesOfficialSourceReviewed||0)} ${T('avec source officielle consultée','with a reviewed official source')} · ${T('Recherche du','Research dated')} ${E(date)}</p></div><a href="/qualite/" data-nav="/qualite/" class="btn btn-secondary">${ico('shield',17)} ${T('Méthodologie','Methodology')}</a></div>
 <p class="research-index-note">${ico('info',16)} ${T('La présence ici indique un travail documentaire éditorial, pas un test indépendant ni une recommandation commerciale. Les offres, droits et fonctionnalités peuvent changer.','Inclusion indicates editorial research, not independent testing or commercial endorsement. Plans, rights and features can change.')}</p>
 ${fams.map(f=>{const arr=items.filter(t=>category(t.categorySlug)?.family===f.id);return `<section class="dossiers-family"><div class="section-title"><div><span class="section-eyebrow">${fmt(arr.length)} ${T('DOSSIERS','PROFILES')}</span><h2>${E(familyName(f))}</h2></div></div><div class="tools-grid">${arr.map(toolCard).join('')}</div></section>`}).join('')}`;
}

function agentsPage(){
 const categorySlugs=['agents-ia-personnels','agents-web-navigateurs','agents-ia-programmation','agents-ia-entreprise','agents-vocaux-et-telephonie','plateformes-agents-ia'];
 const cats=categorySlugs.map(s=>category(s)).filter(Boolean);
 const legacy=category('agents-autonomes-et-orchestration');
 const picked=['Muse (Meta)','Dots (OpenAI)','Gemini Spark','ChatGPT agent','Claude Cowork','OpenClaw'].map(n=>db.tools.find(t=>t.name===n)).filter(Boolean);
 const total=db.tools.filter(t=>t.agentType).length;
 return `${headline(T('PANORAMA DES AGENTS IA','AI AGENTS LANDSCAPE'),T('Des assistants qui agissent, pas seulement qui répondent.','Assistants that act, not just answer.'),T('Agents personnels, Web, programmation, métiers et plateformes de développement. Chaque fiche distingue les sources et les éléments encore à vérifier.','Personal, browser, coding, enterprise and developer agent platforms. Each profile separates sourced claims from items still to verify.'))}
 <div class="dossier-intro"><div><strong>${fmt(total)} ${T('nouvelles références ajoutées','new references added')}</strong><p>${fmt(cats.length)} ${T('domaines spécialisés, plus les agents déjà répertoriés','specialized areas, plus existing agent entries')}</p></div><a href="/repertoire/" data-nav="/repertoire/" class="btn btn-secondary">${ico('search',17)} ${T('Rechercher','Search directory')}</a></div>
 <p class="research-index-note">${ico('info',16)} ${T('Agent : système qui peut effectuer des tâches en plusieurs étapes, utiliser des outils et parfois poursuivre un travail autonome. Les accès, capacités et prix varient selon le fournisseur, la région et la version. Ce panorama n’est pas exhaustif.','Agent: a system that can complete multi-step tasks, use tools and sometimes work autonomously. Access, capabilities and pricing vary by vendor, region and release. This directory is not exhaustive.')}</p>
 <section class="section-block"><div class="section-title"><div><span class="section-eyebrow">${T('À DÉCOUVRIR','FEATURED AGENTS')}</span><h2>Muse, Dots & ${T('leurs alternatives','alternatives')}</h2></div></div><div class="tools-grid">${picked.map(t=>toolCard(t)).join('')}</div></section>
 <section class="section-block"><div class="section-title"><div><span class="section-eyebrow">${T('EXPLORER','EXPLORE')}</span><h2>${T('Par type d’agent','By agent type')}</h2></div></div><div class="category-grid">${cats.map(catCard).join('')}${legacy?catCard(legacy):''}</div></section>
 ${cats.map(c=>{const all=db.tools.filter(t=>t.category===c.name||t.secondaryCategories.includes(c.name)).sort((a,b)=>a.name.localeCompare(b.name));return `<section class="section-block"><div class="section-title"><div><span class="section-eyebrow">${fmt(all.length)} ${T('RÉFÉRENCES','ENTRIES')}</span><h2>${E(cName(c))}</h2><p>${E(state.lang==='ar'?c.descriptionAr||c.descriptionEn:state.lang==='fr'?c.descriptionFr:c.descriptionEn)}</p></div><a href="/categories/${c.slug}/" data-nav="/categories/${c.slug}/" class="text-link">${T('Tout afficher','View all')} ${ico('arrow',16)}</a></div><div class="tools-grid">${all.slice(0,8).map(t=>toolCard(t)).join('')}</div></section>`}).join('')}
 <p class="research-index-note">${ico('shield',16)} ${T('Les fiches Muse et Dots reposent sur des sources officielles. Les autres présentations décrivent les offres annoncées; vérifiez toujours les conditions en vigueur avant de confier des données ou des actions sensibles.','Muse and Dots profiles are based on official sources. Other summaries describe vendor offerings; always verify current terms before delegating sensitive data or actions.')}</p>`;
}

function categoryPage(c){if(!c)return notFound();const arr=db.tools.filter(t=>t.category===c.name||t.secondaryCategories.includes(c.name));const byPrimary=db.tools.filter(t=>t.category===c.name);const fam=db.families.find(f=>f.id===c.family);
 const related=db.categories.filter(x=>x.family===c.family&&x.slug!==c.slug).slice(0,5);
 return `${breadcrumbs([T('Catégories','Categories'),'/categories/'],[cName(c),null])}<div class="category-hero" style="--category-accent:${catHue(c)}"><span class="category-hero-icon">${catIcon(c)}</span><div><div class="eyebrow">${E(familyName(fam))}</div><h1>${E(cName(c))}</h1><p>${E(state.lang==='ar'?c.descriptionAr||'استكشف الأدوات ضمن هذا التصنيف.':state.lang==='fr'?c.descriptionFr||'Explorer les outils de cette catégorie.':c.descriptionEn||'Explore tools in this category.')}</p><span class="category-hero-num">${byPrimary.length} ${T('outils principaux','primary entries')}${arr.length>byPrimary.length?` · ${arr.length-byPrimary.length} ${T('références secondaires','secondary references')}`:''}</span></div></div>
 <div class="section-title category-results-title"><div><h2>${T('Outils associés','Associated tools')}</h2><p>${fmt(arr.length)} ${T('fiches répertoriées','listed entries')}</p></div><a href="/repertoire/" data-nav="/repertoire/" class="text-link">${T('Tout le répertoire','Entire directory')} ${ico('arrow',16)}</a></div><div class="tools-grid">${arr.sort((a,b)=>a.name.localeCompare(b.name)).map(t=>toolCard(t)).join('')}</div>
 ${related.length?`<section class="section-block"><div class="section-title"><div><h2>${T('Catégories voisines','Related categories')}</h2></div></div><div class="category-grid">${related.map(catCard).join('')}</div></section>`:''}`;
}
function field(label, content){return `<div class="info-field"><dt>${label}</dt><dd>${content}</dd></div>`;}
function researchPanel(t){
 const r=t.research;if(!r)return '';
 const fr=state.lang==='fr',ar=state.lang==='ar';
 const bullet=(a)=>Array.isArray(a)?a.map(v=>`<li>${ico('check',14)}<span>${E(v)}</span></li>`).join(''):'';
 const panel=(title,body,icon='book')=>`<section class="research-section"><div class="research-section-head">${ico(icon,18)}<h3>${title}</h3></div>${body}</section>`;
 const paragraph=(value)=>Array.isArray(value)?value.join(' · '):String(value||'');
 const list=(heading,key,icon)=>panel(heading,`<ul class="research-bullets">${bullet(r[key]||[])}</ul>`,icon);
 const sources=(r.sources||[]).filter(s=>urlSafe(s.url));
 const sourceRows=sources.map((s,i)=>`<li><a href="${E(s.url)}" target="_blank" rel="noopener noreferrer">${ico('external',15)}<span>${E(new URL(s.url).hostname)} · ${fr?'Document fournisseur':ar?'وثيقة المزوّد':'Vendor documentation'} ${i+1}</span></a></li>`).join('');
 return `<section class="research-dossier" aria-labelledby="dossier-${E(t.id)}"><div class="research-cover"><div><span class="research-eyebrow">${ico('book',16)} ${fr?'DOSSIER DOCUMENTAIRE APPROFONDI':ar?'ملف بحثي موثق':'DETAILED RESEARCH DOSSIER'}</span><h2 id="dossier-${E(t.id)}">${fr?'Comprendre et choisir':ar?'التعرّف على':'Understand and evaluate'} ${E(t.name)}</h2><p>${E(ar?(t.descriptionAr||t.descriptionEn||r.headline||''):r.headline||'')}</p></div><div class="research-labels"><span class="research-pill">${ico('clock',14)} ${E(r.reviewedAt||'')}</span><span class="research-pill ${r.status==='discontinued'?'research-alert':'research-reviewed'}">${ico(r.status==='discontinued'?'alert':'shield',13)} ${r.status==='discontinued'?T('Service arrêté','Discontinued'):sources.length?T('Sources officielles consultées','Official sources reviewed'):T('Synthèse éditoriale','Editorial overview')}</span></div></div>
 <p class="research-note">${fr?'Ces informations résument la documentation consultée à la date indiquée. Elles ne constituent pas un test fonctionnel, une certification de sécurité ni une garantie de tarif. Les détails peuvent évoluer.':ar?'يعتمد هذا الملف على الوثائق المراجعة في التاريخ المبين. وهو ليس اختبارًا عمليًا ولا شهادة أمنية أو ضمانًا للأسعار؛ وقد تتغير المعلومات.':'This editorial dossier summarizes vendor documentation on the date shown. It is not hands-on testing, security certification or a pricing guarantee. Details may change.'}</p>
 ${!fr?`<p class="research-note">${ico('globe',15)} ${ar?'التفاصيل البحثية الكاملة متاحة حاليًا بالفرنسية. يتوفر الملخص بالعربية، وتُحفظ الروابط إلى الوثائق الأصلية أدناه.':'Editorial detail currently available in French; short English summaries and the official links remain available above.'}</p>`:''}
 ${fr?`<div class="research-columns">${list('Publics concernés','audiences','target')}${list('Cas d’usage concrets','cases','spark')}${list('Points forts','advantages','check')}${list('Limites et précautions','limits','alert')}</div>
 <div class="research-columns research-lower">${panel('Comment commencer',`<p>${E(paragraph(r.gettingStarted))}</p>`,'compass')}${panel('Modèle économique',`<p>${E(r.pricing||'')}</p>`,'chart')}${panel('Confidentialité et responsabilité',`<p>${E(r.privacy||'')}</p>`,'shield')}${panel('Quand choisir cet outil ?',`<p>${E(paragraph(r.selection))}</p>`,'compare')}</div>
 ${(r.examples||[]).length?`<div class="research-example">${ico('message',18)}<div><strong>Exemples de demandes</strong><ul>${(r.examples||[]).map(v=>`<li>${E(v)}</li>`).join('')}</ul></div></div>`:''}`:''}
 <div class="research-sources"><h3>${ico('link',18)} ${fr?'Documents de référence':ar?'الوثائق والمصادر المرجعية':'Source documents'}</h3>${sources.length?`<ol>${sourceRows}</ol>`:`<p>${fr?'Aucune source primaire vérifiée à ce stade.':ar?'لم تُراجع أي مصادر أولية فرديًا حتى الآن.':'No individually reviewed primary source yet.'}</p>`}<small>${fr?'Date de recherche éditoriale :':ar?'تاريخ البحث التحريري:':'Research date:'} ${E(r.reviewedAt)} · ${fr?'Toujours vérifier les conditions en vigueur avant une décision.':ar?'تحقق من الشروط الحالية قبل اتخاذ قرار.':'Always verify current terms before deciding.'}</small></div></section>`;
}
function toolPage(t){if(!t)return notFound();const c=category(t.categorySlug),url=urlSafe(t.url),sid=t.secondaryCategories.map(n=>db.categories.find(x=>x.name===n)).filter(Boolean);const siblings=db.tools.filter(x=>x.id!==t.id&&(x.category===t.category||x.secondaryCategories.includes(t.category))).sort((a,b)=>a.name.localeCompare(b.name)).slice(0,4);
 const described=!!t.descriptionFr,priced=!!t.pricing?.sourceUrl,desc=toolDesc(t);
 const getEconomy=()=>{
  const model=t.pricing?.model;
  const labels={
    freemium:[ 'Gratuit + offres payantes','Free + paid plans'],
    paid:['Payant','Paid'],
    usage_based:['Paiement à l’usage','Usage-based'],
    open_source_and_paid:['Open source + offres commerciales','Open source + commercial plans'],
    open_source:['Open source','Open source'],
    discontinued:['Service arrêté','Discontinued'],
    free:['Gratuit','Free']
  };
  if(model==='unknown'||t.pricingStatus==='identity_unresolved')return {label:T('Non déterminé','Not established'),verified:false};
  if(labels[model])return {label:T(...labels[model]),verified:!!t.pricing?.sourceUrl};
  const raw=String(t.research?.pricing||'').toLowerCase();
  // Only classify explicit product-specific statements, never general advice to check fees.
  if(raw && !/(vérifier|comparer|consulter|selon le fournisseur|check|verify|compare pricing)/.test(raw.slice(0,80))){
    const free=/\bgratuit(?:e|ement)?\b|\bfree\b/.test(raw);
    const paid=/\bpayant(?:e|s)?\b|\babonnement(?:s)?\b|\bpro\b|\bpremium\b|\bplus\b|\bcommerciale?s?\b/.test(raw);
    if(free&&paid)return {label:T('Gratuit + offres payantes','Free + paid plans'),verified:false};
    if(/\bopen[ -]source\b/.test(raw))return {label:'Open source',verified:false};
    if(/\bà l.usage\b|\bpar appel\b|\bpar requête\b|\bpar token\b|\busage.based\b/.test(raw))return {label:T('Paiement à l’usage','Usage-based'),verified:false};
    if(free && !paid && /^(gratuit|accès gratuit|service gratuit|utilisation gratuite)/.test(raw))return {label:T('Gratuit','Free'),verified:false};
    if(/\bsur devis\b|\bcontrat entreprise\b/.test(raw))return {label:T('Sur devis','Custom quote'),verified:false};
  }
  return {label:T('Conditions à consulter chez l’éditeur','See provider terms'),verified:false};
 };
 const economy=getEconomy();
 const platform=t.accessFr?E(state.lang==='fr'?t.accessFr:(t.accessEn||t.accessFr)):
   url?(new URL(url).hostname==='github.com'?T('Dépôt GitHub public','Public GitHub repository'):T('Site officiel en ligne','Official website online')):
   T('Mode d’accès non confirmé','Access method unconfirmed');
 const economicLabel=E(economy.label);
 const economicSource=(t.pricingStatus==='identity_unresolved'||t.pricing?.model==='unknown')?'':(urlSafe(t.pricing?.sourceUrl||'')||url)?` <a href="${E(urlSafe(t.pricing?.sourceUrl||'')||url)}" target="_blank" rel="noopener noreferrer">${T('Vérifier les conditions','Check terms')} ${ico('external',13)}</a>`:'';
 const summary=described?`<p class="editorial-intro" ${state.lang==='ar'?'lang="'+(t.descriptionAr?'ar':'en')+'" dir="'+(t.descriptionAr?'rtl':'ltr')+'"':''}>${E(desc)}</p>${state.lang==='ar'?`<p class="editorial-note" lang="ar">${t.descriptionAr?'ملخص تحريري باللغة العربية. تُعرض بعض التفاصيل الفنية بلغة المصدر.':'لم يُترجم هذا الوصف إلى العربية بعد؛ يُعرض مؤقتًا باللغة الإنجليزية.'}</p>`:''}<p class="editorial-note">${ico('info',16)} ${T('Synthèse éditoriale à recouper avec la documentation du fournisseur.','Editorial summary; confirm details with the vendor documentation.')}</p>`:`<div class="editorial-empty">${ico('book',19)}<p>${T('Aucune description fonctionnelle suffisamment fiable n’est encore disponible pour cette référence. Consultez son site et ses documents officiels ; cette fiche est à enrichir.','No sufficiently reliable functional description has been documented for this entry yet. Consult the vendor website and official documents; this record needs enrichment.')}</p></div>`;
 return `${breadcrumbs([T('Répertoire','Directory'),'/repertoire/'],[cName(c),`/categories/${c.slug}/`],[t.name,null])}
 <div class="tool-detail-hero"><div class="detail-logo-wrap">${toolLogo(t)}</div><div class="detail-head"><div class="eyebrow">${E(t.id)} <span class="tiny-separator">/</span> ${T('FICHE OUTIL','TOOL PROFILE')}</div><h1>${E(t.name)}</h1><div class="detail-pills"><a href="/categories/${c.slug}/" data-nav="/categories/${c.slug}/" class="pill pill-accent">${E(cName(c))}</a>${state.lang==='ar'&&t.descriptionAr?'<span class="pill pill-neutral" lang="ar">وصف بالعربية</span>':''}<span class="pill ${priced?'pill-sourced':'pill-amber'}">${ico(priced?'check':'clock',13)} ${t.availabilityStatus==='discontinued'?T('Service arrêté','Discontinued'):t.availabilityStatus==='sunsetting'?T('Fin de vie annoncée','Sunsetting'):t.research?T('Fiche approfondie','Detailed profile'):priced?T('Tarif documenté','Pricing documented'):described?T('Présentation éditoriale','Editorial summary'):T('À documenter','Research pending')}</span></div></div><div class="detail-actions"><button class="btn btn-secondary ${inFav(t)?'btn-chosen':''}" data-action="favorite" data-id="${t.id}">${ico('heart',17)} ${inFav(t)?T('Enregistré','Saved'):T('Favori','Save')}</button><button class="btn btn-secondary ${inComp(t)?'btn-chosen':''}" data-action="compare" data-id="${t.id}">${ico('compare',18)} ${inComp(t)?T('Dans le comparateur','Added to compare'):T('Comparer','Compare')}</button>${url&&t.availabilityStatus!=='discontinued'?`<a class="btn btn-primary" href="${E(url)}" target="_blank" rel="noopener noreferrer nofollow">${T('Accéder au site','Visit website')} ${ico('external',16)}</a>`:''}</div></div>
 <div class="detail-layout"><section class="detail-panel"><div class="panel-head"><span class="panel-icon">${ico('book',19)}</span><h2>${T('Présentation de l’outil','About the tool')}</h2></div><div class="neutral-description">${summary}${t.featuresFr?.length?`<div class="feature-block"><h3>${T('Fonctionnalités documentées','Documented capabilities')}</h3><ul>${(state.lang==='fr'?t.featuresFr:t.featuresEn||t.featuresFr).map(f=>`<li>${ico('check',15)} ${E(f)}</li>`).join('')}</ul><p class="editorial-note">${T('Fonctionnalités mentionnées dans les sources consultées ; les limites dépendent des forfaits.','Features mentioned in checked sources; availability depends on plans.')}</p></div>`:''}</div>
 <div class="panel-head middle"><span class="panel-icon">${ico('info',19)}</span><h2>${T('Informations pratiques','Practical information')}</h2></div><dl class="info-fields">${field(T('Plateformes et accès','Platforms and access'),platform)}${field(T('Modèle économique','Business model'),`<span>${economicLabel}</span>${economicSource}`)}</dl>
 <div class="panel-head middle"><span class="panel-icon">${ico('layers',19)}</span><h2>${T('Classification et domaines','Classification and areas')}</h2></div><dl class="info-fields">${field(T('Catégorie principale','Primary category'),`<a href="/categories/${c.slug}/" data-nav="/categories/${c.slug}/">${E(cName(c))}</a>`)}${field(T('Autres catégories','Other categories'),sid.length?sid.map(s=>`<a href="/categories/${s.slug}/" data-nav="/categories/${s.slug}/" class="tag-link">${E(cName(s))}</a>`).join(' '):T('Non renseignées','Not listed'))}${field(T('Type de ressource','Resource type'),E(toolKind(t.kind)))}</dl>
 </section><aside class="detail-aside"><div class="side-detail-panel"><h3>${ico('shield',18)} ${T('Sources et fiabilité','Sources and reliability')}</h3><div class="verification-card ${priced?'has-source':''}"><span class="verification-indicator">${priced?'✓':'!'}</span><div><strong>${priced?T('Tarification sourcée','Pricing sourced'):described?T('Résumé éditorial','Editorial summary'):T('Documentation à enrichir','Documentation incomplete')}</strong><p>${priced?T('Tarifs renseignés à partir de la page officielle consultée. La fiche complète reste à vérifier.','Pricing checked on the official page. The entire profile is not fully verified.'):T('Aucune vérification complète et individuelle du service n’a été effectuée.','No complete individual verification of the service has been completed.')}</p></div></div><dl class="compact-fields">${field(T('Référence','Reference'),E(t.id))}${field(T('Inventorié le','Inventoried on'),E(t.inventoriedAt))}${field(T('Présentation','Overview'),described?T('Synthèse éditoriale','Editorial summary'):T('Non disponible','Unavailable'))}${field(T('Tarification','Pricing'),priced?`${T('Source officielle ·','Official source ·')} ${E(t.pricing.verifiedAt)}`:T('Non contrôlée','Not checked'))}${field(T('Site répertorié','Listed website'),url?`<a href="${E(url)}" target="_blank" rel="noopener noreferrer nofollow">${E(new URL(url).hostname)} ${ico('external',13)}</a>`:T('Non renseigné','Not listed'))}${field(T('Source de découverte','Discovery source'),urlSafe(t.source)?`<a href="${E(t.source)}" target="_blank" rel="noopener noreferrer nofollow">${T('Voir le catalogue','View directory')} ${ico('external',13)}</a>`:T('Non renseignée','Not listed'))}</dl>${t.officialSource&&urlSafe(t.officialSource)?`<div class="source-reference editorial-source-reference"><strong>${T('Documentation officielle consultée','Official documentation consulted')}</strong><a href="${E(urlSafe(t.officialSource))}" target="_blank" rel="noopener noreferrer">${E(new URL(t.officialSource).hostname)} ${ico('external',14)}</a><small>${T('Consultée le','Consulted on')} ${E(t.sourceReviewedAt||'')} · ${T('Description documentaire, non test indépendant.','Editorial description, not independent testing.')}</small>${t.currentName?`<small>${T('Nom actuel','Current name')} : ${E(t.currentName)}</small>`:''}</div>`:''}${priced?`<div class="source-reference"><strong>${T('Page officielle des tarifs','Official pricing page')}</strong><a href="${E(t.pricing.sourceUrl)}" target="_blank" rel="noopener noreferrer">${E(new URL(t.pricing.sourceUrl).hostname)} ${ico('external',14)}</a></div>`:''}${t.sharedUrlCount>1?`<div class="shared-alert">${ico('info',16)} ${T('Adresse utilisée par plusieurs références : pas de fusion automatique.','URL shared by several entries; no automatic merging.')}</div>`:''}</div>
 <div class="side-detail-panel"><h3>${ico('link',18)} ${T('Partager et contribuer','Share and contribute')}</h3><button class="side-full-btn" data-action="copy-page">${ico('copy',17)} ${T('Copier le lien de cette fiche','Copy profile link')}</button><button class="side-full-btn" data-action="feedback" data-id="${t.id}">${ico('message',17)} ${T('Préparer un signalement','Prepare an issue report')}</button><p class="fineprint">${T('Le signalement est copié localement ; aucun envoi automatique.','Issue reports are copied locally; nothing is sent automatically.')}</p></div></aside></div>
 ${researchPanel(t)}
 ${siblings.length?`<section class="section-block related-block"><div class="section-title"><div><span class="section-eyebrow">${T('DÉCOUVERTE','DISCOVERY')}</span><h2>${T('Dans la même catégorie','In the same category')}</h2><p>${T('Autres références de la même famille, sans classement de qualité.','Other entries in this category, not a ranking.')}</p></div></div><div class="tools-grid">${siblings.map(t=>toolCard(t)).join('')}</div></section>`:''}`;
}
function needsPage(){let chosen=new URLSearchParams(location.search).get('besoin');const active=needs.find(n=>n[0]===chosen);const arr=active?db.tools.filter(t=>active[4].includes(t.category)||t.secondaryCategories.some(c=>active[4].includes(c))).sort((a,b)=>a.name.localeCompare(b.name)):[];
 return `${headline(T('PARCOURS PAR BESOINS','EXPLORE BY USE CASE'),T('Vous avez un objectif. Trouvons une piste.','Have a goal? Find a starting point.'),T('Ces parcours regroupent des catégories du référentiel ; ils ne certifient pas les fonctionnalités individuelles.','These paths group documented categories; they do not certify individual product capabilities.'))}<div class="needs-grid needs-page-grid">${needs.map(needCard).join('')}</div>${active?`<section class="section-block"><div class="section-title"><div><span class="section-eyebrow">${T('PARCOURS SÉLECTIONNÉ','SELECTED PATH')}</span><h2>${T(active[2],active[3])}</h2><p>${fmt(arr.length)} ${T('références issues des catégories associées','entries from relevant categories')}</p></div><a href="/besoins/" data-nav="/besoins/" class="text-link">${T('Effacer la sélection','Clear selection')} ${ico('x',16)}</a></div><div class="tools-grid">${arr.slice(0,48).map(toolCard).join('')}</div>${arr.length>48?`<p class="more-note">${T('48 premières références affichées sur','First 48 entries shown out of')} ${arr.length}.</p>`:''}</section>`:''}`;
}
function comparePage(){const query=new URLSearchParams(location.search).get('ids');const ids=query?query.split(',').filter(Boolean).slice(0,4):state.compare;const arr=ids.map(id=>db.tools.find(t=>t.id===id)).filter(Boolean);
 return `${headline(T('OUTIL DE COMPARAISON','TOOL COMPARISON'),T('Comparez sans idées reçues.','Compare without assumptions.'),T('Les cellules non vérifiées restent explicitement indiquées, et non déduites du nom ou de la réputation de l’outil.','Unverified facts are clearly marked, never inferred from a tool’s name or popularity.'))}
 ${!arr.length?`<div class="empty-state large-empty">${ico('compare',34)}<h2>${T('Votre comparateur est vide','Your comparison is empty')}</h2><p>${T('Choisissez jusqu’à quatre outils dans le répertoire pour afficher leurs différences documentées.','Select up to four tools from the directory to compare their documented fields.')}</p><a class="btn btn-primary" href="/repertoire/" data-nav="/repertoire/">${T('Explorer les outils','Explore tools')} ${ico('arrow',17)}</a></div>`:
 `<div class="compare-intro"><div><strong>${arr.length} / 4 ${T('outils sélectionnés','selected tools')}</strong><p>${T('Les champs non renseignés n’indiquent pas l’absence de fonctionnalité.','Unknown data does not mean a feature is unavailable.')}</p></div><div class="compare-actions"><button class="btn btn-secondary" data-action="share-compare">${ico('copy',16)} ${T('Copier la comparaison','Copy comparison link')}</button><button class="btn btn-secondary" data-action="clear-compare">${ico('x',16)} ${T('Effacer','Clear')}</button></div></div><div class="compare-scroll"><table class="compare-table"><thead><tr><th>${T('Critère','Criterion')}</th>${arr.map(t=>`<th><div class="compare-tool-head">${toolLogo(t)}<a href="/outils/${t.slug}/" data-nav="/outils/${t.slug}/">${E(t.name)}</a><button class="mini-control" data-action="compare" data-id="${t.id}" title="${T('Retirer','Remove')}">${ico('x',15)}</button></div></th>`).join('')}</tr></thead><tbody>
 ${compareRow(T('Catégorie principale','Primary category'),arr.map(t=>E(cName(category(t.categorySlug)))))}
 ${compareRow(T('Autres catégories','Other categories'),arr.map(t=>t.secondaryCategories.length?E(t.secondaryCategories.join(' · ')):T('Non renseignées','Not listed')))}
 ${compareRow(T('Nature','Type'),arr.map(t=>E(toolKind(t.kind))))}
 ${compareRow(T('Adresse web','Website'),arr.map(t=>t.url?`<a href="${E(t.url)}" target="_blank" rel="noopener noreferrer nofollow">${T('Site renseigné','Listed site')} ${ico('external',13)}</a>`:T('Non renseignée','Not listed')))}
 ${compareRow(T('Présentation','Overview'),arr.map(t=>t.descriptionFr?E(toolDesc(t)):`<span class="unknown">${T('Non documentée','Not documented')}</span>`))}
 ${compareRow(T('Fonctions documentées','Documented capabilities'),arr.map(t=>t.featuresFr?.length?E((state.lang==='fr'?t.featuresFr:t.featuresEn||t.featuresFr).join(' · ')):`<span class="unknown">${T('Non confirmées','Not confirmed')}</span>`))}
 ${compareRow(T('Tarification','Pricing'),arr.map(t=>t.pricing?.sourceUrl?`${E(state.lang==='fr'?t.pricing.fr:t.pricing.en)}<p><a target="_blank" rel="noopener noreferrer" href="${E(t.pricing.sourceUrl)}">${T('Source officielle','Official source')} ${ico('external',12)}</a></p>`:`<span class="unknown">${T('Non vérifiée','Not verified')}</span>`))}
 ${compareRow(T('API','API'),arr.map(()=>`<span class="unknown">${T('Non vérifiée','Not verified')}</span>`))}
 ${compareRow(T('Langues','Languages'),arr.map(()=>`<span class="unknown">${T('Non vérifiées','Not verified')}</span>`))}
 ${compareRow(T('Fiabilité documentaire','Data verification'),arr.map(t=>t.pricing?.sourceUrl?`<span class="pill pill-sourced">${T('Tarif officiel sourcé','Official pricing source')}</span>`:t.descriptionFr?`<span class="pill pill-neutral">${T('Synthèse éditoriale','Editorial summary')}</span>`:`<span class="pill pill-amber">${T('À documenter','Research pending')}</span>`))}
 </tbody></table></div>`}
 <section class="section-block"><div class="section-title"><div><h2>${T('Ajouter un outil','Add a tool')}</h2><p>${T('Recherchez parmi les références de l’inventaire.','Search the original inventory.')}</p></div></div><div class="compare-picker">${ico('search',18)}<label class="sr-only" for="compareSearch">${T('Rechercher un outil','Find a tool')}</label><input id="compareSearch" type="search" placeholder="${T('Rechercher un nom…','Search for a name…')}" autocomplete="off"><div class="compare-picker-results" id="compareResults"></div></div></section>`;
}
function compareRow(label,values){return `<tr><th scope="row">${label}</th>${values.map(v=>`<td>${v}</td>`).join('')}</tr>`;}
function savedPage(){const items=state.favorites.map(id=>db.tools.find(t=>t.id===id)).filter(Boolean);
 return `${headline(T('VOTRE SÉLECTION','YOUR COLLECTION'),T('Une bibliothèque à vous.','Your own collection.'),T('Vos favoris sont conservés uniquement dans ce navigateur. Aucun compte n’est nécessaire.','Favorites stay in this browser only. No account is required.'))}<div class="saved-summary">${ico('heart',20)} <strong>${items.length}</strong> ${T('outils enregistrés','saved tools')} <a href="/comparateur/" data-nav="/comparateur/">${T('Voir le comparateur','Open comparator')} ${ico('arrow',16)}</a></div>${items.length?`<div class="tools-grid">${items.map(toolCard).join('')}</div>`:`<div class="empty-state">${ico('heart',32)}<h2>${T('Pas encore de favoris','No favorites yet')}</h2><p>${T('Enregistrez les ressources qui vous intéressent depuis leurs fiches.','Save tools you want to revisit from their records.')}</p><a href="/repertoire/" data-nav="/repertoire/" class="btn btn-primary">${T('Explorer','Browse')} ${ico('arrow',16)}</a></div>`}`;
}
function liveQuality(){
 // Recompute after *all* optional editorial overlays have been applied.
 const groups=new Map();
 for(const t of db.tools){
   if(!t.url)continue;
   try{const u=new URL(t.url);const key=u.hostname.toLowerCase()+u.pathname.replace(/\/$/,'');const arr=groups.get(key)||[];arr.push(t.name);groups.set(key,arr)}catch{}
 }
 const candidateSharedUrls=[...groups.entries()].filter(([,names])=>names.length>1).map(([url,names])=>({url,count:names.length,tools:names})).sort((a,b)=>b.count-a.count);
 const missingUrls=db.tools.filter(t=>!t.url).map(t=>({id:t.id,name:t.name,slug:t.slug}));
 const missingAccess=db.tools.filter(t=>!t.accessFr?.trim()||!t.accessEn?.trim());
 const missingPricing=db.tools.filter(t=>!t.pricing?.fr?.trim()||!t.pricing?.en?.trim()||!t.pricing?.model||t.pricing.model==='unknown'||t.pricingStatus==='identity_unresolved');
 const descriptionsPresent=db.tools.filter(t=>t.descriptionFr?.trim()&&t.descriptionEn?.trim()).length;
 const pricingReferenced=db.tools.filter(t=>t.pricing?.sourceUrl&&t.pricingStatus==='official_reviewed').length;
 return {candidateSharedUrls,missingUrls,missingAccess,missingPricing,descriptionsPresent,pricingReferenced};
}
function qualityPage(){const q=db.quality;const audit=liveQuality();const shared=audit.candidateSharedUrls.length;const zero=audit.missingUrls.length;const docs=audit.descriptionsPresent,priced=audit.pricingReferenced,coverage=Math.round(docs*100/db.tools.length);
 const bands=db.categories.slice().sort((a,b)=>b.count-a.count).slice(0,12);const max=bands[0].count;
 return `${headline(T('TRANSPARENCE & SOURCES','TRANSPARENCY & SOURCES'),T('Une base utile commence par des données honnêtes.','A useful catalog starts with honest data.'),T('Suivi réel de l’enrichissement documentaire : descriptions, sources tarifaires et champs à compléter.','Track editorial descriptions, official pricing references and outstanding research.'))}
 <div class="stats-grid quality-stats">${stat('grid',fmt(db.tools.length),T('Entrées uniques','Unique entries'))}${stat('layers',fmt(db.categories.length),T('Catégories primaires','Primary categories'))}${stat('alert',fmt(zero),T('URL manquantes','Missing URLs'))}${stat('link',fmt(shared),T('Adresses partagées','Shared URLs'))}</div>
 <div class="stats-grid quality-stats">${stat('book',fmt(docs),T('Présentations FR/EN','FR/EN summaries'))}${stat('shield',fmt(priced),T('Sources tarifaires documentées','Documented pricing sources'))}${stat('alert',fmt(audit.missingAccess.length),T('Accès à compléter','Access fields to complete'))}${stat('alert',fmt(audit.missingPricing.length),T('Modèles économiques à compléter','Pricing fields to complete'))}</div>
 <div class="quality-columns"><section class="detail-panel"><div class="panel-head"><span class="panel-icon">${ico('chart',18)}</span><h2>${T('Répartition par catégorie','Entries by category')}</h2></div><div class="bar-chart" role="img" aria-label="${T('Top douze catégories par nombre de références','Top twelve categories by number of entries')}">${bands.map(c=>`<a class="bar-row" href="/categories/${c.slug}/" data-nav="/categories/${c.slug}/"><span>${E(cName(c))}</span><div class="bar-track"><span style="width:${100*c.count/max}%;--barcolor:${catHue(c)}"></span></div><strong>${c.count}</strong></a>`).join('')}</div><p class="fineprint">${T('Nombre d’outils dans leur catégorie principale ; une fiche n’est comptée qu’une fois.','Counts reflect primary category assignments only; every entry is counted once.')}</p></section>
 <section class="detail-panel"><div class="panel-head"><span class="panel-icon">${ico('shield',18)}</span><h2>${T('État de validation','Verification status')}</h2></div><div class="quality-ring"><div class="ring-visual">${coverage}<span>%</span></div><div><strong>${T('Fiches avec présentation éditoriale','Profiles with editorial summaries')}</strong><p>${fmt(docs)} / ${fmt(db.tools.length)} · ${fmt(priced)} ${T('fiches avec source tarifaire officielle et statut documenté','profiles with official pricing link and documented status')}</p></div></div><div class="quality-note">${ico('info',17)} ${T('Une présentation éditoriale n’est pas une vérification exhaustive. Les sources tarifaires datées documentent les tarifs et certaines fonctionnalités seulement ; les autres champs restent à contrôler.','An editorial summary is not full verification. Dated official pricing pages cover pricing only; other fields still need checking.')}</div><p class="research-quality-count">${fmt(db.tools.filter(t=>t.research?.status==='documented').length)} ${T('dossiers documentés ;','documented profiles;')} ${fmt(db.tools.filter(t=>t.research?.evidence==='official').length)} ${T('avec sources officielles datées.','with dated official sources.')}</p><div class="panel-head middle"><span class="panel-icon">${ico('download',17)}</span><h2>${T('Données sources','Source files')}</h2></div><div class="download-list"><a href="/sources/atlas_outils_ia_2026.csv" download>${ico('download',17)} ${T('CSV original conservé','Preserved source CSV')} ${ico('arrow',15)}</a><a href="/data/tools.json" download>${ico('download',17)} ${T('JSON normalisé','Normalized JSON')} ${ico('arrow',15)}</a><a href="/data/indexai-catalogue-enrichi.csv" download>${ico('download',17)} ${T('Catalogue enrichi (CSV)','Enriched catalog (CSV)')} ${ico('arrow',15)}</a><a href="/data/quality-report.json" download>${ico('download',17)} ${T('Rapport qualité (JSON)','Quality report (JSON)')} ${ico('arrow',15)}</a></div></section></div>
 <div class="section-block"><div class="section-title"><div><h2>${T('Signalements pour contrôle','Items needing review')}</h2><p>${T('Aucune suppression automatique : ces anomalies sont conservées pour examen humain.','Nothing was auto-deleted: these findings are preserved for human review.')}</p></div></div><div class="quality-columns"><div class="detail-panel"><h3>${T('Adresses manquantes','Missing website addresses')}</h3>${audit.missingUrls.map(x=>`<div class="quality-list-row"><span>${E(x.id)}</span><strong>${E(x.name)}</strong><span class="pill pill-amber">${T('À compléter','Incomplete')}</span></div>`).join('')}</div><div class="detail-panel"><h3>${T('URLs communes à plusieurs fiches','URLs appearing across records')}</h3><p class="fineprint">${T('Certaines plateformes hébergent plusieurs services différents. Une URL partagée ne prouve pas un doublon d’outil.','One platform may host multiple distinct services. A shared URL does not prove that two entries are duplicates.')}</p>${audit.candidateSharedUrls.slice(0,8).map(x=>`<div class="quality-list-row"><span>${x.count}×</span><strong>${E(x.tools.join(' / '))}</strong></div>`).join('')}</div></div></div>
 <section class="section-block"><div class="section-title"><div><h2>${T('Fiches nécessitant un complément','Profiles requiring additional information')}</h2><p>${T('Indicateurs calculés après chargement des enrichissements, sans présumer d’une vérification indépendante.','Indicators calculated after loading enrichment files, without implying independent verification.')}</p></div></div><div class="quality-columns"><div class="detail-panel"><h3>${T('Plateformes et accès à compléter','Platform and access fields to complete')} · ${fmt(audit.missingAccess.length)}</h3>${audit.missingAccess.slice(0,12).map(t=>`<div class="quality-list-row"><strong><a href="/outils/${E(t.slug)}/" data-nav="/outils/${E(t.slug)}/">${E(t.name)}</a></strong></div>`).join('')||`<p>${T('Aucune fiche manquante.','No missing entries.')}</p>`}</div><div class="detail-panel"><h3>${T('Modèle économique à compléter','Pricing model fields to complete')} · ${fmt(audit.missingPricing.length)}</h3>${audit.missingPricing.slice(0,12).map(t=>`<div class="quality-list-row"><strong><a href="/outils/${E(t.slug)}/" data-nav="/outils/${E(t.slug)}/">${E(t.name)}</a></strong></div>`).join('')||`<p>${T('Aucune fiche manquante.','No missing entries.')}</p>`}</div></div></section>
 <div class="method-card"><h2>${T('Principes de la démarche','Editorial principles')}</h2><div class="method-grid"><div><span>01</span><h3>${T('Fidélité à la source','Source fidelity')}</h3><p>${T('Tous les identifiants et toutes les catégories sont conservés.','All original identifiers and categories are preserved.')}</p></div><div><span>02</span><h3>${T('Informations explicitement inconnues','Unknown means unknown')}</h3><p>${T('Aucune inférence gratuite concernant les prix, licences ou fonctions.','No speculative pricing, licensing or capability claims.')}</p></div><div><span>03</span><h3>${T('Traçabilité','Traceability')}</h3><p>${T('Date de collecte, lien et source d’orientation figurent sur chaque fiche.','Inventory date, source and listed URL appear on each record.')}</p></div><div><span>04</span><h3>${T('Amélioration continue','Continuous improvement')}</h3><p>${T('Le rapport de contrôle identifie les données à enrichir et à valider.','The quality report highlights records needing review.')}</p></div></div></div>`;
}
function notFound(){return `<div class="empty-state large-empty">${ico('alert',32)}<h1>${T('Page introuvable','Page not found')}</h1><p>${T('Cette fiche ou catégorie n’existe pas dans le répertoire.','This entry does not exist in the catalog.')}</p><a href="/" data-nav="/" class="btn btn-primary">${T('Retour à l’accueil','Back to home')}</a></div>`;}

/* The animation is lazy-loaded only on the home page; re-renders clean up
   pointer listeners, observers and animation frames before mounting again. */
let nebulaStop = () => {};
let nebulaVersion = 0;
function updateHomeNebula(){
  const version = ++nebulaVersion;
  nebulaStop(); nebulaStop = () => {};
  if(current.type !== 'home') return;
  // The interactive canvas is optional; let the static CSS galaxy paint first.
  const start = () => import('/assets/nebula.js?v=fast-agents-20261118').then(module => {
    if(version !== nebulaVersion || current.type !== 'home') return;
    const stage = $('#indexaiNebula');
    if(stage && typeof module.mountNebula === 'function'){
      try { nebulaStop = module.mountNebula(stage); }
      catch(err){ console.warn('IndexAI atmospheric canvas fallback', err); }
    }
  }).catch(() => { /* CSS gradients remain usable if canvas is unavailable. */ });
  setTimeout(() => {
    if(version!==nebulaVersion || current.type!=='home' || document.visibilityState==='hidden')return;
    if('requestIdleCallback' in window)window.requestIdleCallback(start,{timeout:5000});
    else start();
  }, 1400);
}
function catalogLoading(){
 const label=current.type==='category'?cName(category(current.slug)||{name:'Catégorie',en:'Category'}):current.type==='tool'?current.slug.replace(/-/g,' '):T('Répertoire des outils IA','AI tools directory');
 return `<div class="catalog-route-loading" role="status" aria-live="polite"><span class="catalog-spinner" aria-hidden="true"></span><h1>${E(label)}</h1><p>${T('Les outils de cette rubrique arrivent progressivement. Vous pouvez continuer à naviguer.','Tools for this section are loading progressively. You can keep browsing.')}</p></div>`;
}
function renderView(){const main=$('#mainContent');if(!main)return;let content;
 if(!db.catalogReady && !['home','categories'].includes(current.type))content=catalogLoading();else if(current.type==='home')content=home();else if(current.type==='repertoire')content=directory();else if(current.type==='agents')content=agentsPage();else if(current.type==='dossiers')content=dossiersPage();else if(current.type==='categories')content=categoriesPage();else if(current.type==='category')content=categoryPage(category(current.slug));else if(current.type==='tool')content=toolPage(tool(current.slug));else if(current.type==='besoins')content=needsPage();else if(current.type==='comparateur')content=comparePage();else if(current.type==='favoris')content=savedPage();else if(current.type==='qualite')content=qualityPage();else content=notFound();
 main.innerHTML=content;updateHomeNebula();syncLanguageLinks();document.title=(current.type==='tool'?tool(current.slug)?.name:current.type==='category'?cName(category(current.slug)||{name:'Catégorie',en:'Category'}):T({'home':'Explorer les outils IA','repertoire':'Répertoire','agents':'Agents IA','dossiers':'Dossiers documentés','categories':'Catégories','besoins':'Par besoins','comparateur':'Comparateur','favoris':'Favoris','qualite':'Sources & qualité'}[current.type]||'IndexAI',{'home':'Explore AI tools','repertoire':'Directory','agents':'AI agents','dossiers':'Researched guides','categories':'Categories','besoins':'Use cases','comparateur':'Compare','favoris':'Saved','qualite':'Sources & quality'}[current.type]||'IndexAI'))+' · IndexAI';
}
function render(){document.documentElement.lang=state.lang;document.documentElement.dir=state.lang==='ar'?'rtl':'ltr';document.documentElement.dataset.theme=state.theme;
const canonical=document.querySelector('link[rel="canonical"]');if(canonical){const u=new URL(location.pathname,location.origin);if(['ar','en'].includes(state.lang))u.searchParams.set('lang',state.lang);canonical.href=u.href;}
let meta=document.querySelector('meta[name="description"]');if(meta)meta.content=state.lang==='ar'?'دليل يضم 909 أدوات ومراجع للذكاء الاصطناعي ضمن 55 تصنيفًا، مع البحث والمقارنة والاستكشاف.':state.lang==='en'?'A directory of 909 AI tools and resources in 55 categories. Search, compare and explore.':'Répertoire de 909 outils et ressources d’intelligence artificielle dans 55 catégories. Recherche, comparaison et exploration.';$('#app').innerHTML=shell();renderView();if(current.type==='repertoire'){$('#globalSearch').value=state.search;}if(current.type==='comparateur')updateCompareSearch('');syncLanguageLinks();}
const toast=(msg)=>{const el=$('#toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3200)};
function copy(s,msg){if(navigator.clipboard?.writeText)navigator.clipboard.writeText(s).then(()=>toast(msg),()=>fallbackCopy(s,msg));else fallbackCopy(s,msg)}
function fallbackCopy(s,msg){const ta=document.createElement('textarea');ta.value=s;ta.style.position='fixed';ta.style.left='-9999px';document.body.append(ta);ta.select();try{document.execCommand('copy');toast(msg)}catch{toast(T('Copie impossible','Copy failed'))}ta.remove();}
function updateCompareSearch(val){const el=$('#compareResults');if(!el)return;const q=val.trim();if(!q){el.innerHTML='';return;}const results=db.tools.map(t=>({t,s:score(t,q)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,9);
 el.innerHTML=results.map(({t})=>`<button class="picker-result" data-action="compare" data-id="${t.id}" ${inComp(t)?'disabled':''}>${toolLogo(t)}<span><strong>${E(t.name)}</strong><small>${E(cName(category(t.categorySlug)))}</small></span>${ico(inComp(t)?'check':'plus',17)}</button>`).join('')||`<div class="picker-none">${T('Aucun résultat','No results')}</div>`;
}
function showSuggestions(v){const el=$('#suggestions');if(!el)return;const q=v.trim();if(q.length<2){el.hidden=true;return;}
 if(!db.catalogReady){el.innerHTML=`<span class="suggest-all">${T('Recherche dans le répertoire…','Searching directory…')}</span>`;el.hidden=false;void retryCatalog();return;}
 const results=db.tools.map(t=>({t,s:score(t,q)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,6);
 el.innerHTML=results.map(({t})=>`<a href="/outils/${t.slug}/" data-nav="/outils/${t.slug}/">${toolLogo(t)}<span>${E(t.name)}</span><small>${E(cName(category(t.categorySlug)))}</small></a>`).join('')+`<a class="suggest-all" href="/repertoire/?q=${encodeURIComponent(q)}" data-nav="/repertoire/?q=${encodeURIComponent(q)}">${ico('search',16)} ${T('Voir tous les résultats pour','Search all results for')} « ${E(q)} » ${ico('arrow',15)}</a>`;el.hidden=false;
}
function syncSearchURL(){if(current.type!=='repertoire')return;const u=new URL(location.href);if(state.search.trim())u.searchParams.set('q',state.search);else u.searchParams.delete('q');if(state.lang==='ar'&&state.arabicOnly)u.searchParams.set('ar','1');else u.searchParams.delete('ar');history.replaceState({lang:state.lang},'',u.pathname+u.search);}
async function handleClick(e){const action=e.target.closest('[data-action]');if(action){e.preventDefault();const a=action.dataset.action;
 if(a==='retry-catalog'){void retryCatalog();return;}if(a==='arabic-filter'){state.arabicOnly=!state.arabicOnly;state.page=1;syncSearchURL();renderView();return;}
  if(a==='toggle-menu'){state.mobileMenu=!state.mobileMenu;render();return;}
 if(a==='galaxy-universe'){
   const value=action.dataset.id;
   if(!galaxyUniverses.some(g=>g.id===value)||state.galaxyUniverse===value)return;
   state.galaxyUniverse=value;store('indexai-galaxy-universe',value);
   renderView();
   document.querySelector('.galaxy-universe[data-id="'+value+'"]')?.focus({preventScroll:true});
   return;
 }
 if(a==='theme'){state.theme=state.theme==='dark'?'light':'dark';store('indexai-theme',state.theme);render();return;}
 if(a==='lang'){const next=action.dataset.lang;if(!['fr','en','ar'].includes(next)||next===state.lang)return;try{if(next==='ar')await ensureArabic();}catch(error){toast('Arabic language file could not be loaded');return;}state.lang=next;store('indexai-lang',next);const u=new URL(location.href);if(['ar','en'].includes(next))u.searchParams.set('lang',next);else u.searchParams.delete('lang');history.replaceState({lang:next},'',u.pathname+u.search+u.hash);render();return;}
 if(a==='favorite'){const id=action.dataset.id;state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];store('indexai-favorites',state.favorites);renderView();toast(state.favorites.includes(id)?T('Ajouté aux favoris','Saved to favorites'):T('Retiré des favoris','Removed from favorites'));return;}
 if(a==='compare'){const id=action.dataset.id;if(state.compare.includes(id))state.compare=state.compare.filter(x=>x!==id);else if(state.compare.length>=4){toast(T('Maximum : 4 outils','Maximum 4 tools'));return;}else state.compare.push(id);store('indexai-compare',state.compare);if(current.type==='comparateur'&&new URLSearchParams(location.search).has('ids'))history.replaceState({},'','/comparateur/');render();toast(T('Comparateur mis à jour','Comparison updated'));return;}
 if(a==='layout'){state.view=action.dataset.value;store('indexai-layout',state.view);renderView();return;}
 if(a==='reset'){Object.assign(state,{search:'',category:'',kind:'',link:'all',arabicOnly:false,sort:'az',page:1});syncSearchURL();render();return;}
 if(a==='clear-search'){state.search='';state.page=1;syncSearchURL();render();return;}
 if(a==='page'){state.page=Math.max(1,Number(action.dataset.value));renderView();$('#mainContent')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
 if(a==='copy-page'){copy(location.href,T('Lien copié','Link copied'));return;}
 if(a==='share-compare'){const link=new URL(location.origin+'/comparateur/');link.searchParams.set('ids',state.compare.join(','));copy(link.href,T('Lien de comparaison copié','Comparison link copied'));return;}
 if(a==='clear-compare'){state.compare=[];store('indexai-compare',[]);history.replaceState({},'','/comparateur/');render();return;}
 if(a==='feedback'){const t=db.tools.find(t=>t.id===action.dataset.id);if(t){const msg=`IndexAI — Signalement à examiner\nRéférence : ${t.id} — ${t.name}\nURL de la fiche : ${location.href}\nProblème constaté : [à compléter]\nSource justificative : [à compléter]`;copy(msg,T('Modèle de signalement copié. Complétez-le et transmettez-le à l’équipe éditoriale.','Issue report template copied. Fill it in and send it to the editors.'));}return;}
 }
 const link=e.target.closest('a[data-nav]');if(link && !e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey &&(!link.target||link.target==='_self')){e.preventDefault();state.search=new URL(link.href).searchParams.get('q')||state.search;const to=link.getAttribute('data-nav');if(to.startsWith('/repertoire/')&&!new URL(link.href).searchParams.has('q')&&current.type!=='repertoire')state.search='';nav(to);return;}
 if(!e.target.closest('.global-search')){const sg=$('#suggestions');if(sg)sg.hidden=true;}
}
function handleInput(e){const id=e.target.id;if(id==='globalSearch'){const val=e.target.value;showSuggestions(val);return;}
 if(id==='directorySearch'){const el=e.target;const pos=el.selectionStart;state.search=el.value;state.page=1;syncSearchURL();renderView();const next=$('#directorySearch');next?.focus();try{next?.setSelectionRange(pos,pos)}catch{}return;}
 if(id==='compareSearch'){updateCompareSearch(e.target.value);return;}
}
function handleChange(e){const k=e.target.dataset.filter;if(k){state[k]=e.target.value;state.page=1;renderView();}}
function handleKey(e){if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)&&!e.ctrlKey&&!e.metaKey){e.preventDefault();$('#globalSearch')?.focus();}
 if(e.key==='Escape'){$('#suggestions').hidden=true;$('#globalSearch')?.blur();}
 if(e.key==='Enter'&&e.target.id==='globalSearch'){e.preventDefault();state.search=e.target.value;nav('/repertoire/'+(state.search?'?q='+encodeURIComponent(state.search):''));}
 if(e.key==='Enter'&&e.target.id==='directorySearch'){e.preventDefault();e.target.blur();}
}
async function bootstrap(){history.replaceState({lang:state.lang},'',location.href);document.documentElement.dataset.theme=state.theme;document.documentElement.dir=state.lang==='ar'?'rtl':'ltr';if(state.lang==='ar'){try{await ensureArabic()}catch(e){state.lang='en'}}
 try{const r=await Promise.all(['categories','families','quality-report','featured-tools'].map(n=>fetch('/data/'+n+'.json').then(x=>{if(!x.ok)throw Error(n);return x.json()})));
 [db.categories,db.families,db.quality,db.featured]=r;
 applyArabicDescriptions();
 // Show the usable catalogue immediately; editorial data arrives progressively afterwards.
 // The ordered bundles preserve the original source priority without 113 HTTP requests.
 // Only fetch the bundles needed for a selected tool. Entire editorial corpus
 // is reserved for dossier/quality views where broad coverage matters.
 const loadedBundles=new Map();
 let bundleIndexPromise=null;
 let fullEditorialLoaded=false;
 const loadBundle=async n=>{
   if(!loadedBundles.has(n)){
     const path='/data/indexai-enrichment-bundle-'+String(n).padStart(2,'0')+'.json';
     loadedBundles.set(n,fetch(path).then(r=>{if(!r.ok)throw Error(path+' HTTP '+r.status);return r.json()}).catch(error=>{
       loadedBundles.delete(n);console.warn('IndexAI enrichment unavailable:',path,error);return {};
     }));
   }
   return loadedBundles.get(n);
 };
 const enrichNumbers=async()=>{
   if(current.type==='tool'){
     const slug=current.slug;
     if(!bundleIndexPromise)bundleIndexPromise=fetch('/data/enrichment-index.json').then(r=>{
       if(!r.ok)throw Error('Enrichment index unavailable');return r.json();
     }).catch(e=>{bundleIndexPromise=null;console.warn(e);return {};});
     const index=await bundleIndexPromise;
     return index[slug]||[];
   }
   return Array.from({length:12},(_,i)=>i+1);
 };
 const loadEditorialBundles=async()=>{
   const target=current.type==='tool'?current.slug:null;
   const numbers=await enrichNumbers();
   if(!numbers.length)return;
   const results=await Promise.all(numbers.map(loadBundle));
   for(const updates of results){
     for(const [slug,entry] of Object.entries(updates)){
       const found=db.toolSlug.get(slug);
       if(found)Object.assign(found,entry);
     }
   }
   applyEditorialAdditions();
   if(!target)fullEditorialLoaded=true;
   if(current.type!=='home'&&(!target||(current.type==='tool'&&current.slug===target))&&!document.activeElement?.matches('input,textarea,select'))renderView();
 };
 const needsEditorial=()=>['tool','dossiers','agents','category','besoins','qualite','comparateur','favoris'].includes(current.type);
 let editorialActive=false,editorialRoute='';
 maybeLoadEditorial=()=>{
   if(!db.catalogReady||!needsEditorial())return;
   const key=current.type==='tool'?'tool:'+current.slug:'full';
   if(key==='full'&&fullEditorialLoaded)return;
   if(editorialActive&&editorialRoute===key)return;
   editorialActive=true;editorialRoute=key;
   const start=async()=>{
     if(!needsEditorial()){editorialActive=false;return;}
     try{await loadEditorialBundles();}finally{editorialActive=false;}
   };
   if('requestIdleCallback' in window)window.requestIdleCallback(start,{timeout:2200});
   else setTimeout(start,900);
 };
 db.catSlug=new Map(db.categories.map(c=>[c.slug,c]));
 if(current.type==='repertoire')state.search=new URLSearchParams(location.search).get('q')||'';
 document.addEventListener('click',handleClick);document.addEventListener('input',handleInput);document.addEventListener('change',handleChange);document.addEventListener('keydown',handleKey);
 window.addEventListener('popstate',async()=>{const queryLanguage=new URLSearchParams(location.search).get('lang');state.lang=['fr','en','ar'].includes(queryLanguage)?queryLanguage:(history.state?.lang||'fr');if(state.lang==='ar'){try{await ensureArabic()}catch{state.lang='en'}}current=route();absorbSharedComparison();state.search=new URLSearchParams(location.search).get('q')||'';state.arabicOnly=new URLSearchParams(location.search).get('ar')==='1';render();maybeLoadEditorial();if(!db.catalogReady&&current.type!=='home'&&current.type!=='categories')void retryCatalog();});
 render();
// The homepage is already interactive: fetch the 1 MB catalog only after its first frame.
 let toolsLoading=false;
 retryCatalog=async()=>{
   if(toolsLoading||db.catalogReady)return;
   toolsLoading=true;
   try {
     const [response,editorial] = await Promise.all([
       fetch('/data/tools.json'),
       fetch('/data/editorial-additions-2026-11.json?v=20261124-hr-careers').then(r=>{if(!r.ok)throw Error('Editorial source HTTP '+r.status);return r.json();}).catch(error=>{console.warn('Supplemental editorial profiles unavailable:',error);return {};})
     ]);
     if(!response.ok)throw Error('tools.json HTTP '+response.status);
     const entries=await response.json();
     db.editorialAdditions=editorial;
     if(!Array.isArray(entries))throw Error('Invalid tools catalog');
     db.tools=entries;
     db.tools.forEach(t=>{t.secondaryCategories=t.secondaryCategories||[]});
     applyEditorialAdditions();
     applyArabicDescriptions();
     db.toolSlug=new Map(db.tools.map(t=>[t.slug,t]));
     db.catalogReady=true;
     state.compare=state.compare.filter(id=>db.tools.some(t=>t.id===id)).slice(0,4);
     state.favorites=state.favorites.filter(id=>db.tools.some(t=>t.id===id));
     absorbSharedComparison();
     if(current.type==='home'){
       // Preserve the galaxy animation while only updating sections below the fold.
       const needsRoot=$('#homeNeeds');
       if(needsRoot)needsRoot.innerHTML=needs.slice(0,8).map(needCard).join('');
       const featuredRoot=$('#homeFeatured');
       if(featuredRoot){
         const featured=['ChatGPT','Midjourney','Cursor','Ollama','Gamma','ElevenLabs','Perplexity','Meshy'].map(name=>db.tools.find(t=>t.name===name)).filter(Boolean);
         featuredRoot.innerHTML='<div class="tools-grid">'+featured.map(t=>toolCard(t)).join('')+'</div>';
       }
       const agentNode=$('.orbit-node[href="/agents/"]');
       if(agentNode)agentNode.setAttribute('aria-label',T('Tous les agents IA','All AI agents')+' · '+fmt(db.tools.filter(t=>t.agentType).length)+' '+T('outils','tools'));
     }else renderView();
     maybeLoadEditorial();
     const q=$('#globalSearch')?.value||'';
     if(q.trim().length>=2&&document.activeElement?.id==='globalSearch')showSuggestions(q);
   }catch(error){
     const target=current.type==='home'?$('#homeFeatured'):$('#mainContent');
     if(target)target.innerHTML=`<div class="catalog-load-error" role="alert"><p>${T('Le catalogue ne répond pas pour le moment. L’accueil reste accessible.','The catalog is temporarily unavailable. The homepage remains accessible.')}</p><button class="btn btn-secondary" data-action="retry-catalog">${T('Réessayer','Try again')}</button></div>`;
     console.error('IndexAI tools catalog:',error);
   }finally{toolsLoading=false;}
 };
 // Never download or parse the full 1 MB catalogue while the user stays on home.
 // Categories already have their own lightweight metadata and need no catalogue.
 if(current.type!=='home'&&current.type!=='categories')void retryCatalog();
 }catch(err){const el=$('#app');if(el)el.innerHTML=`<div class="loading-error"><h1>IndexAI</h1><p>${T('Impossible de charger le répertoire. Vérifiez la connexion et le serveur.','Unable to load catalog data. Please check connectivity and the server.')}</p><button onclick="location.reload()">${T('Réessayer','Retry')}</button></div>`;console.error('IndexAI startup:',err);}
}
bootstrap();
})();
