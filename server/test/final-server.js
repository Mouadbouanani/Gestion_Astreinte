import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

console.log('🚀 Starting Final OCP Astreinte Server...');

// Load environment variables
dotenv.config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 5051;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

// Simple User Schema (inline)
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['admin', 'chef_secteur', 'ingenieur', 'chef_service', 'collaborateur']
  },
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date
}, { timestamps: true });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Simple Site Schema
const siteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Site = mongoose.model('Site', siteSchema);

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

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'OCP Astreinte API - Final Version',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      login: '/api/auth/login',
      users: '/api/users',
      sites: '/api/sites',
      'create-admin': '/api/create-admin'
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

// LOGIN ENDPOINT - Simplified and Working
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body);
    
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }
    
    // Find user
    const user = await User.findOne({ email }).populate('site');
    console.log('👤 User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé'
      });
    }
    
    // Check password
    console.log('🔍 Comparing passwords:');
    console.log('📝 Input password:', password);
    console.log('🔒 Stored hash:', user.password);

    const isPasswordValid = await user.comparePassword(password);
    console.log('🔑 Password comparison result:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'ocp_secret_key_2024',
      { expiresIn: '24h' }
    );
    
    console.log('✅ Login successful for:', email);
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user._id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          site: user.site?.name || null,
          lastLogin: user.lastLogin
        },
        token,
        expiresIn: '24h'
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

// Get users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().populate('site').limit(10);
    res.json({
      success: true,
      count: users.length,
      data: users.map(user => ({
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        site: user.site?.name,
        isActive: user.isActive,
        lastLogin: user.lastLogin
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

// Get sites
app.get('/api/sites', async (req, res) => {
  try {
    const sites = await Site.find();
    res.json({
      success: true,
      count: sites.length,
      data: sites
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur récupération sites',
      error: error.message
    });
  }
});

// Create admin user
app.post('/api/create-admin', async (req, res) => {
  try {
    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'admin@ocp.ma' });

    if (existingAdmin) {
      return res.json({
        success: true,
        message: 'Admin already exists',
        credentials: {
          email: 'admin@ocp.ma',
          password: 'Admin123!'
        }
      });
    }

    // Create or get first site
    let site = await Site.findOne();
    if (!site) {
      site = new Site({
        name: 'Casablanca',
        code: 'CAS',
        address: 'Zone Industrielle Ain Sebaa, Casablanca, Maroc'
      });
      await site.save();
      console.log('🏭 Site created:', site.name);
    }

    // Hash password BEFORE saving
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    console.log('🔐 Password hashed for admin');

    // Create admin
    const admin = new User({
      firstName: 'Admin',
      lastName: 'OCP',
      email: 'admin@ocp.ma',
      phone: '+212661234567',
      password: hashedPassword, // Already hashed
      role: 'admin',
      site: site._id,
      isActive: true
    });

    await admin.save();
    console.log('👤 Admin created successfully with hashed password');

    res.json({
      success: true,
      message: 'Admin user created successfully',
      credentials: {
        email: 'admin@ocp.ma',
        password: 'Admin123!'
      }
    });

  } catch (error) {
    console.error('❌ Error creating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating admin',
      error: error.message
    });
  }
});

// Create real users with different roles
app.post('/api/seed-users', async (req, res) => {
  try {
    // Get or create site
    let site = await Site.findOne();
    if (!site) {
      site = new Site({
        name: 'Casablanca',
        code: 'CAS',
        address: 'Zone Industrielle Ain Sebaa, Casablanca, Maroc'
      });
      await site.save();
    }

    const usersToCreate = [
      {
        firstName: 'Ahmed',
        lastName: 'Benali',
        email: 'chef.secteur@ocp.ma',
        phone: '+212661234568',
        password: 'Chef123!',
        role: 'chef_secteur'
      },
      {
        firstName: 'Fatima',
        lastName: 'Alami',
        email: 'ingenieur@ocp.ma',
        phone: '+212661234569',
        password: 'Ing123!',
        role: 'ingenieur'
      },
      {
        firstName: 'Mohamed',
        lastName: 'Tazi',
        email: 'chef.service@ocp.ma',
        phone: '+212661234570',
        password: 'Service123!',
        role: 'chef_service'
      },
      {
        firstName: 'Aicha',
        lastName: 'Idrissi',
        email: 'collaborateur@ocp.ma',
        phone: '+212661234571',
        password: 'Collab123!',
        role: 'collaborateur'
      }
    ];

    const createdUsers = [];

    for (const userData of usersToCreate) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });

      if (!existingUser) {
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        // Create user
        const user = new User({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          password: hashedPassword,
          role: userData.role,
          site: site._id,
          isActive: true
        });

        await user.save();
        createdUsers.push({
          email: userData.email,
          password: userData.password,
          role: userData.role,
          name: `${userData.firstName} ${userData.lastName}`
        });

        console.log(`👤 Created ${userData.role}: ${userData.email}`);
      }
    }

    res.json({
      success: true,
      message: `${createdUsers.length} users created successfully`,
      users: createdUsers
    });

  } catch (error) {
    console.error('❌ Error creating users:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating users',
      error: error.message
    });
  }
});

// Get current user information (requires JWT token)
app.get('/api/auth/me', async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès requis'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ocp_secret_key_2024');

    // Get user from database
    const user = await User.findById(decoded.id).populate('site');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          site: {
            id: user.site?._id,
            name: user.site?.name,
            code: user.site?.code
          },
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }

    console.error('❌ Error getting user info:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Get users by role (requires admin token)
app.get('/api/users/by-role/:role', async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès requis'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ocp_secret_key_2024');

    // Check if user is admin
    const currentUser = await User.findById(decoded.id);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Droits administrateur requis'
      });
    }

    const { role } = req.params;
    const validRoles = ['admin', 'chef_secteur', 'ingenieur', 'chef_service', 'collaborateur'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide',
        validRoles
      });
    }

    const users = await User.find({ role, isActive: true }).populate('site');

    res.json({
      success: true,
      role,
      count: users.length,
      data: users.map(user => ({
        id: user._id,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        site: user.site?.name,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Error getting users by role:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl,
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /api/users',
      'GET /api/sites',
      'POST /api/auth/login',
      'POST /api/create-admin'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: error.message
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
      console.log('  POST /api/auth/login - Login (WORKING!)');
      console.log('  GET  /api/auth/me   - Get current user info (requires token)');
      console.log('  GET  /api/users/by-role/:role - Get users by role (admin only)');
      console.log('  POST /api/create-admin - Create admin user');
      console.log('  POST /api/seed-users - Create users with different roles');
      console.log('\n🔑 Test credentials:');
      console.log('  Email: admin@ocp.ma');
      console.log('  Password: Admin123!');
      console.log('\n📝 Login JSON:');
      console.log('  {"email":"admin@ocp.ma","password":"Admin123!"}');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
