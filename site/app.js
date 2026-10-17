/* WorldUltimateRecords — app (GitHub Pages + Supabase) */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const fr=(v,d)=>Number(v).toLocaleString("fr-FR",{minimumFractionDigits:d,maximumFractionDigits:d});
function fmtDur(s){
  if(s<60)return fr(s,1)+" s";
  const h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=Math.floor(s%60);
  return h?`${h} h ${String(m).padStart(2,"0")} min ${String(r).padStart(2,"0")} s`:`${m} min ${String(r).padStart(2,"0")} s`;
}

/* ================= icons ================= */
const P=d=>`<svg viewBox="0 0 24 24">${d}</svg>`;
const ICONS={
  reaction:P('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
  clicks:P('<path d="M9 3v6M4.5 5.5l3 3M3 10h6M12 12l8 3-3.5 1.5L15 20z"/>'),
  typing:P('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>'),
  memory:P('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  aim:P('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>'),
  chrono:P('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6M12 2v3"/>'),
  alpha:P('<path d="M4 18 8 6l4 12M5.5 14h5M14 6h4a2.5 2.5 0 0 1 0 5h-4zm0 5h4.5a3.5 3.5 0 0 1 0 7H14z"/>'),
  cube:P('<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/>'),
  hands:P('<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7 6 6 0 0 1-5-3l-2.5-4.5a1.5 1.5 0 0 1 2.6-1.5L8 14"/>'),
  snap:P('<path d="M7 20c-2-2-2-6 1-9l4-4M12 7l2-2a2 2 0 0 1 3 3l-6 6M17 3l1-1M20 6l1-1M19 10h2"/>'),
  body:P('<circle cx="12" cy="4" r="2"/><path d="M12 6v6M8 9h8M12 12l-4 8M12 12l4 8"/>'),
  squat:P('<circle cx="12" cy="4" r="2"/><path d="M12 6v5l-4 3 2 6M12 11l4 3-2 6M7 8h10"/>'),
  rope:P('<path d="M5 21V12a7 7 0 0 1 14 0v9"/><circle cx="12" cy="9" r="2"/><path d="M12 11v5M10 21l2-5 2 5"/>'),
  plank:P('<circle cx="5" cy="9" r="2"/><path d="M7 11l13 3M7 11v6h3M20 14v3"/>'),
  cups:P('<path d="M9 4h6l-1 6h-4zM5 12h6l-1 6H6zM13 12h6l-1 6h-4z"/><path d="M3 21h18"/>'),
  socks:P('<path d="M9 2h6v9l3 4a3 3 0 0 1-4.5 4L8 14V2"/><path d="M9 6h6"/>'),
  coins:P('<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 10v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4M5 14v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4"/>'),
  balance:P('<circle cx="12" cy="4" r="2"/><path d="M12 6v8M7 9l5-1 5 1M12 14v7M12 14l4 2"/>'),
  shirt:P('<path d="M8 3 3 6l2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0z"/>'),
  lace:P('<path d="M3 17h18v3H3zM5 17l2-8h6l4 4 4 1v3"/><path d="M9 9l2 3M11 9l2 3M8 12c1 2 3 2 4 0"/>'),
  ball:P('<circle cx="12" cy="12" r="8"/><path d="M5 9c4 1 10 1 14 0M5 15c4-1 10-1 14 0"/>'),
  clip:P('<path d="M8 7v9a4 4 0 0 0 8 0V5a3 3 0 0 0-6 0v10a1.5 1.5 0 0 0 3 0V7"/>'),
  wall:P('<path d="M4 3v18"/><circle cx="8" cy="5" r="2"/><path d="M6 8v6h7v7M6 14l-1 0"/>'),
  domino:P('<rect x="4" y="3" width="6" height="12" rx="1"/><rect x="13" y="7" width="6" height="12" rx="1" transform="rotate(12 16 13)"/><path d="M7 7h.01M7 11h.01"/>'),
  puzzle:P('<path d="M4 7h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4h-4a2 2 0 1 0-4 0H4v-4a2 2 0 1 0 0-4z"/>'),
  calc:P('<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h8"/>'),
  eye:P('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  star:P('<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>')
};
const PLAY='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>';

/* ================= challenges ================= */
// video: yt = YouTube, tt = TikTok ; v = vertical, h = horizontal
const BASE=[
  {id:"rubik",kind:"cam",mode:"time",icon:"cube",name:"Rubik's Cube 3×3",desc:"Résous un cube 3×3 mélangé. Montre le cube mélangé à la caméra avant de démarrer.",
   wr:{v:2.76,who:"Teodor Zajder",where:"Pologne",when:"8 février 2026",src:"WCA",url:"https://ruwix.com/the-rubiks-cube/history-of-the-world-record-evolution/",
       video:{type:"yt",id:"aZ3TiMrGpU0",shape:"h",label:"YouTube"}}},
  {id:"claps",kind:"cam",mode:"count",win:60,unit:"claquements",icon:"hands",name:"Claquements de mains en 1 min",desc:"Applaudis le plus de fois possible en 60 secondes. Les mains doivent se toucher à chaque fois.",
   wr:{v:1140,who:"Dalton Meyer",where:"États-Unis",when:"",src:"Guinness World Records",url:"https://laughingsquid.com/most-claps-in-one-minute/",
       video:{type:"tt",id:"7606103649210715414",shape:"v",label:"TikTok · Guinness World Records"}}},
  {id:"snaps",kind:"cam",mode:"count",win:60,unit:"claquements",icon:"snap",name:"Claquements de doigts en 1 min",desc:"Claque des doigts le plus de fois possible en 60 secondes. Chaque claquement doit s'entendre.",
   wr:{v:437,who:"Cory Macellaro",where:"États-Unis",when:"18 avril 2021",src:"Guinness World Records",url:"https://www.guinnessworldrecords.com/world-records/most-finger-snaps-in-a-minute"}},
  {id:"squats",kind:"cam",mode:"count",win:60,unit:"squats",icon:"squat",name:"Squats en 1 min",desc:"Cuisses au moins parallèles au sol à chaque descente, jambes tendues en haut.",
   wr:{v:104,who:"Ravi Kumar",where:"Qatar",when:"29 août 2025",src:"Guinness World Records (homme)",url:"https://www.guinnessworldrecords.com/world-records/690472-most-squats-in-one-minute-male"}},
  {id:"jacks",kind:"cam",mode:"count",win:60,unit:"jumping jacks",icon:"body",name:"Jumping jacks en 1 min",desc:"Bras au-dessus de la tête et jambes écartées, puis retour bras le long du corps.",
   wr:{v:136,who:"Binod Thapa",where:"Népal",when:"28 juillet 2023",src:"Guinness World Records (homme)",url:"https://www.guinnessworldrecords.com/world-records/96911-most-jumping-jacks-in-one-minute"}},
  {id:"rope",kind:"cam",mode:"count",win:30,unit:"sauts",icon:"rope",name:"Sauts à la corde en 30 s",desc:"Sauts simples, pieds joints. On compte un saut par tour de corde.",
   wr:{v:171,who:"Wu Chenjun",where:"Chine",when:"26 mai 2025",src:"Guinness World Records",url:"https://www.guinnessworldrecords.com/world-records/most-skips-in-30-seconds"}},
  {id:"plank",kind:"cam",mode:"hold",icon:"plank",name:"Gainage (planche)",desc:"Sur les avant-bras, corps droit. La tentative s'arrête dès que les genoux ou les hanches touchent le sol.",
   wr:{v:34727,who:"Josef Šálek",where:"Tchéquie",when:"20 mai 2023",src:"Guinness World Records (homme)",url:"https://www.guinnessworldrecords.com/world-records/longest-time-in-an-abdominal-plank-position",
       video:{type:"yt",id:"_gQuHF9i9mo",shape:"v",label:"YouTube · Guinness World Records"}}},
  {id:"stack",kind:"cam",mode:"time",icon:"cups",name:"Sport stacking « cycle »",desc:"Enchaîne 3-6-3, 6-6 puis 1-10-1 avec 12 gobelets et termine en 3-6-3 rangé.",
   wr:{v:4.739,who:"Chan Keng Ian",where:"Malaisie",when:"20 juillet 2024",src:"WSSA",url:"https://www.thewssa.com/records/",
       video:{type:"yt",id:"KMsYKpMFBn8",shape:"h",label:"YouTube · WSSA"}}},
  // ---- défis originaux WorldUltimateRecords (pas de record du monde officiel) ----
  {id:"pyramid",kind:"wur",mode:"time",icon:"cups",name:"Pyramide de 10 gobelets",desc:"Monte une pyramide 4-3-2-1 avec 10 gobelets posés à l'envers, puis redescends-les en une seule pile. Le chrono s'arrête quand la pile est posée."},
  {id:"socks",kind:"wur",mode:"count",win:60,unit:"chaussettes",icon:"socks",name:"Chaussettes enfilées en 1 min",desc:"Enfile une chaussette sur un pied, talon bien en place, puis retire-la. Une chaussette enfilée et retirée = 1. Assis sur une chaise."},
  {id:"coins",kind:"wur",mode:"count",win:30,unit:"pièces",icon:"coins",name:"Tour de pièces en 30 s",desc:"Empile des pièces une par une, d'une seule main, sur une table. Seules les pièces encore empilées à la fin comptent."},
  {id:"balance",kind:"wur",mode:"hold",icon:"balance",name:"Équilibre sur un pied, yeux fermés",desc:"Debout sur un pied, bras libres, yeux fermés. La tentative s'arrête dès que l'autre pied touche le sol ou que tu ouvres les yeux. Fais-le loin des meubles."},
  {id:"tshirts",kind:"wur",mode:"time",icon:"shirt",name:"Plier 5 T-shirts",desc:"Plie 5 T-shirts posés en vrac en carrés propres, empilés. Un T-shirt mal plié ne compte pas : il faut le refaire."},
  {id:"laces",kind:"wur",mode:"time",icon:"lace",name:"Lacer ses deux chaussures",desc:"Pars avec les chaussures aux pieds, lacets défaits. Le chrono s'arrête quand les deux nœuds tiennent. Montre-les à la caméra."},
  {id:"pingpong",kind:"wur",mode:"count",win:60,unit:"rebonds",icon:"ball",name:"Jongles balle de ping-pong",desc:"Fais rebondir une balle de ping-pong sur une raquette (ou un livre). Si la balle tombe, tu continues mais le compte repart à zéro : seule la meilleure série compte."},
  {id:"clips",kind:"wur",mode:"count",win:60,unit:"trombones",icon:"clip",name:"Chaîne de trombones en 1 min",desc:"Accroche des trombones pour former une seule chaîne. Montre la chaîne entière à la fin : chaque maillon décroché ne compte pas."},
  {id:"bin",kind:"wur",mode:"count",win:60,unit:"paniers",icon:"ball",name:"Boulettes dans la corbeille",desc:"Lance des boulettes de papier dans une corbeille placée à 3 mètres (marque la ligne au sol). Seuls les paniers qui restent dans la corbeille comptent."},
  {id:"wallsit",kind:"wur",mode:"hold",icon:"wall",name:"La chaise contre le mur",desc:"Dos contre un mur, cuisses parallèles au sol, mains hors des jambes. La tentative s'arrête dès que tu te relèves ou que tu poses les mains sur les cuisses."},
  {id:"dominos",kind:"wur",mode:"count",win:60,unit:"dominos",icon:"domino",name:"Dominos debout en 1 min",desc:"Aligne des dominos debout, à la suite. À la fin, fais-les tomber : seuls ceux qui tombent dans la chaîne comptent."},
  {id:"backalpha",kind:"wur",mode:"time",icon:"alpha",name:"L'alphabet à l'envers, à voix haute",desc:"Récite l'alphabet de Z à A, à voix haute et distinctement. Une lettre oubliée ou inversée : il faut tout recommencer."},
  {id:"puzzle",kind:"wur",mode:"time",icon:"puzzle",name:"Puzzle de 100 pièces",desc:"Montre la boîte et les pièces en vrac au départ. Le chrono s'arrête quand la dernière pièce est posée et le puzzle entier visible."},
  // ---- défis exclusifs Pass Néon ----
  {id:"cardhouse",kind:"vip",mode:"time",icon:"cups",name:"Château de cartes 3 étages",desc:"Construis un château de 3 étages avec 15 cartes, sans scotch ni colle. Le chrono s'arrête quand la dernière carte tient 3 secondes."},
  {id:"bottleflip",kind:"vip",mode:"count",win:60,unit:"flips réussis",icon:"star",name:"Bouteille flip en 1 min",desc:"Fais un flip avec une bouteille d'eau remplie au tiers. Seuls les flips où la bouteille retombe et reste debout comptent."},
  {id:"onehand",kind:"vip",mode:"time",icon:"cube",name:"Rubik's Cube à une main",desc:"Résous un cube 3×3 mélangé avec une seule main. L'autre main reste derrière le dos pendant toute la résolution."},
  // ---- nouveaux défis navigateur ----
  {id:"mental",kind:"web",mode:"web",better:"high",icon:"calc",name:"Calcul mental 30 s",desc:"Additions, soustractions et multiplications : réponds au plus de calculs possible en 30 secondes.",fmt:v=>v+" bonnes réponses"},
  {id:"stroop",kind:"web",mode:"web",better:"high",icon:"eye",name:"Couleurs piégées",desc:"Clique la couleur de l'encre, pas le mot écrit. 30 secondes, chaque erreur retire un point.",fmt:v=>v+" points"},
  {id:"alphabet",kind:"web",mode:"web",better:"low",icon:"alpha",name:"Taper l'alphabet",desc:"Tape les 26 lettres de a à z au clavier, sans faute, le plus vite possible.",
   wr:{v:3.25,who:"Shashank Katke",where:"Inde",when:"25 février 2024",src:"Guinness World Records",url:"https://www.guinnessworldrecords.com/world-records/fastest-time-to-type-the-alphabet",
       video:{type:"tt",id:"7499871000159374614",shape:"v",label:"TikTok · Guinness World Records"}},fmt:v=>fr(v,2)+" s"},
  {id:"reaction",kind:"web",mode:"web",better:"low",icon:"reaction",name:"Réflexes éclair",desc:"Clique dès que l'écran devient violet. Moyenne de 3 essais.",fmt:v=>Math.round(v)+" ms"},
  {id:"clicks",kind:"web",mode:"web",better:"high",icon:"clicks",name:"Clics en 10 secondes",desc:"Clique le plus vite possible pendant 10 secondes.",fmt:v=>v+" clics"},
  {id:"typing",kind:"web",mode:"web",better:"low",icon:"typing",name:"Frappe express",desc:"Recopie la phrase sans faute, le plus vite possible.",fmt:v=>fr(v,2)+" s"},
  {id:"memory",kind:"web",mode:"web",better:"high",icon:"memory",name:"Mémoire de néon",desc:"Retiens la séquence lumineuse. Elle s'allonge à chaque tour.",fmt:v=>"niveau "+v},
  {id:"aim",kind:"web",mode:"web",better:"low",icon:"aim",name:"20 cibles",desc:"Touche 20 cibles d'affilée. Chaque raté ajoute 0,5 s.",fmt:v=>fr(v,2)+" s"},
  {id:"chrono",kind:"web",mode:"web",better:"low",icon:"chrono",name:"Chrono parfait",desc:"Arrête le chrono pile à 10,000 s. Il disparaît après 3 s.",fmt:v=>"± "+Math.round(v)+" ms"}
];
function decorate(c){
  if(c.mode==="count"){c.better="high";c.fmt=c.fmt||(v=>Number(v).toLocaleString("fr-FR")+" "+(c.unit||""))}
  if(c.mode==="time"){c.better="low";c.fmt=c.fmt||(v=>fr(v,2)+" s")}
  if(c.mode==="hold"){c.better="high";c.fmt=c.fmt||fmtDur}
  return c;
}
BASE.forEach(decorate);
let CH=BASE.slice(), CHM={};
let customs=[];      // [{id,user_id,name,description,mode,win,unit,created_at}]
function rebuildChallenges(){
  const cu=customs.filter(it=>it&&it.id&&["count","time","hold"].includes(it.mode)).map(it=>decorate({
    id:String(it.id),kind:"custom",mode:it.mode,win:[30,60,120].includes(+it.win)?+it.win:60,unit:String(it.unit||"répétitions").slice(0,20),
    icon:"star",name:String(it.name||"Record").slice(0,60),desc:String(it.description||"").slice(0,240),by:it.user_id,t:Date.parse(it.created_at)||0}));
  cu.sort((a,b)=>b.t-a.t);
  CH=BASE.concat(cu); CHM=Object.fromEntries(CH.map(c=>[c.id,c]));
}
const isBetter=(c,a,b)=>c.better==="low"?a<b:a>b;
const WEB_IDS=BASE.filter(c=>c.kind==="web").map(c=>c.id);

/* ================= data layer ================= */
// attempt in UI: {id, uid, pseudo, c, v, t, vid(url|null), path, code, status: auto|pending|ok|no, hidden}
let attempts=[], myId=null, isAdmin=false, sb=null, live=false, currentTab="defis", profileUid=null;
let myProfile=null, myEmail="", isAnon=true, reports=[], members=new Set(), mySub=null, usage={}, practice=false, introSkip=false;
const LIMIT=3;
const parisToday=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris"}).format(new Date());
const isMember=()=>members.has(myId)||isAdmin;
const CFG=window.WUR_CONFIG||{};
const LS="wur_gh_v1";
function lsGet(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
const pseudoIn=$("pseudo");
pseudoIn.value=lsGet("wur_pseudo","")||"";
pseudoIn.addEventListener("change",async()=>{
  const p=pseudoIn.value.trim().slice(0,24); pseudoIn.value=p; if(!p)return;
  if(await DB.setPseudo(p)){lsSet("wur_pseudo",p);toast("Pseudo enregistré : "+p)}
});
const pill=$("syncPill"), note=$("syncNote");
function setPill(kind,text,noteText){pill.className="status-pill "+kind;pill.lastElementChild.textContent=text;if(noteText)note.textContent=noteText}
const PSEUDO_RE=/^[A-Za-z0-9À-ÖØ-öø-ÿ_. -]{3,24}$/;
const RESERVED=["admin","administrateur","moderateur","modérateur","worldultimaterecords","wur","anonyme","mr.novyra","novyra"];
function pseudoProblem(p){
  if(!PSEUDO_RE.test(p))return "Ton pseudo doit faire 3 à 24 caractères : lettres, chiffres, espace, point, tiret ou _.";
  if(RESERVED.includes(p.toLowerCase())&&!isAdmin)return "Ce pseudo est réservé : choisis-en un autre.";
  return "";
}

/* ---- anti-robot (Cloudflare Turnstile), only when configured ---- */
function getCaptcha(){
  if(!CFG.turnstileSiteKey)return Promise.resolve(undefined);
  return new Promise((res,rej)=>{
    const box=$("captchaBox"), w=$("captchaWidget"); box.hidden=false; w.innerHTML="";
    const go=()=>{try{window.turnstile.render(w,{sitekey:CFG.turnstileSiteKey,language:"fr",
      callback:t=>{box.hidden=true;res(t)},"error-callback":()=>{box.hidden=true;rej(new Error("la vérification anti-robot a échoué, recharge la page"))}})}catch(e){rej(e)}};
    if(window.turnstile)go();
    else{const s=document.createElement("script");s.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";s.async=true;s.onload=go;
      s.onerror=()=>{box.hidden=true;rej(new Error("vérification anti-robot indisponible"))};document.head.appendChild(s)}
  });
}
const withCaptcha=async o=>{const t=await getCaptcha();return t?Object.assign({},o,{captchaToken:t}):o};

function rowToAttempt(r){
  return {id:r.id,uid:r.user_id,pseudo:String(r.pseudo||"Anonyme").slice(0,24),c:r.challenge,v:+r.value,t:Date.parse(r.created_at)||0,
    vid:r.video_path&&sb?sb.storage.from("videos").getPublicUrl(r.video_path).data.publicUrl:null,path:r.video_path||null,code:r.code||"",
    status:r.status||"auto",hidden:!!r.hidden};
}
const DB={
  async init(){
    if(!CFG.supabaseUrl||!CFG.supabaseAnonKey||!window.supabase){return this.local()}
    try{
      sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      let {data:{session}}=await sb.auth.getSession();
      if(!session){
        setPill("","Vérification…","");
        const r=await sb.auth.signInAnonymously({options:await withCaptcha({})});
        if(r.error)throw r.error; session=r.data.session;
      }
      await this.afterAuth(session.user);
      sb.auth.onAuthStateChange((ev,s)=>{if(s&&s.user&&s.user.id!==myId)this.afterAuth(s.user);else if(s&&s.user&&ev==="USER_UPDATED"){myEmail=s.user.email||"";isAnon=!!s.user.is_anonymous;renderAll()}});
      sb.channel("wur").on("postgres_changes",{event:"*",schema:"public",table:"attempts"},()=>this.refreshSoon())
        .on("postgres_changes",{event:"*",schema:"public",table:"challenges"},()=>this.refreshSoon())
        .on("postgres_changes",{event:"*",schema:"public",table:"reports"},()=>this.refreshSoon()).subscribe();
      setInterval(()=>this.refresh(),60000);
    }catch(e){console.warn(e);toast("Connexion au classement impossible : "+(e.message||e));this.local()}
  },
  async afterAuth(user){
    myId=user.id; myEmail=user.email||""; isAnon=!!user.is_anonymous; live=true;
    const [ad,pr]=await Promise.all([
      sb.from("admins").select("user_id").eq("user_id",myId).maybeSingle(),
      sb.from("profiles").select("*").eq("user_id",myId).maybeSingle()]);
    isAdmin=!!ad.data; myProfile=pr.data||null;
    if(myProfile){pseudoIn.value=myProfile.pseudo;lsSet("wur_pseudo",myProfile.pseudo)}
    else if(pseudoIn.value.trim())await this.setPseudo(pseudoIn.value.trim(),true);
    setPill("on","Classement en ligne",isAdmin?"Connecté en tant qu'administrateur.":"Ton pseudo est réservé pour toi. Tes scores apparaissent dans les classements de tous les joueurs.");
    await this.refresh();
  },
  local(){
    live=false; myId="local"; $("setupNote").hidden=!!(CFG.supabaseUrl&&CFG.supabaseAnonKey);
    const st=lsGet(LS,{attempts:[],customs:[]}); usage=Object.fromEntries(Object.entries(lsGet("wur_usage_"+parisToday(),{})).map(([k,n])=>[k,{started:n}]));
    attempts=st.attempts; customs=st.customs; rebuildChallenges();
    setPill("local","Scores sur cet appareil","Le classement en ligne n'est pas disponible : tes scores restent sur cet appareil.");
    renderAll();
  },
  _t:null, refreshSoon(){clearTimeout(this._t);this._t=setTimeout(()=>this.refresh(),400)},
  async refresh(){
    if(!live)return;
    const q=[sb.from("attempts").select("*").order("created_at",{ascending:false}).limit(3000),
             sb.from("challenges").select("*").order("created_at",{ascending:false}).limit(500)];
    q.push(sb.rpc("member_ids"),
           sb.from("subscriptions").select("status,current_period_end").eq("user_id",myId).maybeSingle(),
           sb.from("daily_usage").select("challenge,started,saved").eq("user_id",myId).eq("day",parisToday()));
    if(isAdmin)q.push(sb.from("reports").select("attempt_id,reason,created_at").order("created_at",{ascending:false}).limit(1000));
    const [a,c,mi,su,us,r]=await Promise.all(q);
    if(!mi.error)members=new Set((mi.data||[]).map(x=>typeof x==="string"?x:(x.member_ids||Object.values(x)[0])));
    mySub=su&&!su.error?su.data:null;
    if(us&&!us.error){usage={};(us.data||[]).forEach(u=>usage[u.challenge]=u)}
    if(!a.error)attempts=a.data.map(rowToAttempt);
    if(!c.error)customs=c.data;
    reports=r&&!r.error?r.data:[];
    rebuildChallenges(); renderAll(); notifyNew();
  },
  saveLocal(){lsSet(LS,{attempts,customs})},
  // consomme un essai officiel (3 par défi et par jour, illimité pour les membres)
  async startAttempt(cid){
    if(!live){
      const k="wur_usage_"+parisToday(), u=lsGet(k,{}), n=u[cid]||0;
      if(CHM[cid]&&CHM[cid].kind==="vip")return {ok:false,reason:"vip"};
      if(n>=LIMIT)return {ok:false,reason:"limit"};
      u[cid]=n+1; lsSet(k,u); usage[cid]={started:n+1}; return {ok:true,remaining:LIMIT-n-1};
    }
    const {data,error}=await sb.rpc("start_attempt",{p_challenge:cid});
    if(error){toast("Impossible de démarrer : "+error.message);return {ok:false,reason:"error"}}
    if(data&&data.ok)usage[cid]={started:((usage[cid]||{}).started||0)+1};
    return data||{ok:false,reason:"error"};
  },
  async setPseudo(p,silent){
    const prob=pseudoProblem(p); if(prob){if(!silent)toast(prob);return false}
    if(!live){lsSet("wur_pseudo",p);return true}
    if(myProfile&&myProfile.pseudo===p)return true;
    const {data,error}=await sb.from("profiles").upsert({user_id:myId,pseudo:p},{onConflict:"user_id"}).select().single();
    if(error){
      if(!silent)toast(error.code==="23505"?"Ce pseudo est déjà pris : choisis-en un autre.":error.code==="23514"?pseudoProblem(p)||"Ce pseudo n'est pas autorisé.":"Pseudo non enregistré : "+error.message);
      if(myProfile)pseudoIn.value=myProfile.pseudo; return false;
    }
    myProfile=data; await this.refresh(); return true;
  },
  async ensureProfile(){
    const p=pseudoIn.value.trim();
    if(!p){toast("Choisis d'abord un pseudo.");return false}
    if(!live)return !pseudoProblem(p)||(toast(pseudoProblem(p)),false);
    if(myProfile&&myProfile.pseudo===p)return true;
    return this.setPseudo(p);
  },
  async addAttempt(o){ // {c,v,status,path,code,consent}
    if(!(await this.ensureProfile()))return false;
    const pseudo=pseudoIn.value.trim();
    if(!live){attempts.unshift({id:"l"+Date.now(),uid:"local",pseudo,c:o.c,v:o.v,t:Date.now(),vid:o.localUrl||null,code:o.code||"",status:o.status,hidden:false});this.saveLocal();renderAll();return true}
    const {error}=await sb.from("attempts").insert({pseudo,challenge:o.c,value:o.v,status:o.status,video_path:o.path||null,code:o.code||null,consent_at:o.consent||null});
    if(error){toast("Enregistrement impossible : "+(/row-level security/.test(error.message)?"limite de 40 tentatives par heure atteinte, ou session expirée. Réessaie plus tard.":error.message));return false}
    await this.refresh(); return true;
  },
  async uploadVideo(blob,ext){
    if(!live)return {path:null,localUrl:URL.createObjectURL(blob)};
    const path=myId+"/"+Date.now()+"."+ext;
    const {error}=await sb.storage.from("videos").upload(path,blob,{contentType:blob.type||"video/webm",upsert:false});
    if(error)throw error;
    return {path};
  },
  async addChallenge(it){
    if(!(await this.ensureProfile()))return false;
    if(!live){customs.unshift(Object.assign({user_id:"local",created_at:new Date().toISOString()},it));this.saveLocal();rebuildChallenges();renderAll();return true}
    const {error}=await sb.from("challenges").insert({id:it.id,name:it.name,description:it.description,mode:it.mode,win:it.win,unit:it.unit});
    if(error){toast(/row-level security/.test(error.message)?(isMember()?"Tu as atteint la limite de 30 records créés.":"Sans Pass Néon, tu peux créer 5 records (30 avec le Pass Néon)."):"Publication impossible : "+error.message);return false}
    await this.refresh(); return true;
  },
  async removeFile(path){if(live&&path){try{await sb.storage.from("videos").remove([path])}catch(e){}}},
  async setStatus(id,status){
    const a=attempts.find(x=>x.id===id);
    if(!live){if(a)a.status=status;this.saveLocal();renderAll();return true}
    const patch={status}; if(status==="no"&&a&&a.path)patch.video_path=null;
    const {error}=await sb.from("attempts").update(patch).eq("id",id);
    if(error){toast("Décision non enregistrée : "+error.message);return false}
    if(status==="no"&&a&&a.path)await this.removeFile(a.path);
    await this.refresh(); return true;
  },
  async setHidden(id,hidden){
    if(!live){const a=attempts.find(x=>x.id===id);if(a)a.hidden=hidden;this.saveLocal();renderAll();return true}
    const {error}=await sb.from("attempts").update({hidden}).eq("id",id);
    if(error){toast("Action impossible : "+error.message);return false}
    if(!hidden)await sb.from("reports").delete().eq("attempt_id",id);
    await this.refresh(); return true;
  },
  async deleteAttempt(id){
    const a=attempts.find(x=>x.id===id); if(!a)return false;
    if(!live){attempts=attempts.filter(x=>x.id!==id);this.saveLocal();renderAll();return true}
    await this.removeFile(a.path);
    const {error}=await sb.from("attempts").delete().eq("id",id);
    if(error){toast("Suppression impossible : "+error.message);return false}
    await this.refresh(); return true;
  },
  async report(id,reason){
    if(!live){toast("Les signalements fonctionnent une fois le site en ligne.");return false}
    const {error}=await sb.from("reports").insert({attempt_id:id,reason});
    if(error){toast(error.code==="23505"?"Tu as déjà signalé cette vidéo.":"Signalement impossible : "+error.message);return false}
    return true;
  },
  async deleteAccount(){
    if(!live){try{localStorage.removeItem(LS);localStorage.removeItem("wur_pseudo");localStorage.removeItem("wur_seen")}catch(e){};location.reload();return}
    const mine=attempts.filter(a=>a.uid===myId&&a.path).map(a=>a.path);
    if(mine.length){try{await sb.storage.from("videos").remove(mine)}catch(e){}}
    const {error}=await sb.rpc("delete_my_account");
    if(error){toast("Suppression impossible : "+error.message);return}
    try{await sb.auth.signOut()}catch(e){}
    try{localStorage.removeItem("wur_pseudo");localStorage.removeItem("wur_seen")}catch(e){}
    location.hash="defis"; location.reload();
  },
  async linkEmail(email){
    const {error}=await sb.auth.updateUser({email},{emailRedirectTo:location.origin+location.pathname});
    if(error)throw error;
  },
  async emailLogin(email){
    const {error}=await sb.auth.signInWithOtp({email,options:await withCaptcha({shouldCreateUser:false,emailRedirectTo:location.origin+location.pathname})});
    if(error)throw error;
  },
  async adminLogin(email,pw){
    const {data,error}=await sb.auth.signInWithPassword({email,password:pw,options:await withCaptcha({})});
    if(error)throw error;
    await this.afterAuth(data.user); return isAdmin;
  }
};

/* ================= derived ================= */
const counts=a=>(a.status==="auto"||a.status==="ok")&&!a.hidden;
const valid=a=>CHM[a.c]&&typeof a.v==="number"&&isFinite(a.v);
function list(){return attempts.filter(valid)}
function boardFor(cid){
  const best={}, c=CHM[cid];
  for(const a of list()){ if(a.c!==cid||!counts(a))continue;
    if(!best[a.uid]||isBetter(c,a.v,best[a.uid].v))best[a.uid]=a; }
  return Object.values(best).sort((a,b)=>c.better==="low"?a.v-b.v:b.v-a.v);
}
function recordFlags(){
  const flags=new Set(),cur={};
  for(const a of list().slice().sort((x,y)=>x.t-y.t)){ if(!counts(a))continue; const c=CHM[a.c];
    if(cur[a.c]===undefined||isBetter(c,a.v,cur[a.c])){cur[a.c]=a.v;flags.add(a.id)} }
  return flags;
}

/* ================= rendering ================= */
function ago(t){if(!t)return"";const s=(Date.now()-t)/1000;
  if(s<60)return"à l'instant";if(s<3600)return"il y a "+Math.floor(s/60)+" min";
  if(s<86400)return"il y a "+Math.floor(s/3600)+" h";if(s<86400*7)return"il y a "+Math.floor(s/86400)+" j";
  return new Date(t).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}
const icon=c=>ICONS[c.icon]||ICONS.star;
const vidUrl=v=>v.type==="yt"?"https://www.youtube.com/watch?v="+v.id:"https://www.tiktok.com/@guinnessworldrecords/video/"+v.id;
const embedUrl=(v,autoplay)=>v.type==="yt"
  ?`https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?rel=0&playsinline=1&modestbranding=1${autoplay?"&autoplay=1":""}`
  :`https://www.tiktok.com/player/v1/${encodeURIComponent(v.id)}?music_info=0&description=0${autoplay?"&autoplay=1":""}`;
function card(c){
  const b=boardFor(c.id)[0];
  const kindLbl=c.kind==="web"?"Navigateur":c.kind==="cam"?"Caméra":c.kind==="wur"?"Caméra · WUR":c.kind==="vip"?"Pass Néon":"Caméra · communauté";
  return `<article class="ch">
    <div class="top"><div class="ico">${icon(c)}</div><span class="kind ${c.kind!=="web"?"cam":""}">${kindLbl}</span></div>
    <h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p>
    <a class="fullrank" href="#c-${esc(c.id)}">Classement complet →</a>
    <div class="lines">
      ${c.wr?`<div class="rec-line wr"><span>Monde : ${esc(c.wr.who)}</span><strong>${esc(c.fmt(c.wr.v))}</strong></div>`:c.kind==="web"?`<div class="rec-line wr"><span>Pas de record du monde officiel</span><strong></strong></div>`:c.kind==="wur"?`<div class="rec-line wr"><span>Défi original WorldUltimateRecords</span><strong></strong></div>`:c.kind==="vip"?`<div class="rec-line wr"><span>Défi exclusif des membres</span><strong></strong></div>`:`<div class="rec-line wr"><span>Record créé par un joueur</span><strong></strong></div>`}
      <div class="rec-line">${b?`<span>Site : ${plink(b)}</span><strong>${esc(c.fmt(b.v))}</strong>`:`<span>Site : aucun record validé</span><strong>—</strong>`}</div>
    </div>
    ${c.wr?(c.wr.video?`<button class="wrlink" style="background:none;border:0;padding:0;cursor:pointer" data-watch="${esc(c.id)}">${PLAY}Voir la vidéo du record du monde</button>`:`<a class="wrlink" href="${esc(c.wr.url)}" target="_blank" rel="noopener">Voir la fiche officielle du record</a>`):""}
    ${c.kind==="vip"&&!isMember()?`<a class="btn solid gold" href="#membre">Réservé au Pass Néon</a>`:`<button class="btn solid" data-play="${esc(c.id)}">${c.kind==="web"?"Tenter le record":"Tenter en vidéo"}</button>`}
  </article>`;
}
function renderVids(){
  $("vids").innerHTML=CH.filter(c=>c.wr&&c.wr.video).map(c=>`<article class="vid">
    <button class="poster" style="width:100%;font:inherit;cursor:pointer;padding:0" data-watch="${esc(c.id)}" aria-label="Regarder ${esc(c.name)} : ${esc(c.wr.who)}">
      <span class="pico">${icon(c)}</span><span class="pval">${esc(c.fmt(c.wr.v))}</span><span class="pplay">${PLAY}</span><span class="psrc">${esc(c.wr.video.label)}</span></button>
    <div class="vmeta"><b>${esc(c.name)}</b><span>${esc(c.wr.who)} · ${esc(c.wr.where)}${c.wr.when?" · "+esc(c.wr.when):""}</span></div>
    <button class="btn sm" data-play="${esc(c.id)}">À toi de jouer</button></article>`).join("");
}
function renderGrids(){
  renderVids();
  $("gridCam").innerHTML=CH.filter(c=>c.kind==="cam").map(card).join("");
  $("gridWeb").innerHTML=CH.filter(c=>c.kind==="web").map(card).join("");
  $("gridWur").innerHTML=CH.filter(c=>c.kind==="wur").map(card).join("");
  $("gridVip").innerHTML=CH.filter(c=>c.kind==="vip").map(card).join("");
  const cu=CH.filter(c=>c.kind==="custom");
  $("gridCustom").innerHTML=cu.length?cu.map(card).join(""):`<div class="empty" style="grid-column:1/-1">Aucun record créé par la communauté pour l'instant. Utilise « Créer un nouveau record » pour lancer le premier.</div>`;
}
let filterC="all";
function wrBox(c){return c.wr?`<div class="wrbox">Record du monde : <b>${esc(c.fmt(c.wr.v))}</b> · ${esc(c.wr.who)} (${esc(c.wr.where)})${c.wr.when?", "+esc(c.wr.when):""} · <a href="${esc(c.wr.url)}" target="_blank" rel="noopener">${esc(c.wr.src)}</a>${c.wr.video?` · <a href="#" data-watch="${esc(c.id)}">voir la vidéo</a>`:""}</div>`:""}
function renderRecords(){
  const q=$("q").value.trim().toLowerCase();
  const chipList=[{id:"all",name:"Tous"},{id:"k:cam",name:"Caméra"},{id:"k:wur",name:"Défis WUR"},{id:"k:vip",name:"Pass Néon"},{id:"k:web",name:"Navigateur"},{id:"k:custom",name:"Communauté"}];
  $("chips").innerHTML=chipList.map(c=>`<button class="chip" data-chip="${c.id}" aria-pressed="${filterC===c.id}">${esc(c.name)}</button>`).join("")
    +(filterC.startsWith("c:")?`<button class="chip" data-chip="${esc(filterC)}" aria-pressed="true">${esc((CHM[filterC.slice(2)]||{}).name||"")}</button>`:"");
  const matchC=c=>filterC==="all"||(filterC.startsWith("k:")&&c.kind===filterC.slice(2))||(filterC.startsWith("c:")&&c.id===filterC.slice(2));
  const html=CH.filter(matchC).map(c=>{
    let rows=boardFor(c.id); const nameHit=q&&!c.name.toLowerCase().includes(q);
    if(nameHit)rows=rows.filter(r=>r.pseudo.toLowerCase().includes(q));
    if(nameHit&&!rows.length)return"";
    const top=rows[0], rest=rows.slice(1,8);
    return `<article class="board"><header><h3>${esc(c.name)}</h3><span class="unit">${c.better==="low"?"le plus bas gagne":"le plus haut gagne"}</span></header>${wrBox(c)}
      ${top?`<div class="top1"><div class="who"><b>${plink(top)}</b><small>${nameHit?"meilleur score trouvé":"record du site"} · ${esc(ago(top.t))}</small></div><div class="val">${esc(c.fmt(top.v))}</div></div>
      ${rest.length?`<ol class="rest">${rest.map((r,i)=>`<li><span class="rk">${i+2}</span><span class="nm">${plink(r)}</span><span class="num">${esc(c.fmt(r.v))}</span></li>`).join("")}</ol>`:""}`
      :`<div class="empty">Aucun score validé.<br><button class="btn sm" data-play="${esc(c.id)}" style="margin-top:8px">Être le premier</button></div>`}
      ${rows.length?`<a class="fullrank" href="#c-${esc(c.id)}">Classement complet (${boardFor(c.id).length} joueur${boardFor(c.id).length>1?"s":""}) →</a>`:""}
    </article>`}).join("");
  $("boards").innerHTML=html||`<div class="empty">Aucun résultat pour « ${esc(q)} ».</div>`;
  const flags=recordFlags();
  const rows=list().filter(a=>matchC(CHM[a.c])&&(!q||a.pseudo.toLowerCase().includes(q)||CHM[a.c].name.toLowerCase().includes(q))).slice(0,200);
  const st={auto:"",ok:'<span class="badge ok">Vidéo validée</span>',pending:'<span class="badge pend">À vérifier</span>',no:'<span class="badge no">Refusée</span>'};
  $("attemptRows").innerHTML=rows.length?rows.map(a=>`<tr><td>${esc(ago(a.t))}</td><td>${plink(a)}</td><td>${esc(CHM[a.c].name)}</td><td class="r num">${esc(CHM[a.c].fmt(a.v))}</td><td>${flags.has(a.id)?'<span class="badge">Record du site</span> ':""}${statusBadge(a)}${a.vid?` <a href="#" data-pvid="${esc(a.id)}">vidéo</a>`:""}${a.vid&&a.uid!==myId?` · <a href="#" data-report="${esc(a.id)}">signaler</a>`:""}</td></tr>`).join("")
    :`<tr><td colspan="5"><div class="empty" style="border:0">Aucune tentative${q?" pour cette recherche":""}. Les scores apparaissent ici dès qu'un joueur en enregistre un.</div></td></tr>`;
  renderMod();
}
/* ---- shorts ---- */
let feedSig="";
function renderFeed(){
  const flags=recordFlags(), items=[];
  const vids=list().filter(a=>a.vid&&a.status!=="no").sort((x,y)=>(members.has(y.uid)-members.has(x.uid))||(y.t-x.t)).slice(0,20);
  CH.filter(c=>c.kind!=="web").forEach(c=>{
    if(c.wr)items.push({kind:"wr",c}); else items.push({kind:"challenge",c});
    const b=boardFor(c.id)[0]; if(b)items.push({kind:"record",c,a:b});
  });
  CH.filter(c=>c.kind==="web").forEach(c=>{const b=boardFor(c.id)[0];items.push(b?{kind:"record",c,a:b}:c.wr?{kind:"wr",c}:{kind:"challenge",c})});
  const out=[]; let vi=0;
  items.forEach((it,i)=>{ if(i%2===1&&vi<vids.length)out.push({kind:"video",c:CHM[vids[vi].c],a:vids[vi++]}); out.push(it)});
  while(vi<vids.length)out.push({kind:"video",c:CHM[vids[vi].c],a:vids[vi++]});
  const sig=out.map(it=>it.kind+it.c.id+(it.a?it.a.id+it.a.status:"")).join("|");
  if(sig===feedSig)return; feedSig=sig;
  $("feed").innerHTML=out.map(it=>{
    const c=it.c;
    if(it.kind==="video")return `<article class="short"><video src="${esc(it.a.vid)}" muted loop playsinline preload="metadata"></video><div class="shade"></div>
      <span class="tag ${it.a.status==="ok"?"gold":""}">${it.a.status==="ok"?"Vidéo validée":"En vérification"} · ${esc(ago(it.a.t))}</span>
      <div class="big ${flags.has(it.a.id)?"gold":""}">${esc(c.fmt(it.a.v))}</div><div class="meta"><b>${plink(it.a)}</b> sur <b>${esc(c.name)}</b></div>
      <button class="btn cta" data-play="${esc(c.id)}">À ton tour</button>${side(c.id,it.a.uid!==myId?it.a.id:null)}</article>`;
    if(it.kind==="wr")return `<article class="short" data-tone="wr" data-cid="${esc(c.id)}"><canvas></canvas><div class="shade"></div><span class="tag wr">Record du monde</span>
      <div class="big wr">${esc(c.fmt(c.wr.v))}</div><div class="meta"><b>${esc(c.wr.who)}</b> (${esc(c.wr.where)}) détient le record du monde de <b>${esc(c.name)}</b>${c.wr.when?", depuis le "+esc(c.wr.when):""}.</div>
      ${c.wr.video?`<button class="playbig" data-inline="${esc(c.id)}">${PLAY}<span>Regarder le record<small>${esc(c.wr.video.label)}</small></span></button>`:""}
      <div class="row" style="justify-content:flex-start;margin-top:16px"><button class="btn solid" data-play="${esc(c.id)}">Tenter de le battre</button></div>${side(c.id)}</article>`;
    if(it.kind==="record")return `<article class="short" data-tone="gold"><canvas></canvas><div class="shade"></div><span class="tag gold">Record du site</span>
      <div class="big gold">${esc(c.fmt(it.a.v))}</div><div class="meta"><b>${plink(it.a)}</b> détient le record du site sur <b>${esc(c.name)}</b>. Tu peux faire mieux ?</div>
      <button class="btn solid cta" data-play="${esc(c.id)}">Battre ce record</button>${side(c.id)}</article>`;
    return `<article class="short"><canvas></canvas><div class="shade"></div><span class="tag">${c.kind==="custom"?"Défi de la communauté":c.kind==="wur"?"Défi WorldUltimateRecords":c.kind==="vip"?"Exclusif Pass Néon":"Défi"}</span>
      <div class="q">${esc(c.name)}</div><div class="meta">${esc(c.desc)}</div>
      <button class="btn solid cta" data-play="${esc(c.id)}">Relever le défi</button>${side(c.id)}</article>`;
  }).join("");
  setupObserver();
}
function side(cid,aid){return `<div class="side">${aid?`<button data-report="${esc(aid)}" aria-label="Signaler cette vidéo"><svg viewBox="0 0 24 24"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg></button><small>Signaler</small>`:""}
  <button data-play="${esc(cid)}" aria-label="Jouer"><svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg></button><small>Jouer</small>
  <button data-goto="c-${esc(cid)}" aria-label="Voir le classement complet"><svg viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/></svg></button><small>Top</small>
  <button data-share="1" aria-label="Partager le site"><svg viewBox="0 0 24 24"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg></button><small>Partager</small></div>`}
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
let visible=new Set(), io=null;
function setupObserver(){
  if(io)io.disconnect(); visible.clear();
  io=new IntersectionObserver(es=>es.forEach(e=>{const s=e.target,v=s.querySelector("video"),cv=s.querySelector("canvas");
    if(e.isIntersecting&&e.intersectionRatio>.6){if(cv)visible.add(cv);if(v&&currentTab==="shorts")v.play().catch(()=>{})}
    else{if(cv)visible.delete(cv);if(v)v.pause();const fr=s.querySelector("iframe");if(fr)fr.remove()}}),{threshold:[0,.6]});
  document.querySelectorAll(".short").forEach(s=>{io.observe(s);const cv=s.querySelector("canvas");if(cv)drawBg(cv,0)});
}
function drawBg(cv,t){
  const r=cv.getBoundingClientRect(); if(!r.width)return;
  const dpr=Math.min(devicePixelRatio||1,2),W=Math.round(r.width*dpr),H=Math.round(r.height*dpr);
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}
  const g=cv.getContext("2d"),tone=cv.parentElement.dataset.tone;
  const col=tone==="gold"?"255,201,74":tone==="wr"?"95,208,255":"176,76,255";
  g.fillStyle="#05020a";g.fillRect(0,0,W,H);
  const grd=g.createRadialGradient(W/2,H*.3,0,W/2,H*.3,H*.6);grd.addColorStop(0,`rgba(${col},.3)`);grd.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=grd;g.fillRect(0,0,W,H);
  const hy=H*.6;g.lineWidth=dpr;g.strokeStyle=`rgba(${col},.55)`;g.shadowColor=`rgba(${col},1)`;g.shadowBlur=8*dpr;
  for(let i=-10;i<=10;i++){g.beginPath();g.moveTo(W/2+i*W*.02,hy);g.lineTo(W/2+i*W*.32,H);g.stroke()}
  const off=(t/1600)%1;
  for(let k=0;k<9;k++){const p=Math.pow((k+off)/9,2.2),y=hy+(H-hy)*p;g.globalAlpha=Math.min(1,p*3);g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}
  g.globalAlpha=1;g.strokeStyle=`rgba(${col},.9)`;g.lineWidth=2*dpr;g.shadowBlur=16*dpr;g.beginPath();g.moveTo(0,hy);g.lineTo(W,hy);g.stroke();g.shadowBlur=0;
}
(function loop(t){if(!reduce&&currentTab==="shorts")visible.forEach(cv=>drawBg(cv,t));requestAnimationFrame(loop)})(0);
function renderAll(){if(currentTab==="membre")renderPass();if(currentTab==="classement")renderRanking();renderWeekly();renderChannel();renderGrids();renderRecords();renderFeed();renderNotifs();if(currentTab==="profil")renderProfile()}

/* ================= player links ================= */
const plink=a=>a&&a.uid?`<a class="plink" href="#p-${esc(a.uid)}">${esc(a.pseudo)}</a>${members.has(a.uid)?'<span class="mbadge" title="Membre Pass Néon">PASS</span>':""}`:esc(a&&a.pseudo||"");

/* ================= moderation (admin) ================= */
const REASONS={choquant:"Contenu choquant",triche:"Triche",mineur:"Mineur sans accord",autre:"Autre"};
function reportsFor(id){return reports.filter(r=>r.attempt_id===id)}
function renderMod(){
  const panel=$("modPanel"); if(!isAdmin){panel.hidden=true;return}
  panel.hidden=false;
  const pend=list().filter(a=>a.status==="pending"&&!a.hidden).sort((x,y)=>(members.has(y.uid)-members.has(x.uid))||(x.t-y.t));
  const flagged=list().filter(a=>a.hidden||reportsFor(a.id).length);
  const sig=pend.map(a=>a.id).join(",")+"|"+flagged.map(a=>a.id+a.hidden+reportsFor(a.id).length).join(",");
  if(panel.dataset.sig===sig)return; panel.dataset.sig=sig;
  const item=(a,extra)=>`<div class="mod-item">
    ${a.vid?`<video src="${esc(a.vid)}" controls playsinline preload="metadata"></video>`:`<div class="empty">Pas de vidéo</div>`}
    <div>${members.has(a.uid)?'<span class="badge">Prioritaire</span> ':""}${plink(a)} · ${esc(CHM[a.c].name)}<br><span class="num" style="color:var(--gold)">${esc(CHM[a.c].fmt(a.v))}</span>${a.code?` · code <span class="num">${esc(a.code)}</span>`:""}</div>
    ${extra}</div>`;
  $("modPending").innerHTML=pend.length?pend.map(a=>item(a,`<div class="row" style="justify-content:flex-start">
      <button class="btn sm good" data-verdict="ok" data-id="${esc(a.id)}">Valider</button><button class="btn sm bad" data-verdict="no" data-id="${esc(a.id)}">Refuser</button></div>`)).join("")
    :`<div class="empty">Aucune vidéo en attente.</div>`;
  $("modFlagged").innerHTML=flagged.length?flagged.map(a=>{const rs=reportsFor(a.id),cnt={};rs.forEach(r=>cnt[r.reason]=(cnt[r.reason]||0)+1);
    return item(a,`<p class="msg">${a.hidden?'<span class="badge no">Masquée</span> ':""}${rs.length} signalement(s) : ${Object.entries(cnt).map(([k,n])=>esc(REASONS[k]||k)+" ×"+n).join(", ")||"aucun"}</p>
      <div class="row" style="justify-content:flex-start">
        ${a.hidden?`<button class="btn sm good" data-unhide="${esc(a.id)}">Rétablir</button>`:`<button class="btn sm" data-hide="${esc(a.id)}">Masquer</button>`}
        <button class="btn sm bad" data-del="${esc(a.id)}">Supprimer</button></div>`)}).join("")
    :`<div class="empty">Aucun signalement.</div>`;
}

/* ================= weekly challenges ================= */
function weekInfo(){
  const now=new Date(), d=new Date(now); d.setHours(0,0,0,0); d.setDate(d.getDate()-((d.getDay()+6)%7));
  const end=new Date(d); end.setDate(end.getDate()+7);
  return {start:d.getTime(),end:end.getTime(),n:Math.round((d-new Date(2026,0,5))/(7*864e5))};
}
function weeklyPicks(){
  const w=weekInfo().n, pick=(arr,k)=>arr.length?arr[((w*k)%arr.length+arr.length)%arr.length]:null;
  return [pick(CH.filter(c=>c.kind==="cam"),1),pick(CH.filter(c=>c.kind==="wur"),5),pick(CH.filter(c=>c.kind==="web"),3)].filter(Boolean);
}
function weeklyBoard(cid){
  const st=weekInfo().start, best={}, c=CHM[cid];
  for(const a of list()){if(a.c!==cid||!counts(a)||a.t<st)continue;if(!best[a.uid]||isBetter(c,a.v,best[a.uid].v))best[a.uid]=a}
  return Object.values(best).sort((a,b)=>c.better==="low"?a.v-b.v:b.v-a.v);
}
function renderCta(){const el=$("passCta");if(el)el.hidden=isMember()}
function renderWeekly(){renderCta();
  const wi=weekInfo(), left=wi.end-Date.now(), dd=Math.floor(left/864e5), hh=Math.floor(left%864e5/36e5);
  $("weekLeft").textContent=`Se termine dans ${dd} j ${hh} h · nouveaux défis chaque lundi`;
  $("weekly").innerHTML=weeklyPicks().map(c=>{const b=weeklyBoard(c.id);
    return `<article class="ch week">
      <div class="top"><div class="ico">${icon(c)}</div><span class="kind ${c.kind!=="web"?"cam":""}">${c.kind==="web"?"Navigateur":"Caméra"}</span></div>
      <h3>${esc(c.name)}</h3>
      <ol class="rest">${b.slice(0,3).map((r,i)=>`<li><span class="rk m${i}">${i+1}</span><span class="nm">${plink(r)}</span><span class="num">${esc(c.fmt(r.v))}</span></li>`).join("")||`<li><span class="rk"></span><span class="nm" style="color:var(--muted)">Personne cette semaine</span><span></span></li>`}</ol>
      <a class="fullrank" href="#c-${esc(c.id)}">Classement complet du défi →</a>
      <button class="btn solid" data-play="${esc(c.id)}">Participer</button></article>`}).join("");
}

/* ================= YouTube channel ================= */
function renderChannel(){
  const url=CFG.youtubeChannelUrl||"", ids=(CFG.youtubeShorts||[]).filter(x=>/^[A-Za-z0-9_-]{6,20}$/.test(x));
  const sub=$("subBtn"); sub.hidden=!url; if(url)sub.href=url+(url.includes("?")?"&":"?")+"sub_confirmation=1";
  $("channelSec").hidden=!ids.length&&!url;
  $("channelLink").hidden=!url; if(url)$("channelLink").href=url+(url.includes("?")?"&":"?")+"sub_confirmation=1";
  $("shortsList").innerHTML=ids.map(id=>`<article class="vid"><button class="poster" style="width:100%;font:inherit;cursor:pointer;padding:0" data-yt="${esc(id)}" aria-label="Regarder ce Short">
    <span class="pico">${ICONS.star}</span><span class="pval">Short</span><span class="pplay">${PLAY}</span><span class="psrc">WorldUltimateRecords</span></button></article>`).join("");
}

/* ================= profile ================= */
const MEDALS=["Or","Argent","Bronze"];
function playerStats(uid){
  const med=[0,0,0], best=[];
  for(const c of CH){const b=boardFor(c.id),i=b.findIndex(r=>r.uid===uid);if(i<0)continue;if(i<3)med[i]++;best.push({c,a:b[i],rank:i+1,of:b.length})}
  return {med,best};
}
function renderProfile(){
  const uid=profileUid||myId, own=uid===myId, box=$("profileBox");
  const mineAll=list().filter(a=>a.uid===uid);
  const name=own?(myProfile&&myProfile.pseudo)||pseudoIn.value.trim()||"Toi":(mineAll[0]&&mineAll[0].pseudo)||"Joueur";
  const st=playerStats(uid);
  let html=`<p class="eyebrow">${own?"Mon profil":"Profil de joueur"}</p><h1>${esc(name)}</h1>
    <div class="medals">${st.med.map((n,i)=>`<div class="medal m${i}"><b class="num">${n}</b><span>${MEDALS[i]}</span></div>`).join("")}
      <div class="medal"><b class="num">${mineAll.filter(counts).length}</b><span>Tentatives validées</span></div></div>`;
  html+=`<h2 class="section-gap" style="margin-top:28px">Meilleurs scores</h2>`+(st.best.length?`<div class="tablewrap"><table><thead><tr><th>Défi</th><th class="r">Score</th><th>Classement</th></tr></thead><tbody>
    ${st.best.sort((x,y)=>x.rank-y.rank).map(r=>`<tr><td>${esc(r.c.name)}</td><td class="r num">${esc(r.c.fmt(r.a.v))}</td><td>${r.rank===1?'<span class="badge">Record du site</span>':r.rank+"<sup>e</sup> sur "+r.of}</td></tr>`).join("")}</tbody></table></div>`
    :`<div class="empty">Pas encore de score validé.</div>`);
  if(own){
    html+=`<div class="passline">${isMember()?`<span class="mbadge">PASS</span> Membre du Pass Néon · <a href="#membre">gérer</a>`:`Essais limités à ${LIMIT} par défi et par jour · <a href="#membre">Passer au Pass Néon</a>`}</div>`;
    html+=`<h2 style="margin-top:28px">Mes tentatives</h2>`+(mineAll.length?`<div class="tablewrap"><table><thead><tr><th>Quand</th><th>Défi</th><th class="r">Score</th><th>Statut</th><th></th></tr></thead><tbody>
      ${mineAll.map(a=>`<tr><td>${esc(ago(a.t))}</td><td>${esc(CHM[a.c].name)}</td><td class="r num">${esc(CHM[a.c].fmt(a.v))}</td><td>${statusBadge(a)}${a.vid?` <a href="#" data-pvid="${esc(a.id)}">vidéo</a>`:""}</td>
        <td><button class="btn sm ghost" data-del="${esc(a.id)}">Supprimer</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Aucune tentative.</div>`);
    html+=`<h2 style="margin-top:28px">Mon compte</h2><div class="acct">`;
    if(!live)html+=`<p class="msg">Le compte en ligne sera disponible quand le site sera relié à Supabase.</p>`;
    else if(isAnon)html+=`<p class="msg">Ton compte est lié à ce navigateur. Ajoute ton e-mail pour le retrouver sur un autre appareil et ne jamais perdre ton pseudo.</p>
      <form class="row" id="linkForm" style="justify-content:flex-start"><input class="field" id="linkEmail" type="email" placeholder="ton@email.fr" required autocomplete="email"><button class="btn" type="submit">Protéger mon compte</button></form>
      <p class="msg">Déjà protégé sur un autre appareil ?</p>
      <form class="row" id="loginForm" style="justify-content:flex-start"><input class="field" id="loginEmail" type="email" placeholder="ton@email.fr" required autocomplete="email"><button class="btn" type="submit">Recevoir un lien de connexion</button></form>`;
    else html+=`<p class="msg good">Compte protégé par l'e-mail ${esc(myEmail)}. Pour te connecter sur un autre appareil, utilise « Recevoir un lien de connexion » depuis cet appareil-là.</p>`;
    html+=`<div class="row" style="justify-content:flex-start;margin-top:8px"><button class="btn" id="notifBtn">${"Notification" in window&&Notification.permission==="granted"?"Notifications activées":"Activer les notifications"}</button></div>
      <p class="msg">Le site te prévient quand ta vidéo est validée ou quand ton record est battu, tant qu'il est ouvert dans un onglet.</p>
      <div class="danger"><b>Supprimer toutes mes données</b><p class="msg">Efface ton pseudo, tes scores, tes vidéos et les records que tu as créés. Action définitive.</p>
      <div id="delZone"><button class="btn sm bad" id="delAsk">Supprimer mon compte</button></div></div></div>`;
  }
  box.innerHTML=html;
  if(own)bindAccount();
}
function bindAccount(){
  const lf=$("linkForm"); if(lf)lf.onsubmit=async e=>{e.preventDefault();try{await DB.linkEmail($("linkEmail").value.trim());toast("E-mail envoyé : clique sur le lien reçu pour confirmer.")}catch(err){toast("Impossible : "+(err.message||err))}};
  const lg=$("loginForm"); if(lg)lg.onsubmit=async e=>{e.preventDefault();try{await DB.emailLogin($("loginEmail").value.trim());toast("Lien envoyé : ouvre-le sur cet appareil pour te connecter.")}catch(err){toast(/not found|signups not allowed/i.test(err.message)?"Aucun compte protégé avec cet e-mail.":"Impossible : "+(err.message||err))}};
  const nb=$("notifBtn"); if(nb)nb.onclick=async()=>{if(!("Notification" in window)){toast("Ton navigateur ne gère pas les notifications.");return}
    const p=await Notification.requestPermission();toast(p==="granted"?"Notifications activées":"Notifications refusées par le navigateur");renderProfile()};
  const da=$("delAsk"); if(da)da.onclick=()=>{$("delZone").innerHTML=`<p class="msg bad">Sûr ? Tout sera effacé, sans retour possible.</p><div class="row" style="justify-content:flex-start"><button class="btn sm bad" id="delYes">Oui, tout supprimer</button><button class="btn sm ghost" id="delNo">Annuler</button></div>`;
    $("delNo").onclick=renderProfile;$("delYes").onclick=()=>{$("delYes").disabled=true;DB.deleteAccount()}};
}

/* ================= notifications ================= */
function notifItems(){
  const out=[]; if(!myId)return out;
  const mine=list().filter(a=>a.uid===myId), flags=recordFlags();
  for(const a of mine){if(a.status==="ok")out.push({k:"ok-"+a.id,t:`Ta vidéo « ${CHM[a.c].name} » (${CHM[a.c].fmt(a.v)}) a été validée !`,h:"#profil"});
    if(a.status==="no")out.push({k:"no-"+a.id,t:`Ta vidéo « ${CHM[a.c].name} » a été refusée.`,h:"#profil"})}
  for(const c of CH){const top=boardFor(c.id)[0]; if(!top||top.uid===myId)continue;
    if(mine.some(a=>a.c===c.id&&flags.has(a.id)))out.push({k:"beat-"+top.id,t:`${top.pseudo} a battu ton record sur « ${c.name} » : ${c.fmt(top.v)}`,h:"#c-"+c.id})}
  if(isAdmin){const p=list().filter(a=>a.status==="pending"&&!a.hidden).length, f=list().filter(a=>a.hidden).length;
    if(p)out.push({k:"adm-p-"+p+"-"+list().filter(a=>a.status==="pending").map(a=>a.id).slice(0,1),t:`${p} vidéo(s) à vérifier`,h:"#records"});
    if(f)out.push({k:"adm-f-"+f,t:`${f} vidéo(s) masquée(s) après signalements`,h:"#records"})}
  return out;
}
let notified=new Set(), notifInit=false;
function renderNotifs(){
  const seen=new Set(lsGet("wur_seen",[])), items=notifItems(), unread=items.filter(i=>!seen.has(i.k));
  const b=$("bellCount"); b.textContent=unread.length; b.hidden=!unread.length;
  $("notifList").innerHTML=items.length?items.slice(0,30).map(i=>`<a class="nitem ${seen.has(i.k)?"":"unread"}" href="${i.h}" ${i.cid?`data-goto="records" data-filter="c:${esc(i.cid)}"`:""}>${esc(i.t)}</a>`).join(""):`<p class="msg" style="padding:10px">Rien de nouveau. Les validations de tes vidéos et les records battus apparaîtront ici.</p>`;
  const tabRec=document.querySelector('nav.tabs a[data-tab="records"]'); const pc=isAdmin?list().filter(a=>a.status==="pending"&&!a.hidden).length:0;
  tabRec.textContent=pc?`Records (${pc})`:"Records";
}
function notifyNew(){
  const seen=new Set(lsGet("wur_seen",[])), items=notifItems().filter(i=>!seen.has(i.k));
  if(!notifInit){items.forEach(i=>notified.add(i.k));notifInit=true;return}
  for(const i of items){if(notified.has(i.k))continue;notified.add(i.k);
    if("Notification" in window&&Notification.permission==="granted"){try{new Notification("WorldUltimateRecords",{body:i.t,icon:"img/logo.jpg",tag:i.k})}catch(e){}}
    else toast(i.t)}
}
const bell=$("bell"), panelN=$("notifPanel");
bell.onclick=e=>{e.stopPropagation();panelN.hidden=!panelN.hidden;bell.setAttribute("aria-expanded",String(!panelN.hidden));
  if(!panelN.hidden){const ks=notifItems().map(i=>i.k);lsSet("wur_seen",Array.from(new Set(lsGet("wur_seen",[]).concat(ks))).slice(-500));setTimeout(renderNotifs,1500)}};
document.addEventListener("click",e=>{if(!panelN.hidden&&!e.target.closest("#notifPanel")&&!e.target.closest("#bell"))panelN.hidden=true});

/* ================= report dialog ================= */
function openReport(id){
  const a=attempts.find(x=>x.id===id); if(!a)return;
  $("modalTitle").textContent="Signaler cette vidéo"; const f=$("modalFrame"); f.className="frame form";
  f.innerHTML=`<form id="repForm" class="repform"><p class="msg">${plink(a)} · ${esc(CHM[a.c].name)}</p>
    ${Object.entries(REASONS).map(([k,v],i)=>`<label class="radio"><input type="radio" name="reason" value="${k}" ${i?"":"checked"}> ${esc(v)}</label>`).join("")}
    <p class="msg">Après 3 signalements, la vidéo est masquée en attendant la décision de l'administrateur.</p>
    <button class="btn solid" type="submit">Envoyer le signalement</button></form>`;
  $("modalLink").hidden=true; modal.hidden=false;
  $("repForm").onsubmit=async e=>{e.preventDefault();const r=new FormData(e.target).get("reason");if(await DB.report(id,r)){closeVideo();toast("Merci, ton signalement a été envoyé.")}};
}

/* ================= legal page ================= */
function renderLegal(){
  const ed=CFG.editorName||"[à compléter dans config.js : ton nom ou pseudo d'éditeur]";
  const mail=CFG.contactEmail||"[à compléter dans config.js : adresse e-mail de contact]";
  document.querySelectorAll("[data-cfg=editor]").forEach(e=>e.textContent=ed);
  document.querySelectorAll("[data-cfg=mail]").forEach(e=>e.textContent=mail);
  document.querySelectorAll("[data-cfg=siret]").forEach(e=>e.textContent=CFG.siret?" (SIRET "+CFG.siret+")":"");
  document.querySelectorAll("[data-cfg=tva]").forEach(e=>e.textContent=CFG.tvaMention?" ("+CFG.tvaMention+")":"");
  document.querySelectorAll("[data-cfg=mediator]").forEach(e=>e.textContent=CFG.mediator||"[à compléter dans config.js : nom et site du médiateur]");
  document.querySelectorAll("[data-cfg=price]").forEach(e=>e.textContent=CFG.passPrice||"2,99 €");
  $("footContact").textContent=CFG.contactEmail?"· Contact : "+CFG.contactEmail:"";
}
function statusBadge(a){
  if(a.hidden)return '<span class="badge no">Masquée</span>';
  return {auto:"",ok:'<span class="badge ok">Vidéo validée</span>',pending:'<span class="badge pend">À vérifier</span>',no:'<span class="badge no">Refusée</span>'}[a.status]||"";
}

/* ================= Pass Néon (abonnement) ================= */
const PRICE=CFG.passPrice||"2,99 €";
function payUrl(){
  const u=new URL(CFG.stripePaymentLink); u.searchParams.set("client_reference_id",myId);
  if(myEmail)u.searchParams.set("prefilled_email",myEmail); return u.toString();
}
function payBlocker(){
  if(!live)return "Le paiement s'activera quand le site sera relié à son classement en ligne (étapes 1 à 5 du guide).";
  if(!CFG.stripePaymentLink)return "L'abonnement ouvre bientôt : le lien de paiement n'est pas encore configuré.";
  if(isAnon)return "anon";
  return "";
}
function renderPass(){
  document.querySelectorAll("[data-cfg=price]").forEach(e=>e.textContent=PRICE);
  const box=$("passBox"); let h="";
  const until=mySub&&mySub.current_period_end?new Date(mySub.current_period_end).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}):"";
  if(isMember()&&live){
    h=`<p class="msg good"><b>Tu es membre du Pass Néon${until?" jusqu'au "+esc(until)+" (renouvellement automatique)":""}.</b> Merci de soutenir WorldUltimateRecords !</p>
    ${CFG.stripePortalLink?`<a class="btn" href="${esc(CFG.stripePortalLink)}" target="_blank" rel="noopener">Gérer ou résilier mon abonnement</a>`:""}`;
    box.innerHTML=h; return;
  }
  h=`<h2>S'abonner</h2>
    <div class="consent">
      <label class="check"><input type="checkbox" id="pc1"> J'ai lu et j'accepte les <a href="#legal" target="_blank">conditions de l'abonnement</a>.</label>
      <label class="check"><input type="checkbox" id="pc2"> Je veux profiter du Pass tout de suite et je renonce à mon droit de rétractation de 14 jours.</label>
      <label class="check"><input type="checkbox" id="pc3"> J'ai 18 ans ou plus, ou c'est un parent qui paie et qui accepte l'abonnement.</label>
    </div>
    <a class="btn solid gold big off" id="payBtn" href="#" target="_blank" rel="noopener" aria-disabled="true">Payer ${esc(PRICE)} / mois</a>
    <p class="msg" id="payMsg">Coche les trois cases pour accéder au paiement.</p>
    <p class="msg">Paiement sécurisé par Stripe (carte bancaire, Apple Pay, Google Pay). Ton Pass s'active quelques secondes après le paiement : reviens ensuite sur cet onglet. Résiliable à tout moment.</p>
    ${CFG.stripePortalLink?`<p class="msg">Déjà abonné ? <a href="${esc(CFG.stripePortalLink)}" target="_blank" rel="noopener">Gérer mon abonnement</a></p>`:""}`;
  box.innerHTML=h;
  const pay=$("payBtn"), msg=$("payMsg");
  const sync=()=>{
    const checked=$("pc1").checked&&$("pc2").checked&&$("pc3").checked, bl=payBlocker(), ok=checked&&!bl;
    pay.setAttribute("aria-disabled",String(!ok)); pay.classList.toggle("off",!ok); pay.href=ok?payUrl():"#";
    msg.className="msg"+(checked&&bl?" bad":"");
    msg.innerHTML=!checked?"Coche les trois cases pour accéder au paiement."
      :bl==="anon"?`Dernière étape : <a href="#profil">protège ton compte avec ton e-mail</a> pour garder ton Pass sur tous tes appareils.`
      :bl?esc(bl):"Tout est prêt : clique pour payer sur la page sécurisée de Stripe.";
  };
  ["pc1","pc2","pc3"].forEach(i=>$(i).onchange=sync); sync();
  pay.onclick=e=>{
    if(pay.getAttribute("aria-disabled")==="true"){e.preventDefault();sync();msg.classList.add("bad");return}
    let n=0;const iv=setInterval(()=>{DB.refresh();if(++n>24||isMember())clearInterval(iv)},5000);
  };
}
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&live)DB.refresh()});

