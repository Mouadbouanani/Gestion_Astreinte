import express from 'express';
// Use the same JWT middleware as auth-jwt routes to avoid token format mismatch
import { authenticateToken } from '../middleware/jwt-auth.js';
import {
  createIndisponibilite,
  getMesIndisponibilites,
  getIndisponibilites,
  getIndisponibilite,
  updateIndisponibilite,
  deleteIndisponibilite,
  approuverIndisponibilite,
  refuserIndisponibilite,
  annulerIndisponibilite,
  getRemplacants
} from '../controllers/indisponibiliteController.js';
import { validateIndisponibiliteCreation } from '../middleware/validation.js';

const router = express.Router();

// Submit an unavailability (self)
router.post('/', authenticateToken, validateIndisponibiliteCreation, createIndisponibilite);

// List my unavailabilities
router.get('/my', authenticateToken, getMesIndisponibilites);

// List (managers)
router.get('/', authenticateToken, getIndisponibilites);

// Get single indisponibilité
router.get('/:id', authenticateToken, getIndisponibilite);

// Update indisponibilité (owner only, en_attente status only)
router.put('/:id', authenticateToken, validateIndisponibiliteCreation, updateIndisponibilite);

// Delete indisponibilité (owner or admin, en_attente/refuse status only)
router.delete('/:id', authenticateToken, deleteIndisponibilite);

// Suggestions de remplaçants
router.get('/:id/remplacants', authenticateToken, getRemplacants);

// Approve/Reject
router.patch('/:id/approve', authenticateToken, approuverIndisponibilite);
router.patch('/:id/reject', authenticateToken, refuserIndisponibilite);

// Cancel (owner or admin)
router.patch('/:id/cancel', authenticateToken, annulerIndisponibilite);

export default router;

