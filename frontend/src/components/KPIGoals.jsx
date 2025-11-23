import { useState, useEffect } from 'react'
import axios from 'axios'
import './KPIGoals.css'

const API_BASE = '/api'

function KPIGoals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingGoal, setEditingGoal] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const response = await axios.get(`${API_BASE}/kpi-goals`)
      setGoals(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching KPI goals:', error)
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

  const handleEdit = async (goal) => {
    if (!isAuthenticated) {
      const verified = await verifyPassword()
      if (!verified) return
    }
    setEditingGoal({ ...goal })
  }

  const handleAddNew = async () => {
    if (!isAuthenticated) {
      const verified = await verifyPassword()
      if (!verified) return
    }
    setEditingGoal({
      id: null,
      goal_name: '',
      target_value: 0,
      current_value: 0,
      unit: '',
      deadline: ''
    })
  }

  const handleSave = async () => {
    try {
      if (editingGoal.id) {
        await axios.put(`${API_BASE}/admin/kpi-goals/${editingGoal.id}`, editingGoal)
        alert('KPI goal updated successfully!')
      } else {
        await axios.post(`${API_BASE}/admin/kpi-goals`, editingGoal)
        alert('KPI goal added successfully!')
      }
      setEditingGoal(null)
      fetchGoals()
    } catch (error) {
      alert('Failed to save KPI goal: ' + error.message)
    }
  }

  const handleDelete = async () => {
    if (!editingGoal.id) return

    if (!window.confirm('Are you sure you want to delete this KPI goal?')) {
      return
    }

    try {
      await axios.delete(`${API_BASE}/admin/kpi-goals/${editingGoal.id}`)
      alert('KPI goal deleted successfully!')
      setEditingGoal(null)
      fetchGoals()
    } catch (error) {
      alert('Failed to delete KPI goal: ' + error.message)
    }
  }

  const getProgressPercentage = (current, target) => {
    if (!target) return 0
    return Math.min(Math.round((current / target) * 100), 100)
  }

  const getStatusClass = (percentage) => {
    if (percentage >= 90) return 'status-excellent'
    if (percentage >= 70) return 'status-good'
    if (percentage >= 50) return 'status-warning'
    return 'status-critical'
  }

  if (loading) {
    return (
      <div className="card kpi-goals-card">
        <div className="card-header">
          <h2 className="card-title">🎯 KPI Goals & Targets</h2>
        </div>
        <div className="loading-small">Loading...</div>
      </div>
    )
  }

  return (
    <div className="card kpi-goals-card">
      <div className="card-header">
        <h2 className="card-title">🎯 KPI Goals & Targets</h2>
        <button onClick={handleAddNew} className="edit-goal-btn">
          ➕ Add Goal
        </button>
      </div>

      <div className="goals-grid">
        {goals.map((goal) => {
          const percentage = getProgressPercentage(goal.current_value, goal.target_value)
          const statusClass = getStatusClass(percentage)

          return (
            <div key={goal.id} className={`goal-card ${statusClass}`}>
              <div className="goal-header">
                <h3 className="goal-name">{goal.goal_name}</h3>
                <button onClick={() => handleEdit(goal)} className="edit-goal-btn-small">
                  ✏️
                </button>
              </div>

              <div className="goal-values">
                <div className="value-current">
                  <span className="value-number">{goal.current_value}</span>
                  <span className="value-unit">{goal.unit}</span>
                </div>
                <div className="value-divider">/</div>
                <div className="value-target">
                  <span className="value-number">{goal.target_value}</span>
                  <span className="value-label">target</span>
                </div>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${percentage}%` }}
                >
                  <span className="progress-text">{percentage}%</span>
                </div>
              </div>

              {goal.deadline && (
                <div className="goal-deadline">
                  📅 Deadline: {new Date(goal.deadline).toLocaleDateString()}
                </div>
              )}
            </div>
          )
        })}

        {goals.length === 0 && (
          <div className="empty-state">
            <p>No KPI goals set yet.</p>
            <p className="empty-hint">Click "Add Goal" to create your first KPI target.</p>
          </div>
        )}
      </div>

      {editingGoal && (
        <div className="goal-edit-modal" onClick={() => setEditingGoal(null)}>
          <div className="goal-edit-form" onClick={(e) => e.stopPropagation()}>
            <h3>{editingGoal.id ? 'Edit KPI Goal' : 'Add New KPI Goal'}</h3>

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Goal Name
            </label>
            <input
              type="text"
              placeholder="e.g., Door-to-Doctor Time"
              value={editingGoal.goal_name}
              onChange={(e) => setEditingGoal({ ...editingGoal, goal_name: e.target.value })}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Current Value
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g., 28"
              value={editingGoal.current_value}
              onChange={(e) => setEditingGoal({ ...editingGoal, current_value: parseFloat(e.target.value) || 0 })}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Target Value
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g., 30"
              value={editingGoal.target_value}
              onChange={(e) => setEditingGoal({ ...editingGoal, target_value: parseFloat(e.target.value) || 0 })}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Unit
            </label>
            <input
              type="text"
              placeholder="e.g., minutes, %, patients/day"
              value={editingGoal.unit}
              onChange={(e) => setEditingGoal({ ...editingGoal, unit: e.target.value })}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Deadline (optional)
            </label>
            <input
              type="date"
              value={editingGoal.deadline || ''}
              onChange={(e) => setEditingGoal({ ...editingGoal, deadline: e.target.value })}
            />

            <div className="goal-edit-actions">
              {editingGoal.id && (
                <button onClick={handleDelete} className="btn-delete">
                  🗑️ Delete
                </button>
              )}
              <button onClick={() => setEditingGoal(null)} className="btn-cancel">
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

export default KPIGoals
