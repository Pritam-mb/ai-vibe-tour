import express from 'express'
import Guide from '../models/Guide.js'

const router = express.Router()

// Register as a tour guide
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, specialty, languages, pricePerDay, experience, bio, destination, certifications, availability } = req.body

    if (!name || !email || !specialty || !destination || !pricePerDay) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const existingGuide = await Guide.findOne({ email })
    if (existingGuide) {
      return res.status(400).json({ error: 'Guide already registered with this email' })
    }

    const guide = new Guide({
      name, email, phone, specialty, languages: languages || ['English'], pricePerDay: Number(pricePerDay),
      experience: experience || 0, bio: bio || '', destination, certifications: certifications || [],
      availability: availability !== undefined ? availability : true
    })
    await guide.save()

    res.status(201).json({ success: true, guideId: guide._id, message: 'Guide registered successfully. Verification pending.' })
  } catch (error) {
    console.error('Error registering guide:', error)
    res.status(500).json({ error: 'Failed to register guide' })
  }
})

// Get all guides
router.get('/', async (req, res) => {
  try {
    const { destination, specialty, minRating, maxPrice, all } = req.query
    // Show all available guides by default (verified OR pending)
    const filter = { availability: true }
    
    // Only admins (all=true) can see unverified; marketplace shows everyone with availability
    if (destination) filter.destination = { $regex: new RegExp(destination, 'i') }
    if (specialty) filter.specialty = { $regex: new RegExp(specialty, 'i') }
    if (minRating) filter.rating = { $gte: Number(minRating) }
    if (maxPrice) filter.pricePerDay = { $lte: Number(maxPrice) }

    const guides = await Guide.find(filter).sort({ verified: -1, rating: -1 })
    // Normalize _id -> id for frontend
    res.json(guides.map(g => ({ id: g._id, ...g.toObject() })))
  } catch (error) {
    console.error('Error fetching guides:', error)
    res.status(500).json({ error: 'Failed to fetch guides' })
  }
})

// Get guide by ID
router.get('/:id', async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id)
    if (!guide) return res.status(404).json({ error: 'Guide not found' })
    res.json(guide)
  } catch (error) {
    console.error('Error fetching guide:', error)
    res.status(500).json({ error: 'Failed to fetch guide' })
  }
})

// Update guide profile
router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body }
    delete updates.rating
    delete updates.totalReviews
    delete updates.createdAt
    delete updates.verified

    const guide = await Guide.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!guide) return res.status(404).json({ error: 'Guide not found' })

    res.json({ success: true, message: 'Guide profile updated' })
  } catch (error) {
    console.error('Error updating guide:', error)
    res.status(500).json({ error: 'Failed to update guide' })
  }
})

// Add review for guide
router.post('/:id/review', async (req, res) => {
  try {
    const { rating, comment, userId, userName } = req.body
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' })

    const guide = await Guide.findById(req.params.id)
    if (!guide) return res.status(404).json({ error: 'Guide not found' })

    const newTotal = guide.totalReviews + 1
    const newRating = ((guide.rating * guide.totalReviews) + rating) / newTotal

    guide.reviews.push({ rating, comment, userId, userName })
    guide.rating = Number(newRating.toFixed(2))
    guide.totalReviews = newTotal
    await guide.save()

    res.json({ success: true, message: 'Review added successfully' })
  } catch (error) {
    console.error('Error adding review:', error)
    res.status(500).json({ error: 'Failed to add review' })
  }
})

// Verify/Approve guide (Admin only)
router.post('/:id/verify', async (req, res) => {
  try {
    const verified = req.body.verified !== undefined ? req.body.verified : true
    const guide = await Guide.findByIdAndUpdate(req.params.id, { verified })
    if (!guide) return res.status(404).json({ error: 'Guide not found' })

    res.json({ success: true, message: 'Guide verification updated' })
  } catch (error) {
    console.error('Error verifying guide:', error)
    res.status(500).json({ error: 'Failed to verify guide' })
  }
})

// Delete guide (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    await Guide.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Guide deleted successfully' })
  } catch (error) {
    console.error('Error deleting guide:', error)
    res.status(500).json({ error: 'Failed to delete guide' })
  }
})

export default router
