# Deck court · cabinets d'expertise comptable

Trois slides, à montrer ou à envoyer **après un appel téléphonique**, à un cabinet identifié.
Il ne remplace pas le pitch deck complet (`../index.html`, 11 slides) : il sert à ce que
l'interlocuteur sache de quoi on parle avant le rendez-vous.

| Slide | Contenu |
|------:|---------|
| 01 | Le constat : où part le temps administratif du cabinet, avec l'addition chiffrée |
| 02 | Ce qu'on installe, et les deux preuves (artisane d'Indre-et-Loire, CMB) |
| 03 | Comment on démarre : l'audit flash, sa durée, son prix, ce qu'il laisse au cabinet |

## Support de rendez-vous, jamais en ligne

La slide 02 nomme **CMB**. Cette référence est mentionnable à l'oral et dans les documents
remis en rendez-vous, jamais sur le site public ni dans un mail de prospection à froid.
L'artisane d'Indre-et-Loire reste anonyme tant qu'on n'a pas son accord écrit pour la nommer.
Le rappel est aussi écrit en commentaire en tête de `index.html`.

## Ouvrir le deck

Ouvrir `index.html` dans un navigateur. Flèches gauche et droite pour naviguer, `R` pour
revenir à la première slide.

## Exporter en PDF

```bash
./export-pdf.sh              # écrit deck-court.pdf à côté de index.html
./export-pdf.sh sortie.pdf   # autre nom de fichier
```

Le script aplatit le shadow DOM avant l'export Chrome headless. Sans lui, les slides sombres
sortent blanches : c'est un défaut connu de `--print-to-pdf` sur les éléments `::slotted`.
Il attend Chrome dans `/Applications/Google Chrome.app`, ou `google-chrome` dans le `PATH`.

Sans Chrome en ligne de commande, la commande équivalente est :

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer --allow-file-access-from-files \
  --print-to-pdf=deck-court.pdf "file://$PWD/index.html"
```

Dernier recours, si aucune ligne de commande n'est disponible : ouvrir `index.html` dans
Chrome, `Fichier > Imprimer`, destination « Enregistrer au format PDF », marges « Aucune »,
et cocher « Graphiques d'arrière-plan ».

## Modifier le contenu

`index.html` est la seule source de vérité. Le PDF est un export jetable, à régénérer après
chaque modification. Les couleurs et les polices viennent de `../../styles.css` (jetons de la
marque) : ne pas écrire de hex en dur, sauf dans les blocs sombres, où c'est volontaire
(Chrome perd les `var()` sur le chemin d'impression).
