# spoon-news

Borne d'affichage verticale (9:16) qui diffuse en direct des news lues
depuis un fichier JSON. Le site est purement statique : il interroge
`data/news.json` toutes les 15 secondes et met l'affichage à jour quand
le contenu change.

L'agent de veille (hors de ce dépôt) est responsable d'écrire ce fichier
JSON. Il est typiquement monté dans le conteneur via un volume Docker.

## Lancer en local

Servir le dossier avec n'importe quel serveur HTTP :

```bash
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

> Ouvrir `index.html` directement (`file://`) ne fonctionnera pas à cause
> de la politique CORS de `fetch`.

## Lancer avec Docker

```bash
docker compose up --build
# puis ouvrir http://localhost:8080
```

Le dossier `./data` est monté en lecture seule dans le conteneur. L'agent
de curation peut écrire dedans depuis l'hôte ; le site rechargera la
page automatiquement à la prochaine itération de polling.

Pour brancher l'agent à un autre dossier :

```yaml
volumes:
  - /chemin/vers/output/agent:/usr/share/nginx/html/data:ro
```

## Format du JSON

`data/news.json` :

```json
{
  "last_update": "ISO-8601",
  "settings": {
    "rotation_seconds": 18,
    "channel_name": "INFO 24",
    "city": "Brest",
    "temperature": "14°"
  },
  "markets": [
    { "label": "CAC 40", "value": "+0,42%", "direction": "up" }
  ],
  "ticker": ["Brève 1", "Brève 2"],
  "news": [
    {
      "category": "POLITIQUE",
      "location": "PARIS",
      "time": "IL Y A 12 MIN",
      "headline": "...",
      "chapo": "...",
      "credit": "© AFP",
      "illustration": "cityscape",
      "data_label": "LES CHIFFRES",
      "data": { "type": "grid", "items": [{ "num": "287", "lbl": "Pour" }] }
    }
  ]
}
```

### Champs

- `last_update` : utilisé pour détecter les changements et éviter
  un re-render inutile.
- `settings.rotation_seconds` : durée d'affichage d'une news (défaut 18s).
- `settings.channel_name`, `city`, `temperature` : header / footer.
- `markets[*].direction` : `up` (vert), `down` (rouge), autre (neutre).
- `ticker[]` : bandeau défilant rouge en bas.
- `news[*].illustration` : `cityscape`, `globe`, `chart`, `stadium`,
  `planet`, `generic`. Définies dans `assets/svgs.js`.
- `news[*].data.type` : `grid` (3 chiffres), `quote` (citation),
  `bullets` (liste à puces).

## Raccourcis clavier

- `→` / `←` : news suivante / précédente
- `espace` : pause / reprise de la rotation
- `F` : plein écran
- `R` : forcer un rechargement du JSON

## Architecture

```
spoon-news/
├── index.html          # Structure
├── assets/
│   ├── styles.css      # Styles (responsive 9:16)
│   ├── svgs.js         # Illustrations SVG nommées
│   └── app.js          # Polling JSON + render + rotation
├── data/
│   └── news.json       # ÉCRIT PAR L'AGENT (volume Docker)
├── nginx.conf          # No-cache sur /data, cache court sur /assets
├── Dockerfile
└── docker-compose.yml
```
