import Indisponibilite from '../models/Indisponibilite.js';
import User from '../models/User.js';

// Helpers
const canApprove = (approver, applicant) => {
  // Admin can approve all
  if (approver.role === 'admin') return { ok: true, niveau: 'automatique' };

  // Applicant is engineer -> chef_secteur must approve in same secteur
  if (applicant.role === 'ingenieur') {
    if (approver.role === 'chef_secteur' && approver.secteur?.toString() === applicant.secteur?.toString()) {
      return { ok: true, niveau: 'chef_secteur' };
    }
    return { ok: false, reason: 'Seul le chef de secteur du même secteur peut approuver une indisponibilité d\'ingénieur' };
  }

  // Applicant is collaborateur -> chef_service must approve in same service
  if (applicant.role === 'collaborateur') {
    if (approver.role === 'chef_service' && approver.service?.toString() === applicant.service?.toString()) {
      return { ok: true, niveau: 'chef_service' };
    }
    return { ok: false, reason: 'Seul le chef de service du même service peut approuver une indisponibilité de collaborateur' };
  }

  // Applicant is chef_service -> chef_secteur must approve
  if (applicant.role === 'chef_service') {
    if (approver.role === 'chef_secteur' && approver.secteur?.toString() === applicant.secteur?.toString()) {
      return { ok: true, niveau: 'chef_secteur' };
    }
    return { ok: false, reason: 'Seul le chef de secteur du même secteur peut approuver une indisponibilité de chef de service' };
  }

  // Applicant is chef_secteur -> admin must approve
  if (applicant.role === 'chef_secteur') {
    return { ok: false, reason: 'Seul l\'administrateur peut approuver une indisponibilité de chef de secteur' };
  }

  return { ok: false, reason: 'Règles d\'approbation inconnues' };
};

export const createIndisponibilite = async (req, res) => {
  try {
    const utilisateur = req.user?._id;
    if (!utilisateur) {
      return res.status(401).json({ success: false, message: 'Authentification requise' });
    }

    const { dateDebut, dateFin, motif, description, priorite } = req.body;

    if (!dateDebut || !dateFin || !motif) {
      return res.status(400).json({ success: false, message: 'Champs requis: dateDebut, dateFin, motif' });
    }

    // Create with minimal fields to avoid circular structure
    const nouvelle = new Indisponibilite({
      utilisateur,
      dateDebut: new Date(dateDebut),
      dateFin: new Date(dateFin),
      motif,
      description,
      priorite: priorite || 'normale',
      statut: 'en_attente'
    });

    // Save
    await nouvelle.save();

    // Optionally pre-compute planning impact
    try {
      await nouvelle.analyserImpactPlannings();
      nouvelle.impact.recalculNecessaire = true;
      await nouvelle.save();
    } catch (e) {
      console.warn('Analyse d\'impact planifications échouée (non bloquant):', e.message);
    }

    // Return clean object
    const result = {
      _id: nouvelle._id,
      utilisateur: nouvelle.utilisateur,
      dateDebut: nouvelle.dateDebut,
      dateFin: nouvelle.dateFin,
      motif: nouvelle.motif,
      description: nouvelle.description,
      priorite: nouvelle.priorite,
      statut: nouvelle.statut,
      impact: nouvelle.impact,
      createdAt: nouvelle.createdAt
    };

    res.status(201).json({ success: true, message: 'Indisponibilité créée', data: result });
  } catch (error) {
    console.error('Erreur création indisponibilité:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création', error: error.message });
  }
};

export const getMesIndisponibilites = async (req, res) => {
  try {
    const utilisateur = req.user?._id;
    if (!utilisateur) {
      return res.status(401).json({ success: false, message: 'Authentification requise' });
    }

    const { statut } = req.query;
    const filter = { utilisateur };
    if (statut) filter.statut = statut;

    const list = await Indisponibilite.find(filter)
      .populate('utilisateur', 'firstName lastName role service secteur')
      .sort({ dateDebut: -1 });

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Erreur récupération mes indisponibilités:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération', error: error.message });
  }
};

