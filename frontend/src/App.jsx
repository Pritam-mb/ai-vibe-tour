import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import Home from './pages/Home'
import CreateTrip from './pages/CreateTrip'
import TripWorkspace from './pages/TripWorkspace'
import JourneyMode from './pages/JourneyMode'
import GuidesMarketplace from './pages/GuidesMarketplace'
import GuideRegistration from './pages/GuideRegistration'
import AdminGuides from './pages/AdminGuides'
import SoloTravelers from './pages/SoloTravelers'
import Login from './pages/Login'
import { useAuthStore } from './store/authStore'
import ErrorBoundary from './components/ErrorBoundary'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }
  
  return user ? children : <Navigate to="/login" replace />
}

function App() {
  const { initialize } = useAuthStore()
  
  useEffect(() => {
    initialize()
  }, [])
  
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="create-trip" element={<ProtectedRoute><CreateTrip /></ProtectedRoute>} />
            <Route path="trip/:tripId" element={<ProtectedRoute><TripWorkspace /></ProtectedRoute>} />
            <Route path="guides" element={<GuidesMarketplace />} />
            <Route path="register-guide" element={<GuideRegistration />} />
            <Route path="admin/guides" element={<ProtectedRoute><AdminGuides /></ProtectedRoute>} />
            <Route path="solo-travelers" element={<SoloTravelers />} />
          </Route>
          <Route path="/journey/:tripId" element={<ProtectedRoute><JourneyMode /></ProtectedRoute>} />
        </Routes>
      </ErrorBoundary>
    </Router>
  )
}

export default App
