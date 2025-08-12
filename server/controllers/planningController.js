import Planning from '../models/Planning.js';
import User from '../models/User.js';
import Indisponibilite from '../models/Indisponibilite.js';
import Site from '../models/Site.js';
import Secteur from '../models/Secteur.js';
import Service from '../models/Service.js';

export const getAssignments = async (req, res) => {
  try {
    const { siteId, secteurId, serviceId, from, to } = req.query;

    // Parse dates with sensible defaults
    const fromDate = from ? new Date(from) : new Date();
    const toDate = to ? new Date(to) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Paramètres de date invalides' });
    }

    // Build planning query
    const q = {
      'periode.debut': { $lte: toDate },
      'periode.fin': { $gte: fromDate },
      statut: { $in: ['valide', 'publie', 'en_validation', 'brouillon'] }
    };
    if (siteId) q.site = siteId;
    if (secteurId) q.secteur = secteurId;
    if (serviceId) q.service = serviceId;

    const plannings = await Planning.find(q)
      .populate('site', 'name code')
      .populate('secteur', 'name code')
      .populate('service', 'name code')
      .populate('gardes.utilisateur', 'firstName lastName role email');

    // Flatten to assignment records expected by the frontend calendar
    const assignments = [];
    for (const p of plannings) {
      for (const g of p.gardes) {
        // Keep only guards in requested date window
        if (g.date < fromDate || g.date > toDate) continue;

        const user = g.utilisateur || {};
        const role = user.role || 'collaborateur';
        assignments.push({
          id: g._id,
          date: g.date.toISOString().split('T')[0],
          type: role === 'ingenieur' ? 'ingenieur' : 'collaborateur',
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          },
          site: p.site ? { id: p.site._id, name: p.site.name } : { id: p.site, name: undefined },
          secteur: p.secteur ? { id: p.secteur._id, name: p.secteur.name } : { id: p.secteur, name: undefined },
          service: p.service ? { id: p.service._id, name: p.service.name } : { id: p.service, name: undefined },
          shift: (g.date.getDay() === 0 || g.date.getDay() === 6) ? 'weekend' : 'day'
        });
      }
    }

    return res.json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    console.error('Erreur récupération planning:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du planning', error: error.message });
  }
};



