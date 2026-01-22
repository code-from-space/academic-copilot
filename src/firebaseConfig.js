// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage"; // This allows PDF/Note uploads
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDOdmYGCzM3wlIpREvDVHhRdRcbYu-QxKM",
  authDomain: "academic-copilot--linux.firebaseapp.com",
  projectId: "academic-copilot--linux",
  storageBucket: "academic-copilot--linux.firebasestorage.app",
  messagingSenderId: "602443206001",
  appId: "1:602443206001:web:4b56557bf12fca1e6cbad0",
  measurementId: "G-VQZBK8FEQ0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app); // Export this so we can use it in App.jsx