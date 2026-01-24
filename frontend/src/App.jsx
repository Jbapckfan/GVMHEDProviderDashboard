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
            <button onClick={() => setDarkMode(!darkMode)} className="refresh-btn">
              {darkMode ? '☀️' : '🌙'} {darkMode ? 'Light' : 'Dark'}
            </button>
            <button onClick={handleRefresh} className="refresh-btn">
              ↻ Refresh
            </button>
          </div>
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

          {/* Sixth row - Phone Directory and News */}
          <div className="grid-col-1">
            <PhoneDirectory />
          </div>
          <div className="grid-col-2">
            <NewsUpdates />
          </div>

          {/* Seventh row - Order Set Suggestions */}
          <div className="grid-full">
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
