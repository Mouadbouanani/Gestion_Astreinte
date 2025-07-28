import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Clé secrète JWT (en production, utiliser une variable d'environnement)
const JWT_SECRET = process.env.JWT_SECRET || 'ocp_astreinte_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// ========================================
// GÉNÉRATION ET VÉRIFICATION JWT
// ========================================

/**
 * Génère un token JWT pour un utilisateur
 */
export const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    site: user.site,
    secteur: user.secteur,
    service: user.service,
    isActive: user.isActive
  };

  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'ocp-astreinte',
    audience: 'ocp-users'
  });
};

/**
 * Vérifie et décode un token JWT
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'ocp-astreinte',
      audience: 'ocp-users'
    });
  } catch (error) {
    throw new Error('Token invalide ou expiré');
  }
};

// ========================================
// MIDDLEWARE D'AUTHENTIFICATION JWT
// ========================================

/**
 * Middleware principal d'authentification JWT
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès requis',
        code: 'NO_TOKEN'
      });
    }

    // Vérifier et décoder le token
    const decoded = verifyToken(token);

    // Récupérer l'utilisateur complet depuis la base
    const user = await User.findById(decoded.id)
      .populate('site', 'name code')
      .populate('secteur', 'name code site')
      .populate('service', 'name code secteur');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable ou inactif',
        code: 'USER_NOT_FOUND'
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    req.userToken = decoded;

    // Ajouter des infos pratiques
    req.userInfo = {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      site: user.site,
      secteur: user.secteur,
      service: user.service
    };

    next();

  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token invalide',
      code: 'INVALID_TOKEN',
      error: error.message
    });
  }
};

// ========================================
// AUTORISATION AUTOMATIQUE INTELLIGENTE
// ========================================

/**
 * Détermine automatiquement les permissions selon le contexte
 */
export const smartAuthorization = (resourceType) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { siteId, secteurId, serviceId, id } = req.params;
      const method = req.method;

      // Admin peut tout faire
      if (user.role === 'admin') {
        req.accessLevel = 'FULL';
        return next();
      }

      // Déterminer l'ID de la ressource cible
      let targetResourceId;
      switch (resourceType) {
        case 'site':
          targetResourceId = siteId || id;
          break;
        case 'secteur':
          targetResourceId = secteurId || id;
          break;
        case 'service':
          targetResourceId = serviceId || id;
          break;
      }

      // Logique d'autorisation selon le rôle et la ressource
      const authorization = await determineAccess(user, resourceType, targetResourceId, method);
      
      if (!authorization.allowed) {
        return res.status(403).json({
          success: false,
          message: authorization.message,
          code: 'ACCESS_DENIED',
          userRole: user.role,
          resourceType,
          accessLevel: authorization.level
        });
      }

      // Ajouter le niveau d'accès à la requête
      req.accessLevel = authorization.level;
      req.isOwner = authorization.isOwner;

      next();

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur vérification autorisation',
        error: error.message
      });
    }
  };
};

/**
 * Détermine le niveau d'accès selon le rôle et la ressource
 */
async function determineAccess(user, resourceType, targetResourceId, method) {
  const isReadOperation = method === 'GET';
  const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  switch (user.role) {
    case 'chef_site':
      return await checkChefSiteAccess(user, resourceType, targetResourceId, isWriteOperation);
    
    case 'chef_secteur':
      return await checkChefSecteurAccess(user, resourceType, targetResourceId, isWriteOperation);
    
    case 'ingenieur':
      return await checkIngenieurAccess(user, resourceType, targetResourceId, isWriteOperation);
    
    case 'chef_service':
      return await checkChefServiceAccess(user, resourceType, targetResourceId, isWriteOperation);
    
    case 'collaborateur':
      return await checkCollaborateurAccess(user, resourceType, targetResourceId, isWriteOperation);
    
    default:
      return {
        allowed: false,
        level: 'NONE',
        isOwner: false,
        message: 'Rôle non reconnu'
      };
  }
}

/**
 * Vérification d'accès pour Chef de Site
 */
