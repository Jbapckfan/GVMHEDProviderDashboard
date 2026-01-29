import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import KPIImageUpload from './components/KPIImageUpload'
import ScheduleCalendar from './components/ScheduleCalendar'
import PhoneDirectory from './components/PhoneDirectory'
import NewsUpdates from './components/NewsUpdates'
import OrderSetSuggestions from './components/OrderSetSuggestions'
import ProviderChartStatus from './components/ProviderChartStatus'
import KPIGoals from './components/KPIGoals'
import MessageBoard from './components/MessageBoard'
import HospitalistPager from './components/HospitalistPager'

// --- Section configuration ---
const DEFAULT_SECTIONS = [
  { id: 'messages', title: 'Provider Message Board', icon: '\u{1F4AC}' },
  { id: 'pager', title: 'Page Hospitalist', icon: '\u{1F4DF}' },
  { id: 'schedule', title: 'Schedule', icon: '\u{1F4C5}' },
  { id: 'charts', title: 'Provider Chart Status', icon: '\u{1F4CA}' },
  { id: 'kpi-docs', title: 'Department KPI Documents', icon: '\u{1F4C1}' },
  { id: 'kpi-goals', title: 'KPI Goals & Targets', icon: '\u{1F3AF}' },
  { id: 'news', title: 'Latest Updates', icon: '\u{1F4F0}' },
  { id: 'phone', title: 'Quick Reference Numbers', icon: '\u{1F4DE}' },
  { id: 'suggestions', title: 'Order Set Suggestions', icon: '\u{1F4A1}' },
]

const SECTION_COMPONENTS = {
  'messages': MessageBoard,
  'pager': HospitalistPager,
  'schedule': ScheduleCalendar,
  'charts': ProviderChartStatus,
  'kpi-docs': KPIImageUpload,
  'kpi-goals': KPIGoals,
  'news': NewsUpdates,
  'phone': PhoneDirectory,
  'suggestions': OrderSetSuggestions,
}

const VALID_IDS = new Set(DEFAULT_SECTIONS.map(s => s.id))
const DEFAULT_ORDER = DEFAULT_SECTIONS.map(s => s.id)

// --- localStorage helpers with stale-data reconciliation ---
function getInitialOrder() {
  try {
    const raw = localStorage.getItem('dashboard-section-order')
    if (!raw) return DEFAULT_ORDER
    const stored = JSON.parse(raw)
    if (!Array.isArray(stored)) return DEFAULT_ORDER
    // Filter out removed sections
    const filtered = stored.filter(id => VALID_IDS.has(id))
    // Append any new sections not in stored order
    const storedSet = new Set(filtered)
    const appended = DEFAULT_ORDER.filter(id => !storedSet.has(id))
    return [...filtered, ...appended]
  } catch {
    return DEFAULT_ORDER
  }
}

function getInitialCollapsed() {
  try {
    const raw = localStorage.getItem('dashboard-collapsed')
    if (!raw) return {}
    const stored = JSON.parse(raw)
    if (typeof stored !== 'object' || stored === null) return {}
    // Filter to valid IDs only
    const result = {}
    for (const id of Object.keys(stored)) {
      if (VALID_IDS.has(id)) result[id] = !!stored[id]
    }
    return result
  } catch {
    return {}
  }
}

