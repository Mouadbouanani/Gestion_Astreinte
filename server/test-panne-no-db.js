import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5050;

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174'
  ],
  credentials: true
}));

// Mock middleware for testing (bypass authentication)
app.use((req, res, next) => {
  req.user = { _id: 'test-user-id', firstName: 'Test', lastName: 'User' };
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
  },
  {
    _id: '3',
    titre: 'Maintenance préventive',
    description: 'Maintenance programmée du système électrique',
    type: 'maintenance',
    urgence: 'faible',
    statut: 'resolue',
    priorite: 'normale',
    dateCreation: new Date(Date.now() - 48 * 60 * 60 * 1000),
    dateResolution: new Date(Date.now() - 24 * 60 * 60 * 1000),
    site: { _id: 'site3', name: 'Jorf Lasfar', code: 'JLF' },
    secteur: { _id: 'secteur3', name: 'Engrais', code: 'ENG' },
    declaredBy: { _id: 'user3', firstName: 'Mohammed', lastName: 'Tazi' }
  }
];

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Test server is running!',
    timestamp: new Date().toISOString()
  });
});

// Panne routes
app.get('/api/pannes/recentes', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const pannes = mockPannes.slice(0, parseInt(limit));
    console.log(`📋 Returning ${pannes.length} recent pannes`);
    res.json({ success: true, data: pannes });
  } catch (error) {
    console.error('❌ Error in /api/pannes/recentes:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/api/pannes', (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit);
    const pannes = mockPannes.slice(start, end);
    
    console.log(`📋 Returning ${pannes.length} pannes (page ${page})`);
    
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
  } catch (error) {
    console.error('❌ Error in /api/pannes:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/api/pannes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const panne = mockPannes.find(p => p._id === id);
    
    if (!panne) {
      console.log(`❌ Panne not found: ${id}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Panne non trouvée.' 
      });
    }
    
    console.log(`📋 Returning panne: ${id}`);
    res.json({ success: true, data: panne });
  } catch (error) {
    console.error('❌ Error in /api/pannes/:id:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/pannes', (req, res) => {
  try {
    const { titre, description, type, urgence, priorite } = req.body;
    
    console.log('🚨 Creating new panne:', { titre, description, type, urgence, priorite });
    
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
    
    console.log(`✅ Panne created: ${newPanne._id}`);
    
    res.status(201).json({ 
      success: true, 
      message: 'Panne déclarée avec succès',
      data: newPanne 
    });
  } catch (error) {
    console.error('❌ Error in POST /api/pannes:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.put('/api/pannes/:id/statut', (req, res) => {
  try {
    const { id } = req.params;
    const { statut, commentaire } = req.body;
    
    console.log(`🔄 Updating panne ${id} status to: ${statut}`);
    
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
    
    console.log(`✅ Panne ${id} status updated to: ${statut}`);
    
    res.json({ 
      success: true, 
      message: 'Statut de la panne mis à jour avec succès',
      data: panne 
    });
  } catch (error) {
    console.error('❌ Error in PUT /api/pannes/:id/statut:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/pannes/:id/commentaires', (req, res) => {
  try {
    const { id } = req.params;
    const { texte } = req.body;
    
    console.log(`💬 Adding comment to panne ${id}: ${texte}`);
    
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
    
    console.log(`✅ Comment added to panne ${id}`);
    
    res.json({ 
      success: true, 
      message: 'Commentaire ajouté avec succès',
      data: panne 
    });
  } catch (error) {
    console.error('❌ Error in POST /api/pannes/:id/commentaires:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Dashboard stats route
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const stats = {
      totalSites: 8,
      totalSecteurs: 40,
      totalServices: 112,
      totalUsers: 18,
      recentPannes: mockPannes.slice(0, 5)
    };
    
    console.log('📊 Returning dashboard stats');
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('❌ Error in /api/dashboard/stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📋 Available routes:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/dashboard/stats`);
  console.log(`   GET  /api/pannes/recentes`);
  console.log(`   GET  /api/pannes`);
  console.log(`   POST /api/pannes`);
  console.log(`   GET  /api/pannes/:id`);
  console.log(`   PUT  /api/pannes/:id/statut`);
  console.log(`   POST /api/pannes/:id/commentaires`);
  console.log(`\n🧪 Test with:`);
  console.log(`   curl http://localhost:${PORT}/health`);
  console.log(`   curl http://localhost:${PORT}/api/pannes/recentes`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/pannes -H "Content-Type: application/json" -d '{"titre":"Test","description":"Test description"}'`);
});













