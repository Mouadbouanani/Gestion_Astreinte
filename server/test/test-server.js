import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configuration des variables d'environnement
dotenv.config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware de base
app.use(express.json());

// Test de connexion MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gestion_astreinte';
    console.log('🔗 Connecting to MongoDB:', mongoUri);
    
    await mongoose.connect(mongoUri);
    
    console.log('✅ MongoDB connected successfully!');
    console.log(`📍 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
    return mongoose.connection;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

// Route de test
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'OCP Astreinte API - Test Server',
    timestamp: new Date().toISOString(),
    database: {
      connected: mongoose.connection.readyState === 1,
      name: mongoose.connection.name,
      host: mongoose.connection.host
    }
  });
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Test de création d'utilisateur simple
app.post('/test-user', async (req, res) => {
  try {
    // Schéma simple pour test
    const testUserSchema = new mongoose.Schema({
      name: String,
      email: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    const TestUser = mongoose.model('TestUser', testUserSchema);
    
    const user = new TestUser({
      name: 'Test User',
      email: 'test@ocp.ma'
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Test user created successfully',
      user: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating test user',
      error: error.message
    });
  }
});

// Démarrage du serveur
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Test Server started on port ${PORT}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('\n📋 Available endpoints:');
      console.log('  GET  /        - Server info');
      console.log('  GET  /health  - Health check');
      console.log('  POST /test-user - Create test user');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
