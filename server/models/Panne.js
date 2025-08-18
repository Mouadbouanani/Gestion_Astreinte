import mongoose from 'mongoose';

const PanneSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['technique', 'securite', 'maintenance', 'autre'],
    default: 'technique',
  },
  urgence: {
    type: String,
    enum: ['faible', 'moyenne', 'haute', 'critique'],
    default: 'moyenne',
  },
  statut: {
    type: String,
    enum: ['declaree', 'ouverte', 'en_cours', 'resolue'],
    default: 'declaree',
  },
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: false,
  },
  secteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Secteur',
    required: false,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: false,
  },
  dateCreation: {
    type: Date,
    default: Date.now,
  },
  dateResolution: {
    type: Date,
    required: false,
  },
  declaredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  commentaires: [{
    texte: String,
    auteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  priorite: {
    type: String,
    enum: ['basse', 'normale', 'elevee', 'urgente'],
    default: 'normale',
  }
});

// Index for better query performance
PanneSchema.index({ statut: 1, dateCreation: -1 });
PanneSchema.index({ site: 1, secteur: 1, service: 1 });
PanneSchema.index({ declaredBy: 1 });

export default mongoose.model('Panne', PanneSchema);
