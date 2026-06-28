import { initializeApp } from "firebase/app";
import { getFirestore, doc, collection, setDoc, deleteDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import fs from 'fs';
import path from 'path';

// Parse .env manually at runtime to avoid hardcoding secrets
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val;
      }
    });
  }
} catch (e) {
  console.error("Error loading env file:", e);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};


const defaultDatabase = {
  users: [
    { id: 'SD-STAFF-2001', email: 'pranith@safedrop.com', password: 'admin123', name: 'Pranith', role: 'super_admin' },
    { id: 'SD-STAFF-2002', email: 'anurathan@safedrop.com', password: 'admin123', name: 'Anurathan', role: 'admin' }
  ],
  customers: [],
  jobs: [],
  inventory: [],
  leads: [],
  invoices: [],
  auditLogs: []
};

console.log("Connecting to Firebase...");
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

async function seed() {
  try {
    console.log("Cleaning up legacy monolithic safedrop/db document...");
    const oldDocRef = doc(firestore, "safedrop", "db");
    try {
      await deleteDoc(oldDocRef);
      console.log("Legacy monolithic document successfully deleted!");
    } catch (delErr) {
      console.log("Legacy document did not exist or could not be deleted, proceeding to seed...");
    }

    console.log("Seeding fresh database with clean admin users in Firestore...");
    const collections = ['users', 'customers', 'jobs', 'inventory', 'leads', 'invoices', 'auditLogs'];
    for (const colName of collections) {
      console.log(`Seeding collection: ${colName}...`);
      const list = defaultDatabase[colName] || [];
      for (const item of list) {
        const itemToWrite = { ...item };
        if (colName === 'users') {
          delete itemToWrite.password;
        }
        await setDoc(doc(firestore, colName, item.id), itemToWrite);
      }
    }
    console.log("Database successfully seeded in Firestore!");

    // Seed Auth profiles
    console.log("Seeding Authentication profiles...");
    const auth = getAuth(app);
    for (const user of defaultDatabase.users) {
      try {
        console.log(`Creating Auth profile for ${user.email}...`);
        await createUserWithEmailAndPassword(auth, user.email, user.password);
        console.log(`Auth profile created successfully for ${user.email}.`);
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          console.log(`Auth profile for ${user.email} already exists. Skipping.`);
        } else {
          console.error(`Failed to create Auth profile for ${user.email}:`, err.message);
        }
      }
    }

  } catch (error) {
    console.error("Error connecting or writing to Firebase database:", error);
  } finally {
    process.exit(0);
  }
}

seed();
