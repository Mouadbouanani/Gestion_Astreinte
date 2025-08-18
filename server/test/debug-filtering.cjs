const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api';

async function debugFiltering() {
  console.log('🔍 Debugging Filtering Logic...\n');

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
      console.log(`📍 Service type: ${typeof chefUser.service}`);
      console.log(`📍 Service value: ${JSON.stringify(chefUser.service)}`);
      
      // Test 2: Get users and analyze the filter
      console.log('\n2️⃣ Testing getUsers to see what filter is applied...');
      const usersResponse = await axios.get(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${chefToken}` }
      });
      
      console.log(`📊 Found ${usersResponse.data.data.length} users`);
      
      // Check if any users have service assignments
      const usersWithService = usersResponse.data.data.filter(u => u.service);
      const usersWithoutService = usersResponse.data.data.filter(u => !u.service);
      
      console.log(`   - Users with service: ${usersWithService.length}`);
      console.log(`   - Users without service: ${usersWithoutService.length}`);
      
      if (usersWithService.length > 0) {
        console.log('\n   Users with service assignments:');
        usersWithService.forEach(u => {
          console.log(`     - ${u.email}: ${u.service?.name || 'N/A'} (${u.service || 'N/A'})`);
        });
      }
      
      // Test 3: Check what happens when we explicitly filter by service
      if (chefUser.service?._id) {
        console.log('\n3️⃣ Testing explicit service filter...');
        const serviceFilterResponse = await axios.get(`${BASE_URL}/users?service=${chefUser.service._id}`, {
          headers: { Authorization: `Bearer ${chefToken}` }
        });
        
        console.log(`📊 Found ${serviceFilterResponse.data.data.length} users with service filter`);
        
        if (serviceFilterResponse.data.data.length === 0) {
          console.log('   ⚠️ No users found with service filter - this confirms the issue');
          console.log('   The filter is working, but no users have the required service assignment');
        }
      }
      
      // Test 4: Check what happens when we filter by role only
      console.log('\n4️⃣ Testing role filter only...');
      const roleFilterResponse = await axios.get(`${BASE_URL}/users?role=collaborateur`, {
        headers: { Authorization: `Bearer ${chefToken}` }
      });
      
      console.log(`📊 Found ${roleFilterResponse.data.data.length} collaborators with role filter`);
      
      // Test 5: Check what happens when we filter by admin role (should return empty)
      console.log('\n5️⃣ Testing admin role filter (should return empty)...');
      const adminFilterResponse = await axios.get(`${BASE_URL}/users?role=admin`, {
        headers: { Authorization: `Bearer ${chefToken}` }
      });
      
      console.log(`📊 Found ${adminFilterResponse.data.data.length} admins with role filter`);
      
      // Analysis
      console.log('\n📋 Analysis:');
      console.log(`   - Chef service has service: ${chefUser.service?._id || 'N/A'}`);
      console.log(`   - Users with service assignments: ${usersWithService.length}`);
      console.log(`   - Users without service assignments: ${usersWithoutService.length}`);
      console.log(`   - Service filter returns: ${serviceFilterResponse.data.data.length} users`);
      console.log(`   - Role filter returns: ${roleFilterResponse.data.data.length} users`);
      console.log(`   - Admin filter returns: ${adminFilterResponse.data.data.length} users`);
      
      if (adminFilterResponse.data.data.length > 0) {
        console.log('\n❌ PROBLEM: Role filtering is NOT working!');
        console.log('   The server should block access to admin users for chef_service');
      } else {
        console.log('\n✅ Role filtering is working correctly');
      }
      
      if (usersWithService.length === 0) {
        console.log('\n❌ PROBLEM: No users have service assignments!');
        console.log('   This is why service-based filtering is not working');
      }
      
    } else {
      console.log('❌ Chef service login failed:', chefServiceLogin.data.message);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugFiltering();

