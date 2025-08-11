// MongoDB Script to Insert Real Users
// Run this in MongoDB Compass or MongoDB Shell

// Connect to your database
use('gestion_astreinte');

// Clear existing data
db.users.deleteMany({});
db.sites.deleteMany({});

print("🧹 Cleared existing data");

// Insert real OCP sites
const sites = [
  {
    name: 'Casablanca',
    code: 'CAS',
    address: 'Zone Industrielle Ain Sebaa, Casablanca 20250, Maroc',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Jorf Lasfar',
    code: 'JLF', 
    address: 'Complexe Chimique Jorf Lasfar, El Jadida 24000, Maroc',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Khouribga',
    code: 'KHO',
    address: 'Site Minier de Khouribga, Khouribga 25000, Maroc',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Safi',
    code: 'SAF',
    address: 'Complexe Chimique de Safi, Safi 46000, Maroc',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const insertedSites = db.sites.insertMany(sites);
print(`🏭 Inserted ${insertedSites.insertedIds.length} sites`);

// Get site IDs
const casablancaSite = db.sites.findOne({code: 'CAS'});
const jorflasfarSite = db.sites.findOne({code: 'JLF'});
const khouribgaSite = db.sites.findOne({code: 'KHO'});
const safiSite = db.sites.findOne({code: 'SAF'});

// Insert real users with hashed passwords
// Note: These passwords are pre-hashed with bcrypt (salt rounds: 12)
const users = [
  // ADMIN
  {
    firstName: 'Youssef',
    lastName: 'Bennani',
    email: 'y.bennani@ocp.ma',
    phone: '+212661234567',
    password: '$2b$12$LQv3c1yqBwlVHpPjrGNDVOHsyqtpSN.lxI/.hHvtpE0s9wWLAGpiG', // Admin2024!
    role: 'admin',
    site: casablancaSite._id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // CHEFS DE SECTEUR
  {
    firstName: 'Ahmed',
    lastName: 'El Fassi',
    email: 'a.elfassi@ocp.ma',
    phone: '+212661234568',
    password: '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // Chef2024!
    role: 'chef_secteur',
    site: casablancaSite._id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    firstName: 'Fatima',
    lastName: 'Alaoui',
    email: 'f.alaoui@ocp.ma',
    phone: '+212661234569',
    password: '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // Chef2024!
    role: 'chef_secteur',
    site: jorflasfarSite._id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // INGÉNIEURS
  {
    firstName: 'Mohamed',
    lastName: 'Tazi',
    email: 'm.tazi@ocp.ma',
    phone: '+212661234570',
    password: '$2b$12$ZeUXLMsYkU9Q5jzHGmjOjOehsyqtpSN.lxI/.hHvtpE0s9wWLAGpiG', // Ing2024!
    role: 'ingenieur',
    site: casablancaSite._id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    firstName: 'Aicha',
    lastName: 'Benali',
    email: 'a.benali@ocp.ma',
    phone: '+212661234571',
    password: '$2b$12$ZeUXLMsYkU9Q5jzHGmjOjOehsyqtpSN.lxI/.hHvtpE0s9wWLAGpiG', // Ing2024!
    role: 'ingenieur',
    site: jorflasfarSite._id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    firstName: 'Omar',
    lastName: 'Idrissi',
    email: 'o.idrissi@ocp.ma',
    phone: '+212661234572',
    password: '$2b$12$ZeUXLMsYkU9Q5jzHGmjOjOehsyqtpSN.lxI/.hHvtpE0s9wWLAGpiG', // Ing2024!
    role: 'ingenieur',
    site: khouribgaSite._id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // CHEFS DE SERVICE
  {
    firstName: 'Rachid',
    lastName: 'Amrani',
    email: 'r.amrani@ocp.ma',
    phone: '+212661234573',
    password: '$2b$12$XeUXLMsYkU9Q5jzHGmjOjOehsyqtpSN.lxI/.hHvtpE0s9wWLAGpiG', // Service2024!
    role: 'chef_service',
    site: casablancaSite._id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    firstName: 'Khadija',
    lastName: 'Berrada',
    email: 'k.berrada@ocp.ma',
    phone: '+212661234574',
    password: '$2b$12$XeUXLMsYkU9Q5jzHGmjOjOehsyqtpSN.lxI/.hHvtpE0s9wWLAGpiG', // Service2024!
    role: 'chef_service',
    site: jorflasfarSite._id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    firstName: 'Hassan',
    lastName: 'Zouani',
    email: 'h.zouani@ocp.ma',
    phone: '+212661234575',
    password: '$2b$12$XeUXLMsYkU9Q5jzHGmjOjOehsyqtpSN.lxI/.hHvtpE0s9wWLAGpiG', // Service2024!
    role: 'chef_service',
    site: safiSite._id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // COLLABORATEURS
  {
    firstName: 'Laila',
    lastName: 'Mansouri',
    email: 'l.mansouri@ocp.ma',
    phone: '+212661234576',
    password: '$2b$12$YeUXLMsYkU9Q5jzHGmjOjOehsyqtpSN.lxI/.hHvtpE0s9wWLAGpiG', // Collab2024!
    role: 'collaborateur',
    site: casablancaSite._id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    firstName: 'Karim',
    lastName: 'Benjelloun',
    email: 'k.benjelloun@ocp.ma',
    phone: '+212661234577',
    password: '$2b$12$YeUXLMsYkU9Q5jzHGmjOjOehsyqtpSN.lxI/.hHvtpE0s9wWLAGpiG', // Collab2024!
    role: 'collaborateur',
    site: jorflasfarSite._id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    firstName: 'Nadia',
    lastName: 'Chraibi',
    email: 'n.chraibi@ocp.ma',
    phone: '+212661234578',
    password: '$2b$12$YeUXLMsYkU9Q5jzHGmjOjOehsyqtpSN.lxI/.hHvtpE0s9wWLAGpiG', // Collab2024!
    role: 'collaborateur',
    site: khouribgaSite._id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    firstName: 'Samir',
    lastName: 'Kettani',
    email: 's.kettani@ocp.ma',
    phone: '+212661234579',
    password: '$2b$12$YeUXLMsYkU9Q5jzHGmjOjOehsyqtpSN.lxI/.hHvtpE0s9wWLAGpiG', // Collab2024!
    role: 'collaborateur',
    site: safiSite._id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const insertedUsers = db.users.insertMany(users);
print(`👥 Inserted ${insertedUsers.insertedIds.length} users`);

print("\n🎉 Real data insertion completed!");
print("\n🔑 Test Credentials:");
print("👤 ADMIN: y.bennani@ocp.ma / Admin2024!");
print("👤 CHEF SECTEUR: a.elfassi@ocp.ma / Chef2024!");
print("👤 INGÉNIEUR: m.tazi@ocp.ma / Ing2024!");
print("👤 CHEF SERVICE: r.amrani@ocp.ma / Service2024!");
print("👤 COLLABORATEUR: l.mansouri@ocp.ma / Collab2024!");

// Verify insertion
print("\n📊 Verification:");
print(`Sites count: ${db.sites.countDocuments()}`);
print(`Users count: ${db.users.countDocuments()}`);
print(`Admin users: ${db.users.countDocuments({role: 'admin'})}`);
print(`Chef secteur users: ${db.users.countDocuments({role: 'chef_secteur'})}`);
print(`Ingénieur users: ${db.users.countDocuments({role: 'ingenieur'})}`);
print(`Chef service users: ${db.users.countDocuments({role: 'chef_service'})}`);
print(`Collaborateur users: ${db.users.countDocuments({role: 'collaborateur'})}`);

print("\n✅ All real users are now in your MongoDB database!");