/* ================= full ranking ================= */
let rankCid=null;
function renderRanking(){
  const c=CHM[rankCid], box=$("rankBox");
  if(!c){box.innerHTML=`<div class="empty">Ce défi n'existe pas ou a été supprimé. <a href="#records">Voir tous les classements</a></div>`;return}
  const q=($("rankQ")&&$("rankQ").value||"").trim().toLowerCase();
  const all=boardFor(c.id), top=all[0];
  const rows=all.map((a,i)=>({a,rank:i+1})).filter(r=>!q||r.a.pseudo.toLowerCase().includes(q));
  const me=all.findIndex(a=>a.uid===myId);
  const gap=a=>{if(!top||a===top)return"—";const d=Math.abs(a.v-top.v);return (c.better==="low"?"+":"−")+(c.mode==="count"||c.id==="clicks"||c.id==="memory"||c.id==="mental"||c.id==="stroop"?Math.round(d):c.id==="reaction"||c.id==="chrono"?Math.round(d)+" ms":fr(d,2)+(c.mode==="hold"?" s":" s"))};
  const keep=$("rankQ")?$("rankQ").value:"";
  box.innerHTML=`<p class="eyebrow"><a href="#records">Classements</a> › ${esc(c.name)}</p>
    <h1>${esc(c.name)}</h1>
    <p class="lede">${all.length} joueur${all.length>1?"s":""} classé${all.length>1?"s":""} · ${c.better==="low"?"le plus bas gagne":"le plus haut gagne"} · meilleur score validé de chaque joueur${me>=0?` · <b>tu es ${me+1}<sup>${me?"e":"er"}</sup></b>`:""}</p>
    ${wrBox(c)}
    <div class="row" style="justify-content:flex-start;margin:16px 0">
      ${c.kind==="vip"&&!isMember()?`<a class="btn solid gold" href="#membre">Réservé au Pass Néon</a>`:`<button class="btn solid" data-play="${esc(c.id)}">Tenter ce record</button>`}
      <input id="rankQ" class="field" type="search" placeholder="Chercher un joueur…" aria-label="Chercher un joueur dans ce classement" value="${esc(keep)}" style="flex:1;min-width:180px;max-width:320px">
    </div>
    ${all.length?`<div class="tablewrap"><table class="ranking"><thead><tr><th>Rang</th><th>Joueur</th><th class="r">Score</th><th class="r">Écart avec le 1<sup>er</sup></th><th>Date</th><th>Preuve</th></tr></thead><tbody>
      ${rows.map(({a,rank})=>`<tr class="${a.uid===myId?"me":""}"><td><span class="rk m${rank-1} num">${rank}</span></td><td>${plink(a)}${a.uid===myId?' <span class="badge ok">toi</span>':""}</td>
        <td class="r num">${esc(c.fmt(a.v))}</td><td class="r num">${esc(gap(a))}</td><td>${esc(new Date(a.t).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}))}</td>
        <td>${a.vid?`<a href="#" data-pvid="${esc(a.id)}">vidéo</a>`:c.kind==="web"?'<span class="msg">navigateur</span>':""}</td></tr>`).join("")||`<tr><td colspan="6"><div class="empty" style="border:0">Aucun joueur ne correspond à « ${esc(q)} ».</div></td></tr>`}
      </tbody></table></div>`:`<div class="empty">Personne n'est encore classé sur ce défi. Le premier score validé prend la 1<sup>re</sup> place.</div>`}`;
  const rq=$("rankQ"); rq.oninput=()=>{const pos=rq.selectionStart;renderRanking();const n=$("rankQ");n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}};
}

