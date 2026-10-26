/* WorldUltimateRecords — app (GitHub Pages + Supabase) */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const LOCALE=()=>window.wurLocale?window.wurLocale():"fr-FR";
const T=s=>window.t?window.t(String(s)):String(s);
const esc=s=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const fr=(v,d)=>Number(v).toLocaleString(LOCALE(),{minimumFractionDigits:d,maximumFractionDigits:d});
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
  star:P('<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>'),
  path:P('<circle cx="4" cy="18" r="2"/><circle cx="20" cy="6" r="2"/><path d="M6 18c4 0 3-6 6-6s2-6 6-6"/>'),
  swap:P('<rect x="2" y="6" width="8" height="12" rx="2"/><rect x="14" y="6" width="8" height="12" rx="2"/><path d="M9 3h6M13 1l2 2-2 2M15 21H9M11 19l-2 2 2 2"/>'),
  stack:P('<rect x="7" y="3" width="8" height="4" rx="1"/><rect x="5" y="9" width="12" height="4" rx="1"/><rect x="4" y="15" width="16" height="4" rx="1"/><path d="M3 22h18"/>'),
  circle:P('<path d="M19 9a8 8 0 1 0 1 4"/><path d="M20 4v5h-5"/>'),
  digits:P('<path d="M4 8l2-2v12M10 8a2 2 0 0 1 4 0c0 3-4 5-4 10h4M17 6h3l-2 5a3 3 0 1 1-2 5"/>'),
  odd:P('<circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><rect x="10" y="10" width="4" height="4"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>'),
  grid:P('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>'),
  cards:P('<rect x="3" y="5" width="11" height="15" rx="2" transform="rotate(-8 8 12)"/><rect x="10" y="4" width="11" height="15" rx="2"/><path d="M15.5 8v7M13 10.5l2.5-2.5 2.5 2.5"/>'),
  shade:P('<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5" stroke-dasharray="2 2"/>'),
  dots:P('<circle cx="6" cy="7" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="17" cy="9" r="1.5"/><circle cx="8" cy="13" r="1.5"/><circle cx="14" cy="14" r="1.5"/><circle cx="5" cy="19" r="1.5"/><circle cx="19" cy="18" r="1.5"/><circle cx="11" cy="19" r="1.5"/>'),
  note:P('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>'),
  beat:P('<path d="M2 12h4l2-6 4 12 3-9 2 3h5"/>'),
  mole:P('<rect x="3" y="3" width="5" height="5" rx="1"/><rect x="10" y="3" width="5" height="5" rx="1"/><rect x="17" y="3" width="4" height="5" rx="1"/><rect x="3" y="10" width="5" height="5" rx="1"/><circle cx="12.5" cy="12.5" r="3"/><rect x="17" y="10" width="4" height="5" rx="1"/><rect x="3" y="17" width="5" height="4" rx="1"/><rect x="10" y="17" width="5" height="4" rx="1"/><rect x="17" y="17" width="4" height="4" rx="1"/>'),
  run:P('<rect x="11" y="9" width="10" height="7" rx="2"/><path d="M2 10h6M3 14h5M5 18h5"/>'),
  tilt:P('<path d="M3 17l18-6"/><circle cx="10" cy="11" r="3"/><path d="M12 15v6M9 21h6"/>'),
  pairs:P('<rect x="3" y="4" width="8" height="12" rx="1.5"/><rect x="13" y="8" width="8" height="12" rx="1.5"/><path d="M7 8l1.2 2.4 2.3.3-1.7 1.6.4 2.3L7 13.5l-2.2 1.1.4-2.3L3.5 10.7l2.3-.3zM17 12l1.2 2.4 2.3.3-1.7 1.6.4 2.3-2.2-1.1-2.2 1.1.4-2.3-1.7-1.6 2.3-.3z"/>'),
  maze:P('<path d="M3 3h18v18H3zM3 9h6M15 3v6h-4M9 9v6h6M21 15h-3v-3M15 21v-3"/>'),
  check:P('<path d="M4 12l4 4 8-9"/><path d="M15 15l5 5M20 15l-5 5"/>'),
  slide:P('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v12M3 9h18M3 15h12"/>'),
  hourglass:P('<path d="M6 2h12M6 22h12M7 2c0 6 10 6 10 10S7 16 7 22M17 2c0 6-10 6-10 10s10 4 10 10"/>'),
  angle:P('<path d="M4 20h16M4 20 16 6"/><path d="M10 20a6 6 0 0 0-2-4.5"/>'),
  face:P('<circle cx="12" cy="12" r="9"/><path d="M8.5 10h.01M15.5 10h.01M8 15c2 2 6 2 8 0"/>'),
  metro:P('<path d="M8 3h8l3 18H5z"/><path d="M12 17 15 6"/><circle cx="12" cy="17" r="1"/>')
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
  {id:"chrono",kind:"web",mode:"web",better:"low",icon:"chrono",name:"Chrono parfait",desc:"Arrête le chrono pile à 10,000 s. Il disparaît après 3 s.",fmt:v=>"± "+Math.round(v)+" ms"},
  // ---- défis navigateur (série 2) ----
  {id:"steady",kind:"web",mode:"web",better:"low",icon:"path",name:"Main sûre",desc:"Glisse du point vert jusqu'à l'arrivée en suivant le chemin, sans toucher les bords. Si tu sors ou si tu lâches, retour au départ.",fmt:v=>fr(v,2)+" s",gap:d=>fr(d,2)+" s"},
  {id:"alternate",kind:"web",mode:"web",better:"high",icon:"swap",name:"Gauche-droite 10 s",desc:"Touche les deux boutons en alternance, le plus de fois possible en 10 secondes. Deux fois de suite le même bouton ne compte pas.",fmt:v=>v+" touches",gap:d=>Math.round(d)},
  {id:"tower",kind:"web",mode:"web",better:"high",icon:"stack",name:"Tour néon",desc:"Lâche chaque bloc pile sur le précédent. Ce qui dépasse est coupé, et la tour s'arrête quand tu rates complètement.",fmt:v=>v+" étages",gap:d=>Math.round(d)},
  {id:"circle",kind:"web",mode:"web",better:"high",icon:"circle",name:"Cercle parfait",desc:"Dessine un cercle d'un seul trait, le plus rond possible. Il doit faire un tour complet.",fmt:v=>fr(v,1)+" %",gap:d=>fr(d,1)+" %"},
  {id:"digits",kind:"web",mode:"web",better:"high",icon:"digits",name:"Chiffres flash",desc:"Un nombre s'affiche un instant : retape-le. Il gagne un chiffre à chaque bonne réponse.",fmt:v=>v+" chiffres",gap:d=>Math.round(d)},
  {id:"odd",kind:"web",mode:"web",better:"high",icon:"odd",name:"Trouve l'intrus",desc:"Trouve le symbole différent des autres, le plus de fois possible en 30 secondes. Une erreur coûte 2 secondes.",fmt:v=>v+" intrus",gap:d=>Math.round(d)},
  {id:"seq25",kind:"web",mode:"web",better:"low",icon:"grid",name:"Suite 1 à 25",desc:"Touche les nombres de 1 à 25 dans l'ordre, le plus vite possible.",fmt:v=>fr(v,2)+" s",gap:d=>fr(d,2)+" s"},
  {id:"higher",kind:"web",mode:"web",better:"high",icon:"cards",name:"Plus ou moins",desc:"La carte suivante sera-t-elle plus haute ou plus basse ? Enchaîne la plus longue série sans erreur. Une égalité compte comme juste.",fmt:v=>"série de "+v,gap:d=>Math.round(d)},
  {id:"shade",kind:"web",mode:"web",better:"high",icon:"shade",name:"Œil de lynx",desc:"Trouve la case d'une couleur légèrement différente. C'est de plus en plus dur : une erreur et c'est fini.",fmt:v=>v+" cases",gap:d=>Math.round(d)},
  {id:"estimate",kind:"web",mode:"web",better:"low",icon:"dots",name:"Estimation éclair",desc:"Des points s'affichent une demi-seconde : estime combien il y en avait. 10 manches, ton score est ton écart moyen.",fmt:v=>fr(v,1)+" % d'écart",gap:d=>fr(d,1)+" %"},
  {id:"pitch",kind:"web",mode:"web",better:"high",icon:"note",name:"Oreille absolue",desc:"Deux notes sont jouées : dis laquelle est la plus aiguë. L'écart se réduit à chaque bonne réponse. Monte le son !",fmt:v=>"niveau "+v,gap:d=>Math.round(d)},
  {id:"rhythm",kind:"web",mode:"web",better:"high",icon:"beat",name:"Marathon du rythme",desc:"Touche à chaque battement du métronome, ni trop tôt ni trop tard. Le tempo accélère : 3 fautes et c'est fini.",fmt:v=>v+" battements",gap:d=>Math.round(d)},
  // ---- défis navigateur (série 3) ----
  {id:"stars",kind:"web",mode:"web",better:"high",icon:"star",name:"Attrape-étoiles",desc:"Des étoiles tombent de plus en plus vite : touche-les avant qu'elles atteignent le sol. 3 étoiles ratées et c'est fini.",fmt:v=>v+" étoiles",gap:d=>Math.round(d)},
  {id:"mole",kind:"web",mode:"web",better:"high",icon:"mole",name:"Taupe néon",desc:"Touche les cases qui s'allument, le plus possible en 30 secondes. Toucher une case éteinte retire un point.",fmt:v=>v+" points",gap:d=>Math.round(d)},
  {id:"runner",kind:"web",mode:"web",better:"high",icon:"run",name:"Bouton qui fuit",desc:"Attrape le bouton qui se déplace de plus en plus vite, le plus de fois possible en 20 secondes.",fmt:v=>v+" prises",gap:d=>Math.round(d)},
  {id:"tightrope",kind:"web",mode:"web",better:"high",icon:"tilt",name:"Funambule",desc:"Garde la balle sur la barre en l'inclinant : glisse le doigt ou la souris à gauche ou à droite. Le vent se lève peu à peu.",fmt:v=>fr(v,2)+" s",gap:d=>fr(d,2)+" s"},
  {id:"pairs",kind:"web",mode:"web",better:"low",icon:"pairs",name:"Paires néon",desc:"Retourne les cartes deux par deux et retrouve les 8 paires, le plus vite possible.",fmt:v=>fr(v,2)+" s",gap:d=>fr(d,2)+" s"},
  {id:"maze",kind:"web",mode:"web",better:"low",icon:"maze",name:"Labyrinthe éclair",desc:"Sors du labyrinthe le plus vite possible avec les flèches du clavier ou les boutons.",fmt:v=>fr(v,2)+" s",gap:d=>fr(d,2)+" s"},
  {id:"truefalse",kind:"web",mode:"web",better:"high",icon:"check",name:"Vrai ou faux",desc:"Des calculs défilent : réponds vrai ou faux, le plus possible en 30 secondes. Chaque erreur retire un point.",fmt:v=>v+" points",gap:d=>Math.round(d)},
  {id:"slide",kind:"web",mode:"web",better:"low",icon:"slide",name:"Taquin",desc:"Remets les cases de 1 à 8 dans l'ordre en les faisant glisser dans la case vide, le plus vite possible.",fmt:v=>fr(v,2)+" s",gap:d=>fr(d,2)+" s"},
  {id:"duration",kind:"web",mode:"web",better:"low",icon:"hourglass",name:"Quelle durée ?",desc:"Une lumière reste allumée quelques secondes : devine combien de temps. 5 manches, ton score est ton écart moyen.",fmt:v=>fr(v,1)+" % d'écart",gap:d=>fr(d,1)+" %"},
  {id:"angle",kind:"web",mode:"web",better:"low",icon:"angle",name:"Angle parfait",desc:"Trace une ligne à l'angle demandé (90°, 45°…) à partir du point. 5 manches, ton score est ton écart moyen en degrés.",fmt:v=>fr(v,1)+"° d'écart",gap:d=>fr(d,1)+"°"},
  {id:"faces",kind:"web",mode:"web",better:"high",icon:"face",name:"Mémoire des visages",desc:"Retiens les visages affichés, puis retrouve-les parmi d'autres. Il y en a un de plus à chaque niveau : une erreur et c'est fini.",fmt:v=>"niveau "+v,gap:d=>Math.round(d)},
  {id:"steadyclick",kind:"web",mode:"web",better:"high",icon:"metro",name:"Clic régulier",desc:"Clique 30 fois en gardant un rythme le plus régulier possible, à la vitesse que tu veux. Sans métronome !",fmt:v=>fr(v,1)+" %",gap:d=>fr(d,1)+" %"}
];
function decorate(c){
  if(c.mode==="count"){c.better="high";c.fmt=c.fmt||(v=>Number(v).toLocaleString(LOCALE())+" "+(c.unit||""))}
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
let myProfile=null, myEmail="", isAnon=true, hasPw=false, reports=[], memberSince={}, colors={}, members=new Set(), mySub=null, usage={}, practice=false, introSkip=false;
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
const TECH_MAIL="@joueurs.wur.invalid";
function setUserFlags(u){hasPw=!!(u.app_metadata&&u.app_metadata.pw);const em=u.email||"";myEmail=em.endsWith(TECH_MAIL)?"":em;isAnon=!!u.is_anonymous&&!hasPw&&!myEmail}
async function fnError(error){try{const j=await error.context.json();return j.error||error.message}catch(e){return error.message||String(error)}}

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
      sb.auth.onAuthStateChange((ev,s)=>{if(s&&s.user&&s.user.id!==myId)this.afterAuth(s.user);else if(s&&s.user&&(ev==="USER_UPDATED"||ev==="TOKEN_REFRESHED")){setUserFlags(s.user);renderAll()}});
      sb.channel("wur").on("postgres_changes",{event:"*",schema:"public",table:"attempts"},()=>this.refreshSoon())
        .on("postgres_changes",{event:"*",schema:"public",table:"challenges"},()=>this.refreshSoon())
        .on("postgres_changes",{event:"*",schema:"public",table:"reports"},()=>this.refreshSoon())
        .on("postgres_changes",{event:"*",schema:"public",table:"aura_posts"},()=>this.refreshSoon())
        .on("postgres_changes",{event:"*",schema:"public",table:"aura_votes"},()=>this.refreshSoon())
        .on("postgres_changes",{event:"*",schema:"public",table:"aura_ideas"},()=>this.refreshSoon())
        .on("postgres_changes",{event:"*",schema:"public",table:"aura_idea_votes"},()=>this.refreshSoon()).subscribe();
      setInterval(()=>this.refresh(),60000);
    }catch(e){console.warn(e);toast("Connexion au classement impossible : "+(e.message||e));this.local()}
  },
  async afterAuth(user){
    myId=user.id; setUserFlags(user); live=true;
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
    attempts=st.attempts; customs=st.customs; auraPosts=(st.aura||[]).map(rowToAura); auraVotes=st.auraVotes||[]; auraIdeas=st.ideas||[]; auraIdeaVotes=st.ideaVotes||[]; rebuildChallenges(); myLeagues=lsGet("wur_leagues",[]);
    setPill("local","Scores sur cet appareil","Le classement en ligne n'est pas disponible : tes scores restent sur cet appareil.");
    renderAll();
  },
  _t:null, refreshSoon(){clearTimeout(this._t);this._t=setTimeout(()=>this.refresh(),400)},
  async refresh(){
    if(!live)return;
    const q=[sb.from("attempts").select("*").order("created_at",{ascending:false}).limit(3000),
             sb.from("challenges").select("*").order("created_at",{ascending:false}).limit(500)];
    q.push(sb.rpc("member_info"),
           sb.from("subscriptions").select("status,current_period_end").eq("user_id",myId).maybeSingle(),
           sb.from("daily_usage").select("challenge,started,saved").eq("user_id",myId).eq("day",parisToday()));
    if(isAdmin)q.push(sb.from("reports").select("attempt_id,reason,created_at").order("created_at",{ascending:false}).limit(1000));
    const [a,c,mi,su,us,r]=await Promise.all(q);
    if(!mi.error){memberSince={};(mi.data||[]).forEach(x=>memberSince[x.user_id]=Date.parse(x.since)||Date.now());members=new Set(Object.keys(memberSince))}
    const pc=await sb.from("profiles").select("user_id,color").not("color","is",null); if(!pc.error){colors={};pc.data.forEach(p=>colors[p.user_id]=p.color)}
    if(myProfile&&myProfile.color)colors[myId]=myProfile.color;
    await loadMyLeagues();
    mySub=su&&!su.error?su.data:null;
    if(us&&!us.error){usage={};(us.data||[]).forEach(u=>usage[u.challenge]=u)}
    if(!a.error)attempts=a.data.map(rowToAttempt);
    if(!c.error)customs=c.data;
    reports=r&&!r.error?r.data:[];
    const [ap,av,ar]=await Promise.all([sb.from("aura_posts").select("*").order("created_at",{ascending:false}).limit(1000),
      sb.from("aura_votes").select("user_id,target_id,choice_id").limit(20000),
      isAdmin?sb.from("aura_reports").select("post_id,reason,created_at").limit(1000):Promise.resolve({data:[]})]);
    const [ai,aiv]=await Promise.all([sb.from("aura_ideas").select("*").order("created_at",{ascending:false}).limit(1000),sb.from("aura_idea_votes").select("user_id,idea_id").limit(20000)]);
    if(!ai.error)auraIdeas=ai.data; if(!aiv.error)auraIdeaVotes=aiv.data;
    if(!ap.error)auraPosts=ap.data.map(rowToAura); if(!av.error)auraVotes=av.data; auraReports=ar&&!ar.error?ar.data||[]:[];
    rebuildChallenges(); renderAll(); notifyNew();
  },
  saveLocal(){lsSet(LS,{attempts,customs,aura:auraPosts.map(p=>({id:p.id,user_id:p.uid,pseudo:p.pseudo,kind:p.kind,parent_id:p.parent,title:p.title,source:p.source,side:p.side,status:p.status,hidden:p.hidden,t:p.t,dec:p.dec,emo:p.emo})),auraVotes,ideas:auraIdeas,ideaVotes:auraIdeaVotes})},
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
  async auraAdd(o){
    if(!live){auraPosts.unshift({id:"la"+Date.now(),uid:myId,pseudo:pseudoIn.value.trim(),kind:o.kind,parent:o.parent,title:o.title,vid:URL.createObjectURL(o.blob),path:null,source:o.source,side:o.side||"gain",status:"ok",hidden:false,t:Date.now(),dec:Date.now(),emo:""});this.saveLocal();renderAll();return true}
    const path=myId+"/aura-"+Date.now()+"."+o.ext;
    try{
      const up=await sb.storage.from("videos").upload(path,o.blob,{contentType:o.blob.type||"video/webm",upsert:false}); if(up.error)throw up.error;
      const {error}=await sb.from("aura_posts").insert({kind:o.kind,parent_id:o.parent,title:o.title,video_path:path,source:o.source,side:o.side||"gain",consent_at:new Date().toISOString()});
      if(error){await this.removeFile(path);throw error}
      await this.refresh(); return true;
    }catch(e){toast("Envoi impossible : "+(e.message||e));return false}
  },
  async auraVote(target,choice){
    const cur=auraMyVote(target), before=auraVotes;
    auraVotes=auraVotes.filter(v=>!(v.user_id===myId&&v.target_id===target)); if(cur!==choice)auraVotes=auraVotes.concat({user_id:myId,target_id:target,choice_id:choice});
    if(!live){this.saveLocal();renderAll();return true}
    renderAura();
    if(!(await this.ensureProfile())){auraVotes=before;renderAura();return false}
    const r=cur===choice?await sb.from("aura_votes").delete().eq("user_id",myId).eq("target_id",target)
      :await sb.from("aura_votes").upsert({user_id:myId,target_id:target,choice_id:choice},{onConflict:"user_id,target_id"});
    if(r.error){auraVotes=before;renderAura();toast("Vote impossible : "+(/row-level security/.test(r.error.message)?"les votes sont fermés pour cette battle.":r.error.message));return false}
    this.refreshSoon(); return true;
  },
  async auraSetStatus(id,status){
    const p=auraPosts.find(x=>x.id===id);
    if(!live){if(p)p.status=status;this.saveLocal();renderAll();return true}
    const patch={status}; if(status==="no"&&p&&p.path)patch.video_path=null;
    const {error}=await sb.from("aura_posts").update(patch).eq("id",id);
    if(error){toast("Décision non enregistrée : "+error.message);return false}
    if(status==="no"&&p&&p.path)await this.removeFile(p.path);
    await this.refresh(); return true;
  },
  async auraSetHidden(id,hidden){
    if(!live){const p=auraPosts.find(x=>x.id===id);if(p)p.hidden=hidden;this.saveLocal();renderAll();return true}
    const {error}=await sb.from("aura_posts").update({hidden}).eq("id",id);
    if(error){toast("Action impossible : "+error.message);return false}
    if(!hidden)await sb.from("aura_reports").delete().eq("post_id",id);
    await this.refresh(); return true;
  },
  async auraDelete(id){
    const p=auraPosts.find(x=>x.id===id); if(!p)return false;
    if(!live){auraPosts=auraPosts.filter(x=>x.id!==id&&x.parent!==id);auraVotes=auraVotes.filter(v=>v.target_id!==id&&v.choice_id!==id);this.saveLocal();renderAll();return true}
    await this.removeFile(p.path);
    const {error}=await sb.from("aura_posts").delete().eq("id",id);
    if(error){toast("Suppression impossible : "+error.message);return false}
    await this.refresh(); return true;
  },
  async ideaAdd(text,points){
    if(!live){auraIdeas.unshift({id:"li"+Date.now(),user_id:myId,pseudo:pseudoIn.value.trim()||"Moi",text,points,status:"ok",created_at:new Date().toISOString()});this.saveLocal();renderAll();return true}
    if(!(await this.ensureProfile()))return false;
    const {error}=await sb.from("aura_ideas").insert({text,points});
    if(error){toast(error.code==="23505"?"Cette idée existe déjà.":"Proposition impossible : "+error.message);return false}
    await this.refresh(); return true;
  },
  async ideaVote(id){
    const had=auraIdeaVotes.some(v=>v.idea_id===id&&v.user_id===myId),before=auraIdeaVotes;
    auraIdeaVotes=had?auraIdeaVotes.filter(v=>!(v.idea_id===id&&v.user_id===myId)):auraIdeaVotes.concat({user_id:myId,idea_id:id});
    if(!live){this.saveLocal();renderAura();return true}
    renderAura();
    if(!(await this.ensureProfile())){auraIdeaVotes=before;renderAura();return false}
    const r=had?await sb.from("aura_idea_votes").delete().eq("user_id",myId).eq("idea_id",id):await sb.from("aura_idea_votes").insert({idea_id:id});
    if(r.error){auraIdeaVotes=before;renderAura();toast("Vote impossible : "+r.error.message);return false}
    this.refreshSoon(); return true;
  },
  async ideaSetStatus(id,status){
    if(!live){const i=auraIdeas.find(x=>x.id===id);if(i)i.status=status;this.saveLocal();renderAll();return true}
    const {error}=await sb.from("aura_ideas").update({status}).eq("id",id);
    if(error){toast("Décision non enregistrée : "+error.message);return false}
    await this.refresh(); return true;
  },
  async ideaDelete(id){
    if(!live){auraIdeas=auraIdeas.filter(x=>x.id!==id);auraIdeaVotes=auraIdeaVotes.filter(v=>v.idea_id!==id);this.saveLocal();renderAll();return true}
    const {error}=await sb.from("aura_ideas").delete().eq("id",id);
    if(error){toast("Suppression impossible : "+error.message);return false}
    await this.refresh(); return true;
  },
  async auraReport(id,reason){
    if(!live){toast("Les signalements fonctionnent une fois le site en ligne.");return false}
    const {error}=await sb.from("aura_reports").insert({post_id:id,reason});
    if(error){toast(error.code==="23505"?"Tu as déjà signalé cette vidéo.":"Signalement impossible : "+error.message);return false}
    return true;
  },
  async deleteAccount(){
    if(!live){try{localStorage.removeItem(LS);localStorage.removeItem("wur_pseudo");localStorage.removeItem("wur_seen")}catch(e){};location.reload();return}
    const mine=attempts.filter(a=>a.uid===myId&&a.path).map(a=>a.path).concat(auraPosts.filter(p=>p.uid===myId&&p.path).map(p=>p.path));
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
  async setPassword(password){
    const {error}=await sb.functions.invoke("pseudo-account",{body:{action:"set-password",password}});
    if(error)throw new Error(await fnError(error));
    const r=await sb.auth.refreshSession(); if(r.data&&r.data.user)setUserFlags(r.data.user); else hasPw=true;
    renderAll();
  },
  async pseudoLogin(pseudo,password){
    const t=await getCaptcha();
    const {data,error}=await sb.functions.invoke("pseudo-account",{body:{action:"login",pseudo,password,captchaToken:t}});
    if(error)throw new Error(await fnError(error));
    const r=await sb.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token});
    if(r.error)throw r.error;
    if(r.data.user&&r.data.user.id!==myId)await this.afterAuth(r.data.user);
  },
  async logout(){
    try{await sb.auth.signOut()}catch(e){}
    try{localStorage.removeItem("wur_pseudo")}catch(e){} location.reload();
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
  return new Date(t).toLocaleDateString(LOCALE(),{day:"numeric",month:"short"})}
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
function renderAll(){if(currentTab==="membre")renderPass();if(currentTab==="ligue"&&leagueData&&!leagueData.loading)renderLeague();if(currentTab==="classement")renderRanking();renderWeekly();renderChannel();renderGrids();renderRecords();renderFeed();renderAura();renderNotifs();if(currentTab==="profil")renderProfile()}

