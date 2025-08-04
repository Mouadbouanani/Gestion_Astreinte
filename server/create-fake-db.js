import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

console.log('🏭 Creating comprehensive fake OCP database...');

// Connect to MongoDB Atlas
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.ATLAS_URI || 'mongodb://localhost:27017/gestion_astreinte';
    console.log('🔗 Connecting to MongoDB Atlas:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    return mongoose.connection;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

// Define schemas (matching your models)
const siteSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  address: { type: String, required: true },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  timezone: { type: String, default: 'Africa/Casablanca' },
  isActive: { type: Boolean, default: true },
  configuration: {
    escaladeTimeouts: {
      niveau1ToNiveau2: { type: Number, default: 15 },
      niveau2ToNiveau3: { type: Number, default: 30 }
    },
    notifications: {
      smsEnabled: { type: Boolean, default: true },
      emailEnabled: { type: Boolean, default: true },
      pushEnabled: { type: Boolean, default: true }
    },
    planning: {
      generateInAdvance: { type: Number, default: 30 },
      minPersonnelPerService: { type: Number, default: 1 }
    }
  },
  statistics: {
    totalUsers: { type: Number, default: 0 },
    totalSecteurs: { type: Number, default: 0 },
    totalServices: { type: Number, default: 0 }
  }
}, { timestamps: true });

const secteurSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  chefSecteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  secteur: { type: mongoose.Schema.Types.ObjectId, ref: 'Secteur', required: true },
  chefService: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  collaborateurs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  description: String,
  minPersonnel: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  address: String,
  password: { type: String, required: true, select: false },
  role: { 
    type: String, 
    required: true,
    enum: ['admin', 'chef_secteur', 'ingenieur', 'chef_service', 'collaborateur']
  },
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  secteur: { type: mongoose.Schema.Types.ObjectId, ref: 'Secteur' },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date
}, { timestamps: true });

const planningSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['service', 'secteur']
  },
  periode: {
    debut: { type: Date, required: true },
    fin: { type: Date, required: true }
  },
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  secteur: { type: mongoose.Schema.Types.ObjectId, ref: 'Secteur', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  gardes: [{
    date: { type: Date, required: true },
    utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    statut: {
      type: String,
      enum: ['planifie', 'confirme', 'absent', 'remplace'],
      default: 'planifie'
    },
    heureDebut: { type: String, default: '18:00' },
    heureFin: { type: String, default: '08:00' },
    commentaire: String
  }],
  statut: {
    type: String,
    enum: ['brouillon', 'en_validation', 'valide', 'publie', 'archive'],
    default: 'brouillon'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const indisponibiliteSchema = new mongoose.Schema({
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateDebut: { type: Date, required: true },
  dateFin: { type: Date, required: true },
  motif: {
    type: String,
    required: true,
    enum: ['conge_annuel', 'conge_maladie', 'formation', 'mission', 'urgence_familiale', 'autre']
  },
  description: String,
  statut: {
    type: String,
    enum: ['en_attente', 'approuve', 'refuse', 'annule'],
    default: 'en_attente'
  },
  priorite: {
    type: String,
    enum: ['normale', 'urgente', 'critique'],
    default: 'normale'
  },
  approbation: {
    approuvePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approuveLe: Date,
    commentaireApprobation: String,
    niveauApprobation: {
      type: String,
      enum: ['chef_service', 'chef_secteur', 'automatique']
    }
  }
}, { timestamps: true });

// Create models
const Site = mongoose.model('Site', siteSchema);
const Secteur = mongoose.model('Secteur', secteurSchema);
const Service = mongoose.model('Service', serviceSchema);
const User = mongoose.model('User', userSchema);
const Planning = mongoose.model('Planning', planningSchema);
const Indisponibilite = mongoose.model('Indisponibilite', indisponibiliteSchema);

// Real OCP sites data
const sitesData = [
  {
    name: 'Casablanca',
    code: 'CAS',
    address: 'Zone Industrielle Ain Sebaa, Casablanca 20250, Maroc',
    coordinates: { latitude: 33.5731, longitude: -7.5898 },
    configuration: {
      escaladeTimeouts: { niveau1ToNiveau2: 15, niveau2ToNiveau3: 30 },
      notifications: { smsEnabled: true, emailEnabled: true, pushEnabled: true },
      planning: { generateInAdvance: 30, minPersonnelPerService: 2 }
    }
  },
  {
    name: 'Jorf Lasfar',
    code: 'JLF',
    address: 'Complexe Chimique Jorf Lasfar, El Jadida 24000, Maroc',
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
    address: 'Site Minier de Khouribga, Khouribga 25000, Maroc',
    coordinates: { latitude: 32.8811, longitude: -6.9063 },
    configuration: {
      escaladeTimeouts: { niveau1ToNiveau2: 10, niveau2ToNiveau3: 25 },
      notifications: { smsEnabled: true, emailEnabled: true, pushEnabled: false },
      planning: { generateInAdvance: 30, minPersonnelPerService: 2 }
    }
  },
  {
    name: 'Safi',
    code: 'SAF',
    address: 'Complexe Chimique de Safi, Safi 46000, Maroc',
    coordinates: { latitude: 32.2994, longitude: -9.2372 },
    configuration: {
      escaladeTimeouts: { niveau1ToNiveau2: 20, niveau2ToNiveau3: 40 },
      notifications: { smsEnabled: true, emailEnabled: true, pushEnabled: true },
      planning: { generateInAdvance: 30, minPersonnelPerService: 2 }
    }
  },
  {
    name: 'Boucraâ',
    code: 'BOU',
    address: 'Site Minier de Boucraâ, Laâyoune 70000, Maroc',
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
    address: 'Site Minier de Youssoufia, Youssoufia 46300, Maroc',
    coordinates: { latitude: 32.2547, longitude: -8.5286 },
    configuration: {
      escaladeTimeouts: { niveau1ToNiveau2: 15, niveau2ToNiveau3: 35 },
      notifications: { smsEnabled: true, emailEnabled: true, pushEnabled: true },
      planning: { generateInAdvance: 30, minPersonnelPerService: 1 }
    }
  },
  {
    name: 'Benguerir',
    code: 'BEN',
    address: 'Site Minier de Benguerir, Benguerir 43150, Maroc',
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
    address: 'Site de Laâyoune, Laâyoune 70000, Maroc',
    coordinates: { latitude: 27.1536, longitude: -13.2033 },
    configuration: {
      escaladeTimeouts: { niveau1ToNiveau2: 30, niveau2ToNiveau3: 90 },
      notifications: { smsEnabled: true, emailEnabled: false, pushEnabled: false },
      planning: { generateInAdvance: 30, minPersonnelPerService: 1 }
    }
  }
];

// Secteurs data
const secteursData = [
  { name: 'Traitement', code: 'TRT' },
  { name: 'Extraction', code: 'EXT' },
  { name: 'Maintenance', code: 'MNT' },
  { name: 'Logistique', code: 'LOG' },
  { name: 'Qualité', code: 'QLT' }
];

// Services data by secteur
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

// Real users data with Moroccan names
const usersData = [
  // ADMIN
  {
    firstName: 'Youssef',
    lastName: 'Bennani',
    email: 'admin@ocp.ma',
    phone: '+212661234567',
    password: 'Admin123!',
    role: 'admin',
    siteCode: 'CAS'
  },
  
  // CHEFS DE SECTEUR - Casablanca
  {
    firstName: 'Ahmed',
    lastName: 'El Fassi',
    email: 'chef.cas-trt@ocp.ma',
    phone: '+212661234568',
    password: 'Chef123!',
    role: 'chef_secteur',
    siteCode: 'CAS',
    secteurName: 'Traitement'
  },
  {
    firstName: 'Fatima',
    lastName: 'Alaoui',
    email: 'chef.cas-ext@ocp.ma',
    phone: '+212661234569',
    password: 'Chef123!',
    role: 'chef_secteur',
    siteCode: 'CAS',
    secteurName: 'Extraction'
  },
  
  // CHEFS DE SECTEUR - Jorf Lasfar
  {
    firstName: 'Mohamed',
    lastName: 'Tazi',
    email: 'chef.jlf-trt@ocp.ma',
    phone: '+212661234570',
    password: 'Chef123!',
    role: 'chef_secteur',
    siteCode: 'JLF',
    secteurName: 'Traitement'
  },
  {
    firstName: 'Aicha',
    lastName: 'Benali',
    email: 'chef.jlf-mnt@ocp.ma',
    phone: '+212661234571',
    password: 'Chef123!',
    role: 'chef_secteur',
    siteCode: 'JLF',
    secteurName: 'Maintenance'
  },
  
  // INGÉNIEURS - Casablanca
  {
    firstName: 'Omar',
    lastName: 'Idrissi',
    email: 'ing.cas-trt@ocp.ma',
    phone: '+212661234572',
    password: 'Ing123!',
    role: 'ingenieur',
    siteCode: 'CAS',
    secteurName: 'Traitement'
  },
  {
    firstName: 'Leila',
    lastName: 'Mansouri',
    email: 'ing.cas-ext@ocp.ma',
    phone: '+212661234573',
    password: 'Ing123!',
    role: 'ingenieur',
    siteCode: 'CAS',
    secteurName: 'Extraction'
  },
  
  // INGÉNIEURS - Jorf Lasfar
  {
    firstName: 'Rachid',
    lastName: 'Amrani',
    email: 'ing.jlf-trt@ocp.ma',
    phone: '+212661234574',
    password: 'Ing123!',
    role: 'ingenieur',
    siteCode: 'JLF',
    secteurName: 'Traitement'
  },
  {
    firstName: 'Khadija',
    lastName: 'Berrada',
    email: 'ing.jlf-mnt@ocp.ma',
    phone: '+212661234575',
    password: 'Ing123!',
    role: 'ingenieur',
    siteCode: 'JLF',
    secteurName: 'Maintenance'
  },
  
  // CHEFS DE SERVICE - Casablanca
  {
    firstName: 'Hassan',
    lastName: 'Zouani',
    email: 'chef.cas-trt-prod-u1@ocp.ma',
    phone: '+212661234576',
    password: 'Chef123!',
    role: 'chef_service',
    siteCode: 'CAS',
    secteurName: 'Traitement',
    serviceName: 'Production U1'
  },
  {
    firstName: 'Samira',
    lastName: 'Kettani',
    email: 'chef.cas-ext-for@ocp.ma',
    phone: '+212661234577',
    password: 'Chef123!',
    role: 'chef_service',
    siteCode: 'CAS',
    secteurName: 'Extraction',
    serviceName: 'Forage'
  },
  
  // CHEFS DE SERVICE - Jorf Lasfar
  {
    firstName: 'Karim',
    lastName: 'Benjelloun',
    email: 'chef.jlf-trt-prod-u1@ocp.ma',
    phone: '+212661234578',
    password: 'Chef123!',
    role: 'chef_service',
    siteCode: 'JLF',
    secteurName: 'Traitement',
    serviceName: 'Production U1'
  },
  {
    firstName: 'Nadia',
    lastName: 'Chraibi',
    email: 'chef.jlf-mnt-elec@ocp.ma',
    phone: '+212661234579',
    password: 'Chef123!',
    role: 'chef_service',
    siteCode: 'JLF',
    secteurName: 'Maintenance',
    serviceName: 'Électricité'
  },
  
  // COLLABORATEURS - Casablanca
  {
    firstName: 'Laila',
    lastName: 'Mansouri',
    email: 'collab1.cas-trt-prod-u1@ocp.ma',
    phone: '+212661234580',
    password: 'Collab123!',
    role: 'collaborateur',
    siteCode: 'CAS',
    secteurName: 'Traitement',
    serviceName: 'Production U1'
  },
  {
    firstName: 'Samir',
    lastName: 'Kettani',
    email: 'collab2.cas-trt-prod-u1@ocp.ma',
    phone: '+212661234581',
    password: 'Collab123!',
    role: 'collaborateur',
    siteCode: 'CAS',
    secteurName: 'Traitement',
    serviceName: 'Production U1'
  },
  {
    firstName: 'Amina',
    lastName: 'El Fassi',
    email: 'collab1.cas-ext-for@ocp.ma',
    phone: '+212661234582',
    password: 'Collab123!',
    role: 'collaborateur',
    siteCode: 'CAS',
    secteurName: 'Extraction',
    serviceName: 'Forage'
  },
  
  // COLLABORATEURS - Jorf Lasfar
  {
    firstName: 'Tarik',
    lastName: 'Benali',
    email: 'collab1.jlf-trt-prod-u1@ocp.ma',
    phone: '+212661234583',
    password: 'Collab123!',
    role: 'collaborateur',
    siteCode: 'JLF',
    secteurName: 'Traitement',
    serviceName: 'Production U1'
  },
  {
    firstName: 'Malika',
    lastName: 'Zouani',
    email: 'collab1.jlf-mnt-elec@ocp.ma',
    phone: '+212661234584',
    password: 'Collab123!',
    role: 'collaborateur',
    siteCode: 'JLF',
    secteurName: 'Maintenance',
    serviceName: 'Électricité'
  }
];

// Create sites
const createSites = async () => {
  try {
    console.log('🏭 Creating OCP sites...');
    
    // Clear existing sites
    await Site.deleteMany({});
    console.log('🧹 Cleared existing sites');
    
    // Create new sites
    const sites = await Site.insertMany(sitesData);
    console.log(`✅ Created ${sites.length} OCP sites`);
    
    return sites;
  } catch (error) {
    console.error('❌ Error creating sites:', error);
    throw error;
  }
};

// Create secteurs
const createSecteurs = async (sites) => {
  try {
    console.log('🏢 Creating secteurs...');
    
    // Clear existing secteurs
    await Secteur.deleteMany({});
    console.log('🧹 Cleared existing secteurs');
    
    const secteurs = [];
    
    for (const site of sites) {
      for (const secteurData of secteursData) {
        const secteur = new Secteur({
          name: secteurData.name,
          code: `${site.code}-${secteurData.code}`,
          site: site._id,
          description: `Secteur ${secteurData.name} du site ${site.name}`
        });
        
        await secteur.save();
        secteurs.push(secteur);
        console.log(`✅ Created secteur: ${secteur.name} (${secteur.code}) for ${site.name}`);
      }
    }
    
    console.log(`✅ Created ${secteurs.length} secteurs total`);
    return secteurs;
  } catch (error) {
    console.error('❌ Error creating secteurs:', error);
    throw error;
  }
};

// Create services
const createServices = async (secteurs) => {
  try {
    console.log('⚙️ Creating services...');
    
    // Clear existing services
    await Service.deleteMany({});
    console.log('🧹 Cleared existing services');
    
    const services = [];
    
    for (const secteur of secteurs) {
      const secteurName = secteur.name;
      const servicesForSecteur = servicesData[secteurName] || [];
      
      for (const serviceData of servicesForSecteur) {
        const service = new Service({
          name: serviceData.name,
          code: `${secteur.code}-${serviceData.code}`,
          secteur: secteur._id,
          description: `Service ${serviceData.name} du secteur ${secteurName}`,
          minPersonnel: serviceData.minPersonnel
        });
        
        await service.save();
        services.push(service);
        console.log(`✅ Created service: ${service.name} (${service.code})`);
      }
    }
    
    console.log(`✅ Created ${services.length} services total`);
    return services;
  } catch (error) {
    console.error('❌ Error creating services:', error);
    throw error;
  }
};

// Create users
const createUsers = async (sites, secteurs, services) => {
  try {
    console.log('👥 Creating users...');
    
    // Clear existing users
    await User.deleteMany({});
    console.log('🧹 Cleared existing users');
    
    const createdUsers = [];
    
    for (const userData of usersData) {
      // Find the site
      const site = sites.find(s => s.code === userData.siteCode);
      if (!site) {
        console.error(`❌ Site not found for code: ${userData.siteCode}`);
        continue;
      }
      
      // Find the secteur if specified
      let secteur = null;
      if (userData.secteurName) {
        secteur = secteurs.find(s => 
          s.site.toString() === site._id.toString() && 
          s.name === userData.secteurName
        );
      }
      
      // Find the service if specified
      let service = null;
      if (userData.serviceName && secteur) {
        service = services.find(s => 
          s.secteur.toString() === secteur._id.toString() && 
          s.name === userData.serviceName
        );
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Create user
      const user = new User({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        password: hashedPassword,
        role: userData.role,
        site: site._id,
        secteur: secteur?._id,
        service: service?._id,
        address: `${site.name}, Maroc`,
        isActive: true
      });
      
      await user.save();
      createdUsers.push({
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        role: userData.role,
        site: site.name,
        secteur: secteur?.name,
        service: service?.name,
        password: userData.password
      });
      
      console.log(`✅ Created ${userData.role}: ${userData.firstName} ${userData.lastName} (${userData.email})`);
    }
    
    console.log(`✅ Created ${createdUsers.length} users total`);
    return createdUsers;
  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  }
};

// Create test indisponibilities
const createIndisponibilities = async (users) => {
  try {
    console.log('🚫 Creating test indisponibilities...');
    
    // Clear existing indisponibilities
    await Indisponibilite.deleteMany({});
    console.log('🧹 Cleared existing indisponibilities');
    
    const indisponibilities = [];
    const today = new Date();
    
    // Create some test indisponibilities
    const testUsers = users.filter(u => ['collaborateur', 'ingenieur'].includes(u.role));
    
    for (let i = 0; i < Math.min(5, testUsers.length); i++) {
      const user = testUsers[i];
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1);
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 3) + 1);
      
      const indisponibilite = new Indisponibilite({
        utilisateur: user._id,
        motif: ['conge_annuel', 'conge_maladie', 'formation', 'mission'][Math.floor(Math.random() * 4)],
        dateDebut: startDate,
        dateFin: endDate,
        description: `Test indisponibilité pour ${user.firstName} ${user.lastName}`,
        statut: ['en_attente', 'approuve', 'refuse'][Math.floor(Math.random() * 3)],
        priorite: ['normale', 'urgente'][Math.floor(Math.random() * 2)]
      });
      
      await indisponibilite.save();
      indisponibilities.push(indisponibilite);
      console.log(`✅ Created indisponibilité for ${user.firstName} ${user.lastName}`);
    }
    
    console.log(`✅ Created ${indisponibilities.length} indisponibilities total`);
    return indisponibilities;
  } catch (error) {
    console.error('❌ Error creating indisponibilities:', error);
    // Don't throw error, just log it and continue
    console.log('⚠️ Skipping indisponibilities creation due to error');
    return [];
  }
};

