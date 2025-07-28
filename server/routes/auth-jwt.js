import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken, authenticateToken } from '../middleware/jwt-auth.js';

const router = express.Router();

// ========================================
// ROUTES D'AUTHENTIFICATION JWT AUTOMATIQUE
// ========================================

/**
 * POST /api/auth-jwt/login
 * Connexion utilisateur avec génération de token JWT automatique
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des données
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Rechercher l'utilisateur avec ses relations
    const user = await User.findOne({ email, isActive: true })
      .populate('site', 'name code')
      .populate('secteur', 'name code site')
      .populate('service', 'name code secteur');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Générer le token JWT
    const token = generateToken(user);

    // Préparer les données utilisateur (sans le mot de passe)
    const userData = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      site: user.site,
      secteur: user.secteur,
      service: user.service,
      isActive: user.isActive
    };

    // Déterminer les permissions selon le rôle
    const permissions = getPermissionsByRole(user.role);

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: userData,
        token,
        permissions,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
});

/**
 * POST /api/auth-jwt/login-dev
 * Connexion rapide pour développement (sans mot de passe)
 */
router.post('/login-dev', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis'
      });
    }

    // Rechercher l'utilisateur
    const user = await User.findOne({ email, isActive: true })
      .populate('site', 'name code')
      .populate('secteur', 'name code site')
      .populate('service', 'name code secteur');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    // Générer le token JWT
    const token = generateToken(user);

    const userData = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      site: user.site,
      secteur: user.secteur,
      service: user.service,
      isActive: user.isActive
    };

    const permissions = getPermissionsByRole(user.role);

    res.json({
      success: true,
      message: 'Connexion développement réussie',
      data: {
        user: userData,
        token,
        permissions,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('Erreur login dev:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/auth-jwt/me
 * Récupérer les informations de l'utilisateur connecté
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    const userData = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      site: user.site,
      secteur: user.secteur,
      service: user.service,
      isActive: user.isActive
    };

    const permissions = getPermissionsByRole(user.role);

    res.json({
      success: true,
      data: {
        user: userData,
        permissions
      }
    });

  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/auth-jwt/refresh
 * Rafraîchir le token JWT
 */
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Générer un nouveau token
    const newToken = generateToken(user);

    res.json({
      success: true,
      message: 'Token rafraîchi',
      data: {
        token: newToken,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('Erreur refresh token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du rafraîchissement'
    });
  }
});

/**
 * POST /api/auth-jwt/logout
 * Déconnexion (côté client, suppression du token)
 */
router.post('/logout', authenticateToken, (req, res) => {
  // En JWT, la déconnexion se fait côté client en supprimant le token
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Retourne les permissions selon le rôle
 */
function getPermissionsByRole(role) {
  const permissions = {
    admin: {
      sites: { create: true, read: true, update: true, delete: true },
      secteurs: { create: true, read: true, update: true, delete: true },
      services: { create: true, read: true, update: true, delete: true },
      users: { create: true, read: true, update: true, delete: true },
      plannings: { create: true, read: true, update: true, delete: true },
      scope: 'global'
    },
    chef_site: {
      sites: { create: false, read: true, update: true, delete: false },
      secteurs: { create: true, read: true, update: true, delete: true },
      services: { create: true, read: true, update: true, delete: true },
      users: { create: true, read: true, update: true, delete: false },
      plannings: { create: true, read: true, update: true, delete: true },
      scope: 'site'
    },
    chef_secteur: {
      sites: { create: false, read: true, update: false, delete: false },
      secteurs: { create: false, read: true, update: true, delete: false },
      services: { create: true, read: true, update: true, delete: true },
      users: { create: true, read: true, update: true, delete: false },
      plannings: { create: true, read: true, update: true, delete: true },
      scope: 'secteur'
    },
    ingenieur: {
      sites: { create: false, read: true, update: false, delete: false },
      secteurs: { create: false, read: true, update: false, delete: false },
      services: { create: false, read: true, update: false, delete: false },
      users: { create: false, read: true, update: false, delete: false },
      plannings: { create: false, read: true, update: false, delete: false },
      scope: 'secteur'
    },
    chef_service: {
      sites: { create: false, read: false, update: false, delete: false },
      secteurs: { create: false, read: true, update: false, delete: false },
      services: { create: false, read: true, update: true, delete: false },
      users: { create: true, read: true, update: true, delete: false },
      plannings: { create: true, read: true, update: true, delete: true },
      scope: 'service'
    },
    collaborateur: {
      sites: { create: false, read: false, update: false, delete: false },
      secteurs: { create: false, read: false, update: false, delete: false },
      services: { create: false, read: true, update: false, delete: false },
      users: { create: false, read: false, update: false, delete: false },
      plannings: { create: false, read: true, update: false, delete: false },
      scope: 'service'
    }
  };

  return permissions[role] || permissions.collaborateur;
}

export default router;
