import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

const apps = getApps();
let firebaseApp;

if (!apps.length) {
  firebaseApp = initializeApp();
} else {
  firebaseApp = getApp();
}

export { admin }; // Export the admin object
export const db = getFirestore(firebaseApp);