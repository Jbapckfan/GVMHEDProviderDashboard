import { useState, useEffect, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
import WhosOnNow from './components/WhosOnNow'
import ClinicalResources from './components/ClinicalResources'
import SchedulePage from './pages/SchedulePage'
import AdminSettings from './components/AdminSettings'
import AdminScheduleControls from './components/AdminScheduleControls'
import LoginPage from './pages/LoginPage'

// --- Section configuration ---
const DEFAULT_SECTIONS = [
  { id: 'whos-on', title: "Who's On Now", icon: '\u{1F7E2}' },
  { id: 'pager', title: 'Page Hospitalist', icon: '\u{1F4DF}' },
  { id: 'phone', title: 'Quick Reference Numbers', icon: '\u{1F4DE}' },
  { id: 'schedule', title: 'Schedule', icon: '\u{1F4C5}' },
  { id: 'messages', title: 'Provider Message Board', icon: '\u{1F4AC}' },
  { id: 'charts', title: 'Provider Chart Status', icon: '\u{1F4CA}' },
  { id: 'kpi-docs', title: 'Department KPI Documents', icon: '\u{1F4C1}' },
  { id: 'kpi-goals', title: 'KPI Goals & Targets', icon: '\u{1F3AF}' },
  { id: 'news', title: 'Latest Updates', icon: '\u{1F4F0}' },
  { id: 'clinical', title: 'Clinical Resources', icon: '\u{1F4D6}' },
  { id: 'suggestions', title: 'Order Set Suggestions', icon: '\u{1F4A1}' },
]

const SECTION_COMPONENTS = {
  'whos-on': WhosOnNow,
  'messages': MessageBoard,
  'pager': HospitalistPager,
  'schedule': ScheduleCalendar,
  'charts': ProviderChartStatus,
  'kpi-docs': KPIImageUpload,
  'kpi-goals': KPIGoals,
  'news': NewsUpdates,
  'phone': PhoneDirectory,
  'clinical': ClinicalResources,
  'suggestions': OrderSetSuggestions,
}

const VALID_IDS = new Set(DEFAULT_SECTIONS.map(s => s.id))
const DEFAULT_ORDER = DEFAULT_SECTIONS.map(s => s.id)
const SECTION_BY_ID = new Map(DEFAULT_SECTIONS.map(section => [section.id, section]))

function formatProviderName(providerName) {
  if (providerName.includes('NP') || providerName.startsWith('Dr.')) return providerName
  const parts = providerName.trim().split(/\s+/)
  return `Dr. ${parts[parts.length - 1]}`
}

// Sections that must stay full-width (layout breaks otherwise)
const FULL_WIDTH_ONLY = new Set(['schedule', 'whos-on'])

// Sections that default to half-width
const DEFAULT_HALF_WIDTH = { pager: 'half', phone: 'half' }

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

function getInitialSizes() {
  try {
    const raw = localStorage.getItem('dashboard-section-sizes')
    if (!raw) return {}
    const stored = JSON.parse(raw)
    if (typeof stored !== 'object' || stored === null) return {}
    const result = {}
    for (const id of Object.keys(stored)) {
      if (VALID_IDS.has(id) && (stored[id] === 'full' || stored[id] === 'half')) {
        result[id] = stored[id]
      }
    }
    return result
  } catch {
    return {}
  }
}

// --- Sortable section wrapper ---
function SortableSection({ sectionId, config, Component, isCollapsed, canResize, size, gridClass, toggleCollapse, toggleSize }) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({ id: sectionId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      id={`section-${sectionId}`}
      style={style}
      data-section-id={sectionId}
      className={`dashboard-section ${gridClass}${isDragging ? ' section-dragging' : ''}`}
    >
      {/* Collapsed bar - shown when collapsed */}
      {isCollapsed && (
        <div className="collapsed-bar">
          <button className="drag-handle" {...attributes} {...listeners} title="Drag to reorder" aria-label="Drag to reorder">
            {'\u2630'}
          </button>
          <span className="collapsed-icon">{config.icon}</span>
          <span className="collapsed-title">{config.title}</span>
          <div className="toolbar-actions">
            {canResize && (
              <button className="resize-btn" onClick={() => toggleSize(sectionId)} title={size === 'full' ? 'Half width' : 'Full width'}>
                {size === 'full' ? '\u{2B0C}' : '\u{2B0D}'}
              </button>
            )}
            <button className="expand-btn" onClick={() => toggleCollapse(sectionId)} title="Expand section">{'\u25BC'}</button>
          </div>
        </div>
      )}

      {/* Section content - ALWAYS rendered, hidden via CSS when collapsed */}
      <div className={`section-content${isCollapsed ? ' section-hidden' : ''}`}>
        <div className="section-toolbar">
          <div className="toolbar-left">
            <button className="drag-handle" {...attributes} {...listeners} title="Drag to reorder" aria-label="Drag to reorder">
              {'\u2630'}
            </button>
            <span className="toolbar-title">{config.icon} {config.title}</span>
          </div>
          <div className="toolbar-actions">
            {canResize && (
              <button className="resize-btn" onClick={() => toggleSize(sectionId)} title={size === 'full' ? 'Half width' : 'Full width'}>
                {size === 'full' ? '\u{2B0C}' : '\u{2B0D}'}
              </button>
            )}
            <button className="collapse-btn" onClick={() => toggleCollapse(sectionId)} title="Collapse section">{'\u2212'}</button>
          </div>
        </div>
        <Component />
      </div>
    </div>
  )
}

function App() {
  const [providerName, setProviderName] = useState(() => {
    try {
      const auth = JSON.parse(sessionStorage.getItem('providerAuth'))
      return auth?.providerName || null
    } catch { return null }
  })

  const handleLogin = (name) => setProviderName(name)

  const handleLogout = () => {
    sessionStorage.removeItem('providerAuth')
    setProviderName(null)
  }

  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })
  const [showQR, setShowQR] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('dashboard-sidebar-collapsed') === 'true' } catch { return false }
  })
  const [showSettings, setShowSettings] = useState(false)
  const [showScheduleControls, setShowScheduleControls] = useState(false)

  // Admin check: only show settings gear for "Alford"
  const isAdmin = providerName && providerName.trim().split(/\s+/).pop().toLowerCase() === 'alford'

  // Section order + collapsed + sizes state (persisted to localStorage)
  const [sectionOrder, setSectionOrder] = useState(getInitialOrder)
  const [collapsedSections, setCollapsedSections] = useState(getInitialCollapsed)
  const [sectionSizes, setSectionSizes] = useState(getInitialSizes)

  // Active drag ID for DragOverlay
  const [activeDragId, setActiveDragId] = useState(null)

  // Auto-collapse low-priority sections on mobile if user hasn't set preferences
  useEffect(() => {
    if (window.innerWidth >= 768) return
    const hasStoredPrefs = localStorage.getItem('dashboard-collapsed')
    if (hasStoredPrefs) return
    setCollapsedSections(prev => ({
      ...prev,
      charts: true,
      'kpi-goals': true,
      'kpi-docs': true,
    }))
  }, [])

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(siteUrl)}`

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', darkMode)
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    try { localStorage.setItem('dashboard-sidebar-collapsed', String(sidebarCollapsed)) } catch {}
  }, [sidebarCollapsed])

  // Persist section order
  useEffect(() => {
    try { localStorage.setItem('dashboard-section-order', JSON.stringify(sectionOrder)) } catch {}
  }, [sectionOrder])

  // Persist collapsed state
  useEffect(() => {
    try { localStorage.setItem('dashboard-collapsed', JSON.stringify(collapsedSections)) } catch {}
  }, [collapsedSections])

  // Persist section sizes
  useEffect(() => {
    try { localStorage.setItem('dashboard-section-sizes', JSON.stringify(sectionSizes)) } catch {}
  }, [sectionSizes])

  const handleRefresh = () => {
    setLastUpdated(new Date())
    window.location.reload()
  }

  const scrollToSection = useCallback((sectionId) => {
    document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMenuOpen(false)
  }, [])

  // --- Collapse / Expand ---
  const toggleCollapse = useCallback((id) => {
    setCollapsedSections(prev => {
      const next = { ...prev, [id]: !prev[id] }
      return next
    })
  }, [])

  // --- Toggle section size ---
  const toggleSize = useCallback((id) => {
    setSectionSizes(prev => {
      const current = prev[id] || 'full'
      return { ...prev, [id]: current === 'full' ? 'half' : 'full' }
    })
  }, [])

  // --- Reset Layout ---
  const resetLayout = useCallback(() => {
    setSectionOrder(DEFAULT_ORDER)
    setCollapsedSections({})
    setSectionSizes({})
    try {
      localStorage.removeItem('dashboard-section-order')
      localStorage.removeItem('dashboard-collapsed')
      localStorage.removeItem('dashboard-section-sizes')
    } catch {}
  }, [])

  // --- Drag-and-drop sensors ---
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  })
  const keyboardSensor = useSensor(KeyboardSensor)
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor)

  // --- Drag handlers ---
  const handleDragStart = useCallback((event) => {
    setActiveDragId(event.active.id)
  }, [])

  const handleDragEnd = useCallback((event) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    setSectionOrder(prev => {
      const oldIndex = prev.indexOf(active.id)
      const newIndex = prev.indexOf(over.id)
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }, [])

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null)
  }, [])

  // Find config for the active drag overlay
  const activeDragConfig = activeDragId
    ? SECTION_BY_ID.get(activeDragId)
    : null

  return (
    <Routes>
      <Route path="/schedule" element={<SchedulePage />} />
      <Route path="*" element={providerName ? (
    <div className={`app app-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className={`app-sidebar${menuOpen ? ' is-open' : ''}`} aria-label="Dashboard navigation">
        <div className="sidebar-brand">
          <img src="/gvmh-logo.png" alt="Golden Valley Memorial Healthcare" className="sidebar-logo" />
          <div className="sidebar-brand-copy">
            <strong>Emergency Department</strong>
            <span>Provider operations</span>
          </div>
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed(value => !value)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '\u203A' : '\u2039'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Dashboard</div>
          {DEFAULT_SECTIONS.map((section) => (
            <button
              type="button"
              key={section.id}
              className="sidebar-nav-btn"
              onClick={() => scrollToSection(section.id)}
              title={sidebarCollapsed ? section.title : undefined}
            >
              <span className="sidebar-nav-icon" aria-hidden="true">{section.icon}</span>
              <span className="sidebar-nav-text">{section.title}</span>
            </button>
          ))}

          {isAdmin ? (
            <>
              <div className="sidebar-nav-label">Admin</div>
              <button type="button" className="sidebar-nav-btn" onClick={() => setShowScheduleControls(true)}>
                <span className="sidebar-nav-icon" aria-hidden="true">{'\u{1F5D3}'}</span>
                <span className="sidebar-nav-text">Schedule controls</span>
              </button>
              <button type="button" className="sidebar-nav-btn" onClick={() => setShowSettings(true)}>
                <span className="sidebar-nav-icon" aria-hidden="true">{'\u2699'}</span>
                <span className="sidebar-nav-text">Dashboard settings</span>
              </button>
            </>
          ) : null}
        </nav>

        <div className="sidebar-tools">
          <button type="button" onClick={() => setShowQR(value => !value)} title="Show dashboard QR code">
            <span aria-hidden="true">{'\u{1F4F1}'}</span><span>QR code</span>
          </button>
          <button type="button" onClick={() => setDarkMode(value => !value)} title={`Use ${darkMode ? 'light' : 'dark'} theme`}>
            <span aria-hidden="true">{darkMode ? '\u2600' : '\u263E'}</span><span>{darkMode ? 'Light' : 'Dark'} theme</span>
          </button>
          <button type="button" onClick={resetLayout} title="Restore the default dashboard layout">
            <span aria-hidden="true">{'\u21BA'}</span><span>Reset layout</span>
          </button>
        </div>

        <div className="sidebar-account">
          <span className="account-status-dot" aria-hidden="true"></span>
          <div className="sidebar-account-copy">
            <strong>{formatProviderName(providerName)}</strong>
            <span>Signed in</span>
          </div>
          <button type="button" className="sidebar-signout" onClick={handleLogout} title="Sign out">Sign out</button>
        </div>
      </aside>

      {menuOpen ? <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close navigation" /> : null}

      <div className="app-workspace">
        <header className="workspace-header">
          <div className="workspace-heading">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMenuOpen(value => !value)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close dashboard navigation' : 'Open dashboard navigation'}
            >
              <span></span><span></span><span></span>
            </button>
            <div>
              <div className="workspace-eyebrow">Golden Valley Memorial Healthcare</div>
              <h1>ED Provider Dashboard</h1>
              <p>Live staffing, paging, and department operations</p>
            </div>
          </div>
          <div className="workspace-actions">
            <div className="workspace-freshness" aria-label={`Last refreshed at ${lastUpdated.toLocaleTimeString()}`}>
              <span className="status-dot" aria-hidden="true"></span>
              <span><strong>Live</strong>{lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
            </div>
            <button type="button" onClick={handleRefresh} className="topbar-btn">{'\u21BB'} Refresh</button>
            <button type="button" onClick={() => setDarkMode(value => !value)} className="topbar-btn topbar-theme-btn" aria-label={`Use ${darkMode ? 'light' : 'dark'} theme`}>
              {darkMode ? '\u2600' : '\u263E'}
            </button>
          </div>

          {showQR ? (
            <div className="qr-dropdown">
              <img src={qrCodeUrl} alt="QR code for this dashboard" className="qr-code" />
              <p className="qr-text">Scan to open dashboard</p>
              <button type="button" onClick={() => setShowQR(false)}>Close</button>
            </div>
          ) : null}
        </header>

        <main className="main-content">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
              <div className="dashboard-grid">
                {sectionOrder.map((sectionId) => {
                  const config = SECTION_BY_ID.get(sectionId)
                  const Component = SECTION_COMPONENTS[sectionId]
                  if (!config || !Component) return null

                  const isCollapsed = !!collapsedSections[sectionId]
                  const canResize = !FULL_WIDTH_ONLY.has(sectionId)
                  const size = canResize ? (sectionSizes[sectionId] || DEFAULT_HALF_WIDTH[sectionId] || 'full') : 'full'
                  const gridClass = size === 'half' ? 'grid-half' : 'grid-full'

                  return (
                    <SortableSection
                      key={sectionId}
                      sectionId={sectionId}
                      config={config}
                      Component={Component}
                      isCollapsed={isCollapsed}
                      canResize={canResize}
                      size={size}
                      gridClass={gridClass}
                      toggleCollapse={toggleCollapse}
                      toggleSize={toggleSize}
                    />
                  )
                })}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeDragConfig ? (
                <div className="drag-overlay-card">
                  <span>{activeDragConfig.icon}</span>
                  <span>{activeDragConfig.title}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </main>

        <footer className="footer">
          <p>GVMH Emergency Department · Provider operations dashboard</p>
          <span>Authorized use only</span>
        </footer>
      </div>

      {showSettings ? <AdminSettings onClose={() => setShowSettings(false)} /> : null}
      {showScheduleControls ? <AdminScheduleControls onClose={() => setShowScheduleControls(false)} /> : null}
    </div>
      ) : (
        <LoginPage onLogin={handleLogin} />
      )} />
    </Routes>
  )
}

export default App
