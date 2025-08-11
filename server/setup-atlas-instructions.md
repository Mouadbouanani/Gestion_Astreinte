# 🔧 MongoDB Atlas Setup Instructions

## Current Issue
Authentication failed with user `adam` and password `adam37`

## Step-by-Step Fix

### 1. 🌐 Network Access (IP Whitelist)
1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Select your project
3. Click **"Network Access"** in the left sidebar
4. Click **"Add IP Address"**
5. Choose one of these options:
   - **For testing**: Add `0.0.0.0/0` (allows access from anywhere)
   - **For security**: Add your current IP address
6. Click **"Confirm"**

### 2. 👤 Database Access (User Permissions)
1. Click **"Database Access"** in the left sidebar
2. Find your user `adam` or create a new one
3. Click **"Edit"** (or "Add New Database User")
4. Set these permissions:
   - **Database User Privileges**: Choose "Built-in Role"
   - **Role**: Select "Atlas admin" or "Read and write to any database"
5. **Username**: `adam`
6. **Password**: `adam37` (or create a new strong password)
7. Click **"Update User"** or **"Add User"**

### 3. 🔗 Get Correct Connection String
1. Go to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string
5. Replace `<password>` with your actual password

### 4. 🧪 Test Connection
After making these changes, run:
```bash
node test-atlas-comprehensive.js
```

## Alternative: Create New User
If the current user doesn't work, create a new one:

1. **Database Access** → **"Add New Database User"**
2. **Username**: `ocp_admin`
3. **Password**: `OCP_Admin_2024!`
4. **Role**: "Atlas admin"
5. Update your config.env with the new credentials

## Common Issues & Solutions

### Issue: "bad auth : authentication failed"
- ✅ Check username/password are correct
- ✅ Verify user exists in Database Access
- ✅ Ensure user has proper permissions

### Issue: "ENOTFOUND" or timeout
- ✅ Check Network Access (IP whitelist)
- ✅ Verify internet connection
- ✅ Check firewall/antivirus settings

### Issue: "MongoServerError: not authorized"
- ✅ User needs "readWrite" role minimum
- ✅ For admin operations, use "Atlas admin" role

## Test Your Setup
Once you've made the changes, your connection should work with:
```
mongodb+srv://adam:adam37@adam.iiafxif.mongodb.net/gestion_astreinte?retryWrites=true&w=majority&appName=adam
```

## Next Steps After Connection Works
1. Run the seed script: `npm run seed`
2. Start your server: `npm run dev`
3. Test your application endpoints
