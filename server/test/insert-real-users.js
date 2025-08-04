import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

console.log('🗄️ Inserting REAL users into MongoDB database...');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gestion_astreinte';
    console.log('🔗 Connecting to MongoDB:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully!');
    
    return mongoose.connection;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

// Define schemas (same as in your models)
const siteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['admin', 'chef_secteur', 'ingenieur', 'chef_service', 'collaborateur']
  },
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date
}, { timestamps: true });

const Site = mongoose.model('Site', siteSchema);
const User = mongoose.model('User', userSchema);

// Real OCP sites data
const realSites = [
  {
    name: 'Casablanca',
    code: 'CAS',
    address: 'Zone Industrielle Ain Sebaa, Casablanca 20250, Maroc'
  },
  {
    name: 'Jorf Lasfar',
    code: 'JLF', 
    address: 'Complexe Chimique Jorf Lasfar, El Jadida 24000, Maroc'
  },
  {
    name: 'Khouribga',
    code: 'KHO',
    address: 'Site Minier de Khouribga, Khouribga 25000, Maroc'
  },
  {
    name: 'Safi',
    code: 'SAF',
    address: 'Complexe Chimique de Safi, Safi 46000, Maroc'
  }
];

// Real users data with different roles
const realUsers = [
  // ADMIN
  {
    firstName: 'Youssef',
    lastName: 'Bennani',
    email: 'y.bennani@ocp.ma',
    phone: '+212661234567',
    password: 'Admin2024!',
    role: 'admin',
    siteCode: 'CAS'
  },
  
  // CHEFS DE SECTEUR
  {
    firstName: 'Ahmed',
    lastName: 'El Fassi',
    email: 'a.elfassi@ocp.ma',
    phone: '+212661234568',
    password: 'Chef2024!',
    role: 'chef_secteur',
    siteCode: 'CAS'
  },
  {
    firstName: 'Fatima',
    lastName: 'Alaoui',
    email: 'f.alaoui@ocp.ma',
    phone: '+212661234569',
    password: 'Chef2024!',
    role: 'chef_secteur',
    siteCode: 'JLF'
  },
  
  // INGÉNIEURS
  {
    firstName: 'Mohamed',
    lastName: 'Tazi',
    email: 'm.tazi@ocp.ma',
    phone: '+212661234570',
    password: 'Ing2024!',
    role: 'ingenieur',
    siteCode: 'CAS'
  },
  {
    firstName: 'Aicha',
    lastName: 'Benali',
    email: 'a.benali@ocp.ma',
    phone: '+212661234571',
    password: 'Ing2024!',
    role: 'ingenieur',
    siteCode: 'JLF'
  },
  {
    firstName: 'Omar',
    lastName: 'Idrissi',
    email: 'o.idrissi@ocp.ma',
    phone: '+212661234572',
    password: 'Ing2024!',
    role: 'ingenieur',
    siteCode: 'KHO'
  },
  
  // CHEFS DE SERVICE
  {
    firstName: 'Rachid',
    lastName: 'Amrani',
    email: 'r.amrani@ocp.ma',
    phone: '+212661234573',
    password: 'Service2024!',
    role: 'chef_service',
    siteCode: 'CAS'
  },
  {
    firstName: 'Khadija',
    lastName: 'Berrada',
    email: 'k.berrada@ocp.ma',
    phone: '+212661234574',
    password: 'Service2024!',
    role: 'chef_service',
    siteCode: 'JLF'
  },
  {
    firstName: 'Hassan',
    lastName: 'Zouani',
    email: 'h.zouani@ocp.ma',
    phone: '+212661234575',
    password: 'Service2024!',
    role: 'chef_service',
    siteCode: 'SAF'
  },
  
  // COLLABORATEURS
  {
    firstName: 'Laila',
    lastName: 'Mansouri',
    email: 'l.mansouri@ocp.ma',
    phone: '+212661234576',
    password: 'Collab2024!',
    role: 'collaborateur',
    siteCode: 'CAS'
  },
  {
    firstName: 'Karim',
    lastName: 'Benjelloun',
    email: 'k.benjelloun@ocp.ma',
    phone: '+212661234577',
    password: 'Collab2024!',
    role: 'collaborateur',
    siteCode: 'JLF'
  },
  {
    firstName: 'Nadia',
    lastName: 'Chraibi',
    email: 'n.chraibi@ocp.ma',
    phone: '+212661234578',
    password: 'Collab2024!',
    role: 'collaborateur',
    siteCode: 'KHO'
  },
  {
    firstName: 'Samir',
    lastName: 'Kettani',
    email: 's.kettani@ocp.ma',
    phone: '+212661234579',
    password: 'Collab2024!',
    role: 'collaborateur',
    siteCode: 'SAF'
  }
];

// Insert sites into database
const insertSites = async () => {
  try {
    console.log('🏭 Inserting real OCP sites...');
    
    // Clear existing sites
    await Site.deleteMany({});
    console.log('🧹 Cleared existing sites');
    
    // Insert new sites
    const insertedSites = await Site.insertMany(realSites);
    console.log(`✅ Inserted ${insertedSites.length} real OCP sites`);
    
    return insertedSites;
  } catch (error) {
    console.error('❌ Error inserting sites:', error);
    throw error;
  }
};

// Insert users into database
const insertUsers = async (sites) => {
  try {
    console.log('👥 Inserting real OCP users...');
    
    // Clear existing users
    await User.deleteMany({});
    console.log('🧹 Cleared existing users');
    
    const insertedUsers = [];
    
    for (const userData of realUsers) {
      // Find the site for this user
      const site = sites.find(s => s.code === userData.siteCode);
      if (!site) {
        console.error(`❌ Site not found for code: ${userData.siteCode}`);
        continue;
      }
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Create user object
      const user = new User({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        password: hashedPassword,
        role: userData.role,
        site: site._id,
        isActive: true
      });
      
      // Save user to database
      await user.save();
      
      insertedUsers.push({
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        role: userData.role,
        site: site.name,
        password: userData.password // Original password for testing
      });
      
      console.log(`✅ Inserted ${userData.role}: ${userData.firstName} ${userData.lastName} (${userData.email})`);
    }
    
    return insertedUsers;
  } catch (error) {
    console.error('❌ Error inserting users:', error);
    throw error;
  }
};

// Main function
const insertRealData = async () => {
  try {
    console.log('🚀 Starting real data insertion...');
    
    await connectDB();
    
    const sites = await insertSites();
    const users = await insertUsers(sites);
    
    console.log('\n🎉 Real data insertion completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`🏭 Sites inserted: ${sites.length}`);
    console.log(`👥 Users inserted: ${users.length}`);
    
    console.log('\n🔑 Test Credentials (Real Users):');
    console.log('='.repeat(60));
    
    users.forEach(user => {
      console.log(`👤 ${user.role.toUpperCase()}: ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Password: ${user.password}`);
      console.log(`   🏭 Site: ${user.site}`);
      console.log('');
    });
    
    console.log('✅ All users are now in your MongoDB database!');
    console.log('🧪 You can now test login with any of these real accounts.');
    
  } catch (error) {
    console.error('❌ Failed to insert real data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the insertion
insertRealData();
