const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
db.initializeDatabase();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all providers
app.get('/api/providers', (req, res) => {
  try {
    const providers = db.getProviders();
    res.json(providers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get shifts for a specific date
app.get('/api/shifts', (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const shifts = db.getShifts(date);
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get KPI metrics
app.get('/api/kpi-metrics', (req, res) => {
  try {
    const metrics = db.getKPIMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update KPI metric
app.post('/api/kpi-metrics', (req, res) => {
  try {
    const result = db.updateKPIMetric(req.body);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get quick links
app.get('/api/quick-links', (req, res) => {
  try {
    const links = db.getQuickLinks();
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ED Dashboard Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
