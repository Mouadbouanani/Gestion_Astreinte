# 🏭 OCP Astreinte Management System - Backend API

## 📋 Description

API backend pour le système de gestion des astreintes de l'Office Chérifien des Phosphates (OCP). Cette application gère la planification et l'escalade des gardes weekends et jours fériés sur l'ensemble des 8 sites industriels OCP.

## 🏗️ Architecture

### Stack Technique
- **Runtime**: Node.js avec ES Modules
- **Framework**: Express.js 5.x
- **Base de données**: MongoDB avec Mongoose ODM
- **Authentification**: JWT avec refresh tokens
- **Sécurité**: Helmet, CORS, Rate Limiting
- **Validation**: Joi

### Structure Organisationnelle
```
Sites OCP (8) → Secteurs → Services → Utilisateurs
```

**Sites**: Casablanca, Jorf Lasfar, Khouribga, Boucraâ, Youssoufia, Safi, Benguerir, Laâyoune
**Secteurs**: Traitement, Extraction, Maintenance, Logistique, Qualité
**Rôles**: Admin, Chef Secteur, Ingénieur, Chef Service, Collaborateur

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 18+ 
- MongoDB 6+
- npm ou yarn

### Installation
```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp config.env.example config.env
# Éditer config.env avec vos paramètres

# Initialiser la base de données avec des données de test
npm run seed

# Démarrer le serveur en mode développement
npm run dev

# Ou en mode production
npm start
```

### Variables d'Environnement
```env
# Base de données
ATLAS_URI=mongodb://localhost:27017/gestion_astreinte

# Serveur
PORT=5050
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your_super_secure_secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Sécurité
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=7200000
```

## 📊 Modèles de Données

### User (Utilisateur)
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  role: Enum['admin', 'chef_secteur', 'ingenieur', 'chef_service', 'collaborateur'],
  site: ObjectId,
  secteur: ObjectId,
  service: ObjectId,
  isActive: Boolean
}
```

### Site
```javascript
{
  name: Enum[8 sites OCP],
  code: String (unique),
  address: String,
  coordinates: { latitude, longitude },
  configuration: {
    escaladeTimeouts: { niveau1ToNiveau2, niveau2ToNiveau3 },
    notifications: { sms, email, push },
    planning: { generateInAdvance, minPersonnelPerService }
  }
}
```

### Planning
```javascript
{
  type: Enum['service', 'secteur'],
  periode: { debut: Date, fin: Date },
  site: ObjectId,
  secteur: ObjectId,
  service: ObjectId,
  gardes: [{
    date: Date,
    utilisateur: ObjectId,
    statut: Enum['planifie', 'confirme', 'absent', 'remplace']
  }],
  statut: Enum['brouillon', 'en_validation', 'valide', 'publie']
}
```

### Escalade
```javascript
{
  incident: String,
  typeIncident: Enum,
  priorite: Enum['basse', 'normale', 'haute', 'critique'],
  site: ObjectId,
  secteur: ObjectId,
  service: ObjectId,
  niveaux: [{
    niveau: Number (1-3),
    utilisateur: ObjectId,
    dateContact: Date,
    reponse: Boolean,
    tempsReponse: Number
  }],
  statut: Enum['en_cours', 'resolu', 'echec']
}
```

## 🔐 Authentification et Autorisation

### Système JWT
- **Access Token**: 24h de validité
- **Refresh Token**: 7 jours, stocké en cookie httpOnly
- **Rate Limiting**: 5 tentatives de connexion par 15 minutes

### Rôles et Permissions
```javascript
// Hiérarchie des rôles
admin > chef_secteur > ingenieur > chef_service > collaborateur