export const getIndisponibilites = async (req, res) => {
  try {
    const current = req.user;
    if (!current) return res.status(401).json({ success: false, message: 'Authentification requise' });

    const { statut, site, secteur, service, role, from, to } = req.query;
    const filter = {};

    if (statut) filter.statut = statut;
    if (from || to) {
      filter.$and = [];
      if (from) filter.$and.push({ dateFin: { $gte: new Date(from) } });
      if (to) filter.$and.push({ dateDebut: { $lte: new Date(to) } });
    }

    // Scope by role
    if (current.role === 'admin') {
      // no extra filter
    } else if (current.role === 'chef_secteur') {
      filter['$or'] = [
        { 'utilisateur': await userIdsBy({ secteur: current.secteur, role: 'ingenieur' }) },
        { 'utilisateur': await userIdsBy({ secteur: current.secteur, role: { $in: ['chef_service', 'collaborateur'] } }) }
      ];
    } else if (current.role === 'chef_service') {
      filter['utilisateur'] = await userIdsBy({ service: current.service });
    } else {
      // ingénieur/collaborateur: own only
      filter['utilisateur'] = current._id;
    }

    // Additional optional filters
    if (role || site || secteur || service) {
      const extra = await userIdsBy({ role, site, secteur, service });
      if (Array.isArray(filter['utilisateur'])) {
        filter['utilisateur'] = filter['utilisateur'].filter((id) => extra.some((e) => e.toString() === id.toString()));
      } else if (filter['utilisateur']) {
        if (!extra.some((e) => e.toString() === filter['utilisateur'].toString())) {
          // no match -> empty result
          return res.json({ success: true, data: [] });
        }
      } else if (filter['$or']) {
        // leave as is; already scoped
      } else {
        filter['utilisateur'] = extra;
      }
    }

    const list = await Indisponibilite.find(filter)
      .populate('utilisateur', 'firstName lastName role site secteur service')
      .populate('approbation.approuvePar', 'firstName lastName role')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Erreur récupération indisponibilités:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération', error: error.message });
  }
};

export const approuverIndisponibilite = async (req, res) => {
  try {
    const approbateur = req.user;
    const { id } = req.params;
    const { commentaire } = req.body;

    const ind = await Indisponibilite.findById(id).populate('utilisateur');
    if (!ind) return res.status(404).json({ success: false, message: 'Indisponibilité introuvable' });

    const can = canApprove(approbateur, ind.utilisateur);
    if (!can.ok) return res.status(403).json({ success: false, message: can.reason });

    // Approval
    ind.statut = 'approuve';
    ind.approbation = {
      approuvePar: approbateur._id,
      approuveLe: new Date(),
      commentaireApprobation: commentaire,
      niveauApprobation: can.niveau === 'automatique' ? (approbateur.role === 'admin' ? 'automatique' : approbateur.role) : can.niveau
    };

    // Analyse impact + marquer recalcul
    await ind.analyserImpactPlannings();
    ind.impact.recalculNecessaire = true;
    await ind.save();

    const result = {
      _id: ind._id,
      statut: ind.statut,
      approbation: ind.approbation,
      impact: ind.impact
    };

    res.json({ success: true, message: 'Indisponibilité approuvée', data: result });
  } catch (error) {
    console.error('Erreur approbation indisponibilité:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'approbation', error: error.message });
  }
};

export const refuserIndisponibilite = async (req, res) => {
  try {
    const approbateur = req.user;
    const { id } = req.params;
    const { motif } = req.body;

    const ind = await Indisponibilite.findById(id).populate('utilisateur');
    if (!ind) return res.status(404).json({ success: false, message: 'Indisponibilité introuvable' });

    const can = canApprove(approbateur, ind.utilisateur);
    if (!can.ok) return res.status(403).json({ success: false, message: can.reason });

    // Simple rejection without complex middleware
    ind.statut = 'refuse';
    ind.approbation = {
      approuvePar: approbateur._id,
      approuveLe: new Date(),
      commentaireApprobation: motif,
      niveauApprobation: can.niveau === 'automatique' ? (approbateur.role === 'admin' ? 'automatique' : approbateur.role) : can.niveau
    };
    await ind.save();

    const result = {
      _id: ind._id,
      statut: ind.statut,
      approbation: ind.approbation
    };

    res.json({ success: true, message: 'Indisponibilité refusée', data: result });
  } catch (error) {
    console.error('Erreur refus indisponibilité:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du refus', error: error.message });
  }
};

