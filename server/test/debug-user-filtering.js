const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api';

async function debugUserFiltering() {
  console.log('🔍 Debugging User Filtering...\n');

  try {
    // Test with a chef_service login
    console.log('1️⃣ Logging in as chef_service...');
    
    const loginResponse = await axios.post(`${BASE_URL}/auth-jwt/login`, {
      email: 'chef.service@ocp.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    console.log(`✅ Logged in as: ${user.firstName} ${user.lastName} (${user.role})`);
    console.log(`📍 Service: ${user.service?.name} (${user.service?._id})`);
    
    // Test 1: Get users without any filter (should be scoped to service)
    console.log('\n2️⃣ Testing getUsers without filters...');
    try {
      const response1 = await axios.get(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`📊 Found ${response1.data.data.length} users (no filters)`);
      response1.data.data.forEach(u => {
        console.log(`   - ${u.firstName} ${u.lastName} (${u.role}) - Service: ${u.service?.name || 'N/A'}`);
      });
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
    // Test 2: Get users with service filter
    console.log('\n3️⃣ Testing getUsers with service filter...');
    try {
      const response2 = await axios.get(`${BASE_URL}/users?service=${user.service._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`📊 Found ${response2.data.data.length} users (with service filter)`);
      response2.data.data.forEach(u => {
        console.log(`   - ${u.firstName} ${u.lastName} (${u.role}) - Service: ${u.service?.name || 'N/A'}`);
      });
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
    // Test 3: Get users with service and role filter
    console.log('\n4️⃣ Testing getUsers with service and role filter...');
    try {
      const response3 = await axios.get(`${BASE_URL}/users?service=${user.service._id}&role=collaborateur`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`📊 Found ${response3.data.data.length} collaborators (with service and role filter)`);
      response3.data.data.forEach(u => {
        console.log(`   - ${u.firstName} ${u.lastName} (${u.role}) - Service: ${u.service?.name || 'N/A'}`);
      });
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
    // Test 4: Try to access a different service (should fail)
    console.log('\n5️⃣ Testing access to different service...');
    try {
      const response4 = await axios.get(`${BASE_URL}/users?service=507f1f77bcf86cd799439012`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Correctly blocked from accessing different service');
      } else {
        console.log(`⚠️ Unexpected error: ${error.response?.status} - ${error.response?.data?.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugUserFiltering();

