import mongoose from 'mongoose';

const gardeSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'La date de garde est requise']
  },
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur de garde est requis']
  },
  statut: {
    type: String,
    enum: ['planifie', 'confirme', 'absent', 'remplace'],
    default: 'planifie'
  },
  remplacant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  heureDebut: {
    type: String,
    default: '18:00',
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)']
  },
  heureFin: {
    type: String,
    default: '08:00',
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)']
  },
  commentaire: {
    type: String,
    maxlength: [200, 'Le commentaire ne peut pas dépasser 200 caractères']
  },
  confirmeeLe: Date,
  confirmePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  _id: true
});

const planningSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Le type de planning est requis'],
    enum: {
      values: ['service', 'secteur'],
      message: 'Type de planning invalide (service ou secteur)'
    }
  },
  periode: {
    debut: {
      type: Date,
      required: [true, 'La date de début est requise']
    },
    fin: {
      type: Date,
      required: [true, 'La date de fin est requise'],
      validate: {
        validator: function(dateFin) {
          return dateFin > this.periode.debut;
        },
        message: 'La date de fin doit être postérieure à la date de début'
      }
    }
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
    required: function() {
      return this.type === 'service';
    }
  },
  gardes: [gardeSchema],
  statut: {
    type: String,
    enum: ['brouillon', 'en_validation', 'valide', 'publie', 'archive'],
    default: 'brouillon'
  },
  metadata: {
    algorithmeUtilise: {
      type: String,
      enum: ['manuel', 'rotation_equitable', 'charge_minimale'],
      default: 'rotation_equitable'
    },
    parametres: {
      respecterIndisponibilites: { type: Boolean, default: true },
      equilibrerCharge: { type: Boolean, default: true },
      inclureChefService: { type: Boolean, default: true },
      prioriteAnciennete: { type: Boolean, default: false }
    },
    statistiques: {
      totalGardes: { type: Number, default: 0 },
      weekendsCouverts: { type: Number, default: 0 },
      joursFeriesCouverts: { type: Number, default: 0 },
      tauxCouverture: { type: Number, default: 0 }
    }
  },
  validation: {
    demandePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    demandeLe: Date,
    validePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    valideLe: Date,
    commentaireValidation: String,
    rejete: {
      type: Boolean,
      default: false
    },
    motifRejet: String
  },
  notifications: {
    envoiInitial: { type: Boolean, default: false },
    rappelsEnvoyes: [Date],
    confirmationsRecues: [{
      utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      date: Date,
      methode: { type: String, enum: ['email', 'sms', 'app'] }
    }]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le créateur est requis']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour optimiser les requêtes
planningSchema.index({ site: 1, secteur: 1, service: 1 });
planningSchema.index({ 'periode.debut': 1, 'periode.fin': 1 });
planningSchema.index({ statut: 1, type: 1 });
planningSchema.index({ 'gardes.date': 1, 'gardes.utilisateur': 1 });

// Virtual pour calculer la durée du planning
planningSchema.virtual('duree').get(function() {
  const diffTime = Math.abs(this.periode.fin - this.periode.debut);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // en jours
});

// Virtual pour obtenir les weekends dans la période
planningSchema.virtual('weekends').get(function() {
  const weekends = [];
  const current = new Date(this.periode.debut);
  
  while (current <= this.periode.fin) {
    if (current.getDay() === 0 || current.getDay() === 6) { // Dimanche ou Samedi
      weekends.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return weekends;
});

// Middleware pour valider la cohérence des données
planningSchema.pre('save', async function(next) {
  try {
    // Valider que le service appartient au secteur
    if (this.type === 'service' && this.service) {
      const Service = mongoose.model('Service');
      const service = await Service.findById(this.service);
      
      if (!service) {
        return next(new Error('Service introuvable'));
      }
      
      if (service.secteur.toString() !== this.secteur.toString()) {
        return next(new Error('Le service doit appartenir au secteur spécifié'));
      }
    }
    
    // Mettre à jour les statistiques
    this.metadata.statistiques.totalGardes = this.gardes.length;
    this.metadata.statistiques.weekendsCouverts = this.weekends.length;
    
    // Calculer le taux de couverture
    const joursRequis = this.weekends.length; // Simplification
    this.metadata.statistiques.tauxCouverture = joursRequis > 0 ? 
      (this.gardes.length / joursRequis) * 100 : 0;
    
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour ajouter une garde
planningSchema.methods.ajouterGarde = function(garde) {
  // Vérifier qu'il n'y a pas déjà une garde pour cette date
  const gardeExistante = this.gardes.find(g => 
    g.date.toDateString() === garde.date.toDateString()
  );
  
  if (gardeExistante) {
    throw new Error('Une garde existe déjà pour cette date');
  }
  
  this.gardes.push(garde);
  return this.save();
};

// Méthode pour remplacer un garde
planningSchema.methods.remplacerGarde = function(gardeId, remplacantId, motif) {
  const garde = this.gardes.id(gardeId);
  if (!garde) {
    throw new Error('Garde introuvable');
  }
  
  garde.remplacant = remplacantId;
  garde.statut = 'remplace';
  garde.commentaire = motif;
  
  return this.save();
};

// Méthode pour confirmer une garde
planningSchema.methods.confirmerGarde = function(gardeId, userId) {
  const garde = this.gardes.id(gardeId);
  if (!garde) {
    throw new Error('Garde introuvable');
  }
  
  garde.statut = 'confirme';
  garde.confirmeeLe = new Date();
  garde.confirmePar = userId;
  
  return this.save();
};

// Méthode pour valider le planning
planningSchema.methods.valider = function(validateurId, commentaire) {
  if (this.statut !== 'en_validation') {
    throw new Error('Le planning doit être en validation pour être validé');
  }
  
  this.statut = 'valide';
  this.validation.validePar = validateurId;
  this.validation.valideLe = new Date();
  this.validation.commentaireValidation = commentaire;
  
  return this.save();
};

// Méthode pour rejeter le planning
planningSchema.methods.rejeter = function(validateurId, motif) {
  this.statut = 'brouillon';
  this.validation.rejete = true;
  this.validation.validePar = validateurId;
  this.validation.valideLe = new Date();
  this.validation.motifRejet = motif;
  
  return this.save();
};

// Méthode pour publier le planning
planningSchema.methods.publier = function() {
  if (this.statut !== 'valide') {
    throw new Error('Le planning doit être validé avant publication');
  }
  
  this.statut = 'publie';
  return this.save();
};

// Méthode pour obtenir les conflits de planning
planningSchema.methods.detecterConflits = async function() {
  const conflits = [];
  
  // Vérifier les conflits avec d'autres plannings
  const planningsConflictuels = await this.constructor.find({
    _id: { $ne: this._id },
    site: this.site,
    secteur: this.secteur,
    statut: { $in: ['valide', 'publie'] },
    $or: [
      {
        'periode.debut': { $lte: this.periode.fin },
        'periode.fin': { $gte: this.periode.debut }
      }
    ]
  });
  
  for (const planning of planningsConflictuels) {
    for (const garde of this.gardes) {
      const conflitGarde = planning.gardes.find(g => 
        g.date.toDateString() === garde.date.toDateString() &&
        g.utilisateur.toString() === garde.utilisateur.toString()
      );
      
      if (conflitGarde) {
        conflits.push({
          type: 'double_garde',
          date: garde.date,
          utilisateur: garde.utilisateur,
          planningConflictuel: planning._id
        });
      }
    }
  }
  
  return conflits;
};

// Méthode statique pour obtenir les plannings par période
planningSchema.statics.getByPeriode = function(siteId, dateDebut, dateFin) {
  return this.find({
    site: siteId,
    'periode.debut': { $lte: dateFin },
    'periode.fin': { $gte: dateDebut },
    statut: { $in: ['valide', 'publie'] }
  })
  .populate('secteur', 'name code')
  .populate('service', 'name code')
  .populate('gardes.utilisateur', 'firstName lastName role')
  .sort({ 'periode.debut': 1 });
};

// Méthode statique pour obtenir les plannings d'un utilisateur
planningSchema.statics.getByUtilisateur = function(userId, dateDebut, dateFin) {
  return this.find({
    'gardes.utilisateur': userId,
    'periode.debut': { $lte: dateFin },
    'periode.fin': { $gte: dateDebut },
    statut: { $in: ['valide', 'publie'] }
  })
  .populate('site', 'name code')
  .populate('secteur', 'name code')
  .populate('service', 'name code')
  .sort({ 'periode.debut': 1 });
};

const Planning = mongoose.model('Planning', planningSchema);

export default Planning;
