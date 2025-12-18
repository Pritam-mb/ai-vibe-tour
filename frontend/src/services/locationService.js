// Location tracking and proximity-based suggestions
export const locationService = {
  // Get user's current location
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  },

  // Watch user's location continuously
  watchLocation(callback, errorCallback) {
    if (!navigator.geolocation) {
      errorCallback(new Error('Geolocation is not supported'))
      return null
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        callback({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        })
      },
      errorCallback,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    )

    return watchId
  },

  // Stop watching location
  stopWatching(watchId) {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
    }
  },

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in km
  },

  toRad(degrees) {
    return degrees * (Math.PI / 180)
  },

  // Find nearby activities from itinerary
  findNearbyActivities(currentLocation, itinerary, maxDistance = 2) {
    const nearby = []

    itinerary.forEach(day => {
      day.activities?.forEach(activity => {
        if (activity.coordinates && Array.isArray(activity.coordinates)) {
          const [lng, lat] = activity.coordinates
          const distance = this.calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            lat,
            lng
          )

          if (distance <= maxDistance) {
            nearby.push({
              ...activity,
              distance: distance.toFixed(2),
              day: day.day
            })
          }
        }
      })
    })

    return nearby.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
  },

  // Get current activity based on time and location
  getCurrentActivity(itinerary, currentLocation) {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    for (const day of itinerary) {
      for (const activity of day.activities || []) {
        if (activity.coordinates) {
          const [lng, lat] = activity.coordinates
          const distance = this.calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            lat,
            lng
          )

          // If within 500m and close to activity time
          if (distance < 0.5 && this.isNearActivityTime(activity.time, currentTime)) {
            return { ...activity, distance: distance.toFixed(2), day: day.day }
          }
        }
      }
    }

    return null
  },

  isNearActivityTime(activityTime, currentTime) {
    const [actHour, actMin] = activityTime.split(':').map(Number)
    const [currHour, currMin] = currentTime.split(':').map(Number)
    
    const actMinutes = actHour * 60 + actMin
    const currMinutes = currHour * 60 + currMin
    
    // Within 30 minutes
    return Math.abs(actMinutes - currMinutes) <= 30
  }
}
