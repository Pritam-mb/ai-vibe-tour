import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowLeft, Plane, Train, Clock, DollarSign, Calendar, MapPin, CheckCircle, AlertCircle, ExternalLink, ChevronRight } from 'lucide-react'
import { tripService } from '../services/tripService'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const mkIcon = (emoji, size = 36) => L.divIcon({
  html: `<div style="font-size:${size}px;text-align:center;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.6))">${emoji}</div>`,
  className: '', iconSize: [size, size], iconAnchor: [size/2, size], popupAnchor: [0, -size]
})

function generateArc(from, to, n = 100) {
  const toR = d => d * Math.PI / 180
  const toD = r => r * 180 / Math.PI
  const [lat1, lon1] = [toR(from[0]), toR(from[1])]
  const [lat2, lon2] = [toR(to[0]), toR(to[1])]
  return Array.from({ length: n + 1 }, (_, i) => {
    const f = i / n
    const A = Math.sin((1-f)*Math.PI)/Math.sin(Math.PI)
    const B = Math.sin(f*Math.PI)/Math.sin(Math.PI)
    const lift = Math.sin(f * Math.PI) * 0.18
    const x = A*Math.cos(lat1)*Math.cos(lon1) + B*Math.cos(lat2)*Math.cos(lon2)
    const y = A*Math.cos(lat1)*Math.sin(lon1) + B*Math.cos(lat2)*Math.sin(lon2)
    const z = A*Math.sin(lat1) + B*Math.sin(lat2) + lift
    return [toD(Math.atan2(z, Math.sqrt(x*x+y*y))), toD(Math.atan2(y, x))]
  })
}

// Estimate flight duration based on distance (Haversine)
function estimateFlightHours(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2-lat1)*Math.PI/180
  const dLng = (lng2-lng1)*Math.PI/180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return { dist: Math.round(dist), hours: Math.round(dist / 850 * 10) / 10 } // avg 850km/h
}

