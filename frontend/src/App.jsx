import { useState, useEffect } from 'react'
import './App.css'
import KPIImageUpload from './components/KPIImageUpload'
import ScheduleCalendar from './components/ScheduleCalendar'
import PhoneDirectory from './components/PhoneDirectory'
import NewsUpdates from './components/NewsUpdates'
import OrderSetSuggestions from './components/OrderSetSuggestions'
import ProviderChartStatus from './components/ProviderChartStatus'
import KPIGoals from './components/KPIGoals'
import MessageBoard from './components/MessageBoard'

function App() {
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })
  const [showQR, setShowQR] = useState(false)

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(siteUrl)}`

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', darkMode)
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  const handleRefresh = () => {
    setLastUpdated(new Date())
    window.location.reload()
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🏥 GVMH ED Provider Dashboard</h1>
          <div className="header-info">
            <span className="status-dot"></span>
            <span className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <button onClick={() => setShowQR(!showQR)} className="refresh-btn">
              📱 QR Code
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="refresh-btn">
              {darkMode ? '☀️' : '🌙'} {darkMode ? 'Light' : 'Dark'}
            </button>
            <button onClick={handleRefresh} className="refresh-btn">
              ↻ Refresh
            </button>
          </div>
          {showQR && (
            <div className="qr-dropdown">
              <img src={qrCodeUrl} alt="QR Code" className="qr-code" />
              <p className="qr-text">Scan to access dashboard</p>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        <div className="dashboard-grid">
          {/* Top row - KPI Metrics Image Upload */}
          <div className="grid-full">
            <KPIImageUpload />
          </div>

          {/* Second row - Schedule Calendar */}
          <div className="grid-full">
            <ScheduleCalendar />
          </div>

          {/* Third row - Provider Chart Status */}
          <div className="grid-full">
            <ProviderChartStatus />
          </div>

          {/* Fourth row - KPI Goals */}
          <div className="grid-full">
            <KPIGoals />
          </div>

          {/* Fifth row - Message Board */}
          <div className="grid-full">
            <MessageBoard />
          </div>

          {/* Sixth row - News Updates */}
          <div className="grid-full">
            <NewsUpdates />
          </div>

          {/* Seventh row - Phone Directory and Order Set Suggestions */}
          <div className="grid-col-1">
            <PhoneDirectory />
          </div>
          <div className="grid-col-2">
            <OrderSetSuggestions />
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>GVM Health ED Provider Dashboard v1.0 | For authorized use only</p>
      </footer>
    </div>
  )
}

export default App
