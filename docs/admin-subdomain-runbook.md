# Runbook : admin.lucid-lab.fr (sous-domaine admin)

Objectif : servir l'admin de Lucid OS sur `admin.lucid-lab.fr` avec des URLs propres (`admin.lucid-lab.fr/lucid-os`), en validant d'abord sur un staging sans toucher à la prod ni au CRM que Jules utilise.

État au 2026-07-21 :
- Code sur la branche `feat/admin-subdomain` (repo `BTheo1306/lucid-lab`), poussée, 3 commits, non mergée. Cible d'intégration prévue : `feat/cas-clients-roi`, jamais `main` sans feu vert.
- Le mécanisme est déjà validé au runtime en local (spike : `redirect()` en server action sous réécriture, cookies, filet 308, mode direct).
- `admin.lucid-lab.fr` et `admin-staging.lucid-lab.fr` résolvent déjà vers Vercel. Le DNS existe donc, reste à savoir s'ils sont rattachés au projet (à lire dans Vercel > Domains).
- Accès : pas de token/CLI Vercel côté Claude. La config Vercel se fait via le dashboard (navigateur). Claude ne peut pas saisir de mot de passe : toute étape de login (Vercel, Google, LinkedIn) est à faire par Théo.

---

## Étape 0 : une modification de code (préalable au staging)

Le proxy teste aujourd'hui `ADMIN_HOSTNAMES.has(hostname)`, qui ne connaît que `admin.lucid-lab.fr`. Pour que le host de staging soit reconnu par variable d'environnement (sans coder `admin-staging` en dur), faire pointer le proxy sur `isAdminHost(hostname)`.

Dans `src/proxy.ts` :
- remplacer l'import `import { ADMIN_HOSTNAMES } from '@/lib/admin/urls'` par `import { isAdminHost } from '@/lib/admin/urls'` (garder `ADMIN_STATIC_PATHS` s'il est importé de là aussi) ;
- remplacer la condition `if (ADMIN_HOSTNAMES.has(hostname))` par `if (isAdminHost(hostname))`.

`isAdminHost` (dans `src/lib/admin/urls.ts`) matche déjà `ADMIN_HOSTNAMES` OU `new URL(adminBaseUrl()).hostname`, où `adminBaseUrl()` lit `ADMIN_BASE_URL`. Effet :
- prod (`ADMIN_BASE_URL=https://admin.lucid-lab.fr` ou défaut) : `admin.lucid-lab.fr` reconnu, apex et `*.vercel.app` non. Inchangé.
- staging (`ADMIN_BASE_URL=https://admin-staging.lucid-lab.fr` en Preview) : `admin-staging.lucid-lab.fr` reconnu.

Vérifier ensuite : `npx tsc --noEmit`, `npm run build`, `npm run check:auth`. Commit + push sur `feat/admin-subdomain`.