/* ================= player links ================= */
const plink=a=>a&&a.uid?`<a class="plink" href="#p-${esc(a.uid)}"${pseudoStyle(a.uid)}>${esc(a.pseudo)}</a>${memberBadge(a.uid)}`:esc(a&&a.pseudo||"");

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
      <button class="btn sm good" data-verdict="ok" data-id="${esc(a.id)}">Valider</button><button class="btn sm bad" data-verdict="no" data-id="${esc(a.id)}">Refuser</button>${a.vid?`<button class="btn sm gold" data-short="${esc(a.id)}">Créer le Short</button>`:""}</div>`)).join("")
    :`<div class="empty">Aucune vidéo en attente.</div>`;
  $("modFlagged").innerHTML=flagged.length?flagged.map(a=>{const rs=reportsFor(a.id),cnt={};rs.forEach(r=>cnt[r.reason]=(cnt[r.reason]||0)+1);
    return item(a,`<p class="msg">${a.hidden?'<span class="badge no">Masquée</span> ':""}${rs.length} signalement(s) : ${Object.entries(cnt).map(([k,n])=>esc(REASONS[k]||k)+" ×"+n).join(", ")||"aucun"}</p>
      <div class="row" style="justify-content:flex-start">
        ${a.hidden?`<button class="btn sm good" data-unhide="${esc(a.id)}">Rétablir</button>`:`<button class="btn sm" data-hide="${esc(a.id)}">Masquer</button>`}
        <button class="btn sm bad" data-del="${esc(a.id)}">Supprimer</button></div>`)}).join("")
    :`<div class="empty">Aucun signalement.</div>`;
}

/* ================= battles d'aura ================= */
let auraPosts=[], auraVotes=[], auraReports=[], auraSort="top", auraIdeas=[], auraIdeaVotes=[], ideaFilter="all";
const AURA_PTS=100, AURA_DAYS=7;
function rowToAura(r){
  return {id:r.id,uid:r.user_id,pseudo:String(r.pseudo||"Anonyme").slice(0,24),kind:r.kind,parent:r.parent_id||null,title:String(r.title||""),
    vid:r.video_path&&sb?sb.storage.from("videos").getPublicUrl(r.video_path).data.publicUrl:(r.localUrl||null),path:r.video_path||null,
    source:r.source||"camera",side:r.side==="loss"?"loss":"gain",status:r.status||"pending",hidden:!!r.hidden,t:Date.parse(r.created_at)||r.t||0,dec:Date.parse(r.decided_at||"")||r.dec||0,emo:r.emo||""};
}
const AURA_GAIN=[[1000,"Rester calme quand tout le monde panique"],[1000,"Dire « je m'en occupe » et régler le problème en 10 secondes"],[900,"Mettre la balle de papier dans la poubelle sans regarder"],[900,"Retourner une bouteille d'eau du premier coup devant tout le monde"],[800,"Rattraper un objet qui tombe sans le regarder"],[800,"Rattraper sa tartine avant qu'elle touche le sol"],[800,"Retenir le prénom de quelqu'un vu une seule fois"],[800,"Ranger sa chambre avant qu'on te le demande"],[800,"Rattraper ses clés lancées par quelqu'un sans regarder"],[700,"Gagner un débat avec une seule phrase"],[700,"Arriver pile à l'heure pendant que tout le monde court"],[700,"Réussir un créneau du premier coup devant du monde"],[700,"Trouver la réponse d'une devinette avant tout le monde"],[600,"Marquer du premier coup devant tout le monde"],[600,"Remettre son capuchon de stylo en le lançant"],[600,"Finir le Rubik's Cube pendant qu'on te parle"],[600,"Faire un tour de magie que personne ne comprend"],[500,"Se faire applaudir par des inconnus"],[500,"Avoir la bonne réponse quand le prof dit « personne ? »"],[500,"Faire une passe parfaite sans même regarder"],[500,"Garder son sérieux pendant que tout le monde rigole"],[400,"Garder la porte et qu'on te remercie"],[400,"Ouvrir un bocal que personne n'arrivait à ouvrir"],[400,"Savoir réparer la Wi-Fi de la maison"],[300,"Répondre « je sais » et avoir vraiment raison"],[300,"Avoir de la batterie et un chargeur quand tout le monde est à 1 %"],[300,"Avoir toujours un mouchoir quand quelqu'un en a besoin"]];
const AURA_LOSS=[[1000,"Trébucher devant toute la classe"],[1000,"Mettre une vidéo à fond sans faire exprès dans une salle silencieuse"],[1000,"Envoyer un vocal de 3 minutes sans le vouloir"],[900,"Répondre au prof en l'appelant « maman »"],[900,"Se tromper de salle et s'asseoir quand même 5 minutes"],[800,"Saluer quelqu'un qui saluait la personne derrière toi"],[800,"Passer devant tout le monde avec du dentifrice sur le menton"],[800,"Dire « au revoir » à quelqu'un… et partir dans la même direction"],[700,"Pousser une porte marquée « tirer »"],[700,"Faire le geste de « tchek » et que personne ne réponde"],[700,"Chanter avec ses écouteurs… sans se rendre compte que tout le monde entend"],[700,"Se cogner dans une vitre bien propre"],[600,"Répondre « toi aussi » au serveur qui dit « bon appétit »"],[600,"Taper son code de cantine trois fois de travers avec toute la file derrière"],[600,"Tirer la chaise de quelqu'un… et c'est toi qui tombes"],[600,"Avoir le hoquet pile pendant la minute de silence"],[500,"Se faire surprendre en train de parler tout seul"],[500,"Faire tomber son plateau à la cantine"],[500,"Dire « regarde ça ! » et rater complètement le trick"],[500,"Applaudir à la fin d'un film au cinéma, tout seul"],[400,"Rire très fort à une blague que personne n'a comprise"],[400,"Fermer la porte sur son propre sac"],[400,"Trébucher et faire semblant de courir pour cacher la chute"],[400,"Laisser son micro allumé en visio"],[300,"Envoyer un message à la mauvaise personne"],[300,"Mettre son pull à l'envers toute la journée"],[300,"Chercher ses lunettes… qu'on a sur la tête"]];
const auraOk=p=>p&&(p.status==="ok"||(!live&&p.status!=="no"))&&!p.hidden;
const auraShown=()=>auraPosts.filter(auraOk);
const auraReply=id=>auraShown().find(p=>p.parent===id);
function auraTally(target){const c={};auraVotes.forEach(v=>{if(v.target_id===target)c[v.choice_id]=(c[v.choice_id]||0)+1});return c}
const auraMyVote=target=>{const v=auraVotes.find(x=>x.target_id===target&&x.user_id===myId);return v?v.choice_id:null};
const auraSign=p=>p&&p.kind==="solo"&&p.side==="loss"?-1:1;
const auraPostPts=p=>auraVotes.filter(v=>v.choice_id===p.id).length*AURA_PTS*auraSign(p);
const auraFmt=n=>n?(n<0?"−":"+")+Math.abs(n):"0";
function auraPoints(uid){return auraPosts.filter(p=>p.uid===uid&&auraOk(p)).reduce((a,p)=>a+auraPostPts(p),0)}
function auraDuelEnd(reply){return (reply.dec||reply.t)+AURA_DAYS*864e5}
function auraVid(p,cls){return p.vid?`<video class="${cls||""}" src="${esc(p.vid)}" controls playsinline preload="metadata"></video>`
  :`<div class="auraph ${cls||""}"><span>${esc(p.emo||"✦")}</span><small>Vidéo d'exemple</small></div>`}
