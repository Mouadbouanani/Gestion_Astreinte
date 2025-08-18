const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api';

async function checkUserIDs() {
  console.log('🔍 Checking User IDs...\n');

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
      
      // Get all users
      console.log('\n2️⃣ Getting all users...');
      const usersResponse = await axios.get(`${BASE_URL}/users?limit=100`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log(`📊 Found ${usersResponse.data.data.length} users`);
      
      // Check each user's ID
      usersResponse.data.data.forEach((user, index) => {
        console.log(`\n👤 User ${index + 1}:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   ID: ${user._id || 'UNDEFINED'}`);
        console.log(`   ID type: ${typeof user._id}`);
        console.log(`   Full user object keys: ${Object.keys(user).join(', ')}`);
        
        // Check if there are other ID fields
        if (user.id) console.log(`   id field: ${user.id}`);
        if (user.userId) console.log(`   userId field: ${user.userId}`);
      });
      
      // Try to get a specific user by email
      console.log('\n3️⃣ Testing get user by email...');
      const chefServiceUser = usersResponse.data.data.find(u => u.email === 'chef.cas-ext-for@ocp.ma');
      if (chefServiceUser) {
        console.log(`Found chef service user: ${chefServiceUser.email}`);
        console.log(`ID: ${chefServiceUser._id || 'UNDEFINED'}`);
        
        // Try to get the user by ID if it exists
        if (chefServiceUser._id) {
          try {
            const userByIdResponse = await axios.get(`${BASE_URL}/users/${chefServiceUser._id}`, {
              headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log('✅ User by ID response:', userByIdResponse.data);
          } catch (error) {
            console.log('❌ Error getting user by ID:', error.response?.data || error.message);
          }
        }
      }
      
    } else {
      console.log('❌ Admin login failed:', adminLoginResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Check failed:', error.response?.data || error.message);
  }
}

checkUserIDs();

