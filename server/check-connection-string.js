import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

console.log('🔍 MongoDB Atlas Connection String Analysis');
console.log('==========================================');

const mongoUri = process.env.MONGO_URI || process.env.ATLAS_URI;

if (!mongoUri) {
  console.error('❌ No MongoDB URI found in environment variables');
  process.exit(1);
}

// Parse the connection string
try {
  const url = new URL(mongoUri);
  
  console.log('📊 Connection String Components:');
  console.log(`   Protocol: ${url.protocol}`);
  console.log(`   Username: ${url.username}`);
  console.log(`   Password: ${url.password ? '****' : 'NOT SET'}`);
  console.log(`   Host: ${url.hostname}`);
  console.log(`   Database: ${url.pathname.substring(1)}`);
  console.log(`   Search Params: ${url.search}`);
  
  // Check for common issues
  console.log('\n🔍 Checking for common issues:');
  
  if (!url.username) {
    console.log('❌ Username is missing');
  } else {
    console.log('✅ Username is present');
  }
  
  if (!url.password) {
    console.log('❌ Password is missing');
  } else {
    console.log('✅ Password is present');
  }
  
  // Check if password needs URL encoding
  const originalPassword = url.password;
  const encodedPassword = encodeURIComponent(originalPassword);
  
  if (originalPassword !== encodedPassword) {
    console.log('⚠️  Password contains special characters that may need encoding');
    console.log(`   Original: ${originalPassword}`);
    console.log(`   Encoded: ${encodedPassword}`);
    
    // Generate corrected connection string
    const correctedUri = mongoUri.replace(
      `://${url.username}:${originalPassword}@`,
      `://${url.username}:${encodedPassword}@`
    );
    
    console.log('\n🔧 Suggested corrected connection string:');
    console.log(correctedUri.replace(/:[^:@]*@/, ':****@'));
  } else {
    console.log('✅ Password doesn\'t contain special characters');
  }
  
  // Check database name
  const dbName = url.pathname.substring(1);
  if (!dbName) {
    console.log('⚠️  No database name specified in connection string');
    console.log('   Consider adding /gestion_astreinte to your connection string');
  } else {
    console.log(`✅ Database name specified: ${dbName}`);
  }
  
} catch (error) {
  console.error('❌ Error parsing connection string:', error.message);
}

console.log('\n💡 Next steps to troubleshoot:');
console.log('1. Verify your MongoDB Atlas credentials in the web interface');
console.log('2. Check that your IP address is whitelisted (or use 0.0.0.0/0 for testing)');
console.log('3. Ensure the database user has readWrite permissions');
console.log('4. Try connecting with MongoDB Compass using the same credentials');
