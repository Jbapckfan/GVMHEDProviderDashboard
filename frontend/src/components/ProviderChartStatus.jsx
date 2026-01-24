import { useState, useEffect } from 'react'
import axios from 'axios'
import './ProviderChartStatus.css'
import { API_BASE } from '../utils/api'

function ProviderChartStatus() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingProvider, setEditingProvider] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    fetchProviders()
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

  const verifyPassword = async () => {
    const password = prompt('Enter admin password:')
    if (!password) return false

    try {
      const response = await axios.post(`${API_BASE}/admin/verify`, { password })
      if (response.data.success) {
        setIsAuthenticated(true)
        return true
      } else {
        alert('Invalid password')
        return false
      }
    } catch (error) {
      alert('Invalid password')
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
        // Update existing
        await axios.put(`${API_BASE}/admin/provider-charts/${editingProvider.id}`, editingProvider)
        alert('Provider chart status updated successfully!')
      } else {
        // Add new
        await axios.post(`${API_BASE}/admin/provider-charts`, editingProvider)
        alert('Provider chart status added successfully!')
      }
      setEditingProvider(null)
      fetchProviders()
    } catch (error) {
      alert('Failed to save provider chart status: ' + error.message)
    }
  }

  const handleDelete = async () => {
    if (!editingProvider.id) return

    if (!window.confirm('Are you sure you want to delete this provider chart status?')) {
      return
    }

    try {
      await axios.delete(`${API_BASE}/admin/provider-charts/${editingProvider.id}`)
      alert('Provider chart status deleted successfully!')
      setEditingProvider(null)
      fetchProviders()
    } catch (error) {
      alert('Failed to delete provider chart status: ' + error.message)
    }
  }

  const getStatusClass = (delinquent) => {
    if (delinquent === 0) return 'status-good'
    if (delinquent <= 5) return 'status-warning'
    return 'status-critical'
  }

  if (loading) {
    return (
      <div className="card provider-chart-status-card">
        <div className="card-header">
          <h2 className="card-title">📊 Provider Chart Status</h2>
        </div>
        <div className="loading-small">Loading...</div>
      </div>
    )
  }

  return (
    <div className="card provider-chart-status-card">
      <div className="card-header">
        <h2 className="card-title">📊 Provider Chart Status</h2>
        <button onClick={handleAddNew} className="edit-provider-btn">
          ➕ Add Provider
        </button>
      </div>

      <div className="provider-chart-grid">
        {providers.map((provider) => {
          const statusClass = getStatusClass(provider.delinquent_charts)
          return (
            <div key={provider.id} className={`provider-chart-tile ${statusClass}`}>
              <div className="provider-chart-header">
                <h3 className="provider-name">{provider.provider_name}</h3>
                <button onClick={() => handleEdit(provider)} className="edit-provider-btn-small">
                  ✏️
                </button>
              </div>

              <div className="chart-stats">
                <div className="chart-stat">
                  <div className="stat-value">{provider.outstanding_charts}</div>
                  <div className="stat-label">Outstanding</div>
                </div>

                <div className="chart-stat-divider"></div>

                <div className="chart-stat delinquent">
                  <div className="stat-value">{provider.delinquent_charts}</div>
                  <div className="stat-label">Delinquent (30+ days)</div>
                </div>
              </div>

              {provider.delinquent_charts > 0 && (
                <div className="delinquent-alert">
                  ⚠️ {provider.delinquent_charts} chart{provider.delinquent_charts !== 1 ? 's' : ''} overdue
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
                  🗑️ Delete
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
    </div>
  )
}

export default ProviderChartStatus