export const annulerIndisponibilite = async (req, res) => {
  try {
    const utilisateur = req.user;
    const { id } = req.params;
    const { motif } = req.body;

    const ind = await Indisponibilite.findById(id);
    if (!ind) return res.status(404).json({ success: false, message: 'Indisponibilité introuvable' });

    // Owner or admin can cancel
    if (utilisateur.role !== 'admin' && ind.utilisateur.toString() !== utilisateur._id.toString()) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    await ind.annuler(utilisateur._id, motif);
    res.json({ success: true, message: 'Indisponibilité annulée', data: ind });
  } catch (error) {
    console.error('Erreur annulation indisponibilité:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'annulation', error: error.message });
  }
};

// Get single indisponibilité
export const getIndisponibilite = async (req, res) => {
  try {
    const { id } = req.params;
    const utilisateur = req.user;

    const ind = await Indisponibilite.findById(id)
      .populate('utilisateur', 'firstName lastName role site secteur service')
      .populate('approbation.approuvePar', 'firstName lastName role');

    if (!ind) {
      return res.status(404).json({ success: false, message: 'Indisponibilité introuvable' });
    }

    // Check access rights
    const canView = utilisateur.role === 'admin' ||
                   ind.utilisateur._id.toString() === utilisateur._id.toString() ||
                   (utilisateur.role === 'chef_secteur' && ind.utilisateur.secteur?.toString() === utilisateur.secteur?.toString()) ||
                   (utilisateur.role === 'chef_service' && ind.utilisateur.service?.toString() === utilisateur.service?.toString());

    if (!canView) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    res.json({ success: true, data: ind });
  } catch (error) {
    console.error('Erreur récupération indisponibilité:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération', error: error.message });
  }
};

// Update indisponibilité (only owner and only if status is 'en_attente')
export const updateIndisponibilite = async (req, res) => {
  try {
    const { id } = req.params;
    const utilisateur = req.user;
    const { dateDebut, dateFin, motif, description, priorite } = req.body;

    const ind = await Indisponibilite.findById(id);
    if (!ind) {
      return res.status(404).json({ success: false, message: 'Indisponibilité introuvable' });
    }

    // Only owner can update
    if (ind.utilisateur.toString() !== utilisateur._id.toString()) {
      return res.status(403).json({ success: false, message: 'Seul le propriétaire peut modifier cette indisponibilité' });
    }

    // Only if status is 'en_attente'
    if (ind.statut !== 'en_attente') {
      return res.status(400).json({ success: false, message: 'Impossible de modifier une indisponibilité déjà traitée' });
    }

    // Update fields
    if (dateDebut) ind.dateDebut = new Date(dateDebut);
    if (dateFin) ind.dateFin = new Date(dateFin);
    if (motif) ind.motif = motif;
    if (description !== undefined) ind.description = description;
    if (priorite) ind.priorite = priorite;

    await ind.save();

    // Re-analyze impact
    try {
      await ind.analyserImpactPlannings();
      ind.impact.recalculNecessaire = true;
      await ind.save();
    } catch (e) {
      console.warn('Analyse d\'impact planifications échouée (non bloquant):', e.message);
    }

    res.json({ success: true, message: 'Indisponibilité mise à jour', data: ind });
  } catch (error) {
    console.error('Erreur mise à jour indisponibilité:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour', error: error.message });
  }
};

// Delete indisponibilité (only owner and only if status is 'en_attente')
export const deleteIndisponibilite = async (req, res) => {
  try {
    const { id } = req.params;
    const utilisateur = req.user;

    const ind = await Indisponibilite.findById(id);
    if (!ind) {
      return res.status(404).json({ success: false, message: 'Indisponibilité introuvable' });
    }

    // Only owner or admin can delete
    if (utilisateur.role !== 'admin' && ind.utilisateur.toString() !== utilisateur._id.toString()) {
      return res.status(403).json({ success: false, message: 'Seul le propriétaire ou un administrateur peut supprimer cette indisponibilité' });
    }

    // Only if status is 'en_attente' or 'refuse'
    if (!['en_attente', 'refuse'].includes(ind.statut)) {
      return res.status(400).json({ success: false, message: 'Impossible de supprimer une indisponibilité approuvée ou annulée' });
    }

    await Indisponibilite.findByIdAndDelete(id);
    res.json({ success: true, message: 'Indisponibilité supprimée' });
  } catch (error) {
    console.error('Erreur suppression indisponibilité:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression', error: error.message });
  }
};

// Utility to get user IDs matching filters
async function userIdsBy({ role, site, secteur, service }) {
  const q = {};
  if (role) q.role = role;
  if (site) q.site = site;
  if (secteur) q.secteur = secteur;
  if (service) q.service = service;
  const users = await User.find(q).select('_id');
  return users.map(u => u._id);
}



export const getRemplacants = async (req, res) => {
  try {
    const { id } = req.params;
    const ind = await Indisponibilite.findById(id);
    if (!ind) return res.status(404).json({ success: false, message: 'Indisponibilité introuvable' });
    const candidats = await ind.trouverRemplacants();
    res.json({ success: true, data: candidats });
  } catch (error) {
    console.error('Erreur récupération remplaçants indisponibilité:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des remplaçants', error: error.message });
  }
};
