import express from 'express';
import { authenticateToken } from '../middleware/jwt-auth.js';
import {
  listPlannings,
  createPlanning,
  generatePlanning,
  validatePlanning,
  deletePlanning,
  verifierDoublePlanning,
  resoudreConflits
} from '../controllers/planningController.js';

const router = express.Router();

// List plannings (any authenticated user can view filtered lists)
router.get('/',  listPlannings);

// Create a planning (admins, chef_secteur, chef_service)
router.post('/', authenticateToken, createPlanning);

// Generate planning with fair rotation for service or secteur
router.post('/generate', authenticateToken, generatePlanning);

// Validate a planning
router.put('/:id/validate', authenticateToken, validatePlanning);

// Delete a planning
router.delete('/:id', authenticateToken, deletePlanning);

// Verify double planning rules (UML diagram step)
router.post('/:id/verifier-double-planning', authenticateToken, verifierDoublePlanning);

// Resolve conflicts automatically
router.post('/:id/resoudre-conflits', authenticateToken, resoudreConflits);

export default router;

