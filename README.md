# Site de DAVYCAS International

Site institutionnel de DAVYCAS International (davycas.com) : HTML statique généré à partir de `src/`, sans
framework, hébergé chez LWS.

## Installation

Prérequis : Node.js 20 ou plus récent (22 conseillé) et, pour les vérifications, Google Chrome.

```bash
npm install
npm run build      # génère le site dans dist/
npm run serve      # aperçu sur http://127.0.0.1:4173/
npm run check      # contrôle chaque page à 390, 768 et 1440 px (captures dans qa/AAAA-MM-JJ/)
```

## Structure

```
design/
  tokens.json          Couleurs, typographies, espacements, rayons, ombres, durées : source unique
  brand/               Logo officiel (fichiers sources)
src/
  layout.html          Gabarit commun (head, en-tête, pied de page, barre de soutien mobile)
  partials/            En-tête et pied de page
  pages/               Une page = un fichier HTML ; ses métadonnées sont en JSON tout en haut
  templates/           Gabarit des pages projets et sections propres à STELab et SITEB
  data/site.json       Coordonnées, menu, données structurées (JSON-LD NGO)
  data/projets.json    Les projets : chaque entrée génère une page /nos-actions/<slug>/
  data/images.json     Les photos utilisées : fichier source, texte alternatif, recadrage
  images/              Photos originales (non publiées telles quelles)
  css/main.css         Styles : uniquement des variables issues de tokens.json
  js/main.js           Menu mobile, diaporama, animations, formulaire
  static/              Copié tel quel : .htaccess, envoi du formulaire (PHP), icônes, logos, favicon
scripts/
  build.mjs            Générateur : tokens -> CSS, images AVIF/WebP (200 Ko max), pages, sitemap, robots
  serve.mjs            Serveur d'aperçu local
  check.mjs            Vérifications automatiques dans Chrome
docs/
  audit.md             Audit du site d'origine
  decisions.md         Journal des choix de la refonte
  contenu-manquant.md  Informations à fournir ou confirmer par l'ONG
```

## Modifier le contenu

- **Un texte** : ouvrir la page dans `src/pages/` (par exemple `qui-sommes-nous.html`) et modifier le texte entre
  les balises. Le titre et la description pour Google sont dans le bloc JSON en haut du fichier.
- **Coordonnées** (e-mail, téléphone, adresse) : `src/data/site.json`. Elles se mettent à jour partout.
- **Un projet** : `src/data/projets.json`. Ajouter une entrée crée automatiquement sa page et l'ajoute à la liste.
- **Une photo** :
  1. déposer le fichier original dans `src/images/` ;
  2. le déclarer dans `src/data/images.json` avec un texte alternatif qui décrit la photo ;
  3. l'utiliser dans une page avec `{{img nom-de-la-photo sizes="100vw"}}`.
  Les versions AVIF et WebP sont produites à la génération.
- **Une couleur ou une taille** : `design/tokens.json` uniquement. Ne jamais écrire de valeur en dur dans le CSS.
- **Une actualité** : `src/pages/actualites.html` (et la section Actualités de `src/pages/index.html`).

Règle d'or : aucun fait (chiffre, partenaire, date, témoignage) n'est publié sans source. Les manques sont listés
dans `docs/contenu-manquant.md`. La génération s'arrête si une page contient « [À CONFIRMER] ».

## Formulaire de contact

Le formulaire envoie les messages par `src/static/contact/envoi.php` (fonction `mail()` de LWS), avec champ piège,
délai minimal et limite de 5 envois par heure et par adresse IP. L'adresse de réception se règle dans la
constante `DESTINATAIRE` de ce fichier. La confirmation ne s'affiche qu'après une réponse positive du serveur.

## Déploiement

Chaque push sur la branche `main` lance `.github/workflows/deploy-lws.yml` :
installation, `npm run build`, puis envoi du dossier `dist/` sur LWS par FTP.

Secrets à créer dans GitHub (Settings > Secrets and variables > Actions) : `FTP_SERVER`, `FTP_USERNAME`,
`FTP_PASSWORD`, et si besoin `FTP_DIR` (dossier du site sur le serveur, terminé par `/`) et `FTP_PROTOCOL`.

Après un déploiement, **vider le cache dans le panneau LWS** : sinon l'ancienne version peut rester affichée.

Les anciennes adresses (`about.html`, `stelab.html`, etc.) sont redirigées vers les nouvelles par `src/static/.htaccess`.
