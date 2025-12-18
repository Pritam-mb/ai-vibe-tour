import { useState } from 'react'
import { UserPlus, Award, MapPin, DollarSign, Languages, Briefcase, Check } from 'lucide-react'

function GuideRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: 'Cultural Tours',
    languages: ['English'],
    pricePerDay: '',
    experience: '',
    bio: '',
    destination: '',
    certifications: []
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const specialties = [
    'Cultural Tours',
    'Adventure Tours',
    'Food & Culinary',
    'Historical Tours',
    'Nature & Wildlife',
    'Photography Tours',
    'Shopping Tours',
    'Night Life'
  ]

  const languageOptions = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Mandarin', 'Hindi', 'Arabic']

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleLanguageToggle = (lang) => {
    const updated = formData.languages.includes(lang)
      ? formData.languages.filter(l => l !== lang)
      : [...formData.languages, lang]
    setFormData({ ...formData, languages: updated })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:5003/api/guides/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setSuccess(true)
      setTimeout(() => {
        window.location.href = '/guides'
      }, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-dark)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
            <Check className="h-8 w-8" style={{ color: 'var(--success)' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Registration Successful!</h2>
          <p style={{ color: 'var(--text-muted)' }}>Your profile is under review. We'll notify you once verified.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'var(--bg-dark)' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--primary-subtle)' }}>
            <Award className="h-8 w-8" style={{ color: 'var(--primary)' }} />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Become a Tour Guide</h1>
          <p style={{ color: 'var(--text-muted)' }}>Join our network and connect with travelers worldwide</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl p-6 md:p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          {error && (
            <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
              {error}
            </div>
          )}

          {/* Personal Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Personal Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg"
                  style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg"
                  style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg"
                  style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Destination/City *</label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  placeholder="e.g., Paris, France"
                  className="w-full px-4 py-2.5 rounded-lg"
                  style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Professional Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Professional Details</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Specialty *</label>
                <select
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg"
                  style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  required
                >
                  {specialties.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Experience (years)</label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2.5 rounded-lg"
                  style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Price Per Day (USD) *</label>
              <input
                type="number"
                name="pricePerDay"
                value={formData.pricePerDay}
                onChange={handleChange}
                min="0"
                placeholder="150"
                className="w-full px-4 py-2.5 rounded-lg"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="4"
                placeholder="Tell us about yourself and your guiding experience..."
                className="w-full px-4 py-2.5 rounded-lg"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Languages */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Languages</h3>
            <div className="flex flex-wrap gap-2">
              {languageOptions.map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageToggle(lang)}
                  className="px-4 py-2 rounded-lg text-sm transition-all"
                  style={{
                    background: formData.languages.includes(lang) ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: formData.languages.includes(lang) ? '#fff' : 'var(--text-primary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--primary)' }}
          >
            {loading ? 'Registering...' : <><UserPlus className="h-5 w-5" /> Register as Guide</>}
          </button>
        </form>
      </div>
    </div>
  )
}

export default GuideRegistration
