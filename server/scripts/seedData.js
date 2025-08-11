import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Site from '../models/Site.js';
import Secteur from '../models/Secteur.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import Planning from '../models/Planning.js';
import Indisponibilite from '../models/Indisponibilite.js';

// Configuration des variables d'environnement
dotenv.config({ path: './config.env' });

// Données de base pour les sites OCP
const sitesData = [
  {
    name: 'Casablanca',
    code: 'CAS',
    address: 'Zone Industrielle Ain Sebaa, Casablanca, Maroc',
    coordinates: { latitude: 33.5731, longitude: -7.5898 },
    configuration: {
      escaladeTimeouts: { niveau1ToNiveau2: 15, niveau2ToNiveau3: 30 },
      notifications: { smsEnabled: true, emailEnabled: true, pushEnabled: true },
      planning: { generateInAdvance: 30, minPersonnelPerService: 1 }
    }
  },
  {
    name: 'Jorf Lasfar',
    code: 'JLF',
    address: 'Complexe Chimique Jorf Lasfar, El Jadida, Maroc',
    coordinates: { latitude: 33.1056, longitude: -8.6333 },
    configuration: {
      escaladeTimeouts: { niveau1ToNiveau2: 20, niveau2ToNiveau3: 45 },
      notifications: { smsEnabled: true, emailEnabled: true, pushEnabled: true },
      planning: { generateInAdvance: 30, minPersonnelPerService: 2 }
    }
  },
  {
    name: 'Khouribga',
    code: 'KHO',
    address: 'Site Minier de Khouribga, Khouribga, Maroc',
    coordinates: { latitude: 32.8811, longitude: -6.9063 },
    configuration: {
      escaladeTimeouts: { niveau1ToNiveau2: 10, niveau2ToNiveau3: 25 },
      notifications: { smsEnabled: true, emailEnabled: true, pushEnabled: false },
      planning: { generateInAdvance: 30, minPersonnelPerService: 2 }
    }
  },
  {
    name: 'Boucraâ',
    code: 'BOU',
    address: 'Site Minier de Boucraâ, Laâyoune, Maroc',
    coordinates: { latitude: 26.1333, longitude: -14.5167 },
    configuration: {
      escaladeTimeouts: { niveau1ToNiveau2: 25, niveau2ToNiveau3: 60 },
      notifications: { smsEnabled: true, emailEnabled: false, pushEnabled: false },
      planning: { generateInAdvance: 30, minPersonnelPerService: 1 }
    }
  },
  {
    name: 'Youssoufia',
    code: 'YOU',
    address: 'Site Minier de Youssoufia, Youssoufia, Maroc',
    coordinates: { latitude: 32.2547, longitude: -8.5286 },
    configuration: {
      escaladeTimeouts: { niveau1ToNiveau2: 15, niveau2ToNiveau3: 35 },
      notifications: { smsEnabled: true, emailEnabled: true, pushEnabled: true },
      planning: { generateInAdvance: 30, minPersonnelPerService: 1 }
    }
  },
  {
    name: 'Safi',
    code: 'SAF',
    address: 'Complexe Chimique de Safi, Safi, Maroc',
    coordinates: { latitude: 32.2994, longitude: -9.2372 },
    configuration: {
      escaladeTimeouts: { niveau1ToNiveau2: 20, niveau2ToNiveau3: 40 },
      notifications: { smsEnabled: true, emailEnabled: true, pushEnabled: true },
      planning: { generateInAdvance: 30, minPersonnelPerService: 2 }
    }
  },
  {
    name: 'Benguerir',
    code: 'BEN',
    address: 'Site Minier de Benguerir, Benguerir, Maroc',
    coordinates: { latitude: 32.2361, longitude: -7.9528 },
    configuration: {
      escaladeTimeouts: { niveau1ToNiveau2: 15, niveau2ToNiveau3: 30 },
      notifications: { smsEnabled: true, emailEnabled: true, pushEnabled: true },
      planning: { generateInAdvance: 30, minPersonnelPerService: 1 }
    }
  },
  {
    name: 'Laâyoune',
    code: 'LAA',
    address: 'Site de Laâyoune, Laâyoune, Maroc',
    coordinates: { latitude: 27.1536, longitude: -13.2033 },
    configuration: {
      escaladeTimeouts: { niveau1ToNiveau2: 30, niveau2ToNiveau3: 90 },
      notifications: { smsEnabled: true, emailEnabled: false, pushEnabled: false },
      planning: { generateInAdvance: 30, minPersonnelPerService: 1 }
    }
  }
];

