# Audit du site DAVYCAS International

- **Date** : 17 novembre 2026
- **Site audité** : https://davycas.vercel.app/ (production Vercel) et copie locale du dépôt `Hkoita/DAVYCAS`, branche `main`, commit `92d7a5f`
- **Périmètre** : 12 pages HTML, `style.css`, `css/*.css`, `js/*.js`, scripts Python, images
- **Méthode** : lecture du code, rendu réel dans Chrome (Playwright) à 390, 768 et 1440 px, tests d'interaction sur le site en ligne, Lighthouse mobile, revue de code par un agent indépendant fusionnée à la mienne
- **Captures et rapports bruts** : `qa/audit/2026-11-17/`
- **Aucun fichier du site n'a été modifié et rien n'a été poussé sur GitHub.**

---

## 1. Résumé

1. Le site a une vraie identité visuelle (sombre, premium, typographies Sora et Inter) et un contenu métier riche (STELab, SITEB, interventions). Mais **il n'est pas utilisable sur mobile, et ses deux actions clés (contacter, donner) ne fonctionnent pas**.
2. **P1 – Formulaires factices** : le formulaire de contact affiche « Message envoyé ! » sans rien envoyer. Celui de l'accueil recharge la page et perd la demande.
3. **P2 – Pas de navigation mobile ni tablette (≤ 1024 px)** : le menu est masqué et le bouton hamburger ne fait rien, ou affiche une alerte de développement sur la page Contact. 11 pages sur 12 débordent horizontalement à 390 px.
4. **P3 – « Faire un don » mène nulle part** (`href="#"` sur les 12 pages), comme « Devenir partenaire », « Nous contacter », Blog, Actualités, les réseaux sociaux, les mentions légales et la politique de confidentialité.
5. **P4 – Informations contradictoires, risque de crédibilité** : 3 adresses de siège (dont Abidjan, avec un numéro de remplissage `+225 27 00 00 00 00`), 4 e-mails, 2 téléphones, des pays différents selon les pages, une « certification NGO Source » datée de 2021 ou de 2026 selon la page, et des partenaires prestigieux cités sans preuve.
6. **P5 – Performance très faible** : l'accueil pèse **30 Mo** sur mobile (Lighthouse : performance 33/100, Speed Index 14,3 s). Une seule photo fait 17,5 Mo (7451 × 4967 px).
7. Accessibilité moyenne (84 à 87/100) : contrastes insuffisants, 4 `h1` sur l'accueil, carrousel automatique sans pause, éléments cliquables non accessibles au clavier.
8. SEO de base incomplet : pas de description sur 3 pages clés, pas d'Open Graph, de JSON-LD `NGO`, de favicon, de `sitemap.xml` ni de `robots.txt`. La page 404 est celle de Vercel, en anglais.
9. Sécurité : aucune faille exploitable ni aucun secret trouvé. En revanche, des fichiers internes sont publiés (guide de prompts IA, scripts Python), ainsi que des numéros de mobile personnels.
10. Priorité recommandée : formulaires et coordonnées, puis menu mobile et débordements, puis bouton de don, puis images, puis vérification des contenus non sourcés.

---

## 2. Tableau des anomalies

**Légende de gravité**
- **Bloquant** : empêche une action clé ou trompe le visiteur.
- **Important** : dégrade fortement l'expérience, la crédibilité ou le référencement.
- **Mineur** : finition.

**Captures** : chemins relatifs à `qa/audit/2026-11-17/`. Les captures `local-*` viennent du dépôt servi en local, `live-*` du site en ligne, `test-*` des tests d'interaction.

