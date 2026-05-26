# Plateforme de gestion d’événements communautaires connectée à Discord

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

Dans le dossier `back`, utilisez ces commandes pour garantir la qualité et le formatage du code :

```sh
npm run lint      # vérifie ESLint + Prettier
npm run format    # formate tous les fichiers
```

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

## Conteneurisation

L’application sera conteneurisée avec **Docker**.

Chaque partie du projet sera lancée dans un conteneur séparé :

- un conteneur pour le front-end
- un conteneur pour le back-end
- un conteneur pour la base de données PostgreSQL
- des conteneurs pour les outils de monitoring

Nous utiliserons **Docker Compose** en environnement de développement afin de lancer facilement tous les services avec une seule commande.

## CI/CD

Nous mettrons en place une pipeline CI/CD avec **GitHub Actions**.

La pipeline contiendra plusieurs étapes :

- lint : vérification de la qualité du code
- test : exécution des tests automatisés
- build : construction de l’application
- build Docker : création des images Docker
- deploy : déploiement de l’application sur le serveur

L’utilisation de GitHub Actions permettra d’automatiser les vérifications du projet à chaque push ou pull request afin de limiter les erreurs et améliorer la qualité du code.

## Gestion des environnements

Nous prévoirons plusieurs environnements :

- développement
- staging
- production

Chaque environnement pourra avoir sa propre configuration grâce aux variables d’environnement, par exemple :

- URL de la base de données
- clé secrète JWT
- URL du webhook Discord
- configuration du serveur

Les fichiers sensibles ne seront pas versionnés dans Git.

## Infrastructure

L’application sera déployée sur un serveur sécurisé.

Les bonnes pratiques prévues sont :

- connexion SSH par clé
- utilisateur dédié pour le déploiement
- désactivation de la connexion root si nécessaire
- variables d’environnement sécurisées

## Orchestrateur

Nous prévoyons d’utiliser **Docker Swarm** comme orchestrateur.

Docker Swarm est plus simple à prendre en main que Kubernetes tout en permettant de gérer plusieurs services, le redémarrage automatique des conteneurs et le déploiement d’une application conteneurisée.

## Monitoring

Nous mettrons en place un système de monitoring pour surveiller l’état de l’application et de l’infrastructure.

Outils envisagés :

- **Prometheus** pour récupérer les métriques
- **Grafana** pour afficher les tableaux de bord
- **Loki** pour centraliser les logs
- webhook Discord pour envoyer des alertes

## Alertes Discord

Discord sera utilisé pour recevoir certaines alertes automatiquement.

Exemples d’alertes :

- un conteneur est arrêté
- l’API ne répond plus
- l’utilisation CPU est trop élevée
- une erreur critique apparaît dans les logs

Cela permet d’être rapidement informé en cas de problème.

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
