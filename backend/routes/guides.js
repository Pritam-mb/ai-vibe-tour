import express from 'express'
import { db } from '../server.js'

const router = express.Router()

// Register as a tour guide
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      specialty,
      languages,
      pricePerDay,
      experience,
      bio,
      destination,
      certifications,
      availability
    } = req.body

    // Validate required fields
    if (!name || !email || !specialty || !destination || !pricePerDay) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if guide already exists
    const existingGuide = await db.collection('guides')
      .where('email', '==', email)
      .get()

    if (!existingGuide.empty) {
      return res.status(400).json({ error: 'Guide already registered with this email' })
    }

    // Create new guide
    const guideData = {
      name,
      email,
      phone: phone || '',
      specialty,
      languages: languages || ['English'],
      pricePerDay: Number(pricePerDay),
      experience: experience || 0,
      bio: bio || '',
      destination,
      certifications: certifications || [],
      availability: availability || true,
      rating: 0,
      totalReviews: 0,
      verified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const docRef = await db.collection('guides').add(guideData)

    res.status(201).json({
      success: true,
      guideId: docRef.id,
      message: 'Guide registered successfully. Verification pending.'
    })
  } catch (error) {
    console.error('Error registering guide:', error)
    res.status(500).json({ error: 'Failed to register guide' })
  }
})

// Get all guides
router.get('/', async (req, res) => {
  try {
    const { destination, specialty, minRating, maxPrice, all } = req.query

    let query = db.collection('guides')
    
    // For admin panel, fetch all guides; otherwise only verified ones
    if (!all) {
      query = query.where('verified', '==', true)
    }
    
    query = query.where('availability', '==', true)

    if (destination) {
      query = query.where('destination', '==', destination)
    }

    if (specialty) {
      query = query.where('specialty', '==', specialty)
    }

    const snapshot = await query.get()
    let guides = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Filter by rating and price (Firestore doesn't support multiple inequality filters)
    if (minRating) {
      guides = guides.filter(g => g.rating >= Number(minRating))
    }

    if (maxPrice) {
      guides = guides.filter(g => g.pricePerDay <= Number(maxPrice))
    }

    res.json(guides)
  } catch (error) {
    console.error('Error fetching guides:', error)
    res.status(500).json({ error: 'Failed to fetch guides' })
  }
})

// Get guide by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const doc = await db.collection('guides').doc(id).get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'Guide not found' })
    }

    res.json({ id: doc.id, ...doc.data() })
  } catch (error) {
    console.error('Error fetching guide:', error)
    res.status(500).json({ error: 'Failed to fetch guide' })
  }
})

// Update guide profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    // Remove fields that shouldn't be updated directly
    delete updates.rating
    delete updates.totalReviews
    delete updates.createdAt
    delete updates.verified

    updates.updatedAt = new Date().toISOString()

    await db.collection('guides').doc(id).update(updates)

    res.json({ success: true, message: 'Guide profile updated' })
  } catch (error) {
    console.error('Error updating guide:', error)
    res.status(500).json({ error: 'Failed to update guide' })
  }
})

// Add review for guide
router.post('/:id/review', async (req, res) => {
  try {
    const { id } = req.params
    const { rating, comment, userId, userName } = req.body

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' })
    }

    const guideRef = db.collection('guides').doc(id)
    const guideDoc = await guideRef.get()

    if (!guideDoc.exists) {
      return res.status(404).json({ error: 'Guide not found' })
    }

    const guideData = guideDoc.data()
    const currentRating = guideData.rating || 0
    const currentTotal = guideData.totalReviews || 0

    // Calculate new average rating
    const newTotal = currentTotal + 1
    const newRating = ((currentRating * currentTotal) + rating) / newTotal

    // Add review
    await db.collection('guides').doc(id).collection('reviews').add({
      rating,
      comment: comment || '',
      userId,
      userName,
      createdAt: new Date().toISOString()
    })

    // Update guide rating
    await guideRef.update({
      rating: Number(newRating.toFixed(2)),
      totalReviews: newTotal
    })

    res.json({ success: true, message: 'Review added successfully' })
  } catch (error) {
    console.error('Error adding review:', error)
    res.status(500).json({ error: 'Failed to add review' })
  }
})

// Verify/Approve guide (Admin only)
router.post('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params
    const { verified } = req.body

    await db.collection('guides').doc(id).update({
      verified: verified !== undefined ? verified : true,
      updatedAt: new Date().toISOString()
    })

    res.json({ success: true, message: 'Guide verification updated' })
  } catch (error) {
    console.error('Error verifying guide:', error)
    res.status(500).json({ error: 'Failed to verify guide' })
  }
})

// Delete guide (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await db.collection('guides').doc(id).delete()
    res.json({ success: true, message: 'Guide deleted successfully' })
  } catch (error) {
    console.error('Error deleting guide:', error)
    res.status(500).json({ error: 'Failed to delete guide' })
  }
})

export default router
