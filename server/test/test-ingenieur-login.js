import fetch from 'node-fetch';

const testLogin = async () => {
  try {
    console.log('🧪 Testing login with ingenieur user...');
    
    const response = await fetch('http://localhost:5050/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'm.tazi@ocp.ma',
        password: 'Ing2024!'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('👤 User data:');
      console.log(JSON.stringify(data.data.user, null, 2));
      
      if (data.data.user.address) {
        console.log('\n🏠 Address field found:', data.data.user.address);
      } else {
        console.log('\n❌ Address field missing');
      }
    } else {
      console.log('❌ Login failed:', data);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testLogin();
