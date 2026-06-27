import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAa8k3erl4tcr2lvJVwAoIFrn-CKr4ws2I",
  authDomain: "jr-cashflow-a4a0b.firebaseapp.com",
  projectId: "jr-cashflow-a4a0b",
  storageBucket: "jr-cashflow-a4a0b.firebasestorage.app",
  messagingSenderId: "60258206517",
  appId: "1:60258206517:web:46300bbcaefa1c9b17027c",
  measurementId: "G-6TJDB1CGG7"
};

const defaultDatabase = {
  users: [
    { id: 'SD-STAFF-2001', email: 'superadmin@safedrop.com', password: 'admin123', name: 'Super Admin', role: 'super_admin' },
    { id: 'SD-STAFF-2002', email: 'admin@safedrop.com', password: 'admin123', name: 'Operations Admin', role: 'admin' },
    { id: 'SD-STAFF-2003', email: 'tech1@safedrop.com', password: 'tech123', name: 'Shan & Arul', role: 'technician', crewName: 'Crew A - Shan & Arul', lat: 8.5670, lng: 81.2330, status: 'Active' },
    { id: 'SD-STAFF-2004', email: 'tech2@safedrop.com', password: 'tech123', name: 'Ravi & Niro', role: 'technician', crewName: 'Crew B - Ravi & Niro', lat: 8.5790, lng: 81.2180, status: 'Active' }
  ],
  customers: [],
  jobs: [],
  inventory: [],
  leads: [],
  invoices: []
};

console.log("Connecting to Firebase...");
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const docRef = doc(firestore, "settings", "db");

async function seed() {
  try {
    console.log("Checking Firestore database connection...");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      console.log("Database connection successful! Current Firestore data:");
      console.log(JSON.stringify(snapshot.data(), null, 2));
    } else {
      console.log("Connected successfully. No document found. Seeding fresh database...");
      await setDoc(docRef, defaultDatabase);
      console.log("Fresh database successfully seeded in Firestore!");
    }
  } catch (error) {
    console.error("Error connecting or writing to Firestore database:", error);
  } finally {
    process.exit(0);
  }
}

seed();