function auraHead(p){return `<div class="aurameta"><b class="notr">${esc(p.title)}</b><span>${plink(p)} · <span>${esc(ago(p.t))}</span>${p.uid!==myId?` · <a href="#" class="muted" data-aurareport="${esc(p.id)}">signaler</a>`:""}</span></div>`}
function auraSoloCard(p){
  const n=(auraTally(p.id)[p.id]||0),mine=auraMyVote(p.id)===p.id,own=p.uid===myId,loss=p.side==="loss";
  return `<article class="aurapost ${loss?"loss":"gain"}">${auraVid(p)}<span class="sidetag ${loss?"bad":"good"}">${loss?"Perd de l'aura":"Gagne de l'aura"}</span>${auraHead(p)}
    <div class="aurabar"><span class="aurapts num ${loss?"neg":""}">${auraFmt(n*AURA_PTS*(loss?-1:1))} aura</span>
    ${own?`<span class="msg">Ta vidéo</span>`:`<button class="btn sm ${mine?"solid":""}" data-auravote="${esc(p.id)}" data-choice="${esc(p.id)}" aria-pressed="${mine}">${mine?"✓ Ton vote":loss?"− Aura":"+ Aura"}</button>`}</div></article>`;
}
function auraDuelCard(a){
  const b=auraReply(a.id),c=auraTally(a.id),na=c[a.id]||0,nb=c[b.id]||0,tot=na+nb,end=auraDuelEnd(b),open=Date.now()<end,mine=auraMyVote(a.id);
  const part=a.uid===myId||b.uid===myId,pa=tot?Math.round(na/tot*100):50,pb=tot?100-pa:50;
  const lead=na===nb?null:na>nb?a:b;
  const side=(p,n,pc)=>`<div class="duelside ${!open&&lead===p?"win":""}">${auraVid(p)}${auraHead(p)}
    <div class="duelbar"><i style="width:${pc}%"></i></div><div class="aurabar"><span class="num">${pc} % · ${n} vote${n>1?"s":""}</span>
    ${open&&!part?`<button class="btn sm ${mine===p.id?"solid":""}" data-auravote="${esc(a.id)}" data-choice="${esc(p.id)}" aria-pressed="${mine===p.id}">${mine===p.id?"✓ Ton vote":"Voter"}</button>`:""}</div></div>`;
  const left=Math.max(0,end-Date.now()),dLeft=Math.ceil(left/864e5);
  return `<article class="aurapost duel"><div class="duelrow">${side(a,na,pa)}<div class="vs">VS</div>${side(b,nb,pb)}</div>
    <p class="msg duelinfo">${open?(part?`Tu participes à ce duel : tu ne peux pas voter. Votes ouverts encore ${dLeft} j.`:`Votes ouverts encore ${dLeft} j.`)
      :lead?`Battle terminée · ${esc(lead.pseudo)} gagne avec +${(lead===a?na:nb)*AURA_PTS} aura`:"Battle terminée · égalité parfaite"}</p></article>`;
}
function auraOpenCard(p){
  const own=p.uid===myId,pend=auraPosts.some(r=>r.parent===p.id&&r.status==="pending");
  return `<article class="aurapost">${auraVid(p)}${auraHead(p)}
    <div class="aurabar"><span class="msg">${pend?"Une réponse est en vérification":"En attente d'un adversaire"}</span>
    ${own||pend?"":`<button class="btn sm solid" data-auranew="reply" data-parent="${esc(p.id)}">Relever ce duel</button>`}</div></article>`;
}
function renderAura(){
  const gl=$("auraGain"); if(!gl)return;
  renderAuraIdeas();
  const shown=auraShown(),duels=shown.filter(p=>p.kind==="duel"&&!p.parent);
  const live_=duels.filter(a=>auraReply(a.id)),openD=duels.filter(a=>!auraReply(a.id));
  const score=a=>{const c=auraTally(a.id);return Object.values(c).reduce((x,y)=>x+y,0)};
  const running=live_.filter(a=>Date.now()<auraDuelEnd(auraReply(a.id))).sort((x,y)=>score(y)-score(x)||y.t-x.t);
  const ended=live_.filter(a=>Date.now()>=auraDuelEnd(auraReply(a.id))).sort((x,y)=>score(y)-score(x));
  const solos=shown.filter(p=>p.kind==="solo").sort(auraSort==="top"?(x,y)=>(auraTally(y.id)[y.id]||0)-(auraTally(x.id)[x.id]||0)||y.t-x.t:(x,y)=>y.t-x.t);
  const players={};shown.forEach(p=>{if(!players[p.uid])players[p.uid]={uid:p.uid,pseudo:p.pseudo,pts:auraPoints(p.uid),n:0};players[p.uid].n++});
  const hall=Object.values(players).filter(x=>x.pts!==0).sort((x,y)=>y.pts-x.pts).slice(0,10);
  const topB=[...live_].sort((x,y)=>score(y)-score(x)).slice(0,5).filter(a=>score(a)>0);
  $("auraDuels").innerHTML=running.length?running.map(auraDuelCard).join(""):`<div class="empty">Aucun duel en cours. Lance le premier !</div>`;
  $("auraOpen").innerHTML=openD.length?openD.sort((x,y)=>y.t-x.t).map(auraOpenCard).join(""):`<div class="empty">Aucun duel ouvert pour l'instant.</div>`;
  $("auraSolo").innerHTML=solos.length?solos.map(auraSoloCard).join(""):`<div class="empty">Aucun moment d'aura pour l'instant. Poste le premier !</div>`;
  document.querySelectorAll("[data-aurasort]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.aurasort===auraSort)));
  $("auraEnded").innerHTML=ended.length?ended.slice(0,6).map(auraDuelCard).join(""):`<div class="empty">Les battles terminées apparaîtront ici.</div>`;
  $("auraHall").innerHTML=`<div class="tablewrap"><table><thead><tr><th>#</th><th>Joueur</th><th class="r">Aura</th></tr></thead><tbody>
    ${hall.length?hall.map((x,i)=>`<tr><td class="num">${i+1}</td><td>${plink(x)}</td><td class="r num aurapts ${x.pts<0?"neg":""}">${auraFmt(x.pts)}</td></tr>`).join(""):`<tr><td colspan="3" class="msg">Personne n'a encore reçu de vote.</td></tr>`}</tbody></table></div>
    <h3 style="margin-top:18px">Meilleures battles</h3>${topB.length?`<ol class="topbattles">${topB.map(a=>{const b=auraReply(a.id);return `<li><b class="notr">${esc(a.pseudo)}</b> <span class="vsmini">VS</span> <b class="notr">${esc(b.pseudo)}</b> · <span class="num">${score(a)} vote${score(a)>1?"s":""}</span><br><span class="msg notr">${esc(a.title)}</span></li>`}).join("")}</ol>`:`<p class="msg">Aucune battle votée pour l'instant.</p>`}`;
  renderAuraMod();
}
const ideaVotesOf=id=>auraIdeaVotes.filter(v=>v.idea_id===id).length;
function baseIdeas(){return AURA_GAIN.map(([n,t],i)=>({id:"base-g"+i,user_id:null,pseudo:"WorldUltimateRecords",text:t,points:n,status:"ok",official:true,created_at:"2026-01-01T00:00:00Z"}))
  .concat(AURA_LOSS.map(([n,t],i)=>({id:"base-l"+i,user_id:null,pseudo:"WorldUltimateRecords",text:t,points:-n,status:"ok",official:true,created_at:"2026-01-01T00:00:00Z"})))}
function allIdeas(){return auraIdeas.some(i=>i.official)?auraIdeas:baseIdeas().concat(auraIdeas)}
function renderAuraIdeas(){
  const box=$("auraIdeas"),gl=$("auraGain"); if(!box||!gl)return; bindIdeaForm();
  const all=allIdeas(),canVote=live?auraIdeas.some(i=>i.official):true;
  const sorted=f=>all.filter(i=>i.status==="ok"&&f(i)).sort((a,b)=>ideaVotesOf(b.id)-ideaVotesOf(a.id)||Math.abs(b.points)-Math.abs(a.points)||Date.parse(b.created_at)-Date.parse(a.created_at));
  const pts=i=>`<b class="num ideapts ${i.points>0?"good":"bad"}">${i.points>0?"+":"−"}${Math.abs(i.points)}</b>`;
  const row=i=>{const n=ideaVotesOf(i.id),voted=auraIdeaVotes.some(v=>v.idea_id===i.id&&v.user_id===myId),own=!!i.user_id&&i.user_id===myId;
    return `<li class="idea">${pts(i)}<span class="ideatxt"><span${i.official?"":' class="notr"'}>${esc(i.text)}</span>${i.official?"":`<small>${plink({uid:i.user_id,pseudo:i.pseudo})}</small>`}</span>
      <span class="ideaact">${own||!canVote?`<span class="msg num">👍 ${n}</span>`:`<button class="btn sm ${voted?"solid":""}" data-ideavote="${esc(i.id)}" aria-pressed="${voted}" aria-label="Voter pour cette façon">👍 <span class="num">${n}</span></button>`}
      <button class="btn sm ghost" data-auraidea="${esc(i.text)}" data-side="${i.points>0?"gain":"loss"}" aria-label="Filmer cette idée">🎬</button>${(own||isAdmin)&&!i.official?`<button class="btn sm ghost" data-ideadel="${esc(i.id)}" aria-label="Supprimer">✕</button>`:""}</span></li>`};
  gl.innerHTML=sorted(i=>i.points>0).map(row).join("");$("auraLoss").innerHTML=sorted(i=>i.points<0).map(row).join("");
  const mine=auraIdeas.filter(i=>i.user_id===myId&&i.status!=="ok");
  const pend=isAdmin?auraIdeas.filter(i=>i.status==="pending"):[];
  box.innerHTML=(pend.length?`<div class="mod"><h3>Idées à valider (${pend.length})</h3><ul class="idealist">${pend.map(i=>`<li class="idea">${pts(i)}<span class="ideatxt"><span class="notr">${esc(i.text)}</span><small>${plink({uid:i.user_id,pseudo:i.pseudo})}</small></span>
      <span class="ideaact"><button class="btn sm good" data-ideaverdict="ok" data-id="${esc(i.id)}">Valider</button><button class="btn sm bad" data-ideaverdict="no" data-id="${esc(i.id)}">Refuser</button></span></li>`).join("")}</ul></div>`:"")
    +(mine.length?`<p class="msg">Tes idées en attente : ${mine.map(i=>`<span class="notr">« ${esc(i.text)} »</span> (${i.status==="no"?"refusée":"en vérification"})`).join(" · ")}</p>`:"");
}
function bindIdeaForm(){
  const f=$("ideaForm"); if(!f||f.dataset.bound)return; f.dataset.bound="1";
  f.onsubmit=async e=>{e.preventDefault();const t=$("ideaText").value.trim().replace(/\s+/g," "),sign=f.querySelector("[name=ideaSign]:checked").value,pts=+$("ideaPts").value*(sign==="-"?-1:1),m=$("ideaMsg");
    if(t.length<8){m.textContent="Décris ton idée en 8 caractères minimum.";m.className="msg bad";return}
    if(!takePseudo(m))return;
    const b=f.querySelector("button[type=submit]");b.disabled=true;
    const ok=await DB.ideaAdd(t,pts);b.disabled=false;b.blur();
    if(ok){$("ideaText").value="";m.className="msg good";m.textContent=live?"Merci ! Ton idée apparaîtra dès qu'elle sera validée.":"Idée ajoutée (aperçu : visible sur cet appareil seulement)."}};
}
const AURA_REASONS=REASONS;
function renderAuraMod(){
  const panel=$("auraMod"); if(!panel)return; if(!isAdmin){panel.hidden=true;return} panel.hidden=false;
  const pend=auraPosts.filter(p=>p.status==="pending"&&!p.hidden).sort((x,y)=>x.t-y.t);
  const repFor=id=>auraReports.filter(r=>r.post_id===id);
  const flagged=auraPosts.filter(p=>p.hidden||repFor(p.id).length);
  const sig=pend.map(p=>p.id).join()+"|"+flagged.map(p=>p.id+p.hidden+repFor(p.id).length).join();
  if(panel.dataset.sig===sig)return; panel.dataset.sig=sig;
  const kindTxt=p=>p.kind==="solo"?"Moment d'aura":p.parent?"Réponse à un duel":"Nouveau duel";
  const item=(p,extra)=>`<div class="mod-item">${p.vid?`<video src="${esc(p.vid)}" controls playsinline preload="metadata"></video>`:`<div class="empty">Pas de vidéo</div>`}
    <div><span class="badge">${kindTxt(p)}</span> ${plink(p)}<br><b class="notr">${esc(p.title)}</b> · ${p.source==="import"?"vidéo importée":"filmée sur le site"}</div>${extra}</div>`;
  panel.innerHTML=`<h2>Vidéos d'aura à vérifier</h2><p class="msg">Section réservée à l'administrateur. Refuse toute vidéo dangereuse, humiliante, ou qui filme quelqu'un sans son accord. Une vidéo refusée est supprimée.</p>
    <div class="mod-list">${pend.length?pend.map(p=>item(p,`<div class="row" style="justify-content:flex-start"><button class="btn sm good" data-auraverdict="ok" data-id="${esc(p.id)}">Valider</button><button class="btn sm bad" data-auraverdict="no" data-id="${esc(p.id)}">Refuser</button></div>`)).join(""):`<div class="empty">Aucune vidéo d'aura en attente.</div>`}</div>
    <h2 style="margin-top:24px">Signalements d'aura</h2>
    <div class="mod-list">${flagged.length?flagged.map(p=>{const rs=repFor(p.id),cnt={};rs.forEach(r=>cnt[r.reason]=(cnt[r.reason]||0)+1);
      return item(p,`<p class="msg">${p.hidden?'<span class="badge no">Masquée</span> ':""}${rs.length} signalement(s) : ${Object.entries(cnt).map(([k,n])=>esc(AURA_REASONS[k]||k)+" ×"+n).join(", ")||"aucun"}</p>
      <div class="row" style="justify-content:flex-start">${p.hidden?`<button class="btn sm good" data-auraunhide="${esc(p.id)}">Rétablir</button>`:`<button class="btn sm" data-aurahide="${esc(p.id)}">Masquer</button>`}<button class="btn sm bad" data-auradel="${esc(p.id)}">Supprimer</button></div>`)}).join(""):`<div class="empty">Aucun signalement.</div>`}</div>`;
}
function auraProfileHtml(uid,own){
  const mine=auraPosts.filter(p=>p.uid===uid&&(own||auraOk(p)));
  let h=`<h2 style="margin-top:28px">${own?"Mes battles d'aura":"Battles d'aura"} <span class="aurapts num">${auraFmt(auraPoints(uid))} aura</span></h2>`;
  if(!mine.length)return h+`<div class="empty">${own?`Aucune vidéo d'aura. <a href="#aura">Poster un moment d'aura</a>`:"Aucune vidéo d'aura."}</div>`;
  const st=p=>p.status==="ok"?'<span class="badge good">Validée</span>':p.status==="no"?'<span class="badge no">Refusée</span>':'<span class="badge">En vérification</span>';
  return h+`<div class="tablewrap"><table><thead><tr><th>Quand</th><th>Vidéo</th><th>Type</th><th class="r">Aura</th>${own?"<th>Statut</th><th></th>":""}</tr></thead><tbody>
    ${mine.map(p=>`<tr><td>${esc(ago(p.t))}</td><td>${p.vid?`<a href="#" class="notr" data-auraplay="${esc(p.id)}">${esc(p.title)}</a>`:`<span class="notr">${esc(p.title)}</span>`}</td><td>${p.kind==="solo"?"Moment d'aura":p.parent?"Réponse à un duel":"Duel"}</td>
      <td class="r num">${auraFmt(auraPostPts(p))}</td>${own?`<td>${st(p)}</td><td><button class="btn sm ghost" data-auradel="${esc(p.id)}">Supprimer</button></td>`:""}</tr>`).join("")}</tbody></table></div>`;
}

/* ---- envoi d'une vidéo d'aura (import ou caméra) ---- */
const AURA_MAX_S=60, AURA_MAX_MB=48;
function auraExt(type){return /mp4/.test(type)?"mp4":/quicktime|mov/.test(type)?"mov":"webm"}
function auraSubmit(kind,parentId,preTitle,preSide){
  const parent=parentId?auraPosts.find(p=>p.id===parentId):null;
  if(parentId&&!parent)return;
  arena.hidden=false; document.body.style.overflow="hidden"; practice=false;
  $("arenaTitle").textContent=kind==="solo"?"Poster un moment d'aura":kind==="reply"?"Relever un duel":"Lancer un duel d'aura";
  clearGame(); stage.classList.add("top");
  let blob=null, source=null, url=null;
  stage.innerHTML=`<div class="auraform">
    ${parent?`<p class="msg">Tu réponds au duel « <b class="notr">${esc(parent.title)}</b> » de ${plink(parent)}. Montre plus d'aura que lui !</p>`
      :kind==="duel"?`<p class="msg">Poste ta vidéo : le premier joueur qui la relève devient ton adversaire, puis la communauté vote pendant ${AURA_DAYS} jours.</p>`
      :`<p class="msg">Poste une vidéo sur le thème de ton choix, du moment que tu y gagnes ou y perds de l'aura. La communauté vote : chaque vote compte ${AURA_PTS} aura.</p>
    <div class="ideasign" role="radiogroup" aria-label="Dans ta vidéo, tu…"><label><input type="radio" name="auraSide" value="gain" ${preSide==="loss"?"":"checked"}> Je gagne de l'aura</label><label><input type="radio" name="auraSide" value="loss" ${preSide==="loss"?"checked":""}> Je perds de l'aura</label></div>`}
    <label class="msg" for="auraTitle">Titre de ta vidéo</label>
    <input id="auraTitle" class="field" maxlength="80" placeholder="ex. Je rattrape mon téléphone sans regarder">
    <div class="row" style="justify-content:flex-start"><button class="btn" id="auraPick" type="button">Importer une vidéo</button><button class="btn" id="auraCam" type="button">Filmer avec la caméra</button>
      <input type="file" id="auraFile" accept="video/*" hidden></div>
    <p class="msg">${AURA_MAX_S} secondes maximum · ${AURA_MAX_MB} Mo maximum</p>
    <div id="auraPrev"></div>
    ${pseudoField()}
    <div class="consent">
      <label class="check"><input type="checkbox" id="ac1"> J'ai 15 ans ou plus, ou un parent m'a donné son accord pour publier cette vidéo.</label>
      <label class="check"><input type="checkbox" id="ac2"> Toutes les personnes filmées sont d'accord, et la vidéo ne met personne en danger ni ne se moque de quelqu'un.</label>
      <label class="check"><input type="checkbox" id="ac3"> J'accepte que ma vidéo soit visible publiquement sur ce site. Je peux la supprimer à tout moment depuis mon profil.</label>
    </div>
    <button class="btn solid" id="auraSend" disabled>Envoyer</button><p class="msg" id="auraMsg"></p></div>`;
  const m=$("auraMsg"), prev=$("auraPrev");
  if(preTitle){$("auraTitle").value=String(preTitle).slice(0,80)}
  const sync=()=>{$("auraSend").disabled=!(blob&&$("ac1").checked&&$("ac2").checked&&$("ac3").checked)};
  ["ac1","ac2","ac3"].forEach(i=>$(i).onchange=sync);
  const setBlob=(b,src)=>{if(url)URL.revokeObjectURL(url);blob=b;source=src;url=URL.createObjectURL(b);
    prev.innerHTML=`<video src="${url}" controls playsinline class="auraprevv"></video><p class="msg">${(b.size/1048576).toFixed(1)} Mo · ${src==="import"?"vidéo importée":"filmée sur le site"}</p>`;sync()};
  cleanup.push(()=>{if(url)URL.revokeObjectURL(url)});
  $("auraPick").onclick=()=>$("auraFile").click();
  $("auraFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;m.className="msg";m.textContent="";
    if(!/^video\//.test(f.type)){m.textContent="Ce fichier n'est pas une vidéo.";m.className="msg bad";return}
    if(!/^video\/(mp4|webm|quicktime)$/.test(f.type)){m.textContent="Format non accepté : envoie une vidéo MP4, MOV ou WebM.";m.className="msg bad";return}
    if(f.size>AURA_MAX_MB*1048576){m.textContent=`Vidéo trop lourde (plus de ${AURA_MAX_MB} Mo).`;m.className="msg bad";return}
    const d=await new Promise(r=>{const v=document.createElement("video");v.preload="metadata";v.onloadedmetadata=()=>r(v.duration);v.onerror=()=>r(NaN);v.src=URL.createObjectURL(f)});
    if(isFinite(d)&&d>AURA_MAX_S+1){m.textContent=`Vidéo trop longue : ${AURA_MAX_S} secondes maximum.`;m.className="msg bad";return}
    setBlob(f,"import")};
  $("auraCam").onclick=async()=>{
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||typeof MediaRecorder==="undefined"){m.textContent="Ton navigateur ne permet pas de filmer depuis une page web. Essaie avec Chrome, Safari ou Firefox à jour.";m.className="msg bad";return}
    let stream;try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:1280},height:{ideal:720}},audio:true})}
    catch(e){m.textContent="Accès à la caméra refusé ou impossible.";m.className="msg bad";return}
    const stop=()=>stream.getTracks().forEach(t=>t.stop());cleanup.push(stop);
    prev.innerHTML=`<video id="auraLive" muted playsinline autoplay class="auraprevv mirror"></video><div class="row"><button class="btn solid" id="auraRec">Lancer l'enregistrement</button></div><p class="msg num notr" id="auraT"></p>`;
    const lv=$("auraLive");lv.srcObject=stream;lv.play().catch(()=>{});
    $("auraRec").onclick=()=>{const mime=pickMime(),rec=new MediaRecorder(stream,mime?{mimeType:mime}:undefined),chunks=[],t0=performance.now();
      rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
      rec.onstop=()=>{clearInterval(iv);stop();setBlob(new Blob(chunks,{type:rec.mimeType||mime||"video/webm"}),"camera")};
      rec.start(500);const b=$("auraRec");b.textContent="Arrêter";b.onclick=()=>{if(rec.state!=="inactive")rec.stop()};
      const iv=setInterval(()=>{const s=(performance.now()-t0)/1000;const el=$("auraT");if(el)el.textContent="● REC "+fr(s,1)+" s / "+AURA_MAX_S+" s";if(s>=AURA_MAX_S&&rec.state!=="inactive")rec.stop()},100);
      cleanup.push(()=>{clearInterval(iv);if(rec.state!=="inactive")try{rec.stop()}catch(e){}})};
  };
  $("auraSend").onclick=async()=>{
    const title=$("auraTitle").value.trim();
    if(title.length<3){m.textContent="Donne un titre à ta vidéo (3 caractères minimum).";m.className="msg bad";$("auraTitle").focus();return}
    if(!takePseudo(m))return;
    if(!(await DB.ensureProfile())){m.textContent="Choisis un pseudo disponible pour continuer.";m.className="msg bad";return}
    $("auraSend").disabled=true;m.className="msg";m.textContent="Envoi de la vidéo…";
    const sideEl=stage.querySelector("[name=auraSide]:checked"),side=kind==="solo"&&sideEl?sideEl.value:"gain";
    const ok=await DB.auraAdd({kind:kind==="solo"?"solo":"duel",parent:parentId||null,title,blob,source,side,ext:auraExt(blob.type||"")});
    if(!ok){$("auraSend").disabled=false;m.textContent="";return}
    clearGame();
    stage.innerHTML=`<div class="result"><span class="eyebrow">Vidéo envoyée</span><h2 class="notr">${esc(title)}</h2>
      <p class="msg good">${live?"Elle apparaîtra dans les battles d'aura dès qu'elle sera validée.":"Aperçu : ta vidéo est publiée sur cet appareil seulement."}</p>
      <div class="row"><a class="btn solid" href="#aura" data-close="1">Voir les battles d'aura</a></div></div>`;
  };
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
  const auraMine=auraPosts.find(p=>p.uid===uid);
  const name=own?(myProfile&&myProfile.pseudo)||pseudoIn.value.trim()||"Toi":(mineAll[0]&&mineAll[0].pseudo)||(auraMine&&auraMine.pseudo)||"Joueur";
  const st=playerStats(uid);
  let html=`<p class="eyebrow">${own?"Mon profil":"Profil de joueur"}</p><h1${pseudoStyle(uid)}>${esc(name)}</h1>${memberBadge(uid)}
    <div class="medals">${st.med.map((n,i)=>`<div class="medal m${i}"><b class="num">${n}</b><span>${MEDALS[i]}</span></div>`).join("")}
      <div class="medal"><b class="num">${mineAll.filter(counts).length}</b><span>Tentatives validées</span></div></div>`;
  html+=`<h2 class="section-gap" style="margin-top:28px">Meilleurs scores</h2>`+(st.best.length?`<div class="tablewrap"><table><thead><tr><th>Défi</th><th class="r">Score</th><th>Classement</th><th></th></tr></thead><tbody>
    ${st.best.sort((x,y)=>x.rank-y.rank).map(r=>`<tr><td>${esc(r.c.name)}</td><td class="r num">${esc(r.c.fmt(r.a.v))}</td><td>${r.rank===1?'<span class="badge">Record du site</span>':r.rank+"<sup>e</sup> sur "+r.of}</td><td>${own?`<button class="btn sm ghost" data-sharecard="${esc(r.a.id)}">Partager</button>`:""}</td></tr>`).join("")}</tbody></table></div>`
    :`<div class="empty">Pas encore de score validé.</div>`);
  if(!own)html+=auraProfileHtml(uid,false);
  if(own){
    html+=`<div class="passline">${isMember()?`<span class="mbadge">PASS</span> Membre du Pass Néon · <a href="#membre">gérer</a>`:`Essais limités à ${LIMIT} par défi et par jour · <a href="#membre">Passer au Pass Néon</a>`}</div>`;
    html+=`<h2 style="margin-top:28px">Mes tentatives</h2>`+(mineAll.length?`<div class="tablewrap"><table><thead><tr><th>Quand</th><th>Défi</th><th class="r">Score</th><th>Statut</th><th></th></tr></thead><tbody>
      ${mineAll.map(a=>`<tr><td>${esc(ago(a.t))}</td><td>${esc(CHM[a.c].name)}</td><td class="r num">${esc(CHM[a.c].fmt(a.v))}</td><td>${statusBadge(a)}${a.vid?` <a href="#" data-pvid="${esc(a.id)}">vidéo</a>`:""}</td>
        <td class="acts">${a.vid&&a.status==="ok"?`<button class="btn sm gold" data-short="${esc(a.id)}">Créer mon Short</button>`:""}<button class="btn sm ghost" data-del="${esc(a.id)}">Supprimer</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Aucune tentative.</div>`);
    html+=auraProfileHtml(uid,true);
    html+=`<h2 style="margin-top:28px">Mes statistiques ${isMember()?"":'<span class="mbadge">PASS</span>'}</h2>`+(isMember()?statsHtml()
      :`<div class="locked"><p class="msg">Courbe de progression sur chaque défi, meilleur score du mois, écart avec le 1er et comparaison avec le record du monde : réservé au Pass Néon.</p><a class="btn solid gold" href="#membre">Débloquer mes statistiques</a></div>`);
    html+=`<h2 style="margin-top:28px">Couleur de mon pseudo ${isMember()?"":'<span class="mbadge">PASS</span>'}</h2>
      <div class="swatches">${Object.entries(COLORS).map(([k,[n,hex]])=>`<button class="swatch ${colors[myId]===k?"on":""}" data-color="${k}" ${isMember()?"":"disabled"} style="--c:${hex}" aria-pressed="${colors[myId]===k}">${n}</button>`).join("")}
        ${isMember()&&colors[myId]?`<button class="btn sm ghost" data-color="">Couleur normale</button>`:""}</div>
      ${isMember()?"":`<p class="msg">Fais briller ton pseudo partout sur le site avec le <a href="#membre">Pass Néon</a>.</p>`}`;
    html+=`<h2 style="margin-top:28px">Mes ligues privées</h2><p class="msg">Un classement rien qu'entre amis, en classe ou en famille.</p>`+leaguesHtml();
    html+=`<h2 style="margin-top:28px">Mon compte</h2><div class="acct">`;
    if(!live)html+=`<p class="msg">Le compte en ligne sera disponible quand le site sera relié à Supabase.</p>`;
    else{
      const pseudoNow=myProfile&&myProfile.pseudo;
      const pwForm=lbl=>`<form class="pwform" id="pwForm"><input class="field" id="pw1" type="password" minlength="8" maxlength="72" required autocomplete="new-password" placeholder="Mot de passe (8 caractères min.)"><input class="field" id="pw2" type="password" minlength="8" maxlength="72" required autocomplete="new-password" placeholder="Confirme le mot de passe"><button class="btn solid" type="submit">${lbl}</button></form>`;
      if(hasPw)html+=`<p class="msg good">Ton pseudo « ${esc(pseudoNow||"")} » est protégé par un mot de passe. Sur un autre appareil, connecte-toi ci-dessous avec ton pseudo et ton mot de passe : tu retrouves tous tes records, tes vidéos et ton Pass Néon.</p>
        <details class="acctmore"><summary>Changer mon mot de passe</summary>${pwForm("Changer le mot de passe")}</details>`;
      else if(pseudoNow)html+=`<p class="msg">Ajoute un mot de passe à ton pseudo « ${esc(pseudoNow)} » pour garder tes records et les retrouver sur n'importe quel appareil.</p>${pwForm("Protéger mon pseudo")}`;
      else html+=`<p class="msg">Choisis d'abord un pseudo (en haut de la page Défis), puis ajoute-lui un mot de passe pour retrouver tes records partout.</p>`;
      html+=`<h3 style="margin-top:18px">${hasPw?"Se connecter avec un autre pseudo":"Déjà un pseudo avec mot de passe ?"}</h3>
        ${pseudoNow&&isAnon?`<p class="msg bad">Attention : le pseudo « ${esc(pseudoNow)} » de cet appareil n'a pas de mot de passe. Si tu te connectes à un autre pseudo, tu ne pourras plus le récupérer.</p>`:""}
        <form class="pwform" id="pwLogin"><input class="field" id="lgPseudo" maxlength="24" required autocomplete="username" placeholder="Ton pseudo"><input class="field" id="lgPw" type="password" maxlength="72" required autocomplete="current-password" placeholder="Mot de passe"><button class="btn" type="submit">Se connecter</button></form>
        ${isAnon?"":`<div class="row" style="justify-content:flex-start;margin-top:8px"><button class="btn sm ghost" id="logoutBtn">Se déconnecter de cet appareil</button></div>`}`;
      html+=`<details class="acctmore"><summary>Autre option : l'e-mail</summary>`+(myEmail?`<p class="msg good">Compte aussi protégé par l'e-mail ${esc(myEmail)}.</p>`
        :`<p class="msg">Tu peux aussi lier ton compte à ton e-mail, pour recevoir un lien de connexion si tu oublies ton mot de passe.</p>
        <form class="row" id="linkForm" style="justify-content:flex-start"><input class="field" id="linkEmail" type="email" placeholder="ton@email.fr" required autocomplete="email"><button class="btn" type="submit">Lier mon e-mail</button></form>`)+`
        <form class="row" id="loginForm" style="justify-content:flex-start"><input class="field" id="loginEmail" type="email" placeholder="ton@email.fr" required autocomplete="email"><button class="btn" type="submit">Recevoir un lien de connexion</button></form></details>`;
    }
    html+=`<div class="row" style="justify-content:flex-start;margin-top:8px"><button class="btn" id="notifBtn">${"Notification" in window&&Notification.permission==="granted"?"Notifications activées":"Activer les notifications"}</button></div>
      <p class="msg">Le site te prévient quand ta vidéo est validée ou quand ton record est battu, tant qu'il est ouvert dans un onglet.</p>
      <div class="danger"><b>Supprimer toutes mes données</b><p class="msg">Efface ton pseudo, tes scores, tes vidéos et les records que tu as créés. Action définitive.</p>
      <div id="delZone"><button class="btn sm bad" id="delAsk">Supprimer mon compte</button></div></div></div>`;
  }
  box.innerHTML=html;
  if(own){bindAccount();bindStats();bindLeagues()}
}
function bindAccount(){
  const pf=$("pwForm"); if(pf)pf.onsubmit=async e=>{e.preventDefault();const a=$("pw1").value,b=$("pw2").value;
    if(a.length<8){toast("Le mot de passe doit faire 8 caractères minimum.");return}
    if(a!==b){toast("Les deux mots de passe ne sont pas identiques.");return}
    const bt=pf.querySelector("button");bt.disabled=true;
    try{await DB.setPassword(a);toast("Mot de passe enregistré : ton pseudo est protégé.");renderProfile()}catch(err){toast("Impossible : "+(err.message||err));bt.disabled=false}};
  const pl=$("pwLogin"); if(pl)pl.onsubmit=async e=>{e.preventDefault();const bt=pl.querySelector("button");bt.disabled=true;
    try{await DB.pseudoLogin($("lgPseudo").value.trim(),$("lgPw").value);toast("Connecté : tes records sont de retour !");showTab("profil")}catch(err){toast(err.message||String(err));bt.disabled=false}};
  const lo=$("logoutBtn"); if(lo)lo.onclick=()=>{lo.disabled=true;DB.logout()};
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
  for(const p of auraPosts.filter(x=>x.uid===myId)){
    if(p.status==="ok")out.push({k:"aok-"+p.id,t:`Ta vidéo d'aura « ${p.title} » a été validée !`,h:"#aura"});
    if(p.status==="no")out.push({k:"ano-"+p.id,t:`Ta vidéo d'aura « ${p.title} » a été refusée.`,h:"#profil"});
    if(p.kind==="duel"&&!p.parent){const r=auraReply(p.id);if(r)out.push({k:"arep-"+r.id,t:`${r.pseudo} a relevé ton duel « ${p.title} » : les votes sont ouverts !`,h:"#aura"})}}
  if(isAdmin){const ap=auraPosts.filter(x=>x.status==="pending"&&!x.hidden).length;if(ap)out.push({k:"adm-a-"+ap+"-"+auraPosts.filter(x=>x.status==="pending").map(x=>x.id).slice(0,1),t:`${ap} vidéo(s) d'aura à vérifier`,h:"#aura"})}
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
  const tabAura=document.querySelector('nav.tabs a[data-tab="aura"]'),apc=isAdmin?auraPosts.filter(x=>x.status==="pending"&&!x.hidden).length:0;
  if(tabAura)tabAura.textContent=apc?`Aura (${apc})`:"Aura";
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

function openAuraReport(id){
  const p=auraPosts.find(x=>x.id===id); if(!p)return;
  $("modalTitle").textContent="Signaler cette vidéo"; const f=$("modalFrame"); f.className="frame form";
  f.innerHTML=`<form id="repForm" class="repform"><p class="msg">${plink(p)} · ${esc(p.title)}</p>
    ${Object.entries(REASONS).map(([k,v],i)=>`<label class="radio"><input type="radio" name="reason" value="${k}" ${i?"":"checked"}> ${esc(v)}</label>`).join("")}
    <p class="msg">Après 3 signalements, la vidéo est masquée en attendant la décision de l'administrateur.</p>
    <button class="btn solid" type="submit">Envoyer le signalement</button></form>`;
  $("modalLink").hidden=true; modal.hidden=false;
  $("repForm").onsubmit=async e=>{e.preventDefault();const r=new FormData(e.target).get("reason");if(await DB.auraReport(id,r)){closeVideo();toast("Merci, ton signalement a été envoyé.")}};
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
  document.querySelectorAll("[data-cfg=priceY]").forEach(e=>e.textContent=CFG.passPriceYearly||"24,99 €");
  $("footContact").textContent=CFG.contactEmail?"· Contact : "+CFG.contactEmail:"";
}
function statusBadge(a){
  if(a.hidden)return '<span class="badge no">Masquée</span>';
  return {auto:"",ok:'<span class="badge ok">Vidéo validée</span>',pending:'<span class="badge pend">À vérifier</span>',no:'<span class="badge no">Refusée</span>'}[a.status]||"";
}

/* ================= Pass Néon (abonnement) ================= */
const PRICE=CFG.passPrice||"2,99 €";
let plan="year";
const yearlyOn=()=>!!CFG.stripePaymentLinkYearly;
function payUrl(){
  const u=new URL(plan==="year"&&yearlyOn()?CFG.stripePaymentLinkYearly:CFG.stripePaymentLink); u.searchParams.set("client_reference_id",myId);
  if(myEmail&&!myEmail.endsWith(TECH_MAIL))u.searchParams.set("prefilled_email",myEmail); return u.toString();
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
  const until=mySub&&mySub.current_period_end?new Date(mySub.current_period_end).toLocaleDateString(LOCALE(),{day:"numeric",month:"long",year:"numeric"}):"";
  if(isMember()&&live){
    h=`<p class="msg good"><b>Tu es membre du Pass Néon${until?" jusqu'au "+esc(until)+" (renouvellement automatique)":""}.</b> Merci de soutenir WorldUltimateRecords !</p>
    ${CFG.stripePortalLink?`<a class="btn" href="${esc(CFG.stripePortalLink)}" target="_blank" rel="noopener">Gérer ou résilier mon abonnement</a>`:""}`;
    box.innerHTML=h; return;
  }
  const PY=CFG.passPriceYearly||"24,99 €";
  h=`<h2>S'abonner</h2>
    ${yearlyOn()||!live||!CFG.stripePaymentLink?`<div class="plans" role="radiogroup" aria-label="Formule">
      <label class="plan ${plan==="month"?"on":""}"><input type="radio" name="plan" value="month" ${plan==="month"?"checked":""}><b>Mensuel</b><span>${esc(PRICE)} / mois</span><small>Sans engagement</small></label>
      <label class="plan ${plan==="year"?"on":""}"><input type="radio" name="plan" value="year" ${plan==="year"?"checked":""}><b>Annuel <em>−30 %</em></b><span>${esc(PY)} / an</span><small>Soit environ ${esc(fr(parseFloat(PY.replace(",","."))/12,2))} € par mois</small></label>
    </div>`:""}
    <div class="consent">
      <label class="check"><input type="checkbox" id="pc1"> J'ai lu et j'accepte les <a href="#legal" target="_blank">conditions de l'abonnement</a>.</label>
      <label class="check"><input type="checkbox" id="pc2"> Je veux profiter du Pass tout de suite et je renonce à mon droit de rétractation de 14 jours.</label>
      <label class="check"><input type="checkbox" id="pc3"> J'ai 18 ans ou plus, ou c'est un parent qui paie et qui accepte l'abonnement.</label>
    </div>
    <a class="btn solid gold big off" id="payBtn" href="#" target="_blank" rel="noopener" aria-disabled="true">Payer ${plan==="year"&&(yearlyOn()||!live||!CFG.stripePaymentLink)?esc(PY)+" / an":esc(PRICE)+" / mois"}</a>
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
      :bl==="anon"?`Dernière étape : <a href="#profil">protège ton pseudo avec un mot de passe</a> pour garder ton Pass sur tous tes appareils.`
      :bl?esc(bl):"Tout est prêt : clique pour payer sur la page sécurisée de Stripe.";
  };
  ["pc1","pc2","pc3"].forEach(i=>$(i).onchange=sync); sync();
  document.querySelectorAll('input[name=plan]').forEach(r=>r.onchange=()=>{const k=[$("pc1").checked,$("pc2").checked,$("pc3").checked];plan=r.value;renderPass();["pc1","pc2","pc3"].forEach((i,j)=>$(i).checked=k[j]);$("pc1").dispatchEvent(new Event("change"))});
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
  const gap=a=>{if(!top||a===top)return"—";const d=Math.abs(a.v-top.v);return (c.better==="low"?"+":"−")+(c.gap?c.gap(d):c.mode==="count"||c.id==="clicks"||c.id==="memory"||c.id==="mental"||c.id==="stroop"?Math.round(d):c.id==="reaction"||c.id==="chrono"?Math.round(d)+" ms":fr(d,2)+(c.mode==="hold"?" s":" s"))};
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
        <td class="r num">${esc(c.fmt(a.v))}</td><td class="r num">${esc(gap(a))}</td><td>${esc(new Date(a.t).toLocaleDateString(LOCALE(),{day:"numeric",month:"short",year:"numeric"}))}</td>
        <td>${a.vid?`<a href="#" data-pvid="${esc(a.id)}">vidéo</a>`:c.kind==="web"?'<span class="msg">navigateur</span>':""}${a.vid&&(isAdmin||a.uid===myId)?` · <a href="#" data-short="${esc(a.id)}">Short</a>`:""}${a.uid===myId?` · <a href="#" data-sharecard="${esc(a.id)}">partager</a>`:""}</td></tr>`).join("")||`<tr><td colspan="6"><div class="empty" style="border:0">Aucun joueur ne correspond à « ${esc(q)} ».</div></td></tr>`}
      </tbody></table></div>`:`<div class="empty">Personne n'est encore classé sur ce défi. Le premier score validé prend la 1<sup>re</sup> place.</div>`}`;
  const rq=$("rankQ"); rq.oninput=()=>{const pos=rq.selectionStart;renderRanking();const n=$("rankQ");n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}};
}

