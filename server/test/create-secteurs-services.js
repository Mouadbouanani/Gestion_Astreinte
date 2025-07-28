import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

// Import models
const siteSchema = new mongoose.Schema({
  name: String,
  code: String,
  address: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const secteurSchema = new mongoose.Schema({
  name: String,
  code: String,
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const serviceSchema = new mongoose.Schema({
  name: String,
  code: String,
  secteur: { type: mongoose.Schema.Types.ObjectId, ref: 'Secteur' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  password: String,
  address: String,
  role: String,
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  secteur: { type: mongoose.Schema.Types.ObjectId, ref: 'Secteur' },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Site = mongoose.model('Site', siteSchema);
const Secteur = mongoose.model('Secteur', secteurSchema);
const Service = mongoose.model('Service', serviceSchema);
const User = mongoose.model('User', userSchema);

const createSecteursAndServices = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gestion_astreinte');
    console.log('✅ Connected to MongoDB');

    // Get sites
    const sites = await Site.find();
    console.log(`📍 Found ${sites.length} sites`);

    // Clear existing secteurs and services
    await Service.deleteMany({});
    await Secteur.deleteMany({});
    console.log('🧹 Cleared existing secteurs and services');

    // Create secteurs for each site
    const secteursData = [
      { name: 'Production', code: 'PROD' },
      { name: 'Maintenance', code: 'MAINT' },
      { name: 'Qualité', code: 'QUAL' },
      { name: 'Logistique', code: 'LOG' }
    ];

    const createdSecteurs = [];

    for (const site of sites) {
      console.log(`\n🏭 Creating secteurs for ${site.name}:`);
      
      for (const secteurData of secteursData) {
        const secteur = new Secteur({
          name: secteurData.name,
          code: `${site.code}_${secteurData.code}`,
          site: site._id,
          isActive: true
        });
        
        await secteur.save();
        createdSecteurs.push(secteur);
        console.log(`  ✅ Created secteur: ${secteur.name} (${secteur.code})`);
      }
    }

    console.log(`\n📊 Total secteurs created: ${createdSecteurs.length}`);

    // Create services for each secteur
    const servicesData = [
      { name: 'Équipe A', code: 'EQA' },
      { name: 'Équipe B', code: 'EQB' },
      { name: 'Support', code: 'SUP' }
    ];

    const createdServices = [];

    for (const secteur of createdSecteurs) {
      console.log(`\n🔧 Creating services for secteur ${secteur.name}:`);
      
      for (const serviceData of servicesData) {
        const service = new Service({
          name: serviceData.name,
          code: `${secteur.code}_${serviceData.code}`,
          secteur: secteur._id,
          isActive: true
        });
        
        await service.save();
        createdServices.push(service);
        console.log(`  ✅ Created service: ${service.name} (${service.code})`);
      }
    }

    console.log(`\n📊 Total services created: ${createdServices.length}`);

    // Now assign secteurs and services to users
    console.log('\n👥 Assigning secteurs and services to users...');

    // Get users
    const users = await User.find();

    for (const user of users) {
      const userSite = await Site.findById(user.site);
      if (!userSite) continue;

      // Find a secteur for this user's site
      const secteur = createdSecteurs.find(s => s.site.toString() === userSite._id.toString());
      
      if (secteur && user.role !== 'admin') {
        user.secteur = secteur._id;
        
        // If user needs a service (chef_service or collaborateur)
        if (['chef_service', 'collaborateur'].includes(user.role)) {
          const service = createdServices.find(s => s.secteur.toString() === secteur._id.toString());
          if (service) {
            user.service = service._id;
          }
        }
        
        await user.save();
        console.log(`✅ Updated ${user.firstName} ${user.lastName} (${user.role})`);
        console.log(`   🏭 Site: ${userSite.name}`);
        console.log(`   🔧 Secteur: ${secteur.name}`);
        if (user.service) {
          const userService = createdServices.find(s => s._id.toString() === user.service.toString());
          console.log(`   👥 Service: ${userService?.name}`);
        }
        console.log('');
      }
    }

    console.log('🎉 Successfully created secteurs and services and assigned to users!');

    // Verification
    console.log('\n📊 Final verification:');
    const updatedUsers = await User.find().populate('site secteur service');
    
    updatedUsers.forEach(user => {
      console.log(`👤 ${user.firstName} ${user.lastName} (${user.role})`);
      console.log(`   🏭 Site: ${user.site?.name}`);
      console.log(`   🔧 Secteur: ${user.secteur?.name || 'None'}`);
      console.log(`   👥 Service: ${user.service?.name || 'None'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

createSecteursAndServices();
