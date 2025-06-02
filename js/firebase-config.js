// Firebase Configuration for Farmers Web
// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getStorage, connectStorageEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

// Your web app's Firebase configuration
// For Firebase JS SDK v9-compat and later, measurementId is optional
const firebaseConfig = {
  // apiKey: "your-api-key-here",
  // authDomain: "your-project-id.firebaseapp.com",
  // projectId: "your-project-id",
  // storageBucket: "your-project-id.appspot.com",
  // messagingSenderId: "123456789",
  // appId: "1:123456789:web:abcdef123456",
  // measurementId: "G-XXXXXXXXXX"

  apiKey: "AIzaSyBis5I6g7yD5mYuewvNF3TXivbjS182GK0",
  authDomain: "farmers-web-12c20.firebaseapp.com",
  projectId: "farmers-web-12c20",
  storageBucket: "farmers-web-12c20.firebasestorage.app",
  messagingSenderId: "325434531946",
  appId: "1:325434531946:web:8449a756580de056302a13",
  measurementId: "G-GG6W5YZEFL"

  
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize Analytics (optional)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };

// For development - connect to emulators if running locally
if (window.location.hostname === 'localhost') {
  // Uncomment these lines if you want to use Firebase emulators for development
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectStorageEmulator(storage, 'localhost', 9199);
}

export default app;