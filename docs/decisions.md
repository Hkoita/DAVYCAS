# Journal des décisions — refonte DAVYCAS

Format : date · décision · raison · alternatives écartées.

## 2026-11-17 · Branche `refonte`
- **Décision** : toute la refonte se fait sur la branche `refonte`, sans push tant que le propriétaire n'a pas validé.
- **Raison** : un push sur `main` met en production sur davycas.com (workflow FTP LWS).

## 2026-11-17 · Hébergement
- **Décision** : GitHub → GitHub Actions (FTP) → hébergement LWS → davycas.com.
- **Constat** : le premier déploiement a réussi (63 fichiers). La racine sert encore une copie de l'ancien WordPress
  depuis le cache serveur LWS (`x-cache-status: HIT`), et les fichiers WordPress sont toujours sur le serveur.
- **À faire par le propriétaire** : vider le cache LWS, puis supprimer l'ancien WordPress après sauvegarde.

## 2026-11-17 · Couleur de référence de la charte (provisoire)
- **Constat** : le logo `Logo.png` est en **bleu marine** (pixels dominants ≈ `#000060`), alors que le site actuel
  utilise un violet `#625a9a` et un turquoise `#469cb0`, et que le guide interne propose `#6B61A8` / `#48B6CF`.
- **Décision provisoire** : le bleu marine du logo est la couleur d'ancrage de la marque. Le turquoise est conservé
  comme accent. Les dégradés violets sont abandonnés (interdits par le brief).
- **En attente** : charte officielle à confirmer par l'ONG (question posée au point de validation 1).

## 2026-11-17 · Charte confirmée
- **Logo** : `design/brand/logo-davycas-source.png` (version nettoyée fournie par l'ONG). Bleu marine mesuré : **`#020566`**.
- **Nom officiel** : DAVYCAS International.
- **Source des contenus** : les textes du site actuel font foi ; ce qui n'y figure pas reste `[À CONFIRMER]`.

## 2026-11-17 · Direction artistique unique (pas de 3 propositions)
- **Décision** : à la demande du propriétaire (coût), une seule direction, sans point de validation intermédiaire.
- **Direction retenue : « clair institutionnel »**. Fond papier chaud, encre bleu nuit, bandes pleines bleu marine
  `#020566` (couleur du logo), accent turquoise foncé pour les liens et mots clés, typographie Instrument Sans
  (texte) + Instrument Serif italique (mots mis en valeur).
- **Raison** : une ONG qui travaille avec des ministères et des bailleurs doit inspirer la rigueur ; un fond clair
  sert mieux la lisibilité, les contrastes AA et les photos de terrain (souvent claires) qu'un site entièrement sombre.
  Le bleu marine du logo porte l'identité ; le turquoise assure la continuité avec le site actuel.
- **Écartées** : site sombre « nuit » (lisibilité, photos de terrain lumineuses), accent latérite (s'éloigne de la charte).

## 2026-11-17 · Stack (provisoire)
- **Décision** : conserver un site statique HTML/CSS/JS sans framework, hébergeable tel quel sur LWS.
- **Ajout envisagé** : une petite étape de build Node (tokens JSON → variables CSS, génération des images
  AVIF/WebP, en-tête et pied de page partagés) dont la sortie reste du HTML statique.
  À confirmer avant la phase de construction ; justification détaillée à venir.

## 2026-11-17 · Stack définitive
- **Décision** : générateur statique maison en Node (`scripts/build.mjs`, une seule dépendance d'exécution : `sharp`).
  Sortie : HTML/CSS/JS statique dans `dist/`, envoyé sur LWS par le workflow GitHub.
- **Raison** : le site d'origine dupliquait l'en-tête et le pied de page dans 12 fichiers (trois versions divergentes)
  et ses images pesaient jusqu'à 17,5 Mo. Le générateur partage les gabarits, compile `design/tokens.json` en
  variables CSS et produit les images en AVIF/WebP (200 Ko max) avec `srcset`, sans framework à maintenir.
- **Écartés** : Astro / Eleventy (dépendances lourdes pour une petite ONG), WordPress (déjà présent et obsolète).

## 2026-11-17 · Arborescence et redirections
- Nouvelles adresses : `/qui-sommes-nous/`, `/nos-actions/` (+ une page par projet), `/impact/`, `/agir/`,
  `/actualites/`, `/transparence/`, `/contact/`, `/mentions-legales/`, `/confidentialite/`, `/plan-du-site/`, `404.html`.
- Les 5 pages « interventions » et la page « piliers » sont regroupées dans `/nos-actions/` (domaines numérotés,
  ancres) : leurs textes se recoupaient largement. Redirections 301 dans `.htaccess`.
- Anciennes adresses WordPress (`wp-admin`, `wp-content`…) : réponse 410.

## 2026-11-17 · Contenus
- Source : textes du site d'origine (confirmé par le propriétaire). Reformulations seulement pour la clarté.
- **Retirés** car contradictoires ou invérifiables : actualité « DAVYCAS certifiée par NGO Source Canada »
  (datée 2026 sur l'accueil, 2021 sur À propos), actualité « −40 % de délais » (chiffre non sourcé), mentions
  « Zéro perte d'échantillons » et « adoptées par les plus grandes institutions ». Pile technique de STELab
  (versions en fin de vie, information utile à un attaquant).
- NGOsource : formulé « référencée par NGOsource (2021) » en attendant l'intitulé exact.
- Chiffres affichés : uniquement ceux déductibles des textes (2016, 8 projets listés, 11 experts du tableau
  d'effectifs, 24 h de livraison SITEB, 6 types d'échantillons, 2 pays et 3 niveaux STELab).
- Pas de section « témoignages » : aucun témoignage réel disponible.
- Pas de bouton de don en ligne : aucun moyen de paiement n'existe. « Soutenir nos actions » mène à `/agir/#soutenir`,
  qui invite à écrire. La barre fixe mobile reprend ce lien.
- Coordonnées retenues : `contact@davycas.com` (domaine de l'ONG, messagerie LWS active) et `+226 25 34 12 50`
  (numéro présent sur 3 pages sur 4). À confirmer.

## 2026-11-17 · Photos
- Seules les vraies photos de terrain sont utilisées. Les photos de banque d'images et les visuels générés de
  l'ancien site sont retirés, y compris les 3 images « SITEB » (aspect de visuels générés, dont une avec un panneau
  « Ghana Health Service ») : à remplacer par de vraies photos.
- Les projets sans photo propre (PCV13, Nutrition SMART, polio, arboviroses, surveillance communautaire) ont un
  en-tête typographique plutôt qu'une photo d'un autre projet.
- La photo d'un enfant (`oeuvres-sociales-enfant.jpg`) n'est pas publiée tant que le consentement n'est pas confirmé.

## 2026-11-17 · Polices et performance
- Instrument Sans (variable) et Instrument Serif italique, auto-hébergées, préchargées, `font-display: optional`
  et police de secours calibrée : aucun décalage de mise en page au chargement (CLS mesuré à 0).
- Un seul fichier CSS, image du héros préchargée en AVIF.
- Valeurs de géométrie propres à un composant (largeur d'une colonne de grille en rem, rapport d'image) restent
  dans le CSS ; toutes les couleurs, typos, espacements, rayons, ombres et durées viennent des tokens.

## 2026-11-17 · Direction artistique : écarts assumés au brief
- Galerie épinglée à défilement horizontal : seulement à partir de 1080 px et sans `prefers-reduced-motion` ;
  sur mobile, défilement horizontal natif avec aimantation.
- Mots qui s'allument : les mots non lus restent à 50 % d'opacité (au lieu d'un effet plus marqué) pour garder un
  contraste suffisant (WCAG) avant le défilement.