/* ================= partage : carte de score + Short automatique ================= */
const siteUrl=()=>location.origin+location.pathname;
const siteHost=()=>(location.host+location.pathname).replace(/\/$/,"").replace(/^www\./,"")||"WorldUltimateRecords";
let logoImg=null;
function loadLogo(){if(logoImg)return Promise.resolve(logoImg);return new Promise(r=>{const i=new Image();i.onload=()=>{logoImg=i;r(i)};i.onerror=()=>r(null);i.src=document.querySelector(".brand img").src})}
function glowText(g,txt,x,y,font,color,glow,blur){txt=T(txt);g.save();g.font=font;g.fillStyle=color;g.shadowColor=glow;g.shadowBlur=blur;g.fillText(txt,x,y);g.shadowBlur=blur/2;g.fillText(txt,x,y);g.restore()}
function fitFont(g,txt,maxW,size,tpl){txt=T(txt);let s=size;g.font=tpl(s);while(g.measureText(txt).width>maxW&&s>14){s-=2;g.font=tpl(s)}return tpl(s)}
function neonBg(g,W,H,col){
  g.fillStyle="#05020a";g.fillRect(0,0,W,H);
  const r=g.createRadialGradient(W/2,H*.35,0,W/2,H*.35,H*.7);r.addColorStop(0,`rgba(${col},.35)`);r.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=r;g.fillRect(0,0,W,H);
  const hy=H*.72;g.save();g.strokeStyle=`rgba(${col},.5)`;g.lineWidth=2;g.shadowColor=`rgba(${col},1)`;g.shadowBlur=10;
  for(let i=-12;i<=12;i++){g.beginPath();g.moveTo(W/2+i*W*.02,hy);g.lineTo(W/2+i*W*.3,H);g.stroke()}
  for(let k=0;k<9;k++){const p=Math.pow((k+.5)/9,2.2),y=hy+(H-hy)*p;g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}
  g.strokeStyle=`rgba(${col},.95)`;g.lineWidth=3;g.shadowBlur=22;g.beginPath();g.moveTo(0,hy);g.lineTo(W,hy);g.stroke();g.restore();
}
function rankInfo(a){const c=CHM[a.c],b=boardFor(c.id),i=b.findIndex(r=>r.id===a.id||(r.uid===a.uid&&r.v===a.v));
  return {rank:i>=0?i+1:null,of:b.length,isRec:i===0}}

/* ---- 1. carte de score (image 1080×1350) ---- */
async function makeScoreCard(a){
  try{await document.fonts.ready}catch(e){}
  const c=CHM[a.c], W=1080, H=1350, cv=document.createElement("canvas"); cv.width=W; cv.height=H; const g=cv.getContext("2d");
  const ri=rankInfo(a), pend=a.status==="pending", gold=ri.isRec&&!pend, col=gold?"255,201,74":"176,76,255";
  neonBg(g,W,H,col); g.textAlign="center"; g.textBaseline="middle";
  const lg=await loadLogo(); if(lg){g.save();g.beginPath();g.arc(W/2,150,78,0,Math.PI*2);g.clip();g.drawImage(lg,W/2-78,72,156,156);g.restore();
    g.save();g.strokeStyle=`rgba(${col},1)`;g.lineWidth=4;g.shadowColor=`rgba(${col},1)`;g.shadowBlur=20;g.beginPath();g.arc(W/2,150,80,0,Math.PI*2);g.stroke();g.restore()}
  glowText(g,"WorldUltimateRecords",W/2,275,'400 44px "Tilt Neon","Chakra Petch",sans-serif',"#fff","#b04cff",18);
  const tag=pend?"TENTATIVE EN VÉRIFICATION":gold?"NOUVEAU RECORD DU SITE":ri.rank?`${ri.rank}${ri.rank===1?"ER":"E"} SUR ${ri.of} JOUEURS`:"MON SCORE";
  g.font='700 34px "Chakra Petch",sans-serif'; const tw=g.measureText(tag).width+60;
  g.save();g.strokeStyle=`rgba(${col},1)`;g.lineWidth=3;g.shadowColor=`rgba(${col},1)`;g.shadowBlur=14;g.beginPath();g.roundRect(W/2-tw/2,345,tw,64,32);g.stroke();g.restore();
  g.fillStyle=gold?"#ffc94a":"#fff";g.fillText(T(tag),W/2,378);
  glowText(g,c.name,W/2,490,fitFont(g,c.name,W-120,64,s=>`700 ${s}px "Chakra Petch",sans-serif`),"#fff","#b04cff",12);
  const sc=c.fmt(a.v);
  glowText(g,sc,W/2,650,fitFont(g,sc,W-100,150,s=>`400 ${s}px "Tilt Neon","Chakra Petch",sans-serif`),"#fff",gold?"#ffc94a":"#b04cff",46);
  glowText(g,"par "+a.pseudo,W/2,790,fitFont(g,"par "+a.pseudo,W-160,56,s=>`700 ${s}px "Chakra Petch",sans-serif`),"#efe7fb","#7d3cff",10);
  if(c.wr){g.font='500 34px "JetBrains Mono",monospace';g.fillStyle="#5fd0ff";g.fillText(T("Record du monde : "+c.fmt(c.wr.v)),W/2,870)}
  glowText(g,"Bats-moi si tu peux !",W/2,1130,'700 54px "Chakra Petch",sans-serif',"#fff","#ff4d6d",16);
  g.font='500 32px "JetBrains Mono",monospace';g.fillStyle="#d8cdea";g.fillText(siteHost(),W/2,1205);
  return new Promise(r=>cv.toBlob(b=>r(b),"image/png"));
}
async function openShareCard(a){
  const c=CHM[a.c]; if(!c)return;
  $("modalTitle").textContent="Partager mon score"; const f=$("modalFrame"); f.className="frame form";
  f.innerHTML=`<p class="msg">Création de l'image…</p>`; $("modalLink").hidden=true; modal.hidden=false;
  const blob=await makeScoreCard(a); const url=URL.createObjectURL(blob);
  const link=siteUrl()+"#c-"+c.id, text=`J'ai fait ${c.fmt(a.v)} sur « ${c.name} ». Bats-moi si tu peux !`;
  const file=new File([blob],`score-${c.id}.png`,{type:"image/png"});
  const canFile=!!(navigator.canShare&&navigator.canShare({files:[file]}));
  f.innerHTML=`<img src="${url}" alt="Carte de score : ${esc(c.name)}, ${esc(c.fmt(a.v))}" style="width:100%;border-radius:12px;border:1px solid var(--line)">
    <div class="row" style="justify-content:flex-start">
      ${canFile?`<button class="btn solid" id="shImg">Partager l'image</button>`:""}
      <a class="btn ${canFile?"":"solid"}" href="${url}" download="worldultimaterecords-${esc(c.id)}.png">Télécharger l'image</a>
      <button class="btn ghost" id="shLink">Copier le message et le lien</button></div>
    <p class="msg">Publie l'image en story ou en post avec le lien : tes amis arrivent directement sur ce défi.</p>`;
  if(canFile)$("shImg").onclick=()=>navigator.share({files:[file],text:text+" "+link}).catch(()=>{});
  $("shLink").onclick=()=>{const t=text+" "+link;if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>toast("Message copié"),()=>toast(t));else toast(t)};
}

