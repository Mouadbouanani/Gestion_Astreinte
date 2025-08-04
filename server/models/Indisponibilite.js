import mongoose from 'mongoose';

const indisponibiliteSchema = new mongoose.Schema({
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur est requis']
  },
  dateDebut: {
    type: Date,
    required: [true, 'La date de début est requise']
  },
  dateFin: {
    type: Date,
    required: [true, 'La date de fin est requise'],
    validate: {
      validator: function(dateFin) {
        return dateFin >= this.dateDebut;
      },
      message: 'La date de fin doit être postérieure ou égale à la date de début'
    }
  },
  motif: {
    type: String,
    required: [true, 'Le motif est requis'],
    enum: {
      values: [
        'conge_annuel',
        'conge_maladie',
        'conge_maternite',
        'conge_paternite',
        'formation',
        'mission',
        'urgence_familiale',
        'autre'
      ],
      message: 'Motif d\'indisponibilité invalide'
    }
  },
  description: {
    type: String,
    maxlength: [700, 'La description ne peut pas dépasser 700 caractères'],
    required: function() {
      return this.motif === 'autre';
    }
  },
  statut: {
    type: String,
    enum: ['en_attente', 'approuve', 'refuse', 'annule'],
    default: 'en_attente'
  },
  priorite: {
    type: String,
    enum: ['normale', 'urgente', 'critique'],
    default: 'normale'
  },
  approbation: {
    approuvePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approuveLe: Date,
    commentaireApprobation: {
      type: String,
      maxlength: [500, 'Le commentaire ne peut pas dépasser 500 caractères']
    },
    niveauApprobation: {
      type: String,
      enum: ['chef_service', 'chef_secteur', 'automatique'],
      required: function() {
        return ['approuve', 'refuse'].includes(this.statut);
      }
    }
  },
  impact: {
    planningsAffectes: [{
      planning: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Planning'
      },
      gardesAffectees: [Date],
      remplacementTrouve: { type: Boolean, default: false },
      remplacant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    recalculNecessaire: {
      type: Boolean,
      default: false
    },
    notificationsEnvoyees: [{
      destinataire: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      type: { type: String, enum: ['creation', 'approbation', 'refus', 'impact'] },
      envoyeLe: Date,
      methode: { type: String, enum: ['email', 'sms', 'push', 'app'] }
    }]
  },
  metadata: {
    dureeJours: {
      type: Number,
      default: 0
    },
    joursFeries: [{
      date: Date,
      nom: String
    }],
    weekendsInclus: {
      type: Number,
      default: 0
    },
    typeJours: {
      type: String,
      enum: ['jours_ouvres', 'weekends_uniquement', 'tous_jours'],
      default: 'tous_jours'
    }
  },
  historique: [{
    action: {
      type: String,
      enum: ['creation', 'modification', 'approbation', 'refus', 'annulation']
    },
    effectuePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    },
    commentaire: String,
    anciennesValeurs: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour optimiser les requêtes
indisponibiliteSchema.index({ utilisateur: 1, dateDebut: 1, dateFin: 1 });
indisponibiliteSchema.index({ statut: 1, priorite: 1 });
indisponibiliteSchema.index({ dateDebut: 1, dateFin: 1 });
indisponibiliteSchema.index({ 'approbation.approuvePar': 1 });

// Virtual pour calculer la durée en jours
indisponibiliteSchema.virtual('duree').get(function() {
  const diffTime = Math.abs(this.dateFin - this.dateDebut);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de fin
});

// Virtual pour vérifier si l'indisponibilité est en cours
indisponibiliteSchema.virtual('enCours').get(function() {
  const maintenant = new Date();
  return this.dateDebut <= maintenant && this.dateFin >= maintenant && this.statut === 'approuve';
});

// Virtual pour vérifier si l'indisponibilité est future
indisponibiliteSchema.virtual('future').get(function() {
  return this.dateDebut > new Date();
});

// Middleware pour calculer les métadonnées avant sauvegarde
indisponibiliteSchema.pre('save', function(next) {
  // Calculer la durée en jours
  this.metadata.dureeJours = this.duree;
  
  // Calculer le nombre de weekends inclus
  let weekends = 0;
  const current = new Date(this.dateDebut);
  
  while (current <= this.dateFin) {
    if (current.getDay() === 0 || current.getDay() === 6) {
      weekends++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  this.metadata.weekendsInclus = weekends;
  
  // Ajouter à l'historique si c'est une modification
  if (!this.isNew && this.isModified()) {
    this.historique.push({
      action: 'modification',
      effectuePar: this.modifiedBy || this.utilisateur,
      date: new Date(),
      commentaire: 'Modification automatique',
      anciennesValeurs: this.getChanges()
    });
  }
  
  next();
});

// Middleware pour ajouter à l'historique lors de la création
indisponibiliteSchema.post('save', function(doc) {
  if (doc.historique.length === 0) {
    doc.historique.push({
      action: 'creation',
      effectuePar: doc.utilisateur,
      date: new Date(),
      commentaire: 'Création de l\'indisponibilité'
    });
    doc.save();
  }
});

// Méthode pour approuver l'indisponibilité
indisponibiliteSchema.methods.approuver = async function(approbateurId, commentaire, niveauApprobation) {
  if (this.statut !== 'en_attente') {
    throw new Error('Seules les indisponibilités en attente peuvent être approuvées');
  }
  
  this.statut = 'approuve';
  this.approbation.approuvePar = approbateurId;
  this.approbation.approuveLe = new Date();
  this.approbation.commentaireApprobation = commentaire;
  this.approbation.niveauApprobation = niveauApprobation;
  
  // Ajouter à l'historique
  this.historique.push({
    action: 'approbation',
    effectuePar: approbateurId,
    date: new Date(),
    commentaire: commentaire || 'Indisponibilité approuvée'
  });
  
  // Marquer pour recalcul des plannings
  this.impact.recalculNecessaire = true;
  
  await this.save();
  
  // Analyser l'impact sur les plannings existants
  await this.analyserImpactPlannings();
  
  return this;
};

// Méthode pour refuser l'indisponibilité
indisponibiliteSchema.methods.refuser = function(approbateurId, motif, niveauApprobation) {
  if (this.statut !== 'en_attente') {
    throw new Error('Seules les indisponibilités en attente peuvent être refusées');
  }
  
  this.statut = 'refuse';
  this.approbation.approuvePar = approbateurId;
  this.approbation.approuveLe = new Date();
  this.approbation.commentaireApprobation = motif;
  this.approbation.niveauApprobation = niveauApprobation;
  
  // Ajouter à l'historique
  this.historique.push({
    action: 'refus',
    effectuePar: approbateurId,
    date: new Date(),
    commentaire: motif || 'Indisponibilité refusée'
  });
  
  return this.save();
};

// Méthode pour annuler l'indisponibilité
indisponibiliteSchema.methods.annuler = function(utilisateurId, motif) {
  if (!['en_attente', 'approuve'].includes(this.statut)) {
    throw new Error('Impossible d\'annuler cette indisponibilité');
  }
  
  this.statut = 'annule';
  
  // Ajouter à l'historique
  this.historique.push({
    action: 'annulation',
    effectuePar: utilisateurId,
    date: new Date(),
    commentaire: motif || 'Indisponibilité annulée'
  });
  
  return this.save();
};

// Méthode pour analyser l'impact sur les plannings
indisponibiliteSchema.methods.analyserImpactPlannings = async function() {
  const Planning = mongoose.model('Planning');
  
  // Trouver tous les plannings affectés
  const planningsAffectes = await Planning.find({
    'gardes.utilisateur': this.utilisateur,
    'gardes.date': {
      $gte: this.dateDebut,
      $lte: this.dateFin
    },
    statut: { $in: ['valide', 'publie'] }
  });
  
  this.impact.planningsAffectes = [];
  
  for (const planning of planningsAffectes) {
    const gardesAffectees = planning.gardes
      .filter(garde => 
        garde.utilisateur.toString() === this.utilisateur.toString() &&
        garde.date >= this.dateDebut &&
        garde.date <= this.dateFin
      )
      .map(garde => garde.date);
    
    if (gardesAffectees.length > 0) {
      this.impact.planningsAffectes.push({
        planning: planning._id,
        gardesAffectees,
        remplacementTrouve: false
      });
    }
  }
  
  return this.save();
};

// Méthode pour trouver des remplaçants
indisponibiliteSchema.methods.trouverRemplacants = async function() {
  const User = mongoose.model('User');
  const Service = mongoose.model('Service');
  
  // Obtenir l'utilisateur et son service
  const utilisateur = await User.findById(this.utilisateur).populate('service secteur');
  if (!utilisateur) return [];
  
  let candidats = [];
  
  if (utilisateur.service) {
    // Chercher dans le même service d'abord
    const service = await Service.findById(utilisateur.service).populate('collaborateurs chefService');
    candidats = [...service.collaborateurs];
    
    // Ajouter le chef de service si ce n'est pas lui qui est indisponible
    if (service.chefService._id.toString() !== this.utilisateur.toString()) {
      candidats.push(service.chefService);
    }
  }
  
  // Filtrer les candidats disponibles
  const candidatsDisponibles = [];
  
  for (const candidat of candidats) {
    if (!candidat.isActive) continue;
    
    // Vérifier qu'il n'a pas d'indisponibilité conflictuelle
    const conflits = await this.constructor.find({
      utilisateur: candidat._id,
      statut: 'approuve',
      $or: [
        {
          dateDebut: { $lte: this.dateFin },
          dateFin: { $gte: this.dateDebut }
        }
      ]
    });
    
    if (conflits.length === 0) {
      candidatsDisponibles.push(candidat);
    }
  }
  
  return candidatsDisponibles;
};

// Méthode statique pour obtenir les indisponibilités par période
indisponibiliteSchema.statics.getByPeriode = function(dateDebut, dateFin, statut = null) {
  const query = {
    $or: [
      {
        dateDebut: { $lte: dateFin },
        dateFin: { $gte: dateDebut }
      }
    ]
  };
  
  if (statut) {
    query.statut = statut;
  }
  
  return this.find(query)
    .populate('utilisateur', 'firstName lastName role service secteur')
    .populate('approbation.approuvePar', 'firstName lastName role')
    .sort({ dateDebut: 1 });
};

// Méthode statique pour obtenir les indisponibilités en attente d'approbation
indisponibiliteSchema.statics.getEnAttenteApprobation = function(approbateurId) {
  return this.find({
    statut: 'en_attente'
  })
  .populate({
    path: 'utilisateur',
    populate: {
      path: 'service secteur',
      select: 'name chefService chefSecteur'
    }
  })
  .sort({ createdAt: 1 });
};

const Indisponibilite = mongoose.model('Indisponibilite', indisponibiliteSchema);

export default Indisponibilite;
