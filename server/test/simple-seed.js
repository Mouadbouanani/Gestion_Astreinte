import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Site from '../models/Site.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

console.log('🌱 Starting simple database seeding...');

// Load environment variables
dotenv.config({ path: './config.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gestion_astreinte';
    console.log(' Connecting to MongoDB:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully!');
    
    return mongoose.connection;
  } catch (err) {
    console.error(' MongoDB connection error:', err);
    process.exit(1);
  }
};

// Create basic sites
const createSites = async () => {
  try {
    console.log(' Creating OCP sites...');
    
    const sitesData = [
      {
        name: 'Casablanca',
        code: 'CAS',
        address: 'Zone Industrielle Ain Sebaa, Casablanca, Maroc',
        coordinates: { latitude: 33.5731, longitude: -7.5898 }
      },
      {
        name: 'Jorf Lasfar',
        code: 'JLF',
        address: 'Complexe Chimique Jorf Lasfar, El Jadida, Maroc',
        coordinates: { latitude: 33.1056, longitude: -8.6333 }
      },
      {
        name: 'Khouribga',
        code: 'KHO',
        address: 'Site Minier de Khouribga, Khouribga, Maroc',
        coordinates: { latitude: 32.8811, longitude: -6.9063 }
      }
    ];
    
    // Clear existing sites
    await Site.deleteMany({});
    
    // Create new sites
    const sites = await Site.insertMany(sitesData);
    console.log(` ${sites.length} sites created`);
    
    return sites;
  } catch (error) {
    console.error(' Error creating sites:', error);
    throw error;
  }
};

// Create admin user
const createAdmin = async (sites) => {
  try {
    console.log(' Creating admin user...');
    
    // Clear existing users
    await User.deleteMany({});
    
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    
    const admin = new User({
      firstName: 'Admin',
      lastName: 'OCP',
      email: 'admin@ocp.ma',
      phone: '+212661234567',
      password: hashedPassword,
      role: 'admin',
      site: sites[0]._id, // Casablanca
      isActive: true
    });
    
    await admin.save();
    console.log(' Admin user created');
    
    return admin;
  } catch (error) {
    console.error(' Error creating admin:', error);
    throw error;
  }
};

// Create test users
const createTestUsers = async (sites) => {
  try {
    console.log(' Creating test users...');
    
    const testUsers = [
      {
        firstName: 'Chef',
        lastName: 'Secteur Test',
        email: 'chef.secteur@ocp.ma',
        phone: '+212661234568',
        password: await bcrypt.hash('Chef123!', 12),
        role: 'chef_secteur',
        site: sites[0]._id,
        isActive: true
      },
      {
        firstName: 'Ingénieur',
        lastName: 'Test',
        email: 'ingenieur@ocp.ma',
        phone: '+212661234569',
        password: await bcrypt.hash('Ing123!', 12),
        role: 'ingenieur',
        site: sites[0]._id,
        isActive: true
      }
    ];
    
    const users = await User.insertMany(testUsers);
    console.log(` ${users.length} test users created`);
    
    return users;
  } catch (error) {
    console.error(' Error creating test users:', error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log(' Starting database seeding...');
    
    await connectDB();
    
    const sites = await createSites();
    const admin = await createAdmin(sites);
    const testUsers = await createTestUsers(sites);
    
    console.log('\n Database seeding completed successfully!');
    console.log('\n Created accounts:');
    console.log(' Admin: admin@ocp.ma / Admin123!');
    console.log(' Chef Secteur: chef.secteur@ocp.ma / Chef123!');
    console.log(' Ingénieur: ingenieur@ocp.ma / Ing123!');
    
    console.log('\n Summary:');
    console.log(` Sites: ${sites.length}`);
    console.log(` Users: ${1 + testUsers.length}`);
    
  } catch (error) {
    console.error(' Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run seeding
seedDatabase();
