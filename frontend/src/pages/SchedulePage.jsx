import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ScheduleCalendar from '../components/ScheduleCalendar'
import './SchedulePage.css'

function SchedulePage() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  const scheduleUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/schedule`
    : ''
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(scheduleUrl)}`

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', darkMode)
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  return (
    <div className="schedule-page">
      <header className="schedule-page-header">
        <div className="schedule-page-header-content">
          <div className="schedule-page-brand">
            <img src="/gvmh-logo.png" alt="Golden Valley Memorial Healthcare" className="schedule-page-logo" />
            <div>
              <span>Emergency Department</span>
              <h1>Published provider schedule</h1>
            </div>
          </div>
          <div className="schedule-page-actions">
            <Link to="/" className="schedule-page-link">Provider sign in</Link>
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="schedule-page-toggle"
              aria-label={`Use ${darkMode ? 'light' : 'dark'} theme`}
            >
              {darkMode ? '\u2600' : '\u263E'} <span>{darkMode ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="schedule-page-main">
        <div className="schedule-page-intro">
          <div>
            <span className="schedule-page-kicker">Live published schedule</span>
            <h2>ED coverage at a glance</h2>
          </div>
          <p>Only published months from the GVMH Schedule Automator appear here.</p>
        </div>
        <ScheduleCalendar limitToCurrentAndNext />
      </main>

      <section className="schedule-qr-section">
        <img src={qrCodeUrl} alt="QR Code" className="schedule-qr-img" />
        <div className="schedule-qr-text">
          <p className="schedule-qr-heading">Scan to view this schedule on your device</p>
          <p className="schedule-qr-url">{scheduleUrl}</p>
        </div>
      </section>

      <footer className="schedule-page-footer">
        <p>GVMH Emergency Department · Published provider schedule</p>
        <span>Updated live</span>
      </footer>
    </div>
  )
}

export default SchedulePage
