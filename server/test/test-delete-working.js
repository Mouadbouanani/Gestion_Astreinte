import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5050/api';

async function testDeleteSite() {
  console.log('🗑️ TEST SUPPRESSION DE SITE');
  console.log('=' .repeat(50));

  try {
    // 1. Connexion admin
    console.log('\n🔐 Connexion admin...');
    const loginResponse = await fetch(`${API_BASE}/auth-jwt/login-dev`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'y.bennani@ocp.ma' })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error(`Erreur login: ${loginData.message}`);
    }
    
    const token = loginData.data.token;
    console.log(`✅ Admin connecté: ${loginData.data.user.firstName} ${loginData.data.user.lastName}`);

    // 2. Créer un site test avec bon format de code
    console.log('\n📝 Création site test...');
    const createResponse = await fetch(`${API_BASE}/org/sites`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Site Test Delete',
        code: 'TEST', // Code valide 4 lettres
        address: 'Adresse test pour suppression'
      })
    });
    
    const createData = await createResponse.json();
    console.log('Create Response:', JSON.stringify(createData, null, 2));

    if (createData.success) {
      const siteId = createData.data._id;
      console.log(`✅ Site créé avec ID: ${siteId}`);
      
      // 3. Lister les sites avant suppression
      console.log('\n📋 Sites avant suppression...');
      const listResponse = await fetch(`${API_BASE}/org/sites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const listData = await listResponse.json();
      
      if (listData.success) {
        console.log(`Nombre de sites: ${listData.data.length}`);
        listData.data.forEach(site => {
          console.log(`  • ${site.name} (${site.code}) - ID: ${site._id} - Actif: ${site.isActive}`);
        });
      }
      
      // 4. Supprimer le site test
      console.log('\n🗑️ Suppression du site test...');
      const deleteResponse = await fetch(`${API_BASE}/org/sites/${siteId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Delete Status: ${deleteResponse.status}`);
      const deleteData = await deleteResponse.json();
      console.log('Delete Response:', JSON.stringify(deleteData, null, 2));
      
      // 5. Vérifier après suppression
      console.log('\n📋 Sites après suppression...');
      const listAfterResponse = await fetch(`${API_BASE}/org/sites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const listAfterData = await listAfterResponse.json();
      
      if (listAfterData.success) {
        console.log(`Nombre de sites: ${listAfterData.data.length}`);
        listAfterData.data.forEach(site => {
          console.log(`  • ${site.name} (${site.code}) - ID: ${site._id} - Actif: ${site.isActive}`);
        });
      }
      
    } else {
      console.log(`❌ Erreur création: ${createData.message}`);
    }

    // 6. Test suppression site inexistant
    console.log('\n🔍 Test suppression site inexistant...');
    const deleteInexistantResponse = await fetch(`${API_BASE}/org/sites/507f1f77bcf86cd799439011`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const deleteInexistantData = await deleteInexistantResponse.json();
    console.log(`Status: ${deleteInexistantResponse.status}`);
    console.log('Response:', JSON.stringify(deleteInexistantData, null, 2));

    // 7. Test avec utilisateur non-admin
    console.log('\n🚫 Test avec chef service...');
    const chefResponse = await fetch(`${API_BASE}/auth-jwt/login-dev`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'r.amrani@ocp.ma' })
    });
    
    const chefData = await chefResponse.json();
    if (chefData.success) {
      const chefToken = chefData.data.token;
      
      const deleteChefResponse = await fetch(`${API_BASE}/org/sites/688550090c4c8dfeb9c74e81`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${chefToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const deleteChefData = await deleteChefResponse.json();
      console.log(`Status: ${deleteChefResponse.status}`);
      console.log('Response:', JSON.stringify(deleteChefData, null, 2));
    }

  } catch (error) {
    console.error('❌ Erreur test:', error.message);
  }
}

testDeleteSite().catch(console.error);
