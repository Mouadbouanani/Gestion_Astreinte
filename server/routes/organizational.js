import express from 'express';
import mongoose from 'mongoose';
import Site from '../models/Site.js';
import Secteur from '../models/Secteur.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import { authenticateToken, smartAuthorization } from '../middleware/jwt-auth.js';

const router = express.Router();

// ========================================
// SITES MANAGEMENT
// ========================================

// Get all sites with hierarchical data and statistics
router.get('/sites/hierarchy', async (req, res) => {
  try {
    const sites = await Site.find({ isActive: true }).sort({ name: 1 });

    const sitesWithHierarchy = await Promise.all(
      sites.map(async (site) => {
        // Get secteurs for this site
        const secteurs = await Secteur.find({ site: site._id, isActive: true })
          .sort({ name: 1 });

        // Get detailed secteur data with services and user counts
        const secteursWithServices = await Promise.all(
          secteurs.map(async (secteur) => {
            const services = await Service.find({ secteur: secteur._id, isActive: true })
              .sort({ name: 1 });

            // Get user counts by role for this secteur
            const userCounts = {
              chefSecteur: await User.countDocuments({ 
                secteur: secteur._id, 
                role: 'chef_secteur', 
                isActive: true 
              }),
              ingenieurs: await User.countDocuments({ 
                secteur: secteur._id, 
                role: 'ingenieur', 
                isActive: true 
              }),
              chefsService: await User.countDocuments({ 
                secteur: secteur._id, 
                role: 'chef_service', 
                isActive: true 
              }),
              collaborateurs: await User.countDocuments({ 
                secteur: secteur._id, 
                role: 'collaborateur', 
                isActive: true 
              })
            };

            // Get services with their user counts
            const servicesWithUsers = await Promise.all(
              services.map(async (service) => {
                const serviceUserCount = await User.countDocuments({
                  service: service._id,
                  isActive: true
                });

                return {
                  id: service._id,
                  name: service.name,
                  code: service.code,
                  userCount: serviceUserCount,
                  createdAt: service.createdAt
                };
              })
            );

            return {
              id: secteur._id,
              name: secteur.name,
              code: secteur.code,
              userCounts,
              totalUsers: Object.values(userCounts).reduce((sum, count) => sum + count, 0),
              servicesCount: services.length,
              services: servicesWithUsers,
              createdAt: secteur.createdAt
            };
          })
        );

        // Calculate site totals
        const totalUsers = await User.countDocuments({ site: site._id, isActive: true });
        const totalSecteurs = secteurs.length;
        const totalServices = secteursWithServices.reduce((sum, s) => sum + s.servicesCount, 0);

        return {
          id: site._id,
          name: site.name,
          code: site.code,
          address: site.address,
          statistics: {
            totalUsers,
            totalSecteurs,
            totalServices
          },
          secteurs: secteursWithServices,
          createdAt: site.createdAt
        };
      })
    );

    res.json({
      success: true,
      data: sitesWithHierarchy,
      summary: {
        totalSites: sitesWithHierarchy.length,
        totalUsers: sitesWithHierarchy.reduce((sum, site) => sum + site.statistics.totalUsers, 0),
        totalSecteurs: sitesWithHierarchy.reduce((sum, site) => sum + site.statistics.totalSecteurs, 0),
        totalServices: sitesWithHierarchy.reduce((sum, site) => sum + site.statistics.totalServices, 0)
      }
    });

  } catch (error) {
    console.error('❌ Error getting sites hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération hiérarchie organisationnelle',
      error: error.message
    });
  }
});

// Get all sites (simple list)
router.get('/sites', async (req, res) => {
  try {
    const sites = await Site.find({ isActive: true })
      .sort({ name: 1 })
      .select('_id name code address createdAt');

    // Add statistics for each site
    const sitesWithStats = await Promise.all(
      sites.map(async (site) => {
        const totalSecteurs = await Secteur.countDocuments({ site: site._id, isActive: true });
        const totalUsers = await User.countDocuments({ site: site._id, isActive: true });
        
        return {
          ...site.toObject(),
          statistics: {
            totalSecteurs,
            totalUsers
          }
        };
      })
    );

    res.json({
      success: true,
      count: sitesWithStats.length,
      data: sitesWithStats
    });

  } catch (error) {
    console.error('❌ Error getting sites:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération sites'
    });
  }
});

// Get single site with details
router.get('/sites/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const site = await Site.findById(id);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site introuvable'
      });
    }

    // Get site statistics
    const statistics = {
      totalUsers: await User.countDocuments({ site: id, isActive: true }),
      totalSecteurs: await Secteur.countDocuments({ site: id, isActive: true }),
      totalServices: await Service.countDocuments({ 
        secteur: { $in: await Secteur.find({ site: id }).select('_id') },
        isActive: true 
      }),
      usersByRole: {
        admin: await User.countDocuments({ site: id, role: 'admin', isActive: true }),
        chefSecteur: await User.countDocuments({ site: id, role: 'chef_secteur', isActive: true }),
        ingenieur: await User.countDocuments({ site: id, role: 'ingenieur', isActive: true }),
        chefService: await User.countDocuments({ site: id, role: 'chef_service', isActive: true }),
        collaborateur: await User.countDocuments({ site: id, role: 'collaborateur', isActive: true })
      }
    };

    res.json({
      success: true,
      data: {
        ...site.toObject(),
        statistics
      }
    });

  } catch (error) {
    console.error('❌ Error getting site:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération site'
    });
  }
});

// Create new site
router.post('/sites', async (req, res) => {
  try {
    const { name, code, address } = req.body;

    // Validation
    if (!name || !code || !address) {
      return res.status(400).json({
        success: false,
        message: 'Nom, code et adresse sont requis'
      });
    }

    // Validate code format (3-4 uppercase letters)
    if (!/^[A-Z]{3,4}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'Le code doit contenir 3-4 lettres majuscules'
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

    // Check if name already exists
    const existingName = await Site.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: 'Nom de site déjà existant'
      });
    }

    const site = new Site({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      address: address.trim(),
      isActive: true
    });

    await site.save();

    console.log(`✅ Site créé: ${site.name} (${site.code})`);

    res.status(201).json({
      success: true,
      message: 'Site créé avec succès',
      data: site
    });

  } catch (error) {
    console.error('❌ Error creating site:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur création site',
      error: error.message
    });
  }
});

// Update site
router.put('/sites/:id', async (req, res) => {
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

    // Validate and check conflicts
    if (code && code !== site.code) {
      if (!/^[A-Z]{3,4}$/.test(code)) {
        return res.status(400).json({
          success: false,
          message: 'Le code doit contenir 3-4 lettres majuscules'
        });
      }

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

    if (name && name !== site.name) {
      const existingName = await Site.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: id }
      });
      if (existingName) {
        return res.status(400).json({
          success: false,
          message: 'Nom de site déjà existant'
        });
      }
    }

    // Update fields
    if (name) site.name = name.trim();
    if (code) site.code = code.toUpperCase().trim();
    if (address) site.address = address.trim();
    if (typeof isActive === 'boolean') site.isActive = isActive;

    await site.save();

    console.log(`✅ Site mis à jour: ${site.name} (${site.code})`);

    res.json({
      success: true,
      message: 'Site mis à jour avec succès',
      data: site
    });

  } catch (error) {
    console.error('❌ Error updating site:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur mise à jour site',
      error: error.message
    });
  }
});

