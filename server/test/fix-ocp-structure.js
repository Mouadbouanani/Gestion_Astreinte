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

const fixOCPStructure = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gestion_astreinte');
    console.log('✅ Connected to MongoDB');

    // 1. CORRIGER LES SITES OCP (8 sites selon spécifications)
    console.log('\n🏭 CORRECTION DES SITES OCP...');
    
    // Supprimer les anciens sites et toute la structure
    await User.updateMany({}, { $unset: { site: 1, secteur: 1, service: 1 } });
    await Service.deleteMany({});
    await Secteur.deleteMany({});
    await Site.deleteMany({});
    console.log('🧹 Ancienne structure supprimée complètement');

    // Créer les 8 sites OCP officiels
    const sitesOCP = [
      { name: 'Casablanca', code: 'CAS', address: 'Zone Industrielle Ain Sebaa, Casablanca 20250' },
      { name: 'Jorf Lasfar', code: 'JLF', address: 'Complexe Industriel Jorf Lasfar, El Jadida 24000' },
      { name: 'Khouribga', code: 'KHO', address: 'Site Minier de Khouribga, Khouribga 25000' },
      { name: 'Boucraâ', code: 'BOU', address: 'Mine de Boucraâ, Laâyoune 70000' },
      { name: 'Youssoufia', code: 'YOU', address: 'Site Minier de Youssoufia, Youssoufia 46300' },
      { name: 'Safi', code: 'SAF', address: 'Complexe Chimique de Safi, Safi 46000' },
      { name: 'Benguerir', code: 'BEN', address: 'Site Industriel de Benguerir, Benguerir 43150' },
      { name: 'Laâyoune', code: 'LAA', address: 'Unité de Laâyoune, Laâyoune 70000' }
    ];

    const createdSites = [];
    for (const siteData of sitesOCP) {
      const site = new Site(siteData);
      await site.save();
      createdSites.push(site);
      console.log(`  ✅ Site créé: ${site.name} (${site.code})`);
    }

    // 2. CRÉER LES SECTEURS OCP SELON SPÉCIFICATIONS
    console.log('\n🔧 CRÉATION DES SECTEURS OCP...');
    
    // Secteurs selon spécifications OCP
    const secteursOCP = [
      'Traitement',
      'Extraction', 
      'Maintenance',
      'Logistique',
      'Qualité'
    ];

    const createdSecteurs = [];
    for (const site of createdSites) {
      console.log(`\n🏭 Secteurs pour ${site.name}:`);
      
      for (const secteurName of secteursOCP) {
        const secteur = new Secteur({
          name: secteurName,
          code: `${site.code}_${secteurName.toUpperCase().substring(0, 4)}`,
          site: site._id,
          isActive: true
        });
        
        await secteur.save();
        createdSecteurs.push(secteur);
        console.log(`  ✅ ${secteur.name} (${secteur.code})`);
      }
    }

    // 3. CRÉER LES SERVICES OPÉRATIONNELS SPÉCIALISÉS
    console.log('\n👥 CRÉATION DES SERVICES OPÉRATIONNELS...');
    
    // Services par secteur selon spécifications OCP
    const servicesParSecteur = {
      'Traitement': [
        'Production U1',
        'Production U2', 
        'Contrôle Qualité'
      ],
      'Extraction': [
        'Mines',
        'Transport',
        'Géologie'
      ],
      'Maintenance': [
        'Électricité',
        'Mécanique',
        'Instrumentation'
      ],
      'Logistique': [
        'Approvisionnement',
        'Expédition'
      ],
      'Qualité': [
        'Laboratoire',
        'Contrôle Process',
        'Certification'
      ]
    };

    const createdServices = [];
    for (const secteur of createdSecteurs) {
      const services = servicesParSecteur[secteur.name] || [];
      console.log(`\n🔧 Services pour secteur ${secteur.name} (${secteur.code}):`);
      
      for (const serviceName of services) {
        const service = new Service({
          name: serviceName,
          code: `${secteur.code}_${serviceName.replace(/\s+/g, '').toUpperCase().substring(0, 4)}`,
          secteur: secteur._id,
          isActive: true
        });
        
        await service.save();
        createdServices.push(service);
        console.log(`  ✅ ${service.name} (${service.code})`);
      }
    }

    // 4. RÉASSIGNER LES UTILISATEURS EXISTANTS
    console.log('\n👤 RÉASSIGNATION DES UTILISATEURS...');
    
    // Récupérer les utilisateurs existants
    const users = await User.find();
    console.log(`📊 ${users.length} utilisateurs trouvés`);

    // Réassigner selon la nouvelle structure
    for (const user of users) {
      // Trouver un site approprié (garder Casablanca pour les admins, distribuer les autres)
      let targetSite;
      if (user.role === 'admin') {
        targetSite = createdSites.find(s => s.code === 'CAS'); // Admin à Casablanca
      } else {
        // Distribuer les autres utilisateurs sur différents sites
        const siteIndex = users.indexOf(user) % createdSites.length;
        targetSite = createdSites[siteIndex];
      }

      // Trouver un secteur approprié selon le rôle
      let targetSecteur = null;
      let targetService = null;

      if (user.role !== 'admin') {
        // Assigner un secteur selon le rôle
        const siteSecteurs = createdSecteurs.filter(s => s.site.toString() === targetSite._id.toString());
        
        if (user.role === 'chef_secteur') {
          targetSecteur = siteSecteurs.find(s => s.name === 'Traitement') || siteSecteurs[0];
        } else if (user.role === 'ingenieur') {
          targetSecteur = siteSecteurs.find(s => s.name === 'Maintenance') || siteSecteurs[1];
        } else if (['chef_service', 'collaborateur'].includes(user.role)) {
          targetSecteur = siteSecteurs.find(s => s.name === 'Extraction') || siteSecteurs[2];
          
          // Assigner un service pour chef_service et collaborateur
          const secteurServices = createdServices.filter(s => s.secteur.toString() === targetSecteur._id.toString());
          targetService = secteurServices[0];
        }
      }

      // Mettre à jour l'utilisateur
      user.site = targetSite._id;
      if (targetSecteur) user.secteur = targetSecteur._id;
      if (targetService) user.service = targetService._id;
      
      await user.save();
      
      console.log(`✅ ${user.firstName} ${user.lastName} (${user.role})`);
      console.log(`   🏭 Site: ${targetSite.name}`);
      if (targetSecteur) console.log(`   🔧 Secteur: ${targetSecteur.name}`);
      if (targetService) console.log(`   👥 Service: ${targetService.name}`);
      console.log('');
    }

    // 5. STATISTIQUES FINALES
    console.log('\n📊 STATISTIQUES FINALES:');
    console.log(`🏭 Sites OCP: ${createdSites.length}`);
    console.log(`🔧 Secteurs: ${createdSecteurs.length}`);
    console.log(`👥 Services: ${createdServices.length}`);
    console.log(`👤 Utilisateurs: ${users.length}`);

    console.log('\n🎉 STRUCTURE OCP CORRIGÉE AVEC SUCCÈS!');
    console.log('\n📋 SITES OCP CRÉÉS:');
    createdSites.forEach(site => {
      console.log(`  • ${site.name} (${site.code}) - ${site.address}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

fixOCPStructure();
