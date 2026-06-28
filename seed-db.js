import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCEm7q6HoCRWu9mhqTewXfhYEe5ungbCWs",
  authDomain: "safe-drop-a2693.firebaseapp.com",
  projectId: "safe-drop-a2693",
  storageBucket: "safe-drop-a2693.firebasestorage.app",
  messagingSenderId: "869723417230",
  appId: "1:869723417230:web:8f9d5fe9136fe3e3ec77df",
  measurementId: "G-ELR6ZH2QBR"
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
const docRef = doc(firestore, "safedrop", "db");

async function seed() {
  try {
    console.log("Seeding fresh database with clean admin users in Firestore...");
    await setDoc(docRef, defaultDatabase);
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