Finition non bloquante (le filet 308 rattrape tout oubli en redirigeant vers l'URL propre) : il reste ~20 `redirect('/admin/...')` de server actions (surtout `lucid-os/clients/actions.ts`), ~26 `href="/admin/..."` de pages serveur, et les route handlers LinkedIn. À passer par `adminBasePath()` / `adminRedirectUrl()`. Peut se faire après la validation staging.

---

## Étape 1 : STAGING (décision actée)

But : prouver tout le mécanisme sur une vraie infra Vercel (certificat, edge, en-têtes, cookies) sans toucher à la prod.

### Vercel > projet `lucid-lab` > Settings > Domains > Add
- Domaine : `admin-staging.lucid-lab.fr`
- Git Branch : `feat/admin-subdomain` (et non Production)
- Vercel émet le certificat automatiquement. Le DNS résout déjà ; si Vercel réclame un enregistrement, l'ajouter côté Cloudflare (CNAME `admin-staging` vers la cible Vercel indiquée).

### Vercel > Settings > Environment Variables > Add
- `ADMIN_BASE_URL` = `https://admin-staging.lucid-lab.fr`
- Scope : Preview, limité à la branche `feat/admin-subdomain`. Ne pas toucher Production.

### Redéploiement
Le push de l'étape 0 déclenche un build de la branche. Sinon, Redeploy manuel de la branche depuis Vercel.

### Validation staging (sans Google ni LinkedIn)
Forger une session de test (l'auth ne dépend que de l'HMAC + allowlist, pas de Supabase). Il faut connaître `ADMIN_SESSION_SECRET` de la Preview (ou le fixer temporairement en Preview) et un email présent dans `ADMIN_ALLOWED_EMAILS`.

```
# Forger le token (adapter EMAIL et SECRET aux valeurs de la Preview)
node -e 'const c=require("crypto"),e="theo@lucid-lab.fr",s="SECRET_PREVIEW",x=Date.now()+43200000;console.log(`v2.${Buffer.from(e,"utf8").toString("base64url")}.${x}.${c.createHmac("sha256",s).update(`admin:${e}:${x}`).digest("hex")}`)'
```

Contrôles (curl, non intrusifs) :
- Certificat : `echo | openssl s_client -connect admin-staging.lucid-lab.fr:443 -servername admin-staging.lucid-lab.fr 2>/dev/null | openssl x509 -noout -issuer -subject -dates` doit renvoyer un cert valide au bon nom.
- Sans session : `curl -sI https://admin-staging.lucid-lab.fr/lucid-os` doit renvoyer une redirection vers `/login` (pas `/admin/login`) + `x-robots-tag: noindex`.
- Avec session : `curl -sI -H "Cookie: ll_admin_sid=<TOKEN>" https://admin-staging.lucid-lab.fr/lucid-os` doit renvoyer 200 (ou une erreur applicative, mais PAS un renvoi vers /login ni un 404 marketing).
- Filet : `curl -sI https://admin-staging.lucid-lab.fr/admin/lucid-os` doit renvoyer 308 vers `/lucid-os`.
- En-têtes : CSP, HSTS, `x-robots-tag` présents.
- Surface machine intacte : `curl -sI https://admin-staging.lucid-lab.fr/api/admin/brand-guide` ne doit PAS renvoyer 308 (le filet ne touche pas `/api/admin/*`).

Si tout est vert : STOP, montrer les preuves à Théo avant la prod.

---

## Étape 2 : PRODUCTION (gated, feu vert explicite requis)

Cette étape touche le CRM live de Jules. À ne lancer qu'après validation staging ET accord explicite.

### Code : ajouter la garde apex (Phase D)
Dans `src/proxy.ts`, sous la branche admin, ajouter le renvoi des accès directs apex `lucid-lab.fr/admin/*` vers le sous-domaine, en miroir de la garde `/portal` existante :
`if (APEX_HOSTNAMES.has(hostname) && (pathname === '/admin' || pathname.startsWith('/admin/'))) { 308 vers adminBaseUrl() + pathname sans /admin }`.
Ne matche jamais `/api/admin/*` (préfixe `/api`), donc les clés API de Jules ne sont pas affectées.

### Décision de merge
Pour servir la prod, le code doit être sur la branche de production. Option recommandée : merger `feat/admin-subdomain` d'abord dans `feat/cas-clients-roi`, valider, puis vers `main`. Aucun merge sans feu vert.

### Vercel (Production)
- Domains : rattacher `admin.lucid-lab.fr` au projet (Production).
- Environment Variables (Production) : `ADMIN_BASE_URL=https://admin.lucid-lab.fr`, `GOOGLE_OAUTH_REDIRECT_URI=https://admin.lucid-lab.fr/auth/google/callback`, `LINKEDIN_REDIRECT_URI=https://admin.lucid-lab.fr/integrations/linkedin/callback`, `LINKEDIN_ORG_REDIRECT_URI=https://admin.lucid-lab.fr/integrations/linkedin-org/callback`.

### Ordre imposé par HSTS (piège réel)
Le durcissement d'audit (si mergé) sert `Strict-Transport-Security: ...; includeSubDomains`, ce qui engage TOUS les sous-domaines dès qu'un navigateur a visité l'apex. Conséquence : `admin.lucid-lab.fr` doit servir un certificat valide AVANT que le DNS soit public, sinon le navigateur refuse tout, sans contournement possible. Séquence : rattacher le domaine côté Vercel et attendre le certificat, PUIS publier/vérifier le DNS.

### Consoles tierces (login par Théo, correspondance exacte exigée)
- Google Cloud Console : ajouter `https://admin.lucid-lab.fr/auth/google/callback` aux Authorized redirect URIs. Garder l'ancienne le temps de la bascule.
- LinkedIn Developers, les 2 apps (perso + page) : mettre à jour les redirect URIs vers `https://admin.lucid-lab.fr/integrations/linkedin{,-org}/callback`.

### Communication
Prévenir les 3 admins : reconnexion unique (le cookie est renommé `ll_admin_sid` et host-only, il ne suit pas l'ancien host). Vider les cookies une fois si un comportement d'auth semble incohérent au premier accès.

---

## Tests sécurité et certificats (site live, non intrusifs)

```
# Certificat + SAN
echo | openssl s_client -connect lucid-lab.fr:443 -servername lucid-lab.fr 2>/dev/null | openssl x509 -noout -issuer -subject -dates -ext subjectAltName

# Versions TLS (1.3 et 1.2 acceptes ; 1.0/1.1 doivent echouer)
for v in tls1_3 tls1_2 tls1_1 tls1; do echo -n "$v: "; echo | openssl s_client -connect lucid-lab.fr:443 -servername lucid-lab.fr -$v 2>&1 | grep -q "Cipher is (NONE)\|alert\|handshake failure" && echo refuse || echo accepte; done

# En-tetes de securite (comparer prod vs branche audit une fois mergee)
curl -sI https://lucid-lab.fr/ | grep -iE "strict-transport|content-security|x-frame|x-content-type|referrer-policy|permissions-policy|x-powered-by"

# Redirection HTTP vers HTTPS
curl -sI http://lucid-lab.fr/ | grep -iE "^HTTP|^location"
```

Rappel : les en-têtes durcis (CSP, nosniff, HSTS complet, `poweredByHeader:false`) sont sur la branche d'audit `audit/seo-security-perf`, PAS encore en prod. La prod actuelle n'a que `HSTS max-age` et expose `x-powered-by: Next.js`.

---

## Rollback

- Staging : supprimer le domaine `admin-staging` et la variable Preview. Zéro impact prod.
- Production : le point de non-retour est la garde apex 308 + le rattachement du domaine. Pour revenir en arrière, retirer la garde apex (ou revert du merge) et re-servir `lucid-lab.fr/admin`. Le cookie `path:'/'` reste rétro-compatible avec l'ancien chemin, donc pas de casse d'auth au rollback.
