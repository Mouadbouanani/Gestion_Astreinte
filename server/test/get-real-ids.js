import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

// Import models
import Site from './models/Site.js';
import Secteur from './models/Secteur.js';
import Service from './models/Service.js';

const getRealIds = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gestion_astreinte');
    console.log('✅ Connected to MongoDB');

    console.log('\n🏭 SITES OCP AVEC IDS RÉELS:');
    console.log('=' .repeat(60));
    
    const sites = await Site.find().sort({ name: 1 });
    
    for (const site of sites) {
      console.log(`\n📍 ${site.name} (${site.code})`);
      console.log(`   ID: ${site._id}`);
      console.log(`   URL: http://localhost:5050/api/org/sites/${site._id}`);
      
      // Secteurs pour ce site
      const secteurs = await Secteur.find({ site: site._id }).sort({ name: 1 });
      
      if (secteurs.length > 0) {
        console.log(`\n   🔧 SECTEURS:`);
        for (const secteur of secteurs) {
          console.log(`      • ${secteur.name} (${secteur.code})`);
          console.log(`        ID: ${secteur._id}`);
          console.log(`        URL: http://localhost:5050/api/org/secteurs/${secteur._id}`);
          
          // Services pour ce secteur
          const services = await Service.find({ secteur: secteur._id }).sort({ name: 1 });
          
          if (services.length > 0) {
            console.log(`        👥 SERVICES:`);
            for (const service of services) {
              console.log(`           - ${service.name} (${service.code})`);
              console.log(`             ID: ${service._id}`);
              console.log(`             URL: http://localhost:5050/api/org/services/${service._id}`);
            }
          }
        }
      }
    }

    console.log('\n\n🧪 EXEMPLES CURL AVEC VRAIS IDS:');
    console.log('=' .repeat(60));
    
    if (sites.length > 0) {
      const firstSite = sites[0];
      const firstSecteur = await Secteur.findOne({ site: firstSite._id });
      const firstService = await Service.findOne({ secteur: firstSecteur?._id });

      console.log('\n📋 TESTS SITES:');
      console.log(`# Voir site ${firstSite.name}`);
      console.log(`curl -X GET "http://localhost:5050/api/org/sites/${firstSite._id}"`);
      
      console.log(`\n# Mettre à jour site ${firstSite.name}`);
      console.log(`curl -X PUT "http://localhost:5050/api/org/sites/${firstSite._id}" \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{"name": "${firstSite.name} Updated", "address": "Nouvelle adresse"}'`);

      if (firstSecteur) {
        console.log('\n📋 TESTS SECTEURS:');
        console.log(`# Voir secteurs de ${firstSite.name}`);
        console.log(`curl -X GET "http://localhost:5050/api/org/sites/${firstSite._id}/secteurs"`);
        
        console.log(`\n# Voir secteur ${firstSecteur.name}`);
        console.log(`curl -X GET "http://localhost:5050/api/org/secteurs/${firstSecteur._id}"`);
        
        console.log(`\n# Créer nouveau secteur pour ${firstSite.name}`);
        console.log(`curl -X POST "http://localhost:5050/api/org/sites/${firstSite._id}/secteurs" \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  -d '{"name": "Maintenance"}'`);

        if (firstService) {
          console.log('\n📋 TESTS SERVICES:');
          console.log(`# Voir services du secteur ${firstSecteur.name}`);
          console.log(`curl -X GET "http://localhost:5050/api/org/secteurs/${firstSecteur._id}/services"`);
          
          console.log(`\n# Voir service ${firstService.name}`);
          console.log(`curl -X GET "http://localhost:5050/api/org/services/${firstService._id}"`);
          
          console.log(`\n# Créer nouveau service pour secteur ${firstSecteur.name}`);
          console.log(`curl -X POST "http://localhost:5050/api/org/secteurs/${firstSecteur._id}/services" \\`);
          console.log(`  -H "Content-Type: application/json" \\`);
          console.log(`  -d '{"name": "Production U1"}'`);
        }
      }
    }

    console.log('\n\n📊 STATISTIQUES:');
    console.log('=' .repeat(60));
    console.log(`🏭 Sites: ${sites.length}`);
    console.log(`🔧 Secteurs: ${await Secteur.countDocuments()}`);
    console.log(`👥 Services: ${await Service.countDocuments()}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

getRealIds();
