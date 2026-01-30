import { useState, useEffect } from 'react'
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
          <h1>
            <img src="/gvmh-logo.png" alt="GVMH" className="schedule-page-logo" />
            ED Provider Schedule
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="schedule-page-toggle"
          >
            {darkMode ? '\u2600\uFE0F' : '\u{1F319}'} {darkMode ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      <main className="schedule-page-main">
        <ScheduleCalendar />
      </main>

      <section className="schedule-qr-section">
        <img src={qrCodeUrl} alt="QR Code" className="schedule-qr-img" />
        <div className="schedule-qr-text">
          <p className="schedule-qr-heading">Scan to view this schedule on your device</p>
          <p className="schedule-qr-url">{scheduleUrl}</p>
        </div>
      </section>

      <footer className="schedule-page-footer">
        <p>GVMH ED Provider Schedule | Updated live</p>
      </footer>
    </div>
  )
}

export default SchedulePage
