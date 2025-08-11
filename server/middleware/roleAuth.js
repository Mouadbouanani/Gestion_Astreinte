/**
 * Role-based authorization middleware
 * Checks if the authenticated user has one of the required roles
 */
export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé: Permissions insuffisantes'
        });
      }

      next();
    } catch (error) {
      console.error('Error in role authorization:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur d\'autorisation'
      });
    }
  };
};

/**
 * Check if user is admin
 */
export const requireAdmin = checkRole(['admin']);

/**
 * Check if user is admin or chef_secteur
 */
export const requireAdminOrChefSecteur = checkRole(['admin', 'chef_secteur']);

/**
 * Check if user is admin, chef_secteur, or chef_service
 */
export const requireManagementRole = checkRole(['admin', 'chef_secteur', 'chef_service']);

export default {
  checkRole,
  requireAdmin,
  requireAdminOrChefSecteur,
  requireManagementRole
};
