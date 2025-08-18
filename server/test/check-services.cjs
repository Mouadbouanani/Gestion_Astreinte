const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api';

async function checkServices() {
  console.log('🔍 Checking Services and Secteurs...\n');

  try {
    // Login as admin
    console.log('1️⃣ Logging in as admin...');
    
    const adminLoginResponse = await axios.post(`${BASE_URL}/auth-jwt/login`, {
      email: 'admin@ocp.ma',
      password: 'Admin123!'
    });
    
    if (adminLoginResponse.data.success) {
      const adminToken = adminLoginResponse.data.data.token;
      
      console.log('✅ Admin logged in successfully');
      
      // Get all sites
      console.log('\n2️⃣ Getting all sites...');
      const sitesResponse = await axios.get(`${BASE_URL}/org/sites`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log(`📊 Found ${sitesResponse.data.data.length} sites:`);
      sitesResponse.data.data.forEach(site => {
        console.log(`   - ${site.name} (${site.code}) - ID: ${site._id}`);
      });
      
      // Get all secteurs
      console.log('\n3️⃣ Getting all secteurs...');
      const secteursResponse = await axios.get(`${BASE_URL}/org/secteurs`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log(`📊 Found ${secteursResponse.data.data.length} secteurs:`);
      secteursResponse.data.data.forEach(secteur => {
        console.log(`   - ${secteur.name} (${secteur.code}) - ID: ${secteur._id} - Site: ${secteur.site?.name || 'N/A'}`);
      });
      
      // Get all services
      console.log('\n4️⃣ Getting all services...');
      const servicesResponse = await axios.get(`${BASE_URL}/org/services`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log(`📊 Found ${servicesResponse.data.data.length} services:`);
      servicesResponse.data.data.forEach(service => {
        console.log(`   - ${service.name} (${service.code}) - ID: ${service._id} - Secteur: ${service.secteur?.name || 'N/A'}`);
      });
      
    } else {
      console.log('❌ Admin login failed:', adminLoginResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Check failed:', error.response?.data || error.message);
  }
}

checkServices();

