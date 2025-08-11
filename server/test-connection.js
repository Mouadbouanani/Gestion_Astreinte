import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load both .env and config.env files
dotenv.config(); // Load .env first
dotenv.config({ path: 'config.env' }); // Then load config.env (will override .env values)

const connectDB = async () => {
    try {
        // Use MONGO_URI or fallback to ATLAS_URI for backward compatibility
        const mongoUri = process.env.MONGO_URI || process.env.ATLAS_URI || 'mongodb://localhost:27017/gestion_astreinte';

        // Hide password in logs for security
        const logUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
        console.log("🔗 Connecting to MongoDB:", logUri);

        // Remove deprecated options - they cause warnings and aren't needed
        await mongoose.connect(mongoUri, {
            // Modern connection options only
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });

        console.log('✅ MongoDB connected successfully!');
        console.log(`📊 Database: ${mongoose.connection.name}`);
        console.log(`🖥️  Host: ${mongoose.connection.host}:${mongoose.connection.port}`);

        return mongoose.connection;
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);

        // Provide helpful error messages
        if (err.message.includes('IP')) {
            console.log('\n💡 IP Whitelist Issue:');
            console.log('   1. Go to MongoDB Atlas Dashboard');
            console.log('   2. Navigate to Network Access');
            console.log('   3. Click "Add IP Address"');
            console.log('   4. Add your current IP or use 0.0.0.0/0 for development');
        }

        if (err.message.includes('authentication')) {
            console.log('\n💡 Authentication Issue:');
            console.log('   Check your username and password in config.env');
            console.log('   Current URI format:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:[PASSWORD]@'));
        }

        process.exit(1);
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('🔴 Mongoose connection error:', err.message);
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