// Create test plannings
const createPlannings = async (sites, secteurs, services, users) => {
  try {
    console.log('📅 Creating test plannings...');
    
    // Clear existing plannings
    await Planning.deleteMany({});
    console.log('🧹 Cleared existing plannings');
    
    const plannings = [];
    const today = new Date();
    
    // Create plannings for the next 4 weeks
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + (week * 7));
      
      // Create service plannings
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
              fin: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
            },
            site: service.secteur.site,
            secteur: service.secteur,
            service: service._id,
            gardes: [],
            statut: 'brouillon',
            createdBy: users.find(u => u.role === 'chef_service' && u.service === service._id)?._id
          });
          
          await planning.save();
          plannings.push(planning);
        }
      }
      
      // Create secteur plannings for engineers
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
              fin: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
            },
            site: secteur.site,
            secteur: secteur._id,
            gardes: [],
            statut: 'brouillon',
            createdBy: users.find(u => u.role === 'chef_secteur' && u.secteur === secteur._id)?._id
          });
          
          await planning.save();
          plannings.push(planning);
        }
      }
    }
    
    console.log(`✅ Created ${plannings.length} plannings total`);
    return plannings;
  } catch (error) {
    console.error('❌ Error creating plannings:', error);
    // Don't throw error, just log it and continue
    console.log('⚠️ Skipping plannings creation due to error');
    return [];
  }
};

