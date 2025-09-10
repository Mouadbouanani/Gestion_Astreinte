import express from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/jwt-auth.js';
import { requireAdmin } from '../middleware/roleAuth.js';
import {
  getHolidaysByYear,
  addHoliday,
  updateHoliday,
  deleteHoliday,
  initializeFixedHolidays
} from '../controllers/planningController.js'; // Ou créer un holidayController séparé

const router = express.Router();

// Validation rules for holiday creation
const createHolidayValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('date')
    .isISO8601()
    .toDate()

    .withMessage('Date invalide (format ISO8601 requis)'),
  body('type')
    .isIn(['fixed', 'islamic', 'variable'])
    .withMessage('Type invalide (fixed, islamic, ou variable)'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La description ne peut pas dépasser 500 caractères')
];

// Validation rules for holiday update
const updateHolidayValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Date invalide (format ISO8601 requis)'),
  body('type')
    .optional()
    .isIn(['fixed', 'islamic', 'variable'])
    .withMessage('Type invalide (fixed, islamic, ou variable)'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La description ne peut pas dépasser 500 caractères'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive doit être un booléen')
];

/**
 * @route   GET /api/holidays
 * @desc    Get all holidays with optional filtering
 * @access  Private (any authenticated user)
 */
router.get('/', authenticateToken, getAllHolidays);

/**
 * @route   GET /api/holidays/year/:year
 * @desc    Get holidays for a specific year
 * @access  Private (any authenticated user)
 */
router.get('/year/:year', authenticateToken, getHolidaysByYear);

/**
 * @route   POST /api/holidays
 * @desc    Create new holiday
 * @access  Private (Admin only)
 */
router.post('/',
  authenticateToken,
  requireAdmin,
  createHolidayValidation,
  addHoliday
);

/**
 * @route   PUT /api/holidays/:id
 * @desc    Update holiday
 * @access  Private (Admin only)
 */
router.put('/:id',
  authenticateToken,
  requireAdmin,
  updateHolidayValidation,
  updateHoliday
);

/**
 * @route   DELETE /api/holidays/:id
 * @desc    Delete holiday
 * @access  Private (Admin only)
 */
router.delete('/:id',
  authenticateToken,
  requireAdmin,
  deleteHoliday
);

/**
 * @route   POST /api/holidays/initialize
 * @desc    Initialize fixed holidays for a year
 * @access  Private (Admin only)
 */
router.post('/initialize',
  authenticateToken,
  requireAdmin,
  [
    body('year')
      .isInt({ min: 2020, max: 2050 })
      .withMessage('Année invalide (entre 2020 et 2050)')
  ],
  initializeFixedHolidays
);

export default router;
