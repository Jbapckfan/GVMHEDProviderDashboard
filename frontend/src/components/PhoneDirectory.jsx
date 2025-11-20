import { useState, useEffect } from 'react'
import axios from 'axios'
import './PhoneDirectory.css'

const API_BASE = '/api'

function PhoneDirectory() {
  const [phoneNumbers, setPhoneNumbers] = useState([])
  const [loading, setLoading] = useState(true)

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
      </div>

      <div className="phone-list">
        {phoneNumbers.map((item) => (
          <div key={item.id} className="phone-item">
            <div className="phone-details">
              <span className="phone-label">{item.name}</span>
              {item.extension && (
                <span className="phone-extension">Ext. {item.extension}</span>
              )}
            </div>
            <a href={`tel:${item.number}`} className="phone-number">
              {item.number}
            </a>
          </div>
        ))}

        {phoneNumbers.length === 0 && (
          <div className="empty-state">
            <p>No phone numbers configured yet.</p>
            <p className="empty-hint">Add numbers in the database to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PhoneDirectory
