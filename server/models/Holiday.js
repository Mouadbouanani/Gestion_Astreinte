// 1. CRÉER D'ABORD LE MODÈLE Holiday (dans models/Holiday.js)
import mongoose from 'mongoose';

const HolidaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  year: {
    type: Number,
    required: true,
    index: true
  },
  country: {
    type: String,
    default: 'MA',
    index: true
  },
  type: {
    type: String,
    enum: ['fixed', 'islamic', 'variable'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: String
}, {
  timestamps: true,
  indexes: [
    { year: 1, country: 1 },
    { date: 1 }
  ]
});

export default mongoose.model('Holiday', HolidaySchema);