function TravelPlanner() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [checkedItems, setCheckedItems] = useState({})
  const [mapCenter, setMapCenter] = useState([20, 60])

  useEffect(() => {
    const unsub = tripService.subscribeToTrip(tripId, t => {
      setTrip(t)
      if (t.departureLat && t.departureLng && t.lat && t.lng) {
        setMapCenter([(t.departureLat + t.lat) / 2, (t.departureLng + t.lng) / 2])
      }
    })
    return () => unsub()
  }, [tripId])

  const toggleCheck = key => setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))

  if (!trip) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  )

  const hasDep = trip.departureLat && trip.departureLng
  const hasDest = trip.lat && trip.lng
  const flightInfo = hasDep && hasDest ? estimateFlightHours(trip.departureLat, trip.departureLng, trip.lat, trip.lng) : null
  const arc = hasDep && hasDest ? generateArc([trip.departureLat, trip.departureLng], [trip.lat, trip.lng]) : null
  const startDate = trip.startDate ? new Date(trip.startDate) : null
  const suggestDepartDate = startDate ? new Date(startDate.getTime() - 24*60*60*1000) : null // day before
  const isLongFlight = flightInfo && flightInfo.hours > 8

  // Pre-travel checklist
  const checklist = [
    { key: 'passport', icon: '🛂', label: 'Passport valid for 6+ months', category: 'Documents' },
    { key: 'visa', icon: '📋', label: `Check visa requirements for ${trip.destination}`, category: 'Documents' },
    { key: 'insurance', icon: '🏥', label: 'Book travel insurance', category: 'Documents' },
    { key: 'flight', icon: '✈️', label: 'Book flight tickets', category: 'Transport' },
    { key: 'hotel', icon: '🏨', label: 'Reserve hotels (check itinerary for recommendations)', category: 'Accommodation' },
    { key: 'currency', icon: '💱', label: `Exchange currency / get travel card for ${trip.destination}`, category: 'Money' },
    { key: 'pack', icon: '🧳', label: 'Pack clothes suitable for destination weather', category: 'Packing' },
    { key: 'guide', icon: '🗺️', label: 'Contact local guide if needed', category: 'Local Help' },
    { key: 'offline', icon: '📱', label: 'Download offline maps for destination', category: 'Tech' },
    { key: 'notify', icon: '🏦', label: 'Notify bank of travel dates', category: 'Money' },
  ]
  const doneCount = Object.values(checkedItems).filter(Boolean).length

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3 flex items-center gap-4" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => navigate(`/trip/${tripId}`)} className="p-2 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
          <ArrowLeft className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <div>
          <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>✈️ Pre-Travel Planner</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{trip.name} · {trip.departureCity || '?'} → {trip.destination}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--success)' }}>
            {doneCount}/{checklist.length} done
          </div>
          <button onClick={() => navigate(`/journey/${tripId}`)} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff' }}>
            🚀 Start Journey
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT: Main planner content */}
        <div className="lg:col-span-3 space-y-6">

          {/* Route Overview Card */}
          <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(251,191,36,0.05))', border: '1px solid rgba(245,158,11,0.3)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--warning)' }}>Your Route</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-1" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>🛫</div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{trip.departureCity || 'Your City'}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Departure</p>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="flex items-center gap-1 w-full px-2">
                  <div className="h-px flex-1" style={{ background: 'var(--border-color)' }} />
                  <span className="text-2xl">✈️</span>
                  <div className="h-px flex-1" style={{ background: 'var(--border-color)' }} />
                </div>
                {flightInfo && (
                  <div className="text-center mt-2 space-y-0.5">
                    <p className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>~{flightInfo.hours}h flight</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{flightInfo.dist.toLocaleString()} km</p>
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-1" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}>🏙️</div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{trip.destination}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Destination</p>
              </div>
            </div>
            {startDate && (
              <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  🗓️ Your trip starts <strong style={{ color: 'var(--text-primary)' }}>{startDate.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </p>
                {suggestDepartDate && (
                  <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                    We recommend departing <strong style={{ color: 'var(--warning)' }}>{suggestDepartDate.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })}</strong> to arrive fresh
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Flight Recommendation Card */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Plane className="h-5 w-5" style={{ color: '#3b82f6' }} />
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>✈️ Recommended Flights</h2>
            </div>

            <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#60a5fa' }} />
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#93c5fd' }}>What you need to book</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    You need a <strong style={{ color: 'var(--text-primary)' }}>round-trip flight</strong> from <strong style={{ color: '#93c5fd' }}>{trip.departureCity || 'your city'}</strong> to <strong style={{ color: '#86efac' }}>{trip.destination}</strong>. 
                    {flightInfo && <> The flight is approximately <strong style={{ color: 'var(--warning)' }}>{flightInfo.hours} hours</strong> ({flightInfo.dist.toLocaleString()} km).</>}
                    {isLongFlight && <> Since this is a long-haul flight, consider booking <strong style={{ color: 'var(--warning)' }}>business class or a premium economy seat</strong> for comfort.</>}
                  </p>
                </div>
              </div>
            </div>

            {/* Suggested departure times */}
            <div className="space-y-3 mb-4">
              {[
                { label: 'Early Morning', time: '06:00 – 08:00', tip: 'Best for avoiding delays. Arrives before afternoon.', icon: '🌅', recommended: true },
                { label: 'Late Morning', time: '10:00 – 12:00', tip: 'Good balance of rest and timing.', icon: '☀️', recommended: false },
                { label: 'Evening', time: '20:00 – 23:00', tip: isLongFlight ? 'Overnight flight – saves a hotel night.' : 'Avoid if arriving late.', icon: '🌙', recommended: isLongFlight },
              ].map(slot => (
                <div key={slot.label} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: slot.recommended ? 'rgba(34,197,94,0.08)' : 'var(--bg-subtle)', border: `1px solid ${slot.recommended ? 'rgba(34,197,94,0.25)' : 'var(--border-color)'}` }}>
                  <span className="text-xl">{slot.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{slot.label} · {slot.time}</p>
                      {slot.recommended && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(34,197,94,0.2)', color: 'var(--success)' }}>Recommended</span>}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{slot.tip}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Budget estimate */}
            <div className="p-3 rounded-xl mb-4" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>💰 Estimated Flight Cost</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Economy', price: flightInfo ? Math.round(flightInfo.dist * 0.09) : '~150', color: 'var(--success)' },
                  { label: 'Premium Eco', price: flightInfo ? Math.round(flightInfo.dist * 0.18) : '~300', color: 'var(--warning)' },
                  { label: 'Business', price: flightInfo ? Math.round(flightInfo.dist * 0.45) : '~700', color: '#f472b6' },
                ].map(cls => (
                  <div key={cls.label} className="p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                    <p className="text-sm font-bold" style={{ color: cls.color }}>${cls.price}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{cls.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>Estimates · Book 3–6 weeks in advance for best prices</p>
            </div>

            {/* Booking links */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Google Flights', icon: '🔍', url: `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(trip.departureCity||'')}+to+${encodeURIComponent(trip.destination)}` },
                { name: 'Skyscanner', icon: '🌐', url: `https://www.skyscanner.co.in/transport/flights/${encodeURIComponent(trip.departureCity||'')}/${encodeURIComponent(trip.destination)}/` },
                { name: 'MakeMyTrip', icon: '🏔️', url: `https://flights.makemytrip.com/` },
                { name: 'Kayak', icon: '🦆', url: `https://www.kayak.co.in/flights/${encodeURIComponent(trip.departureCity||'')}/${encodeURIComponent(trip.destination)}` },
              ].map(site => (
                <a key={site.name} href={site.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <span>{site.icon}</span> {site.name} <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              ))}
            </div>
          </div>

          {/* Train Alternative */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Train className="h-5 w-5" style={{ color: '#a78bfa' }} />
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>🚄 Train / Ground Transport</h2>
            </div>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              If your destination is accessible by train, it can be a scenic and cost-effective alternative. Trains are especially great for distances under 600 km.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'IRCTC (India)', icon: '🚂', url: `https://www.irctc.co.in/nget/train-search` },
                { name: 'Ixigo Trains', icon: '🛤️', url: `https://www.ixigo.com/search/result/train?sourceCity=${encodeURIComponent(trip.departureCity||'')}&destinationCity=${encodeURIComponent(trip.destination)}` },
                { name: 'Eurail (Europe)', icon: '🇪🇺', url: `https://www.eurail.com/` },
                { name: 'Rome2Rio', icon: '🗺️', url: `https://www.rome2rio.com/s/${encodeURIComponent(trip.departureCity||'')}/${encodeURIComponent(trip.destination)}` },
              ].map(site => (
                <a key={site.name} href={site.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.2)' }}>
                  <span>{site.icon}</span> {site.name} <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              ))}
            </div>
          </div>

          {/* Pre-travel Checklist */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>✅ Pre-Travel Checklist</h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: doneCount === checklist.length ? 'rgba(34,197,94,0.15)' : 'var(--bg-subtle)', color: doneCount === checklist.length ? 'var(--success)' : 'var(--text-muted)' }}>
                {doneCount}/{checklist.length}
              </span>
            </div>
            {/* Group by category */}
            {['Documents', 'Transport', 'Accommodation', 'Money', 'Packing', 'Local Help', 'Tech'].map(cat => {
              const items = checklist.filter(c => c.category === cat)
              if (!items.length) return null
              return (
                <div key={cat} className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{cat}</p>
                  <div className="space-y-2">
                    {items.map(item => (
                      <button key={item.key} onClick={() => toggleCheck(item.key)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                        style={{ background: checkedItems[item.key] ? 'rgba(34,197,94,0.08)' : 'var(--bg-subtle)', border: `1px solid ${checkedItems[item.key] ? 'rgba(34,197,94,0.25)' : 'var(--border-color)'}` }}>
                        <CheckCircle className="h-5 w-5 flex-shrink-0" style={{ color: checkedItems[item.key] ? 'var(--success)' : 'var(--border-color)' }} />
                        <span className="text-sm" style={{ color: checkedItems[item.key] ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: checkedItems[item.key] ? 'line-through' : 'none' }}>
                          {item.icon} {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA */}
          <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg,rgba(14,165,233,0.1),rgba(168,85,247,0.1))', border: '1px solid rgba(14,165,233,0.2)' }}>
            <p className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Ready to go? 🚀</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Once you've booked flights and packed up, launch Journey Mode to track your adventure live on the map.</p>
            <button onClick={() => navigate(`/journey/${tripId}`)}
              className="px-8 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 shadow-lg"
              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', boxShadow: '0 8px 24px rgba(34,197,94,0.4)' }}>
              🗺️ Launch Journey Mode
            </button>
          </div>
        </div>

        {/* RIGHT: Map + trip summary */}
        <div className="lg:col-span-2 space-y-4">
          {/* Route Map */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)', height: 320 }}>
            <MapContainer center={mapCenter} zoom={hasDep && hasDest ? 4 : 2} className="h-full w-full" zoomControl={false}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap'
              />
              {arc && <Polyline positions={arc} color="#f59e0b" weight={2.5} opacity={0.8} dashArray="8,5" />}
              {hasDep && (
                <Marker position={[trip.departureLat, trip.departureLng]} icon={mkIcon('🛫', 30)}>
                  <Popup><b>Departure</b><br />{trip.departureCity}</Popup>
                </Marker>
              )}
              {hasDest && (
                <Marker position={[trip.lat, trip.lng]} icon={mkIcon('🏙️', 34)}>
                  <Popup><b>Destination</b><br />{trip.destination}</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {/* Trip Summary */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Trip Summary</p>
            <div className="space-y-3">
              {[
                { icon: <MapPin className="h-4 w-4" />, label: 'Destination', value: trip.destination, color: 'var(--primary)' },
                { icon: <span>🛫</span>, label: 'From', value: trip.departureCity || 'Not set', color: '#f59e0b' },
                { icon: <Calendar className="h-4 w-4" />, label: 'Dates', value: `${trip.startDate ? new Date(trip.startDate).toLocaleDateString('en', { day: 'numeric', month: 'short' }) : '?'} – ${trip.endDate ? new Date(trip.endDate).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : '?'}`, color: 'var(--secondary)' },
                { icon: <DollarSign className="h-4 w-4" />, label: 'Budget', value: `$${trip.budget?.toLocaleString() || 0}`, color: 'var(--success)' },
                { icon: <Clock className="h-4 w-4" />, label: 'Style', value: trip.travelStyle, color: 'var(--warning)' },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <div style={{ color: row.color }}>{row.icon}</div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                    <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{row.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flight timeline */}
          {flightInfo && (
            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>📅 Suggested Timeline</p>
              <div className="space-y-3 text-sm">
                {[
                  { day: `${suggestDepartDate ? suggestDepartDate.toLocaleDateString('en', { day: 'numeric', month: 'short' }) : 'Day before'}`, label: 'Depart from home', detail: `Head to airport early morning`, icon: '🛫', color: '#3b82f6' },
                  { day: `In-flight`, label: `${flightInfo.hours}h journey`, detail: 'Rest, eat, arrive refreshed', icon: '✈️', color: '#f59e0b' },
                  { day: `${startDate ? startDate.toLocaleDateString('en', { day: 'numeric', month: 'short' }) : 'Day 1'}`, label: `Arrive in ${trip.destination}`, detail: 'Check in, settle in, explore nearby', icon: '🏙️', color: '#22c55e' },
                ].map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: `${step.color}22`, border: `1px solid ${step.color}44` }}>
                        {step.icon}
                      </div>
                      {i < 2 && <div className="w-px flex-1 my-1" style={{ background: 'var(--border-color)' }} />}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs font-bold" style={{ color: step.color }}>{step.day}</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{step.label}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasDep && (
            <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--warning)' }}>⚠️ Set your departure city</p>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Go back and edit this trip to add where you're traveling from. It unlocks the flight arc on the map and distance estimates.</p>
              <Link to={`/trip/${tripId}`} className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>← Back to Trip</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TravelPlanner