function App() {
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })
  const [showQR, setShowQR] = useState(false)

  // Section order + collapsed state (persisted to localStorage)
  const [sectionOrder, setSectionOrder] = useState(getInitialOrder)
  const [collapsedSections, setCollapsedSections] = useState(getInitialCollapsed)

  // Transient drag state
  const [draggedId, setDraggedId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [dropPosition, setDropPosition] = useState(null) // 'before' | 'after'
  const canDragRef = useRef(false)

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(siteUrl)}`

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', darkMode)
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  // Persist section order
  useEffect(() => {
    try { localStorage.setItem('dashboard-section-order', JSON.stringify(sectionOrder)) } catch {}
  }, [sectionOrder])

  // Persist collapsed state
  useEffect(() => {
    try { localStorage.setItem('dashboard-collapsed', JSON.stringify(collapsedSections)) } catch {}
  }, [collapsedSections])

  const handleRefresh = () => {
    setLastUpdated(new Date())
    window.location.reload()
  }

  // --- Collapse / Expand ---
  const toggleCollapse = useCallback((id) => {
    setCollapsedSections(prev => {
      const next = { ...prev, [id]: !prev[id] }
      return next
    })
  }, [])

  // --- Reset Layout ---
  const resetLayout = useCallback(() => {
    setSectionOrder(DEFAULT_ORDER)
    setCollapsedSections({})
    try {
      localStorage.removeItem('dashboard-section-order')
      localStorage.removeItem('dashboard-collapsed')
    } catch {}
  }, [])

  // --- Drag and Drop handlers ---
  const handleDragStart = useCallback((e, sectionId) => {
    if (!canDragRef.current) {
      e.preventDefault()
      return
    }
    // Deferred via rAF so the browser captures the element before we alter styles
    requestAnimationFrame(() => {
      setDraggedId(sectionId)
    })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', sectionId)
  }, [])

  const handleDragOver = useCallback((e, sectionId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (!draggedId || sectionId === draggedId) {
      setDragOverId(null)
      setDropPosition(null)
      return
    }
    // Determine before/after from cursor Y relative to element midpoint
    const rect = e.currentTarget.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const pos = e.clientY < midY ? 'before' : 'after'
    setDragOverId(sectionId)
    setDropPosition(pos)
  }, [draggedId])

  const handleDragLeave = useCallback((e) => {
    // Only clear if we actually left the element (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverId(null)
      setDropPosition(null)
    }
  }, [])

  const handleDrop = useCallback((e, targetId) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      setDropPosition(null)
      return
    }
    setSectionOrder(prev => {
      const order = prev.filter(id => id !== draggedId)
      const targetIdx = order.indexOf(targetId)
      if (targetIdx === -1) return prev
      const insertIdx = dropPosition === 'before' ? targetIdx : targetIdx + 1
      order.splice(insertIdx, 0, draggedId)
      return order
    })
    setDraggedId(null)
    setDragOverId(null)
    setDropPosition(null)
  }, [draggedId, dropPosition])

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setDragOverId(null)
    setDropPosition(null)
    canDragRef.current = false
  }, [])

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>{'\u{1F3E5}'} GVMH ED Provider Dashboard</h1>
          <div className="header-info">
            <span className="status-dot"></span>
            <span className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <button onClick={resetLayout} className="refresh-btn" title="Reset dashboard layout to defaults">
              {'\u21BA'} Reset Layout
            </button>
            <button onClick={() => setShowQR(!showQR)} className="refresh-btn">
              {'\u{1F4F1}'} QR Code
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="refresh-btn dark-mode-toggle">
              {darkMode ? '\u2600\uFE0F' : '\u{1F319}'} {darkMode ? 'Light' : 'Dark'}
            </button>
            <button onClick={handleRefresh} className="refresh-btn">
              {'\u21BB'} Refresh
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
          {sectionOrder.map(sectionId => {
            const config = DEFAULT_SECTIONS.find(s => s.id === sectionId)
            const Component = SECTION_COMPONENTS[sectionId]
            if (!config || !Component) return null

            const isCollapsed = !!collapsedSections[sectionId]
            const isDragging = draggedId === sectionId
            const isOver = dragOverId === sectionId

            const classNames = [
              'dashboard-section',
              'grid-full',
              isDragging ? 'dragging' : '',
              isOver && dropPosition === 'before' ? 'drop-before' : '',
              isOver && dropPosition === 'after' ? 'drop-after' : '',
            ].filter(Boolean).join(' ')

            return (
              <div
                key={sectionId}
                className={classNames}
                draggable
                onDragStart={(e) => handleDragStart(e, sectionId)}
                onDragOver={(e) => handleDragOver(e, sectionId)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, sectionId)}
                onDragEnd={handleDragEnd}
              >
                {/* Collapsed bar - shown when collapsed */}
                {isCollapsed && (
                  <div className="collapsed-bar">
                    <span
                      className="drag-handle"
                      onMouseDown={() => { canDragRef.current = true }}
                      onMouseUp={() => { canDragRef.current = false }}
                      title="Drag to reorder"
                    >
                      {'\u205E'}
                    </span>
                    <span className="collapsed-icon">{config.icon}</span>
                    <span className="collapsed-title">{config.title}</span>
                    <button
                      className="expand-btn"
                      onClick={() => toggleCollapse(sectionId)}
                      title="Expand section"
                    >
                      {'\u25BC'}
                    </button>
                  </div>
                )}

                {/* Section content - ALWAYS rendered, hidden via CSS when collapsed */}
                <div className={`section-content${isCollapsed ? ' section-hidden' : ''}`}>
                  <div className="section-toolbar">
                    <span
                      className="drag-handle"
                      onMouseDown={() => { canDragRef.current = true }}
                      onMouseUp={() => { canDragRef.current = false }}
                      title="Drag to reorder"
                    >
                      {'\u205E'}
                    </span>
                    <button
                      className="collapse-btn"
                      onClick={() => toggleCollapse(sectionId)}
                      title="Collapse section"
                    >
                      {'\u25B2'}
                    </button>
                  </div>
                  <Component />
                </div>
              </div>
            )
          })}
        </div>
      </main>

      <footer className="footer">
        <p>GVM Health ED Provider Dashboard v1.0 | For authorized use only</p>
      </footer>
    </div>
  )
}

export default App
