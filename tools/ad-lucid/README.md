# Film publicitaire Lucid-Lab (38 s)

Publicité de lancement en motion design, rendue image par image avec Remotion : Second Brain et automatisation des opérations, en français, dans la direction artistique du brand kit (papier, encre, ember, Figtree, Geist Mono, Syne pour le wordmark).

## Rendre le film

```bash
cd tools/ad-lucid
npm install
npm run render            # out/lucid-ad.mp4, 1920x1080, 30 images par seconde, H.264
npm run studio            # prévisualisation interactive dans le navigateur
```

Copie allégée pour l'envoi :

```bash
/opt/homebrew/bin/ffmpeg -y -i out/lucid-ad.mp4 -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart -an out/lucid-ad-web.mp4
```

## Musique

Le film est muet par construction : la musique doit être un titre dont Lucid-Lab détient la licence. Déposer le fichier dans `public/music.mp3` (ignoré par git) puis rendre avec la variable d'environnement :

```bash
REMOTION_MUSIC=music.mp3 npm run render
```

Le mixage baisse la musique sur les deux dernières secondes.

## Structure

- `src/LucidAd.tsx` : plan de montage (sept séquences, 1140 images).
- `src/scenes/` : une scène par fichier (accroche, documents éparpillés, Second Brain, question et réponse sourcée, carrousel des écrans automatisés, chiffres, appel à l'action).
- `src/ui/` : primitives (typographie cinétique `Words`, `Card3D`, `Label`, `Wordmark`, `Cursor`, fond `Paper`).
- `public/screens/` : captures 2x des écrans de la démo `/demo/atelier-v2` (entreprise fictive Atelier Brière).
- `public/brain.mp4` : boucle du cerveau ember déjà utilisée sur la page Second Brain du site.

## Règles

- Seuls des chiffres vrais et vérifiables : moins d'une minute pour la réponse automatique, 2 jours d'installation, à distance (promesse du site), base stockée dans les outils du client (FAQ du site). Aucun chiffre inventé.
- Vocabulaire contrôlé par `npm run demo:check` à la racine du dépôt (tirets longs, noms réels, expressions bannies).
- Licence Remotion : gratuite pour les entreprises de trois personnes ou moins ; à revoir si l'équipe grandit.
