import './QuickLinksCard.css'

function QuickLinksCard({ links }) {
  const getCategoryIcon = (category) => {
    const icons = {
      'Reference': '📚',
      'Clinical Tools': '🧰',
      'Internal': '🔐',
      'External': '🌐'
    }
    return icons[category] || '🔗'
  }

  const groupedLinks = links.reduce((acc, link) => {
    const category = link.category || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push(link)
    return acc
  }, {})

  return (
    <div className="card quick-links-card">
      <div className="card-header">
        <h2 className="card-title">🔗 Quick Links</h2>
      </div>

      <div className="links-container">
        {Object.entries(groupedLinks).map(([category, categoryLinks]) => (
          <div key={category} className="link-group">
            <div className="link-group-header">
              <span className="link-group-icon">{getCategoryIcon(category)}</span>
              <span className="link-group-title">{category}</span>
            </div>
            <div className="link-list">
              {categoryLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target={link.url.startsWith('http') ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="link-item"
                >
                  <span className="link-title">{link.title}</span>
                  <span className="link-arrow">→</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default QuickLinksCard
