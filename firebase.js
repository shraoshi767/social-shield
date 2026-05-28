// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6FnL72En6LLsBIMnikHKAp2G1TcYI1Us",
  authDomain: "anomelydetection.firebaseapp.com",
  databaseURL: "https://anomelydetection-default-rtdb.firebaseio.com",
  projectId: "anomelydetection",
  storageBucket: "anomelydetection.firebasestorage.app",
  messagingSenderId: "701924480841",
  appId: "1:701924480841:web:00a7d9a2e3eca1a8f6ec98",
  measurementId: "G-1M6LFF77S2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };