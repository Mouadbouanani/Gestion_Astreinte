import User from '../models/User.js';
import Site from '../models/Site.js';
import Secteur from '../models/Secteur.js';
import Service from '../models/Service.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';

/**
 * @desc    Get all users with filtering and pagination
 * @route   GET /api/users
 * @access  Private (Admin, Chef Secteur)
 */
export const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      site,
      secteur,
      service,
      isActive
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) filter.role = role;
    if (site) filter.site = site;
    if (secteur) filter.secteur = secteur;
    if (service) filter.service = service;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Role-based filtering (if authenticated)
    const currentUser = req.user;
    if (currentUser) {
      if (currentUser.role === 'chef_secteur' && currentUser.secteur) {
        filter.secteur = currentUser.secteur;
      } else if (currentUser.role === 'chef_service' && currentUser.service) {
        filter.service = currentUser.service;
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with populated references
    const users = await User.find(filter)
      .populate('site', '_id name code')
      .populate('secteur', '_id name code')
      .populate('service', '_id name code')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin, Chef Secteur, or own profile)
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .populate('site', '_id name code address')
      .populate('secteur', '_id name code')
      .populate('service', '_id name code')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    // No authentication required - like secteurs
    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: error.message
    });
  }
};

/**
 * @desc    Create new user
 * @route   POST /api/users
 * @access  Private (Admin only)
 */
