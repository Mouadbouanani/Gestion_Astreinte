# 🏗️ Architecture Frontend OCP Astreinte

## 📁 **STRUCTURE ORGANISÉE**

```
src/
├── components/
│   ├── common/              # Composants réutilisables
│   │   ├── Layout/          # ✅ Layout, Sidebar, Header
│   │   ├── Navigation/      # 🔄 À développer
│   │   ├── Loading/         # 🔄 À développer
│   │   └── Modal/           # 🔄 À développer
│   ├── auth/               # 🔄 Composants d'authentification
│   ├── planning/           # 🔄 Composants de planification
│   ├── dashboard/          # 🔄 Tableaux de bord
│   ├── escalade/           # 🔄 Système d'escalade
│   ├── notifications/      # 🔄 Notifications
│   └── ui/                 # ✅ Button, Input, Card, Badge
├── pages/
│   ├── Dashboard/          # ✅ Dashboard principal
│   ├── Planning/           # 🔄 À développer
│   ├── UserManagement/     # 🔄 À développer
│   ├── Reports/            # 🔄 À développer
│   └── Settings/           # 🔄 À développer
├── hooks/
│   ├── useAuth.ts          # ✅ Hook d'authentification
│   ├── usePlanning.ts      # 🔄 À développer
│   ├── useNotifications.ts # 🔄 À développer
│   └── useEscalation.ts    # 🔄 À développer
├── context/
│   ├── AuthContext.tsx     # ✅ Contexte d'authentification
│   ├── PlanningContext.tsx # 🔄 À développer
│   └── NotificationContext.tsx # 🔄 À développer
├── services/
│   ├── api.ts              # ✅ Service API principal
│   ├── auth.service.ts     # 🔄 À développer
│   ├── planning.service.ts # 🔄 À développer
│   └── notification.service.ts # 🔄 À développer
└── types/
    └── index.ts            # ✅ Types TypeScript
```

## ✅ **COMPOSANTS MIGRÉS**

### **Layout**
- ✅ `Layout.tsx` - Layout principal
- ✅ `Sidebar.tsx` - Navigation latérale avec rôles
- ✅ `Header.tsx` - En-tête avec menu utilisateur

### **Context**
- ✅ `AuthContext.tsx` - Gestion authentification JWT

### **Pages**
- ✅ `Dashboard.tsx` - Tableau de bord personnalisé

### **Hooks**
- ✅ `useAuth.ts` - Hook d'authentification

### **Services**
- ✅ `api.ts` - Service API complet avec Axios

## 🔄 **COMPOSANTS À DÉVELOPPER**

### **Planning**
- `PlanningCalendar.tsx` - Calendrier de planning
- `PlanningForm.tsx` - Formulaire de planning
- `PlanningList.tsx` - Liste des plannings

### **Escalade**
- `EscalationRules.tsx` - Règles d'escalade
- `EscalationFlow.tsx` - Flux d'escalade
- `EscalationHistory.tsx` - Historique d'escalade

### **Notifications**
- `NotificationCenter.tsx` - Centre de notifications
- `NotificationItem.tsx` - Item de notification
- `NotificationSettings.tsx` - Paramètres notifications

## 🎯 **AVANTAGES DE CETTE ARCHITECTURE**

### **📦 Modularité**
- Composants organisés par fonctionnalité
- Réutilisabilité maximale
- Maintenance facilitée

### **🔧 Séparation des responsabilités**
- **Components** : Interface utilisateur
- **Hooks** : Logique métier réutilisable
- **Context** : État global partagé
- **Services** : Communication API
- **Types** : Typage TypeScript

### **🚀 Évolutivité**
- Structure claire pour ajouter de nouvelles fonctionnalités
- Patterns cohérents
- Tests facilités

## 📋 **CONVENTIONS DE NOMMAGE**

### **Fichiers**
- **Composants** : `PascalCase.tsx`
- **Hooks** : `useCamelCase.ts`
- **Services** : `camelCase.service.ts`
- **Types** : `index.ts`

### **Dossiers**
- **Modules** : `PascalCase/`
- **Utilitaires** : `camelCase/`

### **Exports**
- **Index files** : Exports centralisés
- **Named exports** : Préférés aux default exports

## 🔗 **IMPORTS RECOMMANDÉS**

```typescript
// Composants UI
import { Button, Input, Card } from '@/components/ui';

// Layout
import { Layout, Sidebar, Header } from '@/components/common/Layout';

// Hooks
import { useAuth, usePlanning } from '@/hooks';

// Services
import { apiService, planningService } from '@/services';

// Types
import { User, Planning, Notification } from '@/types';
```

## 🎯 **PROCHAINES ÉTAPES**

1. **Développer les composants Planning**
2. **Implémenter le système d'escalade**
3. **Créer les notifications en temps réel**
4. **Ajouter les tests unitaires**
5. **Optimiser les performances**

---

## 🎉 **ARCHITECTURE MODERNE ET ÉVOLUTIVE**

Cette nouvelle architecture respecte les meilleures pratiques React/TypeScript et facilite le développement collaboratif et la maintenance à long terme.
