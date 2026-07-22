# Runbook : admin.lucid-lab.fr (sous-domaine admin)

Objectif : servir l'admin de Lucid OS sur `admin.lucid-lab.fr` avec des URLs propres (`admin.lucid-lab.fr/lucid-os`), en validant d'abord sur un staging sans toucher à la prod ni au CRM que Jules utilise.

## ✅ CUTOVER RÉALISÉ EN PRODUCTION (2026-07-22)

L'admin est **live sur `admin.lucid-lab.fr`**. `lucid-lab.fr/admin/*` renvoie en 308 vers le sous-domaine. Migration terminée, staging démonté.

**Ce qui a été fait :**
- Merge chirurgical `feat/admin-subdomain` vers `main` (uniquement la migration). Le travail home "cas clients ROI" de `feat/cas-clients-roi` et le durcissement CSP/HSTS de `audit/seo-security-perf` n'ont **pas** été embarqués : ils restent à livrer séparément.
- `admin.lucid-lab.fr` rattaché à Production, certificat Let's Encrypt (`*.lucid-lab.fr`) valide.
- Google SSO : ajout de `https://admin.lucid-lab.fr/auth/google/callback` aux redirect URIs du client OAuth **"Admin CRM Oauth"**. Aucune variable d'env nécessaire : `googleRedirectUri()` retombe sur `adminRedirectUrl(request)` quand `GOOGLE_OAUTH_REDIRECT_URI` est absent (flux dynamique par host, donc seul l'enregistrement console a suffi).
- `ADMIN_SUBDOMAIN_ENFORCED=1` posé en Production (scope Production only) + redéploiement : la garde apex s'active.
- Staging retiré : domaine `admin-staging.lucid-lab.fr` détaché, vars Preview (`ADMIN_BASE_URL`, `ADMIN_SESSION_SECRET` jetable) supprimées.

**Vérifié en prod :** `lucid-lab.fr/admin/lucid-os/clients?tab=prospects` renvoie 308 vers `admin.lucid-lab.fr/lucid-os/clients?tab=prospects` (chemin ET query préservés) ; `/api/admin/*` **non** redirigé (surface machine CRM intacte) ; homepage 200 inchangée ; sous-domaine sert l'admin et le login Google aboutit au sélecteur de compte.

**Skills CRM non impactés** (`/maj`, `dougs-sync`, `fireflies-sync`, `facturation`) : ils écrivent le CRM via le **MCP Supabase (`execute_sql`)** ou pilotent Dougs/Gmail/Drive, jamais via l'admin navigateur qui a bougé. Chemin d'écriture Supabase vérifié live (12 clients, 31 `maj_crm_sync`).

**Rollback :** retirer `ADMIN_SUBDOMAIN_ENFORCED` de Production + redéployer. `lucid-lab.fr/admin` re-sert alors en direct (cookie `path:'/'` rétro-compatible, pas de casse d'auth).

### Learnings (pièges rencontrés, absents du plan initial)
- **Vercel Deployment Protection** gate les déploiements Preview derrière le SSO Vercel. Pour valider le staging en curl il a fallu générer un secret **Protection Bypass for Automation** (en-tête `x-vercel-protection-bypass`, retiré après recette).
- Les creds **Supabase** (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) étaient **Production only**. Sur Preview le client service-role retombe sur `http://localhost` (`createClient(url || 'http://localhost', ...)`), d'où `ECONNREFUSED 127.0.0.1:80` et pages à données vides. Ajoutés temporairement en Preview (scope branche) pour prouver le rendu réel, puis retirés.
- Le client OAuth Google de l'admin ("Admin CRM Oauth", `130314452707-...`) vit dans le projet GCP **"Lucid Lab" (`lucid-lab-496617`), compte `info@lucid-lab.fr`**, pas `gouronjules@gmail.com` (qui n'y a pas accès).
- **LinkedIn** (posting, redirect fixe par env) : inactif pour l'instant, mis de côté (à retravailler). Marche de toute façon post-cutover via le rebond 308.
- CSP/HSTS non embarqués : le **piège HSTS `includeSubDomains` est resté désarmé**, ce qui a dé-risqué l'ordre certificat/DNS.

