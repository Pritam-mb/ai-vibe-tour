import { create } from 'zustand'
import { auth } from '../config/firebase'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth'

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  initialize: () => {
    try {
      onAuthStateChanged(auth, (user) => {
        console.log('Auth state changed:', user ? 'User logged in' : 'No user')
        set({ user, loading: false })
      }, (error) => {
        console.error('Auth state error:', error)
        set({ loading: false })
      })
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      set({ loading: false })
    }
  },

  signup: async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      console.log('User signed up:', userCredential.user.email)
      set({ user: userCredential.user })
      return userCredential.user
    } catch (error) {
      console.error('Signup error:', error)
      throw new Error(error.message || 'Failed to create account')
    }
  },

  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log('User logged in:', userCredential.user.email)
      set({ user: userCredential.user })
      return userCredential.user
    } catch (error) {
      console.error('Login error:', error)
      throw new Error(error.message || 'Failed to log in')
    }
  },

  logout: async () => {
    try {
      await signOut(auth)
      set({ user: null })
    } catch (error) {
      console.error('Logout error:', error)
      throw new Error(error.message || 'Failed to log out')
    }
  }
}))

// Initialize auth state listener
if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize()
}