export const createUser = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      site,
      secteur,
      service,
      address
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Resolve site/secteur/service names to ObjectIds
    let siteId = site;
    let secteurId = secteur;
    let serviceId = service;

    // Handle site - can be ObjectId or name
    if (site && !mongoose.Types.ObjectId.isValid(site)) {
      const siteDoc = await Site.findOne({ name: site });
      if (!siteDoc) {
        return res.status(400).json({
          success: false,
          message: `Site "${site}" introuvable`
        });
      }
      siteId = siteDoc._id;
    }

    // Handle secteur - can be ObjectId or name with validation
    if (secteur && !mongoose.Types.ObjectId.isValid(secteur)) {
      // Scope secteur lookup by site when available to avoid cross-site name collisions
      const secteurQuery = siteId ? { name: secteur, site: siteId } : { name: secteur };
      const secteurDoc = await Secteur.findOne(secteurQuery);
      if (!secteurDoc) {
        return res.status(400).json({
          success: false,
          message: `Secteur "${secteur}" introuvable${siteId ? ` pour le site sélectionné` : ''}`
        });
      }

      // Validate secteur belongs to the site
      if (siteId && !secteurDoc.site.equals(siteId)) {
        return res.status(400).json({
          success: false,
          message: `Le secteur "${secteur}" n'appartient pas au site sélectionné`
        });
      }

      secteurId = secteurDoc._id;
    }

    // Handle service - can be ObjectId or name with validation
    if (service && !mongoose.Types.ObjectId.isValid(service)) {
      // Scope service lookup by secteur when available to avoid cross-secteur name collisions
      const serviceQuery = secteurId ? { name: service, secteur: secteurId } : { name: service };
      const serviceDoc = await Service.findOne(serviceQuery);
      if (!serviceDoc) {
        return res.status(400).json({
          success: false,
          message: `Service "${service}" introuvable${secteurId ? ` dans le secteur sélectionné` : ''}`
        });
      }

      // Validate service belongs to the secteur
      if (secteurId && !serviceDoc.secteur.equals(secteurId)) {
        return res.status(400).json({
          success: false,
          message: `Le service "${service}" n'appartient pas au secteur sélectionné`
        });
      }

      serviceId = serviceDoc._id;
    }

    // Create user object
    const userData = {
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role,
      site: siteId,
      isActive: true
    };

    // Add optional fields based on role
    if (role !== 'admin') {
      userData.secteur = secteurId;
    }

    if (['chef_service', 'collaborateur'].includes(role)) {
      userData.service = serviceId;
    }

    if (['ingenieur', 'collaborateur'].includes(role)) {
      userData.address = address;
    }

    // Role-based validation
    if (role === 'chef_service' && !userData.service) {
      return res.status(400).json({
        success: false,
        message: 'Un chef de service doit être assigné à un service'
      });
    }

    if (role === 'collaborateur' && !userData.service) {
      return res.status(400).json({
        success: false,
        message: 'Un collaborateur doit être assigné à un service'
      });
    }

    if (role === 'chef_secteur' && !userData.secteur) {
      return res.status(400).json({
        success: false,
        message: 'Un chef de secteur doit être assigné à un secteur'
      });
    }

    // Create user
    const user = new User(userData);
    await user.save();

    // Populate references for response
    await user.populate('site', 'name code');
    await user.populate('secteur', 'name code');
    await user.populate('service', 'name code');

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: userResponse
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message
    });
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private (Admin, Chef Secteur, or own profile)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    console.log('🔄 UPDATE USER - Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔄 UPDATE USER - User ID:', id);
    console.log('🔄 UPDATE USER - Current user:', currentUser.email);

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ UPDATE USER - Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    // Find user to update
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    // Check permissions
    const canUpdate = currentUser.role === 'admin' ||
                     currentUser.role === 'chef_secteur' ||
                     currentUser._id.toString() === id;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      site,
      secteur,
      service,
      address,
      isActive
    } = req.body;

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Un utilisateur avec cet email existe déjà'
        });
      }
    }

    // Update fields
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    // Only admin can change role and isActive status
    if (currentUser.role === 'admin') {
      if (role) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Handle site - can be ObjectId or name
      if (site) {
        if (mongoose.Types.ObjectId.isValid(site)) {
          updateData.site = site;
        } else {
          // Find site by name
          const siteDoc = await Site.findOne({ name: site });
          if (!siteDoc) {
            return res.status(400).json({
              success: false,
              message: `Site "${site}" introuvable`
            });
          }
          updateData.site = siteDoc._id;
        }
      }

      // Handle secteur - can be ObjectId or name with validation
      if (secteur) {
        let secteurId;
        if (mongoose.Types.ObjectId.isValid(secteur)) {
          secteurId = secteur;
        } else {
          // Find secteur by name (scoped by site when possible)
          let secteurDoc;
          if (updateData.site || user.site) {
            const targetSiteId = updateData.site || user.site;
            secteurDoc = await Secteur.findOne({ name: secteur, site: targetSiteId });
          } else {
            secteurDoc = await Secteur.findOne({ name: secteur });
          }
          if (!secteurDoc) {
            return res.status(400).json({
              success: false,
              message: `Secteur "${secteur}" introuvable${(updateData.site || user.site) ? ' pour le site sélectionné' : ''}`
            });
          }
          secteurId = secteurDoc._id;
        }

        // Validate secteur belongs to the site
        if (updateData.site || user.site) {
          const targetSiteId = updateData.site || user.site;
          const secteurDoc = await Secteur.findById(secteurId);
          if (secteurDoc && !secteurDoc.site.equals(targetSiteId)) {
            return res.status(400).json({
              success: false,
              message: `Le secteur "${secteur}" n'appartient pas au site sélectionné`
            });
          }
        }

        updateData.secteur = secteurId;
      }

      // Handle service - can be ObjectId or name with validation
      if (service) {
        let serviceId;
        if (mongoose.Types.ObjectId.isValid(service)) {
          serviceId = service;
        } else {
          // Find service by name (scoped by secteur when possible)
          let serviceDoc;
          if (updateData.secteur || user.secteur) {
            const targetSecteurId = updateData.secteur || user.secteur;
            serviceDoc = await Service.findOne({ name: service, secteur: targetSecteurId });
          } else {
            serviceDoc = await Service.findOne({ name: service });
          }
          if (!serviceDoc) {
            return res.status(400).json({
              success: false,
              message: `Service "${service}" introuvable${(updateData.secteur || user.secteur) ? ' dans le secteur sélectionné' : ''}`
            });
          }
          serviceId = serviceDoc._id;
        }

        // Validate service belongs to the secteur
        if (updateData.secteur || user.secteur) {
          const targetSecteurId = updateData.secteur || user.secteur;
          const serviceDoc = await Service.findById(serviceId);
          if (serviceDoc && !serviceDoc.secteur.equals(targetSecteurId)) {
            return res.status(400).json({
              success: false,
              message: `Le service "${service}" n'appartient pas au secteur sélectionné`
            });
          }
        }

        updateData.service = serviceId;
      }
    }

    // Role-based validation for updates
    const finalRole = updateData.role || user.role;
    const finalSecteur = updateData.secteur || user.secteur;
    const finalService = updateData.service || user.service;

    if (finalRole === 'chef_service' && !finalService) {
      return res.status(400).json({
        success: false,
        message: 'Un chef de service doit être assigné à un service'
      });
    }

    if (finalRole === 'collaborateur' && !finalService) {
      return res.status(400).json({
        success: false,
        message: 'Un collaborateur doit être assigné à un service'
      });
    }

    if (finalRole === 'chef_secteur' && !finalSecteur) {
      return res.status(400).json({
        success: false,
        message: 'Un chef de secteur doit être assigné à un secteur'
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('site', 'name code')
      .populate('secteur', 'name code')
      .populate('service', 'name code')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur',
      error: error.message
    });
  }
};

/**
 * @desc    Delete user (soft delete)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Only admin can delete users (check if user exists and is admin)
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé - Admin requis'
      });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    // Prevent admin from deleting themselves
    if (currentUser._id && currentUser._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Soft delete - deactivate user
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Utilisateur désactivé avec succès'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: error.message
    });
  }
};
