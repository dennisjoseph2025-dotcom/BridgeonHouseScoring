import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Use environment variables
const firebaseConfig = {
  apiKey: "AIzaSyCeLsqlF0tUDEJlbpGre-QZRK_o4fsKIEE",
  authDomain: "bridgeon-house-scoring.firebaseapp.com",
  projectId: "bridgeon-house-scoring",
  databaseURL: "https://bridgeon-house-scoring-default-rtdb.firebaseio.com/",
  storageBucket: "bridgeon-house-scoring.firebasestorage.app",
  messagingSenderId: "619628309614",
  appId: "1:619628309614:web:bfe6da71ae236718bc4a7f",
  measurementId: "G-8CRH8SF4GL"
};

// Log for debugging (remove in production)
console.log('Firebase Config Loaded:', {
  projectId: firebaseConfig.projectId,
  databaseURL: firebaseConfig.databaseURL
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;