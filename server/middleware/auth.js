import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { jwtConfig, verifyToken, hasPermission, checkScope } from '../config/auth.js';

// Middleware d'authentification JWT
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès requis'
      });
    }

    // Vérifier le token
    const decoded = verifyToken(token);
    
    // Vérifier que l'utilisateur existe toujours
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    // Vérifier que l'utilisateur est actif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte utilisateur désactivé'
      });
    }

    // Vérifier que le compte n'est pas verrouillé
    if (user.isLocked) {
      return res.status(401).json({
        success: false,
        message: 'Compte temporairement verrouillé'
      });
    }

    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      site: user.site,
      secteur: user.secteur,
      service: user.service,
      permissions: decoded.permissions,
      scope: decoded.scope,
      fullUser: user
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide',
        code: 'TOKEN_INVALID'
      });
    }

    console.error('Erreur d\'authentification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Middleware de vérification des rôles
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Rôle insuffisant',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware de vérification des permissions
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (!hasPermission(req.user.permissions, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Permission insuffisante',
        required: permission,
        userPermissions: req.user.permissions
      });
    }

    next();
  };
};

// Middleware de vérification du scope (portée)
export const requireScope = (resourceExtractor) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    try {
      // Extraire les informations de la ressource
      const targetResource = await resourceExtractor(req);
      
      // Vérifier le scope
      const hasAccess = checkScope(
        req.user.scope,
        req.user,
        req.user.site,
        req.user.secteur,
        req.user.service,
        targetResource
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé - Scope insuffisant',
          userScope: req.user.scope
        });
      }

      // Ajouter les informations de la ressource à la requête
      req.targetResource = targetResource;
      next();
    } catch (error) {
      console.error('Erreur de vérification du scope:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur de vérification des permissions'
      });
    }
  };
};

// Middleware pour vérifier l'accès à un site spécifique
export const requireSiteAccess = (siteIdParam = 'siteId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const targetSiteId = req.params[siteIdParam] || req.body.site || req.query.site;
    
    // Admin a accès à tous les sites
    if (req.user.role === 'admin') {
      return next();
    }

    // Vérifier que l'utilisateur appartient au site
    if (req.user.site.toString() !== targetSiteId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Site non autorisé'
      });
    }

    next();
  };
};

// Middleware pour vérifier l'accès à un secteur spécifique
export const requireSecteurAccess = (secteurIdParam = 'secteurId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const targetSecteurId = req.params[secteurIdParam] || req.body.secteur || req.query.secteur;
    
    // Admin a accès à tous les secteurs
    if (req.user.role === 'admin') {
      return next();
    }

    // Chef de secteur et ingénieur ont accès à leur secteur
    if (['chef_secteur', 'ingenieur'].includes(req.user.role)) {
      if (req.user.secteur.toString() !== targetSecteurId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé - Secteur non autorisé'
        });
      }
      return next();
    }

    // Chef de service et collaborateur : vérifier via leur service
    if (['chef_service', 'collaborateur'].includes(req.user.role)) {
      // Cette vérification nécessite une requête à la base de données
      // pour obtenir le secteur du service de l'utilisateur
      return next(); // Simplifié pour l'instant
    }

    return res.status(403).json({
      success: false,
      message: 'Accès refusé - Secteur non autorisé'
    });
  };
};

// Middleware pour vérifier l'accès à un service spécifique
export const requireServiceAccess = (serviceIdParam = 'serviceId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const targetServiceId = req.params[serviceIdParam] || req.body.service || req.query.service;
    
    // Admin a accès à tous les services
    if (req.user.role === 'admin') {
      return next();
    }

    // Chef de service et collaborateur ont accès à leur service
    if (['chef_service', 'collaborateur'].includes(req.user.role)) {
      if (req.user.service.toString() !== targetServiceId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé - Service non autorisé'
        });
      }
      return next();
    }

    // Chef de secteur et ingénieur : vérifier via les services de leur secteur
    if (['chef_secteur', 'ingenieur'].includes(req.user.role)) {
      // Cette vérification nécessite une requête à la base de données
      return next(); // Simplifié pour l'instant
    }

    return res.status(403).json({
      success: false,
      message: 'Accès refusé - Service non autorisé'
    });
  };
};

// Middleware pour vérifier l'accès aux données personnelles
export const requireOwnershipOrRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const targetUserId = req.params.userId || req.params.id || req.body.utilisateur;
    
    // Vérifier si l'utilisateur accède à ses propres données
    if (req.user.id.toString() === targetUserId.toString()) {
      return next();
    }

    // Vérifier si l'utilisateur a un rôle autorisé
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Accès refusé - Données non autorisées'
    });
  };
};

// Middleware optionnel (pour les routes publiques avec authentification optionnelle)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive && !user.isLocked) {
        req.user = {
          id: user._id,
          email: user.email,
          role: user.role,
          site: user.site,
          secteur: user.secteur,
          service: user.service,
          permissions: decoded.permissions,
          scope: decoded.scope,
          fullUser: user
        };
      }
    }

    next();
  } catch (error) {
    // En cas d'erreur, continuer sans authentification
    next();
  }
};

export default {
  authenticateToken,
  requireRole,
  requirePermission,
  requireScope,
  requireSiteAccess,
  requireSecteurAccess,
  requireServiceAccess,
  requireOwnershipOrRole,
  optionalAuth
};
