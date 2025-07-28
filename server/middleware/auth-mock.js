import User from '../models/User.js';

// ========================================
// MIDDLEWARE D'AUTHENTIFICATION SIMULÉ
// ========================================

/**
 * Middleware pour simuler un utilisateur connecté
 * En production, ceci serait remplacé par la vérification JWT
 */
export const mockAuth = (userRole, userEmail) => {
  return async (req, res, next) => {
    try {
      // En production, on extrairait l'utilisateur du token JWT
      // Ici on simule avec un email ou rôle donné
      
      let user;
      
      if (userEmail) {
        user = await User.findOne({ email: userEmail })
          .populate('site', 'name code')
          .populate('secteur', 'name code')
          .populate('service', 'name code');
      } else {
        // Trouver un utilisateur avec le rôle spécifié
        user = await User.findOne({ role: userRole, isActive: true })
          .populate('site', 'name code')
          .populate('secteur', 'name code')
          .populate('service', 'name code');
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: `Utilisateur ${userRole || userEmail} introuvable`
        });
      }

      // Ajouter l'utilisateur à la requête
      req.user = user;
      
      // Ajouter des infos de debug
      req.userInfo = {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        site: user.site?.name,
        secteur: user.secteur?.name,
        service: user.service?.name
      };

      next();

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur authentification simulée',
        error: error.message
      });
    }
  };
};

/**
 * Middleware pour extraire l'utilisateur depuis un header personnalisé
 * Utile pour les tests
 */
export const authFromHeader = async (req, res, next) => {
  try {
    const userEmail = req.headers['x-user-email'];
    const userRole = req.headers['x-user-role'];

    if (!userEmail && !userRole) {
      return res.status(401).json({
        success: false,
        message: 'En-tête d\'authentification requis (x-user-email ou x-user-role)'
      });
    }

    let user;
    
    if (userEmail) {
      user = await User.findOne({ email: userEmail, isActive: true })
        .populate('site', 'name code')
        .populate('secteur', 'name code')
        .populate('service', 'name code');
    } else {
      user = await User.findOne({ role: userRole, isActive: true })
        .populate('site', 'name code')
        .populate('secteur', 'name code')
        .populate('service', 'name code');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    req.user = user;
    req.userInfo = {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      site: user.site?.name,
      secteur: user.secteur?.name,
      service: user.service?.name
    };

    next();

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur authentification',
      error: error.message
    });
  }
};

export default {
  mockAuth,
  authFromHeader
};
