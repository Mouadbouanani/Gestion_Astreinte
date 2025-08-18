const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api';

async function assignUsersToServices() {
  console.log('🔧 Assigning Users to Services and Secteurs...\n');

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
      
      // Get all services for mapping
      console.log('\n3️⃣ Getting all services...');
      const servicesResponse = await axios.get(`${BASE_URL}/org/services`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      // Create a mapping of service codes to service IDs
      const serviceMap = {};
      servicesResponse.data.data.forEach(service => {
        serviceMap[service.code] = service._id;
      });
      
      // Get all secteurs for mapping
      console.log('\n4️⃣ Getting all secteurs...');
      const secteursResponse = await axios.get(`${BASE_URL}/org/secteurs`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      // Create a mapping of secteur codes to secteur IDs
      const secteurMap = {};
      secteursResponse.data.data.forEach(secteur => {
        secteurMap[secteur.code] = secteur._id;
      });
      
      console.log('\n5️⃣ Assigning users to services and secteurs...');
      
      // Define user assignments based on email patterns
      const userAssignments = [
        // Chef Services
        {
          email: 'chef.cas-ext-for@ocp.ma',
          service: 'CAS-EXT-FOR',
          secteur: 'CAS-EXT'
        },
        {
          email: 'chef.cas-trt-prod-u1@ocp.ma',
          service: 'CAS-TRT-PROD-U1',
          secteur: 'CAS-TRT'
        },
        {
          email: 'chef.jlf-trt-prod-u1@ocp.ma',
          service: 'JLF-TRT-PROD-U1',
          secteur: 'JLF-TRT'
        },
        {
          email: 'chef.jlf-mnt-elec@ocp.ma',
          service: 'JLF-MNT-ELEC',
          secteur: 'JLF-MNT'
        },
        
        // Collaborateurs
        {
          email: 'collab1.cas-ext-for@ocp.ma',
          service: 'CAS-EXT-FOR',
          secteur: 'CAS-EXT'
        },
        {
          email: 'collab1.cas-trt-prod-u1@ocp.ma',
          service: 'CAS-TRT-PROD-U1',
          secteur: 'CAS-TRT'
        },
        {
          email: 'collab2.cas-trt-prod-u1@ocp.ma',
          service: 'CAS-TRT-PROD-U1',
          secteur: 'CAS-TRT'
        },
        {
          email: 'collab1.jlf-trt-prod-u1@ocp.ma',
          service: 'JLF-TRT-PROD-U1',
          secteur: 'JLF-TRT'
        },
        {
          email: 'collab1.jlf-mnt-elec@ocp.ma',
          service: 'JLF-MNT-ELEC',
          secteur: 'JLF-MNT'
        },
        
        // Chefs Secteur
        {
          email: 'chef.cas-ext@ocp.ma',
          secteur: 'CAS-EXT'
        },
        {
          email: 'chef.cas-trt@ocp.ma',
          secteur: 'CAS-TRT'
        },
        {
          email: 'chef.jlf-trt@ocp.ma',
          secteur: 'JLF-TRT'
        },
        {
          email: 'chef.jlf-mnt@ocp.ma',
          secteur: 'JLF-MNT'
        },
        
        // Ingénieurs
        {
          email: 'ing.cas-ext@ocp.ma',
          secteur: 'CAS-EXT'
        },
        {
          email: 'ing.cas-trt@ocp.ma',
          secteur: 'CAS-TRT'
        },
        {
          email: 'ing.jlf-trt@ocp.ma',
          secteur: 'JLF-TRT'
        },
        {
          email: 'ing.jlf-mnt@ocp.ma',
          secteur: 'JLF-MNT'
        }
      ];
      
      // Update each user
      for (const assignment of userAssignments) {
        const user = usersResponse.data.data.find(u => u.email === assignment.email);
        if (user) {
          console.log(`\n🔄 Updating ${assignment.email}...`);
          console.log(`   User ID: ${user.id}`);
          
          const updateData = {};
          if (assignment.service && serviceMap[assignment.service]) {
            updateData.service = serviceMap[assignment.service];
            console.log(`   Service: ${assignment.service} (${serviceMap[assignment.service]})`);
          }
          if (assignment.secteur && secteurMap[assignment.secteur]) {
            updateData.secteur = secteurMap[assignment.secteur];
            console.log(`   Secteur: ${assignment.secteur} (${secteurMap[assignment.secteur]})`);
          }
          
          if (Object.keys(updateData).length > 0) {
            try {
              const updateResponse = await axios.put(`${BASE_URL}/users/${user.id}`, updateData, {
                headers: { Authorization: `Bearer ${adminToken}` }
              });
              
              if (updateResponse.data.success) {
                console.log(`   ✅ Updated successfully`);
              } else {
                console.log(`   ❌ Update failed: ${updateResponse.data.message}`);
              }
            } catch (error) {
              console.log(`   ❌ Update error: ${error.response?.data?.message || error.message}`);
            }
          }
        } else {
          console.log(`\n⚠️ User not found: ${assignment.email}`);
        }
      }
      
      console.log('\n🎉 User assignment completed!');
      
    } else {
      console.log('❌ Admin login failed:', adminLoginResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Assignment failed:', error.response?.data || error.message);
  }
}

assignUsersToServices();
