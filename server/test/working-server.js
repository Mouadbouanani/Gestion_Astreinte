import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Site from '../models/Site.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authRoutes from '../routes/auth.js';
import cookieParser from 'cookie-parser';

console.log('🚀 Starting OCP Astreinte Server...');

// Load environment variables
dotenv.config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 5050;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

console.log('📦 Express app configured');

// Add auth routes
app.use('/api/auth', authRoutes);

// Connect to MongoDB
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

// Basic routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'OCP Astreinte API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      login: '/api/auth/login',
      users: '/api/users',
      sites: '/api/sites'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Test routes for data
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().populate('site secteur service').limit(10);
    res.json({
      success: true,
      count: users.length,
      data: users.map(user => ({
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        site: user.site?.name,
        secteur: user.secteur?.name,
        service: user.service?.name
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur récupération utilisateurs',
      error: error.message
    });
  }
});

app.get('/api/sites', async (req, res) => {
  try {
    const sites = await Site.find();
    res.json({
      success: true,
      count: sites.length,
      data: sites.map(site => ({
        id: site._id,
        name: site.name,
        code: site.code,
        address: site.address,
        isActive: site.isActive
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur récupération sites',
      error: error.message
    });
  }
});

// Simple login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }
    
    // Find user with password
    const user = await User.findOne({ email }).select('+password').populate('site secteur service');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'ocp_secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user._id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          site: user.site?.name,
          secteur: user.secteur?.name,
          service: user.service?.name
        },
        token
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Create admin user if not exists
app.post('/api/create-admin', async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@ocp.ma' });
    
    if (existingAdmin) {
      return res.json({
        success: true,
        message: 'Admin already exists',
        email: 'admin@ocp.ma'
      });
    }
    
    // Get first site
    const firstSite = await Site.findOne();
    if (!firstSite) {
      return res.status(400).json({
        success: false,
        message: 'No sites found. Please seed the database first.'
      });
    }
    
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    
    const admin = new User({
      firstName: 'Admin',
      lastName: 'OCP',
      email: 'admin@ocp.ma',
      phone: '+212661234567',
      password: hashedPassword,
      role: 'admin',
      site: firstSite._id,
      isActive: true
    });
    
    await admin.save();
    
    res.json({
      success: true,
      message: 'Admin user created successfully',
      credentials: {
        email: 'admin@ocp.ma',
        password: 'Admin123!'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating admin',
      error: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log('✅ Server started successfully!');
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('\n📋 Available endpoints:');
      console.log('  GET  /              - Server info');
      console.log('  GET  /health        - Health check');
      console.log('  GET  /api/users     - List users');
      console.log('  GET  /api/sites     - List sites');
      console.log('  POST /api/auth/login - Login');
      console.log('  POST /api/create-admin - Create admin user');
      console.log('\n🔑 Test credentials:');
      console.log('  Email: admin@ocp.ma');
      console.log('  Password: Admin123!');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