async function checkChefSiteAccess(user, resourceType, targetResourceId, isWriteOperation) {
  // Chef de site peut gérer tout dans son site
  if (resourceType === 'site') {
    const isOwnSite = user.site._id.toString() === targetResourceId;
    return {
      allowed: isOwnSite,
      level: isOwnSite ? 'FULL' : 'NONE',
      isOwner: isOwnSite,
      message: isOwnSite ? 'Accès autorisé à votre site' : 'Accès refusé: Ce site ne vous appartient pas'
    };
  }

  // Pour secteurs et services, vérifier qu'ils appartiennent à son site
  if (resourceType === 'secteur') {
    const Secteur = (await import('../models/Secteur.js')).default;
    const secteur = await Secteur.findById(targetResourceId);
    if (!secteur) {
      return { allowed: false, level: 'NONE', isOwner: false, message: 'Secteur introuvable' };
    }
    
    const isOwnSite = secteur.site.toString() === user.site._id.toString();
    return {
      allowed: isOwnSite,
      level: isOwnSite ? 'FULL' : 'NONE',
      isOwner: isOwnSite,
      message: isOwnSite ? 'Accès autorisé à ce secteur' : 'Accès refusé: Ce secteur n\'appartient pas à votre site'
    };
  }

  if (resourceType === 'service') {
    const Service = (await import('../models/Service.js')).default;
    const service = await Service.findById(targetResourceId).populate('secteur');
    if (!service) {
      return { allowed: false, level: 'NONE', isOwner: false, message: 'Service introuvable' };
    }
    
    const isOwnSite = service.secteur.site.toString() === user.site._id.toString();
    return {
      allowed: isOwnSite,
      level: isOwnSite ? 'FULL' : 'NONE',
      isOwner: isOwnSite,
      message: isOwnSite ? 'Accès autorisé à ce service' : 'Accès refusé: Ce service n\'appartient pas à votre site'
    };
  }

  return { allowed: false, level: 'NONE', isOwner: false, message: 'Type de ressource non supporté' };
}

/**
 * Vérification d'accès pour Chef de Secteur
 */
async function checkChefSecteurAccess(user, resourceType, targetResourceId, isWriteOperation) {
  if (resourceType === 'secteur') {
    const isOwnSecteur = user.secteur._id.toString() === targetResourceId;
    return {
      allowed: isOwnSecteur,
      level: isOwnSecteur ? 'FULL' : 'READ_ONLY',
      isOwner: isOwnSecteur,
      message: isOwnSecteur ? 'Accès complet à votre secteur' : 'Accès lecture seule aux autres secteurs'
    };
  }

  if (resourceType === 'service') {
    const Service = (await import('../models/Service.js')).default;
    const service = await Service.findById(targetResourceId);
    if (!service) {
      return { allowed: false, level: 'NONE', isOwner: false, message: 'Service introuvable' };
    }
    
    const isOwnSecteur = service.secteur.toString() === user.secteur._id.toString();
    
    if (isOwnSecteur) {
      return {
        allowed: true,
        level: 'FULL',
        isOwner: true,
        message: 'Accès complet aux services de votre secteur'
      };
    } else {
      // Accès lecture seule aux autres services
      return {
        allowed: !isWriteOperation,
        level: 'READ_ONLY',
        isOwner: false,
        message: isWriteOperation ? 'Modification refusée: Service hors de votre secteur' : 'Consultation autorisée'
      };
    }
  }

  return { allowed: false, level: 'NONE', isOwner: false, message: 'Accès refusé' };
}

/**
 * Vérification d'accès pour Ingénieur (similaire à Chef Secteur mais lecture seule)
 */
async function checkIngenieurAccess(user, resourceType, targetResourceId, isWriteOperation) {
  // Ingénieur a accès lecture seule à son secteur
  const chefSecteurAccess = await checkChefSecteurAccess(user, resourceType, targetResourceId, isWriteOperation);
  
  if (chefSecteurAccess.isOwner && isWriteOperation) {
    return {
      allowed: false,
      level: 'READ_ONLY',
      isOwner: true,
      message: 'Ingénieur: Accès lecture seule uniquement'
    };
  }
  
  return chefSecteurAccess;
}

/**
 * Vérification d'accès pour Chef de Service
 */
async function checkChefServiceAccess(user, resourceType, targetResourceId, isWriteOperation) {
  if (resourceType === 'service') {
    const isOwnService = user.service._id.toString() === targetResourceId;
    
    if (isOwnService) {
      return {
        allowed: true,
        level: 'FULL',
        isOwner: true,
        message: 'Accès complet à votre service'
      };
    } else {
      // Accès lecture seule aux autres services (pour voir les plannings)
      return {
        allowed: !isWriteOperation,
        level: 'READ_ONLY',
        isOwner: false,
        message: isWriteOperation ? 'Modification refusée: Vous ne pouvez gérer que votre service' : 'Consultation planning autorisée'
      };
    }
  }

  return { allowed: false, level: 'NONE', isOwner: false, message: 'Accès refusé' };
}

/**
 * Vérification d'accès pour Collaborateur
 */
async function checkCollaborateurAccess(user, resourceType, targetResourceId, isWriteOperation) {
  if (resourceType === 'service') {
    const isOwnService = user.service._id.toString() === targetResourceId;
    
    return {
      allowed: isOwnService && !isWriteOperation,
      level: isOwnService ? 'READ_ONLY' : 'NONE',
      isOwner: isOwnService,
      message: isOwnService ? 
        (isWriteOperation ? 'Collaborateur: Lecture seule uniquement' : 'Consultation autorisée') :
        'Accès refusé: Vous ne pouvez consulter que votre service'
    };
  }

  return { allowed: false, level: 'NONE', isOwner: false, message: 'Accès refusé' };
}

export default {
  generateToken,
  verifyToken,
  authenticateToken,
  smartAuthorization
};
