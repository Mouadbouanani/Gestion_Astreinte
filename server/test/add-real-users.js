import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

console.log('🗄️ Adding REAL users to MongoDB...');

// Simple schemas
const siteSchema = new mongoose.Schema({
  name: String,
  code: String,
  address: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  password: String,
  role: String,
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Site = mongoose.model('Site', siteSchema);
const User = mongoose.model('User', userSchema);

const main = async () => {
  try {
    // Connect
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gestion_astreinte');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Site.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create sites
    const sites = await Site.insertMany([
      { name: 'Casablanca', code: 'CAS', address: 'Zone Industrielle Ain Sebaa, Casablanca' },
      { name: 'Jorf Lasfar', code: 'JLF', address: 'Complexe Chimique Jorf Lasfar, El Jadida' },
      { name: 'Khouribga', code: 'KHO', address: 'Site Minier de Khouribga' },
      { name: 'Safi', code: 'SAF', address: 'Complexe Chimique de Safi' }
    ]);
    console.log(`🏭 Created ${sites.length} sites`);

    // Create users
    const casablanca = sites.find(s => s.code === 'CAS');
    const jorflasfar = sites.find(s => s.code === 'JLF');
    const khouribga = sites.find(s => s.code === 'KHO');
    const safi = sites.find(s => s.code === 'SAF');

    const usersData = [
      // Admin
      { firstName: 'Youssef', lastName: 'Bennani', email: 'y.bennani@ocp.ma', phone: '+212661234567', password: 'Admin2024!', role: 'admin', site: casablanca._id },
      
      // Chefs de secteur
      { firstName: 'Ahmed', lastName: 'El Fassi', email: 'a.elfassi@ocp.ma', phone: '+212661234568', password: 'Chef2024!', role: 'chef_secteur', site: casablanca._id },
      { firstName: 'Fatima', lastName: 'Alaoui', email: 'f.alaoui@ocp.ma', phone: '+212661234569', password: 'Chef2024!', role: 'chef_secteur', site: jorflasfar._id },
      
      // Ingénieurs
      { firstName: 'Mohamed', lastName: 'Tazi', email: 'm.tazi@ocp.ma', phone: '+212661234570', password: 'Ing2024!', role: 'ingenieur', site: casablanca._id },
      { firstName: 'Aicha', lastName: 'Benali', email: 'a.benali@ocp.ma', phone: '+212661234571', password: 'Ing2024!', role: 'ingenieur', site: jorflasfar._id },
      { firstName: 'Omar', lastName: 'Idrissi', email: 'o.idrissi@ocp.ma', phone: '+212661234572', password: 'Ing2024!', role: 'ingenieur', site: khouribga._id },
      
      // Chefs de service
      { firstName: 'Rachid', lastName: 'Amrani', email: 'r.amrani@ocp.ma', phone: '+212661234573', password: 'Service2024!', role: 'chef_service', site: casablanca._id },
      { firstName: 'Khadija', lastName: 'Berrada', email: 'k.berrada@ocp.ma', phone: '+212661234574', password: 'Service2024!', role: 'chef_service', site: jorflasfar._id },
      { firstName: 'Hassan', lastName: 'Zouani', email: 'h.zouani@ocp.ma', phone: '+212661234575', password: 'Service2024!', role: 'chef_service', site: safi._id },
      
      // Collaborateurs
      { firstName: 'Laila', lastName: 'Mansouri', email: 'l.mansouri@ocp.ma', phone: '+212661234576', password: 'Collab2024!', role: 'collaborateur', site: casablanca._id },
      { firstName: 'Karim', lastName: 'Benjelloun', email: 'k.benjelloun@ocp.ma', phone: '+212661234577', password: 'Collab2024!', role: 'collaborateur', site: jorflasfar._id },
      { firstName: 'Nadia', lastName: 'Chraibi', email: 'n.chraibi@ocp.ma', phone: '+212661234578', password: 'Collab2024!', role: 'collaborateur', site: khouribga._id },
      { firstName: 'Samir', lastName: 'Kettani', email: 's.kettani@ocp.ma', phone: '+212661234579', password: 'Collab2024!', role: 'collaborateur', site: safi._id }
    ];

    console.log('👥 Creating users...');
    for (const userData of usersData) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = new User({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        password: hashedPassword,
        role: userData.role,
        site: userData.site,
        isActive: true
      });
      
      await user.save();
      console.log(`✅ Created ${userData.role}: ${userData.firstName} ${userData.lastName} (${userData.email})`);
    }

    console.log('\n🎉 SUCCESS! Real users added to database!');
    console.log('\n🔑 Test Credentials:');
    console.log('👤 ADMIN: y.bennani@ocp.ma / Admin2024!');
    console.log('👤 CHEF SECTEUR: a.elfassi@ocp.ma / Chef2024!');
    console.log('👤 INGÉNIEUR: m.tazi@ocp.ma / Ing2024!');
    console.log('👤 CHEF SERVICE: r.amrani@ocp.ma / Service2024!');
    console.log('👤 COLLABORATEUR: l.mansouri@ocp.ma / Collab2024!');
    
    console.log('\n📊 Summary:');
    console.log(`🏭 Sites: ${await Site.countDocuments()}`);
    console.log(`👥 Users: ${await User.countDocuments()}`);
    console.log(`🔐 Admin: ${await User.countDocuments({role: 'admin'})}`);
    console.log(`👔 Chef Secteur: ${await User.countDocuments({role: 'chef_secteur'})}`);
    console.log(`🔧 Ingénieur: ${await User.countDocuments({role: 'ingenieur'})}`);
    console.log(`📋 Chef Service: ${await User.countDocuments({role: 'chef_service'})}`);
    console.log(`👷 Collaborateur: ${await User.countDocuments({role: 'collaborateur'})}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

main();
