import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { Plane, Map, Users, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import InvitationNotifications from './InvitationNotifications'

function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const isTripWorkspace = location.pathname.startsWith('/trip/')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Floating Navigation */}
      <nav className="floating-nav">
        <div className="h-full px-5 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Plane className="h-6 w-6 transition-transform group-hover:rotate-12" style={{ color: 'var(--primary)' }} />
            </div>
            <span className="text-lg font-bold tracking-tight gradient-text">VIBE TRIP</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                color: isActive('/') ? 'var(--text-primary)' : 'var(--text-muted)',
                background: isActive('/') ? 'var(--bg-elevated)' : 'transparent'
              }}
            >
              My Trips
            </Link>
            <Link
              to="/guides"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              style={{
                color: isActive('/guides') ? 'var(--text-primary)' : 'var(--text-muted)',
                background: isActive('/guides') ? 'var(--bg-elevated)' : 'transparent'
              }}
            >
              <Map className="h-4 w-4" />
              <span>Guides</span>
            </Link>
            <Link
              to="/solo-travelers"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              style={{
                color: isActive('/solo-travelers') ? 'var(--text-primary)' : 'var(--text-muted)',
                background: isActive('/solo-travelers') ? 'var(--bg-elevated)' : 'transparent'
              }}
            >
              <Users className="h-4 w-4" />
              <span>Find Buddies</span>
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {user && <InvitationNotifications />}
            <Link to="/create-trip" className="btn-primary text-sm py-2 px-4">
              New Trip
            </Link>
            {user && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24">
        <Outlet />
      </main>

      {/* Footer */}
      {!isTripWorkspace && (
        <footer className="mt-24 py-8 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              © 2025 VIBE TRIP – AI-Powered Collaborative Travel Planning
            </p>
          </div>
        </footer>
      )}
    </div>
  )
}

export default Layout
