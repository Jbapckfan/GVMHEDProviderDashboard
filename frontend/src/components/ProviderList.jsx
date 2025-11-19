import './ProviderList.css'

function ProviderList({ providers }) {
  const getStatusBadge = (status) => {
    const statusMap = {
      'on-duty': { label: 'On Duty', class: 'badge-success' },
      'available': { label: 'Available', class: 'badge-info' },
      'off-duty': { label: 'Off Duty', class: 'badge-secondary' },
      'busy': { label: 'Busy', class: 'badge-warning' }
    }
    return statusMap[status] || { label: status, class: 'badge-secondary' }
  }

  const getRoleIcon = (role) => {
    if (role.toLowerCase().includes('physician') || role.toLowerCase().includes('doctor')) return '👨‍⚕️'
    if (role.toLowerCase().includes('nurse')) return '👩‍⚕️'
    if (role.toLowerCase().includes('resident')) return '🩺'
    return '👤'
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">👥 Provider Directory</h2>
      </div>

      <div className="provider-list">
        {providers.map((provider) => {
          const badge = getStatusBadge(provider.status)
          return (
            <div key={provider.id} className="provider-item">
              <div className="provider-avatar">
                {getRoleIcon(provider.role)}
              </div>
              <div className="provider-details">
                <div className="provider-name">{provider.name}</div>
                <div className="provider-role">{provider.role}</div>
                <div className="provider-contact">
                  {provider.phone && (
                    <a href={`tel:${provider.phone}`} className="contact-link">
                      📞 {provider.phone}
                    </a>
                  )}
                </div>
              </div>
              <div className={`provider-status ${badge.class}`}>
                {badge.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProviderList
