import express from 'express';
import mongoose from 'mongoose';
import Site from '../models/Site.js';
import Secteur from '../models/Secteur.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { smartAuthorization } from '../middleware/jwt-auth.js';
import { flexibleAuth  } from '../middleware/auth-mock.js';

const router = express.Router();

// ========================================
// SECTEURS MANAGEMENT
// ========================================

// Get all secteurs (for admin)
router.get('/secteurs', async (req, res) => {
  try {
    const { siteId } = req.query;
    let filter = { isActive: true };

    // Filter by site if specified
    if (siteId && mongoose.Types.ObjectId.isValid(siteId)) {
      filter.site = siteId;
    }

    const secteurs = await Secteur.find(filter)
      .populate('site', 'name code')
      .populate('chefSecteur', 'firstName lastName email')
      .sort({ 'site.name': 1, name: 1 });

    res.json({
      success: true,
      data: secteurs,
      message: `${secteurs.length} secteur(s) trouvé(s)`
    });
  } catch (error) {
    console.error('Error fetching secteurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des secteurs',
      error: error.message
    });
  }
});

// Get secteurs by site name (alternative endpoint for backward compatibility)
router.get('/sites/by-name/:siteName/secteurs', async (req, res) => {
  try {
    const { siteName } = req.params;

    const site = await Site.findOne({ name: siteName });
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site introuvable'
      });
    }

    const secteurs = await Secteur.find({ site: site._id, isActive: true })
      .populate('site', 'name code')
      .sort({ name: 1 });

    const secteursWithData = await Promise.all(
      secteurs.map(async (secteur) => {
        const services = await Service.find({ secteur: secteur._id, isActive: true });
        const users = await User.find({ secteur: secteur._id, isActive: true })
          .select('firstName lastName role email');

        return {
          ...secteur.toObject(),
          servicesCount: services.length,
          usersCount: users.length
        };
      })
    );

    res.json({
      success: true,
      data: secteursWithData
    });
  } catch (error) {
    console.error('❌ Error getting secteurs by site name:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération secteurs'
    });
  }
});

