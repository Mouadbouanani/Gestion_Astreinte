import express from 'express';

const app = express();
const PORT = 5050;

// Middleware
app.use(express.json());

// Mock middleware for testing
app.use((req, res, next) => {
  req.user = { _id: 'test-user-id' };
  next();
});

// Mock panne data
const mockPannes = [
  {
    _id: '1',
    titre: 'Panne système de refroidissement',
    description: 'Le système de refroidissement principal ne fonctionne plus',
    type: 'technique',
    urgence: 'critique',
    statut: 'declaree',
    priorite: 'urgente',
    dateCreation: new Date(),
    site: { _id: 'site1', name: 'Khouribga', code: 'KHB' },
    secteur: { _id: 'secteur1', name: 'Production', code: 'PROD' },
    declaredBy: { _id: 'user1', firstName: 'Ahmed', lastName: 'Benali' }
  },
  {
    _id: '2',
    titre: 'Problème de sécurité',
    description: 'Porte de sécurité défaillante',
    type: 'securite',
    urgence: 'haute',
    statut: 'en_cours',
    priorite: 'elevee',
    dateCreation: new Date(Date.now() - 24 * 60 * 60 * 1000),
    site: { _id: 'site2', name: 'Safi', code: 'SAF' },
    secteur: { _id: 'secteur2', name: 'Chimie', code: 'CHIM' },
    declaredBy: { _id: 'user2', firstName: 'Fatima', lastName: 'Alaoui' }
  }
];

// Panne routes
app.get('/api/pannes/recentes', (req, res) => {
  const { limit = 10 } = req.query;
  const pannes = mockPannes.slice(0, parseInt(limit));
  res.json({ success: true, data: pannes });
});

app.get('/api/pannes', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const start = (parseInt(page) - 1) * parseInt(limit);
  const end = start + parseInt(limit);
  const pannes = mockPannes.slice(start, end);
  
  res.json({ 
    success: true, 
    data: pannes,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: mockPannes.length,
      pages: Math.ceil(mockPannes.length / parseInt(limit))
    }
  });
});

app.get('/api/pannes/:id', (req, res) => {
  const { id } = req.params;
  const panne = mockPannes.find(p => p._id === id);
  
  if (!panne) {
    return res.status(404).json({ 
      success: false, 
      message: 'Panne non trouvée.' 
    });
  }
  
  res.json({ success: true, data: panne });
});

app.post('/api/pannes', (req, res) => {
  const { titre, description, type, urgence, priorite } = req.body;
  
  if (!titre || !description) {
    return res.status(400).json({ 
      success: false, 
      message: 'Veuillez fournir un titre et une description.' 
    });
  }
  
  const newPanne = {
    _id: Date.now().toString(),
    titre: titre.trim(),
    description: description.trim(),
    type: type || 'technique',
    urgence: urgence || 'moyenne',
    statut: 'declaree',
    priorite: priorite || 'normale',
    dateCreation: new Date(),
    declaredBy: { _id: 'user1', firstName: 'Test', lastName: 'User' }
  };
  
  mockPannes.unshift(newPanne);
  
  res.status(201).json({ 
    success: true, 
    message: 'Panne déclarée avec succès',
    data: newPanne 
  });
});

app.put('/api/pannes/:id/statut', (req, res) => {
  const { id } = req.params;
  const { statut, commentaire } = req.body;
  
  const panne = mockPannes.find(p => p._id === id);
  if (!panne) {
    return res.status(404).json({ 
      success: false, 
      message: 'Panne non trouvée.' 
    });
  }
  
  panne.statut = statut;
  if (statut === 'resolue') {
    panne.dateResolution = new Date();
  }
  
  res.json({ 
    success: true, 
    message: 'Statut de la panne mis à jour avec succès',
    data: panne 
  });
});

app.post('/api/pannes/:id/commentaires', (req, res) => {
  const { id } = req.params;
  const { texte } = req.body;
  
  const panne = mockPannes.find(p => p._id === id);
  if (!panne) {
    return res.status(404).json({ 
      success: false, 
      message: 'Panne non trouvée.' 
    });
  }
  
  if (!panne.commentaires) {
    panne.commentaires = [];
  }
  
  panne.commentaires.push({
    _id: Date.now().toString(),
    texte: texte.trim(),
    auteur: { _id: 'user1', firstName: 'Test', lastName: 'User' },
    date: new Date()
  });
  
  res.json({ 
    success: true, 
    message: 'Commentaire ajouté avec succès',
    data: panne 
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test server is running!',
    routes: [
      'GET /api/pannes/recentes',
      'GET /api/pannes',
      'POST /api/pannes',
      'GET /api/pannes/:id',
      'PUT /api/pannes/:id/statut',
      'POST /api/pannes/:id/commentaires'
    ]
  });
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
  console.log(`🧪 Test panne creation: curl -X POST http://localhost:${PORT}/api/pannes -H "Content-Type: application/json" -d '{"titre":"Test","description":"Test description"}'`);
});

