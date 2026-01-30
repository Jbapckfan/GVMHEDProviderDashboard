import { useState, useEffect } from 'react'
import axios from 'axios'
import './KPIGoals.css'
import { API_BASE } from '../utils/api'
import { useToast } from './Toast'
import ConfirmModal from './ConfirmModal'

function KPIGoals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingGoal, setEditingGoal] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const toast = useToast()

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
        toast.error('Invalid password')
        return false
      }
    } catch (error) {
      toast.error('Invalid password')
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
        toast.success('KPI goal updated.')
      } else {
        await axios.post(`${API_BASE}/admin/kpi-goals`, editingGoal)
        toast.success('KPI goal added.')
      }
      setEditingGoal(null)
      fetchGoals()
    } catch (error) {
      toast.error('Failed to save KPI goal: ' + error.message)
    }
  }

  const handleDelete = () => {
    if (!editingGoal.id) return
    setConfirmAction({
      title: 'Delete KPI Goal',
      message: `Are you sure you want to delete "${editingGoal.goal_name}"?`,
      onConfirm: async () => {
        setConfirmAction(null)
        try {
          await axios.delete(`${API_BASE}/admin/kpi-goals/${editingGoal.id}`)
          toast.success('KPI goal deleted.')
          setEditingGoal(null)
          fetchGoals()
        } catch (error) {
          toast.error('Failed to delete KPI goal: ' + error.message)
        }
      }
    })
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

  const getDeadlineInfo = (deadline) => {
    if (!deadline) return null
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const dl = new Date(deadline + 'T00:00:00')
    const diffMs = dl - now
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { label: 'Overdue', className: 'deadline-overdue' }
    if (diffDays === 0) return { label: 'Due today', className: 'deadline-today' }
    if (diffDays <= 7) return { label: `${diffDays}d left`, className: 'deadline-soon' }
    if (diffDays <= 30) return { label: `${diffDays}d left`, className: 'deadline-upcoming' }
    return { label: `${diffDays}d left`, className: 'deadline-normal' }
  }

  if (loading) {
    return (
      <div className="card kpi-goals-card">
        <div className="card-header">
          <h2 className="card-title">KPI Goals & Targets</h2>
        </div>
        <div className="skeleton-grid">
          {[1, 2].map(i => (
            <div key={i} className="skeleton skeleton-card" style={{ height: '140px' }}></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card kpi-goals-card">
      <div className="card-header">
        <h2 className="card-title">KPI Goals & Targets</h2>
        <button onClick={handleAddNew} className="edit-goal-btn">
          + Add Goal
        </button>
      </div>

      <div className="goals-grid">
        {goals.map((goal) => {
          const percentage = getProgressPercentage(goal.current_value, goal.target_value)
          const statusClass = getStatusClass(percentage)
          const deadlineInfo = getDeadlineInfo(goal.deadline)

          return (
            <div key={goal.id} className={`goal-card ${statusClass}`}>
              <div className="goal-header">
                <h3 className="goal-name">{goal.goal_name}</h3>
                <button onClick={() => handleEdit(goal)} className="edit-goal-btn-small">
                  Edit
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
                <div className="goal-deadline-row">
                  <span className="goal-deadline-date">
                    Deadline: {new Date(goal.deadline + 'T00:00:00').toLocaleDateString()}
                  </span>
                  {deadlineInfo && (
                    <span className={`deadline-badge ${deadlineInfo.className}`}>
                      {deadlineInfo.label}
                    </span>
                  )}
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
                  Delete
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

export default KPIGoals
