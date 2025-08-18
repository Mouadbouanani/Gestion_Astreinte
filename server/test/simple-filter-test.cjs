const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api';

async function simpleFilterTest() {
  console.log('🧪 Simple Filter Test...\n');

  try {
    // Login as chef_service
    console.log('1️⃣ Login as chef_service...');
    
    const loginResponse = await axios.post(`${BASE_URL}/auth-jwt/login`, {
      email: 'chef.cas-ext-for@ocp.ma',
      password: 'Chef123!'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ Login successful');
      
      // Test 1: Get users without any filters
      console.log('\n2️⃣ Test: Get users without filters...');
      try {
        const response1 = await axios.get(`${BASE_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`📊 Result: ${response1.data.data.length} users`);
        
        // Count by role
        const byRole = {};
        response1.data.data.forEach(u => {
          byRole[u.role] = (byRole[u.role] || 0) + 1;
        });
        console.log('   Roles found:', byRole);
        
      } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
      }
      
      // Test 2: Get users with role=admin (should return empty)
      console.log('\n3️⃣ Test: Get users with role=admin...');
      try {
        const response2 = await axios.get(`${BASE_URL}/users?role=admin`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`📊 Result: ${response2.data.data.length} users`);
        
        if (response2.data.data.length === 0) {
          console.log('✅ SUCCESS: Role filtering is working!');
        } else {
          console.log('❌ FAILURE: Role filtering is NOT working!');
          console.log('   Expected: 0 users, Got:', response2.data.data.length);
        }
        
      } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
      }
      
      // Test 3: Get users with role=collaborateur
      console.log('\n4️⃣ Test: Get users with role=collaborateur...');
      try {
        const response3 = await axios.get(`${BASE_URL}/users?role=collaborateur`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`📊 Result: ${response3.data.data.length} users`);
        
        // Count by role to verify
        const byRole3 = {};
        response3.data.data.forEach(u => {
          byRole3[u.role] = (byRole3[u.role] || 0) + 1;
        });
        console.log('   Roles found:', byRole3);
        
      } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

simpleFilterTest();