/* ================= tabs ================= */
function showTab(id){
  profileUid=null;
  if(/^p-[0-9a-f-]{36}$/.test(id)){profileUid=id.slice(2);id="profil"}
  if(/^c-[a-z0-9-]{2,60}$/.test(id)){rankCid=id.slice(2);id="classement";renderRanking()}
  if(!["defis","records","shorts","profil","legal","membre","classement"].includes(id))id="defis";
  if(id==="membre")renderPass();
  if(id==="profil")renderProfile();
  currentTab=id;
  document.querySelectorAll(".view").forEach(v=>v.hidden=v.id!==id);
  document.querySelectorAll("nav.tabs a").forEach(a=>a.setAttribute("aria-current",a.dataset.tab===id&&!(id==="profil"&&profileUid&&profileUid!==myId)?"page":"false"));
  document.querySelector(".foot").hidden=id==="shorts";
  if(id!=="shorts"){document.querySelectorAll(".short video").forEach(v=>v.pause());document.querySelectorAll(".short iframe").forEach(f=>f.remove())}
  else requestAnimationFrame(()=>{document.querySelectorAll(".short canvas").forEach(cv=>drawBg(cv,0));setupObserver()});
  window.scrollTo(0,0);
}
window.addEventListener("hashchange",()=>showTab(location.hash.slice(1)));
showTab(location.hash.slice(1)||"defis");