| N° | Gravité | Catégorie | Page et fichier:ligne | Description | Capture | Correction proposée |
|---|---|---|---|---|---|---|
| 1 | Bloquant | Bug, UX ONG | Contact – `js/contact.js:36-65`, `contact.html:177-216` | Le formulaire simule un envoi : `preventDefault()`, puis un `setTimeout` qui affiche « Message envoyé ! » et vide les champs. **Testé en ligne : aucune requête n'est émise et le message est perdu.** Les champs n'ont pas d'attribut `name`. | `test-formulaire-contact-confirmation.png` | Brancher un vrai service (fonction Vercel, Formspree, Brevo…). Afficher le succès seulement après une réponse 2xx, et gérer l'erreur. Ajouter un honeypot anti-spam et une case de consentement. |
| 2 | Bloquant | Bug, Accessibilité | Accueil – `index.html:1808-1814` | Le formulaire « Parlons de vos projets » n'a ni `action`, ni script, ni `name`, ni `<label>`. **Testé en ligne : l'envoi recharge `/?` et la demande est perdue, sans aucun message.** | `local-index-1440.png` | Le relier au même service que la page Contact, ou le remplacer par un bouton vers `contact.html`. Ajouter des labels. |
| 3 | Bloquant | Bug, UX mobile | Toutes les pages – `style.css:276-290` et `3256-3271` (menu masqué ≤ 1024 px). Hamburger : `index.html:933`, `about.html:1028-1030`, `projets.html:474-476`, `js/contact.js:73-77` | En dessous de 1024 px, aucune navigation n'est possible. Le hamburger n'a pas de script sur 9 pages. Sur À propos et Projets, il vise `.header-nav`, qui n'existe pas (erreur JS). Sur Contact, il affiche `alert("Menu mobile - Implémentation minimaliste")`. **Testé à 390 px : le menu ne s'ouvre jamais.** | `test-menu-mobile-index-390.png`, `test-menu-mobile-contact-390.png` | Un script commun qui ouvre et ferme le menu (`aria-expanded`, touche Échap, focus), et `aria-label="Menu"` sur le bouton. Supprimer l'`alert`. |
| 4 | Bloquant | UI responsive | 11 pages sur 12 à 390 px (largeur mesurée) : Projets 906 px, Système d'information 831, À propos 667, STELab, SITEB et Interventions 616 (pied de page), Piliers 466, Accueil 415 | Débordement horizontal. Cause principale : des grilles en `style="grid-template-columns: …"` inline, que les media queries ne peuvent pas surcharger (`about.html:197,260,471,881,927`, `projets.html:128,164,177,360`, pieds de page `2fr 1fr 1fr`, ex. `stelab.html:400`). **Effet aggravant mesuré** : sur mobile, les blocs `.scroll-fade-up` placés hors écran ne deviennent jamais visibles (3 blocs restent masqués sur À propos, 10 sur Projets, dont l'équipe et la gouvernance). | `local-projets-390.png`, `local-about-390.png`, `local-stelab-390.png` | Remplacer les grilles inline par des classes CSS mobile-first (1 colonne, puis 2, puis 3). Ne pas masquer de contenu avec `opacity:0` sans solution de repli. |
| 5 | Bloquant | UX ONG | « Faire un don » : `.btn-don` sur les 12 pages (ex. `index.html:930`) et `index.html:1775` | L'action de don ne mène nulle part (`href="#"`). Sur mobile, le bouton se coupe sur 3 lignes et sort de l'écran. | `test-menu-mobile-index-390.png` | Créer un vrai parcours de don (page dédiée et prestataire), ou retirer le bouton en attendant. |
| 6 | Bloquant | Contenu | `about.html:991-995` vs `index.html:1795-1803`, `contact.html:139-157` | Coordonnées contradictoires. Siège à « Tour Administrative, Riviera, Abidjan » avec `+225 27 00 00 00 00` (numéro de remplissage) dans le pied de page de À propos ; siège à Ouagadougou ailleurs. E-mails : `contact@davycas.org`, `contact@davycas.com`, `contact@davycas-ngo.org`, plus une adresse gmail. Téléphones : `+226 25 34 12 50` et `+226 25 36 12 50`. | — | Valider une seule fiche officielle, l'appliquer partout (pied de page unique) et rendre les coordonnées cliquables (`mailto:`, `tel:`). |
| 7 | Bloquant | Contenu | `index.html:1548-1553` vs `about.html:938-942` | « DAVYCAS certifiée par NGO Source Canada » est daté du 28 février 2026 sur l'accueil et « Depuis 2021 » sur À propos. L'intitulé « Certifiée ONG caritative publique » est à vérifier : NGOsource délivre des *equivalency determinations*. | — | Vérifier le document original, corriger l'intitulé et la date, et lier une preuve. |
| 8 | Important | Bug, Liens | `index.html:1425` (carte SITEB vers `projets.html`), `siteb.html:474` (`index.html#produits` : ancre inexistante), `index.html:1527,1554,1566,1578,1774,1776,1836`, `projets.html:96,415-416,437`, `piliers.html:415`, `contact.html:250` | Liens morts ou mal ciblés : « Toutes les actus », « Lire la suite », « Devenir partenaire », « Nous contacter », « Actualités », « Rapports d'activité », « Contact » du pied de page. « Blog » pointe vers `#` dans les 12 menus. On compte entre 4 et 13 `href="#"` par page. | — | Corriger les cibles (`contact.html`, `siteb.html`, ajouter `id="produits"`), sinon retirer les liens. |
| 9 | Important | Conformité | `contact.html:277-278`, `about.html:1001-1002` | « Mentions légales » et « Politique de confidentialité » pointent vers `#`. Le site collecte des données et charge Google Translate, Maps et Fonts sans consentement (cookie `googtrans`). | — | Créer ces deux pages et ajouter un consentement devant la carte et la traduction. |
| 10 | Important | Contenu | `index.html:1752-1759`, `about.html:951-952`, `projets.html:391-398` | Partenaires (UNICEF, PAM, CDC Foundation, Gates Foundation…) cités en simple texte, sans preuve ni logo, avec des listes différentes selon les pages (« CDC Foundation » ou « CDC Atlanta »). | — | Ne garder que les partenariats documentés et autorisés, avec la même liste partout. |
| 11 | Important | Contenu | `index.html:1235,1847`, `contact.html:139,229`, `about.html:822-855`, `projets.html:230` | Pays incohérents : « Burkina, Niger, Mali » ; le pied de page ajoute la Côte d'Ivoire ; un « Bureau Mali » sur Contact, mais Mali « En cours » sur À propos ; le Sénégal sur À propos ; Cabo Verde sur SITEB. | — | Arrêter une liste officielle des pays avec leur statut. |
| 12 | Important | Contenu | `index.html:1539-1578`, `index.html:1505-1512` | Actualités datées de janvier à mars 2026, sans source ni page de détail, illustrées par des visuels génériques réutilisés. Chiffre non sourcé : « −40 % de délais ». Superlatifs : « adoptées par les plus grandes institutions », « transfert de compétences massif », « capacité unique ». | — | Publier des actualités réelles avec date, source et page, ou retirer la section. Sourcer ou nuancer les affirmations. |
| 13 | Important | Contenu, Marque | Pieds de page : `index.html:1846`, `about.html:999`, `piliers.html:426`, `projets.html:448` vs les autres pages ; `contact.html:285` | Le nom varie entre « DAVYCAS ONG Globale » et « DAVYCAS International ». Copyright © 2025 sur Contact, © 2026 ailleurs. Trois pieds de page différents (`site-footer`, `site-footer-v2`, `site-footer-full`). | — | Utiliser la raison sociale officielle et un pied de page unique. |
| 14 | Important | Vie privée | `about.html:483-486`, `siteb.html:415-419` | Publication de l'e-mail et du mobile du directeur, et de mobiles d'agents (helpdesk, ministère, La Poste). Le consentement n'est pas connu. | — | Vérifier les consentements, ou utiliser des adresses et lignes génériques. |
| 15 | Important | Sécurité, Crédibilité | `stelab.html:208-237`, `stelab.html:258` | La pile technique de STELab est publiée avec des versions en fin de vie (PHP 7.2, Zend Framework 3, VueJS 2). « Zéro perte d'échantillons » est une affirmation absolue. | — | Retirer les versions précises et nuancer l'affirmation. |
| 16 | Important | Sécurité, Code | Racine : `GUIDE_ANTIGRAVITY_DAVYCAS.md`, `add_i18n.py`, `add_i18n_pt2.py`, `add_weglot.py`, `remove_weglot.py` | Fichiers internes publiés : **vérifié en ligne**, `/GUIDE_ANTIGRAVITY_DAVYCAS.md` et `/add_i18n.py` répondent en 200. Aucun secret n'est exposé. | — | Ajouter un `.vercelignore`, ou déplacer ces fichiers hors du site publié. |
| 17 | Important | Performance | Accueil – `index.html:1134-1190`, galerie `1613-1732` | **30 Mo transférés sur mobile.** `person-office-work-day.jpg` pèse 17,5 Mo (7451 × 4967 px) ; `black-female-researcher…jpg` 5,3 Mo ; `Image/Helpdesk DSRE Niger.jpg` 3,3 Mo (7560 × 6617 px) ; `Oeuvre Social.png` 3,5 Mo pour une vignette ; `Logo STELab.png` 0,9 Mo. Lighthouse estime le gain à 19,9 Mo (formats modernes) et 24 Mo (images adaptées à l'écran). | `lighthouse/lh-mobile-index.report.html` | Exporter en WebP ou AVIF (1920 px maximum pour le hero, 800 px pour les cartes), avec `srcset`, `sizes`, `width` et `height`. |
| 18 | Important | Performance | Accueil, À propos | Temps de blocage (TBT) de 2 240 ms et 2 120 ms ; interactivité à 15,1 s sur l'accueil. Google Translate est chargé sur chaque page sans clic (`js/i18n.js:22-24`). Font Awesome complet est chargé sans SRI, en deux versions (6.5.0 et 6.5.1). | `lighthouse/` | Charger la traduction au clic, ou créer de vraies pages EN. Limiter les icônes à un sous-ensemble SVG. Ajouter `preconnect` pour les polices. |
| 19 | Important | Performance | `interventions-*.html:149`, `piliers.html:145` | Images de hero visibles au chargement mais en `loading="lazy"` (affichage principal retardé). | — | `loading="eager"` et `fetchpriority="high"` sur l'image du hero. |
| 20 | Important | Accessibilité | `index.html:1139,1156,1173,1190` | 4 `<h1>` sur l'accueil (un par diapositive). La hiérarchie des titres saute des niveaux sur toutes les pages (h2 → h4 ou h6, `h5` dans les pieds de page). | — | Un seul `h1`. Utiliser `h3` sous `h2`, et des `<p>` stylés dans les pieds de page. |
| 21 | Important | Accessibilité (WCAG 1.4.3) | Bouton principal du hero (`index.html:1074-1076`), `.label-v2` sur fond clair (`index.html:342`), bas du pied de page (`index.html:819`) | Contrastes mesurés : blanc sur `#469cb0` = 3,16:1 ; libellés turquoise de 11 px sur fond clair ≈ 2,9:1 ; bas du pied de page = 2,65:1. Le seuil est de 4,5:1. | `lighthouse/lh-mobile-index.report.html` | Foncer le turquoise pour le texte (≈ `#2f7f91`) ou mettre un texte sombre sur turquoise. Remonter l'opacité du pied de page. |
| 22 | Important | Accessibilité (WCAG 2.2.2) | `index.html:1855-1897`, `style.css:3342`, Ken Burns `index.html:320`, `style.css:2050`, `css/piliers.css:431` | Le carrousel du hero défile toutes les 7 s sans bouton pause : la pause ne se fait qu'au survol de la souris, et l'autoplay ignore `prefers-reduced-motion`. Les bandeaux défilants et le zoom lent tournent sans fin. | — | Ajouter un bouton Pause et couper l'autoplay et les animations quand `prefers-reduced-motion: reduce` est actif. |
| 23 | Important | Accessibilité (WCAG 2.1.1, 4.1.2) | FAQ `piliers.html:347…` (`<div class="faq-header">`), filtres `projets.html:149-155` (`<div>`), points du carrousel `index.html:1929`, hamburger sans nom (`index.html:933`), icônes sociales sans nom (`contact.html:165-168`), iframe sans `title` (`contact.html:233`) | Éléments interactifs inaccessibles au clavier ou sans nom accessible. Les filtres de Projets ne filtrent rien. | — | Utiliser des `<button>` avec `aria-expanded` ou `aria-pressed`, ajouter des `aria-label` et un `title` sur l'iframe. Implémenter le filtre ou le retirer. |
| 24 | Important | Accessibilité (WCAG 2.4.11) | Menus déroulants – `index.html:883-919` | **Testé au clavier** : la tabulation passe sur les 5 liens « Interventions » alors que le menu reste invisible (`visibility:hidden` mesuré). Le focus se pose sur des éléments que l'on ne voit pas. | `test-focus-clavier-1440.png` | Déclencheurs en `<button aria-expanded>`, avec les liens hors de l'ordre de tabulation tant que le menu est fermé. |
| 25 | Important | Accessibilité (WCAG 3.3.2) | `index.html:1809-1812` | Les champs du formulaire d'accueil n'ont que des placeholders, sans label. `outline:none` sur les champs (`index.html:805`, `css/contact.css:299`). | — | Ajouter des `<label>` et un style `:focus-visible` marqué. |
| 26 | Important | UI, Charte | `GUIDE_ANTIGRAVITY_DAVYCAS.md:48-58` vs `index.html:11-29`, `style.css`, `css/interventions.css` | La charte du guide (`#48B6CF`, `#6B61A8`) n'est pas appliquée : le code utilise `#469cb0` et `#625a9a`, avec au moins 6 systèmes de variables parallèles et plus de 40 couleurs en dur. Variables utilisées mais jamais définies : `--card-glass` (les `.value-card` de l'accueil n'ont donc pas de fond), `--accent-cyan`, `--color-border-soft`, `--color-card-bg`, `--radius-pill`, `--shadow-premium`. La police Outfit est utilisée dans `style.css:38,413,1406,1649` sans jamais être chargée. | — | Créer un seul fichier de tokens conforme à la charte validée et y définir toutes les variables. Charger Outfit ou la retirer. |
| 27 | Important | SEO | `index.html`, `about.html`, `projets.html` (head) ; les 12 pages | Pas de `meta description` sur l'accueil, À propos et Projets. Aucune page n'a d'Open Graph, de `canonical`, de JSON-LD `NGO`/`Organization` ni de favicon. **Vérifié en ligne : `/robots.txt`, `/sitemap.xml` et `/favicon.ico` répondent en 404.** | `lighthouse/` | Ajouter ces balises et fichiers, dont un JSON-LD `NGO` avec l'adresse validée. |
| 28 | Important | Contenu | `piliers.html:145`, `stelab.html:343`, `index.html:1151,1168` | Photos de banque d'images présentées comme « Équipe DAVYCAS » ou « Equipe Support DAVYCAS ». Les mêmes visuels générés (`*_v1_<timestamp>.png`) sont réutilisés pour les projets, les piliers et les actualités. | — | Utiliser les vraies photos (dossier `Image/`), mettre des alt neutres et créditer les photos de banque. |
| 29 | Mineur | Bug | Toutes les pages | Aucune page 404 personnalisée : **vérifié en ligne**, c'est la page 404 de Vercel, en anglais. | `test-404-1440.png` | Créer `404.html` dans la charte, avec des liens utiles. |
| 30 | Mineur | Code | `index.html` (1 994 lignes, environ 1 000 de CSS inline), `about.html:83,287,529`, `index.html:942` | Des blocs `<style>` dans le body, de nombreux `style=""` inline, et un en-tête et un pied de page copiés dans 12 fichiers. Pas de `<main>` sur À propos ni Projets. 5 règles `.hamburger` contradictoires et du CSS mort (`.header-nav`, `.hero-premium`). | — | Factoriser l'en-tête et le pied de page (include ou petit générateur statique), et regrouper le CSS. |
| 31 | Mineur | Code | `index.html:1969-1973` | Au redimensionnement, le carrousel d'actualités revient à 0 et reconstruit les points à chaque événement `resize` (y compris le défilement sur mobile, quand la barre d'adresse change de hauteur). | — | Ajouter un délai (debounce) et ne recalculer que si le nombre de cartes visibles change. |
| 32 | Mineur | Code, Performance | Racine | `Background hero.png` et `background_hero.png` sont identiques (1,5 Mo chacun). Des images ne sont pas référencées (`DG.png` 1,4 Mo, `siteb_hero.png`, `hero_homepage_davycas_v1_…png`, `media__1773178404080.png`). Des noms de fichiers contiennent des espaces (`Image/…`, `.JPG` en majuscules). Dépôt de 136 Mo. | — | Supprimer les doublons et les fichiers inutilisés, et renommer en kebab-case minuscule. |
| 33 | Mineur | UX | `contact.html:197-216`, `contact.html:234` | « Email professionnel » et « Organisation » sont obligatoires, ce qui freine un particulier ou un donateur. La carte pointe sur un Ouagadougou générique, pas sur l'adresse du siège. | — | Rendre ces champs facultatifs et pointer la carte sur l'adresse réelle. |
| 34 | Mineur | Contenu | `about.html:268`, `index.html:1303`, `stelab.html:343`, `index.html:1540`, `about.html:890`, `piliers.html:138` | « états » au lieu de « États ». « Equipe » sans accent. Formulation maladroite : « Un cap franchi stratégique ». « Certification annuelle A133 » : la circulaire est remplacée depuis 2014 (2 CFR 200, Subpart F). « 10+ projets » alors que la page Projets en liste 8. | — | Relire et mettre à jour. |
| 35 | Mineur | Accessibilité | `index.html:834`, `css/contact.css:503`, `interventions-*.html:52-55`, `js/piliers.js:58-64` | Les contenus `.reveal` et `.scroll-reveal` restent invisibles si le JS ne s'exécute pas. La parallaxe du hero ignore `reduced-motion`. Pas de lien d'évitement (« Aller au contenu »). | — | Conditionner les animations à une classe `js` et à `prefers-reduced-motion`, et ajouter un lien d'évitement. |
| 36 | Mineur | i18n | `js/i18n.js`, `add_i18n.py` | La traduction EN passe par le widget Google Translate (service ancien), avec une traduction automatique non relue. Les attributs `data-i18n` ne sont lus par aucun script (code mort). **Testé : la bascule FR/EN fonctionne.** | — | Si l'anglais est stratégique pour les bailleurs, créer de vraies pages EN relues. |

