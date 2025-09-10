// Configuration des variables d'environnement FIRST
import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

import express from 'express';
import cors from 'cors';
import connectDB from './db/connection.js';
import User from './models/User.js';
import Site from './models/Site.js';
import Secteur from './models/Secteur.js';
import Service from './models/Service.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

// Import route modules
import organizationalRoutes from './routes/organizational.js';
import secteursServicesRoutes from './routes/secteurs-services.js';
import authJwtRoutes from './routes/auth-jwt.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import holidayRoutes from './routes/holidayRoutes.js';
import indisponibiliteRoutes from './routes/indisponibilites.js';
import panneRoutes from './routes/pannes.js';
import { flexibleAuth } from './middleware/auth-mock.js'; // Import flexibleAuth
const app = express();
const PORT = process.env.PORT || 5050;

// Middleware de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configuration CORS pour permettre localhost et 127.0.0.1
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware de logging simple
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'OCP Astreinte API is running'
  });
});

// Connexion à MongoDB
const startServer = async () => {
  try {
    await connectDB();
    console.log(' Base de données connectée avec succès');

    // Démarrer le serveur après la connexion DB
    app.listen(PORT, () => {
      console.log(` Serveur OCP Astreinte démarré sur le port ${PORT}`);
      console.log(` URL: http://localhost:${PORT}`);
      console.log(` Environnement: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error(' Erreur de connexion à la base de données:', error);
    process.exit(1);
  }
};

// Routes de base
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Serveur OCP Astreinte opérationnel',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api/holidays', holidayRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Gestion des Astreintes OCP',
    version: '1.0.0',
    status: 'running'
  });
});

// Route de test pour vérifier MongoDB
app.get('/test-db', async (req, res) => {
  try {
    const mongoose = await import('mongoose');
    res.json({
      success: true,
      database: {
        connected: mongoose.default.connection.readyState === 1,
        name: mongoose.default.connection.name,
        host: mongoose.default.connection.host
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur de test base de données',
      error: error.message
    });
  }
});

// Authentication Routes
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

    // Find user with password (explicitly select it)
    const user = await User.findOne({ email }).select('+password').populate('site');
    console.log(' User found:', user ? 'Yes' : 'No');
    console.log(' Password field exists:', user?.password ? 'Yes' : 'No');

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
    console.log('🔍 Comparing passwords...');
    console.log('📝 Input password length:', password.length);
    console.log('🔒 Stored password length:', user.password ? user.password.length : 'undefined');

    if (!user.password) {
      console.log('❌ No password stored for user');
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔑 Password comparison result:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Update last login without validation
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() }, { validateBeforeSave: false });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'ocp_astreinte_secret_key_2024',
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful for:', email);

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone,
          address: user.address || null,
          role: user.role,
          site: user.site?.name || null,
          secteur: user.secteur?.name || null,
          service: user.service?.name || null,
          siteCode: user.site?.code || null,
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

// Get current user information
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ocp_astreinte_secret_key_2024');

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
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone,
          address: user.address || null,
          role: user.role,
          site: {
            id: user.site?._id,
            name: user.site?.name,
            code: user.site?.code
          },
          secteur: user.secteur?.name || null,
          service: user.service?.name || null,
          siteCode: user.site?.code || null,
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

// Get users list
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().populate('site').limit(20);
    res.json({
      success: true,
      count: users.length,
      data: users.map(user => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        address: user.address || null,
        role: user.role,
        site: user.site?.name,
        secteur: user.secteur?.name || null,
        service: user.service?.name || null,
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

// Get dashboard statistics
app.get('/api/dashboard/stats', flexibleAuth, async (req, res) => {
  try {
    // Get counts from database
    const totalSites = await Site.countDocuments({ isActive: true });
    const totalSecteurs = await Secteur.countDocuments({ isActive: true });
    const totalServices = await Service.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ isActive: true });
    const activeUsers = await User.countDocuments({ isActive: true });

    // Get users by role
    const usersByRole = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to Record format
    const usersByRoleRecord = {};
    usersByRole.forEach(item => {
      usersByRoleRecord[item._id] = item.count;
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await User.find({
      lastLogin: { $gte: sevenDaysAgo }
    })
    .select('firstName lastName role lastLogin')
    .sort({ lastLogin: -1 })
    .limit(5);

    const stats = {
      totalSites,
      totalSecteurs,
      totalServices,
      totalUsers,
      activeUsers,
      usersByRole: usersByRoleRecord,
      recentActivity: recentActivity.map(user => ({
        id: user._id,
        type: 'login',
        user: `${user.firstName} ${user.lastName}`,
        target: 'Dashboard',
        description: `${user.firstName} ${user.lastName} (${user.role}) s'est connecté`,
        timestamp: user.lastLogin
      }))
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération statistiques dashboard',
      error: error.message
    });
  }
});

