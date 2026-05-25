---
name: lucid-lab-brand
description: Applique l'identité visuelle et le ton de voix Lucid-Lab — couleurs, typographie, principes de mise en page et copywriting. À utiliser pour toute production (slides, documents, pages web, livrables clients, posts) qui doit porter la marque Lucid-Lab. Direction "neutre et design" inspirée Nextra : sobre, opérationnelle, sans posture de cabinet conseil.
---

# Lucid-Lab — Brand & Style Guide

Lucid-Lab est un partenaire de transformation opérationnelle IA. Pas un cabinet conseil. La marque construit, ne conseille pas. L'identité visuelle reflète cela : sobre, dense, lisible, sans effets décoratifs. Inspiration : Nextra, Vercel docs, Linear — clarté éditoriale + restraint.

**Mots-clés** : lucid-lab, brand, identité visuelle, typographie, charte, copywriting, livrables clients, slides, présentation, document, site, post

---

## Tone of Voice

### Principes
- **Action > promesse** : décrire ce qui est livré, pas ce qui pourrait l'être.
- **Subtil > brutal** : la marque originale est brutaliste, la nouvelle direction reste directe mais s'adoucit.
- **Opérationnel > stratégique** : éviter le vocabulaire de cabinet (« optimiser », « accompagner », « roadmap », « vision »). Préférer (« livrer », « mettre en place », « brancher », « mesurer »).
- **Concret > abstrait** : un chiffre, un délai, un nom d'outil battent une généralité.
- **Première personne pluriel** : « on construit », « on livre ». Jamais « nos experts ».

### Phrases-signatures (à utiliser avec parcimonie)
- « On ne conseille pas. On construit. »
- « Preuve par l'action. »
- « Zéro PowerPoint. »
- « Aucune dépendance. »
- « Pas de promesses, un véritable levier d'action. »

### À éviter
- Jargon consultant : *synergies, leverage, alignement stratégique, transformation, accompagnement*.
- Adverbes de remplissage : *vraiment, simplement, fondamentalement*.
- Phrases en « nous vous proposons de… ».
- Emojis dans les livrables clients formels.

---

## Colors

### Palette neutre (base 80 %)

| Rôle | Hex | RGB | Usage |
|---|---|---|---|
| Ink | `#0A0A0A` | 10, 10, 10 | Texte principal, titres |
| Paper | `#FAFAF7` | 250, 250, 247 | Fonds clairs, slides, pages |
| Pure white | `#FFFFFF` | 255, 255, 255 | Surfaces, cartes |
| Gray 600 | `#525252` | 82, 82, 82 | Texte secondaire, légendes |
| Gray 400 | `#A3A3A3` | 163, 163, 163 | Texte désactivé, hints |
| Gray 200 | `#E5E5E5` | 229, 229, 229 | Bordures, séparateurs |
| Gray 100 | `#F2F2EE` | 242, 242, 238 | Fonds alternatifs, code blocks |

### Accents (à doser, 15 % max)

| Rôle | Hex | RGB | Usage |
|---|---|---|---|
| Ember (accent primaire) | `#C85E1A` | 200, 94, 26 | Liens, CTA, mots-clés, élément qui doit attirer l'œil |
| Lab Blue (accent secondaire) | `#1B3A8C` | 27, 58, 140 | Schémas techniques, badges « tech », rare |

### Règles
- **Un seul accent par bloc visuel.** Pas d'ember + blue dans le même paragraphe ou la même slide.
- **Pas de gradients.** Couleurs pleines uniquement.
- **Pas d'ombres décoratives.** Seules les ombres fonctionnelles (depth d'un modal, hover discret) sont autorisées.
- **Mode sombre** : inverser ink/paper, garder ember inchangé (déjà calibré pour les deux modes).

---

## Typography

### Stack recommandée

| Usage | Famille principale | Fallback web | Fallback système |
|---|---|---|---|
| **Display & H1-H2** | `Inter` (Display Semibold 600) | `Inter`, `system-ui` | Arial Black, sans-serif |
| **Body & H3-H6** | `Inter` (Regular 400 / Medium 500) | `Inter`, `system-ui` | Arial, sans-serif |
| **Editorial / citations** | `IBM Plex Serif` (Regular 400) | `IBM Plex Serif`, Georgia | Georgia, serif |
| **Code & data** | `JetBrains Mono` (Regular 400) | `JetBrains Mono`, `ui-monospace` | Menlo, monospace |

> Inter et IBM Plex Serif sont gratuits, dispo Google Fonts, et alignés avec l'esthétique Nextra/Vercel.

### Échelle (web et slides)