// Get secteurs by site
router.get('/sites/:siteId/secteurs', async (req, res) => {
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
          .select('firstName lastName role email');

        const usersByRole = {
          chefSecteur: users.filter(u => u.role === 'chef_secteur'),
          ingenieurs: users.filter(u => u.role === 'ingenieur'),
          chefsService: users.filter(u => u.role === 'chef_service'),
          collaborateurs: users.filter(u => u.role === 'collaborateur')
        };

        return {
          id: secteur._id,
          name: secteur.name,
          code: secteur.code,
          site: secteur.site,
          statistics: {
            servicesCount: services.length,
            usersCount: users.length,
            usersByRole: {
              chefSecteur: usersByRole.chefSecteur.length,
              ingenieurs: usersByRole.ingenieurs.length,
              chefsService: usersByRole.chefsService.length,
              collaborateurs: usersByRole.collaborateurs.length
            }
          },
          users: usersByRole,
          createdAt: secteur.createdAt
        };
      })
    );

    res.json({
      success: true,
      site: {
        id: site._id,
        name: site.name,
        code: site.code
      },
      count: secteursWithData.length,
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

// Get single secteur with details
router.get('sites/:siteId/secteurs/:id', async (req, res) => {
  try {
     const { siteId } = req.params;

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site introuvable'
      });
    }

    const { id } = req.params;

    const secteur = await Secteur.findById(id).populate('site', 'name code address');
    if (!secteur) {
      return res.status(404).json({
        success: false,
        message: 'Secteur introuvable'
      });
    }

    // Get services for this secteur
    const services = await Service.find({ secteur: id, isActive: true })
      .sort({ name: 1 });

    // Get users for this secteur
    const users = await User.find({ secteur: id, isActive: true })
      .select('firstName lastName role email phone address')
      .sort({ role: 1, lastName: 1 });

    const servicesWithUsers = await Promise.all(
      services.map(async (service) => {
        const serviceUsers = await User.find({ service: service._id, isActive: true })
          .select('firstName lastName role email');

        return {
          id: service._id,
          name: service.name,
          code: service.code,
          userCount: serviceUsers.length,
          users: serviceUsers.map(u => ({
            id: u._id,
            name: `${u.firstName} ${u.lastName}`,
            role: u.role,
            email: u.email
          })),
          createdAt: service.createdAt
        };
      })
    );

    res.json({
      success: true,
      data: {
        ...secteur.toObject(),
        services: servicesWithUsers,
        users: users.map(u => ({
          id: u._id,
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
          email: u.email,
          phone: u.phone,
          address: u.address
        })),
        statistics: {
          servicesCount: services.length,
          usersCount: users.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting secteur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération secteur'
    });
  }
});

// If you want to allow custom secteur names, modify your backend:
router.post('/sites/:siteId/secteurs', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { name, code, description } = req.body; // Add description support

    // Validation
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Nom et code sont requis'
      });
    }
    
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site introuvable'
      });
    }

    // ✅ OPTION 1: Remove validation (allow any name)
    // Comment out the validation section
    
    // ✅ OPTION 2: Add custom names to valid list
    // const validSecteurs = [
    //   'Traitement', 'Extraction', 'Maintenance', 'Logistique', 'Qualité',
    //   'Test Secteur', 'Administration', 'Production' // Add custom names
    // ];

    // ✅ Allow any secteur name - no validation needed

    // Check if secteur already exists for this site
    const existingSecteur = await Secteur.findOne({
      site: siteId,
      name: name.trim()
    });

    if (existingSecteur) {
      // If secteur exists but is inactive, reactivate it
      if (!existingSecteur.isActive) {
        console.log(`🔄 Reactivating existing secteur: ${existingSecteur.name}`);

        existingSecteur.isActive = true;
        existingSecteur.code = code.toUpperCase().trim(); // Update code if provided
        if (description) {
          existingSecteur.description = description.trim(); // Update description if provided
        }

        await existingSecteur.save();
        await existingSecteur.populate('site', 'name code');

        // Also reactivate related services if any
        const reactivatedServices = await Service.updateMany(
          { secteur: existingSecteur._id, isActive: false },
          { isActive: true }
        );

        console.log(`✅ Secteur réactivé: ${existingSecteur.name} (${reactivatedServices.modifiedCount} services réactivés)`);

        return res.status(200).json({
          success: true,
          message: `Secteur réactivé avec succès${reactivatedServices.modifiedCount > 0 ? ` (${reactivatedServices.modifiedCount} services réactivés)` : ''}`,
          data: existingSecteur,
          reactivated: true,
          reactivatedServices: reactivatedServices.modifiedCount
        });
      } else {
        // Secteur exists and is active
        return res.status(400).json({
          success: false,
          message: 'Secteur déjà existant et actif pour ce site'
        });
      }
    }

    const secteur = new Secteur({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      description: description?.trim(), // Add description support
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
      message: 'Erreur création secteur',
      error: error.message
    });
  }
});


// Update secteur (avec autorisation JWT automatique)
router.put('/secteurs/:id', authenticateToken, smartAuthorization('secteur'), async (req, res) => {
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

    // Validate secteur name if provided
    if (name) {
      const validSecteurs = [
        'Traitement', 'Extraction', 'Maintenance', 'Logistique', 'Qualité'
      ];

      if (!validSecteurs.includes(name.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Nom de secteur invalide',
          validSecteurs
        });
      }

      // Check if new name conflicts
      const existingSecteur = await Secteur.findOne({ 
        site: secteur.site,
        name: name.trim(),
        _id: { $ne: id } 
      });
      if (existingSecteur) {
        return res.status(400).json({
          success: false,
          message: 'Secteur déjà existant pour ce site'
        });
      }
    }

    // Update fields
    if (name) secteur.name = name.trim();
    if (code) secteur.code = code.toUpperCase().trim();
    if (typeof isActive === 'boolean') secteur.isActive = isActive;

    await secteur.save();
    await secteur.populate('site', 'name code');

    console.log(`✅ Secteur mis à jour: ${secteur.name} (${secteur.code})`);

    res.json({
      success: true,
      message: 'Secteur mis à jour avec succès',
      data: secteur
    });

  } catch (error) {
    console.error('❌ Error updating secteur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur mise à jour secteur',
      error: error.message
    });
  }
});

// Delete secteur (soft delete avec autorisation JWT automatique)
// Use mock auth instead of JWT for testing

