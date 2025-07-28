import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5050/api';

async function debugTokenIssue() {
  console.log('🔍 DEBUG TOKEN ISSUE');
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
    console.log('Login Response:', JSON.stringify(loginData, null, 2));
    
    if (!loginData.success) {
      throw new Error(`Erreur login: ${loginData.message}`);
    }
    
    const token = loginData.data.token;
    console.log(`✅ Token reçu: ${token.substring(0, 50)}...`);

    // 2. Test immédiat du token
    console.log('\n🧪 Test immédiat du token...');
    const testResponse = await fetch(`${API_BASE}/auth-jwt/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const testData = await testResponse.json();
    console.log('Test Response:', JSON.stringify(testData, null, 2));

    // 3. Test création de site
    console.log('\n📝 Test création de site...');
    const createResponse = await fetch(`${API_BASE}/org/sites`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Debug Site',
        code: 'DEBUG',
        address: 'Debug Address'
      })
    });
    
    const createData = await createResponse.json();
    console.log('Create Response:', JSON.stringify(createData, null, 2));

    if (createData.success) {
      const siteId = createData.data._id;
      
      // 4. Test suppression immédiate
      console.log('\n🗑️ Test suppression immédiate...');
      const deleteResponse = await fetch(`${API_BASE}/org/sites/${siteId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const deleteData = await deleteResponse.json();
      console.log('Delete Response:', JSON.stringify(deleteData, null, 2));
    }

    // 5. Attendre 2 secondes et retester
    console.log('\n⏱️ Attente 2 secondes...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n🔄 Re-test du token après 2 secondes...');
    const retestResponse = await fetch(`${API_BASE}/auth-jwt/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const retestData = await retestResponse.json();
    console.log('Retest Response:', JSON.stringify(retestData, null, 2));

  } catch (error) {
    console.error('❌ Erreur debug:', error.message);
  }
}

debugTokenIssue().catch(console.error);
