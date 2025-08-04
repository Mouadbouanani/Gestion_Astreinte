import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

const resetOCPStructure = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gestion_astreinte');
    console.log('✅ Connected to MongoDB');

    // Supprimer complètement les collections
    console.log('🧹 Nettoyage complet de la base...');
    await mongoose.connection.db.dropCollection('services').catch(() => {});
    await mongoose.connection.db.dropCollection('secteurs').catch(() => {});
    await mongoose.connection.db.dropCollection('sites').catch(() => {});
    console.log('✅ Collections supprimées');

    // Recréer les modèles
    const siteSchema = new mongoose.Schema({
      name: { type: String, required: true, unique: true },
      code: { type: String, required: true, unique: true },
      address: { type: String, required: true },
      isActive: { type: Boolean, default: true }
    }, { timestamps: true });

    const secteurSchema = new mongoose.Schema({
      name: { type: String, required: true },
      code: { type: String, required: true },
      site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
      isActive: { type: Boolean, default: true }
    }, { timestamps: true });

    const serviceSchema = new mongoose.Schema({
      name: { type: String, required: true },
      code: { type: String, required: true },
      secteur: { type: mongoose.Schema.Types.ObjectId, ref: 'Secteur', required: true },
      isActive: { type: Boolean, default: true }
    }, { timestamps: true });

    // Index composé pour éviter les doublons
    secteurSchema.index({ site: 1, name: 1 }, { unique: true });
    serviceSchema.index({ secteur: 1, name: 1 }, { unique: true });

    const Site = mongoose.model('Site', siteSchema);
    const Secteur = mongoose.model('Secteur', secteurSchema);
    const Service = mongoose.model('Service', serviceSchema);

    // 1. CRÉER LES 8 SITES OCP
    console.log('\n🏭 CRÉATION DES SITES OCP...');
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

    const createdSites = await Site.insertMany(sitesOCP);
    console.log(`✅ ${createdSites.length} sites OCP créés`);

    // 2. CRÉER LES SECTEURS
    console.log('\n🔧 CRÉATION DES SECTEURS...');
    const secteursOCP = ['Traitement', 'Extraction', 'Maintenance', 'Logistique', 'Qualité'];
    
    const secteursData = [];
    createdSites.forEach(site => {
      secteursOCP.forEach(secteurName => {
        secteursData.push({
          name: secteurName,
          code: `${site.code}_${secteurName.substring(0, 4).toUpperCase()}`,
          site: site._id,
          isActive: true
        });
      });
    });

    const createdSecteurs = await Secteur.insertMany(secteursData);
    console.log(`✅ ${createdSecteurs.length} secteurs créés`);

    // 3. CRÉER LES SERVICES
    console.log('\n👥 CRÉATION DES SERVICES...');
    const servicesParSecteur = {
      'Traitement': ['Production U1', 'Production U2', 'Contrôle Qualité'],
      'Extraction': ['Mines', 'Transport', 'Géologie'],
      'Maintenance': ['Électricité', 'Mécanique', 'Instrumentation'],
      'Logistique': ['Approvisionnement', 'Expédition'],
      'Qualité': ['Laboratoire', 'Contrôle Process', 'Certification']
    };

    const servicesData = [];
    createdSecteurs.forEach(secteur => {
      const services = servicesParSecteur[secteur.name] || [];
      services.forEach((serviceName, index) => {
        servicesData.push({
          name: serviceName,
          code: `${secteur.code}_${(index + 1).toString().padStart(2, '0')}`,
          secteur: secteur._id,
          isActive: true
        });
      });
    });

    const createdServices = await Service.insertMany(servicesData);
    console.log(`✅ ${createdServices.length} services créés`);

    // 4. STATISTIQUES
    console.log('\n📊 STRUCTURE OCP CRÉÉE:');
    console.log(`🏭 Sites: ${createdSites.length}`);
    console.log(`🔧 Secteurs: ${createdSecteurs.length}`);
    console.log(`👥 Services: ${createdServices.length}`);

    console.log('\n📋 SITES OCP:');
    createdSites.forEach(site => {
      console.log(`  • ${site.name} (${site.code})`);
    });

    console.log('\n🎉 STRUCTURE OCP CONFORME AUX SPÉCIFICATIONS!');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

resetOCPStructure();
