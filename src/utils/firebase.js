import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// User's Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCEm7q6HoCRWu9mhqTewXfhYEe5ungbCWs",
  authDomain: "safe-drop-a2693.firebaseapp.com",
  projectId: "safe-drop-a2693",
  storageBucket: "safe-drop-a2693.firebasestorage.app",
  messagingSenderId: "869723417230",
  appId: "1:869723417230:web:8f9d5fe9136fe3e3ec77df",
  measurementId: "G-ELR6ZH2QBR"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const auth = getAuth(app);

const DB_KEY = 'safedrop_tank_cleaners_db';
const docRef = doc(firestore, "safedrop", "db");

let isWriting = false;

// Synchronize Firebase Firestore to LocalStorage in real-time
export const startFirebaseSync = (defaultDatabase) => {
  // Setup real-time listener
  onSnapshot(docRef, async (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      
      // Update local storage and notify React app only if we're not currently writing
      // and only if the data actually changed.
      if (!isWriting) {
        const firestoreDataStr = JSON.stringify(data);
        const localDataStr = localStorage.getItem(DB_KEY);
        if (localDataStr !== firestoreDataStr) {
          localStorage.setItem(DB_KEY, firestoreDataStr);
          window.dispatchEvent(new Event('db-update'));
        }
      }
    } else {
      // If document doesn't exist on Firestore (e.g. fresh database setup),
      // initialize Firestore with defaultDatabase
      try {
        isWriting = true;
        const defaultDataStr = JSON.stringify(defaultDatabase);
        await setDoc(docRef, defaultDatabase);
        localStorage.setItem(DB_KEY, defaultDataStr);
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