**Sécurité (skill `security-review`)** : il n'y a pas de diff à examiner (branche identique à `origin/main`). L'analyse du code existant ne trouve **aucune vulnérabilité exploitable** : pas de backend, aucune donnée utilisateur réinjectée dans la page, les `innerHTML` ne contiennent que des chaînes statiques, aucune clé ni aucun token. Les points de sécurité retenus (n° 14, 15 et 16, scripts tiers sans SRI) relèvent de l'hygiène et de la vie privée, pas d'une faille. Le site renvoie bien `Strict-Transport-Security`, mais pas `Content-Security-Policy`, `X-Content-Type-Options` ni `Referrer-Policy` (à ajouter dans `vercel.json`).

---

## 3. Scores mesurés (17 novembre 2026)

### Lighthouse 12.2.1, profil mobile (émulation 4G lente et CPU ralenti), site en ligne

| Page | Performance | Accessibilité | Bonnes pratiques | SEO | FCP | LCP | TBT | CLS | Speed Index | Poids |
|---|---|---|---|---|---|---|---|---|---|---|
| Accueil | **33** | 86 | 96 | 83 | 4,6 s | 5,6 s | 2 240 ms | 0 | 14,3 s | **30,1 Mo** |
| À propos | 55 | 87 | 96 | 91 | 1,7 s | 3,9 s | 2 120 ms | 0 | 5,6 s | 4,7 Mo |
| Projets | 93 | 85 | 93 | 83 | 1,9 s | 2,9 s | 70 ms | 0 | 3,3 s | 2,6 Mo |
| Contact | 67 | 84 | 96 | 100 | 3,7 s | 6,8 s | 40 ms | 0 | 4,4 s | 1,3 Mo |
| STELab | non mesuré | – | – | – | – | – | – | – | – | – |

