import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

// User's Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAB9sOKfFRIhx2E0YTK08PN-umDqGebbu0",
  authDomain: "jb-group-6af90.firebaseapp.com",
  projectId: "jb-group-6af90",
  storageBucket: "jb-group-6af90.firebasestorage.app",
  messagingSenderId: "753677921479",
  appId: "1:753677921479:web:dce97fbc885687d8a4a2e2",
  measurementId: "G-MJ2WQQMPT5"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);

const DB_KEY = 'safedrop_tank_cleaners_db';
const docRef = doc(firestore, "settings", "db");

let isWriting = false;

// Synchronize Firebase Firestore to LocalStorage in real-time
export const startFirebaseSync = (defaultDatabase) => {
  // Setup real-time listener
  onSnapshot(docRef, async (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      
      // Update local storage and notify React app only if we're not currently writing
      if (!isWriting) {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
        window.dispatchEvent(new Event('db-update'));
      }
    } else {
      // If document doesn't exist on Firestore (e.g. fresh database setup),
      // initialize Firestore with defaultDatabase
      try {
        isWriting = true;
        await setDoc(docRef, defaultDatabase);
        localStorage.setItem(DB_KEY, JSON.stringify(defaultDatabase));
        window.dispatchEvent(new Event('db-update'));
      } catch (err) {
        console.error("Error initializing Firestore document:", err);
      } finally {
        isWriting = false;
      }
    }
  }, (error) => {
    console.error("Firestore sync error:", error);
  });
};

// Save database changes to Firestore
export const saveDBToFirebase = async (data) => {
  try {
    isWriting = true;
    await setDoc(docRef, data);
  } catch (err) {
    console.error("Error writing database to Firestore:", err);
  } finally {
    isWriting = false;
  }
};
