import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyByMHaG_OgZFhzmnLIWKVhp-SBm7eSlPz4",
  authDomain: "fullstock-shop.firebaseapp.com",
  projectId: "fullstock-shop",
  storageBucket: "fullstock-shop.firebasestorage.app",
  messagingSenderId: "629684848324",
  appId: "1:629684848324:web:709aed6cb0ea860410ab91",
  measurementId: "G-8MJ65ZS2FY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

console.log("🔥 Firebase inicializado correctamente");

export { app, db, storage };