// Then update your delete route:
router.delete('/sites/:siteId/secteurs/:id', 
  flexibleAuth,  // ← Change from authFromHeader to flexibleAuth
  async (req, res) => {
    try {
      const { siteId, id } = req.params;

      console.log('🔍 Delete request from user:', req.userInfo);

      // Vérifier que le site existe
      const site = await Site.findById(siteId);
      if (!site) {
        return res.status(404).json({
          success: false,
          message: 'Site introuvable'
        });
      }

      const secteur = await Secteur.findById(id);
      if (!secteur) {
        return res.status(404).json({
          success: false,
          message: 'Secteur introuvable'
        });
      }

      // Vérifier que le secteur appartient bien au site
      if (secteur.site.toString() !== siteId) {
        return res.status(400).json({
          success: false,
          message: 'Le secteur n\'appartient pas à ce site'
        });
      }

      // Check if secteur has active users
      const activeUsers = await User.countDocuments({ secteur: id, isActive: true });
      if (activeUsers > 0) {
        return res.status(400).json({
          success: false,
          message: `Impossible de supprimer: ${activeUsers} utilisateur(s) actif(s) assigné(s)`,
          activeUsers
        });
      }

      // Soft delete secteur
      secteur.isActive = false;
      await secteur.save();

      // Also deactivate related services
      const deactivatedServices = await Service.updateMany(
        { secteur: id }, 
        { isActive: false }
      );

      console.log(`✅ Secteur désactivé: ${secteur.name} (${deactivatedServices.modifiedCount} services désactivés)`);

      res.json({
        success: true,
        message: 'Secteur désactivé avec succès',
        deactivatedServices: deactivatedServices.modifiedCount
      });

    } catch (error) {
      console.error('❌ Error deleting secteur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur suppression secteur',
        error: error.message
      });
    }
  });

// Update secteur (site-based endpoint)
router.put('/sites/:siteId/secteurs/:id',
  flexibleAuth,
  async (req, res) => {
    try {
      const { siteId, id } = req.params;
      const { name, code, description, isActive } = req.body;

      // Validate site exists
      const site = await Site.findById(siteId);
      if (!site) {
        return res.status(404).json({
          success: false,
          message: 'Site introuvable'
        });
      }

      // Find and update secteur
      const secteur = await Secteur.findOne({ _id: id, site: siteId });
      if (!secteur) {
        return res.status(404).json({
          success: false,
          message: 'Secteur introuvable'
        });
      }

      // Update fields
      if (name) secteur.name = name;
      if (code) secteur.code = code.toUpperCase();
      if (description !== undefined) secteur.description = description;
      if (isActive !== undefined) secteur.isActive = isActive;

      await secteur.save();

      // Populate site info
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
        message: 'Erreur serveur lors de la mise à jour du secteur',
        error: error.message
      });
    }
  }
);

// Activate/Reactivate secteur
router.patch('/sites/:siteId/secteurs/:id/activate',
  flexibleAuth,
  async (req, res) => {
    try {
      const { siteId, id } = req.params;

      console.log('🔄 Activate secteur request from user:', req.userInfo);

      // Verify site exists
      const site = await Site.findById(siteId);
      if (!site) {
        return res.status(404).json({
          success: false,
          message: 'Site introuvable'
        });
      }

      const secteur = await Secteur.findById(id);
      if (!secteur) {
        return res.status(404).json({
          success: false,
          message: 'Secteur introuvable'
        });
      }

      // Verify secteur belongs to the site
      if (secteur.site.toString() !== siteId) {
        return res.status(400).json({
          success: false,
          message: 'Le secteur n\'appartient pas à ce site'
        });
      }

      // If already active, return success
      if (secteur.isActive) {
        return res.json({
          success: true,
          message: 'Secteur déjà actif',
          data: secteur,
          alreadyActive: true
        });
      }

      // Activate secteur
      secteur.isActive = true;
      await secteur.save();
      await secteur.populate('site', 'name code');

      // Also reactivate related services if any
      const reactivatedServices = await Service.updateMany(
        { secteur: id, isActive: false },
        { isActive: true }
      );

      console.log(`✅ Secteur activé: ${secteur.name} (${reactivatedServices.modifiedCount} services réactivés)`);

      res.json({
        success: true,
        message: `Secteur activé avec succès${reactivatedServices.modifiedCount > 0 ? ` (${reactivatedServices.modifiedCount} services réactivés)` : ''}`,
        data: secteur,
        reactivatedServices: reactivatedServices.modifiedCount
      });

    } catch (error) {
      console.error('❌ Error activating secteur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur activation secteur',
        error: error.message
      });
    }
  });

// ========================================
// SERVICES MANAGEMENT
// ========================================

// Get all services with optional filtering
router.get('/services', async (req, res) => {
  try {
    const { siteId, secteurId } = req.query;
    let filter = { isActive: true };

    // Build filter based on parameters
    if (secteurId && mongoose.Types.ObjectId.isValid(secteurId)) {
      filter.secteur = secteurId;
    } else if (siteId && mongoose.Types.ObjectId.isValid(siteId)) {
      // If only siteId is provided, get all secteurs of that site first
      const secteurs = await Secteur.find({ site: siteId, isActive: true }).select('_id');
      const secteurIds = secteurs.map(s => s._id);
      filter.secteur = { $in: secteurIds };
    }

    const services = await Service.find(filter)
      .populate('secteur', 'name code')
      .populate({
        path: 'secteur',
        populate: {
          path: 'site',
          select: 'name code'
        }
      })
      .sort({ name: 1 });

    const servicesWithUsers = await Promise.all(
      services.map(async (service) => {
        const users = await User.find({ service: service._id, isActive: true })
          .select('firstName lastName role email phone');

        const usersByRole = {
          chefsService: users.filter(u => u.role === 'chef_service'),
          collaborateurs: users.filter(u => u.role === 'collaborateur')
        };

        return {
          _id: service._id,
          name: service.name,
          code: service.code,
          description: service.description,
          secteur: service.secteur,
          minPersonnel: service.minPersonnel,
          isActive: service.isActive,
          statistics: {
            totalPersonnel: users.length,
            usersCount: users.length,
            chefsService: usersByRole.chefsService.length,
            collaborateurs: usersByRole.collaborateurs.length
          },
          users: users.map(u => ({
            _id: u._id,
            name: `${u.firstName} ${u.lastName}`,
            role: u.role,
            email: u.email,
            phone: u.phone
          })),
          createdAt: service.createdAt
        };
      })
    );

    res.json({
      success: true,
      count: servicesWithUsers.length,
      data: servicesWithUsers
    });

  } catch (error) {
    console.error('❌ Error getting services:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération services'
    });
  }
});

// Get services by secteur name (alternative endpoint for backward compatibility)
router.get('/secteurs/by-name/:secteurName/services', async (req, res) => {
  try {
    const { secteurName } = req.params;

    const secteur = await Secteur.findOne({ name: secteurName }).populate('site', 'name code');
    if (!secteur) {
      return res.status(404).json({
        success: false,
        message: 'Secteur introuvable'
      });
    }

    const services = await Service.find({ secteur: secteur._id, isActive: true })
      .sort({ name: 1 });

    const servicesWithUsers = await Promise.all(
      services.map(async (service) => {
        const users = await User.find({ service: service._id, isActive: true })
          .select('firstName lastName role email');

        return {
          ...service.toObject(),
          usersCount: users.length
        };
      })
    );

    res.json({
      success: true,
      data: servicesWithUsers
    });
  } catch (error) {
    console.error('❌ Error getting services by secteur name:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération services'
    });
  }
});

// Get services by secteur
router.get('/secteurs/:secteurId/services', async (req, res) => {
  try {
    const { secteurId } = req.params;

    const secteur = await Secteur.findById(secteurId).populate('site', 'name code');
    if (!secteur) {
      return res.status(404).json({
        success: false,
        message: 'Secteur introuvable'
      });
    }

    const services = await Service.find({ secteur: secteurId, isActive: true })
      .sort({ name: 1 });

    const servicesWithUsers = await Promise.all(
      services.map(async (service) => {
        const users = await User.find({ service: service._id, isActive: true })
          .select('firstName lastName role email phone');

        const usersByRole = {
          chefsService: users.filter(u => u.role === 'chef_service'),
          collaborateurs: users.filter(u => u.role === 'collaborateur')
        };

        return {
          _id: service._id,
          name: service.name,
          code: service.code,
          description: service.description,
          secteur: service.secteur,
          minPersonnel: service.minPersonnel,
          isActive: service.isActive,
          statistics: {
            totalPersonnel: users.length,
            usersCount: users.length,
            chefsService: usersByRole.chefsService.length,
            collaborateurs: usersByRole.collaborateurs.length
          },
          users: users.map(u => ({
            _id: u._id,
            name: `${u.firstName} ${u.lastName}`,
            role: u.role,
            email: u.email,
            phone: u.phone
          })),
          createdAt: service.createdAt
        };
      })
    );

    res.json({
      success: true,
      secteur: {
        id: secteur._id,
        name: secteur.name,
        code: secteur.code,
        site: secteur.site
      },
      count: servicesWithUsers.length,
      data: servicesWithUsers
    });

  } catch (error) {
    console.error('❌ Error getting services:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération services'
    });
  }
});

