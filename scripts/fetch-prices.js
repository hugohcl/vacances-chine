#!/usr/bin/env node
/* Relevé quotidien des prix de vols, via l'API Travelpayouts.
   Ajoute une ligne par trajet et par jour dans prices.json.
   Aucune dépendance : fetch natif, Node 18+.

   La clé se lit dans TRAVELPAYOUTS_TOKEN. Elle ne doit jamais
   arriver dans le dépôt : le workflow la passe par les secrets. */

"use strict";

var fs = require("fs");
var path = require("path");

var TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
var OUT = path.join(__dirname, "..", "prices.json");
/* Surchargeable pour tester le script contre un faux serveur, sans clé ni réseau. */
var API = process.env.TRAVELPAYOUTS_API || "https://api.travelpayouts.com/aviasales/v3/prices_for_dates";

/* Les dates du voyage. Un seul endroit à changer si elles bougent. */
var ALLER = "2026-11-13";
var RETOUR = "2026-12-08";

/* PAR couvre Roissy et Orly : on cherche large, on lit le détail après.
   L'open-jaw se suit par ses deux allers simples — voir la note dans vols.html. */
var ROUTES = [
  { id: "aller",      from: "PAR", to: "PEK", depart: ALLER,  back: null,
    label: "Paris → Pékin",   note: "aller simple, la première moitié de l'open-jaw" },
  { id: "retour",     from: "KMG", to: "PAR", depart: RETOUR, back: null,
    label: "Kunming → Paris", note: "aller simple, la seconde moitié de l'open-jaw" },
  { id: "ar_pekin",   from: "PAR", to: "PEK", depart: ALLER,  back: RETOUR,
    label: "Paris ↔ Pékin",   note: "aller-retour classique, pour comparer" },
  { id: "ar_kunming", from: "PAR", to: "KMG", depart: ALLER,  back: RETOUR,
    label: "Paris ↔ Kunming", note: "aller-retour classique, relevé à 571 € en août 2026" }
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function url(r) {
  var q = new URLSearchParams({
    origin: r.from,
    destination: r.to,
    departure_at: r.depart,
    currency: "eur",
    market: "fr",
    one_way: r.back ? "false" : "true",
    direct: "false",
    sorting: "price",
    limit: "1",
    token: TOKEN
  });
  if (r.back) q.set("return_at", r.back);
  return API + "?" + q.toString();
}

async function fetchOne(r) {
  var res = await fetch(url(r), { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error("HTTP " + res.status + " " + (await res.text()).slice(0, 200));
  var j = await res.json();
  if (j.success === false) throw new Error("API: " + JSON.stringify(j.error || j).slice(0, 200));
  var d = (j.data || [])[0];
  if (!d) return null;                       /* pas d'offre trouvée aujourd'hui */
  return {
    d: today(),
    r: r.id,
    p: Math.round(d.price),
    a: d.airline || "",
    t: d.transfers == null ? null : d.transfers,
    l: d.link || ""
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
  if (!TOKEN) {
    console.error("TRAVELPAYOUTS_TOKEN absent. Rien n'a été relevé.");
    process.exit(1);
  }

  var db = load();
  var day = today();

  /* Les métadonnées sont réécrites à chaque passage : si une route change
     dans ce fichier, la page la reflète sans migration. */
  db.routes = {};
  ROUTES.forEach(function (r) {
    db.routes[r.id] = { label: r.label, note: r.note, from: r.from, to: r.to,
                        depart: r.depart, back: r.back };
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