// Main function
const createFakeDatabase = async () => {
  try {
    console.log('🚀 Starting comprehensive fake database creation...');
    
    await connectDB();
    
    console.log('\n📊 Step 1: Creating sites...');
    const sites = await createSites();
    
    console.log('\n📊 Step 2: Creating secteurs...');
    const secteurs = await createSecteurs(sites);
    
    console.log('\n📊 Step 3: Creating services...');
    const services = await createServices(secteurs);
    
    console.log('\n📊 Step 4: Creating users...');
    const users = await createUsers(sites, secteurs, services);
    
    console.log('\n📊 Step 5: Creating indisponibilities...');
    await createIndisponibilities(users);
    
    console.log('\n📊 Step 6: Creating plannings...');
    await createPlannings(sites, secteurs, services, users);
    
    console.log('\n🎉 Fake database creation completed successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('='.repeat(60));
    
    users.forEach(user => {
      console.log(`👤 ${user.role.toUpperCase()}: ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Password: ${user.password}`);
      console.log(`   🏭 Site: ${user.site}`);
      if (user.secteur) console.log(`   🏢 Secteur: ${user.secteur}`);
      if (user.service) console.log(`   ⚙️ Service: ${user.service}`);
      console.log('');
    });
    
    console.log('✅ All data has been created in your MongoDB Atlas database!');
    console.log('🧪 You can now test the application with these accounts.');
    
  } catch (error) {
    console.error('❌ Failed to create fake database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the creation
createFakeDatabase(); 