/* ================= video modal ================= */
const modal=$("modal");
function openVideo(title,src,shape,link){
  $("modalTitle").textContent=title;
  const f=$("modalFrame"); f.className="frame"+(shape==="h"?" wide":"");
  f.innerHTML=src.kind==="iframe"
    ?`<iframe src="${esc(src.url)}" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`
    :`<video src="${esc(src.url)}" controls autoplay playsinline></video>`;
  const l=$("modalLink"); l.hidden=!link; if(link)l.href=link;
  modal.hidden=false; document.querySelectorAll(".short video").forEach(v=>v.pause());
}
function closeVideo(){modal.hidden=true;$("modalFrame").innerHTML=""}
$("modalClose").onclick=closeVideo;
modal.addEventListener("click",e=>{if(e.target===modal)closeVideo()});

/* ================= global clicks ================= */
document.addEventListener("click",async e=>{
  const w=e.target.closest("[data-watch]"); if(w){e.preventDefault();const c=CHM[w.dataset.watch];if(c&&c.wr&&c.wr.video)openVideo(c.wr.who+" · "+c.fmt(c.wr.v),{kind:"iframe",url:embedUrl(c.wr.video,true)},c.wr.video.shape,vidUrl(c.wr.video));return}
  const il=e.target.closest("[data-inline]"); if(il){const c=CHM[il.dataset.inline],s=il.closest(".short");
    if(c&&s&&!s.querySelector("iframe")){const f=document.createElement("iframe");f.src=embedUrl(c.wr.video,true);f.title=c.name;f.allow="autoplay; encrypted-media; picture-in-picture; fullscreen";f.allowFullscreen=true;s.appendChild(f)}return}
  const rp=e.target.closest("[data-report]"); if(rp){e.preventDefault();openReport(rp.dataset.report);return}
  const yt=e.target.closest("[data-yt]"); if(yt){openVideo("WorldUltimateRecords",{kind:"iframe",url:embedUrl({type:"yt",id:yt.dataset.yt},true)},"v","https://www.youtube.com/shorts/"+yt.dataset.yt);return}
  const dl=e.target.closest("[data-del]"); if(dl){if(dl.dataset.confirm!=="1"){dl.dataset.confirm="1";dl.textContent="Confirmer ?";setTimeout(()=>{if(dl.isConnected){dl.dataset.confirm="";dl.textContent="Supprimer"}},4000);return}
    dl.disabled=true;if(await DB.deleteAttempt(dl.dataset.del))toast("Tentative supprimée");return}
  const hd=e.target.closest("[data-hide]"); if(hd){hd.disabled=true;if(await DB.setHidden(hd.dataset.hide,true))toast("Vidéo masquée");return}
  const uh=e.target.closest("[data-unhide]"); if(uh){uh.disabled=true;if(await DB.setHidden(uh.dataset.unhide,false))toast("Vidéo rétablie");return}
  const pv=e.target.closest("[data-pvid]"); if(pv){e.preventDefault();const a=attempts.find(x=>x.id===pv.dataset.pvid);if(a&&a.vid)openVideo(a.pseudo+" · "+CHM[a.c].fmt(a.v),{kind:"video",url:a.vid},"v",null);return}
  const cl=e.target.closest("[data-close]"); if(cl){closeArena()}
  const p=e.target.closest("[data-play]"); if(p){openArena(p.dataset.play);return}
  const ch=e.target.closest("[data-chip]"); if(ch){filterC=ch.dataset.chip;renderRecords();return}
  const g=e.target.closest("[data-goto]"); if(g){filterC=g.dataset.filter||"all";location.hash=g.dataset.goto;renderRecords();return}
  const sv=e.target.closest(".short video"); if(sv){sv.muted=!sv.muted;toast(sv.muted?"Son coupé":"Son activé");return}
  const vd=e.target.closest("[data-verdict]"); if(vd){vd.disabled=true;if(await DB.setStatus(vd.dataset.id,vd.dataset.verdict))toast(vd.dataset.verdict==="ok"?"Tentative validée":"Tentative refusée");else vd.disabled=false;return}
  const sh=e.target.closest("[data-share]"); if(sh){
    const url=location.href.split("#")[0];
    if(navigator.share){navigator.share({title:"WorldUltimateRecords",text:"Viens battre des records !",url}).catch(()=>{});return}
    if(navigator.clipboard)navigator.clipboard.writeText(url).then(()=>toast("Lien copié"),()=>toast("Lien : "+url)); else toast("Lien : "+url);
  }
});
$("q").addEventListener("input",renderRecords);
let toastT; function toast(m){const t=$("toast");t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,3600)}
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(!modal.hidden)closeVideo();else if(!arena.hidden)closeArena()}});

