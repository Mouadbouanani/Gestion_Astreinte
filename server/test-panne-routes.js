import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple test server for panne routes
const app = express();
const PORT = 5050;

// Middleware
app.use(express.json());

// Mock middleware for testing
app.use((req, res, next) => {
  req.user = { _id: 'test-user-id' };
  next();
});

// Import and use panne routes
import panneRoutes from './routes/pannes.js';
app.use('/api/pannes', panneRoutes);

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test server is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📋 Test panne routes:`);
  console.log(`   GET  /api/pannes/recentes`);
  console.log(`   GET  /api/pannes`);
  console.log(`   POST /api/pannes`);
  console.log(`   GET  /api/pannes/:id`);
  console.log(`   PUT  /api/pannes/:id/statut`);
  console.log(`   POST /api/pannes/:id/commentaires`);
  console.log(`\n🧪 Test with: curl http://localhost:${PORT}/test`);
});













