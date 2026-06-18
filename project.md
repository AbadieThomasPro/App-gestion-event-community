# Déploiement Vercel — guide de mise en place

Ce document détaille comment déployer le front-end et le back-end sur **Vercel**, et les règles à respecter par la suite quand on ajoute des features back. Il complète le [README](./README.md) (sections CI/CD, Infrastructure, Gestion des environnements).

## Architecture cible

- **2 projets Vercel distincts**, connectés au même repo GitHub :
  - `frontend` (Root Directory: `frontend`) → preset Vite, build statique
  - `backend` (Root Directory: `backend`) → fonctions serverless Node
- **Mapping des environnements** (cohérent avec la convention de branches du README) :
  - push/merge sur `main` → déploiement **Production**
  - push sur `develop` ou ouverture de PR → déploiement **Preview** (= environnement dev/INT)
- **Base de données** : PostgreSQL géré par **Neon** (via l'intégration "Vercel Postgres" dans le dashboard Vercel, ou un compte Neon direct). Compatible serverless, fournit une connexion *pooled* et une connexion *directe*.
- Le `docker-compose.yml` reste utilisé **uniquement en local**, il ne change pas.

## Projets Vercel déjà créés

Les 2 projets ont été créés via `vercel link` (CLI), sans connexion Git (pas d'auto-déploiement natif) :

| Projet | `projectId` | `orgId` |
|---|---|---|
| `gestion-event-discord-front` (`frontend/`) | `prj_1TeWKE3IkJWpuYLktmSerefeQ832` | `team_gKW5rvgBGoPg0sEB21rHicJT` |
| `gestion-event-discord-back` (`backend/`) | `prj_10h5R2owvHzQEqs2sz0LLpksnTxa` | `team_gKW5rvgBGoPg0sEB21rHicJT` |

(`orgId` est identique pour les deux, c'est le même compte/team Vercel.)

## 1. Base de données (Neon)

1. Créer la base via le dashboard Vercel → `Storage` → `Create Database` → `Postgres` (intégration Neon), puis la connecter au projet `backend` (Production + Preview + Development).
2. L'intégration injecte automatiquement les variables d'environnement du projet `backend` sur Vercel, avec ses propres noms :
   - `DATABASE_URL` : connexion **pooled** (via PgBouncer), utilisée par l'app au runtime.
   - `DATABASE_URL_UNPOOLED` : connexion **directe**, utilisée pour les migrations Prisma.

   Ces variables sont marquées **Sensitive** par Vercel : leur valeur n'est plus jamais lisible après coup (ni via `vercel env pull`, ni via l'API), seulement utilisable au runtime sur Vercel. Pour les récupérer en local, passer par la **console Neon** directement (lien "Open in Neon" depuis l'onglet Storage, ou neon.tech), section Connection Details — la connexion directe est la même URL que la pooled, sans le suffixe `-pooler` dans le hostname.
3. `backend/prisma/schema.prisma` expose les deux :

   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DATABASE_URL_UNPOOLED")
   }
   ```

4. Appliquer le schéma sur Neon depuis le poste local (pas encore automatisé en CI), avec `backend/.env` renseigné avec les deux variables ci-dessus :

   ```sh
   cd backend
   npx prisma migrate deploy
   ```

## 2. Adapter le back-end au serverless

Vercel exécute le code de `backend/api/*` comme des fonctions, pas comme un process `app.listen()` qui tourne en continu. Il faut séparer l'app Express de son démarrage :

1. Renommer la logique actuelle de `backend/index.js` en `backend/app.js`, qui **exporte l'app Express sans appeler `.listen()`** :

   ```js
   // backend/app.js
   import express from 'express'

   const app = express()
   app.use(express.json())

   app.get('/', (req, res) => {
     res.json({ message: 'API is running' })
   })

   export default app
   ```

2. `backend/index.js` redevient le point d'entrée **local uniquement** (utilisé par `npm run dev`) :

   ```js
   // backend/index.js
   import app from './app.js'

   const PORT = process.env.PORT || 3000
   app.listen(PORT, () => {
     console.log(`Server running on http://localhost:${PORT}`)
   })
   ```

3. Créer `backend/api/index.js`, le point d'entrée serverless utilisé par Vercel :

   ```js
   // backend/api/index.js
   import app from '../app.js'

   export default app
   ```

4. Créer `backend/vercel.json` pour que toutes les routes passent par cette fonction unique :

   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/api" }]
   }
   ```

5. Ajouter le middleware **CORS** (front et back seront sur deux domaines Vercel différents) :

   ```sh
   npm install cors
   ```

   ```js
   // backend/app.js
   import cors from 'cors'
   app.use(cors({ origin: process.env.FRONTEND_URL }))
   ```

## 3. Prisma Client en serverless

Chaque invocation de fonction peut réinstancier le client si on ne fait pas attention, ce qui épuise vite les connexions. Utiliser un singleton :

```js
// backend/lib/prisma.js
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

Importer `prisma` depuis ce fichier partout où on a besoin du client (au lieu d'en créer un nouveau dans chaque route).

## 4. Variables d'environnement Vercel

À renseigner dans `Project Settings > Environment Variables` de chaque projet, séparément pour **Production** et **Preview** :

**Projet `backend`**
| Variable | Production | Preview |
|---|---|---|
| `DATABASE_URL` | connexion pooled Neon (prod) | connexion pooled Neon (dev/INT) |
| `DATABASE_URL_UNPOOLED` | connexion directe Neon (prod) | connexion directe Neon (dev/INT) |
| `FRONTEND_URL` | URL du projet front en Production | URL preview du front |
| `JWT_SECRET` | à ajouter quand l'auth sera implémentée | idem |
| `DISCORD_WEBHOOK_URL` | à ajouter quand les notifs Discord seront implémentées | idem |

**Projet `frontend`**
| Variable | Production | Preview |
|---|---|---|
| `VITE_API_URL` | URL du projet backend en Production | URL preview du backend |

> Idéalement, prévoir deux bases Neon séparées (prod / dev) plutôt qu'une seule partagée entre Production et Preview, pour ne pas mélanger les données de test et les vraies données.

## 5. Secrets GitHub pour le déploiement piloté par la pipeline

`Settings > Secrets and variables > Actions > New repository secret`, sur le repo (pas besoin de les scoper par environnement GitHub, ce sont les mêmes pour dev/prod) :

| Secret | Valeur |
|---|---|
| `VERCEL_TOKEN` | à générer sur vercel.com → Account Settings → Tokens → Create Token |
| `VERCEL_ORG_ID` | `team_gKW5rvgBGoPg0sEB21rHicJT` |
| `VERCEL_PROJECT_ID_FRONTEND` | `prj_1TeWKE3IkJWpuYLktmSerefeQ832` |
| `VERCEL_PROJECT_ID_BACKEND` | `prj_10h5R2owvHzQEqs2sz0LLpksnTxa` |

Penser aussi à créer l'environnement GitHub `prod` (`Settings > Environments`), en plus du `dev` déjà existant.

## 6. Checklist premier déploiement

- [x] Base Neon créée, `DATABASE_URL` + `DATABASE_URL_UNPOOLED` récupérées
- [x] `schema.prisma` mis à jour avec `directUrl`
- [x] `backend/app.js`, `backend/index.js`, `backend/api/index.js`, `backend/vercel.json` créés/adaptés
- [x] `cors` installé et configuré
- [x] Singleton Prisma (`backend/lib/prisma.js`) en place
- [x] Variables d'environnement renseignées (Production + Preview) sur les deux projets Vercel
- [x] Les 4 secrets GitHub ajoutés (tableau ci-dessus)
- [x] Environnement GitHub `prod` créé
- [x] `npx prisma migrate deploy` exécuté contre Neon
- [ ] Déploiement vérifié : `GET /` sur l'URL du backend répond, le front affiche bien la page

## Règles pour la suite (ajout de features back)

- Toute nouvelle route va dans `backend/app.js` (ou des routers importés dedans) — jamais dans `backend/index.js` ni `backend/api/index.js`, qui ne doivent pas contenir de logique métier.
- Toute nouvelle variable d'env (secret JWT, webhook Discord, etc.) doit être ajoutée à **3 endroits** : `backend/.env` (local), et les paramètres Vercel du projet `backend` en **Production** et en **Preview**.
- Le client Prisma s'importe toujours depuis `backend/lib/prisma.js`, jamais via `new PrismaClient()` ailleurs.
- Si une route a besoin de plus de 10s d'exécution, vérifier les limites de durée des fonctions serverless du plan Vercel utilisé (Hobby = 10s par défaut).
