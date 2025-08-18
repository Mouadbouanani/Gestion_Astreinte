const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api';

async function checkUserData() {
  console.log('🔍 Checking User Data in Database...\n');

  try {
    // Login as admin to get all users
    console.log('1️⃣ Logging in as admin...');
    
    const adminLoginResponse = await axios.post(`${BASE_URL}/auth-jwt/login`, {
      email: 'admin@ocp.ma',
      password: 'Admin123!'
    });
    
    if (adminLoginResponse.data.success) {
      const adminToken = adminLoginResponse.data.data.token;
      
      console.log('✅ Admin logged in successfully');
      
      // Get all users with detailed info
      console.log('\n2️⃣ Getting all users...');
      const usersResponse = await axios.get(`${BASE_URL}/users?limit=100`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log(`📊 Found ${usersResponse.data.data.length} users`);
      
      // Check each user's data
      usersResponse.data.data.forEach((user, index) => {
        console.log(`\n👤 User ${index + 1}:`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Service ID: ${user.service || 'N/A'}`);
        console.log(`   Service Name: ${user.service?.name || 'N/A'}`);
        console.log(`   Secteur ID: ${user.secteur || 'N/A'}`);
        console.log(`   Secteur Name: ${user.secteur?.name || 'N/A'}`);
        console.log(`   Site ID: ${user.site || 'N/A'}`);
        console.log(`   Site Name: ${user.site?.name || 'N/A'}`);
        console.log(`   Is Active: ${user.isActive}`);
      });
      
      // Check specifically for chef_service users
      console.log('\n3️⃣ Checking Chef Service users...');
      const chefServiceUsers = usersResponse.data.data.filter(u => u.role === 'chef_service');
      console.log(`Found ${chefServiceUsers.length} chef_service users:`);
      
      chefServiceUsers.forEach(user => {
        console.log(`   - ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`     Service: ${user.service?.name || 'N/A'} (${user.service || 'N/A'})`);
      });
      
      // Check specifically for collaborateur users
      console.log('\n4️⃣ Checking Collaborateur users...');
      const collaborateurUsers = usersResponse.data.data.filter(u => u.role === 'collaborateur');
      console.log(`Found ${collaborateurUsers.length} collaborateur users:`);
      
      collaborateurUsers.forEach(user => {
        console.log(`   - ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`     Service: ${user.service?.name || 'N/A'} (${user.service || 'N/A'})`);
      });
      
    } else {
      console.log('❌ Admin login failed:', adminLoginResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Check failed:', error.response?.data || error.message);
  }
}

checkUserData();