- **STELab** : Lighthouse s'est arrêté deux fois (`CHROME_INTERSTITIAL_ERROR`), alors que la page s'affiche normalement dans Chrome. Elle référence environ 19 Mo d'images (dont la photo de 17,5 Mo), ce qui laisse attendre un score proche de celui de l'accueil. À remesurer.
- **Rapports complets** : `qa/audit/2026-11-17/lighthouse/*.report.html`.

### Autres mesures

| Mesure | Résultat |
|---|---|
| Débordement horizontal à 390 px | 11 pages sur 12. Largeurs mesurées : Projets 906 px, Système d'information 831, À propos 667, STELab, SITEB et Interventions 616, Piliers 466, Accueil 415. Seule Contact est conforme. |
| Débordement à 768 px | Projets (930 px) et Système d'information (855 px) |
| Menu mobile (390 px, testé en ligne) | Ne s'ouvre sur aucune page testée (accueil, À propos, Contact) |
| Formulaires (testés en ligne) | Contact : faux succès, aucune requête. Accueil : rechargement `/?`, aucune donnée transmise. |
| Navigation clavier (1440 px) | Focus visible (contour du navigateur), mais il se pose sur des liens de menus invisibles |
| Bascule FR/EN | Fonctionne (Google Translate) |
| Page 404 | 404 de Vercel en anglais |
| `robots.txt`, `sitemap.xml`, `favicon.ico` | 404 |
| En-têtes HTTP | HSTS présent ; pas de CSP, `X-Content-Type-Options` ni `Referrer-Policy` |
| Polices | Inter (4 graisses) et Sora (700 et 800) via Google Fonts avec `display=swap`. Outfit utilisée sans être chargée. Font Awesome complet (environ 100 Ko de CSS et des webfonts) chargé deux fois sur certaines pages. |
| Console | Erreur 404 de ressource (favicon) sur toutes les pages. Erreur JS au clic du hamburger sur À propos et Projets. |

**Limite des captures** : les captures pleine page (`local-*`, `live-*`) peuvent montrer des blocs vides ou décalés. C'est un artefact de capture, dû aux sections en `100vh` et aux animations d'apparition au défilement. Les captures `test-*`, prises à la taille de l'écran, et les mesures chiffrées ci-dessus font foi.

---

## 4. Ce qui fonctionne bien et doit être conservé

- **Identité visuelle forte et cohérente sur desktop** : fond sombre premium, accents turquoise et violet, typographies Sora et Inter. Le site ne ressemble pas à un template générique.
- **Message de l'accueil clair en 5 secondes** : « Renforcer la santé publique en Afrique de l'Ouest », complété par « Surveillance, laboratoires, données et appui terrain ».
- **Contenu métier riche et crédible** sur les pages STELab, SITEB et Interventions : rôles des acteurs, fonctionnement, conditions de transport.
- **La galerie « DAVYCAS en action »** utilise de vraies photos de terrain légendées. C'est la meilleure preuve d'impact du site. Le doublon de défilement est bien en `aria-hidden` avec `alt=""`.
- **Bonnes bases techniques** : `lang="fr"` partout, un `<title>` distinct par page, tous les `alt` présents, aucun lien vers un fichier manquant et aucune erreur de casse, aucun secret dans le code, HTTPS et HSTS.
- **Le formulaire de la page Contact** a de vrais `<label for>`, des champs `type="email"` et `required`. Il ne lui manque qu'un vrai envoi.
- **Accessibilité partielle déjà en place** : `:focus-within` sur les menus, `aria-label` sur les boutons des carrousels, `prefers-reduced-motion` respecté pour la galerie et les transitions du hero, aucun décalage de mise en page (CLS = 0).
- **Section gouvernance** (audit organisationnel 2020, coaching Swiss TPH, manuel de procédures, plan stratégique 2024-2028) : un excellent levier de transparence, à compléter par des documents téléchargeables.
- Le guide `GUIDE_ANTIGRAVITY_DAVYCAS.md` formalise une charte et des règles saines (mobile-first, grille de 8 px, contrastes). Il faut l'appliquer, et le sortir du site publié.

