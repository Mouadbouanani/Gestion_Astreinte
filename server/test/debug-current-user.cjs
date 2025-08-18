const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api';

async function debugCurrentUser() {
  console.log('🔍 Debugging Current User Object...\n');

  try {
    // Login as chef_service
    console.log('1️⃣ Login as chef_service...');
    
    const loginResponse = await axios.post(`${BASE_URL}/auth-jwt/login`, {
      email: 'chef.cas-ext-for@ocp.ma',
      password: 'Chef123!'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      const user = loginResponse.data.data.user;
      
      console.log('✅ Login successful');
      console.log('\n👤 User object from login:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
      console.log('   Service:', user.service);
      console.log('   Service ID:', user.service?._id);
      console.log('   Service Name:', user.service?.name);
      console.log('   Service type:', typeof user.service);
      console.log('   Full user object:', JSON.stringify(user, null, 2));
      
      // Test the API call and see what happens
      console.log('\n2️⃣ Testing API call...');
      try {
        const response = await axios.get(`${BASE_URL}/users?role=collaborateur`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`📊 API Response: ${response.data.data.length} users`);
        console.log('   Response data:', JSON.stringify(response.data, null, 2));
        
      } catch (error) {
        console.log('❌ API Error:', error.response?.data || error.message);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

debugCurrentUser();

