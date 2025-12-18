// Backend service for managing journey tracking data
import { db } from '../server.js'

const journeyService = {
  // Save journey path to database
  async saveJourneyPath(tripId, userId, path) {
    try {
      const tripRef = db.collection('trips').doc(tripId)
      const tripDoc = await tripRef.get()
      
      if (!tripDoc.exists) {
        throw new Error('Trip not available')
        }

      const journeyData = {
        userId,
        timestamp: new Date().toISOString(),
        path: path.slice(-200), // Keep last 200 points
        totalDistance: this.calculateTotalDistance(path)
      }

      await tripRef.update({
        journeyPaths: db.FieldValue.arrayUnion(journeyData)
      })

      return { success: true, journeyData }
    } catch (error) {
      console.error('Error saving journey path:', error)
      throw error
    }
  },

  // Get journey paths for a trip
  async getJourneyPaths(tripId) {
    try {
      const tripRef = db.collection('trips').doc(tripId)
      const tripDoc = await tripRef.get()
      
      if (!tripDoc.exists) {
        throw new Error('Trip not found')
      }

      const tripData = tripDoc.data()
      return tripData.journeyPaths || []
    } catch (error) {
      console.error('Error getting journey paths:', error)
      throw error
    }
  },

  // Calculate total distance from path
  calculateTotalDistance(path) {
    if (!path || path.length < 2) return 0

    let totalDistance = 0
    for (let i = 1; i < path.length; i++) {
      const distance = this.calculateDistance(
        path[i - 1].lat,
        path[i - 1].lng,
        path[i].lat,
        path[i].lng
      )
      totalDistance += distance
    }

    return parseFloat(totalDistance.toFixed(2))
  },

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  },

  toRad(degrees) {
    return degrees * (Math.PI / 180)
  },

  // Get contextual recommendations for current location
  async getContextualRecommendations(location, tripData) {
    const recommendations = {
      nearby: [],
      tickets: [],
      advice: []
    }

    // Find nearby activities
    if (tripData.itinerary) {
      tripData.itinerary.forEach(day => {
        day.activities?.forEach(activity => {
          if (activity.coordinates) {
            const [lng, lat] = activity.coordinates
            const distance = this.calculateDistance(
              location.lat,
              location.lng,
              lat,
              lng
            )

            if (distance <= 5) { // Within 5km
              recommendations.nearby.push({
                ...activity,
                distance: distance.toFixed(2),
                day: day.day
              })
            }
          }
        })
      })
    }

    // Sort by distance
    recommendations.nearby.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))

    // Add ticket booking suggestions for nearest activity
    if (recommendations.nearby.length > 0) {
      const nearestActivity = recommendations.nearby[0]
      recommendations.tickets = this.getTicketSuggestions(nearestActivity, tripData.destination)
    }

    // Add time-based advice
    const hour = new Date().getHours()
    if (hour >= 12 && hour <= 14) {
      recommendations.advice.push({
        type: 'dining',
        message: "It's lunch time! Check out nearby restaurants.",
        priority: 'high'
      })
    } else if (hour >= 18 && hour <= 20) {
      recommendations.advice.push({
        type: 'dining',
        message: "Perfect time for dinner! Explore local cuisine.",
        priority: 'high'
      })
    }

    return recommendations
  },

  getTicketSuggestions(activity, destination) {
    const suggestions = []

    // Flight bookings
    if (activity.type?.toLowerCase().includes('flight') || 
        activity.title?.toLowerCase().includes('airport')) {
      suggestions.push({
        type: 'Flight',
        name: 'Google Flights',
        url: `https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(destination)}`
      })
    }

    // Museum/attraction tickets
    if (activity.type?.toLowerCase().includes('museum') || 
        activity.type?.toLowerCase().includes('attraction')) {
      suggestions.push({
        type: 'Attraction',
        name: 'GetYourGuide',
        url: `https://www.getyourguide.com/s/?q=${encodeURIComponent(activity.title + ' ' + destination)}`
      })
    }

    // Restaurant reservations
    if (activity.type?.toLowerCase().includes('dining') || 
        activity.type?.toLowerCase().includes('restaurant')) {
      suggestions.push({
        type: 'Dining',
        name: 'OpenTable',
        url: `https://www.opentable.com/s?covers=2&dateTime=${destination}`
      })
    }

    return suggestions
  }
}

export { journeyService }
