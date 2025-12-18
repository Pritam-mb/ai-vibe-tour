// Journey tracking service for live path recording and ticket booking recommendations
import { db } from '../config/firebase'
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore'

export const journeyTrackingService = {
  // Start tracking journey path
  startJourneyTracking(tripId, userId) {
    const trackingData = {
      tripId,
      userId,
      startTime: new Date().toISOString(),
      path: [],
      isActive: true
    }
    
    // Store in localStorage for this session
    localStorage.setItem(`journey_${tripId}`, JSON.stringify(trackingData))
    return trackingData
  },

  // Add location point to journey path
  async addPathPoint(tripId, location) {
    try {
      const journeyKey = `journey_${tripId}`
      const journeyData = JSON.parse(localStorage.getItem(journeyKey) || '{}')
      
      if (!journeyData.isActive) return

      const pathPoint = {
        lat: location.lat,
        lng: location.lng,
        timestamp: new Date().toISOString(),
        accuracy: location.accuracy
      }

      journeyData.path.push(pathPoint)
      localStorage.setItem(journeyKey, JSON.stringify(journeyData))

      // Update Firebase every 10 points to avoid too many writes
      if (journeyData.path.length % 10 === 0) {
        await this.savePathToFirebase(tripId, journeyData.path)
      }

      return pathPoint
    } catch (error) {
      console.error('Error adding path point:', error)
    }
  },

  // Save journey path to Firebase
  async savePathToFirebase(tripId, path) {
    try {
      const tripRef = doc(db, 'trips', tripId)
      const tripDoc = await getDoc(tripRef)
      const tripData = tripDoc.data()

      await updateDoc(tripRef, {
        journeyPaths: arrayUnion({
          timestamp: new Date().toISOString(),
          path: path.slice(-100) // Keep last 100 points
        })
      })
    } catch (error) {
      console.error('Error saving path to Firebase:', error)
    }
  },

  // Stop tracking journey
  async stopJourneyTracking(tripId) {
    try {
      const journeyKey = `journey_${tripId}`
      const journeyData = JSON.parse(localStorage.getItem(journeyKey) || '{}')
      
      if (journeyData.path && journeyData.path.length > 0) {
        await this.savePathToFirebase(tripId, journeyData.path)
      }

      journeyData.isActive = false
      journeyData.endTime = new Date().toISOString()
      localStorage.setItem(journeyKey, JSON.stringify(journeyData))

      return journeyData
    } catch (error) {
      console.error('Error stopping journey tracking:', error)
    }
  },

  // Get current journey data
  getJourneyData(tripId) {
    const journeyKey = `journey_${tripId}`
    return JSON.parse(localStorage.getItem(journeyKey) || '{}')
  },

  // Calculate total distance traveled
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

    return totalDistance.toFixed(2)
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

  // Get ticket booking recommendations based on activity type
  getTicketBookingLinks(activity, destination) {
    const recommendations = []

    // Flight bookings
    if (activity.type?.toLowerCase().includes('flight') || 
        activity.title?.toLowerCase().includes('airport') ||
        activity.title?.toLowerCase().includes('flight')) {
      recommendations.push({
        type: 'Flight',
        name: 'Google Flights',
        url: `https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(destination)}`,
        icon: '✈️'
      })
      recommendations.push({
        type: 'Flight',
        name: 'Skyscanner',
        url: `https://www.skyscanner.com/transport/flights/anywhere/${encodeURIComponent(destination)}`,
        icon: '✈️'
      })
    }

    // Train bookings
    if (activity.type?.toLowerCase().includes('train') || 
        activity.title?.toLowerCase().includes('train') ||
        activity.title?.toLowerCase().includes('railway')) {
      recommendations.push({
        type: 'Train',
        name: 'Rail Europe',
        url: `https://www.raileurope.com/`,
        icon: '🚄'
      })
      recommendations.push({
        type: 'Train',
        name: 'Trainline',
        url: `https://www.thetrainline.com/`,
        icon: '🚄'
      })
    }

    // Museum/attraction tickets
    if (activity.type?.toLowerCase().includes('museum') || 
        activity.type?.toLowerCase().includes('attraction') ||
        activity.title?.toLowerCase().includes('museum') ||
        activity.title?.toLowerCase().includes('gallery')) {
      recommendations.push({
        type: 'Attraction',
        name: 'GetYourGuide',
        url: `https://www.getyourguide.com/s/?q=${encodeURIComponent(activity.title + ' ' + destination)}`,
        icon: '🎫'
      })
      recommendations.push({
        type: 'Attraction',
        name: 'Viator',
        url: `https://www.viator.com/searchResults/all?text=${encodeURIComponent(activity.title)}`,
        icon: '🎫'
      })
    }

    // Events/concerts
    if (activity.type?.toLowerCase().includes('event') || 
        activity.type?.toLowerCase().includes('concert') ||
        activity.title?.toLowerCase().includes('concert') ||
        activity.title?.toLowerCase().includes('show')) {
      recommendations.push({
        type: 'Event',
        name: 'Eventbrite',
        url: `https://www.eventbrite.com/d/${encodeURIComponent(destination)}/events/`,
        icon: '🎭'
      })
      recommendations.push({
        type: 'Event',
        name: 'StubHub',
        url: `https://www.stubhub.com/`,
        icon: '🎭'
      })
    }

    // Hotel bookings
    if (activity.type?.toLowerCase().includes('accommodation') || 
        activity.title?.toLowerCase().includes('hotel') ||
        activity.title?.toLowerCase().includes('check-in')) {
      recommendations.push({
        type: 'Hotel',
        name: 'Booking.com',
        url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`,
        icon: '🏨'
      })
      recommendations.push({
        type: 'Hotel',
        name: 'Hotels.com',
        url: `https://www.hotels.com/search.do?q-destination=${encodeURIComponent(destination)}`,
        icon: '🏨'
      })
    }

    // Restaurant reservations
    if (activity.type?.toLowerCase().includes('dining') || 
        activity.type?.toLowerCase().includes('restaurant') ||
        activity.title?.toLowerCase().includes('dinner') ||
        activity.title?.toLowerCase().includes('lunch')) {
      recommendations.push({
        type: 'Dining',
        name: 'OpenTable',
        url: `https://www.opentable.com/s?covers=2&dateTime=${encodeURIComponent(destination)}`,
        icon: '🍽️'
      })
    }

    // Generic activity booking
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'General',
        name: 'GetYourGuide',
        url: `https://www.getyourguide.com/s/?q=${encodeURIComponent(activity.title + ' ' + destination)}`,
        icon: '🎫'
      })
    }

    return recommendations
  },

  // Get contextual advice based on location and activity
  getContextualAdvice(currentLocation, nearbyActivities, currentActivity, weather) {
    const advice = []

    // Check if user is near next activity
    if (nearbyActivities.length > 0) {
      const nearest = nearbyActivities[0]
      advice.push({
        type: 'navigation',
        title: 'Nearby Activity',
        message: `${nearest.title} is ${nearest.distance}km away`,
        icon: '📍',
        priority: 'high'
      })
    }

    // Check if user is at an activity location
    if (currentActivity) {
      advice.push({
        type: 'activity',
        title: 'Current Activity',
        message: `You're at ${currentActivity.title}. Enjoy your time!`,
        icon: '✨',
        priority: 'high'
      })
    }

    // Time-based advice
    const hour = new Date().getHours()
    if (hour >= 12 && hour <= 14) {
      advice.push({
        type: 'dining',
        title: 'Lunch Time',
        message: 'It\'s lunch time! Consider finding a nearby restaurant.',
        icon: '🍽️',
        priority: 'medium'
      })
    } else if (hour >= 18 && hour <= 20) {
      advice.push({
        type: 'dining',
        title: 'Dinner Time',
        message: 'Perfect time for dinner! Check out local restaurants.',
        icon: '🌙',
        priority: 'medium'
      })
    }

    // Weather-based advice
    if (weather) {
      if (weather.includes('rain')) {
        advice.push({
          type: 'weather',
          title: 'Weather Alert',
          message: 'Rain expected. Consider indoor activities or bring an umbrella.',
          icon: '☔',
          priority: 'high'
        })
      } else if (weather.includes('hot')) {
        advice.push({
          type: 'weather',
          title: 'Hot Weather',
          message: 'Stay hydrated and apply sunscreen regularly.',
          icon: '☀️',
          priority: 'medium'
        })
      }
    }

    return advice.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }
}
