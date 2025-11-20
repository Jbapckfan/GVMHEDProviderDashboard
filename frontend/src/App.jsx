import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import KPIImageUpload from './components/KPIImageUpload'
import ShiftSchedule from './components/ShiftSchedule'
import ProviderList from './components/ProviderList'
import QuickLinksCard from './components/QuickLinksCard'

const API_BASE = '/api'

function App() {
  const [providers, setProviders] = useState([])
  const [shifts, setShifts] = useState([])
  const [quickLinks, setQuickLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    fetchAllData()
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchAllData, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchAllData = async () => {
    try {
      const [providersRes, shiftsRes, linksRes] = await Promise.all([
        axios.get(`${API_BASE}/providers`),
        axios.get(`${API_BASE}/shifts`),
        axios.get(`${API_BASE}/quick-links`)
      ])

      setProviders(providersRes.data)
      setShifts(shiftsRes.data)
      setQuickLinks(linksRes.data)
      setLastUpdated(new Date())
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
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
            <button onClick={fetchAllData} className="refresh-btn">
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

          {/* Second row - Shifts and Providers */}
          <div className="grid-col-2">
            <ShiftSchedule shifts={shifts} />
          </div>
          <div className="grid-col-1">
            <ProviderList providers={providers} />
          </div>

          {/* Third row - Quick Links */}
          <div className="grid-col-2">
            <QuickLinksCard links={quickLinks} />
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
