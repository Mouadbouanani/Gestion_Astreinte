import express from 'express';
import Site from '../models/Site.js';
import Secteur from '../models/Secteur.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import { authenticateToken, smartAuthorization } from '../middleware/jwt-auth.js';

const router = express.Router();

// ========================================
// SECTEURS MANAGEMENT
// ========================================

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
router.get('/secteurs/:id', async (req, res) => {
  try {
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

// Create new secteur (avec autorisation JWT automatique)
router.post('/sites/:siteId/secteurs', authenticateToken, smartAuthorization('secteur'), async (req, res) => {
  try {
    const { siteId } = req.params;
    const { name, code } = req.body;

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

    // Validate secteur name (must be from OCP predefined list)
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

    // Check if secteur already exists for this site
    const existingSecteur = await Secteur.findOne({ 
      site: siteId, 
      name: name.trim()
    });
    if (existingSecteur) {
      return res.status(400).json({
        success: false,
        message: 'Secteur déjà existant pour ce site'
      });
    }

    // Generate code if not provided
    const secteurCode = code || `${site.code}_${name.toUpperCase().substring(0, 4)}`;

    const secteur = new Secteur({
      name: name.trim(),
      code: secteurCode.toUpperCase().trim(),
      site: siteId,
      isActive: true
    });

    await secteur.save();
    await secteur.populate('site', 'name code');

    console.log(`✅ Secteur créé: ${secteur.name} (${secteur.code}) pour ${site.name}`);

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
router.delete('/sites/:siteId/secteurs/:id', authenticateToken, smartAuthorization('secteur'), async (req, res) => {
  try {
    const { siteId, id } = req.params;

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

// ========================================
// SERVICES MANAGEMENT
// ========================================

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
          id: service._id,
          name: service.name,
          code: service.code,
          statistics: {
            usersCount: users.length,
            chefsService: usersByRole.chefsService.length,
            collaborateurs: usersByRole.collaborateurs.length
          },
          users: users.map(u => ({
            id: u._id,
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

export default router;
