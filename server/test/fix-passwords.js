import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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

const fixPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gestion_astreinte');
    console.log('✅ Connected to MongoDB');

    // Password mapping
    const passwordMap = {
      'y.bennani@ocp.ma': 'Admin2024!',
      'a.elfassi@ocp.ma': 'Chef2024!',
      'f.alaoui@ocp.ma': 'Chef2024!',
      'm.tazi@ocp.ma': 'Ing2024!',
      'a.benali@ocp.ma': 'Ing2024!',
      'o.idrissi@ocp.ma': 'Ing2024!',
      'r.amrani@ocp.ma': 'Service2024!',
      'k.berrada@ocp.ma': 'Service2024!',
      'h.zouani@ocp.ma': 'Service2024!',
      'l.mansouri@ocp.ma': 'Collab2024!',
      'k.benjelloun@ocp.ma': 'Collab2024!',
      'n.chraibi@ocp.ma': 'Collab2024!',
      's.kettani@ocp.ma': 'Collab2024!'
    };

    console.log('🔐 Fixing passwords with proper bcrypt hashing...');

    for (const [email, plainPassword] of Object.entries(passwordMap)) {
      const user = await User.findOne({ email });
      
      if (user) {
        // Hash the password properly
        const hashedPassword = await bcrypt.hash(plainPassword, 12);
        
        // Update the user's password
        user.password = hashedPassword;
        await user.save();
        
        console.log(`✅ Fixed password for ${user.firstName} ${user.lastName} (${email})`);
        console.log(`   🔒 New hash: ${hashedPassword.substring(0, 20)}...`);
      } else {
        console.log(`❌ User not found: ${email}`);
      }
    }

    console.log('\n🎉 All passwords fixed!');
    
    // Verify one user
    const testUser = await User.findOne({ email: 'y.bennani@ocp.ma' });
    if (testUser) {
      console.log('\n🧪 Testing password verification:');
      const isValid = await bcrypt.compare('Admin2024!', testUser.password);
      console.log(`✅ Password verification test: ${isValid ? 'SUCCESS' : 'FAILED'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
    process.exit(0);
  }
};

fixPasswords();
