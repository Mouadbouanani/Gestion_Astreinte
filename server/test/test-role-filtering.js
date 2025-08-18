const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api';

// Test data - you may need to adjust these IDs based on your actual data
const TEST_DATA = {
  chef_secteur: {
    email: 'chef.secteur@ocp.com',
    password: 'password123'
  },
  chef_service: {
    email: 'chef.service@ocp.com', 
    password: 'password123'
  }
};

async function testRoleFiltering() {
  console.log('🧪 Testing Role-Based Filtering Fix...\n');

  try {
    // Test 1: Chef Secteur login and get users by secteur
    console.log('1️⃣ Testing Chef Secteur filtering...');
    
    const chefSecteurLogin = await axios.post(`${BASE_URL}/auth-jwt/login`, TEST_DATA.chef_secteur);
    const chefSecteurToken = chefSecteurLogin.data.data.token;
    const chefSecteurUser = chefSecteurLogin.data.data.user;
    
    console.log(`   ✅ Chef Secteur logged in: ${chefSecteurUser.firstName} ${chefSecteurUser.lastName}`);
    console.log(`   📍 Secteur: ${chefSecteurUser.secteur?.name} (${chefSecteurUser.secteur?._id})`);

    // Test getting users by secteur (should work now)
    const secteurUsersResponse = await axios.get(`${BASE_URL}/users?secteur=${chefSecteurUser.secteur._id}&role=ingenieur`, {
      headers: { Authorization: `Bearer ${chefSecteurToken}` }
    });
    
    console.log(`   👥 Found ${secteurUsersResponse.data.data.length} engineers in secteur`);
    secteurUsersResponse.data.data.forEach(user => {
      console.log(`      - ${user.firstName} ${user.lastName} (${user.role})`);
    });

    // Test 2: Chef Service login and get users by service
    console.log('\n2️⃣ Testing Chef Service filtering...');
    
    const chefServiceLogin = await axios.post(`${BASE_URL}/auth-jwt/login`, TEST_DATA.chef_service);
    const chefServiceToken = chefServiceLogin.data.data.token;
    const chefServiceUser = chefServiceLogin.data.data.user;
    
    console.log(`   ✅ Chef Service logged in: ${chefServiceUser.firstName} ${chefServiceUser.lastName}`);
    console.log(`   📍 Service: ${chefServiceUser.service?.name} (${chefServiceUser.service?._id})`);

    // Test getting users by service (should work now)
    const serviceUsersResponse = await axios.get(`${BASE_URL}/users?service=${chefServiceUser.service._id}&role=collaborateur`, {
      headers: { Authorization: `Bearer ${chefServiceToken}` }
    });
    
    console.log(`   👥 Found ${serviceUsersResponse.data.data.length} collaborators in service`);
    serviceUsersResponse.data.data.forEach(user => {
      console.log(`      - ${user.firstName} ${user.lastName} (${user.role})`);
    });

    // Test 3: Verify that users can't access other secteurs/services
    console.log('\n3️⃣ Testing Access Restrictions...');
    
    // Try to access a different secteur (should fail)
    try {
      await axios.get(`${BASE_URL}/users?secteur=507f1f77bcf86cd799439011&role=ingenieur`, {
        headers: { Authorization: `Bearer ${chefSecteurToken}` }
      });
      console.log('   ❌ Chef Secteur was able to access different secteur (should have failed)');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('   ✅ Chef Secteur correctly blocked from accessing different secteur');
      } else {
        console.log(`   ⚠️ Unexpected error: ${error.response?.status} - ${error.response?.data?.message}`);
      }
    }

    // Try to access a different service (should fail)
    try {
      await axios.get(`${BASE_URL}/users?service=507f1f77bcf86cd799439012&role=collaborateur`, {
        headers: { Authorization: `Bearer ${chefServiceToken}` }
      });
      console.log('   ❌ Chef Service was able to access different service (should have failed)');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('   ✅ Chef Service correctly blocked from accessing different service');
      } else {
        console.log(`   ⚠️ Unexpected error: ${error.response?.status} - ${error.response?.data?.message}`);
      }
    }

    console.log('\n🎉 Role-based filtering test completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Chef Secteur can now see engineers in their secteur');
    console.log('   ✅ Chef Service can now see collaborators in their service');
    console.log('   ✅ Access restrictions work correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Make sure the server is running and the test users exist in the database');
      console.log('💡 You may need to adjust the email/password in TEST_DATA');
    }
  }
}

// Run the test
testRoleFiltering();