---

État au 2026-07-20 (historique, phase de préparation) :
- Code sur la branche `feat/admin-subdomain` (repo `BTheo1306/lucid-lab`), poussée, 12 commits, non mergée. Cible d'intégration prévue : `feat/cas-clients-roi`, jamais `main` sans feu vert.
- **Étape 0 faite** : le proxy pointe sur `isAdminHost(hostname)` (reconnaît le host de staging par env).
- **Phase C faite** (le balayage des URLs, décrit plus bas comme « non bloquant ») : plus aucun `/admin/...` browser-facing en dur hors `proxy.ts` / `urls.ts` / `auth.ts`. Toutes les server actions passent par `adminRedirect()`, les route handlers par `adminRedirectUrl()`, les pages (y compris les liens dans des sous-composants serveur rendus `async`) par `adminBasePath()`.
- **Garde apex faite** (Phase D), mais **dormante** : gated par `ADMIN_SUBDOMAIN_ENFORCED=1` (voir Étape 2), pour ne pas rediriger les admins vers un host injoignable avant le DNS.
- **Validé au runtime en local** (`npm run build` EXIT 0, `npm run check:auth` OK, `tsc` 0, plus un test bout-en-bout avec session forgée) : voir la section « Preuve runtime locale » ci-dessous.
- `admin.lucid-lab.fr` et `admin-staging.lucid-lab.fr` résolvent déjà vers Vercel. Le DNS existe donc, reste à savoir s'ils sont rattachés au projet (à lire dans Vercel > Domains).
- Accès : pas de token/CLI Vercel côté Claude. La config Vercel se fait via le dashboard (navigateur). Claude ne peut pas saisir de mot de passe : toute étape de login (Vercel, Google, LinkedIn) est à faire par Théo.

### Preuve runtime locale (build de prod + `next start`, session forgée)
Tous verts, sur `admin.localhost:PORT` (le proxy route par en-tête Host, port-insensible) :
| Test | Attendu | Résultat |
|------|---------|----------|
| Sous-domaine, non authentifié → `/lucid-os/metrics` | 307 vers `/login` **propre** (pas `/admin/login`) | ✅ |
| Sous-domaine, authentifié → `/brand` | 200, liens `/brand-guide-serve`, `/blog`, `/lucid-os/...` **sans** `/admin`, zéro contamination `/admin/` dans le HTML | ✅ |
| Garde leftover : `admin.localhost/admin/brand` | 308 vers `/brand` | ✅ |
| Redirection apex (flag ON) : `lucid-lab.fr/admin/brand` | 308 vers `admin.…/brand` | ✅ |
| Double-mode direct : `localhost/admin/brand` | 200, liens préfixés `/admin` (previews Vercel, dev local) | ✅ |
| `X-Robots-Tag: noindex, nofollow` sur le sous-domaine | présent | ✅ |

À noter : la CSP/HSTS ne sont **pas** sur cette branche (elles vivent sur `audit/seo-security-perf`). Une fois les deux branches réunies sur `feat/cas-clients-roi`, le sous-domaine en hérite automatiquement (`headers()` a `source: "/:path*"`, appliqué à tous les hosts).

---

## Étape 0 (FAITE) : une modification de code (préalable au staging)

Le proxy teste aujourd'hui `ADMIN_HOSTNAMES.has(hostname)`, qui ne connaît que `admin.lucid-lab.fr`. Pour que le host de staging soit reconnu par variable d'environnement (sans coder `admin-staging` en dur), faire pointer le proxy sur `isAdminHost(hostname)`.

