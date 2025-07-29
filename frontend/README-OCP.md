# 🎯 Frontend OCP Astreinte - Guide Complet

## 🚀 **DÉMARRAGE RAPIDE**

### **1. Installation des dépendances**
```bash
cd frontend
npm install
```

### **2. Démarrage du serveur de développement**
```bash
npm run dev
```

### **3. Accès à l'application**
- **URL**: http://localhost:5173
- **Backend**: http://localhost:5050 (doit être démarré)

---

## 🎨 **ARCHITECTURE FRONTEND**

### **📁 Structure des dossiers**
```
frontend/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── ui/             # Composants UI de base
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Badge.tsx
│   │   ├── layout/         # Layout et navigation
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/           # Contextes React
│   │   └── AuthContext.tsx
│   ├── pages/              # Pages de l'application
│   │   ├── Login.tsx
│   │   └── Dashboard.tsx
│   ├── services/           # Services API
│   │   └── api.ts
│   ├── types/              # Types TypeScript
│   │   └── index.ts
│   ├── App.tsx             # Composant principal
│   ├── main.jsx            # Point d'entrée
│   └── index.css           # Styles globaux
├── public/                 # Fichiers statiques
├── package.json            # Dépendances
├── tailwind.config.js      # Configuration Tailwind
├── vite.config.ts          # Configuration Vite
└── tsconfig.json           # Configuration TypeScript
```

### **🔧 Technologies utilisées**
- **React 19** + **TypeScript**
- **Tailwind CSS** (styles OCP)
- **React Router DOM** (navigation)
- **Axios** (API calls)
- **React Hook Form** (formulaires)
- **React Hot Toast** (notifications)
- **Heroicons** (icônes)
- **Vite** (build tool)

---

## 🎨 **THÈME OCP**

### **🎨 Couleurs principales**
```css
/* Couleurs OCP */
--ocp-primary: #3baf1eff     /* Bleu OCP principal */
--ocp-secondary: #102e0cff   /* Bleu foncé */
--ocp-accent: #f59e0b      /* Orange/Jaune OCP */
--ocp-success: #10b981     /* Vert */
--ocp-warning: #f59e0b     /* Orange */
--ocp-error: #ef4444       /* Rouge */

/* Couleurs par rôle */
--role-admin: #dc2626      /* Rouge admin */
--role-chef-secteur: #f59e0b /* Orange chef secteur */
--role-chef-service: #3bf65aff /* Bleu chef service */
--role-ingenieur: #10b981   /* Vert ingénieur */
--role-collaborateur: #6b7280 /* Gris collaborateur */
```

### **🎨 Classes CSS personnalisées**
```css
/* Boutons */
.btn-primary    /* Bouton principal OCP */
.btn-secondary  /* Bouton secondaire */
.btn-success    /* Bouton succès */
.btn-warning    /* Bouton avertissement */
.btn-error      /* Bouton erreur */

/* Cards */
.card-ocp       /* Card avec style OCP */
.card-header    /* En-tête de card */
.card-body      /* Corps de card */
.card-footer    /* Pied de card */

/* Inputs */
.input-ocp      /* Input avec style OCP */
.input-error    /* Input en erreur */

/* Navigation */
.nav-link-active    /* Lien actif */
.nav-link-inactive  /* Lien inactif */

/* Badges de rôle */
.badge-admin           /* Badge administrateur */
.badge-chef-secteur    /* Badge chef secteur */
.badge-chef-service    /* Badge chef service */
.badge-ingenieur       /* Badge ingénieur */
.badge-collaborateur   /* Badge collaborateur */
```

---

## 🔐 **SYSTÈME D'AUTHENTIFICATION**

### **🔑 Connexion**
- **Mode Production**: Email + Mot de passe
- **Mode Développement**: Email uniquement (JWT automatique)

