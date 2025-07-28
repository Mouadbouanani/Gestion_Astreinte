import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Site from '../models/Site.js';
import Secteur from '../models/Secteur.js';
import Service from '../models/Service.js';

// Configuration
dotenv.config({ path: './config.env' });

// IDs réels de la base
const IDS = {
  casablanca: '688550090c4c8dfeb9c74e81',
  jorfLasfar: '688550090c4c8dfeb9c74e82',
  secteurTraitement: '688550090c4c8dfeb9c74e8e',
  secteurExtraction: '688550090c4c8dfeb9c74e8f',
  serviceProductionU1: '688550090c4c8dfeb9c74eb7',
  serviceProductionU2: '688550090c4c8dfeb9c74eb8'
};

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gestion_astreinte');
    console.log('🟢 Connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
}

async function assignUsersToPerimeters() {
  console.log('🔧 ASSIGNATION DES UTILISATEURS AUX PÉRIMÈTRES');
  console.log('=' .repeat(60));

  try {
    // 1. Assigner Admin (pas de périmètre spécifique)
    console.log('\n🔴 Admin - Youssef Bennani');
    const admin = await User.findOne({ email: 'y.bennani@ocp.ma' });
    if (admin) {
      // Admin n'a pas besoin d'assignation spécifique
      console.log('✅ Admin configuré (accès global)');
    }

    // 2. Créer et assigner Chef de Site
    console.log('\n🟠 Chef de Site - Hassan Alami');
    let chefSite = await User.findOne({ email: 'h.alami@ocp.ma' });
    if (!chefSite) {
      chefSite = new User({
        firstName: 'Hassan',
        lastName: 'Alami',
        email: 'h.alami@ocp.ma',
        password: '$2a$12$LQv3c1yqBwEHxPuNYaGNL.VQO3PmHkVpjGdwjBQvK4rI2kDWYoigO', // Site2024!
        role: 'chef_site',
        site: IDS.casablanca,
        isActive: true
      });
      await chefSite.save();
      console.log('✅ Chef de Site créé et assigné au site Casablanca');
    } else {
      chefSite.site = IDS.casablanca;
      await chefSite.save();
      console.log('✅ Chef de Site assigné au site Casablanca');
    }

    // 3. Assigner Chef de Secteur
    console.log('\n🟡 Chef de Secteur - Mohamed Tazi');
    const chefSecteur = await User.findOne({ email: 'm.tazi@ocp.ma' });
    if (chefSecteur) {
      chefSecteur.role = 'chef_secteur';
      chefSecteur.site = IDS.casablanca;
      chefSecteur.secteur = IDS.secteurTraitement;
      await chefSecteur.save();
      console.log('✅ Chef de Secteur assigné au secteur Traitement');
    }

    // 4. Assigner Ingénieur
    console.log('\n🟢 Ingénieur - Aicha Benali');
    const ingenieur = await User.findOne({ email: 'a.benali@ocp.ma' });
    if (ingenieur) {
      ingenieur.site = IDS.casablanca;
      ingenieur.secteur = IDS.secteurTraitement;
      await ingenieur.save();
      console.log('✅ Ingénieur assigné au secteur Traitement');
    }

    // 5. Assigner Chef de Service
    console.log('\n🔵 Chef de Service - Rachid Amrani');
    const chefService = await User.findOne({ email: 'r.amrani@ocp.ma' });
    if (chefService) {
      chefService.site = IDS.casablanca;
      chefService.secteur = IDS.secteurTraitement;
      chefService.service = IDS.serviceProductionU1;
      await chefService.save();
      console.log('✅ Chef de Service assigné au service Production U1');
    }

    // 6. Créer et assigner Collaborateur
    console.log('\n🟣 Collaborateur - Fatima Idrissi');
    let collaborateur = await User.findOne({ email: 'f.idrissi@ocp.ma' });
    if (!collaborateur) {
      collaborateur = new User({
        firstName: 'Fatima',
        lastName: 'Idrissi',
        email: 'f.idrissi@ocp.ma',
        password: '$2a$12$LQv3c1yqBwEHxPuNYaGNL.VQO3PmHkVpjGdwjBQvK4rI2kDWYoigO', // Collab2024!
        role: 'collaborateur',
        site: IDS.casablanca,
        secteur: IDS.secteurTraitement,
        service: IDS.serviceProductionU1,
        isActive: true
      });
      await collaborateur.save();
      console.log('✅ Collaborateur créé et assigné au service Production U1');
    } else {
      collaborateur.site = IDS.casablanca;
      collaborateur.secteur = IDS.secteurTraitement;
      collaborateur.service = IDS.serviceProductionU1;
      await collaborateur.save();
      console.log('✅ Collaborateur assigné au service Production U1');
    }

    // 7. Créer un deuxième chef de service pour tester la logique
    console.log('\n🔵 Chef de Service 2 - Karim Benjelloun');
    let chefService2 = await User.findOne({ email: 'k.benjelloun@ocp.ma' });
    if (!chefService2) {
      chefService2 = new User({
        firstName: 'Karim',
        lastName: 'Benjelloun',
        email: 'k.benjelloun@ocp.ma',
        password: '$2a$12$LQv3c1yqBwEHxPuNYaGNL.VQO3PmHkVpjGdwjBQvK4rI2kDWYoigO', // Service2024!
        role: 'chef_service',
        site: IDS.casablanca,
        secteur: IDS.secteurTraitement,
        service: IDS.serviceProductionU2,
        isActive: true
      });
      await chefService2.save();
      console.log('✅ Chef de Service 2 créé et assigné au service Production U2');
    }

    console.log('\n📊 RÉSUMÉ DES ASSIGNATIONS');
    console.log('=' .repeat(60));
    console.log('✅ Admin: Accès global');
    console.log('✅ Chef Site: Site Casablanca');
    console.log('✅ Chef Secteur: Secteur Traitement');
    console.log('✅ Ingénieur: Secteur Traitement');
    console.log('✅ Chef Service 1: Service Production U1');
    console.log('✅ Chef Service 2: Service Production U2');
    console.log('✅ Collaborateur: Service Production U1');

    console.log('\n🎯 TESTS POSSIBLES MAINTENANT:');
    console.log('• Chef Service 1 peut gérer Production U1, consulter Production U2');
    console.log('• Chef Service 2 peut gérer Production U2, consulter Production U1');
    console.log('• Chef Secteur peut gérer tout le secteur Traitement');
    console.log('• Ingénieur peut consulter le secteur Traitement');
    console.log('• Collaborateur peut consulter Production U1');

  } catch (error) {
    console.error('❌ Erreur assignation:', error);
  }
}

async function verifyAssignments() {
  console.log('\n🔍 VÉRIFICATION DES ASSIGNATIONS');
  console.log('=' .repeat(60));

  const users = await User.find({ isActive: true })
    .populate('site', 'name code')
    .populate('secteur', 'name code')
    .populate('service', 'name code')
    .sort({ role: 1 });

  for (const user of users) {
    console.log(`\n👤 ${user.firstName} ${user.lastName} (${user.role})`);
    console.log(`   📧 ${user.email}`);
    console.log(`   🏢 Site: ${user.site?.name || 'Non assigné'}`);
    console.log(`   🏭 Secteur: ${user.secteur?.name || 'Non assigné'}`);
    console.log(`   🔧 Service: ${user.service?.name || 'Non assigné'}`);
  }
}

async function main() {
  await connectDB();
  await assignUsersToPerimeters();
  await verifyAssignments();
  
  console.log('\n🎉 ASSIGNATION TERMINÉE!');
  console.log('🚀 Vous pouvez maintenant tester le système JWT automatique');
  
  await mongoose.disconnect();
  console.log('🔌 Déconnecté de MongoDB');
}

main().catch(console.error);
