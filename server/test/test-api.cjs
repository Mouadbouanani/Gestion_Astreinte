const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api';

async function testAPI() {
  console.log('🔍 Testing API endpoints...\n');

  try {
    // Test 1: Try to login with admin credentials
    console.log('1️⃣ Testing admin login...');
    
    const adminLoginResponse = await axios.post(`${BASE_URL}/auth-jwt/login`, {
      email: 'admin@ocp.ma',
      password: 'Admin123!'
    });
    
    if (adminLoginResponse.data.success) {
      const adminToken = adminLoginResponse.data.data.token;
      const adminUser = adminLoginResponse.data.data.user;
      
      console.log(`✅ Admin logged in: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.role})`);
      
      // Test 2: Get all users (admin should see all)
      console.log('\n2️⃣ Testing getUsers as admin...');
      const usersResponse = await axios.get(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log(`📊 Found ${usersResponse.data.data.length} total users`);
      usersResponse.data.data.forEach(u => {
        console.log(`   - ${u.firstName} ${u.lastName} (${u.role}) - Service: ${u.service?.name || 'N/A'}`);
      });
      
      // Test 3: Try to login as chef_service
      console.log('\n3️⃣ Testing chef_service login...');
      try {
        const chefServiceLogin = await axios.post(`${BASE_URL}/auth-jwt/login`, {
          email: 'chef.cas-ext-for@ocp.ma',
          password: 'Chef123!'
        });
        
        if (chefServiceLogin.data.success) {
          const chefToken = chefServiceLogin.data.data.token;
          const chefUser = chefServiceLogin.data.data.user;
          
          console.log(`✅ Chef Service logged in: ${chefUser.firstName} ${chefUser.lastName} (${chefUser.role})`);
          console.log(`📍 Service: ${chefUser.service?.name || 'N/A'} (${chefUser.service?._id || 'N/A'})`);
          
          // Test 4: Get users as chef_service (should be scoped to their service)
          console.log('\n4️⃣ Testing getUsers as chef_service...');
          const chefUsersResponse = await axios.get(`${BASE_URL}/users`, {
            headers: { Authorization: `Bearer ${chefToken}` }
          });
          
          console.log(`📊 Found ${chefUsersResponse.data.data.length} users (chef_service view)`);
          chefUsersResponse.data.data.forEach(u => {
            console.log(`   - ${u.firstName} ${u.lastName} (${u.role}) - Service: ${u.service?.name || 'N/A'}`);
          });
          
          // Test 5: Get users with service filter (if service exists)
          if (chefUser.service?._id) {
            console.log('\n5️⃣ Testing getUsers with service filter...');
            const filteredResponse = await axios.get(`${BASE_URL}/users?service=${chefUser.service._id}&role=collaborateur`, {
              headers: { Authorization: `Bearer ${chefToken}` }
            });
            
            console.log(`📊 Found ${filteredResponse.data.data.length} collaborators in service`);
            filteredResponse.data.data.forEach(u => {
              console.log(`   - ${u.firstName} ${u.lastName} (${u.role}) - Service: ${u.service?.name || 'N/A'}`);
            });
          } else {
            console.log('\n⚠️ Chef service has no service assigned');
          }
          
          // Test 6: Try to access a different service (should fail)
          console.log('\n6️⃣ Testing access to different service...');
          try {
            const differentServiceResponse = await axios.get(`${BASE_URL}/users?service=507f1f77bcf86cd799439012`, {
              headers: { Authorization: `Bearer ${chefToken}` }
            });
            console.log('❌ Should have failed but succeeded');
          } catch (error) {
            if (error.response?.status === 403) {
              console.log('✅ Correctly blocked from accessing different service');
            } else {
              console.log(`⚠️ Unexpected error: ${error.response?.status} - ${error.response?.data?.message}`);
            }
          }
        }
      } catch (error) {
        console.log('❌ Chef service login failed:', error.response?.data || error.message);
      }
      
    } else {
      console.log('❌ Admin login failed:', adminLoginResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAPI();
