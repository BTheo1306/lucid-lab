-- Assign hero images to blog posts based on category and slug.
-- Only updates rows where hero_image is currently NULL (safe to re-run).

UPDATE blog_posts
SET
  hero_image     = '/blog/cout-automatisation-2026.png',
  hero_image_alt = CASE locale
    WHEN 'fr' THEN 'Fourchettes de coût pour automatiser un processus métier en PME'
    ELSE            'Business process automation cost breakdown for SMEs'
  END
WHERE hero_image IS NULL
  AND category = 'automatisation'
  AND (slug LIKE '%cout%' OR slug LIKE '%cost%');

UPDATE blog_posts
SET
  hero_image     = '/blog/guide-automatisation.png',
  hero_image_alt = CASE locale
    WHEN 'fr' THEN 'Diagramme de workflow pour automatiser les processus en entreprise'
    ELSE            'Business process automation workflow diagram'
  END
WHERE hero_image IS NULL
  AND category = 'automatisation';

UPDATE blog_posts
SET
  hero_image     = '/blog/hero-ia-pme.png',
  hero_image_alt = CASE locale
    WHEN 'fr' THEN 'IA appliquée aux PME — cas d''usage concrets'
    ELSE            'AI applied to SMEs — practical use cases'
  END
WHERE hero_image IS NULL
  AND category = 'ia-pme';

UPDATE blog_posts
SET
  hero_image     = '/blog/hero-outils-internes.png',
  hero_image_alt = CASE locale
    WHEN 'fr' THEN 'Construction d''outils internes sur mesure'
    ELSE            'Building custom internal tools'
  END
WHERE hero_image IS NULL
  AND category = 'outils-internes';

UPDATE blog_posts
SET
  hero_image     = '/blog/hero-methode.png',
  hero_image_alt = CASE locale
    WHEN 'fr' THEN 'Méthode Lucid-Lab — livraison de systèmes IA en production'
    ELSE            'Lucid-Lab method — delivering AI systems to production'
  END
WHERE hero_image IS NULL
  AND category = 'methode';
