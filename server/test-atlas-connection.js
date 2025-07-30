import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

console.log('🚀 Testing MongoDB Atlas Connection...');
console.log('=====================================');

const testConnection = async () => {
  try {
    // Get the connection string from environment
    const mongoUri = process.env.MONGO_URI || process.env.ATLAS_URI;
    
    if (!mongoUri) {
      throw new Error('No MongoDB URI found in environment variables');
    }

    console.log('📡 Connection URI:', mongoUri.replace(/:[^:@]*@/, ':****@')); // Hide password in logs
    
    // Connect to MongoDB Atlas
    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('📊 Connection Details:');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Ready State: ${mongoose.connection.readyState}`);
    
    // Test basic operations
    console.log('\n🧪 Testing basic database operations...');
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Collections found: ${collections.length}`);
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    // Test write operation
    console.log('\n✍️  Testing write operation...');
    const testCollection = mongoose.connection.db.collection('connection_test');
    const testDoc = {
      message: 'Atlas connection test successful',
      timestamp: new Date(),
      app: 'OCP Astreinte'
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log(`✅ Test document inserted with ID: ${insertResult.insertedId}`);
    
    // Test read operation
    console.log('\n📖 Testing read operation...');
    const foundDoc = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('✅ Test document retrieved:', foundDoc.message);
    
    // Clean up test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('🧹 Test document cleaned up');
    
    console.log('\n🎉 All tests passed! Your Atlas connection is working perfectly.');
    
  } catch (error) {
    console.error('❌ Connection test failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('\n💡 Troubleshooting tips:');
      console.error('   1. Check your username and password in the connection string');
      console.error('   2. Ensure your IP address is whitelisted in Atlas');
      console.error('   3. Verify your database user has proper permissions');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 Troubleshooting tips:');
      console.error('   1. Check your internet connection');
      console.error('   2. Verify the cluster hostname is correct');
      console.error('   3. Check if your network blocks MongoDB connections');
    }
    
  } finally {
    // Close connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('\n🔌 Connection closed');
    }
    process.exit(0);
  }
};

// Run the test
testConnection();
