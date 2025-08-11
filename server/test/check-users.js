import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

// Simple user schema
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  password: String,
  role: String,
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gestion_astreinte');
    console.log('✅ Connected to MongoDB');

    // Find the admin user
    const adminUser = await User.findOne({ email: 'y.bennani@ocp.ma' });
    
    if (adminUser) {
      console.log('👤 Admin user found:');
      console.log('📧 Email:', adminUser.email);
      console.log('🔒 Password exists:', adminUser.password ? 'Yes' : 'No');
      console.log('🔒 Password length:', adminUser.password ? adminUser.password.length : 'N/A');
      console.log('🔒 Password starts with $2b$:', adminUser.password ? adminUser.password.startsWith('$2b$') : 'N/A');
      console.log('👤 Role:', adminUser.role);
      console.log('🏭 Site:', adminUser.site);
    } else {
      console.log('❌ Admin user not found');
    }

    // Count all users
    const userCount = await User.countDocuments();
    console.log(`\n📊 Total users in database: ${userCount}`);

    // List all users
    const allUsers = await User.find().select('firstName lastName email role password');
    console.log('\n👥 All users:');
    allUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role} - Password: ${user.password ? 'EXISTS' : 'MISSING'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
    process.exit(0);
  }
};

checkUsers();
