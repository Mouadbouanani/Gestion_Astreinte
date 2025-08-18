import mongoose from 'mongoose';
import Planning from '../models/Planning.js';
import Service from '../models/Service.js';
import Secteur from '../models/Secteur.js';
import User from '../models/User.js';
import Indisponibilite from '../models/Indisponibilite.js';

// Utility: validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Utility: check planning permissions based on user role and hierarchy
const checkPlanningPermissions = async (user, planningData) => {
  // Admin can do everything
  if (user.role === 'admin') return true;
  
  // Chef Secteur can manage all services in their secteur
  if (user.role === 'chef_secteur') {
    if (planningData.secteurId && user.secteur.toString() !== planningData.secteurId) {
      throw new Error('Vous ne pouvez gérer que les plannings de votre secteur');
    }
    return true;
  }
  
  // Chef Service can manage only their service planning
  if (user.role === 'chef_service') {
    if (planningData.type === 'service' && planningData.serviceId) {
      if (user.service.toString() !== planningData.serviceId) {
        throw new Error('Vous ne pouvez gérer que les plannings de votre service');
      }
    } else if (planningData.type === 'secteur') {
      throw new Error('Vous ne pouvez gérer que les plannings de service');
    }
    return true;
  }
  
  // Ingénieur can only view secteur plannings
  if (user.role === 'ingenieur') {
    if (planningData.type === 'service') {
      throw new Error('Vous ne pouvez consulter que les plannings de secteur');
    }
    if (planningData.secteurId && user.secteur.toString() !== planningData.secteurId) {
      throw new Error('Vous ne pouvez consulter que les plannings de votre secteur');
    }
    return true;
  }
  
  // Collaborateur can only view their own planning
  if (user.role === 'collaborateur') {
    throw new Error('Vous ne pouvez que consulter votre planning personnel');
  }
  
  return false;
};

// Utility: enumerate weekend and holiday dates between two dates (inclusive)
function enumerateWeekendAndHolidayDates(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Moroccan public holidays 2024-2025
  const holidays = [
    '2024-01-01', // Nouvel An
    '2024-01-11', // Manifeste de l'Indépendance
    '2024-05-01', // Fête du Travail
    '2024-07-30', // Fête du Trône
    '2024-08-14', // Oued Ed-Dahab
    '2024-08-20', // Révolution du Roi et du Peuple
    '2024-08-21', // Fête de la Jeunesse
    '2024-11-06', // Marche Verte
    '2024-11-18', // Fête de l'Indépendance
    '2025-01-01', // Nouvel An
    '2025-01-11', // Manifeste de l'Indépendance
    '2025-05-01', // Fête du Travail
    '2025-07-30', // Fête du Trône
    '2025-08-14', // Oued Ed-Dahab
    '2025-08-20', // Révolution du Roi et du Peuple
    '2025-08-21', // Fête de la Jeunesse
    '2025-11-06', // Marche Verte
    '2025-11-18'  // Fête de l'Indépendance
  ];

  while (current <= end) {
    const day = current.getDay();
    const dateString = current.toISOString().split('T')[0];
    
    // Check if it's a weekend (Saturday=6, Sunday=0)
    if (day === 6 || day === 0) {
      dates.push({ date: new Date(current), type: 'weekend' });
    }
    // Check if it's a holiday
    else if (holidays.includes(dateString)) {
      dates.push({ date: new Date(current), type: 'holiday' });
    }
    
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// Utility: fetch approved unavailability for a set of users within a date range
async function getApprovedIndisponibilitesMap(userIds, start, end) {
  if (userIds.length === 0) return new Map();
  const indispos = await Indisponibilite.find({
    utilisateur: { $in: userIds },
    statut: 'approuve',
    $or: [
      { dateDebut: { $lte: end }, dateFin: { $gte: start } },
      { dateDebut: { $gte: start, $lte: end } },
      { dateFin: { $gte: start, $lte: end } }
    ]
  }).select('utilisateur dateDebut dateFin');

  const map = new Map();
  for (const ind of indispos) {
    const key = String(ind.utilisateur);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ debut: ind.dateDebut, fin: ind.dateFin });
  }
  return map;
}

