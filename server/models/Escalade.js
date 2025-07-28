import mongoose from 'mongoose';

const niveauEscaladeSchema = new mongoose.Schema({
  niveau: {
    type: Number,
    required: [true, 'Le niveau d\'escalade est requis'],
    min: [1, 'Niveau minimum: 1'],
    max: [3, 'Niveau maximum: 3']
  },
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur du niveau est requis']
  },
  dateContact: {
    type: Date,
    required: [true, 'La date de contact est requise']
  },
  methodesContact: [{
    type: { type: String, enum: ['sms', 'appel', 'email', 'push'] },
    tentative: Number,
    dateEnvoi: Date,
    statut: { type: String, enum: ['envoye', 'delivre', 'lu', 'echec'] },
    messageId: String
  }],
  reponse: {
    type: Boolean,
    default: false
  },
  dateReponse: Date,
  tempsReponse: {
    type: Number, // en minutes
    default: null
  },
  typeReponse: {
    type: String,
    enum: ['accepte', 'refuse', 'transfere', 'timeout'],
    default: null
  },
  commentaireReponse: {
    type: String,
    maxlength: [300, 'Le commentaire ne peut pas dépasser 300 caractères']
  },
  transfereVers: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  _id: true,
  timestamps: true
});

const escaladeSchema = new mongoose.Schema({
  incident: {
    type: String,
    required: [true, 'La description de l\'incident est requise'],
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  typeIncident: {
    type: String,
    enum: [
      'panne_equipement',
      'arret_production',
      'incident_securite',
      'probleme_qualite',
      'urgence_maintenance',
      'autre'
    ],
    default: 'autre'
  },
  priorite: {
    type: String,
    enum: ['basse', 'normale', 'haute', 'critique'],
    default: 'normale'
  },
  dateIncident: {
    type: Date,
    required: [true, 'La date de l\'incident est requise'],
    default: Date.now
  },
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: [true, 'Le site est requis']
  },
  secteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Secteur',
    required: [true, 'Le secteur est requis']
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Le service est requis']
  },
  declenchePar: {
    type: String,
    enum: ['systeme_automatique', 'operateur', 'surveillance', 'client'],
    default: 'systeme_automatique'
  },
  declarant: {
    nom: String,
    telephone: String,
    email: String,
    fonction: String
  },
  niveaux: [niveauEscaladeSchema],
  statut: {
    type: String,
    enum: ['en_cours', 'resolu', 'echec', 'annule', 'transfere'],
    default: 'en_cours'
  },
  resolution: {
    resoluPar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateResolution: Date,
    tempsResolution: Number, // en minutes
    methodesResolution: String,
    commentaireResolution: {
      type: String,
      maxlength: [1000, 'Le commentaire de résolution ne peut pas dépasser 1000 caractères']
    },
    satisfactionClient: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  configuration: {
    timeoutNiveau1: {
      type: Number,
      default: 15, // minutes
      min: [1, 'Timeout minimum: 1 minute'],
      max: [60, 'Timeout maximum: 60 minutes']
    },
    timeoutNiveau2: {
      type: Number,
      default: 30, // minutes
      min: [1, 'Timeout minimum: 1 minute'],
      max: [120, 'Timeout maximum: 120 minutes']
    },
    tentativesMaxParNiveau: {
      type: Number,
      default: 3,
      min: [1, 'Minimum 1 tentative'],
      max: [5, 'Maximum 5 tentatives']
    },
    intervalleEntreAppels: {
      type: Number,
      default: 5, // minutes
      min: [1, 'Intervalle minimum: 1 minute'],
      max: [15, 'Intervalle maximum: 15 minutes']
    }
  },
  metriques: {
    tempsEscaladeTotal: Number, // en minutes
    nombreTentativesTotal: Number,
    tauxReponseNiveau1: Number,
    tauxReponseNiveau2: Number,
    tauxReponseNiveau3: Number,
    coutEstime: Number
  },
  notifications: [{
    destinataire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['escalade_demarree', 'niveau_suivant', 'resolu', 'echec', 'timeout']
    },
    methode: {
      type: String,
      enum: ['sms', 'email', 'push', 'appel']
    },
    dateEnvoi: Date,
    statut: {
      type: String,
      enum: ['envoye', 'delivre', 'lu', 'echec']
    }
  }],
  historique: [{
    action: {
      type: String,
      enum: [
        'creation',
        'escalade_niveau1',
        'escalade_niveau2', 
        'escalade_niveau3',
        'reponse_recue',
        'timeout',
        'resolution',
        'annulation'
      ]
    },
    date: {
      type: Date,
      default: Date.now
    },
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: String,
    niveau: Number
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour optimiser les requêtes
escaladeSchema.index({ site: 1, secteur: 1, service: 1 });
escaladeSchema.index({ dateIncident: 1, statut: 1 });
escaladeSchema.index({ priorite: 1, statut: 1 });
escaladeSchema.index({ 'niveaux.utilisateur': 1, 'niveaux.dateContact': 1 });

// Virtual pour calculer le temps total d'escalade
escaladeSchema.virtual('tempsEscaladeTotal').get(function() {
  if (this.resolution && this.resolution.dateResolution) {
    const diffTime = this.resolution.dateResolution - this.dateIncident;
    return Math.round(diffTime / (1000 * 60)); // en minutes
  }
  return null;
});

// Virtual pour obtenir le niveau actuel
escaladeSchema.virtual('niveauActuel').get(function() {
  if (this.niveaux.length === 0) return 0;
  return Math.max(...this.niveaux.map(n => n.niveau));
});

// Virtual pour vérifier si l'escalade est en timeout
escaladeSchema.virtual('enTimeout').get(function() {
  const maintenant = new Date();
  const dernierNiveau = this.niveaux[this.niveaux.length - 1];
  
  if (!dernierNiveau || dernierNiveau.reponse) return false;
  
  const timeout = dernierNiveau.niveau === 1 ? 
    this.configuration.timeoutNiveau1 : 
    this.configuration.timeoutNiveau2;
  
  const tempsEcoule = (maintenant - dernierNiveau.dateContact) / (1000 * 60);
  return tempsEcoule > timeout;
});

// Middleware pour calculer les métriques avant sauvegarde
escaladeSchema.pre('save', function(next) {
  // Calculer le temps total d'escalade
  if (this.resolution && this.resolution.dateResolution) {
    this.metriques.tempsEscaladeTotal = this.tempsEscaladeTotal;
  }
  
  // Calculer le nombre total de tentatives
  this.metriques.nombreTentativesTotal = this.niveaux.reduce((total, niveau) => {
    return total + (niveau.methodesContact ? niveau.methodesContact.length : 0);
  }, 0);
  
  // Calculer les taux de réponse par niveau
  const niveau1 = this.niveaux.filter(n => n.niveau === 1);
  const niveau2 = this.niveaux.filter(n => n.niveau === 2);
  const niveau3 = this.niveaux.filter(n => n.niveau === 3);
  
  this.metriques.tauxReponseNiveau1 = niveau1.length > 0 ? 
    (niveau1.filter(n => n.reponse).length / niveau1.length) * 100 : 0;
  this.metriques.tauxReponseNiveau2 = niveau2.length > 0 ? 
    (niveau2.filter(n => n.reponse).length / niveau2.length) * 100 : 0;
  this.metriques.tauxReponseNiveau3 = niveau3.length > 0 ? 
    (niveau3.filter(n => n.reponse).length / niveau3.length) * 100 : 0;
  
  next();
});

// Méthode pour démarrer l'escalade niveau 1
escaladeSchema.methods.demarrerEscalade = async function() {
  const Service = mongoose.model('Service');
  const Planning = mongoose.model('Planning');
  
  // Trouver qui est de garde pour ce service
  const maintenant = new Date();
  const planning = await Planning.findOne({
    service: this.service,
    'periode.debut': { $lte: maintenant },
    'periode.fin': { $gte: maintenant },
    statut: { $in: ['valide', 'publie'] }
  }).populate('gardes.utilisateur');
  
  if (!planning) {
    throw new Error('Aucun planning actif trouvé pour ce service');
  }
  
  // Trouver la garde du jour
  const gardeAujourdhui = planning.gardes.find(garde => {
    const dateGarde = new Date(garde.date);
    return dateGarde.toDateString() === maintenant.toDateString();
  });
  
  if (!gardeAujourdhui) {
    throw new Error('Aucune garde trouvée pour aujourd\'hui');
  }
  
  // Ajouter le niveau 1
  this.niveaux.push({
    niveau: 1,
    utilisateur: gardeAujourdhui.utilisateur._id,
    dateContact: new Date(),
    methodesContact: []
  });
  
  // Ajouter à l'historique
  this.historique.push({
    action: 'escalade_niveau1',
    date: new Date(),
    utilisateur: gardeAujourdhui.utilisateur._id,
    details: 'Escalade démarrée - Niveau 1',
    niveau: 1
  });
  
  await this.save();
  return this;
};

// Méthode pour escalader au niveau suivant
escaladeSchema.methods.escaladerNiveauSuivant = async function() {
  const niveauActuel = this.niveauActuel;
  
  if (niveauActuel >= 3) {
    throw new Error('Niveau d\'escalade maximum atteint');
  }
  
  const nouveauNiveau = niveauActuel + 1;
  let utilisateurCible;
  
  if (nouveauNiveau === 2) {
    // Escalade vers l'ingénieur de secteur
    const User = mongoose.model('User');
    const Planning = mongoose.model('Planning');
    
    // Trouver l'ingénieur de garde pour le secteur
    const planningIngenieur = await Planning.findOne({
      secteur: this.secteur,
      type: 'secteur',
      'periode.debut': { $lte: new Date() },
      'periode.fin': { $gte: new Date() },
      statut: { $in: ['valide', 'publie'] }
    }).populate('gardes.utilisateur');
    
    if (planningIngenieur) {
      const gardeIngenieur = planningIngenieur.gardes.find(garde => {
        const dateGarde = new Date(garde.date);
        return dateGarde.toDateString() === new Date().toDateString();
      });
      
      if (gardeIngenieur) {
        utilisateurCible = gardeIngenieur.utilisateur._id;
      }
    }
    
    // Si pas d'ingénieur de garde, prendre le premier ingénieur disponible
    if (!utilisateurCible) {
      const ingenieur = await User.findOne({
        secteur: this.secteur,
        role: 'ingenieur',
        isActive: true
      });
      
      if (ingenieur) {
        utilisateurCible = ingenieur._id;
      }
    }
  } else if (nouveauNiveau === 3) {
    // Escalade vers le chef de secteur
    const Secteur = mongoose.model('Secteur');
    const secteur = await Secteur.findById(this.secteur);
    
    if (secteur) {
      utilisateurCible = secteur.chefSecteur;
    }
  }
  
  if (!utilisateurCible) {
    throw new Error(`Aucun utilisateur trouvé pour le niveau ${nouveauNiveau}`);
  }
  
  // Ajouter le nouveau niveau
  this.niveaux.push({
    niveau: nouveauNiveau,
    utilisateur: utilisateurCible,
    dateContact: new Date(),
    methodesContact: []
  });
  
  // Ajouter à l'historique
  this.historique.push({
    action: `escalade_niveau${nouveauNiveau}`,
    date: new Date(),
    utilisateur: utilisateurCible,
    details: `Escalade niveau ${nouveauNiveau}`,
    niveau: nouveauNiveau
  });
  
  await this.save();
  return this;
};

// Méthode pour enregistrer une réponse
escaladeSchema.methods.enregistrerReponse = function(niveauId, typeReponse, commentaire, transfereVers = null) {
  const niveau = this.niveaux.id(niveauId);
  if (!niveau) {
    throw new Error('Niveau d\'escalade introuvable');
  }
  
  niveau.reponse = true;
  niveau.dateReponse = new Date();
  niveau.tempsReponse = Math.round((niveau.dateReponse - niveau.dateContact) / (1000 * 60));
  niveau.typeReponse = typeReponse;
  niveau.commentaireReponse = commentaire;
  
  if (transfereVers) {
    niveau.transfereVers = transfereVers;
  }
  
  // Ajouter à l'historique
  this.historique.push({
    action: 'reponse_recue',
    date: new Date(),
    utilisateur: niveau.utilisateur,
    details: `Réponse: ${typeReponse} - ${commentaire}`,
    niveau: niveau.niveau
  });
  
  // Si accepté, marquer comme résolu
  if (typeReponse === 'accepte') {
    this.resoudre(niveau.utilisateur, commentaire);
  }
  
  return this.save();
};

// Méthode pour résoudre l'escalade
escaladeSchema.methods.resoudre = function(resoluteurId, commentaire, methodesResolution = '') {
  this.statut = 'resolu';
  this.resolution = {
    resoluPar: resoluteurId,
    dateResolution: new Date(),
    tempsResolution: this.tempsEscaladeTotal,
    methodesResolution,
    commentaireResolution: commentaire
  };
  
  // Ajouter à l'historique
  this.historique.push({
    action: 'resolution',
    date: new Date(),
    utilisateur: resoluteurId,
    details: `Incident résolu: ${commentaire}`
  });
  
  return this.save();
};

// Méthode statique pour obtenir les escalades actives
escaladeSchema.statics.getEscaladesActives = function(siteId = null) {
  const query = { statut: 'en_cours' };
  if (siteId) query.site = siteId;
  
  return this.find(query)
    .populate('site', 'name code')
    .populate('secteur', 'name code')
    .populate('service', 'name code')
    .populate('niveaux.utilisateur', 'firstName lastName role phone')
    .sort({ dateIncident: -1 });
};

// Méthode statique pour obtenir les statistiques d'escalade
escaladeSchema.statics.getStatistiques = function(siteId, dateDebut, dateFin) {
  const matchQuery = {
    dateIncident: { $gte: dateDebut, $lte: dateFin }
  };
  
  if (siteId) matchQuery.site = mongoose.Types.ObjectId(siteId);
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalEscalades: { $sum: 1 },
        escaladeResolues: {
          $sum: { $cond: [{ $eq: ['$statut', 'resolu'] }, 1, 0] }
        },
        tempsResolutionMoyen: {
          $avg: '$metriques.tempsEscaladeTotal'
        },
        tauxReponseNiveau1Moyen: {
          $avg: '$metriques.tauxReponseNiveau1'
        },
        tauxReponseNiveau2Moyen: {
          $avg: '$metriques.tauxReponseNiveau2'
        },
        tauxReponseNiveau3Moyen: {
          $avg: '$metriques.tauxReponseNiveau3'
        }
      }
    }
  ]);
};

const Escalade = mongoose.model('Escalade', escaladeSchema);

export default Escalade;
