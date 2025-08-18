const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api';

async function testFilteringLogic() {
  console.log('🧪 Testing Role-Based Filtering Logic...\n');

  try {
    // Test 1: Login as chef_service
    console.log('1️⃣ Testing chef_service login...');
    
    const chefServiceLogin = await axios.post(`${BASE_URL}/auth-jwt/login`, {
      email: 'chef.cas-ext-for@ocp.ma',
      password: 'Chef123!'
    });
    
    if (chefServiceLogin.data.success) {
      const chefToken = chefServiceLogin.data.data.token;
      const chefUser = chefServiceLogin.data.data.user;
      
      console.log(`✅ Chef Service logged in: ${chefUser.firstName} ${chefUser.lastName} (${chefUser.role})`);
      console.log(`📍 Service: ${chefUser.service?.name || 'N/A'} (${chefUser.service?._id || 'N/A'})`);
      
      // Test 2: Get users without any filters (should be scoped to service and role)
      console.log('\n2️⃣ Testing getUsers without filters (should be scoped)...');
      const usersResponse = await axios.get(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${chefToken}` }
      });
      
      console.log(`📊 Found ${usersResponse.data.data.length} users`);
      
      // Check if the response is properly filtered
      const allCollaborateurs = usersResponse.data.data.filter(u => u.role === 'collaborateur');
      const allChefServices = usersResponse.data.data.filter(u => u.role === 'chef_service');
      const allAdmins = usersResponse.data.data.filter(u => u.role === 'admin');
      
      console.log(`   - Collaborateurs: ${allCollaborateurs.length}`);
      console.log(`   - Chef Services: ${allChefServices.length}`);
      console.log(`   - Admins: ${allAdmins.length}`);
      
      if (allCollaborateurs.length > 0 && allAdmins.length === 0) {
        console.log('   ✅ Filtering is working - only collaborators returned, no admins');
      } else if (allAdmins.length > 0) {
        console.log('   ❌ Filtering is NOT working - admins are visible');
      } else {
        console.log('   ⚠️ No collaborators found, but this might be due to missing service assignments');
      }
      
      // Test 3: Try to get users with role filter
      console.log('\n3️⃣ Testing getUsers with role=collaborateur filter...');
      const collaborateurResponse = await axios.get(`${BASE_URL}/users?role=collaborateur`, {
        headers: { Authorization: `Bearer ${chefToken}` }
      });
      
      console.log(`📊 Found ${collaborateurResponse.data.data.length} collaborators with role filter`);
      
      // Test 4: Try to get users with role=admin filter (should return empty)
      console.log('\n4️⃣ Testing getUsers with role=admin filter (should return empty)...');
      const adminResponse = await axios.get(`${BASE_URL}/users?role=admin`, {
        headers: { Authorization: `Bearer ${chefToken}` }
      });
      
      console.log(`📊 Found ${adminResponse.data.data.length} admins with role filter`);
      
      if (adminResponse.data.data.length === 0) {
        console.log('   ✅ Role filtering is working - admin access blocked');
      } else {
        console.log('   ❌ Role filtering is NOT working - admin access allowed');
      }
      
      // Test 5: Check if the filtering is working at the database level
      console.log('\n5️⃣ Analyzing the filtering logic...');
      console.log('   The chef_service should only see collaborators by default');
      console.log('   The chef_service should be scoped to their service');
      console.log('   Since users have no service assignments, all users are returned');
      console.log('   But the role filtering should still work');
      
      // Summary
      console.log('\n📋 Summary:');
      console.log(`   - Total users returned: ${usersResponse.data.data.length}`);
      console.log(`   - Collaborateurs returned: ${allCollaborateurs.length}`);
      console.log(`   - Admins returned: ${allAdmins.length}`);
      console.log(`   - Role filter for admin: ${adminResponse.data.data.length} (should be 0)`);
      
      if (allAdmins.length === 0 && adminResponse.data.data.length === 0) {
        console.log('\n✅ Role-based filtering is working correctly!');
        console.log('   The issue is that users need service assignments for proper scoping.');
      } else {
        console.log('\n❌ Role-based filtering is NOT working correctly!');
        console.log('   The server is not properly filtering by role.');
      }
      
    } else {
      console.log('❌ Chef service login failed:', chefServiceLogin.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testFilteringLogic();

