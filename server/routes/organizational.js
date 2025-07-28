import express from 'express';
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
      .select('name code address createdAt');

    res.json({
      success: true,
      count: sites.length,
      data: sites
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
  try {
    const { id } = req.params;
    const user = req.user;

    // Seul l'admin peut supprimer des sites
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé: Seul l\'admin peut supprimer des sites',
        userRole: user.role
      });
    }

    // Vérifier que le site existe
    const site = await Site.findById(id);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site introuvable'
      });
    }

    // Vérifier s'il y a des secteurs actifs
    const activeSecteurs = await Secteur.countDocuments({
      site: id,
      isActive: true
    });

    // Vérifier s'il y a des utilisateurs actifs
    const activeUsers = await User.countDocuments({
      site: id,
      isActive: true
    });

    if (activeSecteurs > 0 || activeUsers > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer le site: ${activeSecteurs} secteur(s) et ${activeUsers} utilisateur(s) actif(s)`,
        details: {
          secteurs: activeSecteurs,
          users: activeUsers
        }
      });
    }

    // Soft delete du site
    site.isActive = false;
    site.deletedAt = new Date();
    await site.save();

    // Désactiver tous les secteurs et services liés (cascade)
    await Secteur.updateMany(
      { site: id },
      {
        isActive: false,
        deletedAt: new Date()
      }
    );

    await Service.updateMany(
      {
        secteur: {
          $in: await Secteur.find({ site: id }).distinct('_id')
        }
      },
      {
        isActive: false,
        deletedAt: new Date()
      }
    );

    console.log(`✅ Site supprimé: ${site.name} (${site.code})`);

    res.json({
      success: true,
      message: 'Site supprimé avec succès',
      data: {
        site: {
          id: site._id,
          name: site.name,
          code: site.code,
          deletedAt: site.deletedAt
        }
      }
    });

  } catch (error) {
    console.error('❌ Error deleting site:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur suppression site',
      error: error.message
    });
  }
});

export default router;