// Get single service with details
router.get('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id)
      .populate({
        path: 'secteur',
        populate: {
          path: 'site',
          select: 'name code address'
        }
      });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service introuvable'
      });
    }

    // Get users for this service
    const users = await User.find({ service: id, isActive: true })
      .select('firstName lastName role email phone address')
      .sort({ role: 1, lastName: 1 });

    res.json({
      success: true,
      data: {
        ...service.toObject(),
        users: users.map(u => ({
          id: u._id,
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
          email: u.email,
          phone: u.phone,
          address: u.address
        })),
        statistics: {
          usersCount: users.length,
          chefsService: users.filter(u => u.role === 'chef_service').length,
          collaborateurs: users.filter(u => u.role === 'collaborateur').length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting service:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération service'
    });
  }
});

// Create new service (avec autorisation JWT automatique)
router.post('/secteurs/:secteurId/services', authenticateToken, smartAuthorization('service'), async (req, res) => {
  try {
    const { secteurId } = req.params;
    const { name, code } = req.body;

    // Validation
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Nom et code sont requis'
      });
    }

    const secteur = await Secteur.findById(secteurId).populate('site');
    if (!secteur) {
      return res.status(404).json({
        success: false,
        message: 'Secteur introuvable'
      });
    }

    // Validate service name (must be from OCP predefined list)
    const validServices = [
      'Production U1', 'Production U2', 'Contrôle Qualité',
      'Mines', 'Transport', 'Géologie',
      'Électricité', 'Mécanique', 'Instrumentation',
      'Approvisionnement', 'Expédition',
      'Laboratoire', 'Contrôle Process', 'Certification'
    ];

    if (!validServices.includes(name.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Nom de service invalide',
        validServices
      });
    }

    // Check if service already exists for this secteur
    const existingService = await Service.findOne({
      secteur: secteurId,
      name: name.trim()
    });
    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'Service déjà existant pour ce secteur'
      });
    }

    // Generate code if not provided
    const serviceCode = code || `${secteur.code}_${name.replace(/\s+/g, '').toUpperCase().substring(0, 3)}`;

    const service = new Service({
      name: name.trim(),
      code: serviceCode.toUpperCase().trim(),
      secteur: secteurId,
      isActive: true
    });

    await service.save();
    await service.populate({
      path: 'secteur',
      populate: {
        path: 'site',
        select: 'name code'
      }
    });

    console.log(`✅ Service créé: ${service.name} (${service.code}) pour secteur ${secteur.name}`);

    res.status(201).json({
      success: true,
      message: 'Service créé avec succès',
      data: service
    });

  } catch (error) {
    console.error('❌ Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur création service',
      error: error.message
    });
  }
});

// Update service
router.put('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, isActive } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service introuvable'
      });
    }

    // Validate service name if provided
    if (name) {
      const validServices = [
        'Production U1', 'Production U2', 'Contrôle Qualité',
        'Mines', 'Transport', 'Géologie',
        'Électricité', 'Mécanique', 'Instrumentation',
        'Approvisionnement', 'Expédition',
        'Laboratoire', 'Contrôle Process', 'Certification'
      ];

      if (!validServices.includes(name.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Nom de service invalide',
          validServices
        });
      }

      // Check if new name conflicts
      const existingService = await Service.findOne({
        secteur: service.secteur,
        name: name.trim(),
        _id: { $ne: id }
      });
      if (existingService) {
        return res.status(400).json({
          success: false,
          message: 'Service déjà existant pour ce secteur'
        });
      }
    }

    // Update fields
    if (name) service.name = name.trim();
    if (code) service.code = code.toUpperCase().trim();
    if (typeof isActive === 'boolean') service.isActive = isActive;

    await service.save();
    await service.populate({
      path: 'secteur',
      populate: {
        path: 'site',
        select: 'name code'
      }
    });

    console.log(`✅ Service mis à jour: ${service.name} (${service.code})`);

    res.json({
      success: true,
      message: 'Service mis à jour avec succès',
      data: service
    });

  } catch (error) {
    console.error('❌ Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur mise à jour service',
      error: error.message
    });
  }
});