// Scopes (portées)
- global: Admin (tous sites)
- secteur: Chef secteur, Ingénieur (leur secteur)
- service: Chef service, Collaborateur (leur service)
- personal: Données personnelles uniquement
```

## 🛣️ Routes API

### Authentification (`/api/auth`)
```
POST   /login              # Connexion
POST   /logout             # Déconnexion
POST   /refresh            # Rafraîchir token
GET    /me                 # Profil utilisateur
PUT    /change-password    # Changer mot de passe
PUT    /profile            # Mettre à jour profil
GET    /check              # Vérifier authentification
```

### Utilisateurs (`/api/users`) - À implémenter
```
GET    /                   # Liste utilisateurs
POST   /                   # Créer utilisateur
GET    /:id                # Détails utilisateur
PUT    /:id                # Modifier utilisateur
DELETE /:id                # Supprimer utilisateur
```

### Plannings (`/api/plannings`) - À implémenter
```
GET    /                   # Liste plannings
POST   /                   # Créer planning
POST   /generate           # Générer planning automatique
PUT    /:id                # Modifier planning
PUT    /:id/validate       # Valider planning
DELETE /:id                # Supprimer planning
```

### Escalades (`/api/escalades`) - À implémenter
```
GET    /                   # Liste escalades
POST   /                   # Créer escalade
POST   /trigger            # Déclencher escalade
PUT    /:id/respond        # Répondre à escalade
GET    /:id/status         # Statut escalade
```

## 🧪 Données de Test

Après avoir exécuté `npm run seed`, vous aurez accès aux comptes suivants :

### Comptes Administrateur
- **Email**: admin@ocp.ma
- **Mot de passe**: Admin123!
- **Rôle**: Administrateur National

### Comptes de Test par Site
- **Chefs de secteur**: chef.[secteur-code]@ocp.ma / Chef123!
- **Chefs de service**: chef.[service-code]@ocp.ma / Chef123!
- **Collaborateurs**: collab[n].[service-code]@ocp.ma / Collab123!
- **Ingénieurs**: ing.[secteur-code]@ocp.ma / Ing123!

Exemple pour le site de Casablanca :
- chef.cas-trt@ocp.ma (Chef Secteur Traitement)
- chef.cas-trt-prod-u1@ocp.ma (Chef Service Production U1)
- collab1.cas-trt-prod-u1@ocp.ma (Collaborateur)

## 🔧 Développement

### Structure du Projet
```
server/
├── config/           # Configuration (auth, database)
├── controllers/      # Logique métier
├── middleware/       # Middleware (auth, validation)
├── models/          # Modèles Mongoose
├── routes/          # Routes Express
├── scripts/         # Scripts utilitaires
├── services/        # Services métier
└── utils/           # Utilitaires
```

### Prochaines Étapes
1. ✅ **Phase 1**: Authentification et modèles de base
2. 🔄 **Phase 2**: CRUD utilisateurs et structure organisationnelle
3. 📅 **Phase 3**: Système de planification
4. 🚨 **Phase 4**: Système d'escalade et notifications
5. 📊 **Phase 5**: Tableaux de bord et reporting

### Scripts Disponibles
```bash
npm start          # Démarrer en production
npm run dev        # Démarrer en développement avec watch
npm run seed       # Initialiser la base de données
npm test           # Lancer les tests (à implémenter)
```

## 📝 Logs et Monitoring

Le serveur log automatiquement :
- Toutes les requêtes HTTP avec timestamp et IP
- Erreurs de validation et de base de données
- Tentatives de connexion et échecs d'authentification
- Erreurs système avec stack trace en développement

## 🔒 Sécurité

### Mesures Implémentées
- **Helmet**: Protection contre les vulnérabilités web communes
- **CORS**: Configuration stricte des origines autorisées
- **Rate Limiting**: Protection contre les attaques par déni de service
- **JWT**: Tokens sécurisés avec expiration
- **Bcrypt**: Hashage des mots de passe avec salt
- **Validation**: Validation stricte des données d'entrée
- **Account Locking**: Verrouillage après tentatives échouées

### Recommandations Production
- Utiliser HTTPS uniquement
- Configurer des secrets JWT forts
- Activer les logs de sécurité
- Mettre en place un monitoring
- Sauvegardes automatiques de la base de données

## 📞 Support

Pour toute question ou problème :
- **Documentation**: Voir les commentaires dans le code
- **Issues**: Créer une issue sur le repository
- **Contact**: Équipe IT OCP

---

**Version**: 1.0.0  
**Dernière mise à jour**: Janvier 2025  
**Équipe**: OCP IT Team