// Delete site (soft delete avec autorisation admin uniquement)
router.delete('/sites/:id', authenticateToken, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { id } = req.params;
    const user = req.user;

    // Log the request details for debugging
    console.log(`🗑️ Delete site request:`, {
      siteId: id,
      userId: user._id,
      userRole: user.role,
      userEmail: user.email,
      timestamp: new Date().toISOString()
    });

    // Verify admin role
    if (user.role !== 'admin') {
      console.log(`❌ Access denied: User ${user.email} (${user.role}) tried to delete site ${id}`);
      return res.status(403).json({
        success: false,
        message: 'Accès refusé: Seul l\'admin peut supprimer des sites',
        userRole: user.role,
        code: 'INSUFFICIENT_PERMISSIONS',
        details: {
          requiredRole: 'admin',
          currentRole: user.role,
          userId: user._id,
          userEmail: user.email
        }
      });
    }

    // Check if site exists
    const site = await Site.findById(id).session(session);
    if (!site) {
      console.log(`❌ Site not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Site introuvable',
        code: 'SITE_NOT_FOUND',
        details: {
          requestedSiteId: id,
          availableSites: await Site.find({ isActive: true }).distinct('_id')
        }
      });
    }

    // Check for active secteurs
    const activeSecteurs = await Secteur.countDocuments({
      site: id,
      isActive: true,
    });

    // Check for active users
    const activeUsers = await User.countDocuments({
      site: id,
      isActive: true,
    });

    if (activeSecteurs > 0 || activeUsers > 0) {
      console.log(`❌ Cannot delete site ${id}: ${activeSecteurs} secteurs, ${activeUsers} users active`);
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer le site: ${activeSecteurs} secteur(s) et ${activeUsers} utilisateur(s) actif(s)`,
        code: 'DEPENDENCIES_EXIST',
        details: { 
          secteurs: activeSecteurs, 
          users: activeUsers,
          siteId: id,
          siteName: site.name
        },
      });
    }

    // Soft delete site
    site.isActive = false;
    site.deletedAt = new Date();
    await site.save({ session });

    // Cascade soft delete to secteurs
    await Secteur.updateMany(
      { site: id },
      { isActive: false, deletedAt: new Date() },
      { session }
    );

    // Cascade soft delete to services
    await Service.updateMany(
      {
        secteur: {
          $in: await Secteur.find({ site: id }).distinct('_id'),
        },
      },
      { isActive: false, deletedAt: new Date() },
      { session }
    );

    // Log audit action (AuditLog model not implemented yet)
    console.log(`📝 Audit: Site ${site.name} (${site.code}) soft-deleted by ${user.email} at ${new Date().toISOString()}`);

    console.log(`✅ Site supprimé: ${site.name} (${site.code}) by ${user.email}`);

    await session.commitTransaction();
    res.json({
      success: true,
      message: 'Site supprimé avec succès',
      data: {
        site: {
          id: site._id,
          name: site.name,
          code: site.code,
          deletedAt: site.deletedAt,
        },
      },
    });
  } catch (error) {
    await session.abortTransaction();
    
    // Enhanced error handling with specific error types
    console.error('❌ Error deleting site:', {
      error: error.message,
      stack: error.stack,
      siteId: req.params.id,
      userId: req.user?._id,
      timestamp: new Date().toISOString()
    });

    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Données de site invalides',
        code: 'VALIDATION_ERROR',
        error: error.message,
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de site invalide',
        code: 'INVALID_ID',
        error: error.message,
        details: {
          providedId: req.params.id,
          expectedFormat: 'MongoDB ObjectId'
        }
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Conflit de données',
        code: 'DUPLICATE_ERROR',
        error: error.message
      });
    }

    // Handle authentication/authorization errors
    if (error.message && error.message.includes('Token')) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide',
        code: 'INVALID_TOKEN',
        error: 'Token invalide ou expiré',
        details: {
          timestamp: new Date().toISOString(),
          suggestion: 'Veuillez vous reconnecter'
        }
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Erreur suppression site',
      code: 'INTERNAL_ERROR',
      error: error.message,
      details: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
  } finally {
    session.endSession();
  }
});

export default router;
