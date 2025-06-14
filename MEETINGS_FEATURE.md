# Fonctionnalité des Réunions - Plateforme Éducative

## Vue d'ensemble

Cette fonctionnalité permet aux professeurs d'organiser des réunions Zoom avec leurs étudiants. Les professeurs peuvent sélectionner les étudiants qu'ils souhaitent inviter, créer une réunion avec un titre personnalisé, et envoyer automatiquement des invitations par email avec le lien Zoom.

## Fonctionnalités

### Pour les Professeurs

1. **Bouton "Appeler Réunion"** : Accessible depuis le dashboard du professeur
2. **Sélection des Étudiants** : Interface modale pour cocher les étudiants à inviter
3. **Titre de Réunion** : Saisie du titre de la réunion
4. **Génération de Lien Zoom** : Génération automatique d'un lien Zoom
5. **Envoi d'Emails** : Envoi automatique d'invitations par email
6. **Historique des Réunions** : Affichage de toutes les réunions organisées

### Pour les Étudiants

1. **Onglet "Réunions"** : Accès aux réunions auxquelles ils sont invités
2. **Lien Direct** : Bouton pour rejoindre directement la réunion Zoom
3. **Informations Détaillées** : Titre, date de création, nombre de participants

## Structure de la Base de Données

### Table `meetings`

- `id` : Identifiant unique de la réunion
- `title` : Titre de la réunion
- `zoomLink` : Lien Zoom de la réunion
- `professorId` : ID du professeur organisateur
- `createdAt` : Date de création de la réunion

### Table `meeting_participants`

- `id` : Identifiant unique
- `meetingId` : ID de la réunion
- `userId` : ID de l'étudiant participant
- `joinedAt` : Date de participation

## API Endpoints

### GET `/api/meetings`

- **Description** : Récupère toutes les réunions organisées par le professeur
- **Authentification** : Requise (professeur uniquement)
- **Réponse** : Liste des réunions avec leurs participants

### POST `/api/meetings`

- **Description** : Crée une nouvelle réunion
- **Authentification** : Requise (professeur uniquement)
- **Corps** : `{ title, zoomLink, participantIds }`
- **Actions** : Crée la réunion, ajoute les participants, envoie les emails

### GET `/api/student/meetings`

- **Description** : Récupère les réunions d'un étudiant
- **Authentification** : Requise (étudiant uniquement)
- **Réponse** : Liste des réunions auxquelles l'étudiant est invité

## Composants Frontend

### `MeetingManager.tsx`

- Composant principal pour la gestion des réunions (professeur)
- Gère la sélection des étudiants et la création de réunions
- Affiche l'historique des réunions organisées

### `StudentMeetingsTab.tsx`

- Composant pour afficher les réunions aux étudiants
- Interface claire avec liens directs vers Zoom
- Informations détaillées sur chaque réunion

## Flux d'Utilisation

1. **Le professeur clique sur "Appeler Réunion"**
2. **Sélection des étudiants** dans une modale
3. **Saisie du titre** de la réunion
4. **Génération automatique** du lien Zoom
5. **Envoi des emails** aux étudiants sélectionnés
6. **Les étudiants reçoivent** l'invitation par email
7. **Les étudiants peuvent voir** la réunion dans leur dashboard
8. **Les étudiants peuvent rejoindre** la réunion via le lien Zoom

## Configuration Email

Les emails sont envoyés via Gmail avec les paramètres suivants :

- **Service** : Gmail
- **Expéditeur** : professor@edu.com
- **Contenu** : Template HTML avec titre, lien Zoom et informations du professeur

## Installation et Configuration

1. **Exécuter le script de base de données** :

   ```bash
   node setup_database.js
   ```

2. **Vérifier la configuration email** dans `server/index.js`

3. **Redémarrer le serveur** pour activer les nouvelles routes

## Notes Techniques

- Les liens Zoom sont générés de manière fictive pour la démonstration
- Dans un environnement de production, utilisez l'API Zoom officielle
- Les emails sont envoyés de manière asynchrone
- La fonctionnalité est entièrement intégrée dans l'interface existante

## Sécurité

- Authentification requise pour toutes les routes
- Vérification des rôles (professeur/étudiant)
- Protection contre les injections SQL via mysql2
- Validation des données côté serveur