| Niveau | Taille | Weight | Line-height | Usage |
|---|---|---|---|---|
| Display | 56 / 72 | 600 | 1.05 | Hero, ouverture deck |
| H1 | 36 / 48 | 600 | 1.1 | Titre de page, slide titre |
| H2 | 24 / 32 | 600 | 1.2 | Section |
| H3 | 18 / 20 | 500 | 1.3 | Sous-section |
| Body | 16 / 18 | 400 | 1.55 | Texte courant |
| Small | 13 / 14 | 400 | 1.4 | Légendes, métadonnées |
| Code | 14 | 400 | 1.5 | Snippets |

### Règles
- **Pas plus de 2 familles par document** (sans/serif/mono — choisir deux).
- **Pas d'italique pour l'emphase**, préférer le poids (Medium 500).
- **Pas d'UPPERCASE** sauf pour les badges très courts (2-3 mots max).
- **Pas de letter-spacing négatif** au-delà de -0.02em sur les titres.

---

## Layout

### Principes
- **Grille 12 colonnes**, gutter 24 px, marge 64 px desktop / 24 px mobile.
- **Whitespace généreux** : laisser respirer. Mieux vaut une slide à 30 % remplie qu'à 80 %.
- **Alignement gauche** par défaut (texte et titres). Centrage uniquement pour les éléments isolés (logo, hero unique).
- **Une idée par bloc, un bloc par idée.**
- **Bordures fines** (1 px gray-200) plutôt que cards à ombre.

### Composants types

**Card**
- Fond `Paper` ou `Pure white`
- Bordure 1px `Gray 200`
- Padding 24px
- Pas d'ombre, pas de border-radius > 8px

**Bouton primaire**
- Fond `Ink`, texte `Paper`
- Padding 12px 24px
- Border-radius 6px
- Hover : fond `Gray 600`

**Bouton secondaire**
- Fond transparent, bordure 1px `Ink`, texte `Ink`

**Link**
- Couleur `Ink`, souligné en `Ember` (text-decoration-color)
- Hover : couleur passe à `Ember`

---

## Visual elements

### Iconographie
- **Lucide icons** ou **Tabler icons** (line-style, 1.5px stroke).
- Pas d'icônes pleines, pas d'illustrations 3D.
- Taille standard : 16px (inline), 20px (boutons), 24px (titres de section).

### Photographie
- Préférer **screenshots produit, schémas, captures réelles** plutôt que stock photo.
- Si stock indispensable : noir & blanc ou désaturé à 30 %.
- Pas de photos de « business people qui sourient en réunion ».

### Schémas et diagrammes
- Lignes 1.5px, couleur `Ink` ou `Gray 600`.
- Accent `Ember` uniquement sur le nœud/élément à mettre en avant.
- Fond `Paper`. Pas de fond coloré.
- Mermaid, Excalidraw ou tldraw recommandés pour la cohérence.

---

## Applications

### Slides / Présentation
- Format **16:9**, fond `Paper`.
- Titre en haut à gauche (H1, Inter 36pt).
- Une slide = une idée. Si tu as deux idées, fais deux slides.
- Numérotation discrète en bas à droite, `Small` `Gray 400`.
- Pas de transitions animées, pas de templates « moderne 2024 ».
- Footer optionnel : « lucid-lab.fr » en `Gray 400`.

### Document (PDF / docx)
- Marges 2.5 cm, texte Inter 11pt, line-height 1.5.
- Titre de couverture : Inter Semibold 28pt, accent `Ember` sur 1 mot maximum.
- Tableaux : bordures `Gray 200`, header en `Ink` `Paper`.

### Web / Landing
- Layout single-column ou max 2 colonnes.
- Hero : titre H1, sous-titre Body, un CTA primaire.
- Sections séparées par 96px (desktop) / 64px (mobile).
- Pas de carousel. Pas de pop-up newsletter.

### Email
- Texte plain ou très light HTML (logo + texte).
- Signature : nom, rôle, « lucid-lab.fr ». Pas de bannière.

---

## Anti-patterns

- ❌ Gradients « modernes » (violet→rose, bleu→cyan)
- ❌ Glassmorphism, neumorphism, claymorphism
- ❌ Photos stock corporate (équipe diversifiée souriante)
- ❌ Icônes 3D ou illustrations isométriques
- ❌ Animations Lottie décoratives
- ❌ « Discover », « Unlock », « Empower » dans le copy
- ❌ Logos clients en mosaïque XXL « ils nous font confiance »
- ❌ Témoignages bidon « ça a changé notre entreprise »
- ❌ Plus de 2 familles de fontes
- ❌ Accent appliqué à plus de 15 % de la surface visible

---

