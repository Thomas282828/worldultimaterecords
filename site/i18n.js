/* WorldUltimateRecords — traduction du site (10 langues)
   Le site est écrit en français ; ce fichier remplace les textes affichés
   par leur traduction (dictionnaires dans le dossier i18n/). */
(function(){
"use strict";
const LANGS=[["fr","Français","fr-FR"],["en","English","en-US"],["zh","中文","zh-CN"],["hi","हिन्दी","hi-IN"],["es","Español","es-ES"],
  ["ar","العربية","ar-u-nu-latn"],["bn","বাংলা","bn-u-nu-latn"],["pt","Português","pt-BR"],["ru","Русский","ru-RU"],["id","Bahasa Indonesia","id-ID"]];
const LOC=Object.fromEntries(LANGS.map(l=>[l[0],l[2]]));
let lang="fr", dict=null, pats=[];
const NUM=/[-+−±]?\d+(?:[.,   ]\d{3})*(?:[.,]\d+)?/g;
const norm=s=>s.replace(/[\s  ]+/g," ").trim();
const hasWord=s=>/[A-Za-zÀ-ÿ]/.test(s);
function compile(d){
  pats=[];
  for(const k in d){ if(!/\{\d\}/.test(k))continue;
    const order=[];
    const re=new RegExp("^"+k.replace(/[.*+?^$()|[\]\\]/g,"\\$&").replace(/\{(n|\d)\}/g,(_,p)=>{order.push(p);return p==="n"?"("+NUM.source+")":"(.+?)"})+"$");
    pats.push([re,d[k],order,k.replace(/\{\w\}/g,"").length]);
  }
  pats.sort((a,b)=>b[3]-a[3]);
}
function lookup(src,depth){
  const k=norm(src); if(!k||!hasWord(k))return null;
  if(window.__collect&&!depth){window.__collect.add(k.replace(NUM,"{n}"));}
  if(lang==="fr"||!dict)return null;
  if(dict[k]!=null)return dict[k];
  const r=find(k,depth); if(r==null&&window.__missing&&!depth)window.__missing.add(k); return r;
}
function find(k,depth){
  const nums=k.match(NUM);
  if(nums){const v=dict[k.replace(NUM,"{n}")];if(v!=null){let i=0;return v.replace(/\{n\}/g,()=>nums[i++]??"")}}
  if((depth|0)>4)return null;
  for(const [re,tpl,order] of pats){const m=k.match(re);if(m){
    const g={},ns=[];order.forEach((p,i)=>{if(p==="n")ns.push(m[i+1]);else g[p]=m[i+1]});
    let ni=0;
    return tpl.replace(/\{(n|\d)\}/g,(_,p)=>{if(p==="n")return ns[ni++]??"";const v=g[p];return v==null?"":(lookup(v,(depth|0)+1)??v)});
  }}
  return null;
}
function t(s){const out=lookup(String(s));return out==null?String(s):out}
window.t=t;
window.wurLocale=()=>LOC[lang]||"fr-FR";
window.wurLang=()=>lang;

/* ---- traduction du DOM ---- */
const SKIP=new Set(["SCRIPT","STYLE","TEXTAREA","CODE","SELECT","OPTION"]);
const ATTRS=["placeholder","aria-label","title","alt"];
function skipEl(el){for(let e=el;e;e=e.parentElement){if(SKIP.has(e.tagName)||(e.classList&&(e.classList.contains("plink")||e.classList.contains("notr"))))return true}return false}
function trText(n){
  if(n.__tr===undefined||n.nodeValue!==n.__tr)n.__fr=n.nodeValue;
  const src=n.__fr; if(!src||!hasWord(src)){n.__tr=n.nodeValue;return}
  const out=lookup(src);
  const val=out==null?src:(src.match(/^\s*/)[0]+out+src.match(/\s*$/)[0]);
  if(n.nodeValue!==val)n.nodeValue=val; n.__tr=val;
}
function trAttrs(el){
  el.__frA=el.__frA||{}; el.__trA=el.__trA||{};
  for(const a of ATTRS){const v=el.getAttribute(a);if(v==null)continue;
    if(el.__trA[a]!==v)el.__frA[a]=v;
    const out=lookup(el.__frA[a]);const val=out==null?el.__frA[a]:out;
    if(v!==val)el.setAttribute(a,val); el.__trA[a]=val;}
}
function walk(root){
  if(!root)return;
  if(root.nodeType===3){if(root.parentElement&&!skipEl(root.parentElement))trText(root);return}
  if(root.nodeType!==1||skipEl(root))return;
  const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>skipEl(n.parentElement)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  let n; while((n=tw.nextNode()))trText(n);
  if(root.matches&&root.matches("[placeholder],[aria-label],[title],[alt]"))trAttrs(root);
  root.querySelectorAll&&root.querySelectorAll("[placeholder],[aria-label],[title],[alt]").forEach(el=>{if(!skipEl(el))trAttrs(el)});
}
let pending=new Set(), scheduled=false;
const mo=new MutationObserver(recs=>{
  for(const r of recs){
    if(r.type==="childList")r.addedNodes.forEach(n=>pending.add(n));
    else if(r.type==="characterData")pending.add(r.target);
    else if(r.type==="attributes")pending.add(r.target);
  }
  if(!scheduled){scheduled=true;queueMicrotask(()=>{scheduled=false;const s=pending;pending=new Set();s.forEach(n=>{if(n.isConnected)walk(n)})})}
});

/* ---- choix de la langue ---- */
const cache={};
async function load(code){
  if(code==="fr")return null;
  if(cache[code])return cache[code];
  if(window.WUR_I18N&&window.WUR_I18N[code])return cache[code]=window.WUR_I18N[code];
  const r=await fetch("i18n/"+code+".json",{cache:"no-cache"}); if(!r.ok)throw new Error("dictionnaire introuvable");
  return cache[code]=await r.json();
}
async function setLang(code,save){
  if(!LOC[code])code="fr";
  try{dict=await load(code)}catch(e){console.warn(e);dict=null;code="fr"}
  lang=code; compile(dict||{});
  document.documentElement.lang=code; document.documentElement.dir=code==="ar"?"rtl":"ltr";
  if(save){try{localStorage.setItem("wur_lang",code)}catch(e){}}
  const sel=document.getElementById("langSel"); if(sel)sel.value=code;
  window.dispatchEvent(new Event("wurlang"));
  walk(document.body); document.title=t("WorldUltimateRecords");
}
window.wurSetLang=setLang;
function pick(){
  let s=null; try{s=localStorage.getItem("wur_lang")}catch(e){}
  if(s&&LOC[s])return s;
  for(const l of (navigator.languages||[navigator.language||"fr"])){const c=String(l).slice(0,2).toLowerCase();if(LOC[c])return c}
  return "fr";
}
function mountSelector(){
  const host=document.querySelector(".top-actions"); if(!host||document.getElementById("langSel"))return;
  const sel=document.createElement("select"); sel.id="langSel"; sel.className="langsel notr"; sel.setAttribute("aria-label","Langue / Language");
  sel.innerHTML=LANGS.map(([c,n])=>`<option value="${c}" lang="${c}">${n}</option>`).join("");
  sel.onchange=()=>setLang(sel.value,true);
  host.insertBefore(sel,host.firstChild);
}
function start(){
  mountSelector();
  mo.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS});
  setLang(pick(),false);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
