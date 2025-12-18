import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { journeyTrackingService } from '../../services/journeyTrackingService'
import { locationService } from '../../services/locationService'

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const createCustomIcon = (emoji = '📍') => {
  return L.divIcon({
    html: `<div style="font-size: 28px; text-align: center; line-height: 1;">${emoji}</div>`,
    className: 'custom-marker',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
  })
}

function MapBounds({ markers }) {
  const map = useMap()
  useEffect(() => {
    if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
    }
  }, [markers, map])
  return null
}

function MapView({ trip, onLocationUpdate, onJourneyStateChange }) {
  const [markers, setMarkers] = useState([])
  const [center, setCenter] = useState([42.35, -70.9])
  const [currentLocation, setCurrentLocation] = useState(null)
  const [journeyPath, setJourneyPath] = useState([])
  const [isTracking, setIsTracking] = useState(false)
  const [plannedRoute, setPlannedRoute] = useState([])

  useEffect(() => {
    if (!trip?.itinerary) return

    const activityMarkers = []

    trip.itinerary.forEach((day) => {
      day.activities?.forEach((activity) => {
        if (Array.isArray(activity.coordinates) && activity.coordinates.length === 2) {
          const [lng, lat] = activity.coordinates
          activityMarkers.push({
            lat,
            lng,
            title: activity.title,
            time: activity.time,
            day: day.day,
          })
        }
      })
    })

    if (activityMarkers.length > 0) {
      setCenter([activityMarkers[0].lat, activityMarkers[0].lng])
      setMarkers(activityMarkers)
      setPlannedRoute(activityMarkers.map(m => [m.lat, m.lng]))
    }
  }, [trip?.itinerary])

  // Journey tracking effect - only track when isTracking is true
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

            if (onLocationUpdate) {
              onLocationUpdate(newLoc)
            }

            await journeyTrackingService.addPathPoint(trip.id, newLoc)

            const journeyData = journeyTrackingService.getJourneyData(trip.id)
            if (journeyData.path) {
              setJourneyPath(journeyData.path.map(p => [p.lat, p.lng]))
            }
          },
          (error) => {
            console.error('Location tracking error:', error)
            setIsTracking(false)
            if (onJourneyStateChange) {
              onJourneyStateChange(false)
            }
          }
        )
      } catch (error) {
        console.error('Failed to start tracking:', error)
        setIsTracking(false)
      }
    }

    startTracking()

    return () => {
      if (watchId !== null) {
        locationService.stopWatching(watchId)
      }
    }
  }, [trip?.id, isTracking])

  const handleStartJourney = () => {
    setIsTracking(true)
    if (onJourneyStateChange) {
      onJourneyStateChange(true)
    }
  }

  const handleStopJourney = async () => {
    if (trip?.id) {
      await journeyTrackingService.stopJourneyTracking(trip.id)
    }
    setIsTracking(false)
    if (onJourneyStateChange) {
      onJourneyStateChange(false)
    }
  }

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden relative" style={{ border: '1px solid var(--border-color)' }}>
      <MapContainer
        center={center}
        zoom={12}
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

        {/* Planned Route */}
        {plannedRoute.length > 1 && (
          <Polyline
            positions={plannedRoute}
            color="#8b5cf6"
            weight={3}
            opacity={0.6}
            dashArray="10, 10"
          />
        )}

        {/* Live Journey Path */}
        {journeyPath.length > 1 && (
          <Polyline
            positions={journeyPath}
            color="#22c55e"
            weight={4}
            opacity={0.8}
          />
        )}

        {/* Current Location */}
        {currentLocation && (
          <>
            <Marker position={[currentLocation.lat, currentLocation.lng]} icon={createCustomIcon('📍')}>
              <Popup>
                <div style={{ padding: '8px' }}>
                  <h4 style={{ margin: '0 0 4px', fontWeight: 600 }}>Your Location</h4>
                  <p style={{ margin: 0, fontSize: '12px' }}>
                    {isTracking ? '🟢 Tracking' : '🔴 Stopped'}
                  </p>
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

        {/* Activity Markers */}
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
    </div>
  )
}

export default MapView
