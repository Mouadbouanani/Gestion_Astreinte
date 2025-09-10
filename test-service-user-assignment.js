// Test script to verify service-user assignment functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api';

async function testServiceUserAssignment() {
  console.log('🧪 Testing Service-User Assignment Functionality\n');

  try {
    // 1. Login as admin
    console.log('1️⃣ Logging in as admin...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/auth-jwt/login`, {
      email: 'admin@ocp.ma',
      password: 'Admin123!'
    });
    
    if (!adminLoginResponse.data.success) {
      throw new Error('Admin login failed');
    }
    
    const adminToken = adminLoginResponse.data.data.token;
    console.log('✅ Admin logged in successfully');

    // 2. Get all services
    console.log('\n2️⃣ Getting all services...');
    const servicesResponse = await axios.get(`${BASE_URL}/org/services`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const services = servicesResponse.data.data;
    console.log(`📊 Found ${services.length} services`);
    
    if (services.length === 0) {
      console.log('❌ No services found. Please create services first.');
      return;
    }

    // 3. Get all users
    console.log('\n3️⃣ Getting all users...');
    const usersResponse = await axios.get(`${BASE_URL}/users?limit=100`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const users = usersResponse.data.data;
    console.log(`📊 Found ${users.length} users`);

    // 4. Test getting users by service
    console.log('\n4️⃣ Testing getUsersByService endpoint...');
    const firstService = services[0];
    console.log(`Testing with service: ${firstService.name} (${firstService._id})`);
    
    const usersByServiceResponse = await axios.get(`${BASE_URL}/users?service=${firstService._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`✅ Found ${usersByServiceResponse.data.data.length} users in service ${firstService.name}`);
    
    if (usersByServiceResponse.data.data.length > 0) {
      console.log('Users in service:');
      usersByServiceResponse.data.data.forEach(user => {
        console.log(`  - ${user.firstName} ${user.lastName} (${user.role})`);
      });
    }

    // 5. Test getting service details with users
    console.log('\n5️⃣ Testing service details with users...');
    const serviceDetailsResponse = await axios.get(`${BASE_URL}/org/services/${firstService._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const serviceDetails = serviceDetailsResponse.data.data;
    console.log(`✅ Service ${serviceDetails.name} has ${serviceDetails.users.length} users`);
    console.log(`Statistics: ${serviceDetails.statistics.usersCount} total users`);

    // 6. Test chef service login and user filtering
    console.log('\n6️⃣ Testing chef service user filtering...');
    
    // Find a chef_service user
    const chefServiceUser = users.find(u => u.role === 'chef_service' && u.service);
    if (chefServiceUser) {
      console.log(`Found chef service user: ${chefServiceUser.firstName} ${chefServiceUser.lastName}`);
      console.log(`Assigned to service: ${chefServiceUser.service}`);
      
      // Login as chef service
      const chefLoginResponse = await axios.post(`${BASE_URL}/auth-jwt/login`, {
        email: chefServiceUser.email,
        password: 'Password123!' // Assuming default password
      });
      
      if (chefLoginResponse.data.success) {
        const chefToken = chefLoginResponse.data.data.token;
        console.log('✅ Chef service logged in successfully');
        
        // Test getting users for their service
        const chefUsersResponse = await axios.get(`${BASE_URL}/users?service=${chefServiceUser.service}`, {
          headers: { Authorization: `Bearer ${chefToken}` }
        });
        
        console.log(`✅ Chef service can see ${chefUsersResponse.data.data.length} users in their service`);
      } else {
        console.log('❌ Chef service login failed - may need to set password');
      }
    } else {
      console.log('❌ No chef service users found with assigned services');
    }

    // 7. Test user assignment to service
    console.log('\n7️⃣ Testing user assignment to service...');
    
    // Find a user without a service assignment
    const unassignedUser = users.find(u => !u.service && u.role === 'collaborateur');
    if (unassignedUser && services.length > 0) {
      console.log(`Assigning user ${unassignedUser.firstName} ${unassignedUser.lastName} to service ${firstService.name}`);
      
      const updateResponse = await axios.put(`${BASE_URL}/users/${unassignedUser._id}`, {
        service: firstService._id
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (updateResponse.data.success) {
        console.log('✅ User successfully assigned to service');
        
        // Verify assignment
        const verifyResponse = await axios.get(`${BASE_URL}/users?service=${firstService._id}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        const assignedUser = verifyResponse.data.data.find(u => u._id === unassignedUser._id);
        if (assignedUser) {
          console.log('✅ Assignment verified - user now appears in service');
        } else {
          console.log('❌ Assignment verification failed');
        }
      } else {
        console.log('❌ User assignment failed');
      }
    } else {
      console.log('ℹ️ No unassigned users found for testing assignment');
    }

    console.log('\n🎉 Service-User Assignment Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testServiceUserAssignment();




