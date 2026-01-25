import { useState, useEffect } from 'react'
import axios from 'axios'
import './PhoneDirectory.css'
import { API_BASE } from '../utils/api'

function PhoneDirectory() {
  const [phoneNumbers, setPhoneNumbers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPhone, setEditingPhone] = useState(null)
  const [draggedItem, setDraggedItem] = useState(null)

  useEffect(() => {
    fetchPhoneNumbers()
  }, [])

  const fetchPhoneNumbers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/phone-directory`)
      setPhoneNumbers(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching phone numbers:', error)
      setLoading(false)
    }
  }

  const handleEdit = (phone) => {
    setEditingPhone({ ...phone })
  }

  const handleAddNew = () => {
    setEditingPhone({
      id: null,
      name: '',
      number: '',
      extension: '',
      department: '',
      display_order: phoneNumbers.length + 1
    })
  }

  const handleSave = async () => {
    try {
      if (editingPhone.id) {
        // Update existing
        await axios.put(`${API_BASE}/admin/phone-directory/${editingPhone.id}`, editingPhone)
        alert('Phone number updated successfully!')
      } else {
        // Add new
        await axios.post(`${API_BASE}/admin/phone-directory`, editingPhone)
        alert('Phone number added successfully!')
      }
      setEditingPhone(null)
      fetchPhoneNumbers()
    } catch (error) {
      alert('Failed to save phone number: ' + error.message)
    }
  }

  const handleDelete = async () => {
    if (!editingPhone.id) return

    if (!window.confirm('Are you sure you want to delete this phone number?')) {
      return
    }

    try {
      await axios.delete(`${API_BASE}/admin/phone-directory/${editingPhone.id}`)
      alert('Phone number deleted successfully!')
      setEditingPhone(null)
      fetchPhoneNumbers()
    } catch (error) {
      alert('Failed to delete phone number: ' + error.message)
    }
  }

  const handleDragStart = (e, item) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, targetItem) => {
    e.preventDefault()

    if (!draggedItem || draggedItem.id === targetItem.id) {
      setDraggedItem(null)
      return
    }

    // Create new array with updated order
    const items = [...phoneNumbers]
    const draggedIndex = items.findIndex(item => item.id === draggedItem.id)
    const targetIndex = items.findIndex(item => item.id === targetItem.id)

    // Remove dragged item and insert at target position
    items.splice(draggedIndex, 1)
    items.splice(targetIndex, 0, draggedItem)

    // Update display_order for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index + 1
    }))

    setPhoneNumbers(updatedItems)
    setDraggedItem(null)

    // Save new order to backend
    try {
      for (const item of updatedItems) {
        await axios.put(`${API_BASE}/admin/phone-directory/${item.id}`, item)
      }
    } catch (error) {
      console.error('Failed to save order:', error)
      fetchPhoneNumbers() // Reload on error
    }
  }

  if (loading) {
    return (
      <div className="card phone-directory-card">
        <div className="card-header">
          <h2 className="card-title">📞 Quick Reference Numbers</h2>
        </div>
        <div className="loading-small">Loading...</div>
      </div>
    )
  }

  return (
    <div className="card phone-directory-card">
      <div className="card-header">
        <h2 className="card-title">📞 Quick Reference Numbers</h2>
        <button onClick={handleAddNew} className="edit-phone-btn">
          ➕ Add New
        </button>
      </div>

      <div className="phone-list">
        {phoneNumbers.map((item) => (
          <div
            key={item.id}
            className={`phone-item ${draggedItem?.id === item.id ? 'dragging' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, item)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
              <span className="drag-handle" style={{ cursor: 'grab', fontSize: '1.25rem', color: 'var(--gray-500)' }}>
                ☰
              </span>
              <div className="phone-details">
                <span className="phone-label">{item.name}</span>
                {item.extension && (
                  <span className="phone-extension">Ext. {item.extension}</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <a href={`tel:${item.number}`} className="phone-number">
                {item.number}
              </a>
              <button onClick={() => handleEdit(item)} className="edit-phone-btn" style={{ margin: 0 }}>
                ✏️
              </button>
            </div>
          </div>
        ))}

        {phoneNumbers.length === 0 && (
          <div className="empty-state">
            <p>No phone numbers configured yet.</p>
            <p className="empty-hint">Click "Add New" to add your first number.</p>
          </div>
        )}
      </div>

      {editingPhone && (
        <div className="phone-edit-modal" onClick={() => setEditingPhone(null)}>
          <div className="phone-edit-form" onClick={(e) => e.stopPropagation()}>
            <h3>{editingPhone.id ? 'Edit Phone Number' : 'Add New Phone Number'}</h3>

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Name
            </label>
            <input
              type="text"
              placeholder="e.g., Cardiology Consult"
              value={editingPhone.name}
              onChange={(e) => setEditingPhone({ ...editingPhone, name: e.target.value })}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Phone Number
            </label>
            <input
              type="text"
              placeholder="e.g., 555-1234"
              value={editingPhone.number}
              onChange={(e) => setEditingPhone({ ...editingPhone, number: e.target.value })}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Extension (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., 1234"
              value={editingPhone.extension}
              onChange={(e) => setEditingPhone({ ...editingPhone, extension: e.target.value })}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Department
            </label>
            <input
              type="text"
              placeholder="e.g., Cardiology"
              value={editingPhone.department}
              onChange={(e) => setEditingPhone({ ...editingPhone, department: e.target.value })}
            />

            <div className="phone-edit-actions">
              {editingPhone.id && (
                <button onClick={handleDelete} className="btn-delete">
                  🗑️ Delete
                </button>
              )}
              <button onClick={() => setEditingPhone(null)} className="btn-cancel">
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

export default PhoneDirectory
