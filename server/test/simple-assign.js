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

async function simpleAssign() {
  console.log('🔧 ASSIGNATION SIMPLE DES UTILISATEURS EXISTANTS');
  console.log('=' .repeat(60));

  try {
    // 1. Assigner Mohamed Tazi comme chef_secteur au secteur Traitement
    console.log('\n🟡 Mohamed Tazi → Chef Secteur Traitement');
    const mohamed = await User.findOne({ email: 'm.tazi@ocp.ma' });
    if (mohamed) {
      mohamed.role = 'chef_secteur';
      mohamed.site = IDS.casablanca;
      mohamed.secteur = IDS.secteurTraitement;
      await mohamed.save();
      console.log('✅ Mohamed Tazi assigné comme chef secteur Traitement');
    }

    // 2. Assigner Rachid Amrani comme chef_service au service Production U1
    console.log('\n🔵 Rachid Amrani → Chef Service Production U1');
    const rachid = await User.findOne({ email: 'r.amrani@ocp.ma' });
    if (rachid) {
      rachid.site = IDS.casablanca;
      rachid.secteur = IDS.secteurTraitement;
      rachid.service = IDS.serviceProductionU1;
      await rachid.save();
      console.log('✅ Rachid Amrani assigné comme chef service Production U1');
    }

    // 3. Assigner Aicha Benali comme ingénieur au secteur Traitement
    console.log('\n🟢 Aicha Benali → Ingénieur Secteur Traitement');
    const aicha = await User.findOne({ email: 'a.benali@ocp.ma' });
    if (aicha) {
      aicha.site = IDS.casablanca;
      aicha.secteur = IDS.secteurTraitement;
      await aicha.save();
      console.log('✅ Aicha Benali assignée comme ingénieur secteur Traitement');
    }

    // 4. Assigner Khadija Berrada comme chef_service au service Production U2
    console.log('\n🔵 Khadija Berrada → Chef Service Production U2');
    const khadija = await User.findOne({ email: 'k.berrada@ocp.ma' });
    if (khadija) {
      khadija.site = IDS.casablanca;
      khadija.secteur = IDS.secteurTraitement;
      khadija.service = IDS.serviceProductionU2;
      await khadija.save();
      console.log('✅ Khadija Berrada assignée comme chef service Production U2');
    }

    // 5. Assigner Laila Mansouri comme collaborateur au service Production U1
    console.log('\n🟣 Laila Mansouri → Collaborateur Production U1');
    const laila = await User.findOne({ email: 'l.mansouri@ocp.ma' });
    if (laila) {
      laila.site = IDS.casablanca;
      laila.secteur = IDS.secteurTraitement;
      laila.service = IDS.serviceProductionU1;
      await laila.save();
      console.log('✅ Laila Mansouri assignée comme collaborateur Production U1');
    }

    console.log('\n📊 RÉSUMÉ DES ASSIGNATIONS');
    console.log('=' .repeat(60));
    console.log('✅ Admin: Youssef Bennani (accès global)');
    console.log('✅ Chef Secteur: Mohamed Tazi → Secteur Traitement');
    console.log('✅ Ingénieur: Aicha Benali → Secteur Traitement');
    console.log('✅ Chef Service 1: Rachid Amrani → Service Production U1');
    console.log('✅ Chef Service 2: Khadija Berrada → Service Production U2');
    console.log('✅ Collaborateur: Laila Mansouri → Service Production U1');

  } catch (error) {
    console.error('❌ Erreur assignation:', error);
  }
}

async function verifyAssignments() {
  console.log('\n🔍 VÉRIFICATION DES ASSIGNATIONS');
  console.log('=' .repeat(60));

  const testUsers = [
    'y.bennani@ocp.ma',
    'm.tazi@ocp.ma',
    'a.benali@ocp.ma',
    'r.amrani@ocp.ma',
    'k.berrada@ocp.ma',
    'l.mansouri@ocp.ma'
  ];

  for (const email of testUsers) {
    const user = await User.findOne({ email })
      .populate('site', 'name code')
      .populate('secteur', 'name code')
      .populate('service', 'name code');

    if (user) {
      console.log(`\n👤 ${user.firstName} ${user.lastName} (${user.role})`);
      console.log(`   📧 ${user.email}`);
      console.log(`   🏢 Site: ${user.site?.name || 'Non assigné'}`);
      console.log(`   🏭 Secteur: ${user.secteur?.name || 'Non assigné'}`);
      console.log(`   🔧 Service: ${user.service?.name || 'Non assigné'}`);
    } else {
      console.log(`\n❌ ${email}: Utilisateur introuvable`);
    }
  }
}

async function main() {
  await connectDB();
  await simpleAssign();
  await verifyAssignments();
  
  console.log('\n🎉 ASSIGNATION TERMINÉE!');
  console.log('🚀 Vous pouvez maintenant tester le système JWT automatique');
  
  await mongoose.disconnect();
  console.log('🔌 Déconnecté de MongoDB');
}

main().catch(console.error);