// Delete service (soft delete)
router.delete('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service introuvable'
      });
    }

    // Check if service has active users
    const activeUsers = await User.countDocuments({ service: id, isActive: true });
    if (activeUsers > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer: ${activeUsers} utilisateur(s) actif(s) assigné(s)`,
        activeUsers
      });
    }

    // Soft delete service
    service.isActive = false;
    await service.save();

    console.log(`✅ Service désactivé: ${service.name}`);

    res.json({
      success: true,
      message: 'Service désactivé avec succès'
    });

  } catch (error) {
    console.error('❌ Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur suppression service',
      error: error.message
    });
  }
});

// ========================================
// ADMIN MANAGEMENT - SECTEURS
// ========================================

// Create new secteur (Admin only)
router.post('/secteurs', authenticateToken, smartAuthorization(['admin']), async (req, res) => {
  try {
    const { name, code, description, site, chefSecteur } = req.body;

    // Validate required fields
    if (!name || !code || !site) {
      return res.status(400).json({
        success: false,
        message: 'Nom, code et site sont requis'
      });
    }

    // Check if secteur already exists
    const existingSecteur = await Secteur.findOne({
      $or: [
        { name: name.trim() },
        { code: code.trim().toUpperCase() }
      ]
    });

    if (existingSecteur) {
      return res.status(400).json({
        success: false,
        message: 'Un secteur avec ce nom ou code existe déjà'
      });
    }

    // Create new secteur
    const secteur = new Secteur({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim(),
      site,
      chefSecteur: chefSecteur || null,
      isActive: true,
      createdBy: req.user.id
    });

    await secteur.save();

    // Populate the response
    await secteur.populate('site', 'name code');
    await secteur.populate('chefSecteur', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: secteur,
      message: 'Secteur créé avec succès'
    });

  } catch (error) {
    console.error('❌ Error creating secteur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du secteur'
    });
  }
});

// Update secteur (Admin only)
router.put('/secteurs/:id', authenticateToken, smartAuthorization(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, site, chefSecteur, isActive } = req.body;

    const secteur = await Secteur.findById(id);
    if (!secteur) {
      return res.status(404).json({
        success: false,
        message: 'Secteur introuvable'
      });
    }

    // Update fields
    if (name) secteur.name = name.trim();
    if (code) secteur.code = code.trim().toUpperCase();
    if (description !== undefined) secteur.description = description?.trim();
    if (site) secteur.site = site;
    if (chefSecteur !== undefined) secteur.chefSecteur = chefSecteur;
    if (isActive !== undefined) secteur.isActive = isActive;

    secteur.updatedBy = req.user.id;
    secteur.updatedAt = new Date();

    await secteur.save();

    // Populate the response
    await secteur.populate('site', 'name code');
    await secteur.populate('chefSecteur', 'firstName lastName email');

    res.json({
      success: true,
      data: secteur,
      message: 'Secteur mis à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Error updating secteur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du secteur'
    });
  }
});

// Delete secteur (Admin only)
router.delete('/secteurs/:id', authenticateToken, smartAuthorization(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const secteur = await Secteur.findById(id);
    if (!secteur) {
      return res.status(404).json({
        success: false,
        message: 'Secteur introuvable'
      });
    }

    // Check if secteur has services
    const servicesCount = await Service.countDocuments({ secteur: id, isActive: true });
    if (servicesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer ce secteur car il contient ${servicesCount} service(s) actif(s)`
      });
    }

    // Check if secteur has users
    const usersCount = await User.countDocuments({ secteur: id, isActive: true });
    if (usersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer ce secteur car il contient ${usersCount} utilisateur(s) actif(s)`
      });
    }

    // Soft delete
    secteur.isActive = false;
    secteur.updatedBy = req.user.id;
    secteur.updatedAt = new Date();
    await secteur.save();

    res.json({
      success: true,
      message: 'Secteur supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Error deleting secteur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du secteur'
    });
  }
});

// ========================================
// ADMIN MANAGEMENT - SERVICES
// ========================================

// Create new service (Admin only)
router.post('/services', authenticateToken, smartAuthorization(['admin']), async (req, res) => {
  try {
    const { name, code, description, secteur, chefService } = req.body;

    // Validate required fields
    if (!name || !code || !secteur) {
      return res.status(400).json({
        success: false,
        message: 'Nom, code et secteur sont requis'
      });
    }

    // Check if service already exists
    const existingService = await Service.findOne({
      $or: [
        { name: name.trim() },
        { code: code.trim().toUpperCase() }
      ]
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'Un service avec ce nom ou code existe déjà'
      });
    }

    // Create new service
    const service = new Service({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim(),
      secteur,
      chefService: chefService || null,
      isActive: true,
      createdBy: req.user.id
    });

    await service.save();

    // Populate the response
    await service.populate('secteur', 'name code');
    await service.populate('chefService', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: service,
      message: 'Service créé avec succès'
    });

  } catch (error) {
    console.error('❌ Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du service'
    });
  }
});

// Update service (Admin only)
router.put('/services/:id', authenticateToken, smartAuthorization(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, secteur, chefService, isActive } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service introuvable'
      });
    }

    // Update fields
    if (name) service.name = name.trim();
    if (code) service.code = code.trim().toUpperCase();
    if (description !== undefined) service.description = description?.trim();
    if (secteur) service.secteur = secteur;
    if (chefService !== undefined) service.chefService = chefService;
    if (isActive !== undefined) service.isActive = isActive;

    service.updatedBy = req.user.id;
    service.updatedAt = new Date();

    await service.save();

    // Populate the response
    await service.populate('secteur', 'name code');
    await service.populate('chefService', 'firstName lastName email');

    res.json({
      success: true,
      data: service,
      message: 'Service mis à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du service'
    });
  }
});

// Delete service (Admin only)
router.delete('/services/:id', authenticateToken, smartAuthorization(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service introuvable'
      });
    }

    // Check if service has users
    const usersCount = await User.countDocuments({ service: id, isActive: true });
    if (usersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer ce service car il contient ${usersCount} utilisateur(s) actif(s)`
      });
    }

    // Soft delete
    service.isActive = false;
    service.updatedBy = req.user.id;
    service.updatedAt = new Date();
    await service.save();

    res.json({
      success: true,
      message: 'Service supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du service'
    });
  }
});