// Create a planning with role-based validation
export const createPlanning = async (req, res) => {
  try {
    const { type, periode, site, secteur, service, metadata } = req.body;
    const user = req.user;

    if (!type || !periode?.debut || !periode?.fin || !site || !secteur) {
      return res.status(400).json({ success: false, message: 'Champs requis manquants' });
    }
    if (type === 'service' && !service) {
      return res.status(400).json({ success: false, message: 'Service requis pour un planning de type service' });
    }

    // Role-based validation
    if (user.role === 'admin') {
      // Admin can create any planning - no restrictions
    } else if (user.role === 'chef_secteur') {
      // Chef secteur can only create plannings for their secteur
      if (secteur !== user.secteur._id.toString()) {
        return res.status(403).json({ success: false, message: 'Vous ne pouvez créer des plannings que pour votre secteur' });
      }
    } else if (user.role === 'chef_service') {
      // Chef service can only create service plannings for their service
      if (type !== 'service' || service !== user.service._id.toString()) {
        return res.status(403).json({ success: false, message: 'Vous ne pouvez créer que des plannings de service pour votre service' });
      }
    } else {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    const planning = await Planning.create({
      type,
      periode: { debut: new Date(periode.debut), fin: new Date(periode.fin) },
      site,
      secteur,
      service: type === 'service' ? service : undefined,
      statut: 'brouillon',
      metadata: metadata || undefined,
      createdBy: user._id
    });

    res.status(201).json({ success: true, data: planning });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur création planning', error: error.message });
  }
};

// List plannings with role-based filtering
export const listPlannings = async (req, res) => {
  try {
    const { siteId, secteurId, serviceId, statut, type } = req.query;
    const user = req.user;

    // Build base query
    const q = {};
    if (siteId) q.site = siteId;
    if (secteurId) q.secteur = secteurId;
    if (serviceId) q.service = serviceId;
    if (statut) q.statut = statut;
    if (type) q.type = type;

    // Apply role-based filtering
    if (user.role === 'admin') {
      // Admin can see all plannings - no additional filter
    } else if (user.role === 'chef_secteur') {
      // Chef secteur can only see plannings for their secteur
      q.secteur = user.secteur._id;
    } else if (user.role === 'chef_service') {
      // Chef service can only see plannings for their service
      q.service = user.service._id;
      q.type = 'service'; // Only service-type plannings
    } else {
      // Other roles cannot list plannings
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    const docs = await Planning.find(q)
      .populate('site', 'name code')
      .populate('secteur', 'name code')
      .populate('service', 'name code')
      .sort({ 'periode.debut': -1 });

    res.json({ success: true, count: docs.length, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur liste planning', error: error.message });
  }
};

export const getPlanning = async (req, res) => {
  try {
    const p = await Planning.findById(req.params.id)
      .populate('site secteur service')
      .populate('gardes.utilisateur', 'firstName lastName role');
    if (!p) return res.status(404).json({ success: false, message: 'Planning introuvable' });
    res.json({ success: true, data: p });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur récupération planning', error: error.message });
  }
};

// Add a guard day
export const addGarde = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, utilisateur, heureDebut, heureFin, commentaire } = req.body;
    const planning = await Planning.findById(id);
    if (!planning) return res.status(404).json({ success: false, message: 'Planning introuvable' });

    const d = new Date(date);
    if (d < planning.periode.debut || d > planning.periode.fin) {
      return res.status(400).json({ success: false, message: 'Date hors période' });
    }

    // Ensure no duplicate for that date
    const exists = planning.gardes.find(g => g.date.toDateString() === d.toDateString());
    if (exists) return res.status(400).json({ success: false, message: 'Une garde existe déjà pour cette date' });

    planning.gardes.push({ date: d, utilisateur, heureDebut, heureFin, commentaire });
    await planning.save();
    res.status(201).json({ success: true, data: planning });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur ajout garde', error: error.message });
  }
};

export const deleteGarde = async (req, res) => {
  try {
    const { id, gardeId } = req.params;
    const planning = await Planning.findById(id);
    if (!planning) return res.status(404).json({ success: false, message: 'Planning introuvable' });

    const garde = planning.gardes.id(gardeId);
    if (!garde) return res.status(404).json({ success: false, message: 'Garde introuvable' });

    garde.deleteOne();
    await planning.save();
    res.json({ success: true, data: planning });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur suppression garde', error: error.message });
  }
};

export const replaceGarde = async (req, res) => {
  try {
    const { id, gardeId } = req.params;
    const { remplacant, motif } = req.body;
    const planning = await Planning.findById(id);
    if (!planning) return res.status(404).json({ success: false, message: 'Planning introuvable' });

    const garde = planning.gardes.id(gardeId);
    if (!garde) return res.status(404).json({ success: false, message: 'Garde introuvable' });

    garde.remplacant = remplacant;
    garde.statut = 'remplace';
    garde.commentaire = motif || 'Remplacement';
    await planning.save();

    res.json({ success: true, data: planning });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur remplacement garde', error: error.message });
  }
};

export const submitPlanning = async (req, res) => {
  try {
    const planning = await Planning.findById(req.params.id);
    if (!planning) return res.status(404).json({ success: false, message: 'Planning introuvable' });

    planning.statut = 'en_validation';
    planning.validation = planning.validation || {};
    planning.validation.demandePar = req.user._id;
    planning.validation.demandeLe = new Date();

    await planning.save();
    res.json({ success: true, data: planning });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur soumission planning', error: error.message });
  }
};

export const approvePlanning = async (req, res) => {
  try {
    const planning = await Planning.findById(req.params.id);
    if (!planning) return res.status(404).json({ success: false, message: 'Planning introuvable' });

    planning.statut = 'valide';
    planning.validation = planning.validation || {};
    planning.validation.validePar = req.user._id;
    planning.validation.valideLe = new Date();
    planning.validation.commentaireValidation = req.body?.commentaire;

    await planning.save();
    res.json({ success: true, data: planning });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur validation planning', error: error.message });
  }
};

export const rejectPlanning = async (req, res) => {
  try {
    const planning = await Planning.findById(req.params.id);
    if (!planning) return res.status(404).json({ success: false, message: 'Planning introuvable' });

    planning.validation = planning.validation || {};
    planning.validation.rejete = true;
    planning.validation.motifRejet = req.body?.motif || 'Non valide';
    planning.statut = 'brouillon';
    await planning.save();

    res.json({ success: true, data: planning });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur rejet planning', error: error.message });
  }
};

export const publishPlanning = async (req, res) => {
  try {
    const planning = await Planning.findById(req.params.id);
    if (!planning) return res.status(404).json({ success: false, message: 'Planning introuvable' });

    planning.statut = 'publie';
    await planning.save();

    res.json({ success: true, data: planning });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur publication planning', error: error.message });
  }
};

export const conflictsForPlanning = async (req, res) => {
  try {
    const planning = await Planning.findById(req.params.id);
    if (!planning) return res.status(404).json({ success: false, message: 'Planning introuvable' });

    const conflits = await planning.detecterConflits();
    res.json({ success: true, data: conflits });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur détection conflits', error: error.message });
  }
};

export const generatePlanning = async (req, res) => {
  try {
    const { type, site, secteur, service, from, to, includeWeekdays } = req.body;
    const user = req.user;

    if (!type || !site || !secteur || !from || !to) {
      return res.status(400).json({ success: false, message: 'Paramètres requis manquants' });
    }
    if (type === 'service' && !service) {
      return res.status(400).json({ success: false, message: 'Service requis pour type service' });
    }

    // Role-based validation (same as createPlanning)
    if (user.role === 'admin') {
      // Admin can generate any planning
    } else if (user.role === 'chef_secteur') {
      if (secteur !== user.secteur._id.toString()) {
        return res.status(403).json({ success: false, message: 'Vous ne pouvez générer des plannings que pour votre secteur' });
      }
    } else if (user.role === 'chef_service') {
      if (type !== 'service' || service !== user.service._id.toString()) {
        return res.status(403).json({ success: false, message: 'Vous ne pouvez générer que des plannings de service pour votre service' });
      }
    } else {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    const start = new Date(from);
    const end = new Date(to);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return res.status(400).json({ success: false, message: 'Période invalide' });
    }

    // Build candidate users based on planning type
    let users;
    if (type === 'secteur') {
      // For secteur planning: get engineers from the secteur
      users = await User.find({ role: 'ingenieur', secteur, isActive: true });
    } else {
      // For service planning: get collaborators and chef_service from the service
      users = await User.find({ service, isActive: true, role: { $in: ['collaborateur', 'chef_service'] } });
    }
    if (!users.length) return res.status(400).json({ success: false, message: 'Aucun utilisateur éligible trouvé' });

    // Create a new planning
    const planning = await Planning.create({
      type,
      periode: { debut: start, fin: end },
      site, secteur, service: type === 'service' ? service : undefined,
      statut: 'brouillon',
      createdBy: user._id,
      gardes: []
    });

    // Generate days to assign
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      if (isWeekend || includeWeekdays) days.push(new Date(d));
    }

    // Round-robin assignment respecting indisponibilités
    let idx = 0;
    for (const d of days) {
      const dateOnly = new Date(d.toISOString().split('T')[0]);
      // Try to assign to an available user
      let assigned = false;
      for (let attempts = 0; attempts < users.length && !assigned; attempts++) {
        const u = users[(idx + attempts) % users.length];
        const indispo = await Indisponibilite.findOne({
          utilisateur: u._id,
          dateDebut: { $lte: dateOnly },
          dateFin: { $gte: dateOnly },
          statut: { $in: ['approuve', 'en_attente'] }
        });
        if (!indispo) {
          planning.gardes.push({ date: new Date(dateOnly), utilisateur: u._id });
          idx = (idx + attempts + 1) % users.length;
          assigned = true;
        }
      }
      // If no one is available, assign to the next person anyway (with a note)
      if (!assigned && users.length > 0) {
        const u = users[idx % users.length];
        planning.gardes.push({
          date: new Date(dateOnly),
          utilisateur: u._id,
          commentaire: 'Assigné malgré indisponibilité - à vérifier'
        });
        idx = (idx + 1) % users.length;
      }
    }

    await planning.save();
    res.status(201).json({ success: true, data: planning });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur génération planning', error: error.message });
  }
};