/* ---- 2. Short vertical automatique (vidéo 720×1280) ---- */
async function makeShort(a,canvas,onProgress){
  try{await document.fonts.ready}catch(e){}
  const c=CHM[a.c], W=720, H=1280; canvas.width=W; canvas.height=H; const g=canvas.getContext("2d");
  if(typeof MediaRecorder==="undefined"||!canvas.captureStream)throw new Error("ton navigateur ne sait pas créer de vidéo (essaie Chrome ou Edge sur ordinateur)");
  const v=document.createElement("video"); v.crossOrigin="anonymous"; v.playsInline=true; v.preload="auto"; v.src=a.vid;
  await new Promise((r,j)=>{v.onloadedmetadata=r;v.onerror=()=>j(new Error("vidéo inaccessible"))});
  // les vidéos enregistrées dans le navigateur n'indiquent pas toujours leur durée : on la force
  if(!isFinite(v.duration)){await new Promise(r=>{const done=()=>{v.ontimeupdate=null;r()};v.ontimeupdate=()=>{if(isFinite(v.duration))done()};setTimeout(done,4000);v.currentTime=1e7});
    v.currentTime=0; await new Promise(r=>{v.onseeked=r;setTimeout(r,1500)})}
  const ri=rankInfo(a), gold=ri.isRec&&a.status==="ok", col=gold?"255,201,74":"176,76,255", lg=await loadLogo();
  const tag=gold?"NOUVEAU RECORD !":ri.rank?`${ri.rank}${ri.rank===1?"er":"e"} du classement`:"Tentative validée";
  const dur=isFinite(v.duration)?v.duration:180, INTRO=1.8, OUTRO=2.6, start=Math.max(0,dur-170), clip=Math.max(.1,dur-start);
  const stream=canvas.captureStream(30);
  try{const AC=window.AudioContext||window.webkitAudioContext,ac=new AC(),src=ac.createMediaElementSource(v),dst=ac.createMediaStreamDestination();src.connect(dst);dst.stream.getAudioTracks().forEach(t=>stream.addTrack(t));cleanup.push(()=>ac.close())}catch(e){}
  const mime=pickMime(); const rec=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:3500000}:{videoBitsPerSecond:3500000});
  const chunks=[]; rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
  const header=()=>{g.fillStyle="rgba(5,2,10,.78)";g.fillRect(0,0,W,190);
    if(lg){g.save();g.beginPath();g.arc(70,95,44,0,Math.PI*2);g.clip();g.drawImage(lg,26,51,88,88);g.restore()}
    g.textAlign="left";glowText(g,"WorldUltimateRecords",132,72,'400 38px "Tilt Neon",sans-serif',"#fff","#b04cff",14);
    g.font=fitFont(g,c.name,W-150,32,s=>`700 ${s}px "Chakra Petch",sans-serif`);g.fillStyle="#d8cdea";g.fillText(T(c.name),132,124)};
  const footer=()=>{g.fillStyle="rgba(5,2,10,.82)";g.fillRect(0,H-300,W,300);g.textAlign="center";
    glowText(g,tag,W/2,H-250,'700 40px "Chakra Petch",sans-serif',gold?"#ffc94a":"#fff",gold?"#ffc94a":"#b04cff",18);
    glowText(g,c.fmt(a.v),W/2,H-165,fitFont(g,c.fmt(a.v),W-60,96,s=>`400 ${s}px "Tilt Neon",sans-serif`),"#fff",gold?"#ffc94a":"#b04cff",34);
    g.font=fitFont(g,a.pseudo,W-80,40,s=>`700 ${s}px "Chakra Petch",sans-serif`);g.fillStyle="#efe7fb";g.fillText(a.pseudo,W/2,H-85);
    if(c.wr){g.font='500 24px "JetBrains Mono",monospace';g.fillStyle="#5fd0ff";g.fillText(T("Record du monde : "+c.fmt(c.wr.v)),W/2,H-38)}};
  const title=(p)=>{neonBg(g,W,H,col);g.textAlign="center";const s=1+.06*Math.sin(p*Math.PI);
    if(lg){g.save();g.beginPath();g.arc(W/2,330,110,0,Math.PI*2);g.clip();g.drawImage(lg,W/2-110,220,220,220);g.restore()}
    g.save();g.translate(W/2,560);g.scale(s,s);glowText(g,T(tag).toUpperCase(),0,0,fitFont(g,T(tag).toUpperCase(),W-60,64,z=>`400 ${z}px "Tilt Neon",sans-serif`),"#fff",gold?"#ffc94a":"#b04cff",40);g.restore();
    glowText(g,c.name,W/2,650,fitFont(g,c.name,W-80,44,z=>`700 ${z}px "Chakra Petch",sans-serif`),"#efe7fb","#7d3cff",10);
    glowText(g,a.pseudo,W/2,730,fitFont(g,a.pseudo,W-80,48,z=>`700 ${z}px "Chakra Petch",sans-serif`),"#fff","#b04cff",14)};
  const outro=(p)=>{neonBg(g,W,H,col);g.textAlign="center";
    glowText(g,c.fmt(a.v),W/2,420,fitFont(g,c.fmt(a.v),W-60,110,z=>`400 ${z}px "Tilt Neon",sans-serif`),"#fff",gold?"#ffc94a":"#b04cff",40);
    glowText(g,"À TOI DE LE BATTRE !",W/2,570,'700 54px "Chakra Petch",sans-serif',"#fff","#ff4d6d",20);
    g.font='500 30px "JetBrains Mono",monospace';g.fillStyle="#d8cdea";g.fillText(siteHost(),W/2,660);
    glowText(g,"Abonne-toi pour plus de records",W/2,760,'700 34px "Chakra Petch",sans-serif',"#fff","#b04cff",10)};
  const frame=()=>{const vw=v.videoWidth||W,vh=v.videoHeight||H;
    neonBg(g,W,H,col);
    // fond : la vidéo agrandie et assombrie
    const sc2=Math.max(W/vw,H/vh);g.save();try{g.filter="blur(18px) brightness(.45)"}catch(e){};g.drawImage(v,(W-vw*sc2)/2,(H-vh*sc2)/2,vw*sc2,vh*sc2);g.restore();
    if(!("filter" in g)){g.fillStyle="rgba(0,0,0,.55)";g.fillRect(0,0,W,H)}
    // premier plan : la vidéo entière
    const zoneT=200,zoneH=H-200-310,sc1=Math.min(W/vw,zoneH/vh),dw=vw*sc1,dh=vh*sc1;
    g.save();g.shadowColor=`rgba(${col},.9)`;g.shadowBlur=30;g.drawImage(v,(W-dw)/2,zoneT+(zoneH-dh)/2,dw,dh);g.restore();
    header();footer()};
  return new Promise((resolve,reject)=>{
    let phase="intro",t0=performance.now(),stopped=false,raf;
    const stop=()=>{if(stopped)return;stopped=true;cancelAnimationFrame(raf);try{v.pause()}catch(e){};setTimeout(()=>rec.state!=="inactive"&&rec.stop(),200)};
    cleanup.push(()=>{if(!stopped){stopped=true;cancelAnimationFrame(raf);try{v.pause();rec.state!=="inactive"&&rec.stop()}catch(e){}}});
    rec.onstop=()=>{const type=(rec.mimeType||mime||"video/webm").split(";")[0];resolve(new Blob(chunks,{type}))};
    const total=INTRO+clip+OUTRO;
    const tick=async()=>{if(stopped)return;const el=(performance.now()-t0)/1000;
      if(phase==="intro"){title(Math.min(1,el/INTRO));onProgress(el/total);
        if(el>=INTRO){phase="video";v.currentTime=start;try{await v.play()}catch(e){stop();reject(new Error("lecture impossible"));return}}}
      else if(phase==="video"){frame();onProgress((INTRO+v.currentTime-start)/total);if(v.ended||v.currentTime>=dur-.05){phase="outro";t0=performance.now()-INTRO*1000-clip*1000}}
      else{const p=(el-INTRO-clip)/OUTRO;outro(p);onProgress((INTRO+clip+Math.min(p,1)*OUTRO)/total);if(p>=1){stop();return}}
      raf=requestAnimationFrame(tick)};
    try{rec.start(1000)}catch(e){reject(e);return}
    tick();
  });
}
async function openShortMaker(a){
  const c=CHM[a.c]; if(!c||!a.vid)return;
  arena.hidden=false; document.body.style.overflow="hidden"; $("arenaTitle").textContent="Short : "+c.name; clearGame(); stage.classList.add("top");
  stage.innerHTML=`<p class="hint">Création d'un Short vertical prêt pour YouTube, TikTok et Instagram : intro néon, la vidéo de ${plink(a)}, puis un appel à battre le record. Garde cet onglet ouvert pendant la création (environ la durée de la vidéo).</p>
    <canvas id="shCv" style="width:min(100%,300px);aspect-ratio:9/16;border-radius:14px;background:#000;border:1px solid var(--neon-soft)"></canvas>
    <div class="progress"><i id="shPg"></i></div><p class="msg" id="shMsg">Préparation…</p>`;
  try{
    const blob=await makeShort(a,$("shCv"),p=>{$("shPg").style.width=Math.round(Math.min(1,p)*100)+"%";$("shMsg").textContent="Création du Short… "+Math.round(Math.min(1,p)*100)+" %"});
    const ext=blob.type.includes("mp4")?"mp4":"webm", url=URL.createObjectURL(blob), name=`short-${c.id}-${a.pseudo.replace(/[^A-Za-z0-9_-]/g,"")}.${ext}`;
    const file=new File([blob],name,{type:blob.type}), canFile=!!(navigator.canShare&&navigator.canShare({files:[file]}));
    const caption=`${c.name} : ${c.fmt(a.v)} par ${a.pseudo} ! Tente de battre ce record sur ${siteUrl()}#c-${c.id} #record #defi #shorts`;
    clearGame(); stage.classList.add("top");
    stage.innerHTML=`<p class="eyebrow">Ton Short est prêt</p>
      <video src="${url}" controls playsinline style="width:min(100%,320px);aspect-ratio:9/16;border-radius:14px;background:#000"></video>
      <div class="row">${canFile?`<button class="btn solid" id="shShare">Partager</button>`:""}<a class="btn ${canFile?"":"solid"}" href="${url}" download="${esc(name)}">Télécharger le Short (${(blob.size/1048576).toFixed(1)} Mo)</a><button class="btn ghost" id="shCap">Copier une description</button></div>
      <p class="msg">Sur YouTube : Créer → Importer des vidéos. Une vidéo verticale de moins de 3 minutes est publiée comme Short.${a.uid!==myId?" Pense à prévenir le joueur avant de publier sa vidéo sur ta chaîne.":""}</p>`;
    if(canFile)$("shShare").onclick=()=>navigator.share({files:[file],text:caption}).catch(()=>{});
    $("shCap").onclick=()=>{if(navigator.clipboard)navigator.clipboard.writeText(caption).then(()=>toast("Description copiée"),()=>toast(caption));else toast(caption)};
  }catch(e){$("shMsg").textContent="Création impossible : "+(e.message||e);$("shMsg").className="msg bad"}
}

/* ================= avantages Pass Néon : couleur, ancienneté, stats, ligues ================= */
const COLORS={violet:["Violet","#c77dff"],cyan:["Cyan","#5fd0ff"],rose:["Rose","#ff6fb5"],or:["Or","#ffc94a"],vert:["Vert","#5ee6a8"]};
function seniority(uid){const s=memberSince[uid];if(!s)return {label:"PASS",tier:0};const m=Math.floor((Date.now()-s)/(30.44*864e5));
  return m>=12?{label:"PASS · 1 AN",tier:4}:m>=6?{label:"PASS · 6 MOIS",tier:3}:m>=3?{label:"PASS · 3 MOIS",tier:2}:m>=1?{label:"PASS · 1 MOIS",tier:1}:{label:"PASS",tier:0}}
function memberBadge(uid){if(!members.has(uid))return"";const s=seniority(uid);return `<span class="mbadge t${s.tier}" title="Membre Pass Néon">${s.label}</span>`}
function pseudoStyle(uid){const c=members.has(uid)&&colors[uid];return c&&COLORS[c]?` style="color:${COLORS[c][1]};text-shadow:0 0 10px ${COLORS[c][1]}80"`:""}

/* ---- statistiques détaillées (graphique de progression) ---- */
let statCid=null;
function statsHtml(){
  const mine=list().filter(a=>a.uid===myId&&counts(a));
  const cids=[...new Set(mine.map(a=>a.c))].filter(id=>CHM[id]);
  if(!cids.length)return `<div class="empty">Tes statistiques apparaîtront après ton premier score validé.</div>`;
  if(!cids.includes(statCid))statCid=cids[0];
  const c=CHM[statCid], pts=mine.filter(a=>a.c===statCid).sort((a,b)=>a.t-b.t), best=boardFor(c.id).find(r=>r.uid===myId);
  const board=boardFor(c.id), rank=board.findIndex(r=>r.uid===myId)+1, top=board[0];
  const mStart=new Date();mStart.setDate(1);mStart.setHours(0,0,0,0);
  const monthPts=pts.filter(a=>a.t>=mStart.getTime()), monthBest=monthPts.reduce((b,a)=>!b||isBetter(c,a.v,b.v)?a:b,null);
  const pctWR=c.wr&&best?(c.better==="low"?c.wr.v/best.v:best.v/c.wr.v)*100:null;
  // graphique : ↑ = meilleur, quelle que soit la règle du défi
  const W=640,H=230,L=58,R=18,T=18,B=34, vals=pts.map(a=>a.v).concat(top?[top.v]:[]);
  let lo=Math.min(...vals),hi=Math.max(...vals); if(lo===hi){lo-=1;hi+=1} const pad=(hi-lo)*.12; lo-=pad; hi+=pad;
  const y=v=>c.better==="low"?T+(v-lo)/(hi-lo)*(H-T-B):T+(hi-v)/(hi-lo)*(H-T-B);
  const x=i=>pts.length===1?(L+W-R)/2:L+i*(W-L-R)/(pts.length-1);
  const ticks=[0,.5,1].map(f=>lo+(hi-lo)*f), ints=pts.every(a=>Number.isInteger(a.v));
  const tf=v=>Number(v).toLocaleString(LOCALE(),{maximumFractionDigits:ints?0:2});
  const line=pts.map((a,i)=>`${i?"L":"M"}${x(i).toFixed(1)} ${y(a.v).toFixed(1)}`).join(" ");
  const bestIdx=pts.indexOf(pts.reduce((b,a)=>isBetter(c,a.v,b.v)?a:b,pts[0]));
  const svg=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Progression sur ${esc(c.name)} : ${pts.length} scores, meilleur ${esc(c.fmt(pts[bestIdx].v))}">
    ${ticks.map(v=>`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L-8}" y="${y(v)+4}" class="ax" text-anchor="end">${esc(tf(v))}</text>`).join("")}
    ${top&&top.uid!==myId?`<line x1="${L}" x2="${W-R}" y1="${y(top.v)}" y2="${y(top.v)}" class="recl"/><text x="${W-R}" y="${y(top.v)-6}" class="recl-t" text-anchor="end">Record du site · ${esc(c.fmt(top.v))}</text>`:""}
    <path d="${line}" class="ln"/>
    ${pts.map((a,i)=>`<circle cx="${x(i)}" cy="${y(a.v)}" r="${i===bestIdx?6:4.5}" class="pt${i===bestIdx?" best":""}" data-tip="${esc(c.fmt(a.v))} · ${esc(new Date(a.t).toLocaleDateString(LOCALE(),{day:"numeric",month:"short"}))}"/><circle cx="${x(i)}" cy="${y(a.v)}" r="14" class="hit" data-tip="${esc(c.fmt(a.v))} · ${esc(new Date(a.t).toLocaleDateString(LOCALE(),{day:"numeric",month:"short"}))}"/>`).join("")}
    <text x="${x(bestIdx)}" y="${y(pts[bestIdx].v)-12}" class="lab" text-anchor="${x(bestIdx)>W-R-60?"end":x(bestIdx)<L+60?"start":"middle"}">${esc(c.fmt(pts[bestIdx].v))}</text>
    <text x="${L}" y="${H-8}" class="ax">1re tentative</text><text x="${W-R}" y="${H-8}" class="ax" text-anchor="end">aujourd'hui</text>
  </svg>`;
  return `<div class="row" style="justify-content:flex-start"><label class="msg" for="statSel">Défi</label>
      <select id="statSel" class="field">${cids.map(id=>`<option value="${esc(id)}" ${id===statCid?"selected":""}>${esc(CHM[id].name)}</option>`).join("")}</select>
      <span class="msg">↑ plus haut = meilleur score</span></div>
    <div class="tiles">
      <div class="tile"><span>Meilleur score</span><b class="num">${best?esc(c.fmt(best.v)):"—"}</b></div>
      <div class="tile"><span>Classement</span><b class="num">${rank?rank+(rank===1?"er":"e")+" / "+board.length:"—"}</b></div>
      <div class="tile"><span>Écart avec le 1er</span><b class="num">${rank===1?"Tu es 1er":top&&best?esc(c.fmt(Math.abs(top.v-best.v)).replace(/^0,00 s$/,"—")):"—"}</b></div>
      <div class="tile"><span>Meilleur ce mois-ci</span><b class="num">${monthBest?esc(c.fmt(monthBest.v)):"—"}</b></div>
      ${pctWR!=null?`<div class="tile"><span>Record du monde</span><b class="num">${fr(pctWR,1)} %</b></div>`:""}
      <div class="tile"><span>Scores validés</span><b class="num">${pts.length}</b></div>
    </div>
    <div class="chartwrap">${svg}<div class="ctip" id="ctip" hidden></div></div>`;
}
function bindStats(){
  const sel=$("statSel"); if(sel)sel.onchange=()=>{statCid=sel.value;renderProfile()};
  const wrap=document.querySelector(".chartwrap"); if(!wrap)return; const tip=$("ctip");
  wrap.onpointermove=e=>{const t=e.target.closest("[data-tip]");if(!t){tip.hidden=true;return}
    tip.textContent=t.dataset.tip;tip.hidden=false;const r=wrap.getBoundingClientRect();
    tip.style.left=Math.min(r.width-140,Math.max(0,e.clientX-r.left+12))+"px";tip.style.top=(e.clientY-r.top-34)+"px"};
  wrap.onpointerleave=()=>tip.hidden=true;
}

/* ---- ligues privées ---- */
let myLeagues=[], leagueCode=null, leagueData=null, leagueCid="clicks";
async function loadMyLeagues(){
  if(!live){myLeagues=lsGet("wur_leagues",[]);return}
  const {data}=await sb.from("leagues").select("id,name,code,owner").order("created_at",{ascending:false}); myLeagues=data||[];
}
async function loadLeague(code){
  leagueData={loading:true};
  if(!live){const l=lsGet("wur_leagues",[]).find(x=>x.code===code);leagueData=l?{league:l,members:[myId]}:{preview:null};return}
  const {data:l}=await sb.from("leagues").select("id,name,code,owner").eq("code",code).maybeSingle();
  if(!l){const {data:p}=await sb.rpc("league_preview",{p_code:code});leagueData={preview:p||null};return}
  const {data:m}=await sb.from("league_members").select("user_id").eq("league_id",l.id);
  leagueData={league:l,members:(m||[]).map(x=>x.user_id)};
}
function leaguesHtml(){
  const can=isMember();
  return `${myLeagues.length?`<div class="leagues">${myLeagues.map(l=>`<a class="league" href="#l-${esc(l.code)}"><b>${esc(l.name)}</b><span class="num">code ${esc(l.code)}</span></a>`).join("")}</div>`:`<p class="msg">Tu ne fais partie d'aucune ligue.</p>`}
    <form class="row" id="joinForm" style="justify-content:flex-start"><input class="field" id="joinCode" maxlength="6" placeholder="Code d'invitation" style="text-transform:uppercase;max-width:200px" required><button class="btn" type="submit">Rejoindre</button></form>
    ${can?`<form class="row" id="newLeague" style="justify-content:flex-start"><input class="field" id="leagueName" maxlength="40" placeholder="ex. Classe de 4e B, Famille Martin" required><button class="btn solid gold" type="submit">Créer une ligue</button></form>`
      :`<p class="msg">Créer une ligue est réservé au <a href="#membre">Pass Néon</a>. Rejoindre une ligue est gratuit pour tout le monde.</p>`}`;
}
function bindLeagues(){
  const jf=$("joinForm"); if(jf)jf.onsubmit=e=>{e.preventDefault();location.hash="l-"+$("joinCode").value.trim().toUpperCase()};
  const nf=$("newLeague"); if(nf)nf.onsubmit=async e=>{e.preventDefault();const name=$("leagueName").value.trim();if(name.length<3){toast("Le nom doit faire au moins 3 caractères.");return}
    if(!live){const code=Math.random().toString(36).slice(2,8).toUpperCase(),l={id:code,name,code,owner:myId},ls=lsGet("wur_leagues",[]);ls.unshift(l);lsSet("wur_leagues",ls);myLeagues=ls;location.hash="l-"+code;return}
    const {data,error}=await sb.rpc("create_league",{p_name:name}); if(error){toast(error.message);return}
    await loadMyLeagues(); location.hash="l-"+data.code};
}
async function renderLeague(){
  const box=$("leagueBox");
  if(!leagueData||leagueData.code!==leagueCode){box.innerHTML=`<p class="msg">Chargement de la ligue…</p>`;await loadLeague(leagueCode);leagueData.code=leagueCode}
  const d=leagueData;
  if(d.preview!==undefined){
    box.innerHTML=d.preview?`<p class="eyebrow">Ligue privée</p><h1>${esc(d.preview.name)}</h1><p class="lede">${d.preview.members} membre${d.preview.members>1?"s":""}. Rejoins la ligue pour voir son classement et défier ses membres.</p>
      <div class="row" style="justify-content:flex-start"><button class="btn solid" id="joinBtn">Rejoindre la ligue</button></div>`
      :`<p class="eyebrow">Ligue privée</p><h1>Ligue introuvable</h1><p class="lede">Le code « ${esc(leagueCode)} » ne correspond à aucune ligue. Vérifie-le auprès de la personne qui t'a invité.</p>`;
    const jb=$("joinBtn"); if(jb)jb.onclick=async()=>{if(!(await DB.ensureProfile()))return;const {error}=await sb.rpc("join_league",{p_code:leagueCode});if(error){toast(error.message);return}
      leagueData=null;await loadMyLeagues();toast("Bienvenue dans la ligue !");renderLeague()};
    return;
  }
  const l=d.league, mem=new Set(d.members), owner=l.owner===myId;
  const cand=CH.filter(c=>list().some(a=>a.c===c.id&&mem.has(a.uid)&&counts(a)));
  if(!CHM[leagueCid]||(cand.length&&!cand.some(c=>c.id===leagueCid)))leagueCid=(cand[0]||CH[0]).id;
  const c=CHM[leagueCid], rows=boardFor(c.id).filter(a=>mem.has(a.uid));
  const invite=siteUrl()+"#l-"+l.code;
  box.innerHTML=`<p class="eyebrow">Ligue privée · ${d.members.length} membre${d.members.length>1?"s":""}</p><h1>${esc(l.name)}</h1>
    <div class="invite"><span>Invite tes amis avec le code <b class="num">${esc(l.code)}</b> ou ce lien :</span><code>${esc(invite)}</code><button class="btn sm" id="copyInv">Copier le lien</button></div>
    <div class="chips">${(cand.length?cand:CH.slice(0,6)).map(x=>`<button class="chip" data-lc="${esc(x.id)}" aria-pressed="${x.id===leagueCid}">${esc(x.name)}</button>`).join("")}</div>
    <h2 style="margin-top:18px">${esc(c.name)}</h2>
    ${rows.length?`<div class="tablewrap"><table class="ranking"><thead><tr><th>Rang</th><th>Joueur</th><th class="r">Score</th><th>Date</th></tr></thead><tbody>
      ${rows.map((a,i)=>`<tr class="${a.uid===myId?"me":""}"><td><span class="rk m${i} num">${i+1}</span></td><td>${plink(a)}</td><td class="r num">${esc(c.fmt(a.v))}</td><td>${esc(new Date(a.t).toLocaleDateString(LOCALE(),{day:"numeric",month:"short"}))}</td></tr>`).join("")}</tbody></table></div>`
      :`<div class="empty">Aucun membre de la ligue n'a encore de score validé sur ce défi.</div>`}
    <div class="row" style="justify-content:flex-start;margin-top:16px">${c.kind==="vip"&&!isMember()?"":`<button class="btn solid" data-play="${esc(c.id)}">Tenter ce défi</button>`}
      ${owner?`<button class="btn sm bad" id="delLeague">Supprimer la ligue</button>`:`<button class="btn sm ghost" id="leaveLeague">Quitter la ligue</button>`}</div>`;
  $("copyInv").onclick=()=>{if(navigator.clipboard)navigator.clipboard.writeText(invite).then(()=>toast("Lien copié"),()=>toast(invite));else toast(invite)};
  box.querySelectorAll("[data-lc]").forEach(b=>b.onclick=()=>{leagueCid=b.dataset.lc;renderLeague()});
  const lv=$("leaveLeague"); if(lv)lv.onclick=async()=>{if(!live)return;await sb.from("league_members").delete().eq("league_id",l.id).eq("user_id",myId);await loadMyLeagues();location.hash="profil"};
  const dl=$("delLeague"); if(dl)dl.onclick=async()=>{if(dl.dataset.c!=="1"){dl.dataset.c="1";dl.textContent="Confirmer la suppression ?";return}
    if(live)await sb.from("leagues").delete().eq("id",l.id);else lsSet("wur_leagues",lsGet("wur_leagues",[]).filter(x=>x.code!==l.code));
    await loadMyLeagues();location.hash="profil"};
}

/* ================= tabs ================= */
function showTab(id){
  profileUid=null;
  if(/^p-[0-9a-f-]{36}$/.test(id)){profileUid=id.slice(2);id="profil"}
  if(/^c-[a-z0-9-]{2,60}$/.test(id)){rankCid=id.slice(2);id="classement";renderRanking()}
  if(/^l-[A-Za-z0-9]{6}$/.test(id)){leagueCode=id.slice(2).toUpperCase();id="ligue";renderLeague()}
  if(!["defis","records","aura","shorts","profil","legal","membre","classement","ligue"].includes(id))id="defis";
  if(id==="aura")renderAura();
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
  const col=e.target.closest("[data-color]"); if(col&&!col.disabled){const v=col.dataset.color||null;
    if(!live){colors[myId]=v;renderAll();return}
    const {data,error}=await sb.from("profiles").update({color:v}).eq("user_id",myId).select().single();
    if(error){toast(error.message);return} myProfile=data; if(v)colors[myId]=v; else delete colors[myId]; renderAll(); toast(v?"Couleur appliquée":"Couleur retirée"); return}
  const scd=e.target.closest("[data-sharecard]"); if(scd){e.preventDefault();const a=attempts.find(x=>x.id===scd.dataset.sharecard);if(a)openShareCard(a);return}
  const sho=e.target.closest("[data-short]"); if(sho){e.preventDefault();const a=attempts.find(x=>x.id===sho.dataset.short);if(a){closeVideo();openShortMaker(a)}return}
  const aid=e.target.closest("[data-auraidea]"); if(aid){e.preventDefault();auraSubmit("solo",null,aid.dataset.auraidea,aid.dataset.side);return}
  const ivt=e.target.closest("[data-ideavote]"); if(ivt){e.preventDefault();ivt.disabled=true;await DB.ideaVote(ivt.dataset.ideavote);return}
  const ivd=e.target.closest("[data-ideaverdict]"); if(ivd){ivd.disabled=true;if(await DB.ideaSetStatus(ivd.dataset.id,ivd.dataset.ideaverdict))toast(ivd.dataset.ideaverdict==="ok"?"Idée validée":"Idée refusée");else ivd.disabled=false;return}
  const idl=e.target.closest("[data-ideadel]"); if(idl){if(idl.dataset.confirm!=="1"){idl.dataset.confirm="1";idl.textContent="Confirmer ?";setTimeout(()=>{if(idl.isConnected){idl.dataset.confirm="";idl.textContent="✕"}},4000);return}
    idl.disabled=true;if(await DB.ideaDelete(idl.dataset.ideadel))toast("Idée supprimée");return}
    const an=e.target.closest("[data-auranew]"); if(an){e.preventDefault();auraSubmit(an.dataset.auranew,an.dataset.parent||null);return}
  const av=e.target.closest("[data-auravote]"); if(av){e.preventDefault();av.disabled=true;await DB.auraVote(av.dataset.auravote,av.dataset.choice);av.disabled=false;return}
  const as=e.target.closest("[data-aurasort]"); if(as){auraSort=as.dataset.aurasort;renderAura();return}
  const ar=e.target.closest("[data-aurareport]"); if(ar){e.preventDefault();openAuraReport(ar.dataset.aurareport);return}
  const ap=e.target.closest("[data-auraplay]"); if(ap){e.preventDefault();const p=auraPosts.find(x=>x.id===ap.dataset.auraplay);if(p&&p.vid)openVideo(p.title,{kind:"video",url:p.vid},"v",null);return}
  const avd=e.target.closest("[data-auraverdict]"); if(avd){avd.disabled=true;if(await DB.auraSetStatus(avd.dataset.id,avd.dataset.auraverdict))toast(avd.dataset.auraverdict==="ok"?"Vidéo validée":"Vidéo refusée");else avd.disabled=false;return}
  const ahd=e.target.closest("[data-aurahide]"); if(ahd){ahd.disabled=true;if(await DB.auraSetHidden(ahd.dataset.aurahide,true))toast("Vidéo masquée");return}
  const auh=e.target.closest("[data-auraunhide]"); if(auh){auh.disabled=true;if(await DB.auraSetHidden(auh.dataset.auraunhide,false))toast("Vidéo rétablie");return}
  const adl=e.target.closest("[data-auradel]"); if(adl){if(adl.dataset.confirm!=="1"){adl.dataset.confirm="1";adl.textContent="Confirmer ?";setTimeout(()=>{if(adl.isConnected){adl.dataset.confirm="";adl.textContent="Supprimer"}},4000);return}
    adl.disabled=true;if(await DB.auraDelete(adl.dataset.auradel))toast("Vidéo supprimée");return}
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
    if(await DB.addAttempt({c:c.id,v:Math.round(v*1000)/1000,status:"auto"})){sb_.textContent="Enregistrée";
      const mine=list().filter(x=>x.uid===myId&&x.c===c.id).sort((x,y)=>y.t-x.t)[0];
      if(mine&&!$("shareBtn")){const b=document.createElement("button");b.className="btn solid gold";b.id="shareBtn";b.textContent="Partager mon score";b.onclick=()=>openShareCard(mine);sb_.after(b)}m.textContent=k.isRec?"Tu détiens le record du site.":"Ta tentative est dans le classement.";m.className="msg good"}
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
    g.fillStyle="#efe7fb"; g.font=`700 ${F*.9}px "Chakra Petch",sans-serif`; g.textAlign="left"; g.fillText("WorldUltimateRecords · "+T(c.name),F*.6,F*1.1);
    g.textAlign="right"; g.font=`700 ${F}px "JetBrains Mono",monospace`; g.fillStyle="#fff"; g.fillText(code,W-F*.6,F*1.1);
    const d=new Date(); g.font=`500 ${F*.6}px "JetBrains Mono",monospace`; g.fillStyle="#d8cdea"; g.fillText(d.toLocaleDateString(LOCALE())+" "+d.toLocaleTimeString(LOCALE()),W-F*.6,H-F*.7);
    let txt,lbl,fin=state.phase==="done"||state.phase==="tail";
    if(c.mode==="count"){const rem=Math.max(0,c.win-el);txt=rem.toFixed(2);lbl=fin?"TERMINÉ":state.phase==="run"?"TEMPS RESTANT":"PRÊT"}
    else if(c.mode==="time"){txt=el.toFixed(2)+" s";lbl=fin?"ARRIVÉE":state.phase==="run"?"CHRONO":"PRÊT"}
    else{const m=Math.floor(el/60),s=el%60;txt=String(m).padStart(2,"0")+":"+s.toFixed(1).padStart(4,"0");lbl=fin?"FIN":state.phase==="run"?"TENUE":"PRÊT"}
    g.textAlign="left"; g.font=`700 ${F*.7}px "Chakra Petch",sans-serif`; g.fillStyle=fin?"#ffc94a":"#b04cff"; g.fillText(T(lbl),F*.6,H-F*2.5);
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
        <div class="row"><button class="btn solid gold" id="shareBtn">Partager mon score</button><button class="btn" id="again">Nouvelle tentative</button></div>
        <p class="msg">Une fois ta vidéo validée, tu pourras créer ton Short depuis ton profil.</p></div>`;
      $("again").onclick=()=>camIntro(c);
      $("shareBtn").onclick=()=>{const mine=list().filter(x=>x.uid===myId&&x.c===c.id).sort((x,y)=>y.t-x.t)[0];if(mine)openShareCard(mine)};
    }catch(e){$("send").disabled=false;m.textContent="Envoi impossible : "+(e.message||e)+". Réessaie.";m.className="msg bad"}
  };
}

