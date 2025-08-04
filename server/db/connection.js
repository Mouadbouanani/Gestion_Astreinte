import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configuration des variables d'environnement
dotenv.config();

const connectDB = async () => {
  try {
    // Use MONGO_URI or fallback to ATLAS_URI for backward compatibility
    const mongoUri = process.env.MONGO_URI || process.env.ATLAS_URI || 'mongodb://localhost:27017/gestion_astreinte';

    console.log("🔗 Connecting to MongoDB:", mongoUri);

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(' MongoDB connected successfully!');
    console.log(` Database: ${mongoose.connection.name}`);
    console.log(` Host: ${mongoose.connection.host}:${mongoose.connection.port}`);

    return mongoose.connection;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed through app termination');
  process.exit(0);
});

export default connectDB;
