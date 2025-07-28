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
  address: String,
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const addAddresses = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gestion_astreinte');
    console.log('✅ Connected to MongoDB');

    // Address mapping for ingenieur and collaborateur users
    const addressMap = {
      // INGÉNIEURS
      'm.tazi@ocp.ma': 'Résidence Al Manar, Apt 15, Hay Hassani, Casablanca 20230',
      'a.benali@ocp.ma': 'Villa 42, Lotissement Yasmine, El Jadida 24000',
      'o.idrissi@ocp.ma': 'Immeuble Atlas, 3ème étage, Avenue Mohammed V, Khouribga 25000',
      
      // COLLABORATEURS
      'l.mansouri@ocp.ma': 'Appartement 8, Résidence Anfa, Boulevard Zerktouni, Casablanca 20100',
      'k.benjelloun@ocp.ma': 'Maison 25, Quartier Industriel, Route de Casablanca, El Jadida 24000',
      'n.chraibi@ocp.ma': 'Villa 12, Cité Phosphate, Avenue des FAR, Khouribga 25000',
      's.kettani@ocp.ma': 'Résidence Océan, Bloc B, Apt 7, Avenue de la Corniche, Safi 46000'
    };

    console.log('🏠 Adding addresses to ingenieur and collaborateur users...');

    let updatedCount = 0;

    for (const [email, address] of Object.entries(addressMap)) {
      const user = await User.findOne({ email });
      
      if (user) {
        // Update the user's address
        user.address = address;
        await user.save();
        
        console.log(`✅ Added address for ${user.firstName} ${user.lastName} (${email})`);
        console.log(`   🏠 Address: ${address}`);
        console.log(`   👤 Role: ${user.role}`);
        console.log('');
        updatedCount++;
      } else {
        console.log(`❌ User not found: ${email}`);
      }
    }

    console.log(`🎉 Successfully added addresses to ${updatedCount} users!`);
    
    // Verify the updates
    console.log('\n📊 Verification - Users with addresses:');
    const usersWithAddresses = await User.find({ 
      role: { $in: ['ingenieur', 'collaborateur'] },
      address: { $exists: true, $ne: null }
    }).select('firstName lastName email role address');

    usersWithAddresses.forEach(user => {
      console.log(`👤 ${user.firstName} ${user.lastName} (${user.role})`);
      console.log(`   📧 ${user.email}`);
      console.log(`   🏠 ${user.address}`);
      console.log('');
    });

    console.log(`✅ Total users with addresses: ${usersWithAddresses.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

addAddresses();
