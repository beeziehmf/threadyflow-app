import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as firebaseAdmin from "firebase-admin"; // Use a different name to avoid conflict

const apps = getApps();
let firebaseAppInstance;

if (!apps.length) {
  firebaseAppInstance = initializeApp();
} else {
  firebaseAppInstance = getApp();
}

// Export the initialized admin object
export const admin = firebaseAdmin; 
export const db = getFirestore(firebaseAppInstance);
export { FieldValue }; // Export FieldValue directly
