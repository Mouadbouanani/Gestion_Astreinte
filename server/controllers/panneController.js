import Panne from '../models/Panne.js';

// Get recent pannes
export const getPannesRecentes = async (req, res) => {
  try {
    const pannes = await Panne.find({ statut: { $ne: 'resolue' } })
      .sort({ dateCreation: -1 })
      .limit(req.query.limit ? parseInt(req.query.limit) : 10)
      .populate('declaredBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('site', 'nom')
      .populate('secteur', 'nom')
      .populate('service', 'nom');
      
    res.json({ success: true, data: pannes });
  } catch (error) {
    console.error('Erreur récupération pannes:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération des pannes.' });
  }
};

// Get all pannes with filters and pagination
export const getAllPannes = async (req, res) => {
  try {
    const { statut, urgence, type, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = {};
    if (statut) filter.statut = statut;
    if (urgence) filter.urgence = urgence;
    if (type) filter.type = type;

    const skip = (page - 1) * limit;
    
    const pannes = await Panne.find(filter)
      .sort({ dateCreation: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('declaredBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('site', 'nom')
      .populate('secteur', 'nom')
      .populate('service', 'nom');
    
    const total = await Panne.countDocuments(filter);
    
    res.json({ 
      success: true, 
      data: pannes,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: pannes.length,
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Erreur récupération toutes pannes:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération des pannes.' });
  }
};

// Get panne by ID
export const getPanneById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const panne = await Panne.findById(id)
      .populate('declaredBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('site', 'nom')
      .populate('secteur', 'nom')
      .populate('service', 'nom')
      .populate('commentaires.auteur', 'firstName lastName email');
      
    if (!panne) {
      return res.status(404).json({ success: false, message: 'Panne non trouvée.' });
    }
    
    res.json({ success: true, data: panne });
  } catch (error) {
    console.error('Erreur récupération panne par ID:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération de la panne.' });
  }
};

// Declare a new panne
export const declarerPanne = async (req, res) => {
  try {
    const { titre, description, urgence, type, site, secteur, service } = req.body;

    if (!titre || !description || !urgence) {
      return res.status(400).json({ success: false, message: 'Veuillez fournir un titre, une description et un niveau d\'urgence.' });
    }

    const newPanne = new Panne({
      titre,
      description,
      urgence,
      type: type || 'technique',
      site,
      secteur,
      service,
      statut: 'declaree', // Use 'declaree' as default to match your schema
      dateCreation: new Date(),
      declaredBy: req.user ? req.user._id : null, // Store ObjectId instead of string
    });

    const savedPanne = await newPanne.save();
    
    // Populate references before sending response
    await savedPanne.populate([
      { path: 'declaredBy', select: 'firstName lastName email' },
      { path: 'site', select: 'nom' },
      { path: 'secteur', select: 'nom' },
      { path: 'service', select: 'nom' }
    ]);
    
    res.status(201).json({ success: true, data: savedPanne });
  } catch (error) {
    console.error('Erreur déclaration panne:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la déclaration de la panne.' });
  }
};

// Update panne statut
export const updateStatutPanne = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    // Updated to include 'declaree' status from your schema
    if (!statut || !['declaree', 'ouverte', 'en_cours', 'resolue'].includes(statut)) {
      return res.status(400).json({ success: false, message: 'Statut invalide.' });
    }

    const panne = await Panne.findById(id);
    if (!panne) {
      return res.status(404).json({ success: false, message: 'Panne non trouvée.' });
    }

    panne.statut = statut;
    
    // Set resolution date when status is 'resolue'
    if (statut === 'resolue') {
      panne.dateResolution = new Date();
    } else if (panne.dateResolution) {
      // Clear resolution date if status changes from 'resolue' to something else
      panne.dateResolution = null;
    }

    const updatedPanne = await panne.save();
    res.json({ success: true, data: updatedPanne });
  } catch (error) {
    console.error('Erreur mise à jour statut panne:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la mise à jour du statut de la panne.' });
  }
};

// Add comment to panne
export const addCommentToPanne = async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;

    if (!commentaire || commentaire.trim() === '') {
      return res.status(400).json({ success: false, message: 'Le commentaire ne peut pas être vide.' });
    }

    const panne = await Panne.findById(id);
    if (!panne) {
      return res.status(404).json({ success: false, message: 'Panne non trouvée.' });
    }

    const nouveauCommentaire = {
      texte: commentaire,
      auteur: req.user ? req.user._id : null, // Store user ObjectId instead of name string
      date: new Date() // Use 'date' to match your schema
    };

    panne.commentaires.push(nouveauCommentaire);
    const updatedPanne = await panne.save();
    
    // Populate the commentaires to return user details
    await updatedPanne.populate('commentaires.auteur', 'firstName lastName email');
    
    res.json({ success: true, data: updatedPanne });
  } catch (error) {
    console.error('Erreur ajout commentaire:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de l\'ajout du commentaire.' });
  }
};