// Get sites list
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

// ========================================
// ORGANIZATIONAL STRUCTURE MANAGEMENT
// ========================================

// SITES MANAGEMENT
// Get all sites with hierarchical data
app.get('/api/sites/hierarchy', async (req, res) => {
  try {
    const sites = await Site.find({ isActive: true })
      .sort({ name: 1 });

    const sitesWithHierarchy = await Promise.all(
      sites.map(async (site) => {
        const secteurs = await Secteur.find({ site: site._id, isActive: true })
          .sort({ name: 1 });

        const secteursWithServices = await Promise.all(
          secteurs.map(async (secteur) => {
            const services = await Service.find({ secteur: secteur._id, isActive: true })
              .sort({ name: 1 });

            const userCounts = {
              chefSecteur: await User.countDocuments({ secteur: secteur._id, role: 'chef_secteur', isActive: true }),
              ingenieurs: await User.countDocuments({ secteur: secteur._id, role: 'ingenieur', isActive: true }),
              chefsService: await User.countDocuments({ secteur: secteur._id, role: 'chef_service', isActive: true }),
              collaborateurs: await User.countDocuments({ secteur: secteur._id, role: 'collaborateur', isActive: true })
            };

            return {
              id: secteur._id,
              name: secteur.name,
              code: secteur.code,
              userCounts,
              services: services.map(service => ({
                id: service._id,
                name: service.name,
                code: service.code,
                userCount: 0 // Will be populated later
              }))
            };
          })
        );

        return {
          id: site._id,
          name: site.name,
          code: site.code,
          address: site.address,
          totalUsers: await User.countDocuments({ site: site._id, isActive: true }),
          secteurs: secteursWithServices
        };
      })
    );

    res.json({
      success: true,
      data: sitesWithHierarchy
    });

  } catch (error) {
    console.error('❌ Error getting sites hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération hiérarchie sites'
    });
  }
});

// Create new site
app.post('/api/sites', async (req, res) => {
  try {
    const { name, code, address } = req.body;

    // Validation
    if (!name || !code || !address) {
      return res.status(400).json({
        success: false,
        message: 'Nom, code et adresse requis'
      });
    }

    // Check if code already exists
    const existingSite = await Site.findOne({ code: code.toUpperCase() });
    if (existingSite) {
      return res.status(400).json({
        success: false,
        message: 'Code site déjà existant'
      });
    }

    const site = new Site({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      address: address.trim(),
      isActive: true
    });

    await site.save();

    res.status(201).json({
      success: true,
      message: 'Site créé avec succès',
      data: site
    });

  } catch (error) {
    console.error('❌ Error creating site:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur création site'
    });
  }
});

// Update site
app.put('/api/sites/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, address, isActive } = req.body;

    const site = await Site.findById(id);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site introuvable'
      });
    }

    // Check if new code conflicts with existing sites
    if (code && code !== site.code) {
      const existingSite = await Site.findOne({
        code: code.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingSite) {
        return res.status(400).json({
          success: false,
          message: 'Code site déjà existant'
        });
      }
    }

    // Update fields
    if (name) site.name = name.trim();
    if (code) site.code = code.toUpperCase().trim();
    if (address) site.address = address.trim();
    if (typeof isActive === 'boolean') site.isActive = isActive;

    await site.save();

    res.json({
      success: true,
      message: 'Site mis à jour avec succès',
      data: site
    });

  } catch (error) {
    console.error('❌ Error updating site:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur mise à jour site'
    });
  }
});