Dans `src/proxy.ts` :
- remplacer l'import `import { ADMIN_HOSTNAMES } from '@/lib/admin/urls'` par `import { isAdminHost } from '@/lib/admin/urls'` (garder `ADMIN_STATIC_PATHS` s'il est importé de là aussi) ;
- remplacer la condition `if (ADMIN_HOSTNAMES.has(hostname))` par `if (isAdminHost(hostname))`.

`isAdminHost` (dans `src/lib/admin/urls.ts`) matche déjà `ADMIN_HOSTNAMES` OU `new URL(adminBaseUrl()).hostname`, où `adminBaseUrl()` lit `ADMIN_BASE_URL`. Effet :
- prod (`ADMIN_BASE_URL=https://admin.lucid-lab.fr` ou défaut) : `admin.lucid-lab.fr` reconnu, apex et `*.vercel.app` non. Inchangé.
- staging (`ADMIN_BASE_URL=https://admin-staging.lucid-lab.fr` en Preview) : `admin-staging.lucid-lab.fr` reconnu.

Vérifier ensuite : `npx tsc --noEmit`, `npm run build`, `npm run check:auth`. Commit + push sur `feat/admin-subdomain`.

Finition (Phase C) : **faite**. Toutes les server actions (`redirect` → `adminRedirect`), route handlers LinkedIn + charte (`new URL(...request.url)` → `adminRedirectUrl`), et pages serveur (`href` → `adminBasePath`, y compris les liens nichés dans des sous-composants rendus `async`) sont converties. Cookies d'état OAuth LinkedIn passés en `path:'/'`. Vérifié : `grep` de `/admin` browser-facing = 0 hors `proxy.ts`/`urls.ts`/`auth.ts`.

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

### Code : garde apex (Phase D), déjà en place, à activer par flag
La garde est **implémentée** dans `src/proxy.ts` (miroir de la garde `/portal`), mais **dormante** : elle ne se déclenche que si `ADMIN_SUBDOMAIN_ENFORCED=1`. Tant que le flag est absent, `lucid-lab.fr/admin` continue de servir l'admin en direct (pas de rupture pré-DNS). Une fois `admin.lucid-lab.fr` rattaché et le certificat émis, poser `ADMIN_SUBDOMAIN_ENFORCED=1` en Production : `lucid-lab.fr/admin/*` renvoie alors en 308 vers le sous-domaine. Ne matche jamais `/api/admin/*` (préfixe `/api`), donc les clés API de Jules ne sont pas affectées, et est restreinte à `APEX_HOSTNAMES` (les previews Vercel continuent de servir `/admin`).

### Décision de merge
Pour servir la prod, le code doit être sur la branche de production. Option recommandée : merger `feat/admin-subdomain` d'abord dans `feat/cas-clients-roi`, valider, puis vers `main`. Aucun merge sans feu vert.

### Vercel (Production)
- Domains : rattacher `admin.lucid-lab.fr` au projet (Production).
- Environment Variables (Production) : `ADMIN_BASE_URL=https://admin.lucid-lab.fr`, `GOOGLE_OAUTH_REDIRECT_URI=https://admin.lucid-lab.fr/auth/google/callback`, `LINKEDIN_REDIRECT_URI=https://admin.lucid-lab.fr/integrations/linkedin/callback`, `LINKEDIN_ORG_REDIRECT_URI=https://admin.lucid-lab.fr/integrations/linkedin-org/callback`.
- **En dernier, une fois le domaine rattaché et le certificat émis** : `ADMIN_SUBDOMAIN_ENFORCED=1` (Production) pour activer le renvoi 308 de `lucid-lab.fr/admin/*`. Ne pas poser ce flag avant, sous peine de rediriger les admins vers un host injoignable.

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
- Production : la garde apex étant derrière `ADMIN_SUBDOMAIN_ENFORCED`, le rollback le plus rapide est de **retirer ce flag** en Production : `lucid-lab.fr/admin` re-sert immédiatement l'admin en direct, sans redéploiement de code. Le cookie `path:'/'` reste rétro-compatible avec l'ancien chemin, donc pas de casse d'auth au rollback. Rollback complet : revert du merge.