// Utility: build historical assignment counts per user (last 90 days by default)
async function getHistoricalCounts({ type, siteId, secteurId, serviceId, sinceDate }) {
  const filter = {
    type,
    site: siteId,
    secteur: secteurId,
    statut: { $in: ['valide', 'publie'] },
    'periode.debut': { $gte: sinceDate }
  };
  if (type === 'service') filter.service = serviceId;

  const past = await Planning.find(filter).select('gardes.utilisateur');
  const counts = new Map();
  for (const p of past) {
    for (const g of p.gardes) {
      const key = String(g.utilisateur);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return counts;
}

// Utility: choose next candidate with least load and available on date
function pickCandidate({ candidates, counts, indispoMap, date }) {
  const dayTs = new Date(date).setHours(0, 0, 0, 0);
  const sorted = [...candidates].sort((a, b) => (counts.get(String(a)) || 0) - (counts.get(String(b)) || 0));

  for (const userId of sorted) {
    const intervals = indispoMap.get(String(userId)) || [];
    const isUnavailable = intervals.some((itv) => dayTs >= new Date(itv.debut).setHours(0, 0, 0, 0) && dayTs <= new Date(itv.fin).setHours(23, 59, 59, 999));
    if (!isUnavailable) return userId;
  }
  return null;
}

// GET /api/plannings
export const listPlannings = async (req, res) => {
  try {
    const { siteId, secteurId, serviceId, type, start, end } = req.query;

    // Apply role-based filtering
    const filter = {};
    
    // Admin can see all plannings
    if (req.user.role === 'admin') {
      if (type) filter.type = type;
      if (siteId && isValidObjectId(siteId)) filter.site = siteId;
      if (secteurId && isValidObjectId(secteurId)) filter.secteur = secteurId;
      if (serviceId && isValidObjectId(serviceId)) filter.service = serviceId;
    }
    // Chef Secteur can see plannings in their secteur
    else if (req.user.role === 'chef_secteur') {
      filter.secteur = req.user.secteur;
      if (type) filter.type = type;
      if (serviceId && isValidObjectId(serviceId)) filter.service = serviceId;
    }
    // Chef Service can see their service plannings and secteur plannings
    else if (req.user.role === 'chef_service') {
      filter.secteur = req.user.secteur;
      if (type === 'service') {
        filter.service = req.user.service;
      }
    }
    // Ingénieur can see secteur plannings only
    else if (req.user.role === 'ingenieur') {
      filter.secteur = req.user.secteur;
      filter.type = 'secteur';
    }
    // Collaborateur can see only their own gardes
    else if (req.user.role === 'collaborateur') {
      filter['gardes.utilisateur'] = req.user._id;
    }
    
    if (start || end) {
      filter['periode.debut'] = { $lte: end ? new Date(end) : new Date('2999-12-31') };
      filter['periode.fin'] = { $gte: start ? new Date(start) : new Date('1900-01-01') };
    }

    const plannings = await Planning.find(filter)
      .populate('site', 'name code')
      .populate('secteur', 'name code')
      .populate('service', 'name code')
      // Include contact info so frontend can display who to call/email
      .populate('gardes.utilisateur', 'firstName lastName role phone email address')
      .sort({ 'periode.debut': -1, createdAt: -1 })
      .limit(100);

    res.json({ success: true, count: plannings.length, data: plannings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur récupération plannings', error: error.message });
  }
};

// POST /api/plannings
export const createPlanning = async (req, res) => {
  try {
    const { type, siteId, secteurId, serviceId, periode } = req.body;

    if (!['service', 'secteur'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type invalide' });
    }
    if (!isValidObjectId(siteId) || !isValidObjectId(secteurId)) {
      return res.status(400).json({ success: false, message: 'Site/Secteur invalide' });
    }
    if (type === 'service' && !isValidObjectId(serviceId)) {
      return res.status(400).json({ success: false, message: 'Service invalide' });
    }

    // Check permissions
    try {
      await checkPlanningPermissions(req.user, { type, secteurId, serviceId });
    } catch (error) {
      return res.status(403).json({ success: false, message: error.message });
    }

    const planning = await Planning.create({
      type,
      site: siteId,
      secteur: secteurId,
      service: type === 'service' ? serviceId : undefined,
      periode: { debut: new Date(periode.debut), fin: new Date(periode.fin) },
      gardes: [],
      createdBy: req.user._id,
      statut: 'brouillon'
    });

    res.status(201).json({ success: true, data: planning });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur création planning', error: error.message });
  }
};

// POST /api/plannings/generate
export const generatePlanning = async (req, res) => {
  try {
    const { type, siteId, secteurId, serviceId, periode } = req.body;

    if (!['service', 'secteur'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type invalide' });
    }
    if (!isValidObjectId(siteId) || !isValidObjectId(secteurId)) {
      return res.status(400).json({ success: false, message: 'Site/Secteur invalide' });
    }
    if (type === 'service' && !isValidObjectId(serviceId)) {
      return res.status(400).json({ success: false, message: 'Service invalide' });
    }

    // Check permissions
    try {
      await checkPlanningPermissions(req.user, { type, secteurId, serviceId });
    } catch (error) {
      return res.status(403).json({ success: false, message: error.message });
    }

    const dateDebut = new Date(periode.debut);
    const dateFin = new Date(periode.fin);
    if (!(dateFin > dateDebut)) {
      return res.status(400).json({ success: false, message: 'Période invalide' });
    }

    // Resolve eligible users
    let eligibleUserIds = [];
    if (type === 'service') {
      const service = await Service.findById(serviceId).select('chefService collaborateurs configuration secteur');
      if (!service) return res.status(404).json({ success: false, message: 'Service introuvable' });

      if (service.configuration?.participationChef && service.chefService) {
        eligibleUserIds.push(service.chefService);
      }
      eligibleUserIds.push(...(service.collaborateurs || []));
    } else {
      const ingenieurs = await User.find({ secteur: secteurId, role: 'ingenieur', isActive: true }).select('_id');
      eligibleUserIds = ingenieurs.map((u) => u._id);
    }

    // De-duplicate and ensure users are active
    const activeUsers = await User.find({ _id: { $in: eligibleUserIds }, isActive: true }).select('_id');
    const candidates = [...new Set(activeUsers.map((u) => String(u._id)))];

    if (candidates.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun personnel éligible pour la génération' });
    }

    // Weekends and holidays only
    const weekendHolidayDates = enumerateWeekendAndHolidayDates(dateDebut, dateFin);
    if (weekendHolidayDates.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun weekend ou jour férié dans la période' });
    }

    // Historical counts since last 90 days
    const ninetyDaysAgo = new Date(dateDebut);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const counts = await getHistoricalCounts({ type, siteId, secteurId, serviceId, sinceDate: ninetyDaysAgo });

    // Preload indisponibilites
    const indispoMap = await getApprovedIndisponibilitesMap(candidates, dateDebut, dateFin);

    // Build rotation
    const gardes = [];
    const skipped = [];
    let weekendsCouverts = 0;
    let joursFeriesCouverts = 0;

    for (const { date, type } of weekendHolidayDates) {
      const candidateId = pickCandidate({ candidates, counts, indispoMap, date });
      if (candidateId) {
        gardes.push({ 
          date, 
          utilisateur: candidateId,
          type: type // Add type to distinguish weekend vs holiday
        });
        counts.set(String(candidateId), (counts.get(String(candidateId)) || 0) + 1);
        
        if (type === 'weekend') weekendsCouverts++;
        else if (type === 'holiday') joursFeriesCouverts++;
      } else {
        skipped.push({ date, type });
      }
    }

    const planning = await Planning.create({
      type,
      site: siteId,
      secteur: secteurId,
      service: type === 'service' ? serviceId : undefined,
      periode: { debut: dateDebut, fin: dateFin },
      gardes,
      createdBy: req.user._id,
      statut: 'brouillon',
      metadata: {
        algorithmeUtilise: 'rotation_equitable',
        statistiques: {
          totalGardes: gardes.length,
          weekendsCouverts,
          joursFeriesCouverts,
          tauxCouverture: weekendHolidayDates.length > 0 ? (gardes.length / weekendHolidayDates.length) * 100 : 0
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Planning généré',
      data: planning,
      summary: {
        totalJours: weekendHolidayDates.length,
        weekends: weekendsCouverts,
        joursFeries: joursFeriesCouverts,
        assignations: gardes.length,
        nonAssignes: skipped.length
      }
    });
  } catch (error) {
    console.error('Erreur génération planning:', error);
    res.status(500).json({ success: false, message: 'Erreur génération planning', error: error.message });
  }
};

// PUT /api/plannings/:id/validate
export const validatePlanning = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'ID invalide' });

    const planning = await Planning.findById(id);
    if (!planning) return res.status(404).json({ success: false, message: 'Planning introuvable' });

    // Check permissions
    try {
      await checkPlanningPermissions(req.user, { 
        type: planning.type, 
        secteurId: planning.secteur.toString(), 
        serviceId: planning.service?.toString() 
      });
    } catch (error) {
      return res.status(403).json({ success: false, message: error.message });
    }

    // Vérifier les règles de double planning (selon UML diagram)
    const conflitsDoublePlanning = await planning.verifierReglesDoublePlanning();
    
    if (conflitsDoublePlanning.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Conflits détectés dans le double planning',
        conflits: conflitsDoublePlanning
      });
    }

    // Allow validation regardless of intermediate status; set fields accordingly
    planning.statut = 'valide';
    planning.validation = planning.validation || {};
    planning.validation.validePar = req.user._id;
    planning.validation.valideLe = new Date();
    await planning.save();

    res.json({ success: true, message: 'Planning validé', data: planning });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur validation planning', error: error.message });
  }
};

// DELETE /api/plannings/:id
export const deletePlanning = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'ID invalide' });

    const result = await Planning.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ success: false, message: 'Planning introuvable' });

    res.json({ success: true, message: 'Planning supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur suppression planning', error: error.message });
  }
};

