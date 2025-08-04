import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configuration des variables d'environnement
dotenv.config({ path: './config.env' });

const testSimpleSeed = async () => {
  try {
    console.log('🚀 Testing simple database operations...');
    
    // Connexion à MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.ATLAS_URI || 'mongodb://localhost:27017/gestion_astreinte';
    console.log('🔗 Connecting to:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Database connected successfully');
    
    // Test simple - créer un document de test
    const TestCollection = mongoose.model('Test', new mongoose.Schema({
      name: String,
      value: Number,
      createdAt: { type: Date, default: Date.now }
    }));
    
    console.log('📝 Creating test document...');
    const testDoc = new TestCollection({
      name: 'Test Document',
      value: 42
    });
    
    await testDoc.save();
    console.log('✅ Test document created successfully');
    
    // Vérifier que le document existe
    const count = await TestCollection.countDocuments();
    console.log(`📊 Test documents in database: ${count}`);
    
    // Nettoyer
    await TestCollection.deleteMany({});
    console.log('🧹 Test documents cleaned up');
    
    console.log('✅ Simple database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Simple database test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

testSimpleSeed(); 