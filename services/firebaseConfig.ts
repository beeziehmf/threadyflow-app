import { initializeApp } from "firebase/app";
import { getAuth, FacebookAuthProvider, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "threadify-ai-app.firebaseapp.com",
  projectId: "threadify-ai-app",
  storageBucket: "threadify-ai-app.firebasestorage.app",
  messagingSenderId: "776909071360",
  appId: "1:776909071360:web:8c35d98b0a0a6c0121a4e5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth Providers
export const facebookProvider = new FacebookAuthProvider();
export const googleProvider = new GoogleAuthProvider();

// You can add other services here, e.g., storage
// export const storage = getStorage(app);
