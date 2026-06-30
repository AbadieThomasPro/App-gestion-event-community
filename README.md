
# Plateforme de gestion d’événements communautaires connectée à Discord

## Sommaire

- [Installation & Lancement](#installation--lancement)
- [Groupe](#groupe)
- [Sujet choisi](#sujet-choisi)
- [Gestion de projet](#gestion-de-projet)
- [Fonctionnalités principales](#fonctionnalités-principales)
- [Stack choisie](#stack-choisie)
	- [Commandes importantes pour le front-end](#commandes-importantes-pour-le-front-end)
	- [Commandes importantes pour le back-end](#commandes-importantes-pour-le-back-end)
	- [Front-end : React + Vite](#front-end--react--vite)
	- [Back-end : Node.js + Express.js](#back-end--nodejs--expressjs)
	- [Base de données : PostgreSQL](#base-de-données--postgresql)
	- [ORM : Prisma](#orm--prisma)
- [Modèle de données](#modèle-de-données)
	- [User](#user)
	- [Event](#event)
	- [Registration](#registration)
- [Conteneurisation](#conteneurisation)
- [CI/CD](#cicd)
- [Gestion des environnements](#gestion-des-environnements)
- [Infrastructure](#infrastructure)
- [Orchestrateur](#orchestrateur)
- [Monitoring](#monitoring)
- [Alertes Discord](#alertes-discord)
- [Convention de commits](#convention-de-commits)
- [Convention de branches](#convention-de-branches)
- [Convention de Pull Request](#convention-de-pull-request)
- [Installation & Lancement](#installation--lancement)


## Groupe

- Pauline
- Julien
- Thomas

## Sujet choisi

Nous avons choisi de développer une application full-stack permettant de gérer des événements communautaires, avec une intégration Discord.

L’objectif est de proposer une plateforme où les utilisateurs peuvent consulter les événements disponibles, s’inscrire, se désinscrire et recevoir des notifications. Une interface d’administration permettra également de créer, modifier ou supprimer des événements et de suivre les inscriptions.

L’intégration avec Discord permettra d’envoyer automatiquement des annonces, rappels ou alertes via webhook.

## Gestion de projet

Nous utiliserons **Trello** afin d’organiser les tâches du projet et suivre l’avancement du développement.

Le tableau Trello permettra :
- de répartir les tâches entre les membres du groupe
- de suivre les fonctionnalités à développer
- d’organiser les priorités
- de visualiser l’avancement du projet
- de gérer les bugs et améliorations

## Fonctionnalités principales

- Création, modification et suppression d’événements
- Affichage des événements à venir
- Inscription et désinscription des utilisateurs
- Gestion des rôles : utilisateur, organisateur, administrateur
- Notifications Discord automatiques
- Tableau de bord d’administration
- Suivi des logs applicatifs
- Monitoring de l’application et des conteneurs

## Stack choisie


### Commandes importantes pour le front-end

Dans le dossier `frontend`, utilisez ces commandes pour garantir la qualité et le formatage du code :

```sh
npm run lint      # vérifie ESLint + Prettier
npm run format    # formate tous les fichiers
```


### Commandes importantes pour le back-end

Dans le dossier `backend`, utilisez ces commandes pour garantir la qualité et le formatage du code :

```sh
npm run lint      # vérifie ESLint + Prettier
npm run format    # formate tous les fichiers
```

Une fois le backend lancé, la documentation Swagger des routes `auth`, `events` et `registrations` est disponible sur
[`http://localhost:3000/api-docs`](http://localhost:3000/api-docs). Le document OpenAPI brut
est également exposé sur [`http://localhost:3000/api-docs.json`](http://localhost:3000/api-docs.json).

### Front-end : React + Vite

Nous avons choisi **React** car c’est une technologie très utilisée pour créer des interfaces web dynamiques et modulaires. Elle permet de découper l’interface en composants réutilisables, ce qui facilite l’organisation du projet.

Nous utilisons **Vite** car il est plus simple et plus léger que Next.js pour notre besoin. Notre application ne nécessite pas forcément de rendu côté serveur. Vite permet donc de démarrer rapidement le projet avec une configuration plus simple et un temps de compilation rapide.

### Back-end : Node.js + Express.js

Nous avons choisi **Node.js** pour utiliser JavaScript sur toute la partie front-end et back-end, ce qui simplifie le développement pour l’équipe.

**Express.js** a été choisi car c’est un framework simple, léger et rapide à mettre en place pour créer une API REST. Il permet de gérer facilement les routes, les middlewares, l’authentification et les échanges avec la base de données.

### Base de données : PostgreSQL

Nous avons choisi **PostgreSQL** car c’est une base de données relationnelle fiable et adaptée à notre projet. Elle permet de gérer proprement les relations entre les utilisateurs, les événements, les inscriptions et les rôles.

### ORM : Prisma

Nous avons choisi **Prisma** pour simplifier les échanges entre le back-end et la base de données. Prisma permet de définir les modèles de données clairement, de générer les migrations et d’écrire des requêtes plus lisibles qu’avec du SQL brut.

## Modèle de données

Cette section documente les modèles Prisma au fur et à mesure de leur création, afin de garder une vue d’ensemble du schéma de base de données. Le schéma complet est disponible dans [`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma).

### User

Représente un compte utilisateur de la plateforme (utilisateur, organisateur ou administrateur).

| Champ           | Type      | Description                                                            |
|-----------------|-----------|--------------------------------------------------------------------------|
| id              | String    | Identifiant unique (UUID)                                                |
| email           | String    | Email, unique, utilisé pour la connexion                                 |
| password        | String    | Mot de passe hashé                                                       |
| name            | String    | Nom affiché de l’utilisateur                                             |
| role            | Role      | Rôle : `USER`, `ORGANIZER` ou `ADMIN` (défaut `USER`)                    |
| discordId       | String?   | Identifiant Discord lié au compte (optionnel), pour les notifications    |
| avatar          | String?   | URL de la photo de profil (optionnel)                                    |
| isActive        | Boolean   | Permet de désactiver un compte sans le supprimer (défaut `true`)         |
| emailVerified   | Boolean   | Indique si l’email a été vérifié (défaut `false`)                        |
| createdAt       | DateTime  | Date de création                                                          |
| updatedAt       | DateTime  | Date de dernière modification                                            |

### Event

Représente un événement communautaire créé par un organisateur ou un administrateur.

| Champ            | Type        | Description                                                              |
|------------------|-------------|----------------------------------------------------------------------------|
| id               | String      | Identifiant unique (UUID)                                                |
| title            | String      | Titre de l’événement                                                     |
| description      | String      | Description de l’événement                                              |
| date             | DateTime    | Date et heure de début                                                  |
| endDate          | DateTime?   | Date et heure de fin (optionnel)                                        |
| location         | String      | Lieu de l’événement (adresse, ou "en ligne")                            |
| capacity         | Int?        | Nombre maximum de participants (optionnel, pas de limite si vide)       |
| status           | EventStatus | Statut : `DRAFT`, `PUBLISHED` ou `CANCELLED` (défaut `DRAFT`)            |
| discordChannelId | String?     | Identifiant du salon Discord lié à l’événement (optionnel)              |
| discordMessageId | String?     | Identifiant du message Discord d’annonce (optionnel)                    |
| creatorId        | String      | Référence vers le `User` qui a créé l’événement                         |
| createdAt        | DateTime    | Date de création                                                          |
| updatedAt        | DateTime    | Date de dernière modification                                            |

### Registration

Représente l’inscription d’un utilisateur (`User`) à un événement (`Event`).

| Champ     | Type               | Description                                                              |
|-----------|--------------------|----------------------------------------------------------------------------|
| id        | String             | Identifiant unique (UUID)                                                |
| userId    | String             | Référence vers le `User` inscrit                                         |
| eventId   | String             | Référence vers l’`Event` concerné                                        |
| status    | RegistrationStatus | Statut : `CONFIRMED`, `CANCELLED` ou `WAITLISTED` (défaut `CONFIRMED`)   |
| createdAt | DateTime           | Date d’inscription                                                        |

Un utilisateur ne peut s’inscrire qu’une seule fois au même événement (contrainte unique sur `userId` + `eventId`).

## Conteneurisation

L’application sera conteneurisée avec **Docker**.

Chaque partie du projet sera lancée dans un conteneur séparé :

- un conteneur pour le front-end
- un conteneur pour le back-end
- un conteneur pour la base de données PostgreSQL
- des conteneurs pour les outils de monitoring

Nous utiliserons **Docker Compose** en environnement de développement afin de lancer facilement tous les services avec une seule commande.

En production, le déploiement ne repose plus sur ces conteneurs mais sur **Vercel** (voir [Infrastructure](#infrastructure) et [`project.md`](./project.md)).

## CI/CD

Nous mettrons en place une pipeline CI/CD avec **GitHub Actions**.

La pipeline contiendra plusieurs étapes :

- lint : vérification de la qualité du code
- test : exécution des tests automatisés
- build : construction de l’application
- build Docker : création des images Docker (environnement de développement uniquement)
- deploy : déploiement sur **Vercel** piloté par la pipeline elle-même via la CLI `vercel` (`vercel build` + `vercel deploy`), et non par l'intégration Git native de Vercel — production sur push `main`, preview sur push `develop`

L’utilisation de GitHub Actions permettra d’automatiser les vérifications du projet à chaque push ou pull request afin de limiter les erreurs et améliorer la qualité du code. Le détail de la mise en place du déploiement Vercel est documenté dans [`project.md`](./project.md).

## Gestion des environnements

Nous prévoirons deux environnements, chacun associé à une branche :

- `develop` → environnement de dev / intégration (INT), déploiement **Preview** sur Vercel
- `main` → environnement de production (prod), déploiement **Production** sur Vercel

Chaque environnement pourra avoir sa propre configuration grâce aux variables d’environnement, par exemple :

- URL de la base de données
- clé secrète JWT
- URL du webhook Discord
- configuration du serveur

Les fichiers sensibles ne seront pas versionnés dans Git.

## Infrastructure

> ⚠️ Plan initial (abandonné) : déploiement sur un serveur sécurisé en SSH.
> - connexion SSH par clé
> - utilisateur dédié pour le déploiement
> - désactivation de la connexion root si nécessaire
> - variables d’environnement sécurisées

Nous déployons finalement sur **Vercel** :

- le front-end et le back-end sont déployés comme deux projets Vercel distincts, connectés au même dépôt GitHub
- la base de données PostgreSQL est hébergée chez **Neon** (intégration "Vercel Postgres"), compatible avec les fonctions serverless
- aucune gestion de serveur (SSH, OS, mises à jour système) n’est nécessaire, Vercel gère l’infrastructure
- les variables sensibles sont stockées dans les paramètres de chaque projet Vercel, par environnement (Production / Preview)

Voir [`project.md`](./project.md) pour le détail de la mise en place.

## Orchestrateur

> ⚠️ Plan initial (abandonné) : nous prévoyions d’utiliser **Docker Swarm** comme orchestrateur, plus simple à prendre en main que Kubernetes pour gérer plusieurs services et le redémarrage automatique des conteneurs.

Avec le passage à **Vercel**, l’application tourne en serverless : il n’y a plus de conteneurs à orchestrer, Vercel gère nativement le scaling et le redémarrage des fonctions.

## Monitoring

> ⚠️ Plan initial (abandonné) : **Prometheus** (métriques), **Grafana** (tableaux de bord) et **Loki** (centralisation des logs), en complément du webhook Discord pour les alertes.

Sur Vercel, ces outils ne s’appliquent plus tels quels (pas de conteneurs ni de serveur à superviser). À redéfinir si besoin avec les outils natifs de Vercel (Logs, Observability) le moment venu.

## Alertes Discord

Le back-end poste automatiquement des messages sur un webhook Discord (`backend/services/discord.service.js`), sans jamais faire échouer une requête si Discord est indisponible ou mal configuré :

- **Annonce de création** : un message est envoyé à chaque création d’événement (`POST /events`)
- **Rappel 24h avant l’événement** : route `GET /cron/reminder`, protégée par un secret (`CRON_SECRET`), déclenchée par un **Vercel Cron Job** (`backend/vercel.json`, champ `crons`) une fois par jour. Comme le plan Hobby de Vercel limite les cron jobs à une exécution quotidienne, la route cible une fenêtre de 24h à 48h avant le début de l’événement plutôt qu’un rappel calé à la minute près. ⚠️ Les Cron Jobs Vercel ne se déclenchent qu’en environnement **Production**.
- **Erreur critique** : le middleware d’erreur global d’Express (`backend/app.js`) envoie une alerte pour toute erreur 500 non prévue, avec la route concernée. Un throttling best-effort (5 min, en mémoire) évite de spammer le webhook si une panne déclenche des erreurs en rafale — ce n'est qu'un best-effort : l'état n'est pas partagé entre plusieurs instances serverless froides

Cela permet d’être rapidement informé en cas de problème, sans dépendre d’un outil de monitoring externe.

## Convention de commits

Nous utiliserons les Conventional Commits afin de standardiser les messages de commit et faciliter le suivi du projet.

Exemples :

- feat: ajout du système d’authentification
- fix: correction d’un bug sur les inscriptions
- docs: mise à jour du README
- test: ajout des tests API

## Convention de branches

Pour vos branches de travail, le format à respecter est le suivant :

[prefix]/[ticket-trello]-[description_courte]

Exemple : feature/APP-12345-ajout_filtrage_expedition

Les préfixes disponibles :
• feature → nouvelle fonctionnalité
• bugfix → correction de bug
• hotfix → correctif urgent en prod
• release → préparation d'une release
• chore → tâches techniques / maintenance
• refactor → refactoring sans changement fonctionnel

## Convention de Pull Request

Pour chaque PR, mettre un titre clair et structuré tel que :
• [Type] {NO TICKET} - {Description courte}

Exemples :
• [Feature] APP-1642 – InventoryArrivedML – Flux Dematic to Queue
• [Bugfix] APP-1632 – Changement colisage
• [Hotfix] APP-1618 – Correction crash création création 1 article
• [Refacto] APP-1618 - Passage au pipeline Yaml sur Azure Devops

## Installation & Lancement

### Prérequis
- Docker et Docker Compose installés

### 1. Cloner le dépôt
```sh
git clone https://github.com/AbadieThomasPro/App-gestion-event-community.git
cd App-gestion-event-community
```


### 2. Configurer les fichiers `.env`

#### `.env` à la racine (pour Docker Compose)
```env
POSTGRES_USER=dev
POSTGRES_PASSWORD=dev
POSTGRES_DB=app_events
DATABASE_URL=postgresql://dev:dev@db:5432/app_events
```

#### `backend/.env` (pour développement local hors Docker)

Copier `backend/.env.example` vers `backend/.env` et adapter les valeurs si besoin :
```sh
cp backend/.env.example backend/.env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Connexion Postgres locale (hors Docker, hostname `localhost`) |
| `DATABASE_URL_UNPOOLED` | Connexion directe, utilisée par les migrations Prisma (identique à `DATABASE_URL` en local) |
| `JWT_SECRET` | Secret de signature/vérification des JWT |
| `FRONTEND_URL` | Origine autorisée par CORS pour les requêtes du frontend (`http://localhost:4200` en local) |
| `DISCORD_WEBHOOK_URL` | URL du webhook Discord utilisé pour les annonces, rappels et alertes (optionnel en local : si absent, les envois sont simplement ignorés) |
| `CRON_SECRET` | Secret partagé avec Vercel Cron Jobs, vérifié sur `GET /cron/reminder` |

#### `frontend/.env` (optionnel en local, requis en déploiement)

Copier `frontend/.env.example` vers `frontend/.env` :
```sh
cp frontend/.env.example frontend/.env
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL de base de l'API backend (`http://localhost:3000` en local) |

### 3. Lancer l'environnement de développement
```sh
docker compose up
```

- Frontend : http://localhost:4200
- Administration des événements : http://localhost:4200/admin
- Utilisateurs et inscriptions : http://localhost:4200/admin/users  
  Ces deux pages sont réservées au rôle `ADMIN` (garde de rôle dans `frontend/src/components/RequireAuth.jsx`,
  routes `/admin/*` protégées côté backend par `requireRole('ADMIN')`). Il n'y a pas de compte admin par défaut :
  pour donner les droits admin à un compte, passer son champ `role` à `ADMIN` via `npx prisma studio`
  (dans `backend/`) ou directement en base, puis se reconnecter sur `/login` avec ce compte.
- Backend : http://localhost:3000
- Adminer (gestion base de données) : http://localhost:8080  
	(serveur : `db`, utilisateur : `dev`, mot de passe : `dev`)
