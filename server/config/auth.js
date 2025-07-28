import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Configuration JWT
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'ocp_astreinte_secret_key_2024',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  issuer: 'OCP-Astreinte',
  audience: 'ocp-users'
};

// Configuration des rôles et permissions
export const rolePermissions = {
  admin: {
    name: 'Administrateur National',
    permissions: [
      'users:create',
      'users:read',
      'users:update',
      'users:delete',
      'sites:create',
      'sites:read',
      'sites:update',
      'sites:delete',
      'secteurs:create',
      'secteurs:read',
      'secteurs:update',
      'secteurs:delete',
      'services:create',
      'services:read',
      'services:update',
      'services:delete',
      'plannings:create',
      'plannings:read',
      'plannings:update',
      'plannings:delete',
      'plannings:validate',
      'plannings:publish',
      'escalades:read',
      'escalades:manage',
      'notifications:send',
      'reports:generate',
      'system:configure'
    ],
    scope: 'global'
  },
  chef_secteur: {
    name: 'Chef de Secteur',
    permissions: [
      'users:read',
      'users:update', // Ses utilisateurs uniquement
      'secteurs:read',
      'secteurs:update', // Son secteur uniquement
      'services:read',
      'services:update', // Ses services uniquement
      'plannings:create',
      'plannings:read',
      'plannings:update',
      'plannings:validate',
      'plannings:publish',
      'indisponibilites:approve',
      'escalades:read',
      'escalades:respond',
      'notifications:send',
      'reports:generate'
    ],
    scope: 'secteur'
  },
  ingenieur: {
    name: 'Ingénieur Responsable',
    permissions: [
      'users:read', // Secteur uniquement
      'secteurs:read',
      'services:read',
      'plannings:read',
      'plannings:update', // Planning secteur uniquement
      'indisponibilites:create',
      'indisponibilites:read',
      'escalades:read',
      'escalades:respond',
      'notifications:receive'
    ],
    scope: 'secteur'
  },
  chef_service: {
    name: 'Chef de Service',
    permissions: [
      'users:read', // Service uniquement
      'services:read',
      'services:update', // Son service uniquement
      'plannings:create',
      'plannings:read',
      'plannings:update', // Son service uniquement
      'indisponibilites:create',
      'indisponibilites:read',
      'indisponibilites:approve', // Ses collaborateurs uniquement
      'escalades:read',
      'escalades:respond',
      'notifications:receive'
    ],
    scope: 'service'
  },
  collaborateur: {
    name: 'Collaborateur',
    permissions: [
      'users:read', // Profil personnel uniquement
      'services:read', // Son service uniquement
      'plannings:read', // Son planning uniquement
      'indisponibilites:create',
      'indisponibilites:read', // Ses indisponibilités uniquement
      'escalades:read', // Ses escalades uniquement
      'escalades:respond',
      'notifications:receive'
    ],
    scope: 'personal'
  }
};

// Hiérarchie des rôles (pour l'escalade)
export const roleHierarchy = {
  admin: 5,
  chef_secteur: 4,
  ingenieur: 3,
  chef_service: 2,
  collaborateur: 1
};

// Génération de token JWT
export const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    site: user.site,
    secteur: user.secteur,
    service: user.service,
    permissions: rolePermissions[user.role]?.permissions || [],
    scope: rolePermissions[user.role]?.scope || 'personal'
  };

  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  });
};

// Génération de refresh token
export const generateRefreshToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    type: 'refresh'
  };

  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.refreshExpiresIn,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  });
};

// Vérification de token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
  } catch (error) {
    throw new Error('Token invalide');
  }
};

// Vérification des permissions
export const hasPermission = (userPermissions, requiredPermission) => {
  return userPermissions.includes(requiredPermission);
};

// Vérification du scope (portée)
export const checkScope = (userScope, userRole, userSite, userSecteur, userService, targetResource) => {
  switch (userScope) {
    case 'global':
      return true;
    
    case 'secteur':
      // Peut accéder à son secteur et ses services
      if (targetResource.secteur) {
        return targetResource.secteur.toString() === userSecteur.toString();
      }
      if (targetResource.site) {
        return targetResource.site.toString() === userSite.toString();
      }
      return true;
    
    case 'service':
      // Peut accéder uniquement à son service
      if (targetResource.service) {
        return targetResource.service.toString() === userService.toString();
      }
      if (targetResource.secteur) {
        return targetResource.secteur.toString() === userSecteur.toString();
      }
      return true;
    
    case 'personal':
      // Peut accéder uniquement à ses propres données
      if (targetResource.utilisateur || targetResource.user) {
        const targetUserId = targetResource.utilisateur || targetResource.user;
        return targetUserId.toString() === userRole.id;
      }
      return false;
    
    default:
      return false;
  }
};

// Configuration LDAP (optionnelle)
export const ldapConfig = {
  enabled: process.env.LDAP_ENABLED === 'true',
  url: process.env.LDAP_URL || 'ldap://localhost:389',
  baseDN: process.env.LDAP_BASE_DN || 'dc=ocp,dc=ma',
  username: process.env.LDAP_USERNAME || '',
  password: process.env.LDAP_PASSWORD || '',
  searchFilter: process.env.LDAP_SEARCH_FILTER || '(uid={{username}})',
  searchAttributes: ['uid', 'cn', 'mail', 'telephoneNumber', 'department']
};

// Configuration de sécurité
export const securityConfig = {
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 2 * 60 * 60 * 1000, // 2 heures
  passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
  passwordRequireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
  passwordRequireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
  passwordRequireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
  passwordRequireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL === 'true',
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 24 * 60 * 60 * 1000, // 24 heures
  refreshTokenRotation: process.env.REFRESH_TOKEN_ROTATION === 'true'
};

// Validation du mot de passe
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < securityConfig.passwordMinLength) {
    errors.push(`Le mot de passe doit contenir au moins ${securityConfig.passwordMinLength} caractères`);
  }
  
  if (securityConfig.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }
  
  if (securityConfig.passwordRequireLowercase && !/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }
  
  if (securityConfig.passwordRequireNumbers && !/\d/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  if (securityConfig.passwordRequireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  jwtConfig,
  rolePermissions,
  roleHierarchy,
  generateToken,
  generateRefreshToken,
  verifyToken,
  hasPermission,
  checkScope,
  ldapConfig,
  securityConfig,
  validatePassword
};
