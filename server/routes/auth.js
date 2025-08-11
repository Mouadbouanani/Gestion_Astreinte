import express from 'express';
import jwt from 'jsonwebtoken';
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
import { flexibleAuth } from '../middleware/auth-mock.js';
import { jwtConfig } from '../config/auth.js';
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

// Add this route to your auth/login router for debugging
router.post('/debug-token', async (req, res) => {
  console.log('🔧 DEBUG TOKEN endpoint called');
  
  try {
    const { email, password } = req.body;
    console.log('🔧 Debug request body:', { email, password: password ? '[PROVIDED]' : '[MISSING]' });

    // Find user (same as your login logic)
    const user = await User.findOne({ email, isActive: true })
      .populate('site', 'name code isActive')
      .populate('secteur', 'name code isActive')
      .populate('service', 'name code isActive');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password (adjust according to your password verification logic)
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    // For debugging, you might want to skip password check temporarily

    console.log('🔧 User found:', {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      site: user.site?.name,
      secteur: user.secteur?.name,
      service: user.service?.name
    });

    // Generate token
    console.log('🔧 Generating token...');
    const token = generateToken(user);
    console.log('🔧 Token generated:', {
      length: token.length,
      starts_with: token.substring(0, 30) + '...',
      ends_with: '...' + token.substring(token.length - 30)
    });

    // Immediately verify the token we just generated
    console.log('🔧 Verifying generated token...');
    try {
      const decoded = verifyToken(token);
      console.log('✅ Token verification successful:', decoded);
    } catch (verifyError) {
      console.error('❌ Token verification failed:', verifyError.message);
      return res.status(500).json({
        success: false,
        message: 'Token generation/verification failed',
        error: verifyError.message
      });
    }

    // Return debug info
    res.json({
      success: true,
      message: 'Debug token generated and verified successfully',
      debug: {
        user_id: user._id,
        email: user.email,
        role: user.role,
        token_length: token.length,
        jwt_secret_set: !!process.env.JWT_SECRET,
        timestamp: new Date().toISOString()
      },
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        site: user.site,
        secteur: user.secteur,
        service: user.service
      }
    });

  } catch (error) {
    console.error('❌ Debug token error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug token failed',
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    });
  }
});

// Add this simple test route to verify your authentication
router.get('/test-auth', flexibleAuth, (req, res) => {
  console.log('🔧 TEST AUTH endpoint reached');
  console.log('🔧 User from middleware:', req.userInfo);
  
  res.json({
    success: true,
    message: 'Authentication test successful',
    user: req.userInfo,
    timestamp: new Date().toISOString()
  });
});


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

// Debug endpoint pour analyser les tokens
router.post('/debug-token', (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token requis'
      });
    }

    // Décoder le token sans vérification pour voir son contenu
    const decoded = jwt.decode(token, { complete: true });

    res.json({
      success: true,
      message: 'Token décodé avec succès',
      data: {
        header: decoded?.header,
        payload: decoded?.payload,
        expectedIssuer: jwtConfig.issuer,
        expectedAudience: jwtConfig.audience
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors du décodage du token',
      error: error.message
    });
  }
});

export default router;
