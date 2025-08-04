import express from 'express';
import { body } from 'express-validator';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleAuth.js';

const router = express.Router();

// Validation rules for user creation
const createUserValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('phone')
    .matches(/^(\+212|0)[5-7][0-9]{8}$/)
    .withMessage('Numéro de téléphone marocain invalide'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  body('role')
    .isIn(['admin', 'chef_secteur', 'ingenieur', 'chef_service', 'collaborateur'])
    .withMessage('Rôle invalide'),
  body('site')
    .isMongoId()
    .withMessage('ID de site invalide'),
  body('secteur')
    .optional()
    .isMongoId()
    .withMessage('ID de secteur invalide'),
  body('service')
    .optional()
    .isMongoId()
    .withMessage('ID de service invalide'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('L\'adresse ne peut pas dépasser 200 caractères')
];

// Validation rules for user update
const updateUserValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('phone')
    .optional()
    .matches(/^(\+212|0)[5-7][0-9]{8}$/)
    .withMessage('Numéro de téléphone marocain invalide'),
  body('role')
    .optional()
    .isIn(['admin', 'chef_secteur', 'ingenieur', 'chef_service', 'collaborateur'])
    .withMessage('Rôle invalide'),
  body('site')
    .optional()
    .isMongoId()
    .withMessage('ID de site invalide'),
  body('secteur')
    .optional()
    .isMongoId()
    .withMessage('ID de secteur invalide'),
  body('service')
    .optional()
    .isMongoId()
    .withMessage('ID de service invalide'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('L\'adresse ne peut pas dépasser 200 caractères'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive doit être un booléen')
];

/**
 * @route   GET /api/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (Admin, Chef Secteur)
 */
router.get('/', 
  authenticateToken, 
  checkRole(['admin', 'chef_secteur', 'chef_service']), 
  getUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private (Admin, Chef Secteur, or own profile)
 */
router.get('/:id', 
  authenticateToken, 
  getUserById
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
router.post('/', 
  authenticateToken, 
  checkRole(['admin']), 
  createUserValidation,
  createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin, Chef Secteur, or own profile)
 */
router.put('/:id', 
  authenticateToken, 
  updateUserValidation,
  updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', 
  authenticateToken, 
  checkRole(['admin']), 
  deleteUser
);

export default router;
