// Test script for token refresh functionality
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5050/api';

async function testRefreshToken() {
  try {
    console.log('🧪 Testing token refresh functionality...');
    
    // First, let's try to refresh without a token
    console.log('\n1. Testing refresh without token...');
    const response1 = await fetch(`${API_BASE_URL}/auth-jwt/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data1 = await response1.json();
    console.log('Response:', data1);
    
    // Now let's try with an invalid token
    console.log('\n2. Testing refresh with invalid token...');
    const response2 = await fetch(`${API_BASE_URL}/auth-jwt/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid.token.here'
      }
    });
    
    const data2 = await response2.json();
    console.log('Response:', data2);
    
    // Test with a valid token (you'll need to get one from login first)
    console.log('\n3. Testing refresh with valid token...');
    console.log('Note: You need to login first to get a valid token');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRefreshToken(); 