/* ================= browser games ================= */
function gameCanvas(w,h,st){return `<canvas id="cv" class="gamecv" width="${w}" height="${h}" style="${st||""}"></canvas>`}
function cvPoint(cv,e){const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)*cv.width/r.width,y:(e.clientY-r.top)*cv.height/r.height}}
let AC=null;
function ac(){if(!AC){const A=window.AudioContext||window.webkitAudioContext;if(A)AC=new A()}if(AC&&AC.state==="suspended")AC.resume();return AC}
function tone(f,dur,at,type,vol){const a=ac();if(!a)return;const o=a.createOscillator(),g=a.createGain(),v=vol||.25;o.type=type||"sine";o.frequency.value=f;o.connect(g);g.connect(a.destination);
  const t=Math.max(a.currentTime,at||0);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.setValueAtTime(v,t+Math.max(.02,dur-.03));g.gain.linearRampToValueAtTime(0,t+dur);o.start(t);o.stop(t+dur+.02)}
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
      stage.innerHTML=`<div class="typing-target num notr" id="tt" style="letter-spacing:.12em;text-align:center"></div><input id="ti" class="typeIn" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Tape l'alphabet"><div class="mega num" style="font-size:36px" id="tm">0,00 s</div><p class="msg">Le chrono démarre à la première lettre. Une faute remet la saisie à zéro.</p>`;
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
    const S="A record is never broken by chance, it is prepared every single day.";
    intro(c,"Commencer",()=>{
      clearGame(); let start=0,iv;
      stage.innerHTML=`<div class="typing-target notr" id="tt"></div><input id="ti" class="typeIn" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Recopie la phrase"><div class="mega num" style="font-size:36px" id="tm">0,00 s</div>`;
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
  },
  steady(c){
    intro(c,"Commencer",()=>{
      clearGame(); stage.classList.add("top");
      const W=700,H=360,HW=17,N=700,pts=[];
      for(let i=0;i<=N;i++){const t=i/N;pts.push([40+t*620,180+105*Math.sin(t*Math.PI*3)+38*Math.sin(t*Math.PI*8+.7)])}
      const S=pts[0],E=pts[N];
      stage.innerHTML=`<div class="mega num" id="tm" style="font-size:32px">${fr(0,2)} s</div>${gameCanvas(W,H)}<p class="msg" id="st">Pose le doigt ou la souris sur le point vert, puis glisse jusqu'au point doré.</p>`;
      const cv=$("cv"),g=cv.getContext("2d"),tm=$("tm"),st=$("st");
      let run=false,t0=0,iv,trail=[],hurt=0;
      const draw=()=>{g.clearRect(0,0,W,H);g.lineCap="round";g.lineJoin="round";
        const path=()=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]))};
        path();g.strokeStyle=hurt?"#ff6b8a":"#b04cff";g.lineWidth=HW*2+6;g.shadowColor=g.strokeStyle;g.shadowBlur=18;g.stroke();g.shadowBlur=0;
        path();g.strokeStyle="#1a1029";g.lineWidth=HW*2;g.stroke();
        if(trail.length>1){g.beginPath();trail.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.strokeStyle="rgba(255,255,255,.75)";g.lineWidth=3;g.stroke()}
        g.fillStyle="#5ee6a8";g.beginPath();g.arc(S[0],S[1],13,0,7);g.fill();
        g.fillStyle="#ffc94a";g.beginPath();g.arc(E[0],E[1],13,0,7);g.fill()};
      const inside=p=>{let m=1e9;for(let i=0;i<=N;i+=2){const dx=pts[i][0]-p.x,dy=pts[i][1]-p.y,d=dx*dx+dy*dy;if(d<m)m=d}return Math.sqrt(m)<=HW};
      const fail=msg=>{run=false;clearInterval(iv);trail=[];hurt=1;draw();st.textContent=msg;st.className="msg bad";tm.textContent=fr(0,2)+" s";
        later(()=>{hurt=0;draw()},350)};
      draw();
      cv.onpointerdown=e=>{e.preventDefault();const p=cvPoint(cv,e);
        if(Math.hypot(p.x-S[0],p.y-S[1])>20)return;
        try{cv.setPointerCapture(e.pointerId)}catch(_){}
        run=true;t0=performance.now();trail=[p];st.textContent="Vas-y, sans toucher les bords !";st.className="msg";
        clearInterval(iv);iv=setInterval(()=>{tm.textContent=fr((performance.now()-t0)/1000,2)+" s"},40);cleanup.push(()=>clearInterval(iv))};
      cv.onpointermove=e=>{if(!run)return;const p=cvPoint(cv,e);trail.push(p);
        if(!inside(p)){fail("Sorti ! Retourne au point vert pour recommencer.");return}
        if(Math.hypot(p.x-E[0],p.y-E[1])<HW){run=false;clearInterval(iv);finish(c,(performance.now()-t0)/1000);return}
        draw()};
      const up=()=>{if(run)fail("Tu as lâché ! Retourne au point vert pour recommencer.")};
      cv.onpointerup=up;cv.onpointercancel=up;
    });
  },
  alternate(c){
    intro(c,"Commencer",()=>{
      clearGame(); let n=0,last=-1,start=0,iv,done=false;
      stage.innerHTML=`<div class="mega num" id="tm" style="font-size:36px">${fr(10,2)}</div>
        <div class="altrow"><button class="altbtn" data-s="0">◀</button><button class="altbtn" data-s="1">▶</button></div>
        <div class="msg"><span class="num" id="cn">0</span> touches · alterne gauche et droite</div>`;
      stage.querySelectorAll(".altbtn").forEach(b=>b.onpointerdown=e=>{e.preventDefault();if(done)return;const s=+b.dataset.s;
        if(!start){start=performance.now();iv=setInterval(()=>{const r=Math.max(0,10-(performance.now()-start)/1000);$("tm").textContent=fr(r,2);
          if(r<=0){clearInterval(iv);done=true;later(()=>finish(c,n),300)}},30);cleanup.push(()=>clearInterval(iv))}
        if(s!==last){n++;last=s;$("cn").textContent=n;b.classList.add("hit");later(()=>b.classList.remove("hit"),80)}
        else{b.classList.add("miss");later(()=>b.classList.remove("miss"),150)}});
    });
  },
  tower(c){
    intro(c,"Commencer",()=>{
      clearGame(); stage.classList.add("top");
      const W=360,H=520,BH=26;
      stage.innerHTML=`<div class="msg"><span class="mega num" id="fl" style="font-size:34px">0</span> étages</div>${gameCanvas(W,H,"max-height:62vh")}<p class="msg">Touche l'écran ou appuie sur Espace pour lâcher le bloc.</p>`;
      const cv=$("cv"),g=cv.getContext("2d");
      const tower=[{x:80,w:200}];let cur={x:0,w:200,dir:1},floors=0,over=false,raf,last=performance.now(),born=performance.now(),cut=null;
      const hue=i=>`hsl(${(275+i*9)%360} 90% ${58+(i%2)*6}%)`;
      const draw=()=>{g.clearRect(0,0,W,H);const top=H-BH*(tower.length+1);const off=Math.max(0,160-top);
        tower.forEach((b,i)=>{g.fillStyle=hue(i);g.shadowColor=g.fillStyle;g.shadowBlur=10;g.fillRect(b.x,H-BH*(i+1)+off,b.w,BH-3)});
        if(!over){g.fillStyle=hue(tower.length);g.fillRect(cur.x,H-BH*(tower.length+1)+off,cur.w,BH-3)}
        if(cut){g.globalAlpha=Math.max(0,cut.a);g.fillStyle="#ff6b8a";g.fillRect(cut.x,cut.y+off,cut.w,BH-3);g.globalAlpha=1}
        g.shadowBlur=0};
      const loop=now=>{const dt=Math.min(50,now-last)/1000;last=now;
        if(!over){const sp=150+floors*14;cur.x+=cur.dir*sp*dt;if(cur.x+cur.w>W){cur.x=W-cur.w;cur.dir=-1}if(cur.x<0){cur.x=0;cur.dir=1}}
        if(cut){cut.y+=260*dt;cut.a-=dt*1.6;if(cut.a<=0)cut=null}
        draw();raf=requestAnimationFrame(loop)};
      raf=requestAnimationFrame(loop);cleanup.push(()=>cancelAnimationFrame(raf));
      const drop=()=>{if(over||performance.now()-born<250)return;const p=tower[tower.length-1];
        let l=Math.max(p.x,cur.x),r=Math.min(p.x+p.w,cur.x+cur.w);
        if(r-l<=0){over=true;cut={x:cur.x,y:H-BH*(tower.length+1),w:cur.w,a:1};later(()=>finish(c,floors),900);return}
        if(Math.abs(cur.x-p.x)<4){l=p.x;r=p.x+p.w}
        else{const cx=cur.x<p.x?cur.x:r,cw=cur.x<p.x?p.x-cur.x:cur.x+cur.w-r;cut={x:cx,y:H-BH*(tower.length+1),w:cw,a:1}}
        tower.push({x:l,w:r-l});floors++;$("fl").textContent=floors;
        cur={x:cur.dir>0?0:W-(r-l),w:r-l,dir:cur.dir}};
      stage.onpointerdown=e=>{if(e.target.closest("button"))return;e.preventDefault();drop()};
      const kd=e=>{if(e.code==="Space"){e.preventDefault();drop()}};document.addEventListener("keydown",kd);cleanup.push(()=>document.removeEventListener("keydown",kd));
    });
  },
  circle(c){
    intro(c,"Commencer",()=>{
      clearGame(); stage.classList.add("top");
      const W=500,H=500;
      stage.innerHTML=`<div class="mega num" id="pc" style="font-size:40px">—</div>${gameCanvas(W,H,"max-height:60vh")}<p class="msg" id="st">Dessine un cercle d'un seul trait autour du point.</p>`;
      const cv=$("cv"),g=cv.getContext("2d"),st=$("st");let pts=[],down=false,done=false;
      const base=()=>{g.clearRect(0,0,W,H);g.fillStyle="#a495bd";g.beginPath();g.arc(W/2,H/2,4,0,7);g.fill()};
      const line=(col)=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.strokeStyle=col;g.lineWidth=5;g.lineCap="round";g.lineJoin="round";g.shadowColor=col;g.shadowBlur=14;g.stroke();g.shadowBlur=0};
      base();
      cv.onpointerdown=e=>{if(done)return;e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}down=true;pts=[cvPoint(cv,e)];base();st.className="msg";st.textContent="…"};
      cv.onpointermove=e=>{if(!down)return;pts.push(cvPoint(cv,e));base();line("#b04cff")};
      const up=()=>{if(!down)return;down=false;
        if(pts.length<20){st.textContent="Trop court : dessine un cercle entier.";st.className="msg bad";return}
        let cx=0,cy=0;pts.forEach(p=>{cx+=p.x;cy+=p.y});cx/=pts.length;cy/=pts.length;
        const rs=pts.map(p=>Math.hypot(p.x-cx,p.y-cy)),r=rs.reduce((a,b)=>a+b,0)/rs.length;
        let turn=0;for(let i=1;i<pts.length;i++){let d=Math.atan2(pts[i].y-cy,pts[i].x-cx)-Math.atan2(pts[i-1].y-cy,pts[i-1].x-cx);if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;turn+=d}
        if(r<60){st.textContent="Trop petit : dessine un cercle plus grand.";st.className="msg bad";return}
        if(Math.abs(turn)<Math.PI*1.9){st.textContent="Fais un tour complet, sans t'arrêter avant.";st.className="msg bad";return}
        const mad=rs.reduce((a,b)=>a+Math.abs(b-r),0)/rs.length,close=Math.hypot(pts[0].x-pts[pts.length-1].x,pts[0].y-pts[pts.length-1].y)/r;
        const score=Math.max(0,Math.min(100,100-mad/r*200-Math.max(0,close-.25)*20));
        done=true;base();g.setLineDash([6,8]);g.strokeStyle="rgba(255,255,255,.45)";g.lineWidth=2;g.beginPath();g.arc(cx,cy,r,0,7);g.stroke();g.setLineDash([]);
        line(score>=90?"#5ee6a8":score>=75?"#ffc94a":"#ff6b8a");$("pc").textContent=fr(score,1)+" %";
        later(()=>finish(c,Math.round(score*10)/10),1300)};
      cv.onpointerup=up;cv.onpointercancel=up;
    });
  },
  digits(c){
    intro(c,"Commencer",()=>{
      let L=3;
      const round=()=>{clearGame();let num="";for(let i=0;i<L;i++)num+=Math.floor(Math.random()*10);
        stage.innerHTML=`<div class="msg">Niveau ${L-2}</div><div class="mega num" style="letter-spacing:.08em;font-size:clamp(28px,8vw,72px);word-break:break-all">${num}</div><div class="barwrap"><div class="bar" id="bar"></div></div>`;
        const ms=900+L*400;const bar=$("bar");bar.style.transition=`width ${ms}ms linear`;requestAnimationFrame(()=>requestAnimationFrame(()=>bar.style.width="0%"));
        later(()=>{stage.innerHTML=`<div class="msg">Quel était le nombre ?</div>
          <input id="di" class="typeIn num" type="text" inputmode="numeric" autocomplete="off" aria-label="Ta réponse" style="max-width:420px;text-align:center;font-size:28px">
          <button class="btn solid" id="dv">Valider</button>`;
          const inp=$("di");inp.focus();
          const go=()=>{const v=inp.value.replace(/\D/g,"");if(!v)return;
            if(v===num){L++;round()}else finish(c,L-1,"Le nombre était "+num+", tu as tapé "+v)};
          $("dv").onclick=go;inp.onkeydown=e=>{if(e.key==="Enter")go()};
          inp.addEventListener("paste",e=>e.preventDefault())},ms)};
      round();
    });
  },
  odd(c){
    const PAIRS=[["O","Q"],["b","d"],["p","q"],["6","9"],["M","N"],["E","F"],["8","B"],["C","G"],["5","S"],["V","U"],["m","n"],["2","Z"],["0","D"],["R","P"],["Ж","Х"],["⊂","⊃"],["◐","◑"],["▲","▼"]];
    intro(c,"Commencer",()=>{
      clearGame(); let found=0,end=performance.now()+30000,done=false,iv;
      stage.innerHTML=`<div class="mega num" id="tm" style="font-size:34px">${fr(30,2)}</div><div class="oddgrid notr" id="og"></div><div class="msg"><span class="num" id="oc">0</span> trouvé(s)</div>`;
      const og=$("og");
      const next=()=>{const n=Math.min(3+Math.floor(found/3),8),pr=PAIRS[Math.floor(Math.random()*PAIRS.length)],sw=Math.random()<.5,a=sw?pr[1]:pr[0],b=sw?pr[0]:pr[1],k=Math.floor(Math.random()*n*n);
        og.style.gridTemplateColumns=`repeat(${n},1fr)`;og.style.fontSize=Math.max(16,Math.round(40-n*3))+"px";
        og.innerHTML=Array.from({length:n*n},(_,i)=>`<button class="oddcell" data-k="${i===k?1:0}">${i===k?b:a}</button>`).join("")};
      og.onpointerdown=e=>{const b=e.target.closest(".oddcell");if(!b||done)return;e.preventDefault();
        if(b.dataset.k==="1"){found++;$("oc").textContent=found;next()}else{end-=2000;b.classList.add("miss");stage.classList.add("flash");later(()=>stage.classList.remove("flash"),200)}};
      next();
      iv=setInterval(()=>{const r=Math.max(0,(end-performance.now())/1000);$("tm").textContent=fr(r,2);if(r<=0){clearInterval(iv);done=true;later(()=>finish(c,found),300)}},50);cleanup.push(()=>clearInterval(iv));
    });
  },
  seq25(c){
    intro(c,"Commencer",()=>{
      clearGame(); let nx=1,start=0,iv;
      const nums=Array.from({length:25},(_,i)=>i+1);for(let i=24;i>0;i--){const j=Math.floor(Math.random()*(i+1));[nums[i],nums[j]]=[nums[j],nums[i]]}
      stage.innerHTML=`<div class="mega num" id="tm" style="font-size:34px">${fr(0,2)} s</div><div class="seqgrid">${nums.map(n=>`<button class="seqcell num" data-n="${n}">${n}</button>`).join("")}</div><div class="msg">Prochain : <b class="num" id="nx">1</b></div>`;
      stage.querySelector(".seqgrid").onpointerdown=e=>{const b=e.target.closest(".seqcell");if(!b||b.disabled)return;e.preventDefault();
        if(+b.dataset.n!==nx){b.classList.add("miss");later(()=>b.classList.remove("miss"),180);return}
        if(nx===1){start=performance.now();iv=setInterval(()=>$("tm").textContent=fr((performance.now()-start)/1000,2)+" s",30);cleanup.push(()=>clearInterval(iv))}
        b.disabled=true;b.classList.add("done");nx++;$("nx").textContent=nx>25?"✓":nx;
        if(nx>25){clearInterval(iv);finish(c,(performance.now()-start)/1000)}};
    });
  },
  higher(c){
    const NAMES=["A","2","3","4","5","6","7","8","9","10","J","Q","K"],SUITS=["♠","♥","♦","♣"];
    const draw=()=>({v:1+Math.floor(Math.random()*13),s:SUITS[Math.floor(Math.random()*4)]});
    const card=k=>`<div class="pcard notr ${k.s==="♥"||k.s==="♦"?"red":""}"><span>${NAMES[k.v-1]}</span><b>${k.s}</b></div>`;
    intro(c,"Commencer",()=>{
      clearGame(); let cur=draw(),streak=0,lock=false;
      const show=()=>{stage.innerHTML=`<div class="msg">Série : <b class="num" id="sk">${streak}</b></div><div class="cardrow">${card(cur)}<div class="pcard back notr" id="nxc">?</div></div>
        <div class="row"><button class="btn solid" id="hi">▲ Plus haut</button><button class="btn solid" id="lo">▼ Plus bas</button></div><p class="msg">A = 1, J = 11, Q = 12, K = 13 · une égalité compte comme juste</p>`;
        $("hi").onclick=()=>pick(true);$("lo").onclick=()=>pick(false)};
      const pick=up=>{if(lock)return;lock=true;const n=draw(),ok=up?n.v>=cur.v:n.v<=cur.v;
        $("nxc").outerHTML=card(n);
        if(ok){streak++;$("sk").textContent=streak;later(()=>{cur=n;lock=false;show()},650)}
        else later(()=>finish(c,streak,"La carte était "+NAMES[n.v-1]+" "+n.s),900)};
      show();
    });
  },
  shade(c){
    intro(c,"Commencer",()=>{
      clearGame(); let lvl=0;
      const next=()=>{const n=Math.min(2+Math.floor(lvl/3),8),h=Math.floor(Math.random()*360),s=60+Math.floor(Math.random()*25),l=45+Math.floor(Math.random()*12);
        const d=Math.max(1.2,22*Math.pow(.86,lvl))*(Math.random()<.5?-1:1),k=Math.floor(Math.random()*n*n);
        stage.innerHTML=`<div class="msg">Trouvées : <b class="num">${lvl}</b></div><div class="shadegrid" style="grid-template-columns:repeat(${n},1fr)">${Array.from({length:n*n},(_,i)=>`<button class="shadecell" data-k="${i===k?1:0}" style="background:hsl(${h} ${s}% ${i===k?l+d:l}%)" aria-label="Case ${i+1}"></button>`).join("")}</div>`;
        stage.querySelector(".shadegrid").onpointerdown=e=>{const b=e.target.closest(".shadecell");if(!b)return;e.preventDefault();
          if(b.dataset.k==="1"){lvl++;next()}else{const t=stage.querySelector('[data-k="1"]');t.classList.add("reveal");stage.querySelector(".shadegrid").onpointerdown=null;later(()=>finish(c,lvl),1100)}}};
      next();
    });
  },
  estimate(c){
    intro(c,"Commencer",()=>{
      const W=480,H=320,ROUNDS=10;let r=0,errs=[];
      const round=()=>{clearGame();stage.classList.add("top");const N=8+Math.floor(Math.random()*53);
        stage.innerHTML=`<div class="msg">Manche ${r+1} / ${ROUNDS}</div>${gameCanvas(W,H)}<div id="ea" class="row" style="min-height:52px"></div>`;
        const cv=$("cv"),g=cv.getContext("2d"),dots=[];let guard=0;
        while(dots.length<N&&guard++<5000){const p={x:14+Math.random()*(W-28),y:14+Math.random()*(H-28)};if(dots.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>17))dots.push(p)}
        const n=dots.length;g.fillStyle="#b04cff";g.shadowColor="#b04cff";g.shadowBlur=8;dots.forEach(p=>{g.beginPath();g.arc(p.x,p.y,6,0,7);g.fill()});
        later(()=>{g.clearRect(0,0,W,H);g.shadowBlur=0;g.fillStyle="#a495bd";g.font="22px sans-serif";g.textAlign="center";g.fillText("?",W/2,H/2);
          $("ea").innerHTML=`<input id="eg" class="typeIn num" type="text" inputmode="numeric" autocomplete="off" aria-label="Ta réponse" style="max-width:140px;text-align:center;font-size:24px"><button class="btn solid" id="ev">Valider</button>`;
          const inp=$("eg");inp.focus();
          const go=()=>{const v=parseInt(inp.value,10);if(!(v>=0))return;const e=Math.abs(v-n)/n*100;errs.push(e);r++;
            g.clearRect(0,0,W,H);g.fillStyle="#b04cff";dots.forEach(p=>{g.beginPath();g.arc(p.x,p.y,6,0,7);g.fill()});
            $("ea").innerHTML=`<p class="msg ${e<=10?"good":e>30?"bad":""}">Il y en avait ${n} · écart ${fr(e,1)} %</p><button class="btn solid" id="enx">${r<ROUNDS?"Manche suivante":"Voir mon score"}</button>`;
            const nb=$("enx");nb.focus();nb.onclick=()=>{if(r<ROUNDS)round();else{const m=errs.reduce((a,b)=>a+b,0)/errs.length;finish(c,Math.round(m*10)/10)}}};
          $("ev").onclick=go;inp.onkeydown=e=>{if(e.key==="Enter")go()}},500)};
      round();
    });
  },
  pitch(c){
    intro(c,"Commencer",()=>{
      clearGame(); let lvl=0,cents=100;
      if(!ac()){stage.innerHTML=`<p class="msg bad">Ton navigateur ne peut pas jouer de son.</p>`;return}
      const round=()=>{const f=260+Math.random()*340,up=Math.random()<.5,f2=f*Math.pow(2,(up?1:-1)*cents/1200);let lock=true;
        stage.innerHTML=`<div class="msg">Niveau <b class="num">${lvl+1}</b> · écart ${fr(cents,1)} cents</div><div class="mega" id="pn" style="font-size:44px">♪</div>
          <div class="row"><button class="btn solid" id="p1" disabled>1re note</button><button class="btn solid" id="p2" disabled>2e note</button></div>
          <button class="btn ghost" id="pr">Réécouter</button><p class="msg">Laquelle est la plus aiguë ?</p>`;
        const play=()=>{const a=ac(),t=a.currentTime+.08;tone(f,.45,t);tone(f2,.45,t+.65);
          $("pn").textContent="♪ 1";later(()=>{$("pn").textContent="♪ 2"},650);later(()=>{$("pn").textContent="♪";lock=false;$("p1").disabled=false;$("p2").disabled=false},1250)};
        const ans=second=>{if(lock)return;lock=true;const ok=second===(f2>f);
          if(ok){lvl++;cents=Math.max(1,cents*.8);$("pn").textContent="✓";later(round,500)}
          else{$("pn").textContent="✗";later(()=>finish(c,lvl,"Plus petit écart réussi : "+(lvl?fr(cents/.8,1):"—")+" cents"),700)}};
        $("p1").onclick=()=>ans(false);$("p2").onclick=()=>ans(true);$("pr").onclick=()=>{if(!lock){lock=true;$("p1").disabled=true;$("p2").disabled=true;play()}};
        play()};
      round();
    });
  },
  rhythm(c){
    intro(c,"Commencer",()=>{
      clearGame(); const a=ac();
      stage.innerHTML=`<div class="msg"><span class="mega num" id="rh" style="font-size:34px">0</span> battements · fautes <span class="num" id="rf">0</span> / 3</div>
        <div class="beat" id="bt">4</div><p class="msg" id="rs">Écoute le tempo… tu commences à « Go ».</p>`;
      const bt=$("bt"),WIN=110,LEAD=4;let iv0=600,beats=[],t=performance.now()+700,hits=0,faults=0,over=false,raf,sched=0;
      for(let i=0;i<4000&&beats.length<4000;i++){beats.push({t,hit:false,miss:false});t+=iv0;iv0=Math.max(300,iv0*.993)}
      const audioOff=a?a.currentTime*1000-performance.now():0;
      const fault=()=>{faults++;$("rf").textContent=faults;bt.classList.add("bad");later(()=>bt.classList.remove("bad"),180);if(faults>=3&&!over){over=true;later(()=>finish(c,hits),500)}};
      const loop=now=>{if(over)return;
        while(sched<beats.length&&beats[sched].t<now+150){if(a)tone(sched<LEAD?660:sched%4===0?990:880,.06,(beats[sched].t+audioOff)/1000,"square",.12);sched++}
        for(let i=LEAD;i<beats.length;i++){const b=beats[i];if(b.t>now)break;if(!b.hit&&!b.miss&&now-b.t>WIN){b.miss=true;fault()}}
        let k=0;while(k<beats.length-1&&beats[k+1].t<=now)k++;
        const ph=Math.max(0,1-(now-beats[k].t)/250);bt.style.transform=`scale(${1+ph*.18})`;bt.style.boxShadow=`0 0 ${10+ph*50}px var(--neon)`;
        if(beats[k].t<=now)bt.textContent=k<LEAD?(k<LEAD-1?String(LEAD-1-k):"Go"):"";
        raf=requestAnimationFrame(loop)};
      raf=requestAnimationFrame(loop);cleanup.push(()=>{over=true;cancelAnimationFrame(raf)});
      const tap=()=>{if(over)return;const now=performance.now();let best=null,bd=1e9;
        for(let i=LEAD;i<beats.length;i++){const d=Math.abs(beats[i].t-now);if(d<bd){bd=d;best=beats[i]}if(beats[i].t>now+1000)break}
        if(best&&bd<=WIN&&!best.hit&&!best.miss){best.hit=true;hits++;$("rh").textContent=hits;bt.classList.add("good");later(()=>bt.classList.remove("good"),120)}
        else if(now>beats[LEAD].t-WIN)fault()};
      stage.onpointerdown=e=>{if(e.target.closest("button"))return;e.preventDefault();tap()};
      const kd=e=>{if(e.code==="Space"){e.preventDefault();if(!e.repeat)tap()}};document.addEventListener("keydown",kd);cleanup.push(()=>document.removeEventListener("keydown",kd));
    });
  },
  stars(c){
    intro(c,"Commencer",()=>{
      clearGame(); stage.classList.add("top");
      const W=400,H=560;
      stage.innerHTML=`<div class="msg"><span class="mega num" id="sc" style="font-size:34px">0</span> étoiles · ratées <span class="num" id="sm">0</span> / 3</div>${gameCanvas(W,H,"max-height:64vh")}`;
      const cv=$("cv"),g=cv.getContext("2d");let stars=[],caught=0,missed=0,over=false,raf,last=performance.now(),t0=last,nextSpawn=t0+400,pops=[];
      const star=(x,y,r,col)=>{g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;g.lineTo(x+rr*Math.cos(a),y+rr*Math.sin(a))}g.closePath();g.fillStyle=col;g.shadowColor=col;g.shadowBlur=14;g.fill();g.shadowBlur=0};
      const loop=now=>{const dt=Math.min(50,now-last)/1000;last=now;const el=(now-t0)/1000;
        if(!over&&now>=nextSpawn){stars.push({x:30+Math.random()*(W-60),y:-20,v:120+el*9+Math.random()*60});nextSpawn=now+Math.max(260,900-el*22)}
        g.clearRect(0,0,W,H);g.fillStyle="rgba(255,107,138,.35)";g.fillRect(0,H-4,W,4);
        stars.forEach(s=>{if(!over)s.y+=s.v*dt;star(s.x,s.y,20,"#ffc94a")});
        const fell=stars.filter(s=>s.y>H+10);if(fell.length&&!over){missed+=fell.length;$("sm").textContent=Math.min(3,missed);stage.classList.add("flash");later(()=>stage.classList.remove("flash"),200);
          if(missed>=3){over=true;later(()=>finish(c,caught),700)}}
        stars=stars.filter(s=>s.y<=H+10);
        pops=pops.filter(p=>(p.a-=dt*2.5)>0);pops.forEach(p=>{g.globalAlpha=p.a;star(p.x,p.y,20+(1-p.a)*20,"#fff");g.globalAlpha=1});
        raf=requestAnimationFrame(loop)};
      raf=requestAnimationFrame(loop);cleanup.push(()=>cancelAnimationFrame(raf));
      cv.onpointerdown=e=>{e.preventDefault();if(over)return;const p=cvPoint(cv,e);let best=-1,bd=34;
        stars.forEach((s,i)=>{const d=Math.hypot(s.x-p.x,s.y-p.y);if(d<bd){bd=d;best=i}});
        if(best>=0){const s=stars.splice(best,1)[0];pops.push({x:s.x,y:s.y,a:1});caught++;$("sc").textContent=caught}};
    });
  },
  mole(c){
    intro(c,"Commencer",()=>{
      clearGame(); let score=0,end=performance.now()+30000,lit=-1,litUntil=0,done=false,iv,hits=0;
      stage.innerHTML=`<div class="mega num" id="tm" style="font-size:34px">${fr(30,2)}</div><div class="molegrid">${Array.from({length:9},(_,i)=>`<button class="molecell" data-i="${i}" aria-label="Case ${i+1}"></button>`).join("")}</div><div class="msg">Score : <b class="num" id="sc">0</b></div>`;
      const cells=[...stage.querySelectorAll(".molecell")];
      const light=()=>{if(lit>=0)cells[lit].classList.remove("on");let n;do{n=Math.floor(Math.random()*9)}while(n===lit);lit=n;cells[n].classList.add("on");litUntil=performance.now()+Math.max(420,1100-hits*22)};
      stage.querySelector(".molegrid").onpointerdown=e=>{const b=e.target.closest(".molecell");if(!b||done)return;e.preventDefault();
        if(+b.dataset.i===lit){score++;hits++;b.classList.add("hit");later(()=>b.classList.remove("hit"),120);light()}
        else{score--;b.classList.add("miss");later(()=>b.classList.remove("miss"),150)}
        $("sc").textContent=score};
      light();
      iv=setInterval(()=>{const now=performance.now(),r=Math.max(0,(end-now)/1000);$("tm").textContent=fr(r,2);
        if(now>litUntil&&!done)light();
        if(r<=0){clearInterval(iv);done=true;if(lit>=0)cells[lit].classList.remove("on");later(()=>finish(c,Math.max(0,score)),300)}},30);cleanup.push(()=>clearInterval(iv));
    });
  },
  runner(c){
    intro(c,"Commencer",()=>{
      clearGame(); let n=0,start=0,done=false,raf,iv,last=performance.now();
      stage.innerHTML=`<div class="msg" style="position:absolute;top:10px;left:0;right:0;pointer-events:none"><span class="num" id="tm">${fr(20,2)}</span> · <b class="num" id="cn">0</b> prise(s)</div><button class="runbtn" id="rb">Attrape-moi !</button>`;
      const rb=$("rb");let x=0,y=0,tx=0,ty=0;
      const box=()=>{const r=stage.getBoundingClientRect();return {w:r.width-rb.offsetWidth-20,h:r.height-rb.offsetHeight-60}};
      const target=()=>{const b=box();tx=10+Math.random()*Math.max(10,b.w);ty=50+Math.random()*Math.max(10,b.h)};
      {const b=box();x=10+b.w/2;y=50+b.h/2}target();
      const loop=now=>{const dt=Math.min(50,now-last)/1000;last=now;
        if(!done&&start){const sp=180+n*35,dx=tx-x,dy=ty-y,d=Math.hypot(dx,dy);if(d<sp*dt){x=tx;y=ty;target()}else{x+=dx/d*sp*dt;y+=dy/d*sp*dt}}
        rb.style.left=x+"px";rb.style.top=y+"px";raf=requestAnimationFrame(loop)};
      raf=requestAnimationFrame(loop);cleanup.push(()=>cancelAnimationFrame(raf));
      rb.onpointerdown=e=>{e.preventDefault();e.stopPropagation();if(done)return;
        if(!start){start=performance.now();iv=setInterval(()=>{const r=Math.max(0,20-(performance.now()-start)/1000);$("tm").textContent=fr(r,2);
          if(r<=0){clearInterval(iv);done=true;later(()=>finish(c,n),300)}},30);cleanup.push(()=>clearInterval(iv));return}
        n++;$("cn").textContent=n;const b=box();x=10+Math.random()*Math.max(10,b.w);y=50+Math.random()*Math.max(10,b.h);target()};
    });
  },
  tightrope(c){
    intro(c,"Commencer",()=>{
      clearGame(); stage.classList.add("top");
      const W=600,H=360,HALF=230,CX=300,CY=220;
      stage.innerHTML=`<div class="mega num" id="tm" style="font-size:34px">${fr(0,2)} s</div>${gameCanvas(W,H)}<p class="msg" id="st">Garde le doigt ou la souris sur la zone et glisse à gauche ou à droite pour incliner la barre.</p>`;
      const cv=$("cv"),g=cv.getContext("2d");let ang=0,targetAng=0,pos=0,vel=0,wind=0,t0=0,over=false,raf,last=performance.now(),started=false;
      const draw=()=>{g.clearRect(0,0,W,H);g.save();g.translate(CX,CY);g.rotate(ang);
        g.strokeStyle="#b04cff";g.lineWidth=8;g.lineCap="round";g.shadowColor="#b04cff";g.shadowBlur=16;g.beginPath();g.moveTo(-HALF,0);g.lineTo(HALF,0);g.stroke();
        g.fillStyle="#ffc94a";g.shadowColor="#ffc94a";g.beginPath();g.arc(pos,-18,14,0,7);g.fill();g.restore();g.shadowBlur=0;
        g.fillStyle="#a495bd";g.beginPath();g.moveTo(CX-14,CY+40);g.lineTo(CX+14,CY+40);g.lineTo(CX,CY+8);g.fill();
        if(started&&!over){g.fillStyle="rgba(95,208,255,.8)";g.font="16px sans-serif";g.textAlign="center";g.fillText(wind>0?"→".repeat(Math.min(5,1+Math.floor(Math.abs(wind)/40))):"←".repeat(Math.min(5,1+Math.floor(Math.abs(wind)/40))),CX,40)}};
      const loop=now=>{const dt=Math.min(40,now-last)/1000;last=now;
        if(started&&!over){const el=(now-t0)/1000;ang+=(targetAng-ang)*Math.min(1,dt*10);
          wind+=(Math.random()-.5)*dt*(120+el*12);wind*=.995;const wmax=30+el*7;if(Math.abs(wind)>wmax)wind=Math.sign(wind)*wmax;
          vel+=(900*Math.sin(ang)+wind+pos*.9)*dt;vel*=.995;pos+=vel*dt;
          $("tm").textContent=fr(el,2)+" s";
          if(Math.abs(pos)>HALF){over=true;const s=el;$("st").textContent="La balle est tombée !";$("st").className="msg bad";later(()=>finish(c,Math.round(s*100)/100),900)}}
        draw();raf=requestAnimationFrame(loop)};
      raf=requestAnimationFrame(loop);cleanup.push(()=>{over=true;cancelAnimationFrame(raf)});
      const aim=e=>{const p=cvPoint(cv,e);targetAng=Math.max(-.45,Math.min(.45,(p.x-CX)/CX*.45))};
      cv.onpointerdown=e=>{e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}aim(e);if(!started){started=true;t0=performance.now();vel=(Math.random()-.5)*20}};
      cv.onpointermove=e=>{if(started)aim(e)};
    });
  },
  pairs(c){
    const SYM=[["★","#ffc94a"],["●","#5fd0ff"],["▲","#5ee6a8"],["■","#ff6b8a"],["◆","#b04cff"],["♥","#ff4fa3"],["♣","#9dff4f"],["☀","#ff9a3d"]];
    intro(c,"Commencer",()=>{
      clearGame(); const deck=[...Array(8).keys(),...Array(8).keys()];for(let i=15;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}
      let open=[],found=0,start=0,iv,lock=false,tries=0;
      stage.innerHTML=`<div class="mega num" id="tm" style="font-size:34px">${fr(0,2)} s</div><div class="pairgrid notr">${deck.map((k,i)=>`<button class="paircard" data-i="${i}"><span style="color:${SYM[k][1]}">${SYM[k][0]}</span></button>`).join("")}</div><div class="msg">Paires : <b class="num" id="pf">0</b> / 8</div>`;
      stage.querySelector(".pairgrid").onpointerdown=e=>{const b=e.target.closest(".paircard");if(!b||lock||b.classList.contains("up"))return;e.preventDefault();
        if(!start){start=performance.now();iv=setInterval(()=>$("tm").textContent=fr((performance.now()-start)/1000,2)+" s",30);cleanup.push(()=>clearInterval(iv))}
        b.classList.add("up");open.push(b);
        if(open.length===2){tries++;const [a,d]=open;open=[];
          if(deck[a.dataset.i]===deck[d.dataset.i]){a.classList.add("ok");d.classList.add("ok");found++;$("pf").textContent=found;
            if(found===8){clearInterval(iv);const s=(performance.now()-start)/1000;later(()=>finish(c,s,tries+" coups"),400)}}
          else{lock=true;later(()=>{a.classList.remove("up");d.classList.remove("up");lock=false},600)}}};
    });
  },
  maze(c){
    intro(c,"Commencer",()=>{
      clearGame(); stage.classList.add("top");
      const N=12,CS=34,W=N*CS+8,H=W;const walls=Array.from({length:N*N},()=>[1,1,1,1]),seen=new Uint8Array(N*N);
      const stack=[0];seen[0]=1;
      while(stack.length){const cur=stack[stack.length-1],x=cur%N,y=Math.floor(cur/N),nb=[];
        if(y>0&&!seen[cur-N])nb.push([cur-N,0,2]);if(x<N-1&&!seen[cur+1])nb.push([cur+1,1,3]);if(y<N-1&&!seen[cur+N])nb.push([cur+N,2,0]);if(x>0&&!seen[cur-1])nb.push([cur-1,3,1]);
        if(!nb.length){stack.pop();continue}const [n,w1,w2]=nb[Math.floor(Math.random()*nb.length)];walls[cur][w1]=0;walls[n][w2]=0;seen[n]=1;stack.push(n)}
      let px=0,py=0,start=0,iv,done=false;const trail=[[0,0]];
      stage.innerHTML=`<div class="mega num" id="tm" style="font-size:32px">${fr(0,2)} s</div>${gameCanvas(W,H,"max-height:52vh")}
        <div class="dpad"><button data-d="0" aria-label="Haut">▲</button><button data-d="3" aria-label="Gauche">◀</button><button data-d="2" aria-label="Bas">▼</button><button data-d="1" aria-label="Droite">▶</button></div>`;
      const cv=$("cv"),g=cv.getContext("2d");
      const draw=()=>{g.clearRect(0,0,W,H);g.save();g.translate(4,4);
        g.fillStyle="rgba(255,201,74,.25)";g.fillRect((N-1)*CS+3,(N-1)*CS+3,CS-6,CS-6);
        g.strokeStyle="rgba(176,76,255,.35)";g.lineWidth=4;g.lineCap="round";g.beginPath();trail.forEach(([x,y],i)=>{const X=x*CS+CS/2,Y=y*CS+CS/2;i?g.lineTo(X,Y):g.moveTo(X,Y)});g.stroke();
        g.strokeStyle="#b04cff";g.lineWidth=3;g.shadowColor="#b04cff";g.shadowBlur=6;g.beginPath();
        for(let i=0;i<N*N;i++){const x=(i%N)*CS,y=Math.floor(i/N)*CS,w=walls[i];
          if(w[0]){g.moveTo(x,y);g.lineTo(x+CS,y)}if(w[1]){g.moveTo(x+CS,y);g.lineTo(x+CS,y+CS)}if(w[2]){g.moveTo(x,y+CS);g.lineTo(x+CS,y+CS)}if(w[3]){g.moveTo(x,y);g.lineTo(x,y+CS)}}
        g.stroke();g.shadowBlur=0;g.fillStyle="#5ee6a8";g.beginPath();g.arc(px*CS+CS/2,py*CS+CS/2,CS*.3,0,7);g.fill();g.restore()};
      const move=d=>{if(done)return;const i=py*N+px;if(walls[i][d])return;
        if(!start){start=performance.now();iv=setInterval(()=>$("tm").textContent=fr((performance.now()-start)/1000,2)+" s",30);cleanup.push(()=>clearInterval(iv))}
        if(d===0)py--;else if(d===1)px++;else if(d===2)py++;else px--;
        const lt=trail[trail.length-2];if(lt&&lt[0]===px&&lt[1]===py)trail.pop();else trail.push([px,py]);draw();
        if(px===N-1&&py===N-1){done=true;clearInterval(iv);later(()=>finish(c,(performance.now()-start)/1000),250)}};
      draw();
      stage.querySelector(".dpad").onpointerdown=e=>{const b=e.target.closest("[data-d]");if(!b)return;e.preventDefault();move(+b.dataset.d)};
      const K={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3,KeyW:0,KeyD:1,KeyS:2,KeyA:3,KeyZ:0,KeyQ:3};
      const kd=e=>{if(K[e.code]!=null){e.preventDefault();move(K[e.code])}};document.addEventListener("keydown",kd);cleanup.push(()=>document.removeEventListener("keydown",kd));
      let sx=0,sy=0;cv.onpointerdown=e=>{sx=e.clientX;sy=e.clientY};cv.onpointerup=e=>{const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<20)return;move(Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0))};
    });
  },
  truefalse(c){
    intro(c,"Commencer",()=>{
      clearGame(); let score=0,truth=true,start=0,iv,done=false;
      const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
      stage.innerHTML=`<div class="mega num" id="tm" style="font-size:34px">${fr(30,2)}</div><div class="mega num notr" id="eq" style="font-size:clamp(30px,8vw,60px)">…</div>
        <div class="row"><button class="btn solid tfbtn good" id="tv">Vrai</button><button class="btn solid tfbtn bad" id="tf">Faux</button></div>
        <p class="msg">Score : <b class="num" id="sc">0</b> · ou touches ← et →</p>`;
      const next=()=>{const t=rnd(0,2);let a,b,r,q;
        if(t===0){a=rnd(2,50);b=rnd(2,50);r=a+b;q=a+" + "+b}else if(t===1){a=rnd(10,90);b=rnd(2,a);r=a-b;q=a+" − "+b}else{a=rnd(2,12);b=rnd(2,12);r=a*b;q=a+" × "+b}
        truth=Math.random()<.5;let shown=r;if(!truth){const k=rnd(0,2);shown=k===0?r+(Math.random()<.5?-1:1)*rnd(1,3):k===1?r+(Math.random()<.5?-10:10):(t===2?r+(Math.random()<.5?-a:a):r+(Math.random()<.5?-2:2));if(shown===r||shown<0)shown=r+1}
        $("eq").textContent=q+" = "+shown;$("eq").style.color=""};
      const ans=v=>{if(done)return;
        if(!start){start=performance.now();iv=setInterval(()=>{const r=Math.max(0,30-(performance.now()-start)/1000);$("tm").textContent=fr(r,2);if(r<=0){clearInterval(iv);done=true;later(()=>finish(c,Math.max(0,score)),300)}},50);cleanup.push(()=>clearInterval(iv))}
        const ok=v===truth;score+=ok?1:-1;$("sc").textContent=score;if(!ok){stage.classList.add("flash");later(()=>stage.classList.remove("flash"),180)}next()};
      $("tv").onclick=()=>ans(true);$("tf").onclick=()=>ans(false);
      const kd=e=>{if(e.code==="ArrowLeft"){e.preventDefault();ans(true)}else if(e.code==="ArrowRight"){e.preventDefault();ans(false)}};document.addEventListener("keydown",kd);cleanup.push(()=>document.removeEventListener("keydown",kd));
      next();
    });
  },
  slide(c){
    intro(c,"Commencer",()=>{
      clearGame(); let b=[1,2,3,4,5,6,7,8,0],moves=0,start=0,iv,done=false;
      const nbrs=i=>[i-3,i+3,i%3?i-1:-1,i%3<2?i+1:-1].filter(j=>j>=0&&j<9);
      let e0=8,prev=-1;for(let k=0;k<160;k++){const ns=nbrs(e0).filter(j=>j!==prev);const j=ns[Math.floor(Math.random()*ns.length)];b[e0]=b[j];b[j]=0;prev=e0;e0=j}
      if(b.join()==="1,2,3,4,5,6,7,8,0"){[b[0],b[1]]=[b[1],b[0]];[b[3],b[4]]=[b[4],b[3]]}
      stage.innerHTML=`<div class="mega num" id="tm" style="font-size:34px">${fr(0,2)} s</div><div class="slidegrid" id="sg"></div><div class="msg"><b class="num" id="mv">0</b> coups · ou flèches du clavier</div>`;
      const sg=$("sg");
      const render=()=>{sg.innerHTML=b.map((v,i)=>v?`<button class="slidecell num ${v===i+1?"ok":""}" data-i="${i}">${v}</button>`:`<div class="slidecell empty"></div>`).join("")};
      const tryMove=i=>{if(done)return;const e=b.indexOf(0);if(!nbrs(e).includes(i))return;
        if(!start){start=performance.now();iv=setInterval(()=>$("tm").textContent=fr((performance.now()-start)/1000,2)+" s",30);cleanup.push(()=>clearInterval(iv))}
        b[e]=b[i];b[i]=0;moves++;$("mv").textContent=moves;render();
        if(b.join()==="1,2,3,4,5,6,7,8,0"){done=true;clearInterval(iv);later(()=>finish(c,(performance.now()-start)/1000,moves+" coups"),300)}};
      sg.onpointerdown=e=>{const x=e.target.closest("[data-i]");if(!x)return;e.preventDefault();tryMove(+x.dataset.i)};
      const kd=e=>{const em=b.indexOf(0),m={ArrowUp:em+3,ArrowDown:em-3,ArrowLeft:em%3<2?em+1:-1,ArrowRight:em%3?em-1:-1}[e.code];if(m!=null){e.preventDefault();if(m>=0&&m<9)tryMove(m)}};
      document.addEventListener("keydown",kd);cleanup.push(()=>document.removeEventListener("keydown",kd));
      render();
    });
  },
  duration(c){
    intro(c,"Commencer",()=>{
      const ROUNDS=5;let r=0,errs=[];
      const round=()=>{clearGame();const dur=1.5+Math.random()*6.5;
        stage.innerHTML=`<div class="msg">Manche ${r+1} / ${ROUNDS}</div><div class="lamp" id="lp"></div><div id="da" class="row" style="min-height:52px"><p class="msg">Prépare-toi…</p></div>`;
        later(()=>{$("lp").classList.add("on");$("da").innerHTML=`<p class="msg">…</p>`;if(ac())tone(440,dur,null,"sine",.08);
          later(()=>{$("lp").classList.remove("on");
            $("da").innerHTML=`<input id="dg" class="typeIn num" type="text" inputmode="decimal" autocomplete="off" aria-label="Ta réponse" placeholder="s" style="max-width:120px;text-align:center;font-size:24px"><button class="btn solid" id="dv">Valider</button>`;
            const inp=$("dg");inp.focus();
            const go=()=>{const v=parseFloat(inp.value.replace(",","."));if(!(v>=0))return;const e=Math.abs(v-dur)/dur*100;errs.push(e);r++;
              $("da").innerHTML=`<p class="msg ${e<=10?"good":e>30?"bad":""}">Ça durait ${fr(dur,2)} s · écart ${fr(e,1)} %</p><button class="btn solid" id="dnx">${r<ROUNDS?"Manche suivante":"Voir mon score"}</button>`;
              const nb=$("dnx");nb.focus();nb.onclick=()=>{if(r<ROUNDS)round();else finish(c,Math.round(errs.reduce((a,b)=>a+b,0)/errs.length*10)/10)}};
            $("dv").onclick=go;inp.onkeydown=e=>{if(e.key==="Enter")go()}},dur*1000)},1200+Math.random()*1200)};
      round();
    });
  },
  angle(c){
    const TARGETS=[90,45,135,30,60];
    intro(c,"Commencer",()=>{
      let r=0,errs=[];const W=520,H=360,CX=260,CY=300;
      const round=()=>{clearGame();stage.classList.add("top");const tgt=TARGETS[r];let p1=null,done=false;
        stage.innerHTML=`<div class="msg">Manche ${r+1} / ${TARGETS.length}</div><div class="mega num" style="font-size:44px">${tgt}°</div>${gameCanvas(W,H)}<div id="aa" class="row" style="min-height:52px"><p class="msg" id="as">Trace une ligne vers le haut à partir du point, à ${tgt}° de la ligne de base.</p></div>`;
        const cv=$("cv"),g=cv.getContext("2d");
        const base=()=>{g.clearRect(0,0,W,H);g.strokeStyle="#a495bd";g.lineWidth=3;g.beginPath();g.moveTo(CX,CY);g.lineTo(W-20,CY);g.stroke();
          g.fillStyle="#fff";g.beginPath();g.arc(CX,CY,6,0,7);g.fill()};
        const ray=(deg,col,len,dash)=>{const a=-deg*Math.PI/180;g.setLineDash(dash||[]);g.strokeStyle=col;g.lineWidth=4;g.shadowColor=col;g.shadowBlur=dash?0:12;g.beginPath();g.moveTo(CX,CY);g.lineTo(CX+len*Math.cos(a),CY+len*Math.sin(a));g.stroke();g.setLineDash([]);g.shadowBlur=0};
        const angOf=p=>{let a=Math.atan2(CY-p.y,p.x-CX)*180/Math.PI;return a};
        base();
        cv.onpointerdown=e=>{if(done)return;e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}p1=cvPoint(cv,e);base();ray(angOf(p1),"#b04cff",Math.hypot(p1.x-CX,p1.y-CY))};
        cv.onpointermove=e=>{if(!p1||done)return;p1=cvPoint(cv,e);base();ray(angOf(p1),"#b04cff",Math.hypot(p1.x-CX,p1.y-CY))};
        cv.onpointerup=e=>{if(!p1||done)return;const p=cvPoint(cv,e),len=Math.hypot(p.x-CX,p.y-CY),a=angOf(p);p1=null;
          if(len<90||a<0||a>180){base();$("as").textContent="Trace une ligne plus longue, vers le haut, en partant du point.";$("as").className="msg bad";return}
          done=true;const err=Math.abs(a-tgt);errs.push(err);r++;base();ray(tgt,"rgba(255,255,255,.6)",220,[6,8]);ray(a,err<=2?"#5ee6a8":err<=6?"#ffc94a":"#ff6b8a",len);
          $("aa").innerHTML=`<p class="msg">Ton angle : ${fr(a,1)}° · écart ${fr(err,1)}°</p><button class="btn solid" id="anx">${r<TARGETS.length?"Manche suivante":"Voir mon score"}</button>`;
          const nb=$("anx");nb.focus();nb.onclick=()=>{if(r<TARGETS.length)round();else finish(c,Math.round(errs.reduce((x,y)=>x+y,0)/errs.length*10)/10)}};
      };
      round();
    });
  },
  faces(c){
    const POOL=[..."😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😋😛😜🤪😝🤑🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬😌😔😪🤤😴😷🤒🤕🤢🤮🥵🥶🥴😵🤯🤠🥳😎🤓🧐😕😟🙁😮😯😲😳🥺😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠🤬"].filter(s=>s.trim());
    intro(c,"Commencer",()=>{
      let lvl=1;
      const round=()=>{clearGame();const k=lvl+2,sh=[...POOL].sort(()=>Math.random()-.5),show=sh.slice(0,k),others=sh.slice(k,k+Math.max(4,k));
        stage.innerHTML=`<div class="msg">Niveau ${lvl} · retiens ${k} visages</div><div class="facegrid notr">${show.map(f=>`<span class="face">${f}</span>`).join("")}</div><div class="barwrap"><div class="bar" id="bar"></div></div>`;
        const ms=900+k*700,bar=$("bar");bar.style.transition=`width ${ms}ms linear`;requestAnimationFrame(()=>requestAnimationFrame(()=>bar.style.width="0%"));
        later(()=>{const all=[...show,...others].sort(()=>Math.random()-.5);let got=0;
          stage.innerHTML=`<div class="msg">Touche les ${k} visages que tu as vus · <b class="num" id="fg">0</b> / ${k}</div><div class="facegrid pick notr">${all.map(f=>`<button class="face" data-f="${f}">${f}</button>`).join("")}</div>`;
          stage.querySelector(".facegrid").onpointerdown=e=>{const b=e.target.closest(".face");if(!b||b.disabled)return;e.preventDefault();b.disabled=true;
            if(show.includes(b.dataset.f)){b.classList.add("ok");got++;$("fg").textContent=got;if(got===k){lvl++;later(round,500)}}
            else{b.classList.add("ko");stage.querySelectorAll(".face").forEach(x=>{if(show.includes(x.dataset.f)&&!x.disabled)x.classList.add("reveal")});stage.querySelector(".facegrid").onpointerdown=null;later(()=>finish(c,lvl-1),1300)}}},ms)};
      round();
    });
  },
  steadyclick(c){
    intro(c,"Commencer",()=>{
      clearGame(); const N=30,ts=[];
      stage.innerHTML=`<div class="msg"><b class="num" id="cn">0</b> / ${N} clics</div><button class="clickbtn" id="cb">Clique</button><div class="ticks" id="tk"></div><p class="msg">Garde le même rythme du début à la fin.</p>`;
      const cb=$("cb"),tk=$("tk");
      cb.onpointerdown=e=>{e.preventDefault();if(ts.length>=N)return;ts.push(performance.now());$("cn").textContent=ts.length;
        if(ts.length>1){const iv=ts[ts.length-1]-ts[ts.length-2],d=document.createElement("span");d.style.height=Math.min(60,6+iv/20)+"px";tk.appendChild(d)}
        cb.classList.add("hit");later(()=>cb.classList.remove("hit"),70);
        if(ts.length===N){const ivs=ts.slice(1).map((t,i)=>t-ts[i]),m=ivs.reduce((a,b)=>a+b,0)/ivs.length,sd=Math.sqrt(ivs.reduce((a,b)=>a+(b-m)*(b-m),0)/ivs.length);
          const sc=Math.max(0,Math.min(100,100*(1-sd/m)));later(()=>finish(c,Math.round(sc*10)/10,"Tempo moyen : "+Math.round(60000/m)+" clics par minute"),300)}};
    });
  }
};

window.addEventListener("wurlang",()=>{feedSig="";const mp=$("modPanel");if(mp)mp.dataset.sig="";renderAll();if(currentTab==="ligue")renderLeague()});
renderLegal(); rebuildChallenges(); renderAll(); DB.init();
})();
