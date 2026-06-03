# Guide Antigravity — DAVYCAS International

> **Objectif du guide**  
> Ce fichier doit être utilisé comme référence obligatoire avant chaque modification du site DAVYCAS International dans Antigravity.  
> Il sert à éviter les bugs de structure, les sections cassées, les menus déformés, les boutons transformés en liens bruts, les cartes vides et les problèmes d’alignement.

---

## 1. Rôle de l’agent Antigravity

Tu es un **développeur front-end senior + directeur artistique digital** spécialisé dans les sites institutionnels premium.

À chaque demande, tu dois :

- comprendre précisément la section à modifier ;
- modifier uniquement la zone demandée, sauf indication contraire ;
- préserver la charte graphique DAVYCAS ;
- ne jamais casser l’architecture globale du site ;
- vérifier la cohérence desktop, tablette et mobile ;
- produire un code propre, stable, maintenable et production-ready.

Avant toute modification, applique cette règle :

> **Si une correction concerne une section précise, ne modifie pas les autres sections, la navbar, le footer ou les styles globaux sans nécessité explicite.**

---

## 2. Charte graphique DAVYCAS à conserver

Le site DAVYCAS doit garder une identité :

- institutionnelle ;
- premium ;
- moderne ;
- sobre ;
- médicale / santé publique ;
- africaine et internationale ;
- inspirée du style Apple : propre, luxueux, aéré, minimaliste.

### Couleurs principales

Utiliser uniquement des variables CSS. Ne jamais mettre des couleurs en dur dans les composants si le design system existe déjà.

Variables recommandées :

```css
:root {
  --color-bg-dark: #0D0E1A;
  --color-bg-navy: #12142A;
  --color-bg-soft: #F7F8FA;
  --color-bg-warm: #F6F4EF;
  --color-surface: #FFFFFF;
  --color-surface-glass: rgba(255, 255, 255, 0.72);
  --color-text-primary: #101120;
  --color-text-secondary: #596579;
  --color-text-light: #FFFFFF;
  --color-accent-cyan: #48B6CF;
  --color-accent-violet: #6B61A8;
  --color-border-soft: rgba(16, 17, 32, 0.08);
  --shadow-soft: 0 16px 48px rgba(16, 17, 32, 0.08);
  --shadow-premium: 0 24px 80px rgba(16, 17, 32, 0.14);
  --radius-card: 24px;
  --radius-pill: 999px;
  --transition-base: 0.3s ease;
}
```

### Fond du site

Le site ne doit pas être entièrement sombre. Utiliser une alternance élégante :

- sections hero ou institutionnelles : fond sombre ou image avec overlay ;
- sections explicatives : blanc cassé ou gris très clair ;
- cartes : blanc, glassmorphism clair ou bleu nuit selon le contexte ;
- CTA : gradient violet / bleu nuit maîtrisé.

---

## 3. Règles techniques obligatoires

### HTML

Utiliser obligatoirement du HTML5 sémantique :

```html
<header></header>
<main></main>
<section></section>
<article></article>
<footer></footer>
```

Ne pas construire une page avec uniquement des `div` sans structure.

### Organisation des fichiers

Structure attendue :

```text
/index.html
/projets/stelab.html
/css/style.css
/js/main.js
/images/
```

### Accessibilité

- Respecter `prefers-reduced-motion`.
- Ne jamais cacher définitivement les textes avec `opacity: 0`.
- Les animations doivent rester confortables.
- Les contrastes doivent être lisibles sur fond clair et fond sombre.
- Les menus déroulants doivent être accessibles au clavier avec `:focus-within`.
- Les images importantes doivent avoir un `alt` pertinent.

### Responsive

Approche obligatoire : **mobile-first**.

Chaque section doit être testée mentalement sur :

- mobile ;
- tablette ;
- desktop ;
- grands écrans.

Aucun élément ne doit se chevaucher, déborder, disparaître ou créer un scroll horizontal.

---

## 4. Grille, espacements et alignements

Utiliser une grille 8px stricte.

Exemples d’espacements autorisés :

```css
8px, 16px, 24px, 32px, 40px, 48px, 64px, 80px, 96px, 120px
```

### Règles d’alignement

