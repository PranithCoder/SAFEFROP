import { initializeApp } from "firebase/app";
import { getFirestore, doc, collection, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// User's Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const auth = getAuth(app);

const DB_KEY = 'safedrop_tank_cleaners_db';

let isWriting = false;

// Synchronize Firebase Firestore collections to LocalStorage in real-time
export const startFirebaseSync = (defaultDatabase) => {
  const collections = ['users', 'customers', 'jobs', 'inventory', 'leads', 'invoices', 'auditLogs'];
  let localDb = { ...defaultDatabase };
  
  // Try to load initial data from local storage
  const cached = localStorage.getItem(DB_KEY);
  if (cached) {
    try {
      localDb = JSON.parse(cached);
    } catch (e) {
      console.error("Error parsing local cache during sync init:", e);
    }
  } else {
    // If no cache, initialize local storage with default database
    localStorage.setItem(DB_KEY, JSON.stringify(defaultDatabase));
  }
  
  collections.forEach(colName => {
    onSnapshot(collection(firestore, colName), (snapshot) => {
      // Skip incoming updates if we are actively writing to Firestore
      if (isWriting) return;
      
      const items = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data());
      });
      
      const localItems = localDb[colName] || [];
      
      // Sort items by ID before comparison to make sure order changes don't trigger updates
      const sortById = (a, b) => (a.id || '').localeCompare(b.id || '');
      const incomingStr = JSON.stringify([...items].sort(sortById));
      const localStr = JSON.stringify([...localItems].sort(sortById));
      
      if (incomingStr !== localStr) {
        // Read fresh database from local storage to merge concurrent updates from other collections
        const currentDbStr = localStorage.getItem(DB_KEY);
        let freshDb = currentDbStr ? JSON.parse(currentDbStr) : { ...localDb };
        
        freshDb[colName] = items;
        localDb = freshDb; // Update memory reference
        
        localStorage.setItem(DB_KEY, JSON.stringify(freshDb));
        window.dispatchEvent(new Event('db-update'));
      }
    }, (error) => {
      console.error(`Firestore sync error on collection ${colName}:`, error);
    });
  });
};

// Save database changes to Firestore via delta updates
export const saveDBToFirebase = async (newData, oldData) => {
  try {
    isWriting = true;
    
    const collections = ['users', 'customers', 'jobs', 'inventory', 'leads', 'invoices', 'auditLogs'];
    
    for (const colName of collections) {
      const newList = newData[colName] || [];
      const oldList = oldData ? (oldData[colName] || []) : [];
      
      const newMap = new Map(newList.map(item => [item.id, item]));
      const oldMap = new Map(oldList.map(item => [item.id, item]));
      
      // 1. Additions and Modifications
      for (const item of newList) {
        if (!item.id) continue;
        const oldItem = oldMap.get(item.id);
        
        // If it's a new item or has different content, write to Firestore
        if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
          await setDoc(doc(firestore, colName, item.id), item);
        }
      }
      
      // 2. Deletions
      for (const item of oldList) {
        if (!item.id) continue;
        if (!newMap.has(item.id)) {
          await deleteDoc(doc(firestore, colName, item.id));
        }
      }
    }
  } catch (err) {
    console.error("Error updating collections in Firestore:", err);
  } finally {
    isWriting = false;
  }
};