// ========================================
// 3-LEVEL HIERARCHY SERVICE ENDPOINTS
// Sites → Secteurs → Services
// ========================================

// Get services for a specific secteur in a specific site
router.get('/sites/:siteId/secteurs/:secteurId/services', async (req, res) => {
  try {
    const { siteId, secteurId } = req.params;

    // Validate site exists
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site introuvable'
      });
    }

    // Validate secteur exists and belongs to site
    const secteur = await Secteur.findOne({ _id: secteurId, site: siteId });
    if (!secteur) {
      return res.status(404).json({
        success: false,
        message: 'Secteur introuvable dans ce site'
      });
    }

    // Get services for this secteur
    const services = await Service.find({ secteur: secteurId, isActive: true })
      .populate('secteur', 'name code')
      .populate('chefService', 'firstName lastName email')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: services.length,
      data: services
    });

  } catch (error) {
    console.error('❌ Error getting services:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des services',
      error: error.message
    });
  }
});

// Create service in specific secteur of specific site
router.post('/sites/:siteId/secteurs/:secteurId/services',
  flexibleAuth,
  async (req, res) => {
    try {
      const { siteId, secteurId } = req.params;
      const { name, code, description, minPersonnel } = req.body;

      // Validation
      if (!name || !code) {
        return res.status(400).json({
          success: false,
          message: 'Nom et code sont requis'
        });
      }

      // Validate site exists
      const site = await Site.findById(siteId);
      if (!site) {
        return res.status(404).json({
          success: false,
          message: 'Site introuvable'
        });
      }

      // Validate secteur exists and belongs to site
      const secteur = await Secteur.findOne({ _id: secteurId, site: siteId });
      if (!secteur) {
        return res.status(404).json({
          success: false,
          message: 'Secteur introuvable dans ce site'
        });
      }

      // Check if service with same name exists (inactive)
      const existingService = await Service.findOne({
        name: name.trim(),
        secteur: secteurId,
        isActive: false
      });

      if (existingService) {
        // Reactivate existing service
        existingService.isActive = true;
        existingService.code = code.toUpperCase();
        if (description) existingService.description = description;
        if (minPersonnel) existingService.minPersonnel = minPersonnel;

        await existingService.save();
        await existingService.populate('secteur', 'name code');

        return res.status(200).json({
          success: true,
          message: 'Service réactivé avec succès',
          data: { ...existingService.toObject(), wasReactivated: true }
        });
      }

      // Check if active service with same name exists
      const activeService = await Service.findOne({
        name: name.trim(),
        secteur: secteurId,
        isActive: true
      });

      if (activeService) {
        return res.status(409).json({
          success: false,
          message: 'Un service avec ce nom existe déjà dans ce secteur',
          code: 'SERVICE_EXISTS_ACTIVE'
        });
      }

      // Create new service
      const newService = new Service({
        name: name.trim(),
        code: code.toUpperCase(),
        description: description?.trim(),
        secteur: secteurId,
        minPersonnel: minPersonnel || 1,
        isActive: true
      });

      await newService.save();
      await newService.populate('secteur', 'name code');

      res.status(201).json({
        success: true,
        message: 'Service créé avec succès',
        data: newService
      });

    } catch (error) {
      console.error('❌ Error creating service:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la création du service',
        error: error.message
      });
    }
  }
);