// Données des secteurs par site
const secteursData = [
  { name: 'Traitement', code: 'TRT' },
  { name: 'Extraction', code: 'EXT' },
  { name: 'Maintenance', code: 'MNT' },
  { name: 'Logistique', code: 'LOG' },
  { name: 'Qualité', code: 'QLT' }
];

// Données des services par secteur
const servicesData = {
  'Traitement': [
    { name: 'Production U1', code: 'PROD-U1', minPersonnel: 2 },
    { name: 'Production U2', code: 'PROD-U2', minPersonnel: 2 },
    { name: 'Contrôle Qualité', code: 'CTRL-QLT', minPersonnel: 1 }
  ],
  'Extraction': [
    { name: 'Forage', code: 'FOR', minPersonnel: 3 },
    { name: 'Dynamitage', code: 'DYN', minPersonnel: 2 },
    { name: 'Transport', code: 'TRP', minPersonnel: 2 }
  ],
  'Maintenance': [
    { name: 'Électricité', code: 'ELEC', minPersonnel: 2 },
    { name: 'Mécanique', code: 'MECA', minPersonnel: 3 },
    { name: 'Instrumentation', code: 'INST', minPersonnel: 1 }
  ],
  'Logistique': [
    { name: 'Approvisionnement', code: 'APPR', minPersonnel: 1 },
    { name: 'Expédition', code: 'EXPE', minPersonnel: 2 },
    { name: 'Stockage', code: 'STCK', minPersonnel: 1 }
  ],
  'Qualité': [
    { name: 'Laboratoire', code: 'LABO', minPersonnel: 1 },
    { name: 'Contrôle Process', code: 'CTRL-PROC', minPersonnel: 1 }
  ]
};

// Noms réalistes pour les utilisateurs
const realNames = {
  firstNames: [
    'Ahmed', 'Mohamed', 'Fatima', 'Amina', 'Hassan', 'Karim', 'Sara', 'Nadia',
    'Youssef', 'Rachid', 'Leila', 'Samira', 'Omar', 'Ali', 'Zineb', 'Khadija',
    'Mustapha', 'Abdelkader', 'Malika', 'Hakima', 'Tarik', 'Adil', 'Naima', 'Hayat'
  ],
  lastNames: [
    'Alami', 'Bennani', 'Tazi', 'Amrani', 'Benali', 'Chraibi', 'El Fassi', 'Hassani',
    'Idrissi', 'Jabri', 'Khalil', 'Lahbabi', 'Mansouri', 'Naciri', 'Ouazzani', 'Poujol',
    'Qasmi', 'Rachidi', 'Saadi', 'Tahiri', 'Ummi', 'Vidal', 'Wahbi', 'Zahri'
  ]
};

// Fonction pour se connecter à la base de données
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.ATLAS_URI || 'mongodb://localhost:27017/gestion_astreinte';
    await mongoose.connect(mongoUri);
    console.log(' Connexion à MongoDB réussie');
  } catch (error) {
    console.error(' Erreur de connexion à MongoDB:', error);
    process.exit(1);
  }
};

// Fonction pour nettoyer la base de données
const cleanDatabase = async () => {
  try {
    await Indisponibilite.deleteMany({});
    await Planning.deleteMany({});
    await User.deleteMany({});
    await Service.deleteMany({});
    await Secteur.deleteMany({});
    await Site.deleteMany({});
    console.log(' Base de données nettoyée');
  } catch (error) {
    console.error(' Erreur lors du nettoyage:', error);
  }
};

// Fonction pour créer les sites
const createSites = async () => {
  try {
    const sites = await Site.insertMany(sitesData);
    console.log(` ${sites.length} sites créés`);
    return sites;
  } catch (error) {
    console.error(' Erreur création sites:', error);
    throw error;
  }
};

// Fonction pour créer les secteurs
const createSecteurs = async (sites) => {
  try {
    const secteurs = [];
    
    for (const site of sites) {
      for (const secteurData of secteursData) {
        const secteur = new Secteur({
          name: secteurData.name,
          code: `${site.code}-${secteurData.code}`,
          site: site._id,
          chefSecteur: null, // Sera mis à jour après création des utilisateurs
          description: `Secteur ${secteurData.name} du site ${site.name}`
        });
        secteurs.push(secteur);
      }
    }
    
    const createdSecteurs = await Secteur.insertMany(secteurs);
    console.log(` ${createdSecteurs.length} secteurs créés`);
    return createdSecteurs;
  } catch (error) {
    console.error(' Erreur création secteurs:', error);
    throw error;
  }
};

// Fonction pour créer les services
const createServices = async (secteurs) => {
  try {
    const services = [];
    
    for (const secteur of secteurs) {
      const secteurName = secteur.name;
      const servicesForSecteur = servicesData[secteurName] || [];
      
      for (const serviceData of servicesForSecteur) {
        const service = new Service({
          name: serviceData.name,
          code: `${secteur.code}-${serviceData.code}`,
          secteur: secteur._id,
          chefService: null, // Sera mis à jour après création des utilisateurs
          collaborateurs: [],
          description: `Service ${serviceData.name} du secteur ${secteurName}`,
          minPersonnel: serviceData.minPersonnel
        });
        services.push(service);
      }
    }
    
    const createdServices = await Service.insertMany(services);
    console.log(` ${createdServices.length} services créés`);
    return createdServices;
  } catch (error) {
    console.error(' Erreur création services:', error);
    throw error;
  }
};

// Fonction pour générer un nom aléatoire
const getRandomName = () => {
  const firstName = realNames.firstNames[Math.floor(Math.random() * realNames.firstNames.length)];
  const lastName = realNames.lastNames[Math.floor(Math.random() * realNames.lastNames.length)];
  return { firstName, lastName };
};

// Fonction pour créer l'administrateur
const createAdmin = async (sites) => {
  try {
    const admin = new User({
      firstName: 'Admin',
      lastName: 'OCP',
      email: 'admin@ocp.ma',
      phone: '+212661234567',
      password: 'Admin123!',
      role: 'admin',
      site: sites[0]._id, // Casablanca par défaut
      isActive: true
    });
    
    await admin.save();
    console.log(' Administrateur créé - Email: admin@ocp.ma, Mot de passe: Admin123!');
    return admin;
  } catch (error) {
    console.error(' Erreur création admin:', error);
    throw error;
  }
};

// Fonction pour créer des utilisateurs de test
const createTestUsers = async (sites, secteurs, services) => {
  try {
    const users = [];
    const engineersBySecteur = new Map(); // Pour tracker les ingénieurs par secteur
    
    // Créer un chef de secteur pour chaque secteur
    for (const secteur of secteurs) {
      const site = sites.find(s => s._id.toString() === secteur.site.toString());
      const { firstName, lastName } = getRandomName();
      
      const user = new User({
        firstName,
        lastName,
        email: `chef.${secteur.code.toLowerCase()}@ocp.ma`,
        phone: `+21266${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        password: 'Chef123!',
        role: 'chef_secteur',
        site: site._id,
        secteur: secteur._id,
        address: `${site.name}, Maroc`,
        isActive: true
      });
      users.push(user);
      
      // Mettre à jour le secteur avec le chef
      secteur.chefSecteur = user._id;
    }
    
    // Créer des chefs de service et collaborateurs
    for (const service of services) {
      const secteur = secteurs.find(s => s._id.toString() === service.secteur.toString());
      const site = sites.find(s => s._id.toString() === secteur.site.toString());
      
      // Chef de service
      const { firstName: chefFirstName, lastName: chefLastName } = getRandomName();
      const chefService = new User({
        firstName: chefFirstName,
        lastName: chefLastName,
        email: `chef.${service.code.toLowerCase()}@ocp.ma`,
        phone: `+21266${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        password: 'Chef123!',
        role: 'chef_service',
        site: site._id,
        secteur: secteur._id,
        service: service._id,
        address: `${site.name}, Maroc`,
        isActive: true
      });
      users.push(chefService);
      
      // Mettre à jour le service avec le chef
      service.chefService = chefService._id;
      
      // Collaborateurs (2-4 par service selon minPersonnel)
      const nbCollaborateurs = Math.max(service.minPersonnel, Math.floor(Math.random() * 3) + 2);
      for (let i = 1; i <= nbCollaborateurs; i++) {
        const { firstName, lastName } = getRandomName();
        const collaborateur = new User({
          firstName,
          lastName,
          email: `collab${i}.${service.code.toLowerCase()}@ocp.ma`,
          phone: `+21266${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
          password: 'Collab123!',
          role: 'collaborateur',
          site: site._id,
          secteur: secteur._id,
          service: service._id,
          address: `${site.name}, Maroc`,
          isActive: true
        });
        users.push(collaborateur);
        service.collaborateurs.push(collaborateur._id);
      }
      
      // Ingénieur responsable (1 par secteur, pas par service)
      if (!engineersBySecteur.has(secteur._id.toString())) {
        const { firstName, lastName } = getRandomName();
        const ingenieur = new User({
          firstName,
          lastName,
          email: `ing.${secteur.code.toLowerCase()}@ocp.ma`,
          phone: `+21266${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
          password: 'Ing123!',
          role: 'ingenieur',
          site: site._id,
          secteur: secteur._id,
          address: `${site.name}, Maroc`,
          isActive: true
        });
        users.push(ingenieur);
        engineersBySecteur.set(secteur._id.toString(), ingenieur._id);
      }
    }
    
    // Sauvegarder tous les utilisateurs
    const createdUsers = await User.insertMany(users);
    
    // Sauvegarder les secteurs et services mis à jour
    await Promise.all(secteurs.map(s => s.save()));
    await Promise.all(services.map(s => s.save()));
    
    console.log(` ${createdUsers.length} utilisateurs créés`);
    return createdUsers;
  } catch (error) {
    console.error(' Erreur création utilisateurs:', error);
    throw error;
  }
};

// Fonction pour créer des indisponibilités de test
const createTestIndisponibilites = async (users) => {
  try {
    const indisponibilites = [];
    const today = new Date();
    
    // Créer quelques indisponibilités pour différents utilisateurs
    const testUsers = users.filter(u => ['collaborateur', 'ingenieur'].includes(u.role));
    
    for (let i = 0; i < Math.min(10, testUsers.length); i++) {
      const user = testUsers[i];
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1); // Dans les 30 prochains jours
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 3) + 1); // 1-3 jours
      
      const indisponibilite = new Indisponibilite({
        utilisateur: user._id,
        motif: ['conge_annuel', 'conge_maladie', 'formation', 'mission', 'urgence_familiale'][Math.floor(Math.random() * 5)],
        dateDebut: startDate,
        dateFin: endDate,
        description: `Demande de test pour ${user.firstName} ${user.lastName}`,
        statut: ['en_attente', 'approuve', 'refuse'][Math.floor(Math.random() * 3)],
        priorite: ['normale', 'urgente'][Math.floor(Math.random() * 2)],
        approbation: {
          approuvePar: user.role === 'collaborateur' ? 
            users.find(u => u.role === 'chef_service' && u.service === user.service)?._id :
            users.find(u => u.role === 'chef_secteur' && u.secteur === user.secteur)?._id,
          niveauApprobation: user.role === 'collaborateur' ? 'chef_service' : 'chef_secteur'
        }
      });
      
      indisponibilites.push(indisponibilite);
    }
    
    if (indisponibilites.length > 0) {
      await Indisponibilite.insertMany(indisponibilites);
      console.log(` ${indisponibilites.length} indisponibilités de test créées`);
    }
    
    return indisponibilites;
  } catch (error) {
    console.error(' Erreur création indisponibilités:', error);
    throw error;
  }
};

// Fonction pour créer des plannings de test
const createTestPlannings = async (sites, secteurs, services, users) => {
  try {
    const plannings = [];
    const today = new Date();
    
    // Créer des plannings pour les 4 prochaines semaines
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + (week * 7));
      
      // Planning par service (Niveau 1)
      for (const service of services) {
        const serviceUsers = users.filter(u => 
          u.service && u.service.toString() === service._id.toString() &&
          ['collaborateur', 'chef_service'].includes(u.role)
        );
        
        if (serviceUsers.length > 0) {
          const planning = new Planning({
            type: 'service',
            periode: {
              debut: new Date(weekStart),
              fin: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000) // +6 jours
            },
            site: service.secteur.site,
            secteur: service.secteur,
            service: service._id,
            gardes: [], // Sera rempli par l'algorithme de rotation
            statut: 'brouillon',
            createdBy: users.find(u => u.role === 'chef_service' && u.service === service._id)?._id
          });
          
          plannings.push(planning);
        }
      }
      
      // Planning par secteur (Niveau 2) - seulement pour les ingénieurs
      for (const secteur of secteurs) {
        const secteurEngineers = users.filter(u => 
          u.secteur && u.secteur.toString() === secteur._id.toString() &&
          u.role === 'ingenieur'
        );
        
        if (secteurEngineers.length > 0) {
          const planning = new Planning({
            type: 'secteur',
            periode: {
              debut: new Date(weekStart),
              fin: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000) // +6 jours
            },
            site: secteur.site,
            secteur: secteur._id,
            gardes: [], // Sera rempli par l'algorithme de rotation
            statut: 'brouillon',
            createdBy: users.find(u => u.role === 'chef_secteur' && u.secteur === secteur._id)?._id
          });
          
          plannings.push(planning);
        }
      }
    }
    
    if (plannings.length > 0) {
      await Planning.insertMany(plannings);
      console.log(` ${plannings.length} plannings de test créés`);
    }
    
    return plannings;
  } catch (error) {
    console.error(' Erreur création plannings:', error);
    throw error;
  }
};

// Fonction principale de seeding
const seedDatabase = async () => {
  try {
    console.log('🚀 Début du seeding de la base de données...');
    
    await connectDB();
    console.log('✅ Connexion à la base de données réussie');
    
    await cleanDatabase();
    console.log('🧹 Base de données nettoyée');
    
    console.log('🏗️ Création des sites...');
    const sites = await createSites();
    console.log(`✅ ${sites.length} sites créés`);
    
    console.log('🏢 Création des secteurs...');
    const secteurs = await createSecteurs(sites);
    console.log(`✅ ${secteurs.length} secteurs créés`);
    
    console.log('⚙️ Création des services...');
    const services = await createServices(secteurs);
    console.log(`✅ ${services.length} services créés`);
    
    console.log('👤 Création de l\'administrateur...');
    await createAdmin(sites);
    console.log('✅ Administrateur créé');
    
    console.log('👥 Création des utilisateurs de test...');
    const users = await createTestUsers(sites, secteurs, services);
    console.log(`✅ ${users.length} utilisateurs créés`);
    
    console.log('🚫 Création des indisponibilités de test...');
    await createTestIndisponibilites(users);
    console.log('✅ Indisponibilités de test créées');
    
    console.log('📅 Création des plannings de test...');
    await createTestPlannings(sites, secteurs, services, users);
    console.log('✅ Plannings de test créés');
    
    console.log('\n🎉 Seeding terminé avec succès!');
    console.log('\n📋 Comptes de test créés:');
    console.log('  Admin: admin@ocp.ma / Admin123!');
    console.log('  Chefs de secteur: chef.[secteur]@ocp.ma / Chef123!');
    console.log('  Chefs de service: chef.[service]@ocp.ma / Chef123!');
    console.log('  Collaborateurs: collab[n].[service]@ocp.ma / Collab123!');
    console.log('  Ingénieurs: ing.[secteur]@ocp.ma / Ing123!');
    console.log('\n📊 Données de test créées:');
    console.log('  - Indisponibilités de test');
    console.log('  - Plannings de test (4 semaines)');
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion fermée');
    process.exit(0);
  }
};

// Exécuter le seeding si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;
