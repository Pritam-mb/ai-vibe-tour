import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowLeft, Navigation, MapPin, Clock, DollarSign, ExternalLink, Ticket } from 'lucide-react'
import { tripService } from '../services/tripService'
import { locationService } from '../services/locationService'
import { journeyTrackingService } from '../services/journeyTrackingService'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const createCustomIcon = (emoji = '📍') => {
  return L.divIcon({
    html: `<div style="font-size: 32px; text-align: center; line-height: 1;">${emoji}</div>`,
    className: 'custom-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  })
}

function MapBounds({ markers }) {
  const map = useMap()
  useEffect(() => {
    if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    }
  }, [markers, map])
  return null
}

function JourneyMode() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [markers, setMarkers] = useState([])
  const [center, setCenter] = useState([42.35, -70.9])
  const [currentLocation, setCurrentLocation] = useState(null)
  const [journeyPath, setJourneyPath] = useState([])
  const [isTracking, setIsTracking] = useState(false)
  const [plannedRoute, setPlannedRoute] = useState([])
  const [nearbyActivities, setNearbyActivities] = useState([])
  const [currentActivity, setCurrentActivity] = useState(null)
  const [contextualAdvice, setContextualAdvice] = useState([])
  const [ticketRecommendations, setTicketRecommendations] = useState([])
  const [totalDistance, setTotalDistance] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [realtimeSuggestions, setRealtimeSuggestions] = useState([
    {
      id: 1,
      type: 'restaurant',
      icon: '🍴',
      title: 'Lunch Break Nearby',
      description: 'Try the local specialty at "The Golden Spoon" - 0.5 km away',
      distance: '0.5 km',
      time: '12:30 PM'
    },
    {
      id: 2,
      type: 'attraction',
      icon: '📸',
      title: 'Photo Opportunity',
      description: 'Beautiful viewpoint ahead - perfect for sunset photos',
      distance: '1.2 km',
      time: '4:00 PM'
    }
  ])

  useEffect(() => {
    const unsubscribe = tripService.subscribeToTrip(tripId, (updatedTrip) => {
      setTrip(updatedTrip)
    })
    return () => unsubscribe()
  }, [tripId])

  useEffect(() => {
    if (!trip?.itinerary) return

    const activityMarkers = []
    trip.itinerary.forEach((day) => {
      day.activities?.forEach((activity) => {
        if (Array.isArray(activity.coordinates) && activity.coordinates.length === 2) {
          const [lng, lat] = activity.coordinates
          activityMarkers.push({ lat, lng, title: activity.title, time: activity.time, day: day.day })
        }
      })
    })

    if (activityMarkers.length > 0) {
      setCenter([activityMarkers[0].lat, activityMarkers[0].lng])
      setMarkers(activityMarkers)
      setPlannedRoute(activityMarkers.map(m => [m.lat, m.lng]))
    }
  }, [trip?.itinerary])

  useEffect(() => {
    if (!trip?.id || !isTracking) return

    let watchId = null

    const startTracking = async () => {
      try {
        const location = await locationService.getCurrentLocation()
        setCurrentLocation(location)
        setCenter([location.lat, location.lng])

        journeyTrackingService.startJourneyTracking(trip.id, 'current-user')

        watchId = locationService.watchLocation(
          async (newLoc) => {
            setCurrentLocation(newLoc)

            await journeyTrackingService.addPathPoint(trip.id, newLoc)

            const journeyData = journeyTrackingService.getJourneyData(trip.id)
            if (journeyData.path) {
              const pathCoords = journeyData.path.map(p => [p.lat, p.lng])
              setJourneyPath(pathCoords)
              const distance = journeyTrackingService.calculateTotalDistance(journeyData.path)
              setTotalDistance(distance)
            }

            // Update nearby activities and advice
            if (trip.itinerary) {
              const nearby = locationService.findNearbyActivities(newLoc, trip.itinerary, 2)
              setNearbyActivities(nearby)

              const current = locationService.getCurrentActivity(trip.itinerary, newLoc)
              setCurrentActivity(current)

              const advice = journeyTrackingService.getContextualAdvice(newLoc, nearby, current, null)
              setContextualAdvice(advice)

              if (nearby.length > 0 && trip.destination) {
                const tickets = journeyTrackingService.getTicketBookingLinks(nearby[0], trip.destination)
                setTicketRecommendations(tickets)
              }
            }
          },
          (error) => {
            console.error('Location tracking error:', error)
          }
        )
      } catch (error) {
        console.error('Failed to start tracking:', error)
      }
    }

    startTracking()

    return () => {
      if (watchId !== null) {
        locationService.stopWatching(watchId)
      }
    }
  }, [trip?.id, trip?.itinerary, trip?.destination, isTracking])

  const handleStartJourney = async () => {
    try {
      // Get current location first
      const location = await locationService.getCurrentLocation()
      setCurrentLocation(location)
      setCenter([location.lat, location.lng])
      
      // Show suggestions dialog
      setShowSuggestions(true)
      
      // Start tracking
      setIsTracking(true)
    } catch (error) {
      console.error('Failed to get location:', error)
      alert('Please enable location access to start journey tracking')
    }
  }

  const handleStopJourney = async () => {
    if (trip?.id) {
      await journeyTrackingService.stopJourneyTracking(trip.id)
    }
    setIsTracking(false)
    setShowSuggestions(false)
  }

  const handleEndJourney = () => {
    handleStopJourney()
    navigate(`/trip/${tripId}`)
  }

  if (!trip) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading journey...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-3 flex items-center justify-between border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={handleEndJourney}
            className="p-2 rounded-lg hover:bg-opacity-80 transition-all"
            style={{ background: 'var(--bg-subtle)' }}
          >
            <ArrowLeft className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
          </button>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{trip.name}</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Journey Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isTracking && totalDistance > 0 && (
            <div className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
              {totalDistance} km traveled
            </div>
          )}
          {!isTracking ? (
            <button
              onClick={handleStartJourney}
              className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-lg transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff' }}
            >
              <Navigation className="h-4 w-4" />
              Start Tracking
            </button>
          ) : (
            <button
              onClick={handleStopJourney}
              className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-lg transition-all hover:scale-105"
              style={{ background: 'rgba(239, 68, 68, 0.95)', color: '#fff' }}
            >
              ⏹️ Stop Tracking
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1">
          <MapContainer
            center={center}
            zoom={14}
            scrollWheelZoom={true}
            className="h-full w-full"
            style={{ background: 'var(--bg-dark)' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />

            {plannedRoute.length > 1 && (
              <Polyline
                positions={plannedRoute}
                color="#8b5cf6"
                weight={3}
                opacity={0.6}
                dashArray="10, 10"
              />
            )}

            {journeyPath.length > 1 && (
              <Polyline
                positions={journeyPath}
                color="#22c55e"
                weight={4}
                opacity={0.8}
              />
            )}

            {currentLocation && (
              <>
                <Marker position={[currentLocation.lat, currentLocation.lng]} icon={createCustomIcon('📍')}>
                  <Popup>
                    <div style={{ padding: '8px' }}>
                      <h4 style={{ margin: '0 0 4px', fontWeight: 600 }}>Your Location</h4>
                      <p style={{ margin: 0, fontSize: '12px' }}>
                        {isTracking ? '🟢 Tracking' : '🔴 Stopped'}
                      </p>
                      {totalDistance > 0 && (
                        <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                          Distance: {totalDistance} km
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={[currentLocation.lat, currentLocation.lng]}
                  radius={currentLocation.accuracy || 50}
                  pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.15, color: '#3b82f6', weight: 1 }}
                />
              </>
            )}

            {markers.map((marker, idx) => (
              <Marker
                key={idx}
                position={[marker.lat, marker.lng]}
                icon={createCustomIcon(idx === 0 ? '🎯' : idx === markers.length - 1 ? '🏁' : '📍')}
              >
                <Popup>
                  <div style={{ padding: '8px' }}>
                    <h4 style={{ margin: '0 0 4px', fontWeight: 600 }}>{marker.title}</h4>
                    <p style={{ margin: 0, fontSize: '12px' }}>Day {marker.day} • {marker.time}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {markers.length > 0 && <MapBounds markers={markers} />}
          </MapContainer>

          {/* Toggle Suggestions Button (when hidden) */}
          {!showSuggestions && isTracking && (
            <button
              onClick={() => setShowSuggestions(true)}
              className="absolute top-4 left-4 z-[1000] w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
              style={{ 
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff'
              }}
              title="View real-time suggestions"
            >
              💡
            </button>
          )}

          {/* Real-time Suggestions Dialog */}
          {showSuggestions && isTracking && (
            <div 
              className="absolute top-4 left-4 right-20 max-w-md z-[1000] rounded-xl shadow-2xl border"
              style={{ 
                background: 'var(--bg-card)', 
                borderColor: 'var(--border-color)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--primary-subtle)' }}>
                      💡
                    </div>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Real-time Suggestions</h3>
                  </div>
                  <button 
                    onClick={() => setShowSuggestions(false)}
                    className="p-1 rounded hover:bg-opacity-80 transition-all text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-2">
                  {realtimeSuggestions.map((suggestion) => (
                    <div 
                      key={suggestion.id}
                      className="p-3 rounded-lg border hover:scale-[1.02] transition-all cursor-pointer"
                      style={{ 
                        background: 'var(--bg-subtle)', 
                        borderColor: 'var(--border-color)' 
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{suggestion.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                              {suggestion.title}
                            </h4>
                            <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                              {suggestion.distance}
                            </span>
                          </div>
                          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                            {suggestion.description}
                          </p>
                          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                            <Clock className="h-3 w-3" />
                            {suggestion.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="w-full mt-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                  style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <aside className="w-80 flex-shrink-0 border-l overflow-y-auto" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="p-4 space-y-4">
            {/* Tracking Status */}
            <div className="p-4 rounded-lg" style={{ background: isTracking ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-subtle)', border: `1px solid ${isTracking ? 'rgba(34, 197, 94, 0.3)' : 'var(--border-color)'}` }}>
              <div className="flex items-center gap-2 mb-2">
                {isTracking ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>Live Tracking Active</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Tracking Inactive</span>
                  </>
                )}
              </div>
              {currentLocation && (
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                </p>
              )}
            </div>

            {/* Today's Itinerary */}
            {trip?.itinerary && trip.itinerary.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Clock className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                  Your Schedule
                </h3>
                <div className="space-y-3">
                  {trip.itinerary.map((day, dayIdx) => (
                    <div key={dayIdx}>
                      <div className="text-xs font-semibold mb-2 px-2 py-1 rounded" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                        Day {day.day}
                      </div>
                      <div className="space-y-2">
                        {day.activities?.map((activity, actIdx) => (
                          <div
                            key={actIdx}
                            className="p-3 rounded-lg transition-all"
                            style={{
                              background: currentActivity?.title === activity.title ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-subtle)',
                              border: `1px solid ${currentActivity?.title === activity.title ? 'rgba(34, 197, 94, 0.3)' : 'var(--border-color)'}`,
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>{activity.time}</span>
                                  {currentActivity?.title === activity.title && (
                                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--success)', color: '#fff' }}>Now</span>
                                  )}
                                </div>
                                <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{activity.title}</h4>
                                {activity.description && (
                                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{activity.description}</p>
                                )}
                                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                  {activity.duration && <span>⏱ {activity.duration}</span>}
                                  {activity.cost && <span>💵 ${activity.cost}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Activity */}
            {currentActivity && (
              <div className="p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1))', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4" style={{ color: 'var(--success)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>At Location</span>
                </div>
                <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{currentActivity.title}</h4>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Day {currentActivity.day} • {currentActivity.time}</p>
              </div>
            )}

            {/* Nearby Activities */}
            {nearbyActivities.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Nearby Activities</h3>
                <div className="space-y-2">
                  {nearbyActivities.slice(0, 3).map((activity, idx) => (
                    <div key={idx} className="p-3 rounded-lg" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
                      <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{activity.title}</h4>
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>{activity.distance} km away</span>
                        <span>•</span>
                        <span>Day {activity.day}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contextual Advice */}
            {contextualAdvice.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Travel Tips</h3>
                <div className="space-y-2">
                  {contextualAdvice.slice(0, 3).map((advice, idx) => (
                    <div key={idx} className="p-3 rounded-lg" style={{ background: advice.priority === 'high' ? 'rgba(251, 191, 36, 0.1)' : 'var(--bg-subtle)', border: `1px solid ${advice.priority === 'high' ? 'rgba(251, 191, 36, 0.3)' : 'var(--border-color)'}` }}>
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
              </div>
            )}

            {/* Ticket Recommendations */}
            {ticketRecommendations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Ticket className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Book Tickets</h3>
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
          </div>
        </aside>
      </div>
    </div>
  )
}

export default JourneyMode
