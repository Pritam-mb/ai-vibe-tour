const API_URL = 'http://localhost:5003/api'

export const guideService = {
  async getGuides(filters = {}) {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters.region) queryParams.append('destination', filters.region)
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice)
      if (filters.specialty) queryParams.append('specialty', filters.specialty)
      
      const url = `${API_URL}/guides${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch guides')
      }
      
      const guides = await response.json()
      
      // Transform backend data to match frontend format
      return guides.map(guide => ({
        id: guide.id,
        name: guide.name,
        region: guide.destination,
        description: guide.bio || `${guide.specialty} specialist`,
        pricePerDay: guide.pricePerDay,
        rating: guide.rating || 0,
        specialties: [guide.specialty],
        languages: guide.languages || ['English'],
        email: guide.email,
        phone: guide.phone,
        experience: guide.experience,
        verified: guide.verified || false,
        totalReviews: guide.totalReviews || 0
      }))
    } catch (error) {
      console.error('Error fetching guides:', error)
      return []
    }
  }
}
