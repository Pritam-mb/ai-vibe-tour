import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBykHKGolQ_WtBr7CPL4hnHzx1rs61O5C0",
  authDomain: "vibe-tour.firebaseapp.com",
  projectId: "vibe-tour",
  storageBucket: "vibe-tour.firebasestorage.app",
  messagingSenderId: "381979630398",
  appId: "1:381979630398:web:f7332357eeb966ac372a6f",
  measurementId: "G-0BTMJ7HF7J"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

export default app
