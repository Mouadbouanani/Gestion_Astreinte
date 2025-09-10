import type { User, UserRole } from '@/types';

// Hiérarchie des rôles OCP (du plus élevé au plus bas)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 5,
  chef_secteur: 4,
  chef_service: 3,
  ingenieur: 2,
  collaborateur: 1
};

// Labels des rôles pour l'affichage
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur National',
  chef_secteur: 'Chef de Secteur',
  chef_service: 'Chef de Service',
  ingenieur: 'Ingénieur Responsable',
  collaborateur: 'Collaborateur'
};

// Descriptions des rôles
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Gestion globale de tous les sites OCP',
  chef_secteur: 'Gestion des services et ingénieurs du secteur',
  chef_service: 'Gestion des collaborateurs du service',
  ingenieur: 'Responsable technique du secteur en astreinte',
  collaborateur: 'Participation aux astreintes de service'
};

/**
 * Vérifie si un rôle a un niveau suffisant par rapport à un rôle minimum requis
 */
export const hasMinimumRole = (userRole: UserRole, minimumRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
};

/**
 * Vérifie si un utilisateur peut gérer un autre utilisateur
 * Règles OCP:
 * - Admin peut gérer tout le monde
 * - Chef secteur peut gérer les chefs de service, ingénieurs et collaborateurs de son secteur
 * - Chef service peut gérer les collaborateurs de son service
 */
export const canManageUser = (manager: User, targetUser: User): boolean => {
  // Admin peut tout gérer
  if (manager.role === 'admin') {
    return true;
  }

  // Chef secteur peut gérer dans son secteur
  if (manager.role === 'chef_secteur') {
    return (typeof manager.secteur === 'object' ? manager.secteur._id : manager.secteur) === (typeof targetUser.secteur === 'object' ? targetUser.secteur._id : targetUser.secteur) &&
           ['chef_service', 'ingenieur', 'collaborateur'].includes(targetUser.role);
  }

  // Chef service peut gérer les collaborateurs de son service
  if (manager.role === 'chef_service') {
    return (typeof manager.service === 'object' ? manager.service._id : manager.service) === (typeof targetUser.service === 'object' ? targetUser.service._id : targetUser.service) &&
           targetUser.role === 'collaborateur';
  }

  return false;
};

/**
 * Vérifie si un utilisateur peut voir les plannings d'un secteur/service
 */
export const canViewPlanning = (user: User, targetSecteurId?: string, targetServiceId?: string): boolean => {
  // Admin peut tout voir (accès global)
  if (user.role === 'admin') {
    return true;
  }

  // Chef secteur peut voir son secteur (ou tous si pas d'assignation spécifique)
  if (user.role === 'chef_secteur') {
    return !targetSecteurId || (typeof user.secteur === 'object' ? user.secteur._id : user.secteur) === targetSecteurId;
  }

  // Chef service peut voir son service (ou tous si pas d'assignation spécifique)
  if (user.role === 'chef_service') {
    return !targetServiceId || (typeof user.service === 'object' ? user.service._id : user.service) === targetServiceId;
  }

  // Ingénieur peut voir son secteur
  if (user.role === 'ingenieur') {
    return (typeof user.secteur === 'object' ? user.secteur._id : user.secteur) === targetSecteurId;
  }

  // Collaborateur peut voir son service
  if (user.role === 'collaborateur') {
    return (typeof user.service === 'object' ? user.service._id : user.service) === targetServiceId;
  }

  return false;
};

/**
 * Vérifie si un utilisateur peut modifier les plannings
 */
export const canEditPlanning = (user: User, targetSecteurId?: string, targetServiceId?: string): boolean => {
  // Admin peut tout modifier (accès global)
  if (user.role === 'admin') {
    return true;
  }

  // Chef secteur peut modifier les plannings de son secteur (ou tous si pas d'assignation spécifique)
  if (user.role === 'chef_secteur') {
    return !targetSecteurId || (typeof user.secteur === 'object' ? user.secteur._id : user.secteur) === targetSecteurId;
  }

  // Chef service peut modifier les plannings de son service (ou tous si pas d'assignation spécifique)
  if (user.role === 'chef_service') {
    return !targetServiceId || (typeof user.service === 'object' ? user.service._id : user.service) === targetServiceId;
  }

  return false;
};

/**
 * Vérifie si un utilisateur peut gérer les indisponibilités
 */
export const canManageIndisponibilites = (user: User, targetUserId: string): boolean => {
  // Un utilisateur peut toujours gérer ses propres indisponibilités
  if (user.id === targetUserId) {
    return true;
  }

  // Admin peut gérer toutes les indisponibilités
  if (user.role === 'admin') {
    return true;
  }

  // Les chefs peuvent valider les demandes de leurs subordonnés
  // Cette logique nécessiterait de récupérer l'utilisateur cible pour vérifier la hiérarchie
  return false;
};

/**
 * Obtient les permissions d'un utilisateur sous forme d'objet
 */
export const getUserPermissions = (user: User) => {
  return {
    canManageAllSites: user.role === 'admin',
    canManageSecteur: ['admin', 'chef_secteur'].includes(user.role),
    canManageService: ['admin', 'chef_secteur', 'chef_service'].includes(user.role),
    canManageUsers: user.role === 'admin',
    canViewReports: ['admin', 'chef_secteur', 'chef_service'].includes(user.role),
    canManageSettings: user.role === 'admin',
    isInAstreinte: ['ingenieur', 'collaborateur', 'chef_service'].includes(user.role),
    canReceiveEscalation: ['ingenieur', 'chef_secteur'].includes(user.role)
  };
};
