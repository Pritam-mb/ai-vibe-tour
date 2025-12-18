import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, DollarSign, MapPin } from 'lucide-react'
import { tripService } from '../services/tripService'
import { useAuthStore } from '../store/authStore'

function CreateTrip() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    travelStyle: 'balanced',
    specialDestinations: '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user?.uid) {
        alert('You must be logged in to create a trip')
        navigate('/login')
        return
      }

      const tripData = {
        ...formData,
        budget: parseFloat(formData.budget),
        creatorId: user.uid,
        memberIds: [user.uid],
        members: [{
          uid: user.uid,
          email: user.email,
          role: 'creator',
          joinedAt: new Date()
        }],
        status: 'planning',
        createdAt: new Date().toISOString()
      }

      const tripId = await tripService.createTrip(tripData)

      // Navigate immediately - don't wait for itinerary generation
      navigate(`/trip/${tripId}`)

      // Fire and forget - itinerary will be generated in background
      // and Firestore subscription will update the UI when ready
      tripService.generateItinerary(tripId).catch(err => {
        console.warn('Itinerary generation failed:', err)
      })
    } catch (error) {
      console.error('Error creating trip:', error)
      alert('Failed to create trip. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Create New Trip</h1>
        <p style={{ color: 'var(--text-muted)' }}>Plan your next adventure with AI assistance</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Trip Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Summer Europe Adventure"
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            <MapPin className="inline h-4 w-4 mr-1.5" style={{ color: 'var(--primary)' }} />
            Destination
          </label>
          <input
            type="text"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            placeholder="e.g., Paris, France"
            className="input"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              <Calendar className="inline h-4 w-4 mr-1.5" style={{ color: 'var(--primary)' }} />
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              <Calendar className="inline h-4 w-4 mr-1.5" style={{ color: 'var(--primary)' }} />
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            <DollarSign className="inline h-4 w-4 mr-1.5" style={{ color: 'var(--success)' }} />
            Budget (USD)
          </label>
          <input
            type="number"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            placeholder="e.g., 2000"
            className="input"
            required
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Travel Style
          </label>
          <select
            name="travelStyle"
            value={formData.travelStyle}
            onChange={handleChange}
            className="input"
          >
            <option value="budget">Budget – Save money where possible</option>
            <option value="balanced">Balanced – Mix of comfort and value</option>
            <option value="comfort">Comfort – Prioritize convenience</option>
            <option value="adventure">Adventure – Action-packed activities</option>
            <option value="relaxed">Relaxed – Take it easy</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Special Destinations (Optional)
          </label>
          <textarea
            name="specialDestinations"
            value={formData.specialDestinations}
            onChange={handleChange}
            placeholder="Any specific places you want to visit?"
            className="input h-24 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Trip'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateTrip
