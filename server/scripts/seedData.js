import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Site from '../models/Site.js';
import Secteur from '../models/Secteur.js';
import Service from '../models/Service.js';
import User from '../models/User.js';

// Configuration des variables d'environnement
dotenv.config({ path: './config.env' });

// Données de base pour les sites OCP
const sitesData = [
  {
    name: 'Casablanca',
    code: 'CAS',
    address: 'Zone Industrielle Ain Sebaa, Casablanca, Maroc',
    coordinates: { latitude: 33.5731, longitude: -7.5898 }
  },
  {
    name: 'Jorf Lasfar',
    code: 'JLF',
    address: 'Complexe Chimique Jorf Lasfar, El Jadida, Maroc',
    coordinates: { latitude: 33.1056, longitude: -8.6333 }
  },
  {
    name: 'Khouribga',
    code: 'KHO',
    address: 'Site Minier de Khouribga, Khouribga, Maroc',
    coordinates: { latitude: 32.8811, longitude: -6.9063 }
  },
  {
    name: 'Boucraâ',
    code: 'BOU',
    address: 'Site Minier de Boucraâ, Laâyoune, Maroc',
    coordinates: { latitude: 26.1333, longitude: -14.5167 }
  },
  {
    name: 'Youssoufia',
    code: 'YOU',
    address: 'Site Minier de Youssoufia, Youssoufia, Maroc',
    coordinates: { latitude: 32.2547, longitude: -8.5286 }
  },
  {
    name: 'Safi',
    code: 'SAF',
    address: 'Complexe Chimique de Safi, Safi, Maroc',
    coordinates: { latitude: 32.2994, longitude: -9.2372 }
  },
  {
    name: 'Benguerir',
    code: 'BEN',
    address: 'Site Minier de Benguerir, Benguerir, Maroc',
    coordinates: { latitude: 32.2361, longitude: -7.9528 }
  },
  {
    name: 'Laâyoune',
    code: 'LAA',
    address: 'Site de Laâyoune, Laâyoune, Maroc',
    coordinates: { latitude: 27.1536, longitude: -13.2033 }
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
    
    // Créer un chef de secteur pour chaque secteur
    for (const secteur of secteurs) {
      const site = sites.find(s => s._id.toString() === secteur.site.toString());
      const user = new User({
        firstName: 'Chef',
        lastName: `Secteur ${secteur.name}`,
        email: `chef.${secteur.code.toLowerCase()}@ocp.ma`,
        phone: `+21266${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        password: 'Chef123!',
        role: 'chef_secteur',
        site: site._id,
        secteur: secteur._id,
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
      const chefService = new User({
        firstName: 'Chef',
        lastName: `Service ${service.name}`,
        email: `chef.${service.code.toLowerCase()}@ocp.ma`,
        phone: `+21266${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        password: 'Chef123!',
        role: 'chef_service',
        site: site._id,
        secteur: secteur._id,
        service: service._id,
        isActive: true
      });
      users.push(chefService);
      
      // Mettre à jour le service avec le chef
      service.chefService = chefService._id;
      
      // Collaborateurs (2-3 par service)
      const nbCollaborateurs = Math.floor(Math.random() * 2) + 2; // 2 ou 3
      for (let i = 1; i <= nbCollaborateurs; i++) {
        const collaborateur = new User({
          firstName: `Collaborateur${i}`,
          lastName: service.name,
          email: `collab${i}.${service.code.toLowerCase()}@ocp.ma`,
          phone: `+21266${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
          password: 'Collab123!',
          role: 'collaborateur',
          site: site._id,
          secteur: secteur._id,
          service: service._id,
          isActive: true
        });
        users.push(collaborateur);
        service.collaborateurs.push(collaborateur._id);
      }
      
      // Ingénieur responsable (1 par secteur)
      if (services.indexOf(service) % 3 === 0) { // Un ingénieur pour 3 services
        const ingenieur = new User({
          firstName: 'Ingénieur',
          lastName: `Responsable ${secteur.name}`,
          email: `ing.${secteur.code.toLowerCase()}@ocp.ma`,
          phone: `+21266${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
          password: 'Ing123!',
          role: 'ingenieur',
          site: site._id,
          secteur: secteur._id,
          isActive: true
        });
        users.push(ingenieur);
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

// Fonction principale de seeding
const seedDatabase = async () => {
  try {
    console.log(' Début du seeding de la base de données...');
    
    await connectDB();
    await cleanDatabase();
    
    const sites = await createSites();
    const secteurs = await createSecteurs(sites);
    const services = await createServices(secteurs);
    
    await createAdmin(sites);
    await createTestUsers(sites, secteurs, services);
    
    console.log(' Seeding terminé avec succès!');
    console.log('\n Comptes de test créés:');
    console.log(' Admin: admin@ocp.ma / Admin123!');
    console.log(' Chefs de secteur: chef.[secteur]@ocp.ma / Chef123!');
    console.log(' Chefs de service: chef.[service]@ocp.ma / Chef123!');
    console.log(' Collaborateurs: collab[n].[service]@ocp.ma / Collab123!');
    console.log(' Ingénieurs: ing.[secteur]@ocp.ma / Ing123!');
    
  } catch (error) {
    console.error(' Erreur lors du seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log(' Connexion fermée');
    process.exit(0);
  }
};

// Exécuter le seeding si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;
