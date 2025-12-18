// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { 
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAF_qOMLTEi2RcBSlWrM520_1nrt7m4TiA",
  authDomain: "turnos-manicuria.firebaseapp.com",
  projectId: "turnos-manicuria",
  storageBucket: "turnos-manicuria.firebasestorage.app",
  messagingSenderId: "254575073746",
  appId: "1:254575073746:web:adc9a985554cc16b55d00b",
  measurementId: "G-S9VJ5JTR3X"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { 
  db,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  getDoc
};
