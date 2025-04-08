// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCZIshsqcLG4hXTWNyTyH65_mCgb8hT4-4",
  authDomain: "findfest-305ea.firebaseapp.com",
  projectId: "findfest-305ea",
  storageBucket: "findfest-305ea.firebasestorage.app",
  messagingSenderId: "132122873645",
  appId: "1:132122873645:web:5e64e95e7997c4bb684da4",
  measurementId: "G-YB9YY4B5V5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider(app);
export const database = getFirestore(app);