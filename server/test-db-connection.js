import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Site from './models/Site.js';
import Secteur from './models/Secteur.js';
import Service from './models/Service.js';
import Planning from './models/Planning.js';
import Indisponibilite from './models/Indisponibilite.js';

// Configuration des variables d'environnement
dotenv.config({ path: './config.env' });

const testDatabase = async () => {
  try {
    console.log('🔍 Testing database connection...');
    
    // Connexion à MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.ATLAS_URI || 'mongodb://localhost:27017/gestion_astreinte';
    await mongoose.connect(mongoUri);
    console.log('✅ Database connected successfully');
    
    // Test des collections
    console.log('\n📊 Checking collections...');
    
    const sitesCount = await Site.countDocuments();
    console.log(`📍 Sites: ${sitesCount}`);
    
    const secteursCount = await Secteur.countDocuments();
    console.log(`🏢 Secteurs: ${secteursCount}`);
    
    const servicesCount = await Service.countDocuments();
    console.log(`⚙️ Services: ${servicesCount}`);
    
    const usersCount = await User.countDocuments();
    console.log(`👥 Users: ${usersCount}`);
    
    const planningsCount = await Planning.countDocuments();
    console.log(`📅 Plannings: ${planningsCount}`);
    
    const indisponibilitesCount = await Indisponibilite.countDocuments();
    console.log(`🚫 Indisponibilités: ${indisponibilitesCount}`);
    
    // Test des utilisateurs par rôle
    console.log('\n👤 Users by role:');
    const roles = ['admin', 'chef_secteur', 'chef_service', 'ingenieur', 'collaborateur'];
    for (const role of roles) {
      const count = await User.countDocuments({ role });
      console.log(`  ${role}: ${count}`);
    }
    
    // Test des sites
    console.log('\n📍 Sites:');
    const sites = await Site.find().select('name code').limit(5);
    sites.forEach(site => {
      console.log(`  ${site.name} (${site.code})`);
    });
    
    // Test des utilisateurs de test
    console.log('\n🔑 Test accounts:');
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      console.log(`  Admin: ${admin.email}`);
    }
    
    const chefSecteur = await User.findOne({ role: 'chef_secteur' });
    if (chefSecteur) {
      console.log(`  Chef Secteur: ${chefSecteur.email}`);
    }
    
    const chefService = await User.findOne({ role: 'chef_service' });
    if (chefService) {
      console.log(`  Chef Service: ${chefService.email}`);
    }
    
    console.log('\n✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

testDatabase(); 