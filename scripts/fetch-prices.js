#!/usr/bin/env node
/* Relevé quotidien des prix de vols, via l'API Google Flights de SerpApi.
   Ajoute une ligne par trajet et par jour dans prices.json.
   Aucune dependance : fetch natif, Node 18+.

   La clé se lit dans SERPAPI_KEY. Elle ne doit jamais arriver dans le dépôt :
   le workflow la passe par les secrets.

   Pourquoi SerpApi et pas Travelpayouts, essayé en premier : l'API Aviasales
   sert un cache alimente par les recherches des utilisateurs dans les 48 h
   écoulées. Testée le 2026-08-20 avec un jeton valide, elle ne renvoyait rien
   sur Paris-Pekin au jour dit, et rien du tout sur Kunming-Paris, quelle que
   soit la granularité, le marché ou l'endpoint. Google Flights repond aux
   dates exactes, et sait faire le multi-city : l'open-jaw est enfin suivi
   pour lui-même, et non plus comme la somme de deux allers simples. */

"use strict";

var fs = require("fs");
var path = require("path");

var KEY = process.env.SERPAPI_KEY;
var OUT = path.join(__dirname, "..", "prices.json");
/* Surchargeable pour tester le script contre un faux serveur, sans clé ni réseau. */
var API = process.env.SERPAPI_API || "https://serpapi.com/search.json";

/* Les dates du voyage. Un seul endroit à changer si elles bougent. */
var ALLER = "2026-11-13";
var RETOUR = "2026-12-08";

/* Roissy et Orly ensemble : on cherche large, on lit le détail après.
   Pékin a deux aéroports internationaux, Capital et Daxing : les deux comptent. */
var PARIS = "CDG,ORY";
var PEKIN = "PEK,PKX";
var KUNMING = "KMG";

/* Cinq relevés par jour, soit 155 par mois : le palier gratuit en autorise 250. */
var ROUTES = [
  { id: "openjaw", label: "Paris → Pékin, Kunming → Paris",
    note: "l'open-jaw réel, en un seul billet",
    q: { type: "3", multi_city_json: JSON.stringify([
      { departure_id: PARIS,   arrival_id: PEKIN, date: ALLER },
      { departure_id: KUNMING, arrival_id: PARIS, date: RETOUR }
    ]) } },
  { id: "aller", label: "Paris → Pékin",
    note: "aller simple, la première moitié de l'open-jaw",
    q: { type: "2", departure_id: PARIS, arrival_id: PEKIN, outbound_date: ALLER } },
  { id: "retour", label: "Kunming → Paris",
    note: "aller simple, la seconde moitié de l'open-jaw",
    q: { type: "2", departure_id: KUNMING, arrival_id: PARIS, outbound_date: RETOUR } },
  { id: "ar_pekin", label: "Paris ↔ Pékin",
    note: "aller-retour classique, pour comparer",
    q: { type: "1", departure_id: PARIS, arrival_id: PEKIN,
         outbound_date: ALLER, return_date: RETOUR } },
  { id: "ar_kunming", label: "Paris ↔ Kunming",
    note: "aller-retour classique, relevé à 571 € en août 2026",
    q: { type: "1", departure_id: PARIS, arrival_id: KUNMING,
         outbound_date: ALLER, return_date: RETOUR } }
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function url(r) {
  var q = new URLSearchParams({
    engine: "google_flights",
    currency: "EUR",
    hl: "fr",
    gl: "fr",
    api_key: KEY
  });
  for (var k in r.q) q.set(k, r.q[k]);
  return API + "?" + q.toString();
}

/* Google Flights classe en best_flights, ce qu'il juge le meilleur compromis,
   et other_flights, le reste. Le moins cher peut etre dans l'un ou l'autre. */
function cheapest(j) {
  var all = (j.best_flights || []).concat(j.other_flights || []);
  var best = null;
  all.forEach(function (o) {
    if (typeof o.price !== "number") return;
    if (!best || o.price < best.price) best = o;
  });
  return best;
}

async function fetchOne(r) {
  var res = await fetch(url(r), { headers: { "Accept": "application/json" } });
  var txt = await res.text();
  var j;
  try { j = JSON.parse(txt); }
  catch (e) { throw new Error("HTTP " + res.status + " réponse illisible : " + txt.slice(0, 200)); }
  /* Le champ error porte aussi bien "clé invalide" que "aucun vol trouvé". */
  if (j.error) throw new Error(String(j.error).slice(0, 200));
  if (!res.ok) throw new Error("HTTP " + res.status + " " + txt.slice(0, 200));

  var o = cheapest(j);
  if (!o) return null;                       /* pas d'offre trouvée aujourd'hui */
  var legs = o.flights || [];
  return {
    d: today(),
    r: r.id,
    p: Math.round(o.price),
    /* Attention à la portée de ces deux champs. Sur un aller-retour comme sur un
       multi-city, Google Flights ne détaille que le premier tronçon : la suite
       demande un second appel, via departure_token. Le prix, lui, est bien celui
       du voyage entier, vérifié le 2026-08-20 : 627 € pour l'open-jaw, contre 359
       et 356 € pour ses deux moitiés achetées séparément. On garde donc le prix
       total, et une compagnie et un nombre d'escales qui ne valent que pour
       l'aller. Un second appel par trajet ferait passer le relevé de 155 à 210
       recherches par mois, pour une précision que la page n'affiche même pas. */
    a: legs.length ? (legs[0].airline || "") : "",
    tAller: o.layovers ? o.layovers.length : Math.max(0, legs.length - 1),
    l: (j.search_metadata && j.search_metadata.google_flights_url) || ""
  };
}

function load() {
  try {
    return JSON.parse(fs.readFileSync(OUT, "utf8"));
  } catch (e) {
    return { updated: null, routes: {}, series: [] };
  }
}

async function main() {
  if (!KEY) {
    console.error("SERPAPI_KEY absent. Rien n'a été relevé.");
    process.exit(1);
  }

  var db = load();
  var day = today();

  /* Les métadonnées sont réécrites à chaque passage : si une route change
     dans ce fichier, la page la reflète sans migration. */
  db.routes = {};
  ROUTES.forEach(function (r) {
    db.routes[r.id] = { label: r.label, note: r.note };
  });

  var kept = 0, missing = [];

  for (var i = 0; i < ROUTES.length; i++) {
    var r = ROUTES[i];
    try {
      var row = await fetchOne(r);
      if (!row) { missing.push(r.id + " (aucune offre)"); continue; }
      /* Un seul relevé par trajet et par jour : un re-run écrase, il n'empile pas. */
      db.series = db.series.filter(function (x) { return !(x.d === day && x.r === r.id); });
      db.series.push(row);
      kept++;
      console.log(r.id + " : " + row.p + " €" + (row.a ? " (" + row.a + ")" : ""));
    } catch (e) {
      missing.push(r.id + " : " + e.message);
    }
  }

  if (!kept) {
    console.error("Aucun prix relevé. prices.json est laissé tel quel.");
    missing.forEach(function (m) { console.error("  " + m); });
    process.exit(1);
  }

  db.series.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : (a.r < b.r ? -1 : 1); });
  db.updated = day;
  fs.writeFileSync(OUT, JSON.stringify(db) + "\n");

  console.log(kept + "/" + ROUTES.length + " trajets relevés, " + db.series.length + " lignes au total.");
  if (missing.length) {
    console.log("Manquants :");
    missing.forEach(function (m) { console.log("  " + m); });
  }
}

main().catch(function (e) { console.error(e); process.exit(1); });