/* ================= create a record ================= */
const form=$("createForm"), openBtn=$("openCreate");
openBtn.onclick=()=>{form.hidden=!form.hidden;openBtn.setAttribute("aria-expanded",String(!form.hidden));if(!form.hidden)$("cName").focus()};
$("cCancel").onclick=()=>{form.hidden=true;openBtn.setAttribute("aria-expanded","false")};
const syncMode=()=>{const m=$("cMode").value;$("cWinWrap").hidden=m!=="count";$("cUnitWrap").hidden=m!=="count"};
$("cMode").onchange=syncMode; syncMode();
form.addEventListener("submit",async e=>{
  e.preventDefault(); const msg=$("cMsg");
  const name=$("cName").value.trim(), desc=$("cDesc").value.trim();
  if(name.length<4||desc.length<10){msg.textContent="Donne un nom (4 caractères min.) et des règles claires (10 caractères min.).";msg.className="msg bad";return}
  if(CH.some(c=>c.name.toLowerCase()===name.toLowerCase())){msg.textContent="Ce record existe déjà : cherche-le dans la liste.";msg.className="msg bad";return}
  const m=$("cMode").value;
  const it={id:"x-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,6),name,description:desc,mode:m,win:+$("cWin").value,unit:$("cUnit").value.trim()||"répétitions"};
  $("cSubmit").disabled=true; const ok=await DB.addChallenge(it); $("cSubmit").disabled=false;
  if(ok){form.reset();syncMode();form.hidden=true;openBtn.setAttribute("aria-expanded","false");msg.textContent="";toast("Record publié. À toi de poser le premier score !")}
  else{msg.textContent="La publication a échoué. Réessaie.";msg.className="msg bad"}
});

/* ================= admin ================= */
$("adminBtn").onclick=()=>{
  if(!live){toast("L'espace admin fonctionne une fois Supabase configuré.");return}
  if(isAdmin){location.hash="records";toast("Tu es déjà connecté en administrateur.");return}
  arena.hidden=false; document.body.style.overflow="hidden"; $("arenaTitle").textContent="Espace admin"; clearGame();
  stage.innerHTML=`<form class="login" id="lf"><input class="field" id="le" type="email" placeholder="E-mail administrateur" autocomplete="username" required>
    <input class="field" id="lp" type="password" placeholder="Mot de passe" autocomplete="current-password" required>
    <button class="btn solid" type="submit">Se connecter</button><p class="msg" id="lm"></p></form>`;
  $("lf").onsubmit=async ev=>{ev.preventDefault();const m=$("lm");m.textContent="Connexion…";
    try{const ok=await DB.adminLogin($("le").value.trim(),$("lp").value);
      if(ok){closeArena();await DB.refresh();location.hash="records";toast("Connecté en administrateur")}
      else{m.textContent="Ce compte n'est pas administrateur.";m.className="msg bad"}}
    catch(err){m.textContent="Connexion refusée : "+(err.message||err);m.className="msg bad"}};
};

/* ================= arena ================= */
const arena=$("arena"), stage=$("stage");
let cleanup=[];
function clearGame(){cleanup.forEach(f=>{try{f()}catch(e){}});cleanup=[];stage.className="stage";stage.onpointerdown=null}
const later=(f,ms)=>{const id=setTimeout(f,ms);cleanup.push(()=>clearTimeout(id));return id};
function openArena(cid){
  const c=CHM[cid]; if(!c)return;
  arena.hidden=false; document.body.style.overflow="hidden";
  document.querySelectorAll(".short video").forEach(v=>v.pause());
  $("arenaTitle").textContent=c.name; practice=false; introSkip=false;
  if(c.kind==="vip"&&!isMember()){showLimit(c,"vip");return}
  if(c.kind==="web")GAMES[cid](c); else camIntro(c);
}
function closeArena(){clearGame();arena.hidden=true;document.body.style.overflow=""}
$("arenaClose").onclick=closeArena;
function remaining(cid){return isMember()?Infinity:Math.max(0,LIMIT-((usage[cid]||{}).started||0))}
function remainingText(cid){const r=remaining(cid);return r===Infinity?"Essais illimités (Pass Néon)":`Essais officiels restants aujourd'hui : ${r}/${LIMIT}`}
function showLimit(c,reason){
  clearGame();
  stage.innerHTML=reason==="vip"
    ?`<div class="result"><span class="eyebrow">Défi exclusif</span><h2>Réservé aux membres du Pass Néon</h2>
       <p class="hint">${esc(c.desc)}</p><div class="row"><a class="btn solid gold" href="#membre" data-close="1">Découvrir le Pass Néon</a></div></div>`
    :`<div class="result"><span class="eyebrow">Plus d'essais aujourd'hui</span><h2>Tu as utilisé tes ${LIMIT} essais sur « ${esc(c.name)} »</h2>
       <p class="hint">Tes essais reviennent demain à minuit. Tu peux tenter un autre défi${c.kind==="web"?", t'entraîner sans enregistrer":""}, ou passer au Pass Néon pour des essais illimités.</p>
       <div class="row">${c.kind==="web"?`<button class="btn" id="pracBtn">S'entraîner sans enregistrer</button>`:""}<a class="btn solid gold" href="#membre" data-close="1">Essais illimités avec le Pass Néon</a></div></div>`;
  const pb=$("pracBtn"); if(pb)pb.onclick=()=>{practice=true;introSkip=true;GAMES[c.id](c)};
}
function intro(c,startLabel,onStart){
  if(introSkip){introSkip=false;return onStart()}
  clearGame(); const b=boardFor(c.id)[0];
  stage.innerHTML=`<div class="ico" style="width:64px;height:64px">${icon(c)}</div><p class="hint">${esc(c.desc)}</p>
    ${c.wr?`<p class="msg">Record du monde : <b style="color:var(--wr)">${esc(c.fmt(c.wr.v))}</b> par ${esc(c.wr.who)}</p>`:""}
    <p class="msg">${b?`Record du site : <b style="color:var(--gold)">${esc(c.fmt(b.v))}</b> par ${plink(b)}`:"Aucun record du site : ton score peut devenir le premier."}</p>
    <p class="msg">${remainingText(c.id)}</p>
    <div class="row"><button class="btn solid" id="startBtn">${esc(startLabel)}</button>${remaining(c.id)!==Infinity?`<button class="btn ghost" id="pracBtn">S'entraîner (sans enregistrer)</button>`:""}</div>`;
  $("startBtn").onclick=async e=>{e.stopPropagation();const bt=$("startBtn");bt.disabled=true;
    if(!(await DB.ensureProfile())){bt.disabled=false;return}
    const r=await DB.startAttempt(c.id); if(!r.ok){if(r.reason!=="error")showLimit(c,r.reason);else bt.disabled=false;return}
    practice=false; onStart()};
  const pb=$("pracBtn"); if(pb)pb.onclick=e=>{e.stopPropagation();practice=true;onStart()};
  $("startBtn").focus();
}
function compare(c,v){
  const board=boardFor(c.id), rec=board[0], mine=board.find(r=>r.uid===myId);
  return {rec,isRec:!rec||isBetter(c,v,rec.v),isPB:!mine||isBetter(c,v,mine.v),rank:board.filter(r=>r.uid!==myId&&isBetter(c,r.v,v)).length+1,
    beatsWR:c.wr?(c.better==="low"?v<c.wr.v:v>c.wr.v):false};
}
function pseudoField(){return pseudoIn.value.trim()?"":`<input id="pseudo2" class="field" maxlength="24" placeholder="Ton pseudo">`}
function takePseudo(msgEl){const p2=$("pseudo2");if(!p2)return true;const n=p2.value.trim().slice(0,24);
  if(!n){p2.focus();msgEl.textContent="Choisis d'abord un pseudo.";msgEl.className="msg bad";return false}
  pseudoIn.value=n;lsSet("wur_pseudo",n);return true}
function finish(c,v,extra){
  clearGame(); const k=compare(c,v);
  stage.innerHTML=`<div class="result">
    <span class="eyebrow">${k.isRec?"Nouveau record du site !":k.isPB?"Record personnel !":"Ton score"}</span>
    <div class="mega ${k.isRec?"gold":""}">${esc(c.fmt(v))}</div>
    ${extra?`<p class="msg">${extra}</p>`:""}
    ${c.wr?`<p class="msg">${k.beatsWR?"Mieux que le record du monde officiel ! (non homologué)":"Record du monde : "+esc(c.fmt(c.wr.v))}</p>`:""}
    ${k.rec&&!k.isRec?`<p class="msg">Record du site : ${esc(c.fmt(k.rec.v))} par ${plink(k.rec)} · tu serais ${k.rank}<sup>e</sup></p>`:""}
    ${practice?"":pseudoField()}
    <div class="row">${practice?"":`<button class="btn solid" id="saveBtn">Enregistrer ma tentative</button>`}<button class="btn" id="againBtn">Rejouer</button></div>
    <p class="msg" id="saveMsg">${practice?"Mode entraînement : ce score n'est pas enregistré.":pseudoIn.value.trim()?"Enregistrée sous « "+esc(pseudoIn.value.trim())+" ».":"Ajoute un pseudo pour apparaître au classement."}</p>
    <p class="msg">${remainingText(c.id)}</p></div>`;
  if(practice){$("againBtn").onclick=()=>{introSkip=remaining(c.id)===0;GAMES[c.id](c)};return}
  $("againBtn").onclick=()=>GAMES[c.id](c);
  const sb_=$("saveBtn"), m=$("saveMsg");
  sb_.onclick=async()=>{ if(!takePseudo(m))return; sb_.disabled=true;sb_.textContent="Enregistrement…";
    if(await DB.addAttempt({c:c.id,v:Math.round(v*1000)/1000,status:"auto"})){sb_.textContent="Enregistrée";m.textContent=k.isRec?"Tu détiens le record du site.":"Ta tentative est dans le classement.";m.className="msg good"}
    else{sb_.disabled=false;sb_.textContent="Enregistrer ma tentative";m.className="msg bad";m.textContent="L'enregistrement a échoué. Réessaie."}};
}

/* ================= live camera challenge ================= */
const CODE_CHARS="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newCode(){const a=new Uint32Array(6);crypto.getRandomValues(a);return "W-"+Array.from(a,x=>CODE_CHARS[x%CODE_CHARS.length]).join("")}
function pickMime(){
  const o=["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm","video/mp4"];
  for(const m of o){try{if(MediaRecorder.isTypeSupported(m))return m}catch(e){}} return "";
}
function camIntro(c){
  clearGame(); stage.classList.add("top");
  const what=c.mode==="count"?`le plus de ${esc(c.unit)} en ${c.win} secondes`:c.mode==="time"?"le temps le plus court":"tenir le plus longtemps possible";
  const b=boardFor(c.id)[0];
  stage.innerHTML=`<p class="hint">${esc(c.desc)}</p>
    <div class="row">${c.wr?`<span class="badge wr">Monde : ${esc(c.fmt(c.wr.v))} · ${esc(c.wr.who)}</span>`:""}${b?`<span class="badge">Site : ${esc(c.fmt(b.v))} · ${plink(b)}</span>`:""}</div>
    ${c.wr&&c.wr.video?`<button class="wrlink" style="background:none;border:0;cursor:pointer" data-watch="${esc(c.id)}">${PLAY}Regarder le record du monde avant de te lancer</button>`:""}
    <ol class="steps">
      <li><span class="n">1</span><span><b>Autorise la caméra</b> et place-toi pour qu'on te voie en entier. Objectif : ${what}.</span></li>
      <li><span class="n">2</span><span><b>Lance l'enregistrement</b> : un compte à rebours de 3 secondes démarre, puis le chrono tourne. Le code de ta tentative et le chrono sont incrustés dans la vidéo.</span></li>
      <li><span class="n">3</span><span>${c.mode==="count"?`<b>L'enregistrement s'arrête seul</b> après ${c.win} secondes. Indique ensuite ton total.`:`<b>Appuie sur STOP</b> dès que tu as fini${c.mode==="hold"?" ou que tu lâches":""}.`}</span></li>
      <li><span class="n">4</span><span><b>Envoie ta vidéo</b>. Elle entre au classement une fois vérifiée.</span></li>
    </ol>
    ${pseudoField()}
    <div class="consent">
      <label class="check"><input type="checkbox" id="cs1"> J'ai 15 ans ou plus, ou un parent m'a donné son accord pour publier cette vidéo.</label>
      <label class="check"><input type="checkbox" id="cs2"> J'accepte que ma vidéo soit visible publiquement sur ce site. Je peux la supprimer à tout moment depuis mon profil. <a href="#legal" target="_blank">En savoir plus</a></label>
    </div>
    <button class="btn solid" id="camOn" disabled>Ouvrir la caméra</button><p class="msg bad" id="camErr"></p>`;
  const syncCs=()=>{$("camOn").disabled=!($("cs1").checked&&$("cs2").checked)};$("cs1").onchange=syncCs;$("cs2").onchange=syncCs;
  $("camOn").onclick=async()=>{
    const m=$("camErr"); if(!takePseudo(m))return;
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||typeof MediaRecorder==="undefined"){m.textContent="Ton navigateur ne permet pas de filmer depuis une page web. Essaie avec Chrome, Safari ou Firefox à jour.";return}
    if(!(await DB.ensureProfile())){m.textContent="Choisis un pseudo disponible pour continuer.";return}
    consentAt=new Date().toISOString();
    camRun(c,"user");
  };
}
let consentAt=null;
async function camRun(c,facing){
  clearGame(); stage.classList.add("top");
  let stream;
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facing,width:{ideal:1280},height:{ideal:720}},audio:true})}
  catch(e){stage.innerHTML=`<p class="msg bad">Accès à la caméra refusé ou impossible (${esc(e.name||"erreur")}). Autorise la caméra et le micro pour ce site dans les réglages du navigateur, puis réessaie.</p><button class="btn" id="rb">Réessayer</button>`;$("rb").onclick=()=>camIntro(c);return}
  cleanup.push(()=>stream.getTracks().forEach(t=>t.stop()));
  const code=newCode();
  const v=document.createElement("video"); v.srcObject=stream; v.muted=true; v.playsInline=true; await v.play().catch(()=>{});
  await new Promise(r=>{if(v.videoWidth)r();else v.onloadedmetadata=r});
  const vw=v.videoWidth||1280, vh=v.videoHeight||720, sc=Math.min(1,960/Math.max(vw,vh));
  const W=Math.round(vw*sc/2)*2, H=Math.round(vh*sc/2)*2;
  stage.innerHTML=`<div class="cam"><canvas id="cc"></canvas><span class="rec" id="recTag" hidden>● REC</span><div class="count3" id="c3" hidden></div></div>
    <div class="row" id="ctl"><button class="btn solid" id="go">Lancer l'enregistrement</button><button class="btn ghost" id="flip">Changer de caméra</button></div>
    <p class="msg">Code de cette tentative : <b class="num">${code}</b></p>`;
  const cv=$("cc"); cv.width=W; cv.height=H; const g=cv.getContext("2d");
  const state={phase:"preview",t0:0,tEnd:0,elapsed:0};
  const F=Math.max(14,Math.round(H/20));
  const mirror=facing==="user";
  function draw(){
    if(mirror){g.save();g.translate(W,0);g.scale(-1,1);g.drawImage(v,0,0,W,H);g.restore()}else g.drawImage(v,0,0,W,H);
    const now=performance.now();
    let el=0; if(state.phase==="run")el=(now-state.t0)/1000; else if(state.phase==="done"||state.phase==="tail")el=state.elapsed;
    g.fillStyle="rgba(5,2,10,.72)"; g.fillRect(0,0,W,F*2.2); g.fillRect(0,H-F*3.4,W,F*3.4);
    g.textBaseline="middle"; g.shadowColor="#b04cff"; g.shadowBlur=F*.6;
    g.fillStyle="#efe7fb"; g.font=`700 ${F*.9}px "Chakra Petch",sans-serif`; g.textAlign="left"; g.fillText("WorldUltimateRecords · "+c.name,F*.6,F*1.1);
    g.textAlign="right"; g.font=`700 ${F}px "JetBrains Mono",monospace`; g.fillStyle="#fff"; g.fillText(code,W-F*.6,F*1.1);
    const d=new Date(); g.font=`500 ${F*.6}px "JetBrains Mono",monospace`; g.fillStyle="#d8cdea"; g.fillText(d.toLocaleDateString("fr-FR")+" "+d.toLocaleTimeString("fr-FR"),W-F*.6,H-F*.7);
    let txt,lbl,fin=state.phase==="done"||state.phase==="tail";
    if(c.mode==="count"){const rem=Math.max(0,c.win-el);txt=rem.toFixed(2);lbl=fin?"TERMINÉ":state.phase==="run"?"TEMPS RESTANT":"PRÊT"}
    else if(c.mode==="time"){txt=el.toFixed(2)+" s";lbl=fin?"ARRIVÉE":state.phase==="run"?"CHRONO":"PRÊT"}
    else{const m=Math.floor(el/60),s=el%60;txt=String(m).padStart(2,"0")+":"+s.toFixed(1).padStart(4,"0");lbl=fin?"FIN":state.phase==="run"?"TENUE":"PRÊT"}
    g.textAlign="left"; g.font=`700 ${F*.7}px "Chakra Petch",sans-serif`; g.fillStyle=fin?"#ffc94a":"#b04cff"; g.fillText(lbl,F*.6,H-F*2.5);
    g.font=`700 ${F*1.8}px "JetBrains Mono",monospace`; g.fillStyle=fin?"#ffc94a":"#fff"; g.fillText(txt,F*.6,H-F*1.15);
    g.shadowBlur=0;
    if(state.phase==="run"&&c.mode==="count"&&el>=c.win)endRun();
  }
  let raf; const loop=()=>{draw();raf=requestAnimationFrame(loop)}; loop(); cleanup.push(()=>cancelAnimationFrame(raf));
  // keep drawing when tab is backgrounded (rAF pauses): fallback timer
  const iv=setInterval(()=>{if(document.hidden)draw()},100); cleanup.push(()=>clearInterval(iv));
  $("flip").onclick=()=>camRun(c,facing==="user"?"environment":"user");
  let rec=null, chunks=[], mime="";
  function endRun(){
    if(state.phase!=="run")return;
    state.elapsed=(performance.now()-state.t0)/1000; if(c.mode==="count")state.elapsed=c.win;
    state.phase="tail"; $("ctl").innerHTML=`<p class="msg">Fin de l'enregistrement…</p>`;
    later(()=>{state.phase="done";if(rec&&rec.state!=="inactive")rec.stop()},2000);
  }
  $("go").onclick=async()=>{
    $("go").disabled=true;
    const st=await DB.startAttempt(c.id);
    if(!st.ok){if(st.reason==="error"){$("go").disabled=false;return}showLimit(c,st.reason);return}
    const out=cv.captureStream(30); stream.getAudioTracks().forEach(t=>out.addTrack(t));
    mime=pickMime();
    const bps=c.mode==="hold"?350000:1200000;
    try{rec=new MediaRecorder(out,mime?{mimeType:mime,videoBitsPerSecond:bps,audioBitsPerSecond:64000}:{videoBitsPerSecond:bps})}
    catch(e){toast("Enregistrement impossible sur ce navigateur.");return}
    chunks=[]; rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
    rec.onstop=()=>{const type=(rec.mimeType||mime||"video/webm").split(";")[0];review(c,new Blob(chunks,{type}),type,code,state.elapsed)};
    cleanup.push(()=>{if(rec&&rec.state!=="inactive"){rec.onstop=null;rec.stop()}});
    rec.start(1000); $("recTag").hidden=false; $("flip").remove();
    $("ctl").innerHTML=`<p class="msg">Prépare-toi…</p>`;
    const c3=$("c3"); c3.hidden=false; let n=3; c3.textContent=n;
    const tick=()=>{n--; if(n>0){c3.textContent=n;later(tick,1000)} else {c3.hidden=true; state.phase="run"; state.t0=performance.now();
      $("ctl").innerHTML=c.mode==="count"?`<p class="msg">C'est parti ! Arrêt automatique après ${c.win} secondes.</p>`:`<button class="btn solid bigstop" id="stopBtn">STOP</button>`;
      if($("stopBtn"))$("stopBtn").onclick=endRun;
      if(c.mode==="hold"){const maxMs=25*60*1000;later(()=>{if(state.phase==="run"){toast("Durée maximale de vidéo atteinte (25 min).");endRun()}},maxMs)}
    }};
    later(tick,1000);
  };
}
function review(c,blob,type,code,elapsed){
  clearGame(); stage.classList.add("top");
  const url=URL.createObjectURL(blob);
  const ext=type.includes("mp4")?"mp4":"webm";
  stage.innerHTML=`<p class="eyebrow">Ta tentative</p>
    <video src="${url}" controls playsinline style="width:100%;max-width:520px;max-height:46vh;border-radius:12px;background:#000"></video>
    ${c.mode==="count"?`<label class="msg" for="cnt">Combien de ${esc(c.unit)} as-tu faits en ${c.win} s ?</label><input id="cnt" class="field" type="number" min="1" max="100000" inputmode="numeric" style="max-width:200px">`
      :`<div class="mega">${esc(c.fmt(elapsed))}</div>`}
    <div class="row"><button class="btn solid" id="send">Envoyer pour vérification</button><button class="btn" id="redo">Recommencer</button></div>
    <p class="msg" id="sm">${(blob.size/1048576).toFixed(1)} Mo · code ${code}</p>`;
  $("redo").onclick=()=>{URL.revokeObjectURL(url);camIntro(c)};
  $("send").onclick=async()=>{
    const m=$("sm"); let value=elapsed;
    if(c.mode==="count"){value=Math.round(+$("cnt").value);if(!(value>0)){m.textContent="Indique ton total.";m.className="msg bad";return}}
    if(blob.size>48*1048576){m.textContent="Vidéo trop lourde (plus de 48 Mo). Recommence avec une tentative plus courte.";m.className="msg bad";return}
    $("send").disabled=true; m.className="msg"; m.textContent="Envoi de la vidéo…";
    try{
      const up=await DB.uploadVideo(blob,ext);
      const ok=await DB.addAttempt({c:c.id,v:Math.round(value*1000)/1000,status:"pending",path:up.path,localUrl:up.localUrl,code,consent:consentAt||new Date().toISOString()});
      if(!ok)throw new Error("score non enregistré");
      const k=compare(c,value);
      clearGame();
      stage.innerHTML=`<div class="result"><span class="eyebrow">Tentative envoyée</span><div class="mega">${esc(c.fmt(value))}</div>
        ${c.wr?`<p class="msg">${k.beatsWR?"Mieux que le record du monde officiel ! Contacte Guinness World Records pour une homologation.":"Record du monde : "+esc(c.fmt(c.wr.v))}</p>`:""}
        <p class="msg good">Elle apparaîtra au classement dès qu'elle sera validée.</p>
        <div class="row"><button class="btn" id="again">Nouvelle tentative</button></div></div>`;
      $("again").onclick=()=>camIntro(c);
    }catch(e){$("send").disabled=false;m.textContent="Envoi impossible : "+(e.message||e)+". Réessaie.";m.className="msg bad"}
  };
}

