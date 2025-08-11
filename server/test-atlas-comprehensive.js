import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

console.log('🚀 Comprehensive MongoDB Atlas Connection Test');
console.log('==============================================');

const testConnections = async () => {
  const connectionStrings = [
    {
      name: 'Primary Connection String',
      uri: process.env.MONGO_URI
    },
    {
      name: 'Alternative Connection String',
      uri: process.env.MONGO_URI_ALT
    },
    {
      name: 'Atlas URI',
      uri: process.env.ATLAS_URI
    }
  ];

  for (const { name, uri } of connectionStrings) {
    if (!uri) {
      console.log(`⏭️  Skipping ${name} - not configured`);
      continue;
    }

    console.log(`\n🧪 Testing: ${name}`);
    console.log('─'.repeat(50));
    console.log(`📡 URI: ${uri.replace(/:[^:@]*@/, ':****@')}`);

    try {
      // Close any existing connection
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }

      console.log('🔗 Attempting connection...');
      
      // Try connection with timeout
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000, // 10 second timeout
        connectTimeoutMS: 10000,
      });

      console.log('✅ Connection successful!');
      console.log(`📊 Database: ${mongoose.connection.name || 'default'}`);
      console.log(`🏠 Host: ${mongoose.connection.host}`);
      
      // Test basic operation
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`📁 Collections: ${collections.length}`);
      
      // Test write operation
      const testCollection = mongoose.connection.db.collection('connection_test');
      const testDoc = { test: true, timestamp: new Date() };
      const result = await testCollection.insertOne(testDoc);
      console.log(`✍️  Write test: ${result.insertedId ? 'SUCCESS' : 'FAILED'}`);
      
      // Clean up
      await testCollection.deleteOne({ _id: result.insertedId });
      
      console.log('🎉 All tests passed for this connection!');
      break; // Success, no need to try other connections
      
    } catch (error) {
      console.log('❌ Connection failed');
      console.log(`Error: ${error.message}`);
      
      // Provide specific troubleshooting based on error type
      if (error.message.includes('authentication failed')) {
        console.log('💡 Authentication issue - check username/password and database user permissions');
      } else if (error.message.includes('ENOTFOUND')) {
        console.log('💡 DNS/Network issue - check internet connection and cluster hostname');
      } else if (error.message.includes('timeout')) {
        console.log('💡 Timeout issue - check network access and IP whitelist');
      }
    }
  }

  // Final cleanup
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

// Additional diagnostic function
const runDiagnostics = () => {
  console.log('\n🔍 Environment Diagnostics');
  console.log('==========================');
  console.log(`Node.js version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Architecture: ${process.arch}`);
  
  // Check environment variables
  const requiredVars = ['MONGO_URI', 'ATLAS_URI'];
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`${varName}: ${value ? '✅ Set' : '❌ Not set'}`);
  });
};

// Run tests
const main = async () => {
  runDiagnostics();
  await testConnections();
  
  console.log('\n📋 Troubleshooting Checklist:');
  console.log('1. ✅ Check MongoDB Atlas Network Access (IP Whitelist)');
  console.log('2. ✅ Verify Database Access (User permissions)');
  console.log('3. ✅ Confirm cluster is running and accessible');
  console.log('4. ✅ Test with MongoDB Compass using same credentials');
  console.log('5. ✅ Check if firewall/antivirus is blocking connections');
  
  process.exit(0);
};

main().catch(console.error);
