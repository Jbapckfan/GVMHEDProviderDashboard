import { useState } from 'react'
import './KPIMetrics.css'

function KPIMetrics({ metrics }) {
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Group metrics by category
  const categories = ['All', ...new Set(metrics.map(m => m.category))]

  const filteredMetrics = selectedCategory === 'All'
    ? metrics
    : metrics.filter(m => m.category === selectedCategory)

  // Group filtered metrics by category for display
  const groupedMetrics = filteredMetrics.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = []
    acc[metric.category].push(metric)
    return acc
  }, {})

  const getMetricStatus = (metric) => {
    if (!metric.target_value) return 'neutral'

    // For metrics where lower is better
    const lowerIsBetter = [
      'Average Length of Stay',
      'Door-to-Doctor Time',
      'Left Without Being Seen',
      '72-Hour Return Rate',
      'Average Wait Time',
      'Cost Per Visit'
    ]

    const isLowerBetter = lowerIsBetter.includes(metric.metric_name)

    if (isLowerBetter) {
      if (metric.metric_value <= metric.target_value) return 'good'
      if (metric.metric_value <= metric.target_value * 1.1) return 'warning'
      return 'critical'
    } else {
      if (metric.metric_value >= metric.target_value) return 'good'
      if (metric.metric_value >= metric.target_value * 0.9) return 'warning'
      return 'critical'
    }
  }

  const getCategoryIcon = (category) => {
    const icons = {
      'Patient Flow': '🚶',
      'Quality': '⭐',
      'Operational': '⚙️',
      'Financial': '💰'
    }
    return icons[category] || '📊'
  }

  const formatValue = (value, unit) => {
    if (unit === 'percent') return `${value}%`
    if (unit === 'dollars') return `$${value}`
    if (unit === 'out of 5') return `${value}/5`
    return `${value} ${unit}`
  }

  return (
    <div className="card kpi-metrics-card">
      <div className="card-header">
        <h2 className="card-title">📊 Department KPI Metrics</h2>
        <div className="category-filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="kpi-container">
        {Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
          <div key={category} className="kpi-category-section">
            <div className="category-header">
              <span className="category-icon">{getCategoryIcon(category)}</span>
              <h3 className="category-name">{category}</h3>
            </div>

            <div className="metrics-grid">
              {categoryMetrics.map((metric) => {
                const status = getMetricStatus(metric)
                return (
                  <div key={metric.id} className={`metric-card status-${status}`}>
                    <div className="metric-header">
                      <span className="metric-name">{metric.metric_name}</span>
                      <span className={`status-indicator status-${status}`}>
                        {status === 'good' && '✓'}
                        {status === 'warning' && '!'}
                        {status === 'critical' && '✗'}
                      </span>
                    </div>

                    <div className="metric-value">
                      {formatValue(metric.metric_value, metric.unit)}
                    </div>

                    {metric.target_value && (
                      <div className="metric-target">
                        Target: {formatValue(metric.target_value, metric.unit)}
                      </div>
                    )}

                    <div className="metric-progress">
                      <div
                        className={`progress-bar status-${status}`}
                        style={{
                          width: `${Math.min(100, (metric.metric_value / metric.target_value) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default KPIMetrics