// Delete site (soft delete)
app.delete('/api/sites/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const site = await Site.findById(id);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site introuvable'
      });
    }

    // Check if site has active users
    const activeUsers = await User.countDocuments({ site: id, isActive: true });
    if (activeUsers > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer: ${activeUsers} utilisateur(s) actif(s) assigné(s)`
      });
    }

    // Soft delete
    site.isActive = false;
    await site.save();

    // Also deactivate related secteurs and services
    await Secteur.updateMany({ site: id }, { isActive: false });
    const secteurs = await Secteur.find({ site: id });
    const secteurIds = secteurs.map(s => s._id);
    await Service.updateMany({ secteur: { $in: secteurIds } }, { isActive: false });

    res.json({
      success: true,
      message: 'Site désactivé avec succès'
    });

  } catch (error) {
    console.error('❌ Error deleting site:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur suppression site'
    });
  }
});

// SECTEURS MANAGEMENT
// Get secteurs by site
app.get('/api/sites/:siteId/secteurs', async (req, res) => {
  try {
    const { siteId } = req.params;

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site introuvable'
      });
    }

    const secteurs = await Secteur.find({ site: siteId, isActive: true })
      .populate('site', 'name code')
      .sort({ name: 1 });

    const secteursWithData = await Promise.all(
      secteurs.map(async (secteur) => {
        const services = await Service.find({ secteur: secteur._id, isActive: true });
        const users = await User.find({ secteur: secteur._id, isActive: true })
          .select('firstName lastName role');

        return {
          id: secteur._id,
          name: secteur.name,
          code: secteur.code,
          site: secteur.site,
          servicesCount: services.length,
          usersCount: users.length,
          users: users.map(u => ({
            id: u._id,
            name: `${u.firstName} ${u.lastName}`,
            role: u.role
          })),
          createdAt: secteur.createdAt
        };
      })
    );

    res.json({
      success: true,
      data: secteursWithData
    });

  } catch (error) {
    console.error('❌ Error getting secteurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération secteurs'
    });
  }
});

// Create new secteur
app.post('/api/sites/:siteId/secteurs', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { name, code } = req.body;

    // Validation
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Nom et code requis'
      });
    }

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site introuvable'
      });
    }

    // Check if code already exists for this site
    const existingSecteur = await Secteur.findOne({
      site: siteId,
      code: code.toUpperCase()
    });
    if (existingSecteur) {
      return res.status(400).json({
        success: false,
        message: 'Code secteur déjà existant pour ce site'
      });
    }

    const secteur = new Secteur({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      site: siteId,
      isActive: true
    });

    await secteur.save();
    await secteur.populate('site', 'name code');

    res.status(201).json({
      success: true,
      message: 'Secteur créé avec succès',
      data: secteur
    });

  } catch (error) {
    console.error('❌ Error creating secteur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur création secteur'
    });
  }
});

// Update secteur
app.put('/api/secteurs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, isActive } = req.body;

    const secteur = await Secteur.findById(id);
    if (!secteur) {
      return res.status(404).json({
        success: false,
        message: 'Secteur introuvable'
      });
    }

    // Check if new code conflicts
    if (code && code !== secteur.code) {
      const existingSecteur = await Secteur.findOne({
        site: secteur.site,
        code: code.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingSecteur) {
        return res.status(400).json({
          success: false,
          message: 'Code secteur déjà existant pour ce site'
        });
      }
    }

    // Update fields
    if (name) secteur.name = name.trim();
    if (code) secteur.code = code.toUpperCase().trim();
    if (typeof isActive === 'boolean') secteur.isActive = isActive;

    await secteur.save();
    await secteur.populate('site', 'name code');

    res.json({
      success: true,
      message: 'Secteur mis à jour avec succès',
      data: secteur
    });

  } catch (error) {
    console.error('❌ Error updating secteur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur mise à jour secteur'
    });
  }
});

// Delete secteur (soft delete)
app.delete('/api/secteurs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const secteur = await Secteur.findById(id);
    if (!secteur) {
      return res.status(404).json({
        success: false,
        message: 'Secteur introuvable'
      });
    }

    // Check if secteur has active users
    const activeUsers = await User.countDocuments({ secteur: id, isActive: true });
    if (activeUsers > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer: ${activeUsers} utilisateur(s) actif(s) assigné(s)`
      });
    }

    // Soft delete
    secteur.isActive = false;
    await secteur.save();

    // Also deactivate related services
    await Service.updateMany({ secteur: id }, { isActive: false });

    res.json({
      success: true,
      message: 'Secteur désactivé avec succès'
    });

  } catch (error) {
    console.error('❌ Error deleting secteur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur suppression secteur'
    });
  }
});

// Use organizational structure routes
app.use('/api/org', organizationalRoutes);
app.use('/api/org', secteursServicesRoutes);

// Use authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/auth-jwt', authJwtRoutes);

// Use user management routes
app.use('/api/users', userRoutes);

// Unavailabilities
app.use('/api/unavailability', indisponibiliteRoutes);

// Planning routes
import planningRoutes from './routes/plannings.js';
app.use('/api/plannings', flexibleAuth, planningRoutes);

// Pannes routes
app.use('/api/pannes', panneRoutes);

// Middleware 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Démarrer le serveur
startServer();
