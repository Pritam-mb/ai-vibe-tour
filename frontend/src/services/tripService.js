import { db } from '../config/firebase'
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs,
  updateDoc, 
  query, 
  where,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export const tripService = {
  // Create a new trip
  async createTrip(tripData) {
    const memberIds = Array.from(
      new Set(
        (tripData.memberIds || (tripData.members || [])
          .map((m) => (typeof m === 'string' ? m : m?.uid))
          .filter(Boolean))
      )
    )

    const docRef = await addDoc(collection(db, 'trips'), {
      ...tripData,
      memberIds,
      pendingRequests: [],
      itinerary: [],
      createdAt: serverTimestamp()
    })
    return docRef.id
  },

  // Get user's trips
  async getUserTrips(userId) {
    const tripsById = new Map()

    // Preferred schema: memberIds: string[]
    try {
      const q = query(collection(db, 'trips'), where('memberIds', 'array-contains', userId))
      const snapshot = await getDocs(q)
      snapshot.docs.forEach((d) => tripsById.set(d.id, { id: d.id, ...d.data() }))
    } catch (e) {
      // ignore (field might not exist yet)
    }

    // Backwards compatibility: members: string[]
    try {
      const q2 = query(collection(db, 'trips'), where('members', 'array-contains', userId))
      const snapshot2 = await getDocs(q2)
      snapshot2.docs.forEach((d) => tripsById.set(d.id, { id: d.id, ...d.data() }))
    } catch (e) {
      // ignore
    }

    return Array.from(tripsById.values())
  },

  // Subscribe to real-time trip updates
  subscribeToTrip(tripId, callback) {
    const unsubscribe = onSnapshot(doc(db, 'trips', tripId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() })
      }
    })
    return unsubscribe
  },

  // Generate itinerary using AI
  async generateItinerary(tripId) {
    const res = await fetch(`${API_URL}/trips/${tripId}/generate-itinerary`, {
      method: 'POST'
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Itinerary generation failed: ${res.status} ${res.statusText} ${text}`)
    }

    return res.json()
  },

  // Add a new request
  async addRequest(tripId, requestData) {
    const tripRef = doc(db, 'trips', tripId)
    const tripDoc = await getDoc(tripRef)
    const trip = tripDoc.data()

    const newRequest = {
      id: Date.now().toString(),
      ...requestData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      suggestedBy: 'Current User' // TODO: Get from auth
    }

    await updateDoc(tripRef, {
      pendingRequests: [...(trip.pendingRequests || []), newRequest]
    })
  },

  // Analyze request with AI
  async analyzeRequest(tripId, requestId) {
    const response = await fetch(`${API_URL}/trips/${tripId}/analyze-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId })
    })
    return response.json()
  },

  // Accept request and update itinerary
  async acceptRequest(tripId, requestId) {
    const response = await fetch(`${API_URL}/trips/${tripId}/accept-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId })
    })
    return response.json()
  },

  // Reject request
  async rejectRequest(tripId, requestId) {
    const tripRef = doc(db, 'trips', tripId)
    const tripDoc = await getDoc(tripRef)
    const trip = tripDoc.data()

    const updatedRequests = trip.pendingRequests.filter(req => req.id !== requestId)
    
    await updateDoc(tripRef, {
      pendingRequests: updatedRequests
    })
  },

  // Compare multiple requests using Google Places API
  async compareRequests(tripId, requestIds) {
    const response = await fetch(`${API_URL}/trips/${tripId}/compare-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestIds })
    })
    
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Comparison failed: ${response.status} ${response.statusText} ${text}`)
    }
    
    return response.json()
  }
}
