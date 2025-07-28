import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

console.log(' Starting minimal server...');

// Load environment variables
dotenv.config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 5050;

// Basic middleware
app.use(express.json());

console.log(' Express app created');

// Test route
app.get('/', (req, res) => {
  console.log(' Root route accessed');
  res.json({
    success: true,
    message: 'OCP Astreinte API - Minimal Server',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  console.log(' Health check accessed');
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// MongoDB connection test
app.get('/test-mongo', async (req, res) => {
  try {
    console.log(' Testing MongoDB connection...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gestion_astreinte';
    
    if (mongoose.connection.readyState === 0) {
      console.log(' Connecting to MongoDB:', mongoUri);
      await mongoose.connect(mongoUri);
    }
    
    res.json({
      success: true,
      message: 'MongoDB connection successful',
      database: {
        connected: mongoose.connection.readyState === 1,
        name: mongoose.connection.name,
        host: mongoose.connection.host
      }
    });
  } catch (error) {
    console.error(' MongoDB error:', error);
    res.status(500).json({
      success: false,
      message: 'MongoDB connection failed',
      error: error.message
    });
  }
});

// Start server
console.log('🎯 Starting server on port', PORT);

app.listen(PORT, () => {
  console.log(' Server started successfully!');
  console.log(` URL: http://localhost:${PORT}`);
  console.log(' Available routes:');
  console.log('  GET / - Server info');
  console.log('  GET /health - Health check');
  console.log('  GET /test-mongo - Test MongoDB connection');
});

console.log('🏁 Server setup complete');
