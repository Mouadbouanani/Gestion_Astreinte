import express from 'express';
import {
  login,
  logout,
  refreshToken,
  getMe,
  changePassword,
  updateProfile,
  checkAuth
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateLogin } from '../middleware/validation.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting pour les tentatives de connexion
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par IP
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Rate limiting pour le changement de mot de passe
const passwordChangeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // 3 changements par 10 minutes
  message: {
    success: false,
    message: 'Trop de changements de mot de passe. Réessayez dans 10 minutes.',
    retryAfter: 10 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Routes publiques (sans authentification)

/**
 * @route   POST /api/auth/login
 * @desc    Connexion utilisateur
 * @access  Public
 * @body    { email, password, rememberMe? }
 */
router.post('/login', loginLimiter, validateLogin, login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Rafraîchir le token d'accès
 * @access  Public (avec refresh token dans les cookies)
 */
router.post('/refresh', refreshToken);

// Routes protégées (avec authentification)

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion utilisateur
 * @access  Private
 */
router.post('/logout', authenticateToken, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Obtenir les informations de l'utilisateur connecté
 * @access  Private
 */
router.get('/me', authenticateToken, getMe);

/**
 * @route   GET /api/auth/check
 * @desc    Vérifier le statut de l'authentification
 * @access  Private
 */
router.get('/check', authenticateToken, checkAuth);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Changer le mot de passe
 * @access  Private
 * @body    { currentPassword, newPassword, confirmPassword }
 */
router.put('/change-password', authenticateToken, passwordChangeLimiter, changePassword);

/**
 * @route   PUT /api/auth/profile
 * @desc    Mettre à jour le profil utilisateur
 * @access  Private
 * @body    { firstName?, lastName?, phone? }
 */
router.put('/profile', authenticateToken, updateProfile);

export default router;
