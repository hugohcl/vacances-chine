# Vacances Chine, novembre-decembre 2026

Document de travail pour preparer le voyage.

Photographies : Wikimedia Commons, licences libres, creditees dans la page.

## Les pages

- `index.html` — le catalogue des destinations, la carte, la route a composer soi-meme.
- `routes.html` — les quatre itineraires clef en main, le comparatif, le budget.
- `vols.html` — l'evolution quotidienne du prix des vols internationaux.

## Le releve des prix de vols

Un workflow GitHub Actions (`.github/workflows/prices.yml`) tourne chaque matin
a 6 h 10 UTC, interroge l'API Travelpayouts via `scripts/fetch-prices.js`, ajoute
une ligne par trajet dans `prices.json` et la commite. `vols.html` lit ce fichier
et trace la courbe. Aucun serveur, aucune dependance.

### Mise en service, une seule fois

1. Creer un compte sur travelpayouts.com et copier le jeton d'API.
2. Dans le depot : Settings → Secrets and variables → Actions → New repository
   secret, nomme `TRAVELPAYOUTS_TOKEN`.
3. Onglet Actions → « Releve des prix de vols » → Run workflow, pour amorcer
   sans attendre le premier cron.

Le jeton ne doit jamais etre commite : le script le lit uniquement dans
l'environnement, et la page ne fait aucun appel a l'API.

### Changer les trajets suivis

Tout est dans le tableau `ROUTES` en haut de `scripts/fetch-prices.js`, avec les
deux dates juste au-dessus. Les metadonnees sont reecrites a chaque passage :
ajouter ou retirer un trajet suffit, `vols.html` suit sans migration.

### Tester sans clef

`scripts/fetch-prices.js` lit `TRAVELPAYOUTS_API` si la variable existe, ce qui
permet de le faire pointer vers un faux serveur local et de verifier le flux
complet hors ligne.
