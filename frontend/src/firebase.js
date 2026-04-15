import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDEzxp0C_s848KoWU48TZzQ74lFE6xYoBI",
  authDomain: "smart-bill-manager-b9023.firebaseapp.com",
  projectId: "smart-bill-manager-b9023",
  storageBucket: "smart-bill-manager-b9023.firebasestorage.app",
  messagingSenderId: "891460011048",
  appId: "1:891460011048:web:4f9d9fb9a5260181b8a11d",
  measurementId: "G-E79GXXVKH9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
if (typeof window !== "undefined") {
  getAnalytics(app);
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
