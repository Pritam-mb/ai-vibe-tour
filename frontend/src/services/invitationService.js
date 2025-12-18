import { db, auth } from '../config/firebase'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  query, 
  where, 
  getDocs,
  getDoc,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore'

export const invitationService = {
  // Send invitation
  async sendInvitation(tripId, inviterEmail, inviteeEmail, tripName) {
    try {
      // Validate inputs
      if (!tripId || !inviterEmail || !inviteeEmail || !tripName) {
        throw new Error('Missing required fields')
      }

      if (!db) {
        throw new Error('Firebase not initialized')
      }

      const invitationsRef = collection(db, 'invitations')
      
      // Check if invitation already exists
      const existingQuery = query(
        invitationsRef,
        where('tripId', '==', tripId),
        where('inviteeEmail', '==', inviteeEmail),
        where('status', '==', 'pending')
      )
      const existing = await getDocs(existingQuery)
      
      if (!existing.empty) {
        throw new Error('Invitation already sent to this user')
      }

      const invitation = {
        tripId,
        tripName,
        inviterEmail,
        inviteeEmail,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }

      console.log('Creating invitation:', invitation)
      const docRef = await addDoc(invitationsRef, invitation)
      console.log('Invitation created with ID:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('Error sending invitation:', error)
      throw error
    }
  },

  // Get user's pending invitations
  async getUserInvitations(userEmail) {
    try {
      const invitationsRef = collection(db, 'invitations')
      const q = query(
        invitationsRef,
        where('inviteeEmail', '==', userEmail),
        where('status', '==', 'pending')
      )
      
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error getting invitations:', error)
      throw error
    }
  },

  // Listen to real-time invitations
  subscribeToInvitations(userEmail, callback) {
    const invitationsRef = collection(db, 'invitations')
    const q = query(
      invitationsRef,
      where('inviteeEmail', '==', userEmail),
      where('status', '==', 'pending')
    )

    return onSnapshot(q, (snapshot) => {
      const invitations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      callback(invitations)
    })
  },

  // Accept invitation
  async acceptInvitation(invitationId, userId) {
    try {
      const invitationRef = doc(db, 'invitations', invitationId)
      const invitationSnap = await getDoc(invitationRef)
      
      if (!invitationSnap.exists()) {
        throw new Error('Invitation not found')
      }

      const invitation = invitationSnap.data()
      
      // Add user to trip members
      const tripRef = doc(db, 'trips', invitation.tripId)
      const tripSnap = await getDoc(tripRef)
      
      if (tripSnap.exists()) {
        const tripData = tripSnap.data()
        
        // Ensure members array exists and add new member
        const currentMembers = tripData.members || []
        const newMember = {
          uid: userId,
          email: invitation.inviteeEmail,
          role: 'member',
          joinedAt: new Date().toISOString()
        }

        const updatedMembers = [...currentMembers, newMember]

        const currentMemberIds =
          tripData.memberIds ||
          currentMembers
            .map((m) => (typeof m === 'string' ? m : m?.uid))
            .filter(Boolean)

        const updatedMemberIds = Array.from(new Set([...currentMemberIds, userId]))

        await updateDoc(tripRef, {
          members: updatedMembers,
          memberIds: updatedMemberIds
        })
        
        console.log('✅ Successfully added member to trip:', invitation.tripId)
      } else {
        throw new Error('Trip not found')
      }

      // Update invitation status
      await updateDoc(invitationRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      })

      return invitation.tripId
    } catch (error) {
      console.error('Error accepting invitation:', error)
      throw error
    }
  },

  // Decline invitation
  async declineInvitation(invitationId) {
    try {
      const invitationRef = doc(db, 'invitations', invitationId)
      await updateDoc(invitationRef, {
        status: 'declined',
        declinedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error declining invitation:', error)
      throw error
    }
  },

  // Delete invitation
  async deleteInvitation(invitationId) {
    try {
      const invitationRef = doc(db, 'invitations', invitationId)
      await deleteDoc(invitationRef)
    } catch (error) {
      console.error('Error deleting invitation:', error)
      throw error
    }
  }
}
