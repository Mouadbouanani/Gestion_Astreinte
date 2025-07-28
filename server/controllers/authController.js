import User from '../models/User.js';
import { generateToken, generateRefreshToken, verifyToken, validatePassword } from '../config/auth.js';
import bcrypt from 'bcryptjs';

// Connexion utilisateur
export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.validatedData;

    // Trouver l'utilisateur avec le mot de passe
    const user = await User.findOne({ email }).select('+password').populate('site secteur service');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier si le compte est verrouillé
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Compte temporairement verrouillé. Réessayez plus tard.',
        lockUntil: user.lockUntil
      });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administrateur.'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Incrémenter les tentatives de connexion
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Réinitialiser les tentatives de connexion en cas de succès
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    // Générer les tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Préparer la réponse utilisateur (sans mot de passe)
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      site: user.site,
      secteur: user.secteur,
      service: user.service,
      isActive: user.isActive,
      lastLogin: user.lastLogin
    };

    // Configuration du cookie pour le refresh token
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 7 jours ou 24h
    };

    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: userResponse,
        accessToken,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Déconnexion utilisateur
export const logout = async (req, res) => {
  try {
    // Supprimer le cookie refresh token
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur de déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Rafraîchir le token d'accès
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token manquant'
      });
    }

    // Vérifier le refresh token
    const decoded = verifyToken(refreshToken);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    // Trouver l'utilisateur
    const user = await User.findById(decoded.id).populate('site secteur service');

    if (!user || !user.isActive || user.isLocked) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur invalide ou compte désactivé'
      });
    }

    // Générer un nouveau token d'accès
    const newAccessToken = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Token rafraîchi avec succès',
      data: {
        accessToken: newAccessToken,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      res.clearCookie('refreshToken');
      return res.status(401).json({
        success: false,
        message: 'Refresh token expiré',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }

    console.error('Erreur de rafraîchissement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir les informations de l'utilisateur connecté
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('site', 'name code address')
      .populate('secteur', 'name code')
      .populate('service', 'name code')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          site: user.site,
          secteur: user.secteur,
          service: user.service,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Changer le mot de passe
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation des données
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Les mots de passe ne correspondent pas'
      });
    }

    // Valider le nouveau mot de passe
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe invalide',
        errors: passwordValidation.errors
      });
    }

    // Trouver l'utilisateur avec le mot de passe
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    // Vérifier l'ancien mot de passe
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Mettre à jour le profil utilisateur
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const userId = req.user.id;

    // Validation des données
    if (!firstName && !lastName && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un champ doit être fourni'
      });
    }

    // Préparer les données à mettre à jour
    const updateData = {};
    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (phone) updateData.phone = phone.trim();

    // Mettre à jour l'utilisateur
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('site', 'name code')
    .populate('secteur', 'name code')
    .populate('service', 'name code')
    .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          site: user.site,
          secteur: user.secteur,
          service: user.service,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          updatedAt: user.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Vérifier le statut de l'authentification
export const checkAuth = async (req, res) => {
  try {
    // Si nous arrivons ici, c'est que le middleware d'authentification a réussi
    res.status(200).json({
      success: true,
      message: 'Utilisateur authentifié',
      data: {
        authenticated: true,
        user: {
          id: req.user.id,
          role: req.user.role,
          permissions: req.user.permissions,
          scope: req.user.scope
        }
      }
    });

  } catch (error) {
    console.error('Erreur vérification auth:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

export default {
  login,
  logout,
  refreshToken,
  getMe,
  changePassword,
  updateProfile,
  checkAuth
};