### **👥 Utilisateurs de test**
```javascript
// Utilisateurs disponibles en mode dev
const devUsers = [
  { email: 'y.bennani@ocp.ma', name: 'Youssef Bennani', role: 'Admin' },
  { email: 'a.alami@ocp.ma', name: 'Ahmed Alami', role: 'Chef Secteur' },
  { email: 'r.amrani@ocp.ma', name: 'Rachid Amrani', role: 'Chef Service' },
  { email: 'm.tazi@ocp.ma', name: 'Mohamed Tazi', role: 'Ingénieur' },
  { email: 'f.benali@ocp.ma', name: 'Fatima Benali', role: 'Collaborateur' },
];
```

### **🛡️ Protection des routes**
```tsx
// Route protégée simple
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Route avec rôles requis
<ProtectedRoute requiredRoles={['admin', 'chef_secteur']}>
  <AdminPanel />
</ProtectedRoute>
```

---

## 📱 **NAVIGATION PAR RÔLE**

### **🔴 Admin**
- Dashboard
- Sites
- Secteurs  
- Services
- Utilisateurs
- Rapports
- Paramètres

### **🟡 Chef Secteur**
- Dashboard
- Mon Secteur
- Mes Services
- Planning Astreinte
- Rapports

### **🔵 Chef Service**
- Dashboard
- Mon Service
- Planning Astreinte
- Rapports

### **🟢 Ingénieur**
- Dashboard
- Planning Astreinte
- Mes Gardes

### **🟣 Collaborateur**
- Dashboard
- Planning Astreinte
- Mes Gardes

---

## 🔗 **API ET BACKEND**

### **🌐 Configuration API**
```typescript
// Configuration automatique
const API_BASE_URL = 'http://localhost:5050/api';

// Proxy Vite (développement)
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5050',
      changeOrigin: true,
    },
  },
}
```

### **🔑 Authentification automatique**
```typescript
// Token JWT automatiquement ajouté
this.api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ocp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### **📡 Services disponibles**
```typescript
// Authentification
apiService.login(credentials)
apiService.loginDev(email)
apiService.logout()
apiService.getCurrentUser()

// Sites
apiService.getSites()
apiService.createSite(data)
apiService.updateSite(id, data)
apiService.deleteSite(id)

// Secteurs
apiService.getSecteurs()
apiService.createSecteur(data)
apiService.updateSecteur(id, data)

// Services
apiService.getServices()
apiService.createService(data)
apiService.updateService(id, data)

// Utilisateurs
apiService.getUsers(filters)
apiService.updateUser(id, data)
```

---

## 🚀 **DÉPLOIEMENT**

### **📦 Build de production**
```bash
npm run build
```

### **🔍 Preview du build**
```bash
npm run preview
```

### **📁 Fichiers générés**
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── vite.svg
```

---

## 🎯 **PROCHAINES ÉTAPES**

### **📋 Pages à développer**
1. **Gestion des Sites** (Admin)
2. **Gestion des Secteurs** (Admin)
3. **Gestion des Services** (Admin)
4. **Gestion des Utilisateurs** (Admin)
5. **Planning d'Astreinte** (Tous)
6. **Mes Gardes** (Ingénieur/Collaborateur)
7. **Rapports** (Admin/Chef)
8. **Profil Utilisateur** (Tous)

### **🔧 Fonctionnalités à ajouter**
- [ ] Notifications en temps réel
- [ ] Gestion des fichiers
- [ ] Export PDF/Excel
- [ ] Mode sombre
- [ ] Responsive mobile
- [ ] PWA (Progressive Web App)
- [ ] Tests unitaires
- [ ] Internationalisation (i18n)

---

## 🎉 **FRONTEND OCP PRÊT !**

**Votre frontend OCP avec authentification JWT, navigation par rôles, et design moderne est maintenant opérationnel !**

### ✅ **Fonctionnalités implémentées**
- ✅ **Authentification JWT** avec backend
- ✅ **Navigation par rôles** automatique
- ✅ **Design OCP** avec Tailwind CSS
- ✅ **Protection des routes** par rôle
- ✅ **API intégrée** avec gestion d'erreurs
- ✅ **Notifications** toast
- ✅ **Layout responsive** moderne
- ✅ **TypeScript** pour la robustesse

**Démarrez maintenant avec `npm run dev` et connectez-vous !** 🚀
