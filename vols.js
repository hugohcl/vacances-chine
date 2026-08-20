/* Le prix des vols, en un seul endroit.
   index.html et routes.html montent ce panneau dans un de leurs onglets ;
   vols.html en fait une page à part entière. Un seul code source pour les trois.

   Les couleurs viennent des variables CSS de la page hôte : le panneau
   prend l'accent cinabre de routes.html comme l'indigo d'index.html. */

var VOLS = (function () {
"use strict";

/* L'open-jaw en tete : c'est le billet qu'on achetera vraiment, les autres
   lignes ne sont la que pour situer son prix. */
var COL = { openjaw:"#1D4ED8", aller:"#E24A3C", retour:"#0F766E", ar_pekin:"#7C3AED", ar_kunming:"#B45309" };
var ORDER = ["openjaw","aller","retour","ar_pekin","ar_kunming"];
var DEPART = new Date(Date.UTC(2026,10,13));
var MOIS = ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];

var CSS = ''
+ '.vl-facts{display:flex;gap:clamp(14px,2.2vw,30px);flex-wrap:wrap;margin-bottom:20px}'
+ '.vl-facts b{display:block;font-size:clamp(23px,2.9vw,33px);font-weight:700;line-height:1;letter-spacing:-.03em;'
+   'font-variant-numeric:tabular-nums lining-nums}'
+ '.vl-facts span{display:block;margin-top:6px;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;'
+   'color:var(--tx2);font-weight:700}'
+ '.vl-win{background:var(--card);border:1px solid var(--line);border-radius:var(--r,18px);padding:20px;margin-bottom:20px}'
+ '.vl-win.now{border-color:var(--zhu);box-shadow:inset 3px 0 0 var(--zhu)}'
+ '.vl-win h3{font-size:17px;margin:6px 0 6px;font-weight:700;letter-spacing:-.02em}'
+ '.vl-win p{margin:0;color:var(--tx2);font-size:14.5px}'
+ '.vl-bar{position:relative;height:6px;background:var(--line);border-radius:100px;margin:16px 0 8px}'
+ '.vl-bar .z{position:absolute;top:0;bottom:0;background:var(--zhu);opacity:.28;border-radius:100px}'
+ '.vl-bar .c{position:absolute;top:-5px;width:3px;height:16px;background:var(--zhu);border-radius:2px}'
+ '.vl-barlab{display:flex;justify-content:space-between;font-size:10.5px;color:var(--tx2);letter-spacing:.1em}'
+ '.vl-chart{background:var(--card);border:1px solid var(--line);border-radius:var(--r,18px);padding:clamp(14px,2vw,22px)}'
+ '.vl-chart svg{display:block;width:100%;height:clamp(250px,38vh,380px)}'
+ '.vl-grid{stroke:var(--tx);stroke-opacity:.09;stroke-width:1;vector-effect:non-scaling-stroke}'
+ '.vl-ax{fill:var(--tx2);font-size:11px}'
+ '.vl-ln{fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}'
+ '.vl-dot{stroke:var(--card);stroke-width:1.6}'
+ '.vl-leg{display:flex;gap:16px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1px solid var(--line)}'
+ '.vl-leg button{display:flex;align-items:center;gap:7px;font-size:13.5px;color:var(--tx2);'
+   'background:none;border:0;padding:0;cursor:pointer;font-family:inherit}'
+ '.vl-leg button[aria-pressed="false"]{opacity:.38}'
+ '.vl-leg i{width:11px;height:11px;border-radius:3px;display:block;flex:none}'
+ '.vl-tbl{width:100%;border-collapse:collapse;margin-top:24px;font-size:14.5px}'
+ '.vl-tbl th{text-align:left;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx2);'
+   'font-weight:700;padding:0 12px 10px 0;border-bottom:1px solid var(--line);white-space:nowrap}'
+ '.vl-tbl td{padding:13px 12px 13px 0;border-bottom:1px solid var(--line);vertical-align:top}'
+ '.vl-tbl .rt{font-weight:700}'
+ '.vl-tbl .rt small{display:block;font-weight:400;color:var(--tx2);font-size:12.5px;line-height:1.4;'
+   'margin-top:2px;max-width:34ch}'
+ '.vl-tbl .p{font-weight:700;font-size:16.5px;white-space:nowrap;font-variant-numeric:tabular-nums lining-nums}'
+ '.vl-tbl .n{font-variant-numeric:tabular-nums lining-nums}'
+ '.vl-dn{color:#15803D;font-weight:700;white-space:nowrap}'
+ '.vl-up{color:#C2410C;font-weight:700;white-space:nowrap}'
+ '.vl-fl{color:var(--tx2);white-space:nowrap}'
+ '@media (prefers-color-scheme:dark){.vl-dn{color:#4ADE80}.vl-up{color:#FB923C}}'
+ ':root[data-theme="dark"] .vl-dn{color:#4ADE80}:root[data-theme="dark"] .vl-up{color:#FB923C}'
+ ':root[data-theme="light"] .vl-dn{color:#15803D}:root[data-theme="light"] .vl-up{color:#C2410C}'
+ '.vl-notes{margin:24px 0 0;padding-left:19px;color:var(--tx2);font-size:14.5px;line-height:1.62}'
+ '.vl-notes li{margin-bottom:9px}.vl-notes b{color:var(--tx)}'
+ '.vl-empty{background:var(--card);border:1px solid var(--line);border-radius:var(--r,18px);padding:clamp(20px,3vw,30px);margin-bottom:20px}'
+ '.vl-empty h3{font-size:18px;margin:6px 0 8px;font-weight:700}'
+ '.vl-empty ol{margin:12px 0 0;padding-left:20px;color:var(--tx2);font-size:14.5px;line-height:1.62}'
+ '.vl-empty li{margin-bottom:8px}'
+ '.vl-maj{margin-top:20px;color:var(--tx2);font-size:13px}'
+ '@media (max-width:720px){.vl-tbl thead{display:none}.vl-tbl td{display:block;padding:4px 0;border:0}'
+   '.vl-tbl tr{display:block;padding:14px 0;border-bottom:1px solid var(--line)}}';

function el(t,c,x){ var e=document.createElement(t); if(c)e.className=c; if(x!=null)e.textContent=x; return e; }
function mk(t,a,x){ var e=document.createElementNS("http://www.w3.org/2000/svg",t);
  for(var k in a) e.setAttribute(k,a[k]); if(x!=null)e.textContent=x; return e; }
function eur(n){ return Math.round(n).toLocaleString("fr-FR")+" €"; }
function parse(d){ var p=d.split("-"); return new Date(Date.UTC(+p[0],+p[1]-1,+p[2])); }
function fmt(d){ var x=parse(d); return x.getUTCDate()+" "+MOIS[x.getUTCMonth()]; }
function days(a,b){ return Math.round((b-a)/86400000); }

function styles(){
  if(document.getElementById("vl-css")) return;
  var s=document.createElement("style"); s.id="vl-css"; s.textContent=CSS;
  document.head.appendChild(s);
}

function mount(host, opts){
  opts = opts || {};
  if(typeof host === "string") host = document.getElementById(host);
  if(!host) return;
  styles();

  var st = { hidden:{}, cur:null, host:host };

  fetch("prices.json?v="+Date.now())
    .then(function(r){ if(!r.ok) throw new Error("absent"); return r.json(); })
    .then(function(db){ paint(st, db, opts); })
    .catch(function(){ paint(st, null, opts); });

  var to;
  window.addEventListener("resize", function(){
    clearTimeout(to);
    to = setTimeout(function(){
      var svg = st.host.querySelector(".vl-chart svg");
      if(svg && st.cur){ svg.innerHTML=""; draw(st, svg, st.cur[0], st.cur[1]); }
    }, 160);
  });
  return st;
}

function paint(st, db, opts){
  var host = st.host;
  host.innerHTML = "";
  var series = db && db.series ? db.series : [];

  if(opts.facts !== false) host.appendChild(facts(series, db));
  host.appendChild(windowBox());

  if(!series.length){ host.appendChild(emptyBox()); host.appendChild(notes()); return; }

  var routes = db.routes || {};
  var byRoute = {};
  ORDER.forEach(function(id){ byRoute[id] = series.filter(function(x){ return x.r===id; }); });
  var dates = [];
  series.forEach(function(x){ if(dates.indexOf(x.d)<0) dates.push(x.d); });
  dates.sort();

  host.appendChild(chart(st, byRoute, routes, dates));
  host.appendChild(table(byRoute, routes));
  host.appendChild(notes());
  var m = el("p","vl-maj","Relevé automatique par GitHub Actions · source Google Flights · dernière mise à jour "
    + (db.updated ? fmt(db.updated) : "—"));
  host.appendChild(m);
}

/* ── les quatre chiffres ── */
function facts(series, db){
  var last = {};
  ORDER.forEach(function(id){
    var s = series.filter(function(x){ return x.r===id; });
    if(s.length) last[id] = s[s.length-1].p;
  });
  /* Le vrai billet multi-destinations fait foi. La somme des deux allers simples
     ne sert que de repli, les jours ou l'open-jaw n'a rien renvoye. */
  var oj = last.openjaw!=null ? last.openjaw
         : ((last.aller!=null && last.retour!=null) ? last.aller+last.retour : null);
  var dates = [];
  series.forEach(function(x){ if(dates.indexOf(x.d)<0) dates.push(x.d); });

  var box = el("div","vl-facts");
  [[oj!=null?eur(oj):"—","Open-jaw, par personne"],
   [oj!=null?eur(oj*2):"—","Pour deux"],
   [String(Math.max(0,days(new Date(),DEPART))),"Jours avant départ"],
   [String(dates.length),"Jours de relevé"]].forEach(function(f){
    var d=el("div"); d.appendChild(el("b",null,f[0])); d.appendChild(el("span",null,f[1])); box.appendChild(d);
  });
  return box;
}

/* ── la fenêtre de réservation, 60 à 110 jours avant ── */
function windowBox(){
  var d = days(new Date(), DEPART);
  var inside = d<=110 && d>=60;
  var box = el("div","vl-win"+(inside?" now":""));
  box.appendChild(el("span","lbl","Fenêtre de réservation"));
  box.appendChild(el("h3", null,
    inside ? "Tu es dans la zone optimale" :
    d>110  ? "Encore trop tôt" :
    d>0    ? "La zone optimale est passée" : "Le départ est passé"));
  box.appendChild(el("p", null,
    inside ? "Le site vise 60 à 110 jours avant le départ. Il en reste "+d+" : c'est maintenant que ça se joue." :
    d>110  ? "La zone visée commence dans "+(d-110)+" jours. Rien ne presse, mais le relevé tourne déjà." :
    d>0    ? "Il reste "+d+" jours. Les prix ont tendance à monter dans les dernières semaines : ne pas trop attendre." :
             "Bon voyage."));

  var bar = el("div","vl-bar");
  var z = el("div","z");
  z.style.left  = ((180-110)/180*100)+"%";
  z.style.width = ((110-60)/180*100)+"%";
  bar.appendChild(z);
  if(d>=0 && d<=180){ var c=el("div","c"); c.style.left=((180-d)/180*100)+"%"; bar.appendChild(c); }
  box.appendChild(bar);
  var lab = el("div","vl-barlab");
  ["180 j","110 → 60 j","départ"].forEach(function(t){ lab.appendChild(el("span",null,t)); });
  box.appendChild(lab);
  return box;
}

/* ── le graphe ── */
function chart(st, byRoute, routes, dates){
  var wrap = el("div","vl-chart");
  var svg = mk("svg",{preserveAspectRatio:"none"});
  wrap.appendChild(svg);

  var leg = el("div","vl-leg");
  ORDER.forEach(function(id){
    if(!byRoute[id].length) return;
    var b = el("button"); b.type="button";
    b.setAttribute("aria-pressed", st.hidden[id]?"false":"true");
    var i = el("i"); i.style.background = COL[id];
    b.appendChild(i);
    b.appendChild(el("span",null,(routes[id]&&routes[id].label)||id));
    b.onclick = function(){
      st.hidden[id] = !st.hidden[id];
      b.setAttribute("aria-pressed", st.hidden[id]?"false":"true");
      svg.innerHTML=""; draw(st, svg, byRoute, dates);
    };
    leg.appendChild(b);
  });
  wrap.appendChild(leg);
  st.cur = [byRoute, dates];
  setTimeout(function(){ draw(st, svg, byRoute, dates); }, 0);
  return wrap;
}

function draw(st, svg, byRoute, dates){
  var W = svg.clientWidth || 900, H = svg.clientHeight || 300;
  svg.setAttribute("viewBox","0 0 "+W+" "+H);
  var padL=54, padR=14, padT=14, padB=30;

  var vis = ORDER.filter(function(id){ return byRoute[id].length && !st.hidden[id]; });
  var all = [];
  vis.forEach(function(id){ byRoute[id].forEach(function(x){ all.push(x.p); }); });
  if(!all.length){
    svg.appendChild(mk("text",{x:W/2,y:H/2,"text-anchor":"middle","class":"vl-ax"},
      "Toutes les courbes sont masquées.")); return;
  }

  var lo = Math.min.apply(null,all), hi = Math.max.apply(null,all);
  var span = hi-lo || 1;
  lo -= span*0.12; hi += span*0.12;

  function X(d){ var i=dates.indexOf(d);
    return dates.length<2 ? (padL+(W-padL-padR)/2)
                          : padL + i/(dates.length-1)*(W-padL-padR); }
  function Y(p){ return padT + (1-(p-lo)/(hi-lo))*(H-padT-padB); }

  for(var k=0;k<=4;k++){
    var v = lo + (hi-lo)*k/4, y = Y(v);
    svg.appendChild(mk("line",{x1:padL,y1:y,x2:W-padR,y2:y,"class":"vl-grid"}));
    svg.appendChild(mk("text",{x:padL-9,y:y+4,"text-anchor":"end","class":"vl-ax"}, Math.round(v)+" €"));
  }

  var marks = dates.length<=2 ? dates.slice()
            : [dates[0], dates[Math.floor((dates.length-1)/2)], dates[dates.length-1]];
  /* Le premier et le dernier s'ancrent vers l'intérieur, sinon ils débordent du cadre. */
  marks.forEach(function(d,i){
    var a = marks.length>1 && i===0 ? "start"
          : marks.length>1 && i===marks.length-1 ? "end" : "middle";
    svg.appendChild(mk("text",{x:X(d),y:H-9,"text-anchor":a,"class":"vl-ax"}, fmt(d)));
  });

  vis.forEach(function(id){
    var s = byRoute[id];
    var pts = s.map(function(x){ return X(x.d).toFixed(1)+","+Y(x.p).toFixed(1); });
    if(s.length>1) svg.appendChild(mk("path",{d:"M"+pts.join("L"),"class":"vl-ln",stroke:COL[id]}));
    s.forEach(function(x){
      var c = mk("circle",{cx:X(x.d),cy:Y(x.p),r:s.length>40?2.4:3.6,fill:COL[id],"class":"vl-dot"});
      c.appendChild(mk("title",null,fmt(x.d)+" — "+eur(x.p)+(x.a?" ("+x.a+")":"")));
      svg.appendChild(c);
    });
  });
}

/* ── le tableau ── */
function table(byRoute, routes){
  var t = el("table","vl-tbl");
  var thead = el("thead"), tr = el("tr");
  ["Trajet","Aujourd'hui","Depuis le 1ᵉʳ relevé","Le plus bas vu","Le plus haut vu"]
    .forEach(function(h){ tr.appendChild(el("th",null,h)); });
  thead.appendChild(tr); t.appendChild(thead);

  var tb = el("tbody");
  ORDER.forEach(function(id){
    var s = byRoute[id]; if(!s.length) return;
    var meta = routes[id] || {};
    var cur = s[s.length-1].p, first = s[0].p;
    var ps = s.map(function(x){ return x.p; });
    var mn = Math.min.apply(null,ps), mx = Math.max.apply(null,ps);
    var diff = cur-first, pct = first ? Math.round(diff/first*100) : 0;

    var r = el("tr");
    var c0 = el("td","rt"); c0.appendChild(document.createTextNode(meta.label||id));
    if(meta.note) c0.appendChild(el("small",null,meta.note));
    r.appendChild(c0);

    var c1 = el("td","p", eur(cur)); c1.style.color = COL[id]; r.appendChild(c1);

    var c2 = el("td");
    if(s.length<2)  c2.appendChild(el("span","vl-fl","premier relevé"));
    else if(diff<0) c2.appendChild(el("span","vl-dn","↓ "+eur(-diff)+"  ("+pct+" %)"));
    else if(diff>0) c2.appendChild(el("span","vl-up","↑ "+eur(diff)+"  (+"+pct+" %)"));
    else            c2.appendChild(el("span","vl-fl","stable"));
    r.appendChild(c2);

    r.appendChild(el("td","n", eur(mn)));
    r.appendChild(el("td","n", eur(mx)));
    tb.appendChild(r);
  });
  t.appendChild(tb);
  return t;
}

/* ── les réserves ── */
function notes(){
  var ul = el("ul","vl-notes");
  [["Ce sont des prix indicatifs, pas des billets.",
    " Le relevé interroge Google Flights une fois par jour. Le prix réel au moment d'acheter sera proche, rarement identique."],
   ["L'open-jaw est un vrai billet multi-destinations.",
    " Il est interrogé pour lui-même, et non reconstitué en additionnant les deux allers simples. Ces deux lignes restent affichées : leur somme dit ce que coûterait le même voyage acheté en deux fois."],
   ["Le prix ne fait pas tout.",
    " Air China inclut deux bagages de 23 kg, Air France un seul. À deux, aller et retour, le second bagage peut effacer un écart de 100 €."],
   ["Le départ est PAR, pas CDG.",
    " La recherche couvre Roissy et Orly pour ne rien manquer ; vérifiez l'aéroport avant de valider."],
   ["Une courbe courte ne fait pas une saisonnalité.",
    " Elle sert à repérer une baisse ou une flambée dans les semaines qui restent, pas à prédire un plancher."]
  ].forEach(function(n){
    var li = el("li"); li.appendChild(el("b",null,n[0])); li.appendChild(document.createTextNode(n[1]));
    ul.appendChild(li);
  });
  return ul;
}

/* ── avant le premier relevé ── */
function emptyBox(){
  var b = el("div","vl-empty");
  b.appendChild(el("span","lbl","Pas encore de données"));
  b.appendChild(el("h3",null,"Le relevé n'a pas encore tourné"));
  b.appendChild(el("p",null,"Trois choses à faire une seule fois, et la courbe se remplit toute seule ensuite."));
  var ol = el("ol");
  ["Créer un compte gratuit sur serpapi.com et copier la clé depuis serpapi.com/manage-api-key.",
   "Dans le dépôt GitHub : Settings → Secrets and variables → Actions → New repository secret, nommé SERPAPI_KEY.",
   "Onglet Actions → « Relevé des prix de vols » → Run workflow. Ensuite c'est quotidien, à 6 h 10 UTC."
  ].forEach(function(x){ ol.appendChild(el("li",null,x)); });
  b.appendChild(ol);
  return b;
}

return { mount: mount };
})();
