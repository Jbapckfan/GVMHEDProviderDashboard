import { useState } from 'react'
import axios from 'axios'
import { API_BASE } from '../utils/api'
import './LoginPage.css'

function LoginPage({ onLogin }) {
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      <div className="login-card">
        <img src="/gvmh-logo.png" alt="GVMH" className="login-logo" />
        <h1 className="login-title">ED Provider Dashboard</h1>
        <p className="login-subtitle">Enter your last name to access the dashboard</p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            value={lastName}
            onChange={(e) => { setLastName(e.target.value); setError('') }}
            placeholder="Last name"
            className={`login-input${error ? ' login-input-error' : ''}`}
            autoFocus
            autoComplete="off"
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn" disabled={loading || !lastName.trim()}>
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <p className="login-hint">
          Access is restricted to ED providers.
        </p>
        <a
          href="https://docs.google.com/spreadsheets/d/1eFtQiknDOiQSwJkYs-jC-w1_K0byKB5I9qkIE9xnnpU/pubhtml"
          target="_blank"
          rel="noopener noreferrer"
          className="login-schedule-link"
        >
          View Provider Schedule
        </a>
      </div>
    </div>
  )
}

export default LoginPage
