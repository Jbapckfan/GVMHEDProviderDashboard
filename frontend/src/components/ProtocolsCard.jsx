import { useState } from 'react'
import './ProtocolsCard.css'

function ProtocolsCard({ protocols }) {
  const [selectedProtocol, setSelectedProtocol] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const getCategoryIcon = (category) => {
    const icons = {
      'Cardiac': '❤️',
      'Neuro': '🧠',
      'Trauma': '🚑',
      'Infectious Disease': '🦠',
      'Respiratory': '🫁',
      'GI': '🫃'
    }
    return icons[category] || '📋'
  }

  const getCategoryColor = (category) => {
    const colors = {
      'Cardiac': 'cat-cardiac',
      'Neuro': 'cat-neuro',
      'Trauma': 'cat-trauma',
      'Infectious Disease': 'cat-infectious',
      'Respiratory': 'cat-respiratory',
      'GI': 'cat-gi'
    }
    return colors[category] || 'cat-default'
  }

  const filteredProtocols = protocols.filter(protocol =>
    protocol.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    protocol.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="card protocols-card">
      <div className="card-header">
        <h2 className="card-title">📋 Quick Protocols</h2>
        <input
          type="text"
          placeholder="Search protocols..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="protocols-grid">
        {filteredProtocols.map((protocol) => (
          <div
            key={protocol.id}
            className={`protocol-card ${getCategoryColor(protocol.category)}`}
            onClick={() => setSelectedProtocol(protocol)}
          >
            <div className="protocol-icon">
              {getCategoryIcon(protocol.category)}
            </div>
            <div className="protocol-content">
              <div className="protocol-title">{protocol.title}</div>
              <div className="protocol-category">{protocol.category}</div>
            </div>
            <div className="protocol-arrow">→</div>
          </div>
        ))}
      </div>

      {selectedProtocol && (
        <div className="modal-overlay" onClick={() => setSelectedProtocol(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedProtocol.title}</h3>
              <button
                className="close-btn"
                onClick={() => setSelectedProtocol(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="protocol-meta">
                <span className={`category-badge ${getCategoryColor(selectedProtocol.category)}`}>
                  {getCategoryIcon(selectedProtocol.category)} {selectedProtocol.category}
                </span>
              </div>
              {selectedProtocol.description && (
                <p className="protocol-description">{selectedProtocol.description}</p>
              )}
              <div className="protocol-steps">
                <h4>Steps:</h4>
                <ol>
                  {JSON.parse(selectedProtocol.steps).map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProtocolsCard
