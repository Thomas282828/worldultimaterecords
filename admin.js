/* =====================================================================
   WorldUltimateRecords : page admin (statistiques)
   Les données ne sont lisibles que par le compte admin : la fonction
   Supabase admin_stats refuse tout autre compte.
   Aperçu sans connexion avec des données fictives : admin.html?demo=1
   ===================================================================== */
(function(){
"use strict";
const CFG=window.WUR_CONFIG||{};
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const nf=new Intl.NumberFormat("fr-FR");
const N=v=>nf.format(Math.round(+v||0));
const P=(a,b)=>b>0?Math.round(100*a/b):null;
const PS=(a,b)=>{const p=P(a,b);return p==null?"–":p+" %"};
const DEMO=/[?&]demo=1/.test(location.search);
const TABS={defis:"Défis",records:"Records",aura:"Battles d'aura",shorts:"Shorts",profil:"Profil",legal:"Mentions légales",membre:"Pass Néon",classement:"Classement",ligue:"Ligues"};
const DEV={mobile:"Téléphone",tablet:"Tablette",desktop:"Ordinateur",inconnu:"Inconnu"};
const DAYS=["","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const LANGS={fr:"Français",en:"Anglais",es:"Espagnol",pt:"Portugais",ar:"Arabe",hi:"Hindi",bn:"Bengali",ru:"Russe",zh:"Chinois",id:"Indonésien",de:"Allemand",it:"Italien",nl:"Néerlandais",tr:"Turc",ja:"Japonais",ko:"Coréen",pl:"Polonais"};
let sb=null, days=Number(lsGet("wur_admin_days"))||30, names={}, data=null, sortState={};

function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
const gname=id=>names[id]||id||"?";
const fdate=d=>{const x=new Date(d+"T12:00:00");return x.toLocaleDateString("fr-FR",{day:"numeric",month:"short"})};
const fdateLong=d=>{const x=new Date(d+"T12:00:00");return x.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})};

/* ---------- noms des jeux : lus dans app.js et dans les défis de la communauté ---------- */
async function loadNames(){
  try{
    const t=await (await fetch("app.js",{cache:"no-cache"})).text();
    const re=/\{id:"([a-z0-9-]+)"[^\n]*?\bname:"([^"]+)"/g; let m;
    while((m=re.exec(t)))if(!names[m[1]])names[m[1]]=m[2];
  }catch(e){}
  if(sb){try{const {data:c}=await sb.from("challenges").select("id,name").limit(1000);(c||[]).forEach(x=>{if(!names[x.id])names[x.id]=x.name})}catch(e){}}
}

/* ---------- connexion ---------- */
async function boot(){
  if(DEMO){await loadNames();data=demoData();$("dash").hidden=false;render();return}
  if(!CFG.supabaseUrl||!CFG.supabaseAnonKey||!window.supabase){showLogin("Supabase n'est pas configuré dans config.js.");return}
  sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true}});
  const {data:{session}}=await sb.auth.getSession();
  if(!session||!session.user||session.user.is_anonymous){showLogin();return}
  await load();
}
function showLogin(msg){
  $("dash").hidden=true; $("loginBox").hidden=false;
  if(msg){$("loginMsg").textContent=msg;$("loginMsg").className="msg bad"}
  $("em").focus();
}
$("loginForm").onsubmit=async e=>{
  e.preventDefault(); if(!sb)return;
  const b=$("loginBtn"), m=$("loginMsg"); b.disabled=true; m.className="msg"; m.textContent="Connexion…";
  const {error}=await sb.auth.signInWithPassword({email:$("em").value.trim(),password:$("pw").value});
  b.disabled=false; $("pw").value="";
  if(error){m.className="msg bad";m.textContent="Connexion refusée : "+(/invalid/i.test(error.message)?"e-mail ou mot de passe incorrect.":error.message);return}
  m.textContent=""; await load();
};
async function logout(){if(sb)await sb.auth.signOut();location.reload()}

async function load(){
  $("loginBox").hidden=true; const d=$("dash"); d.hidden=false;
  if(!data)d.innerHTML=`<p class="msg">Chargement des statistiques…</p>`;
  if(!Object.keys(names).length)await loadNames();
  const {data:res,error}=await sb.rpc("admin_stats",{p_days:days});
  if(error){
    if(/42501|Réservé/i.test(error.code+" "+error.message)){showLogin("Ce compte n'est pas administrateur.");await sb.auth.signOut();return}
    if(/admin_stats|function|schema cache/i.test(error.message)){d.innerHTML=`<div class="card"><h2>Il manque une étape</h2><p class="sub">La base de données n'a pas encore les statistiques. Lance le fichier <b>supabase_stats.sql</b> dans Supabase &gt; SQL Editor, puis recharge cette page.</p><p class="msg bad">${esc(error.message)}</p></div>`;return}
    d.innerHTML=`<div class="card"><p class="msg bad">Erreur : ${esc(error.message)}</p><p><button class="btn" id="retry">Réessayer</button></p></div>`;$("retry").onclick=load;return;
  }
  data=res; render();
}

/* ---------- graphiques (SVG fait main, un seul axe, info-bulle au survol) ---------- */
function barChart(series,opt){
  // series: [{label, tip, v}]
  const W=opt.w||360,H=opt.h||200,pl=36,pr=6,pt=8,pb=22, n=series.length||1;
  const max=Math.max(1,...series.map(s=>s.v)), nice=niceMax(max);
  const bw=(W-pl-pr)/n, gap=Math.min(2,bw*.2), barW=Math.max(1,bw-gap);
  const y=v=>pt+(H-pt-pb)*(1-v/nice);
  const ticks=[0,nice/2,nice];
  let g=ticks.map(t=>`<line class="grid-l" x1="${pl}" x2="${W-pr}" y1="${y(t)}" y2="${y(t)}"/><text class="axis-t" x="${pl-6}" y="${y(t)+4}" text-anchor="end">${N(t)}</text>`).join("");
  const every=Math.ceil(n/(opt.labels||5));
  series.forEach((s,i)=>{
    const x=pl+i*bw, h=Math.max(0,y(0)-y(s.v)), r=Math.min(4,barW/2,h);
    const path=h>0?`M${x},${y(0)} v${-(h-r)} q0,${-r} ${r},${-r} h${barW-2*r} q${r},0 ${r},${r} v${h-r} z`:"";
    g+=`<g data-i="${i}"><rect class="hit" x="${x}" y="${pt}" width="${bw}" height="${H-pt-pb}"/>${path?`<path class="bar" d="${path}"/>`:""}</g>`;
    if(i%every===0||i===n-1&&n<=12)g+=`<text class="axis-t" x="${x+barW/2}" y="${H-6}" text-anchor="middle">${esc(s.label)}</text>`;
  });
  const id="c"+Math.random().toString(36).slice(2,8);
  setTimeout(()=>{const el=$(id);if(!el)return;const tip=el.querySelector(".tip"),svg=el.querySelector("svg");
    el.querySelectorAll("g[data-i]").forEach(gg=>{
      gg.addEventListener("pointerenter",()=>{const s=series[+gg.dataset.i],r=svg.getBoundingClientRect(),k=r.width/W,i=+gg.dataset.i;
        tip.innerHTML=s.tip; tip.style.whiteSpace=r.width<320?"normal":"nowrap"; tip.style.maxWidth=r.width+"px";
        const tw=tip.offsetWidth/2; tip.style.left=Math.min(r.width-tw,Math.max(tw,(pl+i*bw+barW/2)*k))+"px"; tip.style.top=(y(s.v)*k)+"px"; tip.style.opacity=1});
      gg.addEventListener("pointerleave",()=>tip.style.opacity=0)})},0);
  return `<div class="chart" id="${id}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.title||"")}">${g}</svg><div class="tip"></div></div>`;
}
function niceMax(v){const p=Math.pow(10,Math.floor(Math.log10(v))),m=v/p;return (m<=1?1:m<=2?2:m<=5?5:10)*p}
function hbars(rows,opt){
  opt=opt||{}; if(!rows.length)return `<p class="empty">${opt.empty||"Pas encore de données."}</p>`;
  const max=Math.max(1,...rows.map(r=>r.v));
  return rows.map(r=>`<div class="hbar"><span class="nm" title="${esc(r.label)}">${esc(r.label)}</span><span class="tr"><span class="fl" style="width:${(100*r.v/max).toFixed(1)}%"></span></span><span class="n">${N(r.v)}${r.extra?` <small>${r.extra}</small>`:""}</span></div>`).join("");
}
function delta(a,b){
  if(!b&&!a)return `<span class="cmp">–</span>`;
  if(!b)return `<span class="cmp up">nouveau</span>`;
  const p=Math.round(100*(a-b)/b);
  return `<span class="${p>0?"up":p<0?"down":""}">${p>0?"▲ +":p<0?"▼ ":""}${p} %</span>`;
}
function tile(label,val,cmp,hint){return `<div class="card tile"><div class="lab">${label}</div><div class="val">${val}</div><div class="cmp">${cmp||""}</div>${hint?`<div class="note">${hint}</div>`:""}</div>`}

/* ---------- tableaux triables ---------- */
function table(key,cols,rows,defSort){
  const st=sortState[key]||defSort; sortState[key]=st;
  const c=cols.find(x=>x.k===st.k)||cols[0];
  const sorted=rows.slice().sort((a,b)=>{const va=c.sv?c.sv(a):a[c.k],vb=c.sv?c.sv(b):b[c.k];
    const r=(typeof va==="string"?String(va).localeCompare(vb,"fr"):(va==null?-1:va)-(vb==null?-1:vb));return st.dir==="asc"?r:-r});
  return `<div class="tablewrap"><table data-tkey="${key}"><thead><tr>${cols.map(x=>`<th class="${x.r?"r":""}" data-k="${x.k}" title="${esc(x.t||"")}" ${x.k===st.k?`aria-sort="${st.dir==="asc"?"ascending":"descending"}"`:""}>${x.l}</th>`).join("")}</tr></thead>
    <tbody>${sorted.map(r=>`<tr>${cols.map(x=>`<td class="${x.r?"r":""}">${x.f?x.f(r):esc(r[x.k])}</td>`).join("")}</tr>`).join("")||`<tr><td colspan="${cols.length}" class="empty">Pas encore de données.</td></tr>`}</tbody></table></div>`;
}
document.addEventListener("click",e=>{
  const th=e.target.closest("th[data-k]"); if(!th)return;
  const key=th.closest("table").dataset.tkey, k=th.dataset.k, st=sortState[key];
  sortState[key]={k,dir:st&&st.k===k&&st.dir==="desc"?"asc":"desc"}; render();
});

/* ---------- conseils automatiques ---------- */
function ideas(d,games){
  const out=[], k=d.kpi, f=d.funnel;
  const add=(ic,t,s)=>out.push(`<li><span class="ic">${ic}</span><div><b>${t}</b><span>${s}</span></div></li>`);
  if(k.week.visitors||k.prev_week.visitors){
    const p=k.prev_week.visitors?Math.round(100*(k.week.visitors-k.prev_week.visitors)/k.prev_week.visitors):null;
    if(p!=null)add(p>=0?"📈":"📉",`Visiteurs : ${p>=0?"+":""}${p} % sur 7 jours`,p>=0?"Bonne dynamique. Repère ce qui a marché cette semaine (vidéo, Short, partage) et refais-le.":"Moins de visiteurs que la semaine d'avant. Publie un Short qui montre un défi et mets le lien du site en commentaire épinglé.");
  }
  if(f.visitors>=10){
    const pp=P(f.played,f.visitors);
    if(pp!=null&&pp<50)add("🎯",`Seulement ${pp} % des visiteurs finissent une partie`,"Beaucoup arrivent sans jouer. Mets un gros bouton « Joue maintenant » vers le défi le plus joué tout en haut de la page.");
    const rp=P(f.returned,f.visitors);
    if(rp!=null)add("🔁",`${rp} % des visiteurs sont revenus un autre jour`,rp<20?"C'est le chiffre le plus important pour que le jeu devienne une habitude. Idées : un « défi du jour », une série de jours d'affilée, et annoncer les nouveaux défis chaque semaine sur ta chaîne.":"Bonne fidélité ! Continue à sortir de nouveaux défis chaque semaine pour garder l'envie de revenir.");
  }
  const lim=games.reduce((s,g)=>s+(g.limits||0),0);
  const T=d.totals||{};
  if(lim>=3){const b=T.attempts_bought||0;
    add("⛔",`${N(lim)} fois, un joueur a atteint la limite de 3 essais par jour`,b>=lim/2
      ?`Et ${N(b)} essais ont été achetés avec des pièces : les joueurs veulent rejouer et les pièces marchent bien.`
      :`Seulement ${N(b)} essais achetés avec des pièces. Les joueurs n'en ont peut-être pas assez : tu pourrais baisser le prix d'un essai (5 pièces) ou donner plus de pièces par record.`)}
  const tops=games.filter(g=>g.players>=3).sort((a,b)=>b.replayRate-a.replayRate);
  if(tops[0])add("🔥",`Le jeu le plus addictif : ${esc(gname(tops[0].id))}`,`${tops[0].replayRate} % de ses joueurs y rejouent. Mets-le en avant dans tes vidéos et crée des défis du même style.`);
  const weak=games.filter(g=>g.opens>=10&&g.plays/g.opens<.4).sort((a,b)=>a.plays/a.opens-b.plays/b.opens)[0];
  if(weak)add("🧩",`« ${esc(gname(weak.id))} » est souvent abandonné`,`Seulement ${PS(weak.plays,weak.opens)} des ouvertures se terminent par une partie. Ses règles sont peut-être trop longues ou trop dures au début.`);
  const hrs=(d.hours||[]).slice().sort((a,b)=>b.n-a.n)[0];
  if(hrs&&hrs.n>=5)add("⏰",`Les joueurs jouent surtout vers ${hrs.h} h`,`Publie tes Shorts et tes vidéos un peu avant ${hrs.h} h (heure de Paris) pour qu'ils tombent pile au bon moment.`);
  const src=(d.sources||[]).filter(s=>s.id!=="direct")[0];
  if(src)add("📣",`Ta meilleure source : ${esc(src.id)}`,`${N(src.new_users)} nouveaux visiteurs. Pour suivre chaque vidéo, ajoute ?ref=nom-de-la-video à la fin du lien du site, par exemple …/worldultimaterecords/?ref=short-snake.`);
  const sh=k.period.shares||0;
  if(f.played>=10&&P(sh,f.played)<5)add("📤","Les joueurs partagent peu leurs scores","Le partage, c'est de la pub gratuite. Propose un défi à un ami (« bats mon score ») juste après un record personnel.");
  if(!out.length)add("🕒","Les conseils arrivent bientôt","Il faut quelques jours de visites pour que les conseils automatiques deviennent fiables.");
  return out.join("");
}

/* ---------- page ---------- */
function render(){
  const d=data; if(!d)return; const k=d.kpi;
  const games=mergeGames(d);
  const daily=d.daily||[];
  const lab=x=>fdate(x.day);
  const retEl=(d.retention||[]);
  const ret=sumRet(retEl);
  const since=d.tracking_since;
  $("dash").innerHTML=`
  <header class="top">
    <h1>Statistiques WorldUltimateRecords<small>${DEMO?"Aperçu avec des données fictives":"Mis à jour à "+new Date(d.generated_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</small></h1>
    <div class="controls">
      <span class="live" title="Personnes actives ces 5 dernières minutes"><i></i>${N(d.live_now)} en ligne</span>
      <div class="seg" role="group" aria-label="Période">${[7,30,90,365].map(n=>`<button data-days="${n}" aria-pressed="${n===days}">${n===365?"1 an":n+" j"}</button>`).join("")}</div>
      <button class="btn" id="refresh">Actualiser</button>
      ${DEMO?"":`<button class="btn" id="logout">Déconnexion</button>`}
    </div>
  </header>
  ${!since?`<div class="banner">Le suivi des visites vient d'être activé : les chiffres vont se remplir au fil des visites. En attendant, les essais officiels et les tentatives enregistrées avant aujourd'hui sont déjà comptés plus bas.</div>`:since>daily[0]?.day?`<div class="banner">Suivi des visites actif depuis le ${fdateLong(since)}. Avant cette date, seuls les essais officiels et les tentatives enregistrées sont comptés.</div>`:""}

  <div class="grid kpis">
    ${tile("Visiteurs aujourd'hui",N(k.today.visitors),`Hier : ${N(k.yesterday.visitors)}`)}
    ${tile("Visiteurs sur 7 jours",N(k.week.visitors),delta(k.week.visitors,k.prev_week.visitors)+" vs 7 j d'avant")}
    ${tile("Nouveaux sur 7 jours",N(k.week.new),delta(k.week.new,k.prev_week.new)+" vs 7 j d'avant")}
    ${tile("Parties sur 7 jours",N(k.week.plays),delta(k.week.plays,k.prev_week.plays)+" vs 7 j d'avant")}
    ${tile("Fidélité (DAU/MAU)",k.dau_mau==null?"–":String(k.dau_mau).replace(".",",")+" %",`Part des joueurs du mois qui viennent chaque jour`,"Au-dessus de 20 %, le jeu devient une habitude.")}
    ${tile("Parties par joueur et par jour",k.plays_per_player_day==null?"–":String(k.plays_per_player_day).replace(".",","),`Jours actifs par visiteur : ${k.days_per_user==null?"–":String(k.days_per_user).replace(".",",")}`)}
    ${tile("Revenus le lendemain",ret.d1==null?"–":ret.d1+" %",`Revenus dans la semaine : ${ret.w1==null?"–":ret.w1+" %"}`,"Rétention J+1 et J+7, sur la période.")}
    ${tile("Pseudos créés",N(d.totals.pseudos),`${N(d.totals.accounts_with_password)} avec mot de passe · ${N(d.totals.visitors_all_time)} visiteurs suivis`)}
  </div>

  <section class="card"><h2>Idées pour faire grandir le jeu</h2><p class="sub">Calculées automatiquement à partir des chiffres ci-dessous.</p><ul class="ideas">${ideas(d,games)}</ul></section>

  <section class="grid three">
    <div class="card"><h2>Visiteurs par jour</h2><p class="sub">Personnes différentes venues sur le site</p>
      ${barChart(daily.map(x=>({label:lab(x),v:x.visitors,tip:`${fdate(x.day)} : <b>${N(x.visitors)}</b> visiteurs dont ${N(x.new)} nouveaux`})),{title:"Visiteurs par jour"})}</div>
    <div class="card"><h2>Nouveaux visiteurs par jour</h2><p class="sub">Première visite sur le site</p>
      ${barChart(daily.map(x=>({label:lab(x),v:x.new,tip:`${fdate(x.day)} : <b>${N(x.new)}</b> nouveaux`})),{title:"Nouveaux visiteurs par jour"})}</div>
    <div class="card"><h2>Parties jouées par jour</h2><p class="sub">Parties terminées, entraînement compris</p>
      ${barChart(daily.map(x=>({label:lab(x),v:x.plays||x.starts,tip:`${fdate(x.day)} : <b>${N(x.plays)}</b> parties par ${N(x.players)} joueurs · ${N(x.starts)} essais officiels · ${N(x.saves)} scores enregistrés`})),{title:"Parties par jour"})}</div>
  </section>

  <section class="grid two">
    <div class="card"><h2>Parcours des visiteurs</h2><p class="sub">Sur les ${days} derniers jours : où est-ce qu'on perd les gens ?</p>
      <div class="funnel">${funnel(d.funnel)}</div></div>
    <div class="card"><h2>Rétention par jour d'arrivée</h2><p class="sub">Parmi les nouveaux visiteurs d'un jour, combien sont revenus</p>
      ${table("ret",[
        {k:"day",l:"Arrivés le",f:r=>fdate(r.day)},
        {k:"size",l:"Nouveaux",r:1,f:r=>N(r.size)},
        {k:"d1p",l:"J+1",r:1,t:"Revenus le lendemain",f:r=>r.d1==null?"…":PS(r.d1,r.size)},
        {k:"w1p",l:"7 jours",r:1,t:"Revenus dans les 7 jours",f:r=>r.w1==null?"…":PS(r.w1,r.size)},
        {k:"m1p",l:"30 jours",r:1,t:"Revenus entre le 8e et le 30e jour",f:r=>r.m1==null?"…":PS(r.m1,r.size)}
      ],retEl.slice(0,14).map(r=>Object.assign({},r,{d1p:P(r.d1,r.size),w1p:P(r.w1,r.size),m1p:P(r.m1,r.size)})),{k:"day",dir:"desc"})}
      <p class="note">« … » : trop récent pour être mesuré.</p></div>
  </section>

  <section class="card"><h2>Les jeux</h2><p class="sub">Sur les ${days} derniers jours. Clique sur un titre de colonne pour trier.</p>
    ${table("games",[
      {k:"name",l:"Jeu",sv:r=>gname(r.id),f:r=>`${esc(gname(r.id))}${/^n-/.test(r.id)?' <span class="pill new">nouveau</span>':""}`},
      {k:"plays",l:"Parties",r:1,f:r=>N(r.plays)},
      {k:"players",l:"Joueurs",r:1,f:r=>N(r.players)},
      {k:"perPlayer",l:"Parties / joueur",r:1,t:"Nombre moyen de parties par joueur",f:r=>r.perPlayer==null?"–":String(r.perPlayer).replace(".",",")},
      {k:"replayRate",l:"Rejouent",r:1,t:"Part des joueurs qui ont fait au moins 2 parties",f:r=>r.players?r.replayRate+" %":"–"},
      {k:"finishRate",l:"Vont au bout",r:1,t:"Parties terminées / jeu ouvert",f:r=>r.opens?r.finishRate+" %":"–"},
      {k:"trend",l:"Tendance 7 j",r:1,t:"Parties des 7 derniers jours vs les 7 jours d'avant",f:r=>delta(r.plays_7d,r.plays_prev_7d)},
      {k:"saves",l:"Scores enreg.",r:1,f:r=>N(r.saves)},
      {k:"limits",l:"Limite atteinte",r:1,t:"Nombre de fois où la limite de 3 essais par jour a bloqué un joueur",f:r=>N(r.limits)},
      {k:"starts",l:"Essais officiels",r:1,t:"Essais officiels démarrés (compté depuis toujours, même avant le suivi)",f:r=>N(r.starts)}
    ],games,{k:"plays",dir:"desc"})}
  </section>

  <section class="grid three">
    <div class="card"><h2>D'où viennent les nouveaux visiteurs</h2><p class="sub">Site d'origine ou lien ?ref=…</p>
      ${table("src",[
        {k:"id",l:"Source",f:r=>esc(r.id==="direct"?"Direct / appli":r.id)},
        {k:"new_users",l:"Nouveaux",r:1,f:r=>N(r.new_users)},
        {k:"pp",l:"Jouent",r:1,f:r=>PS(r.played,r.new_users)},
        {k:"rp",l:"Reviennent",r:1,f:r=>PS(r.returned,r.new_users)}
      ],(d.sources||[]).map(s=>Object.assign({},s,{pp:P(s.played,s.new_users),rp:P(s.returned,s.new_users)})),{k:"new_users",dir:"desc"})}
      <p class="note">Astuce : dans la description de chaque vidéo, mets le lien avec <b>?ref=nom-de-la-video</b> pour savoir laquelle t'amène le plus de joueurs.</p></div>
    <div class="card"><h2>Appareils</h2><p class="sub">Visiteurs par type d'appareil</p>
      ${hbars((d.devices||[]).map(x=>({label:DEV[x.id]||x.id,v:x.n})))}
      <h2 style="margin-top:18px">Langues</h2><p class="sub">Langue du téléphone ou de l'ordinateur</p>
      ${hbars((d.langs||[]).map(x=>({label:LANGS[x.id]||x.id,v:x.n})))}</div>
    <div class="card"><h2>Rubriques visitées</h2><p class="sub">Combien de visiteurs ouvrent chaque onglet</p>
      ${hbars((d.tabs||[]).map(x=>({label:TABS[x.id]||x.id,v:x.users,extra:"pers."})))}</div>
  </section>

  <section class="grid two">
    <div class="card"><h2>Heures de jeu</h2><p class="sub">Parties terminées selon l'heure (heure de Paris)</p>
      ${barChart((d.hours||[]).map(x=>({label:x.h+"h",v:x.n,tip:`${x.h} h – ${x.h+1} h : <b>${N(x.n)}</b> parties`})),{title:"Parties par heure",labels:8,h:180,w:520})}</div>
    <div class="card"><h2>Jours de la semaine</h2><p class="sub">Parties terminées selon le jour</p>
      ${barChart((d.weekdays||[]).map(x=>({label:DAYS[x.d].slice(0,3)+".",v:x.n,tip:`${DAYS[x.d]} : <b>${N(x.n)}</b> parties`})),{title:"Parties par jour de la semaine",labels:7,h:180,w:520})}</div>
  </section>

  <section class="card"><h2>Les pièces</h2><p class="sub">Sur les ${days} derniers jours : +10 pièces pour un record du site battu, +2 pour un record perso, 5 pièces l'essai en plus</p>
    <div class="grid kpis" style="margin:0">
      ${tile("Records du site battus",N(d.totals.site_records_beaten))}
      ${tile("Records perso battus",N(d.totals.personal_records_beaten))}
      ${tile("Pièces gagnées",N(d.totals.coins_earned_period),`${N(d.totals.coins_earned)} depuis le début`)}
      ${tile("Essais achetés",N(d.totals.attempts_bought),`par ${N(d.totals.buyers)} joueurs`)}
    </div></section>

  <section class="grid two">
    <div class="card"><h2>Les joueurs les plus accros</h2><p class="sub">Sur les ${days} derniers jours</p>
      ${table("top",[
        {k:"pseudo",l:"Pseudo",f:r=>esc(r.pseudo)},
        {k:"plays",l:"Parties",r:1,f:r=>N(r.plays)},
        {k:"games",l:"Jeux différents",r:1,f:r=>N(r.games)},
        {k:"days",l:"Jours actifs",r:1,f:r=>N(r.days)},
        {k:"since",l:"Depuis",r:1,f:r=>r.since?fdate(r.since):"–"}
      ],d.top_players||[],{k:"plays",dir:"desc"})}
      <p class="note">Pense à les remercier ou à les citer dans une vidéo : ça donne envie aux autres de jouer.</p></div>
    <div class="card"><h2>Depuis le début</h2><p class="sub">Totaux du site</p>
      ${hbars([
        {label:"Visiteurs suivis",v:d.totals.visitors_all_time},
        {label:"Comptes (y compris anonymes)",v:d.totals.accounts},
        {label:"Pseudos",v:d.totals.pseudos},
        {label:"Comptes avec mot de passe",v:d.totals.accounts_with_password},
        {label:"Tentatives enregistrées",v:d.totals.attempts},
        {label:"Vidéos d'aura",v:d.totals.aura_posts},
        {label:"Ligues",v:d.totals.leagues},
        {label:"Défis de la communauté",v:d.totals.custom_challenges}
      ])}</div>
  </section>
  <footer>Ton propre compte admin n'est jamais compté dans ces statistiques.</footer>`;
  document.querySelectorAll("[data-days]").forEach(b=>b.onclick=()=>{days=+b.dataset.days;lsSet("wur_admin_days",days);if(DEMO){data=demoData();render()}else load()});
  $("refresh").onclick=()=>DEMO?render():load();
  const lo=$("logout"); if(lo)lo.onclick=logout;
}
function funnel(f){
  const steps=[["Visiteurs","visitors"],["Ont ouvert un jeu","opened"],["Ont fini une partie","played"],["Ont enregistré un score","saved"],["Ont un pseudo","pseudo"],["Sont revenus un autre jour","returned"]];
  const top=f.visitors||0;
  return steps.map(([l,k],i)=>{const v=f[k]||0;return `<div class="step"><div class="row1"><b>${l}</b><span>${N(v)} · ${PS(v,top)}</span></div><div class="tr"><div class="fl" style="width:${top?(100*v/top).toFixed(1):0}%"></div></div></div>`}).join("");
}
function sumRet(rows){
  let s1=0,n1=0,s7=0,n7=0;
  rows.forEach(r=>{if(r.d1!=null){s1+=r.d1;n1+=r.size}if(r.w1!=null){s7+=r.w1;n7+=r.size}});
  return {d1:n1?Math.round(100*s1/n1):null,w1:n7?Math.round(100*s7/n7):null};
}
function mergeGames(d){
  const m={};
  const get=id=>m[id]||(m[id]={id,opens:0,plays:0,practice:0,players:0,saves:0,limits:0,shares:0,plays_7d:0,plays_prev_7d:0,replayers:0,starts:0,attempts:0});
  (d.games||[]).forEach(g=>Object.assign(get(g.id),g));
  (d.usage||[]).forEach(u=>{get(u.id).starts=+u.starts});
  (d.attempts_by_game||[]).forEach(a=>{const g=get(a.id);g.attempts=+a.n;if(!g.saves)g.saves=+a.n});
  return Object.values(m).filter(g=>g.id&&!TABS[g.id]).map(g=>Object.assign(g,{
    name:gname(g.id),
    perPlayer:g.players?Math.round(10*g.plays/g.players)/10:null,
    replayRate:g.players?Math.round(100*g.replayers/g.players):0,
    finishRate:g.opens?Math.min(100,Math.round(100*g.plays/g.opens)):0,
    trend:g.plays_prev_7d?(g.plays_7d-g.plays_prev_7d)/g.plays_prev_7d:(g.plays_7d?9:0)
  }));
}

/* ---------- données fictives pour l'aperçu (?demo=1) ---------- */
function demoData(){
  let seed=7; const rnd=()=>(seed=(seed*9301+49297)%233280)/233280;
  const today=new Date(); const iso=x=>x.toISOString().slice(0,10);
  const daily=[]; for(let i=days-1;i>=0;i--){const dt=new Date(today);dt.setDate(dt.getDate()-i);const base=40+Math.round((days-i)*1.8),v=Math.round(base*(.8+rnd()*.5)),nw=Math.round(v*(.35+rnd()*.2)),pl=Math.round(v*(2.5+rnd()*2));
    daily.push({day:iso(dt),visitors:v,new:nw,plays:pl,players:Math.round(v*.7),starts:Math.round(pl*.6),saves:Math.round(pl*.25),pseudos:Math.round(nw*.3)})}
  const ids=Object.keys(names).slice(0,43); const games=ids.map((id,i)=>{const pl=Math.round(400/(i+1)+rnd()*60),pp=Math.max(1,Math.round(pl/(2+rnd()*3)));
    return {id,opens:Math.round(pl*(1.1+rnd()*.8)),plays:pl,practice:Math.round(pl*.2),players:pp,saves:Math.round(pl*.3),limits:Math.round(rnd()*12),shares:Math.round(rnd()*5),plays_7d:Math.round(pl*.3),plays_prev_7d:Math.round(pl*.25*(.6+rnd()*.8)),replayers:Math.round(pp*(.2+rnd()*.6))}});
  const ret=daily.slice().reverse().map((x,i)=>({day:x.day,size:x.new,d1:i>=1?Math.round(x.new*(.15+rnd()*.15)):null,w1:i>=7?Math.round(x.new*(.25+rnd()*.15)):null,m1:i>=30?Math.round(x.new*(.1+rnd()*.1)):null}));
  const wk=daily.slice(-7).reduce((s,x)=>s+x.visitors,0);
  return {generated_at:new Date().toISOString(),today:iso(today),days,tracking_since:daily[0].day,live_now:3,
    kpi:{today:{visitors:daily.at(-1).visitors,new:daily.at(-1).new,plays:daily.at(-1).plays,players:40},yesterday:{visitors:daily.at(-2)?.visitors||0},
      week:{visitors:wk,new:Math.round(wk*.4),plays:wk*3,players:Math.round(wk*.7)},prev_week:{visitors:Math.round(wk*.86),new:Math.round(wk*.33),plays:Math.round(wk*2.6),players:Math.round(wk*.6)},
      period:{visitors:wk*3,new:wk*2,plays:wk*10,players:wk*2,shares:12,limits:85},dau_mau:14.2,days_per_user:1.9,plays_per_player_day:4.3},
    totals:{visitors_all_time:2140,accounts:2300,accounts_with_password:96,pseudos:640,attempts:5120,aura_posts:58,leagues:12,custom_challenges:31,
      coins_earned:4210,coins_earned_period:1830,site_records_beaten:64,personal_records_beaten:595,attempts_bought:210,buyers:73},
    daily,games,usage:[],attempts_by_game:[],
    tabs:[{id:"defis",users:900},{id:"records",users:310},{id:"classement",users:260},{id:"aura",users:180},{id:"profil",users:150},{id:"shorts",users:90},{id:"ligue",users:40},{id:"membre",users:25}],
    funnel:{visitors:1300,opened:1010,played:820,saved:350,pseudo:300,returned:260},retention:ret,
    sources:[{id:"youtube.com",new_users:620,played:470,returned:150},{id:"direct",new_users:410,played:260,returned:90},{id:"short-snake",new_users:120,played:100,returned:41},{id:"tiktok.com",new_users:80,played:50,returned:9},{id:"google.com",new_users:44,played:25,returned:6}],
    devices:[{id:"mobile",n:980},{id:"desktop",n:260},{id:"tablet",n:60}],
    langs:[{id:"fr",n:820},{id:"en",n:190},{id:"es",n:80},{id:"pt",n:50},{id:"ar",n:30}],
    hours:Array.from({length:24},(_,h)=>({h,n:Math.round(20+80*Math.exp(-((h-19)**2)/10)+30*Math.exp(-((h-13)**2)/4))})),
    weekdays:[1,2,3,4,5,6,7].map(dd=>({d:dd,n:Math.round(300+(dd>=5?180:0)+rnd()*80)})),
    top_players:[["NeoBlast",312,18,21],["Zykra",250,12,19],["LunaPix",198,22,14],["MaxRecord",180,9,25],["Tom_42",150,15,11]].map((r,i)=>({pseudo:r[0],plays:r[1],games:r[2],days:r[3],since:daily[Math.min(i*3,daily.length-1)].day}))};
}

boot().catch(e=>{console.error(e);$("dash").hidden=false;$("dash").innerHTML=`<div class="card"><p class="msg bad">Erreur : ${esc(e.message||e)}</p></div>`});
})();
