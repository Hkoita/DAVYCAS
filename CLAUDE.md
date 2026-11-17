# DAVYCAS International — règles permanentes du projet

Site institutionnel de DAVYCAS International, ONG de santé publique en Afrique de l'Ouest
(surveillance épidémiologique, laboratoire, systèmes d'information sanitaire, logistique).

## Hébergement et déploiement
- Code : GitHub `Hkoita/DAVYCAS`. Production : hébergement LWS, domaine **davycas.com**.
- Tout push sur `main` déclenche `.github/workflows/deploy-lws.yml` (FTP vers LWS) : **c'est une mise en production**.
- Vercel (`davycas.vercel.app`) se redéploie aussi depuis GitHub (aperçu secondaire).
- LWS place un cache serveur devant le site : après un déploiement, vider le cache dans le panneau LWS.
- Ne jamais pousser sur GitHub sans l'accord explicite du propriétaire. La refonte se fait sur la branche `refonte`.
- Ne jamais toucher aux enregistrements DNS de messagerie (MX, `mail`, SPF) chez LWS.

## Règles de contenu (décision du propriétaire, 17/11/2026)
1. **Tout le contenu texte du site d'origine est repris**, page par page, aux mêmes adresses (`index.html`, `about.html`…).
   Ne jamais inventer de faits ; les incohérences du contenu d'origine sont listées dans `docs/contenu-manquant.md`.
2. **Site bilingue** : tout texte visible s'écrit `[[Texte français]]` dans `src/`, sa traduction va dans `src/i18n/en.json`.
   La génération échoue s'il manque une traduction. Version anglaise sous `/en/`.
3. Les images du site d'origine sont conservées ; les vraies photos de terrain sont dans `src/images/terrain/`.
4. Pas d'emojis.

## Règles de design
1. **Aucune valeur de design en dur** : couleurs, typos, espacements, rayons, ombres et durées viennent de
   `design/tokens.json`, compilé en variables CSS. Pas de `style=""` inline.
2. Charte : celle du site d'origine (violet `#625a9a`, turquoise `#469cb0`, fond nuit adouci `#191935`),
   **police unique Montserrat**, rendu inspiré d'Apple. Photos du héros bien visibles (voile seulement derrière le texte).
3. Carrousel automatique uniquement dans le héros d'accueil (avec pause) ; galeries horizontales manuelles.
4. Toute animation s'arrête avec `prefers-reduced-motion`. Tout le contenu reste lisible sans JavaScript.
5. Mobile-first. Aucun débordement horizontal à 390 px.

## Qualité exigée
- Lighthouse mobile ≥ 90 sur les quatre scores, LCP < 2,5 s, zéro erreur console, WCAG 2.2 AA.
- Images en AVIF/WebP avec `srcset`, 200 Ko maximum par image. Polices auto-hébergées.
- Après chaque section : captures 390, 768 et 1440 px dans `qa/`, critique, correction, puis la suite.
- Les dossiers `qa/` et `docs/` ne sont pas publiés (exclus du déploiement).

## Journal
- Chaque choix structurant est consigné dans `docs/decisions.md`.
- L'audit de départ est `docs/audit.md` : chaque anomalie doit être corrigée ou justifiée.