// POST /api/plannings/:id/verifier-double-planning
export const verifierDoublePlanning = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'ID invalide' });

    const planning = await Planning.findById(id);
    if (!planning) return res.status(404).json({ success: false, message: 'Planning introuvable' });

    // Check permissions
    try {
      await checkPlanningPermissions(req.user, { 
        type: planning.type, 
        secteurId: planning.secteur.toString(), 
        serviceId: planning.service?.toString() 
      });
    } catch (error) {
      return res.status(403).json({ success: false, message: error.message });
    }

    // Vérifier les règles de double planning
    const conflits = await planning.verifierReglesDoublePlanning();
    
    res.json({
      success: true,
      message: conflits.length === 0 ? 'Aucun conflit détecté' : 'Conflits détectés',
      conflits,
      planningId: planning._id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur vérification double planning', error: error.message });
  }
};

// POST /api/plannings/:id/resoudre-conflits
export const resoudreConflits = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'ID invalide' });

    const planning = await Planning.findById(id);
    if (!planning) return res.status(404).json({ success: false, message: 'Planning introuvable' });

    // Check permissions
    try {
      await checkPlanningPermissions(req.user, { 
        type: planning.type, 
        secteurId: planning.secteur.toString(), 
        serviceId: planning.service?.toString() 
      });
    } catch (error) {
      return res.status(403).json({ success: false, message: error.message });
    }

    // Résoudre les conflits automatiquement
    const resultat = await planning.resoudreConflits();
    
    res.json({
      success: true,
      message: resultat.resolu ? 'Conflits résolus avec succès' : 'Certains conflits n\'ont pas pu être résolus',
      resultat,
      planningId: planning._id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur résolution conflits', error: error.message });
  }
};

