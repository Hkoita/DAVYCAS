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

## Règles de contenu
1. **Ne jamais inventer de faits** : chiffres d'impact, partenaires, témoignages, montants, dates, certifications.
   Tout manque est marqué `[À CONFIRMER]`, listé dans `docs/contenu-manquant.md`, et n'est jamais publié tel quel.
2. **Vraies photos de l'ONG** pour les personnes et le terrain. Jamais de photo de banque d'images présentée comme l'ONG.
3. Pas de superlatifs sans preuve. Pas d'emojis.
4. Coordonnées, pays d'intervention et nom officiel : une seule source (voir `docs/contenu-manquant.md` tant que non validés).

## Règles de design
1. **Aucune valeur de design en dur** : couleurs, typos, espacements, rayons, ombres et durées viennent de
   `design/tokens.json`, compilé en variables CSS. Pas de `style=""` inline.
2. Charte : respecter le logo DAVYCAS (bleu marine) et la palette validée (voir `docs/decisions.md`).
3. Interdits : dégradés violets, effet « SaaS », grilles de 3 icônes génériques, cartes identiques,
   carrousels hors du héros.
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
