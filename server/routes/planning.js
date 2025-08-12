import express from 'express';
import { authenticateToken } from '../middleware/jwt-auth.js';
import { getAssignments } from '../controllers/planningController.js';

const router = express.Router();

// GET /api/planning/assignments?siteId=&secteurId=&serviceId=&from=YYYY-MM-DD&to=YYYY-MM-DD
import {
  createPlanning,
  listPlannings,
  getPlanning,
  addGarde,
  deleteGarde,
  replaceGarde,
  submitPlanning,
  approvePlanning,
  rejectPlanning,
  publishPlanning,
  conflictsForPlanning,
  generatePlanning
} from '../controllers/planningController.js';

// CRUD planning
router.post('/', authenticateToken, createPlanning);
router.get('/', authenticateToken, listPlannings);
router.get('/:id', authenticateToken, getPlanning);

// Gardes
router.post('/:id/gardes', authenticateToken, addGarde);
router.delete('/:id/gardes/:gardeId', authenticateToken, deleteGarde);
router.patch('/:id/gardes/:gardeId/replace', authenticateToken, replaceGarde);

// Workflow
router.post('/:id/submit', authenticateToken, submitPlanning);
router.post('/:id/approve', authenticateToken, approvePlanning);
router.post('/:id/reject', authenticateToken, rejectPlanning);
router.post('/:id/publish', authenticateToken, publishPlanning);

// Conflits & Génération
router.get('/:id/conflits', authenticateToken, conflictsForPlanning);
router.post('/generate', authenticateToken, generatePlanning);

router.get('/assignments', authenticateToken, getAssignments);

export default router;

