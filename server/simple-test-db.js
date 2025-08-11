// test-simple-connection.js
import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://adam:Adam37@adam.iiafxif.mongodb.net/?retryWrites=true&w=majority";

async function testConnection() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log("✅ Connected successfully!");
    
    // List databases
    const databases = await client.db().admin().listDatabases();
    console.log("Databases:", databases.databases.map(db => db.name));
    
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  } finally {
    await client.close();
  }
}

testConnection();