// Update service in specific secteur of specific site
router.put('/sites/:siteId/secteurs/:secteurId/services/:id',
  flexibleAuth,
  async (req, res) => {
    try {
      const { siteId, secteurId, id } = req.params;
      const { name, code, description, minPersonnel, isActive } = req.body;

      // Validate site exists
      const site = await Site.findById(siteId);
      if (!site) {
        return res.status(404).json({
          success: false,
          message: 'Site introuvable'
        });
      }

      // Validate secteur exists and belongs to site
      const secteur = await Secteur.findOne({ _id: secteurId, site: siteId });
      if (!secteur) {
        return res.status(404).json({
          success: false,
          message: 'Secteur introuvable dans ce site'
        });
      }

      // Find and update service
      const service = await Service.findOne({ _id: id, secteur: secteurId });
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service introuvable dans ce secteur'
        });
      }

      // Update fields
      if (name) service.name = name.trim();
      if (code) service.code = code.toUpperCase();
      if (description !== undefined) service.description = description?.trim();
      if (minPersonnel) service.minPersonnel = minPersonnel;
      if (isActive !== undefined) service.isActive = isActive;

      await service.save();
      await service.populate('secteur', 'name code');

      res.json({
        success: true,
        message: 'Service mis à jour avec succès',
        data: service
      });

    } catch (error) {
      console.error('❌ Error updating service:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la mise à jour du service',
        error: error.message
      });
    }
  }
);

// Delete service in specific secteur of specific site (soft delete)
router.delete('/sites/:siteId/secteurs/:secteurId/services/:id',
  flexibleAuth,
  async (req, res) => {
    try {
      const { siteId, secteurId, id } = req.params;

      // Validate site exists
      const site = await Site.findById(siteId);
      if (!site) {
        return res.status(404).json({
          success: false,
          message: 'Site introuvable'
        });
      }

      // Validate secteur exists and belongs to site
      const secteur = await Secteur.findOne({ _id: secteurId, site: siteId });
      if (!secteur) {
        return res.status(404).json({
          success: false,
          message: 'Secteur introuvable dans ce site'
        });
      }

      // Find service
      const service = await Service.findOne({ _id: id, secteur: secteurId });
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service introuvable dans ce secteur'
        });
      }

      // Check if service has active users
      const activeUsers = await User.countDocuments({ service: id, isActive: true });
      if (activeUsers > 0) {
        return res.status(400).json({
          success: false,
          message: `Impossible de supprimer le service. Il contient ${activeUsers} utilisateur(s) actif(s).`,
          code: 'SERVICE_HAS_ACTIVE_USERS',
          data: { activeUsers }
        });
      }

      // Soft delete
      service.isActive = false;
      await service.save();

      res.json({
        success: true,
        message: 'Service supprimé avec succès',
        data: { id: service._id, name: service.name }
      });

    } catch (error) {
      console.error('❌ Error deleting service:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la suppression du service',
        error: error.message
      });
    }
  }
);

// Activate service in specific secteur of specific site
router.patch('/sites/:siteId/secteurs/:secteurId/services/:id/activate',
  flexibleAuth,
  async (req, res) => {
    try {
      const { siteId, secteurId, id } = req.params;

      // Validate site exists
      const site = await Site.findById(siteId);
      if (!site) {
        return res.status(404).json({
          success: false,
          message: 'Site introuvable'
        });
      }

      // Validate secteur exists and belongs to site
      const secteur = await Secteur.findOne({ _id: secteurId, site: siteId });
      if (!secteur) {
        return res.status(404).json({
          success: false,
          message: 'Secteur introuvable dans ce site'
        });
      }

      // Find and activate service
      const service = await Service.findOne({ _id: id, secteur: secteurId });
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service introuvable dans ce secteur'
        });
      }

      service.isActive = true;
      await service.save();
      await service.populate('secteur', 'name code');

      res.json({
        success: true,
        message: 'Service activé avec succès',
        data: { ...service.toObject(), wasReactivated: true }
      });

    } catch (error) {
      console.error('❌ Error activating service:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de l\'activation du service',
        error: error.message
      });
    }
  }
);

export default router;
