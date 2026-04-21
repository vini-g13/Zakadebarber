// ============================================================
// FIREBASE CONFIGURATIE — vul dit in met jouw project-gegevens
// Zie README.md voor stap-voor-stap setup instructies
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "JOUW_API_KEY",
  authDomain:        "JOUW_PROJECT_ID.firebaseapp.com",
  projectId:         "JOUW_PROJECT_ID",
  storageBucket:     "JOUW_PROJECT_ID.appspot.com",
  messagingSenderId: "JOUW_SENDER_ID",
  appId:             "JOUW_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);
