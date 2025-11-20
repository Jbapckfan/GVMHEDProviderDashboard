import { useState } from 'react'
import './App.css'
import KPIImageUpload from './components/KPIImageUpload'
import ScheduleViewer from './components/ScheduleViewer'
import PhoneDirectory from './components/PhoneDirectory'
import NewsUpdates from './components/NewsUpdates'
import OrderSetSuggestions from './components/OrderSetSuggestions'

function App() {
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const handleRefresh = () => {
    setLastUpdated(new Date())
    window.location.reload()
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🏥 ED Provider Dashboard</h1>
          <div className="header-info">
            <span className="status-dot"></span>
            <span className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
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

          {/* Second row - Schedule Viewer */}
          <div className="grid-full">
            <ScheduleViewer />
          </div>

          {/* Third row - Phone Directory and News */}
          <div className="grid-col-1">
            <PhoneDirectory />
          </div>
          <div className="grid-col-1">
            <NewsUpdates />
          </div>

          {/* Fourth row - Order Set Suggestions */}
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
