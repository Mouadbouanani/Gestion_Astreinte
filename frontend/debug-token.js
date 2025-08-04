// Debug script to test token functionality
// Run this in the browser console

console.log('🔍 Token Debug Script');

// Get token from localStorage
const token = localStorage.getItem('ocp_token');
console.log('Token from localStorage:', token ? `${token.substring(0, 50)}...` : 'No token');

if (token) {
  try {
    // Decode token without verification
    const parts = token.split('.');
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    
    console.log('Token Header:', header);
    console.log('Token Payload:', {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName,
      iat: new Date(payload.iat * 1000).toISOString(),
      exp: new Date(payload.exp * 1000).toISOString(),
      isExpired: payload.exp < Math.floor(Date.now() / 1000)
    });
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - now;
    console.log('Time until expiry:', Math.floor(timeUntilExpiry / 60), 'minutes');
    
  } catch (error) {
    console.error('Error decoding token:', error);
  }
}

// Test API call
async function testApiCall() {
  try {
    const response = await fetch('http://localhost:5050/api/org/sites', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response status:', response.status);
    const data = await response.json();
    console.log('API Response data:', data);
    
  } catch (error) {
    console.error('API call failed:', error);
  }
}

// Test the API call
if (token) {
  testApiCall();
} 