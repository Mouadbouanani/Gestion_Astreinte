import Site from '../models/Site.js';
import Secteur from '../models/Secteur.js';
import Service from '../models/Service.js';
import User from '../models/User.js';

// ========================================
// MIDDLEWARE D'AUTORISATION HIÉRARCHIQUE
// ========================================

/**
 * Vérifie si l'utilisateur peut accéder à un site
 */
export const canAccessSite = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const user = req.user; // Supposé être ajouté par le middleware d'auth

    // Admin peut tout faire
    if (user.role === 'admin') {
      return next();
    }

    // Chef de site peut gérer son site
    if (user.role === 'chef_site') {
      if (user.site.toString() !== siteId) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé: Vous ne pouvez gérer que votre site'
        });
      }
      return next();
    }

    // Autres rôles ne peuvent pas gérer les sites directement
    return res.status(403).json({
      success: false,
      message: 'Accès refusé: Permissions insuffisantes pour gérer les sites'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur vérification autorisation site'
    });
  }
};

/**
 * Vérifie si l'utilisateur peut accéder à un secteur
 */
export const canAccessSecteur = async (req, res, next) => {
  try {
    const { secteurId, id } = req.params;
    const targetSecteurId = secteurId || id;
    const user = req.user;

    // Admin peut tout faire
    if (user.role === 'admin') {
      return next();
    }

    // Récupérer le secteur cible
    const secteur = await Secteur.findById(targetSecteurId).populate('site');
    if (!secteur) {
      return res.status(404).json({
        success: false,
        message: 'Secteur introuvable'
      });
    }

    // Chef de site peut gérer tous les secteurs de son site
    if (user.role === 'chef_site') {
      if (user.site.toString() !== secteur.site._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé: Ce secteur n\'appartient pas à votre site'
        });
      }
      return next();
    }

    // Chef de secteur peut gérer uniquement son secteur
    if (user.role === 'chef_secteur') {
      if (user.secteur.toString() !== targetSecteurId) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé: Vous ne pouvez gérer que votre secteur'
        });
      }
      return next();
    }

    // Ingénieur peut consulter son secteur
    if (user.role === 'ingenieur') {
      if (user.secteur.toString() !== targetSecteurId) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé: Vous ne pouvez consulter que votre secteur'
        });
      }
      // Ingénieur en lecture seule pour certaines opérations
      if (req.method !== 'GET') {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé: Vous ne pouvez que consulter votre secteur'
        });
      }
      return next();
    }

    // Autres rôles ne peuvent pas gérer les secteurs directement
    return res.status(403).json({
      success: false,
      message: 'Accès refusé: Permissions insuffisantes pour gérer les secteurs'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur vérification autorisation secteur'
    });
  }
};

/**
 * Vérifie si l'utilisateur peut accéder à un service
 */
export const canAccessService = async (req, res, next) => {
  try {
    const { serviceId, id } = req.params;
    const targetServiceId = serviceId || id;
    const user = req.user;

    // Admin peut tout faire
    if (user.role === 'admin') {
      return next();
    }

    // Récupérer le service cible avec secteur et site
    const service = await Service.findById(targetServiceId)
      .populate({
        path: 'secteur',
        populate: {
          path: 'site'
        }
      });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service introuvable'
      });
    }

    // Chef de site peut gérer tous les services de son site
    if (user.role === 'chef_site') {
      if (user.site.toString() !== service.secteur.site._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé: Ce service n\'appartient pas à votre site'
        });
      }
      return next();
    }

    // Chef de secteur peut gérer tous les services de son secteur
    if (user.role === 'chef_secteur') {
      if (user.secteur.toString() !== service.secteur._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé: Ce service n\'appartient pas à votre secteur'
        });
      }
      return next();
    }

    // Ingénieur peut consulter les services de son secteur
    if (user.role === 'ingenieur') {
      if (user.secteur.toString() !== service.secteur._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé: Ce service n\'appartient pas à votre secteur'
        });
      }
      // Ingénieur en lecture seule
      if (req.method !== 'GET') {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé: Vous ne pouvez que consulter les services'
        });
      }
      return next();
    }

    // Chef de service peut gérer uniquement son service
    if (user.role === 'chef_service') {
      if (user.service.toString() !== targetServiceId) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé: Vous ne pouvez gérer que votre service'
        });
      }
      return next();
    }

    // Collaborateur peut consulter son service
    if (user.role === 'collaborateur') {
      if (user.service.toString() !== targetServiceId) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé: Vous ne pouvez consulter que votre service'
        });
      }
      // Collaborateur en lecture seule
      if (req.method !== 'GET') {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé: Vous ne pouvez que consulter votre service'
        });
      }
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Accès refusé: Rôle non reconnu'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur vérification autorisation service'
    });
  }
};

/**
 * Vérifie si l'utilisateur peut créer dans un périmètre donné
 */
export const canCreateInScope = (scopeType) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      // Admin peut tout créer
      if (user.role === 'admin') {
        return next();
      }

      switch (scopeType) {
        case 'site':
          // Seul l'admin peut créer des sites
          return res.status(403).json({
            success: false,
            message: 'Accès refusé: Seul l\'admin peut créer des sites'
          });

        case 'secteur':
          // Admin et chef de site peuvent créer des secteurs
          if (user.role === 'chef_site') {
            return next();
          }
          return res.status(403).json({
            success: false,
            message: 'Accès refusé: Seuls l\'admin et le chef de site peuvent créer des secteurs'
          });

        case 'service':
          // Admin, chef de site et chef de secteur peuvent créer des services
          if (['chef_site', 'chef_secteur'].includes(user.role)) {
            return next();
          }
          return res.status(403).json({
            success: false,
            message: 'Accès refusé: Permissions insuffisantes pour créer des services'
          });

        default:
          return res.status(400).json({
            success: false,
            message: 'Type de scope invalide'
          });
      }

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur vérification autorisation création'
      });
    }
  };
};

/**
 * Middleware pour filtrer les données selon le périmètre utilisateur
 */
export const filterByUserScope = async (req, res, next) => {
  try {
    const user = req.user;

    // Admin voit tout
    if (user.role === 'admin') {
      return next();
    }

    // Ajouter des filtres selon le rôle
    switch (user.role) {
      case 'chef_site':
        req.scopeFilter = { site: user.site };
        break;
      
      case 'chef_secteur':
      case 'ingenieur':
        req.scopeFilter = { secteur: user.secteur };
        break;
      
      case 'chef_service':
      case 'collaborateur':
        req.scopeFilter = { service: user.service };
        break;
    }

    next();

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur application filtre scope'
    });
  }
};

export default {
  canAccessSite,
  canAccessSecteur,
  canAccessService,
  canCreateInScope,
  filterByUserScope
};
