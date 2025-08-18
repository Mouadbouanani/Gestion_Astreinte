import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  getPannesRecentes,
  getAllPannes,
  declarerPanne,
  updateStatutPanne,
  getPanneById,
  addCommentToPanne,
} from '../controllers/panneController.js';

const router = express.Router();

// Get recent pannes (accessible by any authenticated user)
router.get('/recentes', authenticateToken, getPannesRecentes);

// Get all pannes with filters and pagination (accessible by any authenticated user)
router.get('/', authenticateToken, getAllPannes);

// Get panne by ID (accessible by any authenticated user)
router.get('/:id', authenticateToken, getPanneById);

// Declare a new panne (accessible by any authenticated user)
router.post('/', declarerPanne);

// Update panne statut (accessible by admin, chef_secteur, chef_service)
router.put(
  '/:id/statut',
  authenticateToken,
  requireRole('admin', 'chef_secteur', 'chef_service'),
  updateStatutPanne
);

// Add comment to panne (accessible by any authenticated user)
router.post('/:id/commentaires', authenticateToken , addCommentToPanne);

export default router;