## Benchmarks & inspirations (référentiel visuel)

L'écosystème "docs-first SaaS contemporain" est notre étoile polaire. Cite-les comme références d'arbitrage quand un choix UI/UX est ambigu.

### Tier 1 — Inspiration directe
| Référence | À piquer | URL |
|---|---|---|
| **Nextra** | Sidebar hiérarchique, typo serif éditoriale, transitions calmes | nextra.site |
| **Mister AI** | Épure agence FR, copy direct, accent unique bien dosé | mister-ai.com |
| **Vercel** | Hero condensé, code snippets en focus, dark/light pair | vercel.com |
| **Linear** | Animations purposeful, micro-interactions, density élégante | linear.app |
| **Resend** | Landing simple, illus minimales, ton confident | resend.com |
| **Stripe Docs** | Two-column docs (texte/code), navigation persistante | docs.stripe.com |

### Tier 2 — Patterns marketing à étudier
| Référence | À piquer |
|---|---|
| **Cursor.com** | Hero démo vidéo, social proof discret (logos en gris) |
| **Mintlify** | Cards diagonales, gradients subtils en accent uniquement |
| **Trigger.dev** | Comparaison "before/after", changelog mis en avant |
| **Inngest** | Use cases segmentés, calculator pricing |
| **Modal** | Architecture diagrams comme hero, code-first storytelling |
| **Plain.com** | Sobriété radicale, single accent color, zéro ornement |
| **Raycast** | Dark-first, gradients ultra-subtils, accent unique |

### Anti-références (à ne PAS imiter)
- Sites cabinets conseil français (Capgemini, Wavestone, Sia Partners) — corporate, stock photo, trop de bleus
- SaaS « AI 2024 » avec gradients violet/rose, blobs animés, hero gimmicks
- Wix / Squarespace templates — visuellement génériques

---

## Marketing system

### Positioning sentence (master)
> **Lucid-Lab — Le partenaire qui construit l'IA dans vos opérations. Sans slides. Avec preuves.**

Variations courtes pour OG/meta/hero :
- 60 car. : *« On ne conseille pas l'IA. On la livre dans vos process. »*
- 90 car. : *« Lucid-Lab transforme vos opérations avec de l'IA livrée et mesurée — pas de slides, des preuves. »*

### Structure value-prop (modèle 3-actes)
1. **Problème nommé** (1 phrase concrète, pas un buzzword) — *« Vos process IA pilotes restent bloqués en POC. »*
2. **Approche différenciante** (ce qu'on fait que les autres ne font pas) — *« On code, on branche, on mesure dans vos systèmes en 7-10 jours. »*
3. **Preuve** (chiffre, nom client, output) — *« 80 % de réduction du temps de qualification leads chez X, mesuré sur 90 jours. »*

### Page archetypes

**Landing (homepage)**
1. Hero : positioning + CTA primaire unique
2. Logos clients (5-7 max, gris #525252, sans label "ils nous font confiance")
3. 3 use cases segmentés (Operations / Produit / Data) — chacun 1 phrase + 1 chiffre
4. Comparaison « cabinet conseil vs Lucid-Lab » (tableau 2 colonnes)
5. Process en 3-4 étapes (numérotés, sans icônes décoratives)
6. 1 case study en preview + lien
7. CTA répété (même verbe que le premier)
8. Footer minimal

**Case study**
1. Titre : *« [Client] : [résultat chiffré] en [délai] »*
2. Bandeau métriques (3 chiffres max)
3. Contexte (2 paragraphes)
4. Ce qu'on a fait (liste actions, verbes d'action)
5. Résultats (graph simple + 2-3 quotes courtes)
6. Stack utilisée (badges)

**Blog / Article**
1. Titre direct (pas de clickbait, pas de chiffre arbitraire « 7 façons »)
2. Sous-titre 1 phrase qui résume la thèse
3. Date + temps de lecture
4. Corps : H2 tous les 300-400 mots, Plex Serif pour citations
5. Conclusion = 1 question ouverte ou 1 CTA contextuel

**Pricing**
- 2 ou 3 plans max
- Prix affiché (jamais « Contactez-nous » sauf Enterprise)
- Différenciation par scope, pas par features
- FAQ en bas

### CTA copy (mots-clés)
✅ « Voir un case study », « Réserver 30 min », « Lire la méthode », « Demander un diagnostic »
❌ « Get started », « Learn more », « Démarrez gratuitement », « Découvrir »

---

## Digital coherence — tokens & assets

### Tokens essentiels (à copier dans n'importe quel projet)

Tout tient en 5 couleurs, 3 fontes, spacing en base 8.

```
Couleurs   ink #0A0A0A · paper #FAFAF7 · gray #525252 / #E5E5E5 · ember #C85E1A
Fontes     Inter (sans) · IBM Plex Serif (éditorial) · JetBrains Mono (code)
Spacing    multiples de 8px (8, 16, 24, 32, 48, 64, 96)
Radius     max 8px
Shadow     aucune par défaut
Transitions  150-250ms, ease-out
Dark mode  inverser ink ↔ paper, garder ember
```

*(Si besoin d'un set CSS prêt à coller, demander — pas besoin d'alourdir un livrable avec.)*

### Assets visuels — spécifications

| Asset | Dimensions | Format | Particularité |
|---|---|---|---|
| **Favicon** | 32×32, 16×16 | `.ico` + `.svg` | Mark seul (pas le wordmark), `Ink` sur transparent |
| **App icon (PWA)** | 512×512, 192×192 | `.png` | Mark `Ink` centré sur fond `Paper`, padding 20 % |
| **OG image (par défaut)** | 1200×630 | `.png`/`.jpg` | Fond `Paper`, titre Inter 64pt `Ink`, mark en bas-gauche |
| **OG image (article)** | 1200×630 | générée | Titre article + auteur + date |
| **Twitter/X card** | 1600×900 (summary_large) | `.png` | Même template OG |
| **LinkedIn banner** | 1584×396 | `.png` | Bandeau wordmark + tagline `Ember` |
| **Email banner** | 600×120 | `.png` | Plain text préféré, banner seulement pour newsletters |

### Metadata HTML (template par page)

```html
<title>[Page Title] — Lucid-Lab</title>
<meta name="description" content="[150-160 car., termine par un verbe d'action]">
<meta property="og:title" content="[Page Title]">
<meta property="og:description" content="[même que description]">
<meta property="og:image" content="https://lucid-lab.fr/og/[slug].png">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
```

### Social — règles de présence

| Plateforme | Cadence | Format | Ton |
|---|---|---|---|
| **LinkedIn** | 2-3 / semaine | Texte long (1200 car.) + visuel sobre | Apprentissage de mission, chiffre, anti-buzzword |
| **X/Twitter** | optionnel | Thread court (4-6 tweets) | Snippet de méthode, pas de hot takes |
| **Newsletter** | mensuelle | Plain text + 1-2 visuels | « Voici ce qu'on a livré ce mois » |

### Signature email type
```
Anthony Poirier
Lucid-Lab — On construit l'IA dans vos opérations
lucid-lab.fr
```
*(Pas de logo, pas de mentions légales en signature, pas de bannière.)*

---

## Content patterns — micro-copy library

### Headlines (formules réutilisables)
- *« [Client] : [verbe au passé] [résultat chiffré] en [délai] »*
- *« On a [action concrète] pour [client/secteur]. Voilà comment. »*
- *« Pourquoi [vérité contre-intuitive du secteur]. »*

### Bullets de feature (pattern AVR — Action / Valeur / Référence)
- **Action** : ce que ça fait concrètement
- **Valeur** : pourquoi c'est utile (1 chiffre si possible)
- **Référence** : où c'est déjà déployé (optionnel)

Exemple :
> **Qualification leads automatisée** — Score chaque lead entrant en <2s. -80 % de temps SDR. *Déployé chez X.*

### FAQ — questions à toujours adresser
1. *« Combien ça coûte ? »* — fourchette honnête
2. *« Combien de temps ? »* — délai max
3. *« Et si ça ne marche pas ? »* — clause de sortie / pricing au résultat
4. *« Qui possède le code / les données ? »* — vous, toujours
5. *« Différence avec un cabinet conseil ? »* — phrase directe

### Erreurs de copy courantes (à corriger)

| ❌ Évite | ✅ Préfère |
|---|---|
| « Notre solution révolutionnaire » | « On a livré [X] » |
| « Nos experts vous accompagnent » | « On construit avec vous » |
| « Transformez votre business » | « Réduisez [métrique] de [%] » |
| « Découvrez nos services » | « Voir les case studies » |
| « N'hésitez pas à nous contacter » | « Réserver 30 min » |

---

## Quick reference — pour générer un livrable rapidement

```
Background:   #FAFAF7  (Paper)
Text:         #0A0A0A  (Ink)
Muted text:   #525252  (Gray 600)
Border:       #E5E5E5  (Gray 200)
Accent:       #C85E1A  (Ember)  — usage parcimonieux
Font sans:    Inter
Font serif:   IBM Plex Serif (citations / éditorial)
Font mono:    JetBrains Mono (code / data)
Spacing base: 8px (multiples de 8)
Radius max:   8px
Shadow:       aucune par défaut
```
