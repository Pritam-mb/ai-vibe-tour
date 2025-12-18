import { useState, useEffect } from 'react'
import { Sparkles, Clock, MapPin, DollarSign, Navigation, Plane, AlertCircle, ExternalLink, Ticket } from 'lucide-react'
import { locationService } from '../../services/locationService'
import { journeyTrackingService } from '../../services/journeyTrackingService'

function LiveAssistant({ trip }) {
  const [suggestions, setSuggestions] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [nearbyActivities, setNearbyActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [contextualAdvice, setContextualAdvice] = useState([])
  const [currentActivity, setCurrentActivity] = useState(null)
  const [ticketRecommendations, setTicketRecommendations] = useState([])

  useEffect(() => {
    // Only request location once to check if available, don't auto-track
    // Tracking will be controlled by the "Start Journey" button on the map
    
    // Update time and suggestions every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date())
      if (currentLocation) {
        fetchSmartSuggestions()
      } else {
        generateBasicSuggestions()
      }
    }, 60000)

    // Generate initial suggestions
    generateBasicSuggestions()

    return () => {
      clearInterval(interval)
    }
  }, [trip])

  useEffect(() => {
    if (currentLocation && trip?.itinerary) {
      const nearby = locationService.findNearbyActivities(currentLocation, trip.itinerary, 2)
      setNearbyActivities(nearby)
      
      // Get current activity
      const current = locationService.getCurrentActivity(trip.itinerary, currentLocation)
      setCurrentActivity(current)
      
      // Get contextual advice
      const advice = journeyTrackingService.getContextualAdvice(
        currentLocation,
        nearby,
        current,
        null // Weather can be added later
      )
      setContextualAdvice(advice)
      
      // Get ticket recommendations for upcoming activities
      if (nearby.length > 0 && trip.destination) {
        const tickets = journeyTrackingService.getTicketBookingLinks(
          nearby[0],
          trip.destination
        )
        setTicketRecommendations(tickets)
      }
      
      fetchSmartSuggestions()
    }
  }, [currentLocation, trip?.itinerary, trip?.destination])

  const enableLocationTracking = async () => {
    try {
      const location = await locationService.getCurrentLocation()
      setCurrentLocation(location)
      setLocationEnabled(true)

      // Start watching location
      window.locationWatchId = locationService.watchLocation(
        (newLocation) => {
          setCurrentLocation(newLocation)
        },
        (error) => {
          console.error('Location tracking error:', error)
          setLocationEnabled(false)
        }
      )
    } catch (error) {
      console.error('Failed to enable location:', error)
      setLocationEnabled(false)
      generateBasicSuggestions()
    }
  }

  const fetchSmartSuggestions = async () => {
    if (!trip) return
    
    setLoading(true)
    try {
      const spent = trip.itinerary?.reduce((total, day) => {
        return total + (day.activities?.reduce((dayTotal, activity) => {
          return dayTotal + (activity.cost || 0)
        }, 0) || 0)
      }, 0) || 0

      const response = await fetch('http://localhost:5003/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentLocation,
          currentTime: currentTime.toISOString(),
          itinerary: trip.itinerary,
          budget: trip.budget,
          spent,
          destination: trip.destination
        })
      })

      const data = await response.json()
      if (data.suggestions) {
        setSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      generateBasicSuggestions()
    } finally {
      setLoading(false)
    }
  }

  const generateBasicSuggestions = () => {

    const hour = currentTime.getHours()
    const newSuggestions = []

    // Time-based suggestions
    if (hour >= 7 && hour < 9) {
      newSuggestions.push({
        type: 'time',
        icon: 'clock',
        title: 'Breakfast Time',
        message: 'Good morning! Time for breakfast. Check out local cafes nearby.',
        priority: 'high'
      })
    } else if (hour >= 12 && hour < 14) {
      newSuggestions.push({
        type: 'time',
        icon: 'clock',
        title: 'Lunch Break',
        message: "It's lunch time! Looking for restaurant recommendations?",
        priority: 'high'
      })
    } else if (hour >= 19) {
      newSuggestions.push({
        type: 'time',
        icon: 'clock',
        title: 'Evening Activities',
        message: 'Check out night markets or sunset spots!',
        priority: 'medium'
      })
    }

    // Budget-based suggestions
    if (trip) {
      const spent = trip.itinerary?.reduce((total, day) => {
        return total + (day.activities?.reduce((dayTotal, activity) => {
          return dayTotal + (activity.cost || 0)
        }, 0) || 0)
      }, 0) || 0
      const percentageUsed = (spent / trip.budget) * 100

      if (percentageUsed > 80) {
        newSuggestions.push({
          type: 'budget',
          icon: 'dollar',
          title: 'Budget Alert',
          message: 'You\'ve used 80% of your budget. Consider free attractions today.',
          priority: 'high'
        })
      }
    }

    setSuggestions(newSuggestions)
  }

  const getIconComponent = (iconName) => {
    const icons = {
      clock: Clock,
      'map-pin': MapPin,
      dollar: DollarSign,
      alert: AlertCircle,
      star: Sparkles,
      navigation: Navigation,
      plane: Plane
    }
    return icons[iconName] || Sparkles
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary-subtle)' }}>
            <Sparkles className="h-5 w-5" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Live Assistant</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI-powered real-time suggestions</p>
          </div>
        </div>
        {locationEnabled && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
            <Navigation className="h-3 w-3" />
            Tracking
          </div>
        )}
      </div>

      {/* Location Status */}
      {currentLocation && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" style={{ color: 'var(--primary)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>
              Location tracked • {nearbyActivities.length} nearby activities
            </span>
          </div>
        </div>
      )}

      {/* Current Activity */}
      {currentActivity && (
        <div className="mb-4 p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1))', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>You're at this location!</span>
          </div>
          <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{currentActivity.title}</h4>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Day {currentActivity.day} • {currentActivity.time} • {currentActivity.distance}km away</p>
        </div>
      )}

      {/* Contextual Advice */}
      {contextualAdvice.length > 0 && (
        <div className="mb-4 space-y-2">
          {contextualAdvice.slice(0, 3).map((advice, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg"
              style={{
                background: advice.priority === 'high' ? 'rgba(251, 191, 36, 0.1)' : 'var(--bg-subtle)',
                border: `1px solid ${advice.priority === 'high' ? 'rgba(251, 191, 36, 0.3)' : 'var(--border-color)'}`,
              }}
            >
              <div className="flex items-start gap-2">
                <span className="text-base">{advice.icon}</span>
                <div className="flex-1">
                  <h5 className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{advice.title}</h5>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{advice.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Booking Recommendations */}
      {ticketRecommendations.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Ticket className="h-4 w-4" style={{ color: 'var(--primary)' }} />
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Book Tickets</h4>
          </div>
          <div className="space-y-2">
            {ticketRecommendations.slice(0, 3).map((ticket, idx) => (
              <a
                key={idx}
                href={ticket.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg transition-all hover:scale-[1.02]"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ticket.icon}</span>
                    <div>
                      <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{ticket.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{ticket.type}</div>
                    </div>
                  </div>
                  <ExternalLink className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Flight Booking Link */}
      {trip && (
        <a
          href={`https://www.google.com/flights?q=flights+to+${encodeURIComponent(trip.destination)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-4 p-3 rounded-lg transition-all"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              <div>
                <div className="font-medium text-sm">Book Flights</div>
                <div className="text-xs opacity-80">to {trip.destination}</div>
              </div>
            </div>
            <div className="text-xs opacity-80">→</div>
          </div>
        </a>
      )}

      {/* Suggestions */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-b-transparent" style={{ borderColor: 'var(--primary)' }} />
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Analyzing your location...</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-6">
          <Sparkles className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No suggestions at the moment. Enjoying your trip!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion, idx) => {
            const IconComponent = getIconComponent(suggestion.icon)
            return (
              <div
                key={idx}
                className="p-4 rounded-lg transition-all hover:scale-[1.02]"
                style={{
                  background: suggestion.priority === 'high' 
                    ? 'rgba(251, 191, 36, 0.1)' 
                    : 'var(--bg-subtle)',
                  border: `1px solid ${suggestion.priority === 'high' ? 'rgba(251, 191, 36, 0.3)' : 'var(--border-color)'}`
                }}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ 
                      background: suggestion.priority === 'high' ? 'rgba(251, 191, 36, 0.2)' : 'var(--primary-subtle)'
                    }}
                  >
                    <IconComponent 
                      className="h-4 w-4" 
                      style={{ 
                        color: suggestion.priority === 'high' ? '#f59e0b' : 'var(--primary)' 
                      }} 
                    />
                  </div>
                  <div className="flex-1">
                    {suggestion.title && (
                      <h4 className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                        {suggestion.title}
                      </h4>
                    )}
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {suggestion.message}
                    </p>
                    {suggestion.action && (
                      <p className="text-xs mt-2 font-medium" style={{ color: 'var(--primary)' }}>
                        → {suggestion.action}
                      </p>
                    )}
                    {(suggestion.estimatedTime || suggestion.distance || suggestion.cost) && (
                      <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {suggestion.estimatedTime && <span>⏱ {suggestion.estimatedTime}</span>}
                        {suggestion.distance && <span>📍 {suggestion.distance} km</span>}
                        {suggestion.cost && <span>💵 ${suggestion.cost}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          {locationEnabled 
            ? '🎯 AI is monitoring your location, time, and budget for smart suggestions'
            : '📍 Enable location for personalized suggestions'}
        </p>
      </div>
    </div>
  )
}

export default LiveAssistant