---

## 5. Questions pour l'ONG

1. **Cibles et action principale** : qui faut-il convaincre en priorité (bailleurs et fondations, ministères, partenaires techniques, grand public, presse) ? Quelle est l'action n° 1 attendue : don, prise de contact institutionnelle, ou candidature ?
2. **Dons** : DAVYCAS peut-elle collecter des dons en ligne ? Avec quel prestataire (HelloAsso, Stripe, PayPal, virement) et quel cadre fiscal (reçus) ? Sinon, faut-il retirer le bouton ?
3. **Charte graphique officielle** : existe-t-il un logo vectoriel (SVG) et des couleurs et polices validées ? Lesquelles font foi : `#469cb0` / `#625a9a` (le site) ou `#48B6CF` / `#6B61A8` (le guide) ?
4. **Coordonnées officielles** : quelle adresse de siège, quel e-mail (domaine `.org`, `.com` ou `davycas-ngo.org`) et quel téléphone ? Existe-t-il réellement un bureau à Abidjan ou à Bamako ?
5. **Pays d'intervention** : quelle liste exacte, avec leur statut (actif, en cours, ponctuel) ? Burkina Faso, Niger, Mali, Côte d'Ivoire, Sénégal, Cabo Verde ?
6. **NGOsource** : quelle date et quel intitulé exacts ? Peut-on publier ou lier le justificatif ?
7. **Partenaires** : quels partenariats ou financements sont documentés, et l'usage des noms et logos est-il autorisé (UNICEF, PAM, CDC Foundation ou CDC Atlanta, Gates Foundation, WAHO, VillageReach, ASLM, Fondation Mérieux, OMS, Swiss TPH) ?
8. **Transparence** : rapports d'activité, états financiers audités, composition du conseil d'administration : lesquels peuvent être publiés ?
9. **Actualités** : les 4 actualités de 2026 sont-elles réelles ? Qui alimentera le blog et à quel rythme ? Sinon, faut-il retirer la section ?
10. **Chiffres d'impact** : peut-on fournir des chiffres sourcés (échantillons tracés, laboratoires équipés, agents formés, districts couverts) et des témoignages de partenaires ?
11. **Données personnelles** : les personnes dont le mobile ou l'e-mail est publié (directeur, agents de La Poste, ministère) ont-elles donné leur accord ?
12. **Photos** : les photos de banque d'images ont-elles une licence ? Les personnes photographiées sur le terrain ont-elles consenti à leur publication ?
13. **Réseaux sociaux** : quelles URL pour LinkedIn, X, Facebook et YouTube, ou faut-il retirer ces icônes ?
14. **Langues** : la version anglaise est-elle importante pour les bailleurs ? Si oui, une traduction professionnelle est recommandée à la place de Google Translate.
15. **Domaine et hébergement** : le site restera-t-il sur `davycas.vercel.app` ou passera-t-il sur un domaine propre (`davycas.org` ?) ? Ce choix conditionne les URL canoniques, le sitemap et les e-mails.
16. **Formulaires** : où les messages doivent-ils arriver (boîte e-mail, CRM), et qui y répond ?

