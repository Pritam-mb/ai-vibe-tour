import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowLeft, Navigation, MapPin, Clock, DollarSign, Plane, Train, ExternalLink, ChevronRight } from 'lucide-react'
import { tripService } from '../services/tripService'

// Fix default Leaflet icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const createCustomIcon = (emoji = '📍', size = 36) =>
  L.divIcon({
    html: `<div style="font-size:${size}px;text-align:center;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${emoji}</div>`,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })

const createPulsingDot = () =>
  L.divIcon({
    html: `
      <div style="position:relative;width:24px;height:24px;">
        <div style="position:absolute;inset:0;background:#3b82f6;border-radius:50%;opacity:0.3;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:absolute;top:4px;left:4px;width:16px;height:16px;background:#3b82f6;border-radius:50%;border:2px solid white;box-shadow:0 0 8px rgba(59,130,246,0.8);"></div>
      </div>
      <style>@keyframes ping{0%{transform:scale(1);opacity:0.3}75%,100%{transform:scale(2.5);opacity:0}}</style>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })

// Generate a great-circle arc between two points for the flight path
function generateArc(from, to, numPoints = 80) {
  const toRad = d => d * Math.PI / 180
  const toDeg = r => r * 180 / Math.PI
  const lat1 = toRad(from[0]), lon1 = toRad(from[1])
  const lat2 = toRad(to[0]), lon2 = toRad(to[1])
  const points = []
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints
    const A = Math.sin((1 - f) * Math.PI) / Math.sin(Math.PI)
    const B = Math.sin(f * Math.PI) / Math.sin(Math.PI)
    // Add lift (arc height) by raising midpoint
    const lift = Math.sin(f * Math.PI) * 0.15
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2)
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2)
    const z = A * Math.sin(lat1) + B * Math.sin(lat2) + lift
    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)))
    const lon = toDeg(Math.atan2(y, x))
    points.push([lat, lon])
  }
  return points
}

function AutoFitBounds({ markers }) {
  const map = useMap()
  useEffect(() => {
    if (markers && markers.length > 1) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 })
    } else if (markers && markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 13)
    }
  }, [markers, map])
  return null
}

function RecenterMap({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

function JourneyMode() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [activityMarkers, setActivityMarkers] = useState([])
  const [currentLocation, setCurrentLocation] = useState(null)
  const [journeyPath, setJourneyPath] = useState([])
  const [isTracking, setIsTracking] = useState(false)
  const [gpsStatus, setGpsStatus] = useState('idle') // idle | acquiring | active | error
  const [totalDistance, setTotalDistance] = useState(0)
  const [selectedDay, setSelectedDay] = useState(null)
  const [recenterOnMe, setRecenterOnMe] = useState(null)
  const [activeMarker, setActiveMarker] = useState(null)
  const watchIdRef = useRef(null)

  useEffect(() => {
    const unsub = tripService.subscribeToTrip(tripId, updated => {
      setTrip(updated)
    })
    return () => unsub()
  }, [tripId])

  // Extract activity markers from itinerary (activities with geocoded lat/lng)
  useEffect(() => {
    if (!trip?.itinerary) return
    const markers = []
    trip.itinerary.forEach(day => {
      day.activities?.forEach(act => {
        if (act.lat && act.lng) {
          markers.push({ lat: act.lat, lng: act.lng, title: act.title, time: act.time, day: day.day, location: act.location, cost: act.cost, duration: act.duration, type: act.type })
        }
      })
    })
    setActivityMarkers(markers)
    if (!selectedDay && trip.itinerary.length > 0) {
      setSelectedDay(trip.itinerary[0].day)
    }
  }, [trip?.itinerary])

  // Calculate distance between two lat/lng points (Haversine)
  const calcDistance = (a, b) => {
    const R = 6371
    const dLat = (b.lat - a.lat) * Math.PI / 180
    const dLng = (b.lng - a.lng) * Math.PI / 180
    const x = Math.sin(dLat/2)**2 + Math.cos(a.lat * Math.PI/180) * Math.cos(b.lat * Math.PI/180) * Math.sin(dLng/2)**2
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
  }

  const handleStartTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    setIsTracking(true)
    setGpsStatus('acquiring')
    setJourneyPath([])
    setTotalDistance(0)

    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }
        setCurrentLocation(loc)
        setRecenterOnMe([loc.lat, loc.lng])
        setGpsStatus('active')
        setJourneyPath(prev => {
          if (prev.length > 0) {
            const last = { lat: prev[prev.length-1][0], lng: prev[prev.length-1][1] }
            const d = calcDistance(last, loc)
            if (d < 0.01) return prev // skip if < 10m
            setTotalDistance(td => Math.round((td + d) * 100) / 100)
          }
          return [...prev, [loc.lat, loc.lng]]
        })
      },
      err => {
        console.error('GPS error:', err)
        setGpsStatus('error')
        setIsTracking(false)
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    )
  }

  const handleStopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
    setGpsStatus('idle')
  }

  // Flight arc data
  const hasDeparture = trip?.departureLat && trip?.departureLng
  const hasDestination = trip?.lat && trip?.lng
  const flightArc = hasDeparture && hasDestination
    ? generateArc([trip.departureLat, trip.departureLng], [trip.lat, trip.lng])
    : null

  // All bounds markers (departure + destination + activities)
  const allBoundsMarkers = []
  if (hasDeparture) allBoundsMarkers.push({ lat: trip.departureLat, lng: trip.departureLng })
  if (hasDestination) allBoundsMarkers.push({ lat: trip.lat, lng: trip.lng })
  activityMarkers.forEach(m => allBoundsMarkers.push(m))

  // Activity type emoji
  const actEmoji = type => {
    const map = { breakfast: '☕', lunch: '🍽️', dinner: '🍷', transport: '🚌', shopping: '🛍️', sightseeing: '📸', activity: '🎯' }
    return map[type] || '📍'
  }

  if (!trip) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading journey...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-3 flex items-center justify-between" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/trip/${tripId}`)} className="p-2 rounded-lg transition-all hover:bg-opacity-80" style={{ background: 'var(--bg-subtle)' }}>
            <ArrowLeft className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
          </button>
          <div>
            <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{trip.name}</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {trip.departureCity ? `${trip.departureCity} → ` : ''}{trip.destination}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isTracking && totalDistance > 0 && (
            <div className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--success)' }}>
              📍 {totalDistance} km traveled
            </div>
          )}
          {gpsStatus === 'acquiring' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(251,191,36,0.15)', color: 'var(--warning)' }}>
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Acquiring GPS…
            </div>
          )}
          {!isTracking ? (
            <button onClick={handleStartTracking} className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-lg transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff' }}>
              <Navigation className="h-4 w-4" /> Start Tracking
            </button>
          ) : (
            <button onClick={handleStopTracking} className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-lg transition-all hover:scale-105" style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}>
              ⏹️ Stop Tracking
            </button>
          )}
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer center={[20, 0]} zoom={3} className="h-full w-full" zoomControl={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />

            {/* Auto-fit to markers on load */}
            {allBoundsMarkers.length > 0 && <AutoFitBounds markers={allBoundsMarkers} />}

            {/* Recenter on user location when tracking */}
            {recenterOnMe && <RecenterMap center={recenterOnMe} />}

            {/* ✈️ Flight arc */}
            {flightArc && (
              <Polyline positions={flightArc} color="#f59e0b" weight={2} opacity={0.7} dashArray="8, 6" />
            )}

            {/* 🛫 Departure marker */}
            {hasDeparture && (
              <Marker position={[trip.departureLat, trip.departureLng]} icon={createCustomIcon('🛫', 32)}>
                <Popup>
                  <div style={{ padding: '6px' }}>
                    <p style={{ fontWeight: 700, margin: '0 0 2px' }}>Departure</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#666' }}>{trip.departureCity}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* 🏙️ Destination marker */}
            {hasDestination && (
              <Marker position={[trip.lat, trip.lng]} icon={createCustomIcon('🏙️', 36)}>
                <Popup>
                  <div style={{ padding: '6px' }}>
                    <p style={{ fontWeight: 700, margin: '0 0 2px' }}>Destination</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#666' }}>{trip.destination}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* 📍 Activity pins */}
            {activityMarkers.map((m, idx) => (
              <Marker
                key={idx}
                position={[m.lat, m.lng]}
                icon={createCustomIcon(actEmoji(m.type), 28)}
                eventHandlers={{ click: () => setActiveMarker(m) }}
              >
                <Popup>
                  <div style={{ padding: '8px', minWidth: 160 }}>
                    <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: 13 }}>{m.title}</p>
                    <p style={{ margin: '0 0 2px', fontSize: 11, color: '#888' }}>Day {m.day} · {m.time}</p>
                    {m.location && <p style={{ margin: '0 0 2px', fontSize: 11, color: '#888' }}>📍 {m.location}</p>}
                    {m.duration && <p style={{ margin: '0 0 2px', fontSize: 11, color: '#888' }}>⏱ {m.duration}</p>}
                    {m.cost > 0 && <p style={{ margin: 0, fontSize: 11, color: '#22c55e' }}>💵 ${m.cost}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* 🟢 Tracked journey path */}
            {journeyPath.length > 1 && (
              <Polyline positions={journeyPath} color="#22c55e" weight={4} opacity={0.9} />
            )}

            {/* 📌 Live GPS dot */}
            {currentLocation && (
              <>
                <Marker position={[currentLocation.lat, currentLocation.lng]} icon={createPulsingDot()}>
                  <Popup>
                    <div style={{ padding: '6px' }}>
                      <p style={{ fontWeight: 700, margin: '0 0 2px' }}>You are here</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#888' }}>Accuracy: ±{Math.round(currentLocation.accuracy || 0)}m</p>
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={[currentLocation.lat, currentLocation.lng]}
                  radius={currentLocation.accuracy || 30}
                  pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.1, color: '#3b82f6', weight: 1 }}
                />
              </>
            )}
          </MapContainer>

          {/* Map overlay: active marker card */}
          {activeMarker && (
            <div className="absolute bottom-4 left-1/2 z-[1000] rounded-xl px-5 py-4 shadow-2xl border"
              style={{ transform: 'translateX(-50%)', background: 'var(--bg-card)', borderColor: 'var(--border-color)', minWidth: 260, maxWidth: 340 }}>
              <button onClick={() => setActiveMarker(null)} className="absolute top-2 right-3 text-sm" style={{ color: 'var(--text-muted)' }}>✕</button>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--primary)' }}>Day {activeMarker.day} · {activeMarker.time}</p>
              <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{activeMarker.title}</h4>
              {activeMarker.location && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>📍 {activeMarker.location}</p>}
              <div className="flex gap-3 mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {activeMarker.duration && <span>⏱ {activeMarker.duration}</span>}
                {activeMarker.cost > 0 && <span>💵 ${activeMarker.cost}</span>}
              </div>
            </div>
          )}

          {/* GPS error banner */}
          {gpsStatus === 'error' && (
            <div className="absolute top-4 left-1/2 z-[1000] rounded-xl px-4 py-3 shadow-xl text-sm font-medium"
              style={{ transform: 'translateX(-50%)', background: 'rgba(239,68,68,0.95)', color: '#fff' }}>
              ⚠️ GPS unavailable — please allow location access
            </div>
          )}

          {/* Map legend */}
          <div className="absolute bottom-4 right-4 z-[1000] rounded-xl p-3 text-xs space-y-1.5 shadow-xl"
            style={{ background: 'rgba(15,23,42,0.9)', color: '#94a3b8', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {flightArc && <div className="flex items-center gap-2"><span style={{ color: '#f59e0b' }}>- - -</span> Flight route</div>}
            {activityMarkers.length > 0 && <div className="flex items-center gap-2">📍 Activity locations</div>}
            {isTracking && <div className="flex items-center gap-2"><span style={{ color: '#22c55e' }}>━━</span> Your path</div>}
            <div className="flex items-center gap-2"><span style={{ color: '#3b82f6' }}>●</span> You</div>
          </div>
        </div>

        {/* Side Panel */}
        <aside className="w-72 flex-shrink-0 border-l overflow-y-auto" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="p-4 space-y-4">

            {/* Travel Route Card */}
            {(trip.departureCity || trip.destination) && (
              <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(251,191,36,0.06))', border: '1px solid rgba(245,158,11,0.25)' }}>
                <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--warning)' }}>✈️ Your Journey</p>
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-center">
                    <p className="text-lg">🛫</p>
                    <p className="text-xs font-medium mt-0.5 max-w-[60px] truncate" style={{ color: 'var(--text-primary)' }}>{trip.departureCity || '—'}</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full h-px relative" style={{ background: 'var(--border-color)' }}>
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs">✈️</span>
                    </div>
                    <span className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{trip.startDate ? new Date(trip.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}</span>
                  </div>
                  <div className="text-center">
                    <p className="text-lg">🏙️</p>
                    <p className="text-xs font-medium mt-0.5 max-w-[60px] truncate" style={{ color: 'var(--text-primary)' }}>{trip.destination}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <a
                    href={`https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(trip.departureCity || '')}+to+${encodeURIComponent(trip.destination)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02]"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <Plane className="h-3 w-3" /> Book Flight <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                  <a
                    href={`https://www.ixigo.com/search/result/train?sourceCity=${encodeURIComponent(trip.departureCity || '')}&destinationCity=${encodeURIComponent(trip.destination)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02]"
                    style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.2)' }}>
                    <Train className="h-3 w-3" /> Book Train <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </div>
              </div>
            )}

            {/* GPS Status */}
            <div className="p-3 rounded-xl" style={{ background: isTracking ? 'rgba(34,197,94,0.08)' : 'var(--bg-subtle)', border: `1px solid ${isTracking ? 'rgba(34,197,94,0.25)' : 'var(--border-color)'}` }}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${gpsStatus === 'active' ? 'bg-green-500 animate-pulse' : gpsStatus === 'acquiring' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-xs font-semibold" style={{ color: gpsStatus === 'active' ? 'var(--success)' : gpsStatus === 'acquiring' ? 'var(--warning)' : 'var(--text-muted)' }}>
                  {gpsStatus === 'active' ? 'GPS Active' : gpsStatus === 'acquiring' ? 'Acquiring GPS…' : 'Tracking Off'}
                </span>
              </div>
              {currentLocation && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)} · ±{Math.round(currentLocation.accuracy || 0)}m
                </p>
              )}
              {totalDistance > 0 && (
                <p className="text-xs mt-1 font-medium" style={{ color: 'var(--success)' }}>
                  🚶 {totalDistance} km traveled
                </p>
              )}
            </div>

            {/* Day selector */}
            {trip.itinerary && trip.itinerary.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Itinerary</p>
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {trip.itinerary.map(day => (
                    <button key={day.day} onClick={() => setSelectedDay(day.day)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: selectedDay === day.day ? 'var(--primary)' : 'var(--bg-elevated)', color: selectedDay === day.day ? '#fff' : 'var(--text-secondary)' }}>
                      Day {day.day}
                    </button>
                  ))}
                </div>

                {/* Activities for selected day */}
                {trip.itinerary.filter(d => d.day === selectedDay).map(day => (
                  <div key={day.day} className="space-y-2">
                    {day.activities?.map((act, idx) => (
                      <div key={idx} className="p-3 rounded-xl transition-all cursor-pointer hover:scale-[1.01]"
                        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}
                        onClick={() => act.lat && act.lng && setActiveMarker({ ...act, day: day.day })}>
                        <div className="flex items-start gap-2.5">
                          <span className="text-lg flex-shrink-0">{actEmoji(act.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>{act.time}</span>
                              {act.lat && <span className="text-xs" style={{ color: 'var(--success)' }}>📍</span>}
                            </div>
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{act.title}</p>
                            {act.location && <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{act.location}</p>}
                            <div className="flex gap-2 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                              {act.duration && <span>⏱ {act.duration}</span>}
                              {act.cost > 0 && <span>💵 ${act.cost}</span>}
                            </div>
                          </div>
                          {act.lat && <ChevronRight className="h-3 w-3 flex-shrink-0 mt-1" style={{ color: 'var(--text-muted)' }} />}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* No geocoded pins notice */}
            {activityMarkers.length === 0 && trip.itinerary && trip.itinerary.length > 0 && (
              <div className="p-3 rounded-xl text-xs text-center" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                🗺️ Map pins will appear after itinerary is generated with geocoding enabled
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default JourneyMode
