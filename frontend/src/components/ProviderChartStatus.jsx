import { useState, useEffect } from 'react'
import axios from 'axios'
import './ProviderChartStatus.css'
import { API_BASE } from '../utils/api'
import { useToast } from './Toast'
import ConfirmModal from './ConfirmModal'

const EMPTY_ROW = () => ({ provider_name: '', outstanding_charts: '', delinquent_charts: '' })

function ProviderChartStatus() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingProvider, setEditingProvider] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [bulkRows, setBulkRows] = useState([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()])
  const [importing, setImporting] = useState(false)
  const [scheduleProviders, setScheduleProviders] = useState([])
  const [confirmAction, setConfirmAction] = useState(null)
  const [trends, setTrends] = useState({})
  const [selectedIds, setSelectedIds] = useState(new Set())
  const toast = useToast()

  useEffect(() => {
    fetchProviders()
    fetchScheduleProviders()
    fetchTrends()
  }, [])

  const fetchProviders = async () => {
    try {
      const response = await axios.get(`${API_BASE}/provider-charts`)
      setProviders(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching provider chart status:', error)
      setLoading(false)
    }
  }

  const fetchTrends = async () => {
    try {
      const response = await axios.get(`${API_BASE}/provider-charts/trends`)
      const trendMap = {}
      response.data.forEach(row => {
        const name = row.provider_name.toLowerCase()
        if (row.prev_delinquent !== null && row.prev_delinquent !== undefined) {
          const delinqDiff = row.delinquent_charts - row.prev_delinquent
          const outDiff = row.outstanding_charts - row.prev_outstanding
          trendMap[name] = { delinqDiff, outDiff }
        }
      })
      setTrends(trendMap)
    } catch {
      // Trends are optional — fail silently
    }
  }

  const fetchScheduleProviders = async () => {
    try {
      const now = new Date()
      const monthNames = ['January','February','March','April','May','June',
                          'July','August','September','October','November','December']
      const month = monthNames[now.getMonth()]
      const year = now.getFullYear()
      const response = await axios.get(`${API_BASE}/schedule-data?month=${month}&year=${year}`)
      if (response.data && response.data.calendar) {
        const names = new Set()
        Object.values(response.data.calendar).forEach(day => {
          (day.providers || []).forEach(p => names.add(p))
        })
        setScheduleProviders([...names].sort())
      }
    } catch {
      // Schedule data may not be available — autocomplete just won't populate
    }
  }

  const verifyPassword = async () => {
    const password = prompt('Enter admin password:')
    if (!password) return false

    try {
      const response = await axios.post(`${API_BASE}/admin/verify`, { password })
      if (response.data.success) {
        setIsAuthenticated(true)
        return true
      } else {
        toast.error('Invalid password')
        return false
      }
    } catch (error) {
      toast.error('Invalid password')
      return false
    }
  }

  const handleEdit = async (provider) => {
    if (!isAuthenticated) {
      const verified = await verifyPassword()
      if (!verified) return
    }
    setEditingProvider({ ...provider })
  }

  const handleAddNew = async () => {
    if (!isAuthenticated) {
      const verified = await verifyPassword()
      if (!verified) return
    }
    setEditingProvider({
      id: null,
      provider_name: '',
      outstanding_charts: 0,
      delinquent_charts: 0
    })
  }

  const handleSave = async () => {
    try {
      if (editingProvider.id) {
        await axios.put(`${API_BASE}/admin/provider-charts/${editingProvider.id}`, editingProvider)
        toast.success('Provider chart status updated.')
      } else {
        await axios.post(`${API_BASE}/admin/provider-charts`, editingProvider)
        toast.success('Provider chart status added.')
      }
      setEditingProvider(null)
      fetchProviders()
    } catch (error) {
      toast.error('Failed to save: ' + error.message)
    }
  }

  const handleDelete = () => {
    if (!editingProvider.id) return
    setConfirmAction({
      title: 'Delete Provider',
      message: `Are you sure you want to delete the chart status for "${editingProvider.provider_name}"?`,
      onConfirm: async () => {
        setConfirmAction(null)
        try {
          await axios.delete(`${API_BASE}/admin/provider-charts/${editingProvider.id}`)
          toast.success('Provider chart status deleted.')
          setEditingProvider(null)
          fetchProviders()
        } catch (error) {
          toast.error('Failed to delete: ' + error.message)
        }
      }
    })
  }

  const getStatusClass = (delinquent) => {
    if (delinquent === 0) return 'status-good'
    if (delinquent <= 5) return 'status-warning'
    return 'status-critical'
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === providers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(providers.map(p => p.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!isAuthenticated) {
      const verified = await verifyPassword()
      if (!verified) return
    }
    setConfirmAction({
      title: 'Delete Selected',
      message: `Are you sure you want to delete ${selectedIds.size} provider(s)?`,
      onConfirm: async () => {
        setConfirmAction(null)
        try {
          await axios.post(`${API_BASE}/admin/provider-charts/bulk-delete`, { ids: [...selectedIds] })
          toast.success(`Deleted ${selectedIds.size} provider(s).`)
          setSelectedIds(new Set())
          fetchProviders()
        } catch (error) {
          toast.error('Bulk delete failed: ' + error.message)
        }
      }
    })
  }

  // Bulk import handlers
  const handleOpenBulkImport = async () => {
    if (!isAuthenticated) {
      const verified = await verifyPassword()
      if (!verified) return
    }
    setBulkRows([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()])
    setShowBulkImport(true)
  }

  const handleBulkRowChange = (index, field, value) => {
    const updated = [...bulkRows]
    updated[index] = { ...updated[index], [field]: value }
    setBulkRows(updated)
  }

  const handleAddBulkRow = () => {
    setBulkRows([...bulkRows, EMPTY_ROW()])
  }

  const handleRemoveBulkRow = (index) => {
    if (bulkRows.length <= 1) return
    setBulkRows(bulkRows.filter((_, i) => i !== index))
  }

  const handleBulkImport = async () => {
    // Filter to only filled rows
    const entries = bulkRows
      .filter(row => row.provider_name.trim() !== '')
      .map(row => ({
        provider_name: row.provider_name.trim(),
        outstanding_charts: parseInt(row.outstanding_charts) || 0,
        delinquent_charts: parseInt(row.delinquent_charts) || 0
      }))

    if (entries.length === 0) {
      toast.warning('Please fill in at least one provider name.')
      return
    }

    setImporting(true)
    try {
      const response = await axios.post(`${API_BASE}/admin/charts/bulk-import`, { entries })
      toast.success(`Imported ${response.data.imported} provider(s).`)
      setShowBulkImport(false)
      fetchProviders()
    } catch (error) {
      const msg = error.response?.data?.error || error.message
      toast.error('Bulk import failed: ' + msg)
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return (
      <div className="card provider-chart-status-card">
        <div className="card-header">
          <h2 className="card-title">Provider Chart Status</h2>
        </div>
        <div className="skeleton-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton skeleton-card" style={{ height: '120px' }}></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card provider-chart-status-card">
      <div className="card-header">
        <h2 className="card-title">Provider Chart Status</h2>
        <div className="card-header-actions">
          {selectedIds.size > 0 && (
            <button onClick={handleBulkDelete} className="edit-provider-btn bulk-delete-btn">
              Delete ({selectedIds.size})
            </button>
          )}
          {providers.length > 0 && (
            <button onClick={toggleSelectAll} className="edit-provider-btn select-all-btn">
              {selectedIds.size === providers.length ? 'Deselect' : 'Select All'}
            </button>
          )}
          <button onClick={handleOpenBulkImport} className="edit-provider-btn bulk-import-btn">
            Import
          </button>
          <button onClick={handleAddNew} className="edit-provider-btn">
            + Add Provider
          </button>
        </div>
      </div>

      <div className="provider-chart-grid">
        {providers.map((provider) => {
          const statusClass = getStatusClass(provider.delinquent_charts)
          const trend = trends[provider.provider_name.toLowerCase()]
          const isSelected = selectedIds.has(provider.id)
          return (
            <div key={provider.id} className={`provider-chart-tile ${statusClass} ${isSelected ? 'tile-selected' : ''}`}>
              <div className="provider-chart-header">
                <label className="tile-checkbox">
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(provider.id)} />
                </label>
                <h3 className="provider-name">{provider.provider_name}</h3>
                <button onClick={() => handleEdit(provider)} className="edit-provider-btn-small">
                  Edit
                </button>
              </div>

              <div className="chart-stats">
                <div className="chart-stat">
                  <div className="stat-value">
                    {provider.outstanding_charts}
                    {trend && trend.outDiff !== 0 && (
                      <span className={`trend-arrow ${trend.outDiff > 0 ? 'trend-up' : 'trend-down'}`}>
                        {trend.outDiff > 0 ? '\u2191' : '\u2193'}{Math.abs(trend.outDiff)}
                      </span>
                    )}
                  </div>
                  <div className="stat-label">Outstanding</div>
                </div>

                <div className="chart-stat-divider"></div>

                <div className="chart-stat delinquent">
                  <div className="stat-value">
                    {provider.delinquent_charts}
                    {trend && trend.delinqDiff !== 0 && (
                      <span className={`trend-arrow ${trend.delinqDiff > 0 ? 'trend-up' : 'trend-down'}`}>
                        {trend.delinqDiff > 0 ? '\u2191' : '\u2193'}{Math.abs(trend.delinqDiff)}
                      </span>
                    )}
                  </div>
                  <div className="stat-label">Delinquent (30+ days)</div>
                </div>
              </div>

              {provider.delinquent_charts > 0 && (
                <div className="delinquent-alert">
                  {provider.delinquent_charts} chart{provider.delinquent_charts !== 1 ? 's' : ''} overdue
                </div>
              )}
            </div>
          )
        })}

        {providers.length === 0 && (
          <div className="empty-state">
            <p>No provider chart status to display.</p>
            <p className="empty-hint">Click "Add Provider" to create your first entry.</p>
          </div>
        )}
      </div>

      {editingProvider && (
        <div className="provider-edit-modal" onClick={() => setEditingProvider(null)}>
          <div className="provider-edit-form" onClick={(e) => e.stopPropagation()}>
            <h3>{editingProvider.id ? 'Edit Provider Chart Status' : 'Add New Provider'}</h3>

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Provider Name
            </label>
            <input
              type="text"
              placeholder="e.g., Dr. Smith"
              value={editingProvider.provider_name}
              onChange={(e) => setEditingProvider({ ...editingProvider, provider_name: e.target.value })}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Outstanding Charts
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g., 12"
              value={editingProvider.outstanding_charts}
              onChange={(e) => setEditingProvider({ ...editingProvider, outstanding_charts: parseInt(e.target.value) || 0 })}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Delinquent Charts (30+ days)
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g., 3"
              value={editingProvider.delinquent_charts}
              onChange={(e) => setEditingProvider({ ...editingProvider, delinquent_charts: parseInt(e.target.value) || 0 })}
            />

            <div className="provider-edit-actions">
              {editingProvider.id && (
                <button onClick={handleDelete} className="btn-delete">
                  Delete
                </button>
              )}
              <button onClick={() => setEditingProvider(null)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleSave} className="btn-save">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkImport && (
        <div className="provider-edit-modal" onClick={() => setShowBulkImport(false)}>
          <div className="provider-edit-form bulk-import-form" onClick={(e) => e.stopPropagation()}>
            <h3>Bulk Import Chart Status</h3>
            <p className="bulk-import-hint">
              Enter provider names and chart numbers. Existing providers will be updated.
            </p>

            <datalist id="provider-names-list">
              {scheduleProviders.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>

            <div className="bulk-import-table">
              <div className="bulk-import-header-row">
                <div className="bulk-col-name">Provider Name</div>
                <div className="bulk-col-num">Outstanding</div>
                <div className="bulk-col-num">Delinquent</div>
                <div className="bulk-col-action"></div>
              </div>

              {bulkRows.map((row, index) => (
                <div key={index} className="bulk-import-row">
                  <div className="bulk-col-name">
                    <input
                      type="text"
                      list="provider-names-list"
                      placeholder="Provider name"
                      value={row.provider_name}
                      onChange={(e) => handleBulkRowChange(index, 'provider_name', e.target.value)}
                    />
                  </div>
                  <div className="bulk-col-num">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={row.outstanding_charts}
                      onChange={(e) => handleBulkRowChange(index, 'outstanding_charts', e.target.value)}
                    />
                  </div>
                  <div className="bulk-col-num">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={row.delinquent_charts}
                      onChange={(e) => handleBulkRowChange(index, 'delinquent_charts', e.target.value)}
                    />
                  </div>
                  <div className="bulk-col-action">
                    <button
                      onClick={() => handleRemoveBulkRow(index)}
                      className="bulk-remove-btn"
                      disabled={bulkRows.length <= 1}
                      title="Remove row"
                    >
                      x
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleAddBulkRow} className="bulk-add-row-btn">
              + Add Row
            </button>

            <div className="provider-edit-actions">
              <button onClick={() => setShowBulkImport(false)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleBulkImport} className="btn-save" disabled={importing}>
                {importing ? 'Importing...' : 'Import All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}

export default ProviderChartStatus
