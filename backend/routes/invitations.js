import express from 'express'
import Invitation from '../models/Invitation.js'
import Trip from '../models/Trip.js'

const router = express.Router()

// Send invitation
router.post('/', async (req, res) => {
  try {
    const { tripId, tripName, inviterEmail, inviteeEmail } = req.body
    if (!tripId || !inviterEmail || !inviteeEmail || !tripName) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const existing = await Invitation.findOne({ tripId, inviteeEmail, status: 'pending' })
    if (existing) {
      return res.status(400).json({ error: 'Invitation already sent to this user' })
    }

    const invitation = new Invitation({
      tripId,
      tripName,
      inviterEmail,
      inviteeEmail,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })
    await invitation.save()

    res.status(201).json({ id: invitation._id })
  } catch (error) {
    console.error('Error sending invitation:', error)
    res.status(500).json({ error: 'Failed to send invitation' })
  }
})

// Get pending invitations for a user
router.get('/user/:email', async (req, res) => {
  try {
    const invitations = await Invitation.find({ inviteeEmail: req.params.email, status: 'pending' })
    res.json(invitations)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invitations' })
  }
})

// Accept invitation
router.post('/:id/accept', async (req, res) => {
  try {
    const { userId } = req.body
    const invitation = await Invitation.findById(req.params.id)
    if (!invitation) return res.status(404).json({ error: 'Invitation not found' })

    const trip = await Trip.findById(invitation.tripId)
    if (!trip) return res.status(404).json({ error: 'Trip not found' })

    const newMember = { uid: userId, email: invitation.inviteeEmail, role: 'member', joinedAt: new Date().toISOString() }
    trip.members = trip.members || []
    trip.members.push(newMember)
    
    trip.memberIds = trip.memberIds || []
    if (!trip.memberIds.includes(userId)) {
      trip.memberIds.push(userId)
    }

    trip.markModified('members')
    trip.markModified('memberIds')
    await trip.save()

    invitation.status = 'accepted'
    invitation.acceptedAt = new Date()
    await invitation.save()

    res.json({ success: true, tripId: trip._id })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    res.status(500).json({ error: 'Failed to accept invitation' })
  }
})

// Decline invitation
router.post('/:id/decline', async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id)
    if (!invitation) return res.status(404).json({ error: 'Invitation not found' })

    invitation.status = 'declined'
    invitation.declinedAt = new Date()
    await invitation.save()

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to decline' })
  }
})

// Delete invitation
router.delete('/:id', async (req, res) => {
  try {
    await Invitation.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' })
  }
})

export default router