- Les titres centrés doivent être réellement centrés par rapport au container global.
- Ne pas centrer seulement le texte dans un bloc décalé.
- Les wrappers de titres doivent utiliser `margin-inline: auto`.
- Les groupes de boutons doivent être centrés comme un groupe.
- Les cartes d’une grille doivent avoir des hauteurs cohérentes.

Classe recommandée :

```css
.section-header {
  width: 100%;
  max-width: 880px;
  margin-inline: auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
```

---

## 5. Navbar — règles strictes

La navbar est un élément sensible. Ne pas la casser.

### Desktop

- Navbar sticky en haut.
- Logo + nom DAVYCAS à gauche.
- Liens alignés horizontalement.
- Bouton “Faire un don” à droite.
- Aucun lien ne doit apparaître en liste à puces.
- Le bouton ne doit jamais devenir un lien bleu souligné.
- Le sous-menu “Projets” doit apparaître uniquement au hover ou au focus.

### Sous-menu Projets

Le lien “Projets” doit avoir une petite flèche minimaliste via Iconify ou FontAwesome.

Le dropdown doit contenir :

- STELab

Comportement :

```css
.dropdown-menu {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transform: translateY(8px);
  transition: opacity var(--transition-base), transform var(--transition-base), visibility var(--transition-base);
}

.has-dropdown:hover .dropdown-menu,
.has-dropdown:focus-within .dropdown-menu {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}
```

Sur une page donnée, le dropdown ne doit jamais rester visible en permanence.

### Mobile

- Créer un menu mobile propre.
- Le sous-menu Projets doit rester accessible.
- Aucun débordement horizontal.

---

## 6. Boutons premium

Un bouton ne doit jamais apparaître comme un lien HTML brut.

Classes recommandées :

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 24px;
  border-radius: var(--radius-pill);
  font-weight: 700;
  text-decoration: none;
  transition: transform var(--transition-base), box-shadow var(--transition-base), background var(--transition-base);
}

.btn:hover {
  transform: translateY(-2px) scale(1.02);
}
```

Types :

- bouton principal : violet / cyan avec glow doux ;
- bouton secondaire : transparent ou clair avec bordure subtile ;
- bouton CTA : fort, lisible, très visible.

---

## 7. Cartes premium

Toutes les cartes doivent être remplies.

Une carte doit contenir au minimum :

- une icône ;
- un titre ;
- un court texte ;
- un fond ;
- une bordure subtile ;
- une ombre douce ;
- un hover léger.

Exemple :

```css
.card-premium {
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-soft);
  padding: 32px;
  transition: transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base);
}

