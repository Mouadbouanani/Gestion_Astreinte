import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5050/api';

// Utilisateurs de test
const USERS = [
  'y.bennani@ocp.ma',
  'h.alami@ocp.ma', 
  'm.tazi@ocp.ma',
  'a.benali@ocp.ma',
  'r.amrani@ocp.ma',
  'f.idrissi@ocp.ma'
];

async function loginUser(email) {
  try {
    const response = await fetch(`${API_BASE}/auth-jwt/login-dev`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function checkUserData() {
  console.log('🔍 VÉRIFICATION DES DONNÉES UTILISATEUR');
  console.log('=' .repeat(50));

  for (const email of USERS) {
    console.log(`\n👤 Utilisateur: ${email}`);
    console.log('-' .repeat(30));
    
    const result = await loginUser(email);
    
    if (result.success) {
      const user = result.data.user;
      console.log(`✅ Connexion: OK`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Nom: ${user.firstName} ${user.lastName}`);
      console.log(`🎭 Rôle: ${user.role}`);
      console.log(`🏢 Site: ${user.site ? `${user.site.name} (${user.site._id})` : '❌ NON ASSIGNÉ'}`);
      console.log(`🏭 Secteur: ${user.secteur ? `${user.secteur.name} (${user.secteur._id})` : '❌ NON ASSIGNÉ'}`);
      console.log(`🔧 Service: ${user.service ? `${user.service.name} (${user.service._id})` : '❌ NON ASSIGNÉ'}`);
      
      // Vérifier les permissions
      const permissions = result.data.permissions;
      console.log(`🔐 Scope: ${permissions.scope}`);
      
    } else {
      console.log(`❌ Connexion: ÉCHEC`);
      console.log(`💬 Message: ${result.message || result.error}`);
    }
  }

  console.log('\n📊 RÉSUMÉ');
  console.log('=' .repeat(50));
  console.log('🎯 Pour que le système JWT automatique fonctionne:');
  console.log('  • Tous les utilisateurs doivent exister');
  console.log('  • Chaque utilisateur doit être assigné à son périmètre');
  console.log('  • Chef Service → Service assigné');
  console.log('  • Chef Secteur → Secteur assigné');
  console.log('  • Ingénieur → Secteur assigné');
  console.log('  • Chef Site → Site assigné');
}

// Exécuter la vérification
checkUserData().catch(console.error);