---

## Résumé en 10 lignes

1. Le site a une identité visuelle forte et un contenu métier solide, mais il est **inutilisable sur mobile** et **ses actions clés ne fonctionnent pas**.
2. **Formulaires factices** : Contact affiche « Message envoyé ! » sans rien envoyer, et le formulaire d'accueil perd la demande.
3. **Pas de menu sous 1024 px** : le hamburger est inactif (une alerte de développement s'affiche sur Contact), et 11 pages sur 12 débordent horizontalement à 390 px.
4. **« Faire un don » et la plupart des appels à l'action** (partenaire, contact, blog, réseaux, mentions légales) pointent vers `#`.
5. **Coordonnées, pays, partenaires et certification contradictoires ou non sourcés** : risque direct pour la crédibilité auprès des bailleurs.
6. **Accueil à 30 Mo** sur mobile : performance Lighthouse 33/100, Speed Index 14,3 s, une photo de 17,5 Mo.
7. Accessibilité de 84 à 87/100 : contrastes faibles, 4 `h1`, carrousel sans pause, focus sur des menus invisibles.
8. SEO incomplet : descriptions manquantes, pas d'Open Graph, de JSON-LD `NGO`, de sitemap, de robots.txt ni de favicon, et une page 404 Vercel en anglais.
9. Sécurité : aucune faille exploitable, mais des fichiers internes et des numéros personnels sont publiés.
10. Ordre conseillé : formulaires et coordonnées, puis menu mobile et grilles responsives, puis parcours de don, puis compression des images, puis validation des contenus par l'ONG (questions de la section 5).