/* ================= browser games ================= */
const GAMES={
  mental(c){
    intro(c,"Commencer",()=>{
      clearGame(); let ok=0,ans=0,start=0,iv;
      const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
      const next=()=>{const t=rnd(0,2);let a,b,q;
        if(t===0){a=rnd(2,60);b=rnd(2,60);ans=a+b;q=a+" + "+b}
        else if(t===1){a=rnd(10,99);b=rnd(2,a);ans=a-b;q=a+" − "+b}
        else{a=rnd(2,12);b=rnd(2,12);ans=a*b;q=a+" × "+b}
        $("mq").textContent=q+" = ?";$("mi").value=""};
      stage.innerHTML=`<div class="mega num" id="tm" style="font-size:36px">30,00</div><div class="mega num" id="mq">…</div>
        <input id="mi" class="typeIn num" type="text" inputmode="numeric" autocomplete="off" aria-label="Ta réponse" style="max-width:220px;text-align:center;font-size:28px">
        <p class="msg"><span class="num" id="mc">0</span> bonne(s) réponse(s). La réponse est validée dès qu'elle est juste.</p>`;
      next(); const inp=$("mi"); inp.focus();
      inp.addEventListener("input",()=>{
        if(!start){start=performance.now();iv=setInterval(()=>{const r=Math.max(0,30-(performance.now()-start)/1000);$("tm").textContent=fr(r,2);
          if(r<=0){clearInterval(iv);inp.disabled=true;later(()=>finish(c,ok),300)}},50);cleanup.push(()=>clearInterval(iv))}
        if(inp.value.trim()!==""&&+inp.value===ans){ok++;$("mc").textContent=ok;next()}
      });
    });
  },
  stroop(c){
    const COLS=[["ROUGE","#ff4d6d"],["BLEU","#4d8dff"],["VERT","#3ddc84"],["JAUNE","#ffd23f"],["VIOLET","#b04cff"]];
    intro(c,"Commencer",()=>{
      clearGame(); let score=0,ink=0,start=0,iv,done=false;
      stage.innerHTML=`<div class="mega num" id="tm" style="font-size:36px">30,00</div><div class="mega" id="sw" style="font-family:var(--display)">…</div>
        <div class="row" id="sb">${COLS.map((k,i)=>`<button class="btn" data-ink="${i}" style="border-color:${k[1]};min-width:96px">${k[0].charAt(0)+k[0].slice(1).toLowerCase()}</button>`).join("")}</div>
        <p class="msg">Score : <span class="num" id="sc">0</span> · clique la couleur de l'encre</p>`;
      const next=()=>{const w=Math.floor(Math.random()*5);do{ink=Math.floor(Math.random()*5)}while(ink===w&&Math.random()<.85);
        const el=$("sw");el.textContent=COLS[w][0];el.style.color=COLS[ink][1];el.style.textShadow="0 0 18px "+COLS[ink][1]};
      next();
      $("sb").addEventListener("click",e=>{const b=e.target.closest("[data-ink]");if(!b||done)return;
        if(!start){start=performance.now();iv=setInterval(()=>{const r=Math.max(0,30-(performance.now()-start)/1000);$("tm").textContent=fr(r,2);
          if(r<=0){clearInterval(iv);done=true;later(()=>finish(c,Math.max(0,score)),300)}},50);cleanup.push(()=>clearInterval(iv))}
        score+=(+b.dataset.ink===ink)?1:-1;$("sc").textContent=score;next()});
    });
  },
  alphabet(c){
    const A="abcdefghijklmnopqrstuvwxyz";
    intro(c,"Commencer",()=>{
      clearGame(); let start=0,iv;
      stage.innerHTML=`<div class="typing-target num" id="tt" style="letter-spacing:.12em;text-align:center"></div><input id="ti" class="typeIn" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Tape l'alphabet"><div class="mega num" style="font-size:36px" id="tm">0,00 s</div><p class="msg">Le chrono démarre à la première lettre. Une faute remet la saisie à zéro.</p>`;
      const tt=$("tt"),inp=$("ti"),tm=$("tm");
      const paint=n=>{tt.innerHTML=`<span class="ok">${A.slice(0,n)}</span><span class="rest">${A.slice(n)}</span>`};paint(0);inp.focus();
      inp.addEventListener("paste",e=>{e.preventDefault();toast("Le copier-coller n'est pas autorisé.")});
      inp.addEventListener("input",()=>{
        const val=inp.value.toLowerCase().replace(/\s/g,"");
        if(!A.startsWith(val)){inp.value="";paint(0);toast("Faute : recommence à a");return}
        if(!start&&val.length){start=performance.now();iv=setInterval(()=>tm.textContent=fr((performance.now()-start)/1000,2)+" s",30);cleanup.push(()=>clearInterval(iv))}
        paint(val.length);
        if(val===A){clearInterval(iv);finish(c,(performance.now()-start)/1000)}
      });
    });
  },
  reaction(c){
    intro(c,"Commencer",()=>{
      const times=[];
      const round=()=>{
        clearGame(); stage.classList.add("wait");
        stage.innerHTML=`<div class="mega" style="font-size:40px">Attends…</div><p class="hint">Essai ${times.length+1} sur 3. Clique dès que l'écran devient violet.</p>`;
        let go=0;
        later(()=>{stage.classList.remove("wait");stage.classList.add("go");stage.innerHTML=`<div class="mega">CLIQUE !</div>`;go=performance.now()},1400+Math.random()*2600);
        stage.onpointerdown=()=>{
          if(!go){clearGame();stage.innerHTML=`<div class="mega" style="font-size:40px;color:var(--bad)">Trop tôt</div><p class="hint">Attends que l'écran devienne violet.</p><button class="btn" id="rt">Reprendre cet essai</button>`;$("rt").onclick=round;return}
          const ms=performance.now()-go; times.push(ms); clearGame();
          if(times.length<3){stage.innerHTML=`<div class="mega">${Math.round(ms)} ms</div><button class="btn solid" id="nx">Essai suivant</button>`;$("nx").onclick=round}
          else finish(c,times.reduce((a,b)=>a+b,0)/3,"Essais : "+times.map(t=>Math.round(t)+" ms").join(" · "));
        };
      };
      round();
    });
  },
  clicks(c){
    intro(c,"Prêt",()=>{
      clearGame(); let n=0,start=0,iv;
      stage.innerHTML=`<div class="mega num" id="tm">10.00</div><button class="clickbtn" id="cb">Clique pour démarrer</button><div class="msg"><span class="num" id="cn">0</span> clics</div>`;
      const cb=$("cb"),tm=$("tm"),cn=$("cn");
      cb.onpointerdown=e=>{e.preventDefault();
        if(!start){start=performance.now();cb.textContent="CLIQUE !";
          iv=setInterval(()=>{const r=Math.max(0,10-(performance.now()-start)/1000);tm.textContent=r.toFixed(2);if(r<=0){clearInterval(iv);cb.disabled=true;later(()=>finish(c,n,fr(n/10,1)+" clics par seconde"),300)}},30);
          cleanup.push(()=>clearInterval(iv))}
        if(performance.now()-start<10000){n++;cn.textContent=n}};
    });
  },
  typing(c){
    const S="Un record ne se bat jamais par hasard, il se prépare chaque jour.";
    intro(c,"Commencer",()=>{
      clearGame(); let start=0,iv;
      stage.innerHTML=`<div class="typing-target" id="tt"></div><input id="ti" class="typeIn" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Recopie la phrase"><div class="mega num" style="font-size:36px" id="tm">0,00 s</div>`;
      const tt=$("tt"),inp=$("ti"),tm=$("tm");
      const paint=v=>{let i=0;while(i<v.length&&v[i]===S[i])i++;
        tt.innerHTML=`<span class="ok">${esc(S.slice(0,i))}</span>${v.length>i?`<span class="ko">${esc(S.slice(i,Math.min(v.length,S.length))||" ")}</span>`:""}<span class="rest">${esc(S.slice(Math.max(i,v.length)))}</span>`};
      paint("");inp.focus();
      inp.addEventListener("paste",e=>{e.preventDefault();toast("Le copier-coller n'est pas autorisé.")});
      inp.addEventListener("input",()=>{
        if(!start){start=performance.now();iv=setInterval(()=>tm.textContent=fr((performance.now()-start)/1000,2)+" s",50);cleanup.push(()=>clearInterval(iv))}
        paint(inp.value);
        if(inp.value===S){clearInterval(iv);const s=(performance.now()-start)/1000;finish(c,s,Math.round(S.length/5/(s/60))+" mots par minute")}
      });
    });
  },
  memory(c){
    intro(c,"Commencer",()=>{
      clearGame(); const seq=[]; let pos=0,accept=false;
      stage.innerHTML=`<div class="msg" id="lv">Niveau 1</div><div class="pads">${Array.from({length:9},(_,i)=>`<button class="pad" data-p="${i}" aria-label="Case ${i+1}"></button>`).join("")}</div><div class="msg" id="st">Regarde bien…</div>`;
      const pads=[...stage.querySelectorAll(".pad")],lv=$("lv"),st=$("st");
      const flash=(i,ms)=>{pads[i].classList.add("lit");later(()=>pads[i].classList.remove("lit"),ms)};
      const next=()=>{seq.push(Math.floor(Math.random()*9));pos=0;accept=false;lv.textContent="Niveau "+seq.length;st.textContent="Regarde bien…";
        const sp=Math.max(260,620-seq.length*25);
        seq.forEach((p,k)=>later(()=>flash(p,sp*.7),600+k*sp));
        later(()=>{accept=true;st.textContent="À toi : reproduis la séquence"},600+seq.length*sp)};
      pads.forEach(pd=>pd.onpointerdown=e=>{e.preventDefault();if(!accept)return;const i=+pd.dataset.p;flash(i,160);
        if(i!==seq[pos]){accept=false;pd.style.background="var(--bad)";later(()=>finish(c,seq.length-1,"Erreur au niveau "+seq.length),500);return}
        pos++;if(pos===seq.length){accept=false;st.textContent="Bravo !";later(next,650)}});
      next();
    });
  },
  aim(c){
    intro(c,"Commencer",()=>{
      clearGame(); let hit=0,miss=0,start=0; const N=20;
      stage.innerHTML=`<div class="msg" style="position:absolute;top:12px;left:0;right:0;pointer-events:none"><span class="num" id="cnt">0</span> / ${N} · ratés <span class="num" id="ms">0</span></div>`;
      const place=()=>{const old=stage.querySelector(".target");if(old)old.remove();
        const r=stage.getBoundingClientRect(),b=document.createElement("button");b.className="target";b.setAttribute("aria-label","Cible");
        b.style.left=(40+Math.random()*(r.width-80))+"px";b.style.top=(60+Math.random()*(r.height-100))+"px";
        b.onpointerdown=e=>{e.stopPropagation();e.preventDefault();if(!start)start=performance.now();hit++;$("cnt").textContent=hit;
          if(hit>=N){finish(c,(performance.now()-start)/1000+miss*.5,miss?miss+" raté(s), +"+fr(miss*.5,1)+" s":"Aucun raté")}else place()};
        stage.appendChild(b)};
      stage.onpointerdown=()=>{if(start){miss++;$("ms").textContent=miss}};
      place();
    });
  },
  chrono(c){
    intro(c,"Lancer le chrono",()=>{
      clearGame(); const start=performance.now(); let iv;
      stage.innerHTML=`<div class="mega num" id="tm">0.000</div><p class="hint">Le chrono disparaît après 3 secondes. Arrête-le pile à 10,000.</p><button class="btn solid" id="stop" style="font-size:20px;padding:16px 34px">STOP</button>`;
      const tm=$("tm");
      iv=setInterval(()=>{const s=(performance.now()-start)/1000;tm.textContent=s<3?s.toFixed(3):"?.???"},16);cleanup.push(()=>clearInterval(iv));
      $("stop").onclick=()=>{const s=(performance.now()-start)/1000;clearInterval(iv);finish(c,Math.abs(s-10)*1000,"Arrêté à "+fr(s,3)+" s")};
      $("stop").focus();
    });
  }
};

renderLegal(); rebuildChallenges(); renderAll(); DB.init();
})();
