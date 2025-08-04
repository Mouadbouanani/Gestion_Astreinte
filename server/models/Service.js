import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du service est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  code: {
    type: String,
    required: [true, 'Le code du service est requis'],
    uppercase: true,
    trim: true,
    maxlength: [20, 'Le code ne peut pas dépasser 20 caractères']
  },
  secteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Secteur',
    required: [true, 'Le secteur est requis']
  },
  chefService: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le chef de service est requis'],
    validate: {
      validator: async function(userId) {
        if (!userId) return false;
        
        const User = mongoose.model('User');
        const user = await User.findById(userId);
        return user && user.role === 'chef_service' && user.service.toString() === this._id.toString();
      },
      message: 'L\'utilisateur doit avoir le rôle chef_service et être assigné à ce service'
    }
  },
  collaborateurs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: async function(userId) {
        const User = mongoose.model('User');
        const user = await User.findById(userId);
        return user && user.role === 'collaborateur' && user.service.toString() === this._id.toString();
      },
      message: 'L\'utilisateur doit avoir le rôle collaborateur et être assigné à ce service'
    }
  }],
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  minPersonnel: {
    type: Number,
    required: [true, 'Le minimum de personnel est requis'],
    min: [1, 'Minimum 1 personne requise'],
    max: [10, 'Maximum 10 personnes par service']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  configuration: {
    participationChef: {
      type: Boolean,
      default: true,
      required: true
    },
    rotationEquitable: {
      type: Boolean,
      default: true
    },
    prioriteChef: {
      type: String,
      enum: ['normale', 'reduite', 'aucune'],
      default: 'normale'
    },
    notifications: {
      planningGenere: { type: Boolean, default: true },
      gardeAssignee: { type: Boolean, default: true },
      rappelGarde: { type: Boolean, default: true }
    },
    escalade: {
      delaiReponse: {
        type: Number,
        default: 15, // minutes
        min: [1, 'Délai minimum 1 minute'],
        max: [60, 'Délai maximum 60 minutes']
      },
      tentativesMax: {
        type: Number,
        default: 3,
        min: [1, 'Minimum 1 tentative'],
        max: [5, 'Maximum 5 tentatives']
      }
    }
  },
  statistics: {
    totalPersonnel: {
      type: Number,
      default: 0
    },
    dernierePlanning: Date,
    derniereGarde: Date,
    tauxParticipation: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    tempsReponseEscalade: {
      type: Number,
      default: 0 // en minutes
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index composé pour éviter les doublons secteur/code
serviceSchema.index({ secteur: 1, code: 1 }, { unique: true });
serviceSchema.index({ secteur: 1, name: 1 }, { unique: true });
serviceSchema.index({ chefService: 1 });
serviceSchema.index({ isActive: 1 });

// Virtual pour obtenir le site via le secteur
serviceSchema.virtual('site', {
  ref: 'Site',
  localField: 'secteur',
  foreignField: '_id',
  justOne: true
});

// Virtual pour obtenir tous les plannings du service
serviceSchema.virtual('plannings', {
  ref: 'Planning',
  localField: '_id',
  foreignField: 'service'
});

// Virtual pour calculer le personnel total (chef + collaborateurs)
serviceSchema.virtual('personnelTotal').get(function() {
  return 1 + (this.collaborateurs ? this.collaborateurs.length : 0);
});

// Virtual pour vérifier si le service a assez de personnel
serviceSchema.virtual('personnelSuffisant').get(function() {
  return this.personnelTotal >= this.minPersonnel;
});

// Middleware pour valider la cohérence hiérarchique
serviceSchema.pre('save', async function(next) {
  if (this.isModified('chefService') || this.isModified('secteur') || this.isNew) {
    try {
      const User = mongoose.model('User');
      const Secteur = mongoose.model('Secteur');
      
      // Vérifier que le chef de service appartient au bon secteur
      const chef = await User.findById(this.chefService);
      if (!chef) {
        return next(new Error('Chef de service introuvable'));
      }
      
      if (chef.role !== 'chef_service') {
        return next(new Error('L\'utilisateur doit avoir le rôle chef_service'));
      }
      
      if (chef.secteur.toString() !== this.secteur.toString()) {
        return next(new Error('Le chef de service doit appartenir au même secteur'));
      }

      // Vérifier que le secteur existe
      const secteur = await Secteur.findById(this.secteur);
      if (!secteur) {
        return next(new Error('Secteur introuvable'));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Middleware pour mettre à jour les statistiques
serviceSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('collaborateurs') || this.isModified('isActive')) {
    this.statistics.totalPersonnel = this.personnelTotal;
    next();
  } else {
    next();
  }
});

// Méthode pour obtenir tous les membres du service (chef + collaborateurs)
serviceSchema.methods.getTousLesMembres = async function() {
  const User = mongoose.model('User');
  
  const chef = await User.findById(this.chefService);
  const collaborateurs = await User.find({
    _id: { $in: this.collaborateurs },
    isActive: true
  });
  
  return {
    chef,
    collaborateurs,
    total: collaborateurs.length + 1
  };
};

// Méthode pour obtenir les membres disponibles pour une période
serviceSchema.methods.getMembresDisponibles = async function(dateDebut, dateFin) {
  const User = mongoose.model('User');
  const Indisponibilite = mongoose.model('Indisponibilite');
  
  // Obtenir tous les membres du service
  const tousLesMembres = [this.chefService, ...this.collaborateurs];
  const membresDisponibles = [];
  
  for (const membreId of tousLesMembres) {
    const membre = await User.findById(membreId);
    if (!membre || !membre.isActive) continue;
    
    // Vérifier les indisponibilités
    const indisponibilites = await Indisponibilite.find({
      utilisateur: membreId,
      statut: 'approuve',
      $or: [
        {
          dateDebut: { $lte: dateFin },
          dateFin: { $gte: dateDebut }
        }
      ]
    });
    
    if (indisponibilites.length === 0) {
      membresDisponibles.push(membre);
    }
  }
  
  return membresDisponibles;
};

// Méthode pour calculer la charge de travail équitable
serviceSchema.methods.calculerChargeEquitable = async function(periode) {
  const Planning = mongoose.model('Planning');
  
  const plannings = await Planning.find({
    service: this._id,
    'periode.debut': { $gte: periode.debut },
    'periode.fin': { $lte: periode.fin },
    statut: { $in: ['valide', 'publie'] }
  });
  
  const chargeParMembre = {};
  const tousLesMembres = [this.chefService, ...this.collaborateurs];
  
  // Initialiser les compteurs
  tousLesMembres.forEach(membreId => {
    chargeParMembre[membreId] = 0;
  });
  
  // Compter les gardes par membre
  plannings.forEach(planning => {
    planning.gardes.forEach(garde => {
      if (chargeParMembre.hasOwnProperty(garde.utilisateur.toString())) {
        chargeParMembre[garde.utilisateur.toString()]++;
      }
    });
  });
  
  return chargeParMembre;
};

// Méthode pour valider la configuration du service
serviceSchema.methods.validerConfiguration = function() {
  const errors = [];
  
  if (this.minPersonnel > this.personnelTotal) {
    errors.push('Personnel insuffisant par rapport au minimum requis');
  }
  
  if (this.configuration.escalade.delaiReponse < 1) {
    errors.push('Délai de réponse d\'escalade trop court');
  }
  
  if (this.configuration.escalade.tentativesMax < 1) {
    errors.push('Nombre de tentatives d\'escalade insuffisant');
  }
  
  return {
    valide: errors.length === 0,
    erreurs: errors
  };
};

// Méthode statique pour obtenir tous les services d'un secteur
serviceSchema.statics.getBySecteur = function(secteurId) {
  return this.find({ secteur: secteurId, isActive: true })
    .populate('chefService', 'firstName lastName email phone')
    .populate('collaborateurs', 'firstName lastName email phone')
    .populate('secteur', 'name code')
    .sort({ name: 1 });
};

// Méthode statique pour obtenir les services avec personnel insuffisant
serviceSchema.statics.getServicesPersonnelInsuffisant = function(siteId) {
  return this.aggregate([
    {
      $lookup: {
        from: 'secteurs',
        localField: 'secteur',
        foreignField: '_id',
        as: 'secteurInfo'
      }
    },
    {
      $match: {
        'secteurInfo.site': mongoose.Types.ObjectId(siteId),
        isActive: true,
        $expr: { $lt: ['$statistics.totalPersonnel', '$minPersonnel'] }
      }
    },
    {
      $project: {
        name: 1,
        code: 1,
        minPersonnel: 1,
        'statistics.totalPersonnel': 1,
        deficit: { $subtract: ['$minPersonnel', '$statistics.totalPersonnel'] }
      }
    }
  ]);
};

const Service = mongoose.model('Service', serviceSchema);

export default Service;
