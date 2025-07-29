# 📅 **PLANNING DASHBOARD OCP ASTREINTE**

## ✅ **FONCTIONNALITÉS IMPLÉMENTÉES**

### **🗓️ Planning Intégré au Dashboard**
- ✅ **Calendrier hebdomadaire** : Vue planning par semaine
- ✅ **Filtres hiérarchiques** : Site → Secteur → Service
- ✅ **Affichage des gardes** : Ingénieurs et Collaborateurs
- ✅ **Navigation temporelle** : Semaine précédente/suivante

### **🔍 Système de Filtres**

#### **📍 Filtre par Site**
- **Khouribga (KHB)**
- **Safi (SAF)**
- **Jorf Lasfar (JLF)**
- **Benguerir (BNG)**
- **Youssoufia (YSF)**

#### **🏢 Filtre par Secteur (selon site)**
- **Khouribga** : Production, Maintenance, Logistique
- **Safi** : Chimie, Utilités, Expédition
- **Jorf Lasfar** : Phosphorique, Sulfurique, Engrais

#### **⚙️ Filtre par Service (selon secteur)**
- **Production** : Extraction, Traitement, Qualité
- **Maintenance** : Mécanique, Électricité, Instrumentation
- **Chimie** : Réacteurs, Purification, Contrôle Process

### **👥 Types de Personnel**

#### **🔵 Ingénieurs** (Bleu)
- **Responsabilités** : Supervision technique, décisions critiques
- **Gardes** : Jour, Nuit, Weekend
- **Affichage** : Badge bleu dans le planning

#### **🟢 Collaborateurs** (Vert)
- **Responsabilités** : Support technique, maintenance
- **Gardes** : Jour, Nuit, Weekend
- **Affichage** : Badge vert dans le planning

## 🎯 **UTILISATION DU PLANNING**

### **1. Accès au Planning**
```
http://localhost:5174 → Dashboard → Section Planning
```

### **2. Navigation**
- **Semaine précédente** : Bouton ← 
- **Semaine suivante** : Bouton →
- **Période affichée** : Du Lundi au Dimanche

### **3. Filtrage**
1. **Sélectionner un Site** : Liste déroulante des sites OCP
2. **Choisir un Secteur** : Secteurs du site sélectionné
3. **Filtrer par Service** : Services du secteur choisi
4. **Effacer les filtres** : Bouton "Effacer" (X)

### **4. Lecture du Planning**
- **Jour actuel** : Surligné en vert clair
- **Assignations** : Cartes colorées par type
- **Informations** : Nom, Secteur-Service, Type de garde

## 📊 **DONNÉES AFFICHÉES**

### **🗓️ Pour Chaque Jour**
- **Date** : Numéro du jour
- **Assignations** : Liste des personnes de garde
- **Détails** : Nom, secteur, service, type de garde

### **👤 Pour Chaque Personne**
- **Nom complet** : Prénom + Nom
- **Localisation** : Secteur - Service
- **Type de garde** : 🌅 Jour / 🌙 Nuit / 🏖️ Weekend
- **Rôle** : Ingénieur (bleu) / Collaborateur (vert)

## 🎨 **INTERFACE UTILISATEUR**

### **📱 Layout Responsive**
- **Desktop** : Filtres à gauche (1/4) + Planning à droite (3/4)
- **Mobile** : Filtres au-dessus + Planning en dessous
- **Navigation** : Boutons précédent/suivant

### **🎯 Indicateurs Visuels**
- **Jour actuel** : Fond vert clair
- **Ingénieurs** : Badge bleu
- **Collaborateurs** : Badge vert
- **Gardes** : Icônes 🌅🌙🏖️

### **⚡ Interactions**
- **Filtres en cascade** : Site → Secteur → Service
- **Mise à jour automatique** : Planning se met à jour selon les filtres
- **Navigation fluide** : Changement de semaine instantané

## 🧪 **DONNÉES DE TEST**

### **📋 Exemples d'Assignations**
```
15 Jan 2024:
- Ahmed Benali (Ingénieur) - Khouribga/Production/Maintenance - Jour
- Fatima Alami (Collaborateur) - Khouribga/Production/Électricité - Nuit

16 Jan 2024:
- Mohamed Tazi (Ingénieur) - Safi/Logistique/Transport - Jour
```

### **🔍 Test des Filtres**
1. **Sélectionner "Khouribga"** → Voir secteurs de Khouribga
2. **Choisir "Production"** → Voir services de Production
3. **Filtrer "Maintenance"** → Voir uniquement les gardes Maintenance

## 🚀 **PROCHAINES AMÉLIORATIONS**

### **📈 Fonctionnalités Avancées**
- **Vue mensuelle** : Planning sur un mois complet
- **Gestion des conflits** : Détection des doublons
- **Notifications** : Alertes pour les gardes à venir
- **Export** : PDF/Excel du planning

### **⚙️ Administration**
- **Création d'assignations** : Interface d'ajout
- **Modification** : Drag & drop pour changer les gardes
- **Validation** : Workflow d'approbation
- **Historique** : Suivi des modifications

---

## 🎉 **PLANNING DASHBOARD OPÉRATIONNEL !**

**Votre dashboard OCP affiche maintenant un planning d'astreinte complet avec filtres hiérarchiques !**

### ✅ **Fonctionnalités Actives**
- 📅 **Planning hebdomadaire** : Vue claire des assignations
- 🔍 **Filtres intelligents** : Site → Secteur → Service
- 👥 **Personnel identifié** : Ingénieurs et Collaborateurs
- 🎨 **Interface intuitive** : Navigation fluide et responsive

**Testez maintenant votre planning sur : http://localhost:5174** 📊
