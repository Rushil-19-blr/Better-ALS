import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB8M-Q2shFvnRDPuyPJ3TZ1kfS6IZt_QaM",
  authDomain: "nps-als.firebaseapp.com",
  projectId: "nps-als",
  storageBucket: "nps-als.firebasestorage.app",
  messagingSenderId: "122717558911",
  appId: "1:122717558911:web:61626dca5474460cfe874a",
  measurementId: "G-WRQWD2JLZH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Ensure local persistence is set so the browser remembers the session
setPersistence(auth, browserLocalPersistence).catch(console.error);

export const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

export const logout = async () => {
  return signOut(auth);
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { auth, db };
