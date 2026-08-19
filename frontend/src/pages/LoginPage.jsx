import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { API_BASE } from '../utils/api'
import './LoginPage.css'

function LoginPage({ onLogin }) {
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Wake the backend immediately so it's warm by the time the user submits
  useEffect(() => {
    fetch(`${API_BASE}/health`).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!lastName.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${API_BASE}/auth/provider-login`, {
        lastName: lastName.trim()
      })
      if (response.data.success) {
        sessionStorage.setItem('providerAuth', JSON.stringify({
          providerName: response.data.providerName,
          timestamp: Date.now()
        }))
        onLogin(response.data.providerName)
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Last name not recognized. Please try again.')
      } else {
        setError('Unable to connect. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <aside className="login-brand-panel">
        <div className="login-brand-lockup">
          <img src="/gvmh-logo.png" alt="Golden Valley Memorial Healthcare" className="login-logo" />
          <span>Emergency Department</span>
        </div>
        <div className="login-brand-copy">
          <div className="login-kicker">Provider operations</div>
          <h1>Everything your shift needs, in one place.</h1>
          <p>See who is on, page the hospitalist, check the published schedule, and find department resources.</p>
        </div>
        <div className="login-status-line">
          <span aria-hidden="true"></span>
          Published schedule data is live
        </div>
      </aside>

      <main className="login-main">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-kicker">GVMH ED</div>
            <h2 className="login-title">Provider dashboard</h2>
            <p className="login-subtitle">Enter your last name to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="provider-last-name">Provider last name</label>
            <input
              id="provider-last-name"
              type="text"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setError('') }}
              placeholder="e.g. Alford"
              className={`login-input${error ? ' login-input-error' : ''}`}
              autoFocus
              autoComplete="family-name"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'login-error' : 'login-help'}
            />
            {error ? <p id="login-error" className="login-error" role="alert">{error}</p> : null}
            <p id="login-help" className="login-field-help">Use the same last name listed on the provider schedule.</p>
            <button type="submit" className="login-btn" disabled={loading || !lastName.trim()}>
              {loading ? 'Verifying…' : 'Continue'}
            </button>
          </form>

          <div className="login-divider"><span>or</span></div>
          <Link to="/schedule" className="login-schedule-link">
            View the published provider schedule <span aria-hidden="true">{'\u2192'}</span>
          </Link>

          <p className="login-hint">Access is restricted to GVMH ED providers.</p>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
