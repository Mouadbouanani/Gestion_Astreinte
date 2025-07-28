import mongoose from 'mongoose';

const siteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du site est requis'],
    unique: true,
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  code: {
    type: String,
    required: [true, 'Le code du site est requis'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Le code doit contenir au moins 3 caractères'],
    maxlength: [4, 'Le code doit contenir au maximum 4 caractères'],
    match: [/^[A-Z]{3,4}$/, 'Le code doit contenir uniquement des lettres majuscules']
  },
  address: {
    type: String,
    required: [true, 'L\'adresse du site est requise'],
    trim: true,
    maxlength: [200, 'L\'adresse ne peut pas dépasser 200 caractères']
  },
  coordinates: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude invalide'],
      max: [90, 'Latitude invalide']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude invalide'],
      max: [180, 'Longitude invalide']
    }
  },
  timezone: {
    type: String,
    default: 'Africa/Casablanca'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  configuration: {
    escaladeTimeouts: {
      niveau1ToNiveau2: {
        type: Number,
        default: 15, // minutes
        min: [1, 'Timeout minimum 1 minute'],
        max: [60, 'Timeout maximum 60 minutes']
      },
      niveau2ToNiveau3: {
        type: Number,
        default: 30, // minutes
        min: [1, 'Timeout minimum 1 minute'],
        max: [120, 'Timeout maximum 120 minutes']
      }
    },
    notifications: {
      smsEnabled: {
        type: Boolean,
        default: true
      },
      emailEnabled: {
        type: Boolean,
        default: true
      },
      pushEnabled: {
        type: Boolean,
        default: true
      }
    },
    planning: {
      generateInAdvance: {
        type: Number,
        default: 30, // jours
        min: [7, 'Minimum 7 jours à l\'avance'],
        max: [90, 'Maximum 90 jours à l\'avance']
      },
      minPersonnelPerService: {
        type: Number,
        default: 1,
        min: [1, 'Minimum 1 personne par service']
      }
    }
  },
  statistics: {
    totalUsers: {
      type: Number,
      default: 0
    },
    totalSecteurs: {
      type: Number,
      default: 0
    },
    totalServices: {
      type: Number,
      default: 0
    },
    lastPlanningGeneration: Date,
    lastEscalade: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour optimiser les requêtes
siteSchema.index({ code: 1 });
siteSchema.index({ name: 1 });
siteSchema.index({ isActive: 1 });

// Virtual pour obtenir tous les secteurs du site
siteSchema.virtual('secteurs', {
  ref: 'Secteur',
  localField: '_id',
  foreignField: 'site'
});

// Virtual pour obtenir tous les utilisateurs du site
siteSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'site'
});

// Middleware pour mettre à jour les statistiques avant sauvegarde
siteSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('isActive')) {
    try {
      // Compter les utilisateurs actifs
      const User = mongoose.model('User');
      this.statistics.totalUsers = await User.countDocuments({ 
        site: this._id, 
        isActive: true 
      });

      // Compter les secteurs actifs
      const Secteur = mongoose.model('Secteur');
      this.statistics.totalSecteurs = await Secteur.countDocuments({ 
        site: this._id, 
        isActive: true 
      });

      // Compter les services actifs
      const Service = mongoose.model('Service');
      this.statistics.totalServices = await Service.countDocuments({ 
        site: this._id, 
        isActive: true 
      });

      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Méthode pour obtenir la configuration complète du site
siteSchema.methods.getFullConfiguration = function() {
  return {
    site: {
      id: this._id,
      name: this.name,
      code: this.code,
      timezone: this.timezone
    },
    escalade: this.configuration.escaladeTimeouts,
    notifications: this.configuration.notifications,
    planning: this.configuration.planning
  };
};

// Méthode pour mettre à jour les statistiques
siteSchema.methods.updateStatistics = async function() {
  const User = mongoose.model('User');
  const Secteur = mongoose.model('Secteur');
  const Service = mongoose.model('Service');

  this.statistics.totalUsers = await User.countDocuments({ 
    site: this._id, 
    isActive: true 
  });
  
  this.statistics.totalSecteurs = await Secteur.countDocuments({ 
    site: this._id, 
    isActive: true 
  });
  
  this.statistics.totalServices = await Service.countDocuments({ 
    site: this._id, 
    isActive: true 
  });

  return this.save();
};

// Méthode statique pour obtenir tous les sites actifs avec leurs statistiques
siteSchema.statics.getActiveSitesWithStats = function() {
  return this.find({ isActive: true })
    .select('name code address statistics configuration')
    .sort({ name: 1 });
};

// Méthode statique pour obtenir un site par code
siteSchema.statics.getBySiteCode = function(code) {
  return this.findOne({ code: code.toUpperCase(), isActive: true })
    .populate('secteurs')
    .populate('users', 'firstName lastName role isActive');
};

// Méthode pour valider la configuration d'escalade
siteSchema.methods.validateEscaladeConfiguration = function() {
  const { niveau1ToNiveau2, niveau2ToNiveau3 } = this.configuration.escaladeTimeouts;
  
  if (niveau1ToNiveau2 >= niveau2ToNiveau3) {
    throw new Error('Le timeout niveau 1→2 doit être inférieur au timeout niveau 2→3');
  }
  
  return true;
};

const Site = mongoose.model('Site', siteSchema);

export default Site;