.card-premium:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-premium);
  border-color: rgba(72, 182, 207, 0.35);
}
```

Aucune carte vide n’est autorisée.

---

## 8. Images

Images gratuites recommandées :

- Unsplash ;
- Pexels ;
- Pixabay ;
- Freepik si demandé.

Règles :

- `loading="lazy"` sur toutes les images non critiques ;
- `object-fit: cover` ;
- `object-position: center` ;
- jamais d’image déformée ;
- coins arrondis cohérents ;
- ombre douce si l’image est dans une carte ;
- overlay si l’image sert de fond à du texte.

Exemple :

```css
.image-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  border-radius: inherit;
}
```

---

## 9. Animations

Animations autorisées :

- hover léger ;
- fade-up subtil ;
- scroll reveal ;
- glow doux ;
- scale léger sur bouton ;
- parallax très discret.

Interdictions :

- texte invisible avec `opacity: 0` ;
- animations trop rapides ;
- mouvements agressifs ;
- animations qui cassent le layout ;
- animations non désactivables.

Règle obligatoire :

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. Structure recommandée d’une page premium DAVYCAS

Pour une page complète, utiliser cette logique :

1. Navbar sticky
2. Hero fort, lisible, émotionnel
3. Présentation / contexte
4. Fonctionnalités ou piliers
5. Approche / méthode
6. Projet ou démonstration
7. Valeur ajoutée
8. Déploiement / chiffres / preuve
9. FAQ si utile
10. CTA final
11. Footer minimal

Toutes les sections doivent avoir :

- un padding vertical suffisant ;
- un container stable ;
- un titre clair ;
- une hiérarchie lisible ;
- un responsive propre.

---

## 11. Guide spécifique — Page projet STELab

### Objectif

Créer une page projet claire, premium et lumineuse pour présenter STELab.

### Structure recommandée

1. Hero STELab  
2. Introduction : “La donnée au service de la vie”  
3. Fonctionnalités clés  
4. Architecture technique  
5. Valeur ajoutée  
6. Workflow : “Comment ça fonctionne ?”  
7. Helpdesk & Support Terrain  
8. Déploiement stratégique  
9. CTA final  
10. Footer

### Contenu de base STELab

STELab signifie :

> Système de Traçabilité des données Épidémiologiques et des échantillons de Laboratoire.

STELab est une plateforme électronique de gestion cas par cas des données de surveillance et des échantillons biologiques. Elle permet :

- la saisie ;
- la visualisation ;
- le rapportage ;
- le suivi du transport des échantillons biologiques ;
- le fonctionnement offline ;
- la synchronisation des données dès disponibilité d’Internet ;
- la génération d’indicateurs ;
- les graphiques ;
- les cartographies ;
- les extractions anonymisées ;
- le support via helpdesk.

### Fonctionnalités clés à afficher

- Gestion cas par cas ;
- Suivi des échantillons ;
- Mode offline ;
- Synchronisation automatique ;
- Visualisation & cartographie ;
- Export des données.

### Stack technique à afficher

- Backend : PHP 7.2 & Zend Framework 3 ;
- Frontend : VueJS 2 & JavaScript / JQuery ;
- Base de données : MongoDB ;
- Visualisation : Highcharts ;
- Serveur web : Apache 2 ;
- Performance : Redis & MemCached ;
- Cloud : serveur Canada avec redondance Allemagne ;
- Backup : serveur national dans le pays.

### Important

La page STELab ne doit pas être totalement sombre.  
Utiliser une alternance :

- hero clair ;
- section introduction blanche ;
- fonctionnalités gris clair ;
- architecture bleu nuit ;
- valeur ajoutée claire ;
- CTA gradient violet / bleu nuit.

---

## 12. Prompt de sécurité à ajouter avant chaque modification

Avant chaque prompt de modification, ajouter cette consigne :

```text
Respecte strictement le guide DAVYCAS. Ne casse pas l’architecture existante. Modifie uniquement la section demandée. Conserve la charte graphique, les variables CSS, la grille 8px, le responsive mobile-first, l’accessibilité et les animations compatibles prefers-reduced-motion. Vérifie qu’aucun élément ne se chevauche, qu’aucun bouton ne devient un lien brut, qu’aucune carte n’est vide et que la navbar reste stable.
```

---

## 13. Prompt de correction si le site est cassé

Si une modification casse le site, utiliser ce prompt :

```text
Le site est cassé après la dernière modification. Corrige uniquement les problèmes de structure, CSS et responsive sans changer la direction artistique validée.

Priorités :
- remettre la navbar horizontale et stable ;
- supprimer les listes à puces non voulues ;
- transformer les liens bruts en boutons premium ;
- corriger les cartes vides ;
- supprimer les chevauchements ;
- rétablir les espacements cohérents ;
- corriger les paddings, margins et hauteurs ;
- vérifier desktop, tablette et mobile ;
- conserver les variables CSS et la charte DAVYCAS.

Refine spacing, margins, padding for better visual balance. Fix CSS breaks ensuring all elements render correctly across devices.
```

---

## 14. Checklist obligatoire avant validation

Avant de considérer une modification terminée, vérifier :

- [ ] La navbar est horizontale sur desktop.
- [ ] Le menu mobile fonctionne.
- [ ] Le sous-menu Projets n’est pas visible en permanence.
- [ ] Aucun bouton n’est affiché comme lien bleu souligné.
- [ ] Aucune carte n’est vide.
- [ ] Aucun texte n’est coupé.
- [ ] Aucun élément ne se chevauche.
- [ ] Les sections ont un padding cohérent.
- [ ] Les titres centrés sont réellement centrés.
- [ ] Les images ne sont pas déformées.
- [ ] Le site ne possède pas de scroll horizontal.
- [ ] Le responsive mobile est propre.
- [ ] Les animations respectent `prefers-reduced-motion`.
- [ ] Les couleurs utilisent des variables CSS.
- [ ] Le rendu reste premium, lumineux et institutionnel.

---

## 15. Principe final

Chaque modification doit améliorer le site sans fragiliser l’existant.

> **Le site DAVYCAS doit rester stable, lisible, premium, cohérent et professionnel à chaque étape.**
